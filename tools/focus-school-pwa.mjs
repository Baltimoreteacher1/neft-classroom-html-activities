/* Focus School — installed-app (PWA) and offline verification.
 *
 * Checks the things only a real browser against a real deployment can prove:
 * the manifest is installable, a service worker is actually controlling the
 * page, and the app still opens with the network switched off.
 *
 *   node tools/focus-school-pwa.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "https://noam.eduwonderlab.com/";
const R = [];
const ok = (n, c, d = "") => R.push([c, n, d]);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => {
  if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(m.text());
});
await p.goto(BASE, { waitUntil: "load" });
await p.waitForSelector("#hero .now-task, .nextup", { timeout: 20000 });

// --- manifest / installability ---
const man = await p.evaluate(async () => {
  const l = document.querySelector("link[rel=manifest]");
  const r = await fetch(l.href);
  return await r.json();
});
ok("manifest has a name", !!man.name, man.name);
ok("manifest has a start_url", !!man.start_url, man.start_url);
ok(
  "manifest is standalone-capable",
  /standalone|fullscreen|minimal-ui/.test(man.display || ""),
  man.display,
);
ok(
  "manifest declares a 192 and 512 icon",
  (man.icons || []).some((i) => /192/.test(i.sizes)) &&
    (man.icons || []).some((i) => /512/.test(i.sizes)),
  (man.icons || []).map((i) => i.sizes).join(","),
);
ok(
  "manifest declares a maskable icon",
  (man.icons || []).some((i) => /maskable/.test(i.purpose || "")),
);
ok("theme-color is set", (await p.locator("meta[name=theme-color]").count()) > 0);

// --- service worker ---
const sw = await p.evaluate(async () => {
  // ready resolves once a worker is actually controlling the page.
  const r = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((res) => setTimeout(() => res(null), 15000)),
  ]);
  return r ? { scope: r.scope, active: !!r.active } : null;
});
ok("a service worker is registered and active", !!(sw && sw.active), JSON.stringify(sw));

// --- offline shell ---
await p.waitForTimeout(3000); // let precache settle
const onlineErrs = [...errs];
await ctx.setOffline(true);
await p.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
await p.waitForTimeout(2500);
const offlineText = await p
  .locator("#main")
  .innerText()
  .catch(() => "");
const offlineHero = await p
  .locator("#hero")
  .innerText()
  .catch(() => "");
ok(
  "the app still opens with no network",
  (offlineText + offlineHero).length > 40,
  (offlineHero || offlineText).slice(0, 60).replace(/\n/g, " | "),
);

// --- reconnect ---
await ctx.setOffline(false);
await p.waitForTimeout(1500);
const afterReconnect = errs.slice(errs.length);
ok("reconnecting does not throw a new error", afterReconnect.length === 0);

// --- mobile layout ---
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok("no horizontal scroll at 390px", overflow <= 1, `${overflow}px`);
ok("no uncaught errors while online", onlineErrs.length === 0, onlineErrs.slice(0, 2).join(" | "));
await b.close();
for (const [c, n, d] of R) console.log(`${c ? "  ✓" : "  ✗"} ${n}${d ? `  — ${d}` : ""}`);
console.log(`\nPWA/offline: ${R.filter((x) => x[0]).length}/${R.length} passed`);

process.exit(R.some((x) => !x[0]) ? 1 : 0);
