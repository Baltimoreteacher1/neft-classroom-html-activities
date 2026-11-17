// Transfer bank (Language Intelligence Engine): authored NEW prompts a learner answers on their own after a
// revision. A transfer keeps the Key Language Use (Narrate / Inform / Explain / Argue) and changes the context, so
// it shows whether the language move travels, not whether one answer was memorised.
//
// Rules this module keeps:
//  * `transferFor` never returns the task's own prompt (matched by id and by normalised wording).
//  * The choice is deterministic for a task id, so a reload shows the same new task.
//  * Prompts are authored here in English and Spanish; nothing is generated from the learner's text.
//  * `route` is a lab route without the base ("/speak"), or "" when there is no obvious next room.

/** @type {Record<string, {id:string, prompt:[string,string], route:string, pair?:string}[]>} */
export const TRANSFER_BANK = Object.freeze({
  Narrate: [
    {
      id: "n-first-day",
      prompt: [
        "Tell about a first day somewhere new. What happened first, next and last?",
        "Cuenta un primer día en un lugar nuevo. ¿Qué pasó primero, después y al final?",
      ],
      route: "/speak",
      pair: "n-helped",
    },
    {
      id: "n-helped",
      prompt: [
        "Tell about a time you helped someone. Say where you were, what you did and how it ended.",
        "Cuenta una vez que ayudaste a alguien. Di dónde estabas, qué hiciste y cómo terminó.",
      ],
      route: "/speak",
      pair: "n-first-day",
    },
    {
      id: "n-lost-found",
      prompt: [
        "Tell the story of something that was lost and then found.",
        "Cuenta la historia de algo que se perdió y luego apareció.",
      ],
      route: "/write",
      pair: "n-surprise",
    },
    {
      id: "n-surprise",
      prompt: [
        "Tell about a day that did not go as planned. What changed, and what did you do?",
        "Cuenta un día que no salió como se esperaba. ¿Qué cambió y qué hiciste?",
      ],
      route: "/write",
      pair: "n-lost-found",
    },
    {
      id: "n-learned",
      prompt: [
        "Tell about a time you learned to do something difficult, from the first try to the last.",
        "Cuenta una vez que aprendiste a hacer algo difícil, desde el primer intento hasta el último.",
      ],
      route: "/speak",
      pair: "n-team",
    },
    {
      id: "n-team",
      prompt: [
        "Tell about a time a group worked together to finish something. Put the events in order.",
        "Cuenta una vez que un grupo trabajó junto para terminar algo. Pon los hechos en orden.",
      ],
      route: "/write",
      pair: "n-learned",
    },
    {
      id: "n-weather",
      prompt: [
        "Tell what happened on a day when the weather changed everything.",
        "Cuenta qué pasó un día en que el clima lo cambió todo.",
      ],
      route: "/speak",
    },
  ],
  Inform: [
    {
      id: "i-place",
      prompt: [
        "Describe a place in your community for someone who has never been there.",
        "Describe un lugar de tu comunidad para alguien que nunca ha estado allí.",
      ],
      route: "/write",
      pair: "i-tool",
    },
    {
      id: "i-tool",
      prompt: [
        "Describe a tool you use at school. Say what it is, what its parts are and what it is for.",
        "Describe una herramienta que usas en la escuela. Di qué es, cuáles son sus partes y para qué sirve.",
      ],
      route: "/write",
      pair: "i-place",
    },
    {
      id: "i-animal",
      prompt: [
        "Tell a reader about an animal: what kind of animal it is, where it lives and what it needs.",
        "Infórmale a un lector sobre un animal: qué tipo de animal es, dónde vive y qué necesita.",
      ],
      route: "/newsroom",
      pair: "i-habitat",
    },
    {
      id: "i-habitat",
      prompt: [
        "Describe a habitat, such as a pond or a desert, and two living things found there.",
        "Describe un hábitat, como un estanque o un desierto, y dos seres vivos que se encuentran allí.",
      ],
      route: "/newsroom",
      pair: "i-animal",
    },
    {
      id: "i-compare",
      prompt: [
        "Compare two ways of getting to school. How are they alike and how are they different?",
        "Compara dos maneras de llegar a la escuela. ¿En qué se parecen y en qué se diferencian?",
      ],
      route: "/speak",
      pair: "i-game",
    },
    {
      id: "i-game",
      prompt: [
        "Describe a game or sport for someone who has never played it.",
        "Describe un juego o deporte para alguien que nunca lo ha jugado.",
      ],
      route: "/speak",
      pair: "i-compare",
    },
    {
      id: "i-celebration",
      prompt: [
        "Tell a reader about a celebration you know: who takes part, what people do and why it matters.",
        "Infórmale a un lector sobre una celebración que conoces: quién participa, qué hace la gente y por qué importa.",
      ],
      route: "/write",
    },
  ],
  Explain: [
    {
      id: "e-plants-sun",
      prompt: [
        "Explain why plants need sunlight.",
        "Explica por qué las plantas necesitan la luz del sol.",
      ],
      route: "/speak",
      pair: "e-less-sun",
    },
    {
      id: "e-less-sun",
      prompt: [
        "Explain how reduced sunlight could affect an ecosystem.",
        "Explica cómo podría afectar a un ecosistema recibir menos luz del sol.",
      ],
      route: "/speak",
      pair: "e-plants-sun",
    },
    {
      id: "e-ice",
      prompt: [
        "Explain why ice melts faster on a warm day.",
        "Explica por qué el hielo se derrite más rápido en un día cálido.",
      ],
      route: "/write",
      pair: "e-puddle",
    },
    {
      id: "e-puddle",
      prompt: [
        "Explain what happens to a puddle after the rain stops, step by step.",
        "Explica paso a paso qué le pasa a un charco cuando deja de llover.",
      ],
      route: "/write",
      pair: "e-ice",
    },
    {
      id: "e-shadow",
      prompt: [
        "Explain why a shadow changes length during the day.",
        "Explica por qué una sombra cambia de largo durante el día.",
      ],
      route: "/speak",
      pair: "e-seasons",
    },
    {
      id: "e-seasons",
      prompt: [
        "Explain why some trees lose their leaves in the fall.",
        "Explica por qué algunos árboles pierden sus hojas en otoño.",
      ],
      route: "/speak",
      pair: "e-shadow",
    },
    {
      id: "e-solve",
      prompt: [
        "Explain how you solve a math problem with more than one step. Say why each step comes next.",
        "Explica cómo resuelves un problema de matemáticas con más de un paso. Di por qué sigue cada paso.",
      ],
      route: "/write",
    },
    {
      id: "e-traffic",
      prompt: [
        "Explain how a crosswalk signal keeps people safe.",
        "Explica cómo un semáforo peatonal mantiene segura a la gente.",
      ],
      route: "/write",
    },
  ],
  Argue: [
    {
      id: "a-recess",
      prompt: [
        "Should students have a longer break during the school day? Take a position and give a reason.",
        "¿Deberían los estudiantes tener un descanso más largo en la escuela? Toma una posición y da una razón.",
      ],
      route: "/write",
      pair: "a-homework",
    },
    {
      id: "a-homework",
      prompt: [
        "Should weekend homework be optional? Take a position and support it.",
        "¿Debería ser opcional la tarea del fin de semana? Toma una posición y apóyala.",
      ],
      route: "/write",
      pair: "a-recess",
    },
    {
      id: "a-garden",
      prompt: [
        "Should your school plant a garden? State your claim and one piece of evidence.",
        "¿Debería tu escuela plantar un huerto? Di tu afirmación y una evidencia.",
      ],
      route: "/evidence",
      pair: "a-park",
    },
    {
      id: "a-park",
      prompt: [
        "A town can build a park or a parking lot. Argue for one choice.",
        "Un pueblo puede construir un parque o un estacionamiento. Argumenta a favor de una opción.",
      ],
      route: "/evidence",
      pair: "a-garden",
    },
    {
      id: "a-pets",
      prompt: [
        "Should classrooms have a class pet? Give your position and answer someone who disagrees.",
        "¿Deberían los salones tener una mascota? Da tu posición y respóndele a alguien que no está de acuerdo.",
      ],
      route: "/conversation",
      pair: "a-phones",
    },
    {
      id: "a-phones",
      prompt: [
        "Should students be allowed to use phones at lunch? Argue your position with a reason.",
        "¿Se les debería permitir a los estudiantes usar el teléfono en el almuerzo? Argumenta tu posición con una razón.",
      ],
      route: "/conversation",
      pair: "a-pets",
    },
    {
      id: "a-library",
      prompt: [
        "Should the school library stay open after school? State a claim and a reason.",
        "¿Debería la biblioteca de la escuela quedarse abierta después de clases? Di una afirmación y una razón.",
      ],
      route: "/write",
    },
  ],
});

export const TRANSFER_KEY_USES = Object.freeze(Object.keys(TRANSFER_BANK));

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}

/**
 * A new prompt with the same Key Language Use in a different context.
 * @param {{keyUse?:string, taskId?:string, band?:string, prompt?:string|string[], exclude?:string[]}} q
 *   `prompt` is the task's own wording (either language); `exclude` is ids or wordings already used.
 * @returns {{id:string, prompt:[string,string], keyUse:string, route:string}}
 */
export function transferFor({ keyUse = "Explain", taskId = "", prompt = "", exclude = [] } = {}) {
  const use = Object.hasOwn(TRANSFER_BANK, keyUse) ? keyUse : "Explain";
  const bank = TRANSFER_BANK[use];
  const own = new Set([prompt, ...exclude].flat().map(norm).filter(Boolean));
  const ids = new Set([String(taskId), ...exclude.map(String)]);
  const isOwn = (e) => ids.has(e.id) || e.prompt.some((p) => own.has(norm(p)));
  const open = bank.filter((e) => !isOwn(e));
  // A task that IS a bank prompt moves to its authored partner (same idea, new context).
  const self = bank.find((e) => isOwn(e) && e.pair);
  const partner = self && open.find((e) => e.id === self.pair);
  const list = open.length ? open : bank;
  const pick = partner || list[hash(`${use}:${taskId}`) % list.length];
  return { id: pick.id, prompt: [...pick.prompt], keyUse: use, route: pick.route || "" };
}
