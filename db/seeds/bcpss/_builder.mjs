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

export function buildActivitiesForSubject(units, connections) {
  const connByUnit = new Map(connections.map((c) => [c.unit_id, c]));
  const activities = [];

  for (const unit of units) {
    const conn = connByUnit.get(unit.id);
    if (!conn) {
      throw new Error(`Missing unit_connection for unit ${unit.id}`);
    }
    const bp = BLUEPRINT_BY_ID.get(conn.blueprint_id);
    const vocabList = (conn.tier2_tier3_vocab || []).map((v) => v.term);
    const keyTerms = vocabList.slice(0, 3).join(", ");
    const cognateTerms = (conn.tier2_tier3_vocab || [])
      .filter((v) => v.cognate_es)
      .slice(0, 2)
      .map((v) => `${v.term} (${v.cognate_es})`)
      .join(" and ");
    const isStem = unit.subject === "Math" || unit.subject === "Science";
    const thirdType = isStem ? "Visual/Model Justification" : "Structured Partner Talk";
    const thirdRoute = isStem
      ? "/access-practice-lab/access-prep"
      : "/access-practice-lab/speak";

    // Activity 1: Sentence Architect
    activities.push({
      id: `act-${unit.id}-1`,
      unit_id: unit.id,
      activity_order: 1,
      activity_type: "Sentence Architect",
      title: `Sentence Architect: ${unit.unit_title}`,
      prep_time_minutes: 5,
      teacher_instructions: `Display the Grade ${unit.grade} ${unit.subject} target frame ("${conn.unit_example_frame}") alongside a word bank of ${keyTerms}. Model assembling one clause aloud using the ${bp.wida_klu} move (${bp.move_name}), then have students build and revise two unit sentences in pairs.`,
      student_prompt: `Use the Sentence Architect blocks to build a complete ${bp.wida_klu} sentence about "${unit.unit_title}" using the frame "${conn.unit_example_frame}" and at least two terms from: ${keyTerms}.`,
      target_lab_route: "/access-practice-lab/sentences",
    });

    // Activity 2: Cognate & Syntax Warm-Up
    activities.push({
      id: `act-${unit.id}-2`,
      unit_id: unit.id,
      activity_order: 2,
      activity_type: "Cognate & Syntax Warm-Up",
      title: `Cognate & Syntax Warm-Up: ${keyTerms}`,
      prep_time_minutes: 4,
      teacher_instructions: `Launch class with a 4-minute WordLab warm-up spotlighting ${cognateTerms || keyTerms} from "${unit.unit_title}". Have students sort Tier 2 connectors vs. Tier 3 content words, check Spanish–English cognates (EN/ES), and rehearse pronunciation before reading or problem-solving.`,
      student_prompt: `Sort the key terms (${keyTerms}) for "${unit.unit_title}", match each word to its Spanish cognate or visual cue, and plug one term into the unit frame: "${conn.unit_example_frame}".`,
      target_lab_route: "/access-practice-lab/wordlab",
    });

    // Activity 3: Visual/Model Justification (Math/Science) OR Structured Partner Talk (ELA/Social Studies)
    activities.push({
      id: `act-${unit.id}-3`,
      unit_id: unit.id,
      activity_order: 3,
      activity_type: thirdType,
      title: isStem
        ? `Visual/Model Justification: ${unit.unit_title}`
        : `Structured Partner Talk: ${unit.unit_title}`,
      prep_time_minutes: 6,
      teacher_instructions: isStem
        ? `Give pairs a diagram, table, or worked model from Grade ${unit.grade} ${unit.subject} ("${unit.unit_title}"). Require each student to point to evidence on the model while orally rehearsing "${conn.unit_example_frame}" with ${keyTerms}, then record their justification.`
        : `Pair students in an A/B academic conversation about "${unit.unit_title}" using "${conn.unit_example_frame}". Partner A cites text or historical evidence using ${keyTerms}; Partner B paraphrases and extends using the ${bp.move_name} language move.`,
      student_prompt: isStem
        ? `Inspect the model for "${unit.unit_title}". Point to the key feature, explain your thinking using "${conn.unit_example_frame}", and include ${keyTerms} in your justification.`
        : `Take turns with your partner discussing "${unit.unit_title}". Use the frame "${conn.unit_example_frame}" and weave in ${keyTerms}, then listen and build on your partner's idea.`,
      target_lab_route: thirdRoute,
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
