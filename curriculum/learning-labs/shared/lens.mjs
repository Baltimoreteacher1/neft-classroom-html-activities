// A "lens" is the second picture under a lab's model: one extra idea for that lab's mathematics
// (bin width, mean vs median, the 1% unit block, successive discounts, a movable zero, ...).
// A lens never changes the model's values; it reads them and draws something more.
// English and Spanish only. All numbers come from lens-math.mjs, which the tests re-derive.
import * as M from './lens-math.mjs';
import { fmt } from './math.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svg = (body, label, h = 190) => `<svg class="lens-svg" viewBox="0 0 600 ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const rect = (x, y, w, h, cls = 'shape', extra = '') => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" class="${cls}" rx="3" ${extra}/>`;
const line = (x1, y1, x2, y2, cls = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const text = (x, y, t, anchor = 'middle', cls = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${esc(t)}</text>`;
const rows = (list) => `<ul class="lens-list">${list.map((l) => `<li>${l}</li>`).join('')}</ul>`;
const money = (n) => `$${Number(n).toFixed(2)}`;
const minus = (n) => String(n).replace('-', '−');

const choice = (key, options, value) => ({ key, type: 'choice', options, value });
const range = (key, label, min, max, step, value) => ({ key, type: 'range', label, min, max, step, value });
const number = (key, label, value = '') => ({ key, type: 'number', label, value });
const button = (key, label) => ({ key, type: 'button', label });

export const LENSES = {
  'array:estimate': {
    title: ['Assumption slider', 'Control deslizante de suposiciones'],
    intro: ['A real room is never completely full. Change the assumption and watch the safe bounds move.', 'Un salón real nunca está totalmente lleno. Cambia la suposición y mira cómo se mueven los límites.'],
    controls: [range('fill', ['How full is the room (%)', 'Qué tan lleno está el salón (%)'], 40, 100, 5, 80),
      choice('risk', [['over', ['Overestimate is safer', 'Es más seguro sobrestimar']], ['under', ['Underestimate is safer', 'Es más seguro subestimar']]], 'over')],
    render({ values, view, t }) {
      const total = values[0] * values[1], e = M.assumedEstimate(total, view.fill);
      const pick = view.risk === 'over' ? e.high : e.low;
      return svg(rect(40, 60, 520, 34, 'shape-light') + rect(40, 60, 520 * view.fill / 100, 34, 'shape') + line(40 + 520 * Math.max(0, view.fill - 10) / 100, 50, 40 + 520 * Math.max(0, view.fill - 10) / 100, 104, 'heavy') + line(40 + 520 * Math.min(100, view.fill + 10) / 100, 50, 40 + 520 * Math.min(100, view.fill + 10) / 100, 104, 'heavy') + text(300, 140, t(`${view.fill}% of ${total} seats ≈ ${fmt(e.expected)} people`, `${view.fill}% de ${total} asientos ≈ ${fmt(e.expected)} personas`)), t('Bar showing how full the room is, with bounds', 'Barra que muestra qué tan lleno está el salón, con límites'), 160)
        + rows([t(`Safe range: ${e.low} to ${e.high} people (the assumption could be off by 10 points).`, `Rango seguro: de ${e.low} a ${e.high} personas (la suposición puede variar 10 puntos).`),
          view.risk === 'over' ? t(`Ordering for ${pick} people risks waste, but nobody goes without.`, `Pedir para ${pick} personas puede desperdiciar, pero a nadie le falta.`) : t(`Ordering for ${pick} people saves money, but some may go without.`, `Pedir para ${pick} personas ahorra dinero, pero a algunos les puede faltar.`)]);
    },
  },

  'data:histogram': {
    title: ['Bin-width slider', 'Control del ancho de intervalo'],
    intro: ['The data points never change. Only the intervals do, and the shape changes with them.', 'Los datos nunca cambian. Solo cambian los intervalos, y con ellos la forma.'],
    controls: [choice('width', [[2, ['2', '2']], [5, ['5', '5']], [10, ['10', '10']], [20, ['20', '20']]].map(([v, l]) => [v, [`Width ${l[0]}`, `Ancho ${l[1]}`]]), 5)],
    render({ values, view, t }) {
      const b = M.bins(values, view.width), top = Math.max(...b.map((x) => x.n)), w = 500 / b.length, unit = 120 / top;
      let body = line(50, 150, 550, 150);
      b.forEach((x, i) => { body += rect(50 + i * w + 2, 150 - x.n * unit, w - 4, x.n * unit) + (x.n ? text(50 + i * w + w / 2, 144 - x.n * unit, x.n) : '') + text(50 + i * w + w / 2, 170, `${x.from}–${x.to}`, 'middle', 'tick'); });
      return svg(body, t(`Histogram with intervals of width ${view.width}`, `Histograma con intervalos de ancho ${view.width}`), 190)
        + rows([t(`Same ${values.length} observations, now in ${b.length} intervals. The shape looks ${M.shapeWord(b)}.`, `Las mismas ${values.length} observaciones, ahora en ${b.length} intervalos. La forma se ve ${M.shapeWord(b) === 'roughly centered' ? 'más o menos centrada' : 'inclinada hacia un lado'}.`),
          t('Try width 2, then 20. Which one hides the most detail? Which one shows the overall shape best?', 'Prueba el ancho 2 y luego el 20. ¿Cuál oculta más detalles? ¿Cuál muestra mejor la forma general?')]);
    },
  },

  'data:outlier': {
    title: ['Outlier tug-of-war', 'Tira y afloja del valor atípico'],
    intro: ['The largest value is the outlier. Compare each measure with it and without it.', 'El valor más grande es el atípico. Compara cada medida con él y sin él.'],
    controls: [],
    render({ values, t }) {
      const e = M.outlierEffect(values), f = (s) => [fmt(s.mean), fmt(s.median), fmt(s.iqr)];
      const [a, w] = [f(e.all), f(e.without)];
      const rowsHtml = [[t('Mean', 'Media'), a[0], w[0], e.meanShift], [t('Median', 'Mediana'), a[1], w[1], e.medianShift], [t('IQR (box width)', 'RIC (ancho de la caja)'), a[2], w[2], e.iqrShift]]
        .map(([n, x, y, d]) => `<tr><th scope="row">${esc(n)}</th><td>${esc(x)}</td><td>${esc(y)}</td><td>${d === 0 ? t('no change', 'sin cambio') : minus(fmt(d))}</td></tr>`).join('');
      return `<table class="lens-table"><caption>${esc(t(`With and without the outlier (${e.outlier})`, `Con y sin el valor atípico (${e.outlier})`))}</caption><thead><tr><th><span class="lens-sr">${esc(t('Measure', 'Medida'))}</span></th><th>${esc(t('With', 'Con'))}</th><th>${esc(t('Without', 'Sin'))}</th><th>${esc(t('Moved by', 'Cambió'))}</th></tr></thead><tbody>${rowsHtml}</tbody></table>`
        + rows([t(`The mean moved ${fmt(Math.abs(e.meanShift))} while the median moved ${fmt(Math.abs(e.medianShift))}. The outlier pulls the mean, not the median.`, `La media cambió ${fmt(Math.abs(e.meanShift))} y la mediana ${fmt(Math.abs(e.medianShift))}. El valor atípico jala la media, no la mediana.`)]);
    },
  },

  'decimal:receipt': {
    title: ['Estimate first', 'Estima primero'],
    intro: ['Before trusting an exact total, name a low and a high estimate that the total must fall between.', 'Antes de confiar en un total exacto, escribe una estimación baja y una alta entre las que debe caer.'],
    controls: [number('low', ['My low estimate ($)', 'Mi estimación baja ($)']), number('high', ['My high estimate ($)', 'Mi estimación alta ($)']), button('check', ['Check my bounds', 'Comprobar mis límites'])],
    render({ values, view, t }) {
      const b = M.receiptBounds(values[0], values[1]);
      if (!view.check) return rows([t(`Hint: round the price down for the low bound and up for the high bound, then multiply by ${values[1]}.`, `Pista: redondea el precio hacia abajo para el límite bajo y hacia arriba para el alto, y multiplica por ${values[1]}.`)]);
      const verdict = M.boundsCheck(Number(view.low), Number(view.high), b.exact);
      const say = { missing: t('Enter both a low and a high estimate first.', 'Escribe primero una estimación baja y una alta.'),
        swapped: t('Your low estimate is higher than your high one. Swap them.', 'Tu estimación baja es mayor que la alta. Cámbialas.'),
        'too-high-low': t('The exact total is below your low estimate. Lower both bounds.', 'El total exacto está por debajo de tu estimación baja. Baja ambos límites.'),
        'too-low-high': t('The exact total is above your high estimate. Raise both bounds.', 'El total exacto está por encima de tu estimación alta. Sube ambos límites.'),
        wide: t('The exact total is inside, but the range is too wide to be useful. Tighten it.', 'El total exacto está dentro, pero el rango es demasiado amplio. Hazlo más estrecho.'),
        good: t(`Good estimate. The exact total ${money(b.exact)} is between ${money(Number(view.low))} and ${money(Number(view.high))}.`, `Buena estimación. El total exacto ${money(b.exact)} está entre ${money(Number(view.low))} y ${money(Number(view.high))}.`) }[verdict];
      return `<p class="lens-verdict" data-verdict="${verdict}">${esc(say)}</p>`;
    },
  },

  'ratio:mixer': {
    title: ['Pitcher color', 'Color de la jarra'],
    intro: ['A darker pitcher means more concentrate in each cup. Equivalent ratios make the same shade.', 'Una jarra más oscura tiene más concentrado en cada taza. Las razones equivalentes dan el mismo tono.'],
    controls: [range('k', ['Scale both amounts by', 'Multiplica ambas cantidades por'], 1, 5, 1, 3)],
    render({ values, view, t }) {
      const [a, b] = values, s = M.scaledMix(a, b, view.k), c = M.concentration(a, b);
      const jug = (x, label, amounts) => `<g transform="translate(${x},10)"><rect x="0" y="0" width="120" height="110" rx="10" class="jug"/><rect x="0" y="0" width="120" height="110" rx="10" class="juice" style="opacity:${(0.18 + 0.82 * c).toFixed(3)}"/>${text(60, 136, label)}${text(60, 156, amounts, 'middle', 'tick')}</g>`;
      return svg(jug(110, t('Your mix', 'Tu mezcla'), `${a}:${b}`) + jug(370, t(`Scaled by ${view.k}`, `Multiplicada por ${view.k}`), `${s.a}:${s.b}`) + text(300, 80, s.same ? '=' : '≠', 'middle', 'big'), t(`Two pitchers: ${a}:${b} and ${s.a}:${s.b}, same shade`, `Dos jarras: ${a}:${b} y ${s.a}:${s.b}, mismo tono`), 176)
        + rows([t(`Concentrate is ${a} of every ${a + b} cups in both pitchers (${Math.round(c * 100)}%). Same ratio, same taste.`, `El concentrado es ${a} de cada ${a + b} tazas en ambas jarras (${Math.round(c * 100)}%). Misma razón, mismo sabor.`)]);
    },
  },

  'conversion:scale': {
    title: ['Add or multiply?', '¿Sumar o multiplicar?'],
    intro: ['Grow a 3 by 2 blueprint two ways. Only multiplying keeps the shape.', 'Agranda un plano de 3 por 2 de dos maneras. Solo multiplicar conserva la forma.'],
    controls: [range('k', ['Grow by (×k or +k)', 'Crecer por (×k o +k)'], 1, 6, 1, 2)],
    render({ view, t }) {
      const p = M.blueprint(view.k), unit = 150 / Math.max(p.mult.w, p.add.w), draw = (x, r, label, cls) => rect(x, 20, r.w * unit, r.h * unit, cls) + text(x + r.w * unit / 2, 20 + r.h * unit + 22, label);
      return svg(draw(30, { w: 3, h: 2 }, '3 × 2', 'shape-light') + draw(220, p.mult, `${p.mult.w} × ${p.mult.h} (×${view.k})`, 'shape') + draw(410, p.add, `${p.add.w} × ${p.add.h} (+${view.k})`, 'shape-alt'), t('Three blueprints: original, multiplied, added', 'Tres planos: original, multiplicado, sumado'), 210)
        + rows([t(`Multiplying keeps width : height at ${fmt(p.original)}. Adding changes it to ${fmt(Math.round(p.addRatio * 100) / 100)}${p.distorted ? ', so the drawing is stretched out of shape' : ''}.`, `Multiplicar mantiene ancho : alto en ${fmt(p.original)}. Sumar lo cambia a ${fmt(Math.round(p.addRatio * 100) / 100)}${p.distorted ? ', y el dibujo se deforma' : ''}.`)]);
    },
  },

  'rate:shopping': {
    title: ['Real-world limits', 'Límites del mundo real'],
    intro: ['The cheapest unit price is not always the best buy. Set a budget and a storage limit.', 'El precio unitario más bajo no siempre es la mejor compra. Fija un presupuesto y un límite de espacio.'],
    controls: [range('budget', ['Cash budget ($)', 'Presupuesto en efectivo ($)'], 5, 100, 5, 40), range('storage', ['Storage space (items)', 'Espacio de almacenamiento (artículos)'], 6, 60, 2, 24)],
    render({ values, view, t }) {
      const res = M.bestBuy([{ name: t('Your pack', 'Tu paquete'), price: values[0], items: values[1] }, { name: t('Reference pack', 'Paquete de referencia'), price: 10, items: 6 }], view.budget, view.storage);
      const best = res.reduce((x, y) => (y.items > x.items ? y : x));
      return `<table class="lens-table"><thead><tr><th><span class="lens-sr">${esc(t('Measure', 'Medida'))}</span></th><th>${esc(t('Unit price', 'Precio unitario'))}</th><th>${esc(t('Packs', 'Paquetes'))}</th><th>${esc(t('Items', 'Artículos'))}</th><th>${esc(t('Limited by', 'Limitado por'))}</th></tr></thead><tbody>${res.map((r) => `<tr><th scope="row">${esc(r.name)}</th><td>${money(r.unit)}</td><td>${r.packs}</td><td>${r.items}</td><td>${r.packs ? esc(r.limit === 'budget' ? t('budget', 'presupuesto') : t('storage', 'espacio')) : '—'}</td></tr>`).join('')}</tbody></table>`
        + rows([best.items ? t(`${best.name} gets you the most items (${best.items}) within both limits.`, `${best.name} te da más artículos (${best.items}) dentro de ambos límites.`) : t('Neither pack fits both limits. Raise the budget or the storage.', 'Ningún paquete cumple ambos límites. Sube el presupuesto o el espacio.')]);
    },
  },

  'percent:grid': {
    title: ['Four-way translator', 'Traductor de cuatro formas'],
    intro: ['One color, five names. Then zoom inside a single square to see fractional percents.', 'Un color, cinco nombres. Luego acércate a un solo cuadro para ver porcentajes fraccionarios.'],
    controls: [range('f', ['Zoom into a percent (like 12.5)', 'Acércate a un porcentaje (como 12.5)'], 0.5, 100, 0.5, 12.5)],
    render({ values, view, t }) {
      const p = M.percentForms(values[0]), z = M.zoomPercent(view.f);
      let body = text(300, 18, t('One square is 1% = 10 tenths of a percent', 'Un cuadro es 1% = 10 décimas de porcentaje'));
      for (let i = 0; i < 10; i++) body += rect(60 + i * 48, 36, 44, 44, i < z.tenths ? 'shape' : 'shape-light');
      body += text(300, 104, t(`${fmt(view.f)}% = ${z.whole} whole square${z.whole === 1 ? '' : 's'} + ${z.tenths} tenth${z.tenths === 1 ? '' : 's'} of the next square`, `${fmt(view.f)}% = ${z.whole} cuadro${z.whole === 1 ? '' : 's'} entero${z.whole === 1 ? '' : 's'} + ${z.tenths} décima${z.tenths === 1 ? '' : 's'} del siguiente`));
      return `<table class="lens-table"><caption>${esc(t(`${values[0]} shaded squares, said five ways`, `${values[0]} cuadros sombreados, dichos de cinco maneras`))}</caption><tbody><tr><th scope="row">${esc(t('Fraction', 'Fracción'))}</th><td>${p.fraction}</td><th scope="row">${esc(t('Simplified', 'Simplificada'))}</th><td>${p.simpleOnly ? t('already simplest', 'ya es la más simple') : p.simple}</td></tr><tr><th scope="row">${esc(t('Decimal', 'Decimal'))}</th><td>${fmt(p.decimal)}</td><th scope="row">${esc(t('Percent', 'Porcentaje'))}</th><td>${p.percent}</td></tr><tr><th scope="row">${esc(t('Ratio', 'Razón'))}</th><td>${p.ratio}</td><th scope="row">${esc(t('Simplified', 'Simplificada'))}</th><td>${p.simpleRatio}</td></tr></tbody></table>`
        + svg(body, t('Zoom into one square', 'Acercamiento a un cuadro'), 120) + rows([t(`${fmt(view.f)}% is ${z.per1000} of the whole.`, `${fmt(view.f)}% es ${z.per1000} del total.`)]);
    },
  },

  'percent:discount': {
    title: ['Two discounts in a row', 'Dos descuentos seguidos'],
    intro: ['The second discount is taken from a smaller price. So two discounts do not add up.', 'El segundo descuento se calcula sobre un precio menor. Por eso dos descuentos no se suman.'],
    controls: [range('second', ['Second discount (%)', 'Segundo descuento (%)'], 5, 50, 5, 10)],
    render({ values, view, t }) {
      const [first, price] = values, s = M.successive(price, first, view.second), sx = (v) => 40 + 520 * v / price;
      const bar = (y, v, label, cls) => rect(40, y, 520, 26, 'shape-light') + rect(40, y, sx(v) - 40, 26, cls) + text(46, y + 18, label, 'start', 'on-fill');
      return svg(bar(14, price, t(`Original ${money(price)}`, `Original ${money(price)}`), 'shape') + bar(50, s.after1, t(`After ${first}% off: ${money(s.after1)}`, `Después de ${first}% menos: ${money(s.after1)}`), 'shape') + bar(86, s.after2, t(`Then ${view.second}% off that: ${money(s.after2)}`, `Luego ${view.second}% menos: ${money(s.after2)}`), 'shape-alt') + bar(132, s.naive, t(`${first + view.second}% off at once: ${money(s.naive)}`, `${first + view.second}% menos de una vez: ${money(s.naive)}`), 'shape-light'), t('Price bars shrinking after each discount', 'Barras de precio que se reducen con cada descuento'), 176)
        + rows([t(`${first}% then ${view.second}% off equals ${fmt(s.equivalentOff)}% off, not ${first + view.second}%. The second discount applies to a smaller whole (${money(s.after1)}).`, `${first}% y luego ${view.second}% equivale a ${fmt(s.equivalentOff)}% menos, no ${first + view.second}%. El segundo descuento se aplica a un total menor (${money(s.after1)}).`), t(`You pay ${money(Math.abs(s.gap))} more than the "${first + view.second}% off" sign suggests.`, `Pagas ${money(Math.abs(s.gap))} más de lo que sugiere el letrero de "${first + view.second}% menos".`)]);
    },
  },

  'percent:whole': {
    title: ['The 1% block', 'El bloque del 1%'],
    intro: ['Find what 1% is worth, then stretch it. Every percent is a number of those blocks.', 'Halla cuánto vale el 1% y luego estíralo. Cada porcentaje es un número de esos bloques.'],
    controls: [range('s', ['Stretch to this percent', 'Estirar a este porcentaje'], 1, 100, 1, 100)],
    render({ values, view, t }) {
      const [p, part] = values, u = M.unitBlock(part, p);
      let body = '';
      for (let i = 0; i < 100; i++) body += rect(30 + (i % 50) * 10.4, 18 + Math.floor(i / 50) * 22, 9.4, 18, i < view.s ? (i < p ? 'shape' : 'shape-alt') : 'shape-light');
      return svg(body + text(300, 82, t(`1% = ${fmt(u.one)}   ·   ${view.s}% = ${view.s} × ${fmt(u.one)} = ${fmt(u.at(view.s))}`, `1% = ${fmt(u.one)}   ·   ${view.s}% = ${view.s} × ${fmt(u.one)} = ${fmt(u.at(view.s))}`)), t('A hundred small blocks, each worth 1%', 'Cien bloques pequeños, cada uno vale 1%'), 100)
        + rows([t(`${part} is ${p}%, so one block is ${part} ÷ ${p} = ${fmt(u.one)}. The whole is 100 × ${fmt(u.one)} = ${fmt(u.whole)}.`, `${part} es ${p}%, así que un bloque es ${part} ÷ ${p} = ${fmt(u.one)}. El total es 100 × ${fmt(u.one)} = ${fmt(u.whole)}.`)]);
    },
  },

  'area:triangle': {
    title: ['Cut and hinge', 'Cortar y girar'],
    intro: ['Cut a parallelogram two ways. Only the perpendicular cut slides into a rectangle.', 'Corta un paralelogramo de dos maneras. Solo el corte perpendicular se desliza para formar un rectángulo.'],
    controls: [choice('cut', [['altitude', ['Cut along the height', 'Cortar por la altura']], ['slant', ['Cut along the slanted side', 'Cortar por el lado inclinado']], ['twin', ['Two triangles', 'Dos triángulos']]], 'altitude')],
    render({ values, view, t }) {
      const [b, h] = values, o = 3, c = M.parallelogramCut(b, h, o), sc = Math.min(260 / (b + o), 120 / h), x0 = 20, y0 = 20, H = h * sc, B = b * sc, O = o * sc;
      const para = (x, cut) => `<polygon points="${x + O},${y0} ${x + O + B},${y0} ${x + B},${y0 + H} ${x},${y0 + H}" class="shape-light"/>${cut}`;
      let left = para(x0, view.cut === 'altitude' ? line(x0 + O, y0, x0 + O, y0 + H, 'heavy') : view.cut === 'slant' ? line(x0 + O, y0, x0, y0 + H, 'heavy') : line(x0 + O, y0, x0 + B, y0 + H, 'heavy'));
      let right;
      if (view.cut === 'altitude') right = rect(330, y0, B, H, 'shape') + text(330 + B / 2, y0 + H + 22, `${b} × ${h} = ${c.area}`);
      else if (view.cut === 'slant') right = `<polygon points="${330 + O},${y0} ${330 + O + B},${y0} ${330 + B},${y0 + H} ${330},${y0 + H}" class="shape-alt"/>` + text(330 + B / 2, y0 + H + 22, t('slanted ends: not a rectangle', 'extremos inclinados: no es un rectángulo'));
      else right = `<polygon points="${330 + O},${y0} ${330 + O + B},${y0} ${330 + B},${y0 + H}" class="shape"/>` + text(330 + B / 2, y0 + H + 22, t(`one triangle = ${b} × ${h} ÷ 2 = ${c.triangleArea}`, `un triángulo = ${b} × ${h} ÷ 2 = ${c.triangleArea}`));
      return svg(left + right, t('Parallelogram cut and rearranged', 'Paralelogramo cortado y reorganizado'), 190)
        + rows([view.cut === 'altitude' ? t(`The perpendicular cut moves a right triangle to the other end. Area = base × height = ${c.area}.`, `El corte perpendicular mueve un triángulo rectángulo al otro extremo. Área = base × altura = ${c.area}.`)
          : view.cut === 'slant' ? t(`The slanted side is ${fmt(Math.round(c.slant * 100) / 100)}, longer than the height ${h}. Sliding it never makes square corners.`, `El lado inclinado mide ${fmt(Math.round(c.slant * 100) / 100)}, más que la altura ${h}. Deslizarlo nunca da esquinas cuadradas.`)
            : t(`A diagonal makes two identical triangles (turn one 180°). Each is half: ${c.triangleArea}.`, `Una diagonal forma dos triángulos idénticos (gira uno 180°). Cada uno es la mitad: ${c.triangleArea}.`)]);
    },
  },

  'area:trapezoid': {
    title: ['Overlap and gap scanner', 'Escáner de traslapes y huecos'],
    intro: ['Two rooms share a wall. Red is counted twice; amber is not counted at all.', 'Dos cuartos comparten una pared. Rojo se cuenta dos veces; ámbar no se cuenta.'],
    controls: [range('dx', ['Slide the second room right', 'Desliza el segundo cuarto a la derecha'], 0, 8, 1, 4), range('dy', ['Slide the second room down', 'Desliza el segundo cuarto hacia abajo'], 0, 6, 1, 2)],
    render({ view, t }) {
      const w1 = 6, h1 = 4, w2 = 5, h2 = 4, s = M.overlapScan(w1, h1, w2, h2, view.dx, view.dy), u = Math.min(560 / s.bw, 150 / s.bh), x0 = 20, y0 = 14;
      let body = rect(x0, y0, s.bw * u, s.bh * u, 'amber');
      body += rect(x0, y0, w1 * u, h1 * u, 'shape') + rect(x0 + view.dx * u, y0 + view.dy * u, w2 * u, h2 * u, 'shape');
      const ox = Math.max(0, Math.min(w1, view.dx + w2) - view.dx), oy = Math.max(0, Math.min(h1, view.dy + h2) - view.dy);
      if (ox && oy) body += rect(x0 + view.dx * u, y0 + view.dy * u, ox * u, oy * u, 'red');
      return svg(body, t('Two rectangles with overlap in red and uncounted space in amber', 'Dos rectángulos con traslape en rojo y espacio sin contar en ámbar'), 190)
        + rows([s.overlap ? t(`Adding the rooms gives ${s.sum}, but the true area is ${s.union}: ${s.overlap} was counted twice.`, `Sumar los cuartos da ${s.sum}, pero el área real es ${s.union}: ${s.overlap} se contó dos veces.`) : t(`The rooms do not overlap, so adding them is exact: ${s.sum}.`, `Los cuartos no se traslapan, así que sumarlos es exacto: ${s.sum}.`), t(`Inside the bounding box, ${s.gap} square units are not part of either room.`, `Dentro del rectángulo que los contiene, ${s.gap} unidades cuadradas no son de ningún cuarto.`)]);
    },
  },

  'fraction:servings': {
    title: ['Leftover compared to one serving', 'Sobrante comparado con una porción'],
    intro: ['The leftover is measured against the serving size, not against the whole.', 'El sobrante se mide contra el tamaño de la porción, no contra el entero.'],
    controls: [],
    render({ values, t }) {
      const [supply, num, den] = values, r = M.remainderOfScoop(Math.round(supply * 2), num, den), unit = Math.min(60, 500 / (r.whole + 1));
      let body = '';
      for (let i = 0; i < r.whole; i++) body += rect(40 + i * unit, 30, unit - 4, 60, 'shape') + text(40 + i * unit + unit / 2, 66, '1');
      if (r.remN) body += rect(40 + r.whole * unit, 30, (unit - 4) * r.fractionOfScoop, 60, 'shape-alt') + rect(40 + r.whole * unit, 30, unit - 4, 60, 'outline');
      return svg(body + text(300, 130, r.remN ? t(`${r.whole} full servings + ${r.remN}/${r.remD} of a serving`, `${r.whole} porciones completas + ${r.remN}/${r.remD} de una porción`) : t(`${r.whole} full servings, nothing left over`, `${r.whole} porciones completas, no sobra nada`)), t('Strip of full servings and a partial one', 'Tira de porciones completas y una parcial'), 150)
        + rows([t(`The leftover is ${r.remN ? `${r.remN}/${r.remD} of one serving (${num}/${den})` : 'zero'}. Its size is compared with the serving, which is the divisor.`, `El sobrante es ${r.remN ? `${r.remN}/${r.remD} de una porción (${num}/${den})` : 'cero'}. Su tamaño se compara con la porción, que es el divisor.`)]);
    },
  },

  'expression:equivalence': {
    title: ['Substitution machine', 'Máquina de sustitución'],
    intro: ['Try many values of x. Equivalent expressions match every time. A wrong one never does.', 'Prueba muchos valores de x. Las expresiones equivalentes coinciden siempre. Una incorrecta nunca.'],
    controls: [],
    render({ values, t }) {
      const [a, b] = values, xs = Array.from({ length: 6 }, (_, i) => M.expressionRow(a, b, i));
      const head = `<tr><th>x</th>${xs.map((r) => `<th>${r.x}</th>`).join('')}</tr>`;
      const rowOf = (label, key) => `<tr><th scope="row">${label}</th>${xs.map((r) => `<td class="${key === 'wrong' && r.wrong !== r.factored ? 'bad' : ''}">${r[key]}</td>`).join('')}</tr>`;
      return `<table class="lens-table"><caption>${esc(t('Three expressions, same values of x', 'Tres expresiones, los mismos valores de x'))}</caption><thead>${head}</thead><tbody>${rowOf(`${a}(x + ${b})`, 'factored')}${rowOf(`${a}x + ${a * b}`, 'distributed')}${rowOf(`${a}x + ${b}`, 'wrong')}</tbody></table>`
        + rows([t(`${a}(x + ${b}) and ${a}x + ${a * b} are equal at every x. ${a}x + ${b} is always ${(a - 1) * b} less, so it is not equivalent.`, `${a}(x + ${b}) y ${a}x + ${a * b} son iguales para todo x. ${a}x + ${b} siempre es ${(a - 1) * b} menos, así que no es equivalente.`)]);
    },
  },

  'line:opposites': {
    title: ['Movable zero', 'Cero movible'],
    intro: ['Position depends on where you call zero. Distance from that zero is always positive.', 'La posición depende de dónde llames cero. La distancia desde ese cero siempre es positiva.'],
    controls: [range('ref', ['Reference zero at', 'Cero de referencia en'], -10, 10, 1, 0)],
    render({ values, view, t }) {
      const x = values[0], f = M.fromReference(x, view.ref), sx = (n) => 40 + (n + 10) * 26;
      let body = line(40, 70, 560, 70);
      for (let n = -10; n <= 10; n += 2) body += line(sx(n), 64, sx(n), 76) + text(sx(n), 98, minus(n), 'middle', 'tick');
      body += line(sx(view.ref), 40, sx(view.ref), 100, 'heavy') + text(sx(view.ref), 32, t('reference zero', 'cero de referencia')) + `<circle cx="${sx(x)}" cy="70" r="8" class="point"/>`;
      return svg(body, t('Number line with a movable reference zero', 'Recta numérica con un cero de referencia movible'), 120)
        + rows([t(`Signed position from the reference zero: ${minus(f.signed)}. Distance from it: ${f.distance}.`, `Posición con signo desde el cero de referencia: ${minus(f.signed)}. Distancia desde él: ${f.distance}.`), t(`From the true zero the distance is |${minus(x)}| = ${f.fromZero}.`, `Desde el cero verdadero la distancia es |${minus(x)}| = ${f.fromZero}.`)]);
    },
  },

  'coordinates:rectangle': {
    title: ['Street-route distance', 'Distancia por calles'],
    intro: ['Travel along streets: across, then up or down. Absolute value keeps each leg positive.', 'Viaja por las calles: horizontal y luego vertical. El valor absoluto mantiene cada tramo positivo.'],
    controls: [],
    render({ values, t }) {
      const [x1, y1, x2, y2] = values, r = M.taxicab(x1, y1, x2, y2), sx = (n) => 300 + n * 36, sy = (n) => 100 - n * 14;
      const body = line(40, sy(0), 560, sy(0)) + line(sx(0), 10, sx(0), 190) + line(sx(x1), sy(y1), sx(x2), sy(y1), 'heavy') + line(sx(x2), sy(y1), sx(x2), sy(y2), 'heavy-alt') + `<circle cx="${sx(x1)}" cy="${sy(y1)}" r="7" class="point"/><circle cx="${sx(x2)}" cy="${sy(y2)}" r="7" class="point-alt"/>` + text(sx(x1), sy(y1) - 12, 'A') + text(sx(x2), sy(y2) - 12, 'B') + text(sx(-x1), sy(y1), "A′", 'middle', 'ghost') + text(sx(x1), sy(-y1), "A″", 'middle', 'ghost');
      return svg(body, t('Street route between A and B on a coordinate plane', 'Ruta por calles entre A y B en un plano cartesiano'), 200)
        + rows([`|${minus(x1)} − (${minus(x2)})| + |${minus(y1)} − (${minus(y2)})| = ${r.dx} + ${r.dy} = ${r.total}`, t(`A′ and A″ are A reflected across the y-axis and the x-axis.`, `A′ y A″ son A reflejado sobre el eje y y el eje x.`)]);
    },
  },

  'balance:add': {
    title: ['Balance tape', 'Cinta de la balanza'],
    intro: ['Whatever you do to one side, do to the other. The tape records both sides together.', 'Lo que hagas en un lado, hazlo en el otro. La cinta anota ambos lados juntos.'],
    controls: [button('step', ['Undo the addition on both sides', 'Deshacer la suma en ambos lados'])],
    render({ values, view, t }) {
      const [a, b] = values, tape = M.balanceTape('add', a, b);
      const entries = [`<tr><td>x + ${a}</td><td>=</td><td>${b}</td><td>${esc(t('start', 'inicio'))}</td></tr>`];
      if (view.step) entries.push(`<tr class="lens-new"><td class="lens-left">${esc(tape.left)}</td><td>=</td><td class="lens-right">${esc(tape.right)}</td><td>${esc(t('same move, both sides', 'mismo paso, ambos lados'))}</td></tr><tr class="lens-new"><td>x</td><td>=</td><td>${tape.x}</td><td>${esc(t('solved', 'resuelto'))}</td></tr>`);
      return `<table class="lens-table lens-tape"><thead><tr><th>${esc(t('Left', 'Izquierda'))}</th><th><span class="lens-sr">${esc(t('Equals', 'Igual'))}</span></th><th>${esc(t('Right', 'Derecha'))}</th><th>${esc(t('Move', 'Paso'))}</th></tr></thead><tbody>${entries.join('')}</tbody></table>`;
    },
  },

  'balance:multiply': {
    title: ['Lock tester', 'Probador de la cerradura'],
    intro: ['Plug your solution back in. The vault opens only when both sides match.', 'Sustituye tu solución. La bóveda solo abre cuando ambos lados coinciden.'],
    controls: [button('test', ['Test my x', 'Probar mi x'])],
    render({ values, view, t }) {
      const [a, b, c] = values, r = M.lockTest('multiply', a, b, c);
      if (!view.test) return rows([t(`Set "Candidate value of x", then press the button to test ${a}x = ${b}.`, `Elige el "Valor candidato de x" y presiona el botón para probar ${a}x = ${b}.`)]);
      return `<ol class="lens-steps"><li>${esc(`${a}x = ${b}`)}</li><li>${esc(t(`Put x = ${c}:`, `Pon x = ${c}:`))} ${a} × ${c} = ${r.lhs}</li><li>${r.lhs} ${r.open ? '=' : '≠'} ${r.rhs}</li><li class="lens-verdict" data-open="${r.open}">${esc(r.open ? t('Unlocked: this x makes the equation true.', 'Abierta: esta x hace verdadera la ecuación.') : t(`Still locked: ${r.lhs} is ${r.lhs > r.rhs ? 'too big' : 'too small'}.`, `Sigue cerrada: ${r.lhs} es ${r.lhs > r.rhs ? 'demasiado' : 'muy poco'}.`))}</li></ol>`;
    },
  },

  'inequality:budget': {
    title: ['Two layers', 'Dos capas'],
    intro: ['Layer 1 is every number that works. Layer 2 keeps only what makes sense for real objects.', 'La capa 1 son todos los números que cumplen. La capa 2 conserva solo los que tienen sentido con objetos reales.'],
    controls: [choice('layer', [['math', ['Layer 1: all numbers', 'Capa 1: todos los números']], ['real', ['Layer 2: whole tickets only', 'Capa 2: solo boletos enteros']]], 'math')],
    render({ values, view, t }) {
      const bound = values[0], sx = (n) => 40 + n * 17;
      let body = line(40, 70, 560, 70);
      for (let n = 0; n <= 30; n += 5) body += line(sx(n), 64, sx(n), 76) + text(sx(n), 98, n, 'middle', 'tick');
      if (view.layer === 'math') body += `<line x1="${sx(0)}" y1="70" x2="${sx(bound)}" y2="70" class="ray"/><circle cx="${sx(bound)}" cy="70" r="7" class="point"/>`;
      else M.wholeDomain(bound, '<=').forEach((n) => { body += `<circle cx="${sx(n)}" cy="70" r="5" class="point"/>`; });
      const d = M.wholeDomain(bound, '<=');
      return svg(body, t('Number line for x ≤ boundary', 'Recta numérica para x ≤ límite'), 120)
        + rows([view.layer === 'math' ? t(`x ≤ ${bound}: every number from 0 up to ${bound}, including decimals.`, `x ≤ ${bound}: todos los números de 0 a ${bound}, incluidos los decimales.`) : t(`Only whole numbers count, so there are ${d.length} choices: 0 to ${bound}.`, `Solo cuentan los números enteros, así que hay ${d.length} opciones: de 0 a ${bound}.`)]);
    },
  },

  'growth:future': {
    title: ['Rule tester', 'Probador de reglas'],
    intro: ['Look at Case 1, 2, 3, then guess the rule for Case n. Test it on cases you did not look at.', 'Mira los casos 1, 2 y 3, y adivina la regla del caso n. Pruébala con casos que no miraste.'],
    controls: [number('m', ['Change per case (m)', 'Cambio por caso (m)']), number('k', ['Starting amount (k)', 'Cantidad inicial (k)']), button('test', ['Test y = m·n + k', 'Probar y = m·n + k'])],
    render({ values, view, t }) {
      const [a, b] = values;
      let body = '';
      for (let n = 1; n <= 4; n++) { const tiles = a * n + b; for (let i = 0; i < Math.min(tiles, 24); i++) body += rect(30 + (n - 1) * 142 + (i % 6) * 18, 20 + Math.floor(i / 6) * 18, 15, 15, i < b ? 'shape-alt' : 'shape'); body += text(30 + (n - 1) * 142 + 54, 120, t(`Case ${n}: ${tiles}`, `Caso ${n}: ${tiles}`)); }
      let out = svg(body, t('Tile patterns for cases 1 to 4', 'Patrones de fichas para los casos 1 a 4'), 134);
      if (!view.test) return out + rows([t('Enter m and k, then test your rule against six cases.', 'Escribe m y k, y prueba tu regla con seis casos.')]);
      const m = Number(view.m), k = Number(view.k);
      if (!Number.isFinite(m) || !Number.isFinite(k)) return out + rows([t('Enter numbers for m and k.', 'Escribe números para m y k.')]);
      const r = M.ruleCheck(a, b, m, k);
      return out + `<p class="lens-verdict" data-ok="${r.ok}">${esc(r.ok ? t(`Your rule matches all six cases: y = ${m}n + ${k}.`, `Tu regla coincide con los seis casos: y = ${m}n + ${k}.`) : t(`Counterexample: Case ${r.firstMiss.n} has ${r.firstMiss.actual}, your rule says ${r.firstMiss.guess}.`, `Contraejemplo: el caso ${r.firstMiss.n} tiene ${r.firstMiss.actual}, tu regla dice ${r.firstMiss.guess}.`))}</p>`;
    },
  },
};

export const lensFor = (model) => LENSES[`${model.kind}:${model.mode}`] || null;

const ctl = (c, view, es, id) => {
  const label = c.label ? (es ? c.label[1] : c.label[0]) : '';
  if (c.type === 'choice') return `<div class="lens-choice" role="group" aria-label="${esc(label)}">${c.options.map(([v, l]) => `<button type="button" class="quiet small" data-lens-choice="${c.key}" data-value="${esc(v)}" aria-pressed="${String(view[c.key]) === String(v)}">${esc(es ? l[1] : l[0])}</button>`).join('')}</div>`;
  if (c.type === 'button') return `<button type="button" class="small" data-lens-button="${c.key}">${esc(es ? c.label[1] : c.label[0])}</button>`;
  const attrs = c.type === 'range' ? `type="range" min="${c.min}" max="${c.max}" step="${c.step}"` : 'type="number" inputmode="decimal" step="any"';
  return `<label for="${id}-${c.key}">${esc(label)}${c.type === 'range' ? ` <output data-lens-out="${c.key}">${esc(view[c.key])}</output>` : ''}<input id="${id}-${c.key}" ${attrs} data-lens-input="${c.key}" value="${esc(view[c.key])}"></label>`;
};

/** Mount a lens under a model workspace. Returns {update(values, result)} or null when this model has none. */
export function mountLens(host, model, { lang = () => 'en', prefix = 'lens' } = {}) {
  const spec = lensFor(model);
  if (!spec) return null;
  const fresh = () => Object.fromEntries(spec.controls.filter((c) => c.type !== 'button').map((c) => [c.key, c.value]));
  let view = fresh(), last = null;
  const section = document.createElement('section');
  section.className = 'model-lens';
  section.setAttribute('aria-labelledby', `${prefix}-title`);
  host.append(section);
  const draw = (full) => {
    const es = lang() === 'es', t = (en, sp) => (es ? sp : en);
    if (full) section.innerHTML = `<h3 id="${prefix}-title">${esc(es ? spec.title[1] : spec.title[0])}</h3><p class="field-hint">${esc(es ? spec.intro[1] : spec.intro[0])}</p><div class="lens-controls">${spec.controls.map((c) => ctl(c, view, es, prefix)).join('')}</div><div class="lens-body" aria-live="polite"></div>`;
    if (last) section.querySelector('.lens-body').innerHTML = spec.render({ values: last.values, result: last.result, view, t });
  };
  section.addEventListener('input', (e) => {
    const el = e.target.closest('[data-lens-input]');
    if (!el) return;
    view[el.dataset.lensInput] = el.type === 'range' ? Number(el.value) : el.value;
    const out = section.querySelector(`[data-lens-out="${el.dataset.lensInput}"]`);
    if (out) out.textContent = el.value;
    if (el.type === 'number') view.check = view.test = view.step = false;
    draw(false);
  });
  section.addEventListener('click', (e) => {
    const c = e.target.closest('[data-lens-choice]'), b = e.target.closest('[data-lens-button]');
    if (c) {
      const key = c.dataset.lensChoice, opt = spec.controls.find((x) => x.key === key).options.find(([v]) => String(v) === c.dataset.value);
      view[key] = opt[0];
      section.querySelectorAll(`[data-lens-choice="${key}"]`).forEach((n) => n.setAttribute('aria-pressed', String(n === c)));
      draw(false);
    } else if (b) { view[b.dataset.lensButton] = true; draw(false); }
  });
  draw(true);
  return {
    update(values, result) { last = { values, result }; draw(false); },
    reset() { view = fresh(); draw(true); },
  };
}
