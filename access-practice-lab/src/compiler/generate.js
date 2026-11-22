// Experience compiler, step 3 — GENERATE. Pure and deterministic: the plan from DESIGN becomes a complete mission
// definition in the lp-sim/1 schema (src/sim/schema.js): scenes with hotspots, characters with authorized knowledge,
// evidence, competing explanations, language tasks, branches (outcomes), acts, vocabulary and the kept source.
// Rules it keeps:
//   - Words taken from the source stay in the source's language, verbatim, and carry `from: [sentence index]`
//     (evidence bodies, character answers, clarifications, vocabulary meanings). They are never paraphrased.
//   - Everything this module authors (titles, prompts, questions, outcomes) comes from templates in English AND
//     Spanish. Outcomes are story consequences; nothing here is a score, a level or a timer.
//   - `compiled` records the settings, the conflict and what was invented, so the editor can show it to the instructor.
import { EXPERIENCE_TYPES } from "./design.js";
import { EV_SPOT, EV_TITLE, FRAMES, P, SPOT_XY, TASK_SPOT, USE_ASK, USE_VERB, questionFor } from "./templates.js";

export { FRAMES };

export const SCHEMA = "lp-sim/1";
export const COMPILER = "lp-compiler/1";
export const ART_BY_SCENE = Object.freeze(["site", "records", "interview", "report"]);
export const LOOKS = Object.freeze({ expert: "expert", witness: "neighbor" });

const same = (text) => [text, text];
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const join = (extract, from) =>
  from
    .map((i) => extract.sentences[i]?.text || "")
    .filter(Boolean)
    .join(" ");
const clip = (s, n) =>
  String(s).length > n
    ? `${String(s)
        .slice(0, n - 1)
        .trimEnd()}…`
    : String(s);

/** Keywords a typed question is matched on: the topic's own concept words, from the source. */
function keywordsFor(extract, t) {
  const words = new Set([t.term]);
  for (const i of [...t.from, ...(t.clarifyFrom || [])])
    for (const c of extract.concepts) if (c.sentences.includes(i)) words.add(c.term);
  if (t.id === "t-before") for (const w of ["before", "antes"]) words.add(w);
  if (t.id === "t-after") for (const w of ["after", "end", "final", "despues"]) words.add(w);
  if (t.id === "t-words") for (const w of ["mean", "word", "significa", "palabra"]) words.add(w);
  if (t.rival) for (const w of ["think", "thought", "blame", "idea", "pensaba"]) words.add(w);
  return [...words].filter(Boolean).slice(0, 8);
}

function buildCharacter(extract, plan, c, sceneId) {
  const terms = [...new Set(c.topics.map((t) => t.term))].slice(0, 2);
  const about = terms.join(P(" or ", " o ")[0]);
  const aboutEs = terms.map((t) => `"${t}"`).join(" o ");
  const expert = c.key === "expert";
  return {
    id: c.id,
    name: c.name,
    role: c.role,
    scene: sceneId,
    look: LOOKS[c.key],
    style: expert
      ? P(
          "Careful and exact. Uses the words of the subject.",
          "Cuidadosa y exacta. Usa las palabras de la materia.",
        )
      : P(
          "Friendly. Talks about what people saw and thought.",
          "Amable. Habla de lo que la gente vio y pensó.",
        ),
    greeting: P(
      `Hello. I am ${c.name}. Ask me about ${about}.`,
      `Hola. Soy ${c.name}. Pregúntame sobre ${aboutEs}.`,
    ),
    fallback: P(
      `I can't speak to that. Try asking me about ${about}.`,
      `De eso no puedo hablar. Prueba preguntarme sobre ${aboutEs}.`,
    ),
    topics: c.topics.map((t) => ({
      id: t.id,
      ask: questionFor(t),
      keywords: keywordsFor(extract, t),
      answer: same(join(extract, t.from)),
      from: t.from,
      ...(t.gives ? { gives: t.gives } : {}),
      ...(t.clarifyFrom?.length
        ? {
            clarify: {
              ask: P("Can you tell me more about that?", "¿Me puedes decir más sobre eso?"),
              answer: same(join(extract, t.clarifyFrom)),
              from: t.clarifyFrom,
            },
          }
        : {}),
    })),
  };
}

// Where things sit in each scene, for 2, 3 or 4 scenes: [evidence ids, character ids, task ids].
const LAYOUT = {
  2: [
    [
      ["ev-object", "ev-doc", "ev-data", "ev-audio", "ev-check"],
      ["c-witness", "c-expert"],
      ["t-compare", "t-decide"],
    ],
    [[], [], ["t-speak", "t-write", "t-revise", "t-transfer"]],
  ],
  3: [
    [["ev-object", "ev-doc"], ["c-witness"], []],
    [["ev-data", "ev-audio", "ev-check"], ["c-expert"], ["t-compare", "t-decide"]],
    [[], [], ["t-speak", "t-write", "t-revise", "t-transfer"]],
  ],
  4: [
    [["ev-object", "ev-doc"], ["c-witness"], []],
    [["ev-data", "ev-check"], [], ["t-compare"]],
    [["ev-audio"], ["c-expert"], ["t-decide"]],
    [[], [], ["t-speak", "t-write", "t-revise", "t-transfer"]],
  ],
};
/**
 * @param {{ extract, plan, settings, id, source }} input
 * @returns a mission definition (lp-sim/1)
 */
export function generateMission({ extract, plan, settings = {}, id, source = {} }) {
  const type = EXPERIENCE_TYPES[plan.type];
  const keyUse = settings.keyUse || "Explain";
  const band = ["3-5", "6-8", "all"].includes(settings.band) ? settings.band : "6-8";
  const young = band === "3-5";
  const title =
    (source.title || extract.title || "").trim() || cap(extract.concepts[0]?.term || "A new case");
  const topic = (settings.topic || "").trim() || title;
  const supports = {
    glossary: true,
    frames: true,
    readAloud: true,
    spanish: true,
    wordBank: true,
    ...(settings.supports || {}),
  };
  const have = (kind, eid) => plan[kind].some((x) => x.id === eid);
  const conflict = plan.conflict;

  const evidence = plan.evidence.map((e) => {
    const giver = plan.characters.find((c) => c.id === e.givenBy);
    return {
      id: e.id,
      kind: e.kind,
      title: EV_TITLE[e.kind](e.term, e.kind === "audio" ? e.speaker : giver?.name || ""),
      body: same(join(extract, e.from)),
      from: e.from,
      ...(e.supports.length ? { supports: e.supports } : {}),
      ...(e.contradicts.length ? { contradicts: e.contradicts } : {}),
      strength: e.strength,
      ...(e.kind === "audio" ? { transcript: true, speaker: e.speaker || "" } : {}),
    };
  });
  const explanations = conflict
    ? [
        { id: "ex-source", label: same(clip(conflict.sourceText, 160)), from: conflict.sourceFrom },
        {
          id: "ex-misread",
          label: conflict.misreadPair || same(clip(conflict.misreadText, 160)),
          from: conflict.misreadFrom,
          check: true,
        },
      ]
    : [];

  // tasks
  const frames = supports.frames ? FRAMES[keyUse] : [];
  const pairs = [];
  if (have("evidence", "ev-claim") && have("evidence", "ev-check"))
    pairs.push(["ev-claim", "ev-check"]);
  if (have("evidence", "ev-doc") && have("evidence", "ev-data")) pairs.push(["ev-doc", "ev-data"]);
  if (!pairs.length && evidence.length >= 2) pairs.push([evidence[0].id, evidence[1].id]);
  const [a, b] = [
    extract.concepts[0]?.term || "one part",
    extract.concepts[1]?.term || "the other parts",
  ];
  const said = settings.domains?.length ? settings.domains : ["Speaking", "Writing"];
  const transferDomain =
    said.includes("Writing") || !said.includes("Speaking") ? "Writing" : "Speaking";
  const tasks = [
    pairs.length && {
      id: "t-compare",
      type: "compare",
      prompt: P(
        "Put two pieces of evidence side by side. Do they agree or conflict? Which one is stronger? Say why.",
        "Pon dos evidencias lado a lado. ¿Están de acuerdo o en conflicto? ¿Cuál es más fuerte? Di por qué.",
      ),
      keyUse,
      domain: "Reading",
      requires: { evidence: Math.min(3, evidence.length) },
      pairs,
    },
    conflict && {
      id: "t-decide",
      type: "decide",
      prompt: P(
        "Two explanations compete. Choose the one the evidence supports and cite the evidence you used.",
        "Hay dos explicaciones. Elige la que apoya la evidencia y cita la evidencia que usaste.",
      ),
      keyUse,
      domain: "Reading",
      requires: pairs.length ? { done: "t-compare" } : { evidence: Math.min(3, evidence.length) },
      options: [
        {
          id: "o-source",
          label: explanations[0].label,
          explanation: "ex-source",
          sets: { reading: "source" },
          reply: P(
            "Choice saved. Now test it: in your notebook, which evidence points toward it, and which points away?",
            "Elección guardada. Ahora ponla a prueba: en tu cuaderno, ¿qué evidencia apunta hacia ella y cuál se aleja?",
          ),
        },
        {
          id: "o-misread",
          label: explanations[1].label,
          explanation: "ex-misread",
          sets: { reading: "misread" },
          reply: P(
            "Choice saved. Now test it: in your notebook, which evidence points toward it, and which points away?",
            "Elección guardada. Ahora ponla a prueba: en tu cuaderno, ¿qué evidencia apunta hacia ella y cuál se aleja?",
          ),
        },
      ],
    },
    {
      id: "t-speak",
      type: "speak",
      prompt: P(
        `${USE_VERB[keyUse][0]} aloud ${USE_ASK[keyUse][0]}. Use at least two pieces of evidence from your notebook.`,
        `${USE_VERB[keyUse][1]} en voz alta ${USE_ASK[keyUse][1]}. Usa al menos dos evidencias de tu cuaderno.`,
      ),
      keyUse,
      domain: "Speaking",
      requires: conflict ? { done: "t-decide" } : { evidence: Math.min(3, evidence.length) },
      minWords: young ? 12 : 20,
      frames,
    },
    {
      id: "t-write",
      type: "write",
      prompt: P(
        "Write a recommendation: what should be done next, and why? Support it with evidence from your investigation.",
        "Escribe una recomendación: ¿qué se debe hacer ahora y por qué? Apóyala con evidencia de tu investigación.",
      ),
      keyUse,
      domain: "Writing",
      requires: { done: "t-speak" },
      minWords: young ? 20 : 35,
      frames,
    },
    {
      id: "t-revise",
      type: "revise",
      of: "t-write",
      prompt: P(
        "Read your feedback. Then revise your recommendation: add one piece of evidence or one connecting word.",
        "Lee tus comentarios. Luego revisa tu recomendación: agrega una evidencia o una palabra de conexión.",
      ),
      keyUse,
      domain: "Writing",
      requires: { done: "t-write" },
      minWords: young ? 20 : 35,
    },
    {
      id: "t-transfer",
      type: "transfer",
      prompt: P(
        `A new case, on your own: in a different place, the ${a} changes. ${USE_VERB[keyUse][0]} what could happen to the ${b}, and what evidence you would collect to check.`,
        `Un caso nuevo, sin ayuda: en otro lugar, cambia "${a}". ${USE_VERB[keyUse][1]} qué podría pasar con "${b}" y qué evidencia reunirías para comprobarlo.`,
      ),
      keyUse,
      domain: transferDomain,
      requires: { done: "t-revise" },
      minWords: young ? 15 : 25,
    },
  ].filter(Boolean);

  // scenes
  const count = Math.max(2, Math.min(4, plan.sceneCount));
  const names =
    count === 2
      ? [type.scenes[0], type.scenes[3]]
      : count === 3
        ? [type.scenes[0], type.scenes[1], type.scenes[3]]
        : type.scenes;
  const sid = (i) => `s${i + 1}`;
  const gate = [
    null,
    { evidence: Math.min(2, evidence.length) },
    count === 3 && conflict
      ? { done: "t-decide" }
      : pairs.length
        ? { done: "t-compare" }
        : { evidence: 2 },
    conflict ? { done: "t-decide" } : { evidence: 3 },
  ];
  const gates =
    count === 2
      ? [null, conflict ? { done: "t-decide" } : { evidence: 3 }]
      : count === 3
        ? [null, gate[1], gate[2]]
        : gate;
  const characters = [];
  const scenes = LAYOUT[count].map(([evIds, charIds, taskIds], i) => {
    const hotspots = [];
    const add = (hid, label, opens, requires) => {
      const [x, y] = SPOT_XY[hotspots.length % SPOT_XY.length];
      hotspots.push({ id: hid, label, x, y, opens, ...(requires ? { requires } : {}) });
    };
    for (const eid of evIds) {
      const e = evidence.find((x) => x.id === eid);
      if (e) add(`h-${eid}`, EV_SPOT[e.kind](plan.evidence.find((x) => x.id === eid)?.term || e.id), { evidence: eid });
    }
    for (const cid of charIds) {
      const c = plan.characters.find((x) => x.id === cid);
      if (!c) continue;
      characters.push(buildCharacter(extract, plan, c, sid(i)));
      add(`h-${cid}`, P(`Talk with ${c.name}`, `Habla con ${c.name}`), { character: cid });
    }
    for (const tid of taskIds) {
      const t = tasks.find((x) => x.id === tid);
      if (!t) continue;
      t.scene = sid(i);
      add(`h-${tid}`, TASK_SPOT[tid], { task: tid });
    }
    if (i > 0)
      add(
        `h-back${i}`,
        P(
          `Go back to ${names[i - 1][0].toLowerCase()}`,
          `Vuelve a ${names[i - 1][1].toLowerCase()}`,
        ),
        { scene: sid(i - 1) },
      );
    if (i < count - 1)
      add(
        `h-next${i}`,
        P(`Go on to ${names[i + 1][0].toLowerCase()}`, `Sigue a ${names[i + 1][1].toLowerCase()}`),
        { scene: sid(i + 1) },
      );
    const last = i === count - 1;
    return {
      id: sid(i),
      title: names[i],
      art: ART_BY_SCENE[count === 2 && i === 1 ? 3 : count === 3 && i === 2 ? 3 : i],
      description:
        i === 0
          ? P(
              `You arrive to find out about: ${topic}. Look around, read, and talk to the people here.`,
              `Llegas para averiguar sobre: ${topic}. Mira, lee y habla con las personas de aquí.`,
            )
          : last
            ? P(
                "Here you explain what you found, recommend what to do, and try a new case.",
                "Aquí explicas lo que encontraste, recomiendas qué hacer y pruebas un caso nuevo.",
              )
            : P(
                "More evidence is kept here. Compare what you find before you decide.",
                "Aquí hay más evidencia. Compara lo que encuentres antes de decidir.",
              ),
      ...(gates[i] ? { requires: gates[i] } : {}),
      hotspots,
    };
  });
  for (const t of tasks) if (!t.scene) t.scene = sid(count - 1);

  const doneAll = (ids) => ({
    all: ids.filter((x) => tasks.some((t) => t.id === x)).map((x) => ({ done: x })),
  });
  const acts = [
    {
      id: "a-gather",
      title: P("Gather evidence", "Reúne evidencia"),
      goal: P(
        "Open at least three pieces of evidence and talk to someone.",
        "Abre al menos tres evidencias y habla con alguien.",
      ),
      done: {
        all: [
          { evidence: Math.min(3, evidence.length) },
          { any: characters.map((c) => ({ talked: c.id })) },
        ],
      },
    },
    (pairs.length || conflict) && {
      id: "a-weigh",
      title: P("Weigh the explanations", "Compara las explicaciones"),
      goal: P(
        "Compare evidence and decide which explanation it supports.",
        "Compara la evidencia y decide qué explicación apoya.",
      ),
      done: doneAll(["t-compare", "t-decide"]),
    },
    {
      id: "a-explain",
      title: P("Explain and recommend", "Explica y recomienda"),
      goal: P(
        "Explain aloud, write a recommendation, and revise it after feedback.",
        "Explica en voz alta, escribe una recomendación y revísala después de los comentarios.",
      ),
      done: doneAll(["t-speak", "t-write", "t-revise"]),
    },
    {
      id: "a-transfer",
      title: P("A new case", "Un caso nuevo"),
      goal: P(
        "Use what you learned on a new case, without help.",
        "Usa lo que aprendiste en un caso nuevo, sin ayuda.",
      ),
      done: { done: "t-transfer" },
    },
  ].filter(Boolean);

  const outcomes = [
    conflict && {
      id: "out-backed",
      title: P("The case holds together", "El caso se sostiene"),
      text: P(
        "People act on your recommendation: your explanation matched the evidence, and you showed which evidence supported it.",
        "La gente actúa según tu recomendación: tu explicación coincidió con la evidencia y mostraste qué evidencia la apoyaba.",
      ),
      when: { all: [{ chose: ["t-decide", "o-source"] }, { support: ["t-decide", 2] }] },
    },
    conflict && {
      id: "out-thin",
      title: P("Right idea, thin support", "Buena idea, poco apoyo"),
      text: P(
        "Your explanation fits the evidence, but people ask for more proof before they act. One more piece of supporting evidence would settle it.",
        "Tu explicación coincide con la evidencia, pero la gente pide más pruebas antes de actuar. Una evidencia más que la apoye lo resolvería.",
      ),
      when: { chose: ["t-decide", "o-source"] },
    },
    conflict && {
      id: "out-misread",
      title: P("The evidence pushes back", "La evidencia dice otra cosa"),
      text: P(
        "People try your idea, but the problem stays. The evidence you collected leads to a different explanation. Look at it again.",
        "La gente prueba tu idea, pero el problema sigue. La evidencia que reuniste apunta a otra explicación. Mírala otra vez.",
      ),
      when: { chose: ["t-decide", "o-misread"] },
    },
    {
      id: "out-open",
      title: P("The report is filed", "El informe está entregado"),
      text: P(
        "Your report is filed with the evidence you collected.",
        "Tu informe queda entregado con la evidencia que reuniste.",
      ),
    },
  ].filter(Boolean);

  const objective = (typed, fallback) =>
    String(typed || "").trim() ? same(String(typed).trim().slice(0, 240)) : fallback;
  const candidate = extract.objectives.find((o) => o.keyUse === keyUse) || extract.objectives[0];
  return {
    schema: SCHEMA,
    id,
    version: 1,
    title: P(`${type.name[0]}: ${title}`, `${type.name[1]}: ${title}`),
    summary: P(
      `Find out about ${topic}. Collect evidence, question people, decide what the evidence supports, then explain and recommend.`,
      `Averigua sobre ${topic}. Reúne evidencia, haz preguntas, decide qué apoya la evidencia y luego explica y recomienda.`,
    ),
    band,
    subject: settings.subject || "Other",
    keyUses: [keyUse],
    objectives: {
      language: objective(settings.languageObjective, candidate.text),
      content: objective(
        settings.contentObjective,
        P(
          `Use evidence from the text to understand ${topic}.`,
          `Usar evidencia del texto para entender ${topic}.`,
        ),
      ),
    },
    vocabulary: supports.glossary
      ? plan.vocabulary.map((v) => ({ term: v.term, meaning: same(v.meaning), from: v.from }))
      : [],
    acts,
    start: "s1",
    scenes,
    characters,
    evidence,
    explanations,
    tasks,
    outcomes,
    // What the player may offer a learner (the instructor's choices). Kept outside `compiled` so learners get it.
    supports,
    source: { title, text: extract.text },
    compiled: {
      by: COMPILER,
      type: plan.type,
      settings: {
        band,
        subject: settings.subject || "Other",
        keyUse,
        domains: said,
        minutes: Number(settings.minutes) || 45,
        type: settings.type || "auto",
        topic,
        showSource: Boolean(settings.showSource),
      },
      supports,
      feedback: { keyUse, minWords: { speak: young ? 12 : 20, write: young ? 20 : 35 } },
      conflict: conflict
        ? {
            strategy: conflict.strategy,
            source: "ex-source",
            misreading: "ex-misread",
            contradictedBy: conflict.contradictedBy,
          }
        : null,
      invented: plan.invented,
      notes: plan.notes,
    },
  };
}
