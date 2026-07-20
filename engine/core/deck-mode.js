// Warm Deck — slide-deck presentation mode for the warm-deck skin.
// Turns each rendered phase into a sequence of "slides" (one section on screen
// at a time) with a right-hand thumbnail rail, arrow navigation, and a compact
// top bar. Purely presentational: children of `.phase` are tagged with
// `data-wd-slide` and shown/hidden by class — no DOM re-parenting — so every
// interactive feature, observer, and save/resume hook keeps working unchanged.

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

export function initDeckMode({ app, config, phaseConfigs, root, phaseContainer, state }) {
  document.body.classList.add("wd-deck");
  let slideEls = []; // groups: array of arrays of phase children
  let current = 0;

  /* ── Top bar: brand · lesson · menu (opens the sidebar as a drawer) ────── */
  const bar = document.createElement("header");
  bar.className = "wd-topbar";
  bar.innerHTML = `
    <button type="button" class="wd-menu-btn" aria-label="Open lesson menu">☰ Menu</button>
    <span class="wd-brand">NEFT TEACHER</span>
    <span class="wd-topbar-lesson">${esc(config.title)} · ${esc(config.standard)}</span>
    <span class="wd-topbar-spacer"></span>
    <span class="wd-topbar-phase" data-wd-phase-label></span>`;
  document.body.prepend(bar);
  const scrim = document.createElement("div");
  scrim.className = "wd-scrim";
  document.body.append(scrim);
  const toggleMenu = (open) => document.body.classList.toggle("wd-menu-open", open);
  bar.querySelector(".wd-menu-btn").addEventListener("click", () => toggleMenu(true));
  scrim.addEventListener("click", () => toggleMenu(false));

  /* ── Right rail: slide thumbnails for this phase + the phase list ──────── */
  const rail = document.createElement("aside");
  rail.className = "wd-rail";
  rail.setAttribute("aria-label", "Slides");
  rail.innerHTML = `<div class="wd-rail-slides" role="tablist"></div>
    <div class="wd-rail-phases">
      ${phaseConfigs
        .map(
          (p, i) =>
            `<button type="button" class="wd-rail-phase" data-wd-goto-phase="${i}">${i + 1} · ${esc(p?.name || `Part ${i + 1}`)}</button>`,
        )
        .join("")}
    </div>`;
  root.append(rail);
  rail
    .querySelectorAll("[data-wd-goto-phase]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        document.dispatchEvent(
          new CustomEvent("rma:navigate", { detail: { phase: +b.dataset.wdGotoPhase } }),
        ),
      ),
    );

  /* ── Prev / next slide controls ────────────────────────────────────────── */
  const nav = document.createElement("div");
  nav.className = "wd-deck-nav";
  nav.innerHTML = `
    <button type="button" class="wd-arrow" data-wd-prev aria-label="Previous slide">←</button>
    <span class="wd-count" aria-live="polite"></span>
    <button type="button" class="wd-arrow" data-wd-next aria-label="Next slide">→</button>`;
  document.body.append(nav);
  nav.querySelector("[data-wd-prev]").addEventListener("click", () => show(current - 1));
  nav.querySelector("[data-wd-next]").addEventListener("click", () => show(current + 1));

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (document.documentElement.classList.contains("nt-extra-fullpage-open")) return;
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
  });

  /* ── Slide grouping: a phase child with a heading/card starts a slide; ──
     small trailing elements (continue buttons, notes) ride with the one
     before, so every slide ends on its own call-to-action. */
  function groupSlides(phaseEl) {
    const groups = [];
    [...phaseEl.children].forEach((child) => {
      const startsSlide =
        child.classList.contains("card") ||
        child.querySelector(".card, h2, h3, .card-title") ||
        groups.length === 0;
      if (startsSlide) groups.push([]);
      groups[groups.length - 1].push(child);
      child.dataset.wdSlide = String(groups.length - 1);
    });
    return groups;
  }

  function slideTitle(group, fallback) {
    for (const el of group) {
      const h = el.querySelector("h2, h3, h4, .card-title, [class*='section-title']");
      const t = h?.textContent?.trim().replace(/\s+/g, " ");
      if (t) return t.length > 34 ? `${t.slice(0, 32)}…` : t;
    }
    return fallback;
  }

  function show(n) {
    if (!slideEls.length) return;
    current = Math.max(0, Math.min(slideEls.length - 1, n));
    slideEls.forEach((group, i) =>
      group.forEach((el) => el.classList.toggle("wd-hidden", i !== current)),
    );
    rail.querySelectorAll(".wd-thumb").forEach((t, i) => {
      t.classList.toggle("wd-sel", i === current);
      t.setAttribute("aria-selected", i === current ? "true" : "false");
    });
    nav.querySelector(".wd-count").textContent = `${current + 1} / ${slideEls.length}`;
    nav.querySelector("[data-wd-prev]").disabled = current === 0;
    nav.querySelector("[data-wd-next]").disabled = current === slideEls.length - 1;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function deckify(phaseIdx) {
    const phaseEl = phaseContainer.querySelector(".phase");
    if (!phaseEl) return;
    document.body.classList.add("wd-lesson-active");
    slideEls = groupSlides(phaseEl);
    const phaseName = phaseConfigs[phaseIdx]?.name || `Part ${phaseIdx + 1}`;
    bar.querySelector("[data-wd-phase-label]").textContent =
      `${phaseName} · ${phaseIdx + 1} of ${phaseConfigs.length}`;
    rail.querySelector(".wd-rail-slides").innerHTML = slideEls
      .map(
        (g, i) => `
        <button type="button" class="wd-thumb" role="tab" data-wd-slide-btn="${i}">
          <span class="wd-thumb-title">${esc(slideTitle(g, `${phaseName} ${i + 1}`))}</span>
          <span class="wd-thumb-num">${i + 1}</span>
        </button>`,
      )
      .join("");
    rail
      .querySelectorAll("[data-wd-slide-btn]")
      .forEach((b) => b.addEventListener("click", () => show(+b.dataset.wdSlideBtn)));
    rail
      .querySelectorAll(".wd-rail-phase")
      .forEach((b, i) => b.classList.toggle("wd-sel", i === phaseIdx));
    show(0);
    toggleMenu(false);
  }

  // Presentational wrap only: render the phase exactly as before, then tag it.
  const origRenderPhase = app.renderPhase.bind(app);
  app.renderPhase = (index, renderFn) => {
    origRenderPhase(index, renderFn);
    deckify(index);
  };

  // Practice (and other widgets) re-serve content inside the current slide;
  // late-added phase children (e.g. mounted activities) join the last slide so
  // nothing renders invisible.
  new MutationObserver(() => {
    const phaseEl = phaseContainer.querySelector(".phase");
    if (!phaseEl || !slideEls.length) return;
    let changed = false;
    [...phaseEl.children].forEach((child) => {
      if (child.dataset.wdSlide === undefined) {
        child.dataset.wdSlide = String(slideEls.length - 1);
        slideEls[slideEls.length - 1]?.push(child);
        child.classList.toggle("wd-hidden", current !== slideEls.length - 1);
        changed = true;
      }
    });
    void changed; // visibility already set per-child; no scroll-jumping reshow
  }).observe(phaseContainer, { childList: true, subtree: true });

  // The first phase renders during createApp, before this wrap existed —
  // deckify it now if it's already on the page.
  if (phaseContainer.querySelector(".phase")) {
    deckify(state.get().currentPhase ?? 0);
  }
}
