/* Expedition Atlas — the games hub's view of every skill-game expedition.
 *
 * Each game's expedition engine writes a summary per world to localStorage
 * ("ewl-expedition-index-v1"). This script reads it and renders:
 *   - totals (stars, landmarks restored, skills mastered on your own, achievements)
 *   - one tile per world, in the hub's own unit order, linking to ?expedition=1
 *   - "worth another look": the most frequent misconceptions, linked to their world
 *   - a progress line on each skill-game card
 * The world list comes from the hub's skill-game cards (#main-games-grid), so there is
 * no second copy of game metadata to drift. Everything stays on this device.
 */
(function () {
  "use strict";
  const INDEX_KEY = "ewl-expedition-index-v1";
  const host = document.getElementById("expedition-atlas-body");
  const grid = document.getElementById("main-games-grid");
  if (!host || !grid) return;

  const es = (() => {
    try {
      return localStorage.getItem("nt-lang") === "es";
    } catch (_e) {
      return false;
    }
  })();
  const T = (en, sp) => (es ? sp : en);
  const t = (v) => (v == null ? "" : typeof v === "string" ? v : (es ? v.es : v.en) || v.en || "");
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  function readIndex() {
    try {
      const v = JSON.parse(localStorage.getItem(INDEX_KEY) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch (_e) {
      return {};
    }
  }

  // Worlds in the hub's unit order, read from the existing cards.
  const worlds = [...grid.querySelectorAll("a.activity-card[href^='/math/games/u']")].map((a) => {
    const slug = a.getAttribute("href").split("/").filter(Boolean)[2];
    const name = a.querySelector("h3")?.lastChild?.textContent?.trim() || slug;
    return {
      slug,
      card: a,
      name,
      world: a.querySelector(".arcade-world-label")?.textContent?.trim() || name,
      unit: a.querySelector(".card-kicker")?.textContent?.trim() || "",
      art: a.querySelector("img.adventure-card-art")?.getAttribute("src") || "",
    };
  });

  function render() {
    const index = readIndex();
    const rows = worlds.map((w) => ({ ...w, p: index[w.slug] || null }));
    const sum = (k) => rows.reduce((n, r) => n + (r.p?.[k] || 0), 0);
    const started = rows.filter((r) => r.p && r.p.done > 0).length;
    const stars = sum("stars");
    const maxStars = rows.reduce((n, r) => n + (r.p?.maxStars || 36), 0);
    const restored = sum("chaptersRestored");
    const chapters = rows.reduce((n, r) => n + (r.p?.chapters || 3), 0);
    const mastered = sum("skillsMastered");
    const badges = sum("achievements");

    const chips = [
      ["⭐", `${stars} / ${maxStars}`, T("stars", "estrellas")],
      ["🏛️", `${restored} / ${chapters}`, T("landmarks restored", "lugares restaurados")],
      [
        "🏅",
        String(mastered),
        T("skills mastered on your own", "habilidades dominadas por tu cuenta"),
      ],
      ["🎖️", String(badges), T("achievements", "logros")],
    ]
      .map(
        ([icon, n, label]) =>
          `<li class="atlas-chip"><span aria-hidden="true">${icon}</span> <strong>${n}</strong> ${label}</li>`,
      )
      .join("");

    const tiles = rows
      .map((r) => {
        const p = r.p;
        const done = p?.done || 0;
        const total = p?.missions || 12;
        const pct = Math.round((done / total) * 100);
        const status =
          !p || !done
            ? T("Not started", "Sin empezar")
            : done >= total
              ? T("World restored", "Mundo restaurado")
              : T(`${done} of ${total} missions`, `${done} de ${total} misiones`);
        const cta =
          !p || !done
            ? T("Start expedition", "Empezar expedición")
            : done >= total
              ? T("Replay", "Repetir")
              : T("Continue", "Continuar");
        return `<li><a class="atlas-world${done >= total ? " is-restored" : ""}" href="/math/games/${esc(r.slug)}/?expedition=1" style="--atlas-accent:${esc(p?.accent || "#7be0c8")}">
          <span class="atlas-art" aria-hidden="true"${r.art ? ` style="background-image:url('${esc(r.art)}')"` : ""}></span>
          <span class="atlas-unit">${esc(r.unit)}</span>
          <span class="atlas-name">${esc(r.world)}</span>
          <span class="atlas-game">${esc(r.name)}</span>
          <span class="atlas-meter" role="img" aria-label="${esc(status)}"><span style="width:${pct}%"></span></span>
          <span class="atlas-status">${esc(status)}${p?.stars ? ` · ★ ${p.stars}` : ""}</span>
          <span class="atlas-cta">${esc(cta)} →</span>
        </a></li>`;
      })
      .join("");

    const revisit = rows
      .flatMap((r) => (r.p?.revisit || []).map((m) => ({ ...m, r })))
      .filter((m) => m.label)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(
        (m) =>
          `<li><span>${esc(t(m.label))}</span> <a href="/math/games/${esc(m.r.slug)}/?expedition=1">${esc(T(`Practice in ${m.r.world}`, `Practicar en ${m.r.world}`))}</a></li>`,
      )
      .join("");

    host.innerHTML = `
      <ul class="atlas-chips">${chips}</ul>
      ${
        started === 0
          ? `<p class="atlas-intro">${T(
              "Every skill game has an expedition: 12 missions in 3 chapters where your math runs the world. Pick any world to begin — progress saves on this device.",
              "Cada juego tiene una expedición: 12 misiones en 3 capítulos donde tus matemáticas mueven el mundo. Elige un mundo para empezar; el progreso se guarda en este dispositivo.",
            )}</p>`
          : ""
      }
      <ul class="atlas-worlds">${tiles}</ul>
      ${revisit ? `<div class="atlas-revisit"><h3>${T("Worth another look", "Vale la pena repasar")}</h3><ul>${revisit}</ul></div>` : ""}`;

    // A progress line on each skill-game card (inside its existing link; text only).
    rows.forEach((r) => {
      let line = r.card.querySelector(".atlas-card-progress");
      if (!r.p || !r.p.done) {
        line?.remove();
        return;
      }
      if (!line) {
        line = document.createElement("span");
        line.className = "atlas-card-progress";
        r.card.querySelector(".button-link")?.before(line);
      }
      line.textContent = `🗺️ ${T("Expedition", "Expedición")}: ${r.p.done}/${r.p.missions} · ★ ${r.p.stars}`;
    });
  }

  render();
  // Another tab (a game) may update progress; refresh when the hub regains focus.
  window.addEventListener("storage", (e) => {
    if (e.key === INDEX_KEY) render();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") render();
  });
})();
