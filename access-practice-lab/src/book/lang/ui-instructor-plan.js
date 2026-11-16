// Book Studio 2.0 · teacher tabs: Design Language Supports (rule-based, preview-then-approve), plans and groups with
// teacher-approved fading, and Preview as student (one profile, or two side by side). Loaded on demand.
import { download } from "../export.js";
import { bkIcon } from "../icons.js";
import { FORMATS, plainText } from "../model.js";
import { esc, pageHTML } from "../render.js";
import { interpretCommand, planToSupports } from "./library.js";
import {
  DOMAIN_LABEL,
  DOMAINS,
  INTENSITIES,
  INTENSITY_LABEL,
  LEVELS,
  level,
  normalizePlan,
  planForLevel,
  profileLabel,
} from "./profiles.js";
import { groupCopy, recommendAdjustment, stepIntensity } from "./supports.js";
import { createSupportHost } from "./ui-support.js";
import { markVocab } from "./vocab-mark.js";
import { applySupport, openBuilder, panel, sandboxHost } from "./ui-instructor.js";
import { evidenceReport } from "./work.js";

const EXAMPLES = [
  "Add Level 1 and 2 sentence starters to every page where students describe a character.",
  "Create a bilingual vocabulary bank for the first three pages.",
  "Add Level 3 paragraph frames for explaining why the character made each decision.",
  "Create different versions of these dialogue supports for Levels 1 through 5.",
  "Add oral rehearsal and vocabulary to page 3.",
  "Create Level 4 revision prompts that improve transitions.",
];

export function tabHTML(E, st) {
  if (st.tab === "designer") return designerHTML(E, st);
  if (st.tab === "plan") return planHTML(E, st);
  return previewHTML(E, st);
}

// ── Design Language Supports ──
function designerHTML(E, st) {
  const tr = E.I.S;
  const dz = (st.dz = st.dz || { text: "", plan: null, list: [], include: new Set() });
  const book = E.core.S.book;
  const rows = dz.list
    .map(
      (
        s,
      ) => `<li class="bk-sp-row"><input type="checkbox" data-dz-inc="${s.id}" ${dz.include.has(s.id) ? "checked" : ""} aria-label="${esc(tr("Include", "Incluir"))} ${esc(s.title)}">
      <div class="bk-sp-rowmain"><strong>${esc(s.title)}</strong><span class="bk-sp-meta">${esc(tr("Goes on", "Va en"))}: ${s.target.scope === "book" ? esc(tr("the entire book", "todo el libro")) : `${esc(tr("page", "página"))} ${book.pages.findIndex((p) => p.id === s.target.pageId) + 1}`} · ${s.levels.length ? esc(`${tr("levels", "niveles")} ${s.levels.join(", ")}`) : esc(tr("all profiles", "todos los perfiles"))}</span><p class="bk-sp-sample">${esc(s.content.frames?.[0] || s.content.words?.map((w) => w.w).join(", ") || s.content.cells?.map((c) => c.label).join(" → ") || s.content.prompts?.[0] || s.content.prompt || "")}</p></div>
      <button type="button" class="btn small" data-spx="dz-edit" data-id="${s.id}">${esc(tr("Edit before adding", "Editar antes de agregar"))}</button></li>`,
    )
    .join("");
  return `<div class="bk-dz"><p>${bkIcon("wand")} ${esc(tr("Say what you want in a sentence. You will see exactly which pages change before anything is added.", "Di lo que quieres en una oración. Verás exactamente qué páginas cambian antes de agregar algo."))}</p>
    <p class="fine">${esc(tr("This assistant follows fixed rules on this device. No AI service is connected, so nothing is sent anywhere. Everything it proposes is a draft you review.", "Este asistente sigue reglas fijas en este dispositivo. No hay un servicio de IA conectado, así que no se envía nada. Todo lo que propone es un borrador para revisar."))}</p>
    <label class="bk-f"><span>${esc(tr("What should I add?", "¿Qué debo agregar?"))}</span><textarea rows="2" data-dz-text maxlength="300">${esc(dz.text)}</textarea></label>
    <div class="bk-btnrow"><button type="button" class="btn btn-primary" data-spx="dz-plan">${esc(tr("Show me the changes", "Mostrar los cambios"))}</button></div>
    <details><summary>${esc(tr("Examples", "Ejemplos"))}</summary><ul class="bk-sp-examples">${EXAMPLES.map((x) => `<li><button type="button" class="linklike" data-spx="dz-example" data-text="${esc(x)}">${esc(x)}</button></li>`).join("")}</ul></details>
    ${dz.plan && !dz.plan.ok ? `<p class="bk-warn" role="alert">${esc(dz.plan.help)}</p>` : ""}
    ${dz.plan?.ok ? `<div role="status"><h3>${esc(tr("Proposed changes", "Cambios propuestos"))}</h3><p>${esc(dz.plan.summary)}</p><ul class="bk-sp-list">${rows}</ul><div class="bk-btnrow"><button type="button" class="btn btn-primary" data-spx="dz-apply" ${dz.include.size ? "" : "disabled"}>${esc(tr("Add the checked supports", "Agregar los apoyos marcados"))} (${dz.include.size})</button><span class="fine">${esc(tr("You can undo this in one step with Undo.", "Puedes deshacerlo en un paso con Deshacer."))}</span></div></div>` : ""}</div>`;
}

// ── plans, groups, fading ──
const profileSelect = (tr, f, v, attrs = "") =>
  `<select data-pf="${f}" ${attrs}><option value="0" ${v === 0 ? "selected" : ""}>${esc(tr("No profile (help on demand)", "Sin perfil (ayuda a pedido)"))}</option>${LEVELS.map((l) => `<option value="${l.n}" ${v === l.n ? "selected" : ""}>${esc(profileLabel(l.n, tr))}</option>`).join("")}</select>`;
const intSelect = (tr, f, v, attrs = "") =>
  `<select data-pf="${f}" ${attrs}>${INTENSITIES.map((i) => `<option value="${i}" ${v === i ? "selected" : ""}>${esc(tr(...INTENSITY_LABEL[i]))}</option>`).join("")}</select>`;

function planHTML(E, st) {
  const tr = E.I.S;
  const book = E.core.S.book;
  const p = book.plan;
  const recs = book.supports
    .filter((s) => book.work.records.some((r) => r.supportId === s.id))
    .map((s) => ({ s, r: recommendAdjustment(book.work.records, s) }));
  return `<div class="bk-plan">
    <section><h3>${esc(tr("This book's default plan", "Plan predeterminado de este libro"))}</h3>
      <p class="fine">${esc(tr("The profile chooses which supports are written for the learner. Intensity says how strongly they are offered. They are separate: set each skill on its own.", "El perfil elige qué apoyos se escribieron para el estudiante. La intensidad dice con qué fuerza se ofrecen. Son independientes: ajusta cada habilidad por separado."))}</p>
      <div class="bk-grid2">${`<label class="bk-f"><span>${esc(tr("Support profile", "Perfil de apoyo"))}</span>${profileSelect(tr, "plan.profile", p.profile)}</label>`}<label class="bk-f"><span>${esc(tr("Overall intensity", "Intensidad general"))}</span>${intSelect(tr, "plan.intensity", p.intensity)}</label>
      ${DOMAINS.map((d) => `<label class="bk-f"><span>${esc(tr(...DOMAIN_LABEL[d]))}</span>${intSelect(tr, `plan.domain.${d}`, p.domains[d])}</label>`).join("")}</div>
      <label class="bk-f"><span>${esc(tr("Reason for this plan (kept in the plan history)", "Motivo de este plan (se guarda en el historial)"))}</span><input data-pf="plan.reason" maxlength="300" value="${esc(p.reason)}"></label>
      <label class="bk-chk"><input type="checkbox" data-pf="plan.auto" ${p.auto ? "checked" : ""}> <span>${esc(tr("Show me suggested changes from this student's work (I always approve them)", "Mostrarme cambios sugeridos según el trabajo del estudiante (yo siempre los apruebo)"))}</span></label>
      <div class="bk-btnrow"><button type="button" class="btn btn-primary" data-spx="plan-save">${esc(tr("Save plan", "Guardar plan"))}</button><button type="button" class="btn ghost" data-spx="plan-level">${esc(tr("Reset to the profile's defaults", "Restablecer a los valores del perfil"))}</button></div>
      <p class="fine">${esc(tr("This never sets an official WIDA level. Profiles are not shown to other students.", "Esto nunca asigna un nivel oficial de WIDA. Los perfiles no se muestran a otros estudiantes."))}</p></section>
    <section><h3>${esc(tr("Support groups", "Grupos de apoyo"))}</h3>
      <ul class="bk-sp-list">${book.groups.map((g) => `<li class="bk-sp-row"><div class="bk-sp-rowmain"><input data-pg="${g.id}.name" value="${esc(g.name)}" aria-label="${esc(tr("Group name", "Nombre del grupo"))}" maxlength="40"> ${profileSelect(tr, `g.${g.id}.profile`, g.plan.profile)} ${intSelect(tr, `g.${g.id}.intensity`, g.plan.intensity)}</div><div class="bk-btnrow"><button type="button" class="btn small" data-spx="group-export" data-id="${g.id}">${bkIcon("export")} ${esc(tr("Export a copy for this group", "Exportar copia para este grupo"))}</button><button type="button" class="bk-tbtn" data-spx="group-del" data-id="${g.id}" aria-label="${esc(tr("Delete group", "Eliminar grupo"))}">${bkIcon("trash")}</button></div></li>`).join("") || `<li class="fine">${esc(tr("No groups yet. A group is a set of students who get the same plan.", "Aún no hay grupos. Un grupo es un conjunto de estudiantes con el mismo plan."))}</li>`}</ul>
      <div class="bk-btnrow"><button type="button" class="btn small" data-spx="group-add">${bkIcon("plus")} ${esc(tr("Add a group", "Agregar un grupo"))}</button></div>
      <p class="fine">${esc(tr("A group copy contains only the supports for that group, so other groups' supports are not in the file. For a class, Publish to class keeps each student's plan on the server, enforced there.", "Una copia de grupo contiene solo los apoyos de ese grupo. Para una clase, Publicar en la clase guarda el plan de cada estudiante en el servidor."))}</p></section>
    <section><h3>${esc(tr("Evidence and fading", "Evidencia y reducción"))}</h3>
      ${recs.length ? `<ul class="bk-sp-list">${recs.map(({ s, r }) => `<li class="bk-sp-row"><div class="bk-sp-rowmain"><strong>${esc(s.title)}</strong><span class="bk-sp-meta">${esc(r.reason)}</span><ul class="fine">${r.evidence.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>${r.kind === "reduce" ? `<div class="bk-btnrow"><button type="button" class="btn small btn-primary" data-spx="fade-yes" data-id="${s.id}">${esc(tr("Approve: one step less", "Aprobar: un paso menos"))}</button><button type="button" class="btn small ghost" data-spx="fade-no" data-id="${s.id}">${esc(tr("Keep as is", "Dejar igual"))}</button></div>` : ""}</li>`).join("")}</ul>` : `<p class="fine">${esc(tr("Open a student's book file here to see how they used each support. Counts describe what happened; fewer clicks are not proof of proficiency.", "Abre aquí el libro de un estudiante para ver cómo usó cada apoyo. Los números describen lo ocurrido; menos clics no prueban dominio."))}</p>`}
      ${book.planLog.length ? `<details><summary>${esc(tr("Plan history", "Historial del plan"))} (${book.planLog.length})</summary><ul>${book.planLog.map((l) => `<li>${esc(l.at.slice(0, 10))}: ${esc(l.domain)} ${esc(l.from)} → ${esc(l.to)}. ${esc(l.reason)}</li>`).join("")}</ul></details>` : ""}
      <div class="bk-btnrow"><button type="button" class="btn small" data-spx="evidence-export">${bkIcon("export")} ${esc(tr("Export an evidence summary", "Exportar un resumen de evidencia"))}</button></div></section>
    <section><h3>${esc(tr("Deliver to a class", "Entregar a una clase"))}</h3>
      <p class="fine">${esc(tr("With a class code and your class passcode, each student's plan is kept on the server and each student receives only their own supports.", "Con un código de clase y tu clave de docente, el plan de cada estudiante se guarda en el servidor y cada estudiante recibe solo sus propios apoyos."))}</p>
      <div class="bk-grid2"><label class="bk-f"><span>${esc(tr("Class code", "Código de clase"))}</span><input data-cls="code" maxlength="6" autocapitalize="characters" value="${esc(st.cls?.code || book.assignment?.classCode || "")}"></label><label class="bk-f"><span>${esc(tr("Class teacher passcode", "Clave de docente de la clase"))}</span><input data-cls="pass" type="password" autocomplete="off" maxlength="40"></label></div>
      <div class="bk-btnrow"><button type="button" class="btn" data-spx="cls-publish">${esc(tr("Publish assignment to class", "Publicar tarea en la clase"))}</button></div><p class="fine" role="status" data-cls-status></p></section></div>`;
}

// ── preview ──
function previewHTML(E, st) {
  const tr = E.I.S;
  const pv = (st.pv = st.pv || { a: "3", b: "", page: E.core.S.pageIndex });
  const opts = (v) =>
    `${LEVELS.map((l) => `<option value="${l.n}" ${String(v) === String(l.n) ? "selected" : ""}>${esc(profileLabel(l.n, tr))}</option>`).join("")}<option value="none" ${v === "none" ? "selected" : ""}>${esc(tr("No support", "Sin apoyo"))}</option><option value="help" ${v === "help" ? "selected" : ""}>${esc(tr("Help on demand", "Ayuda a pedido"))}</option>`;
  return `<div class="bk-pv-bar"><label class="bk-f inline"><span>${esc(tr("Preview as", "Ver como"))}</span><select data-pv="a">${opts(pv.a)}</select></label>
    <label class="bk-f inline"><span>${esc(tr("Compare with", "Comparar con"))}</span><select data-pv="b"><option value="">${esc(tr("Nothing", "Nada"))}</option>${opts(pv.b)}</select></label>
    <label class="bk-f inline"><span>${esc(tr("Page", "Página"))}</span><select data-pv="page">${E.core.S.book.pages.map((p, i) => `<option value="${i}" ${pv.page === i ? "selected" : ""}>${i === 0 ? esc(tr("Cover", "Portada")) : i + 1}</option>`).join("")}</select></label></div>
    <p class="fine bk-pv-note" role="note">${esc(tr("This is what a student with that profile sees. Nothing you do here changes any student's work or progress.", "Esto es lo que ve un estudiante con ese perfil. Nada de lo que hagas aquí cambia el trabajo ni el progreso de un estudiante."))}</p>
    <div class="bk-pv-cols${pv.b ? " is-two" : ""}"><div class="bk-pv-col" data-pv-col="a"></div>${pv.b ? '<div class="bk-pv-col" data-pv-col="b"></div>' : ""}</div>`;
}

function audienceOf(v) {
  if (v === "none") return { plan: { profile: 0, intensity: "none", domains: {} }, profile: 0 };
  if (v === "help") return { plan: normalizePlan({ profile: 0, intensity: "help" }), profile: 0 };
  return { plan: planForLevel(Number(v)), profile: Number(v) };
}

export function afterPreview(E, st) {
  const tr = E.I.S;
  const book = E.core.S.book;
  const pv = st.pv;
  const page = book.pages[pv.page] || book.pages[0];
  for (const slot of ["a", "b"]) {
    const col = panel(E).querySelector(`[data-pv-col="${slot}"]`);
    if (!col || !pv[slot]) continue;
    const aud = audienceOf(pv[slot]);
    let draftBox = "";
    const draw = () => {
      const open = col.querySelector("[data-pv-write]")?.value || draftBox;
      draftBox = open;
      const word = host.vocabFor(page.id);
      const clone = JSON.parse(
        JSON.stringify({
          ...book,
          pages: book.pages.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  elements: p.elements.map((e) =>
                    e.html ? { ...e, html: markVocab(e.html, word) } : e,
                  ),
                }
              : p,
          ),
        }),
      );
      const width = Math.min(pv.b ? 240 : 300, (panel(E).clientWidth - 80) / (pv.b ? 2 : 1.4));
      col.innerHTML = `<h3>${esc(slot === "a" ? (pv.a === "none" ? tr("No support", "Sin apoyo") : pv.a === "help" ? tr("Help on demand", "Ayuda a pedido") : profileLabel(Number(pv.a), tr)) : pv.b === "none" ? tr("No support", "Sin apoyo") : pv.b === "help" ? tr("Help on demand", "Ayuda a pedido") : profileLabel(Number(pv.b), tr))}</h3>
        <div class="bk-pv-page" style="width:${Math.max(220, width)}px">${pageHTML(
          clone,
          clone.pages.find((p) => p.id === page.id),
          { mode: "read", lang: E.I.spanish ? "es" : "en" },
        )}</div>
        ${host.trayHTML(page.id) || `<p class="fine">${esc(tr("No supports for this page and profile.", "No hay apoyos para esta página y perfil."))}</p>`}
        <label class="bk-f"><span>${esc(tr("Try writing here (preview only)", "Prueba a escribir aquí (solo vista previa)"))}</span><textarea rows="3" data-pv-write>${esc(draftBox)}</textarea></label>`;
    };
    const insert = (_s, text) => {
      const ta = col.querySelector("[data-pv-write]");
      if (ta) ta.value = `${ta.value}${ta.value && !/\s$/.test(ta.value) ? " " : ""}${text}`;
      draftBox = ta?.value || "";
    };
    const host = createSupportHost(sandboxHost(E, book, { ...aud, onRefresh: () => draw() }, { insert }));
    col.__host = host;
    draw();
    col.addEventListener("click", (e) => host.onClick(e, page.id));
    col.addEventListener("input", (e) => host.onInput(e));
    col.addEventListener("change", (e) => host.onChange(e));
  }
}

export function onInput(E, e) {
  const t = e.target;
  const st = E.spStudio;
  if (t.matches("[data-pv]") && e.type === "change") {
    st.pv[t.dataset.pv] = t.dataset.pv === "page" ? Number(t.value) : t.value;
    return E.spStudioRender();
  }
  if (t.matches("[data-dz-text]")) {
    st.dz.text = t.value;
    return;
  }
  if (t.matches("[data-dz-inc]")) {
    t.checked ? st.dz.include.add(t.dataset.dzInc) : st.dz.include.delete(t.dataset.dzInc);
    if (e.type === "change") E.spStudioRender();
    return;
  }
  const book = E.core.S.book;
  const f = t.dataset?.pf;
  if (f && e.type === "change") {
    if (f.startsWith("g.")) {
      const [, gid, key] = f.split(".");
      const g = book.groups.find((x) => x.id === gid);
      if (!g) return;
      if (key === "profile") g.plan = { ...planForLevel(Number(t.value)), reason: g.plan.reason };
      else
        g.plan = normalizePlan({
          ...g.plan,
          intensity: t.value,
          domains: Object.fromEntries(DOMAINS.map((d) => [d, t.value])),
        });
      E.core.commit();
      return E.spStudioRender();
    }
    st.planDraft = st.planDraft || {};
    st.planDraft[f] = t.type === "checkbox" ? t.checked : t.value;
    if (f === "plan.profile") {
      const base = planForLevel(Number(t.value));
      Object.assign(st.planDraft, {
        "plan.intensity": base.intensity,
        ...Object.fromEntries(DOMAINS.map((d) => [`plan.domain.${d}`, base.intensity])),
      });
      book.plan = normalizePlan({
        ...book.plan,
        ...base,
        reason: book.plan.reason,
        auto: book.plan.auto,
      });
      return E.spStudioRender();
    }
    return;
  }
  if (t.matches("[data-pg]") && e.type === "change") {
    const [gid] = t.dataset.pg.split(".");
    const g = book.groups.find((x) => x.id === gid);
    if (g) {
      g.name = t.value.slice(0, 40) || g.name;
      E.core.commit();
    }
  }
  if (f === "plan.reason") {
    st.planDraft = { ...(st.planDraft || {}), "plan.reason": t.value };
  }
}

export async function onClick(E, e, b, act) {
  const tr = E.I.S;
  const { core } = E;
  const st = E.spStudio;
  const book = core.S.book;
  const id = b.dataset.id;
  const re = () => E.spStudioRender();
  if (act === "dz-example") {
    st.dz.text = b.dataset.text;
    return re();
  }
  if (act === "dz-plan") {
    const text = panel(E).querySelector("[data-dz-text]")?.value || st.dz.text;
    st.dz.text = text;
    st.dz.plan = interpretCommand(text, book, plainText);
    st.dz.list = planToSupports(st.dz.plan, book);
    st.dz.include = new Set(st.dz.list.map((s) => s.id));
    return re();
  }
  if (act === "dz-edit") {
    const s = st.dz.list.find((x) => x.id === id);
    if (!s) return;
    st.dz.list = st.dz.list.filter((x) => x.id !== id);
    st.dz.include.delete(id);
    return openBuilder(E, { support: s, returnTo: "designer" });
  }
  if (act === "dz-apply") {
    const chosen = st.dz.list.filter((s) => st.dz.include.has(s.id));
    for (const s of chosen) {
      s.reviewed = true;
      s.order = book.supports.length;
      book.supports.push(s);
    }
    core.commit();
    E.say(
      `${chosen.length} ${tr("supports added. Undo brings them back out.", "apoyos agregados. Deshacer los quita.")}`,
    );
    st.dz = { text: st.dz.text, plan: null, list: [], include: new Set() };
    st.tab = "manage";
    return re();
  }
  if (act === "plan-save") {
    const d = st.planDraft || {};
    const p = book.plan;
    const next = normalizePlan({
      profile: Number(d["plan.profile"] ?? p.profile),
      intensity: d["plan.intensity"] ?? p.intensity,
      domains: Object.fromEntries(DOMAINS.map((x) => [x, d[`plan.domain.${x}`] ?? p.domains[x]])),
      reason: d["plan.reason"] ?? p.reason,
      auto: d["plan.auto"] ?? p.auto,
      at: new Date().toISOString(),
    });
    for (const dom of DOMAINS)
      if (p.domains[dom] !== next.domains[dom])
        book.planLog.push({
          at: next.at,
          domain: dom,
          from: p.domains[dom],
          to: next.domains[dom],
          reason: next.reason,
          supportId: "",
        });
    book.plan = next;
    st.planDraft = null;
    core.commit();
    E.say(tr("Plan saved.", "Plan guardado."));
    return re();
  }
  if (act === "plan-level") {
    book.plan = normalizePlan({
      ...planForLevel(book.plan.profile),
      reason: book.plan.reason,
      auto: book.plan.auto,
    });
    core.commit();
    return re();
  }
  if (act === "group-add") {
    book.groups.push({
      id: `g${Date.now().toString(36)}`,
      name: `${tr("Group", "Grupo")} ${book.groups.length + 1}`,
      plan: planForLevel(3),
    });
    core.commit();
    return re();
  }
  if (act === "group-del") {
    book.groups = book.groups.filter((g) => g.id !== id);
    core.commit();
    return re();
  }
  if (act === "group-export") {
    const g = book.groups.find((x) => x.id === id);
    if (!g) return;
    const copy = groupCopy(book, g);
    const { exportProject } = await import("../export.js");
    const blob = await exportProject({
      ...copy,
      id: `grp${Date.now().toString(36)}`,
      title: `${book.title} (${g.name})`,
    });
    download(
      blob,
      `${book.title.replace(/[^\w-]+/g, "-")}-${g.name.replace(/[^\w-]+/g, "-")}.langbook`,
    );
    E.say(
      `${tr("Exported a copy with only the supports for", "Se exportó una copia solo con los apoyos de")} ${g.name}.`,
    );
    return;
  }
  if (act === "fade-yes" || act === "fade-no") {
    const s = book.supports.find((x) => x.id === id);
    if (!s) return;
    if (act === "fade-yes") {
      const from = book.plan.domains[s.domain];
      const to = stepIntensity(from, "reduce");
      book.plan = normalizePlan({
        ...book.plan,
        domains: { ...book.plan.domains, [s.domain]: to },
        reason: book.plan.reason,
        at: new Date().toISOString(),
      });
      book.planLog.push({
        at: new Date().toISOString(),
        domain: s.domain,
        from,
        to,
        reason: `${tr("Teacher approved a suggestion for", "El docente aprobó una sugerencia para")} “${s.title}”`,
        supportId: s.id,
      });
      core.commit();
      E.say(
        tr(
          "Plan changed one step. It is in the plan history.",
          "Plan cambiado un paso. Está en el historial.",
        ),
      );
    }
    return re();
  }
  if (act === "evidence-export") {
    const text = evidenceReport(book, {
      profileNote: `${tr("Plan", "Plan")}: ${profileLabel(book.plan.profile, tr)} · ${tr(...INTENSITY_LABEL[book.plan.intensity])}`,
    });
    download(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
      `${book.title.replace(/[^\w-]+/g, "-")}-evidence.txt`,
    );
    return;
  }
  if (act === "cls-publish") {
    const code = panel(E).querySelector('[data-cls="code"]').value.trim();
    const pass = panel(E).querySelector('[data-cls="pass"]').value;
    const out = panel(E).querySelector("[data-cls-status]");
    out.textContent = tr("Publishing…", "Publicando…");
    try {
      const { publishAssignment } = await import("./class-sync.js");
      const res = await publishAssignment(book, { code, passcode: pass });
      book.assignment = {
        ...(book.assignment || { id: res.assignmentId, title: book.title, task: "" }),
        id: res.assignmentId,
        classCode: code.toUpperCase(),
      };
      core.commit();
      out.textContent = `${tr("Published. Students in this class can start it from Book Studio.", "Publicado. Los estudiantes de esta clase pueden empezarlo desde Book Studio.")} (${res.supports} ${tr("supports", "apoyos")})`;
    } catch (error) {
      out.textContent =
        error?.userMessage ||
        tr(
          "Could not publish. Check the class code and passcode, then try again. Your book is unchanged.",
          "No se pudo publicar. Revisa el código y la clave e inténtalo de nuevo. Tu libro no cambió.",
        );
    }
  }
}

void FORMATS;
void level;
void applySupport;
void DOMAIN_LABEL;
