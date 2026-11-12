/**
 * Live linked models for equations, relationships, discovery and synthesis. Pure: (project, values, ctx) -> HTML.
 * Same rules as models.mjs: given quantities always show; a computed value is "?" until its check matches.
 */
import { countTwoWays, fractionCheck, roleCheck, ROLES, substitution, tableCheck } from "./builders.mjs";
import { unitCheckHTML } from "./models-space.mjs";
import { BLUE, bInput, bSelect, esc, f2, figure, INK, LIME, line, MINT, MUTED, ORANGE, PEACH, rect, circle, svg, TEAL, text, unknown, usd, verdictHTML } from "./models-kit.mjs";

/* ------------------------------------------------------------- equations */
function tiles(n, x, y, size, fill, stroke) {
  let out = "";
  for (let k = 0; k < n; k++) out += rect(x + (k % 10) * (size + 2), y + Math.floor(k / 10) * (size + 2), size, size, fill, stroke);
  return out;
}
export function equationsModels(project, v, ctx) {
  const { a, b, c } = v;
  const solved = ctx.reveal("addition"), solved2 = ctx.reveal("multiplication");
  // Lock 1: x plus b unit tiles balances a + b
  let one = text(10, 18, `x + ${f2(b)} = ${f2(a + b)}`, { bold: true, size: 14 });
  one += rect(10, 30, 90, 30, solved ? LIME : "#fff", TEAL, solved ? "" : 'stroke-dasharray="5 3"') + text(55, 50, solved ? `x = ${f2(a)}` : "x = ?", { anchor: "middle", bold: true });
  one += tiles(b, 108, 30, 13, PEACH, ORANGE);
  one += line(10, 76, 350, 76, MUTED, 'stroke-width="1" stroke-dasharray="3 3"');
  one += rect(10, 86, 330, 28, MINT, TEAL) + text(175, 105, `${f2(a + b)} in all`, { anchor: "middle", bold: true });
  one += text(10, 134, "Take the same amount from both sides to keep them equal.", { size: 11, fill: MUTED });
  const lockOne = svg(`Balance model for x plus ${f2(b)} equals ${f2(a + b)}. The top row is the unknown x and ${f2(b)} unit tiles; the bottom bar is ${f2(a + b)} in all.${solved ? ` x is ${f2(a)}.` : ""}`, 144, one);
  // Lock 2: c equal blocks of x make c*a
  const bw = Math.min(42, 300 / c);
  let two = text(10, 18, `${f2(c)}x = ${f2(c * a)}`, { bold: true, size: 14 });
  for (let k = 0; k < c; k++) two += rect(10 + k * bw, 30, bw - 2, 30, solved2 ? LIME : "#fff", TEAL, solved2 ? "" : 'stroke-dasharray="5 3"') + (bw > 20 ? text(10 + k * bw + bw / 2 - 1, 50, solved2 ? f2(a) : "x", { anchor: "middle", bold: true, size: 12 }) : "");
  two += rect(10, 74, c * bw - 2, 28, MINT, TEAL) + text(10, 120, `${f2(c * a)} in all, shared into ${f2(c)} equal blocks`, { bold: true, size: 12 });
  const lockTwo = svg(`Bar model for ${f2(c)} times x equals ${f2(c * a)}: ${f2(c)} equal blocks that each hold x.${solved2 ? ` Each block is ${f2(a)}.` : ""}`, 130, two);
  // Gates on a number line around the boundary
  const lo = Math.max(0, a - 5), hi = a + 5, nx = (n) => 30 + ((n - lo) / (hi - lo)) * 300;
  let gate = "";
  for (const [row, closed, label] of [[40, true, `n ≥ ${f2(a)}`], [110, false, `n > ${f2(a)}`]]) {
    gate += text(10, row - 14, label, { bold: true }) + line(30, row, 335, row, INK) + line(335, row, 327, row - 5, INK) + line(335, row, 327, row + 5, INK);
    gate += line(nx(a), row, 335, row, TEAL, 'stroke-width="5"') + circle(nx(a), row, 7, closed ? TEAL : "#fff", TEAL);
    for (let n = Math.ceil(lo); n <= hi; n++) gate += line(nx(n), row + 4, nx(n), row + 10, INK, 'stroke-width="1"') + text(nx(n), row + 22, f2(n), { anchor: "middle", size: 10, fill: MUTED });
    gate += text(335, row - 12, closed ? "boundary included" : "boundary excluded", { anchor: "end", size: 11, fill: closed ? TEAL : ORANGE, bold: true });
  }
  if (ctx.reveal("boundary")) gate += text(nx(a), 74, `smallest whole number: ${f2(a)}`, { anchor: "middle", size: 11, fill: TEAL, bold: true });
  if (ctx.reveal("strict")) gate += text(nx(a + 1), 144, `smallest whole number: ${f2(a + 1)}`, { anchor: "middle", size: 11, fill: TEAL, bold: true });
  const gates = svg(`Two number lines. n at least ${f2(a)} has a closed circle at ${f2(a)} and shades to the right. n greater than ${f2(a)} has an open circle at ${f2(a)} and shades to the right.`, 158, gate);
  const t = substitution(v, ctx.builder || {}, { substitution: ctx.reveal("substitution"), difference: ctx.reveal("difference") });
  const rows = t.rows.map((r) => `<tr><th scope="row">${esc(r.label)}: ${esc(r.eq)}</th><td>${r.ok ? "Works" : "Does not work"}</td><td>${esc(r.text)}</td></tr>`).join("");
  const tester = `<div class="wb-controls"><div class="wb-builder wb-stack">${bInput("A", "Try a value for x (or n)", ctx.builder?.A ?? "")}</div>${t.rows.length ? `<div class="table-scroll" tabindex="0" role="region" aria-label="Your value in every clue"><table class="wb-table"><caption>Your value in every clue</caption><thead><tr><th scope="col">Clue</th><th scope="col">Result</th><th scope="col">Detail</th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}<div role="status"><p class="wb-verdict ${t.rows.length && t.rows[0].ok && t.rows[1].ok ? "good" : ""}">${esc(t.summary)}</p></div></div>`;
  return [
    figure("First lock: balance", lockOne, "Whatever you do to one side, do to the other. The unknown stays hidden until your check matches."),
    figure("Second lock: equal blocks", lockTwo, "Dividing by the multiplier splits the total into equal blocks."),
    figure("Gates on a number line", gates, "A closed circle includes the boundary; an open circle does not."),
    figure("Try a value: exact substitution", tester, "The Studio substitutes with exact fractions. Numbers on the left side appear after you check the matching question.", true),
  ].join("");
}

/* --------------------------------------------------------- relationships */
export function graphGeometry(v) {
  const X = Math.max(v.c, 6), Y = Math.max(v.a * X + v.b, 1);
  const top = 32, left = 44, w = 296, h = 180;
  return { X, Y, top, left, w, h, sx: w / X, sy: h / Y };
}
/** Whole-number grid point nearest a pixel in the graph's drawing units. */
export function graphPoint(v, vx, vy) {
  const g = graphGeometry(v);
  return { x: Math.max(0, Math.round((vx - g.left) / g.sx)), y: Math.round((g.top + g.h - vy) / g.sy) };
}
function graphSvg(project, v, ctx, mine) {
  const { a, b, c } = v;
  const g = graphGeometry(v), gx = (x) => g.left + x * g.sx, gy = (y) => g.top + g.h - y * g.sy;
  let body = "";
  const stepX = g.X > 12 ? 4 : g.X > 8 ? 2 : 1, stepY = (() => { const raw = g.Y / 5, p = 10 ** Math.floor(Math.log10(raw)); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; })();
  for (let x = 0; x <= g.X; x += stepX) body += line(gx(x), g.top, gx(x), g.top + g.h, "#d5dfda", 'stroke-width="1"') + text(gx(x), g.top + g.h + 14, f2(x), { anchor: "middle", size: 10, fill: MUTED });
  for (let y = 0; y <= g.Y; y += stepY) body += line(g.left, gy(y), g.left + g.w, gy(y), "#d5dfda", 'stroke-width="1"') + (y ? text(g.left - 5, gy(y) + 4, f2(y), { anchor: "end", size: 10, fill: MUTED }) : "");
  body += line(g.left, g.top + g.h, g.left + g.w, g.top + g.h, INK) + line(g.left, g.top, g.left, g.top + g.h, INK);
  const roles = ROLES[project.id];
  body += text(g.left + g.w, g.top + g.h + 28, `x: ${roles.x}`, { anchor: "end", size: 11, bold: true }) + text(g.left - 36, 12, `y: ${roles.y}`, { size: 11, bold: true });
  body += line(gx(0), gy(b), gx(g.X), gy(a * g.X + b), TEAL, 'stroke-width="3"');
  if (project.id === "unit-9-b") {
    const ra = Math.max(1, a - 4), rb = b + 8, top = ra * g.X + rb;
    body += line(gx(0), gy(rb), gx(g.X), gy(Math.min(top, g.Y)), ORANGE, 'stroke-width="2" stroke-dasharray="6 4"');
  }
  for (const [x, id] of [[0, "zero"], [1, "one"], [2, "two"], [c, "target"]]) {
    const y = a * x + b;
    body += circle(gx(x), gy(y), 5, ctx.reveal(id) ? TEAL : "#fff", TEAL);
    if (ctx.reveal(id)) body += text(gx(x) + (gx(x) > 250 ? -6 : 6), gy(y) - 8, `(${f2(x)}, ${f2(y)})`, { size: 10, bold: true, fill: INK, anchor: gx(x) > 250 ? "end" : "start" });
  }
  for (const [x, y] of mine) body += `<rect x="${gx(x) - 5}" y="${gy(y) - 5}" width="10" height="10" fill="${ORANGE}" stroke="${INK}" stroke-width="1.5" transform="rotate(45 ${gx(x)} ${gy(y)})"/>`;
  return `<svg class="wb-svg" viewBox="0 0 360 ${g.top + g.h + 36}" aria-hidden="true" focusable="false"><rect width="360" height="${g.top + g.h + 36}" fill="#fff"/>${body}</svg>`;
}
export function relationshipsModels(project, v, ctx) {
  const { a, b, c } = v;
  const roles = ROLES[project.id];
  const R = (id, value) => (ctx.reveal(id) ? f2(value) : unknown);
  const bd = ctx.builder || {};
  const tableResult = tableCheck(v, bd);
  const mine = tableResult.complete ? [3, 4, 5].map((x, i) => [x, Number(["A", "B", "C"].map((k) => bd[k])[i])]).filter(([, y]) => Number.isFinite(y)) : [];
  const equation = `<p class="wb-expanded">Rule: <strong>y = ${f2(a)}x + ${f2(b)}</strong></p><p class="wb-caption">x is ${esc(roles.x)}. y is ${esc(roles.y)}. The start ${f2(b)} is y when x is 0; the rate ${f2(a)} is how much y grows when x grows by 1.</p>`;
  const rows = [[0, "zero"], [1, "one"], [2, "two"], [c, "target"]].filter(([x], i, all) => all.findIndex(([y]) => y === x) === i);
  const table = `<div class="table-scroll" tabindex="0" role="region" aria-label="Table of the same rule"><table class="wb-table"><caption>Table of the same rule</caption><thead><tr><th scope="col">x (${esc(roles.x)})</th><th scope="col">y (${esc(roles.y)})</th></tr></thead><tbody>${rows.map(([x, id]) => `<tr><th scope="row">${f2(x)}</th><td>${R(id, a * x + b)}</td></tr>`).join("")}</tbody></table></div>`;
  const keyHelp = `Arrow up and down change the starting amount; left and right change the rate. Click or tap a grid point to bend the line through it (at x = 0 that sets the start).`;
  const graph = `<div class="wb-slider wb-graph" id="wb-graph" role="application" tabindex="0" data-wb-graph aria-label="Graph of y equals ${f2(a)}x plus ${f2(b)}. Starts at ${f2(b)} and rises ${f2(a)} for each 1 across. ${keyHelp}" aria-describedby="wb-graph-help">${graphSvg(project, v, ctx, mine)}</div><p id="wb-graph-help" class="wb-caption">${keyHelp} The steppers above do the same job.${project.id === "unit-9-b" ? " The dashed line is a comparison plan: a higher fixed fee and a lower rate, the change the mission asks you to test." : ""}</p>`;
  const fill = `<div class="wb-controls"><p>Fill three more rows of the table from the rule. Orange diamonds appear on the graph.</p><div class="wb-builder wb-stack">${["A", "B", "C"].map((k, i) => bInput(k, `y when x = ${i + 3}`, bd[k] ?? "")).join("")}</div>${verdictHTML(tableResult)}</div>`;
  const rr = roleCheck(project, bd);
  const names = [["x", roles.x], ["y", roles.y]];
  const variables = `<div class="wb-controls"><div class="wb-builder wb-stack">${bSelect("D", "The independent variable (you choose it) is", bd.D ?? "", names)}${bSelect("E", "The dependent variable (the rule calculates it) is", bd.E ?? "", names)}</div>${verdictHTML(rr)}</div>`;
  return [
    figure("Equation, table and graph", equation + table, "All three views come from the same two numbers. Change either and every view changes."),
    figure("Graph", graph, "Open circles are values you have not checked yet; they fill when your answer matches."),
    figure("Check that your table follows the rule", fill, "A constant-rate table changes by the same amount at every step."),
    figure("Name the variables", variables, "Name which quantity is chosen and which one depends on it."),
  ].join("");
}

/* ------------------------------------------------------------- discovery */
function stagePicture(n, a, b, t, x0, y0) {
  let body = "";
  for (let k = 0; k < n; k++) for (let r = 0; r < a; r++) body += rect(x0 + k * (t + 1), y0 - (r + 1) * (t + 1), t, t, MINT, TEAL);
  for (let r = 0; r < b; r++) body += rect(x0 + n * (t + 1) + 3, y0 - (r + 1) * (t + 1), t, t, PEACH, ORANGE);
  return body;
}
export function discoveryModels(project, v, ctx) {
  const { a, b, c } = v;
  const R = (id, value) => (ctx.reveal(id) ? f2(value) : "?");
  const t = Math.min(18, 285 / 14 - 1), tall = Math.max(a, b);
  let x = 10, stages = "";
  const base = 28 + tall * (t + 1);
  [1, 2, 3, 4].forEach((n) => {
    stages += stagePicture(n, a, b, t, x, base);
    const id = ["one", "two", "three"][n - 1];
    stages += text(x, base + 16, `Stage ${n}`, { size: 11, bold: true }) + text(x, base + 30, id ? `${R(id, n * a + b)} tiles` : "count it below", { size: 11, fill: id ? TEAL : MUTED, bold: true });
    x += (n + 1) * (t + 1) + 12;
  });
  stages += text(10, 14, `Groups of ${f2(a)} (teal) + ${f2(b)} extras (orange)`, { size: 12, bold: true });
  const stagesSvg = svg(`The first four stages. Stage n has n groups of ${f2(a)} teal tiles and ${f2(b)} orange extra tiles that appear once.`, base + 38, stages);
  const t2 = Math.min(12, 330 / (c + b + 2), 150 / a);
  let read = text(10, 14, "Your drawing", { bold: true, size: 12 }) + stagePicture(c, a, b, t2, 10, 32 + a * (t2 + 1));
  const y2 = 32 + a * (t2 + 1) + 50;
  read += text(10, y2 - 14, `Visitor's reading: ${f2(a)} groups of (${f2(c)} + ${f2(b)})`, { bold: true, size: 12 });
  for (let r = 0; r < a; r++) for (let k = 0; k < c + b; k++) read += rect(10 + k * (t2 + 1), y2 + r * (t2 + 1), t2, t2, k < c ? MINT : PEACH, k < c ? TEAL : ORANGE);
  read += text(10, y2 + a * (t2 + 1) + 16, `Drawing: ${R("target", c * a + b)} tiles. Visitor's count: ${R("repair", a * (c + b))} tiles.`, { size: 12, bold: true, fill: TEAL });
  const readSvg = svg(`Stage ${f2(c)} drawn two ways. Your drawing has ${f2(c)} groups of ${f2(a)} plus ${f2(b)} extras once. The visitor's reading has ${f2(a)} rows of ${f2(c)} plus ${f2(b)}, so the extras are counted ${f2(a)} times.`, y2 + a * (t2 + 1) + 28, read);
  const bd = ctx.builder || {};
  const r = countTwoWays(v, bd);
  const ways = `<div class="wb-controls"><ol class="wb-ways"><li>Way 1: count the groups, then add the extras. Stage n has n groups of ${f2(a)}, plus ${f2(b)}.</li><li>Way 2: start with stage 1 (${f2(a)} + ${f2(b)} tiles) and add ${f2(a)} for each new stage.</li></ol><div class="wb-builder wb-stack">${bInput("A", "Stage to count (1 to 12)", bd.A ?? "")}${bInput("B", "Count by way 1", bd.B ?? "")}${bInput("C", "Count by way 2", bd.C ?? "")}</div>${verdictHTML(r)}</div>`;
  return [
    figure("The first four stages", stagesSvg, "Counts appear as your checks match. Stage 4 is yours to count."),
    figure(`Stage ${f2(c)}: two readings of the rule`, readSvg, "The orange extras appear once in the drawing but a times in the visitor's reading."),
    figure("Two ways of counting one stage", ways, "Two correct ways must give the same number for the same stage."),
  ].join("");
}

/* ------------------------------------------------------------- synthesis */
export function synthesisModels(project, v, ctx) {
  const { a, b, c, d, e, f } = v;
  const area = a * b, subtotal = area * c, discount = (subtotal * d) / 100, materials = subtotal - discount;
  const R = (id, value, fmt = f2) => (ctx.reveal(id) ? fmt(value) : unknown);
  const u = Math.min(300 / a, 120 / b);
  let plan = text(10, 16, `Floor plan: ${f2(a)} m by ${f2(b)} m`, { bold: true });
  plan += rect(10, 26, a * u, b * u, LIME);
  for (let k = 1; k < a; k++) plan += line(10 + k * u, 26, 10 + k * u, 26 + b * u, "#8aa398", 'stroke-width="0.7"');
  for (let k = 1; k < b; k++) plan += line(10, 26 + k * u, 10 + a * u, 26 + k * u, "#8aa398", 'stroke-width="0.7"');
  plan += text(10, 26 + b * u + 18, `Area: ${ctx.reveal("area") ? `${f2(area)} m²` : "? m²"}`, { bold: true, fill: TEAL });
  const planSvg = svg(`Floor plan ${f2(a)} meters by ${f2(b)} meters with a one-meter grid. Area ${ctx.reveal("area") ? `${f2(area)} square meters` : "not checked yet"}.`, 26 + b * u + 28, plan);
  const cut = (300 * d) / 100;
  let bar = text(10, 16, `Material cost before discount: ${ctx.reveal("subtotal") ? usd(subtotal) : "$?"} = 100%`, { bold: true, size: 12 });
  bar += rect(10, 26, cut, 34, PEACH, ORANGE) + rect(10 + cut, 26, 300 - cut, 34, LIME) + text(10 + cut / 2, 48, `${f2(d)}%`, { anchor: "middle", bold: true, size: cut > 30 ? 12 : 10 }) + text(10 + cut + (300 - cut) / 2, 48, `${f2(100 - d)}%`, { anchor: "middle", bold: true });
  bar += text(10, 82, `Discount: ${ctx.reveal("discount") ? usd(Math.round(discount * 100) / 100) : "$?"}`, { fill: ORANGE, bold: true }) + text(310, 82, `Discounted materials: ${ctx.reveal("materials") ? usd(Math.round(materials * 100) / 100) : "$?"}`, { anchor: "end", fill: TEAL, bold: true, size: 12 });
  const barSvg = svg(`Percent bar. The material cost is the whole bar; ${f2(d)} percent is the discount and ${f2(100 - d)} percent remains.`, 96, bar);
  const X = f + 10, Y = materials + e * X, top = 14, left = 44, w = 296, h = 150, sx = w / X, sy = h / Y;
  let g = "";
  g += line(left, top + h, left + w, top + h, INK) + line(left, top, left, top + h, INK) + line(left, top + h - materials * sy, left + w, top + h - Y * sy, TEAL, 'stroke-width="3"');
  g += text(left + w, top + h + 16, "visitors", { anchor: "end", size: 11, bold: true }) + text(left, top - 2, "total cost ($)", { size: 11, bold: true });
  for (const [x, ok] of [[0, ctx.reveal("materials")], [f, ctx.reveal("total")], [X, ctx.reveal("extra") && ctx.reveal("total")]]) g += circle(left + x * sx, top + h - (materials + e * x) * sy, 5, ok ? TEAL : "#fff", TEAL) + text(left + x * sx, top + h + 28 - (x === 0 ? 12 : 0), `${f2(x)}`, { anchor: x === 0 ? "start" : "middle", size: 10, fill: MUTED });
  const graphSvg = svg(`Graph of total cost against visitors for y equals ${ctx.reveal("materials") ? usd(materials) : "the discounted materials"} plus ${usd(e)} times visitors, from 0 to ${X} visitors.`, top + h + 36, g);
  const table = `<div class="table-scroll" tabindex="0" role="region" aria-label="Attendance table"><table class="wb-table"><caption>Attendance table</caption><thead><tr><th scope="col">Visitors</th><th scope="col">Total cost</th></tr></thead><tbody><tr><th scope="row">0</th><td>${R("materials", materials, usd)}</td></tr><tr><th scope="row">${f2(f)}</th><td>${R("total", materials + e * f, usd)}</td></tr><tr><th scope="row">${f2(f + 10)}</th><td>${ctx.reveal("total") && ctx.reveal("extra") ? usd(materials + e * f + 10 * e) : unknown}</td></tr></tbody></table></div><p class="wb-caption">Rule: total = fixed materials + ${usd(e)} × visitors.</p>`;
  const bd = ctx.builder || {};
  const fr = fractionCheck(v, bd);
  const fraction = `<div class="wb-controls"><p>Write the discount as a fraction of the material subtotal.</p><div class="wb-builder wb-stack">${bInput("A", "Numerator", bd.A ?? "")}${bInput("B", "Denominator", bd.B ?? "")}</div>${verdictHTML(fr)}</div>`;
  const strands = `<ul class="wb-strands"><li><strong>Area</strong> (Unit 5): the floor plan sets the material cost.</li><li><strong>Percents</strong> (Unit 4): the discount is a part of that cost.</li><li><strong>Two-variable relationships</strong> (Unit 9): visitors change the total in a straight line.</li></ul>`;
  return [
    figure("Strands this plan connects", strands, "Each view below reuses mathematics from an earlier unit."),
    figure("Floor plan (area)", planSvg, "Label the area in square meters."),
    figure("Discount (percent)", barSvg, "The discount is a fraction of the material subtotal, not of the visitor supplies."),
    figure("Visitors and cost (relationship)", graphSvg + table, "Fixed cost plus a rate per visitor. Change a visitor count and the graph and table move together."),
    figure("The discount as a fraction", fraction, "Equal fractions describe the same discount."),
    figure("Unit check", unitCheckHTML("synthesis", ctx, {}, "Choose the unit each label needs."), "Square meters for the plan, dollars for the cost."),
  ].join("");
}
