import { expect, type Page, test } from "@playwright/test";

/* Order Up! (curriculum/division-foundry) — the delivery-route campaign.
   Every serve here goes through the real notebook entry: the test reads the
   problem off the page, works it with exact fractions, and types the answer. */

const URL = "/curriculum/division-foundry/";
const KEY = "neft-division-foundry-v3";

type Frac = { n: number; d: number };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a) || 1);
const red = (f: Frac): Frac => {
  const g = gcd(f.n, f.d);
  return { n: f.n / g, d: f.d / g };
};
/* "3 1/2", "3/4", "18.9", "1344" → exact fraction. */
function parseOperand(raw: string): Frac {
  const s = raw.replace(/,/g, "").trim();
  const mixed = s.match(/^(\d+) (\d+)\/(\d+)$/);
  if (mixed) return red({ n: +mixed[1] * +mixed[3] + +mixed[2], d: +mixed[3] });
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return red({ n: +frac[1], d: +frac[2] });
  const places = (s.split(".")[1] || "").length;
  const scale = 10 ** places;
  return red({ n: Math.round(Number(s) * scale), d: scale });
}
function quotient(label: string): Frac {
  const [a, b] = label.replace(/=\s*$/, "").split("÷");
  const A = parseOperand(a);
  const B = parseOperand(b);
  return red({ n: A.n * B.d, d: A.d * B.n });
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}
const money = async (page: Page) =>
  Number((await page.locator("#gStars").textContent())?.replace("$", ""));
const entry = (page: Page) => page.locator("#floor .forge-entry").first();
const label = async (page: Page) =>
  (await entry(page).locator(".fe-label").first().textContent()) || "";

async function typeAnswer(page: Page, ans: Frac) {
  const inputs = entry(page).locator("input");
  if ((await inputs.count()) === 1) {
    expect(ans.d, "single box expects a whole answer").toBe(1);
    await inputs.first().fill(String(ans.n));
  } else {
    await inputs.nth(0).fill(String(ans.n));
    await inputs.nth(1).fill(String(ans.d));
  }
  await entry(page).locator("button").click();
}

/* Open stop `i` on the board, serve it correctly, return the receipt pay. */
async function serveStop(page: Page, i: number) {
  await page.locator("#contractRow .ticket").nth(i).click();
  await expect(page.locator("#scPlay")).toHaveClass(/on/);
  await typeAnswer(page, quotient(await label(page)));
  const receipt = page.locator("#say.good");
  await expect(receipt).toBeVisible();
  const pay = Number(
    (await receipt.locator(".forged strong").first().textContent())?.replace("$", ""),
  );
  expect(pay).toBeGreaterThan(0);
  return pay;
}
async function backToMap(page: Page) {
  await page.locator("#say.good button").click();
  await expect(page.locator("#scMap")).toHaveClass(/on/);
}

async function fresh(page: Page, seed?: unknown) {
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.clear();
      localStorage.setItem("ewl-game-studio-v1", JSON.stringify({ reducedMotion: true }));
      if (value !== null) localStorage.setItem(key as string, value as string);
    },
    [KEY, seed === undefined ? null : typeof seed === "string" ? seed : JSON.stringify(seed)],
  );
  await page.goto(URL);
  await expect(page.locator("#districtStrip .dist-btn")).toHaveCount(5);
}

test.describe("Order Up! delivery route", () => {
  test("clearing Market Street with real serves, then a built upgrade opens the Harbor; progress survives reload", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await fresh(page);
    await expect(page.locator("#gRoute")).toHaveText("0/5");
    await expect(page.locator(".district-card .dc-name")).toHaveText("Market Street");
    // Harbor is locked: selecting it shows the reason, and its tickets cannot be cooked.
    await page.locator(".dist-btn", { hasText: "Harbor Docks" }).click();
    await expect(page.locator(".district-card .dc-lock")).toContainText("clear Market Street");
    await expect(page.locator("#contractRow .ticket").first()).toBeDisabled();
    await page.locator(".dist-btn", { hasText: "Market Street" }).click();

    let total = 0;
    for (let i = 0; i < 3; i++) {
      const before = await money(page);
      const pay = await serveStop(page, i);
      total += pay;
      expect(await money(page)).toBe(before + pay);
      if (i === 2)
        await expect(page.locator("#say .cleared-line")).toContainText("Market Street is cleared");
      await backToMap(page);
    }
    await expect(page.locator("#gRoute")).toHaveText("1/5");
    await expect(page.locator("#contractRow .t-served")).toHaveCount(3);
    expect(await money(page)).toBe(total);

    // The Harbor still needs the Cold Box. Building it opens the district.
    await page.locator(".dist-btn", { hasText: "Harbor Docks" }).click();
    await expect(page.locator(".district-card .dc-lock")).toContainText("build the Cold Box");
    await page.getByRole("button", { name: "Build the Cold Box for 30 dollars" }).click();
    expect(await money(page)).toBe(total - 30);
    await expect(page.locator(".district-card .dc-lock")).toHaveCount(0);
    await expect(page.locator("#contractRow .ticket").first()).toBeEnabled();

    await page.reload();
    await expect(page.locator("#gRoute")).toHaveText("1/5");
    await expect(page.locator("#gStars")).toHaveText(`$${total - 30}`);
    await expect(page.locator(".district-card .dc-name")).toHaveText("Harbor Docks");
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), KEY);
    expect(saved.ver).toBe(4);
    expect(Object.keys(saved.route.done).sort()).toHaveLength(3);
    expect(saved.built.fridge).toBe(1);
    expect(errors).toEqual([]);
  });

  test("a wrong answer gives feedback and no pay; a served order cannot be paid twice", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await fresh(page);
    await page.locator("#contractRow .ticket").first().click();
    const firstLabel = await label(page);
    const ans = quotient(firstLabel);
    await typeAnswer(page, { n: ans.n + 1, d: ans.d });
    await expect(page.locator("#say.bad")).toBeVisible();
    await expect(page.locator(".nb-open")).toBeVisible(); // prep station opened as remediation
    expect(await money(page)).toBe(0);
    await expect(page.locator("#gRoute")).toHaveText("0/5");

    await typeAnswer(page, ans);
    await expect(page.locator("#say.good")).toBeVisible();
    const paid = await money(page);
    expect(paid).toBeGreaterThan(0);
    await expect(page.locator("#say.good")).toContainText("with a fix along the way");

    // Force the outer serve button back on and press it: the run is complete, nothing more is paid.
    await page.evaluate(() => {
      const b = document.getElementById("bLock") as HTMLButtonElement;
      b.disabled = false;
      b.style.display = "";
      b.click();
      b.click();
    });
    expect(await money(page)).toBe(paid);
    const jobs = await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k) || "{}").jobsDone,
      KEY,
    );
    expect(jobs).toBe(1);

    // Replaying the same stop is new work with new numbers — not a re-collect.
    await backToMap(page);
    await page.locator("#contractRow .ticket").first().click();
    expect(await label(page)).not.toBe(firstLabel);
    await page.locator("#bMap").click();
    expect(await money(page)).toBe(paid);
    expect(errors).toEqual([]);
  });

  test("a version-3 save loads into the route; a broken save starts clean", async ({
    page,
    context,
  }) => {
    const errors = watchErrors(page);
    await fresh(page, {
      stars: { "tower:0": 3, "slide:0": 2, "tape:0": 1, "tower:2": 2 },
      ingots: 55,
      built: { griddle: 1 },
      jobsDone: 4,
      celebrated: false,
      introSeen: 1,
    });
    await expect(page.locator("#gStars")).toHaveText("$55");
    await expect(page.locator("#gLv")).toHaveText("1/7");
    await expect(page.locator("#gRoute")).toHaveText("1/5");
    await expect(page.locator("#howto")).toBeHidden();
    await expect(page.locator("#contractRow .t-served")).toHaveCount(3);
    await expect(page.locator(".dist-btn", { hasText: "Market Street" })).toContainText("Cleared");
    // Starred legacy stop in a later district counts toward it, but the district stays locked until reached.
    await expect(page.locator(".dist-btn", { hasText: "Sunny Park" })).toContainText("Locked");
    await page.locator(".dist-btn", { hasText: "Harbor Docks" }).click();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), KEY);
    expect(saved.ver).toBe(4);
    expect(saved.ingots).toBe(55);
    expect(saved.route.done["tower:2"]).toBe(1);
    expect(errors).toEqual([]);

    const page2 = await context.newPage();
    const errors2 = watchErrors(page2);
    await page2.addInitScript((k) => localStorage.setItem(k, "{not json"), KEY);
    await page2.goto(URL);
    await expect(page2.locator("#gStars")).toHaveText("$0");
    await expect(page2.locator("#gRoute")).toHaveText("0/5");
    expect(errors2).toEqual([]);
  });

  test("the Festival capstone wins the season and a new season replays the route", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const done: Record<string, number> = {};
    for (const shop of ["tower", "slide", "tape", "kcf"])
      for (let lv = 0; lv < 4; lv++) done[`${shop}:${lv}`] = 1;
    await fresh(page, {
      ver: 4,
      stars: {},
      ingots: 0,
      built: { fridge: 1, awning: 1, lights: 1, sign: 1 },
      jobsDone: 16,
      introSeen: 1,
      route: { season: 1, done, at: "festival", finale: {} },
    });
    await expect(page.locator("#gRoute")).toHaveText("4/5");
    await expect(page.locator(".district-card .dc-name")).toHaveText("The Festival");
    let total = 0;
    for (let i = 0; i < 4; i++) {
      total += await serveStop(page, i);
      if (i < 3) await backToMap(page);
    }
    await expect(page.locator("#say .cleared-line")).toContainText("Season 1 is won");
    await page.locator("#say.good button").click();
    await expect(page.locator("#scDone")).toHaveClass(/on/);
    await expect(page.locator("#doneH")).toContainText("Festival champions");
    expect(await money(page)).toBe(total);
    await page.locator("#bSeason").click();
    await expect(page.locator("#scMap")).toHaveClass(/on/);
    await expect(page.locator("#seasonTag")).toContainText("Season 2");
    await expect(page.locator("#gRoute")).toHaveText("0/5");
    await expect(page.locator(".dist-btn", { hasText: "Harbor Docks" })).toContainText("Locked");
    expect(await money(page)).toBe(total);
    expect(errors).toEqual([]);
  });

  test("layout: 1366 and 390 screenshots, no horizontal overflow on phone", async ({
    page,
  }, info) => {
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1366, height: 900 });
    await fresh(page, { introSeen: 1, ingots: 64, stars: {}, built: { griddle: 1 } });
    await page.screenshot({ path: info.outputPath("foundry-1366.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow()).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath("foundry-390.png"), fullPage: true });
    await page.locator("#contractRow .ticket").first().click();
    await expect(page.locator("#scPlay")).toHaveClass(/on/);
    const ans = quotient(await label(page));
    await typeAnswer(page, { n: ans.n + 2, d: ans.d });
    await expect(page.locator(".nb-open")).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath("foundry-390-play.png"), fullPage: true });
    expect(errors).toEqual([]);
  });
});
