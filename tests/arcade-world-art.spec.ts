import { expect, test } from "@playwright/test";

test("archipelago links lead to real lesson units and remain keyboard accessible", async ({ page }) => {
  await page.goto("/math/games/practice-arcade/map.html");
  await expect(page.locator(".world-map-art img")).toBeVisible();
  await expect(page.locator(".world-map-art img")).toHaveJSProperty("complete", true);
  await expect(page.locator(".world")).toHaveCount(10);
  await page.getByRole("link", { name: /Unit 3 Ratio Reef/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#unit-3")).toBeFocused();
  await expect(page.locator("#unit-3 .lesson").first()).toHaveAttribute("href", /lesson=/);
});

test("every unit expedition definition resolves to a shipped environment image", async ({ page }) => {
  await page.goto("/math/games/practice-arcade/map.html");
  const missing = await page.evaluate(async () => {
    const ids = ["u1-decimal-dash", "u1-factor-frenzy", "u2-fraction-frenzy", "u3-ratio-rush", "u4-percent-power", "u5-area-attack", "u6-expression-express", "u7-equation-quest", "u8-data-dash", "u9-coordinate-quest", "u10-volume-blast"];
    const missing: string[] = [];
    for (const id of ids) {
      const source = await (await fetch(`/math/games/${id}/expedition.js`)).text();
      const art = source.match(/art:\s*["']([^"']+)["']/)?.[1];
      if (!art || !(await fetch(art, { method: "HEAD" })).ok) missing.push(id);
    }
    return missing;
  });
  expect(missing).toEqual([]);
});

test("Ratio Rush uses original art in its mission and ratios drive live canal flow", async ({ page }) => {
  await page.goto("/math/games/u3-ratio-rush/?expedition=1");
  await expect.poll(() => page.evaluate(() => Boolean((window as any).rrGame?.scene.getScene("ExpeditionMap")?.sys.isActive()))).toBe(true);
  await page.evaluate(() => (window as any).rrGame.scene.getScene("ExpeditionMap").launch(0));
  await expect.poll(() => page.evaluate(() => Boolean((window as any).rrGame?.scene.getScene("Expedition")?.sys.isActive()))).toBe(true);
  const state = await page.evaluate(() => {
    const game = (window as any).rrGame;
    const scene = game.scene.getScene("Expedition");
    const art = scene.children.list.find((item: any) => item.texture?.key === "ewl-world-u3-ratio-rush");
    const canal = () => scene.children.list.find((item: any) => item.type === "Text" && /complete batch|complete batches/.test(item.text))?.text;
    const before = canal();
    const up = scene.controller.actions.find((action: any) => action.key === "ArrowUp");
    for (let i = 0; i < 8; i++) up.run();
    return { art: Boolean(art), before, after: canal() };
  });
  expect(state.art).toBe(true);
  expect(state.before).toMatch(/^0 complete batches/);
  expect(state.after).toMatch(/[1-9] complete batch/);
  await expect(page.locator("canvas").first()).toBeVisible();
});

for (const id of ["u4-percent-power", "u10-volume-blast"]) {
  test(`${id} loads its environment inside a playable mission`, async ({ page }) => {
    const handle = id === "u4-percent-power" ? "ppGame" : "vbGame";
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`/math/games/${id}/?expedition=1`);
    await expect.poll(() => page.evaluate((name) => Boolean((window as any)[name]?.scene.getScene("ExpeditionMap")?.sys.isActive()), handle)).toBe(true);
    await page.evaluate((name) => (window as any)[name].scene.getScene("ExpeditionMap").launch(0), handle);
    await expect.poll(() => page.evaluate(({ name, gameId }) => {
      const scene = (window as any)[name].scene.getScene("Expedition");
      return scene?.sys.isActive() && scene.children.list.some((item: any) => item.texture?.key === `ewl-world-${gameId}`);
    }, { name: handle, gameId: id }), { timeout: 15_000 }).toBe(true);
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    expect((await canvas.boundingBox())!.y + (await canvas.boundingBox())!.height).toBeLessThan(713);
  });
}

test("Ratio Rush completion offers an optional bilingual strategy sentence frame", async ({ page }) => {
  await page.goto("/math/games/u3-ratio-rush/?expedition=1");
  await expect.poll(() => page.evaluate(() => Boolean((window as any).rrGame?.scene.getScene("ExpeditionMap")?.sys.isActive()))).toBe(true);
  await page.evaluate(() => (window as any).rrGame.scene.getScene("ExpeditionMap").launch(0));
  await expect.poll(() => page.evaluate(() => Boolean((window as any).rrGame?.scene.getScene("Expedition")?.sys.isActive()))).toBe(true);
  await page.evaluate(async () => {
    const scene = (window as any).rrGame.scene.getScene("Expedition");
    scene.misses = 2;
    scene.hintsUsed = 2;
    await scene.hint();
  });
  const scene = () => page.evaluate(() => (window as any).rrGame.scene.getScene("Expedition").studio?.actions?.map((a: any) => a.label));
  await expect.poll(scene).toContainEqual({ en: "Show a strategy sentence frame", es: "Mostrar un marco para explicar la estrategia" });
  await page.getByRole("button", { name: "Show a strategy sentence frame (e)" }).click();
  await expect(page.locator(".cabinet-feedback")).toContainText("The two water setups are equivalent because ___.");
  await page.getByRole("button", { name: "Hide the sentence frame (e)" }).click();
  await expect(page.locator(".cabinet-feedback")).toBeEmpty();
});

test("Equation Quest sentence frame follows the saved Spanish language", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("nt-lang", "es"));
  await page.goto("/math/games/u7-equation-quest/?expedition=1");
  await expect.poll(() => page.evaluate(() => Boolean((window as any).eqGame?.scene.getScene("ExpeditionMap")?.sys.isActive()))).toBe(true);
  await page.evaluate(() => (window as any).eqGame.scene.getScene("ExpeditionMap").launch(0));
  await expect.poll(() => page.evaluate(() => Boolean((window as any).eqGame?.scene.getScene("Expedition")?.sys.isActive()))).toBe(true);
  await page.evaluate(async () => {
    const scene = (window as any).eqGame.scene.getScene("Expedition");
    scene.misses = 2;
    scene.hintsUsed = 2;
    await scene.hint();
  });
  await page.getByRole("button", { name: "Mostrar un marco para explicar la estrategia (e)" }).click();
  await expect(page.locator(".cabinet-feedback")).toContainText("Hice ___ en ambos lados, así la ecuación sigue equilibrada.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
