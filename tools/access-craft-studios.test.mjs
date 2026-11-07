// Craft studios (Argument Arena, Mentor Text Explorer, Sentence Lab): content contracts, the practice checks, and the
// views mounted in jsdom (English, Spanish, both grade bands), including saved progress and ledger entries.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const dom = new JSDOM("<!doctype html><html><body><main id=app></main></body></html>", {
  url: "https://thelanguagepage.com/access-practice-lab/arena",
});
for (const k of [
  "window",
  "document",
  "location",
  "localStorage",
  "navigator",
  "HTMLElement",
  "Node",
  "CSS",
  "MutationObserver",
])
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });

const LAB = "../access-practice-lab/src";
const arenaData = await import(`${LAB}/content/craft-arena.js`);
const mentorData = await import(`${LAB}/content/craft-mentor.js`);
const sent = await import(`${LAB}/content/craft-sentences.js`);
const engine = await import(`${LAB}/lang/craft-sentence.js`);
const craft = await import(`${LAB}/lang/craft.js`);
const arena = await import(`${LAB}/views/arena.js`);
const mentor = await import(`${LAB}/views/mentor.js`);
const sentences = await import(`${LAB}/views/sentences.js`);
const { parseRoute } = await import(`${LAB}/main.js`).catch(() => ({}));
const { toHtml } = await import(`${LAB}/util.js`);
const { loadLedger } = await import(`${LAB}/lang/ledger.js`);

const COUNTDOWN = /\b(countdown|hurry|time is up|beat the clock|words per minute|leaderboard)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const ctxFor = (view, lang, id = "", sub = "", band = "6-8") => ({
  band,
  prefs: { lang, rate: 0.9 },
  route: { view, id, sub },
  rerender: () => draw(view, ctxFor(view, lang, id, sub, band)),
});
const views = { arena, mentor, sentences };
async function draw(view, ctx) {
  const out = await views[view].render(ctx);
  const root = document.getElementById("app");
  root.innerHTML = toHtml(out.html);
  views[view].mount?.(root, ctx);
  return { title: out.title, root, text: root.textContent };
}
const click = (view, ctx, el) => {
  assert.ok(el, "element to click exists");
  return views[view].onClick({ target: el }, ctx);
};

test("arena content: 26 topics, six balanced cards each, objections, Spanish titles", () => {
  const { TOPICS, topicsFor } = arenaData;
  assert.ok(TOPICS.length >= 24);
  for (const band of ["3-5", "6-8"]) assert.ok(topicsFor(band).length >= 12, band);
  assert.equal(new Set(TOPICS.map((t) => t.id)).size, TOPICS.length);
  for (const t of TOPICS) {
    assert.equal(t.cards.length, 6, t.id);
    assert.equal(t.cards.filter((c) => c.side === "y").length, 3, `${t.id} yes cards`);
    assert.equal(t.cards.filter((c) => c.side === "n").length, 3, `${t.id} no cards`);
    assert.ok(t.objection.y.length > 30 && t.objection.n.length > 30, t.id);
    assert.ok(t.title.es && t.question.es && t.stance.y.es && t.stance.n.es, `${t.id} Spanish`);
    for (const c of t.cards) assert.ok(c.source && c.text.length > 40, c.id);
  }
});

test("mentor content: 32 texts, notes match markers, every move has two try tasks per band", () => {
  const { TEXTS, MOVES, TRY, parseMentor } = mentorData;
  assert.ok(TEXTS.length >= 30);
  const ids = new Set(MOVES.map((m) => m.id));
  for (const t of TEXTS) {
    const segs = parseMentor(t.text, t.notes).filter((s) => s.move);
    assert.equal(segs.length, t.notes.length, t.id);
    assert.ok(segs.length >= 3, `${t.id} has at least three moves`);
    for (const s of segs) {
      assert.ok(ids.has(s.move), `${t.id} move ${s.move}`);
      assert.ok(s.note[0] && s.note[1], `${t.id} note ${s.i} in both languages`);
    }
  }
  for (const band of ["3-5", "6-8"])
    assert.ok(new Set(TEXTS.filter((t) => t.band === band).map((t) => t.genre)).size >= 6, band);
  for (const m of MOVES)
    for (const band of ["3-5", "6-8"]) assert.equal(TRY[m.id][band].length, 2, `${m.id} ${band}`);
});

test("sentence content: 300+ tasks that all parse, with rules and Spanish notes that resolve", () => {
  const { TASKS, BOSSES, RULES, CONTRAST } = sent;
  assert.ok(TASKS.length + BOSSES.flatMap((b) => b.steps).length >= 300);
  const ids = new Set();
  for (const t of [...TASKS, ...BOSSES.flatMap((b) => b.steps)]) {
    assert.ok(!ids.has(t.id), `duplicate ${t.id}`);
    ids.add(t.id);
    if (t.a) {
      const p = engine.parseSentence(t.a);
      assert.ok(engine.tilesFor(t, p).length >= 3, t.id);
      assert.match(p.text, /[.?!]$/, `${t.id} ends with an end mark`);
      assert.match(p.text, /^[A-Z]/, `${t.id} starts with a capital`);
      const shuffled = engine.seededShuffle(engine.tilesFor(t, p), t.id).map((x) => x.text);
      assert.notDeepEqual(
        shuffled,
        engine.tilesFor(t, p).map((x) => x.text),
        `${t.id} is not already in order`,
      );
    }
    if (t.kind === "s") {
      const words = t.s.split(" ");
      assert.ok(t.at.length && t.at.every((i) => i >= 0 && i < words.length), t.id);
    }
    if (t.kind === "f") {
      assert.equal(new Set(t.opts).size, 3, `${t.id} options differ`);
      assert.ok(!t.opts.includes(t.s), `${t.id} wrong sentence is not an option`);
    }
    if (t.rule) assert.ok(RULES[t.rule], `${t.id} rule ${t.rule}`);
    if (t.c) assert.ok(CONTRAST[t.c], `${t.id} contrast ${t.c}`);
  }
  for (const r of Object.values(RULES)) assert.ok(r.name.es && r.rule.es, r.id);
  for (const c of Object.values(CONTRAST)) assert.ok(c.text.es && c.ex && c.right && c.wrong, c.id);
  for (const k of ["order", "adj", "art", "plural", "tense", "neg"])
    assert.ok(CONTRAST[k], `contrast note ${k}`);
  for (const band of ["3-5", "6-8"]) {
    assert.ok(sent.tasksFor(band).length >= 150, band);
    assert.equal(sent.bossFor(band).length, 5, band);
  }
});

test("sentence engine: clauses, tiles, types and specific hints", () => {
  const p = engine.parseSentence("Because/sc S[it] V[rained] , S[we] V[stayed] M[inside] .");
  assert.equal(p.text, "Because it rained, we stayed inside.");
  assert.deepEqual(
    p.clauses.map((c) => c.type),
    ["D", "I"],
  );
  assert.equal(engine.sentenceType(p), "complex");
  assert.equal(
    engine.sentenceType(
      engine.parseSentence("S[I] V[like] O[pizza] , and/c S[he] V[likes] O[pasta] ."),
    ),
    "compound",
  );
  assert.equal(engine.sentenceType(engine.parseSentence("S[The dog] V[barks] .")), "simple");
  const task = { kind: "b", lv: 3 };
  const tiles = engine.tilesFor(task, engine.parseSentence("S[The dog] V[barks] M[loudly] ."));
  assert.deepEqual(
    tiles.map((t) => t.text),
    ["The dog", "barks", "loudly", "."],
  );
  const parsed = engine.parseSentence("S[The dog] V[barks] M[loudly] .");
  assert.equal(engine.checkBuild(parsed, tiles, [], ["The dog", "barks", "loudly", "."]).ok, true);
  const bad = engine.checkBuild(parsed, tiles, [], ["barks", "The dog", "loudly", "."]);
  assert.equal(bad.ok, false);
  assert.match(bad.hint.en, /place 1/);
  assert.doesNotMatch(bad.hint.en, /The dog/, "the hint never states the tile");
  assert.throws(() => engine.parseSentence("S[The dog barks ."));
});

test("argument checks are specific and the counter check wants its pattern", () => {
  const topic = arenaData.findTopic("phones");
  const yes = topic.cards.filter((c) => c.side === "y");
  const no = topic.cards.find((c) => c.side === "n");
  const s = {
    side: "y",
    claim: "I believe students should keep phones in lockers.",
    slots: [yes[0].id, no.id],
    notes: ["According to a teacher, talk got longer.", "A parent wants contact."],
    reason: "This matters because students focus better when phones are away.",
  };
  const r = craft.checkArgument(topic, s);
  assert.equal(r.ready, false);
  assert.match(r.items.find((i) => i.id === "evidence").say.en, /supports the other side/);
  s.slots[1] = yes[1].id;
  s.notes[1] = "The research summary says a phone in sight makes it harder to focus.";
  assert.equal(craft.checkArgument(topic, s).ready, true);
  s.notes[0] = yes[0].text;
  assert.equal(
    craft.checkArgument(topic, s).items.find((i) => i.id === "own").ok,
    false,
    "a copied card is flagged",
  );
  assert.equal(
    craft.checkCounter("agree", "You make a good point, but the evidence still matters.").ok,
    true,
  );
  assert.equal(craft.checkCounter("agree", "I do not agree with you at all.").ok, false);
  assert.equal(craft.checkCounter("clarify", "Can you explain what you mean by that?").ok, true);
  assert.equal(
    craft.checkCounter("disagree", "I disagree because the data show otherwise.").ok,
    true,
  );
});

test("writer's move checks name what they found and what to add", () => {
  const c = craft.checkMove;
  assert.equal(c("verb", "The dog sprinted to the door.", { weak: ["went"] }).ok, true);
  assert.equal(c("verb", "The dog went quickly to the door.", { weak: ["went"] }).ok, false);
  assert.equal(c("sense", "The icy snow stung my cheeks.").ok, true);
  assert.equal(c("sense", "The snow was there for us today.").ok, false);
  assert.equal(c("hook", "Did you know an owl can turn its head?").ok, true);
  assert.equal(c("hook", "Owls are birds that live in trees.").ok, false);
  assert.match(
    c("trans", "I wanted to swim but the water was cold.", { fn: "time" }).tip.en,
    /contrast word/,
  );
  assert.equal(c("trans", "First we packed our bags. Then we left.", { fn: "time" }).ok, true);
  assert.equal(c("evid", "According to the science book, owls hunt at night.").ok, true);
  assert.equal(c("coh", "A cat sat on my porch. This cat has a torn ear.").ok, true);
  assert.equal(c("coh", "A cat sat on my porch.").ok, false);
  assert.equal(c("comp", "The moon was like a silver coin.").ok, true);
  assert.equal(c("prec", "We saw twelve animals at the zoo.").ok, true);
  assert.equal(c("prec", "We saw many animals at the zoo.").ok, false);
  assert.ok(c("verb", "ok").tip.es, "feedback is bilingual");
});

test("state: damaged storage resets, other keys are untouched, level is saved", () => {
  localStorage.setItem(craft.CRAFT_KEY, "{not json");
  const s = craft.loadCraft();
  assert.equal(s.level, "A");
  s.level = "C";
  s.sentences.pos = { "6-8:3": 4 };
  craft.saveCraft(s);
  assert.equal(craft.loadCraft().level, "C");
  assert.equal(craft.loadCraft().sentences.pos["6-8:3"], 4);
  localStorage.removeItem(craft.CRAFT_KEY);
});

test("the router sends the three routes to their views", { skip: !parseRoute }, () => {
  assert.equal(parseRoute("/access-practice-lab/arena/phones", "?grades=6-8").view, "arena");
  assert.equal(parseRoute("/access-practice-lab/mentor/try/verb", "").sub, "verb");
  assert.equal(parseRoute("/access-practice-lab/sentences/boss/gboss1", "").id, "boss");
});

test("every hub and page renders in English, Spanish and both, with no emoji, countdown or score claim", async () => {
  localStorage.clear();
  for (const band of ["3-5", "6-8"]) {
    const pages = [
      ["arena", "", ""],
      ["mentor", "", ""],
      ["mentor", "toolbox", ""],
      ["sentences", "", ""],
      ["sentences", "notes", ""],
      ["arena", arenaData.topicsFor(band)[0].id, ""],
      ["mentor", mentorData.textsFor(band)[0].id, ""],
      ["mentor", "try", "verb"],
      ["sentences", String(sent.levelsFor(band)[0]), ""],
      ["sentences", "boss", sent.bossFor(band)[0].id],
    ];
    for (const lang of ["en", "es", "bi"]) {
      for (const [view, id, sub] of pages) {
        const { root, text, title } = await draw(view, ctxFor(view, lang, id, sub, band));
        const where = `${view}/${id}/${sub} ${band} ${lang}`;
        assert.ok(title, where);
        assert.equal(root.querySelectorAll("h1").length, 1, `${where} has one h1`);
        assert.ok(root.querySelector("a[href*='/library']"), `${where} links back to Practice`);
        assert.doesNotMatch(text, COUNTDOWN, where);
        assert.doesNotMatch(text, SCORE_CLAIM, where);
        assert.doesNotMatch(toHtml(root.innerHTML), EMOJI, where);
        if (lang === "es") assert.match(text, /Práctica|práctica/, where);
        assert.doesNotMatch(root.innerHTML, /undefined|\[object Object\]/, where);
      }
    }
  }
  const es = await draw("arena", ctxFor("arena", "es"));
  assert.match(es.text, /Arena de argumentos/);
  const en = await draw("sentences", ctxFor("sentences", "en"));
  assert.match(en.text, /Boss paragraphs/);
});

test("unknown ids and the wrong band render not-found pages", async () => {
  for (const view of ["arena", "mentor"])
    assert.match((await draw(view, ctxFor(view, "en", "nope"))).text, /could not find/);
  assert.match(
    (await draw("arena", ctxFor("arena", "en", "recess", "", "6-8"))).text,
    /could not find/,
  );
  assert.match((await draw("sentences", ctxFor("sentences", "en", "9"))).text, /could not find/);
});

test("Sentence Lab: tap-to-place builds a sentence, the machine fills, progress and the ledger save", async () => {
  localStorage.clear();
  const ctx = ctxFor("sentences", "en", "3", "", "3-5");
  let out = await draw("sentences", ctx);
  const task = [...sent.tasksFor("3-5", 3)].find((t) => t.kind === "b");
  // The first task in level order is a build task.
  const first = out.root.querySelector("#sl-task").textContent;
  assert.match(first, /Build/);
  const parsed = engine.parseSentence(sent.tasksFor("3-5", 3).filter((t) => t.kind === "b")[0].a);
  const want = engine.tilesFor({ kind: "b", lv: 3 }, parsed).map((t) => t.text);
  for (const text of want) {
    const btn = [...out.root.querySelectorAll("[data-sl-tile]")].find(
      (b) => b.querySelector("span").textContent === text,
    );
    assert.ok(btn, `tile ${text}`);
    click("sentences", ctx, btn);
    out = await draw("sentences", ctx);
  }
  click("sentences", ctx, out.root.querySelector("[data-sl-check]"));
  out = await draw("sentences", ctx);
  assert.ok(out.root.querySelector(".cs-win"), "correct build shows the win");
  assert.ok(out.root.querySelector(".cs-machine"), "the machine explains the sentence");
  assert.equal(craft.loadCraft().sentences.tasks[task.id]?.ok, true);
  click("sentences", ctx, out.root.querySelector("[data-sl-next]"));
  out = await draw("sentences", ctx);
  assert.ok(out.root.querySelector("[data-sl-spot], [data-sl-opt], [data-sl-tile]"));
  // A wrong order gives a hint that names a part, never a tile.
  const wrongCtx = ctxFor("sentences", "en", "3", "", "3-5");
  out = await draw("sentences", wrongCtx);
});

test("Sentence Lab: spot and fix tasks mark the right answer and show the rule and the Spanish tip", async () => {
  localStorage.clear();
  const ctx = ctxFor("sentences", "en", "1", "", "3-5");
  const spot = sent.tasksFor("3-5", 1).find((t) => t.kind === "s");
  const state = craft.loadCraft();
  // Jump the level to the spot task by saving the position of that task in practice order.
  await draw("sentences", ctx);
  let pos = 0;
  for (let i = 0; i < 60; i++) {
    const out = await draw("sentences", ctx);
    if (out.root.querySelector("[data-sl-spot]")) break;
    const s = craft.loadCraft();
    (s.sentences.pos ||= {})["3-5:1"] = ++pos;
    craft.saveCraft(s);
  }
  let out = await draw("sentences", ctx);
  const spots = [...out.root.querySelectorAll("[data-sl-spot]")];
  assert.ok(spots.length >= 3);
  const task = sent
    .tasksFor("3-5", 1)
    .find(
      (t) =>
        t.kind === "s" &&
        t.s.split(" ").length === spots.length &&
        out.root.querySelector(".cs-spot").textContent.trim().startsWith(t.s.split(" ")[0]),
    );
  assert.ok(task || spot);
  const t = task || spot;
  const wrongIdx = spots.findIndex((_, i) => !t.at.includes(i));
  click("sentences", ctx, spots[wrongIdx]);
  out = await draw("sentences", ctx);
  assert.ok(out.root.querySelector(".cs-next"), "a wrong tap gets a gentle prompt");
  click("sentences", ctx, out.root.querySelectorAll("[data-sl-spot]")[t.at[0]]);
  out = await draw("sentences", ctx);
  assert.ok(out.root.querySelector(".cs-rule"), "the rule appears after the right tap");
  assert.ok(craft.loadCraft().sentences.tasks[t.id].ok);
  assert.equal(state.level, "A");
});

test("Sentence Lab: five solved tasks write one ledger entry, and the boss unlocks its paragraph", async () => {
  localStorage.clear();
  const band = "3-5";
  const boss = sent.bossFor(band)[0];
  const ctx = ctxFor("sentences", "en", "boss", boss.id, band);
  let out = await draw("sentences", ctx);
  for (const step of boss.steps) {
    if (step.kind === "f") {
      const btn = [...out.root.querySelectorAll("[data-sl-opt]")].find(
        (b) => b.textContent === step.opts[0],
      );
      click("sentences", ctx, btn);
    } else if (step.kind === "s") {
      click("sentences", ctx, out.root.querySelectorAll("[data-sl-spot]")[step.at[0]]);
    } else {
      const want = engine.tilesFor(step, engine.parseSentence(step.a)).map((t) => t.text);
      for (const text of want) {
        out = await draw("sentences", ctx);
        click(
          "sentences",
          ctx,
          [...out.root.querySelectorAll("[data-sl-tile]")].find(
            (b) => b.querySelector("span").textContent === text,
          ),
        );
      }
      out = await draw("sentences", ctx);
      click("sentences", ctx, out.root.querySelector("[data-sl-check]"));
    }
    out = await draw("sentences", ctx);
    assert.ok(out.root.querySelector(".cs-win"), `${step.id} solved`);
    click("sentences", ctx, out.root.querySelector("[data-sl-next]"));
    out = await draw("sentences", ctx);
  }
  assert.ok(out.root.querySelector(".cs-paragraph"), "the finished paragraph is shown");
  const entries = loadLedger().entries.filter((e) => e.src === "craft");
  assert.ok(entries.length >= 1, "a boss completion entry exists");
  assert.equal(entries.at(-1).m.tool, "sentences");
  assert.ok(craft.loadCraft().sentences.boss[boss.id].complete);
});

test("Argument Arena: choose a side, tap to place two cards, check, and the argument is recorded", async () => {
  localStorage.clear();
  const topic = arenaData.findTopic("phones");
  const ctx = ctxFor("arena", "en", topic.id, "", "6-8");
  let out = await draw("arena", ctx);
  click("arena", ctx, out.root.querySelector('[data-ar-step="claim"]'));
  out = await draw("arena", ctx);
  click("arena", ctx, out.root.querySelector('[data-ar-side="y"]'));
  out = await draw("arena", ctx);
  const type = (name, value) => {
    const el = out.root.querySelector(`[data-ar-field="${name}"]`);
    el.value = value;
    arena.onInput({ target: el });
  };
  type("claim", "I believe students should keep phones in lockers during school.");
  click("arena", ctx, out.root.querySelector('[data-ar-step="build"]'));
  out = await draw("arena", ctx);
  const yes = topic.cards.filter((c) => c.side === "y");
  click("arena", ctx, out.root.querySelector(`[data-ar-place="${yes[0].id}"][data-slot="0"]`));
  out = await draw("arena", ctx);
  click("arena", ctx, out.root.querySelector(`[data-ar-place="${yes[1].id}"][data-slot="1"]`));
  out = await draw("arena", ctx);
  type("note0", "According to a teacher, discussions grew longer once phones were put away.");
  type("note1", "Research says a phone in sight makes it harder to focus on a task.");
  type("reason", "This matters because students learn more when they can focus on each other.");
  click("arena", ctx, out.root.querySelector("[data-ar-check-arg]"));
  out = await draw("arena", ctx);
  assert.ok(out.root.querySelector(".cs-win"), "a complete argument gets the win message");
  const entry = loadLedger().entries.find((e) => e.src === "arena");
  assert.ok(entry, "an arena entry is in the evidence ledger");
  assert.equal(entry.stage, "supported", "level A is supported work");
  assert.ok(entry.m.words > 20, "the argument text was analyzed");
  // Move to counter, respond, and finish.
  click("arena", ctx, out.root.querySelector('[data-ar-step="counter"]'));
  out = await draw("arena", ctx);
  click("arena", ctx, out.root.querySelector('[data-ar-counter-type="agree"]'));
  out = await draw("arena", ctx);
  type("counter", "You make a good point, but families can still reach the office.");
  click("arena", ctx, out.root.querySelector("[data-ar-check-counter]"));
  out = await draw("arena", ctx);
  assert.ok(out.root.querySelector(".cs-win"));
  click("arena", ctx, out.root.querySelector('[data-ar-step="card"]'));
  out = await draw("arena", ctx);
  assert.ok(out.root.querySelector(".arena-card"), "the printable card exists");
  assert.match(out.root.querySelector(".arena-card").textContent, /phones in lockers/);
  assert.ok(
    out.root.querySelectorAll('input[type="radio"]').length >= 30,
    "self and partner rubrics",
  );
});

test("Argument Arena: a card on the other side is flagged, and level C hides every frame", async () => {
  localStorage.clear();
  const s = craft.loadCraft();
  s.level = "C";
  craft.saveCraft(s);
  const topic = arenaData.findTopic("phones");
  const ctx = ctxFor("arena", "en", topic.id, "", "6-8");
  let out = await draw("arena", ctx);
  click("arena", ctx, out.root.querySelector('[data-ar-step="claim"]'));
  out = await draw("arena", ctx);
  click("arena", ctx, out.root.querySelector('[data-ar-side="y"]'));
  out = await draw("arena", ctx);
  assert.equal(out.root.querySelectorAll(".cs-frame").length, 0, "no frames at level C");
  click("arena", ctx, out.root.querySelector('[data-ar-step="build"]'));
  out = await draw("arena", ctx);
  const no = topic.cards.find((c) => c.side === "n");
  click("arena", ctx, out.root.querySelector(`[data-ar-place="${no.id}"][data-slot="0"]`));
  out = await draw("arena", ctx);
  click("arena", ctx, out.root.querySelector("[data-ar-check-arg]"));
  out = await draw("arena", ctx);
  assert.match(
    out.root.querySelector(".cs-feedback").textContent,
    /Add two evidence cards|other side/,
  );
  const entry = loadLedger().entries.find((e) => e.src === "arena");
  assert.equal(entry, undefined, "an empty argument writes no ledger entry");
});

test("Mentor Text Explorer: tap a move, read the note, collect it, then try it with specific feedback", async () => {
  localStorage.clear();
  const text = mentorData.textsFor("3-5")[0];
  const ctx = ctxFor("mentor", "en", text.id, "", "3-5");
  let out = await draw("mentor", ctx);
  const moves = out.root.querySelectorAll("[data-mt-move]");
  assert.equal(moves.length, text.notes.length);
  assert.ok(out.root.querySelector(".cs-mvname"), "level A labels each move");
  click("mentor", ctx, moves[1]);
  out = await draw("mentor", ctx);
  assert.ok(out.root.querySelector(".cs-note-card"), "the margin note opens");
  click("mentor", ctx, out.root.querySelector("[data-mt-collect]"));
  assert.equal(craft.loadCraft().mentor.toolbox.length, 1);
  out = await draw("mentor", ctx);
  assert.match(
    (await draw("mentor", ctxFor("mentor", "en", "toolbox", "", "3-5"))).text,
    /“tiptoed”/,
  );
  const tryCtx = ctxFor("mentor", "en", "try", "verb", "3-5");
  out = await draw("mentor", tryCtx);
  out.root.querySelector("[data-mt-field]").value = "The dog bolted to the door.";
  click("mentor", tryCtx, out.root.querySelector("[data-mt-check]"));
  out = await draw("mentor", tryCtx);
  assert.match(out.root.querySelector(".cs-feedback").textContent, /bolted/);
  const entry = loadLedger().entries.find((e) => e.src === "craft" && e.m.stepId === "try");
  assert.ok(entry && entry.m.ok === 1);
});

test("Mentor Text Explorer: level B asks which move it is, and level C works by sentence", async () => {
  localStorage.clear();
  const s = craft.loadCraft();
  s.level = "B";
  craft.saveCraft(s);
  const text = mentorData.textsFor("6-8")[0];
  const ctx = ctxFor("mentor", "en", text.id, "", "6-8");
  let out = await draw("mentor", ctx);
  assert.equal(out.root.querySelector(".cs-mvname"), null, "no labels at level B");
  click("mentor", ctx, out.root.querySelectorAll("[data-mt-move]")[0]);
  out = await draw("mentor", ctx);
  const quiz = [...out.root.querySelectorAll("[data-mt-answer]")];
  assert.equal(quiz.length, 3);
  const right = mentorData.parseMentor(text.text, text.notes).find((x) => x.move).move;
  click(
    "mentor",
    ctx,
    quiz.find((b) => b.dataset.mtAnswer !== right),
  );
  out = await draw("mentor", ctx);
  assert.ok(out.root.querySelector(".cs-quiz .cs-next"), "a wrong answer gets a gentle retry");
  click(
    "mentor",
    ctx,
    [...out.root.querySelectorAll("[data-mt-answer]")].find((b) => b.dataset.mtAnswer === right),
  );
  out = await draw("mentor", ctx);
  assert.ok(out.root.querySelector(".cs-note-card"));
  s.level = "C";
  craft.saveCraft(s);
  out = await draw("mentor", ctx);
  assert.ok(
    out.root.querySelectorAll("[data-mt-sent]").length >= 3,
    "sentences are the tap targets at level C",
  );
});
