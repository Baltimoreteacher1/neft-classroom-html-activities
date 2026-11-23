// Reading Mystery — a short mystery assembled from the unit's own passage. Each case asks one of the passage's
// questions. Step 1: pick the clue card (a sentence of the passage) that holds the evidence. Step 2: say what a
// key word in that clue means. Step 3: answer the question. The real clue is found by comparing the question's
// own explanation with the passage, so it is traceable. A unit whose passage cannot support a case falls back to
// Context Detective and says so.
import contextDetective from "./context-detective.js";
import { normalize, passageSentences, seedFor } from "./data.js";
import {
  choicesHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
  stemHTML,
} from "./kit.js";
import { buildQuestion, newMc } from "./questions.js";
import { rngFor } from "../rng.js";
import { clean, findForm, isContent, norm, tokenize } from "./text.js";

export const TITLE = ["Reading Mystery", "Misterio de lectura"];
const stemOf = (t) =>
  norm(t)
    .replace(/^['-]+|['-]+$/g, "")
    .slice(0, 5);
const stemsOf = (text) =>
  new Set(
    tokenize(String(text || ""))
      .filter((t) => t.w && isContent(t.t))
      .map((t) => stemOf(t.t)),
  );
const CASES = { early: 2, "upper-elem": 3, middle: 3, high: 3 };
export const FALLBACK_NOTE = [
  "This lesson's story is too short to hold a mystery, so here are Context Detective cases with the same words.",
  "La lectura de esta lección es muy corta para un misterio, así que aquí hay casos de Detective del contexto con las mismas palabras.",
];

/** The passage sentence that best supports a question, or null when there is no clear winner. Pure. */
export function evidenceFor(q, sentences) {
  const ev = stemsOf(`${q.why} ${q.choices?.[q.a] ?? ""}`);
  const scored = sentences
    .map((s, i) => ({ i, score: [...stemsOf(s.text)].filter((x) => ev.has(x)).length }))
    .sort((a, b) => b.score - a.score);
  if (!scored.length || scored[0].score < 2) return null;
  if (scored[1] && scored[1].score === scored[0].score) return null;
  return { index: scored[0].i, score: scored[0].score, scored };
}

/** Pure engine: cases from the passage questions. [] when the unit cannot support a mystery. */
export function buildMystery(pool, rng, { count } = {}) {
  const qs = pool.passage?.qs || [];
  const sentences = passageSentences(pool);
  if (sentences.length < 3 || !qs.length) return [];
  const cases = [];
  for (const q of qs) {
    const ev = evidenceFor(q, sentences);
    if (!ev) continue;
    const clue = sentences[ev.index];
    const key = pool.words.find((w) => findForm(clue.text, w));
    if (!key) continue;
    const decoys = ev.scored
      .filter((x) => x.i !== ev.index && norm(sentences[x.i].text) !== norm(clue.text))
      .sort(
        (a, b) =>
          Number(pool.words.some((w) => findForm(sentences[b.i].text, w))) -
            Number(pool.words.some((w) => findForm(sentences[a.i].text, w))) || b.score - a.score,
      )
      .slice(0, 2)
      .map((x) => sentences[x.i].text);
    if (decoys.length < 2) continue;
    const cards = rng.shuffle([clue.text, ...decoys]);
    const meaning = buildQuestion("word-def", key, pool, rng);
    if (!meaning) continue;
    const n = cases.length + 1;
    cases.push({
      question: clean(q.q),
      keyId: key.id,
      steps: [
        {
          type: "clue",
          id: `rm-${n}-clue`,
          wordId: key.id,
          dim: "ctx",
          stem: "Which clue card helps answer the case question?",
          choices: cards,
          answer: cards.indexOf(clue.text),
          hint: "Look for the card that talks about the same thing as the question. Ignore cards about something else.",
          why: "This card holds the evidence.",
        },
        {
          ...meaning,
          id: `rm-${n}-meaning`,
          type: "clue-word",
          stem: `A key word in the clue is “${key.hw}”. What does it mean?`,
          sentence: clue.text,
          say: clue.text,
        },
        {
          type: "solve",
          id: `rm-${n}-solve`,
          wordId: key.id,
          dim: "ctx",
          stem: clean(q.q),
          sentence: clue.text,
          say: `${q.q}`,
          choices: q.choices,
          answer: q.a,
          hint: "Use the clue card and what the key word means to decide.",
          why: clean(q.why),
        },
      ],
      mcs: [newMc(), newMc(), newMc()],
      step: 0,
    });
  }
  return cases.slice(0, count || CASES[pool.band] || 3);
}

const STEP = [
  ["Step 1 of 3: find the clue card", "Paso 1 de 3: encuentra la tarjeta pista"],
  ["Step 2 of 3: the key word", "Paso 2 de 3: la palabra clave"],
  ["Step 3 of 3: solve the case", "Paso 3 de 3: resuelve el caso"],
];

const spec = {
  id: "reading-mystery",
  title: TITLE,
  howTo: [
    [
      "Each case asks a question about the story. Read the question first.",
      "Cada caso hace una pregunta sobre la lectura. Lee primero la pregunta.",
    ],
    [
      "Step 1: pick the clue card, the sentence from the story that helps answer it.",
      "Paso 1: elige la tarjeta pista, la oración de la lectura que ayuda a responder.",
    ],
    [
      "Step 2: say what a key word in that clue means. Step 3: answer the question.",
      "Paso 2: di qué significa una palabra clave de esa pista. Paso 3: responde la pregunta.",
    ],
    [
      "Wrong picks never give away the answer. Retry and hints are free. Use Listen to hear any card.",
      "Una elección equivocada nunca da la respuesta. Reintentar y las pistas son gratis. Usa Escuchar para oír cualquier tarjeta.",
    ],
  ],
  keys: [
    ["1 to 4", ["choose that answer", "elegir esa respuesta"]],
    ["Enter", ["go on after a right answer", "continuar tras una respuesta correcta"]],
  ],
  build: (env) => ({ cases: buildMystery(env.pool, env.rng), i: 0 }),
  valid: (s) => Array.isArray(s?.cases) && s.cases.length > 0,
  unplayable: (s) => !s.cases.length,
  isDone: (s) => s.i >= s.cases.length,
  progress: (s) => ({ done: Math.min(s.i, s.cases.length), total: s.cases.length }),
  view(s, env) {
    const I = env.I;
    const c = s.cases[s.i];
    const k = Math.min(c.step, 2);
    const q = c.steps[k];
    const mc = c.mcs[k];
    const last = k === 2;
    return html`<div class="vag-qcard vag-mystery">
      <p class="vag-qtype">
        <strong>${I.T("Case", "Caso")} ${s.i + 1} ${I.T("of", "de")} ${s.cases.length}</strong> ·
        ${I.T(...STEP[k])}
        ${env.pool.passage?.title ? html`<span class="vag-badge">${icon("reading")}${env.pool.passage.title}</span>` : ""}
      </p>
      <p class="vag-case-q">
        ${icon("detective")}<span
          ><span class="vag-sr">${I.S("The case question: ", "La pregunta del caso: ")}</span
          ><strong>${c.question}</strong></span
        >
      </p>
      ${stemHTML(q, env)}
      ${
        k === 0
          ? html`<ul class="vag-cardlist">
              ${q.choices.map((t) => html`<li>${env.speakBtn(t, "")}</li>`)}
            </ul>`
          : ""
      }
      ${choicesHTML(q, mc, env)}
      <div class="vag-actions">
        ${hintButton(mc, env)}
        ${mc.done ? html`<button type="button" class="btn btn-primary" data-next data-fk="next" data-autofocus>${last ? (s.i + 1 >= s.cases.length ? I.T("Close the case", "Cerrar el caso") : I.T("Next case", "Siguiente caso")) : I.T("Next step", "Siguiente paso")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${mcFeedback(q, mc, env)}
    </div>`;
  },
  click(el, s, env) {
    const c = s.cases[s.i];
    const k = Math.min(c.step, 2);
    if (el.closest("[data-next]")) {
      if (!c.mcs[k].done) return false;
      if (k < 2) c.step += 1;
      else s.i += 1;
      return true;
    }
    return mcAct(el, c.steps[k], c.mcs[k], env, { kind: c.steps[k].type });
  },
  key(ev, s) {
    const c = s.cases[s.i];
    const k = Math.min(c.step, 2);
    if (ev.key === "Enter" && c.mcs[k].done && !ev.target.closest("button")) {
      if (k < 2) c.step += 1;
      else s.i += 1;
      return true;
    }
    return false;
  },
  extra: (s) => ({ cases: s.cases.length }),
};

/** True when this pool's passage can support at least one mystery case. */
export const supported = (pool, seed = 1) => buildMystery(pool, rngFor(seed)).length > 0;

export default {
  id: "reading-mystery",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb:
    "Solve a short mystery from the lesson's story: find the clue card, work out a key word, then answer.",
  blurbEs:
    "Resuelve un misterio corto de la lectura: encuentra la tarjeta pista, entiende una palabra clave y responde.",
  purpose: "Use word meaning and evidence from the text together to answer a question.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["ctx", "mean"],
  mount(root, opts) {
    const pool = normalize(opts);
    const runN = Number.isInteger(opts.run) ? opts.run : 0;
    if (
      !supported(
        pool,
        opts.seed != null ? opts.seed + runN : seedFor("reading-mystery", pool, runN),
      )
    ) {
      const handle = contextDetective.mount(root, opts);
      handle.note = FALLBACK_NOTE[0];
      try {
        opts.onNote?.(FALLBACK_NOTE[0]);
      } catch {}
      return handle;
    }
    return mountGame(root, opts, spec);
  },
  engine: { build: buildMystery, evidence: evidenceFor, supported },
};
