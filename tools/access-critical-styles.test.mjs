// The lab ships two stylesheets (tools/bundle-access-styles.mjs): CRITICAL, the sheets the home view paints with,
// and FULL, every sheet in source order. This pins the bundler's contract on a tiny fixture dist, and the
// critical list against the real shell. The visual proof (home and 29 routes pixel-identical) is
// tools/access-critical-styles-e2e.mjs, which needs a server.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const bundler = join(repo, "tools/bundle-access-styles.mjs");
const lab = "/access-practice-lab";

test("critical-styles.json names real, unique, linked lab sheets", () => {
  const list = JSON.parse(
    readFileSync(join(repo, "access-practice-lab/critical-styles.json"), "utf8"),
  );
  assert.ok(Array.isArray(list) && list.length > 0);
  assert.equal(new Set(list).size, list.length, "duplicate critical sheet");
  const index = readFileSync(join(repo, "access-practice-lab/index.html"), "utf8");
  for (const href of list) {
    assert.match(href, /^\/access-practice-lab\/[\w.-]+\.css$/);
    assert.ok(index.includes(`href="${href}?v=`), `${href} is not linked by the shell`);
  }
});

function fixture(criticalList) {
  const root = mkdtempSync(join(tmpdir(), "critical-styles-"));
  const dist = join(root, "dist/access-practice-lab");
  mkdirSync(dist, { recursive: true });
  mkdirSync(join(root, "access-practice-lab"), { recursive: true });
  const face = '@font-face{font-family:"F";src:url(/assets/fonts/f.woff2) format("woff2")}';
  const sheets = {
    "a.css": `${face}\n.a{color:red}`,
    "b.css":
      '@font-face{font-family:"H";src:url(/assets/fonts/h.woff2) format("woff2")}\n.b{color:blue}',
    "c.css": `${face}\n@font-face{font-family:"G";src:url(/assets/fonts/g.woff2) format("woff2")}\n.c{color:green}`,
  };
  const links = Object.keys(sheets).map(
    (n) => `<link rel="stylesheet" href="${lab}/${n}?v=000000000000" />`,
  );
  const html = `<html><head>\n${links.join("\n")}\n<link rel="stylesheet" href="/assets/mobile-access.css" />\n</head></html>`;
  for (const [name, css] of Object.entries(sheets)) writeFileSync(join(dist, name), css);
  writeFileSync(join(dist, "index.html"), html);
  writeFileSync(join(dist, "app-shell"), html);
  writeFileSync(join(dist, "sw.js"), "const PRECACHE_CORE = [\n  '/x',\n];\n");
  writeFileSync(
    join(root, "access-practice-lab/critical-styles.json"),
    JSON.stringify(criticalList),
  );
  return { root, dist, face };
}
const run = (root) =>
  execFileSync("node", [bundler], { cwd: root, encoding: "utf8", stdio: "pipe" });

test("bundler writes a critical bundle (listed sheets, source order) and a full bundle (all sheets)", () => {
  const { root, dist, face } = fixture([`${lab}/c.css`, `${lab}/a.css`]);
  try {
    run(root);
    const files = readdirSync(dist);
    const critical = readFileSync(
      join(
        dist,
        files.find((f) => f.startsWith("lab.critical.")),
      ),
      "utf8",
    );
    const full = readFileSync(
      join(
        dist,
        files.find((f) => f.startsWith("lab.styles.")),
      ),
      "utf8",
    );
    assert.ok(
      critical.indexOf(".a{") < critical.indexOf(".c{"),
      "critical keeps source order, not list order",
    );
    assert.ok(!critical.includes(".b{"), "an unlisted sheet leaked into critical");
    assert.ok(
      full.indexOf(".a{") < full.indexOf(".b{") && full.indexOf(".b{") < full.indexOf(".c{"),
    );
    assert.equal(
      critical.split(face).length - 1,
      2,
      "critical is its sheets verbatim, duplicates included",
    );
    assert.ok(!full.includes(face), "full must not repeat an @font-face critical already declares");
    assert.ok(
      full.includes('font-family:"H"'),
      "a face only a non-critical sheet declares stays in full",
    );
    assert.ok(!critical.includes('font-family:"H"'));
    assert.ok(critical.includes('font-family:"G"'), "critical keeps its own faces");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the shell blocks on critical, loads full in its old place, and precaches both", () => {
  const { root, dist } = fixture([`${lab}/a.css`]);
  try {
    run(root);
    const html = readFileSync(join(dist, "index.html"), "utf8");
    assert.equal(html, readFileSync(join(dist, "app-shell"), "utf8"));
    const markup = html.replace(/<script>[\s\S]*?<\/script>/, "");
    assert.equal(
      (markup.match(/<link rel="stylesheet"/g) ?? []).length,
      2,
      "critical link + mobile-access only",
    );
    assert.match(
      html,
      /<link rel="stylesheet" href="\/access-practice-lab\/lab\.critical\.[0-9a-f]{12}\.css\?v=[0-9a-f]{12}" \/>\s*<script>/,
    );
    assert.ok(
      html.indexOf("lab.critical.") < html.indexOf("mobile-access.css"),
      "critical stays before mobile-access.css",
    );
    const loader = html.match(/<script>(\(function\(\)\{var f=[\s\S]*?)<\/script>/)[1];
    assert.match(loader, /document\.write\(/, "non-home URLs must block on full");
    assert.match(
      loader,
      /location\.search\|\|location\.hash/,
      "a query or hash may route to a view critical does not cover",
    );
    assert.match(
      loader,
      /insertBefore\(l,s\)/,
      "full must take the old bundle's place, ahead of mobile-access.css",
    );
    const worker = readFileSync(join(dist, "sw.js"), "utf8");
    assert.match(worker, /lab\.critical\.[0-9a-f]{12}\.css/);
    assert.match(worker, /lab\.styles\.[0-9a-f]{12}\.css/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("bundler refuses a critical list that names a sheet the shell does not link", () => {
  const { root } = fixture([`${lab}/nope.css`]);
  try {
    assert.throws(() => run(root), /critical-styles\.json names a sheet the shell does not link/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
