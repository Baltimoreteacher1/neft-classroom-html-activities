// Instructional planning logic: turns a reported profile into findings laid out as What the data suggests ->
// What evidence to gather -> What to teach next -> Language Page resources, and builds a practice assignment
// through the Teacher Hub's own assignment format (assign.js), saved to the hub's own saved-assignments list.
// A finding is a starting point the teacher accepts, edits or rejects; it never prescribes from one score.
import { assignmentLink, selectItems } from "../../access-practice-lab/src/acc/adapt/assign.js";
import { DEST_BY_ID } from "../../access-practice-lab/src/sitemap.js";
import { domainProfile, guidanceFor } from "./interpret.js";
import { DOMAINS } from "./rules.js";

/** Existing Language Page destinations per need, from the site map (ids in src/sitemap.js). */
export const RESOURCES = Object.freeze({
  Listening: ["listening", "voice", "conversation", "access-prep"],
  Speaking: ["speak", "extempore-speak", "scenarios", "arena", "communication"],
  Reading: ["reading-practice", "ladder", "mentor", "reading-room", "science-of-reading"],
  Writing: ["write", "sentences", "evidence", "construction", "book-studio"],
  Vocabulary: ["vocabulary", "wordlab", "flashcards"],
  Teacher: ["lesson-builder", "library", "explore"],
});

const BASE = "/access-practice-lab";
export function hrefOf(id) {
  const d = DEST_BY_ID?.[id] || DEST_BY_ID?.get?.(id);
  if (!d) return null;
  return d.href.startsWith("/") ? d.href : `${BASE}/${d.href}`;
}
export function titleOf(id) {
  const d = DEST_BY_ID?.[id] || DEST_BY_ID?.get?.(id);
  return d ? (Array.isArray(d.title) ? d.title[0] : d.title.en || String(d.title)) : id;
}
/** A link node to one destination (DOM). */
export function resourceLink(id) {
  const href = hrefOf(id);
  if (!href) return null;
  const a = document.createElement("a");
  a.href = href;
  a.textContent = titleOf(id);
  a.className = "pi-res";
  a.setAttribute("data-resource", id);
  return a;
}

const EVIDENCE = {
  Listening: "a short listen with three detail questions and one retell",
  Speaking:
    "a recorded explanation (60-90 seconds) of a familiar process, with and without a frame",
  Reading: "a short informational passage with two evidence questions",
  Writing: "a one-paragraph explanation written independently, then one with a frame",
};
const NEED_WORDS = {
  Listening: "Additional evidence of listening for detail and main idea would be useful.",
  Speaking: "Additional evidence of extended oral explanation would be useful.",
  Reading: "Additional evidence of reading informational text for evidence would be useful.",
  Writing: "Additional evidence of independent written explanation would be useful.",
};

/**
 * Findings for one record. Each: { id, domain, suggests, gather, teach: [..], resources: [ids], basis }.
 * A relative need is offered first; when the profile is flat, the lowest domain is still offered as an
 * "evidence to gather" finding rather than a need.
 */
export function findingsFor(record) {
  if (!record) return [];
  const prof = domainProfile(record);
  const out = [];
  const domains = DOMAINS.filter((d) => record.domains[d].level != null).sort(
    (a, b) => record.domains[a].level - record.domains[b].level,
  );
  for (const d of domains.slice(0, 2)) {
    const g = guidanceFor(record.domains[d].level);
    const primary = d === prof.need && prof.gap >= 0.5;
    out.push({
      id: `${record.assessmentId}:${d}`,
      domain: d,
      suggests: primary
        ? `${prof.text} ${NEED_WORDS[d]}`
        : `${d} is among the lower reported domains. ${NEED_WORDS[d]}`,
      gather: `Collect ${EVIDENCE[d]}.`,
      teach: [
        `Model ${g.functions.split(",")[0]} with a think-aloud.`,
        `Offer optional sentence resources: ${g.sentence}.`,
        d === "Speaking" || d === "Writing"
          ? `Assign the task: ${d === "Speaking" ? g.speaking : g.writing}.`
          : `Practice: ${g.discourse}.`,
        "Give specific feedback, then assign an independent transfer task and compare both attempts.",
      ],
      resources: [...RESOURCES[d], ...RESOURCES.Vocabulary.slice(0, 1)],
      basis: primary ? "relative need" : "lower domain",
    });
  }
  return out;
}

/** Build a one-domain practice assignment link from the item bank index (the hub's own format). */
export function buildAssignment(bankIndex, { domain, grade = "6-8", count = 8, title }) {
  const bank = bankIndex.sets.flatMap((s) =>
    s.items.map((i) => ({ ...i, setId: s.id, grade: s.grade, domain: s.domain })),
  );
  const spec = {
    kind: "domain",
    grade,
    domain,
    count,
    title: title || `${domain} practice`,
    includeProductive: domain === "Speaking" || domain === "Writing",
  };
  const picks = selectItems(bank, spec);
  return { spec, picks, link: picks.length ? assignmentLink(BASE, spec, picks) : null };
}
