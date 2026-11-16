// Browser driver for Balance Breakout: level 1 "Counterweight" through the
// real interface. Movement is real ticks (run, and jump up to a ledge rack);
// every decision is a real console click. Room 0: x on the left, load 5 + 1 on
// the right, key 6. Room 1: x + 2 with 4 + 3, a wrong key first.

const MOVE = `(tx, ty) => {
  const g = window.__universe;
  for (let i = 0; i < 2400 && g.mode === "play"; i++) {
    const p = g.world.p;
    const cx = p.x + p.w / 2;
    const feet = p.y + p.h;
    if (Math.abs(cx - tx) < 8 && p.ground && Math.abs(feet - ty) < 4) return true;
    let m = cx < tx - 6 ? 2 : cx > tx + 6 ? 1 : 0;
    // Climb: jump while near the target if it is above the feet.
    if (ty < feet - 4 && Math.abs(cx - tx) < 70 && p.ground) m |= 16;
    if (!p.ground && ty < feet - 4) m |= 16;
    // Drop down: hold DOWN on a ledge when the target is lower.
    if (ty > feet + 4 && p.ground && Math.abs(cx - tx) < 160) m |= 8;
    g.stepFrames(1, m);
  }
  return false;
}`;

export async function drive({ host, u, fail, axe }) {
  await u(`window.moveTo = ${MOVE}`);
  const use = async () => {
    await u(() => window.__universe.tryInteract());
    return (await u(() => window.__universe.mode)) === "panel";
  };
  const take = async (rackX, rackY, v) => {
    // A rack higher than one jump is reached by its staircase: the lower ledge first.
    if (rackY < 420) await u(`window.moveTo(${rackX - 40}, 440)`);
    if (!(await u(`window.moveTo(${rackX}, ${rackY})`)))
      return fail(`could not reach the rack at ${rackX}, ${rackY}`);
    if (!(await use())) return fail("the rack console did not open");
    await host.getByRole("button", { name: `Pick up the ${v}`, exact: true }).click();
  };
  const putRight = async (bx) => {
    await u(`window.moveTo(${bx + 150}, 520)`);
    if (!(await use())) return fail("the right pan console did not open");
    await host
      .locator("#panel")
      .getByRole("button", { name: /^Put your \d+ here$/ })
      .click();
  };
  const key = async (doorX, value) => {
    await u(`window.moveTo(${doorX}, 520)`);
    if (!(await use())) return fail("the keypad did not open");
    let now = Number(await host.locator("#panel .stepper output").innerText());
    while (now < value) {
      await host.locator("#panel").getByRole("button", { name: "One more" }).click();
      now++;
    }
    while (now > value) {
      await host.locator("#panel").getByRole("button", { name: "One fewer" }).click();
      now--;
    }
    await host.getByRole("button", { name: "Enter", exact: true }).click();
  };
  const room = (i) => u(`window.__universe.world.rooms[${i}]`);

  // Room 0: x = 6. The 5 is on the floor rack, the 1 on the ledge rack.
  let r = await room(0);
  await take(r.racks[1].x, r.racks[1].y, 5);
  await putRight(r.bx);
  if ((await room(0)).right.length !== 1) return fail("the 5 did not land on the right pan");
  await axe("pan console");
  await take(r.racks[0].x, r.racks[0].y, 1);
  await putRight(r.bx);
  r = await room(0);
  if (Math.abs(r.angle) > 0.2 && r.right.length !== 2) fail("5 + 1 did not reach the right pan");
  await key(r.bx + 470 - 36, 6);
  if (!(await room(0)).solved) return fail("x = 6 did not open the first door");

  // Room 1: x + 2 = 7 with 4 + 3. Keying 7 (the right side) is the classic slip.
  r = await room(1);
  await take(r.racks[0].x, r.racks[0].y, 4);
  await putRight(r.bx);
  await take(r.racks[0].x, r.racks[0].y, 3);
  await putRight(r.bx);
  await key(r.bx + 470 - 36, 7);
  if ((await room(1)).solved) return fail("keying 7 for x + 2 = 7 opened the door");
  const tag = await u(
    () => window.__universe.evidence.events.filter((e) => e.misconception).at(-1)?.misconception,
  );
  if (tag !== "equation-answered-with-given-number")
    fail(`keying the given number was tagged "${tag}"`);
  await key(r.bx + 470 - 36, 5);
  if (!(await room(1)).solved) return fail("x = 5 did not open the second door");
  const e = await u(() => window.__universe.world.exit);
  await u(`window.moveTo(${e.x + 60}, 520)`);
}
