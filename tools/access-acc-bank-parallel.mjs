#!/usr/bin/env node
/**
 * Parallel skill groups for the item bank. Items that practice the SAME skill at the same demand (grade band, domain, academic
 * context, key language use, first language function) share meta.parallel, so the adaptive next-step can offer
 * NEW content for a skill instead of a repeat. Groups are computed, never typed: a group needs at least two items from at
 * least two different sets, otherwise the item gets none.
 *   node tools/access-acc-bank-parallel.mjs --check   fails if any file differs from the computed grouping
 *   node tools/access-acc-bank-parallel.mjs --write   rewrites meta.parallel in the set files
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadBank } from "./validate-access-bank.mjs";

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const abbr = (s) =>
  slug(s)
    .split("-")
    .map((w) => w[0])
    .join("");

export function computeGroups(sets) {
  const buckets = new Map();
  for (const s of sets)
    for (const i of s.items) {
      const m = i.meta || {};
      const key = [s.grade, i.domain, i.context, i.klu, m.functions?.[0]].join("|");
      (buckets.get(key) || buckets.set(key, []).get(key)).push({ setId: s.id, id: i.id });
    }
  const out = new Map();
  for (const [key, members] of buckets) {
    if (members.length < 2 || new Set(members.map((x) => x.setId)).size < 2) continue;
    const [grade, domain, context, klu, fn] = key.split("|");
    const id = `g${grade.replace("-", "").slice(0, 2)}-${domain.slice(0, 1).toLowerCase()}-${abbr(context)}-${slug(klu)}-${slug(fn)}`;
    for (const x of members) out.set(`${x.setId}:${x.id}`, id);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const loaded = loadBank();
  const groups = computeGroups(loaded.map((x) => x.set));
  let diffs = 0;
  for (const { file, set } of loaded) {
    let changed = false;
    for (const i of set.items) {
      const want = groups.get(`${set.id}:${i.id}`);
      if ((i.meta.parallel || undefined) !== want) {
        diffs++;
        changed = true;
        if (want) i.meta.parallel = want;
        else delete i.meta.parallel;
      }
    }
    if (changed && process.argv.includes("--write"))
      writeFileSync(
        join(new URL("../access-practice-lab/content/bank/", import.meta.url).pathname, file),
        `${JSON.stringify(set, null, 2)}\n`,
      );
  }
  const grouped = new Set(groups.values()).size;
  console.log(
    `access-acc-bank-parallel: ${grouped} group(s) covering ${groups.size} item(s); ${diffs} difference(s) from the files`,
  );
  if (process.argv.includes("--check") && diffs) process.exit(1);
}
