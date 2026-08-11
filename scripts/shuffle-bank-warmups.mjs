#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());
const BANK_PATH = join(ROOT, "spiral-review", "bank.json");

// Fisher-Yates shuffle array and return new index of target item
function shuffleChoices(choices, correctIndex) {
  if (!choices || choices.length < 2 || correctIndex === undefined) {
    return { choices, correctIndex };
  }
  const correctChoice = choices[correctIndex];
  // Create indexed items
  const items = choices.map((c, i) => ({ text: c, isCorrect: i === correctIndex }));

  // Deterministic target distribution cycling 0, 1, 2, 3 based on hash
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const newChoices = shuffled.map((s) => s.text);
  const newCorrectIndex = shuffled.findIndex((s) => s.isCorrect);

  return { choices: newChoices, correctIndex: newCorrectIndex };
}

// 1. Shuffle bank.json questions
let bankUpdatedCount = 0;
if (readFileSync(BANK_PATH, "utf8")) {
  const bank = JSON.parse(readFileSync(BANK_PATH, "utf8"));
  if (Array.isArray(bank.questions)) {
    bank.questions.forEach((q) => {
      if (Array.isArray(q.choices) && q.correctIndex !== undefined) {
        const { choices: newChoices, correctIndex: newIdx } = shuffleChoices(
          q.choices,
          q.correctIndex,
        );
        q.choices = newChoices;
        q.correctIndex = newIdx;
        bankUpdatedCount++;
      }
    });
    writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2), "utf8");
    console.log(`Shuffled ${bankUpdatedCount} questions in spiral-review/bank.json!`);
  }
}

// 2. Scan lesson HTML files and shuffle embedded warmup JSON / options
let htmlUpdatedCount = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules" || name === "dist") continue;
    const full = join(dir, name);
    try {
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (name.endsWith(".html")) {
        processHtmlFile(full);
      }
    } catch (e) {}
  }
}

function processHtmlFile(filePath) {
  let content = readFileSync(filePath, "utf8");
  let modified = false;

  // Pattern: warmup question blocks with options: [...] and correct: X
  content = content.replace(
    /options:\s*(\[[^\]]+\]),\s*correct:\s*(\d+)/g,
    (match, optsStr, correctStr) => {
      try {
        const opts = JSON.parse(optsStr);
        const correctIdx = parseInt(correctStr, 10);
        const { choices: newOpts, correctIndex: newIdx } = shuffleChoices(opts, correctIdx);
        modified = true;
        htmlUpdatedCount++;
        return `options: ${JSON.stringify(newOpts)}, correct: ${newIdx}`;
      } catch (e) {
        return match;
      }
    },
  );

  if (modified) {
    writeFileSync(filePath, content, "utf8");
  }
}

walk(join(ROOT, "math"));
walk(join(ROOT, "lessons"));
walk(join(ROOT, "curriculum"));

console.log(`Updated embedded warmup choices in ${htmlUpdatedCount} HTML question blocks!`);
