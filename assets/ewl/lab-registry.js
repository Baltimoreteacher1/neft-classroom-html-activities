/* EWL.Lab — the mode registry for the Math Reality Lab page (/curriculum/reality-lab/).
 *
 * The lab page owns the shell (header, mode tabs, Evidence Notebook, teacher panel). Each way of working —
 * Investigate, Counterexample Forge, Invariant Hunter, Sketch — is a "mode" registered here by its own file, so
 * modes are built and tested independently and the page never hard-codes them.
 *
 *   EWL.Lab.registerMode({
 *     id: "forge",                        // [a-z0-9-]+, also the ?mode= value
 *     title: "Counterexample Forge", titleEs: "Fragua de contraejemplos",
 *     blurb: "...", blurbEs: "...",
 *     order: 20,                          // tab order, lower first
 *     mount: function (host, ctx) { ...; return { destroy: function () {} }; }
 *   });
 *
 * ctx (built by EWL.Lab.context):
 *   lang, store (EWLStateStore), Rat, Reason, h, svg, t, announce, rng,
 *   activity(kind, slug) -> "ewl.<kind>.<slug>" checked by EWL.id,
 *   evidence(activityId, entry) -> saves to the Evidence Notebook (entry: {claim?, prediction?, data?, argument?, ok?, note?})
 *   params -> URLSearchParams of the page (modes read their own deep-link keys from it)
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var modes = [];

  function registerMode(m) {
    if (!m || !/^[a-z0-9-]+$/.test(String(m.id)) || typeof m.mount !== "function" || !m.title)
      throw new TypeError("EWL.Lab.registerMode: id, title and mount are required");
    if (
      modes.some(function (x) {
        return x.id === m.id;
      })
    )
      throw new Error("EWL.Lab: duplicate mode " + m.id);
    modes.push(m);
    modes.sort(function (a, b) {
      return (a.order || 100) - (b.order || 100);
    });
    return m;
  }

  function context(params) {
    var store = EWL.state;
    return {
      lang: EWL.lang ? EWL.lang() : "en",
      store: store,
      Rat: EWL.Rat,
      Reason: EWL.Reason,
      h: EWL.h,
      svg: EWL.svg,
      t: EWL.t,
      announce: EWL.announce,
      rng: EWL.rng,
      params: params || new URLSearchParams(""),
      activity: function (kind, slug) {
        return EWL.id(kind, slug);
      },
      evidence: function (activityId, entry) {
        if (!EWL.ID_RE.test(activityId))
          throw new RangeError("EWL.Lab.evidence: bad activity id " + activityId);
        store.addEvidence(activityId, entry);
      },
    };
  }

  EWL.Lab = {
    registerMode: registerMode,
    modes: function () {
      return modes.slice();
    },
    mode: function (id) {
      return (
        modes.filter(function (m) {
          return m.id === id;
        })[0] || null
      );
    },
    context: context,
  };
})(typeof window !== "undefined" ? window : globalThis);
