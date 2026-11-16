// Browser driver for Fraction Food Truck: level 1 "Soup Station" through the
// real interface. Walking is real ticks; every serving is a real console click.
// The first order is served with one bowl too many (the fifth comes up empty),
// then correctly; the share order is first answered with the reciprocal slip
// (3/4 × 3 = 9/4), then with 1/4.

const WALK = `(tx) => {
  const g = window.__universe;
  for (let i = 0; i < 1500 && g.mode === "play"; i++) {
    const cx = g.world.p.x + g.world.p.w / 2;
    if (Math.abs(cx - tx) < 8 && Math.abs(g.world.p.vx) < 0.3) return true;
    g.stepFrames(1, cx < tx ? 2 : 1);
    if (Math.abs(cx - tx) < 30) g.stepFrames(4, 0);
  }
  return false;
}`;

export async function drive({ host, u, fail, axe }) {
  await u(`window.walkTo = ${WALK}`);
  const settle = () =>
    u(() => {
      const g = window.__universe;
      for (let i = 0; i < 900 && g.world.serving; i++) g.stepFrames(1, 0);
    });
  const open = async () => {
    await u("window.walkTo(640)");
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel") {
      fail("the serving station did not open");
      return false;
    }
    return true;
  };
  const setStep = async (index, value) => {
    const out = host.locator("#panel .stepper output").nth(index);
    let now = Number(await out.innerText());
    while (now < value) {
      await host
        .locator("#panel .stepper")
        .nth(index)
        .getByRole("button", { name: "One more" })
        .click();
      now++;
    }
    while (now > value) {
      await host
        .locator("#panel .stepper")
        .nth(index)
        .getByRole("button", { name: "One fewer" })
        .click();
      now--;
    }
  };
  const serveCount = async (n) => {
    if (!(await open())) return;
    await setStep(0, n);
    await host.getByRole("button", { name: "Serve", exact: true }).click();
    await settle();
  };
  const serveShare = async (n, d) => {
    if (!(await open())) return;
    await setStep(0, n);
    await setStep(1, d);
    await host.getByRole("button", { name: "Serve", exact: true }).click();
    await settle();
  };
  const current = () => u(() => window.__universe.world.current);

  await serveCount(5);
  const short = await u(() => window.__universe.world.served.at(-1));
  if (short.ok || short.got.at(-1).n !== 0)
    fail("five bowls of 3/4 from 3 cups did not leave the fifth bowl empty");
  await axe("kitchen");
  await serveCount(4);
  if ((await current()) !== 1) return fail("4 bowls did not fill the first order");
  await serveCount(6);
  if ((await current()) !== 2)
    return fail("6 servings of 1/3 from 2 did not fill the second order");
  await serveShare(9, 4);
  const tag = await u(
    () => window.__universe.evidence.events.filter((e) => e.misconception).at(-1)?.misconception,
  );
  if (tag !== "fraction-no-reciprocal") fail(`9/4 for 3/4 ÷ 3 was tagged "${tag}"`);
  await serveShare(1, 4);
  if ((await current()) !== 3) return fail("1/4 each did not fill the share order");
  await serveCount(6);
  if ((await current()) !== 4) return fail("6 servings of 2/3 from 4 did not fill the last order");
}
