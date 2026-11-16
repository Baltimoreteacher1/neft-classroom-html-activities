// Browser driver for Expression Factory: level 1 "Assembly Line" through the
// real interface. Walking is real ticks; every machine and every run is a real
// console click. Room 0 is built in the wrong order first (3(x + 2) for 3x + 2):
// every crate must be rejected and the slip tagged, then rebuilt and filled.

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
  const slotX = (r, i) => r.x0 + 170 + ((930 - 170) * (i + 1)) / (r.line.length + 1);
  const install = async (r, slot, op, k) => {
    await u(`window.walkTo(${slotX(r, slot)})`);
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel")
      return fail(`slot ${slot + 1} did not open`);
    await host.locator("#panel").getByRole("button", { name: op }).click();
    let now = Number(await host.locator("#panel .stepper output").innerText());
    while (now < k) {
      await host.locator("#panel").getByRole("button", { name: "One more" }).click();
      now++;
    }
    while (now > k) {
      await host.locator("#panel").getByRole("button", { name: "One fewer" }).click();
      now--;
    }
    await host.getByRole("button", { name: "Install the machine" }).click();
  };
  const runLine = async (r, predictWith) => {
    await u(`window.walkTo(${r.x0 + 100})`);
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel")
      return fail("the start lever did not open");
    if (predictWith)
      await host.locator("#panel").getByRole("button", { name: predictWith, exact: true }).click();
    else await host.getByRole("button", { name: "Pull the lever" }).click();
    await u(() => {
      const g = window.__universe;
      for (let i = 0; i < 1200 && g.world.rooms.some((x) => x.run); i++) g.stepFrames(1, 0);
    });
  };

  let r = await room(0);
  await install(r, 0, "+ add", 2);
  await install(r, 1, "× multiply", 3);
  await axe("factory");
  await runLine(r, "11");
  r = await room(0);
  if (r.done) return fail("3(x + 2) filled an order for 3x + 2");
  if (!r.lastCrates.every((c) => c.state === "reject"))
    fail("not every crate was rejected for 3(x + 2)");
  const tag = await u(
    () => window.__universe.evidence.events.filter((e) => e.misconception).at(-1)?.misconception,
  );
  if (tag !== "order-of-operations-left-to-right") fail(`the reversed line was tagged "${tag}"`);
  await install(r, 0, "× multiply", 3);
  await install(r, 1, "+ add", 2);
  await runLine(r);
  if (!(await room(0)).done) return fail("3x + 2 did not fill the order");

  r = await room(1);
  await install(r, 0, "× multiply", 4);
  await install(r, 1, "+ add", 4);
  await runLine(r, "12");
  if (!(await room(1)).done) return fail("4x + 4 did not fill the order for 4(x + 1)");
  r = await room(2);
  await install(r, 0, "× multiply", 2);
  await install(r, 1, "− subtract", 1);
  await runLine(r, "9");
  if (!(await room(2)).done) return fail("2x − 1 did not fill its order");
  const e = await u(() => window.__universe.world.exit);
  await u(`window.walkTo(${e.x + 60})`);
}
