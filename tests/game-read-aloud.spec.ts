/**
 * Read-aloud contract for the eleven unit arcade games.
 *
 * Game Studio's "Read aloud" toggle speaks whatever a game writes into a
 * polite/status live region (every game announces its feedback that way).
 * The speech API is stubbed so the test can read exactly what would be spoken.
 *
 * Asserts, on every unit game:
 *   - the toggle exists and starts OFF (opt-in; nothing spoken by default);
 *   - while OFF, a live-region announcement is not spoken;
 *   - once ON, a new live-region announcement is spoken, in English;
 *   - the preference persists in the Game Studio storage key.
 */
import { test, expect, type Page } from "@playwright/test";

const UNIT_GAMES = [
  "/math/games/u1-factor-frenzy/",
  "/math/games/u1-decimal-dash/",
  "/math/games/u2-fraction-frenzy/",
  "/math/games/u3-ratio-rush/",
  "/math/games/u4-percent-power/",
  "/math/games/u5-area-attack/",
  "/math/games/u6-expression-express/",
  "/math/games/u7-equation-quest/",
  "/math/games/u8-data-dash/",
  "/math/games/u9-coordinate-quest/",
  "/math/games/u10-volume-blast/",
];

async function installSpeechStub(page: Page) {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    class FakeUtterance {
      text: string;
      lang = "";
      rate = 1;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: FakeUtterance,
      configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak: (u: FakeUtterance) => spoken.push(`${u.lang}|${u.text}`),
        cancel: () => {},
      },
    });
    Object.defineProperty(window, "__spoken", { value: spoken, configurable: true });
  });
}

async function announce(page: Page, text: string) {
  await page.evaluate((msg) => {
    const region = document.createElement("div");
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.textContent = msg;
    document.body.appendChild(region);
  }, text);
}

for (const path of UNIT_GAMES) {
  test(`read aloud is opt-in and speaks announcements: ${path}`, async ({ page }) => {
    await installSpeechStub(page);
    await page.goto(path, { waitUntil: "domcontentloaded" });

    const toggle = page.getByRole("button", { name: /read aloud/i });
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await announce(page, "Off announcement should stay silent.");
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => (window as any).__spoken.length)).toBe(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await announce(page, "Correct. Two to three is the same as four to six.");
    await expect
      .poll(() => page.evaluate(() => (window as any).__spoken.slice(-1)[0]))
      .toBe("en-US|Correct. Two to three is the same as four to six.");

    const stored = await page.evaluate(() => localStorage.getItem("ewl-game-studio-v1"));
    expect(JSON.parse(stored || "{}").readAloud).toBe(true);
  });
}
