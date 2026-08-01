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

export const SKIP_COPY_RE =
  /(^|[\\/])\.(claude|git|wrangler|ruff_cache)([\\/]|$)|(^|[\\/])(node_modules|_engine)([\\/]|$)|\.md$/i;

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
    return !SKIP_COPY_RE.test(rel);
  };
}
