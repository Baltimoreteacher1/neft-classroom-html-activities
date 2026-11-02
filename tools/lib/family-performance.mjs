// Weight, handler and request budgets for the family homework pages: pure functions over a
// page's HTML, so the same code measures the shipped pages and the self-test fixtures.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const gz = (text) => gzipSync(text).length;
const stripCode = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");

// Attribute NAMES of every start tag; quoted values (which may say "on ... =") are skipped.
const TAG =
  /<[a-zA-Z][^\s/>]*((?:\s+[^\s=>"'/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?)*)\s*\/?>/g;
function attributeNames(html) {
  const names = [];
  for (const tag of stripCode(html).matchAll(TAG))
    for (const a of tag[1].matchAll(/\s+([^\s=>"'/]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?/g))
      names.push(a[1].toLowerCase());
  return names;
}

/** Inline `on*=` attributes in markup (script and style bodies are not markup). */
export const countInlineHandlers = (html) =>
  attributeNames(html).filter((n) => /^on[a-z]+$/.test(n)).length;

/** Delegated action attributes: the replacement for inline handlers, reported so it cannot grow unseen. */
export const countActions = (html) =>
  attributeNames(html).filter((n) => /^data-act(-[a-z]+)?$/.test(n)).length;

/** Anything the page would fetch from another origin. Canonical and Open Graph metadata are not fetches. */
export function externalRequests(html) {
  const out = [];
  // Inline script and style bodies are code, but a `<script src>` tag is a fetch: keep its tag.
  const markup = html.replace(
    /<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,
    "",
  );
  for (const m of markup.matchAll(
    /<(link|script|img|iframe|source|video|audio)\b[^>]*?\s(?:href|src)\s*=\s*"(https?:)?\/\/([^"]+)"/gi,
  )) {
    if (/rel="(canonical|alternate|preconnect)"/i.test(m[0])) continue;
    out.push(`${m[1]} ${(m[2] || "https:") + "//" + m[3]}`.slice(0, 90));
  }
  return out;
}

/** Local files the page links, split into render-blocking CSS and scripts. */
export function linkedFiles(html) {
  const css = [];
  const js = [];
  for (const m of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)) {
    const href = m[0].match(/href="([^"]+)"/)?.[1];
    if (href?.startsWith("/") && !/media="print"/.test(m[0])) css.push(href.split("?")[0]);
  }
  for (const m of html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"[^>]*>/gi))
    if (m[1].startsWith("/")) js.push(m[1].split("?")[0]);
  return { css, js };
}

/** Everything measured about one page. `read(path)` returns a served file's text or null. */
export function measurePage(html, read) {
  const { css, js } = linkedFiles(html);
  const sizeOf = (paths) => paths.reduce((n, p) => n + gz(read(p) ?? ""), 0);
  const missing = [...css, ...js].filter(
    (p) => p.startsWith("/assets/homework/") && read(p) == null,
  );
  const unhashed = [...css, ...js].filter(
    (p) => p.startsWith("/assets/homework/") && !/-[0-9a-f]{10}\.(css|js|bundle\.js)$/.test(p),
  );
  const htmlGzip = gz(html);
  const cssGzip = sizeOf(css);
  return {
    inlineHandlers: countInlineHandlers(html),
    actions: countActions(html),
    htmlGzip,
    cssGzip,
    // A cold first view paints from the document and its stylesheets; scripts are budgeted apart.
    firstViewGzip: htmlGzip + cssGzip,
    scriptGzip: sizeOf(js),
    external: externalRequests(html),
    missing,
    unhashed,
  };
}

export const readServed = (root) => (path) => {
  const file = join(root, path.split("?")[0]);
  return existsSync(file) ? readFileSync(file, "utf8") : null;
};
