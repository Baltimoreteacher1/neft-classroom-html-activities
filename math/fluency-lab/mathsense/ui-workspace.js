// The linked workspace: four pictures, the typed boxes and the statement panel. Every editor ends in one call to
// `app.change`, which stores the new state and redraws everything, so no picture can disagree with another.
import { t } from "../i18n.js";
import {
  VB_W,
  barValueAt,
  decimalGrid,
  fractionBar,
  gridCountAt,
  gridRowOf,
  lineValueAt,
  numberLine,
  percentBar,
  rowAt,
} from "./draw.js";
import { MAX_VALUE, ONE, ZERO, eq, make, mixedText, parse, toNumber } from "./exact.js";
import { PARSE_MESSAGES } from "./missions-check.js";
import { SCENARIOS } from "./missions.js";
import {
  MAX_PARTS,
  PART_CHOICES,
  amountAtPosition,
  extent,
  setActive,
  setAmount,
  setCompare,
  setParts,
  setPieces,
  stateFrom,
  stepAmount,
} from "./model.js";
import { compareLine, forms, liveMessage, name, pictureText, pieceLabel, statements } from "./readouts.js";

const $ = (id) => document.getElementById(id);
const TENTH = make(1n, 10n);
const HUNDREDTH = make(1n, 100n);
const MAX = make(MAX_VALUE);
const LABELS = {
  bar: "Fraction bar",
  line: "Number line",
  grid: "Decimal grid",
  percent: "Percent bar",
};
const DRAW = { bar: fractionBar, line: numberLine, grid: decimalGrid, percent: percentBar };

// How each picture steps. Bar and line step by one piece of the current cut and never recut; grid and percent step by
// hundredths (a tenth with Shift).
const unitFor = (kind, state, big) => {
  if (kind === "bar" || kind === "line")
    return big ? ONE : make(1n, BigInt(state.parts[state.active]));
  return big ? TENTH : HUNDREDTH;
};

const typedParts = (raw) => {
  const match = /\/\s*(\d+)\s*$/.exec(String(raw));
  const parts = match ? Number(match[1]) : 0;
  return parts >= 1 && parts <= MAX_PARTS ? parts : undefined;
};

export function mountWorkspace(app) {
  const pictures = {};
  for (const kind of Object.keys(DRAW))
    pictures[kind] = { slider: $(`ms-${kind}`), pic: $(`ms-${kind}`).querySelector(".ms-pic") };
  const fields = {
    fraction: $("ms-in-fraction"),
    mixed: $("ms-in-mixed"),
    decimal: $("ms-in-decimal"),
    percent: $("ms-in-percent"),
  };
  let dragging = null;

  const change = (result, label, announceNow = true) => {
    if (!result.ok) return false;
    app.change(result.state, label, { announce: announceNow });
    return true;
  };

  // ---- Pointer and keyboard on the pictures ---------------------------------------------------------------------------
  function pointerAmount(kind, event, toggle) {
    const svg = pictures[kind].pic.querySelector("svg");
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    const scale = box.width / VB_W;
    const x = (event.clientX - box.left) / scale;
    const y = (event.clientY - box.top) / scale;
    let state = app.state;
    const wholes = extent(state);
    if (state.compare) {
      const which = rowAt(kind, y, state);
      if (which !== state.active && dragging === null) state = setActive(state, which);
    }
    const parts = state.parts[state.active];
    if (kind === "bar")
      return { state, q: amountAtPosition(barValueAt(x, wholes), wholes, parts), parts };
    if (kind === "line")
      return { state, q: amountAtPosition(lineValueAt(x), wholes, parts), parts };
    if (kind === "percent") return { state, q: amountAtPosition(lineValueAt(x), wholes, 100) };
    const row = state.compare ? gridRowOf(y, wholes) : 0;
    const count = gridCountAt(x, y, Math.min(row, 1), wholes);
    if (count === null) return null;
    // pressing the last shaded square again takes it away; dragging never toggles
    const same = toggle && eq(state[state.active], make(BigInt(count), 100n));
    return { state, q: make(BigInt(same ? count - 1 : count), 100n) };
  }

  function onPointer(kind, event, toggle = false) {
    const hit = pointerAmount(kind, event, toggle);
    if (!hit) return;
    const result = setAmount(hit.state, hit.q, { parts: hit.parts });
    if (result.ok) change(result, t(LABELS[kind]), false);
  }

  for (const kind of Object.keys(DRAW)) {
    const { slider } = pictures[kind];
    slider.addEventListener("pointerdown", (event) => {
      if (event.button > 0) return;
      slider.focus({ preventScroll: true });
      dragging = null;
      onPointer(kind, event, true);
      dragging = kind;
      try {
        slider.setPointerCapture(event.pointerId);
      } catch {
        /* capture is a nicety */
      }
    });
    slider.addEventListener("pointermove", (event) => {
      if (dragging === kind) onPointer(kind, event, false);
    });
    const end = (event) => {
      if (dragging !== kind) return;
      dragging = null;
      app.announce(liveMessage(app.state, t(LABELS[kind])));
    };
    slider.addEventListener("pointerup", end);
    slider.addEventListener("pointercancel", () => {
      dragging = null;
    });
    slider.addEventListener("keydown", (event) => {
      const keys = {
        ArrowRight: 1,
        ArrowUp: 1,
        ArrowLeft: -1,
        ArrowDown: -1,
        PageUp: 1,
        PageDown: -1,
      };
      if (event.key in keys) {
        event.preventDefault();
        nudge(kind, keys[event.key], event.shiftKey || event.key.startsWith("Page"));
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        change(setAmount(app.state, event.key === "Home" ? ZERO : MAX), t(LABELS[kind]));
      }
    });
  }

  function nudge(kind, direction, big) {
    const state = app.state;
    const keep = kind === "bar" || kind === "line" ? { parts: state.parts[state.active] } : {};
    change(stepAmount(state, direction, unitFor(kind, state, big), keep), t(LABELS[kind]));
  }
  for (const button of document.querySelectorAll("[data-nudge]")) {
    button.addEventListener("click", () => {
      const [kind, direction] = button.dataset.nudge.split(":");
      nudge(kind, Number(direction), false);
    });
  }

  // ---- Cut and pieces ---------------------------------------------------------------------------------------------------
  $("ms-k").addEventListener("change", (event) => {
    const k = Number.parseInt(event.target.value, 10);
    const result = setPieces(app.state, k, app.state.parts[app.state.active]);
    if (!result.ok) {
      showError("fraction", t(PARSE_MESSAGES[Number.isInteger(k) && k >= 0 ? "range" : "format"]));
      return;
    }
    clearErrors();
    change(result, t("Pieces shaded changed."));
  });
  $("ms-parts").addEventListener("change", (event) => {
    app.change(
      setParts(app.state, Number(event.target.value)),
      t("The bar was cut into {cut}.", { cut: pieceLabel(Number(event.target.value)) }),
    );
  });

  // ---- Typed boxes ------------------------------------------------------------------------------------------------------
  const errorEls = {
    fraction: $("ms-err-fraction"),
    mixed: $("ms-err-mixed"),
    decimal: $("ms-err-decimal"),
    percent: $("ms-err-percent"),
  };
  function clearErrors() {
    for (const [kind, el] of Object.entries(errorEls)) {
      el.hidden = true;
      el.textContent = "";
      fields[kind].removeAttribute("aria-invalid");
    }
  }
  function showError(kind, message) {
    const el = errorEls[kind] ?? errorEls.fraction;
    el.hidden = false;
    el.textContent = message;
    (fields[kind] ?? fields.fraction).setAttribute("aria-invalid", "true");
    app.announce(message);
  }
  for (const [kind, input] of Object.entries(fields)) {
    const commit = () => {
      if (input.dataset.shown === input.value) return;
      const parsed = parse(input.value);
      if (!parsed.ok) {
        showError(kind, t(PARSE_MESSAGES[parsed.code] ?? PARSE_MESSAGES.format));
        return;
      }
      clearErrors();
      const parts =
        parsed.form === "fraction" || parsed.form === "mixed" ? typedParts(input.value) : undefined;
      const result = setAmount(app.state, parsed.value, { parts });
      if (result.ok) {
        app.change(result.state, t("{field} box changed.", { field: t(FIELD_NAMES[kind]) }), {
          announce: true,
        });
        // the box the learner typed in shows the amount's canonical spelling, like every other box
        input.value = shownValues()[kind];
        input.dataset.shown = input.value;
      }
    };
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.dataset.shown = "";
        commit();
      }
    });
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid")) {
        errorEls[kind].hidden = true;
        input.removeAttribute("aria-invalid");
      }
    });
  }

  // ---- Toolbar ------------------------------------------------------------------------------------------------------------
  $("ms-compare").addEventListener("change", (event) => {
    app.change(
      setCompare(app.state, event.target.checked),
      event.target.checked
        ? t("Compare mode is on. Both quantities are on every picture.")
        : t("Compare mode is off."),
    );
  });
  for (const radio of document.querySelectorAll('input[name="ms-active"]')) {
    radio.addEventListener("change", () => {
      if (radio.checked)
        app.change(
          setActive(app.state, radio.value),
          t("Now changing quantity {name}.", { name: name(radio.value) }),
        );
    });
  }
  $("ms-reset").addEventListener("click", () => app.reset());
  $("ms-scenario").addEventListener("change", (event) => {
    const scenario = SCENARIOS.find((item) => item.id === event.target.value);
    event.target.value = "";
    if (scenario)
      app.change(stateFrom(scenario), t("Starting point: {label}.", { label: t(scenario.label) }));
  });

  // ---- Drawing ------------------------------------------------------------------------------------------------------------
  function shownValues() {
    const state = app.state;
    const q = state[state.active];
    const f = forms(q, state.parts[state.active]);
    return {
      fraction: f.pieces === null ? f.fraction : `${f.pieces}/${f.parts}`,
      mixed: mixedText(q),
      decimal: f.decimal.text,
      percent: f.percent.text,
    };
  }

  function renderFields() {
    const state = app.state;
    const f = forms(state[state.active], state.parts[state.active]);
    const shown = shownValues();
    for (const [kind, input] of Object.entries(fields)) {
      if (document.activeElement !== input) {
        input.value = shown[kind];
        input.dataset.shown = shown[kind];
      }
    }
    const k = $("ms-k");
    if (document.activeElement !== k) k.value = f.pieces === null ? "" : String(f.pieces);
    const select = $("ms-parts");
    const options = PART_CHOICES.includes(state.parts[state.active])
      ? PART_CHOICES
      : [...PART_CHOICES, state.parts[state.active]].sort((x, y) => x - y);
    select.innerHTML = options
      .map((n) => `<option value="${n}">${pieceLabel(n)}</option>`)
      .join("");
    select.value = String(state.parts[state.active]);
  }

  function render() {
    const state = app.state;
    for (const [kind, { slider, pic }] of Object.entries(pictures)) {
      pic.innerHTML = DRAW[kind](state);
      slider.setAttribute("aria-label", t(LABELS[kind]));
      slider.setAttribute("aria-valuemin", "0");
      slider.setAttribute("aria-valuemax", String(Number(MAX_VALUE)));
      slider.setAttribute(
        "aria-valuenow",
        String(Math.round(toNumber(state[state.active]) * 1000) / 1000),
      );
      slider.setAttribute("aria-valuetext", pictureText(state));
    }
    renderFields();
    const select = $("ms-scenario");
    select.innerHTML = `<option value="">${t("Choose a starting point")}</option>${SCENARIOS.map((s) => `<option value="${s.id}">${t(s.label)}</option>`).join("")}`;
    $("ms-compare").checked = state.compare;
    $("ms-editing").hidden = !state.compare;
    for (const radio of document.querySelectorAll('input[name="ms-active"]'))
      radio.checked = radio.value === state.active;
    $("ms-editing-label").textContent = state.compare
      ? t("The boxes and buttons change quantity {name}.", { name: name(state.active) })
      : "";
    $("ms-statements").innerHTML = statements(state)
      .map(
        ({ label, list }) =>
          `<section class="ms-q"><h4>${label}</h4><ul>${list.map((line) => `<li class="ms-line ms-line-${line.id}">${line.text}</li>`).join("")}</ul></section>`,
      )
      .join("");
    $("ms-compare-line").textContent = compareLine(state) ?? "";
  }

  return { render, clearErrors };
}

export const FIELD_NAMES = {
  fraction: "Fraction",
  mixed: "Mixed number",
  decimal: "Decimal",
  percent: "Percent",
};
