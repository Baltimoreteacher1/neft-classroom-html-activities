// Real-Life Scenarios: every scene is a sound branching graph with three choices per turn, original language-target feedback
// in both languages and valid art; the wording check agrees with the lines the scenes teach; the player works from the keyboard.
import assert from "node:assert/strict";
import test from "node:test";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";
import { click, EMOJI, makeCtx, mount, resetStorage, type } from "./lib/access-studios-dom.mjs";

const { SCENES } = await import("../access-practice-lab/src/content/scenarios.js");
const logic = await import("../access-practice-lab/src/lang/scenarios.js");
const art = await import("../access-practice-lab/src/views/scenario-art.js");
const sc = await import("../access-practice-lab/src/views/scenarios.js");
const ledger = await import("../access-practice-lab/src/lang/ledger.js");

const SKIN = new Set(["#f5d5b8", "#f1c9a5", "#e0ac84", "#c68642", "#8d5524", "#5c3a21"]);
const STYLES = new Set([
  "short",
  "long",
  "curly",
  "bun",
  "braids",
  "hijab",
  "cap",
  "bald",
  "ponytail",
  "afro",
]);
const MOODS = new Set(["neutral", "happy", "puzzled", "concerned", "pleased"]);
const COUNTDOWN = /\b(countdown|beat the clock|time is up|words per minute|seconds left)\b/i; // dialogue may say "in a hurry"; the chrome may not
const words = (s) => s.trim().split(/\s+/).length;
const ctxFor = (lang, id = "", band = "6-8") => makeCtx("scenarios", { lang, band, id });

function reach(scene) {
  const seen = new Set();
  const walk = (id, stack) => {
    assert.ok(scene.nodes[id], `${scene.id}: missing node ${id}`);
    assert.ok(!stack.includes(id), `${scene.id}: cycle at ${id}`);
    seen.add(id);
    for (const c of scene.nodes[id].choices || []) walk(c.next, [...stack, id]);
  };
  walk(scene.start, []);
  return seen;
}

test("27 original scenes: 13 for grades 3-5 and 14 for 6-8", () => {
  assert.ok(SCENES.length >= 24);
  assert.equal(SCENES.filter((s) => s.b === "3-5").length, 13);
  assert.equal(SCENES.filter((s) => s.b === "6-8").length, 14);
  assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
  const places = new Set(SCENES.map((s) => s.place));
  for (const p of ["office", "clinic", "bus", "store", "lunch", "classroom", "phone", "library"])
    assert.ok(places.has(p), `place ${p}`);
  for (const p of places) assert.ok(art.PLACE_IDS.includes(p), `art for ${p}`);
});

test("every scene is a DAG with reachable nodes, three choices a turn, tags, Spanish and sensible length", () => {
  const allTags = new Set();
  for (const s of SCENES) {
    for (const k of ["title", "titleEs", "goal", "goalEs"]) assert.ok(s[k], `${s.id}.${k}`);
    for (const who of [s.npc, s.npc2].filter(Boolean)) {
      assert.ok(who.name && who.role && who.roleEs, s.id);
      assert.ok(SKIN.has(who.look.skin) && STYLES.has(who.look.style), `${s.id} look`);
    }
    const seen = reach(s);
    assert.equal(seen.size, Object.keys(s.nodes).length, `${s.id}: unreachable nodes`);
    const ends = Object.values(s.nodes).filter((n) => n.end);
    assert.ok(
      ends.length >= 2 && new Set(ends.map((e) => e.outcome)).size >= 2,
      `${s.id}: needs two kinds of ending`,
    );
    const lens = logic.pathLengths(s);
    assert.ok(
      lens.max >= 4 && lens.max <= 6 && lens.min >= 2,
      `${s.id}: path ${lens.min}-${lens.max}`,
    );
    for (const [id, n] of Object.entries(s.nodes)) {
      assert.ok(n.say && n.sayEs && MOODS.has(n.mood), `${s.id}.${id}`);
      if (n.end) {
        assert.ok(n.wrap && n.wrapEs, `${s.id}.${id} wrap`);
        continue;
      }
      assert.equal(n.choices.length, 3, `${s.id}.${id}: three choices`);
      assert.ok(
        n.choices.some((c) => c.q === 2),
        `${s.id}.${id}: no strong choice`,
      );
      assert.ok(
        n.choices.some((c) => c.q < 2),
        `${s.id}.${id}: no weaker choice`,
      );
      for (const c of n.choices) {
        assert.ok(c.say && c.sayEs && c.why && c.whyEs, `${s.id}.${id}.${c.id}`);
        assert.ok(logic.TAGS[c.tag], `${s.id}: tag ${c.tag}`);
        assert.ok([0, 1, 2].includes(c.q));
        assert.ok(
          words(c.say) <= (s.b === "3-5" ? 16 : 26),
          `${s.id}.${id}.${c.id}: too long (${words(c.say)})`,
        );
        assert.ok(words(c.why) <= 30, `${s.id}.${id}.${c.id}: feedback too long`);
        assert.notEqual(c.say, c.sayEs);
        if (c.q === 2) allTags.add(c.tag);
      }
    }
    for (const t of s.focus)
      assert.ok(
        Object.values(s.nodes).some((n) => n.choices?.some((c) => c.q === 2 && c.tag === t)),
        `${s.id}: focus ${t} never modeled`,
      );
  }
  for (const t of logic.TAG_IDS)
    assert.ok(allTags.has(t), `tag ${t} is modeled by a strong choice somewhere`);
});

test("the strong choice is spread across positions a, b and c", () => {
  const pos = { a: 0, b: 0, c: 0 };
  for (const s of SCENES)
    for (const n of Object.values(s.nodes))
      if (!n.end) for (const c of n.choices) if (c.q === 2) pos[c.id] = (pos[c.id] || 0) + 1;
  const total = pos.a + pos.b + pos.c;
  for (const k of ["a", "b", "c"])
    assert.ok(pos[k] / total > 0.2, `position ${k} holds ${pos[k]} of ${total}`);
});

test("the wording check accepts the strong lines that model each target and rejects empty or off-target text", () => {
  let tried = 0;
  const bad = [];
  for (const s of SCENES)
    for (const n of Object.values(s.nodes))
      if (!n.end)
        for (const c of n.choices)
          if (c.q === 2) {
            tried += 1;
            if (!logic.checkLine(c.tag, c.say).ok) bad.push(`${s.id}: [${c.tag}] ${c.say}`);
          }
  assert.ok(tried > 150);
  assert.ok(
    bad.length / tried < 0.1,
    `${bad.length} of ${tried} strong lines fail their own wording check:\n${bad.slice(0, 15).join("\n")}`,
  );
  assert.equal(logic.checkLine("request", "").empty, true);
  assert.equal(logic.checkLine("request", "Give me a pass.").ok, false);
  assert.equal(logic.checkLine("request", "May I have a pass, please?").ok, true);
  assert.equal(logic.checkLine("question", "Where is the library?").ok, true);
  assert.equal(logic.checkLine("question", "Tell me the library.").ok, false);
  assert.equal(logic.checkLine("apologize", "I am sorry I am late.").ok, true);
  assert.equal(
    logic.checkLine("disagree", "I see your point, but maybe we could try my plan.").ok,
    true,
  );
  assert.equal(logic.checkLine("disagree", "No, that is wrong.").ok, false);
});

test("character and scene art is inline SVG with a title and no external references", () => {
  for (const s of SCENES) {
    const svg = art.sceneSVG(s, { mood: "happy", learner: art.LEARNER_LOOKS[0] });
    assert.match(svg, /^<svg/);
    assert.match(svg, /<title>/);
    assert.doesNotMatch(svg, /<script|href=|<image|url\(http/i);
    assert.ok(art.placeThumbSVG(s).includes("<svg"));
  }
  for (const style of STYLES)
    assert.match(
      art.characterSVG(
        { style, skin: "#c68642", hair: "#111", shirt: "#336", acc: "glasses" },
        "puzzled",
      ),
      /<g/,
    );
});

test("transcript and summary report the language used and the stronger alternative", () => {
  const s = SCENES.find((x) => x.id === "s35-late-pass");
  const path = [];
  let id = s.start;
  while (!s.nodes[id].end) {
    const c = s.nodes[id].choices.find((x) => x.q === 0) || s.nodes[id].choices[0];
    path.push({ n: id, c: c.id });
    id = c.next;
  }
  const sum = logic.summarize(s, path);
  assert.equal(sum.turns, path.length);
  assert.ok(sum.weak >= 1);
  assert.equal(sum.end?.end, true);
  const t = logic.transcript(s, path);
  assert.ok(t.turns.every((x) => x.strong?.q === 2));
});

test("hub and every scene render in English, Spanish and bilingual with no timers, scores or emoji", async () => {
  resetStorage();
  for (const band of ["3-5", "6-8"]) {
    for (const lang of ["en", "es", "bi"]) {
      const hub = await mount(sc, ctxFor(lang, "", band));
      assert.ok(hub.root.querySelector("h1"));
      for (const s of SCENES.filter((x) => x.b === band))
        assert.ok(
          hub.root.querySelector(`a[href*="/scenarios/${s.id}"]`),
          `${band} hub lists ${s.id}`,
        );
      assert.doesNotMatch(hub.text, COUNTDOWN);
      assert.doesNotMatch(hub.text, SCORE_CLAIM);
    }
  }
  for (const s of SCENES) {
    for (const lang of ["en", "es"]) {
      const m = await mount(sc, ctxFor(lang, s.id, s.b));
      assert.ok(m.root.querySelector("svg.scn-svg"), `${s.id}: art`);
      assert.equal(m.root.querySelectorAll("[data-sc-choose]").length, 3, s.id);
      assert.doesNotMatch(m.root.innerHTML, EMOJI);
      assert.doesNotMatch(m.text, COUNTDOWN);
    }
  }
  const es = await mount(sc, ctxFor("es", "s35-late-pass", "3-5"));
  assert.match(es.text, /Tu meta/);
});

test("play through: choose, hear the feedback, undo a weak choice, finish, say it, replay; evidence holds counts only", async () => {
  resetStorage();
  const s = SCENES.find((x) => x.id === "s68-extension") || SCENES.find((x) => x.b === "6-8");
  const ctx = ctxFor("en", s.id, "6-8");
  let m = await mount(sc, ctx);
  // First turn: pick a weak choice, read feedback, undo, then play strong lines to the end.
  const weak = s.nodes[s.start].choices.find((c) => c.q < 2);
  click(sc, ctx, m.root, `[data-sc-choose="${weak.id}"]`);
  m = await mount(sc, ctx);
  assert.match(m.root.querySelector(".wl-feedback").textContent, /Understood|confuse/);
  assert.ok(m.root.querySelector("[data-sc-undo]"));
  click(sc, ctx, m.root, "[data-sc-undo]");
  m = await mount(sc, ctx);
  assert.equal(m.root.querySelector(".wl-feedback"), null);
  let guard = 0;
  while (!m.root.querySelector(".scn-summary") && guard++ < 10) {
    const st = JSON.parse(localStorage.getItem(sc.SC_KEY));
    const cur = st.cur?.path || [];
    const nodeId = cur.length
      ? s.nodes[cur.at(-1).n].choices.find((c) => c.id === cur.at(-1).c).next
      : s.start;
    const strong = s.nodes[nodeId].choices.find((c) => c.q === 2);
    click(sc, ctx, m.root, `[data-sc-choose="${strong.id}"]`);
    m = await mount(sc, ctx);
    click(sc, ctx, m.root, "[data-sc-continue]");
    m = await mount(sc, ctx);
  }
  assert.ok(m.root.querySelector(".scn-summary"), "reached the summary");
  assert.ok(m.root.querySelector(".scn-used li"), "language used is listed");
  assert.ok(m.root.querySelector(".scn-say-it"), "say it step");
  const lines = m.root.querySelectorAll(".scn-say-item");
  assert.ok(lines.length >= 3);
  type(sc, ctx, m.root, '[data-sc-text="0"]', "", "onInput");
  click(sc, ctx, m.root, '[data-sc-check="0"]');
  m = await mount(sc, ctx);
  assert.match(m.root.querySelector(".scn-say-item").textContent, /Type or say something first/);
  const first = JSON.parse(localStorage.getItem(sc.SC_KEY));
  const firstLine = SCENES.find((x) => x.id === s.id);
  type(
    sc,
    ctx,
    m.root,
    '[data-sc-text="0"]',
    "Could you please help me, because I need more time?",
    "onInput",
  );
  click(sc, ctx, m.root, '[data-sc-check="0"]');
  m = await mount(sc, ctx);
  assert.ok(m.root.querySelector(".scn-say-item .wl-feedback"));
  assert.equal(first.done[s.id].runs, 1);
  assert.ok(firstLine);
  const entries = JSON.parse(localStorage.getItem(ledger.LEDGER_KEY)).entries.filter(
    (e) => e.src === "scenario",
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0].domain, "Speaking");
  assert.ok(Object.values(entries[0].m).every((v) => typeof v === "number"));
  click(sc, ctx, m.root, "[data-sc-replay]");
  m = await mount(sc, ctx);
  assert.equal(m.root.querySelector(".scn-summary"), null);
  assert.equal(m.root.querySelectorAll("[data-sc-choose]").length, 3);
});

test("the typed fallback exists when the browser cannot record", async () => {
  const s = SCENES[0];
  const ctx = ctxFor("en", s.id, s.b);
  resetStorage();
  let m = await mount(sc, ctx);
  let node = s.start;
  while (!s.nodes[node].end) {
    const c = s.nodes[node].choices.find((x) => x.q === 2);
    click(sc, ctx, m.root, `[data-sc-choose="${c.id}"]`);
    m = await mount(sc, ctx);
    click(sc, ctx, m.root, "[data-sc-continue]");
    m = await mount(sc, ctx);
    node = c.next;
  }
  assert.ok(
    m.root.querySelectorAll("textarea[data-sc-text]").length >= 3,
    "typed box for every line",
  );
  assert.match(m.text, /never your accent/);
});
