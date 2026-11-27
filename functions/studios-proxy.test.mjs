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
import { STUDIOS_UPSTREAM, isStudiosRequest, proxyStudios, studioPageTitle, studioTitleGuard } from "./_lib/studios-proxy.js";
import { STUDIO_APP_PAGES } from "../access-practice-lab/src/studio-app.js";
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

await t("each studio page the listing names gets its own title; others keep the app's", async () => {
  const shell = '<head><title>Learning Studios · The Language Page</title><meta property="og:title" content="Learning Studios"></head>';
  const titles = new Set();
  for (const page of STUDIO_APP_PAGES) {
    const out = studioPageTitle(shell, `${page.path}/`, "thelanguagepage.com");
    const title = /<title>([^<]*)<\/title>/.exec(out)[1];
    assert.ok(title.endsWith("· The Language Page"), `${page.path}: ${title}`);
    assert.ok(out.includes(`og:title" content="${title}"`), `${page.path}: og:title not updated`);
    titles.add(title);
  }
  assert.equal(titles.size, STUDIO_APP_PAGES.length, "two studio pages share a title");
  const math = studioPageTitle(shell, "/studios/math/lesson/3-2/practice", "thelanguagepage.com");
  assert.ok(math.includes("<title>Learning Studios · The Language Page</title>"), "an unlisted page keeps the app's title");
  assert.equal(studioPageTitle("<p>no head</p>", "/studios/language/speaking", "thelanguagepage.com"), "<p>no head</p>");
  const eduwonderlab = studioPageTitle(shell, "/studios/language/speaking", "eduwonderlab.com");
  assert.ok(!eduwonderlab.includes("The Language Page"), "the other host is not branded as The Language Page");
});

await t("the proxy titles a studio page it serves and leaves other bodies alone", async () => {
  const html = "<head><title>Learning Studios</title></head>";
  const up = upstream(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }));
  const url = u("https://thelanguagepage.com/studios/language/speaking");
  const res = await proxyStudios(new Request(url), url, up.fn);
  assert.match(await res.text(), /<title>Speaking tasks · Learning Studios · The Language Page<\/title>/);
  const asset = upstream(new Response("body{}", { headers: { "content-type": "text/css" } }));
  const css = u("https://thelanguagepage.com/studios/_next/static/a.css");
  assert.equal(await (await proxyStudios(new Request(css), css, asset.fn)).text(), "body{}");
});

await t("the title guard keeps a listed page's title when the app resets it and follows the address", async () => {
  const { JSDOM } = await import("jsdom");
  const html = studioPageTitle("<html><head><title>Learning Studios</title></head><body></body></html>", "/studios/language/speaking", "thelanguagepage.com");
  const dom = new JSDOM(html, { url: "https://thelanguagepage.com/studios/language/speaking", runScripts: "dangerously" });
  const { document, history } = dom.window;
  assert.equal(document.title, "Speaking tasks · Learning Studios · The Language Page");
  document.title = "Learning Studios · The Language Page"; // the app resets it
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(document.title, "Speaking tasks · Learning Studios · The Language Page");
  history.pushState({}, "", "/studios/language/writing/"); // an in-app link
  document.title = "Learning Studios";
  await new Promise((r) => setTimeout(r, 20));
  assert.match(document.title, /^Writing workshop/);
  history.pushState({}, "", "/studios/math/lesson/3-2/practice"); // a page the listing does not name
  document.title = "Fractions";
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(document.title, "Fractions");
  const quote = studioTitleGuard("thelanguagepage.com");
  assert.ok(!/<\/script/i.test(quote.slice(8, -9)), "the table cannot close the script early");
});

console.log(`studios-proxy: ${passed} checks passed.`);
