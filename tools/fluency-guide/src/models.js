/* Deterministic, local mathematical diagrams with equivalent text. */
window.FluencyModels = (() => {
  "use strict";
  let serial = 0;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const text = (x, y, s, extra = "") => `<text x="${x}" y="${y}" ${extra}>${esc(s)}</text>`;
  const line = (x1, y1, x2, y2, cls = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
  const rect = (x, y, w, h, cls = "") =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
  const svg = (body, description, height = 250) => {
    const id = `flm-${++serial}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${height}" width="600" height="${height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">Mathematical model</title><desc id="${id}-desc">${esc(description)}</desc>${body}</svg>`;
  };
  function numberline(m) {
    const lo = m.min,
      hi = m.max,
      px = (n) => 55 + ((n - lo) / (hi - lo)) * 490;
    let body = line(55, 130, 545, 130);
    const step = Math.max(1, Math.ceil((hi - lo) / 6));
    for (let n = Math.ceil(lo / step) * step; n <= hi; n += step)
      body += line(px(n), 124, px(n), 136) + text(px(n), 166, n, 'text-anchor="middle"');
    [...new Set(m.values)].forEach((n, i) => {
      body +=
        `<circle cx="${px(n)}" cy="130" r="7" class="flm-dot"/>` +
        line(px(n), 119, px(n), 76 - i * 23, "flm-dashed") +
        text(px(n), 65 - i * 23, n, 'text-anchor="middle"');
    });
    return {
      html: svg(
        body,
        `Number line from ${lo} to ${hi} in steps of ${step}. Marked values: ${m.values.join(", ")}.`,
      ),
      description: `Equal intervals of ${step} unit${step === 1 ? "" : "s"}. Values: ${m.values.join(", ")}. Values increase from left to right.`,
    };
  }
  function dataset(m) {
    const a = [...m.values].sort((a, b) => a - b),
      lo = Math.min(0, a[0]),
      hi = Math.max(a[a.length - 1], lo + 1),
      px = (n) => 55 + ((n - lo) / (hi - lo)) * 490;
    let body = line(55, 175, 545, 175),
      counts = new Map();
    a.forEach((n) => {
      const count = (counts.get(n) || 0) + 1;
      counts.set(n, count);
      body += `<circle cx="${px(n)}" cy="${155 - (count - 1) * 24}" r="8" class="flm-dot"/>`;
    });
    const step = Math.max(1, Math.ceil((hi - lo) / 6));
    for (let n = lo; n <= hi; n += step)
      body += line(px(n), 170, px(n), 181) + text(px(n), 207, n, 'text-anchor="middle"');
    return {
      html: svg(body, `Dot plot of ${m.values.join(", ")}. Each dot is one observation.`),
      description: `${m.label ? m.label + ". " : ""}Data values: ${m.values.join(", ")}. One dot represents one observation; repeated values stack. Positions use a numerical scale.`,
    };
  }
  function histogram(m) {
    const frequencies = m.bins.map(([a, b]) => m.values.filter((x) => x >= a && x <= b).length),
      max = Math.max(...frequencies, 1),
      px = (i) => 95 + i * 140,
      py = (n) => 185 - (n / max) * 125;
    let body = line(75, 185, 530, 185) + line(75, 50, 75, 185) + text(28, 30, "Count");
    for (let n = 0; n <= max; n++)
      body += text(60, py(n) + 5, n, 'text-anchor="end"') + line(70, py(n), 75, py(n));
    m.bins.forEach(([a, b], i) => {
      body +=
        rect(px(i), py(frequencies[i]), 138, 185 - py(frequencies[i]), "flm-fill") +
        text(px(i) + 69, 214, `${a}–${b}`, 'text-anchor="middle"');
    });
    const description = `Whole-number bins: ${m.bins.map(([a, b], i) => `${a}–${b}: ${frequencies[i]} observations`).join("; ")}. Each stated endpoint is included. Data: ${m.values.join(", ")}.`;
    return { html: svg(body, description), description };
  }
  function box(m) {
    const [a, q1, med, q3, b] = m.values,
      span = Math.max(b - a, 1),
      px = (n) => 65 + ((n - a) / span) * 470;
    let body =
      line(px(a), 120, px(b), 120) +
      rect(px(q1), 87, px(q3) - px(q1), 66, "flm-fill") +
      line(px(med), 87, px(med), 153) +
      line(px(a), 98, px(a), 142) +
      line(px(b), 98, px(b), 142);
    m.values.forEach(
      (n, i) =>
        (body +=
          line(px(n), 153, px(n), 175) +
          text(px(n), 196, n, 'text-anchor="middle"') +
          text(
            60 + i * 120,
            35,
            ["Min", "Q1", "Median", "Q3", "Max"][i] + ": " + n,
            'text-anchor="middle"',
          )),
    );
    const description = `Five-number summary: minimum ${a}, Q1 ${q1}, median ${med}, Q3 ${q3}, maximum ${b}. The box spans Q1 to Q3 on a numerical scale.`;
    return { html: svg(body, description), description };
  }
  function ratio(m) {
    const r = (n, y, cls, label) => {
      let b = text(30, y + 5, label);
      for (let i = 0; i < n; i++)
        b += `<circle cx="${140 + i * 32}" cy="${y}" r="11" class="${cls}"/>`;
      return b;
    };
    const description = `${m.a} blue counters and ${m.b} gold counters. The groups use different labels and fill patterns. Total ${m.a + m.b} counters.`;
    return {
      html: svg(r(m.a, 85, "flm-dot", "Blue") + r(m.b, 145, "flm-gold", "Gold"), description, 210),
      description,
    };
  }
  function fraction(m) {
    const { n, d } = m,
      wholeCount = Math.ceil(n / d),
      width = 480 / d;
    let body = "";
    for (let w = 0; w < wholeCount; w++) {
      const y = 40 + w * 85;
      body += text(55, y - 12, `Whole ${w + 1}`);
      for (let i = 0; i < d; i++)
        body += rect(55 + i * width, y, width, 48, w * d + i < n ? "flm-fill" : "flm-empty");
    }
    const description = `${n} shaded parts, each of size 1/${d}. Each outlined complete strip is one whole divided into ${d} equal parts.`;
    return { html: svg(body, description, Math.max(180, wholeCount * 85 + 55)), description };
  }
  function percent(m) {
    const p = m.part;
    let body = "";
    for (let i = 0; i < 100; i++) {
      const fill = Math.max(0, Math.min(1, p - i)),
        x = 95 + (i % 10) * 29,
        y = 25 + Math.floor(i / 10) * 22;
      body += rect(x, y, 29, 22, "flm-empty");
      if (fill) body += rect(x, y, 29 * fill, 22, "flm-fill");
    }
    body +=
      text(420, 85, `${p}%`) +
      text(420, 120, m.whole !== undefined ? `Whole: ${m.whole}` : "Whole: ?") +
      text(420, 155, m.knownPart !== undefined ? `Part: ${m.knownPart}` : "Part: ?");
    const description = `Hundred grid: ${p} of 100 equal cells shaded. ${m.whole !== undefined ? `The whole represents ${m.whole}.` : `The known ${p}% part is ${m.knownPart}; the whole is unknown.`}`;
    return { html: svg(body, description, 270), description };
  }
  function division(m) {
    const description = `Count groups of size ${m.groups} within a total of ${m.total}. The number of groups is unknown. The small bar represents one group on the same scale as the total bar.`;
    const body =
      rect(60, 55, 480, 55, "flm-fill") +
      text(300, 90, `Total: ${m.total}`, 'text-anchor="middle"') +
      line(300, 115, 300, 140) +
      rect(60, 150, (480 * m.groups) / m.total, 35, "flm-empty") +
      text(60, 218, `One group has size ${m.groups}`) +
      text(300, 255, "How many groups fit in the total?", 'text-anchor="middle"');
    return { html: svg(body, description, 285), description };
  }
  function area(m) {
    const { shape, b, h, t } = m,
      scale = Math.min(350 / b, 145 / h),
      left = 100,
      bottom = 195,
      top = bottom - h * scale,
      right = left + b * scale,
      offset = shape === "triangle" ? (b * scale) / 3 : 45;
    const points =
      shape === "triangle"
        ? `${left},${bottom} ${right},${bottom} ${left + offset},${top}`
        : shape === "trapezoid"
          ? `${left},${bottom} ${right},${bottom} ${left + ((b + t) * scale) / 2},${top} ${left + ((b - t) * scale) / 2},${top}`
          : `${left},${bottom} ${right},${bottom} ${right + offset},${top} ${left + offset},${top}`;
    const foot = shape === "trapezoid" ? left + ((b - t) * scale) / 2 : left + offset;
    let body =
      `<polygon points="${points}" class="flm-fill"/>` +
      line(foot, top, foot, bottom, "flm-dashed") +
      `<path d="M${foot} ${bottom - 12}h12v12"/>` +
      text(foot + 12, (top + bottom) / 2, `h = ${h}`) +
      text((left + right) / 2, 224, `base = ${b} cm`, 'text-anchor="middle"');
    if (shape === "trapezoid")
      body += text(left + (b * scale) / 2, top - 15, `top base = ${t} cm`, 'text-anchor="middle"');
    const description = `${shape}: base ${b} cm, perpendicular height ${h} cm${shape === "trapezoid" ? `, other parallel base ${t} cm` : ""}. A right-angle mark identifies the height. Diagram dimensions are proportional.`;
    return { html: svg(body, description), description };
  }
  function composite(m) {
    const { w, h, cw, ch } = m,
      s = Math.min(430 / w, 160 / h),
      x = 70,
      y = 40;
    const body =
      `<path d="M${x} ${y}H${x + (w - cw) * s}V${y + ch * s}H${x + w * s}V${y + h * s}H${x}Z" class="flm-fill"/>` +
      rect(x + (w - cw) * s, y, cw * s, ch * s, "flm-cutout") +
      text(x + (w * s) / 2, y + h * s + 30, `${w} cm outer width`, 'text-anchor="middle"') +
      text(x + w * s + 12, y + (h * s) / 2, `${h} cm`) +
      text(x + (w - cw / 2) * s, y - 12, `${cw} cm`, 'text-anchor="middle"') +
      text(x + (w - cw) * s - 10, y + (ch * s) / 2, `${ch} cm`, 'text-anchor="end"');
    const description = `L-shaped region: an outer ${w} by ${h} cm rectangle with a ${cw} by ${ch} cm upper-right corner removed. The removed region has a dashed outline.`;
    return { html: svg(body, description, 280), description };
  }
  function prism(m) {
    const { l, w, h } = m,
      s = Math.min(300 / l, 100 / h, 90 / w),
      x = 100,
      y = 180,
      dx = w * s * 0.65,
      dy = -w * s * 0.55;
    const body =
      `<polygon points="${x},${y} ${x + l * s},${y} ${x + l * s},${y - h * s} ${x},${y - h * s}" class="flm-fill"/><polygon points="${x},${y - h * s} ${x + dx},${y - h * s + dy} ${x + l * s + dx},${y - h * s + dy} ${x + l * s},${y - h * s}" class="flm-empty"/><polygon points="${x + l * s},${y} ${x + l * s + dx},${y + dy} ${x + l * s + dx},${y - h * s + dy} ${x + l * s},${y - h * s}" class="flm-gold"/>` +
      text(x + (l * s) / 2, y + 30, `length ${l} cm`, 'text-anchor="middle"') +
      text(x + l * s + dx + 12, y - (h * s) / 2, `h = ${h}`) +
      text(x + l * s + dx / 2, y + dy + 28, `w = ${w}`);
    const description = `Rectangular prism: length ${l} cm, width ${w} cm, height ${h} cm. Perspective sketch; use labels for measurements.`;
    return { html: svg(body, description), description };
  }
  function net(m) {
    const { l, w, h } = m,
      s = Math.min(480 / (2 * l + 2 * w), 210 / (h + 2 * w)),
      x = 60;
    let body = "";
    [
      [0, w, w, h, "wh"],
      [w, w, l, h, "lh"],
      [w + l, w, w, h, "wh"],
      [2 * w + l, w, l, h, "lh"],
      [w, 0, l, w, "lw"],
      [w, w + h, l, w, "lw"],
    ].forEach(([rx, ry, rw, rh, label]) => {
      body +=
        rect(x + rx * s, 45 + ry * s, rw * s, rh * s, label === "lw" ? "flm-gold" : "flm-fill") +
        text(x + (rx + rw / 2) * s, 45 + (ry + rh / 2) * s + 5, label, 'text-anchor="middle"');
    });
    body += text(300, 295, `l = ${l} cm; w = ${w} cm; h = ${h} cm`, 'text-anchor="middle"');
    const description = `A foldable cross net of a ${l} by ${w} by ${h} cm rectangular prism. Four rectangles form a belt, and the two length-by-width faces attach above and below the length-by-height face. Two faces each: lw, lh, wh. Diagram uses proportional dimensions.`;
    return { html: svg(body, description, 325), description };
  }
  function pyramid(m) {
    const { b, s } = m,
      k = Math.min(200 / (b + 2 * s), 70 / b),
      left = 300 - (b * k) / 2,
      top = 135 - (b * k) / 2,
      right = left + b * k,
      bottom = top + b * k;
    const body =
      rect(left, top, b * k, b * k, "flm-gold") +
      `<polygon points="${left},${top} ${right},${top} 300,${top - s * k}" class="flm-fill"/><polygon points="${right},${top} ${right},${bottom} ${right + s * k},135" class="flm-fill"/><polygon points="${left},${bottom} ${right},${bottom} 300,${bottom + s * k}" class="flm-fill"/><polygon points="${left},${top} ${left},${bottom} ${left - s * k},135" class="flm-fill"/>` +
      line(300, top - s * k, 300, top, "flm-dashed") +
      `<path d="M300 ${top - 9}h9v9"/>` +
      text(300, 140, `${b} × ${b}`, 'text-anchor="middle"') +
      text(310, top - (s * k) / 2, `s = ${s}`) +
      text(300, 273, `Base side ${b} cm; face slant height ${s} cm`, 'text-anchor="middle"');
    const description = `Square-pyramid net with one ${b} by ${b} cm base and four triangles. Each triangle has base ${b} cm and perpendicular face slant height ${s} cm. The dashed height belongs to a triangular face, not the vertical height of the solid.`;
    return { html: svg(body, description, 300), description };
  }
  function coordinates(m) {
    const xMax = m.xMax,
      yMax = m.yMax,
      xMin = m.signed ? -xMax : 0,
      yMin = m.signed ? -yMax : 0,
      px = (x) => 70 + ((x - xMin) / (xMax - xMin)) * 430,
      py = (y) => 205 - ((y - yMin) / (yMax - yMin)) * 155;
    const sx = m.signed ? 2 : Math.max(1, Math.ceil(xMax / 6)),
      sy = m.signed ? 2 : Math.max(1, Math.ceil(yMax / 5));
    let body = "";
    for (let x = xMin; x <= xMax; x += sx)
      body += line(px(x), 50, px(x), 205, "flm-grid") + text(px(x), 228, x, 'text-anchor="middle"');
    for (let y = yMin; y <= yMax; y += sy)
      body += line(70, py(y), 500, py(y), "flm-grid") + text(55, py(y) + 5, y, 'text-anchor="end"');
    body +=
      line(70, py(0), 500, py(0)) +
      line(px(0), 50, px(0), 205) +
      text(300, 275, m.xLabel, 'text-anchor="middle"') +
      text(70, 24, m.yLabel);
    if (m.polygon)
      body += `<polygon points="${m.points.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}" class="flm-fill"/>`;
    m.points.forEach(
      ([x, y], i) =>
        (body +=
          `<circle cx="${px(x)}" cy="${py(y)}" r="6" class="flm-dot"/>` +
          text(px(x) + 9, py(y) + (i % 2 ? -12 : 22), `(${x}, ${y})`)),
    );
    const description = `Coordinate plane: horizontal ${m.xLabel} from ${xMin} to ${xMax}; vertical ${m.yLabel} from ${yMin} to ${yMax}. Marked points ${m.points.map((p) => `(${p.join(", ")})`).join("; ")}${m.polygon ? ", connected in order to form a polygon" : ""}. Horizontal labeled intervals ${sx}; vertical labeled intervals ${sy}.`;
    return { html: svg(body, description, 300), description };
  }
  function inequality(m) {
    const lo = m.b - 4,
      hi = m.b + 4,
      px = (n) => 70 + ((n - lo) / 8) * 460,
      right = [">", "≥"].includes(m.symbol),
      closed = ["≤", "≥"].includes(m.symbol);
    let body = line(70, 125, 530, 125);
    for (let n = lo; n <= hi; n++)
      body += line(px(n), 120, px(n), 132) + text(px(n), 162, n, 'text-anchor="middle"');
    body +=
      line(300, 125, right ? 530 : 70, 125, "flm-solution") +
      `<path d="${right ? "M515 116l15 9-15 9" : "M85 116l-15 9 15 9"}" class="flm-solution"/><circle cx="300" cy="125" r="9" class="${closed ? "flm-dot" : "flm-empty"}"/>` +
      text(300, 60, `x ${m.symbol} ${m.b}`, 'text-anchor="middle"');
    const description = `Number line for x ${m.symbol} ${m.b}. ${closed ? "Closed" : "Open"} endpoint at ${m.b}; arrow ${right ? "right toward greater" : "left toward smaller"} values. The endpoint is ${closed ? "included" : "excluded"}.`;
    return { html: svg(body, description, 210), description };
  }
  const builders = {
    numberline,
    data: dataset,
    histogram,
    box,
    ratio,
    fraction,
    percent,
    division,
    area,
    composite,
    prism,
    net,
    pyramid,
    coordinates,
    inequality,
    fractionDivision: (m) => {
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);
      const denominator = (m.b * m.d) / gcd(m.b, m.d);
      const f = fraction({ n: (m.a * denominator) / m.b, d: denominator });
      const group = fraction({ n: (m.c * denominator) / m.d, d: denominator });
      return {
        ...f,
        html: `<p class="flm-division-label"><strong>Total amount: ${m.a}/${m.b}</strong></p>${f.html}<p class="flm-division-label"><strong>One group: ${m.c}/${m.d}</strong></p>${group.html}`,
        description: `Total ${m.a}/${m.b}; each group has size ${m.c}/${m.d}. ${f.description}`,
      };
    },
    expression: (m) => {
      const description = m.expression || m.tokens.join(` ${m.operator} `);
      return {
        html: `<div class="flm-expression">${esc(description)}</div>${m.tokens ? `<div class="flm-tokens">${m.tokens.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}`,
        description: `Expression model: ${description}. Adjacent number and variable mean multiplication. The symbol ^ indicates an exponent.`,
      };
    },
    balance: (m) => ({
      html: svg(
        rect(65, 60, 180, 65, "flm-fill") +
          text(155, 100, m.left, 'text-anchor="middle"') +
          text(300, 102, "=", 'text-anchor="middle"') +
          rect(355, 60, 180, 65, "flm-gold") +
          text(445, 100, m.right, 'text-anchor="middle"') +
          line(65, 145, 535, 145) +
          `<path d="M300 145l-24 34h48Z"/>`,
        `Equality: ${m.left} = ${m.right}. Both sides must retain equal values.`,
      ),
      description: `Equality: ${m.left} = ${m.right}. Apply the same operation to both sides to keep the equation balanced.`,
    }),
    table: (m) => ({
      html: `<table><caption>Quantities in this problem</caption><thead><tr>${m.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${m.rows.map((r) => `<tr>${r.map((v, i) => (i ? `<td>${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`)).join("")}</tr>`).join("")}</tbody></table>`,
      description: `${m.headers.join("; ")}. Rows: ${m.rows.map((r) => r.join(", ")).join("; ")}. A question mark marks an unknown.`,
    }),
  };
  function render(model, caption = "Read the model") {
    const make = builders[model?.kind];
    if (!make) throw new Error(`Unsupported fluency model: ${model?.kind}`);
    const result = make(model);
    return `<figure class="flm-model"><figcaption>${esc(caption)}</figcaption><div class="flm-graphic">${result.html}</div><p class="flm-description">${esc(result.description)}</p></figure>`;
  }
  return { render, kinds: Object.keys(builders) };
})();
