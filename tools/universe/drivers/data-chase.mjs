// Browser driver for The Data Chase: level 1 "The Tip" through the real
// interface. Movement is real ticks (run, and jump up to rooftop sources);
// every interview and every desk choice is a real Use or a real click. The
// one-person question goes first (one source, tagged), then the class
// question, all ten interviews, and the histogram.

const MOVE = `(tx, ty) => {
  const g = window.__universe;
  for (let i = 0; i < 2400 && g.mode === "play"; i++) {
    const p = g.world.p;
    const cx = p.x + p.w / 2;
    const feet = p.y + p.h;
    if (Math.abs(cx - tx) < 10 && p.ground && Math.abs(feet - ty) < 4) return true;
    let m = cx < tx - 8 ? 2 : cx > tx + 8 ? 1 : 0;
    if (ty < feet - 4 && Math.abs(cx - tx) < 110 && p.ground) m |= 16;
    if (!p.ground && ty < feet - 4) m |= 16;
    if (ty > feet + 4 && p.ground) m |= 8;
    g.stepFrames(1, m);
  }
  return false;
}`;

export async function drive({ host, u, fail, axe }) {
  await u(`window.moveTo = ${MOVE}`);
  const desk = async (i) => {
    const d = await u(`window.__universe.world.desks[${i}]`);
    await u(`window.moveTo(${d.x}, 520)`);
    await u(() => window.__universe.tryInteract());
    if ((await u(() => window.__universe.mode)) !== "panel")
      return fail(`desk ${i} did not open`) || false;
    return true;
  };
  const interviewAll = async () => {
    for (let n = 0; n < 30; n++) {
      const s = await u(() => {
        const g = window.__universe;
        const t = g.world.sources.find((x) => !x.got);
        return (
          t && {
            id: t.id,
            x: t.x + Math.round(Math.sin((g.world.tick + t.phase) / 90) * 28),
            y: t.y,
          }
        );
      });
      if (!s) return true;
      await u(`window.moveTo(${s.x}, ${s.y})`);
      const target = await u(() => window.__universe.interactable(window.__universe.world));
      if (target?.type !== "ask") continue; // the source walked on; catch up next pass
      await u(() => window.__universe.tryInteract());
    }
    return fail("could not interview every source");
  };

  if (!(await desk(0))) return;
  await host.getByRole("button", { name: "How long was Mr. Okafor's commute today?" }).click();
  const one = await u(() => window.__universe.world.sources.length);
  if (one !== 1) fail(`a one-person question opened ${one} sources`);
  const tag = await u(
    () => window.__universe.evidence.events.filter((e) => e.misconception).at(-1)?.misconception,
  );
  if (tag !== "stat-question-no-variability") fail(`the one-person question was tagged "${tag}"`);
  if (!(await desk(0))) return;
  await axe("assignment desk");
  await host
    .getByRole("button", { name: "How long are the commutes of the students in our class?" })
    .click();
  if ((await u(() => window.__universe.world.sources.length)) !== 10)
    return fail("the class question did not open ten sources");
  if (!(await interviewAll())) return;
  if ((await u(() => window.__universe.world.notebook.length)) !== 10)
    return fail("the notebook does not hold ten values");
  if (!(await desk(1))) return;
  await host.locator("#panel").getByRole("button", { name: "5", exact: true }).click();
  await host.locator("#panel").getByRole("button", { name: "20–25" }).click();
  if (!(await u(() => window.__universe.world.desks[1].done)))
    return fail("20–25 with bins of 5 was not accepted");
  await u(() => window.__universe.stepFrames(10, 0));
}
