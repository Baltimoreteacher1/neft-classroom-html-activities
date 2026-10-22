/**
 * Practice Studio tier two (window.StudioReflect): after a wrong multiple-choice answer, a short, skippable second question,
 * "Which sounds most like your thinking?", answered from the names of the misconceptions the item's wrong choices represent
 * (plus "I guessed"). Nothing is graded and the student is never told which one they "should" pick; a tap is remembered in the
 * Trap Book as a confirmed trap. Skipped when the item offers fewer than two different traps. Contract: studio-v3-w3.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const { esc, es } = RT.util;
  /** @type {any} */
  let rt = null;

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));
  const hash = (/** @type {string} */ s) =>
    [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  function offer(/** @type {any} */ e) {
    // authored items' traps are on the page; a generated item's traps are named by assets/studio-gen/traps.js
    const names = { ...(W.StudioGen?.traps?.names || {}), ...(rt.api.data.traps || {}) };
    const tags = [...new Set(/** @type {string[]} */ (e.traps || []))].filter((t) => names[t]);
    if (tags.length < 2) return;
    const fb = $(`#stage-${e.tab} .item-fb`);
    if (!fb) return;
    $(".reflect-row", fb)?.remove();
    // a fixed order that does not depend on which choice was picked, so the row never points at "the" answer
    const order = tags.sort((a, b) => hash(e.itemId + a) - hash(e.itemId + b)).slice(0, 3);
    const row = document.createElement("div");
    row.className = "reflect-row";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Which sounds most like your thinking? (optional)");
    row.innerHTML = `<p class="reflect-q">Which sounds most like your thinking? <span class="conf-opt">(optional)</span>${es("¿Cuál se parece más a tu forma de pensar? (opcional)")}</p>${order
      .map(
        (t) =>
          `<button type="button" class="btn btn-sm reflect-btn" data-reflect="${esc(t)}">${esc(names[t].n)}${es(names[t].nEs)}</button>`,
      )
      .join(
        "",
      )}<button type="button" class="btn btn-sm reflect-btn" data-reflect="">I guessed${es("Adiviné")}</button>`;
    fb.append(row);
    row.addEventListener("click", (ev) => {
      const b = /** @type {HTMLElement|null} */ (
        /** @type {HTMLElement} */ (ev.target).closest("[data-reflect]")
      );
      if (!b) return;
      const tag = b.dataset.reflect || "";
      if (tag) W.StudioLearner?.confirm(tag, e.lesson);
      W.StudioBus.emit("reflect", { lesson: e.lesson, itemId: e.itemId, tag: tag || null });
      row.innerHTML = `<p class="reflect-thanks">Thanks, that is saved in your Trap Book.${es("Gracias, quedó guardado en tu Libro de trampas.")}</p>`;
    });
  }

  W.StudioReflect = {
    init(/** @type {any} */ runtime) {
      rt = runtime;
      W.StudioBus.on("answer", (/** @type {any} */ e) => {
        if (!e.ok && e.kind === "mc" && e.tag && !e.redeem) offer(e);
      });
    },
  };
})();
