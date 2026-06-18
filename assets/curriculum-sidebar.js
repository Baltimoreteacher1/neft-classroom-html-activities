/* ==========================================================================
   Curriculum Hub — sidebar (master-detail) layout.
   Additive: runs AFTER curriculum-enhancements.js renders
   #interactive-hub > .units-grid > .unit-card[]. Builds a sticky left rail of
   units; selecting one shows just that unit's card on the right.
   Keyed by UNIT NUMBER so it survives the hub re-rendering on filter/search.
   Yields to search/filter (shows all cards) so results are never hidden.
   Uses a MutationObserver because the hub may render asynchronously.
   ========================================================================== */
(function () {
  "use strict";

  function cardNum(card) {
    var el = card.querySelector(".unit-card-num");
    var m = el && el.textContent.match(/\d+/);
    return m ? m[0] : null;
  }
  function cardName(card) {
    var el = card.querySelector(".unit-card-name");
    return el ? el.textContent.trim() : "";
  }

  function build(grid, cards) {
    var shell = document.createElement("div");
    shell.className = "curr-shell curr-detail-mode";
    var rail = document.createElement("nav");
    rail.className = "curr-rail";
    rail.setAttribute("aria-label", "Units");
    grid.parentNode.insertBefore(shell, grid);
    shell.appendChild(rail);
    shell.appendChild(grid);

    cards.forEach(function (card, i) {
      var num = cardNum(card) || String(i + 1);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "curr-rail-item";
      btn.dataset.num = num;
      btn.innerHTML =
        '<span class="cri-num">Unit ' +
        num +
        "</span>" +
        '<span class="cri-name">' +
        cardName(card) +
        "</span>";
      btn.addEventListener("click", function () {
        activate(num, true);
      });
      rail.appendChild(btn);
    });

    function getCards() {
      return Array.prototype.slice.call(grid.querySelectorAll(":scope > .unit-card"));
    }
    function activate(num, scroll) {
      getCards().forEach(function (c) {
        c.classList.toggle("curr-active", cardNum(c) === num);
      });
      rail.querySelectorAll(".curr-rail-item").forEach(function (b) {
        b.setAttribute("aria-current", b.dataset.num === num ? "true" : "false");
      });
      if (scroll) {
        try {
          shell.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (e) {}
      }
    }

    var search = document.getElementById("curr-search");
    function syncMode() {
      var searching = search && search.value.trim().length > 0;
      var chip = document.querySelector(".hub-filter-chip[aria-pressed='true']");
      var filtering = chip && !/all/i.test(chip.textContent || "");
      var browse = !!(searching || filtering);
      shell.classList.toggle("curr-detail-mode", !browse);
      shell.classList.toggle("curr-browse-mode", browse);
    }
    if (search) search.addEventListener("input", syncMode);
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".hub-filter-chip")) setTimeout(syncMode, 0);
    });

    var u = new URLSearchParams(location.search).get("u");
    var startNum =
      u &&
      cards.some(function (c) {
        return cardNum(c) === String(u);
      })
        ? String(u)
        : cardNum(cards[0]) || "1";
    activate(startNum, false);
    syncMode();
  }

  function tryBuild() {
    var grid = document.querySelector("#interactive-hub .units-grid");
    if (!grid) return false;
    if (grid.dataset.sidebar) return true;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(":scope > .unit-card"));
    if (cards.length < 2) return false;
    grid.dataset.sidebar = "1";
    build(grid, cards);
    return true;
  }

  function boot() {
    tryBuild();
    // Keep watching: the hub re-renders (e.g., API → DOM fallback), which would
    // wipe the shell. tryBuild() is idempotent (guarded by dataset.sidebar), so
    // re-running on mutations rebuilds only when a fresh, unwrapped grid appears.
    var scheduled = false;
    var obs = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        tryBuild();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
