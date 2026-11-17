// TWR content gate: every band has exactly the strategies the registry promises, three sets each, and every set
// passes setProblems() (src/twr/model.js). Also holds what no shape check can: answers are not always first,
// no question repeats across the fleet, no timer or ESOL wording, and K-1 sets are audio-first (short, say mode).
// Usage: node tools/twr-content.test.mjs [--band K|1|2-3|3-5|6-8] [--strategies slug,slug]
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setProblems } from "../access-practice-lab/src/twr/model.js";
import {
  BAND_TOKEN,
  SETS_PER_STRATEGY,
  STRATEGY_LIST,
  strategiesFor,
  TWR_BANDS,
} from "../access-practice-lab/src/twr/registry.js";

const ROOT = join(
  fileURLToPath(new URL("..", import.meta.url)),
  "access-practice-lab",
  "content",
  "twr",
);
const TOKEN = BAND_TOKEN;
const arg = process.argv.indexOf("--band");
const only = arg > 0 ? process.argv[arg + 1] : null;
const bands = only ? [only] : TWR_BANDS;
const sArg = process.argv.indexOf("--strategies");
const onlyStrats = sArg > 0 ? process.argv[sArg + 1].split(",") : null;

const problems = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);
const seenPrompts = new Map();
const answerPos = { first: 0, other: 0 };
let sets = 0;
let items = 0;

for (const band of bands) {
  for (const strat of STRATEGY_LIST) {
    if (onlyStrats && !onlyStrats.includes(strat.slug)) continue;
    const file = join(ROOT, band, `${strat.slug}.json`);
    const wanted = strat.bands.includes(band);
    if (!existsSync(file)) {
      if (wanted) bad(`${band}/${strat.slug}`, "missing file");
      continue;
    }
    if (!wanted) {
      bad(
        `${band}/${strat.slug}`,
        "file exists but the registry has no such strategy for this band",
      );
      continue;
    }
    const data = JSON.parse(readFileSync(file, "utf8"));
    if (data.sets?.length !== SETS_PER_STRATEGY)
      bad(`${band}/${strat.slug}`, `needs ${SETS_PER_STRATEGY} sets`);
    (data.sets || []).forEach((s, n) => {
      const where = `${band}/${strat.slug}#${n + 1}`;
      sets += 1;
      if (s.id !== `${TOKEN[band]}-${strat.slug}-${n + 1}`)
        bad(where, `id must be ${TOKEN[band]}-${strat.slug}-${n + 1}`);
      for (const p of setProblems(s)) bad(where, p);
      const blob = JSON.stringify(s);
      if (/\bESOL\b/i.test(blob))
        bad(where, "says ESOL (use English learners / multilingual learners)");
      if (/timer|countdown|beat the clock|race the clock|seconds left/i.test(blob))
        bad(where, "timer wording");
      if (/[؀-ۿ]|\b(arabe|français|dari)\b/i.test(blob))
        bad(where, "language other than English/Spanish");
      (s.items || []).forEach((it, i) => {
        items += 1;
        const k = JSON.stringify([
          it.kind,
          it.prompt,
          it.text,
          it.options?.map((o) => o.text),
          it.parts,
          it.lines,
        ]).toLowerCase();
        if (seenPrompts.has(k)) bad(where, `item ${i + 1} repeats ${seenPrompts.get(k)}`);
        else seenPrompts.set(k, `${where} item ${i + 1}`);
        if (it.kind === "choice")
          answerPos[it.options[0]?.id === it.answer ? "first" : "other"] += 1;
      });
      if (band === "K" || band === "1") {
        if (!s.write?.say) bad(where, "K-1 writing step must be say mode (write.say: true)");
        if (s.items?.length > 6) bad(where, "K-1 sets carry at most 6 items");
      } else if (s.write?.say) bad(where, "say mode is for K-1 only");
    });
  }
  if (!only && !strategiesFor(band).length) bad(band, "no strategies");
}

if (answerPos.first + answerPos.other > 20)
  assert.ok(
    answerPos.first / (answerPos.first + answerPos.other) < 0.4,
    `right answer is first too often: ${JSON.stringify(answerPos)}`,
  );

if (problems.length) {
  console.error(
    `FAIL twr-content: ${problems.length} problem(s)\n${problems.slice(0, 80).join("\n")}`,
  );
  process.exit(1);
}
assert.ok(sets > 0, "swept zero sets");
console.log(`PASS twr-content: ${sets} sets, ${items} items, bands ${bands.join(", ")}`);
