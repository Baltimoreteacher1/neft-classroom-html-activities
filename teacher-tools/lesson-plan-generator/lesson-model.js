/* =====================================================================
   Neft Teacher — Ready Lesson · Model builder
   window.LPGModel

   Assembles the full "Ready <date>" lesson plan object (14 sections, in
   the locked order) from:
     - map      : parsed source (buildContentMap in app.js)
     - fields   : the teacher's form inputs
     - content  : the standards-aware content from window.LPGContent

   Source content is preferred where present (objective, vocabulary, the
   phase text the teacher pasted); the rich Ready scaffolding, problems,
   answer keys, TWR writing, differentiation and exit ticket come from the
   content library so the output is complete — never a vague stub.

   One normalized plan object feeds BOTH the on-page renderer and the
   DOCX export, so they can never drift apart.
   ===================================================================== */
(function () {
  "use strict";

  const clean = (s) => (s == null ? "" : String(s).trim());
  const firstSentence = (s) => {
    const cleaned = clean(s).replace(/\s+/g, " ");
    const match = cleaned.match(/[.!?](?:\s|$)/);
    if (match) {
      return cleaned.slice(0, match.index + 1);
    }
    return cleaned;
  };

  function deriveICan(objective, topic) {
    let o = clean(objective);
    if (!o) return `I can ${clean(topic) || "use today's skill"}.`;
    o = o
      .replace(
        /^\s*(students will be able to|students will|swbat|i can|we will|the student will)\s*:?\s*/i,
        "",
      )
      .replace(/[.\s]+$/, "");
    return `I can ${o.charAt(0).toLowerCase() + o.slice(1)}.`;
  }

  function essentialQuestion(topic, domainLabel) {
    const t = clean(topic) || domainLabel || "this skill";
    return `How can I use ${t} to solve real problems, and how do I know my answer is reasonable?`;
  }

  /* ---------- Pacing math ----------
     Parse the length string to a target minute count, distribute it across
     the seven phases by fixed weights, then return both minute chips and
     clock ranges (0:00–0:06) that sum EXACTLY to the total. */
  const PHASE_WEIGHTS = {
    doNow: 5,
    mini: 15,
    guided: 10,
    collaborative: 8,
    independent: 12,
    writing: 5,
    exit: 5,
  };
  const PHASE_ORDER = [
    "doNow",
    "mini",
    "guided",
    "collaborative",
    "independent",
    "writing",
    "exit",
  ];

  function parseMinutes(length) {
    const s = clean(length).toLowerCase();
    // "45-60", "45–60", "45 to 60" → upper bound (plan the fuller block).
    const range = s.match(/(\d{2,3})\s*(?:[-–—]|to)\s*(\d{2,3})/);
    if (range) return Math.min(120, Math.max(20, parseInt(range[2], 10)));
    const one = s.match(/(\d{2,3})/);
    if (one) return Math.min(120, Math.max(20, parseInt(one[1], 10)));
    if (/double|block/.test(s)) return 90;
    return 60; // sensible default for a standard period
  }

  function fmtClock(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
  }

  /* Map free-text SPED / IEP accommodation notes to concrete, lesson-
     embedded moves. Each entry: [matcher, support written for THIS plan].
     Keeps the teacher's raw note too, so nothing is lost. */
  const SPED_RULES = [
    [
      /extended?\s*time|more time|time and a half|1\.5x/i,
      "Extended time: independent set is the core 4 problems; the remaining problems are optional. Do not penalize unfinished work — collect thinking on the core.",
    ],
    [
      /small group|separate setting|reduced distraction/i,
      "Small-group / reduced-distraction setting: pull the flagged students to the side table for the mini-lesson and guided practice; check in every 5 minutes.",
    ],
    [
      /read\s*aloud|read.?to.?text|oral|decoding/i,
      "Read-aloud: read every problem stem aloud (or pair with the read-aloud button); students underline the question before solving.",
    ],
    [
      /chunk|fewer problems|reduced (?:items|assignment|quantity)|shortened/i,
      "Reduced quantity: assign the odd-numbered problems only; mastery is shown on 3, not 6.",
    ],
    [
      /calculator|number line|manipulative|tool|chart|reference/i,
      "Approved tools: calculator, number line, and the anchor chart stay available; their use is expected, not a reward.",
    ],
    [
      /scribe|speech.?to.?text|typ(?:e|ing)|writing (?:support|difficult)/i,
      "Scribe / speech-to-text: accept oral or typed responses for the writing task; grade the math reasoning, not handwriting.",
    ],
    [
      /graphic organizer|template|sentence (?:frame|starter|stem)/i,
      "Graphic organizer: hand out the pre-structured template for the worked example and the TWR paragraph.",
    ],
    [
      /check(?:list|-ins?)|frequent (?:check|feedback)|redirect|prompt/i,
      "Frequent check-ins: confer after every 2 problems; use a private hand-signal to redirect and to confirm they are on the right step.",
    ],
    [
      /movement|break|sensory|fidget/i,
      "Movement breaks: build in a 60-second stand-and-stretch between the mini-lesson and independent practice; a fidget tool is allowed.",
    ],
    [
      /preferential|front|seating/i,
      "Preferential seating: seat flagged students near the board and the teacher path for quick, quiet support.",
    ],
  ];

  function spedSupportsFrom(spedNeeds) {
    if (!spedNeeds) return [];
    const out = [];
    const seen = new Set();
    for (const [re, support] of SPED_RULES) {
      if (re.test(spedNeeds) && !seen.has(support)) {
        seen.add(support);
        out.push(support);
      }
    }
    return out;
  }

  function buildTiming(length) {
    const total = parseMinutes(length);
    const weightSum = PHASE_ORDER.reduce((a, k) => a + PHASE_WEIGHTS[k], 0);
    // Largest-remainder apportionment so the rounded minutes sum to `total`.
    const raw = PHASE_ORDER.map((k) => (PHASE_WEIGHTS[k] / weightSum) * total);
    const floors = raw.map((x) => Math.max(2, Math.floor(x)));
    let deficit = total - floors.reduce((a, b) => a + b, 0);
    const order = raw
      .map((x, i) => ({ i, frac: x - Math.floor(x) }))
      .sort((a, b) => b.frac - a.frac);
    for (let j = 0; deficit > 0 && j < order.length; j++, deficit--) floors[order[j].i]++;
    // If rounding overshot (rare, from the min-2 floor), trim the longest.
    while (deficit < 0) {
      let maxIdx = 0;
      for (let i = 1; i < floors.length; i++) if (floors[i] > floors[maxIdx]) maxIdx = i;
      floors[maxIdx]--;
      deficit++;
    }
    const out = { totalMinutes: total };
    let clock = 0;
    PHASE_ORDER.forEach((k, i) => {
      const m = floors[i];
      out[k] = `${m} min`;
      out[k + "Clock"] = `${fmtClock(clock)}–${fmtClock(clock + m)}`;
      clock += m;
    });
    return out;
  }

  function build(map, fields, content) {
    const inferred = [];
    const note = (k) => inferred.push(k);

    const grade = clean(fields.grade) || clean(map.grade) || "6";
    const course = clean(fields.course) || clean(map.course) || "Mathematics";
    const length = clean(fields.length) || "45–60 minutes";
    const date = clean(fields.date) || clean(map.date) || "";
    const topic = clean(fields.topic) || clean(map.title) || content.topicLabel;
    const title = clean(map.title) || clean(fields.topic) || `${content.topicLabel} Lesson`;

    // Standards: form field wins, else parsed codes, else domain label.
    let standards = [];
    if (clean(fields.standards)) {
      standards = clean(fields.standards)
        .split(/[;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const m = s.match(/(\d+\.[A-Z]{1,3}(?:\.[A-Z])?\.\d+[a-z]?)\s*[-–—:]?\s*(.*)/i);
          return m ? { code: m[1], desc: m[2] || "" } : { code: "", desc: s };
        });
    } else if (map.standards && map.standards.length) {
      standards = map.standards.slice();
    } else {
      note("standards");
      standards = [
        {
          code: "",
          desc: `Add the Grade ${grade} ${content.topicLabel} standard this lesson addresses.`,
        },
      ];
    }

    // Prefer a source objective; else a teacher's verb-phrase focus; else a
    // grammatical fallback built from the topic noun.
    const objective =
      clean(map.objective) ||
      (clean(fields.focus)
        ? `Students will ${clean(fields.focus).charAt(0).toLowerCase() + clean(fields.focus).slice(1)} and explain their reasoning.`
        : `Students will build and apply skills with ${clean(topic).toLowerCase()} and explain their reasoning.`);
    const iCan = deriveICan(objective, topic);
    const languageObjective =
      clean(map.languageObjective) ||
      `Students will explain their reasoning using lesson vocabulary in complete sentences (e.g., "I ___ because ___").`;

    const materials =
      map.materials && map.materials.length
        ? map.materials.slice()
        : [
            "Slide deck / board",
            "Student notes handout",
            "Pencil & scratch paper",
            "Exit-ticket slips",
            "Optional: manipulatives / grid paper",
          ];

    // ---------- Pacing (drives the at-a-glance flow + section time chips) ----------
    // Scale every phase to the ACTUAL lesson length parsed from the length
    // field (a single "60 min", a "45-60" range → upper bound, or a class-
    // period phrase), then emit real clock ranges that sum to the total so a
    // 60-minute block reads "0:00–0:06 · Do Now" … not a fixed 45-min stub.
    const timing = buildTiming(length);
    const pacing = [
      ["Do Now", timing.doNow],
      ["Mini-Lesson", timing.mini],
      ["Guided", timing.guided],
      ["Partner", timing.collaborative],
      ["Independent", timing.independent],
      ["Writing", timing.writing],
      ["Exit", timing.exit],
    ];

    // ---------- Profile-driven supports (window.LPGProfile strategies) ----------
    // fields.profile = { summary, strategies, includeIds } when a class
    // support profile is locked in; null otherwise. Strategy text is
    // teacher-facing only — the student handout never receives it.
    const prof = fields.profile || null;
    const strat = (prof && prof.strategies) || {};
    // Per-phase "who gets what" lines (student initials + modification),
    // present only when the teacher shows IDs. Teacher-facing only.
    const phase = strat.phase || {};

    // ---------- Instructional Framework (TEACH) alignment ----------
    // Lesson-specific "evidence of a 4" moves the renderer weaves into each
    // phase and lists as a dedicated section. Degrades to null if the module
    // is absent so the plan still builds.
    const rubric =
      typeof window !== "undefined" && window.LPGRubric
        ? window.LPGRubric.build({
            topic: clean(topic).toLowerCase(),
            eq: essentialQuestion(topic, content.topicLabel),
            vocabList: (content.vocab || []).map((v) => v.term),
            hasProfile: !!prof,
          })
        : null;
    const rmove = (rubric && rubric.phaseMoves) || {};

    // ---------- Section 2: Teacher Snapshot ----------
    const snapshot = {
      learning: `Students learn to ${clean(topic).toLowerCase()} (${content.topicLabel}).`,
      why: `Builds toward later Grade ${grade} work and shows up in real life — math as useful, not just procedural.`,
      byEnd: firstSentence(objective) || objective,
      misconceptions: content.misconceptions.map((m) => m.error),
      lookFors: [
        "Students using the strategy (not guessing) and showing steps.",
        "Correct use of academic vocabulary in talk and writing.",
        "Reasonable answers checked against the question.",
      ],
    };

    // ---------- Section 4: Do Now ----------
    const doNow = {
      directions:
        "Silent, 3–5 min. Try every question; star the one you're unsure about." +
        (strat.doNowNote ? " " + strat.doNowNote : ""),
      items: content.doNow,
      teacherMove:
        "Circulate; note 1–2 approaches to surface in the mini-lesson. Thumbs check before moving on.",
      studentSupports: (phase.doNow || []).slice(),
      rubricMove: rmove.doNow || "",
    };

    // ---------- Section 5: Mini-Lesson ----------
    const sourceMini = clean(map.phases && map.phases.mini);
    const mini = {
      teacherExplanation:
        (sourceMini ? sourceMini + " " : "") +
        `Connect to the objective, then model the skill with a think-aloud before guided work.`,
      studentNotes: [
        `Today's goal: ${iCan}`,
        `Key idea: ${content.worked.problem}`,
        ...content.worked.steps.map((s, i) => `Step ${i + 1}: ${s}`),
      ],
      worked: content.worked,
      gradualRelease: "I do (model) → We do (guided) → You do (independent).",
      studentSupports: (phase.mini || []).slice(),
      rubricMove: rmove.mini || "",
    };

    // ---------- Section 6: Guided Practice ----------
    const guided = {
      items: content.guided,
      turnAndTalk:
        'Turn & Talk: "Which step is the trickiest, and why?" Share with your partner before we review.',
      sentenceStarters: [
        "First, I ___ because ___.",
        "I knew to ___ because ___.",
        "My answer is ___, and it makes sense because ___.",
      ],
      studentSupports: (phase.guided || []).slice(),
      rubricMove: rmove.guided || "",
    };

    // ---------- Section 7: Collaborative / Partner ----------
    const collaborative = {
      studentDirections: content.collabTask,
      teacherDirections:
        "A/B partners; 6–8 min timer; monitor math talk. Each pair turns in ONE shared answer.",
      accountability:
        "Both partners must be able to explain it; cold-call one partner from two pairs.",
      discussionPrompts: [
        "How did you decide which strategy to use?",
        "Where could someone make a mistake on this problem?",
        "How do you know your answer is reasonable?",
      ],
      twrWritten: content.twr.because,
      studentSupports: (phase.collaborative || []).slice(),
      rubricMove: rmove.collaborative || "",
    };

    // ---------- Section 8: Independent Practice ----------
    const independent = {
      items: content.independent.map((it) => ({
        ...it,
        thinking:
          it.type === "Conceptual" || it.type === "Error analysis"
            ? "Show your thinking in words."
            : "",
      })),
      showThinking: "For at least two problems, write a sentence explaining HOW you solved it.",
      extension: `Challenge: create your own ${content.topicLabel} problem, solve it, and write the answer key.`,
      coreSet: strat.independentCore || "",
      studentSupports: (phase.independent || []).slice(),
      rubricMove: rmove.independent || "",
    };

    // ---------- Section 9: Writing / TWR ----------
    const writing = Object.assign({}, content.twr, {
      supports: (strat.writingSupports || []).concat(phase.writing || []),
      rubricMove: rmove.writing || "",
    });

    // ---------- Section 10: Differentiation ----------
    // Base lines cover a typical mixed class; when a class support profile
    // is locked in, its concrete strategy lines take priority and the
    // generic fallbacks are dropped so nothing reads as boilerplate.
    const widaLevel = clean(fields.wida);
    const spedNeeds = clean(fields.sped);
    const hasEsolStrat = !!(strat.esol && strat.esol.length);
    const hasSpedStrat = !!(strat.sped && strat.sped.length);
    const baseEsol = [
      "Pre-teach the vocabulary table (word + Spanish + frame) in a 3-minute small group before the Do Now.",
      "Every spoken and written response gets a sentence frame from Section 9 — using it is the expectation.",
    ];
    if (!hasEsolStrat) {
      baseEsol.push(
        widaLevel
          ? `Match support to WIDA ${widaLevel}: more visuals and native-language bridging at lower levels; precise-vocabulary push at higher levels.`
          : "Pair developing-English students with a supportive partner and rehearse the answer aloud before any whole-class share.",
      );
    }
    const baseSped = [
      "Keep the worked example posted and visible during independent practice — it is a reference, not a reward.",
    ];
    if (!hasSpedStrat) {
      baseSped.push(
        "Hand out independent practice in chunks: problems 1–3 first, then 4–6 after a check-in.",
        "Read directions aloud twice; students highlight the numbers and underline the question before solving.",
      );
    }
    // Turn the teacher's free-text SPED / IEP note into concrete, lesson-
    // embedded accommodations (extended time, read-aloud, tools, etc.).
    const spedParsed = spedSupportsFrom(spedNeeds);
    baseSped.push(...spedParsed);
    if (spedNeeds) {
      baseSped.push(`Teacher-noted needs for this class: ${spedNeeds}.`);
    }
    const differentiation = {
      esol: baseEsol.concat(hasEsolStrat ? strat.esol : []),
      sped: baseSped.concat(hasSpedStrat ? strat.sped : []),
      grouping: (strat.grouping || []).slice(),
      perStudent: (strat.perStudent || []).slice(),
      pacing: strat.pacingNote || "",
      profileNote: prof
        ? `Built from the locked class support profile (${prof.summary.total} student${prof.summary.total === 1 ? "" : "s"}). Supports are written as whole-class moves and teacher-facing notes — no student names, labels, or plan types appear in any student-facing material.`
        : "",
      newcomer: [
        "Use the bilingual vocabulary, visuals, and a model to follow.",
        "Allow drawing/labeling and gestures to show understanding before writing.",
        "Reduce language load: numbers + labeled model instead of word problems first.",
      ],
      onGrade: [
        "Full problem set with partner talk and written justification.",
        "Push for precise vocabulary and complete-sentence explanations.",
      ],
      extension: [
        independent.extension,
        "Solve a multi-step or real-world version and explain the reasoning.",
      ],
      reteach:
        "Pull a small group that missed the Do Now / CFU; re-model one problem with manipulatives or a simpler case, then a guided turn.",
      earlyFinishers:
        "Move to the challenge problem, then become a peer explainer for a partner (must justify, not just give the answer).",
    };

    // ---------- Section 11: Checks for Understanding ----------
    const cfu = {
      doNow: "Thumbs check + scan starred questions to gauge readiness.",
      mini: "Cold-call the next step during the think-aloud; quick choral response on the key idea.",
      guided: "Mini-whiteboards on one problem; look for the strategy, not just the answer.",
      independent: "Confer with 4–5 students; flag who needs the reteach group.",
      decisionPoints: [
        "If <70% solid after guided practice → re-model before releasing.",
        "If a common error appears → pause and address with a non-example.",
        "If most are solid → extend with the challenge problem.",
      ].concat(strat.cfuPoints || []),
    };

    // ---------- Section 12: Exit Ticket ----------
    const exit = {
      items: content.exit.filter((e) => !/reflection/i.test(e.q)),
      confidence: content.exit.find((e) => /reflection/i.test(e.q)) || {
        q: 'Rate your confidence (1–4) and finish: "I still want help with ___."',
        a: "(self-report)",
      },
      tomorrow:
        "0–1 correct → reteach in small group tomorrow. 2 correct → targeted guided practice. All correct → move on / extend.",
      accommodations: (strat.exitAccommodations || []).concat(phase.exit || []),
      rubricMove: rmove.exit || "",
    };

    // ---------- Section 13: Teacher Notes / Next-Day ----------
    const teacherNotes = {
      collect: "Exit tickets (sort into met / almost / not-yet piles).",
      lookFor:
        "Whether errors are procedural (steps) or conceptual (meaning) — that decides the reteach.",
      reteachWho: "Students who missed the exit-ticket procedural items.",
      adjust: "Open tomorrow with a Do Now mirroring the most-missed exit-ticket item.",
      smallGroups:
        "Form a 4–6 student reteach group from the not-yet pile; enrichment task for the met pile.",
      extra: clean(fields.notes),
    };

    return {
      header: {
        title,
        date,
        grade: /grade/i.test(grade) ? grade : `Grade ${grade}`,
        course,
        unit: clean(fields.unit) || clean(fields.topic) || content.topicLabel,
        standards,
        length,
        objective,
        iCan,
        essentialQuestion: essentialQuestion(topic, content.topicLabel),
        languageObjective,
        materials,
        pacing,
      },
      timing,
      snapshot,
      vocab: content.vocab,
      doNow,
      mini,
      guided,
      collaborative,
      independent,
      writing,
      differentiation,
      cfu,
      exit,
      teacherNotes,
      rubric,
      meta: {
        domain: content.domain,
        domainLabel: content.topicLabel,
        inferred,
        generic: !!content.generic,
        profileApplied: !!prof,
        rubricApplied: !!rubric,
        spedApplied: spedParsed.length,
        totalMinutes: timing.totalMinutes,
      },
    };
  }

  window.LPGModel = { build, deriveICan };
})();
