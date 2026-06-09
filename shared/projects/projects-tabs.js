/* ==========================================================================
   Neft Teacher — Projects TABS / STEPPER (shared, progressive enhancement)
   Turns the top-level `.phase` sections of a `.pk` culminating project into an
   accessible, tabbed stepper with a sticky tab bar, Prev/Next nav, a "Step X
   of N" progress bar, completed-step checkmarks, hash deep-linking, and an
   optional data-driven Research tab.

   Reference as /shared/projects/projects-tabs.js (load with `defer`, AFTER
   projects-kit.js). Pairs with /shared/projects/projects-tabs.css.

   PROGRESSIVE: if this script never runs (JS off / error), the page keeps all
   phases visible and fully usable — nothing is hidden by CSS alone. We only add
   `pk-tabs-on` to <body> once we have successfully built the stepper.

   SAVE/RESUME SAFE: phases are never removed from the DOM — inactive panels are
   hidden with the `hidden` attribute, so every input still persists and the
   save-resume engine and calculators keep working untouched.

   PRINT SAFE: projects-tabs.css restores all phases under @media print.

   ACCESSIBLE: role=tablist/tab/tabpanel, aria-selected, roving tabindex,
   Left/Right/Home/End arrow-key navigation, and focus moves to the panel
   heading on change.

   DATA-DRIVEN RESEARCH: if a `<script type="application/json" id="pk-research">`
   block is present, its links are rendered into a new "Research & Resources"
   phase/tab. Schema:
     { "title": "Research & Resources", "intro": "…", "icon": "🔎",
       "links": [ { "name":"…", "url":"https://…", "find":"…", "look":"…",
                    "icon":"🛒" }, … ] }
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  // Short, tab-friendly label from a phase heading.
  function shortLabel(text) {
    var t = (text || "").replace(/\s+/g, " ").trim();
    if (t.length <= 22) return t;
    return t.slice(0, 21).replace(/\s+\S*$/, "") + "…";
  }

  /* ---------------- Research tab (data-driven) ---------------- */
  function buildResearchPhase() {
    var dataEl = document.getElementById("pk-research");
    if (!dataEl) return null;
    var cfg;
    try {
      cfg = JSON.parse(dataEl.textContent || "{}");
    } catch (e) {
      return null;
    }
    if (!cfg || !Array.isArray(cfg.links) || !cfg.links.length) return null;

    var icon = cfg.icon || "🔎";
    var title = cfg.title || "Research & Resources";
    var section = document.createElement("section");
    section.className = "phase pk-research-phase";

    var head = document.createElement("div");
    head.className = "phase-head";
    var badge = document.createElement("div");
    badge.className = "phase-num";
    badge.setAttribute("style", "background:var(--teal,#0e9a8c)");
    badge.textContent = icon;
    var headText = document.createElement("div");
    var skill = document.createElement("div");
    skill.className = "skill";
    skill.textContent = "Gather real information";
    var h2 = document.createElement("h2");
    h2.textContent = title;
    headText.appendChild(skill);
    headText.appendChild(h2);
    head.appendChild(badge);
    head.appendChild(headText);
    section.appendChild(head);

    if (cfg.intro) {
      var intro = document.createElement("p");
      intro.innerHTML = cfg.intro;
      section.appendChild(intro);
    }

    var list = document.createElement("div");
    list.className = "pk-research-list";
    cfg.links.forEach(function (lnk) {
      if (!lnk || !lnk.url) return;
      var a = document.createElement("a");
      a.className = "pk-research-card";
      a.href = lnk.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      var top = document.createElement("div");
      top.className = "pk-rc-top";
      var ic = document.createElement("span");
      ic.className = "pk-rc-icon";
      ic.textContent = lnk.icon || "🔗";
      var tt = document.createElement("span");
      tt.className = "pk-rc-title";
      tt.textContent = lnk.name || lnk.url;
      var ext = document.createElement("span");
      ext.className = "pk-rc-ext";
      ext.textContent = "opens in new tab ↗";
      top.appendChild(ic);
      top.appendChild(tt);
      top.appendChild(ext);
      a.appendChild(top);

      if (lnk.find) {
        var find = document.createElement("p");
        find.className = "pk-rc-find";
        find.textContent = lnk.find;
        a.appendChild(find);
      }
      if (lnk.look) {
        var look = document.createElement("p");
        look.className = "pk-rc-look";
        look.innerHTML = "<b>Look for:</b> " + escapeHtml(lnk.look);
        a.appendChild(look);
      }
      list.appendChild(a);
    });
    section.appendChild(list);

    var safe = document.createElement("p");
    safe.className = "pk-research-safe";
    safe.textContent =
      cfg.note ||
      "These sites were picked for class. They open in a new tab so you keep your project. If a page asks you to sign in or buy something, just close it and come back.";
    section.appendChild(safe);

    return section;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  /* ---------------- Stepper ---------------- */
  function buildTabs() {
    var wrap = document.querySelector(".pk .wrap, body.pk .wrap");
    if (!wrap) wrap = document.querySelector(".wrap");
    if (!wrap) return;

    var phases = Array.prototype.slice.call(wrap.children).filter(function (n) {
      return n.classList && n.classList.contains("phase");
    });
    if (phases.length < 2) return; // nothing to tab

    // Insert the optional Research phase before a trailing rubric phase if one
    // exists, otherwise append it after the work phases.
    var research = buildResearchPhase();
    if (research) {
      var last = phases[phases.length - 1];
      var isRubric = /rubric|how you are scored|scored/i.test(
        last.textContent.slice(0, 120),
      );
      if (isRubric) {
        wrap.insertBefore(research, last);
        phases.splice(phases.length - 1, 0, research);
      } else {
        wrap.appendChild(research);
        phases.push(research);
      }
    }

    var total = phases.length;

    // Build the sticky tab bar.
    var bar = document.createElement("div");
    bar.className = "pk-tabbar pk-no-print";

    var topRow = document.createElement("div");
    topRow.className = "pk-tabbar-top";
    var count = document.createElement("div");
    count.className = "pk-step-count";
    var stepBar = document.createElement("div");
    stepBar.className = "pk-step-bar";
    var stepFill = document.createElement("i");
    stepBar.appendChild(stepFill);
    topRow.appendChild(count);
    topRow.appendChild(stepBar);

    var tablist = document.createElement("div");
    tablist.className = "pk-tablist";
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Project steps");

    bar.appendChild(topRow);
    bar.appendChild(tablist);

    var tabs = [];
    phases.forEach(function (phase, i) {
      var h = phase.querySelector("h2");
      var labelText = shortLabel(h ? h.textContent : "Step " + (i + 1));
      var panelId = "phase-" + (i + 1);
      var tabId = "pktab-" + (i + 1);

      phase.id = phase.id || panelId;
      phase.classList.add("pk-panel");
      phase.setAttribute("role", "tabpanel");
      phase.setAttribute("aria-labelledby", tabId);
      phase.setAttribute("tabindex", "-1");

      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "pk-tab";
      tab.id = tabId;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", phase.id);
      tab.setAttribute("aria-selected", "false");
      tab.setAttribute("tabindex", "-1");
      tab.dataset.index = String(i);

      var dot = document.createElement("span");
      dot.className = "pk-tab-dot";
      dot.textContent = String(i + 1);
      var lbl = document.createElement("span");
      lbl.textContent = labelText;
      tab.appendChild(dot);
      tab.appendChild(lbl);

      tab.addEventListener("click", function () {
        go(i, true);
      });
      tab.addEventListener("keydown", onKeydown);

      tablist.appendChild(tab);
      tabs.push(tab);
    });

    // Insert the bar right before the first phase.
    phases[0].parentNode.insertBefore(bar, phases[0]);

    // Prev/Next footer nav inserted after the LAST phase.
    var nav = document.createElement("div");
    nav.className = "pk-tabnav pk-no-print";
    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "pk-prev";
    prev.innerHTML = "← <span>Back</span>";
    var next = document.createElement("button");
    next.type = "button";
    next.className = "pk-next";
    next.innerHTML = "<span>Next step</span> →";
    nav.appendChild(prev);
    nav.appendChild(next);
    phases[total - 1].parentNode.insertBefore(
      nav,
      phases[total - 1].nextSibling,
    );

    prev.addEventListener("click", function () {
      if (current > 0) go(current - 1, true);
    });
    next.addEventListener("click", function () {
      if (current < total - 1) go(current + 1, true);
    });

    var current = -1;
    var furthest = 0;

    function markDone() {
      // Every step at-or-before the furthest visited gets a checkmark, except
      // the one currently shown.
      tabs.forEach(function (tab, i) {
        var done = i < furthest;
        tab.classList.toggle("pk-done", done);
        var dot = tab.querySelector(".pk-tab-dot");
        if (dot) dot.textContent = done ? "✓" : String(i + 1);
      });
    }

    function go(i, focusPanel, viaHash) {
      i = Math.max(0, Math.min(total - 1, i));
      if (i === current) return;
      current = i;
      if (i > furthest) furthest = i;

      phases.forEach(function (phase, j) {
        if (j === i) {
          phase.hidden = false;
          phase.classList.remove("pk-panel-hidden");
        } else {
          phase.hidden = true;
          phase.classList.add("pk-panel-hidden");
        }
      });
      tabs.forEach(function (tab, j) {
        var sel = j === i;
        tab.setAttribute("aria-selected", sel ? "true" : "false");
        tab.setAttribute("tabindex", sel ? "0" : "-1");
      });

      // Re-trigger the entrance animation.
      var panel = phases[i];
      panel.classList.remove("pk-panel");
      void panel.offsetWidth;
      panel.classList.add("pk-panel");

      count.innerHTML = "Step <b>" + (i + 1) + "</b> of " + total;
      stepFill.style.width = ((i + 1) / total) * 100 + "%";
      prev.disabled = i === 0;
      next.disabled = i === total - 1;
      markDone();

      // Keep the active tab visible in the scroll strip.
      if (tabs[i].scrollIntoView) {
        tabs[i].scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: "smooth",
        });
      }

      // Update hash without adding a history entry on programmatic moves from
      // hash sync; otherwise push so Back button steps through tabs.
      var hash = "#phase-" + (i + 1);
      if (!viaHash && location.hash !== hash) {
        history.pushState(null, "", hash);
      }

      if (focusPanel) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Move focus to the panel for screen-reader + keyboard users.
        panel.focus({ preventScroll: true });
      }
    }

    function onKeydown(e) {
      var idx = tabs.indexOf(e.currentTarget);
      if (idx < 0) return;
      var n = null;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          n = (idx + 1) % total;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          n = (idx - 1 + total) % total;
          break;
        case "Home":
          n = 0;
          break;
        case "End":
          n = total - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      tabs[n].focus();
      go(n, true);
    }

    // React to hash changes (deep link + browser Back/Forward).
    function fromHash() {
      var m = /^#phase-(\d+)$/.exec(location.hash || "");
      if (m) {
        var i = parseInt(m[1], 10) - 1;
        if (i >= 0 && i < total) {
          go(i, false, true);
          return true;
        }
      }
      return false;
    }
    window.addEventListener("hashchange", function () {
      fromHash();
    });

    // Activate progressive mode now that the stepper exists.
    document.body.classList.add("pk-tabs-on");

    // Initial view: honor a deep link, else step 1.
    if (!fromHash()) {
      go(0, false);
    }

    // Expose a tiny API for pages/tests.
    window.PKTabs = {
      go: function (n) {
        go(n - 1, true);
      },
      count: total,
      current: function () {
        return current + 1;
      },
    };
  }

  ready(buildTabs);
})();
