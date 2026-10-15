// Loads the browser-only studio modules (generators, activities, figures) into a node:vm context so tests and the
// build can call them without a DOM. Modules touch only `window`, so a context whose `window` is its own global works.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dir = (d) =>
  existsSync(join(ROOT, d))
    ? readdirSync(join(ROOT, d))
        .filter((f) => f.endsWith(".js"))
        .sort()
    : [];

/** @param {{gen?: boolean, act?: boolean, viz?: boolean}} want */
export function loadStudio({ gen = true, act = false, viz = false } = {}) {
  const ctx = {};
  ctx.window = ctx;
  ctx.console = console;
  vm.createContext(ctx);
  const run = (rel) =>
    vm.runInContext(readFileSync(join(ROOT, rel), "utf8"), ctx, { filename: rel });
  if (gen || act) {
    run("assets/studio-gen/core.js");
    for (const f of dir("assets/studio-gen")) if (f !== "core.js") run(`assets/studio-gen/${f}`);
  }
  if (viz) {
    const files = readdirSync(join(ROOT, "assets"))
      .filter((f) => /^studio-viz.*\.js$/.test(f))
      .sort();
    for (const f of [
      ...files.filter((x) => x === "studio-viz.js"),
      ...files.filter((x) => x !== "studio-viz.js"),
    ])
      run(`assets/${f}`);
  }
  if (act) {
    run("assets/studio-act/core.js");
    for (const f of dir("assets/studio-act")) if (f !== "core.js") run(`assets/studio-act/${f}`);
  }
  return ctx;
}
