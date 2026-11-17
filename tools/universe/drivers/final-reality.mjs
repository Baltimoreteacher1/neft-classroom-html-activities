// Browser driver for The Final Reality: level 1 "The Unraveling" through the
// real interface. Wren climbs the arena by real jumps (via the step ledges)
// while the Engine's pulses run; every ring is set at its console with real
// clicks. A one-sided move on the shutdown equation is tried first.

const MOVE = `(tx, ty) => {
  const g = window.__universe;
  for (let i = 0; i < 2400 && g.mode === "play"; i++) {
    const p = g.world.p;
    const cx = p.x + p.w / 2;
    const feet = p.y + p.h;
    if (Math.abs(cx - tx) < 10 && p.ground && Math.abs(feet - ty) < 4) return true;
    let m = cx < tx - 8 ? 2 : cx > tx + 8 ? 1 : 0;
    if (ty < feet - 4 && Math.abs(cx - tx) < 160 && p.ground) m |= 16;
    if (!p.ground && ty < feet - 4) m |= 16;
    if (ty > feet + 4 && p.ground && Math.abs(cx - tx) < 200) m |= 8;
    g.stepFrames(1, m);
  }
  return false;
}`;

export async function drive({ host, u, fail, axe }) {
  await u(`window.moveTo = ${MOVE}`);
  const go = async (...points) => {
    for (const [x, y] of points) await u(`window.moveTo(${x}, ${y})`);
  };
  const open = async (stage) => {
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel") {
      const at = await u(() => [
        Math.round(window.__universe.world.p.x),
        Math.round(window.__universe.world.p.y),
      ]);
      fail(`ring ${stage + 1}'s console did not open (Wren at ${at})`);
      return false;
    }
    return true;
  };
  const setStep = async (i, v) => {
    const out = host.locator("#panel .stepper output").nth(i);
    let now = Number(await out.innerText());
    while (now < v) {
      await host
        .locator("#panel .stepper")
        .nth(i)
        .getByRole("button", { name: "One more" })
        .click();
      now++;
    }
    while (now > v) {
      await host
        .locator("#panel .stepper")
        .nth(i)
        .getByRole("button", { name: "One fewer" })
        .click();
      now--;
    }
  };
  const stage = () => u(() => window.__universe.world.stage);

  await go([180, 520]);
  if (!(await open(0))) return;
  await setStep(0, 3);
  await host.getByRole("button", { name: "Set it" }).click();
  if ((await stage()) !== 1) return fail("height 3 did not drop the housing ring");

  await go([525, 470], [330, 400]);
  if (!(await open(1))) return;
  await axe("conduit console");
  await setStep(0, 3);
  await setStep(1, 12);
  await host.getByRole("button", { name: "Set it" }).click();
  if ((await stage()) !== 2) return fail("3x + 12 did not drop the power ring");

  await go([1250, 520]);
  if (!(await open(2))) return;
  await host.locator("#panel").getByRole("button", { name: "3", exact: true }).click();
  if ((await stage()) !== 3) return fail("3 miles per minute did not drop the transport ring");

  await go([915, 470], [1120, 400]);
  if (!(await open(3))) return;
  await host
    .locator("#panel .chips")
    .nth(0)
    .getByRole("button", { name: "≥", exact: true })
    .click();
  await setStep(0, 7);
  await host
    .locator("#panel .chips")
    .nth(1)
    .getByRole("button", { name: "<", exact: true })
    .click();
  await setStep(1, 12);
  await host.getByRole("button", { name: "Set it" }).click();
  if ((await stage()) !== 4) return fail("7 ≤ x < 12 did not drop the barrier ring");

  await go([915, 470], [835, 380], [720, 290]);
  if (!(await open(4))) return;
  await setStep(0, 6);
  await host.getByRole("button", { name: "Subtract from the left side only" }).click();
  const eq = await u(() => window.__universe.world.stages[4].eq);
  if (eq.b !== 6) fail("a one-sided move was not undone");
  if (!(await open(4))) return;
  await setStep(0, 6);
  await host.getByRole("button", { name: "Subtract from both sides" }).click();
  if (!(await open(4))) return;
  await setStep(0, 4);
  await host.getByRole("button", { name: "Divide both sides" }).click();
  if (!(await u(() => window.__universe.world.done)))
    return fail("x = 6 did not shut the Engine down");
  await u(() => window.__universe.stepFrames(10, 0));
}
