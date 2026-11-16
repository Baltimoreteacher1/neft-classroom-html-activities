// Math Studio finder: marks each lesson card with what this device has saved for it.
import { STORE_PREFIX } from './core.mjs';

for (const card of document.querySelectorAll('[data-ms-card]')) {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STORE_PREFIX + card.dataset.msCard) || 'null'); } catch { s = null; }
  if (!s || s.version !== 1) continue;
  const reflected = Object.values(s.reflect?.items || {}).some((r) => r?.result);
  const label = card.querySelector('[data-ms-status]');
  label.textContent = reflected ? 'Reflected ✓' : `In progress · ${s.stage || 'explore'}`;
  card.dataset.status = reflected ? 'done' : 'started';
}
