// Catalog finder and resume badges. Works without JavaScript; this only adds filtering.
const form = document.querySelector('[data-finder]');
const cards = [...document.querySelectorAll('.lab-card[data-search]')];
const units = [...document.querySelectorAll('.catalog-unit')];
const unitNav = document.querySelector('.unit-nav');
if (form) {
  form.addEventListener('submit', (event) => event.preventDefault());
  const input = form.querySelector('input'), status = form.querySelector('.finder-status');
  const apply = () => {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const card of cards) {
      const hit = terms.every((t) => card.dataset.search.includes(t));
      card.hidden = !hit; if (hit) shown++;
    }
    for (const unit of units) unit.hidden = terms.length > 0 && ![...unit.querySelectorAll('.lab-card')].some((c) => !c.hidden);
    if (unitNav) unitNav.hidden = terms.length > 0;
    status.textContent = terms.length ? (shown ? `${shown} of ${cards.length} labs match.` : 'No labs match. Try a lesson number such as 4.2 or a topic such as ratio.') : '';
  };
  input.addEventListener('input', apply);
}
try {
  for (const card of cards) {
    const raw = localStorage.getItem(`eduwonderlab:learning-lab:v1:${card.dataset.lab}`);
    if (!raw) continue;
    const state = JSON.parse(raw);
    const touched = Object.values(state.notes || {}).some(Boolean) || Object.keys(state.practice || {}).length || state.created;
    if (!touched) continue;
    const badge = document.createElement('span');
    badge.className = 'card-resume'; badge.textContent = 'In progress on this device';
    card.querySelector('.card-detail').after(badge);
  }
} catch { /* Storage unavailable: the catalog still works. */ }
