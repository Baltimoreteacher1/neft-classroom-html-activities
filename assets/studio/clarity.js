/**
 * Practice Studio clarity layer — shared by the generated studios (Units 2, 3, 5-9) and the ten hand-built Unit 4 pages.
 *
 *   Menu      every secondary header control (Comfort, My thinking, Skill Quest, Bonus Round, Español, theme, Print,
 *             Reset, the accuracy/streak line) moves into one "Menu" disclosure, so the header holds only the title,
 *             stars/progress and the pathway. The controls keep their ids and listeners; they are only re-homed, so
 *             every script that injects one (comfort, insight, quest, chrome, u4-studio) keeps working unchanged.
 *   Mission   the mission briefing opens on a student's first visit to a studio and is a small chip after that.
 *
 * Nothing here knows any mathematics. Loaded with `defer` (or at the end of a hand-built page): it sweeps what is
 * already in the header and watches for controls other scripts add later.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioClarity) return;
  const lang = () => document.body.classList.contains("show-es");

  /* ---- Menu ----------------------------------------------------------------------------------------------------- */
  /** Menu order; anything else that asks to be in the menu goes last. */
  const ORDER = [
    "ewl-stats",
    "quest-btn",
    "u4-bonus-btn",
    "think-btn",
    "seals-btn",
    "comfort-btn",
    "toggle-es-btn",
    "ewl-theme-btn",
    "print-btn",
    "reset-all-btn",
  ];
  /** Header children that stay in the header. */
  const STAY = (/** @type {Element} */ n) =>
    n.id === "studio-menu-wrap" ||
    n.id === "ewl-hud" ||
    n.id === "u4-stars-btn" ||
    n.id === "hud-pill" ||
    n.classList.contains("score-pill") ||
    n.classList.contains("stars-btn");
  const belongs = (/** @type {Element} */ n) =>
    n.nodeType === 1 &&
    !STAY(n) &&
    (n.classList.contains("top-btn") || n.hasAttribute("data-menu"));

  function buildMenu(/** @type {HTMLElement} */ actions) {
    const wrap = document.createElement("div");
    wrap.id = "studio-menu-wrap";
    wrap.className = "studio-menu-wrap";
    wrap.innerHTML = `<button type="button" class="top-btn studio-menu-btn" id="studio-menu-btn" aria-expanded="false" aria-controls="studio-menu"><span aria-hidden="true">☰</span> <span class="t-en">Menu</span><span class="t-es" lang="es">Menú</span></button><div class="studio-menu" id="studio-menu" role="group" aria-label="Studio menu" hidden></div>`;
    actions.append(wrap);
    const btn = /** @type {HTMLButtonElement} */ (wrap.firstElementChild);
    const panel = /** @type {HTMLElement} */ (wrap.lastElementChild);
    const set = (/** @type {boolean} */ open) => {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    };
    btn.addEventListener("click", () => {
      const open = panel.hidden !== false;
      set(open);
      if (open) /** @type {HTMLElement|null} */ (panel.querySelector("button, a[href]"))?.focus();
    });
    // Escape closes and returns focus to the Menu button; a click or focus anywhere outside closes it.
    wrap.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || panel.hidden) return;
      e.stopPropagation();
      set(false);
      btn.focus();
    });
    const outside = (/** @type {Event} */ e) => {
      if (panel.hidden) return;
      const t = /** @type {Node} */ (e.target);
      // a dialog the menu opened (Comfort, My thinking, Skill Quest…) is not "outside": the menu stays put under it
      if (wrap.contains(t) || /** @type {Element} */ (t).closest?.("dialog")) return;
      set(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    // choosing an item closes the menu, so it never sits over the work: the item's own listener (on the button) has
    // already run by the time the click bubbles here
    panel.addEventListener("click", (e) => {
      if (!(/** @type {Element} */ (e.target).closest("button, a[href]"))) return;
      set(false);
      if (!document.querySelector("dialog[open]")) btn.focus();
    });
    // a dialog opened from the menu hands focus back to the Menu button when it closes (its opener is now hidden)
    document.addEventListener(
      "close",
      () =>
        setTimeout(() => {
          const a = document.activeElement;
          if (!a || a === document.body || panel.contains(a)) btn.focus();
        }, 0),
      true,
    );
    return { wrap, panel, set };
  }

  function placeInMenu(/** @type {HTMLElement} */ panel, /** @type {Element} */ node) {
    const rank = (/** @type {Element} */ n) => {
      const i = ORDER.indexOf(n.id);
      return i < 0 ? ORDER.length : i;
    };
    node.classList.add("studio-menu-item");
    const after = [...panel.children].find((c) => rank(c) > rank(node));
    panel.insertBefore(node, after || null);
  }

  function initMenu() {
    const actions = /** @type {HTMLElement|null} */ (document.querySelector(".header-actions"));
    if (!actions || document.getElementById("studio-menu-wrap")) return;
    const { panel } = buildMenu(actions);
    const sweep = () => {
      for (const n of [...actions.children]) if (belongs(n)) placeInMenu(panel, n);
    };
    sweep();
    new MutationObserver(sweep).observe(actions, { childList: true });
    document.body.classList.add("studio-has-menu");
  }

  /* ---- Mission briefing: open on the first visit, a chip after ------------------------------------------------- */
  function initMission() {
    const card = /** @type {HTMLDetailsElement|null} */ (document.querySelector(".mission-card"));
    if (!card) return;
    const key = `studio_mission_seen_${location.pathname}`;
    let seen = false;
    try {
      seen = localStorage.getItem(key) === "1";
      localStorage.setItem(key, "1");
    } catch (_e) {
      /* without storage every visit is a first visit; the briefing simply opens */
    }
    if (!seen) card.open = true;
  }

  /* ---- Exit card: what you can do now, how it went, one next step -------------------------------------------- */
  const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
    `<span class="t-en">${en}</span><span class="t-es" lang="es">${es}</span>`;
  const escHtml = (/** @type {any} */ s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
    );

  /**
   * The completion card that replaces the old link banner. Shared by the generated studios (runtime.js) and the Unit 4
   * pages (u4-studio.js).
   * @param {{sections: {en: string, es: string}[], tally?: {en: string, es: string}, seals?: {name: string, nameEs: string, label: string, labelEs: string}[], next: {en: string, es: string, href?: string, attr?: string}}} o
   */
  function exitCard(o) {
    const target = document.querySelector(".target-chip .target-text");
    const can = target
      ? `<p class="exit-target"><span aria-hidden="true">✓</span> ${target.innerHTML}</p>`
      : "";
    const done = o.sections
      .map(
        (s) =>
          `<li><span aria-hidden="true">✓</span> ${bi(escHtml(s.en), escHtml(s.es || s.en))}</li>`,
      )
      .join("");
    const next = o.next.href
      ? `<a class="btn btn-go exit-next" href="${escHtml(o.next.href)}">${bi(o.next.en, o.next.es)}</a>`
      : `<button type="button" class="btn btn-go exit-next" ${o.next.attr || ""}>${bi(o.next.en, o.next.es)}</button>`;
    return `<div class="exit-card">
      <h2 class="exit-title" tabindex="-1">${bi("What you can do now", "Lo que ya puedes hacer")}</h2>
      ${can}
      <ul class="exit-sections" aria-label="Sections completed">${done}</ul>
      ${o.tally ? `<p class="exit-tally">${bi(o.tally.en, o.tally.es)}</p>` : ""}
      ${o.seals?.length ? `<p class="exit-seals"><span aria-hidden="true">🏅</span> ${bi("Seals earned today:", "Sellos ganados hoy:")} ${o.seals.map((s) => bi(escHtml(`${s.name} · ${s.label}`), escHtml(`${s.nameEs} · ${s.labelEs || s.label}`))).join(", ")}</p>` : ""}
      <p class="exit-step"><span class="exit-step-label">${bi("Next step", "Siguiente paso")}</span> ${next}</p>
    </div>`;
  }

  function init() {
    initMenu();
    initMission();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  W.StudioClarity = { lang, exitCard };
})();
