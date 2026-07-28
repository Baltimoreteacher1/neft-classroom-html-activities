/*
 * EduWonderLab — Judge Mode
 * =============================================================================
 * A deterministic, three-to-five minute guided walkthrough of one product,
 * driven entirely by synthetic data.
 *
 * GUARANTEES (each one is asserted by tests/judge-mode.spec.ts)
 *   - No real roster, no real student information, no login.
 *   - No randomness and no network calls, so a step cannot fail mid-demo.
 *   - Resets predictably: reset() returns the walkthrough to step 1 with the
 *     same numbers it started with.
 *   - Reads and writes NOTHING in the learner's real storage. It calls
 *     EWLEvidence.useSynthetic() on entry and clearSynthetic() on exit, so the
 *     evidence API is backed by an in-memory dataset for the whole session.
 *   - Always visible: a persistent banner states that the data is simulated.
 *   - Production behaviour outside judge mode is untouched — this module only
 *     runs on a /judge-mode/ page and never auto-initialises anywhere else.
 *
 * USAGE (see /judge-mode/<slug>/index.html)
 *   <div class="ewl-portfolio" data-ewl-judge-mode="number-realm"></div>
 *   <script src="/shared/evidence/learning-evidence.js"></script>
 *   <script src="/shared/portfolio/synthetic-data.js"></script>
 *   <script src="/shared/portfolio/judge-mode.js" defer></script>
 * =============================================================================
 */
(function (global) {
  "use strict";
  if (global.EWLJudgeMode) return;

  var REGISTRY_URL = "/data/product-registry.json";

  /* ------------------------------------------------------------ walkthroughs
   * Each step names what a judge should look at and, where relevant, which
   * synthetic evidence event backs it. Steps are pure data so the runner is
   * identical for every product. */
  var WALKTHROUGHS = {
    "number-realm": {
      minutes: "4–5 minutes",
      steps: [
        {
          title: "Student onboarding",
          body: "A student opens a realm and names a hero. No account, no email, no roster — the only thing typed is a display name that never leaves the device.",
          look: "Notice there is no login wall between a child and the mathematics.",
          route: "/math-rpg/",
        },
        {
          title: "Realm selection",
          body: "Ten realms, one per curriculum unit. The realm a student picks is the unit their class is teaching, so the game paces with instruction instead of competing with it.",
          look: "Each realm shows its unit and the standards it covers.",
          route: "/math-rpg/unit-3/",
        },
        {
          title: "One representative challenge",
          body: "A ratio-table problem inside a battle. The mathematics is the grade-level standard 6.AT.3 — the game frame changes the stakes, not the rigour.",
          evidence: "demo:nr:item-1",
          look: "The first attempt is wrong. Nothing punishing happens.",
        },
        {
          title: "A Socratic hint",
          body: "The Sage is asked for help. It gives a method — 'what did you multiply the first quantity by?' — and never the answer.",
          evidence: "demo:nr:hint-1",
          look: "Hint use is recorded as information, not as a penalty.",
        },
        {
          title: "Corrective feedback",
          body: "The second attempt is correct after a revision. The misconception recorded on the first attempt (additive reasoning on a ratio table) is what the teacher tools later act on.",
          evidence: "demo:nr:item-2",
          look: "The system captured WHY it was wrong, not just that it was.",
        },
        {
          title: "Achievement and mastery",
          body: "Per-standard mastery moves to Developing (5 of 7 correct) and an achievement is granted.",
          evidence: "demo:nr:mastery",
          look: "Mastery is per standard, so it maps onto the curriculum registry directly.",
        },
        {
          title: "Evidence reaches My Math Progress",
          body: "The same events are what the student's progress view reads. Nothing is re-entered by hand.",
          look: "One evidence record serves the game, the student view, and the teacher view.",
          route: "/math/my-progress/",
        },
        {
          title: "Teacher-facing evidence",
          body: "A teacher sees the standard, the misconception, the hint count, and the attempt count — enough to plan a reteach without opening the game.",
          look: "No student name is required for any of this.",
        },
      ],
    },
    "language-bridge": {
      minutes: "3–4 minutes",
      steps: [
        {
          title: "Choose supports without explaining why",
          body: "A student turns on read-aloud, vocabulary preview, and a sentence frame. No diagnosis, no label, no justification is requested or stored.",
          look: "A support is a setting, not a disclosure.",
          route: "/language-bridge/",
        },
        {
          title: "Supports follow the learner",
          body: "The same choices apply in the lesson, in Number Realm, in a project, and in the progress view, because they live in one persistent support profile.",
          evidence: "demo:lb:support",
          look: "The profile is set once, not re-selected per activity.",
        },
        {
          title: "The scaffold ladder",
          body: "The same ratio question is offered at five rungs: vocabulary bank, sentence starter, complete frame, paragraph frame, independent. The mathematical target is identical at every rung.",
          look: "Compare the rungs — the mathematics does not get easier.",
          route: "/language-bridge/#scaffold-ladder",
        },
        {
          title: "A written explanation at tier 2",
          body: "With a sentence frame, the student explains equivalent ratios in their own words.",
          evidence: "demo:lb:explanation-1",
          look: "The reasoning is grade-level even though the writing is supported.",
        },
        {
          title: "Movement toward independence",
          body: "Nine days later the same student writes a longer explanation at tier 1, using a unit rate instead of a table.",
          evidence: "demo:lb:explanation-2",
          look: "Reduced support is the outcome the system is designed to produce.",
        },
        {
          title: "The family sees the same thing",
          body: "Family Connections explains the unit in the home language and links the same vocabulary — one family surface, not a second portal.",
          look: "No family login is introduced anywhere in this flow.",
          route: "/curriculum/family-connections/",
        },
      ],
    },
    "design-studio": {
      minutes: "4–5 minutes",
      steps: [
        {
          title: "Choose a challenge",
          body: "A design brief with real constraints: a floor plan under a fixed area budget.",
          look: "The constraint is numeric, so the design decision is a mathematical one.",
          route: "/design-studio/",
        },
        {
          title: "Plan and calculate",
          body: "The student plans dimensions and computes composite area. Different dimension choices produce genuinely different calculations.",
          evidence: "demo:ds:checkpoint-1",
          look: "Two students with different plans cannot copy each other's arithmetic.",
        },
        {
          title: "Test against the constraint — and fail",
          body: "The first plan is three square metres over budget.",
          look: "Failing the constraint check is a normal, expected step.",
        },
        {
          title: "Revise with a stated reason",
          body: "The storage wall is shortened from 4 m to 2.5 m and the area is recomputed. The revision note explains the change.",
          evidence: "demo:ds:checkpoint-2",
          look: "The revision, not just the final answer, is captured.",
        },
        {
          title: "Defend the solution",
          body: "The student submits with a mathematical defence and a rubric score.",
          evidence: "demo:ds:submitted",
          look: "The defence is part of the artifact, not a separate assignment.",
        },
        {
          title: "Save to the existing portfolio",
          body: "The entry lands in My Portfolio with unit, standards, revision count, and date attached — the same portfolio the curriculum already used.",
          evidence: "demo:ds:portfolio",
          look: "No second portfolio database was created for this.",
          route: "/math/projects/portfolio/",
        },
        {
          title: "Presentation mode",
          body: "Editing controls are hidden and the entry shows problem, process, revisions, mathematics, product, and reflection.",
          look: "This is what a student presents from — and what a judge can read.",
        },
      ],
    },
    "personalized-math-path": {
      minutes: "3–4 minutes",
      steps: [
        {
          title: "A confidence check",
          body: "Before the work, the student rates equivalent ratios as shaky — a 2 out of 5.",
          evidence: "demo:pmp:confidence",
          look: "Confidence is captured separately from correctness.",
          route: "/math/my-path/",
        },
        {
          title: "The student does the work — and does it well",
          body: "Four of five correct on the exit ticket, no hints used. Confidence afterwards is still 2.",
          evidence: "demo:pmp:scored",
          look: "A score alone would call this student fine. The confidence signal disagrees.",
        },
        {
          title: "The instructional need is named",
          body: "The rules identify 'low confidence despite correct work' — a distinct need from a prerequisite gap or a calculation error.",
          look: "Nine different needs are distinguished, not one 'struggling' flag.",
        },
        {
          title: "The recommendation states its reason",
          body: "The student reads: selected because you marked equivalent ratios as shaky even though you got four of five right. The teacher reads the same logic with the underlying counts.",
          evidence: "demo:pmp:recommendation",
          look: "Nothing here is opaque. Every input is visible.",
        },
        {
          title: "The loop closes",
          body: "A week later, follow-up evidence on the same standard: five of five, confidence up to 4. The intervention is recorded as improved.",
          evidence: "demo:pmp:followup",
          look: "The system checks whether its own advice worked.",
          route: "/math/my-progress/",
        },
      ],
    },
    "grade6-curriculum-system": {
      minutes: "3–4 minutes",
      steps: [
        {
          title: "The hub opens on a decision",
          body: "Teach Today, Plan the Week, Explore by Unit, Teacher Tools, Classroom Experiences, Full Unit Directory — organized by what a teacher is deciding, not by file type.",
          look: "A teacher with eleven minutes before class starts at the top and is done.",
          route: "/curriculum/",
        },
        {
          title: "Signature Experiences",
          body: "Five connected experiences, each stating its audience, purpose, unit connection, and whether work can be resumed.",
          look: "These are views of one platform, not six separate applications.",
          route: "/curriculum/#signature-experiences",
        },
        {
          title: "One lesson, fully equipped",
          body: "A lesson carries its standard, learning target, language objective, vocabulary, guided notes, slides, homework, printables, family page, and teacher notes.",
          look: "Nothing here is a stub or a placeholder.",
          route: "/lessons/3-1/",
        },
        {
          title: "One registry behind all of it",
          body: "Unit titles, standards, learning targets, and language objectives come from a single generated registry, so no two pages can disagree.",
          look: "Validation fails the build if a page invents its own unit metadata.",
        },
        {
          title: "Legacy routes still work",
          body: "The older /math/unit-N/ hubs remain reachable and are registered as aliases of the canonical units, so existing bookmarks and printed handouts keep working.",
          look: "Nothing a student or family already had was broken to build this.",
          route: "/math/unit-3/",
        },
      ],
    },
    "teacher-studio": {
      minutes: "3–4 minutes",
      steps: [
        {
          title: "Start from a standard",
          body: "The workflow begins with a unit, lesson, or standard chosen from the canonical registry — not from a blank prompt box.",
          look: "A generator constrained to real curriculum data cannot invent a conflicting unit.",
          route: "/teacher-studio/",
        },
        {
          title: "Generate or locate",
          body: "Existing tools do the work: Lesson Plan Generator, Card Builder, Study Pack Maker, Resource Finder. None of them were rebuilt for this.",
          look: "Teacher Studio orders the tools; it does not replace them.",
        },
        {
          title: "Four review gates",
          body: "Mathematical validation, answer-key validation, accessibility review, ESOL-support review. Each is a required step with a visible result.",
          look: "The checks are part of the path, not a checklist someone is asked to remember.",
        },
        {
          title: "A human approves before publication",
          body: "Generated instructional content cannot auto-publish. A teacher reviews and edits first.",
          look: "This is the difference between a tool and an unattended content pipeline.",
        },
        {
          title: "Register the result",
          body: "The finished resource is registered with the curriculum registry, which is what keeps the site and the registry from drifting apart.",
          look: "The loop ends where the curriculum began.",
        },
        {
          title: "What is deliberately not here",
          body: "No shell execution, no server logs, no environment values, no unauthenticated student roster. Those were removed from the public surface.",
          look: "Roster data is reachable only through the existing teacher-key check.",
          route: "/teacher-tools/",
        },
      ],
    },
  };

  var state = { productId: null, step: 0, product: null, root: null };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function walkthrough() {
    return WALKTHROUGHS[state.productId] || null;
  }

  /* ------------------------------------------------------------------ render */

  function renderBanner() {
    var note = el("div", "ewl-note");
    note.setAttribute("data-tone", "demo");
    note.setAttribute("role", "note");
    note.appendChild(el("h2", null, "Simulated data — no real students"));
    note.appendChild(
      el(
        "p",
        null,
        "Everything in this walkthrough uses invented learners and invented work. No roster is loaded, nothing is read from or written to a real student's saved progress, and the numbers are the same on every run.",
      ),
    );
    return note;
  }

  function renderStep(walk) {
    var step = walk.steps[state.step];
    var section = el("section", "ewl-section");
    section.setAttribute("aria-live", "polite");

    section.appendChild(
      el("span", "ewl-eyebrow", "Step " + (state.step + 1) + " of " + walk.steps.length),
    );
    section.appendChild(el("h2", null, step.title));
    section.appendChild(el("p", "ewl-lede", step.body));

    if (step.look) {
      var look = el("div", "ewl-note");
      look.setAttribute("data-tone", "limits");
      look.appendChild(el("h3", null, "What to look at"));
      look.appendChild(el("p", null, step.look));
      section.appendChild(look);
    }

    if (step.evidence) {
      section.appendChild(renderEvidence(step.evidence));
    }

    var actions = el("div", "ewl-actions");
    if (step.route) {
      var open = el("a", "ewl-btn", "Open this surface");
      open.href = step.route;
      open.setAttribute("data-variant", "ghost");
      actions.appendChild(open);
    }

    var prev = el("button", "ewl-btn", "Back");
    prev.type = "button";
    prev.setAttribute("data-variant", "ghost");
    prev.disabled = state.step === 0;
    prev.addEventListener("click", function () {
      if (state.step > 0) {
        state.step -= 1;
        render();
      }
    });

    var next = el("button", "ewl-btn", state.step === walk.steps.length - 1 ? "Finish" : "Next step");
    next.type = "button";
    next.addEventListener("click", function () {
      if (state.step < walk.steps.length - 1) {
        state.step += 1;
        render();
      } else {
        reset();
      }
    });

    var restart = el("button", "ewl-btn", "Start over");
    restart.type = "button";
    restart.setAttribute("data-variant", "ghost");
    restart.addEventListener("click", reset);

    actions.appendChild(prev);
    actions.appendChild(next);
    actions.appendChild(restart);
    section.appendChild(actions);

    return section;
  }

  /** Show the exact synthetic evidence record that backs a step. */
  function renderEvidence(eventId) {
    var events = global.EWLEvidence ? global.EWLEvidence.all() : [];
    var event = null;
    for (var i = 0; i < events.length; i++) {
      if (events[i].eventId === eventId) {
        event = events[i];
        break;
      }
    }
    var wrap = el("div", "ewl-table-wrap");
    if (!event) {
      wrap.appendChild(el("p", "ewl-empty", "No evidence record is attached to this step."));
      return wrap;
    }

    var table = el("table", "ewl-table");
    var caption = el("caption", null, "The evidence record behind this step (simulated)");
    table.appendChild(caption);
    var tbody = document.createElement("tbody");

    var rows = [
      ["Event", event.eventType],
      ["Standard", event.standardIds.join(", ") || "—"],
      ["Unit / lesson", [event.unitId, event.lessonId].filter(Boolean).join(" · ") || "—"],
      ["Score", event.score != null ? event.score + " / " + event.maxScore : "—"],
      ["Mastery", event.masteryLevel || "—"],
      ["Attempts / hints", (event.attemptCount || 0) + " / " + (event.hintCount || 0)],
      [
        "Confidence",
        event.confidenceBefore != null
          ? event.confidenceBefore + " → " + (event.confidenceAfter != null ? event.confidenceAfter : "—")
          : "—",
      ],
      ["Misconception", event.misconceptionCodes.join(", ") || "—"],
      ["Support level", event.supportLevel || "—"],
      ["Explanation", event.writtenExplanation || "—"],
      ["Simulated", event.synthetic ? "yes" : "no"],
    ];

    rows.forEach(function (pair) {
      var tr = document.createElement("tr");
      var th = el("th", null, pair[0]);
      th.scope = "row";
      tr.appendChild(th);
      tr.appendChild(el("td", null, pair[1]));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function render() {
    var root = state.root;
    if (!root) return;
    var walk = walkthrough();
    root.textContent = "";

    if (!walk) {
      root.appendChild(
        el("p", "ewl-error", "No guided demonstration is defined for this product."),
      );
      return;
    }

    var header = el("header", "ewl-section");
    header.appendChild(el("span", "ewl-eyebrow", "Guided demonstration · " + walk.minutes));
    header.appendChild(el("h2", null, state.product ? state.product.name : state.productId));
    if (state.product) header.appendChild(el("p", "ewl-lede", state.product.tagline));
    root.appendChild(header);
    root.appendChild(renderBanner());
    root.appendChild(renderStep(walk));
  }

  /* ------------------------------------------------------------------- setup */

  /** Return to step 1 with the dataset freshly reloaded — fully deterministic. */
  function reset() {
    state.step = 0;
    if (global.EWLEvidence && global.EWLSyntheticData) {
      global.EWLEvidence.useSynthetic(global.EWLSyntheticData.dataset(state.productId));
    }
    render();
    return state.step;
  }

  function start(root, productId) {
    state.root = root;
    state.productId = productId;

    if (!global.EWLEvidence || !global.EWLSyntheticData) {
      root.textContent = "";
      root.appendChild(
        el("p", "ewl-error", "The demonstration data could not be loaded on this page."),
      );
      return Promise.resolve(false);
    }

    // Synthetic mode for the whole session: real storage is neither read nor
    // written while this page is open.
    global.EWLEvidence.useSynthetic(global.EWLSyntheticData.dataset(productId));
    global.addEventListener("pagehide", function () {
      global.EWLEvidence.clearSynthetic();
    });

    render();

    return fetch(REGISTRY_URL, { credentials: "omit" })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (doc) {
        if (!doc) return false;
        state.product =
          (doc.products || []).filter(function (p) {
            return p.id === productId;
          })[0] || null;
        render();
        return true;
      })
      .catch(function () {
        // The walkthrough is self-contained; a missing registry only costs the
        // product name in the header.
        return false;
      });
  }

  global.EWLJudgeMode = {
    WALKTHROUGHS: WALKTHROUGHS,
    start: start,
    reset: reset,
    step: function () {
      return state.step;
    },
    isSynthetic: function () {
      return Boolean(global.EWLEvidence && global.EWLEvidence.isSynthetic());
    },
  };

  function autoInit() {
    var node = document.querySelector("[data-ewl-judge-mode]");
    if (!node) return;
    start(node, node.getAttribute("data-ewl-judge-mode"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})(typeof window !== "undefined" ? window : globalThis);
