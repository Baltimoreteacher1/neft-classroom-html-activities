// Teacher Tour 2.0 (/start/tour): ONE persistent workspace. Welcome → Experience → Support → Implement → Prepare →
// Classroom Launch Studio → My First Lesson Kit are internal states of this one screen, never routes: previews,
// the resource finder, the studio and the kit all open inside the shell, the URL never changes, and nothing needs the
// browser Back button. Progress, choices, the selected activity and the lesson edits are saved on this device
// (intro state key "tour2") after every change, so a refresh or Save & Exit loses nothing.
//
// Files: tour/model.js (state, registry, finder), tour/lesson.js (supports, timed lesson), tour/views-*.js (screens),
// tour/export-*.js (PDF, DOCX), tour/quickref.js (links). This file owns events, loading and focus.
import { loadDomain, loadIndex } from "../content.js";
import { BASE, announce, copyText, html, icon, toHtml } from "../util.js";
import { teacherPick } from "./band.js";
import { bindGuide, guideBubbleHTML } from "./guide.js";
import { kitDocx } from "./tour/export-docx.js";
import { kitPdf } from "./tour/export-pdf.js";
import { buildLesson, lessonText } from "./tour/lesson.js";
import {
  APPROACHES,
  BANDS,
  NEFT,
  STEPS,
  STEP_IDS,
  STORE_KEY,
  TOUR_STEPS,
  buildRegistry,
  findRow,
  focusDomain,
  freshState,
  isUnfinished,
  normalizeState,
  pickOf,
  recommend,
  studentUrl,
} from "./tour/model.js";
import { quickRows } from "./tour/quickref.js";
import { qrFits } from "./tour/ui.js";
import { KIT_TABS, kitScreen, projectionCard, studentCard } from "./tour/views-kit.js";
import { SEQUENCE, experience, implement, prepare, support, welcome } from "./tour/views-steps.js";
import { STUDIO_VIEWS, STUDIO_TITLES, currentLesson, lessonPreview } from "./tour/views-studio.js";
import { loadIntro, updateIntro } from "./state.js";

const ACTIVE = "lp-t2-active";
const cap = (d) => d[0].toUpperCase() + d.slice(1);
const STEP_VIEWS = { welcome, experience, support, implement, prepare };
const HELP = {
  welcome: "Select a card to look inside. Choose Speaking, Writing or Both, then press Continue.",
  experience:
    "The activity below is the real student page. Answer it, then press Continue. Your answers are not saved.",
  support:
    "Switch between Starting, Growing and Expanding. The goal stays the same; the supports change.",
  implement:
    "Pick a grade band, skill and purpose. Preview a result, then choose Use This in My First Lesson.",
  prepare: "Step through the six parts. Your chosen activity is the Practice part.",
  studio: "Confirm your choices, generate the lesson, then edit anything you like.",
  kit: "Download, copy or print any part. Everything is saved on this device.",
};

let S = freshState();
let ui = {};
const D = {
  rows: [],
  doms: new Map(),
  act(pick) {
    return (
      this.doms
        .get(`${pick.band}/${pick.domain}`)
        ?.levels?.[pick.level]?.activities?.find((a) => a.id === pick.id) || null
    );
  },
};
let nav = null; // ctx.navigate

const freshUi = () => ({
  peek: "",
  seq: "introduce",
  previewKey: "",
  student: false,
  linkcheck: false,
  kitTab: "guide",
  gate: false,
  confirmNew: false,
});

/* ── persistence ── */
const save = () => {
  S.updatedAt = Date.now();
  updateIntro(STORE_KEY, () => ({ ...S }));
};
const readSaved = () => normalizeState(loadIntro()[STORE_KEY]);
const stepIndex = () => STEP_IDS.indexOf(S.step);
function go(step) {
  S.step = step;
  S.furthest = Math.max(S.furthest, STEP_IDS.indexOf(step));
  ui.previewKey = "";
  save();
}

/* ── data ── */
async function load(band, domain) {
  const key = `${band}/${domain}`;
  if (!D.doms.has(key)) D.doms.set(key, await loadDomain(band, cap(domain)).catch(() => null));
}
/** The activity files the current screen needs, fetched before it is drawn. */
async function prepareData() {
  const need = new Set();
  const add = (b, d) => need.add(`${b}|${d}`);
  if (S.step === "welcome") {
    add(S.band, "speaking");
    add(S.band, "writing");
  }
  if (S.step === "experience" || S.step === "support") add(S.band, S.tab);
  if (S.step === "implement") add(S.band, S.finder.domain || focusDomain(S));
  if (S.pick) add(S.pick.band, S.pick.domain);
  await Promise.all([...need].map((k) => load(...k.split("|"))));
}

/** If the saved pick no longer exists in the catalog, drop it rather than build a broken lesson. */
function validatePick() {
  if (S.pick && !findRow(D.rows, S.pick)) {
    S.pick = null;
    if (["studio", "kit"].includes(S.step)) S.step = "implement";
  }
}

/* ── screens ── */
const stepName = () =>
  S.step === "studio"
    ? "Classroom Launch Studio"
    : S.step === "kit"
      ? "Your Lesson Kit"
      : `Step ${stepIndex() + 1} of ${TOUR_STEPS}: ${STEPS[stepIndex()].name}`;

function gateParts() {
  const st = STEPS[Math.min(S.furthest, STEPS.length - 1)];
  return {
    guide: html`<p class="t2-eyebrow">Teacher Tour</p>
      <h1 id="t2Title" tabindex="-1">Welcome back</h1>
      <p class="t2-objective">You have a tour in progress on this device.</p>`,
    stage: html`<section class="t2-gate" aria-labelledby="t2Title">
      <p>
        You stopped at
        <strong>${st.name}</strong
        >${S.pick ? html` with <strong>${findRow(D.rows, S.pick)?.title || "your activity"}</strong> chosen` : ""}.
      </p>
      <div class="t2-bar">
        <button type="button" class="btn btn-primary" data-t2="gate-continue">
          ${icon("arrow-right")}Continue Where I Left Off
        </button>
        ${
          ui.confirmNew
            ? html`<button type="button" class="btn" data-t2="gate-new" data-t2-confirmed="1">
                  Yes, replace my saved tour</button
                ><button type="button" class="t2-linkbtn" data-t2="gate-cancel">
                  Keep my saved tour
                </button>`
            : html`<button type="button" class="btn" data-t2="gate-new">Start a New Tour</button>`
        }
      </div>
      <p class="t2-note">
        Starting a new tour replaces what is saved here. Saved work stays in this browser on this
        device only.
      </p>
    </section>`,
  };
}

/** Mr. Neft opens every screen in a speech bubble; his question box folds behind "Ask Mr. Neft a question". */
function withNeft(p, key) {
  const n = NEFT[key] || NEFT.welcome;
  const bubble = guideBubbleHTML({
    say: n.say,
    role: "Your tour guide",
    chips: n.chips,
    context: { page: "tour", step: key, pick: S.band === "3-5" ? "4-5" : "6-8", domain: S.tab },
  });
  return { ...p, guide: html`${bubble}${p.guide}` };
}

function parts() {
  if (ui.gate) return withNeft(gateParts(), "gate");
  if (S.step === "kit") {
    const L = currentLesson(D, S);
    if (L) return withNeft(kitScreen(L, ui), "kit");
  }
  if (S.step === "studio" && S.pick) return withNeft(STUDIO_VIEWS[S.studioScreen](D, S, ui), "studio");
  const step = STEP_VIEWS[S.step] ? S.step : "welcome";
  return withNeft(STEP_VIEWS[step](D, S, ui), step);
}

function progressHTML() {
  return html`<ol class="t2-progress" aria-label="Tour progress">
    ${STEPS.map((s, i) => {
      const done = i < S.furthest || (i === S.furthest && i < stepIndex());
      const now = i === stepIndex();
      const label = s.id === "studio" ? "Build" : s.id === "kit" ? "Kit" : s.name;
      const dot = html`<span class="t2-dot" aria-hidden="true"
          >${done && !now ? icon("check") : i + 1}</span
        ><span class="t2-dot-name">${label}</span>`;
      return html`<li
        class="${now ? "is-now" : done ? "is-done" : ""}"
        ${now ? html`aria-current="step"` : ""}
      >
        ${i <= S.furthest && !now && !ui.gate ? html`<button type="button" data-t2="goto" data-t2-value="${s.id}">${dot}<span class="visually-hidden"> (go back to this step)</span></button>` : html`<span>${dot}</span>`}
      </li>`;
    })}
  </ol>`;
}

function topHTML() {
  return html`<div class="t2-brand">
      ${icon("flag")}<span><strong>The Language Page</strong> · Teacher Tour</span>
    </div>
    <p class="t2-step" aria-live="polite">${ui.gate ? "Welcome back" : stepName()}</p>
    ${ui.gate ? "" : progressHTML()}
    <details class="t2-help">
      <summary>${icon("help")}<span>Help</span></summary>
      <p>${HELP[S.step] || HELP.welcome}</p>
    </details>
    <button type="button" class="btn t2-exit" data-t2="exit">
      ${icon("save")}Save &amp; Exit
    </button>`;
}

function footHTML() {
  if (ui.gate) return html``;
  const i = stepIndex();
  const backDisabled = S.step === "welcome";
  let next = { label: STEPS[i].cta || "Continue", off: false, why: "" };
  if (S.step === "implement" && !S.pick)
    next = {
      label: "Continue",
      off: true,
      why: "Choose Use This in My First Lesson on an activity to continue.",
    };
  if (S.step === "studio")
    next = {
      label: ["", "Generate My Lesson", "Review and Adjust", "Create My Lesson Kit"][
        S.studioScreen
      ],
      off: false,
      why: "",
    };
  if (S.step === "kit") next = { label: "Use My Lesson", off: false, why: "" };
  return html`<button
      type="button"
      class="btn t2-back"
      data-t2="back"
      ${backDisabled ? html`aria-disabled="true"` : ""}
    >
      ${icon("arrow-left")}Back
    </button>
    <p class="t2-foot-note" id="t2Why" role="status">${next.why}</p>
    <button
      type="button"
      class="btn btn-primary t2-next"
      data-t2="next"
      ${next.off ? html`aria-disabled="true" aria-describedby="t2Why"` : ""}
    >
      ${next.label}${icon("arrow-right")}
    </button>`;
}

const q = (sel) => document.querySelector(sel);
const set = (sel, v) => {
  const el = q(sel);
  if (el) el.innerHTML = toHtml(v);
};

/** Redraw one region or all; `focus` moves focus to the page title (a new screen), otherwise it stays put. */
function draw({ all = true, focus = false } = {}) {
  const p = parts();
  set("[data-t2-top]", topHTML());
  set("[data-t2-foot]", footHTML());
  if (all) {
    set("[data-t2-guide]", p.guide);
    set("[data-t2-stage]", p.stage);
  }
  q("[data-t2-root]")?.setAttribute("data-step", ui.gate ? "gate" : S.step);
  if (focus) q("#t2Title")?.focus({ preventScroll: true });
  afterDraw();
}

function afterDraw() {
  const mic = q("[data-t2-mic]");
  if (!mic) return;
  const say = (t) => (mic.textContent = t);
  if (!navigator.mediaDevices?.getUserMedia)
    return say(
      "Microphone: not available in this browser. Students can say the answer aloud to a partner and type notes in the activity instead.",
    );
  navigator.permissions?.query({ name: "microphone" }).then(
    (r) => {
      const t = () =>
        say(
          r.state === "granted"
            ? "Microphone: allowed. You can record inside the activity."
            : r.state === "denied"
              ? "Microphone: blocked in this browser. Use the alternative below: say the answer aloud to a partner and type notes in the activity."
              : "Microphone: your browser will ask for permission when you press Record.",
        );
      t();
      r.onchange = t;
    },
    () => say("Microphone: your browser will ask for permission when you press Record."),
  );
  if (!navigator.permissions)
    say("Microphone: your browser will ask for permission when you press Record.");
}

async function show({ focus = true, all = true } = {}) {
  await prepareData();
  validatePick();
  draw({ all, focus });
  if (focus) window.scrollTo({ top: 0 });
}

/* ── lifecycle ── */
export async function render(ctx) {
  nav = ctx.navigate;
  const index = await loadIndex().catch(() => null);
  if (!index)
    return {
      title: "Teacher Tour",
      html: html`<article class="t2">
        <p class="t2-note is-alert" role="alert">
          ${icon("alert")}The activity list did not load. Check the connection and
          <a href="${BASE}/start/tour">try again</a>.
        </p>
      </article>`,
    };
  D.rows = buildRegistry(index).filter((r) => qrFits(studentUrl(r)));
  S = readSaved();
  ui = freshUi();
  const r = ctx.route || {};
  const fresh = S.furthest === 0 && !S.pick;
  // Older links (?grades=, ?skill=speaking|writing, ?part=2) still land somewhere sensible, but never override saved work.
  if (fresh) {
    const asked = teacherPick(ctx);
    S.band = asked === "6-8" ? "6-8" : "3-5";
    if (["speaking", "writing"].includes(r.skill)) {
      S.focus = r.skill;
      S.tab = r.skill;
      if (r.part === "2") S.step = "experience";
    }
  }
  let active = false;
  try {
    active = sessionStorage.getItem(ACTIVE) === "1";
  } catch {}
  ui.gate = !fresh && !active;
  await prepareData();
  validatePick();
  const p = parts();
  return {
    title: "Teacher Tour",
    html: html`<article
      class="t2"
      data-t2-root
      data-step="${ui.gate ? "gate" : S.step}"
      aria-label="Teacher Tour"
    >
      <header class="t2-top" data-t2-top>${topHTML()}</header>
      <div class="t2-main">
        <section class="t2-guide" data-t2-guide aria-label="Teacher guidance">${p.guide}</section>
        <section class="t2-stage" data-t2-stage aria-label="Interactive experience">
          ${p.stage}
        </section>
      </div>
      <footer class="t2-foot" data-t2-foot>${footHTML()}</footer>
    </article>`,
  };
}

export function mount() {
  bindGuide();
  document.documentElement.classList.add("t2-focus");
  try {
    sessionStorage.setItem(ACTIVE, "1");
  } catch {}
  if (!ui.gate) save();
  afterDraw();
  q("#t2Title")?.focus({ preventScroll: true });
}

export function unmount() {
  document.documentElement.classList.remove("t2-focus", "t2-printing");
  q("#t2PrintHost")?.remove();
  q("#t2Dialog")?.remove();
  // A same-route re-render also unmounts; only leaving the tour ends "this tab is in the tour" (see render's gate).
  if (!location.pathname.includes("/start/tour")) {
    try {
      sessionStorage.removeItem(ACTIVE);
    } catch {}
  }
}

/* ── actions ── */
const rowByKey = (key) => D.rows.find((r) => r.key === key) || null;
const linkRow = () => rowByKey(ui.previewKey) || findRow(D.rows, S.pick);
const levelApproach = (level) =>
  ({ A: "starting", B: "growing", C: "expanding" })[level] || "mixed";

function choose(row) {
  S.pick = pickOf(row);
  S.lesson.approach = levelApproach(row.level);
  S.lesson.edits = {};
  S.band = row.band;
}

async function setField(field, v) {
  const f = S.finder;
  if (field === "band") {
    S.band = v;
    f.domain = f.domain || "";
  } else if (field === "tab") S.tab = v;
  else if (field === "profile") S.profile = v;
  else if (field === "focus") {
    S.focus = v;
    S.tab = v === "writing" ? "writing" : "speaking";
    f.domain = "";
  } else if (field === "finder-domain") f.domain = v;
  else if (field === "finder-purpose") f.purpose = v;
  else if (field === "minutes") S.lesson.minutes = Number(v);
  else if (field === "approach" && APPROACHES.some((a) => a.id === v)) S.lesson.approach = v;
  else if (field === "sband" || field === "sdomain") {
    const band = field === "sband" ? v : S.pick.band;
    const domain = field === "sdomain" ? v : S.pick.domain;
    const best = recommend(D.rows, { band, domain, purpose: S.finder.purpose })[0];
    if (best) {
      choose(best);
      announce("Activity changed. Your edits for the old activity were cleared.");
    }
  }
  save();
  await show({ focus: false });
  q(`[data-t2-field="${field}"][data-t2-value="${v}"]`)?.focus({ preventScroll: true });
}

function download(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const note = (t) => {
  const n = q("[data-t2-kit-note]");
  if (n) n.textContent = t;
  announce(t);
};

function openProjection() {
  const L = currentLesson(D, S);
  if (!L) return;
  q("#t2Dialog")?.remove();
  const dlg = document.createElement("dialog");
  dlg.id = "t2Dialog";
  dlg.className = "t2-dialog";
  dlg.setAttribute("aria-label", "Classroom projection view");
  dlg.innerHTML = `${toHtml(projectionCard(L))}<div class="t2-dialog-bar"><button type="button" class="btn btn-primary" data-t2="close-projection">${toHtml(icon("close"))}Close projection view</button></div>`;
  document.body.append(dlg);
  dlg.addEventListener("close", () => {
    dlg.remove();
    q('[data-t2="next"]')?.focus();
  });
  dlg.showModal();
}

function printCard() {
  const L = currentLesson(D, S);
  if (!L) return;
  q("#t2PrintHost")?.remove();
  const host = document.createElement("div");
  host.id = "t2PrintHost";
  host.innerHTML = toHtml(studentCard(L));
  document.body.append(host);
  document.documentElement.classList.add("t2-printing");
  const done = () => {
    document.documentElement.classList.remove("t2-printing");
    host.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

async function next() {
  const i = stepIndex();
  if (S.step === "implement" && !S.pick)
    return announce("Choose Use This in My First Lesson on an activity first.");
  if (S.step === "prepare") {
    S.studioScreen = 1;
    go("studio");
  } else if (S.step === "studio") {
    if (S.studioScreen < 3) S.studioScreen += 1;
    else {
      S.kit = { createdAt: Date.now() };
      go("kit");
    }
    save();
  } else if (S.step === "kit") return openProjection();
  else go(STEP_IDS[i + 1]);
  await show();
}

async function back() {
  const i = stepIndex();
  if (S.step === "welcome") return;
  if (S.step === "studio" && S.studioScreen > 1) S.studioScreen -= 1;
  else if (S.step === "kit") {
    S.studioScreen = 3;
    S.step = "studio";
  } else if (S.step === "studio") S.step = "prepare";
  else S.step = STEP_IDS[i - 1];
  ui.previewKey = "";
  save();
  await show();
}

/** Synchronous so the router sees `true` at once; the work itself is async (see handle). */
export function onClick(e) {
  const el = e.target.closest?.("[data-t2]");
  if (!el || !el.closest("[data-t2-root], #t2Dialog")) return false;
  e.preventDefault();
  handle(el).catch(() => announce("Something went wrong. Your tour is saved; try again."));
  return true;
}

async function handle(el) {
  if (el.getAttribute("aria-disabled") === "true") {
    if (el.dataset.t2 === "next") announce(q("#t2Why")?.textContent || "Finish this step first.");
    return;
  }
  const act = el.dataset.t2;
  const v = el.dataset.t2Value;
  const L = () => currentLesson(D, S);
  switch (act) {
    case "set":
      await setField(el.dataset.t2Field, v);
      break;
    case "next":
      await next();
      break;
    case "back":
      await back();
      break;
    case "goto":
      go(v);
      await show();
      break;
    case "peek":
      ui.peek = ui.peek === v ? "" : v;
      await show({ focus: false });
      q(`[data-t2="peek"][data-t2-value="${v}"]`)?.focus({ preventScroll: true });
      break;
    case "preview":
      ui.previewKey = v;
      await show({ focus: false });
      q('[data-t2="close-preview"]')?.focus();
      break;
    case "close-preview":
      ui.previewKey = "";
      await show({ focus: false });
      q(`[data-t2="preview"][data-t2-value="${v}"]`)?.focus();
      break;
    case "use-pick": {
      const row = rowByKey(v);
      if (row) {
        choose(row);
        save();
        announce(`${row.title} added to your first lesson.`);
        await show({ focus: false });
        q('[data-t2="use-pick"]')?.focus();
      }
      break;
    }
    case "seq":
      ui.seq = SEQUENCE.some((s) => s.id === v) ? v : "introduce";
      await show({ focus: false });
      q(`[data-t2="seq"][aria-pressed="true"]`)?.focus();
      break;
    case "toggle-ui":
      ui[v] = !ui[v];
      await show({ focus: false });
      q(`[data-t2="toggle-ui"][data-t2-value="${v}"]`)?.focus();
      break;
    case "reload-frame": {
      const f = q(".t2-iframe");
      if (f) f.src = f.src;
      break;
    }
    case "copy-link": {
      const r = linkRow();
      if (r) {
        const ok = await copyText(studentUrl(r));
        note(ok ? "Student link copied." : "Copying was blocked. Select the link and copy it.");
      }
      break;
    }
    case "kit-tab":
      ui.kitTab = v;
      await show({ focus: false });
      q(`[data-t2="kit-tab"][data-t2-value="${v}"]`)?.focus();
      break;
    case "download-pdf":
      if (L()) {
        download(kitPdf(L()), "my-first-lesson-the-language-page.pdf", "application/pdf");
        note("PDF downloaded.");
      }
      break;
    case "download-docx":
      if (L()) {
        download(
          kitDocx(L()),
          "my-first-lesson-the-language-page.docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        note("Editable lesson downloaded.");
      }
      break;
    case "copy-plan":
      if (L()) {
        const ok = await copyText(lessonText(L(), quickRows()));
        note(
          ok
            ? "Lesson plan copied. Paste it into your own document."
            : "Copying was blocked. Use Download Editable Lesson instead.",
        );
      }
      break;
    case "print-card":
      printCard();
      break;
    case "save-return":
      save();
      note(
        "Saved in this browser on this device. Open the Teacher Tour and choose Continue Where I Left Off to return.",
      );
      break;
    case "close-projection":
      q("#t2Dialog")?.close();
      break;
    case "explore":
      save();
      nav?.(`${BASE}/explore`);
      break;
    case "another":
      S.pick = null;
      S.kit = null;
      S.lesson = { ...freshState().lesson };
      S.studioScreen = 1;
      go("implement");
      await show();
      break;
    case "gate-continue":
      ui.gate = false;
      await show();
      break;
    case "gate-new":
      if (el.dataset.t2Confirmed) {
        const keep = S.band;
        S = freshState();
        S.band = keep;
        ui = freshUi();
        save();
        await show();
      } else {
        ui.confirmNew = true;
        draw({ focus: false });
        q('[data-t2="gate-new"]')?.focus();
      }
      break;
    case "gate-cancel":
      ui.confirmNew = false;
      draw({ focus: false });
      break;
    case "exit":
      save();
      nav?.(`${BASE}/`);
      break;
    default:
      break;
  }
}

export async function onInput(e) {
  const k = e.target?.dataset?.t2Input;
  if (!k || !["target", "launch"].includes(k)) return;
  const v = e.target.value;
  if (v.trim()) S.lesson.edits[k] = v;
  else delete S.lesson.edits[k];
  save();
  const L = currentLesson(D, S);
  const host = q("[data-t2-lesson-host]");
  if (L && host) host.innerHTML = toHtml(lessonPreview(L));
}

export async function onChange(e) {
  if (e.target?.dataset?.t2Select !== "resource") return;
  const row = rowByKey(e.target.value);
  if (!row) return;
  choose(row);
  save();
  announce("Activity changed. Your edits for the old activity were cleared.");
  await show({ focus: false });
  q("#t2Resource")?.focus();
}

/** Arrow keys move between the kit tabs, as a tab list should. */
export function onKey(e) {
  const t = e.target?.closest?.('[role="tab"]');
  if (!t || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
  const ids = KIT_TABS.map((x) => x.id);
  const i = ids.indexOf(t.dataset.t2Value);
  const n =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? ids.length - 1
        : (i + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
  e.preventDefault();
  ui.kitTab = ids[n];
  show({ focus: false }).then(() => q(`[data-t2-value="${ids[n]}"][role="tab"]`)?.focus());
}

