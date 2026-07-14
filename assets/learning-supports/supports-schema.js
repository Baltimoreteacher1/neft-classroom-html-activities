/*
 * Learning Supports v2 — shared taxonomy (single source of truth).
 *
 * Loaded as a plain <script> in BOTH the in-lesson supports layer
 * (learning-supports.js) and the Teacher Tools console
 * (/teacher-tools/learning-supports-manager/). Exposes window.EWLSupportsSchema.
 *
 * Item `apply` semantics (consumed by learning-supports.js on the STUDENT side):
 *   - "passive"     : applied automatically on lesson load, no student action.
 *   - "interactive" : appears as a button in the student "My Tools" side dock.
 *                     `tool` names the existing dock data-tool it maps to.
 *   - "adaptive"    : changes how the lesson behaves automatically (extended
 *                     time, chunking, adjusted workload, praise, reminders).
 *                     Implemented by supports-adaptations.js, keyed by `key`.
 *   - "flag"        : teacher planning note only; never rendered to students.
 *
 * The canonical D1 store keys assignments by (section, initials). WIDA level
 * pre-checks a bundle of these same item keys; IEP items are checked on top.
 */
(function () {
  "use strict";
  if (window.EWLSupportsSchema) return;

  // The two official district accommodation menus (verbatim from the IEP/ESOL
  // modifications document). Each line is one checkbox. Where a line maps to a
  // real student tool it is `interactive` (+ `tool` = the dock control it turns
  // on for the student). Everything else is a `flag`: a teacher planning note
  // that persists on the roster but is never surfaced to the student. Keys are
  // stable slugs — the five WIDA-bundled keys (translate/vocab/frames/tts/
  // notepad) live under ESOL so a WIDA level pre-checks them in place.
  var GROUPS = [
    {
      id: "iep",
      label: "IEP Modifications/Accommodations",
      icon: "📋",
      items: [
        { key: "iep-redirect", label: "Redirect student", apply: "flag" },
        { key: "iep-graphic-organizer", label: "Graphic organizer", apply: "interactive", tool: "organizer" },
        { key: "iep-small-group", label: "Small group", apply: "flag" },
        { key: "break", label: "Frequent breaks", apply: "interactive", tool: "break" },
        {
          key: "iep-reduce-distract-self",
          label: "Reduce distractions to self",
          apply: "flag",
        },
        {
          key: "iep-reduce-distract-others",
          label: "Reduce distractions to others",
          apply: "flag",
        },
        {
          key: "iep-tts",
          label:
            "Text to Speech for the ELA/Literacy Assessments (items, response options, and passages)",
          apply: "interactive",
          tool: "listen",
        },
        {
          key: "calculator",
          label:
            "Calculation device and mathematics tools (on Calculation Sections of the Mathematics Assessments)",
          apply: "interactive",
          tool: "calculator",
        },
        {
          key: "iep-calc-noncalc",
          label:
            "Calculation device and mathematics tools (on NON-Calculation Sections of the Mathematics Assessments)",
          apply: "interactive",
          tool: "calculator",
        },
        { key: "iep-monitor-test", label: "Monitor test response", apply: "flag" },
        { key: "time", label: "Extended time", apply: "adaptive" },
        {
          key: "iep-word-bank",
          label:
            "Use of word bank to reinforce vocabulary and/or when extended writing is required",
          apply: "interactive",
          tool: "words",
        },
        {
          key: "iep-sentence-starters",
          label: "Sentence starters",
          apply: "interactive",
          tool: "explain",
        },
        { key: "iep-chunk-text", label: "Chunking of information and text", apply: "adaptive" },
        { key: "iep-repeat-directions", label: "Repetition of directions", apply: "interactive", tool: "directions" },
        { key: "iep-check-understanding", label: "Check for understanding", apply: "interactive", tool: "checkin" },
        {
          key: "iep-chunk-repeat-verbal",
          label: "Chunk and repeat all verbally presented information",
          apply: "adaptive",
        },
        {
          key: "iep-verbal-visual-choices",
          label: "Use of verbal and visual choices to answer question",
          apply: "flag",
        },
        {
          key: "iep-alt-demonstrate",
          label: "Provide alternative ways to demonstrate learning",
          apply: "flag",
        },
        { key: "iep-monitor-independent", label: "Monitor independent work", apply: "flag" },
        {
          key: "iep-pictures-support",
          label: "Use pictures to support reading passages / comprehension",
          apply: "interactive", tool: "model",
        },
        {
          key: "iep-paraphrase",
          label: "Paraphrase questions and instructions",
          apply: "interactive", tool: "directions",
        },
        {
          key: "iep-visual-aids",
          label: "Use of visual aids",
          apply: "interactive",
          tool: "model",
        },
        { key: "iep-preferential-seating", label: "Preferential seating", apply: "flag" },
        {
          key: "iep-preteach-vocab",
          label: "Pre-teach vocabulary",
          apply: "interactive",
          tool: "words",
        },
        { key: "iep-highlighter", label: "Use of highlighter", apply: "interactive", tool: "highlighter" },
        {
          key: "iep-manipulatives",
          label: "Use of manipulatives",
          apply: "interactive",
          tool: "model",
        },
        { key: "iep-ask-assistance", label: "Ask assistance when needed", apply: "flag" },
        { key: "iep-cues", label: "Verbal and non-verbal cues", apply: "flag" },
        { key: "fewer", label: "Adjusted workload", apply: "adaptive" },
        { key: "iep-reminder-rules", label: "Frequent reminder of rules", apply: "flag" },
        { key: "iep-positive-praise", label: "Frequent positive praise", apply: "adaptive" },
        {
          key: "iep-movement",
          label: "Opportunities for movement / changes in activity",
          apply: "interactive", tool: "break",
        },
        {
          key: "iep-multisensory",
          label: "Multisensory presentation of information",
          apply: "flag",
        },
        {
          key: "iep-extra-time",
          label: "Extra response / processing time",
          apply: "adaptive",
        },
        {
          key: "iep-immediate-feedback",
          label: "Frequent and/or immediate feedback",
          apply: "adaptive",
        },
        {
          key: "checklist",
          label: "Use of organizational aids",
          apply: "interactive",
          tool: "checklist",
        },
        {
          key: "iep-writing-frame",
          label: "Writing frame",
          apply: "interactive",
          tool: "notepad",
        },
      ],
    },
    {
      id: "esol",
      label: "ESOL Modifications",
      icon: "🌐",
      items: [
        {
          key: "esol-extended-time",
          label: "Extended time (assignments, assessments)",
          apply: "adaptive",
        },
        {
          key: "translate",
          label: "Use of published word-to-word bilingual dictionary",
          apply: "interactive",
          tool: "translate",
        },
        {
          key: "esol-repeated-readings",
          label: "Repeated readings of passage / text by student",
          apply: "flag",
        },
        { key: "esol-leveled-text", label: "Leveled text", apply: "flag" },
        {
          key: "esol-selected-portion",
          label: "Selected portion of grade-level test or task",
          apply: "adaptive",
        },
        {
          key: "esol-read-aloud-selected",
          label: "Read aloud selected parts of the passage / text",
          apply: "interactive", tool: "listen",
        },
        {
          key: "tts",
          label: "Read aloud entire passage / text",
          apply: "interactive",
          tool: "listen",
        },
        { key: "esol-graphic-organizers", label: "Graphic organizers", apply: "interactive", tool: "organizer" },
        {
          key: "model",
          label: "Visual cues / aides and realia",
          apply: "interactive",
          tool: "model",
        },
        {
          key: "esol-frequent-checks",
          label: "Frequent checks for understanding",
          apply: "interactive", tool: "checkin",
        },
        { key: "esol-reduced-noise", label: "Reduced background noise", apply: "flag" },
        {
          key: "vocab",
          label: "Pre-teach new vocabulary",
          apply: "interactive",
          tool: "words",
        },
        { key: "esol-word-bank", label: "Word bank", apply: "interactive", tool: "words" },
        {
          key: "frames",
          label: "Sentence frames (orally and/or written)",
          apply: "interactive",
          tool: "explain",
        },
        {
          key: "esol-allow-home-language",
          label: "Allow home language for assignments / projects / discussion",
          apply: "flag",
        },
        { key: "esol-preferential-seating", label: "Preferential seating", apply: "flag" },
        {
          key: "esol-simplify-language",
          label: "Adapt / simplify teacher's language",
          apply: "interactive", tool: "directions",
        },
        { key: "esol-model-directions", label: "Model directions", apply: "interactive", tool: "directions" },
        {
          key: "esol-reword-directions",
          label: "Repeat / reword multiple-step directions",
          apply: "interactive", tool: "directions",
        },
        {
          key: "notepad",
          label: "Scribe at student's request",
          apply: "interactive",
          tool: "notepad",
        },
      ],
    },
  ];

  // WIDA levels 1–6. `items` pre-checks a bundle mapped onto the same item keys
  // above. Level 0 = "no WIDA support". Level 6 (Reaching) = monitor only.
  var WIDA_LEVELS = [
    { level: 1, name: "Entering", items: ["translate", "vocab", "frames", "tts"] },
    { level: 2, name: "Emerging", items: ["frames", "vocab", "tts"] },
    { level: 3, name: "Developing", items: ["frames", "vocab", "notepad"] },
    { level: 4, name: "Expanding", items: ["vocab", "frames"] },
    { level: 5, name: "Bridging", items: ["vocab"] },
    { level: 6, name: "Reaching", items: [] },
  ];

  var SECTIONS = ["601", "602", "603"];

  // Flat lookup helpers -----------------------------------------------------
  var ALL_ITEMS = [];
  var BY_KEY = {};
  GROUPS.forEach(function (g) {
    g.items.forEach(function (it) {
      ALL_ITEMS.push(it);
      BY_KEY[it.key] = it;
    });
  });

  function widaItems(level) {
    var lv = WIDA_LEVELS.filter(function (w) {
      return w.level === Number(level);
    })[0];
    return lv ? lv.items.slice() : [];
  }

  // Resolve a student's full item set: WIDA bundle ∪ explicit IEP items.
  function resolveItems(widaLevel, iepItems) {
    var set = {};
    widaItems(widaLevel).forEach(function (k) {
      set[k] = true;
    });
    (iepItems || []).forEach(function (k) {
      if (BY_KEY[k]) set[k] = true;
    });
    return Object.keys(set);
  }

  function isValidKey(k) {
    return Object.prototype.hasOwnProperty.call(BY_KEY, k);
  }

  window.EWLSupportsSchema = {
    version: 2,
    sections: SECTIONS,
    groups: GROUPS,
    widaLevels: WIDA_LEVELS,
    allItems: ALL_ITEMS,
    byKey: BY_KEY,
    widaItems: widaItems,
    resolveItems: resolveItems,
    isValidKey: isValidKey,
  };
})();
