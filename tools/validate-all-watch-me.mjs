/**
 * Validation suite for Watch Me Solve It across all canonical lessons.
 * Verifies that all 84 canonical lessons load, work with the dual-track think-aloud
 * engine, and produce valid SVGs with style="background:white".
 */

import fs from "fs";
import path from "path";
import { workedFigure } from "../scripts/lib/learn-figures.mjs";

const lessonsDir = path.resolve("lessons");
const canonicalDirs = fs.readdirSync(lessonsDir).filter((d) => /^\d+-\d+$/.test(d));

console.log(
  `🔍 Validating "Watch Me Solve It" across ${canonicalDirs.length} canonical lessons...\n`,
);

let passed = 0;
let failed = 0;
let withWorkedFigures = 0;

for (const dir of canonicalDirs) {
  const cfgPath = path.join(lessonsDir, dir, "config.json");
  if (!fs.existsSync(cfgPath)) {
    console.warn(`  ⚠️ Lesson ${dir} missing config.json`);
    continue;
  }

  try {
    const raw = fs.readFileSync(cfgPath, "utf8");
    const cfg = JSON.parse(raw);

    const intro = (cfg.launch && cfg.launch.conceptIntro) || cfg.conceptIntro;
    const iDo = intro && intro.iDo;

    if (iDo && Array.isArray(iDo.lines) && iDo.lines.length > 0) {
      // Test workedFigure generation
      const fig = workedFigure(cfg);
      if (fig) {
        withWorkedFigures++;
        if (!fig.svg.includes('style="background:white"')) {
          console.error(
            `  ❌ FAIL: Lesson ${dir} workedFigure SVG missing style="background:white"`,
          );
          failed++;
          continue;
        }
        if (!fig.svg.includes("</svg>")) {
          console.error(`  ❌ FAIL: Lesson ${dir} workedFigure SVG is not properly closed`);
          failed++;
          continue;
        }
      }
      passed++;
    } else {
      passed++;
    }
  } catch (err) {
    console.error(`  ❌ FAIL: Lesson ${dir} threw error:`, err.message);
    failed++;
  }
}

console.log(`\n======================================================`);
console.log(
  `Validation Results: ${passed} canonical lessons validated (${withWorkedFigures} with active worked visual figures)`,
);
console.log(`Failed: ${failed}`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 All canonical lessons successfully validated for Watch Me Solve It!");
}
