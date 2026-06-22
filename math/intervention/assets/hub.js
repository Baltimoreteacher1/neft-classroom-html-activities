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
          // Also clear XP/streak/badges + Smart Review misses so a reset is a
          // true fresh start (these live under a separate key).
          localStorage.removeItem("nt-intervention-xp:v1");
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

    // ===================================================================
    //  PREMIUM LAYER — XP/level/streak HUD, achievement wall, and a
    //  printable student progress report. Shares the localStorage schema
    //  written by assets/intervention-engine.js (key below).
    // ===================================================================
    const XKEY = "nt-intervention-xp:v1";
    function xpRead() {
      let d;
      try {
        d = JSON.parse(localStorage.getItem(XKEY) || "{}");
        if (!d || typeof d !== "object") d = {};
      } catch (e) {
        d = {};
      }
      d.xp = d.xp || 0;
      d.streak = d.streak || { count: 0, last: null };
      d.badges = d.badges || {};
      d.activity = d.activity || {};
      return d;
    }
    const xpLevel = (xp) => Math.floor((xp || 0) / 100) + 1;
    // Mirror of BADGES in intervention-engine.js.
    const BADGES = {
      "first-steps": { icon: "🌱", name: "First Steps", desc: "Finished your first activity." },
      sharp: { icon: "🎯", name: "Sharp Shooter", desc: "Scored 100% on a practice set." },
      fluent: { icon: "⚡", name: "Fluency Ace", desc: "15+ correct in a fluency drill." },
      arcade: { icon: "🕹️", name: "Arcade Ace", desc: "Scored 100+ in Answer Drop." },
      streak3: { icon: "🔥", name: "On a Roll", desc: "3-day practice streak." },
      streak7: { icon: "🚀", name: "Unstoppable", desc: "7-day practice streak." },
      master1: { icon: "⭐", name: "Topic Master", desc: "Mastered your first topic (80%+)." },
      master6: { icon: "🏅", name: "Halfway Hero", desc: "Mastered 6 topics." },
      master12: { icon: "👑", name: "Grand Master", desc: "Mastered all 12 topics." },
    };

    const xp = xpRead();
    const lvl = xpLevel(xp.xp);

    // ---- topbar HUD pill ----
    (function () {
      const nav = $(".topbar nav");
      if (!nav || $("#int-hud")) return;
      const hud = document.createElement("div");
      hud.id = "int-hud";
      hud.className = "int-hud";
      hud.title = "Your level, XP, and daily practice streak";
      hud.innerHTML =
        '<span class="ih-lvl">⭐ Lv ' + lvl + "</span>" +
        '<span class="ih-bar"><i style="width:' + (xp.xp % 100) + '%"></i></span>' +
        '<span class="ih-xp">' + xp.xp + " XP</span>" +
        (xp.streak.count > 0
          ? '<span class="ih-streak">🔥 ' + xp.streak.count + "</span>"
          : "");
      nav.parentNode.insertBefore(hud, nav);
    })();

    // ---- rewards / achievement wall ----
    const badgeIds = Object.keys(BADGES);
    const earnedCount = badgeIds.filter((id) => xp.badges[id]).length;
    const badgeWall = badgeIds
      .map((id) => {
        const b = BADGES[id];
        const on = !!xp.badges[id];
        return (
          '<div class="badge ' + (on ? "earned" : "locked") + '">' +
          '<span class="badge-ic">' + b.icon + "</span>" +
          '<span class="badge-name">' + b.name + "</span>" +
          '<span class="badge-desc">' + b.desc + "</span>" +
          "</div>"
        );
      })
      .join("");

    const premium = document.createElement("section");
    premium.className = "block";
    premium.id = "premium-section";
    premium.innerHTML =
      '<div class="wrap">' +
      '<div class="section-head"><span class="eyebrow">Rewards</span>' +
      "<h2>Level up as you learn</h2>" +
      "<p>Earn XP for every quiz, fluency drill, and game. Keep a daily streak and collect badges as you rebuild each skill.</p></div>" +
      '<div class="xp-panel">' +
      '<div class="xp-stat"><b>⭐ ' + lvl + "</b><span>Level</span></div>" +
      '<div class="xp-stat xp-grow"><div class="xp-line"><span>' + xp.xp + " XP</span><span>" + (xp.xp % 100) + " / 100 to Lv " + (lvl + 1) + "</span></div>" +
      '<div class="xp-bar"><i style="width:' + (xp.xp % 100) + '%"></i></div></div>' +
      '<div class="xp-stat"><b>🔥 ' + (xp.streak.count || 0) + "</b><span>Day streak</span></div>" +
      '<div class="xp-stat"><b>🏆 ' + earnedCount + "/" + badgeIds.length + "</b><span>Badges</span></div>" +
      "</div>" +
      '<div class="badge-grid">' + badgeWall + "</div>" +
      '<div class="report-actions">' +
      '<input id="report-name" type="text" placeholder="Type your name for the report" autocomplete="name" />' +
      '<button class="btn btn-primary btn-sm" id="print-report" type="button">🖨️ Print progress report</button>' +
      "</div>" +
      "</div>";
    const progSection = $("#progress-section");
    if (progSection && progSection.parentNode)
      progSection.parentNode.insertBefore(premium, progSection);
    else if (grid.closest("section"))
      grid.closest("section").insertAdjacentElement("afterend", premium);

    // ---- printable progress report ----
    const report = document.createElement("div");
    report.id = "report";
    report.className = "report";
    report.setAttribute("aria-hidden", "true");
    document.body.appendChild(report);

    const printReport = $("#print-report");
    if (printReport)
      printReport.addEventListener("click", function () {
        const name = ($("#report-name").value || "").trim() || "Student";
        const fresh = xpRead();
        let masteredNow = 0;
        const rows = cards
          .map(function (card) {
            const st = statusFor(prog[card.dataset.slug]);
            if (st.cls === "ps-mastered") masteredNow++;
            const stdEl = card.querySelector(".std");
            return (
              "<tr><td>" +
              $(".icon", card).textContent + " " + $("h3", card).textContent +
              "</td><td>" +
              (stdEl ? stdEl.textContent : "") +
              '</td><td class="rp-st ' + st.cls + '">' + st.label +
              "</td></tr>"
            );
          })
          .join("");
        const earnedBadges = badgeIds
          .filter(function (id) {
            return fresh.badges[id];
          })
          .map(function (id) {
            return BADGES[id].icon + " " + BADGES[id].name;
          });
        report.innerHTML =
          '<div class="report-inner">' +
          '<div class="report-head">' +
          '<div><p class="rp-kicker">Neft Teacher · 6th-Grade Math Intervention</p>' +
          '<h2 class="rp-title">Student Progress Report</h2></div>' +
          '<div class="rp-meta"><p><strong class="rp-name"></strong></p><p>' + new Date().toLocaleDateString() + "</p></div>" +
          "</div>" +
          '<div class="rp-summary">' +
          "<div><b>" + xpLevel(fresh.xp) + "</b><span>Level</span></div>" +
          "<div><b>" + fresh.xp + "</b><span>Total XP</span></div>" +
          "<div><b>" + (fresh.streak.count || 0) + "</b><span>Day streak</span></div>" +
          "<div><b>" + masteredNow + " / " + cards.length + "</b><span>Topics mastered</span></div>" +
          "<div><b>" + earnedBadges.length + " / " + badgeIds.length + "</b><span>Badges</span></div>" +
          "</div>" +
          '<table class="rp-table"><thead><tr><th>Topic</th><th>Standard</th><th>Status</th></tr></thead><tbody>' +
          rows +
          "</tbody></table>" +
          '<div class="rp-badges"><h3>Badges earned</h3><p>' +
          (earnedBadges.length ? earnedBadges.join("  ·  ") : "None yet — keep practicing!") +
          "</p></div>" +
          '<div class="rp-foot"><span>Mr. Neft · Mathematics</span><span>eduwonderlab.com/math/intervention</span></div>' +
          "</div>";
        // Assign the student-entered name safely (avoids HTML injection).
        const nameEl = report.querySelector(".rp-name");
        if (nameEl) nameEl.textContent = name;
        document.body.classList.add("printing-report");
        window.print();
        setTimeout(function () {
          document.body.classList.remove("printing-report");
        }, 500);
      });
  });
})();
