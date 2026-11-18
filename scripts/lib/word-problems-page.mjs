// Markup for the Word problems step: the button every curriculum practice studio shows after its last step,
// and the shared page it opens (/math/word-problems/?lesson=<id>).

import { NSR_BODY, NSR_HEAD } from "./practice-studio-pages.mjs";

export const WORD_PROBLEMS_URL = "/math/word-problems/";

/** The "Word problems" button that closes a studio's final step. `from` is the studio page to return to. */
export function wordProblemsCta(/** @type {string} */ id, /** @type {string} */ from) {
  const href = `${WORD_PROBLEMS_URL}?lesson=${encodeURIComponent(id)}&amp;from=${encodeURIComponent(from)}`;
  return `<aside class="wp-cta" aria-label="Word problems">
        <div><p class="wp-cta__title"><span class="t-en">Ready for real life?</span><span class="t-es" lang="es">¿Listo para la vida real?</span></p><p class="wp-cta__text"><span class="t-en">Use this lesson to solve a few word problems, with hints when you need them.</span><span class="t-es" lang="es">Usa esta lección para resolver algunos problemas verbales, con pistas cuando las necesites.</span></p></div>
        <a class="wp-cta__btn" href="${href}"><span class="t-en">Word problems</span><span class="t-es" lang="es">Problemas verbales</span> <span aria-hidden="true">→</span></a>
      </aside>`;
}

/** The shared page; the runtime fills it from /math/word-problems/unit-<n>.json. */
export function wordProblemsPage(/** @type {string} */ v) {
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
    <div class="wp-progress"><div class="wp-dots" id="wp-dots" role="group" aria-label="Problems"></div><p><span class="t-en">Solve each one. Hints are there when you need them.</span><span class="t-es" lang="es">Resuelve cada uno. Las pistas están ahí cuando las necesites.</span></p></div>
    <div id="wp-stage" aria-live="polite"></div>
  </main>
${NSR_BODY}
</body>
</html>
`;
}
