/* =============================================================================
 * Class Board "This Week" strip — a live, read-only mirror of the Class Board
 * (/math/student-board/) for hub pages (math hub, curriculum hub, …).
 *
 * Drop-in: add an empty mount element and this script:
 *     <div data-class-board-strip></div>
 *     <script src="/assets/class-board-strip.js" defer></script>
 *
 * It reads the section this device last viewed on the board (localStorage
 * "nt-board-section", default "main"/All Classes), fetches
 * /api/board/get?board=<section>, and renders a compact strip: section, week +
 * theme, today's target, and a button into the full board. It is READ-ONLY —
 * the board stays the single source of truth. Fully self-contained (own scoped
 * CSS), so it looks native anywhere and degrades to a simple link if the board
 * backend isn't configured or nothing is published yet.
 * ========================================================================== */
(function () {
  "use strict";
  var SECTIONS = { main: "All Classes", 601: "Period 601", 602: "Period 602", 603: "Period 603" };
  var BOARD_URL = "/math/student-board/";

  function sectionId() {
    try {
      var s = (localStorage.getItem("nt-board-section") || "").toLowerCase();
      return SECTIONS[s] ? s : "main";
    } catch (e) {
      return "main";
    }
  }
  function sectionLabel(id) {
    return SECTIONS[id] || (/^\d+$/.test(id) ? "Period " + id : id);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c];
    });
  }

  function injectStyles() {
    if (document.getElementById("cbs-styles")) return;
    var css =
      ".cbs{--cbs-navy:#15487f;--cbs-teal:#205fa6;--cbs-green:#256b5b;" +
      "font-family:'Atkinson Hyperlegible',system-ui,sans-serif;position:relative;overflow:hidden;" +
      "display:flex;align-items:center;gap:18px;flex-wrap:wrap;color:#fff;border-radius:18px;" +
      "padding:16px 20px;margin:0 0 20px;box-shadow:0 12px 34px rgba(15,55,99,.16);" +
      "background:linear-gradient(120deg,#0f3763,var(--cbs-teal) 72%,#2b7fbf)}" +
      ".cbs::after{content:'';position:absolute;inset:0;pointer-events:none;" +
      "background:radial-gradient(520px 200px at 88% -40%,rgba(255,255,255,.22),transparent 60%)}" +
      ".cbs>*{position:relative;z-index:1}" +
      ".cbs-badge{font-family:'Nunito','Atkinson Hyperlegible',sans-serif;font-weight:800;font-size:11px;" +
      "letter-spacing:.12em;text-transform:uppercase;background:rgba(255,255,255,.18);" +
      "border:1px solid rgba(255,255,255,.32);border-radius:999px;padding:5px 12px;white-space:nowrap}" +
      ".cbs-main{flex:1 1 260px;min-width:220px}" +
      ".cbs-eyebrow{font-family:'Nunito',sans-serif;font-weight:800;font-size:11px;letter-spacing:.16em;" +
      "text-transform:uppercase;opacity:.85;margin:0 0 3px}" +
      ".cbs-week{font-family:'Nunito','Atkinson Hyperlegible',sans-serif;font-weight:900;" +
      "font-size:clamp(18px,2.4vw,24px);line-height:1.15;margin:0}" +
      ".cbs-theme{font-size:14px;opacity:.95;margin:2px 0 0}" +
      ".cbs-target{display:inline-flex;align-items:center;gap:7px;margin-top:8px;font-size:14px;font-weight:700;" +
      "background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.28);border-radius:12px;padding:6px 12px}" +
      ".cbs-cta{font-family:'Nunito',sans-serif;font-weight:800;font-size:15px;text-decoration:none;" +
      "background:#fff;color:var(--cbs-navy);border-radius:12px;padding:11px 18px;white-space:nowrap;" +
      "box-shadow:0 6px 16px rgba(0,0,0,.15);transition:transform .12s ease}" +
      ".cbs-cta:hover{transform:translateY(-1px)}" +
      ".cbs-cta:focus-visible{outline:3px solid #b8791f;outline-offset:2px}" +
      "@media (prefers-reduced-motion:reduce){.cbs-cta{transition:none}}";
    var el = document.createElement("style");
    el.id = "cbs-styles";
    el.textContent = css;
    document.head.appendChild(el);
  }

  function render(mount, id, state) {
    var href = BOARD_URL + (id !== "main" ? "?board=" + encodeURIComponent(id) : "");
    var badge = '<span class="cbs-badge">📋 ' + esc(sectionLabel(id)) + "</span>";
    var cta = '<a class="cbs-cta" href="' + href + '">Open the Class Board →</a>';
    var body;
    if (state && (state.week || state.focus)) {
      var week = (state.week && state.week.label) || "This Week";
      var theme = (state.week && state.week.theme) || "";
      var target = state.focus && state.focus.target;
      body =
        '<div class="cbs-main"><p class="cbs-eyebrow">This Week</p>' +
        '<p class="cbs-week">' +
        esc(week) +
        "</p>" +
        (theme ? '<p class="cbs-theme">' + esc(theme) + "</p>" : "") +
        (target ? '<div class="cbs-target">🎯 ' + esc(target) + "</div>" : "") +
        "</div>";
    } else {
      // Nothing published for this section yet — keep it a clean invitation.
      body =
        '<div class="cbs-main"><p class="cbs-eyebrow">Live daily board</p>' +
        '<p class="cbs-week">The Class Board</p>' +
        '<p class="cbs-theme">This week\'s guide, groups, ALEKS goals, and shout-outs.</p></div>';
    }
    mount.className = "cbs";
    mount.setAttribute("aria-label", "Class Board — this week");
    mount.innerHTML = badge + body + cta;
    mount.hidden = false;
  }

  function boot() {
    var mount = document.querySelector("[data-class-board-strip]");
    if (!mount) return;
    injectStyles();
    var id = sectionId();
    // Render the invitation immediately (instant paint), then upgrade with live data.
    render(mount, id, null);
    fetch("/api/board/get?board=" + encodeURIComponent(id), { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        if (d && d.ok && d.state) render(mount, id, d.state);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
