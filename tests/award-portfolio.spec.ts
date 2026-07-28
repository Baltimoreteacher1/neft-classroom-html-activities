/**
 * Award portfolio — browser tests for the critical integrated flows.
 *
 * These cover the paths a person actually walks: a student arriving at the
 * curriculum, choosing supports, playing Number Realm, seeing evidence reach
 * their progress view, and a judge running a demonstration — plus the security
 * posture the audit remediated.
 *
 * Run with `npm run e2e` (or `npx playwright test tests/award-portfolio.spec.ts`).
 * The config builds and serves `dist/`, so these exercise the shipped output.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Seed a Number Realm hero the way real play would leave it. */
async function seedNumberRealmHero(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mrpg:hero",
      JSON.stringify({
        v: 2,
        name: "Test Hero",
        mastery: { "6.AT.A.3": { correct: 5, total: 7 } },
        achievements: { "first-victory": true },
        stats: { hintsUsed: 2, problemsSolved: 12 },
      }),
    );
    localStorage.setItem("mrpg:unit3", JSON.stringify({ v: 2, unitId: 3, cleared: { u3c1: true } }));
  });
}

test.describe("curriculum hub — Signature Experiences", () => {
  test("renders the five approved products from the registry", async ({ page }) => {
    await page.goto("/curriculum/");
    const strip = page.locator("#signature-experiences");
    await expect(strip).toBeVisible();

    const cards = strip.locator(".ewl-product-card");
    await expect(cards).toHaveCount(5);

    for (const name of [
      "Number Realm",
      "Language Bridge",
      "Design Studio",
      "Personalized Math Path",
      "Teacher Studio",
    ]) {
      await expect(strip.getByRole("heading", { name, level: 3 })).toBeVisible();
    }
  });

  test("the excluded product is absent from Signature Experiences but still reachable", async ({
    page,
  }) => {
    await page.goto("/curriculum/");
    const strip = page.locator("#signature-experiences");
    await expect(strip).toContainText("Number Realm");
    await expect(strip).not.toContainText(/monster/i);

    // ...and the product itself is untouched and still live.
    const response = await page.goto("/curriculum/monster-math-academy/");
    expect(response?.status()).toBeLessThan(400);
  });

  test("each card states audience, purpose, units, and save/resume support", async ({ page }) => {
    await page.goto("/curriculum/");
    const card = page.locator('.ewl-product-card[data-product-id="number-realm"]');
    await expect(card).toContainText("For students");
    await expect(card).toContainText("Purpose");
    await expect(card).toContainText("Curriculum");
    await expect(card).toContainText("Save & resume");
    await expect(card.getByRole("link", { name: /Open Number Realm/ })).toHaveAttribute(
      "href",
      "/math-rpg/",
    );
  });
});

test.describe("support profile persists across products", () => {
  test("a support chosen once is honoured on a different surface", async ({ page }) => {
    await page.goto("/language-bridge/");
    await page.evaluate(() => {
      (window as any).EWLSupportProfile.set({ largerText: true, interfaceLanguage: "es" });
    });
    await expect(page.locator("html")).toHaveAttribute("data-ewl-larger-text", "on");

    // A completely different product page, same browser.
    await page.goto("/curriculum/");
    await expect(page.locator("html")).toHaveAttribute("data-ewl-larger-text", "on");
    await expect(page.locator("html")).toHaveAttribute("data-ewl-language", "es");
  });

  test("the profile stores no sensitive fields", async ({ page }) => {
    await page.goto("/language-bridge/");
    const stored = await page.evaluate(() => {
      (window as any).EWLSupportProfile.set({ readAloud: true });
      return localStorage.getItem("ewl:support-profile:v1") ?? "";
    });
    for (const token of ["diagnos", "iep", "504", "disabilit", "medical"]) {
      expect(stored.toLowerCase()).not.toContain(token);
    }
  });
});

test.describe("scaffold ladder", () => {
  test("the question and learning target are identical at every rung", async ({ page }) => {
    await page.goto("/language-bridge/#scaffold-ladder");
    const scaffold = page.locator(".ewl-scaffold").first();
    const prompt = await scaffold.locator(".ewl-scaffold-prompt").textContent();
    const target = await scaffold.locator(".ewl-scaffold-target").textContent();

    const rungs = scaffold.locator(".ewl-scaffold-rung");
    await expect(rungs).toHaveCount(5);

    const count = await rungs.count();
    for (let i = 0; i < count; i++) {
      await rungs.nth(i).click();
      expect(await scaffold.locator(".ewl-scaffold-prompt").textContent()).toBe(prompt);
      expect(await scaffold.locator(".ewl-scaffold-target").textContent()).toBe(target);
    }
  });

  test("the rung picker is operable by keyboard", async ({ page }) => {
    await page.goto("/language-bridge/#scaffold-ladder");
    const scaffold = page.locator(".ewl-scaffold").first();
    const first = scaffold.locator(".ewl-scaffold-rung").first();
    await first.focus();
    await page.keyboard.press("ArrowRight");
    // Focus moved and the new rung is the checked one — the radiogroup pattern.
    const checked = scaffold.locator('.ewl-scaffold-rung[aria-checked="true"]');
    await expect(checked).toHaveCount(1);
    await expect(checked).toBeFocused();
  });

  test("records the support tier used without lowering anything", async ({ page }) => {
    await page.goto("/language-bridge/#scaffold-ladder");
    const scaffold = page.locator(".ewl-scaffold").first();
    await scaffold.locator('.ewl-scaffold-rung[data-level="2"]').click();

    const events = await page.evaluate(() =>
      (window as any).EWLEvidence.all({ activityId: "scaffold-ladder" }),
    );
    const supportEvent = events.find((e: any) => e.eventType === "support_used");
    expect(supportEvent).toBeTruthy();
    expect(supportEvent.supportLevel).toBe("tier-2");
    // Support use carries no score at all — it cannot depress a grade.
    expect(supportEvent.score).toBeNull();
  });
});

test.describe("Number Realm evidence reaches the shared layer", () => {
  test("a realm normalizes hero progress into evidence events", async ({ page }) => {
    await seedNumberRealmHero(page);
    await page.goto("/math-rpg/unit-3/");

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const ev = (window as any).EWLEvidence;
            return ev ? ev.all({ productId: "number-realm" }).length : 0;
          }),
        { timeout: 10_000 },
      )
      .toBeGreaterThan(0);

    const standards = await page.evaluate(() =>
      (window as any).EWLEvidence.all({ productId: "number-realm" }).flatMap(
        (e: any) => e.standardIds,
      ),
    );
    // The cluster-qualified code the game records resolves to the canonical one.
    expect(standards).toContain("6.AT.3");
    expect(standards).not.toContain("6.AT.A.3");
  });

  test("the adapter never modifies Number Realm's own storage", async ({ page }) => {
    await seedNumberRealmHero(page);
    await page.goto("/math-rpg/unit-3/");
    const before = await page.evaluate(() => localStorage.getItem("mrpg:hero"));
    await page.evaluate(() => (window as any).EWLEvidence.sync());
    const after = await page.evaluate(() => localStorage.getItem("mrpg:hero"));
    expect(after).toBe(before);
  });

  test("progress surfaces in My Math Path with a stated reason", async ({ page }) => {
    await seedNumberRealmHero(page);
    await page.goto("/math/my-path/");

    const card = page.locator("#ewlLoopCard");
    await expect(card).toBeVisible({ timeout: 10_000 });
    const items = card.locator(".ewl-loop-item");
    await expect(items.first()).toBeVisible();
    // Every recommendation must carry a plain-language reason.
    await expect(items.first().locator("p")).not.toBeEmpty();
  });
});

test.describe("judge mode", () => {
  const products = [
    "number-realm",
    "language-bridge",
    "design-studio",
    "personalized-math-path",
    "grade6-curriculum-system",
    "teacher-studio",
  ];

  for (const slug of products) {
    test(`${slug} walkthrough runs on synthetic data only`, async ({ page }) => {
      // Plant a real record first: the demo must not be able to see it.
      await page.addInitScript(() => {
        localStorage.setItem(
          "ewl:evidence:v1",
          JSON.stringify({
            v: 1,
            events: [
              {
                v: 1,
                eventId: "real-student-event",
                eventType: "activity_completed",
                activityId: "REAL-WORK",
                standardIds: [],
                misconceptionCodes: [],
                timestamp: "2026-01-01T00:00:00.000Z",
              },
            ],
          }),
        );
      });

      await page.goto(`/judge-mode/${slug}/`);
      await expect(page.getByText("Simulated data — no real students")).toBeVisible();

      const isolated = await page.evaluate(() => {
        const ev = (window as any).EWLEvidence;
        return {
          synthetic: ev.isSynthetic(),
          leaks: ev.all({ activityId: "REAL-WORK" }).length,
          allSynthetic: ev.all().every((e: any) => e.synthetic === true),
        };
      });
      expect(isolated.synthetic).toBe(true);
      expect(isolated.leaks).toBe(0);
      expect(isolated.allSynthetic).toBe(true);

      // The real record is still on disk, untouched by the demo.
      const stored = await page.evaluate(() => localStorage.getItem("ewl:evidence:v1") ?? "");
      expect(stored).toContain("real-student-event");
    });
  }

  test("steps forward and resets to an identical first step", async ({ page }) => {
    await page.goto("/judge-mode/number-realm/");
    const firstHeading = await page.locator(".ewl-section h2").last().textContent();

    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText(/Step 2 of/)).toBeVisible();

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page.getByText(/Step 1 of/)).toBeVisible();
    expect(await page.locator(".ewl-section h2").last().textContent()).toBe(firstHeading);
  });

  test("shows the evidence record backing a step", async ({ page }) => {
    await page.goto("/judge-mode/number-realm/");
    // Step 3 is the first with an attached evidence record.
    await page.getByRole("button", { name: "Next step" }).click();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.locator(".ewl-table")).toBeVisible();
    await expect(page.locator(".ewl-table")).toContainText("Simulated");
  });
});

test.describe("public security posture", () => {
  // The preview server is necessarily on localhost, which the page correctly
  // treats as a developer host. `?ewlProduction=1` forces the restricted
  // posture — it is a one-way flag and cannot grant dev access.
  test("the Command Center exposes no dev-only controls on a non-local host", async ({ page }) => {
    await page.goto("/math/command-center/?ewlProduction=1");

    // The dev sections are removed from the DOM, not merely hidden.
    await expect(page.locator("#terminal-section")).toHaveCount(0);
    await expect(page.locator("#tool-selector-section")).toHaveCount(0);
    await expect(page.locator("#admin-dashboards")).toHaveCount(0);

    // No student roster table of any kind.
    await expect(page.locator("#progress-table")).toHaveCount(0);
    await expect(page.locator("#progress-search")).toHaveCount(0);

    // And the status panel makes an honest claim rather than "connecting…".
    await expect(page.locator("#status-panel")).toContainText(
      "Build tools run on a workstation, not in the browser",
    );
  });

  test("the Command Center never claims a live connection publicly", async ({ page }) => {
    await page.goto("/math/command-center/?ewlProduction=1");
    await page.waitForTimeout(1000);
    await expect(page.locator("#status-panel")).not.toContainText("Connected");
    await expect(page.getByRole("button", { name: /Run Build|Run Audit|Run QA Loop/ })).toHaveCount(
      0,
    );
  });
});

test.describe("legacy routes and accessibility", () => {
  test("legacy /math/unit-N/ routes still resolve", async ({ page }) => {
    for (const unit of [1, 3, 10]) {
      const response = await page.goto(`/math/unit-${unit}/`);
      expect(response?.status(), `unit ${unit}`).toBeLessThan(400);
    }
  });

  test("the canonical registry resolves legacy aliases", async ({ page }) => {
    await page.goto("/language-bridge/");
    const resolved = await page.evaluate(async () => {
      const reg = (window as any).EWLRegistry;
      if (!reg) {
        // The registry client is not on every page; load it on demand.
        await new Promise<void>((done) => {
          const s = document.createElement("script");
          s.src = "/shared/evidence/curriculum-registry-client.js";
          s.onload = () => done();
          document.head.appendChild(s);
        });
      }
      await (window as any).EWLRegistry.load();
      return {
        oldStandard: (window as any).EWLRegistry.resolve("6.RP.1"),
        clustered: (window as any).EWLRegistry.resolve("6.AT.A.1"),
        legacyUnit: (window as any).EWLRegistry.resolve("/math/unit-3/"),
      };
    });
    expect(resolved.oldStandard).toBe("6.AT.1");
    expect(resolved.clustered).toBe("6.AT.1");
    expect(resolved.legacyUnit).toBe("unit-3");
  });

  for (const route of ["/language-bridge/", "/design-studio/", "/teacher-studio/", "/judge-mode/"]) {
    test(`${route} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(route);
      // Give the registry-driven product cards a moment to render.
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        serious,
        serious.map((v) => `${v.id}: ${v.help}`).join("\n"),
      ).toEqual([]);
    });
  }

  test("the new hubs are reachable by keyboard from the curriculum hub", async ({ page }) => {
    await page.goto("/curriculum/");
    const link = page.locator('#signature-experiences a[href="/language-bridge/"]').first();
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/language-bridge\//);
  });
});

/**
 * Rollout coverage — the support profile is only a support *system* if it
 * reaches the pages a learner actually works on. These assert it crosses from
 * the hub into a real lesson, a real game, Number Realm, and a project, which
 * is what tools/inject-support-profile.js exists to guarantee.
 */
test.describe("support profile reaches real activity pages", () => {
  const surfaces = [
    { name: "a lesson", route: "/lessons/3-1/" },
    { name: "Number Realm", route: "/math-rpg/unit-3/" },
    { name: "the Math Workbench", route: "/curriculum/math-workbench/" },
    { name: "a culminating project", route: "/math/unit-3/projects/version-a/" },
    { name: "My Math Progress", route: "/math/my-progress/" },
  ];

  for (const surface of surfaces) {
    test(`a support chosen on the hub applies on ${surface.name}`, async ({ page }) => {
      // Choose the supports once, the way a learner would.
      await page.addInitScript(() => {
        localStorage.setItem(
          "ewl:support-profile:v1",
          JSON.stringify({ v: 1, largerText: true, highContrast: true, interfaceLanguage: "es" }),
        );
      });

      await page.goto(surface.route);
      const root = page.locator("html");
      await expect(root).toHaveAttribute("data-ewl-larger-text", "on");
      await expect(root).toHaveAttribute("data-ewl-high-contrast", "on");
      await expect(root).toHaveAttribute("data-ewl-language", "es");
    });
  }

  test("a learner who has chosen nothing sees no profile attributes at all", async ({ page }) => {
    await page.goto("/lessons/3-1/");
    const root = page.locator("html");
    // The layer must be completely inert until a support is turned on.
    await expect(root).not.toHaveAttribute("data-ewl-larger-text", "on");
    await expect(root).not.toHaveAttribute("data-ewl-high-contrast", "on");
    await expect(root).toHaveAttribute("data-ewl-language", "en");
  });

  test("the excluded product carries no award-portfolio layer", async ({ page }) => {
    // Monster Math Academy is out of scope: its code must not be modified, so
    // the support profile is deliberately absent there. See the note in
    // tools/inject-support-profile.js.
    await page.goto("/curriculum/monster-math-academy/");
    const layers = await page.evaluate(() =>
      [...document.querySelectorAll("script[src], link[href]")]
        .map((el) => el.getAttribute("src") || el.getAttribute("href") || "")
        .filter((u) => u.includes("/shared/support/") || u.includes("/shared/portfolio/")),
    );
    expect(layers).toEqual([]);
  });
});

/**
 * The evidence adapters, exercised through the page that consumes them. These
 * seed each source store the way real use would leave it, then assert the
 * shared layer picked it up — including the privacy contract, which is the part
 * most worth guarding.
 */
test.describe("evidence adapters populate the shared layer", () => {
  test("a completed project reaches evidence without inventing a standard", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "nt-project-complete:v1",
        JSON.stringify({
          "/math/unit-3/projects/version-a/": {
            unit: 3,
            title: "Ratio City Build",
            completedAt: "2026-05-04T13:15:00.000Z",
            stars: 3,
            rubricTotal: 17,
            rubricMax: 20,
          },
        }),
      );
    });
    await page.goto("/math/my-path/");

    const submitted = await page.evaluate(async () => {
      await (window as any).EWLEvidence.sync();
      return (window as any).EWLEvidence.all({ productId: "design-studio" }).find(
        (e: any) => e.eventType === "project_submitted",
      );
    });

    expect(submitted).toBeTruthy();
    expect(submitted.score).toBe(17);
    expect(submitted.maxScore).toBe(20);
    expect(submitted.unitId).toBe("unit-3");
    expect(submitted.standardIds).toEqual([]);
  });

  test("an assessment result reaches evidence with the student name stripped", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "nt_results_log",
        JSON.stringify([
          {
            "Student Name": "Alex Rivera",
            Class: "6B",
            Assessment: "Unit 3 Review",
            Score: 16,
            Standard: "6.AT.3",
            Skill: "Overall",
            "Question/Item": "20 items",
            Date: "2026-05-04",
            "ESOL Level": "3",
            "IEP/504": "Yes",
          },
        ]),
      );
    });
    await page.goto("/math/my-path/");

    const result = await page.evaluate(async () => {
      await (window as any).EWLEvidence.sync();
      const events = (window as any).EWLEvidence.all({ eventType: "assessment_scored" });
      return { events, serialized: JSON.stringify(events) };
    });

    expect(result.events.length).toBe(1);
    expect(result.events[0].score).toBe(16);
    expect(result.events[0].standardIds).toContain("6.AT.3");
    // The results log holds a real name and an IEP marker. Neither may cross.
    expect(result.serialized).not.toContain("Alex");
    expect(result.serialized).not.toContain("Rivera");
    expect(result.serialized).not.toContain("IEP");
  });

  test("evidence from several products aggregates per standard", async ({ page }) => {
    await seedNumberRealmHero(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "nt_results_log",
        JSON.stringify([
          {
            Assessment: "Unit 3 Review",
            Score: 16,
            Standard: "6.AT.3",
            Skill: "Overall",
            "Question/Item": "20 items",
            Date: "2026-05-04",
          },
        ]),
      );
    });
    await page.goto("/math/my-path/");

    const rollup = await page.evaluate(async () => {
      await (window as any).EWLEvidence.sync();
      return (window as any).EWLEvidence.byStandard()["6.AT.3"];
    });

    // Number Realm mastery (5/7) plus the assessment (16/20) land on the same
    // standard — the point of having one shared evidence layer.
    expect(rollup).toBeTruthy();
    expect(rollup.maxScore).toBe(27);
    expect(rollup.score).toBe(21);
  });

  test("syncing twice records nothing new", async ({ page }) => {
    await seedNumberRealmHero(page);
    await page.goto("/math/my-path/");
    const counts = await page.evaluate(async () => {
      const ev = (window as any).EWLEvidence;
      await ev.sync();
      const first = ev.all().length;
      const second = (await ev.sync()).length;
      return { first, second };
    });
    expect(counts.first).toBeGreaterThan(0);
    expect(counts.second).toBe(0);
  });
});
