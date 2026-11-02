// DOM, SVG, pointer, keyboard and live-region plumbing shared by the graphics-a components. Every component is
// built by createComponent(): a persistent shell (toolbar, svg stage, readout, live region, check bar) plus a
// render(state) function that redraws the svg layer in CSS pixels (viewBox width = measured width, so scale is 1).
import { getLang, setLang, t as baseT } from "../i18n.js";
import { clamp, plain } from "./graphics-a-core.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const MODES = ["explore", "build", "check"];

// The component brings its own stylesheet, so mounting it on any page works without a <link>.
function ensureStyles() {
  if (typeof document === "undefined" || document.querySelector("link[data-ga-css]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("./graphics-a.css", import.meta.url).href;
  link.setAttribute("data-ga-css", "");
  document.head.append(link);
}

function apply(node, props) {
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "text") node.textContent = value;
    else if (key === "on")
      for (const [type, fn] of Object.entries(value)) node.addEventListener(type, fn);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  return node;
}
const append = (node, kids) => {
  for (const kid of kids.flat())
    if (kid !== null && kid !== undefined && kid !== false) node.append(kid);
  return node;
};
export const h = (tag, props, ...kids) => append(apply(document.createElement(tag), props), kids);
export const s = (tag, props, ...kids) =>
  append(apply(document.createElementNS(SVG_NS, tag), props), kids);

export function makeT(lang) {
  return (text, vars) => {
    const current = getLang();
    if (!lang || lang === current) return baseT(text, vars);
    setLang(lang, { persist: false });
    try {
      return baseT(text, vars);
    } finally {
      setLang(current, { persist: false });
    }
  };
}

// A stacked fraction (numerator over denominator) with a plain-text accessible name.
export function fracEl(f, { mixed = false } = {}) {
  if (f.d === 1) return h("span", { class: "ga-int", text: String(f.n) });
  const wholePart = mixed && Math.abs(f.n) >= f.d ? Math.trunc(f.n / f.d) : null;
  const top = wholePart === null ? f.n : Math.abs(f.n) % f.d;
  const name = wholePart === null ? `${f.n}/${f.d}` : `${wholePart} ${top}/${f.d}`;
  return h(
    "span",
    { class: "ga-frac-wrap", role: "img", "aria-label": name },
    wholePart === null
      ? null
      : h("span", { class: "ga-whole", "aria-hidden": "true", text: String(wholePart) }),
    h(
      "span",
      { class: "ga-frac", "aria-hidden": "true" },
      h("span", { text: String(top) }),
      h("span", { text: String(f.d) }),
    ),
  );
}

export function button(id, text, onClick, props = {}) {
  return h("button", {
    type: "button",
    class: `ga-btn ${props.class || ""}`.trim(),
    "data-fid": id,
    "aria-pressed": props.pressed === undefined ? null : String(props.pressed),
    "aria-label": props.label,
    text,
    on: {
      click: (event) =>
        event.currentTarget.getAttribute("aria-disabled") !== "true" && onClick(event),
    },
  });
}
export const setDisabled = (node, disabled) =>
  node.setAttribute("aria-disabled", String(Boolean(disabled)));

// Minus / value / plus control. Uses aria-disabled (not disabled) so focus is never dropped at a limit.
export function stepper(ctx, { id, label, min, max, onChange, format = String }) {
  const t = ctx.t;
  const out = h("output", { class: "ga-step-value", "data-fid": `${id}-value`, tabindex: "0" });
  let value = min;
  const move = (delta) => value + delta >= min && value + delta <= max && onChange(value + delta);
  const minus = button(`${id}-minus`, "−", () => move(-1), {
    label: t("Decrease {name}", { name: label }),
    class: "ga-step-btn",
  });
  const plus = button(`${id}-plus`, "+", () => move(1), {
    label: t("Increase {name}", { name: label }),
    class: "ga-step-btn",
  });
  out.addEventListener("keydown", (event) => {
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
    if (delta) {
      event.preventDefault();
      move(delta);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      onChange(event.key === "Home" ? min : max);
    }
  });
  const el = h(
    "div",
    { class: "ga-step", role: "group", "aria-label": label },
    h("span", { class: "ga-step-label", "aria-hidden": "true", text: label }),
    minus,
    out,
    plus,
  );
  return {
    el,
    set(next, nextMax = max) {
      value = next;
      max = nextMax;
      out.textContent = format(next);
      out.setAttribute("role", "spinbutton");
      out.setAttribute("aria-valuemin", String(min));
      out.setAttribute("aria-valuemax", String(max));
      out.setAttribute("aria-valuenow", String(next));
      out.setAttribute("aria-valuetext", format(next));
      out.setAttribute("aria-label", label);
      setDisabled(minus, next <= min);
      setDisabled(plus, next >= max);
    },
  };
}

// A group of mutually exclusive toggle buttons.
export function choice({ id, label, options, onChange }) {
  const buttons = options.map((option) =>
    button(`${id}-${option.value}`, option.text, () => onChange(option.value), { pressed: false }),
  );
  const el = h("div", { class: "ga-choice", role: "group", "aria-label": label }, buttons);
  return {
    el,
    set(value) {
      options.forEach((option, i) =>
        buttons[i].setAttribute("aria-pressed", String(option.value === value)),
      );
    },
  };
}

// Keyboard slider rule shared by every draggable handle. Returns the new value, or null if the key is not ours.
export function sliderKey(event, { value, min, max, step = 1, big = 10 }) {
  const table = {
    ArrowRight: value + step,
    ArrowUp: value + step,
    ArrowLeft: value - step,
    ArrowDown: value - step,
    PageUp: value + big,
    PageDown: value - big,
    Home: min,
    End: max,
  };
  if (!(event.key in table)) return null;
  event.preventDefault();
  return clamp(table[event.key], min, max);
}

export const svgPoint = (svg, event) => {
  const rect = svg.getBoundingClientRect();
  const box = svg.viewBox.baseVal;
  const sx = rect.width ? box.width / rect.width : 1;
  const sy = rect.height ? box.height / rect.height : 1;
  return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
};

// One pointer-event drag surface per svg; handles are found by data-drag on the event target (delegation, so
// redrawing the layer never breaks pointer capture).
export function dragSurface(svg, { move, end }) {
  let active = null;
  const down = (event) => {
    const node = event.target.closest?.("[data-drag]");
    if (!node || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    active = { id: event.pointerId, token: node.getAttribute("data-drag") };
    svg.setPointerCapture?.(event.pointerId);
    move(active.token, svgPoint(svg, event), event, true);
  };
  const track = (event) =>
    active &&
    event.pointerId === active.id &&
    move(active.token, svgPoint(svg, event), event, false);
  const up = (event) => {
    if (!active || event.pointerId !== active.id) return;
    const token = active.token;
    active = null;
    end?.(token, svgPoint(svg, event), event);
  };
  svg.addEventListener("pointerdown", down);
  svg.addEventListener("pointermove", track);
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);
}

export function text(
  parent,
  x,
  y,
  value,
  { size = 14, anchor = "middle", weight = 500, cls = "" } = {},
) {
  parent.append(
    s(
      "text",
      {
        x,
        y,
        "text-anchor": anchor,
        "font-size": size,
        "font-weight": weight,
        class: `ga-text ${cls}`.trim(),
      },
      document.createTextNode(String(value)),
    ),
  );
}

// A stacked fraction drawn in svg, centred on x with its fraction bar at y. Integers are plain numerals.
export function svgFraction(parent, x, y, f, { size = 14, mixed = false, cls = "" } = {}) {
  const sign = f.n < 0 ? "\u2212" : "";
  const abs = Math.abs(f.n);
  const w = size * 0.62;
  if (f.d === 1) {
    text(parent, x, y + size * 0.35, `${sign}${abs}`, { size, weight: 600, cls });
    return;
  }
  const whole = mixed && abs >= f.d ? Math.floor(abs / f.d) : null;
  const top = whole === null ? abs : abs % f.d;
  const fw = Math.max(String(top).length, String(f.d).length) * w + 6;
  const lead = `${sign}${whole === null ? "" : whole}`;
  const lw = lead.length * w + (lead ? 3 : 0);
  const left = x - (lw + fw) / 2;
  if (lead) text(parent, left + lw / 2 - 1, y + size * 0.35, lead, { size, weight: 600, cls });
  const cx = left + lw + fw / 2;
  text(parent, cx, y - 3, top, { size, weight: 600, cls });
  text(parent, cx, y + size * 0.82 + 1, f.d, { size, weight: 600, cls });
  parent.append(s("line", { x1: cx - fw / 2 + 1, x2: cx + fw / 2 - 1, y1: y, y2: y, class: `ga-fbar ${cls}`.trim() }));
}

// spec: { title, initial(cfg), normalize(state, cfg), describe(state, t, cfg), evaluate(state, target, cfg), build(ctx) -> { render(state) } }
export function createComponent(kind, container, config, spec) {
  const cfg = { mode: "explore", ...config };
  if (!MODES.includes(cfg.mode)) throw new RangeError(`Unknown mode: ${cfg.mode}`);
  if (!container) throw new RangeError("A container element is required");
  ensureStyles();
  const t = makeT(cfg.lang);
  const live = h("div", {
    class: "ga-live",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
  const svg = s("svg", {
    class: "ga-svg",
    role: "group",
    "aria-roledescription": t("interactive diagram"),
  });
  const layer = s("g", { class: "ga-layer" });
  svg.append(layer);
  const controls = h("div", { class: "ga-controls", role: "group", "aria-label": t("Controls") });
  const stage = h("div", { class: "ga-stage" }, svg);
  const readout = h("div", { class: "ga-readout" });
  const verdict = h("p", { class: "ga-verdict" });
  const checkBar = cfg.mode === "check" ? h("div", { class: "ga-check" }) : null;
  const title = cfg.label || spec.title(t);
  const root = h(
    "section",
    {
      class: `ga ga--${kind}`,
      "data-ga-kind": kind,
      "data-ga-mode": cfg.mode,
      "aria-label": title,
    },
    h("h3", { class: "ga-title", text: title }),
    stage,
    readout,
    controls,
    checkBar,
    live,
  );
  let state = spec.normalize(spec.initial(cfg, t), cfg);
  let width = 0;
  let view = null;
  let destroyed = false;
  let observer = null;
  let flip = false;

  const measure = () => clamp(Math.round(stage.clientWidth || cfg.width || 520), 280, 760);
  const ctx = {
    t,
    cfg,
    mode: cfg.mode,
    root,
    controls,
    stage,
    svg,
    readout,
    get W() {
      return width;
    },
    get: () => state,
    say: () => ctx.announce(spec.describe(state, t, cfg)),
    redraw: () => redraw(),
    // A repeated identical message still needs to be spoken, so alternate a trailing no-break space.
    announce(message) {
      flip = !flip;
      live.textContent = flip ? message : `${message} `;
    },
    begin(height) {
      layer.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("aria-label", spec.describe(state, t, cfg));
      return layer;
    },
    set(next, { say = true } = {}) {
      if (destroyed) return;
      state = spec.normalize(typeof next === "function" ? next(state) : next, cfg);
      redraw();
      verdict.textContent = "";
      const payload = plain(state);
      if (cfg.mode === "check" && cfg.target !== undefined)
        payload.correct = spec.evaluate(state, cfg.target, cfg);
      cfg.onChange?.(payload);
      if (say) ctx.announce(spec.describe(state, t, cfg));
    },
  };
  svg.append(layer);

  function redraw() {
    if (destroyed || !view) return;
    const active = root.contains(document.activeElement)
      ? document.activeElement.getAttribute("data-fid")
      : null;
    width = measure();
    view.render(state);
    if (active && !root.contains(document.activeElement)) {
      const again = [...root.querySelectorAll("[data-fid]")].find(
        (node) => node.getAttribute("data-fid") === active,
      );
      again?.focus({ preventScroll: true });
    }
  }

  width = measure();
  view = spec.build(ctx);
  if (checkBar) {
    const run = h("button", {
      type: "button",
      class: "ga-btn ga-btn--primary",
      "data-fid": "check",
      text: t("Check my model"),
      on: {
        click: () => {
          const correct = cfg.target === undefined ? false : spec.evaluate(state, cfg.target, cfg);
          verdict.textContent = correct
            ? t("Yes. This model matches.")
            : t("Not yet. Change your model and check again.");
          ctx.announce(verdict.textContent);
          cfg.onChange?.({ ...plain(state), correct, checked: true });
        },
      },
    });
    checkBar.append(run, verdict);
  }
  container.replaceChildren(root);
  redraw();
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      if (Math.abs(measure() - width) >= 2) redraw();
    });
    observer.observe(stage);
  }
  return {
    kind,
    getState: () => plain(state),
    setState(next) {
      state = spec.normalize(next, cfg);
      redraw();
    },
    describe: () => spec.describe(state, t, cfg),
    destroy() {
      destroyed = true;
      observer?.disconnect();
      root.remove();
    },
  };
}
