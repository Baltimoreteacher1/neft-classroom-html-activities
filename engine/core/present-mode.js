// present-mode.js — teacher-facing "Present" toggle (per Joel 2026-07-20).
// Turns the current phase into one-section-per-screen slides for projecting:
// a right-hand slide rail, bottom-center arrows, keyboard navigation, and
// slightly larger type — all in the lesson's editorial styling. The default
// student scroll experience is untouched; Present is opt-in from the Tools
// menu (or ?present=1) and fully reversible with Exit / Esc.
//
// Purely presentational: children of `.phase` are tagged with `data-pm-slide`
// and shown/hidden by class — no DOM re-parenting — so every interactive
// feature, observer, and save/resume hook keeps working unchanged.

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

export function initPresentMode({ app, config, phaseConfigs, phaseContainer, state }) {
  let active = false;
  let slideEls = [];
  let current = 0;
  let rail = null;
  let nav = null;

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
      child.dataset.pmSlide = String(groups.length - 1);
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
    if (!active || !slideEls.length) return;
    current = Math.max(0, Math.min(slideEls.length - 1, n));
    slideEls.forEach((group, i) =>
      group.forEach((el) => el.classList.toggle("pm-hidden", i !== current)),
    );
    rail?.querySelectorAll(".pm-thumb").forEach((t, i) => {
      t.classList.toggle("pm-sel", i === current);
      t.setAttribute("aria-selected", i === current ? "true" : "false");
    });
    if (nav) {
      nav.querySelector(".pm-count").textContent = `${current + 1} / ${slideEls.length}`;
      nav.querySelector("[data-pm-prev]").disabled = current === 0;
      nav.querySelector("[data-pm-next]").disabled = current === slideEls.length - 1;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function deckify() {
    const phaseEl = phaseContainer.querySelector(".phase");
    if (!phaseEl) return;
    slideEls = groupSlides(phaseEl);
    const phaseIdx = state.get().currentPhase ?? 0;
    const phaseName = phaseConfigs[phaseIdx]?.name || `Part ${phaseIdx + 1}`;
    rail.querySelector(".pm-rail-slides").innerHTML = slideEls
      .map(
        (g, i) => `
        <button type="button" class="pm-thumb" role="tab" data-pm-slide-btn="${i}">
          <span class="pm-thumb-num">${i + 1}</span>
          <span class="pm-thumb-title">${esc(slideTitle(g, `${phaseName} · ${i + 1}`))}</span>
        </button>`,
      )
      .join("");
    rail
      .querySelectorAll("[data-pm-slide-btn]")
      .forEach((b) => b.addEventListener("click", () => show(+b.dataset.pmSlideBtn)));
    rail
      .querySelectorAll(".pm-rail-phase")
      .forEach((b, i) => b.classList.toggle("pm-sel", i === phaseIdx));
    show(0);
  }

  function unDeckify() {
    phaseContainer.querySelectorAll(".pm-hidden").forEach((el) => el.classList.remove("pm-hidden"));
    slideEls = [];
    current = 0;
  }

  function buildChrome() {
    rail = document.createElement("aside");
    rail.className = "pm-rail";
    rail.setAttribute("aria-label", "Presentation slides");
    rail.innerHTML = `
      <div class="pm-rail-head">Presenting</div>
      <div class="pm-rail-slides" role="tablist"></div>
      <div class="pm-rail-phases">
        ${phaseConfigs
          .map(
            (p, i) =>
              `<button type="button" class="pm-rail-phase" data-pm-goto-phase="${i}">${i + 1} · ${esc(p?.name || `Part ${i + 1}`)}</button>`,
          )
          .join("")}
      </div>
      <button type="button" class="pm-exit" data-pm-exit>✕ Exit (Esc)</button>`;
    rail
      .querySelectorAll("[data-pm-goto-phase]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          document.dispatchEvent(
            new CustomEvent("rma:navigate", { detail: { phase: +b.dataset.pmGotoPhase } }),
          ),
        ),
      );
    rail.querySelector("[data-pm-exit]").addEventListener("click", () => setActive(false));
    document.body.append(rail);

    nav = document.createElement("div");
    nav.className = "pm-nav";
    nav.innerHTML = `
      <button type="button" class="pm-arrow" data-pm-prev aria-label="Previous slide">←</button>
      <span class="pm-count" aria-live="polite"></span>
      <button type="button" class="pm-arrow" data-pm-next aria-label="Next slide">→</button>`;
    nav.querySelector("[data-pm-prev]").addEventListener("click", () => show(current - 1));
    nav.querySelector("[data-pm-next]").addEventListener("click", () => show(current + 1));
    document.body.append(nav);
  }

  function setActive(on) {
    if (on === active) return;
    active = on;
    document.body.classList.toggle("nt-present", on);
    if (on) {
      if (!rail) buildChrome();
      deckify();
    } else {
      unDeckify();
    }
    document
      .querySelectorAll("[data-pm-toggle-label]")
      .forEach((el) => (el.textContent = on ? "Exit Present" : "Present"));
  }

  /* Re-deckify on phase change while presenting */
  const origRenderPhase = app.renderPhase.bind(app);
  app.renderPhase = (index, renderFn) => {
    origRenderPhase(index, renderFn);
    if (active) deckify();
  };

  /* Late-added phase children (e.g. served practice problems) join the last
     slide so nothing renders invisible while presenting. */
  new MutationObserver(() => {
    if (!active || !slideEls.length) return;
    const phaseEl = phaseContainer.querySelector(".phase");
    if (!phaseEl) return;
    [...phaseEl.children].forEach((child) => {
      if (child.dataset.pmSlide === undefined) {
        child.dataset.pmSlide = String(slideEls.length - 1);
        slideEls[slideEls.length - 1]?.push(child);
        child.classList.toggle("pm-hidden", current !== slideEls.length - 1);
      }
    });
  }).observe(phaseContainer, { childList: true, subtree: true });

  /* Keyboard: arrows navigate slides, Esc exits — never while typing */
  document.addEventListener("keydown", (e) => {
    if (!active || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (document.documentElement.classList.contains("nt-extra-fullpage-open")) return;
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "Escape") setActive(false);
  });

  /* Tools-menu entry — the utility menu adopts live controls, so keep trying
     until its actions slot exists (it mounts with the lesson chrome). */
  let tries = 0;
  (function mountToolsItem() {
    const slot = document.querySelector('.nt-utility-pop [data-slot="actions"]');
    if (!slot) {
      if (tries++ < 40) setTimeout(mountToolsItem, 250);
      return;
    }
    if (slot.querySelector("[data-pm-toggle]")) return;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "nt-utility-item";
    item.setAttribute("data-pm-toggle", "");
    item.innerHTML = '<span aria-hidden="true">📽️</span><span data-pm-toggle-label>Present</span>';
    item.addEventListener("click", () => setActive(!active));
    slot.appendChild(item);
  })();

  /* Deep link for projector setups: ?present=1 starts presenting */
  if (new URLSearchParams(window.location.search).get("present") === "1") {
    // Wait until a phase exists (post identity screen / auto-launch).
    const tick = setInterval(() => {
      if (phaseContainer.querySelector(".phase")) {
        clearInterval(tick);
        setActive(true);
      }
    }, 400);
    setTimeout(() => clearInterval(tick), 60000);
  }
}
