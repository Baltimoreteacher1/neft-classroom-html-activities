// Shared canonical builders for BCPSS Curriculum-to-Language Ecosystem seeds.
// Converts authentic per-unit specifications into normalized bcpss_units,
// unit_connections, unit_activities, and bcpss_family_cards records.

import { CURRICULUM_BY_GRADE_SUBJECT, LANGUAGE_BLUEPRINTS } from "./blueprints.mjs";

const BLUEPRINT_BY_ID = new Map(LANGUAGE_BLUEPRINTS.map((bp) => [bp.id, bp]));

const SUBJECT_DISTRACTOR_FALLBACKS = {
  ELA: ["perspective", "evidence", "theme", "tone", "inference"],
  Math: ["equivalent", "variable", "estimate", "pattern", "equation"],
  Science: ["hypothesis", "system", "matter", "energy", "observation"],
  "Social Studies": ["civic", "primary source", "economy", "region", "governance"],
};

function isEarlyPrimary(grade) {
  return grade === "K" || grade === "1" || grade === "2" || grade === "3";
}

function isElementaryScience(grade) {
  return grade === "K" || grade === "1" || grade === "2" || grade === "3" || grade === "4" || grade === "5";
}

function getGradeBand(grade) {
  if (grade === "K" || grade === "1" || grade === "2") return "K–2";
  if (grade === "3" || grade === "4" || grade === "5") return "3–5";
  return "6–8";
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatStudentDef(rawDef, term, unitTitle) {
  const cleaned = String(rawDef || "").trim();
  if (!cleaned) {
    return `Key academic term used in "${unitTitle}" (${term}).`;
  }
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function toInlineDef(studentDef, term) {
  const base = String(studentDef || "")
    .trim()
    .replace(/[.!?]+$/, "");
  if (!base) return "a core concept from this unit";
  const lowered = base.charAt(0).toLowerCase() + base.slice(1);
  if (!term) return lowered;
  const selfRef = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
  return lowered.replace(selfRef, "contrasting");
}

function normalizeVocabList(vocab = [], unitTitle = "") {
  return vocab.map((item) => {
    const term = String(item?.term || "").trim();
    const tier = Number(item?.tier) === 3 ? 3 : 2;
    const studentFriendlyDef = formatStudentDef(
      item?.student_friendly_def || item?.kid_def,
      term,
      unitTitle,
    );
    const cognateEs = item?.cognate_es ? String(item.cognate_es).trim() : null;
    const cognateHint = item?.cognate_hint
      ? String(item.cognate_hint).trim()
      : cognateEs
        ? `Spanish cognate: ${cognateEs}`
        : null;

    return {
      term,
      tier,
      student_friendly_def: studentFriendlyDef,
      cognate_hint: cognateHint,
      kid_def: studentFriendlyDef,
      cognate_es: cognateEs,
    };
  });
}

function buildPublisherMeta(spec, bp) {
  const grade = String(spec.grade);
  const subject = spec.subject;
  const klu = bp?.wida_klu || "Explain";
  const gradeBand = getGradeBand(grade);

  let publisherImprint;
  let signatureProtocol;

  if (subject === "ELA") {
    if (isEarlyPrimary(grade)) {
      publisherImprint = "Great Minds · Wit & Wisdom + Fundations";
      signatureProtocol =
        klu === "Narrate" || klu === "Inform"
          ? "Fundations Phonics-to-Sentence Bridge"
          : "Language Dive & Focusing Question Task";
    } else {
      publisherImprint = "Great Minds · Wit & Wisdom";
      signatureProtocol =
        klu === "Argue"
          ? "Socratic Seminar with Evidence Frames"
          : "Language Dive & Focusing Question Task";
    }
  } else if (subject === "Math") {
    publisherImprint = "McGraw Hill · Reveal Math";
    if (klu === "Argue") {
      signatureProtocol = "MLR 1: Stronger and Clearer Each Time";
    } else if (klu === "Explain") {
      signatureProtocol = "MLR 7: Compare and Connect";
    } else {
      signatureProtocol = "MLR 6: Three Reads";
    }
  } else if (subject === "Science") {
    if (isElementaryScience(grade)) {
      publisherImprint = "BCPSS · SABES 5E Science";
      signatureProtocol = "5E Explore–Explain Science Talk";
    } else {
      publisherImprint = "Activate Learning · IQWST";
      signatureProtocol = "Driving Question Board & CER (Claim-Evidence-Reasoning)";
    }
  } else {
    publisherImprint = isEarlyPrimary(grade)
      ? "Studies Weekly · Social Studies"
      : "BCPSS · Social Studies";
    signatureProtocol = "Primary Source Corroboration & Civic Discussion";
  }

  return {
    publisher_imprint: publisherImprint,
    grade_band: gradeBand,
    signature_protocol: signatureProtocol,
  };
}

function getEvidencePhrase(subject, gradeBand) {
  if (subject === "Math") {
    if (gradeBand === "K–2") return "our visual model";
    if (gradeBand === "3–5") return "the mathematical model";
    return "our quantitative model";
  }
  if (subject === "Science") {
    if (gradeBand === "K–2") return "our class observation";
    if (gradeBand === "3–5") return "the 5E investigation data";
    return "our IQWST investigation data";
  }
  if (subject === "Social Studies") {
    if (gradeBand === "K–2") return "our class map and story";
    if (gradeBand === "3–5") return "the primary source";
    return "the corroborated primary sources";
  }
  if (gradeBand === "K–2") return "our read-aloud text";
  if (gradeBand === "3–5") return "the Wit & Wisdom anchor text";
  return "the anchor texts";
}

function getDisciplinaryRoleNoun(subject) {
  if (subject === "Math") return "problem-solvers";
  if (subject === "Science") return "investigators";
  if (subject === "Social Studies") return "historians";
  return "readers";
}

function buildMentorSentenceUnpacking(spec, normalizedVocab, bp, publisherMeta) {
  const title = String(spec.unit_title || "").trim();
  const band = publisherMeta.grade_band;
  const ev = getEvidencePhrase(spec.subject, band);
  const roleNoun = getDisciplinaryRoleNoun(spec.subject);
  const t1 = normalizedVocab[0]?.term || "key idea";
  const t2 = normalizedVocab[1]?.term || "evidence";
  const t3 = normalizedVocab[2]?.term || t1;
  const qPrefix =
    band === "K–2"
      ? "Talk with your partner:"
      : band === "3–5"
        ? "Unpack this chunk:"
        : "Analyze the syntax:";

  let chunks;

  switch (spec.blueprint_id) {
    case "argue-claim-evidence":
      chunks = [
        {
          text: `According to ${ev} in ${title},`,
          role: "Evidence Source",
          color_token: "evidence",
          student_question: `${qPrefix} What exact source or model anchors this claim?`,
        },
        {
          text: `understanding ${t1} is essential`,
          role: "Core Claim",
          color_token: "concept",
          student_question: `${qPrefix} What claim is the speaker making about "${t1}"?`,
        },
        {
          text: "because it directly supports",
          role: "Evidence Connector",
          color_token: "connector",
          student_question: `${qPrefix} Which connector signals that proof is coming next?`,
        },
        {
          text: `how ${t2} connects to ${t3}.`,
          role: "Precision Reasoning",
          color_token: "precision",
          student_question: `${qPrefix} How do "${t2}" and "${t3}" make the reasoning stronger?`,
        },
      ];
      break;

    case "argue-justify-solution":
      chunks = [
        {
          text: `In ${title}, starting with ${t1}`,
          role: "Strategy Choice",
          color_token: "concept",
          student_question: `${qPrefix} Which strategy or concept does the speaker choose first?`,
        },
        {
          text: "is a valid approach because",
          role: "Justification Connector",
          color_token: "connector",
          student_question: `${qPrefix} What phrase signals that a justification follows?`,
        },
        {
          text: `${ev} shows how ${t2}`,
          role: "Visual/Data Verification",
          color_token: "evidence",
          student_question: `${qPrefix} Where on ${ev} can we see "${t2}"?`,
        },
        {
          text: `confirms our reasoning about ${t3}.`,
          role: "Logical Conclusion",
          color_token: "precision",
          student_question: `${qPrefix} How does "${t3}" verify that the solution makes sense?`,
        },
      ];
      break;

    case "argue-counterclaim-rebuttal":
      chunks = [
        {
          text: `Although some ${roleNoun} focus only on ${t1} in ${title},`,
          role: "Concession Clause",
          color_token: "concept",
          student_question: `${qPrefix} What competing idea does the word "Although" introduce?`,
        },
        {
          text: "a closer look reveals—however—that",
          role: "Rebuttal Pivot",
          color_token: "connector",
          student_question: `${qPrefix} How does "however" signal a shift back to the stronger claim?`,
        },
        {
          text: `${ev} highlights ${t2}`,
          role: "Counter-Evidence",
          color_token: "evidence",
          student_question: `${qPrefix} What evidence from ${ev} challenges the first viewpoint?`,
        },
        {
          text: `and proves why ${t3} carries more weight.`,
          role: "Precision Rebuttal",
          color_token: "precision",
          student_question: `${qPrefix} Why does naming "${t3}" make the rebuttal more convincing?`,
        },
      ];
      break;

    case "explain-cause-effect":
      chunks = [
        {
          text: `In ${title}, when we examine ${t1},`,
          role: "Cause Condition",
          color_token: "connector",
          student_question: `${qPrefix} What triggering condition does the word "when" set up?`,
        },
        {
          text: `it leads to a clear change involving ${t2}`,
          role: "Causal Mechanism",
          color_token: "concept",
          student_question: `${qPrefix} Which verb phrase links "${t1}" to "${t2}" as cause and effect?`,
        },
        {
          text: `that we can verify using ${ev}`,
          role: "Observable Proof",
          color_token: "evidence",
          student_question: `${qPrefix} How does ${ev} let us observe this effect?`,
        },
        {
          text: `as a result of ${t3}.`,
          role: "Precision Outcome",
          color_token: "precision",
          student_question: `${qPrefix} What does "as a result of" tell us about "${t3}"?`,
        },
      ];
      break;

    case "explain-proportional-reasoning":
      chunks = [
        {
          text: `In ${title}, as ${t1} scales across ${ev},`,
          role: "Covarying Quantity",
          color_token: "evidence",
          student_question: `${qPrefix} What quantity is changing on ${ev}?`,
        },
        {
          text: "the relationship stays consistent because",
          role: "Proportional Linker",
          color_token: "connector",
          student_question: `${qPrefix} Why does the sentence say the relationship "stays consistent"?`,
        },
        {
          text: `each step connects ${t2}`,
          role: "Core Concept",
          color_token: "concept",
          student_question: `${qPrefix} How does "${t2}" behave at every step of the model?`,
        },
        {
          text: `to ${t3} in a predictable pattern.`,
          role: "Precision Generalization",
          color_token: "precision",
          student_question: `${qPrefix} How does linking "${t2}" and "${t3}" help us predict new values?`,
        },
      ];
      break;

    case "explain-process-system":
      chunks = [
        {
          text: `First, in ${title}, ${ev} introduces ${t1};`,
          role: "Initial Stage",
          color_token: "evidence",
          student_question: `${qPrefix} What happens in the first stage of this process?`,
        },
        {
          text: `next, that step connects directly to ${t2}`,
          role: "Process Sequence",
          color_token: "connector",
          student_question: `${qPrefix} Which transition word moves the system from "${t1}" to "${t2}"?`,
        },
        {
          text: "so that every part works together",
          role: "System Relationship",
          color_token: "concept",
          student_question: `${qPrefix} What does "so that" explain about how the parts interact?`,
        },
        {
          text: `to complete the full cycle of ${t3}.`,
          role: "Precision Outcome",
          color_token: "precision",
          student_question: `${qPrefix} Why is "${t3}" essential to finishing the explanation?`,
        },
      ];
      break;

    case "inform-compare-contrast":
      chunks = [
        {
          text: `In ${title}, both ${t1} and ${t2}`,
          role: "Shared Attributes",
          color_token: "concept",
          student_question: `${qPrefix} Which two unit concepts are being compared?`,
        },
        {
          text: `appear clearly in ${ev},`,
          role: "Text/Model Evidence",
          color_token: "evidence",
          student_question: `${qPrefix} Where in ${ev} can we point to both ideas?`,
        },
        {
          text: "whereas",
          role: "Contrast Connector",
          color_token: "connector",
          student_question: `${qPrefix} How does the word "whereas" signal a difference?`,
        },
        {
          text: `examining ${t3} shows what sets each example apart.`,
          role: "Precision Distinction",
          color_token: "precision",
          student_question: `${qPrefix} How does "${t3}" sharpen the contrast between the two examples?`,
        },
      ];
      break;

    case "inform-classify-define":
      chunks = [
        {
          text: `In ${title}, we can classify ${t1}`,
          role: "Target Concept",
          color_token: "concept",
          student_question: `${qPrefix} What key concept is being defined or sorted?`,
        },
        {
          text: "by its defining features because",
          role: "Classification Linker",
          color_token: "connector",
          student_question: `${qPrefix} What phrase tells us we must name specific attributes?`,
        },
        {
          text: `${ev} pairs it with ${t2}`,
          role: "Observational Evidence",
          color_token: "evidence",
          student_question: `${qPrefix} What detail in ${ev} connects "${t1}" and "${t2}"?`,
        },
        {
          text: `to distinguish it clearly from ${t3}.`,
          role: "Precision Boundary",
          color_token: "precision",
          student_question: `${qPrefix} How does naming "${t3}" clarify what belongs in this category?`,
        },
      ];
      break;

    case "inform-summarize-main-idea":
      chunks = [
        {
          text: `The central idea of ${title} centers on ${t1},`,
          role: "Central Idea",
          color_token: "concept",
          student_question: `${qPrefix} What big idea does this opening clause name?`,
        },
        {
          text: "which is developed across",
          role: "Elaboration Connector",
          color_token: "connector",
          student_question: `${qPrefix} How does "which is developed across" link the main idea to details?`,
        },
        {
          text: `${ev} through key details about ${t2}`,
          role: "Supporting Details",
          color_token: "evidence",
          student_question: `${qPrefix} What specific details about "${t2}" back up the central idea?`,
        },
        {
          text: `and clear examples of ${t3}.`,
          role: "Precision Synthesis",
          color_token: "precision",
          student_question: `${qPrefix} Why does adding "${t3}" make the summary complete?`,
        },
      ];
      break;

    case "narrate-sequence-events":
      chunks = [
        {
          text: `At the beginning of ${title}, ${ev} introduces ${t1};`,
          role: "Opening Event",
          color_token: "evidence",
          student_question: `${qPrefix} What time marker starts the sequence of events?`,
        },
        {
          text: `later, a turning point involving ${t2}`,
          role: "Turning Point",
          color_token: "concept",
          student_question: `${qPrefix} How does "${t2}" change what happens next?`,
        },
        {
          text: "shifts the sequence so that",
          role: "Temporal Connector",
          color_token: "connector",
          student_question: `${qPrefix} Which words connect the turning point to its outcome?`,
        },
        {
          text: `we understand the lasting impact of ${t3}.`,
          role: "Precision Resolution",
          color_token: "precision",
          student_question: `${qPrefix} How does "${t3}" capture what changed by the end?`,
        },
      ];
      break;

    case "narrate-perspective-dialogue":
      chunks = [
        {
          text: `Through ${ev} in ${title},`,
          role: "Source Context",
          color_token: "evidence",
          student_question: `${qPrefix} Where do we hear or see the different voices in this unit?`,
        },
        {
          text: `distinct perspectives on ${t1} emerge`,
          role: "Voice & Perspective",
          color_token: "concept",
          student_question: `${qPrefix} Whose perspective on "${t1}" is being revealed?`,
        },
        {
          text: `as people respond to ${t2},`,
          role: "Perspective Connector",
          color_token: "connector",
          student_question: `${qPrefix} How does the word "as" connect actions to feelings or motives?`,
        },
        {
          text: `showing why ${t3} shapes their choices.`,
          role: "Precision Motivation",
          color_token: "precision",
          student_question: `${qPrefix} How does "${t3}" explain why those choices matter?`,
        },
      ];
      break;

    case "narrate-problem-resolution":
    default:
      chunks = [
        {
          text: `In ${title}, a central challenge around ${t1}`,
          role: "Problem Setup",
          color_token: "concept",
          student_question: `${qPrefix} What problem or tension drives this unit?`,
        },
        {
          text: "builds conflict until",
          role: "Turning-Point Connector",
          color_token: "connector",
          student_question: `${qPrefix} What does the connector "until" tell us is about to happen?`,
        },
        {
          text: `${ev} shows how ${t2}`,
          role: "Textual/Historical Evidence",
          color_token: "evidence",
          student_question: `${qPrefix} What moment in ${ev} reveals "${t2}"?`,
        },
        {
          text: `opens a path toward resolving ${t3}.`,
          role: "Precision Resolution",
          color_token: "precision",
          student_question: `${qPrefix} How does "${t3}" bring the conflict to a clear resolution?`,
        },
      ];
      break;
  }

  const mentorSentence = chunks.map((c) => c.text).join(" ");
  return {
    mentor_sentence: mentorSentence,
    chunks,
  };
}

function buildLessonArc(spec, normalizedVocab, bp, publisherMeta) {
  const title = String(spec.unit_title || "").trim();
  const band = publisherMeta.grade_band;
  const protocol = publisherMeta.signature_protocol;
  const klu = bp?.wida_klu || "Explain";
  const ev = getEvidencePhrase(spec.subject, band);
  const terms = normalizedVocab.map((v) => v.term);
  const t1 = terms[0] || "key term";
  const t2 = terms[1] || t1;
  const t3 = terms[2] || t2;
  const cognateEntry = normalizedVocab.find((v) => v.cognate_es);
  const cognateNote = cognateEntry
    ? `bridging the Spanish cognate "${cognateEntry.term}" / "${cognateEntry.cognate_es}"`
    : `activating oral meaning for "${t1}" and "${t2}"`;
  const isK3Ela = spec.subject === "ELA" && isEarlyPrimary(String(spec.grade));

  const launchSupport =
    band === "K–2"
      ? "picture cards, hand gestures, and choral echo"
      : band === "3–5"
        ? "a visual Notice/Wonder T-chart and bilingual cognate word wall"
        : "an annotated visual stimulus and quick-write turn-and-talk";

  const modelSupport = isK3Ela
    ? `tap Fundations letter-sound patterns in "${t1}" and "${t2}" before reading the mentor sentence chorally`
    : band === "K–2"
      ? `color-code each chunk on the board and lead a choral read with finger-tracking`
      : band === "3–5"
        ? `color-code the connector, concept, and evidence chunks so students see how ${klu} syntax works`
        : `deconstruct the clause structure and academic connectors in the mentor sentence`;

  const transferSupport =
    band === "K–2"
      ? `draw or point to ${ev} and orally share or write 1–2 sentences using "${t1}" and "${t2}"`
      : band === "3–5"
        ? `write a 2–3 sentence structured response citing ${ev} and integrating "${t1}", "${t2}", and "${t3}"`
        : `compose a 2–4 sentence academic justification citing ${ev} and weaving in "${t1}", "${t2}", and "${t3}"`;

  return [
    {
      phase: "Launch",
      minutes: 5,
      focus: "Oral Activation & Notice/Wonder",
      teacher_move: `Display ${ev} from "${title}" with ${launchSupport}, ${cognateNote}, and invite one low-stakes Notice/Wonder share before introducing the unit frame.`,
      student_move: `Observe ${ev}, orally rehearse "${t1}" and "${t2}" with a partner, and share one "I notice..." or "I wonder..." idea in English or Spanish.`,
    },
    {
      phase: "Model",
      minutes: 10,
      focus: "Mentor Sentence Language Dive",
      teacher_move: `Project the "${title}" mentor sentence, ${modelSupport}, and ask the chunk questions aloud to unpack how "${t1}" and "${t2}" carry meaning.`,
      student_move: `Read each color-coded chunk aloud, answer the Language Dive questions with a partner, and underline the ${klu} connector.`,
    },
    {
      phase: "Guided Discourse",
      minutes: 15,
      focus: protocol,
      teacher_move: `Facilitate ${protocol} for "${title}" using the WIDA ${klu} sentence frame ("${spec.unit_example_frame}"), circulating to prompt "${t1}", "${t2}", and "${t3}" during A/B partner turns.`,
      student_move: `Take turns in Role A and Role B during ${protocol}, pointing to ${ev} and revising oral explanations using at least two unit terms (${t1}, ${t2}).`,
    },
    {
      phase: "Independent Transfer",
      minutes: 10,
      focus: "Written/Oral Synthesis & Exit Ticket",
      teacher_move: `Launch the "${title}" Language Exit Ticket with WIDA 1–2, 3–4, and 5–6 scaffolds visible, and formatively check for accurate ${klu} connectors and vocabulary.`,
      student_move: `Independently ${transferSupport}, then self-check against the unit look-fors.`,
    },
  ];
}

function buildInteractiveClozeItems(spec, normalizedVocab, publisherMeta) {
  const title = String(spec.unit_title || "").trim();
  const ev = getEvidencePhrase(spec.subject, publisherMeta.grade_band);
  const protocol = publisherMeta.signature_protocol;
  const allUnitTerms = normalizedVocab.map((v) => v.term);
  const fallbackPool = SUBJECT_DISTRACTOR_FALLBACKS[spec.subject] || SUBJECT_DISTRACTOR_FALLBACKS.ELA;

  return normalizedVocab.map((entry, idx) => {
    const answer = entry.term;
    const inlineDef = toInlineDef(entry.student_friendly_def, answer);
    const otherTerm = allUnitTerms.find((t) => t !== answer) || title;

    let sentenceWithBlank;
    if (idx === 0) {
      sentenceWithBlank = `In "${title}", the key academic term _____ describes ${inlineDef}.`;
    } else if (idx === 1) {
      sentenceWithBlank = `When examining ${ev} for "${title}", students use _____—meaning ${inlineDef}—to explain their thinking clearly.`;
    } else if (idx === 2) {
      sentenceWithBlank = `During ${protocol} in "${title}", partners connected "${otherTerm}" to _____ (${inlineDef}).`;
    } else {
      sentenceWithBlank = `To make our "${title}" synthesis precise, we include _____ to show ${inlineDef}.`;
    }

    const hint = entry.cognate_es
      ? `Spanish cognate: ${entry.cognate_es} — ${entry.student_friendly_def}`
      : `Meaning clue: ${entry.student_friendly_def}`;

    const distractors = [];
    for (const candidate of [...allUnitTerms, ...fallbackPool]) {
      if (candidate.toLowerCase() === answer.toLowerCase()) continue;
      if (distractors.some((d) => d.toLowerCase() === candidate.toLowerCase())) continue;
      distractors.push(candidate);
      if (distractors.length === 3) break;
    }

    return {
      sentence_with_blank: sentenceWithBlank,
      answer,
      hint,
      distractor_pool: distractors,
    };
  });
}

function buildPartnerTalkProtocol(spec, normalizedVocab, bp, publisherMeta) {
  const title = String(spec.unit_title || "").trim();
  const band = publisherMeta.grade_band;
  const protocol = publisherMeta.signature_protocol;
  const ev = getEvidencePhrase(spec.subject, band);
  const moveName = bp?.move_name || bp?.wida_klu || "Explain";
  const t1 = normalizedVocab[0]?.term || "key idea";
  const t2 = normalizedVocab[1]?.term || t1;

  let roleATitle;
  let roleBTitle;
  if (spec.subject === "Math") {
    roleATitle = "Strategy Explainer (Partner A)";
    roleBTitle = "Model Connector & Verifier (Partner B)";
  } else if (spec.subject === "Science") {
    roleATitle = "Claim & Evidence Speaker (Partner A)";
    roleBTitle = "Reasoning & Data Questioner (Partner B)";
  } else if (spec.subject === "Social Studies") {
    roleATitle = "Primary Source Analyst (Partner A)";
    roleBTitle = "Corroborator & Synthesizer (Partner B)";
  } else {
    roleATitle = "Text Evidence Speaker (Partner A)";
    roleBTitle = "Language & Meaning Builder (Partner B)";
  }

  const roleAPrompt = `Point to ${ev} from "${title}" and complete the ${moveName} frame aloud using "${t1}" and "${t2}".`;
  const roleBPrompt = `Listen closely to Partner A, paraphrase their point about "${t1}", and press for one more detail from ${ev} before switching roles.`;

  let talkMoves;
  if (band === "K–2") {
    talkMoves = [
      { label: "Build On", stem: "I want to add to your idea about ___..." },
      { label: "Clarify", stem: "Can you show me where you saw ___?" },
      { label: "Cite Evidence", stem: "I know this because the picture/model shows ___." },
      { label: "Paraphrase", stem: "So you are saying that ___." },
    ];
  } else if (band === "3–5") {
    talkMoves = [
      { label: "Build On", stem: "Building on your point about ___, I also noticed ___." },
      { label: "Clarify", stem: "Could you explain how ___ connects to ___?" },
      { label: "Cite Evidence", stem: "In our text/model, the detail ___ proves that ___." },
      { label: "Paraphrase", stem: "In other words, your reasoning is that ___." },
    ];
  } else {
    talkMoves = [
      { label: "Build On", stem: "Extending your analysis of ___, another implication is ___." },
      { label: "Clarify", stem: "What evidence warrants your claim that ___ leads to ___?" },
      { label: "Cite Evidence", stem: "According to the data/source, ___ directly substantiates ___." },
      { label: "Paraphrase", stem: "To synthesize your argument, you are contending that ___." },
    ];
  }

  return {
    protocol_name: `${protocol} — Structured A/B Rehearsal`,
    role_a_title: roleATitle,
    role_a_prompt: roleAPrompt,
    role_b_title: roleBTitle,
    role_b_prompt: roleBPrompt,
    talk_moves: talkMoves,
  };
}

function buildCommonLanguageMisconception(spec, normalizedVocab, bp) {
  const title = String(spec.unit_title || "").trim();
  const klu = bp?.wida_klu || "Explain";
  const t1 = normalizedVocab[0]?.term || "the target concept";
  const t2 = normalizedVocab[1]?.term || "the supporting detail";

  if (spec.subject === "Math") {
    if (klu === "Argue") {
      return {
        misconception_pattern: `Students narrate computation steps for "${title}" without stating why "${t1}" or "${t2}" makes the strategy valid.`,
        teacher_redirect: `Prompt students to point to the model and add a "because" clause linking "${t1}" to "${t2}" rather than just reading digits aloud.`,
      };
    }
    if (klu === "Explain") {
      return {
        misconception_pattern: `Students name an answer in "${title}" but omit the relationship words showing how "${t1}" changes with "${t2}".`,
        teacher_redirect: `Have partners trace the model left-to-right and insert an explicit relational connector ("per", "for every", or "as ___ increases") between "${t1}" and "${t2}".`,
      };
    }
    return {
      misconception_pattern: `Students describe "${t1}" and "${t2}" in "${title}" using everyday informal words ("bigger", "same") instead of precise mathematical attributes.`,
      teacher_redirect: `Anchor the visual model beside the word bank and ask students to upgrade one informal word to "${t1}" or "${t2}" before sharing.`,
    };
  }

  if (spec.subject === "Science") {
    if (klu === "Argue") {
      return {
        misconception_pattern: `Students restate a claim or observation from "${title}" as if it were reasoning, skipping how "${t1}" scientifically explains "${t2}".`,
        teacher_redirect: `Ask "Why does this evidence prove your claim?" and require a reasoning bridge connecting "${t1}" to "${t2}".`,
      };
    }
    return {
      misconception_pattern: `Students list isolated facts about "${t1}" in "${title}" using "and then" instead of causal or system language linking "${t1}" to "${t2}".`,
      teacher_redirect: `Have students replace "and then" with a causal connector ("causes", "leads to", or "as a result of") while pointing to the diagram.`,
    };
  }

  if (spec.subject === "Social Studies") {
    if (klu === "Argue") {
      return {
        misconception_pattern: `Students state a personal opinion about "${title}" without attributing evidence to a source or connecting "${t1}" to "${t2}".`,
        teacher_redirect: `Require an attribution opener ("According to the source...") that ties "${t1}" directly to a concrete historical detail about "${t2}".`,
      };
    }
    return {
      misconception_pattern: `Students retell events in "${title}" as a flat timeline without signaling cause, perspective, or contrast between "${t1}" and "${t2}".`,
      teacher_redirect: `Prompt students to choose one discourse connector ("because", "whereas", or "as a result") to show how "${t1}" shaped "${t2}".`,
    };
  }

  // ELA
  if (klu === "Argue") {
    return {
      misconception_pattern: `Students drop a quote or story detail from "${title}" without explaining how it supports their claim about "${t1}" and "${t2}".`,
      teacher_redirect: `Have students follow every text detail with "This shows that..." to connect the evidence directly back to "${t1}".`,
    };
  }
  if (klu === "Narrate") {
    return {
      misconception_pattern: `Students string together events from "${title}" with repetitive "and then" clauses, blurring how "${t1}" triggers "${t2}".`,
      teacher_redirect: `Ask students to swap one "and then" for a precise sequence or turning-point connector ("at first", "until", or "as a result") anchored to "${t1}".`,
    };
  }
  return {
    misconception_pattern: `Students copy isolated details from "${title}" instead of synthesizing how "${t1}" and "${t2}" develop the central idea or comparison.`,
    teacher_redirect: `Model pairing one high-leverage connector ("both... whereas..." or "centers on... through...") with "${t1}" and "${t2}" during oral rehearsal.`,
  };
}

function buildDefaultEssentialQuestion(spec, normalizedVocab) {
  if (spec.essential_question && String(spec.essential_question).trim()) {
    return String(spec.essential_question).trim();
  }
  const title = String(spec.unit_title || "").trim();
  if (title.endsWith("?")) {
    return title;
  }
  const band = getGradeBand(String(spec.grade));
  const firstTerm = normalizedVocab[0]?.term || "key concepts";
  const secondTerm = normalizedVocab[1]?.term || "evidence";

  if (spec.subject === "Math") {
    if (band === "K–2") {
      return `How can we use ${firstTerm} and visual models to solve problems in ${title}?`;
    }
    if (band === "3–5") {
      return `How do ${firstTerm} and ${secondTerm} help us represent and justify solutions in ${title}?`;
    }
    return `How can we use ${firstTerm}, ${secondTerm}, and mathematical models to reason about ${title}?`;
  }

  if (spec.subject === "Science") {
    if (band === "K–2") {
      return `What can we observe in ${title}, and how does ${firstTerm} help explain what happens?`;
    }
    if (band === "3–5") {
      return `How do observations and models of ${firstTerm} explain patterns in ${title}?`;
    }
    return `How do evidence and scientific models of ${firstTerm} and ${secondTerm} explain ${title}?`;
  }

  if (spec.subject === "Social Studies") {
    if (band === "K–2") {
      return `How do ${firstTerm} and ${secondTerm} help people live and work together in ${title}?`;
    }
    if (band === "3–5") {
      return `How did ${firstTerm} and ${secondTerm} shape communities and decisions in ${title}?`;
    }
    return `How did ${firstTerm}, ${secondTerm}, and historical choices shape societies in ${title}?`;
  }

  // ELA
  if (band === "K–2") {
    return `What can we learn from texts about ${title}, and how can we share our ideas clearly?`;
  }
  if (band === "3–5") {
    return `How do authors use details, ${firstTerm}, and ${secondTerm} to deepen our understanding of ${title}?`;
  }
  return `How do texts and perspectives on ${title} reveal ideas about ${firstTerm} and ${secondTerm}?`;
}

function buildDefaultL1Watchouts(spec, normalizedVocab) {
  const { grade, subject, blueprint_id, unit_title } = spec;
  const bp = BLUEPRINT_BY_ID.get(blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const firstTerm = normalizedVocab[0]?.term || unit_title;
  const secondTerm = normalizedVocab[1]?.term || firstTerm;
  const cognateEntries = normalizedVocab.filter((v) => v.cognate_es);
  const cognateLabel = cognateEntries.length
    ? cognateEntries
        .slice(0, 2)
        .map((v) => `"${v.term}" / "${v.cognate_es}"`)
        .join(" and ")
    : `terms like "${firstTerm}" and "${secondTerm}"`;
  const isK3Ela = subject === "ELA" && isEarlyPrimary(String(grade));

  let cognateFriction;
  let cognateFix;
  let syntaxFriction;
  let syntaxFix;

  if (subject === "Math") {
    cognateFriction = `Spanish–English math terms share strong Latin roots (${cognateLabel}), yet false friends (e.g., "billion" vs. "billón") and Spanish decimal/comma punctuation conventions can cause confusion in "${unit_title}".`;
    cognateFix = `Post a side-by-side EN/ES cognate anchor for ${cognateLabel} and explicitly contrast English decimal points and place-value commas on the worked model.`;
    syntaxFriction = `English math prepositions ("by", "per", "for every", "than") often collapse into Spanish "por/para" or "que", obscuring quantitative relationships when expressing "${firstTerm}" and "${secondTerm}".`;
    syntaxFix = `Color-code English prepositions directly on the visual model and orally rehearse the ${klu} sentence frame in pairs before independent problem-solving.`;
  } else if (subject === "Science") {
    cognateFriction = `High-utility science cognates (${cognateLabel}) accelerate comprehension in "${unit_title}", but everyday Spanish meanings can differ from precise Tier 3 scientific definitions.`;
    cognateFix = `Pair each EN/ES cognate (${cognateLabel}) with a labeled investigation diagram so students connect the Spanish root to the exact scientific phenomenon.`;
    syntaxFriction = `Spanish frequently omits dummy subject pronouns ("it") and uses reflexive constructions ("se calienta") where English ${klu} science clauses require explicit subjects and causal connectors around "${firstTerm}".`;
    syntaxFix = `Have students underline the explicit subject ("It / The ${firstTerm}") and bold causal connector in the mentor sentence before writing their ${klu} explanation.`;
  } else if (isK3Ela) {
    cognateFriction = `Spanish–English cognates (${cognateLabel}) unlock story meaning in "${unit_title}", while false friends (such as "library" vs. "librería") and multisyllabic academic words need explicit visual clarification.`;
    cognateFix = `Build a picture-supported EN/ES word wall highlighting ${cognateLabel} and invite students to share what they already know about "${firstTerm}" in Spanish first.`;
    syntaxFriction = `Spanish uses five pure vowels and noun-before-adjective order, creating transfer friction with Fundations short-vowel contrasts (/a/ vs. /u/, /i/ vs. /e/), consonant digraphs (sh, ch, th, wh), and auxiliary "do/did" in "${unit_title}".`;
    syntaxFix = `Tap out Fundations short vowels and digraphs on "${firstTerm}", choral-read the ${klu} frame, and model English adjective-before-noun order during partner talk.`;
  } else {
    cognateFriction = `Academic cognates (${cognateLabel}) give Spanish-speaking students immediate entry into "${unit_title}", though nuanced register shifts and false friends require explicit context checks.`;
    cognateFix = `Spotlight ${cognateLabel} on an EN/ES anchor chart and ask partners to verify each term's unit-specific meaning inside the mentor sentence.`;
    syntaxFriction = `Spanish places adjectives after nouns, drops subject pronouns, and forms questions without auxiliary "do/did", which can disrupt complex English ${klu} clauses when analyzing "${firstTerm}" and "${secondTerm}".`;
    syntaxFix = `Color-code subject–verb–connector order inside the unit ${klu} frame and run a 60-second oral partner rehearsal before drafting.`;
  }

  return [
    {
      l1_group: "Spanish · Cognates & False Friends",
      friction_point: cognateFriction,
      quick_fix: cognateFix,
    },
    {
      l1_group: "Spanish · Syntax & Phonics Transfer",
      friction_point: syntaxFriction,
      quick_fix: syntaxFix,
    },
  ];
}

function getSubjectEvidenceSource(subject) {
  if (subject === "Math") return "worked model, diagram, or calculation";
  if (subject === "Science") return "investigation data, model, or observation";
  if (subject === "Social Studies") return "map, timeline, or primary source";
  return "text detail or quotation";
}

function buildDefaultExitTicket(spec, normalizedVocab) {
  const bp = BLUEPRINT_BY_ID.get(spec.blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const moveName = bp?.move_name || klu;
  const band = getGradeBand(String(spec.grade));
  const requiredVocab = normalizedVocab.slice(0, 3).map((v) => v.term);
  const vocabInline = requiredVocab.join(", ");
  const evidenceSource = getSubjectEvidenceSource(spec.subject);

  let prompt;
  let lookFors;
  let quickRubric;

  if (band === "K–2") {
    prompt = `Draw or point to a ${evidenceSource} from "${spec.unit_title}", then orally share (or dictate/write) 1–2 sentences using the ${moveName} frame and key words (${vocabInline}).`;
    lookFors = [
      `Uses the target ${klu} frame orally, via dictation, or in writing with a clear connector.`,
      `Includes at least 1–2 unit terms (${vocabInline}) matched to a drawing, label, or model.`,
      `Points to a specific ${evidenceSource} from "${spec.unit_title}" to support the idea.`,
    ];
    quickRubric = {
      emerging:
        "Points to a drawing or model and uses 1 unit term with a WIDA 1–2 oral starter or teacher dictation.",
      developing: `Completes the target frame orally or in writing with 2 unit terms and a clear ${klu} connector.`,
      proficient: `Shares or writes 2 connected sentences using precise Tier 2/3 vocabulary and a specific ${evidenceSource}.`,
    };
  } else if (band === "3–5") {
    prompt = `Write a structured paragraph (2–3 sentences) about "${spec.unit_title}" using the ${moveName} frame, at least two unit terms (${vocabInline}), and a specific ${evidenceSource}.`;
    lookFors = [
      `Connects ideas accurately using the target ${klu} syntax pattern.`,
      `Integrates at least two Tier 2/Tier 3 terms (${vocabInline}) in context.`,
      `Cites a concrete ${evidenceSource} from "${spec.unit_title}".`,
    ];
    quickRubric = {
      emerging:
        "Uses 1 unit term with a provided WIDA 1–2 starter or labeled visual/model.",
      developing: `Completes the target frame with 2 unit terms and a clear ${klu} connector.`,
      proficient: `Produces a cohesive 2–3 sentence academic paragraph using precise Tier 2/3 vocabulary and ${evidenceSource} evidence.`,
    };
  } else {
    prompt = `Compose an academic justification (2–4 sentences) for "${spec.unit_title}" using the ${moveName} frame, at least two unit terms (${vocabInline}), and cited ${evidenceSource}.`;
    lookFors = [
      `Constructs a complex ${klu} clause using precise academic connectors.`,
      `Applies at least two Tier 2/Tier 3 terms (${vocabInline}) accurately to justify reasoning.`,
      `Cites and warrants specific ${evidenceSource} from "${spec.unit_title}".`,
    ];
    quickRubric = {
      emerging:
        "Uses 1 unit term with a provided WIDA 1–2 starter or labeled visual/model.",
      developing: `Completes the target frame with 2 unit terms, a clear ${klu} connector, and 1 piece of evidence.`,
      proficient: `Produces 2–4 connected academic sentences justifying thinking with precise Tier 2/3 vocabulary and warranted ${evidenceSource}.`,
    };
  }

  return {
    wida_klu: klu,
    blueprint_id: spec.blueprint_id,
    prompt,
    target_frame: spec.unit_example_frame,
    required_vocab: requiredVocab,
    look_fors: lookFors,
    quick_rubric: quickRubric,
  };
}

export function buildUnitsAndConnections(specs) {
  const units = [];
  const connections = [];

  for (const spec of specs) {
    const curriculumName =
      spec.curriculum_name || CURRICULUM_BY_GRADE_SUBJECT[spec.grade]?.[spec.subject];
    if (!curriculumName) {
      throw new Error(`Missing curriculum mapping for Grade ${spec.grade} ${spec.subject}`);
    }
    const bp = BLUEPRINT_BY_ID.get(spec.blueprint_id);
    if (!bp) {
      throw new Error(`Unknown blueprint_id "${spec.blueprint_id}" on unit "${spec.id}"`);
    }

    const normalizedVocab = normalizeVocabList(spec.vocab, spec.unit_title);
    const essentialQuestion = buildDefaultEssentialQuestion(spec, normalizedVocab);
    const publisherMeta = spec.publisher_meta || buildPublisherMeta(spec, bp);
    const mentorSentenceUnpacking =
      spec.mentor_sentence_unpacking ||
      buildMentorSentenceUnpacking(spec, normalizedVocab, bp, publisherMeta);
    const lessonArc =
      spec.lesson_arc || buildLessonArc(spec, normalizedVocab, bp, publisherMeta);
    const interactiveClozeItems =
      spec.interactive_cloze_items ||
      buildInteractiveClozeItems(spec, normalizedVocab, publisherMeta);
    const partnerTalkProtocol =
      spec.partner_talk_protocol ||
      buildPartnerTalkProtocol(spec, normalizedVocab, bp, publisherMeta);
    const commonLanguageMisconception =
      spec.common_language_misconception ||
      buildCommonLanguageMisconception(spec, normalizedVocab, bp);

    units.push({
      id: spec.id,
      grade: String(spec.grade),
      subject: spec.subject,
      curriculum_name: curriculumName,
      unit_number: Number(spec.unit_number),
      unit_title: spec.unit_title,
      unit_summary: spec.unit_summary,
      essential_question: essentialQuestion,
      core_standards: spec.core_standards,
      external_content_lab_url: spec.external_content_lab_url ?? null,
      external_content_lab_label: spec.external_content_lab_label ?? null,
      publisher_meta: publisherMeta,
    });

    connections.push({
      id: `conn-${spec.id}`,
      unit_id: spec.id,
      blueprint_id: spec.blueprint_id,
      unit_example_frame: spec.unit_example_frame,
      cross_subject_bridge_note: spec.cross_subject_bridge_note,
      l1_watchouts: spec.l1_watchouts || buildDefaultL1Watchouts(spec, normalizedVocab),
      tier2_tier3_vocab: normalizedVocab,
      language_exit_ticket_json:
        spec.exit_ticket || buildDefaultExitTicket(spec, normalizedVocab),
      mentor_sentence_unpacking: mentorSentenceUnpacking,
      lesson_arc: lessonArc,
      interactive_cloze_items: interactiveClozeItems,
      partner_talk_protocol: partnerTalkProtocol,
      common_language_misconception: commonLanguageMisconception,
    });
  }

  return { units, connections };
}

function getDisciplineVisualArtifact(subject, grade) {
  if (subject === "Math") {
    return {
      artifactName: "tape diagram, number line, or equation model",
      materials: [
        "Worked Math Model (Tape Diagram / Equation Sheet)",
        "Dry-Erase Boards or Annotation Highlighters",
        "WIDA Desk Strip",
      ],
      actionVerb: "trace and annotate the mathematical model",
    };
  }
  if (subject === "Science") {
    const program = isElementaryScience(String(grade)) ? "SABES 5E" : "IQWST";
    return {
      artifactName: `${program} investigation data table or phenomenon diagram`,
      materials: [
        `${program} Investigation Data Table / Phenomenon Model`,
        "CER (Claim–Evidence–Reasoning) Organizer",
        "WIDA Desk Strip",
      ],
      actionVerb: `interpret the ${program} data and phenomenon model`,
    };
  }
  if (subject === "Social Studies") {
    return {
      artifactName: "primary source excerpt, map, or timeline",
      materials: [
        "Primary Source Excerpt, Map, or Timeline",
        "Source Corroboration Graphic Organizer",
        "WIDA Desk Strip",
      ],
      actionVerb: "corroborate evidence from the primary source or map",
    };
  }
  return {
    artifactName: "Wit & Wisdom anchor text excerpt and evidence chart",
    materials: [
      "Wit & Wisdom Anchor Text Excerpt",
      "Text Evidence & Syntax Annotation Chart",
      "WIDA Desk Strip",
    ],
    actionVerb: "cite and unpack key lines from the anchor text",
  };
}

export function buildActivitiesForSubject(units, connections) {
  const connByUnit = new Map(connections.map((c) => [c.unit_id, c]));
  const activities = [];

  for (const unit of units) {
    const conn = connByUnit.get(unit.id);
    if (!conn) {
      throw new Error(`Missing unit_connection for unit ${unit.id}`);
    }
    const bp = BLUEPRINT_BY_ID.get(conn.blueprint_id);
    const klu = bp?.wida_klu || "Explain";
    const moveName = bp?.move_name || klu;
    const band = unit.publisher_meta?.grade_band || getGradeBand(String(unit.grade));
    const protocol = unit.publisher_meta?.signature_protocol || "Language Dive";
    const ev = getEvidencePhrase(unit.subject, band);
    const isK3Ela = unit.subject === "ELA" && isEarlyPrimary(String(unit.grade));

    const vocabEntries = Array.isArray(conn.tier2_tier3_vocab) ? conn.tier2_tier3_vocab : [];
    const vocabList = vocabEntries.map((v) => v.term).filter(Boolean);
    const t1 = vocabList[0] || "key idea";
    const t2 = vocabList[1] || t1;
    const t3 = vocabList[2] || t2;
    const keyTerms = vocabList.slice(0, 3).join(", ");
    const firstVocab = vocabEntries[0] || null;
    const secondVocab = vocabEntries[1] || firstVocab;

    const cognateEntries = vocabEntries.filter((v) => v.cognate_es);
    const cognateTerms = cognateEntries
      .slice(0, 2)
      .map((v) => `${v.term} (${v.cognate_es})`)
      .join(" and ");
    const primaryCognate = cognateEntries[0] || null;

    const mentorUnpacking = conn.mentor_sentence_unpacking || {};
    const mentorSentence =
      mentorUnpacking.mentor_sentence ||
      `In ${unit.unit_title}, ${ev} shows how ${t1} connects to ${t2} and ${t3}.`;
    const connectorChunk =
      (mentorUnpacking.chunks || []).find((ch) => ch.color_token === "connector")?.text ||
      "because";

    const pt = conn.partner_talk_protocol || {
      protocol_name: `${protocol} — Structured A/B Rehearsal`,
      role_a_title: "Idea Explainer (Partner A)",
      role_a_prompt: `Point to ${ev} and share your explanation of "${unit.unit_title}" using "${t1}" and "${t2}".`,
      role_b_title: "Evidence Questioner (Partner B)",
      role_b_prompt: `Paraphrase Partner A's point about "${t1}" and ask for one more detail from ${ev}.`,
      talk_moves: [
        { label: "Build On", stem: "Building on your idea about ___, I also noticed ___." },
        { label: "Clarify", stem: "Can you explain how ___ connects to ___?" },
        { label: "Cite Evidence", stem: "In our model/text, ___ shows that ___." },
        { label: "Paraphrase", stem: "So you are saying that ___." },
      ],
    };
    const talkMove1 = pt.talk_moves?.[0] || { label: "Build On", stem: "I want to add ___." };
    const talkMove2 = pt.talk_moves?.[2] || { label: "Cite Evidence", stem: "The evidence shows ___." };
    const talkMoveLabels = (pt.talk_moves || []).map((m) => m.label).join(", ");

    const et = conn.language_exit_ticket_json || {};
    const etPrompt =
      et.prompt ||
      `Write 2–3 sentences about "${unit.unit_title}" using the ${moveName} frame and key terms (${keyTerms}).`;
    const etFrame = et.target_frame || conn.unit_example_frame;
    const etVocab = Array.isArray(et.required_vocab) && et.required_vocab.length
      ? et.required_vocab.join(", ")
      : keyTerms;
    const etLookFors =
      Array.isArray(et.look_fors) && et.look_fors.length
        ? et.look_fors
        : [
            `Uses the target ${klu} connector accurately.`,
            `Includes at least two unit terms (${etVocab}).`,
            `Cites specific evidence from "${unit.unit_title}".`,
          ];
    const etRubric = et.quick_rubric || {
      emerging: `Uses 1 unit term (${t1}) with a WIDA 1–2 starter or labeled visual.`,
      developing: `Completes the target ${klu} frame with 2 unit terms (${t1}, ${t2}).`,
      proficient: `Produces a cohesive ${klu} response integrating ${keyTerms} with concrete evidence.`,
    };

    const visualMeta = getDisciplineVisualArtifact(unit.subject, unit.grade);

    // -----------------------------------------------------------------------
    // Order 1 — Sentence Architect (Day 1 · Syntax & Frame Launch)
    // -----------------------------------------------------------------------
    const day1StudentPrompt =
      band === "K–2"
        ? `Say and write (or draw and label) 1 sentence about "${unit.unit_title}" using the frame "${conn.unit_example_frame}" and at least one word from: ${keyTerms}.`
        : band === "3–5"
          ? `Use the Sentence Architect frame ("${conn.unit_example_frame}") to draft 1–2 complete ${klu} sentences about "${unit.unit_title}" that include "${t1}" and "${t2}".`
          : `Analyze the connector "${connectorChunk}" in the mentor sentence, then draft 2 academic ${klu} sentences about "${unit.unit_title}" using "${conn.unit_example_frame}" and at least two terms from: ${keyTerms}.`;

    activities.push({
      id: `act-${unit.id}-1`,
      unit_id: unit.id,
      activity_order: 1,
      day_label: "Day 1 · Syntax & Frame Launch",
      domain: "Writing",
      grouping: "Whole Group → Partners",
      duration_minutes: 10,
      prep_time_minutes: 3,
      activity_type: "Sentence Architect",
      title: `Sentence Architect: ${unit.unit_title}`,
      materials: [
        "Projected Mentor Sentence",
        "WIDA Desk Strip",
        "Student Writing Notebook or Device",
      ],
      teacher_instructions: `1. Read aloud the "${unit.unit_title}" mentor sentence ("${mentorSentence}") and unpack how the ${klu} connector ("${connectorChunk}") links ideas. 2. Co-construct one class example on the board using the unit frame ("${conn.unit_example_frame}") and target vocabulary (${keyTerms}). 3. Have students draft ${band === "K–2" ? "1 sentence (or oral/dictated sentence)" : "1–2 sentences"} in partners using their WIDA tier desk strip, then share one sentence aloud.`,
      worked_example: mentorSentence,
      student_prompt: day1StudentPrompt,
      differentiated_targets: {
        level_1_2: `Orally rehearse and complete 1 sentence about "${unit.unit_title}" using the WIDA 1–2 desk strip starter and "${t1}" paired with a visual cue.`,
        level_3_4: `Draft 1–2 complete ${klu} sentences using "${conn.unit_example_frame}", the connector "${connectorChunk}", and both "${t1}" and "${t2}".`,
        level_5_6: `Compose 2 connected academic sentences about "${unit.unit_title}" weaving in ${keyTerms} and revising with a precise ${moveName} transition.`,
      },
      check_for_understanding: `Students accurately place the ${klu} connector ("${connectorChunk}") in their drafted sentence and use at least two unit terms (${t1}, ${t2}) in context.`,
      target_lab_route: "/access-practice-lab/sentences",
    });

    // -----------------------------------------------------------------------
    // Order 2 — Cognate & Vocabulary Lab (Day 2 · Vocabulary & Cognates)
    // -----------------------------------------------------------------------
    const day2Materials = isK3Ela
      ? [
          "EN/ES Cognate & Picture Word Cards",
          "Fundations Sound Cards & Letter Tiles",
          "Unit Word Journal or Device",
        ]
      : [
          "EN/ES Cognate & Tier 2/3 Word Cards",
          "Visual Concept Anchor Chart",
          "Student Word Journal or Device",
        ];

    const phonicsClause = isK3Ela
      ? `Tap out Fundations letter-sound patterns, digraphs, and syllables in "${t1}" and "${t2}", then `
      : "";
    const cognateFocus = cognateTerms
      ? `Spanish–English cognates (${cognateTerms})`
      : `English and Spanish meaning bridges for ${keyTerms}`;

    const day2WorkedExample = primaryCognate
      ? `"${primaryCognate.term}" (Spanish cognate: "${primaryCognate.cognate_es}") means ${toInlineDef(primaryCognate.student_friendly_def, primaryCognate.term)}. In ${unit.unit_title}, knowing ${primaryCognate.term} helps us explain how ${t2} works in ${ev}.`
      : `"${t1}" means ${toInlineDef(firstVocab?.student_friendly_def, t1)}, and "${t2}" means ${toInlineDef(secondVocab?.student_friendly_def, t2)}. In ${unit.unit_title}, we use both terms when examining ${ev}.`;

    const day2StudentPrompt = isK3Ela
      ? `Tap the sounds in ${keyTerms} with your partner, match each word to its picture or Spanish cognate${cognateTerms ? ` (${cognateTerms})` : ""}, and say one sentence about "${unit.unit_title}".`
      : band === "K–2"
        ? `Sort the picture word cards (${keyTerms}), share any Spanish cognates${cognateTerms ? ` like ${cognateTerms}` : ""}, and tell your partner what "${t1}" means in "${unit.unit_title}".`
        : band === "3–5"
          ? `Sort ${keyTerms} into Tier 2 connectors and Tier 3 content words, highlight Spanish–English cognates${cognateTerms ? ` (${cognateTerms})` : ""}, and write a quick definition sentence for "${t1}" in "${unit.unit_title}".`
          : `Analyze roots and Spanish–English cognates for ${keyTerms}${cognateTerms ? ` (${cognateTerms})` : ""}, contrast everyday vs. academic meanings, and apply "${t1}" and "${t2}" in a context sentence for "${unit.unit_title}".`;

    activities.push({
      id: `act-${unit.id}-2`,
      unit_id: unit.id,
      activity_order: 2,
      day_label: "Day 2 · Vocabulary & Cognates",
      domain: "Vocabulary",
      grouping: "Pairs / Small Group",
      duration_minutes: 10,
      prep_time_minutes: 3,
      activity_type: "Cognate & Vocabulary Lab",
      title: `Cognate & Vocabulary Lab: ${keyTerms}`,
      materials: day2Materials,
      teacher_instructions: `1. Display ${keyTerms} from "${unit.unit_title}" and spotlight ${cognateFocus} (EN/ES). 2. ${phonicsClause}guide pairs to sort Tier 2 academic words from Tier 3 discipline terms and match each word to its student-friendly definition. 3. Have each pair orally test one word inside "${conn.unit_example_frame}" before recording a quick example in their word journal.`,
      worked_example: day2WorkedExample,
      student_prompt: day2StudentPrompt,
      differentiated_targets: {
        level_1_2: `Match "${t1}" and "${t2}" to visuals and Spanish cognates (EN/ES), then echo-read each word aloud with a partner.`,
        level_3_4: `Sort ${keyTerms} by Tier 2 vs. Tier 3, explain one Spanish–English cognate or meaning clue, and plug "${t1}" into the unit frame.`,
        level_5_6: `Explain word relationships among ${keyTerms} (including EN/ES roots or morphology) and use all three terms accurately in an original context sentence.`,
      },
      check_for_understanding: isK3Ela
        ? `Students accurately tap/decode "${t1}" and "${t2}", connect EN/ES cognates or visual meanings, and use at least one target word orally in context.`
        : `Students accurately distinguish Tier 2 vs. Tier 3 meanings for ${keyTerms}, articulate an EN/ES cognate or meaning bridge, and use "${t1}" accurately in context.`,
      target_lab_route: "/access-practice-lab/wordlab",
    });

    // -----------------------------------------------------------------------
    // Order 3 — Structured Partner Talk (Day 3 · Structured Oral Discourse)
    // -----------------------------------------------------------------------
    const day3WorkedExample = `Partner A (${pt.role_a_title}): "${mentorSentence}" Partner B (${pt.role_b_title}): "So you are explaining that ${t1} shapes ${t2} in ${unit.unit_title}. Looking closely at ${ev}, I want to build on your point by adding how ${t3} confirms our thinking."`;

    const day3StudentPrompt =
      band === "K–2"
        ? `Take turns with your partner! Partner A (${pt.role_a_title}): ${pt.role_a_prompt} Partner B (${pt.role_b_title}): ${pt.role_b_prompt} Use our talk moves (${talkMoveLabels}).`
        : band === "3–5"
          ? `Run ${pt.protocol_name} for "${unit.unit_title}". Role A (${pt.role_a_title}): ${pt.role_a_prompt} Role B (${pt.role_b_title}): ${pt.role_b_prompt} Weave in at least two talk moves (${talkMoveLabels}).`
          : `Engage in ${pt.protocol_name} about "${unit.unit_title}". Partner A (${pt.role_a_title}): ${pt.role_a_prompt} Partner B (${pt.role_b_title}): ${pt.role_b_prompt} Press each other with academic talk moves (${talkMoveLabels}).`;

    activities.push({
      id: `act-${unit.id}-3`,
      unit_id: unit.id,
      activity_order: 3,
      day_label: "Day 3 · Structured Oral Discourse",
      domain: "Speaking & Listening",
      grouping: "Partners (A/B)",
      duration_minutes: 12,
      prep_time_minutes: 2,
      activity_type: "Structured Partner Talk",
      title: `Structured Partner Talk: ${unit.unit_title}`,
      materials: [
        "A/B Partner Role Cards",
        "Academic Talk Moves Desk Tent",
        "Projected Unit Frame & Visual Anchor",
      ],
      teacher_instructions: `1. Assign Role A (${pt.role_a_title}) and Role B (${pt.role_b_title}) for ${pt.protocol_name}, and fishbowl one quick exchange using "${talkMove1.label}" and "${talkMove2.label}". 2. Run Round 1 (4 min): Partner A speaks using "${conn.unit_example_frame}" and ${keyTerms} while pointing to ${ev}; Partner B paraphrases and asks a clarifying question. 3. Switch A/B roles for Round 2 (4 min), then invite 2–3 students to report their partner's strongest idea to the whole group.`,
      worked_example: day3WorkedExample,
      student_prompt: day3StudentPrompt,
      differentiated_targets: {
        level_1_2: `Point to ${ev} and speak in Role A or B using a WIDA 1–2 sentence starter, "${t1}", and one posted talk move ("${talkMove1.label}").`,
        level_3_4: `Complete both Role A and Role B turns using "${conn.unit_example_frame}", "${t1}" and "${t2}", and at least two talk moves (${talkMove1.label}, ${talkMove2.label}).`,
        level_5_6: `Lead a multi-turn A/B exchange integrating ${keyTerms}, paraphrasing Partner B's reasoning, and extending with warranted evidence from ${ev}.`,
      },
      check_for_understanding: `Both partners complete Role A and Role B turns, use at least one posted talk move (${talkMoveLabels}), and reference ${ev} with "${t1}" or "${t2}".`,
      target_lab_route: "/access-practice-lab/speak",
    });

    // -----------------------------------------------------------------------
    // Order 4 — Visual / Model Justification (Day 4 · Model & Text Reasoning)
    // -----------------------------------------------------------------------
    const day4WorkedExample =
      unit.subject === "Math"
        ? `On ${ev} for ${unit.unit_title}, we labeled ${t1} first and matched each equal part to ${t2}. This model justifies our solution because every step stays consistent with ${t3}.`
        : unit.subject === "Science"
          ? `Our ${ev} for ${unit.unit_title} provides direct evidence of ${t1}. When we trace how ${t1} interacts with ${t2} on the diagram, the scientific reasoning clearly explains ${t3}.`
          : unit.subject === "Social Studies"
            ? `Corroborating ${ev} for ${unit.unit_title} highlights how ${t1} influenced decisions around ${t2}. Pointing to specific source details proves why ${t3} mattered to the community.`
            : `In ${ev} for ${unit.unit_title}, the author's details about ${t1} reveal a clear connection to ${t2}. Annotating this line shows how ${t3} deepens the central meaning of the text.`;

    const day4StudentPrompt =
      band === "K–2"
        ? `Look closely at the ${visualMeta.artifactName} for "${unit.unit_title}". Point to one important detail, label "${t1}", and explain your thinking to your group using "${conn.unit_example_frame}".`
        : band === "3–5"
          ? `With your small group, ${visualMeta.actionVerb} for "${unit.unit_title}". Label where you see "${t1}" and "${t2}", then write a 2-sentence justification using "${conn.unit_example_frame}".`
          : `Collaborate in your small group to ${visualMeta.actionVerb} for "${unit.unit_title}". Annotate evidence of ${keyTerms} and construct a 2–3 sentence ${klu} justification citing specific features of ${ev}.`;

    activities.push({
      id: `act-${unit.id}-4`,
      unit_id: unit.id,
      activity_order: 4,
      day_label: "Day 4 · Model & Text Reasoning",
      domain: "Reading & Reasoning",
      grouping: "Small Group",
      duration_minutes: 12,
      prep_time_minutes: 4,
      activity_type: "Visual / Model Justification",
      title: `Visual / Model Justification: ${unit.unit_title}`,
      materials: visualMeta.materials,
      teacher_instructions: `1. Distribute the ${visualMeta.artifactName} for Grade ${unit.grade} ${unit.subject} ("${unit.unit_title}") and model annotating "${t1}" directly on ${ev}. 2. Have small groups ${visualMeta.actionVerb} during ${protocol}, requiring students to physically point to evidence before speaking. 3. Ask each group to draft one shared justification using "${conn.unit_example_frame}" and ${keyTerms}, then compare two groups' models on the board.`,
      worked_example: day4WorkedExample,
      student_prompt: day4StudentPrompt,
      differentiated_targets: {
        level_1_2: `Circle or label "${t1}" on the ${visualMeta.artifactName} and orally state 1 observation using a WIDA 1–2 starter.`,
        level_3_4: `Annotate "${t1}" and "${t2}" on ${ev} and write a 2-sentence ${klu} justification connecting the visual/text detail to "${unit.unit_title}".`,
        level_5_6: `Evaluate and compare two features on the ${visualMeta.artifactName}, writing a concise justification that integrates ${keyTerms} and addresses a peer's question.`,
      },
      check_for_understanding: `Students point to or annotate concrete evidence on the ${visualMeta.artifactName} and explain how "${t1}" and "${t2}" support their reasoning rather than stating an unsupported answer.`,
      target_lab_route: "/access-practice-lab/access-prep",
    });

    // -----------------------------------------------------------------------
    // Order 5 — Quick Write & Language Exit Ticket (Day 5 · Independent Transfer)
    // -----------------------------------------------------------------------
    const day5WorkedExample = `${mentorSentence} Specifically, ${ev} confirms how ${t1} and ${t2} work together to deepen our understanding of ${t3} in ${unit.unit_title}.`;

    activities.push({
      id: `act-${unit.id}-5`,
      unit_id: unit.id,
      activity_order: 5,
      day_label: "Day 5 · Independent Transfer",
      domain: "Synthesis",
      grouping: "Independent",
      duration_minutes: 8,
      prep_time_minutes: 2,
      activity_type: "Quick Write & Language Exit Ticket",
      title: `Quick Write & Language Exit Ticket: ${unit.unit_title}`,
      materials: [
        "Unit Language Exit Ticket Slip or Digital Form",
        "WIDA Desk Strip (Optional Support)",
        "Unit Vocabulary Anchor Chart",
      ],
      teacher_instructions: `1. Project the "${unit.unit_title}" Language Exit Ticket prompt, target frame ("${etFrame}"), and required terms (${etVocab}) so expectations are visible. 2. Give students 5 minutes of independent transfer time (allowing oral dictation or WIDA 1–2 desk strips as needed) while circulating to note common language misconceptions. 3. Collect slips and sort into Emerging, Developing, and Proficient groups using the unit look-fors to plan immediate reteach or extension.`,
      worked_example: day5WorkedExample,
      student_prompt: etPrompt,
      differentiated_targets: {
        level_1_2: etRubric.emerging,
        level_3_4: etRubric.developing,
        level_5_6: etRubric.proficient,
      },
      check_for_understanding: `Exit ticket look-fors: ${etLookFors.join(" ")}`,
      target_lab_route: "/access-practice-lab/sentences",
    });
  }

  return activities;
}

const SUBJECT_LABELS = {
  ELA: {
    en: "English Language Arts",
    es: "Artes del Lenguaje en Inglés",
  },
  Math: {
    en: "Mathematics",
    es: "Matemáticas",
  },
  Science: {
    en: "Science",
    es: "Ciencias",
  },
  "Social Studies": {
    en: "Social Studies",
    es: "Estudios Sociales",
  },
};

export function buildFamilyCard(unit, conn, override = null) {
  if (override) {
    const bilingual = {};
    if (override.en) bilingual.en = override.en;
    if (override.es) bilingual.es = override.es;
    return {
      unit_id: unit.id,
      translations_json: bilingual,
    };
  }

  const bp = BLUEPRINT_BY_ID.get(conn.blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const vocab = (conn.tier2_tier3_vocab || []).slice(0, 3);
  const enWords = vocab.map((v) => v.term);
  const esWords = vocab.map((v) => (v.cognate_es ? `${v.term} (${v.cognate_es})` : v.term));
  const gradeLabel = unit.grade === "K" ? "Kindergarten" : `Grade ${unit.grade}`;
  const gradeEs = unit.grade === "K" ? "Kínder" : `Grado ${unit.grade}`;
  const subj = SUBJECT_LABELS[unit.subject] || SUBJECT_LABELS.ELA;

  return {
    unit_id: unit.id,
    translations_json: {
      en: {
        title: `${gradeLabel} ${subj.en}: ${unit.unit_title}`,
        summary: `In ${unit.curriculum_name}, your child is learning about ${unit.unit_title.toLowerCase()}. ${unit.unit_summary} In class, we are practicing how to ${klu.toLowerCase()} ideas clearly using words like ${enWords.join(", ")}.`,
        dinner_question: `Ask at home: "Can you teach me what '${enWords[0] || unit.unit_title}' means from your '${unit.unit_title}' unit and give me an example?"`,
        key_words: enWords,
      },
      es: {
        title: `${gradeEs} · ${subj.es}: ${unit.unit_title}`,
        summary: `En ${unit.curriculum_name}, su hijo/a está estudiando "${unit.unit_title}". En clase practicamos cómo explicar y compartir ideas completas en inglés usando vocabulario clave como ${esWords.join(", ")}.`,
        dinner_question: `Pregunte en casa: "¿Puedes explicarme con tus propias palabras qué significa '${esWords[0] || unit.unit_title}' en tu unidad de '${unit.unit_title}'?"`,
        key_words: esWords,
      },
    },
  };
}
