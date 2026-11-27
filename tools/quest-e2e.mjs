#!/usr/bin/env node
/**
 * Language Quest in a real browser. Plays EVERY mission from start to finish the way a learner would (clicking the real
 * controls, typing real text), using the author's solution from the mission file, then checks what a unit test cannot:
 *
 *   - a wrong sort, a wrong multiple-choice pick and an unfinished checklist are answered with a hint, never the answer
 *   - a writing item cannot be finished without its required checklist items, and a revision must change the text
 *   - the saved run survives a reload (resume), and the portfolio, family summary and teacher evidence read it
 *   - no horizontal scroll at 375px, no console errors, axe WCAG 2.2 AA on the pages it visits (when axe is installed)
 *   - Calm motion / prefers-reduced-motion leaves no running animation
 *
 *   node tools/quest-e2e.mjs [--only <mission-id>]       (serves this working tree; BASE=<url> to point elsewhere)
 *
 * A missing browser is a SKIP locally and a FAIL in CI. Set PW_CHROMIUM_PATH to a system Chromium if needed.
 */
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(ROOT, "package.json"));
let chromium;
let AxeBuilder;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.warn("quest-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder =
    require("@axe-core/playwright").AxeBuilder || require("@axe-core/playwright").default;
} catch {}

const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : "";
const MDIR = join(ROOT, "access-practice-lab/content/quest/missions");
const missions = readdirSync(MDIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(MDIR, f), "utf8")))
  .filter((m) => !only || m.id === only);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(ROOT, "public", p))) file = join(ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(ROOT, "access-practice-lab/index.html");
      else return res.writeHead(404), res.end();
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, () => r(server)));
}

let failures = 0;
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  FAIL ${msg}`);
  }
};

// ── author-solution text: builds a sentence that satisfies a checklist, from the checklist itself ──────────────
function textFor(item, { clueTerms = [], pickedTerms = [], min = 0 } = {}) {
  const bits = [];
  for (const c of item.checks) {
    if (c.kind === "any") bits.push(c.terms[0].trim());
    else if (c.kind === "all") bits.push(c.terms.join(" and "));
    else if (c.kind === "count") bits.push(c.terms.slice(0, c.min).join(" and "));
    else if (c.kind === "quote") bits.push('"We can solve this together," said the guide.');
    else if (c.kind === "clues") bits.push(clueTerms.slice(0, c.min).join(" and "));
    else if (c.kind === "picked") bits.push(pickedTerms.slice(0, c.min).join(" and "));
    else if (c.kind === "question") bits.push("Did anyone see what happened?");
  }
  const need = Math.max(
    item.minWords || 0,
    ...item.checks.filter((c) => c.kind === "words").map((c) => c.min),
    min,
  );
  let t = `${bits.join(". ")}. `;
  const filler = "This is my own careful sentence about the evidence we found together today. ";
  while (t.trim().split(/\s+/).length < need + 4) t += filler;
  return t.trim();
}

// ── the player: one function per item kind ───────────────────────────────────────────────────────────────────────
async function playItem(page, mission, item, memo) {
  const card = page.locator(`[data-q-item="${item.id}"]`);
  const click = async (sel) => card.locator(sel).first().click();
  switch (item.kind) {
    case "explore": {
      for (const o of item.objects.slice(0, Math.max(item.need, 1) + 1)) {
        await click(`[data-q-act="inspect"][data-obj="${o.id}"]`);
        await click(`[data-q-act="mark"][data-mark="${o.relevant ? "yes" : "no"}"]`);
        if (Object.keys((memo.marks[item.id] ||= {})).length < 99 && o.relevant)
          memo.marks[item.id][o.id] = o.terms;
      }
      memo.clues[item.id] = Object.values(memo.marks[item.id]).map((terms) => terms[0]);
      break;
    }
    case "read":
      for (const s of item.sources) await click(`[data-q-act="read"][data-src="${s.id}"]`);
      break;
    case "sort": {
      // a deliberately wrong first try: the hint appears and the right category does not
      const wrong = item.categories.find((c) => c.id !== item.cards[0].cat).id;
      await click(`[data-q-act="place"][data-card="${item.cards[0].id}"][data-cat="${wrong}"]`);
      for (const c of item.cards.slice(1))
        await click(`[data-q-act="place"][data-card="${c.id}"][data-cat="${c.cat}"]`);
      await click('[data-q-act="check-sort"]');
      const txt = await card.innerText();
      ok(
        /Think again/i.test(txt) && txt.includes(item.cards[0].why),
        `${item.id}: a wrong sort shows the card's hint`,
      );
      ok(
        !txt.includes(`Category: ${item.cards[0].cat}`),
        `${item.id}: a wrong sort does not state the answer`,
      );
      await click(
        `[data-q-act="place"][data-card="${item.cards[0].id}"][data-cat="${item.cards[0].cat}"]`,
      );
      await click('[data-q-act="check-sort"]');
      break;
    }
    case "compare": {
      for (const o of item.options)
        for (const e of item.evidence)
          await card
            .locator(`select[data-key="${o.id}.${e.id}"]`)
            .selectOption(item.matrix[o.id][e.id]);
      const best = item.noKey
        ? item.options[0]
        : item.options
            .map((o) => ({
              o,
              n: item.evidence.filter((e) => item.matrix[o.id][e.id] === "supports").length,
            }))
            .sort((a, b) => b.n - a.n)[0].o;
      await click(`[data-q-act="choose-best"][data-opt="${best.id}"]`);
      await click('[data-q-act="check-compare"]');
      break;
    }
    case "ask": {
      const need = new Set(item.needFlags);
      const nodes = item.dialogue.nodes;
      let guard = 0;
      let composed = 0;
      while (guard++ < 30) {
        const done = await card.locator(".q-fb.is-ok").count();
        if (done) break;
        const opts = await card
          .locator('[data-q-act="ask-opt"]')
          .evaluateAll((els) => els.map((e) => e.dataset.opt));
        if (
          item.compose &&
          composed < item.compose &&
          (await card.locator('[data-q-act="compose-text"]').count())
        ) {
          await card.locator('[data-q-act="compose-text"]').fill("Did you hear the alarm?");
          await click('[data-q-act="ask-compose"]');
          composed++;
          continue;
        }
        // prefer an option that sets a needed flag, then "back", then anything
        const flagged = Object.values(nodes)
          .flatMap((n) => n.options || [])
          .filter((o) => (o.sets || []).some((f) => need.has(f)) && opts.includes(o.id));
        const pick = flagged[0]?.id || opts.find((o) => /back/.test(o)) || opts[0];
        if (!pick) break;
        await click(`[data-q-act="ask-opt"][data-opt="${pick}"]`);
      }
      break;
    }
    case "choose": {
      const picks = item.options.slice(0, item.pick || 1);
      for (const p of picks) await click(`[data-q-act="choose-opt"][data-opt="${p.id}"]`);
      memo.picked[item.id] = picks.map((p) => p.terms?.[0]).filter(Boolean);
      break;
    }
    case "check": {
      const wrong = item.options.find((o) => o.id !== item.answer);
      await card.locator(`input[value="${wrong.id}"]`).check();
      await click('[data-q-act="check-answer"]');
      const t = await card.innerText();
      ok(
        t.includes(wrong.fb) && !(await card.locator(".q-fb.is-ok").count()),
        `${item.id}: a wrong pick gets its own feedback and is not marked right`,
      );
      await card.locator(`input[value="${item.answer}"]`).check();
      await click('[data-q-act="check-answer"]');
      break;
    }
    case "write": {
      const area = card.locator('[data-q-act="write-text"]');
      const clueTerms = item.clueFrom ? memo.clues[item.clueFrom] || [] : [];
      const pickedTerms = item.pickedFrom ? memo.picked[item.pickedFrom] || [] : [];
      // 1. an empty/short attempt cannot be finished
      await area.fill(item.reviseOf ? await area.inputValue() : "Too short.");
      await click('[data-q-act="write-check"]');
      ok(
        await card.locator('[data-q-act="write-finish"]').isDisabled(),
        `${item.id}: Finish is disabled until the checklist is met`,
      );
      // 2. a text that meets every check
      let text = textFor(item, { clueTerms, pickedTerms });
      if (item.reviseOf)
        text += " I also revised this part to make my meaning clearer for the reader today.";
      if (item.world === "walk")
        text = `First, ${item.reviseOf ? "from the camp, " : ""}walk east 2 steps to the oak tree. Next, walk north 2 steps to the red flag. Then walk east 2 steps across the bridge. After that, walk north 2 steps to the windmill. Finally, walk east 1 step to the cave.`;
      await area.fill(text);
      await click('[data-q-act="write-check"]');
      if (item.world === "walk") {
        await click('[data-q-act="send-kai"]');
        ok(
          /reached the cave/i.test(await card.innerText()),
          `${item.id}: Kai follows the written directions to the cave`,
        );
      }
      const why = await card
        .locator(`#qm-${item.id}`)
        .innerText()
        .catch(() => "");
      const unmet = await card.locator(".q-check.is-open .q-check-text").allInnerTexts();
      ok(
        !(await card.locator('[data-q-act="write-finish"]').isDisabled()),
        `${item.id}: Finish is enabled once the checklist is met (${why} ${unmet.join(" | ")})`,
      );
      await click('[data-q-act="write-finish"]');
      memo.written[item.id] = text;
      break;
    }
    case "speak": {
      await card.locator(".q-typed summary").click();
      await card
        .locator('[data-q-act="typed-text"]')
        .fill(
          "My claim is that the plan works because we checked the clues. First I looked, second I listened, and that is why I think so, thank you.".repeat(
            2,
          ),
        );
      for (const c of item.selfChecks.slice(0, item.needSelf))
        await card.locator(`[data-q-act="self"][data-self="${c.id}"]`).check();
      await card.locator('[data-q-act="note-text"]').fill("Next time I will speak more slowly");
      await click('[data-q-act="speak-finish"]');
      ok(
        /typed rehearsal/i.test(await card.innerText()),
        `${item.id}: typed practice is labelled typed rehearsal`,
      );
      break;
    }
    case "story": {
      const picks = {
        character: item.elements.character[0],
        setting: item.elements.setting[0],
        problem: item.elements.problem[0],
      };
      for (const [k, o] of Object.entries(picks))
        await click(`[data-q-act="pick-el"][data-kind="${k}"][data-id="${o.id}"]`);
      for (const slot of item.slots) {
        const terms = (slot.picks || []).map((k) => picks[k].terms[0]);
        const text = textFor({ checks: slot.checks, minWords: 0 }, { pickedTerms: terms });
        await card.locator(`[data-q-act="slot-text"][data-slot="${slot.id}"]`).fill(text);
        await click(`[data-q-act="slot-save"][data-slot="${slot.id}"]`);
      }
      ok(
        await page.locator(".q-story-stage .q-actor").count(),
        `${item.id}: the stage shows the chosen character`,
      );
      memo.written[item.id] = true;
      break;
    }
    case "forge": {
      const src = item.tasksFrom ? missionItem(mission, item.tasksFrom) : item;
      const press = async (key) => {
        const [prefix, root, suffix] = key.split("|");
        await click(`[data-q-act="part"][data-kind="prefix"][data-id="${prefix}"]`);
        await click(`[data-q-act="part"][data-kind="root"][data-id="${root}"]`);
        await click(`[data-q-act="part"][data-kind="suffix"][data-id="${suffix}"]`);
        await click('[data-q-act="forge-it"]');
      };
      if (item.mode === "tasks") for (const t of item.tasks) await press(t.want);
      else for (const k of Object.keys(src.table).slice(0, item.need)) await press(k);
      memo.picked[item.id] = (await card.locator(".q-forged strong").allInnerTexts()).slice(-1);
      const found = Object.entries(src.table)
        .slice(0, item.mode === "tasks" ? 0 : item.need)
        .map(([, v]) => v.word);
      memo.picked[item.id] =
        item.mode === "tasks" ? item.tasks.map((t) => src.table[t.want].word) : found;
      break;
    }
    case "simulate":
      for (const id of item.solution) await card.locator(`input[data-id="${id}"]`).check();
      await click('[data-q-act="run-model"]');
      memo.picked[item.id] = item.solution.flatMap((id) =>
        item.model.projects.find((p) => p.id === id).terms.slice(0, 1),
      );
      break;
    case "route":
      for (const d of item.solution) await click(`[data-q-act="step"][data-dir="${d}"]`);
      await click('[data-q-act="walk"]');
      break;
    case "timeline": {
      const want = [...item.events].sort((a, b) => a.order - b.order).map((e) => e.id);
      for (let i = 0; i < want.length; i++) {
        let order = await card
          .locator(".q-tl-btns [data-q-act=earlier]")
          .evaluateAll((els) => els.map((e) => e.dataset.id));
        while (order.indexOf(want[i]) > i) {
          await click(`[data-q-act="earlier"][data-id="${want[i]}"]`);
          order = await card
            .locator(".q-tl-btns [data-q-act=earlier]")
            .evaluateAll((els) => els.map((e) => e.dataset.id));
        }
      }
      await click('[data-q-act="check-order"]');
      break;
    }
    default:
      throw new Error(`unknown kind ${item.kind}`);
  }
  ok(
    await card.locator(".q-item-state.is-done").count(),
    `${item.id} (${item.kind}) is marked done after the author's solution`,
  );
}
const missionItem = (m, id) => m.stages.flatMap((s) => s.items).find((i) => i.id === id);

async function playMission(browser, base, mission, axeOnce) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on(
    "pageerror",
    (e) => !/web-vitals/.test(e.message) && errors.push(`pageerror: ${e.message}`),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|Failed to load resource/.test(m.text()) &&
      errors.push(`console: ${m.text()}`),
  );
  console.log(`\n${mission.id} (${mission.band})`);
  await page.goto(`${base}/quest/mission/${mission.id}?grades=${mission.band}`);
  await page.waitForSelector('[data-q-act="start"]');
  if (axeOnce && AxeBuilder) {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    ok(
      r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).length === 0,
      `axe (mission intro): ${r.violations.map((v) => v.id).join(", ")}`,
    );
  }
  await page.click('[data-q-act="start"]');
  await page.waitForSelector(".q-stages");
  const memo = { marks: {}, clues: {}, picked: {}, written: {} };
  for (let si = 0; si < mission.stages.length; si++) {
    const stage = mission.stages[si];
    ok(
      (await page.locator(".q-stage.is-on").innerText()).length > 0,
      `${mission.id}: stage ${stage.id} is current`,
    );
    for (const item of stage.items) {
      await playItem(page, mission, item, memo);
      if (process.env.QUEST_SHOTS)
        await page
          .locator(`[data-q-item="${item.id}"]`)
          .screenshot({ path: join(process.env.QUEST_SHOTS, `${mission.id}-${item.id}.png`) });
    }
    if (si === 0 && axeOnce && AxeBuilder) {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      ok(
        r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).length === 0,
        `axe (player): ${r.violations.map((v) => `${v.id}[${v.nodes[0]?.html.slice(0, 80)}] ${JSON.stringify(v.nodes[0]?.any?.[0]?.data || {}).slice(0, 200)}`).join(", ")}`,
      );
    }
    if (si === 0) {
      // resume: reload mid-mission and the finished stage is still finished
      await page.reload();
      await page.waitForSelector(".q-stages");
      ok(
        await page.locator(".q-item-state.is-done").count(),
        `${mission.id}: progress survives a reload (resume)`,
      );
    }
    if (si < mission.stages.length - 1) {
      await page.click('[data-q-act="stage"][data-stage="' + (si + 1) + '"]:not([disabled])');
      await page.waitForFunction(
        (n) => document.querySelector(".q-stage.is-on")?.dataset.stage === String(n),
        si + 1,
      );
    }
  }
  await page.waitForSelector('[data-q-act="finish-mission"]');
  await page.click('[data-q-act="finish-mission"]');
  await page.waitForSelector(".q-ending");
  const ending = await page.locator(".q-ending h2").innerText();
  ok(ending.length > 3, `${mission.id}: an ending is shown (${ending})`);
  ok(
    mission.endings.some((e) => e.title === ending),
    `${mission.id}: the ending comes from the mission file`,
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(overflow <= 1, `${mission.id}: no horizontal scroll at 1280px (${overflow})`);
  // portfolio, family and teacher read the finished run
  await page.goto(`${base}/quest/portfolio?grades=${mission.band}`);
  await page.waitForSelector(".q-pf");
  ok(
    (await page.locator(".q-pf").first().innerText()).includes(mission.title.en),
    `${mission.id}: the portfolio lists the run`,
  );
  await page.goto(`${base}/quest/family/${mission.id}?grades=${mission.band}`);
  await page.waitForSelector(".q-family");
  // the summary itself (not the optional sentence picker, which only lists the learner's own lines on their own device)
  const fam = await page.locator(".q-family").evaluate((el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll("select").forEach((n) => n.remove());
    return c.innerText;
  });
  ok(
    fam.includes(mission.family.vocab[0].term),
    `${mission.id}: the family summary names a vocabulary word`,
  );
  ok(
    !Object.values(memo.written).some((t) => typeof t === "string" && fam.includes(t.slice(0, 30))),
    `${mission.id}: the family summary includes none of the student's writing by default`,
  );
  await page.goto(`${base}/quest/teacher/evidence?grades=${mission.band}`);
  await page.waitForSelector(".q-ev");
  ok(
    (await page.locator(".q-ev").first().innerText()).toLowerCase().includes("suggested next step"),
    `${mission.id}: teacher evidence gives a next step`,
  );
  // phone width
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${base}/quest/mission/${mission.id}?grades=${mission.band}`);
  await page.waitForSelector(".q-stages");
  const o2 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(o2 <= 1, `${mission.id}: no horizontal scroll at 375px (${o2})`);
  ok(
    errors.length === 0,
    `${mission.id}: no console or page errors ${errors.slice(0, 2).join(" | ")}`,
  );
  await ctx.close();
}

async function hubChecks(browser, base) {
  console.log("\nhub, worlds, teacher, studio");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  for (const [route, h1] of [
    ["/quest", "Language Quest"],
    ["/quest/quick", "Quick Practice"],
    ["/quest/world", "Explore a World"],
    ["/quest/teacher", "Teacher Mission Hub"],
    ["/quest/create", "Creative Language Studio"],
    ["/quest/portfolio", "My Language Portfolio"],
  ]) {
    await page.goto(`${base}${route}?grades=6-8`);
    await page.waitForSelector("#app h1");
    ok(
      (await page.locator("#app h1").first().innerText()).includes(h1),
      `${route} renders "${h1}"`,
    );
    if (AxeBuilder) {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      ok(
        r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).length === 0,
        `axe ${route}: ${r.violations.map((v) => `${v.id}[${v.nodes[0]?.html.slice(0, 70)}]`).join(", ")}`,
      );
    }
  }
  // hub: three doors and every world has a card
  await page.goto(`${base}/quest?grades=6-8`);
  await page.waitForSelector(".q-door");
  ok((await page.locator(".q-door").count()) === 3, "the hub offers exactly three doors");
  await page.goto(`${base}/quest/world?grades=6-8`);
  await page.waitForSelector(".q-mcard");
  ok((await page.locator(".q-mcard").count()) === 9, "all nine worlds are listed");
  // teacher: filters narrow the catalog and demo mode never saves
  await page.goto(`${base}/quest/teacher?grades=6-8&band=3-5`);
  await page.waitForSelector(".q-tcard");
  const n35 = await page.locator(".q-tcard").count();
  ok(
    n35 === missions.filter((m) => m.band === "3-5").length || only,
    `teacher filter by grade band 3-5 shows ${n35}`,
  );
  await page.goto(`${base}/quest/mission/${missions[0].id}?grades=${missions[0].band}&demo=1`);
  await page.waitForSelector(".q-demo");
  const saved = await page.evaluate(() => localStorage.getItem("accessPracticeLab:v1:quest"));
  ok(
    !saved || !JSON.parse(saved).runs?.[missions[0].id],
    "demo (projection) mode writes no student run",
  );
  // creative studio: make, edit, reload, present
  await page.goto(`${base}/quest/create?grades=3-5`);
  await page.click('[data-q-act="c-new"][data-format="story"]');
  await page.waitForSelector(".q-panel");
  await page.locator('[data-q-p="text"][data-n="0"]').fill("Mina lived by a quiet river.");
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForSelector(".q-panel");
  ok(
    (await page.locator('[data-q-p="text"][data-n="0"]').inputValue()) ===
      "Mina lived by a quiet river.",
    "the studio saves and resumes a creation",
  );
  await page.goto(`${page.url().split("?")[0]}?grades=3-5&present=1&p=0`);
  await page.waitForSelector(".q-present");
  ok(
    (await page.locator(".q-present-line").innerText()).includes("Mina lived"),
    "present mode shows the panel text",
  );
  // Speaking Studio: observe, prepare (expand a response), speak (typed rehearsal), review, improve, save
  await page.goto(`${base}/quest/speaking?grades=3-5`);
  await page.waitForSelector(".q-mcard");
  ok(
    (await page.locator(".q-mcard").count()) >= 3,
    "the Speaking Studio lists pictures for the grade band",
  );
  await page.goto(`${base}/quest/speaking/park?grades=3-5`);
  await page.waitForSelector('[data-q-act="exp-next"]');
  await page.click('[data-q-act="exp-next"]');
  await page.click('[data-q-act="exp-next"]');
  ok((await page.locator(".q-quote mark").count()) > 0, "the expansion step marks the new words");
  if (AxeBuilder) {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    ok(
      r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).length === 0,
      `axe speaking studio: ${r.violations.map((v) => `${v.id}[${v.nodes[0]?.html.slice(0, 70)}]`).join(", ")}`,
    );
  }
  await page.locator(".q-typed summary").click();
  await page
    .locator('[data-q-act="typed-text"]')
    .fill(
      "I see a red kite flying above the trees and a fox next to the tree because the sun is shining today.",
    );
  await page.locator('[data-q-act="self"][data-self="see"]').check();
  await page.locator('[data-q-act="self"][data-self="where"]').check();
  await page.locator('[data-q-act="note-text"]').fill("Next time I will add a color");
  await page.click('[data-q-act="speak-finish"]');
  ok(
    /typed rehearsal/i.test(await page.locator('[data-q-item="speak"]').innerText()),
    "studio typed practice is labelled typed rehearsal",
  );
  await page.goto(`${base}/quest/teacher/evidence?grades=3-5`);
  await page.waitForSelector(".q-ev");
  ok(
    (await page.locator(".q-ev").allInnerTexts()).some((t) => t.includes("Describe the Park")),
    "teacher evidence includes the Speaking Studio run",
  );
  // reduced motion: nothing animates
  const rm = await browser.newContext({ reducedMotion: "reduce" });
  const p2 = await rm.newPage();
  await p2.goto(`${base}/quest/world/mystery-files?grades=6-8`);
  await p2.waitForSelector("#app h1");
  const anim = await p2.evaluate(
    () =>
      [...document.querySelectorAll(".q-page *")].filter(
        (e) => getComputedStyle(e).animationName !== "none",
      ).length,
  );
  ok(anim === 0, `reduced motion: no running animation (${anim})`);
  await rm.close();
  ok(errors.length === 0, `hub pages: no page errors ${errors.slice(0, 2).join(" | ")}`);
  await ctx.close();
}

const exe =
  process.env.PW_CHROMIUM_PATH ||
  (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
let browser;
try {
  browser = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ["--no-sandbox"],
  });
} catch (e) {
  console.warn(`quest-e2e: SKIP — no browser (${String(e.message).split("\n")[0]}).`);
  process.exit(process.env.CI ? 1 : 0);
}
const server = process.env.BASE ? null : await serve();
const base = process.env.BASE || `http://localhost:${server.address().port}/access-practice-lab`;
try {
  await hubChecks(browser, base);
  let first = true;
  for (const m of missions) {
    await playMission(browser, base, m, first);
    first = false;
  }
} catch (e) {
  failures++;
  console.error("quest-e2e: crashed:", e.message.split("\n").slice(0, 6).join("\n"));
} finally {
  await browser.close();
  server?.close();
}
console.log(
  `\nquest-e2e: ${failures ? "FAIL" : "PASS"} (${checks} checks, ${failures} failures, ${missions.length} missions played)`,
);
process.exit(failures ? 1 : 0);
