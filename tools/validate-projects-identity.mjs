#!/usr/bin/env node
/**
 * Gate for the Projects identity layer (one look per project).
 *
 * Holds what the builder cannot see from inside itself:
 *  1. the committed tokens and art equal a fresh build (stale or orphan files fail);
 *  2. every classic project page carries data-project=<its registry id>, the font bundle, the
 *     tokens and the layout, in that order and after every other stylesheet;
 *  3. the Studio loads the tokens and sets the attribute; both gallery pages mark every card;
 *  4. the identities really differ: no two projects share an accent, an ink or a scene.
 * The page and distinctness detectors are self-tested on known-bad fixtures first, and a sweep
 * of fewer pages than the registry lists fails.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES } from "./lib/project-identity/themes.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const registry = JSON.parse(read("data/project-registry.json"));
const failures = [];
const fail = (msg) => failures.push(msg);

const IDENTITY = "shared/projects/identity";
const FONTS = "/assets/fonts/project-identity.css";

/** Findings for one classic page's HTML. */
function pageFindings(html, id) {
  const out = [];
  if (!new RegExp(`<body[^>]*\\sdata-project="${id}"`).test(html))
    out.push(`body lacks data-project="${id}"`);
  const at = (needle) => html.indexOf(needle);
  const [f, t, l] = [
    FONTS,
    `${IDENTITY}/projects-identity-tokens.css`,
    `${IDENTITY}/projects-identity.css`,
  ].map(at);
  if (f < 0 || t < 0 || l < 0) out.push("missing font, tokens or layout link");
  else if (!(f < t && t < l)) out.push("identity links are out of order");
  const headEnd = html.search(/<\/head>/i);
  const lastSheet = [...html.slice(0, headEnd).matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].pop();
  if (lastSheet && !lastSheet[0].includes("projects-identity.css"))
    out.push("identity layout is not the last stylesheet");
  return out;
}

/** Findings for the set of identities: shared accent, ink or scene means two projects look alike. */
function distinctFindings(themes, sceneHashes) {
  const out = [];
  for (const key of ["accent", "ink"]) {
    const seen = new Map();
    for (const [id, th] of Object.entries(themes)) {
      if (seen.has(th[key])) out.push(`${id} and ${seen.get(th[key])} share ${key} ${th[key]}`);
      else seen.set(th[key], id);
    }
  }
  const byHash = new Map();
  for (const [id, h] of Object.entries(sceneHashes)) {
    if (byHash.has(h)) out.push(`${id} and ${byHash.get(h)} have identical scenes`);
    else byHash.set(h, id);
  }
  return out;
}

function selfTest() {
  const good = `<head><link rel="stylesheet" href="${FONTS}"><link rel="stylesheet" href="/${IDENTITY}/projects-identity-tokens.css"><link rel="stylesheet" href="/${IDENTITY}/projects-identity.css"></head><body data-project="x">`;
  const cases = [
    [good, "x", 0],
    [good.replace('data-project="x"', ""), "x", 1],
    [good.replace(/<link[^>]*tokens[^>]*>/, ""), "x", 1],
    [good.replace("</head>", '<link rel="stylesheet" href="/late.css"></head>'), "x", 1],
  ];
  for (const [html, id, n] of cases)
    if (pageFindings(html, id).length !== n)
      throw new Error(`self-test: page detector wrong for ${id} (${n} expected)`);
  const dup = distinctFindings(
    { a: { accent: "#111111", ink: "#000001" }, b: { accent: "#111111", ink: "#000002" } },
    { a: "h1", b: "h1" },
  );
  if (dup.length !== 2) throw new Error("self-test: distinctness detector did not fire");
}

selfTest();

// 1. fresh build equals committed files
try {
  execFileSync("node", ["tools/build-project-identity.mjs", "--check"], {
    cwd: ROOT,
    stdio: "pipe",
  });
} catch (e) {
  fail(`build --check failed:\n${String(e.stderr || e.stdout || e.message).trim()}`);
}

// 2. classic pages
let pages = 0;
for (const p of registry.projects) {
  if (!p.launchUrl.startsWith("/math/")) continue;
  const rel = `${p.launchUrl.replace(/^\/|\/$/g, "")}/index.html`;
  pages++;
  for (const f of pageFindings(read(rel), p.id)) fail(`${rel}: ${f}`);
}

// 2b. unit hubs: flagship identity on the body, every version card names its own project
const byUrl = new Map(registry.projects.map((p) => [p.launchUrl, p.id]));
for (const hub of registry.hubs) {
  const rel = `${hub.route.replace(/^\/|\/$/g, "")}/index.html`;
  const html = read(rel);
  const members = hub.projects.map((id) => registry.projects.find((p) => p.id === id));
  const lead = members.find((p) => p.classification === "flagship") ?? members[0];
  for (const f of pageFindings(html, lead.id)) fail(`${rel}: ${f}`);
  for (const [, href, id] of [
    ...html.matchAll(/<a class="activity-card" data-project="([^"]*)" href="([^"]+)"/g),
  ].map((m) => [m[0], m[2], m[1]]))
    if (byUrl.get(href) !== id) fail(`${rel}: card for ${href} carries data-project ${id}`);
  const cards = [...html.matchAll(/<a class="activity-card"[^>]*href="([^"]+)"/g)].filter((m) =>
    byUrl.has(m[1]),
  );
  const marked = [...html.matchAll(/<a class="activity-card" data-project=/g)];
  if (marked.length !== cards.length)
    fail(`${rel}: ${cards.length} project cards, ${marked.length} marked`);
  pages++;
}

const expectPages =
  registry.projects.filter((p) => p.launchUrl.startsWith("/math/")).length + registry.hubs.length;
if (pages < expectPages || pages === 0)
  fail(`swept ${pages} classic and hub pages, registry lists ${expectPages}`);

// 3. Studio and galleries
const studio = read("curriculum/projects/studio/index.html");
for (const needle of [
  FONTS,
  `${IDENTITY}/projects-identity-tokens.css`,
  `${IDENTITY}/projects-identity-studio.css`,
])
  if (!studio.includes(needle)) fail(`Studio index.html does not link ${needle}`);
if (!/dataset\.project\s*=\s*project\.id/.test(read("curriculum/projects/studio/studio.js")))
  fail("studio.js does not set document.documentElement.dataset.project");
for (const rel of ["curriculum/projects/index.html", "math/projects/index.html"]) {
  const html = read(rel);
  const cards = [...html.matchAll(/<li class="pg-card" data-id="([^"]+)" data-project="([^"]+)"/g)];
  if (cards.length !== registry.projects.length)
    fail(`${rel}: ${cards.length} marked cards, registry lists ${registry.projects.length}`);
  for (const [, a, b] of cards) if (a !== b) fail(`${rel}: card ${a} carries data-project ${b}`);
  if (!html.includes(`${IDENTITY}/projects-identity-tokens.css`))
    fail(`${rel}: tokens stylesheet not linked`);
}

// 4. distinctness
const hashes = {};
for (const p of registry.projects) {
  const file = path.join(ROOT, IDENTITY, "art", `${p.id}.svg`);
  if (!fs.existsSync(file)) fail(`${p.id}: art file missing`);
  else hashes[p.id] = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
}
for (const f of distinctFindings(THEMES, hashes)) fail(f);

if (failures.length) {
  console.error(
    `validate-projects-identity: ${failures.length} problem(s)\n  ${failures.join("\n  ")}`,
  );
  globalThis.process.exit(1);
}
console.log(
  `validate-projects-identity: ${registry.projects.length} projects, ${pages} classic pages, all identities distinct`,
);
