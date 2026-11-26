// Static checks of the HTML files in a resource package: which references leave the package (offline claim) and
// which stay inside it but point at nothing. Regex based on purpose: no DOM, so it runs in the browser, in Node and in
// a worker. It reads the markup, the <style> blocks and the executable scripts; JSON data blocks are text, not code.

const NAMESPACES = new Set([
  "http://www.w3.org/2000/svg",
  "http://www.w3.org/1999/xhtml",
  "http://www.w3.org/1999/xlink",
  "http://www.w3.org/1998/Math/MathML",
]);
const REMOTE = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;
const ATTR =
  /\s(src|href|poster|action|formaction|data|srcset|cite|ping|background|manifest|longdesc)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
const NETWORK_API =
  /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts)\s*\(|new\s+(?:XMLHttpRequest|WebSocket|EventSource)\b/;

const decode = (s) =>
  s.replace(
    /&(amp|lt|gt|quot|#39|#x27);/g,
    (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" })[e],
  );

/** posix path of `ref` relative to the file `from`, or null when it climbs out of the package. */
export function resolveRef(from, ref) {
  const clean = decodeURI(ref.split("#")[0].split("?")[0]);
  const parts = clean.startsWith("/") ? [] : from.split("/").slice(0, -1);
  for (const seg of clean.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else parts.push(seg);
  }
  return parts.join("/");
}

function judge(file, url, kind, exists, out) {
  const ref = decode(url).trim();
  if (!ref || ref.startsWith("#")) return;
  if (/^(data|blob|about):/i.test(ref)) return;
  if (/^(mailto|tel):/i.test(ref)) return;
  if (/^javascript:/i.test(ref))
    return void out.offenders.push({ file, url: ref.slice(0, 80), kind: "javascript-url" });
  if (REMOTE.test(ref)) return void out.offenders.push({ file, url: ref, kind });
  if (/^[a-z][a-z0-9+.-]*:/i.test(ref))
    return void out.offenders.push({ file, url: ref, kind: "unknown-scheme" });
  if (ref.startsWith("/")) return void out.missing.push({ file, ref, reason: "root-relative" });
  const target = resolveRef(file, ref);
  if (target === null) return void out.missing.push({ file, ref, reason: "outside-package" });
  out.links.push({ file, ref, target });
  if (!target || !exists(target)) out.missing.push({ file, ref, reason: "not-in-package" });
}

/**
 * @param {string} file path of the HTML file inside the package
 * @param {string} html its text
 * @param {(path: string) => boolean} exists whether a path is in the package
 * @returns {{offenders: Array<{file,url,kind}>, missing: Array<{file,ref,reason}>, links: Array<{file,ref,target}>}}
 */
export function scanHtml(file, html, exists) {
  const out = { offenders: [], missing: [], links: [] };
  const scripts = [];
  const markup = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_, attrs, body) => {
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase() ?? "";
    if (!type || /javascript|ecmascript|module/.test(type)) scripts.push(body);
    return `<script${attrs}></script>`;
  });
  const styles = [];
  const bare = markup.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    styles.push(css);
    return "";
  });
  for (const m of bare.matchAll(ATTR)) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (name === "srcset")
      for (const part of value.split(","))
        judge(file, part.trim().split(/\s+/)[0] ?? "", "attribute:srcset", exists, out);
    else judge(file, value, `attribute:${name}`, exists, out);
  }
  for (const m of bare.matchAll(
    /<meta\b[^>]*http-equiv\s*=\s*["']?refresh[^>]*content\s*=\s*"([^"]*)"/gi,
  )) {
    const u = /url\s*=\s*(.+)$/i.exec(m[1]);
    if (u) judge(file, u[1].replace(/^['"]|['"]$/g, ""), "meta-refresh", exists, out);
  }
  const css = [
    ...styles,
    ...[...bare.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)].map((m) => decode(m[1])),
  ].join("\n");
  for (const m of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))
    judge(file, m[2], "css-url", exists, out);
  for (const m of css.matchAll(/@import\s+(?:url\(\s*)?['"]?([^'")\s;]+)/gi))
    judge(file, m[1], "css-import", exists, out);
  for (const body of scripts) {
    for (const m of body.matchAll(/https?:\/\/[^\s"'`<>)\\]+/gi))
      if (!NAMESPACES.has(m[0].replace(/[.,;]+$/, "")))
        out.offenders.push({ file, url: m[0], kind: "script-url" });
    const api = NETWORK_API.exec(body);
    if (api) out.offenders.push({ file, url: api[0], kind: "network-api" });
  }
  return out;
}

/** Visible text of an HTML document, for leak checks: tags removed, entities decoded, whitespace collapsed. */
export const htmlText = (html) =>
  decode(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .toLowerCase();
