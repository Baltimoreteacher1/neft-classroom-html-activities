(function () {
  "use strict";

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
    /** @type {HTMLElement} */ (tab).click();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showTeacherView(view, attempts) {
    attempts = attempts || 0;
    // Checked FIRST, before anything looks for the mode toggle. On the
    // Curriculum Hub console the page is server-gated and always in Teacher
    // Mode, so there is no toggle to wait for — and waiting for one made "Teach
    // today" and "Plan the week" do nothing for six seconds and then give up.
    if (document.body.classList.contains("teacher-mode")) {
      openWorkflowView(view);
      return;
    }
    var modeButton = document.getElementById("hub-mode-toggle");
    if (!modeButton) {
      // Bounded wait (~6s): if the mode toggle never renders (e.g. broken
      // controls bar), give up instead of polling forever every 150ms.
      if (attempts >= 40) return;
      setTimeout(function () {
        showTeacherView(view, attempts + 1);
      }, 150);
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
        showTeacherView(/** @type {HTMLElement} */ (button).dataset.guideTeacherView);
      });
    });
  }

  function wrapTools() {
    var bar = document.querySelector(".curriculum-tools-bar");
    if (!bar) return false;
    var details = bar.closest(".curriculum-tools-disclosure");
    if (!details) {
      details = document.createElement("details");
      details.className = "curriculum-tools-disclosure";
      var summary = document.createElement("summary");
      summary.textContent = "🧰 More teacher tools and featured resources";
      details.appendChild(summary);
      bar.parentNode.insertBefore(details, bar);
      details.appendChild(bar);
    }

    // curriculum-enhancements builds the mode control asynchronously. If it
    // wins the race with this wrapper, its lift script can place the control
    // outside the disclosure; if this wrapper wins, it lands inside. Reconcile
    // both orders so the public hub has one stable layout.
    var modeControls = document.getElementById("hub-enhance-bar");
    if (modeControls && !details.contains(modeControls)) {
      details.insertBefore(modeControls, bar);
    }
    return true;
  }

  // The canonical unit rail replaces this static list on screen, so hide it --
  // but leave it IN THE DOCUMENT. This used to move every details.unit into a
  // DocumentFragment, which took all 74 details.lesson nodes out of the
  // document with them. Every consumer that looks lessons up with a document
  // query silently found nothing: status badges and resource pills stopped
  // rendering, "Print unit" fell through to printing all ten units, and the
  // beforeprint expand/restore pair closed everything it had just opened.
  // Hiding is enough -- curriculum-enhancements.css forces `details.unit` and
  // `details.lesson` back to `display: block !important` inside @media print.
  function hidePrintFallbackUnits() {
    document.querySelectorAll("details.unit").forEach(function (el) {
      const unit = /** @type {HTMLElement} */ (el);
      unit.hidden = true;
      if ("inert" in unit) unit.inert = true;
    });
  }

  function init() {
    wireGuideActions();
    hidePrintFallbackUnits();

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
