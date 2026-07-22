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

const SENT = "projects-interactive-hero";
// First ACTIVE wizard panel — some pages start at step-0, others step-1.
const ANCHOR_RE = /<div class="step-panel active" id="step-\d+">/;

// Per-unit widget mapping — matched to each project's ACTUAL content/title.
// `attrs` are only set where a non-default is helpful; the widgets already ship
// theme-appropriate defaults (e.g. gcf-bags = party goodie bags).
const MAP = {
  "math/unit-1/projects": {
    kind: "gcf-bags", emoji: "🎁", attrs: {},
    title: "Split the party favors evenly",
    es: "Reparte los recuerdos de fiesta en partes iguales",
    intro: "Drag to make equal goodie bags with nothing left over — that's the greatest common factor.",
  },
  "math/unit-2/projects": {
    kind: "frac-divide", emoji: "🧁", attrs: {},
    title: "Portion the batter",
    es: "Reparte la masa en porciones",
    intro: "Slice the batter into servings and watch how dividing by a smaller fraction makes MORE portions.",
  },
  "math/unit-3/projects": {
    kind: "ratio-build", emoji: "🥤", attrs: {},
    title: "Mix the ratio",
    es: "Mezcla la razón",
    intro: "Build the recipe and scale it up — keep the ratio equivalent as the batch grows.",
  },
  "math/unit-4/projects": {
    kind: "percent-bar", emoji: "🏷️",
    attrs: { mode: "tax", base: "40", percent: "6" },
    title: "Mark it down, add the tax",
    es: "Aplica el descuento y suma el impuesto",
    intro: "Drag the percent — see the discount and tax move the price bar live before you commit.",
  },
  "math/unit-5/projects": {
    kind: "area-tiler", emoji: "📐",
    attrs: { theme: "room", unit: "ft" },
    title: "Tile the floor",
    es: "Cubre el piso con baldosas",
    intro: "Drag the room's sides and watch the area recompute as the tiles fill the space.",
  },
  "math/unit-6/projects": {
    kind: "expr-machine", emoji: "🎮", attrs: {},
    title: "Build the scoring machine",
    es: "Arma la máquina de puntaje",
    intro: "Wire an expression, feed in a value, and watch the score flow through the machine.",
  },
  "math/unit-7/projects": {
    kind: "coord-plot", emoji: "🗺️",
    attrs: { range: "10" },
    title: "Plot the park",
    es: "Ubica las atracciones",
    intro: "Place attractions across all four quadrants and read the distance between them.",
  },
  "math/unit-8/projects": {
    kind: "escape-chain", emoji: "🕵️",
    attrs: {},
    title: "Detective: crack the vault",
    es: "Detective: descifra la bóveda",
    intro: "Solve each lock's equation by undoing it on BOTH sides — open every lock to reveal the vault code.",
  },
  "math/unit-9/projects": {
    kind: "line-grapher", emoji: "📈", attrs: {},
    title: "Grow the channel",
    es: "Haz crecer el canal",
    intro: "Set the growth rate and graph it — the slope is subscribers gained each week.",
  },
  "math/unit-10/projects": {
    kind: "cube-builder", emoji: "📦",
    attrs: { mode: "box", unit: "in" },
    title: "Design the package",
    es: "Diseña el paquete",
    intro: "Size the box and unfold it — watch the volume fill and the surface area add up face by face.",
  },
  "math/statistics/projects": {
    kind: "dot-plot", emoji: "📊",
    attrs: { max: "20" },
    title: "Read the data",
    es: "Interpreta los datos",
    intro: "Drag the dots and watch the mean, median, and spread shift — then pick the measure that tells the truth.",
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
    ""
  );
}

function addHead(html) {
  if (html.includes("projects-interactive-hero.css")) return html;
  const indented = headBlock().map((l) => "    " + l).join("\n");
  return html.replace(/([ \t]*)<\/head>/i, `${indented}\n$1</head>`);
}
function addBody(html, kind) {
  if (html.includes(`manip-${kind}.js`)) return html;
  const indented = bodyBlock(kind).map((l) => "  " + l).join("\n");
  return html.replace(/([ \t]*)<\/body>/i, `${indented}\n$1</body>`);
}
function addHero(html, cfg) {
  if (html.includes("pki-hero-title")) return html; // hero already present
  const m = html.match(ANCHOR_RE);
  if (!m) return html; // anchor missing — skip content, log below
  const block = heroBlock(cfg).join("\n") + "\n";
  return html.replace(ANCHOR_RE, block + m[0]);
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
    fs.writeFileSync(file, after);
    changed++;
    touched.push(`${rel} [${cfg.kind}]`);
  }
}

for (const [dir, cfg] of Object.entries(MAP)) {
  // version-c exists for a few units (e.g. unit-8); process() skips missing files.
  for (const v of ["version-a", "version-b", "version-c"]) {
    process(`${dir}/${v}/index.html`, cfg);
  }
}

console.log(`Projects interactive-hero injection: ${changed} file(s) updated.`);
touched.forEach((t) => console.log("  +", t));
if (skipped.length) {
  console.log(`Skipped ${skipped.length}:`);
  skipped.forEach((s) => console.log("  -", s));
}
