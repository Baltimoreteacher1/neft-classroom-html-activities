// Real rendered classic controls and mathematical construction dialogs.
// Pass a local or deployed base URL; default uses the production build preview.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { preview } from "vite";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const server = process.argv[2]
  ? null
  : await preview({ root: REPO_ROOT, preview: { host: "127.0.0.1", port: 0 } });
const base = process.argv[2] || `http://127.0.0.1:${server.httpServer.address().port}`;
const out = "/tmp/eduwonderlab-game-transformation";
mkdirSync(out, { recursive: true });
const report = [];
const games = [
  ["u1-decimal-dash", "ddGame"],
  ["u2-fraction-frenzy", "ffGame"],
  ["u3-ratio-rush", "rrGame"],
  ["u4-percent-power", "ppGame"],
  ["u5-area-attack", null],
  ["u6-expression-express", "eeGame"],
  ["u7-equation-quest", "eqGame"],
  ["u8-data-dash", "ddGame"],
  ["u9-coordinate-quest", "cqGame"],
  ["u10-volume-blast", "vbGame"],
];
const worlds = [
  ["kitchen", "/math/unit-2/games/unit2-fraction-kitchen.html"],
  ["foundry", "/math/unit-2/games/unit2-fraction-foundry.html"],
  ["ratio", "/math/unit-3/6-rp-1game/"],
  ["discount", "/math/unit-4/games/unit4-discount-dash.html"],
  ["area", "/math/unit-5/games/unit5-area-architect.html"],
  ["expression", "/math/unit-6/games/unit6-expression-engine.html"],
  ["equation", "/math/unit-8/games/unit7-equation-escape.html"],
  ["variable", "/math/unit-9/games/unit9-variable-velocity.html"],
  ["volume", "/math/unit-10/games/unit10-volume-vault.html"],
  ["stats", "/math/statistics/games/unit8-stats-slam.html"],
];
const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-swiftshader"] });
async function open(context, path) {
  const p = await context.newPage();
  p.__errors = [];
  p.on("pageerror", (e) => p.__errors.push(e.message));
  assert.equal((await p.goto(base + path, { waitUntil: "domcontentloaded" }))?.status(), 200, path);
  return p;
}
async function renderCheck(p, id, width, selector) {
  await p.locator(selector).waitFor();
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
    `${id} ${width}: horizontal overflow`,
  );
  const axe = await new AxeBuilder({ page: p })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    axe.violations.map((v) => v.id),
    [],
    `${id}: changed controls axe violations`,
  );
  await p.screenshot({ path: `${out}/${id}-${width}.png`, fullPage: false });
  assert.deepEqual(p.__errors, [], `${id}: runtime errors`);
}
try {
  for (const width of (process.env.GAME_WIDTHS || "1365,1024,390").split(",").map(Number)) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      reducedMotion: width === 1365 ? "no-preference" : "reduce",
      serviceWorkers: "block",
    });
    for (const [slug, handle] of games.filter(
      ([id]) => !process.env.GAME_ONLY || process.env.GAME_ONLY.split(",").includes(id),
    )) {
      console.error(`Classic ${slug} ${width}`);
      const p = await open(context, `/math/games/${slug}/`);
      await p.getByRole("button", { name: "Skip intro and jump straight into gameplay" }).click();
      await p.locator(".cabinet-controls button").first().waitFor();
      if (handle) await p.waitForFunction((key) => window[key]?.scene.isActive("Game"), handle);
      // Existing accessible native controls, rather than calls that directly change game state.
      if (
        [
          "u1-decimal-dash",
          "u2-fraction-frenzy",
          "u3-ratio-rush",
          "u4-percent-power",
          "u9-coordinate-quest",
          "u10-volume-blast",
        ].includes(slug)
      ) {
        const before = await p.evaluate((key) => {
          const s = window[key].scene.getScene("Game");
          return { problem: JSON.stringify(s.problem), solved: s.solved, round: s.round };
        }, handle);
        for (let n = 0; n < 4; n++) {
          await p.getByRole("button", { name: "Lock in (Enter)", exact: true }).click();
          await p.waitForFunction((key) => !window[key].scene.getScene("Game").locked, handle);
        }
        const after = await p.evaluate((key) => {
          const s = window[key].scene.getScene("Game");
          return { problem: JSON.stringify(s.problem), solved: s.solved, round: s.round };
        }, handle);
        assert.deepEqual(
          after,
          before,
          `${slug}: four misses must leave the construction and task in place`,
        );
      }
      if (slug === "u4-percent-power") {
        const target = await p.evaluate(() => ppGame.scene.getScene("Game").problem.targetPct);
        for (let n = 0; n < target / 5; n++)
          await p.getByRole("button", { name: "+5% / next (ArrowRight)", exact: true }).click();
        await p.getByRole("button", { name: "Lock in (Enter)", exact: true }).click();
        await p.locator("#percent-amount").waitFor();
        // New session through the established Save / Resume panel, without a student identity.
        await p.getByRole("button", { name: "Save / Resume", exact: false }).click();
        await p.locator("#nsr-start").click();
        await p.locator("#nsr-close").click();
        await p.locator("#percent-amount").fill("9999");
        for (let n = 0; n < 4; n++)
          await p.getByRole("button", { name: "Check amount", exact: true }).click();
        assert.equal(await p.evaluate(() => ppGame.scene.getScene("Game").solved), 0);
        assert.equal(await p.locator("#percent-amount").inputValue(), "9999");
        await p.getByRole("button", { name: "Use a bar-model hint", exact: true }).click();
        const before = await p.evaluate(async () => {
          await NeftSaveResume.save("qa");
          return ppGame.scene.getScene("Game").captureConstruction();
        });
        await p.reload();
        await p.locator("#percent-amount").waitFor();
        assert.equal(await p.locator("#percent-amount").inputValue(), "9999");
        const restored = await p.evaluate(() =>
          ppGame.scene.getScene("Game").captureConstruction(),
        );
        for (const key of [
          "problem",
          "phase",
          "markerPct",
          "wrongShade",
          "wrongValue",
          "attempts",
          "score",
          "scaffoldTier",
          "usedHelp",
        ])
          assert.deepEqual(restored[key], before[key], `percent save/resume ${key}`);
        const amount = await p.evaluate(
          () => ppGame.scene.getScene("Game").problem.ask.options.find((x) => x.correct).value,
        );
        await p.locator("#percent-amount").fill(`${amount * 2}/2`);
        await p.locator("#percent-amount").press("Enter");
        assert.equal(await p.evaluate(() => ppGame.scene.getScene("Game").solved), 1);
        assert.equal(
          await p.evaluate(() => ppGame.scene.getScene("Game").firstTry),
          0,
          "assisted revision is not first-try evidence",
        );
        await p.locator(".cabinet-next").waitFor({ state: "visible" });
        await renderCheck(p, slug, width, ".percent-construction");
      } else await renderCheck(p, slug, width, ".cabinet-console");
      report.push({
        id: slug,
        width,
        rendered: true,
        retry: [
          "u1-decimal-dash",
          "u2-fraction-frenzy",
          "u3-ratio-rush",
          "u4-percent-power",
          "u9-coordinate-quest",
          "u10-volume-blast",
        ].includes(slug),
        persistedWorkflow: slug === "u4-percent-power",
      });
      await p.close();
    }
    if (!process.env.GAME_ONLY || process.env.GAME_ONLY.split(",").includes("factor")) {
      console.error(`Factor vault ${width}`);
      const p = await open(context, "/math/games/u1-factor-frenzy/");
      await p.locator("#vocab-go").click();
      await p.locator("#level-list button").first().click();
      const number = Number(await p.locator("#t-n").innerText());
      const counts = {};
      for (let rest = number, prime = 2; rest > 1; prime++)
        while (rest % prime === 0) {
          counts[prime] = (counts[prime] || 0) + 1;
          rest /= prime;
        }
      for (
        let step = 0;
        step < 30 && (await p.locator("#tree button:not(:disabled)").count());
        step++
      ) {
        const leaf = p.locator("#tree button:not(:disabled)").first();
        const value = Number(await leaf.innerText());
        let factor = 0;
        for (let n = 2; n * n <= value; n++)
          if (value % n === 0) {
            factor = n;
            break;
          }
        await leaf.press("Enter");
        if (!factor) await p.locator('#palette [data-act="prime"]').press("Enter");
        else {
          const choices = p.locator('#palette [data-act="split"]');
          for (let n = 0; n < (await choices.count()); n++) {
            const choice = choices.nth(n);
            if (
              Number(await choice.getAttribute("data-a")) *
                Number(await choice.getAttribute("data-b")) ===
              value
            ) {
              await choice.press("Enter");
              break;
            }
          }
        }
      }
      await p.locator("#btn-calibrate-vault").waitFor();
      for (const prime of Object.keys(counts))
        for (let i = 0; i < 6; i++)
          await p
            .getByRole("button", { name: `Raise the exponent on ${prime}`, exact: true })
            .click();
      const score = Number(await p.locator("#hud-score").innerText());
      for (let n = 0; n < 4; n++) await p.locator("#btn-calibrate-vault").click();
      assert.equal(await p.locator("#btn-calibrate-vault").isVisible(), true);
      assert.equal(Number(await p.locator("#hud-score").innerText()), score);
      for (const prime of Object.keys(counts))
        assert.equal(await p.locator(`#exp-val-${prime}`).innerText(), "6");
      await renderCheck(p, "factor-vault", width, "#screen-play");
      for (const [prime, count] of Object.entries(counts))
        for (let i = count; i < 6; i++)
          await p
            .getByRole("button", { name: `Lower the exponent on ${prime}`, exact: true })
            .click();
      await p.locator("#btn-calibrate-vault").click();
      assert.match(await p.locator("#vault-stage").innerText(), /Vault Unlocked/);
      assert.equal(
        Number(await p.locator("#hud-score").innerText()) - score,
        25,
        "helped exponent revision gets the existing helped bonus",
      );
      report.push({
        id: "factor-vault",
        width,
        keyboardTree: true,
        fourMissesNoReveal: true,
        correctExponentsComplete: true,
      });
      await p.close();
    }
    if (!process.env.GAME_ONLY || process.env.GAME_ONLY.split(",").includes("boss")) {
      console.error(`Boss construction ${width}`);
      const p = await open(context, "/games/3d/boss-battle-3d/play/?debug=1");
      const begin = async () => {
        // Existing game FX briefing, level choice and vocabulary are distinct
        // onboarding stages; exercise each through its actual public controls.
        const briefing = p.getByRole("button", { name: "Got it — let's play", exact: true });
        const level = p.locator('.e3d-level-btn[data-level="1"]');
        await briefing.or(level).first().waitFor({ timeout: 45000 });
        // The briefing opens ~400ms after load, usually after the level list
        // is already visible, so wait for it before choosing a level.
        await briefing.waitFor({ timeout: 3000 }).then(
          () => briefing.click(),
          () => {},
        );
        await level.click();
        for (
          let n = 0;
          n < 10 &&
          !(await p.getByRole("button", { name: "Start battle", exact: true }).isVisible());
          n++
        ) {
          const nextWord = p.locator(".e3d-vocab-next");
          if (await nextWord.isVisible()) await nextWord.click();
          else break;
        }
        await p.getByRole("button", { name: "Start battle", exact: true }).click();
        await p.locator(".bb-input").first().waitFor();
      };
      await begin();
      const round = await p.evaluate(() => __bossDebug.round);
      await p.locator(".bb-input").first().fill("9999");
      await p.locator('[data-bb="fire"]').click();
      await p.waitForFunction(() => __bossDebug.state.misses > 0 && !__bossDebug.state.busy);
      await p.locator('[data-bb="hint"]').click();
      await p.reload({ waitUntil: "domcontentloaded" });
      await begin();
      assert.deepEqual(
        await p.evaluate(() => __bossDebug.round),
        round,
        "boss resumes the exact seeded mathematical problem",
      );
      assert.equal(await p.locator(".bb-input").first().inputValue(), "9999");
      assert.equal(await p.evaluate(() => __bossDebug.state.misses), 1);
      assert.equal(await p.locator(".bb-hint").count(), 1);
      await renderCheck(p, "boss-construction", width, ".bb-panel");
      for (let i = 0; i < round.fields.length; i++)
        await p.locator(".bb-input").nth(i).fill(String(round.fields[i].answer));
      await p.locator('[data-bb="fire"]').click();
      await p.waitForFunction(() => __bossDebug.state.totalScore > 0);
      const won = await p.evaluate(() => __bossDebug.state);
      assert.equal(won.totalScore, 5, "assisted attack retains helped scoring after refresh");
      await p.reload({ waitUntil: "domcontentloaded" });
      await begin();
      assert.equal(await p.evaluate(() => __bossDebug.state.totalScore), won.totalScore);
      assert.equal(await p.evaluate(() => __bossDebug.state.bossHp), won.bossHp);
      report.push({
        id: "boss-construction",
        width,
        exactRoundResume: true,
        typedDraft: true,
        missesAndHints: true,
        damageScoreResume: true,
      });
      await p.close();
    }
    await context.close();
    for (const [id, path] of worlds.filter(
      ([id]) => !process.env.GAME_ONLY || process.env.GAME_ONLY.split(",").includes(id),
    )) {
      const c = await browser.newContext({
        viewport: { width, height: 844 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      // Valid completed-fieldwork fixture opens the existing site gate; construction
      // and revision below use actual controls and native mathematical validators.
      await c.addInitScript(
        ({ id }) => {
          if (!localStorage.getItem(`ewl.flagship.expedition.v1.${id}`))
            localStorage.setItem(
              `ewl.flagship.expedition.v1.${id}`,
              JSON.stringify({ site: 0, steps: 3, route: 0, chapter: 0 }),
            );
        },
        { id },
      );
      console.error(`Construction ${id} ${width}`);
      const p = await open(c, path);
      await p.locator(".adventure-world .adventure-enter").click();
      await p.locator(".adventure-dialog[open]").waitFor();
      const first = p.locator("#expedition-input-0");
      const startValue = await first.inputValue();
      await p.getByRole("button", { name: "Keep this as model A", exact: true }).press("Enter");
      if ((await first.evaluate((el) => el.tagName)) === "SELECT") await first.selectOption("1");
      else
        await p
          .locator(".adventure-control")
          .first()
          .getByRole("button", { name: /^Plus 1/ })
          .click();
      assert.notEqual(await first.inputValue(), startValue);
      assert.match(await p.locator(".adventure-change-note").innerText(), /→/);
      await p.getByRole("button", { name: "Undo last change", exact: true }).press("Enter");
      assert.equal(await first.inputValue(), startValue);
      if ((await first.evaluate((el) => el.tagName)) === "SELECT") await first.selectOption("1");
      else
        await p
          .locator(".adventure-control")
          .first()
          .getByRole("button", { name: /^Plus 1/ })
          .click();
      const revised = await first.inputValue();
      await p.getByRole("button", { name: "Back to fieldwork", exact: true }).click();
      // Reload must preserve model A, mathematical choices, changes and hint evidence.
      // The init fixture only seeds an empty device and never replaces saved work.
      if (width === 1024) {
        await p.getByRole("button", { name: "Save / Resume", exact: false }).click();
        await p.locator("#nsr-start").click();
        await p.locator("#nsr-close").click();
        const stored = await p.evaluate(async () => {
          await NeftSaveResume.save("qa");
          return NeftSaveResume.record.state.custom;
        });
        assert.ok(
          Object.values(stored).some((value) => value?.flagshipConstruction?.world === id),
          `${id}: existing portable save contains construction`,
        );
      }
      await p.reload({ waitUntil: "domcontentloaded" });
      // Save/Resume auto-restores shortly after load; let it finish before reopening.
      if (width === 1024)
        await p
          .getByText(/your work was restored/i)
          .first()
          .waitFor();
      await p.locator(".adventure-world .adventure-enter").click();
      assert.equal(await first.inputValue(), revised);
      assert.equal(await p.locator(".adventure-model-a svg").count(), 1);
      await p.getByRole("button", { name: "Use model A", exact: true }).press("Enter");
      assert.equal(await first.inputValue(), startValue);
      await renderCheck(p, `world-${id}`, width, ".adventure-dialog");
      const answer = await p.evaluate((id) => {
        const puzzle = FlagshipPuzzles.create(id, 0, 0, "en");
        let result = null;
        function search(values) {
          if (result) return;
          const f = puzzle.fields[values.length];
          if (!f) {
            if (puzzle.check(values)) result = values;
            return;
          }
          for (let n = f.min ?? 0; n <= (f.max ?? f.options.length - 1); n++)
            search([...values, n]);
        }
        search([]);
        return result;
      }, id);
      assert.ok(answer, id + " has a mathematical construction");
      for (let i = 0; i < answer.length; i++) {
        const field = p.locator(`#expedition-input-${i}`);
        if ((await field.evaluate((el) => el.tagName)) === "SELECT")
          await field.selectOption(String(answer[i]));
        else await field.fill(String(answer[i]));
      }
      await p.locator(".adventure-dialog > button.adventure-enter").first().click();
      assert.match(await p.locator(".adventure-puzzle-feedback").innerText(), /restored/);
      assert.equal(await p.evaluate(() => FlagshipAdventure.progress.site), 1);
      assert.equal(await p.locator(".adventure-compare-tools button:not(:disabled)").count(), 0);
      assert.equal(
        await p.locator(".adventure-continue").evaluate((el) => el === document.activeElement),
        true,
      );
      report.push({
        id: `world-${id}`,
        width,
        modelComparison: true,
        undo: true,
        resume: true,
        nativeMathCompletion: true,
      });
      await c.close();
    }
  }
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
console.log(JSON.stringify({ checks: report.length, results: report, screenshots: out }, null, 2));
