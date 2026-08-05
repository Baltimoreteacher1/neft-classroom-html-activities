import crypto from "crypto";
import fs from "fs";
import path from "path";

const ROOT = "/Users/joelneft/neft-classroom-html-activities";

function pseudoRandomChoice(seed, max) {
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  const val = parseInt(hash.substring(0, 8), 16);
  return val % max;
}

function shuffleQuestionChoices(q, seedStr) {
  if (!q.choices || !Array.isArray(q.choices) || q.choices.length < 2) return false;

  const origIndex = typeof q.correctIndex === "number" ? q.correctIndex : 0;
  const correctChoice = q.choices[origIndex];

  if (!correctChoice) return false;

  // Target a new index (0, 1, 2, 3) pseudo-randomly based on seed
  const targetIndex = pseudoRandomChoice(seedStr, q.choices.length);

  if (targetIndex === origIndex && q.choices.length > 1) {
    // Force move if it's 0 every time
    const newIdx = (origIndex + 1 + (seedStr.length % (q.choices.length - 1))) % q.choices.length;
    q.choices.splice(origIndex, 1);
    q.choices.splice(newIdx, 0, correctChoice);
    q.correctIndex = newIdx;
    return true;
  }

  q.choices.splice(origIndex, 1);
  q.choices.splice(targetIndex, 0, correctChoice);
  q.correctIndex = targetIndex;
  return true;
}

let filesShuffled = 0;
let questionsShuffled = 0;

function processJsonFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    return;
  }

  let modified = false;

  // 1. Process warmup object in config.json
  if (data.warmup && Array.isArray(data.warmup.questions)) {
    data.warmup.questions.forEach((q, idx) => {
      const seed = `${path.basename(path.dirname(filePath))}-warmup-${q.id || idx}-${q.stem || ""}`;
      if (shuffleQuestionChoices(q, seed)) {
        questionsShuffled++;
        modified = true;
      }
    });
  }

  // 2. Process lessons manifest or general question arrays
  if (Array.isArray(data.lessons)) {
    data.lessons.forEach((l) => {
      if (l.warmup && Array.isArray(l.warmup.questions)) {
        l.warmup.questions.forEach((q, idx) => {
          const seed = `${l.id}-manifest-warmup-${q.id || idx}`;
          if (shuffleQuestionChoices(q, seed)) {
            questionsShuffled++;
            modified = true;
          }
        });
      }
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    filesShuffled++;
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        walkDir(fullPath);
      }
    } else if (entry.name.endsWith(".json")) {
      processJsonFile(fullPath);
    }
  }
}

walkDir(ROOT);

console.log(
  `Successfully shuffled choices and updated correctIndex across ${questionsShuffled} warmup questions in ${filesShuffled} lesson JSON files!`,
);
