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
 *   - "flag"        : teacher planning note only; never rendered to students.
 *
 * The canonical D1 store keys assignments by (section, initials). WIDA level
 * pre-checks a bundle of these same item keys; IEP items are checked on top.
 */
(function () {
  "use strict";
  if (window.EWLSupportsSchema) return;

  var GROUPS = [
    {
      id: "presentation",
      label: "Presentation",
      icon: "🖥️",
      items: [
        { key: "tts", label: "Read aloud", apply: "interactive", tool: "listen" },
        { key: "text-large", label: "Larger text", apply: "passive" },
        { key: "contrast", label: "High contrast", apply: "passive" },
        { key: "tint", label: "Calm color tint", apply: "passive" },
        { key: "ruler", label: "Reading ruler", apply: "interactive", tool: "ruler" },
        { key: "focus", label: "One-problem focus", apply: "interactive", tool: "focus" },
        { key: "comfort", label: "Comfort spacing", apply: "passive" },
      ],
    },
    {
      id: "understanding",
      label: "Understanding",
      icon: "💡",
      items: [
        { key: "vocab", label: "Vocabulary / words", apply: "interactive", tool: "words" },
        { key: "example", label: "Worked example", apply: "interactive", tool: "example" },
        { key: "model", label: "Visual model", apply: "interactive", tool: "model" },
        {
          key: "misconceptions",
          label: "Watch-out tips",
          apply: "interactive",
          tool: "misconceptions",
        },
      ],
    },
    {
      id: "response",
      label: "Response",
      icon: "✍️",
      items: [
        { key: "frames", label: "Sentence frames", apply: "interactive", tool: "explain" },
        { key: "notepad", label: "Notepad", apply: "interactive", tool: "notepad" },
        { key: "calculator", label: "Calculator", apply: "interactive", tool: "calculator" },
        { key: "numberline", label: "Number line", apply: "interactive", tool: "numberline" },
        { key: "multchart", label: "Times table", apply: "interactive", tool: "multchart" },
        { key: "placevalue", label: "Place-value chart", apply: "interactive", tool: "placevalue" },
      ],
    },
    {
      id: "language",
      label: "Language (ESOL / WIDA)",
      icon: "🌐",
      items: [
        {
          key: "translate",
          label: "Home-language translation",
          apply: "interactive",
          tool: "translate",
        },
      ],
    },
    {
      id: "pacing",
      label: "Pacing (teacher note)",
      icon: "⏱️",
      items: [
        { key: "fewer", label: "Fewer problems", apply: "flag" },
        { key: "time", label: "Extended time / breaks", apply: "flag" },
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
