// Repo reads of the few NON-node commands whose inputs are a function of their argv.
//
// tools/lib/test-trace-preload.mjs traces a node child by loading itself into it,
// but it cannot see inside git, rg, unzip or sqlite3, so a test that spawns one
// used to be opaque — it ran on every change. Most such calls read a small,
// predictable set of repo files: `git ls-files tools scripts` depends only on
// what is under tools/ and scripts/, `unzip -p x.docx` only on x.docx. This
// module states that dependency for an exact, allow-listed shape of each
// command and returns `opaque` for anything else (an unknown flag, a pathspec it
// cannot reduce to a directory, a command that could read through a shell or a
// script). Over-approximating is fine — a directory dependency covers more than
// a listing — under-approximating is the one thing it must never do.
//
// Not modelled, deliberately: machine-local configuration outside the tree
// (~/.gitconfig, .git/info/exclude, the global gitignore, ~/.sqliterc). Those are
// not part of any change list; they are the environment, like the node binary.

import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";

const GLOB = /[*?[]/;
const opaque = (why) => ({ opaque: why });

/** Directory a git pathspec / rg path can match under: the literal prefix before any glob. */
function literalRoot(spec) {
  const g = spec.search(GLOB);
  if (g === -1) return { path: spec, exact: true };
  const cut = spec.slice(0, g).lastIndexOf("/");
  return { path: cut === -1 ? "." : spec.slice(0, cut), exact: false };
}

/** Split argv into flags (validated) and positionals. `withValue` flags consume the next arg. */
function parseArgs(args, noValue, withValue) {
  const flags = [];
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = String(args[i]);
    if (a === "--") {
      positional.push(...args.slice(i + 1).map(String));
      break;
    }
    if (!a.startsWith("-") || a === "-") {
      positional.push(a);
      continue;
    }
    const [key, inline] = a.split(/=(.*)/s);
    if (noValue.has(a)) flags.push([a]);
    else if (withValue.has(key)) {
      const value = inline ?? args[++i];
      if (value === undefined) return null;
      flags.push([key, String(value)]);
    } else return null;
  }
  return { flags, positional };
}

const insideRoot = (root, abs) => {
  const r = relative(root, abs);
  return !r.startsWith("..") && !isAbsolute(r);
};

/** Ignore files rg consults in every directory from `abs` up to the repo root. */
function ignoreFilesUpTo(root, abs) {
  const out = [];
  for (let d = abs; insideRoot(root, d); d = dirname(d)) {
    for (const f of [".gitignore", ".ignore", ".rgignore"]) out.push(`${d}${sep}${f}`);
    if (d === root) break;
  }
  return out;
}

const GIT_LS_FILES_FLAGS = new Set([
  "-z",
  "-c",
  "--cached",
  "-o",
  "--others",
  "--exclude-standard",
  "-s",
  "--stage",
  "--full-name",
  "--deduplicate",
]);

function gitReads(args, { root, cwd, env, gitDir }) {
  // A git hook exports GIT_DIR (and sometimes GIT_WORK_TREE) for THIS repository; anything else is another repo.
  if (env?.GIT_DIR && resolve(cwd, env.GIT_DIR) !== gitDir)
    return opaque("git with a foreign GIT_DIR");
  if (env?.GIT_WORK_TREE && resolve(cwd, env.GIT_WORK_TREE) !== root)
    return opaque("git with a foreign GIT_WORK_TREE");
  const [sub, ...rest] = args.map(String);
  // A repository outside this tree reads nothing of it unless an argument points back in.
  if (!insideRoot(root, cwd)) {
    if (sub?.startsWith("-")) return opaque(`git ${sub}`);
    if (rest.some((a) => (isAbsolute(a) ? insideRoot(root, a) : insideRoot(root, resolve(cwd, a)))))
      return opaque(`git ${sub} names a path in the repo`);
    return { files: [], dirs: [] };
  }
  if (sub === "show" && rest.length === 1 && /^:[^:(]/.test(rest[0]))
    return { files: [resolve(root, rest[0].slice(1))], dirs: [] }; // `:path` is the index copy
  if (sub !== "ls-files") return opaque(`git ${sub ?? ""}`.trim());
  const parsed = parseArgs(rest, GIT_LS_FILES_FLAGS, new Set());
  if (!parsed) return opaque("git ls-files with an unmodelled flag");
  if (parsed.positional.some((p) => p.startsWith(":"))) return opaque("git pathspec magic");
  const specs = parsed.positional.length ? parsed.positional : ["."];
  const files = [];
  const dirs = [];
  for (const spec of specs) {
    const { path, exact } = literalRoot(spec);
    const abs = resolve(cwd, path);
    if (exact) files.push(abs);
    dirs.push(abs);
  }
  return { files, dirs };
}

const RG_NO_VALUE = new Set(
  "-l -o -n -N -i -F -w -c -H -I -s -S -0 --no-heading --heading --with-filename --no-filename --files-with-matches --count --fixed-strings --ignore-case --smart-case --case-sensitive --word-regexp --only-matching --line-number --no-line-number --null --no-messages".split(
    " ",
  ),
);
const RG_WITH_VALUE = new Set(
  "-g --glob -e --regexp -t --type -T --type-not -m --max-count -A -B -C --context --after-context --before-context".split(
    " ",
  ),
);

function rgReads(args, { root, cwd }) {
  const parsed = parseArgs(args, RG_NO_VALUE, RG_WITH_VALUE);
  if (!parsed) return opaque("rg with an unmodelled flag");
  const hasE = parsed.flags.some(([k]) => k === "-e" || k === "--regexp");
  const paths = parsed.positional.slice(hasE ? 0 : 1);
  const targets = paths.length ? paths : ["."];
  const files = [];
  const dirs = [];
  for (const p of targets) {
    const abs = resolve(cwd, p);
    files.push(abs, ...ignoreFilesUpTo(root, dirname(abs)));
    dirs.push(abs);
  }
  return { files, dirs };
}

function unzipReads(args, { cwd }) {
  const parsed = parseArgs(
    args,
    new Set(["-p", "-q", "-qq", "-o", "-n", "-l", "-j"]),
    new Set(["-d"]),
  );
  if (!parsed?.positional.length) return opaque("unzip with an unmodelled shape");
  return { files: [resolve(cwd, parsed.positional[0])], dirs: [] }; // the rest are member names
}

const SQL_UNSAFE = /\b(attach|load_extension|readfile|edit)\b|^\s*\./im;
function sqliteReads(args, { cwd, sync, input, stdinIgnored }) {
  const parsed = parseArgs(
    args,
    new Set([
      "-json",
      "-csv",
      "-line",
      "-list",
      "-header",
      "-noheader",
      "-batch",
      "-bail",
      "-readonly",
      "-version",
    ]),
    new Set(),
  );
  if (!parsed) return opaque("sqlite3 with an unmodelled flag");
  // SQL can read other files (ATTACH, .read, readfile()). Stdin is only visible as the `input` of a sync call.
  if (!sync && !stdinIgnored) return opaque("sqlite3 with a stdin stream");
  const sql = [...parsed.positional.slice(1), typeof input === "string" ? input : ""];
  if (input !== undefined && typeof input !== "string") return opaque("sqlite3 with binary input");
  if (sql.some((s) => SQL_UNSAFE.test(s))) return opaque("sqlite3 SQL that can read another file");
  const db = parsed.positional[0];
  return { files: db ? [resolve(cwd, db)] : [], dirs: [] };
}

function npxReads(args, { root, cwd }) {
  // `npx biome format --stdin-file-path=X` formats stdin; X only selects the configuration.
  const [tool, sub, ...rest] = args.map(String);
  if (tool !== "biome" || sub !== "format" || rest.length !== 1) return opaque(`npx ${tool ?? ""}`);
  const m = /^--stdin-file-path=(.+)$/.exec(rest[0]);
  if (!m) return opaque("npx biome format without --stdin-file-path");
  const files = [resolve(root, ".editorconfig")];
  for (let d = dirname(resolve(cwd, m[1])); insideRoot(root, d); d = dirname(d)) {
    files.push(`${d}${sep}biome.json`, `${d}${sep}biome.jsonc`, `${d}${sep}.gitignore`);
    if (d === root) break;
  }
  return { files, dirs: [] };
}

/**
 * Repo paths (absolute) a non-node command reads, or { opaque: why }.
 * ctx: { root, cwd, env, gitDir, sync, input, stdinIgnored } — gitDir is this checkout's git directory.
 */
export function commandReads(cmd, args, ctx) {
  const name = basename(String(cmd));
  const list = Array.isArray(args) ? args : [];
  if (name === "git") return gitReads(list, ctx);
  if (name === "rg") return rgReads(list, ctx);
  if (name === "unzip") return unzipReads(list, ctx);
  if (name === "sqlite3") return sqliteReads(list, ctx);
  if (name === "npx") return npxReads(list, ctx);
  if (name === "bash" && list.length === 2 && list[0] === "-n")
    return { files: [resolve(ctx.cwd, String(list[1]))], dirs: [] }; // syntax check only
  return opaque(`spawns ${name}`);
}
