// Accessibility and fallback checks for the Journey browser e2e (scenarios h and i).
//   h  axe (wcag2a, wcag2aa, wcag22aa) on the pages and every engine screen, both bands, desktop 1440 and mobile 375;
//      no horizontal scroll at 375; keyboard-only listening placement and evidence selection; reduced motion;
//      touch (hasTouch) tap flows for listening and reading; console and network clean throughout
//   i  speech fallbacks: no mediaDevices, getUserMedia rejecting, no speechSynthesis
import * as E from "../../access-practice-lab/src/journey/engines/listen.js";
import * as D from "./access-journey-e2e-drive.mjs";
import { axeCheck, newSession, overflow } from "./access-journey-e2e-kit.mjs";
import { missionSteps, seedJourney } from "./access-journey-e2e-seed.mjs";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };
const T = { timeout: 15000 };

async function closeWith(S, ok, label) {
  ok(
    S.errors.length === 0,
    `${label}: no console or page errors${S.errors.length ? ` - ${S.errors[0]}` : ""}`,
  );
  ok(
    S.failed.length === 0,
    `${label}: no failed requests${S.failed.length ? ` - ${S.failed[0]}` : ""}`,
  );
  await S.context.close();
}

const listenDone = {
  correct: 5,
  total: 5,
  tries: 5,
  supportsUsed: [],
  finalIndependent: true,
};

/** [label, path, seed|null, ready selector, optional prepare(page)] for every page and engine screen of a band. */
function screens(band) {
  const m08 = (n, kind) =>
    seedJourney({ band, steps: missionSteps("m08", band, n, { commKind: kind }) });
  return [
    ["home", "/journey", null, "h1"],
    ["map", "/journey/map", null, "h1"],
    ["overview m08", "/journey/m08", null, "h1"],
    ["scene (discover)", "/journey/m08/discover", null, ".sc-hot"],
    ["listen", "/journey/m08/understand", null, '[data-act="item"]'],
    [
      "read (X-Ray)",
      "/journey/m08/understand",
      seedJourney({
        band,
        steps: [
          { m: "m08", s: "understand", partial: true, data: { listen: { result: listenDone } } },
        ],
      }),
      "[data-xr=pick]",
    ],
    [
      "build",
      "/journey/m08/build",
      null,
      "[data-cn-root]",
      async (p) => {
        if (await p.locator("[data-cn=start]").count()) await p.locator("[data-cn=start]").click();
        await p.waitForSelector('[data-cn-root][data-phase="try"]', T);
      },
    ],
    ["converse", "/journey/m08/communicate", null, "[data-jt-input]"],
    ["compose (show)", "/journey/m08/show", m08(5, "converse"), "[data-jt-draft]"],
    ["mirror (improve)", "/journey/m08/improve", m08(4, "converse"), "[data-mirror-focus=revise]"],
    ["complete panel", "/journey/m08/discover", m08(1, "converse"), "[data-jr-panel=complete]"],
    ["Passport journey evidence", "/passport", m08(5, "converse"), "#journeyEvidence"],
  ];
}

async function axeMatrix({ browser, origin, AxeBuilder, ok, only }) {
  if (only.length && !only.includes("h")) return;
  for (const band of ["3-5", "6-8"]) {
    for (const [name, path, seed, ready, prepare] of screens(band)) {
      const S = await newSession(browser, origin, { band, seed, viewport: DESKTOP });
      try {
        for (const [vpName, vp] of [
          ["1440", DESKTOP],
          ["375", MOBILE],
        ]) {
          await S.page.setViewportSize(vp);
          await S.go(path);
          await S.page.waitForSelector(ready, T);
          if (prepare) await prepare(S.page);
          await axeCheck(AxeBuilder, S.page, ok, `${band} ${name} @${vpName}`);
          if (vp === MOBILE)
            ok(
              (await overflow(S.page)) <= 0,
              `${band} ${name} @375: no horizontal overflow (${await overflow(S.page)}px)`,
            );
        }
      } catch (error) {
        ok(false, `axe ${band} ${name}: ${error.message.split("\n")[0]}`);
      }
      await closeWith(S, ok, `axe ${band} ${name}`);
    }
  }
}

/** Feedback states carry their own colours: the listening repair, the reading "why not" and the partner's reply. */
async function feedbackAxe({ browser, origin, AxeBuilder, ok, only }) {
  if (only.length && !only.includes("h")) return;
  const band = "6-8";
  const pack = await D.packOf("m08", band);
  const readSeed = seedJourney({
    band,
    steps: [{ m: "m08", s: "understand", partial: true, data: { listen: { result: listenDone } } }],
  });
  const c = pack.understand.read.challenge;
  for (const vp of [DESKTOP, MOBILE]) {
    const tag = `@${vp.width}`;
    let S = await newSession(browser, origin, { band, viewport: vp });
    try {
      await S.go("/journey/m08/understand");
      await S.page.waitForSelector('[data-act="item"]', T);
      await D.driveListenPart(S.page, E, pack.understand.listen, {
        miss: true,
        stopAtRepair: true,
      });
      await axeCheck(AxeBuilder, S.page, ok, `${band} listening repair (replay, Not yet) ${tag}`);
      ok(
        vp.width > 400 || (await overflow(S.page)) <= 0,
        `${band} listening repair @375: no horizontal overflow`,
      );
    } catch (error) {
      ok(false, `${band} listening repair axe ${tag}: ${error.message.split("\n")[0]}`);
    }
    await closeWith(S, ok, `listening repair ${tag}`);
    S = await newSession(browser, origin, { band, viewport: vp, seed: readSeed });
    try {
      await S.go("/journey/m08/understand");
      await S.page.waitForSelector("[data-xr=pick]", T);
      await S.page.locator(`[data-xr="pick"][data-sid="${c.claim}"]`).click();
      await S.page.waitForSelector('[data-xr="check"]', T);
      await S.page.locator(`[data-xr="pick"][data-sid="${c.weak[0]}"]`).click();
      await S.page.locator(`[data-xr="pick"][data-sid="${c.valid[0]}"]`).click();
      await S.page.locator('[data-xr="check"]').click();
      await S.page.waitForSelector(".xr-why", T);
      await axeCheck(AxeBuilder, S.page, ok, `${band} reading "why not" feedback ${tag}`);
      ok(
        vp.width > 400 || (await overflow(S.page)) <= 0,
        `${band} reading feedback @375: no horizontal overflow`,
      );
    } catch (error) {
      ok(false, `${band} reading feedback axe ${tag}: ${error.message.split("\n")[0]}`);
    }
    await closeWith(S, ok, `reading feedback ${tag}`);
    S = await newSession(browser, origin, { band, viewport: vp });
    try {
      await S.go("/journey/m08/communicate");
      await S.page.waitForSelector("[data-jt-input]", T);
      await D.driveConverse(S.page, pack.communicate, { limit: 1 });
      await axeCheck(
        AxeBuilder,
        S.page,
        ok,
        `${band} conversation after the partner's reply ${tag}`,
      );
    } catch (error) {
      ok(false, `${band} conversation axe ${tag}: ${error.message.split("\n")[0]}`);
    }
    await closeWith(S, ok, `conversation ${tag}`);
  }
}

/** Keyboard only: no mouse events at all while placing cards and choosing evidence. */
async function keyboard({ browser, origin, ok, only }) {
  if (only.length && !only.includes("h")) return;
  const band = "6-8";
  const pack = await D.packOf("m08", band);
  let S = await newSession(browser, origin, { band });
  try {
    await S.go("/journey/m08/understand");
    await S.page.waitForSelector('[data-act="item"]', T);
    const n = await D.driveListenKeyboard(S.page, E, pack.understand.listen);
    await S.page.waitForSelector('[data-act="start-final"], [data-fix]', T);
    ok(
      (await S.page.locator('[data-act="start-final"]').count()) === 1,
      `keyboard: all ${n} listening cards placed and checked with Tab, Enter and Space only`,
    );
    const outline = await S.page.evaluate(() => {
      const el = document.querySelector('[data-act="start-final"]');
      el.focus();
      const cs = getComputedStyle(el);
      return { w: Number.parseFloat(cs.outlineWidth), style: cs.outlineStyle };
    });
    ok(
      outline.style !== "none" && outline.w >= 2,
      `keyboard: a focused control shows a visible focus ring (${outline.w}px ${outline.style})`,
    );
  } catch (error) {
    ok(false, `keyboard listening: ${error.message.split("\n")[0]}`);
  }
  await closeWith(S, ok, "keyboard listening");
  S = await newSession(browser, origin, {
    band,
    seed: seedJourney({
      band,
      steps: [
        { m: "m08", s: "understand", partial: true, data: { listen: { result: listenDone } } },
      ],
    }),
  });
  try {
    await S.go("/journey/m08/understand");
    await S.page.waitForSelector("[data-xr=pick]", T);
    await D.driveReadKeyboard(S.page, pack.understand.read);
    ok(
      (await S.page.locator("#xr-explain").count()) === 1,
      "keyboard: claim, evidence, check and connect done with the keyboard only",
    );
  } catch (error) {
    ok(false, `keyboard evidence: ${error.message.split("\n")[0]}`);
  }
  await closeWith(S, ok, "keyboard evidence");
}

async function reducedMotion({ browser, origin, ok, only }) {
  if (only.length && !only.includes("h")) return;
  const S = await newSession(browser, origin, { band: "6-8", reducedMotion: "reduce" });
  try {
    for (const path of ["/journey", "/journey/m08/discover", "/journey/map"]) {
      await S.go(path);
      await S.page.waitForTimeout(900);
      const running = await S.page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === "running")
          .map((a) => a.animationName || a.transitionProperty || "anim"),
      );
      ok(
        running.length === 0,
        `reduced motion: ${path} runs no animations (${running.slice(0, 3)})`,
      );
    }
    const matches = await S.page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    ok(matches, "reduced motion: the emulation is on");
  } catch (error) {
    ok(false, `reduced motion: ${error.message.split("\n")[0]}`);
  }
  await closeWith(S, ok, "reduced motion");
}

/** Touch emulation: tap each card and target, tap the claim and evidence. */
async function touch({ browser, origin, ok, only }) {
  if (only.length && !only.includes("h")) return;
  const band = "6-8";
  const pack = await D.packOf("m08", band);
  const S = await newSession(browser, origin, {
    band,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  S.page.__tap = true;
  try {
    await S.go("/journey/m08/understand");
    await S.page.waitForSelector('[data-act="item"]', T);
    const rep = await D.driveListen(S.page, E, pack.understand.listen, { miss: true });
    ok(
      rep.repair?.fixes > 0,
      "touch: a wrong tap placement shows the repair, and tapping fixes it",
    );
    await S.page.waitForSelector("[data-xr=pick]", T);
    const read = await D.driveRead(S.page, pack.understand.read);
    ok(read.main.wrongClaim, "touch: tapping a wrong claim then the right one works");
    await S.page.waitForSelector("[data-jr-continue], [data-jr-panel=complete]", T);
    ok(
      (await S.page.locator("[data-jr-continue]").count()) === 1,
      "touch: listening and reading finished with taps only",
    );
    ok((await overflow(S.page)) <= 0, "touch: no horizontal overflow on the phone");
  } catch (error) {
    ok(false, `touch: ${error.message.split("\n")[0]}`);
  }
  await closeWith(S, ok, "touch");
}

async function speech({ browser, origin, ok, only }) {
  if (only.length && !only.includes("i")) return;
  const band = "6-8";
  const pack = await D.packOf("m08", band);
  const cases = [
    [
      "no mediaDevices",
      "Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });",
    ],
    [
      "getUserMedia rejects (NotAllowedError)",
      "Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) }, configurable: true });",
    ],
  ];
  for (const [name, script] of cases) {
    const label = `speech fallback (${name})`;
    const S = await newSession(browser, origin, { band });
    await S.context.addInitScript(script);
    try {
      await S.go("/journey/m08/communicate");
      await S.page.waitForSelector("[data-jt-input]", T);
      if (name.startsWith("no")) {
        ok(
          (await S.page.locator("[data-jt-rec-start]").count()) === 0 &&
            /cannot record/i.test(await S.page.locator(".jt-no-rec").innerText()),
          `${label}: says plainly that this browser cannot record, offers no record button`,
        );
      } else {
        await S.page.locator("[data-jt-rec-start]").click();
        await S.page.waitForFunction(
          () =>
            /microphone/i.test(
              document.querySelector(".jt-no-rec, [data-jt-rec-error]")?.textContent || "",
            ),
          null,
          T,
        );
        ok(true, `${label}: shows an honest microphone message after the permission is refused`);
      }
      await D.driveConverse(S.page, pack.communicate);
      await D.finishStep(S.page);
      const rec = (
        await S.page.evaluate(() =>
          JSON.parse(localStorage.getItem("accessPracticeLab:v1:journey")),
        )
      ).bands[band].missions.m08.steps.communicate;
      ok(rec.status === "done", `${label}: the typed conversation still completes the step`);
    } catch (error) {
      ok(false, `${label}: ${error.message.split("\n")[0]}`);
    }
    await closeWith(S, ok, label);
  }
  const label = "speech fallback (no speechSynthesis)";
  const S = await newSession(browser, origin, { band });
  await S.context.addInitScript(
    "delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;",
  );
  try {
    await S.go("/journey/m08/understand");
    await S.page.waitForSelector(".jl-player", T);
    ok(
      (await S.page.locator(".jl-player.is-unavailable").count()) === 1 &&
        (await S.page.locator('[data-act="play-all"]').count()) === 0,
      `${label}: the player says audio cannot play and shows no dead Play button`,
    );
    await S.page.locator('[data-act="read-instead"]').click();
    await S.page
      .waitForSelector(".jl-caption, .jl-script-text, [data-jl-script]", T)
      .catch(() => {});
    const text = await S.page.locator("#app").innerText();
    const first = pack.understand.listen.script[0].text;
    ok(text.includes(first.slice(0, 30)), `${label}: "Read it instead" shows the sentences`);
    const rep = await D.driveListen(S.page, E, pack.understand.listen, { miss: false });
    void rep;
    await S.page.waitForSelector("[data-xr=pick]", T);
    ok(true, `${label}: placement and the final check complete without audio`);
  } catch (error) {
    ok(false, `${label}: ${error.message.split("\n")[0]}`);
  }
  await closeWith(S, ok, label);
}

export async function a11yAndFallbacks(ctx) {
  await axeMatrix(ctx);
  await feedbackAxe(ctx);
  await keyboard(ctx);
  await reducedMotion(ctx);
  await touch(ctx);
  await speech(ctx);
}
