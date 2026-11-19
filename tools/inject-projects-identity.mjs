#!/usr/bin/env node
/**
 * Add the Projects IDENTITY layer to every classic project page: the font bundle, the generated
 * per-project tokens, the shared layout, and `data-project="<registry id>"` on <body>.
 *
 * Pages are found through data/project-registry.json (launchUrl -> index.html, hub route ->
 * index.html), never by a hand-kept list, so a new project is covered the moment it is registered.
 * A unit hub takes its flagship project's identity and each version card its own project's. Idempotent: the block
 * is removed and re-added immediately before </head> on every run, which keeps it the last
 * stylesheet in the cascade, and the ?v= stamps follow the files' content.
 *
 *   node tools/inject-projects-identity.mjs [--dry-run]
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = globalThis.process.argv.includes("--dry-run");
const SENT = "projects-identity";
const IDENTITY = "shared/projects/identity";

const stamp = (rel) =>
  crypto
    .createHash("sha1")
    .update(fs.readFileSync(path.join(ROOT, rel)))
    .digest("hex")
    .slice(0, 10);

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "data/project-registry.json"), "utf8"));

const links = [
  `<link rel="stylesheet" href="/assets/fonts/project-identity.css" />`,
  `<link rel="stylesheet" href="/${IDENTITY}/projects-identity-tokens.css?v=${stamp(`${IDENTITY}/projects-identity-tokens.css`)}" />`,
  `<link rel="stylesheet" href="/${IDENTITY}/projects-identity.css?v=${stamp(`${IDENTITY}/projects-identity.css`)}" />`,
];
const block = [
  `<!-- ${SENT}-injected:begin (tools/inject-projects-identity.mjs) -->`,
  ...links,
  `<!-- ${SENT}-injected:end -->`,
]
  .map((l) => `    ${l}`)
  .join("\n");
const BLOCK_RE = new RegExp(
  `[ \\t]*<!-- ${SENT}-injected:begin[\\s\\S]*?${SENT}-injected:end -->\\n?`,
  "g",
);

function inject(html, id) {
  let out = html.replace(BLOCK_RE, "");
  out = out.replace(/([ \t]*)<\/head>/i, `${block}\n$1</head>`);
  /* The attribute goes LAST in the tag: validators and injectors match `<body class="level-1 …`. */
  out = out.replace(
    /<body\b([^>]*)>/,
    (_m, attrs) => `<body${attrs.replace(/\sdata-project="[^"]*"/, "")} data-project="${id}">`,
  );
  return out;
}

/** Hub pages: body takes the flagship's identity, every version card names its own project. */
const byUrl = new Map(registry.projects.map((p) => [p.launchUrl, p.id]));
function injectHub(html, hub) {
  const members = hub.projects.map((id) => registry.projects.find((p) => p.id === id));
  const lead = members.find((p) => p.classification === "flagship") ?? members[0];
  let out = inject(html, lead.id);
  out = out.replace(
    /(<a class="activity-card")(?: data-project="[^"]*")?( href="([^"]+)")/g,
    (m, a, b, href) => {
      const id = byUrl.get(href);
      return id ? `${a} data-project="${id}"${b}` : m;
    },
  );
  return out;
}

const touched = [];
let seen = 0;
for (const p of registry.projects) {
  if (!p.launchUrl.startsWith("/math/")) continue; // Studio missions are themed by the Studio script
  const rel = `${p.launchUrl.replace(/^\/|\/$/g, "")}/index.html`;
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) throw new Error(`registry project ${p.id}: ${rel} does not exist`);
  seen++;
  const before = fs.readFileSync(file, "utf8");
  const after = inject(before, p.id);
  if (after !== before) {
    if (!DRY) fs.writeFileSync(file, after);
    touched.push(rel);
  }
}
for (const hub of registry.hubs) {
  const rel = `${hub.route.replace(/^\/|\/$/g, "")}/index.html`;
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) throw new Error(`registry hub ${hub.id}: ${rel} does not exist`);
  seen++;
  const before = fs.readFileSync(file, "utf8");
  const after = injectHub(before, hub);
  if (after !== before) {
    if (!DRY) fs.writeFileSync(file, after);
    touched.push(rel);
  }
}
console.log(
  `inject-projects-identity: ${seen} pages, ${touched.length} ${DRY ? "would change" : "changed"}`,
);
