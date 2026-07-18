/* =====================================================================
   Neft Teacher — Ready Lesson · Instructional Framework alignment
   window.LPGRubric

   Baltimore City Public Schools Instructional Framework Rubric (June
   2020), TEACH domain. For each TEACH indicator this module carries the
   Highly Effective (4) descriptors verbatim-condensed from the rubric,
   and builds LESSON-SPECIFIC evidence moves so the plan shows what a 4
   looks like *in this lesson*, not as generic boilerplate.

   Level 4 = the Level 3 elements PLUS one or more Level 4 descriptors —
   the through-line is student agency and ownership. The per-phase moves
   below are written so an observer could check them off during the
   lesson phase they are attached to.
   ===================================================================== */
(function () {
  "use strict";

  const INDICATORS = [
    {
      code: "TEACH 1",
      name: "Facilitate clear, standards-based content learning",
      four: "With teacher support, students make connections across and within disciplines, and connect their learning to essential questions, life experiences, or their own identities.",
    },
    {
      code: "TEACH 2",
      name: "Use strategies and tasks to engage students in rigorous work",
      four: "With teacher supports, students determine and select strategies that support their learning needs; teacher incorporates student voice and choice while maintaining access to grade-level learning.",
    },
    {
      code: "TEACH 3",
      name: "Use intentional questioning to deepen learning",
      four: "Students lead questioning, hold one another accountable for justifying answers with evidence, and reflect on the variety of pathways used to respond.",
    },
    {
      code: "TEACH 4",
      name: "Monitor progress and provide feedback",
      four: "In response to formative evidence, teacher facilitates peer learning that advances learning; students correct, clarify, expand, or redo work in response to feedback.",
    },
    {
      code: "TEACH 5",
      name: "Facilitate student interactions and academic talk",
      four: "Students use academic language as they lead discussions and group work with minimal teacher support, monitor their own progress, and keep one another productive.",
    },
    {
      code: "TEACH 6",
      name: "Organize and implement routines to support a learning-focused classroom",
      four: "Teacher creates conditions where students are expected to take chances; students maintain academic focus through breaks in structure; shared agreements are created and followed.",
    },
    {
      code: "TEACH 7",
      name: "Cultivate a supportive learning community",
      four: "Students support one another through affirmation, encouragement, and demonstrated empathy; students feel safe sharing a perspective that differs from the majority.",
    },
  ];

  /* Lesson-specific "in this lesson" evidence, one line per indicator.
     ctx = { topic, eq, vocabList, hasProfile } */
  function evidenceFor(ctx) {
    const topic = ctx.topic || "today's skill";
    const vocab =
      ctx.vocabList && ctx.vocabList.length
        ? ctx.vocabList.slice(0, 3).join(", ")
        : "the lesson vocabulary";
    return {
      "TEACH 1": `During the mini-lesson, students name where ${topic} shows up in their own lives (shopping, sports, games) and connect it to the Essential Question in their own words — charted, not teacher-supplied.`,
      "TEACH 2": `Independent practice opens with a strategy menu (model / table / equation); each student states which strategy fits them today and why, then works the grade-level set — choice of pathway, not of rigor.`,
      "TEACH 3": `In guided practice, the asker role rotates to students: after each problem a student poses the next "why" question ("Why that step? What's the evidence?") and the class holds the answerer to evidence, not agreement.`,
      "TEACH 4": `Do Now and CFU results are used live: students who show mastery become peer explainers, and every returned exit ticket tomorrow gets a correct-clarify-redo minute — feedback students act on, not just receive.`,
      "TEACH 5": `The partner task runs on student-owned roles (explainer / checker) with ${vocab} required in the talk; the teacher listens in and logs vocabulary use instead of leading the exchange.`,
      "TEACH 6": `The class norms chart (created with students) is referenced at each transition; timers and hand-signals carry the moves between phases so no learning minutes are lost to directions.`,
      "TEACH 7": `Error analysis is framed as "brave math": the class affirms risk-taking ("thank you for showing that thinking"), and disagreeing with a shared answer is explicitly invited and practiced.`,
    };
  }

  /* Per-phase one-liners the renderer attaches inside sections, so the
     rubric lives where the observer is looking, not only in a table. */
  function phaseMoves(ctx) {
    const ev = evidenceFor(ctx);
    return {
      doNow: `TEACH 4 (evidence of a 4): Students self-check the Do Now against the posted key and mark met / not-yet — formative evidence reaches you before the mini-lesson, and strong finishers become peer explainers.`,
      mini: `TEACH 1 (evidence of a 4): ${ev["TEACH 1"]}`,
      guided: `TEACH 3 (evidence of a 4): ${ev["TEACH 3"]}`,
      collaborative: `TEACH 5 (evidence of a 4): ${ev["TEACH 5"]}`,
      independent: `TEACH 2 (evidence of a 4): ${ev["TEACH 2"]}`,
      writing: `TEACH 7 (evidence of a 4): ${ev["TEACH 7"]}`,
      exit: `TEACH 4 (evidence of a 4): ${ev["TEACH 4"]}`,
    };
  }

  function build(ctx) {
    const ev = evidenceFor(ctx);
    return {
      source: "BCPS Instructional Framework Rubric (June 2020) — TEACH domain",
      note: "A Level 4 rating requires the Level 3 elements plus one or more Level 4 descriptors. The right-hand column is what an observer should see in THIS lesson.",
      rows: INDICATORS.map((i) => ({
        code: i.code,
        name: i.name,
        four: i.four,
        move: ev[i.code],
      })),
      phaseMoves: phaseMoves(ctx),
    };
  }

  window.LPGRubric = { build, INDICATORS };
})();
