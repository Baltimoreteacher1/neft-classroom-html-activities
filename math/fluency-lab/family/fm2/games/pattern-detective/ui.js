// Pattern Detective interaction. The learner probes the hidden rule (a limited number of times), the answers pile up in
// a clue table, then the learner states the rule and predicts a faraway answer. The shell judges the response.
// All work (probes, clue table, half-built rule, prediction) lives in `state`, so a language switch just repaints.
// @fm2 FM-013 FM-038 FM-039 FM-021 FM-037 FM-040
import { L, tx } from "../../lang.js";
import { UI } from "./copy.js";
import { evidenceRows, inDomain, probeValue, valueText } from "./logic.js";
import { initialFields, ruleOf } from "./ui-rule.js";
import { view } from "./ui-view.js";

const t = (key, lang, vars) => tx(UI[key], lang, vars);

export function mount(root, ctx) {
  const { round } = ctx;
  let lang = ctx.lang;
  let alive = true;
  const state = {
    rows: [],
    readout: null,
    note: null,
    checkNote: null,
    xText: "",
    farText: "",
    farSym: null,
    cls: null,
    fields: initialFields(round),
    typed: "",
    useTyped: false,
    probeMachine: 0,
    done: false,
  };
  const locked = () => state.done || ctx.locked();

  function render() {
    if (!alive) return;
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const key = active?.dataset?.key;
    const caret =
      active && "selectionStart" in active ? [active.selectionStart, active.selectionEnd] : null;
    root.innerHTML = view(round, state, lang, locked());
    if (!key) return;
    const next = root.querySelector(`[data-key="${key}"]`);
    if (next && !next.disabled) {
      next.focus({ preventScroll: true });
      if (caret && "setSelectionRange" in next) {
        try {
          next.setSelectionRange(...caret);
        } catch {
          /* number-like inputs have no caret */
        }
      }
    }
  }

  function focusNextCell(from) {
    const cells = [...root.querySelectorAll('[data-act="cell"]:not(:disabled)')];
    const next = cells.find((cell) => Number(cell.dataset.x) > from) || cells[0];
    (next || root.querySelector('[data-key="far-' + (round.alpha?.[0] ?? "") + '"]'))?.focus({ preventScroll: true });
  }

  function focusKey(key) {
    root.querySelector(`[data-key="${key}"]`)?.focus({ preventScroll: true });
  }

  const left = () => round.probes - state.rows.length;
  const known = (m, x) => evidenceRows(round, state.rows).find((row) => row.m === m && row.x === x);

  function probe(m, x) {
    if (locked()) return;
    state.note = null;
    state.checkNote = null;
    const have = known(m, x);
    if (have) {
      state.readout =
        round.form === "cycle"
          ? { kind: "cell", x, y: have.yText }
          : { kind: "already", x, y: have.yText };
      ctx.announce(
        round.form === "cycle"
          ? t("readoutCell", lang, { n: x, name: L(UI.symbols[have.yText], lang) })
          : t("already", lang, { x, y: have.yText }),
      );
      return;
    }
    if (left() <= 0) {
      state.note = { key: "noProbes", vars: {} };
      return;
    }
    state.rows.push({ m, x });
    const y = valueText(probeValue(round, m, x));
    state.readout = round.form === "cycle" ? { kind: "cell", x, y } : { kind: "gave", x, y };
    ctx.announce(
      round.form === "cycle"
        ? t("readoutCell", lang, { n: x, name: L(UI.symbols[y], lang) })
        : t("gotBack", lang, { name: L(round.names.in, lang).toLowerCase(), x, y }),
    );
  }

  function probeTyped() {
    const text = state.xText.trim().replace("−", "-");
    const { lo, hi, mult } = round.dom;
    state.note = null;
    if (!/^-?\d+$/.test(text)) {
      state.note = { key: "needWhole", vars: {} };
      return;
    }
    const x = Number(text);
    if (!inDomain(round, x)) {
      state.note =
        mult > 1 && x >= lo && x <= hi
          ? { key: "onlyMultiples", vars: { m: mult, lo, hi } }
          : { key: "outOfRange", vars: { lo, hi } };
      return;
    }
    probe(state.probeMachine, x);
    state.xText = "";
  }

  function check() {
    if (locked()) return;
    const { complete, rule } = ruleOf(round, state);
    const far = round.form === "cycle" ? state.farSym : state.farText.trim();
    if (!complete || !far) {
      state.checkNote = "incomplete";
      return;
    }
    if (round.cls && !state.cls) {
      state.checkNote = "incompleteClass";
      return;
    }
    state.checkNote = null;
    const result = ctx.submit({
      rule,
      far,
      cls: state.cls || undefined,
      evidence: state.rows.map(({ m, x }) => ({ m, x })),
    });
    if (result?.correct) state.done = true;
  }

  function setPath(path, value) {
    const parts = path === "typed" ? null : path.split(".");
    if (!parts) {
      state.typed = value;
      return;
    }
    let target = state.fields;
    while (parts.length > 1) target = target[parts.shift()];
    target[parts[0]] = value;
  }

  const actions = {
    probe: () => probeTyped(),
    cell: (el) => probe(0, Number(el.dataset.x)),
    machine: (el) => {
      state.probeMachine = Number(el.dataset.m);
    },
    "core-add": (el) => {
      if (state.fields.core.length < 4) state.fields.core.push(el.dataset.id);
      ctx.announce(
        t("coreSlot", lang, {
          n: state.fields.core.length,
          name: L(UI.symbols[el.dataset.id], lang),
        }),
      );
    },
    "core-undo": () => state.fields.core.pop(),
    "core-clear": () => {
      state.fields.core = [];
    },
    "far-sym": (el) => {
      state.farSym = el.dataset.id;
    },
    cls: (el) => {
      state.cls = el.dataset.id;
    },
    set: (el) => setPath(el.dataset.path, el.dataset.value),
    "toggle-typed": () => {
      state.useTyped = !state.useTyped;
    },
    insert: (el) => {
      const input = root.querySelector("#pd-typed");
      if (!input) return;
      const at = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? at;
      input.setRangeText(el.dataset.text, at, end, "end");
      setPath(input.dataset.path, input.value);
    },
    check,
  };

  const onClick = (event) => {
    const el = event.target.closest("[data-act]");
    if (!el || !root.contains(el) || el.disabled) return;
    const act = el.dataset.act;
    if (locked() && act !== "check") return;
    actions[act]?.(el);
    render();
    if (act === "probe") focusKey("x");
    if (act === "cell") focusNextCell(Number(el.dataset.x));
    if (act === "insert") root.querySelector("#pd-typed")?.focus();
  };
  const onInput = (event) => {
    const el = event.target;
    if (!el.dataset?.key) return;
    if (el.dataset.key === "x") state.xText = el.value;
    else if (el.dataset.key === "far") state.farText = el.value;
    else if (el.dataset.path) setPath(el.dataset.path, el.value);
  };
  const onChange = (event) => {
    const el = event.target;
    if (el.tagName === "SELECT" && el.dataset.path) {
      setPath(el.dataset.path, el.value);
      render();
    }
  };
  const onKey = (event) => {
    if (event.key !== "Enter" || event.target.tagName !== "INPUT") return;
    event.preventDefault();
    if (event.target.dataset.key === "x") {
      probeTyped();
      render();
      focusKey("x");
    } else if (event.target.dataset.key === "far") {
      check();
      render();
    }
  };
  // The shell tells the game when the round ends (solved or Show me), so the controls can show they are finished.
  ctx.onLock?.(() => alive && render());

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);
  root.addEventListener("keydown", onKey);
  render();

  return {
    destroy() {
      alive = false;
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      root.removeEventListener("change", onChange);
      root.removeEventListener("keydown", onKey);
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
