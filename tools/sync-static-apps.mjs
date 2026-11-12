#!/usr/bin/env node
/**
 * sync-static-apps.mjs — publish the Fluency Adventures, Language Adventures and Language Studio apps onto this site.
 *
 *   node tools/sync-static-apps.mjs --app fluency-adventures=<checkout> --app language-adventures=<checkout>
 *   node tools/sync-static-apps.mjs --overlay-only
 *   node tools/sync-static-apps.mjs --check
 *
 * Each app is a separate Next.js project exported as static files (`npm run build` there writes
 * `out/`) with its basePath set to its mount. Nothing about the app is hand-edited here:
 *
 *   fluency-adventures/    the export of the Fluency Lab adventure app (the older Fluency Lab 4.0 stays at /math/fluency-lab/)
 *   language-adventures/   the export of The Language Page adventures (the ACCESS Practice Lab stays at /access-practice-lab/)
 *   language-studio/       the export of the Language Studio: 18 cases, arcade, studios, passport (keeps its data in the `studio` field of the same two storage objects)
 *   data/static-app-mounts.json   file counts and source commits, so a drifted copy is visible
 *   curriculum/index.html         one hub link per app
 *
 * The mounts are top-level so the site-wide sweeps that skip a top-level folder (Save/Resume, biome) skip them.
 * Next writes `404.html` into every export; the site's own 404 must keep answering, so it is dropped.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

export const APPS = [
  { name: "fluency-adventures", mount: "/fluency-adventures", label: "Fluency Adventures" },
  { name: "language-adventures", mount: "/language-adventures", label: "Language Adventures" },
  { name: "language-studio", mount: "/language-studio", label: "Language Studio" },
];

const MANIFEST = "data/static-app-mounts.json";
const HUB_FILE = "curriculum/index.html";
const MYSTERY_STUDIO_SOURCE = "tools/language-page-mystery-club";
const MYSTERY_STUDIO_MOUNT = "mystery-club";
const MYSTERY_STUDIO_FILES = [
  "index.html",
  "styles.css",
  "stories.js",
  "engine.js",
  "entry-link.js",
];
const MYSTERY_STUDIO_LINK_SCRIPT =
  '<script defer src="/language-adventures/mystery-club/entry-link.js" data-language-page-story-studio-loader></script>';
const HUB_ANCHOR = "<!-- /novel-library-hub-link -->";
const HUB_LINKS = `<!-- adventure-apps-hub-links -->${APPS.map(
  (a) => `<li><a href="${a.mount}/">${a.label}</a></li>`,
).join("")}<!-- /adventure-apps-hub-links -->`;
// The host site password-gates any path holding one of these words.
const GATED_WORD = /teacher|dashboard|answer-key/i;

const files = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath ?? e.path, e.name));

export function withHubLinks(html) {
  const marked = /<!-- adventure-apps-hub-links -->.*?<!-- \/adventure-apps-hub-links -->/;
  if (marked.test(html)) return html.replace(marked, HUB_LINKS);
  if (!html.includes(HUB_ANCHOR))
    throw new Error(`${HUB_FILE}: Graphic Novel Library hub link not found`);
  return html.replace(HUB_ANCHOR, `${HUB_ANCHOR}\n          ${HUB_LINKS}`);
}

function publish(app, checkout) {
  const out = join(checkout, "out");
  if (!existsSync(join(out, "index.html")))
    throw new Error(`${app.name}: no export at ${out}; run npm run build there`);
  const dest = join(REPO_ROOT, app.name);
  rmSync(dest, { recursive: true, force: true });
  cpSync(out, dest, { recursive: true });
  rmSync(join(dest, "404.html"), { force: true });
  if (app.name === "language-adventures") publishMysteryStudio(dest);
  const commit = execFileSync("git", ["-C", checkout, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  return { name: app.name, mount: app.mount, commit };
}

/** Keep the independently authored comic engine durable across Next static-export refreshes. */
function publishMysteryStudio(dest) {
  const source = join(REPO_ROOT, MYSTERY_STUDIO_SOURCE);
  const target = join(dest, MYSTERY_STUDIO_MOUNT);
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, {
    recursive: true,
    filter: (path) => {
      const name = path.slice(source.length + 1);
      return !name || MYSTERY_STUDIO_FILES.includes(name);
    },
  });
  addMysteryStudioEntryPoints(dest);
}

/** Add a native, keyboard-friendly entry point to every exported adventure page. */
export function withMysteryStudioLink(html) {
  const cleaned = html.replace(/<a data-language-page-story-studio\b[^>]*>Mystery Club<\/a>/g, "");
  if (cleaned.includes("data-language-page-story-studio-loader")) return cleaned;
  if (!cleaned.includes("</body>")) return cleaned;
  // The exported adventure pages hydrate their navigation, so a raw anchor in
  // the server HTML is discarded. A tiny deferred script adds the link after
  // hydration and repairs it if React replaces the navigation during startup.
  return cleaned.replace("</body>", `${MYSTERY_STUDIO_LINK_SCRIPT}</body>`);
}

function addMysteryStudioEntryPoints(dest) {
  for (const file of files(dest).filter((path) => path.endsWith(".html"))) {
    if (file.startsWith(`${join(dest, MYSTERY_STUDIO_MOUNT)}/`)) continue;
    const html = readFileSync(file, "utf8");
    const updated = withMysteryStudioLink(html);
    if (updated !== html) writeFileSync(file, updated);
  }
}

function mysteryStudioProblems() {
  const source = join(REPO_ROOT, MYSTERY_STUDIO_SOURCE);
  const target = join(REPO_ROOT, "language-adventures", MYSTERY_STUDIO_MOUNT);
  const found = [];
  for (const name of MYSTERY_STUDIO_FILES) {
    const src = join(source, name);
    const out = join(target, name);
    if (!existsSync(out)) found.push(`language-adventures: missing Mystery Club file ${name}`);
    else if (readFileSync(src, "utf8") !== readFileSync(out, "utf8"))
      found.push(`language-adventures: Mystery Club ${name} differs from ${MYSTERY_STUDIO_SOURCE}`);
  }
  for (const path of [
    join(REPO_ROOT, "language-adventures", "index.html"),
    join(REPO_ROOT, "language-adventures", "adventures", "mystery-files", "index.html"),
  ]) {
    if (
      !existsSync(path) ||
      !readFileSync(path, "utf8").includes("data-language-page-story-studio-loader")
    )
      found.push(`${path.slice(REPO_ROOT.length + 1)}: missing Mystery Club navigation loader`);
  }
  return found;
}

function refreshLanguageAdventureFileCount() {
  const manifestPath = join(REPO_ROOT, MANIFEST);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const entry = manifest.apps.find((app) => app.name === "language-adventures");
  if (!entry) throw new Error(`${MANIFEST}: language-adventures entry is missing`);
  entry.files = files(join(REPO_ROOT, "language-adventures")).length;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Everything that can drift: returns the list of problems (empty when the mounts are sound). */
export function problems() {
  const found = [];
  const manifest = existsSync(join(REPO_ROOT, MANIFEST))
    ? JSON.parse(readFileSync(join(REPO_ROOT, MANIFEST), "utf8"))
    : { apps: [] };
  for (const app of APPS) {
    const dir = join(REPO_ROOT, app.name);
    if (!existsSync(join(dir, "index.html"))) {
      found.push(`${app.name}: missing index.html`);
      continue;
    }
    const all = files(dir);
    if (existsSync(join(dir, "404.html"))) found.push(`${app.name}: 404.html must not ship`);
    for (const f of all)
      if (GATED_WORD.test(f.slice(dir.length)))
        found.push(`${app.name}: gated word in path ${f.slice(dir.length)}`);
    if (!readFileSync(join(dir, "index.html"), "utf8").includes(`${app.mount}/_next/`))
      found.push(
        `${app.name}: index.html does not load its assets from ${app.mount}/_next/ (wrong basePath)`,
      );
    const entry = manifest.apps.find((a) => a.name === app.name);
    if (!entry) found.push(`${app.name}: not in ${MANIFEST}`);
    else if (entry.files !== all.length)
      found.push(`${app.name}: ${MANIFEST} says ${entry.files} files, disk has ${all.length}`);
  }
  if (!readFileSync(join(REPO_ROOT, HUB_FILE), "utf8").includes(HUB_LINKS))
    found.push(`${HUB_FILE}: adventure hub links are stale`);
  found.push(...mysteryStudioProblems());
  return found;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--check")) {
    const found = problems();
    for (const p of found) console.error(`✗ ${p}`);
    if (found.length) process.exit(1);
    console.log(`✓ ${APPS.map((a) => a.name).join(", ")} mounts are sound`);
    return;
  }
  if (args.includes("--overlay-only")) {
    const app = APPS.find((item) => item.name === "language-adventures");
    publishMysteryStudio(join(REPO_ROOT, app.name));
    refreshLanguageAdventureFileCount();
    console.log("language-adventures: mounted Mystery Club source and refreshed navigation links");
    return;
  }
  const given = args.flatMap((a, i) => (a === "--app" ? [args[i + 1] ?? ""] : []));
  if (!given.length) throw new Error("usage: --app <name>=<checkout> (repeatable) | --check");
  const previous = existsSync(join(REPO_ROOT, MANIFEST))
    ? JSON.parse(readFileSync(join(REPO_ROOT, MANIFEST), "utf8")).apps
    : [];
  const entries = new Map(previous.map((a) => [a.name, a]));
  for (const spec of given) {
    const [name, path] = spec.split("=");
    const app = APPS.find((a) => a.name === name);
    if (!app || !path)
      throw new Error(`unknown app spec "${spec}"; names: ${APPS.map((a) => a.name).join(", ")}`);
    const entry = publish(app, resolve(path));
    entries.set(name, { ...entry, files: files(join(REPO_ROOT, name)).length });
    console.log(`${name}: ${entries.get(name).files} files from ${entry.commit.slice(0, 10)}`);
  }
  const apps = APPS.map((a) => entries.get(a.name)).filter(Boolean);
  writeFileSync(join(REPO_ROOT, MANIFEST), `${JSON.stringify({ apps }, null, 2)}\n`);
  writeFileSync(
    join(REPO_ROOT, HUB_FILE),
    withHubLinks(readFileSync(join(REPO_ROOT, HUB_FILE), "utf8")),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
