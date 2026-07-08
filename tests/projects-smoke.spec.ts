/**
 * Headless smoke test for the Grade 6 culminating unit projects.
 *
 * Covers every unit's project suite — the hub (`projects/`), both student
 * versions (`version-a`, `version-b`), the teacher answer key, and Unit 10's
 * World Architect — built to the "Stats of My Life" standard on top of the
 * shared PRO + GOLD layers (`/shared/projects/projects-pro.*`,
 * `projects-gold.*`, `answer-key-gate.*`).
 *
 * For each page it:
 *   - loads the page and waits for the PRO + GOLD layers to initialize,
 *   - on student version pages, asserts the wizard (step trail, panels,
 *     Level 1/2 toggles) rendered and the GOLD a11y invariants hold
 *     (aria-live readouts, aria-pressed toggles, clamped number inputs),
 *   - on answer-key pages, asserts the teacher gate is fail-closed (solutions
 *     hidden, wrong PIN stays locked, correct PIN unlocks),
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
      pageErrors.push(
        err.message + (err.stack ? "\n" + err.stack.split("\n").slice(0, 4).join("\n") : ""),
      ),
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
      // Student version pages load the PRO + GOLD + PUBLISHER layers
      // (deferred); wait for all to initialize (they stamp data attributes
      // on <body>).
      await page.waitForFunction(
        () =>
          document.body?.dataset.proInit === "1" &&
          document.body?.dataset.goldInit === "1" &&
          document.body?.dataset.pubInit === "1" &&
          document.body?.dataset.vizInit === "1",
        { timeout: 10_000 },
      );

      // VISUALS layer invariants: every version page ships a ./visuals.json,
      // so at least one interactive math-tool card must mount inside a step
      // panel and its manip widget must actually render (async fetch + lazy
      // manip-*.js load).
      await page.waitForFunction(
        () => {
          const holders = document.querySelectorAll(".step-panel .viz-card .pki-manip");
          return holders.length > 0 && Array.from(holders).every((h) => h.children.length > 0);
        },
        { timeout: 10_000 },
      );

      // PUBLISHER layer invariants: sentence-starter chips render on the
      // written-response boxes (unit-specific frames come from ./publisher.json
      // after an async fetch) and the Rate My Work self-assessment builds off
      // the rubric.
      await page.waitForFunction(
        () =>
          document.querySelectorAll(".pub-chip").length > 0 &&
          document.querySelectorAll(".pub-selfassess .pub-sa-btn").length > 0,
        { timeout: 10_000 },
      );
      const pub = await page.evaluate(() => ({
        starters: document.querySelectorAll(".pub-starters").length,
        textareas: document.querySelectorAll(".step-panel textarea:not(.pub-sa-goal)").length,
        exemplarTraits: document.querySelectorAll(".pub-exemplar .pub-trait").length,
        saRows: document.querySelectorAll(".pub-sa-row").length,
      }));
      expect(
        pub.starters,
        `starter chips missing on written-response boxes on ${route.url}`,
      ).toBeGreaterThanOrEqual(pub.textareas);
      expect(
        pub.exemplarTraits,
        `exemplar panel missing/empty on ${route.url} (publisher.json not served?)`,
      ).toBeGreaterThan(0);
      expect(pub.saRows, `Rate My Work rows missing on ${route.url}`).toBeGreaterThan(0);

      // The wizard must render its step trail, panels, and Level 1/2 toggles.
      const panels = await page.locator(".step-panel").count();
      expect(panels, `wizard panels did not render on ${route.url}`).toBeGreaterThan(0);
      const trail = await page.locator(".step-trail").count();
      expect(trail, `step trail did not render on ${route.url}`).toBeGreaterThan(0);
      const levelBtns = await page.locator("button.level-btn").count();
      expect(levelBtns, `Level 1/2 toggles missing on ${route.url}`).toBeGreaterThan(0);

      // GOLD layer invariants: announced readouts, stateful toggles, clamped
      // number inputs (no unbounded factor-loop inputs).
      const gold = await page.evaluate(() => {
        const readouts = Array.from(document.querySelectorAll(".readout"));
        const unannounced = readouts.filter((r) => r.getAttribute("aria-live") !== "polite").length;
        const lv1 = document.getElementById("btn-lv1");
        const unclamped = Array.from(
          document.querySelectorAll<HTMLInputElement>('input[type="number"]'),
        ).filter((i) => !i.max).length;
        return {
          readouts: readouts.length,
          unannounced,
          lv1Pressed: lv1 ? lv1.hasAttribute("aria-pressed") : true,
          unclamped,
        };
      });
      expect(gold.readouts, `no .readout regions found on ${route.url}`).toBeGreaterThan(0);
      expect(gold.unannounced, `readout(s) missing aria-live on ${route.url}`).toBe(0);
      expect(gold.lv1Pressed, `#btn-lv1 missing aria-pressed on ${route.url}`).toBe(true);
      expect(gold.unclamped, `unclamped number input(s) on ${route.url}`).toBe(0);

      // Toggle EN/ES and each Level tier — these must not throw.
      await page.evaluate(() => {
        const w = window as unknown as { toggleLanguage?: () => void };
        w.toggleLanguage?.();
        w.toggleLanguage?.();
        document.querySelectorAll<HTMLElement>("#btn-lv1, #btn-lv2").forEach((b) => b.click());
      });
    }

    if (route.kind === "key") {
      // Answer keys are teacher-gated (fail-closed): solutions stay hidden
      // until the teacher PIN unlocks them, and the gate card must show.
      const gateVisible = await page.locator(".akg-card").isVisible();
      expect(gateVisible, `answer-key gate card missing on ${route.url}`).toBe(true);
      const solutionsHidden = await page.evaluate(() => {
        // Structure-agnostic: keys use <main class="page-shell"> or <div class="wrap">.
        const el = Array.from(document.body.children).find(
          (c) => !c.classList.contains("akg-card") && !["SCRIPT", "LINK"].includes(c.tagName),
        );
        return el ? getComputedStyle(el).visibility === "hidden" : false;
      });
      expect(solutionsHidden, `solutions visible without PIN on ${route.url}`).toBe(true);

      // Wrong PIN stays locked.
      await page.fill("#akg-pin", "wrong-pin");
      await page.click("#akg-go");
      expect(
        await page.evaluate(() => document.documentElement.classList.contains("akg-unlocked")),
        `wrong PIN unlocked the answer key on ${route.url}`,
      ).toBe(false);

      // Correct PIN unlocks. (Client-side casual gate; the PIN also lives in
      // assets/curriculum-enhancements.js — keep in sync.)
      await page.fill("#akg-pin", "TeacherNeft");
      await page.click("#akg-go");
      await page.waitForFunction(() => document.documentElement.classList.contains("akg-unlocked"));
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
            el.click(); // exercise change/click handlers wired to toggles
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
          errs.push(
            `button "${(b.textContent || "").trim().slice(0, 30)}": ${(e as Error).message}`,
          );
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
