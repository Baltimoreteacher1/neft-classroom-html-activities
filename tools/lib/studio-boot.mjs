// Boots one generated studio page in jsdom, in memory: the page is built by the generator (nothing is written), then the
// scripts it names run in the order it names them. Used by tests that need the real runtime (language layer).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {Map<string, string>} */
const pages = new Map();
/** The generated HTML of one studio page, built once per lesson and mode. */
export async function pageHtml(
  /** @type {string} */ id,
  /** @type {"practice"|"challenge"} */ mode = "practice",
) {
  const key = `${id}|${mode}`;
  if (!pages.has(key)) {
    const { outputs } = await import("../../scripts/generate-practice-studios.mjs");
    const { files } = outputs({ only: [id] });
    for (const m of ["practice", "challenge"])
      pages.set(
        `${id}|${m}`,
        files.get(`math/practice-studio/${id}/${m === "practice" ? "" : "challenge/"}index.html`),
      );
  }
  return /** @type {string} */ (pages.get(key));
}

/**
 * @param {string} id lesson id
 * @param {{mode?: "practice"|"challenge", search?: string, store?: Record<string, string>, fire?: boolean}} [o]
 * @returns {Promise<{w: any, errors: string[], html: string}>}
 */
export async function bootStudio(id, o = {}) {
  const html = await pageHtml(id, o.mode || "practice");
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: `https://eduwonderlab.com/math/practice-studio/${id}/${o.mode === "challenge" ? "challenge/" : ""}${o.search || ""}`,
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [k, v] of Object.entries(o.store || {})) w.localStorage.setItem(k, v);
  /** @type {string[]} */
  const errors = [];
  w.addEventListener("error", (e) => errors.push(String(e.error || e.message)));
  for (const m of html.matchAll(/<script src="(\/[^"?]+)/g)) {
    try {
      w.eval(readFileSync(join(ROOT, m[1]), "utf8"));
    } catch (e) {
      errors.push(`${m[1]}: ${/** @type {Error} */ (e).message}`);
    }
  }
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  if (o.fire !== false) w.dispatchEvent(new w.Event("load"));
  return { w, errors, html };
}
