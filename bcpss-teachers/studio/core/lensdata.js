// Adapters for the Language Lens: what text to read from a lesson pack or a BCPSS seed unit, which technical terms to
// seed from studio vocabulary collections, and how an analysis becomes an editable plan (text, HTML, copy, print).
import { FUNCTIONS } from "./lens-wordlists.js";
import { TIERS } from "../data/taxonomy.js";

const strings = (v) => {
  if (v == null || v === false) return [];
  if (typeof v === "string") return v.trim() ? [v.trim()] : [];
  if (typeof v === "number") return [String(v)];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (typeof v === "object")
    return ["title", "prompt", "text", "task", "label", "structure", "frame", "stem"].flatMap((k) =>
      strings(v[k]),
    );
  return [];
};

const section = (label, ...parts) => ({ label, text: parts.flatMap(strings).join("\n") });

/** Student-facing text of a lesson pack, by section. Teacher notes and the answer key are never read. */
export function studentSections(pack) {
  if (!pack) return [];
  const p = pack;
  const list = [
    section("Objectives", p.contentObjective, p.languageObjective),
    section("Launch", p.launch?.title, p.launch?.prompts),
    section("Teach", p.teach?.model, p.teach?.moves),
    section(
      "Guided practice",
      (p.guided || []).map((g) => [g.prompt, g.hint]),
    ),
    section(
      "Collaborate",
      p.collaborate?.title,
      p.collaborate?.task,
      p.collaborate?.roles,
      (p.collaborate?.discussionCards || []).map((c) => [c.prompt, c.frame]),
    ),
    section(
      "Teach it three ways",
      p.threeWays?.see?.title,
      p.threeWays?.discuss?.title,
      p.threeWays?.discuss?.structure,
      p.threeWays?.apply?.title,
      p.threeWays?.apply?.task,
      p.threeWays?.apply?.successCriteria,
    ),
    section(
      "Independent practice",
      (p.independent?.items || []).map((i) => [i.prompt, i.type === "choice" ? i.choices : null]),
    ),
    section(
      "Check understanding",
      (p.formative?.items || []).map((i) => i.prompt),
      p.exitTicket?.prompt,
      (p.exitTicket?.items || []).map((i) => i.prompt),
      p.exitTicket?.successCriteria,
    ),
    section("Extension", p.extension?.title, p.extension?.task),
  ];
  return list.filter((s) => s.text);
}

/** Student-facing text of a BCPSS seed unit detail (API shape: unit, connections, activities). */
export function unitSections(detail) {
  const d = detail?.detail || detail;
  if (!d?.unit) return [];
  const c = d.connections?.[0] || {};
  return [
    section("Unit summary", d.unit.unit_summary, d.unit.essential_question),
    section("Mentor sentence", c.mentor_sentence_unpacking?.mentor_sentence),
    section("Language frame", c.unit_example_frame),
    section(
      "Activity prompts",
      (d.activities || []).map((a) => a.student_prompt),
    ),
    section("Language exit ticket", c.language_exit_ticket_json?.prompt),
  ].filter((s) => s.text);
}

/** Words from a studio vocabulary collection (optionally only some ids) to seed the technical list. */
export function termsFromCollection(collection, ids) {
  const entries = collection?.entries || [];
  return entries
    .filter((e) => !ids?.length || ids.includes(e.id))
    .map((e) => e.word)
    .filter(Boolean);
}

/** Terms already named by a BCPSS unit's tier-2/3 vocabulary. */
export function termsFromUnit(detail) {
  const d = detail?.detail || detail;
  const out = [];
  for (const c of d?.connections || [])
    for (const v of c.tier2_tier3_vocab || []) if (v?.term) out.push(v.term);
  return [...new Set(out)];
}

const frameText = (f) => f.replace(/____/g, "...");
const TIER_NAME = Object.fromEntries(TIERS.map((t) => [t.id, t.short]));
const BARRIER_ACTION = {
  idiom: "Say what it means in plain words and show an example.",
  "phrasal-verb": "Replace it with a one-word verb on the board and act it out.",
  polysemy: "Show both meanings with pictures; ask which one fits the lesson.",
  "long-sentence": "Chunk it into parts, read it in pieces, then restate it in your own words.",
  "pronoun-chain": "Circle each pronoun and draw an arrow back to what it names.",
  negation: "Restate it as a positive sentence first.",
  "math-phrase": "Write the phrase beside its math form on the model.",
};
const STRUCTURE_LABEL = {
  subordination: "Sentences with because, although, when, which and similar connectors",
  conditionals: "If-then (conditional) sentences",
  passive: "Passive voice",
  comparatives: "Comparing words (-er than, more than, as ... as, most)",
  longNounPhrases: "Long noun phrases (7 or more words before the verb)",
  multiClause: "Sentences with 3 or more clauses",
};
const STRUCTURE_ACTION = {
  subordination: "Underline the connector and say which idea depends on which.",
  conditionals: "Act out both parts: what happens if, and what follows.",
  passive: "Ask who or what does the action, then rewrite it with the doer first.",
  comparatives: "Draw the two things being compared and label the comparison word.",
  longNounPhrases: "Find the main noun, then add the describing parts one at a time.",
  multiClause: "Number the clauses and say each one as its own short sentence.",
};

/** Suggested language objectives from the top detected functions. contentObjective only names the task; nothing is invented. */
export function suggestObjectives(analysis, { contentObjective = "" } = {}) {
  const parsed = /^\s*(?:i can|students will be able to|swbat)\s+(\w+)\s+(.+?)\.?\s*$/i.exec(contentObjective) || [];
  const verb = (parsed[1] || "").toLowerCase();
  const tail = parsed[2] || "";
  const terms = [...analysis.vocabulary.technical, ...analysis.vocabulary.academic].slice(0, 2).map((v) => `"${v.word}"`);
  return analysis.functions.slice(0, 3).map((f) => {
    const def = FUNCTIONS.find((x) => x.id === f.id);
    const what = !tail ? "what I learned" : verb === def.verb.split(" ")[0] ? tail : `my thinking about ${tail}`;
    const withTerms = terms.length ? `, using the words ${terms.join(" and ")} and` : ", using";
    return `I can ${def.verb} ${what} out loud and in writing${withTerms} the frame "${frameText(def.frames.exp[0])}".`;
  });
}

let counter = 0;
const item = (text, note = "") => ({ id: `i${++counter}`, text, note });

/** analysis -> editable plan. Every item is plain text a teacher can edit, remove, add to, or reorder. */
export function planFromAnalysis(
  a,
  { title = "Language plan", contentObjective = "", source = "" } = {},
) {
  counter = 0;
  const vocab = [...a.vocabulary.technical, ...a.vocabulary.academic].slice(0, 12);
  const sections = [
    {
      id: "objective",
      label: "Language objective ideas",
      items: suggestObjectives(a, { contentObjective }).map((t) => item(t)),
    },
    {
      id: "vocabulary",
      label: "Words to teach on purpose",
      items: vocab.map((v) =>
        item(
          `${v.word} (${v.kind === "academic" ? "academic word" : "subject word"}, used ${v.count} time${v.count === 1 ? "" : "s"}). In the text: "${v.example}"`,
        ),
      ),
    },
    {
      id: "functions",
      label: "Language functions students will use",
      items: a.functions
        .slice(0, 6)
        .map((f) => item(`${f.label}. Seen in the text through: ${f.cues.join(", ")}.`)),
    },
    {
      id: "structures",
      label: "Sentence structures to unpack",
      items: Object.keys(STRUCTURE_LABEL)
        .filter((k) => (a.structures[k]?.count || 0) > 0)
        .map((k) =>
          item(
            `${STRUCTURE_LABEL[k]}: ${a.structures[k].count} found. ${STRUCTURE_ACTION[k]} Example: "${a.structures[k].examples[0]}"`,
          ),
        ),
    },
    {
      id: "discourse",
      label: "Discourse expectations",
      items: a.discourse.map((d) => item(`${d.text.charAt(0).toUpperCase()}${d.text.slice(1)}. Why: ${d.because}`)),
    },
    {
      id: "barriers",
      label: "Possible barriers and supports",
      items: a.barriers
        .slice(0, 14)
        .map((b) =>
          item(
            `${b.type === "long-sentence" || b.type === "pronoun-chain" || b.type === "negation" ? b.text : `"${b.text}"`}: ${b.detail} ${BARRIER_ACTION[b.type] || ""}`.trim(),
          ),
        ),
    },
    {
      id: "visuals",
      label: "Pictures and models to add",
      items: a.visuals.map((v) => item(`Add ${v.advice} for: ${v.term}.`)),
    },
    { id: "oral", label: "Oral rehearsal moments", items: a.oral.map((o) => item(o.text)) },
    {
      id: "writing",
      label: "Writing scaffolds",
      items: a.writing.map((w) =>
        item(
          `${w.label}. ${["ee", "dev", "exp", "br"].map((t) => `${TIER_NAME[t]}: ${frameText(w.frames[t][0])}`).join("   |   ")}`,
        ),
      ),
    },
  ];
  return {
    id: `plan-${Date.now().toString(36)}`,
    title,
    grade: a.grade,
    subject: a.subject,
    source,
    note: "Language plan only. It shows the language the text asks of students, not how hard the concept is.",
    sections,
  };
}

export const newItem = (text = "") => item(text);

/** Plain-text version for copying. */
export function planToText(plan) {
  const lines = [
    plan.title,
    [plan.grade && `Grade ${plan.grade}`, plan.subject, plan.source].filter(Boolean).join(" | "),
    plan.note,
    "",
  ];
  for (const s of plan.sections) {
    const items = s.items.filter((i) => i.text.trim());
    if (!items.length) continue;
    lines.push(s.label.toUpperCase());
    items.forEach((i) => lines.push(`- ${i.text.trim()}`));
    lines.push("");
  }
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** Printable HTML for a plan (escaped; inserted by the view into a print-only container). */
export function planToHtml(plan) {
  const body = plan.sections
    .filter((s) => s.items.some((i) => i.text.trim()))
    .map(
      (s) =>
        `<section><h2>${esc(s.label)}</h2><ul>${s.items
          .filter((i) => i.text.trim())
          .map((i) => `<li>${esc(i.text.trim())}</li>`)
          .join("")}</ul></section>`,
    )
    .join("");
  const meta = [plan.grade && `Grade ${plan.grade}`, plan.subject, plan.source]
    .filter(Boolean)
    .join(" | ");
  return `<h1>${esc(plan.title)}</h1><p>${esc(meta)}</p><p><em>${esc(plan.note)}</em></p>${body}`;
}
