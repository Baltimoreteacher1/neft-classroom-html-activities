#!/usr/bin/env node
// add-1-2-city-blocks.mjs — close the one gap between the publisher deck for
// lesson 1-2 and the lesson itself.
//
//   node scripts/add-1-2-city-blocks.mjs [--dry-run]
//
// WHY
//
// Comparing the six Unit 1 "Editable Lesson Presentation" decks against the
// lesson configs turned up exactly one missing item: deck 1-2 closes on
// "Apply: City Blocks" (slide 50) and the lesson has no such task. Every other
// Apply in the unit is present — What Time Is It? (1-3), Another Option for the
// Community Garden (1-4), Baby Growth (1-5), Community Agreements (1-6).
//
// IMPORTANT, so nobody mistakes this for the publisher's task: that slide is a
// title and a decorative isometric city illustration with NO body text and NO
// speaker notes, and the wording lives in the Student Edition, which is not in
// the repo. The task below is therefore AUTHORED HERE, built to do the job the
// slide sits in: it applies this lesson's own mathematics — comparing fractions
// of the same whole (5.NF.B.4) and checking a solution for reasonableness — to
// the new city-block context the artwork sets up, exactly as "Which is the
// Tallest?" does earlier in the same deck. Replace it with the Student Edition
// wording if you want the publisher's version verbatim.
//
// Applied to lesson 1-2 and its small-group / catch-up variants. Idempotent.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const LESSONS = "lessons";
const TARGETS = /^1-2(?:-(?:group1|group2|catchup))?$/;

const ITEM = {
  type: "open-response",
  stem: "Apply — City Blocks. A city block has 12 buildings. The block to the north is planned to hold 2/3 as many buildings, and the block to the east is planned to hold 3/2 as many. WITHOUT computing, say which block will hold the most buildings and how you know. Then find the number of buildings on each block and check that your answers make sense.",
  modelAnswer:
    "The east block will hold the most, because 3/2 is greater than 1 and the other fractions are less than 1 — and all three describe the same 12 buildings. North: 2/3 × 12 = 8 buildings. East: 3/2 × 12 = 18 buildings. The original block has 12. The answers make sense because 8 is less than 12 and 18 is more than 12, which is what the fractions predicted.",
  sentenceStems: [
    "The ___ block will hold the most because its fraction is ___ than 1.",
    "I found ___ × 12 = ___ buildings, and that makes sense because ___.",
  ],
};

let files = 0;
for (const folder of readdirSync(LESSONS).sort()) {
  if (!TARGETS.test(folder)) continue;
  const file = join(LESSONS, folder, "config.json");
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  const practice = config.practice;
  if (!practice) continue;
  const tiers = ["approaching", "onLevel", "extending", "optional"];
  const already = tiers.some((tier) =>
    (practice[tier] || []).some((item) => String(item.stem || "").includes("City Blocks")),
  );
  if (already) continue;

  practice.extending = practice.extending || [];
  practice.extending.push({ ...ITEM });
  files++;
  if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

console.log(`${DRY ? "[dry-run] " : ""}City Blocks apply task: added to ${files} config(s)`);
