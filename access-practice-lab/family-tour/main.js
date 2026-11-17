// The Family Tour controller. One page, one workspace: every stage, the finish and the returning-family screen are drawn
// here from a small saved state. Nothing in the tour navigates away until the family chooses to start an activity.
import { actionsHTML } from "./actions.js";
import { canSpeak, stopSpeech, toggleSpeech } from "./audio.js";
import { demoState, refreshRecorder, ui } from "./demo.js";
import { analyze } from "./feedback.js";
import * as home from "./home.js";
import { LANGS, getLang, setLang, t } from "./i18n.js";
import { kitData } from "./kit-data.js";
import { cardHTML, kitHTML } from "./kit.js";
import { byId, loadPicks } from "./picks.js";
import { createRecorder } from "./recorder.js";
import { BANDS, STAGES, hasProgress, load, save, startOver, storageWorks } from "./state.js";
import * as plan from "./steps/plan.js";
import * as practice from "./steps/practice.js";
import * as welcome from "./steps/welcome.js";
import { esc, icon } from "./util.js";

const root = document.getElementById("tour");
const STEPS = { welcome, practice, plan };
const flow = {
  kitView: false,
  picks: null,
  loadError: false,
  resume: false,
  exited: false,
  saved: false,
  status: "",
  lastStage: "",
};

const params = new URLSearchParams(location.search);

// ---------- screens ----------

const header = (state) => `<header class="top">
  <div class="brand"><span class="logo" aria-hidden="true">${icon("speak")}</span><span><strong>The Language Page</strong><small>${esc(t("meta.tour"))}</small></span></div>
  <div class="top-actions">
    <div class="langs" role="group" aria-label="${esc(t("shell.language"))}">${LANGS.map(
      (l) =>
        `<button type="button" lang="${l.code}" data-act="lang" data-v="${l.code}" aria-pressed="${getLang() === l.code}">${esc(l.label)}</button>`,
    ).join("")}</div>
    ${state.mode === "tour" ? `<button type="button" class="btn-quiet" data-act="save-exit">${esc(t("shell.saveExit"))}</button>` : ""}
  </div></header>`;

const progress = (state) => {
  const i = STAGES.indexOf(state.stage);
  return `<nav class="progress" aria-label="${esc(t("shell.progress"))}"><ol>${STAGES.map(
    (s, n) =>
      `<li class="${n < i || state.done.includes(s) ? "is-done" : ""} ${n === i ? "is-now" : ""}" ${n === i ? 'aria-current="step"' : ""}><span class="dot">${n < i ? icon("check") : n + 1}</span><span class="pname">${esc(t(`stage.${s}.short`))}</span></li>`,
  ).join(
    "",
  )}</ol><div class="bar"><span style="width:${Math.round(((i + 1) / STAGES.length) * 100)}%"></span></div>
  <p class="ptext">${esc(t("shell.stepOf", { n: i + 1, total: STAGES.length }))}</p></nav>`;
};

const listen = (text) =>
  canSpeak()
    ? `<button type="button" class="btn-listen" data-act="listen" data-text="${esc(text)}" data-speech="${t("meta.speech")}" aria-pressed="false" aria-label="${esc(t("shell.listenDirections"))}">${icon("listen")}<span>${esc(t("shell.listen"))}</span></button>`
    : "";

function languageGate() {
  return `<div class="gate"><span class="logo big" aria-hidden="true">${icon("speak")}</span>
    <h1><span lang="en">Welcome to The Language Page</span><br><span lang="es">Bienvenidos a The Language Page</span></h1>
    <p class="lead"><span lang="en">Choose your language for the family tour.</span><br><span lang="es">Elijan su idioma para el recorrido familiar.</span></p>
    <div class="gate-btns"><button type="button" class="btn-primary btn-big" lang="en" data-act="lang" data-v="en" data-first="1">English</button>
    <button type="button" class="btn-primary btn-big" lang="es" data-act="lang" data-v="es" data-first="1">Español</button></div>
    <p class="fine"><span lang="en">You can change the language at any time.</span> <span lang="es">Pueden cambiar el idioma en cualquier momento.</span></p></div>`;
}

const shell = (state, inner) => `<div class="app">
  <a class="skip" href="#stage">${esc(t("shell.skip"))}</a>${header(state)}${inner}
  <div id="announce" class="sr" aria-live="polite"></div></div>`;

const errorScreen = () =>
  `<main id="stage" class="center" tabindex="-1"><h1>${esc(t("error.title"))}</h1><p>${esc(t("error.text"))}</p>
   <button type="button" class="btn-primary" data-act="retry-load">${esc(t("error.retry"))}</button>
   <p class="fine">${esc(t("error.safe"))}</p><p><a href="/access-practice-lab/">${esc(t("error.lab"))}</a></p></main>`;

function resumeScreen() {
  return `<main id="stage" class="center" tabindex="-1"><h1>${esc(t("resume.title"))}</h1><p class="lead">${esc(t("resume.text"))}</p>
    <div class="gate-btns"><button type="button" class="btn-primary btn-big" data-act="resume-continue">${esc(t("resume.continue"))}</button>
    <button type="button" class="btn-quiet btn-big" data-act="resume-restart">${esc(t("resume.restart"))}</button></div></main>`;
}

function exitScreen() {
  const ok = storageWorks();
  return `<main id="stage" class="center" tabindex="-1"><h1>${esc(t("exit.title"))}</h1><p class="lead">${esc(t(ok ? "exit.text" : "exit.noStorage"))}</p>
    <p class="fine">${esc(t("kit.local"))}</p>
    <div class="gate-btns"><button type="button" class="btn-primary btn-big" data-act="resume-continue">${esc(t("resume.continue"))}</button>
    <a class="btn-quiet btn-big" href="/access-practice-lab/">${esc(t("exit.lab"))}</a></div></main>`;
}

function stageScreen(state) {
  const step = STEPS[state.stage];
  const finish = state.stage === "kit";
  const out = finish ? finishScreen(state) : step.render({ state, picks: flow.picks });
  const i = STAGES.indexOf(state.stage);
  const last = state.stage === "plan";
  const dir = t(`stage.${state.stage}.dir`);
  return `${progress(state)}<main id="stage" class="stage st-${state.stage}" tabindex="-1">
    <div class="stage-head"><h1>${esc(t(`stage.${state.stage}.title`))}</h1>${listen(`${t(`stage.${state.stage}.title`)}. ${dir}`)}</div>
    <p class="dir-line">${esc(dir)}</p>
    <div class="stage-body">${out.html}</div>
    ${finish ? "" : `<details class="ctx-help"><summary>${esc(t("shell.needHelp"))}</summary><p>${esc(t(`stage.${state.stage}.help`))}</p></details>`}
  </main>
  ${
    finish
      ? ""
      : `<footer class="nav"><p class="hint" role="status">${esc(out.hint || "")}</p><div class="nav-btns">
    ${i > 0 ? `<button type="button" class="btn-quiet" data-act="back">← ${esc(t("shell.back"))}</button>` : "<span></span>"}
    <button type="button" class="btn-primary" data-act="next" ${out.ready ? "" : 'aria-disabled="true"'}>${esc(t(last ? "shell.finish" : "shell.continue"))} →</button>
  </div></footer>`
  }`;
}

/** The finish: one activity for tonight, three steps, one Start button. The full kit waits, folded, for whoever wants it. */
function finishScreen(state) {
  const pick = byId(flow.picks, state.pick);
  if (!pick)
    return {
      ready: false,
      hint: "",
      html: `<p>${esc(t("home.noPlan"))}</p><button type="button" class="btn-primary" data-act="choose-another">${esc(t("finish.another"))}</button>`,
    };
  const k = kitData(state, pick);
  const steps = ["finish.step1", "finish.step2", "finish.step3"]
    .map((key) => `<li>${esc(t(key))}</li>`)
    .join("");
  return {
    ready: true,
    hint: "",
    html: `<section class="next-card" aria-labelledby="tonight-h">
        <p class="tag">${esc(t("finish.tonight"))}</p>
        <h2 id="tonight-h" lang="en">${esc(pick.title)}</h2>
        <p>${esc(t("plan.practices"))} ${esc(k.first.practice)} · ${esc(t("kit.about", { n: pick.minutes }))}</p>
        <ol class="steps">${steps}</ol>
        <a class="btn-primary btn-big" href="${esc(k.first.url)}" data-launch>${esc(t("kit.start"))}</a>
      </section>
      <p class="finish-links"><button type="button" class="btn-quiet" data-act="choose-another">${esc(t("finish.another"))}</button>
        <a class="btn-quiet" href="/access-practice-lab/family">${esc(t("finish.home"))}</a></p>
      <details class="ctx-help kit-more"><summary>${esc(t("finish.more"))}</summary>
        ${actionsHTML(k, { saved: flow.saved, storage: storageWorks(), start: false })}${kitHTML(k)}</details>
      <div class="print-host" id="print-card-host">${cardHTML(k)}</div>`,
  };
}

function homeScreen(state) {
  const out = home.render({ state, picks: flow.picks });
  return `<main id="stage" class="stage st-home" tabindex="-1"><div class="stage-head"><h1>${esc(t("home.title"))}</h1>${listen(t("home.title"))}</div>
    <p class="dir-line">${esc(t("home.dir"))}</p><div class="stage-body">${out.html}</div></main>`;
}

// ---------- render ----------

function focusKey(el) {
  if (!el || el === document.body) return "";
  if (el.matches?.('input[type="radio"]'))
    return `input[name="${el.name}"][value="${CSS.escape(el.value)}"]`;
  if (el.dataset?.act)
    return `[data-act="${el.dataset.act}"]${el.dataset.v ? `[data-v="${CSS.escape(el.dataset.v)}"]` : ""}${el.dataset.id ? `[data-id="${CSS.escape(el.dataset.id)}"]` : ""}`;
  return el.id ? `#${CSS.escape(el.id)}` : "";
}

function render({ stageChanged = false } = {}) {
  const state = load();
  setLang(state.lang || getLang());
  const keep = focusKey(document.activeElement);
  const y = window.scrollY;
  let inner;
  if (!state.lang) {
    root.innerHTML = `<div class="app"><main id="stage" class="center" tabindex="-1">${languageGate()}</main></div>`;
    document.title = "The Language Page · Family Tour | Recorrido familiar";
    return;
  }
  if (flow.loadError) inner = errorScreen();
  else if (!flow.picks)
    inner = `<main id="stage" class="center" tabindex="-1"><p role="status">${esc(t("shell.loading"))}</p></main>`;
  else if (flow.exited) inner = exitScreen();
  else if (flow.resume) inner = resumeScreen();
  else if (state.mode === "home" && !flow.kitView && byId(flow.picks, state.pick))
    inner = homeScreen(state);
  else inner = stageScreen(state);
  root.innerHTML = shell(state, inner);
  const heading = state.mode === "home" ? t("home.title") : t(`stage.${state.stage}.title`);
  document.title = `${heading} · ${t("meta.title")}`;
  if (stageChanged || flow.exited || flow.resume) {
    const main = document.getElementById("stage");
    main?.classList.add("is-entering");
    main?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    const live = document.getElementById("announce");
    if (live && state.mode === "tour" && !flow.exited && !flow.resume)
      live.textContent = `${t("shell.stepOf", { n: STAGES.indexOf(state.stage) + 1, total: STAGES.length })}: ${t(`stage.${state.stage}.title`)}`;
  } else {
    window.scrollTo(0, y);
    if (keep) document.querySelector(keep)?.focus({ preventScroll: true });
  }
}

function closeMedia() {
  stopSpeech();
  for (const r of Object.values(ui.recorders)) r.dispose();
  ui.recorders = {};
}

function go(stage) {
  closeMedia();
  const state = load();
  const done =
    state.done.includes(state.stage) || STAGES.indexOf(stage) < STAGES.indexOf(state.stage)
      ? state.done
      : [...state.done, state.stage];
  flow.kitView = stage === "kit";
  const patch = { stage, done, mode: stage === "kit" ? "home" : "tour" };
  // Tonight's activity starts chosen: the first fit for the family's grade and focus, unless they already chose one that fits.
  if (stage === "plan") {
    const recs = plan.recsFor(flow.picks, state);
    if (recs.length && !recs.some((p) => p.id === state.pick)) patch.pick = recs[0].id;
  }
  save(patch);
  render({ stageChanged: true });
}

// ---------- actions ----------

const say = (msg) => {
  flow.status = msg;
  const el = document.getElementById("action-status");
  if (el) el.textContent = msg;
};

const pickOf = (id) => ui.picks[id] || byId(flow.picks, id);

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    return ok;
  }
}

const ACTIONS = {
  lang: ({ v }) => {
    stopSpeech();
    const first = !load().lang;
    save({ lang: v });
    setLang(v);
    if (first) init(false);
    else render();
  },
  "save-exit": () => {
    closeMedia();
    save({});
    flow.exited = true;
    render({ stageChanged: true });
  },
  "resume-continue": () => {
    flow.exited = false;
    flow.resume = false;
    render({ stageChanged: true });
  },
  "resume-restart": () => {
    startOver();
    flow.resume = false;
    render({ stageChanged: true });
  },
  next: () => {
    const state = load();
    const i = STAGES.indexOf(state.stage);
    const out = STEPS[state.stage].render({ state, picks: flow.picks });
    if (!out.ready) {
      document.querySelector(".hint")?.classList.add("shake");
      return;
    }
    go(STAGES[i + 1]);
  },
  back: () => go(STAGES[Math.max(0, STAGES.indexOf(load().stage) - 1)]),
  support: ({ id, k }) => {
    const st = demoState(id);
    st.open[k] = !st.open[k];
    render();
  },
  listen: (d, el) => {
    el.setAttribute("aria-pressed", "true");
    const reset = () =>
      document
        .querySelectorAll('[data-act="listen"]')
        .forEach((b) => b.setAttribute("aria-pressed", "false"));
    toggleSpeech(d.text, d.text, d.speech, reset);
    if (!window.speechSynthesis?.speaking) reset();
  },
  "resp-mode": ({ id, v }) => {
    demoState(id).mode = v;
    render();
  },
  "rec-start": ({ id }) => {
    const rec = (ui.recorders[id] ||= createRecorder((state) =>
      state === "recorded" ? render() : refreshRecorder(id),
    ));
    rec.start();
  },
  "rec-stop": ({ id }) => ui.recorders[id]?.stop(),
  "rec-reset": ({ id }) => {
    ui.recorders[id]?.reset();
    render();
  },
  check: ({ id }) => {
    const st = demoState(id);
    const field = document.getElementById(`ans-${id}`);
    st.text = field ? field.value : st.text;
    const prev = [...st.attempts].reverse().find((a) => !a.empty) || null;
    st.attempts.push(analyze(st.text, pickOf(id), prev));
    st.checked = true;
    render();
    document.querySelector("[data-feedback]")?.scrollIntoView({ block: "nearest" });
  },
  retry: ({ id }) => {
    const st = demoState(id);
    st.checked = false;
    render();
    document.getElementById(`ans-${id}`)?.focus();
  },
  choose: ({ v }) => {
    save({ pick: v });
    render();
  },
  "choose-another": () => go("plan"),
  "tr-status": ({ tr, v }) => {
    const rows = load().tracker.map((r, i) =>
      i === Number(tr) ? { ...r, status: r.status === v ? "" : v } : r,
    );
    save({ tracker: rows });
    render();
  },
  download: async () => {
    const state = load();
    const pick = byId(flow.picks, state.pick);
    try {
      const { buildKitPdf, downloadBlob } = await import("./kit-pdf.js");
      downloadBlob(buildKitPdf(kitData(state, pick)), `${t("kit.file")}.pdf`);
      say(t("kit.downloaded"));
    } catch {
      say(t("kit.downloadFailed"));
    }
  },
  "print-card": () => {
    document.body.classList.add("printing-card");
    window.print();
  },
  "copy-link": async () => {
    const pick = byId(flow.picks, load().pick);
    say(t((await copyLink(kitData(load(), pick).first.url)) ? "kit.copied" : "kit.copyFailed"));
  },
  "save-plan": () => {
    save({ savedAt: new Date().toISOString() });
    flow.saved = true;
    say(t(storageWorks() ? "kit.saved" : "kit.saveFailed"));
  },
  retake: () => {
    closeMedia();
    flow.kitView = false;
    save({ mode: "tour", stage: "welcome", done: [] });
    home.view.open = "";
    render({ stageChanged: true });
  },
  "choose-another": () => {
    closeMedia();
    flow.kitView = false;
    save({ mode: "tour", stage: "plan" });
    render({ stageChanged: true });
  },
  "home-open": ({ v }) => {
    home.view.open = home.view.open === v ? "" : v;
    render();
    document.getElementById(`home-${v}`)?.scrollIntoView({ block: "nearest" });
  },
  "session-check": ({ v }) => {
    const n = Number(v);
    home.view.checked = home.view.checked.includes(n)
      ? home.view.checked.filter((x) => x !== n)
      : [...home.view.checked, n];
    render();
  },
  "retry-load": () => init(true),
};

function onChoice(el) {
  const k = el.dataset.k;
  const value = k === "minutes" ? Number(el.value) : el.value;
  const state = load();
  const patch = { [k]: value };
  // In the tour a changed grade or focus means the earlier pick may no longer fit (the plan step re-chooses on entry);
  // at home the plan stays until a new one is chosen.
  if (state.mode === "tour" && state[k] !== value) patch.pick = "";
  save(patch);
  render();
}

root.addEventListener("click", (e) => {
  const launch = e.target.closest("[data-launch]");
  if (launch) {
    save({ mode: "home" });
    closeMedia();
    return;
  }
  const el = e.target.closest("[data-act]");
  if (!el || el.matches('input[type="radio"], input[type="checkbox"]')) return;
  if (el.getAttribute("aria-disabled") === "true" && el.dataset.act === "next") {
    ACTIONS.next();
    return;
  }
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn({ ...el.dataset }, el);
});

root.addEventListener("change", (e) => {
  const el = e.target;
  if (el.matches('input[data-act="set"]')) onChoice(el);
  else if (el.matches('input[data-act="session-check"]'))
    ACTIONS["session-check"]({ ...el.dataset });
  else if (el.dataset.tr !== undefined) {
    const rows = load().tracker.map((r, i) =>
      i === Number(el.dataset.tr) ? { ...r, [el.dataset.f]: el.value } : r,
    );
    save({ tracker: rows });
  }
});

root.addEventListener("input", (e) => {
  if (e.target.dataset?.draft) demoState(e.target.dataset.draft).text = e.target.value;
});

window.addEventListener("afterprint", () => document.body.classList.remove("printing-card"));
window.addEventListener("pagehide", closeMedia);

async function init(retry = false) {
  const lang = params.get("lang");
  if (!retry && (lang === "en" || lang === "es") && !load().lang) save({ lang });
  const g = params.get("grades");
  if (!retry && BANDS.includes(g === "4-5" ? "3-5" : g) && !load().band)
    save({ band: g === "4-5" ? "3-5" : g });
  flow.loadError = false;
  render({ stageChanged: !retry });
  if (!load().lang) return;
  try {
    flow.picks = await loadPicks();
  } catch {
    flow.loadError = true;
  }
  const state = load();
  flow.resume = !retry && hasProgress(state) && Boolean(flow.picks);
  render({ stageChanged: true });
}

init();
