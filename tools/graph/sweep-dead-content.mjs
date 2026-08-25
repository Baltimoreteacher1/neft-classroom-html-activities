#!/usr/bin/env node
/**
 * Site-wide sweep for copy that renders nowhere.
 *
 * Many pages here carry their content in a big object literal — GROUPS, ITEMS,
 * LESSONS, SCENARIOS — that the page's own JS renders. When a page is reframed,
 * fields stop being rendered but stay in the literal. Nothing marks them dead,
 * and they go on reading exactly like live copy to the next person who opens
 * the file.
 *
 * That is not tidiness. fix-it-design-challenge#2 edited GROUPS.ai_problem and
 * GROUPS.starter_fix believing teachers would see the change; no JS had read
 * either field for months. The edit was invisible in the browser, it shipped,
 * and nobody could tell from reading the source.
 *
 * tools/graph/check-dead-data.mjs is the GATE, holding one page against a
 * recorded baseline. This is the AUDIT: it asks the same question of every page
 * on the site and writes a report. It never fails a build — findings here need
 * a human to decide delete-vs-re-render, which is exactly the judgement a gate
 * should not be making.
 *
 * Two deliberate conservatisms, because a false "this is dead" costs far more
 * than a missed one:
 *
 *   1. Reads are searched across the WHOLE repo, not just the page. A field
 *      consumed by /assets/*.js or the lesson engine is read, even though
 *      nothing in the page's own text mentions it.
 *   2. Only PROSE-valued fields are reported. A dead `id` or `level_key` is
 *      housekeeping; a dead sentence is a teacher believing something ships.
 *      Non-prose dead fields are counted but listed separately.
 *
 *   node tools/graph/sweep-dead-content.mjs            # writes the report
 *   node tools/graph/sweep-dead-content.mjs --quiet    # summary line only
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const QUIET = process.argv.includes("--quiet");

/* Directories that are build output, vendored code, or not shipped. Scanning
   dist/ would double-count every page and report the same finding twice. */
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".wrangler",
  ".vite",
  "test-results",
  "playwright-report",
  "canvas-packages",
  "scorm-packages",
  "reports",
  "tmp",
  "coverage",
  ".claude",
  ".codex",
  ".githooks",
]);

/** A value counts as prose if a human wrote it to be read. */
const isProse = (v) =>
  typeof v === "string" && v.trim().length >= 25 && /\s/.test(v.trim()) && / [a-z]/i.test(v);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (/\.(html|js|mjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Balanced [...] / {...} following `const NAME =`. */
function extractLiteral(source, name, fromIndex = 0) {
  const decl = new RegExp(`\\bconst\\s+${name}\\s*=\\s*`, "g");
  decl.lastIndex = fromIndex;
  const m = decl.exec(source);
  if (!m) return null;
  const open = m.index + m[0].length;
  const openChar = source[open];
  if (openChar !== "[" && openChar !== "{") return null;
  const closeChar = openChar === "[" ? "]" : "}";
  let depth = 0;
  let inString = null;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inString = ch;
    else if (ch === openChar) depth++;
    else if (ch === closeChar && --depth === 0) {
      return { body: source.slice(open, i + 1), start: open, end: i + 1 };
    }
  }
  return null;
}

/** key -> a sample string value, for the top-level entries of the literal. */
function fieldsIn(body) {
  const fields = new Map();
  let depth = 0;
  let inString = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth--;
      continue;
    }
    if (depth > 3) continue;
    const m = body.slice(i).match(/^([A-Za-z_$][\w$]*)\s*:\s*/);
    if (!m || !/[\s,{[]/.test(body[i - 1] ?? "{")) continue;
    const key = m[1];
    const after = i + m[0].length;
    const q = body[after];
    let sample = null;
    if (q === '"' || q === "'" || q === "`") {
      let out = "";
      for (let j = after + 1; j < body.length; j++) {
        if (body[j] === "\\") {
          out += body[j + 1] ?? "";
          j++;
          continue;
        }
        if (body[j] === q) break;
        out += body[j];
      }
      sample = out;
    }
    if (!fields.has(key) || (sample && !fields.get(key))) fields.set(key, sample);
    i = after - 1;
  }
  return fields;
}

/**
 * Strip comments and JSON-ish string lists before harvesting reads.
 *
 * Without this, prose wins arguments it should lose. A comment that mentions
 * `GROUPS.ai_problem` — including the ones in check-dead-data.mjs explaining
 * that the field is DEAD — matches the `.key` pattern and registers as a read,
 * so the sweep quietly exonerated two of the very fields that prompted it.
 */
function stripNonCode(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1 ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

/**
 * Is this literal used as a lookup table, i.e. indexed by something that is not
 * a string literal? `FORMULAS[shape]`, `I18N[lang]`, `SHAPE_SVG[name]` read
 * every key they contain, and no static scan can say which. Treating those keys
 * as dead is the expensive mistake, so the whole literal is skipped.
 */
function isDynamicallyIndexed(name, corpusText) {
  const re = new RegExp(`\\b${name}\\s*\\[\\s*(?!["'\`])`, "g");
  return re.test(corpusText);
}

/** Identifiers this corpus reads as properties. Built once over the whole repo. */
function readTokens(text, into = new Set()) {
  for (const m of text.matchAll(/\.([A-Za-z_$][\w$]*)/g)) into.add(m[1]);
  for (const m of text.matchAll(/\[\s*["'`]([^"'`]+)["'`]\s*\]/g)) into.add(m[1]);
  for (const m of text.matchAll(/\{([^{}]*)\}\s*=/g)) {
    for (const part of m[1].split(",")) {
      const id = part.trim().split(/[:=\s]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) into.add(id);
    }
  }
  return into;
}

const files = walk(ROOT);
if (!QUIET) console.log(`scanning ${files.length} file(s)…`);

/* One pass to learn everything the site reads, anywhere. A field consumed by a
   shared script is read even if its own page never mentions it. */
const GLOBAL_READS = new Set();
const contents = new Map();
for (const f of files) {
  let text;
  try {
    if (statSync(f).size > 4_000_000) continue;
    text = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  contents.set(f, text);
  readTokens(stripNonCode(text), GLOBAL_READS);
}

const findings = [];
let _pagesWithLiterals = 0;

for (const [file, text] of contents) {
  if (!file.endsWith(".html")) continue;

  // Content literals are conventionally SCREAMING_CASE in these pages.
  const names = [
    ...new Set([...text.matchAll(/\bconst\s+([A-Z][A-Z0-9_]{2,})\s*=\s*[[{]/g)].map((m) => m[1])),
  ];
  if (!names.length) continue;

  for (const name of names) {
    // A lookup table reads every key it has; nothing static can tell which.
    if (isDynamicallyIndexed(name, text)) continue;

    const found = extractLiteral(text, name);
    if (!found) continue;
    const fields = fieldsIn(found.body);
    if (fields.size < 2) continue;

    const outside = stripNonCode(text.slice(0, found.start) + text.slice(found.end));
    const localReads = readTokens(outside);
    const entries = (found.body.match(/(?:^|[\s,{])id\s*:/g) || []).length || 1;

    const dead = [...fields].filter(([key]) => !localReads.has(key) && !GLOBAL_READS.has(key));
    if (!dead.length) continue;

    _pagesWithLiterals++;
    const prose = dead.filter(([, v]) => isProse(v));
    const other = dead.filter(([, v]) => !isProse(v));
    findings.push({
      file: relative(ROOT, file),
      literal: name,
      total: fields.size,
      entries,
      prose,
      other,
    });
  }
}

findings.sort((a, b) => b.prose.length * b.entries - a.prose.length * a.entries);

const proseTotal = findings.reduce((n, f) => n + f.prose.length * f.entries, 0);
const proseFields = findings.reduce((n, f) => n + f.prose.length, 0);
const withProse = findings.filter((f) => f.prose.length);

const lines = [
  "# Dead content sweep",
  "",
  "Fields in a page's data literal that **no JavaScript anywhere in this repo reads**.",
  "They render nowhere. Editing them changes nothing a student or teacher sees, and",
  "they read exactly like live copy to the next author.",
  "",
  `Scanned **${contents.size}** files. Reads are resolved against the whole repo, so a`,
  "field consumed by a shared script counts as read.",
  "",
  `- **${proseFields}** prose fields across **${withProse.length}** literal(s) — ~**${proseTotal}** values once entry counts are applied.`,
  "- Prose is the signal: a dead `id` is housekeeping, a dead sentence is someone",
  "  believing their words ship. Non-prose dead fields are listed separately.",
  "",
  "Generated by `tools/graph/sweep-dead-content.mjs`. This is an audit, not a gate —",
  "delete-vs-re-render is a content decision.",
  "",
];

for (const f of withProse) {
  lines.push(`## \`${f.file}\` — \`${f.literal}\``);
  lines.push("");
  lines.push(`${f.total} fields, ~${f.entries} entries. Dead prose fields:`);
  lines.push("");
  for (const [key, sample] of f.prose) {
    const s = (sample || "").replace(/\s+/g, " ").trim();
    lines.push(`- **\`${key}\`** — ${s.length > 150 ? `${s.slice(0, 150)}…` : s}`);
  }
  if (f.other.length) {
    lines.push("");
    lines.push(`Also dead, non-prose: ${f.other.map(([k]) => `\`${k}\``).join(", ")}`);
  }
  lines.push("");
}

const onlyOther = findings.filter((f) => !f.prose.length);
if (onlyOther.length) {
  lines.push("## Non-prose only");
  lines.push("");
  lines.push("Unread but not teacher-facing copy — lower priority.");
  lines.push("");
  for (const f of onlyOther) {
    lines.push(`- \`${f.file}\` \`${f.literal}\`: ${f.other.map(([k]) => `\`${k}\``).join(", ")}`);
  }
  lines.push("");
}

mkdirSync(resolve(ROOT, "reports"), { recursive: true });
writeFileSync(resolve(ROOT, "reports/dead-content.md"), lines.join("\n"));

console.log(
  `✓ reports/dead-content.md — ${proseFields} dead prose field(s) across ${withProse.length} literal(s), ~${proseTotal} values`,
);
if (!QUIET) {
  for (const f of withProse.slice(0, 12)) {
    console.log(`   ${f.file} ${f.literal}: ${f.prose.map(([k]) => k).join(", ")}`);
  }
  if (withProse.length > 12) console.log(`   … and ${withProse.length - 12} more`);
}
