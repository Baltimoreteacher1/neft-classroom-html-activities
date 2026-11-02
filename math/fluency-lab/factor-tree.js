// Prime factorization visuals and parsing, shared by the LCM lesson, the worked solver, and the trail picture.
// Pure functions only: the same factor tree that teaches the idea is the one the tests re-derive.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function primeList(n) {
  const out = [];
  let rest = Math.abs(Math.trunc(n));
  for (let d = 2; d * d <= rest; d += d === 2 ? 1 : 2) {
    while (rest % d === 0) {
      out.push(d);
      rest /= d;
    }
  }
  if (rest > 1) out.push(rest);
  return out;
}

export const countOf = (list, prime) => list.filter((p) => p === prime).length;
export const factorText = (list) => list.join(" × ");

// Repeated primes as powers: [2, 2, 3, 3, 3] is 2² × 3³. Every exponent surface reads from these groups.
const SUPERSCRIPT_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const superscript = (n) => [...String(n)].map((digit) => SUPERSCRIPT_DIGITS[digit]).join("");
export function powerGroups(list) {
  return [...new Set(list)]
    .sort((x, y) => x - y)
    .map((prime) => ({ prime, count: countOf(list, prime), value: prime ** countOf(list, prime) }));
}
export const powerText = (list) =>
  powerGroups(list)
    .map(({ prime, count }) => (count > 1 ? `${prime}${superscript(count)}` : String(prime)))
    .join(" × ");
const powerHtml = (list) =>
  powerGroups(list)
    .map(({ prime, count }) => (count > 1 ? `${prime}<sup>${count}</sup>` : String(prime)))
    .join(" × ");
const product = (list) => list.reduce((total, x) => total * x, 1);

// "2² × 3² = 4 × 9 = 36": exponents first, then each power as a number, then the product.
// A step that adds nothing (no repeated prime, or a single power) is left out.
export function multiplyText(list) {
  const groups = powerGroups(list);
  const steps = [powerText(list)];
  if (groups.length > 1 && groups.some(({ count }) => count > 1))
    steps.push(groups.map(({ value }) => value).join(" × "));
  steps.push(String(product(list)));
  return steps.join(" = ");
}

// The primes an LCM keeps: for each prime, the larger number of copies found in either factorization.
export function keptPrimes(a, b) {
  const pa = primeList(a);
  const pb = primeList(b);
  const primes = [...new Set([...pa, ...pb])].sort((x, y) => x - y);
  return primes.flatMap((p) => Array(Math.max(countOf(pa, p), countOf(pb, p))).fill(p));
}

// Split n into the two factors closest together (3 × 4 for 12), so trees read as balanced as the number allows.
export function splitPair(n) {
  for (let d = Math.floor(Math.sqrt(n)); d >= 2; d -= 1) if (n % d === 0) return [d, n / d];
  return null;
}

export function treeOf(n) {
  const pair = splitPair(n);
  return pair ? { n, kids: pair.map(treeOf) } : { n, kids: [] };
}

const leavesOf = (node) =>
  node.kids.length ? node.kids.reduce((sum, kid) => sum + leavesOf(kid), 0) : 1;
const depthOf = (node) => (node.kids.length ? 1 + Math.max(...node.kids.map(depthOf)) : 0);

function describe(node) {
  if (!node.kids.length) return "";
  return `${node.n} splits into ${node.kids[0].n} and ${node.kids[1].n}. ${node.kids.map(describe).join("")}`;
}

// "20 = 2 × 2 × 5 = 2² × 5": the leaves read off the tree, then the same primes with exponents.
export function treeCaption(n) {
  const primes = primeList(n);
  if (primes.length === 1) return `${n} is prime`;
  const spelled = factorText(primes);
  const powers = powerText(primes);
  return `${n} = ${spelled}${powers === spelled ? "" : ` = ${powers}`}`;
}

// A factor tree as an SVG: composite numbers are open circles that split; primes are filled and end the branch.
export function factorTreeSvg(n, { label = "" } = {}) {
  const root = treeOf(n);
  const unit = 52;
  const rise = 56;
  const width = leavesOf(root) * unit;
  const height = (depthOf(root) + 1) * rise;
  const parts = [];
  const place = (node, left, level) => {
    const span = leavesOf(node) * unit;
    const x = left + span / 2;
    const y = level * rise + 24;
    let cursor = left;
    const kids = node.kids.map((kid) => {
      const placed = place(kid, cursor, level + 1);
      cursor += leavesOf(kid) * unit;
      return placed;
    });
    for (const kid of kids)
      parts.unshift(
        `<line class="ft-line" x1="${x}" y1="${y + 16}" x2="${kid.x}" y2="${kid.y - 16}"/>`,
      );
    parts.push(
      `<g class="${node.kids.length ? "ft-comp" : "ft-prime"}"><circle cx="${x}" cy="${y}" r="17"/><text x="${x}" y="${y + 5}" text-anchor="middle">${node.n}</text></g>`,
    );
    return { x, y };
  };
  place(root, 0, 0);
  const primes = primeList(n);
  const words =
    primes.length === 1
      ? `${n} is prime.`
      : `${describe(root)}Prime factors: ${factorText(primes)}.`;
  const aria = `Factor tree of ${n}. ${words}`;
  return `<figure class="ft-figure"><svg class="ft-tree" style="max-width:${width}px" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(aria)}">${parts.join("")}</svg>${label ? `<figcaption>${esc(label)}</figcaption>` : ""}</figure>`;
}

// Prime | copies in a | copies in b | keep the larger | that power as a number.
// `hideKeep` leaves the last two columns for the learner to fill.
export function copiesTable(a, b, { hideKeep = false } = {}) {
  const pa = primeList(a);
  const pb = primeList(b);
  const primes = [...new Set([...pa, ...pb])].sort((x, y) => x - y);
  const rows = primes.map((p) => {
    const [ca, cb] = [countOf(pa, p), countOf(pb, p)];
    const keep = Math.max(ca, cb);
    const power = keep > 1 ? `${p}<sup>${keep}</sup> = ${p ** keep}` : String(p);
    return `<tr><th scope="row">${p}</th><td>${ca}</td><td>${cb}</td>${hideKeep ? "<td>?</td><td>?</td>" : `<td>${keep}</td><td>${power}</td>`}</tr>`;
  });
  return `<table class="ft-copies"><thead><tr><th scope="col">Prime</th><th scope="col">Copies in ${a}</th><th scope="col">Copies in ${b}</th><th scope="col">Keep</th><th scope="col">Power</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

// The kept primes as powers, then multiplied: LCM = 2² × 3² = 4 × 9 = 36. `hideResult` leaves the product as "?".
export function lcmMultiplyHtml(a, b, { hideResult = false } = {}) {
  const kept = keptPrimes(a, b);
  const groups = powerGroups(kept);
  const parts = [powerHtml(kept)];
  if (groups.length > 1 && groups.some(({ count }) => count > 1))
    parts.push(groups.map(({ value }) => value).join(" × "));
  parts.push(hideResult ? "?" : String(product(kept)));
  return `<p class="ft-multiply"><strong>LCM(${a}, ${b})</strong> = ${parts.join(" = ")}</p>`;
}

// Each kept prime as a brick: its power and that power as a number. Bricks multiply to the LCM,
// which `withTotal: false` leaves off while the learner is still choosing what to keep.
export function powerBricksHtml(list, { withTotal = true } = {}) {
  const bricks = powerGroups(list).map(
    ({ prime, count, value }) =>
      `<b class="ft-brick"><span class="ft-base">${count > 1 ? `${prime}<sup>${count}</sup>` : prime}</span><i>${count > 1 ? `= ${value}` : "&nbsp;"}</i></b>`,
  );
  const total = withTotal
    ? `<span class="ft-times" aria-hidden="true">=</span><b class="ft-brick ft-total">${product(list)}</b>`
    : "";
  const label = withTotal ? multiplyText(list) : powerText(list);
  return `<span class="ft-bricks" role="img" aria-label="${esc(label)}">${bricks.join('<span class="ft-times" aria-hidden="true">×</span>')}${total}</span>`;
}

// "2 × 2 × 3", "2x2x3", "2, 2, 3", "2^2 × 3", "2² 3" all read as the multiset {2, 2, 3}; anything else is null.
const SUPERSCRIPT = { "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
export function parsePrimes(text) {
  const source = String(text)
    .toLowerCase()
    .replace(/\band\b/g, " ");
  if (/[^0-9\s×x*·,^²³⁴⁵⁶⁷⁸⁹]/.test(source)) return null;
  const out = [];
  for (const match of source.matchAll(/(\d+)\s*(?:\^\s*(\d+)|([²³⁴⁵⁶⁷⁸⁹]))?/g)) {
    const base = Number(match[1]);
    const power = match[2] ? Number(match[2]) : match[3] ? SUPERSCRIPT[match[3]] : 1;
    if (base < 2 || power < 1 || power > 12) return null;
    for (let i = 0; i < power; i += 1) out.push(base);
  }
  return out.length && out.length <= 24 ? out.sort((x, y) => x - y) : null;
}
