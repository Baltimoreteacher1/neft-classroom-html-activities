// Browser plumbing for the family design gates: a static server over the repo, a launcher that
// reports "no browser" honestly, and the in-page collector that measures what a page really renders.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { chromium } from "playwright";
import { ROOT } from "./family-tokens.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

export async function serveRepo(root = ROOT) {
  const base = resolve(root);
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(base, `.${path}`);
    if (!file.startsWith(`${base}/`) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, close: () => new Promise((r) => server.close(r)) };
}

/** A browser, or null when none can launch (the caller must report SKIP, never PASS). */
export async function launchBrowser() {
  try {
    return await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (error) {
    console.warn(`browser unavailable: ${String(error.message).split("\n")[0]}`);
    return null;
  }
}

export const SPECIMEN = "/design/family-system/index.html";

/** Runs inside the page. Everything it returns is plain data. */
export function collectMetrics() {
  const colors = {};
  const sizes = new Set();
  const radii = new Set();
  const shadows = new Set();
  const families = new Set();
  const tiny = [];
  const lowContrast = [];
  const cardDepth = [];
  let elements = 0;
  let unjudged = 0;

  const parse = (str) => {
    const m = str.match(/rgba?\(([^)]+)\)/) || str.match(/color\(srgb ([^)]+)\)/);
    if (!m) return null;
    const p = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    const k = str.startsWith("color(") ? 255 : 1;
    return { r: p[0] * k, g: p[1] * k, b: p[2] * k, a: p[3] ?? 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const note = (str) => {
    if (!str) return;
    const p = parse(str);
    if (p && p.a > 0)
      colors[`rgba(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)}, ${p.a})`] = 1;
  };
  const visible = (cs, rect) => {
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    if (rect.width === 0 && rect.height === 0) return false;
    return true;
  };
  const srOnly = (rect) => rect.width <= 1 && rect.height <= 1;
  const effectiveBg = (el) => {
    let layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none") return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a === 1) break;
      }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const c of layers.reverse()) bg = over(c, bg);
    return bg;
  };

  for (const el of document.querySelectorAll("body, body *")) {
    if (el.closest("dialog:not([open])") || el.closest("template") || el.closest("[hidden]"))
      continue;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!visible(cs, rect)) continue;
    elements++;
    note(cs.color);
    note(cs.backgroundColor);
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (cs[`border${side}Style`] !== "none" && Number.parseFloat(cs[`border${side}Width`]) > 0)
        note(cs[`border${side}Color`]);
    }
    if (cs.outlineStyle !== "none" && Number.parseFloat(cs.outlineWidth) > 0) note(cs.outlineColor);
    if (/^(path|rect|circle|ellipse|line|polyline|polygon|text|tspan)$/.test(el.localName)) {
      if (cs.fill && cs.fill !== "none") note(cs.fill);
      if (cs.stroke && cs.stroke !== "none") note(cs.stroke);
    }
    const r = [
      cs.borderTopLeftRadius,
      cs.borderTopRightRadius,
      cs.borderBottomRightRadius,
      cs.borderBottomLeftRadius,
    ];
    for (const v of r) if (v !== "0px") radii.add(v);
    if (cs.boxShadow !== "none") shadows.add(cs.boxShadow);

    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText || srOnly(rect)) continue;
    const px = Number.parseFloat(cs.fontSize);
    sizes.add(`${Math.round(px * 10) / 10}px`);
    families.add(cs.fontFamily);
    if (px < 12.95)
      tiny.push(
        `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 24)} ${px}px "${el.textContent.trim().slice(0, 20)}"`,
      );
    if (el.closest(":disabled, [aria-disabled='true']")) continue;
    const fg = parse(cs.color);
    const bg = effectiveBg(el);
    if (!fg || !bg) {
      unjudged++;
      continue;
    }
    const solid = over(fg, bg);
    const large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
    const need = large ? 3 : 4.5;
    const got = ratio(solid, bg);
    if (got < need)
      lowContrast.push(
        `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 24)} ${got.toFixed(2)}<${need} "${el.textContent.trim().slice(0, 18)}"`,
      );
  }

  for (const card of document.querySelectorAll(".fm-card, .fm-card--inset")) {
    let depth = 0;
    for (let n = card.parentElement; n; n = n.parentElement)
      if (n.matches(".fm-card, .fm-card--inset")) depth++;
    const outer = card.parentElement?.closest(".fm-card, .fm-card--inset");
    if (depth > 1 || (outer?.matches(".fm-card--inset") && card.matches(".fm-card")))
      cardDepth.push(`${card.className} depth ${depth + 1}`);
  }

  const fontsLoaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  return {
    elements,
    unjudged,
    colors,
    sizes: [...sizes].sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b)),
    radii: [...radii],
    shadows: [...shadows],
    families: [...families],
    tiny,
    lowContrast,
    cardDepth,
    fontsLoaded,
    external: [],
    activeTheme: document.documentElement.dataset.theme || "auto",
  };
}

/** Opens the specimen in embed mode with the given options and returns the page. */
export async function openSpecimen(browser, origin, opts = {}) {
  const { width = 390, height = 844, ...q } = opts;
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: q.theme === "dark" ? "dark" : "light",
    reducedMotion: q.motion === "reduce" ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const external = [];
  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith(origin) && !url.startsWith("data:") && !url.startsWith("blob:"))
      external.push(url);
  });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  const params = new URLSearchParams({ embed: "1", ...q });
  await page.goto(`${origin}${SPECIMEN}?${params}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__fmReady === true, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, external, pageErrors };
}
