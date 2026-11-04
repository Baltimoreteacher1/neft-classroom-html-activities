// Engine drivers for the Journey browser e2e. Each driver is content-driven: it reads the mission pack
// (same data the app renders) and acts the way a student would, through visible controls only.
import { JOURNEY_KEY, LAB } from "./access-journey-e2e-kit.mjs";

export const packOf = async (id, band) =>
  (await import(`../../access-practice-lab/src/content/journey/${id}.js`)).default.bands[band];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T = { timeout: 15000 };
/** Click, or tap when the page was opened with touch emulation (`page.__tap = true`). */
const hit = (page, locator) => (page.__tap ? locator.tap() : locator.click());

/** Type text into a textarea the way a student does (focus, key events), then blur-safe. */
export async function typeInto(page, selector, text) {
  const f = page.locator(selector).first();
  await f.click();
  await f.fill("");
  await f.pressSequentially(text, { delay: 0 });
}

export async function stepState(page, band, mission, step) {
  return page.evaluate(
    ([k, b, m, s]) => {
      const j = JSON.parse(localStorage.getItem(k) || "null");
      return j?.bands?.[b]?.missions?.[m]?.steps?.[s] || null;
    },
    [JOURNEY_KEY, band, mission, step],
  );
}

/** discover: examine hotspots, change controls, explain with pack variable terms, answer the partner. */
export async function driveDiscover(page, task, { stopAfter = null } = {}) {
  const v = task.variables[0];
  for (const o of task.objects.slice(0, task.collect)) {
    await page.locator(`.sc-hot[data-sc-examine="${o.id}"]`).first().click();
    await page.waitForSelector(`[data-sc-examine="${o.id}"].is-seen`, { ...T, state: "attached" });
  }
  const ctl = task.controls[0];
  const other = ctl.options.find((o) => o.id !== ctl.initial);
  await page
    .locator("label", { has: page.locator(`[data-sc-control="${ctl.id}"][value="${other.id}"]`) })
    .click();
  if (stopAfter === "controls") return;
  const text = `I think the ${v.label} caused the change because ${v.terms[0]} matters here. The evidence shows ${v.evidenceTerms.slice(0, 2).join(" and ")}, so this explains what changed in the data.`;
  await typeInto(page, "[data-sc-draft]", text);
  if (stopAfter === "draft") return text;
  await page.locator("[data-sc-send]").click();
  await page.waitForSelector("[data-sc-reply], [data-jr-panel=complete]", T);
  return text;
}

const placeCard = async (page, item, target, picked = false) => {
  // "Try another place" leaves the card selected; tapping it again would clear the selection.
  if (!picked) await hit(page, page.locator(`[data-act="item"][data-item="${item}"]`).first());
  await hit(page, page.locator(`[data-act="target"][data-target="${target}"]`).first());
};

/**
 * listen: place every card following the pack's `expect`. With `miss`, swap two cards first, check, and report
 * what the repair showed (signal sentence / picture clue / replay button) before fixing it. `keyboard` uses only keys.
 */
export async function driveListenPart(
  page,
  E,
  task,
  { final = false, miss = false, keyboard = false, stopAtRepair = false, onRepair = null } = {},
) {
  const t = E.resolveTask(task, { final });
  const report = { repair: null };
  const place = keyboard
    ? async (item, target, picked = false) => {
        if (!picked) {
          await page.locator(`[data-act="item"][data-item="${item}"]`).first().focus();
          await page.keyboard.press("Enter");
        }
        const tb = page.locator(`[data-act="target"][data-target="${target}"]`).first();
        await tb.focus();
        await page.keyboard.press(Math.random() < 0.5 ? "Enter" : "Space");
      }
    : (item, target, picked) => placeCard(page, item, target, picked);
  // Reorder so the two cards that trade places (they must belong in different places; sort bins repeat) come first.
  const rows = [...t.expect];
  const j = rows.findIndex((r, k) => k > 0 && r.target !== rows[0].target);
  if (j > 1) rows.splice(1, 0, ...rows.splice(j, 1));
  const ex = rows;
  const swap = miss && j > 0;
  for (let i = 0; i < ex.length; i++) {
    const target = swap && i < 2 ? ex[1 - i].target : ex[i].target;
    await place(ex[i].item, target);
  }
  await page.locator('[data-act="check"]').click();
  if (swap) {
    await page.waitForSelector("[data-fix]", T);
    report.repair = await page.evaluate(() => ({
      fixes: document.querySelectorAll("[data-fix]").length,
      level: document.querySelector("[data-fix]")?.dataset.level,
      replay: !!document.querySelector(
        '[data-fix] [data-act="play"], [data-fix] [data-act="play-all"]',
      ),
      caption: !!document.querySelector(".jl-caption"),
      visual: !!document.querySelector(".jl-visual"),
      text: document.querySelector("[data-fix]")?.innerText || "",
    }));
    if (onRepair) await onRepair();
    if (stopAtRepair) return report;
    // A second miss on the same card, somewhere new, climbs the ladder: the sentence with its signal word.
    const used = new Set(ex.map((x) => x.target));
    const third = t.targets.find((x) => !used.has(x.id))?.id;
    const [first, second] = [ex[0], ex[1]];
    await page.locator(`[data-act="try-another"][data-item="${first.item}"]`).click();
    if (third) {
      await place(first.item, third, true);
      await page.locator(`[data-act="try-another"][data-item="${second.item}"]`).click();
      await place(second.item, second.target, true);
      await page.locator('[data-act="check"]').click();
      await page.waitForSelector("[data-fix]", T);
      report.level2 = await page.evaluate(() => ({
        level: document.querySelector("[data-fix]")?.dataset.level,
        caption: !!document.querySelector(".jl-caption"),
        signal: !!document.querySelector(".jl-caption mark, .jl-caption [class*=signal]"),
      }));
      await page.locator(`[data-act="try-another"][data-item="${first.item}"]`).click();
    } else {
      await page.locator(`[data-act="try-another"][data-item="${second.item}"]`).click();
      await place(second.item, second.target, true);
    }
    await place(first.item, first.target, Boolean(third));
    await page.locator('[data-act="check"]').click();
  }
  return report;
}

/** Both listening parts: supported placement (with an optional deliberate miss), the bridge, then the independent final check. */
export async function driveListen(page, E, task, opts = {}) {
  const rep = await driveListenPart(page, E, task, { ...opts, final: false });
  if (!E.hasFinal(task)) return rep;
  await page.waitForSelector('[data-act="start-final"]', T);
  await page.locator('[data-act="start-final"]').click();
  await page.waitForSelector('[data-act="check"]', T);
  rep.finalIndependent = await page.evaluate(() => ({
    xray: !!document.querySelector('[data-act="xray"]'),
    visuals: !!document.querySelector('[data-act="visuals"]'),
    transcript: !!document.querySelector(".jl-caption, .jl-script-text, [data-act='read-instead']"),
    text: document.querySelector(".jl-board, #app")?.innerText?.slice(0, 0),
  }));
  await driveListenPart(page, E, task, { final: true, keyboard: opts.keyboardFinal });
  return rep;
}

const clip = (s, n) => s.replace(/[.,;]/g, "").split(/\s+/).slice(0, n).join(" ").toLowerCase();
const xrClick = (page, kind, sel = "") =>
  hit(page, page.locator(`[data-xr="${kind}"]${sel}`).first());

/** One reading stage (the main passage or the transfer passage), with a deliberate wrong claim and weak evidence on main. */
async function driveReadStage(page, spec, passage, { main, explainTerms, frame, afterWhy = null }) {
  const text = (id) => passage.find((p) => p.id === id).text;
  const out = { weakWhy: false, wrongClaim: false };
  if (main && spec.claimOptions?.length > 1) {
    const wrong = spec.claimOptions.find((id) => id !== spec.claim);
    await xrClick(page, "pick", `[data-sid="${wrong}"]`);
    out.wrongClaim =
      (await page.locator(".xr-feedback, [role=status]").allInnerTexts()).join(" ").length > 0;
  }
  // The transfer passage hands over its claim; the main passage asks the learner to find it.
  if (!(await page.locator('[data-xr="check"]').count()))
    await xrClick(page, "pick", `[data-sid="${spec.claim}"]`);
  await page.waitForSelector('[data-xr="check"]', T);
  if (main && spec.weak?.length) {
    await xrClick(page, "pick", `[data-sid="${spec.weak[0]}"]`);
    await xrClick(page, "pick", `[data-sid="${spec.valid[0]}"]`);
    await xrClick(page, "check");
    await page.waitForSelector(".xr-why", T);
    out.weakWhy = true;
    if (afterWhy) await afterWhy();
    await xrClick(page, "pick", `[data-sid="${spec.weak[0]}"]`);
  }
  for (const id of spec.valid.slice(0, Math.max(spec.minValid, 1))) {
    const pressed = await page
      .locator(`[data-xr="pick"][data-sid="${id}"]`)
      .first()
      .getAttribute("aria-pressed");
    if (pressed !== "true") await xrClick(page, "pick", `[data-sid="${id}"]`);
  }
  await xrClick(page, "check");
  await page.waitForSelector('[data-xr="connect"]', T);
  await xrClick(page, "connect");
  await page.waitForSelector("#xr-explain", T);
  const v0 = spec.valid[0];
  const body = [
    `This evidence supports the claim because ${clip(text(v0), 12)}, which led to the result.`,
    `So ${clip(text(spec.claim), 10)}, and ${(explainTerms || []).join(" ")}.`,
  ].join(" ");
  await typeInto(page, "#xr-explain", body);
  await xrClick(page, "explain");
  await page.waitForFunction(
    () => document.querySelector(".xr-feedback, [data-jr-panel=complete]"),
    null,
    T,
  );
  if (await page.locator("[data-jr-panel=complete]").count()) return out;
  out.explainedFirstTry = (await page.locator(".xr-feedback.is-right").count()) > 0;
  if (!out.explainedFirstTry) {
    out.hint = await page.locator(".xr-feedback").first().innerText();
    await typeInto(page, "#xr-explain", `${body} The ${frame || ""}`.slice(0, 400));
    await xrClick(page, "explain");
    for (let i = 0; i < 2 && !(await page.locator(".xr-feedback.is-right").count()); i++) {
      if (await page.locator('[data-xr="keep"]').count()) await xrClick(page, "keep");
      else await xrClick(page, "explain");
      await sleep(150);
    }
  }
  return out;
}

export async function driveRead(page, task, { afterWhy = null } = {}) {
  const c = task.challenge;
  const main = await driveReadStage(page, { ...c, claimOptions: task.claimOptions }, task.passage, {
    main: true,
    explainTerms: c.explainTerms,
    frame: c.explainFrame,
    afterWhy,
  });
  await xrClick(page, "next");
  await page.waitForSelector('[data-stage="transfer"]', T);
  const t = c.transfer;
  const transfer = await driveReadStage(page, t, t.passage, {
    main: false,
    explainTerms: c.explainTerms,
    frame: c.explainFrame,
  });
  return { main, transfer };
}

import * as CN from "../../access-practice-lab/src/journey/engines/construct.js";
import { solve } from "./access-journey-e2e-solve.mjs";

const cn = (page, act, sel = "") => page.locator(`[data-cn="${act}"]${sel}`).first();
const phaseIs = (page, phase) => page.waitForSelector(`[data-cn-root][data-phase="${phase}"]`, T);

async function enterDraft(page, task, input) {
  switch (task.module) {
    case "expand":
    case "combine":
      await typeInto(page, "[data-cn-text=draft]", input.text);
      break;
    case "connector":
    case "pronoun":
      for (let i = 0; i < input.answers.length; i++)
        await cn(page, "pick", `[data-i="${i}"][data-v="${input.answers[i]}"]`).click();
      break;
    case "discourse": {
      // Reorder with the up/down buttons (no drag), reading the current order from the page.
      for (let pass = 0; pass < task.units.length * 3; pass++) {
        const texts = await page.locator(".cn-unit-t").allInnerTexts();
        const cur = texts.map((tx) => task.units.find((u) => u.text === tx.trim())?.id);
        const at = input.order.findIndex((id, i) => cur[i] !== id);
        if (at < 0) break;
        const from = cur.indexOf(input.order[at]);
        const before = texts.join("|");
        await cn(page, "move", `[data-pos="${from}"][data-dir="-1"]`).click();
        await page.waitForFunction(
          (b) =>
            [...document.querySelectorAll(".cn-unit-t")]
              .map((e) => e.innerText.trim())
              .join("|") !== b,
          before
            .split("|")
            .map((x) => x.trim())
            .join("|"),
          T,
        );
      }
      for (let i = 0; i < input.connectors.length; i++)
        await cn(page, "dconn", `[data-i="${i}"][data-v="${input.connectors[i]}"]`).click();
      break;
    }
    case "morphology":
      for (const [wi, w] of input.words.entries()) {
        const seen = {};
        for (const p of w.parts) {
          const n = (seen[p.type] = (seen[p.type] ?? -1) + 1);
          await cn(page, "mchip", `[data-w="${wi}"][data-v="${p.t}"]`).click();
          await cn(page, "slot", `[data-w="${wi}"][data-type="${p.type}"][data-n="${n}"]`).click();
        }
        const q = CN.meaningQuestion(task, wi);
        await cn(page, "mean", `[data-w="${wi}"][data-v="${q.part.meaning}"]`).click();
      }
      break;
  }
}

/** Build: for each module explore -> a deliberate miss -> accepted -> a new item on my own -> next. */
export async function driveBuild(page, tasks, { stopMidModule = false } = {}) {
  const report = { misses: [] };
  for (const [i, task] of tasks.entries()) {
    await page.waitForSelector(
      '[data-cn-root][data-phase="explore"], [data-cn-root][data-phase="try"]',
      T,
    );
    if (await cn(page, "start").count()) await cn(page, "start").click();
    await phaseIs(page, "try");
    if (i === 0 && ["expand", "combine"].includes(task.module)) {
      await typeInto(page, "[data-cn-text=draft]", task.module === "expand" ? task.base : "It is.");
      await cn(page, "check").click();
      await page.waitForSelector(
        ".cn [class*=is-hint], .cn .feedback.is-hint, .cn [role=status]",
        T,
      );
      report.misses.push(task.module);
    }
    const first = solve(task, false);
    if (stopMidModule && i === 0) {
      await enterDraft(page, task, first);
      return { ...report, stopped: first };
    }
    await enterDraft(page, task, first);
    await cn(page, "check").click();
    await phaseIs(page, "accepted");
    await cn(page, "to-transfer").click();
    await phaseIs(page, "transfer");
    await enterDraft(page, CN.resolveTask(task, true), solve(task, true));
    await cn(page, "check").click();
    if (i < tasks.length - 1) {
      await phaseIs(page, "done");
      await cn(page, "next").click();
    }
  }
  return report;
}

/** converse: type replies that name a `line` term first, then its evidence, then a closing detail, until the exchange ends. */
export async function driveConverse(
  page,
  task,
  { replies = null, stopAfter = null, limit = Infinity } = {},
) {
  const line = task.lines[0];
  const topic = task.topicTerms.slice(0, 2).join(" and ");
  const plan = replies || [
    `I think ${line.terms.slice(0, 2).join(" and ")} caused the change in the ${topic} because it matters for the whole result here.`,
    `The evidence is ${line.evidenceTerms.slice(0, 3).join(" and ")}, so this shows how the ${line.terms[0]} led to the result.`,
    `As a result of the ${line.terms[0]}, ${task.sourceTerms.slice(0, 2).join(" and ")} changed, and that is why the ${topic} changed.`,
    `This means the ${topic} changed because ${line.terms[0]} and the evidence ${line.evidenceTerms[0]} match together in the data.`,
  ];
  const turns = [];
  for (let n = 0; n < Math.max(task.maxTurns || 3, 1) + 1; n++) {
    const input = page.locator("[data-jt-input]");
    if (!(await input.count()) || (await page.locator("[data-jr-panel=complete]").count())) break;
    await typeInto(page, "[data-jt-input]", plan[Math.min(n, plan.length - 1)]);
    if (stopAfter === n) return { turns, stopped: true };
    await page.locator("[data-jt-send]").click();
    turns.push(plan[Math.min(n, plan.length - 1)]);
    if (turns.length >= limit) {
      await page
        .waitForFunction((k) => document.body.innerText.includes(`Reply ${k} of`), n + 2, T)
        .catch(() => {});
      return { turns, limited: true };
    }
    await page
      .waitForFunction(
        (k) =>
          document.querySelector("[data-jr-panel=complete]") ||
          document.body.innerText.includes(`Reply ${k} of`) ||
          !document.querySelector("[data-jt-input]"),
        n + 2,
        T,
      )
      .catch(() => {});
    await sleep(250);
  }
  return { turns };
}

const wc = (s) => (s.match(/\S+/g) || []).length;
/** A draft built from the pack's own facts and topic words, long enough for `minWords`. */
export function composeDraft(task) {
  const facts = (task.evidenceBank || []).map((e) => (typeof e === "string" ? e : e.text));
  const topic = (task.topicTerms || []).slice(0, 4).join(", ");
  const parts = [`I will write about ${topic}.`, ...facts];
  while (wc(parts.join(" ")) < (task.minWords || 25) + 8)
    parts.push(
      `This matters because ${(task.topicTerms || ["it"])[parts.length % 3]} changed the result, so the next step follows from it.`,
    );
  return parts.join(" ");
}

/** compose: type a draft, then submit it. */
export async function driveCompose(page, task, { stopAfterDraft = false } = {}) {
  const draft = composeDraft(task);
  await typeInto(page, "[data-jt-draft]", draft);
  if (stopAfterDraft) return draft;
  await page.waitForFunction(() => !document.querySelector("[data-jt-submit]")?.disabled, null, T);
  await page.locator("[data-jt-submit]").click();
  return draft;
}

/** After an engine part: press "Finish this step" if the runner holds the engine, then wait for the complete panel. */
export async function finishStep(page) {
  // Conversation Reality ends on its own "Finish this step"; the other held engines end on the runner's.
  await page.waitForSelector("[data-jt-finish], [data-jr-continue], [data-jr-panel=complete]", T);
  if (await page.locator("[data-jt-finish]").count())
    await page.locator("[data-jt-finish]").click();
  await page.waitForSelector("[data-jr-continue], [data-jr-panel=complete]", T);
  if (await page.locator("[data-jr-continue]").count())
    await page.locator("[data-jr-continue]").click();
  await page.waitForSelector("[data-jr-panel=complete]", T);
}

import { COPY } from "../../access-practice-lab/src/journey/engines/mirror-copy.js";

/** improve: revise the ONE target with the pack's model sentence typed as my own, compare, choose why, finish. */
export async function driveImprove(page, pack, { help = null } = {}) {
  await page.waitForSelector("[data-mirror-focus=revise]", T);
  const label = (await page.locator(".mr-target-label").first().innerText()).trim();
  const id =
    Object.keys(COPY).find((k) => COPY[k].label[0] === label) ||
    Object.keys(pack.improve.models)[0];
  if (help) await page.locator(`[data-mirror-help="${help}"]`).click();
  const cur = await page.locator("[data-mirror-focus=revise]").inputValue();
  // When every required move is present the target is "link your ideas" / "a more exact word", which has no model sentence.
  const model = pack.improve.models[id] || Object.values(pack.improve.models)[0];
  await typeInto(page, "[data-mirror-focus=revise]", `${cur} ${model}`.trim());
  await page.locator("[data-mirror-compare]").click();
  await page.waitForSelector("text=Why does this help", T);
  const why = pack.improve.whys.find((w) => w.moves.includes(id));
  const pick = why
    ? page.locator("label", { hasText: why.text })
    : page.locator("label:has(input[type=radio])");
  await pick.first().click();
  await page.waitForFunction(
    () => document.querySelector("[data-mirror-done]")?.getAttribute("aria-disabled") !== "true",
    null,
    T,
  );
  await page.locator("[data-mirror-done]").click();
  return { target: id, label };
}

/** Follow the page's recommended next action; when it is a supportive detour, take the offered alternative that goes to `expectHref`. */
export async function followTo(page, expect) {
  await page.waitForSelector("[data-jr-next]", T);
  const primary = await page.locator("[data-jr-next]").getAttribute("href");
  const info = { primary, detour: false };
  if (primary.includes(expect)) {
    await page.locator("[data-jr-next]").click();
  } else {
    info.detour = true;
    const alt = page
      .locator(`.jr-alts a[href*="${expect}"], .jr-done a[href*="${expect}"]`)
      .first();
    await alt.click();
  }
  // The old page's runner is still in the DOM until the route redraws, so wait for the NEW step's own run panel.
  const step = expect.split("/").filter(Boolean).at(-1);
  await page.waitForSelector(`[data-jr-run][data-jr-step="${step}"]`, T);
  await page.waitForSelector('[data-jr-run][data-jr-mode="run"]', T);
  return info;
}

/** Keyboard only: Tab until the element matching `selector` has focus (never moves the mouse or calls focus()). */
export async function tabTo(page, selector, max = 140) {
  for (let i = 0; i < max; i++) {
    const on = await page.evaluate(
      (sel) => document.activeElement?.matches?.(sel) === true,
      selector,
    );
    if (on) return i;
    await page.keyboard.press("Tab");
  }
  throw new Error(`keyboard: could not Tab to ${selector}`);
}

/** Listening placement with Tab / Enter / Space only: cards and targets are real buttons in the tab order. */
export async function driveListenKeyboard(page, E, task) {
  const t = E.resolveTask(task, { final: false });
  // Start from the top of the page so Tab order is the one a keyboard user gets.
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });
  let n = 0;
  for (const [i, row] of t.expect.entries()) {
    await tabTo(page, `[data-act="item"][data-item="${row.item}"]`);
    await page.keyboard.press(i % 2 ? "Space" : "Enter");
    await tabTo(page, `[data-act="target"][data-target="${row.target}"]`);
    await page.keyboard.press(i % 2 ? "Enter" : "Space");
    n++;
    await page.waitForFunction((k) => document.body.innerText.includes(`${k} of`), n, T);
  }
  await tabTo(page, '[data-act="check"]');
  await page.keyboard.press("Enter");
  return n;
}

/** Evidence selection with the keyboard: pick the claim, select valid sentences, check, connect. */
export async function driveReadKeyboard(page, task) {
  const c = task.challenge;
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });
  await tabTo(page, `[data-xr="pick"][data-sid="${c.claim}"]`);
  await page.keyboard.press("Enter");
  await page.waitForSelector('[data-xr="check"]', T);
  for (const id of c.valid.slice(0, c.minValid)) {
    await tabTo(page, `[data-xr="pick"][data-sid="${id}"]`);
    await page.keyboard.press("Space");
    await page.waitForFunction(
      (s) =>
        document
          .querySelector(`[data-xr="pick"][data-sid="${s}"]`)
          ?.getAttribute("aria-pressed") === "true",
      id,
      T,
    );
  }
  await tabTo(page, '[data-xr="check"]');
  await page.keyboard.press("Enter");
  await page.waitForSelector('[data-xr="connect"]', T);
  await tabTo(page, '[data-xr="connect"]');
  await page.keyboard.press("Enter");
  await page.waitForSelector("#xr-explain", T);
}
