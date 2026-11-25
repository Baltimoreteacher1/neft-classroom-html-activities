/**
 * Pure request analysis for the egress probe (no browser needed, so it is unit-tested directly).
 * A request is a finding when
 *   - its origin is not in allowedOrigins (kind "cross-origin"), or
 *   - its URL, body or headers carry a canary in any common encoding (kind "canary"),
 *     unless the request matches an explicit allowCanaryTo entry.
 * data:, blob: and about: URLs never leave the page and are ignored.
 * Canaries are matched case-insensitively as: raw, percent-encoded, form-encoded (+), base64 and
 * base64url at all three byte alignments. Encodings beyond these (encryption, compression, a custom
 * cipher) are not detected; the harness proves a flow does not leak a plain or simply encoded value.
 */
import { createRng } from "../../shared/fixtures/prng.js";

const LOCAL_SCHEMES = new Set(["data:", "blob:", "about:"]);

/** Deterministic canary: letters/digits/hyphen only so it survives URLs and form fields. */
export function makeCanary(label, seed = "egress-probe") {
  const hex = Math.floor(createRng(`${seed}/${label}`).next() * 0xffffffff)
    .toString(16)
    .padStart(8, "0");
  return { label, value: `zzcanary-${label}-${hex}` };
}

export function originOf(url) {
  try {
    const u = new URL(url);
    if (LOCAL_SCHEMES.has(u.protocol)) return null;
    const scheme = u.protocol === "ws:" ? "http:" : u.protocol === "wss:" ? "https:" : u.protocol;
    return `${scheme}//${u.host}`;
  } catch {
    return "unparseable";
  }
}

function base64Forms(value) {
  const bytes = Buffer.from(value, "utf8");
  const forms = [];
  for (const [k, start] of [
    [0, 0],
    [1, 2],
    [2, 3],
  ]) {
    const total = k + bytes.length;
    const raw = Buffer.concat([Buffer.alloc(k), bytes])
      .toString("base64")
      .replace(/=+$/, "");
    const trim = total % 3 === 1 ? 2 : total % 3 === 2 ? 1 : 0;
    const form = raw.slice(start, trim ? raw.length - trim : undefined);
    if (form.length >= 8) forms.push(form, form.replaceAll("+", "-").replaceAll("/", "_"));
  }
  return forms;
}

/** Every encoding of a canary the probe looks for (lower-cased; base64 is case-sensitive so kept as is). */
export function canaryForms(value) {
  const lower = value.toLowerCase();
  const text = [lower, encodeURIComponent(lower), encodeURIComponent(lower).replaceAll("%20", "+")];
  return { text, base64: base64Forms(value) };
}

function containsCanary(haystack, forms) {
  const lower = haystack.toLowerCase();
  if (forms.text.some((f) => lower.includes(f))) return true;
  let decoded = lower;
  try {
    decoded = decodeURIComponent(lower.replaceAll("+", " "));
  } catch {}
  return decoded.includes(forms.text[0]) || forms.base64.some((f) => haystack.includes(f));
}

function allowedCanary(url, rules) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return rules.some((r) => u.origin === r.origin && u.pathname.startsWith(r.pathPrefix ?? "/"));
}

/**
 * @param {{url: string, method?: string, postData?: string|Buffer|null, headers?: Record<string,string>}} req
 * @param {{allowedOrigins: string[], canaries?: ({label: string, value: string}|string)[], allowCanaryTo?: {origin: string, pathPrefix?: string}[]}} config
 * @returns {{kind: "cross-origin"|"canary", where?: string, canary?: string, url: string, method: string}[]}
 */
export function analyzeRequest(req, { allowedOrigins, canaries = [], allowCanaryTo = [] }) {
  const method = req.method ?? "GET";
  const origin = originOf(req.url);
  if (origin === null) return [];
  const findings = [];
  if (!allowedOrigins.includes(origin))
    findings.push({ kind: "cross-origin", url: req.url, method, origin });
  if (allowedCanary(req.url, allowCanaryTo) && allowedOrigins.includes(origin)) return findings;
  const body =
    req.postData == null
      ? ""
      : Buffer.isBuffer(req.postData)
        ? req.postData.toString("latin1")
        : String(req.postData);
  const headers = Object.entries(req.headers ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  for (const c of canaries) {
    const value = typeof c === "string" ? c : c.value;
    const label = typeof c === "string" ? c : c.label;
    const forms = canaryForms(value);
    for (const [where, text] of [
      ["url", req.url],
      ["body", body],
      ["header", headers],
    ]) {
      if (text && containsCanary(text, forms))
        findings.push({ kind: "canary", where, canary: label, url: req.url, method });
    }
  }
  return findings;
}
