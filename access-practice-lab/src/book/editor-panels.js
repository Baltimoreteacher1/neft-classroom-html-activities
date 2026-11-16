// The inspector beside the page: what the selected element looks like and where it sits (exact numbers, so every
// layout task can be done from the keyboard), or, with nothing selected, the page itself: this page's writing prompt
// and sentence starters from the template, the background, the page narration and any teacher notes.
import * as db from "./db.js";
import * as rec from "../recorder.js";
import { addImageFile } from "./editor-add.js";
import { MediaError, checkAudio, mediaDuration, prepareCaptions } from "./editor-media.js";
import { bkIcon } from "./icons.js";
import {
  BUBBLES,
  FONTS,
  FORMATS,
  PALETTE,
  ROLE_DEFAULTS,
  SHAPES,
  TEXT_ROLES,
  pick,
  plainText,
  textToHtml,
} from "./model.js";
import { esc } from "./render.js";
import { sanitizeHtml } from "./sanitize.js";
import { templateById } from "./templates.js";

const PEN_COLORS = [
  "#1b1f3b",
  "#075568",
  "#2e4a94",
  "#8a3a5c",
  "#9a4a26",
  "#1f4a2e",
  "#e86a50",
  "#f2b134",
  "#7fb48a",
  "#ffffff",
];
const PEN_SIZES = [1, 2, 4, 8];
const n1 = (v) => Math.round(v * 10) / 10;

const field = (label, input, cls = "") =>
  `<label class="bk-field ${cls}"><span>${label}</span>${input}</label>`;
const num = (prop, value, { min = -50, max = 200, step = 1 } = {}) =>
  `<input type="number" inputmode="decimal" data-bk-prop="${prop}" value="${n1(value)}" min="${min}" max="${max}" step="${step}" />`;
function swatches(tr, prop, current, list, { none = false } = {}) {
  return `<div class="bk-swatches" role="group">${none ? `<button type="button" class="bk-swatch is-none${current === "none" ? " is-on" : ""}" data-bk-swatch="${prop}" data-value="none" aria-label="${esc(tr("None", "Ninguno"))}" aria-pressed="${current === "none"}"></button>` : ""}${list
    .map(
      (c) =>
        `<button type="button" class="bk-swatch${current === c ? " is-on" : ""}" style="--sw:${c}" data-bk-swatch="${prop}" data-value="${c}" aria-label="${c}" aria-pressed="${current === c}"></button>`,
    )
    .join(
      "",
    )}<input type="color" class="bk-color" data-bk-color="${prop}" value="${/^#[0-9a-f]{6}$/i.test(current) ? current : "#1b1f3b"}" aria-label="${esc(tr("Other colour", "Otro color"))}" /></div>`;
}

function section(title, body, open = true) {
  return `<details class="bk-sec" ${open ? "open" : ""}><summary>${title}</summary><div class="bk-sec-body">${body}</div></details>`;
}

function geometryHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Position and size", "Posición y tamaño")),
    `<div class="bk-grid4">${field("X", num("x", el.x))}${field("Y", num("y", el.y))}${field(esc(tr("Width", "Ancho")), num("w", el.w, { min: 1 }))}${field(esc(tr("Height", "Alto")), num("h", el.h, { min: 1 }))}</div>
    ${field(esc(tr("Rotation (degrees)", "Rotación (grados)")), num("rot", el.rot, { min: -180, max: 180, step: 5 }))}
    <div class="bk-btnrow" role="group" aria-label="${esc(tr("Align on page", "Alinear en la página"))}">
      <button type="button" class="bk-tbtn" data-bk-align="left" aria-label="${esc(tr("Align left", "Alinear a la izquierda"))}">⇤</button>
      <button type="button" class="bk-tbtn" data-bk-align="hcenter" aria-label="${esc(tr("Centre across", "Centrar horizontal"))}">↔</button>
      <button type="button" class="bk-tbtn" data-bk-align="right" aria-label="${esc(tr("Align right", "Alinear a la derecha"))}">⇥</button>
      <button type="button" class="bk-tbtn" data-bk-align="top" aria-label="${esc(tr("Align top", "Alinear arriba"))}">⤒</button>
      <button type="button" class="bk-tbtn" data-bk-align="vcenter" aria-label="${esc(tr("Centre down", "Centrar vertical"))}">↕</button>
      <button type="button" class="bk-tbtn" data-bk-align="bottom" aria-label="${esc(tr("Align bottom", "Alinear abajo"))}">⤓</button>
    </div>
    <div class="bk-btnrow" role="group" aria-label="${esc(tr("Layer", "Capa"))}">
      <button type="button" class="btn small" data-bk-layer="front">${bkIcon("front")} ${esc(tr("To front", "Al frente"))}</button>
      <button type="button" class="btn small" data-bk-layer="forward">${esc(tr("Forward", "Adelante"))}</button>
      <button type="button" class="btn small" data-bk-layer="backward">${esc(tr("Backward", "Atrás"))}</button>
      <button type="button" class="btn small" data-bk-layer="back">${bkIcon("back")} ${esc(tr("To back", "Al fondo"))}</button>
    </div>
    <p class="fine">${esc(tr("Keyboard: arrow keys move (Shift = bigger steps), Alt + arrows resize, [ and ] change the layer.", "Teclado: las flechas mueven (Mayús = pasos más grandes), Alt + flechas cambian el tamaño, [ y ] cambian la capa."))}</p>`,
    false,
  );
}

function textHTML(E, el) {
  const tr = E.I.S;
  const s = el.style || {};
  const d = ROLE_DEFAULTS[el.role] || ROLE_DEFAULTS.body;
  const lang = E.ctx.prefs?.lang === "es" ? "es" : "en";
  const fmt = (cmd, ico, en, es, val = "") =>
    `<button type="button" class="bk-tbtn" data-fmt="${cmd}" ${val ? `data-val="${val}"` : ""} aria-label="${esc(tr(en, es))}" title="${esc(tr(en, es))}">${bkIcon(ico)}</button>`;
  return section(
    esc(tr("Text", "Texto")),
    `${el.type === "text" ? field(esc(tr("Kind of text", "Tipo de texto")), `<select data-bk-prop="role">${TEXT_ROLES.map((r) => `<option value="${r}" ${el.role === r ? "selected" : ""}>${esc({ title: tr("Title", "Título"), heading: tr("Heading", "Encabezado"), body: tr("Paragraph", "Párrafo"), caption: tr("Caption", "Pie de foto") }[r])}</option>`).join("")}</select>`) : ""}
    <div class="bk-btnrow bk-fmtbar" role="toolbar" aria-label="${esc(tr("Format text", "Formato del texto"))}">
      ${fmt("bold", "bold", "Bold (Ctrl+B)", "Negrita (Ctrl+B)")}${fmt("italic", "italic", "Italic (Ctrl+I)", "Cursiva (Ctrl+I)")}${fmt("underline", "underline", "Underline (Ctrl+U)", "Subrayado (Ctrl+U)")}
      ${fmt("insertUnorderedList", "list", "Bulleted list", "Lista con viñetas")}${fmt("insertOrderedList", "olist", "Numbered list", "Lista numerada")}${fmt("createLink", "link", "Link", "Enlace")}
    </div>
    <div class="bk-link-row" data-bk-linkrow hidden>${field(esc(tr("Link address (https://…)", "Dirección del enlace (https://…)")), '<input type="url" data-bk-linkurl placeholder="https://" />')}<button type="button" class="btn small" data-bk-linkapply>${esc(tr("Add link", "Agregar enlace"))}</button></div>
    <div class="bk-btnrow" role="group" aria-label="${esc(tr("Alignment", "Alineación"))}">
      ${["left", "center", "right"].map((a) => `<button type="button" class="bk-tbtn" data-bk-style="align" data-value="${a}" aria-pressed="${(s.align || "left") === a}" aria-label="${esc({ left: tr("Align left", "Izquierda"), center: tr("Centre", "Centro"), right: tr("Align right", "Derecha") }[a])}">${bkIcon({ left: "alignLeft", center: "alignCenter", right: "alignRight" }[a])}</button>`).join("")}
    </div>
    <div class="bk-grid2">
      ${field(
        esc(tr("Font", "Letra")),
        `<select data-bk-style-sel="font">${Object.entries(FONTS)
          .map(
            ([k, f]) =>
              `<option value="${k}" ${(s.font || d.font) === k ? "selected" : ""}>${esc(f[lang])}</option>`,
          )
          .join("")}</select>`,
      )}
      ${field(esc(tr("Size", "Tamaño")), `<input type="number" data-bk-style-num="size" value="${s.size ?? d.size}" min="1" max="20" step="0.2" />`)}
      ${field(esc(tr("Line spacing", "Interlineado")), `<input type="number" data-bk-style-num="lineHeight" value="${s.lineHeight ?? d.lineHeight}" min="0.9" max="2.5" step="0.05" />`)}
      ${el.type === "text" ? field(esc(tr("Columns", "Columnas")), `<select data-bk-style-sel="columns">${[1, 2, 3].map((c) => `<option value="${c}" ${(s.columns || 1) === c ? "selected" : ""}>${c}</option>`).join("")}</select>`) : ""}
      ${field(esc(tr("Direction", "Dirección")), `<select data-bk-style-sel="dir"><option value="">${esc(tr("Automatic", "Automática"))}</option><option value="ltr" ${s.dir === "ltr" ? "selected" : ""}>${esc(tr("Left to right", "Izquierda a derecha"))}</option><option value="rtl" ${s.dir === "rtl" ? "selected" : ""}>${esc(tr("Right to left", "Derecha a izquierda"))}</option></select>`)}
      ${field(esc(tr("Language of this text", "Idioma de este texto")), `<input type="text" data-bk-style-lang value="${esc(s.lang || "")}" maxlength="8" placeholder="en, es, ar…" />`)}
    </div>
    <p class="bk-label">${esc(tr("Text colour", "Color del texto"))}</p>${swatches(tr, "text-color", s.color || "#1b1f3b", PALETTE.ink)}
    ${el.type === "text" ? `<p class="bk-label">${esc(tr("Highlight behind the text", "Resaltado detrás del texto"))}</p>${swatches(tr, "text-bg", s.bg || "none", PALETTE.fill.slice(0, 8), { none: true })}` : ""}
    <p class="fine">${esc(tr("Select words while typing to colour or format only those words.", "Selecciona palabras mientras escribes para dar color o formato solo a esas palabras."))}</p>`,
  );
}

function bubbleHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Bubble", "Globo")),
    `${field(esc(tr("Style", "Estilo")), `<select data-bk-prop="variant">${BUBBLES.map((v) => `<option value="${v}" ${el.variant === v ? "selected" : ""}>${esc({ speech: tr("Speech", "Diálogo"), thought: tr("Thought", "Pensamiento"), shout: tr("Shout", "Grito"), caption: tr("Caption", "Narración") }[v])}</option>`).join("")}</select>`)}
    ${field(esc(tr("Tail points", "La cola apunta")), `<select data-bk-prop="tail">${["bottom-left", "bottom-right", "top-left", "top-right", "none"].map((t) => `<option value="${t}" ${el.tail === t ? "selected" : ""}>${esc({ "bottom-left": tr("Down, left", "Abajo, izquierda"), "bottom-right": tr("Down, right", "Abajo, derecha"), "top-left": tr("Up, left", "Arriba, izquierda"), "top-right": tr("Up, right", "Arriba, derecha"), none: tr("No tail", "Sin cola") }[t])}</option>`).join("")}</select>`)}
    <p class="bk-label">${esc(tr("Fill", "Relleno"))}</p>${swatches(tr, "fill", el.fill, PALETTE.fill.slice(0, 8))}`,
  );
}

function imageHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Picture", "Imagen")),
    `<p><button type="button" class="btn small" data-bk-act2="replace-image">${bkIcon("upload")} ${el.media ? esc(tr("Replace picture", "Cambiar imagen")) : esc(tr("Upload a picture", "Subir una imagen"))}</button></p>
    ${field(`${esc(tr("Description (for readers who cannot see it)", "Descripción (para quienes no pueden verla)"))}${el.alt ? "" : ` <strong class="bk-need">${esc(tr("needed", "falta"))}</strong>`}`, `<textarea rows="2" data-bk-prop="alt" maxlength="300">${esc(el.alt)}</textarea>`)}
    ${field(esc(tr("Caption under the picture (optional)", "Pie de foto (opcional)")), `<input type="text" data-bk-prop="caption" maxlength="300" value="${esc(el.caption)}" />`)}
    ${field(esc(tr("Fit", "Ajuste")), `<select data-bk-prop="fit"><option value="cover" ${el.fit === "cover" ? "selected" : ""}>${esc(tr("Fill the box (crop edges)", "Llenar el cuadro (recortar bordes)"))}</option><option value="contain" ${el.fit === "contain" ? "selected" : ""}>${esc(tr("Show the whole picture", "Mostrar toda la imagen"))}</option></select>`)}
    ${
      el.media && el.fit === "cover"
        ? `<p class="bk-label">${esc(tr("Crop", "Recorte"))}</p>${field(esc(tr("Zoom", "Zoom")), `<input type="range" min="1" max="3" step="0.05" data-bk-crop="zoom" value="${el.crop?.zoom ?? 1}" />`)}${field(esc(tr("Left ↔ right", "Izquierda ↔ derecha")), `<input type="range" min="0" max="100" data-bk-crop="x" value="${el.crop?.x ?? 50}" />`)}${field(esc(tr("Up ↕ down", "Arriba ↕ abajo")), `<input type="range" min="0" max="100" data-bk-crop="y" value="${el.crop?.y ?? 50}" />`)}`
        : ""
    }`,
  );
}

function artHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Illustration", "Ilustración")),
    `${field(esc(tr("Description", "Descripción")), `<textarea rows="2" data-bk-prop="alt" maxlength="300">${esc(el.alt)}</textarea>`)}
    <div class="bk-btnrow"><button type="button" class="btn small" data-bk-act2="flip">${bkIcon("flip")} ${esc(tr("Flip", "Voltear"))}</button><button type="button" class="btn small" data-bk-add="art">${esc(tr("Add another", "Agregar otra"))}</button></div>`,
  );
}

function shapeHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Shape", "Forma")),
    `${field(esc(tr("Shape", "Forma")), `<select data-bk-prop="shape">${SHAPES.map((s) => `<option value="${s}" ${el.shape === s ? "selected" : ""}>${s}</option>`).join("")}</select>`)}
    <p class="bk-label">${esc(tr("Fill", "Relleno"))}</p>${swatches(tr, "fill", el.fill, PALETTE.fill, { none: true })}
    <p class="bk-label">${esc(tr("Outline", "Contorno"))}</p>${swatches(tr, "stroke", el.stroke, PALETTE.ink.concat(["#f2b134", "#e86a50"]), { none: true })}
    ${field(esc(tr("Outline width", "Grosor del contorno")), `<input type="range" min="0" max="3" step="0.1" data-bk-prop-range="strokeW" value="${el.strokeW}" />`)}`,
  );
}

function panelHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Comic panel", "Viñeta")),
    `<p class="bk-label">${esc(tr("Background", "Fondo"))}</p>${swatches(tr, "fill", el.fill, PALETTE.fill)}
    <p class="bk-label">${esc(tr("Border", "Borde"))}</p>${swatches(tr, "stroke", el.stroke, PALETTE.ink)}
    ${field(esc(tr("Border width", "Grosor del borde")), `<input type="range" min="0" max="3" step="0.1" data-bk-prop-range="strokeW" value="${el.strokeW}" />`)}
    ${field(esc(tr("Corner roundness", "Esquinas redondeadas")), `<input type="range" min="0" max="8" step="0.5" data-bk-prop-range="radius" value="${el.radius}" />`)}`,
  );
}

function recorderHTML(E, target, media, seconds) {
  const tr = E.I.S;
  const recording = E.recording?.target === target;
  const can = rec.canRecord();
  return `<div class="bk-rec" data-bk-rec-box="${target}">
    ${recording ? `<p class="bk-rec-live" role="status"><span class="bk-rec-dot" aria-hidden="true"></span>${esc(tr("Recording…", "Grabando…"))} <span data-bk-rec-time>0:00</span> <span class="bk-meter" aria-hidden="true"><i data-bk-rec-level></i></span></p><button type="button" class="btn btn-primary small" data-bk-rec="stop" data-target="${target}">${bkIcon("stop")} ${esc(tr("Stop", "Detener"))}</button>` : `<div class="bk-btnrow">${can ? `<button type="button" class="btn small ${media ? "" : "btn-primary"}" data-bk-rec="start" data-target="${target}">${bkIcon("mic")} ${media ? esc(tr("Record again", "Grabar otra vez")) : esc(tr("Record", "Grabar"))}</button>` : ""}${media ? `<button type="button" class="btn small" data-bk-rec="play" data-media="${media}">${bkIcon("play")} ${esc(tr("Play", "Reproducir"))}${seconds ? ` (${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")})` : ""}</button><button type="button" class="btn small ghost" data-bk-rec="remove" data-target="${target}">${esc(tr("Remove", "Quitar"))}</button>` : ""}<button type="button" class="btn small ghost" data-bk-rec="upload" data-target="${target}">${bkIcon("upload")} ${esc(tr("Upload audio", "Subir audio"))}</button></div>`}
    ${!can ? `<p class="fine">${esc(tr("This browser cannot record. Upload an audio file or type the words instead.", "Este navegador no puede grabar. Sube un archivo de audio o escribe las palabras."))}</p>` : ""}
    ${E.recError === target ? `<p class="bk-error" role="alert">${esc(tr("The microphone is blocked. Allow the microphone in your browser's site settings and try again, or upload an audio file. You can also type the words in the transcript.", "El micrófono está bloqueado. Permite el micrófono en la configuración del sitio de tu navegador e inténtalo de nuevo, o sube un archivo de audio. También puedes escribir las palabras en la transcripción."))}</p>` : ""}
  </div>`;
}

function audioHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Recording", "Grabación")),
    `${recorderHTML(E, `el:${el.id}`, el.media, el.seconds)}
    ${field(esc(tr("Button label", "Texto del botón")), `<input type="text" data-bk-prop="label" maxlength="120" value="${esc(el.label)}" />`)}
    ${field(`${esc(tr("Transcript: the words you say", "Transcripción: las palabras que dices"))}${el.media && !el.transcript ? ` <strong class="bk-need">${esc(tr("needed", "falta"))}</strong>` : ""}`, `<textarea rows="3" data-bk-prop="transcript" maxlength="6000">${esc(el.transcript)}</textarea>`)}`,
  );
}

function videoHTML(E, el) {
  const tr = E.I.S;
  return section(
    esc(tr("Video", "Video")),
    `${field(esc(tr("Title", "Título")), `<input type="text" data-bk-prop="title" maxlength="200" value="${esc(el.title)}" />`)}
    ${el.embed ? `<p class="fine">${esc(tr("YouTube video. It plays when the book is read online.", "Video de YouTube. Se reproduce cuando se lee el libro en línea."))}</p>` : `<div class="bk-btnrow"><button type="button" class="btn small" data-bk-add="video-file">${bkIcon("upload")} ${esc(tr("Replace video", "Cambiar video"))}</button><button type="button" class="btn small" data-bk-act2="captions">${esc(el.captions ? tr("Replace captions", "Cambiar subtítulos") : tr("Add captions (.vtt or .srt)", "Agregar subtítulos (.vtt o .srt)"))}</button></div>${el.media && !el.captions ? `<p class="fine">${esc(tr("Captions help everyone follow the video. Add a captions file, or write what is said in a text box on this page.", "Los subtítulos ayudan a todos a seguir el video. Agrega un archivo de subtítulos o escribe lo que se dice en un cuadro de texto en esta página."))}</p>` : ""}`}`,
  );
}

function drawingToolsHTML(E) {
  const tr = E.I.S;
  const t = E.drawing.tool;
  return `<div class="bk-sec-body bk-draw-tools">
    <h2 class="bk-panel-title">${esc(tr("Drawing", "Dibujo"))}</h2>
    <p class="fine">${esc(tr("Draw on the page with a finger, stylus or mouse. Every line can be undone.", "Dibuja en la página con el dedo, un lápiz o el ratón. Cada línea se puede deshacer."))}</p>
    <div class="bk-btnrow" role="group" aria-label="${esc(tr("Tool", "Herramienta"))}"><button type="button" class="btn small" data-bk-pen="pen" aria-pressed="${!t.erase}">${bkIcon("draw")} ${esc(tr("Pen", "Lápiz"))}</button><button type="button" class="btn small" data-bk-pen="eraser" aria-pressed="${t.erase}">${bkIcon("eraser")} ${esc(tr("Eraser", "Borrador"))}</button></div>
    <p class="bk-label">${esc(tr("Colour", "Color"))}</p><div class="bk-swatches" role="group">${PEN_COLORS.map((c) => `<button type="button" class="bk-swatch${t.color === c ? " is-on" : ""}" style="--sw:${c}" data-bk-pencolor="${c}" aria-label="${c}" aria-pressed="${t.color === c}"></button>`).join("")}</div>
    <p class="bk-label">${esc(tr("Size", "Tamaño"))}</p><div class="bk-btnrow" role="group">${PEN_SIZES.map((s) => `<button type="button" class="bk-tbtn bk-pensize" data-bk-pensize="${s}" aria-pressed="${t.size === s}" aria-label="${esc(tr(`Size ${s}`, `Tamaño ${s}`))}"><i style="--d:${4 + s * 2}px"></i></button>`).join("")}</div>
    <p class="fine">${esc(tr("No mouse or touch? Shapes, illustrations and text make the same kinds of pictures from the keyboard.", "¿Sin ratón ni pantalla táctil? Las formas, ilustraciones y textos hacen los mismos dibujos desde el teclado."))}</p>
    <button type="button" class="btn btn-primary" data-bk-add="draw">${bkIcon("check")} ${esc(tr("Done drawing", "Terminar de dibujar"))}</button>
  </div>`;
}

function pagePanelHTML(E) {
  const tr = E.I.S;
  const { S } = E.core;
  const page = E.core.page();
  const lang = E.ctx.prefs?.lang === "es" ? "es" : "en";
  const tpl = templateById(S.book.templateId);
  const notes = S.book.feedback.filter((f) => f.pageId === page.id);
  const prompt = page.prompt ? pick(page.prompt, lang) : "";
  const parts = [];
  if (notes.length)
    parts.push(
      section(
        `${bkIcon("feedback")} ${esc(tr("Teacher notes on this page", "Notas del docente en esta página"))}`,
        `<ul class="bk-notes">${notes.map((f) => `<li class="${f.done ? "is-done" : ""}"><p>${esc(f.text)}</p><p class="fine">${esc(f.by || tr("Teacher", "Docente"))}</p><button type="button" class="btn small" data-bk-note-done="${f.id}" aria-pressed="${f.done}">${f.done ? esc(tr("Done", "Hecho")) : esc(tr("I revised this", "Ya lo revisé"))}</button></li>`).join("")}</ul>`,
      ),
    );
  if (prompt || page.frames?.length || tpl)
    parts.push(
      section(
        `${bkIcon("feedback")} ${esc(tr("What to do on this page", "Qué hacer en esta página"))}`,
        `${prompt ? `<p class="bk-prompt">${esc(prompt)}</p>` : ""}
        ${page.frames?.length ? `<p class="bk-label">${esc(tr("Sentence starters (optional)", "Inicios de oración (opcional)"))}</p><ul class="bk-frames">${(page.frames || []).map((f, i) => `<li><button type="button" class="bk-frame" data-bk-frame="${i}">${esc(pick(f, lang))}</button></li>`).join("")}</ul><p class="fine">${esc(tr("Press a starter to put it on the page, then finish the sentence in your own words.", "Presiona un inicio para ponerlo en la página y termina la oración con tus propias palabras."))}</p>` : ""}
        ${tpl?.wordBank?.length ? `<p class="bk-label">${esc(tr("Word bank", "Banco de palabras"))}</p><ul class="bk-words">${tpl.wordBank.map((w) => `<li><button type="button" class="chip" data-bk-word="${esc(w.en)}" title="${esc(w.es)}">${esc(w.en)}</button></li>`).join("")}</ul>` : ""}
        ${tpl?.example ? `<details class="bk-example"><summary>${esc(tr("See an example", "Ver un ejemplo"))}</summary><p>${esc(pick(tpl.example, lang))}</p><p class="fine">${esc(tr("An example shows the kind of writing. Your book uses your own ideas.", "Un ejemplo muestra el tipo de escritura. Tu libro usa tus propias ideas."))}</p></details>` : ""}`,
      ),
    );
  parts.push(
    section(
      esc(tr("Page", "Página")),
      `<p class="bk-label">${esc(tr("Background colour", "Color de fondo"))}</p>${swatches(tr, "page-bg", page.bg, PALETTE.fill)}
      <div class="bk-btnrow"><button type="button" class="btn small" data-bk-add="bg-art">${bkIcon("image")} ${esc(tr("Background picture", "Imagen de fondo"))}</button>${page.bgArt ? `<button type="button" class="btn small ghost" data-bk-act2="clear-bg">${esc(tr("Remove background picture", "Quitar imagen de fondo"))}</button>` : ""}</div>
      <p class="bk-label">${esc(tr("Read this page aloud (narration)", "Leer esta página en voz alta (narración)"))}</p>${recorderHTML(E, "page", page.narration, 0)}`,
      !prompt,
    ),
  );
  parts.push(
    section(
      esc(tr("Book settings", "Ajustes del libro")),
      `${field(
        esc(tr("Page shape", "Forma de la página")),
        `<select data-bk-book="format">${Object.entries(FORMATS)
          .map(
            ([k, f]) =>
              `<option value="${k}" ${S.book.format === k ? "selected" : ""}>${esc(f[lang])}</option>`,
          )
          .join("")}</select>`,
      )}
      ${field(esc(tr("Reading direction", "Dirección de lectura")), `<select data-bk-book="dir"><option value="ltr" ${S.book.dir === "ltr" ? "selected" : ""}>${esc(tr("Left to right (English, Spanish)", "Izquierda a derecha (inglés, español)"))}</option><option value="rtl" ${S.book.dir === "rtl" ? "selected" : ""}>${esc(tr("Right to left (Arabic, Hebrew, Urdu…)", "Derecha a izquierda (árabe, hebreo, urdu…)"))}</option></select>`)}
      ${field(esc(tr("Author name on the cover", "Nombre del autor en la portada")), `<input type="text" data-bk-book="author" maxlength="60" value="${esc(S.book.author)}" />`)}
      <p class="fine">${esc(tr("Books are saved in this browser on this device. Use Share & export to keep a copy or move it to another device.", "Los libros se guardan en este navegador en este dispositivo. Usa Compartir y exportar para guardar una copia o pasarlo a otro dispositivo."))}</p>`,
      false,
    ),
  );
  return parts.join("");
}

export function inspectorHTML(E) {
  const tr = E.I.S;
  if (E.drawing) return drawingToolsHTML(E);
  const el = E.core.selectedEl();
  if (!el)
    return `<h2 class="bk-panel-title">${E.core.S.pageIndex === 0 ? esc(tr("Cover", "Portada")) : esc(tr(`Page ${E.core.S.pageIndex + 1}`, `Página ${E.core.S.pageIndex + 1}`))}</h2>${pagePanelHTML(E)}`;
  const name = {
    text: tr("Text box", "Cuadro de texto"),
    bubble: tr("Bubble", "Globo"),
    image: tr("Picture", "Imagen"),
    art: tr("Illustration", "Ilustración"),
    shape: tr("Shape", "Forma"),
    panel: tr("Comic panel", "Viñeta"),
    audio: tr("Recording", "Grabación"),
    video: tr("Video", "Video"),
    drawing: tr("Drawing", "Dibujo"),
  }[el.type];
  const body = {
    text: textHTML,
    bubble: (E2, x) => textHTML(E2, x) + bubbleHTML(E2, x),
    image: imageHTML,
    art: artHTML,
    shape: shapeHTML,
    panel: panelHTML,
    audio: audioHTML,
    video: videoHTML,
    drawing: () =>
      section(
        esc(tr("Drawing", "Dibujo")),
        `<p class="fine">${esc(tr("Use Draw to add more lines.", "Usa Dibujar para agregar más líneas."))}</p><button type="button" class="btn small" data-bk-add="draw">${bkIcon("draw")} ${esc(tr("Draw", "Dibujar"))}</button>`,
      ),
  }[el.type](E, el);
  return `<div class="bk-insp-head"><h2 class="bk-panel-title">${esc(name)}</h2>
    <div class="bk-btnrow">
      ${el.type === "text" || el.type === "bubble" ? `<button type="button" class="btn small" data-bk-act2="edit-text">${bkIcon("text")} ${esc(tr("Edit words", "Editar palabras"))}</button>` : ""}
      <button type="button" class="bk-tbtn" data-bk-act2="duplicate" aria-label="${esc(tr("Duplicate (Ctrl+D)", "Duplicar (Ctrl+D)"))}" title="${esc(tr("Duplicate", "Duplicar"))}">${bkIcon("copy")}</button>
      <button type="button" class="bk-tbtn" data-bk-act2="lock" aria-pressed="${!!el.locked}" aria-label="${esc(tr("Lock in place", "Fijar en su lugar"))}" title="${esc(tr("Lock in place", "Fijar en su lugar"))}">${bkIcon("lock")}</button>
      <button type="button" class="bk-tbtn" data-bk-act2="delete" aria-label="${esc(tr("Delete (Delete key)", "Eliminar (tecla Supr)"))}" title="${esc(tr("Delete", "Eliminar"))}">${bkIcon("trash")}</button>
      <button type="button" class="bk-tbtn" data-bk-act2="deselect" aria-label="${esc(tr("Back to page settings", "Volver a los ajustes de la página"))}" title="${esc(tr("Done", "Listo"))}">${bkIcon("close")}</button>
    </div></div>${body}${geometryHTML(E, el)}`;
}

// ── recording ────────────────────────────────────────────────────────────────

async function startRecording(E, target) {
  const tr = E.I.S;
  E.recError = null;
  try {
    E.recording = { target };
    E.renderInspector();
    const started = await rec.start(`book:${target}`, {
      maxSeconds: 300,
      onLevel: (level, secs) => {
        const lvl = E.root.querySelector("[data-bk-rec-level]");
        const time = E.root.querySelector("[data-bk-rec-time]");
        if (lvl) lvl.style.width = `${Math.round(level * 100)}%`;
        if (time)
          time.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      },
      onStop: async (takes) => {
        const take = takes.at(-1);
        E.recording = null;
        if (!take?.blob) return E.renderInspector();
        const id = await db.putMedia(E.core.S.book.id, take.blob, {
          name: `recording.${take.extension}`,
          kind: "audio",
        });
        await db.mediaUrl(id);
        applyAudio(E, target, id, take.seconds);
        E.say(
          tr(
            "Recording saved to your book. Press Play to listen.",
            "Grabación guardada en tu libro. Presiona Reproducir para escuchar.",
          ),
        );
      },
    });
    if (!started) {
      E.recording = null;
      E.renderInspector();
    } else E.root.querySelector('[data-bk-rec="stop"]')?.focus({ preventScroll: true });
  } catch {
    E.recording = null;
    E.recError = target;
    E.renderInspector();
    E.say(tr("The microphone is blocked.", "El micrófono está bloqueado."));
  }
}

function applyAudio(E, target, id, seconds) {
  if (target === "page") {
    E.core.page().narration = id;
    E.core.commit();
  } else {
    const elId = target.slice(3);
    E.core.update(elId, { media: id, seconds });
  }
  E.renderAll();
}

let player = null;
function playMedia(E, id) {
  const url = db.cachedUrl(id);
  if (!url) return;
  if (player) {
    player.pause();
    if (player.dataset.id === id) {
      player = null;
      return;
    }
  }
  player = new Audio(url);
  player.dataset.id = id;
  player
    .play()
    .catch(() =>
      E.say(E.I.S("This recording could not play.", "Esta grabación no se pudo reproducir.")),
    );
  player.onended = () => {
    player = null;
  };
}

// ── events ───────────────────────────────────────────────────────────────────

function applyFormat(E, cmd, val) {
  const el = E.core.selectedEl();
  if (!el) return;
  if (E.core.S.editingText !== el.id) {
    E.beginTextEdit(el.id);
    const node = E.root.querySelector(`[data-text-of="${el.id}"]`);
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  document.execCommand(cmd, false, val || null);
  E.flushTyping();
  E.core.commit({ render: false });
}

// Keep focus (and the selection) in the text while a format button is pressed.
document.addEventListener("pointerdown", (e) => {
  if (
    e.target.closest?.("[data-fmt], .bk-fmtbar, [data-bk-swatch='text-color']") &&
    document.activeElement?.closest?.("[data-text-of]")
  )
    e.preventDefault();
});

export function onInspectorClick(E, e) {
  const t = e.target;
  const { core } = E;
  const tr = E.I.S;
  const el = core.selectedEl();
  const fmt = t.closest("[data-fmt]");
  if (fmt) {
    if (fmt.dataset.fmt === "createLink") {
      const row = E.root.querySelector("[data-bk-linkrow]");
      E.savedRange = window.getSelection().rangeCount
        ? window.getSelection().getRangeAt(0).cloneRange()
        : null;
      row.hidden = false;
      row.querySelector("input").focus({ preventScroll: true });
      return true;
    }
    applyFormat(E, fmt.dataset.fmt, fmt.dataset.val);
    return true;
  }
  if (t.closest("[data-bk-linkapply]")) {
    const url = E.root.querySelector("[data-bk-linkurl]").value.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      E.say(tr("Links must start with https://", "Los enlaces deben empezar con https://"));
      return true;
    }
    E.beginTextEdit(el.id);
    if (E.savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(E.savedRange);
    }
    document.execCommand("createLink", false, url);
    E.flushTyping();
    core.commit();
    return true;
  }
  const sw = t.closest("[data-bk-swatch]");
  if (sw) {
    const prop = sw.dataset.bkSwatch;
    const v = sw.dataset.value;
    applySwatch(E, prop, v);
    return true;
  }
  const st = t.closest("[data-bk-style]");
  if (st && el) {
    core.update(el.id, { style: { [st.dataset.bkStyle]: st.dataset.value } });
    return true;
  }
  const align = t.closest("[data-bk-align]");
  if (align && el) return (core.align(el.id, align.dataset.bkAlign), true);
  const layer = t.closest("[data-bk-layer]");
  if (layer && el) {
    core.layer(el.id, layer.dataset.bkLayer);
    E.say(tr("Layer changed.", "Capa cambiada."));
    return true;
  }
  const frame = t.closest("[data-bk-frame]");
  if (frame) {
    const page = core.page();
    const text = pick(
      page.frames[Number(frame.dataset.bkFrame)],
      E.ctx.prefs?.lang === "es" ? "es" : "en",
    ).replace(/_{2,}/g, "…");
    insertWords(E, text);
    return true;
  }
  const word = t.closest("[data-bk-word]");
  if (word) {
    insertWords(E, word.dataset.bkWord);
    return true;
  }
  const noteDone = t.closest("[data-bk-note-done]");
  if (noteDone) {
    const f = core.S.book.feedback.find((x) => x.id === noteDone.dataset.bkNoteDone);
    if (f) f.done = !f.done;
    core.commit();
    return true;
  }
  const pen = t.closest("[data-bk-pen]");
  if (pen && E.drawing) {
    E.drawing.tool.erase = pen.dataset.bkPen === "eraser";
    E.renderInspector();
    return true;
  }
  const penColor = t.closest("[data-bk-pencolor]");
  if (penColor && E.drawing) {
    E.drawing.tool = { ...E.drawing.tool, color: penColor.dataset.bkPencolor, erase: false };
    E.renderInspector();
    return true;
  }
  const penSize = t.closest("[data-bk-pensize]");
  if (penSize && E.drawing) {
    E.drawing.tool.size = Number(penSize.dataset.bkPensize);
    E.renderInspector();
    return true;
  }
  const r = t.closest("[data-bk-rec]");
  if (r) {
    const what = r.dataset.bkRec;
    const target = r.dataset.target;
    if (what === "start") startRecording(E, target);
    else if (what === "stop") rec.stop();
    else if (what === "play") playMedia(E, r.dataset.media);
    else if (what === "remove") applyAudio(E, target, "", 0);
    else if (what === "upload")
      E.pickFile("audio/*").then(async (f) => {
        if (!f) return;
        try {
          checkAudio(f);
          const id = await db.putMedia(core.S.book.id, f, { name: f.name, kind: "audio" });
          await db.mediaUrl(id);
          applyAudio(E, target, id, await mediaDuration(f));
        } catch (error) {
          E.say(
            error instanceof MediaError
              ? tr(error.en, error.es)
              : tr(
                  "That audio file could not be added.",
                  "No se pudo agregar ese archivo de audio.",
                ),
          );
        }
      });
    return true;
  }
  const a2 = t.closest("[data-bk-act2]")?.dataset.bkAct2;
  if (!a2) return false;
  if (a2 === "deselect") E.select(null, { focus: false });
  else if (a2 === "edit-text" && el) E.beginTextEdit(el.id);
  else if (a2 === "duplicate") core.duplicate() && E.select(core.S.selected);
  else if (a2 === "delete") {
    core.remove();
    E.say(tr("Deleted. Undo brings it back.", "Eliminado. Deshacer lo recupera."));
  } else if (a2 === "lock" && el) core.update(el.id, { locked: !el.locked });
  else if (a2 === "flip" && el) core.update(el.id, { flip: !el.flip });
  else if (a2 === "clear-bg") {
    core.page().bgArt = "";
    core.commit();
  } else if (a2 === "replace-image")
    E.pickFile("image/png,image/jpeg,image/webp,image/gif").then((f) => f && addImageFile(E, f));
  else if (a2 === "captions" && el)
    E.pickFile(".vtt,.srt,text/vtt").then(async (f) => {
      if (!f) return;
      try {
        const blob = await prepareCaptions(f);
        const id = await db.putMedia(core.S.book.id, blob, { name: f.name, kind: "captions" });
        await db.mediaUrl(id);
        core.update(el.id, { captions: id });
        E.say(tr("Captions added.", "Subtítulos agregados."));
      } catch (error) {
        E.say(
          error instanceof MediaError
            ? tr(error.en, error.es)
            : tr("Those captions could not be added.", "No se pudieron agregar esos subtítulos."),
        );
      }
    });
  return true;
}

function insertWords(E, text) {
  const { core } = E;
  const el = core.selectedEl();
  if (el && (el.type === "text" || el.type === "bubble")) {
    if (core.S.editingText === el.id) document.execCommand("insertText", false, `${text} `);
    else {
      const current = plainText(el.html);
      core.update(el.id, { html: textToHtml(current ? `${current} ${text}` : text) });
      E.beginTextEdit(el.id);
    }
    E.flushTyping();
    core.commit({ render: false });
    return;
  }
  // No text box selected: start a new one under the existing content.
  const bottom = Math.max(
    6,
    ...core
      .page()
      .elements.filter((x) => x.type === "text")
      .map((x) => x.y + x.h + 2),
  );
  const created = core.add("text", {
    x: 8,
    y: Math.min(bottom, 80),
    w: 84,
    h: 16,
    html: textToHtml(text),
  });
  E.renderAll();
  E.beginTextEdit(created.id);
}

function applySwatch(E, prop, v) {
  const { core } = E;
  const el = core.selectedEl();
  if (prop === "page-bg") {
    core.page().bg = v;
    core.commit();
    return;
  }
  if (!el) return;
  if (prop === "text-color") {
    const sel = window.getSelection();
    if (core.S.editingText === el.id && sel.rangeCount && !sel.isCollapsed) {
      document.execCommand("styleWithCSS", false, false);
      document.execCommand("foreColor", false, v);
      E.flushTyping();
      core.commit({ render: false });
    } else core.update(el.id, { style: { color: v } });
    return;
  }
  if (prop === "text-bg") return core.update(el.id, { style: { bg: v === "none" ? "" : v } });
  core.update(el.id, { [prop]: v });
}

export function onInspectorInput(E, e) {
  const t = e.target;
  const { core } = E;
  const el = core.selectedEl();
  if (t.matches("[data-bk-crop]") && el) {
    const crop = {
      x: el.crop?.x ?? 50,
      y: el.crop?.y ?? 50,
      zoom: el.crop?.zoom ?? 1,
      [t.dataset.bkCrop]: Number(t.value),
    };
    el.crop = crop;
    E.renderCanvas();
    clearTimeout(E.cropTimer);
    E.cropTimer = setTimeout(() => core.commit({ render: false }), 400);
    return;
  }
  if (t.matches("[data-bk-prop-range]") && el) {
    el[t.dataset.bkPropRange] = Number(t.value);
    E.renderCanvas();
    clearTimeout(E.rangeTimer);
    E.rangeTimer = setTimeout(() => core.commit({ render: false }), 400);
    return;
  }
  // Text fields (alt, caption, transcript, label) save as you type without re-rendering the inspector.
  if (t.matches("textarea[data-bk-prop], input[type=text][data-bk-prop]") && el) {
    el[t.dataset.bkProp] = t.value;
    clearTimeout(E.fieldTimer);
    E.fieldTimer = setTimeout(() => {
      core.commit({ render: false });
      E.renderCanvas();
    }, 500);
  }
}

export function onInspectorChange(E, e) {
  const t = e.target;
  const { core } = E;
  const el = core.selectedEl();
  if (t.matches("[data-bk-color]")) return applySwatch(E, t.dataset.bkColor, t.value);
  if (t.matches("[data-bk-book]")) {
    const k = t.dataset.bkBook;
    const v = k === "author" ? t.value.trim().slice(0, 60) : t.value;
    core.setBook({ [k]: v });
    E.renderAll();
    return;
  }
  if (!el) return;
  if (t.matches("[data-bk-prop]")) {
    const k = t.dataset.bkProp;
    const v = t.type === "number" ? Number(t.value) : t.value;
    if (t.matches("textarea, input[type=text]")) {
      clearTimeout(E.fieldTimer);
      core.commit();
      return;
    }
    core.update(el.id, { [k]: v });
    E.root.querySelector(`[data-bk-prop="${k}"]`)?.focus({ preventScroll: true });
  } else if (t.matches("[data-bk-style-sel]")) {
    const k = t.dataset.bkStyleSel;
    core.update(el.id, {
      style: { [k]: k === "columns" ? Number(t.value) : t.value || undefined },
    });
  } else if (t.matches("[data-bk-style-num]"))
    core.update(el.id, { style: { [t.dataset.bkStyleNum]: Number(t.value) } });
  else if (t.matches("[data-bk-style-lang]"))
    core.update(el.id, { style: { lang: t.value.trim() } });
  if (el.type === "text" && el.html) el.html = sanitizeHtml(el.html);
}
