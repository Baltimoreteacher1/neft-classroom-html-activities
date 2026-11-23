// blank, number, short and fillTable: type into the page. Enter submits; every field has a real label.

import { marksOf, parseMarked, tableBlanks } from "../core/check.js";
import { clearMarks, mark } from "./marks.js";
import { h, nid, plainText, rich, seeded, shuffled } from "./util.js";

const submitOnEnter = (input, api) =>
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      api.onSubmit?.();
    }
  });

const invalid = (input, on) => {
  if (on) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
};

export function buildBlank(q, ctx) {
  const api = {};
  const inputs = [];
  let last = null;
  const line = h("p", { class: "sp-cloze" });
  let n = 0;
  const total = marksOf(q.text).length;
  for (const seg of parseMarked(q.text)) {
    if (seg.t === "text") {
      rich(line, seg.v);
      continue;
    }
    n += 1;
    const input = h("input", {
      type: "text",
      class: "sp-blank",
      autocomplete: "off",
      autocapitalize: "none",
      spellcheck: "false",
      "aria-label": ctx.t("blankN", { n, total }),
    });
    input.addEventListener("focus", () => {
      last = input;
    });
    input.addEventListener("input", () => {
      clearMarks(line);
    });
    submitOnEnter(input, api);
    inputs.push(input);
    line.append(h("span", { class: "sp-blank-wrap" }, input));
  }
  const el = h("div", { class: "sp-blankwrap" }, line);
  if (q.bank) {
    const words = [...new Set(marksOf(q.text).map((m) => m.answers[0]))];
    const bank = h("div", { class: "sp-bank", role: "group", "aria-label": ctx.t("wordBank") });
    for (const w of shuffled(words, seeded(q.id))) {
      const b = h("button", { type: "button", class: "sp-card sp-tile" }, w);
      b.addEventListener("click", () => {
        const target = last && !last.value ? last : inputs.find((i) => !i.value) || last || inputs[0];
        if (!target) return;
        target.value = w;
        clearMarks(line);
        (inputs.find((i) => !i.value) || target).focus();
      });
      bank.append(b);
    }
    el.append(h("p", { class: "sp-note-small" }, ctx.t("bankHelp")), bank);
  }
  return Object.assign(api, {
    el,
    get: () => inputs.map((i) => i.value),
    lock(on) {
      for (const b of el.querySelectorAll("input,button")) b.disabled = on;
    },
    focus: () => inputs[0]?.focus(),
    mark(result) {
      clearMarks(line);
      const wrong = new Set(result.wrong || []);
      inputs.forEach((input, i) => {
        if (!input.value.trim()) return;
        const bad = wrong.has(i);
        mark(input.parentElement, bad ? "look" : "right", ctx);
        invalid(input, bad);
      });
    },
  });
}

export function buildNumber(q, ctx) {
  const api = {};
  const id = nid("num");
  const input = h("input", { id, type: "text", class: "sp-input sp-number", inputmode: "decimal", autocomplete: "off", spellcheck: "false" });
  submitOnEnter(input, api);
  input.addEventListener("input", () => clearMarks(el));
  const el = h(
    "div",
    { class: "sp-numberwrap" },
    h("label", { class: "sp-sublabel", for: id }, ctx.t("yourAnswer")),
    h("span", { class: "sp-number-row" }, input, q.unit ? h("span", { class: "sp-unit" }, q.unit) : null),
    h("p", { class: "sp-note-small" }, ctx.t("numberHelp")),
  );
  return Object.assign(api, {
    el,
    get: () => input.value,
    lock: (on) => {
      input.disabled = on;
    },
    focus: () => input.focus(),
    mark(result) {
      clearMarks(el);
      if (result.status === "correct") mark(input.parentElement, "right", ctx);
      else if (input.value.trim()) {
        mark(input.parentElement, "look", ctx);
        invalid(input, true);
      }
    },
  });
}

export function buildShort(q, ctx) {
  const api = {};
  const id = nid("txt");
  const area = h("textarea", { id, class: "sp-input sp-area", rows: q.kind === "explain" ? "6" : "4", spellcheck: "true" });
  const count = h("span", { class: "sp-count" });
  const update = () => {
    const words = area.value.trim().split(/\s+/).filter(Boolean).length;
    count.textContent = q.minWords ? ctx.t("wordsOf", { n: words, min: q.minWords }) : ctx.t("wordsN", { n: words });
  };
  area.addEventListener("input", () => {
    update();
    clearMarks(el);
  });
  update();
  const el = h("div", { class: "sp-shortwrap" }, h("label", { class: "sp-sublabel", for: id }, ctx.t("yourWriting")), area, count);
  return Object.assign(api, {
    el,
    get: () => area.value,
    lock: (on) => {
      area.disabled = on;
    },
    focus: () => area.focus(),
    insert(text) {
      if (!area.value.trim()) area.value = text;
      else area.value += `\n${text}`;
      update();
      area.focus();
    },
    mark(result) {
      clearMarks(el);
      if (result.status === "incorrect") {
        mark(area.parentElement, "look", ctx);
        invalid(area, true);
      }
    },
  });
}

export function buildFillTable(q, ctx) {
  const api = {};
  const blanks = new Map(tableBlanks(q).map((c) => [c.key, c]));
  const inputs = new Map();
  const table = h("table", { class: "sp-table sp-filltable" });
  table.append(h("thead", null, h("tr", null, ...q.headers.map((x) => rich(h("th", { scope: "col" }), x)))));
  const body = h("tbody");
  q.rows.forEach((row, r) => {
    const tr = h("tr");
    row.forEach((cell, c) => {
      const key = `${r}:${c}`;
      if (!blanks.has(key)) {
        tr.append(rich(h("td"), String(cell)));
        return;
      }
      const input = h("input", {
        type: "text",
        class: "sp-input sp-cell",
        autocomplete: "off",
        spellcheck: "false",
        "aria-label": ctx.t("cellLabel", { row: r + 1, col: plainText(q.headers[c] || String(c + 1)) }),
      });
      input.addEventListener("input", () => clearMarks(table));
      submitOnEnter(input, api);
      inputs.set(key, input);
      tr.append(h("td", null, input));
    });
    body.append(tr);
  });
  table.append(body);
  const el = h("div", { class: "sp-table-wrap" }, table);
  return Object.assign(api, {
    el,
    get: () => Object.fromEntries([...inputs].map(([k, i]) => [k, i.value])),
    lock(on) {
      for (const i of inputs.values()) i.disabled = on;
    },
    focus: () => inputs.values().next().value?.focus(),
    mark(result) {
      clearMarks(table);
      const wrong = new Set(result.wrong || []);
      for (const [key, input] of inputs) {
        if (!input.value.trim()) continue;
        const bad = wrong.has(key);
        mark(input.parentElement, bad ? "look" : "right", ctx);
        invalid(input, bad);
      }
    },
  });
}
