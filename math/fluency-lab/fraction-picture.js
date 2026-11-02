// Fraction pictures for the Learn page and the practice model: bars cut into equal parts, a grid for "of a fraction",
// and wholes cut into servings. The picture is drawn from the question's own numbers, so it can never disagree with the
// problem. `worked` pictures (the Learn example) also draw the result; practice pictures stop short of it.
// Each row carries data-frac so step-model-link.js can light the row a step talks about.
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a * b) / gcd(a, b);
const MAX_PARTS = 72;

// A row of whole bars. `parts` is the number of equal parts in one whole; `marks` colours parts by position.
function bar(parts, marks, wholes = 1) {
  const total = parts * wholes;
  const cells = Array.from({ length: total }, (_, i) => {
    const mark = marks.find((entry) => i >= entry.from && i < entry.from + entry.count);
    const group = marks.some((entry) => entry.every && i >= entry.from && i < entry.from + entry.count && (i - entry.from) % entry.every === 0);
    const piece = marks.some((entry) => entry.outline && i >= entry.from && i < entry.from + entry.count);
    return `<i class="fp-cell${mark ? ` ${mark.cls}` : ""}${group ? " fp-first" : ""}${piece ? " fp-piece" : ""}"></i>`;
  });
  const bars = Array.from(
    { length: wholes },
    (_, w) => `<span class="fp-whole">${cells.slice(w * parts, (w + 1) * parts).join("")}</span>`,
  );
  return `<span class="fp-bar">${bars.join("")}</span>`;
}

const row = (label, role, body, note = "") =>
  `<div class="fp-row" data-frac="${esc(label)}" data-role="${role}"><span class="fp-label">${esc(label)}</span>${body}${note ? `<small class="fp-note">${esc(note)}</small>` : ""}</div>`;

const wrap = (prompt, body) =>
  `<div class="tp-live fp" data-live="fraction"><p class="tp-prompt">${esc(prompt)}</p>${body}</div>`;

const wholesFor = (numerator, parts) => Math.max(1, Math.ceil(numerator / parts));
const fractionRow = (n, d, role, cls = "fp-a", extra = {}) =>
  row(`${n}/${d}`, role, bar(d, [{ from: 0, count: n, cls }], wholesFor(n, d)), extra.note);

function equivalent(question, worked) {
  const top = question.match(/^(\d+)\/(\d+) = (\d+)\/□$/);
  const bottom = question.match(/^(\d+)\/(\d+) = □\/(\d+)$/);
  const [a, b] = (top || bottom || []).slice(1, 3).map(Number);
  if (!a || !b) return "";
  const first = fractionRow(a, b, "a");
  if (!worked) return wrap("Same amount, more pieces.", first);
  let c;
  let d;
  if (top) {
    c = Number(top[3]);
    if (c % a) return "";
    d = (b * c) / a;
  } else {
    d = Number(bottom[3]);
    if (d % b) return "";
    c = (a * d) / b;
  }
  if (d > MAX_PARTS) return "";
  return wrap("Same amount, cut into more equal pieces.", first + fractionRow(c, d, "r", "fp-r"));
}

function compare(question, worked) {
  const match = question.match(/^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/);
  if (!match) return "";
  const [a, b, c, d] = match.slice(1).map(Number);
  const rows = fractionRow(a, b, "a") + fractionRow(c, d, "b", "fp-b");
  const symbol = a * d > c * b ? ">" : a * d < c * b ? "<" : "=";
  return wrap(
    "Same whole. Compare the shaded parts.",
    rows + (worked ? `<p class="fp-verdict">${a}/${b} ${symbol} ${c}/${d}</p>` : ""),
  );
}

function addSub(question, worked) {
  const match = question.match(/^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/);
  if (!match) return "";
  const [a, b, c, d] = [match[1], match[2], match[4], match[5]].map(Number);
  const plus = match[3] === "+";
  const common = lcm(b, d);
  if (common > MAX_PARTS) return "";
  const [x, y] = [(a * common) / b, (c * common) / d];
  const result = plus ? x + y : x - y;
  if (result < 0) return "";
  let body = fractionRow(a, b, "a") + fractionRow(c, d, "b", "fp-b");
  if (b !== d) {
    body += row(
      `${x}/${common}`,
      "a2",
      bar(common, [{ from: 0, count: x, cls: "fp-a" }], wholesFor(x, common)),
      "same size pieces",
    );
    body += row(
      `${y}/${common}`,
      "b2",
      bar(common, [{ from: 0, count: y, cls: "fp-b" }], wholesFor(y, common)),
    );
  }
  if (worked) {
    const marks = plus
      ? [
          { from: 0, count: x, cls: "fp-a" },
          { from: x, count: y, cls: "fp-b" },
        ]
      : [
          { from: 0, count: result, cls: "fp-r" },
          { from: result, count: y, cls: "fp-take" },
        ];
    body += row(
      `${result}/${common}`,
      "r",
      bar(common, marks, wholesFor(Math.max(x + (plus ? y : 0), 1), common)),
      plus ? "put them together" : "take the second away",
    );
  }
  return wrap(
    b === d
      ? "Same size pieces: just add or take away."
      : "Rename both with same size pieces first.",
    body,
  );
}

function multiply(question, worked) {
  const match = question.match(/^(\d+)\/(\d+) × (\d+)\/(\d+) = \?$/);
  if (!match) return "";
  const [a, b, c, d] = match.slice(1).map(Number);
  if (b > 12 || d > 12) return "";
  const cells = [];
  for (let r = 0; r < d; r += 1)
    for (let k = 0; k < b; k += 1) {
      const col = k < a;
      const rowOn = r < c;
      const cls = col && rowOn && worked ? "fp-AB" : col ? "fp-a" : rowOn && worked ? "fp-b" : "";
      cells.push(`<i class="fp-cell ${cls}"></i>`);
    }
  const grid = `<div class="fp-grid" data-focus="" style="--cols:${b}">${cells.join("")}</div>`;
  return wrap(
    worked
      ? `${a}/${b} of ${c}/${d}: the dark squares are the answer.`
      : `Cut a whole into ${b} columns and ${d} rows.`,
    `<div class="fp-row" data-frac="${a}/${b}" data-role="a"><span class="fp-label">${a}/${b} × ${c}/${d}</span>${grid}</div>`,
  );
}

function divide(question, worked) {
  const match = question.match(/^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/);
  if (!match) return "";
  const [a, b, c, d] = match.slice(1).map(Number);
  const common = lcm(b, d);
  if (common > MAX_PARTS) return "";
  const [x, g] = [(a * common) / b, (c * common) / d];
  const marks = [{ from: 0, count: x, cls: "fp-a", every: worked ? g : 0 }];
  if (worked) marks.push({ from: 0, count: g, cls: "", outline: true });
  if (!worked) marks.push({ from: 0, count: g, cls: "fp-b" });
  const note = worked ? `the outline is one ${c}/${d} piece` : `one ${c}/${d} piece`;
  return wrap(
    `How many ${c}/${d} pieces fit in ${a}/${b}?`,
    row(`${a}/${b}`, "a", bar(common, marks, wholesFor(x, common)), note) +
      (worked ? "" : row(`${c}/${d}`, "b", bar(common, [{ from: 0, count: g, cls: "fp-b" }], 1))),
  );
}

function fractionOf(question, worked) {
  const match = question.match(/^What is (\d+)\/(\d+) of (\d+)\?$/);
  if (!match) return "";
  const [a, b, whole] = match.slice(1).map(Number);
  const each = whole / b;
  const body = row(
    `${a}/${b}`,
    "a",
    bar(b, [{ from: 0, count: a, cls: "fp-a" }]),
    worked && Number.isInteger(each)
      ? `${whole} ÷ ${b} = ${each} in each part`
      : `${whole} cut into ${b} equal parts`,
  );
  return wrap(`Cut ${whole} into ${b} equal groups. Take ${a} of them.`, body);
}

function unitServings(question, worked) {
  const match = question.match(/holds (\d+) liters?\. How many 1\/(\d+)-liter/);
  if (!match) return "";
  const [whole, d] = match.slice(1).map(Number);
  if (whole > 8 || d > 12) return "";
  const body = row(
    `${whole} liters`,
    "a",
    bar(d, [{ from: 0, count: whole * d, cls: "fp-a" }], whole),
    worked ? `${whole} × ${d} = ${whole * d} servings` : `each liter cut into ${d} parts`,
  );
  return wrap(`Cut each liter into ${d} equal servings.`, body);
}

const SHAPES = [equivalent, compare, addSub, multiply, divide, fractionOf, unitServings];

// "" when the question is not a fraction shape this knows (negative fractions, mixed numbers, very large parts).
export function fractionPicture(question, { worked = false } = {}) {
  const text = String(question).trim();
  if (!/\d+\/\d+/.test(text) || /-\d+\/|\(-/.test(text)) return "";
  for (const shape of SHAPES) {
    const html = shape(text, worked);
    if (html) return html;
  }
  return "";
}
