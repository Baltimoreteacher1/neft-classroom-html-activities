/** Lightweight SVG models. Coordinates are computed only from validated numeric inputs. */
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const text = (x, y, s) => `<text x="${x}" y="${y}">${escape(s)}</text>`;
const line = (x, y, x2, y2, stroke = "#536e65", extra = "") =>
  `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
export function visualMarkup(m) {
  if (!m.visual) return "";
  const { type, values: v, labels } = m.visual;
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
    shapes =
      '<path d="M140 80 L330 80 L390 40 L200 40 Z" fill="' +
      (v[3] ? "#f9fcfb" : "#e4efbb") +
      '" stroke="#14594f" stroke-width="2"/><path d="M140 80 L330 80 L330 205 L140 205 Z" fill="#dbece5" stroke="#14594f" stroke-width="2"/><path d="M330 80 L390 40 L390 165 L330 205 Z" fill="#b7d6cb" stroke="#14594f" stroke-width="2"/>' +
      text(190, 231, `length ${v[0]}`) +
      text(398, 106, `width ${v[1]}`) +
      text(40, 150, `height ${v[2]}`) +
      text(50, 25, v[3] ? "Open top · 5 faces" : "Closed prism · 6 faces");
    caption =
      "Prism sketch, not drawn to scale. Create your own labeled net to show the faces that need material.";
  } else if (type === "percent") {
    for (let i = 0; i < 100; i++) {
      const col = i % 20,
        row = Math.floor(i / 20);
      shapes += `<rect x="${30 + col * 25}" y="${30 + row * 30}" width="22" height="27" fill="${i < v[0] ? "#b53e20" : "#dbece5"}" stroke="#526a60"/>`;
    }
    shapes += text(30, 215, `${v[0]} of 100 squares: discount`);
    caption =
      "A 100-grid: orange shows the discount percent; the remaining squares show the portion still paid before tax.";
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
  return `<figure class="model"><svg viewBox="0 0 560 255" role="img" aria-label="${escape(caption)}">${shapes}</svg><figcaption>${escape(caption)}</figcaption></figure>`;
}
