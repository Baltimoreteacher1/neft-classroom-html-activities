// Adapter: Language builders (src/content/scaffold-items.js, a pure data module; the /scaffold tools Sentence
// Architecture, Evidence Builder and Language Upgrade Lab). The four items of one tool for one grade band become one
// activity: a sentence to build becomes an order question (its key is the item's own answer order); an evidence item
// becomes choose-the-supporting-cards (key: the cards marked as support) plus the connector to use; an upgrade item
// becomes an open revision with its frame and authored model. Loaded on demand so the Create panel stays light.

import { fitNote, labActivity } from "./lab-parts.js";
import { openQuestion } from "./vocab-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../content/scaffold-items.js");
const REF = /^(sentence-architecture|evidence-builder|language-upgrade)-(3-5|6-8)$/;
const urlFor = (ref) => {
  const m = REF.exec(String(ref));
  return m ? `/access-practice-lab/scaffold/${m[1]}?grades=${m[2]}` : "";
};

function sentenceItem(it, n) {
  const tiles = new Map(list(it.tiles).map((x) => [x.id, text(x.text)]));
  const parts = list(it.answer).map((a) => tiles.get(a) ?? text(a));
  const off = list(it.tiles).filter((x) => !list(it.answer).includes(x.id));
  return [
    {
      type: "question",
      id: `s${n}`,
      format: "order",
      prompt: `${text(it.prompt)} Put the parts in order.`,
      items: parts.map((p, i) => ({ id: `i${i + 1}`, text: p })),
      hint: text(it.hint),
      explanation: `${parts.join(" ")}. ${text(it.target)}`.slice(0, 800),
      skill: text(it.use).slice(0, 80),
    },
    off,
  ];
}

function evidenceItem(it, n, meanings) {
  const options = list(it.cards).map((c, i) => ({ id: `o${i + 1}`, text: text(c.text) }));
  const why = list(it.cards)
    .filter((c) => !c.supports && text(c.why))
    .map((c) => `"${text(c.text)}" ${text(c.why)}`)
    .join(" ");
  const out = [
    {
      type: "question",
      id: `e${n}`,
      format: "multi",
      prompt: `Claim: ${text(it.claim)}\n\nChoose the cards that support the claim.`,
      options,
      answers: list(it.cards)
        .map((c, i) => (c.supports ? options[i].id : ""))
        .filter(Boolean),
      hint: text(it.hint),
      explanation: why.slice(0, 800),
      skill: text(it.use).slice(0, 80),
    },
  ];
  const conns = list(it.connectors).map(text);
  const at = conns.indexOf(text(it.answer?.connector));
  if (conns.length >= 2 && at >= 0)
    out.push({
      type: "question",
      id: `e${n}-link`,
      format: "choice",
      prompt: `Claim: ${text(it.claim)}\n\nWhich words introduce the supporting evidence?`,
      options: conns.map((c, i) => ({ id: `o${i + 1}`, text: c })),
      answer: `o${at + 1}`,
      explanation: conns
        .map((c) => (meanings[c] ? `${c}: ${meanings[c]}.` : ""))
        .filter(Boolean)
        .join(" ")
        .slice(0, 800),
      skill: text(it.use).slice(0, 80),
    });
  return out;
}

const upgradeItem = (it, n) =>
  openQuestion({
    id: `u${n}`,
    prompt: `${text(it.prompt)}\n\n"${text(it.informal)}"`,
    kind: "write",
    frame: text(it.frame).slice(0, 300),
    hint: text(it.hint),
    rubric: [
      text(it.target),
      list(it.avoid).length &&
        `I do not use the word${it.avoid.length > 1 ? "s" : ""} ${list(it.avoid).join(", ")}.`,
    ].filter(Boolean),
    sample: text(it.answer),
  });

export default {
  family: "scaffold-items",
  label: t("Language builders", "Constructores de lenguaje"),
  note: t(
    "Copies one language builder's items for a grade band into an activity you can edit: sentences to build, evidence to choose and connect, or everyday sentences to revise into academic language.",
    "Copia los ejercicios de un constructor de lenguaje para una banda de grados en una actividad que puede editar: oraciones para construir, evidencia para elegir y conectar, u oraciones cotidianas para mejorar con lenguaje académico.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "prompts",
    "choices",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Sentence slots, the off-topic tile and the live language feedback",
        "Las casillas de la oración, la ficha fuera de tema y la retroalimentación del lenguaje en vivo",
      ),
      why: t(
        "The builders check language as the learner works; the copy keeps each item's own key and model.",
        "Los constructores revisan el lenguaje mientras el estudiante trabaja; la copia conserva la clave y el modelo de cada ejercicio.",
      ),
    },
    {
      what: t("Spanish", "Español"),
      why: t(
        "The builder items have no Spanish in the source, so the copy has none either.",
        "Los ejercicios de los constructores no tienen español en la fuente, así que la copia tampoco lo tiene.",
      ),
    },
  ],

  async list() {
    const { ALL_ITEMS, TOOLS } = await load();
    const groups = new Map();
    for (const it of ALL_ITEMS) {
      const k = `${it.tool}-${it.band}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(it);
    }
    return [...groups].map(([id, items]) => ({
      id,
      title: `${TOOLS[items[0].tool].name[0]}, grades ${items[0].band}`,
      grade: items[0].band,
      subject: "",
      domain: "Writing",
      description: items.map((i) => text(i.topic)).join(", "),
      count: items.length,
    }));
  },

  url: urlFor,

  async extract(ref) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const { ALL_ITEMS, TOOLS, EVIDENCE_CONNECTORS, MODELS } = await load();
    const items = ALL_ITEMS.filter((x) => x.tool === m[1] && x.band === m[2]);
    if (!items.length) throw new Error("not-found");
    const offTopic = [];
    const blocks = items.flatMap((it, i) => {
      if (m[1] === "sentence-architecture") {
        const [q, off] = sentenceItem(it, i + 1);
        offTopic.push(...off.map((x) => `${text(x.text)}: ${text(x.why)}`));
        return [q];
      }
      if (m[1] === "evidence-builder") return evidenceItem(it, i + 1, EVIDENCE_CONNECTORS);
      return [upgradeItem(it, i + 1)];
    });
    const tool = TOOLS[m[1]];
    const model = MODELS[m[1]];
    const note = fitNote([
      `Copied from the ${tool.name[0]} items for grades ${m[2]}.`,
      text(model?.text) && `Model: ${text(model.text)}`,
      ...list(model?.steps).map((s, i) => `Step ${i + 1}: ${text(s)}`),
      ...offTopic.map((o) => `Off-topic tile (not in the copy): ${o}`),
    ]);
    return {
      activity: labActivity({
        title: `${tool.name[0]}, grades ${m[2]}`,
        description: text(tool.blurb?.[0]),
        grade: m[2],
        curriculum: "Language Page language builders",
        objective: text(items[0].target),
        sourceNote: `Copied from language builder ${ref}.`,
        template: "build-explain",
        blocks,
        teacher: note.teacher,
        frames: m[1] === "language-upgrade",
      }),
      notes: [
        t(
          "Not carried: the sentence slots and their off-topic tile, the order of evidence cards and the live language feedback. Free revisions are never auto-graded.",
          "No se conserva: las casillas de la oración con su ficha fuera de tema, el orden de las tarjetas de evidencia ni la retroalimentación en vivo. Las revisiones libres nunca se califican automáticamente.",
        ),
      ],
      source: items,
      url: urlFor(ref),
      sourceTitle: `${tool.name[0]} ${m[2]}`,
    };
  },
};
