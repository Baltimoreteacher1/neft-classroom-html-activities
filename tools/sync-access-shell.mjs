#!/usr/bin/env node
/**
 * Keep access-practice-lab/app-shell byte-identical to access-practice-lab/index.html.
 *
 * The Pages Function functions/access-practice-lab/[[path]].js serves `app-shell`
 * (an extensionless file — ASSETS returns it 200 directly, while `/index.html`
 * 308-redirects to `/` and loops) for clean deep-link URLs like
 * /access-practice-lab/Speaking/B/<id>. If app-shell drifts from index.html,
 * deep links render a stale build (this caused the "Activity 2 of 6" + empty
 * panel bug while the hub was current). Runs as part of `npm run build`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "access-practice-lab");
const index = readFileSync(join(dir, "index.html"), "utf8");
const shellPath = join(dir, "app-shell");

let current = "";
try { current = readFileSync(shellPath, "utf8"); } catch {}

if (current === index) {
  console.log("sync-access-shell: app-shell already matches index.html.");
} else {
  writeFileSync(shellPath, index);
  console.log("sync-access-shell: app-shell updated to mirror index.html.");
}
