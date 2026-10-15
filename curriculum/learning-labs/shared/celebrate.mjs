// Small, honest rewards: a star message as each activity is finished, and a collectible stamp when a lab is
// complete. Nothing here grades anyone; it only notices progress the student made and says so.
import { play } from './sound.mjs';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHEER = {
  brief: 'Mission set. You wrote down what you already know.',
  learn: 'Learn complete. You read and explained the worked examples.',
  investigate: 'Investigate complete. You tested the model and recorded evidence.',
  practice: 'Practice complete. Every problem has been solved.',
  create: 'Create complete. Your design is finished and checked.',
  games: 'Games complete. You restored all three locations.',
};

/** Returns the events a progress change produced: which activities just finished and whether the lab is now done. */
export function diff(before, o) {
  const finished = o.items.filter((i) => i.status === 'done' && before.get(i.id) !== 'done').map((i) => i.id);
  return { finished, complete: o.done === o.total && finished.length > 0 };
}

export function createCelebrator(host, lab, state, onStamp) {
  let before = null;
  const toast = document.createElement('div');
  toast.className = 'cheer-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  host.append(toast);
  let timer = 0;
  const say = (message) => {
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('show'), 4200);
  };
  const stamp = (o) => {
    const card = document.createElement('section');
    card.className = 'lab-stamp'; card.setAttribute('aria-labelledby', 'stamp-title');
    const pieces = Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
    card.innerHTML = `<div class="stamp-confetti" aria-hidden="true">${pieces}</div>
      <div class="stamp-art" aria-hidden="true"><span>${esc(lab.icon)}</span></div>
      <div class="stamp-copy"><p class="stamp-kicker">Lab passport stamp earned</p>
        <h2 id="stamp-title">${esc(lab.finale || lab.title)}</h2>
        <p>You finished all ${o.total} parts of ${esc(lab.title)}.</p>
        <p><a class="stamp-link" href="/curriculum/learning-labs/#unit-${esc(lab.unit)}">See your passport</a>
        <button type="button" class="stamp-close">Keep exploring</button></p></div>`;
    host.append(card);
    card.querySelector('.stamp-close').onclick = () => card.remove();
    card.querySelector('.stamp-close').focus({ preventScroll: true });
  };
  return {
    update(o) {
      const snapshot = new Map(o.items.map((i) => [i.id, i.status]));
      if (!before) {
        // First look after the page loads: record where things stand without celebrating the past.
        before = snapshot;
        if (o.done === o.total && !state.stamped) state.stamped = Date.now();
        return;
      }
      const { finished, complete } = diff(before, o);
      before = snapshot;
      if (complete && !state.stamped) { state.stamped = Date.now(); onStamp?.(); play('stamp'); stamp(o); return; }
      if (finished.length) play('star');
      if (finished.length) say(`★ ${CHEER[finished[0]] || 'Activity complete.'} ${o.done} of ${o.total} stars.`);
    },
  };
}
