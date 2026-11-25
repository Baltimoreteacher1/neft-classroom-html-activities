#!/usr/bin/env node
/**
 * CSP for /bcpss-teachers/: policy shape, mode switch, response handling, and the inline-script
 * inventory (a REPORT of what blocks enforcement, not a failure). Hard failures: an external
 * script/connect origin on a bcpss-teachers page, or an inventory parser that misses its fixture.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { onRequest as middleware } from "../../bcpss-teachers/_middleware.js";
import { applyBcpssCsp, buildCsp, cspModeFor, isBcpssPage, newNonce } from "./csp.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let passed = 0;
const ok = (name) => {
  passed++;
  console.log(`   ✓ ${name}`);
};
console.log("functions/_lib/security/csp.js");

const html = (body = "<p>x</p>", headers = {}) =>
  new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8", ...headers } });
const at = (path) => new URL(`https://eduwonderlab.com${path}`);

// Policy shape
const policy = buildCsp("NONCE123");
const directive = (name) => policy.split("; ").find((d) => d.startsWith(`${name} `));
assert.equal(directive("connect-src"), "connect-src 'self'");
assert.match(directive("script-src"), /'nonce-NONCE123'/);
assert.ok(!directive("script-src").includes("unsafe-inline"), "script-src must not allow unsafe-inline");
assert.ok(!directive("script-src").includes("unsafe-eval"));
assert.ok(!/https?:\/\//.test(policy), "no foreign origin anywhere in the policy");
assert.equal(directive("object-src"), "object-src 'none'");
assert.ok(policy.includes("report-uri /api/csp-report"));
assert.notEqual(newNonce(), newNonce());
ok("policy: connect-src 'self', nonce script-src, no unsafe-inline/eval, no foreign origins");

// Mode
assert.equal(cspModeFor({}), "report-only");
assert.equal(cspModeFor({ BCPSS_CSP_MODE: "enforce" }), "enforce");
assert.equal(cspModeFor({ BCPSS_CSP_MODE: "bogus" }), "report-only", "an unknown value falls back to report-only");
ok("mode defaults to report-only; env override validated");

// Scope
assert.ok(isBcpssPage(at("/bcpss-teachers/")) && isBcpssPage(at("/bcpss-teachers")) && isBcpssPage(at("/bcpss-teachers/studio/play/")));
assert.ok(!isBcpssPage(at("/bcpss-teachersx/")) && !isBcpssPage(at("/lessons/1-1/")));
ok("scope matches /bcpss-teachers only");

// Response handling
let r = applyBcpssCsp(html(), at("/bcpss-teachers/"), {});
assert.ok(r.headers.get("Content-Security-Policy-Report-Only")?.includes("connect-src 'self'"));
assert.equal(r.headers.get("Content-Security-Policy"), null, "report-only must not enforce");
r = applyBcpssCsp(html(), at("/bcpss-teachers/"), { BCPSS_CSP_MODE: "enforce" });
assert.ok(r.headers.get("Content-Security-Policy"));
assert.equal(r.headers.get("Content-Security-Policy-Report-Only"), null);
assert.equal(r.headers.get("Cache-Control"), "no-store", "enforce: a per-response nonce must not be cached");
r = applyBcpssCsp(html(), at("/bcpss-teachers/"), { BCPSS_CSP_MODE: "off" });
assert.equal(r.headers.get("Content-Security-Policy-Report-Only"), null);
r = applyBcpssCsp(html(), at("/lessons/1-1/"), {});
assert.equal(r.headers.get("Content-Security-Policy-Report-Only"), null, "other paths untouched");
r = applyBcpssCsp(new Response("{}", { headers: { "content-type": "application/json" } }), at("/bcpss-teachers/x.json"), {});
assert.equal(r.headers.get("Content-Security-Policy-Report-Only"), null, "non-HTML untouched");
r = applyBcpssCsp(new Response(null, { status: 304, headers: { "content-type": "text/html" } }), at("/bcpss-teachers/"), {});
assert.equal(r.headers.get("Content-Security-Policy-Report-Only"), null, "304 untouched");
ok("headers: report-only vs enforce vs off, scope, content type, status");

// Nonce injection through a stand-in HTMLRewriter (the real one exists only on Workers).
globalThis.HTMLRewriter = class {
  on(_selector, handlers) {
    this.handlers = handlers;
    return this;
  }
  transform(response) {
    const handlers = this.handlers;
    const body = response.body;
    const rewritten = new Response(
      new ReadableStream({
        async start(c) {
          const text = await new Response(body).text();
          c.enqueue(
            new TextEncoder().encode(
              text.replace(/<script(\s[^>]*)?>/g, (m) => {
                let nonce = "";
                handlers.element({ setAttribute: (_k, v) => (nonce = v) });
                return m.replace("<script", `<script nonce="${nonce}"`);
              }),
            ),
          );
          c.close();
        },
      }),
      response,
    );
    return rewritten;
  }
};
r = applyBcpssCsp(html("<script>1</script>"), at("/bcpss-teachers/"), {});
const sent = r.headers.get("Content-Security-Policy-Report-Only");
const nonceInHeader = sent.match(/'nonce-([^']+)'/)[1];
assert.ok((await r.text()).includes(`<script nonce="${nonceInHeader}">`), "inline scripts carry the header's nonce");
globalThis.HTMLRewriter = undefined;
ok("inline <script> tags receive the response nonce");

// Middleware wiring: wraps next() and applies the policy.
r = await middleware({ request: new Request("https://eduwonderlab.com/bcpss-teachers/"), env: {}, next: async () => html() });
assert.ok(r.headers.get("Content-Security-Policy-Report-Only"));
ok("functions/bcpss-teachers/_middleware.js applies the policy to next()");

// Inline-script inventory
export function inventory(source) {
  const inline = [];
  const external = [];
  for (const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    if (src) external.push(src);
    else if (!/json|ld\+json|importmap/i.test(type) && m[2].trim()) inline.push(m[2].trim().length);
  }
  const handlers = [...source.matchAll(/\son(?:click|change|load|submit|input|error)\s*=/gi)].length;
  return { inline, external, handlers };
}
const fixture = inventory(
  `<script>alert(1)</script><script src="/a.js"></script><script src="https://cdn.x/y.js"></script><script type="application/json">{}</script><div onclick="x()">`,
);
assert.equal(fixture.inline.length, 1, "inventory must find the inline fixture script");
assert.deepEqual(fixture.external, ["/a.js", "https://cdn.x/y.js"]);
assert.equal(fixture.handlers, 1);
ok("negative control: the inventory parser finds inline scripts, external srcs and handlers");

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}
const pages = htmlFiles(join(ROOT, "bcpss-teachers"));
assert.ok(pages.length >= 8, `expected the bcpss-teachers pages, found ${pages.length}`);
let inlineTotal = 0;
console.log("   inline script inventory (blocks enforcement without a nonce; report only):");
for (const file of pages) {
  const inv = inventory(readFileSync(file, "utf8"));
  inlineTotal += inv.inline.length;
  const foreign = inv.external.filter((s) => /^(?:https?:)?\/\//.test(s));
  assert.deepEqual(foreign, [], `${relative(ROOT, file)} loads a foreign script origin`);
  console.log(
    `     ${relative(ROOT, file)}: ${inv.inline.length} inline script(s), ${inv.handlers} inline handler(s), ${inv.external.length} external same-origin`,
  );
}
console.log(`   total inline scripts: ${inlineTotal}`);
ok("no bcpss-teachers page loads a foreign script origin");

console.log(`\n✓ csp: ${passed} checks`);
