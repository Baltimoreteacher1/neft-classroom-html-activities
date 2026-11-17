// Book Studio 2.0 · the stage dock under the canvas: Imagine, Create, Bring It to Life, Improve, Publish. Progressive
// disclosure: only the current stage's tools show. "Bring It to Life" holds the animation timeline, the scene player and
// "Direct this scene". "Improve" holds the optional language coach and revision help. Loaded with the editor; the player
// itself loads only when someone presses Play.
import { bkIcon } from "./icons.js";
import { isTeacher } from "./lang/ui-instructor.js";
import { plainText } from "./model.js";
import { createScenePlayer } from "./scene-player.js";
import { esc } from "./render.js";
import {
  ACTION_LABEL,
  ACTION_TYPES,
  EXPRESSIONS,
  EXPRESSION_LABEL,
  SOUNDS,
  applyOps,
  characterArt,
  describeOps,
  interpretDirection,
  normalizeAction,
  sceneDuration,
  validateOps,
} from "./story.js";
import { createSupportHost } from "./lang/ui-support.js";
import { bandGuideHTML } from "./program-ui.js";
import { addRevision, emptyWork, logAttempt } from "./lang/work.js";

export const STAGES = ["imagine", "create", "life", "improve", "publish"];
const STAGE_LABEL = {
  imagine: ["Imagine", "Imaginar"],
  create: ["Create", "Crear"],
  life: ["Bring It to Life", "Dale vida"],
  improve: ["Improve", "Mejorar"],
  publish: ["Publish", "Publicar"],
};
const STAGE_ICON = {
  imagine: "lightbulb",
  create: "draw",
  life: "film",
  improve: "wand",
  publish: "share",
};

export const stageBarHTML = (E) => {
  const tr = E.I.S;
  return `<nav class="bk-stages" aria-label="${esc(tr("What are you doing?", "¿Qué estás haciendo?"))}">${STAGES.map((s) => `<button type="button" class="bk-stage-btn${E.stage === s ? " is-on" : ""}" data-stage="${s}" aria-pressed="${E.stage === s}">${bkIcon(STAGE_ICON[s])}<span>${esc(tr(...STAGE_LABEL[s]))}</span></button>`).join("")}</nav>`;
};

// The learner's audience: a teacher preview never lives here (that is its own sandbox); this is the real author.
export function makeEditorSupportHost(E) {
  const { core } = E;
  return createSupportHost({
    I: E.I,
    getBook: () => core.S.book,
    audience: () => {
      const b = core.S.book;
      return { profile: b.plan.profile, plan: b.plan, mode: isTeacher() ? "author" : "student" };
    },
    getWork: () => core.S.book.work,
    setWork: (fn, { quiet } = {}) => {
      core.S.book.work = fn(core.S.book.work);
      core.commit({ render: false });
      if (!quiet) E.renderDock?.();
    },
    insertText: (support, text) => insertIntoTarget(E, support, text),
    applyText: (elementId, text) => {
      const el = core.S.book.pages.flatMap((p) => p.elements).find((x) => x.id === elementId);
      if (!el) return;
      core.update(elementId, { html: `<p>${esc(text)}</p>` }, { render: true });
    },
    refresh: () => E.renderDock?.(),
    say: (m) => E.say(m),
  });
}

/** A starter goes where the learner was writing: the support's text box, else the selected one, else a new text box. */
function insertIntoTarget(E, support, text) {
  const { core } = E;
  const page = core.page();
  const tid = support.target.elementId;
  let el =
    (tid &&
      page.elements.find((x) => x.id === tid && (x.type === "text" || x.type === "bubble"))) ||
    core.selectedEl();
  if (!el || (el.type !== "text" && el.type !== "bubble"))
    el = [...page.elements].reverse().find((x) => x.type === "text" && x.role === "body");
  if (!el) {
    el = core.add("text", { x: 8, y: 62, w: 84, h: 26, html: "" }) || null;
    if (!el)
      return E.say(
        E.I.S(
          "Add a text box first, then use the starter.",
          "Agrega primero un cuadro de texto y luego usa el inicio.",
        ),
      );
  }
  const cur = plainText(el.html);
  const joined = `${cur}${cur && !/\s$/.test(cur) ? " " : ""}${text}`;
  core.update(el.id, { html: `<p>${esc(joined)}</p>` }, { render: true });
  E.select(el.id, { focus: false });
  E.beginTextEdit(el.id);
}

// ── dock ──
export function dockHTML(E) {
  const tr = E.I.S;
  const b = E.core.S.book;
  const page = E.core.page();
  const host = (E.spHost = E.spHost || makeEditorSupportHost(E));
  const teacher = isTeacher();
  const tray = !teacher ? host.trayHTML(page.id) : "";
  const teacherBar = teacher
    ? `<div class="bk-teacher-bar" role="group" aria-label="${esc(tr("Teacher tools", "Herramientas del docente"))}"><span class="bk-chip">${bkIcon("support")} ${esc(tr("Teacher tools", "Herramientas del docente"))}</span><button type="button" class="btn small btn-primary" data-dock="add-support">${bkIcon("plus")} ${esc(tr("Add Language Support", "Agregar apoyo de lenguaje"))}</button><button type="button" class="btn small" data-dock="studio">${esc(tr("Language Support Studio", "Estudio de apoyos"))} (${b.supports.length})</button><button type="button" class="btn small" data-dock="preview">${bkIcon("eye")} ${esc(tr("Preview as student", "Ver como estudiante"))}</button></div>`
    : "";
  const pageSupports = b.supports.filter(
    (s) => s.target.scope === "book" || s.target.pageId === page.id,
  ).length;
  let body = "";
  if (E.stage === "imagine") body = imagineHTML(E, page);
  else if (E.stage === "life") body = lifeHTML(E, page);
  else if (E.stage === "improve") body = improveHTML(E, page);
  else if (E.stage === "publish") body = publishHTML(E);
  return `${teacherBar}${bandGuideHTML(E)}${teacher && pageSupports ? `<p class="fine bk-dock-note">${pageSupports} ${esc(tr("language supports on this page. Preview as student to see them as a student does.", "apoyos de lenguaje en esta página. Usa Ver como estudiante para verlos como los ve un estudiante."))}</p>` : ""}${body}${tray}`;
}

const btn = (act, ico, label, extra = "") =>
  `<button type="button" class="btn small" data-dock="${act}" ${extra}>${bkIcon(ico)} ${esc(label)}</button>`;

function imagineHTML(E, page) {
  const tr = E.I.S;
  const el = E.core.selectedEl();
  const b = E.core.S.book;
  const chars = b.characters.length;
  return `<section class="bk-dock-sec" aria-label="${esc(tr("Plan your story", "Planea tu cuento"))}"><h3>${bkIcon("lightbulb")} ${esc(tr("Plan your story", "Planea tu cuento"))}</h3>
    <div class="bk-btnrow">${btn("characters", "person", `${tr("Characters", "Personajes")} (${chars})`)}${btn("map", "map", tr("Story map", "Mapa del cuento"))}${btn("choices", "flag", `${tr("Choices on this page", "Decisiones en esta página")} (${page.choices.length})`)}${btn("items", "search", tr("Clues and items", "Pistas y objetos"))}</div>
    ${el && el.type !== "text" && el.type !== "bubble" ? `<p class="fine">${esc(tr("This object can be a clue the reader clicks.", "Este objeto puede ser una pista en la que el lector hace clic."))} ${btn("hotspot", "search", el.hotspot ? tr("Edit the clue", "Editar la pista") : tr("Make it a clue", "Convertir en pista"))}</p>` : ""}
    <label class="bk-f inline"><span>${esc(tr("This page is", "Esta página es"))}</span><select data-dock-field="ending"><option value="">${esc(tr("part of the story", "parte del cuento"))}</option><option value="good" ${page.ending === "good" ? "selected" : ""}>${esc(tr("an ending (happy)", "un final (feliz)"))}</option><option value="neutral" ${page.ending === "neutral" ? "selected" : ""}>${esc(tr("an ending", "un final"))}</option><option value="open" ${page.ending === "open" ? "selected" : ""}>${esc(tr("an open ending", "un final abierto"))}</option></select></label></section>`;
}

function lifeHTML(E, page) {
  const tr = E.I.S;
  const actions = [...page.scene.actions].sort((a, z) => a.t - z.t);
  const els = page.elements.filter(
    (e) => e.type === "art" || e.type === "image" || e.type === "bubble" || e.type === "text",
  );
  const label = (e) => {
    const ch = E.core.S.book.characters.find((c) => c.id === e.charId);
    return ch?.name || e.alt || plainText(e.html || "").slice(0, 24) || e.type;
  };
  const targetSel = (a) =>
    `<select data-act="${a.id}" data-k="target" aria-label="${esc(tr("Who or what", "Quién o qué"))}"><option value="">—</option>${els.map((e) => `<option value="${e.id}" ${a.target === e.id ? "selected" : ""}>${esc(label(e))}</option>`).join("")}</select>`;
  const params = (a) => {
    const n = (k, v, min, max, step = 1, lab = k) =>
      `<label class="bk-mini"><span>${esc(lab)}</span><input type="number" min="${min}" max="${max}" step="${step}" data-act="${a.id}" data-k="p.${k}" value="${v}"></label>`;
    if (a.type === "walk" || a.type === "run")
      return `${n("x", Math.round(a.params.x), -50, 150, 1, tr("go to across %", "ir a lo ancho %"))}${n("y", Math.round(a.params.y), -50, 150, 1, tr("down %", "abajo %"))}`;
    if (a.type === "turn" || a.type === "look")
      return `<select data-act="${a.id}" data-k="p.dir" aria-label="${esc(tr("Direction", "Dirección"))}">${(a.type === "turn" ? ["left", "right"] : ["left", "right", "up", "down"]).map((d) => `<option ${a.params.dir === d ? "selected" : ""}>${d}</option>`).join("")}</select>`;
    if (a.type === "expression")
      return `<select data-act="${a.id}" data-k="p.expression" aria-label="${esc(tr("Expression", "Expresión"))}">${EXPRESSIONS.map((x) => `<option value="${x}" ${a.params.expression === x ? "selected" : ""}>${esc(tr(...EXPRESSION_LABEL[x]))}</option>`).join("")}</select>`;
    if (a.type === "speak")
      return `<select data-act="${a.id}" data-k="p.bubbleId" aria-label="${esc(tr("Which bubble", "Qué globo"))}"><option value="">—</option>${page.elements
        .filter((e) => e.type === "bubble")
        .map(
          (e) =>
            `<option value="${e.id}" ${a.params.bubbleId === e.id ? "selected" : ""}>${esc(plainText(e.html).slice(0, 28) || tr("bubble", "globo"))}</option>`,
        )
        .join("")}</select>`;
    if (a.type === "zoom")
      return `${n("zoom", a.params.zoom, 1, 3, 0.1, tr("zoom", "zoom"))}${n("x", Math.round(a.params.x), 0, 100, 1, "x %")}${n("y", Math.round(a.params.y), 0, 100, 1, "y %")}`;
    if (a.type === "pan")
      return `${n("x", Math.round(a.params.x), 0, 100, 1, "x %")}${n("y", Math.round(a.params.y), 0, 100, 1, "y %")}`;
    if (a.type === "fade") return n("to", a.params.to, 0, 1, 0.1, tr("fade to", "hasta"));
    if (a.type === "sound")
      return `<select data-act="${a.id}" data-k="p.sound" aria-label="${esc(tr("Sound", "Sonido"))}">${SOUNDS.map((x) => `<option ${a.params.sound === x ? "selected" : ""}>${x}</option>`).join("")}</select>`;
    return "";
  };
  const rows = actions
    .map(
      (
        a,
        i,
      ) => `<li class="bk-act" data-act-row="${a.id}"><span class="bk-act-n">${i + 1}</span><strong>${esc(tr(...ACTION_LABEL[a.type]))}</strong>${a.target || !["pause", "zoom", "pan", "sound"].includes(a.type) ? targetSel(a) : ""}${params(a)}
    <label class="bk-mini"><span>${esc(tr("starts at (s)", "empieza (s)"))}</span><input type="number" min="0" max="20" step="0.1" data-act="${a.id}" data-k="t" value="${(a.t / 1000).toFixed(1)}"></label>
    <label class="bk-mini"><span>${esc(tr("lasts (s)", "dura (s)"))}</span><input type="number" min="0" max="20" step="0.1" data-act="${a.id}" data-k="dur" value="${(a.dur / 1000).toFixed(1)}"></label>
    <button type="button" class="bk-tbtn" data-dock="act-del" data-id="${a.id}" aria-label="${esc(tr("Delete this action", "Eliminar esta acción"))}">${bkIcon("trash")}</button></li>`,
    )
    .join("");
  const dur = sceneDuration(page.scene);
  const pl = E.player;
  return `<section class="bk-dock-sec" aria-label="${esc(tr("Animation timeline", "Línea de tiempo de animación"))}"><h3>${bkIcon("film")} ${esc(tr("Bring this page to life", "Dale vida a esta página"))}</h3>
    <form class="bk-director" data-director novalidate><label class="bk-f"><span>${esc(tr("Direct this scene", "Dirige esta escena"))}</span><input data-dir-text maxlength="160" placeholder="${esc(tr("Make the fox walk toward the cave", "Haz que el zorro camine hacia la cueva"))}" autocomplete="off"></label><button type="submit" class="btn small btn-primary">${bkIcon("wand")} ${esc(tr("Show me", "Mostrar"))}</button></form>
    <div data-dir-out role="status"></div>
    <div class="bk-player-bar" role="group" aria-label="${esc(tr("Play this page", "Reproducir esta página"))}"><button type="button" class="btn small btn-primary" data-dock="play" ${dur ? "" : "disabled"}>${bkIcon(pl?.playing ? "pause" : "play")} ${esc(pl?.playing ? tr("Pause", "Pausar") : tr("Play", "Reproducir"))}</button><button type="button" class="btn small ghost" data-dock="reset" ${dur ? "" : "disabled"}>${esc(tr("Back to start", "Volver al inicio"))}</button>
      <input type="range" min="0" max="${Math.max(1, dur)}" value="${Math.round(pl?.time || 0)}" step="50" data-dock-scrub aria-label="${esc(tr("Move through the scene", "Moverse por la escena"))}" ${dur ? "" : "disabled"}><span class="fine" data-dock-time>${((pl?.time || 0) / 1000).toFixed(1)} / ${(dur / 1000).toFixed(1)} s</span>
      <label class="bk-chk"><input type="checkbox" data-dock-mute ${E.muted === false ? "checked" : ""}> <span>${esc(tr("Sound effects", "Efectos de sonido"))}</span></label><label class="bk-chk"><input type="checkbox" data-dock-voices ${E.voices ? "checked" : ""}> <span>${esc(tr("Character voices", "Voces de personajes"))}</span></label></div>
    ${rows ? `<ol class="bk-acts">${rows}</ol>` : `<p class="fine">${esc(tr("No actions yet. Add one below, or tell the director what should happen.", "Aún no hay acciones. Agrega una abajo o dile al director qué debe pasar."))}</p>`}
    <div class="bk-btnrow"><label class="bk-f inline"><span class="sr-only">${esc(tr("Kind of action", "Tipo de acción"))}</span><select data-dock-newtype>${ACTION_TYPES.map((a) => `<option value="${a}">${esc(tr(...ACTION_LABEL[a]))}</option>`).join("")}</select></label>${btn("act-add", "plus", tr("Add action", "Agregar acción"))}
      <label class="bk-f inline"><span>${esc(tr("Weather", "Ambiente"))}</span><select data-dock-field="ambience">${["", "dust", "rain", "fireflies", "snow"].map((x) => `<option value="${x}" ${page.scene.ambience === x ? "selected" : ""}>${esc({ "": tr("none", "ninguno"), dust: tr("floating dust", "polvo"), rain: tr("rain", "lluvia"), fireflies: tr("fireflies", "luciérnagas"), snow: tr("snow", "nieve") }[x])}</option>`).join("")}</select></label>
      <label class="bk-chk"><input type="checkbox" data-dock-field="parallax" ${page.scene.parallax ? "checked" : ""}> <span>${esc(tr("Gentle moving background", "Fondo en movimiento suave"))}</span></label></div>
    <div class="bk-btnrow"><span class="fine">${esc(tr("Ideas:", "Ideas:"))}</span>${btn("preset-enter", "person", tr("Enter and wave", "Entrar y saludar"))}${btn("preset-look", "eye", tr("Look around", "Mirar alrededor"))}${btn("preset-push", "zoomIn", tr("Camera push-in", "Acercar la cámara"))}${btn("preset-jump", "star", tr("Jump for joy", "Saltar de alegría"))}</div>
    <p class="fine">${esc(tr("People who prefer less motion see each scene as a still picture. Sound only plays when you press Play.", "Quienes prefieren menos movimiento ven cada escena como una imagen fija. El sonido solo suena al presionar Reproducir."))}</p></section>`;
}

const SPEC = [
  [
    "too-vague",
    /\b(good|nice|bad|thing|things|stuff)\b/i,
    (w) => `You wrote “${w}”. What is a more exact word?`,
  ],
  [
    "feeling",
    /\b(scared|sad|happy|angry|mad|worried)\b/i,
    (w) => `What did the character see, hear or do that made them feel ${w}?`,
  ],
  [
    "said",
    /\b(said)\b/i,
    () => "How did the character say it? Is there a stronger word than “said”?",
  ],
  ["short", /^.{0,40}$/s, () => "Can you add one detail: where, when, how or why?"],
  [
    "because",
    /\b(because|so|therefore)\b/i,
    () => "Good: you gave a reason. Is the reason clear to someone who was not there?",
  ],
];

/** A coach question from simple, visible rules. It asks; it never rewrites. */
export function coachQuestion(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  for (const [, re, q] of SPEC) {
    const m = t.match(re);
    if (m) return q(m[1] || m[0]);
  }
  return "Read it aloud. Which sentence do you like best? What could you add to make it even clearer?";
}

function improveHTML(E, page) {
  const tr = E.I.S;
  const b = E.core.S.book;
  const texts = page.elements.filter(
    (e) => (e.type === "text" || e.type === "bubble") && plainText(e.html),
  );
  const coachOn = b.coach.enabled;
  const stage = E.coach || {};
  const noAlt = page.elements.filter((e) => e.type === "image" && !e.alt).length;
  return `<section class="bk-dock-sec" aria-label="${esc(tr("Improve your writing", "Mejora tu escritura"))}"><h3>${bkIcon("wand")} ${esc(tr("Improve your writing", "Mejora tu escritura"))}</h3>
    ${
      coachOn
        ? `<div class="bk-coach"><p class="fine">${esc(tr("The coach asks a question. You decide what to change. You can say no thanks.", "El entrenador hace una pregunta. Tú decides qué cambiar. Puedes decir no, gracias."))}</p>
      ${texts.length ? `<label class="bk-f"><span>${esc(tr("Which writing?", "¿Qué escritura?"))}</span><select data-coach-el>${texts.map((e) => `<option value="${e.id}" ${stage.el === e.id ? "selected" : ""}>${esc(plainText(e.html).slice(0, 50))}</option>`).join("")}</select></label><div class="bk-btnrow">${btn("coach-ask", "lightbulb", tr("Ask me a question", "Hazme una pregunta"))}</div>` : `<p class="fine">${esc(tr("Write something on this page first.", "Primero escribe algo en esta página."))}</p>`}
      ${stage.q ? `<div class="bk-coach-q" role="status"><p><strong>${esc(stage.q)}</strong></p><label class="bk-f"><span>${esc(tr("My new sentence (optional)", "Mi nueva oración (opcional)"))}</span><textarea rows="2" data-coach-rev maxlength="600">${esc(stage.rev || "")}</textarea></label><div class="bk-btnrow">${btn("coach-apply", "check", tr("Use my new sentence", "Usar mi nueva oración"))}${btn("coach-no", "close", tr("No thanks", "No, gracias"))}</div></div>` : ""}
      ${stage.after ? `<p class="bk-coach-after" role="status">${esc(stage.after)}</p>` : ""}</div>`
        : `<p class="fine">${esc(tr("Your teacher turned the coach off for this book.", "Tu docente apagó el entrenador para este libro."))}</p>`
    }
    ${isTeacher() ? `<label class="bk-chk"><input type="checkbox" data-dock-coach ${coachOn ? "checked" : ""}> <span>${esc(tr("Language coach on for this book", "Entrenador de lenguaje activado para este libro"))}</span></label>` : ""}
    ${noAlt ? `<p class="bk-warn">${esc(tr(`${noAlt} picture(s) on this page need a description.`, `${noAlt} imagen(es) en esta página necesitan una descripción.`))}</p>` : `<p class="fine">${bkIcon("check")} ${esc(tr("Every picture on this page has a description.", "Cada imagen de esta página tiene una descripción."))}</p>`}</section>`;
}

function publishHTML(E) {
  const tr = E.I.S;
  const b = E.core.S.book;
  const p = b.publish;
  const aud = [
    ["private", tr("Only me (private draft)", "Solo yo (borrador privado)")],
    ["teacher", tr("My teacher", "Mi docente")],
    ["class", tr("My class", "Mi clase")],
    ["family", tr("My family", "Mi familia")],
    ["public", tr("Anyone with the link", "Cualquiera con el enlace")],
  ];
  const needs = p.audience === "public" || p.audience === "class" || p.audience === "family";
  const approved = !!p.approvedAt;
  return `<section class="bk-dock-sec" aria-label="${esc(tr("Publish", "Publicar"))}"><h3>${bkIcon("share")} ${esc(tr("Publish your book", "Publica tu libro"))}</h3>
    <p class="fine">${esc(tr("Your book is private until you and your teacher choose to share it. Nothing is shared by itself.", "Tu libro es privado hasta que tú y tu docente decidan compartirlo. Nada se comparte solo."))}</p>
    <fieldset class="bk-radio"><legend>${esc(tr("Who can read it?", "¿Quién puede leerlo?"))}</legend>${aud.map(([v, l]) => `<label class="bk-chk"><input type="radio" name="bkAud" data-dock-aud value="${v}" ${p.audience === v ? "checked" : ""}> <span>${esc(l)}</span></label>`).join("")}</fieldset>
    ${needs ? `<p class="${approved ? "fine" : "bk-warn"}" role="status">${approved ? `${bkIcon("check")} ${esc(tr("Approved by", "Aprobado por"))} ${esc(p.approvedBy)} ${esc(p.approvedAt.slice(0, 10))}.` : esc(tr("A teacher needs to approve this before the share link works.", "Un docente debe aprobar esto antes de que funcione el enlace."))}</p>${isTeacher() ? `<div class="bk-btnrow"><button type="button" class="btn small ${approved ? "ghost" : "btn-primary"}" data-dock="approve">${esc(approved ? tr("Remove approval", "Quitar aprobación") : tr("Approve for sharing", "Aprobar para compartir"))}</button></div>` : ""}` : ""}
    ${b.supports.some((s) => !s.authoringOnly) ? `<label class="bk-chk"><input type="checkbox" data-dock-incsup ${p.includeSupports ? "checked" : ""}> <span>${esc(tr("Include the supports my teacher allowed (word help, read-aloud) in the shared book", "Incluir los apoyos que mi docente permitió (ayuda con palabras, lectura en voz alta) en el libro compartido"))}</span></label>` : ""}
    <div class="bk-btnrow"><a class="btn small" href="/access-practice-lab/book-studio/read/${b.id}">${bkIcon("eye")} ${esc(tr("Read it", "Leerlo"))}</a><a class="btn small" href="/access-practice-lab/book-studio/play/${b.id}">${bkIcon("play")} ${esc(tr("Play it", "Jugarlo"))}</a><button type="button" class="btn small" data-dock="theater">${bkIcon("speaking")} ${esc(tr("Reader's theater script", "Guion de teatro de lectores"))}</button><button type="button" class="btn small btn-primary" data-bk-act="finish">${bkIcon("check")} ${esc(tr("Finish and share…", "Terminar y compartir…"))}</button></div></section>`;
}

// ── events ──
export async function onDockClick(E, e) {
  const tr = E.I.S;
  const { core } = E;
  const stageBtn = e.target.closest("[data-stage]");
  if (stageBtn) {
    E.stage = stageBtn.dataset.stage;
    E.player?.destroy();
    E.player = null;
    E.renderStage();
    return true;
  }
  const host = E.spHost;
  if (host && (await host.onClick(e, core.page().id))) return true;
  const b = e.target.closest("[data-dock]");
  if (!b) return false;
  const act = b.dataset.dock;
  if (act === "frame") {
    insertIntoTarget(E, { target: {} }, b.dataset.frame || "");
    return true;
  }
  const page = core.page();
  const book = core.S.book;
  const redock = () => E.renderDock();
  if (act === "add-support") (await import("./lang/ui-instructor.js")).openBuilder(E, {});
  else if (act === "studio") (await import("./lang/ui-instructor.js")).openStudio(E, "manage");
  else if (act === "preview") (await import("./lang/ui-instructor.js")).openStudio(E, "preview");
  else if (act === "characters") (await import("./ui-story-map.js")).openCharacters(E);
  else if (act === "map") (await import("./ui-story-map.js")).openStoryMap(E);
  else if (act === "choices") (await import("./ui-story-map.js")).openChoices(E);
  else if (act === "items") (await import("./ui-story-map.js")).openItems(E);
  else if (act === "hotspot") (await import("./ui-story-map.js")).openHotspot(E);
  else if (act === "act-add") {
    const type = E.root.querySelector("[data-dock-newtype]").value;
    const last = Math.max(0, ...page.scene.actions.map((a) => a.t + a.dur));
    const sel = core.selectedEl();
    const target = ["pause", "zoom", "pan", "sound"].includes(type)
      ? ""
      : sel?.id || page.elements.find((x) => x.type === "art")?.id || "";
    const a = normalizeAction({
      type,
      target,
      t: last,
      params: type === "walk" || type === "run" ? { x: (sel?.x ?? 40) + 25, y: sel?.y ?? 40 } : {},
    });
    page.scene.actions.push(a);
    core.commit({ render: false });
    redock();
    E.say(tr("Action added.", "Acción agregada."));
  } else if (act === "act-del") {
    page.scene.actions = page.scene.actions.filter((a) => a.id !== b.dataset.id);
    core.commit({ render: false });
    redock();
  } else if (act.startsWith("preset-")) {
    const sel = core.selectedEl() || page.elements.find((x) => x.type === "art");
    if (!sel)
      return (
        E.say(tr("Add or select a character first.", "Primero agrega o selecciona un personaje.")),
        true
      );
    const t0 = Math.max(0, ...page.scene.actions.map((a) => a.t + a.dur));
    const add = (type, dt, dur, params = {}) =>
      page.scene.actions.push(
        normalizeAction({ type, target: type === "zoom" ? "" : sel.id, t: t0 + dt, dur, params }),
      );
    if (act === "preset-enter") (add("appear", 0, 600), add("wave", 700, 900));
    if (act === "preset-look")
      (add("look", 0, 500, { dir: "left" }), add("look", 600, 500, { dir: "right" }));
    if (act === "preset-push")
      add("zoom", 0, 1200, { zoom: 1.6, x: sel.x + sel.w / 2, y: sel.y + sel.h / 2 });
    if (act === "preset-jump") (add("jump", 0, 600), add("jump", 700, 600));
    core.commit({ render: false });
    redock();
  } else if (act === "play") {
    if (E.player?.playing) {
      E.player.pause();
      return (redock(), true);
    }
    ensurePlayer(E);
    E.player.play();
    redock();
  } else if (act === "reset") {
    ensurePlayer(E);
    E.player.reset();
    redock();
  } else if (act === "coach-ask") {
    const id = E.root.querySelector("[data-coach-el]")?.value;
    const el = page.elements.find((x) => x.id === id);
    if (!el) return true;
    const q = coachQuestion(plainText(el.html));
    E.coach = { el: id, q, original: plainText(el.html) };
    book.work = logAttempt(book.work, { elementId: id, text: plainText(el.html), supports: [] });
    book.work.coach.push({ elementId: id, q, stage: "feedback", at: new Date().toISOString() });
    core.commit({ render: false });
    redock();
  } else if (act === "coach-no") {
    E.coach = {
      after: tr(
        "No problem. Keep writing in your own way.",
        "No hay problema. Sigue escribiendo a tu manera.",
      ),
    };
    redock();
  } else if (act === "coach-apply") {
    const text = E.root.querySelector("[data-coach-rev]")?.value.trim();
    const c = E.coach;
    if (!text || !c?.el)
      return (
        E.say(tr("Write your new sentence first.", "Primero escribe tu nueva oración.")),
        true
      );
    book.work = addRevision(book.work, {
      elementId: c.el,
      pageId: page.id,
      before: c.original,
      after: text,
      by: "student",
      supportIds: [],
      note: c.q,
    });
    book.work.coach.push({
      elementId: c.el,
      q: c.q,
      stage: "revision",
      at: new Date().toISOString(),
    });
    core.update(c.el, { html: `<p>${esc(text)}</p>` }, { render: true });
    E.coach = {
      after: tr(
        "Your new sentence is on the page. Try the same idea in your next scene without help.",
        "Tu nueva oración está en la página. Prueba la misma idea en tu próxima escena sin ayuda.",
      ),
    };
    redock();
  } else if (act === "approve") {
    const p = book.publish;
    book.publish = {
      ...p,
      approvedAt: p.approvedAt ? "" : new Date().toISOString(),
      approvedBy: p.approvedAt ? "" : "Teacher",
    };
    core.commit({ render: false });
    redock();
  } else if (act === "theater") {
    const { theaterScript } = await import("./story.js");
    const lines = theaterScript(book);
    const html = `<!doctype html><meta charset="utf-8"><title>${esc(book.title)} · Reader's theater</title><style>body{font:18px/1.5 system-ui;max-width:42rem;margin:2rem auto;padding:0 1rem}h1{font-size:1.6rem}p{margin:.4rem 0}b{display:inline-block;min-width:7rem}.d{font-style:italic;color:#444}</style><h1>${esc(book.title)}</h1>${lines.map((l) => `<p class="${l.direction ? "d" : ""}"><b>${esc(l.who)}:</b> ${esc(l.text)}</p>`).join("")}`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print?.();
    } else
      E.say(
        tr(
          "Your browser blocked the script window. Allow pop-ups to print it.",
          "Tu navegador bloqueó la ventana. Permite ventanas emergentes para imprimirlo.",
        ),
      );
  }
  return true;
}

function ensurePlayer(E) {
  if (E.player) E.player.destroy();
  const pageEl = E.root.querySelector(".bk-canvas .bk-page");
  const page = E.core.page();
  E.player = createScenePlayer(pageEl, page, {
    reduced: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    muted: () => E.muted !== false,
    voices: () => !!E.voices,
    characters: E.core.S.book.characters,
    onTime: (t) => {
      const s = E.root.querySelector("[data-dock-scrub]");
      const label = E.root.querySelector("[data-dock-time]");
      if (s && document.activeElement !== s) s.value = Math.round(t);
      if (label)
        label.textContent = `${(t / 1000).toFixed(1)} / ${(sceneDuration(page.scene) / 1000).toFixed(1)} s`;
    },
    onEnd: () => E.renderDock(),
  });
}

export function onDockInput(E, e) {
  const { core } = E;
  const t = e.target;
  const page = core.page();
  const book = core.S.book;
  if (E.spHost?.onInput(e)) return true;
  if (E.spHost?.onChange(e)) return true;
  if (t.matches("[data-dock-scrub]")) {
    ensurePlayer(E);
    E.player.pause();
    E.player.seek(Number(t.value));
    return true;
  }
  if (e.type !== "change") return false;
  if (t.matches("[data-act]")) {
    const a = page.scene.actions.find((x) => x.id === t.dataset.act);
    if (!a) return true;
    const k = t.dataset.k;
    const next = { ...a, params: { ...a.params } };
    if (k.startsWith("p."))
      next.params[k.slice(2)] = t.type === "number" ? Number(t.value) : t.value;
    else if (k === "t" || k === "dur") next[k] = Math.round(Number(t.value) * 1000);
    else next[k] = t.value;
    Object.assign(a, normalizeAction(next), { id: a.id });
    core.commit({ render: false });
    E.player?.destroy();
    E.player = null;
    E.renderDock();
    return true;
  }
  if (t.matches("[data-dock-field]")) {
    const f = t.dataset.dockField;
    if (f === "ending") page.ending = t.value;
    else if (f === "ambience") page.scene.ambience = t.value;
    else if (f === "parallax") page.scene.parallax = t.checked;
    core.commit({ render: false });
    return true;
  }
  if (t.matches("[data-dock-mute]")) return ((E.muted = !t.checked), true);
  if (t.matches("[data-dock-voices]")) return ((E.voices = t.checked), true);
  if (t.matches("[data-dock-aud]")) {
    book.publish = {
      ...book.publish,
      audience: t.value,
      approvedAt:
        t.value === "private" || t.value === "teacher"
          ? book.publish.approvedAt
          : book.publish.approvedAt,
    };
    core.commit({ render: false });
    E.renderDock();
    return true;
  }
  if (t.matches("[data-dock-incsup]")) {
    book.publish = { ...book.publish, includeSupports: t.checked };
    core.commit({ render: false });
    return true;
  }
  if (t.matches("[data-dock-coach]")) {
    book.coach = { enabled: t.checked };
    core.commit({ render: false });
    E.renderDock();
    return true;
  }
  if (t.matches("[data-coach-el]")) return ((E.coach = { el: t.value }), true);
  return false;
}

/** The Director form. */
export function onDirectorSubmit(E, e) {
  const form = e.target.closest("[data-director]");
  if (!form) return false;
  e.preventDefault();
  const tr = E.I.S;
  const { core } = E;
  const page = core.page();
  const input = form.querySelector("[data-dir-text]");
  const out = E.root.querySelector("[data-dir-out]");
  const res = interpretDirection(input.value, { page, characters: core.S.book.characters });
  if (!res.ok) {
    out.innerHTML = `<p class="bk-warn" role="alert">${esc(res.help)}</p>`;
    return true;
  }
  const ops = validateOps(res.ops, page);
  out.innerHTML = `<div class="bk-dir-prop"><p><strong>${esc(tr("Here is what I will do:", "Esto es lo que haré:"))}</strong> ${esc(describeOps(ops, page, core.S.book.characters))}</p><div class="bk-btnrow"><button type="button" class="btn small btn-primary" data-dir-apply>${esc(tr("Add it", "Agregarlo"))}</button><button type="button" class="btn small ghost" data-dir-cancel>${esc(tr("Not that", "Eso no"))}</button></div><p class="fine">${esc(tr("You can change every step in the list below, or press Undo.", "Puedes cambiar cada paso en la lista de abajo o presionar Deshacer."))}</p></div>`;
  out.querySelector("[data-dir-apply]").addEventListener("click", () => {
    applyOps(page, ops);
    core.commit({ render: true });
    E.say(
      tr(
        "Added to the scene. Press Play to watch.",
        "Agregado a la escena. Presiona Reproducir para verlo.",
      ),
    );
    E.renderDock();
  });
  out.querySelector("[data-dir-cancel]").addEventListener("click", () => {
    out.innerHTML = "";
  });
  return true;
}

void characterArt;
void emptyWork;
