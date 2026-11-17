// Experience Builder, step 1 of the screen: the instructor's material and settings. Where a source can come from:
// pasted text, an uploaded .txt / .md / .html file (read as TEXT in the browser, markup stripped, never run), a Word
// .docx file (its paragraph text only, read on this device by ./docx.js; PDF is not supported because the lab ships
// no reader for it), a passage the lab already ships (the reading activity bank) and a Book Studio project on this
// device. Everything stays on this device.
import { BAND_INFO, CONTENT_BANDS } from "../bands.js";
import { KEY_LANGUAGE_USES } from "../lang/klu.js";
import { tokenize } from "../lang/text.js";
import { html } from "../util.js";
import { EXPERIENCE_TYPES, TYPE_IDS } from "./design.js";
import { readDocx } from "./docx.js";
import {
  MAX_DOCX_BYTES,
  MAX_UPLOAD_BYTES,
  MIN_SOURCE_WORDS,
  checkUpload,
  cleanSource,
} from "./extract.js";
import { SUBJECTS } from "./validate.js";

export const DEFAULT_SETTINGS = Object.freeze({
  band: "6-8",
  subject: "Science",
  keyUse: "Explain",
  domains: ["Speaking", "Writing"],
  type: "auto",
  minutes: 45,
  topic: "",
  contentObjective: "",
  languageObjective: "",
  supports: { glossary: true, frames: true, readAloud: true, spanish: true, wordBank: true },
  showSource: false,
});
export const blankInput = () => ({
  source: { title: "", text: "", kind: "text" },
  settings: {
    ...DEFAULT_SETTINGS,
    domains: [...DEFAULT_SETTINGS.domains],
    supports: { ...DEFAULT_SETTINGS.supports },
  },
});

export const BANDS = [
  ["3-5", "Grades 3–5", "Grados 3–5"],
  ["6-8", "Grades 6–8", "Grados 6–8"],
  ["all", "Mixed grades", "Grados mixtos"],
];
export const SUBJECT_ES = {
  Science: "Ciencias",
  "Social Studies": "Estudios sociales",
  "Language Arts": "Artes del lenguaje",
  Mathematics: "Matemáticas",
  Other: "Otra",
};
export const USE_ES = {
  Narrate: "Narrar",
  Inform: "Informar",
  Explain: "Explicar",
  Argue: "Argumentar",
};
export const DOMAIN_ES = {
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
};
export const SUPPORTS = [
  ["glossary", "Glossary of the text's own words", "Glosario con las palabras del texto"],
  [
    "frames",
    "Sentence frames for speaking and writing",
    "Marcos de oración para hablar y escribir",
  ],
  ["readAloud", "Read aloud (text to speech)", "Lectura en voz alta"],
  ["spanish", "Spanish directions and prompts", "Instrucciones y consignas en español"],
  ["wordBank", "Word bank", "Banco de palabras"],
];
const MINUTES = [20, 30, 45, 60, 90];
const UPLOAD_ERRORS = {
  "unsupported-document": [
    "PDF and old Word (.doc) files cannot be read here. Open the file and copy and paste the text, or save it as a Word .docx file and upload that.",
    "Aquí no se pueden leer archivos PDF ni de Word antiguos (.doc). Abra el archivo y copie y pegue el texto, o guárdelo como archivo de Word .docx y súbalo.",
  ],
  "unsupported-type": [
    "That file type is not supported. Use a .docx, .txt, .md or .html file, or paste the text.",
    "Ese tipo de archivo no es compatible. Use un archivo .docx, .txt, .md o .html, o pegue el texto.",
  ],
  "empty-file": ["That file is empty.", "Ese archivo está vacío."],
  "too-large": [
    `That file is too large (text files up to ${MAX_UPLOAD_BYTES / 1024} KB, Word files up to ${MAX_DOCX_BYTES / 1024 / 1024} MB). Paste the part you want to use.`,
    `Ese archivo es demasiado grande (archivos de texto hasta ${MAX_UPLOAD_BYTES / 1024} KB, archivos de Word hasta ${MAX_DOCX_BYTES / 1024 / 1024} MB). Pegue la parte que quiera usar.`,
  ],
  "text-too-large": [
    `The text in that file is longer than ${MAX_UPLOAD_BYTES / 1024} KB. Paste the part you want to use.`,
    `El texto de ese archivo pasa de ${MAX_UPLOAD_BYTES / 1024} KB. Pegue la parte que quiera usar.`,
  ],
  "docx-encrypted": [
    "That Word file is protected with a password, so it cannot be read. Remove the password in Word, or copy and paste the text.",
    "Ese archivo de Word está protegido con contraseña y no se puede leer. Quite la contraseña en Word, o copie y pegue el texto.",
  ],
  "docx-malformed": [
    "That Word file could not be read (it may be damaged or not really a .docx). Open it in Word and save it again, or copy and paste the text.",
    "No se pudo leer ese archivo de Word (puede estar dañado o no ser un .docx de verdad). Ábralo en Word y guárdelo otra vez, o copie y pegue el texto.",
  ],
  unreadable: ["The file could not be read.", "No se pudo leer el archivo."],
};
// readDocx error codes → the message shown. Everything that is not "encrypted" or a size limit reads as damaged.
const DOCX_ERRORS = {
  encrypted: "docx-encrypted",
  "too-large": "too-large",
  "document-too-large": "text-too-large",
};

/** The text of an upload, by kind: Word files through the .docx reader, everything else as text. */
async function uploadText(file, kind) {
  if (kind !== "docx") return { ok: true, text: await file.text() };
  const res = await readDocx(await file.arrayBuffer());
  return res.ok ? res : { ok: false, error: DOCX_ERRORS[res.error] || "docx-malformed" };
}

/** Read an uploaded file as text. Type and size are checked first; the content is cleaned, never executed. */
export async function readUpload(file) {
  const checked = checkUpload({ name: file?.name, size: file?.size });
  if (!checked.ok) return { ok: false, text: UPLOAD_ERRORS[checked.error] };
  try {
    const raw = await uploadText(file, checked.kind);
    if (!raw.ok) return { ok: false, text: UPLOAD_ERRORS[raw.error] };
    if (new TextEncoder().encode(raw.text).byteLength > MAX_UPLOAD_BYTES)
      return { ok: false, text: UPLOAD_ERRORS["text-too-large"] };
    const text = cleanSource(raw.text, checked.kind === "docx" ? "text" : checked.kind);
    if (!text) return { ok: false, text: UPLOAD_ERRORS["empty-file"] };
    return {
      ok: true,
      source: {
        title: String(file.name)
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .slice(0, 80),
        text,
        kind: "text",
      },
    };
  } catch {
    return { ok: false, text: UPLOAD_ERRORS.unreadable };
  }
}

/** Reading passages of one band from the activity bank: [{ id, title, words, text }]. */
export async function loadPassages(band, { loadDomain }) {
  const data = await loadDomain(band, "Reading");
  const seen = new Set();
  const out = [];
  for (const level of Object.values(data?.levels || {}))
    for (const a of level.activities || []) {
      const text = cleanSource(Array.isArray(a.passage) ? a.passage.join(" ") : a.passage || "");
      const title = a.passageTitle || a.title || a.id;
      if (!text || seen.has(text)) continue;
      seen.add(text);
      out.push({ id: a.id, title, words: tokenize(text).length, text });
    }
  return out.sort((a, b) => b.words - a.words);
}

const opt = (value, label, current) =>
  html`<option value="${value}" ${String(value) === String(current) ? "selected" : ""}>
    ${label}
  </option>`;

export function sourceStepHTML(I, ui) {
  const { source, settings } = ui.input;
  const words = tokenize(source.text).length;
  const pick = ui.pick;
  return html`<section class="panel xb-step" aria-labelledby="xbSrcH">
      <h2 id="xbSrcH">${I.T("1. Your material", "1. Su material")}</h2>
      <p class="fine">
        ${I.T("Paste an informational text, upload a text file, or pick something the lab already has. It stays on this device.", "Pegue un texto informativo, suba un archivo de texto o elija algo que el laboratorio ya tiene. Se queda en este dispositivo.")}
      </p>
      <label class="field" for="xbTitle"
        >${I.T("Title", "Título")}
        <input
          id="xbTitle"
          type="text"
          maxlength="120"
          data-xb-in="source.title"
          value="${source.title}"
      /></label>
      <label class="field" for="xbText"
        >${I.T("Text", "Texto")}
        <textarea id="xbText" rows="10" data-xb-in="source.text" class="xb-source">
${source.text}</textarea>
      </label>
      <p class="fine" id="xbWords" aria-live="polite">
        ${I.S(`${words} words`, `${words} palabras`)}${words && words < MIN_SOURCE_WORDS ? ` · ${I.S("a little longer works better", "funciona mejor un poco más largo")}` : ""}
      </p>
      <div class="xb-sources">
        <div class="xb-source-way">
          <label class="field" for="xbFile"
            >${I.T("Upload a file (Word .docx up to 2 MB; .txt, .md, .html up to 200 KB)", "Subir un archivo (Word .docx hasta 2 MB; .txt, .md, .html hasta 200 KB)")}
            <input
              id="xbFile"
              type="file"
              accept=".docx,.txt,.md,.markdown,.html,.htm,text/plain,text/markdown,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              data-xb-file
          /></label>
          <p class="fine">
            ${I.T("Only the words of a Word file are read, on this device. PDF is not supported: copy and paste the text, or save it as .docx.", "De un archivo de Word solo se leen las palabras, en este dispositivo. No se admite PDF: copie y pegue el texto, o guárdelo como .docx.")}
          </p>
        </div>
        <div class="xb-source-way">
          <label class="field" for="xbBankBand"
            >${I.T("A Language Page reading passage", "Un pasaje de lectura de The Language Page")}
            <select id="xbBankBand" data-xb-bank-band>
              <option value="">${I.S("Choose a grade band…", "Elija un grupo de grados…")}</option>
              ${CONTENT_BANDS.map((b) => opt(b, I.S(BAND_INFO[b].label, BAND_INFO[b].labelEs), pick.band))}
            </select></label
          >
          ${
            pick.passages
              ? html`<label class="field" for="xbBank"
                  >${I.T("Passage", "Pasaje")}
                  <select id="xbBank" data-xb-bank>
                    <option value="">${I.S("Choose a passage…", "Elija un pasaje…")}</option>
                    ${pick.passages.map((p) => opt(p.id, `${p.title} (${p.words} ${I.S("words", "palabras")})`, ""))}
                  </select></label
                >`
              : ""
          }
        </div>
        <div class="xb-source-way">
          <button type="button" class="btn small" data-xb-act="books">
            ${I.T("Use a Book Studio project", "Usar un proyecto de Book Studio")}
          </button>
          ${
            pick.books
              ? pick.books.length
                ? html`<label class="field" for="xbBook"
                    >${I.T("Book", "Libro")}
                    <select id="xbBook" data-xb-book>
                      <option value="">${I.S("Choose a book…", "Elija un libro…")}</option>
                      ${pick.books.map((b) => opt(b.id, `${b.title} (${b.words} ${I.S("words", "palabras")})`, ""))}
                    </select></label
                  >`
                : html`<p class="fine">
                    ${I.T("There are no Book Studio projects on this device yet.", "Todavía no hay proyectos de Book Studio en este dispositivo.")}
                  </p>`
              : ""
          }
        </div>
      </div>
    </section>
    <section class="panel xb-step" aria-labelledby="xbSetH">
      <h2 id="xbSetH">${I.T("2. Your class and goals", "2. Su clase y sus metas")}</h2>
      <div class="xb-grid">
        <label class="field" for="xbBand"
          >${I.T("Grades", "Grados")}
          <select id="xbBand" data-xb-in="settings.band">
            ${BANDS.map(([v, en, es]) => opt(v, I.S(en, es), settings.band))}
          </select></label
        >
        <label class="field" for="xbSubject"
          >${I.T("Content area", "Área de contenido")}
          <select id="xbSubject" data-xb-in="settings.subject">
            ${SUBJECTS.map((s) => opt(s, I.S(s, SUBJECT_ES[s]), settings.subject))}
          </select></label
        >
        <label class="field" for="xbUse"
          >${I.T("Key Language Use", "Uso Clave del Lenguaje")}
          <select id="xbUse" data-xb-in="settings.keyUse">
            ${KEY_LANGUAGE_USES.map((u) => opt(u, I.S(u, USE_ES[u]), settings.keyUse))}
          </select></label
        >
        <label class="field" for="xbType"
          >${I.T("Kind of experience", "Tipo de experiencia")}
          <select id="xbType" data-xb-in="settings.type">
            ${opt("auto", I.S("Choose for me", "Elegir por mí"), settings.type)}
            ${TYPE_IDS.map((t) => opt(t, I.S(...EXPERIENCE_TYPES[t].name), settings.type))}
          </select></label
        >
        <label class="field" for="xbMin"
          >${I.T("Class time", "Tiempo de clase")}
          <select id="xbMin" data-xb-in="settings.minutes">
            ${MINUTES.map((m) => opt(m, I.S(`About ${m} minutes`, `Unos ${m} minutos`), settings.minutes))}
          </select></label
        >
        <label class="field" for="xbTopic"
          >${I.T("Topic or scenario (optional)", "Tema o situación (opcional)")}
          <input
            id="xbTopic"
            type="text"
            maxlength="120"
            data-xb-in="settings.topic"
            value="${settings.topic}"
        /></label>
      </div>
      <fieldset class="xb-set">
        <legend>${I.T("Language domains", "Dominios del lenguaje")}</legend>
        <div class="xb-checks">
          ${Object.keys(DOMAIN_ES).map((d) => html`<label class="xb-check" for="xbDom${d}"><input id="xbDom${d}" type="checkbox" data-xb-domain="${d}" ${settings.domains.includes(d) ? "checked" : ""} /> ${I.T(d, DOMAIN_ES[d])}</label>`)}
        </div>
      </fieldset>
      <label class="field" for="xbLangObj"
        >${I.T("Language objective", "Objetivo de lenguaje")}
        <input
          id="xbLangObj"
          type="text"
          maxlength="240"
          data-xb-in="settings.languageObjective"
          value="${settings.languageObjective}"
          placeholder="${I.S("Leave empty and the builder suggests one", "Déjelo vacío y el creador sugiere uno")}"
      /></label>
      <label class="field" for="xbConObj"
        >${I.T("Learning objective (content)", "Objetivo de aprendizaje (contenido)")}
        <input
          id="xbConObj"
          type="text"
          maxlength="240"
          data-xb-in="settings.contentObjective"
          value="${settings.contentObjective}"
      /></label>
      <fieldset class="xb-set">
        <legend>
          ${I.T("Supports learners may open", "Apoyos que los estudiantes pueden abrir")}
        </legend>
        <div class="xb-checks">
          ${SUPPORTS.map(([k, en, es]) => html`<label class="xb-check" for="xbSup${k}"><input id="xbSup${k}" type="checkbox" data-xb-support="${k}" ${settings.supports[k] ? "checked" : ""} /> ${I.T(en, es)}</label>`)}
        </div>
        <p class="fine">
          ${I.T("Work done with a support open is recorded as supported, never as independent.", "El trabajo hecho con un apoyo abierto se registra como apoyado, nunca como independiente.")}
        </p>
      </fieldset>
      <div class="row-actions">
        <button type="button" class="btn btn-primary" data-xb-act="compile">
          ${I.T("Build the experience", "Crear la experiencia")}
        </button>
      </div>
    </section>`;
}
