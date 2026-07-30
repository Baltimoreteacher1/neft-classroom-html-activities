// The lesson surfaces are a LIGHT-ONLY product.
//
// `engine/core/small-group-ui.js` says so out loud — it pins
// `:root[data-theme="dark"]{color-scheme:light}` — and the page chrome never
// responds to the OS colour scheme: the body stays cream in dark mode.
//
// Nine shared components had nonetheless grown an
// `@media (prefers-color-scheme: dark)` block. On a student's Chromebook with
// dark mode on, each of those turned itself into a black island on a cream
// page, and two of them broke outright:
//
//   • `.dlive` (data-live charts) flipped its panel to #182226 while the SVG
//     inside kept `var(--ink,#333)` and `var(--navy,#264653)` for the bar
//     values and axis labels — roughly 1.1:1 contrast. The "Doorway vs Cabinet"
//     chart in lessons/4-6-group1 was reported as unreadable; 60 small-group
//     lessons render a data-live chart.
//   • `.regen-choice`, `.sanno-btn`, `.vexp-chip` set near-white text on a
//     translucent dark fill that still sat on a WHITE panel — the same failure
//     in the other direction.
//
// Neither is visible to a developer whose OS is in light mode, and no other
// gate looks at colour scheme, so this test is the guard: the fix is only one
// grep away from being undone by the next component that copies the pattern.
//
// If a genuine dark theme is ever wanted here, opt into it with
// `:root[data-theme="dark"]` (which go-deeper and facilitation-rhythm already
// use) and restyle the SVG contents too — do not key it off the OS preference.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const engineDir = dirname(fileURLToPath(import.meta.url));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(js|mjs|css)$/.test(name)) out.push(full);
  }
  return out;
}

const self = fileURLToPath(import.meta.url);
const offenders = [];
for (const file of walk(engineDir)) {
  if (file === self) continue; // this file quotes the pattern on purpose
  const src = readFileSync(file, "utf8");
  if (/@media[^{]*prefers-color-scheme\s*:\s*dark/i.test(src)) {
    offenders.push(relative(engineDir, file));
  }
}

if (offenders.length) {
  console.error(
    "FAIL: the lesson surfaces are light-only, but these ship an OS dark-mode override:\n" +
      offenders.map((f) => "  engine/" + f).join("\n") +
      "\n\nA dark block here makes the component a black island on a cream page, and any\n" +
      "SVG or text it does not also restyle drops to unreadable contrast. Use\n" +
      ':root[data-theme="dark"] if a real opt-in theme is wanted.',
  );
  process.exit(1);
}

// ── Figure colours must not ride on the theme tokens ──
//
// The second half of the same bug. `.sg-lab` deliberately remaps the generic
// palette onto the small-group accent (--teal becomes var(--sg)), which is
// correct for chrome. But the chart modules used those same tokens to encode
// DATA, so inside a small-group lesson every bar, dot and box came out in the
// group's navy, and tapeDiagramSVG's four-colour palette — whose first entry
// was --teal and last was --navy — collapsed into two shades of one blue, so a
// student could not tell the parts apart. Colour that carries meaning has to be
// fixed at the figure, not inherited from whatever scope it is dropped into.
const FIGURE_MODULES = [
  "core/visual-figures.js",
  "components/data-live.js",
  "components/scenario-sim.js",
  "components/algebra-tiles-expand.js",
];
// Only the SERIES colours are forbidden here. `var(--navy)` is still used for
// label ink, which stays dark-on-white under either remapping and is fine.
const THEME_IN_PAINT = /(?:fill|stroke)\s*=\s*"?\$?\{?\s*var\(--(?:teal|coral|amber)\b/i;
for (const rel of FIGURE_MODULES) {
  const src = readFileSync(join(engineDir, rel), "utf8");
  for (const [i, line] of src.split("\n").entries()) {
    if (THEME_IN_PAINT.test(line)) {
      console.error(
        `FAIL: engine/${rel}:${i + 1} paints a figure with a theme token.\n` +
          "  Data colour must come from this module's own palette (DATA_1…DATA_4);\n" +
          "  theme tokens are remapped per surface and collapse the series together.",
      );
      process.exit(1);
    }
  }
}

// Gates that cannot fail are not gates: prove both detectors still fire.
const PROBE = "@media (prefers-color-scheme:dark){.x{background:#000}}";
if (!/@media[^{]*prefers-color-scheme\s*:\s*dark/i.test(PROBE)) {
  console.error("FAIL: self-test — the dark-mode detector no longer matches a known offender.");
  process.exit(1);
}
if (!THEME_IN_PAINT.test('fill="var(--teal,#2a9d8f)"')) {
  console.error("FAIL: self-test — the theme-token-in-paint detector no longer matches.");
  process.exit(1);
}

console.log(
  `Light-only surfaces: no OS dark-mode overrides in engine/ (${walk(engineDir).length} files scanned), ` +
    "and figure colours are pinned to their own data palette.",
);
