// UIFR — BCPS Instructional Framework Rubric evidence (TEACH · Level 4)
// ────────────────────────────────────────────────────────────────────────────
// Single source of truth for how a lesson maps to the Baltimore City Public
// Schools Instructional Framework Rubric (June 2020), TEACH domain, at
// Level 4 = "Highly Effective". Every Level 4 descriptor centers STUDENT AGENCY
// (students select, justify, revise, lead), so the mapping below records the
// student-facing lesson surfaces that create the CONDITIONS for a Level 4
// rating on each applicable TEACH indicator.
//
// HONEST FRAMING (do not overclaim): the materials create the conditions for
// Level 4; the actual rating on any given day depends on OBSERVED student
// practice. Indicators T1–T5 are addressed directly by the lesson surfaces.
// T6 (routines) and T7 (community) are teacher-facilitated — the lesson supplies
// the supporting structure, but the Level 4 rating is enacted by the teacher and
// classroom culture, so they are reported as "supported", not "materials-met".
//
// This module is DOM-free at the top level so the Node coverage generator
// (scripts/uifr/generate-uifr-coverage.mjs) can import the same computation and
// keep the report, the runtime <meta> stamp, and the teacher panel in lockstep.
//
// STUDENT PRIVACY: nothing here is shown to students. The runtime stamp is a
// hidden <meta>/<script type="application/json"> in <head> (view-source / DevTools
// discoverable, never rendered); the human-readable panel is gated behind
// Teacher Mode; the durable record lives in reports/uifr-teach-l4-coverage.*.
// No rubric code ("T4", "Level 4", "Highly Effective") ever appears in the
// student view.

/** The seven TEACH indicators with their Level 4 (Highly Effective), student-
 *  agency descriptor and how this platform's lesson engine addresses them. */
export const TEACH_INDICATORS = [
  {
    code: "T1",
    title: "Facilitate clear, standards-based content learning",
    l4: "Students connect their learning to essential questions, life experiences, or their own identities, and make connections across and within disciplines.",
    applicability: "direct",
  },
  {
    code: "T2",
    title: "Use strategies and tasks to engage students in rigorous work",
    l4: "Students determine and select strategies that support their own learning needs and goals, with student voice and choice built into grade-level work.",
    applicability: "direct",
  },
  {
    code: "T3",
    title: "Use intentional questioning to deepen learning",
    l4: "Students justify their answers using evidence and reflect on the variety of pathways used to reach them.",
    applicability: "direct",
  },
  {
    code: "T4",
    title: "Monitor progress and provide feedback",
    l4: "Students correct, clarify, expand, or redo their work in response to feedback.",
    applicability: "direct",
  },
  {
    code: "T5",
    title: "Facilitate student interactions and academic talk",
    l4: "Students use academic language and vocabulary as they lead or sustain discussion, and reflect on or adapt how they interact.",
    applicability: "direct",
  },
  {
    code: "T6",
    title: "Organize and implement routines to support a learning-focused classroom",
    l4: "Students take academic risks, hold their focus through breaks in structure, and follow shared agreements.",
    applicability: "facilitated",
  },
  {
    code: "T7",
    title: "Cultivate a supportive learning community",
    l4: "Students support one another and feel safe sharing a perspective that may differ from others.",
    applicability: "facilitated",
  },
];

const isObj = (v) => v && typeof v === "object";
const has = (v) => (Array.isArray(v) ? v.length > 0 : isObj(v) ? Object.keys(v).length > 0 : !!v);

/**
 * Compute the Level 4 evidence surfaces a specific lesson provides, per TEACH
 * indicator. Most surfaces are UNIVERSAL (the engine renders them for every
 * lesson via lesson-renderer.js), so they are always listed; a few are enriched
 * from the lesson's own config so the record stays honest per lesson.
 *
 * @param {object} config - the lesson config.json object
 * @returns {{ lessonId:string, standard:string, title:string,
 *   indicators: Array<{code,title,l4,applicability,covered:boolean,surfaces:string[]}>,
 *   direct: {met:number, total:number}, facilitated:{supported:number,total:number} }}
 */
export function computeTeachL4Evidence(config) {
  const c = config || {};
  const hasNoticeWonder = isObj(c.noticeAndWonder);
  const hasReveal =
    isObj(c.revealWordProblem) && (c.revealWordProblem.text || c.revealWordProblem.image);
  const ttCount = Array.isArray(c.turnAndTalk) ? c.turnAndTalk.length : 0;
  const hasConnect = has(c.connect);
  const hasVocab = Array.isArray(c.vocabulary) && c.vocabulary.length > 0;

  const surfaces = {
    T1: [
      "Standards-based Content & Language Objectives are stated up front",
      hasConnect
        ? "Connect phase ties the concept to a real-world application"
        : "Connect phase invites students to apply the concept",
      'Reflect 3-2-1 asks students for "connections made" and a "question I still have"',
      hasNoticeWonder ? "Notice & Wonder hook surfaces prior-knowledge connections" : null,
    ],
    T2: [
      "Show Your Work strategy chips let students choose their approach",
      "Practice level selector lets students pick their entry level (student choice)",
      "Adaptive practice keeps access to grade-level and beyond",
      hasReveal ? "Authored Apply problem gives a grade-level task to strategize on" : null,
    ],
    T3: [
      'Show Your Work "How I know" box requires justification with evidence',
      'Reflect prompts students to name "a question I still have"',
      hasNoticeWonder ? "Notice & Wonder elicits student-generated questions" : null,
      ttCount ? "Turn & Talk stems prompt students to justify their thinking aloud" : null,
    ],
    T4: [
      '"Check my thinking" self-check prompts students to revise their work',
      "Hint ladder gives Socratic, no-giveaway feedback and invites a retry",
      "Adaptive remediation responds to misses so students can redo work",
    ],
    T5: [
      ttCount
        ? `${ttCount} Turn & Talk prompt${ttCount > 1 ? "s" : ""} with bilingual sentence stems + confidence self-assess`
        : "Turn & Talk (Explore + Connect) with bilingual sentence stems + confidence self-assess",
      hasVocab
        ? "Academic-vocabulary glossary popups support content-specific talk"
        : "Academic-language stems support content-specific talk",
    ],
    T6: [
      "Consistent Launch → Vocab → Learn It → Practice → Connect → Reflect routine",
      "Self-paced Save/Resume lets students hold focus across days",
      "Calm, no-fail practice lowers the risk of taking an academic chance",
    ],
    T7: [
      "Learning Supports (text size, focus mode, presets) keep the space welcoming",
      "Encouraging, no-shame feedback tone throughout",
      "Bilingual (EN/ES) access invites every learner to share a perspective",
    ],
  };

  const indicators = TEACH_INDICATORS.map((ind) => {
    const list = (surfaces[ind.code] || []).filter(Boolean);
    return {
      code: ind.code,
      title: ind.title,
      l4: ind.l4,
      applicability: ind.applicability,
      // "direct" indicators are met when the lesson exposes ≥1 surface (always
      // true given the universal engine scaffolds); "facilitated" indicators are
      // "supported" — the conditions are present, the rating is teacher-enacted.
      covered: list.length > 0,
      surfaces: list,
    };
  });

  const direct = indicators.filter((i) => i.applicability === "direct");
  const facilitated = indicators.filter((i) => i.applicability === "facilitated");

  return {
    lessonId: c.lessonId || "",
    standard: c.standard || "",
    title: c.title || "",
    indicators,
    direct: { met: direct.filter((i) => i.covered).length, total: direct.length },
    facilitated: {
      supported: facilitated.filter((i) => i.covered).length,
      total: facilitated.length,
    },
  };
}

/** Compact machine-readable payload for the hidden runtime stamp / report. */
export function teachL4Payload(config) {
  const ev = computeTeachL4Evidence(config);
  return {
    framework: "BCPS Instructional Framework Rubric (June 2020)",
    domain: "TEACH",
    level: 4,
    levelName: "Highly Effective",
    lessonId: ev.lessonId,
    standard: ev.standard,
    directMet: `${ev.direct.met}/${ev.direct.total}`,
    facilitatedSupported: `${ev.facilitated.supported}/${ev.facilitated.total}`,
    indicators: ev.indicators.map((i) => ({
      code: i.code,
      applicability: i.applicability,
      covered: i.covered,
      surfaces: i.surfaces,
    })),
    note: "Materials create the conditions for a Level 4 rating; the actual rating depends on observed student practice.",
  };
}

// ── Runtime: hidden, student-invisible stamp ────────────────────────────────
// Adds a <meta> + <script type="application/json"> to <head>. Neither renders
// on screen, so students never see any rubric language; a teacher, observer, or
// auditor can read it via View Source / DevTools. Idempotent.
export function stampTeachL4Meta(config) {
  if (typeof document === "undefined") return;
  if (document.getElementById("nt-teach-l4-evidence")) return;
  const payload = teachL4Payload(config);
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return;

  const meta = document.createElement("meta");
  meta.name = "nt-teach-l4-coverage";
  meta.content = `TEACH Level 4 — direct ${payload.directMet} (T1-T5), facilitated ${payload.facilitatedSupported} (T6,T7)`;
  head.appendChild(meta);

  const json = document.createElement("script");
  json.type = "application/json";
  json.id = "nt-teach-l4-evidence";
  json.textContent = JSON.stringify(payload);
  head.appendChild(json);
}

// ── Teacher Mode: human-readable evidence section (gated by caller) ─────────
// Returned as an HTML string for insertion into the teacher panel. Callers MUST
// already be inside an isTeacherMode() gate — this is never shown to students.
export function teachEvidencePanelHtml(config, esc = (s) => String(s ?? "")) {
  const ev = computeTeachL4Evidence(config);
  const row = (i) => {
    const tag =
      i.applicability === "direct"
        ? '<span class="uifr-tag uifr-tag-direct">Level 4 conditions met</span>'
        : '<span class="uifr-tag uifr-tag-facilitated">Teacher-facilitated · supported</span>';
    const surfaces = i.surfaces.map((s) => `<li>${esc(s)}</li>`).join("");
    return `
      <li class="uifr-ind">
        <div class="uifr-ind-head"><strong>${esc(i.code)}</strong> · ${esc(i.title)} ${tag}</div>
        <p class="uifr-ind-l4">${esc(i.l4)}</p>
        <ul class="uifr-surfaces">${surfaces}</ul>
      </li>`;
  };
  return `
    <h4>🧭 Teaching Evidence · BCPS Rubric (TEACH · Level 4)</h4>
    <p class="uifr-summary">Direct indicators met: <strong>${ev.direct.met}/${ev.direct.total}</strong> (T1–T5) ·
      Facilitated: <strong>${ev.facilitated.supported}/${ev.facilitated.total}</strong> (T6, T7)</p>
    <ol class="uifr-indicators">${ev.indicators.map(row).join("")}</ol>
    <p class="uifr-note">Materials create the <em>conditions</em> for a Level 4 (Highly Effective) rating; the
      actual rating depends on observed student practice. Students never see this panel.</p>`;
}
