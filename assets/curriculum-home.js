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

  // Mark the unit being taught now (or next, between units) on the course cards.
  function markCurrentUnit() {
    const cards = Array.from(document.querySelectorAll(".course-unit-list li[data-start]"));
    if (!cards.length) return;
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const ordered = cards.sort((a, b) => a.dataset.start.localeCompare(b.dataset.start));
    const current =
      ordered.find((li) => li.dataset.start <= today && today <= li.dataset.end) ||
      ordered.find((li) => today < li.dataset.start);
    if (!current) return;
    const live = current.dataset.start <= today;
    current.classList.add("is-current");
    const tag = document.createElement("span");
    tag.className = "course-unit-now";
    tag.textContent = live ? "Now" : "Next";
    current.querySelector("a")?.prepend(tag);
    if (live) current.querySelector("a")?.setAttribute("aria-current", "date");
  }
  markCurrentUnit();
})();
