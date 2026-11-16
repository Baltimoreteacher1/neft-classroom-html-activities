// Browser driver for Ratio Rush: level 1 "Coupling Run" through the real
// interface. Travel is simulated tick by tick through the game's own
// stepFrames; every decision is a real click. It sets a wrong gear first, opens
// a Reality Shift with an equivalent gear and checks both runs, rewinds with the
// Time Machine, then couples all three partner trains.

const STEP_TO = `(x) => {
  const g = window.__universe;
  for (let i = 0; i < 6000 && g.mode === "play"; i++) {
    const tr = g.world.train;
    if (tr.mode !== "drive") { g.stepFrames(1, 0); continue; }
    if (tr.x >= x - 0.02 && Math.abs(tr.v) < 0.0004) return true;
    const cart = g.world.carts.find((c) => c.lane === 0 && c.x > tr.x && c.x - tr.x < 2.4);
    const xo = g.world.crossovers.find((c) => Math.abs(c - tr.x) < 0.3);
    const clear = !g.world.carts.some((c) => c.lane === 0 && Math.abs(c.x - tr.x) < 0.9);
    let m = tr.x < x - 0.9 ? 2 : tr.v > 0.006 ? 1 : tr.x < x - 0.02 ? 2 : 0;
    if (tr.laneT) m = 0;
    else if (tr.lane === 0 && cart && xo !== undefined) m = 4;
    else if (tr.lane === 0 && cart && cart.x - tr.x < 1) m = tr.v > 0 ? 1 : 0;
    else if (tr.lane === 1 && xo !== undefined && !g.world.carts.some((c) => c.lane === 0 && c.x > tr.x)) m = clear ? 8 : tr.v > 0 ? 1 : 0;
    g.stepFrames(1, m);
  }
  return false;
}`;

export async function drive({ host, u, fail, axe }) {
  await u(`window.driveTo = ${STEP_TO}`);
  const world = () => u(() => window.__universe.world);
  const settle = () =>
    u(() => {
      const g = window.__universe;
      for (let i = 0; i < 3000 && g.subject.worlds.some((w) => w.train.mode !== "drive"); i++)
        g.stepFrames(1, 0);
    });
  const gear = async (d, t) => {
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel")
      return fail("the gear console did not open at the signal");
    await host
      .locator("#panel")
      .getByRole("button", { name: String(d), exact: true })
      .click();
    let now = Number(await host.locator("#panel .stepper output").innerText());
    while (now < t) {
      await host.locator("#panel").getByRole("button", { name: "One more" }).click();
      now++;
    }
    while (now > t) {
      await host.locator("#panel").getByRole("button", { name: "One fewer" }).click();
      now--;
    }
    await host.getByRole("button", { name: "Release the brake" }).click();
    await settle();
  };

  if (!(await u(() => window.driveTo(4)))) return fail("the train never reached the first signal");
  await u(() => window.__universe.tryInteract());
  await axe("gear console");
  if (
    await host
      .locator("#panel")
      .getByText(/you(?:'ll| will)? arrive|llegas/i)
      .count()
  )
    fail("the gear console predicts the arrival before the run");
  await host.locator("#panel").getByRole("button", { name: "Close" }).click();

  // Additive misconception: 4 : 3 is 3 : 2 with one added to each.
  await gear(4, 3);
  if ((await world()).stops[0].done) fail("4 : 3 coupled with 3 : 2");
  const tag = await u(
    () =>
      window.__universe.evidence.events.at(-1)?.misconception ||
      window.__universe.evidence.events.find((e) => e.misconception)?.misconception,
  );
  if (tag !== "ratio-scaled-additively") fail(`the additive gear was tagged "${tag}"`);

  // Reality Shift: same run with 6 : 4 in a second reality.
  await host.locator("#btnShift").click();
  await host.locator("#veil").getByRole("button", { name: "6", exact: true }).click();
  await host.locator("#veil").getByRole("button", { name: "One more" }).click();
  await host.getByRole("button", { name: "Open it" }).click();
  if (!(await u(() => window.__universe.subject.shifted)))
    return fail("Reality Shift did not open a second reality");
  await u(() => window.__universe.tryInteract());
  await host.getByRole("button", { name: "Release the brake" }).click();
  await u(() => window.__universe.stepFrames(90, 0));
  const mid = await u(() =>
    window.__universe.subject.worlds.map((w) => w.run && [w.run.you, w.run.them]),
  );
  if (!mid[1] || mid[1][0] !== mid[1][1])
    fail("in the shifted reality 6 : 4 did not stay level with 3 : 2");
  await settle();
  await host.locator("#btnShift").click();
  const changed = await host.getByRole("row", { name: /Your rate/ }).innerText();
  if (!/4 : 3[\s\S]*6 : 4/.test(changed))
    fail(`the investigation table does not compare the two gears: ${changed}`);
  if (!(await host.locator("#veil canvas").count()))
    fail("no distance-time graph in the investigation view");
  await axe("reality shift");
  await host.getByRole("button", { name: "Switch reality" }).click();
  const after = await u(() => [
    window.__universe.subject.active,
    window.__universe.world.stops[0].done,
  ]);
  if (after[0] !== 1 || after[1] !== 1) fail("switching reality did not show the coupled train");

  // Time Machine back to before the wrong gear: the second reality closes.
  await host.locator("#btnTime").click();
  await host
    .getByRole("button", { name: /Rewind to before “Gear 4:3/ })
    .first()
    .click();
  if (await u(() => window.__universe.subject.shifted))
    fail("rewinding before the shift kept the second reality");
  await gear(6, 4);
  if (!(await world()).stops[0].done) return fail("6 : 4 did not couple");
  await u(() => window.driveTo(16));
  await gear(15, 12);
  if (!(await world()).stops[1].done) return fail("15 : 12 did not couple with 5 : 4");
  await u(() => window.driveTo(31));
  await gear(9, 12);
  if (!(await world()).stops[2].done) return fail("9 : 12 did not couple with 6 : 8");
  await u(() => {
    if (window.__universe.mode === "panel") window.__universe.closePanel();
    window.driveTo(43.5);
  });
}
