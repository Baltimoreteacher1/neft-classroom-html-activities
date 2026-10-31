// Shared helpers for the animation step models. Pure functions, no DOM.
// A model is { kind, title, view: [w, h], steps: [{ caption, scene, state }], result }.
// A caption or label is { key, vars }: `key` is the English template (also the Spanish table key).
// A scene is an array of keyed items; the scene renderer tweens items that keep the same id between steps.

export const VIEW_W = 480;

export const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};
export const lcm = (a, b) => (a / gcd(a, b)) * b;

// Accepts an integer or an integer-looking string inside [min, max]; anything else becomes the fallback.
export function intIn(value, min, max, fallback) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

export const cap = (key, vars = {}) => ({ key, vars });
export const signed = (n) => (n < 0 ? `−${-n}` : String(n));
export const fracText = (n, d) => `${n}/${d}`;

// Scene item constructors. `extra` may carry { o, from, xf, role, a } merged onto the item.
function item(tag, id, cls, a, extra = {}) {
  const { a: more, ...rest } = extra;
  return { id, tag, cls, a: { ...a, ...more }, ...rest };
}
export const rect = (id, x, y, width, height, cls, extra) =>
  item("rect", id, cls, { x, y, width, height }, extra);
export const circle = (id, cx, cy, r, cls, extra) => item("circle", id, cls, { cx, cy, r }, extra);
export const line = (id, x1, y1, x2, y2, cls, extra) =>
  item("line", id, cls, { x1, y1, x2, y2 }, extra);
export const polygon = (id, points, cls, extra) => item("polygon", id, cls, { points }, extra);
export const path = (id, d, cls, extra) => item("path", id, cls, { d }, extra);
export const label = (id, x, y, content, cls, extra) => ({
  ...item("text", id, cls, { x, y }, extra),
  text: content,
});

// Render a { key, vars } caption with the English template and plain substitution (used by tests and as the
// English fallback). The browser player translates through t() in ../../i18n.js instead.
export function fill(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
