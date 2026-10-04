import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const lab = new URL("../access-practice-lab/", import.meta.url);
const source = new URL("src/", lab);
const origin = "https://eduwonderlab.com";
const prefix = "/access-practice-lab/src/";
const files = readdirSync(source, { recursive: true })
  .filter((file) => file.endsWith(".js"))
  .sort();
const index = readFileSync(new URL("index.html", lab), "utf8");
const document = new JSDOM(index).window.document;

function moduleMap() {
  const maps = document.querySelectorAll('script[type="importmap"]');
  assert.equal(maps.length, 1, "The lab must publish one unambiguous import map");
  const map = JSON.parse(maps[0].textContent);
  assert.ok(map.imports, "Module import map missing imports");
  return map.imports;
}

test("home and deep-link shells share a complete content-versioned module map", () => {
  assert.equal(readFileSync(new URL("app-shell", lab), "utf8"), index);
  const imports = moduleMap();
  assert.deepEqual(
    Object.keys(imports).sort(),
    files.map((file) => prefix + file),
  );
  for (const file of files) {
    const hash = createHash("sha256")
      .update(readFileSync(new URL(file, source)))
      .digest("hex")
      .slice(0, 12);
    assert.equal(
      imports[prefix + file],
      `${prefix}${file}?v=${hash}`,
      `${file}: stale module version`,
    );
  }
});

test("import map is registered before the entry module and identifies the same main instance", () => {
  const imports = moduleMap();
  const scripts = [...document.querySelectorAll("script")];
  const mapPosition = scripts.findIndex((script) => script.type === "importmap");
  const modules = scripts.filter((script) => script.type === "module");
  assert.ok(modules.length, "Module entry missing");
  for (const script of modules) {
    assert.ok(
      scripts.indexOf(script) > mapPosition,
      "A module can load before import-map registration",
    );
  }
  const entry = modules.find((script) =>
    script.getAttribute("src")?.startsWith(`${prefix}main.js`),
  );
  assert.ok(entry, "Lab entry missing");
  assert.equal(
    entry.getAttribute("src"),
    imports[`${prefix}main.js`],
    "Entry and imported main would create separate module instances",
  );
});

test("relative dependency URLs resolve through the map to a single versioned module instance", () => {
  const imports = moduleMap();
  const instances = new Map();
  let checked = 0;
  for (const file of files) {
    const text = readFileSync(new URL(file, source), "utf8");
    // The lab uses literal ES module specifiers. Cover multiline imports,
    // re-exports, side-effect imports, and literal dynamic imports.
    const specifiers = [
      ...text.matchAll(/\bfrom\s*["']([^"']+)["']/g),
      ...text.matchAll(/\bimport\s*(?:\(\s*)?["']([^"']+)["']/g),
    ].map((match) => match[1]);
    for (const specifier of specifiers.filter((value) => value.startsWith("."))) {
      const importer = new URL(imports[prefix + file], origin);
      const normalized = new URL(specifier, importer);
      assert.ok(
        normalized.pathname.startsWith(prefix),
        `${file}: dependency leaves the mapped lab modules`,
      );
      const key = normalized.pathname + normalized.search;
      assert.ok(Object.hasOwn(imports, key), `${file}: ${specifier} bypasses cache versioning`);
      const resolved = new URL(imports[key], origin).href;
      if (instances.has(normalized.pathname)) {
        assert.equal(
          resolved,
          instances.get(normalized.pathname),
          `${specifier}: duplicate module identity`,
        );
      }
      instances.set(normalized.pathname, resolved);
      checked++;
    }
  }
  assert.ok(checked > 0, `No module dependencies checked under ${fileURLToPath(source)}`);
  assert.equal(
    instances.get(`${prefix}util.js`),
    new URL(imports[`${prefix}util.js`], origin).href,
  );
  assert.equal(
    instances.get(`${prefix}store.js`),
    new URL(imports[`${prefix}store.js`], origin).href,
  );
});
