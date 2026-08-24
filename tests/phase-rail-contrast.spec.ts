import { expect, test } from "@playwright/test";

/**
 * The phase rail must stay readable in every state it can actually reach.
 *
 * `.phase-btn.active` and `.phase-btn.completed` carry equal specificity, so
 * `.completed` (declared later in design-system.css) took the background while
 * `.active`'s dark `color` survived — navy text on the navy rail at 1.14:1.
 * The label vanished. That state is not exotic: it is what every phase looks
 * like the moment a student finishes it while still standing on it, starting
 * with the warmup of 1-1 on the first day of school.
 *
 * This pins the readability of the state, not the specific colours, so a future
 * restyle is free to change the palette as long as the label can still be read.
 */

// WCAG 2.1 AA for normal-weight body text. The rail label is ~16px semibold,
// which does not qualify for the relaxed 3:1 large-text threshold.
const AA_NORMAL = 4.5;

async function enterLesson(page: import("@playwright/test").Page) {
  const start = page.locator(".flagship-mission-start");
  if (await start.count()) {
    await start.click();
    await page.locator(".flagship-mission").waitFor({ state: "detached" });
  }
  await page.locator(".sidebar").waitFor();
}

/**
 * Contrast of an element's text against the first opaque background painted
 * behind it. Walking up for opacity is the whole point: the bug was a
 * translucent fill that let the dark rail show through, which a naive read of
 * `backgroundColor` on the element alone reports as a light colour and misses.
 */
function contrastInPage(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return { found: false as const };
  const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number);
  const opaque = (c: string) => {
    const p = parse(c);
    return p.length < 4 || p[3] === 1;
  };
  let bgEl: Element | null = el;
  let bg: string | null = null;
  while (bgEl) {
    const c = getComputedStyle(bgEl).backgroundColor;
    if (c && c !== "transparent" && opaque(c)) {
      bg = c;
      break;
    }
    bgEl = bgEl.parentElement;
  }
  bg = bg || "rgb(255,255,255)";
  const fg = getComputedStyle(el).color;
  const lum = ([r, g, b]: number[]) => {
    const f = (v: number) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const L1 = lum(parse(fg));
  const L2 = lum(parse(bg));
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return {
    found: true as const,
    fg,
    bg,
    label: (el.textContent || "").trim().replace(/\s+/g, " "),
    ratio: +((hi + 0.05) / (lo + 0.05)).toFixed(2),
  };
}

test.describe("phase rail readability", () => {
  test("the phase you are on and have completed keeps a readable label", async ({ page }) => {
    await page.goto("/lessons/1-1/?sn=Contrast%20Tester", { waitUntil: "networkidle" });
    await enterLesson(page);

    // Drive the rail into active+completed the way a student does: answer the
    // warmup and submit it. Correctness is irrelevant here — submitting is what
    // marks the phase complete, and the student stays on it afterwards.
    const groups = page.locator("input[type=radio][name^=warmup_q]");
    const names = new Set(await groups.evaluateAll((els) => els.map((e) => e.name)));
    for (const name of names) {
      await page.locator(`input[type=radio][name="${name}"]`).first().check();
    }
    await page.getByRole("button", { name: /Submit Warmup Answers/i }).click();

    const btn = page.locator(".phase-btn.active.completed");
    await expect(btn).toHaveCount(1);

    const result = await page.evaluate(contrastInPage, ".phase-btn.active.completed");
    expect(result.found).toBe(true);
    if (!result.found) return;
    expect(
      result.ratio,
      `Phase rail label "${result.label}" renders ${result.fg} on ${result.bg} ` +
        `= ${result.ratio}:1, below the ${AA_NORMAL}:1 AA floor.`,
    ).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  test("the phase number badge is readable in every state it reaches", async ({ page }) => {
    await page.goto("/lessons/1-1/?sn=Badge%20Tester", { waitUntil: "networkidle" });
    await enterLesson(page);

    // Measured per STATE, not once. The first version of this suite checked
    // only active+completed — which a student reaches by finishing a phase —
    // and so missed that plain `active`, the state they look at the whole time
    // before finishing, was the worst in the rail at 2.54:1.
    const badges = async (when: string) => {
      const rows = await page.evaluate(() => {
        const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number);
        const lum = (p: number[]) => {
          const f = (v: number) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]);
        };
        const seen = new Map<string, any>();
        for (const btn of Array.from(document.querySelectorAll(".phase-btn"))) {
          const num = btn.querySelector(".phase-num");
          if (!num) continue;
          const cs = getComputedStyle(num);
          const bg = cs.backgroundColor;
          // A transparent badge inherits the rail behind it and is measured by
          // the label assertion above, not here.
          const alpha = parse(bg);
          if (alpha.length === 4 && alpha[3] === 0) continue;
          const state =
            ["active", "completed", "locked"].filter((c) => btn.classList.contains(c)).join("+") ||
            "idle";
          if (seen.has(state)) continue;
          const L1 = lum(parse(cs.color));
          const L2 = lum(parse(bg));
          const hi = Math.max(L1, L2);
          const lo = Math.min(L1, L2);
          const large =
            parseFloat(cs.fontSize) >= 24 ||
            (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700);
          seen.set(state, {
            state,
            fg: cs.color,
            bg,
            // 4.5 inlined, not AA_NORMAL: this function is serialised into the
            // page, where Node-scope constants do not exist.
            floor: large ? 3 : 4.5,
            ratio: +((hi + 0.05) / (lo + 0.05)).toFixed(2),
          });
        }
        return [...seen.values()];
      });
      for (const r of rows) {
        expect(
          r.ratio,
          `${when}: the "${r.state}" phase badge renders ${r.fg} on ${r.bg} = ${r.ratio}:1, ` +
            `below its ${r.floor}:1 floor.`,
        ).toBeGreaterThanOrEqual(r.floor);
      }
      return rows.length;
    };

    expect(await badges("on arrival"), "at least one badge measured").toBeGreaterThan(0);

    const groups = page.locator("input[type=radio][name^=warmup_q]");
    const names = new Set(await groups.evaluateAll((els) => els.map((e) => e.name)));
    for (const name of names) {
      await page.locator(`input[type=radio][name="${name}"]`).first().check();
    }
    await page.getByRole("button", { name: /Submit Warmup Answers/i }).click();
    await expect(page.locator(".phase-btn.active.completed")).toHaveCount(1);

    await badges("after completing a phase");
  });
});
