#!/usr/bin/env node
/**
 * Batch CLI generator for BCPSS K–8 Classroom Resource Packets (.html + .docx).
 *
 * Usage:
 *   node scripts/generate-bcpss-packets.mjs --unit g6-math-u2 --wida 3_4
 *   node scripts/generate-bcpss-packets.mjs --grade 6 --wida 3_4
 *   node scripts/generate-bcpss-packets.mjs --all --wida 3_4
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { getUnitDetail } from "../functions/_lib/bcpss/db.js";
import {
  normalizeWidaTier,
  packetFilename,
  renderUnitDocxPacket,
  renderUnitHtmlPacket,
} from "../functions/_lib/bcpss/unit-packet.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT_DIR = resolve(ROOT, "output", "bcpss-packets");

function parseArgs(argv) {
  const opts = {
    grade: null,
    unit: null,
    wida: "3_4",
    all: false,
    outDir: DEFAULT_OUT_DIR,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--all") {
      opts.all = true;
    } else if (arg === "--grade" && argv[i + 1]) {
      opts.grade = String(argv[++i]).trim().toUpperCase();
    } else if (arg === "--unit" && argv[i + 1]) {
      opts.unit = String(argv[++i]).trim();
    } else if (arg === "--wida" && argv[i + 1]) {
      opts.wida = String(argv[++i]).trim();
    } else if (arg === "--out" && argv[i + 1]) {
      opts.outDir = resolve(process.cwd(), argv[++i]);
    }
  }
  return opts;
}

function printUsage() {
  console.log(
    [
      "BCPSS Classroom Resource Packet Generator",
      "",
      "Usage:",
      "  node scripts/generate-bcpss-packets.mjs [--grade 6] [--unit g6-math-u2] [--wida 3_4] [--all]",
      "",
      "Options:",
      "  --unit <id>      Generate packets for a single unit ID (e.g. g6-math-u2)",
      "  --grade <grade>  Generate packets for all units in a grade (K, 1..8)",
      "  --all            Generate packets for all 162 BCPSS K–8 units",
      "  --wida <tier>    WIDA tier: 1_2 | 3_4 | 5_6 | all (default: 3_4)",
      "  --out <dir>      Output directory (default: output/bcpss-packets)",
      "  --help           Show this help message",
    ].join("\n"),
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || (!opts.unit && !opts.grade && !opts.all)) {
    printUsage();
    process.exit(0);
  }

  let targetUnits = BCPSS_UNITS;
  if (opts.unit) {
    targetUnits = BCPSS_UNITS.filter((u) => u.id === opts.unit);
  } else if (opts.grade) {
    targetUnits = BCPSS_UNITS.filter((u) => String(u.grade).toUpperCase() === opts.grade);
  }

  if (!targetUnits.length) {
    console.error("No matching BCPSS units found for the given filter.");
    process.exit(1);
  }

  const tiers =
    opts.wida.toLowerCase() === "all" ? ["1_2", "3_4", "5_6"] : [normalizeWidaTier(opts.wida)];

  mkdirSync(opts.outDir, { recursive: true });

  const startMs = Date.now();
  let htmlCount = 0;
  let docxCount = 0;
  let totalBytes = 0;

  for (const unit of targetUnits) {
    const { detail } = await getUnitDetail({}, unit.id);
    if (!detail?.unit) continue;

    for (const tier of tiers) {
      const htmlName = packetFilename(detail.unit, tier, "html");
      const docxName = packetFilename(detail.unit, tier, "docx");

      const html = renderUnitHtmlPacket(detail, tier);
      const docx = renderUnitDocxPacket(detail, tier);

      writeFileSync(resolve(opts.outDir, htmlName), html, "utf8");
      writeFileSync(resolve(opts.outDir, docxName), docx);

      htmlCount++;
      docxCount++;
      totalBytes += Buffer.byteLength(html, "utf8") + docx.byteLength;
    }
  }

  const elapsedMs = Date.now() - startMs;
  const totalKb = (totalBytes / 1024).toFixed(1);
  console.log(
    `Generated ${htmlCount} HTML and ${docxCount} DOCX packets (${totalKb} KB) for ${targetUnits.length} unit(s) in ${elapsedMs}ms -> ${opts.outDir}`,
  );
}

main().catch((err) => {
  console.error("Packet generation failed:", err);
  process.exit(1);
});
