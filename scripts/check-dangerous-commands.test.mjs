/* Pins scripts/check-dangerous-commands.sh — the PreToolUse guard's blocklist.
 *
 * A guard is only worth what it blocks AND what it lets through. Both halves are
 * pinned here because both have failed in this repo:
 *
 *   - `git branch -D` was blocked, but `git update-ref -d refs/heads/x` deletes
 *     the same branch and walked straight past the guard (2026-08-06). A deny
 *     list is a list of spellings, not of effects.
 *   - the first fix for that over-blocked `git branch -d`, the SAFE variant that
 *     refuses to drop unmerged commits, because the pattern used `grep -i`.
 *
 * So: every "must block" case names an effect, and every "must allow" case is a
 * command that shows up in ordinary work here.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./check-dangerous-commands.sh", import.meta.url));
const verdict = (command) =>
  spawnSync("bash", [SCRIPT, command], { encoding: "utf8" }).status === 0 ? "allow" : "block";

const MUST_BLOCK = [
  ["git update-ref -d refs/heads/foo", "deletes a ref outright"],
  ["cd ~/repo && git update-ref -d refs/heads/foo", "compound command still inspected"],
  ["git -C /tmp/wt update-ref -d refs/heads/foo", "-C targets another worktree"],
  ["git update-ref --stdin", "batch ref updates can delete"],
  ["git branch -D foo", "force branch delete"],
  ["git branch -Dr origin/foo", "clustered flags"],
  ["git branch --delete --force foo", "long-form force delete"],
  ["git push origin :foo", "colon refspec deletes a REMOTE branch"],
  ["git push --delete origin foo", "explicit remote delete"],
  ["git push origin -d foo", "short-form remote delete"],
  ["git reflog expire --expire=now --all", "destroys the recovery path"],
  ["git filter-branch --tree-filter x HEAD", "repo-wide history rewrite"],
  ["rm -rf .git", "destroys the repository"],
  ["rm -rf .git/refs/heads", "destroys every branch ref"],
  ["git push --force origin main", "force push"],
  ["git reset --hard HEAD~3", "discards working tree"],
  ["npx wrangler pages deploy dist", "bypasses the Git-integration deploy"],
];

const MUST_ALLOW = [
  "git branch --show-current",
  "git branch -a",
  "git branch -d merged-branch",
  "git branch --delete merged-branch",
  "git push origin main",
  "git push -u origin feat/x",
  "git push",
  "ALLOW_DEPLOY=1 npm run ship -- abc123",
  "git update-ref refs/heads/foo abc123",
  "git log --oneline -5",
  "npm run qa:loop",
  "rm -rf dist",
  "git reflog",
  "git worktree remove --force /tmp/x",
  "git commit -m 'fix: mention -D in the message'",
];

test("blocks every spelling of an irreversible operation", () => {
  for (const [command, why] of MUST_BLOCK) {
    assert.equal(verdict(command), "block", `should block (${why}): ${command}`);
  }
});

test("lets ordinary work through", () => {
  for (const command of MUST_ALLOW) {
    assert.equal(verdict(command), "allow", `should allow: ${command}`);
  }
});

test("-d and -D are told apart — the guard must not be case-insensitive", () => {
  assert.equal(verdict("git branch -D unmerged"), "block");
  assert.equal(verdict("git branch -d merged"), "allow");
});
