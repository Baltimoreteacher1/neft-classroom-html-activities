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
      requires: function (_entry, ctx) {
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
      requires: function (_entry, ctx) {
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
      // A MODIFICATION never rides inheritance into a small-group variant.
      // Those lessons are already the more scaffolded pathway; shortening their
      // practice set on top of that compounds a change in instructional demand
      // that nobody chose. A teacher who wants it there configures that variant
      // directly — at which point `overridden` is true and this does not apply.
      if (!overridden && parsed.variant && BY_KEY[k] && BY_KEY[k].impact === "modification") {
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

  /* ==========================================================================
   * MODALITY — what each support does on each SURFACE.
   *
   * Screen, paper and a downloaded document are different media, and a support
   * that is real on one can be meaningless on another. Read-aloud on paper is
   * not "read-aloud, broken" — it is a thing the teacher does, and the honest
   * output is a delivery note in the TEACHER copy, not a dead speaker icon on a
   * student worksheet.
   *
   * This table is the reason the cross-surface equivalence gate can exist at
   * all: a difference between screen and print is a FAILURE unless a rule here
   * declares it and says what happens instead. "Sentence frames on screen,
   * absent in print" has no rule and fails the build. Every value is one of:
   *
   *   "active"       — the support is delivered on this surface.
   *   "teacher-note" — it cannot be delivered by this medium; the teacher copy
   *                    carries a one-line delivery note and the STUDENT copy
   *                    carries nothing.
   *   "n/a"          — the surface has no such affordance to adapt, and saying
   *                    anything at all would be noise.
   * ======================================================================= */
  var MODALITY = {
    "visual-vocabulary": { screen: "active", print: "active", export: "active" },
    "bilingual-vocabulary": { screen: "active", print: "active", export: "active" },
    "word-bank": { screen: "active", print: "active", export: "active" },
    "sentence-frames": { screen: "active", print: "active", export: "active" },
    "chunk-directions": { screen: "active", print: "active", export: "active" },
    "step-checklist": { screen: "active", print: "active", export: "active" },
    "worked-example": { screen: "active", print: "active", export: "active" },
    "readiness-review": { screen: "active", print: "active", export: "active" },
    "visual-model": { screen: "active", print: "active", export: "active" },
    "number-line": { screen: "active", print: "active", export: "active" },
    "multiplication-chart": { screen: "active", print: "active", export: "active" },
    "place-value-chart": { screen: "active", print: "active", export: "active" },
    "shorter-practice-set": { screen: "active", print: "active", export: "active" },
    // Extension is a task a teacher hands out, not a block that belongs on
    // every student's packet. On paper it is a note in the teacher copy.
    extension: {
      screen: "active",
      print: "teacher-note",
      export: "teacher-note",
      note: "Have the extension task ready for students who finish the grade-level work.",
    },
    // A calculator is a device, not a printable. The teacher copy records that
    // one is permitted for this task; the student page grows no fake keypad.
    calculator: {
      screen: "active",
      print: "teacher-note",
      export: "teacher-note",
      note: "Allow a calculator for this task.",
    },

    // Paper cannot speak, listen, or reflow. Each of these carries a delivery
    // note into the TEACHER copy and nothing into the student copy.
    "read-aloud": {
      screen: "active",
      print: "teacher-note",
      export: "teacher-note",
      note: "Read the directions and the problem stems aloud before students begin.",
    },
    dictation: {
      screen: "active",
      print: "teacher-note",
      export: "teacher-note",
      note: "Accept a spoken explanation in place of a written one, and scribe or record it.",
    },
    "reduced-visual-load": {
      screen: "active",
      print: "teacher-note",
      export: "teacher-note",
      note: "Hand out one page at a time rather than the whole packet.",
    },
  };

  var SURFACES = ["screen", "print", "export"];

  function modalityFor(key, surface) {
    var m = MODALITY[key];
    if (!m) return "n/a";
    return m[surface] || "n/a";
  }

  /* ==========================================================================
   * THE RESOLVER. One function, called by every surface.
   *
   * Screen, print and export each used to be free to work out "what is on" for
   * themselves, which is exactly how a printed worksheet comes to disagree with
   * the lesson a teacher just taught from. They now all call this, differing
   * only in the `surface` they pass, and every difference in the result is
   * traceable to a MODALITY rule above.
   * ======================================================================= */
  function resolveEffectiveSupports(opts) {
    var o = opts || {};
    var surface = SURFACES.indexOf(o.surface) > -1 ? o.surface : "screen";
    var entry = o.entry || null;
    var resolved;
    try {
      resolved = resolveForLesson(o.lessonId, o.store || {}, entry);
    } catch (_e) {
      // Canonical-first: an unreadable configuration is no configuration.
      resolved = { keys: [], inherited: [], suppressed: [], overridden: false };
    }

    var active = [];
    var teacherNotes = [];
    var notApplicable = [];
    resolved.keys.forEach(function (k) {
      var mode = modalityFor(k, surface);
      if (mode === "active") active.push(k);
      else if (mode === "teacher-note") {
        teacherNotes.push({ key: k, label: (BY_KEY[k] || {}).label || k, note: MODALITY[k].note });
      } else notApplicable.push(k);
    });

    var modifications = active.concat(teacherNotes.map((t) => t.key)).filter(function (k) {
      return BY_KEY[k] && BY_KEY[k].impact === "modification";
    });

    return {
      surface: surface,
      lessonId: o.lessonId || null,
      /** Everything the teacher selected that survives to this lesson. */
      selected: resolved.keys.slice(),
      /** What this surface actually delivers. */
      active: active,
      /** Real supports this medium cannot deliver, with what to do instead. */
      teacherNotes: teacherNotes,
      /** Selected, but this surface has nothing to adapt. */
      notApplicable: notApplicable,
      /** Dropped because the lesson variant already authors them. */
      suppressed: resolved.suppressed.slice(),
      inherited: resolved.inherited.slice(),
      overridden: resolved.overridden,
      modifications: modifications,
      capabilities: resolveCapabilities(active),
      conflicts: resolveConflicts(active, o.ctx),
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

  function resolveConflicts(keys, ctx) {
    var set = {};
    (keys || []).forEach(function (k) {
      set[k] = true;
    });
    // Two sources of pinning, both outranking the collapse:
    //   1. the standing rule — an explicitly chosen language support was chosen
    //      to be there, and collapsing it defeats the choice;
    //   2. an AUTHORED pin for this lesson — a geometry figure whose labels ARE
    //      the given quantities. Hiding those does not simplify the task, it
    //      makes it unsolvable, which is a different thing entirely.
    var authored = (ctx && Array.isArray(ctx.pin) ? ctx.pin : []).filter(function (k) {
      return set[k];
    });
    var pinned = ALWAYS_ON_OVER_COLLAPSE.filter(function (k) {
      return set[k];
    });
    authored.forEach(function (k) {
      if (pinned.indexOf(k) === -1) pinned.push(k);
    });
    return { collapseOptional: !!set["reduced-visual-load"], pinned: pinned };
  }

  /* ==========================================================================
   * PAPER + EXPORT CONTENT.
   *
   * The blocks a support contributes to a printed or exported document, built
   * from THIS lesson's authored content. Returned as data — `{key, slot, title,
   * kind, items}` — so the print layer and the in-lesson export renderer share
   * the decision about WHAT a support adds and differ only in how they draw it.
   *
   * `slot` names a semantic lesson region, never a selector. A generator emits
   * `data-support-slot="vocabulary"` and the print layer attaches there; when
   * the page layout moves, the anchor moves with it.
   * ======================================================================= */
  var SLOT_ORDER = ["directions", "vocabulary", "workedExample", "practice", "response"];

  function supportBlocks(keys, entry) {
    var e = entry || {};
    var blocks = [];
    var has = {};
    (keys || []).forEach(function (k) {
      has[k] = true;
    });

    if (has["visual-vocabulary"] || has["bilingual-vocabulary"]) {
      var bilingual = !!has["bilingual-vocabulary"];
      var vocab = (e.vocabulary || [])
        .map(function (v) {
          if (bilingual && (v.termEs || v.definitionEs)) {
            return {
              term: v.term + (v.termEs ? " · " + v.termEs : ""),
              definition: v.definition + (v.definitionEs ? " · " + v.definitionEs : ""),
              visual: v.visual || "",
            };
          }
          return { term: v.term, definition: v.definition, visual: v.visual || "" };
        })
        .filter(function (v) {
          return v.term && v.definition;
        });
      if (vocab.length) {
        blocks.push({
          key: bilingual ? "bilingual-vocabulary" : "visual-vocabulary",
          slot: "vocabulary",
          title: bilingual ? "Words to know · Palabras clave" : "Words to know",
          kind: "definitions",
          items: vocab,
        });
      }
    }

    if (has["word-bank"] && (e.wordBank || []).length) {
      blocks.push({
        key: "word-bank",
        slot: "response",
        title: "Word bank",
        kind: "chips",
        items: e.wordBank.slice(0, 20),
      });
    }

    if (has["sentence-frames"] && (e.sentenceFrames || []).length) {
      blocks.push({
        key: "sentence-frames",
        slot: "response",
        title: "Sentence frames",
        kind: "lines",
        // Three is a scaffold; seventeen is a wall of text that buries the task.
        items: e.sentenceFrames.slice(0, 3),
      });
    }

    if (has["chunk-directions"]) {
      blocks.push({
        key: "chunk-directions",
        slot: "directions",
        title: "One step at a time",
        kind: "steps",
        // Deliberately generic and deliberately NOT the problem: chunking
        // re-presents the task's shape. It may not restate a value, because a
        // restated value is a value that can drift from the one being solved.
        items: [
          "Read the whole problem once.",
          "Underline what you are asked to find.",
          "Circle the numbers you were given, with their units.",
          "Solve one step at a time and show each step.",
          "Check that your answer answers the question.",
        ],
      });
    }

    if (has["step-checklist"]) {
      blocks.push({
        key: "step-checklist",
        slot: "practice",
        title: "My checklist",
        kind: "checkboxes",
        items: [
          "I read the directions.",
          "I showed my work.",
          "I labelled my answer with units.",
          "I explained how I know.",
        ],
      });
    }

    if (has["worked-example"] && e.workedExample) {
      blocks.push({
        key: "worked-example",
        slot: "workedExample",
        title: "Worked example",
        kind: "lines",
        items: String(e.workedExample).split("\n").filter(Boolean),
      });
    }

    if (has["readiness-review"] && e.readinessHref) {
      blocks.push({
        key: "readiness-review",
        slot: "practice",
        title: "Before you start",
        kind: "lines",
        items: ["Warm up with the readiness practice for this lesson: " + e.readinessHref],
      });
    }

    // The math tools are workspace on paper: a blank number line, a grid, a
    // chart. They are drawn by the print layer, which is why these carry a
    // `kind` and no items — the content IS the empty tool.
    if (has["number-line"]) {
      blocks.push({
        key: "number-line",
        slot: "practice",
        title: "Number line",
        kind: "number-line",
        items: [],
      });
    }
    if (has["multiplication-chart"]) {
      blocks.push({
        key: "multiplication-chart",
        slot: "practice",
        title: "Multiplication chart",
        kind: "mult-chart",
        items: [],
      });
    }
    if (has["place-value-chart"]) {
      blocks.push({
        key: "place-value-chart",
        slot: "practice",
        title: "Place-value chart",
        kind: "place-value",
        items: [],
      });
    }
    if (has["visual-model"]) {
      blocks.push({
        key: "visual-model",
        slot: "practice",
        title: "Model your thinking",
        kind: "model-space",
        items: ["Draw a model of the problem. Label every part with what it represents."],
      });
    }

    blocks.sort(function (a, b) {
      return SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot);
    });
    return blocks;
  }

  /* --------------------------------------------------------------------------
   * PROVENANCE — the teacher-facing "what was applied" summary.
   *
   * Says what the lesson DOES, never why a learner might need it. No disability
   * category, no plan status, no language-proficiency level: a printed packet
   * travels around a building, and a support list is instructional information
   * while a reason is a student's private business.
   * ----------------------------------------------------------------------- */
  function provenance(effective) {
    var eff = effective || { active: [], teacherNotes: [], modifications: [] };
    var label = function (k) {
      return (BY_KEY[k] || {}).label || k;
    };
    var mods = (eff.modifications || []).slice();
    var supports = (eff.active || []).filter(function (k) {
      return mods.indexOf(k) === -1;
    });
    return {
      supports: supports.map(label),
      modifications: mods.map(function (k) {
        return { label: label(k), consequence: MODIFICATION_CONSEQUENCE[k] || "" };
      }),
      delivery: (eff.teacherNotes || []).map(function (t) {
        return { label: t.label, note: t.note };
      }),
      isEmpty: !supports.length && !mods.length && !(eff.teacherNotes || []).length,
    };
  }

  /* One plain sentence per modification, stating the consequence in
   * instructional terms. Alarmist wording gets ignored; vague wording gets
   * misread; this is the middle. */
  var MODIFICATION_CONSEQUENCE = {
    "shorter-practice-set":
      "Reduces the number of required practice problems. The mathematical target " +
      "stays the same and stays visible; the student completes a shorter task.",
  };

  /* --------------------------------------------------------------------------
   * EXPLANATIONS — system behaviour, said in instructional language.
   *
   * A teacher asking "why is the calculator greyed out?" is owed an answer
   * about the lesson, not about the implementation. Nothing here may leak the
   * words intrinsic, suppression, manifest, MODE_KEYS or PROFILE_KEYS.
   * ----------------------------------------------------------------------- */
  function explainSuppressed(key, variantTitle) {
    var l = (BY_KEY[key] || {}).label || key;
    return (
      l +
      " is already built into " +
      (variantTitle || "this small-group lesson") +
      ", so it is not added a second time."
    );
  }

  function explainUnavailable(key, ctx) {
    var c = ctx || {};
    if (key === "calculator" && c.computationIsObjective) {
      return "Calculator is not offered here because doing the computation is what this lesson teaches.";
    }
    if (key === "multiplication-chart" && c.factRecallIsObjective) {
      return "The multiplication chart is not offered here because recalling these facts is what this lesson teaches.";
    }
    var s = BY_KEY[key];
    if (!s) return "";
    if (key === "worked-example") return "This lesson has no worked example to show again.";
    if (key === "readiness-review")
      return "This lesson has no readiness practice to send students to.";
    if (key === "bilingual-vocabulary")
      return "This lesson's vocabulary has no Spanish translation yet.";
    if (key === "word-bank") return "This lesson has no word bank authored yet.";
    if (key === "sentence-frames") return "This lesson has no sentence frames authored yet.";
    return s.label + " does not apply to this lesson.";
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

  /* --------------------------------------------------------------------------
   * CLASS SECTION.
   *
   * 601 / 602 / 603 are the teacher's class periods. They are CONTEXT, not
   * curriculum: all three classes are taught the same canonical lessons, and
   * nothing here forks a lesson per class. What can legitimately differ is the
   * teacher's SUPPORT SELECTION — 601 may need visual vocabulary and sentence
   * frames where 603 needs nothing.
   *
   * The list itself lives in assets/learning-supports/supports-schema.js
   * (`SECTIONS`), which is the canonical roster source; this reads it when that
   * schema is loaded and otherwise falls back to the same three values, pinned
   * against the schema file by tools/hub-lesson-picker.test.mjs.
   *
   * The SELECTED section lives in the existing teacher-workflow state
   * (`curriculumTeacherWorkflow:v1`.section), written by the Teacher Workflow
   * card's own class selector since long before this. Reading the same key is
   * what makes the hub picker, the lesson, the supports surface and the printed
   * packet agree about which class is being taught, without a new store.
   */
  var SECTION_FALLBACK = ["601", "602", "603"];
  var TEACHER_STATE_KEY = "curriculumTeacherWorkflow:v1";

  function sections() {
    try {
      var schema = typeof window !== "undefined" && window.EWLSupportsSchema;
      if (schema && Array.isArray(schema.sections) && schema.sections.length) {
        return schema.sections.slice();
      }
    } catch (_e) {
      /* fall through to the pinned list */
    }
    return SECTION_FALLBACK.slice();
  }

  function isSection(value) {
    return sections().indexOf(String(value)) !== -1;
  }

  /** The class currently being taught, or null. Never throws, never guesses. */
  function activeSection() {
    var ls = storage();
    if (!ls) return null;
    try {
      var raw = ls.getItem(TEACHER_STATE_KEY);
      if (!raw) return null;
      var state = JSON.parse(raw);
      var value = state && state.section;
      return isSection(value) ? String(value) : null;
    } catch (_e) {
      return null;
    }
  }

  function setActiveSection(value) {
    var ls = storage();
    if (!ls) return false;
    var next = isSection(value) ? String(value) : null;
    try {
      var state = {};
      try {
        state = JSON.parse(ls.getItem(TEACHER_STATE_KEY) || "{}") || {};
      } catch (_e) {
        state = {};
      }
      if (next) state.section = next;
      else delete state.section;
      ls.setItem(TEACHER_STATE_KEY, JSON.stringify(state));
      return true;
    } catch (_e) {
      return false;
    }
  }

  /* --------------------------------------------------------------------------
   * THE STORE.
   *
   *   { schemaVersion, lessons: {…}, sections: { "601": {…} } }
   *
   * `lessons` is the configuration that applies to EVERY class — the shape this
   * store has always had, and what a teacher sets when no class is selected.
   * `sections["601"]` overrides it for one class only.
   *
   * readStore(section) flattens those two into the same shape resolveForLesson
   * has always taken, which is why class scoping needed no change to the
   * resolver, the inheritance rules, the print layer or the equivalence gate.
   *
   * ISOLATION. 602 never sees 601's entries. It sees its own if it has them and
   * the all-class default otherwise — never another class's.
   * ----------------------------------------------------------------------- */
  function readRaw() {
    var ls = storage();
    if (!ls) return null;
    var raw;
    try {
      raw = ls.getItem(STORAGE_KEY);
    } catch (_e) {
      return null;
    }
    if (!raw) return null;
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_e) {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    // A record written by a NEWER schema is ignored, not migrated and not
    // crashed on — this version cannot know what its keys mean.
    if (parsed.schemaVersion && parsed.schemaVersion > SCHEMA_VERSION) return null;
    return parsed;
  }

  function normalizeMap(source) {
    var out = {};
    if (!source || typeof source !== "object") return out;
    Object.keys(source).forEach(function (id) {
      if (parseLessonId(id)) out[id] = normalizeProfile(source[id], id);
    });
    return out;
  }

  /** @param {string=} section  omit to read the all-class configuration. */
  function readStore(section) {
    var parsed = readRaw();
    if (!parsed) return {};
    var base = normalizeMap(parsed.lessons);
    var sec = section === undefined ? activeSection() : section;
    if (!sec || !isSection(sec)) return base;
    var perSection = normalizeMap((parsed.sections || {})[sec]);
    Object.keys(perSection).forEach(function (id) {
      base[id] = perSection[id];
    });
    return base;
  }

  function writeStore(store, section) {
    var ls = storage();
    if (!ls) return false;
    var parsed = readRaw() || {};
    var next = { schemaVersion: SCHEMA_VERSION, lessons: parsed.lessons || {} };
    if (parsed.sections && typeof parsed.sections === "object") next.sections = parsed.sections;
    if (section && isSection(section)) {
      next.sections = next.sections || {};
      next.sections[section] = store || {};
    } else {
      next.lessons = store || {};
    }
    try {
      ls.setItem(STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch (_e) {
      return false; // quota / private mode — the lesson still renders
    }
  }

  /** The configuration a class OWNS — not what it inherits from the all-class
   * default. This is what the supports surface edits, so that saving for 602
   * cannot silently rewrite 601. */
  function ownStore(section) {
    var parsed = readRaw();
    if (!parsed) return {};
    if (section && isSection(section)) return normalizeMap((parsed.sections || {})[section]);
    return normalizeMap(parsed.lessons);
  }

  /** Apply: persist the selection for one lesson, for one class (or for every
   * class when no section is given). Touches no other lesson and no other
   * class. */
  function saveProfile(lessonId, keys, presetKey, section) {
    if (!parseLessonId(lessonId)) return false;
    var sec = section === undefined ? activeSection() : section;
    var store = ownStore(sec);
    var profile = normalizeProfile({ keys: keys, preset: presetKey }, lessonId);
    if (!profile.keys.length) {
      delete store[lessonId];
    } else {
      store[lessonId] = profile;
    }
    return writeStore(store, sec);
  }

  /** Reset to original: drop THIS lesson's delta for THIS class and nothing
   * else. Canonical rendering is what remains, because canonical rendering is
   * what happens when no delta exists. */
  function resetProfile(lessonId, section) {
    var sec = section === undefined ? activeSection() : section;
    var store = ownStore(sec);
    if (!Object.prototype.hasOwnProperty.call(store, lessonId)) return writeStore(store, sec);
    delete store[lessonId];
    return writeStore(store, sec);
  }

  function loadProfile(lessonId, section) {
    return normalizeProfile(readStore(section)[lessonId], lessonId);
  }

  /** Copy one class's whole support setup onto another. Intent only — the
   * stored records are support keys, so no lesson content can travel. */
  function copySectionSetup(from, to) {
    if (!isSection(from) || !isSection(to) || from === to) return false;
    return writeStore(ownStore(from), to);
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
    MODALITY: MODALITY,
    SURFACES: SURFACES,
    MODIFICATION_CONSEQUENCE: MODIFICATION_CONSEQUENCE,
    modalityFor: modalityFor,
    resolveEffectiveSupports: resolveEffectiveSupports,
    supportBlocks: supportBlocks,
    provenance: provenance,
    explainSuppressed: explainSuppressed,
    explainUnavailable: explainUnavailable,
    SECTION_FALLBACK: SECTION_FALLBACK,
    TEACHER_STATE_KEY: TEACHER_STATE_KEY,
    sections: sections,
    isSection: isSection,
    activeSection: activeSection,
    setActiveSection: setActiveSection,
    ownStore: ownStore,
    copySectionSetup: copySectionSetup,
    readStore: readStore,
    writeStore: writeStore,
    saveProfile: saveProfile,
    resetProfile: resetProfile,
    loadProfile: loadProfile,
  };
});
