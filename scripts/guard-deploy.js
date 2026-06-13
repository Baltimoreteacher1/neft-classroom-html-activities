#!/usr/bin/env node

const approved = process.env.ALLOW_DEPLOY === "1";

if (!approved) {
  console.error("Production deploy blocked.");
  console.error("");
  console.error("This repo deploys to Cloudflare Pages production/main.");
  console.error("Run production deploys only after explicit approval in the current task.");
  console.error("");
  console.error("Allowed command:");
  console.error("  ALLOW_DEPLOY=1 npm run deploy");
  process.exit(1);
}

console.log("Production deploy approval detected: ALLOW_DEPLOY=1");
