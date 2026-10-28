/** Lightweight SVG models. Coordinates are computed only from validated numeric inputs. */
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const text = (x, y, s) => `<text x="${x}" y="${y}">${escape(s)}</text>`;
const format = (n) => Number.isInteger(n) ? String(n) : Number(n.toFixed(2)).toString();
const line = (x, y, x2, y2, stroke = "#536e65", extra = "") =>
  `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
export function visualMarkup(m) {
  if (!m.visual) return "";
  const { type, values: v, labels } = m.visual;
  const fig = (svg, caption) => `<figure class="model">${svg}<figcaption>${escape(caption)}</figcaption></figure>`;
  if (type === "dots") return fig(makeDataDistributionSVG(v), "One dot represents one observation. Vertical stacks show repeated values; the overlay marks center and spread.");
  if (type === "dual") return fig(makeTwoVariableLinearGraphSVG([v[0], v[1]], [v[2], v[3]], v[4]), "Compare both cost rules using ordered pairs, including zero usage, and locate their break-even point.");
  if (type === "percent") return fig(makePercentGridAndBarSVG(v[1], v[0], v[2]), `${v[0]}% discount, then ${v[2]}% tax on the discounted subtotal.`);
  if (type === "area") return fig(makeCompositeFloorAndPrismSVG(v[0], v[1], v[2], v[3], v.slice(4, 7).length === 3 ? v.slice(4, 7) : [2, 1, 1]), "Rectangle and non-overlapping triangle with perpendicular height marker; storage prism shown separately.");
  if (type === "box" && v[3]) return fig(makeOpenTopPrismNetSVG(v[0], v[1], v[2]), "The open-top net includes one base and four walls. Compare its surface area with a closed prism.");
  if (type === "pattern") return fig(makePatternStagesSVG(v[1], v[0]), "Four stages show repeated growth and two ways to group the same pattern.");
  if (type === "ratio") return fig(makeDoubleNumberLineSVG(v[0], v[1], v[2], labels?.length ? labels : ["units", "amount"]), "Equivalent quantities scale together on the double number line.");
  if (type === "numberline") return fig(makeNumberLineAndBalanceSVG({ value: v[0], operator: "≥", inclusive: true }), "A closed circle includes the boundary; the arrow shows all allowed values.");
  let shapes = "",
    caption = "A model to help you reason. Show calculations and explain what the model means.";
  if (type === "dots") {
    const min = Math.min(...v),
      max = Math.max(...v),
      span = max - min || 1;
    const x = (n) => 45 + ((n - min) / span) * 460;
    const stacks = {};
    shapes = line(35, 175, 525, 175);
    for (const n of v) {
      stacks[n] = (stacks[n] || 0) + 1;
      shapes += `<circle cx="${x(n)}" cy="${159 - stacks[n] * 12}" r="5" fill="#14594f"/>`;
    }
    for (const n of [...new Set(v)]) shapes += text(x(n) - 8, 202, n);
    caption =
      "Dot plot: each dot is one observation. The horizontal position shows its value; stacks show repeated values.";
  } else if (type === "coordinates") {
    const x = (n) => 280 + n * 19,
      y = (n) => 120 - n * 9;
    for (let n = -10; n <= 10; n += 2) {
      shapes += line(x(n), 25, x(n), 215, "#ccd8d2");
      shapes += text(x(n) - 7, 236, n);
    }
    shapes += line(65, 120, 500, 120) + line(280, 15, 280, 218);
    shapes += line(x(v[0]), y(v[1]), x(v[2]), y(v[1]), "#b53e20");
    for (const [n, name] of [
      [v[0], "A"],
      [v[2], "B"],
    ])
      shapes +=
        `<circle cx="${x(n)}" cy="${y(v[1])}" r="6" fill="#14594f"/>` +
        text(x(n) - 18, y(v[1]) - 16, `${name}(${n}, ${v[1]})`);
    shapes += text(290, 26, "y") + text(505, 117, "x");
    caption =
      "Coordinate model: A and B share a y-coordinate. Horizontal grid spacing is two units; vertical distance is compressed to fit.";
  } else if (type === "area") {
    const scale = Math.min(350 / (v[0] + v[2]), 140 / Math.max(v[1], v[3]));
    const w = v[0] * scale,
      h = v[1] * scale,
      b = v[2] * scale,
      t = v[3] * scale;
    shapes =
      `<rect x="55" y="45" width="${w}" height="${h}" fill="#e4efbb" stroke="#14594f" stroke-width="2"/><path d="M${55 + w},${45 + h} l${b},0 l${-b},${-t} Z" fill="#f6cfbb" stroke="#b53e20" stroke-width="2"/>` +
      text(55, 30, `${v[0]} m`) +
      text(55, 65 + h, `Rectangle width ${v[1]} m`) +
      text(55, 235, `Triangle base ${v[2]} m · perpendicular height ${v[3]} m`);
    caption =
      "Composite model: the triangle meets the rectangle along an edge. Their interiors do not overlap. Storage dimensions are modeled separately in your net.";
  } else if (type === "box") {
    const [l, w, h, open] = v;
    const scale = Math.min(90 / Math.max(l, w), 44 / h);
    const lw = l * scale, wh = w * scale, lh = l * scale * h / w;
    const faces = [[95, 95, lw, wh, "base", "#dbece5"], [95, 34, lw, lh, "wall", "#e4efbb"], [95, 95 + wh, lw, lh, "wall", "#e4efbb"], [95 - wh - 5, 95, wh, lh, "wall", "#b7d6cb"], [95 + lw + 5, 95, wh, lh, "wall", "#b7d6cb"]];
    shapes = faces.map(([x, y, width, height, name, fill]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="#14594f" stroke-width="2"/>`).join("");
    if (open) shapes += `<rect x="${95 + lw + wh + 12}" y="95" width="${lw}" height="${wh}" fill="#fff" stroke="#b53e20" stroke-width="2" stroke-dasharray="6 4"/>` + text(95 + lw + wh + 15, 122, "Missing top") + text(95 + lw + wh + 15, 145, `${format(l)} × ${format(w)}`);
    shapes += text(95, 24, `${open ? "Five-face open tank net" : "Six-face closed prism"}`) + text(95, 95 + wh + lh + 20, `Base ${format(l)} × ${format(w)} · walls ${format(l)} × ${format(h)} and ${format(w)} × ${format(h)}`);
    const total5 = l * w + 2 * l * h + 2 * w * h, total6 = total5 + l * w;
    shapes += text(95, 95 + wh + lh + 45, `5-face area ${format(total5)} sq units · closed ${format(total6)} sq units`);
    caption = `Open-top rectangular prism net. The top ${format(l)} by ${format(w)} face is excluded once. Volume ${format(l * w * h)} cubic units; five-face area ${format(total5)} square units versus ${format(total6)} closed.`;
  } else if (type === "percent") {
    const [discount, original = 100, tax = 0, total = original * (1 - discount / 100) * (1 + tax / 100)] = v;
    for (let i = 0; i < 100; i++) {
      const col = i % 10, row = Math.floor(i / 10);
      shapes += `<rect x="${25 + col * 20}" y="${32 + row * 20}" width="18" height="18" fill="${i < discount ? "#b53e20" : "#dbece5"}" stroke="#526a60"/>`;
    }
    const subtotal = original * (1 - discount / 100), barX = 275, barWidth = 240;
    shapes += text(25, 250, `${discount}% shaded · ${format(original * discount / 100)} discount`);
    shapes += `<rect x="${barX}" y="62" width="${barWidth}" height="42" fill="#dbece5" stroke="#14594f"/><rect x="${barX}" y="62" width="${barWidth * (1 - discount / 100)}" height="42" fill="#e4efbb" stroke="#14594f"/>`;
    shapes += text(barX, 52, `Original $${format(original)} → subtotal $${format(subtotal)}`);
    shapes += `<rect x="${barX}" y="145" width="${barWidth * subtotal / Math.max(total, original)}" height="42" fill="#e4efbb" stroke="#14594f"/><rect x="${barX + barWidth * subtotal / Math.max(total, original)}" y="145" width="${Math.max(2, barWidth * (total - subtotal) / Math.max(total, original))}" height="42" fill="#b53e20" stroke="#14594f"/>`;
    shapes += text(barX, 210, `Tax ${tax}% on $${format(subtotal)} = $${format(subtotal * tax / 100)} → total $${format(total)}`);
    caption = `100-square percent grid shows ${discount} percent. $${format(original)} less $${format(original * discount / 100)} is $${format(subtotal)}; ${tax} percent tax on the discounted subtotal gives $${format(total)}.`;
  } else if (type === "dual") {
    const [rateA, baseA, rateB, baseB, maxX] = v;
    const maxY = Math.max(rateA, rateB) * maxX + Math.max(baseA, baseB), sx = 440 / maxX, sy = 165 / maxY;
    for (let i = 0; i <= 4; i++) {
      const gx = 65 + i * 110, xVal = (maxX * i) / 4;
      shapes += line(gx, 35, gx, 210, "#d5dfda") + text(gx - 5, 231, format(xVal));
    }
    shapes += line(65, 210, 515, 210) + line(65, 25, 65, 210);
    const series = [[rateA, baseA, "#14594f", "A"], [rateB, baseB, "#b53e20", "B"]];
    for (const [rate, base, color, name] of series) {
      shapes += line(65, 210 - base * sy, 505, 210 - (rate * maxX + base) * sy, color, 'stroke-width="3"');
      for (const xVal of [0, 2, 4, 6, maxX].filter((n, i, a) => n <= maxX && a.indexOf(n) === i)) {
        const yVal = rate * xVal + base;
        shapes += `<circle cx="${65 + xVal * sx}" cy="${210 - yVal * sy}" r="4" fill="${color}"/>` + text(65 + xVal * sx - 8, 197 - yVal * sy, `(${format(xVal)},${format(yVal)})`);
      }
      shapes += text(420, 30 + (name === "B" ? 22 : 0), `Option ${name}: ${base} + ${rate}h`);
    }
    const cross = (baseB - baseA) / (rateA - rateB);
    if (Number.isFinite(cross) && cross >= 0 && cross <= maxX) shapes += `<circle cx="${65 + cross * sx}" cy="${210 - (rateA * cross + baseA) * sy}" r="8" fill="#f0b900" stroke="#142c3b" stroke-width="2"/>` + text(325, 250, `Break-even: ${format(cross)} hours`);
    shapes += text(515, 214, "hours") + text(72, 20, "cost");
    caption = `Two maker-pass cost rules. Option A begins at ${baseA} and adds ${rateA} per hour; option B begins at ${baseB} and adds ${rateB} per hour. Plotted pairs include zero usage.`;
  } else if (type === "line") {
    const [rate, start, target] = v;
    const maxX = Math.max(target, 4),
      maxY = rate * maxX + start || 1,
      x = (n) => 55 + (n / maxX) * 445,
      y = (n) => 205 - (n / maxY) * 155;
    shapes =
      line(55, 25, 55, 205) +
      line(55, 205, 515, 205) +
      line(x(0), y(start), x(maxX), y(maxY), "#14594f");
    for (const n of [...new Set([0, 1, 2, maxX])])
      shapes +=
        `<circle cx="${x(n)}" cy="${y(rate * n + start)}" r="5" fill="#b53e20"/>` +
        text(x(n) - 4, 230, n);
    shapes +=
      text(5, 45, Number(maxY.toFixed(2))) +
      text(8, 205, "0") +
      text(520, 209, "x") +
      text(65, 20, "y");
    caption =
      "Relationship preview: points come from your equation. Copy a labeled graph into your final product and show at least four table rows.";
  } else if (type === "pattern") {
    for (let stage = 1; stage <= 3; stage++) {
      shapes += text(15, stage * 67 - 5, `Stage ${stage}`);
      for (let i = 0; i < stage * v[0] + v[1]; i++)
        shapes += `<rect x="${105 + (i % 32) * 13}" y="${stage * 67 - 25 + Math.floor(i / 32) * 13}" width="11" height="11" fill="${i < stage * v[0] ? "#14594f" : "#b53e20"}"/>`;
    }
    caption =
      "The green tiles form the growing groups. Orange tiles are the extra tiles that stay the same. The model shows stages 1–3.";
  } else if (type === "numberline") {
    shapes = line(40, 120, 525, 120);
    for (let n = -3; n <= 3; n++)
      shapes += line(280 + n * 60, 113, 280 + n * 60, 127) + text(273 + n * 60, 153, v[0] + n);
    shapes +=
      line(280, 120, 520, 120, "#14594f", 'stroke-width="6"') +
      `<circle cx="280" cy="120" r="8" fill="#14594f"/><path d="M505 111 l18 9 -18 9" fill="none" stroke="#14594f" stroke-width="3"/>` +
      text(50, 45, `n ≥ ${v[0]}: include the boundary`);
    caption =
      "A closed dot includes the boundary. The arrow shows the allowed direction. Sketch a second line for the strict inequality.";
  } else if (type === "ratio") {
    const max = Math.max(...v) || 1;
    for (let i = 0; i < v.length; i++) {
      shapes += text(15, 40 + i * 53, labels[i]);
      shapes += `<rect x="125" y="${22 + i * 53}" width="${(360 * v[i]) / max}" height="27" rx="4" fill="${i % 2 ? "#b53e20" : "#14594f"}"/>`;
    }
    caption =
      "The bars compare the base quantities and the scaled quantities. Check that BOTH parts use the same scale factor.";
  } else if (type === "rule") {
    shapes =
      `<rect x="30" y="65" width="105" height="100" rx="12" fill="#e4efbb" stroke="#14594f"/><rect x="175" y="45" width="205" height="140" rx="12" fill="#fff" stroke="#14594f"/><rect x="420" y="65" width="105" height="100" rx="12" fill="#fce8dc" stroke="#b53e20"/>` +
      text(52, 111, `x = ${v[2]}`) +
      text(193, 93, `Add ${v[1]}`) +
      text(193, 123, `Multiply by ${v[0]}`) +
      text(193, 153, `Add ${v[3]}²`) +
      text(438, 113, "Output?") +
      line(135, 113, 175, 113) +
      line(380, 113, 420, 113);
    caption =
      "Read the machine from left to right. Connect these operations to the grouped and expanded expressions.";
  } else {
    shapes =
      text(35, 65, `Full groups: ${v[0]}`) +
      text(35, 115, `Left after full groups: ${v[1]}`) +
      text(35, 175, "Does the remainder need another group?");
    caption =
      "The grouping model invites an interpretation: explain what the remainder means in this mission.";
  }
  return `<figure class="model"><svg width="560" height="280" viewBox="0 0 560 280" role="img" aria-label="${escape(caption)}" style="background:white">${shapes}</svg><figcaption>${escape(caption)}</figcaption></figure>`;
}
import { makePatternStagesSVG, makeDataDistributionSVG, makeDoubleNumberLineSVG, makePercentGridAndBarSVG, makeCompositeFloorAndPrismSVG, makeOpenTopPrismNetSVG, makeTwoVariableLinearGraphSVG, makeNumberLineAndBalanceSVG } from "./math-svg-studio.mjs";
