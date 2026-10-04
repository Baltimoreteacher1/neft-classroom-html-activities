#!/usr/bin/env node
/**
 * Printable packets for the ACCESS Practice Lab, generated at build time from
 * access-practice-lab/content/ (never committed):
 *
 *   dist/access-practice-lab/printables/<file>.html|.docx  STUDENT packets — no
 *       answer keys, no listening scripts (the teacher reads those aloud).
 *   dist/access-teacher/packets/<file>.html|.docx          TEACHER packets — answer
 *       keys, listening scripts, sample answers. /access-teacher/ is a teacher
 *       surface (password-gated by functions/_middleware.js).
 *
 * <file> is `<Domain>-<Level>` for grades 6–8 (the URLs the old lab linked) and
 * `g3-5-<Domain>-<Level>` for grades 3–5. Before 2026-10 the public packets
 * carried the answer key; they no longer do.
 *
 * Packet generation is a release requirement: missing visuals or files fail the build.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Packer } from "docx";
import { BANDS, loadBand, REPO_ROOT } from "./lib/access-lab-content.mjs";
import { packetDocx } from "./lib/access-packet-docx.mjs";
import { packetHTML } from "./lib/access-packet-html.mjs";

export { answerKey } from "./lib/access-packet-html.mjs";

const studentDir = process.argv[2] || join(REPO_ROOT, "dist", "access-practice-lab", "printables");
const teacherDir = process.argv[3] || join(REPO_ROOT, "dist", "access-teacher", "packets");
const fileBase = (band, domain, level) =>
  (band === "6-8" ? `${domain}-${level}` : `g3-5-${domain}-${level}`).replace(/\s+/g, "");

mkdirSync(studentDir, { recursive: true });
mkdirSync(teacherDir, { recursive: true });
const manifest = [];
let packets = 0;
for (const band of BANDS) {
  for (const { domain, data } of loadBand(band)) {
    for (const [level, L] of Object.entries(data.levels || {})) {
      if (!(L.activities || []).length) continue;
      const base = fileBase(band, domain, level);
      for (const [directory, teacher] of [
        [studentDir, false],
        [teacherDir, true],
      ]) {
        const job = { band, domain, level, L, teacher };
        writeFileSync(join(directory, `${base}.html`), packetHTML(job));
        writeFileSync(
          join(directory, `${base}.docx`),
          await Packer.toBuffer(await packetDocx(job)),
        );
        packets++;
      }
      manifest.push({ band, domain, level, base, count: L.activities.length });
    }
  }
}
for (const directory of [studentDir, teacherDir]) {
  writeFileSync(join(directory, "manifest.json"), JSON.stringify(manifest, null, 1));
}
console.log(
  `generate-access-printables: ${packets} HTML + ${packets} illustrated DOCX packets (${manifest.length} student + ${manifest.length} teacher)`,
);
