// Language Demand Analyzer (/demand): a teacher pastes a task, a passage or directions and sees where the LANGUAGE may
// get in the way of the thinking it asks for, plus the supports that keep that thinking whole. Rule-based and local:
// the text is never sent anywhere and never saved. The task is never rewritten; every flag quotes the teacher's words.
// Engine: src/demand/analyze.js. Rules and limits: DEMAND.md.
import { crumbsHTML } from "../components.js";
import { analyzeDemand, BANDS, MAX_CHARS } from "../demand/analyze.js";
import { buildHandoff, saveHandoff } from "../demand/handoff.js";
import { WORDS_PRACTICE } from "../demand/patterns.js";
import { SAMPLES } from "../demand/sample.js";
import { i18nFor } from "../i18n.js";
import { printSheet } from "../print-sheet.js";
import { BASE, announce, copyText, html, icon } from "../util.js";

const KIND = {
  "stacked-directions": ["Several directions at once", "Varias indicaciones a la vez"],
  "long-sentence": ["Long sentence", "Oración larga"],
  idiom: ["Idiom or phrase", "Modismo o frase hecha"],
  "multiple-meaning": ["Word with two meanings", "Palabra con dos significados"],
  passive: ["Passive voice", "Voz pasiva"],
  "noun-heavy": ["Noun-heavy sentence", "Oración cargada de sustantivos"],
  reference: ["Unclear “this” or “it”", "«Esto» o «eso» poco claro"],
  negation: ["Negation or exception", "Negación o excepción"],
};
const SUBJECT_LABEL = [
  ["", "Any subject", "Cualquier materia"],
  ["ela", "Reading and writing", "Lectura y escritura"],
  ["math", "Math", "Matemáticas"],
  ["sci", "Science", "Ciencias"],
  ["ss", "Social studies", "Estudios sociales"],
];
const BAND_LABEL = {
  "K-2": ["Grades K–2", "Grados K–2"],
  "3-5": ["Grades 3–5", "Grados 3–5"],
  "6-8": ["Grades 6–8", "Grados 6–8"],
};
// Word-level flags are shaded in the text; sentence-level flags are listed with their quote.
const INLINE = new Set(["idiom", "multiple-meaning", "passive", "reference", "negation"]);
const ui = { band: "6-8", subject: "", text: "", result: null };

/** The text with word-level flags shaded and numbered, built from segments so nothing is ever injected as markup. */
function markedText(result, text) {
  const marks = result.findings
    .map((f, i) => ({ ...f, n: i + 1 }))
    .filter((f) => INLINE.has(f.kind))
    .sort((a, b) => a.start - b.start);
  const out = [];
  let at = 0;
  for (const m of marks) {
    if (m.start < at) continue;
    out.push(text.slice(at, m.start));
    out.push(
      html`<mark class="dm-mark" data-sev="${m.severity}">${m.quote}<sup>${m.n}</sup></mark>`,
    );
    at = m.end;
  }
  out.push(text.slice(at));
  return out;
}

const findingHTML = (I, f, n) =>
  html`<li class="dm-finding">
    <p class="dm-kind">
      <span class="dm-n">${n}</span>
      ${I.T(...KIND[f.kind])}${f.severity === "high" ? html` <span class="dm-sev">${I.T("worth a look first", "para revisar primero")}</span>` : ""}
    </p>
    <p class="dm-quote" lang="en">
      “${f.quote.length > 160 ? `${f.quote.slice(0, 157)}…` : f.quote}”
    </p>
    <p lang="en">${f.why}</p>
    <p class="dm-tip" lang="en"><strong>${I.T("Try", "Prueba")}:</strong> ${f.tip}</p>
  </li>`;

const vocabHTML = (I, rows) =>
  rows.length
    ? html`<table class="dm-table">
        <caption class="sr-only">
          ${I.T("Words to pre-teach", "Palabras para enseñar antes")}
        </caption>
        <thead>
          <tr>
            <th scope="col">${I.T("Word", "Palabra")}</th>
            <th scope="col">${I.T("Student-friendly meaning", "Significado sencillo")}</th>
            <th scope="col">${I.T("In Spanish", "En español")}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (v) =>
              html`<tr>
                <th scope="row" lang="en">${v.word}</th>
                <td lang="en">
                  ${v.gloss || html`<em>${I.T("Everyday academic word; add a picture or example.", "Palabra académica común; añade una imagen o un ejemplo.")}</em>`}
                </td>
                <td lang="es">
                  ${v.es || "—"}${v.cognate === "cog" ? html` <span class="dm-tag">${I.T("looks alike", "se parece")}</span>` : ""}${v.warn ? html`<span class="dm-warn" lang="en"> ${v.warn}</span>` : ""}
                </td>
              </tr>`,
          )}
        </tbody>
      </table>`
    : html`<p>
        ${I.T("No words from the Word Lab bank found. Your task may already use plain, everyday words.", "No se encontraron palabras del banco de Word Lab. Tu tarea ya puede usar palabras sencillas y comunes.")}
      </p>`;

const purposeHTML = (I, p) =>
  html`<div class="dm-purpose">
    <h4 lang="en">${p.label}</h4>
    <p class="dm-step-label">${I.T("Start with frames", "Empieza con estructuras")}</p>
    <ul lang="en">
      ${p.frames.guided.map((f) => html`<li>${f}</li>`)}
    </ul>
    <p class="dm-step-label">${I.T("Then a word bank", "Luego un banco de palabras")}</p>
    <ul lang="en">
      ${p.frames.supported.map((f) => html`<li>${f}</li>`)}
    </ul>
    <p class="dm-step-label">${I.T("Then take support away", "Luego retira el apoyo")}</p>
    <p lang="en">${p.frames.independent}</p>
    <p class="dm-step-label">
      ${I.T("Quick check of the same thinking", "Revisión rápida del mismo pensamiento")}
    </p>
    <ul lang="en">
      <li><strong>${I.T("Exit ticket", "Boleto de salida")}:</strong> ${p.check.ticket}</li>
      <li><strong>${I.T("Say it", "Dilo")}:</strong> ${p.check.oral}</li>
    </ul>
  </div>`;

/** The whole result as plain text, for copy and for a Word or Docs paste. */
export function supportsText(r) {
  const lines = ["LANGUAGE SUPPORTS FOR THIS TASK", `Band: ${r.band}`, ""];
  if (r.steps.length > r.stats.sentences)
    lines.push("DIRECTIONS IN STEPS", ...r.steps.map((s, i) => `${i + 1}. ${s}`), "");
  lines.push(
    "WORDS TO PRE-TEACH",
    ...r.vocabulary.map(
      (v) => `- ${v.word}${v.gloss ? `: ${v.gloss}` : ""}${v.es ? ` (${v.es})` : ""}`,
    ),
    "",
  );
  for (const p of r.purposes)
    lines.push(
      p.label.toUpperCase(),
      ...p.frames.guided.map((f) => `- ${f}`),
      ...p.frames.supported,
      `Fade: ${p.frames.independent}`,
      `Exit ticket: ${p.check.ticket}`,
      "",
    );
  if (r.visuals.length) lines.push("VISUAL SUPPORTS", ...r.visuals.map((v) => `- ${v}`), "");
  lines.push(...r.limits.map((l) => `Note: ${l}`));
  return lines.join("\n");
}

const printHTML = (r) =>
  html`<article class="dm-print">
    <h1>Language supports for this task</h1>
    ${
      r.steps.length > r.stats.sentences
        ? html`<h2>Directions in steps</h2>
            <ol>
              ${r.steps.map((s) => html`<li>${s}</li>`)}
            </ol>`
        : ""
    }
    <h2>Words to pre-teach</h2>
    <ul>
      ${r.vocabulary.map((v) => html`<li><strong>${v.word}</strong>${v.gloss ? ` — ${v.gloss}` : ""}${v.es ? ` (${v.es})` : ""}</li>`)}
    </ul>
    ${r.purposes.map(
      (p) =>
        html`<h2>${p.label}</h2>
          <ul>
            ${p.frames.guided.map((f) => html`<li>${f}</li>`)}
          </ul>
          <p>${p.frames.supported.join(" ")}</p>
          <p><em>Fade:</em> ${p.frames.independent}</p>`,
    )}
    <p class="fine">${r.limits[0]}</p>
  </article>`;

function resultHTML(I, r) {
  if (!r) return "";
  if (r.empty)
    return html`<p class="panel" role="status">
      ${I.T("Paste or type a task first.", "Primero pega o escribe una tarea.")}
    </p>`;
  const n = r.findings.length;
  const showSteps = r.steps.length > r.stats.sentences;
  return html`<section class="dm-results" aria-labelledby="dmResults">
    <h2 id="dmResults" tabindex="-1">${I.T("What we found", "Lo que encontramos")}</h2>
    <p class="lead" role="status">
      ${n ? I.T(`${n} place${n > 1 ? "s" : ""} where the language may slow students down. Numbered words are marked below.`, `${n} ${n > 1 ? "lugares" : "lugar"} donde el lenguaje puede frenar a los estudiantes. Las palabras numeradas están marcadas abajo.`) : I.T("Nothing in this text stands out as a barrier. Check the supports anyway.", "Nada en este texto destaca como barrera. Aun así, revisa los apoyos.")}
    </p>
    <p class="dm-marked" lang="en">${markedText(r, ui.text.slice(0, MAX_CHARS))}</p>
    <p class="fine">
      ${r.stats.words} ${I.T("words", "palabras")} · ${r.stats.sentences}
      ${I.T("sentences", "oraciones")} · ${I.T("about", "unas")} ${r.stats.avgSentence}
      ${I.T("words per sentence", "palabras por oración")}
    </p>
    ${
      n
        ? html`<ol class="dm-findings">
            ${r.findings.map((f, i) => findingHTML(I, f, i + 1))}
          </ol>`
        : ""
    }
    ${
      showSteps
        ? html`<details class="panel" open>
            <summary>
              <h3>${I.T("Your directions, in steps", "Tus indicaciones, en pasos")}</h3>
            </summary>
            <p class="fine">
              ${I.T("Same words, split so each step has one action.", "Las mismas palabras, divididas para que cada paso tenga una acción.")}
            </p>
            <ol lang="en">
              ${r.steps.map((s) => html`<li>${s}</li>`)}
            </ol>
          </details>`
        : ""
    }
    <details class="panel" open>
      <summary><h3>${I.T("Words to pre-teach", "Palabras para enseñar antes")}</h3></summary>
      ${vocabHTML(I, r.vocabulary)}
      <p>
        <a href="${BASE}/${WORDS_PRACTICE[0]}?grades=${ui.band}"
          >${I.T("Practice these words in the", "Practicar estas palabras en el")}
          ${I.T(WORDS_PRACTICE[1], WORDS_PRACTICE[2])}</a
        >
      </p>
    </details>
    <details class="panel">
      <summary>
        <h3>
          ${I.T("Sentence frames, and how to fade them", "Estructuras de oración y cómo retirarlas")}
        </h3>
      </summary>
      ${r.purposes.map((p) => purposeHTML(I, p))}
    </details>
    ${
      r.visuals.length
        ? html`<details class="panel">
            <summary><h3>${I.T("Visual supports", "Apoyos visuales")}</h3></summary>
            <ul lang="en">
              ${r.visuals.map((v) => html`<li>${v}</li>`)}
            </ul>
          </details>`
        : ""
    }
    <details class="panel">
      <summary>
        <h3>
          ${I.T("What this tool cannot tell you", "Lo que esta herramienta no puede decirte")}
        </h3>
      </summary>
      <ul lang="en">
        ${r.limits.map((l) => html`<li>${l}</li>`)}
      </ul>
    </details>
    <div class="row-actions">
      <button type="button" class="btn" data-dm-copy>
        ${icon("copy")} ${I.T("Copy the supports as text", "Copiar los apoyos como texto")}
      </button>
      <button type="button" class="btn primary" data-dm-build>
        ${icon("launch")} ${I.T("Make a student handout", "Crear una hoja para estudiantes")}
      </button>
            <button type="button" class="btn ghost" data-dm-print>
        ${icon("print")} ${I.T("Print the supports", "Imprimir los apoyos")}
      </button>
    </div>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const title = I.S("Language Demand Analyzer", "Analizador de demanda lingüística");
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
        [title, null],
      ])}
      <div class="cb dm">
        <header class="cb-hero">
          <p class="eyebrow">${icon("teacher")} ${I.T("For teachers", "Para docentes")}</p>
          <h1 tabindex="-1">
            ${I.T("Language Demand Analyzer", "Analizador de demanda lingüística")}
          </h1>
          <p class="lead">
            ${I.T("Paste a task, passage or directions. See where the language may get in the way of the thinking, and the supports that keep that thinking whole. Your text stays on this device.", "Pega una tarea, un texto o unas indicaciones. Mira dónde el lenguaje puede estorbar al pensamiento y qué apoyos lo mantienen completo. Tu texto se queda en este dispositivo.")}
          </p>
        </header>
        <div class="panel dm-form">
          <label for="dmText"
            ><strong>${I.T("Your task or text", "Tu tarea o texto")}</strong></label
          >
          <textarea
            id="dmText"
            class="dm-text"
            rows="8"
            maxlength="${MAX_CHARS}"
            lang="en"
            spellcheck="true"
            placeholder="${I.S("Paste the directions, word problem or reading passage here.", "Pega aquí las indicaciones, el problema o el texto.")}"
          >
${ui.text}</textarea>
          <div class="dm-controls">
            <fieldset class="dm-band">
              <legend>${I.T("Grade band", "Nivel")}</legend>
              ${BANDS.map((b) => html`<label class="dm-chip"><input type="radio" name="dmBand" value="${b}" ${ui.band === b ? "checked" : ""} /> ${I.T(...BAND_LABEL[b])}</label>`)}
            </fieldset>
            <label class="dm-subject"
              >${I.T("Subject", "Materia")}
              <select id="dmSubject">
                ${SUBJECT_LABEL.map(([v, en, es]) => html`<option value="${v}" ${ui.subject === v ? "selected" : ""}>${I.S(en, es)}</option>`)}
              </select>
            </label>
          </div>
          <div class="row-actions">
            <button type="button" class="btn primary" data-dm-check>
              ${icon("search")} ${I.T("Check this text", "Revisar este texto")}
            </button>
            <button type="button" class="btn ghost" data-dm-sample>
              ${I.T("Try an example", "Probar un ejemplo")}
            </button>
            <button type="button" class="btn ghost" data-dm-clear>${I.T("Clear", "Borrar")}</button>
          </div>
          <p class="fine">
            ${I.T("Rule-based and local: nothing is sent or saved, and no AI is used. The task is never rewritten. These are general language supports, not a district curriculum alignment.", "Basado en reglas y local: no se envía ni se guarda nada, y no se usa IA. La tarea nunca se reescribe. Son apoyos generales de lenguaje, no una alineación con el currículo del distrito.")}
          </p>
        </div>
        ${resultHTML(I, ui.result)}
      </div>`,
  };
}

const syncFromDom = () => {
  ui.text = document.getElementById("dmText")?.value ?? ui.text;
  ui.band = document.querySelector('input[name="dmBand"]:checked')?.value || ui.band;
  ui.subject = document.getElementById("dmSubject")?.value ?? ui.subject;
};

export function onInput(e) {
  if (e.target.id === "dmText") ui.text = e.target.value;
}

export function onChange(e) {
  if (e.target.name === "dmBand" || e.target.id === "dmSubject") syncFromDom();
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target.closest("button");
  if (!t) return false;
  if (t.matches("[data-dm-check]")) {
    syncFromDom();
    ui.result = analyzeDemand(ui.text, { band: ui.band, subject: ui.subject });
    await ctx.rerender();
    const h = document.getElementById("dmResults");
    h?.focus();
    h?.scrollIntoView({ block: "start" });
    return true;
  }
  if (t.matches("[data-dm-sample]")) {
    syncFromDom();
    const s = SAMPLES[ui.band];
    Object.assign(ui, { text: s.text, subject: s.subject, result: null });
    await ctx.rerender();
    document.getElementById("dmText")?.focus();
    return true;
  }
  if (t.matches("[data-dm-clear]")) {
    Object.assign(ui, { text: "", result: null });
    await ctx.rerender();
    document.getElementById("dmText")?.focus();
    return true;
  }
  if (t.matches("[data-dm-copy]") && ui.result && !ui.result.empty) {
    const ok = await copyText(supportsText(ui.result));
    announce(
      ok === false
        ? I.S("Could not copy. Use Print instead.", "No se pudo copiar. Usa Imprimir.")
        : I.S("Copied. Paste it into your lesson plan.", "Copiado. Pégalo en tu plan de clase."),
    );
    return true;
  }
  if (t.matches("[data-dm-build]") && ui.result && !ui.result.empty) {
    const handoff = buildHandoff(ui.result, ui.text.slice(0, MAX_CHARS));
    if (!handoff || !saveHandoff(handoff)) {
      announce(I.S("Could not hand the task to Activity Studio. Use Copy instead.", "No se pudo pasar la tarea al Estudio de actividades. Usa Copiar."));
      return true;
    }
    ctx.navigate(`${BASE}/activity-studio/new?kind=worksheet&from=demand`);
    return true;
  }
  if (t.matches("[data-dm-print]") && ui.result && !ui.result.empty) {
    printSheet(printHTML(ui.result));
    return true;
  }
  return false;
}
