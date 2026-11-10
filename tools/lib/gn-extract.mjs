// Extract every student-facing text leaf that Easy read can replace, from one Axiom City book.
// The book's OWN engine runs in jsdom (one page per render, gates mounted, CHECK pressed to bring up
// the engine's hint boxes, the worked-example modal opened), then the layer's `collectLeaves` /
// `describe` read the DOM: the same functions the browser runs, so the keys are the runtime keys.
// Gate feedback ("api.fail" / "api.pass" / "mkfeed" strings) is read from the source, because it only
// exists after a student answers.
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { loadLayer } from "./gn-layer.mjs";

const layer = loadLayer();

/** Read the argument list of a call whose "(" is at `open`; returns the raw argument strings. */
function readArgs(src, open) {
  const args = [];
  let depth = 0;
  let start = open + 1;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(src, i);
      continue;
    }
    if (c === "/" && src[i + 1] === "/") i = src.indexOf("\n", i);
    else if (c === "/" && src[i + 1] === "*") i = src.indexOf("*/", i) + 1;
    else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) {
      depth--;
      if (depth === 0) {
        args.push(src.slice(start, i));
        return args;
      }
    } else if (c === "," && depth === 1) {
      args.push(src.slice(start, i));
      start = i + 1;
    }
    if (i < 0) break;
  }
  return args;
}

function skipString(src, i) {
  const q = src[i];
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === "\\") j++;
    else if (q === "`" && src[j] === "$" && src[j + 1] === "{") {
      let d = 0;
      for (j += 1; j < src.length; j++) {
        if (src[j] === "{") d++;
        else if (src[j] === "}" && --d === 0) break;
        else if ("\"'`".includes(src[j])) j = skipString(src, j);
      }
    } else if (src[j] === q) return j;
  }
  return src.length;
}

/** A constant string ("a" + 'b' + `c`), or null when the argument is computed at runtime. */
function constantString(arg) {
  const parts = [];
  let i = 0;
  const a = arg.trim();
  while (i < a.length) {
    const q = a[i];
    if (!"\"'`".includes(q)) return null;
    const end = skipString(a, i);
    const lit = a.slice(i, end + 1);
    if (q === "`" && lit.includes("${")) return null;
    try {
      parts.push(new Function(`return ${lit}`)());
    } catch {
      return null;
    }
    i = end + 1;
    while (a[i] === " " || a[i] === "\n") i++;
    if (i < a.length) {
      if (a[i] !== "+") return null;
      i++;
      while (a[i] === " " || a[i] === "\n") i++;
    }
  }
  return parts.length ? parts.join("") : null;
}

/** Feedback strings in a source text: { kind: 'fail' | 'pass', msg } plus a count of computed ones. */
export function feedbackIn(src) {
  const found = [];
  let dynamic = 0;
  for (const m of src.matchAll(/\bapi\.(fail|pass)\s*\(|\bmkfeed\s*\(/g)) {
    const args = readArgs(src, m.index + m[0].length - 1);
    const isMk = m[0].startsWith("mkfeed");
    const msgArg = isMk ? args[1] : args[0];
    if (msgArg == null) continue;
    const msg = constantString(msgArg);
    if (msg == null) dynamic++;
    else
      found.push({ kind: isMk ? (/true\s*$/.test(args[2] || "") ? "pass" : "fail") : m[1], msg });
  }
  return { found, dynamic };
}

function bootBook(html) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => errors.push(String(e.message || e)));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "http://localhost/graphic-novels/axiom-city/book.html",
    virtualConsole,
    beforeParse(w) {
      // One page per view: the layout the phone uses renders every page through #pageL.
      w.matchMedia = (q) => ({
        matches: /max-width:\s*820px/.test(q),
        media: q,
        addEventListener() {},
        removeEventListener() {},
      });
    },
  });
  return { dom, errors };
}

/**
 * @param {string} file  absolute path of a book
 * @returns {{ items: {id,kind,key,html}[], stats: object }}
 */
export function extractBook(file) {
  const html = readFileSync(file, "utf8");
  const { dom, errors } = bootBook(html);
  const w = dom.window;
  const doc = w.document;
  const items = [];
  const seen = new Map();
  const add = (id, kind, d) => {
    if (!d) return;
    if (seen.has(d.key)) {
      seen.get(d.key).count++;
      return;
    }
    const item = { id, kind, key: d.key, html: d.html, count: 1 };
    seen.set(d.key, item);
    items.push(item);
  };
  const kindOf = (el) =>
    el.closest(".balloon") === el
      ? "balloon"
      : el.matches(".caption")
        ? "caption"
        : el.matches(".gateprompt")
          ? "gate-prompt"
          : el.matches(".gatehint")
            ? "hint"
            : el.closest("#workedBody")
              ? "worked"
              : "text";
  const counters = {};
  const nameFor = (prefix, kind) =>
    `${prefix}.${kind}${(counters[`${prefix}.${kind}`] = (counters[`${prefix}.${kind}`] || 0) + 1)}`;
  const collect = (rootEl, prefix, idFor) => {
    for (const d of layer.collectLeaves(rootEl))
      add(idFor ? idFor(d.el) : nameFor(prefix, kindOf(d.el)), kindOf(d.el), d);
  };

  const pageCount = w.eval("PAGES.length");
  const gateIds = Object.keys(w.eval("GATES"));
  for (let i = 0; i < pageCount; i++) {
    w.eval(`page=${i};renderSpread()`);
    const L = doc.getElementById("pageL");
    for (const el of L.querySelectorAll(".gatemount")) el.dataset.pageGate = el.dataset.gate;
    collect(L, `p${i + 1}`, (el) => {
      const gate = el.closest("[data-page-gate]")?.dataset.pageGate;
      return gate && el.matches(".gateprompt")
        ? `${gate}.prompt`
        : nameFor(gate || `p${i + 1}`, kindOf(el));
    });
    for (const gate of L.querySelectorAll(".gatemount[data-gate]")) {
      // Press CHECK with empty inputs: the engine itself shows hint 1, then hint 2.
      for (const n of [1, 2]) {
        try {
          gate.querySelector(".gatecheck")?.click();
        } catch {
          /* a checker that cannot run empty has no hint to read */
        }
        const hint = gate.querySelector(".gatehint:not([hidden])");
        if (hint) add(`${gate.dataset.gate}.hint${n}`, "hint", layer.describe(hint));
      }
    }
  }
  for (const id of gateIds) {
    w.eval(`openWorked(GATES[${JSON.stringify(id)}])`);
    collect(doc.getElementById("workedBody"), id, () => nameFor(`${id}.worked`, "step"));
  }
  const bodies = [...doc.querySelectorAll("script:not([src])")].map((s) => s.textContent);
  let dynamic = 0;
  const addFeedback = (prefix, src) => {
    const { found, dynamic: dyn } = feedbackIn(src);
    dynamic += dyn;
    for (const f of found) {
      const el = doc.createElement("div");
      if (f.kind === "fail") {
        el.className = "gatefeedback";
        el.textContent = f.msg;
      } else {
        el.className = "gatesolved";
        el.innerHTML = `<span class="stamp">SOLVED</span> ${f.msg}`;
      }
      add(nameFor(prefix, f.kind), `feedback-${f.kind}`, layer.describe(el));
    }
  };
  for (const id of gateIds) addFeedback(id, String(w.eval(`GATES[${JSON.stringify(id)}].render`)));
  addFeedback("ui", bodies.find((b) => b.includes("AXIOM CITY ENGINE")) || "");
  dom.window.close();
  const byKind = {};
  for (const it of items) byKind[it.kind] = (byKind[it.kind] || 0) + 1;
  return {
    items,
    stats: {
      pages: pageCount,
      gates: gateIds.length,
      total: items.length,
      byKind,
      dynamicFeedback: dynamic,
      scriptErrors: errors.length,
    },
  };
}
