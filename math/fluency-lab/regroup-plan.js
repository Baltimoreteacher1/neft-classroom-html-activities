// ONE regrouping computation for adding and subtracting by place value. The chip pictures and Build panel
// (studio/engine-place.js), the stacked column boxes (vertical-columns.js) and the written steps (problem-bank
// item.steps via columnSteps) all read this plan, so they name the same places, the same new digits, in the
// same order, with one word for the move: "trade" (Spanish "cambiar"), the word K–3 learners use.
//   Adding: put the chips of each place together, then, from the ones up, trade 10 of a place for 1 of the next.
//   Subtracting: from the ones up, when a place has fewer than the number to take away, trade 1 from the next
//   place that has one (through zeros) for 10 of the place below; then take away place by place.

const clean = (text) => String(text).replaceAll(",", "").replaceAll("−", "-").trim();
const decimalsOf = (text) => (String(text).split(".")[1] || "").length;

// "1,573 + 7,036 = ?" / "53 − 16 = ?" → { op, d, A, B, result, len, a, b } (A, B scaled to whole numbers), else null.
export function parseColumns(question, { maxLen = 7 } = {}) {
  const m = clean(question).match(/^(\d+(?:\.\d+)?) ([+-]) (\d+(?:\.\d+)?) = \?$/);
  if (!m) return null;
  const d = Math.max(decimalsOf(m[1]), decimalsOf(m[3]));
  const A = Math.round(Number(m[1]) * 10 ** d);
  const B = Math.round(Number(m[3]) * 10 ** d);
  const op = m[2] === "+" ? "+" : "-";
  if (op === "-" && A < B) return null;
  const result = op === "+" ? A + B : A - B;
  const len = Math.max(String(A).length, String(B).length, String(result).length, d + 1);
  if (len > maxLen) return null;
  // The numbers are shown as the question wrote them (with its thousands commas, if any).
  const raw = String(question).match(/^\s*([\d,]+(?:\.\d+)?)\s*[+−-]\s*([\d,]+(?:\.\d+)?)/);
  return { engine: "place", op, d, A, B, result, len, a: raw?.[1] || m[1], b: raw?.[2] || m[3] };
}

export const digitsOf = (n, len) =>
  Array.from({ length: len }, (_, i) => Math.floor(n / 10 ** i) % 10);

// { a, b, joined (adding: chips together before regrouping), events, before (counts just before taking away or
// reading), result } — every array indexed by place, 0 = the smallest place. Each event:
// { place, from, to, need, cols } — 1 of place `from` regrouped as 10 of place `to` (subtracting), or 10 of
// place `from` regrouped as 1 of place `to` (adding); `need` is the place being worked on; `cols` the counts after.
export function regroupPlan(spec) {
  const { len } = spec;
  const a = digitsOf(spec.A, len);
  const b = digitsOf(spec.B, len);
  const events = [];
  if (spec.op === "+") {
    const cols = a.map((x, i) => x + b[i]);
    const joined = [...cols];
    for (let i = 0; i < len - 1; i += 1) {
      if (cols[i] < 10) continue;
      const had = cols[i];
      cols[i] -= 10;
      cols[i + 1] += 1;
      events.push({ need: i, from: i, to: i + 1, had, cols: [...cols] });
    }
    return { a, b, joined, events, before: [...cols], result: [...cols] };
  }
  const cols = [...a];
  for (let i = 0; i < len; i += 1) {
    if (cols[i] >= b[i]) continue;
    let j = i + 1;
    while (j < len && cols[j] === 0) j += 1;
    for (let k = j; k > i; k -= 1) {
      const had = cols[i];
      cols[k] -= 1;
      cols[k - 1] += 10;
      events.push({ need: i, from: k, to: k - 1, had, cols: [...cols] });
    }
  }
  return { a, b, joined: null, events, before: [...cols], result: cols.map((x, i) => x - b[i]) };
}

const PLACES = [
  "ones",
  "tens",
  "hundreds",
  "thousands",
  "ten-thousands",
  "hundred-thousands",
  "millions",
];
const FRACS = ["tenths", "hundredths", "thousandths"];
const ONE = ["one", "ten", "hundred", "thousand"];
const place = (spec, i) => {
  const e = i - spec.d;
  return e >= 0 ? PLACES[e] : FRACS[-e - 1];
};
const unit = (spec, i) => {
  const e = i - spec.d;
  return e >= 0 && e < 4 ? ONE[e] : place(spec, i);
};
// A scaled count written the way the question writes its numbers (thousands commas when it uses them).
export function formatLike(spec, n) {
  const text = (n / 10 ** spec.d).toFixed(spec.d);
  if (!`${spec.a}${spec.b}`.includes(",")) return text;
  const [whole, frac] = text.split(".");
  return `${whole.replace(/\B(?=(\d{3})+$)/g, ",")}${frac ? `.${frac}` : ""}`;
}
const fmt = formatLike;
// "1 one", "13 ones": a count of one names the place in the singular.
const counted = (spec, n, i) => `${n} ${n === 1 ? unit(spec, i) : place(spec, i)}`;
// The places that matter: up to the highest place either number or the result uses.
const used = (spec, plan) => {
  let top = spec.len - 1;
  while (top > spec.d && !plan.a[top] && !plan.b[top] && !plan.result[top] && !plan.before[top])
    top -= 1;
  return top;
};
const byPlace = (spec, plan, top, cell) => {
  const parts = [];
  for (let i = 0; i <= top; i += 1) parts.push(`${place(spec, i)} ${cell(i)}`);
  return parts.join(", ");
};

// The written steps of THIS plan, in the order the picture and the column boxes show them.
export function planSteps(spec, plan = regroupPlan(spec)) {
  const top = used(spec, plan);
  const op = spec.op === "+" ? "+" : "−";
  const lineUp = `Line up ${spec.a} and ${spec.b}: ones under ones${spec.d ? ", point under point" : ""}. Start with the ${place(spec, 0)}.`;
  const read = `Read each place: ${spec.a} ${op} ${spec.b} = ${fmt(spec, spec.result)}`;
  // The answer appears only in the last step (a place total can BE the answer), so the work that can show it is
  // written into that step; the steps before it only set up and trade.
  if (spec.op === "+") {
    const trades = plan.events.map(
      (e) =>
        `${counted(spec, e.had, e.from)} is 10 or more. Trade 10 ${place(spec, e.from)} for 1 ${unit(spec, e.to)}: ${place(spec, e.from)} ${e.cols[e.from]}, ${place(spec, e.to)} ${e.cols[e.to]}.`,
    );
    return [
      lineUp,
      [`Add each place: ${byPlace(spec, plan, top, (i) => `${plan.a[i]} + ${plan.b[i]} = ${plan.joined[i]}`)}.`, ...trades, read].join(" "),
    ];
  }
  const trades = plan.events.map(
    (e) =>
      `${counted(spec, e.had, e.need)} is too few to take away ${plan.b[e.need]}. Trade 1 ${unit(spec, e.from)} for 10 ${place(spec, e.to)}: ${place(spec, e.from)} ${e.cols[e.from]}, ${place(spec, e.to)} ${e.cols[e.to]}.`,
  );
  return [
    lineUp,
    ...(trades.length ? [trades.join(" ")] : []),
    `Take away each place: ${byPlace(spec, plan, top, (i) => `${plan.before[i]} ${op} ${plan.b[i]} = ${plan.result[i]}`)}. ${read}`,
  ];
}

// Steps for a generated item: the plan's steps when the item is a place-value sum or difference that regroups or
// has a number of 10 or more.
export function columnSteps(item) {
  const spec = parseColumns(item?.question || "");
  if (!spec) return null;
  const plan = regroupPlan(spec);
  // A one-digit fact (9 + 6, 8 − 5) keeps its fact strategy (make a ten, count on, count back): the chips then show
  // the same total, and the authored fact lessons teach those strategies.
  if (spec.A < 10 && spec.B < 10 && !spec.d) return null;
  return planSteps(spec, plan);
}

// The hint for the same items: the method the steps and the picture use, with no digits at all (so it can never
// read as an answer of 10).
export function columnHint(item) {
  const spec = parseColumns(item?.question || "");
  if (!spec || !columnSteps(item)) return null;
  return spec.op === "+"
    ? "Add each place, starting with the ones. When a place has ten or more, trade ten of them for one in the next place."
    : "Start with the ones. When a place does not have enough to take away, trade one from the next place for ten.";
}
