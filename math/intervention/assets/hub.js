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
    let activeDomain = "all";

    // Screen-reader live region announcing how many topics match.
    let live = $("#topic-live");
    if (!live) {
      live = document.createElement("p");
      live.id = "topic-live";
      live.setAttribute("aria-live", "polite");
      live.className = "sr-only";
      (grid.parentNode || grid).insertBefore(live, grid);
    }

    function apply() {
      const q = (search ? search.value : "").trim().toLowerCase();
      let shown = 0;
      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const domain = (card.dataset.domain || "").toLowerCase();
        const matchQ = !q || text.includes(q);
        const matchDomain = activeDomain === "all" || domain === activeDomain;
        const ok = matchQ && matchDomain;
        card.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      const empty = $("#no-results");
      if (empty) empty.hidden = shown > 0;
      live.textContent =
        shown === 0
          ? "No topics match your search."
          : shown + (shown === 1 ? " topic shown." : " topics shown.");
    }

    // Debounce keystrokes so the live region is not over-announced.
    let searchTimer = null;
    if (search)
      search.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(apply, 200);
      });
    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        activeDomain = (chip.dataset.domain || "all").toLowerCase();
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

    // ---- progress dashboard + certificate ----
    const section = $("#progress-section");
    const dash = $("#prog-dash");
    if (section && started > 0) {
      section.hidden = false;
      const masteredTopics = [];
      dash.innerHTML = cards
        .map((card) => {
          const slug = card.dataset.slug;
          const st = statusFor(prog[slug]);
          if (st.cls === "ps-mastered")
            masteredTopics.push($("h3", card).textContent);
          return (
            '<div class="pd-row"><span class="pd-name">' +
            $(".icon", card).textContent +
            " " +
            $("h3", card).textContent +
            '</span><span class="pd-bar"><i style="width:' +
            st.pct +
            '%"></i></span><span class="pd-pct ' +
            st.cls +
            '">' +
            st.label +
            "</span></div>"
          );
        })
        .join("");

      const printCert = $("#print-cert");
      if (printCert)
        printCert.addEventListener("click", () => {
          const name = ($("#cert-name").value || "").trim() || "Student Name";
          const masteredNow = [];
          cards.forEach((card) => {
            const st = statusFor(prog[card.dataset.slug]);
            if (st.cls === "ps-mastered")
              masteredNow.push($("h3", card).textContent);
          });
          if (!masteredNow.length) {
            alert(
              "Master at least one topic (80%+) to earn a certificate. Keep practicing!",
            );
            return;
          }
          $("#cert-name-out").textContent = name;
          $("#cert-count").textContent = masteredNow.length;
          $("#cert-list").innerHTML = masteredNow
            .map((m) => "<li>" + m + "</li>")
            .join("");
          const d = $("#cert-date");
          if (d) d.textContent = new Date().toLocaleDateString();
          document.body.classList.add("printing-cert");
          window.print();
          setTimeout(
            () => document.body.classList.remove("printing-cert"),
            500,
          );
        });
    }
  });
})();
