// Fluency Echo (Eco de fluidez): a read-aloud rehearsal studio. Each passage is a "track" played in four steps:
//   1. Listen  - the model reads phrase by phrase while the current phrase lights up (speak() segments + onSegment).
//   2. Scoop   - the learner taps words to place slashes where the reader pauses; the slashes are checked against the
//                model's phrase boundaries (the one judged decision per track: miss -> hint -> revise -> reveal).
//   3. Echo    - hear each phrase and say it back, then record the whole passage with the site recorder. Recording is
//                optional ("I can't record right now"); takes stay in this tab as object URLs and are never uploaded.
//   4. Check   - replay model vs. mine and self-check smooth / phrased / expression. Nothing about the voice is scored.
// Echo and Check run the lab's shared Speaking flow (src/lab/speaking-flow.js): plan quietly, record with the AudioGuard
// (live level bar), hear yourself, then answer the three self-check points. A blocked or missing microphone, and "I can't
// record right now", open a typed / tap-to-build answer that completes the same step (flagged typed + norec in the report).
// Support modes: A shows the English summary, Spanish and key words open, states how many pauses to find and autoplays
// the model once; B keeps that help one tap away; C hides it, and replaying the model during the scoop counts as help.
import { initFlow, PHASE, planSteps, reduce, speakReport } from "../lab/speaking-flow.js";
import { bindSpeaking, memoryText, speakClick, speakInput } from "../lab/speaking-session.js";
import { takesFor } from "../recorder.js";
import { playRecording, speak } from "../speech.js";
import { judge, newRound, settled, takeHint } from "./engine.js";
import { modelMarks, parsePassage, phraseText, scoreMarks } from "./fluency-echo-text.js";
import { recKey, stageHTML } from "./fluency-echo-view.js";

let playing = 0;
let spokenKey = "";
let focusSel = "";
let notify = null;
const two = (x) => Boolean(x?.en && x?.es);

function highlight(k) {
  document
    .querySelectorAll("[data-fe-ph]")
    .forEach((n) => n.classList.toggle("is-on", Number(n.dataset.fePh) === k));
}
function playModel(row, env, { slow = false, then } = {}) {
  if (typeof window === "undefined") return;
  const prefs = env.ctx?.prefs || {};
  const token = ++playing;
  speak(row.phrases.map(phraseText), {
    rate: slow ? 0.7 : prefs.rate || 0.9,
    voiceURI: prefs.readingVoice || "",
    onSegment: (k) => token === playing && highlight(k),
  }).then((completed) => {
    if (token !== playing) return;
    highlight(-1);
    if (completed && then) then();
  });
}

// Handlers the shared speaking glue works through. The flow lives in the row (JSON); the guard never does.
function handlers(s, row, env) {
  const key = recKey(s, row);
  return {
    env,
    maxSeconds: 120,
    get: () => (row.sp ||= initFlow()),
    set(sp) {
      row.sp = sp;
      if (sp.phase === PHASE.REVIEW || sp.phase === PHASE.SELF_CHECK) row.step = "check";
      else if (row.step === "check") row.step = "echo";
    },
    text: memoryText(key),
    frames: () => row.phrases.map(phraseText),
  };
}

function finishRow(s, row, env) {
  const sp = row.sp;
  env.report({
    id: `${row.id}:speak`,
    skill: "speaking",
    ok: true,
    first: !sp.typed && sp.attempts <= 1,
    hints: 0,
    revised: sp.attempts > 1,
    production: true,
    kind: "echo",
    ...speakReport(sp),
  });
  row.step = "done";
  s.cheer = row.title;
  s.i += 1;
  focusSel = ".fe-cheer";
}

export default {
  id: "fluency-echo",

  init(env) {
    const band = env.content.bands?.[env.band] || env.content;
    const list = band.passages || [];
    const take = list.slice(0, env.count(list.length, Math.min(2, list.length)));
    return {
      sid: env.rng.int(1e9),
      i: 0,
      cheer: null,
      rows: take.map((p) => ({
        id: p.id,
        emoji: p.emoji,
        title: p.title,
        phrases: p.phrases,
        summary: p.summary,
        words: p.words || [],
        mood: p.mood,
        hint: p.hint,
        explain: p.explain,
        step: "listen",
        marks: [],
        sp: initFlow(),
        rs: newRound(),
      })),
    };
  },

  done: (s) => s.i >= s.rows.length,
  progress: (s) => ({ done: s.rows.filter((r) => r.step === "done").length, total: s.rows.length }),
  view: (s, env) => stageHTML(s, env),

  click(el, s, env) {
    const b = el.closest("button");
    const row = s.rows[s.i];
    if (!b || !row) return false;
    if (row.step === "echo" || row.step === "check") {
      const r = speakClick(b, recKey(s, row), handlers(s, row, env));
      if (r) {
        if (r.done) finishRow(s, row, env);
        return r.changed;
      }
    }
    if (b.dataset.fePlay) {
      if (row.step === "scoop" && env.sup.key === "C") env.use("model-replay");
      playModel(row, env, { slow: b.dataset.fePlay === "slow" });
      return false;
    }
    if (b.dataset.feHear) {
      const take = takesFor(recKey(s, row)).at(-1);
      if (b.dataset.feHear === "both" && take) {
        // Hearing "model, then mine" counts as the mandatory self-playback.
        const mine = () => {
          playRecording(take.url);
          const h = handlers(s, row, env);
          h.set(reduce(h.get(), { type: "PLAYED" }));
          notify?.();
        };
        playModel(row, env, { then: mine });
      } else playModel(row, env);
      return false;
    }
    if (b.hasAttribute("data-fe-ready") && row.step === "listen") {
      row.step = "scoop";
      s.cheer = null;
      focusSel = ".fe-title";
      return true;
    }
    if (b.dataset.feWord !== undefined && row.step === "scoop" && !settled(row.rs)) {
      const i = Number(b.dataset.feWord);
      row.marks = row.marks.includes(i)
        ? row.marks.filter((x) => x !== i)
        : [...row.marks, i].sort((a, z) => a - z);
      return true;
    }
    if (b.hasAttribute("data-fe-check") && row.step === "scoop" && !settled(row.rs)) {
      const words = parsePassage(row.phrases);
      const sc = scoreMarks(words, row.marks);
      judge(row.rs, sc.ok, env, {
        id: row.id,
        skill: "speaking",
        extra: { kind: "phrasing", pauses: sc.need, languageErrorTag: null },
      });
      if (row.rs.status === "revealed")
        row.marks = [...new Set([...row.marks, ...modelMarks(words)])].sort((a, z) => a - z);
      focusSel = ".gs-feedback";
      return true;
    }
    if (b.hasAttribute("data-g-hint") && row.step === "scoop" && !settled(row.rs)) {
      takeHint(row.rs, env);
      return true;
    }
    if (b.hasAttribute("data-fe-to-echo") && row.step === "scoop" && settled(row.rs)) {
      row.step = "echo";
      focusSel = ".fe-title";
      return true;
    }
    return false;
  },

  input(el, s, env) {
    const row = s.rows[s.i];
    if (row) speakInput(el, handlers(s, row, env)); // keeps the typed words in memory; never re-render mid-word
    return false;
  },

  mount(root, s, env, changed) {
    notify = changed || null;
    const row = s.rows[s.i];
    if (row?.step === "listen" && env.sup.audio === "auto" && spokenKey !== `${s.sid}:${s.i}`) {
      spokenKey = `${s.sid}:${s.i}`;
      playModel(row, env);
    }
    if (focusSel) {
      const n = root.querySelector(focusSel);
      if (n && !n.matches("button, a, input")) n.setAttribute("tabindex", "-1");
      n?.focus({ preventScroll: false });
      focusSel = "";
    }
    if (row && (row.step === "echo" || row.step === "check"))
      return bindSpeaking(root, recKey(s, row), handlers(s, row, env), changed);
    return null;
  },

  plan(s, { wrong } = {}) {
    const row = s.rows[s.i];
    if (!row) return [];
    if (row.step === "listen") return [{ click: "[data-fe-ready]" }];
    if (row.step === "scoop") {
      if (settled(row.rs)) return [{ click: "[data-fe-to-echo]" }];
      const words = parsePassage(row.phrases);
      const out = [];
      if (wrong) {
        const i = words.findIndex((x, n) => !x.end && !x.brk && !x.opt && !row.marks.includes(n));
        out.push({ click: `[data-fe-word="${i}"]` });
      } else {
        const want = new Set(modelMarks(words, row.marks));
        words.forEach((x, i) => {
          if (!x.end && want.has(i) !== row.marks.includes(i))
            out.push({ click: `[data-fe-word="${i}"]` });
        });
      }
      return [...out, { click: "[data-fe-check]" }];
    }
    if (row.step === "echo" || row.step === "check") {
      const words = phraseText(row.phrases.slice(0, 2).join(" "));
      return planSteps((row.sp ||= initFlow()), words);
    }
    return [];
  },

  validate(content) {
    const errors = [];
    for (const band of ["3-5", "6-8"]) {
      const list = content.bands?.[band]?.passages || [];
      if (list.length < 4 || list.length > 6) errors.push(`${band}: needs 4-6 passages`);
      if (new Set(list.map((p) => p.id)).size !== list.length)
        errors.push(`${band}: passage ids must be unique`);
      list.forEach((p) => {
        const at = `${band}/${p.id}`;
        if (!p.emoji) errors.push(`${at}: needs an emoji`);
        if (![p.title, p.summary, p.mood, p.hint, p.explain].every(two))
          errors.push(`${at}: title, summary, mood, hint and explanation must be bilingual`);
        if (p.hint?.en && p.hint.en === p.explain?.en)
          errors.push(`${at}: explanation must say why, not repeat the hint`);
        if (!Array.isArray(p.words) || p.words.length < 2 || !p.words.every(two))
          errors.push(`${at}: needs 2+ bilingual key words`);
        if (!Array.isArray(p.phrases) || p.phrases.length < 4) {
          errors.push(`${at}: needs 4+ phrases`);
          return;
        }
        p.phrases.forEach((ph) => {
          if (/^\s*\||\|\s*$/.test(ph))
            errors.push(`${at}: an optional pause cannot start or end a phrase`);
          const inner = phraseText(ph).split(" ").slice(0, -1);
          if (inner.some((w) => /[.!?]["”’)]*$/.test(w)))
            errors.push(`${at}: a sentence may only end at a phrase end ("${ph}")`);
        });
        const words = parsePassage(p.phrases);
        if (words.filter((x) => x.brk).length < 2)
          errors.push(`${at}: needs at least two pauses inside sentences`);
        if (words.length > 70) errors.push(`${at}: keep the passage under 70 words`);
        const leak = p.phrases.find((ph) =>
          [p.hint?.en, p.hint?.es].some((h) =>
            h?.toLowerCase().includes(phraseText(ph).toLowerCase()),
          ),
        );
        if (leak) errors.push(`${at}: hint quotes a whole phrase`);
      });
    }
    return errors;
  },
};
