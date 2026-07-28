/*
 * EduWonderLab — Canonical Curriculum Registry client
 * =============================================================================
 * The ONE browser-side resolver for canonical curriculum identifiers. Fetches
 * data/curriculum-canonical.json once, caches it, and answers the questions
 * every surface was previously answering with its own string surgery:
 *
 *   "the printed handout says 6.RP.3 — what standard is that now?"
 *   "Number Realm recorded 6.AT.A.1 — same thing?"
 *   "this bookmark points at /math/unit-4/ — which canonical unit is that?"
 *
 * Every alias in the registry (old CCSS codes, cluster-qualified standard
 * spellings, legacy /math/unit-N/ routes) resolves through resolve(). Adding a
 * new alias is a registry edit, not a code change.
 *
 * Local-first and failure-tolerant: if the registry cannot be fetched (offline
 * activity, file:// preview), every method returns a safe empty answer and the
 * calling page keeps working.
 *
 * PUBLIC API (window.EWLRegistry)
 *   load()                       -> Promise<registry>
 *   resolve(id)                  -> canonical id or null (sync, after load)
 *   unit(idOrNumber)             -> unit record or null
 *   lesson(idOrLessonId)         -> lesson record or null
 *   standard(code)               -> { code, description, crosswalk } or null
 *   lessonsForUnit(n)            -> lesson records
 *   lessonsForStandard(code)     -> lesson records
 *   productsForUnit(n)           -> product ids
 *   isLoaded()
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLRegistry) return;

  var URL = "/data/curriculum-canonical.json";
  var registry = null;
  var pending = null;

  function load() {
    if (registry) return Promise.resolve(registry);
    if (pending) return pending;
    pending = fetch(URL, { credentials: "omit" })
      .then(function (res) {
        if (!res.ok) throw new Error("registry-unavailable");
        return res.json();
      })
      .then(function (json) {
        registry = json;
        try {
          global.dispatchEvent(new CustomEvent("ewl:registry-ready", { detail: registry }));
        } catch (_e) {
          /* CustomEvent unavailable */
        }
        return registry;
      })
      .catch(function () {
        // Empty-but-valid registry: callers get null answers, never exceptions.
        registry = { units: [], lessons: [], aliases: {}, unavailable: true };
        return registry;
      });
    return pending;
  }

  function isLoaded() {
    return Boolean(registry) && !registry.unavailable;
  }

  /** Resolve any known alias (or a canonical id) to its canonical id. */
  function resolve(id) {
    if (!registry || id == null) return null;
    var key = String(id);
    if (registry.aliases && registry.aliases[key]) return registry.aliases[key];
    var unitHit = (registry.units || []).some(function (u) {
      return u.canonicalUnitId === key;
    });
    if (unitHit) return key;
    var lessonHit = (registry.lessons || []).some(function (l) {
      return l.canonicalLessonId === key;
    });
    return lessonHit ? key : null;
  }

  function unit(idOrNumber) {
    if (!registry) return null;
    var canonical =
      typeof idOrNumber === "number" ? "unit-" + idOrNumber : resolve(idOrNumber) || idOrNumber;
    return (
      (registry.units || []).filter(function (u) {
        return u.canonicalUnitId === canonical;
      })[0] || null
    );
  }

  function lesson(id) {
    if (!registry) return null;
    var canonical = resolve(id) || id;
    return (
      (registry.lessons || []).filter(function (l) {
        return l.canonicalLessonId === canonical || l.lessonId === String(id);
      })[0] || null
    );
  }

  function standard(code) {
    if (!registry) return null;
    var canonical = resolve(code) || code;
    var hit = (registry.lessons || []).filter(function (l) {
      return l.standard === canonical;
    })[0];
    if (!hit) return null;
    return {
      code: canonical,
      description: hit.standardDescription,
      shortLabel: hit.standardShortLabel,
      crosswalk: hit.standardsCrosswalk || {},
    };
  }

  function lessonsForUnit(n) {
    if (!registry) return [];
    var canonical = typeof n === "number" ? "unit-" + n : resolve(n) || n;
    return (registry.lessons || []).filter(function (l) {
      return l.canonicalUnitId === canonical;
    });
  }

  function lessonsForStandard(code) {
    if (!registry) return [];
    var canonical = resolve(code) || code;
    return (registry.lessons || []).filter(function (l) {
      return l.standard === canonical;
    });
  }

  function productsForUnit(n) {
    var u = unit(n);
    return u ? u.products || [] : [];
  }

  global.EWLRegistry = {
    load: load,
    isLoaded: isLoaded,
    resolve: resolve,
    unit: unit,
    lesson: lesson,
    standard: standard,
    lessonsForUnit: lessonsForUnit,
    lessonsForStandard: lessonsForStandard,
    productsForUnit: productsForUnit,
    raw: function () {
      return registry;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
