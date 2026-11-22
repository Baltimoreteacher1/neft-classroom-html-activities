/**
 * Intelligence Adapter Layer:
 * Supports live API endpoints when `window.TLP_API_CONFIG` is configured,
 * and ships with a complete deterministic client-side rule/heuristic engine
 * so every feature works immediately offline/locally with zero broken states.
 */

import {
  COGNATE_BANK,
  POLYSEMOUS_LEXICON,
  TIER2_CONNECTORS,
  getLanguageMeta,
} from "../data/platformData.js";
import { logEvent } from "./logger.js";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Module 1: Linguistic Trap Scanner + Tiered Scaffolds + 5-Min Pre-Teach Micro-Lab.
 */
export function scanLessonText(rawText, l1 = "es") {
  const text = String(rawText || "").trim();
  const sentences = splitSentences(text);
  const lower = text.toLowerCase();

  const polysemousHits = [];
  for (const [word, info] of Object.entries(POLYSEMOUS_LEXICON)) {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    if (re.test(lower)) {
      polysemousHits.push({ word, ...info });
    }
  }

  const connectorHits = [];
  for (const [word, info] of Object.entries(TIER2_CONNECTORS)) {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    if (re.test(lower)) {
      connectorHits.push({ word, ...info });
    }
  }

  const passiveRegex = /\b(?:is|are|was|were|be|been|can be|may be)\s+([a-z]+(?:ed|en|wn))\b/gi;
  const syntaxHits = [];
  for (const s of sentences) {
    const passiveMatches = [...s.matchAll(passiveRegex)].map((m) => m[0]);
    const wordCount = s.split(/\s+/).filter(Boolean).length;
    if (passiveMatches.length > 0 || wordCount >= 22) {
      let rewrite = s;
      if (passiveMatches.length > 0) {
        rewrite = s
          .replace(/\bis transferred\b/gi, "moves")
          .replace(/\bis divided\b/gi, "splits")
          .replace(/\bis scaled up\b/gi, "grows larger")
          .replace(/\bcan be vetoed\b/gi, "the president can reject");
      }
      syntaxHits.push({
        original: s,
        reason: passiveMatches.length ? `Passive voice (${passiveMatches[0]})` : `Long multi-clause sentence (${wordCount} words)`,
        rewrite: rewrite !== s ? rewrite : `Break into 2 steps: ${s.split(/[,;]/)[0].trim()}. Then explain why.`,
      });
    }
  }

  const cognateHits = [];
  if (l1 && l1 !== "en") {
    for (const [eng, map] of Object.entries(COGNATE_BANK)) {
      if (new RegExp(`\\b${escapeRegex(eng)}\\b`, "i").test(lower) && map[l1]) {
        cognateHits.push({ word: eng, l1Word: map[l1], l1 });
      }
    }
  }

  const keyTerms = [
    ...polysemousHits.map((h) => h.word),
    ...cognateHits.map((c) => c.word),
    ...connectorHits.map((c) => c.word),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);

  const primaryConnector = connectorHits[0]?.word || "because";
  const primaryTerm = keyTerms[0] || "concept";

  const scaffolds = {
    level12: {
      label: "WIDA Levels 1–2 (Entering / Emerging)",
      frames: [
        `The ${primaryTerm} shows ______.`,
        `First, ______. Next, ______.`,
      ],
      wordBank: keyTerms.length ? keyTerms : ["cause", "effect", "evidence", "change"],
    },
    level34: {
      label: "WIDA Levels 3–4 (Developing / Expanding)",
      frames: [
        `When ______ happens, ${primaryConnector} ______ changes.`,
        `Based on the text, ${primaryTerm} is important because ______.`,
      ],
      wordBank: [...keyTerms, ...connectorHits.map((c) => c.word)].slice(0, 7),
    },
    level56: {
      label: "WIDA Levels 5–6 (Bridging / Reaching)",
      frames: [
        `Although ______ initially occurs, ______; ${primaryConnector}, ______.`,
        `The evidence demonstrates that ${primaryTerm} ______, whereas ______.`,
      ],
      wordBank: [...connectorHits.map((c) => c.word), "demonstrates", "consequently", "whereas"].slice(0, 6),
    },
  };

  const microLab = {
    pronunciationWords: keyTerms.slice(0, 4).length ? keyTerms.slice(0, 4) : ["ecosystem", "consequently", "evidence"],
    cognateCue: cognateHits[0]
      ? `Bridge "${cognateHits[0].word}" with ${getLanguageMeta(l1).english} "${cognateHits[0].l1Word}".`
      : `Point out how "${primaryTerm}" has a specific meaning in this subject.`,
    quickCheck: {
      question: connectorHits[0]
        ? `In this passage, what does the connector "${connectorHits[0].word}" signal?`
        : `Which word in this passage has both an everyday meaning and a classroom meaning?`,
      options: connectorHits[0]
        ? [connectorHits[0].function, "A person's name", "A measurement unit"]
        : [polysemousHits[0]?.word || primaryTerm, "the", "and"],
      answerIndex: 0,
    },
  };

  logEvent("intelligence", "bridge_scan", {
    polysemous: polysemousHits.length,
    connectors: connectorHits.length,
    syntax: syntaxHits.length,
    cognates: cognateHits.length,
  });

  return {
    text,
    polysemousHits,
    connectorHits,
    syntaxHits,
    cognateHits,
    scaffolds,
    microLab,
  };
}

/**
 * Module 2: Deterministic L1-to-L2 Interference & Asset-Based Transfer Coach.
 */
export function analyzeL1Transfer(text, l1 = "es") {
  const input = String(text || "").trim();
  const findings = [];
  if (!input || l1 === "en") return findings;

  if (l1 === "es" || l1 === "pt") {
    if (/^(?:is|are|was|were|has|have)\s+/i.test(input) || /\.\s+(?:is|are|was|were)\s+/i.test(input)) {
      findings.push({
        pattern: "Subject Pronoun Drop",
        observation: "A clause starts directly with a verb without an explicit subject ('it', 'they', 'there').",
        coachingTip: "In Spanish/Portuguese, verb endings carry the subject. Prompt the learner: 'Who or what is doing the action? Add it/they at the front.'",
      });
    }
    if (/\b(?:actual|actually|library|exit|sensible)\b/i.test(input)) {
      findings.push({
        pattern: "Cross-Linguistic False Cognate Check",
        observation: "Uses a high-frequency word ('actual', 'library', 'exit', 'sensible') that shifts meaning across Romance languages.",
        coachingTip: "Validate the root connection, then clarify the English meaning (e.g., 'actual' = real/current, not 'at this moment').",
      });
    }
  }

  if (l1 === "zh" || l1 === "uk" || l1 === "ru") {
    if (/\b(?:plant|table|ratio|branch|system|ecosystem)\s+(?:is|was|has|shows|grows)\b/i.test(input)) {
      findings.push({
        pattern: "Zero-Article Transfer (a / an / the)",
        observation: "A singular countable noun appears without a determiner ('the', 'a', 'this').",
        coachingTip: `${getLanguageMeta(l1).english} expresses definiteness through word order or context rather than articles. Practice a quick 'the / a' check before nouns.`,
      });
    }
    if (l1 === "zh" && /\bbecause\b[\s\S]{1,80}\bso\b/i.test(input)) {
      findings.push({
        pattern: "Paired Conjunction Transfer (because... so)",
        observation: "Uses both 'because' and 'so' in the same sentence.",
        coachingTip: "In Mandarin, 'yīnwèi... suǒyǐ...' pairs both words. Celebrate the clear cause-effect logic, then show English chooses just one.",
      });
    }
  }

  if (l1 === "ar") {
    if (/\bthe\s+[a-z]+\s+(?:big|small|good|important|proportional|green|dry)\b/i.test(input)) {
      findings.push({
        pattern: "Present-Tense Copula ('is / are') Transfer",
        observation: "Noun + adjective phrase may omit 'is/are' in present-tense statements.",
        coachingTip: "Arabic nominal sentences don't require 'is' in the present tense. Gently cue: 'Add the linking verb is/are between the noun and description.'",
      });
    }
    if (/\bthat\s+[a-z]+\s+[a-z]+ed\s+(?:it|them)\b/i.test(input)) {
      findings.push({
        pattern: "Resumptive Pronoun in Relative Clause",
        observation: "Includes a pronoun ('it'/'them') at the end of a 'that/which' clause.",
        coachingTip: "Arabic uses a resumptive pronoun to anchor relative clauses. Show how English lets 'that/which' carry the reference alone.",
      });
    }
  }

  if (l1 === "fr") {
    if (/\b(?:make|made)\s+(?:a\s+)?(?:homework|research|effort)\b/i.test(input)) {
      findings.push({
        pattern: "'Faire' → 'Make vs. Do' Transfer",
        observation: "Uses 'make' where English collocates with 'do' ('do homework', 'do research').",
        coachingTip: "French 'faire' covers both 'make' and 'do'. Quick rule: 'make' creates a physical product; 'do' completes a task or action.",
      });
    }
  }

  if (findings.length === 0) {
    findings.push({
      pattern: "Asset-Based Transfer Check",
      observation: `No high-friction ${getLanguageMeta(l1).english} transfer traps detected in this sample.`,
      coachingTip: "Encourage the learner to connect academic cognates and keep building multi-clause explanations.",
    });
  }

  return findings;
}

/**
 * Module 3: Sentence Architect Complexity Evaluator.
 */
export function evaluateSentenceArchitecture(kernelItem, placedBlocksMap) {
  const placed = Object.values(placedBlocksMap || {}).filter(Boolean);
  let level = 1;
  for (const b of placed) level += b.levelBoost || 1;
  level = Math.min(5, Math.max(1, level));

  const connector = placedBlocksMap.connector?.text || "";
  const verb = placedBlocksMap.verb?.text || kernelItem.action;
  const prep = placedBlocksMap.prep?.text || "";
  const evidence = placedBlocksMap.evidence?.text || "";

  const parts = [];
  if (connector) parts.push(connector.charAt(0).toUpperCase() + connector.slice(1));
  const subject = connector ? kernelItem.whoWhat.charAt(0).toLowerCase() + kernelItem.whoWhat.slice(1) : kernelItem.whoWhat;
  parts.push(`${subject} ${verb}`);
  if (prep) parts.push(prep);
  if (evidence) parts.push(evidence);

  let sentence = parts.join(" ").replace(/\s+,/g, ",").trim();
  if (!sentence.endsWith(".")) sentence += ".";

  const reasons = [];
  if (placedBlocksMap.verb) reasons.push("precise academic verb");
  if (placedBlocksMap.prep) reasons.push("spatial/context phrase");
  if (placedBlocksMap.connector) reasons.push("Tier 2 discourse connector");
  if (placedBlocksMap.evidence) reasons.push("evidence clause");

  const explanation = reasons.length
    ? `Complexity Level ${level}/5 — elevated with ${reasons.join(", ")}.`
    : "Level 1 kernel — snap linguistic blocks below to expand academic precision.";

  logEvent("intelligence", "architect_eval", { kernelId: kernelItem.id, level, blocks: placed.length });

  return {
    level,
    sentence,
    explanation,
    clauses: {
      whoWhat: kernelItem.whoWhat,
      action: verb,
      whyHow: [prep, evidence].filter(Boolean).join(" ") || kernelItem.whyHow,
    },
  };
}

/**
 * Module 4: Speaking Simulator Rubric Evaluator.
 */
export function evaluateSpeakingResponse(promptItem, transcript, lifelinesUsed = []) {
  const text = String(transcript || "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = text.toLowerCase();

  const bankHits = (promptItem.wordBank || []).filter((w) =>
    new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(lower),
  );
  const connectorHits = Object.keys(TIER2_CONNECTORS).filter((w) =>
    new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(lower),
  );

  const uniqueLifelines = [...new Set(lifelinesUsed)];
  const lifelineTier =
    uniqueLifelines.length === 0
      ? "Independent"
      : uniqueLifelines.length === 1
        ? "Lightly Scaffolded"
        : "Heavily Scaffolded";

  let vocabScore = Math.min(6, 1 + bankHits.length * 1.5 + connectorHits.length);
  let complexityScore = Math.min(6, 1 + (wordCount >= 8 ? 1 : 0) + (wordCount >= 16 ? 1.5 : 0) + connectorHits.length * 1.5 + (splitSentences(text).length >= 2 ? 1 : 0));
  let completenessScore = Math.min(6, wordCount === 0 ? 1 : wordCount < 6 ? 2 : wordCount < 14 ? 3.5 : 5 + (bankHits.length >= 2 ? 1 : 0));

  const band = Math.max(1, Math.min(6, Math.round((vocabScore + complexityScore + completenessScore) / 3)));

  const praise =
    bankHits.length > 0
      ? `Strong use of academic vocabulary (${bankHits.slice(0, 3).join(", ")}).`
      : wordCount >= 10
        ? "Clear, complete thought with steady pacing."
        : "Good start—you expressed the core idea.";

  const nextStep =
    connectorHits.length === 0
      ? `Try adding a Tier 2 connector like "consequently" or "whereas" to link your ideas.`
      : bankHits.length < 2
        ? `Include one more domain term from the word bank (${promptItem.wordBank.slice(0, 2).join(" or ")}).`
        : "Try explaining a second piece of evidence to push toward Level 6.";

  logEvent("intelligence", "speaking_eval", { promptId: promptItem.id, band, lifelineTier, wordCount });

  return {
    band,
    lifelineTier,
    lifelinesUsed: uniqueLifelines,
    wordCount,
    dimensions: {
      vocabulary: Math.round(vocabScore),
      complexity: Math.round(complexityScore),
      completeness: Math.round(completenessScore),
    },
    praise,
    nextStep,
  };
}

/**
 * Module 5: Reclassification Radar & 4-Week Domain Sprint Generator.
 */
export function analyzeStudentRadar(student) {
  const domains = [
    { key: "listening", label: "Listening", score: Number(student.listening) || 0, route: "Listening" },
    { key: "speaking", label: "Speaking", score: Number(student.speaking) || 0, route: "simulator" },
    { key: "reading", label: "Reading", score: Number(student.reading) || 0, route: "Reading" },
    { key: "writing", label: "Writing", score: Number(student.writing) || 0, route: "architect" },
  ];
  const avg = Number(((domains.reduce((s, d) => s + d.score, 0)) / 4).toFixed(2));
  const threshold = Number(student.threshold) || 4.5;
  const gap = Number((threshold - avg).toFixed(2));
  const isBubble = gap > 0 && gap <= 0.5;
  const isReady = gap <= 0;

  const bottleneck = [...domains].sort((a, b) => a.score - b.score)[0];

  return {
    ...student,
    average: avg,
    gap,
    isBubble,
    isReady,
    bottleneck,
    status: isReady ? "Exit Ready" : isBubble ? "Bubble Student" : "Developing",
  };
}

export function generateDomainSprint(analyzedStudent) {
  const b = analyzedStudent.bottleneck;
  const domainRoutes = {
    Listening: [
      { week: 1, focus: "Detail & Signal Word Tracking", route: "Listening", cta: "Open Listening Room" },
      { week: 2, focus: "Content-to-Language Audio Pre-Teach", route: "bridge", cta: "Open Bridge Micro-Lab" },
      { week: 3, focus: "Multi-Step Classroom Directions", route: "Listening", cta: "Practice Listening" },
      { week: 4, focus: "Independent Practice Test Check", route: "tests", cta: "Open Practice Tests" },
    ],
    Speaking: [
      { week: 1, focus: "Sentence Starters & Word Bank Rehearsal", route: "simulator", cta: "Open Speaking Simulator" },
      { week: 2, focus: "Cause-and-Effect Oral Framing", route: "architect", cta: "Build Frames in Architect" },
      { week: 3, focus: "Lightly Scaffolded Oral Explanations", route: "simulator", cta: "Practice with 1 Lifeline" },
      { week: 4, focus: "Independent Pride Clip Recording", route: "speak", cta: "Open Speaking Studio" },
    ],
    Reading: [
      { week: 1, focus: "Polysemous & Academic Vocabulary", route: "bridge", cta: "Scan Text in Bridge" },
      { week: 2, focus: "Finding Textual Evidence", route: "Reading", cta: "Open Reading Room" },
      { week: 3, focus: "Clause Deconstruction (Who / Action / Why)", route: "architect", cta: "Deconstruct in Architect" },
      { week: 4, focus: "Independent Reading Check", route: "tests", cta: "Open Practice Tests" },
    ],
    Writing: [
      { week: 1, focus: "Kernel-to-Academic Sentence Expansion", route: "architect", cta: "Open Sentence Architect" },
      { week: 2, focus: "Tier 2 Connectors (Whereas, Consequently)", route: "architect", cta: "Practice Connectors" },
      { week: 3, focus: "Pattern Revision & Editing", route: "detective", cta: "Open Error Detective" },
      { week: 4, focus: "Independent Evidence Paragraph", route: "write", cta: "Open Writing Studio" },
    ],
  };

  return {
    studentAlias: analyzedStudent.alias,
    bottleneckDomain: b.label,
    currentScore: b.score,
    targetThreshold: analyzedStudent.threshold,
    weeks: domainRoutes[b.label] || domainRoutes.Writing,
  };
}
