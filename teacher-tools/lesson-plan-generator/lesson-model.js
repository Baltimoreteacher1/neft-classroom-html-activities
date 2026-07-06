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
    const timing = {
      doNow: "3–5 min",
      mini: "15 min",
      guided: "10 min",
      collaborative: "8 min",
      independent: "12 min",
      writing: "5 min",
      exit: "5 min",
    };
    const pacing = [
      ["Do Now", timing.doNow],
      ["Mini-Lesson", timing.mini],
      ["Guided", timing.guided],
      ["Partner", timing.collaborative],
      ["Independent", timing.independent],
      ["Writing", timing.writing],
      ["Exit", timing.exit],
    ];

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

    // ---------- Profile-driven supports (window.LPGProfile strategies) ----------
    // fields.profile = { summary, strategies, includeIds } when a class
    // support profile is locked in; null otherwise. Strategy text is
    // teacher-facing only — the student handout never receives it.
    const prof = fields.profile || null;
    const strat = (prof && prof.strategies) || {};
    // Per-phase "who gets what" lines (student initials + modification),
    // present only when the teacher shows IDs. Teacher-facing only.
    const phase = strat.phase || {};

    // ---------- Section 4: Do Now ----------
    const doNow = {
      directions:
        "Silent, 3–5 min. Try every question; star the one you're unsure about." +
        (strat.doNowNote ? " " + strat.doNowNote : ""),
      items: content.doNow,
      teacherMove:
        "Circulate; note 1–2 approaches to surface in the mini-lesson. Thumbs check before moving on.",
      studentSupports: (phase.doNow || []).slice(),
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
    };

    // ---------- Section 9: Writing / TWR ----------
    const writing = Object.assign({}, content.twr, {
      supports: (strat.writingSupports || []).concat(phase.writing || []),
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
      meta: {
        domain: content.domain,
        domainLabel: content.topicLabel,
        inferred,
        generic: !!content.generic,
        profileApplied: !!prof,
      },
    };
  }

  window.LPGModel = { build, deriveICan };
})();
