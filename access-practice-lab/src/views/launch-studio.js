// Teacher launch builder. Links contain only public task IDs and instructional settings.
// No roster, name, response, or student progress is encoded in a launch URL.
import { bandRows } from "../content.js";
import { BASE, CORE_DOMAINS, html } from "../util.js";
import { activityHref } from "./room.js";

const state = { band: "6-8", domain: "", skill: "", length: "", mode: "learning", selected: "", rows: [] };

function options(items, selected, emptyLabel) {
  return html`<option value="">${emptyLabel}</option>${items.map((item) => html`<option value="${item.value}" ${item.value === selected ? "selected" : ""}>${item.label}</option>`)}`;
}

function taskUrl(row) {
  if (!row) return "";
  const url = new URL(activityHref(row.domain, row.level, row.id), location.origin);
  url.searchParams.set("grades", state.band);
  if (state.mode === "independent") url.searchParams.set("mode", "independent");
  return url.href;
}

function selectedRow() { return state.rows.find((row) => row.id === state.selected) || null; }

function filteredRows() {
  return state.rows.filter((row) =>
    (!state.domain || row.domain === state.domain) &&
    (!state.skill || row.skill === state.skill) &&
    (!state.length || Number(row.minutes || 0) <= Number(state.length)),
  );
}

export async function render(ctx) {
  state.band = ctx.band;
  try { state.rows = await bandRows(state.band); }
  catch { state.rows = []; }
  const rows = filteredRows();
  if (!rows.some((row) => row.id === state.selected)) state.selected = rows[0]?.id || "";
  const row = selectedRow();
  const skills = [...new Set(state.rows.filter((r) => !state.domain || r.domain === state.domain).map((r) => r.skill).filter(Boolean))].sort();
  const url = taskUrl(row);
  const domains = CORE_DOMAINS.map((name) => ({ value: name, label: name }));
  const taskOptions = rows.map((r) => ({ value: r.id, label: `${r.title} · ${r.domain} · ${r.minutes || "—"} min` }));
  return {
    title: "Teacher Launch Studio",
    html: html`<section class="room-hero">
      <div><p class="eyebrow">TEACHER WORKSPACE</p><h1 tabindex="-1">Teacher Launch Studio</h1>
      <p class="lead">Build a focused, direct classroom link in a few steps. Learners can open it without an account.</p></div>
    </section>
    <section class="panel teacher-launch-panel" aria-labelledby="launch-config-title">
      <h2 id="launch-config-title">Configure a practice launch</h2>
      <p>Choose an existing activity. The link includes its grade band and selected practice mode; it does not include student information.</p>
      <div class="teacher-launch-grid">
        <label class="field">Grade band<select data-launch-field="band"><option value="3-5" ${state.band === "3-5" ? "selected" : ""}>Grades 3–5</option><option value="6-8" ${state.band === "6-8" ? "selected" : ""}>Grades 6–8</option></select></label>
        <label class="field">Language domain<select data-launch-field="domain">${options(domains, state.domain, "All four domains")}</select></label>
        <label class="field">Target skill<select data-launch-field="skill">${options(skills.map((s) => ({ value: s, label: s })), state.skill, "Any skill")}</select></label>
        <label class="field">Session length<select data-launch-field="length">${options([{ value: "10", label: "Up to 10 minutes" }, { value: "20", label: "Up to 20 minutes" }, { value: "30", label: "Up to 30 minutes" }], state.length, "Any length")}</select></label>
        <label class="field">Practice mode<select data-launch-field="mode"><option value="learning" ${state.mode === "learning" ? "selected" : ""}>Learning — supports and feedback</option><option value="independent" ${state.mode === "independent" ? "selected" : ""}>Independent — try on your own first</option></select></label>
        <label class="field teacher-launch-task">Activity<select data-launch-field="selected" ${rows.length ? "" : "disabled"}>${options(taskOptions, state.selected, rows.length ? "Choose an activity" : "No matching activities")}</select></label>
      </div>
      ${row ? html`<div class="teacher-launch-preview" aria-live="polite"><div><span class="fine">SELECTED ACTIVITY</span><h3>${row.title}</h3><p>${row.domain} · ${row.skill || "Language practice"} · ${row.minutes || "Flexible"} minutes · Grades ${state.band.replace("-", "–")}</p></div><a class="btn btn-primary" href="${url}">Open student activity ↗</a></div>
      <label class="field teacher-launch-url">Direct link<input type="url" readonly value="${url}" data-launch-url aria-label="Direct student activity link"></label>
      <div class="row-actions"><button type="button" class="btn" data-launch-copy>Copy link</button><button type="button" class="btn" data-launch-print>Print launch card</button></div>
      <p class="fine" data-launch-status role="status" aria-live="polite">Share the link with students or display it for the class. A QR code is not shown because this application has no verified QR encoder.</p>` : html`<p role="status">No activity matches those choices. Try a different grade band, domain, skill, or session length.</p>`}
    </section>
    <section class="panel"><h2>Quick links</h2><div class="row-actions"><a class="btn" href="${BASE}/classroom">Whole-Class Language Studio</a><a class="btn" href="/access-teacher/">Open Teacher Hub</a><a class="btn" href="${BASE}/">Return to student lab</a></div><p class="fine">The Teacher Hub stores its local evidence in this browser. Launch links work without sending roster or learner data.</p></section>`,
  };
}

export async function onChange(e, ctx) {
  const field = e.target.dataset.launchField;
  if (!field) return;
  state[field] = e.target.value;
  if (field === "band") {
    state.domain = ""; state.skill = ""; state.selected = "";
    ctx.setBand(state.band);
  }
  if (field === "domain" || field === "band") state.skill = "";
  ctx.rerender();
}

export async function onClick(e) {
  const copy = e.target.closest("[data-launch-copy]");
  const print = e.target.closest("[data-launch-print]");
  const url = taskUrl(selectedRow());
  const status = document.querySelector("[data-launch-status]");
  if (copy) {
    try {
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = "Link copied. It contains the selected activity and mode only.";
    } catch {
      const input = document.querySelector("[data-launch-url]");
      input?.focus(); input?.select();
      if (status) status.textContent = "Clipboard access is unavailable. The link is selected so you can copy it with your keyboard.";
    }
    return true;
  }
  if (print) { window.print(); return true; }
  return false;
}
