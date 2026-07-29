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
    grid.dataset.lazyUnitCatalog = "1";
    var orderedCards = cards.slice();
    var activeNum = null;

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

    function attachAll() {
      orderedCards.forEach(function (card) {
        grid.appendChild(card);
      });
    }
    function showOne(num) {
      orderedCards.forEach(function (card) {
        if (cardNum(card) === num) grid.appendChild(card);
        else if (card.parentNode === grid) card.remove();
      });
    }
    function activate(num, scroll) {
      activeNum = num;
      orderedCards.forEach(function (c) {
        c.classList.toggle("curr-active", cardNum(c) === num);
      });
      if (shell.classList.contains("curr-detail-mode")) showOne(num);
      rail.querySelectorAll(".curr-rail-item").forEach(function (b) {
        b.setAttribute("aria-current", b.dataset.num === num ? "true" : "false");
      });
      if (scroll) {
        try {
          shell.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (_e) {}
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
      if (browse) attachAll();
      else if (activeNum) showOne(activeNum);
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

  /* ---- Teacher-mode arrow-key paging ------------------------------------- *
   * In Teacher Mode, Left/Right arrow keys flip to the previous/next unit —
   * the curriculum's "pages" in single-unit detail view. It fires a click on
   * the adjacent rail button, reusing the exact same switch-and-scroll path as
   * a manual rail click, so it stays correct even after the hub re-renders.
   * A single document-level listener reads the live DOM on each press (never
   * closing over a stale shell). Up/Down keep their native scroll; ends clamp
   * (no wrap). Student mode is untouched.                                     */
  function isEditableTarget(t) {
    if (!t || !t.tagName) return false;
    var tag = t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (t.isContentEditable) return true;
    var role = t.getAttribute && t.getAttribute("role");
    return role === "combobox" || role === "listbox" || role === "textbox";
  }

  function stepUnit(dir) {
    var rail = document.querySelector("#interactive-hub .curr-rail");
    if (!rail) return false;
    var shell = rail.closest(".curr-shell");
    // Only page in single-unit detail mode — not while searching/filtering,
    // when every unit card is shown at once (browse mode).
    if (shell && !shell.classList.contains("curr-detail-mode")) return false;
    var items = Array.prototype.slice.call(rail.querySelectorAll(".curr-rail-item"));
    if (items.length < 2) return false;
    var cur = rail.querySelector('.curr-rail-item[aria-current="true"]');
    var i = cur ? items.indexOf(cur) : 0;
    var next = i + dir;
    if (next < 0 || next >= items.length) return false; // clamp at the ends
    items[next].click();
    return true;
  }

  function initArrowPaging() {
    if (window.__currArrowPaging) return;
    window.__currArrowPaging = true;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (!document.body.classList.contains("teacher-mode")) return;
      if (isEditableTarget(e.target)) return;
      // Don't steal the arrow keys from an open modal/dialog.
      if (document.querySelector(".modal-overlay.show") || document.querySelector("dialog[open]"))
        return;
      if (stepUnit(e.key === "ArrowRight" ? 1 : -1)) e.preventDefault();
    });
  }

  function boot() {
    tryBuild();
    initArrowPaging();
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
