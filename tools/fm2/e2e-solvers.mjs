// Real-interface solvers for the Family Math 2.0 end-to-end suites: one translator per game that turns the round's own solution
// (read once from the `window.__fm2` seam) into real clicks, taps and typing, never into `submit`. Borrowed from the per-game
// acceptance suites (tools/fm2/accept-*.mjs). Verified against every skill of every game at grades 0, 3, 6 and 8, levels 1 and 3.
// @fm2 FM-080 FM-083 FM-085
import {
  fmtValue,
  replay,
  seatValue,
} from "../../math/fluency-lab/family/fm2/games/family-math-duel/engine.js";

const roundOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
const solutionOf = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.solve())));
const act = (locator, how = "click") => (how === "tap" ? locator.tap() : locator.click());
// ---- real-interface solvers, one per game ------------------------------------------------------------------------------
const clickAll = async (page, selector, n, how) => {
  for (let i = 0; i < n; i += 1) await act(page.locator(selector).first(), how);
};
const UI = {};
UI["math-market"] = async (page, how) => {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const press = (selector) => act(page.locator(selector), how);
  for (const piece of sol.tray || []) await press(`[data-mm-add="${piece}"]`);
  for (const index of sol.cart || []) await press(`[data-mm-tag="${index}"]`);
  if (sol.pick !== undefined) await press(`[data-mm-tag="${sol.pick}"]`);
  if (round.scene?.type === "coins" && round.kind === "enter")
    for (let i = 0; i < Math.min(3, round.scene.coins.length); i += 1)
      await press(`[data-mm-mark="${i}"]`);
  for (const [key, value] of Object.entries(sol.values || {}))
    await page.fill(`[data-mm-field="${key}"]`, value);
  await press("[data-mm-submit]");
};
// A wrong register entry that the shell must refuse; returns false when this round kind has no easy wrong entry.
export async function marketWrong(page, how = "click") {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  if (round.kind === "tray") {
    await act(page.locator(`[data-mm-add="${round.pool[0]}"]`), how);
    // One extra coin when the solution is that single coin, so the entry is certainly wrong.
    if (sol.tray.length === 1 && sol.tray[0] === round.pool[0])
      await act(page.locator(`[data-mm-add="${round.pool[0]}"]`), how);
  } else if (round.kind === "pick") await act(page.locator(`[data-mm-tag="${1 - sol.pick}"]`), how);
  else if (round.kind === "cart") {
    /* an empty cart is wrong */
  } else {
    if (round.kind === "pickEnter") await act(page.locator(`[data-mm-tag="${1 - sol.pick}"]`), how);
    for (const [key, value] of Object.entries(sol.values))
      await page.fill(`[data-mm-field="${key}"]`, `${value}7`);
  }
  await act(page.locator("[data-mm-submit]"), how);
}
export async function marketClear(page, how = "click") {
  const round = await roundOf(page);
  if (round.kind === "tray") await act(page.locator("[data-mm-clear]"), how);
  if (round.kind === "enter")
    for (const f of round.fields) await page.fill(`[data-mm-field="${f.key}"]`, "");
  if (round.kind === "pickEnter")
    for (const f of round.fields || []) await page.fill(`[data-mm-field="${f.key}"]`, "");
}

UI["math-match"] = async (page, how) => {
  const { groups } = await solutionOf(page);
  for (const group of groups)
    for (const id of group) await act(page.locator(`.mm-card[data-id="${id}"]`), how);
};

UI["number-builder"] = async (page, how) => {
  const round = await roundOf(page);
  const { builds } = await solutionOf(page);
  const press = async (selector, n = 1) => clickAll(page, selector, n, how);
  for (const [k, build] of builds.entries()) {
    if (k > 0) await press('[data-act="clear"]');
    if (round.mode === "pieces") {
      for (const p of round.pieces) {
        const have = Number(
          await page.locator(`[data-piece="${p.id}"] [data-count]`).textContent(),
        );
        const want = build.counts[p.id];
        if (want > have) await press(`[data-add="${p.id}"]`, want - have);
        else if (want < have) await press(`[data-sub="${p.id}"]`, have - want);
      }
    } else if (round.mode === "chart") {
      const used = new Set();
      for (const digit of build.slots) {
        const i = round.tiles.findIndex((d, j) => d === digit && !used.has(j));
        used.add(i);
        await act(page.locator(`[data-tile="${i}"]`), how);
      }
    } else {
      for (let i = 0; i < 5; i += 1) await press(`[data-up="${i}"]`, build.digits[i]);
      if (build.exp > 0) await press('[data-exp="up"]', build.exp);
      if (build.exp < 0) await press('[data-exp="down"]', -build.exp);
    }
    await act(page.locator('[data-act="check"]'), how);
  }
};

UI["fraction-kitchen"] = async (page, how) => {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const press = (selector) => act(page.locator(selector).first(), how);
  const valueNow = async (fk) =>
    Number(await page.locator(`[data-fk="${fk}"]`).first().getAttribute("aria-valuenow"));
  const stepTo = async (fk, target, whole = 0) => {
    for (let guard = 0; guard < 90; guard += 1) {
      const diff = target - (await valueNow(fk));
      if (diff === 0) return;
      const big = whole && Math.abs(diff) >= whole;
      await press(
        `[data-fk="${fk}-${big ? (diff > 0 ? "bigup" : "bigdown") : diff > 0 ? "up" : "down"}"]`,
      );
    }
    throw new Error(`could not step ${fk} to ${target}`);
  };
  switch (round.kind) {
    case "fair":
    case "fix":
    case "serve":
    case "equiv":
    case "compare":
    case "area":
      await stepTo("parts", sol.cuts.length + 1);
      if (round.kind === "fix") await press('[data-act="even"]');
      for (let i = 0; i < sol.served.length; i += 1)
        if (sol.served[i]) await press(`[data-act="toggle"][data-piece="${i}"]`);
      break;
    case "cup":
    case "line":
      if (round.irr) await stepTo("ticks", sol.ticks);
      else await press(`[data-act="ticks"][data-v="${sol.ticks}"]`);
      await stepTo("hop", sol.steps, sol.ticks);
      if (round.irr) await press('[data-act="verdict"][data-v="close"]');
      break;
    case "fill":
      for (const s of sol.scoops) await press(`[data-act="add"][data-v="${s.n}/${s.d}"]`);
      break;
    case "serving":
      for (let i = 0; i < sol.servings; i += 1) await press('[data-act="pour"]');
      break;
    default:
      if (sol.never) {
        await press('[data-act="never"]');
        await press(`[data-act="block"][data-v="${sol.block}"]`);
      } else for (const place of round.places) await stepTo(`digit-${place}`, sol.digits[place]);
  }
  await press('[data-act="submit"]');
};

UI["array-architect"] = async (page, how) => {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const press = (selector) => act(page.locator(selector), how);
  const type = async (selector, value) => {
    await page.locator(selector).fill(String(value));
    await page.locator(selector).press("Tab");
  };
  const size = (cells) => [
    Math.max(...cells.map((c) => c[0])) + 1,
    Math.max(...cells.map((c) => c[1])) + 1,
  ];
  const tappable = round.grid && round.grid.rows <= 12 && round.grid.cols <= 12;
  const setSize = async (rows, cols) => {
    if (tappable && rows > 0 && cols > 0) await press(`#aa-c-${rows - 1}-${cols - 1}`);
    else {
      await type('.aa-step-input[data-id="rows"]', rows);
      await type('.aa-step-input[data-id="cols"]', cols);
    }
  };
  if (round.kind === "rect") {
    await setSize(...size(sol.cells));
    if (sol.value != null) await type("[data-ask]", sol.value);
  } else if (round.kind === "paint") {
    let tool = 1;
    for (const [r, c, v = 1] of sol.cells) {
      if (v !== tool) {
        await press(`[data-act="tool"][data-v="${v}"]`);
        tool = v;
      }
      await press(`#aa-c-${r}-${c}`);
    }
    if (sol.parity) await press(`[data-act="parity"][data-v="${sol.parity}"]`);
    if (sol.value != null) await type("[data-ask]", sol.value);
  } else if (round.kind === "collect") {
    for (const [rows, cols] of sol.list) {
      await type('.aa-step-input[data-id="rows"]', rows);
      await type('.aa-step-input[data-id="cols"]', cols);
      await press('[data-act="add"]');
    }
  } else if (round.kind === "model") {
    for (const [key, value] of Object.entries(sol.cuts))
      await type(`.aa-step-input[data-id="cut-${key}"]`, value);
    for (const [id, value] of Object.entries(sol.partials))
      await type(`[data-part="${id}"]`, value);
    await type("[data-total]", sol.total);
  } else if (round.kind === "prism") {
    await setSize(...size(sol.cells));
    await type('.aa-step-input[data-id="layers"]', sol.layers);
    if (sol.value != null) await type("[data-ask]", sol.value);
  } else if (round.kind === "scale") {
    await setSize(...size(sol.cells));
    await press(`[data-act="pick"][data-v="${sol.pick}"]`);
  } else if (round.kind === "tiling") {
    await type('.aa-step-input[data-id="s"]', sol.s);
  } else {
    for (const [id, value] of [
      ["w1", sol.w[1]],
      ["w0", sol.w[0]],
      ["h1", sol.h[1]],
      ["h0", sol.h[0]],
    ])
      await type(`.aa-step-input[data-id="${id}"]`, value);
  }
  await press('[data-act="check"]');
};

UI["number-line-quest"] = async (page, how) => {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const num = (f) => f.n / f.d;
  const line = round.line;
  const kOf = (x, min, step) => Math.round((num(x) - num(min)) / num(step));
  const nudge = async (k, from) => {
    const delta = k - from;
    const [big, small] = [Math.trunc(delta / 10), delta % 10];
    await clickAll(page, `[data-nudge="${big > 0 ? 10 : -10}"]`, Math.abs(big), how);
    await clickAll(page, `[data-nudge="${small > 0 ? 1 : -1}"]`, Math.abs(small), how);
  };
  const startK = (f) => kOf(f, line.min, line.step);
  if (round.kind === "place") await nudge(kOf(sol.x, line.min, line.step), startK(round.start));
  else if (round.kind === "round") {
    await nudge(kOf(sol.x, line.min, line.step), startK(round.start));
    await act(
      page.locator(`[data-pick="${num(sol.pick) === num(round.lo) ? "lo" : "hi"}"]`).first(),
      how,
    );
  } else if (round.kind === "order") {
    for (let i = 0; i < round.items.length; i += 1) {
      await act(page.locator(`[data-chip="${i}"]`).first(), how);
      await nudge(kOf(sol.xs[i], line.min, line.step), startK(round.starts[i]));
    }
  } else if (round.kind === "hop") {
    for (const hop of sol.hops)
      await act(page.locator(`[data-hop="${hop.n}/${hop.d}"]`).first(), how);
  } else {
    let low = num(round.zoom.outerMin);
    for (let i = 0; i < round.zoom.z; i += 1) {
      await nudge(Math.round((num(sol.path[i]) - low) / 10 ** -(i + 1)), 0);
      await act(page.locator("[data-zoomin]").first(), how);
      low = num(sol.path[i]);
    }
    await nudge(Math.round((num(sol.x) - low) / 10 ** -(round.zoom.z + 1)), 0);
  }
  await act(page.locator("[data-check]").first(), how);
};

UI["pattern-detective"] = async (page, how) => {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const press = (name, extra = "") =>
    act(page.locator(`[data-act="${name}"]${extra}`).first(), how);
  const setField = async (path, value) => {
    if (/(^|\.)op[12]?$/.test(path))
      await act(page.locator(`[data-act="set"][data-path="${path}"][data-value="${value}"]`), how);
    else await page.locator(`[data-path="${path}"]`).first().fill(value);
  };
  for (const p of sol.probe) {
    if (round.form === "cycle") await press("cell", `[data-x="${p.x}"]`);
    else {
      if (round.machines.length > 1) await press("machine", `[data-m="${p.m}"]`);
      await page.fill('[data-key="x"]', String(p.x));
      await press("probe");
    }
  }
  const fields = sol.fields;
  if (round.form === "cycle")
    for (const id of fields.core) await press("core-add", `[data-id="${id}"]`);
  else if (round.form === "seq") {
    for (const [k, v] of Object.entries(fields))
      if (k !== "op" || round.say.op === "both") await setField(k, v);
  } else if (round.form === "two") {
    for (const side of ["A", "B"])
      for (const [k, v] of Object.entries(fields[side]))
        if (k !== "op" || round.say.op === "both") await setField(`${side}.${k}`, v);
  } else if (round.form === "typed") await page.fill('[data-key="typed"]', fields.text);
  else if (round.form === "line") {
    await setField("m", fields.m);
    if (!round.say.lockB) await setField("b", fields.b);
  } else {
    await setField("op1", fields.op1);
    await setField("a", fields.a);
    if (fields.op2 !== "none") {
      await setField("op2", fields.op2);
      await setField("b", fields.b);
    }
  }
  if (round.cls) await press("cls", `[data-id="${sol.cls}"]`);
  if (round.form === "cycle") await press("far-sym", `[data-id="${sol.far}"]`);
  else await page.fill('[data-key="far"]', sol.far);
  await press("check");
};

UI["math-puzzle-studio"] = async (page, how) => {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  const press = (selector) => act(page.locator(selector), how);
  if (round.kind === "scale") {
    for (const m of sol.moves) {
      await press(`[data-pz-pans="${m.side}"]`);
      let now = Number(await page.inputValue("[data-pz-amt]"));
      while (now < m.n) {
        await press("[data-pz-more]");
        now += 1;
      }
      while (now > m.n) {
        await press("[data-pz-less]");
        now -= 1;
      }
      await press(m.op === "split" ? "[data-pz-split]" : `[data-pz-take="${m.what}"]`);
    }
  } else {
    for (let i = 0; i < round.cells.length; i += 1) {
      if (!sol.put[i]) continue;
      await press(`[data-pz-tile="${sol.put[i]}"]`);
      await press(`[data-pz-slot="${i}"]`);
    }
  }
  await press("[data-pz-check]");
};

UI["ratio-recipe-lab"] = async (page, how) => {
  const round = await roundOf(page);
  const sol = await solutionOf(page);
  for (let i = 0; i < round.cols.length; i += 1) {
    if (round.cols.length > 1) await act(page.locator(`[data-rl-col="${i}"]`), how);
    await page.locator("[data-rl-batch]").fill(sol.cols[i].batch);
    for (const [key, value] of Object.entries(sol.cols[i].values))
      await page.locator(`[data-rl-field="${i}:${key}"]`).fill(value);
  }
  for (const [key, value] of Object.entries(sol.extra))
    await page.locator(`[data-rl-extra="${key}"]`).fill(value);
  if (sol.pick !== null && sol.pick !== undefined)
    await act(page.locator(`[data-rl-pick="${sol.pick}"]`), how);
  await act(page.locator("[data-rl-submit]"), how);
};

// Family Math Duel. Solo against Orbit, or together on one device through the hand-over screens. With `challenge`, the
// caregiver's value is typed wrongly on purpose so the learner challenges it and types the true value (levels 2 and 3).
const CLAIM0 = { input: "#fd-in-claim0", submit: '[data-form="claim0"] button[type=submit]' };
const CLAIM1 = { input: "#fd-in-claim1", submit: '[data-form="claim1"] button[type=submit]' };
const COUNTER = { input: "#fd-in-counter", submit: '[data-form="counter"] button[type=submit]' };
export async function duel(page, how, { challenge = false, onHandover = null } = {}) {
  const round = await roundOf(page);
  const rec = await solutionOf(page);
  const together = await page.locator("[data-fm2-turn]").isVisible();
  const seats = together ? [0, 1] : [0];
  const claim = async (sel, value) => {
    await page.fill(sel.input, value);
    await act(page.locator(sel.submit), how);
  };
  const place = async ([seat, card, slot]) => {
    await act(page.locator(`.fd-card[data-card="${card}"]`), how);
    const armed = await page.evaluate(
      (id) =>
        document.querySelector(`.fd-card[data-card="${id}"]`)?.getAttribute("aria-pressed") ===
        "true",
      card,
    );
    if (armed) await act(page.locator(`.fd-slot[data-seat="${seat}"][data-slot="${slot}"]`), how);
  };
  if (round.variant === "open")
    for (const m of rec.moves)
      if (seats.includes(m[0])) await place(m);
      else {
        /* private hands are drafted seat by seat below */
      }
  if (round.variant !== "open") {
    for (const seat of [round.first, 1 - round.first].filter((s) => seats.includes(s))) {
      if (together) {
        await onHandover?.(seat);
        await act(page.locator("[data-act=handover-ok]"), how);
      }
      for (const m of rec.moves.filter((x) => x[0] === seat)) await place(m);
      await act(page.locator("[data-act=lock]"), how);
    }
  }
  await claim(CLAIM0, rec.claims[0]);
  if (together && round.rights.theirs) await act(page.locator("[data-act=theirs-no]"), how);
  let challenged = false;
  if (round.rights.challenge) {
    const state = replay(round, rec.moves, Boolean(rec.fair));
    const truth1 = fmtValue(seatValue(round, state.seats[1]), round.style);
    if (together) await claim(CLAIM1, challenge ? "1000003" : rec.claims[1]);
    if (together ? challenge : rec.call.challenge) {
      challenged = true;
      await act(page.locator("[data-act=challenge]"), how);
      await claim(COUNTER, together ? truth1 : rec.call.counter);
    } else await act(page.locator("[data-act=agree]"), how);
  }
  await act(page.locator(`[data-verdict="${rec.verdict}"]`), how);
  return { round, rec, challenged };
}
UI["family-math-duel"] = (page, how) => duel(page, how);

export const hasSolver = (gameId) => Boolean(UI[gameId]);
export const UI_GAMES = Object.keys(UI);
// Solves the live round through the interface; returns false (and does nothing) when the game has no translator.
export async function solveUi(page, how = "click") {
  const gameId = await page.evaluate(() => window.__fm2.game.id);
  if (!UI[gameId]) return false;
  await UI[gameId](page, how);
  return true;
}
