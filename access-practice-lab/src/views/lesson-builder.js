// Lesson Builder (One-Click Teacher Studio): a whole lesson sequence assembled from real lab activities.
// Assembly rules live in ../lesson-builder/assemble.js; tables (functions, frames, support presets) in rules.js.
// Privacy: like the Launch Studio, a share link holds only instructional settings and public activity ids. Edited
// text and saved configurations stay in this browser (localStorage); no roster, name, response or progress is
// encoded, sent or collected here.
import { bandLabel, bandLabelEs } from "../bands.js";
import { bandRows } from "../content.js";
import { crumbsHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { BASE, DOMAIN_META, TIERS, html, icon, storage } from "../util.js";
import { activityHref } from "./room.js";
import { printLessonPlan } from "../lesson-builder/print.js";
import {
  assembleLesson,
  candidatesFor,
  decodeShare,
  encodeShare,
  lessonFromShare,
  normalizeSettings,
  parseSaved,
  restorePhase,
  swapActivity,
  totalMinutes,
} from "../lesson-builder/assemble.js";
import {
  BUILDER_BANDS,
  BUILDER_DOMAINS,
  DURATIONS,
  FUNCTION_KEYS,
  FUNCTIONS,
  KLU_ES,
  PHASES,
  SUPPORT_KEYS,
  SUPPORT_NOTE,
  SUPPORT_PROFILES,
  TOPIC_SUGGESTIONS,
} from "../lesson-builder/rules.js";

const SAVED_KEY = "lp-lesson-builder:v1";
const LAST_KEY = "lp-lesson-builder:last";
const MAX_SAVED = 20;
const state = {
  settings: null,
  lesson: null,
  rows: [],
  rowsBand: "",
  search: null,
  saveName: "",
  savePick: "",
  dirty: false,
  status: "",
};
let I = makeI18n("en");
const tp = (pair) => I.T(pair[0], pair[1]);
const sp = (pair) => I.S(pair[0], pair[1]);
const domainName = (d) => I.S(d, DOMAIN_META[d]?.es);

function readSaved() {
  try {
    return parseSaved(storage.get(SAVED_KEY));
  } catch {
    return {};
  }
}
function writeJson(key, value) {
  try {
    return storage.set(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
function lastSettings() {
  try {
    return JSON.parse(storage.get(LAST_KEY) || "null");
  } catch {
    return null;
  }
}

async function ensureRows(band) {
  if (state.rowsBand === band) return;
  try {
    state.rows = (await bandRows(band)).filter((r) => BUILDER_DOMAINS.includes(r.domain));
  } catch {
    state.rows = [];
  }
  state.rowsBand = band;
}

const rowById = (id) => state.rows.find((r) => r.id === id) || null;

function phaseHref(phase) {
  const band = state.lesson.settings.band;
  if (phase.key === "family") return `${BASE}/practice-together?grades=${band}`;
  const row = rowById(phase.activityId);
  if (!row) return "";
  const url = new URL(activityHref(row.domain, row.level, row.id), location.origin);
  url.searchParams.set("grades", band);
  if (phase.mode === "independent") url.searchParams.set("mode", "independent");
  return url.pathname + url.search;
}

const shareUrl = () => `${location.origin}${BASE}/lesson-builder?${encodeShare(state.lesson)}`;

// ── setup form ────────────────────────────────────────────────────────────────
function radios(name, items, selected) {
  return items.map(
    ({ value, label, hint }) =>
      html`<label class="lb-choice"
        ><input
          type="radio"
          name="${name}"
          value="${value}"
          data-lb-set="${name}"
          ${String(value) === String(selected) ? "checked" : ""}
        /><span><strong>${label}</strong>${hint ? html`<small>${hint}</small>` : ""}</span></label
      >`,
  );
}

function setupHTML(s) {
  const fnOptions = FUNCTION_KEYS.map(
    (k) =>
      html`<option value="${k}" ${s.fn === k ? "selected" : ""}>${sp(FUNCTIONS[k].label)}</option>`,
  );
  const supports = SUPPORT_KEYS.map((k) => ({
    value: k,
    label: sp(SUPPORT_PROFILES[k].name),
    hint: `${sp(SUPPORT_PROFILES[k].plain)} ${sp(SUPPORT_PROFILES[k].wida)}.`,
  }));
  const durations = DURATIONS.map((m) => ({ value: m, label: `${m} min` }));
  return html`<section class="panel lb-setup" aria-labelledby="lb-setup-title">
    <h2 id="lb-setup-title" class="workbook-heading">
      <span aria-hidden="true">1</span>
      ${I.T("Choose your class and goal", "Elija su clase y su meta")}
    </h2>
    <div class="lb-grid">
      <label class="field"
        >${I.T("Grade band", "Nivel de grados")}<select data-lb-set="band">
          ${BUILDER_BANDS.map((b) => html`<option value="${b}" ${s.band === b ? "selected" : ""}>${I.S(bandLabel(b), bandLabelEs(b))}</option>`)}
        </select></label
      >
      <label class="field"
        >${I.T("Language function", "Función del lenguaje")}<select data-lb-set="fn">
          ${fnOptions}
        </select></label
      >
      <label class="field"
        >${I.T("Skill or topic (optional)", "Destreza o tema (opcional)")}<input
          type="text"
          maxlength="60"
          list="lb-topics"
          value="${s.topic}"
          data-lb-set="topic"
          placeholder="${I.S("e.g. science, community", "p. ej., ciencias, comunidad")}"
        /><datalist id="lb-topics">
          ${TOPIC_SUGGESTIONS.map((t) => html`<option value="${t}"></option>`)}
        </datalist></label
      >
    </div>
    <fieldset class="lb-fieldset">
      <legend>${I.T("Language domains", "Dominios del lenguaje")}</legend>
      <div class="lb-row">
        ${BUILDER_DOMAINS.map(
          (d) =>
            html`<label class="lb-check"
              ><input
                type="checkbox"
                value="${d}"
                data-lb-domain
                ${s.domains.includes(d) ? "checked" : ""}
              />
              ${domainName(d)}</label
            >`,
        )}
      </div>
    </fieldset>
    <fieldset class="lb-fieldset">
      <legend>${I.T("Support profile", "Perfil de apoyo")}</legend>
      <div class="lb-choices">${radios("support", supports, s.support)}</div>
      <p class="fine">${tp(SUPPORT_NOTE)}</p>
    </fieldset>
    <fieldset class="lb-fieldset">
      <legend>${I.T("Lesson length", "Duración de la lección")}</legend>
      <div class="lb-row lb-durations">${radios("minutes", durations, s.minutes)}</div>
    </fieldset>
    <div class="row-actions">
      <button type="button" class="btn btn-primary btn-big" data-lb-build>
        ${icon("sparkle")} ${I.T("Build my lesson", "Crear mi lección")}
      </button>
      ${state.dirty && state.lesson ? html`<span class="fine" role="status">${I.T("Your choices changed. Build again to update the lesson (this replaces your edits).", "Sus opciones cambiaron. Vuelva a crear la lección para actualizarla (esto reemplaza sus cambios).")}</span>` : ""}
    </div>
    ${savedHTML()}
  </section>`;
}

function savedHTML() {
  const names = Object.keys(readSaved()).sort();
  if (!names.length)
    return html`<p class="fine">
      ${I.T("Tip: save a lesson below and it will be here next time, so you can skip setup.", "Consejo: guarde una lección abajo y estará aquí la próxima vez, para que no tenga que configurarla de nuevo.")}
    </p>`;
  if (!names.includes(state.savePick)) state.savePick = names[0];
  return html`<div class="lb-saved">
    <label class="field"
      >${I.T("Saved lessons on this device", "Lecciones guardadas en este dispositivo")}<select
        data-lb-pick
      >
        ${names.map((n) => html`<option value="${n}" ${n === state.savePick ? "selected" : ""}>${n}</option>`)}
      </select></label
    >
    <div class="row-actions">
      <button type="button" class="btn" data-lb-load>
        ${I.T("Open saved lesson", "Abrir lección guardada")}</button
      ><button type="button" class="btn ghost" data-lb-delete>${I.T("Delete", "Eliminar")}</button>
    </div>
  </div>`;
}

// ── lesson plan ───────────────────────────────────────────────────────────────
function activityHTML(phase, i) {
  const def = PHASES[phase.key];
  if (def.pick === "none") return "";
  const href = phaseHref(phase);
  if (def.pick === "family")
    return html`<div class="lb-activity">
      <a class="btn small" href="${href}" target="_blank" rel="noopener"
        >${icon("families")} ${I.T("Open Practice Together", "Abrir Practicar juntos")}
        ${icon("external")}</a
      >
    </div>`;
  const row = rowById(phase.activityId);
  const used = new Set(
    state.lesson.phases.map((p) => p.activityId).filter((id) => id && id !== phase.activityId),
  );
  const options =
    def.pick === "repeat"
      ? state.lesson.phases
          .filter((p) => p !== phase && p.activityId)
          .map((p) => rowById(p.activityId))
          .filter(Boolean)
      : candidatesFor(
          state.rows,
          state.lesson.settings,
          phase.key,
          phase.minutes || 10,
          used,
        ).slice(0, 15);
  if (row && !options.includes(row)) options.unshift(row);
  return html`<div class="lb-activity">
    ${row ? html`<p class="lb-activity-name"><strong>${row.title}</strong> <span class="fine">${domainName(row.domain)} · ${I.S(`${TIERS[row.level]?.name} support`, `Apoyo: ${TIERS[row.level]?.es}`)} · ${row.minutes || "—"} min${phase.mode === "independent" ? ` · ${I.S("independent mode", "modo independiente")}` : ""}</span></p>` : html`<p class="fine" role="note">${I.T("No matching activity. Choose one below or use your own materials.", "No hay actividad que coincida. Elija una abajo o use sus propios materiales.")}</p>`}
    <div class="lb-activity-row">
      ${
        options.length
          ? html`<label class="field lb-swap"
              >${I.T("Swap activity", "Cambiar actividad")}<select data-lb-swap="${i}">
                ${options.map((r) => html`<option value="${r.id}" ${r.id === phase.activityId ? "selected" : ""}>${r.title} · ${domainName(r.domain)} · ${r.level} · ${r.minutes || "—"} min</option>`)}
              </select></label
            >`
          : ""
      }
      ${href ? html`<a class="btn small" href="${href}" target="_blank" rel="noopener">${icon("play")} ${I.T("Preview student view", "Ver la vista del estudiante")} ${icon("external")}</a>` : ""}
    </div>
  </div>`;
}

function phaseHTML(phase, i, count) {
  const name = PHASES[phase.key].name;
  const id = `lb-phase-${i}`;
  return html`<li class="lb-phase" aria-labelledby="${id}">
    <div class="lb-phase-head">
      <h3 id="${id}">
        <span class="lb-num">${i + 1}</span> ${tp(name)}
        <span class="lb-min"
          >${phase.minutes ? `${phase.minutes} min` : I.S("at home", "en casa")}</span
        >
      </h3>
      <div
        class="lb-tools"
        role="group"
        aria-label="${I.S(`Arrange ${name[0]}`, `Ordenar: ${name[1]}`)}"
      >
        <button
          type="button"
          class="btn small ghost"
          data-lb-move="${i}:-1"
          ${i === 0 ? "disabled" : ""}
          aria-label="${I.S(`Move ${name[0]} up`, `Subir ${name[1]}`)}"
        >
          ↑
        </button>
        <button
          type="button"
          class="btn small ghost"
          data-lb-move="${i}:1"
          ${i === count - 1 ? "disabled" : ""}
          aria-label="${I.S(`Move ${name[0]} down`, `Bajar ${name[1]}`)}"
        >
          ↓
        </button>
        <button
          type="button"
          class="btn small ghost"
          data-lb-remove="${i}"
          aria-label="${I.S(`Remove ${name[0]}`, `Quitar ${name[1]}`)}"
        >
          ${icon("x")}
        </button>
      </div>
    </div>
    ${activityHTML(phase, i)}
    <label class="field"
      >${I.T("Teacher directions", "Instrucciones para el docente")}<textarea
        rows="3"
        data-lb-text="${i}:teacher"
      >
${phase.teacher}</textarea>
    </label>
    <label class="field"
      >${I.T("Student-facing text", "Texto para los estudiantes")}<textarea
        rows="2"
        lang="en"
        data-lb-text="${i}:student"
      >
${phase.student}</textarea>
    </label>
    ${
      ["opening", "guided", "task", "exit", "vocabulary"].includes(phase.key)
        ? html`<div class="lb-supports" lang="en">
            ${
              phase.key === "vocabulary"
                ? html`<p>
                    <strong>${I.T("Word bank", "Banco de palabras")}:</strong>
                    ${phase.words.join(" · ")}
                  </p>`
                : html`<p><strong>${I.T("Sentence frames", "Marcos de oraciones")}:</strong></p>
                    <ul>
                      ${phase.frames.map((f) => html`<li>${f}</li>`)}
                    </ul>`
            }
          </div>`
        : ""
    }
  </li>`;
}

function planHTML() {
  const lesson = state.lesson;
  const s = lesson.settings;
  const total = totalMinutes(lesson);
  const fn = FUNCTIONS[s.fn];
  return html`<section class="panel lb-plan" aria-labelledby="lb-plan-title">
      <h2 id="lb-plan-title" class="workbook-heading">
        <span aria-hidden="true">2</span>
        ${I.T("Review and edit your lesson", "Revise y edite su lección")}
      </h2>
      <p class="lb-meta">
        ${I.S(bandLabel(s.band), bandLabelEs(s.band))} · ${s.domains.map(domainName).join(", ")} ·
        ${sp(fn.label)}
        (${I.S(`WIDA Key Language Use: ${fn.klu}`, `Uso clave del lenguaje WIDA: ${KLU_ES[fn.klu]}`)})
        · ${sp(SUPPORT_PROFILES[s.support].name)} · <strong>${total} / ${s.minutes} min</strong>
      </p>
      <div class="lb-objectives">
        <label class="field"
          >${I.T("Content objective (student-friendly)", "Objetivo de contenido (para estudiantes)")}<textarea
            rows="2"
            lang="en"
            data-lb-obj="content"
          >
${lesson.objectives.content}</textarea>
        </label>
        <label class="field"
          >${I.T("Language objective (student-friendly)", "Objetivo de lenguaje (para estudiantes)")}<textarea
            rows="2"
            lang="en"
            data-lb-obj="language"
          >
${lesson.objectives.language}</textarea>
        </label>
      </div>
      <ol class="lb-phases">
        ${lesson.phases.map((p, i) => phaseHTML(p, i, lesson.phases.length))}
      </ol>
      ${
        lesson.removed.length
          ? html`<div class="lb-removed">
              <p>${I.T("Removed phases:", "Fases quitadas:")}</p>
              <div class="row-actions">
                ${lesson.removed.map((k) => html`<button type="button" class="btn small" data-lb-restore="${k}">+ ${tp(PHASES[k].name)}</button>`)}
              </div>
            </div>`
          : ""
      }
    </section>
    <section class="panel lb-share" aria-labelledby="lb-share-title">
      <h2 id="lb-share-title" class="workbook-heading">
        <span aria-hidden="true">3</span>
        ${I.T("Print, share or save", "Imprimir, compartir o guardar")}
      </h2>
      <div class="row-actions">
        <button type="button" class="btn btn-primary" data-lb-print>
          ${icon("print")} ${I.T("Print lesson plan", "Imprimir plan de lección")}</button
        ><button type="button" class="btn" data-lb-copy>
          ${icon("copy")} ${I.T("Copy share link", "Copiar enlace para compartir")}
        </button>
      </div>
      <label class="field"
        >${I.T("Share link", "Enlace para compartir")}<input
          type="url"
          readonly
          value="${shareUrl()}"
          data-lb-url
      /></label>
      <p class="fine">
        ${I.T("The link holds only your settings and the activity choices. Text you edit is not in the link; save the lesson to keep it.", "El enlace contiene solo sus opciones y las actividades elegidas. El texto que edite no va en el enlace; guarde la lección para conservarlo.")}
      </p>
      <div class="lb-save-row">
        <label class="field"
          >${I.T("Lesson name", "Nombre de la lección")}<input
            type="text"
            maxlength="60"
            value="${state.saveName}"
            data-lb-name
            placeholder="${I.S("e.g. Period 3 explain", "p. ej., Periodo 3 explicar")}" /></label
        ><button type="button" class="btn" data-lb-save>
          ${icon("save")} ${I.T("Save on this device", "Guardar en este dispositivo")}
        </button>
      </div>
    </section>`;
}

// ── view ──────────────────────────────────────────────────────────────────────
export async function render(ctx) {
  I = i18nFor(ctx);
  if (state.search !== location.search) {
    state.search = location.search;
    const shared = decodeShare(location.search);
    if (shared.has) {
      state.settings = shared.settings;
      await ensureRows(state.settings.band);
      state.lesson = shared.seq ? lessonFromShare(location.search, state.rows) : null;
      state.dirty = false;
    }
  }
  if (!state.settings)
    state.settings = normalizeSettings(
      lastSettings() || { band: BUILDER_BANDS.includes(ctx.band) ? ctx.band : "6-8" },
    );
  await ensureRows(state.settings.band);
  const title = I.S("Lesson Builder", "Creador de lecciones");
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${state.settings.band}`],
        [I.S("Teacher Launch Studio", "Estudio de lanzamiento docente"), `${BASE}/launch-studio`],
        [title, null],
      ])}
      <div class="ls lb">
        <section class="ls-hero">
          <div>
            <p class="eyebrow">${icon("teacher")} ${I.T("Teacher workspace", "Espacio docente")}</p>
            <h1 tabindex="-1">${I.T("Lesson Builder", "Creador de lecciones")}</h1>
            <p class="lead">
              ${I.T("Pick a goal and a support profile, then build a whole lesson from real Language Page activities in one click. Every part stays editable.", "Elija una meta y un perfil de apoyo, y cree una lección completa con actividades reales de The Language Page con un clic. Todo se puede editar.")}
            </p>
          </div>
          <p class="lb-privacy">
            ${icon("lock")}
            ${I.T("Student progress stays on each student's device unless you use the class tools. This builder does not collect evidence automatically.", "El progreso de cada estudiante se queda en su dispositivo, a menos que use las herramientas de clase. Este creador no recoge evidencias automáticamente.")}
          </p>
        </section>
        ${setupHTML(state.settings)}
        ${state.lesson ? planHTML() : html`<p class="fine lb-empty">${I.T("Your lesson will appear here.", "Su lección aparecerá aquí.")}</p>`}
        <p class="fine" data-lb-status role="status" aria-live="polite">${state.status}</p>
      </div>`,
  };
}

function setStatus(text) {
  state.status = text;
  const el = document.querySelector("[data-lb-status]");
  if (el) el.textContent = text;
}

export async function onChange(e, ctx) {
  const t = e.target;
  if (t.matches("[data-lb-domain]")) {
    const set = new Set(state.settings.domains);
    if (t.checked) set.add(t.value);
    else if (set.size > 1) set.delete(t.value);
    else {
      t.checked = true;
      setStatus(
        I.S("Keep at least one language domain.", "Deje al menos un dominio del lenguaje."),
      );
      return;
    }
    state.settings = normalizeSettings({
      ...state.settings,
      domains: BUILDER_DOMAINS.filter((d) => set.has(d)),
    });
    state.dirty = true;
    ctx.rerender();
    return;
  }
  const field = t.dataset.lbSet;
  if (field) {
    state.settings = normalizeSettings({ ...state.settings, [field]: t.value });
    state.dirty = true;
    if (field === "band") {
      ctx.setBand?.(state.settings.band);
      await ensureRows(state.settings.band);
    }
    if (field !== "topic") ctx.rerender();
    return;
  }
  if (t.matches("[data-lb-swap]") && state.lesson) {
    const i = Number(t.dataset.lbSwap);
    if (swapActivity(state.lesson, i, t.value, state.rows))
      setStatus(I.S("Activity swapped.", "Actividad cambiada."));
    ctx.rerender();
    return;
  }
  if (t.matches("[data-lb-pick]")) state.savePick = t.value;
}

export function onInput(e) {
  const t = e.target;
  if (t.matches("[data-lb-set='topic']")) {
    state.settings = normalizeSettings({ ...state.settings, topic: t.value });
    state.dirty = Boolean(state.lesson);
  } else if (t.matches("[data-lb-name]")) state.saveName = t.value.slice(0, 60);
  else if (t.matches("[data-lb-obj]") && state.lesson)
    state.lesson.objectives[t.dataset.lbObj] = t.value;
  else if (t.matches("[data-lb-text]") && state.lesson) {
    const [i, field] = t.dataset.lbText.split(":");
    const phase = state.lesson.phases[Number(i)];
    if (phase && (field === "teacher" || field === "student"))
      Object.assign(phase, { [field]: t.value, edited: true });
  }
}

export function onClick(e, ctx) {
  const t = e.target.closest("button, a");
  if (!t) return false;
  const lesson = state.lesson;
  if (t.matches("[data-lb-build]")) {
    state.lesson = assembleLesson(state.settings, state.rows);
    state.dirty = false;
    writeJson(LAST_KEY, state.lesson.settings);
    setStatus(
      I.S(
        `Lesson built: ${state.lesson.phases.length} phases.`,
        `Lección creada: ${state.lesson.phases.length} fases.`,
      ),
    );
    ctx.rerender();
    return true;
  }
  if (t.matches("[data-lb-move]") && lesson) {
    const [i, d] = t.dataset.lbMove.split(":").map(Number);
    const j = i + d;
    if (j < 0 || j >= lesson.phases.length) return true;
    [lesson.phases[i], lesson.phases[j]] = [lesson.phases[j], lesson.phases[i]];
    setStatus(I.S("Phase moved.", "Fase movida."));
    ctx.rerender();
    return true;
  }
  if (t.matches("[data-lb-remove]") && lesson) {
    const [removed] = lesson.phases.splice(Number(t.dataset.lbRemove), 1);
    if (removed) lesson.removed.push(removed.key);
    setStatus(
      I.S(
        "Phase removed. You can add it back below the lesson.",
        "Fase quitada. Puede volver a agregarla debajo de la lección.",
      ),
    );
    ctx.rerender();
    return true;
  }
  if (t.matches("[data-lb-restore]") && lesson) {
    restorePhase(lesson, t.dataset.lbRestore, state.rows);
    ctx.rerender();
    return true;
  }
  if (t.matches("[data-lb-print]") && lesson) {
    printLessonPlan(state.lesson, { rowById, phaseHref });
    return true;
  }
  if (t.matches("[data-lb-copy]") && lesson) {
    copyShare();
    return true;
  }
  if (t.matches("[data-lb-save]") && lesson) {
    saveLesson();
    ctx.rerender();
    return true;
  }
  if (t.matches("[data-lb-load]")) {
    const entry = readSaved()[state.savePick];
    if (entry) {
      state.lesson = entry.lesson;
      state.settings = entry.lesson.settings;
      state.saveName = state.savePick;
      state.dirty = false;
      ctx.setBand?.(state.settings.band);
      ensureRows(state.settings.band).then(() => ctx.rerender());
      setStatus(I.S(`Opened "${state.savePick}".`, `Se abrió "${state.savePick}".`));
    }
    return true;
  }
  if (t.matches("[data-lb-delete]")) {
    const all = readSaved();
    delete all[state.savePick];
    writeJson(SAVED_KEY, all);
    setStatus(
      I.S(
        "Saved lesson deleted from this device.",
        "Lección guardada eliminada de este dispositivo.",
      ),
    );
    ctx.rerender();
    return true;
  }
  return false;
}

function saveLesson() {
  const name =
    state.saveName.trim() ||
    `${sp(FUNCTIONS[state.lesson.settings.fn].label)} · ${state.lesson.settings.minutes} min`;
  const all = readSaved();
  if (!all[name] && Object.keys(all).length >= MAX_SAVED) {
    setStatus(
      I.S(
        `You can keep up to ${MAX_SAVED} saved lessons. Delete one first.`,
        `Puede guardar hasta ${MAX_SAVED} lecciones. Elimine una primero.`,
      ),
    );
    return;
  }
  all[name] = { savedAt: new Date().toISOString(), lesson: state.lesson };
  const ok = writeJson(SAVED_KEY, all);
  state.saveName = name;
  state.savePick = name;
  setStatus(
    ok
      ? I.S(`Saved "${name}" on this device.`, `Se guardó "${name}" en este dispositivo.`)
      : I.S(
          "This browser blocked saving. The lesson is kept only until you close the page.",
          "Este navegador bloqueó el guardado. La lección se conserva solo hasta que cierre la página.",
        ),
  );
}

async function copyShare() {
  const url = shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    setStatus(
      I.S(
        "Share link copied. It holds settings and activity choices only.",
        "Enlace copiado. Contiene solo opciones y actividades elegidas.",
      ),
    );
  } catch {
    const input = document.querySelector("[data-lb-url]");
    input?.focus();
    input?.select();
    setStatus(
      I.S(
        "Clipboard access is unavailable. The link is selected so you can copy it with your keyboard.",
        "No se puede acceder al portapapeles. El enlace está seleccionado para que lo copie con el teclado.",
      ),
    );
  }
}
