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
  if (!document.getElementById("practice-arc-css")) {
    const style = document.createElement("style");
    style.id = "practice-arc-css";
    style.textContent = `.practice-arc{margin:12px 0 16px}.practice-arc ol{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}.practice-arc li{display:flex;align-items:center;gap:6px;min-height:44px;padding:6px 10px;border:1px solid #c5d4dc;border-radius:999px;background:#fff;font-size:15px;font-weight:700}.practice-arc-n{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#17324d;color:#f7f4ec;font-size:13px}.practice-arc-note{margin:8px 0 0;font-size:15px;max-width:70ch}@media (prefers-reduced-motion:reduce){.practice-arc *{transition:none}}`;
    document.head.append(style);
  }

  /* ---- Menu ----------------------------------------------------------------------------------------------------- */
  /** Menu order; anything else that asks to be in the menu goes last. */
  const ORDER = [
    "ewl-stats",
    "quest-btn",
    "u4-bonus-btn",
    "think-btn",
    "seals-btn",
    "trapbook-btn",
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
    // on a phone or a Chromebook the briefing would push a hands-on first problem off the screen: it stays a chip there
    let widgetFirst = false;
    try {
      const first = JSON.parse(document.getElementById("studio-data")?.textContent || "{}")
        .sections?.[0]?.items?.[0];
      widgetFirst = ["act", "lab", "mission"].includes(first?.k);
    } catch (_e) {
      /* no lesson data: open it as usual */
    }
    const short = matchMedia("(max-height: 800px), (max-width: 600px)").matches;
    if (!seen && !(widgetFirst && short)) card.open = true;
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
  /** Per stage: solved on their own, solved with support, not yet. Words carry the meaning, never colour alone. */
  function evidenceTable(/** @type {any[]|undefined} */ rows) {
    if (!rows?.length) return "";
    const cell = (/** @type {number} */ n, /** @type {string} */ cls) =>
      `<td class="ev-${cls}"><span class="ev-n">${n}</span></td>`;
    const body = rows
      .map(
        (r) =>
          `<tr><th scope="row">${bi(escHtml(r.name), escHtml(r.nameEs || r.name))}${r.optional ? ` <span class="ev-opt">${bi("optional", "opcional")}</span>` : ""}</th>${cell(r.own, "own")}${cell(r.help, "help")}${cell(r.again, "again")}</tr>`,
      )
      .join("");
    const again = rows.filter((r) => r.again && !r.optional);
    const tip = again.length
      ? `<p class="ev-tip">${bi(`Worth another look: ${again.map((r) => r.name).join(", ")}.`, `Vale la pena repasar: ${again.map((r) => r.nameEs || r.name).join(", ")}.`)}</p>`
      : "";
    return `<div class="exit-evidence"><table class="ev-table"><caption>${bi("What your work shows", "Lo que muestra tu trabajo")}</caption><thead><tr><th scope="col">${bi("Stage", "Etapa")}</th><th scope="col">${bi("On my own", "Por mi cuenta")}</th><th scope="col">${bi("With help", "Con ayuda")}</th><th scope="col">${bi("Not yet", "Todavía no")}</th></tr></thead><tbody>${body}</tbody></table>${tip}</div>`;
  }

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
    const back = o.lessonHref
      ? ` <a class="btn exit-back" href="${escHtml(o.lessonHref)}">${bi("Back to the lesson", "Volver a la lección")}</a>`
      : "";
    return `<div class="exit-card">
      <h2 class="exit-title" tabindex="-1">${bi("What you can do now", "Lo que ya puedes hacer")}</h2>
      ${can}
      <ul class="exit-sections" aria-label="Sections completed">${done}</ul>
      ${o.tally ? `<p class="exit-tally">${bi(o.tally.en, o.tally.es)}</p>` : ""}
      ${o.seals?.length ? `<p class="exit-seals"><span aria-hidden="true">🏅</span> ${bi("Seals earned today:", "Sellos ganados hoy:")} ${o.seals.map((s) => bi(escHtml(`${s.name} · ${s.label}`), escHtml(`${s.nameEs} · ${s.labelEs || s.label}`))).join(", ")}</p>` : ""}
      ${evidenceTable(o.evidence)}
      ${o.extra || ""}
      <p class="exit-step"><span class="exit-step-label">${bi("Next step", "Siguiente paso")}</span> ${next}${back}</p>
    </div>`;
  }

  /* ---- focus layout: the problem and its model lead; the lesson context folds behind one control ---- */
  function initFocusLayout() {
    if (!document.querySelector(".tab-bar") || !document.querySelector(".tab-panel")) return;
    document.body.classList.add("focus-layout");
    // the model's controls sit under its picture, so the picture gets the full column and its labels stay apart
    const W = /** @type {any} */ (window);
    W.StudioLabCss = `${W.StudioLabCss || ""}\n.model-workspace{grid-template-columns:minmax(0,1fr)!important}`;
    const main = document.querySelector(".main-container");
    const ctx = document.querySelector(".studio-context");
    if (!main) return;
    // one progress bar, driven by the same "n / total" count the header pill already keeps
    const count = document.getElementById("header-progress-count");
    const bar = document.createElement("div");
    bar.className = "focus-progress";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "Lesson progress");
    bar.setAttribute("aria-valuemin", "0");
    bar.innerHTML = '<span class="focus-progress-fill"></span>';
    const sync = () => {
      const m = /(\d+)\s*\/\s*(\d+)/.exec(count?.textContent || "");
      const done = m ? Number(m[1]) : 0;
      const total = m ? Number(m[2]) : 0;
      bar.setAttribute("aria-valuemax", String(total));
      bar.setAttribute("aria-valuenow", String(done));
      bar.setAttribute("aria-valuetext", `${done} of ${total} problems`);
      /** @type {HTMLElement} */ (bar.firstElementChild).style.width = total
        ? `${(done / total) * 100}%`
        : "0%";
    };
    sync();
    if (count)
      new MutationObserver(sync).observe(count, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    document.querySelector(".tab-bar")?.before(bar);
    if (!ctx || !document.body.dataset.chrome) return; // generated studios only: Unit 4 keeps its "I can" line in view
    document.body.classList.add("focus-fold");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "focus-more-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `${bi("About this lesson", "Acerca de esta lección")} <span aria-hidden="true">▾</span>`;
    btn.addEventListener("click", () => {
      const open = !document.body.classList.contains("show-context");
      document.body.classList.toggle("show-context", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    main.insertBefore(btn, main.firstElementChild);
  }

  const ARC = [
    ["Prepare", "Preparar"],
    ["Explore", "Explorar"],
    ["Guided", "Guiado"],
    ["Independent", "Independiente"],
    ["Reason", "Razonar"],
    ["Apply", "Aplicar"],
    ["Improve", "Mejorar"],
  ];

  function initPracticeArc() {
    if (document.getElementById("practice-arc")) return;
    const host = document.querySelector("main") || document.body;
    const nav = document.createElement("nav");
    nav.id = "practice-arc";
    nav.className = "practice-arc";
    nav.setAttribute("aria-label", "Practice path");
    nav.innerHTML = `<ol>${ARC.map(
      ([en, es], i) =>
        `<li><span class="practice-arc-n">${i + 1}</span><span class="t-en">${en}</span><span class="t-es" lang="es">${es}</span></li>`,
    ).join(
      "",
    )}</ol><p class="practice-arc-note"><span class="t-en">Challenge adds a reason to explain or compare. It is not only bigger numbers.</span><span class="t-es" lang="es">El desafío pide explicar o comparar. No son solo números más grandes.</span></p>`;
    const bar = document.querySelector(".tab-bar");
    if (bar) bar.before(nav);
    else host.prepend(nav);
  }

  function init() {
    initMenu();
    initMission();
    initFocusLayout();
    initPracticeArc();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  W.StudioClarity = { lang, exitCard };
})();
