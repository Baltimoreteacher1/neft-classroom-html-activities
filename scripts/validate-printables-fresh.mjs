#!/usr/bin/env node
/** Check every printable against its config without copying the lesson tree.
 * The generator's --check path uses the same renderGenerated comparison as its
 * write path, including preserved injection blocks, and never writes files.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const generator = join(root, "scripts", "generate-printable-lesson.mjs");
if (!existsSync(generator)) {
  console.error("validate-printables: generator not found");
  process.exit(2);
}

try {
  const result = execFileSync(process.execPath, [generator, "--check"], {
    cwd: root,
    env: { ...process.env, REPO: root },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const count = result.match(/✓ (\d+) printable\.html file\(s\) fresh/);
  if (!count || Number(count[1]) === 0) throw new Error("generator checked no printables");
  console.log(`validate-printables: PASS — ${count[1]} printables match their sources.`);
} catch (error) {
  console.error("validate-printables: printable generation check failed");
  console.error(String(error.stderr || error.message || error).slice(0, 1200));
  process.exit(1);
}
