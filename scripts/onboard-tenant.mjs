/* One-command tenant onboarding — Phase 3 (Decisions 1, 3, 5).
 *
 *   node scripts/onboard-tenant.mjs <id> "<Display Name>"
 *
 * When the colleague conversation happens, this is the whole technical step:
 * it creates the tenant's own D1 database (wrangler, so Joel's normal auth),
 * adds the wrangler.toml binding block, writes the registry entry with a
 * freshly generated join code's hash, regenerates the compiled registry, and
 * prints the PLAIN join code exactly once — it is never written to disk.
 * Review the diff, commit, and ship; the tenant is live on promote.
 *
 * Refuses to run with an existing tenant id, an existing binding block, or a
 * dirty wrangler.toml/tenants.json (so the diff you review is only this).
 */
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , id, name] = process.argv;

const die = (msg) => {
  console.error(`onboard-tenant: ${msg}`);
  process.exit(1);
};

if (!id || !name) die('usage: node scripts/onboard-tenant.mjs <id> "<Display Name>"');
if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(id)) die(`id must be a url-safe slug, got: ${id}`);

const status = execFileSync(
  "git",
  ["status", "--porcelain", "wrangler.toml", "data/tenants.json"],
  {
    cwd: ROOT,
    encoding: "utf8",
  },
).trim();
if (status)
  die("wrangler.toml or data/tenants.json already has uncommitted changes — commit or stash first");

const regPath = join(ROOT, "data", "tenants.json");
const reg = JSON.parse(readFileSync(regPath, "utf8"));
if (reg.tenants.some((t) => t.id === id)) die(`tenant "${id}" already exists`);

const binding = `TENANT_DB_${id.toUpperCase().replace(/-/g, "_")}`;
const dbName = `tenant-${id}-progress`;
const tomlPath = join(ROOT, "wrangler.toml");
let toml = readFileSync(tomlPath, "utf8");
if (toml.includes(binding)) die(`wrangler.toml already has a ${binding} block`);

console.log(`Creating D1 database ${dbName} …`);
const out = execFileSync("npx", ["wrangler", "d1", "create", dbName], {
  cwd: ROOT,
  encoding: "utf8",
});
const dbId = (out.match(/database_id\s*=\s*"([0-9a-f-]{36})"/) || [])[1];
if (!dbId) die(`could not parse database_id from wrangler output:\n${out}`);

const code = `${id.toUpperCase().replace(/-/g, "").slice(0, 6)}-${randomBytes(8).toString("hex").toUpperCase()}`;
const hash = createHash("sha256").update(code).digest("hex");

reg.tenants.push({ id, name, status: "active", dbBinding: binding, joinCodeHash: hash });
writeFileSync(regPath, `${JSON.stringify(reg, null, 2)}\n`);

toml += `
# ${name} (tenant "${id}") — created by scripts/onboard-tenant.mjs. The tenant
# wrapper resolves this by name from the registry; it is the only binding the
# tenant's routes can see. See docs/tenancy-provisioning.md.
[[d1_databases]]
binding = "${binding}"
database_name = "${dbName}"
database_id = "${dbId}"
`;
writeFileSync(tomlPath, toml);

execFileSync("node", [join(ROOT, "scripts", "generate-tenant-registry.mjs")], {
  cwd: ROOT,
  stdio: "inherit",
});

console.log(`
Tenant "${id}" is staged. Next:
  1. Review:  git diff wrangler.toml data/tenants.json functions/_lib/tenant-registry.js
  2. Commit and ship as usual — the tenant goes live on promote.
  3. Hand the teacher their join code NOW (it is not saved anywhere):

       ${code}

  4. Health check after promote:
       curl https://eduwonderlab.com/t/${id}/api/progress/health   # expect "d1":true
`);
