/**
 * Practice Studio Trap Book (window.StudioTrapBook): every misconception this student has met, across lessons, kept on this
 * device by the learner model. A trap is Spotted by a wrong answer that names it, Dodged by a clean answer on an item that
 * offered it, and Tamed after three dodges in a row (sticky). The book shows names, counts, a quick fix and the lessons where
 * it came up. Contract: docs/specs/studio-v3-w3.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const { esc, es } = RT.util;

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));

  function dialog() {
    $("#studio-trapbook")?.remove();
    const d = document.createElement("dialog");
    d.className = "u4-dialog";
    d.id = "studio-trapbook";
    d.setAttribute("aria-labelledby", "studio-trapbook-title");
    d.innerHTML = `<div class="u4-dialog-head"><h2 id="studio-trapbook-title">Trap Book${es("Libro de trampas")}</h2><button type="button" class="u4-close">Close</button></div><div class="u4-dialog-body"></div>`;
    document.body.append(d);
    $(".u4-close", d)?.addEventListener("click", () => d.close());
    d.addEventListener("close", () => d.remove());
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    return /** @type {HTMLElement} */ ($(".u4-dialog-body", d));
  }

  const lessonsOf = (/** @type {any} */ t) =>
    Object.keys(t.lessons || {})
      .sort()
      .join(", ");

  function card(/** @type {any} */ t) {
    const L = W.StudioLearner;
    const left = Math.max(1, L.TAME_AFTER - t.since);
    const status = t.tamed
      ? `<span class="trap-status trap-tamed">✓ ${esc("Tamed")}${es("Domada")}</span>`
      : `<span class="trap-status">${esc(`Not tamed yet: ${left} more ${left === 1 ? "clean answer" : "clean answers"} in a row on questions that offer it`)}${es(`Aún no domada: ${left === 1 ? "una respuesta limpia más" : `${left} respuestas limpias más`} seguidas en preguntas que la ofrecen`)}</span>`;
    const counts = `${esc(`Spotted ${t.n}×`)}${es(`Detectada ${t.n}×`)} · ${esc(`Dodged ${t.dodged}×`)}${es(`Esquivada ${t.dodged}×`)}`;
    const name = t.name || t.tag;
    return `<li class="trap-card${t.tamed ? " is-tamed" : ""}"><span class="trap-mark" aria-hidden="true">${t.tamed ? "✓" : "◆"}</span><div>
      <strong>${esc(name)}</strong>${es(t.nameEs || "")}
      <p class="trap-counts">${counts}${t.confirmed ? ` · ${esc("You said it sounds like you")}${es("Dijiste que se parece a ti")}` : ""}</p>
      <p>${status}</p>
      ${t.fix ? `<p class="trap-fix"><strong>${esc("Quick fix:")}${es("Arreglo rápido:")}</strong> ${esc(t.fix)}${es(t.fixEs || "")}</p>` : ""}
      ${lessonsOf(t) ? `<p class="trap-lessons">${esc("Came up in lesson")}${es("Apareció en la lección")} ${esc(lessonsOf(t))}</p>` : ""}
    </div></li>`;
  }

  function open() {
    const body = dialog();
    const all = Object.values(/** @type {Record<string, any>} */ (W.StudioLearner.traps())).filter(
      (t) => t.n > 0 || t.confirmed > 0,
    );
    if (!all.length) {
      body.innerHTML = `<p>${esc("No traps yet. When a wrong answer teaches you something, it lands here with a quick fix.")}${es("Aún no hay trampas. Cuando una respuesta incorrecta te enseña algo, aparece aquí con un arreglo rápido.")}</p>`;
      return;
    }
    all.sort(
      (a, b) => Number(a.tamed) - Number(b.tamed) || b.n - a.n || a.tag.localeCompare(b.tag),
    );
    const tamed = all.filter((t) => t.tamed).length;
    body.innerHTML = `<p>${esc(`You have met ${all.length} ${all.length === 1 ? "trap" : "traps"} and tamed ${tamed}.`)}${es(`Has encontrado ${all.length} ${all.length === 1 ? "trampa" : "trampas"} y domado ${tamed}.`)}</p>
      <p class="seal-note">${esc("The Trap Book stays on this device, across every lesson.")}${es("El Libro de trampas se queda en este dispositivo, en todas las lecciones.")}</p>
      <ul class="trap-list">${all.map(card).join("")}</ul>`;
  }

  W.StudioTrapBook = {
    init() {
      const actions = $(".header-actions");
      if (!actions || $("#trapbook-btn")) return;
      const b = document.createElement("button");
      b.type = "button";
      b.id = "trapbook-btn";
      b.className = "top-btn";
      b.innerHTML = `📖 Trap Book${es("Libro de trampas")}`;
      b.addEventListener("click", open);
      const lang = $("#toggle-es-btn");
      actions.insertBefore(b, lang?.parentNode === actions ? lang : null);
    },
    open,
  };
})();
