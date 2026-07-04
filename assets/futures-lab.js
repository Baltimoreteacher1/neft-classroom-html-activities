/* Futures Lab — additive curriculum-hub card injector.
 * Surfaces /futures/ (5 privacy-safe Grade 6 prototypes) as an ai-hub-feature
 * card, mirroring existing hub markup so it inherits styling. Self-contained,
 * idempotent, and graceful: if the hub markup changes, it simply no-ops.
 * No data, no network calls. */
(function () {
  "use strict";
  const CARD_ID = "futures-lab-feature";

  function buildCard() {
    const sec = document.createElement("section");
    sec.className = "ai-hub-feature futures-lab-feature";
    sec.id = CARD_ID;
    sec.setAttribute("aria-labelledby", "futures-lab-feature-title");
    sec.innerHTML = `
      <div class="ahf-icon" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 15c0-5 3.5-9.5 9-11 .6 4-.2 7.6-2.4 10.2C9.8 16 7.4 16 5 15Z"
            stroke="#f2c15b" stroke-width="1.4" fill="rgba(242,193,91,0.18)" stroke-linejoin="round"/>
          <path d="M5 15c-1.2.6-1.8 2-1.8 3.8 1.8 0 3.2-.6 3.8-1.8" stroke="#f2c15b" stroke-width="1.4" stroke-linejoin="round"/>
          <circle cx="13.5" cy="8.5" r="1.3" fill="#7fe3df"/>
        </svg>
      </div>
      <div class="ahf-body">
        <span class="ahf-tag">New · Explore</span>
        <h2 id="futures-lab-feature-title">Futures Lab</h2>
        <p class="ahf-sub">Five futuristic, privacy-safe ways to learn Grade 6 math.</p>
        <p class="ahf-text">
          Walk inside a 3D volume you build cube-by-cube, plot points in 3D space,
          talk through a problem with a Socratic voice tutor, star in your own math
          comic, or re-level any problem with read-aloud and translation. Everything
          runs in the browser — nothing is recorded or sent anywhere.
        </p>
        <div class="ahf-actions">
          <a class="ahf-btn solid" href="/futures/">Open the Futures Lab</a>
        </div>
      </div>`;
    return sec;
  }

  function inject() {
    if (document.getElementById(CARD_ID)) return; // idempotent
    // Insert after an existing feature card so it lands in the same region.
    const anchor =
      document.querySelector(".class-brain-feature") ||
      [...document.querySelectorAll(".ai-hub-feature")].pop();
    if (!anchor || !anchor.parentNode) return; // hub markup changed → no-op
    anchor.insertAdjacentElement("afterend", buildCard());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
