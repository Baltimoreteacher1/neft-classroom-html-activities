// Browser driver for NetFold Engineer: level 1 "Net Lab" through the real
// interface. Walking is real ticks; every fold is a real console click, and the
// fold itself plays out in the 3D display. The strip of six is folded first
// (it must overlap), then the right net on each bench.

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
  const foldNet = async (room, n) => {
    const bench = await u(`window.__universe.world.rooms[${room}].bench`);
    await u(`window.walkTo(${bench})`);
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel")
      return fail(`bench ${room + 1} did not open`);
    await host.getByRole("button", { name: `Show net ${n}` }).click();
    await host.getByRole("button", { name: `Fold net ${n}` }).click();
    await u(() => window.__universe.stepFrames(160, 0));
  };
  await foldNet(0, 1);
  const r0 = await u(() => window.__universe.world.rooms[0]);
  if (r0.done || r0.job.result.why !== "overlap")
    fail("the strip of six did not fold into an overlap");
  await axe("net bench");
  const right = [2, 1, 3];
  for (let room = 0; room < 3; room++) {
    await foldNet(room, right[room]);
    if (!(await u(`window.__universe.world.rooms[${room}].done`)))
      return fail(`net ${right[room]} did not close the crate on bench ${room + 1}`);
  }
  const e = await u(() => window.__universe.world.exit);
  await u(`window.walkTo(${e.x + 60})`);
}
