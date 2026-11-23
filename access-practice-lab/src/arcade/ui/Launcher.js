// Launcher.js — the one setup screen every flagship game shares: grade, practice level, skills focus and mode.
// Remembers the last choices, offers Continue when a run is saved, and returns a plain config object.
// The WIDA practice level is shown as three groups with the six real level names, as a choice the learner may
// change any time. It is explained as support, never as a test result.
import { html, toHtml, raw } from "../../util.js";
import { LEVEL_GROUPS, LEVEL_NOTE, WIDA_LEVELS, levelOfSupport } from "../../game-core/WidaLevels.js";
import { GRADE_FOCUS } from "../../grade-focus.js";
import { MODES } from "../../game-core/Session.js";
import { loadArcade, saveSettings } from "../../game-core/ArcadeStore.js";
import { tx } from "./strings.js";

const BAND_NAME = { K: ["Kindergarten", "Kínder"], 1: ["Grade 1", "1.º grado"], "2-3": ["Grades 2–3", "2.º–3.º grado"], "3-5": ["Grades 3–5", "3.º–5.º grado"], "6-8": ["Grades 6–8", "6.º–8.º grado"] };
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];

/** Starting config from the saved settings, the page's grade band, the lab's saved support tier and grade focus. */
export function defaultConfig({ band, prefs = {}, game }) {
  const st = loadArcade().settings;
  const supportTier = prefs.tiers?.Reading || "A";
  const level = st.lastLevel && st.lastBand === band ? st.lastLevel : levelOfSupport({ A: "A", B: "B", C: "C" }[supportTier] || "A");
  const mode = game.modes.includes(st.mode) ? st.mode : "classic";
  return { band, gradeFocus: band === "6-8" ? String(prefs.gradeFocus || st.lastGradeFocus || "") : "", level, mode, calm: st.calm || band === "K" || band === "1", focus: "all" };
}

export function launcherHTML({ I, game, config, save, error = "" }) {
  const T = (k) => I.T(...tx(k));
  const S = (k) => I.S(...tx(k));
  const c = config;
  const group = (g) => html`<fieldset class="ax-fieldset"><legend>${I.T(g.en, g.es)}</legend>
    <div class="ax-radio-row">${g.levels.map((n) => html`<label class="ax-pill"><input type="radio" name="level" value="${n}" ${c.level === n ? "checked" : ""}/> <span><b>${n}</b> ${I.T(WIDA_LEVELS[n - 1].en, WIDA_LEVELS[n - 1].es)}</span></label>`)}</div></fieldset>`;
  return toHtml(html`<section class="ax-launch ax-read" data-ax-launch aria-labelledby="ax-l-h">
    <h1 id="ax-l-h" tabindex="-1">${I.T(...game.title)}</h1><p class="ax-lead">${I.T(...game.tag)}</p>
    ${error ? html`<p class="ax-note" role="alert">${error}</p>` : ""}
    ${save ? html`<div class="ax-resume" role="group" aria-label="${S("resumeFound")}"><p><strong>${T("resumeFound")}</strong></p><button type="button" class="ax-btn ax-btn-primary" data-ax="continue">${T("continueRun")}</button> <button type="button" class="ax-btn" data-ax="discard">${T("newRun")}</button></div>` : ""}
    <form class="ax-form" data-ax-form>
      <fieldset class="ax-fieldset"><legend>${T("gradeLabel")}</legend>
        <p class="ax-fine">${I.T(...(BAND_NAME[c.band] || [c.band, c.band]))}</p>
        ${c.band === "6-8" ? html`<div class="ax-radio-row">${GRADE_FOCUS.map((f) => html`<label class="ax-pill"><input type="radio" name="focus" value="${f.id}" ${String(c.gradeFocus) === f.id ? "checked" : ""}/> <span>${I.T(f.label[0], f.label[1])}</span></label>`)}</div>` : ""}</fieldset>
      <div class="ax-levels"><h2 class="ax-h3">${T("levelLabel")}</h2><p class="ax-fine">${I.T(LEVEL_NOTE.en, LEVEL_NOTE.es)}</p>${LEVEL_GROUPS.map(group)}</div>
      <fieldset class="ax-fieldset"><legend>${T("focusLabel")}</legend><div class="ax-radio-row">
        <label class="ax-pill"><input type="radio" name="skill" value="all" ${c.focus === "all" ? "checked" : ""}/> <span>${T("allSkills")}</span></label>
        ${DOMAINS.filter((d) => game.domains.includes(d)).map((d) => html`<label class="ax-pill"><input type="radio" name="skill" value="${d}" ${c.focus === d ? "checked" : ""}/> <span>${I.T(...tx(`dom_${d}`))}</span></label>`)}</div></fieldset>
      <fieldset class="ax-fieldset"><legend>${T("modeLabel")}</legend>
        ${game.modes.map((m) => html`<label class="ax-pill ax-pill-wide"><input type="radio" name="mode" value="${m}" ${c.mode === m ? "checked" : ""}/> <span><b>${T(`m_${m}`)}</b><br/><small>${T(`d_${m}`)}</small></span></label>`)}
        <label class="ax-check"><input type="checkbox" name="calm" ${c.calm ? "checked" : ""}/> <span>${T("calm")}</span></label></fieldset>
      <button type="submit" class="ax-btn ax-btn-primary ax-btn-big" data-ax="start">${T("start")}</button>
    </form></section>`);
}

/** Read the form back into a config. Rejects nothing: every value is validated again by the session. */
export function readLauncher(root, base) {
  const f = root.querySelector("[data-ax-form]");
  const v = (n) => f.querySelector(`[name="${n}"]:checked`)?.value;
  const cfg = {
    ...base,
    gradeFocus: base.band === "6-8" ? v("focus") || "" : "",
    level: Number(v("level")) || base.level,
    focus: v("skill") || "all",
    mode: Object.keys(MODES).includes(v("mode")) ? v("mode") : "classic",
    calm: Boolean(f.querySelector('[name="calm"]')?.checked),
  };
  saveSettings({ lastBand: cfg.band, lastLevel: cfg.level, lastGradeFocus: cfg.gradeFocus, mode: cfg.mode, calm: cfg.calm });
  return cfg;
}
export { raw };
