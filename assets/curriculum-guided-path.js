(function () {
  "use strict";

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
      if ((toolsReady && hubReady) || attempts++ > 40) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
