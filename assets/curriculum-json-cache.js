/* =============================================================================
 * curriculum-json-cache — one network request per JSON file, per page load.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * The hub's feature scripts each grew their own loadJson()/getJson(), so a
 * single load of /curriculum/ fetched:
 *
 *   /data/curriculum-manifest.json         × 4  (enhancements, ready-next,
 *                                                audit-badges, product-upgrades)
 *   /data/curriculum-launch-manifest.json  × 3  (teacher-workflow,
 *                                                studio-journey, product-upgrades)
 *
 * — 7 requests for 2 distinct files. That is what pushed the page over the
 * 60-request budget enforced by scripts/perf-curriculum.mjs (62 > 60 on the
 * first Production Observability run that actually measured production).
 *
 * WHAT IT MEMOIZES, AND WHY THAT AND NOT THE OBVIOUS THING
 * It caches the response TEXT, not the parsed object. Every caller still runs
 * its own JSON.parse and so still owns its own object graph. Handing seven
 * independent feature scripts one shared parsed manifest would turn any
 * mutation by one of them into a silent bug in the other six — a far worse
 * failure than the duplicate request this removes. Re-parsing costs nothing
 * new: each caller already parsed its own copy today.
 *
 * Failures are NOT cached. A transient 5xx on the first caller must not poison
 * the file for every later caller on the same page.
 *
 * Callers keep their own error handling by wrapping json() themselves — this
 * module deliberately has no opinion about what a missing file means.
 * ========================================================================== */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  /** url -> Promise<{ok, status, text}> */
  var pending = Object.create(null);

  function text(url, init) {
    if (pending[url]) return pending[url];
    var promise = fetch(url, init || { credentials: "same-origin" })
      .then(function (response) {
        return response.text().then(function (body) {
          return { ok: response.ok, status: response.status, text: body };
        });
      })
      .catch(function (error) {
        delete pending[url];
        throw error;
      });
    pending[url] = promise;
    return promise;
  }

  function json(url, init) {
    return text(url, init).then(function (result) {
      if (!result.ok) {
        // Carry the status on the error so a caller debugging in the console
        // can tell a 404 (file genuinely missing) from a 503 (worth retrying).
        var error = /** @type {Error & { status?: number }} */ (
          new Error(url + " " + result.status)
        );
        error.status = result.status;
        throw error;
      }
      return JSON.parse(result.text);
    });
  }

  window.NTJsonCache = { json: json, text: text };
})();
