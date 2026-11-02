// Family Setup: four optional questions (language, grade, who, time). No names, birthdays or emails.
// Each answer saves at once; Skip and Back are always available; answers can be changed later.
import { langSwitchHTML } from "../i18n.js";
import { BASE, announce, html, icon } from "../util.js";
import { getFamily, familyPatch } from "./state.js";
import { crumbs, subnavHTML } from "./ui.js";

const TOTAL = 4;
let step = 1;
let focusQuestion = false;

const choice = (attr, value, pressed, label, sub) =>
  html`<button type="button" class="fam-choice" ${attr}="${value}" aria-pressed="${pressed}"><strong>${label}</strong>${sub ? html`<span>${sub}</span>` : ""}</button>`;

function question(I, family, ctx) {
  if (step === 1)
    return { id: "lang", q: I.L("setup.q.lang"), body: html`<div class="fam-choice-row">${langSwitchHTML(I.mode, { large: true, idPrefix: "setup" })}</div>` };
  if (step === 2)
    return {
      id: "grade",
      q: I.L("setup.q.grade"),
      body: html`<div class="fam-choice-grid">
        ${choice("data-fam-grade", "3-5", ctx.band === "3-5" && Boolean(family.grade), I.L("setup.grade.35"), I.L("setup.grade.35.sub"))}
        ${choice("data-fam-grade", "6-8", ctx.band === "6-8" && Boolean(family.grade), I.L("setup.grade.68"), I.L("setup.grade.68.sub"))}
      </div>`,
    };
  if (step === 3)
    return {
      id: "who",
      q: I.L("setup.q.who"),
      body: html`<div class="fam-choice-grid">
        ${choice("data-fam-who-pick", "together", family.who === "together", I.L("setup.who.together"), I.L("setup.who.together.sub"))}
        ${choice("data-fam-who-pick", "independent", family.who === "independent", I.L("setup.who.independent"), I.L("setup.who.independent.sub"))}
      </div>`,
    };
  return {
    id: "time",
    q: I.L("setup.q.time"),
    body: html`<div class="fam-choice-grid fam-choice-4">
        ${[5, 10, 15, 0].map((m) => choice("data-fam-minutes", String(m), family.done && family.minutes === m, I.L(`setup.time.${m}`)))}
      </div>
      <p class="fine">${I.L("setup.time.note")}</p>`,
  };
}

const unset = (I) => I.L("setup.unset");
function summaryRows(I, family, ctx) {
  const lang = { en: "English", es: "Español", bi: "English + Español" }[I.mode];
  return [
    [1, I.L("setup.summary.lang"), lang],
    [2, I.L("setup.summary.grade"), family.grade ? I.L(family.grade === "3-5" ? "setup.grade.35" : "setup.grade.68") : unset(I)],
    [3, I.L("setup.summary.who"), family.who ? I.L(`setup.who.${family.who}`) : unset(I)],
    [4, I.L("setup.summary.time"), family.done ? I.L(`setup.time.${family.minutes}`) : unset(I)],
  ];
}

export async function render(ctx, I) {
  const family = getFamily(ctx.prefs);
  const band = ctx.band;
  const done = step > TOTAL;
  const head = html`${crumbs(I, I.L("setup.title"))}
    <section class="fam-setup panel" aria-labelledby="famSetupTitle">
      <p class="eyebrow">${icon("settings")} ${I.L("hub.eyebrow")}</p>
      <h1 id="famSetupTitle" tabindex="-1">${done ? I.L("setup.done.title") : I.L("setup.title")}</h1>`;
  if (done)
    return {
      title: I.LS("setup.title"),
      html: html`${head}
        <p class="lead">${I.L("setup.done.lead")}</p>
        <dl class="fam-summary">
          ${summaryRows(I, family, ctx).map(([n, label, value]) => html`<div><dt>${label}</dt><dd>${value}</dd><dd><button type="button" class="ghost small" data-fam-step="${n}">${I.L("setup.done.change")}<span class="visually-hidden"> ${label}</span></button></dd></div>`)}
        </dl>
        <a class="btn btn-primary btn-big" href="${BASE}/family/practice?grades=${band}">${I.L("setup.done.start")}${icon("arrow-right")}</a>
      </section>${subnavHTML(I, "start", band)}`,
    };
  const q = question(I, family, ctx);
  return {
    title: I.LS("setup.title"),
    html: html`${head}
      <p class="lead">${I.L("setup.lead")}</p>
      <p class="fam-step" role="status"><span>${I.L("setup.step", { n: step, total: TOTAL })}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round((step / TOTAL) * 100)}%"></i></span></p>
      <div role="group" aria-labelledby="famSetupQ">
        <h2 id="famSetupQ" tabindex="-1">${q.q}</h2>
        ${q.body}
      </div>
      <div class="fam-setup-nav">
        ${step > 1 ? html`<button type="button" class="btn" data-fam-back>${icon("arrow-left")} ${I.L("setup.back")}</button>` : html`<span></span>`}
        ${step === 1 || step === 2 || step === 3 ? html`<button type="button" class="btn btn-primary" data-fam-next>${I.L("setup.next")}${icon("arrow-right")}</button>` : ""}
        <button type="button" class="ghost" data-fam-skip>${I.L("setup.skip")}</button>
      </div>
      </section>${subnavHTML(I, "start", band)}`,
  };
}

export function mount(_root, ctx) {
  if (focusQuestion) {
    focusQuestion = false;
    // The router restores focus right after mount (to the page title when the control it used is gone);
    // a microtask lands after that, so the next question keeps the keyboard.
    queueMicrotask(() => document.getElementById("famSetupQ")?.focus({ preventScroll: false }));
  }
}

/** Entering from a link starts at the first question, or at the summary when setup is already finished. */
export function enter(ctx) {
  const f = getFamily(ctx.prefs);
  step = f.done ? TOTAL + 1 : 1;
}

const go = (n, ctx) => {
  step = n;
  focusQuestion = true;
  ctx.rerender();
};

export function onClick(e, ctx) {
  const t = e.target;
  const family = getFamily(ctx.prefs);
  if (t.closest("[data-lang-mode]")) {
    // The shared handler saves the language and redraws; we only advance the question.
    if (step === 1) {
      step = 2;
      focusQuestion = true;
    }
    return false;
  }
  const grade = t.closest("[data-fam-grade]");
  if (grade) {
    const value = grade.dataset.famGrade;
    ctx.setBand(value);
    ctx.setPrefs(familyPatch(ctx.prefs, { grade: value }));
    ctx.navigate(`${BASE}/family/start?grades=${value}`, { replace: true });
    step = 3;
    focusQuestion = true;
    ctx.rerender();
    return true;
  }
  const who = t.closest("[data-fam-who-pick]");
  if (who) {
    ctx.setPrefs(familyPatch(ctx.prefs, { who: who.dataset.famWhoPick }));
    go(4, ctx);
    return true;
  }
  const minutes = t.closest("[data-fam-minutes]");
  if (minutes) {
    ctx.setPrefs(familyPatch(ctx.prefs, { minutes: Number(minutes.dataset.famMinutes), done: true, skipped: false }));
    announce(document.documentElement.lang === "es" ? "Configuración guardada." : "Setup saved.");
    go(TOTAL + 1, ctx);
    return true;
  }
  const stepBtn = t.closest("[data-fam-step]");
  if (stepBtn) return (go(Number(stepBtn.dataset.famStep), ctx), true);
  if (t.closest("[data-fam-back]")) return (go(Math.max(1, step - 1), ctx), true);
  if (t.closest("[data-fam-next]")) return (go(Math.min(TOTAL, step + 1), ctx), true);
  if (t.closest("[data-fam-skip]")) {
    ctx.setPrefs(familyPatch(ctx.prefs, { skipped: true }));
    ctx.navigate(`${BASE}/family/practice?grades=${ctx.band}`);
    return true;
  }
  return false;
}
