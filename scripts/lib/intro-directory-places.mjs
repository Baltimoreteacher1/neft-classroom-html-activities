// "Other places on the site" for the Site Directory, read from the lab's own code instead of retyped:
//   - the More menu groups exactly as src/nav.js renders them (navHTML), so the directory lists what the menu lists;
//   - the one-line descriptions the Site Guide already verified (site-guide-more.js AREAS);
//   - where each path is served, from functions/_lib/language-page.js (the lab host serves some paths and sends the
//     rest to eduwonderlab.com), so a printed link never points at a redirect it does not need.

import { makeI18n } from "../../access-practice-lab/src/i18n.js";
import { SITE } from "../../access-practice-lab/src/intro/data.js";
import { AREAS } from "../../access-practice-lab/src/intro/site-guide-more.js";
import { navHTML } from "../../access-practice-lab/src/nav.js";
import { toHtml } from "../../access-practice-lab/src/util.js";
import { languagePageRoute } from "../../functions/_lib/language-page.js";

const SKIP_GROUPS = new Set(["Go to", "This device"]);
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Public URL for a site path: the lab host when it serves the path, otherwise where it redirects. */
export function publicUrl(path) {
  const url = new URL(path, SITE.host);
  const r = languagePageRoute(url);
  return r?.kind === "redirect" && r.status === 308 ? r.location : url.toString();
}

const bare = (href) => href.replace(/\?grades=[^&#]*$/, "");
const describe = (path) =>
  AREAS.find((a) => `${SITE.base}${a.route}` === path || a.route === path)?.text || "";

/** [{ title, items: [{ label, path, url, short, note, gated }] }] from the rendered More menu (6-8 menu). */
export function otherPlaces() {
  const html = toHtml(navHTML({ band: "6-8", route: { view: "home" } }, makeI18n("en")));
  const groups = [];
  const seen = new Set();
  for (const g of html.matchAll(
    /<div class="menu-group[^"]*">\s*<h2>([^<]*)<\/h2>([\s\S]*?)<\/div>/g,
  )) {
    const title = decode(g[1]);
    if (SKIP_GROUPS.has(title)) continue;
    const items = [];
    for (const a of g[2].matchAll(/<a href="([^"]+)">[\s\S]*?<\/svg>([^<]*)<\/a>/g)) {
      const path = bare(decode(a[1]));
      if (seen.has(path)) continue;
      seen.add(path);
      const url = publicUrl(path);
      const gated = /teacher/i.test(path);
      items.push({
        label: decode(a[2]),
        path,
        url,
        short: url.replace(/^https:\/\//, ""),
        note: describe(path),
        gated,
      });
    }
    if (items.length) groups.push({ title, items });
  }
  // Site Guide areas the 6-8 menu does not list (Passport, Growth Map, the second links of an area).
  const extra = [];
  for (const a of AREAS) {
    for (const [route, label, note] of [
      [a.route, a.name, a.text],
      ...(a.second ? [[a.second.route, a.second.label, ""]] : []),
    ]) {
      const path = route.startsWith(SITE.base) || a.external ? route : `${SITE.base}${route}`;
      if (seen.has(path)) continue;
      seen.add(path);
      const url = publicUrl(path);
      extra.push({
        label,
        path,
        url,
        short: url.replace(/^https:\/\//, ""),
        note,
        gated: /teacher/i.test(path),
      });
    }
  }
  if (extra.length) groups.push({ title: "Also on the site", items: extra });
  if (!groups.length) throw new Error("intro-directory-places: the More menu rendered no groups");
  return groups;
}
