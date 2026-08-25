// engine-hooks.mjs — Node module-customization hooks that make the REAL engine
// importable from plain `node` test scripts.
//
// Two things block `import "engine/core/lesson-renderer.js"` outside Vite:
//   1. `@engine/...` is a Vite alias (vite.config.js resolve.alias), which Node
//      treats as a bare package specifier and cannot find.
//   2. The engine imports `.css` files for their build-time side effect; Node
//      has no CSS loader.
//
// These hooks close both gaps for TESTS ONLY: `@engine/` resolves to the repo's
// engine/ directory, and any `.css` import loads as an empty module (the tests
// assert behavior, not styling; jsdom pages carry no stylesheets anyway).
//
// Usage in a test file (hooks affect DYNAMIC imports registered after them):
//   import "../tools/lib/register-engine-hooks.mjs";
//   const renderer = await import("../engine/core/lesson-renderer.js");
//
// This does not touch the build: Vite never sees these hooks, and no engine
// file changes. It is the smallest possible door into unit-testing the
// renderer's pure logic, which until now was only reachable end-to-end.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENGINE = path.join(ROOT, "engine");

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@engine/")) {
    const target = path.join(ENGINE, specifier.slice("@engine/".length));
    return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    return { format: "module", source: "export default {};", shortCircuit: true };
  }
  return nextLoad(url, context);
}
