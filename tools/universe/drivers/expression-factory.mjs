// Browser driver for Expression Factory: level 1 "Word Crates" through the
// real interface. Each crate's panel shows its prompt and one big card per
// answer; a right card moves to the next step, the last step packs the crate.
// Crate 1 is answered wrong first: nothing may be packed, the miss must show a
// hint, and "w fewer than 7" picked as w − 7 must be tagged as reversed.

export async function drive({ host, u, fail, axe }) {
  const room = (i) => u(`window.__universe.world.rooms[${i}]`);
  const panel = host.locator("#panel");
  const open = async (i) => {
    await u(`(() => {
      const g = window.__universe;
      if (g.mode === "panel") return;
      g.moveTo(g.world.rooms[${i}].x0 + 100);
      g.openBuild();
    })()`);
    if ((await u(() => window.__universe.mode)) !== "panel")
      fail(`room ${i} crate panel did not open`);
  };
  const click = async (i, name) => {
    await open(i);
    await panel.getByRole("button", { name, exact: true }).click();
  };
  const right = async (i) => {
    const r = await room(i);
    return r.items[r.at].steps[r.step].answer;
  };
  const lastOutcome = () =>
    u(() => window.__universe.evidence.events.filter((e) => e.mechanic !== "level").at(-1));

  await open(0);
  await axe("word crates");
  await click(0, "3y");
  let r = await room(0);
  if (r.at !== 0) return fail("a wrong card packed the crate");
  if (!(await panel.innerText()).includes("💡")) fail("no hint after a miss");
  await click(0, "y + 3");
  if ((await room(0)).at !== 1) return fail("the right card did not pack crate 1");
  for (let k = 0; k < 3; k++) await click(0, await right(0));
  await click(0, "w − 7");
  const tag = (await lastOutcome())?.misconception;
  if (tag !== "op-reversed-subtraction") fail(`w − 7 for "w fewer than 7" was tagged "${tag}"`);

  for (let i = 0; i < 5; i++) {
    for (let guard = 0; guard < 60 && !(await room(i)).done; guard++)
      await click(i, await right(i));
    r = await room(i);
    if (!r.done) return fail(`room ${i} did not finish`);
    if (i === 4 && r.at !== r.items.length) fail("not every crate was packed");
  }
  if (!(await u(() => window.__universe.world.rooms.every((x) => x.done))))
    return fail("a room is still open");
  await u(() => window.__universe.afterSolved(4));
  const e = await u(() => window.__universe.world.exit);
  await u(`window.__universe.moveTo(${e.x + 60})`);
  await u(() => window.__universe.stepFrames(10, 0));
}
