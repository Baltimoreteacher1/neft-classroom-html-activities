#!/usr/bin/env node

// HARD REFUSAL — manual wrangler deploy to the classroom Pages production is
// disabled on purpose.
//
// This project (neft-classroom-html-activities → eduwonderlab.com) publishes
// via Cloudflare Pages GIT INTEGRATION: a push to `main` builds and promotes to
// production automatically. A manual `wrangler pages deploy ... --branch=main`
// direct-upload competes with that Git deployment and PINS production to the
// uploaded dist, so subsequent Git builds stop being promoted. That is exactly
// what froze production at commit e1493e4c for 16 days (2026-06-18 → 07-04) and
// silently dropped the Math Workbench calculator + ~625 commits of work.
//
// There is no legitimate manual deploy for this project. To publish: commit and
// push to `main`. (The Noam PWA is a SEPARATE project and deploys via
// `npm run deploy:noam`, which is unaffected by this guard.)

console.error("✗ Manual production deploy is DISABLED for this project.");
console.error("");
console.error("  eduwonderlab.com deploys via Cloudflare Pages Git integration.");
console.error("  Publish by pushing to main — that is the ONLY supported path:");
console.error("");
console.error("      git push origin main      # CF auto-builds + promotes (~1-2 min)");
console.error("");
console.error("  A manual `wrangler pages deploy --branch=main` direct-upload fights");
console.error("  the Git integration and freezes production on a stale build (the");
console.error("  2026-06-18 → 07-04 incident). Do not re-enable it.");
console.error("");
console.error("  (Noam PWA deploys separately via `npm run deploy:noam` — not this guard.)");
process.exit(1);
