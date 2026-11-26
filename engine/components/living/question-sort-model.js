// living/question-sort-model.js — the mathematics and every sentence of the
// question-sort play (lesson 2-1, statistical questions).
//
// Pure functions only (no DOM): a question is "statistical" exactly when the
// answers you collect for it are expected to vary. The play DRAWS that: ask
// the same people each question and the answers land as dots — one pile for a
// fixed-answer question, a spread for a statistical one. The authored
// `statistical` flag must agree with the authored answers, so a scene can never
// say a question varies while its dots all sit on one number.

export const MIN_N = 3;
export const MAX_N = 7; // tallest pile of dots the stage reserves room for
export const LINE_CHARS = 50; // one line of a question card
export const MAX_TICKS = 12;

export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const distinct = (a) => new Set(a).size;
export const isStatistical = (answers) => distinct(answers) > 1;
export const plural = (n, one, many) => (n === 1 ? one : many);
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Split text into at most two lines of LINE_CHARS; null when it will not fit. */
export function wrap(text, max = LINE_CHARS) {
  const lines = [];
  let cur = "";
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    if (cur && cur.length + 1 + w.length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines.length >= 1 && lines.length <= 2 && lines.every((l) => l.length <= max)
    ? lines
    : null;
}

const pair = (p, maxLen = 160) => {
  if (!p || typeof p.en !== "string" || !p.en.trim()) return null;
  const es = typeof p.es === "string" && p.es.trim() ? p.es : null;
  return es && p.en.length <= maxLen && es.length <= maxLen ? { en: p.en, es } : null;
};

const quoted = (p) => ({ en: `“${p.en}”`, es: `«${p.es}»` });

function validAxis(a, answers) {
  const { min, max, step } = a || {};
  if (!okInt(min, 0, 999) || !okInt(max, 1, 999) || !okInt(step, 1, 999) || max <= min) return null;
  if ((max - min) / step > MAX_TICKS) return null;
  if (!answers.every((x) => x >= min && x <= max)) return null;
  const label = pair(a.label, 24);
  return label ? { min, max, step, label } : null;
}

function validQuestion(q, n) {
  const text = pair(q?.text, 100);
  const answers = Array.isArray(q?.answers) ? q.answers.map(Number) : [];
  if (!text || answers.length !== n || !answers.every((x) => Number.isInteger(x))) return null;
  if (typeof q.statistical !== "boolean" || isStatistical(answers) !== q.statistical) return null;
  const axis = validAxis(q.axis, answers);
  const quote = quoted(text);
  const lines = { en: wrap(quote.en), es: wrap(quote.es) };
  if (!axis || !lines.en || !lines.es) return null;
  return { text, quote, lines, answers, statistical: q.statistical, axis };
}

const exactlyOne = (xs) => xs.filter((x) => x.statistical).length === 1;

function validTransfer(t) {
  const options = Array.isArray(t?.options) ? t.options : [];
  if (options.length < 3 || options.length > 4) return null;
  const out = options.map((o) => {
    const text = pair(o?.text, 100);
    const cue = o?.statistical === true ? { en: "", es: "" } : pair(o?.cue, 220);
    return text && cue && typeof o.statistical === "boolean"
      ? { text, cue, statistical: o.statistical }
      : null;
  });
  if (out.some((o) => !o) || !exactlyOne(out)) return null;
  const prompt = pair(t.prompt, 100);
  return prompt ? { prompt, options: out } : null;
}

const crowdOf = (c) => {
  const en = c?.en;
  const es = c?.es;
  const ok = (x) => x && typeof x.one === "string" && typeof x.many === "string";
  return ok(en) && ok(es) ? { en, es } : null;
};

export function validateQuestionSort(cfg) {
  const pairQ = Array.isArray(cfg?.pair) ? cfg.pair : [];
  const moreQ = Array.isArray(cfg?.more) ? cfg.more : [];
  if (pairQ.length !== 2 || moreQ.length !== 2) return null;
  const n = Array.isArray(pairQ[0]?.answers) ? pairQ[0].answers.length : 0;
  if (!okInt(n, MIN_N, MAX_N)) return null;
  const duo = pairQ.map((q) => validQuestion(q, n));
  const more = moreQ.map((q) => validQuestion(q, n));
  if (duo.some((q) => !q) || more.some((q) => !q)) return null;
  if (!exactlyOne(duo) || !exactlyOne(more)) return null;
  const transfer = validTransfer(cfg.transfer);
  const crowd = crowdOf(cfg.crowd);
  const story = pair(cfg.story, 400);
  if (!transfer || !crowd || !story) return null;
  return { n, duo, more, transfer, crowd, story };
}

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

/** Facts about one question's answers, computed from the data. */
export function facts(q) {
  const a = q.answers;
  return { d: distinct(a), min: Math.min(...a), max: Math.max(...a), one: a[0] };
}

/** The predict choices: which question will get different answers. */
export function predictOptions(v) {
  const s = v.duo.findIndex((q) => q.statistical);
  const f = 1 - s;
  return [
    { kind: "stat", correct: true, label: { en: `Question ${s + 1}`, es: `Pregunta ${s + 1}` } },
    { kind: "fixed", label: { en: `Question ${f + 1}`, es: `Pregunta ${f + 1}` } },
    {
      kind: "both",
      label: { en: "Both questions", es: "Las dos preguntas" },
    },
    { kind: "neither", label: { en: "Neither question", es: "Ninguna de las dos" } },
  ];
}

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function questionSortCopy(v) {
  const { n, duo, crowd } = v;
  const s = duo.findIndex((q) => q.statistical);
  const f = 1 - s;
  const [S, F] = [duo[s], duo[f]];
  const fs = facts(S);
  const ff = facts(F);
  const one = { en: crowd.en.one, es: crowd.es.one };
  const many = { en: crowd.en.many, es: crowd.es.many };
  const qn = (i) => ({ en: `Question ${i + 1}`, es: `Pregunta ${i + 1}` });
  const dAns = (d) => ({
    en: `${d} different ${plural(d, "answer", "answers")}`,
    es: `${d} ${plural(d, "respuesta distinta", "respuestas distintas")}`,
  });
  const badge = (stat) =>
    stat
      ? { en: "Statistical: answers vary", es: "Estadística: las respuestas varían" }
      : { en: "Not statistical: one fixed answer", es: "No estadística: una sola respuesta fija" };
  const ariaFor = (lang) => {
    const al = (q) => q.answers.join(", ");
    return lang === "en"
      ? `Two questions, each asked of ${n} ${many.en}. ${qn(f).en}: every answer is ${ff.one}. ${qn(s).en}: the answers are ${al(S)}, ${fs.d} different values from ${fs.min} to ${fs.max}.`
      : `Dos preguntas, cada una hecha a ${n} ${many.es}. ${qn(f).es}: todas las respuestas son ${ff.one}. ${qn(s).es}: las respuestas son ${al(S)}, ${fs.d} valores distintos de ${fs.min} a ${fs.max}.`;
  };
  const point = (i) => ({
    en: `Read ${qn(i).en} again: ${duo[i].quote.en}`,
    es: `Lee otra vez la ${qn(i).es}: ${duo[i].quote.es}`,
  });
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: {
      en: "Questions that expect different answers",
      es: "Preguntas que esperan respuestas distintas",
    },
    ariaLabel: { en: ariaFor("en"), es: ariaFor("es") },
    printSummary: {
      en: `${qn(f).en} (${F.text.en}) has one fixed answer, ${ff.one}, so it is not a statistical question. ${qn(s).en} (${S.text.en}) gets ${fs.d} different answers (${S.answers.join(", ")}), so it is a statistical question: you have to collect data and the answers vary.`,
      es: `${qn(f).es} (${F.text.es}) tiene una sola respuesta fija, ${ff.one}, así que no es una pregunta estadística. ${qn(s).es} (${S.text.es}) recibe ${fs.d} respuestas distintas (${S.answers.join(", ")}), así que sí es una pregunta estadística: hay que reunir datos y las respuestas varían.`,
    },
    scene: {
      situate: { en: "Two questions", es: "Dos preguntas" },
      predict: { en: "Predict", es: "Predice" },
      ask: { en: "Ask and collect", es: "Pregunta y reúne" },
      name: { en: "Name the difference", es: "Nombra la diferencia" },
      sort: { en: "Sort new questions", es: "Clasifica preguntas nuevas" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    tag: (i) => qn(i),
    badge,
    axisLabel: (q) => q.axis.label,
    situateSay: {
      en: `${v.story.en} Read both questions.`,
      es: `${v.story.es} Lee las dos preguntas.`,
    },
    predictSay: {
      en: `Suppose you ask ${n} ${many.en} each question. Think about the answers you would get.`,
      es: `Imagina que le haces cada pregunta a ${n} ${many.es}. Piensa en las respuestas que recibirías.`,
    },
    predictQ: {
      en: `Which question would get different answers from different ${many.en}?`,
      es: `¿Cuál pregunta recibiría respuestas distintas de distintos ${many.es}?`,
    },
    /** A cue for a wrong choice: points at a question card and asks about its answers. */
    predictCue(kind) {
      if (kind === "fixed") {
        const p = point(f);
        return {
          en: `${p.en} Could ${n} ${many.en} give ${n} different answers to it, or would they all agree?`,
          es: `${p.es} ¿Podrían ${n} ${many.es} dar ${n} respuestas distintas, o todos coincidirían?`,
        };
      }
      if (kind === "both") {
        const p = point(f);
        return {
          en: `${p.en} Would two ${many.en} ever give different answers to it?`,
          es: `${p.es} ¿Darían alguna vez respuestas distintas dos ${many.es}?`,
        };
      }
      const p = point(s);
      return {
        en: `${p.en} Would every one of the ${many.en} give exactly the same answer?`,
        es: `${p.es} ¿Darían los ${many.es} exactamente la misma respuesta?`,
      };
    },
    /** Which question card the cue points at (so the picture can highlight it). */
    cueRow: (kind) => (kind === "neither" ? s : f),
    predictOk: {
      en: `Let's find out. Ask the ${many.en} one at a time and watch the answers land on the number line.`,
      es: `Vamos a comprobarlo. Pregunta a los ${many.es} uno por uno y mira cómo caen las respuestas en la recta numérica.`,
    },
    askSay: {
      en: `Ask the next ${one.en}. Each ${one.en}'s answer to each question becomes one dot.`,
      es: `Pregunta al siguiente ${one.es}. La respuesta de cada ${one.es} a cada pregunta se vuelve un punto.`,
    },
    askBtn: { en: `Ask the next ${one.en}`, es: `Pregunta al siguiente ${one.es}` },
    asked(k) {
      const a = duo.map((q) => q.answers[k - 1]);
      return {
        en: `${cap(one.en)} ${k} of ${n} answers: ${qn(0).en} → ${a[0]}, ${qn(1).en} → ${a[1]}.`,
        es: `${cap(one.es)} ${k} de ${n} responde: ${qn(0).es} → ${a[0]}, ${qn(1).es} → ${a[1]}.`,
      };
    },
    askDone: {
      en: `All ${n} ${many.en} answered. ${qn(f).en}: every answer is ${ff.one}. ${qn(s).en}: ${fs.d} different answers, from ${fs.min} to ${fs.max}.`,
      es: `Los ${n} ${many.es} respondieron. ${qn(f).es}: todas las respuestas son ${ff.one}. ${qn(s).es}: ${fs.d} respuestas distintas, de ${fs.min} a ${fs.max}.`,
    },
    nameSay: {
      en: "A statistical question expects the answers to vary, so you have to collect data to answer it. A question with one fixed answer is not a statistical question.",
      es: "Una pregunta estadística espera que las respuestas varíen, así que hay que reunir datos para responderla. Una pregunta con una sola respuesta fija no es una pregunta estadística.",
    },
    nameExpr: {
      en: `${qn(f).en}: ${dAns(ff.d).en} · ${qn(s).en}: ${dAns(fs.d).en}`,
      es: `${qn(f).es}: ${dAns(ff.d).es} · ${qn(s).es}: ${dAns(fs.d).es}`,
    },
    sortSay: {
      en: "Does it work every time? Here are two new questions. Decide which kind each one is before its answers appear.",
      es: "¿Funciona siempre? Aquí hay dos preguntas nuevas. Decide de qué tipo es cada una antes de que aparezcan sus respuestas.",
    },
    sortQ: (q) => ({
      en: `Is this a statistical question? ${q.quote.en}`,
      es: `¿Es esta una pregunta estadística? ${q.quote.es}`,
    }),
    sortOptions: [
      { stat: true, label: { en: "Statistical", es: "Estadística" } },
      { stat: false, label: { en: "Not statistical", es: "No estadística" } },
    ],
    /** Cue for a wrong sort: a question about what the answers would be. */
    sortCue: (q) =>
      q.statistical
        ? {
            en: `Picture ${n} different people answering ${q.quote.en} Would they all give the same answer?`,
            es: `Imagina a ${n} personas diferentes respondiendo ${q.quote.es} ¿Darían todas la misma respuesta?`,
          }
        : {
            en: `Picture ${n} different people answering ${q.quote.en} Would you expect them to give different answers?`,
            es: `Imagina a ${n} personas diferentes respondiendo ${q.quote.es} ¿Esperarías respuestas distintas?`,
          },
    sortOk(q) {
      const k = facts(q);
      return q.statistical
        ? {
            en: `Yes. The ${n} answers differ (${dAns(k.d).en}), so you have to collect data.`,
            es: `Sí. Las ${n} respuestas son diferentes (${dAns(k.d).es}), así que hay que reunir datos.`,
          }
        : {
            en: `Yes. All ${n} answers are ${k.one}: one fixed answer, no variation.`,
            es: `Sí. Las ${n} respuestas son ${k.one}: una sola respuesta fija, sin variación.`,
          };
    },
    transferSay: { en: v.transfer.prompt.en, es: v.transfer.prompt.es },
    transferQ: {
      en: "Which of these is a statistical question?",
      es: "¿Cuál de estas es una pregunta estadística?",
    },
    transferOk: (o) => ({
      en: `Yes. ${quoted(o.text).en} Different people will give different answers, so you would collect data.`,
      es: `Sí. ${quoted(o.text).es} Personas diferentes darán respuestas distintas, así que reunirías datos.`,
    }),
    explainLabel: {
      en: "Explain: how can you tell a statistical question from one with a fixed answer?",
      es: "Explica: ¿cómo distingues una pregunta estadística de una con respuesta fija?",
    },
    explainFrame: {
      en: "A question is statistical when ___, because ___.",
      es: "Una pregunta es estadística cuando ___, porque ___.",
    },
  };
}
