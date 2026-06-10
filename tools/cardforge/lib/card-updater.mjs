// Card resource updater. Given a staged bundle, computes the five lesson-card
// buttons (Student Lesson, Printable Packet, Activity Pack, Emergency Sub Plan,
// Interactive Practice), checks for an existing matching live lesson, and
// writes an idempotent before/after report + a button manifest.
//
// Safety: by default this does NOT mutate live curriculum cards (demo/staged
// bundles must not appear on live cards). The report documents exactly what
// would change; promoting to live is the deliberate publish step.
import { resolve } from "node:path";
import { existsSync, readJSON, writeFile, writeJSON, REPO_ROOT } from "./util.mjs";

const BUTTON_DEFS = [
  ["studentLesson", "Student Lesson", "student-practice.md"],
  ["printablePacket", "Printable Packet", "sub-packet.html"],
  ["activityPack", "Activity Pack", "activity-pack.html"],
  ["subPlan", "Emergency Sub Plan", "sub-packet.html"],
  ["interactive", "Interactive Practice", "interactive.html"],
];

export function updateCard(pkgDir) {
  const dir = resolve(pkgDir);
  if (!existsSync(resolve(dir, "card.json"))) {
    return { ok: false, message: `No card.json in ${dir}` };
  }
  const card = readJSON(resolve(dir, "card.json"));

  // Where the bundle would live once published.
  const livePath = card.unit != null && card.lesson != null && card.lesson !== "demo"
    ? `/lessons/${card.unit}-${card.lesson}/bundle/`
    : `/math/card-builder/sample/`;

  const buttons = BUTTON_DEFS.map(([id, label, file]) => ({
    id, label, file,
    href: card.lesson === "demo" ? card.previewPath || livePath : livePath + file,
    present: !!(card.resources && card.resources[id]),
  }));

  // Match against the live manifest.
  const manifestPath = resolve(REPO_ROOT, "data/curriculum-manifest.json");
  let liveMatch = null;
  if (existsSync(manifestPath)) {
    const lessons = readJSON(manifestPath).lessons || [];
    const id = card.unit != null && card.lesson != null ? `${card.unit}-${card.lesson}` : null;
    liveMatch = id ? lessons.find((l) => l.id === id) || null : null;
  }

  const manifest = {
    card: card.id, title: card.title, demo: !!card.demo,
    liveLessonMatch: liveMatch ? liveMatch.id : null, livePath, buttons,
  };
  writeJSON(resolve(dir, "card-buttons.json"), manifest);

  const report = `# Card Update Report — ${card.title}

- **Card:** ${card.id}${card.demo ? " (demo — not applied to live cards)" : ""}
- **Matched live lesson:** ${liveMatch ? `\`${liveMatch.id}\` (${liveMatch.title})` : "none / staged-only"}
- **Live path (when published):** \`${livePath}\`

## Buttons (before → after)
| Button | File | In card.json now | Action |
| --- | --- | --- | --- |
${buttons.map((b) => `| ${b.label} | \`${b.file}\` | ${b.present ? "yes" : "no"} | ${b.present ? "keep (idempotent)" : "add"} |`).join("\n")}

${card.demo
  ? "> Demo bundle: no live card was modified. The buttons above are the proposed set; promoting them to a live card is the publish step (see LESSON_PRODUCT_FACTORY.md)."
  : "> To apply to the live card, run the publish step: author under `lessons/<unit>-<lesson>/`, add a `bundleResources` block, regenerate the manifest, validate, commit, push."}
`;
  writeFile(resolve(dir, "card-update-report.md"), report);

  return { ok: true, buttons, liveMatch: liveMatch && liveMatch.id, demo: !!card.demo, dir };
}
