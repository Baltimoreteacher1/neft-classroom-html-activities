import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("small-group guided math studio", () => {
  test("Group 1 uses a leveled studio: vocab lab, guided retry-first practice, talk, and mission capstone", async ({
    page,
  }) => {
    await page.goto("/lessons/1-1-group1/");
    // Leveled Foundations voice greets the group in the hero.
    await expect(page.getByText(/We build this one step at a time/)).toBeVisible();
    await expect(page.getByLabel("Notice", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Wonder", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^I (notice|wonder)/i })).toHaveCount(0);

    // Vocabulary is the landing tab: the match game works immediately.
    const match = page.locator(".sg-match");
    await expect(
      match.getByText("Writing a whole number as a product of only prime numbers."),
    ).toBeVisible();
    await match.getByRole("button", { name: "Prime Factorization", exact: true }).click();
    await expect(match.getByText(/1 of \d+ unlocked/)).toBeVisible();

    // Learn It: readiness pulse + leveled build CTA earn the tab checkmark.
    await page.locator("#sg-tab-sg-tab-learn").click();
    await page.getByRole("button", { name: "I can try with support" }).first().click();
    await page.getByRole("button", { name: "Build it together →" }).click();
    await expect(page.locator("#sg-tab-sg-tab-learn")).toHaveClass(/done/);

    // Guided practice: retry-first feedback with award wording + streak chip.
    await page.locator("#sg-tab-sg-tab-guided").click();
    const guided = page.locator("#sg-guided-practice");
    const firstProblem = guided.locator(".prob").first();
    await firstProblem.getByLabel("Your answer").fill("41");
    await firstProblem.getByRole("button", { name: "Check my thinking" }).click();
    await expect(firstProblem.getByText(/Not yet/)).toBeVisible();
    await firstProblem.getByLabel("Your answer").fill("2 x 3 x 7");
    await firstProblem.getByRole("button", { name: "Check my thinking" }).click();
    await expect(firstProblem.getByText(/Your reasoning landed/)).toBeVisible();
    await guided.getByRole("button", { name: "Next problem →" }).click();
    const secondProblem = guided.locator(".prob").nth(1);
    await secondProblem.getByLabel("Your answer").fill("2 x 3 x 3 x 3");
    await secondProblem.getByRole("button", { name: "Check my thinking" }).click();
    await expect(secondProblem.getByText(/Your reasoning landed/)).toBeVisible();
    await expect(page.locator(".sg-streak")).toHaveText(/2 in a row/);

    // Team talk lives inside the Practice tab.
    await page.locator("#sg-tab-sg-tab-practice").click();
    await expect(page.getByRole("heading", { name: "Talk the math through" })).toBeVisible();
    await expect(page.getByText(/Solver: explain one step/)).toBeVisible();
    await page.getByRole("button", { name: /Start optional talk timer/ }).click();
    await expect(page.getByRole("timer")).not.toHaveText("1:00");

    // The mission caps the studio in More Practice.
    await page.locator("#sg-tab-sg-tab-more").click();
    await expect(page.getByRole("heading", { name: "Launch the mission" })).toBeVisible();

    await expect(page.locator("#app").getByText(/Show a model answer|^Answer:/i)).toHaveCount(0);
  });

  test("Group 2 is a distinct challenge experience and keeps teacher guidance private", async ({
    page,
  }) => {
    await page.goto("/lessons/7-2-group2/");
    // Leveled Challenge voice greets the group in the hero.
    await expect(page.getByText(/Think like a mathematician/)).toBeVisible();
    // The challenge briefing caps the studio in More Practice.
    await page.locator("#sg-tab-sg-tab-more").click();
    await expect(page.getByText("Challenge briefing")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enter the challenge →" })).toBeVisible();
    // The topic-aligned math check has its own tab; teacher guidance stays private.
    await expect(page.locator("#sg-tab-sg-tab-prove")).toBeVisible();
    await expect(page.getByText(/Teacher studio guide|Listen for during team talk/)).toHaveCount(0);
    await expect(page.getByLabel("Predict", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Test", { exact: true })).toHaveCount(0);

    const equation = page
      .getByRole("button", {
        name: "Equation: open definition",
        exact: true,
      })
      .first();
    await equation.click();
    const definition = page.getByRole("dialog", { name: "Equation" });
    await expect(definition.getByText(/math sentence with an equal sign/i)).toBeVisible();
    // The image resolves by SLUG, so a lesson that carries its own artwork for a
    // term serves that instead of the generic tile ("equation-x-plus-25.svg" for
    // a lesson whose equation IS x + 25). Assert the term, not the exact file —
    // pinning the generic name made this test fail the moment the curriculum
    // gained a better, more specific picture.
    await expect(definition.getByRole("img")).toHaveAttribute(
      "src",
      /\/assets\/vocab-images\/equation[a-z0-9-]*\.svg$/,
    );
    await definition.getByRole("button", { name: "Close definition" }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  });

  test("Award Edition turns a Group 1 session into visible evidence of thinking", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.print = () => undefined;
    });
    await page.goto("/lessons/1-1-group1/");

    // Team consensus protocol lives with partner talk in the Practice tab.
    await page.locator("#sg-tab-sg-tab-practice").click();
    const consensus = page.getByRole("group", { name: "Team consensus protocol" });
    // Without a table code this is the SOLO board, and the innovation wave made it
    // say so: one student tapping all three seats is a ritual of collaboration, not
    // collaboration. The honest labelling is the assertion — and the old
    // "your choice stays private" promise must NOT appear here, because with one
    // device there is nobody to keep it private from. That promise is now scoped to
    // the live table branch (createConsensusLab in small-group-innovation.js).
    await expect(consensus.getByText(/casting all three positions yourself/i)).toBeVisible();
    await expect(consensus.getByText(/stays private|stays hidden/i)).toHaveCount(0);
    for (const voice of ["Voice 1", "Voice 2", "Voice 3"]) {
      await consensus.getByRole("button", { name: new RegExp(`${voice}.*Model it`, "i") }).click();
    }
    await expect(consensus.getByText(/Your three positions, side by side/i)).toBeVisible();
    await expect(consensus.getByText(/Model it · 3 positions/)).toBeVisible();
    await consensus.getByRole("radio", { name: "Revised the position" }).check();
    await consensus
      .getByLabel("Why did your thinking change?")
      .fill("The diagram made every prime factor visible, so our evidence became clearer.");

    // Adaptive coach recommends a transparent next move in Guided.
    await page.locator("#sg-tab-sg-tab-learn").click();
    await page.getByRole("button", { name: "I can try with support" }).first().click();
    await page.locator("#sg-tab-sg-tab-guided").click();
    const coach = page.getByRole("region", { name: "Adaptive next-move coach" });
    await coach.getByRole("button", { name: "Find our next move" }).click();
    await expect(coach.getByRole("heading", { name: "Stabilize" })).toBeVisible();
    await coach.getByRole("button", { name: "Choose Connect instead" }).click();
    await expect(coach.getByRole("heading", { name: "Connect" })).toBeVisible();

    // Exit ticket → reflection → the Evidence Card captures the session
    // (Check now lives inside the merged Practice & Check tab).
    await page.locator("#sg-tab-sg-tab-practice").click();
    await page
      .locator("#sg-check")
      .getByRole("button", { name: /2 × 2 × 2 × 5/ })
      .click();
    await page.locator("#sg-reflect").getByRole("button", { name: "I can explain a step" }).click();
    await page.locator("#sg-reflect").getByRole("button", { name: "Finish the studio" }).click();

    const evidence = page.getByRole("region", { name: "Studio Evidence Card" });
    await expect(evidence).toBeVisible();
    await expect(evidence.getByText(/Revised after discussion/i)).toBeVisible();
    const printEvidence = evidence.getByRole("button", { name: "Print Studio Evidence Card" });
    await expect(printEvidence).toBeVisible();
    await printEvidence.click();
    await expect(page.locator("body")).toHaveClass(/sg-print-evidence/);
    await expect(page.locator('input[name*="name" i], input[type="email"]')).toHaveCount(0);
  });

  test("Award Edition gives Group 2 a topic-aligned math check", async ({ page }) => {
    await page.goto("/lessons/7-2-group2/");
    await page.locator("#sg-tab-sg-tab-prove").click();
    const mathCheck = page.locator("#sg-prove");
    const steps = mathCheck.locator(".sg-apply-step");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(1)).toHaveClass(/locked/);
    await expect(mathCheck.getByRole("heading", { name: /Equation.*Check Lab/ })).toBeVisible();
    await expect(mathCheck.getByText(/substitute it into the original equation/i)).toBeVisible();
    await expect(mathCheck.getByText(/skeptic|prove your answer/i)).toHaveCount(0);
  });

  test("students can highlight and bold selected lesson words", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");

    // The key idea being marked up lives in the Learn It tab.
    await page.locator("#sg-tab-sg-tab-learn").click();
    const tools = page.getByRole("region", { name: "Study mark-up tools" });
    await expect(tools).toBeVisible();
    // The toolbar is collapsed by default so the lesson leads — open it.
    await tools.getByTestId("study-markup-toggle").click();
    await expect(tools.getByText(/select words in the lesson/i)).toBeVisible();

    const selectPhrase = async (phrase: string) => {
      await page.locator(".keyidea").evaluate((root, selectedPhrase) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        let node = walker.nextNode();
        while (node) {
          nodes.push(node as Text);
          node = walker.nextNode();
        }
        const joined = nodes.map((textNode) => textNode.data).join("");
        const phraseStart = joined.indexOf(selectedPhrase);
        if (phraseStart < 0) throw new Error(`Could not select phrase: ${selectedPhrase}`);
        const phraseEnd = phraseStart + selectedPhrase.length;
        let offset = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startOffset = 0;
        let endOffset = 0;
        for (const textNode of nodes) {
          const nextOffset = offset + textNode.length;
          if (!startNode && phraseStart >= offset && phraseStart < nextOffset) {
            startNode = textNode;
            startOffset = phraseStart - offset;
          }
          if (phraseEnd > offset && phraseEnd <= nextOffset) {
            endNode = textNode;
            endOffset = phraseEnd - offset;
            break;
          }
          offset = nextOffset;
        }
        if (!startNode || !endNode) throw new Error(`Could not map phrase: ${selectedPhrase}`);
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.dispatchEvent(new Event("selectionchange"));
      }, phrase);
    };

    await selectPhrase("Keep breaking a number apart");
    await tools.getByRole("button", { name: "Highlight selected words" }).click();
    await expect(page.locator("mark.sg-student-highlight")).toHaveText(
      "Keep breaking a number apart",
    );

    await selectPhrase("until every factor is a");
    await tools.getByRole("button", { name: "Bold selected words" }).click();
    await expect(page.locator("strong.sg-student-bold")).toHaveText("until every factor is a");
    await expect(tools.getByRole("status")).toContainText(/bolded/i);

    await tools.getByRole("button", { name: "Undo last mark-up" }).click();
    await expect(page.locator("strong.sg-student-bold")).toHaveCount(0);
    await tools.getByRole("button", { name: "Clear all mark-up" }).click();
    await expect(page.locator("mark.sg-student-highlight")).toHaveCount(0);
  });

  test("underlined math vocabulary opens a simple definition and concept image", async ({
    page,
  }) => {
    await page.goto("/lessons/1-1-group1/");

    const primeCard = page.locator(".sg-vcard").filter({
      has: page.getByText("Prime number", { exact: true }),
    });
    await expect(primeCard.getByText(/ES:\s*Número primo/)).toBeVisible();
    await expect(primeCard.getByText(/VI:|AR:/)).toHaveCount(0);
    await expect(
      primeCard.getByText("A number bigger than 1 that you can only divide by 1 and itself."),
    ).toBeVisible();
    await expect(
      primeCard.getByText("Un número mayor que 1 que solo se puede dividir entre 1 y sí mismo."),
    ).toBeVisible();

    // Inline triggers install across every tab; the key-idea occurrence
    // lives in Learn It, so surface that panel before asserting.
    await page.locator("#sg-tab-sg-tab-learn").click();
    const term = page.getByRole("button", { name: "Prime number: open definition" }).first();
    await expect(term).toBeVisible();
    await expect(term).toHaveClass(/sg-vocab-inline/);
    await term.click();

    const dialog = page.getByRole("dialog", { name: "Prime number" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText("A number bigger than 1 that you can only divide by 1 and itself."),
    ).toBeVisible();
    await expect(
      dialog.getByText("Un número mayor que 1 que solo se puede dividir entre 1 y sí mismo."),
    ).toBeVisible();
    await expect(dialog.getByText(/Vietnamese|Arabic|Số nguyên tố|عدد أولي/)).toHaveCount(0);
    const image = dialog.getByRole("img");
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", /\/assets\/vocab-images\/prime-number\.svg$/);
    await expect(image).toHaveAttribute("alt", /Illustration of Prime number/i);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      blocking,
      blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
    ).toEqual([]);
    await dialog.getByRole("button", { name: "Close definition" }).click();
    await expect(dialog).toBeHidden();
    await expect(term).toBeFocused();
  });

  test("teacher access is verified server-side and exposes facilitation guidance", async ({
    page,
  }) => {
    // Teacher mode is confirmed by the server (?teacher=1 + facilitation
    // endpoint); the static preview mocks the confirmed response.
    await page.route("**/teacher-small-group/7-2-group2/data", (route) =>
      route.fulfill({
        json: {
          facilitation: {
            group: 2,
            label: "Challenge",
            who: "Students ready to justify and generalize",
            moves: ["Ask for a second representation before accepting a proof"],
            frames: ["What convinces you this is always true?"],
            listenFor: ["Students justify with evidence"],
          },
        },
      }),
    );
    await page.goto("/lessons/7-2-group2/?teacher=1");
    const guide = page.getByText(/Teacher studio guide/);
    await expect(guide).toBeVisible();
    await guide.click();
    await expect(page.getByText(/Listen-for checkpoints/)).toBeVisible();
    await expect(page.getByRole("link", { name: "← Curriculum" })).toBeVisible();
  });

  test("Award Edition keeps the Facilitation Console private and actionable", async ({
    browser,
  }) => {
    // A student spoofing ?teacher=1 without server confirmation stays in
    // Student Mode — the console never mounts.
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await studentPage.goto("/lessons/7-2-group2/?teacher=1");
    await expect(studentPage.getByText(/Teacher access was not confirmed/)).toBeVisible();
    await expect(studentPage.getByRole("region", { name: "Facilitation Console" })).toHaveCount(0);
    await expect(studentPage.getByText(/anonymous observation evidence/i)).toHaveCount(0);
    await studentContext.close();

    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    await teacherPage.addInitScript(() => {
      window.print = () => undefined;
    });
    await teacherPage.route("**/teacher-small-group/7-2-group2/data", (route) =>
      route.fulfill({
        json: {
          facilitation: {
            group: 2,
            label: "Challenge",
            moves: ["Ask for a second representation before accepting a proof"],
            listenFor: ["Students justify with evidence"],
          },
        },
      }),
    );
    await teacherPage.goto("/lessons/7-2-group2/?teacher=1");
    const console = teacherPage.getByRole("region", { name: "Facilitation Console" });
    await expect(console).toBeVisible();
    await expect(console.getByRole("checkbox")).toHaveCount(6);
    await console.getByRole("checkbox", { name: "Students connected representations" }).check();
    await expect(console.getByText("1 of 6 evidence signals observed")).toBeVisible();
    await expect(console.getByText(/Suggested teacher move:/)).toBeVisible();
    await expect(
      console.getByText(/No names or individual responses are transmitted/),
    ).toBeVisible();
    const printSummary = console.getByRole("button", { name: "Print observation summary" });
    await expect(printSummary).toBeVisible();
    await printSummary.click();
    await expect(teacherPage.locator("body")).toHaveClass(/sg-print-facilitation/);
    const results = await new AxeBuilder({ page: teacherPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      blocking,
      blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
    ).toEqual([]);
    await teacherContext.close();
  });

  test("curriculum keeps each small-group pair directly below its main lesson", async ({
    page,
  }) => {
    await page.goto("/curriculum/");
    // The legacy details tree is detached during interactive browsing and restored
    // only for printing. Exercise that supported state before auditing its order.
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(page.locator("details.lesson").first()).toBeAttached();
    const order = await page.evaluate(() =>
      [...document.querySelectorAll("details.lesson")].map((lesson) => ({
        text: lesson.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim() || "",
        hrefs: [...lesson.querySelectorAll<HTMLAnchorElement>("a[href]")].map(
          (link) => link.getAttribute("href") || "",
        ),
      })),
    );
    const parent = order.findIndex((item) => item.hrefs.includes("/lessons/1-1/"));
    expect(parent).toBeGreaterThanOrEqual(0);
    expect(order[parent + 1].hrefs).toContain("/lessons/1-1-group1/");
    expect(order[parent + 1].text).toContain("1.1 Small Group: Group 1");
    expect(order[parent + 2].hrefs).toContain("/lessons/1-1-group2/");
    expect(order[parent + 2].text).toContain("1.1 Small Group: Group 2");
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  });

  test("visible lesson dropdowns place small groups directly after their main lesson", async ({
    page,
  }) => {
    // 10 dropdowns + 10 top-picker units is a heavy sweep; parallel headless
    // pages also report visibilityState "hidden", which suspends the rAF the
    // Top1 layer defers its rendering through — shim it so the picker mounts.
    test.setTimeout(60_000);
    await page.addInitScript(() => {
      window.requestAnimationFrame = (cb) =>
        window.setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    await page.goto("/curriculum/");
    const dropdown = page.locator(".lesson-select");
    await expect(dropdown).toHaveCount(1);

    function expectGuidedGroupsAfterMain(labels: string[]) {
      const mainLessons = labels.filter((label) => /^Lesson \d+-\d+ ·/.test(label));

      for (const mainLesson of mainLessons) {
        const lessonId = mainLesson
          .match(/^Lesson (\d+)-(\d+) ·/)
          ?.slice(1)
          .join(".");
        expect(lessonId, mainLesson).toBeTruthy();
        const parent = labels.indexOf(mainLesson);
        expect(labels[parent + 1], `${lessonId} Group 1 position`).toContain(
          `${lessonId} Small Group: Group 1`,
        );
        expect(labels[parent + 2], `${lessonId} Group 2 position`).toContain(
          `${lessonId} Small Group: Group 2`,
        );
      }
    }

    for (let unit = 1; unit <= 10; unit += 1) {
      await page.getByRole("button", { name: new RegExp(`^Unit ${unit} `) }).click();
      await expect(dropdown).toHaveCount(1);
      const labels = await dropdown.locator("option").allTextContents();
      expectGuidedGroupsAfterMain(labels);
    }

    // NOTE: the old Top1 side-column lesson picker is intentionally retired —
    // curriculum/index.html hides #hub-side (lessons-first hub), so the
    // visible per-unit dropdowns above are the real student-facing surface.
  });

  test("Group 2 replaces the old proof routine with a topic-aligned Math Check tab", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.print = () => undefined;
    });
    await page.goto("/lessons/1-3-group2/");

    // The vague "Generalize it" / "Take the challenge" build cards are gone,
    // and so is the old inline proof-path picker.
    await expect(page.getByText("Generalize it")).toHaveCount(0);
    await expect(page.getByText("Take the challenge")).toHaveCount(0);
    await expect(page.getByText("Choose your proof path")).toHaveCount(0);

    // "Math Check" is the last tab and uses the lesson's actual mathematics.
    const mathCheckTab = page.getByRole("tab", { name: /Math Check/ });
    await expect(mathCheckTab).toBeVisible();
    await mathCheckTab.click();

    const mathCheck = page.locator("#sg-prove");
    const steps = mathCheck.locator(".sg-apply-step");
    await expect(steps).toHaveCount(3);
    await expect(mathCheck.getByRole("heading", { name: "LCM Check Lab" })).toBeVisible();
    await expect(mathCheck.getByText(/list multiples for both numbers/i)).toBeVisible();

    // Steps 2 and 3 start locked and unlock in order.
    await expect(steps.nth(1)).toHaveClass(/locked/);
    await expect(steps.nth(2)).toHaveClass(/locked/);

    await steps.nth(0).locator("textarea").fill("The machines meet again in 12 minutes.");
    await steps
      .nth(0)
      .getByRole("button", { name: /I've got an answer/ })
      .click();
    await expect(steps.nth(1)).not.toHaveClass(/locked/);

    await steps
      .nth(1)
      .locator("textarea")
      .fill("4: 4, 8, 12. 6: 6, 12. The first shared multiple is 12.");
    await steps
      .nth(1)
      .getByRole("button", { name: /My check matches/ })
      .click();
    await expect(steps.nth(2)).not.toHaveClass(/locked/);

    await steps
      .nth(2)
      .locator("textarea")
      .fill("The machines will first run together again after 12 minutes.");
    await steps
      .nth(2)
      .getByRole("button", { name: /Finish my math check/ })
      .click();
    await expect(steps.nth(2).getByRole("button", { name: "Math check complete ✓" })).toBeVisible();
  });

  test("student studio has no serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      blocking,
      blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
    ).toEqual([]);
  });
});
