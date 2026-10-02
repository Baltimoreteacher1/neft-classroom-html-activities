import { controls, evaluate, fmt } from './math.mjs';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const line = (x1, y1, x2, y2, cls = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const text = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(t)}</text>`;
const rect = (x, y, w, h, cls = 'shape') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" rx="3"/>`;
const dot = (x, y, label, cls = 'point') => `<circle cx="${x}" cy="${y}" r="7" class="${cls}"/>${label ? text(x, y - 12, label) : ''}`;
const svg = (body, label, viewBox = '0 0 600 300') => `<svg viewBox="${viewBox}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export function visual(model, values, result) {
  const [a, b, c, d] = values;
  let body = '';
  const k = model.kind;
  if (k === 'array') {
    const size = Math.min(34, 450 / b, 235 / a), left = (600 - b * size) / 2;
    for (let row = 0; row < a; row++) for (let col = 0; col < b; col++) body += rect(left + col * size, 22 + row * size, size - 3, size - 3, row % 2 ? 'shape-alt' : 'shape');
    body += text(300, 282, `${a} equal rows, ${b} spaces per row`);
  } else if (k === 'data') {
    const s = result, axisMax = Math.max(10, Math.ceil(Math.max(...values) / 10) * 10), sx = x => 55 + x / axisMax * 490;
    if (model.mode === 'histogram') {
      // Bins of width 5 from 0 up to the last occupied interval, so labels stay legible.
      const count = Math.max(4, Math.floor(Math.max(...values) / 5) + 1), width = 500 / count;
      const bins = Array(count).fill(0); values.forEach(n => bins[Math.min(count - 1, Math.floor(n / 5))]++);
      const unit = Math.min(25, 200 / Math.max(1, ...bins));
      body += line(50, 240, 550, 240);
      bins.forEach((n, i) => {
        const x = 50 + i * width, cx = x + width / 2, stagger = count > 7 && i % 2 ? 18 : 0;
        body += rect(x + 2, 240 - n * unit, width - 4, n * unit);
        body += `<text x="${cx}" y="${260 + stagger}" text-anchor="middle" font-size="${count > 7 ? 13 : 15}">${i * 5}–${i * 5 + 4}</text>`;
        if (n) body += text(cx, 230 - n * unit, n);
      });
      body += text(300, 296, `${values.length} observations · intervals of width 5 · frequency above each bar`);
    } else {
      body += line(55, 135, 545, 135);
      for (let n = 0; n <= axisMax; n += axisMax / 10) body += line(sx(n), 129, sx(n), 141) + text(sx(n), 161, n);
      const counts = {};
      values.forEach(n => { counts[n] = (counts[n] || 0) + 1; body += dot(sx(n), 128 - counts[n] * 14); });
      body += line(sx(s.min), 205, sx(s.max), 205) + rect(sx(s.q1), 175, Math.max(2, sx(s.q3) - sx(s.q1)), 60, 'shape-light');
      [s.min, s.max, s.median].forEach(n => { body += line(sx(n), 172, sx(n), 238, 'heavy') + text(sx(n), 264, fmt(n)); });
      body += text(300, 292, `Middle half: ${fmt(s.q1)} to ${fmt(s.q3)} · each dot is one observation`);
    }
  } else if (['decimal', 'division', 'rate', 'conversion'].includes(k)) {
    const first = k === 'decimal' ? `$${a.toFixed(2)} each` : k === 'rate' ? `$${a} for ${b} items` : k === 'division' ? `${fmt(a)} total` : `${a} ${model.mode === 'scale' ? 'feet' : 'inches'}`;
    body += rect(45, 55, 210, 115, 'shape-light') + text(150, 118, first);
    body += text(300, 120, k === 'division' || k === 'rate' ? '÷' : '×');
    body += rect(345, 55, 210, 115, 'shape-light') + text(450, 118, k === 'rate' ? `${b} items` : k === 'division' ? `${fmt(b)} per group` : `${b}`);
    body += text(300, 230, `${result.label}: ${fmt(result.value)} ${result.unit}`);
    body += line(150, 180, 300, 202) + line(450, 180, 300, 202);
  } else if (k === 'ratio') {
    body += text(40, 55, model.mode === 'compare' ? 'Color' : 'Juice', 'start');
    body += text(40, 170, model.mode === 'compare' ? 'White' : 'Water', 'start');
    for (let i = 0; i < a; i++) body += rect(40 + i * 43, 70, 37, 60);
    for (let i = 0; i < b; i++) body += rect(40 + i * 43, 185, 37, 60, 'shape-alt');
    body += text(300, 282, `Each block = 1 cup. ${a} cups to ${b} cups; ${a + b} cups in all.`);
  } else if (k === 'growth') {
    const maxX = Math.max(6, c), maxY = a * maxX + b, sx = x => 65 + 470 * x / maxX, sy = y => 245 - 210 * y / Math.max(1, maxY);
    body += line(65, 245, 550, 245) + line(65, 245, 65, 25);
    for (let x = 0; x <= maxX; x++) { body += dot(sx(x), sy(a * x + b), x === c ? `(${x}, ${a * x + b})` : ''); body += text(sx(x), 269, x); }
    body += line(sx(0), sy(b), sx(maxX), sy(maxY), 'plot') + text(300, 294, 'Input x') + text(32, 27, 'y') + text(40, 50, maxY) + text(44, 243, '0');
  } else if (k === 'percent') {
    for (let i = 0; i < 100; i++) body += rect(35 + i % 10 * 23, 20 + Math.floor(i / 10) * 23, 21, 21, i < a ? 'shape' : 'shape-light');
    body += text(422, 90, `${a} out of 100`) + text(422, 135, `${a / 100}`) + text(422, 180, `${a}%`);
    body += text(300, 285, `${result.label}: ${fmt(result.value)}`);
  } else if (k === 'area') {
    if (model.mode === 'polygon') {
      const points = Array.from({ length: a }, (_, i) => [300 + 105 * Math.cos(i * 2 * Math.PI / a - Math.PI / 2), 135 + 105 * Math.sin(i * 2 * Math.PI / a - Math.PI / 2)]);
      body += `<polygon points="${points.map(p => p.join(',')).join(' ')}" class="shape-light"/>`;
      points.forEach(p => { body += line(300, 135, ...p); });
      body += text(300, 271, `${a} congruent triangles · side ${b} · apothem ≈ ${fmt(result.apothem)}`);
    } else {
      const baseScale = 360 / Math.max(a, b, 12), h = (model.mode === 'trapezoid' ? c : b) * 16;
      if (model.mode === 'trapezoid') body += `<polygon points="${300-a*baseScale/2},235 ${300+a*baseScale/2},235 ${300+b*baseScale/2},${235-h} ${300-b*baseScale/2},${235-h}" class="shape-light"/>`;
      else body += `<polygon points="100,235 ${100+a*baseScale},235 ${100+a*baseScale/2},${235-h}" class="shape-light"/>`;
      const x = model.mode === 'trapezoid' ? 300 : 100 + a * baseScale / 2;
      body += line(x, 235, x, 235 - h, 'dashed') + text(x + 38, 235 - h / 2, `h = ${model.mode === 'trapezoid' ? c : b}`) + text(300, 279, model.mode === 'trapezoid' ? `Parallel bases ${a} and ${b}` : `Base ${a}; perpendicular height ${b}`);
    }
  } else if (k === 'solid') {
    if (result.shape === 'pyramid') {
      if (!result.validShape) return svg(text(300, 135, 'Increase slant height to form a pyramid.'), result.equation + ' ' + result.note);
      const scale = 245 / (a + 2 * c), side = a * scale, height = c * scale;
      const x = 300 - side / 2, y = 135 - side / 2;
      body += rect(x, y, side, side, 'shape');
      for (const points of [
        `${x},${y} ${x+side},${y} 300,${y-height}`,
        `${x},${y+side} ${x+side},${y+side} 300,${y+side+height}`,
        `${x},${y} ${x},${y+side} ${x-height},135`,
        `${x+side},${y} ${x+side},${y+side} ${x+side+height},135`,
      ]) body += `<polygon points="${points}" class="shape-light"/>`;
      body += line(300, y, 300, y-height, 'dashed') + text(410, 80, `Slant height ${c}`) + text(300, 141, `${a}×${a}`);
      body += text(300, 288, 'Square-pyramid net · 1 square + 4 triangles');
      return svg(body, `${result.equation}. ${result.note}`);
    }
    // Net is proportional: the central row alternates L×H and W×H faces.
    const scale = Math.min(500 / (2 * a + 2 * b), 225 / (c + 2 * b));
    const left = (600 - (2 * a + 2 * b) * scale) / 2, top = 24 + b * scale;
    let x = left;
    [a, b, a, b].forEach((w, i) => { body += rect(x, top, w * scale, c * scale, i % 2 ? 'shape-alt' : 'shape-light') + text(x + w * scale / 2, top + c * scale / 2 + 5, `${w}×${c}`); x += w * scale; });
    body += rect(left, top - b * scale, a * scale, b * scale, 'shape') + text(left + a * scale / 2, top - b * scale / 2 + 5, `${a}×${b}`);
    body += rect(left, top + c * scale, a * scale, b * scale, 'shape') + text(left + a * scale / 2, top + c * scale + b * scale / 2 + 5, `${a}×${b}`);
    body += text(300, 288, 'Six-face rectangular-prism net · labels show side lengths');
  } else if (k === 'fraction') {
    const supplyWidth = 500, full = Math.floor(a), rows = Math.ceil(a), size = Math.min(35, 225 / rows), portion = b / c;
    for (let i = 0; i < rows; i++) {
      body += rect(50, 20 + i * size, supplyWidth, size - 5, 'shape-light');
      body += rect(50, 20 + i * size, supplyWidth * Math.min(1, a - i), size - 5, 'shape');
      for (let j = 1; j < c; j++) body += line(50 + j * supplyWidth / c, 20 + i * size, 50 + j * supplyWidth / c, 20 + i * size + size - 5);
    }
    body += text(300, 273, `Each full strip = 1 unit, divided into ${c} equal parts`) + text(300, 296, `A portion uses ${b} of those parts (${fmt(portion)} units).`);
  } else if (['power', 'expression', 'factors'].includes(k)) {
    if (k === 'factors') {
      body += text(300, 57, `Factors of ${a}: ${result.first.join(', ')}`) + text(300, 112, `Factors of ${b}: ${result.second.join(', ')}`);
      body += rect(65, 150, 200, 85, 'shape-light') + text(165, 200, `GCF = ${result.gcf}`) + rect(335, 150, 200, 85, 'shape-light') + text(435, 200, `LCM = ${result.lcm}`);
    } else if (k === 'expression') {
      const scale = 460 / (c + b); body += rect(70, 70, c * scale, 120, 'shape') + rect(70 + c * scale, 70, b * scale, 120, 'shape-alt');
      body += text(70 + c * scale / 2, 135, `${a} × ${c}`) + text(70 + c * scale + b * scale / 2, 135, `${a} × ${b}`) + text(300, 232, `${a}(x + ${b}) = ${a}x + ${a * b}; x = ${c}`);
    } else { body += text(300, 80, Array(b).fill(a).join(' × ')) + text(300, 152, `${a}^${b} = ${a ** b}`) + text(300, 228, `Then add ${c}: ${fmt(result.value)}`); }
  } else if (k === 'line' || k === 'inequality') {
    const min = k === 'line' ? -10 : 0, max = k === 'line' ? 10 : 30, sx = n => 45 + (n - min) / (max - min) * 510;
    body += line(45, 160, 555, 160);
    for (let n = min; n <= max; n += k === 'line' ? 2 : 5) body += line(sx(n), 153, sx(n), 169) + text(sx(n), 194, n);
    if (k === 'line') body += dot(sx(a), 160, `A: ${a}`) + dot(sx(b), 160, `B: ${b}`, 'point-alt');
    else {
      const greater = result.symbol.startsWith('>'); body += line(sx(a), 148, sx(greater ? 30 : 0), 148, 'solution');
      body += `<circle cx="${sx(a)}" cy="148" r="9" class="${result.symbol.includes('=') ? 'point' : 'open-point'}"/>`;
      body += dot(sx(b), 225, `test: ${b}`, 'point-alt');
    }
    body += text(300, 280, result.equation);
  } else if (k === 'coordinates') {
    const sx = n => 300 + n * 19, sy = n => 146 - n * 19;
    for (let i = -6; i <= 6; i++) { body += line(sx(i), sy(-6), sx(i), sy(6), i === 0 ? 'heavy' : 'gridline') + line(sx(-6), sy(i), sx(6), sy(i), i === 0 ? 'heavy' : 'gridline'); if (i !== 0 && i % 2 === 0) body += text(sx(i), 166, i) + text(283, sy(i) + 5, i); }
    if (model.mode === 'rectangle') body += rect(sx(Math.min(a, c)), sy(Math.max(b, d)), Math.abs(c - a) * 19, Math.abs(d - b) * 19, 'shape-light');
    if (model.mode === 'distance') body += line(sx(a), sy(b), sx(c), sy(b), 'solution') + line(sx(c), sy(b), sx(c), sy(d), 'solution');
    body += dot(sx(a), sy(b), `A(${a},${b})`) + dot(sx(c), sy(d), `B(${c},${d})`, 'point-alt') + text(445, 150, 'x') + text(300, 14, 'y');
  } else if (k === 'balance') {
    const tilt = Math.max(-30, Math.min(30, result.value * 3));
    body += `<polygon points="300,145 265,255 335,255" class="shape-light"/>` + line(125, 145 + tilt, 475, 145 - tilt, 'heavy');
    body += rect(60, 50 + tilt, 160, 80, 'shape-light') + text(140, 98 + tilt, `${model.mode === 'add' ? `${c} + ${a}` : `${a} × ${c}`} = ${fmt(result.lhs)}`);
    body += rect(380, 50 - tilt, 160, 80, 'shape-light') + text(460, 98 - tilt, `${b}`) + text(300, 290, result.value === 0 ? 'Balanced: this value solves the equation.' : 'Test another x to make both sides equal.');
  }
  return svg(body, `${result.equation}. ${result.note}`, k === 'coordinates' ? '135 -8 330 305' : '0 0 600 300');
}

export function mountModel(host, model, { initial = model.values, free = null, onChange = () => {}, prefix = 'model', compact = false, level = 'core' } = {}) {
  let values = [...initial], symbol = model.mode === 'entry' ? '>=' : '<=', valid = true, shape = 'prism';
  const fields = controls(model);
  host.innerHTML = `<div class="model-workspace"><div class="model-picture"></div><div class="model-controls">${fields.map((field, i) => field.label === 'Unused' ? '' : `<label for="${prefix}-${i}">${esc(field.label)}<input id="${prefix}-${i}" data-control="${i}" type="number" min="${field.min}" max="${field.max}" step="${field.step}" value="${values[i]}" ${field.min === field.max || free !== null && free !== i ? 'readonly' : ''}></label>`).join('')}${model.kind === 'inequality' ? `<label>Rule<select data-symbol><option value=">=">At least (≥)</option><option value=">">More than (&gt;)</option><option value="<=">At most (≤)</option><option value="<">Less than (&lt;)</option></select></label>` : ''}<button type="button" class="quiet" data-reset>Reset model</button></div></div><p class="model-error" role="status"></p><div class="model-readout" aria-live="polite" aria-atomic="true"></div>`;
  const update = () => {
    const r = evaluate(model, values, { symbol, shape });
    host.querySelector('.model-picture').innerHTML = visual(model, values, r);
    host.querySelector('.model-readout').innerHTML = `<strong>${esc(r.equation)}</strong><p>${esc(r.note)}</p>`;
    onChange([...values], r); return r;
  };
  host.querySelectorAll('[data-control]').forEach(input => input.addEventListener('input', () => {
    const i = Number(input.dataset.control), f = fields[i], n = Number(input.value);
    if (input.value.trim() === '' || !Number.isFinite(n) || n < f.min || n > f.max || Math.abs((n - f.min) / f.step - Math.round((n - f.min) / f.step)) > 1e-7) {
      valid = false; host.querySelector('.model-error').textContent = `Use ${f.min} to ${f.max}, in steps of ${f.step}. The model keeps your last valid value.`; return;
    }
    valid = [...host.querySelectorAll('[data-control]')].every(el => el.value.trim() !== '' && el.validity.valid);
    if (valid) host.querySelector('.model-error').textContent = '';
    values[i] = n; update();
  }));
  const select = host.querySelector('[data-symbol]');
  if (select) { select.value = symbol; select.disabled = free !== null; select.addEventListener('change', () => { symbol = select.value; update(); }); }
  host.querySelector('.model-workspace').dataset.kind = model.kind;
  if (model.kind === 'solid' && model.mode === 'surface' && free === null) {
    const switcher = document.createElement('div'); switcher.className = 'lesson-switch';
    switcher.setAttribute('role', 'group'); switcher.setAttribute('aria-label', 'Choose solid');
    switcher.innerHTML = '<button type="button" data-shape="prism" aria-pressed="true">Prism net</button><button type="button" data-shape="pyramid" aria-pressed="false">Square-pyramid net</button>';
    host.prepend(switcher);
    switcher.querySelectorAll('[data-shape]').forEach(button => button.onclick = () => {
      shape = button.dataset.shape;
      switcher.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      fields.forEach((field, i) => {
        const input = host.querySelector(`[data-control="${i}"]`);
        input.parentElement.hidden = shape === 'pyramid' && i === 1;
        input.parentElement.firstChild.textContent = shape === 'pyramid' ? ['Base side', 'Width', 'Slant height'][i] : field.label;
      });
      update();
    });
  }
  host.querySelector('[data-reset]').addEventListener('click', () => {
    values = [...initial]; valid = true; host.querySelectorAll('[data-control]').forEach(el => { el.value = values[Number(el.dataset.control)]; }); host.querySelector('.model-error').textContent = ''; update();
  });
  update();
  return { get values() { return [...values]; }, get valid() { return valid; }, result: () => evaluate(model, values, { symbol, shape }) };
}

// Student-facing orientation for each live model: what the picture shows and what to watch.
const watch = {
  'array': ['Each square is one seat. Rows run across; the readout multiplies rows by seats per row.', 'Change one number at a time and watch whether the total grows or shrinks.'],
  'data:histogram': ['Each bar counts how many observations fall in one interval of width 5. Bars touch because the intervals are continuous.', 'Move one observation across an interval boundary and watch which bar loses one and which gains one.'],
  'data:box': ['Dots show every observation. The shaded box covers the middle half, from Q1 to Q3, with the median marked inside it.', 'Change only the largest value: the maximum moves, but does the median move?'],
  'data:spread': ['The box shows the middle half. Range measures the whole spread; IQR measures only the box.', 'Try to stretch the range without widening the box.'],
  'data:mean-mad': ['The readout gives the mean (fair share) and MAD, the average distance of the observations from the mean.', 'Make all values closer together and watch the MAD shrink while the mean can stay the same.'],
  'data:outlier': ['One unusual value sits far from the rest. Compare how the mean and the median respond to it.', 'Replace the unusual value with a typical one and compare both measures again.'],
  'decimal': ['The two boxes show price per item and number of items. Their product is the order total.', 'Predict the total before changing a value. Decide whether it should go up or down.'],
  'division': ['The total supply is split into equal shipments. The quotient counts the shipments.', 'Keep the total fixed and make each shipment larger. What happens to the number of shipments?'],
  'ratio': ['Each block is one cup. The top row is the first ingredient; the bottom row is the second.', 'Scale both rows by the same factor and check that the simplified ratio does not change.'],
  'rate': ['Price divided by the number of items gives the unit price in dollars per item.', 'Compare two offers using the same unit, dollars per one item.'],
  'conversion': ['The fixed factor converts one unit to another. The readout multiplies length by that factor.', 'Double the length and check that the converted length also doubles.'],
  'growth': ['Points follow a rule y = (increase per step)·x + starting amount. The highlighted point shows the current input.', 'Change the starting amount and watch the whole line shift without changing its steepness.'],
  'growth:ratio-graph': ['Each point is (carriages, passengers). The line passes through (0, 0) because the relationship is proportional.', 'Change passengers per carriage and watch the steepness of the line.'],
  'percent': ['The hundred grid shades one square for each percent. The readout applies that percent to the whole amount.', 'Keep the percent fixed and change the whole. The shading stays the same while the amount changes.'],
  'percent:whole': ['The grid shows the percent. The readout works backward from a known part to recover the whole.', 'Check the recovered whole: multiply it by the percent as a decimal to get the part back.'],
  'area': ['The dashed segment is the perpendicular height. Area uses base and height, not slanted sides.', 'Double the height and predict whether the area doubles.'],
  'area:trapezoid': ['The two horizontal sides are the parallel bases. The dashed segment is the perpendicular height.', 'Swap the two bases. Does the area change?'],
  'area:polygon': ['The regular polygon is split into congruent triangles meeting at the center. The apothem is each triangle’s height.', 'Add sides while keeping the side length and watch the area grow.'],
  'solid': ['The net shows all faces of the box laid flat. Volume counts the unit cubes that fill it.', 'Change one dimension and predict the new volume before reading it.'],
  'solid:surface': ['The net shows every face. Surface area adds the area of all faces; the pyramid net has one square and four triangles.', 'Switch between prism and pyramid nets and compare how the formulas use the dimensions.'],
  'fraction': ['Each strip is one whole unit, divided into equal parts. A portion uses some of those parts.', 'Make the serving size smaller and predict whether the number of portions grows or shrinks.'],
  'power': ['The expression evaluates the power first, then adds. The picture shows the repeated multiplication.', 'Increase the exponent by one and compare the jump in value with adding one to the base.'],
  'expression': ['The rectangle is split into two parts: a·x and a·b. Together they equal a(x + b).', 'Change x and check that both expression forms still give the same value.'],
  'factors': ['The lists show every factor of each number. The GCF is the largest shared factor; the LCM is the smallest shared multiple.', 'Choose two numbers with no common factor other than 1 and check what happens to the LCM.'],
  'line': ['Both locations sit on one number line. The readout compares them and measures their distance.', 'Place one point at the opposite of the other and watch the distances from zero.'],
  'coordinates': ['Point A and point B sit on a coordinate plane. The readout measures along horizontal and vertical streets.', 'Move one point so both share the same x-coordinate and check which distance becomes zero.'],
  'coordinates:rectangle': ['A and B are opposite corners of a rectangle. Width and height come from the coordinate differences.', 'Move one corner across an axis and check that the width is still a positive length.'],
  'coordinates:reflect': ['The readout lists A’s reflections across each axis. Move B to test which coordinate changes sign.', 'Reflect across the x-axis: x stays the same and y changes sign.'],
  'coordinates:symmetry': ['The readout lists A’s reflections across each axis. Move B to test which coordinate changes sign.', 'Reflect across the y-axis: y stays the same and x changes sign.'],
  'balance': ['The scale tips toward the heavier side. It balances only when the candidate value of x makes both sides equal.', 'Use the inverse operation to find x, then test it on the scale.'],
  'inequality': ['The highlighted ray shows every value that satisfies the rule. An open circle excludes the boundary; a closed circle includes it.', 'Test the boundary value itself and explain whether it qualifies.'],
};
export function guidance(model) {
  const [show, tip] = watch[`${model.kind}:${model.mode}`] || watch[model.kind] || ['The picture updates as you change the controls.', 'Change one quantity at a time and record what the readout shows.'];
  return { show, tip };
}
