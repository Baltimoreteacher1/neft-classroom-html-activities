/**
 * Does a page's own `<meta name="robots">` say noindex?
 *
 * ONE copy, shared by the generator that must leave such pages OUT of
 * sitemap.xml (scripts/generate-sitemap.mjs) and the gate that must FAIL if one
 * gets in (tools/validate-seo.mjs). Two copies of this rule would be two
 * answers to "is this page indexable?", and the pair would stop agreeing
 * exactly when it mattered — the generator excluding a page the gate still
 * demanded, or the reverse.
 *
 * Only the document head is considered, and only a real robots meta tag. The
 * word "noindex" inside page copy, a code sample or a script string is not a
 * directive, and treating it as one would silently drop a legitimate page out
 * of the sitemap.
 */

/* Enough for any real <head> on this site; the largest is well under 4 KB. A
   bound matters: without one, "noindex" written far down in page copy would be
   read as a directive. */
export const HEAD_BYTES = 8000;

/** The `<meta name="robots">` content value, or null. Head only. */
export function robotsMeta(html) {
  const head = String(html ?? "").slice(0, HEAD_BYTES);
  const tag = head.match(/<meta[^>]+name=["']?robots["']?[^>]*>/i);
  if (!tag) return null;
  const content = tag[0].match(/content=["']([^"']*)["']/i);
  return content ? content[1] : "";
}

/** True when that value asks search engines not to index the page. */
export function robotsMetaNoindex(html) {
  const value = robotsMeta(html);
  return value == null ? false : /\bnoindex\b/i.test(value);
}
