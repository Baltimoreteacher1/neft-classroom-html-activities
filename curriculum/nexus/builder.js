// nexus/builder.js — the Mission Builder (/curriculum/nexus/). Three steps by
// default: choose the topic, choose what students should accomplish, preview and
// use. Everything a teacher makes lives on this device; the student link
// carries the mission itself (no account, no server, no student data).

import { compatibility } from "./compat.mjs";
import { docxBytes } from "./docx.mjs";
import { KITS } from "./kits.mjs";
import { GOAL_INFO, sequence, STEP_LABEL } from "./orchestrate.mjs";
import { curriculumLine, packet } from "./packet.mjs";
import { esc, offlineHtml, printHtml } from "./render.mjs";
import { encode, fromLibrary, LIBRARY, normalize, validate } from "./resource.mjs";
import { applySync, planSync, restore } from "./sync.mjs";
import { customizeHtml, planHtml, readCustomize, versionsHtml } from "./builder-panels.js";

const STORE = "nt-nexus-teacher:v1";
const app = document.getElementById("nx-app");

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || "null");
    if (s && typeof s === "object") return { missions: s.missions || {}, prefs: s.prefs || {} };
  } catch {
    /* blocked storage: work in memory */
  }
  return { missions: {}, prefs: {} };
}
const db = load();
let storageOk = true;
function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(db));
  } catch {
    storageOk = false;
  }
}

let stage = 1;
let res = null; // the applied resource
let pending = null; // {draft, plan}
let exportLang = db.prefs.lang === "es" ? "es" : "en";

const mine = () =>
  Object.values(db.missions)
    .sort((a, b) => (b.updated || 0) - (a.updated || 0))
    .map((m) => normalize(m))
    .filter(Boolean);

function commit(next, summaryPlan) {
  const plan = summaryPlan || planSync(res, next);
  if (plan.empty) return;
  res = applySync(res, normalize(next), plan, pending?.useNew || []);
  res.history = (res.history || []).slice(0, 15);
  db.missions[res.id] = { ...res, updated: Date.now() };
  persist();
}

function stepStrip() {
  const names = ["Choose the topic", "Choose the goal", "Preview and use"];
  return `<ol class="nx-steps" aria-label="Builder steps">${names.map((n, i) => `<li><button type="button" class="nx-stepbtn${stage > i + 1 ? " done" : ""}" data-stage="${i + 1}" ${i + 1 === stage ? 'aria-current="step"' : ""} ${i + 1 > stage && !res ? "disabled" : ""}>${i + 1}. ${n}</button></li>`).join("")}</ol>`;
}

function topicCard(r, mineCard = false) {
  const status = r.curriculum.status;
  const badge =
    status === "verified"
      ? `<span class="nx-badge">Lesson ${esc(r.curriculum.lesson)} · verified</span>`
      : status === "adapted"
        ? `<span class="nx-badge adapted">Adapted from ${esc(r.curriculum.lesson)}</span>`
        : "";
  return `<button type="button" class="nx-choice" data-${mineCard ? "mine" : "topic"}="${esc(mineCard ? r.id : r.source)}"><b>${esc(r.title.en)}</b><small>${esc(KITS[r.kit].skill.en)} · ${esc(r.objective.en)}</small>${badge}</button>`;
}

function stage1() {
  const my = mine();
  return `<h2>What topic?</h2><p class="nx-lede">Each mission is built on a working model from a Reveal Math Grade 6 lesson, so the numbers, questions and answer keys always agree.</p>
    <div class="nx-grid">${LIBRARY.map((l) => topicCard(fromLibrary(l.id))).join("")}</div>
    ${my.length ? `<h2 style="margin-top:22px">My missions</h2><div class="nx-grid">${my.map((m) => topicCard(m, true)).join("")}</div>` : ""}`;
}

function stage2() {
  return `<h2>What should students accomplish?</h2><p class="nx-lede">${esc(res.title.en)}</p><div class="nx-grid">${Object.entries(
    GOAL_INFO,
  )
    .map(
      ([k, g]) =>
        `<button type="button" class="nx-choice" data-goal="${k}" aria-pressed="${res.goal === k}"><b>${esc(g.label.en)}</b><small>${esc(g.detail.en)}</small></button>`,
    )
    .join("")}</div>`;
}

function studentUrl(extra = "") {
  return `${location.origin}/curriculum/nexus/play/?${extra}#m=${encode(res)}`;
}

function stage3() {
  const compat = compatibility(res);
  const can = (id) => compat.find((c) => c.id === id)?.ok;
  const steps = sequence(res)
    .map((s) => STEP_LABEL[s].en)
    .join(" → ");
  const supportText = {
    off: "Independent version: no word bank or frames.",
    light: "Word bank and one sentence frame.",
    full: "Word bank, sentence kernels, because / but / so, oral rehearsal and a paragraph frame.",
  }[res.support];
  const dl = (id, label, act, need = id) =>
    `<button type="button" class="nx-btn" data-act="${act}" ${can(need) ? "" : "disabled"}>${label}</button>`;
  return `<div class="nx-card"><p class="nx-kicker">${esc(KITS[res.kit].skill.en)}</p><h2>${esc(res.title.en)}</h2><p>${esc(res.objective.en)}</p><p class="nx-note">${esc(curriculumLine(res, "en") || "No verified curriculum source.")}</p><p><b>Students will:</b> ${esc(steps)}</p>
      <div class="nx-row"><a class="nx-btn primary" href="${esc(studentUrl("preview=1"))}" target="_blank" rel="noopener">Preview as a student ↗</a><button type="button" class="nx-btn" data-act="copy">Copy student link</button></div><p class="nx-note" id="nx-copied" role="status"></p></div>
    <div class="nx-card"><h2>Add language support</h2><div class="nx-seg" role="group" aria-label="Language support">${["off", "light", "full"].map((s) => `<button type="button" data-support="${s}" aria-pressed="${res.support === s}">${{ off: "Off", light: "Light", full: "Full" }[s]}</button>`).join("")}</div><p class="nx-note">${supportText} The questions stay the same in every version; supports never contain an answer.</p></div>
    <div class="nx-card"><h2>Make the materials</h2><div class="nx-row" style="margin-bottom:8px"><span>Language:</span><div class="nx-seg" role="group" aria-label="Materials language"><button type="button" data-xlang="en" aria-pressed="${exportLang === "en"}">English</button><button type="button" data-xlang="es" aria-pressed="${exportLang === "es"}" ${can("spanish") ? "" : "disabled"}>Español</button></div></div>
      <div class="nx-row">${dl("worksheet", "Worksheet (print / PDF)", "ws")}${dl("worksheet", "Independent version (print / PDF)", "ws-ind")}${dl("key", "Answer key + notes (print / PDF)", "key")}${dl("docx", "Word: student", "docx")}${dl("docx", "Word: answer key", "docx-key")}${dl("offline", "Offline HTML file", "offline")}</div>
      <details class="nx-more"><summary>What this mission can become</summary><ul class="nx-compat">${compat.map((c) => `<li class="${c.ok ? "" : "no"}"><b>${c.ok ? "✓" : "—"} ${esc(c.label.en)}</b>${c.reason ? `<small>${esc(c.reason)}</small>` : ""}${c.warn ? `<small>${esc(c.warn)}</small>` : ""}</li>`).join("")}</ul></details></div>
    ${customizeHtml(res)}${versionsHtml(res)}
    ${storageOk ? "" : '<p class="nx-banner">This browser is not saving. Your mission works until you close the page; copy the student link to keep it.</p>'}`;
}

function render() {
  const body = stage === 1 ? stage1() : stage === 2 ? stage2() : stage3();
  app.innerHTML = `${stepStrip()}<section id="nx-stage" tabindex="-1">${body}</section>`;
}

function go(n) {
  stage = n;
  pending = null;
  render();
  app.querySelector("#nx-stage")?.focus();
}

function download(name, bytes, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function openPrint(html) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const w = window.open(url, "_blank", "noopener");
  if (!w) download("mission-print.html", html, "text/html");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

const slug = () =>
  (res.title.en || "mission")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "mission";

function act(kind) {
  const lang = exportLang === "es" && compatibility(res).find((c) => c.id === "spanish")?.ok ? "es" : "en";
  const title = lang === "es" && res.title.es ? res.title.es : res.title.en;
  const sfx = lang === "es" ? "-es" : "";
  if (kind === "copy") {
    const url = studentUrl();
    const note = app.querySelector("#nx-copied");
    navigator.clipboard?.writeText(url).then(
      () => (note.textContent = "Copied. Paste it into Canvas, Google Classroom or an email."),
      () =>
        (note.innerHTML = `Copy this link: <input class="nx-input" readonly value="${esc(url)}" aria-label="Student link">`),
    ) ??
      (note.innerHTML = `Copy this link: <input class="nx-input" readonly value="${esc(url)}" aria-label="Student link">`);
    return;
  }
  if (kind === "ws") return openPrint(printHtml(packet(res, { lang }), { lang, title }));
  if (kind === "ws-ind")
    return openPrint(printHtml(packet(res, { lang, supported: false }), { lang, title }));
  if (kind === "key")
    return openPrint(printHtml(packet(res, { lang, audience: "teacher" }), { lang, title }));
  if (kind === "docx")
    return download(
      `${slug()}-student${sfx}.docx`,
      docxBytes(packet(res, { lang }), { lang, title }),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  if (kind === "docx-key")
    return download(
      `${slug()}-answer-key${sfx}.docx`,
      docxBytes(packet(res, { lang, audience: "teacher" }), { lang, title }),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  if (kind === "offline")
    return download(`${slug()}-offline${sfx}.html`, offlineHtml(res, lang), "text/html");
}

app.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  const d = t.dataset;
  if (d.stage) return go(Number(d.stage));
  if (d.topic) {
    res = fromLibrary(d.topic, db.prefs.goal || "understand");
    res.id = `m${Date.now().toString(36)}`;
    res.support = db.prefs.support || "light";
    return go(2);
  }
  if (d.mine) {
    res = normalize(db.missions[d.mine]);
    return go(3);
  }
  if (d.goal) {
    commit({ ...res, goal: d.goal });
    if (!db.missions[res.id]) db.missions[res.id] = { ...res, updated: Date.now() };
    db.prefs.goal = d.goal;
    persist();
    return go(3);
  }
  if (d.support) {
    commit({ ...res, support: d.support });
    db.prefs.support = d.support;
    persist();
    return render();
  }
  if (d.xlang) {
    exportLang = d.xlang;
    db.prefs.lang = exportLang;
    persist();
    return render();
  }
  if (d.act) return act(d.act);
  if (d.review !== undefined) {
    const draft = readCustomize(app, res);
    const { resource, errors } = validate(draft);
    const plan = errors.length ? null : planSync(res, resource);
    pending = plan ? { draft: resource, plan, useNew: [] } : null;
    app.querySelector("#nx-plan").innerHTML = planHtml(plan || { empty: true }, errors);
    return;
  }
  if (d.apply !== undefined && pending) {
    pending.useNew = [...app.querySelectorAll("[data-usenew]:checked")].map(
      (x) => x.dataset.usenew,
    );
    commit(pending.draft, pending.plan);
    pending = null;
    render();
    app.querySelector("#nx-customize")?.setAttribute("open", "");
    app.querySelector("#nx-plan").innerHTML =
      '<p class="nx-fb" role="status">Applied. Every version below now uses the change.</p>';
    return;
  }
  if (d.vdel !== undefined) {
    t.closest("[data-vrow]").remove();
    return;
  }
  if (d.vadd !== undefined) {
    const draft = readCustomize(app, res);
    draft.vocab.push({ term: { en: "new word", es: "" }, def: { en: "", es: "" } });
    const keep = res;
    res = { ...res, vocab: draft.vocab };
    render();
    res = keep;
    app.querySelector("#nx-customize").setAttribute("open", "");
    return;
  }
  if (d.restore) {
    const back = restore(res, Number(d.restore));
    if (back) {
      res = normalize(back);
      res.history = back.history;
      db.missions[res.id] = { ...res, updated: Date.now() };
      persist();
      render();
    }
  }
});

render();
