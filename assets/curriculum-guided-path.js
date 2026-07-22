(function () {
  "use strict";

  var UNIT_KEY = "curriculumGuidedPath:unit";
  var printUnits = document.createDocumentFragment();
  var printUnitsAnchor = null;

  function showTeacherView(view) {
    var modeButton = document.getElementById("hub-mode-toggle");
    if (!modeButton) {
      setTimeout(function () {
        showTeacherView(view);
      }, 150);
      return;
    }
    if (!document.body.classList.contains("teacher-mode")) {
      modeButton.click();
      return;
    }
    var panel = document.getElementById("curriculum-teacher-workflow");
    if (!panel) return;
    var tab = panel.querySelector('[data-ctw-view="' + view + '"]');
    if (tab) tab.click();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function wireGuideActions() {
    document.querySelectorAll("[data-guide-teacher-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        showTeacherView(button.dataset.guideTeacherView);
      });
    });
  }

  function wrapTools() {
    var bar = document.querySelector(".curriculum-tools-bar");
    if (!bar || bar.closest(".curriculum-tools-disclosure")) return Boolean(bar);
    var details = document.createElement("details");
    details.className = "curriculum-tools-disclosure";
    var summary = document.createElement("summary");
    summary.textContent = "🧰 More teacher tools and featured resources";
    details.appendChild(summary);
    bar.parentNode.insertBefore(details, bar);
    details.appendChild(bar);
    return true;
  }

  function detachPrintFallbackUnits() {
    var units = Array.from(document.querySelectorAll("details.unit"));
    if (!units.length) return;
    if (!printUnitsAnchor) {
      printUnitsAnchor = document.createComment("print curriculum units");
      units[0].parentNode.insertBefore(printUnitsAnchor, units[0]);
    }
    units.forEach(function (unit) {
      unit.hidden = true;
      if ("inert" in unit) unit.inert = true;
      printUnits.appendChild(unit);
    });
  }

  function restorePrintFallbackUnits() {
    if (!printUnitsAnchor || !printUnits.childNodes.length) return;
    Array.from(printUnits.children).forEach(function (unit) {
      unit.hidden = false;
      if ("inert" in unit) unit.inert = false;
    });
    printUnitsAnchor.parentNode.insertBefore(printUnits, printUnitsAnchor.nextSibling);
  }

  function rememberedUnit(count) {
    try {
      var saved = Number(localStorage.getItem(UNIT_KEY));
      if (Number.isInteger(saved) && saved >= 0 && saved < count) return saved;
    } catch (_error) {}
    var requested = Number(new URLSearchParams(location.search).get("u"));
    return requested >= 1 && requested <= count ? requested - 1 : 0;
  }

  function saveUnit(index) {
    try {
      localStorage.setItem(UNIT_KEY, String(index));
    } catch (_error) {}
  }

  function organizeUnits() {
    var hub = document.getElementById("interactive-hub");
    if (!hub) return;
    var grid = hub.querySelector(".units-grid");
    var cards = grid
      ? Array.from(grid.children).filter((child) => child.matches(".unit-card"))
      : [];
    if (!cards.length) return;

    var previous = hub.querySelector(".curriculum-unit-nav");
    if (previous) previous.remove();
    var nav = document.createElement("nav");
    nav.className = "curriculum-unit-nav";
    nav.setAttribute("aria-label", "Choose one curriculum unit");
    grid.parentNode.insertBefore(nav, grid);

    var active = rememberedUnit(cards.length);
    function selectUnit(index, focusCard) {
      cards.forEach(function (card, cardIndex) {
        var selected = cardIndex === index;
        card.hidden = !selected;
        if ("inert" in card) card.inert = !selected;
      });
      nav.querySelectorAll("button").forEach(function (button, buttonIndex) {
        button.setAttribute("aria-pressed", buttonIndex === index ? "true" : "false");
      });
      saveUnit(index);
      if (focusCard) cards[index].scrollIntoView({ behavior: "smooth", block: "start" });
    }

    cards.forEach(function (card, index) {
      var title =
        card.querySelector(".unit-card-num")?.textContent?.trim() || "Unit " + (index + 1);
      var name = card.querySelector(".unit-card-name")?.textContent?.trim() || "";
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = title + (name ? " · " + name : "");
      button.addEventListener("click", function () {
        selectUnit(index, true);
      });
      nav.appendChild(button);
    });
    selectUnit(active, false);
  }

  function init() {
    wireGuideActions();
    detachPrintFallbackUnits();
    window.addEventListener("beforeprint", function () {
      restorePrintFallbackUnits();
    });
    window.addEventListener("afterprint", function () {
      detachPrintFallbackUnits();
    });

    var attempts = 0;
    var timer = setInterval(function () {
      var toolsReady = wrapTools();
      var hubReady = document.getElementById("interactive-hub");
      if (hubReady) organizeUnits();
      if ((toolsReady && hubReady) || attempts++ > 40) clearInterval(timer);
    }, 100);

    var hub = document.getElementById("interactive-hub");
    if (hub) {
      var queued = false;
      new MutationObserver(function () {
        if (hub.querySelector(".curriculum-unit-nav")) return;
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          organizeUnits();
        });
      }).observe(hub, { childList: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
