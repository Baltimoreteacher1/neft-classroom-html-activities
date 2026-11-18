// Markup for the Word problems step: the button every curriculum practice studio shows after its last step,
// and the shared page it opens (/math/word-problems/?lesson=<id>).

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { NSR_BODY, NSR_HEAD } from "./practice-studio-pages.mjs";

export const WORD_PROBLEMS_URL = "/math/word-problems/";
export const WP_RUNTIME = [
  "assets/studio/word-problems.mjs",
  "assets/studio/word-problems-card.mjs",
  "assets/studio/word-problems-inline.mjs",
  "assets/studio/word-problems-answer.mjs",
  "assets/studio/word-problems.css",
  "assets/studio/word-problems-card.css",
  "assets/studio-viz.js",
  "assets/studio-viz-geo.js",
  "assets/studio-viz-model.js",
];
/** The figure renderer the cards draw with; the generated studios already load it. */
const VIZ_SCRIPTS = ["studio-viz.js", "studio-viz-geo.js", "studio-viz-model.js"];
export const vizScripts = (/** @type {string} */ v) =>
  VIZ_SCRIPTS.map((f) => `  <script src="/assets/${f}?v=${v}" defer></script>`).join("\n");
/** Which studio step (index into a 5-step studio) shows each in-step "Real-world check": steps 2, 3 and 5. */
export const WP_STEP_PANELS = [1, 2, 4];

let cachedVersion = "";
/** One cache stamp for the word-problems runtime and data, shared by the page and every studio that embeds a card. */
export function wordProblemsVersion() {
  if (cachedVersion) return cachedVersion;
  const h = createHash("sha1");
  for (const f of WP_RUNTIME) h.update(readFileSync(join(REPO_ROOT, f)));
  const dir = join(REPO_ROOT, "data/word-problems");
  for (const f of readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort())
    h.update(readFileSync(join(dir, f)));
  cachedVersion = h.digest("hex").slice(0, 10);
  return cachedVersion;
}

/** Head tags a studio needs for its in-step cards. */
export const wordProblemsInlineHead = () => {
  const v = wordProblemsVersion();
  return `  <link rel="stylesheet" href="/assets/studio/word-problems-card.css?v=${v}">\n  <script type="module" src="/assets/studio/word-problems-inline.mjs?v=${v}"></script>`;
};

/** A "Real-world check" card slot: the runtime fills it with the lesson's steps[n] problem. */
export function wordProblemsInline(/** @type {string} */ id, /** @type {number} */ n) {
  return `<section class="wp-inline" data-wp-lesson="${id}" data-wp-step="${n}" data-wp-v="${wordProblemsVersion()}" aria-label="Real-world check" hidden>
        <p class="wp-inline-kicker"><span class="t-en">Real-world check</span><span class="t-es" lang="es">Aplícalo en la vida real</span></p>
        <div data-wp-host></div>
      </section>`;
}

/** The "Word problems" button that closes a studio's final step. `from` is the studio page to return to. */
export function wordProblemsCta(/** @type {string} */ id, /** @type {string} */ from) {
  const href = `${WORD_PROBLEMS_URL}?lesson=${encodeURIComponent(id)}&amp;from=${encodeURIComponent(from)}`;
  return `<aside class="wp-cta" aria-label="Word problems">
        <div><p class="wp-cta__title"><span class="t-en">Ready for real life?</span><span class="t-es" lang="es">¿Listo para la vida real?</span></p><p class="wp-cta__text"><span class="t-en">Use this lesson to solve a few word problems, with hints when you need them.</span><span class="t-es" lang="es">Usa esta lección para resolver algunos problemas verbales, con pistas cuando las necesites.</span></p></div>
        <a class="wp-cta__btn" href="${href}"><span class="t-en">Word problems</span><span class="t-es" lang="es">Problemas verbales</span> <span aria-hidden="true">→</span></a>
      </aside>`;
}

/** The shared page; the runtime fills it from /math/word-problems/unit-<n>.json. */
export function wordProblemsPage(v = wordProblemsVersion()) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Word problems | EduWonderLab</title>
  <meta name="description" content="Grade 6 word problems for each practice studio lesson, with hints and feedback.">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/assets/studio/word-problems.css?v=${v}">
  <link rel="stylesheet" href="/assets/studio/word-problems-card.css?v=${v}">
${vizScripts(v)}
  <script type="module" src="/assets/studio/word-problems.mjs?v=${v}"></script>
${NSR_HEAD}
</head>
<body data-v="${v}">
  <a class="wp-skip" href="#wp-main">Skip to the problems</a>
  <header class="wp-header">
    <div class="wp-header__row">
      <a id="wp-back" href="/math/practice-studio/"><span aria-hidden="true">←&nbsp;</span><span class="t-en">Practice</span><span class="t-es" lang="es">Práctica</span></a>
      <h1><span class="t-en">Word problems</span><span class="t-es" lang="es">Problemas verbales</span><small id="wp-lesson"></small></h1>
      <button type="button" id="wp-lang" aria-pressed="false">Español</button>
    </div>
  </header>
  <main class="wp-main" id="wp-main">
    <details class="wp-words" id="wp-words" hidden></details>
    <div class="wp-progress"><div class="wp-dots" id="wp-dots" role="group" aria-label="Problems"></div><p><span class="t-en">Solve each one. Hints are there when you need them.</span><span class="t-es" lang="es">Resuelve cada uno. Las pistas están ahí cuando las necesites.</span></p></div>
    <div id="wp-stage" aria-live="polite"></div>
  </main>
${NSR_BODY}
</body>
</html>
`;
}
