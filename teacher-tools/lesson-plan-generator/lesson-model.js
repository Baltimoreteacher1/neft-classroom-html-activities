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
    const title =
      clean(map.title) || clean(fields.topic) || `${content.topicLabel} Lesson`;

    // Standards: form field wins, else parsed codes, else domain label.
    let standards = [];
    if (clean(fields.standards)) {
      standards = clean(fields.standards)
        .split(/[;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const m = s.match(
            /(6\.[A-Z]{1,3}(?:\.[A-Z])?\.\d+[a-z]?)\s*[-–—:]?\s*(.*)/i,
          );
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

    // ---------- Section 2: Teacher Snapshot ----------
    const snapshot = {
      learning: `Students are learning to ${clean(topic).toLowerCase()} (${content.topicLabel}).`,
      why: `This skill builds the foundation for later Grade ${grade} work and shows up in everyday situations, so students see math as useful, not just procedural.`,
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
        "Work silently for 3–5 minutes. Try every question; star the one you are unsure about.",
      items: content.doNow,
      teacherMove:
        "Circulate and note 1–2 student approaches to surface in the mini-lesson; quick thumbs-up/sideways/down check before moving on.",
    };

    // ---------- Section 5: Mini-Lesson ----------
    const sourceMini = clean(map.phases && map.phases.mini);
    const mini = {
      teacherExplanation:
        (sourceMini ? sourceMini + " " : "") +
        `Connect to the objective, then model the skill explicitly with a think-aloud before any guided work.`,
      studentNotes: [
        `Today's goal: ${iCan}`,
        `Key idea: ${content.worked.problem}`,
        ...content.worked.steps.map((s, i) => `Step ${i + 1}: ${s}`),
      ],
      worked: content.worked,
      gradualRelease: "I do (model) → We do (guided) → You do (independent).",
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
    };

    // ---------- Section 7: Collaborative / Partner ----------
    const collaborative = {
      studentDirections: content.collabTask,
      teacherDirections:
        "Assign A/B partners; set a 6–8 minute timer; monitor math talk and prompt with the discussion questions. Each pair turns in ONE shared answer.",
      accountability:
        "Both partners must be able to explain the answer; cold-call one partner from two pairs to share.",
      discussionPrompts: [
        "How did you decide which strategy to use?",
        "Where could someone make a mistake on this problem?",
        "How do you know your answer is reasonable?",
      ],
      twrWritten: content.twr.because,
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
      showThinking:
        "For at least two problems, write a sentence explaining HOW you solved it.",
      extension: `Challenge: create your own ${content.topicLabel} problem, solve it, and write the answer key.`,
    };

    // ---------- Section 9: Writing / TWR ----------
    const writing = content.twr;

    // ---------- Section 10: Differentiation ----------
    const widaLevel = clean(fields.wida);
    const spedNeeds = clean(fields.sped);
    const differentiation = {
      esol: [
        "Pre-teach vocabulary with the picture/Spanish supports in the Vocabulary section.",
        "Provide the sentence frames for every spoken and written response.",
        widaLevel
          ? `Match support to WIDA ${widaLevel}: more visuals/native-language bridge at lower levels.`
          : "Pair lower-language students with a supportive partner for talk rehearsal.",
      ],
      sped: [
        "Chunk the practice set; reduce the number of required problems.",
        "Provide a worked example to reference and a step checklist.",
        spedNeeds
          ? `Per IEP/504 needs noted: ${spedNeeds}.`
          : "Extended time and read-aloud of directions as needed.",
      ],
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
      guided:
        "Mini-whiteboards on one problem; look for the strategy, not just the answer.",
      independent:
        "Confer with 4–5 students; flag who needs the reteach group.",
      decisionPoints: [
        "If <70% solid after guided practice → re-model before releasing.",
        "If a common error appears → pause and address with a non-example.",
        "If most are solid → extend with the challenge problem.",
      ],
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
    };

    // ---------- Section 13: Teacher Notes / Next-Day ----------
    const teacherNotes = {
      collect: "Exit tickets (sort into met / almost / not-yet piles).",
      lookFor:
        "Whether errors are procedural (steps) or conceptual (meaning) — that decides the reteach.",
      reteachWho: "Students who missed the exit-ticket procedural items.",
      adjust:
        "Open tomorrow with a Do Now mirroring the most-missed exit-ticket item.",
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
      },
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
      },
    };
  }

  window.LPGModel = { build, deriveICan };
})();
