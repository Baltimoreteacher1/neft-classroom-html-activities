// Shared helpers for the arcade browser tests: a static server over the source tree (the lab's own SPA fallback),
// a Chromium launcher honoring PW_CHROMIUM_PATH, and helpers that drive the shared launcher and question panel
// the way a learner does. Used by tools/arcade-*-e2e.mjs.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

export async function startServer(root = process.cwd()) {
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://local").pathname);
    let file = join(root, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (pathname.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(pathname))
        file = join(root, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, {
      "content-type": types[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((r) => server.close(r)),
  };
}

export const launch = () =>
  chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );

export const VIEWPORTS = {
  chromebook: { width: 1366, height: 768 },
  desktop: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1180 },
  phone: { width: 390, height: 844 },
};

/** Open a flagship game's launcher. Pass cfg to choose options, then press Start. Resolves when the game is running. */
export async function openGame(
  page,
  base,
  id,
  { band = "6-8", lang = "en", cfg = {}, qa = true, start = true } = {},
) {
  await page.addInitScript((l) => {
    try {
      if (!localStorage.getItem("accessPracticeLab:v1:prefs"))
        localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ lang: l }));
    } catch {}
  }, lang);
  await page.goto(`${base}/access-practice-lab/games/${id}?grades=${band}${qa ? "&qa=1" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("[data-ax-launch]", { timeout: 20000 });
  if (cfg.level) await page.check(`input[name="level"][value="${cfg.level}"]`);
  if (cfg.mode) await page.check(`input[name="mode"][value="${cfg.mode}"]`);
  if (cfg.calm !== undefined) await page.setChecked('input[name="calm"]', cfg.calm);
  if (cfg.skill) await page.check(`input[name="skill"][value="${cfg.skill}"]`);
  if (cfg.focus !== undefined && band === "6-8")
    await page.check(`input[name="focus"][value="${cfg.focus}"]`);
  if (start) {
    await page.click('[data-ax="start"]');
    await page.waitForSelector(".ax-stage", { timeout: 20000 });
  }
}

/** Answer the open question through the real UI. `right`: true answers correctly, false misses. */
export async function answerQuestion(page, { right = true, finish = true } = {}) {
  await page.waitForSelector("[data-ax-q]", { timeout: 15000 });
  const t = await page.evaluate(() => {
    const k = window.__ARCADE__.ticket();
    const p = k.prompt;
    return {
      format: p.format,
      correct: p.correctAnswer,
      opts: p.answerOptions.map((o) => o.id),
      rule: p.evaluationRule || null,
    };
  });
  const wrong = () => t.opts.find((o) => ![].concat(t.correct).map(String).includes(o));
  const act = async (ok) => {
    if (t.format === "choice") await page.click(`[data-opt="${ok ? t.correct : wrong()}"]`);
    else if (t.format === "multi") {
      const ids = ok ? t.correct : [wrong()];
      for (const id of ids) await page.click(`[data-opt="${id}"]`);
    } else if (t.format === "order") {
      const order = ok ? t.correct : [...t.correct].reverse();
      for (let i = 0; i < order.length; i += 1) {
        await page.click(`[data-drag="${order[i]}"]`);
        await page.click(`[data-drop="${i}"]`);
      }
    } else {
      await page.fill(
        "[data-ax-text]",
        ok ? `${t.rule.targets[0] || "I"} ${"word ".repeat(t.rule.minWords)}done.` : "no",
      );
      if (ok)
        for (let i = 0; i < t.rule.criteria.length; i += 1)
          await page.check(`[data-ax-crit="${i}"]`);
    }
    await page.click('[data-ax="check"]');
  };
  await act(right);
  if (!right) {
    await page.waitForSelector(".ax-fb");
    if (finish) await act(false);
  }
  if (finish) {
    await page.waitForSelector('[data-ax="next"]');
    await page.click('[data-ax="next"]');
    await page.waitForSelector("[data-ax-q]", { state: "detached" });
  }
}

export const consoleErrors = (page, sink) => {
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message))
      sink.push(
        `pageerror: ${e.message} @ ${String(e.stack || "")
          .split("\n")
          .slice(1, 3)
          .join(" <- ")
          .replace(/http:\/\/127\.0\.0\.1:\d+/g, "")}`,
      );
  });
  // web-vitals is a build-time import that the source tree cannot resolve, and /assets/fonts/*.woff2 are build outputs.
  const benign = /web-vitals|favicon|\.woff2|analytics|beacon|Failed to load resource/i;
  page.on("console", (m) => {
    if (m.type() === "error" && !benign.test(m.text())) sink.push(`console: ${m.text()}`);
  });
  page.on("requestfailed", (r) => {
    if (!benign.test(r.url())) sink.push(`requestfailed: ${r.url()}`);
  });
};
