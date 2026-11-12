/**
 * Live linked models for area, solids and coordinates. Pure: (project, values, ctx) -> HTML.
 * Same rules as models.mjs: given quantities always show; a computed value is "?" until its check matches.
 */
import { netCheck, plotIntent, quad, unitCheck, UNIT_CHOICES } from "./builders.mjs";
import { bInput, bSelect, circle, esc, f2, figure, INK, LIME, line, MINT, MUTED, netBody, obliqueBox, ORANGE, PEACH, poly, rect, sg, svg, TEAL, text, unknown, usd, verdictHTML, BLUE } from "./models-kit.mjs";

const unitOptions = UNIT_CHOICES;
const sq = (n) => `${f2(n)} m²`;

/* ----------------------------------------------------------------- area */
export function unitCheckHTML(kind, ctx, shownValue, intro) {
  const picks = ctx.builder || {};
  const r = unitCheck(kind, picks, shownValue);
  const rows = r.rows.map((row) => `<div class="wb-unit-row">${bSelect(row.key, row.label, picks[row.key] ?? "", unitOptions)}</div>`).join("");
  const lines = r.rows.filter((x) => x.status === "bad").map((x) => x.text);
  const verdict = r.empty === r.rows.length ? ["Choose a unit for each quantity to test your labels."] : lines.length ? lines : r.complete ? ["Every unit fits its quantity: lengths in meters, flat areas in square meters, space inside in cubic meters, and money in dollars."] : ["Keep going: choose a unit for every quantity."];
  return `<div class="wb-controls"><p>${esc(intro)}</p><div class="wb-builder wb-stack">${rows}</div>${verdictHTML({ lines: verdict, ok: r.ok })}</div>`;
}
export function areaModels(project, v, ctx) {
  const { a, b, c, d, e, f, g, h } = v;
  const R = (id, value, fmt = f2) => (ctx.reveal(id) ? fmt(value) : unknown);
  const T = (id, value, fmt = f2) => (ctx.reveal(id) ? fmt(value) : "?");
  const u = Math.min(300 / (a + c + 1.5), 150 / Math.max(b, d, 1)), x0 = 20, gap = 1.2 * u, base = 30 + Math.max(b, d) * u;
  let plan = "";
  plan += rect(x0, base - b * u, a * u, b * u, LIME);
  for (let k = 1; k < a; k++) plan += line(x0 + k * u, base - b * u, x0 + k * u, base, "#8aa398", 'stroke-width="0.7"');
  for (let k = 1; k < b; k++) plan += line(x0, base - k * u, x0 + a * u, base - k * u, "#8aa398", 'stroke-width="0.7"');
  const tx = x0 + a * u + gap;
  plan += rect(tx, base - d * u, c * u, d * u, "#fff", "#aab8b1", 'stroke-dasharray="4 3"');
  plan += poly([[tx, base], [tx + c * u, base], [tx, base - d * u]], PEACH, ORANGE);
  const q = Math.min(10, u * 0.8, c * u, d * u);
  plan += `<path d="M ${f2(tx)} ${f2(base - q)} L ${f2(tx + q)} ${f2(base - q)} L ${f2(tx + q)} ${f2(base)}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
  plan += text(x0, base + 16, `Rectangle ${f2(a)} m long, ${f2(b)} m wide`, { size: 12, bold: true });
  plan += text(x0, base + 33, `Rectangle: ${T("rectangle", a * b, sq)}  ·  Triangle: ${T("triangle", (c * d) / 2, sq)}`, { size: 12, bold: true, fill: TEAL });
  plan += text(x0, base + 49, `Triangle base ${f2(c)} m, perpendicular height ${f2(d)} m`, { size: 11, fill: MUTED });
  plan += text(x0, 16, `Combined floor: ${T("composite", a * b + (c * d) / 2, sq)}`, { bold: true });
  const planSvg = svg(`Floor plan to scale: a rectangle ${f2(a)} meters by ${f2(b)} meters and a separate triangular nook with base ${f2(c)} meters and perpendicular height ${f2(d)} meters. The dashed rectangle shows the matching ${f2(c)} by ${f2(d)} rectangle; the triangle is half of it. The right-angle mark shows the perpendicular height.`, base + 58, plan);
  const area = a * b + (c * d) / 2;
  const estimate = `<div class="table-scroll" tabindex="0" role="region" aria-label="Material estimate for the flooring"><table class="wb-table"><caption>Material estimate for the flooring</caption><thead><tr><th scope="col">Quantity</th><th scope="col">Value</th></tr></thead><tbody><tr><th scope="row">Combined floor area</th><td>${R("composite", area, sq)}</td></tr><tr><th scope="row">Price per square meter</th><td>${usd(e)} per m²</td></tr><tr><th scope="row">Flooring estimate</th><td>${R("floor-cost", area * e, usd)}</td></tr></tbody></table></div>`;
  const labels = { len: `${f2(f)} m`, hgt: `${f2(h)} m`, wid: `${f2(g)} m` };
  const box = obliqueBox(f, g, h, false, { ...labels, center: ctx.reveal("volume") ? `${f2(f * g * h)} m³` : "? m³" });
  const sa = 2 * (f * g + f * h + g * h);
  const netDraw = netBody(f, g, h, false);
  return [
    figure("Floor plan", planSvg, "Drawn to one scale. Change a length with the controls above and the whole plan redraws."),
    figure("Material estimate", estimate, "This estimate leaves out labor and offcuts. Decide what allowance to add and explain it."),
    figure("Storage box", svg(`Storage box ${f2(f)} meters long, ${f2(g)} wide and ${f2(h)} high.`, box.height, box.body), "The box holds space in three directions, so its capacity is in cubic units."),
    figure("Storage-box net", svg(`Net of the closed storage box: six faces. Surface area ${ctx.reveal("surface") ? sq(sa) : "not checked yet"}.`, netDraw.height + 22, netDraw.body + text(180, netDraw.height + 14, `Six faces, total ${ctx.reveal("surface") ? sq(sa) : "? m²"}`, { anchor: "middle", bold: true, size: 12, fill: TEAL })), "Faces come in equal pairs. The net folds into the box."),
    figure("Unit check", unitCheckHTML("area", ctx, { perimeter: `${f2(2 * (a + b))}`, floor: ctx.reveal("composite") ? f2(area) : undefined, storage: ctx.reveal("volume") ? f2(f * g * h) : undefined, cost: ctx.reveal("floor-cost") ? f2(area * e) : undefined }, "Label each quantity with the kind of unit it uses. Area, perimeter and volume are different kinds of measurement."), "Mixing these up is the most common unit mistake in a floor plan."),
  ].join("");
}

/* --------------------------------------------------------------- solids */
export function netCheckHTML(v, open, ctx) {
  const b = ctx.builder || {};
  const r = netCheck(v, open, b);
  return `<div class="wb-controls"><p>Describe two faces of your net by the edges that touch the base. The front face folds onto one base edge; the side face folds onto the other.</p><div class="wb-builder wb-stack">${bInput("A", "Front face: edge glued to the base", b.A ?? "")}${bInput("B", "Front face: upright edge", b.B ?? "")}${bInput("C", "Side face: edge glued to the base", b.C ?? "")}${bInput("D", "Side face: upright edge", b.D ?? "")}</div>${verdictHTML(r)}</div>`;
}
export function solidsModels(project, v, ctx) {
  const { a, b, c, d, e } = v;
  const open = project.id === "unit-10-b";
  const vol = a * b * c, floor = a * b, sa = (open ? floor : 2 * floor) + 2 * a * c + 2 * b * c;
  const R = (id, value, fmt = f2) => (ctx.reveal(id) ? fmt(value) : unknown);
  const box = obliqueBox(a, b, c, open, { len: f2(a), hgt: f2(c), wid: f2(b), center: ctx.reveal("volume") ? `${f2(vol)} cubic units` : "? cubic units" });
  const netDraw = netBody(a, b, c, open);
  const top = Math.max(vol, e), bw = 250;
  let bars = text(20, 18, `Capacity: volume against the minimum of ${f2(e)}`, { bold: true, size: 12 });
  bars += rect(20, 28, ctx.reveal("volume") ? (vol / top) * bw : 6, 24, ctx.reveal("volume") ? (vol >= e ? MINT : PEACH) : "#fff", ctx.reveal("volume") ? TEAL : "#aab8b1", ctx.reveal("volume") ? "" : 'stroke-dasharray="4 3"');
  const mx = 20 + (e / top) * bw;
  bars += line(mx, 22, mx, 58, ORANGE, 'stroke-width="3"') + text(mx, 72, `minimum ${f2(e)}`, { anchor: mx < 70 ? "start" : "middle", size: 11, fill: ORANGE, bold: true });
  bars += text(20, 92, ctx.reveal("volume") ? `Volume ${f2(vol)}` : "Volume ?", { size: 12, bold: true, fill: TEAL });
  const summary = `<div class="table-scroll" tabindex="0" role="region" aria-label="Limits for this design"><table class="wb-table"><caption>Limits for this design</caption><thead><tr><th scope="col">Quantity</th><th scope="col">Value</th></tr></thead><tbody><tr><th scope="row">Volume (cubic units)</th><td>${R("volume", vol)}</td></tr><tr><th scope="row">Minimum capacity (cubic units)</th><td>${f2(e)}</td></tr><tr><th scope="row">Volume minus minimum</th><td>${R("capacity", vol - e)}</td></tr><tr><th scope="row">Material area (${open ? "five" : "six"} faces, square units)</th><td>${R("surface", sa)}</td></tr><tr><th scope="row">Material cost (${usd(d)} per square unit)</th><td>${R("cost", sa * d, usd)}</td></tr></tbody></table></div>`;
  return [
    figure("The box", svg(`Box ${f2(a)} long, ${f2(b)} wide, ${f2(c)} high${open ? ", open at the top" : ", closed"}. A clear oblique drawing, not to exact perspective.`, box.height, box.body), `${open ? "The dashed top marks the open side." : "A closed box has six faces."} The model ignores wall thickness.`),
    figure(open ? "Net: five faces" : "Net: six faces", svg(`Net of the ${open ? "open-top box: five faces" : "closed box: six faces"}. Faces fold along shared edges.`, netDraw.height, netDraw.body), "Every pair of touching edges has the same length, so this net folds into the box."),
    figure("Capacity against the limit", svg(`Bar for the volume against the minimum capacity ${f2(e)}.`, 104, bars) + summary, "A design can be calculated correctly and still miss its limit. Compare capacity and material area separately."),
    figure("Net edge check", netCheckHTML(v, open, ctx), "A net is valid only when the edges that fold together have the same length."),
  ].join("");
}

/* ----------------------------------------------------------- coordinates */
export const PLANE = { size: 360, unit: 16, center: 180, limit: 10 };
/** Nearest grid point to a pixel in the plane's own drawing units, clamped to the plane. */
export function planePoint(vx, vy) {
  const clamp = (n) => Math.max(-PLANE.limit, Math.min(PLANE.limit, n));
  return { x: clamp(Math.round((vx - PLANE.center) / PLANE.unit)), y: clamp(Math.round((PLANE.center - vy) / PLANE.unit)) };
}
const px = (x) => PLANE.center + x * PLANE.unit, py = (y) => PLANE.center - y * PLANE.unit;
function planeSvg(v, ctx) {
  const { a, b, c } = v;
  let body = "";
  for (let k = -10; k <= 10; k++) body += line(px(k), 20, px(k), 340, "#d5dfda", 'stroke-width="1"') + line(20, py(k), 340, py(k), "#d5dfda", 'stroke-width="1"');
  body += line(20, py(0), 340, py(0), INK, 'stroke-width="2"') + line(px(0), 20, px(0), 340, INK, 'stroke-width="2"');
  for (let k = -10; k <= 10; k++) if (k) body += text(px(k), py(0) + 13, sg(k), { anchor: "middle", size: 9, fill: MUTED }) + text(px(0) - 4, py(k) + 3, sg(k), { anchor: "end", size: 9, fill: MUTED });
  body += text(px(0) - 4, py(0) + 13, "0", { anchor: "end", size: 9, fill: MUTED });
  body += text(330, py(0) - 6, "x", { anchor: "end", bold: true }) + text(px(0) + 8, 30, "y", { bold: true });
  body += text(300, 46, "I", { size: 14, fill: "#aab8b1", bold: true }) + text(60, 46, "II", { size: 14, fill: "#aab8b1", bold: true }) + text(60, 330, "III", { size: 14, fill: "#aab8b1", bold: true }) + text(300, 330, "IV", { size: 14, fill: "#aab8b1", bold: true });
  body += line(px(a), py(b), px(c), py(b), ORANGE, 'stroke-width="4"');
  if (ctx.reveal("a-zero")) body += line(px(a), py(b), px(0), py(b), BLUE, 'stroke-dasharray="4 3" stroke-width="2"');
  if (ctx.reveal("reflect-x")) body += circle(px(-a), py(b), 5, "#fff", BLUE, 'stroke-dasharray="3 2"') + text(px(-a) + (-a > 4 ? -8 : 8), py(b) - 8, `A′ (${sg(-a)}, ${sg(b)})`, { size: 11, fill: BLUE, bold: true, anchor: -a > 4 ? "end" : "start" });
  if (ctx.reveal("reflect-y")) body += circle(px(a), py(-b), 5, "#fff", BLUE, 'stroke-dasharray="3 2"') + text(px(a) + (a > 4 ? -8 : 8), py(-b) + 16, `A″ (${sg(a)}, ${sg(-b)})`, { size: 11, fill: BLUE, bold: true, anchor: a > 4 ? "end" : "start" });
  if (ctx.reveal("opposite")) body += line(px(a), py(b), px(a), py(-b), BLUE, 'stroke-dasharray="4 3" stroke-width="2"');
  body += circle(px(a), py(b), 6, TEAL, INK) + circle(px(c), py(b), 6, ORANGE, INK);
  const flip = a > 5 ? "end" : "start";
  body += text(px(a) + (flip === "end" ? -9 : 9), py(b) - 9, `A (${sg(a)}, ${sg(b)})`, { size: 12, bold: true, anchor: flip, fill: TEAL }) + text(px(c) + (c > 5 ? -9 : 9), py(b) + 18, `B (${sg(c)}, ${sg(b)})`, { size: 12, bold: true, anchor: c > 5 ? "end" : "start", fill: ORANGE });
  return `<svg class="wb-svg" viewBox="0 0 ${PLANE.size} ${PLANE.size}" aria-hidden="true" focusable="false"><rect width="${PLANE.size}" height="${PLANE.size}" fill="#fff"/>${body}</svg>`;
}
export function coordinatesModels(project, v, ctx) {
  const { a, b, c } = v;
  const mover = ctx.mover === "B" ? "B" : "A";
  const R = (id, value) => (ctx.reveal(id) ? sg(value) : unknown);
  const picker = `<fieldset class="wb-mover"><legend>Point that clicks and arrow keys move</legend>${["A", "B"].map((p) => `<label class="wb-radio" for="wb-mover-${p}"><input type="radio" id="wb-mover-${p}" name="wb-mover" data-wb-mover="${p}" ${mover === p ? "checked" : ""}> Point ${p}</label>`).join("")}</fieldset>`;
  const plane = `<div class="wb-slider wb-plane" id="wb-plane" role="application" tabindex="0" data-wb-plane aria-label="Coordinate plane from negative 10 to 10. Point A is at (${a}, ${b}) and point B is at (${c}, ${b}). Arrow keys move point ${mover} one unit; click or tap a grid point to place it." aria-describedby="wb-plane-help">${planeSvg(v, ctx)}</div><p id="wb-plane-help" class="wb-caption">Click or tap a grid point to place point ${mover}. With the keyboard, focus the plane and press the arrow keys. Point B always stays on A's row, so it only moves left and right. The steppers above do the same job.</p>`;
  const row = (name, x, y, extra) => `<tr><th scope="row">${name}</th><td class="nw">(${sg(x)}, ${sg(y)})</td><td>${quad(x, y).replace(/^the /, "on the ").replace("on the origin", "at the origin")}</td>${extra}</tr>`;
  const table = `<div class="table-scroll" tabindex="0" role="region" aria-label="The plotted points as ordered pairs"><table class="wb-table"><caption>The plotted points as ordered pairs</caption><thead><tr><th scope="col">Point</th><th scope="col">(x, y)</th><th scope="col">Location</th><th scope="col">To the y-axis</th><th scope="col">To the x-axis</th></tr></thead><tbody>${row("A", a, b, `<td>${R("a-zero", Math.abs(a))}</td><td>${R("opposite", Math.abs(b))}</td>`)}${row("B", c, b, `<td>${R("a-zero", Math.abs(c))}</td><td>${R("opposite", Math.abs(b))}</td>`)}${ctx.reveal("reflect-x") ? row("A′", -a, b, `<td>${R("a-zero", Math.abs(a))}</td><td>${R("opposite", Math.abs(b))}</td>`) : `<tr><th scope="row">A′</th><td class="nw">(?, ${sg(b)})</td><td>${unknown}</td><td>${unknown}</td><td>${unknown}</td></tr>`}</tbody></table></div>`;
  const r = plotIntent(v, ctx.builder || {});
  const b2 = ctx.builder || {};
  const intent = `<div class="wb-controls"><p>Type where you meant the points to be. The Studio compares it with what is plotted.</p><div class="wb-builder wb-stack">${bInput("A", "Point A: x I meant", b2.A ?? "")}${bInput("B", "Point A: y I meant", b2.B ?? "")}${bInput("C", "Point B: x I meant", b2.C ?? "")}</div>${verdictHTML(r)}</div>`;
  return [
    figure("Coordinate plane", picker + plane, "Location (signed) is not distance (unsigned). Blue marks appear as you check each reflection."),
    figure("Points as ordered pairs", table, "Read x (left or right) first, then y (up or down). A′ is A reflected across the y-axis. Distances are never negative.", true),
    figure("Check that the plot matches your plan", intent, "Catches swapped coordinates and sign slips before they reach your paper map."),
  ].join("");
}
