// CardForge shared utilities. No external dependencies — Node ESM only.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const CF_ROOT = resolve(REPO_ROOT, "tools/cardforge");

export function readJSON(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export function writeJSON(path, obj) {
  writeFile(path, JSON.stringify(obj, null, 2) + "\n");
}

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export { existsSync, readFileSync, readdirSync, resolve };

// Generic AI-slop phrases CardForge flags in any teacher/student-facing prose.
export const AI_SLOP_PHRASES = [
  "robust", "seamless", "seamlessly", "unlock", "delve", "leverage", "leveraging",
  "elevate", "supercharge", "game-changer", "game changer", "cutting-edge",
  "in today's fast-paced", "in the realm of", "navigate the", "tapestry",
  "embark on a journey", "unleash", "harness the power", "revolutionize",
  "dive deep", "look no further", "best-in-class", "world-class", "synergy",
];

// CCSS Grade 6 code pattern, e.g. 6.SP.3, 6.RP.3a, 6.NS.6b
export const CCSS_RE = /\b6\.(RP|NS|EE|G|SP)\.\d+[a-d]?\b/g;

// Scan prose for AI-slop phrases; returns array of {phrase, count}.
export function scanSlop(text) {
  const lower = String(text).toLowerCase();
  const hits = [];
  for (const phrase of AI_SLOP_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    const m = lower.match(re);
    if (m) hits.push({ phrase, count: m.length });
  }
  return hits;
}

// Evaluate a *clean inline* mean/median/range claim for QA sanity, e.g.
// "mean of 2, 4, 6 = 4". Intentionally strict: it only fires when the operand
// list (numbers/commas/spaces only) sits directly between "of" and "=", so it
// never misreads answer lines like "Mean = 5" (no operands) or worked
// expressions with ÷/+ symbols. It is a safety net, not a full CAS.
export function checkStatClaim(text) {
  const m = String(text).match(
    /\b(mean|median|range)\s+of\s+(-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)+)\s*(?:=|is|→|->)\s*(-?\d+(?:\.\d+)?)\b/i,
  );
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const nums = m[2].split(/[,\s]+/).map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length < 2) return null;
  const claimed = Number(m[3]);
  let actual;
  if (kind === "mean") actual = nums.reduce((a, b) => a + b, 0) / nums.length;
  else if (kind === "range") actual = Math.max(...nums) - Math.min(...nums);
  else {
    const s = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    actual = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  const ok = Math.abs(actual - claimed) < 0.01;
  return { kind, claimed, actual: Math.round(actual * 100) / 100, ok };
}
