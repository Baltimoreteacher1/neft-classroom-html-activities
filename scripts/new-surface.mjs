#!/usr/bin/env node
/* =============================================================================
 * new-surface.mjs — scaffold a new /curriculum surface, fully wired.
 * -----------------------------------------------------------------------------
 *   node scripts/new-surface.mjs <slug> --title "Name" [options]
 *   npm run new:surface -- <slug> --title "Name" --icon 🧭 --tag "Practice"
 *
 *   --blurb "…"   one-line subtitle on the hub card and in <meta description>
 *   --route /x    short redirect to add (default: /<slug>)
 *   --dry-run     print every file and edit, change nothing
 *
 * WHY THIS EXISTS
 * ---------------
 * Adding a surface to /curriculum is seven coordinated edits across five files,
 * and the repo's own history is a list of what happens when one is missed: a
 * page with no gate that later shipped dead (validate:ai-hub exists because a
 * tutor chat shipped broken twice), an unscoped stylesheet that leaked onto
 * lesson pages (validate:showcase checks for exactly that), a route that was
 * never registered, a card nobody could find. None of those are hard problems —
 * they are bookkeeping, and bookkeeping is what gets skipped when you are three
 * hours into building the actual feature.
 *
 * So this does the bookkeeping, and — the part that matters — it writes the
 * surface's OWN validator and wires it into `npm run validate` at minute one,
 * before there is anything to be wrong. The generated gate is real, not a stub:
 * it fails on a missing owned file, a script that does not parse, an inline
 * handler pointing at a function nobody defined, an unscoped CSS selector, a
 * dark-mode block on a light-only site, and the discouraged label. Delete the
 * checks you do not want; do not delete the file.
 *
 * Every edit is anchored and additive. Nothing is regenerated wholesale — this
 * repo has lost sibling fields that way before.
 * ========================================================================== */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const opt = (n, d = null) => {
  const i = argv.indexOf(n);
  return i === -1 ? d : argv[i + 1];
};

const VALUE_FLAGS = new Set(["--title", "--icon", "--tag", "--blurb", "--route"]);
const positionals = [];
for (let i = 0; i < argv.length; i += 1) {
  if (VALUE_FLAGS.has(argv[i])) i += 1;
  else if (!argv[i].startsWith("--")) positionals.push(argv[i]);
}
const slug = positionals[0];
if (!slug || !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(slug)) {
  console.error(
    'usage: node scripts/new-surface.mjs <kebab-slug> --title "Name" [--icon 🧭] [--tag Label] [--blurb "…"] [--route /x] [--dry-run]',
  );
  process.exit(2);
}
const title = opt("--title");
if (!title) {
  console.error(
    "new-surface: --title is required (it becomes the <title>, the hub card heading, and the aria label).",
  );
  process.exit(2);
}
const icon = opt("--icon", "🧭");
const tag = opt("--tag", "Curriculum");
const blurb = opt("--blurb", `${title} — a new curriculum surface.`);
const route = opt("--route", `/${slug}`);
const dir = join(ROOT, "curriculum", slug);

if (existsSync(dir)) {
  console.error(
    `new-surface: curriculum/${slug}/ already exists. Pick another slug or edit it directly.`,
  );
  process.exit(1);
}

const edits = [];
const writeFile = (rel, content) => edits.push({ kind: "create", rel, content });
const editFile = (rel, content) => edits.push({ kind: "edit", rel, content });

/* --- 1. The page ---------------------------------------------------------- */
writeFile(
  `curriculum/${slug}/index.html`,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${blurb}" />
    <title>${title} — Neft Teacher</title>
    <link rel="canonical" href="https://eduwonderlab.com/curriculum/${slug}/" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#15487f" />
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/assets/favicon.svg" />
    <link
      rel="stylesheet"
      href="/assets/fonts/outfit-hanken-grotesk-fddd17.css"
    />
    <link rel="stylesheet" href="./${slug}.css" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to the main content</a>

    <div class="${slug}-wrap">
      <a class="backlink" href="/curriculum/">&#8592; Back to curriculum</a>

      <header>
        <span class="page-icon" aria-hidden="true">${icon}</span>
        <h1>${title}</h1>
        <p class="lede">${blurb}</p>
      </header>

      <main id="main">
        <p class="empty-state" data-role="empty">Nothing here yet.</p>
      </main>
    </div>

    <script src="./${slug}.js" type="module"></script>
  </body>
</html>
`,
);

/* --- 2. Styles. Everything scoped — an unscoped selector here has leaked onto
 *        lesson pages before, which is why validate:showcase checks for it. -- */
writeFile(
  `curriculum/${slug}/${slug}.css`,
  `/* ${slug}.css — styles for /curriculum/${slug}/.
 * Every selector is scoped under .${slug}-wrap on purpose: shared stylesheets on
 * this site have leaked onto lesson pages before, and the generated validator
 * fails if a bare element selector appears here. */

.${slug}-wrap {
  --ink: #15233b;
  --muted: #55617a;
  --accent: #15487f;
  max-width: 60rem;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  font-family: "Hanken Grotesk", system-ui, sans-serif;
  color: var(--ink);
}

.${slug}-wrap .backlink {
  display: inline-block;
  margin-bottom: 1.25rem;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}

.${slug}-wrap .backlink:hover,
.${slug}-wrap .backlink:focus-visible {
  text-decoration: underline;
}

.${slug}-wrap header {
  margin-bottom: 2rem;
}

.${slug}-wrap .page-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.${slug}-wrap h1 {
  font-family: "Outfit", system-ui, sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  margin: 0.5rem 0 0.25rem;
}

.${slug}-wrap .lede {
  font-size: 1.125rem;
  color: var(--muted);
  margin: 0;
}

.${slug}-wrap .empty-state {
  padding: 2rem;
  border: 2px dashed #c9d3e4;
  border-radius: 0.75rem;
  text-align: center;
  color: var(--muted);
}

.${slug}-wrap .skip-link:focus-visible,
.${slug}-wrap :focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
`,
);

/* --- 3. Behaviour --------------------------------------------------------- */
writeFile(
  `curriculum/${slug}/${slug}.js`,
  `/* ${slug}.js — behaviour for /curriculum/${slug}/.
 *
 * Kept as a module with no inline handlers: the generated validator resolves
 * every inline on* attribute to a defined function, and the cheapest way to
 * pass that check forever is to never write one. Wire listeners here. */

const root = document.querySelector(".${slug}-wrap");

function render() {
  if (!root) return;
  const empty = root.querySelector('[data-role="empty"]');
  if (empty) empty.textContent = "Nothing here yet.";
}

render();

export { render };
`,
);

/* --- 4. The gate ---------------------------------------------------------- */
writeFile(
  `tools/validate-${slug}.mjs`,
  `#!/usr/bin/env node
/* =============================================================================
 * validate-${slug}.mjs — gate for /curriculum/${slug}/
 * -----------------------------------------------------------------------------
 * Scaffolded by scripts/new-surface.mjs. Wired into \`npm run validate\`, so it
 * gates every deploy. Add checks specific to what this surface promises — the
 * ones below are the classes that have actually broken surfaces in this repo:
 *
 *   1. Every file this surface owns still exists (a clobber deletes, it does
 *      not corrupt — and existsSync on the wrong path passes silently, so the
 *      list is explicit).
 *   2. The page's scripts parse, and every inline on* handler resolves to a
 *      function that is actually defined.
 *   3. No unscoped selector in the stylesheet.
 *   4. No dark-mode block — this is a light-only site.
 *   5. The discouraged label does not appear.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const OWNED_FILES = [
  "curriculum/${slug}/index.html",
  "curriculum/${slug}/${slug}.css",
  "curriculum/${slug}/${slug}.js",
  "tools/validate-${slug}.mjs",
];

const failures = [];
const fail = (m) => failures.push(m);
const check = (cond, m) => {
  if (!cond) fail(m);
};

/* --- 1. Owned files present and non-trivial -------------------------------- */
const files = new Map();
for (const rel of OWNED_FILES) {
  try {
    const body = read(rel);
    check(body.length > 200, \`\${rel} is only \${body.length} bytes — possible clobber or stub\`);
    files.set(rel, body);
  } catch {
    fail(\`missing owned file: \${rel}\`);
  }
}
if (failures.length) {
  console.error("validate-${slug}: " + failures.join("\\n  "));
  process.exit(1);
}

const html = files.get("curriculum/${slug}/index.html");
const css = files.get("curriculum/${slug}/${slug}.css");
const js = files.get("curriculum/${slug}/${slug}.js");

/* --- 2. Scripts parse; inline handlers resolve ------------------------------ */
for (const [i, block] of [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)].entries()) {
  const src = block[1].trim();
  if (!src) continue;
  try {
    new Function(src);
  } catch (e) {
    fail(\`inline <script> #\${i + 1} in index.html does not parse: \${e.message}\`);
  }
}

const defined = new Set([...js.matchAll(/function\\s+([A-Za-z_$][\\w$]*)/g)].map((m) => m[1]));
for (const m of html.matchAll(/\\son[a-z]+="([A-Za-z_$][\\w$]*)\\s*\\(/g)) {
  check(defined.has(m[1]), \`inline handler calls \${m[1]}(), which ${slug}.js does not define\`);
}

/* --- 3. Stylesheet stays scoped -------------------------------------------- */
for (const line of css.split("\\n")) {
  const sel = line.match(/^\\s*([a-z][\\w-]*)\\s*(?:,|\\{)/);
  if (sel && !["from", "to"].includes(sel[1])) {
    fail(\`unscoped selector "\${sel[1]}" in ${slug}.css — it must live under .${slug}-wrap\`);
  }
}

/* --- 4 & 5. Light-only, and the label ------------------------------------- */
for (const [rel, body] of files) {
  check(!/prefers-color-scheme\\s*:\\s*dark/.test(body), \`\${rel} emits a dark-mode block; this is a light-only site\`);
  check(!/\\bESOL\\b/.test(body), \`\${rel} uses the discouraged label; say "support" or "Level 1" instead\`);
}

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error("validate-${slug} FAILED:");
  for (const f of failures) console.error(\`  ✗ \${f}\`);
  process.exit(1);
}
console.log(\`✓ /curriculum/${slug}/ lock passed (\${OWNED_FILES.length} owned files).\`);
`,
);

/* --- 5. package.json: the script + the validate chain ---------------------- */
const pkgPath = join(ROOT, "package.json");
const pkgRaw = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(pkgRaw);
if (pkg.scripts[`validate:${slug}`]) {
  console.error(`new-surface: package.json already defines validate:${slug}`);
  process.exit(1);
}
/* Only two keys change: `validate` gains one link in its chain, and the new
 * script is appended. Every other entry is copied through untouched — this repo
 * has lost sibling fields to whole-object regeneration before. */
const nextScripts = {};
for (const [k, v] of Object.entries(pkg.scripts)) {
  nextScripts[k] = k === "validate" ? `${v} && npm run validate:${slug}` : v;
}
nextScripts[`validate:${slug}`] = `node tools/validate-${slug}.mjs`;
pkg.scripts = nextScripts;
editFile("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

/* --- 6. data/routes.json: the short route --------------------------------- */
const routesPath = join(ROOT, "data/routes.json");
const routesRaw = readFileSync(routesPath, "utf8");
const routes = JSON.parse(routesRaw);
const dest = `/curriculum/${slug}/`;
const clash = (routes.redirects || []).find((r) => r.source === route);
if (clash) {
  console.error(
    `new-surface: ${route} already redirects to ${clash.destination}. Pass a different --route.`,
  );
  process.exit(1);
}
/* Text insertion, not JSON.stringify of the whole object. This file is not
 * Biome-formatted (short arrays sit on one line and the formatter will not
 * put them back), so a re-serialise turns a one-line change into a 97-line
 * diff that buries it. Append at the END of `redirects` so the new rule cannot
 * shadow an existing one — tools/redirects-shadowing.test.mjs enforces that. */
const REDIR_START = routesRaw.indexOf('\n  "redirects": [');
const REDIR_END = REDIR_START === -1 ? -1 : routesRaw.indexOf("\n  ],", REDIR_START);
if (REDIR_END === -1) {
  console.error(
    "new-surface: could not locate the redirects array in data/routes.json. Add the route by hand.",
  );
} else {
  const entry = `,\n    {\n      "source": "${route}",\n      "destination": "${dest}",\n      "status": 301\n    }`;
  editFile("data/routes.json", routesRaw.slice(0, REDIR_END) + entry + routesRaw.slice(REDIR_END));
}

/* --- 7. curriculum/index.html: the hub card ------------------------------- */
const hubPath = join(ROOT, "curriculum/index.html");
const hub = readFileSync(hubPath, "utf8");
const ANCHOR = '\n          <div class="features-section-header hub-teacher-only">';
if (!hub.includes(ANCHOR)) {
  console.error(
    "new-surface: could not find the hub card anchor in curriculum/index.html. Add the card by hand; everything else still applied.",
  );
} else {
  const card = `
          <section class="mailbox-feature cns-feature" aria-labelledby="cns-${slug}-feature-title">
            <span class="mf-icon" aria-hidden="true">${icon}</span>
            <div class="mf-body">
              <span class="mf-tag">${tag}</span>
              <h2 id="cns-${slug}-feature-title">${title}</h2>
              <p class="mf-sub">${blurb}</p>
              <div class="mf-actions">
                <a class="mf-btn solid" href="${dest}">Open ${title}</a>
              </div>
            </div>
          </section>
`;
  editFile("curriculum/index.html", hub.replace(ANCHOR, `${card}${ANCHOR}`));
}

/* --- 8. qa-run coverage: so editing this surface stays on the fast lane ---- */
const qaPath = join(ROOT, "scripts/qa-run.mjs");
const qa = readFileSync(qaPath, "utf8");
const COV_ANCHOR = "  [/^curriculum\\//,";
if (qa.includes(COV_ANCHOR)) {
  const rule = `  [/^curriculum\\/${slug}\\//, ["validate:${slug}"]],\n`;
  editFile("scripts/qa-run.mjs", qa.replace(COV_ANCHOR, `${rule}${COV_ANCHOR}`));
} else {
  console.error(
    "new-surface: could not find the qa-run coverage anchor; add a rule for this slug by hand.",
  );
}

/* --- Apply ---------------------------------------------------------------- */
console.log(`${DRY ? "[dry-run] " : ""}new surface: /curriculum/${slug}/  "${title}"`);
for (const e of edits) console.log(`  ${e.kind === "create" ? "create" : "edit  "}  ${e.rel}`);

if (DRY) {
  console.log("\n[dry-run] nothing written.");
  process.exit(0);
}

mkdirSync(dir, { recursive: true });
for (const e of edits) writeFileSync(join(ROOT, e.rel), e.content);

console.log(`
Wired: validate:${slug} → npm run validate → the pre-push gate.
       ${route} → ${dest}
       hub card, and a qa-run coverage rule so edits here stay on the fast lane.

Next:  npm run qa:fast          # ~1s, runs only what this change touched
       npm run validate:${slug}
`);
