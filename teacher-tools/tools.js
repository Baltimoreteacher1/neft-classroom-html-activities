(() => {
  'use strict';

  const SEARCH_SHORTCUT_HINT = 'Press / or Ctrl+K to search Teacher Tools.';
  const USAGE_KEY = 'neft.teacherTools.localUsage.v1';

  const searchInput = document.querySelector('[data-tool-search]');
  const filterButtons = Array.from(document.querySelectorAll('[data-tool-filter]'));
  const cards = Array.from(document.querySelectorAll('[data-tool-card]'));
  const groups = Array.from(document.querySelectorAll('[data-tool-group]'));
  const resultStatus = document.querySelector('[data-result-status]');
  const emptyState = document.querySelector('[data-empty-state]');
  const shortcutHint = document.querySelector('[data-shortcut-hint]');

  let activeFilter = 'all';
  let localUsage = loadUsage();

  init();

  function init() {
    if (!searchInput || !cards.length) return;
    if (shortcutHint) shortcutHint.textContent = SEARCH_SHORTCUT_HINT;
    hydrateUsageBadges();
    bindEvents();
    applyFilters();
  }

  function bindEvents() {
    searchInput.addEventListener('input', applyFilters);

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.toolFilter || 'all';
        filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        applyFilters();
      });
    });

    cards.forEach(card => {
      card.addEventListener('click', () => recordUse(card));
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') recordUse(card);
      });
    });

    document.addEventListener('keydown', event => {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      const searchShortcut = event.key === '/' || (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey));
      if (!isTyping && searchShortcut) {
        event.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  function applyFilters() {
    const query = normalize(searchInput.value);
    let visibleCount = 0;

    cards.forEach(card => {
      const haystack = normalize([
        card.dataset.title,
        card.dataset.category,
        card.dataset.audience,
        card.textContent
      ].join(' '));
      const matchesQuery = !query || haystack.includes(query);
      const matchesFilter = activeFilter === 'all' || normalize(card.dataset.category || '').includes(activeFilter);
      const visible = matchesQuery && matchesFilter;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    groups.forEach(group => {
      const hasVisibleCard = Array.from(group.querySelectorAll('[data-tool-card]')).some(card => !card.hidden);
      group.hidden = !hasVisibleCard;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;
    if (resultStatus) {
      const noun = visibleCount === 1 ? 'tool' : 'tools';
      resultStatus.textContent = `${visibleCount} ${noun} shown.`;
    }
  }

  function hydrateUsageBadges() {
    cards.forEach(card => {
      const path = card.getAttribute('href');
      const count = localUsage[path]?.count || 0;
      if (!count) return;
      const target = card.querySelector('[data-local-use]');
      if (target) {
        target.textContent = count === 1 ? 'Used once on this device' : `Used ${count} times on this device`;
        target.hidden = false;
      }
    });
  }

  function recordUse(card) {
    const path = card.getAttribute('href');
    if (!path) return;
    const record = localUsage[path] || { count: 0, lastUsed: null };
    record.count += 1;
    record.lastUsed = new Date().toISOString();
    localUsage[path] = record;
    try {
      localStorage.setItem(USAGE_KEY, JSON.stringify(localUsage));
    } catch {
      // Local usage memory is optional; navigation should never fail because storage is unavailable.
    }
  }

  function loadUsage() {
    try {
      return JSON.parse(localStorage.getItem(USAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }
})();
