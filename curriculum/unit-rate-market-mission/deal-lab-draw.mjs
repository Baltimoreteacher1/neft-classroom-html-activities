/* Unit Rate Market Mission · Deal Lab drawings. DOM-free string builders.
 * Every representation is drawn from the SAME deal object ({ qty, cents, rule }), through
 * purchase()/unitPrice(), so the shelf, ratio table, double number line and graph cannot disagree.
 * Deal A is a solid line with circles, Deal B a dashed line with squares: never colour alone. */
import { toNumber } from "../projects/studio/exact.mjs";
import { fmtCents, fmtExact, purchase, ruleLabel, unitPrice } from "./deal-lab-core.mjs";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const STYLE = {
  A: { stroke: "#12666c", dash: "", mark: "circle" },
  B: { stroke: "#805900", dash: "7 5", mark: "square" },
};
const cents = (x) => fmtExact(x).text; // exact cents fraction -> "$0.45" or "about $0.42"
const many = (noun, n) => (Number(n) === 1 ? noun.one : noun.many);

function marker(L, x, y, r = 6) {
  const s = STYLE[L];
  return s.mark === "circle"
    ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${s.stroke}" stroke-width="3"/>`
    : `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" fill="#fff" stroke="${s.stroke}" stroke-width="3"/>`;
}

/** The shelf: one package per deal, its items drawn as a grid, and a BEST BUY ribbon in words. */
export function shelfSVG(deals, noun, best) {
  const pack = (L, x0) => {
    const d = deals[L];
    const shown = Math.min(d.qty, 40);
    const cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(shown))));
    const rows = Math.ceil(shown / cols);
    const cell = Math.min(22, 120 / Math.max(rows, 1));
    const w = cols * cell + 16;
    const h = rows * cell + 16;
    const bx = x0 + (190 - w) / 2;
    const by = 150 - h;
    let dots = "";
    for (let i = 0; i < shown; i++) {
      const cx = bx + 8 + (i % cols) * cell + cell / 2;
      const cy = by + 8 + Math.floor(i / cols) * cell + cell / 2;
      dots += `<rect x="${cx - cell * 0.36}" y="${cy - cell * 0.36}" width="${cell * 0.72}" height="${cell * 0.72}" rx="3" fill="${STYLE[L].stroke}" opacity=".78"/>`;
    }
    const more = d.qty > shown ? `<text x="${x0 + 95}" y="${by - 8}" text-anchor="middle" class="dl-svg-note">${shown} of ${d.qty} shown</text>` : "";
    const ribbon =
      best === L
        ? `<g><rect x="${x0 + 40}" y="2" width="110" height="26" rx="6" fill="#18324a"/><text x="${x0 + 95}" y="20" text-anchor="middle" class="dl-svg-strong" style="fill:#fff">BEST BUY</text></g>`
        : "";
    return `<g><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${STYLE[L].stroke}" stroke-width="3" stroke-dasharray="${STYLE[L].dash}"/>${dots}${more}
      <text x="${x0 + 95}" y="176" text-anchor="middle" class="dl-svg-strong">Deal ${L}</text>${ribbon}</g>`;
  };
  const tie = best === "tie" ? `<text x="210" y="20" text-anchor="middle" class="dl-svg-strong">Same unit price: neither is the better buy</text>` : "";
  const label = `Shelf. Deal A: ${deals.A.qty} ${many(noun, deals.A.qty)} for ${fmtCents(deals.A.cents)}. Deal B: ${deals.B.qty} ${many(noun, deals.B.qty)} for ${fmtCents(deals.B.cents)}. ${best === "tie" ? "Same unit price." : `Best buy: Deal ${best}.`}`;
  return `<svg class="dl-shelf" viewBox="0 0 420 186" role="img" aria-label="${esc(label)}">
    <rect x="0" y="150" width="420" height="10" rx="3" fill="#b9ccd2"/>${pack("A", 10)}${pack("B", 220)}${tie}</svg>`;
}

/** Ratio table rows: 1 item, then 1, 2, 3 purchases. Same numbers as every other view. */
export function ratioRows(deal) {
  const p = purchase(deal);
  const u = unitPrice(deal);
  const rows = [{ items: 1n, cost: u, label: "1 item" }];
  for (let k = 1n; k <= 3n; k++) {
    const packs = BigInt(p.packs) * k;
    rows.push({ items: p.qty * k, cost: { n: p.cost.n * k, d: p.cost.d }, label: `${packs} pack${packs === 1n ? "" : "s"}` });
  }
  return rows;
}
export function ratioTableHTML(L, deal, noun) {
  const rows = ratioRows(deal)
    .map((r, i) => `<tr${i === 0 ? ' class="dl-unit-row"' : ""}><th scope="row">${r.label}</th><td>${r.items} ${many(noun, r.items)}</td><td>${cents(r.cost)}</td></tr>`)
    .join("");
  const rule = deal.rule !== "none" ? ` <span class="dl-rule-chip">${esc(ruleLabel(deal.rule))}</span>` : "";
  return `<table class="dl-table"><caption>Deal ${L} ratio table${rule}</caption>
    <thead><tr><th scope="col">Buy</th><th scope="col">${esc(noun.many[0].toUpperCase() + noun.many.slice(1))}</th><th scope="col">Cost</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** Double number line: cost on top, items below, the same tick for the same purchase. */
export function numberLineSVG(L, deal, noun) {
  const p = purchase(deal);
  const max = Number(p.qty) * 2;
  const X = (v) => 34 + (270 * v) / max;
  const ticks = [
    { items: 0, cost: "$0", below: "0" },
    { items: 1, cost: cents(unitPrice(deal)), below: "1" },
    { items: Number(p.qty), cost: cents(p.cost), below: String(p.qty) },
    { items: max, cost: cents({ n: p.cost.n * 2n, d: p.cost.d }), below: String(max) },
  ];
  const crowd = X(1) - X(0) < 60;
  const marks = ticks
    .map((t, i) => {
      const x = X(t.items);
      const lift = crowd && i === 1 ? 20 : 0;
      const anchor = i === 0 ? "end" : i === 1 && crowd ? "start" : i === 3 ? "end" : "middle";
      const dx = i === 0 ? -4 : i === 3 ? 6 : 0;
      return `<line x1="${x}" y1="38" x2="${x}" y2="52" stroke="#18324a" stroke-width="2"/><line x1="${x}" y1="82" x2="${x}" y2="96" stroke="#18324a" stroke-width="2"/>
        <text x="${x + dx}" y="${30 - lift}" text-anchor="${anchor}" class="dl-svg-text">${esc(t.cost)}</text>
        <text x="${x + dx}" y="${116 + lift}" text-anchor="${anchor}" class="dl-svg-text">${esc(t.below)}</text>
        ${i > 0 ? `<line x1="${x}" y1="52" x2="${x}" y2="82" stroke="${STYLE[L].stroke}" stroke-width="1.5" stroke-dasharray="3 3"/>` : ""}`;
    })
    .join("");
  const label = `Deal ${L} double number line. 1 ${noun.one} costs ${cents(unitPrice(deal))}. ${p.qty} ${noun.many} cost ${cents(p.cost)}.`;
  return `<svg class="dl-nline" viewBox="0 0 320 ${crowd ? 146 : 126}" role="img" aria-label="${esc(label)}">
    <text x="316" y="${crowd ? 140 : 124}" text-anchor="end" class="dl-svg-note">top line: cost · bottom line: ${esc(noun.many)}</text>
    <line x1="34" y1="45" x2="304" y2="45" stroke="#18324a" stroke-width="2.5"/><line x1="34" y1="89" x2="304" y2="89" stroke="#18324a" stroke-width="2.5"/>
${marks}</svg>`;
}

function niceStep(max, whole = false, target = 5) {
  const raw = max / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const s = (whole ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]).map((m) => m * p).find((x) => x >= raw) || p * 10;
  return whole ? Math.max(1, Math.round(s)) : s;
}
/** Cost vs quantity. Steeper line = higher unit price. Each deal's first-purchase point is a handle. */
export function graphModel(deals) {
  const pA = purchase(deals.A);
  const pB = purchase(deals.B);
  const xMax = Math.max(Number(pA.qty), Number(pB.qty)) * 2;
  const yTop = Math.max(toNumber(unitPrice(deals.A)), toNumber(unitPrice(deals.B))) * xMax;
  const yStep = niceStep(yTop);
  const yMax = Math.ceil(yTop / yStep) * yStep || 100;
  const box = { x0: 66, x1: 404, y0: 18, y1: 262 };
  const X = (v) => box.x0 + ((box.x1 - box.x0) * v) / xMax;
  const Y = (c) => box.y1 - ((box.y1 - box.y0) * c) / yMax;
  return { xMax, yMax, yStep, xStep: niceStep(xMax, true), box, X, Y, p: { A: pA, B: pB } };
}
export function graphSVG(deals, noun) {
  const g = graphModel(deals);
  const { box, X, Y } = g;
  let grid = "";
  for (let v = 0; v <= g.xMax + 1e-9; v += g.xStep)
    grid += `<line x1="${X(v)}" y1="${box.y0}" x2="${X(v)}" y2="${box.y1}" stroke="#e3ecef"/><text x="${X(v)}" y="${box.y1 + 20}" text-anchor="middle" class="dl-svg-text">${Math.round(v * 100) / 100}</text>`;
  for (let c = 0; c <= g.yMax + 1e-9; c += g.yStep)
    grid += `<line x1="${box.x0}" y1="${Y(c)}" x2="${box.x1}" y2="${Y(c)}" stroke="#e3ecef"/><text x="${box.x0 - 6}" y="${Y(c) + 5}" text-anchor="end" class="dl-svg-text">${Math.round(c) % 100 === 0 ? `$${Math.round(c) / 100}` : fmtCents(Math.round(c))}</text>`;
  const lines = ["A", "B"]
    .map((L) => {
      const u = toNumber(unitPrice(deals[L]));
      const p = g.p[L];
      let pts = "";
      for (let k = 2; Number(p.qty) * k <= g.xMax; k++) pts += marker(L, X(Number(p.qty) * k), Y(toNumber(p.cost) * k), 5);
      const hx = X(Number(p.qty));
      const hy = Y(toNumber(p.cost));
      const ex = X(g.xMax);
      const ey = Y(u * g.xMax);
      const lblY = Math.max(box.y0 + 12, ey + (L === "A" ? -8 : 18));
      return `<line x1="${X(0)}" y1="${Y(0)}" x2="${ex}" y2="${ey}" stroke="${STYLE[L].stroke}" stroke-width="3" stroke-dasharray="${STYLE[L].dash}"/>${pts}
        <text x="${ex - 4}" y="${lblY}" text-anchor="end" class="dl-svg-strong" fill="${STYLE[L].stroke}">${L}</text>
        <g class="dl-handle" data-deal="${L}" tabindex="0" role="slider" aria-valuetext="Deal ${L}: ${p.qty} ${esc(noun.many)} for ${esc(cents(p.cost))}" aria-label="Deal ${L} point. Left and right arrows change the size, up and down arrows change the price.">
          <circle cx="${hx}" cy="${hy}" r="22" fill="transparent"/>${marker(L, hx, hy, 9)}</g>`;
    })
    .join("");
  const label = `Graph of cost against ${noun.many}. Deal A: ${cents(unitPrice(deals.A))} per ${noun.one}. Deal B: ${cents(unitPrice(deals.B))} per ${noun.one}. The steeper line has the higher unit price.`;
  return `<svg class="dl-graph" viewBox="0 0 420 300" role="group" aria-label="${esc(label)}">
    ${grid}<line x1="${box.x0}" y1="${box.y1}" x2="${box.x1}" y2="${box.y1}" stroke="#18324a" stroke-width="2"/><line x1="${box.x0}" y1="${box.y0}" x2="${box.x0}" y2="${box.y1}" stroke="#18324a" stroke-width="2"/>
    <text x="${(box.x0 + box.x1) / 2}" y="298" text-anchor="middle" class="dl-svg-note">${esc(noun.many)}</text>${lines}</svg>`;
}
