// Prints a compact, reviewable view of one lesson's Practice and Challenge studios next to the canonical lesson, for the
// forensic audit (AUDIT_REPORT.md). One screen per lesson: what the lesson teaches and in what order, then every studio
// item (kind, generator or activity, a seeded sample stem, its choices and key, whether it carries a figure).
//   node scripts/audit/dump-studio.mjs 5-8
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessonConfig } from "../../tools/lib/curriculum-source.mjs";
import { loadStudio } from "../../tools/lib/studio-vm.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const id = process.argv[2];
if (!/^\d+-\d+$/.test(id || "")) {
  console.error("usage: node scripts/audit/dump-studio.mjs <lessonId>");
  process.exit(2);
}
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const cfg = loadLessonConfig(id);
const manifest = JSON.parse(read("data/curriculum-launch-manifest.json"));
const seq = manifest.lessons.filter(
  (l) => l.unit === cfg.unit || String(l.id).startsWith(`${id.split("-")[0]}-`),
);
const here = seq.findIndex((l) => l.id === id);
const clip = (s, n = 160) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .slice(0, n);

console.log(
  `# Lesson ${id}: ${cfg.title}  (standard ${cfg.standard || "?"}, unit ${id.split("-")[0]})`,
);
console.log(
  `position: lesson ${here + 1} of ${seq.length} in the unit. Earlier: ${
    seq
      .slice(Math.max(0, here - 3), here)
      .map((l) => `${l.id} ${l.title}`)
      .join(" | ") || "(first)"
  }. Later: ${
    seq
      .slice(here + 1, here + 4)
      .map((l) => `${l.id} ${l.title}`)
      .join(" | ") || "(last)"
  }`,
);
console.log(`objective: ${cfg.contentObjective || ""}`);
console.log(`vocabulary: ${(cfg.vocabulary || []).map((v) => v.term).join(", ")}`);
const ci = cfg.launch?.conceptIntro || {};
console.log(`key idea: ${clip(ci.keyIdea, 400)}`);
console.log(`watch me: ${clip((ci.iDo?.lines || []).join(" "), 500)}`);
console.log(
  `warm-up: ${(cfg.warmup?.questions || []).map((q) => clip(q.question || q.stem || q.q, 100)).join(" || ")}`,
);
const pr = cfg.practice || {};
console.log(
  `config practice items: ${Object.entries(pr)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}:${v.length}`)
    .join(" ")}`,
);
console.log(
  `config interactive tools: ${JSON.stringify([...(cfg.explore?.interactive ? [cfg.explore.interactive.kind] : []), ...(cfg.launch?.interactiveVisual ? [cfg.launch.interactiveVisual.kind] : [])])}`,
);

const ctx = loadStudio({ gen: true, act: true, viz: true });
for (const mode of ["practice", "challenge"]) {
  const rel = id.startsWith("4-")
    ? null
    : `math/practice-studio/${id}/${mode === "practice" ? "" : "challenge/"}index.html`;
  console.log(`\n## ${mode} studio ${rel || "(Unit 4 hand-built: /math/unit-4/...)"}`);
  if (!rel || !existsSync(join(ROOT, rel))) continue;
  const html = read(rel);
  const data = JSON.parse(/id="studio-data">([\s\S]*?)<\/script>/.exec(html)[1]);
  data.sections.forEach((s, si) => {
    console.log(`\n### §${si + 1} ${s.name} (${s.items.length} items): ${clip(s.h, 80)}`);
    s.items.forEach((it, ii) => {
      let line = `  ${si + 1}.${ii + 1} [${it.k}${it.g ? `:${it.g}` : ""}${it.kind ? `:${it.kind}` : ""}${it.level ? ` L${it.level}` : ""}]`;
      try {
        if (it.k === "gen") {
          const m = ctx.StudioGen.make(it.g, it.level, 7);
          line += ` sample: ${clip(m.q)}  ${m.c ? `choices=${JSON.stringify(m.c.map((c) => clip(c, 24)))} key=${m.a}` : `answer=${clip(m.a ?? m.ans, 30)}`}${m.viz ? ` viz=${m.viz.t}` : ""}`;
        } else if (it.k === "act") {
          line += ` params=${clip(JSON.stringify(it.p), 100)} title="${clip(ctx.StudioAct.registry[it.kind]?.title, 40)}"`;
        } else if (it.k === "pool") {
          line += " (pooled items)";
        } else {
          line += ` ${clip(it.q || it.t || it.p, 140)}${it.c ? `  choices=${JSON.stringify(it.c.map((c) => clip(c, 24)))} key=${it.a}` : ""}${it.viz ? ` viz=${it.viz.t}` : ""}`;
        }
      } catch (e) {
        line += ` (could not sample: ${e.message})`;
      }
      console.log(line);
    });
  });
}
