#!/usr/bin/env node
/**
 * Activate the built-but-unwired interactive manipulatives on every unit
 * culminating-project WIZARD page (math/unit-N/projects/version-{a,b}/index.html
 * + math/statistics/projects/version-{a,b}). Each unit gets ONE self-mounting
 * `.pki-manip` widget matched to that project's actual math, placed as a titled
 * centerpiece ABOVE step 1 — so the very first thing a student does is a live,
 * drag-to-solve interaction instead of typing into a box.
 *
 * The widgets (shared/projects/manip-*.js) self-hydrate by scanning for
 * `.pki-manip[data-manip=...]` and inject their own CSS. This layer adds only:
 *   • <link> to projects-interactive-hero.css  (the wrapper card)
 *   • <script> to the ONE manip file that unit needs
 *   • the visible `.pki-hero` section (heading + intro EN/ES + the widget div)
 *
 * Additive + scoped under body.pro-projects (already present from the PRO layer),
 * so the .pk-hub storefronts are untouched. Idempotent: begin/end sentinels +
 * content guard. Edits source in place — Cloudflare rebuilds dist/ on push.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// NOTE: this module declares a local `function process(rel, cfg)`, which hoists
// and shadows Node's global `process`. Read argv off globalThis explicitly.
const DRY = globalThis.process.argv.includes("--dry-run");

const SENT = "projects-interactive-hero";
// First ACTIVE wizard panel — some pages start at step-0, others step-1.
const ANCHOR_RE = /<div class="step-panel active" id="step-\d+">/;

// Per-unit widget mapping — matched to each project's ACTUAL content/title.
// `attrs` are only set where a non-default is helpful; the widgets already ship
// theme-appropriate defaults (e.g. gcf-bags = party goodie bags).
const MAP = {
  /* The Pre-Unit is the district's ASSEMBLED unit (1-1, 2-6, 2-7, 6-1, 6-2) and
     its whole arc is division across number types, so the hero is the
     "how many fit?" model that Lessons 6-1/6-2 build on. */
  "math/pre-unit/projects": {
    kind: "frac-divide",
    emoji: "🚚",
    attrs: {},
    title: "How many fit?",
    es: "¿Cuántos caben?",
    intro:
      "Cut a whole into equal pieces and count how many fit — the same question you will ask of whole numbers, decimals and fractions all project long.",
  },
  "math/unit-1/projects": {
    kind: "block-party",
    emoji: "🎉",
    attrs: {},
    title: "Plan the block party",
    es: "Planea la fiesta del barrio",
    intro:
      "Split the goodie bags (GCF), sync the entertainment (LCM), and set the budget to get the party ready.",
  },
  // Canonical Unit 2 is "Data Detectives" (statistics) — see
  // data/curriculum-unit-identities.json. math/unit-2/projects is a mirror of
  // math/statistics/projects, so it MUST get the same stat-draft widget.
  // It previously mapped to recipe-rush (fraction division), which is the
  // legacy Reveal-era Unit 2. Never re-derive this unit from a path number.
  "math/unit-2/projects": {
    kind: "stat-draft",
    emoji: "🔍",
    attrs: {},
    title: "Read the data",
    es: "Interpreta los datos",
    intro:
      "Spot the outlier that yanks the mean, then pick the measure — mean or median — that tells the truth.",
  },
  "math/unit-3/projects": {
    kind: "mix-lab",
    emoji: "🥤",
    attrs: {},
    title: "Mix the ratio",
    es: "Mezcla la razón",
    intro: "Build the recipe and scale it up — keep the ratio equivalent as the batch grows.",
  },
  "math/unit-4/projects": {
    kind: "market-day",
    emoji: "🏪",
    attrs: {},
    title: "Market Day: price to win",
    es: "Día de mercado: pon el precio para ganar",
    intro:
      "Set your discount to beat the rival kiosk AND stay above cost, then open the shop and clear the rent.",
  },
  "math/unit-5/projects": {
    kind: "blueprint-studio",
    emoji: "📐",
    attrs: {},
    title: "Measure each room",
    es: "Halla el área de cada cuarto",
    intro:
      "Find the area of each room — rectangles, triangles, trapezoids — to pass the blueprint.",
  },
  "math/unit-6/projects": {
    kind: "combo-forge",
    emoji: "🎮",
    attrs: {},
    title: "Build the scoring machine",
    es: "Arma la máquina de puntaje",
    intro:
      "Evaluate each expression to hit the target score — powers, coefficients, and order of operations.",
  },
  "math/unit-7/projects": {
    kind: "park-map",
    emoji: "🗺️",
    attrs: {},
    title: "Design the park map",
    es: "Diseña el mapa del parque",
    intro:
      "Plot each attraction across the four quadrants and measure the distance between them to finish the map.",
  },
  "math/unit-8/projects": {
    kind: "escape-chain",
    emoji: "🕵️",
    attrs: {},
    title: "Detective: crack the vault",
    es: "Detective: descifra la bóveda",
    intro:
      "Solve each lock's equation by undoing it on BOTH sides — open every lock to reveal the vault code.",
  },
  "math/unit-9/projects": {
    kind: "growth-room",
    emoji: "📈",
    attrs: {},
    title: "Grow the channel",
    es: "Haz crecer el canal",
    intro: "Set the growth rate and graph it — the slope is subscribers gained each week.",
  },
  "math/unit-10/projects": {
    kind: "fold-fill",
    emoji: "📦",
    attrs: {},
    title: "Design the package",
    es: "Diseña el paquete",
    intro:
      "Size the box and unfold it — watch the volume fill and the surface area add up face by face.",
  },
  "math/statistics/projects": {
    kind: "stat-draft",
    emoji: "🔍",
    attrs: {},
    title: "Read the data",
    es: "Interpreta los datos",
    intro:
      "Spot the outlier that yanks the mean, then pick the measure — mean or median — that tells the truth.",
  },
};

function headBlock() {
  return [
    `<!-- ${SENT}-injected:begin (interactive centerpiece — tools/inject-projects-interactive-hero.mjs) -->`,
    '<link rel="stylesheet" href="/shared/projects/projects-interactive-hero.css" />',
    `<!-- ${SENT}-injected:end -->`,
  ];
}
function bodyBlock(kind) {
  return [
    `<!-- ${SENT}-injected:begin (interactive centerpiece — tools/inject-projects-interactive-hero.mjs) -->`,
    `<script src="/shared/projects/manip-${kind}.js" defer></script>`,
    `<!-- ${SENT}-injected:end -->`,
  ];
}
function heroBlock(cfg) {
  const attrs = Object.entries(cfg.attrs)
    .map(([k, v]) => ` data-${k}="${v}"`)
    .join("");
  return [
    `<!-- ${SENT}-injected:begin (interactive centerpiece — tools/inject-projects-interactive-hero.mjs) -->`,
    '<section class="pki-hero no-print" aria-label="Interactive warm-up">',
    '  <div class="pki-hero-head">',
    `    <span class="pki-hero-emoji" aria-hidden="true">${cfg.emoji}</span>`,
    "    <div>",
    `      <h2 class="pki-hero-title">${cfg.title}</h2>`,
    `      <p class="pki-hero-sub">${cfg.es}</p>`,
    "    </div>",
    '    <span class="pki-hero-badge">Try it first</span>',
    "  </div>",
    `  <p class="pki-hero-intro">${cfg.intro}</p>`,
    `  <div class="pki-manip" data-manip="${cfg.kind}"${attrs}></div>`,
    "</section>",
    `<!-- ${SENT}-injected:end -->`,
  ];
}

// Remove this layer's own sentinel blocks so a re-run converges to the current
// MAP (e.g. re-pointing a unit to a different widget). Only strips OUR markers.
function stripSentinels(html) {
  return html.replace(
    /[ \t]*<!-- projects-interactive-hero-injected:begin[\s\S]*?projects-interactive-hero-injected:end -->\n?/g,
    "",
  );
}

function addHead(html) {
  if (html.includes("projects-interactive-hero.css")) return html;
  const indented = headBlock()
    .map((l) => "    " + l)
    .join("\n");
  return html.replace(/([ \t]*)<\/head>/i, `${indented}\n$1</head>`);
}
function addBody(html, kind) {
  if (html.includes(`manip-${kind}.js`)) return html;
  const indented = bodyBlock(kind)
    .map((l) => "  " + l)
    .join("\n");
  return html.replace(/([ \t]*)<\/body>/i, `${indented}\n$1</body>`);
}
function addHero(html, cfg) {
  if (html.includes("pki-hero-title")) return html; // hero already present
  const m = html.match(ANCHOR_RE);
  if (!m) return html; // anchor missing — skip content, log below
  const block = heroBlock(cfg).join("\n") + "\n";
  // Insert INSIDE the first active step panel (after its opening tag) so the
  // wizard's own `.step-panel:not(.active){display:none}` hides the card once
  // the student advances past the first step — it shows on step 1 only.
  return html.replace(ANCHOR_RE, m[0] + "\n" + block);
}

let changed = 0;
const touched = [];
const skipped = [];

function process(rel, cfg) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes("pro-projects")) {
    skipped.push(`${rel} (no pro-projects body class)`);
    return;
  }
  // Strip our own prior blocks first so a changed MAP (new widget/copy) applies.
  let after = stripSentinels(before);
  after = addHead(after);
  after = addBody(after, cfg.kind);
  const withHero = addHero(after, cfg);
  if (withHero === after && !after.includes("pki-hero-title")) {
    skipped.push(`${rel} (step-1 anchor not found)`);
  }
  after = withHero;
  if (after !== before) {
    if (!DRY) fs.writeFileSync(file, after);
    changed++;
    touched.push(`${rel} [${cfg.kind}]`);
  }
}

/* Enumerate version folders from disk (version-a, version-b, version-c, …).
   A hardcoded ["version-a","version-b"] list is why unit-8/version-c was
   invisible to nearly every projects-* layer — never reintroduce one. */
function versionsOf(dir) {
  try {
    return fs
      .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^version-[a-z]$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (_e) {
    return [];
  }
}

let targets = 0;
for (const [dir, cfg] of Object.entries(MAP)) {
  for (const v of versionsOf(dir)) {
    targets++;
    process(`${dir}/${v}/index.html`, cfg);
  }
}

console.log(
  `Projects interactive-hero injection${DRY ? " (dry-run)" : ""}: ${targets} page(s) enumerated, ${changed} ${DRY ? "would be updated" : "updated"}.`,
);
touched.forEach((t) => console.log("  +", t));
if (skipped.length) {
  console.log(`Skipped ${skipped.length}:`);
  skipped.forEach((s) => console.log("  -", s));
}
