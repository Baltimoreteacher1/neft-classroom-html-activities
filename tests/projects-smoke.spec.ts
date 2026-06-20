/**
 * Headless smoke test for the Grade 6 culminating unit projects.
 *
 * Covers every unit's project suite — the hub (`projects/`), both student
 * versions (`version-a`, `version-b`), the teacher answer key, and Unit 10's
 * World Architect — built to the "Stats of My Life" standard on top of the
 * shared Projects Kit (`/shared/projects/*`).
 *
 * For each page it:
 *   - loads the page and lets the kit + tab bootstrap run,
 *   - asserts the shared kit (window.PK) loaded,
 *   - on student version pages, asserts the step tabs and Level 1/2 toggles
 *     actually rendered,
 *   - exercises the interactivity (fires input on every field, clicks every
 *     non-export button) and re-checks for thrown errors,
 *   - asserts no uncaught JS exceptions, no broken SAME-ORIGIN assets, and no
 *     unexpected console errors.
 *
 * Cross-origin gradebook calls and benign favicon/WebAudio noise are ignored —
 * they are not project defects.
 */
import { test, expect } from "@playwright/test";

const UNITS = [
  "unit-1",
  "unit-2",
  "unit-3",
  "unit-4",
  "unit-5",
  "unit-6",
  "unit-7",
  "unit-8",
  "unit-9",
  "unit-10",
  "statistics",
];

type Route = { url: string; kind: "hub" | "version" | "key" | "extra" };

const ROUTES: Route[] = [];
for (const u of UNITS) {
  ROUTES.push({ url: `/math/${u}/projects/`, kind: "hub" });
  ROUTES.push({ url: `/math/${u}/projects/version-a/`, kind: "version" });
  ROUTES.push({ url: `/math/${u}/projects/version-b/`, kind: "version" });
  // Statistics has no separate answer-key folder.
  if (u !== "statistics") {
    ROUTES.push({ url: `/math/${u}/projects/answer-key/`, kind: "key" });
  }
}
ROUTES.push({ url: "/math/unit-10/projects/world-architect/", kind: "extra" });

const IGNORE_404 = [/\/favicon\.ico$/];

const IGNORE_CONSOLE = [
  /edupulse/i,
  /workers\.dev/i,
  /gradebook/i,
  /AudioContext|webaudio|autoplay/i,
  /favicon/i,
  /ERR_(NETWORK|INTERNET|CONNECTION|NAME_NOT_RESOLVED|BLOCKED)/i,
  // Sandbox TLS interception fails external HTTPS (works in production).
  /ERR_CERT_AUTHORITY_INVALID/i,
];

// Buttons we do NOT auto-click: exports/saves (fire alerts/downloads/clipboard)
// and print. Everything else (calculators, checks, compare, what-if) is fair
// game and should never throw.
const SKIP_BUTTON = /save|load|download|\.txt|\.csv|copy|print|share|reset|clear/i;

for (const route of ROUTES) {
  test(`project ok: ${route.url}`, async ({ page, baseURL }) => {
    const pageErrors: string[] = [];
    const badResponses: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (err) =>
      pageErrors.push(err.message + (err.stack ? "\n" + err.stack.split("\n").slice(0, 4).join("\n") : "")),
    );
    page.on("response", (res) => {
      const u = res.url();
      if (baseURL && !u.startsWith(baseURL)) return; // ignore cross-origin
      if (res.status() < 400) return;
      if (IGNORE_404.some((re) => re.test(u))) return;
      badResponses.push(`${res.status()} ${u}`);
    });
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORE_CONSOLE.some((re) => re.test(text))) return;
      consoleErrors.push(text);
    });
    // PK.save() and friends use alert(); auto-dismiss so nothing hangs.
    page.on("dialog", (d) => d.dismiss().catch(() => {}));

    await page.goto(route.url, { waitUntil: "load", timeout: 30_000 });

    // Page must not be blank.
    const bodyLen = await page.evaluate(() => (document.body?.innerText || "").trim().length);
    expect(bodyLen, `page appears blank on ${route.url}`).toBeGreaterThan(60);

    if (route.kind === "version") {
      // Student version pages load the shared kit (deferred); wait for it.
      await page
        .waitForFunction(() => typeof (window as { PK?: unknown }).PK !== "undefined", {
          timeout: 10_000,
        })
        .catch(() => {});
      const hasPK = await page.evaluate(
        () => typeof (window as unknown as { PK?: unknown }).PK !== "undefined",
      );
      expect(hasPK, `window.PK (projects kit) missing on ${route.url}`).toBe(true);

      // Student version pages must build step tabs and Level 1/2 toggles.
      const tabs = await page.locator(".pk-tabs-wrap").count();
      expect(tabs, `step tabs did not render on ${route.url}`).toBeGreaterThan(0);
      const levelBtns = await page.locator("[data-level-btn]").count();
      expect(levelBtns, `Level 1/2 toggles missing on ${route.url}`).toBeGreaterThan(0);

      // Toggle EN/ES and each Level tier — these must not throw.
      await page.evaluate(() => {
        const w = window as unknown as { PK?: { toggleEs?: () => void } };
        w.PK?.toggleEs?.();
        w.PK?.toggleEs?.();
        document
          .querySelectorAll<HTMLElement>("[data-level-btn]")
          .forEach((b) => b.click());
      });
    }

    // Exercise interactivity: fire input/change on every field and click every
    // non-export button. Collect any thrown handler errors.
    const handlerErrors = await page.evaluate((skipSrc) => {
      const skip = new RegExp(skipSrc, "i");
      const errs: string[] = [];
      const fields = Array.from(
        document.querySelectorAll<HTMLInputElement>("input, textarea, select"),
      );
      fields.forEach((el) => {
        try {
          if (el.type === "checkbox" || el.type === "radio") {
            // leave as-is; clicking handled below
          } else if (el.tagName === "SELECT") {
            el.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            if (el.value === "" && el.type === "number") el.value = "3";
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          }
        } catch (e) {
          errs.push(`field ${el.id || el.name}: ${(e as Error).message}`);
        }
      });
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      buttons.forEach((b) => {
        const label = (b.textContent || "") + " " + (b.getAttribute("onclick") || "");
        if (skip.test(label)) return;
        if (b.closest(".pk-tablist") || b.classList.contains("pk-tab")) return; // tabs handled elsewhere
        try {
          b.click();
        } catch (e) {
          errs.push(`button "${(b.textContent || "").trim().slice(0, 30)}": ${(e as Error).message}`);
        }
      });
      return errs;
    }, SKIP_BUTTON.source);

    expect(handlerErrors, `handler error(s) on ${route.url}`).toEqual([]);
    expect(pageErrors, `uncaught error(s) on ${route.url}`).toEqual([]);
    expect(badResponses, `broken same-origin asset(s) on ${route.url}`).toEqual([]);
    expect(consoleErrors, `console error(s) on ${route.url}`).toEqual([]);
  });
}
