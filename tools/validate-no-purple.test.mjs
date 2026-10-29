import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  collectHubFiles,
  findForbiddenPaints,
  hasForbiddenPixels,
  scanChangedText,
  scanDist,
  scanHubFiles,
  scanSourceDocs,
} from "./validate-no-purple.mjs";

const root = mkdtempSync(join(tmpdir(), "no-purple-"));
const put = (name, body) => {
  const path = join(root, name);
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, body);
};

put(
  "curriculum/index.html",
  '<link rel="stylesheet" href="/assets/hub.css"><script src="/assets/hub.js"></script>',
);
put("curriculum/units/index.html", "<h1>Units</h1>");
put("assets/hub.css", ".card{color:#17324d;background:#f7f4ec}");
put("assets/hub.js", 'const icon="/assets/icon.svg";');
put("assets/icon.svg", '<svg><path fill="#1fa6a2"/></svg>');
let scan = scanHubFiles(root);
assert.equal(scan.ok, true, "safe hub dependencies pass");
assert.equal(scan.textFiles.length, 5, "all linked source types are scanned");
assert.equal(collectHubFiles(root).images.length, 0);

// Negative control: the gate must fail on a forbidden value in a dependency that
// is not rendered in the entry state (the hidden CSS rule is still source).
put(
  "assets/hub.css",
  ".card{color:#17324d}.collapsed{background:linear-gradient(#7c3aed,#1fa6a2)}",
);
scan = scanHubFiles(root);
assert.equal(scan.ok, false, "a violet source regression fails the gate");
assert.ok(scan.findings.some((x) => x.text.toLowerCase() === "#7c3aed"));
assert.ok(
  findForbiddenPaints(".x{color:#171235}").some((x) => x.text === "#171235"),
  "dark indigo is forbidden",
);
assert.ok(
  findForbiddenPaints(".x{color:#3742a6}").some((x) => x.text === "#3742a6"),
  "blue-violet indigo is forbidden",
);
assert.equal(
  findForbiddenPaints(".x{color:#2563eb}").length,
  0,
  "ordinary blue remains outside the indigo range",
);
assert.equal(
  findForbiddenPaints(".x{background:#060813}").length,
  0,
  "near-black ink has no perceptible purple hue",
);
assert.ok(
  findForbiddenPaints(".x{background:#e8d6ff}").some((x) => x.text === "#e8d6ff"),
  "pale violet is forbidden",
);
assert.equal(
  findForbiddenPaints(".x{background:#f5f6fb}").length,
  0,
  "near-white blue-gray is a neutral tint, not perceptible violet",
);
assert.equal(
  findForbiddenPaints(".x{background:#464c6c}").length,
  0,
  "muted blue-gray below the indigo saturation floor remains allowed",
);
assert.equal(
  findForbiddenPaints(".x{background:#161825}").length,
  0,
  "dark low-spread ink is not treated as perceptible indigo",
);
assert.equal(
  findForbiddenPaints(".x{background:#ffe5f0}").length,
  0,
  "light rose is outside the violet-to-magenta paint range",
);
assert.equal(
  findForbiddenPaints('const title = "Case #101: The Denominator Trap";').length,
  0,
  "numeric case labels are not color paints",
);
put("math/new-activity/index.html", "<style>.new{color:#7c3aed}</style>");
const changedScan = scanChangedText(root, [join(root, "math/new-activity/index.html")]);
assert.equal(changedScan.findings.length, 1, "changed production surfaces fail on purple");
put("math/new-activity/index.html", "<style>.new{color:#17324d}</style>");
assert.equal(
  scanChangedText(root, [join(root, "math/new-activity/index.html")]).findings.length,
  0,
  "changed production surfaces pass on the locked navy palette",
);
assert.ok(
  findForbiddenPaints(".x{color:#505}").some((x) => x.text === "#505"),
  "numeric shorthand purple colors remain forbidden in paint declarations",
);

assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([124, 58, 237, 255])),
  true,
  "raster negative control catches purple pixels",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([55, 66, 166, 255])),
  true,
  "raster scan catches blue-violet indigo",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([53, 40, 94, 255])),
  true,
  "raster negative control catches perceptible dark indigo",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([232, 214, 255, 255])),
  true,
  "raster negative control catches perceptible pale violet",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([254, 254, 255, 255])),
  false,
  "near-white compression noise has no stable perceptible hue",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([55, 58, 76, 255])),
  false,
  "dark blue-gray raster pixels below perceptible spread are not indigo",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([70, 76, 108, 255])),
  false,
  "muted blue-gray screenshot pixels are not indigo",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([143, 145, 168, 255])),
  false,
  "low-spread slate pixels are not perceptible violet",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([143, 144, 172, 255])),
  false,
  "compressed blue-gray pixels remain below the perceptible color threshold",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([43, 47, 76, 255])),
  false,
  "dark slate pixels below the perceptible hue floor are not indigo",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([255, 229, 240, 255])),
  false,
  "light rose pixels are outside the violet-to-magenta paint range",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([24, 24, 36, 255])),
  false,
  "near-black charcoal has no stable perceptible hue",
);
assert.equal(
  hasForbiddenPixels(new Uint8ClampedArray([0, 2, 29, 255])),
  false,
  "near-black pixels in artwork are not perceptible paint",
);
assert.equal(
  hasForbiddenPixels(
    new Uint8ClampedArray([23, 50, 77, 255, 31, 166, 162, 255, 242, 193, 91, 255]),
  ),
  false,
  "locked palette pixels pass",
);

put("dist/index.html", "<style>.feature{color:#17324d}</style>");
assert.equal(scanDist(root).findings.length, 0, "clean built output passes the shipped scan");
put("dist/index.html", "<style>.feature{color:#171235}</style>");
assert.ok(
  scanDist(root).findings.some((x) => x.text === "#171235"),
  "the actual shipped scan fails on indigo",
);

put("docs/design.md", "Palette reference: #7c3aed");
assert.equal(
  scanSourceDocs(root).findings.length,
  1,
  "repository Markdown is covered by the palette gate",
);
put("docs/design.md", "Palette reference: #1fa6a2");
assert.equal(scanSourceDocs(root).findings.length, 0, "approved Markdown palette passes");
