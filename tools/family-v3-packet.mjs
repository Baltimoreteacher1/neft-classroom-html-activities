#!/usr/bin/env node
/**
 * Prints a compact authoring packet per lesson for the family homework v3 block: everything an author
 * needs, a few hundred words instead of whole sidecars. Read-only.
 *
 *   node tools/family-v3-packet.mjs 6-3 6-3-part2 ...
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT, tryLoadLessonConfig } from "./lib/curriculum-source.mjs";
import { isEarlier, lessonOrder } from "./lib/family-v3.mjs";

const NOTES = join(REPO_ROOT, "data", "family-homework-notes");
const notes = (id) => JSON.parse(readFileSync(join(NOTES, `${id}.json`), "utf8"));
const en = (x) => (x && typeof x === "object" ? x.en : x) ?? "";
const clip = (s, n = 400) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .slice(0, n);

const manifest = JSON.parse(
  readFileSync(join(REPO_ROOT, "data", "curriculum-manifest.json"), "utf8"),
);
const titles = new Map((manifest.lessons || []).map((l) => [l.id ?? l.lessonId, l.title]));

for (const id of process.argv.slice(2)) {
  const d = notes(id);
  const c = tryLoadLessonConfig(id) || {};
  const base = id.replace(/-part\d$/, "");
  const bc = tryLoadLessonConfig(base) || {};
  const iDo = c.launch?.conceptIntro?.iDo || bc.launch?.conceptIntro?.iDo;
  const prior = [...titles.keys()]
    .filter((k) => lessonOrder(k) && isEarlier(k, id) && !/-(part\d|group|catch)/.test(k))
    .sort((a, b) => lessonOrder(b)[0] - lessonOrder(a)[0] || lessonOrder(b)[1] - lessonOrder(a)[1])
    .slice(0, 8)
    .map((k) => `${k} ${clip(en(titles.get(k)), 55)}`);
  const vocab = (d.vocabulary?.length ? d.vocabulary : c.vocabulary || []).map(
    (v) => `${v.term}${v.termEs ? ` / ${v.termEs}` : ""}`,
  );
  console.log(
    `\n===== ${id} | ${clip(d.sessionTitle || c.title, 90)} | ${c.standard || bc.standard}${/-part\d$/.test(id) ? " | PART PAGE: glitch REQUIRED, topicKey ends -apply" : ""}`,
  );
  console.log(`objective: ${clip(c.contentObjective || bc.contentObjective, 200)}`);
  console.log(`learningTonight: ${clip(en(d.learningTonight))}`);
  console.log(`bigIdea: ${clip(en(d.bigIdea))}`);
  console.log(`class model (bridge.class): ${clip(en(d.bridge?.class))}`);
  console.log(
    `worked example: ${clip(iDo ? `${iDo.title} :: ${(iDo.lines || []).join(" ")}` : "(none authored)", 600)}`,
  );
  console.log(`tryTogether: ${clip(d.tryTogether?.scenarioEn, 300)}`);
  console.log(`watchFor: ${(d.watchFor || []).map((w) => clip(en(w), 160)).join(" | ")}`);
  console.log(`corner.watchOut: ${clip(en(d.corner?.watchOut), 200)}`);
  console.log(
    `basic practice stems: ${(d.basicPractice || []).map((b) => clip(b.stem, 90)).join(" | ")}`,
  );
  console.log(`page vocabulary (v3.vocab terms MUST come from these): ${vocab.join("; ")}`);
  console.log(`spiral candidates (most recent earlier lessons): ${prior.join(" ; ")}`);
}
