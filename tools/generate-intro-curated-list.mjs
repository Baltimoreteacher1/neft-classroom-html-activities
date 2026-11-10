#!/usr/bin/env node
/**
 * Writes docs/languageos/intro-curated-activities.md: the maintainer-facing list of the curated introduction activities,
 * their verified routes, and where each appears. Source: access-practice-lab/src/intro/data.js.
 *   node tools/generate-intro-curated-list.mjs          write the file
 *   node tools/generate-intro-curated-list.mjs --check  fail if the file is stale (run by the intro test)
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  ACTIVITIES,
  APPEARANCES,
  absUrl,
  ENTRANCE,
  FEATURED_LESSON,
  ROUTES,
  SUPPLEMENTAL,
} from "../access-practice-lab/src/intro/data.js";

const OUT = new URL("../docs/languageos/intro-curated-activities.md", import.meta.url);

export function build() {
  const row = (a) =>
    `| ${a.name} | ${a.where} | \`${a.route}\` | ${a.time} | ${APPEARANCES[a.id].join("; ")} |`;
  return `# The Language Page introduction: curated activities

Generated from \`access-practice-lab/src/intro/data.js\` by \`tools/generate-intro-curated-list.mjs\`. Do not edit by hand.
The introduction is **curated**: new site activities are never added to the tour, exploration or quick guide automatically.
To change the set, edit \`ACTIVITIES\` / \`SUPPLEMENTAL\` and \`APPEARANCES\` in \`data.js\`, regenerate this file, and re-run
\`node --test tools/access-intro.test.mjs\` (it re-checks every route against the lab's real content).

Single entrance for the whole PD: **${ENTRANCE.url}** (one link, one QR code).

## Speaking and writing (${ACTIVITIES.length})

| Activity | Where | Lab route | Time | Appears in |
| --- | --- | --- | --- | --- |
${ACTIVITIES.map(row).join("\n")}

## Explore Later (${SUPPLEMENTAL.length})

| Resource | Where | Lab route | Time | Appears in |
| --- | --- | --- | --- | --- |
${SUPPLEMENTAL.map(row).join("\n")}

## Featured lesson

${FEATURED_LESSON.title}, anchored on \`${FEATURED_LESSON.anchor}\`. Change \`FEATURED_LESSON.anchor\` and the prompt fields to feature another activity.

## Introduction pages

${Object.entries(ROUTES)
  .map(([k, r]) => `- ${k}: ${absUrl(r)}`)
  .join("\n")}
`;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const text = build();
  if (process.argv.includes("--check")) {
    if (readFileSync(OUT, "utf8") !== text) {
      console.error(
        "intro-curated-activities.md is stale: run node tools/generate-intro-curated-list.mjs",
      );
      process.exit(1);
    }
    console.log("intro-curated-activities.md is current.");
  } else {
    writeFileSync(OUT, text);
    console.log("wrote docs/languageos/intro-curated-activities.md");
  }
}
