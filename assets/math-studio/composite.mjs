// Composite Figures (5-4): an L-shaped figure (a W × H rectangle with a w × h corner missing). Find its area two
// ways: split it into two rectangles and add, or take the whole rectangle and subtract the missing corner. Both give
// the same area. Explorer interface.
import { bi } from './items.mjs';

export function areas({ W, H, w, h }) {
  const bottom = W * (H - h), top = (W - w) * h, whole = W * H, corner = w * h;
  return { bottom, top, whole, corner, area: bottom + top };
}
export const initialState = (cfg) => ({ W: cfg.W, H: cfg.H, w: cfg.w, h: cfg.h, method: 'split' });

export function questions(s, lessonId) {
  const a = areas(s);
  return [
    { id: `cf-${s.W}x${s.H}-${s.w}x${s.h}`, kind: 'num', lessonId, prompt: `An L-shaped figure is a ${s.W} by ${s.H} rectangle with a ${s.w} by ${s.h} corner missing. What is its area in square units?`, promptEs: `Una figura en forma de L es un rectángulo de ${s.W} por ${s.H} al que le falta una esquina de ${s.w} por ${s.h}. ¿Cuál es su área en unidades cuadradas?`, answer: a.area, hints: ['Split it into two rectangles, or subtract the missing corner from the whole rectangle.', `Whole rectangle: ${s.W} × ${s.H} = ${a.whole}. Missing corner: ${s.w} × ${s.h} = ${a.corner}.`], explanation: `${a.whole} − ${a.corner} = ${a.area}, the same as ${a.bottom} + ${a.top} = ${a.area}.`, mistakes: [{ answer: a.whole, feedback: 'That is the whole rectangle. Part of it is missing: subtract the corner.' }, { answer: a.whole + a.corner, feedback: 'The corner is missing, so subtract its area instead of adding it.' }] },
    { id: `cf-${s.W}x${s.H}-${s.w}x${s.h}-top`, kind: 'num', lessonId, prompt: `Split the figure into a bottom rectangle (${s.W} by ${s.H - s.h}) and a top rectangle. What is the area of the top rectangle?`, promptEs: `Divide la figura en un rectángulo de abajo (${s.W} por ${s.H - s.h}) y uno de arriba. ¿Cuál es el área del rectángulo de arriba?`, answer: a.top, hints: [`The top rectangle is ${s.h} tall.`, `Its width is the full width minus the missing part: ${s.W} − ${s.w} = ${s.W - s.w}.`], explanation: `${s.W - s.w} × ${s.h} = ${a.top}.`, mistakes: [{ answer: s.W * s.h, feedback: `The top rectangle is not the full ${s.W} wide: ${s.w} of it is missing.` }] },
  ];
}
export function transfer(s, round, lessonId) {
  const W = 8 + (round % 6), H = 7 + ((round * 2) % 5), w = 2 + (round % 3), h = 2 + ((round + 1) % 3);
  const a = areas({ W, H, w, h });
  return { id: `cf-t-${W}${H}${w}${h}`, kind: 'num', lessonId, prompt: `New problem, no model: a ${W} by ${H} rectangle has a ${w} by ${h} corner cut out. What is the area that is left?`, promptEs: `Problema nuevo, sin el modelo: a un rectángulo de ${W} por ${H} se le corta una esquina de ${w} por ${h}. ¿Cuál es el área que queda?`, answer: a.area, hints: ['Whole rectangle minus the corner.'], explanation: `${W} × ${H} − ${w} × ${h} = ${a.whole} − ${a.corner} = ${a.area}.`, mistakes: [{ answer: a.whole, feedback: 'Subtract the corner that was cut out.' }] };
}

export function mount(host, cfg, { onChange = () => {} } = {}) {
  let s = initialState(cfg);
  host.innerHTML = `<div class="ms-x ms-comp">
    ${cfg.context ? `<p class="ms-parts__context">${bi(cfg.context, cfg.contextEs)}</p>` : ''}
    <div class="ms-row" role="group" aria-label="Method"><button type="button" class="ms-btn ms-btn--quiet" data-m="split">${bi('Split into two rectangles', 'Dividir en dos rectángulos')}</button><button type="button" class="ms-btn ms-btn--quiet" data-m="subtract">${bi('Whole minus the missing corner', 'Todo menos la esquina que falta')}</button></div>
    <div class="ms-comp__fig" aria-live="polite"></div>
    <div class="ms-parts__eval ms-comp__out"></div>
    <div class="ms-parts__controls">
      ${[['W', 'Full width', 'Ancho total'], ['H', 'Full height', 'Alto total'], ['w', 'Missing width', 'Ancho que falta'], ['h', 'Missing height', 'Alto que falta']].map(([k, en, es]) => `<label>${bi(en, es)}<input type="number" data-k="${k}" min="1" max="20" step="1" inputmode="numeric"></label>`).join('')}
      <button type="button" class="ms-btn ms-btn--quiet" data-reset>${bi('Reset', 'Reiniciar')}</button>
    </div>
    <p class="ms-x__err" role="alert"></p>
  </div>`;
  const $ = (q) => host.querySelector(q);
  const sync = () => host.querySelectorAll('[data-k]').forEach((el) => { el.value = s[el.dataset.k]; });
  const draw = () => {
    const a = areas(s), u = Math.min(280 / s.W, 200 / s.H), X = 30, Y = 16, W = s.W * u, H = s.H * u, w = s.w * u, h = s.h * u;
    const split = s.method === 'split';
    const shapes = split
      ? `<rect x="${X}" y="${Y + h}" width="${W}" height="${H - h}" class="ms-cf--a"/><rect x="${X}" y="${Y}" width="${W - w}" height="${h}" class="ms-cf--b"/><text x="${X + W / 2}" y="${Y + h + (H - h) / 2 + 5}" text-anchor="middle" class="ms-svgnum">${s.W} × ${s.H - s.h} = ${a.bottom}</text><text x="${X + (W - w) / 2}" y="${Y + h / 2 + 5}" text-anchor="middle" class="ms-svgnum">${s.W - s.w} × ${s.h} = ${a.top}</text>`
      : `<rect x="${X}" y="${Y}" width="${W}" height="${H}" class="ms-cf--a"/><rect x="${X + W - w}" y="${Y}" width="${w}" height="${h}" class="ms-cf--cut"/><text x="${X + W / 2}" y="${Y + H / 2 + 12}" text-anchor="middle" class="ms-svgnum">${s.W} × ${s.H} = ${a.whole}</text><text x="${X + W - w / 2}" y="${Y + h / 2 + 5}" text-anchor="middle" class="ms-svgnum">−${a.corner}</text>`;
    $('.ms-comp__fig').innerHTML = `<svg viewBox="0 0 ${W + 60} ${H + 50}" role="img" aria-label="${bi('', '') && ''}L-shaped figure ${s.W} by ${s.H} with a ${s.w} by ${s.h} corner missing; area ${a.area} square units">${shapes}<path d="M${X} ${Y + H}H${X + W}V${Y + h}H${X + W - w}V${Y}H${X}Z" class="ms-cf--edge"/><text x="${X + W / 2}" y="${Y + H + 20}" text-anchor="middle" class="ms-svglabel">${s.W}</text><text x="${X - 8}" y="${Y + H / 2}" text-anchor="end" class="ms-svglabel">${s.H}</text></svg>`;
    $('.ms-comp__out').innerHTML = split
      ? `<strong>${bi('Split and add', 'Divide y suma')}</strong><p class="ms-parts__steps">${a.bottom} + ${a.top} = ${a.area} ${bi('square units', 'unidades cuadradas')}</p>`
      : `<strong>${bi('Whole minus the missing corner', 'Todo menos la esquina que falta')}</strong><p class="ms-parts__steps">${a.whole} − ${a.corner} = ${a.area} ${bi('square units', 'unidades cuadradas')}</p>`;
    host.querySelectorAll('[data-m]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === s.method)));
    onChange({ ...s });
  };
  host.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { s.method = b.dataset.m; draw(); }));
  host.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('change', () => {
    const next = { ...s, [el.dataset.k]: Math.round(Number(el.value)) };
    const ok = [next.W, next.H, next.w, next.h].every((n) => n >= 1 && n <= 20) && next.w < next.W && next.h < next.H;
    $('.ms-x__err').textContent = ok ? '' : 'The missing corner must be smaller than the whole rectangle (1 to 20).';
    if (ok) { s = next; draw(); } else sync();
  }));
  $('[data-reset]').addEventListener('click', () => { s = initialState(cfg); sync(); draw(); });
  sync(); draw();
  return { get state() { return { ...s }; }, set(next) { s = { ...s, ...next }; sync(); draw(); } };
}
