/*
 * Math Lab Missions — Step Flow
 * --------------------------------
 * Progressive, one-screen-at-a-time presentation layer for every mission page.
 *
 * It is layout-agnostic: it reads whatever content the mission already has
 * (hero + panels/sections), groups it into clear, focused steps, and shows one
 * step at a time with a progress indicator and Back / Next navigation.
 *
 * No external dependencies, no build step, no markup changes required in the
 * mission files beyond a single <script src="../step-flow.js" defer></script>.
 * The original print workspace and per-mission timer JS keep working.
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    var main =
      document.querySelector("main.page-shell") ||
      document.querySelector("main");
    if (!main || main.dataset.stepFlow === "on") {
      return;
    }
    main.dataset.stepFlow = "on";

    /* ---------- 1. Inject styles ---------- */
    injectStyles();

    /* ---------- 2. Locate the pieces of the page ---------- */
    var hero =
      main.querySelector(".hero-mission, .mission-hero, .hero") || null;
    var nav = main.querySelector(".mission-nav, .nav-bar") || null;

    // A "content block" is any of the wrapper styles used across missions:
    // .panel (layout A/A2), section.section (layout B), .card (layout C).
    var BLOCK_SEL = ".panel, section.section, section.card";
    // Wrappers that hold two columns of blocks; we flatten these in order.
    var WRAP_SEL = ".content-grid, .two-col";

    function isPrintWorkspace(el) {
      if (!el) return false;
      if (el.closest(".print-workspace")) return true;
      var label = (el.getAttribute("aria-label") || "").toLowerCase();
      if (/work\s*space|print/.test(label)) return true;
      var h = el.querySelector("h2, h3");
      if (h && /^\s*work\s*space\s*$/i.test(h.textContent)) return true;
      return false;
    }

    // Walk main's children in document order. When we hit a column wrapper,
    // descend and collect the blocks inside it (preserving order). This keeps
    // a single, layout-agnostic ordered list of content blocks.
    var blocks = [];
    function collectFrom(container, deep) {
      Array.prototype.forEach.call(container.children, function (el) {
        if (el === hero || el === nav) return;
        if (el.matches && el.matches(WRAP_SEL)) {
          collectFrom(el, true);
          return;
        }
        if (el.matches && el.matches(BLOCK_SEL)) {
          if (blocks.indexOf(el) === -1) blocks.push(el);
          return;
        }
        if (deep && el.querySelector && el.querySelector(BLOCK_SEL)) {
          collectFrom(el, true);
        }
      });
    }
    collectFrom(main, false);

    // Fallback: if structured walk found nothing, grab any matching blocks.
    if (!blocks.length) {
      blocks = Array.prototype.slice.call(main.querySelectorAll(BLOCK_SEL));
    }

    blocks = blocks.filter(function (b) {
      return b && b !== hero && !isPrintWorkspace(b);
    });

    if (!hero && !blocks.length) {
      return; // nothing we can do
    }

    /* ---------- 3. Categorise each block into a step ---------- */
    var STEP_DEFS = [
      { key: "brief", title: "Mission Brief", icon: "🚀" },
      { key: "roles", title: "Team Roles", icon: "👥" },
      { key: "investigate", title: "Investigate", icon: "🔍" },
      { key: "phases", title: "Lab Phases", icon: "⏱️" },
      { key: "challenge", title: "Challenge", icon: "🧩" },
      { key: "defend", title: "Defend & Finish", icon: "🏁" },
    ];

    function categorize(block) {
      var id = (block.id || "").toLowerCase();
      var heading = block.querySelector("h2, h3");
      var text = ((heading && heading.textContent) || "").toLowerCase();
      var hay = id + " " + text;

      if (/role|team/.test(hay)) return "roles";
      if (/phase|timed|timer/.test(hay)) return "phases";
      if (/defen|exit|reflect|submit|rubric/.test(hay)) return "defend";
      if (/challeng|extension|what if/.test(hay)) return "challenge";
      if (/investig|problem|task|explore|model|guide/.test(hay))
        return "investigate";
      return "investigate";
    }

    // Map: key -> array of blocks
    var grouped = {};
    STEP_DEFS.forEach(function (s) {
      grouped[s.key] = [];
    });
    blocks.forEach(function (b) {
      grouped[categorize(b)].push(b);
    });

    /* ---------- 4. Build the step stage ---------- */
    var stage = document.createElement("div");
    stage.className = "sf-stage";

    var steps = []; // { key, title, icon, panel }

    // Step: Mission Brief (hero clone area)
    if (hero) {
      var brief = makeStep(STEP_DEFS[0]);
      brief.body.appendChild(hero);
      // any leftover "brief" blocks
      grouped.brief.forEach(function (b) {
        brief.body.appendChild(b);
      });
      stage.appendChild(brief.panel);
      steps.push(brief);
    } else if (grouped.brief.length) {
      var brief2 = makeStep(STEP_DEFS[0]);
      grouped.brief.forEach(function (b) {
        brief2.body.appendChild(b);
      });
      stage.appendChild(brief2.panel);
      steps.push(brief2);
    }

    STEP_DEFS.slice(1).forEach(function (def) {
      var list = grouped[def.key];
      if (!list.length) return;
      var step = makeStep(def);
      list.forEach(function (b) {
        step.body.appendChild(b);
      });
      stage.appendChild(step.panel);
      steps.push(step);
    });

    if (steps.length <= 1) {
      // Not enough to bother stepping; leave page as-is.
      return;
    }

    function makeStep(def) {
      var panel = document.createElement("section");
      panel.className = "sf-step";
      panel.setAttribute("role", "group");
      panel.setAttribute("aria-roledescription", "slide");
      panel.setAttribute("tabindex", "-1");
      panel.hidden = true;

      var head = document.createElement("div");
      head.className = "sf-step-head";
      var icon = document.createElement("span");
      icon.className = "sf-step-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = def.icon;
      var h = document.createElement("h2");
      h.className = "sf-step-title";
      h.textContent = def.title;
      head.appendChild(icon);
      head.appendChild(h);

      var body = document.createElement("div");
      body.className = "sf-step-body";

      panel.appendChild(head);
      panel.appendChild(body);
      return {
        key: def.key,
        title: def.title,
        icon: def.icon,
        panel: panel,
        body: body,
      };
    }

    /* ---------- 5. Progress header + nav footer ---------- */
    var progress = document.createElement("div");
    progress.className = "sf-progress";
    progress.setAttribute("role", "navigation");
    progress.setAttribute("aria-label", "Mission steps");

    var bar = document.createElement("div");
    bar.className = "sf-bar";
    var barFill = document.createElement("div");
    barFill.className = "sf-bar-fill";
    bar.appendChild(barFill);

    var dots = document.createElement("ol");
    dots.className = "sf-dots";
    var dotEls = steps.map(function (step, i) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sf-dot";
      btn.innerHTML =
        '<span class="sf-dot-num" aria-hidden="true">' +
        (i + 1) +
        '</span><span class="sf-dot-label">' +
        escapeHtml(step.title) +
        "</span>";
      btn.addEventListener("click", function () {
        go(i);
      });
      li.appendChild(btn);
      dots.appendChild(li);
      return btn;
    });

    var counter = document.createElement("p");
    counter.className = "sf-counter";
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");

    progress.appendChild(bar);
    progress.appendChild(dots);
    progress.appendChild(counter);

    var footer = document.createElement("div");
    footer.className = "sf-nav";
    var backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "sf-btn sf-btn-back";
    backBtn.innerHTML = '<span aria-hidden="true">←</span> Back';
    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "sf-btn sf-btn-next";
    nextBtn.innerHTML = 'Next <span aria-hidden="true">→</span>';
    backBtn.addEventListener("click", function () {
      go(current - 1);
    });
    nextBtn.addEventListener("click", function () {
      go(current + 1);
    });
    footer.appendChild(backBtn);
    footer.appendChild(nextBtn);

    /* ---------- 6. Assemble in the DOM ---------- */
    // Keep nav (Back to hub / prev / next mission) at the very top.
    var anchor = nav || main.firstElementChild;
    if (nav) {
      nav.insertAdjacentElement("afterend", progress);
    } else {
      main.insertBefore(progress, anchor);
    }
    progress.insertAdjacentElement("afterend", stage);
    stage.insertAdjacentElement("afterend", footer);

    // Move print workspace to the end (already there) — leave untouched.

    /* ---------- 7. Step engine ---------- */
    var current = -1;
    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(index, opts) {
      opts = opts || {};
      if (index < 0 || index >= steps.length || index === current) {
        if (index === current) return;
      }
      index = Math.max(0, Math.min(steps.length - 1, index));
      var prev = current;
      current = index;

      steps.forEach(function (s, i) {
        s.panel.hidden = i !== current;
      });

      dotEls.forEach(function (d, i) {
        var state = i < current ? "done" : i === current ? "current" : "todo";
        d.dataset.state = state;
        if (i === current) {
          d.setAttribute("aria-current", "step");
        } else {
          d.removeAttribute("aria-current");
        }
      });

      var pct = ((current + 1) / steps.length) * 100;
      barFill.style.width = pct + "%";
      counter.textContent =
        "Step " +
        (current + 1) +
        " of " +
        steps.length +
        " — " +
        steps[current].title;

      backBtn.disabled = current === 0;
      nextBtn.disabled = current === steps.length - 1;
      nextBtn.classList.toggle("is-final", current === steps.length - 1);
      nextBtn.innerHTML =
        current === steps.length - 1
          ? '<span aria-hidden="true">✓</span> Finished'
          : 'Next <span aria-hidden="true">→</span>';

      // Focus + scroll management (skip on first paint)
      if (prev !== -1) {
        steps[current].panel.focus({ preventScroll: true });
        var top =
          progress.getBoundingClientRect().top + window.pageYOffset - 12;
        window.scrollTo({
          top: top,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    }

    // Keyboard: arrows / PageUp-Down move between steps when not typing.
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      // Don't hijack arrows while typing or inside interactive controls.
      // Guard for non-Element targets (e.g. document) which lack matches/closest.
      if (
        t &&
        typeof t.matches === "function" &&
        (t.matches("input, textarea, select") ||
          t.isContentEditable ||
          (t.closest && t.closest(".phase-toggle, summary, details")))
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(current - 1);
      }
    });

    go(0);

    /* ---------- helpers ---------- */
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (c) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c];
      });
    }
  });

  function injectStyles() {
    if (document.getElementById("sf-styles")) return;
    var css = [
      /* Comfortable base sizing for Grade 6 readers */
      "main.page-shell[data-step-flow='on']{font-size:18px;line-height:1.65;}",
      ".sf-stage h2{font-size:1.6rem;}",
      ".sf-stage h3{font-size:1.25rem;}",
      ".sf-stage p,.sf-stage li,.sf-stage span{font-size:1.05rem;}",

      /* Progress header */
      ".sf-progress{position:sticky;top:0;z-index:20;background:rgba(255,253,248,0.96);" +
        "backdrop-filter:saturate(1.1) blur(4px);border:1px solid var(--line,#d9e1e8);" +
        "border-radius:14px;padding:14px 16px 10px;margin:6px 0 18px;" +
        "box-shadow:0 6px 18px rgba(26,40,58,0.08);}",
      ".sf-bar{height:10px;border-radius:999px;background:var(--soft-blue,#edf5ff);overflow:hidden;}",
      ".sf-bar-fill{height:100%;width:0;border-radius:999px;" +
        "background:linear-gradient(90deg,var(--teal,#207a7a),var(--navy,#23395d));" +
        "transition:width .3s ease;}",
      ".sf-dots{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:12px 0 0;padding:0;}",
      ".sf-dots li{flex:1 1 auto;}",
      ".sf-dot{width:100%;display:flex;align-items:center;gap:8px;justify-content:center;" +
        "min-height:44px;padding:8px 10px;border:1px solid var(--line,#d9e1e8);" +
        "border-radius:10px;background:#fff;color:var(--muted,#5b6573);font:inherit;" +
        "font-weight:800;font-size:0.92rem;cursor:pointer;transition:all .15s ease;}",
      ".sf-dot:hover{border-color:var(--teal,#207a7a);}",
      ".sf-dot-num{display:inline-flex;align-items:center;justify-content:center;" +
        "width:26px;height:26px;flex:0 0 auto;border-radius:50%;background:var(--soft-blue,#edf5ff);" +
        "color:var(--navy,#23395d);font-size:0.85rem;}",
      ".sf-dot[data-state='current']{border-color:var(--navy,#23395d);background:var(--navy,#23395d);color:#fff;}",
      ".sf-dot[data-state='current'] .sf-dot-num{background:#fff;color:var(--navy,#23395d);}",
      ".sf-dot[data-state='done']{border-color:var(--teal,#207a7a);color:var(--teal-dark,#135f60);background:var(--soft-teal,#ecf8f6);}",
      ".sf-dot[data-state='done'] .sf-dot-num{background:var(--teal,#207a7a);color:#fff;}",
      ".sf-dot[data-state='done'] .sf-dot-num::after{content:'✓';}",
      ".sf-dot[data-state='done'] .sf-dot-num{font-size:0.8rem;}",
      ".sf-counter{margin:10px 0 0;font-weight:800;color:var(--navy,#23395d);font-size:0.95rem;}",
      "@media (max-width:620px){.sf-dot-label{display:none;}.sf-dots li{flex:1 1 0;}}",

      /* Step panels */
      ".sf-step{outline:none;animation:sf-in .28s ease;}",
      ".sf-step[hidden]{display:none;}",
      ".sf-step-head{display:flex;align-items:center;gap:12px;margin:0 0 14px;}",
      ".sf-step-icon{display:inline-flex;align-items:center;justify-content:center;" +
        "width:52px;height:52px;flex:0 0 auto;border-radius:14px;font-size:1.7rem;" +
        "background:var(--soft-teal,#ecf8f6);border:1px solid #b9ddd8;}",
      ".sf-step-title{margin:0;color:var(--navy,#23395d);font-size:1.7rem;line-height:1.1;}",
      ".sf-step-body{display:block;}",
      /* Stack any internal two-column grids vertically inside a step for focus */
      ".sf-step-body .role-grid{grid-template-columns:repeat(2,1fr);}",
      ".sf-step-body>.panel,.sf-step-body>section.section,.sf-step-body>.hero-mission," +
        ".sf-step-body>.mission-hero,.sf-step-body>.hero{margin-bottom:18px;}",

      /* Nav footer */
      ".sf-nav{display:flex;gap:12px;justify-content:space-between;align-items:center;" +
        "margin:8px 0 28px;}",
      ".sf-btn{min-height:54px;flex:1 1 auto;max-width:280px;padding:14px 22px;border-radius:12px;" +
        "border:2px solid transparent;font:inherit;font-weight:900;font-size:1.1rem;cursor:pointer;" +
        "display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s ease,filter .12s ease;}",
      ".sf-btn-back{background:#fff;border-color:#aeb9c5;color:var(--navy,#23395d);}",
      ".sf-btn-next{background:var(--navy,#23395d);color:#fff;}",
      ".sf-btn-next.is-final{background:var(--green,#2f7d32);}",
      ".sf-btn:hover:not(:disabled){filter:brightness(1.05);}",
      ".sf-btn:active:not(:disabled){transform:translateY(1px);}",
      ".sf-btn:disabled{opacity:.4;cursor:not-allowed;}",
      ".sf-btn:focus-visible,.sf-dot:focus-visible,.sf-step:focus-visible{" +
        "outline:3px solid var(--teal,#207a7a);outline-offset:3px;}",

      "@keyframes sf-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}",
      "@media (prefers-reduced-motion:reduce){.sf-step{animation:none;}.sf-bar-fill{transition:none;}}",

      /* Print: show everything, hide step chrome */
      "@media print{.sf-progress,.sf-nav{display:none !important;}" +
        ".sf-step[hidden]{display:block !important;}" +
        ".sf-step{break-inside:avoid;}}",
    ].join("");
    var style = document.createElement("style");
    style.id = "sf-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }
})();
