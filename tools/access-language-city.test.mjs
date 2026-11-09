// Language City: the content is complete, bilingual and honest, the checks refuse wrong answers, no hint or support states
// an answer, independent and supported runs are kept apart, and the player works from the keyboard-level controls.
import assert from "node:assert/strict";
import test from "node:test";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";
import {
  COUNTDOWN,
  click,
  EMOJI,
  makeCtx,
  mount,
  resetStorage,
  type,
} from "./lib/access-studios-dom.mjs";

const { BUILDINGS, MISSIONS, missionsAt, missionOf } = await import(
  "../access-practice-lab/src/content/city.js"
);
const logic = await import("../access-practice-lab/src/lang/city.js");
const { TAGS } = await import("../access-practice-lab/src/lang/scenarios.js");
const view = await import("../access-practice-lab/src/views/city.js");
const art = await import("../access-practice-lab/src/views/city-art.js");
const ledger = await import("../access-practice-lab/src/lang/ledger.js");

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
const leaks = (hay, needle) => norm(needle).length >= 4 && norm(hay).includes(norm(needle));
const pairs = (obj, out = []) => {
  if (!obj || typeof obj !== "object") return out;
  if (typeof obj.en === "string" && "es" in obj) out.push(obj);
  for (const v of Array.isArray(obj) ? obj : Object.values(obj)) pairs(v, out);
  return out;
};
const STEPS = MISSIONS.flatMap((m) => m.steps.map((s) => ({ m, s })));
const CHOOSE = STEPS.filter((x) => x.s.kind === "choose");
const BUILD = STEPS.filter((x) => x.s.kind === "build");
const SAY = STEPS.filter((x) => x.s.kind === "say");
const rightOf = (step) => step.opts.find((o) => o.id === step.answer);

test("six buildings with a named character and two missions each; twelve missions in all", () => {
  assert.equal(BUILDINGS.length, 6);
  assert.equal(new Set(BUILDINGS.map((b) => b.id)).size, 6);
  assert.equal(MISSIONS.length, 12);
  assert.equal(new Set(MISSIONS.map((m) => `${m.place}/${m.id}`)).size, 12);
  for (const b of BUILDINGS) {
    assert.ok(
      b.npc.name && b.npc.role.en && b.npc.role.es && b.npc.greet.en && b.npc.greet.es,
      b.id,
    );
    assert.equal(missionsAt(b.id).length, 2, `${b.id} missions`);
    assert.ok(b.at[0] > 5 && b.at[0] < 95 && b.at[1] > 5 && b.at[1] < 95, `${b.id} on the map`);
  }
  assert.ok(
    ["cafe", "library", "clinic", "market", "school-office", "station"].every((id) =>
      BUILDINGS.some((b) => b.id === id),
    ),
  );
});

test("every mission chains read, listen, a reply or question, a repair and a say-it step", () => {
  for (const m of MISSIONS) {
    const roles = m.steps.map((s) => s.role);
    assert.ok(m.steps.length >= 5 && m.steps.length <= 6, `${m.id} length`);
    assert.equal(roles[0], "read", `${m.id} starts by reading`);
    assert.equal(roles.at(-1), "say", `${m.id} ends by saying`);
    assert.ok(
      roles.includes("listen") && roles.includes("repair") && roles.includes("ask"),
      `${m.id} chain`,
    );
    assert.ok(
      roles.some((r) => r === "respond" || r === "clarify"),
      `${m.id} reply`,
    );
    assert.equal(new Set(m.steps.map((s) => s.id)).size, m.steps.length, `${m.id} step ids`);
    assert.ok(["Inform", "Explain", "Argue"].includes(m.use), `${m.id} use`);
  }
  const cafe = missionOf("cafe", "order-lunch");
  assert.deepEqual(
    cafe.steps.map((s) => s.role),
    ["read", "respond", "ask", "listen", "repair", "say"],
  );
});

test("every learner string is written in English and Spanish, with no emoji, countdown or score claim", () => {
  const all = pairs([BUILDINGS, MISSIONS]);
  assert.ok(all.length > 800, `only ${all.length} pairs`);
  for (const p of all) {
    assert.ok(p.en.trim() && p.es.trim(), `empty: ${JSON.stringify(p)}`);
    // "Total · $8.00" is the same word in both languages; anything with more words must be translated
    if ((p.en.match(/[a-z]{3,}/gi) || []).length > 1)
      assert.notEqual(norm(p.en), norm(p.es), `Spanish copied: ${p.en}`);
    assert.ok(!EMOJI.test(p.en + p.es), p.en);
    assert.ok(!COUNTDOWN.test(p.en + p.es), p.en);
    assert.ok(!SCORE_CLAIM.test(p.en + p.es), p.en);
  }
  for (const { m, s } of STEPS) {
    for (const w of s.bank) assert.ok(w.en && w.es, `${m.id}.${s.id} bank`);
    assert.ok(s.bank.length >= 4, `${m.id}.${s.id} bank size`);
    assert.ok(s.frame.en.includes("___"), `${m.id}.${s.id} frame has blanks`);
  }
});

test("choose steps: three options, one answer, every option explains itself and no feedback names the answer", () => {
  assert.ok(CHOOSE.length >= 40, `${CHOOSE.length} choose steps`);
  for (const { m, s } of CHOOSE) {
    const id = `${m.id}.${s.id}`;
    assert.equal(s.opts.length, 3, id);
    assert.equal(new Set(s.opts.map((o) => o.id)).size, 3, id);
    assert.ok(
      s.opts.some((o) => o.id === s.answer),
      `${id} answer exists`,
    );
    assert.ok(s.stim.type === "doc" || s.stim.type === "speech", id);
    if (s.role === "read") assert.equal(s.stim.type, "doc", id);
    if (s.role === "listen") assert.equal(s.stim.type, "speech", id);
    const right = rightOf(s);
    for (const o of s.opts) {
      assert.ok(o.en && o.es && o.why.en && o.why.es, `${id}.${o.id}`);
      if (o.id !== s.answer)
        assert.ok(!leaks(o.why.en, right.en), `${id}: feedback on ${o.id} names the answer`);
    }
  }
});

test("hints, word banks and frames never state an answer", () => {
  for (const { m, s } of STEPS.filter((x) => x.s.kind !== "say")) {
    const id = `${m.id}.${s.id}`;
    const answer = s.kind === "choose" ? rightOf(s).en : s.ok[0].join(" ");
    const support = [s.hint.en, s.hint.es, s.frame.en, ...s.bank.map((w) => w.en)];
    for (const text of support)
      assert.ok(!leaks(text, answer), `${id}: "${text}" gives away "${answer}"`);
    for (const w of s.bank) assert.notEqual(norm(w.en), norm(answer), `${id} bank equals answer`);
    // a frame filled with its blanks removed must still be a pattern, not the sentence
    assert.ok(norm(s.frame.en.replace(/_+/g, "")) !== norm(answer), id);
  }
});

test("the right answer is not always in the same place", () => {
  const counts = [0, 0, 0];
  for (const { m, s } of CHOOSE) counts[logic.answerPosition(m.id, s)] += 1;
  for (const c of counts)
    assert.ok(c / CHOOSE.length > 0.22 && c / CHOOSE.length < 0.45, `positions ${counts}`);
  // stable: the same order every time
  const { m, s } = CHOOSE[0];
  assert.deepEqual(logic.optionOrder(m.id, s), logic.optionOrder(m.id, s));
});

test("choose check: only the answer passes, every wrong pick gets its own reason (mutation checked)", () => {
  for (const { m, s } of CHOOSE) {
    for (const o of s.opts) {
      const r = logic.checkChoice(s, o.id);
      assert.equal(r.ok, o.id === s.answer, `${m.id}.${s.id}.${o.id}`);
      assert.deepEqual(r.why, o.why);
    }
    assert.equal(logic.checkChoice(s, "zzz").ok, false);
    // mutate the key: the old right answer must now be refused, and the picked wrong one accepted
    const wrong = s.opts.find((o) => o.id !== s.answer);
    const mutated = { ...s, answer: wrong.id };
    assert.equal(logic.checkChoice(mutated, s.answer).ok, false);
    assert.equal(logic.checkChoice(mutated, wrong.id).ok, true);
  }
  const whys = CHOOSE.flatMap(({ s }) =>
    s.opts.filter((o) => o.id !== s.answer).map((o) => o.why.en),
  );
  assert.ok(new Set(whys).size > whys.length * 0.9, "feedback is specific, not repeated");
});

const multiset = (a) => a.slice().sort().join("\u0000");
const isSubset = (small, big) => {
  const pool = big.slice();
  return small.every((w) => {
    const i = pool.indexOf(w);
    if (i < 0) return false;
    pool.splice(i, 1);
    return true;
  });
};
test("build steps: tiles can make every accepted sentence and the known slips, and start scrambled", () => {
  assert.ok(BUILD.length >= 12);
  for (const { m, s } of BUILD) {
    const id = `${m.id}.${s.id}`;
    assert.ok(s.tiles.length >= 6 && s.tiles.length <= 9, id);
    assert.ok(["question", "request"].includes(s.target) || TAGS[s.target], id);
    for (const ok of s.ok) {
      assert.equal(multiset(ok.filter((w) => s.tiles.includes(w))), multiset(ok), id);
      assert.ok(isSubset(ok, s.tiles), `${id}: tiles cannot make an accepted sentence`);
      assert.notDeepEqual(s.tiles.slice(0, ok.length), ok, `${id}: tiles start already solved`);
    }
    assert.ok(s.slips.length >= 2, `${id} slips`);
    for (const slip of s.slips) {
      assert.ok(isSubset(slip.order, s.tiles), `${id}: slip uses a tile that is not there`);
      assert.ok(
        !s.ok.some((o) => o.join(" ") === slip.order.join(" ")),
        `${id}: a slip is also accepted`,
      );
      assert.ok(!leaks(slip.why.en, s.ok[0].join(" ")), `${id}: slip feedback names the sentence`);
    }
  }
});

function* shuffles(tiles, n) {
  let seed = 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
  for (let k = 0; k < n; k++) {
    const a = tiles.map((_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    yield a.map((i) => tiles[i]);
  }
}
test("build check: the accepted order passes; shuffles, extra, missing and reversed words are refused with a reason", () => {
  for (const { m, s } of BUILD) {
    const id = `${m.id}.${s.id}`;
    for (const ok of s.ok) assert.equal(logic.checkBuild(s, ok).ok, true, id);
    for (const seq of shuffles(s.tiles, 400)) {
      const accepted = s.ok.some((o) => o.join(" ") === seq.join(" "));
      const r = logic.checkBuild(s, seq);
      assert.equal(r.ok, accepted, `${id}: ${seq.join(" ")}`);
      if (!r.ok && !r.empty) assert.ok(r.why?.en && r.why?.es, id);
    }
    assert.equal(logic.checkBuild(s, [...s.ok[0]].reverse()).ok, false, id);
    assert.equal(
      logic.checkBuild(s, s.ok[0].slice(0, -1)).ok,
      false,
      `${id} missing the last word`,
    );
    assert.equal(logic.checkBuild(s, [...s.ok[0], s.ok[0][0]]).ok, false, `${id} extra word`);
    assert.equal(logic.checkBuild(s, []).empty, true, id);
    for (const slip of s.slips)
      assert.deepEqual(logic.checkBuild(s, slip.order).why, slip.why, `${id} names its slip`);
    // mutation: drop one accepted word from the key and the real sentence is refused
    assert.equal(logic.checkBuild({ ...s, ok: [s.ok[0].slice(1)] }, s.ok[0]).ok, false, id);
  }
});

const SAMPLE = {
  thank: "Thank you for your help.",
  request: "Could I please have a card?",
  explain: "I am late because the bus was late.",
  describe: "My throat hurts and it started yesterday.",
  apologize: "I am sorry I am late.",
  disagree: "I understand, but maybe I could have a different one.",
  question: "How many spoons should I take?",
  offer: "Can I help you find it?",
};
test("say-it steps use the Real-Life Scenarios wording check: a line with the target passes, off-target text does not", () => {
  assert.equal(SAY.length, 12);
  for (const { m, s } of SAY) {
    assert.ok(TAGS[s.target], `${m.id} target`);
    assert.ok(SAMPLE[s.target], `no sample for ${s.target}`);
    assert.equal(logic.checkSay(s, SAMPLE[s.target]).ok, true, `${m.id}: ${s.target}`);
    const off = logic.checkSay(s, "banana");
    assert.equal(off.ok, false, `${m.id}: nonsense accepted`);
    assert.ok(off.hint, `${m.id}: the miss gives a reminder`);
    assert.equal(logic.checkSay(s, "   ").empty, true);
  }
});

test("a run is independent only while no help is opened; independent and supported runs are counted apart", () => {
  const m = MISSIONS[0];
  const a = logic.newAttempt(m, "none");
  assert.equal(logic.isIndependent(a), true);
  logic.openHelp(a, "hint");
  assert.equal(logic.isIndependent(a), false);
  for (const support of ["bank", "frame"])
    assert.equal(logic.isIndependent(logic.newAttempt(m, support)), false, support);
  const b = logic.newAttempt(m, "none");
  logic.setSupport(b, "bank");
  logic.setSupport(b, "none");
  assert.equal(logic.isIndependent(b), false, "going back to none does not undo help already used");
  const prog = {};
  logic.finishAttempt(prog, logic.newAttempt(m, "none"), m);
  logic.finishAttempt(prog, logic.newAttempt(m, "frame"), m);
  logic.finishAttempt(prog, logic.newAttempt(m, "frame"), m);
  assert.deepEqual([prog[m.id].indep, prog[m.id].supp], [1, 2]);
  assert.equal(logic.missionStatus(prog, m.id), "independent");
  const only = {};
  logic.finishAttempt(only, logic.newAttempt(m, "bank"), m);
  assert.equal(logic.missionStatus(only, m.id), "supported");
  assert.equal(logic.missionStatus({}, m.id), "new");
  assert.deepEqual(logic.totalsFor(only, MISSIONS), {
    total: 12,
    independent: 0,
    supported: 1,
    left: 11,
  });
  assert.equal(logic.nextMission(only, MISSIONS).id, MISSIONS[1].id);
});

test("art: the map and six interiors are valid inline SVG with no external references", () => {
  const svgs = [
    art.cityMapSVG(),
    ...BUILDINGS.map((b) => art.interiorSVG(b, { npc: b.npc, learner: {}, mood: "happy" })),
    ...BUILDINGS.map((b) => art.facadeThumbSVG(b.id)),
  ];
  for (const svg of svgs) {
    assert.ok(svg.startsWith("<svg") && svg.trimEnd().endsWith("</svg>"));
    assert.ok(!/(href|src)=["']https?:/i.test(svg) && !/<script|<image|<foreignObject/i.test(svg));
    assert.equal((svg.match(/<svg/g) || []).length, (svg.match(/<\/svg>/g) || []).length);
    assert.ok(!/(?:purple|violet|indigo)/i.test(svg));
  }
  assert.ok(
    art.interiorSVG(BUILDINGS[0], { npc: BUILDINGS[0].npc, learner: {} }).includes("<title>"),
  );
});

// ── the pages, driven the way main.js drives them ─────────────────────────────
const ctxFor = (lang, id = "", missionId = "", band = "6-8") => {
  const ctx = makeCtx("city", { lang, band, id });
  ctx.route.missionId = missionId;
  return ctx;
};
async function open(lang, id, missionId) {
  const ctx = ctxFor(lang, id, missionId);
  const out = await mount(view, ctx);
  return { ctx, ...out };
}
const press = (ctx, root, sel) => click(view, ctx, root, sel);
const flat = (root) => root.textContent.replace(/\s+/g, " ");
const refresh = async (lang, id, missionId) => open(lang, id, missionId);

async function playMission(lang, building, mission, support, { help = null } = {}) {
  let { ctx, root } = await open(lang, building, mission);
  if (root.querySelector("[data-ct-replay]")) {
    press(ctx, root, "[data-ct-replay]");
    ({ ctx, root } = await refresh(lang, building, mission));
  }
  press(ctx, root, `[data-ct-support="${support}"]`);
  ({ ctx, root } = await refresh(lang, building, mission));
  press(ctx, root, "[data-ct-start]");
  ({ ctx, root } = await refresh(lang, building, mission));
  const m = missionOf(building, mission);
  for (const [i, step] of m.steps.entries()) {
    assert.ok(
      root.textContent.includes(
        lang === "es" ? `Paso ${i + 1} de ${m.steps.length}` : `Step ${i + 1} of ${m.steps.length}`,
      ),
    );
    if (help && i === 0) {
      press(ctx, root, `[data-ct-${help}]`);
      ({ ctx, root } = await refresh(lang, building, mission));
    }
    if (step.kind === "choose") {
      const wrong = step.opts.find((o) => o.id !== step.answer);
      press(ctx, root, `[data-ct-pick="${wrong.id}"]`);
      ({ ctx, root } = await refresh(lang, building, mission));
      assert.ok(root.querySelector(".wl-feedback.is-try"), "a wrong pick is explained");
      assert.ok(!root.querySelector("[data-ct-next]"), "a wrong pick does not open the next step");
      press(ctx, root, `[data-ct-pick="${step.answer}"]`);
    } else if (step.kind === "build") {
      const pool = step.tiles.map((t, k) => [t, k]);
      for (const word of step.ok[0]) {
        const at = pool.findIndex(([t]) => t === word);
        press(ctx, root, `[data-ct-tile="${pool[at][1]}"]`);
        pool.splice(at, 1);
        ({ ctx, root } = await refresh(lang, building, mission));
      }
      press(ctx, root, "[data-ct-check]");
    } else {
      type(view, ctx, root, "[data-ct-text]", SAMPLE[step.target], "onInput");
      press(ctx, root, "[data-ct-say]");
    }
    ({ ctx, root } = await refresh(lang, building, mission));
    assert.ok(root.querySelector("[data-ct-next]"), `${step.id} can go on`);
    press(ctx, root, "[data-ct-next]");
    ({ ctx, root } = await refresh(lang, building, mission));
  }
  return { ctx, root };
}

test("hub, building, progress and teacher pages render in English and Spanish with the map as links", async () => {
  resetStorage();
  const hub = await open("en", "");
  assert.equal(hub.root.querySelectorAll(".city-pin").length, 6);
  assert.ok(hub.root.querySelector("h1")?.textContent.includes("Language City"));
  assert.equal(hub.root.querySelectorAll("nav.city-map a[href]").length, 6);
  assert.equal(hub.root.querySelectorAll(".task-card.city-card").length, 6);
  assert.ok(
    !hub.root.querySelector("svg.city-map-svg a"),
    "SVG anchors are not used for navigation",
  );
  for (const b of BUILDINGS) assert.ok(hub.root.querySelector(`a[href*="/city/${b.id}"]`), b.id);
  assert.ok(!hub.root.textContent.match(SCORE_CLAIM));
  const es = await open("es", "");
  assert.ok(
    es.root.textContent.includes("Ciudad del lenguaje") &&
      es.root.textContent.includes("Mapa de la ciudad"),
  );
  const bld = await open("en", "cafe");
  assert.equal(bld.root.querySelectorAll("a[href*='/city/cafe/']").length, 2);
  assert.ok(
    bld.root.textContent.includes("Rosa") && bld.root.querySelector("svg.city-scene-svg title"),
  );
  const prog = await open("en", "progress");
  assert.equal(prog.root.querySelectorAll(".city-prog-list li").length, 12);
  assert.ok(flat(prog.root).includes("0 of 12 finished on my own"));
  const guide = await open("en", "teacher");
  assert.equal(guide.root.querySelectorAll("table.city-table").length, 2);
  assert.ok(
    guide.root.textContent.includes("a supported run is never counted as independent evidence"),
  );
  assert.ok(guide.root.textContent.includes("not enough evidence yet"));
  const guideEs = await open("es", "teacher");
  assert.ok(guideEs.root.textContent.includes("Apoyos e independencia"));
});

test("a mission on my own is recorded as independent; the same mission with a word bank is supported and counted apart", async () => {
  resetStorage();
  const before = ledger.loadLedger().entries.length;
  await playMission("en", "cafe", "order-lunch", "none");
  let entries = ledger.loadLedger().entries.filter((e) => e.src === "city");
  assert.equal(entries.length, before + 1);
  assert.equal(entries[0].stage, "independent");
  assert.equal(entries[0].task, "cafe/order-lunch");
  assert.equal(entries[0].kind, "first");
  assert.equal(entries[0].domain, "Speaking");
  assert.ok(!Object.values(entries[0].supports).some(Boolean));
  assert.ok(
    entries[0].m.steps === 6 && entries[0].m.firstTry < 6,
    "wrong first picks are not first-try",
  );
  assert.ok(
    !JSON.stringify(entries[0]).includes("Thank you for your help"),
    "typed words are never kept",
  );
  const { root } = await playMission("en", "cafe", "order-lunch", "bank");
  entries = ledger.loadLedger().entries.filter((e) => e.src === "city");
  assert.equal(entries.length, 2);
  assert.equal(entries[1].stage, "supported");
  assert.equal(entries[1].supports.bank, true);
  assert.equal(entries[1].kind, "retry");
  assert.ok(root.textContent.includes("Finished with support"));
  const saved = JSON.parse(localStorage.getItem("accessPracticeLab:v1:city"));
  assert.deepEqual([saved.prog["order-lunch"].indep, saved.prog["order-lunch"].supp], [1, 1]);
  const prog = await open("en", "progress");
  assert.ok(flat(prog.root).includes("1 of 12 finished on my own"));
  assert.ok(flat(prog.root).includes("1 on my own · 1 with support"));
});

test("opening a hint, Spanish help or the words of a listening step makes an otherwise independent run supported", async () => {
  for (const [help, key] of [
    ["hint", "hint"],
    ["es", "l1"],
  ]) {
    resetStorage();
    await playMission("en", "library", "get-a-card", "none", { help });
    const e = ledger
      .loadLedger()
      .entries.filter((x) => x.src === "city")
      .at(-1);
    assert.equal(e.stage, "supported", help);
    assert.equal(e.supports[key], true, help);
  }
});

test("a reload resumes the same mission on the same step; the Spanish player works end to end", async () => {
  resetStorage();
  let { ctx, root } = await open("en", "market", "buy-fruit");
  press(ctx, root, "[data-ct-start]");
  ({ ctx, root } = await refresh("en", "market", "buy-fruit"));
  const m = missionOf("market", "buy-fruit");
  press(ctx, root, `[data-ct-pick="${m.steps[0].answer}"]`);
  ({ ctx, root } = await refresh("en", "market", "buy-fruit"));
  press(ctx, root, "[data-ct-next]");
  const reloaded = await refresh("en", "market", "buy-fruit");
  assert.ok(reloaded.root.textContent.includes("Step 2 of 6"), "second step after a reload");
  assert.ok(
    reloaded.root.querySelector("[data-ct-say], .scn-bubble"),
    "the listening step is shown",
  );
  resetStorage();
  const { root: done } = await playMission("es", "station", "find-the-bus", "frame");
  assert.ok(
    done.textContent.includes("Misión terminada") &&
      done.textContent.includes("Terminada con apoyo"),
  );
});

test("controls are real buttons and links with names; the step has a live region and no timer", async () => {
  resetStorage();
  let { ctx, root } = await open("en", "clinic", "check-in");
  press(ctx, root, "[data-ct-start]");
  ({ ctx, root } = await refresh("en", "clinic", "check-in"));
  const controls = [
    ...root.querySelectorAll(
      "[data-ct-pick], [data-ct-tile], [data-ct-support], [data-ct-hint], [data-ct-es], [data-ct-words]",
    ),
  ];
  assert.ok(controls.length >= 6);
  for (const c of controls)
    assert.equal(c.tagName, "BUTTON", "a real button, so the keyboard works");
  assert.ok(root.querySelector("[aria-live='polite']"));
  assert.ok(
    root.querySelector("ol.city-pips[aria-label]") && root.querySelector("[aria-current='step']"),
  );
  assert.ok(!COUNTDOWN.test(root.textContent));
  assert.ok(root.querySelector("h1") && root.querySelector("h2#ct-step-h"));
});

test("route table and shared-file wiring are additive", async () => {
  const { readFileSync } = await import("node:fs");
  const main = readFileSync(new URL("../access-practice-lab/src/main.js", import.meta.url), "utf8");
  assert.ok(main.includes('city: () => import("./views/city.js")'));
  assert.ok(
    main.includes(
      'if (a === "city") return { ...r, view: "city", id: b || "", missionId: c || "" };',
    ),
  );
  const home = readFileSync(
    new URL("../access-practice-lab/src/home-registry.js", import.meta.url),
    "utf8",
  );
  assert.equal(
    (home.match(/href:\s*["']city["']/g) || []).length,
    1,
    "exactly one public home card, added when the module was verified",
  );
  const sw = readFileSync(new URL("../access-practice-lab/sw.js", import.meta.url), "utf8");
  assert.ok(
    sw.includes("/src/views/city.js") && sw.includes("/city.css"),
    "offline worker precaches the module",
  );
});
