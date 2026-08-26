import { chromium } from "playwright";

const BASE = process.env.WALK_BASE || "https://eduwonderlab.com";
const IDS = process.argv.slice(2);

const results = [];

async function walk(browser, id) {
  const VW = Number(process.env.WALK_W || 1440), VH = Number(process.env.WALK_H || 1000);
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  const problems = [];
  const note = (m) => problems.push(m);
  page.on("pageerror", (e) => note(`JS ERROR: ${e.message.slice(0, 110)}`));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      if (!/favicon|api\/supports|api\/settings|net::ERR|Failed to load resource/i.test(t)) {
        note(`CONSOLE: ${t.slice(0, 110)}`);
      }
    }
  });

  const seen = {};
  try {
    await page.goto(`${BASE}/lessons/${id}/?sn=Walk%20T`, { waitUntil: "networkidle", timeout: 70000 });
    await page.waitForTimeout(1500);

    // ── enter the lesson the way a student does ──────────────────────────────
    for (let i = 0; i < 4; i++) {
      const label = await page.evaluate(() => {
        const b = [...document.querySelectorAll("button,a")].find(
          (x) => x.getClientRects().length && !x.disabled &&
            /start activity|start the mission|begin|open the case|power up|enter the|launch the|start >/i.test(x.textContent || ""));
        if (b) { b.click(); return b.textContent.replace(/\s+/g, " ").trim().slice(0, 28); }
        return null;
      });
      if (!label) break;
      await page.waitForTimeout(1200);
    }
    const entered = await page.evaluate(() => !!document.querySelector(".sidebar .phase-btn"));
    if (!entered) { note("BLOCKED: never got past the cover into the lesson"); throw new Error("no entry"); }

    // ── sidebar shape ────────────────────────────────────────────────────────
    seen.sidebar = await page.evaluate(() =>
      [...document.querySelectorAll(".sidebar .phase-btn")].map(
        (b) => (b.classList.contains("phase-subtab") ? "  " : "") + b.textContent.replace(/\s+/g, " ").trim()));

    // ── ACT 1: warm-up ───────────────────────────────────────────────────────
    seen.act1 = await page.evaluate(() => {
      const p = document.querySelector(".phase.active");
      return { chars: p ? p.innerText.length : 0, warmup: /Warmup|Warm-Up/i.test(p?.innerText || ""),
               questions: document.querySelectorAll(".phase.active input[type=radio], .phase.active .option-btn, .phase.active button.mc-option").length };
    });
    if (!seen.act1.warmup) note("ACT1: no warm-up on the first phase");

    // ── every subcard opens and has content ─────────────────────────────────
    const subs = await page.evaluate(() =>
      [...document.querySelectorAll(".sidebar .phase-btn.phase-subtab")].map((b) => b.textContent.replace(/\s+/g, " ").trim()));
    seen.subcards = {};
    for (const s of subs) {
      if (/Interactive Studio/.test(s)) continue; // opens a new tab by design
      const ok = await page.evaluate((label) => {
        const b = [...document.querySelectorAll(".sidebar .phase-btn.phase-subtab")].find((x) => x.textContent.replace(/\s+/g, " ").trim() === label);
        if (!b) return false; b.click(); return true;
      }, s);
      if (!ok) { note(`SUBCARD ${s}: button vanished`); continue; }
      await page.waitForTimeout(1500);
      const info = await page.evaluate(() => {
        const host = document.querySelector(".extra-panel") || document.querySelector(".phase.active");
        const dlg = document.querySelector("dialog[open]");
        const el = dlg || host;
        const imgs = [...(el?.querySelectorAll("img") || [])];
        return { chars: el ? el.innerText.trim().length : 0,
                 broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")).slice(0, 3) };
      });
      seen.subcards[s] = info.chars;
      if (info.chars < 60) note(`SUBCARD ${s}: rendered only ${info.chars} chars`);
      if (info.broken.length) note(`SUBCARD ${s}: broken image ${info.broken[0]}`);
      // close any dialog before continuing
      await page.evaluate(() => document.querySelector("dialog[open]")?.close());
      await page.waitForTimeout(250);
    }

    // ── walk the three acts via the sidebar ─────────────────────────────────
    seen.acts = {};
    for (const idx of [0, 1, 2]) {
      await page.evaluate((n) => {
        document.querySelectorAll(".sidebar .phase-btn").forEach((b) => {
          if (b.dataset.phase === String(n) && !b.classList.contains("phase-subtab")) b.click();
        });
      }, idx);
      await page.waitForTimeout(1400);
      // walk every step chip inside the act
      const chips = await page.evaluate(() => document.querySelectorAll(".act-step-panel").length);
      for (let c = 0; c < chips; c++) {
        await page.evaluate((i) => {
          const btns = [...document.querySelectorAll("[class*='act-step']")].filter((e) => e.tagName === "BUTTON" || e.closest("button"));
          const b = btns[i]?.closest("button") || btns[i];
          if (b && b.tagName === "BUTTON") b.click();
        }, c);
        await page.waitForTimeout(500);
      }
      const info = await page.evaluate(() => {
        const p = document.querySelector(".phase.active");
        const imgs = [...(p?.querySelectorAll("img") || [])];
        // Only buttons a student can actually SEE — the step strip renders every
        // panel and hides all but one, so counting the lot reports three ways
        // forward when only one is on screen.
        const fwd = [...(p?.querySelectorAll("button") || [])]
          .filter((b) => b.getClientRects().length > 0)
          .map((b) => b.textContent.replace(/\s+/g, " ").trim())
          .filter((t) => /continue|start act|proceed|next:/i.test(t));
        return { chars: p ? p.innerText.trim().length : 0,
                 broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")).slice(0, 3),
                 forward: fwd };
      });
      seen.acts[`act${idx + 1}`] = { chars: info.chars, forward: info.forward.length };
      if (info.chars < 200) note(`ACT ${idx + 1}: only ${info.chars} chars of content`);
      if (info.broken.length) note(`ACT ${idx + 1}: broken image ${info.broken[0]}`);
      if (info.forward.length > 1) note(`ACT ${idx + 1}: ${info.forward.length} competing forward buttons — ${info.forward.join(" | ")}`);
    }
  } catch (e) {
    if (!/no entry/.test(e.message)) note(`THREW: ${e.message.slice(0, 90)}`);
  }
  await page.close();
  return { id, problems, seen };
}

const browser = await chromium.launch();
for (const id of IDS) {
  const r = await walk(browser, id);
  results.push(r);
  const bad = r.problems.length;
  console.log(`\n${bad ? "✗" : "✓"} ${id}  ${bad ? bad + " problem(s)" : "clean"}`);
  if (r.seen.acts) console.log(`    acts: ${JSON.stringify(r.seen.acts)}`);
  if (r.seen.subcards) console.log(`    subcards: ${JSON.stringify(r.seen.subcards)}`);
  for (const p of r.problems) console.log(`    → ${p}`);
}
await browser.close();
const failed = results.filter((r) => r.problems.length);
console.log(`\n===== ${results.length - failed.length}/${results.length} lessons clean =====`);
if (failed.length) console.log("FAILED:", failed.map((f) => f.id).join(", "));
