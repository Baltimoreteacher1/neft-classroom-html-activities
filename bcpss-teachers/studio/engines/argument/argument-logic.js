// Pure logic for Argument Builder: card classification, claim/evidence/reasoning/counter checks, the revision
// checklist, the "strengthen it" list and the output text. No DOM, no storage. Schema: engines/argument-builder.schema.md

export const FORMAT_LABELS = {
  cer: {
    claim: "Claim",
    evidence: "Evidence",
    reasoning: "Reasoning",
    counter: "Other explanation",
  },
  ela: {
    claim: "Claim",
    evidence: "Text evidence",
    reasoning: "Reasoning",
    counter: "Opposing view",
  },
  source: {
    claim: "Claim",
    evidence: "Source evidence",
    reasoning: "Explanation",
    counter: "Another viewpoint",
  },
  decision: {
    claim: "Decision",
    evidence: "Facts",
    reasoning: "Why it matters",
    counter: "Other option",
  },
};
export const labelsFor = (a) => ({ ...FORMAT_LABELS[a.format], ...(a.labels || {}) });

export const MIN_REASONING_WORDS = 6;
export const LINK_PHRASES = [
  "because",
  "so",
  "which means",
  "this shows",
  "shows that",
  "proves",
  "suggests",
  "therefore",
  "since",
  "as a result",
  "explains why",
  "means that",
  "demonstrates",
  "supports",
];
const STOP = new Set(
  "that this with from have they their there because which shows show would could should about also more than then them were been into when what will your some very much many most such like just only each other these those does done make made over after before while where being both here said says say".split(
    " ",
  ),
);
const FRAME_CONNECTORS = new Set([
  "shows",
  "proves",
  "suggests",
  "therefore",
  "since",
  "means",
  "demonstrates",
  "supports",
  "result",
  "explains",
]);

export const wordList = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
export const wordCount = (s) => wordList(s).length;
const stemsOf = (s) =>
  new Set(
    (
      String(s || "")
        .toLowerCase()
        .match(/[a-z]{4,}/g) || []
    )
      .filter((w) => !STOP.has(w) && !FRAME_CONNECTORS.has(w))
      .map((w) => w.slice(0, 5)),
  );

// ------------------------------------------------------------------ cards and claims
export const claimOf = (a, id) => a.claims.find((c) => c.id === id);
export const cardOf = (a, id) => a.evidence.find((c) => c.id === id);
export const sourceOf = (a, id) => a.sources.find((s) => s.id === id);

/** strong | weak | other-claim | irrelevant, relative to the chosen claim. */
export function classifyCard(card, claimId) {
  if (card.quality === "irrelevant" || card.supports == null) return "irrelevant";
  if (card.supports !== claimId) return "other-claim";
  return card.quality === "weak" ? "weak" : "strong";
}
export const CLASS_TEXT = {
  strong: "Backs your claim.",
  weak: "Weak evidence.",
  "other-claim": "Backs a different claim.",
  irrelevant: "Off topic.",
};
export const minEvidence = (a) => a.minEvidence ?? 2;
export const maxEvidence = (a) => a.maxEvidence ?? 4;

export function checkClaim(a, claimId) {
  const c = claimOf(a, claimId);
  if (!c) return { complete: false, message: "Choose a claim first." };
  return { complete: true, ok: !!c.strong, claim: c };
}

export function checkEvidence(a, claimId, ids) {
  const min = minEvidence(a);
  const max = maxEvidence(a);
  if (ids.length < min) return { complete: false, message: `Choose at least ${min} cards.` };
  if (ids.length > max) return { complete: false, message: `Choose no more than ${max} cards.` };
  const cards = ids.map((id) => {
    const card = cardOf(a, id);
    return { id, card, cls: classifyCard(card, claimId) };
  });
  const strong = cards.filter((c) => c.cls === "strong").length;
  const blockers = cards.filter((c) => c.cls === "irrelevant" || c.cls === "other-claim");
  const ok = strong >= min && !blockers.length;
  const tag = blockers.some((b) => b.cls === "irrelevant")
    ? "irrelevant-card"
    : blockers.length
      ? "other-claim-card"
      : "too-few-strong";
  return { complete: true, ok, cards, strong, blockers, tag };
}

// ------------------------------------------------------------------ reasoning and counterclaim
export const hasLink = (text, extra = []) => {
  const t = ` ${String(text || "")
    .toLowerCase()
    .replace(/[^a-z' ]/g, " ")} `;
  return [...LINK_PHRASES, ...extra.map((x) => x.toLowerCase())].some((p) => t.includes(` ${p} `));
};

/** frame: the frame text the learner started from (its own words do not count as ideas); "" for free writing. */
export function checkReasoning(text, { claimText, cardText, frame = "", linkWords = [] }) {
  const problems = [];
  const tags = [];
  const fail = (tag, msg) => (tags.push(tag), problems.push(msg));
  const t = String(text || "").trim();
  if (!t) return { ok: false, problems: ["Write your reasoning first."], tag: "reasoning-empty" };
  if (t.includes("___")) fail("reasoning-blank", "Fill in every blank (___) with your own words.");
  if (wordCount(t) < MIN_REASONING_WORDS) fail("reasoning-short", `Write at least ${MIN_REASONING_WORDS} words.`);
  if (!hasLink(t, linkWords))
    fail("reasoning-no-link", "Use a connecting word or phrase that explains why, such as because, so, or this shows.");
  const frameStems = stemsOf(frame.replaceAll("___", " "));
  const own = [...stemsOf(t)].filter((x) => !frameStems.has(x));
  const idea = new Set([...stemsOf(claimText), ...stemsOf(cardText)]);
  if (!own.some((x) => idea.has(x))) fail("reasoning-off-idea", "Name an idea from your claim or your evidence in your own words.");
  return { ok: !problems.length, problems, tag: tags[0] || "" };
}

export function checkCounter({ acknowledge, rebut }, linkWords = []) {
  const problems = [];
  if (wordCount(acknowledge) < 4)
    problems.push("Write at least 4 words acknowledging the other view.");
  if (wordCount(rebut) < 4) problems.push("Write at least 4 words in your rebuttal.");
  if (
    wordCount(rebut) >= 4 &&
    !hasLink(rebut, linkWords) &&
    !/\b(but|however|yet|although)\b/i.test(rebut)
  )
    problems.push(
      "Use a connecting word or phrase in your rebuttal, such as because, so, or however.",
    );
  if (acknowledge?.includes("___") || rebut?.includes("___"))
    problems.push("Fill in every blank (___) with your own words.");
  return { ok: !problems.length, problems, tag: problems.length ? "counter-incomplete" : "" };
}

export function counterMode(a, tier) {
  const req = a.counter?.requiredTiers || ["exp", "br"];
  const opt = a.counter?.optionalTiers || ["dev"];
  return req.includes(tier) ? "required" : opt.includes(tier) ? "optional" : "none";
}

// ------------------------------------------------------------------ revision
const KNOWN = [
  "claim-clear",
  "evidence-source",
  "evidence-variety",
  "evidence-strong",
  "reasoning-why",
  "counterclaim",
];
export const isKnownCheck = (id) => KNOWN.includes(id);

/** Evaluate the revision checklist. state: {claimId, evidenceIds, reasoningOk:{cardId:bool}, counterOk, selfChecks:{id:bool}} */
export function evaluateChecks(a, state, tier) {
  const mode = counterMode(a, tier);
  const cards = (state.evidenceIds || []).map((id) => ({
    id,
    cls: classifyCard(cardOf(a, id), state.claimId),
  }));
  const claim = claimOf(a, state.claimId);
  const strongCards = cards.filter((c) => c.cls === "strong");
  const rows = [];
  for (const chk of a.revision.checks) {
    if (chk.tiers && !chk.tiers.includes(tier)) continue;
    if (chk.id === "counterclaim" && mode === "none") continue;
    let met;
    let reason;
    switch (chk.id) {
      case "claim-clear":
        met = !!claim?.strong;
        reason = met
          ? "Your claim answers the question."
          : "Choose a claim that answers the question and can be supported.";
        break;
      case "evidence-source":
        met =
          strongCards.length >= minEvidence(a) &&
          !cards.some((c) => c.cls === "irrelevant" || c.cls === "other-claim");
        reason = met
          ? "Your evidence comes from the sources and backs your claim."
          : "Use at least " +
            minEvidence(a) +
            " strong cards, and none that are off topic or back a different claim.";
        break;
      case "evidence-variety": {
        if (a.sources.length < 2) continue;
        const n = new Set(strongCards.map((c) => cardOf(a, c.id).sourceId)).size;
        met = n >= 2;
        reason = met
          ? "Your strong evidence comes from more than one source."
          : "All of your strong evidence comes from one source. Look for a strong card in a different source.";
        break;
      }
      case "evidence-strong":
        met = !cards.some((c) => c.cls === "weak");
        reason = met
          ? "No weak cards remain."
          : "A weak card is still in your argument. Look for a more specific one.";
        break;
      case "reasoning-why":
        met = cards.length > 0 && cards.every((c) => state.reasoningOk?.[c.id]);
        reason = met
          ? "Each card has reasoning that explains why."
          : "Add reasoning that explains why for every card.";
        break;
      case "counterclaim":
        met = !!state.counterOk;
        reason = met
          ? "You acknowledged and answered another view."
          : "Write an acknowledgement and a rebuttal for another viewpoint.";
        break;
      default:
        met = !!state.selfChecks?.[chk.id];
        reason = met
          ? "You checked this yourself."
          : "Read your argument and decide. Tick the box when it is true.";
    }
    rows.push({
      id: chk.id,
      label: chk.label,
      met,
      reason,
      known: isKnownCheck(chk.id),
      required: chk.id !== "counterclaim" || mode === "required",
      challenge: chk.id === "counterclaim" && mode === "optional",
    });
  }
  return rows;
}

/** Concrete next steps computed from the learner's own choices. Never names a card or claim to pick. */
export function strengthenList(a, state, tier) {
  const out = [];
  const L = labelsFor(a);
  const cards = (state.evidenceIds || []).map((id) => ({
    card: cardOf(a, id),
    cls: classifyCard(cardOf(a, id), state.claimId),
  }));
  for (const c of cards.filter((x) => x.cls === "weak"))
    out.push(
      `Your card from "${sourceOf(a, c.card.sourceId).title}" is weak. ${c.card.feedback} Look for a more specific ${L.evidence.toLowerCase()} card.`,
    );
  const strong = cards.filter((x) => x.cls === "strong");
  if (a.sources.length > 1 && new Set(strong.map((c) => c.card.sourceId)).size < 2)
    out.push(
      "Use strong evidence from a second source so your claim does not rest on one document.",
    );
  const short = (state.evidenceIds || []).filter((id) => !state.reasoningOk?.[id]);
  if (short.length)
    out.push(
      `${short.length} of your cards ${short.length === 1 ? "has" : "have"} reasoning that is not finished. Explain why each one proves your point.`,
    );
  const mode = counterMode(a, tier);
  if (mode !== "none" && !state.counterOk)
    out.push(
      `Add an ${L.counter.toLowerCase()}: say what someone else might think, then answer it with a reason.`,
    );
  for (const r of evaluateChecks(a, state, tier))
    if (!r.known && !r.met) out.push(`Self-check: ${r.label}`);
  return out;
}

// ------------------------------------------------------------------ output
const stop = (s) => {
  const t = String(s || "").trim();
  return /[.!?"]$/.test(t) ? t : `${t}.`;
};
export function assembleText(a, state, view = "labeled") {
  const L = labelsFor(a);
  const claim = claimOf(a, state.claimId);
  const cards = (state.evidenceIds || []).map((id) => cardOf(a, id));
  const reasoning = (state.evidenceIds || []).map(
    (id) => state.reasoning?.[id]?.text?.trim() || "",
  );
  const counter =
    state.counter?.acknowledge || state.counter?.rebut
      ? [state.counter.acknowledge, state.counter.rebut].filter(Boolean).map(stop).join(" ")
      : "";
  if (view === "paragraph") {
    const lead = ["First", "Second", "Third", "Finally"];
    const parts = [stop(claim?.text)];
    cards.forEach((c, i) => {
      parts.push(
        stop(
          `${lead[Math.min(i, 3)]}, in "${sourceOf(a, c.sourceId).title}": "${c.text.replace(/[.!?]$/, "")}."`,
        ),
      );
      if (reasoning[i]) parts.push(stop(reasoning[i]));
    });
    if (counter) parts.push(counter);
    return parts.join(" ");
  }
  const lines = [`Question: ${a.question}`, `${L.claim}: ${claim?.text || ""}`];
  cards.forEach((c, i) =>
    lines.push(`${L.evidence} ${i + 1} (${sourceOf(a, c.sourceId).title}): "${c.text}"`),
  );
  reasoning.forEach((r, i) => lines.push(`${L.reasoning} ${i + 1}: ${r}`));
  if (counter) lines.push(`${L.counter}: ${counter}`);
  return lines.join("\n");
}
