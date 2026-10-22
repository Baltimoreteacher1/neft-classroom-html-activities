#!/usr/bin/env node
/**
 * Report-only audit of the ACCESS Practice Lab activity bank: how much of each skill is real language
 * PRODUCTION (speaking aloud, extended writing) versus selected response or paper worksheets. Speaking and
 * Writing ability is shown by producing language, so a Speaking room that is mostly multiple choice is a
 * finding, not a feature. Prints the numbers and the shallowest rooms. Never fails the build.
 */
import { allActivities } from "./lib/access-lab-content.mjs";

const rows = {};
for (const { band, domain, level, activity: a } of allActivities()) {
  const key = `${band} ${domain} ${level}`;
  const r = (rows[key] ||= { production: 0, selected: 0, worksheet: 0, total: 0 });
  r.total++;
  if (a.type === "constructed") r.production++;
  else if (a.type === "worksheet") r.worksheet++;
  else r.selected++;
}
console.log("band domain level — production / selected-response / worksheet");
const shallow = [];
for (const [k, r] of Object.entries(rows)) {
  const share = r.production / r.total;
  console.log(
    `${k.padEnd(22)} ${String(r.production).padStart(3)} / ${String(r.selected).padStart(3)} / ${String(r.worksheet).padStart(3)}  (${Math.round(share * 100)}% production)`,
  );
  if (/Speaking|Writing/.test(k) && share < 0.5)
    shallow.push(`${k} (${Math.round(share * 100)}% production)`);
}
console.log(
  shallow.length
    ? `\nShallow Speaking/Writing rooms (<50% production): ${shallow.join("; ")}\nThese are served by the Speaking and Writing Studios; their selected-response items are labelled warm-ups.`
    : "\nEvery Speaking/Writing room is at least half production.",
);
