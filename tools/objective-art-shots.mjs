// Renders every goal-card SVG in a real browser and LOOKS at it.
//
//   node tools/objective-art-shots.mjs            # screenshots + geometry report
//   node tools/objective-art-shots.mjs --check    # geometry report only, no PNGs
//
// A hand-authored figure can be perfectly valid XML and still be unreadable: a
// chip wider than its own label, two labels sitting on top of each other, a
// number pushed off the card. None of that is visible to a linter, and a garbled
// figure ships to students, so this measures the rendered geometry — real text
// metrics from the browser, not the generator's estimate — and fails on:
//
//   · any drawn element outside the card,
//   · any two <text> boxes overlapping,
//   · any <text> escaping the white panel it belongs to.
//
// Screenshots land in reports/objective-art/ (gitignored reports dir) so the
// figures can also be eyeballed at card width.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ART = resolve(ROOT, "assets", "objective-art");
const SHOTS = resolve(ROOT, "reports", "objective-art");
const CHECK_ONLY = process.argv.includes("--check");

// The card renders full-width inside a lesson column; 900 CSS px is the widest
// it gets on a laptop and roughly what a projector shows.
const RENDER_W = 900;

const geometry = `(() => {
  const svg = document.querySelector("svg");
  const box = svg.viewBox.baseVal;
  const root = svg.getScreenCTM().inverse();
  const toUser = (el) => {
    const b = el.getBBox();
    const m = el.getScreenCTM();
    const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
      .map(([x, y]) => {
        const p = svg.createSVGPoint();
        p.x = x; p.y = y;
        return p.matrixTransform(m).matrixTransform(root);
      });
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const texts = [...svg.querySelectorAll("text")].map((el) => ({ text: el.textContent, ...toUser(el) }));
  const all = [...svg.querySelectorAll("text, rect, circle, polygon, path, line")].map((el) => ({
    tag: el.tagName, ...toUser(el),
  }));
  const panel = { x: 44, y: 112, w: 1288, h: 612 };
  return { box: { w: box.width, h: box.height }, texts, all, panel };
})()`;

function overlaps(a, b, pad = 1) {
  return (
    a.x < b.x + b.w - pad && b.x < a.x + a.w - pad && a.y < b.y + b.h - pad && b.y < a.y + a.h - pad
  );
}

async function main() {
  if (!existsSync(ART))
    throw new Error("assets/objective-art is missing — run npm run generate:objective-art");
  const files = readdirSync(ART)
    .filter((f) => f.endsWith(".svg"))
    .sort();
  if (!files.length) throw new Error("objective-art: no SVGs to inspect");
  if (!CHECK_ONLY) mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: RENDER_W, height: Math.round((RENDER_W * 768) / 1376) },
    deviceScaleFactor: 2,
  });

  const problems = [];
  const lines = [];
  for (const file of files) {
    const svg = readFileSync(resolve(ART, file), "utf8");
    await page.setContent(
      `<!doctype html><meta charset="utf-8">` +
        `<style>html,body{margin:0;padding:0;background:#fff}svg{width:${RENDER_W}px;height:auto;display:block}</style>` +
        svg,
      { waitUntil: "load" },
    );
    const g = await page.evaluate(geometry);

    const bad = [];
    for (const el of g.all) {
      if (el.x < -2 || el.y < -2 || el.x + el.w > g.box.w + 2 || el.y + el.h > g.box.h + 2) {
        bad.push(
          `<${el.tag}> outside the card: x ${el.x.toFixed(0)}..${(el.x + el.w).toFixed(0)}, y ${el.y.toFixed(0)}..${(el.y + el.h).toFixed(0)}`,
        );
      }
    }
    for (const t of g.texts) {
      // Header text lives above the panel by design; everything else must be in it.
      if (t.y > 100 && (t.x < g.panel.x + 4 || t.x + t.w > g.panel.x + g.panel.w - 4)) {
        bad.push(
          `text "${t.text}" escapes the panel (x ${t.x.toFixed(0)}..${(t.x + t.w).toFixed(0)})`,
        );
      }
      if (t.y > 100 && t.y + t.h > g.panel.y + g.panel.h - 2) {
        bad.push(
          `text "${t.text}" runs past the bottom of the panel (y ${(t.y + t.h).toFixed(0)})`,
        );
      }
    }
    for (let i = 0; i < g.texts.length; i += 1) {
      for (let j = i + 1; j < g.texts.length; j += 1) {
        if (overlaps(g.texts[i], g.texts[j], 2)) {
          bad.push(`text "${g.texts[i].text}" overlaps "${g.texts[j].text}"`);
        }
      }
    }

    if (!CHECK_ONLY) {
      await page.screenshot({
        path: resolve(SHOTS, file.replace(/\.svg$/, ".png")),
        fullPage: true,
      });
    }
    lines.push(`${bad.length ? "FAIL" : "ok  "}  ${file}  (${g.texts.length} labels)`);
    for (const b of bad) lines.push(`        ${b}`);
    if (bad.length) problems.push({ file, bad });
  }

  await browser.close();
  const report = lines.join("\n");
  console.log(report);
  if (!CHECK_ONLY) {
    mkdirSync(SHOTS, { recursive: true });
    writeFileSync(resolve(SHOTS, "geometry.txt"), `${report}\n`, "utf8");
    console.log(`\nscreenshots → ${SHOTS.replace(`${ROOT}/`, "")}/`);
  }
  console.log(`\n${files.length} figures · ${problems.length} with problems`);
  if (problems.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
