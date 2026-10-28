// The installable family app: the home screen (/family-app/) and the Fluency Lab must each be installable
// (manifest, icons, a worker whose scope holds start_url), and every card on the home screen must point at a page
// that exists. ACCESS Lab and Family Connections ship their own manifests and are checked for the home link only.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const onDisk = (urlPath) => existsSync(new URL(urlPath.replace(/^\//, ""), root));

const apps = [
  {
    name: "family home",
    manifest: "family-app/manifest.webmanifest",
    page: "family-app/index.html",
    sw: "family-app/sw.js",
    swScope: "/family-app/",
  },
  {
    name: "fluency lab",
    manifest: "math/fluency-lab/manifest.json",
    page: "math/fluency-lab/index.html",
    sw: "math/fluency-lab/sw.js",
    swScope: "/math/fluency-lab/",
  },
];

for (const app of apps) {
  test(`${app.name}: manifest is installable`, () => {
    const m = JSON.parse(read(app.manifest));
    assert.equal(m.display, "standalone");
    assert.ok(m.start_url.startsWith(m.scope), "start_url inside scope");
    assert.ok(m.start_url.startsWith(app.swScope), "start_url inside the worker's scope");
    const sizes = m.icons.map((i) => `${i.sizes}/${i.purpose}`);
    for (const need of ["192x192/any", "512x512/any", "512x512/maskable"])
      assert.ok(sizes.includes(need), `icon ${need}`);
    for (const icon of m.icons) assert.ok(onDisk(icon.src), `${icon.src} exists`);
  });

  test(`${app.name}: page links its manifest and registers its worker`, () => {
    const html = read(app.page);
    assert.ok(html.includes(`href="/${app.manifest}"`), "manifest link");
    assert.ok(html.includes(`${app.swScope}sw.js`), "worker registration");
    assert.ok(
      read(app.sw).includes('addEventListener("fetch"'),
      "worker has a fetch handler (required to install)",
    );
  });

  test(`${app.name}: _headers keeps the worker revalidating with the right scope`, () => {
    const headers = read("_headers");
    const block = headers.slice(headers.indexOf(`/${app.sw}\n`));
    assert.ok(block.startsWith(`/${app.sw}\n`), "rule exists");
    assert.match(block.split("\n\n")[0], new RegExp(`Service-Worker-Allowed: ${app.swScope}`));
  });
}

test("family home: every card points at a page that exists", () => {
  const hrefs = [...read("family-app/index.html").matchAll(/class="card" href="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.equal(hrefs.length, 3);
  for (const h of hrefs) assert.ok(onDisk(`${h}index.html`), `${h} has an index.html`);
});

test("each practice area loads the Family-home button", () => {
  for (const page of [
    "math/fluency-lab/index.html",
    "curriculum/family-connections/index.html",
    "access-practice-lab/index.html",
  ]) {
    assert.ok(read(page).includes("/family-app/home-link.js"), page);
  }
  assert.equal(
    read("access-practice-lab/app-shell"),
    read("access-practice-lab/index.html"),
    "ACCESS shell mirrors index",
  );
});

test("workers never touch live endpoints", () => {
  assert.match(read("math/fluency-lab/sw.js"), /SKIP_PREFIXES = \["\/api\/", "\/results"\]/);
  assert.ok(
    !/\/api\//.test(read("family-app/sw.js").replace(/\/\*[\s\S]*?\*\//, "")),
    "family worker only handles /family-app/",
  );
});
