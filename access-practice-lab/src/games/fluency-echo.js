// Fluency Echo (Eco de fluidez): a read-aloud rehearsal studio. Each passage is a "track" played in four steps:
//   1. Listen  - the model reads phrase by phrase while the current phrase lights up (speak() segments + onSegment).
//   2. Scoop   - the learner taps words to place slashes where the reader pauses; the slashes are checked against the
//                model's phrase boundaries (the one judged decision per track: miss -> hint -> revise -> reveal).
//   3. Echo    - hear each phrase and say it back, then record the whole passage with the site recorder. Recording is
//                optional ("I can't record right now"); takes stay in this tab as object URLs and are never uploaded.
//   4. Check   - replay model vs. mine and self-check smooth / phrased / expression. Nothing about the voice is scored.
// Support modes: A shows the English summary, Spanish and key words open, states how many pauses to find and autoplays
// the model once; B keeps that help one tap away; C hides it, and replaying the model during the scoop counts as help.
import { stop as stopRecording, takesFor } from "../recorder.js";
import { playRecording, speak } from "../speech.js";
import { judge, newRound, settled, takeHint } from "./engine.js";
import { modelMarks, parsePassage, phraseText, scoreMarks } from "./fluency-echo-text.js";
import { recKey, SELF, stageHTML } from "./fluency-echo-view.js";

let playing = 0;
let spokenKey = "";
let focusSel = "";
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
        self: {},
        norec: false,
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
    if (b.dataset.fePlay) {
      if (row.step === "scoop" && env.sup.key === "C") env.use("model-replay");
      playModel(row, env, { slow: b.dataset.fePlay === "slow" });
      return false;
    }
    if (b.dataset.feHear) {
      const take = takesFor(recKey(s, row)).at(-1);
      const mine = () => take && playRecording(take.url);
      if (b.dataset.feHear === "model") playModel(row, env);
      else if (b.dataset.feHear === "mine") mine();
      else playModel(row, env, { then: mine });
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
        extra: { kind: "phrasing", pauses: sc.need },
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
    if (
      (b.hasAttribute("data-fe-norec") || b.hasAttribute("data-fe-to-check")) &&
      row.step === "echo"
    ) {
      row.norec = b.hasAttribute("data-fe-norec");
      stopRecording();
      row.step = "check";
      focusSel = ".fe-title";
      return true;
    }
    if (b.dataset.feSelf && row.step === "check") {
      const [id, v] = b.dataset.feSelf.split(":");
      if (SELF.some((q) => q.id === id)) row.self[id] = v === "yes";
      return true;
    }
    if (
      b.hasAttribute("data-fe-finish") &&
      row.step === "check" &&
      SELF.every((q) => row.self[q.id] !== undefined)
    ) {
      row.step = "done";
      s.cheer = row.title;
      s.i += 1;
      focusSel = ".fe-cheer";
      return true;
    }
    return false;
  },

  mount(root, s, env) {
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
    if (row.step === "echo")
      return [
        { click: takesFor(recKey(s, row)).length ? "[data-fe-to-check]" : "[data-fe-norec]" },
      ];
    if (row.step === "check")
      return [
        ...SELF.filter((q) => row.self[q.id] === undefined).map((q) => ({
          click: `[data-fe-self="${q.id}:yes"]`,
        })),
        { click: "[data-fe-finish]" },
      ];
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
