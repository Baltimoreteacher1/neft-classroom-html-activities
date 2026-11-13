#!/usr/bin/env node
/**
 * studios-proxy.test.mjs — the Learning Studios app is served at /studios on thelanguagepage.com and
 * eduwonderlab.com through a same-origin proxy, and the proxy does only that.
 *
 * Pinned here: which requests are proxied, exactly what goes upstream (no cookies, no credentials),
 * what comes back (redirects rewritten to the visitor's origin, no upstream cookies), how failure looks
 * (502 for /studios only), and that the real middleware answers it ahead of the teacher gate while every
 * other path still falls through to the site.
 */
import assert from "node:assert/strict";
import { languagePageRoute } from "./_lib/language-page.js";
import { STUDIOS_UPSTREAM, isStudiosRequest, proxyStudios } from "./_lib/studios-proxy.js";
import { onRequest } from "./_middleware.js";

let passed = 0;
const t = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
};
const u = (s) => new URL(s);

/** A fake upstream that records the call it receives. */
function upstream(response) {
  const calls = [];
  const fn = async (target, init) => {
    calls.push({ target: String(target), init });
    return typeof response === "function" ? response(target, init) : response;
  };
  return { fn, calls };
}

await t("only the app path on the two site hosts is proxied", () => {
  for (const s of ["https://thelanguagepage.com/studios", "https://thelanguagepage.com/studios/language", "https://eduwonderlab.com/studios/math/lesson/3-2/practice"])
    assert.equal(isStudiosRequest(u(s)), true, s);
  for (const s of [
    "https://thelanguagepage.com/studios-evil/",
    "https://thelanguagepage.com/studio/",
    "https://thelanguagepage.com/learning-studios/",
    "https://thelanguagepage.com/x/studios/",
    "https://evil.example/studios/language",
    "https://thelanguagepage.com.evil.example/studios/",
  ])
    assert.equal(isStudiosRequest(u(s)), false, s);
});

await t("the lab host serves /studios instead of redirecting it to eduwonderlab.com", () => {
  for (const p of ["/studios", "/studios/language", "/studios/_next/static/a.js"])
    assert.equal(languagePageRoute(u(`https://thelanguagepage.com${p}`)).kind, "serve", p);
  assert.equal(languagePageRoute(u("https://thelanguagepage.com/studios-evil/")).kind, "redirect");
});

await t("a GET goes to the fixed upstream with the same path and query", async () => {
  const up = upstream(new Response("page", { headers: { "content-type": "text/html" } }));
  const url = u("https://thelanguagepage.com/studios/math/lesson/3-2/practice?x=1");
  const res = await proxyStudios(new Request(url), url, up.fn);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "page");
  assert.equal(up.calls.length, 1);
  assert.equal(up.calls[0].target, `${STUDIOS_UPSTREAM}/studios/math/lesson/3-2/practice?x=1`);
  assert.equal(up.calls[0].init.method, "GET");
  assert.equal(up.calls[0].init.redirect, "manual");
});

await t("only listed headers go upstream: cookies and credentials never do", async () => {
  const up = upstream(new Response("ok"));
  const url = u("https://thelanguagepage.com/studios/language");
  const request = new Request(url, {
    headers: {
      cookie: "eduwonderlab_teacher=secret",
      authorization: "Basic c2VjcmV0",
      "x-custom": "nope",
      accept: "text/html",
      "accept-language": "es",
      origin: "https://thelanguagepage.com",
    },
  });
  await proxyStudios(request, url, up.fn);
  const sent = up.calls[0].init.headers;
  assert.equal(sent.get("cookie"), null);
  assert.equal(sent.get("authorization"), null);
  assert.equal(sent.get("x-custom"), null);
  assert.equal(sent.get("accept"), "text/html");
  assert.equal(sent.get("accept-language"), "es");
  assert.equal(sent.get("x-forwarded-host"), "thelanguagepage.com");
  assert.equal(sent.get("x-forwarded-proto"), "https");
  assert.equal(sent.get("origin"), "https://thelanguagepage.com");
});

await t("a server-action POST keeps its body and protocol headers", async () => {
  const up = upstream(new Response("{}", { headers: { "content-type": "text/x-component" } }));
  const url = u("https://eduwonderlab.com/studios/math/lesson/3-2/practice");
  const request = new Request(url, {
    method: "POST",
    body: '["3-2","3-2-prereq","c1",false]',
    headers: { "content-type": "text/plain;charset=UTF-8", "next-action": "abc123", origin: "https://eduwonderlab.com" },
  });
  await proxyStudios(request, url, up.fn);
  const call = up.calls[0];
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers.get("next-action"), "abc123");
  assert.equal(call.init.headers.get("x-forwarded-host"), "eduwonderlab.com");
  const sent = await new Response(call.init.body).text();
  assert.equal(sent, '["3-2","3-2-prereq","c1",false]');
});

await t("redirects are rewritten to the visitor's origin; foreign ones are left alone", async () => {
  const own = upstream(new Response(null, { status: 307, headers: { location: `${STUDIOS_UPSTREAM}/studios/language?a=1#top` } }));
  const url = u("https://thelanguagepage.com/language");
  let res = await proxyStudios(new Request("https://thelanguagepage.com/studios"), u("https://thelanguagepage.com/studios"), own.fn);
  assert.equal(res.status, 307);
  assert.equal(res.headers.get("location"), "https://thelanguagepage.com/studios/language?a=1#top");
  const foreign = upstream(new Response(null, { status: 302, headers: { location: "https://elsewhere.example/x" } }));
  res = await proxyStudios(new Request(url), url, foreign.fn);
  assert.equal(res.headers.get("location"), "https://elsewhere.example/x");
});

await t("upstream cookies are dropped; html is revalidated; hashed assets keep their cache", async () => {
  const html = upstream(
    new Response("<html></html>", {
      headers: { "content-type": "text/html; charset=utf-8", "set-cookie": "a=b", "cache-control": "s-maxage=31536000", "content-encoding": "gzip", "content-length": "99" },
    }),
  );
  let url = u("https://thelanguagepage.com/studios/language");
  let res = await proxyStudios(new Request(url), url, html.fn);
  assert.equal(res.headers.get("set-cookie"), null);
  assert.equal(res.headers.get("content-encoding"), null);
  assert.equal(res.headers.get("content-length"), null);
  assert.equal(res.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  const asset = upstream(new Response("js", { headers: { "content-type": "application/javascript", "cache-control": "public, max-age=31536000, immutable" } }));
  url = u("https://thelanguagepage.com/studios/_next/static/chunks/a.js");
  res = await proxyStudios(new Request(url), url, asset.fn);
  assert.equal(res.headers.get("cache-control"), "public, max-age=31536000, immutable");
});

await t("an unreachable upstream is a 502, and other methods are refused", async () => {
  const url = u("https://thelanguagepage.com/studios/language");
  const down = async () => {
    throw new Error("boom");
  };
  let res = await proxyStudios(new Request(url), url, down);
  assert.equal(res.status, 502);
  assert.equal(res.headers.get("cache-control"), "no-store");
  for (const method of ["PUT", "DELETE", "PATCH"]) {
    const never = upstream(new Response("x"));
    res = await proxyStudios(new Request(url, { method }), url, never.fn);
    assert.equal(res.status, 405, method);
    assert.equal(never.calls.length, 0, method);
  }
});

await t("the real middleware answers /studios ahead of the teacher gate and leaves other paths alone", async () => {
  const realFetch = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (target) => {
    seen.push(String(target));
    return new Response("studio page", { headers: { "content-type": "text/plain" } });
  };
  try {
    const run = async (s) => {
      let fell = false;
      const res = await onRequest({
        request: new Request(s),
        env: { SITE_PASSWORD: "pw" },
        data: {},
        next: async () => {
          fell = true;
          return new Response("site", { status: 200 });
        },
        functionPath: "",
        params: {},
        waitUntil() {},
      });
      return { fell, res };
    };
    for (const s of ["https://thelanguagepage.com/studios/language/teacher", "https://eduwonderlab.com/studios/language/teacher"]) {
      const { fell, res } = await run(s);
      assert.equal(fell, false, s);
      assert.equal(res.status, 200, s);
      assert.equal(await res.text(), "studio page", s);
    }
    assert.equal(seen.length, 2);
    seen.length = 0;
    const plain = await run("https://eduwonderlab.com/about/");
    assert.equal(plain.fell, true);
    const gated = await run("https://eduwonderlab.com/access-teacher/");
    assert.equal(gated.res.status, 401);
    const wwwApex = await run("https://www.thelanguagepage.com/studios/language");
    assert.equal(wwwApex.res.status, 308);
    assert.equal(seen.length, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

console.log(`studios-proxy: ${passed} checks passed.`);
