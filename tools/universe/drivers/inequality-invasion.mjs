// Browser driver for Inequality Invasion: level 1 "First Light" through the
// real interface. Walking is real ticks; every rule and every wave is a real
// console click. "At most 8" is first set as x < 8: the glimmer carrying 8
// must be turned away and the boundary slip tagged; then x ≤ 8 lights the garden.

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
  const room = (i) => u(`window.__universe.world.rooms[${i}]`);
  const setRule = async (r, gate, sym, k) => {
    await u(`window.walkTo(${r.gatesX[gate]})`);
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel")
      return fail(`gate ${gate + 1} did not open`);
    await host.locator("#panel").getByRole("button", { name: sym, exact: true }).click();
    let now = Number(await host.locator("#panel .stepper output").innerText());
    while (now < k) {
      await host.locator("#panel").getByRole("button", { name: "One more" }).click();
      now++;
    }
    while (now > k) {
      await host.locator("#panel").getByRole("button", { name: "One fewer" }).click();
      now--;
    }
    await host.getByRole("button", { name: "Set the rule" }).click();
  };
  const release = async (r) => {
    await u(`window.walkTo(${r.x0 + 100})`);
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel")
      return fail("the release lever did not open");
    await host.getByRole("button", { name: "Release", exact: true }).click();
    await u(() => {
      const g = window.__universe;
      for (let i = 0; i < 2000 && g.world.rooms.some((x) => x.run); i++) g.stepFrames(1, 0);
    });
  };

  let r = await room(0);
  await setRule(r, 0, "<", 8);
  await axe("gate");
  await release(r);
  r = await room(0);
  if (r.done) return fail("x < 8 lit the garden for 'at most 8'");
  const eight = r.last.find((g) => g.v === 8);
  if (eight?.state !== "side") fail("the glimmer carrying 8 was not turned away by x < 8");
  const tag = await u(
    () => window.__universe.evidence.events.filter((e) => e.misconception).at(-1)?.misconception,
  );
  if (tag !== "inequality-boundary-inclusion") fail(`x < 8 was tagged "${tag}"`);
  await setRule(r, 0, "≤", 8);
  await release(r);
  if (!(await room(0)).done) return fail("x ≤ 8 did not light the garden");
  r = await room(1);
  await setRule(r, 0, ">", 4);
  await release(r);
  if (!(await room(1)).done) return fail("x > 4 did not light the second garden");
  r = await room(2);
  await setRule(r, 0, "≥", 10);
  await release(r);
  if (!(await room(2)).done) return fail("x ≥ 10 did not light the third garden");
  const e = await u(() => window.__universe.world.exit);
  await u(`window.walkTo(${e.x + 60})`);
}
