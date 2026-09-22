/**
 * Worksheet export — PDF and Word versions of the site's printable pages.
 *
 * Every practice worksheet on this site is an HTML page (worksheet.html,
 * worksheet-2.html, worksheet-level-0.html, practice.html, mstar-worksheet.html).
 * They print beautifully one at a time, but a teacher who wants "all of Unit 3's
 * practice" had to open and print ~30 tabs, and there was no editable copy at all.
 *
 * Two conversions live here, both pure string work so they can be unit-tested
 * without a browser (tools/worksheet-export.test.mjs runs them under jsdom):
 *
 *   printPackHtml() — stitches N worksheets into ONE document with a page break
 *     between each, then the browser's own print-to-PDF renders it. Fidelity is
 *     exact because it is the same engine that renders the worksheet normally;
 *     nothing is re-laid-out by a converter.
 *
 *   wordHtml() — one worksheet as a Word-compatible HTML document (.doc). Word,
 *     Google Docs and Pages all open it as an editable document.
 *
 * The one hard problem is CSS collision: each worksheet carries its own inline
 * stylesheet, all three families style `:root`, `body` and overlapping `.ws-*`
 * class names. Stitching them raw would let the last sheet restyle the first.
 * scopeCss() rewrites each stylesheet so its rules can only reach inside that
 * worksheet's own wrapper.
 */

/** Runtime chrome that must never reach a printed page. */
const CHROME_SELECTORS = [
  "script",
  "noscript",
  "iframe",
  "link[rel='stylesheet']",
  ".topbar",
  ".ewl-topbar",
  "#save-resume-bar",
  ".save-resume-bar",
  ".sr-bar",
  ".mobile-access-bar",
  "[data-print-hide]",
  "[data-ewl-chrome]",
];

/** Stylesheets a worksheet page pulls in that the pack needs too. */
const SHARED_STYLESHEETS = ["/assets/fonts/worksheet-pages.css"];

/* ----------------------------------------------------------------- CSS */

/**
 * Strip comments, respecting string literals so a `/*` inside content: "" is
 * left alone.
 */
export function stripCssComments(css) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < css.length) {
    const ch = css[i];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += css[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** Split a selector list on top-level commas (commas inside :is()/[] are kept). */
function splitSelectorList(selector) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (quote) {
      current += ch;
      if (ch === "\\") {
        current += selector[i + 1] ?? "";
        i++;
      } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Rewrite one selector so it can only match inside `scope`.
 *
 * `:root`, `html` and `body` become the scope element itself — that is what
 * carries the worksheet's custom properties and page background once the sheet
 * is a section of a larger document rather than a whole page.
 */
function scopeSelector(selector, scope) {
  const sel = selector.trim();
  if (!sel) return "";
  if (sel === "*" || sel === ":root" || sel === "html" || sel === "body") {
    return sel === "*" ? `${scope}, ${scope} *` : scope;
  }
  const rooted = /^(?::root|html|body)(?![\w-])([\s\S]*)$/.exec(sel);
  if (rooted) {
    const rest = rooted[1].trim().replace(/^[>+~]\s*/, (m) => `${m} `);
    return rest ? `${scope} ${rest}` : scope;
  }
  return `${scope} ${sel}`;
}

/** At-rules whose body is a list of style rules and so must be scoped too. */
const NESTING_AT_RULES = /^@(media|supports|layer|container|document)\b/i;
/** At-rules whose body is NOT selectors — copied through untouched. */
const OPAQUE_AT_RULES =
  /^@(font-face|keyframes|-\w+-keyframes|page|property|counter-style|viewport)\b/i;

/**
 * Prefix every selector in `css` with `scope`.
 *
 * `@page` is dropped: in a combined pack the pack owns page geometry, and a
 * worksheet's own `@page` would silently win or lose depending on order.
 */
export function scopeCss(css, scope, { keepPageRules = false } = {}) {
  const source = stripCssComments(String(css || ""));
  let out = "";
  let i = 0;

  const readBlock = (start) => {
    let depth = 0;
    let quote = null;
    for (let j = start; j < source.length; j++) {
      const ch = source[j];
      if (quote) {
        if (ch === "\\") j++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return j;
      }
    }
    return source.length - 1;
  };

  while (i < source.length) {
    const brace = source.indexOf("{", i);
    if (brace === -1) break;
    const prelude = source.slice(i, brace).trim();

    // An at-rule with no block (@charset, @import) ends at its semicolon.
    const semi = source.indexOf(";", i);
    if (prelude.startsWith("@") && semi !== -1 && semi < brace) {
      i = semi + 1;
      continue;
    }

    const end = readBlock(brace);
    const body = source.slice(brace + 1, end);

    if (prelude.startsWith("@")) {
      if (NESTING_AT_RULES.test(prelude)) {
        out += `${prelude}{${scopeCss(body, scope, { keepPageRules })}}`;
      } else if (OPAQUE_AT_RULES.test(prelude)) {
        if (!/^@page\b/i.test(prelude) || keepPageRules) out += `${prelude}{${body}}`;
      }
      // Anything else at-rule-shaped is dropped rather than guessed at.
    } else {
      const selectors = splitSelectorList(prelude)
        .map((s) => scopeSelector(s, scope))
        .filter(Boolean);
      if (selectors.length) out += `${selectors.join(",")}{${body}}`;
    }
    i = end + 1;
  }
  return out;
}

/* ------------------------------------------------------------- parsing */

export const esc = (value) =>
  String(value == null ? "" : value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/**
 * Pull the printable part of a worksheet page out of its HTML.
 *
 * @param {string} html   the page source
 * @param {object} meta   { url, title, lessonTitle, typeLabel }
 * @param {Document} doc  a Document to parse with (window.document in the browser)
 * @returns {{ title: string, css: string, body: string, url: string }}
 */
export function parseWorksheet(html, meta = {}, parser = new DOMParser()) {
  const parsed = parser.parseFromString(String(html || ""), "text/html");
  const css = [...parsed.querySelectorAll("style")].map((el) => el.textContent || "").join("\n");

  const root = parsed.querySelector("main") || parsed.body;
  if (!root) throw new Error("no printable content");
  for (const el of root.querySelectorAll(CHROME_SELECTORS.join(","))) el.remove();

  const title =
    meta.title ||
    (parsed.querySelector("title")?.textContent || "").trim() ||
    meta.lessonTitle ||
    "Worksheet";

  return { title, css, body: root.innerHTML, url: meta.url || "" };
}

/* ----------------------------------------------------------- print pack */

const PACK_CHROME_CSS = `
  @page { size: Letter; margin: 0.4in 0.45in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e9edf2; }
  body { font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: #14223a; }
  .wsx-toolbar {
    position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; gap: 12px;
    align-items: center; justify-content: space-between;
    padding: 12px clamp(12px, 3vw, 28px); background: #15487f; color: #fff;
  }
  .wsx-toolbar p { margin: 0; font-size: 14px; }
  .wsx-toolbar strong { display: block; font-size: 16px; }
  .wsx-print {
    font: inherit; font-weight: 700; cursor: pointer; min-height: 44px;
    padding: 10px 20px; border: 0; border-radius: 8px; background: #ffd479; color: #15487f;
  }
  .wsx-print:hover { background: #ffe1a1; }
  .wsx-sheet {
    background: #fff; max-width: 8.5in; margin: 18px auto; padding: 0.45in 0.5in 0.55in;
    border: 1px solid #d6e0ec; box-shadow: 0 6px 24px rgba(15, 23, 42, 0.1);
  }
  .wsx-sheet + .wsx-sheet { break-before: page; page-break-before: always; }
  .wsx-label {
    font: 700 11px/1.4 system-ui, sans-serif; letter-spacing: 0.08em; text-transform: uppercase;
    color: #56627a; margin: 0 0 10px;
  }
  @media print {
    html, body { background: #fff; }
    .wsx-toolbar { display: none !important; }
    .wsx-sheet { margin: 0; padding: 0; border: 0; box-shadow: none; max-width: none; }
  }
`;

/**
 * One document holding every selected worksheet, ready for the browser's
 * "Save as PDF". Each sheet keeps its own stylesheet, scoped to its own wrapper.
 *
 * @param {Array<{title: string, css: string, body: string}>} sheets
 * @param {{ title?: string, subtitle?: string, autoPrint?: boolean }} options
 */
export function printPackHtml(sheets, options = {}) {
  const list = Array.isArray(sheets) ? sheets : [];
  const title = options.title || "Practice worksheets";
  const scopedCss = list.map((sheet, index) => scopeCss(sheet.css, `#wsx-${index + 1}`)).join("\n");
  const body = list
    .map(
      (sheet, index) => `
      <section class="wsx-sheet" id="wsx-${index + 1}">
        <p class="wsx-label">${esc(sheet.title)}</p>
        ${sheet.body}
      </section>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base href="${esc(options.baseHref || "/")}" />
<title>${esc(title)}</title>
${SHARED_STYLESHEETS.map((href) => `<link rel="stylesheet" href="${esc(href)}" />`).join("\n")}
<style>${PACK_CHROME_CSS}</style>
<style>${scopedCss}</style>
</head>
<body>
<div class="wsx-toolbar">
  <p><strong>${esc(title)}</strong>${esc(
    options.subtitle || `${list.length} worksheet${list.length === 1 ? "" : "s"} · one PDF`,
  )}</p>
  <button type="button" class="wsx-print" onclick="window.print()">🖨️ Save as PDF</button>
</div>
${body}
<script>
  window.addEventListener("load", function () {
    // Wait for the worksheet webfonts: printing before they land reflows the
    // page and pushes the last question of each sheet onto a stray page.
    var ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(function () { setTimeout(function () { window.print(); }, 250); });
  });
</script>
</body>
</html>`;
}

/* ----------------------------------------------------------------- Word */

/** Walk top-level style rules, descending into @media/@supports blocks. */
function forEachStyleRule(css, visit) {
  const source = stripCssComments(String(css || ""));
  let i = 0;
  while (i < source.length) {
    const brace = source.indexOf("{", i);
    if (brace === -1) return;
    const prelude = source.slice(i, brace).trim();
    const semi = source.indexOf(";", i);
    if (prelude.startsWith("@") && semi !== -1 && semi < brace) {
      i = semi + 1;
      continue;
    }
    let depth = 0;
    let end = source.length - 1;
    for (let j = brace; j < source.length; j++) {
      if (source[j] === "{") depth++;
      else if (source[j] === "}" && --depth === 0) {
        end = j;
        break;
      }
    }
    const body = source.slice(brace + 1, end);
    if (prelude.startsWith("@")) {
      if (NESTING_AT_RULES.test(prelude)) forEachStyleRule(body, visit);
    } else {
      visit(prelude, body);
    }
    i = end + 1;
  }
}

/** The class name a selector ends on, e.g. `.ws-block .ws-block-title` → ws-block-title. */
function trailingClass(selector) {
  const match = /\.([\w-]+)(?:::?[\w-()]+)?\s*$/.exec(selector.trim());
  return match ? match[1] : null;
}

/**
 * Word's HTML engine honours `display` only on block-level TAGS: a `<span>` the
 * stylesheet lays out as a block, and the children of a flex row, both collapse
 * into the run of text beside them ("Start hereWords for this lesson"). Read the
 * stylesheet for which classes those are rather than keeping a list of names
 * that a generator change would silently invalidate.
 */
function layoutClasses(css) {
  const block = new Set();
  const container = new Set();
  const underline = new Set();
  const inlineBlock = new Set();
  /** class -> literal text a ::before / ::after prints, which Word never draws. */
  const pseudo = new Map();
  forEachStyleRule(css, (prelude, body) => {
    const display = /display\s*:\s*([\w-]+)/.exec(body)?.[1];
    const isContainer = display === "flex" || display === "grid";
    const isBlock = isContainer || display === "block" || display === "list-item";
    const rule = /border-bottom\s*:\s*([^;}]+)/.exec(body)?.[1];
    const hasRule = Boolean(rule) && !/^\s*(0\b|none\b)/.test(rule);
    const content = /content\s*:\s*(["'])([^"']*)\1/.exec(body)?.[2];
    for (const selector of splitSelectorList(prelude)) {
      const trimmed = selector.trim();
      const side = /::?(before|after)\s*$/.exec(trimmed)?.[1];
      const name = trailingClass(trimmed);
      if (!name) continue;
      if (side) {
        if (content) pseudo.set(`${name}|${side}`, content);
        continue;
      }
      if (isBlock) block.add(name);
      if (isContainer) container.add(name);
      if (hasRule) underline.add(name);
      if (display === "inline-block") inlineBlock.add(name);
    }
  });
  return { block, container, underline, inlineBlock, pseudo };
}

/** A ruled blank Word can actually draw: underscores, not a zero-height border. */
function blankRun(el) {
  const width = Number(/width\s*:\s*(\d+)/.exec(el.getAttribute("style") || "")?.[1] || 0);
  const count = Math.max(8, Math.min(60, Math.round((width || 150) / 7)));
  return "_".repeat(count);
}

/**
 * Rewrite a worksheet body into markup Word lays out correctly.
 *
 * Both transforms are driven by the worksheet's OWN stylesheet, so they keep
 * working when a generator renames a class.
 */
function normalizeForWord(bodyHtml, css, parser) {
  const doc = parser.parseFromString(`<body>${bodyHtml}</body>`, "text/html");
  const { block, container, underline, inlineBlock, pseudo } = layoutClasses(css);
  const root = doc.body;
  const classesOf = (el) => (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);

  // Deepest node first: rewriting a parent re-creates its subtree, so a child
  // handled afterwards would be edited in a tree nobody is holding any more.
  for (const el of [...root.querySelectorAll("*")].reverse()) {
    const classes = classesOf(el);
    for (const side of ["before", "after"]) {
      const text = classes.map((c) => pseudo.get(`${c}|${side}`)).find(Boolean);
      if (!text) continue;
      const node = doc.createTextNode(text);
      if (side === "before") el.prepend(node);
      else el.append(node);
    }
    // An empty element whose only job was to draw a rule.
    if (!el.textContent.trim() && !el.children.length && classes.some((c) => underline.has(c))) {
      el.replaceWith(doc.createTextNode(` ${blankRun(el)} `));
      continue;
    }
    // Word drops padding and margins on an inline-block, so a pill badge ends
    // up welded to the sentence after it ("Same stepsFinish what the group…").
    if (classes.some((c) => inlineBlock.has(c))) {
      const before = el.previousSibling?.textContent ?? "";
      const after = el.nextSibling?.textContent ?? "";
      if (before && !/\s$/.test(before)) el.before(doc.createTextNode(" "));
      if (after && !/^\s/.test(after)) el.after(doc.createTextNode(" "));
    }

    if (el.tagName !== "SPAN") continue;
    const parentClasses = el.parentElement ? classesOf(el.parentElement) : [];
    const needsBlock =
      classes.some((c) => block.has(c)) || parentClasses.some((c) => container.has(c));
    if (!needsBlock) continue;
    const div = doc.createElement("div");
    for (const attr of [...el.attributes]) div.setAttribute(attr.name, attr.value);
    div.innerHTML = el.innerHTML;
    el.replaceWith(div);
  }
  return root.innerHTML;
}

/**
 * A single worksheet as an editable Word document.
 *
 * Word renders HTML through its own legacy engine: custom properties, flex and
 * grid do nothing there, so the layout arrives as a clean vertical flow rather
 * than the printed grid. That is the right trade for the editable copy — the
 * teacher gets real, typed-over-able text they can change; the PDF pack is what
 * preserves the exact printed layout.
 */
export function wordHtml(sheet, options = {}) {
  const parser = options.parser || new DOMParser();
  const scoped = scopeCss(sheet.css, ".wsx-doc");
  const body = normalizeForWord(sheet.body, sheet.css, parser);
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<meta name="ProgId" content="Word.Document" />
<meta name="Generator" content="Neft Teacher — eduwonderlab.com" />
<title>${esc(sheet.title)}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument>
</xml><![endif]-->
<style>
@page WordSection1 { size: 8.5in 11.0in; margin: 0.6in; }
div.WordSection1 { page: WordSection1; }
body { font-family: "Calibri", "Segoe UI", sans-serif; font-size: 11pt; color: #19262f; }
table { border-collapse: collapse; }
${scoped}
/* Word ignores the custom properties the worksheet palette is built from, so
   anything coloured through one falls back to transparent-on-white. Restate the
   handful that carry meaning as literals. */
.wsx-doc { font-family: "Calibri", "Segoe UI", sans-serif; color: #19262f; }
.wsx-doc table { width: 100%; border-collapse: collapse; }
.wsx-doc th, .wsx-doc td { border: 1px solid #c9d2da; padding: 5pt 7pt; vertical-align: top; }
.wsx-doc h1 { font-size: 17pt; }
.wsx-doc h2 { font-size: 13pt; }
.wsx-doc h3 { font-size: 12pt; }
.wsx-source { font-size: 8pt; color: #56627a; }
</style>
</head>
<body>
<div class="WordSection1"><div class="wsx-doc">
${body}
${options.sourceUrl ? `<p class="wsx-source">${esc(options.sourceUrl)}</p>` : ""}
</div></div>
</body>
</html>`;
}
