// Experience compiler, step 2 — DESIGN. Pure and deterministic: from what EXTRACT found and what the instructor
// chose, decide the format, the number of scenes, which source facts become evidence artifacts (an object, a
// document, a data card, a recorded message), which become what a character knows, and the conflict: two competing
// explanations, the source's own and a plausible misreading the source evidence contradicts.
// Rules it keeps: every planned artifact and answer names the source sentences it is made of (`from`); the
// misreading is built only from the source's own words and is marked so the instructor can check it; invented things
// (a character's name when the source names nobody) are listed in `invented`.
import { stemsOf } from "./extract.js";

export const EXPERIENCE_TYPES = Object.freeze({
  investigation: {
    name: ["Investigation", "Investigación"],
    roles: [
      ["field scientist", "científica de campo"],
      ["neighbor who saw it happen", "vecino que lo vio"],
    ],
    scenes: [
      ["The site", "El lugar"],
      ["The records room", "La sala de registros"],
      ["The interview corner", "El rincón de entrevistas"],
      ["The report desk", "La mesa del informe"],
    ],
  },
  interview: {
    name: ["Interview", "Entrevista"],
    roles: [
      ["expert on the topic", "experta en el tema"],
      ["person who was there", "persona que estuvo allí"],
    ],
    scenes: [
      ["The waiting room", "La sala de espera"],
      ["The studio", "El estudio"],
      ["The notes table", "La mesa de notas"],
      ["The report desk", "La mesa del informe"],
    ],
  },
  mystery: {
    name: ["Mystery", "Misterio"],
    roles: [
      ["lead investigator", "investigadora principal"],
      ["witness", "testigo"],
    ],
    scenes: [
      ["Where it happened", "Donde ocurrió"],
      ["The evidence room", "La sala de evidencia"],
      ["The witness bench", "La banca del testigo"],
      ["The case desk", "La mesa del caso"],
    ],
  },
  simulation: {
    name: ["Simulation", "Simulación"],
    roles: [
      ["project lead", "líder del proyecto"],
      ["community member", "miembro de la comunidad"],
    ],
    scenes: [
      ["The field", "El campo"],
      ["The control room", "La sala de control"],
      ["The meeting room", "La sala de reuniones"],
      ["The decision desk", "La mesa de decisiones"],
    ],
  },
  debate: {
    name: ["Debate", "Debate"],
    roles: [
      ["speaker for the text's view", "portavoz de la idea del texto"],
      ["speaker for another view", "portavoz de otra idea"],
    ],
    scenes: [
      ["The hall", "El salón"],
      ["The fact table", "La mesa de datos"],
      ["The speakers' corner", "El rincón de los oradores"],
      ["The podium", "El podio"],
    ],
  },
  story: {
    name: ["Story", "Historia"],
    roles: [
      ["storyteller who knows the facts", "narradora que conoce los hechos"],
      ["character in the story", "personaje de la historia"],
    ],
    scenes: [
      ["The beginning", "El comienzo"],
      ["The turning point", "El momento clave"],
      ["The meeting", "El encuentro"],
      ["The ending desk", "La mesa del final"],
    ],
  },
  explanation: {
    name: ["Scientific explanation", "Explicación científica"],
    roles: [
      ["scientist", "científica"],
      ["lab partner", "compañero de laboratorio"],
    ],
    scenes: [
      ["The observation spot", "El lugar de observación"],
      ["The lab", "El laboratorio"],
      ["The discussion table", "La mesa de discusión"],
      ["The explanation desk", "La mesa de la explicación"],
    ],
  },
  media: {
    name: ["Media analysis", "Análisis de medios"],
    roles: [
      ["editor who checked the facts", "editora que revisó los datos"],
      ["reader with an opinion", "lector con una opinión"],
    ],
    scenes: [
      ["The newsroom", "La sala de redacción"],
      ["The fact-check desk", "La mesa de verificación"],
      ["The comments corner", "El rincón de comentarios"],
      ["The editor's desk", "La mesa de la editora"],
    ],
  },
});
export const TYPE_IDS = Object.keys(EXPERIENCE_TYPES);
export const INVENTED_NAMES = Object.freeze(["Dr. Lena Ortiz", "Sam Rivera"]);

/** The format that fits the material and the settings when the instructor leaves the type on "auto". */
export function chooseType(extract, settings = {}) {
  if (TYPE_IDS.includes(settings.type)) return settings.type;
  const n = (t) => extract.relations.filter((r) => r.type === t).length;
  const science = /science/i.test(settings.subject || "");
  if (n("cause") >= 3 && settings.keyUse === "Explain")
    return science ? "investigation" : "explanation";
  if (settings.keyUse === "Argue") return n("rival") ? "debate" : "media";
  if (settings.keyUse === "Narrate") return "story";
  if (extract.speakers.length && settings.keyUse === "Inform") return "interview";
  return n("rival") ? "mystery" : "investigation";
}

export const sceneCountFor = (minutes) => (minutes <= 20 ? 2 : minutes <= 50 ? 3 : 4);

const uniq = (a) => [...new Set(a)].sort((x, y) => x - y);
const stripOpener = (t) => {
  const s = String(t).replace(/^(?:At first|In the beginning|Early on|For a while),? /i, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** The conflict: the source's explanation and a misreading it contradicts. Three strategies, most grounded first. */
export function designConflict(extract) {
  const { relations, sentences, concepts } = extract;
  const text = (i) => sentences[i]?.text || "";
  const causes = relations.filter((r) => r.type === "cause");
  const rival = relations.find((r) => r.type === "rival");
  if (rival) {
    const after = causes.filter(
      (c) => c.i > rival.i && c.i !== rival.rebuttal && c.i <= rival.i + 4,
    );
    const own = after.length
      ? after[after.length - 1]
      : causes.filter((c) => c.i !== rival.i && c.i !== rival.rebuttal).pop();
    const contradictedBy = uniq([rival.rebuttal, ...(own ? [own.i] : [])].filter((i) => i >= 0));
    if (own && contradictedBy.length)
      return {
        strategy: "stated",
        sourceFrom: [own.i],
        sourceText: text(own.i).replace(/^["“]|["”]$/g, ""),
        misreadFrom: [rival.i],
        misreadText: stripOpener(text(rival.i)),
        contradictedBy,
      };
  }
  const main =
    causes.find((c) => ["because", "so", "leads to", "due to", "as a result"].includes(c.marker)) ||
    causes[0];
  if (main)
    return {
      strategy: "reversed",
      sourceFrom: uniq([main.causeFrom, main.i]),
      sourceText: text(main.i),
      misreadFrom: [main.i],
      misreadPair: [
        `It happened the other way around: "${main.effect}" came first and caused "${main.cause}".`,
        `Ocurrió al revés: "${main.effect}" pasó primero y causó "${main.cause}".`,
      ],
      contradictedBy: uniq([main.causeFrom, main.i]),
    };
  const [a, b] = concepts;
  const both =
    a && b
      ? sentences.find((s) => {
          const st = stemsOf(s.text);
          return st.includes(a.stem) && st.includes(b.stem);
        })
      : null;
  if (both)
    return {
      strategy: "isolated",
      sourceFrom: [both.i],
      sourceText: both.text,
      misreadFrom: [both.i],
      misreadPair: [
        `"${a.term}" and "${b.term}" have nothing to do with each other.`,
        `"${a.term}" y "${b.term}" no tienen nada que ver entre sí.`,
      ],
      contradictedBy: [both.i],
    };
  return null;
}

/** The most useful concept word of a set of sentences (for titles and suggested questions). */
function termOf(extract, from, avoid = new Set()) {
  const stems = new Set(from.flatMap((i) => stemsOf(extract.sentences[i]?.text || "")));
  const hit = extract.concepts.find((c) => stems.has(c.stem) && !avoid.has(c.term));
  return (
    hit?.term ||
    extract.concepts.find((c) => stems.has(c.stem))?.term ||
    extract.concepts[0]?.term ||
    "this"
  );
}

/**
 * @returns the plan: { type, sceneCount, conflict, evidence[], characters[], vocabulary[], invented[], notes[] }
 */
export function designExperience(extract, settings = {}) {
  const type = chooseType(extract, settings);
  const sceneCount = sceneCountFor(Number(settings.minutes) || 45);
  const conflict = designConflict(extract);
  const { sentences, relations, facts, speakers } = extract;
  const used = new Set();
  const take = (list) => {
    const out = uniq(list.filter((i) => i >= 0 && i < sentences.length));
    for (const i of out) used.add(i);
    return out;
  };
  const factAt = (i) => facts.find((f) => f.i === i);
  const reserved = new Set(
    conflict
      ? [
          ...conflict.misreadFrom,
          ...conflict.contradictedBy,
          ...(conflict.strategy === "stated" ? conflict.sourceFrom : []),
        ]
      : [],
  );
  const speakerLines = new Set(speakers.flatMap((s) => s.sentences));
  const free = (i) => !used.has(i) && !reserved.has(i) && !speakerLines.has(i) && factAt(i);
  const SRC = conflict ? ["ex-source"] : [];
  const MIS = conflict ? ["ex-misread"] : [];
  const evidence = [];

  // 1. a data card: the densest run of measurements
  const numbered = facts.filter((f) => f.numbers.length && free(f.i));
  const best = [...numbered].sort((a, b) => b.numbers.length - a.numbers.length || a.i - b.i)[0];
  if (best) {
    const run = [best.i];
    for (const step of [-1, 1])
      for (let i = best.i + step; free(i) && factAt(i).numbers.length && run.length < 3; i += step)
        run.push(i);
    evidence.push({
      id: "ev-data",
      kind: "data",
      from: take(run),
      supports: SRC,
      contradicts: [],
      strength: "strong",
    });
  }
  // 2. a document: the cause-and-effect chain in the source's own sentences
  const chain = relations.filter((r) => r.type === "cause" && free(r.i)).map((r) => r.i);
  const docFrom = chain.length
    ? chain.slice(0, 3)
    : facts
        .filter((f) => free(f.i))
        .slice(0, 2)
        .map((f) => f.i);
  if (docFrom.length)
    evidence.push({
      id: "ev-doc",
      kind: "document",
      from: take(docFrom),
      supports: SRC,
      contradicts: [],
      strength: "strong",
    });
  // 3. an object to examine: one concrete observation (a measured or described thing)
  const seen =
    facts.find((f) => free(f.i) && f.numbers.length) || facts.find((f) => free(f.i) && !f.cause);
  if (seen)
    evidence.push({
      id: "ev-object",
      kind: "object",
      from: take([seen.i]),
      supports: SRC,
      contradicts: [],
      strength: "weak",
    });
  // 4. a recorded message: the person the source quotes, else the source's closing sentences
  const speaker = speakers[0] || null;
  const tail = facts
    .filter((f) => free(f.i))
    .slice(-2)
    .map((f) => f.i);
  const audioFrom = speaker ? speaker.sentences : tail;
  if (audioFrom.length)
    evidence.push({
      id: "ev-audio",
      kind: "audio",
      from: take(audioFrom),
      speaker: speaker?.name || "",
      supports: SRC,
      contradicts: speaker && conflict?.strategy === "stated" ? MIS : [],
      strength: speaker ? "strong" : "weak",
    });
  // 5. the check: the source sentence that contradicts the misreading
  if (conflict) {
    const from =
      conflict.strategy === "stated"
        ? conflict.contradictedBy.filter((i) => !used.has(i))
        : conflict.contradictedBy;
    const checkFrom = from.length ? from : conflict.contradictedBy;
    evidence.push({
      id: "ev-check",
      kind: factAt(checkFrom[0])?.numbers.length ? "data" : "document",
      from: take(checkFrom),
      supports: SRC,
      contradicts: MIS,
      strength: "strong",
    });
  }
  // 6. testimony a character gives: the rival idea in the source's words (weak support for the misreading)
  if (conflict?.strategy === "stated")
    evidence.push({
      id: "ev-claim",
      kind: "testimony",
      from: take(conflict.misreadFrom),
      supports: MIS,
      contradicts: [],
      strength: "weak",
      givenBy: "c-witness",
    });

  // Characters: what each one is allowed to know is a list of source sentences.
  const roles = EXPERIENCE_TYPES[type].roles;
  const invented = [];
  const expertName = speaker?.name || INVENTED_NAMES[0];
  if (!speaker) invented.push({ what: "character-name", value: expertName });
  invented.push({ what: "character-name", value: INVENTED_NAMES[1] });
  const topic = (id, from, extra = {}) => {
    const f = take(from);
    if (!f.length) return null;
    const next = f[f.length - 1] + 1;
    const clarifyFrom = free(next) ? take([next]) : [];
    return {
      id,
      from: f,
      clarifyFrom,
      term: termOf(extract, f),
      cause: f.some((i) => factAt(i)?.cause),
      numbers: f.some((i) => factAt(i)?.numbers.length),
      ...extra,
    };
  };
  const defs = extract.vocabulary.map((v) => v.from[0]).filter((i) => free(i));
  const rest = () => facts.filter((f) => free(f.i)).map((f) => f.i);
  // The fact closest to the source's own explanation is the one the expert should be able to explain.
  const key = new Set(stemsOf(conflict?.sourceText || ""));
  const near = (i) =>
    stemsOf(sentences[i].text).filter((x) => key.has(x)).length + (factAt(i).cause ? 1 : 0);
  const closest = () => [...rest()].sort((a, b) => near(b) - near(a) || a - b).slice(0, 1);
  const past = () =>
    rest()
      .filter((i) => /\b(?:years?|ago|before|used to|once|long|first)\b/i.test(sentences[i].text))
      .slice(0, 1);
  const expertTopics = [
    topic("t-words", defs.slice(0, 1)),
    topic("t-how", closest()),
    topic("t-after", rest().slice(-1)),
  ].filter(Boolean);
  const witnessTopics = [
    topic("t-before", past().length ? past() : rest().slice(0, 1)),
    conflict?.strategy === "stated"
      ? {
          id: "t-idea",
          from: conflict.misreadFrom,
          clarifyFrom: [],
          term: termOf(extract, conflict.misreadFrom),
          gives: ["ev-claim"],
          rival: true,
        }
      : null,
    topic("t-saw", rest().slice(0, 1)),
  ].filter(Boolean);
  const fill = (topics, prefix) => {
    for (let n = 1; topics.length < 2 && rest().length; n++) {
      const t = topic(`${prefix}-more${n}`, rest().slice(0, 1));
      if (t) topics.push(t);
    }
  };
  fill(expertTopics, "t-x");
  fill(witnessTopics, "t-w");
  const characters = [
    {
      id: "c-expert",
      key: "expert",
      name: expertName,
      fromSource: Boolean(speaker),
      // A role the source states ("the science teacher") is kept in the source's words.
      role: speaker?.role ? [speaker.role, speaker.role] : roles[0],
      sourceRole: speaker?.role || "",
      topics: expertTopics,
    },
    {
      id: "c-witness",
      key: "witness",
      name: INVENTED_NAMES[1],
      fromSource: false,
      role: roles[1],
      sourceRole: "",
      topics: witnessTopics,
    },
  ].filter((c) => c.topics.length);

  for (const e of evidence) e.term = termOf(extract, e.from);
  const notes = [];
  if (!conflict) notes.push("no-conflict");
  else if (conflict.strategy !== "stated") notes.push("built-misreading");
  if (evidence.filter((e) => e.kind !== "testimony").length < 4) notes.push("few-artifacts");
  if (characters.length < 2) notes.push("few-characters");
  return {
    type,
    sceneCount,
    conflict,
    evidence,
    characters,
    vocabulary: extract.vocabulary,
    invented,
    notes,
  };
}
