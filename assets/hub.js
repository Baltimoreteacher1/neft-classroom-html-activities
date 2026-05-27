(() => {
  'use strict';

  const search = document.querySelector('[data-hub-search]');
  const chips = Array.from(document.querySelectorAll('[data-hub-filter]'));
  const cards = Array.from(document.querySelectorAll('[data-hub-card]'));
  const status = document.querySelector('[data-hub-status]');
  const empty = document.querySelector('[data-hub-empty]');

  if (!search || !cards.length) return;

  let activeFilter = 'all';

  search.addEventListener('input', applyFilters);
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.hubFilter || 'all';
      chips.forEach(item => item.setAttribute('aria-pressed', String(item === chip)));
      applyFilters();
    });
  });

  document.addEventListener('keydown', event => {
    const target = document.activeElement?.tagName;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target);
    const wantsSearch = event.key === '/' || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey));
    if (!isTyping && wantsSearch) {
      event.preventDefault();
      search.focus();
      search.select();
    }
  });

  applyFilters();

  function applyFilters() {
    const query = normalize(search.value);
    let shown = 0;

    cards.forEach(card => {
      const text = normalize(`${card.dataset.hubCard || ''} ${card.textContent || ''}`);
      const family = normalize(card.dataset.hubFamily || '');
      const matchesSearch = !query || text.includes(query);
      const matchesFamily = activeFilter === 'all' || family.includes(activeFilter);
      const visible = matchesSearch && matchesFamily;
      card.hidden = !visible;
      if (visible) shown += 1;
    });

    if (status) status.textContent = `${shown} ${shown === 1 ? 'route' : 'routes'} shown.`;
    if (empty) empty.hidden = shown !== 0;
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }
})();
