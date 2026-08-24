#!/usr/bin/env node
/**
 * The .claude/ operating layer must describe THIS repo, not a remembered one.
 *
 * Why this test exists: scripts/discard-generated.sh documented
 * `npm run discard:generated` in its own usage header, a test told you to run
 * it, and a memory file called it "the safe cleanup" — but that npm script had
 * never existed in package.json. Anyone who followed the documented path got
 * "Missing script". Instructions rot silently because nothing executes them.
 *
 * So: every npm script and every repo path named by a skill or slash command
 * must resolve, and every skill must carry the frontmatter that makes it
 * discoverable. A skill Claude cannot find is a file nobody reads.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scripts = new Set(
  Object.keys(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts),
);

const skillDir = join(ROOT, ".claude/skills");
const cmdDir = join(ROOT, ".claude/commands");
const skills = existsSync(skillDir)
  ? readdirSync(skillDir).filter((d) => existsSync(join(skillDir, d, "SKILL.md")))
  : [];
const commands = existsSync(cmdDir) ? readdirSync(cmdDir).filter((f) => f.endsWith(".md")) : [];

/* Longest-first, or `.json` truncates to `.js`; anchored, or `teacher-tools/`
   matches starting at `tools/`. Both of those produced false failures. */
const PATH_RE =
  /(?:^|[\s`(])((?:teacher-tools|scripts|tools|engine|data|lessons|test|public|curriculum)\/[A-Za-z0-9_./*-]+\.(?:json|mjs|sh|js|html|css))/gm;
const NPM_RE = /npm run ([a-z0-9:_-]+)/g;

let checked = 0;
const problems = [];

for (const file of [
  ...skills.map((s) => join(skillDir, s, "SKILL.md")),
  ...commands.map((c) => join(cmdDir, c)),
]) {
  const text = readFileSync(file, "utf8");
  const rel = file.slice(ROOT.length + 1);

  for (const [, name] of text.matchAll(NPM_RE)) {
    checked++;
    if (!scripts.has(name)) problems.push(`${rel}: npm run ${name} — no such script`);
  }
  for (const [, p] of text.matchAll(PATH_RE)) {
    if (p.includes("*") || p.includes("<")) continue;
    checked++;
    if (!existsSync(join(ROOT, p))) problems.push(`${rel}: ${p} — no such path`);
  }
}

/* Frontmatter is what makes a skill reachable: no description, no invocation. */
for (const s of skills) {
  const text = readFileSync(join(skillDir, s, "SKILL.md"), "utf8");
  const fm = /^---\nname: (\S+)\ndescription: ([^\n]+)\n---\n/.exec(text);
  if (!fm) {
    problems.push(
      `.claude/skills/${s}/SKILL.md: missing or malformed frontmatter (need name + description)`,
    );
    continue;
  }
  if (fm[1] !== s) problems.push(`.claude/skills/${s}: frontmatter name is "${fm[1]}"`);
  if (fm[2].length < 80)
    problems.push(
      `.claude/skills/${s}: description is ${fm[2].length} chars — too vague to trigger on`,
    );
}

assert.equal(
  problems.length,
  0,
  `the .claude/ operating layer references things this repo does not have:\n  ${problems.join("\n  ")}`,
);
assert.ok(skills.length >= 1, "expected at least one skill under .claude/skills");

console.log(
  `claude-operating-layer: ${skills.length} skills + ${commands.length} commands, ${checked} references all resolve.`,
);
