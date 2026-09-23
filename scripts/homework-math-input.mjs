/**
 * Math keypad for family homework answer fields.
 *
 * Families answer these pages on a phone, and a phone keyboard has no ×, ÷, ≤,
 * √ or fraction bar — a sixth grader asked to write "3 ÷ 4" or "x ≥ 6" either
 * hunts three keyboard layers deep for the glyph or gives up and writes prose.
 * This adds one shared keypad, docked at the bottom of the viewport, that opens
 * when an answer field takes focus and inserts symbols at that field's caret.
 *
 * Two constraints shape what is on it:
 *
 *  1. The page is a standalone HTML file with no external scripts (see
 *     tools/validate-external-scripts.mjs, pinned at zero), so this is a
 *     self-contained keypad rather than a hosted equation editor.
 *  2. Every symbol offered has to survive `engine/core/answer-match.js`, which
 *     is what actually grades the field. × · ÷ − all normalise there, and
 *     = : / ( ) , . < > ≤ ≥ are punctuation and relations it already handles;
 *     a glyph the matcher does not know would turn a correct answer red. That
 *     is why the graded groups below hold what they hold.
 */

/** Fields the keypad attaches to. */
const GRADED_SELECTOR =
  'input.custom-input:not([type="hidden"]), input.table-input, input.ladder-input';
const PROSE_SELECTOR = "textarea.custom-textarea";

/**
 * `caret` is how far back from the end of the inserted text the caret lands, so
 * a template drops the student inside it rather than after it.
 */
const KEY_GROUPS = [
  {
    id: "basic",
    labelEn: "Basic",
    labelEs: "Básico",
    keys: [
      { ins: "+", aria: "plus" },
      { ins: "−", aria: "minus" },
      { ins: "×", aria: "times" },
      { ins: "÷", aria: "divided by" },
      { ins: "=", aria: "equals" },
      { ins: ".", aria: "decimal point" },
      { ins: ",", aria: "comma" },
      { ins: "$", aria: "dollar sign" },
      { ins: "%", aria: "percent" },
      { ins: ":", aria: "ratio colon" },
      { ins: "(", aria: "open parenthesis" },
      { ins: ")", aria: "close parenthesis" },
    ],
  },
  {
    id: "fractions",
    labelEn: "Fractions & Powers",
    labelEs: "Fracciones y potencias",
    keys: [
      {
        ins: "/",
        label: "a/b",
        aria: "fraction bar",
        hintEn: "Fraction",
        hintEs: "Fracción",
      },
      {
        ins: " /",
        caret: 1,
        label: "a b/c",
        aria: "mixed number",
        hintEn: "Mixed number",
        hintEs: "Número mixto",
      },
      { ins: "^", label: "x^n", aria: "exponent", hintEn: "Power", hintEs: "Potencia" },
      { ins: "²", aria: "squared" },
      { ins: "³", aria: "cubed" },
      { ins: "√", aria: "square root" },
      { ins: "π", aria: "pi" },
      { ins: "≈", aria: "approximately equal to" },
      { ins: "°", aria: "degrees" },
      { ins: "·", aria: "multiplication dot" },
    ],
  },
  {
    id: "compare",
    labelEn: "Compare",
    labelEs: "Comparar",
    keys: [
      { ins: "<", aria: "less than" },
      { ins: ">", aria: "greater than" },
      { ins: "≤", aria: "less than or equal to" },
      { ins: "≥", aria: "greater than or equal to" },
      { ins: "≠", aria: "not equal to" },
      { ins: "±", aria: "plus or minus" },
      { ins: "|", aria: "absolute value bar" },
      { ins: "→", aria: "arrow" },
    ],
  },
];

/** Escape for an HTML attribute value or text node. */
function attr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderKey(key) {
  const label = key.label || key.ins;
  const hint = key.hintEn
    ? `<span class="mathpad-key-hint"><span class="lang-en">${attr(key.hintEn)}</span><span class="lang-es" lang="es">${attr(key.hintEs)}</span></span>`
    : "";
  const wide = key.hintEn ? " mathpad-key-wide" : "";
  return `<button type="button" class="mathpad-key${wide}" data-ins="${attr(key.ins)}" data-caret="${key.caret || 0}" aria-label="${attr(key.aria || label)}"><span class="mathpad-key-glyph">${attr(label)}</span>${hint}</button>`;
}

/** The keypad markup. Rendered once per page, just before the closing body. */
export function renderMathKeypad() {
  const tabs = KEY_GROUPS.map(
    (group, i) =>
      `<button type="button" class="mathpad-tab${i === 0 ? " is-active" : ""}" role="tab" id="mathpad_tab_${group.id}" aria-controls="mathpad_panel_${group.id}" aria-selected="${i === 0 ? "true" : "false"}" data-mathpad-group="${group.id}"><span class="lang-en">${attr(group.labelEn)}</span><span class="lang-es" lang="es">${attr(group.labelEs)}</span></button>`,
  ).join("");

  const panels = KEY_GROUPS.map(
    (group, i) =>
      `<div class="mathpad-keys" role="tabpanel" id="mathpad_panel_${group.id}" aria-labelledby="mathpad_tab_${group.id}" data-mathpad-panel="${group.id}"${i === 0 ? "" : " hidden"}>${group.keys.map(renderKey).join("")}</div>`,
  ).join("");

  return `
<button type="button" class="mathpad-fab" id="mathpad_fab" hidden onclick="reopenMathKeypad()" aria-label="Show the math symbols keypad">
  <span class="mathpad-fab-glyph" aria-hidden="true">√x</span>
  <span class="mathpad-fab-text"><span class="lang-en">Math symbols</span><span class="lang-es" lang="es">Símbolos</span></span>
</button>

<div class="mathpad" id="math_keypad" role="group" aria-label="Math symbols keypad" hidden>
  <div class="mathpad-top">
    <div class="mathpad-preview-wrap">
      <span class="mathpad-preview-tag"><span class="lang-en">Your answer</span><span class="lang-es" lang="es">Tu respuesta</span></span>
      <span class="mathpad-preview" id="mathpad_preview" aria-live="polite"></span>
    </div>
    <div class="mathpad-top-actions">
      <button type="button" class="mathpad-util" data-mathpad-action="backspace" aria-label="Delete the character before the cursor">⌫</button>
      <button type="button" class="mathpad-util mathpad-hide" data-mathpad-action="hide" aria-label="Hide the math symbols keypad">✕</button>
    </div>
  </div>
  <div class="mathpad-tabs" role="tablist" aria-label="Symbol groups">${tabs}</div>
  ${panels}
</div>`;
}

export const MATH_INPUT_CSS = `
/* ============================================================
   MATH KEYPAD — symbol entry for answer fields
   ============================================================ */
.mathpad {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1200;
  background: var(--white, #fff);
  border-top: 2px solid var(--teal, #1fa6a2);
  box-shadow: 0 -12px 34px rgba(18, 53, 91, 0.16);
  padding: 8px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  font-family: var(--font-body, system-ui, sans-serif);
}
.mathpad[hidden] { display: none; }

.mathpad-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.mathpad-preview-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  background: var(--teal-light, #dff2ee);
  border-radius: var(--radius-sm, 8px);
  overflow: hidden;
}
.mathpad-preview-tag {
  flex: none;
  font-family: var(--font-display, system-ui, sans-serif);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--teal-ink, #0c6f6b);
}
.mathpad-preview {
  flex: 1;
  min-width: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--navy, #12355b);
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.mathpad-preview::-webkit-scrollbar { display: none; }
.mathpad-preview:empty::before {
  content: "…";
  color: var(--muted, #5f6f80);
  font-weight: 600;
}
.mathpad-frac {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
  line-height: 1.05;
  font-size: .78em;
  margin: 0 2px;
}
.mathpad-frac-den { border-top: 1.5px solid currentColor; padding-top: 1px; }

.mathpad-top-actions { display: flex; gap: 6px; flex: none; }
.mathpad-util {
  min-width: 46px;
  min-height: 42px;
  border: 1.5px solid var(--line, #d7e2ed);
  border-radius: var(--radius-sm, 8px);
  background: var(--white, #fff);
  color: var(--navy, #12355b);
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}
.mathpad-util:hover { background: var(--cream, #f7f4ec); }
.mathpad-hide { border-color: var(--coral, #d9795d); color: var(--coral-ink, #9c4326); }

.mathpad-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.mathpad-tab {
  flex: none;
  padding: 7px 12px;
  min-height: 38px;
  border: 1.5px solid var(--line, #d7e2ed);
  border-radius: 999px;
  background: var(--white, #fff);
  color: var(--muted, #5f6f80);
  font-family: var(--font-display, system-ui, sans-serif);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}
.mathpad-tab.is-active {
  background: var(--navy, #12355b);
  border-color: var(--navy, #12355b);
  color: var(--white, #fff);
}

.mathpad-keys {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
  gap: 6px;
}
.mathpad-keys[hidden] { display: none; }
.mathpad-key {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-height: 46px;
  padding: 4px 6px;
  border: 1.5px solid var(--line, #d7e2ed);
  border-radius: var(--radius-sm, 8px);
  background: var(--white, #fff);
  color: var(--navy, #12355b);
  cursor: pointer;
  transition: transform .08s ease, background .12s ease;
}
.mathpad-key:hover { background: var(--teal-light, #dff2ee); border-color: var(--teal, #1fa6a2); }
.mathpad-key:active { transform: scale(.94); background: var(--teal, #1fa6a2); color: var(--white, #fff); }
.mathpad-key-glyph { font-size: 19px; font-weight: 700; line-height: 1.1; }
.mathpad-key-wide { grid-column: span 2; }
.mathpad-key-hint {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted, #5f6f80);
  line-height: 1.15;
  text-align: center;
}
.mathpad-key-hint .lang-en + .lang-es::before { content: none; }

/* Left edge, not right: the right edge already stacks the Save/Resume launcher
   and the "Stuck?" button, and a third pill there covers one of them. */
.mathpad-fab {
  position: fixed;
  left: 14px;
  bottom: calc(min(var(--hw-status-height, 104px), 150px) + 14px + env(safe-area-inset-bottom, 0px));
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  min-height: 46px;
  border: none;
  border-radius: 999px;
  background: var(--teal, #1fa6a2);
  color: var(--white, #fff);
  font-family: var(--font-display, system-ui, sans-serif);
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 22px rgba(18, 53, 91, 0.22);
  cursor: pointer;
}
.mathpad-fab[hidden] { display: none; }
.mathpad-fab-glyph { font-size: 17px; }

/* The Check stop's sticky bar, the "Stuck?" button and the Save/Resume launcher
   all own the bottom edge; the keypad is the one the caret is in, so they step
   up over it rather than sitting on its preview strip and its ⌫ / ✕ keys.
   The Save/Resume launcher styles itself from a stylesheet linked after this
   one, so the lift is stated at higher specificity rather than later. */
body.mathpad-open .bottom-status-bar { bottom: var(--mathpad-h, 0px); }
body.mathpad-open .hw-stuck-fab {
  bottom: calc(min(var(--hw-status-height, 104px), 150px) + 70px + var(--mathpad-h, 0px));
}
body.mathpad-open #nsr-root {
  bottom: calc(min(var(--hw-status-height, 104px), 150px) + 14px + var(--mathpad-h, 0px)) !important;
}
/* The end of the page is NOT reserved here: syncHomeworkChromeHeights() writes
   body.style.paddingBottom inline, which no stylesheet can outrank. The keypad
   is declared to that function instead, as one more bottom-fixed control. */

/* Which field a tapped symbol lands in, stated on the field itself — the page
   is long enough that the keypad and the answer box are rarely both in view. */
.mathpad-active-field {
  outline: 3px solid var(--teal, #1fa6a2);
  outline-offset: 1px;
}

@media (max-width: 480px) {
  .mathpad-keys { grid-template-columns: repeat(auto-fit, minmax(48px, 1fr)); }
  .mathpad-preview-tag { display: none; }
}
@media print {
  .mathpad, .mathpad-fab { display: none !important; }
}
`;

export const MATH_INPUT_JS = `
/* ── Math keypad ─────────────────────────────────────────────────────────────
   Inserts math symbols at the caret of whichever answer field has focus. Only
   symbols the shared answer matcher understands are offered, so nothing a
   family can tap here can turn a correct answer red. */
var MATHPAD_SELECTOR =
  ${JSON.stringify(GRADED_SELECTOR)} + ", " + ${JSON.stringify(PROSE_SELECTOR)};
var MATHPAD_OFF_KEY = "hw_mathpad_off";
var mathpadTarget = null;
var mathpadDismissed = false;

try {
  mathpadDismissed = localStorage.getItem(MATHPAD_OFF_KEY) === "1";
} catch (e) {}

function mathpadEl() {
  return document.getElementById("math_keypad");
}

function mathpadEsc(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Render the typed answer the way it is meant to read: 3/4 stacked, 2^3 as a
   power. Display only — the field still holds the plain text that gets graded. */
function mathpadPretty(raw) {
  var text = String(raw == null ? "" : raw);
  if (!text.trim()) return "";
  var html = mathpadEsc(text);
  html = html.replace(/(\\d+(?:\\.\\d+)?)\\s*\\^\\s*(-?\\d+)/g, function (whole, base, power) {
    return base + "<sup>" + power + "</sup>";
  });
  html = html.replace(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/g, function (whole, num, den) {
    return (
      '<span class="mathpad-frac"><span class="mathpad-frac-num">' +
      num +
      '</span><span class="mathpad-frac-den">' +
      den +
      "</span></span>"
    );
  });
  return html;
}

function mathpadUpdatePreview() {
  var preview = document.getElementById("mathpad_preview");
  if (!preview) return;
  preview.innerHTML = mathpadTarget ? mathpadPretty(mathpadTarget.value) : "";
  preview.scrollLeft = preview.scrollWidth;
}

/* Keep the sticky Check bar and the end of the page clear of the open keypad. */
function mathpadSyncHeight() {
  var pad = mathpadEl();
  if (!pad || pad.hidden) {
    document.body.classList.remove("mathpad-open");
    document.body.style.removeProperty("--mathpad-h");
    if (typeof syncHomeworkChromeHeights === "function") syncHomeworkChromeHeights();
    return;
  }
  document.body.classList.add("mathpad-open");
  document.body.style.setProperty("--mathpad-h", pad.offsetHeight + "px");
  if (typeof syncHomeworkChromeHeights === "function") syncHomeworkChromeHeights();
}

/* A phone's on-screen keyboard shrinks the VISUAL viewport but not the layout
   viewport, so a bottom-fixed panel sits behind it. Lift the keypad by the
   difference so it rides on top of the keyboard where it can be reached. */
function mathpadSyncViewport() {
  var pad = mathpadEl();
  if (!pad) return;
  var vv = window.visualViewport;
  if (!vv) return;
  var lift = window.innerHeight - vv.height - vv.offsetTop;
  pad.style.transform = lift > 1 ? "translateY(" + -lift + "px)" : "";
}

function mathpadSetTarget(field) {
  if (mathpadTarget && mathpadTarget !== field) {
    mathpadTarget.classList.remove("mathpad-active-field");
  }
  mathpadTarget = field || null;
  if (mathpadTarget) mathpadTarget.classList.add("mathpad-active-field");
}

function showMathKeypad(field) {
  var pad = mathpadEl();
  if (!pad) return;
  mathpadSetTarget(field);
  var fab = document.getElementById("mathpad_fab");
  if (mathpadDismissed) {
    if (fab) fab.hidden = false;
    return;
  }
  if (fab) fab.hidden = true;
  pad.hidden = false;
  mathpadSyncHeight();
  mathpadSyncViewport();
  mathpadUpdatePreview();
}

function hideMathKeypad() {
  var pad = mathpadEl();
  if (!pad) return;
  mathpadDismissed = true;
  try {
    localStorage.setItem(MATHPAD_OFF_KEY, "1");
  } catch (e) {}
  pad.hidden = true;
  mathpadSyncHeight();
  var fab = document.getElementById("mathpad_fab");
  if (fab) fab.hidden = !mathpadTarget;
}

function reopenMathKeypad() {
  mathpadDismissed = false;
  try {
    localStorage.removeItem(MATHPAD_OFF_KEY);
  } catch (e) {}
  var fab = document.getElementById("mathpad_fab");
  if (fab) fab.hidden = true;
  var pad = mathpadEl();
  if (pad) {
    pad.hidden = false;
    mathpadSyncHeight();
    mathpadSyncViewport();
    mathpadUpdatePreview();
  }
  if (mathpadTarget) mathpadTarget.focus();
}

function mathpadCloseAll() {
  var pad = mathpadEl();
  if (pad) pad.hidden = true;
  var fab = document.getElementById("mathpad_fab");
  if (fab) fab.hidden = true;
  mathpadSetTarget(null);
  mathpadSyncHeight();
}

/* Splice text in at the caret and let the field's own oninput handlers
   (saveState, updateProgress) run exactly as if it had been typed. */
function mathpadInsert(text, caretBack) {
  var field = mathpadTarget;
  if (!field) return;
  var start = field.selectionStart;
  var end = field.selectionEnd;
  if (start == null || end == null) {
    start = field.value.length;
    end = start;
  }
  field.value = field.value.slice(0, start) + text + field.value.slice(end);
  var caret = start + text.length - (caretBack || 0);
  field.focus();
  try {
    field.setSelectionRange(caret, caret);
  } catch (e) {}
  field.dispatchEvent(new Event("input", { bubbles: true }));
  mathpadUpdatePreview();
}

function mathpadBackspace() {
  var field = mathpadTarget;
  if (!field) return;
  var start = field.selectionStart;
  var end = field.selectionEnd;
  if (start == null || end == null) {
    start = field.value.length;
    end = start;
  }
  if (start === end) {
    if (start === 0) return;
    start -= 1;
  }
  field.value = field.value.slice(0, start) + field.value.slice(end);
  field.focus();
  try {
    field.setSelectionRange(start, start);
  } catch (e) {}
  field.dispatchEvent(new Event("input", { bubbles: true }));
  mathpadUpdatePreview();
}

function mathpadSelectGroup(id) {
  var pad = mathpadEl();
  if (!pad) return;
  var tabs = pad.querySelectorAll(".mathpad-tab");
  for (var i = 0; i < tabs.length; i++) {
    var on = tabs[i].getAttribute("data-mathpad-group") === id;
    tabs[i].classList.toggle("is-active", on);
    tabs[i].setAttribute("aria-selected", on ? "true" : "false");
  }
  var panels = pad.querySelectorAll("[data-mathpad-panel]");
  for (var j = 0; j < panels.length; j++) {
    panels[j].hidden = panels[j].getAttribute("data-mathpad-panel") !== id;
  }
  mathpadSyncHeight();
}

(function initMathKeypad() {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
  ready(function () {
    var pad = mathpadEl();
    if (!pad) return;

    /* Tapping a key must not move focus off the field being written into.
       preventDefault on mousedown is enough for that on both pointer and
       touch; cancelling touchstart would also cancel the click that follows
       it on iOS, which would leave the keypad inert on the phones most of
       these families use. */
    pad.addEventListener("mousedown", function (event) {
      if (event.target.closest(".mathpad-key, .mathpad-util, .mathpad-tab")) {
        event.preventDefault();
      }
    });

    pad.addEventListener("click", function (event) {
      var tab = event.target.closest(".mathpad-tab");
      if (tab) {
        mathpadSelectGroup(tab.getAttribute("data-mathpad-group"));
        return;
      }
      var action = event.target.closest("[data-mathpad-action]");
      if (action) {
        if (action.getAttribute("data-mathpad-action") === "backspace") mathpadBackspace();
        else hideMathKeypad();
        return;
      }
      var key = event.target.closest(".mathpad-key");
      if (!key) return;
      mathpadInsert(key.getAttribute("data-ins"), Number(key.getAttribute("data-caret")) || 0);
    });

    document.addEventListener("focusin", function (event) {
      var node = event.target;
      if (!node || !node.closest) return;
      var field = node.closest(MATHPAD_SELECTOR);
      if (field) {
        showMathKeypad(field);
      } else if (!node.closest(".mathpad, .mathpad-fab")) {
        mathpadCloseAll();
      }
    });

    document.addEventListener("input", function (event) {
      if (mathpadTarget && event.target === mathpadTarget) mathpadUpdatePreview();
    });

    window.addEventListener("resize", mathpadSyncHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", mathpadSyncViewport);
      window.visualViewport.addEventListener("scroll", mathpadSyncViewport);
    }
  });
})();
`;
