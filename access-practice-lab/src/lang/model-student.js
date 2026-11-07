// The "model student" routine of the ACCESS speaking test: a classmate answers first, out loud, then it is the
// learner's turn. The model lines are the lab's own original text, already printed in each speaking task's passage
// ("A model student, Rob, said: "…""); this module finds them and compares how long the learner spoke with how long
// the model spoke. It measures LENGTH only — never speed, never a countdown, never a score.

const MODEL_RE =
  /A model student, ([\p{Lu}][\p{L}'’-]*), (said|started like this):\s*["“](.+?)["”]/u;

/** Typical classroom speaking pace used only to estimate a model's length before it has been played. */
export const ESTIMATE_WORDS_PER_SECOND = 2.3;

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const words = (text) => (String(text || "").match(/[\p{L}\p{N}'’-]+/gu) || []).length;
const tenth = (v) => Math.round(v * 10) / 10;

/**
 * The model student in a speaking item, read from its passage (or an explicit `modelStudent` field).
 * @returns {{ name: string, line: string, partial: boolean } | null} partial = the model only started the answer.
 */
export function findModelStudent(item) {
  if (item?.modelStudent?.name && item.modelStudent.line)
    return {
      name: item.modelStudent.name,
      line: item.modelStudent.line,
      partial: Boolean(item.modelStudent.partial),
    };
  for (const p of asList(item?.passage)) {
    const m = String(p).match(MODEL_RE);
    if (m) return { name: m[1], line: m[3].trim(), partial: m[2] === "started like this" };
  }
  return null;
}

/** Estimated seconds a line takes to say at a read-aloud rate (1 = normal). Never below one second. */
export function estimateSeconds(text, rate = 1) {
  const r = Number(rate) > 0 ? Number(rate) : 1;
  return Math.max(1, tenth(words(text) / (ESTIMATE_WORDS_PER_SECOND * r)));
}

/**
 * How the learner's speaking time compares with the model's. Bands are about length only.
 * A model that only *started* the answer is a floor: saying more than it is expected, so "longer" is never a caution.
 * @returns {{ you: number, model: number, ratio: number, band: "short"|"near"|"long", youPct: number, modelPct: number } | null}
 */
export function compareLength(youSeconds, modelSeconds, { partial = false } = {}) {
  const you = Number(youSeconds);
  const model = Number(modelSeconds);
  if (!(you > 0) || !(model > 0)) return null;
  const ratio = you / model;
  const band = ratio < 0.6 ? "short" : !partial && ratio > 2.5 ? "long" : "near";
  const top = Math.max(you, model);
  return {
    you: tenth(you),
    model: tenth(model),
    ratio: Math.round(ratio * 100) / 100,
    band,
    youPct: Math.round((you / top) * 100),
    modelPct: Math.round((model / top) * 100),
  };
}

/** Plain [English, Spanish] advice for a comparison. Observations about length, never a judgement of quality. */
export function lengthAdvice(cmp, name = "", { partial = false } = {}) {
  if (!cmp) return null;
  const who = name || "the model";
  const quien = name || "el modelo";
  if (cmp.band === "short")
    return partial
      ? [
          `${who} only started the answer, and you spoke for less time than that start. Add another detail or a reason.`,
          `${quien} solo empezó la respuesta y tú hablaste menos tiempo que ese comienzo. Agrega otro detalle o una razón.`,
        ]
      : [
          `You spoke for less time than ${who}. Add one more detail or a reason, then try again.`,
          `Hablaste menos tiempo que ${quien}. Agrega un detalle más o una razón y vuelve a intentarlo.`,
        ];
  if (cmp.band === "long")
    return [
      `You spoke much longer than ${who}. Check that every part answers the question.`,
      `Hablaste mucho más que ${quien}. Revisa que cada parte responda la pregunta.`,
    ];
  return partial
    ? [
        `You spoke at least as long as ${who}'s start. Good: a full answer goes on past the start.`,
        `Hablaste por lo menos tanto como el comienzo de ${quien}. Bien: una respuesta completa sigue después del comienzo.`,
      ]
    : [`You spoke about as long as ${who}.`, `Hablaste más o menos lo mismo que ${quien}.`];
}

/** Seconds of actual speech in a take: the envelope analysis when it worked, else the recording length. */
export function takeSpeechSeconds(take, summarize) {
  if (!take) return 0;
  if (take.env?.length && typeof summarize === "function") {
    const sum = summarize(take.env, take.fps || 20);
    if (sum?.ok && sum.speechSeconds > 0) return sum.speechSeconds;
  }
  return Number(take.seconds) || 0;
}

/**
 * A model line's rhythm as a loudness-shaped envelope, built from REAL word timings reported by the read-aloud voice
 * (boundary events: { charIndex, t } in seconds from the start) and the measured total length. When the voice reports
 * no boundaries, words are spread over the measured length by their letter counts and the result says so.
 * Speech synthesis audio cannot be captured in a browser, so this shows when each word was said — not its loudness.
 * @returns {{ env: number[], fps: number, fromVoice: boolean }}
 */
export function rhythmEnvelope(text, boundaries, totalSeconds, fps = 20) {
  const spans = [...String(text || "").matchAll(/[\p{L}\p{N}'’-]+/gu)].map((m) => ({ at: m.index, len: m[0].length }));
  const total = Math.max(0.1, Number(totalSeconds) || 0);
  const frames = Math.max(1, Math.round(total * fps));
  const env = new Array(frames).fill(0.04);
  if (!spans.length) return { env, fps, fromVoice: false };
  const marks = (Array.isArray(boundaries) ? boundaries : []).filter((b) => Number.isFinite(b?.t) && b.t >= 0 && b.t <= total);
  let starts;
  let fromVoice = false;
  if (marks.length >= Math.ceil(spans.length / 2)) {
    fromVoice = true;
    starts = spans.map((s) => {
      const hit = marks.find((b) => b.charIndex >= s.at && b.charIndex < s.at + s.len) || marks.filter((b) => b.charIndex <= s.at).at(-1);
      return hit ? hit.t : 0;
    });
  } else {
    const letters = spans.reduce((a, s) => a + s.len + 1, 0);
    let acc = 0;
    starts = spans.map((s) => {
      const t = (acc / letters) * total;
      acc += s.len + 1;
      return t;
    });
  }
  starts.forEach((start, i) => {
    const end = Math.min(total, i + 1 < starts.length ? Math.max(start + 0.12, starts[i + 1] - 0.06) : start + Math.max(0.25, spans[i].len * 0.07));
    const peak = 0.55 + Math.min(0.4, spans[i].len * 0.05);
    for (let f = Math.floor(start * fps); f < Math.min(frames, Math.ceil(end * fps)); f++) env[f] = peak;
  });
  return { env, fps, fromVoice };
}
