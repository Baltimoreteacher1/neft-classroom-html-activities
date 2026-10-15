// "Watch it move": sweeps each control of a lab model up and back so a student sees what each number does.
// Drives the real inputs (so the picture, readout and saved values stay the single source of truth) and always
// restores the student's own values. Reduced motion gets two still snapshots instead of an animation.
const SWEEP_MS = 1400;
const RETURN_MS = 700;

const snap = (value, field) => {
  const steps = Math.round((value - field.min) / field.step);
  const out = field.min + steps * field.step;
  return Math.min(field.max, Math.max(field.min, Number(out.toFixed(6))));
};

/** Target for a control: a visible move (about 40% of its range) in the direction that has room. */
export function sweepTarget(field, from) {
  const span = Math.max(field.step * 3, (field.max - field.min) * 0.4);
  const up = snap(from + span, field);
  if (up !== from) return up;
  return snap(from - span, field);
}

export function mountWatch(slot, fields, say = () => {}) {
  const real = fields.map((f, i) => ({ f, i })).filter(({ f }) => f.label !== 'Unused');
  const bar = document.createElement('div');
  bar.className = 'watch-bar';
  bar.innerHTML = '<button type="button" class="quiet" data-watch>Watch the model move</button><span class="watch-note" role="status" aria-live="polite"></span>';
  const button = bar.querySelector('[data-watch]');
  const note = bar.querySelector('.watch-note');
  const inputOf = (i) => slot.querySelector(`[data-control="${i}"]`);
  const set = (i, field, value) => {
    const input = inputOf(i);
    if (!input) return;
    input.value = String(snap(value, field));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  let running = false;
  let cancel = false;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  async function tween(i, field, a, b, ms) {
    const t0 = performance.now();
    for (;;) {
      if (cancel) return;
      const p = Math.min(1, (performance.now() - t0) / ms);
      set(i, field, a + (b - a) * (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2));
      if (p >= 1) return;
      await frame();
    }
  }
  async function run() {
    if (running) { cancel = true; return; }
    running = true; cancel = false;
    button.textContent = 'Stop';
    const start = real.map(({ i }) => Number(inputOf(i)?.value));
    try {
      for (let k = 0; k < real.length && !cancel; k++) {
        const { f, i } = real[k];
        const from = start[k];
        const to = sweepTarget(f, from);
        if (to === from) continue;
        note.textContent = `Watch the picture and the readout: ${f.label} changes from ${from} to ${to}.`;
        say(note.textContent);
        if (reduced()) { set(i, f, to); await new Promise((r) => setTimeout(r, 1800)); }
        else await tween(i, f, from, to, SWEEP_MS);
        note.textContent = `${f.label} goes back to ${from}.`;
        if (reduced()) set(i, f, from); else await tween(i, f, to, from, RETURN_MS);
      }
    } finally {
      real.forEach(({ f, i }, k) => set(i, f, start[k]));
      note.textContent = cancel ? 'Stopped. Your own values are back.' : 'Done. Now try it yourself: change one number and predict what the picture will do.';
      button.textContent = 'Watch the model move again';
      running = false; cancel = false;
    }
  }
  button.addEventListener('click', run);
  return bar;
}
