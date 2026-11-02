// Local-data integrity (Enterprise 8). Learner data lives only in this browser and in files the family or teacher
// chooses to save. These helpers let a person see whether that data is healthy WITHOUT sending it anywhere:
//   - fingerprint(): a stable checksum of a record, written into backups so a cut-off or edited copy is noticed;
//   - auditE8(): what a record would lose if it were cleaned (so an import can say exactly what it dropped);
//   - checkRoundTrip(): cleaning a clean record must change nothing (idempotence), the property that makes
//     export -> import -> export lossless;
//   - storageReport(): which keys exist, how large, and which fail to parse. Storage is injected for testing.
import { sanitizeE8 } from "./e8-store.js";

// Stable JSON: object keys sorted, so the same data always gives the same text.
export function stableStringify(value) {
  if (value === null || typeof value !== "object")
    return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(",")}}`;
}

// Two 32-bit FNV-1a hashes with different seeds, joined: enough to catch accidents and edits (it is not a security
// signature, and the lab never claims it is).
export function fingerprint(value) {
  const text = stableStringify(value);
  let a = 0x811c9dc5;
  let b = 0x9747b28c;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b ^ c, 2246822519) ^ (b >>> 13);
  }
  return `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`;
}

// Compare a raw record with its cleaned form and name what changed. Counts only; no learner content is echoed.
export function auditE8(raw) {
  const clean = sanitizeE8(raw);
  const problems = [];
  if (raw === null || raw === undefined)
    return { ok: true, empty: true, problems, clean };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      empty: false,
      problems: [{ code: "not-an-object" }],
      clean,
    };
  }
  if (raw.version !== undefined && raw.version !== clean.version)
    problems.push({
      code: "version",
      found: raw.version,
      expected: clean.version,
    });
  const dropped = (name, before, after) => {
    if (before > after)
      problems.push({ code: "dropped", field: name, count: before - after });
  };
  dropped(
    "skills",
    Object.keys(raw.skills || {}).length,
    Object.keys(clean.skills).length,
  );
  dropped(
    "placement",
    Object.keys(raw.placement || {}).length,
    Object.keys(clean.placement).length,
  );
  dropped(
    "repairs",
    Array.isArray(raw.repairs) ? raw.repairs.length : 0,
    clean.repairs.length,
  );
  dropped(
    "misconceptions",
    Object.keys(raw.misconceptions?.items || {}).length,
    Object.keys(clean.misconceptions.items).length,
  );
  return { ok: problems.length === 0, empty: false, problems, clean };
}

// Cleaning twice must equal cleaning once. A false here means export -> import -> export would silently change data.
export function checkRoundTrip(raw) {
  const once = sanitizeE8(raw);
  const twice = sanitizeE8(once);
  return {
    ok: stableStringify(once) === stableStringify(twice),
    once: fingerprint(once),
    twice: fingerprint(twice),
  };
}

// Wrap a backup with a fingerprint of its payload, and verify one later. A backup with no stamp (made before this
// existed) is accepted but reported as "unstamped"; a stamp that does not match is "changed".
export function stampBackup(payload) {
  return {
    ...payload,
    integrity: { algorithm: "fnv-1a-64x2", stamp: fingerprint(payload) },
  };
}
export function verifyBackup(file) {
  if (!file || typeof file !== "object") return { status: "invalid" };
  const { integrity, ...payload } = file;
  if (!integrity || typeof integrity.stamp !== "string")
    return { status: "unstamped" };
  return {
    status: fingerprint(payload) === integrity.stamp ? "ok" : "changed",
  };
}

// Inventory of keys under a prefix: size, whether it parses, and a total. `storage` is anything with length/key/getItem.
export function storageReport(storage, { prefix = "ewl-" } = {}) {
  const keys = [];
  let bytes = 0;
  for (let i = 0; i < (storage?.length || 0); i += 1) {
    const key = storage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const text = storage.getItem(key) ?? "";
    let parses = true;
    try {
      JSON.parse(text);
    } catch {
      parses = false;
    }
    bytes += text.length;
    keys.push({ key, bytes: text.length, parses });
  }
  keys.sort((a, b) => b.bytes - a.bytes);
  return {
    keys,
    bytes,
    unreadable: keys.filter((k) => !k.parses).map((k) => k.key),
  };
}
