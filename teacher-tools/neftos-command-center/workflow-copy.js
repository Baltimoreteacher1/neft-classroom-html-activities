(() => {
  'use strict';

  document.addEventListener('click', event => {
    const button = event.target.closest('.copy-button');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const card = button.closest('.workflow-card');
    const code = card?.querySelector('code');
    const text = code?.textContent || '';
    copyText(text);
  }, true);

  async function copyText(text) {
    const toast = document.querySelector('[data-toast]');
    try {
      await navigator.clipboard.writeText(text);
      showToast(toast, 'Copied contextual prompt to clipboard.');
    } catch {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'neftos-workflow-prompt.txt';
      anchor.click();
      URL.revokeObjectURL(url);
      showToast(toast, 'Clipboard unavailable; downloaded prompt instead.');
    }
  }

  function showToast(toast, message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2400);
  }
})();
