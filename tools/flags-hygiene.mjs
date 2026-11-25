#!/usr/bin/env node
/**
 * G-39 flag hygiene gate. Fails when a flag in shared/flags/registry.js has no owner, default,
 * description or removal date; is past its removal date; has a malformed environments/cohorts
 * block; has a requires graph that dangles or cycles; or breaks the egress rules (the egress
 * master defaults OFF; every flag that sends student content requires it, directly or not).
 *
 *   node tools/flags-hygiene.mjs [--now=YYYY-MM-DD] [--registry=path]
 *
 * Negative control: shared/flags/negative/bad-registry.json is a known-bad registry that MUST
 * raise every code in EXPECTED_BAD. If it does not, the gate itself is broken: exit 3.
 * Exit codes: 0 pass, 1 findings, 3 error (CI treats 3 as failure).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EGRESS_FLAG, ENVIRONMENTS } from "../shared/flags/evaluate.js";

const KEY = /^[a-z][a-z0-9_]*$/;
const EMAIL = /\S+@\S+\.\S+/;
const COHORT_KINDS = ["teacher", "class", "demo"];
export const EXPECTED_BAD = [
  "DUPLICATE_KEY",
  "MISSING_FIELD",
  "BAD_DATE",
  "EXPIRED",
  "OWNER_EMAIL",
  "BAD_ENVIRONMENTS",
  "UNKNOWN_REQUIRE",
  "REQUIRE_CYCLE",
  "EGRESS_DEFAULT_ON",
  "EGRESS_NOT_REQUIRED",
];

/** Strict YYYY-MM-DD that round-trips (rejects 2027-13-45). */
function parseDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const ms = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().startsWith(text) ? ms : null;
}

const isText = (v) => typeof v === "string" && v.trim().length > 0;

function checkFlag(flag, today, add) {
  const at = flag.key;
  for (const field of ["owner", "description"]) {
    if (!isText(flag[field])) add("MISSING_FIELD", at, `${field} is required`);
  }
  if (typeof flag.default !== "boolean") add("MISSING_FIELD", at, "default must be true or false");
  if (typeof flag.killSwitch !== "boolean") add("MISSING_FIELD", at, "killSwitch must be boolean");
  if (isText(flag.owner) && EMAIL.test(flag.owner)) {
    add("OWNER_EMAIL", at, "owner must be a team handle, not an email");
  }
  if (flag.removalDate === undefined) add("MISSING_FIELD", at, "removalDate is required");
  else if (parseDate(flag.removalDate) === null)
    add("BAD_DATE", at, `removalDate "${flag.removalDate}"`);
  else if (parseDate(flag.removalDate) < today) {
    add("EXPIRED", at, `removalDate ${flag.removalDate} has passed: remove the flag or re-date it`);
  }
  const envs = flag.environments;
  const envOk =
    envs &&
    typeof envs === "object" &&
    ENVIRONMENTS.every((e) => envs[e] === null || typeof envs[e] === "boolean") &&
    ENVIRONMENTS.every((e) => Object.hasOwn(envs, e)) &&
    Object.keys(envs).every((e) => ENVIRONMENTS.includes(e));
  if (!envOk)
    add(
      "BAD_ENVIRONMENTS",
      at,
      `environments needs exactly ${ENVIRONMENTS.join(", ")} (true|false|null)`,
    );
  const co = flag.cohorts;
  const coOk =
    co &&
    typeof co === "object" &&
    COHORT_KINDS.every((k) => Array.isArray(co[k]) && co[k].every(isText)) &&
    Object.keys(co).every((k) => COHORT_KINDS.includes(k));
  if (!coOk) add("BAD_COHORTS", at, `cohorts needs exactly ${COHORT_KINDS.join(", ")} as id lists`);
  if (!Array.isArray(flag.requires)) add("MISSING_FIELD", at, "requires must be an array");
}

function checkGraph(flags, byKey, add) {
  for (const flag of flags) {
    for (const req of flag.requires ?? []) {
      if (!byKey.has(req)) add("UNKNOWN_REQUIRE", flag.key, `requires unknown flag "${req}"`);
    }
  }
  const state = new Map();
  const visit = (key, trail) => {
    if (state.get(key) === 2 || !byKey.has(key)) return;
    if (state.get(key) === 1) {
      add("REQUIRE_CYCLE", key, `cycle: ${[...trail, key].join(" -> ")}`);
      return;
    }
    state.set(key, 1);
    for (const req of byKey.get(key).requires ?? []) visit(req, [...trail, key]);
    state.set(key, 2);
  };
  for (const flag of flags) visit(flag.key, []);
}

function reaches(byKey, from, target, seen = new Set()) {
  if (seen.has(from) || !byKey.has(from)) return false;
  seen.add(from);
  return (byKey.get(from).requires ?? []).some(
    (r) => r === target || reaches(byKey, r, target, seen),
  );
}

/** @returns {{code: string, flag: string|null, message: string}[]} */
export function checkRegistry(registry, { now = new Date() } = {}) {
  const findings = [];
  const add = (code, flag, message) => findings.push({ code, flag, message });
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const flags = Array.isArray(registry?.flags) ? registry.flags : null;
  if (!flags || flags.length === 0) {
    add("EMPTY_REGISTRY", null, "registry has no flags (a sweep of zero flags verifies nothing)");
    return findings;
  }
  const byKey = new Map();
  for (const flag of flags) {
    if (!isText(flag.key) || !KEY.test(flag.key)) {
      add("BAD_KEY", String(flag.key), "key must match /^[a-z][a-z0-9_]*$/");
      continue;
    }
    if (byKey.has(flag.key)) add("DUPLICATE_KEY", flag.key, "key appears more than once");
    else byKey.set(flag.key, flag);
    checkFlag(flag, today, add);
  }
  checkGraph(flags, byKey, add);
  const egress = byKey.get(EGRESS_FLAG);
  if (!egress) add("EGRESS_MISSING", EGRESS_FLAG, "the egress master flag must exist");
  else if (egress.default !== false)
    add("EGRESS_DEFAULT_ON", EGRESS_FLAG, "egress must default to false");
  for (const flag of flags) {
    if (flag.sendsStudentContent === true && egress && !reaches(byKey, flag.key, EGRESS_FLAG)) {
      add(
        "EGRESS_NOT_REQUIRED",
        flag.key,
        `sends student content but does not require ${EGRESS_FLAG}`,
      );
    }
  }
  return findings;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function main() {
  const args = process.argv.slice(2);
  const nowArg = args.find((a) => a.startsWith("--now="))?.slice(6);
  const now = nowArg ? new Date(`${nowArg}T00:00:00Z`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`bad --now value "${nowArg}"`);
  const registryArg = args.find((a) => a.startsWith("--registry="))?.slice(11);
  const badPath = fileURLToPath(
    new URL("../shared/flags/negative/bad-registry.json", import.meta.url),
  );

  // Negative control first: the known-bad registry must trip every expected code.
  const caught = new Set(
    checkRegistry(readJson(badPath), { now: new Date("2026-11-25T00:00:00Z") }).map((f) => f.code),
  );
  const silent = EXPECTED_BAD.filter((code) => !caught.has(code));
  if (silent.length) {
    console.error(
      `flags-hygiene: negative control did not raise ${silent.join(", ")}; the gate is broken`,
    );
    process.exit(3);
  }

  // Default: the real registry module. --registry=<path.json> checks any other JSON registry (the negative control).
  const registry = registryArg
    ? readJson(registryArg)
    : (await import("../shared/flags/registry.js")).default;
  const findings = checkRegistry(registry, { now });
  if (findings.length) {
    for (const f of findings) console.error(`FAIL ${f.code} ${f.flag ?? ""}: ${f.message}`);
    console.error(`flags-hygiene: ${findings.length} finding(s)`);
    process.exit(1);
  }
  console.log(
    `flags-hygiene: ${registry.flags.length} flags clean (negative control raised ${caught.size} codes)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (err) {
    console.error(`flags-hygiene error: ${err.message}`);
    process.exit(3);
  }
}
