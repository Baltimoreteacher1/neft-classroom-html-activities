/*
 * EduWonderLab — Writing Scaffold Ladder (reusable component)
 * =============================================================================
 * Five rungs of writing support for one substantial written response:
 *
 *   4  Vocabulary bank          — the words, no structure
 *   3  Sentence starter         — the opening, student finishes it
 *   2  Complete sentence frame  — the sentence shape, student fills the maths
 *   1  Paragraph frame          — a multi-sentence structure to complete
 *   0  Independent response     — a blank box
 *
 * THE RULE THIS COMPONENT ENFORCES
 *   The mathematical learning target is IDENTICAL at every rung. Support
 *   changes what a student has to produce in English; it never changes what
 *   they have to understand mathematically. The prompt text is authored once
 *   and shown unchanged at all five levels — a page physically cannot give an
 *   easier question at a higher support level through this component.
 *
 * Rungs are numbered so that 0 is independent: a student "coming down the
 * ladder" is the outcome, and the number falling is the progress signal.
 *
 * PRIVACY / EVIDENCE
 *   The written response stays in the page. When the shared evidence layer is
 *   present, the component records the SUPPORT TIER used and (optionally) the
 *   explanation itself, so a teacher can see movement toward independence.
 *   Support use is never a penalty and never lowers a score.
 *
 * USAGE
 *   <link rel="stylesheet" href="/shared/support/scaffold-ladder.css">
 *   <div data-ewl-scaffold
 *        data-prompt="Explain why 4:6 and 6:9 are equivalent ratios."
 *        data-target="I can explain equivalent ratios using multiplication."
 *        data-lesson="lesson-3-2"
 *        data-standard="6.AT.3"
 *        data-vocab="ratio, equivalent, multiply, factor"
 *        data-starter="These ratios are equivalent because…"
 *        data-frame="4:6 and 6:9 are equivalent because I multiplied ___ by ___ to get ___."
 *        data-paragraph="First, I looked at ___. Then I multiplied ___ by ___. This shows the ratios are equivalent because ___."
 *   ></div>
 *   <script src="/shared/support/scaffold-ladder.js" defer></script>
 *
 * Only `data-prompt` is required. Any rung whose text is not supplied falls
 * back to a sensible generic scaffold, so an author can adopt the component
 * with one attribute and enrich it later.
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLScaffoldLadder) return;

  var RUNGS = [
    {
      level: 4,
      id: "vocabulary",
      label: "Vocabulary bank",
      hint: "The words you need. You build the sentences.",
    },
    {
      level: 3,
      id: "starter",
      label: "Sentence starter",
      hint: "The opening is given. You finish the thought.",
    },
    {
      level: 2,
      id: "frame",
      label: "Complete sentence frame",
      hint: "The sentence shape is given. You supply the mathematics.",
    },
    {
      level: 1,
      id: "paragraph",
      label: "Paragraph frame",
      hint: "A structure for several sentences.",
    },
    {
      level: 0,
      id: "independent",
      label: "Independent response",
      hint: "Your own words, your own structure.",
    },
  ];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function attr(node, name, fallback) {
    var value = node.getAttribute(name);
    return value == null || value === "" ? fallback : value;
  }

  /** Scaffold text for one rung, from authored attributes or a generic default. */
  function scaffoldText(node, rung) {
    switch (rung.id) {
      case "vocabulary":
        return attr(node, "data-vocab", "");
      case "starter":
        return attr(node, "data-starter", "I know this because…");
      case "frame":
        return attr(node, "data-frame", "___ and ___ are related because ___.");
      case "paragraph":
        return attr(
          node,
          "data-paragraph",
          "First, I noticed ___. Then I ___. This shows ___ because ___.",
        );
      default:
        return "";
    }
  }

  var counter = 0;

  function build(node) {
    if (node.getAttribute("data-ewl-scaffold-ready") === "1") return;
    node.setAttribute("data-ewl-scaffold-ready", "1");

    var uid = "ewl-scaffold-" + ++counter;
    var prompt = attr(node, "data-prompt", "Explain your thinking.");
    var target = attr(node, "data-target", "");
    var lessonId = attr(node, "data-lesson", "");
    var standard = attr(node, "data-standard", "");
    var storageKey = "ewl:scaffold:" + (lessonId || uid);

    node.classList.add("ewl-scaffold");
    node.textContent = "";

    /* --- The question. Stated once, above the support picker, so it is
     * visibly the same question at every level. ------------------------- */
    var head = el("div", "ewl-scaffold-head");
    head.appendChild(el("p", "ewl-scaffold-eyebrow", "Same question at every support level"));
    var promptEl = el("p", "ewl-scaffold-prompt", prompt);
    promptEl.id = uid + "-prompt";
    head.appendChild(promptEl);
    if (target) {
      head.appendChild(el("p", "ewl-scaffold-target", "Learning target: " + target));
    }
    node.appendChild(head);

    /* --- Support picker ------------------------------------------------- */
    var picker = el("div", "ewl-scaffold-picker");
    picker.setAttribute("role", "radiogroup");
    picker.setAttribute("aria-label", "How much writing support do you want?");
    picker.appendChild(el("p", "ewl-scaffold-picker-label", "How much writing support do you want?"));

    var buttons = [];
    var scaffoldBox = el("div", "ewl-scaffold-support");
    scaffoldBox.id = uid + "-support";

    var textarea = document.createElement("textarea");
    textarea.className = "ewl-scaffold-input";
    textarea.id = uid + "-response";
    textarea.rows = 5;
    textarea.setAttribute("aria-labelledby", uid + "-prompt");
    textarea.placeholder = "Write your explanation here.";

    var currentLevel = null;

    function selectRung(rung, options) {
      currentLevel = rung.level;
      buttons.forEach(function (btn) {
        var on = Number(btn.getAttribute("data-level")) === rung.level;
        btn.setAttribute("aria-checked", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
      });

      scaffoldBox.textContent = "";
      var text = scaffoldText(node, rung);
      scaffoldBox.appendChild(el("p", "ewl-scaffold-hint", rung.hint));
      if (rung.id === "vocabulary" && text) {
        var list = el("ul", "ewl-scaffold-words");
        text.split(",").forEach(function (word) {
          var w = word.trim();
          if (w) list.appendChild(el("li", null, w));
        });
        scaffoldBox.appendChild(list);
      } else if (text) {
        scaffoldBox.appendChild(el("p", "ewl-scaffold-frame", text));
        // Seed the box with the frame the first time a rung is picked, but
        // never overwrite work the student has already typed.
        if (!textarea.value.trim() && !(options && options.silent)) {
          textarea.value = text;
        }
      } else {
        scaffoldBox.appendChild(
          el("p", "ewl-scaffold-frame", "Write your full explanation in your own words."),
        );
      }

      persist();
      if (!(options && options.silent)) recordSupportUse(rung);
    }

    RUNGS.forEach(function (rung) {
      var btn = el("button", "ewl-scaffold-rung");
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.setAttribute("data-level", String(rung.level));
      btn.appendChild(el("span", "ewl-scaffold-rung-label", rung.label));
      btn.addEventListener("click", function () {
        selectRung(rung);
        textarea.focus();
      });
      buttons.push(btn);
      picker.appendChild(btn);
    });

    // Roving-tabindex keyboard support, the expected pattern for a radiogroup.
    picker.addEventListener("keydown", function (event) {
      var keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
      if (keys.indexOf(event.key) === -1) return;
      event.preventDefault();
      var index = buttons.findIndex(function (b) {
        return b.getAttribute("aria-checked") === "true";
      });
      if (index === -1) index = 0;
      var delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      var next = (index + delta + buttons.length) % buttons.length;
      selectRung(RUNGS[next]);
      buttons[next].focus();
    });

    node.appendChild(picker);
    node.appendChild(scaffoldBox);

    var responseLabel = el("label", "ewl-scaffold-response-label", "Your explanation");
    responseLabel.htmlFor = textarea.id;
    node.appendChild(responseLabel);
    node.appendChild(textarea);

    var footer = el("div", "ewl-scaffold-footer");
    var saveNote = el("p", "ewl-scaffold-note", "Saved on this device as you type.");
    footer.appendChild(saveNote);

    var independence = el("p", "ewl-scaffold-note");
    footer.appendChild(independence);
    node.appendChild(footer);

    /* --- persistence: local only ---------------------------------------- */

    function persist() {
      try {
        global.localStorage.setItem(
          storageKey,
          JSON.stringify({ v: 1, level: currentLevel, response: textarea.value }),
        );
      } catch (_e) {
        saveNote.textContent = "Saving is unavailable in this browser — copy your work before leaving.";
      }
    }

    function restore() {
      try {
        var raw = global.localStorage.getItem(storageKey);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (_e) {
        return null;
      }
    }

    /* --- evidence: tier used, never a penalty ---------------------------- */

    function recordSupportUse(rung) {
      if (!global.EWLEvidence) return;
      var payload = {
        eventType: "support_used",
        productId: "language-bridge",
        activityId: "scaffold-ladder",
        lessonId: lessonId || null,
        standardIds: standard ? [standard] : [],
        supportLevel: "tier-" + rung.level,
      };
      if (global.EWLSupportProfile) {
        var snapshot = global.EWLSupportProfile.evidenceSnapshot();
        payload.languageSetting = snapshot.languageSetting;
        payload.readAloudUsed = snapshot.readAloudUsed;
        payload.vocabularySupportUsed = snapshot.vocabularySupportUsed;
      }
      global.EWLEvidence.record(payload);

      var lowest = lowestTierUsed();
      if (lowest != null && rung.level < lowest) {
        independence.textContent =
          "You are using less writing support than last time. That is exactly the direction to go.";
      }
    }

    function lowestTierUsed() {
      if (!global.EWLEvidence) return null;
      var events = global.EWLEvidence.all({ activityId: "scaffold-ladder" });
      var levels = events
        .map(function (e) {
          var match = /^tier-(\d)$/.exec(e.supportLevel || "");
          return match ? Number(match[1]) : null;
        })
        .filter(function (n) {
          return n != null;
        });
      return levels.length ? Math.min.apply(null, levels) : null;
    }

    textarea.addEventListener("input", persist);
    textarea.addEventListener("blur", function () {
      if (!textarea.value.trim() || !global.EWLEvidence) return;
      global.EWLEvidence.record({
        eventType: "explanation_written",
        productId: "language-bridge",
        activityId: "scaffold-ladder",
        lessonId: lessonId || null,
        standardIds: standard ? [standard] : [],
        supportLevel: currentLevel != null ? "tier-" + currentLevel : null,
        writtenExplanation: textarea.value,
      });
    });

    /* --- initial state --------------------------------------------------- */

    var saved = restore();
    if (saved && saved.response) textarea.value = saved.response;
    var startLevel = saved && saved.level != null ? saved.level : defaultLevel();
    var startRung =
      RUNGS.filter(function (r) {
        return r.level === startLevel;
      })[0] || RUNGS[RUNGS.length - 1];
    // `silent` so restoring a session does not record a support-use event or
    // overwrite the student's saved text with a frame.
    selectRung(startRung, { silent: true });
  }

  /** Opening rung from the learner's saved support profile, when there is one. */
  function defaultLevel() {
    if (global.EWLSupportProfile) {
      var profile = global.EWLSupportProfile.get();
      if (profile && typeof profile.sentenceSupportTier === "number") {
        return profile.sentenceSupportTier;
      }
    }
    return 0;
  }

  function init(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-ewl-scaffold]");
    nodes.forEach(build);
    return nodes.length;
  }

  global.EWLScaffoldLadder = { RUNGS: RUNGS, init: init, build: build };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
    });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
