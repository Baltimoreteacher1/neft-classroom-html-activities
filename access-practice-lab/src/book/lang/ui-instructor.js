// Book Studio 2.0 · the teacher's Language Support Studio, inside the book. Add Language Support anywhere (a page, a text
// box, a picture, a dialogue bubble, a selected phrase, a story choice), edit it with live student preview, search the
// library, insert packs, manage and bulk-edit, and design with the rule-based assistant. Everything persists in the book.
import { ART } from "../art.js";
import { bkIcon } from "../icons.js";
import { plainText } from "../model.js";
import { esc } from "../render.js";
import {
  LIBRARY,
  PACKS,
  instantiate,
  instantiatePack,
  interpretCommand,
  planToSupports,
  proposeForContent,
  searchLibrary,
  suggestWords,
} from "./library.js";
import {
  DOMAIN_LABEL,
  DOMAINS,
  GRADE_CLUSTER_IDS,
  INTENSITY_LABEL,
  KEY_LANGUAGE_USES,
  LEVELS,
  MODES,
  STANDARD_LABEL,
  WIDA_ATTRIBUTION,
  WIDA_SOURCE,
  expectationsFor,
  level,
  planForLevel,
  profileLabel,
} from "./profiles.js";
import {
  PLACEMENTS,
  SUPPORT_TYPES,
  makeSupport,
  normalizeSupport,
  resolveSupports,
} from "./supports.js";
import { createSupportHost } from "./ui-support.js";
import { emptyWork } from "./work.js";

const TEACHER_KEY = "accessPracticeLab:v1:book-teacher";
const MY_KEY = "accessPracticeLab:v1:book-my-supports";
export const isTeacher = () => {
  try {
    return localStorage.getItem(TEACHER_KEY) === "1";
  } catch {
    return false;
  }
};
export const setTeacher = (on) => {
  try {
    on ? localStorage.setItem(TEACHER_KEY, "1") : localStorage.removeItem(TEACHER_KEY);
  } catch {}
};
const myList = () => {
  try {
    return (JSON.parse(localStorage.getItem(MY_KEY) || "[]") || []).slice(0, 200);
  } catch {
    return [];
  }
};
const saveMy = (list) => {
  try {
    localStorage.setItem(MY_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {}
};

const clone = (o) => JSON.parse(JSON.stringify(o));
const lines = (v) =>
  String(v || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const csv = (v) =>
  String(v || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const ART_CHOICES = ART.filter((a) => /^(obj|char|nat|sci)-/.test(a.key));

// ── the dialog (one wide native <dialog> per editor) ──
export function panel(E) {
  if (E.spDialog) return E.spDialog;
  const d = document.createElement("dialog");
  d.className = "bk-dialog bk-dialog-wide bk-sp-dialog";
  d.setAttribute("aria-labelledby", "bkSpTitle");
  E.root.querySelector(".bk-editor").append(d);
  E.spDialog = d;
  d.addEventListener("close", () => E.spOnClose?.());
  return d;
}
function show(E, title, body, { onClose } = {}) {
  const d = panel(E);
  const tr = E.I.S;
  d.innerHTML = `<div class="bk-dialog-inner"><header class="bk-dialog-head"><h2 id="bkSpTitle">${esc(title)}</h2><button type="button" class="bk-tbtn" data-spx="close" aria-label="${esc(tr("Close", "Cerrar"))}">${bkIcon("close")}</button></header><div data-sp-body>${body}</div></div>`;
  E.spOnClose = onClose;
  if (!d.open) d.showModal();
  return d;
}

const typeOptions = (tr, sel) =>
  Object.entries(SUPPORT_TYPES)
    .map(
      ([t, T]) =>
        `<optgroup label="${esc(tr(T.en, T.es))}">${T.kinds.map((k) => `<option value="${t}:${k.id}" ${sel === `${t}:${k.id}` ? "selected" : ""}>${esc(tr(k.en, k.es))}</option>`).join("")}</optgroup>`,
    )
    .join("");

const field = (label, inner, hint = "") =>
  `<label class="bk-f"><span>${esc(label)}</span>${inner}${hint ? `<small>${esc(hint)}</small>` : ""}</label>`;
const check = (f, label, val) =>
  `<label class="bk-chk"><input type="checkbox" data-f="${f}" data-t="bool" ${val ? "checked" : ""}> <span>${esc(label)}</span></label>`;

function targetText(E, t) {
  const tr = E.I.S;
  const book = E.core.S.book;
  const pi = book.pages.findIndex((p) => p.id === t.pageId);
  const page = pi >= 0 ? `${tr("page", "página")} ${pi + 1}` : "";
  if (t.scope === "book") return tr("the entire book", "todo el libro");
  if (t.scope === "page") return page;
  if (t.scope === "choice") return `${tr("a story choice on", "una decisión en")} ${page}`;
  const el = book.pages[pi]?.elements.find((e) => e.id === t.elementId);
  const what = el ? plainText(el.html || "").slice(0, 40) || el.alt || el.type : "";
  return t.scope === "selection"
    ? `${tr("the words", "las palabras")} “${t.text}” (${page})`
    : `${tr("this", "este")} ${el?.type || tr("object", "objeto")}${what ? ` “${what}”` : ""} (${page})`;
}

/** The target a teacher means right now: the selected element (with any selected words) or the current page. */
export function currentTarget(E) {
  const { core } = E;
  const page = core.page();
  const el = core.selectedEl();
  if (!el) return { scope: "page", pageId: page.id };
  const live = (window.getSelection?.().toString() || "").trim();
  const recent = E.lastSel && E.lastSel.elementId === el.id && Date.now() - E.lastSel.at < 60000 ? E.lastSel.text : "";
  const sel = live || recent;
  if (sel && (el.type === "text" || el.type === "bubble") && plainText(el.html).includes(sel))
    return { scope: "selection", pageId: page.id, elementId: el.id, text: sel.slice(0, 200) };
  return { scope: "element", pageId: page.id, elementId: el.id };
}

/** Text the teacher has pointed at, for suggestions. */
function targetContent(E, t) {
  const book = E.core.S.book;
  const page = book.pages.find((p) => p.id === t.pageId) || E.core.page();
  const el = page.elements.find((e) => e.id === t.elementId);
  if (t.scope === "selection") return { type: el?.type, text: t.text };
  const own = el ? plainText(el.html || "") || el.alt || "" : "";
  // A picture with no words of its own borrows the words on its page, so suggestions still have something to read.
  if (el && own.split(/\s+/).filter((w) => w.length > 3).length >= 2) return { type: el.type, text: own };
  return { type: el?.type || "text", text: page.elements.map((e) => plainText(e.html || "")).join(" ") || own };
}

// ── builder ──
export function openBuilder(E, opts = {}) {
  const tr = E.I.S;
  const book = E.core.S.book;
  const existing = opts.support ? normalizeSupport(opts.support) : null;
  const target = existing?.target || opts.target || currentTarget(E);
  const draft = existing
    ? clone(existing)
    : makeSupport(opts.type || "frame", opts.kind || "starter", {
        target,
        gradeClusters: book.gradeCluster ? [book.gradeCluster] : [],
        levels: opts.levels || [],
        ...(opts.preset || {}),
      });
  if (!existing && !opts.preset) {
    const prop = proposeForContent({
      ...targetContent(E, target),
      pageId: target.pageId,
      elementId: target.elementId,
      levels: [3],
    })[0];
    if (prop && !opts.type)
      Object.assign(draft, {
        type: "frame",
        kind: prop.kind,
        title: prop.title,
        content: prop.content,
        studentInstructions: prop.studentInstructions,
      });
  }
  const st = { draft, previewLevel: draft.levels[0] || 3, existing: !!existing };
  E.spBuilder = st;
  E.spMode = "builder";
  E.spAbort?.abort();
  const abort = new AbortController();
  E.spAbort = abort;
  const { signal } = abort;
  st.returnTo = opts.returnTo || "";

  const render = () => {
    const d = st.draft;
    const T = SUPPORT_TYPES[d.type];
    const exp = expectationsFor({
      cluster: d.gradeClusters[0] || book.gradeCluster,
      keyUse: d.keyUse,
      mode: d.mode,
    }).slice(0, 4);
    const body = `<div class="bk-sp-builder">
      <form class="bk-sp-form" data-sp-form novalidate>
        <p class="bk-sp-target">${bkIcon("flag")} ${esc(tr("Goes with", "Va con"))}: <strong>${esc(targetText(E, d.target))}</strong> <button type="button" class="linklike" data-spx="retarget">${esc(tr("Change", "Cambiar"))}</button></p>
        <fieldset><legend>${esc(tr("What is it?", "¿Qué es?"))}</legend>
          ${field(tr("Kind of support", "Tipo de apoyo"), `<select data-f="typekind" data-t="typekind">${typeOptions(tr, `${d.type}:${d.kind}`)}</select>`)}
          ${field(tr("Title", "Título"), `<input data-f="title" maxlength="100" value="${esc(d.title)}">`)}
          ${field(tr("Instructions for students", "Instrucciones para estudiantes"), `<input data-f="studentInstructions" maxlength="300" value="${esc(d.studentInstructions)}">`)}
          ${field(tr("Notes for teachers (students never see these)", "Notas para docentes (los estudiantes no las ven)"), `<textarea rows="2" data-f="teacherInstructions" maxlength="600">${esc(d.teacherInstructions)}</textarea>`)}
        </fieldset>
        ${contentEditor(E, d)}
        <fieldset><legend>${esc(tr("Who sees it?", "¿Quién lo ve?"))}</legend>
          <div class="bk-chkrow" role="group" aria-label="${esc(tr("Support profiles", "Perfiles de apoyo"))}">${LEVELS.map((l) => `<label class="bk-chk"><input type="checkbox" data-f="levels" data-t="level" value="${l.n}" ${d.levels.includes(l.n) ? "checked" : ""}> <span>${esc(`${l.n} · ${tr(l.en, l.es)}`)}</span></label>`).join("")}</div>
          <p class="fine">${esc(tr("Leave all unchecked to offer it to every profile. A profile is a support recipe, not a WIDA score.", "Deja todo sin marcar para ofrecerlo a todos los perfiles. Un perfil es una receta de apoyo, no un puntaje WIDA."))}</p>
          <div class="bk-chkrow" role="group" aria-label="${esc(tr("Grade cluster", "Grupo de grados"))}">${GRADE_CLUSTER_IDS.map((g) => `<label class="bk-chk"><input type="checkbox" data-f="gradeClusters" data-t="cluster" value="${g}" ${d.gradeClusters.includes(g) ? "checked" : ""}> <span>${esc(g)}</span></label>`).join("")}</div>
          <div class="bk-grid2">
            ${field(tr("Language skill", "Habilidad"), `<select data-f="domain">${DOMAINS.map((x) => `<option value="${x}" ${d.domain === x ? "selected" : ""}>${esc(tr(...DOMAIN_LABEL[x]))}</option>`).join("")}</select>`)}
            ${field(tr("Mode", "Modo"), `<select data-f="mode"><option value="">—</option>${MODES.map((x) => `<option ${d.mode === x ? "selected" : ""}>${x}</option>`).join("")}</select>`)}
            ${field(tr("Key Language Use", "Uso clave del lenguaje"), `<select data-f="keyUse"><option value="">—</option>${KEY_LANGUAGE_USES.map((x) => `<option ${d.keyUse === x ? "selected" : ""}>${x}</option>`).join("")}</select>`)}
            ${field(tr("Language objective", "Objetivo de lenguaje"), `<input data-f="objective" maxlength="300" value="${esc(d.objective)}">`)}
          </div>
          ${exp.length ? `<p class="fine">${esc(tr("Framework expectations in the lab catalog:", "Expectativas del marco en el catálogo:"))} ${exp.map((x) => `<code>${esc(x)}</code>`).join(" ")} · <a href="${WIDA_SOURCE}" target="_blank" rel="noopener">WIDA</a></p>` : `<p class="fine">${esc(tr("No catalog entry for this combination; choose a Key Language Use and mode, or leave blank.", "No hay entrada en el catálogo para esta combinación; elige un uso clave y un modo, o déjalo en blanco."))}</p>`}
        </fieldset>
        <fieldset><legend>${esc(tr("How is it offered?", "¿Cómo se ofrece?"))}</legend>
          <div class="bk-chkrow" role="radiogroup" aria-label="${esc(tr("Support intensity", "Intensidad del apoyo"))}">${["heavy", "moderate", "minimal"].map((i) => `<label class="bk-chk"><input type="radio" name="bkSpInt" data-f="intensity" value="${i}" ${d.intensity === i ? "checked" : ""}> <span>${esc(tr(...INTENSITY_LABEL[i]))}</span></label>`).join("")}</div>
          <div class="bk-grid2">
            ${field(tr("Where it appears", "Dónde aparece"), `<select data-f="placement">${PLACEMENTS.map((x) => `<option value="${x}" ${d.placement === x ? "selected" : ""}>${esc({ inline: tr("Beside the task", "Junto a la tarea"), drawer: tr("In the help drawer", "En el cajón de ayuda"), before: tr("Before writing", "Antes de escribir"), revision: tr("During revision", "Durante la revisión") }[x])}</option>`).join("")}</select>`)}
            ${field(tr("Display language", "Idioma"), `<input data-f="displayLang" maxlength="12" value="${esc(d.displayLang)}" placeholder="en, es, ar…">`)}
            ${field(tr("Picture cue (optional)", "Imagen de apoyo (opcional)"), `<select data-f="cue"><option value="">—</option>${ART_CHOICES.map((a) => `<option value="${a.key}" ${d.cue === a.key ? "selected" : ""}>${esc(a.key)}</option>`).join("")}</select>`)}
          </div>
          <div class="bk-chkrow">${check("translate", tr("Show translations", "Mostrar traducciones"), d.translate)}${check("audio", tr("Include audio (read aloud)", "Incluir audio"), d.audio)}</div>
        </fieldset>
        <fieldset><legend>${esc(tr("Rules", "Reglas"))}</legend>
          <div class="bk-chkrow">${check("canHide", tr("Student may hide it", "El estudiante puede ocultarlo"), d.canHide)}${check("required", tr("Required (always shown)", "Requerido (siempre visible)"), d.required)}${check("fade.enabled", tr("Fade after independent use", "Reducir tras uso independiente"), d.fade.enabled)}${check("inPublished", tr("Keep in the published book", "Mantener en el libro publicado"), d.inPublished)}${check("authoringOnly", tr("Only while writing", "Solo mientras escribe"), d.authoringOnly)}${check("evidence", tr("Record its use as evidence", "Registrar su uso como evidencia"), d.evidence)}</div>
          ${d.fade.enabled ? field(tr("Fade after this many independent tasks", "Reducir tras tantas tareas independientes"), `<input type="number" min="1" max="5" data-f="fade.after" data-t="int" value="${d.fade.after}">`) : ""}
        </fieldset>
        <div class="bk-btnrow bk-sticky"><button type="button" class="btn btn-primary" data-spx="save">${esc(st.existing ? tr("Save changes", "Guardar cambios") : tr("Add this support", "Agregar este apoyo"))}</button><button type="button" class="btn ghost" data-spx="close">${esc(tr("Cancel", "Cancelar"))}</button></div>
      </form>
      <aside class="bk-sp-preview" aria-label="${esc(tr("Student preview", "Vista del estudiante"))}"><h3>${bkIcon("eye")} ${esc(tr("What students see", "Lo que ven los estudiantes"))}</h3>
        <label class="bk-f"><span>${esc(tr("Preview as", "Ver como"))}</span><select data-spx-prevlevel>${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${st.previewLevel === n ? "selected" : ""}>${esc(profileLabel(n, tr))}</option>`).join("")}</select></label>
        <div data-sp-live></div><p class="fine">${esc(T ? "" : "")}${esc(tr("Preview only. Nothing here is saved to a student's work.", "Solo vista previa. Nada se guarda en el trabajo de un estudiante."))}</p></aside></div>`;
    const d2 = show(
      E,
      st.existing
        ? tr("Edit Language Support", "Editar apoyo de lenguaje")
        : tr("Add Language Support", "Agregar apoyo de lenguaje"),
      body,
    );
    st.dialog = d2;
    livePreview();
  };

  function livePreview() {
    const box = st.dialog.querySelector("[data-sp-live]");
    if (!box) return;
    const probe = {
      ...clone(st.draft),
      levels: st.draft.levels.length ? st.draft.levels : [st.previewLevel],
      id: st.draft.id,
    };
    const lv = st.previewLevel;
    const shown = !probe.levels.length || probe.levels.includes(lv);
    if (!shown) {
      box.innerHTML = `<p class="bk-sp-hidden">${esc(tr("This support is not shown to", "Este apoyo no se muestra a"))} ${esc(profileLabel(lv, tr))}.</p>`;
      return;
    }
    const temp = { ...clone(book), supports: [{ ...probe, authoringOnly: false }] };
    const full = { profile: lv, intensity: "heavy", domains: Object.fromEntries(DOMAINS.map((x) => [x, "heavy"])) };
    const host = createSupportHost(sandboxHost(E, temp, { profile: lv, plan: full }));
    host.ui.open.add(probe.id);
    box.innerHTML =
      host.trayHTML(st.draft.target.pageId || book.pages[0].id) ||
      `<p class="fine">${esc(tr("Nothing to show yet.", "Todavía no hay nada que mostrar."))}</p>`;
    st.preview = host;
    st.previewBox = box;
  }

  render();
  const d = st.dialog;
  const bind = (e) => {
    const t = e.target;
    const f = t.dataset?.f;
    if (!f) return;
    const dr = st.draft;
    if (t.dataset.t === "typekind") {
      const [ty, ki] = t.value.split(":");
      dr.type = ty;
      dr.kind = ki;
      if (!st.existing || !dr.title) dr.title = SUPPORT_TYPES[ty].kinds.find((k) => k.id === ki).en;
      dr.domain = SUPPORT_TYPES[ty].domain;
      Object.assign(dr, normalizeSupport({ ...dr, content: dr.content }));
      return render();
    }
    if (t.dataset.t === "level" || t.dataset.t === "cluster") {
      const key = t.dataset.t === "level" ? "levels" : "gradeClusters";
      const val = t.dataset.t === "level" ? Number(t.value) : t.value;
      dr[key] = t.checked ? [...new Set([...dr[key], val])] : dr[key].filter((x) => x !== val);
      if (key === "levels") {
        dr.levels.sort();
        if (t.checked) st.previewLevel = Number(t.value);
        else if (!dr.levels.includes(st.previewLevel)) st.previewLevel = dr.levels[0] || st.previewLevel;
        return render();
      }
      return livePreview();
    }
    const val =
      t.dataset.t === "bool" ? t.checked : t.dataset.t === "int" ? Number(t.value) : t.value;
    setPath(dr, f, val, t.dataset.t);
    if (f === "fade.enabled" || f === "keyUse" || f === "mode") return render();
    livePreview();
  };
  d.addEventListener("input", bind, { signal });
  d.addEventListener("change", bind, { signal });
  bindWordRows(d, st, livePreview, signal);
  d.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input:not([type=checkbox]):not([type=radio])"))
      e.preventDefault();
  });
  d.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-spx],[data-sp]");
    if (e.target.closest(".bk-sp-live, [data-sp-live]")) {
      const handled = await st.preview?.onClick(e, st.draft.target.pageId || book.pages[0].id);
      if (handled) (livePreview(), st.preview?.ui.open.add(st.draft.id));
      return;
    }
    const act = a?.dataset.spx;
    if (!act) return;
    if (act === "close") d.close();
    else if (act === "retarget") {
      st.draft.target = currentTarget(E);
      render();
    } else if (act === "add-word") {
      st.draft.content.words.push({ w: "", def: "", tr: {}, art: "", example: "", mt: false });
      render();
    } else if (act === "del-word") {
      st.draft.content.words.splice(Number(a.dataset.i), 1);
      render();
    } else if (act === "suggest-words") {
      const found = suggestWords(targetContent(E, st.draft.target).text, 8).filter(
        (w) => !st.draft.content.words.some((x) => x.w === w),
      );
      for (const w of found)
        st.draft.content.words.push({ w, def: "", tr: {}, art: "", example: "", mt: false });
      render();
      E.say(
        found.length
          ? tr(
              "Suggested words added. Add meanings before you save.",
              "Palabras sugeridas agregadas. Agrega los significados antes de guardar.",
            )
          : tr("No new words found in the selected content.", "No se encontraron palabras nuevas."),
      );
    } else if (act === "save") {
      const clean = normalizeSupport({ ...st.draft, reviewed: true });
      if (
        clean.type === "frame" &&
        !clean.content.frames.length &&
        !clean.content.bank.length &&
        !clean.content.table.length
      )
        return E.say(
          tr(
            "Add at least one starter or word before saving.",
            "Agrega al menos un inicio o una palabra antes de guardar.",
          ),
        );
      if (clean.type === "vocab" && !clean.content.words.some((w) => w.w))
        return E.say(
          tr(
            "Add at least one word before saving.",
            "Agrega al menos una palabra antes de guardar.",
          ),
        );
      if (clean.type === "organizer" && !clean.content.cells.length)
        return E.say(
          tr(
            "Add at least one box to the organizer.",
            "Agrega al menos una casilla al organizador.",
          ),
        );
      applySupport(E, clean, st.existing);
      d.close();
      E.say(tr("Language support saved.", "Apoyo de lenguaje guardado."));
    }
  }, { signal });
  d.addEventListener("input", (e) => {
    if (e.target.matches("[data-spx-prevlevel]")) {
      st.previewLevel = Number(e.target.value);
      livePreview();
    } else st.preview?.onInput(e);
  }, { signal });
  d.addEventListener("change", (e) => {
    if (e.target.matches("[data-spx-prevlevel]")) {
      st.previewLevel = Number(e.target.value);
      livePreview();
    }
  }, { signal });
}

function setPath(obj, path, val, t) {
  const parts = path.split(".");
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p];
  const key = parts.at(-1);
  const c = obj.content;
  if (t === "lines") o[key] = lines(val);
  else if (t === "csv") o[key] = csv(val);
  else if (t === "cells") {
    c.cells = lines(val).map((l, i) => {
      const [label, ...p] = l.split("|");
      return {
        id: c.cells[i]?.id || `c${i + 1}${Math.random().toString(36).slice(2, 5)}`,
        label: label.trim(),
        prompt: p.join("|").trim(),
      };
    });
  } else if (t === "table") o[key] = lines(val).map(csv);
  else o[key] = val;
}

function contentEditor(E, d) {
  const tr = E.I.S;
  const c = d.content;
  const f = (name, label, v, t, rows = 3, hint = "") =>
    field(
      label,
      `<textarea rows="${rows}" data-f="content.${name}" data-t="${t}">${esc(v)}</textarea>`,
      hint,
    );
  let inner = "";
  if (d.type === "vocab")
    inner = `<div class="bk-sp-wordrows">${c.words
      .map(
        (
          w,
          i,
        ) => `<div class="bk-sp-wordrow" role="group" aria-label="${esc(tr("Word", "Palabra"))} ${i + 1}">
          <input aria-label="${esc(tr("Word", "Palabra"))}" placeholder="${esc(tr("word", "palabra"))}" data-wf="${i}.w" value="${esc(w.w)}">
          <input aria-label="${esc(tr("Meaning", "Significado"))}" placeholder="${esc(tr("kid-friendly meaning", "significado sencillo"))}" data-wf="${i}.def" value="${esc(w.def)}">
          <input aria-label="${esc(tr("Translation", "Traducción"))}" placeholder="${esc(tr("translation (es)", "traducción (es)"))}" data-wf="${i}.tr" value="${esc(w.tr?.es || Object.values(w.tr || {})[0] || "")}">
          <input aria-label="${esc(tr("Example sentence", "Oración de ejemplo"))}" placeholder="${esc(tr("example sentence", "oración de ejemplo"))}" data-wf="${i}.example" value="${esc(w.example)}">
          <select aria-label="${esc(tr("Picture", "Imagen"))}" data-wf="${i}.art"><option value="">${esc(tr("no picture", "sin imagen"))}</option>${ART_CHOICES.map((a) => `<option value="${a.key}" ${w.art === a.key ? "selected" : ""}>${a.key}</option>`).join("")}</select>
          <label class="bk-chk"><input type="checkbox" data-wf="${i}.mt" ${w.mt ? "checked" : ""}> <span>${esc(tr("machine-made translation", "traducción automática"))}</span></label>
          <button type="button" class="bk-tbtn" data-spx="del-word" data-i="${i}" aria-label="${esc(tr("Remove word", "Quitar palabra"))}">${bkIcon("trash")}</button></div>`,
      )
      .join(
        "",
      )}</div><div class="bk-btnrow"><button type="button" class="btn small" data-spx="add-word">${bkIcon("plus")} ${esc(tr("Add a word", "Agregar una palabra"))}</button><button type="button" class="btn small ghost" data-spx="suggest-words">${bkIcon("wand")} ${esc(tr("Suggest words from the selected content", "Sugerir palabras del contenido seleccionado"))}</button></div>`;
  else if (d.type === "frame")
    inner = `${f("frames", tr("Starters or frames (one per line; use ___ for a blank)", "Inicios o marcos (uno por línea; usa ___ para un espacio)"), c.frames.join("\n"), "lines", 4)}${f("bank", tr("Word bank (separate with commas)", "Banco de palabras (separa con comas)"), c.bank.join(", "), "csv", 2)}${f("table", tr("Substitution table: one column per line, words separated by commas", "Tabla de sustitución: una columna por línea, palabras separadas por comas"), c.table.map((x) => x.join(", ")).join("\n"), "table", 2)}`;
  else if (d.type === "organizer")
    inner = `${f("cells", tr("Boxes (one per line: Label | prompt)", "Casillas (una por línea: Título | pregunta)"), c.cells.map((x) => `${x.label}${x.prompt ? ` | ${x.prompt}` : ""}`).join("\n"), "cells", 5)}${field(tr("Layout", "Diseño"), `<select data-f="content.layout">${["grid", "chain", "mountain", "map"].map((l) => `<option ${c.layout === l ? "selected" : ""}>${l}</option>`).join("")}</select>`)}`;
  else if (d.type === "rehearsal")
    inner = `${field(tr("Prompt", "Indicación"), `<input data-f="content.prompt" maxlength="400" value="${esc(c.prompt)}">`)}${f("steps", tr("Steps (one per line)", "Pasos (uno por línea)"), c.steps.join("\n"), "lines", 3)}${field(tr("Model sentence to hear (optional)", "Oración modelo (opcional)"), `<input data-f="content.model" maxlength="500" value="${esc(c.model)}">`)}<p class="fine">${esc(tr("A typing option is always offered next to the microphone.", "Siempre se ofrece escribir junto al micrófono."))}</p>`;
  else if (d.type === "reading")
    inner = `${f("prompts", tr("Questions or prompts (one per line)", "Preguntas o indicaciones (una por línea)"), c.prompts.join("\n"), "lines", 3)}${f("highlights", tr("Key words to look for (commas)", "Palabras clave (comas)"), c.highlights.join(", "), "csv", 2)}`;
  else if (d.type === "revision")
    inner = f(
      "prompts",
      tr("Revision questions (one per line)", "Preguntas de revisión (una por línea)"),
      c.prompts.join("\n"),
      "lines",
      3,
    );
  else if (d.type === "model")
    inner = `${f("text", tr("Model text", "Texto modelo"), c.text, "text", 3)}${field(tr("What to notice", "En qué fijarse"), `<input data-f="content.note" maxlength="300" value="${esc(c.note)}">`)}`;
  else inner = f("text", tr("Note", "Nota"), c.text, "text", 3);
  return `<fieldset><legend>${esc(tr("What it says", "Qué dice"))}</legend>${inner}</fieldset>`;
}

// word rows bind separately (they are an array of small objects)
export function bindWordRows(d, st, livePreview, signal) {
  d.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.dataset?.wf) return;
    const [i, k] = t.dataset.wf.split(".");
    const w = st.draft.content.words[Number(i)];
    if (!w) return;
    if (k === "tr") w.tr = { ...w.tr, es: t.value };
    else if (k === "mt") w.mt = t.checked;
    else w[k] = t.value;
    livePreview();
  }, { signal });
  d.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset?.wf && t.type === "checkbox") {
      const [i] = t.dataset.wf.split(".");
      st.draft.content.words[Number(i)].mt = t.checked;
      livePreview();
    }
  }, { signal });
}

/** A host that works on a throwaway copy so a teacher's preview can never change a real student's work or progress. */
export function sandboxHost(E, book, aud = {}, { insert } = {}) {
  let work = emptyWork();
  const plan =
    aud.plan ||
    (aud.profile > 0
      ? planForLevel(aud.profile)
      : { profile: 0, intensity: aud.intensity || "help", domains: {} });
  return {
    I: E.I,
    sandbox: true,
    getBook: () => book,
    audience: () => ({ profile: aud.profile ?? plan.profile, plan, mode: "student" }),
    getWork: () => work,
    setWork: (fn) => {
      work = fn(work);
    },
    insertText: (s, text) => insert?.(s, text),
    applyText: () => {},
    refresh: () => aud.onRefresh?.(),
    say: (m) => E.say(m),
  };
}

/** Add or replace a support in the book (one undoable step). */
export function applySupport(E, support, replace = false) {
  const { core } = E;
  const book = core.S.book;
  const i = book.supports.findIndex((s) => s.id === support.id);
  if (i >= 0 && replace) book.supports[i] = support;
  else {
    support.order = book.supports.length;
    book.supports.push(support);
  }
  core.commit();
  E.refreshSupports?.();
}

// ── the studio drawer: manage, library, packs ──
export function openStudio(E, tab = "manage") {
  const tr = E.I.S;
  const st = (E.spStudio = E.spStudio || {
    tab,
    sel: new Set(),
    filter: "",
    q: "",
    lib: { level: "", type: "", klu: "", domain: "" },
    confirm: "",
  });
  st.tab = tab;
  E.spMode = "studio";
  const render = async () => {
    const tabs = [
      ["manage", tr("My supports", "Mis apoyos"), "support"],
      ["library", tr("Library", "Biblioteca"), "search"],
      ["packs", tr("Packs", "Paquetes"), "panel"],
      ["designer", tr("Design Language Supports", "Diseñar apoyos de lenguaje"), "wand"],
      ["plan", tr("Plans & groups", "Planes y grupos"), "sliders"],
      ["preview", tr("Preview as student", "Ver como estudiante"), "eye"],
    ];
    const nav = `<div class="bk-sp-tabs" role="tablist" aria-label="${esc(tr("Language Support Studio", "Estudio de apoyos de lenguaje"))}">${tabs.map(([id, label, ico]) => `<button type="button" role="tab" class="bk-sp-tab${st.tab === id ? " is-on" : ""}" aria-selected="${st.tab === id}" data-spx="tab" data-tab="${id}">${bkIcon(ico)}<span>${esc(label)}</span></button>`).join("")}</div>`;
    const bodyFn = { manage: manageHTML, library: libraryHTML, packs: packsHTML }[st.tab];
    let body;
    if (bodyFn) body = bodyFn(E, st);
    else {
      const mod = await import("./ui-instructor-plan.js");
      body = mod.tabHTML(E, st);
    }
    show(
      E,
      tr("Language Support Studio", "Estudio de apoyos de lenguaje"),
      `${nav}<div class="bk-sp-pane" role="tabpanel">${body}</div>`,
      { onClose: () => (E.spStudio = null) },
    );
    E.spStudioRender = render;
    panel(E).querySelector(".bk-sp-tab.is-on")?.focus({ preventScroll: true });
    if (st.tab === "preview") (await import("./ui-instructor-plan.js")).afterPreview(E, st);
  };
  const d = panel(E);
  if (!d.__spBound) {
    d.__spBound = true;
    d.addEventListener("click", (e) => studioClick(E, e));
    d.addEventListener("input", (e) => studioInput(E, e));
    d.addEventListener("change", (e) => studioInput(E, e));
  }
  E.spStudioRender = render;
  return render();
}

const pageNo = (E, id) => E.core.S.book.pages.findIndex((p) => p.id === id) + 1;

function supportRow(E, s, st) {
  const tr = E.I.S;
  const T = SUPPORT_TYPES[s.type];
  const kind = T.kinds.find((k) => k.id === s.kind);
  return `<li class="bk-sp-row${st.sel.has(s.id) ? " is-sel" : ""}" data-id="${s.id}">
    <input type="checkbox" data-spx-sel="${s.id}" aria-label="${esc(tr("Select", "Seleccionar"))} ${esc(s.title)}" ${st.sel.has(s.id) ? "checked" : ""}>
    <div class="bk-sp-rowmain"><strong>${esc(s.title)}</strong>
      <span class="bk-sp-meta">${esc(tr(kind.en, kind.es))} · ${esc(targetText(E, s.target))} · ${s.levels.length ? esc(`${tr("levels", "niveles")} ${s.levels.join(", ")}`) : esc(tr("all profiles", "todos los perfiles"))} · ${esc(tr(...INTENSITY_LABEL[s.intensity]))}${s.required ? ` · <b>${esc(tr("required", "requerido"))}</b>` : ""}${s.reviewed ? "" : ` · <b class="bk-warn">${esc(tr("needs your review", "necesita tu revisión"))}</b>`}${s.inPublished ? ` · ${esc(tr("in published book", "en el libro publicado"))}` : ""}</span></div>
    <div class="bk-btnrow">
      <button type="button" class="btn small" data-spx="edit" data-id="${s.id}">${esc(tr("Edit", "Editar"))}</button>
      <button type="button" class="bk-tbtn" data-spx="up" data-id="${s.id}" aria-label="${esc(tr("Move earlier", "Mover antes"))}">↑</button>
      <button type="button" class="bk-tbtn" data-spx="down" data-id="${s.id}" aria-label="${esc(tr("Move later", "Mover después"))}">↓</button>
      <button type="button" class="bk-tbtn" data-spx="dup" data-id="${s.id}" aria-label="${esc(tr("Duplicate", "Duplicar"))}">${bkIcon("copy")}</button>
      <button type="button" class="bk-tbtn" data-spx="mine" data-id="${s.id}" aria-label="${esc(tr("Save to My Supports", "Guardar en Mis apoyos"))}" title="${esc(tr("Save as My Support", "Guardar como Mi apoyo"))}">${bkIcon("sticker")}</button>
      ${st.confirm === s.id ? `<span class="bk-confirm"><button type="button" class="btn small danger" data-spx="del-yes" data-id="${s.id}">${esc(tr("Delete", "Eliminar"))}</button><button type="button" class="btn small ghost" data-spx="del-no">${esc(tr("Keep", "Conservar"))}</button></span>` : `<button type="button" class="bk-tbtn" data-spx="del" data-id="${s.id}" aria-label="${esc(tr("Delete", "Eliminar"))}">${bkIcon("trash")}</button>`}
    </div></li>`;
}

function manageHTML(E, st) {
  const tr = E.I.S;
  const book = E.core.S.book;
  const list = [...book.supports]
    .sort((a, b) => a.order - b.order)
    .filter((s) =>
      !st.filter
        ? true
        : st.filter === "page"
          ? s.target.pageId === E.core.page().id || s.target.scope === "book"
          : st.filter === "review"
            ? !s.reviewed
            : true,
    );
  const bulk = st.sel.size
    ? `<div class="bk-sp-bulk" role="group" aria-label="${esc(tr("Edit selected", "Editar seleccionados"))}"><strong>${st.sel.size} ${esc(tr("selected", "seleccionados"))}</strong>
        <select data-spx-bulk="levels"><option value="">${esc(tr("Set profiles…", "Asignar perfiles…"))}</option><option value="all">${esc(tr("All profiles", "Todos los perfiles"))}</option>${LEVELS.map((l) => `<option value="${l.n}">${esc(`${l.n} · ${tr(l.en, l.es)}`)}</option>`).join("")}<option value="12">1 + 2</option><option value="34">3 + 4</option><option value="56">5 + 6</option></select>
        <select data-spx-bulk="intensity"><option value="">${esc(tr("Set intensity…", "Asignar intensidad…"))}</option>${["heavy", "moderate", "minimal"].map((i) => `<option value="${i}">${esc(tr(...INTENSITY_LABEL[i]))}</option>`).join("")}</select>
        <select data-spx-bulk="flag"><option value="">${esc(tr("More…", "Más…"))}</option><option value="required:1">${esc(tr("Make required", "Hacer requerido"))}</option><option value="required:0">${esc(tr("Not required", "No requerido"))}</option><option value="inPublished:1">${esc(tr("Keep in published book", "Mantener en el libro publicado"))}</option><option value="inPublished:0">${esc(tr("Remove from published book", "Quitar del libro publicado"))}</option><option value="fade:1">${esc(tr("Turn fading on", "Activar reducción"))}</option><option value="fade:0">${esc(tr("Turn fading off", "Desactivar reducción"))}</option><option value="reviewed:1">${esc(tr("Mark reviewed", "Marcar revisado"))}</option><option value="delete:1">${esc(tr("Delete selected", "Eliminar seleccionados"))}</option></select></div>`
    : "";
  return `<div class="bk-btnrow"><button type="button" class="btn btn-primary" data-spx="new">${bkIcon("plus")} ${esc(tr("Add Language Support", "Agregar apoyo de lenguaje"))}</button>
    <label class="bk-f inline"><span class="sr-only">${esc(tr("Show", "Mostrar"))}</span><select data-spx-filter><option value="">${esc(tr("All supports", "Todos los apoyos"))}</option><option value="page" ${st.filter === "page" ? "selected" : ""}>${esc(tr("This page + whole book", "Esta página + todo el libro"))}</option><option value="review" ${st.filter === "review" ? "selected" : ""}>${esc(tr("Needs review", "Necesita revisión"))}</option></select></label></div>${bulk}
    ${list.length ? `<ul class="bk-sp-list">${list.map((s) => supportRow(E, s, st)).join("")}</ul>` : `<div class="bk-empty"><h3>${esc(tr("No language supports yet", "Aún no hay apoyos de lenguaje"))}</h3><p>${esc(tr("Select any sentence, picture, dialogue or page in the editor and choose Add Language Support, or start from the Library.", "Selecciona una oración, imagen, diálogo o página y elige Agregar apoyo de lenguaje, o empieza desde la Biblioteca."))}</p><button type="button" class="btn" data-spx="tab" data-tab="library">${esc(tr("Open the Library", "Abrir la Biblioteca"))}</button></div>`}
    <p class="fine">${esc(WIDA_ATTRIBUTION)}</p>`;
}

function libraryHTML(E, st) {
  const tr = E.I.S;
  const mine = myList().map((m) => ({
    ...m,
    id: m.id || `my-${m.title}`,
    tags: [...(m.tags || []), "my supports"],
  }));
  const all = st.lib.mine ? mine : [...LIBRARY, ...mine];
  const results = searchLibrary(st.q, { ...st.lib }, all).slice(0, 40);
  const sel = (key, label, opts) =>
    `<select data-spx-lib="${key}" aria-label="${esc(label)}"><option value="">${esc(label)}</option>${opts.map(([v, l]) => `<option value="${v}" ${String(st.lib[key]) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  const groups = E.core.S.book.groups;
  return `<div class="bk-sp-search"><label class="bk-f"><span class="sr-only">${esc(tr("Search supports", "Buscar apoyos"))}</span><input type="search" data-spx-q value="${esc(st.q)}" placeholder="${esc(tr("Try: cause and effect, grade 6, WIDA Level 2", "Prueba: causa y efecto, grado 6, nivel 2"))}" autocomplete="off"></label>
    <div class="bk-btnrow">${sel(
      "level",
      tr("Any profile", "Cualquier perfil"),
      [1, 2, 3, 4, 5, 6].map((n) => [n, profileLabel(n, tr)]),
    )}${sel(
      "type",
      tr("Any kind", "Cualquier tipo"),
      Object.entries(SUPPORT_TYPES).map(([k, T]) => [k, tr(T.en, T.es)]),
    )}${sel(
      "klu",
      tr("Any Key Language Use", "Cualquier uso clave"),
      KEY_LANGUAGE_USES.map((k) => [k, k]),
    )}${sel(
      "domain",
      tr("Any skill", "Cualquier habilidad"),
      DOMAINS.map((d) => [d, tr(...DOMAIN_LABEL[d])]),
    )}<label class="bk-chk"><input type="checkbox" data-spx-mine ${st.lib.mine ? "checked" : ""}> <span>${esc(tr("My supports only", "Solo mis apoyos"))}</span></label></div></div>
    <p class="fine" role="status">${results.length} ${esc(tr("results", "resultados"))}</p>
    <ul class="bk-sp-libs">${results
      .map((e) => {
        const T = SUPPORT_TYPES[e.type];
        const sample =
          e.content?.frames?.[0] ||
          e.content?.words
            ?.slice(0, 4)
            .map((w) => w.w)
            .join(", ") ||
          e.content?.cells?.map((c) => c.label).join(" → ") ||
          e.content?.prompts?.[0] ||
          e.content?.prompt ||
          e.content?.text ||
          "";
        return `<li class="bk-sp-lib"><div><strong>${esc(e.title)}</strong><span class="bk-sp-meta">${esc(tr(T.en, T.es))} · ${e.levels.length ? esc(`${tr("levels", "niveles")} ${e.levels.join(", ")}`) : esc(tr("all", "todos"))} · ${esc(e.keyUse || "")} · ${esc(tr(...INTENSITY_LABEL[e.intensity]))}</span><p class="bk-sp-sample">${esc(sample)}</p><p class="fine"><b>${esc(tr("Language target:", "Meta de lenguaje:"))}</b> ${esc(e.objective || "")} <b>${esc(tr("Example:", "Ejemplo:"))}</b> ${esc(e.example || "")}</p></div>
        <div class="bk-btnrow"><button type="button" class="btn small btn-primary" data-spx="lib-page" data-id="${esc(e.id)}">${esc(tr("Add to this page", "Agregar a esta página"))}</button><button type="button" class="btn small" data-spx="lib-book" data-id="${esc(e.id)}">${esc(tr("Add to entire book", "Agregar a todo el libro"))}</button>
        ${groups.length ? `<select data-spx-group data-id="${esc(e.id)}" aria-label="${esc(tr("Assign to group", "Asignar a grupo"))}"><option value="">${esc(tr("Assign to group…", "Asignar a grupo…"))}</option>${groups.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select>` : ""}
        <button type="button" class="btn small ghost" data-spx="lib-custom" data-id="${esc(e.id)}">${esc(tr("Customize…", "Personalizar…"))}</button>${e.id.startsWith("my-") ? "" : `<button type="button" class="btn small ghost" data-spx="lib-mine" data-id="${esc(e.id)}">${esc(tr("Save as My Support", "Guardar como Mi apoyo"))}</button>`}</div></li>`;
      })
      .join("")}</ul>`;
}

function packsHTML(E) {
  const tr = E.I.S;
  const mine = (() => {
    try {
      return JSON.parse(localStorage.getItem(`${MY_KEY}:packs`) || "[]");
    } catch {
      return [];
    }
  })();
  const all = [
    ...PACKS,
    ...mine.map((p) => ({ ...p, mine: true, entries: p.entries.map((e) => ({ ...e })) })),
  ];
  return `<p>${esc(tr("A pack is a set of supports. Each one stays editable after you insert it, and you can change many at once under My supports.", "Un paquete es un conjunto de apoyos. Cada uno sigue siendo editable y puedes cambiar muchos a la vez en Mis apoyos."))}</p>
    <ul class="bk-sp-libs">${all.map((p) => `<li class="bk-sp-lib"><div><strong>${esc(p.title)}</strong><span class="bk-sp-meta">${p.entries.length} ${esc(tr("supports", "apoyos"))} · ${esc(tr("levels", "niveles"))} ${p.levels.join(", ")}</span><p class="fine">${p.entries.map((e) => esc(e.title)).join(" · ")}</p></div><div class="bk-btnrow"><button type="button" class="btn small btn-primary" data-spx="pack-book" data-id="${p.id}">${esc(tr("Add to entire book", "Agregar a todo el libro"))}</button><button type="button" class="btn small" data-spx="pack-page" data-id="${p.id}">${esc(tr("Add to this page", "Agregar a esta página"))}</button></div></li>`).join("")}</ul>
    <div class="bk-btnrow"><button type="button" class="btn" data-spx="pack-save">${bkIcon("sticker")} ${esc(tr("Save this book's supports as my pack", "Guardar los apoyos de este libro como mi paquete"))}</button></div>`;
}

function allPacks() {
  let mine = [];
  try {
    mine = JSON.parse(localStorage.getItem(`${MY_KEY}:packs`) || "[]");
  } catch {}
  return [...PACKS, ...mine];
}

function libEntry(id) {
  return LIBRARY.find((e) => e.id === id) || myList().find((e) => (e.id || `my-${e.title}`) === id);
}

function studioClick(E, e) {
  if (E.spMode !== "studio") return;
  const tr = E.I.S;
  const { core } = E;
  const st = E.spStudio;
  const b = e.target.closest("[data-spx]");
  if (!b || !st) return;
  const act = b.dataset.spx;
  const id = b.dataset.id;
  const book = core.S.book;
  const re = () => E.spStudioRender?.();
  const find = () => book.supports.find((s) => s.id === id);
  if (act === "close") return panel(E).close();
  if (act === "tab") return ((st.tab = b.dataset.tab), re());
  if (act === "new") return openBuilder(E, { returnTo: st.tab });
  if (act === "edit") return find() && openBuilder(E, { support: find(), returnTo: st.tab });
  if (act === "dup") {
    const s = find();
    if (!s) return;
    const copy = normalizeSupport({
      ...clone(s),
      id: "",
      title: `${s.title} ${tr("(copy)", "(copia)")}`,
      order: book.supports.length,
    });
    book.supports.push(copy);
    core.commit();
    return re();
  }
  if (act === "mine") {
    const s = find();
    if (s) {
      saveMy([
        {
          ...clone(s),
          id: `my-${s.title}-${Date.now().toString(36)}`,
          target: { scope: "book" },
          tags: ["my supports"],
          example: "",
          objective: s.objective,
        },
        ...myList(),
      ]);
      E.say(tr("Saved to My Supports.", "Guardado en Mis apoyos."));
    }
    return;
  }
  if (act === "up" || act === "down") {
    const sorted = [...book.supports].sort((a, b2) => a.order - b2.order);
    const i = sorted.findIndex((s) => s.id === id);
    const j = i + (act === "up" ? -1 : 1);
    if (i < 0 || j < 0 || j >= sorted.length) return;
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    sorted.forEach((s, n) => (s.order = n));
    core.commit();
    return re();
  }
  if (act === "del") return ((st.confirm = id), re());
  if (act === "del-no") return ((st.confirm = ""), re());
  if (act === "del-yes") {
    book.supports = book.supports.filter((s) => s.id !== id);
    st.confirm = "";
    core.commit();
    E.say(tr("Support deleted. Undo brings it back.", "Apoyo eliminado. Deshacer lo recupera."));
    return re();
  }
  const target = (scope) =>
    scope === "book" ? { scope: "book" } : { scope: "page", pageId: core.page().id };
  if (act === "lib-page" || act === "lib-book") {
    const entry = libEntry(id);
    if (!entry) return;
    applySupport(E, instantiate(entry, target(act === "lib-book" ? "book" : "page")));
    E.say(`${tr("Added", "Agregado")}: ${entry.title}.`);
    return re();
  }
  if (act === "lib-custom") {
    const entry = libEntry(id);
    return (
      entry &&
      openBuilder(E, {
        support: instantiate(entry, currentTarget(E)),
        preset: {},
        type: entry.type,
      })
    );
  }
  if (act === "lib-mine") {
    const entry = libEntry(id);
    if (entry)
      saveMy([
        { ...clone(entry), id: `my-${entry.title}-${Date.now().toString(36)}` },
        ...myList(),
      ]);
    return E.say(tr("Saved to My Supports.", "Guardado en Mis apoyos."));
  }
  if (act === "pack-book" || act === "pack-page") {
    const pack = allPacks().find((p) => p.id === id);
    if (!pack) return;
    const list = pack.entries
      .map((en, i) =>
        en.type && en.content
          ? instantiate(en, target(act === "pack-book" ? "book" : "page"), {
              source: "pack",
              packId: pack.id,
              order: book.supports.length + i,
            })
          : null,
      )
      .filter(Boolean);
    for (const s of list) book.supports.push(s);
    core.commit();
    E.say(`${list.length} ${tr("supports added from the pack.", "apoyos agregados del paquete.")}`);
    return re();
  }
  if (act === "pack-save") {
    const entries = book.supports.map((s) => ({
      ...clone(s),
      levels: s.levels,
      tags: [],
      example: "",
      objective: s.objective,
    }));
    if (!entries.length)
      return E.say(
        tr("This book has no supports to save.", "Este libro no tiene apoyos para guardar."),
      );
    try {
      const mine = JSON.parse(localStorage.getItem(`${MY_KEY}:packs`) || "[]");
      mine.unshift({
        id: `mypack${Date.now().toString(36)}`,
        title: `${book.title} ${tr("pack", "paquete")}`,
        levels: [...new Set(entries.flatMap((x) => x.levels))].sort(),
        entries,
      });
      localStorage.setItem(`${MY_KEY}:packs`, JSON.stringify(mine.slice(0, 20)));
      E.say(tr("Saved as your pack.", "Guardado como tu paquete."));
    } catch {
      E.say(tr("This browser would not save the pack.", "Este navegador no guardó el paquete."));
    }
    return re();
  }
  // plan / designer / preview actions live in the second module
  import("./ui-instructor-plan.js").then((m) => m.onClick(E, e, b, act));
}

function studioInput(E, e) {
  if (E.spMode !== "studio") return;
  const st = E.spStudio;
  if (!st) return;
  const t = e.target;
  const book = E.core.S.book;
  const re = () => E.spStudioRender?.();
  if (t.matches("[data-spx-sel]")) {
    t.checked ? st.sel.add(t.dataset.spxSel) : st.sel.delete(t.dataset.spxSel);
    if (e.type === "change") re();
    return;
  }
  if (t.matches("[data-spx-filter]") && e.type === "change") return ((st.filter = t.value), re());
  if (t.matches("[data-spx-q]")) {
    st.q = t.value;
    clearTimeout(st.qt);
    st.qt = setTimeout(async () => {
      const pos = t.selectionStart;
      await re();
      const n = panel(E).querySelector("[data-spx-q]");
      n?.focus();
      n?.setSelectionRange(pos, pos);
    }, 250);
    return;
  }
  if (t.matches("[data-spx-lib]") && e.type === "change")
    return ((st.lib[t.dataset.spxLib] = t.value), re());
  if (t.matches("[data-spx-mine]") && e.type === "change") return ((st.lib.mine = t.checked), re());
  if (t.matches("[data-spx-group]") && e.type === "change" && t.value) {
    const g = book.groups.find((x) => x.id === t.value);
    const entry = libEntry(t.dataset.id);
    if (g && entry) {
      applySupport(
        E,
        instantiate(
          entry,
          { scope: "book" },
          {
            levels: g.plan.profile ? [g.plan.profile] : entry.levels,
            title: `${entry.title} (${g.name})`,
          },
        ),
      );
      E.say(`${entry.title}: ${g.name}.`);
    }
    return re();
  }
  if (t.matches("[data-spx-bulk]") && e.type === "change" && t.value) {
    const ids = [...st.sel];
    const kind = t.dataset.spxBulk;
    const mut = (s) => {
      if (kind === "levels") s.levels = t.value === "all" ? [] : t.value.split("").map(Number);
      else if (kind === "intensity") s.intensity = t.value;
      else {
        const [k, v] = t.value.split(":");
        if (k === "fade") s.fade.enabled = v === "1";
        else if (k !== "delete") s[k] = v === "1";
      }
    };
    if (kind === "flag" && t.value === "delete:1")
      book.supports = book.supports.filter((s) => !ids.includes(s.id));
    else for (const s of book.supports) if (ids.includes(s.id)) mut(s);
    E.core.commit();
    if (kind === "flag" && t.value === "delete:1") st.sel.clear();
    return re();
  }
  import("./ui-instructor-plan.js").then((m) => m.onInput(E, e));
}

export {
  WIDA_ATTRIBUTION,
  STANDARD_LABEL,
  level,
  resolveSupports,
  planToSupports,
  interpretCommand,
  instantiatePack,
};
