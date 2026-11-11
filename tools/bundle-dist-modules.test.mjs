// tools/bundle-dist-modules.mjs rewrites module source before bundling. These pin the two rewrites a wrong
// answer would silently break at runtime: the template import() map (graphics/registry.js loads ./${kind}.js) and
// the refusal of a computed import() path, which would otherwise load a file the bundler removed.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expandDynamicImports, importSpecifiers } from "./bundle-dist-modules.mjs";

const dir = mkdtempSync(join(tmpdir(), "bundle-dist-"));
try {
  for (const f of ["area.js", "array.js", "area.test.js", "notes.css"])
    writeFileSync(join(dir, f), "");
  const file = join(dir, "registry.js");

  // Template import -> a map over the real files; tests and other extensions are not candidates.
  const out = expandDynamicImports("export const load = (k) => import(`./${k}.js`);", file);
  assert.match(out, /"\.\/area\.js": \(\) => import\("\.\/area\.js"\)/);
  assert.match(out, /"\.\/array\.js": \(\) => import\("\.\/array\.js"\)/);
  assert.doesNotMatch(out, /area\.test\.js|notes\.css/);
  assert.match(out, /Unknown module: /, "an unknown name rejects like the import it replaces");
  const load = new Function(
    "return " + out.replace("export const load = ", "").replace(/;$/, ""),
  )();
  await assert.rejects(load("missing"), /Unknown module: \.\/missing\.js/);

  // A literal import() is left alone.
  const literal = 'const m = await import("./area.js");';
  assert.equal(expandDynamicImports(literal, file), literal);

  // Computed paths are refused: the bundler cannot know what they load.
  assert.throws(
    () => expandDynamicImports('const f = "./area.js"; import(f);', file),
    /computed path/,
  );
  assert.throws(() => expandDynamicImports("import(`./${a}/${b}.js`);", file), /computed path/);
  assert.throws(() => expandDynamicImports("import(`${base}/x.js`);", file), /computed path/);
  assert.throws(() => expandDynamicImports("import(`./zz${k}.js`);", file), /matches no file/);

  // Every import form the keep-closure walks.
  assert.deepEqual(
    importSpecifiers(
      'import a from "./a.js"; import "./b.js"; export { c } from "./c.js"; export * from "./d.js"; import("./e.js"); import(x);',
      file,
    ),
    ["./a.js", "./b.js", "./c.js", "./d.js", "./e.js"],
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log("ok bundle-dist-modules: template import map, computed-path refusal, import walk");
