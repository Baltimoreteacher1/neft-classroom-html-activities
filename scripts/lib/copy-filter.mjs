// The filter vite.config.js's `copy-standalone-html` plugin hands to cpSync.
//
// It exists to keep dev artefacts out of the published site: a nested
// `.claude/`, `.git/`, `node_modules/` or `_engine/` folder inside a copied
// source directory, and loose markdown (QA reports, READMEs).
//
// It lives in its own module for one reason: the filter MUST be applied to the
// path RELATIVE TO THE COPY ROOT, never to the absolute path, and that is the
// kind of rule that only stays true if something tests it.
//
// Test files (`*.test.mjs`, `*.spec.ts`) are source, not content: 94 of them were published
// beside the activities they test and counted against Cloudflare Pages' 20,000-file limit.
//
// The bug that put it here: `scripts/ship.sh` assembles its deploy worktree
// under `.claude/worktrees/<name>/`. cpSync passes the filter absolute paths,
// so every single file in that worktree matched the `/.claude/` branch of the
// pattern and the entire static copy became a silent no-op. Rollup still wrote
// its own output, so `dist/` looked populated — it just had none of the
// committed statics (`assets/neft-theme.js`, `shared/save-resume/*`, every
// standalone activity folder). Production was never affected: Cloudflare builds
// on its own runner, where no ancestor directory is named `.claude`. What broke
// was the pre-push QA gate, which builds in exactly that worktree — so once
// vite.config.js grew a fail-loudly check for those assets, EVERY deploy was
// blocked by a bug that only ever existed in the deploy harness itself.

import { relative, sep } from "node:path";

// Worker config (`wrangler.toml`) and database schemas (`*.sql`) inside app folders are infrastructure, not
// pages: /lti-worker/wrangler.toml and /results-worker/migrations/0001_init.sql were publicly served. A nested
// `sync-worker/` folder inside an app (focus-school, shai-school) is that app's Worker source, not a page.
export const SKIP_COPY_RE =
  /(^|[\\/])\.(claude|git|wrangler|ruff_cache)([\\/]|$)|(^|[\\/])(node_modules|_engine)([\\/]|$)|\.md$|\.(test|spec)\.(m?js|cjs|ts)$|\.(toml|sql)$|(^|[\\/])sync-worker([\\/]|$)|\.ts$|^(focus-school|shai-school)[\\/]functions([\\/]|$)/i;
// Added 2026-11-10 (file-budget audit): `.ts` source (the 8 files in math-fluency-lab/src each sit
// beside the compiled `.js` the pages load; no page loads a `.ts`), and the Pages-Function source
// copies nested in focus-school/ and shai-school/ (live Functions deploy from the repo-root functions/).

// Build and review inputs stay in the repository but are not site content.
// These 96 JSON files were checked against shipped pages, Pages Functions,
// and shared runtime code; none is fetched or imported at runtime. Keeping the
// exclusion here prevents private QA baselines and build-only translation
// fragments from consuming Pages' 20,000-file deployment budget.
const OMITTED_DATA_JSON = new Set([
  "r2-offload-manifest.json", // build input: which downloads are in R2 (tools/offload-dist-downloads.mjs)
  "asset-standard-overrides.json",
  "auth-baseline.json",
  "browser-gate-review.json",
  "content-coverage.json",
  "curriculum-content-baseline.json",
  "curriculum-manifest.schema.json",
  "curriculum-resource-baseline.json",
  "es-translations/apply-city-blocks.json",
  "es-translations/choices-01.json",
  "es-translations/choices-02.json",
  "es-translations/choices-03.json",
  "es-translations/concept-intro-extras.json",
  "es-translations/concept-intro-titles.json",
  "es-translations/concept-intro-unit1.json",
  "es-translations/concept-intro-unit10.json",
  "es-translations/concept-intro-unit2.json",
  "es-translations/concept-intro-unit3.json",
  "es-translations/concept-intro-unit4.json",
  "es-translations/concept-intro-unit5.json",
  "es-translations/concept-intro-unit6.json",
  "es-translations/concept-intro-unit7.json",
  "es-translations/concept-intro-unit8.json",
  "es-translations/concept-intro-unit9.json",
  "es-translations/constructive-reserve-2026-08.json",
  "es-translations/explanations-01.json",
  "es-translations/explanations-02.json",
  "es-translations/explanations-03.json",
  "es-translations/explanations-04.json",
  "es-translations/hints-01.json",
  "es-translations/hints-02.json",
  "es-translations/hints-03.json",
  "es-translations/hints-04.json",
  "es-translations/hints-05.json",
  "es-translations/hints-06.json",
  "es-translations/hints-07.json",
  "es-translations/hints-08.json",
  "es-translations/hints-09.json",
  "es-translations/hints-10.json",
  "es-translations/hints-11.json",
  "es-translations/hints-12.json",
  "es-translations/sentence-stems-01.json",
  "es-translations/stems-01.json",
  "es-translations/stems-02.json",
  "es-translations/stems-03.json",
  "es-translations/stems-04.json",
  "es-translations/stems-05.json",
  "es-translations/stems-06.json",
  "es-translations/stems-07.json",
  "external-script-debt.json",
  "family-game-pairs-es.json",
  "family-glossary.json",
  "family-homework-ladder.json",
  "family-homework-practice-review.json",
  "family-homework-titles-es.json",
  "family-landing-units.json",
  "family-mission-content-baseline.json",
  "family-performance-budget.json",
  "fluency-resources.json",
  "font-bundles.json",
  "foundational-support-map.json",
  "homework-alignment-review.json",
  "homework-choices-spanish.json",
  "homework-confused-grownup-tags.json",
  "homework-external-resources.json",
  "homework-feedback-spanish.json",
  "homework-starters-spanish.json",
  "homework-table-spanish.json",
  "interactive-alignment-review.json",
  "learn-it-scope-review.json",
  "lesson-topic-vocabulary.json",
  "listen-for-alignment-review.json",
  "lumen-harbor-manifest.json",
  "math-notation-review.json",
  "microcopy-review.json",
  "part-two-feedback-additions.json",
  "part-two-practice-inserts.json",
  "part-two-session2-practice.json",
  "part-two-session2-source.json",
  "part-two-warmup-inserts.json",
  "part-two-worked-steps.json",
  "project-registry.json",
  "projects-baseline-inventory.json",
  "public-route-contract.json",
  "reveal-assets-retained.json",
  "reveal-classroom-alignment.json",
  "reveal-session1-source.json",
  "shared-component-claims-review.json",
  "spanish-review-queue.json",
  "static-app-mounts.json",
  "student-pdf-manifest.json",
  "sweep-floors.json",
  "teacher-destinations.json",
  "test-reads.json",
  "test-writes-review.json",
  "toc-migration.json",
  "vocab-attribute-debt.json",
]);

/**
 * Build a cpSync filter rooted at `root`.
 * @param {string} root absolute path the copy is relative to (the repo root)
 * @returns {(src: string) => boolean} true to copy
 */
export function makeCopyFilter(root) {
  return (src) => {
    const rel = relative(root, src);
    // A path outside the root cannot be made relative safely; copying it would
    // be a bug of a different kind, so refuse rather than guess.
    if (rel.startsWith(`..${sep}`) || rel === "..") return false;
    if (SKIP_COPY_RE.test(rel)) return false;
    const normalized = rel.split(sep).join("/");
    if (normalized.startsWith("data/audit/studio-audit/")) return false;
    if (normalized.startsWith("data/") && OMITTED_DATA_JSON.has(normalized.slice("data/".length))) {
      return false;
    }
    // The illustrated scenes have WebP originals. Runtime still has the
    // legacy PNG and procedural SVG recovery paths, so publishing duplicate
    // JPEG encodes is unnecessary.
    if (/^blood-on-the-river\/art\/botr\/ch\d{2}-scene-\d{2}\.jpg$/i.test(normalized)) return false;
    return true;
  };
}
