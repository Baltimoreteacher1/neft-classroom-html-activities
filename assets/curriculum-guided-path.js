(function () {
  "use strict";

  var printUnits = document.createDocumentFragment();
  var printUnitsAnchor = null;

  // Open the requested workflow view once the teacher panel exists. The panel
  // is built asynchronously by curriculum-teacher-workflow.js after its data
  // loads, so poll briefly for the tab before giving up.
  function openWorkflowView(view, waited) {
    waited = waited || 0;
    var panel = document.getElementById("curriculum-teacher-workflow");
    var tab = panel && panel.querySelector('[data-ctw-view="' + view + '"]');
    if (!tab) {
      if (waited > 8000) return;
      setTimeout(function () {
        openWorkflowView(view, waited + 120);
      }, 120);
      return;
    }
    tab.click();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showTeacherView(view) {
    var modeButton = document.getElementById("hub-mode-toggle");
    if (!modeButton) {
      setTimeout(function () {
        showTeacherView(view);
      }, 150);
      return;
    }
    if (document.body.classList.contains("teacher-mode")) {
      openWorkflowView(view);
      return;
    }
    // Not in teacher mode yet: request it, then open the view once teacher mode
    // actually activates. The toggle may show a PIN prompt, so activation is
    // async and may never resolve (teacher cancels) — poll with a bounded wait
    // and no-op on timeout. Previously this returned immediately after the
    // click, so the first click only flipped the mode and the requested
    // workflow never opened until a second click.
    modeButton.click();
    var waited = 0;
    var timer = setInterval(function () {
      if (document.body.classList.contains("teacher-mode")) {
        clearInterval(timer);
        openWorkflowView(view);
      } else if ((waited += 120) > 8000) {
        clearInterval(timer);
      }
    }, 120);
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
