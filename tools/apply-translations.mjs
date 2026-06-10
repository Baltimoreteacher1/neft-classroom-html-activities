#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const LESSONS_DIR = path.join(REPO_ROOT, "lessons");
const TRANSLATIONS_FILE = path.join(__dirname, "vocab-translations.json");

function main() {
  if (!fs.existsSync(TRANSLATIONS_FILE)) {
    console.error(`Translations file not found: ${TRANSLATIONS_FILE}`);
    process.exit(1);
  }

  const translations = JSON.parse(fs.readFileSync(TRANSLATIONS_FILE, "utf8"));
  
  // Create a case-insensitive map for matching
  const tMap = new Map();
  for (let key in translations) {
    tMap.set(key.toLowerCase().trim(), translations[key]);
  }

  console.log(`Loaded ${tMap.size} translation entries.`);

  const lessonDirs = fs.readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith("_"))
    .map(d => d.name);

  let updatedLessons = 0;
  let updatedVocabs = 0;

  for (const dir of lessonDirs) {
    const configPath = path.join(LESSONS_DIR, dir, "config.json");
    if (!fs.existsSync(configPath)) continue;

    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      console.error(`Error reading ${dir}/config.json: ${e.message}`);
      continue;
    }

    if (!Array.isArray(cfg.vocabulary) || cfg.vocabulary.length === 0) continue;

    let modified = false;
    for (const v of cfg.vocabulary) {
      if (!v || !v.term) continue;

      const key = v.term.toLowerCase().trim();
      if (tMap.has(key)) {
        const trans = tMap.get(key);
        
        if (v.termVi !== trans.termVi) {
          v.termVi = trans.termVi;
          modified = true;
        }
        if (v.termAr !== trans.termAr) {
          v.termAr = trans.termAr;
          modified = true;
        }
        if (v.definitionVi !== trans.definitionVi) {
          v.definitionVi = trans.definitionVi;
          modified = true;
        }
        if (v.definitionAr !== trans.definitionAr) {
          v.definitionAr = trans.definitionAr;
          modified = true;
        }

        if (modified) {
          updatedVocabs++;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
      updatedLessons++;
    }
  }

  console.log(`Updated translations in ${updatedLessons} lessons (${updatedVocabs} vocab terms).`);

  // Now build the vocab bank!
  console.log("Running vocab-hub/build-bank.mjs...");
  const buildResult = spawnSync("node", ["vocab-hub/build-bank.mjs"], { cwd: REPO_ROOT, stdio: "inherit" });
  if (buildResult.status !== 0) {
    console.error("Vocab bank build failed.");
    process.exit(1);
  }

  console.log("Translations successfully applied and bank rebuilt!");
}

main();
