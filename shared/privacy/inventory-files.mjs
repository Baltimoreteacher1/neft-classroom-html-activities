// File discovery shared by the privacy tools. In a git checkout it asks git for tracked and
// not-yet-ignored files (so a file you just created is checked before you commit it, and ignored
// build output never is); in any other directory (the negative-control fixtures) it walks the tree. Always returns repo-relative, forward-slash paths in sorted order.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SKIP = new Set(["node_modules", "dist", ".git", ".qa-logs"]);

function walk(root, rel, out) {
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const next = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(root, next, out);
    else out.push(next);
  }
}

export function listFiles(root, prefixes) {
  if (existsSync(join(root, ".git"))) {
    const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...prefixes], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1 << 28,
    });
    return out.split("\0").filter(Boolean).sort();
  }
  const files = [];
  for (const prefix of prefixes) {
    if (!existsSync(join(root, prefix))) continue;
    walk(root, prefix === "." ? "" : prefix, files);
  }
  return files.sort();
}
