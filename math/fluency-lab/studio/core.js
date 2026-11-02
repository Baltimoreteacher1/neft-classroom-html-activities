// Shared pieces for the Math Discovery Studio engines: bilingual text, exact arithmetic, SVG helpers and the
// keyed updater that lets a model move between frames instead of being redrawn.
export const L = (en, es) => ({ en, es: es ?? en });
export const pick = (text, lang) =>
  text && typeof text === "object" ? (text[lang] ?? text.en) : text;

export const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// One colour per kind of quantity, always paired with a label, never alone.
export const COLORS = {
  ones: "#0f766e",
  tens: "#1d4ed8",
  hundreds: "#a3401f",
  thousands: "#7a5200",
  big: "#be123c",
  part: "#0f766e",
  whole: "#1d4ed8",
  warn: "#b45309",
  ink: "#17324d",
  mute: "#64748b",
  rule: "#cbd5e1",
};
export const PLACE_COLORS = [
  COLORS.ones,
  COLORS.tens,
  COLORS.hundreds,
  COLORS.thousands,
  COLORS.big,
  COLORS.part,
  COLORS.whole,
];

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => Math.abs(a * b) / (gcd(a, b) || 1);

// "1,234" and "−5" and "-5" all read as numbers; anything else is null so a parser can decline.
export const num = (text) => {
  const cleaned = String(text).replaceAll(",", "").replaceAll("−", "-").trim();
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
};
export const decimals = (text) => (String(text).split(".")[1] || "").length;
export const fmt = (value) => {
  const rounded = Math.round(value * 1e9) / 1e9;
  return String(rounded).replace("-", "−");
};

// Question text as math: minus signs and spaces normalised, so parsers read one spelling.
export const clean = (question) =>
  String(question).replaceAll("−", "-").replaceAll(",", "").replace(/\s+/g, " ").trim();

// A frame is { id, cap, easy?, eq, svg, alt, focus? }. The studio reads these; engines never touch the DOM.
export const frame = (f) => ({ easy: null, focus: null, ...f });

export const svgWrap = (body, alt, { w = 560, h = 260 } = {}) =>
  `<svg class="sd-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;

// Keyed element: data-k identifies it across frames; the transform moves it, the class decides how it enters.
export const keyed = (key, x, y, inner, cls = "") =>
  `<g class="sd-k ${cls}" data-k="${esc(key)}" style="transform:translate(${x}px,${y}px)">${inner}</g>`;

export const txt = (
  x,
  y,
  value,
  { size = 18, weight = 700, fill = COLORS.ink, anchor = "middle", cls = "" } = {},
) =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;

// Move the model to its next frame. Keyed groups already on screen slide to their new place; new ones fade in;
// ones that are gone fade out. With reduced motion the swap is immediate.
export function morph(stage, html, { animate = true } = {}) {
  const next = Object.assign(stage.ownerDocument.createElement("div"), { innerHTML: html });
  const incoming = next.querySelector("svg");
  const current = stage.querySelector("svg");
  if (!incoming) return void (stage.innerHTML = html);
  if (!current || !animate) {
    stage.innerHTML = html;
    return void fitWidth(stage.querySelector("svg"));
  }
  current.setAttribute("aria-label", incoming.getAttribute("aria-label") || "");
  const old = new Map(
    [...current.querySelectorAll(":scope > .sd-k")].map((el) => [el.dataset.k, el]),
  );
  const seen = new Set();
  for (const el of current.querySelectorAll(":scope > :not(.sd-k)")) el.remove();
  // Keep the drawing order of the incoming frame. Keyed groups already on screen stay where they are (moving a node
  // would restart its transition), and everything else is placed right after the sibling that precedes it in the new
  // frame, so a column background still sits under its chips and a label still sits over them.
  let anchor = null;
  const place = (node) => {
    if (anchor) anchor.after(node);
    else current.prepend(node);
    anchor = node;
  };
  for (const el of [...incoming.children]) {
    if (!el.classList.contains("sd-k")) {
      place(el.cloneNode(true));
      continue;
    }
    const prior = old.get(el.dataset.k);
    seen.add(el.dataset.k);
    if (prior) {
      prior.setAttribute("style", el.getAttribute("style"));
      prior.className.baseVal = el.className.baseVal;
      prior.innerHTML = el.innerHTML;
      anchor = prior;
    } else {
      const added = el.cloneNode(true);
      added.classList.add("sd-enter");
      place(added);
      requestAnimationFrame?.(() => added.classList.remove("sd-enter"));
    }
  }
  for (const [key, el] of old)
    if (!seen.has(key)) {
      el.classList.add("sd-leave");
      setTimeout(() => el.remove(), 320);
    }
  fitWidth(current);
}

// Crop the drawing's empty side margins so a narrow model fills the stage instead of floating small in the middle
// (on a phone a 560-unit drawing was scaled to about half size, and its text to about 7px). The crop only ever
// grows across the frames of one lesson, so the picture never zooms back and forth. Height is untouched.
export function fitWidth(svg, { pad = 18, min = 300 } = {}) {
  if (!svg?.getBBox || !svg.viewBox?.baseVal?.height) return;
  let box;
  try {
    box = svg.getBBox();
  } catch {
    return;
  }
  if (!(box.width > 0)) return;
  const left = Math.min(Number(svg.dataset.fitL ?? box.x), box.x);
  const right = Math.max(Number(svg.dataset.fitR ?? box.x + box.width), box.x + box.width);
  svg.dataset.fitL = String(left);
  svg.dataset.fitR = String(right);
  const width = Math.max(right - left + pad * 2, min);
  const x = (left + right) / 2 - width / 2;
  svg.setAttribute("viewBox", `${x} 0 ${width} ${svg.viewBox.baseVal.height}`);
}

// An engine must be able to prove its frames. Tests call this for every generated lesson.
export function checkFrames(frames) {
  const problems = [];
  frames.forEach((f, i) => {
    if (!f.cap?.en || !f.cap?.es) problems.push(`frame ${i}: caption needs English and Spanish`);
    if (!f.svg?.includes("<svg")) problems.push(`frame ${i}: no drawing`);
    if (!f.alt?.en || !f.alt?.es) problems.push(`frame ${i}: no text description`);
  });
  return problems;
}

// ----- Helpers for the smaller engines: one declaration per frame, and picking an answer as the Build. -----
// A frame from a drawing body: wraps it in an SVG, attaches the description for screen readers, keeps `meta`.
export const frameOf = ({ id, cap, easy = null, eq = "", body, alt, meta = {}, h = 220 }) =>
  Object.assign(frame({ id, cap, easy, eq, svg: svgWrap(body, alt.en, { h }), alt }), { meta });

// A predict point with one right and one wrong answer, each explaining itself in both languages.
export const predictOf = (at, q, right, wrong, why, explainRight, explainWrong) => ({
  at,
  q,
  choices: [
    { t: right, ok: true, why: why.right },
    { t: wrong, ok: false, why: why.wrong },
  ],
  explain: [
    { t: explainRight, ok: true },
    { t: explainWrong, ok: false },
  ],
});

// A Build where the learner chooses among labelled options and the engine says which is right and why not.
//   options(spec) -> [{ label: L, ok: bool, msg: L }]   draw(spec, picked|null) -> { body, alt, h? }
export const choiceBuild = ({ prompt, options, draw, doneMsg, available }) => ({
  available,
  prompt,
  init: () => ({ pick: null }),
  render(st, spec) {
    const { body, alt, h = 220 } = draw(spec, st.pick);
    const opts = options(spec);
    const done = st.pick !== null && opts[st.pick]?.ok;
    return {
      svg: svgWrap(body, alt.en, { h }),
      alt,
      controls: opts.map((o, i) => ({ id: "pick", arg: i, label: o.label })),
      status: done ? doneMsg(spec) : null,
    };
  },
  act(st, id, arg, spec) {
    const o = options(spec)[arg];
    return { state: { pick: arg }, ok: Boolean(o.ok), msg: o.ok ? null : o.msg, tag: o.ok ? null : "wrongPick" };
  },
  done: (st, spec) => st.pick !== null && Boolean(options(spec)[st.pick]?.ok),
});

// Dots in rows of `per`, for counters and ten-frames. Returns the SVG body and its height.
export function dotRows(count, { per = 5, r = 16, gap = 8, x0 = 280, y0 = 40, fill = COLORS.whole, filled = count } = {}) {
  const w = per * (2 * r + gap) - gap;
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const cx = x0 - w / 2 + r + (i % per) * (2 * r + gap);
    const cy = y0 + r + Math.floor(i / per) * (2 * r + gap);
    out += keyed(`d${i}`, cx, cy, `<circle r="${r}" fill="${i < filled ? fill : "#fff"}" stroke="${COLORS.ink}" stroke-width="2"/>`);
  }
  return { body: out, h: y0 + Math.ceil(count / per) * (2 * r + gap) + 20 };
}
