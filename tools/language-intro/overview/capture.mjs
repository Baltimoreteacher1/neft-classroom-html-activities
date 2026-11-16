// Records real footage of the running Language Page for the homepage overview film.
// Serves this worktree with tools/lib/access-serve.mjs, maps thelanguagepage.com to it (so the app shows its own
// brand), drives the real UI with Playwright and records each shot as a WebM. A visible cursor is injected so the
// viewer can follow what is being clicked. Only the two video cards (the homepage videos themselves) are hidden
// with CSS before filming, so the film never shows a video inside a video.
// Usage: node capture.mjs <out-dir> [shot ...]
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { chromium } from "/Users/joelneft/node_modules/playwright/index.mjs";
import { serveAccess } from "../../lib/access-serve.mjs";

const out = process.argv[2];
const only = process.argv.slice(3);
mkdirSync(out, { recursive: true });
const { server, base } = await serveAccess({ port: 4871 });
const port = new URL(base).port;
const LAB = `http://thelanguagepage.com:${port}/access-practice-lab`;
const browser = await chromium.launch({
  args: ["--host-resolver-rules=MAP thelanguagepage.com 127.0.0.1"],
});

const CURSOR = `(() => {
  if (window.__cur) return;
  const c = document.createElement("div"); window.__cur = c;
  c.style.cssText = "position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:none";
  c.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l15 9-6.5 1.6L9.6 19z" fill="#17324d" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const r = document.createElement("div");
  r.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;width:46px;height:46px;border-radius:50%;border:4px solid #1fa6a2;opacity:0;margin:-23px 0 0 -23px";
  const st = document.createElement("style");
  st.textContent = "studio-video,.language-intro{display:none!important}";
  const add = () => { document.documentElement.append(c, r, st); };
  document.documentElement ? add() : addEventListener("DOMContentLoaded", add);
  addEventListener("mousemove", (e) => { c.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; }, true);
  addEventListener("mousedown", (e) => { r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; r.animate([{ opacity: .9, transform: "scale(.4)" }, { opacity: 0, transform: "scale(1.5)" }], { duration: 520, easing: "ease-out" }); }, true);
})();`;

const wait = (p, ms) => p.waitForTimeout(ms);
async function moveTo(p, loc, { dx = 0, dy = 0, steps = 28 } = {}) {
  await loc.waitFor({ state: "visible" });
  let b = await loc.boundingBox();
  if (b && (b.y < 120 || b.y + b.height > 760)) {
    await loc.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
    await wait(p, 500);
    b = await loc.boundingBox();
  }
  if (!b) throw new Error("no box");
  await p.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, { steps });
  return b;
}
async function click(p, loc, opts) {
  await moveTo(p, loc, opts);
  await wait(p, 350);
  await p.mouse.down();
  await wait(p, 70);
  await p.mouse.up();
}
async function glide(p, px, ms = 2400) {
  const n = Math.max(1, Math.round(ms / 40));
  for (let i = 0; i < n; i++) {
    await p.mouse.wheel(0, px / n);
    await wait(p, 40);
  }
}
const clean = (p) =>
  p.evaluate(() =>
    document.querySelectorAll("studio-video,.language-intro,.sv").forEach((e) => e.remove()),
  );
async function open(p, path) {
  await p.goto(`${LAB}/${path}`, { waitUntil: "networkidle" });
  await clean(p);
  await p.locator("h1").first().waitFor();
  await wait(p, 900);
  await p.mouse.move(980, 640);
  await wait(p, 700);
}

const shots = {
  async home(p, mark) {
    await open(p, "");
    mark("hero");
    await wait(p, 1500);
    await click(p, p.locator('[data-grade-pick="4-5"]'));
    await wait(p, 1100);
    await click(p, p.locator('[data-grade-pick="6-8"]'));
    await wait(p, 900);
    await moveTo(p, p.locator(".lph-go"));
    await wait(p, 1800);
  },
  async practice(p) {
    await open(p, "explore/practice?grades=6-8");
    await wait(p, 900);
    await glide(p, 520, 2600);
    await wait(p, 400);
    await glide(p, 620, 2600);
    await wait(p, 600);
  },
  async speak(p) {
    await open(p, "speak?grades=6-8");
    await wait(p, 1200);
    await glide(p, 330, 2200);
    await wait(p, 900);
  },
  async write(p) {
    await open(p, "write?grades=6-8");
    await wait(p, 1200);
    await glide(p, 330, 2200);
    await wait(p, 900);
  },
  async games(p) {
    await open(p, "games?grades=6-8");
    await wait(p, 1200);
    await glide(p, 520, 2600);
    await wait(p, 1200);
  },
  async activity(p, mark) {
    await open(p, "");
    await click(p, p.locator(".lph-go"));
    await wait(p, 1500);
    await clean(p);
    await p.mouse.move(900, 500);
    mark("warmup");
    await wait(p, 2600); // warm up: four steps, directions, key words
    await click(p, p.getByRole("button", { name: "Got it, let me try" }));
    await wait(p, 1000);
    mark("try");
    await p.evaluate(() => scrollTo(0, 0));
    await wait(p, 300);
    await glide(p, 620, 1800); // down to the listening player and the answers
    mark("player");
    await click(p, p.getByRole("button", { name: "Slower" }).first());
    await wait(p, 700);
    mark("wordhelp");
    await click(p, p.getByText(/Word help/).first());
    await wait(p, 1500);
    await click(p, p.getByText(/Word help/).first());
    await wait(p, 400);
    mark("choose");
    await click(p, p.locator("label.choice").first());
    await wait(p, 600);
    await click(p, p.getByRole("button", { name: "I think so" }));
    await wait(p, 600);
    await click(p, p.getByRole("button", { name: "Check my answer" }));
    mark("checked");
    await wait(p, 700);
    await glide(p, 430, 1400);
    await wait(p, 2600); // feedback
    mark("feedback");
    await glide(p, -520, 1200);
    await moveTo(p, p.getByText("Try independently").first());
    await wait(p, 1600);
    mark("modes");
  },
  async accessprep(p) {
    await open(p, "access-prep");
    await wait(p, 1400);
    await glide(p, 420, 2400);
    await wait(p, 1200);
  },
  async growth(p) {
    await open(p, "growth?grades=6-8");
    await wait(p, 1300);
    await glide(p, 520, 2600);
    await wait(p, 1300);
  },
  async teachers(p) {
    await open(p, "start?grades=6-8");
    await wait(p, 1300);
    await glide(p, 700, 3000);
    await wait(p, 1500);
  },
  async families(p) {
    await open(p, "practice-together?grades=6-8");
    await wait(p, 800);
    await click(p, p.locator('[data-ft-band="3-5"]'));
    await wait(p, 700);
    await click(p, p.locator("#ftLang-es"));
    await wait(p, 1300);
    await click(p, p.locator("#ftLang-bi"));
    await wait(p, 1400);
  },
};

const manifest = existsSync(join(out, "shots.json"))
  ? JSON.parse(readFileSync(join(out, "shots.json"), "utf8"))
  : {};
for (const [name, run] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue;
  const dir = join(out, `_${name}`);
  rmSync(dir, { recursive: true, force: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: "block",
    recordVideo: { dir, size: { width: 1280, height: 800 } },
  });
  await ctx.addInitScript(CURSOR);
  const t0 = Date.now();
  const marks = {};
  const mark = (m) => {
    marks[m] = (Date.now() - t0) / 1000;
  };
  const p = await ctx.newPage();
  try {
    await run(p, mark);
    manifest[name] = { ok: true, seconds: (Date.now() - t0) / 1000, marks };
  } catch (e) {
    console.error(
      "FAILED",
      name,
      e.message.split("\n")[0],
      (e.stack.match(/capture\.mjs:\d+/g) || []).join(" "),
    );
    manifest[name] = { ok: false, error: e.message.split("\n")[0] };
  }
  await p.screenshot({ path: join(out, `${name}-last.png`) }).catch(() => {});
  await ctx.close();
  const f = readdirSync(dir).find((x) => x.endsWith(".webm"));
  if (f) renameSync(join(dir, f), join(out, `${name}.webm`));
  rmSync(dir, { recursive: true, force: true });
  console.log(name, JSON.stringify(manifest[name]));
}
writeFileSync(join(out, "shots.json"), JSON.stringify(manifest, null, 1));
await browser.close();
server.close();
