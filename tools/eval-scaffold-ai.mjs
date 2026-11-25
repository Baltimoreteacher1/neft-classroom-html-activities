// Evaluation harness for the Scaffold Studio helpers (ask-the-passage, writing feedback), run through the adapter.
// By default it evaluates the deterministic fallback that ships. To evaluate a candidate provider before it is ever
// enabled:  node tools/eval-scaffold-ai.mjs --provider ./path/to/provider.mjs   (default export: async (task, payload))
// Thresholds are release gates for any provider: answers must point at the passage, unanswerable questions must be
// refused every time, and writing feedback must never contain a score, level or placement.
import { pathToFileURL } from "node:url";
import { createAdapter } from "../access-practice-lab/src/scaffold/ai/adapter.js";

const PASSAGE =
  "Roots grow down into the soil. The roots take in water and nutrients. A stem grows up toward the light. Leaves use sunlight to make food for the plant. Seeds grow into new plants.";
export const THRESHOLDS = { answerable: 0.9, refusal: 1.0, writingClean: 1.0 };

// Personas differ in how they ask, as students at different WIDA levels do.
export const PERSONAS = {
  "newcomer (level 1)": [
    ["roots water", "The roots take in water and nutrients."],
    ["stem light", "A stem grows up toward the light."],
    ["leaves food", "Leaves use sunlight to make food for the plant."],
  ],
  "developing (level 3)": [
    ["What do roots take in?", "The roots take in water and nutrients."],
    ["Where do the roots grow?", "Roots grow down into the soil."],
    ["What do seeds turn into?", "Seeds grow into new plants."],
  ],
  "bridging (level 5)": [
    ["How do leaves help the plant get food?", "Leaves use sunlight to make food for the plant."],
    ["Which direction does the stem grow and why?", "A stem grows up toward the light."],
  ],
};
export const UNANSWERABLE = [
  "Who is the president?",
  "How tall is a sunflower?",
  "What is the capital of Maryland?",
  "Can fish fly?",
  "Tell me a joke",
];
export const WRITING = [
  "first plant a seed",
  "Water the plant. Give it light.",
  "roots stem leaves",
  "I like plants because they grow.",
  "",
];
const BAD = /\b(score|grade|level \d|points|percent|placement|proficien|\d+\s?%|\d+\s?\/\s?\d+)\b/i;

export async function evaluate(provider) {
  const ad = createAdapter(
    provider ? { release: { aiEnabled: true }, hostname: "localhost", provider } : {},
  );
  const r = { answerable: [0, 0], refusal: [0, 0], writingClean: [0, 0], failures: [] };
  for (const [persona, cases] of Object.entries(PERSONAS))
    for (const [q, want] of cases) {
      const { result } = await ad.run("ask", { passage: PASSAGE, question: q });
      r.answerable[1]++;
      if (!result.refused && result.evidence === want) r.answerable[0]++;
      else r.failures.push(`answerable [${persona}] "${q}"`);
    }
  for (const q of UNANSWERABLE) {
    const { result } = await ad.run("ask", { passage: PASSAGE, question: q });
    r.refusal[1]++;
    if (result.refused) r.refusal[0]++;
    else r.failures.push(`should refuse "${q}"`);
  }
  for (const text of WRITING) {
    const { result } = await ad.run("write", { text, opts: { keyWords: ["roots", "stem"] } });
    r.writingClean[1]++;
    const body = JSON.stringify([result.working, result.next, result.why]);
    const ordered =
      Array.isArray(result.working) &&
      Array.isArray(result.next) &&
      Array.isArray(result.why) &&
      result.limit?.en;
    if (!BAD.test(body) && !("score" in result) && ordered) r.writingClean[0]++;
    else r.failures.push(`writing "${text.slice(0, 20)}"`);
  }
  return r;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--provider");
  const provider = i > 0 ? (await import(pathToFileURL(process.argv[i + 1]).href)).default : null;
  const r = await evaluate(provider);
  let ok = true;
  for (const k of Object.keys(THRESHOLDS)) {
    const [a, b] = r[k];
    const rate = a / b;
    const pass = rate >= THRESHOLDS[k];
    ok &&= pass;
    console.log(`${pass ? "PASS" : "FAIL"} ${k}: ${a}/${b} (need ${THRESHOLDS[k] * 100}%)`);
  }
  if (r.failures.length) console.log(`  ${r.failures.join("\n  ")}`);
  console.log(
    `${ok ? "PASS" : "FAIL"} eval-scaffold-ai (${provider ? "provider" : "deterministic fallback"})`,
  );
  process.exit(ok ? 0 : 1);
}
