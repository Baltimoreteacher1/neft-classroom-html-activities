// Loads every content file for the front layer. Shape is validated by tools/lp/check.mjs (G-07), not here.
import fs from "node:fs";
import path from "node:path";
import { CLUSTERS, DOMAINS } from "./util.mjs";

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

export const AREAS = [
  { slug: "math", label: "Math", eld: "ELD-MA", icon: "chart" },
  { slug: "science", label: "Science", eld: "ELD-SC", icon: "beaker" },
  { slug: "ela", label: "English Language Arts", eld: "ELD-LA", icon: "book" },
  { slug: "social-studies", label: "Social Studies", eld: "ELD-SS", icon: "globe" },
];

export function loadData(root) {
  const base = path.join(root, "tools/lp/data");
  const i18n = readJson(path.join(base, "i18n.json"));
  const practice = [];
  for (const c of CLUSTERS)
    for (const d of DOMAINS) {
      const file = path.join(base, "practice", c.slug, `${d.slug}.json`);
      if (!fs.existsSync(file)) continue;
      const doc = readJson(file);
      for (const set of doc.sets || [])
        practice.push({ ...set, cluster: c.slug, domain: d.slug, file: path.relative(root, file) });
    }
  const units = [];
  for (const a of AREAS) {
    const dir = path.join(base, "content", a.slug);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs
      .readdirSync(dir)
      .filter((n) => n.endsWith(".json"))
      .sort()) {
      const u = readJson(path.join(dir, f));
      units.push({ ...u, file: path.relative(root, path.join(dir, f)) });
    }
  }
  units.sort(
    (a, b) => a.area.localeCompare(b.area) || a.grade - b.grade || a.title.localeCompare(b.title),
  );
  const tools = readJson(path.join(base, "tools.json"));
  const banks = readJson(path.join(base, "phrase-banks.json"));
  const updates = readJson(path.join(base, "updates.json"));
  return { i18n, practice, units, tools, banks, updates };
}
