// Loads one of Unit 4's hand-built Practice Studio pages into jsdom, scripts and all, the way a browser would.
//
// The pages pull their shared scripts from absolute /assets/... paths, so each <script src> is replaced by the file's own text
// before jsdom parses the page (jsdom would otherwise try the network). The injected lab bench is cut out: it is a separate
// card with its own state and is proved by tools/studio-lab-bench.test.mjs.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import jsdom from "jsdom";
import { REPO_ROOT } from "./curriculum-source.mjs";

const { JSDOM, VirtualConsole } = jsdom;

/** @param {string} page folder name under math/unit-4 */
function pageHtml(page) {
  let html = readFileSync(join(REPO_ROOT, "math/unit-4", page, "index.html"), "utf8");
  html = html.replace(/<!-- u4-lab-bench:begin[\s\S]*?<!-- u4-lab-bench:end -->/, "");
  html = html.replace(
    /<script\b([^>]*?)\bsrc="(\/[^"?]+)(?:\?[^"]*)?"([^>]*)><\/script>/g,
    (_m, _a, src) => {
      const file = join(REPO_ROOT, src);
      if (!existsSync(file)) return "";
      return `<script>${readFileSync(file, "utf8").replace(/<\/script/g, "<\\/script")}</script>`;
    },
  );
  return html;
}

/**
 * @param {string} page
 * @param {{ storage?: Record<string, string>, support?: boolean }} [opts] storage: localStorage to start from (a reload)
 */
export async function loadU4Page(page, opts = {}) {
  const errors = /** @type {string[]} */ ([]);
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(String(e.message).slice(0, 300)));
  vc.on("error", (e) => errors.push(String(e).slice(0, 300)));
  const dom = new JSDOM(pageHtml(page), {
    url: `http://localhost/math/unit-4/${page}/${opts.support ? "?support=1" : ""}`,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      const win = /** @type {any} */ (w);
      for (const [k, v] of Object.entries(opts.storage || {})) w.localStorage.setItem(k, v);
      win.matchMedia = (/** @type {string} */ q) => ({
        matches: false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
      });
      win.Element.prototype.scrollIntoView = () => {};
      win.Element.prototype.animate = () => ({});
      win.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      win.confirm = () => true;
    },
  });
  const w = /** @type {any} */ (dom.window);
  await new Promise((r) => setTimeout(r, 60));
  const settle = () => new Promise((r) => setTimeout(r, 0));
  return {
    w,
    d: w.document,
    errors,
    settle,
    /** the localStorage as it stands (hand it to the next load to simulate a reload) */
    storage() {
      /** @type {Record<string, string>} */
      const out = {};
      for (let i = 0; i < w.localStorage.length; i++) {
        const k = w.localStorage.key(i);
        out[k] = w.localStorage.getItem(k);
      }
      return out;
    },
    close() {
      w.close();
    },
  };
}
