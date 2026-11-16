// Language Expeditions teacher links (feature "teacher"). Two URL parameters, both carried by a link a teacher
// copies; nothing is stored on a server and nothing names a student.
//   land=listening|reading|speaking|writing (or 1..4): open the game straight into that land's walk mode.
//   stop=<code>: a teacher-written Reading stop (passage, question, choices) or Writing stop (prompt, model), encoded
//   as compact base64url JSON. Decoding validates it with the same checks as authored content (actErrors in
//   language-expeditions-rules.js); an invalid code falls back to the authored stop and the game says so.
// Pure functions only (no DOM), so the hub, the game and the tests share them.
import { ORDER, actErrors } from "./language-expeditions-rules.js";

export const STOP_MAX = 4000; // characters of the encoded code; a longer code is refused
export const LIMITS = {
  title: 60,
  passage: 700,
  question: 160,
  option: 120,
  note: 200,
  prompt: 240,
  model: 400,
  frame: 100,
  word: 24,
  words: 10,
};
const READ_LAND = 1;
const WRITE_LAND = 3;

/** land=listening | 1..4 -> land index 0..3, or -1. */
export function landParam(v) {
  const t = String(v ?? "")
    .trim()
    .toLowerCase();
  if (/^[1-4]$/.test(t)) return Number(t) - 1;
  return ORDER.indexOf(t);
}

const b64url = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (s) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(bin, (c) => c.charCodeAt(0)),
  );
};

const clean = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
/** A teacher pair [en, es]: English is required; Spanish is optional and shows English when left out. */
const pair = (v, max) => {
  const [en, es] = Array.isArray(v) ? v : [v, ""];
  const e = clean(en, max);
  const s = clean(es, max);
  return { en: e, es: s || e };
};

/** Teacher form fields -> the compact object the code carries. Empty optional fields are dropped. */
export function packStop(f) {
  const kind = f.kind === "writing" ? "w" : "r";
  const n = Math.max(0, Math.min(2, Number.parseInt(f.stop, 10) - 1 || 0));
  const two = (en, es) => [clean(en, 800), clean(es, 800)];
  if (kind === "w")
    return {
      v: 1,
      d: "w",
      n,
      t: two(f.titleEn, f.titleEs),
      p: two(f.promptEn, f.promptEs),
      m: two(f.modelEn, f.modelEs),
      f: clean(f.frame, LIMITS.frame),
      b: String(f.bank || "")
        .split(",")
        .map((w) => clean(w, LIMITS.word))
        .filter(Boolean)
        .slice(0, LIMITS.words),
    };
  const opts = [0, 1, 2, 3].map((i) => two(f[`opt${i}En`], f[`opt${i}Es`])).filter(([en]) => en);
  return {
    v: 1,
    d: "r",
    n,
    t: two(f.titleEn, f.titleEs),
    p: clean(f.passage, LIMITS.passage),
    q: two(f.questionEn, f.questionEs),
    o: opts,
    a: Number.parseInt(f.answer, 10) || 0,
    h: two(f.hintEn, f.hintEs),
    x: two(f.explainEn, f.explainEs),
  };
}

export const encodeStop = (packed) => b64url(JSON.stringify(packed));

/** The authored stop a teacher stop replaces, clamped to the stops this session plays (quick mode plays fewer). */
const target = (band, d, n, count) => {
  const k = d === "w" ? WRITE_LAND : READ_LAND;
  const acts = band?.lands?.[k]?.acts || [];
  const plays = (typeof count === "function" ? count(k) : count) ?? acts.length;
  const i = Math.max(0, Math.min(n, plays - 1, acts.length - 1));
  return { k, i, base: acts[i] };
};

function readingAct(o, base, i) {
  const options = (Array.isArray(o.o) ? o.o : []).slice(0, 4).map((x) => pair(x, LIMITS.option));
  const answer = Number.isInteger(o.a) ? o.a : -1;
  const right = options[answer];
  const hint = pair(o.h, LIMITS.note);
  const explain = pair(o.x, LIMITS.note);
  return {
    id: `${base.id}-teacher`,
    type: "read-choice",
    teacher: true,
    title: pair(o.t, LIMITS.title).en
      ? pair(o.t, LIMITS.title)
      : { en: `Your teacher's stop ${i + 1}`, es: `La parada ${i + 1} de tu docente` },
    guide: {
      en: "Your teacher wrote this stop. Read it, then answer the question.",
      es: "Tu docente escribió esta parada. Léela y responde la pregunta.",
    },
    passage: clean(o.p, LIMITS.passage),
    question: pair(o.q, LIMITS.question),
    options,
    answer,
    hint: hint.en
      ? hint
      : {
          en: "Read the text again. Find the sentence that answers the question.",
          es: "Lee el texto otra vez. Busca la oración que responde la pregunta.",
        },
    explain: explain.en
      ? explain
      : {
          en: `The text supports this answer: “${right?.en || ""}”`,
          es: `El texto apoya esta respuesta: “${right?.es || ""}”`,
        },
  };
}

function writingAct(o, base, i) {
  const model = pair(o.m, LIMITS.model);
  const firstWords = model.en
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .replace(/[.,!?;:]+$/, "");
  const bank = Array.isArray(o.b)
    ? o.b
        .map((w) => clean(w, LIMITS.word))
        .filter(Boolean)
        .slice(0, LIMITS.words)
    : [];
  const fromModel = [...new Set(model.en.toLowerCase().match(/[a-z']{4,}/g) || [])].slice(0, 8);
  return {
    ...base,
    id: `${base.id}-teacher`,
    teacher: true,
    title: pair(o.t, LIMITS.title).en
      ? pair(o.t, LIMITS.title)
      : { en: `Your teacher's stop ${i + 1}`, es: `La parada ${i + 1} de tu docente` },
    guide: {
      en: "Your teacher wrote this stop. Read the task, then write.",
      es: "Tu docente escribió esta parada. Lee la tarea y luego escribe.",
    },
    prompt: pair(o.p, LIMITS.prompt),
    model,
    frame: clean(o.f, LIMITS.frame) || (firstWords ? `${firstWords} ___.` : ""),
    bank: bank.length ? bank : fromModel,
    need: [],
    needCount: 0,
    checks: [
      { en: "I answered my teacher's task.", es: "Respondí la tarea de mi docente." },
      { en: "A reader can understand my ideas.", es: "Un lector puede entender mis ideas." },
    ],
  };
}

/**
 * Decode and validate a teacher stop for one band. Returns {ok, land, i, act} or {ok:false, land, i, errors}.
 * `count` is how many stops of that land this session plays (a number, or a function of the land index).
 */
export function decodeStop(code, band, count) {
  const fail = (errors, at = {}) => ({ ok: false, land: at.k ?? -1, i: at.i ?? -1, errors });
  const raw = String(code ?? "").trim();
  if (!raw) return fail(["empty"]);
  if (raw.length > STOP_MAX) return fail(["too long"]);
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) return fail(["not a stop code"]);
  let o;
  try {
    o = JSON.parse(unb64url(raw));
  } catch {
    return fail(["not a stop code"]);
  }
  if (!o || typeof o !== "object" || o.v !== 1 || !["r", "w"].includes(o.d))
    return fail(["unknown stop version"]);
  const at = target(band, o.d, Number.isInteger(o.n) ? o.n : 0, count);
  if (!at.base) return fail(["no stop to replace"], at);
  const act = o.d === "w" ? writingAct(o, at.base, at.i) : readingAct(o, at.base, at.i);
  const errors = stopErrors(act, o.d === "w" ? "writing" : "reading");
  return errors.length ? fail(errors, at) : { ok: true, land: at.k, i: at.i, act };
}

/** The authored-content checks, plus the English fields a teacher must fill. */
export function stopErrors(act, domain) {
  const e = actErrors(act, act.id, domain, new Set());
  if (domain === "reading") {
    if (!act.passage) e.push("passage: write the text students read");
    if (!act.question?.en) e.push("question: write the question in English");
    if ((act.options || []).some((o) => !o.en)) e.push("choices: every choice needs English");
  } else {
    if (!act.prompt?.en) e.push("prompt: write the task in English");
    if (!act.model?.en) e.push("model: write one model answer in English");
    else if (e.some((x) => x.includes("fails its own checks")))
      e.push(`model: students at this stop write at least ${act.minWords} words in ${act.minSentences} sentence${act.minSentences > 1 ? "s" : ""}, each with a capital letter and end punctuation, so the model must too`);
  }
  return e;
}

/** A link path for one land (or one teacher stop) in one band. */
export function expeditionHref(base, band, { land = "", stop = "", mode = "" } = {}) {
  const p = new URLSearchParams({ grades: band });
  if (mode) p.set("mode", mode);
  if (land) p.set("land", land);
  if (stop) p.set("stop", stop);
  return `${base}/games/language-expeditions?${p}`;
}
