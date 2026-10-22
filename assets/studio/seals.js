/**
 * Practice Studio seals (window.StudioSeals): "My seals", the per-skill seals this lesson's skills have earned.
 * Contract: docs/specs/studio-v3-w2.md. Reads the learner model (assets/studio/learner.js); a seal is a ring plus a word, never
 * colour alone, and it is never taken back. Rising a seal is announced as `studio:seal` (the Comfort panel's toast listens) and
 * the exit card lists the seals earned this visit.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const { esc, es } = RT.util;
  /** @type {any} */
  let rt = null;
  /** Seals earned since this page opened, newest last. @type {Array<{ label: string, labelEs: string, seal: number }>} */
  const earnedNow = [];

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));

  /** The skills this page's items exercise: { key, label, labelEs }, in the order a student meets them. */
  function skillsOnPage() {
    const L = W.StudioLearner;
    /** @type {Map<string, { key: string, label: string, labelEs: string }>} */
    const out = new Map();
    for (const sec of rt.api.sections)
      for (const spec of sec.items) {
        let entry = null;
        if (spec.k === "gen" && W.StudioGen?.registry[spec.g]) {
          const r = W.StudioGen.registry[spec.g];
          entry = { key: L.keyOf({ gen: spec.g }), label: r.title, labelEs: r.titleEs || "" };
        } else if (spec.k === "act" && W.StudioAct?.registry[spec.kind]) {
          const r = W.StudioAct.registry[spec.kind];
          const title = spec.lab || r.title;
          entry = {
            key: L.keyOf({ kind: "act", skill: title }),
            label: title,
            labelEs: r.titleEs || "",
          };
        }
        if (entry && !out.has(entry.key)) out.set(entry.key, entry);
      }
    return [...out.values()];
  }

  function sealRing(/** @type {number} */ n) {
    const s = W.StudioLearner.SEALS[n];
    return s
      ? `<span class="seal-ring seal-${n}" role="img" aria-label="${s.name} seal, ${s.word}">${s.ring}</span>`
      : `<span class="seal-ring seal-0" role="img" aria-label="No seal yet">·</span>`;
  }

  function dialog(/** @type {string} */ title, /** @type {string} */ titleEs) {
    $("#studio-seals")?.remove();
    const d = document.createElement("dialog");
    d.className = "u4-dialog";
    d.id = "studio-seals";
    d.setAttribute("aria-labelledby", "studio-seals-title");
    d.innerHTML = `<div class="u4-dialog-head"><h2 id="studio-seals-title">${esc(title)}${es(titleEs)}</h2><button type="button" class="u4-close">Close</button></div><div class="u4-dialog-body"></div>`;
    document.body.append(d);
    $(".u4-close", d)?.addEventListener("click", () => d.close());
    d.addEventListener("close", () => d.remove());
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    return /** @type {HTMLElement} */ ($(".u4-dialog-body", d));
  }

  function open() {
    const L = W.StudioLearner;
    const body = dialog("My seals", "Mis sellos");
    const skills = skillsOnPage();
    if (!skills.length) {
      body.innerHTML = `<p>${esc("This studio has no skill problems to earn seals on.")}${es("Este estudio no tiene problemas de habilidad para ganar sellos.")}</p>`;
      return;
    }
    const have = skills.filter((s) => L.sealOf(L.get(s.key)) > 0).length;
    const rows = skills
      .map((s) => {
        const rec = L.get(s.key);
        const n = L.sealOf(rec);
        const seal = L.SEALS[n];
        const step = L.nextStep(rec);
        return `<li class="seal-row">${sealRing(n)}<div><strong>${esc(s.label)}</strong>${es(s.labelEs)}
          <span class="seal-word">${seal ? `${esc(seal.name)} · ${esc(seal.word)}${es(`${seal.nameEs} · ${seal.wordEs}`)}` : `${esc("No seal yet")}${es("Aún sin sello")}`}</span>
          <p class="seal-next">${esc(step.en)}${es(step.es)}</p></div></li>`;
      })
      .join("");
    body.innerHTML = `<p>${esc(`You have a seal on ${have} of ${skills.length} skills in this lesson.`)}${es(`Tienes un sello en ${have} de ${skills.length} habilidades de esta lección.`)}</p>
      <p class="seal-note">${esc("Seals stay on this device and are never taken back.")}${es("Los sellos se quedan en este dispositivo y nunca se pierden.")}</p>
      <ul class="seal-list">${rows}</ul>`;
  }

  W.StudioBus?.on("seal", (/** @type {any} */ e) =>
    earnedNow.push({ label: e.label, labelEs: e.labelEs || "", seal: e.seal }),
  );

  W.StudioSeals = {
    init(/** @type {any} */ runtime) {
      rt = runtime;
      const actions = $(".header-actions");
      if (!actions || $("#seals-btn")) return;
      const b = document.createElement("button");
      b.type = "button";
      b.id = "seals-btn";
      b.className = "top-btn";
      b.innerHTML = `🏅 My seals${es("Mis sellos")}`;
      b.addEventListener("click", open);
      const lang = $("#toggle-es-btn");
      actions.insertBefore(b, lang?.parentNode === actions ? lang : null);
    },
    open,
    /** Seals earned since the page opened, for the exit card. */
    earnedThisVisit: () => earnedNow.slice(),
    skillsOnPage,
  };
})();
