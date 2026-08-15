/*
 * lesson-supports.js — the LESSON ADAPTATION LAYER (Phase 3).
 *
 * WHAT THIS IS. A teacher selects supports for a LESSON; this module resolves
 * that selection into the capabilities the existing engine already implements,
 * and into a human-readable preview of what will change. It renders nothing and
 * fetches nothing. Everything here is a pure function over two inputs:
 *
 *     canonical lesson support data (assets/learning-supports/manifest.json)
 *   + a teacher's lesson support profile (deltas only, see PROFILE below)
 *   → resolved capabilities + preview
 *
 * WHAT THIS IS NOT. It is not a second curriculum engine, it does not copy
 * lesson content, and it never writes to a lesson file. The canonical lesson is
 * the source of truth and remains renderable with every support switched off —
 * that is the fallback contract in §FALLBACK below.
 *
 * NO STUDENT DATA. A lesson support profile names a LESSON and a set of
 * instructional supports. It carries no student name, no initials, no section,
 * no disability category, no WIDA record. The per-student roster is a separate,
 * teacher-gated system (/teacher-tools/learning-supports-manager/ over D1) and
 * this module deliberately shares none of its storage.
 *
 * WHY THE CAPABILITY MAP IS SMALL. Every support in the catalogue below names
 * capabilities that ALREADY EXIST and are ALREADY WIRED:
 *   - `profiles` → learning-supports.js PROFILE_KEYS (the student supports dock)
 *   - `tools`    → learning-supports.js TOOL_KEYS (individual math tools)
 *   - `adapt`    → supports-adaptations.js taxonomy keys, whose MODE_KEYS map
 *                  them onto live behaviour (chunking, workload, praise, …)
 * A support with no capability behind it is a lie told to a teacher who is
 * relying on it during instruction, so this file may not carry one. If you add
 * a support, add the behaviour first; tools/validate-lesson-supports.mjs fails
 * the build when a catalogue entry names a capability the engine does not have.
 *
 * IMPACT. Every support declares one of:
 *   "access"       — changes how the student reaches or answers the task.
 *                    Objective, values and correct answer are untouched.
 *   "scaffold"     — objective unchanged; adds instructional support.
 *   "modification" — changes the task, amount, or expectation. Always labelled.
 * Nothing here may quietly change protected mathematics; see PROTECTED below.
 *
 * FALLBACK. Every consumer must treat this module as optional. If it fails to
 * load, or a profile fails to parse, the caller renders the canonical lesson.
 * A support-system failure must never stop a lesson.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && !root.EWLLessonSupports) root.EWLLessonSupports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SCHEMA_VERSION = 1;
  var STORAGE_KEY = "ewl-lesson-supports:v1";

  /* --------------------------------------------------------------------------
   * PROTECTED — fields an accommodation may never rewrite.
   *
   * The adaptation layer only ever ADDS presentation and language scaffolding
   * around canonical content. These are the manifest/config fields that carry
   * the mathematics itself; tests assert that applying any non-modification
   * support leaves every one of them byte-identical.
   * ----------------------------------------------------------------------- */
  var PROTECTED_FIELDS = [
    "standard",
    "contentObjective",
    "workedExample",
    "correctIndex",
    "answer",
    "sampleAnswer",
    "target",
    "solution",
  ];

  /* --------------------------------------------------------------------------
   * ELEMENTS — the semantic lesson components a support can attach to.
   *
   * Named, not selector-shaped, on purpose: an adaptation anchored to
   * `.lesson div:nth-child(7)` dies the next time the layout moves.
   * ----------------------------------------------------------------------- */
  var ELEMENTS = [
    "directions",
    "vocabulary",
    "discussion",
    "response",
    "problem",
    "interactive",
    "workedExample",
    "practice",
    "reflection",
  ];

  /* --------------------------------------------------------------------------
   * CATALOGUE.
   *
   * `requires(entry)` is the APPLICABILITY rule: a support is offered only when
   * the lesson actually carries the content to deliver it. A word-bank toggle on
   * a lesson with no word bank is a control that does nothing, and a teacher who
   * finds one stops trusting the rest.
   * ----------------------------------------------------------------------- */
  function nonEmpty(list) {
    return Array.isArray(list) && list.length > 0;
  }

  var CATALOG = [
    // --- Language ----------------------------------------------------------
    {
      key: "visual-vocabulary",
      label: "Visual vocabulary",
      category: "language",
      impact: "access",
      elements: ["vocabulary", "problem", "directions"],
      profiles: ["read-understand"],
      contract: {
        may: [
          "expose this lesson's own definitions and visual cues",
          "add tap-to-define on lesson terms",
        ],
        mustNot: ["replace precise mathematical vocabulary with looser wording"],
      },
      requires: function (entry) {
        return nonEmpty(entry && entry.vocabulary);
      },
    },
    {
      key: "bilingual-vocabulary",
      label: "Bilingual vocabulary (Spanish)",
      category: "language",
      impact: "access",
      elements: ["vocabulary"],
      profiles: ["language-support"],
      contract: {
        may: ["show the authored Spanish term and definition beside the English"],
        mustNot: ["translate the mathematics into a different problem"],
      },
      requires: function (entry) {
        return (
          nonEmpty(entry && entry.vocabulary) &&
          entry.vocabulary.some(function (v) {
            return v && (v.termEs || v.definitionEs);
          })
        );
      },
    },
    {
      key: "word-bank",
      label: "Word bank",
      category: "language",
      impact: "access",
      elements: ["response", "discussion"],
      profiles: ["express-thinking"],
      contract: {
        may: ["offer this lesson's academic terms while the student writes"],
        mustNot: ["supply the numbers, the relationship, or the reasoning"],
      },
      requires: function (entry) {
        return nonEmpty(entry && entry.wordBank);
      },
    },
    {
      key: "sentence-frames",
      label: "Sentence frames",
      category: "language",
      impact: "access",
      elements: ["response", "discussion", "reflection"],
      profiles: ["express-thinking"],
      contract: {
        may: ["offer this lesson's authored explanation frames"],
        mustNot: ["pre-fill the reasoning the frame is asking the student to supply"],
      },
      requires: function (entry) {
        return nonEmpty(entry && entry.sentenceFrames);
      },
    },
    {
      key: "read-aloud",
      label: "Read aloud",
      category: "language",
      impact: "access",
      elements: ["directions", "problem", "vocabulary"],
      profiles: ["read-understand"],
      contract: {
        may: ["speak directions, prompts and definitions on request"],
        mustNot: ["read out an answer the student has not yet reached"],
      },
      // Speech synthesis is a browser capability, not lesson content — the only
      // requirement is that the lesson has text worth hearing, which is always.
      requires: function () {
        return true;
      },
    },

    // --- Access ------------------------------------------------------------
    {
      key: "chunk-directions",
      label: "Chunk directions",
      category: "access",
      impact: "access",
      elements: ["directions", "problem"],
      adapt: ["iep-chunk-text"],
      contract: {
        may: ["present multi-step directions one step at a time", "soften what is not in play"],
        mustNot: ["remove a mathematical step", "drop or change a given value"],
      },
      requires: function () {
        return true;
      },
    },
    {
      key: "reduced-visual-load",
      label: "Reduced visual load",
      category: "access",
      impact: "access",
      elements: ["directions", "interactive", "practice"],
      profiles: ["focus-organize"],
      contract: {
        may: ["dim secondary panels until needed", "add spacing", "focus one task at a time"],
        mustNot: ["hide information the student needs in order to solve the problem"],
      },
      requires: function () {
        return true;
      },
    },
    {
      key: "step-checklist",
      label: "Step checklist",
      category: "access",
      impact: "access",
      elements: ["directions", "practice"],
      profiles: ["focus-organize"],
      contract: {
        may: ["track which part of the task is done"],
        mustNot: ["mark mathematical work correct"],
      },
      requires: function () {
        return true;
      },
    },

    // --- Response ----------------------------------------------------------
    {
      key: "dictation",
      label: "Speak instead of type",
      category: "response",
      impact: "access",
      elements: ["response", "reflection"],
      profiles: ["express-thinking"],
      contract: {
        may: ["accept a spoken explanation in place of a typed one"],
        mustNot: ["shorten the reasoning the response is asking for"],
      },
      requires: function () {
        return true;
      },
    },
    {
      key: "visual-model",
      label: "Visual model",
      category: "response",
      impact: "access",
      elements: ["problem", "interactive", "response"],
      tools: ["model"],
      contract: {
        may: ["offer a labelled model of the relationship in play"],
        mustNot: ["complete the model for the student"],
      },
      requires: function () {
        return true;
      },
    },
    {
      key: "number-line",
      label: "Number line",
      category: "response",
      impact: "access",
      elements: ["problem", "interactive"],
      tools: ["numberline"],
      contract: { may: ["offer a number line as a thinking tool"], mustNot: ["mark the answer"] },
      requires: function () {
        return true;
      },
    },
    {
      key: "multiplication-chart",
      label: "Multiplication chart",
      category: "response",
      impact: "access",
      elements: ["problem", "practice"],
      tools: ["multchart"],
      contract: {
        may: ["reduce fact-recall load so the reasoning stays in view"],
        mustNot: ["be offered where fact recall IS the objective"],
      },
      requires: function (entry, ctx) {
        return !(ctx && ctx.factRecallIsObjective);
      },
    },
    {
      key: "place-value-chart",
      label: "Place-value chart",
      category: "response",
      impact: "access",
      elements: ["problem", "practice"],
      tools: ["placevalue"],
      contract: { may: ["organise digits by place"], mustNot: ["perform the regrouping"] },
      requires: function () {
        return true;
      },
    },
    {
      key: "calculator",
      label: "Calculator",
      category: "response",
      impact: "access",
      elements: ["practice"],
      tools: ["calculator"],
      contract: {
        may: ["remove computation load from a lesson whose objective is reasoning"],
        mustNot: ["be offered where the computation IS the objective"],
      },
      requires: function (entry, ctx) {
        return !(ctx && ctx.computationIsObjective);
      },
    },

    // --- Instruction -------------------------------------------------------
    {
      key: "worked-example",
      label: "Additional worked example",
      category: "instruction",
      impact: "scaffold",
      elements: ["workedExample", "practice"],
      profiles: ["read-understand"],
      contract: {
        may: ["show this lesson's own worked example again, on request"],
        mustNot: ["work the problem the student has been asked to solve"],
      },
      requires: function (entry) {
        return !!(entry && entry.workedExample);
      },
    },
    {
      key: "readiness-review",
      label: "Prerequisite review",
      category: "instruction",
      impact: "scaffold",
      elements: ["practice"],
      profiles: ["build-math"],
      contract: {
        may: ["route to the lesson's own readiness activity"],
        mustNot: ["replace the grade-level lesson"],
      },
      requires: function (entry) {
        return !!(entry && entry.readinessHref);
      },
    },
    {
      key: "extension",
      label: "Extension / already has it",
      category: "instruction",
      impact: "scaffold",
      elements: ["practice", "reflection"],
      profiles: ["challenge-extend"],
      contract: {
        may: ["add deeper reasoning and error-analysis prompts"],
        mustNot: ["skip the grade-level objective"],
      },
      requires: function () {
        return true;
      },
    },

    // --- Modification ------------------------------------------------------
    // Deliberately the only entry with impact "modification". It changes HOW
    // MUCH is asked, so it is separated, labelled, and never bundled into a
    // preset that a teacher might read as an accommodation.
    {
      key: "shorter-practice-set",
      label: "Shorter practice set",
      category: "modification",
      impact: "modification",
      elements: ["practice"],
      adapt: ["fewer"],
      contract: {
        may: ["serve fewer practice problems, never below three"],
        mustNot: ["make the remaining problems easier or change their answers"],
      },
      requires: function () {
        return true;
      },
    },
  ];

  var BY_KEY = {};
  CATALOG.forEach(function (s) {
    BY_KEY[s.key] = s;
  });

  /* --------------------------------------------------------------------------
   * NOT IMPLEMENTED — accommodations this software cannot honestly deliver.
   *
   * These appear on the teacher surface as a short, plainly worded note, and
   * NEVER as a toggle. A checkbox labelled "Extended time" that changes nothing
   * is worse than no checkbox: a teacher ticks it, records that the
   * accommodation was provided, and it was not. Each entry states the reason so
   * the note stays true when the reason stops being true — at which point the
   * support moves into CATALOG with the behaviour that justifies it.
   * ----------------------------------------------------------------------- */
  var NOT_IMPLEMENTED = [
    {
      key: "extended-time",
      label: "Extended time",
      reason:
        "Nothing a student sees in these lessons is on a clock. The only countdown is the Phase 1 warmup timer, which is a teacher facilitation control and already a global teacher setting — the lesson itself imposes no time limit to relax.",
      insteadDo: "Set the warmup countdown from Teacher Mode; student work is untimed already.",
    },
    {
      key: "scribe",
      label: "Scribe",
      reason:
        "A scribe is a person, not a page behaviour. What the software can do is take a spoken answer.",
      insteadDo: "Turn on “Speak instead of type”.",
    },
    {
      key: "preferential-seating",
      label: "Preferential seating / reduced noise / breaks logged",
      reason: "Room and schedule accommodations happen outside the lesson software.",
      insteadDo: "Record these on the student's plan, not here.",
    },
  ];

  var CATEGORIES = [
    { id: "language", label: "Language" },
    { id: "access", label: "Access" },
    { id: "response", label: "Response" },
    { id: "instruction", label: "Instruction" },
    { id: "modification", label: "Changes the task" },
  ];

  /* --------------------------------------------------------------------------
   * PRESETS — common combinations, not student classifications.
   *
   * Named for the instructional need, never for a learner. No preset may include
   * a "modification" support: a teacher reaching for "Language + visual" is
   * asking for access, and quietly reducing the task under that label is the
   * single failure this system exists to prevent.
   * ----------------------------------------------------------------------- */
  var PRESETS = [
    {
      key: "multilingual",
      label: "Multilingual learner support",
      keys: [
        "visual-vocabulary",
        "bilingual-vocabulary",
        "sentence-frames",
        "word-bank",
        "read-aloud",
      ],
    },
    {
      key: "wida-entering",
      label: "WIDA Entering / Emerging",
      keys: [
        "visual-vocabulary",
        "bilingual-vocabulary",
        "word-bank",
        "sentence-frames",
        "read-aloud",
        "chunk-directions",
        "visual-model",
      ],
    },
    {
      key: "wida-developing",
      label: "WIDA Developing / Expanding",
      keys: ["visual-vocabulary", "sentence-frames", "word-bank"],
    },
    {
      key: "language-visual",
      label: "Language + visual support",
      keys: ["visual-vocabulary", "sentence-frames", "visual-model"],
    },
    {
      key: "executive-function",
      label: "Chunking + organisation",
      keys: ["chunk-directions", "step-checklist", "reduced-visual-load"],
    },
    {
      key: "reduced-load",
      label: "Reduced visual load",
      keys: ["reduced-visual-load", "chunk-directions"],
    },
    {
      key: "written-expression",
      label: "Written expression support",
      keys: ["sentence-frames", "word-bank", "dictation"],
    },
    {
      key: "scaffolded-access",
      label: "Scaffolded access",
      keys: ["worked-example", "readiness-review", "visual-model", "step-checklist"],
    },
    { key: "extension", label: "Already has it", keys: ["extension"] },
  ];

  PRESETS.forEach(function (p) {
    // Structural guarantee, checked again by the validator: presets carry only
    // real catalogue keys, and never a modification.
    p.keys = (p.keys || []).filter(function (k) {
      return BY_KEY[k] && BY_KEY[k].impact !== "modification";
    });
  });

  /* --------------------------------------------------------------------------
   * LESSON IDENTITY. One id space across home, planner, whole-group,
   * small-group and supports. A variant resolves to its parent for CONTENT and
   * keeps its own id for OVERRIDES.
   * ----------------------------------------------------------------------- */
  var CANONICAL_RE = /^(\d+-\d+)(?:-(group\d+|catchup|flagship))?$/;

  function parseLessonId(id) {
    var m = CANONICAL_RE.exec(String(id || "").trim());
    if (!m) return null;
    return { id: m[0], parent: m[1], variant: m[2] || null };
  }

  /** The lesson whose authored support content a variant inherits. */
  function parentLessonId(id) {
    var p = parseLessonId(id);
    return p ? p.parent : null;
  }

  function isVariant(id) {
    var p = parseLessonId(id);
    return !!(p && p.variant);
  }

  /* --------------------------------------------------------------------------
   * APPLICABILITY. Which of the catalogue this lesson can actually deliver.
   * ----------------------------------------------------------------------- */
  function applicableSupports(entry, ctx) {
    return CATALOG.filter(function (s) {
      try {
        return !!s.requires(entry, ctx || {});
      } catch (_e) {
        // A throwing rule must not take the surface down; treat as inapplicable.
        return false;
      }
    });
  }

  /* --------------------------------------------------------------------------
   * PROFILE. The stored delta. Nothing but a lesson id, support keys, and a
   * schema version — no lesson title, no problem text, no URL, no student.
   * ----------------------------------------------------------------------- */
  function emptyProfile(lessonId) {
    return { schemaVersion: SCHEMA_VERSION, lessonId: lessonId || null, keys: [], preset: null };
  }

  /** Accepts anything; returns a valid profile. Unknown keys are dropped rather
   * than thrown, so a profile written by a later version cannot break a lesson. */
  function normalizeProfile(raw, lessonId) {
    var out = emptyProfile(lessonId);
    if (!raw || typeof raw !== "object") return out;
    if (raw.lessonId && !lessonId) out.lessonId = String(raw.lessonId);
    var seen = {};
    (Array.isArray(raw.keys) ? raw.keys : []).forEach(function (k) {
      if (BY_KEY[k] && !seen[k]) {
        seen[k] = true;
        out.keys.push(k);
      }
    });
    if (raw.preset && PRESETS.some((p) => p.key === raw.preset)) out.preset = raw.preset;
    return out;
  }

  /** Keys a variant should NOT re-apply, because its own authored content
   * already provides that support. Idempotence, not addition: "sentence frames
   * on" means "ensure appropriate sentence support exists", and a small-group
   * lesson that authored its own better, more specific frame keeps it. */
  function intrinsicKeys(entry, variant) {
    if (!variant || !entry || !entry.variants) return [];
    var v = entry.variants[variant];
    return v && Array.isArray(v.intrinsic) ? v.intrinsic.slice() : [];
  }

  /**
   * INHERITANCE, in one place so precedence is testable:
   *   parent lesson profile → variant intrinsic dedup → variant override
   * Returns { keys, inherited, suppressed, overridden }.
   */
  function resolveForLesson(lessonId, store, entry) {
    var parsed = parseLessonId(lessonId);
    if (!parsed) return { keys: [], inherited: [], suppressed: [], overridden: false };
    var parentProfile = normalizeProfile(store && store[parsed.parent], parsed.parent);
    var ownProfile = parsed.variant
      ? normalizeProfile(store && store[parsed.id], parsed.id)
      : parentProfile;

    // A variant with its own saved profile overrides inheritance outright: a
    // teacher who configured Group 1 by hand meant it.
    var overridden = !!(parsed.variant && store && store[parsed.id]);
    var base = overridden ? ownProfile.keys : parentProfile.keys;

    var intrinsic = intrinsicKeys(entry, parsed.variant);
    var suppressed = [];
    var keys = base.filter(function (k) {
      if (intrinsic.indexOf(k) !== -1) {
        suppressed.push(k);
        return false;
      }
      return true;
    });

    return {
      keys: keys,
      inherited: overridden ? [] : parentProfile.keys.slice(),
      suppressed: suppressed,
      overridden: overridden,
    };
  }

  /* --------------------------------------------------------------------------
   * CAPABILITY RESOLUTION. Support keys → what the engine is actually told.
   * ----------------------------------------------------------------------- */
  function resolveCapabilities(keys) {
    var profiles = {};
    var tools = {};
    var adapt = {};
    (keys || []).forEach(function (k) {
      var s = BY_KEY[k];
      if (!s) return;
      (s.profiles || []).forEach(function (p) {
        profiles[p] = true;
      });
      (s.tools || []).forEach(function (t) {
        tools[t] = true;
      });
      (s.adapt || []).forEach(function (a) {
        adapt[a] = true;
      });
    });
    return {
      profiles: Object.keys(profiles).sort(),
      tools: Object.keys(tools).sort(),
      adapt: Object.keys(adapt).sort(),
    };
  }

  /** The `?supports=` transport learning-supports.js already parses. */
  function supportsParam(keys) {
    var cap = resolveCapabilities(keys);
    return cap.profiles.concat(cap.tools).join(",");
  }

  /* --------------------------------------------------------------------------
   * PREVIEW. What a teacher sees BEFORE applying. Built from the LESSON'S OWN
   * content — a generic "I know ___ because ___" where the lesson authored
   * "The height is ___ because it is perpendicular to ___" is a worse support
   * and reads as a system that did not look at the lesson.
   * ----------------------------------------------------------------------- */
  function firstOf(list, n) {
    return (Array.isArray(list) ? list : []).slice(0, n || 3);
  }

  function previewFor(key, entry) {
    var s = BY_KEY[key];
    if (!s) return null;
    var item = { key: key, label: s.label, impact: s.impact, elements: s.elements.slice() };
    if (key === "visual-vocabulary" || key === "bilingual-vocabulary") {
      item.adds = firstOf(entry && entry.vocabulary, 4).map(function (v) {
        return key === "bilingual-vocabulary" && v.termEs
          ? v.term + " · " + v.termEs + " — " + (v.definitionEs || v.definition)
          : v.term + " — " + v.definition;
      });
    } else if (key === "word-bank") {
      item.adds = [firstOf(entry && entry.wordBank, 8).join(" · ")];
    } else if (key === "sentence-frames") {
      item.adds = firstOf(entry && entry.sentenceFrames, 3);
    } else if (key === "worked-example") {
      item.adds = String((entry && entry.workedExample) || "")
        .split("\n")
        .filter(Boolean)
        .slice(0, 3);
    } else if (key === "readiness-review") {
      item.adds = [(entry && entry.readinessHref) || ""];
    } else {
      item.adds = [];
    }
    item.adds = item.adds.filter(Boolean);
    item.may = s.contract.may.slice();
    item.mustNot = s.contract.mustNot.slice();
    return item;
  }

  /** Full preview for a selection. `unchanged` is the part that matters most:
   * it states, in the teacher's own terms, what the adaptation does not touch. */
  function preview(keys, entry) {
    var items = (keys || [])
      .map(function (k) {
        return previewFor(k, entry);
      })
      .filter(Boolean);
    return {
      items: items,
      modifications: items.filter(function (i) {
        return i.impact === "modification";
      }),
      unchanged: PROTECTED_FIELDS.slice(),
    };
  }

  /* --------------------------------------------------------------------------
   * CONFLICT PRECEDENCE — documented, not left to CSS order.
   *
   * Reduced visual load collapses optional panels. An explicitly selected
   * always-on language support outranks that collapse, because a teacher who
   * turned on the word bank for this lesson meant for it to be there. What is
   * mathematically essential is never collapsible in the first place.
   * ----------------------------------------------------------------------- */
  var ALWAYS_ON_OVER_COLLAPSE = ["word-bank", "sentence-frames", "visual-vocabulary"];

  function resolveConflicts(keys) {
    var set = {};
    (keys || []).forEach(function (k) {
      set[k] = true;
    });
    var pinned = ALWAYS_ON_OVER_COLLAPSE.filter(function (k) {
      return set[k];
    });
    return { collapseOptional: !!set["reduced-visual-load"], pinned: pinned };
  }

  /* --------------------------------------------------------------------------
   * COPY BETWEEN LESSONS. Intent transfers; lesson-specific text never does.
   * The stored profile holds only intent, so this is a filter, not a rewrite —
   * but it is a named function so the invariant has somewhere to be tested.
   * ----------------------------------------------------------------------- */
  function copyProfileTo(profile, targetLessonId, targetEntry, ctx) {
    var applicable = {};
    applicableSupports(targetEntry, ctx).forEach(function (s) {
      applicable[s.key] = true;
    });
    var out = emptyProfile(targetLessonId);
    out.keys = normalizeProfile(profile).keys.filter(function (k) {
      return applicable[k];
    });
    return out;
  }

  /* --------------------------------------------------------------------------
   * STORE. Deltas only, one record per lesson id, versioned.
   *
   * Lives in localStorage because a lesson support selection is a teacher's
   * working state on the machine they teach from, and because the alternative —
   * a new table — would be a student-adjacent database this project explicitly
   * does not want. Both the supports surface and the in-lesson layer read
   * through THESE functions so their idea of "what is applied" cannot drift.
   *
   * Every function is total: a corrupt, absent or future-versioned store reads
   * as "no supports selected", which renders the canonical lesson.
   * ----------------------------------------------------------------------- */
  function storage() {
    try {
      return typeof localStorage !== "undefined" ? localStorage : null;
    } catch (_e) {
      return null; // private mode
    }
  }

  function readStore() {
    var ls = storage();
    if (!ls) return {};
    var raw;
    try {
      raw = ls.getItem(STORAGE_KEY);
    } catch (_e) {
      return {};
    }
    if (!raw) return {};
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_e) {
      return {};
    }
    if (!parsed || typeof parsed !== "object") return {};
    // A record written by a NEWER schema is ignored, not migrated and not
    // crashed on — this version cannot know what its keys mean.
    if (parsed.schemaVersion && parsed.schemaVersion > SCHEMA_VERSION) return {};
    var lessons = parsed.lessons && typeof parsed.lessons === "object" ? parsed.lessons : {};
    var out = {};
    Object.keys(lessons).forEach(function (id) {
      if (parseLessonId(id)) out[id] = normalizeProfile(lessons[id], id);
    });
    return out;
  }

  function writeStore(store) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(
        STORAGE_KEY,
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, lessons: store || {} }),
      );
      return true;
    } catch (_e) {
      return false; // quota / private mode — the lesson still renders
    }
  }

  /** Apply: persist the selection for one lesson. Touches no other lesson. */
  function saveProfile(lessonId, keys, presetKey) {
    if (!parseLessonId(lessonId)) return false;
    var store = readStore();
    var profile = normalizeProfile({ keys: keys, preset: presetKey }, lessonId);
    if (!profile.keys.length) {
      delete store[lessonId];
    } else {
      store[lessonId] = profile;
    }
    return writeStore(store);
  }

  /** Reset to original: drop THIS lesson's delta and nothing else. Canonical
   * rendering is what remains, because canonical rendering is what happens when
   * no delta exists. */
  function resetProfile(lessonId) {
    var store = readStore();
    if (!Object.prototype.hasOwnProperty.call(store, lessonId)) return writeStore(store);
    delete store[lessonId];
    return writeStore(store);
  }

  function loadProfile(lessonId) {
    return normalizeProfile(readStore()[lessonId], lessonId);
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    PROTECTED_FIELDS: PROTECTED_FIELDS,
    ELEMENTS: ELEMENTS,
    CATALOG: CATALOG,
    CATEGORIES: CATEGORIES,
    NOT_IMPLEMENTED: NOT_IMPLEMENTED,
    PRESETS: PRESETS,
    byKey: BY_KEY,
    parseLessonId: parseLessonId,
    parentLessonId: parentLessonId,
    isVariant: isVariant,
    applicableSupports: applicableSupports,
    emptyProfile: emptyProfile,
    normalizeProfile: normalizeProfile,
    intrinsicKeys: intrinsicKeys,
    resolveForLesson: resolveForLesson,
    resolveCapabilities: resolveCapabilities,
    supportsParam: supportsParam,
    preview: preview,
    previewFor: previewFor,
    resolveConflicts: resolveConflicts,
    copyProfileTo: copyProfileTo,
    readStore: readStore,
    writeStore: writeStore,
    saveProfile: saveProfile,
    resetProfile: resetProfile,
    loadProfile: loadProfile,
  };
});
