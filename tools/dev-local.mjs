#!/usr/bin/env node
/**
 * dev-local: a production-shaped local environment in one command. Local only: it never contacts Cloudflare.
 *
 *   node tools/dev-local.mjs                run the site + API on http://127.0.0.1:8788 until Ctrl-C
 *   node tools/dev-local.mjs --probe        start, run the smoke probe, stop; exit 0 pass / 1 fail / 3 error
 *   node tools/dev-local.mjs --build        serve a full `npm run build` output (slow) instead of the light assets
 *   node tools/dev-local.mjs --port 8790 --dir <path> --ref <git-ref> --committed-only
 *   node tools/dev-local.mjs --clean        remove the preview worktree and its local state
 *
 * What it does, in order:
 *   1. Makes a DETACHED git worktree of this repo OUTSIDE your home folder (wrangler run under ~ picks up
 *      ~/wrangler.jsonc instead of the repo's config: see docs/runbooks/preview.md). Your uncommitted and
 *      untracked changes are copied over it, so you preview what is on disk. Re-runs reuse the worktree.
 *   2. Symlinks node_modules, and writes a LOCAL-ONLY wrangler.toml in the copy: one D1 binding with a
 *      made-up id, no KV/R2/AI/browser/service bindings, so no production id can be reached.
 *   3. Applies EVERY migrations/*.sql, in order, to a local persisted D1 (sqlite on disk). A bookkeeping table
 *      (_dev_local_migrations) makes re-runs apply only what is new.
 *   4. Seeds one demo class through the real API (/api/class/create + /join): aliases "Star 1".."Star N" from
 *      shared/fixtures only, a generated class code, no names and no student data.
 *   5. Runs `wrangler pages dev` (local mode), waits for /api/health and prints the URL and a throwaway
 *      teacher password for this run.
 *
 * Probe: health, units list + unit detail (tools/synthetic-check.mjs), telemetry accepted and refused,
 * review summary, the seeded class, and the Studio design specimen assets. Before probing it runs a negative
 * control: the same probe against a fake server that answers wrongly MUST fail, and against one that answers
 * correctly MUST pass; if either is not true the gate is broken and the exit is 3.
 */
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildClass, CLASS_SPECS } from "../shared/fixtures/classes.js";
import { runChecks } from "./synthetic-check.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WRANGLER = "wrangler@3.114.9";
const COMPAT_DATE = "2025-01-01";
const DB_NAME = "dev-local";
const DB_ID = "d1de0000-0000-4000-8000-000000000001";
const DEMO_CLASS_ID = "fx-6-balanced";
const STATIC_LIGHT = ["bcpss-teachers", "shared", "engine/styles", "access-practice-lab/ds.css"];
const CHUNK_BYTES = 60_000;
const ALIAS_RE = /^Star \d{1,2}$/;
const USAGE =
  "usage: node tools/dev-local.mjs [--probe] [--build] [--port N] [--dir PATH] [--ref REF] [--committed-only] [--clean]";

/* ---- arguments and safety ---- */

export function parseArgs(argv) {
  const opts = {
    probe: false,
    build: false,
    clean: false,
    overlay: true,
    port: 8788,
    dir: null,
    ref: "HEAD",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--probe") opts.probe = true;
    else if (a === "--build") opts.build = true;
    else if (a === "--clean") opts.clean = true;
    else if (a === "--committed-only") opts.overlay = false;
    else if (a === "--port") opts.port = Number(argv[++i]);
    else if (a === "--dir") opts.dir = argv[++i];
    else if (a === "--ref") opts.ref = argv[++i];
    else
      throw new Error(
        `unknown argument "${a}" (this tool is local only: there is no --remote or --base)\n${USAGE}`,
      );
  }
  if (!Number.isInteger(opts.port) || opts.port < 1024 || opts.port > 65535)
    throw new Error("--port must be 1024-65535");
  if (!opts.ref || opts.ref.startsWith("-")) throw new Error("--ref needs a git ref");
  if (opts.ref !== "HEAD") opts.overlay = false;
  return opts;
}

/** The copy must be outside the home folder and must not be this repo. Returns the absolute path. */
export function assertSafeDir(dir, { home = homedir(), root = ROOT } = {}) {
  const abs = resolve(dir);
  const real = existsSync(abs)
    ? realpathSync(abs)
    : join(realpathSync(dirname(abs)), basename(abs));
  const inside = (p, base) => p === base || p.startsWith(base + sep);
  if (inside(real, realpathSync(home)))
    throw new Error(
      `${abs} is under your home folder; wrangler would pick up ~/wrangler.jsonc. Use a path outside it.`,
    );
  if (inside(real, realpathSync(root)) || inside(realpathSync(root), real))
    throw new Error(`${abs} overlaps this repo`);
  if (!/dev-local/.test(basename(abs)))
    throw new Error(
      `${abs}: the directory name must contain "dev-local" so a typo cannot point this tool at real files`,
    );
  return abs;
}

const childEnv = () => {
  const env = { ...process.env, WRANGLER_SEND_METRICS: "false", NO_COLOR: "1" };
  for (const k of Object.keys(env)) if (/^(CLOUDFLARE_|CF_)/.test(k)) delete env[k];
  return env;
};
const git = (args, cwd, input) =>
  execFileSync("git", args, {
    cwd,
    input,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
function wrangler(args, cwd) {
  try {
    return execFileSync("npx", ["-y", WRANGLER, ...args], {
      cwd,
      env: childEnv(),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const tail = String(err.stderr || err.message)
      .split("\n")
      .filter((l) => l && !l.startsWith("npm notice"))
      .slice(-12)
      .join("\n");
    throw new Error(`wrangler ${args.slice(0, 3).join(" ")} failed:\n${tail}`);
  }
}

/* ---- worktree copy ---- */

function ensureWorktree(dir, ref) {
  const sha = git(["rev-parse", "--verify", `${ref}^{commit}`], ROOT).trim();
  if (existsSync(join(dir, ".git"))) {
    git(["checkout", "-q", "-f", "--detach", sha], dir);
    git(["clean", "-fdq"], dir);
  } else {
    if (existsSync(dir) && readdirSync(dir).length)
      throw new Error(`${dir} exists and is not a worktree`);
    git(["worktree", "add", "--detach", dir, sha], ROOT);
  }
  return sha;
}

function overlayWorkingTree(dir) {
  const patch = git(["diff", "HEAD", "--binary"], ROOT);
  if (patch) git(["apply", "--whitespace=nowarn", "-"], dir, patch);
  const untracked = git(["ls-files", "-z", "--others", "--exclude-standard"], ROOT)
    .split("\0")
    .filter(Boolean);
  for (const rel of untracked)
    cpSync(join(ROOT, rel), join(dir, rel), { recursive: true, verbatimSymlinks: true });
  return { patched: Boolean(patch), untracked: untracked.length };
}

function linkNodeModules(dir) {
  const dest = join(dir, "node_modules");
  try {
    lstatSync(dest);
  } catch {
    symlinkSync(realpathSync(join(ROOT, "node_modules")), dest);
  }
}

const devConfig = (
  staticDir,
) => `# Written by tools/dev-local.mjs. Local only: no production ids or bindings.
name = "dev-local"
pages_build_output_dir = "${staticDir}"
compatibility_date = "${COMPAT_DATE}"

[[d1_databases]]
binding = "DB"
database_name = "${DB_NAME}"
database_id = "${DB_ID}"
`;

function prepareStatic(dir, stateDir, build) {
  if (build) {
    execFileSync("npm", ["run", "build"], { cwd: dir, env: childEnv(), stdio: "inherit" });
    return join(dir, "dist");
  }
  const out = join(stateDir, "static");
  rmSync(out, { recursive: true, force: true });
  for (const rel of STATIC_LIGHT) cpSync(join(dir, rel), join(out, rel), { recursive: true });
  return out;
}

/* ---- local D1 ---- */

function d1(dir, persist, args) {
  return wrangler(["d1", "execute", DB_NAME, "--local", "--persist-to", persist, ...args], dir);
}

export function pendingMigrations(all, applied) {
  const done = new Set(applied);
  return [...all].sort().filter((f) => f.endsWith(".sql") && !done.has(f));
}

function applyMigrations(dir, stateDir) {
  const persist = join(stateDir, "d1");
  d1(dir, persist, [
    "--command",
    "CREATE TABLE IF NOT EXISTS _dev_local_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  ]);
  const rows = JSON.parse(
    d1(dir, persist, ["--command", "SELECT name FROM _dev_local_migrations", "--json"]),
  );
  const applied = (rows[0]?.results || []).map((r) => r.name);
  const pending = pendingMigrations(readdirSync(join(dir, "migrations")), applied);
  // `--command`, not `--file`: wrangler 3.114.9's --file path trips a Node FileHandle error on current Node.
  // Chunks stay far below the OS argument limit; each migration's bookkeeping row is in the same chunk.
  let chunk = "";
  const flush = () => {
    if (chunk) d1(dir, persist, [`--command=${chunk}`]);
    chunk = "";
  };
  for (const f of pending) {
    const sql = `${readFileSync(join(dir, "migrations", f), "utf8")}\n;\nINSERT INTO _dev_local_migrations (name) VALUES ('${f}');\n`;
    if (chunk && chunk.length + sql.length > CHUNK_BYTES) flush();
    chunk += sql;
  }
  flush();
  return { persist, applied: applied.length, pending: pending.length };
}

/* ---- server ---- */

function freePort(start) {
  return new Promise((resolvePort, reject) => {
    const tryPort = (p) => {
      if (p > start + 50) return reject(new Error(`no free port from ${start}`));
      const s = createNetServer();
      s.once("error", () => tryPort(p + 1));
      s.listen(p, "127.0.0.1", () => s.close(() => resolvePort(p)));
    };
    tryPort(start);
  });
}

function startServer({ dir, staticDir, persist, port, secrets, log }) {
  const args = [
    "-y",
    WRANGLER,
    "pages",
    "dev",
    staticDir,
    "--port",
    String(port),
    "--ip",
    "127.0.0.1",
    "--local",
    "--persist-to",
    persist,
    "--binding",
    `TEACHER_KEY=${secrets.teacherKey}`,
    `SITE_PASSWORD=${secrets.sitePassword}`,
    `--compatibility-date=${COMPAT_DATE}`,
  ];
  const fd = openSync(log, "w");
  const child = spawn("npx", args, {
    cwd: dir,
    env: childEnv(),
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  child.unref();
  return child;
}

const stopServer = (child) => {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
};

async function waitForHealth(base, child, ms = 180_000) {
  const deadline = Date.now() + ms;
  let exited = false;
  child.once("exit", () => {
    exited = true;
  });
  while (Date.now() < deadline && !exited) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 750));
  }
  throw new Error(
    exited
      ? "wrangler exited before /api/health answered (see server.log)"
      : `/api/health did not answer within ${ms / 1000}s`,
  );
}

/* ---- demo data ---- */

/** Aliases for the demo class, from the committed fixture. Only "Star N" aliases, at most 28. */
export function demoAliases() {
  const spec = CLASS_SPECS.find((c) => c.id === DEMO_CLASS_ID);
  const aliases = buildClass(spec).students.map((s) => s.name);
  if (aliases.length === 0 || aliases.length > 28 || !aliases.every((a) => ALIAS_RE.test(a))) {
    throw new Error("fixture aliases must be Star 1..Star N (N <= 28) and nothing else");
  }
  return aliases;
}

async function post(base, path, body, headers = {}) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function seedDemo(base, stateDir, teacherKey) {
  const file = join(stateDir, "demo.json");
  if (existsSync(file)) {
    const saved = JSON.parse(readFileSync(file, "utf8"));
    const res = await fetch(`${base}/api/class/info?code=${encodeURIComponent(saved.code)}`);
    if (res.ok) return { ...saved, reused: true };
  }
  const made = await post(
    base,
    "/api/class/create",
    { app: "language", title: "Demo class (local)" },
    { "x-teacher-key": teacherKey },
  );
  if (made.status !== 200 || !made.body?.code)
    throw new Error(`demo class create failed: HTTP ${made.status}`);
  const aliases = demoAliases();
  for (const alias of aliases) {
    const joined = await post(base, "/api/class/join", { code: made.body.code, alias });
    if (joined.status !== 200 || !joined.body?.ok)
      throw new Error(`demo join "${alias}" failed: HTTP ${joined.status}`);
  }
  const demo = {
    code: made.body.code,
    teacherPasscode: made.body.teacherPasscode,
    students: aliases.length,
  };
  writeFileSync(file, JSON.stringify(demo, null, 2));
  return { ...demo, reused: false };
}

/* ---- probe ---- */

const basic = (password) => `Basic ${Buffer.from(`teacher:${password}`).toString("base64")}`;

/**
 * Probe a running server. Returns [{ name, ok, detail }]. `unitId` and `demoCode` come from the setup step;
 * `sitePassword` opens the teacher-gated Studio assets.
 */
export async function runProbe(base, { demoCode, sitePassword, timeoutMs = 20_000 } = {}) {
  const results = (await runChecks(base, { timeoutMs })).map((r) => ({
    name: r.name,
    ok: r.ok,
    detail: r.detail,
  }));
  const record = async (name, fn) => {
    try {
      const problem = await fn();
      results.push({ name, ok: !problem, detail: problem || "ok" });
    } catch (err) {
      results.push({ name, ok: false, detail: `request failed (${err?.name || "Error"})` });
    }
  };
  const get = (path, headers) =>
    fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(timeoutMs) });
  const unitsRes = await get("/api/bcpss/units?grade=6&subject=Math")
    .then((r) => r.json())
    .catch(() => null);
  const unitId = unitsRes?.units?.[0]?.id;

  await record("telemetry valid", async () => {
    if (!unitId) return "no unit id to send";
    const r = await post(base, "/api/bcpss/telemetry", {
      unit_id: unitId,
      wida_tier: "1_2",
      event_type: "scaffold_toggle",
    });
    return r.status === 202 && r.body?.ok === true ? "" : `expected 202 ok, got ${r.status}`;
  });
  await record("telemetry invalid", async () => {
    const r = await post(base, "/api/bcpss/telemetry", {
      unit_id: unitId || "x",
      wida_tier: "9_9",
      event_type: "scaffold_toggle",
    });
    const extra = await post(base, "/api/bcpss/telemetry", {
      unit_id: unitId || "x",
      wida_tier: "1_2",
      event_type: "scaffold_toggle",
      name: "x",
    });
    return r.status === 400 && extra.status === 400
      ? ""
      : `expected 400 and 400, got ${r.status} and ${extra.status}`;
  });
  await record("review summary", async () => {
    const r = await get("/api/review/summary");
    const body = await r.json().catch(() => null);
    return r.status === 200 && body && typeof body === "object"
      ? ""
      : `expected 200 JSON object, got ${r.status}`;
  });
  await record("demo class", async () => {
    const r = await get(`/api/class/info?code=${encodeURIComponent(demoCode || "")}`);
    const body = await r.json().catch(() => null);
    return r.status === 200 && body?.students === 28
      ? ""
      : `expected the seeded class with 28 aliases, got ${r.status} students=${body?.students}`;
  });
  const gated = { authorization: basic(sitePassword || "") };
  for (const [name, path, needle] of [
    ["studio page", "/bcpss-teachers/studio/", "Teacher Studio"],
    ["design specimen", "/bcpss-teachers/studio/design/specimen.js", "Design system"],
    ["ui styles", "/shared/ui/ui.css", ".ui-btn"],
    ["design tokens", "/engine/styles/ds-tokens.generated.css", "--ds-primary"],
  ]) {
    await record(name, async () => {
      const r = await get(path, gated);
      const text = await r.text();
      return r.status === 200 && text.includes(needle)
        ? ""
        : `expected 200 containing "${needle}", got ${r.status}`;
    });
  }
  return results;
}

/** Negative control: a wrong server MUST fail the probe, a right one MUST pass it. Exit 3 if either is false. */
export async function probeSelfTest() {
  const json = (res, status, body, extra = {}) => {
    res.writeHead(status, {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...extra,
    });
    res.end(JSON.stringify(body));
  };
  const good = (req, res) => {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    if (p === "/api/health")
      return json(res, 200, { ok: true, build: { commit: "abc" }, d1: "ok" });
    if (p === "/api/bcpss/units") return json(res, 200, { units: [{ id: "u1" }] });
    if (p === "/api/bcpss/units/u1") return json(res, 200, { unit: { id: "u1" } });
    if (p === "/api/bcpss/telemetry") {
      let raw = "";
      req.on("data", (c) => {
        raw += c;
      });
      return req.on("end", () => {
        const b = JSON.parse(raw);
        const bad = b.wida_tier === "9_9" || "name" in b;
        json(res, bad ? 400 : 202, { ok: !bad });
      });
    }
    if (p === "/api/review/summary") return json(res, 200, { states: {} });
    if (p === "/api/class/info") return json(res, 200, { students: 28 });
    const text = {
      "/bcpss-teachers/studio/": "Teacher Studio",
      "/bcpss-teachers/studio/design/specimen.js": "Design system",
      "/shared/ui/ui.css": ".ui-btn",
      "/engine/styles/ds-tokens.generated.css": "--ds-primary",
    }[p];
    if (text) {
      res.writeHead(req.headers.authorization ? 200 : 401);
      return res.end(text);
    }
    res.writeHead(404).end();
  };
  const bad = (_req, res) => json(res, 500, { ok: false });
  const run = async (handler) => {
    const server = createServer(handler);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    try {
      return await runProbe(`http://127.0.0.1:${server.address().port}`, {
        demoCode: "ABC234",
        sitePassword: "x",
        timeoutMs: 2000,
      });
    } finally {
      server.close();
    }
  };
  const goodResults = await run(good);
  const badResults = await run(bad);
  const goodFails = goodResults.filter((r) => !r.ok);
  const badPasses = badResults.filter((r) => r.ok);
  if (goodFails.length || badPasses.length || goodResults.length < 10) {
    throw new Error(
      `probe self-test: known-good failed [${goodFails.map((r) => r.name)}], known-bad passed [${badPasses.map((r) => r.name)}], ${goodResults.length} checks`,
    );
  }
  return goodResults.length;
}

/* ---- main ---- */

const say = (m) => console.log(`dev-local: ${m}`);

async function main(argv) {
  const opts = parseArgs(argv);
  const dir = assertSafeDir(opts.dir || join(tmpdir(), "eduwonderlab-dev-local"));
  const stateDir = join(dirname(dir), `${basename(dir)}-state`);

  if (opts.clean) {
    if (existsSync(join(dir, ".git"))) git(["worktree", "remove", "--force", dir], ROOT);
    rmSync(stateDir, { recursive: true, force: true });
    git(["worktree", "prune"], ROOT);
    say(`removed ${dir} and ${stateDir}`);
    return 0;
  }
  if (opts.probe)
    say(`probe self-test: ${await probeSelfTest()} checks, known-bad fails and known-good passes`);

  mkdirSync(stateDir, { recursive: true });
  const sha = ensureWorktree(dir, opts.ref);
  const overlay = opts.overlay ? overlayWorkingTree(dir) : { patched: false, untracked: 0 };
  linkNodeModules(dir);
  say(
    `worktree ${dir} @ ${sha.slice(0, 10)}${overlay.patched || overlay.untracked ? ` + working changes (${overlay.untracked} untracked)` : ""}`,
  );

  const staticDir = prepareStatic(dir, stateDir, opts.build);
  writeFileSync(join(dir, "wrangler.toml"), devConfig(staticDir));
  const { persist, applied, pending } = applyMigrations(dir, stateDir);
  say(`local D1 at ${persist}: ${pending} migration(s) applied now, ${applied} already present`);

  const port = await freePort(opts.port);
  const secrets = {
    teacherKey: randomBytes(12).toString("hex"),
    sitePassword: randomBytes(9).toString("hex"),
  };
  const log = join(stateDir, "server.log");
  const server = startServer({ dir, staticDir, persist, port, secrets, log });
  const base = `http://127.0.0.1:${port}`;
  const stop = () => stopServer(server);
  process.once("SIGINT", () => {
    stop();
    process.exit(0);
  });
  try {
    await waitForHealth(base, server);
    const demo = await seedDemo(base, stateDir, secrets.teacherKey);
    say(
      `demo class ${demo.code} (${demo.students} aliases Star 1..${demo.students}, ${demo.reused ? "reused" : "created"})`,
    );
    if (opts.probe) {
      const results = await runProbe(base, {
        demoCode: demo.code,
        sitePassword: secrets.sitePassword,
      });
      for (const r of results)
        console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(18)} ${r.detail}`);
      const failed = results.filter((r) => !r.ok).length;
      console.log(
        failed
          ? `\n${failed} of ${results.length} probe checks failed`
          : `\nall ${results.length} probe checks passed`,
      );
      stop();
      return failed ? 1 : 0;
    }
    say(`ready: ${base}/bcpss-teachers/studio/#/design`);
    say(
      `teacher pages ask for a login: any user name, password ${secrets.sitePassword} (new each run)`,
    );
    say(`server log: ${log}. Ctrl-C to stop.`);
    await new Promise(() => {});
  } catch (err) {
    stop();
    throw err;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`dev-local: ${err.message}`);
      process.exit(3);
    },
  );
}
