// Regenerates sitemap.xml from the navigable catalog (data/catalog.json),
// merging a few always-include hub roots. Run after generate-catalog.mjs.
//   node scripts/generate-sitemap.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://neft-classroom-html-activities.pages.dev";

const cat = JSON.parse(readFileSync(join(root, "data", "catalog.json"), "utf8"));
const entries = Array.isArray(cat) ? cat : cat.entries || [];

// Always-include roots (hubs/landing) even if not in the catalog.
const roots = ["/", "/math/", "/directory/", "/personal/"];
const paths = new Set(roots);
for (const e of entries) if (e.path) paths.add(e.path);

const urls = [...paths].sort();
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (p) =>
        `  <url><loc>${BASE}${p}</loc><changefreq>monthly</changefreq></url>`,
    )
    .join("\n") +
  `\n</urlset>\n`;

writeFileSync(join(root, "sitemap.xml"), xml);
console.log(`Wrote sitemap.xml with ${urls.length} URLs.`);
