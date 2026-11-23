// Puzzle widgets for the escape challenge. Every widget is native-control based (radio, checkbox, select, button) so
// keyboard and touch work without drag. renderPuzzle(p, opts) -> { el, getResponse(), lock(bool), focus() }
import { announce, h, shuffle } from "../../core/dom.js";
import { startOrder } from "./escape-logic.js";
import { visualEl } from "./visual-el.js";

const uid = (() => {
  let n = 0;
  return (p) => `${p}-${++n}`;
})();

function shell(p, body, extra = []) {
  const id = uid("st-esc-q");
  const legend = h("p", { class: "st-esc-prompt", id }, p.prompt);
  const kids = [
    p.stem ? h("p", { class: "st-esc-stem" }, p.stem) : null,
    p.visual ? visualEl(p.visual) : null,
    ...extra,
    body,
  ];
  return {
    id,
    legend,
    el: h("div", { class: "st-esc-puzzle", "data-type": p.type }, legend, kids),
  };
}

function numeric(p, { onChange, onEnter }) {
  const input = h("input", {
    class: "st-esc-input",
    type: "text",
    inputmode: "text",
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: "false",
    "aria-label": "Your answer",
  });
  input.addEventListener("input", () => onChange());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  });
  const body = h(
    "div",
    { class: "st-esc-numeric" },
    input,
    p.unit ? h("span", { class: "st-esc-unit" }, p.unit) : null,
    h(
      "p",
      { class: "st-esc-note" },
      "Fractions like 3/4, decimals and mixed numbers like 7 1/2 are all fine.",
    ),
  );
  const { id, legend, el } = shell(p, body);
  input.setAttribute("aria-describedby", id);
  return {
    el,
    getResponse: () => input.value,
    lock: (v) => (input.disabled = v),
    focus: () => input.focus(),
    legend,
  };
}

function choice(p, { onChange }) {
  const isMulti = Array.isArray(p.answer);
  const name = uid("st-esc-c");
  const inputs = p.choices.map((text, i) => {
    const input = h("input", {
      type: isMulti ? "checkbox" : "radio",
      name,
      value: String(i),
      id: `${name}-${i}`,
    });
    input.addEventListener("change", () => onChange());
    return {
      input,
      label: h(
        "label",
        { class: "st-esc-choice", for: `${name}-${i}` },
        input,
        h("span", {}, text),
      ),
    };
  });
  const body = h(
    "div",
    { class: "st-esc-choices", role: isMulti ? "group" : "radiogroup" },
    isMulti ? h("p", { class: "st-esc-note" }, "Choose all that apply.") : null,
    inputs.map((x) => x.label),
  );
  const { id, el } = shell(p, body);
  body.setAttribute("aria-labelledby", id);
  const get = () => {
    const sel = inputs.map((x, i) => (x.input.checked ? i : -1)).filter((i) => i >= 0);
    return isMulti ? sel : sel.length ? sel[0] : null;
  };
  return {
    el,
    getResponse: get,
    lock: (v) => inputs.forEach((x) => (x.input.disabled = v)),
    focus: () => inputs[0].input.focus(),
  };
}

function order(p, { onChange, seed }) {
  let ids = startOrder(p, shuffle, seed);
  let locked = false;
  const list = h("ol", { class: "st-esc-order", "aria-label": "Your order" });
  const labels = p.endLabels || { start: "first", end: "last" };
  const text = (id) => p.items.find((x) => x.id === id).text;
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    draw(`${d < 0 ? "up" : "down"}-${ids[j]}`);
    announce(`${text(ids[j])} is now number ${j + 1} of ${ids.length}.`);
    onChange();
  };
  function draw(focusKey) {
    list.textContent = "";
    ids.forEach((id, i) => {
      const mk = (dir, label) =>
        h(
          "button",
          {
            type: "button",
            class: "st-esc-move",
            "data-key": `${dir < 0 ? "up" : "down"}-${id}`,
            "aria-label": `Move ${text(id)} ${label}`,
            disabled: locked || (dir < 0 ? i === 0 : i === ids.length - 1),
            onclick: () => move(i, dir),
          },
          label === "up" ? "Up" : "Down",
        );
      list.append(
        h(
          "li",
          { class: "st-esc-order-item" },
          h("span", { class: "st-esc-pos", "aria-hidden": "true" }, String(i + 1)),
          h("span", { class: "st-esc-item-text" }, text(id)),
          mk(-1, "up"),
          mk(1, "down"),
        ),
      );
    });
    if (focusKey) {
      const key = focusKey;
      const target =
        list.querySelector(`[data-key="${key}"]:not([disabled])`) ||
        list.querySelector(
          `[data-key="${key.replace(/^(up|down)/, (m) => (m === "up" ? "down" : "up"))}"]:not([disabled])`,
        );
      target?.focus();
    }
  }
  draw();
  const body = h(
    "div",
    { class: "st-esc-orderwrap" },
    h("p", { class: "st-esc-end" }, `Top: ${labels.start}`),
    list,
    h("p", { class: "st-esc-end" }, `Bottom: ${labels.end}`),
  );
  const { el } = shell(p, body);
  return {
    el,
    getResponse: () => [...ids],
    lock: (v) => {
      locked = v;
      draw();
    },
    focus: () => list.querySelector("button:not([disabled])")?.focus(),
  };
}

function match(p, { onChange, seed }) {
  const rights = shuffle(p.rights, `${seed}:rights`);
  const rows = p.lefts.map((l) => {
    const id = uid("st-esc-m");
    const sel = h(
      "select",
      { class: "st-esc-select", id },
      h("option", { value: "" }, "Choose a match"),
      rights.map((r) => h("option", { value: r.id }, r.text)),
    );
    sel.addEventListener("change", () => onChange());
    return {
      l,
      sel,
      row: h(
        "div",
        { class: "st-esc-matchrow" },
        h("label", { for: id, class: "st-esc-matchlabel" }, l.text),
        sel,
      ),
    };
  });
  const { el } = shell(
    p,
    h(
      "div",
      { class: "st-esc-match" },
      rows.map((r) => r.row),
    ),
  );
  return {
    el,
    getResponse: () => Object.fromEntries(rows.map((r) => [r.l.id, r.sel.value])),
    lock: (v) => rows.forEach((r) => (r.sel.disabled = v)),
    focus: () => rows[0].sel.focus(),
  };
}

function sort(p, { onChange }) {
  const placed = {};
  const counts = h("p", { class: "st-esc-note", "aria-live": "polite" });
  const btns = [];
  const refresh = () => {
    counts.textContent = p.bins
      .map((b) => `${b.label}: ${p.cards.filter((c) => placed[c.id] === b.id).length}`)
      .join("  |  ");
    for (const { card, bin, btn } of btns)
      btn.setAttribute("aria-pressed", String(placed[card.id] === bin.id));
  };
  const cards = p.cards.map((card) => {
    const group = h("div", {
      class: "st-esc-cardbtns",
      role: "group",
      "aria-label": `Where does "${card.text}" go?`,
    });
    for (const bin of p.bins) {
      const btn = h(
        "button",
        {
          type: "button",
          class: "st-esc-bin",
          "aria-pressed": "false",
          onclick: () => ((placed[card.id] = bin.id), refresh(), onChange()),
        },
        bin.label,
      );
      btns.push({ card, bin, btn });
      group.append(btn);
    }
    return h(
      "div",
      { class: "st-esc-card" },
      h("p", { class: "st-esc-cardtext" }, card.text),
      group,
    );
  });
  refresh();
  const { el } = shell(p, h("div", { class: "st-esc-sort" }, cards, counts));
  return {
    el,
    getResponse: () => ({ ...placed }),
    lock: (v) => btns.forEach((b) => (b.btn.disabled = v)),
    focus: () => btns[0]?.btn.focus(),
  };
}

const BUILD = { numeric, choice, explain: choice, order, match, sort };

/** opts: { onChange(), onEnter(), seed } */
export function renderPuzzle(p, opts = {}) {
  const build = BUILD[p.type];
  if (!build) throw new Error(`Unknown puzzle type "${p.type}"`);
  return build(p, { onChange: () => {}, onEnter: () => {}, seed: "x", ...opts });
}
