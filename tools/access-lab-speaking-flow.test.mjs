// Speaking flow: the pure reducer (plan gating, typed fallback, self-check gating, serialization, a blocked
// microphone never dead-ending) and smoke tests of the shared markup. Pure Node: no browser, no device.
import assert from "node:assert/strict";
import test from "node:test";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import {
  BLOCK_REASONS,
  createAudioGuard,
  REASON_COPY,
} from "../access-practice-lab/src/lab/audio-guard.js";
import * as F from "../access-practice-lab/src/lab/speaking-flow.js";
import * as UI from "../access-practice-lab/src/lab/speaking-ui.js";
import { toHtml } from "../access-practice-lab/src/util.js";

const T0 = 1_000_000;
const ev = (sp, ...events) => events.reduce((cur, e) => F.reduce(cur, e), sp);
const started = () => F.reduce(F.initFlow(), { type: "STAMP", now: T0 });
const toReady = () =>
  ev(started(), { type: "READY", now: T0 + F.PLAN_MIN_MS, minMs: F.PLAN_MIN_MS });
const env = (lang = "en", frames = "full") => ({ I: makeI18n(lang), sup: { frames }, qa: false });
const out = (v) => toHtml(v).replace(/\s+/g, " ").replace(/> </g, "><"); // the markup is whitespace-formatted

test("planning: nothing starts by itself and 'I'm ready' opens at 5 seconds (injected clock)", () => {
  const sp = started();
  assert.equal(sp.phase, "PLAN");
  assert.equal(F.canReady(sp, T0 + 4999), false);
  assert.equal(F.canReady(sp, T0 + 5000), true);
  assert.equal(
    F.reduce(sp, { type: "READY", now: T0 + 4999, minMs: 5000 }),
    sp,
    "too early: same object, no change",
  );
  assert.equal(F.reduce(sp, { type: "READY", now: T0 + 5000, minMs: 5000 }).phase, "READY");
  assert.equal(
    F.reduce(sp, { type: "READY", now: T0, minMs: 0 }).phase,
    "READY",
    "minMs 0 (reduced motion, QA) is immediate",
  );
  // an hour of planning never moves on or records by itself
  assert.equal(F.reduce(sp, { type: "GUARD", state: "RECORDING" }), sp);
  assert.ok(F.planRatio(sp, T0 + 20000) <= 1);
  assert.equal(F.planRemainingMs(sp, T0 + 2000), 3000);
  // a window that never opened (no render stamped it) holds nobody back
  assert.equal(F.reduce(F.initFlow(), { type: "READY", now: T0, minMs: 5000 }).phase, "READY");
});

test("record path: READY -> RECORD -> REVIEW -> SELF_CHECK -> DONE, with playback and all three answers required", () => {
  let sp = toReady();
  assert.equal(F.reduce(sp, { type: "PLAYED" }), sp, "cannot skip ahead");
  sp = ev(sp, { type: "GUARD", state: "RECORDING" });
  assert.equal(sp.phase, "RECORD");
  assert.equal(sp.attempts, 1);
  sp = ev(sp, { type: "GUARD", state: "PLAYBACK_READY", hasTake: true });
  assert.equal(sp.phase, "REVIEW");
  assert.equal(F.reduce(sp, { type: "FINISH" }), sp, "no finishing before playback");
  sp = ev(sp, { type: "PLAYED" });
  assert.equal(sp.phase, "SELF_CHECK");
  assert.equal(F.reduce(sp, { type: "FINISH" }), sp);
  sp = ev(sp, { type: "ANSWER", id: "idea", v: true }, { type: "ANSWER", id: "word", v: false });
  assert.equal(F.reduce(sp, { type: "FINISH" }).phase, "SELF_CHECK", "two of three is not enough");
  assert.equal(
    F.reduce(sp, { type: "ANSWER", id: "nope", v: true }),
    sp,
    "unknown check ids are ignored",
  );
  sp = ev(sp, { type: "ANSWER", id: "voice", v: true }, { type: "FINISH" });
  assert.equal(sp.phase, "DONE");
  assert.deepEqual(F.selfCheckOf(sp), { idea: true, word: false, voice: true });
  const report = F.speakReport(sp);
  assert.equal(report.typed, false);
  assert.equal(report.norec, false);
  assert.equal(report.languageErrorTag, null);
  assert.deepEqual(Object.keys(report.selfCheck), ["idea", "word", "voice"]);
});

test("a recording that produced no take is treated as blocked, not as a finished attempt", () => {
  const sp = ev(
    toReady(),
    { type: "GUARD", state: "RECORDING" },
    { type: "GUARD", state: "PLAYBACK_READY", hasTake: false },
  );
  assert.equal(sp.phase, "READY");
  assert.equal(sp.blocked, true);
});

test("typed fallback completes the same step and is flagged typed + norec, without keeping the text", () => {
  let sp = ev(toReady(), { type: "NOREC" });
  assert.equal(sp.blocked, true);
  assert.equal(sp.reason, "declined");
  assert.equal(
    F.reduce(sp, { type: "TYPED", words: F.TYPED_MIN_WORDS - 1 }),
    sp,
    "too short to count",
  );
  sp = ev(sp, { type: "TYPED", words: 7 });
  assert.equal(sp.phase, "REVIEW");
  assert.equal(sp.typed, true);
  sp = ev(sp, { type: "PLAYED" }); // reading it back replaces playback
  for (const id of F.CHECK_IDS) sp = ev(sp, { type: "ANSWER", id, v: true });
  sp = ev(sp, { type: "FINISH" });
  assert.equal(sp.phase, "DONE");
  const report = F.speakReport(sp);
  assert.equal(report.typed, true);
  assert.equal(report.norec, true);
  const json = JSON.stringify({ sp, report });
  assert.doesNotMatch(json, /typedText|"text"/);
  F.typedStore.set("k", "my private words");
  assert.equal(F.typedStore.get("k"), "my private words");
  assert.doesNotMatch(json, /private/);
  F.typedStore.clear("k");
  assert.equal(F.typedStore.get("k"), "");
});

test("a blocked microphone never dead-ends: every reason offers retry and a typed way to finish", () => {
  for (const reason of BLOCK_REASONS) {
    assert.ok(REASON_COPY[reason].en && REASON_COPY[reason].es, reason);
    let sp = ev(toReady(), { type: "GUARD", state: "MIC_BLOCKED_FALLBACK", reason });
    assert.equal(sp.blocked, true, reason);
    assert.equal(sp.reason, reason);
    const retried = ev(sp, { type: "RETRY" });
    assert.equal(retried.blocked, false);
    assert.equal(retried.phase, "READY");
    assert.equal(
      ev(retried, { type: "GUARD", state: "MIC_BLOCKED_FALLBACK", reason }).blocked,
      true,
      "blocked again, still not stuck",
    );
    sp = ev(sp, { type: "TYPED", words: 5 });
    assert.equal(sp.phase, "REVIEW", `${reason}: typed route reaches review`);
  }
  // blocked while recording
  const mid = ev(
    toReady(),
    { type: "GUARD", state: "RECORDING" },
    { type: "GUARD", state: "MIC_BLOCKED_FALLBACK", reason: "interrupted" },
  );
  assert.equal(mid.phase, "READY");
  assert.equal(mid.blocked, true);
  // Change my answer after a typed attempt returns to the typed panel, not a dead end
  const typed = ev(toReady(), { type: "NOREC" }, { type: "TYPED", words: 4 }, { type: "RETAKE" });
  assert.equal(typed.phase, "READY");
  assert.equal(typed.blocked, true);
});

test("the real AudioGuard with no mediaDevices lands in the fallback, and the flow follows it to a finish", async () => {
  const seen = [];
  const guard = createAudioGuard({
    deps: { supported: () => false },
    onChange: (s) => seen.push(s),
  });
  const snap = await guard.request();
  assert.equal(snap.state, "MIC_BLOCKED_FALLBACK");
  assert.equal(snap.reason, "unsupported");
  let sp = ev(toReady(), {
    type: "GUARD",
    state: snap.state,
    reason: snap.reason,
    hasTake: Boolean(snap.take),
  });
  assert.equal(sp.blocked, true);
  sp = ev(sp, { type: "TYPED", words: 6 }, { type: "PLAYED" });
  assert.equal(sp.phase, "SELF_CHECK");
});

test("recover puts a learner back on a step they can finish after a reload", () => {
  const recording = ev(toReady(), { type: "GUARD", state: "RECORDING" });
  assert.equal(F.recover(recording, { recording: false }).phase, "READY");
  assert.equal(F.recover(recording, { recording: true }), recording);
  const review = ev(recording, { type: "GUARD", state: "PLAYBACK_READY", hasTake: true });
  assert.equal(F.recover(review, { hasTake: true }), review);
  assert.equal(F.recover(review, { hasTake: false }).phase, "READY");
  const typed = ev(toReady(), { type: "NOREC" }, { type: "TYPED", words: 5 });
  assert.equal(F.recover(typed, { hasText: false }).blocked, true);
  assert.equal(F.recover(typed, { hasText: true }), typed);
  const lost = F.recover(recording, { recording: false });
  assert.equal(F.recover(lost, { recording: false }), lost, "idempotent");
});

test("serialization round-trips and a damaged save falls back to a safe flow", () => {
  let sp = ev(
    toReady(),
    { type: "GUARD", state: "RECORDING" },
    { type: "GUARD", state: "PLAYBACK_READY", hasTake: true },
    { type: "PLAYED" },
    { type: "ANSWER", id: "idea", v: true },
  );
  const back = JSON.parse(JSON.stringify(sp));
  assert.deepEqual(back, sp);
  assert.deepEqual(F.normalizeFlow(back), sp);
  assert.deepEqual(F.normalizeFlow(null), F.initFlow());
  const bad = F.normalizeFlow({
    phase: "HACK",
    since: -5,
    self: { idea: "yes", word: true, extra: 1 },
    reason: "x".repeat(99),
  });
  assert.equal(bad.phase, "PLAN");
  assert.equal(bad.since, 0);
  assert.deepEqual(bad.self, { word: true });
  assert.equal(bad.reason.length, 24);
});

test("planSteps drives every phase to DONE through the typed route (the QA hook)", () => {
  const run = (sp) => {
    let guard = 0;
    while (sp.phase !== "DONE" && guard++ < 5) {
      for (const step of F.planSteps(sp)) {
        const attr = step.click?.match(/data-sp-([a-z-]+)(?:="([^"]*)")?/);
        if (step.fill) assert.ok(F.countWords(step.fill[1]) >= F.TYPED_MIN_WORDS);
        const map = {
          ready: { type: "READY", now: 0, minMs: 0 },
          nomic: { type: "NOREC" },
          "typed-done": { type: "TYPED", words: 9 },
          play: { type: "PLAYED" },
          finish: { type: "FINISH" },
        };
        if (attr?.[1] === "self")
          sp = F.reduce(sp, { type: "ANSWER", id: attr[2].split(":")[0], v: true });
        else if (attr) sp = F.reduce(sp, map[attr[1]]);
      }
    }
    return sp;
  };
  assert.equal(run(F.initFlow()).phase, "DONE");
  assert.equal(run(toReady()).phase, "DONE");
  assert.equal(run(ev(toReady(), { type: "NOREC" })).phase, "DONE");
  assert.deepEqual(F.planSteps(run(F.initFlow())), []);
});

test("frames: Hands-on shows whole frames, Guided the starters, Independent none", () => {
  const frame = "First, ___. Next, ___. Last, ___.";
  assert.deepEqual(F.chipsFor(frame, "full"), ["First, ___.", "Next, ___.", "Last, ___."]);
  assert.deepEqual(F.chipsFor(frame, "starter"), ["First, ___", "Next, ___", "Last, ___"]);
  assert.deepEqual(F.chipsFor(frame, "none"), []);
  assert.equal(F.addChip("", "I think"), "I think");
  assert.equal(F.addChip("I think", "because"), "I think because");
});

const flowAt = (phase) => ({ ...F.initFlow(), phase, since: T0 });
const base = (e, sp, extra = {}) => ({
  sp,
  env: e,
  key: "k",
  now: T0 + 1000,
  wait: 5000,
  frames: "I think ___ because ___.",
  ...extra,
});

test("markup: level meter has the aria contract and a --lvl bar", () => {
  const html = out(UI.levelHTML(0.4, makeI18n("en")));
  assert.match(html, /class="al-level" role="meter"/);
  assert.match(html, /aria-label="Microphone level"/);
  assert.match(html, /aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"/);
  assert.match(html, /<span style="--lvl:0\.40"><\/span>/);
  assert.match(out(UI.levelHTML(7, makeI18n("en"))), /aria-valuenow="100"/);
  assert.match(out(UI.levelHTML(-1, makeI18n("en"))), /aria-valuenow="0"/);
  const live = out(
    UI.micHTML({ sp: flowAt("RECORD"), env: env(), snap: { state: "RECORDING", level: 0.5 } }),
  );
  assert.match(live, /role="meter"/);
  assert.match(live, /data-sp-stop/);
});

test("markup: the plan bar is CSS-only, the button waits 5s and never auto-starts", () => {
  const early = out(UI.planHTML(base(env(), started())));
  assert.match(early, /class="sp-plan-bar" aria-hidden="true"/);
  assert.match(early, /--sp-ms:10000ms;--sp-delay:-1000ms/);
  assert.match(early, /data-sp-ready\s+disabled/);
  assert.doesNotMatch(early, /<script|setTimeout|autofocus/);
  assert.doesNotMatch(early, /data-sp-rec|data-sp-mic/, "no recording control during planning");
  const late = out(UI.planHTML(base(env(), started(), { now: T0 + 5000 })));
  assert.doesNotMatch(late, /data-sp-ready\s+disabled/);
  const calm = out(UI.planHTML(base(env(), started(), { wait: 0 })));
  assert.doesNotMatch(
    calm,
    /data-sp-ready\s+disabled/,
    "reduced motion: the button is there at once",
  );
});

test("markup: frames follow the support mode; Independent shows none", () => {
  const sp = started();
  assert.match(out(UI.planHTML(base(env("en", "full"), sp))), /I think ___ because ___\./);
  const starter = out(UI.planHTML(base(env("en", "starter"), sp)));
  assert.match(starter, />I think ___</);
  assert.doesNotMatch(starter, /because/, "Guided gives only the first words");
  const none = out(UI.planHTML(base(env("en", "none"), sp)));
  assert.doesNotMatch(none, /sp-frames|I think/);
});

test("markup: fallback shows the reason, a retry, a textarea and chips; the done button follows the word count", () => {
  const sp = { ...flowAt("READY"), blocked: true, reason: "denied" };
  const html = out(UI.recordPartHTML(base(env(), sp, { text: "I think" })));
  assert.match(html, /The microphone is blocked\./);
  assert.match(html, /data-sp-retry/);
  assert.match(html, /Try the microphone again/);
  assert.match(html, /<textarea[^>]*data-sp-typed/);
  assert.match(html, /data-sp-chip="0"/);
  assert.match(html, /data-sp-typed-done\s+disabled/, "two words is too few");
  const ok = out(UI.recordPartHTML(base(env(), sp, { text: "I think it works" })));
  assert.doesNotMatch(ok, /data-sp-typed-done\s+disabled/);
  assert.match(
    out(UI.recordPartHTML(base(env(), { ...sp, reason: "declined" }))),
    /No recording this time/,
  );
  const c = out(UI.recordPartHTML(base(env("en", "none"), sp)));
  assert.doesNotMatch(c, /data-sp-chip/, "Independent: textarea only");
});

test("markup: three-point self-check is gated and labelled in English and Spanish", () => {
  const sp = flowAt("SELF_CHECK");
  const en = out(UI.selfCheckHTML(base(env(), sp)));
  for (const label of ["Complete idea", "Academic word", "Clear voice"])
    assert.match(en, new RegExp(label));
  assert.equal((en.match(/data-sp-self="/g) || []).length, 6);
  assert.match(en, /data-sp-finish\s+disabled/);
  assert.match(en, /Answer all three to finish\./);
  const done = { ...sp, self: { idea: true, word: false, voice: true } };
  const full = out(UI.selfCheckHTML(base(env(), done)));
  assert.doesNotMatch(full, /data-sp-finish\s+disabled/);
  assert.match(full, /Next time, choose one key word/, "a Not yet answer shows a tip");
  const es = out(UI.selfCheckHTML(base(env("es"), sp)));
  for (const label of ["Idea completa", "Palabra académica", "Voz clara"])
    assert.match(es, new RegExp(label));
  assert.match(es, /Responde las tres para terminar\./);
  const bi = out(UI.selfCheckHTML(base(env("bi"), sp)));
  assert.match(bi, /Complete idea/);
  assert.match(bi, /Idea completa/);
});

test("markup: Spanish mode translates the chrome and leaves the English frame and the typed words alone", () => {
  const frame = "I think ___ because ___.";
  const plan = out(UI.planHTML(base(env("es"), started(), { frames: frame })));
  assert.match(plan, /Primero planea/);
  assert.match(plan, /Estoy listo/);
  assert.match(plan, /lang="en">I think ___ because ___\.</, "the frame stays English");
  const sp = { ...flowAt("READY"), blocked: true, reason: "absent" };
  const fb = out(
    UI.recordPartHTML(base(env("es"), sp, { frames: frame, text: "The water cycle starts here." })),
  );
  assert.match(fb, /No se encontró ningún micrófono/);
  assert.match(fb, /Intentar el micrófono otra vez/);
  assert.match(fb, /The water cycle starts here\./);
  assert.match(fb, /lang="en">I think ___ because/);
  const review = out(
    UI.reviewHTML(
      base(
        env("es"),
        { ...flowAt("REVIEW"), typed: true },
        { text: "The water cycle starts here." },
      ),
    ),
  );
  assert.match(review, /Lee tu respuesta de nuevo/);
  assert.match(review, /The water cycle starts here\./);
});

test("markup: review requires playback first; typed answers are read back, not played", () => {
  const rec = out(UI.reviewPartHTML(base(env(), flowAt("REVIEW"), { hasTake: true })));
  assert.match(rec, /data-sp-play/);
  assert.match(rec, /Play your recording once to continue\./);
  assert.doesNotMatch(rec, /data-sp-self/);
  const typed = out(
    UI.reviewPartHTML(
      base(env(), { ...flowAt("REVIEW"), typed: true }, { text: "Hello there friend" }),
    ),
  );
  assert.match(typed, /I read it back aloud/);
  assert.match(typed, /Hello there friend/);
  const both = out(UI.speakingHTML(base(env(), flowAt("SELF_CHECK"), { hasTake: true })));
  assert.match(both, /data-sp-play/);
  assert.match(both, /data-sp-self/);
  assert.match(out(UI.speakingHTML(base(env(), flowAt("DONE")))), /Speaking try saved/);
});

test("planWait is 0 headless, with qa, and the button is never held in Node", () => {
  assert.equal(UI.planWait({}), 0);
  assert.equal(UI.planWait({ qa: true }), 0);
});
