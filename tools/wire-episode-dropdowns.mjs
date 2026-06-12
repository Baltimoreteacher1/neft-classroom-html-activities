#!/usr/bin/env node
/**
 * wire-episode-dropdowns.mjs
 * Adds the Axiom City episode dropdown (.axiom-eps) to the unit cards that
 * are missing it (units 1, 7, 8, 9, 10) in graphic-novels/index.html, with a
 * visible lesson sublabel so each episode maps to the lessons it belongs to.
 * Idempotent: re-running makes no further changes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IDX = join(ROOT, "graphic-novels", "index.html");

// unit -> [ {label, lessons, file} ] (order = dropdown order)
const EPS = {
  1: [
    ["E1 · Benchmark &amp; Brass", "Review · Fractions &amp; Decimals", "axiom-city-u1-e1-benchmark-and-brass.html"],
    ["E2 · Sequences &amp; Cubes", "Patterns &amp; Volume", "axiom-city-u1-e2-sequences-and-cubes.html"],
  ],
  7: [
    ["E1 · Lights Out", "Lessons 7-1, 7-2", "axiom-city-u7-e1-lights-out.html"],
    ["E2 · Signal in the Snow", "Lesson 7-3", "axiom-city-u7-e2-signal-in-the-snow.html"],
    ["E3 · The Grid Map", "Lessons 7-4, 7-5, 7-6", "axiom-city-u7-e3-the-grid-map.html"],
  ],
  8: [
    ["E1 · The Antechamber", "Lessons 8-1, 8-2", "axiom-city-u8-e1-the-antechamber.html"],
    ["E2 · The Gear Locks", "Lesson 8-3", "axiom-city-u8-e2-the-gear-locks.html"],
    ["E3 · The Fog Gallery", "Lessons 8-4, 8-5, 8-6", "axiom-city-u8-e3-the-fog-gallery.html"],
  ],
  9: [
    ["E1 · Lines That Talk", "Lessons 9-1, 9-2", "axiom-city-u9-e1-lines-that-talk.html"],
    ["E2 · The Rule in the Table", "Lessons 9-3, 9-4, 9-5", "axiom-city-u9-e2-the-rule-in-the-table.html"],
  ],
  10: [
    ["E1 · Festival to Night Market", "Capstone Remix · Pt 1", "axiom-city-u10-e1-festival-to-night-market.html"],
    ["E2 · Brightside to Boundless", "Capstone Remix · Pt 2", "axiom-city-u10-e2-brightside-to-boundless.html"],
  ],
};

let html = readFileSync(IDX, "utf8");
let changed = 0;

// 1) CSS: lesson-sublabel modifier for the new episode chips (once)
if (!html.includes(".axiom-eps .ep.ep-l")) {
  const css = `      .axiom-eps .ep.ep-l {
        flex-direction: column;
        gap: 2px;
        line-height: 1.2;
      }
      .axiom-eps .ep.ep-l small {
        font-weight: 600;
        font-size: 0.68rem;
        color: #8fb0ab;
        letter-spacing: 0.02em;
      }
`;
  html = html.replace("      .axiom-eps .ep:focus-visible {", css + "      .axiom-eps .ep:focus-visible {");
  changed++;
}

// 2) episode dropdowns per unit card
const cards = html.split(/(?=<!-- UNIT )/);
for (let i = 0; i < cards.length; i++) {
  const m = cards[i].match(/^<!-- UNIT (\d+) -->/);
  if (!m) continue;
  const unit = +m[1];
  const eps = EPS[unit];
  if (!eps) continue;
  if (cards[i].includes(`axiom-city-u${unit}-e1`)) continue; // already wired
  const block =
    `\n              <div class="axiom-eps">\n` +
    eps
      .map(
        ([label, lessons, file]) =>
          `                <a\n                  class="ep ep-l"\n                  href="axiom-city/episodes/${file}"\n                  >${label}<small>${lessons}</small></a\n                >`
      )
      .join("\n") +
    `\n              </div>`;
  // insert just before the </div> that closes the .axiom block (after the vol link)
  const axiomIdx = cards[i].indexOf('<div class="axiom">');
  if (axiomIdx < 0) continue;
  // find the closing </div> of .axiom: it's the </div> right before </div>\n        </article>
  const articleIdx = cards[i].indexOf("</article>", axiomIdx);
  const closeAxiom = cards[i].lastIndexOf("</div>", cards[i].lastIndexOf("</div>", articleIdx) - 1);
  cards[i] = cards[i].slice(0, closeAxiom) + block + "\n            " + cards[i].slice(closeAxiom);
  changed++;
  console.log(`✓ wired Unit ${unit} (${eps.length} episodes)`);
}

if (changed) {
  writeFileSync(IDX, cards.join(""));
  console.log(`\nUpdated index.html (${changed} change-sets).`);
} else {
  console.log("No changes — already wired.");
}
