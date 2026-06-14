#!/usr/bin/env node
/**
 * Curriculum Integrity Auditor
 * --------------------------------------------------------------------------
 * Read-only diagnostic. Scans the whole site for structural integrity problems
 * that break the student/teacher experience or a Cloudflare Pages deploy:
 *
 *   1. Data-source integrity   routes.json / catalog.json / registry.json paths
 *                              resolve to a real file or dir+index.html.
 *   2. Redirects               every redirect destination resolves; sources do
 *                              not collide with a live route.
 *   3. Broken internal links   relative + absolute href/src in every HTML file
 *                              point at something that exists on disk.
 *   4. Lesson resource files    download links (.docx/.pdf) referenced by a
 *                              lesson actually exist in its downloads/ folder.
 *   5. Duplicate flagship routes  a "X-Y" lesson and its "X-Y-flagship" twin
 *                              both surfaced in the same data source.
 *   6. Unit / standard mapping  config.unit, lessonId prefix, and the catalog
 *                              entry agree; standard prefix matches the unit.
 *   7. Orphan lessons          lesson dirs that no data source references.
 *   8. Case-sensitivity        absolute asset links whose on-disk casing
 *                              differs (passes on macOS, 404s on Cloudflare).
 *
 * Complements tools/validate-static-site.mjs (deployment-file checks); does not
 * duplicate it. Never writes to the site — only emits a report.
 *
 * Usage:
 *   node scripts/audit-curriculum.mjs            # console report, writes reports/
 *   node scripts/audit-curriculum.mjs --json     # machine-readable to stdout
 *   node scripts/audit-curriculum.mjs --quiet     # only summary + exit code
 *   node scripts/audit-curriculum.mjs --no-write  # skip writing report files
 *
 * Exit code: 0 if no ERROR-severity findings, 1 otherwise (CI-friendly).
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { join, dirname, resolve, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const argv = new Set(process.argv.slice(2));
const FLAGS = {
  json: argv.has('--json'),
  quiet: argv.has('--quiet'),
  write: !argv.has('--no-write'),
};

const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  '.serena',
  '.ruff_cache',
  'dist',
  '.github',
]);

// --------------------------------------------------------------------------
// Findings collection
// --------------------------------------------------------------------------
const findings = [];
/** @param {'error'|'warn'|'info'} severity */
function add(severity, category, message, where = '') {
  findings.push({ severity, category, message, where });
}

// --------------------------------------------------------------------------
// Filesystem helpers
// --------------------------------------------------------------------------
function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') {
      if (IGNORE_DIRS.has(entry.name)) continue;
    }
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(root, rel), 'utf8'));
  } catch (err) {
    add('error', 'data', `Cannot read/parse ${rel}: ${err.message}`, rel);
    return null;
  }
}

/**
 * Resolve a site path ("/lessons/2-4/", "./downloads/x.pdf") to an absolute
 * disk path. fromFile is the HTML file the link lives in (for relative links).
 * Returns { abs, kind } or null if the link type is external/unresolvable.
 */
function resolveSitePath(link, fromFile) {
  let clean = link.split('#')[0].split('?')[0].trim();
  if (!clean) return null;
  if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(clean)) return null;

  let abs;
  if (clean.startsWith('/')) {
    abs = join(root, clean);
  } else {
    abs = resolve(dirname(fromFile), clean);
  }
  // Directory-style link → index.html
  if (clean.endsWith('/')) abs = join(abs, 'index.html');
  return abs;
}

const ACCESS_PRACTICE_SPA_RE =
  /^\/access-practice-lab\/(Listening|Speaking|Reading|Writing|Model-Test)\//;

/** Routes served by functions/access-practice-lab/[[path]].js, not static files. */
function isFunctionBackedRoute(link) {
  const path = link.split('#')[0].split('?')[0];
  return ACCESS_PRACTICE_SPA_RE.test(path);
}

/** Does this absolute path exist as a file, or as a dir with index.html? */
function targetExists(abs) {
  if (existsSync(abs)) {
    try {
      if (statSync(abs).isDirectory()) return existsSync(join(abs, 'index.html'));
    } catch {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Case-sensitive existence check: walks each path segment confirming the
 * on-disk name matches casing exactly. Returns true if an exact-case match
 * exists. Only meaningful for files that already exist case-insensitively.
 */
function existsExactCase(abs) {
  const rel = relative(root, abs);
  if (rel.startsWith('..')) return true; // outside root, skip
  const parts = rel.split(/[/\\]/).filter(Boolean);
  let cur = root;
  for (const part of parts) {
    let names;
    try {
      names = readdirSync(cur);
    } catch {
      return false;
    }
    if (!names.includes(part)) return false; // either missing or wrong case
    cur = join(cur, part);
  }
  return true;
}

// --------------------------------------------------------------------------
// 1+2. Data-source path integrity (routes / catalog / registry / redirects)
// --------------------------------------------------------------------------
const routes = readJson('data/routes.json');
const catalog = readJson('data/catalog.json');
const registry = readJson('data/registry.json');

const routePaths = new Set(); // live, public site paths for collision checks

function checkEntryPath(rawPath, sourceLabel, id) {
  if (!rawPath || typeof rawPath !== 'string') {
    add('warn', 'data', `${sourceLabel}: entry "${id}" has no path/url`, sourceLabel);
    return;
  }
  if (/^https?:/i.test(rawPath)) return; // external, not our concern
  routePaths.add(rawPath.replace(/index\.html$/, ''));
  const abs = resolveSitePath(rawPath.endsWith('/') || /\.[a-z0-9]+$/i.test(rawPath) ? rawPath : `${rawPath}/`, join(root, 'x.html'));
  if (abs && !targetExists(abs)) {
    add('error', 'data', `${sourceLabel}: "${id}" → ${rawPath} has no file on disk`, sourceLabel);
  }
}

if (routes?.routes) {
  for (const r of routes.routes) checkEntryPath(r.path, 'routes.json', r.id || r.title);
}
if (catalog?.entries) {
  for (const e of catalog.entries) checkEntryPath(e.path, 'catalog.json', e.title);
}
if (registry?.activities) {
  for (const a of registry.activities) checkEntryPath(a.url, 'registry.json', a.title);
}

// Redirects
if (routes?.redirects) {
  for (const rd of routes.redirects) {
    const dest = rd.destination;
    if (dest && !/^https?:/i.test(dest)) {
      const abs = resolveSitePath(dest.endsWith('/') || /\.[a-z0-9]+$/i.test(dest) ? dest : `${dest}/`, join(root, 'x.html'));
      if (abs && !targetExists(abs)) {
        add('error', 'redirect', `redirect ${rd.source} → ${dest} points at a missing target`, 'data/routes.json');
      }
    }
    if (rd.source && routePaths.has(rd.source.replace(/\/$/, '/')) ) {
      add('warn', 'redirect', `redirect source ${rd.source} collides with a live route`, 'data/routes.json');
    }
  }
}

// --------------------------------------------------------------------------
// 3+8. Broken internal links + case-sensitivity across every HTML file
// --------------------------------------------------------------------------
const htmlFiles = walk(root).filter((f) => f.endsWith('.html'));
const LINK_RE = /(?:href|src)\s*=\s*"([^"]+)"/gi;
// Cap noise: only report each unique (file, link) once
const seenBroken = new Set();

for (const file of htmlFiles) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const relFile = relative(root, file);
  // Strip <script>/<style> blocks: links there are runtime-generated JS
  // (template literals, string concatenation) and can't be statically resolved.
  const markup = content
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(markup)) !== null) {
    const link = m[1];
    // Skip dynamic/templated links that survived (e.g. attributes built inline).
    if (link.includes('${') || /[\n\r]/.test(link) || link.includes("' +") || link.includes('" +')) continue;
    const abs = resolveSitePath(link, file);
    if (!abs) continue; // external/non-resolvable
    const key = `${relFile}::${link}`;
    if (seenBroken.has(key)) continue;
    seenBroken.add(key);
    if (!targetExists(abs)) {
      if (isFunctionBackedRoute(link)) continue;
      add('error', 'link', `broken link → ${link}`, relFile);
    } else if (link.startsWith('/') && !existsExactCase(abs.endsWith('index.html') && link.endsWith('/') ? dirname(abs) : abs)) {
      add('warn', 'case', `link case mismatch (404s on Cloudflare) → ${link}`, relFile);
    }
  }
}

// --------------------------------------------------------------------------
// 4+5+6+7. Lesson-level checks (resources, flagship dupes, unit map, orphans)
// --------------------------------------------------------------------------
const lessonsDir = join(root, 'lessons');
const lessonDirs = existsSync(lessonsDir)
  ? readdirSync(lessonsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

// Build a quick lookup of catalog entries by normalized path
const catalogByPath = new Map();
if (catalog?.entries) {
  for (const e of catalog.entries) {
    if (e.path) catalogByPath.set(e.path.replace(/\/?$/, '/'), e);
  }
}
const referencedPaths = new Set(
  [...routePaths].map((p) => p.replace(/\/?$/, '/'))
);

for (const name of lessonDirs) {
  const dir = join(lessonsDir, name);
  const sitePath = `/lessons/${name}/`;
  const configPath = join(dir, 'config.json');

  // 4. Lesson download integrity (download links inside notes.html/index.html)
  for (const htmlName of ['notes.html', 'index.html']) {
    const hp = join(dir, htmlName);
    if (!existsSync(hp)) continue;
    const html = readFileSync(hp, 'utf8');
    let m;
    const re = /(?:href|src)\s*=\s*"(\.\/downloads\/[^"]+)"/gi;
    while ((m = re.exec(html)) !== null) {
      const target = resolve(dir, m[1]);
      if (!existsSync(target)) {
        add('error', 'resource', `${name}: referenced download missing → ${m[1]}`, `lessons/${name}/${htmlName}`);
      }
    }
  }

  // 6. Unit / standard mapping
  if (existsSync(configPath)) {
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(configPath, 'utf8'));
    } catch (err) {
      add('error', 'config', `${name}: config.json invalid: ${err.message}`, `lessons/${name}/config.json`);
      cfg = null;
    }
    if (cfg) {
      const prefixUnit = Number(String(name).split('-')[0]);
      if (cfg.unit != null && Number(cfg.unit) !== prefixUnit && !Number.isNaN(prefixUnit)) {
        add('warn', 'mapping', `${name}: config.unit=${cfg.unit} but lessonId prefix is unit ${prefixUnit}`, `lessons/${name}/config.json`);
      }
      if (cfg.lessonId && cfg.lessonId !== name && cfg.lessonId !== name.replace(/-flagship$/, '')) {
        add('warn', 'mapping', `${name}: config.lessonId="${cfg.lessonId}" does not match dir name`, `lessons/${name}/config.json`);
      }
      // catalog cross-check
      const cat = catalogByPath.get(sitePath);
      if (cat) {
        if (cat.unit != null && cfg.unit != null && Number(cat.unit) !== Number(cfg.unit)) {
          add('warn', 'mapping', `${name}: catalog unit ${cat.unit} ≠ config unit ${cfg.unit}`, 'data/catalog.json');
        }
        if (cat.standard && cfg.standard && cat.standard !== cfg.standard) {
          add('warn', 'mapping', `${name}: catalog standard ${cat.standard} ≠ config standard ${cfg.standard}`, 'data/catalog.json');
        }
      }
    }
  }

  // 7. Orphan lessons: a lesson dir with an index.html that nothing references
  if (existsSync(join(dir, 'index.html')) && !referencedPaths.has(sitePath)) {
    add('info', 'orphan', `${name}: lesson not referenced by routes/catalog/registry`, sitePath);
  }
}

// 5. Duplicate flagship routes: base + flagship twin both referenced.
// The lesson-1 (+ 5-3) flagship twins below are an INTENTIONAL dual track —
// standard lesson kept alongside its enhanced "flagship" build — so surfacing
// both is expected. They are allowlisted to keep this audit quiet & trustworthy;
// any NEW/unexpected flagship dupe still warns. Do NOT consolidate these routes:
// the base paths back existing bookmarks + save/resume keys.
const INTENTIONAL_FLAGSHIP_TWINS = new Set([
  '1-1', '2-1', '3-1', '4-1', '5-3', '6-1', '7-1', '8-1', '9-1', '10-1',
]);
for (const name of lessonDirs) {
  if (!name.endsWith('-flagship')) continue;
  const base = name.replace(/-flagship$/, '');
  const baseRef = referencedPaths.has(`/lessons/${base}/`);
  const flagRef = referencedPaths.has(`/lessons/${name}/`);
  if (baseRef && flagRef && !INTENTIONAL_FLAGSHIP_TWINS.has(base)) {
    add('warn', 'flagship', `both /lessons/${base}/ and /lessons/${name}/ are surfaced — possible duplicate flagship route`, 'data/*.json');
  }
}

// --------------------------------------------------------------------------
// Report
// --------------------------------------------------------------------------
const order = { error: 0, warn: 1, info: 2 };
findings.sort(
  (a, b) => order[a.severity] - order[b.severity] || a.category.localeCompare(b.category)
);
const counts = findings.reduce(
  (acc, f) => ((acc[f.severity] = (acc[f.severity] || 0) + 1), acc),
  {}
);
const summary = {
  scannedHtml: htmlFiles.length,
  lessons: lessonDirs.length,
  errors: counts.error || 0,
  warnings: counts.warn || 0,
  info: counts.info || 0,
};

if (FLAGS.json) {
  process.stdout.write(JSON.stringify({ summary, findings }, null, 2));
  process.exit(summary.errors ? 1 : 0);
}

function byCategory() {
  const groups = {};
  for (const f of findings) (groups[f.category] ||= []).push(f);
  return groups;
}

if (!FLAGS.quiet) {
  console.log('\n  Curriculum Integrity Audit');
  console.log('  ' + '─'.repeat(48));
  console.log(`  HTML scanned : ${summary.scannedHtml}`);
  console.log(`  Lessons      : ${summary.lessons}`);
  console.log(`  Errors       : ${summary.errors}`);
  console.log(`  Warnings     : ${summary.warnings}`);
  console.log(`  Info         : ${summary.info}\n`);

  const icon = { error: 'ERROR', warn: ' WARN', info: ' INFO' };
  for (const [cat, items] of Object.entries(byCategory())) {
    console.log(`  ▸ ${cat} (${items.length})`);
    for (const f of items.slice(0, 40)) {
      console.log(`    [${icon[f.severity]}] ${f.message}${f.where ? `  (${f.where})` : ''}`);
    }
    if (items.length > 40) console.log(`    … ${items.length - 40} more`);
    console.log('');
  }
}

// Write report artifacts
if (FLAGS.write) {
  const dir = join(root, 'reports');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'curriculum-audit.json'),
    JSON.stringify({ summary, findings }, null, 2)
  );
  const md = [
    '# Curriculum Integrity Audit',
    '',
    `- HTML scanned: **${summary.scannedHtml}**`,
    `- Lessons: **${summary.lessons}**`,
    `- Errors: **${summary.errors}** · Warnings: **${summary.warnings}** · Info: **${summary.info}**`,
    '',
  ];
  for (const [cat, items] of Object.entries(byCategory())) {
    md.push(`## ${cat} (${items.length})`, '');
    for (const f of items) {
      md.push(`- \`${f.severity.toUpperCase()}\` ${f.message}${f.where ? ` — \`${f.where}\`` : ''}`);
    }
    md.push('');
  }
  writeFileSync(join(dir, 'curriculum-audit.md'), md.join('\n'));
  if (!FLAGS.quiet) console.log('  Report written → reports/curriculum-audit.{json,md}\n');
}

process.exit(summary.errors ? 1 : 0);
