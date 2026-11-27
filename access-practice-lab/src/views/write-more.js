// Writing Studio, engagement and teaching extras:
//   students  quick writes from a picture or a question (no feedback, no record of supports: a place to write freely),
//             badges for what a writer has tried, a partner share with "glow" and "wonder", and a surprise task
//   teachers  a focus for the day carried in the task link, a printable conference sheet, and a conference note that
//             stays with the piece on the device and shows in the writer's portfolio
// Nothing here scores writing or adds to the language ledger. Badges count what a writer has done, not how well.
// Quick writes are kept in the studio document under "quick-<prompt id>", in the same shape as a task's writing,
// so backup, import and the teacher's samples read them without a special case.
import { addVersion, writingState } from "../lang/studio.js";
import { BASE, announce, formatDate, html, icon, raw, todayISO, wordCount } from "../util.js";
import { insertion, isTeacherView } from "./write-plus.js";

const IGN = raw("data-nsr-ignore");
const PIC = `${BASE}/pictures`;

// ── quick writes ─────────────────────────────────────────────────────────────────────────────
const STARTERS = {
  story: [["First, ", "Primero, "], ["Then ", "Luego "], ["After that, ", "Después de eso, "], ["In the end, ", "Al final, "]],
  howto: [["First, ", "Primero, "], ["Next, ", "Después, "], ["Last, ", "Por último, "]],
  opinion: [["I think ___ because ", "Pienso que ___ porque "], ["Another reason is ", "Otra razón es "], ["That is why ", "Por eso "]],
  describe: [["I see ", "Veo "], ["One difference is ", "Una diferencia es "], ["I think this happens because ", "Creo que esto pasa porque "]],
  memory: [["One day, ", "Un día, "], ["I felt ___ because ", "Me sentí ___ porque "], ["I learned that ", "Aprendí que "]],
};

/** id, kind, picture file (or ""), prompt EN/ES, picture description EN/ES. Pictures are the lab's own drawings. */
export const QUICK = [
  ["kite", "story", "35t-kite-seq.svg", "Tell the story of the kite. What happens first, next and last?", "Cuenta la historia de la cometa. ¿Qué pasa primero, después y al final?", "Three pictures: a girl flies a red kite, the kite gets stuck in a tall tree, and her grandfather pulls it down with a rake.", "Tres imágenes: una niña vuela una cometa roja, la cometa se atora en un árbol alto y su abuelo la baja con un rastrillo."],
  ["lost-dog", "story", "35-speaking-lost-dog.svg", "Tell the story of the lost dog. How does it end?", "Cuenta la historia del perro perdido. ¿Cómo termina?", "Three pictures: a dog runs out of an open gate, a girl and her father put up a Lost Dog poster, and a neighbor brings the dog back.", "Tres imágenes: un perro sale por una puerta abierta, una niña y su papá ponen un cartel de perro perdido y un vecino devuelve al perro."],
  ["picnic", "story", "35-speaking-rainy-picnic.svg", "Tell what happens to the picnic. How does the family fix the problem?", "Cuenta qué pasa con el pícnic. ¿Cómo resuelve el problema la familia?", "Three pictures: a family carries a picnic basket to the park, rain falls on their blanket, and they eat the picnic at home on the floor.", "Tres imágenes: una familia lleva una canasta de pícnic al parque, llueve sobre su manta y comen el pícnic en casa, en el piso."],
  ["backpack", "story", "35-writing-lost-backpack.svg", "Tell the story of the green backpack. How do you think the boy feels at the end?", "Cuenta la historia de la mochila verde. ¿Cómo crees que se siente el niño al final?", "Three pictures: a boy leaves his green backpack on the bus, a girl finds it, and she gives it back to him at school.", "Tres imágenes: un niño deja su mochila verde en el autobús, una niña la encuentra y se la devuelve en la escuela."],
  ["umbrella", "story", "35t-rain-seq.svg", "Tell the story of the rainy walk to school. What does a good friend do?", "Cuenta la historia de la caminata bajo la lluvia. ¿Qué hace un buen amigo?", "Four pictures: a girl walks to school in the sun, rain pours down, a friend comes with a red umbrella, and they share it.", "Cuatro imágenes: una niña camina a la escuela con sol, empieza a llover, llega un amigo con un paraguas rojo y lo comparten."],
  ["tortillas", "howto", "35t-tortilla-seq.svg", "Tell how they make the food, step by step. Then tell about a food your family makes.", "Di cómo preparan la comida, paso a paso. Después cuenta sobre una comida que hace tu familia.", "Three pictures: a girl and her grandmother mix dough, they roll and flatten it into circles, and the family shares the food at the table.", "Tres imágenes: una niña y su abuela mezclan la masa, la aplanan en círculos y la familia comparte la comida en la mesa."],
  ["bird-feeder", "howto", "35-writing-bird-feeder.svg", "Teach a friend how to make this bird feeder. Write the steps in order.", "Enseña a un amigo a hacer este comedero para pájaros. Escribe los pasos en orden.", "Three steps: spread sunflower butter on a pinecone, roll it in birdseed, and hang it on a branch where a bird eats.", "Tres pasos: untar crema de girasol en una piña de pino, rodarla en semillas y colgarla en una rama donde come un pájaro."],
  ["class-pet", "opinion", "35-writing-class-pet.svg", "Which class pet is better: the fish or the hamster? Give two reasons.", "¿Qué mascota de clase es mejor: el pez o el hámster? Da dos razones.", "Two choices for a class pet: a goldfish in a tank and a hamster in a cage with a wheel.", "Dos opciones de mascota para la clase: un pez dorado en una pecera y un hámster en una jaula con una rueda."],
  ["classrooms", "opinion", "68-two-classrooms.svg", "Which classroom would you choose? Tell why.", "¿Qué salón escogerías? Di por qué.", "Two classrooms side by side. Both have desks and a board. One has computers. The other has paint and art supplies.", "Dos salones, uno junto al otro. Los dos tienen pupitres y un pizarrón. Uno tiene computadoras. El otro tiene pintura y materiales de arte."],
  ["park-cleanup", "describe", "35t-park-cleanup.svg", "What are the neighbors doing? Why does their work matter?", "¿Qué hacen los vecinos? ¿Por qué es importante su trabajo?", "Neighbors clean up a park: a girl picks up a can, a boy carries a recycling bin, two children plant a tree and a man waters flowers.", "Unos vecinos limpian un parque: una niña recoge una lata, un niño lleva un bote de reciclaje, dos niños plantan un árbol y un señor riega las flores."],
  ["hillsides", "describe", "68c-hillside-erosion.svg", "How are the two hillsides different after the rain? Why do you think so?", "¿En qué son diferentes las dos laderas después de la lluvia? ¿Por qué crees que es así?", "Two hillsides by a river after a storm. One has trees and grass and clear water. The other has bare soil, stumps and muddy water.", "Dos laderas junto a un río después de una tormenta. Una tiene árboles, pasto y agua clara. La otra tiene tierra sin plantas, troncos cortados y agua con lodo."],
  ["helped", "memory", "", "Tell about a time you helped someone, or someone helped you.", "Cuenta sobre una vez que ayudaste a alguien, o que alguien te ayudó.", "", ""],
  ["rather", "opinion", "", "Would you rather live near the ocean or near the mountains? Tell why.", "¿Preferirías vivir cerca del mar o cerca de las montañas? Di por qué.", "", ""],
  ["teach", "howto", "", "Teach someone how to do something you are good at.", "Enseña a alguien a hacer algo que tú haces bien.", "", ""],
  ["place", "describe", "", "Describe a place you love. What do you see and hear there?", "Describe un lugar que te encanta. ¿Qué ves y qué oyes allí?", "", ""],
].map(([id, kind, pic, en, es, alt, altEs]) => ({ id, kind, pic, en, es, alt, altEs }));

export const quickKey = (id) => `quick-${id}`;
export const isQuickKey = (key) => String(key).startsWith("quick-");
/** Saved quick writes, newest first: [{prompt, w, text}]. */
export function quickWrites(studio) {
  return QUICK.map((prompt) => ({ prompt, w: studio.writing?.[quickKey(prompt.id)] }))
    .filter((r) => r.w?.versions?.length)
    .map((r) => ({ ...r, text: r.w.versions.at(-1).text }))
    .sort((a, b) => String(b.w.updatedAt || "").localeCompare(String(a.w.updatedAt || "")));
}

const KIND = {
  story: ["Tell a story", "Cuenta una historia"],
  howto: ["Explain the steps", "Explica los pasos"],
  opinion: ["Share your opinion", "Da tu opinión"],
  describe: ["Describe it", "Descríbelo"],
  memory: ["Tell about you", "Cuenta sobre ti"],
};

export function quickChooserHTML(I, ctx, studio) {
  const saved = quickWrites(studio);
  const done = new Set(saved.map((s) => s.prompt.id));
  return html`<div class="d-writing quick-write" data-no-studio-video>
    <header class="quick-head">
      <p class="eyebrow">${icon("sparkle")} ${I.T("Writing Studio", "Estudio de escritura")}</p>
      <h1 tabindex="-1">${I.T("Quick write", "Escritura rápida")}</h1>
      <p class="lead">${I.T("Pick a picture or a question. Write what you think. There is no wrong answer here, and nobody checks it.", "Elige una imagen o una pregunta. Escribe lo que piensas. Aquí no hay respuesta incorrecta y nadie lo revisa.")}</p>
    </header>
    <ul class="quick-grid">
      ${QUICK.map((p) => html`<li><a class="card quick-card ${p.pic ? "" : "is-text"}" href="${BASE}/write?tab=quick&p=${p.id}&grades=${ctx.band}">
        ${p.pic ? html`<img src="${PIC}/${p.pic}" alt="" width="640" height="400" loading="lazy" decoding="async" />` : html`<span class="quick-q" aria-hidden="true">?</span>`}
        <span class="quick-kind">${I.T(...KIND[p.kind])}${done.has(p.id) ? html` <span class="task-status is-done">${icon("check")} ${I.T("Written", "Escrito")}</span>` : ""}</span>
        <strong>${I.T(p.en, p.es)}</strong>
      </a></li>`)}
    </ul>
    ${
      saved.length
        ? html`<section class="panel quick-saved" aria-labelledby="qw-saved-h"><h2 id="qw-saved-h">${icon("bookmark")} ${I.T("My quick writes", "Mis escrituras rápidas")}</h2>
            <ul>${saved.map((s) => html`<li><p class="quick-saved-meta"><strong>${I.T(s.prompt.en, s.prompt.es)}</strong> <span class="fine">${I.T(`${wordCount(s.text)} words`, `${wordCount(s.text)} palabras`)}${s.w.updatedAt ? html` · ${formatDate(todayISO(new Date(s.w.updatedAt)))}` : ""}</span></p><p class="portfolio-response">${s.text}</p><p class="row-actions no-print"><a class="btn small" href="${BASE}/write?tab=quick&p=${s.prompt.id}&grades=${ctx.band}">${icon("writing")} ${I.T("Add more", "Agregar más")}</a></p></li>`)}</ul>
          </section>`
        : ""
    }
    <p><a class="btn" href="${BASE}/write?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to Writing Studio", "Volver al Estudio de escritura")}</a></p>
  </div>`;
}

export function quickWriteHTML(I, ctx, studio, prompt) {
  const w = writingState(studio, quickKey(prompt.id));
  const text = w.draft ?? w.versions.at(-1)?.text ?? "";
  const starters = STARTERS[prompt.kind] || STARTERS.story;
  return html`<article class="d-writing quick-write quick-one" data-quick="${prompt.id}" data-no-studio-video>
    <header class="quick-head">
      <p class="eyebrow">${icon("sparkle")} ${I.T("Quick write", "Escritura rápida")} · ${I.T(...KIND[prompt.kind])}</p>
      <h1 tabindex="-1">${I.T(prompt.en, prompt.es)}</h1>
      <p><button type="button" class="ghost small" data-say="${I.S(prompt.en, prompt.es)}">${icon("volume")} ${I.T("Hear the question", "Escuchar la pregunta")}</button></p>
    </header>
    <div class="quick-cols ${prompt.pic ? "" : "is-text"}">
      ${prompt.pic ? html`<figure class="quick-pic"><img src="${PIC}/${prompt.pic}" alt="${I.S(prompt.alt, prompt.altEs)}" width="640" height="400" decoding="async" /></figure>` : ""}
      <section class="panel editor-panel">
        <label class="field paper"><span class="paper-head">${I.T("Your writing", "Tu escritura")} <span class="fine">${I.T("Saved on this device as you type", "Se guarda en este dispositivo mientras escribes")}</span></span>
          <textarea rows="9" spellcheck="false" placeholder="${I.S("Write here. Any length is fine.", "Escribe aquí. Cualquier extensión está bien.")}" data-quick-draft ${IGN}>
${text}</textarea></label>
        <p class="meter-line"><span data-quick-count>${I.S(`${wordCount(text)} words`, `${wordCount(text)} palabras`)}</span></p>
        <p class="reflect-starters"><span class="fine">${I.T("Need a way to start? Tap one:", "¿Necesitas cómo empezar? Toca una:")}</span>
          ${starters.map(([en, es]) => html`<button type="button" class="insert-chip" data-quick-start="${I.S(en, es)}">${I.T(`${en.trim()}…`, `${es.trim()}…`)}</button>`)}</p>
        <div class="row-actions">
          <button type="button" class="btn btn-primary" data-quick-save ${wordCount(text) ? "" : raw("disabled")}>${icon("bookmark")} ${I.T("Save my quick write", "Guardar mi escritura rápida")}</button>
          <a class="btn" href="${BASE}/write?tab=quick&grades=${ctx.band}">${I.T("Pick another one", "Elegir otra")}</a>
        </div>
        ${w.finishedAt && w.versions.at(-1)?.text === text ? html`<p class="saved-note">${icon("check")} <span>${I.T("Saved. Nice writing!", "Guardado. ¡Buena escritura!")}</span></p>` : ""}
      </section>
    </div>
  </article>`;
}

// ── badges ───────────────────────────────────────────────────────────────────────────────────
/** What a writer has done on this device, as booleans. Reads the studio document; judges nothing. */
export function badgeFacts(studio, tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const entries = Object.entries(studio.writing || {}).filter(([id]) => byId.has(id));
  const finished = entries.filter(([, w]) => w.finishedAt);
  return {
    draft: entries.some(([, w]) => w.versions?.length),
    reviser: entries.some(([, w]) => (w.versions || []).some((v) => v.kind === "revision")),
    evidence: entries.some(([, w]) => (w.evidence || []).length >= 2),
    planner: entries.some(([id, w]) => (byId.get(id).organizer || []).length > 0 && byId.get(id).organizer.every((s) => String(w.organizer?.[s.id] || "").trim())),
    published: finished.length >= 1,
    three: finished.length >= 3,
    explorer: new Set(finished.map(([id]) => byId.get(id).form)).size >= 3,
    own: finished.some(([, w]) => w.stage === "independent"),
    partner: entries.some(([, w]) => String(w.partner?.glow || "").trim() && String(w.partner?.wonder || "").trim()),
    quick: quickWrites(studio).length >= 3,
  };
}

export const BADGES = [
  ["draft", "writing", "First draft", "Primer borrador", "Ask for feedback on a draft.", "Pide comentarios sobre un borrador."],
  ["planner", "list", "Planner", "Planificador", "Fill every box of a plan.", "Llena todas las casillas de un plan."],
  ["evidence", "evidence", "Evidence collector", "Coleccionista de evidencia", "Save two sentences from the sources.", "Guarda dos oraciones de las fuentes."],
  ["reviser", "retry", "Reviser", "Revisor", "Change a draft and ask for feedback again.", "Cambia un borrador y pide comentarios otra vez."],
  ["partner", "conversation", "Good partner", "Buen compañero", "Share a piece and write what your partner said.", "Comparte un texto y escribe lo que dijo tu compañero."],
  ["published", "bookmark", "In my portfolio", "En mi portafolio", "Finish one piece.", "Termina un texto."],
  ["three", "medal", "Three pieces", "Tres textos", "Finish three pieces.", "Termina tres textos."],
  ["explorer", "worlds", "Explorer", "Explorador", "Finish three different kinds of writing.", "Termina tres tipos de escritura diferentes."],
  ["own", "user", "On my own", "Por mi cuenta", "Finish a piece you wrote on your own.", "Termina un texto que escribiste por tu cuenta."],
  ["quick", "sparkle", "Quick writer", "Escritor veloz", "Save three quick writes.", "Guarda tres escrituras rápidas."],
];

export function badgesHTML(I, studio, tasks) {
  const facts = badgeFacts(studio, tasks);
  const n = BADGES.filter(([id]) => facts[id]).length;
  return html`<section class="panel writer-badges" aria-labelledby="wrt-badges-h" id="wrt-badges">
    <header><h2 id="wrt-badges-h">${icon("medal")} ${I.T("My writer badges", "Mis insignias de escritor")}</h2>
      <p class="fine">${I.T(`${n} of ${BADGES.length} collected. Badges show what you have tried. They are not a score.`, `${n} de ${BADGES.length} conseguidas. Las insignias muestran lo que has probado. No son una puntuación.`)}</p></header>
    <ul class="badge-grid">
      ${BADGES.map(([id, ico, en, es, how, howEs]) => html`<li class="${facts[id] ? "is-earned" : ""}"><span class="badge-ico">${icon(facts[id] ? ico : "lock")}</span><strong>${I.T(en, es)}</strong><span class="fine">${facts[id] ? html`<span class="visually-hidden">${I.T("Collected.", "Conseguida.")} </span>` : html`<span class="visually-hidden">${I.T("Not yet.", "Todavía no.")} </span>`}${I.T(how, howEs)}</span></li>`)}
    </ul>
  </section>`;
}

/** Badges collected between two readings of the facts, as [en, es] names. */
export function newBadges(before, after) {
  return BADGES.filter(([id]) => after[id] && !before[id]).map(([, , en, es]) => [en, es]);
}
/** Say which badge was just collected. Call with the facts read before and after a save. */
export function celebrateBadges(I, before, after) {
  for (const [en, es] of newBadges(before, after))
    announce(I.S(`New badge: ${en}! See it in the Writing Studio.`, `¡Nueva insignia: ${es}! Mírala en el Estudio de escritura.`));
}

/** A task the writer has not started, for "Surprise me". `pick` is injectable so the choice can be tested. */
export function surpriseTask(tasks, studio, pick = Math.random) {
  const fresh = tasks.filter((t) => !studio.writing?.[t.id]);
  const pool = fresh.length ? fresh : tasks;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(pick() * pool.length))] : null;
}

/** Doors from the chooser: quick write and surprise. */
export function extrasRowHTML(I, ctx, tasks, studio) {
  const s = surpriseTask(tasks, studio);
  return html`<div class="wrt-doors no-print">
    <a class="card wrt-door" href="${BASE}/write?tab=quick&grades=${ctx.band}"><span class="task-ico">${icon("sparkle")}</span><span><strong>${I.T("Quick write", "Escritura rápida")}</strong><span class="fine">${I.T("A picture or a question. Write freely. Nobody checks it.", "Una imagen o una pregunta. Escribe con libertad. Nadie lo revisa.")}</span></span>${icon("arrow-right")}</a>
    ${s ? html`<a class="card wrt-door" href="${BASE}/write/${s.id}?grades=${ctx.band}"><span class="task-ico">${icon("replay")}</span><span><strong>${I.T("Surprise me", "Sorpréndeme")}</strong><span class="fine">${I.T("Open a task you have not tried yet.", "Abre una tarea que aún no has probado.")}</span></span>${icon("arrow-right")}</a>` : ""}
  </div>`;
}

// ── partner share ────────────────────────────────────────────────────────────────────────────
export function partnerHTML(I, state) {
  const p = state.partner || {};
  return html`<div class="partner-share" data-partner>
    <h4>${icon("conversation")} ${I.T("Share with a partner", "Comparte con un compañero")}</h4>
    <ol class="partner-steps">
      <li>${I.T("Read your writing aloud to a partner.", "Lee tu escritura en voz alta a un compañero.")}</li>
      <li>${I.T("Your partner tells you one thing they liked and one thing they wonder.", "Tu compañero te dice una cosa que le gustó y una cosa que se pregunta.")}
        <span class="partner-stems"><span class="tag">${I.T("I like how you…", "Me gusta cómo…")}</span><span class="tag">${I.T("I wonder…", "Me pregunto…")}</span></span></li>
      <li>${I.T("Write what your partner said.", "Escribe lo que dijo tu compañero.")}</li>
    </ol>
    <div class="partner-fields">
      <label class="field"><span>${I.T("My partner liked…", "A mi compañero le gustó…")}</span><textarea rows="2" data-partner-field="glow" ${IGN}>${p.glow || ""}</textarea></label>
      <label class="field"><span>${I.T("My partner wondered…", "Mi compañero se preguntó…")}</span><textarea rows="2" data-partner-field="wonder" ${IGN}>${p.wonder || ""}</textarea></label>
    </div>
  </div>`;
}

/** Partner and conference notes as they appear in the portfolio. */
export function notesForPortfolioHTML(I, w) {
  const p = w.partner || {};
  const c = w.conference || {};
  const has = (x) => String(x || "").trim();
  if (!has(p.glow) && !has(p.wonder) && !has(c.glow) && !has(c.next)) return "";
  return html`<section class="entry-notes">
    ${has(p.glow) || has(p.wonder) ? html`<div><h3>${icon("conversation")} ${I.T("What my partner said", "Lo que dijo mi compañero")}</h3>${has(p.glow) ? html`<p><strong>${I.T("Liked:", "Le gustó:")}</strong> ${p.glow}</p>` : ""}${has(p.wonder) ? html`<p><strong>${I.T("Wondered:", "Se preguntó:")}</strong> ${p.wonder}</p>` : ""}</div>` : ""}
    ${has(c.glow) || has(c.next) ? html`<div><h3>${icon("teacher")} ${I.T("From my writing conference", "De mi conferencia de escritura")}</h3>${has(c.glow) ? html`<p><strong>${I.T("Working well:", "Va bien:")}</strong> ${c.glow}</p>` : ""}${has(c.next) ? html`<p><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${c.next}</p>` : ""}</div>` : ""}
  </section>`;
}

// ── teacher: focus for the day, conference note, conference sheet ───────────────────────────
export const FOCUS = {
  evidence: ["Evidence", "Evidencia", "Use facts or numbers from the sources.", "Usa datos o números de las fuentes."],
  reasoning: ["Reasoning", "Razonamiento", "Explain why your evidence matters.", "Explica por qué importa tu evidencia."],
  cohesion: ["Connecting ideas", "Conectar ideas", "Use words that link your sentences.", "Usa palabras que enlacen tus oraciones."],
  precision: ["Precise words", "Palabras precisas", "Choose exact words from the topic.", "Elige palabras exactas del tema."],
  sentence: ["Sentences", "Oraciones", "Write complete sentences. Try joining two short ones.", "Escribe oraciones completas. Intenta unir dos cortas."],
};
export const focusFrom = (search) => {
  const f = new URLSearchParams(search).get("focus") || "";
  return Object.hasOwn(FOCUS, f) ? f : "";
};

/** The focus a teacher put in the link, shown to the writer above the steps. The values are a fixed list, never free text. */
export function focusBannerHTML(I, task, focus) {
  if (!focus) return "";
  const f = FOCUS[focus];
  const ask = (task.revisionPrompts || []).find((p) => p.focus === focus)?.prompt;
  return html`<aside class="focus-banner" aria-label="${I.S("Focus from your teacher", "Enfoque de tu docente")}">
    <span class="focus-ico">${icon("flag")}</span>
    <p><strong>${I.T("Today's focus from your teacher", "El enfoque de hoy de tu docente")}: ${I.T(f[0], f[1])}</strong> ${I.T(f[2], f[3])}${ask ? html` <span class="focus-ask">${ask}</span>` : ""}</p>
  </aside>`;
}

const link = (ctx, id, extra = "") => `${location.origin}${BASE}/write/${id}?grades=${ctx.band}${extra}`;

/** Teacher view, inside the task's teacher notes: assign with a focus, print a conference sheet. */
export function teacherAssignHTML(I, ctx, task) {
  const offered = Object.keys(FOCUS).filter((k) => (task.revisionPrompts || []).some((p) => p.focus === k));
  const list = offered.length ? offered : Object.keys(FOCUS);
  return html`<div class="teacher-assign">
    <h4>${I.T("Assign with a focus", "Asignar con un enfoque")}</h4>
    <p class="fine">${I.T("Pick one focus. Students who open the link see it above the steps. The link carries no student information.", "Elija un enfoque. Los estudiantes que abren el enlace lo ven sobre los pasos. El enlace no lleva información de estudiantes.")}</p>
    <p class="focus-links">${list.map((k) => html`<button type="button" class="btn small" data-copy-link="${link(ctx, task.id, `&focus=${k}`)}">${icon("copy")} ${I.T(FOCUS[k][0], FOCUS[k][1])}</button>`)}</p>
    <p class="row-actions"><a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=conference" target="_blank" rel="noopener">${icon("print")} ${I.T("Conference sheet to print", "Hoja de conferencia para imprimir")}</a></p>
  </div>`;
}

/** Teacher view, beside a draft: a note that stays with this piece on this device and shows in the writer's portfolio. */
export function conferenceHTML(I, state, hasDraft) {
  const c = state.conference || {};
  if (!isTeacherView()) {
    if (!String(c.glow || "").trim() && !String(c.next || "").trim()) return "";
    return html`<aside class="conference-card" aria-label="${I.S("From your writing conference", "De tu conferencia de escritura")}">
      <h4>${icon("teacher")} ${I.T("From your writing conference", "De tu conferencia de escritura")}</h4>
      ${String(c.glow || "").trim() ? html`<p><strong>${I.T("Working well:", "Va bien:")}</strong> ${c.glow}</p>` : ""}
      ${String(c.next || "").trim() ? html`<p><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${c.next}</p>` : ""}
    </aside>`;
  }
  return html`<section class="panel teacher-notes conference-note no-print" aria-labelledby="wrt-conf-h">
    <h3 id="wrt-conf-h">${icon("teacher")} ${I.T("Conference with this writer", "Conferencia con este escritor")}</h3>
    <p class="fine">${hasDraft ? I.T("Teacher view only. Your note is saved with this piece on this device. The writer sees it here and in their portfolio.", "Solo en la vista docente. Su nota se guarda con este texto en este dispositivo. El escritor la ve aquí y en su portafolio.") : I.T("Teacher view only. Open this on the writer's device after they have a draft, then leave a note here.", "Solo en la vista docente. Abra esto en el dispositivo del escritor cuando tenga un borrador y deje una nota aquí.")}</p>
    <div class="partner-fields">
      <label class="field"><span>${I.T("One thing that is working", "Una cosa que va bien")}</span><textarea rows="2" maxlength="400" data-conference-field="glow" ${IGN}>${c.glow || ""}</textarea></label>
      <label class="field"><span>${I.T("One next step", "Un siguiente paso")}</span><textarea rows="2" maxlength="400" data-conference-field="next" ${IGN}>${c.next || ""}</textarea></label>
    </div>
  </section>`;
}

/** A one-page sheet for conferring on a task: look-fors, questions and room for notes. Carries no student data. */
export function conferenceSheetHTML(I, ctx, task) {
  const lines = (n) => Array.from({ length: n }, () => html`<span class="sheet-line"></span>`);
  return html`<article class="conference-sheet d-writing">
    <p class="row-actions no-print"><button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print this sheet", "Imprimir esta hoja")}</button><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a></p>
    <header>
      <p class="eyebrow">${I.T("Writing conference", "Conferencia de escritura")} · ${task.keyUse} · ${task.contentArea}</p>
      <h1 tabindex="-1">${task.title}</h1>
      <p class="sheet-names"><span>${I.T("Writer", "Escritor")}: <span class="sheet-line"></span></span><span>${I.T("Date", "Fecha")}: <span class="sheet-line"></span></span></p>
      <p class="sheet-task"><strong>${I.T("Task", "Tarea")}:</strong> ${task.prompt}</p>
    </header>
    <section><h2>${I.T("Look for", "Observe")}</h2>
      <ul class="sheet-checks">${(task.organizer || []).map((o) => html`<li><span class="sheet-box"></span><span><strong>${o.label}.</strong> ${o.hint}</span></li>`)}</ul></section>
    ${task.revisionPrompts?.length ? html`<section><h2>${I.T("Questions to ask", "Preguntas para hacer")}</h2><ul>${task.revisionPrompts.map((p) => html`<li><em>${FOCUS[p.focus] ? I.T(FOCUS[p.focus][0], FOCUS[p.focus][1]) : p.focus}:</em> ${p.prompt}</li>`)}</ul></section>` : ""}
    <section class="sheet-notes">
      <div><h2>${I.T("Working well", "Va bien")}</h2>${lines(3)}</div>
      <div><h2>${I.T("One next step", "Un siguiente paso")}</h2>${lines(3)}</div>
    </section>
    <section><h2>${I.T("Help the writer used", "Ayuda que usó el escritor")}</h2>
      <p class="sheet-help"><span><span class="sheet-box"></span> ${I.T("Frames and words", "Marcos y palabras")}</span><span><span class="sheet-box"></span> ${I.T("Word bank", "Banco de palabras")}</span><span><span class="sheet-box"></span> ${I.T("On their own", "Por su cuenta")}</span></p></section>
    <p class="fine">${I.T("Classroom practice notes. Not a WIDA score or a proficiency level.", "Notas de práctica en el aula. No son una puntuación de WIDA ni un nivel de dominio.")}</p>
  </article>`;
}

// ── events ───────────────────────────────────────────────────────────────────────────────────
/** Typing in a quick write, a partner field or a conference field. `save` persists the studio document. */
export function onMoreInput(e, I, studio, state, save) {
  const t = e.target;
  if (t.matches?.("[data-quick-draft]")) {
    const id = t.closest("[data-quick]")?.dataset.quick;
    if (!id) return true;
    const w = writingState(studio, quickKey(id));
    w.draft = t.value;
    w.quick = true;
    w.updatedAt = new Date().toISOString();
    const n = wordCount(t.value);
    const count = document.querySelector("[data-quick-count]");
    if (count) count.textContent = I.S(`${n} words`, `${n} palabras`);
    const b = document.querySelector("[data-quick-save]");
    if (b) b.disabled = !n;
    save();
    return true;
  }
  if (!state) return false;
  if (t.matches?.("[data-partner-field]")) {
    state.partner ||= {};
    state.partner[t.dataset.partnerField] = t.value;
    save();
    return true;
  }
  if (t.matches?.("[data-conference-field]")) {
    state.conference ||= {};
    state.conference[t.dataset.conferenceField] = t.value;
    state.conference.t = new Date().toISOString();
    save();
    return true;
  }
  return false;
}

/** Clicks on the quick-write page. Returns "rerender" when the page should be drawn again, true when handled. */
export function onMoreClick(e, I, studio, save, tasks = []) {
  const t = e.target;
  const start = t.closest("[data-quick-start]");
  if (start) {
    const box = document.querySelector("[data-quick-draft]");
    if (!box) return true;
    const r = insertion(box.value, box.value.length, box.value.length, start.dataset.quickStart);
    box.value = r.value;
    box.focus();
    box.setSelectionRange(r.selStart, r.selEnd);
    box.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  if (t.closest("[data-quick-save]")) {
    const id = t.closest("[data-quick]")?.dataset.quick;
    const box = document.querySelector("[data-quick-draft]");
    if (!id || !box?.value.trim()) return true;
    const before = badgeFacts(studio, tasks);
    const w = writingState(studio, quickKey(id));
    addVersion(w, box.value, "final");
    w.draft = box.value;
    w.quick = true;
    w.finishedAt = new Date().toISOString();
    w.updatedAt = w.finishedAt;
    save();
    announce(I.S("Saved. Nice writing!", "Guardado. ¡Buena escritura!"));
    celebrateBadges(I, before, badgeFacts(studio, tasks));
    return "rerender";
  }
  return false;
}
