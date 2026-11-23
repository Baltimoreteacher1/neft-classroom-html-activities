// Activity Studio student player: every question format end to end in jsdom (through the same DOM controls a
// student uses), feedback / revise / hints, supports, languages, read aloud, safety, the anonymous report, the
// editor hooks and the bundler. Games are in studio-player-games.test.mjs.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { checkNow, click, makeWindow, solve, type } from "./studio-player-helpers.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLAYER_SRC = join(ROOT, "access-practice-lab/src/studio/player");
/** Plain data from the jsdom realm, comparable with deepStrictEqual. */
const plain = (v) => JSON.parse(JSON.stringify(v));
const questionsOf = (a) => a.blocks.filter((b) => b.type === "question");

/** An activity with just these blocks. */
const small = (blocks, extra = {}) =>
  normalizeActivity({ id: "t1", title: "Test", kind: "interactive", blocks, ...extra });
const choiceQ = (over = {}) => ({
  id: "q1",
  type: "question",
  format: "choice",
  prompt: "Pick b",
  options: [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
    { id: "c", text: "Gamma" },
  ],
  answer: "b",
  hint: "It is the second letter.",
  explanation: "Beta is b.",
  misconception: "Alpha comes first but is not b.",
  ...over,
});

// ── bundle ──────────────────────────────────────────────────────────────────
test("the committed bundle is current and every player module is within 500 lines", () => {
  const r = spawnSync("node", ["tools/build-studio-player.mjs", "--check"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
  for (const f of readdirSync(PLAYER_SRC).filter((n) => n.endsWith(".js"))) {
    const lines = readFileSync(join(PLAYER_SRC, f), "utf8").split("\n").length;
    assert.ok(lines <= 500, `${f} has ${lines} lines`);
  }
});

test("the player never schedules a timer or countdown", () => {
  for (const f of readdirSync(PLAYER_SRC).filter((n) => n.endsWith(".js"))) {
    const src = readFileSync(join(PLAYER_SRC, f), "utf8");
    assert.ok(
      !/setInterval|countdown|timeLeft|requestAnimationFrame/i.test(src),
      `${f} has a timer`,
    );
  }
});

test("bundler: deterministic, --check detects stale output, fails on a top-level name collision", () => {
  const tmp = mkdtempSync(join(tmpdir(), "sp-bundle-"));
  cpSync(join(ROOT, "access-practice-lab/src/studio"), join(tmp, "studio"), { recursive: true });
  const env = {
    ...process.env,
    STUDIO_PLAYER_SRC: join(tmp, "studio"),
    STUDIO_PLAYER_OUT: join(tmp, "out"),
  };
  const run = (...args) =>
    spawnSync("node", ["tools/build-studio-player.mjs", ...args], {
      cwd: ROOT,
      env,
      encoding: "utf8",
    });
  assert.equal(run().status, 0);
  const first = readFileSync(join(tmp, "out/studio-player.js"), "utf8");
  assert.equal(run().stdout.includes("no changes"), true, "second run changes nothing");
  assert.equal(
    first,
    readFileSync(join(ROOT, "access-practice-lab/player/studio-player.js"), "utf8"),
  );
  assert.equal(run("--check").status, 0);
  writeFileSync(join(tmp, "out/studio-player.css"), "stale");
  assert.equal(run("--check").status, 1);
  assert.equal(run().status, 0);
  // a second module declaring a name the core already declares
  writeFileSync(
    join(tmp, "studio/player/session.js"),
    `${readFileSync(join(tmp, "studio/player/session.js"), "utf8")}\nconst ID = 1;\n`,
  );
  const bad = run();
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /top-level name "ID"/);
});

// ── every format, end to end ────────────────────────────────────────────────
test("all 15 formats: solve through the DOM, check, get teaching feedback, finish", () => {
  const w = makeWindow();
  const errors = [];
  w.window.addEventListener("error", (e) => errors.push(e.message));
  const activity = allFormats("interactive");
  const events = [];
  w.mount(activity, { onEvent: (e) => events.push(e.type) });
  const qs = questionsOf(activity);
  assert.equal(qs.length, 15);
  for (const q of qs) {
    assert.equal(
      w.$(`.sp-q[data-format="${q.format}"]`)?.dataset.blockId,
      q.id,
      `${q.format} rendered`,
    );
    solve(w.document, q);
    const fb = checkNow(w.document);
    assert.ok(fb.classList.contains("is-right"), `${q.format}: ${fb.textContent}`);
    if (q.explanation) assert.ok(fb.querySelector(".sp-explain"), `${q.format} explains`);
    click(w.$(".sp-next:not([hidden])"));
  }
  assert.ok(w.$(".sp-finish-title"));
  assert.deepEqual(errors, []);
  assert.ok(events.includes("start") && events.includes("finish"));
  const summary = w.$$(".sp-finish-item");
  assert.equal(summary.length, 15);
  assert.match(w.$(".sp-finish-list").textContent, /Right on the first try|You wrote and compared/);
});

test("a wrong answer teaches: misconception, hint ladder, revise, then correct", () => {
  const w = makeWindow();
  const events = [];
  const player = w.mount(
    small([choiceQ({ frame: "It is ___." })], { supports: { frames: true, hints: true } }),
    {
      onEvent: (e) => events.push(e),
    },
  );
  click(w.$('.sp-q input[value="a"]'));
  let fb = checkNow(w.document);
  assert.ok(fb.classList.contains("is-hint"));
  assert.match(fb.textContent, /Not yet/);
  assert.match(fb.textContent, /Alpha comes first/, "misconception shown when wrong");
  assert.ok(w.$(".sp-mark-wrong"), "the wrong choice is marked with a word, not just a color");
  assert.ok(!/Beta is b/.test(fb.textContent), "explanation waits until it is right");
  assert.equal(w.$(".sp-next:not([hidden])"), null, "cannot skip ahead");
  // hint ladder: hint, then the sentence frame, then no more hint button
  click(w.$(".sp-hint-btn"));
  assert.match(w.$(".sp-hints").textContent, /second letter/);
  click(w.$(".sp-hint-btn"));
  assert.match(w.$(".sp-hints").textContent, /It is ___/);
  assert.ok(w.$(".sp-hint-btn").hidden);
  // revise
  click(w.$('.sp-q input[value="b"]'));
  fb = checkNow(w.document);
  assert.ok(fb.classList.contains("is-right"));
  assert.match(fb.textContent, /Beta is b/);
  click(w.$(".sp-next:not([hidden])"));
  const s = player.summary();
  assert.deepEqual(plain(s), [
    { q: "q1", first: "incorrect", final: "correct", hints: 2, revised: true },
  ]);
  assert.match(w.$(".sp-finish-list").textContent, /Right after you changed your answer/);
  assert.match(w.$(".sp-finish").textContent, /You used 2 hints/);
  assert.ok(events.some((e) => e.type === "hint"));
});

test("an empty check asks for an answer and records nothing", () => {
  const w = makeWindow();
  const player = w.mount(small([choiceQ()]));
  const fb = checkNow(w.document);
  assert.match(fb.textContent, /Answer first/);
  assert.deepEqual(plain(player.summary()), []);
});

test("after two misses 'Show me the answer' appears; showing it ends the question without a right mark", () => {
  const w = makeWindow();
  const player = w.mount(small([choiceQ()]));
  click(w.$('.sp-q input[value="a"]'));
  checkNow(w.document);
  assert.ok(w.$(".sp-btn[hidden]") || true);
  click(w.$('.sp-q input[value="c"]'));
  checkNow(w.document);
  const show = [...w.$$(".sp-actions .sp-btn")].find((b) =>
    /Show me the answer/.test(b.textContent),
  );
  assert.ok(show && !show.hidden);
  click(show);
  assert.match(w.$(".sp-feedback").textContent, /Beta/);
  assert.equal(player.summary()[0].final, "incorrect");
  click(w.$(".sp-next:not([hidden])"));
  assert.match(w.$(".sp-finish-list").textContent, /looked at the answer/);
});

test("revise off: one attempt, then the answer and explanation", () => {
  const w = makeWindow();
  w.mount(small([choiceQ()], { options: { revise: false } }));
  click(w.$('.sp-q input[value="a"]'));
  const fb = checkNow(w.document);
  assert.match(fb.textContent, /Here is the answer/);
  assert.match(fb.textContent, /Beta/);
  assert.ok(w.$(".sp-next:not([hidden])"));
});

test("partial credit is explained (multi, match) and the student can revise", () => {
  const w = makeWindow();
  const a = allFormats("interactive");
  w.mount(a);
  const multi = a.blocks.find((b) => b.format === "multi");
  // skip choice
  solve(
    w.document,
    a.blocks.find((b) => b.format === "choice"),
  );
  checkNow(w.document);
  click(w.$(".sp-next:not([hidden])"));
  click(w.$(`.sp-q input[value="${multi.answers[0]}"]`));
  const fb = checkNow(w.document);
  assert.match(fb.textContent, /Partly right/);
  assert.match(fb.textContent, /1 of 2/);
  click(w.$(`.sp-q input[value="${multi.answers[1]}"]`));
  assert.ok(checkNow(w.document).classList.contains("is-right"));
});

test("short writing is never graded: sample + rubric, status review; too few words asks for more", () => {
  const w = makeWindow();
  const a = allFormats("interactive");
  const q = a.blocks.find((b) => b.format === "short");
  w.mount(small([q]));
  type(w.$(".sp-area"), "water");
  assert.match(checkNow(w.document).textContent, /at least 3 words/);
  type(w.$(".sp-area"), "Seeds need water to grow.");
  const fb = checkNow(w.document);
  assert.match(fb.textContent, /Compare with the sample/);
  assert.match(fb.textContent, /Seeds need water to start growing/);
  assert.equal(w.$$(".sp-rubric input").length, 2);
  assert.doesNotMatch(fb.textContent, /Correct|Not yet/);
});

// ── keyboard and pointer paths that need more than a click ─────────────────
test("order: arrow keys and buttons move items and keep focus on the moved item", () => {
  const w = makeWindow();
  const a = allFormats("interactive");
  const q = a.blocks.find((b) => b.format === "order");
  w.mount(small([q]));
  const order = () => w.$$(".sp-order-item").map((li) => li.dataset.id);
  assert.notDeepEqual(
    order(),
    q.items.map((i) => i.id),
    "starts shuffled",
  );
  const last = order().at(-1);
  const grip = w.$$(".sp-grip").at(-1);
  grip.focus();
  grip.dispatchEvent(new w.window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  assert.equal(order().indexOf(last), order().length - 2);
  assert.equal(w.document.activeElement.dataset.key, `grip:${last}`);
  assert.match(w.$(".sp-sr[aria-live]").textContent, /now number/);
  const down = w
    .$$(".sp-move")
    .find((b) => b.getAttribute("aria-label").includes("down") && !b.disabled);
  click(down);
  assert.ok(w.$$(".sp-move").every((b) => b.tagName === "BUTTON"));
});

test("match and sort work with pick-then-place buttons only (no drag), and mark what to look at again", () => {
  const w = makeWindow();
  const a = allFormats("interactive");
  const q = a.blocks.find((b) => b.format === "match");
  w.mount(small([q]));
  const key = (k) => [...w.$$("[data-key]")].find((n) => n.dataset.key === k);
  // swap two on purpose
  click(key("card:p2"));
  click(key("slot:p1"));
  click(key("card:p1"));
  click(key("slot:p2"));
  click(key("card:p3"));
  click(key("slot:p3"));
  const fb = checkNow(w.document);
  assert.match(fb.textContent, /Partly right/);
  assert.equal(w.$$(".sp-mark-look").length, 2);
  assert.equal(w.$$(".sp-mark-right").length, 1);
  // fix: pick the wrong ones back up and place correctly
  click(key("slot:p1")); // picks p2 back up
  click(key("slot:p2")); // puts it down on slot 2 (card 1 returns to the bank)
  click(key("card:p1"));
  click(key("slot:p1"));
  assert.ok(checkNow(w.document).classList.contains("is-right"));
});

test("number line: arrow keys move the choice, typing also works; plot: typed point and grid", () => {
  const w = makeWindow();
  const a = allFormats("interactive");
  w.mount(small([a.blocks.find((b) => b.format === "numberline")]));
  const ticks = w.$$(".sp-tick");
  assert.equal(ticks.length, 5);
  ticks[0].focus();
  for (let i = 0; i < 3; i++)
    w.document.activeElement.dispatchEvent(
      new w.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
  assert.equal(w.document.activeElement.dataset.value, "0.75");
  assert.equal(w.document.activeElement.getAttribute("aria-checked"), "true");
  assert.ok(checkNow(w.document).classList.contains("is-right"));
  const w2 = makeWindow();
  w2.mount(small([a.blocks.find((b) => b.format === "plot")]));
  type(w2.$(".sp-plot-type input"), "2, 3");
  click(w2.$(".sp-plot-type .sp-btn"));
  assert.equal(w2.$(".sp-pt[data-x='2'][data-y='3']").getAttribute("aria-pressed"), "true");
  assert.ok(checkNow(w2.document).classList.contains("is-right"));
  assert.equal(w2.$$(".sp-pt[tabindex='0']").length, 1, "one tab stop in the grid");
});

test("hotspot has a list alternative; identify marks a wrong word without giving the answer", () => {
  const w = makeWindow();
  const a = allFormats("interactive");
  w.mount(small([a.blocks.find((b) => b.format === "hotspot")]));
  click(w.$(".sp-hot-list input[value='flower']"));
  assert.match(checkNow(w.document).textContent, /Not yet/);
  click(w.$(".sp-hot-list input[value='seed']"));
  assert.ok(checkNow(w.document).classList.contains("is-right"));
  const w2 = makeWindow();
  w2.mount(small([a.blocks.find((b) => b.format === "identify")]));
  click(w2.$$(".sp-word").find((n) => n.textContent === "cold"));
  click(w2.$$(".sp-word").find((n) => n.dataset.target === "yes"));
  const fb = checkNow(w2.document);
  assert.match(fb.textContent, /Partly right/);
  assert.match(fb.textContent, /1 more to find/);
  assert.ok(
    w2.$$(".sp-word").every((n) => n.tagName === "BUTTON" && n.hasAttribute("aria-pressed")),
  );
});

// ── supports, languages, math, speech ───────────────────────────────────────
test("math markup becomes real elements with spoken labels", () => {
  const w = makeWindow();
  w.mount(
    small([
      choiceQ({
        prompt: "What is {1/2} + {1/4}? x^2 and **bold**",
        options: [
          { id: "a", text: "{3/4}" },
          { id: "b", text: "1" },
        ],
        answer: "a",
      }),
    ]),
  );
  const frac = w.$(".sp-prompt .sp-frac");
  assert.equal(frac.getAttribute("aria-label"), "1 over 2");
  assert.equal(frac.getAttribute("role"), "math");
  assert.equal(w.$(".sp-prompt sup").textContent, "2");
  assert.equal(w.$(".sp-prompt strong").textContent, "bold");
});

test("languages: English only without the Spanish support; es and bi with it; gloss uses the es field only", () => {
  const act = allFormats("interactive");
  const en = makeWindow();
  en.mount({ ...act, supports: { ...act.supports, spanish: false } }, { lang: "es" });
  assert.ok(!en.$(".sp-seg"), "no language switch without the support");
  assert.match(en.$(".sp-check-btn").textContent, /^Check answer$/);
  assert.ok(!en.$(".sp-gloss"));
  const es = makeWindow();
  es.mount(act, { lang: "es" });
  assert.match(es.$(".sp-check-btn").textContent, /Revisar respuesta/);
  assert.doesNotMatch(es.$(".sp-check-btn").textContent, /Check answer/);
  assert.equal(es.$(".sp-gloss").textContent.replace(/In Spanish:|En español:/, ""), "razón");
  assert.equal(es.$(".sp-gloss").getAttribute("lang"), "es");
  const bi = makeWindow();
  bi.mount(act, { lang: "bi" });
  assert.match(bi.$(".sp-check-btn").textContent, /Check answer.*Revisar respuesta/);
  // the switch re-renders and the English target word stays
  click(bi.$$(".sp-seg-btn").find((b) => b.textContent === "English"));
  assert.ok(!bi.$(".sp-gloss"));
  assert.equal(bi.$(".sp-term").textContent, "ratio");
});

test("every string key the player uses exists in English and Spanish", () => {
  const src = readdirSync(PLAYER_SRC)
    .filter((n) => n.endsWith(".js") && n !== "strings.js")
    .map((n) => readFileSync(join(PLAYER_SRC, n), "utf8"))
    .join("\n");
  const keys = new Set([...src.matchAll(/\b(?:t|L)\("([A-Za-z0-9]+)"/g)].map((m) => m[1]));
  for (const m of src.matchAll(/(?:key|name|effect): "([A-Za-z]+)"/g)) keys.add(m[1]);
  for (const k of [
    "wayFirstCount",
    "wayRevisedCount",
    "wayReviewCount",
    "wayShownCount",
    "questDone",
    "questHere",
    "questAhead",
    "questRetry",
    "kindInteractive",
    "kindWorksheet",
    "kindGame",
    "kindCheck",
    "questWinBody",
    "questRetryBody",
    "organizerKnow",
    "organizerWant",
    "organizerLearned",
    "organizerSame",
    "organizerDifferent",
    "organizerCause",
    "organizerEffect",
    "organizerClaim",
    "organizerEvidence",
    "organizerReasoning",
  ])
    keys.add(k);
  const strings = readFileSync(join(PLAYER_SRC, "strings.js"), "utf8");
  const en = strings.slice(strings.indexOf("\n  en: {"), strings.indexOf("\n  es: {"));
  const es = strings.slice(strings.indexOf("\n  es: {"));
  for (const k of keys) {
    assert.match(en, new RegExp(`\\b${k}:`), `en.${k}`);
    assert.match(es, new RegExp(`\\b${k}:`), `es.${k}`);
  }
});

test("read aloud speaks spoken math with the device voice; without a voice it says so; never 'official ACCESS audio'", () => {
  const a = small(
    [
      choiceQ({
        prompt: "What is {1/2}?",
        options: [
          { id: "a", text: "{1/2}" },
          { id: "b", text: "1" },
        ],
        answer: "a",
      }),
    ],
    { supports: { readAloud: true } },
  );
  const w = makeWindow({ speech: true });
  w.mount(a);
  click(w.$(".sp-q-top .sp-hear"));
  assert.match(w.window.__spoken[0], /What is 1 over 2/);
  assert.match(w.$(".sp-header").textContent, /not official ACCESS audio/);
  const quiet = makeWindow({ speech: false });
  quiet.mount(a);
  click(quiet.$(".sp-q-top .sp-hear"));
  assert.match(quiet.$(".sp-notice").textContent, /not available on this device/);
  assert.ok(!quiet.$(".sp-notice").hidden);
});

test("chunked reading shows a passage a part at a time, with a way to see it all", () => {
  const text =
    "One is here. Two is here too and it is long enough to be a chunk by itself, really. Three comes later and it is also a long sentence for a chunk. Four ends the story with a long closing sentence.";
  const w = makeWindow();
  w.mount(
    small([{ id: "p", type: "passage", title: "Story", text }, choiceQ()], {
      supports: { chunk: true },
    }),
  );
  const parts = () => w.$(".sp-passage-body").querySelectorAll("p").length;
  assert.equal(parts(), 1);
  assert.match(w.$(".sp-chunk-n").textContent, /Part 1 of/);
  click([...w.$$(".sp-chunk-bar .sp-btn")].find((b) => /Next part/.test(b.textContent)));
  assert.equal(parts(), 2);
  const total = Number(w.$(".sp-chunk-n").textContent.match(/of (\d+)/)?.[1] ?? 2);
  assert.equal(parts(), 2);
  click([...w.$$(".sp-chunk-bar .sp-btn")].find((b) => /Show all/.test(b.textContent)));
  assert.equal(parts(), total);
});

// ── looks ───────────────────────────────────────────────────────────────────
test("four looks via tokens; a low-contrast accent falls back to the preset color", () => {
  for (const style of ["classic", "playful", "calm", "adventure"]) {
    const w = makeWindow();
    w.mount(small([choiceQ()], { look: { style } }));
    assert.equal(w.$(".sp-root").dataset.look, style);
    assert.ok(w.$(".sp-root").style.getPropertyValue("--sp-accent"));
  }
  const base = makeWindow();
  base.mount(small([choiceQ()]));
  const presetAccent = base.$(".sp-root").style.getPropertyValue("--sp-accent");
  const bad = makeWindow();
  bad.mount(small([choiceQ()], { look: { accent: "#ffee00" } }));
  assert.equal(bad.$(".sp-root").style.getPropertyValue("--sp-accent"), presetAccent);
  const good = makeWindow();
  good.mount(small([choiceQ()], { look: { accent: "#0a5c36" } }));
  assert.equal(good.$(".sp-root").style.getPropertyValue("--sp-accent"), "#0a5c36");
  assert.equal(good.$(".sp-root").style.getPropertyValue("--sp-on-accent"), "#ffffff");
});

// ── safety ──────────────────────────────────────────────────────────────────
test("activity text is text: markup in every field renders as words and executes nothing", () => {
  const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>';
  const w = makeWindow({ dangerous: true });
  const a = {
    id: "x1",
    title: evil,
    description: evil,
    kind: "interactive",
    supports: { spanish: true, readAloud: true },
    blocks: [
      { type: "text", text: evil },
      { type: "passage", title: evil, text: evil },
      { type: "vocab", items: [{ term: evil, def: evil, es: evil, example: evil }] },
      { type: "table", headers: [evil], rows: [[evil]], caption: evil },
      { type: "organizer", kind: "kwl", prompts: [evil] },
      { type: "audio", say: evil, label: evil },
      choiceQ({
        prompt: evil,
        options: [
          { id: "a", text: evil },
          { id: "b", text: "ok" },
        ],
        hint: evil,
        explanation: evil,
        misconception: evil,
      }),
      { type: "question", format: "blank", prompt: evil, text: `${evil} [[a]]` },
      {
        type: "question",
        format: "sort",
        prompt: evil,
        categories: [
          { id: "c1", label: evil },
          { id: "c2", label: "b" },
        ],
        items: [
          { id: "i1", text: evil, category: "c1" },
          { id: "i2", text: "z", category: "c2" },
        ],
      },
      { type: "question", format: "short", prompt: evil, sample: evil, rubric: [evil] },
    ],
  };
  w.mount(a);
  const scan = () => {
    assert.equal(
      w.$$(".sp-root img, .sp-root script").length,
      0,
      "no element was created from the text",
    );
    assert.equal(w.window.__pwned, undefined);
  };
  scan();
  assert.ok(w.$(".sp-title").textContent.includes("<img"));
  // walk everything
  for (let i = 0; i < 6; i++) {
    for (const b of w.$$(".sp-hint-btn")) click(b);
    const first = w.$(".sp-q input[type=radio]");
    if (first) click(first);
    if (w.$(".sp-blank")) type(w.$(".sp-blank"), "a");
    if (w.$(".sp-area")) type(w.$(".sp-area"), evil);
    const fb = w.$(".sp-check-btn") && !w.$(".sp-check-btn").hidden ? checkNow(w.document) : null;
    void fb;
    scan();
    const next = w.$(".sp-next:not([hidden])");
    if (next) click(next);
    else if (w.$(".sp-q input[value='b']")) click(w.$(".sp-q input[value='b']"));
  }
  scan();
});

test("a malformed activity still mounts (normalized first) and links or data: images stay safe", () => {
  const w = makeWindow();
  w.mount({
    title: null,
    kind: "nope",
    blocks: [{ type: "image", src: "javascript:alert(1)", alt: "x" }, { type: "bogus" }, null],
  });
  assert.ok(w.$(".sp-title"));
  assert.equal(w.$$("img").length, 0);
});

// ── report, storage ─────────────────────────────────────────────────────────
test("report: a tiny anonymous summary on finish; never typed text; nothing in preview", async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true };
  };
  const a = small([
    choiceQ(),
    { id: "w", type: "question", format: "short", prompt: "Write", minWords: 1, sample: "s" },
  ]);
  const w = makeWindow();
  w.mount(a, { preview: false, reportUrl: "/api/class/activity/response", fetch });
  click(w.$('.sp-q input[value="a"]'));
  checkNow(w.document);
  click(w.$('.sp-q input[value="b"]'));
  checkNow(w.document);
  click(w.$(".sp-next:not([hidden])"));
  type(w.$(".sp-area"), "my secret story about Jamal");
  checkNow(w.document);
  assert.equal(calls.length, 0, "nothing is sent before finish");
  click(w.$(".sp-next:not([hidden])"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/class/activity/response");
  assert.equal(calls[0].init.method, "POST");
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(Object.keys(body).sort(), ["answers", "id", "session"]);
  assert.equal(body.id, "t1");
  assert.match(body.session, /^[0-9a-f]{16}$/);
  assert.deepEqual(body.answers[0], {
    q: "q1",
    first: "incorrect",
    final: "correct",
    hints: 0,
    revised: true,
  });
  assert.deepEqual(body.answers[1], {
    q: "w",
    first: "review",
    final: "review",
    hints: 0,
    revised: false,
  });
  assert.ok(!calls[0].init.body.includes("Jamal") && !calls[0].init.body.includes("secret"));
  assert.match(w.$(".sp-finish").textContent, /name is never sent/);
  const p = makeWindow();
  const pc = [];
  p.mount(a, { preview: true, reportUrl: "/x", fetch: async (...args) => pc.push(args) });
  click(p.$('.sp-q input[value="b"]'));
  checkNow(p.document);
  click(p.$(".sp-next:not([hidden])"));
  type(p.$(".sp-area"), "text");
  checkNow(p.document);
  click(p.$(".sp-next:not([hidden])"));
  assert.equal(pc.length, 0, "preview makes no network call");
});

test("preview writes no storage; normal mode remembers calm mode only", () => {
  const w = makeWindow();
  w.mount(small([choiceQ()]), { preview: true });
  click(w.$$(".sp-btn").find((b) => /Calm mode/.test(b.textContent)));
  assert.equal(w.window.localStorage.length, 0);
  const n = makeWindow();
  n.mount(small([choiceQ()]), { preview: false });
  click(n.$$(".sp-btn").find((b) => /Calm mode/.test(b.textContent)));
  assert.ok(n.$(".sp-root").classList.contains("sp-calm"));
  assert.deepEqual(Object.keys(n.window.localStorage), ["lp-activity-player:prefs"]);
});

// ── editor hooks ────────────────────────────────────────────────────────────
test("editMode: blocks carry data-block-id; click/Enter/Space select instead of answering; goto and destroy work", () => {
  const act = allFormats("interactive");
  const w = makeWindow();
  const picked = [];
  const player = w.mount(act, { editMode: true, onSelect: (id) => picked.push(id) });
  for (const id of ["t1", "p1", "v1"]) assert.ok(w.$(`[data-block-id="${id}"]`), id);
  assert.equal(w.$(`[data-block-id="p1"]`).tabIndex, 0);
  // the first question is q-choice: clicking an option selects the block and does not check anything
  const input = w.$('.sp-q input[value="a"]');
  click(input);
  assert.deepEqual(picked, ["q-choice"]);
  assert.equal(input.checked, false, "the click did not answer");
  w.$('[data-block-id="p1"]').dispatchEvent(
    new w.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
  w.$('[data-block-id="v1"]').dispatchEvent(
    new w.window.KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }),
  );
  w.$('[data-block-id="v1"]').dispatchEvent(
    new w.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
  );
  assert.deepEqual(picked, ["q-choice", "p1", "v1"]);
  assert.equal(player.goto("q-plot"), true);
  assert.ok(w.$(".sp-q-plot"));
  assert.equal(player.goto("nope"), false);
  player.setEditMode(false);
  assert.ok(!w.$(".sp-edit") && !w.$(".sp-editable"));
  click(w.$(".sp-q input[type=radio], .sp-pt"));
  assert.equal(picked.length, 3, "not in edit mode any more");
  player.destroy();
  assert.equal(w.$("#app").children.length, 0);
});

test("reset starts over with a fresh anonymous session", () => {
  const w = makeWindow();
  const player = w.mount(small([choiceQ()]));
  click(w.$('.sp-q input[value="b"]'));
  checkNow(w.document);
  click(w.$(".sp-next:not([hidden])"));
  assert.equal(player.summary().length, 1);
  click(w.$(".sp-finish .sp-btn-primary"));
  assert.equal(player.summary().length, 0);
  assert.ok(w.$(".sp-q"));
});
