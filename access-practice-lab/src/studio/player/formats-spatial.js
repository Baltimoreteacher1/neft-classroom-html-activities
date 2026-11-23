// identify, hotspot, numberline and plot: point at things. Each has a keyboard path and a typed or listed
// alternative, so nothing depends on aiming a pointer.

import { parseMarked } from "../core/check.js";
import { parseNumber, ratIsInt, ratToNumber, ratToString } from "../core/math.js";
import { safeImageSrc } from "../core/schema.js";
import { clearMarks, mark } from "./marks.js";
import { icon } from "./icons.js";
import { clamp, h, nid, plainText, rich, roving, sv } from "./util.js";

const WORD = /([^\s.,;:!?()"“”]+)/;

export function buildIdentify(q, ctx) {
  const picked = new Map(); // response entry -> button
  const line = h("p", { class: "sp-identify" });
  let markIdx = 0;
  let tokenIdx = 0;
  const addToken = (text, target) => {
    const at = tokenIdx++;
    const entry = target === null ? -1 - at : target;
    const b = h("button", { type: "button", class: "sp-word", "aria-pressed": "false", "data-target": target === null ? "no" : "yes" }, text);
    b.addEventListener("click", () => {
      clearMarks(line);
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      if (on) picked.set(entry, b);
      else picked.delete(entry);
    });
    line.append(b);
  };
  for (const seg of parseMarked(q.text)) {
    if (seg.t === "mark") addToken(seg.answers[0], markIdx++);
    else
      for (const part of seg.v.split(WORD)) {
        if (!part) continue;
        if (WORD.test(part)) addToken(part, null);
        else line.append(part);
      }
  }
  return {
    el: h("div", { class: "sp-identifywrap" }, h("p", { class: "sp-note-small" }, ctx.t("identifyHelp")), line),
    get: () => [...picked.keys()],
    lock(on) {
      for (const b of line.querySelectorAll("button")) b.disabled = on;
    },
    focus: () => line.querySelector("button")?.focus(),
    mark() {
      clearMarks(line);
      for (const [entry, b] of picked) mark(b, entry >= 0 ? "right" : "look", ctx, b);
    },
  };
}

export function buildHotspot(q, ctx) {
  const src = q.image ? safeImageSrc(q.image.src) : "";
  let chosen = "";
  const name = nid("hot");
  const radios = new Map();
  const list = h("fieldset", { class: "sp-options sp-hot-list" }, h("legend", { class: "sp-sr" }, ctx.t("hotspotList")));
  for (const r of q.regions) {
    const input = h("input", { type: "radio", name, value: r.id, class: "sp-check" });
    input.addEventListener("change", () => select(r.id));
    radios.set(r.id, input);
    list.append(h("label", { class: "sp-option" }, input, h("span", { class: "sp-letter", "aria-hidden": "true" }, String(radios.size)), h("span", { class: "sp-opt-text" }, r.label)));
  }
  const regionButtons = new Map();
  const box = h("div", { class: "sp-hotbox" });
  if (src) {
    box.append(h("img", { src, alt: q.image.decorative ? "" : q.image.alt, class: "sp-hotimg" }));
    for (const r of q.regions) {
      const b = h("button", {
        type: "button",
        class: "sp-region",
        "aria-pressed": "false",
        "aria-label": r.label,
        style: `left:${clamp(r.x, 0, 100)}%;top:${clamp(r.y, 0, 100)}%;width:${clamp(r.w, 2, 100)}%;height:${clamp(r.h, 2, 100)}%`,
      });
      b.addEventListener("click", () => select(r.id));
      regionButtons.set(r.id, b);
      box.append(b);
    }
  }
  function select(id) {
    clearMarks(el);
    chosen = id;
    for (const [rid, b] of regionButtons) b.setAttribute("aria-pressed", String(rid === id));
    for (const [rid, i] of radios) i.checked = rid === id;
    ctx.announce(ctx.t("selected", { item: plainText(q.regions.find((r) => r.id === id)?.label ?? "") }));
  }
  const alt = h("details", { class: "sp-alt", open: !src }, h("summary", null, ctx.t("hotspotAlt")), list);
  const el = h("div", { class: "sp-hotwrap" }, src ? h("p", { class: "sp-note-small" }, ctx.t("hotspotHelp")) : null, box, alt);
  return {
    el,
    get: () => chosen,
    lock(on) {
      for (const b of el.querySelectorAll("button,input")) b.disabled = on;
    },
    focus: () => (regionButtons.values().next().value || radios.values().next().value)?.focus(),
    mark(result) {
      clearMarks(el);
      if (!chosen) return;
      const target = regionButtons.get(chosen) || radios.get(chosen).closest("label");
      mark(target, result.status === "correct" ? "right" : "look", ctx, regionButtons.get(chosen) ? box : target);
    },
  };
}

function tickLabel(v, asFraction) {
  const n = parseNumber(String(v));
  if (asFraction && n && !ratIsInt(n)) return `{${n.n}/${n.d}}`;
  return n ? ratToString(n, "decimal") : String(v);
}

export function buildNumberline(q, ctx) {
  const span = q.max - q.min;
  const count = clamp(Math.round(span / q.step), 1, 400);
  const stride = Math.ceil(count / 60);
  const ticks = [];
  for (let i = 0; i <= count; i += stride) ticks.push(Number((q.min + i * q.step).toFixed(10)));
  if (ticks.at(-1) !== q.max && stride === 1) ticks.push(q.max);
  const asFraction = /\//.test(q.answer);
  let value = "";
  const track = h("div", { class: "sp-nl-track", role: "radiogroup", "aria-label": ctx.t("numberlineLabel") });
  const buttons = ticks.map((v, i) => {
    const label = tickLabel(v, asFraction);
    const b = h(
      "button",
      {
        type: "button",
        class: "sp-tick",
        role: "radio",
        "aria-checked": "false",
        "aria-label": plainText(label),
        style: `left:${(i / (ticks.length - 1)) * 100}%`,
        "data-value": String(v),
      },
      h("span", { class: "sp-tick-label", "aria-hidden": "true" }, ticks.length <= 12 || i % Math.ceil(ticks.length / 8) === 0 || i === ticks.length - 1 ? rich(h("span"), label) : ""),
    );
    b.addEventListener("click", () => setValue(String(v), true));
    track.append(b);
    return b;
  });
  const id = nid("nl");
  const typed = h("input", { id, type: "text", class: "sp-input sp-number", inputmode: "decimal", autocomplete: "off", spellcheck: "false" });
  typed.addEventListener("input", () => {
    clearMarks(el);
    setValue(typed.value, false);
  });
  const api = {};
  typed.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      api.onSubmit?.();
    }
  });
  const plainLabel = (v) => (asFraction ? plainText(tickLabel(v, true)) : String(v));
  function setValue(v, fromTick) {
    clearMarks(el);
    value = v;
    if (fromTick) typed.value = plainLabel(v);
    const target = parseNumber(v);
    let stop = null;
    for (const b of buttons) {
      const on = Boolean(target) && Math.abs(Number(b.dataset.value) - ratToNumber(target)) < 1e-9;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on) stop = b;
    }
    if (!stop) buttons[0].tabIndex = 0;
    if (fromTick) ctx.announce(ctx.t("selected", { item: plainLabel(v) }));
  }
  roving(track, ".sp-tick", { onMove: (b) => setValue(b.dataset.value, true) });
  const el = h(
    "div",
    { class: "sp-nlwrap" },
    h("div", { class: "sp-nl" }, track),
    h("label", { class: "sp-sublabel", for: id }, ctx.t("typeNumber")),
    typed,
    h("p", { class: "sp-note-small" }, ctx.t("numberlineHelp")),
  );
  setValue("", false);
  return Object.assign(api, {
    el,
    get: () => value,
    lock(on) {
      typed.disabled = on;
      for (const b of buttons) b.disabled = on;
    },
    focus: () => (buttons.find((b) => b.tabIndex === 0) || buttons[0]).focus(),
    mark(result) {
      clearMarks(el);
      if (value !== "") mark(track, result.status === "correct" ? "right" : "look", ctx, el);
    },
  });
}

const POINT = /^\s*\(?\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*\)?\s*$/;

export function buildPlot(q, ctx) {
  const min = q.min;
  const max = Math.min(q.max, q.min + 20);
  const n = Math.max(1, max - min);
  const pts = []; // {x,y}
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const svg = sv("svg", { class: "sp-plot-svg", viewBox: "0 0 100 100", "aria-hidden": "true", focusable: "false" });
  const X0 = 12;
  const Y0 = 4;
  const SIDE = 84;
  const px = (v) => X0 + ((v - min) / n) * SIDE;
  const py = (v) => Y0 + ((max - v) / n) * SIDE;
  const step = n > 12 ? Math.ceil(n / 10) : 1;
  for (let v = min; v <= max; v++) {
    const axis = v === 0;
    svg.append(sv("line", { x1: px(v), y1: Y0, x2: px(v), y2: Y0 + SIDE, class: axis ? "sp-axis" : "sp-grid" }));
    svg.append(sv("line", { x1: X0, y1: py(v), x2: X0 + SIDE, y2: py(v), class: axis ? "sp-axis" : "sp-grid" }));
    if ((v - min) % step === 0) {
      svg.append(sv("text", { x: px(v), y: Y0 + SIDE + 5.5, "text-anchor": "middle", class: "sp-axis-n" }, String(v)));
      svg.append(sv("text", { x: X0 - 2, y: py(v) + 1.5, "text-anchor": "end", class: "sp-axis-n" }, String(v)));
    }
  }
  const overlay = h("div", { class: "sp-plot-cells", role: "group", "aria-label": ctx.t("plotLabel", { min, max }), style: `--n:${n}` });
  const cells = new Map();
  for (let y = max; y >= min; y--)
    for (let x = min; x <= max; x++) {
      const b = h("button", {
        type: "button",
        class: "sp-pt",
        "aria-pressed": "false",
        "aria-label": `(${x}, ${y})`,
        "data-x": x,
        "data-y": y,
        tabindex: "-1",
        style: `left:${((x - min) / n) * 100}%;top:${((max - y) / n) * 100}%`,
      });
      b.addEventListener("click", () => toggle({ x, y }));
      cells.set(`${x},${y}`, b);
      overlay.append(b);
    }
  cells.get(`${min},${max}`).tabIndex = 0;
  overlay.addEventListener("keydown", (e) => {
    const d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    const at = document.activeElement;
    if (!d || !at?.dataset?.x) return;
    e.preventDefault();
    const nx = clamp(Number(at.dataset.x) + d[0], min, max);
    const ny = clamp(Number(at.dataset.y) + d[1], min, max);
    for (const c of cells.values()) c.tabIndex = -1;
    const next = cells.get(`${nx},${ny}`);
    next.tabIndex = 0;
    next.focus();
  });
  const listEl = h("ul", { class: "sp-pointlist", "aria-label": ctx.t("plotPoints") });
  const typed = h("input", { type: "text", class: "sp-input", id: nid("pt"), autocomplete: "off", spellcheck: "false", placeholder: "2, 3" });
  const addBtn = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, ctx.msg("addPoint"));
  const api = {};

  function toggle(p) {
    clearMarks(el);
    const at = pts.findIndex((x) => same(x, p));
    if (at >= 0) pts.splice(at, 1);
    else if (pts.length < 8) pts.push(p);
    paint();
    ctx.announce(at >= 0 ? ctx.t("removedPoint", { p: `${p.x}, ${p.y}` }) : ctx.t("addedPoint", { p: `${p.x}, ${p.y}` }));
  }
  function paint() {
    for (const [k, b] of cells) b.setAttribute("aria-pressed", String(pts.some((p) => `${p.x},${p.y}` === k)));
    listEl.replaceChildren(
      ...pts.map((p) => {
        const rm = h("button", { type: "button", class: "sp-btn sp-btn-quiet sp-small", "aria-label": ctx.t("removePoint", { p: `${p.x}, ${p.y}` }) }, icon("cross", 14));
        rm.addEventListener("click", () => toggle(p));
        return h("li", null, `(${p.x}, ${p.y})`, rm);
      }),
    );
  }
  const addTyped = () => {
    const m = POINT.exec(typed.value);
    const x = m && Number(m[1]);
    const y = m && Number(m[2]);
    if (!m || x < min || x > max || y < min || y > max) {
      ctx.announce(ctx.t("pointBad", { min, max }));
      typed.setAttribute("aria-invalid", "true");
      return;
    }
    typed.removeAttribute("aria-invalid");
    if (!pts.some((p) => same(p, { x, y }))) toggle({ x, y });
    typed.value = "";
  };
  addBtn.addEventListener("click", addTyped);
  typed.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (typed.value.trim()) addTyped();
      else api.onSubmit?.();
    }
  });
  const el = h(
    "div",
    { class: "sp-plotwrap" },
    h("p", { class: "sp-note-small" }, ctx.t("plotHelp")),
    h("div", { class: "sp-plotbox" }, svg, overlay),
    h("div", { class: "sp-plot-type" }, h("label", { class: "sp-sublabel", for: typed.id }, ctx.t("plotType")), h("div", { class: "sp-inline" }, typed, addBtn)),
    listEl,
  );
  return Object.assign(api, {
    el,
    get: () => pts.map((p) => ({ ...p })),
    lock(on) {
      for (const b of el.querySelectorAll("button,input")) b.disabled = on;
    },
    focus: () => [...cells.values()].find((c) => c.tabIndex === 0).focus(),
    mark(result) {
      clearMarks(el);
      if (pts.length) mark(el.querySelector(".sp-plotbox"), result.status === "correct" ? "right" : "look", ctx);
    },
  });
}
