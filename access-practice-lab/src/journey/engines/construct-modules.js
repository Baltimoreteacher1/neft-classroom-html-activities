// Language Construction Engine, selection modules: connector, morphology, pronoun, discourse.
// Pure logic, no DOM. Feedback explains the relationship or the part type and never states the answer:
// a wrong connector gets the relation in plain words, a wrong referent gets "check who does the action",
// a wrong order gets a count and the first wrong place, never the key.
import { CONNECTORS, MORPHEMES } from "../../lang/lexicon.js";
import { findPhrase } from "../../lang/text.js";

const T = (en, es) => [en, es];

// ── deterministic helpers (no Math.random: a reload must show the same screen) ──
export function hash32(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h >>> 0;
}
export const stableShuffle = (list, seed) =>
  [...list]
    .map((x, i) => [x, hash32(`${seed}|${i}|${typeof x === "string" ? x : JSON.stringify(x)}`)])
    .sort((a, b) => a[1] - b[1])
    .map(([x]) => x);
const asArray = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);

// ── connector ────────────────────────────────────────────────────────────────
const RELATION = {
  cause: [
    T(
      "one idea is the reason and the other is the result",
      "una idea es la razón y la otra es el resultado",
    ),
    T(
      "one part tells why, the other tells what happened",
      "una parte dice por qué y la otra dice qué pasó",
    ),
  ],
  contrast: [
    T("the two ideas are different from each other", "las dos ideas son distintas entre sí"),
    T("the second idea goes against the first", "la segunda idea va en contra de la primera"),
  ],
  sequence: [
    T("one thing happens before the other", "una cosa pasa antes que la otra"),
    T("the events happen in an order", "los sucesos pasan en un orden"),
  ],
  addition: [
    T("the second idea adds to the first", "la segunda idea suma a la primera"),
    T("both ideas belong together", "las dos ideas van juntas"),
  ],
};
const MINIMAL = T(
  "Check how these two ideas are related.",
  "Revisa cómo se relacionan estas dos ideas.",
);
const mentions = (text, words) => words.some((w) => findPhrase(text, w).length);

/** First candidate (en and es both) that names none of the correct options. */
export function scrub(candidates, oks) {
  return candidates.find((c) => !mentions(c[0], oks) && !mentions(c[1], oks)) || MINIMAL;
}

function gapFeedback(task, gap, chosen) {
  if (chosen == null) return null;
  const note = task.notes?.[chosen];
  if (gap.ok.includes(chosen)) {
    const rel = RELATION[gap.relation]?.[0];
    return {
      tone: "right",
      t: note
        ? T(note, note)
        : rel
          ? T(`Yes: ${rel[0]}.`, `Sí: ${rel[1]}.`)
          : T("Yes, that fits.", "Sí, eso encaja."),
    };
  }
  const variants = RELATION[gap.relation] || [];
  const withNote = (r) =>
    note && !mentions(note, gap.ok)
      ? [`These two parts: ${r[0]}. ${note}`, `Estas dos partes: ${r[1]}. ${note}`]
      : [`These two parts: ${r[0]}.`, `Estas dos partes: ${r[1]}.`];
  const cands = variants.flatMap((r) => [
    withNote(r),
    [`These two parts: ${r[0]}.`, `Estas dos partes: ${r[1]}.`],
  ]);
  return { tone: "hint", t: scrub(cands, gap.ok) };
}

export function evaluateConnector(task, input) {
  const answers = Array.isArray(input) ? input : input?.answers || [];
  const items = task.gaps.map((g, index) => {
    const chosen = answers[index] ?? null;
    return {
      index,
      chosen,
      answered: chosen != null,
      ok: chosen != null && g.ok.includes(chosen),
      feedback: gapFeedback(task, g, chosen),
    };
  });
  const wrong = items.filter((x) => x.answered && !x.ok);
  const accepted = items.every((x) => x.ok);
  return {
    module: "connector",
    accepted,
    items,
    firstWrong: wrong.length ? wrong[0].index : -1,
    summary: accepted
      ? {
          tone: "right",
          t: T(
            "Every gap has a connector that fits.",
            "Cada espacio tiene un conector que encaja.",
          ),
        }
      : {
          tone: "hint",
          t: T(
            `${items.filter((x) => x.ok).length} of ${items.length} gaps fit.`,
            `${items.filter((x) => x.ok).length} de ${items.length} espacios encajan.`,
          ),
        },
    nextMove: accepted
      ? null
      : items.some((x) => !x.answered) && !wrong.length
        ? T("Choose a connector for every gap.", "Elige un conector para cada espacio.")
        : T(
            `Look again at gap ${wrong[0].index + 1}.`,
            `Mira otra vez el espacio ${wrong[0].index + 1}.`,
          ),
  };
}
/** Options in a stable order so the correct one is not always first. */
export const connectorOptions = (task, i) =>
  stableShuffle(task.gaps[i].options, `${task.title}|gap${i}`);

// ── morphology ───────────────────────────────────────────────────────────────
export const PART_TYPES = ["prefix", "root", "suffix"];
const TYPE_NAME = {
  prefix: T("prefix", "prefijo"),
  root: T("root", "raíz"),
  suffix: T("suffix", "sufijo"),
};
const TYPE_PLACE = {
  prefix: T("beginning", "principio"),
  root: T("middle", "medio"),
  suffix: T("end", "final"),
};
export const typeName = (t) => TYPE_NAME[t] || T(t, t);
const cleanPart = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/[-\s]/g, "");

export const partsByType = (word) =>
  Object.fromEntries(PART_TYPES.map((type) => [type, word.parts.filter((p) => p.type === type)]));
/** Slots the learner sees per type: always one, more when the word has several parts of that type. */
export const slotCounts = (word) =>
  Object.fromEntries(PART_TYPES.map((type) => [type, Math.max(1, partsByType(word)[type].length)]));
export const emptySlots = (word) =>
  Object.fromEntries(PART_TYPES.map((type) => [type, Array(slotCounts(word)[type]).fill(null)]));

/** Chips for one word. Build: its parts, shuffled. Decompose: its parts plus two chips that belong to other words. */
export function morphChips(task, wi) {
  const word = task.words[wi];
  const own = word.parts.map((p) => p.t);
  const mine = new Set(own.map(cleanPart));
  let extra = [];
  if (word.mode === "decompose") {
    const pool = [
      ...task.words.flatMap((w, i) => (i === wi ? [] : w.parts.map((p) => p.t))),
      ...MORPHEMES.map((m) => m.m),
    ].filter((t) => !mine.has(cleanPart(t)));
    extra = stableShuffle([...new Set(pool)], `${word.word}|decoy`).slice(0, 2);
  }
  return stableShuffle([...own, ...extra], `${word.word}|chips`);
}

/** The meaning-match question: the root's (else the first part's) meaning among three options. */
export function meaningQuestion(task, wi) {
  const word = task.words[wi];
  const part = word.parts.find((p) => p.type === "root") || word.parts[0];
  const decoys = [
    ...task.words.flatMap((w, i) => (i === wi ? [] : w.parts.map((p) => p.meaning))),
    ...MORPHEMES.map((m) => m.meaning),
  ].filter((m) => m && m !== part.meaning);
  const options = stableShuffle(
    [part.meaning, ...stableShuffle([...new Set(decoys)], `${word.word}|meaning`).slice(0, 2)],
    `${word.word}|mopts`,
  );
  return { part, options, answer: part.meaning };
}

function wordResult(word, wi, task, w) {
  const slots = w?.slots || {};
  const exp = partsByType(word);
  const per = [];
  for (const type of PART_TYPES) {
    const want = exp[type].map((p) => cleanPart(p.t));
    const got = asArray(slots[type]);
    const pool = [...want];
    got.forEach((t, k) => {
      if (!t) return;
      const at = pool.indexOf(cleanPart(t));
      if (at >= 0) {
        pool.splice(at, 1);
        per.push({ type, slot: k, t, state: "right" });
      } else per.push({ type, slot: k, t, state: "wrong" });
    });
    const filled = got.filter(Boolean).length;
    if (want.length && filled < want.length)
      per.push({ type, slot: got.length, t: null, state: "missing" });
  }
  const built =
    per.length > 0 &&
    per.every((x) => x.state === "right") &&
    PART_TYPES.every((type) => asArray(slots[type]).filter(Boolean).length === exp[type].length);
  const q = meaningQuestion(task, wi);
  const meaningOk = w?.meaning != null && w.meaning === q.answer;
  const note = (x) => {
    const n = TYPE_NAME[x.type];
    const place = TYPE_PLACE[x.type];
    if (x.state === "right") return T(`The ${n[0]} “${x.t}” fits.`, `El ${n[1]} “${x.t}” encaja.`);
    if (x.state === "missing")
      return T(
        `Look at the ${n[0]} slot: is something missing?`,
        `Mira el espacio del ${n[1]}: ¿falta algo?`,
      );
    return T(
      `Check the ${n[0]}: which chip matches the ${place[0]} of “${word.word}”?`,
      `Revisa el ${n[1]}: ¿qué ficha coincide con el ${place[1]} de “${word.word}”?`,
    );
  };
  return {
    index: wi,
    word: word.word,
    per: per.map((x) => ({ ...x, feedback: note(x) })),
    built,
    answered: w?.meaning != null,
    meaningOk,
    accepted: built && meaningOk,
  };
}

export function evaluateMorphology(task, input) {
  const words = Array.isArray(input) ? input : input?.words || [];
  const items = task.words.map((word, wi) => wordResult(word, wi, task, words[wi]));
  const accepted = items.every((x) => x.accepted);
  const first = items.find((x) => !x.accepted);
  return {
    module: "morphology",
    accepted,
    items,
    summary: accepted
      ? {
          tone: "right",
          t: T(
            "Every word is built and its meaning matches.",
            "Cada palabra está armada y su significado coincide.",
          ),
        }
      : {
          tone: "hint",
          t: T(
            `${items.filter((x) => x.accepted).length} of ${items.length} words done.`,
            `${items.filter((x) => x.accepted).length} de ${items.length} palabras listas.`,
          ),
        },
    nextMove: accepted
      ? null
      : !first.built
        ? T(`Build “${first.word}” from its parts.`, `Arma “${first.word}” con sus partes.`)
        : T(
            `Pick what the meaning part of “${first.word}” means.`,
            `Elige qué significa la parte con significado de “${first.word}”.`,
          ),
  };
}

// ── pronoun ──────────────────────────────────────────────────────────────────
export const pronounOptions = (task, i) =>
  stableShuffle(task.pronouns[i].options, `${task.title || "pronoun"}|p${i}`);
const okList = (p) => asArray(p.ok);

export function evaluatePronoun(task, input) {
  const answers = Array.isArray(input) ? input : input?.answers || [];
  const ids = (task.text || []).map((s) => s.id);
  const items = task.pronouns.map((p, index) => {
    const chosen = answers[index] ?? null;
    const ok = chosen != null && okList(p).includes(chosen);
    const at = ids.indexOf(p.sentence);
    const lookAt = at > 0 ? ids[at - 1] : p.sentence;
    let feedback = null;
    if (ok)
      feedback = {
        tone: "right",
        t: T(
          `Yes: “${p.phrase}” points back to “${chosen}”.`,
          `Sí: “${p.phrase}” se refiere a “${chosen}”.`,
        ),
      };
    else if (chosen != null)
      feedback = {
        tone: "hint",
        t: T(
          `Check who is doing the action in the sentence before “${p.phrase}”.`,
          `Fíjate en quién hace la acción en la oración anterior a “${p.phrase}”.`,
        ),
      };
    return { index, phrase: p.phrase, chosen, answered: chosen != null, ok, lookAt, feedback };
  });
  const wrong = items.filter((x) => x.answered && !x.ok);
  const accepted = items.length > 0 && items.every((x) => x.ok);
  return {
    module: "pronoun",
    accepted,
    items,
    firstWrong: wrong.length ? wrong[0].index : -1,
    summary: accepted
      ? {
          tone: "right",
          t: T(
            "Every pronoun points to the right word.",
            "Cada pronombre apunta a la palabra correcta.",
          ),
        }
      : {
          tone: "hint",
          t: T(
            `${items.filter((x) => x.ok).length} of ${items.length} pronouns match.`,
            `${items.filter((x) => x.ok).length} de ${items.length} pronombres coinciden.`,
          ),
        },
    nextMove: accepted
      ? null
      : wrong.length
        ? T(
            `Read the sentence before “${wrong[0].phrase}” again.`,
            `Lee otra vez la oración anterior a “${wrong[0].phrase}”.`,
          )
        : T("Choose what every pronoun points to.", "Elige a qué apunta cada pronombre."),
  };
}

// ── discourse ────────────────────────────────────────────────────────────────
export const validOrders = (task) => [task.order, ...(task.alt || [])];
const jobOf = (word) =>
  Object.keys(CONNECTORS).find((j) => CONNECTORS[j].includes(String(word).toLowerCase())) || null;

/** Starting order: a stable shuffle that is never a valid order. */
export function initialOrder(task) {
  const ids = task.units.map((u) => u.id);
  const valid = validOrders(task).map((o) => o.join("|"));
  let order = stableShuffle(ids, `${task.title}|order`);
  for (let k = 0; k < ids.length && valid.includes(order.join("|")); k++)
    order = [...order.slice(1), order[0]];
  return order;
}

/** Connector choices for gap i: authored options, else the word plus two from other jobs. */
export function discourseOptions(task, i) {
  const c = task.connectors[i];
  if (c.options?.length) return stableShuffle(c.options, `${task.title}|c${i}`);
  const job = jobOf(c.word);
  const pool = Object.keys(CONNECTORS)
    .filter(
      (j) => j !== job && ["sequence", "cause", "contrast", "addition", "example"].includes(j),
    )
    .flatMap((j) => CONNECTORS[j].filter((w) => !w.includes(" ")).slice(0, 3));
  return stableShuffle(
    [c.word, ...stableShuffle(pool, `${task.title}|d${i}`).slice(0, 2)],
    `${task.title}|o${i}`,
  );
}

export function evaluateDiscourse(task, input) {
  const order = input?.order || [];
  const connectors = input?.connectors || [];
  let best = { matches: -1, key: task.order };
  for (const key of validOrders(task)) {
    const matches = key.filter((id, i) => order[i] === id).length;
    if (matches > best.matches) best = { matches, key };
  }
  const total = task.units.length;
  const orderOk = order.length === total && best.matches === total;
  const firstWrong = orderOk ? -1 : best.key.findIndex((id, i) => order[i] !== id);
  const conns = (task.connectors || []).map((c, index) => {
    const chosen = connectors[index] ?? null;
    return {
      index,
      before: c.before,
      chosen,
      answered: chosen != null,
      ok: chosen != null && [c.word, ...asArray(c.ok)].includes(chosen),
    };
  });
  const cWrong = conns.find((c) => c.answered && !c.ok);
  const accepted = orderOk && conns.every((c) => c.ok);
  const wrongPlace = firstWrong + 1;
  return {
    module: "discourse",
    accepted,
    order: { ok: orderOk, right: best.matches, total, firstWrong: orderOk ? null : wrongPlace },
    connectors: conns,
    summary: accepted
      ? {
          tone: "right",
          t: T(
            "The text flows: every sentence and connector is in place.",
            "El texto fluye: cada oración y cada conector están en su lugar.",
          ),
        }
      : {
          tone: "hint",
          t: orderOk
            ? T(
                "The order works. The connectors are next.",
                "El orden funciona. Ahora siguen los conectores.",
              )
            : T(
                `${best.matches} of ${total} sentences are in a place that works.`,
                `${best.matches} de ${total} oraciones están en un lugar que funciona.`,
              ),
        },
    nextMove: accepted
      ? null
      : !orderOk
        ? wrongPlace === 1
          ? T(
              "Which sentence would open this text? Read place 1 aloud.",
              "¿Qué oración abriría este texto? Lee en voz alta el lugar 1.",
            )
          : T(
              `Read place ${wrongPlace - 1} and place ${wrongPlace} aloud. Does the second follow from the first?`,
              `Lee en voz alta el lugar ${wrongPlace - 1} y el lugar ${wrongPlace}. ¿La segunda sigue a la primera?`,
            )
        : cWrong
          ? T(
              `Read the two sentences around connector ${cWrong.index + 1}. How is the second related to the first?`,
              `Lee las dos oraciones alrededor del conector ${cWrong.index + 1}. ¿Cómo se relaciona la segunda con la primera?`,
            )
          : T("Choose a connector for every gap.", "Elige un conector para cada espacio."),
  };
}
