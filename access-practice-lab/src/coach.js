// AI Language Coach — deterministic, client-side, privacy-safe academic discourse evaluator.
// Analyzes student writing and oral speech transcripts for discourse structure,
// sentence complexity, academic vocabulary, and evidence-based reasoning.
// Provides 3-tier fading scaffolds without giving away test answers.

import { wordCount } from "./util.js";

const CONNECTORS = {
  cause: [
    "because", "as a result", "consequently", "therefore", "due to", "leads to",
    "causes", "since", "for this reason", "thus"
  ],
  contrast: [
    "however", "although", "even though", "in contrast", "on the other hand",
    "whereas", "while", "unlike", "yet", "instead"
  ],
  addition: [
    "furthermore", "in addition", "moreover", "also", "another reason", "additionally"
  ],
  evidence: [
    "according to", "as shown in", "the data shows", "the chart illustrates",
    "for example", "for instance", "based on", "the author states", "in the diagram"
  ],
  conclusion: [
    "in conclusion", "overall", "ultimately", "this demonstrates", "this proves", "to summarize"
  ]
};

const STARTERS = [
  "according to", "in addition", "furthermore", "on the other hand", "although",
  "consequently", "first", "second", "finally", "overall", "as shown", "because",
  "when", "while", "if", "after"
];

/**
 * Clean and split text into normalized sentences.
 */
export function splitSentences(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Deep academic language analysis of a student response.
 */
export function analyzeLanguage(text, { prompt = "", wordBank = [], keyUse = "Explain" } = {}) {
  const words = wordCount(text);
  const sentences = splitSentences(text);
  const lower = text.toLowerCase();

  // 1. Sentence Complexity & Variety
  const complexFound = [];
  const startersUsed = [];
  let compoundCount = 0;
  let complexCount = 0;

  for (const s of sentences) {
    const sLow = s.toLowerCase();
    const firstWord = sLow.split(/\s+/)[0];
    startersUsed.push(firstWord);

    const hasSubordinating = /\b(because|although|since|whereas|while|if|unless|even though|after|before|until|so that)\b/i.test(s);
    const hasCoordinating = /,\s*(and|but|or|so|yet)\b/i.test(s);

    if (hasSubordinating) {
      complexCount++;
      const match = s.match(/\b(because|although|since|whereas|while|if|unless|even though|after|before|until|so that)\b/i);
      if (match && !complexFound.includes(match[0].toLowerCase())) complexFound.push(match[0].toLowerCase());
    }
    if (hasCoordinating) {
      compoundCount++;
    }
  }

  // Check starter repetition (e.g. starting every sentence with "The" or "I")
  const starterCounts = {};
  for (const st of startersUsed) starterCounts[st] = (starterCounts[st] || 0) + 1;
  const repetitiveStarter = Object.entries(starterCounts).find(([_, count]) => count >= 3);

  // 2. Connectors across categories
  const connectorsUsed = {
    cause: CONNECTORS.cause.filter((c) => lower.includes(c)),
    contrast: CONNECTORS.contrast.filter((c) => lower.includes(c)),
    addition: CONNECTORS.addition.filter((c) => lower.includes(c)),
    evidence: CONNECTORS.evidence.filter((c) => lower.includes(c)),
    conclusion: CONNECTORS.conclusion.filter((c) => lower.includes(c)),
  };

  const totalConnectors = Object.values(connectorsUsed).reduce((n, list) => n + list.length, 0);

  // 3. Word Bank & Target Vocabulary Usage
  const bankMatched = wordBank.filter((term) => {
    const clean = term.toLowerCase().replace(/[^\w\s-]/g, "").trim();
    if (!clean) return false;
    const re = new RegExp(`\\b${clean.replace(/\s+/g, "\\s+")}\\b`, "i");
    return re.test(lower);
  });

  // 4. Discourse Level (Claim, Evidence, Reasoning)
  const hasEvidenceCue = connectorsUsed.evidence.length > 0 || /\b(data|shows|graph|chart|author|passage|picture|details|evidence|example)\b/i.test(lower);
  const hasReasoningCue = connectorsUsed.cause.length > 0 || /\b(reason|explains|causes|means|shows that|leads to)\b/i.test(lower);
  const hasConclusionCue = connectorsUsed.conclusion.length > 0 || /\b(finally|overall|in conclusion|as we can see)\b/i.test(lower);

  // 5. Generate Specific Actionable Coaching Feedback (Tiered Fading Scaffolds)
  const recommendations = [];
  const strengths = [];

  if (words >= 15 && sentences.length >= 2) {
    strengths.push(`Developed length (${words} words across ${sentences.length} sentences).`);
  }
  if (bankMatched.length > 0) {
    strengths.push(`Used target academic vocabulary (${bankMatched.join(", ")}).`);
  }
  if (complexCount > 0 || totalConnectors >= 2) {
    strengths.push(`Applied connecting words to link ideas (${[...complexFound, ...connectorsUsed.cause, ...connectorsUsed.contrast].slice(0, 3).join(", ")}).`);
  }

  // Tier 1: Nudge
  let scaffoldLevel = "Starting";
  if (words < 10) {
    recommendations.push({
      tier: 1,
      title: "Expand your explanation",
      prompt: "Your response is very brief. What is one specific fact or observation you can add?",
      frame: "One important detail is that ___."
    });
  } else if (sentences.length === 1 && words > 18) {
    recommendations.push({
      tier: 1,
      title: "Break into clear sentences",
      prompt: "You have a long run-on idea. Try dividing it into two complete sentences with a connecting word like 'Furthermore' or 'Consequently'.",
      frame: "[First complete thought]. Furthermore, [second detail]."
    });
  }

  if (words >= 10 && !hasReasoningCue && (keyUse === "Explain" || keyUse === "Argue")) {
    recommendations.push({
      tier: 2,
      title: "Add Causal Reasoning",
      prompt: "You stated what happens, but not *why*. Connect the cause to its effect.",
      frame: "This occurs because ___ , which results in ___."
    });
  }

  if (words >= 15 && totalConnectors === 0) {
    recommendations.push({
      tier: 2,
      title: "Add Academic Cohesion",
      prompt: "Connect your sentences so your ideas flow smoothly for the reader.",
      frame: "Try starting a sentence with 'For example,' 'In addition,' or 'As a result.'"
    });
  }

  if (repetitiveStarter) {
    recommendations.push({
      tier: 2,
      title: "Vary Sentence Openers",
      prompt: `You began ${repetitiveStarter[1]} sentences with '${repetitiveStarter[0]}'. Try varying your sentence openings to make your writing more engaging.`,
      frame: "Try beginning with a preposition or dependent clause: 'According to the chart...' or 'When the temperature drops...'"
    });
  }

  if (words >= 25 && !hasEvidenceCue) {
    recommendations.push({
      tier: 3,
      title: "Cite Specific Evidence",
      prompt: "Strengthen your argument by directly referring to the text, chart, or data.",
      frame: "As stated in the source, ___ ."
    });
  }

  // Summary score estimate for internal growth feedback (never claims WIDA score)
  let complexityRating = "Developing";
  if (words >= 25 && complexCount >= 1 && totalConnectors >= 2 && bankMatched.length >= 2) {
    complexityRating = "Expanding";
  } else if (words >= 15 && (complexCount >= 1 || totalConnectors >= 1)) {
    complexityRating = "Growing";
  }

  return {
    words,
    sentenceCount: sentences.length,
    sentences,
    complexCount,
    compoundCount,
    connectorsUsed,
    totalConnectors,
    bankMatched,
    hasEvidenceCue,
    hasReasoningCue,
    hasConclusionCue,
    strengths,
    recommendations,
    complexityRating
  };
}

/**
 * Compare two drafts of writing and return exact growth indicators.
 */
export function compareRevisions(firstDraft = "", revisedDraft = "") {
  const d1 = analyzeLanguage(firstDraft);
  const d2 = analyzeLanguage(revisedDraft);

  const wordDelta = d2.words - d1.words;
  const sentenceDelta = d2.sentenceCount - d1.sentenceCount;
  const connectorDelta = d2.totalConnectors - d1.totalConnectors;
  const newWords = d2.sentences.filter((s) => !d1.sentences.includes(s));

  const changes = [];
  if (wordDelta > 0) changes.push(`Expanded text by +${wordDelta} words.`);
  if (sentenceDelta > 0) changes.push(`Added +${sentenceDelta} distinct sentence(s).`);
  if (connectorDelta > 0) changes.push(`Added +${connectorDelta} academic connecting word(s).`);
  if (d2.complexCount > d1.complexCount) changes.push("Increased sentence complexity with subordinating clauses.");

  return {
    wordDelta,
    sentenceDelta,
    connectorDelta,
    changes: changes.length ? changes : ["Maintained focused precision and reviewed grammar."],
    before: d1,
    after: d2
  };
}
