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

export const CHECKBOX_LABEL = "I wrote this in my notebook.";
export const BLOCKED_MESSAGE = "Write it in your notebook first, then check the box to keep going.";

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
    const defaults = DEFAULT_PROMPTS[box];
    const capture = cp.capture || {};
    seen.add(box);
    out.push({
      box,
      phase: PHASE_IDS[phaseIndex],
      phaseIndex,
      heading: defaults.heading,
      prompt: authored || defaults.body,
      promptSource: /** @type {"authored"|"default"} */ (authored ? "authored" : "default"),
      copyPanel: cp.copyPanel || null,
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

function setCapture(box, patch) {
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

export function openMathNotesModel() {
  const existing = /** @type {HTMLDialogElement|null} */ (
    document.getElementById("nt-notebook-model")
  );
  if (existing) {
    existing.showModal();
    return existing;
  }
  const dlg = document.createElement("dialog");
  dlg.id = "nt-notebook-model";
  dlg.className = "nt-nb-model";
  dlg.setAttribute("aria-label", "Math Notes — what my notebook page looks like");
  dlg.innerHTML = `
    <div class="nt-nb-model-head">
      <h2>What should my page look like?</h2>
      <button type="button" class="nt-nb-model-close" aria-label="Close">✕</button>
    </div>
    <img class="nt-nb-model-img" src="${MATH_NOTES_MODEL_IMAGE}"
         alt="A notebook page with a heading line, then three numbered sections: 1 Math Words, with a word on the left and what it means on the right; 2 Today's Math, with the rule or formula; 3 My Work, with numbered problems and every step shown." />
    <div class="nt-nb-model-foot">
      <a class="nt-nb-model-link" href="${MATH_NOTES_MODEL_PAGE}" target="_blank" rel="noopener">Open the full page ↗</a>
    </div>`;
  dlg.querySelector(".nt-nb-model-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

const COPY_PANELS_ENABLED = false;

/**
 * Render the visually unmistakable copy panel containing exactly what the
 * student writes by hand in their notebook — nothing else.
 */
function renderCopyPanelHtml(cp) {
  // KILL SWITCH (2026-08-18). The panels shipped in 82951ef0b carried content
  // that does not trace to the lesson they appear on. Rendering is suppressed
  // until every panel is rebuilt from its own lesson's data and the provenance
  // gate passes. The checkpoints and their prompts are untouched — only the
  // pre-written copy block is withheld.
  if (!COPY_PANELS_ENABLED) return "";
  if (!cp || !cp.copyPanel) return "";
  if (cp.box === 1 && Array.isArray(cp.copyPanel.items) && cp.copyPanel.items.length > 0) {
    const listItems = cp.copyPanel.items
      .map(
        (item) =>
          `<li><strong class="nt-nb-copy-term">${esc(item.term)}</strong> — <span class="nt-nb-copy-meaning">${esc(item.meaning)}</span></li>`,
      )
      .join("\n");
    return `
    <div class="nt-nb-copy-panel nt-nb-copy-box1" data-no-vocab="true" aria-label="Copy into your notebook">
      <div class="nt-nb-copy-banner">Copy into your notebook:</div>
      <ol class="nt-nb-copy-list">
        ${listItems}
      </ol>
    </div>`;
  }
  if (cp.box === 2 && cp.copyPanel.rule) {
    return `
    <div class="nt-nb-copy-panel nt-nb-copy-box2" data-no-vocab="true" aria-label="Copy into your notebook">
      <div class="nt-nb-copy-banner">Copy into your notebook:</div>
      <div class="nt-nb-copy-rule">${esc(cp.copyPanel.rule)}</div>
      ${cp.copyPanel.meaning ? `<div class="nt-nb-copy-meaning">${esc(cp.copyPanel.meaning)}</div>` : ""}
      ${cp.copyPanel.example ? `<div class="nt-nb-copy-example"><span class="nt-nb-copy-example-label">Example:</span> ${esc(cp.copyPanel.example)}</div>` : ""}
    </div>`;
  }
  return "";
}

/**
 * Render the checkpoint for this phase in the phase body.
 *
 * No-op when the lesson declares no checkpoint here.
 */
export function mountNotebookCheckpoint(el, config, phaseIndex) {
  const cp = checkpointForPhase(config, phaseIndex);
  if (!cp || !el) return null;
  const existing = el.querySelector(`.nt-nb[data-notebook-box="${cp.box}"]`);
  if (existing) return existing;
  initNotebook(config);

  const saved = getCapture(cp.box);
  const idBase = `${NOTEBOOK_FIELD_PREFIX}${cp.box}`;
  const wrap = document.createElement("section");
  wrap.className = "nt-nb";
  wrap.dataset.notebookBox = String(cp.box);
  // Machine-readable coverage signal for the build gate and reporting. Never
  // shown to a student.
  wrap.dataset.promptSource = cp.promptSource;
  wrap.setAttribute("aria-labelledby", `${idBase}-title`);
  wrap.innerHTML = `
    <div class="nt-nb-head">
      <span class="nt-nb-badge" aria-hidden="true">${cp.box}</span>
      <h3 class="nt-nb-title" id="${idBase}-title">${esc(cp.heading)}</h3>
    </div>
    <p class="nt-nb-prompt">${esc(cp.prompt)}</p>
    ${renderCopyPanelHtml(cp)}
    ${
      cp.box === 1
        ? `<button type="button" class="nt-nb-modellink">📓 What should my page look like?</button>`
        : ""
    }
    <div class="nt-nb-row">
      <input type="checkbox" id="${idBase}-done" class="nt-nb-check" ${saved.confirmed ? "checked" : ""} />
      <label for="${idBase}-done" class="nt-nb-checklabel">${esc(CHECKBOX_LABEL)}</label>
    </div>
    <div class="nt-nb-row nt-nb-row-input">
      <label for="${idBase}-text" class="nt-nb-inputlabel">${esc(cp.label)}</label>
      <input type="text" id="${idBase}-text" class="nt-nb-input" maxlength="${cp.maxLength}"
             autocomplete="off" spellcheck="false" value="${esc(saved.text || "")}" />
    </div>
    <p class="nt-nb-status" id="${idBase}-status" role="status" aria-live="polite"></p>`;

  const check = /** @type {HTMLInputElement} */ (wrap.querySelector(".nt-nb-check"));
  const input = /** @type {HTMLInputElement} */ (wrap.querySelector(".nt-nb-input"));
  const status = wrap.querySelector(".nt-nb-status");
  const modelBtn = wrap.querySelector(".nt-nb-modellink");
  if (modelBtn) modelBtn.addEventListener("click", () => openMathNotesModel());

  const sync = () => {
    wrap.classList.toggle("is-done", isSatisfied(cp.box));
    // Never a correctness message. This says only whether the lesson can move
    // on — there is no right or wrong capture.
    if (isSatisfied(cp.box)) status.textContent = "Saved. You can keep going.";
  };
  check.addEventListener("change", () => {
    setCapture(cp.box, { confirmed: check.checked });
    sync();
  });
  input.addEventListener("input", () => {
    setCapture(cp.box, { text: input.value });
    sync();
  });
  sync();
  el.append(wrap);
  return wrap;
}

/**
 * Gate: may the student leave `fromPhase` for a LATER phase?
 *
 * Backward moves are always allowed — a student re-reading Explore is not
 * skipping anything.
 */
export function canLeavePhase(config, fromPhase, toPhase) {
  if (!(toPhase > fromPhase)) return true;
  const cp = checkpointForPhase(config, fromPhase);
  if (!cp) return true;
  return isSatisfied(cp.box);
}

/** Say what is still missing, in the block itself, and put the cursor there. */
export function announceBlocked(config, fromPhase) {
  const cp = checkpointForPhase(config, fromPhase);
  if (!cp) return;
  const wrap = document.querySelector(`.nt-nb[data-notebook-box="${cp.box}"]`);
  if (!wrap) return;
  const c = getCapture(cp.box);
  const status = wrap.querySelector(".nt-nb-status");
  // One constant sentence, identical in every lesson — not a composed list of
  // what is missing. This is classroom copy, not a form validator.
  if (status) status.textContent = BLOCKED_MESSAGE;
  wrap.classList.add("is-blocked");
  wrap.scrollIntoView({ block: "center", behavior: "smooth" });
  const target = /** @type {HTMLElement|null} */ (
    wrap.querySelector(c.confirmed ? ".nt-nb-input" : ".nt-nb-check")
  );
  target?.focus();
  window.setTimeout(() => wrap.classList.remove("is-blocked"), 1200);
}

/** Test seam: drop all in-memory capture state. */
export function __resetNotebookState() {
  store = { boxes: {} };
  activeConfig = null;
  persisted = false;
}
