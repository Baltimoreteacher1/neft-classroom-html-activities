// Browser driver for Power Plant: level 1 "Cold Start" played through the real
// interface (real console clicks; travel is simulated tick by tick through the
// game's own stepFrames so the run is deterministic and fast). It makes a wrong
// setting first, rewinds with the Time Machine, teaches Ori at the bench, lets
// Ori try an unseen reactor, and opens the twin door.

/** Shared helpers every universe driver can use: walk the player with real ticks. */
export async function installWalker(u) {
  await u(() => {
    const g = window.__universe;
    const R = 2;
    const L = 1;
    const J = 16;
    const floorAt = (w, x, feet) =>
      w.solids.some((s) => !s.open && x >= s.x && x <= s.x + s.w && Math.abs(s.y - feet) < 2);
    window.walkTo = (tx) => {
      for (let i = 0; i < 4000 && g.mode === "play"; i++) {
        const w = g.world;
        const p = w.p;
        const cx = p.x + p.w / 2;
        if (Math.abs(cx - tx) < 6 && p.ground) return true;
        const dir = cx < tx ? 1 : -1;
        let m = dir > 0 ? R : L;
        if (p.ground && (!floorAt(w, cx + dir * 22, p.y + p.h) || (p.vx === 0 && i % 30 > 6)))
          m |= J;
        if (!p.ground) m |= J;
        g.stepFrames(1, m);
      }
      return g.mode !== "play";
    };
    window.waitTicks = (n) => g.stepFrames(n, 0);
  });
}

export async function drive({ page, host, u, fail, axe }) {
  await installWalker(u);
  const world = (fn) => u(fn);
  const use = () => u(() => window.__universe.tryInteract());
  const more = (n) => async () => {
    for (let i = 0; i < n; i++) await host.getByRole("button", { name: "One more" }).click();
  };

  // A wrong setting: 2 with 4 coils overshoots 8 and trips.
  await u(() => window.walkTo(800));
  await use();
  if ((await u(() => window.__universe.mode)) !== "panel")
    return fail("the reactor console did not open");
  await axe("reactor console");
  if (await host.locator("#panel").getByText(/= ?\d/).count())
    fail("the reactor console prints a result before it runs");
  await more(3)();
  await host.getByRole("button", { name: "Run the reactor" }).click();
  await u(() => window.waitTicks(520));
  if ((await world(() => window.__universe.world.devices[0].phase)) !== "idle")
    fail("an overshoot did not trip the lift back down");

  // Time Machine: rewind to before that decision.
  await host.locator("#btnTime").click();
  const marks = host.getByRole("button", { name: /Rewind to before/ });
  if ((await marks.count()) !== 1) fail("the Time Machine does not list the decision");
  if (!(await host.getByText("This is the step that changed the result.").count()))
    fail("the failing step is not identified");
  await marks.first().click();
  if ((await world(() => window.__universe.world.machines[0].exp)) !== 1)
    fail("rewind did not restore the reactor's exponent");
  if ((await world(() => window.__universe.timeline.leaves().length)) < 1)
    fail("the first path was not kept");

  // The right setting, riding the lift.
  await u(() => window.walkTo(800));
  await use();
  await more(2)();
  await host.getByRole("button", { name: "Run the reactor" }).click();
  await u(() => {
    window.walkTo(960);
    window.waitTicks(320);
  });
  if ((await world(() => window.__universe.world.devices[0].phase)) !== "dock")
    return fail("2^3 did not dock the lift");
  if ((await world(() => window.__universe.timeline.leaves().length)) !== 2)
    fail("the rewound path is not a second branch");

  // Ori's own try (3 x 3 = 9, so 3 coils) overshoots.
  await u(() => {
    window.walkTo(1430);
    window.waitTicks(760);
  });
  if ((await world(() => window.__universe.world.machines[1].exp)) !== 3)
    fail("Ori did not use its misconception");
  if ((await world(() => window.__universe.world.devices[1].phase)) === "dock")
    fail("Ori's wrong setting bridged the gap");

  // Telling Ori changes nothing; building a model and a counterexample does.
  await u(() => window.walkTo(1240));
  await use();
  await host.getByRole("button", { name: /Add a ×2 coil/ }).click();
  await host.getByRole("button", { name: /Add a ×2 coil/ }).click();
  await host.getByRole("button", { name: "Just tell Ori the answer" }).click();
  if ((await world(() => window.__universe.ori.status("exp-repeat"))) !== "holds")
    fail("telling Ori the answer changed its knowledge");
  await host.getByRole("button", { name: "Show Ori this chain" }).click();
  if ((await world(() => window.__universe.ori.status("exp-repeat"))) !== "challenged")
    fail("a model did not challenge the misconception");
  await host.getByRole("button", { name: "Run both for Ori" }).click();
  if ((await world(() => window.__universe.ori.status("exp-repeat"))) !== "ready")
    fail("model + counterexample did not make Ori ready");
  await host.locator("#panel").getByRole("button", { name: "Close" }).click();

  // Ori attempts a reactor it was not shown (2^3 was used at the bench, so not 8 base 2).
  await u(() => window.walkTo(1535));
  await use();
  await host.getByRole("button", { name: "Yes, Ori has it" }).click();
  const task = await world(() => window.__universe.world.machines[1]);
  if (`${task.base}^${task.exp}` === "2^3") fail("the transfer task repeats the teaching example");
  await u(() => window.waitTicks(520));
  if ((await world(() => window.__universe.world.devices[1].phase)) !== "dock")
    return fail("a taught Ori did not bridge the gap");
  if (!(await world(() => window.__universe.ori.has("exp-repeat"))))
    fail("passing the transfer did not unlock the ability");

  // Twin door: Wren's 4^2 and Ori's equivalent 2^4.
  await u(() => window.walkTo(2110));
  await use();
  await host.locator("#panel").getByRole("button", { name: "4", exact: true }).click();
  await more(1)();
  await host.getByRole("button", { name: "Run the reactor" }).click();
  await u(() => window.waitTicks(320));
  const twin = await world(() => window.__universe.world.machines[3]);
  if (twin.base !== 2 || twin.exp !== 4)
    fail(`Ori's twin used ${twin.base}^${twin.exp}, not the equivalent 2^4`);
  await u(() => {
    if (window.__universe.mode === "panel") window.__universe.closePanel();
    window.walkTo(2660);
  });
  await page.waitForTimeout(200);
}
