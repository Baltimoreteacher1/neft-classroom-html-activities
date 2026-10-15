// Loads the browser-only EWL modules (assets/ewl/*.js) into a node:vm context so tests can run them without a DOM.
// Modules touch only `window`/`globalThis`, so a context whose `window` is its own global works. Load order is the
// order the pages use: rational, state-store, reasoning, then everything else alphabetically.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const FIRST = ["rational.js", "state-store.js", "reasoning.js"];

/** @param {{only?: string[], extra?: Record<string, unknown>}} [opts] */
export function loadEwl({ only, extra = {} } = {}) {
  /** @type {Record<string, any>} */
  const ctx = {
    console,
    TextEncoder,
    TextDecoder,
    URLSearchParams,
    Buffer,
    setInterval,
    clearInterval,
    ...extra,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const dir = join(ROOT, "assets/ewl");
  const all = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".js")) : [];
  const ordered = [
    ...FIRST.filter((f) => all.includes(f)),
    ...all.filter((f) => !FIRST.includes(f)).sort(),
  ];
  for (const f of ordered) {
    if (only && !only.includes(f)) continue;
    vm.runInContext(readFileSync(join(dir, f), "utf8"), ctx, { filename: `assets/ewl/${f}` });
  }
  return ctx;
}
