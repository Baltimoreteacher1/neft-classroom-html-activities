#!/usr/bin/env node
/**
 * Inject the Projects PREMIUM design layer into every unit-project page.
 *
 * - Version pages (math/unit-N/projects/version-{a,b}/index.html): already use
 *   <body class="pk">, so we only add the premium stylesheet <link>.
 * - Index/hub pages (math/unit-N/projects/index.html): add the <link> AND tag
 *   <body> with `pk-hub` so the storefront premium rules apply.
 *
 * Idempotent: safe to re-run. Edits source files in place (Cloudflare rebuilds
 * dist/ from source on push to main).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LINK = '<link rel="stylesheet" href="/shared/projects/projects-premium.css" />';
const TABS_CSS = '<link rel="stylesheet" href="/shared/projects/projects-tabs.css" />';
const TABS_JS = '<script src="/shared/projects/projects-tabs.js" defer></script>';

const UNITS = Array.from({ length: 10 }, (_, i) => i + 1);
let changed = 0;
const touched = [];

function addLink(html) {
  if (html.includes("projects-premium.css")) return html;
  // Insert just before </head>, matching the indentation style already in use.
  return html.replace(/([ \t]*)<\/head>/i, `$1  ${LINK}\n$1</head>`);
}

function addHubClass(html) {
  if (/<body[^>]*\bpk-hub\b/.test(html)) return html;
  if (/<body class="[^"]*"/.test(html)) {
    return html.replace(/<body class="([^"]*)"/, '<body class="$1 pk-hub"');
  }
  return html.replace(/<body(\s|>)/, '<body class="pk-hub"$1');
}

// Version pages (with .phase sections) get the tabbed-stepper enhancement.
function addTabsAssets(html) {
  if (!html.includes("projects-tabs.css")) {
    html = html.replace(/([ \t]*)<\/head>/i, `$1  ${TABS_CSS}\n$1</head>`);
  }
  if (!html.includes("projects-tabs.js")) {
    html = html.replace(/([ \t]*)<\/body>/i, `$1  ${TABS_JS}\n$1</body>`);
  }
  return html;
}

/* --------------------------------------------------------------------------
   Level 0 (most-supported / IEP) + Read-Aloud (TTS) injection
   Scheme: L0 < L1 < L2. PK.setLevel/initTts/CSS handle the behavior; here we
   only add the controls + a content-neutral Level-0 support card. The card is
   intentionally page-agnostic (sentence starters + "first step" framing +
   "ask for smaller numbers") so it is always pedagogically correct regardless
   of each page's unique math. Idempotent via marker comments.
   -------------------------------------------------------------------------- */
const L0_BTN_MARK = 'data-level-btn="level-0"';
const TTS_BTN_MARK = "data-tts-toggle";
const L0_CARD_MARK = "pk-l0-injected";

// Add a Level-0 button as the first child of the existing .pk-level-toggle.
function addLevel0Button(html) {
  if (html.includes(L0_BTN_MARK)) return html;
  const btn =
    '<button data-level-btn="level-0" type="button">\n' +
    "            🟣 Level 0 (most support)\n" +
    "          </button>\n          ";
  return html.replace(/(<span class="pk-level-toggle"[^>]*>\s*)/i, `$1${btn}`);
}

// Add a Read-Aloud toggle button right after the EN/ES help button.
function addTtsButton(html) {
  if (html.includes(TTS_BTN_MARK)) return html;
  const btn =
    '\n        <button data-tts-toggle type="button" aria-pressed="false">\n' +
    "          🔊 Read aloud\n" +
    "        </button>";
  // Anchor after the toggleEs button; fall back to start of toolbar.
  if (/<button[^>]*onclick="PK\.toggleEs\(\)"[^>]*>[\s\S]*?<\/button>/i.test(html)) {
    return html.replace(
      /(<button[^>]*onclick="PK\.toggleEs\(\)"[^>]*>[\s\S]*?<\/button>)/i,
      `$1${btn}`,
    );
  }
  return html.replace(/(<div class="toolbar[^"]*"[^>]*>)/i, `$1${btn}`);
}

// Content-neutral Level-0 support card, placed after the intro-card (or, if
// absent, after the progress-wrap). Visible only when body.pk-level-0 is set.
const L0_CARD = `      <!-- ${L0_CARD_MARK} (tools/inject-projects-premium.mjs) -->
      <section class="pk-lvl0 pk-l0-card" aria-label="Most-supported help">
        <span class="pk-l0-tag">🟣 Level 0 · Most support</span>
        <h4>Start here — you can do this one step at a time</h4>
        <ul>
          <li>Read each box out loud. Tap <b>🔊 Read aloud</b> at the top, then tap a prompt to hear it.</li>
          <li>Do the <b>first step only</b>, then check it before moving on. One small step at a time is okay.</li>
          <li>Use <b>smaller, friendly numbers</b> first (like 10, 20, or 100). Get the steps right, then try the real numbers.</li>
          <li>Stuck? Open the <b>💡 hint</b> in that step, or raise your hand and ask for the worked first example.</li>
        </ul>
        <h4>Sentence starters you can use</h4>
        <ul>
          <li class="pk-l0-starter">"My plan is to ______ because ______."</li>
          <li class="pk-l0-starter">"First I will ______. Next I will ______."</li>
          <li class="pk-l0-starter">"I know ______, so the answer should be about ______."</li>
          <li class="pk-l0-starter">"My answer is ______. I checked it by ______."</li>
        </ul>
      </section>
`;

function addLevel0Card(html) {
  if (html.includes(L0_CARD_MARK)) return html;
  // Prefer placing right after the closing </div> of .progress-wrap so the card
  // sits at the top of .wrap before the first phase. Match the opening tag and
  // insert before it if we can find the intro-card; otherwise after progress.
  const introClose = /(<\/section>\s*)(?=<section class="phase)/i;
  // Insert immediately after the progress-wrap block (most reliable anchor).
  const progress = /(<div class="progress-wrap">[\s\S]*?<\/div>\s*<\/div>\s*)/i;
  if (progress.test(html)) {
    return html.replace(progress, `$1\n${L0_CARD}`);
  }
  // Fallback: before the first phase section.
  if (introClose.test(html)) {
    return html.replace(introClose, `$1${L0_CARD}`);
  }
  return html;
}

function process(rel, { hub, tabs } = {}) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn("  skip (missing):", rel);
    return;
  }
  const before = fs.readFileSync(file, "utf8");
  let after = addLink(before);
  if (hub) after = addHubClass(after);
  if (tabs) {
    after = addTabsAssets(after);
    // Version pages get the Level-0 tier + Read-Aloud control + L0 support card.
    after = addLevel0Button(after);
    after = addTtsButton(after);
    after = addLevel0Card(after);
  }
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    touched.push(rel);
  }
}

const DIRS = [...UNITS.map((u) => `math/unit-${u}/projects`), "math/statistics/projects"];

for (const dir of DIRS) {
  process(`${dir}/index.html`, { hub: true });
  process(`${dir}/version-a/index.html`, { tabs: true });
  process(`${dir}/version-b/index.html`, { tabs: true });
}

console.log(`Projects premium injection: ${changed} file(s) updated.`);
touched.forEach((t) => console.log("  +", t));
