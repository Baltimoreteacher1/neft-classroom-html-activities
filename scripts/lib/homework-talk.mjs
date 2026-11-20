/**
 * Talk Together and the Caregiver Co-Pilot.
 *
 * Every line here is the lesson's own, read from its sidecar (`data/family-homework-notes/<id>.json`):
 * `learningTonight`, `corner.question` / `corner.frame`, `watchFor`, `stuckTips`, `bridge`.
 * Nothing is generic across concepts; a field the lesson did not author is simply not shown.
 *
 * The student gets ONE specific question and a sentence starter. The grown-up gets a drawer of six
 * short answers (what is being learned, ask this, look for, if stuck, if you learned it differently,
 * when to stop), closed except the first two, so a caregiver who does not know Grade 6 mathematics
 * can still help and nobody has to read all of it.
 */

import { act } from "./homework-actions.mjs";
import { bridgeOf, renderBridgeCard } from "./homework-bridge.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;
const pair = (p) => (p?.en ? bi(p.en, p.es || p.en) : "");

/** The one question for the student: the lesson's corner question, else the page's guidance question. */
export function talkQuestion(config, fallback) {
  return config?.familyNotes?.corner?.question?.en ? config.familyNotes.corner.question : fallback;
}

const drawer = (id, titleEn, titleEs, inner, open = false) =>
  inner
    ? `
      <details class="hw-copilot-item" id="${id}"${open ? " open" : ""}>
        <summary>${bi(titleEn, titleEs)}</summary>
        <div class="hw-copilot-body">${inner}</div>
      </details>`
    : "";

const list = (items) =>
  items?.length ? `<ul>${items.map((i) => `<li>${pair(i)}</li>`).join("")}</ul>` : "";

/**
 * The co-pilot drawer. `ask` is the page's guidance question (already resolved by the caller) so
 * the Talk stage and the drawer name the same question.
 */
export function renderCaregiverCopilot(config, ask) {
  const notes = config?.familyNotes || {};
  const learning = notes.learningTonight;
  const question = talkQuestion(config, ask);
  const lookFor = (notes.watchFor || []).slice(0, 1);
  const stuck = notes.stuckTips?.say || [];
  const avoid = (notes.stuckTips?.dontSay || []).slice(0, 1);
  const bridge = bridgeOf(notes);
  const stuckHtml = `${list(stuck.slice(0, 2))}${
    avoid.length
      ? `<p class="hw-copilot-avoid"><strong>${bi("Try not to say:", "Eviten decir:")}</strong> ${pair(avoid[0])}</p>`
      : ""
  }`;
  return `
    <aside class="hw-copilot" id="hw_copilot" aria-labelledby="hw_copilot_title" data-no-vocab>
      <div class="hw-copilot-head">
        <h3 class="hw-copilot-title" id="hw_copilot_title"><span aria-hidden="true">👪</span> ${bi("For the grown-up · Help My Child", "Para el adulto · Ayudar a mi hijo/a")}</h3>
        <button type="button" class="btn btn-sm btn-outline-secondary hw-copilot-audio" ${act("hwSpeakCopilot")}>
          <span aria-hidden="true">🔊</span> ${bi("Listen", "Escuchar")}
        </button>
      </div>
      ${drawer("hw_copilot_learning", "What your student is learning", "Lo que su estudiante aprende", pair(learning), true)}
      ${drawer("hw_copilot_ask", "Ask this", "Pregunten esto", pair(question), true)}
      ${drawer("hw_copilot_look", "Look for", "Observen", list(lookFor))}
      ${drawer("hw_copilot_stuck", "If your student gets stuck", "Si se atoran", stuckHtml)}
      ${bridge ? `<div class="hw-copilot-item" id="hw_copilot_bridge">${renderBridgeCard(bridge)}</div>` : ""}
      ${drawer(
        "hw_copilot_support",
        "Supporting thinking without giving away answers",
        "Cómo apoyar el razonamiento sin dar la respuesta",
        `<p>${bi(
          "Ask your student to point to the picture or model and explain their first step out loud before you offer a hint.",
          "Pidan a su estudiante que señale el dibujo o el modelo y explique su primer paso en voz alta antes de darle una pista.",
        )}</p>`,
      )}
      ${drawer(
        "hw_copilot_stop",
        "When to stop",
        "Cuándo parar",
        `<p>${bi(
          "A short, optional session is enough. Stop when your student is tired. Come back another night.",
          "Una sesión corta y opcional es suficiente. Paren cuando su estudiante se canse. Vuelvan otra noche.",
        )}</p>`,
      )}
    </aside>`;
}

/**
 * The grown-up's questions for tonight, as tap-to-reveal prompts: the lesson's corner question first,
 * then up to two of its own "say" prompts. Each opens on its own and can be read aloud, so a grown-up
 * who is unsure of the mathematics reads out what is on the screen and asks it.
 */
export function talkPrompts(config, ask) {
  const notes = config?.familyNotes || {};
  const seen = new Set();
  return [talkQuestion(config, ask), ...(notes.stuckTips?.say || [])]
    .filter((p) => p?.en && !seen.has(p.en) && seen.add(p.en))
    .slice(0, 3);
}

const speakButton = (id) =>
  `<button type="button" class="btn btn-sm btn-outline-secondary hw-reveal-audio" ${act("hwSpeakById", id)}><span aria-hidden="true">🔊</span> ${bi("Listen", "Escuchar")}</button>`;

/**
 * The Talk Together body: tap-to-reveal questions with a read-aloud button, a sentence starter in
 * both languages, what a strong answer sounds like, and a no-grown-up way to do the same thing.
 */
export function renderTalkTogether(config, ask) {
  const notes = config?.familyNotes || {};
  const frame = notes.corner?.frame;
  const strong = bridgeOf(notes)?.class;
  const prompts = talkPrompts(config, ask);
  return `
    <section class="mission-block hw-talk" id="hw_talk" aria-labelledby="hw_talk_title" data-no-vocab>
      <h2 class="hw-talk-title" id="hw_talk_title">${bi("Talk about it", "Conversen sobre esto")}</h2>
      <p class="hw-talk-solo">${bi("Tap a question to show it. A grown-up can read it out loud, or tap Listen.", "Toquen una pregunta para verla. Un adulto puede leerla en voz alta, o tocar Escuchar.")}</p>
      ${prompts
        .map(
          (prompt, i) => `
      <details class="hw-reveal" id="hw_talk_q${i + 1}">
        <summary>${bi(`Question ${i + 1}`, `Pregunta ${i + 1}`)}</summary>
        <div class="hw-reveal-body">
          <p class="hw-talk-q" id="hw_talk_q${i + 1}_text">${pair(prompt)}</p>
          ${speakButton(`hw_talk_q${i + 1}_text`)}
        </div>
      </details>`,
        )
        .join("")}
      ${
        frame?.en
          ? `<p class="hw-talk-frame"><strong>${bi("Start your answer like this:", "Empiecen su respuesta así:")}</strong> <em>${pair(frame)}</em></p>`
          : ""
      }
      ${
        strong?.en
          ? `<p class="hw-talk-strong"><strong>${bi("A strong answer sounds like:", "Una respuesta sólida suena así:")}</strong> ${pair(strong)}</p>`
          : ""
      }
      <p class="hw-talk-solo">${bi(
        "No grown-up nearby? Say your answer out loud to yourself, then write one sentence that proves it. Either language is fine.",
        "¿No hay un adulto cerca? Di tu respuesta en voz alta y escribe una oración que la pruebe. Sirve cualquiera de los dos idiomas.",
      )}</p>
    </section>`;
}
