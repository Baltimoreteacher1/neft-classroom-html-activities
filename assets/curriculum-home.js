/* Native disclosures preserve the full library without dominating lesson discovery. */
(() => {
  if (!document.getElementById("curriculum-navigator")) return;

  function reveal(target) {
    if (!target) return;
    for (let node = target; node; node = node.parentElement) {
      if (node instanceof HTMLDetailsElement) node.open = true;
    }
  }

  // Capture runs before existing workflow handlers attempt to scroll/focus a panel.
  document.addEventListener(
    "click",
    (event) => {
      const source = event.target instanceof Element ? event.target : null;
      if (!source) return;
      if (source.closest("[data-home-mode]")) {
        document.getElementById("hub-mode-toggle")?.click();
      }
      if (source.closest("[data-guide-teacher-view], [data-audience='teacher']")) {
        reveal(
          document.getElementById("curriculum-teacher-workflow") ||
            document.getElementById("hub-library-collection"),
        );
      }
      const link = source.closest("a[href^='#']");
      const hash = link?.getAttribute("href");
      if (hash && hash.length > 1) {
        try {
          reveal(document.getElementById(decodeURIComponent(hash.slice(1))));
        } catch {}
      }
    },
    true,
  );

  function revealHash() {
    if (!location.hash) return;
    try {
      reveal(document.getElementById(decodeURIComponent(location.hash.slice(1))));
    } catch {}
  }
  window.addEventListener("hashchange", revealHash);
  revealHash();
})();
