// Adapter: Talk Table cards (content/talk-table.json): per grade band and key language use (Narrate, Inform,
// Explain, Argue), eight discussion cards, each a question, a sentence starter, a follow-up and words to use, in
// English and Spanish. A deck becomes eight open speaking prompts; nothing is graded and nothing is invented.

import { fitNote, labActivity } from "./lab-parts.js";
import { openQuestion } from "./vocab-parts.js";
import { list, t, text } from "./util.js";

const URL_JSON = "/access-practice-lab/content/talk-table.json";
const USES = ["Narrate", "Inform", "Explain", "Argue"];
const REF = /^(K|1|2-3|3-5|6-8)-(narrate|inform|explain|argue)$/;

const useOf = (slug) => USES.find((u) => u.toLowerCase() === slug);
const urlFor = (ref) => {
  const m = REF.exec(String(ref));
  return m ? `/access-practice-lab/talk-table/${m[2]}?grades=${m[1]}` : "";
};
const pair = (v) => (Array.isArray(v) ? [text(v[0]), text(v[1])] : [text(v), ""]);

function cardQuestion(card, n) {
  const [q, qEs] = pair(card.q);
  const [follow, followEs] = pair(card.followUp);
  const [starter] = pair(card.starter);
  const words = list(card.words)
    .map((w) => (text(w.es) ? `${text(w.en)} (${text(w.es)})` : text(w.en)))
    .join(", ");
  const prompt = [
    q,
    qEs && `En español: ${qEs}`,
    follow && `Follow-up: ${follow}`,
    followEs && `Seguimiento: ${followEs}`,
  ]
    .filter(Boolean)
    .join("\n");
  return openQuestion({
    id: `t${n}`,
    prompt,
    kind: "explain",
    frame: starter.slice(0, 300),
    hint: words ? `Words to use: ${words}`.slice(0, 400) : "",
  });
}

export default {
  family: "talk-table",
  label: t("Talk Table discussion decks", "Mazos de conversación de la Mesa de diálogo"),
  note: t(
    "Copies a Talk Table deck (eight cards for one grade band and language use) into speaking prompts you can edit, with each card's starter, follow-up and words.",
    "Copia un mazo de la Mesa de diálogo (ocho tarjetas de una banda de grados y un uso del lenguaje) en consignas orales que puede editar, con el comienzo, la pregunta de seguimiento y las palabras de cada tarjeta.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "prompts",
    "hints",
    "frames",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t("Spanish card text", "Texto en español de las tarjetas"),
      why: t(
        "The Spanish was machine-drafted for the Talk Table and still needs review by a native speaker.",
        "El español de la Mesa de diálogo fue un borrador automático y aún necesita revisión de un hablante nativo.",
      ),
    },
    {
      what: t(
        "Turn order, the card dealer and printing cards",
        "Orden de turnos, reparto e impresión de tarjetas",
      ),
      why: t(
        "These belong to the Talk Table page; the copy keeps the card content as open prompts.",
        "Pertenecen a la página de la Mesa de diálogo; la copia conserva el contenido como consignas abiertas.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const data = await fetchJson(URL_JSON);
    return Object.entries(data.bands || {}).flatMap(([band, uses]) =>
      USES.filter((u) => list(uses[u]).length).map((u) => ({
        id: `${band}-${u.toLowerCase()}`,
        title: `Talk Table: ${u} (grades ${band})`,
        grade: band,
        subject: "",
        domain: "Speaking",
        description: pair(uses[u][0].q)[0],
        count: list(uses[u]).length,
      })),
    );
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    const m = REF.exec(String(ref));
    if (!m) throw new Error("bad-ref");
    const use = useOf(m[2]);
    const cards = list((await fetchJson(URL_JSON)).bands?.[m[1]]?.[use]);
    if (!cards.length) throw new Error("not-found");
    const note = fitNote([
      `Copied from the Talk Table deck ${use}, grade band ${m[1]} (${cards.length} cards).`,
      "Spanish on the cards was machine-drafted and needs native review before sharing.",
    ]);
    return {
      activity: labActivity({
        title: `Talk Table: ${use} (grades ${m[1]})`,
        description: `Partner discussion cards for the key language use ${use}.`,
        grade: m[1],
        curriculum: "Language Page Talk Table",
        objective: `${use}: discuss each question with a partner using the sentence starter.`,
        sourceNote: `Copied from Talk Table ${ref}.`,
        template: "build-explain",
        blocks: cards.map((c, i) => cardQuestion(c, i + 1)),
        teacher: note.teacher,
        spanish: true,
        frames: true,
      }),
      notes: [
        t(
          "Speaking prompts are never auto-graded. The Spanish card text was machine-drafted and needs native review.",
          "Las consignas orales nunca se califican automáticamente. El texto en español de las tarjetas fue un borrador automático y necesita revisión nativa.",
        ),
      ],
      source: cards,
      url: urlFor(ref),
      sourceTitle: `Talk Table ${use} ${m[1]}`,
    };
  },
};
