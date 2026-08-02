#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("workbench-live/src/board-room.js", "utf8");
const client = fs.readFileSync("curriculum/math-workbench/index.html", "utf8");
const docs = fs.readFileSync("workbench-live/README.md", "utf8");

assert.match(worker, /HOST_TOKEN_RE = \/\^\[a-f0-9\]\{64\}\$\//);
assert.match(worker, /storage\.transaction/);
assert.match(worker, /host capability required/);
assert.match(worker, /host capability rejected/);
assert.match(worker, /allowedOrigin\(request\.headers\.get\("Origin"\)\)/);
assert.match(worker, /storage\.delete\(\["latest", "play"\]\)/);
assert.match(worker, /storage\.delete\("host-token"\)/);

assert.match(client, /function genHostToken\(\)/);
assert.match(client, /new Uint8Array\(32\)/);
assert.match(client, /"&host=" \+ encodeURIComponent\(hostToken \|\| ""\)/);
assert.match(client, /removed when you stop sharing/);

assert.match(docs, /Capability-protected teacher controls/);
assert.doesNotMatch(docs, /no student name, work, or identity/i);

console.log("✓ Workbench Live host capability, origin, expiry, client, and privacy contracts");
