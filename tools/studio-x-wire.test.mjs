// Studio X wiring: the three "start another way" boxes (describe it, use my own material, recipes) in jsdom, plus the
// saved-recipes store. Real behavior only: the boxes run the real wave-1 modules and hand back activities that pass
// normalizeActivity + validateActivity; nothing may touch the network.
//   node --test tools/studio-x-wire.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import JSZip from "jszip";
import { MC_TEXT, makeDocx, VOCAB_REQUEST } from "./studio-x-wire-helpers.mjs";

const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
  url: "http://localhost/access-practice-lab/activity-studio",
  pretendToBeVisual: true,
});
const w = dom.window;
for (const k of ["window", "document", "Node", "Event", "HTMLElement"])
  Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true });
const noNetwork = () => {
  throw new Error("network use is not allowed");
};
globalThis.fetch = noNetwork;
const wireNetwork = [];
w.fetch = (...a) => (wireNetwork.push(a), noNetwork());

const { normalizeActivity } = await import("../access-practice-lab/src/studio/core/schema.js");
const { validateActivity } = await import("../access-practice-lab/src/studio/core/validate.js");
const { describeBox, composeRequest } = await import(
  "../access-practice-lab/src/studio/editor/describe-box.js"
);
const { importBox, countsText } = await import(
  "../access-practice-lab/src/studio/editor/import-box.js"
);
const { recipesBox, saveRecipeBox } = await import(
  "../access-practice-lab/src/studio/editor/recipes-ui.js"
);
const store = await import("../access-practice-lab/src/studio/editor/recipes-store.js");
const { builtinRecipes, recipeFromActivity } = await import(
  "../access-practice-lab/src/studio/x/recipes.js"
);

const EN = (en) => en;
const ES = (_en, es) => es;
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const memory = () => {
  const m = new Map();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => (m.set(k, v), true),
    remove: (k) => m.delete(k),
    m,
  };
};
const sound = (activity) => {
  assert.ok(activity, "an activity");
  assert.deepEqual(normalizeActivity(activity), activity, "fixed point of normalizeActivity");
  const check = validateActivity(activity);
  assert.equal(check.ok, true, JSON.stringify(check.errors));
};
const mount = (el) => {
  document.body.replaceChildren(el);
  return el;
};
const type = (el, value) => {
  el.value = value;
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
};
const byText = (root, sel, re) =>
  [...root.querySelectorAll(sel)].find((e) => re.test(e.textContent));

// ── saved recipes ───────────────────────────────────────────────────────────

test("recipes store: save, list, replace, delete, under a versioned key", () => {
  const s = memory();
  assert.deepEqual(store.listRecipes(s), []);
  const [first] = builtinRecipes();
  const a = store.saveRecipe({ ...first.recipe, name: "Mine" }, s);
  assert.equal(a.ok, true);
  assert.match(store.RECIPES_KEY, /^accessPracticeLab:v1:studio-recipes$/);
  assert.equal(JSON.parse(s.get(store.RECIPES_KEY)).v, 1);
  assert.equal(store.listRecipes(s).length, 1);
  assert.equal(store.listRecipes(s)[0].name, "Mine");
  // the same structure replaces itself instead of piling up
  store.saveRecipe({ ...first.recipe, name: "Renamed" }, s);
  assert.equal(store.listRecipes(s).length, 1);
  assert.equal(store.listRecipes(s)[0].name, "Renamed");
  assert.equal(store.deleteRecipe(first.recipe.id, s).length, 0);
});

test("recipes store: the 21st recipe is refused, never an old one dropped", () => {
  const s = memory();
  const all = builtinRecipes();
  let n = 0;
  for (let i = 0; i < store.MAX_RECIPES; i++) {
    const base = all[i % all.length].recipe;
    const steps = [...base.steps, ...Array.from({ length: i % 7 }, () => ({ block: "text" }))];
    const res = store.saveRecipe({ ...base, id: `r${i}x`, steps, name: `R${i}` }, s);
    if (res.ok) n++;
  }
  assert.equal(n, store.MAX_RECIPES);
  const more = store.saveRecipe({ ...all[0].recipe, id: "rextra", name: "Extra" }, s);
  assert.equal(more.ok, false);
  assert.equal(more.reason, "full");
  assert.equal(store.listRecipes(s).length, store.MAX_RECIPES);
  assert.ok(
    store.listRecipes(s).some((r) => r.name === "R0"),
    "the oldest is still there",
  );
});

test("recipes store: corrupt, foreign and hand-edited values are normalized or ignored", () => {
  const s = memory();
  s.set(store.RECIPES_KEY, "{not json");
  assert.deepEqual(store.listRecipes(s), []);
  s.set(store.RECIPES_KEY, JSON.stringify({ v: 2, recipes: [builtinRecipes()[0].recipe] }));
  assert.deepEqual(store.listRecipes(s), [], "an unknown version is not read");
  s.set(
    store.RECIPES_KEY,
    JSON.stringify({
      v: 1,
      recipes: [
        null,
        { schema: "other/9", name: "x" },
        {
          schema: "lp-recipe/1",
          name: "Evil <img src=x onerror=alert(1)>",
          kind: "worksheet",
          template: "guided",
          steps: [
            { block: "question", format: "choice", count: 3, prompt: "SECRET ANSWER" },
            { block: "nope" },
          ],
          answer: "42",
        },
      ],
    }),
  );
  const list = store.listRecipes(s);
  assert.equal(list.length, 1);
  assert.deepEqual(Object.keys(list[0]).sort(), [
    "id",
    "kind",
    "name",
    "schema",
    "steps",
    "supports",
    "template",
    "tier",
  ]);
  assert.ok(!JSON.stringify(list[0]).includes("SECRET"), "no content survives normalizeRecipe");
  assert.equal(list[0].steps.length, 1);
});

test("recipes store: a device that refuses the write says so", () => {
  const s = { ...memory(), set: () => false };
  const res = store.saveRecipe(builtinRecipes()[0].recipe, s);
  assert.equal(res.ok, false);
  assert.equal(res.reason, "storage");
});

// ── describe it ─────────────────────────────────────────────────────────────

test("composeRequest adds answers to the request line and keeps pasted content below", () => {
  assert.equal(
    composeRequest({
      request: "Make something about food chains",
      content: "a - b",
      extras: ["Make a game."],
    }),
    "Make something about food chains Make a game.\n\na - b",
  );
  assert.equal(composeRequest({ request: "", content: "", extras: [] }), "");
});

test("describe: pasted vocabulary gives a plan, then a valid worksheet, with no network", async () => {
  let built = null;
  const box = mount(describeBox({ S: EN, onBuilt: (r) => (built = r), newId: () => "sfixed0001" }));
  const area = box.querySelector("textarea");
  type(area, VOCAB_REQUEST);
  box.querySelector('[data-act="plan"]').click();
  const plan = box.querySelector(".xw-plan");
  assert.match(plan.textContent, /I will make a worksheet about ecosystems/);
  assert.ok(!/\bnull\b|\[object/.test(plan.textContent), "no stray null or object text");
  assert.match(plan.textContent, /Type\s*a worksheet/);
  assert.match(plan.textContent, /sentence frames/);
  assert.ok(plan.querySelectorAll(".xw-choice").length <= 3);
  assert.equal(built, null, "nothing is made before Build");
  box.querySelector('[data-act="build"]').click();
  assert.ok(built, "built");
  sound(built.activity);
  assert.equal(built.activity.kind, "worksheet");
  assert.ok(Array.isArray(built.notes));
  assert.equal(wireNetwork.length, 0);
});

test("describe: changing the text after the plan clears it, so a stale plan can never be built", () => {
  let built = null;
  const box = mount(describeBox({ S: EN, onBuilt: (r) => (built = r) }));
  type(box.querySelector("textarea"), VOCAB_REQUEST);
  box.querySelector('[data-act="plan"]').click();
  assert.ok(box.querySelector('[data-act="build"]'));
  type(box.querySelector("textarea"), `${VOCAB_REQUEST}\nextra - another word`);
  assert.equal(box.querySelector('[data-act="build"]'), null);
  assert.equal(built, null);
});

test("describe: a request that cannot be met shows the honest message and choices, never a fake result", () => {
  let built = null;
  const box = mount(describeBox({ S: EN, onBuilt: (r) => (built = r) }));
  type(box.querySelector("textarea"), "Make me a video about volcanoes");
  box.querySelector('[data-act="plan"]').click();
  const plan = box.querySelector(".xw-plan");
  assert.match(plan.textContent, /cannot make a video/i);
  assert.equal(box.querySelector('[data-act="build"]'), null, "no build button");
  const groups = plan.querySelectorAll(".xw-choice");
  assert.ok(groups.length >= 1 && groups.length <= 3);
  assert.equal(built, null);
});

test("describe: no content -> the source question; answering 'paste' opens the content box", () => {
  let built = null;
  const box = mount(describeBox({ S: EN, onBuilt: (r) => (built = r) }));
  type(
    box.querySelector("textarea"),
    "Create a worksheet about ecosystems with visual vocabulary and sentence frames",
  );
  box.querySelector('[data-act="plan"]').click();
  const plan = box.querySelector(".xw-plan");
  assert.match(plan.textContent, /cannot build a worksheet about ecosystems yet/);
  assert.equal(box.querySelector('[data-act="build"]'), null);
  const more = box.querySelector("details.xw-more");
  assert.equal(more.open, false);
  plan.querySelector('[data-opt="paste-content"]').click();
  assert.equal(more.open, true);
  // now the teacher adds words and updates the plan
  type(
    more.querySelector("textarea"),
    "habitat - the place where an animal lives\nproducer - makes its own food\nconsumer - eats other living things\ndecomposer - breaks down dead matter",
  );
  box.querySelector('[data-act="plan"]').click();
  assert.ok(box.querySelector('[data-act="build"]'));
  assert.equal(built, null);
});

test("describe: answering the 'which kind' question rewrites the plan", () => {
  const box = mount(describeBox({ S: EN, onBuilt: () => {} }));
  type(
    box.querySelector("textarea"),
    "Something with these words\nhabitat - where an animal lives\npredator - hunts\nprey - is hunted\nproducer - makes food",
  );
  box.querySelector('[data-act="plan"]').click();
  const opt = box.querySelector('[data-opt="check"]');
  if (opt) {
    opt.click();
    assert.match(box.querySelector(".xw-plan").textContent, /quick check/);
  } else assert.ok(box.querySelector(".xw-plan").textContent.length > 0, "plan shown");
});

// ── use my own material ─────────────────────────────────────────────────────

test("import: a numbered multiple-choice list with one missing answer -> review item, pick, build", async () => {
  let built = null;
  const box = mount(importBox({ S: EN, onBuilt: (r) => (built = r), newId: () => "sfixed0002" }));
  type(box.querySelector("textarea"), MC_TEXT);
  box.querySelector('[data-act="read"]').click();
  await tick();
  const review = box.querySelector(".xw-review");
  assert.match(review.textContent, /Needs a look \(1\)/);
  assert.match(review.textContent, /Lines 6-9/, "line numbers");
  assert.match(review.textContent, /No correct answer is marked/, "a plain reason");
  assert.match(review.textContent, /What is a consumer\?/);
  const radios = review.querySelectorAll('input[type="radio"]');
  assert.equal(radios.length, 3);
  assert.match(box.querySelector(".xw-summary").textContent, /3 questions/);
  // picking is the teacher's: nothing is chosen for them
  assert.ok([...radios].every((r) => !r.checked));
  assert.match(box.textContent, /1 question has no answer yet/);
  radios[0].checked = true;
  radios[0].dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.match(box.querySelector(".xw-review").textContent, /Nothing needs a look/);
  assert.equal(box.querySelectorAll(".xw-review input").length, 0);
  box.querySelector('[data-act="build"]').click();
  assert.ok(built, "built");
  sound(built.activity);
  const qs = built.activity.blocks.filter((b) => b.type === "question");
  assert.equal(qs.length, 3, "all three questions, none dropped");
  const consumer = qs.find((q) => /consumer/.test(q.prompt));
  assert.equal(consumer.answer, consumer.options[0].id, "the answer is the teacher's pick");
  assert.equal(built.activity.context.source.origin, "teacher");
});

test("import: an unanswered question is left out and listed, never guessed", async () => {
  let built = null;
  const box = mount(importBox({ S: EN, onBuilt: (r) => (built = r) }));
  type(box.querySelector("textarea"), MC_TEXT);
  box.querySelector('[data-act="read"]').click();
  await tick();
  box.querySelector('[data-act="build"]').click();
  assert.ok(built);
  sound(built.activity);
  const qs = built.activity.blocks.filter((b) => b.type === "question");
  assert.equal(qs.length, 2);
  assert.ok(!qs.some((q) => /consumer/.test(q.prompt)));
  assert.ok(
    built.notes.some((n) => /answer/i.test(n.en) && n.lines),
    "the left-out question is named with its lines",
  );
});

test("import: a Word file is read in memory and builds", async () => {
  let built = null;
  const box = mount(importBox({ S: EN, JSZip, onBuilt: (r) => (built = r) }));
  const bytes = await makeDocx();
  const input = box.querySelector('input[type="file"]');
  const file = {
    name: "quiz.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.match(box.textContent, /Chosen: quiz\.docx/);
  box.querySelector('[data-act="read"]').click();
  await tick(60);
  assert.match(box.querySelector(".xw-summary").textContent, /3 questions/);
  assert.match(box.textContent, /Line numbers count the text pulled out of your Word file/);
  box.querySelector('[data-act="build"]').click();
  assert.ok(built);
  sound(built.activity);
});

test("import: a PDF gets the honest message and nothing is read", async () => {
  const box = mount(importBox({ S: EN, onBuilt: () => assert.fail("must not build") }));
  const input = box.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", {
    value: [
      {
        name: "worksheet.pdf",
        type: "application/pdf",
        arrayBuffer: async () => assert.fail("no read"),
      },
    ],
    configurable: true,
  });
  input.dispatchEvent(new w.Event("change", { bubbles: true }));
  box.querySelector('[data-act="read"]').click();
  await tick();
  assert.match(box.querySelector(".xw-plan").textContent, /Reading PDF files is not available/);
  assert.equal(box.querySelector('[data-act="build"]'), null);
});

test("import: other files and empty input are refused in plain words", async () => {
  const box = mount(importBox({ S: EN, onBuilt: () => {} }));
  box.querySelector('[data-act="read"]').click();
  await tick();
  assert.match(box.querySelector(".xw-plan").textContent, /Paste your material or choose a Word/);
  const input = box.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", {
    value: [{ name: "a.exe", type: "" }],
    configurable: true,
  });
  input.dispatchEvent(new w.Event("change", { bubbles: true }));
  box.querySelector('[data-act="read"]').click();
  await tick();
  assert.match(box.querySelector(".xw-plan").textContent, /Word \(\.docx\) files or pasted text/);
});

test("import: a corrupt .docx says so and changes nothing", async () => {
  const box = mount(importBox({ S: EN, JSZip, onBuilt: () => assert.fail("must not build") }));
  const input = box.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", {
    value: [
      {
        name: "bad.docx",
        type: "",
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4, 5]).buffer,
      },
    ],
    configurable: true,
  });
  input.dispatchEvent(new w.Event("change", { bubbles: true }));
  box.querySelector('[data-act="read"]').click();
  await tick(40);
  assert.match(box.querySelector(".xw-plan [role=alert]").textContent, /\w/);
});

test("import: counts read in both languages", () => {
  const blocks = [{ type: "question" }, { type: "question" }, { type: "passage" }];
  assert.equal(countsText(EN, blocks), "2 questions, 1 reading passage");
  assert.equal(countsText(ES, blocks), "2 preguntas, 1 texto de lectura");
});

// ── recipes ─────────────────────────────────────────────────────────────────

const WORDS = `habitat - the place where an animal lives
producer - a living thing that makes its own food
consumer - a living thing that eats other living things
decomposer - a living thing that breaks down dead matter
predator - an animal that hunts other animals
prey - an animal that is hunted by other animals`;

test("recipes: apply a built-in recipe to a topic and the teacher's own words", () => {
  let built = null;
  const s = memory();
  const box = mount(
    recipesBox({ S: EN, store: s, onBuilt: (r) => (built = r), newId: () => "sfixed0003" }),
  );
  assert.equal(box.querySelectorAll('input[name="xw-recipe"]').length, builtinRecipes().length);
  const [topic, content] = box.querySelectorAll("input.xw-input, textarea.xw-input");
  type(topic, "ecosystems");
  type(content, WORDS);
  box.querySelector('[data-act="apply"]').click();
  const open = box.querySelector('[data-act="open-built"]');
  assert.ok(open, "an activity came back");
  assert.equal(built, null, "the teacher chooses when to open it");
  open.click();
  assert.ok(built);
  sound(built.activity);
});

test("recipes: parts that cannot be filled are listed, not invented", () => {
  const s = memory();
  const box = mount(recipesBox({ S: EN, store: s, onBuilt: () => {} }));
  const [topic, content] = box.querySelectorAll("input.xw-input, textarea.xw-input");
  // every built-in against content too thin for most steps: each either builds with listed gaps or refuses honestly
  let sawGap = false;
  for (const radio of box.querySelectorAll('input[name="xw-recipe"]')) {
    radio.checked = true;
    radio.dispatchEvent(new w.Event("change", { bubbles: true }));
    type(topic, "ecosystems");
    type(
      content,
      "habitat - the place where an animal lives\nproducer - a living thing that makes its own food",
    );
    box.querySelector('[data-act="apply"]').click();
    const out = box.querySelector(".xw-plan");
    assert.ok(out.textContent.length > 0);
    if (out.querySelector(".xw-notes")) sawGap = true;
  }
  assert.ok(sawGap, "at least one recipe reported what it could not fill");
});

test("recipes: saved recipe from an activity is stored, listed, applied to another topic, and deletable", () => {
  const s = memory();
  // an activity to take the structure from
  let source = null;
  const first = mount(recipesBox({ S: EN, store: s, onBuilt: (r) => (source = r) }));
  const [t1, c1] = first.querySelectorAll("input.xw-input, textarea.xw-input");
  type(t1, "ecosystems");
  type(c1, WORDS);
  first.querySelector('[data-act="apply"]').click();
  first.querySelector('[data-act="open-built"]').click();
  assert.ok(source);

  const saved = mount(saveRecipeBox({ S: EN, activity: source.activity, store: s }));
  type(saved.querySelector("input.xw-input"), "My plan");
  saved.querySelector('[data-act="save-recipe"]').click();
  assert.match(saved.textContent, /Saved "My plan" on this device \(1 of 20\)/);
  assert.equal(store.listRecipes(s).length, 1);
  const stored = store.listRecipes(s)[0];
  assert.ok(!JSON.stringify(stored).includes("habitat"), "no topic word is kept");
  assert.deepEqual(
    stored,
    JSON.parse(JSON.stringify(recipeFromActivity(source.activity, "My plan"))),
  );

  // another topic, the saved recipe
  let next = null;
  const box = mount(recipesBox({ S: EN, store: s, onBuilt: (r) => (next = r) }));
  const savedRadio = byText(box, "label.xw-radio", /My plan/).querySelector("input");
  savedRadio.checked = true;
  savedRadio.dispatchEvent(new w.Event("change", { bubbles: true }));
  const [t2, c2] = box.querySelectorAll("input.xw-input, textarea.xw-input");
  type(t2, "the water cycle");
  type(
    c2,
    "evaporation - water turning into a gas\ncondensation - a gas turning into water\nprecipitation - water falling from clouds\nrunoff - water flowing over land\ncollection - water gathering in one place\nvapor - water as a gas",
  );
  box.querySelector('[data-act="apply"]').click();
  box.querySelector('[data-act="open-built"]').click();
  assert.ok(next);
  sound(next.activity);
  assert.match(next.activity.title, /water cycle/i);
  assert.ok(
    !JSON.stringify(next.activity).includes("habitat"),
    "nothing from the first topic leaked",
  );

  byText(box, "button", /^Delete$/).click();
  assert.equal(store.listRecipes(s).length, 0);
});

test("recipes: saving with no activity explains instead of failing", () => {
  const box = mount(saveRecipeBox({ S: EN, store: memory() }));
  assert.match(box.textContent, /Make an activity first/);
});

test("recipes: an empty form asks for a topic or content", () => {
  const box = mount(
    recipesBox({ S: EN, store: memory(), onBuilt: () => assert.fail("must not build") }),
  );
  box.querySelector('[data-act="apply"]').click();
  assert.match(box.textContent, /Add a topic or your own content first/);
});

// ── the chooser ─────────────────────────────────────────────────────────────

test("chooser: the four kinds stay; the three other ways are closed and load only when opened", async () => {
  const { chooseScreen } = await import("../access-practice-lab/src/studio/editor/create.js");
  let picked = "";
  const plain = mount(chooseScreen({ S: EN, onPick: (k) => (picked = k), onSample() {} }));
  assert.equal(plain.querySelectorAll(".st-kind").length, 4);
  assert.equal(plain.querySelector(".xw-start"), null, "no extras unless the caller wires them");
  plain.querySelector('[data-kind="worksheet"]').click();
  assert.equal(picked, "worksheet");

  let built = null;
  const screen = mount(
    chooseScreen({ S: EN, onPick() {}, onSample() {}, onBuilt: (r) => (built = r), drafts: [] }),
  );
  assert.equal(screen.querySelectorAll(".st-kind").length, 4);
  const ways = screen.querySelectorAll("details.xw-way");
  assert.deepEqual(
    [...ways].map((d) => d.dataset.way),
    ["describe", "import", "recipe"],
  );
  assert.ok(
    [...ways].every((d) => !d.open && !d.querySelector(".xw-box")),
    "closed, nothing loaded",
  );
  ways[0].open = true;
  ways[0].dispatchEvent(new w.Event("toggle"));
  await tick(150);
  assert.ok(ways[0].querySelector('[data-box="describe"]'), "describe loaded on demand");
  assert.ok(!ways[1].querySelector(".xw-box"));
  assert.equal(built, null);
});

// ── bilingual + accessibility ───────────────────────────────────────────────

test("every box renders real Spanish, and its controls are named", () => {
  const mk = [
    (S) => describeBox({ S, onBuilt: () => {} }),
    (S) => importBox({ S, onBuilt: () => {} }),
    (S) => recipesBox({ S, store: memory(), onBuilt: () => {} }),
    (S) =>
      saveRecipeBox({
        S,
        activity: normalizeActivity({ title: "x", kind: "worksheet", blocks: [] }),
        store: memory(),
      }),
  ];
  for (const make of mk) {
    const en = mount(make(EN)).textContent;
    const es = mount(make(ES)).textContent;
    assert.notEqual(en, es);
    assert.ok(!/undefined|\[object/.test(en + es));
    const box = mount(make(EN));
    for (const el of box.querySelectorAll(
      "input:not([type=radio]):not([type=file]), textarea, select, input[type=file]",
    )) {
      assert.ok(
        el.id && box.querySelector(`label[for="${el.id}"]`),
        `a label for ${el.outerHTML.slice(0, 60)}`,
      );
    }
    for (const b of box.querySelectorAll("button"))
      assert.ok(b.textContent.trim() || b.getAttribute("aria-label"));
  }
});

test("no box used the network", () => {
  assert.equal(wireNetwork.length, 0);
});
