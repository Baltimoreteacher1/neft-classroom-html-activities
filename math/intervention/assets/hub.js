/* ==========================================================================
   Intervention hub interactivity: live search, skill filter, per-topic
   progress badges (from localStorage), recently-opened strip, reset.
   Progressive enhancement — the static cards work with JS disabled.
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function progressAll() {
    try {
      return JSON.parse(localStorage.getItem("nt-intervention:v1") || "{}");
    } catch (e) {
      return {};
    }
  }

  function statusFor(p) {
    if (!p || !p.visited)
      return { label: "Not started", cls: "ps-new", pct: 0 };
    const best = Math.max(p.diagnostic || 0, p.practice || 0);
    if (best >= 80)
      return { label: "Mastered " + best + "%", cls: "ps-mastered", pct: best };
    if (best > 0)
      return {
        label: "In progress " + best + "%",
        cls: "ps-progress",
        pct: best,
      };
    return { label: "Started", cls: "ps-progress", pct: 8 };
  }

  document.addEventListener("DOMContentLoaded", function () {
    const grid = $("#topic-grid");
    if (!grid) return;
    const cards = $$(".topic-card", grid);
    const prog = progressAll();

    // ---- progress badges + bars ----
    let started = 0,
      mastered = 0;
    cards.forEach((card) => {
      const slug = card.dataset.slug;
      const st = statusFor(prog[slug]);
      if (prog[slug] && prog[slug].visited) started++;
      if (st.cls === "ps-mastered") mastered++;
      const badge = $(".topic-progress", card);
      if (badge) {
        badge.innerHTML =
          '<span class="pstatus ' +
          st.cls +
          '">' +
          st.label +
          "</span>" +
          '<span class="pbar"><i style="width:' +
          st.pct +
          '%"></i></span>';
      }
    });
    const sStarted = $("#stat-started");
    const sMastered = $("#stat-mastered");
    if (sStarted) sStarted.textContent = started;
    if (sMastered) sMastered.textContent = mastered;

    // ---- recently opened ----
    const recent = Object.entries(prog)
      .filter(([, v]) => v && v.ts)
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, 3)
      .map(([slug]) => cards.find((c) => c.dataset.slug === slug))
      .filter(Boolean);
    const recentWrap = $("#recent-wrap");
    const recentStrip = $("#recent-strip");
    if (recentWrap && recentStrip && recent.length) {
      recentStrip.innerHTML = recent
        .map(
          (c) =>
            '<a class="recent-chip" href="' +
            c.getAttribute("href") +
            '">' +
            $(".icon", c).textContent +
            " " +
            $("h3", c).textContent +
            "</a>",
        )
        .join("");
      recentWrap.hidden = false;
    }

    // ---- search + filter ----
    const search = $("#topic-search");
    const chips = $$(".filter-chip");
    let activeSkill = "all";
    function apply() {
      const q = (search ? search.value : "").trim().toLowerCase();
      let shown = 0;
      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const skills = (card.dataset.skills || "").toLowerCase();
        const matchQ = !q || text.includes(q);
        const matchSkill =
          activeSkill === "all" || skills.includes(activeSkill);
        const ok = matchQ && matchSkill;
        card.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      const empty = $("#no-results");
      if (empty) empty.hidden = shown > 0;
    }
    if (search) search.addEventListener("input", apply);
    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        activeSkill = chip.dataset.skill;
        apply();
      }),
    );

    // ---- reset ----
    const reset = $("#reset-progress");
    if (reset)
      reset.addEventListener("click", () => {
        if (confirm("Clear saved intervention progress on this device?")) {
          localStorage.removeItem("nt-intervention:v1");
          location.reload();
        }
      });
  });
})();
