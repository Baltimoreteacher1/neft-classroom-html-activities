/* Answer-key presentation helper.
 *
 * Production authorization is enforced before HTML is served by
 * functions/_middleware.js using the Cloudflare SITE_PASSWORD secret. No
 * password, PIN, or answer-key credential belongs in browser JavaScript.
 * Once this file runs, the server has already authorized the request (or the
 * page is being previewed locally), so it only reveals the fail-closed markup.
 */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  function revealAuthorizedPage() {
    document.documentElement.classList.add("akg-unlocked");
    document.querySelectorAll(".akg-card").forEach(function (card) {
      card.remove();
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", revealAuthorizedPage, { once: true });
  else revealAuthorizedPage();
})();
