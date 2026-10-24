// Browser verification of the widget platform layout in the Practice Studios (docs/audits/studio-v4/brief-x-platform.md).
// Explicitly invoked (npm run validate:studio-layout-browser); never starts on ordinary site builds. Run it AFTER the pages
// are regenerated (node scripts/generate-practice-studios.mjs): it reads the generated pages from disk.
//
//   node tools/verify-studio-layout-browser.mjs                 6-9 5-2 8-5 3-3 and one lesson per other unit, Practice pages
//   node tools/verify-studio-layout-browser.mjs 5-2 8-5         only these lessons
//   node tools/verify-studio-layout-browser.mjs --all           every lesson that has a hands-on activity or lab
//   node tools/verify-studio-layout-browser.mjs --origin http://127.0.0.1:4780   test a server that is already running
//
// For each page at 1366x768 (a school Chromebook) and 360x740 (a phone) it opens the first activity of every hands-on kind
// and checks what a student would hit:
//   - no horizontal scroll; the five-section trail is ONE row at 360
//   - the floating Save / Resume and Math Workbench never sit on a widget control or a Check button (a hidden one is fine)
//   - the Check button and the picture can be on one screen; nothing covers the Check button
//   - lab pictures draw every label at 13px or more; a draggable picture keeps its pointer (touch-action none)
//   - a read-only box is not a tab stop
//   - Full screen opens a dialog holding the same item, Esc closes it, focus returns, the item is back where it was
//   - after a wrong Check the feedback is on screen
// A missing browser is a SKIP (exit 3), never a pass.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? null : args[i + 1];
};
const wanted = args.filter((a) => /^\d+-\d+$/.test(a));
const STUDIO_UNITS = [2, 3, 5, 6, 7, 8, 9];
const VIEWPORTS = [
  { name: "chromebook", width: 1366, height: 768, touch: false },
  { name: "phone", width: 360, height: 740, touch: true },
];
const MIN_LABEL = 12.9;
const NOISE = /web-vitals|\/api\/|favicon|Failed to load resource/i;

/* ---- a static server over the repo unless --origin names one ------------------------------------------------------ */
const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
let server = null;
let origin = flag("--origin");
if (!origin) {
  server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (path.endsWith("/")) path += "index.html";
    let file = resolve(REPO_ROOT, `.${path}`);
    if (!file.startsWith(`${resolve(REPO_ROOT)}/`)) return void res.writeHead(403).end();
    if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
    if (!existsSync(file) || !statSync(file).isFile())
      return void res.writeHead(404).end("Not found");
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${server.address().port}`;
}

/* ---- which lessons ---------------------------------------------------------------------------------------------------- */
const studioIds = listLessonDirs({ filter: /^\d+-\d+$/ })
  .filter((id) => STUDIO_UNITS.includes(Number(id.split("-")[0])))
  .filter((id) => existsSync(join(REPO_ROOT, `math/practice-studio/${id}/index.html`)))
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const hasWidget = (id) =>
  /"k":"(act|lab|mission)"/.test(
    /id="studio-data">([\s\S]*?)<\/script>/.exec(
      readFileSync(join(REPO_ROOT, `math/practice-studio/${id}/index.html`), "utf8"),
    )?.[1] || "",
  );
let ids;
if (wanted.length) ids = wanted.filter((id) => studioIds.includes(id));
else if (args.includes("--all")) ids = studioIds.filter(hasWidget);
else {
  const seen = new Set();
  const core = ["6-9", "5-2", "8-5", "3-3"].filter((id) => studioIds.includes(id));
  const others = studioIds.filter(hasWidget).filter((id) => {
    const u = id.split("-")[0];
    return !core.some((c) => c.startsWith(`${u}-`)) && !seen.has(u) && seen.add(u);
  });
  ids = [...core, ...others];
}
if (!ids.length || !studioIds.length) {
  server?.close();
  process.exit(
    skipExit(
      "no generated studio page with a widget was found",
      "run: node scripts/generate-practice-studios.mjs",
    ),
  );
}

const launch = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
let browser;
try {
  browser = await chromium.launch(launch);
} catch (e) {
  server?.close();
  process.exit(skipExit(`no browser: ${String(e.message).split("\n")[0]}`, "set PW_CHROMIUM_PATH"));
}

const failures = [];
const stats = { pages: 0, widgets: 0, checks: 0 };
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const ok = () => stats.checks++;

/* ---- in-page probes (serialised into the page) ------------------------------------------------------------------------- */
const probe = () => {
  const rect = (el) => {
    const b = el.getBoundingClientRect();
    return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height };
  };
  const shown = (el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && b.width > 0 && b.height > 0;
  };
  const inside = (host) => host.shadowRoot || host;
  const controls = (host) =>
    [
      ...inside(host).querySelectorAll(
        "button, input, select, textarea, [role=slider], [data-check]",
      ),
    ].filter(shown);
  const isCheck = (el) =>
    /^(check|comprobar|revisar)/i.test((el.textContent || "").trim()) ||
    el.matches("[data-check], [data-check-lab]");
  return { rect, shown, inside, controls, isCheck };
};

async function widgetSlots(page) {
  return page.evaluate(() => {
    const api = window.StudioRT?.api;
    if (!api) return [];
    const out = [];
    const seen = new Set();
    api.sections.forEach((sec, s) =>
      sec.items.forEach((it, i) => {
        const key = it.k === "act" ? `act:${it.kind}` : it.k;
        if (["act", "lab", "mission"].includes(it.k) && !seen.has(key)) {
          seen.add(key);
          out.push({ tab: s + 1, index: i, k: it.k, kind: it.kind || "", id: it.id });
        }
      }),
    );
    return out;
  });
}

async function openSlot(page, slot) {
  await page.evaluate(({ tab, index }) => {
    const rt = window.StudioRT.api;
    rt.state.idx[tab] = index;
    rt.selectTab(tab);
    rt.render(tab);
  }, slot);
  await page
    .waitForFunction(
      (s) => {
        const body = document.querySelector(`#stage-${s.tab} .item-body`);
        if (!body) return false;
        const lab = body.querySelector(".lab-model");
        if (lab) return !!lab.shadowRoot?.querySelector("svg, [data-control]");
        if (body.querySelector(".lab-mission"))
          return !!body.querySelector(".lab-mission").shadowRoot?.firstElementChild;
        return !!body.querySelector(".act-host *");
      },
      slot,
      { timeout: 15000 },
    )
    .catch(() => {});
  await page.waitForTimeout(500);
}

/** Scroll in steps through the item and report, at each step, what the platform promises. */
async function walk(page, slot) {
  return page.evaluate(
    async ({ tab, fnSrc }) => {
      const P = new Function(`return (${fnSrc})()`)();
      const body = document.querySelector(`#stage-${tab} .item-body`);
      const host = body.querySelector(".act-host, .lab-model, .lab-mission");
      const fab = document.getElementById("nsr-root");
      const checks = [...P.controls(host), ...body.querySelectorAll("[data-check-lab]")].filter(
        P.isCheck,
      );
      const out = {
        fabOnControl: 0,
        fabOnCheck: 0,
        together: false,
        coveredCheck: 0,
        coveredHits: [],
        steps: 0,
        noCheck: !checks.length,
      };
      const top0 = body.getBoundingClientRect().top + scrollY;
      const end = top0 + body.getBoundingClientRect().height;
      for (let y = top0 - 90; y < end; y += Math.max(80, innerHeight / 3)) {
        scrollTo(0, Math.max(0, y));
        await new Promise((r) => setTimeout(r, 60));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        out.steps++;
        const fabShown = fab && P.shown(fab);
        const fr = fabShown ? P.rect(fab) : null;
        for (const c of P.controls(host)) {
          const r = P.rect(c);
          if (r.b < 0 || r.t > innerHeight) continue;
          if (fr && fr.l < r.r && fr.r > r.l && fr.t < r.b && fr.b > r.t) {
            out.fabOnControl++;
            if (P.isCheck(c)) out.fabOnCheck++;
          }
        }
        const pic =
          host.shadowRoot?.querySelector("svg") ||
          host.querySelector("svg, canvas, .viz-host") ||
          host;
        const pr = P.rect(pic);
        const pictureVisible = pr.h > 0 && pr.t >= 0 && pr.t < innerHeight - 100;
        const visibleChecks = checks.filter((c) => {
          const r = P.rect(c);
          return r.t >= 0 && r.b <= innerHeight && r.w > 0;
        });
        if (visibleChecks.length) {
          const c = visibleChecks[0];
          const r = P.rect(c);
          const hit =
            c.getRootNode().elementFromPoint?.(r.l + r.w / 2, r.t + r.h / 2) ||
            document.elementFromPoint(r.l + r.w / 2, r.t + r.h / 2);
          const root = c.getRootNode();
          const shadowHost = root instanceof ShadowRoot ? root.host : null;
          if (
            !(
              hit === c ||
              c.contains(hit) ||
              hit?.contains(c) ||
              hit?.closest("button") === c ||
              hit === shadowHost
            )
          )
            out.coveredCheck++,
              out.coveredHits.push(
                `scroll=${scrollY} check=${r.t.toFixed(0)}..${r.b.toFixed(0)} hit=${hit?.tagName || "none"}.${hit?.className || ""}(${P.rect(hit).t.toFixed(0)}..${P.rect(hit).b.toFixed(0)})`,
              );
          if (pictureVisible) out.together = true;
        }
      }
      return out;
    },
    { tab: slot.tab, fnSrc: probe.toString() },
  );
}

async function pictureRules(page, slot) {
  return page.evaluate(
    ({ tab, min }) => {
      const body = document.querySelector(`#stage-${tab} .item-body`);
      const out = { small: [], touch: null, dead: 0, texts: 0 };
      const roots = [
        body,
        ...[...body.querySelectorAll(".lab-model, .lab-mission")]
          .map((h) => h.shadowRoot)
          .filter(Boolean),
      ];
      for (const root of roots) {
        for (const svg of root.querySelectorAll(".model-picture svg")) {
          const vb = svg.viewBox.baseVal;
          const scale = svg.getBoundingClientRect().width / (vb.width || 1);
          for (const t of svg.querySelectorAll("text")) {
            out.texts++;
            const px = Number.parseFloat(getComputedStyle(t).fontSize) * scale;
            if (px < min)
              out.small.push(`${(t.textContent || "").slice(0, 24)} ${px.toFixed(1)}px`);
          }
        }
        const direct = root.querySelector(".model-picture.direct");
        if (direct) out.touch = getComputedStyle(direct).touchAction;
        for (const el of root.querySelectorAll("input[readonly]")) if (el.tabIndex >= 0) out.dead++;
      }
      return out;
    },
    { tab: slot.tab, min: MIN_LABEL },
  );
}

async function fullScreen(page, slot) {
  const btn = page.locator(`#stage-${slot.tab} .focus-open-btn`);
  if (!(await btn.count())) return "no Full screen button";
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(400);
  const state = await page.evaluate(() => {
    const d = document.querySelector("dialog.focus-sheet");
    return {
      open: !!d?.open,
      holds: !!d?.querySelector(".act-host, .lab-model, .lab-mission"),
      hole: !!document.querySelector(".focus-hole"),
      w: d ? d.getBoundingClientRect().width : 0,
      iw: innerWidth,
    };
  });
  if (!state.open) return "the sheet did not open";
  if (!state.holds) return "the sheet does not hold the widget";
  if (state.w < state.iw - 2) return "the sheet is not full width";
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const after = await page.evaluate(
    (tab) => ({
      dialog: !!document.querySelector("dialog.focus-sheet"),
      back: !!document.querySelector(
        `#stage-${tab} .item-body .act-host, #stage-${tab} .item-body .lab-model, #stage-${tab} .item-body .lab-mission`,
      ),
      focusOnButton: document.activeElement?.classList.contains("focus-open-btn"),
    }),
    slot.tab,
  );
  if (after.dialog) return "Esc did not close the sheet";
  if (!after.back) return "the item did not come back";
  if (!after.focusOnButton) return "focus did not return to the Full screen button";
  return null;
}

async function labFeedback(page, slot) {
  const conf = page.locator(`#stage-${slot.tab} [data-conf]`).nth(1);
  if (await conf.count()) await conf.click();
  const check = page.locator(`#stage-${slot.tab} [data-check-lab]`);
  if (!(await check.count()) || (await check.isDisabled())) return null;
  await check.click();
  await page.waitForTimeout(900);
  return page.evaluate((tab) => {
    const fb = document.querySelector(`#stage-${tab} .item-fb`);
    const r = fb.getBoundingClientRect();
    return fb.classList.contains("show") && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight
      ? null
      : `feedback not on screen (top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)}, viewport ${innerHeight})`;
  }, slot.tab);
}

/* ---- run ------------------------------------------------------------------------------------------------------------------- */
for (const id of ids) {
  for (const vp of VIEWPORTS) {
    const where = `${id} ${vp.name}`;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.touch,
      isMobile: vp.touch,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => {
      if (!NOISE.test(String(e))) errors.push(String(e));
    });
    page.on("console", (m) => {
      if (m.type() === "error" && !NOISE.test(m.text())) errors.push(m.text());
    });
    try {
      await page.goto(`${origin}/math/practice-studio/${id}/`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => !!window.StudioRT?.api, null, { timeout: 15000 });
      stats.pages++;

      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1) fail(where, `horizontal scroll of ${over}px`);
      else ok();
      if (vp.width <= 400) {
        const tabs = await page.evaluate(() =>
          [...document.querySelectorAll(".tab-btn")].map((b) =>
            Math.round(b.getBoundingClientRect().top),
          ),
        );
        if (Math.max(...tabs) - Math.min(...tabs) > 6 || tabs.length !== 5)
          fail(where, `the section trail is not one row (tops ${tabs.join(",")})`);
        else ok();
      }

      for (const slot of await widgetSlots(page)) {
        stats.widgets++;
        const w = `${where} ${slot.k}${slot.kind ? `:${slot.kind}` : ""} (${slot.id})`;
        await openSlot(page, slot);
        const res = await walk(page, slot);
        if (res.noCheck && slot.k !== "mission") fail(w, "no Check button found in the widget");
        if (res.fabOnCheck)
          fail(
            w,
            `a floating button sits on the Check button at ${res.fabOnCheck} scroll position(s)`,
          );
        else if (res.fabOnControl)
          fail(
            w,
            `a floating button sits on a widget control at ${res.fabOnControl} scroll position(s)`,
          );
        else ok();
        if (res.coveredCheck)
          fail(
            w,
            `something covers the Check button at ${res.coveredCheck} scroll position(s): ${res.coveredHits.join(", ")}`,
          );
        else ok();
        if (!res.noCheck && !res.together && slot.k !== "mission")
          fail(w, "the picture and the Check button are never on one screen");
        else ok();
        await page.evaluate(() => scrollTo(0, 0));
        const pic = await pictureRules(page, slot);
        if (pic.small.length) fail(w, `labels under 13px: ${pic.small.slice(0, 3).join("; ")}`);
        else ok();
        if (pic.touch !== null && pic.touch !== "none")
          fail(w, `a draggable picture has touch-action ${pic.touch}`);
        if (pic.dead) fail(w, `${pic.dead} read-only box(es) are tab stops`);
        else ok();
        const fs = await fullScreen(page, slot);
        if (fs) fail(w, `Full screen: ${fs}`);
        else ok();
        if (slot.k === "lab") {
          await openSlot(page, slot);
          const fb = await labFeedback(page, slot);
          if (fb) fail(w, fb);
          else ok();
        }
      }
      for (const e of errors) fail(where, `console error: ${e.slice(0, 160)}`);
    } catch (e) {
      fail(where, `could not be driven: ${String(e.message).split("\n")[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
server?.close();

if (failures.length) {
  console.error(`studio layout browser: ${failures.length} problem(s)`);
  for (const f of failures.slice(0, 60)) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `studio layout browser: ${stats.pages} page views, ${stats.widgets} widgets, ${stats.checks} checks (FABs, Check reach, labels, tab stops, Full screen, feedback) all hold.`,
);
