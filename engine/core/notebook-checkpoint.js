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
function renderLessonNotesHtml(config) {
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
    const panel = renderCopyPanelHtml(cp);
    if (!panel) {
      if (cp.box === 2) {
        throw new Error(
          `Math Notes: lesson ${(config && config.lessonId) || "unknown"} is missing box 2 copyPanel rule`,
        );
      }
      continue;
    }
    sections.push(`
      <section class="nt-nb-model-section">
        <h3 class="nt-nb-model-subhead">${esc(cp.heading.replace(/^Notebook time — /, ""))}</h3>
        ${panel}
      </section>`);
  }
  if (sections.length === 0) {
    throw new Error(
      `Math Notes: lesson ${(config && config.lessonId) || "unknown"} produced 0 notes sections`,
    );
  }
  const title = String((config && config.title) || "").trim();
  // The page header a student recreates by hand: "Date" with a blank to fill
  // in (never a printed date — a fabricated "Sept. 3" is the exact defect the
  // provenance layer removed), then a title naming what these notes are about.
  // The title is the lesson's own declared title, so it always describes the
  // notes below it and never borrows another lesson's words.
  return `
    <div class="nt-nb-model-lesson">
      <p class="nt-nb-model-date">Date: <span class="nt-nb-model-date-blank" aria-hidden="true"></span><span class="nt-nb-visually-hidden">write today's date</span></p>
      <p class="nt-nb-model-lessonlead">${title ? esc(title) : "Today's Math Notes"}</p>
      ${sections.join("\n")}
    </div>`;
}

export function openMathNotesModel(config) {
  const lessonConfig = config || activeConfig;
  const existing = /** @type {HTMLDialogElement|null} */ (
    document.getElementById("nt-notebook-model")
  );
  // Rebuilt on every open: a student who opens this from Warmup and again from
  // Explore must see the same lesson's notes, not a dialog cached before the
  // checkpoints were read.
  if (existing) existing.remove();
  const dlg = document.createElement("dialog");
  dlg.id = "nt-notebook-model";
  dlg.className = "nt-nb-model";
  dlg.setAttribute("aria-label", "Math Notes — what my notebook page looks like");
  dlg.innerHTML = `
    <div class="nt-nb-model-head">
      <h2>What should my page look like?</h2>
      <button type="button" class="nt-nb-model-close" aria-label="Close">✕</button>
    </div>
    ${renderLessonNotesHtml(lessonConfig)}`;
  dlg.querySelector(".nt-nb-model-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
  document.body.append(dlg);
  attachImageZoomAll(dlg, "img.nt-nb-copy-art");
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
function renderCopyPanelHtml(cp) {
  if (!cp) return "";
  if (cp.contentSource === "own-words") return renderOwnWordsHtml(cp);
  if (!cp.copyPanel) return "";
  if (cp.box === 1 && Array.isArray(cp.copyPanel.items) && cp.copyPanel.items.length > 0) {
    // Three columns — word, what it means, and the picture the lesson already
    // uses for that word. The image is decorative here (the definition beside
    // it carries the meaning), so it is aria-hidden and the row stays readable
    // with images off. A term whose only match would be a generic category tile
    // gets no picture at all rather than one that does not depict it.
    const listItems = cp.copyPanel.items
      .map((item) => {
        // `art` is written by scripts/generate-notebook-copy-panels.mjs only
        // when the artwork's own <title> names this word and no earlier row in
        // this panel already used it. The renderer has no filesystem, so it
        // trusts that decision and never guesses a picture.
        const art = item.art
          ? `<img class="nt-nb-copy-art" src="${esc(item.art)}" alt="${esc(vocabImageAlt(item.term, item.meaning))}" loading="lazy" width="72" height="72" />`
          : `<span class="nt-nb-copy-art nt-nb-copy-art-empty" aria-hidden="true"></span>`;
        return `<li>
          <span class="nt-nb-copy-term">${esc(item.term)}</span>
          <span class="nt-nb-copy-meaning">${esc(item.meaning)}</span>
          ${art}
        </li>`;
      })
      .join("\n");
    return `
    <div class="nt-nb-copy-panel nt-nb-copy-box1" data-no-vocab="true" aria-label="Copy into your notebook">
      <div class="nt-nb-copy-banner">Copy into your notebook:</div>
      <ol class="nt-nb-copy-list nt-nb-copy-grid">
        ${listItems}
      </ol>
    </div>`;
  }
  if (cp.box === 2 && cp.copyPanel.rule) {
    const stepsHtml =
      Array.isArray(cp.copyPanel.steps) && cp.copyPanel.steps.length > 0
        ? `<ol class="nt-nb-copy-steps">${cp.copyPanel.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`
        : "";
    const formulaHtml = cp.copyPanel.formula
      ? `<div class="nt-nb-copy-formula"><span class="nt-nb-copy-formula-label">Formula:</span> ${esc(cp.copyPanel.formula)}</div>`
      : "";
    return `
    <div class="nt-nb-copy-panel nt-nb-copy-box2" data-no-vocab="true" aria-label="Copy into your notebook">
      <div class="nt-nb-copy-banner">Copy into your notebook:</div>
      <div class="nt-nb-copy-rule">${esc(cp.copyPanel.rule)}</div>
      ${formulaHtml}
      ${stepsHtml}
      ${cp.copyPanel.meaning ? `<div class="nt-nb-copy-meaning">${esc(cp.copyPanel.meaning)}</div>` : ""}
      ${cp.copyPanel.example ? `<div class="nt-nb-copy-example"><span class="nt-nb-copy-example-label">Example:</span> ${esc(cp.copyPanel.example)}</div>` : ""}
    </div>`;
  }
  return "";
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
