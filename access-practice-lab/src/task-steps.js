// "Your task": the numbered how-to strip at the top of every activity. The authored `directions` say WHAT to do for
// this item; the steps say HOW to work the screen, derived from the domain and item type so every one of the
// activities gets them without per-item authoring. Wording is sized by age: grades K–3 get two-to-four-word steps
// with a Hear button on each (many do not read yet); grades 3–8 get one short sentence per step.
import { isEarlyBand } from "./bands.js";
import { asList, html, icon } from "./util.js";

const FIRST = {
  Listening: {
    early: ["Listen.", "Escucha."],
    upper: [
      "Press Play and listen. You can listen again.",
      "Presiona Reproducir y escucha. Puedes escuchar otra vez.",
    ],
  },
  Reading: {
    early: ["Look and read.", "Mira y lee."],
    upper: [
      "Read the text. Look for the words in the question.",
      "Lee el texto. Busca las palabras de la pregunta.",
    ],
  },
  Speaking: {
    early: ["Think. What will you say?", "Piensa. ¿Qué vas a decir?"],
    upper: [
      "Plan what you will say. Use a sentence starter.",
      "Planea lo que vas a decir. Usa un inicio de oración.",
    ],
  },
  Writing: {
    early: ["Think. What will you write?", "Piensa. ¿Qué vas a escribir?"],
    upper: ["Plan your ideas. Use the word bank.", "Planea tus ideas. Usa el banco de palabras."],
  },
  "Model-Test": {
    early: ["Look and listen.", "Mira y escucha."],
    upper: [
      "Read the question first, then the choices.",
      "Lee primero la pregunta y luego las opciones.",
    ],
  },
};

/** The middle step: what to do with the answer area, by item type. */
function doStep(a, domain, early) {
  const n = asList(a.answers).length;
  switch (a.type) {
    case "multipleChoice":
      return early
        ? ["Tap one answer.", "Toca una respuesta."]
        : ["Choose the one best answer.", "Elige la mejor respuesta."];
    case "multiSelect":
      return early
        ? [`Tap ${n} answers.`, `Toca ${n} respuestas.`]
        : [
            `Choose ${n} answers. Every one must fit.`,
            `Elige ${n} respuestas. Todas deben servir.`,
          ];
    case "sort":
      return early
        ? ["Put each card in a group.", "Pon cada tarjeta en un grupo."]
        : [
            "Put each card in the group where it belongs.",
            "Pon cada tarjeta en el grupo que le corresponde.",
          ];
    case "order":
      return early
        ? ["Put them in order.", "Ponlos en orden."]
        : ["Put the parts in the right order.", "Pon las partes en el orden correcto."];
    case "cloze":
      return early
        ? ["Fill each blank.", "Completa cada espacio."]
        : [
            "Fill each blank with the word that fits.",
            "Completa cada espacio con la palabra correcta.",
          ];
    case "hotText":
      return early
        ? ["Tap the sentence.", "Toca la oración."]
        : [
            "Tap the sentence that answers the question.",
            "Toca la oración que responde la pregunta.",
          ];
    case "worksheet":
      return early
        ? ["Do it on paper.", "Hazlo en papel."]
        : ["Print the page and work on paper.", "Imprime la página y trabaja en papel."];
    case "constructed":
      if (domain === "Speaking")
        return early
          ? ["Tap Record. Talk.", "Toca Grabar. Habla."]
          : ["Record your answer, then listen to it.", "Graba tu respuesta y luego escúchala."];
      return early
        ? ["Write your words.", "Escribe tus palabras."]
        : ["Write your answer in full sentences.", "Escribe tu respuesta en oraciones completas."];
    default:
      return early ? ["Answer.", "Responde."] : ["Give your answer.", "Da tu respuesta."];
  }
}

function lastStep(a, domain, early) {
  if (a.type === "worksheet") return null;
  if (a.type === "constructed")
    return domain === "Speaking"
      ? early
        ? ["Did you say it all?", "¿Lo dijiste todo?"]
        : [
            "Check your answer against the list. Try again if you want.",
            "Revisa tu respuesta con la lista. Inténtalo otra vez si quieres.",
          ]
      : early
        ? ["Read it again.", "Léelo otra vez."]
        : [
            "Read it again and check the list, then save.",
            "Léelo otra vez, revisa la lista y guarda.",
          ];
  return early
    ? ["Tap Check.", "Toca Revisar."]
    : [
        "Press Check. If you miss, you get a hint first.",
        "Presiona Revisar. Si fallas, primero recibes una pista.",
      ];
}

/** The steps for one activity as [en, es] pairs. Pure: Node tests import it. */
export function taskSteps(a, domain, band) {
  const early = isEarlyBand(band);
  const first = (FIRST[domain] || FIRST.Reading)[early ? "early" : "upper"];
  return [first, doStep(a, domain, early), lastStep(a, domain, early)].filter(Boolean);
}

/** The task card: the authored directions (with their Hear buttons) and the numbered steps under them. */
export function taskCardHTML(I, a, domain, band, directions) {
  const early = isEarlyBand(band);
  const steps = taskSteps(a, domain, band);
  return html`<section class="task-card ${early ? "is-early" : ""}" aria-labelledby="taskCardTitle">
    <h2 id="taskCardTitle" class="task-card-title">
      ${icon("flag")} ${I.T("Your task", "Tu tarea")}
    </h2>
    ${directions}
    <ol class="task-steps" aria-label="${I.S("How to do it", "Cómo hacerlo")}">
      ${steps.map(
        ([en, es], i) =>
          html`<li>
            <span class="task-step-n" aria-hidden="true">${i + 1}</span>
            <span class="task-step-text">${I.T(en, es)}</span>
            ${early ? html`<button type="button" class="task-step-hear" data-say="${en}" aria-label="${I.S(`Hear step ${i + 1}`, `Escuchar el paso ${i + 1}`)}">${icon("volume")}</button>` : ""}
          </li>`,
      )}
    </ol>
  </section>`;
}
