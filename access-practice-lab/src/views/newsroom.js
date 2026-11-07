// Newsroom (/newsroom): a publishing studio. Choose a story prompt, plan with the 5W1H organizer, draft with frames,
// read the story aloud and record it (replay, re-record, keep on this device), add a headline and a picture from the
// built-in SVG set, then print or download a front page. Routes: /newsroom, /newsroom/<prompt id>?step=plan|draft|read|front.
// Everything stays on this device. Observations on a draft count the learner's own words; they never grade meaning.
import { recorderHTML, setComponentsI18n } from "../components.js";
import { NEWS_PROMPTS, PICS, PIC_IDS } from "../content/newsroom.js";
import { i18nFor } from "../i18n.js";
import * as audioStore from "../audio-store.js";
import {
  BANK,
  BANK_ES,
  FORMATS,
  FRAMES,
  PART_COPY,
  SHEET_CSS,
  W5,
  frontPageHTML,
  headlineCheck,
  observe,
  partsOf,
  planCount,
  sheetDocument,
  storyText,
  storyWords,
} from "../lang/newsroom.js";
import { isRecording, takesFor } from "../recorder.js";
import { announce, esc, html, icon, raw } from "../util.js";
import { heroArt } from "./studio-art.js";
import {
  renderAfterChange,
  LEVELS,
  bandFor,
  levelOf,
  levelPickerHTML,
  loadState,
  recordEvidence,
  saveState,
  speakBtn,
  studioCrumbs,
  studioHero,
  studioHref,
} from "./studio-kit.js";

export const NR_KEY = "accessPracticeLab:v1:newsroom";
const DEFAULT = { level: "B", stories: {}, ev: {} };
const state = () => {
  const s = loadState(NR_KEY, DEFAULT);
  if (!s.stories || typeof s.stories !== "object") s.stories = {};
  if (!s.ev || typeof s.ev !== "object") s.ev = {};
  return s;
};
const save = (s) => saveState(NR_KEY, s);
const STEPS = [
  ["plan", "Plan", "Planear", "list"],
  ["draft", "Draft", "Redactar", "writing"],
  ["read", "Read aloud", "Leer en voz alta", "speaking"],
  ["front", "Front page", "Portada", "print"],
];
const KIND = {
  news: ["News", "Noticia"],
  feature: ["Feature", "Reportaje"],
  opinion: ["Opinion", "Opinión"],
  "how-to": ["How-to", "Instrucciones"],
  interview: ["Interview", "Entrevista"],
  sports: ["Sports", "Deportes"],
  review: ["Review", "Reseña"],
};
const href = (id, band, step) =>
  `${studioHref("newsroom", id, band)}${step ? `&step=${step}` : ""}`;
const promptsFor = (band) => NEWS_PROMPTS.filter((p) => p.b === band || p.b === "both");
const picSvg = (id, cls = "") =>
  raw(
    `<svg class="nr-pic ${cls}" viewBox="0 0 240 160" aria-hidden="true" focusable="false">${PICS[id]?.[2] || ""}</svg>`,
  );

let ui = { filter: "", q: "", help: false, last: "", kept: [] };
let current = { id: "", step: "" };

function evidence(st, ctx, key, domain, m, opened = {}) {
  if (st.ev[key]) return;
  st.ev[key] = 1;
  recordEvidence({
    src: "newsroom",
    task: key.split("|")[0],
    band: bandFor(ctx.band),
    domain,
    use: "Inform",
    level: levelOf(st),
    opened,
    kind: "first",
    m,
  });
}

async function hubHTML(ctx, I, st) {
  const band = bandFor(ctx.band);
  const list = promptsFor(band).filter(
    (p) =>
      (!ui.filter || p.kind === ui.filter) &&
      (!ui.q || `${p.title} ${p.seed}`.toLowerCase().includes(ui.q.toLowerCase())),
  );
  const mine = Object.keys(st.stories)
    .map((id) => NEWS_PROMPTS.find((p) => p.id === id))
    .filter(Boolean);
  const kept = (await audioStore.list()).filter((r) => String(r.task).startsWith("newsroom:"));
  return html`${studioCrumbs(I, band, "newsroom", I.S("Newsroom", "Sala de redacción"))}
    ${studioHero({
      I,
      ico: "launch",
      cls: "d-writing",
      kicker: I.T(
        `Grades ${band.replace("-", "–")} · writing and speaking`,
        `Grados ${band.replace("-", "–")} · escribir y hablar`,
      ),
      title: I.T("Newsroom", "Sala de redacción"),
      lead: I.T(
        `Be the reporter. Pick one of ${promptsFor(band).length} story prompts, plan it, write it, read it aloud, and publish your own front page. Everything stays on this device.`,
        `Sé el reportero. Elige uno de ${promptsFor(band).length} temas, planéalo, escríbelo, léelo en voz alta y publica tu propia portada. Todo se queda en este dispositivo.`,
      ),
      art: raw(heroArt("newsroom")),
    })}
    ${levelPickerHTML(I, levelOf(st))}
    ${
      mine.length
        ? html`<section class="panel" aria-labelledby="nr-mine-h">
            <h2 id="nr-mine-h">${I.T("My stories", "Mis historias")}</h2>
            <ul class="nr-mine">
              ${mine.map((p) => {
                const s = st.stories[p.id];
                return html`<li>
                  <a href="${href(p.id, band, "plan")}"><b>${s.head || p.title}</b></a>
                  <small
                    >${I.T(`${planCount(s.w5)} of 6 plan boxes · ${storyWords(s.draft, s.fmt)} words`, `${planCount(s.w5)} de 6 cuadros del plan · ${storyWords(s.draft, s.fmt)} palabras`)}</small
                  >
                </li>`;
              })}
            </ul>
          </section>`
        : ""
    }
    ${
      kept.length
        ? html`<section class="panel" aria-labelledby="nr-rec-h">
            <h2 id="nr-rec-h">
              ${icon("record")}
              ${I.T("Recordings kept on this device", "Grabaciones guardadas en este dispositivo")}
            </h2>
            <p class="fine">
              ${I.T("Only you can play these. They are deleted after 30 days, or when you delete them.", "Solo tú puedes escucharlas. Se borran después de 30 días o cuando las borras.")}
            </p>
            ${keptList(I, kept)}
          </section>`
        : ""
    }
    <section class="panel" aria-labelledby="nr-pick-h">
      <h2 id="nr-pick-h">${I.T("Choose a story", "Elige una historia")}</h2>
      <div
        class="wl-filters"
        role="search"
        aria-label="${I.S("Find a story", "Buscar una historia")}"
      >
        <label class="wl-q"
          ><span>${I.T("Search", "Buscar")}</span><input type="search" data-nr-q value="${ui.q}"
        /></label>
        <select data-nr-kind aria-label="${I.S("Kind of story", "Tipo de historia")}">
          <option value="">${I.T("All kinds", "Todos los tipos")}</option>
          ${Object.entries(KIND).map(([k, v]) => html`<option value="${k}" ${ui.filter === k ? "selected" : ""}>${I.S(v[0], v[1])}</option>`)}
        </select>
      </div>
      <p class="fine" role="status">${I.T(`${list.length} stories`, `${list.length} historias`)}</p>
      <div class="task-grid">
        ${list.map(
          (p) =>
            html`<a class="card task-card nr-card" href="${href(p.id, band, "plan")}"
              >${picSvg(p.pic, "thumb")}<span class="task-top"
                ><span class="task-kind">${I.T(KIND[p.kind][0], KIND[p.kind][1])}</span
                >${st.stories[p.id] ? html`<span class="task-time">${icon("check")} ${I.T("Started", "Empezada")}</span>` : ""}</span
              ><strong class="task-title">${I.T(p.title, p.titleEs)}</strong
              ><span class="task-desc">${I.T(p.seed, p.seedEs)}</span></a
            >`,
        )}
      </div>
    </section>
    <p class="disclaimer">
      ${I.T("Practice on this device. Stories you write are saved only here. This is not a WIDA or ACCESS score.", "Práctica en este dispositivo. Las historias que escribes se guardan solo aquí. Esto no es un puntaje de WIDA ni de ACCESS.")}
    </p>`;
}

const keptList = (I, kept) =>
  html`<ul class="nr-kept">
    ${kept.map((r) => html`<li><span>${icon("wave")} ${new Date(r.t).toLocaleDateString()} · ${r.seconds || 0}s</span> <button type="button" class="btn small" data-nr-play="${r.id}">${icon("play")} ${I.T("Play", "Reproducir")}</button> <button type="button" class="btn small" data-nr-del="${r.id}" aria-label="${I.S("Delete this recording", "Borrar esta grabación")}">${icon("x")} ${I.T("Delete", "Borrar")}</button></li>`)}
  </ul>`;

function stepNav(I, band, id, step) {
  return html`<nav
    class="sk-modes nr-steps"
    aria-label="${I.S("Story steps", "Pasos de la historia")}"
  >
    ${STEPS.map(([k, en, es, ico], i) => html`<a class="sk-mode ${k === step ? "is-on" : ""}" href="${href(id, band, k)}" ${k === step ? html`aria-current="step"` : ""}>${icon(ico)} ${i + 1}. ${I.T(en, es)}</a>`)}
  </nav>`;
}

function planHTML(I, st, p, s, level) {
  const fmt = s.fmt || "article";
  return html`<section class="panel" aria-labelledby="nr-plan-h">
    <h2 id="nr-plan-h">${I.T("Plan your story with 5W1H", "Planea tu historia con 5W1H")}</h2>
    <p>${I.T(p.seed, p.seedEs)}</p>
    <p class="nr-ask">
      <b>${I.T("Questions a reporter would ask:", "Preguntas que haría un reportero:")}</b>
    </p>
    <ul>
      ${p.ask.map((q, i) => html`<li>${I.T(q, p.askEs[i])}</li>`)}
    </ul>
    <fieldset
      class="sk-levels"
      role="radiogroup"
      aria-label="${I.S("What are you making?", "¿Qué vas a hacer?")}"
    >
      <legend>${I.T("What are you making?", "¿Qué vas a hacer?")}</legend>
      ${Object.entries(FORMATS).map(([k, v]) => html`<button type="button" class="sk-level ${k === fmt ? "is-on" : ""}" data-nr-fmt="${k}" role="radio" aria-checked="${String(k === fmt)}">${I.T(v[0], v[1])}</button>`)}
    </fieldset>
    <div class="nr-w5">
      ${W5.map(
        ([k, en, es, hEn, hEs]) =>
          html`<label class="nr-w5-box"
            ><span
              ><b>${I.T(en, es)}</b>
              ${level === "A" ? html`<small>${I.T(hEn, hEs)}</small>` : ""}</span
            ><textarea rows="2" data-nr-w5="${k}">${s.w5?.[k] || ""}</textarea>
          </label>`,
      )}
    </div>
    <p class="fine" role="status">
      ${I.T(`${planCount(s.w5)} of 6 boxes filled.`, `${planCount(s.w5)} de 6 cuadros llenos.`)}
    </p>
  </section>`;
}

function framesFor(I, level, part, ui) {
  const open = level !== "C" || ui.help;
  if (!open)
    return html`<button type="button" class="btn small" data-nr-help>
      ${icon("bulb")} ${I.T("Show sentence frames", "Mostrar marcos de oraciones")}
    </button>`;
  return html`<div
    class="nr-frames"
    role="group"
    aria-label="${I.S("Sentence frames. Press one to add it.", "Marcos de oraciones. Pulsa uno para agregarlo.")}"
  >
    ${FRAMES[part].map(([en, es], i) => html`<button type="button" class="nr-frame" data-nr-frame="${part}|${i}">${en}${level === "A" || I.mode !== "en" ? html`<small lang="es">${es}</small>` : ""}</button>`)}
  </div>`;
}

function draftHTML(I, st, p, s, level) {
  const fmt = s.fmt || "article";
  const obs = observe(s.draft, s.w5, fmt);
  const wc = storyWords(s.draft, fmt);
  return html`<section class="panel" aria-labelledby="nr-draft-h">
    <h2 id="nr-draft-h">${I.T("Draft your story", "Redacta tu historia")}</h2>
    <details class="wl-details" ${level === "C" ? "" : "open"}>
      <summary>${icon("list")} ${I.T("My plan", "Mi plan")}</summary>
      <ul>
        ${W5.map(([k, en, es]) => html`<li><b>${I.T(en, es)}</b> ${s.w5?.[k] || "—"}</li>`)}
      </ul>
    </details>
    ${level === "A" ? html`<div class="wl-bank" aria-label="${I.S("Word bank", "Banco de palabras")}"><b>${I.T("Word bank", "Banco de palabras")}</b>${Object.keys(BANK).map((g) => html`<span class="wl-chips">${BANK[g].map((w, i) => html`<button type="button" class="wl-chip-link" data-nr-bank="${w}">${w}${I.mode !== "en" ? html` <small lang="es">${BANK_ES[g][i]}</small>` : ""}</button>`)}</span>`)}</div>` : ""}
    ${partsOf(fmt).map((part) => {
      const [en, es, tip] = PART_COPY[part];
      return html`<div class="nr-part">
        <label for="nr-p-${part}"><b>${I.T(en, es)}</b></label>
        <p class="fine">${I.T(tip, tipEs(part))}</p>
        ${framesFor(I, level, part, ui)}<textarea id="nr-p-${part}" rows="3" data-nr-part="${part}">
${s.draft?.[part] || ""}</textarea>
      </div>`;
    })}
    <p class="fine" role="status">${I.T(`${wc} words`, `${wc} palabras`)}</p>
    ${
      obs.length
        ? html`<div class="wl-feedback" role="status">
            <p>
              <b>${I.T("What I notice in your draft", "Lo que noto en tu borrador")}</b>
              <small
                >${I.T("(a rule-based check of your words, not a grade)", "(una revisión de tus palabras con reglas, no una calificación)")}</small
              >
            </p>
            <ul>
              ${obs.map((o) => html`<li>${icon(o.ok ? "check" : "bulb")} ${I.T(o.en, o.es)}</li>`)}
            </ul>
          </div>`
        : ""
    }
    <a class="btn btn-primary" href="${href(p.id, bandFor(currentBand), "read")}"
      >${I.T("Next: read it aloud", "Siguiente: léelo en voz alta")} ${icon("arrow-right")}</a
    >
  </section>`;
}
let currentBand = "6-8";
const TIPS_ES = {
  opener: "Saluda a la audiencia y nombra tu programa.",
  lead: "Di primero lo más importante: quién, qué, cuándo, dónde.",
  details: "Agrega por qué y cómo. Usa palabras como primero, luego, porque.",
  quote: "Agrega lo que dijo una persona, entre comillas.",
  ending: "Di qué pasa después o cómo pueden ayudar los lectores.",
  signoff: "Da las gracias a la audiencia y despídete.",
};
const tipEs = (part) => TIPS_ES[part];

async function readHTML(ctx, I, st, p, s, level) {
  const fmt = s.fmt || "article";
  const text = storyText(s.draft, fmt);
  const key = `nr:${p.id}`;
  const takes = takesFor(key);
  const kept = (await audioStore.list()).filter((r) => r.task === `newsroom:${p.id}`);
  return html`<section class="panel" aria-labelledby="nr-read-h">
    <h2 id="nr-read-h">${I.T("Read your story aloud", "Lee tu historia en voz alta")}</h2>
    ${
      text
        ? html`<blockquote class="nr-script">${text}</blockquote>
            <div class="wl-actions">
              ${speakBtn(I, text, I.S("Hear my story read to me", "Escuchar mi historia"))}
            </div>`
        : html`<p class="wl-warn">
            ${icon("alert")}
            ${I.T("Your story is empty. Write it in the Draft step first.", "Tu historia está vacía. Primero escríbela en el paso Redactar.")}
          </p>`
    }
    <p>
      ${I.T("Read it like a reporter: clear voice, short pauses at commas and periods. Record, listen, and record again if you want a better take. Nothing is timed.", "Léela como un reportero: voz clara y pausas cortas en comas y puntos. Graba, escucha y vuelve a grabar si quieres una mejor toma. Nada tiene tiempo.")}
    </p>
    ${recorderHTML(key, { recording: isRecording(key), i18n: I })}
    ${
      takes.length
        ? html`<ul class="nr-keep-list">
            ${takes.map((t, i) => html`<li>${I.T(`Try ${i + 1}`, `Intento ${i + 1}`)} · ${t.seconds}s <button type="button" class="btn small" data-nr-keep="${t.id}">${icon("save")} ${I.T("Keep on this device", "Guardar en este dispositivo")}</button></li>`)}
          </ul>`
        : ""
    }
    ${
      kept.length
        ? html`<h3>${I.T("Kept for this story", "Guardadas para esta historia")}</h3>
            ${keptList(I, kept)}`
        : ""
    }
    <a class="btn btn-primary" href="${href(p.id, bandFor(ctx.band), "front")}"
      >${I.T("Next: headline and picture", "Siguiente: titular e imagen")} ${icon("arrow-right")}</a
    >
  </section>`;
}

function frontHTML(ctx, I, st, p, s, level) {
  const band = bandFor(ctx.band);
  const hc = headlineCheck(s.head || "");
  const pic = s.pic && PICS[s.pic] ? PICS[s.pic] : null;
  const page = frontPageHTML({
    story: s,
    prompt: p,
    pic: pic && [I.S(pic[0], pic[1]), pic[1], pic[2]],
    kindLabel: I.S(FORMATS[s.fmt || "article"][0], FORMATS[s.fmt || "article"][1]),
    date: new Date().toLocaleDateString(),
    footer: I.S(
      "Made in the Newsroom, thelanguagepage.com · student practice",
      "Hecho en la Sala de redacción, thelanguagepage.com · práctica de estudiantes",
    ),
  });
  return html`<section class="panel no-print" aria-labelledby="nr-front-h">
      <h2 id="nr-front-h">${I.T("Headline and picture", "Titular e imagen")}</h2>
      <label class="nr-field"
        ><span>${I.T("Headline", "Titular")}</span
        ><input
          type="text"
          data-nr-head
          value="${s.head || ""}"
          maxlength="120"
          placeholder="${level === "A" ? p.title : ""}"
      /></label>
      ${s.head ? html`<p class="fine ${hc.ok ? "is-right" : ""}" role="status">${icon(hc.ok ? "check" : "bulb")} ${I.T(hc.en, hc.es)}</p>` : ""}
      <fieldset class="nr-pics" role="radiogroup">
        <legend>${I.T("Choose a picture", "Elige una imagen")}</legend>
        ${PIC_IDS.map((id) => html`<button type="button" class="nr-pic-btn ${s.pic === id ? "is-on" : ""}" data-nr-pic="${id}" role="radio" aria-checked="${String(s.pic === id)}" aria-label="${I.S(PICS[id][0], PICS[id][1])}">${picSvg(id)}<span>${I.T(PICS[id][0], PICS[id][1])}</span></button>`)}
      </fieldset>
      <label class="nr-field"
        ><span>${I.T("Caption (optional)", "Pie de foto (opcional)")}</span
        ><input type="text" data-nr-cap value="${s.cap || ""}" maxlength="140"
      /></label>
      <div class="nr-field-row">
        <label class="nr-field"
          ><span>${I.T("Newspaper name", "Nombre del periódico")}</span
          ><input
            type="text"
            data-nr-paper
            value="${s.paper || ""}"
            maxlength="40"
            placeholder="Our Class News"
        /></label>
        <label class="nr-field"
          ><span>${I.T("By (your name or a nickname)", "Por (tu nombre o apodo)")}</span
          ><input type="text" data-nr-by value="${s.by || ""}" maxlength="40"
        /></label>
      </div>
      <p class="fine">
        ${I.T("Your name is only printed on your page. It is not sent anywhere.", "Tu nombre solo se imprime en tu página. No se envía a ningún lugar.")}
      </p>
      <div class="wl-actions">
        <button type="button" class="btn btn-primary" data-nr-print>
          ${icon("print")} ${I.T("Print my front page", "Imprimir mi portada")}</button
        ><button type="button" class="btn" data-nr-dl>
          ${icon("download")} ${I.T("Download my page", "Descargar mi página")}</button
        ><a class="btn" href="${href(p.id, band, "draft")}"
          >${icon("writing")} ${I.T("Back to my draft", "Volver a mi borrador")}</a
        >
      </div>
    </section>
    <style>
      ${raw(SHEET_CSS)}</style
    >${raw(page)}`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const id = ctx.route.id || "";
  const step = STEPS.some((x) => x[0] === ctx.route.tab) ? ctx.route.tab : "plan";
  currentBand = bandFor(ctx.band);
  if (current.id !== id) ui = { filter: "", q: "", help: false, last: "", kept: [] };
  current = { id, step };
  const st = state();
  const title = I.S("Newsroom", "Sala de redacción");
  const p = NEWS_PROMPTS.find((x) => x.id === id);
  if (!p) return { title, html: await hubHTML(ctx, I, st) };
  const s = (st.stories[p.id] ||= { fmt: "article", w5: {}, draft: {} });
  const level = levelOf(st);
  const band = bandFor(ctx.band);
  const body =
    step === "plan"
      ? planHTML(I, st, p, s, level)
      : step === "draft"
        ? draftHTML(I, st, p, s, level)
        : step === "read"
          ? await readHTML(ctx, I, st, p, s, level)
          : frontHTML(ctx, I, st, p, s, level);
  return {
    title: `${I.S(p.title, p.titleEs)} · ${title}`,
    html: html`${studioCrumbs(I, band, "newsroom", title, I.S(p.title, p.titleEs))}
      <div class="nr-studio d-writing no-print-chrome">
        <header class="wl-head no-print">
          <h1 tabindex="-1">${picSvg(p.pic, "mini")} ${I.T(p.title, p.titleEs)}</h1>
        </header>
        <div class="no-print">${stepNav(I, band, p.id, step)}${levelPickerHTML(I, level, "data-sk-level", true)}</div>
        ${body}
      </div>`,
  };
}

const field = (e) =>
  e.target.closest?.(
    "[data-nr-w5],[data-nr-part],[data-nr-head],[data-nr-by],[data-nr-paper],[data-nr-cap]",
  );
function store(st, el, p) {
  const s = (st.stories[p] ||= { fmt: "article", w5: {}, draft: {} });
  const v = el.value.slice(0, 1500);
  if (el.dataset.nrW5) (s.w5 ||= {})[el.dataset.nrW5] = v;
  else if (el.dataset.nrPart)
    (((s.draft ||= {})[el.dataset.nrPart] = v), (ui.last = el.dataset.nrPart));
  else if (el.dataset.nrHead !== undefined) s.head = v.slice(0, 120);
  else if (el.dataset.nrBy !== undefined) s.by = v.slice(0, 40);
  else if (el.dataset.nrPaper !== undefined) s.paper = v.slice(0, 40);
  else if (el.dataset.nrCap !== undefined) s.cap = v.slice(0, 140);
}
export function onInput(e, ctx) {
  const el = field(e);
  if (!el || !current.id) return;
  const st = state();
  store(st, el, current.id);
  save(st);
}
export function onChange(e, ctx) {
  const t = e.target;
  if (t.matches?.("[data-nr-q]")) return ((ui.q = t.value), renderAfterChange(ctx));
  if (t.matches?.("[data-nr-kind]")) return ((ui.filter = t.value), renderAfterChange(ctx));
  const el = field(e);
  if (!el || !current.id) return;
  const st = state();
  store(st, el, current.id);
  const s = st.stories[current.id];
  const p = NEWS_PROMPTS.find((x) => x.id === current.id);
  const m = { w5: planCount(s.w5) };
  if (planCount(s.w5) >= 5) evidence(st, ctx, `${p.id}|plan`, "Writing", m);
  const wc = storyWords(s.draft, s.fmt);
  if (current.step === "draft" && wc >= 30) {
    const obs = observe(s.draft, s.w5, s.fmt || "article");
    evidence(
      st,
      ctx,
      `${p.id}|draft`,
      "Writing",
      {
        words: wc,
        quote: obs.find((o) => o.id === "quote")?.ok ? 1 : 0,
        links: obs.find((o) => o.id === "links")?.ok ? 1 : 0,
      },
      ui.help ? { frames: true } : {},
    );
  }
  save(st);
  renderAfterChange(ctx);
}

function download(s, p, I, ctx) {
  const pic = s.pic && PICS[s.pic] ? PICS[s.pic] : null;
  const page = frontPageHTML({
    story: s,
    prompt: p,
    pic: pic && [pic[0], pic[1], pic[2]],
    kindLabel: FORMATS[s.fmt || "article"][0],
    date: new Date().toLocaleDateString(),
    footer: "Made in the Newsroom, thelanguagepage.com · student practice",
  });
  const blob = new Blob([sheetDocument(page, s.head || p.title)], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "front-page.html";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target;
  const st = state();
  const lvl = t.closest("[data-sk-level]");
  if (lvl && LEVELS.includes(lvl.dataset.skLevel)) {
    st.level = lvl.dataset.skLevel;
    save(st);
    return (ctx.rerender(), true);
  }
  const id = current.id;
  const p = NEWS_PROMPTS.find((x) => x.id === id);
  if (!p) return false;
  const s = (st.stories[id] ||= { fmt: "article", w5: {}, draft: {} });
  const fmt = t.closest("[data-nr-fmt]");
  if (fmt) return ((s.fmt = fmt.dataset.nrFmt), save(st), ctx.rerender(), true);
  if (t.closest("[data-nr-help]")) return ((ui.help = true), ctx.rerender(), true);
  const frame = t.closest("[data-nr-frame]");
  const bank = t.closest("[data-nr-bank]");
  if (frame || bank) {
    const part = frame
      ? frame.dataset.nrFrame.split("|")[0]
      : ui.last || partsOf(s.fmt || "article")[0];
    const text = frame
      ? FRAMES[part][Number(frame.dataset.nrFrame.split("|")[1])][0]
      : bank.dataset.nrBank;
    (s.draft ||= {})[part] = `${(s.draft[part] || "").trim()} ${text}`.trim();
    ui.last = part;
    save(st);
    announce(I.S("Added to your draft.", "Agregado a tu borrador."));
    return (ctx.rerender(), true);
  }
  const pic = t.closest("[data-nr-pic]");
  if (pic) return ((s.pic = pic.dataset.nrPic), save(st), ctx.rerender(), true);
  const keep = t.closest("[data-nr-keep]");
  if (keep) {
    const take = takesFor(`nr:${id}`).find((x) => x.id === keep.dataset.nrKeep);
    if (take)
      audioStore.keep(take, `newsroom:${id}`).then((ok) => {
        announce(
          ok
            ? I.S("Kept on this device.", "Guardada en este dispositivo.")
            : I.S(
                "This browser could not keep the recording.",
                "Este navegador no pudo guardar la grabación.",
              ),
        );
        if (ok) {
          const st2 = state();
          evidence(st2, ctx, `${id}|read`, "Speaking", {
            takes: takesFor(`nr:${id}`).length,
            kept: 1,
            seconds: take.seconds,
          });
          save(st2);
        }
        ctx.rerender();
      });
    return true;
  }
  const play = t.closest("[data-nr-play]");
  if (play) {
    audioStore.urlFor(play.dataset.nrPlay).then((url) => {
      if (!url) return;
      const a = new Audio(url);
      a.addEventListener("ended", () => URL.revokeObjectURL(url));
      a.play().catch(() => {});
    });
    return true;
  }
  const del = t.closest("[data-nr-del]");
  if (del) return (audioStore.remove(del.dataset.nrDel).then(() => ctx.rerender()), true);
  if (t.closest("[data-nr-print]") || t.closest("[data-nr-dl]")) {
    const isPrint = Boolean(t.closest("[data-nr-print]"));
    evidence(st, ctx, `${id}|publish`, "Writing", {
      words: storyWords(s.draft, s.fmt),
      headline: s.head ? 1 : 0,
      picture: s.pic ? 1 : 0,
      recorded: takesFor(`nr:${id}`).length ? 1 : 0,
    });
    save(st);
    if (isPrint) window.print();
    else download(s, p, I, ctx);
    return true;
  }
  return false;
}

export function onRecorded(key, ctx) {
  const st = state();
  const id = String(key).replace(/^nr:/, "");
  const n = takesFor(key).length;
  evidence(st, ctx || { band: "6-8" }, `${id}|read`, "Speaking", {
    takes: n,
    kept: 0,
    seconds: takesFor(key).at(-1)?.seconds || 0,
  });
  save(st);
}
export function unmount() {
  ui = { filter: "", q: "", help: false, last: "", kept: [] };
}
export { esc };
