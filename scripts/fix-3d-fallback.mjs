// One-off: make 3D game WebGL-failure fallbacks accurate + add a 2D fallback
// link for units that have a Phaser 2D edition. Three.js is vendored locally
// (not a CDN), so the old "loads from a CDN" message was misleading.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "games/3d");

// 3D unit dir -> existing 2D Phaser edition under /games/
const TWO_D = {
  "unit-1": "/games/unit1-factor-frenzy.html",
  "unit-2": "/games/unit2-fraction-kitchen.html",
  "unit-3": "/games/unit3-ratio-rally.html",
  "unit-4": "/games/unit4-discount-dash.html",
  "unit-5": "/games/unit5-area-architect.html",
  "unit-6": "/games/unit6-expression-engine.html",
  "unit-7": "/games/unit7-equation-escape.html",
  "unit-8": "/games/unit8-stats-slam.html",
  "unit-9": "/games/unit9-coordinate-quest.html",
  "unit-10": "/games/unit10-volume-vault.html",
};

const ACCURATE_P = `<p>
          This game needs a browser with WebGL turned on. Try refreshing once,
          or open it in a different browser or on another device.
        </p>`;

// Matches both the "CDN" wording and the already-accurate "bundled" wording so
// every fallback ends up with one consistent, correct message.
const P_RE =
  /<p>\s*Please use an up-to-date browser with WebGL[\s\S]*?<\/p>/;

let edited = 0;
let linked = 0;
for (const name of readdirSync(DIR)) {
  if (name.startsWith("_")) continue;
  const file = join(DIR, name, "index.html");
  if (!existsSync(file)) continue;
  let html = readFileSync(file, "utf8");
  const before = html;

  if (P_RE.test(html)) html = html.replace(P_RE, ACCURATE_P);

  const twoD = TWO_D[name];
  if (twoD && !html.includes('class="e3d-fallback-2d"')) {
    // Inject a 2D fallback link right after the fallback message paragraph.
    html = html.replace(
      ACCURATE_P,
      `${ACCURATE_P}
        <p class="e3d-fallback-2d" style="margin-top:14px;">
          <a href="${twoD}" style="display:inline-block;padding:10px 18px;border-radius:10px;background:#1fa6a2;color:#fff;font-weight:600;text-decoration:none;">Play the 2D version instead →</a>
        </p>`,
    );
    if (html.includes(twoD)) linked++;
  }

  if (html !== before) {
    writeFileSync(file, html);
    edited++;
  }
}
console.log(`edited=${edited} twoDLinksAdded=${linked}`);
