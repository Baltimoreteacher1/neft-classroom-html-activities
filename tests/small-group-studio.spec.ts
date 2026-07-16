import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("small-group guided math studio", () => {
  test("Group 1 uses a mission, language lab, team talk, and retry-first practice", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");
    await expect(page.getByRole("heading", { name: "Launch the mission" })).toBeVisible();
    await expect(page.getByText(/Engineers on Station Helios/)).toBeVisible();
    await expect(page.getByLabel("Notice", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Wonder", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^I (notice|wonder)/i })).toHaveCount(0);

    await page.getByRole("button", { name: "I can try with support" }).first().click();
    await page.getByRole("button", { name: "Build it together →" }).click();
    await expect(page.locator('.sg-step').first()).toHaveClass(/done/);

    const match = page.locator(".sg-match");
    await expect(match.getByText("A number bigger than 1 that you can only divide by 1 and itself.")).toBeVisible();
    await match.getByRole("button", { name: "Prime number", exact: true }).click();
    await expect(match.getByText(/1 of 4 unlocked/)).toBeVisible();

    await expect(page.getByRole("heading", { name: "Talk the math through" })).toBeVisible();
    await expect(page.getByText(/Solver: explain one step/)).toBeVisible();
    await page.getByRole("button", { name: "Start talk timer" }).click();
    await expect(page.getByRole("timer")).not.toHaveText("1:00");

    const firstProblem = page.locator(".prob").filter({ hasText: "Which of the following is a prime number?" });
    await firstProblem.getByRole("button", { name: /15/ }).click();
    await expect(firstProblem.getByText(/does not fit yet/)).toBeVisible();
    await expect(firstProblem.getByRole("button", { name: /17/ })).not.toHaveClass(/correct/);
    await firstProblem.getByRole("button", { name: /17/ }).click();
    await expect(firstProblem.getByText(/Your reasoning landed/)).toBeVisible();

    await expect(page.locator("#app").getByText(/Show a model answer|^Answer:/i)).toHaveCount(0);
  });

  test("Group 2 is a distinct challenge experience and keeps teacher guidance private", async ({ page }) => {
    await page.goto("/lessons/7-2-group2/");
    await expect(page.getByText("Challenge briefing")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Defend it to a skeptic" })).toBeVisible();
    await expect(page.getByText(/Conjecturer: make the claim/)).toBeVisible();
    await expect(page.getByText(/Teacher studio guide|Listen for during team talk/)).toHaveCount(0);
    await expect(page.getByLabel("Predict", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Test", { exact: true })).toHaveCount(0);

    const equation = page.getByRole("button", { name: "Equation: open definition" }).first();
    await equation.click();
    const definition = page.getByRole("dialog", { name: "Equation" });
    await expect(definition.getByText(/math sentence with an equal sign/i)).toBeVisible();
    await expect(definition.getByRole("img")).toHaveAttribute(
      "src",
      /\/assets\/vocab-images\/equation\.svg$/,
    );
    await definition.getByRole("button", { name: "Close definition" }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  });

  test("Award Edition turns a Group 1 session into visible evidence of thinking", async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => undefined;
    });
    await page.goto("/lessons/1-1-group1/");

    const proof = page.getByRole("group", { name: "Choose your proof path" });
    await expect(proof).toBeVisible();
    await expect(proof.getByRole("button")).toHaveCount(4);
    await proof.getByRole("button", { name: "Model it" }).click();
    await expect(proof.getByRole("button", { name: "Model it" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(proof.getByText(/draw, diagram, table, number line/i)).toBeVisible();

    const consensus = page.getByRole("group", { name: "Team consensus protocol" });
    await expect(consensus.getByText(/distribution stays hidden/i)).toBeVisible();
    for (const voice of ["Voice 1", "Voice 2", "Voice 3"]) {
      await consensus.getByRole("button", { name: new RegExp(`${voice}.*Model it`, "i") }).click();
    }
    await expect(consensus.getByText("Model it · 3 voices")).toBeVisible();
    await consensus.getByRole("radio", { name: "We revised our position" }).check();
    await consensus.getByLabel("Why did your thinking change?").fill(
      "The diagram made every prime factor visible, so our evidence became clearer.",
    );

    await page.getByRole("button", { name: "I can try with support" }).first().click();
    const coach = page.getByRole("region", { name: "Adaptive next-move coach" });
    await coach.getByRole("button", { name: "Find our next move" }).click();
    await expect(coach.getByRole("heading", { name: "Stabilize" })).toBeVisible();
    await expect(coach.getByText(/because|supported model/i)).toBeVisible();
    await coach.getByRole("button", { name: "Choose Connect instead" }).click();
    await expect(coach.getByRole("heading", { name: "Connect" })).toBeVisible();

    const designLab = page.getByRole("region", { name: "Create-a-Challenge design lab" });
    await expect(designLab.getByText(/change one meaningful feature/i)).toBeVisible();
    await designLab.getByLabel("Our new challenge").fill(
      "Build a factor tree for 42 and show why every leaf is prime.",
    );
    await designLab.getByLabel("How we verified it").fill(
      "We multiplied 2 × 3 × 7 to get 42 and checked that each factor is prime.",
    );
    await designLab.getByRole("button", { name: "Add to evidence card" }).click();
    await expect(designLab.getByText(/challenge captured/i)).toBeVisible();

    const practice = page.locator("#sg-practice");
    for (const answer of ["17", "2 × 3 × 5", "2 × 3 × 3", "27"]) {
      await practice.getByRole("button", { name: new RegExp(answer.replaceAll("×", "\\×")) }).first().click();
    }
    await page
      .locator("#sg-check")
      .getByRole("button", { name: /2 × 2 × 2 × 5/ })
      .click();
    await page
      .locator("#sg-reflect")
      .getByRole("button", { name: "I can explain a step" })
      .click();
    await page.locator("#sg-reflect").getByRole("button", { name: "Finish the studio" }).click();

    const evidence = page.getByRole("region", { name: "Studio Evidence Card" });
    await expect(evidence).toBeVisible();
    await expect(evidence.getByText("Model it", { exact: true })).toBeVisible();
    await expect(evidence.getByText(/Revised after team discussion/i)).toBeVisible();
    await expect(evidence.getByText(/Build a factor tree for 42/i)).toBeVisible();
    const printEvidence = evidence.getByRole("button", { name: "Print Studio Evidence Card" });
    await expect(printEvidence).toBeVisible();
    await printEvidence.click();
    await expect(page.locator("body")).toHaveClass(/sg-print-evidence/);
    await expect(page.locator('input[name*="name" i], input[type="email"]')).toHaveCount(0);
  });

  test("Award Edition gives Group 2 an advanced creation brief", async ({ page }) => {
    await page.goto("/lessons/7-2-group2/");
    const designLab = page.getByRole("region", { name: "Create-a-Challenge design lab" });
    await expect(designLab.getByText(/constraint, tricky case, or plausible misconception/i)).toBeVisible();
  });

  test("students can highlight and bold selected lesson words", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");

    const tools = page.getByRole("region", { name: "Study mark-up tools" });
    await expect(tools).toBeVisible();
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

  test("underlined math vocabulary opens a simple definition and concept image", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");

    const term = page.getByRole("button", { name: "Prime number: open definition" }).first();
    await expect(term).toBeVisible();
    await expect(term).toHaveClass(/sg-vocab-inline/);
    await term.click();

    const dialog = page.getByRole("dialog", { name: "Prime number" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("A number bigger than 1 that you can only divide by 1 and itself.")).toBeVisible();
    const image = dialog.getByRole("img");
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", /\/assets\/vocab-images\/prime-number\.svg$/);
    await expect(image).toHaveAttribute("alt", /Illustration of Prime number/i);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      blocking,
      blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
    ).toEqual([]);
    await dialog.getByRole("button", { name: "Close definition" }).click();
    await expect(dialog).toBeHidden();
    await expect(term).toBeFocused();
  });

  test("teacher mode exposes facilitation and listen-for guidance", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("nt-teacher-mode", "1"));
    await page.goto("/lessons/7-2-group2/");
    const guide = page.getByText(/Teacher studio guide/);
    await expect(guide).toBeVisible();
    await guide.click();
    await expect(page.getByText(/Listen for during team talk/)).toBeVisible();
    await expect(page.getByRole("link", { name: "← Curriculum" })).toBeVisible();
  });

  test("Award Edition keeps the Facilitation Console private and actionable", async ({ browser }) => {
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await studentPage.goto("/lessons/7-2-group2/");
    await expect(studentPage.getByRole("region", { name: "Facilitation Console" })).toHaveCount(0);
    await expect(studentPage.getByText(/anonymous observation evidence/i)).toHaveCount(0);
    await studentContext.close();

    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    await teacherPage.addInitScript(() => {
      localStorage.setItem("nt-teacher-mode", "1");
      window.print = () => undefined;
    });
    await teacherPage.goto("/lessons/7-2-group2/");
    const console = teacherPage.getByRole("region", { name: "Facilitation Console" });
    await expect(console).toBeVisible();
    await expect(console.getByRole("checkbox")).toHaveCount(6);
    await console.getByRole("checkbox", { name: "Students connected representations" }).check();
    await expect(console.getByText("1 of 6 evidence signals observed")).toBeVisible();
    await expect(console.getByText(/Suggested teacher move:/)).toBeVisible();
    await expect(console.getByText(/No names or individual responses are transmitted/)).toBeVisible();
    const printSummary = console.getByRole("button", { name: "Print observation summary" });
    await expect(printSummary).toBeVisible();
    await printSummary.click();
    await expect(teacherPage.locator("body")).toHaveClass(/sg-print-facilitation/);
    const results = await new AxeBuilder({ page: teacherPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      blocking,
      blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
    ).toEqual([]);
    await teacherContext.close();
  });

  test("curriculum keeps each small-group pair directly below its main lesson", async ({ page }) => {
    await page.goto("/curriculum/");
    const order = await page.evaluate(() =>
      [...document.querySelectorAll("details.lesson")].map((lesson) => ({
        text: lesson.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim() || "",
        hrefs: [...lesson.querySelectorAll<HTMLAnchorElement>("a[href]")].map((link) => link.getAttribute("href") || ""),
      })),
    );
    const parent = order.findIndex((item) => item.hrefs.includes("/lessons/1-1/"));
    expect(parent).toBeGreaterThanOrEqual(0);
    expect(order[parent + 1].hrefs).toContain("/lessons/1-1-group1/");
    expect(order[parent + 1].text).toContain("1.1 Small Group: Group 1");
    expect(order[parent + 2].hrefs).toContain("/lessons/1-1-group2/");
    expect(order[parent + 2].text).toContain("1.1 Small Group: Group 2");
  });

  test("visible lesson dropdowns place small groups directly after their main lesson", async ({ page }) => {
    await page.goto("/curriculum/");
    const dropdowns = page.locator(".lesson-select");
    await expect(dropdowns).toHaveCount(10);

    function expectGuidedGroupsAfterMain(labels: string[]) {
      const mainLessons = labels.filter((label) => /^Lesson \d+-\d+ ·/.test(label));

      for (const mainLesson of mainLessons) {
        const lessonId = mainLesson.match(/^Lesson (\d+)-(\d+) ·/)?.slice(1).join(".");
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

    for (let dropdownIndex = 0; dropdownIndex < 10; dropdownIndex += 1) {
      const labels = await dropdowns.nth(dropdownIndex).locator("option").allTextContents();
      expectGuidedGroupsAfterMain(labels);
    }

    const topPicker = page.locator(".top1-picker").first();
    const topUnit = topPicker.locator("select").nth(1);
    const topLesson = topPicker.locator("select").nth(2);
    for (let unitIndex = 0; unitIndex < 10; unitIndex += 1) {
      await topUnit.selectOption(String(unitIndex));
      expectGuidedGroupsAfterMain(await topLesson.locator("option").allTextContents());
    }
  });

  test("student studio has no serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical",
    );
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  });
});
