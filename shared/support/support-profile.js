/*
 * EduWonderLab — Persistent Support Profile (v1)
 * =============================================================================
 * ONE versioned record of the learning supports a student has chosen, so the
 * choice follows them across lessons, games, Number Realm, projects, Math
 * Workbench, assessments, progress views, and family-facing reports instead of
 * resetting on every page.
 *
 * RELATIONSHIP TO THE EXISTING SUPPORTS LAYER
 *   assets/learning-supports/learning-supports.js remains the in-lesson UI and
 *   keeps its own store (`ewl-supports:v1:preferences`). This profile READS
 *   that store to seed itself the first time, and never deletes or rewrites it.
 *   A lesson page therefore behaves exactly as before; other surfaces gain the
 *   ability to honour the same choices.
 *
 * WHAT IS DELIBERATELY NOT STORED
 *   No diagnoses. No IEP or 504 documents. No medical information. No
 *   disability labels. No confidential teacher notes. A student turns on the
 *   supports that help them; nothing in this record explains or justifies why,
 *   because a student should never have to disclose a condition to get a
 *   sentence frame. The BANNED_FIELDS list below is asserted by
 *   test/support-profile.test.mjs so a future field cannot quietly break this.
 *
 * PRIVACY
 *   Local-first, single localStorage key, never transmitted, no third-party
 *   anything. Clearing it is a one-call, non-destructive-to-anything-else
 *   operation.
 *
 * PUBLIC API (window.EWLSupportProfile)
 *   get()                -> the full profile object
 *   set(patch)           -> merge + persist + apply + notify; returns profile
 *   reset()              -> back to defaults
 *   apply(root)          -> reflect passive supports onto a document/element
 *   onChange(fn)         -> subscribe; returns an unsubscribe function
 *   isDefault()          -> true when the learner has changed nothing
 *   evidenceSnapshot()   -> the subset that is safe to attach to evidence
 *   FIELDS, SCHEMA_VERSION, BANNED_FIELDS
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLSupportProfile) return;

  var SCHEMA_VERSION = 1;
  var KEY = "ewl:support-profile:v1";
  var LEGACY_SUPPORTS_KEY = "ewl-supports:v1:preferences";

  /* Field name fragments that must never appear in this record. Enforced by a
   * test rather than trusted to review. */
  var BANNED_FIELDS = [
    "diagnosis",
    "diagnoses",
    "iep",
    "504",
    "disability",
    "medical",
    "medication",
    "confidential",
    "teacherNote",
    "eligibility",
  ];

  /* Every field, its default, and its type. `passive` fields are reflected onto
   * the document automatically by apply(). */
  var FIELDS = {
    interfaceLanguage: { default: "en", type: "string" },
    homeLanguageSupport: { default: "none", type: "string" },
    readAloud: { default: false, type: "boolean", passive: true },
    vocabularyPreview: { default: false, type: "boolean", passive: true },
    sentenceSupportTier: { default: 0, type: "number" }, // 0..4, see the scaffold ladder
    readingSupportTier: { default: 0, type: "number" },
    chunkedDirections: { default: false, type: "boolean", passive: true },
    reducedMotion: { default: false, type: "boolean", passive: true },
    largerText: { default: false, type: "boolean", passive: true },
    highContrast: { default: false, type: "boolean", passive: true },
    calculatorAccess: { default: false, type: "boolean" },
    multiplicationChartAccess: { default: false, type: "boolean" },
    visualModelPreference: { default: "any", type: "string" },
    writingSupport: { default: false, type: "boolean" },
    focusMode: { default: false, type: "boolean", passive: true },
    simplifiedDirections: { default: false, type: "boolean", passive: true },
    translatedDirections: { default: false, type: "boolean", passive: true },
  };

  var listeners = [];
  var cache = null;

  function defaults() {
    var out = { v: SCHEMA_VERSION };
    Object.keys(FIELDS).forEach(function (key) {
      out[key] = FIELDS[key].default;
    });
    return out;
  }

  function lsGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }

  function lsSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
      return true;
    } catch (_e) {
      return false;
    }
  }

  function readJson(key) {
    var raw = lsGet(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }

  function coerce(key, value) {
    var spec = FIELDS[key];
    if (!spec) return undefined;
    if (spec.type === "boolean") return Boolean(value);
    if (spec.type === "number") {
      var n = Number(value);
      return Number.isFinite(n) ? n : spec.default;
    }
    return value == null ? spec.default : String(value);
  }

  /**
   * Seed a first-time profile from settings the learner has already made
   * elsewhere, so turning this on does not silently reset anyone.
   *
   * Sources, all read-only:
   *   ewl-supports:v1:preferences  — the in-lesson supports dock
   *   mw_lang / mw_a11y            — Math Workbench
   *   pa-lang / ra-lang            — practice + reading activities
   *   prefers-reduced-motion       — the operating system
   */
  function seedFromExisting() {
    var profile = defaults();

    var legacy = readJson(LEGACY_SUPPORTS_KEY);
    if (legacy) {
      if (legacy.language) profile.interfaceLanguage = String(legacy.language);
      if (legacy.highContrast) profile.highContrast = true;
      if (Number(legacy.textScale) > 1) profile.largerText = true;
      if (legacy.comfortMode) profile.reducedMotion = true;
      var profiles = legacy.profiles || {};
      if (profiles.tts || profiles["iep-tts"]) profile.readAloud = true;
      if (profiles.vocab || profiles.translate) profile.vocabularyPreview = true;
      if (profiles.frames) {
        profile.writingSupport = true;
        profile.sentenceSupportTier = 2;
      }
      if (profiles["iep-chunk"] || profiles.chunk) profile.chunkedDirections = true;
      if (profiles.calculator || profiles["iep-calculator"]) profile.calculatorAccess = true;
      if (profiles["multiplication-chart"] || profiles["iep-multiplication-chart"]) {
        profile.multiplicationChartAccess = true;
      }
      if (profiles.translate) profile.translatedDirections = true;
    }

    var workbenchLang = lsGet("mw_lang") || lsGet("pa-lang") || lsGet("ra-lang");
    if (workbenchLang && workbenchLang !== "en") {
      profile.interfaceLanguage = workbenchLang;
      profile.homeLanguageSupport = workbenchLang;
    }
    if (lsGet("mw_a11y") === "1") profile.largerText = true;

    try {
      if (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        profile.reducedMotion = true;
      }
    } catch (_e) {
      /* matchMedia unavailable */
    }

    return profile;
  }

  /**
   * Versioned read. A record written by a FUTURE schema version is left alone
   * and reported as defaults rather than being downgraded, so an older tab can
   * never destroy a newer profile.
   */
  function migrate(stored) {
    if (!stored || typeof stored !== "object") return null;
    var version = Number(stored.v) || 1;
    if (version > SCHEMA_VERSION) return defaults();
    var profile = defaults();
    Object.keys(FIELDS).forEach(function (key) {
      if (stored[key] !== undefined) {
        var value = coerce(key, stored[key]);
        if (value !== undefined) profile[key] = value;
      }
    });
    profile.v = SCHEMA_VERSION;
    return profile;
  }

  function get() {
    if (cache) return Object.assign({}, cache);
    var stored = readJson(KEY);
    cache = migrate(stored) || seedFromExisting();
    return Object.assign({}, cache);
  }

  function persist(profile) {
    cache = profile;
    lsSet(KEY, JSON.stringify(profile));
  }

  function notify(profile) {
    listeners.slice().forEach(function (fn) {
      try {
        fn(Object.assign({}, profile));
      } catch (_e) {
        /* a broken subscriber must not break the others */
      }
    });
    try {
      global.dispatchEvent(new CustomEvent("ewl:support-profile", { detail: profile }));
    } catch (_e) {
      /* CustomEvent unavailable */
    }
  }

  function set(patch) {
    var profile = get();
    Object.keys(patch || {}).forEach(function (key) {
      var value = coerce(key, patch[key]);
      if (value !== undefined) profile[key] = value;
    });
    persist(profile);
    apply();
    notify(profile);
    return Object.assign({}, profile);
  }

  function reset() {
    var profile = defaults();
    persist(profile);
    apply();
    notify(profile);
    return Object.assign({}, profile);
  }

  function isDefault() {
    var profile = get();
    var base = defaults();
    return Object.keys(FIELDS).every(function (key) {
      return profile[key] === base[key];
    });
  }

  /**
   * Reflect the passive supports onto the document as data attributes, so any
   * page can honour them with CSS alone (see support-profile.css). Pages that
   * want richer behaviour subscribe with onChange() instead.
   */
  function apply(root) {
    var el = root || (global.document && global.document.documentElement);
    if (!el || !el.setAttribute) return;
    var profile = get();
    Object.keys(FIELDS).forEach(function (key) {
      if (!FIELDS[key].passive) return;
      var attr = "data-ewl-" + key.replace(/[A-Z]/g, function (c) {
        return "-" + c.toLowerCase();
      });
      if (profile[key]) el.setAttribute(attr, "on");
      else el.removeAttribute(attr);
    });
    el.setAttribute("data-ewl-language", profile.interfaceLanguage || "en");
  }

  function onChange(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i !== -1) listeners.splice(i, 1);
    };
  }

  /**
   * The subset safe to attach to an evidence event. Support USE is recorded so
   * a teacher can see movement toward independence — it is never a penalty and
   * never lowers a score.
   */
  function evidenceSnapshot() {
    var profile = get();
    return {
      supportLevel: "tier-" + profile.sentenceSupportTier,
      languageSetting: profile.interfaceLanguage,
      readAloudUsed: profile.readAloud,
      vocabularySupportUsed: profile.vocabularyPreview,
    };
  }

  global.EWLSupportProfile = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    FIELDS: FIELDS,
    BANNED_FIELDS: BANNED_FIELDS,
    STORAGE_KEY: KEY,
    get: get,
    set: set,
    reset: reset,
    apply: apply,
    onChange: onChange,
    isDefault: isDefault,
    evidenceSnapshot: evidenceSnapshot,
    _defaults: defaults,
    _migrate: migrate,
    _seedFromExisting: seedFromExisting,
  };

  // Apply on load so a page honours the profile without any per-page wiring.
  try {
    if (global.document) {
      if (global.document.readyState === "loading") {
        global.document.addEventListener("DOMContentLoaded", function () {
          apply();
        });
      } else {
        apply();
      }
    }
  } catch (_e) {
    /* non-DOM environment (tests) */
  }
})(typeof window !== "undefined" ? window : globalThis);
