/* Keep existing save, hint and passport tools reachable without covering play. */
(function () {
  'use strict';
  let attempts = 0;
  function mount() {
    const area = document.querySelector('.cabinet-console, #wrap, .container');
    if (!area) { if (attempts++ < 12) setTimeout(mount, 100); return; }
    if (area.querySelector(".cabinet-tools")) return;
    const tools = document.createElement('aside');
    tools.className = 'cabinet-tools'; tools.setAttribute('aria-label','Practice tools');
    area.append(tools);
    function relocate() {
      document.querySelectorAll('.ntp-pill, .nt-hl-root, #nsr-root, .mwb-launcher-nav').forEach(node => {
        if (node.parentNode !== tools) tools.append(node);
      });
    }
    relocate();
    const observer = new MutationObserver(relocate);
    observer.observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState !== 'complete') window.addEventListener('load',mount,{once:true}); else mount();
})();
