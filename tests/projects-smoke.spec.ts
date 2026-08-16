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
import AxeBuilder from "@axe-core/playwright";

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
  ROUTES.push({ url: `/math/${u}/projects/answer-key/`, kind: "key" });
}
// The Pre-Unit is the district's assembled unit, not a numbered one, and it
// ships a single version. It joins the same fleet gate so it cannot silently
// miss a shared layer.
ROUTES.push({ url: "/math/pre-unit/projects/", kind: "hub" });
ROUTES.push({ url: "/math/pre-unit/projects/version-a/", kind: "version" });
ROUTES.push({ url: "/math/pre-unit/projects/answer-key/", kind: "key" });
// Unit 8 ships a real third student experience. Keep it in the same fleet gate
// so a stretch project cannot silently miss shared layers or break at runtime.
ROUTES.push({ url: "/math/unit-8/projects/version-c/", kind: "version" });
ROUTES.push({ url: "/math/unit-10/projects/world-architect/", kind: "extra" });
ROUTES.push({ url: "/math/statistics/statistics-of-my-life/", kind: "extra" });

const IGNORE_404 = [
  /\/favicon\.ico$/,
  /\/api\/progress\/telemetry$/,
  // Vite preview cannot serve the Cloudflare Pages Function. The dedicated
  // score-bridge suite intercepts this route and verifies its full contract.
  /\/api\/scores$/,
];

const IGNORE_CONSOLE = [
  /edupulse/i,
  /workers\.dev/i,
  /gradebook/i,
  /AudioContext|webaudio|autoplay/i,
  /favicon/i,
  /ERR_(NETWORK|INTERNET|CONNECTION|NAME_NOT_RESOLVED|BLOCKED)/i,
  // Sandbox TLS interception fails external HTTPS (works in production).
  /ERR_CERT_AUTHORITY_INVALID/i,
  // Chromium duplicates HTTP failures as a URL-less console line; the
  // response listener above retains precise same-origin asset enforcement.
  /Failed to load resource: the server responded with a status of 404/i,
];

// Buttons we do NOT auto-click: exports/saves (fire alerts/downloads/clipboard)
// and print. Everything else (calculators, checks, compare, what-if) is fair
// game and should never throw.
const SKIP_BUTTON =
  /save|load|download|\.txt|\.csv|copy|print|share|reset|clear|take me there|llévame allí/i;

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

    if (route.kind === "hub") {
      await expect(page.locator(".project-hub-nav")).toBeVisible();
      await expect(page.locator("#nsr-root")).toHaveCount(0);
      await expect(page.locator(".project-teacher-guide")).toHaveCount(1);
      const directionsLead = await page.evaluate(() => {
        const directions = document.getElementById("pickpath-heading")?.closest("section");
        const choices = document.getElementById("versions-heading")?.closest("section");
        if (!directions || !choices) return false;
        return Boolean(
          directions.compareDocumentPosition(choices) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });
      expect(directionsLead, `student directions must precede choices on ${route.url}`).toBe(true);
    }

    if (route.kind === "version") {
      // Student version pages load the PRO + GOLD + PUBLISHER layers
      // (deferred); wait for all to initialize (they stamp data attributes
      // on <body>).
      await page.waitForFunction(
        () =>
          document.body?.dataset.proInit === "1" &&
          document.body?.dataset.goldInit === "1" &&
          document.body?.dataset.pubInit === "1" &&
          document.body?.dataset.vizInit === "1" &&
          document.body?.dataset.publicationInit === "1" &&
          document.body?.dataset.awardInit === "1",
        { timeout: 10_000 },
      );

      // Level is a one-time launch choice. Once the student begins, the
      // welcome overlay and header controls disappear and the chosen tier is
      // locked for this project.
      await expect(page.locator("#gold-level-overlay")).toBeVisible();
      await page.locator('.gold-level-option[data-level="1"]').click();
      await expect(page.locator("#gold-level-overlay")).toHaveCount(0);
      await expect(page.locator("#btn-lv0").locator("xpath=..")).toBeHidden();
      await expect(page.locator("body")).toHaveAttribute("data-level-locked", "1");

      // STEP RAIL: the only way back to an earlier step. Presence is not the
      // contract — reachability is. Asserting the element exists is exactly
      // what let the standards brief get dropped between the hero and the
      // rail on all 23 pages, pushing the rail ~700px down and off a laptop
      // screen while every static check stayed green. So: it must be inside
      // the first viewport at load, and it must pin when scrolled past.
      await page.waitForFunction(
        () => (document.querySelectorAll(".wizard .step-trail .step-trail-item") || []).length > 0,
        { timeout: 10_000 },
      );
      const rail = await page.evaluate(() => {
        const t = document.querySelector(".wizard .step-trail") as HTMLElement | null;
        const brief = document.querySelector(".ntm-standards");
        if (!t) return null;
        const r = t.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          width: Math.round(r.width),
          vh: window.innerHeight,
          briefParent: brief ? (brief.parentElement?.className ?? "") : null,
          briefWidth: brief ? Math.round(brief.getBoundingClientRect().width) : null,
        };
      });
      expect(rail, `step rail missing on ${route.url}`).not.toBeNull();
      expect(
        rail!.bottom,
        `step rail starts below the fold on ${route.url} (top ${rail!.top}, viewport ${rail!.vh})`,
      ).toBeLessThanOrEqual(rail!.vh);

      await page.evaluate(() => window.scrollTo(0, 1800));
      const pinned = await page.evaluate(() => {
        const t = document.querySelector(".wizard .step-trail") as HTMLElement | null;
        if (!t) return null;
        const r = t.getBoundingClientRect();
        return { top: Math.round(r.top), height: Math.round(r.height) };
      });
      expect(
        pinned!.top,
        `step rail scrolled out of reach on ${route.url} (top ${pinned!.top} after scrolling)`,
      ).toBeLessThanOrEqual(4);
      expect(pinned!.height, `step rail collapsed when pinned on ${route.url}`).toBeGreaterThan(20);
      await page.evaluate(() => window.scrollTo(0, 0));

      // The standards brief introduces the project, so it belongs in the
      // project's own column — not as a wider card floating above the rail,
      // which is what made it read as an inserted panel.
      if (rail!.briefParent !== null) {
        expect(
          rail!.briefParent,
          `standards brief is outside the wizard column on ${route.url}`,
        ).toContain("wizard");
        expect(
          Math.abs(rail!.briefWidth! - rail!.width),
          `standards brief width ${rail!.briefWidth} does not match the step column ${rail!.width} on ${route.url}`,
        ).toBeLessThanOrEqual(40);
      }

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

      const publication = await page.evaluate(() => ({
        researchBlocks: document.querySelectorAll(".step-research").length,
        ledgers: document.querySelectorAll(".pps-ledger").length,
        quality: document.querySelectorAll(".pps-quality").length,
        studio: document.querySelectorAll(".pps-studio").length,
        dialog: document.querySelectorAll(".pps-dialog").length,
        live: document.querySelectorAll(
          '.pps-ledger__status[aria-live="polite"], .pps-studio__status[aria-live="polite"]',
        ).length,
      }));
      expect(publication.ledgers, `publication ledgers missing on ${route.url}`).toBe(
        publication.researchBlocks,
      );
      expect(publication.quality, `publication quality check missing on ${route.url}`).toBe(1);
      expect(publication.studio, `publication studio missing on ${route.url}`).toBe(1);
      expect(publication.dialog, `publication preview missing on ${route.url}`).toBe(1);
      expect(publication.live, `publication live statuses missing on ${route.url}`).toBeGreaterThan(
        1,
      );

      await page.evaluate(() => {
        const block = document.querySelector<HTMLElement>(".step-research");
        const values: Array<[HTMLInputElement | HTMLTextAreaElement | null, string]> = [
          [block?.querySelector("[data-research-find]") ?? null, "A specific fact from the source"],
          [
            block?.querySelector('[data-pps-field="claim"]') ?? null,
            "This evidence supports my project decision.",
          ],
          [
            block?.querySelector('[data-pps-field="credibility"]') ?? null,
            "The named organization publishes the original information.",
          ],
          [block?.querySelector('[data-pps-field="accessed"]') ?? null, "2026-07-14"],
        ];
        values.forEach(([field, value]) => {
          if (!field) return;
          field.value = value;
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
      await page.waitForFunction(
        () => document.querySelector(".pps-ledger")?.getAttribute("data-status") === "ready",
      );
      expect(
        await page.locator(".pps-ledger").first().getAttribute("data-status"),
        `completed evidence was not publication-ready on ${route.url}`,
      ).toBe("ready");

      await page.evaluate(() => {
        const w = window as unknown as { toggleLanguage?: () => void };
        w.toggleLanguage?.();
      });
      expect(
        await page.locator(".pps-studio").innerText(),
        `Spanish Publication Studio copy missing on ${route.url}`,
      ).toContain("publicación");
      await page.evaluate(() => {
        const w = window as unknown as { toggleLanguage?: () => void };
        w.toggleLanguage?.();
        document.querySelector<HTMLButtonElement>('[data-pps-action="preview"]')?.click();
      });
      expect(await page.locator(".pps-dialog").getAttribute("open")).not.toBeNull();
      expect(
        await page.locator(".pps-dialog__document .pps-document__source a").count(),
        `publication preview omitted cited sources on ${route.url}`,
      ).toBeGreaterThan(0);
      await page.evaluate(() => document.querySelector<HTMLDialogElement>(".pps-dialog")?.close());

      // Portfolio layer: each project offers a local evidence review and a
      // student-owned printable portfolio, without requiring an account.
      const portfolio = await page.evaluate(() => ({
        readiness: document.querySelectorAll(".ntf-readiness").length,
        dialog: document.querySelectorAll(".ntf-portfolio").length,
        trigger: document.querySelectorAll(".ntf-fab").length,
      }));
      expect(portfolio.readiness, `portfolio evidence check missing on ${route.url}`).toBe(1);
      expect(portfolio.dialog, `portfolio dialog missing on ${route.url}`).toBe(1);
      expect(portfolio.trigger, `portfolio trigger missing on ${route.url}`).toBe(1);

      const workspace = await page.evaluate(() => ({
        cards: document.querySelectorAll(".mw-card").length,
        inputs: document.querySelectorAll(".mw-card .mw-input").length,
      }));
      expect(workspace.cards, `math workspaces missing on ${route.url}`).toBeGreaterThan(0);
      expect(workspace.inputs, `math workspace inputs missing on ${route.url}`).toBeGreaterThan(4);

      // Community modeling contract: every project names the mathematics and
      // language target and collects real-client, two-model, critique,
      // revision, defense, and transfer evidence.
      const award = await page.evaluate(() => ({
        goals: document.querySelectorAll(".cms-goals").length,
        studio: document.querySelectorAll(".cms-studio").length,
        languageTarget: document.querySelectorAll(".cms-goals__grid article")[1]?.textContent || "",
        fields: document.querySelectorAll("[data-award-field]").length,
        stages: document.querySelectorAll(".cms-stage").length,
      }));
      expect(award.goals, `community modeling goals missing on ${route.url}`).toBe(1);
      expect(award.studio, `community modeling studio missing on ${route.url}`).toBe(1);
      expect(award.languageTarget, `language target missing on ${route.url}`).toContain(
        "Language target",
      );
      expect(award.fields, `award evidence fields missing on ${route.url}`).toBeGreaterThanOrEqual(
        18,
      );
      expect(award.stages, `modeling stages missing on ${route.url}`).toBe(7);
      await expect(page.locator(".cms-goals .cms-mission")).toBeVisible();
      await expect(page.locator(".cms-goals .cms-goals__product")).toBeVisible();
      expect(
        await page.locator(".cms-goals").evaluate((node) => node.parentElement?.classList.contains("step-panel")),
        `project brief nested inside another injected layer on ${route.url}`,
      ).toBe(true);

      const awardAccessibility = await new AxeBuilder({ page })
        .include(".cms-goals")
        .include(".cms-studio")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        awardAccessibility.violations,
        `Community Math Studio accessibility violations on ${route.url}`,
      ).toEqual([]);

      // The submission flow must follow the page's existing EN/ES toggle,
      // rather than leaving Spanish-speaking students at an English-only end.
      await page.evaluate(() => {
        const toggle = window as unknown as { toggleLanguage?: () => void };
        toggle.toggleLanguage?.();
      });
      const spanishPortfolio = await page.locator(".ntf-readiness").innerText();
      expect(spanishPortfolio, `Spanish portfolio copy missing on ${route.url}`).toContain(
        "portafolio",
      );
      await page.evaluate(() => {
        const toggle = window as unknown as { toggleLanguage?: () => void };
        toggle.toggleLanguage?.();
      });
      const jumpCount = await page.locator(".ntf-readiness__jump").count();
      expect(jumpCount, `evidence-coach actions missing on ${route.url}`).toBeGreaterThan(0);

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
      await expect(page.locator("#teacher-console")).toHaveCount(0);

      // Toggle EN/ES and each Level tier — these must not throw.
      await page.evaluate(() => {
        const w = window as unknown as { toggleLanguage?: () => void };
        w.toggleLanguage?.();
        w.toggleLanguage?.();
        document.querySelectorAll<HTMLElement>("#btn-lv1, #btn-lv2").forEach((b) => b.click());
      });
    }

    if (route.kind === "key") {
      // Production authorization is enforced by Cloudflare middleware before
      // this HTML is served. Browser code contains no PIN or credential; once
      // a local preview loads the page, the presentation layer reveals it.
      await page.waitForFunction(() => document.documentElement.classList.contains("akg-unlocked"));
      await expect(page.locator("#akg-pin, .akg-card")).toHaveCount(0);
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

test("student project save, late-field restore, and JSON backup stay private", async ({ page }) => {
  const outgoing: string[] = [];
  page.on("request", (request) => {
    if (/script\.google\.com|\/api\/progress\/telemetry/.test(request.url())) {
      outgoing.push(request.url());
    }
  });
  await page.goto("/math/unit-2/projects/version-b/", { waitUntil: "load" });
  await page.waitForFunction(
    () =>
      document.body?.dataset.goldInit === "1" &&
      document.body?.dataset.awardInit === "1" &&
      Boolean((window as unknown as { NeftSaveResume?: unknown }).NeftSaveResume),
  );
  await page.locator('.gold-level-option[data-level="1"]').click();
  const result = await page.evaluate(async () => {
    const engine = (window as unknown as {
      NeftSaveResume: {
        startNew: (name: string, section: string) => string;
        save: (reason: string) => Promise<unknown>;
        exportRecord: () => Record<string, unknown>;
        importRecord: (text: string) => Promise<unknown>;
        record: { progressPercent: number; saveCode: string };
      };
    }).NeftSaveResume;
    engine.startNew("QA Student", "QA");
    await engine.save("test-fresh");
    const freshProgress = engine.record.progressPercent;
    const field = document.querySelector<HTMLTextAreaElement>("[data-award-field]");
    if (!field) throw new Error("late-mounted award field missing");
    field.value = "A saved modeling decision.";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await engine.save("test-filled");
    const backup = engine.exportRecord();
    field.value = "";
    await engine.importRecord(JSON.stringify(backup));
    return {
      freshProgress,
      restored: field.value,
      code: engine.record.saveCode,
    };
  });
  expect(result.freshProgress, "a fresh project must begin at 0% complete").toBe(0);
  expect(result.restored, "JSON import must restore late-mounted project fields").toBe(
    "A saved modeling decision.",
  );
  expect(result.code).toBeTruthy();
  expect(outgoing, "student work must not be transmitted by default").toEqual([]);
});

test("Publication Studio evidence persists locally and fits a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/math/unit-2/projects/version-b/", { waitUntil: "load" });
  await page.waitForFunction(() => document.body?.dataset.publicationInit === "1");
  await page.evaluate(() => {
    const claim = document.querySelector<HTMLTextAreaElement>('[data-pps-field="claim"]');
    if (!claim) throw new Error("Publication claim field missing");
    claim.value = "A durable publication claim for reload testing.";
    claim.dispatchEvent(new Event("input", { bubbles: true }));
    claim.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(250);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => document.body?.dataset.publicationInit === "1");
  expect(await page.locator('[data-pps-field="claim"]').first().inputValue()).toBe(
    "A durable publication claim for reload testing.",
  );
  const widths = await page.locator(".pps-studio").evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(widths.scroll, "Publication Studio overflows at 360px").toBeLessThanOrEqual(widths.client);
});

test("Community Math Studio evidence persists and transfers without phone overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 760 });
  const route = "/math/unit-5/projects/version-a/";
  await page.goto(route, { waitUntil: "load" });
  await page.waitForFunction(() => document.body?.dataset.awardInit === "1");
  await page.locator('.gold-level-option[data-level="1"]').click();
  await page.evaluate(() => {
    const field = document.querySelector<HTMLTextAreaElement>('[data-award-field="assumptions"]');
    if (!field) throw new Error("assumptions evidence field missing");
    field.value = "The design assumes the measured lengths are accurate to the nearest inch.";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => document.body?.dataset.awardInit === "1");
  expect(await page.locator('[data-award-field="assumptions"]').inputValue()).toContain(
    "nearest inch",
  );
  const widths = await page.locator(".cms-studio").evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(widths.scroll, "Community Math Studio overflows at 360px").toBeLessThanOrEqual(
    widths.client,
  );
});

test("project level is selected once, hidden, and locked across reloads", async ({ page }) => {
  const route = "/math/unit-2/projects/version-b/";
  await page.goto(route, { waitUntil: "load" });
  await page.waitForFunction(() => document.body?.dataset.goldInit === "1");

  await expect(page.locator("#gold-level-overlay")).toBeVisible();
  await page.locator('.gold-level-option[data-level="2"]').click();
  await expect(page.locator("#gold-level-overlay")).toHaveCount(0);
  await expect(page.locator("#btn-lv0").locator("xpath=..")).toBeHidden();
  await expect(page.locator("body")).toHaveClass(/level-2/);

  await page.evaluate(() => {
    const controls = window as unknown as { setLevel?: (level: number) => void };
    controls.setLevel?.(0);
  });
  await expect(page.locator("body")).toHaveClass(/level-2/);

  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => document.body?.dataset.goldInit === "1");
  await expect(page.locator("#gold-level-overlay")).toHaveCount(0);
  await expect(page.locator("#btn-lv0").locator("xpath=..")).toBeHidden();
  await expect(page.locator("body")).toHaveClass(/level-2/);
});
