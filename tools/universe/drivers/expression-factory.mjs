// Browser driver for Expression Factory: level 1 "Assembly Line" through the
// real interface. Each room's build panel shows every box at once (an operation
// and a number or x); the lever is the panel's own run button or prediction.
// Room 0 is built in the wrong order first (3(x + 2) for 3x + 2): every crate
// must be rejected and the slip tagged, then rebuilt and filled.

export async function drive({ host, u, fail, axe }) {
  const room = (i) => u(`window.__universe.world.rooms[${i}]`);
  const panel = host.locator("#panel");
  const openRoom = async (i) => {
    await u(`(() => {
      const g = window.__universe;
      if (g.mode === "panel") g.closePanel();
      g.moveTo(g.world.rooms[${i}].x0 + 100);
      g.openBuild();
    })()`);
    if ((await u(() => window.__universe.mode)) !== "panel")
      fail(`room ${i} build panel did not open`);
  };
  const setBox = async (slot, op, value) => {
    await panel
      .locator("select")
      .nth(slot * 2)
      .selectOption({ label: op });
    await panel
      .locator("select")
      .nth(slot * 2 + 1)
      .selectOption(String(value));
  };
  const run = async (name) => {
    await panel.getByRole("button", { name, exact: true }).click();
    await u(() => {
      const g = window.__universe;
      for (let i = 0; i < 1200 && g.world.rooms.some((x) => x.run); i++) g.stepFrames(1, 0);
    });
  };
  const build = async (i, boxes, predictWith) => {
    await openRoom(i);
    for (const [slot, [op, value]] of boxes.entries()) await setBox(slot, op, value);
    await run(predictWith || "Run the line");
  };

  let r = await room(0);
  await openRoom(0);
  await axe("factory");
  await build(
    0,
    [
      ["+ add", 2],
      ["× multiply", 3],
    ],
    "11",
  );
  r = await room(0);
  if (r.done) return fail("3(x + 2) filled an order for 3x + 2");
  if (!r.lastCrates.every((c) => c.state === "reject"))
    fail("not every crate was rejected for 3(x + 2)");
  const tag = await u(
    () => window.__universe.evidence.events.filter((e) => e.misconception).at(-1)?.misconception,
  );
  if (tag !== "order-of-operations-left-to-right") fail(`the reversed line was tagged "${tag}"`);
  await build(0, [
    ["× multiply", 3],
    ["+ add", 2],
  ]);
  if (!(await room(0)).done) return fail("3x + 2 did not fill the order");

  await build(
    1,
    [
      ["× multiply", 5],
      ["+ add", 4],
    ],
    "14",
  );
  if (!(await room(1)).done) return fail("5x + 4 did not fill its order");
  await build(
    2,
    [
      ["× multiply", 2],
      ["− subtract", 1],
    ],
    "9",
  );
  if (!(await room(2)).done) return fail("2x − 1 did not fill its order");
  await u(() => window.__universe.afterSolved(2));
  const e = await u(() => window.__universe.world.exit);
  await u(`window.__universe.moveTo(${e.x + 60})`);
  await u(() => window.__universe.stepFrames(10, 0));
}
