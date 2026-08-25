/**
 * notebook-checkpoint.js — "write it in your notebook" checkpoints.
 *
 * Students work the lesson on a Chromebook and take notes BY HAND in their own
 * notebook. They are not filling in a printed worksheet: a single canonical
 * "Math Notes" model shows the page layout to recreate, every lesson, in three
 * numbered sections worked top-to-bottom.
 *
 *   1. MATH WORDS    — word | what it means in my own words
 *   2. TODAY'S MATH  — the rule, formula, or model we are using
 *   3. MY WORK       — every step shown, problems numbered
 *
 * Each section is one checkpoint. At the phase it is attached to, the lesson
 * will not advance until the student (a) confirms they wrote it and (b) types
 * the short thing they just wrote by hand. The typing is PROOF OF WRITING, not
 * an assessment item: it is never compared against a correct answer, never
 * scored, never marked right or wrong, and never reaches the grade bridge.
 *
 * WHY THE GATE LIVES IN app.navigateTo AND NOT ON A BUTTON. A phase can be left
 * five ways (the Continue button, the sidebar, the minimap dots, a resume
 * restore, an in-phase control). All five funnel through app.navigateTo, so
 * that is the only honest chokepoint. Nothing here matches on rendered label
 * text — a single article once defeated a completion regex on the pre-unit
 * projects and that page recorded nothing at all.
 */

// Phase identity in this engine is POSITIONAL: lesson-renderer.js hands
// createApp a fixed 8-slot array of render functions. These names are the
// stable ids lesson data refers to, mapped to those slots.
import { attachImageZoomAll } from "./image-zoom.js";
import { vocabImageAlt } from "./vocab-images.js";

export const PHASE_IDS = [
  "warmup",
  "objectives",
  "launch",
  "explore",
  "practice",
  "connect",
  "reflect",
  "objectives-review",
];

export const BOXES = [1, 2];
const MAX_LENGTH = 40;
const MIN_LENGTH = 1;

// The one canonical model. Declared once, here — never per lesson.
export const MATH_NOTES_MODEL_PAGE = "/curriculum/student-supports/math-notes/";
// The Math Notes support page. The lesson dialog no longer links to it: that
// link opened the sample page below, which is the fabricated "Lesson 1-1 ·
// Sept. 3 / Area = base × height" example — the same content removed from the
// dialog itself, one click further away. The dialog now shows this lesson's
// own notes and needs no onward link. The page stays on its own route, where
// it is reached deliberately rather than from inside a lesson.
//
// The canonical model page image. It is NOT shown inside the lesson dialog:
// the sample page prints a made-up lesson header ("Lesson 1-1 · Sept. 3") and
// worked mathematics of its own ("Area = base × height", vocabulary "variable /
// expression / evaluate"), so on every lesson it put another lesson's content
// under the student's nose — the exact thing the provenance layer exists to
// prevent. The dialog shows the lesson's real notes instead; the model still
// lives on /curriculum/student-supports/math-notes/ where it is clearly a
// sample of the PAGE LAYOUT and not today's work.
export const MATH_NOTES_MODEL_IMAGE = "/assets/math-notes/math-notes-model.svg";

// Marks a save/resume `custom` slice as notebook capture. The save/resume
// engine keys provider payloads by REGISTRATION INDEX ("p0", "p1", …), which no
// caller controls, so the payload identifies itself instead. assets/canvas-
// bridge.js strips any slice carrying this key before writing suspend_data.
export const NOTEBOOK_STATE_KEY = "__ntNotebook";

// Every DOM id the checkpoint block creates starts with this. The save/resume
// engine captures EVERY form field on the page generically, by id — so without
// a second guard keyed on this prefix the capture text reaches suspend_data
// through `fields`, entirely bypassing the `custom` slice guard above. Observed
// in a real SCORM launch, not theorised. Mirrored in assets/canvas-bridge.js.
export const NOTEBOOK_FIELD_PREFIX = "nt-nb-";

/**
 * The classroom norm, verbatim.
 *
 * These strings are the FLOOR, not the plan: an authored `prompt` in a lesson's
 * notebook data always wins for the body. Headings, the checkbox line and the
 * blocked line are constant in every lesson on purpose — the words a student
 * reads at a checkpoint must not change from lesson to lesson. Do not
 * paraphrase them.
 */
export const DEFAULT_PROMPTS = {
  1: {
    heading: "Notebook time — Section 1: Math Words",
    body: "Start a new page. Write today's lesson number and the date at the top. Then write each math word from this lesson and what it means in your own words.",
    capture: "Type one word you wrote.",
  },
  2: {
    heading: "Notebook time — Section 2: Today's Math",
    body: "Copy the rule, formula, or model from the screen into your notebook. Write it exactly as it appears, then read it back to yourself before you move on.",
    capture: "Type the rule you wrote.",
  },
  3: {
    heading: "Notebook time — Section 3: My Work",
    body: "Work these problems in your notebook, not on the screen. Number each problem and show every step.",
    capture: "Type your answer to the first problem.",
  },
};

/**
 * Box 2 has TWO legitimate states, and they must not read alike.
 *
 * When the lesson states a rule this engine can quote with provenance, box 2
 * prints it and the student copies it. When the lesson states no complete rule
 * — 74 of 84 lessons, and a correct outcome, not a gap — there is nothing to
 * copy, and the default copy said "Copy the rule, formula, or model from the
 * screen ... exactly as it appears" over an empty space. That is what made a
 * deliberate state look like a failed load.
 *
 * These are the same three sections of the same notebook page; only the source
 * of the words changes.
 */
export const OWN_WORDS_PROMPTS = {
  2: {
    heading: "Notebook time — Section 2: My Math Rule",
    body: "Think back over this lesson. Write the most important math rule or idea in your own words — the way you would explain it to someone who missed today.",
    capture: "Type the rule you wrote.",
  },
};

export const CHECKBOX_LABEL = "I wrote this in my notebook.";

// The Math Notes trigger's label. One wording, every box, every lesson, both
// content states. It asks about the PAGE LAYOUT, so it stays true whether or
// not the lesson supplies a rule to copy — nothing here may say "copy the
// rule", which on 74 lessons would name something that is not on the screen.
export const MODEL_LINK_LABEL = "What should my page look like?";
export const BLOCKED_MESSAGE = "Write it in your notebook first, then check the box to keep going.";

/**
 * Which of the two states is this box in?
 *
 * "lesson" — the lesson supplies the words and the student copies them.
 * "own-words" — the lesson supplies none, and the student writes their own.
 *
 * Box 1 has no own-words state: a lesson always declares its own vocabulary,
 * and inventing terms is the failure this whole layer exists to prevent.
 */
export function panelSource(box, panel) {
  if (box === 1) {
    return panel && Array.isArray(panel.items) && panel.items.length > 0 ? "lesson" : "own-words";
  }
  if (box === 2) {
    return panel && String(panel.rule || "").trim() ? "lesson" : "own-words";
  }
  return "lesson";
}

/** localStorage key for one lesson's captures. */
function storageKey(config) {
  return `nt-notebook:${(config && config.lessonId) || "lesson"}`;
}

/**
 * Read and normalize a lesson's checkpoints.
 *
 * A lesson with no `notebook` key returns [] and renders exactly as it does
 * today. Malformed entries are dropped rather than thrown: the build gate
 * (tools/validate-notebook-checkpoints.mjs) is where a bad declaration fails.
 *
 * @returns {Array<{box:number, phaseIndex:number, phase:string, heading:string,
 *                  prompt:string, promptSource:"authored"|"default",
 *                  label:string, maxLength:number}>}
 */
export function readCheckpoints(config) {
  const list = config && config.notebook && config.notebook.checkpoints;
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const cp of list) {
    if (!cp || typeof cp !== "object") continue;
    const box = Number(cp.box);
    if (!BOXES.includes(box) || seen.has(box)) continue;
    const phaseIndex = PHASE_IDS.indexOf(String(cp.phase || ""));
    if (phaseIndex < 0) continue;
    // `prompt` is OPTIONAL. Without one the box falls back to the default
    // classroom copy, so a lesson gets working checkpoints from `box` + `phase`
    // alone and authoring is an upgrade rather than a prerequisite.
    const authored = String(cp.prompt || "").trim();
    const capture = cp.capture || {};
    const panel = cp.copyPanel || null;
    // What the lesson actually supplies decides which copy this box speaks.
    const source = panelSource(box, panel);
    const defaults = (source === "own-words" && OWN_WORDS_PROMPTS[box]) || DEFAULT_PROMPTS[box];
    seen.add(box);
    out.push({
      box,
      phase: PHASE_IDS[phaseIndex],
      phaseIndex,
      heading: defaults.heading,
      prompt: authored || defaults.body,
      promptSource: /** @type {"authored"|"default"} */ (authored ? "authored" : "default"),
      contentSource: source,
      copyPanel: panel,
      label: String(capture.label || defaults.capture).trim(),
      maxLength: Math.min(Number(capture.maxLength) || MAX_LENGTH, MAX_LENGTH),
    });
  }
  return out.sort((a, b) => a.box - b.box);
}

/** The checkpoint attached to a phase index, or null. */
export function checkpointForPhase(config, phaseIndex) {
  return readCheckpoints(config).find((c) => c.phaseIndex === phaseIndex) || null;
}

/* ── capture store ───────────────────────────────────────────────────────── */

let store = { boxes: {} };
let activeConfig = null;
let persisted = false;

function loadStore(config) {
  try {
    const raw = localStorage.getItem(storageKey(config));
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.boxes && typeof parsed.boxes === "object") {
      store = { boxes: { ...parsed.boxes } };
      return;
    }
  } catch (_error) {
    /* private mode — captures live for this session only */
  }
  store = { boxes: {} };
}

function saveStore() {
  try {
    localStorage.setItem(storageKey(activeConfig), JSON.stringify(store));
  } catch (_error) {
    /* private mode — the in-memory store still gates this session */
  }
}

/** Whitespace-only never counts as written. */
function isWritten(value) {
  return String(value || "").trim().length >= MIN_LENGTH;
}

function getCapture(box) {
  const entry = store.boxes[box];
  return entry && typeof entry === "object" ? entry : { text: "", confirmed: false };
}

function _setCapture(box, patch) {
  store.boxes[box] = { ...getCapture(box), ...patch };
  saveStore();
}

/** A checkpoint is satisfied only when BOTH halves are done. */
export function isSatisfied(box) {
  const c = getCapture(box);
  return !!c.confirmed && isWritten(c.text);
}

/**
 * Wire the lesson's captures into save/resume, once.
 *
 * The payload is self-identifying (see NOTEBOOK_STATE_KEY) so the restorer can
 * find its own slice no matter which provider index it was given.
 */
export function initNotebook(config) {
  activeConfig = config;
  if (typeof window !== "undefined") {
    window.openMathNotesModel = (cfg) => openMathNotesModel(cfg || activeConfig);
  }
  loadStore(config);
  if (persisted) return;
  const sr = typeof window !== "undefined" && window.NeftSaveResume;
  if (!sr || typeof sr.registerStateProvider !== "function") return;
  persisted = true;
  sr.registerStateProvider(() => ({
    [NOTEBOOK_STATE_KEY]: 1,
    v: 1,
    lessonId: (activeConfig && activeConfig.lessonId) || "",
    boxes: store.boxes,
  }));
  sr.registerStateRestorer((mine, all) => {
    const slice =
      mine && mine[NOTEBOOK_STATE_KEY]
        ? mine
        : Object.values(all || {}).find((v) => v && v[NOTEBOOK_STATE_KEY]);
    if (!slice || !slice.boxes) return;
    store = { boxes: { ...slice.boxes, ...store.boxes } };
    saveStore();
  });
}

/* ── rendering ───────────────────────────────────────────────────────────── */

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/**
 * Open the canonical Math Notes model over the lesson, without navigating away.
 *
 * <dialog>.showModal() owns the focus trap, Escape, and the inert backdrop, so
 * the keyboard behaviour is the platform's rather than a reimplementation.
 */
export function closeMathNotesModel() {
  const existing = /** @type {HTMLDialogElement|null} */ (
    document.getElementById("nt-notebook-model")
  );
  if (existing && existing.open) {
    existing.close();
  }
}

/**
 * This lesson's own notes, rendered from the SAME verified panel data the
 * checkpoints render — never re-derived, never re-worded, never borrowed.
 *
 * Why it is here: the dialog used to show only the blank page-layout model, so
 * a student (or teacher) opening "Math Notes" saw a generic picture of a
 * notebook and none of today's words. The lesson's actual words lived only
 * inside the checkpoint blocks, which are two phases apart. Reported by Joel
 * 2026-08-18: "I'm not seeing the updated math notes."
 */
function renderLessonNotesHtml(config, lang = "en") {
  const isEs = lang === "es";
  const cps = readCheckpoints(config);
  if (cps.length === 0) {
    throw new Error(
      `Math Notes: lesson ${(config && config.lessonId) || "unknown"} declares no usable notebook data`,
    );
  }
  const sections = [];
  for (const cp of cps) {
    if (cp.box === 2 && (!cp.copyPanel || !String(cp.copyPanel.rule || "").trim())) {
      throw new Error(
        `Math Notes: lesson ${(config && config.lessonId) || "unknown"} is missing box 2 copyPanel rule`,
      );
    }
    const panel = renderCopyPanelHtml(cp, isEs, config);
    if (!panel) {
      if (cp.box === 2) {
        throw new Error(
          `Math Notes: lesson ${(config && config.lessonId) || "unknown"} is missing box 2 copyPanel rule`,
        );
      }
      continue;
    }
    const subhead = isEs
      ? cp.box === 1
        ? "Sección 1: Palabras de Matemáticas"
        : "Sección 2: Matemáticas de Hoy"
      : cp.heading.replace(/^Notebook time — /, "");
    sections.push(`
      <section class="nt-nb-model-section">
        <h3 class="nt-nb-model-subhead">${esc(subhead)}</h3>
        ${panel}
      </section>`);
  }
  if (sections.length === 0) {
    throw new Error(
      `Math Notes: lesson ${(config && config.lessonId) || "unknown"} produced 0 notes sections`,
    );
  }
  const title = String(
    isEs && config.titleEs ? config.titleEs : (config && config.title) || "",
  ).trim();
  const dateLabel = isEs ? "Fecha:" : "Date:";
  const datePrompt = isEs ? "escribe la fecha de hoy" : "write today's date";
  const defaultTitle = isEs ? "Notas de Matemáticas de Hoy" : "Today's Math Notes";

  return `
    <div class="nt-nb-model-lesson">
      <p class="nt-nb-model-date">${dateLabel} <span class="nt-nb-model-date-blank" aria-hidden="true"></span><span class="nt-nb-visually-hidden">${datePrompt}</span></p>
      <p class="nt-nb-model-lessonlead">${title ? esc(title) : defaultTitle}</p>
      ${sections.join("\n")}
    </div>`;
}

export function openMathNotesModel(config, defaultLang) {
  const lessonConfig = config || activeConfig;
  const existing = /** @type {HTMLDialogElement|null} */ (
    document.getElementById("nt-notebook-model")
  );
  if (existing) existing.remove();

  let currentLang = defaultLang || (document.documentElement.lang === "es" ? "es" : "en");

  const dlg = document.createElement("dialog");
  dlg.id = "nt-notebook-model";
  dlg.className = "nt-nb-model";
  dlg.setAttribute("aria-label", "Math Notes — what my notebook page looks like");

  function renderDialog() {
    const isEs = currentLang === "es";
    dlg.innerHTML = `
      <div class="nt-nb-model-head">
        <h2>${isEs ? "¿Cómo debe verse mi página?" : "What should my page look like?"}</h2>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="nt-nb-lang-toggle" role="group" aria-label="Math Notes Language">
            <button type="button" class="nt-nb-lang-btn ${!isEs ? "active" : ""}" data-lang="en">🇺🇸 EN</button>
            <button type="button" class="nt-nb-lang-btn ${isEs ? "active" : ""}" data-lang="es">🇲🇽 ES</button>
          </div>
          <button type="button" class="nt-nb-model-close" aria-label="Close">✕</button>
        </div>
      </div>
      ${renderLessonNotesHtml(lessonConfig, currentLang)}`;

    dlg.querySelector(".nt-nb-model-close")?.addEventListener("click", () => dlg.close());
    dlg.querySelectorAll(".nt-nb-lang-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const targetLang = /** @type {HTMLElement} */ (e.currentTarget).dataset.lang;
        if (targetLang && targetLang !== currentLang) {
          currentLang = targetLang;
          renderDialog();
        }
      });
    });
    attachImageZoomAll(dlg, "img.nt-nb-copy-art");
  }

  renderDialog();

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

/**
 * The student-generated state. Shown when the lesson states no rule this
 * engine can quote with provenance — a correct outcome for 74 of 84 lessons.
 *
 * It carries no mathematics, because inventing a rule to fill the space is the
 * exact failure the provenance layer exists to prevent. What it carries is the
 * one thing an empty space could not: an explanation of WHY nothing is printed,
 * so the state reads as deliberate rather than broken. The direction of what to
 * write lives in the prompt above it and is not repeated here.
 */
function renderOwnWordsHtml(cp) {
  if (cp.box !== 2) return "";
  // The hint explains an ABSENCE, so it may only be shown when something is
  // actually absent. Three lessons author a box-2 prompt that states the rule
  // themselves ("Write the volume formula: V = length × width × height…"); on
  // those, "there is nothing to copy" would be a lie the student can see, and
  // the prompt already gives all the direction needed. They get the label and
  // the writing space, and no second instruction.
  const authored = cp.promptSource === "authored";
  const banner = authored ? "Write this in your notebook" : "You write this one";
  const hint = authored
    ? ""
    : `<p class="nt-nb-own-hint">Today's rule is yours to put into words — there is nothing on the screen to copy.</p>`;
  return `
    <div class="nt-nb-own-panel" role="note" aria-label="You write this part yourself">
      <div class="nt-nb-own-banner">
        <span class="nt-nb-own-mark" aria-hidden="true">✎</span>
        <span>${esc(banner)}</span>
      </div>
      ${hint}
      <div class="nt-nb-own-lines" aria-hidden="true"></div>
    </div>`;
}

/**
 * Render the visually unmistakable copy panel containing exactly what the
 * student writes by hand in their notebook — nothing else.
 */
function renderCopyPanelHtml(cp, isEs = false, config = null) {
  if (!cp) return "";
  if (cp.contentSource === "own-words") return renderOwnWordsHtml(cp);
  if (!cp.copyPanel) return "";
  const bannerText = isEs ? "Copia en tu cuaderno:" : "Copy into your notebook:";

  if (cp.box === 1 && Array.isArray(cp.copyPanel.items) && cp.copyPanel.items.length > 0) {
    const vocabList = (config && config.vocabulary) || [];
    const listItems = cp.copyPanel.items
      .map((item) => {
        let displayTerm = item.term;
        let displayMeaning = item.meaning;
        if (isEs) {
          const match = vocabList.find(
            (v) => v && v.term && v.term.trim().toLowerCase() === item.term.trim().toLowerCase(),
          );
          if (match) {
            if (match.termEs) displayTerm = match.termEs;
            if (match.definitionEs) {
              const firstSentenceEs = String(match.definitionEs).split(/(?<=[.!?])\s+/)[0];
              displayMeaning = firstSentenceEs.replace(/[.;]+$/, "");
            }
          }
        }
        const art = item.art
          ? `<img class="nt-nb-copy-art" src="${esc(item.art)}" alt="${esc(vocabImageAlt(displayTerm, displayMeaning))}" loading="lazy" width="72" height="72" />`
          : `<span class="nt-nb-copy-art nt-nb-copy-art-empty" aria-hidden="true"></span>`;
        return `<li>
          <span class="nt-nb-copy-term">${esc(displayTerm)}</span>
          <span class="nt-nb-copy-meaning">${esc(displayMeaning)}</span>
          ${art}
        </li>`;
      })
      .join("\n");
    return `
    <div class="nt-nb-copy-panel nt-nb-copy-box1" data-no-vocab="true" aria-label="${bannerText}">
      <div class="nt-nb-copy-banner">${bannerText}</div>
      <ol class="nt-nb-copy-list nt-nb-copy-grid">
        ${listItems}
      </ol>
    </div>`;
  }
  if (cp.box === 2 && cp.copyPanel.rule) {
    let ruleText = cp.copyPanel.rule;
    if (
      isEs &&
      config &&
      config.launch &&
      config.launch.conceptIntro &&
      config.launch.conceptIntro.keyIdeaEs
    ) {
      const firstIdeaSentence = config.launch.conceptIntro.keyIdeaEs.split(/\.\s+/)[0];
      if (firstIdeaSentence) ruleText = firstIdeaSentence.trim();
    }
    const stepsHtml =
      Array.isArray(cp.copyPanel.steps) && cp.copyPanel.steps.length > 0
        ? `<ol class="nt-nb-copy-steps">${cp.copyPanel.steps.map(renderStepHtml).join("")}</ol>`
        : "";
    const formulaHtml = cp.copyPanel.formula
      ? `<div class="nt-nb-copy-formulas" role="group" aria-label="Formulas to copy">${cp.copyPanel.formula
          .split(/\s\|\s/)
          .map((f) => `<div class="nt-nb-copy-formula">${esc(f.trim())}</div>`)
          .join("")}</div>`
      : "";
    const exampleLabel = isEs ? "Ejemplo:" : "Example:";
    return `
    <div class="nt-nb-copy-panel nt-nb-copy-box2" data-no-vocab="true" aria-label="${bannerText}">
      <div class="nt-nb-copy-banner">${bannerText}</div>
      <div class="nt-nb-copy-rule">${esc(ruleText)}</div>
      ${formulaHtml}
      ${stepsHtml}
      ${cp.copyPanel.meaning ? `<div class="nt-nb-copy-meaning">${esc(cp.copyPanel.meaning)}</div>` : ""}
      ${cp.copyPanel.example ? `<div class="nt-nb-copy-example"><span class="nt-nb-copy-example-label">${exampleLabel}</span> <span class="nt-nb-eq">${esc(cp.copyPanel.example)}</span></div>` : ""}
    </div>`;
  }
  return "";
}

/**
 * One numbered step, rendered visually instead of as a line of prose.
 *
 * The step STRINGS are verbatim quotes of the lesson's own keyIdea and are
 * never altered here — everything below is presentation of the same words:
 * the "N." prefix becomes a number badge, a short "Action: detail" split
 * becomes a bold action over a lighter detail line, and any equation the step
 * states is set off in math styling so the symbols read at a glance.
 */
function renderStepHtml(step) {
  const m = String(step).match(/^(\d+)\.\s*(.*)$/s);
  const n = m ? m[1] : "";
  const body = m ? m[2] : String(step);
  let lead = "";
  let detail = body;
  const colon = body.indexOf(": ");
  // A lead only when it reads as a short label — a colon deep in a sentence,
  // or one inside mathematics ("Ratio = a:b"), is not a label.
  if (colon > 2 && colon <= 48 && !body.slice(0, colon).includes("=")) {
    lead = body.slice(0, colon);
    detail = body.slice(colon + 2);
  }
  return `<li class="nt-nb-step">
    <span class="nt-nb-step-num" aria-hidden="true">${esc(n)}</span>
    <span class="nt-nb-step-text">${lead ? `<strong class="nt-nb-step-lead">${esc(lead)}</strong>` : ""}<span class="nt-nb-step-detail">${highlightEquations(detail)}</span></span>
  </li>`;
}

/**
 * Wrap the equations a sentence states in math styling, leaving every word
 * exactly where it was. Escaped output; presentation only.
 *
 * A token belongs to an equation run when it carries mathematical characters
 * and no real word ("(%", "0.01", "1/100", "|-7|", "=", "×") — runs grow
 * outward from each "=" so "Distance is always positive or zero: |-7| = 7"
 * highlights "|-7| = 7" and nothing else.
 */
function highlightEquations(text) {
  const tokens = String(text).split(/\s+/).filter(Boolean);
  const mathy = (t) => /[0-9=+×÷−<>≤≥%|/]/.test(t) && !/[a-z]{3,}/i.test(t);
  const marked = new Array(tokens.length).fill(false);
  tokens.forEach((t, i) => {
    if (!t.includes("=")) return;
    let lo = i;
    let hi = i;
    while (lo - 1 >= 0 && mathy(tokens[lo - 1])) lo--;
    while (hi + 1 < tokens.length && mathy(tokens[hi + 1])) hi++;
    for (let k = lo; k <= hi; k++) marked[k] = true;
  });
  const out = [];
  let run = [];
  const flush = () => {
    if (run.length > 0) {
      out.push(`<span class="nt-nb-eq">${esc(run.join(" "))}</span>`);
      run = [];
    }
  };
  tokens.forEach((t, i) => {
    if (marked[i]) run.push(t);
    else {
      flush();
      out.push(esc(t));
    }
  });
  flush();
  return out.join(" ");
}

/**
 * Render the checkpoint for this phase in the phase body.
 *
 * NOTEBOOK TIME IN-PHASE CHECKPOINTS ARE ELIMINATED: Math notes are now accessed
 * cleanly via the Math Notes modal and Warmup entry card rather than gating
 * phase transitions with typing inputs.
 */
export function mountNotebookCheckpoint(_el, _config, _phaseIndex) {
  return null;
}

/**
 * Gate: may the student leave `fromPhase` for a LATER phase?
 *
 * Always returns true — inline phase gating has been eliminated.
 */
export function canLeavePhase(_config, _fromPhase, _toPhase) {
  return true;
}

/** Say what is still missing, in the block itself, and put the cursor there. */
export function announceBlocked(_config, _fromPhase) {
  // No-op: phase navigation is not gated.
}

/** Test seam: drop all in-memory capture state. */
export function __resetNotebookState() {
  store = { boxes: {} };
  activeConfig = null;
  persisted = false;
}
