// Adapter: Real-Life Scenarios (src/content/scenarios.js, a pure data module): branching conversations where a
// character speaks and the learner picks a reply; every reply carries a quality rating (0-2) and an explanation in
// English and Spanish. A scene becomes its goal, one question per conversation turn (the reply the scene rates best is
// the key, its explanation the feedback) and a role-play prompt whose sample is the scene's own best path.
// Loaded on demand so the Create panel stays light.

import { fitNote, labActivity, textBlocks, withSpanish } from "./lab-parts.js";
import { openQuestion } from "./vocab-parts.js";
import { list, t, text } from "./util.js";

const load = async () => (await import("../../content/scenarios.js")).SCENES;
const urlFor = (ref) => `/access-practice-lab/scenarios/${ref}`;

const speakerOf = (scene, node) => {
  const p = node.who === "npc2" ? scene.npc2 : scene.npc;
  return p ? `${text(p.name)} (${text(p.role)})` : "The other person";
};
const best = (node) => list(node.choices).reduce((a, c) => (a == null || c.q > a.q ? c : a), null);

/** Turns in reading order: from the start, best path first, then any other turn, each once. */
function turnsOf(scene) {
  const nodes = scene.nodes || {};
  const seen = new Set();
  const order = [];
  const visit = (id) => {
    if (!id || seen.has(id) || !nodes[id]) return;
    seen.add(id);
    const node = nodes[id];
    if (list(node.choices).length) order.push([id, node]);
    const top = best(node);
    if (top) visit(top.next);
    for (const c of list(node.choices)) visit(c.next);
  };
  visit(scene.start);
  return order;
}

function bestPath(scene) {
  const lines = [];
  const seen = new Set();
  let id = scene.start;
  while (id && scene.nodes?.[id] && !seen.has(id)) {
    seen.add(id);
    const node = scene.nodes[id];
    lines.push(`${speakerOf(scene, node).split(" (")[0]}: ${text(node.say)}`);
    const top = best(node);
    if (!top) break;
    lines.push(`You: ${text(top.say)}`);
    id = top.next;
  }
  return lines.join("\n");
}

function turnQuestion(scene, node, n) {
  const choices = list(node.choices);
  const top = best(node);
  const options = choices.map((c, i) => ({ id: `o${i + 1}`, text: text(c.say) }));
  return {
    type: "question",
    id: `t${n}`,
    format: "choice",
    prompt: `${speakerOf(scene, node)} says: "${text(node.say)}"\n\nWhich reply works best?`,
    options,
    answer: options[choices.indexOf(top)].id,
    explanation: withSpanish(top.why, top.whyEs, 800),
    skill: text(top.tag).slice(0, 80),
  };
}

export default {
  family: "scenarios",
  label: t("Real-Life Scenarios", "Situaciones de la vida real"),
  note: t(
    "Copies a scenario into an activity you can edit: the goal, each turn of the conversation with the reply the scene rates best and why, and a role-play prompt with the best path as a model.",
    "Copia una situación en una actividad que puede editar: la meta, cada turno de la conversación con la respuesta que la escena considera mejor y por qué, y una consigna de dramatización con el mejor camino como modelo.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "prompts",
    "choices",
    "answerKeys",
    "explanations",
    "samples",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Branching, characters and the scene picture, recording and dictation",
        "Las ramas, los personajes, la imagen de la escena, la grabación y el dictado",
      ),
      why: t(
        "The copy is linear: every turn becomes one question, so the branches where a weaker reply leads stay in the original scene.",
        "La copia es lineal: cada turno es una pregunta, así que las ramas a las que lleva una respuesta más débil permanecen en la escena original.",
      ),
    },
    {
      what: t("Spanish", "Español"),
      why: t(
        "The Spanish comes from the scenario file and has not been reviewed by a native speaker.",
        "El español proviene del archivo de situaciones y no ha sido revisado por un hablante nativo.",
      ),
    },
  ],

  async list() {
    return (await load()).map((s) => ({
      id: s.id,
      title: text(s.title),
      grade: text(s.b),
      subject: "",
      domain: "Speaking",
      description: text(s.goal),
      count: turnsOf(s).length + 1,
    }));
  },

  url: urlFor,

  async extract(ref) {
    const s = (await load()).find((x) => x.id === ref);
    if (!s) throw new Error("not-found");
    const turns = turnsOf(s);
    if (!turns.length) throw new Error("bad-source");
    const ends = Object.values(s.nodes || {}).filter((n) => n.end && text(n.wrap));
    const note = fitNote([
      `Copied from Real-Life Scenario ${s.id} (grades ${text(s.b)}): ${text(s.title)}. Place: ${text(s.place)}.`,
      `Language focus: ${list(s.focus).join(", ")}.`,
      ...ends.map((n) => `Ending (${text(n.outcome)}): ${text(n.wrap)}`),
    ]);
    return {
      activity: labActivity({
        title: `Scenario: ${text(s.title)}`,
        description: text(s.goal),
        grade: s.b,
        curriculum: "Language Page Real-Life Scenarios",
        objective: text(s.goal),
        sourceNote: `Copied from Real-Life Scenario ${s.id}.`,
        template: "explore-practice",
        blocks: [
          ...textBlocks("goal", withSpanish(`Goal: ${text(s.goal)}`, s.goalEs, 4000), "directions"),
          ...turns.map(([, node], i) => turnQuestion(s, node, i + 1)),
          openQuestion({
            id: "roleplay",
            prompt: `Role-play the conversation with a partner. Goal: ${text(s.goal)}`,
            kind: "explain",
            sample: bestPath(s),
          }),
        ],
        teacher: note.teacher,
        spanish: Boolean(s.goalEs),
      }),
      notes: [
        t(
          "Not carried: the branches (every turn is one question), the characters and scene picture, recording and dictation.",
          "No se conserva: las ramas (cada turno es una pregunta), los personajes y la imagen de la escena, la grabación ni el dictado.",
        ),
      ],
      source: s,
      url: urlFor(ref),
      sourceTitle: text(s.title),
    };
  },
};
