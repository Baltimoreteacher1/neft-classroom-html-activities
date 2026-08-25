import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Load notebook-checkpoint module
import {
  canLeavePhase,
  mountNotebookCheckpoint,
  openMathNotesModel,
  readCheckpoints,
} from "../engine/core/notebook-checkpoint.js";

// Mock document for headless node environment
if (typeof document === "undefined") {
  globalThis.document = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: "",
        id: "",
        attributes: {},
        innerHTML: "",
        children: [],
        style: {},
        dataset: {},
        get textContent() {
          return el.innerHTML;
        },
        set textContent(v) {
          el.innerHTML = String(v ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        },
        setAttribute(k, v) {
          el.attributes[k] = v;
        },
        getAttribute(k) {
          return el.attributes[k] || null;
        },
        querySelector(_sel) {
          return {
            addEventListener() {},
          };
        },
        querySelectorAll(_sel) {
          return [];
        },
        addEventListener() {},
        remove() {},
        showModal() {},
        close() {},
        append(...kids) {
          el.children.push(...kids);
        },
      };
      return el;
    },
    getElementById(_id) {
      return null;
    },
    // openMathNotesModel() reads document.documentElement.lang to decide whether
    // to open in Spanish. The mock predates that read, so every call threw
    // "Cannot read properties of undefined (reading 'lang')" and this whole
    // sweep died on lesson 1-1 — a harness gap, not a product defect. English is
    // the right default here: the Spanish path is exercised by passing
    // defaultLang explicitly.
    documentElement: { lang: "en" },
    body: {
      append() {},
    },
  };
}

// 1. Sweep all 84 core lessons
const coreLessons = readdirSync(join(ROOT, "lessons"), { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d+-\d+$/.test(e.name))
  .map((e) => e.name)
  .sort((a, b) => {
    const [uA, lA] = a.split("-").map(Number);
    const [uB, lB] = b.split("-").map(Number);
    return uA !== uB ? uA - uB : lA - lB;
  });

assert.equal(coreLessons.length, 84, "expected exactly 84 core lessons");

let totalRulesSourced = 0;
let totalVocabSourced = 0;

for (const lessonId of coreLessons) {
  const configPath = join(ROOT, "lessons", lessonId, "config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));

  // Checkpoints validation
  const checkpoints = readCheckpoints(config);
  assert.ok(
    checkpoints.length >= 2,
    "lesson " + lessonId + " must have at least 2 checkpoints (Math Words and Today Math)",
  );

  const b1 = checkpoints.find((c) => c.box === 1);
  const b2 = checkpoints.find((c) => c.box === 2);

  assert.ok(b1, "lesson " + lessonId + " is missing box 1 checkpoint");
  assert.ok(b2, "lesson " + lessonId + " is missing box 2 checkpoint");

  // Box 1 (Vocab)
  assert.ok(
    b1.copyPanel && Array.isArray(b1.copyPanel.items) && b1.copyPanel.items.length > 0,
    "lesson " + lessonId + " box 1 copyPanel must have non-empty vocabulary items",
  );
  totalVocabSourced++;

  // Box 2 (Mathematical Rule / Formula)
  const rule = b2.copyPanel && String(b2.copyPanel.rule || "").trim();
  assert.ok(
    Boolean(rule),
    "lesson " +
      lessonId +
      " box 2 copyPanel must have a non-empty rule string (no generic fallback allowed)",
  );
  totalRulesSourced++;

  // Verify modal generation for this lesson
  const dlg = openMathNotesModel(config);
  assert.ok(dlg, "openMathNotesModel must return dialog element for " + lessonId);
  const escapedRule = rule.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  assert.ok(
    dlg.innerHTML.includes(escapedRule),
    "openMathNotesModel dialog must render lesson " + lessonId + " exact rule",
  );
}

assert.equal(totalRulesSourced, 84, "expected 84/84 rules sourced from lesson config");
assert.equal(totalVocabSourced, 84, "expected 84/84 vocab sets sourced from lesson config");

// 2. Test elimination of inline phase gating
for (let from = 0; from < 7; from++) {
  assert.equal(
    canLeavePhase({}, from, from + 1),
    true,
    "canLeavePhase from phase " + from + " to " + (from + 1) + " must always be ungated (true)",
  );
}
assert.equal(
  mountNotebookCheckpoint({}, {}, 2),
  null,
  "mountNotebookCheckpoint must be null (no inline typing blocks rendered)",
);

// 3. Negative Controls (Fail Loudly on Missing Data)
assert.throws(
  () => {
    openMathNotesModel({ lessonId: "test-missing-nb", notebook: null });
  },
  /Math Notes: lesson test-missing-nb declares no usable notebook data/,
  "negative control A: missing notebook config must fail loudly naming lesson",
);

assert.throws(
  () => {
    openMathNotesModel({
      lessonId: "test-missing-rule",
      notebook: {
        checkpoints: [
          { box: 1, phase: "launch", copyPanel: { items: [{ term: "a", meaning: "b" }] } },
          { box: 2, phase: "explore", copyPanel: {} },
        ],
      },
    });
  },
  /Math Notes: lesson test-missing-rule is missing box 2 copyPanel rule/,
  "negative control B: missing box 2 rule must fail loudly naming lesson",
);

console.log(
  "✓ Math Notes validation passed: " +
    totalRulesSourced +
    "/84 core lessons sourced with mathematical provenance.",
);
console.log("✓ Inline phase gating eliminated: all phase transitions freely ungated.");
console.log("✓ Negative controls passed: loud failure on missing/empty data confirmed.");
