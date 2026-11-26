// Language City episode "Saturday at the Community Market": the money is exact and the shopping task has exactly one fair
// answer, the conversation and the price boards say the same numbers as the data, every learner string is English and
// Spanish, every support level has its supports, nothing claims a score or an official WIDA/ACCESS item, and the page
// renders, saves to its own namespaced key and is reachable from the Corner Market.
import assert from "node:assert/strict";
import test from "node:test";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";
import { COUNTDOWN, click, makeCtx, mount, resetStorage, type } from "./lib/access-studios-dom.mjs";

const C = await import("../access-practice-lab/src/content/city-market-episode.js");
const L = await import("../access-practice-lab/src/lang/city-market.js");
const art = await import("../access-practice-lab/src/views/city-episode-art.js");
const view = await import("../access-practice-lab/src/views/city.js");

const pairs = (obj, out = []) => {
  if (!obj || typeof obj !== "object") return out;
  if (typeof obj.en === "string" && "es" in obj) out.push(obj);
  for (const v of Array.isArray(obj) ? obj : Object.values(obj)) pairs(v, out);
  return out;
};
const ALL = pairs([
  C.TITLE,
  C.BLURB,
  C.LEVEL_INFO,
  C.PEOPLE,
  C.STALLS,
  C.ITEMS,
  C.RECIPE,
  C.SPOTS,
  C.DIALOGUE,
  C.LISTEN_Q,
  C.READ_Q,
  C.SPEAK,
  C.WRITE,
  C.STEPS,
  C.DOMAIN_NAME,
]);
const cents = (id) => C.itemOf(id).unitCents * C.itemOf(id).qty;
/** "$3.50" in a string → 350. */
const dollarsIn = (s) =>
  [...String(s).matchAll(/\$(\d+)\.(\d{2})/g)].map((m) => Number(m[1]) * 100 + Number(m[2]));

test("prices are whole cents and the budget task has exactly one fair basket: $9.50 with $0.50 change", () => {
  for (const i of C.ITEMS) {
    assert.ok(Number.isInteger(i.unitCents) && i.unitCents > 0, i.id);
    assert.ok(Number.isInteger(i.qty) && i.qty > 0, i.id);
    assert.deepEqual(dollarsIn(i.detail.en), [i.unitCents], `${i.id} detail price`);
    assert.deepEqual(dollarsIn(i.detail.es), [i.unitCents], `${i.id} Spanish detail price`);
  }
  const valid = L.validCarts();
  assert.equal(valid.length, 1, `fair answers: ${JSON.stringify(valid)}`);
  assert.deepEqual([...valid[0]].sort(), ["corn", "pepper", "shredded", "tomatoes"]);
  const r = L.checkCart(valid[0]);
  assert.equal(r.total, 4 * 50 + 100 + 300 + 350);
  assert.equal(r.total, 950);
  assert.equal(r.left, C.BUDGET_CENTS - 950);
  assert.equal(L.money(r.left), "$0.50");
  // each wrong swap is over budget by a stated amount, never under it
  assert.equal(L.checkCart(["flour", "shredded", "tomatoes", "pepper"]).over, 50);
  assert.equal(L.checkCart(["corn", "block", "tomatoes", "pepper"]).over, 50);
  assert.equal(L.checkCart(["corn", "shredded", "tomatoes", "pepper", "avocado"]).over, 100);
  assert.deepEqual(L.checkCart(["corn", "shredded", "tomatoes"]).missing, ["pepper"]);
  // 8 flour tortillas exactly fill the need; 10 corn tortillas more than fill it
  assert.ok(C.itemOf("flour").count >= 8 && C.itemOf("corn").count >= 8);
});

test("the offer, the conversation, the signs and the painted price boards agree with the data", () => {
  const corn = cents("corn");
  // READ_Q level C: the offer costs $2.00 more than the one pack the recipe needs
  assert.equal(C.OFFER.cents - corn, 200);
  const right = C.READ_Q.C.opts.find((o) => o.id === C.READ_Q.C.answer);
  assert.match(right.en, /\$2\.00/);
  assert.match(right.en, /10 tortillas/);
  // the conversation: tomatoes fifty cents each; four tomatoes and a pepper are three dollars
  const said = C.DIALOGUE.map((l) => l.en).join(" ");
  assert.equal(C.itemOf("tomatoes").unitCents, 50);
  assert.match(said, /fifty cents each/);
  assert.equal(cents("tomatoes") + cents("pepper"), 300);
  assert.match(said, /That is three dollars/);
  assert.match(said, /three dollars for a pack of ten/);
  assert.equal(corn, 300);
  assert.match(said, /four dollars for a pack of eight/);
  assert.equal(cents("flour"), 400);
  assert.match(said, /shredded cheese is three fifty/);
  assert.equal(cents("shredded"), 350);
  assert.match(said, /block is four fifty/);
  assert.equal(cents("block"), 450);
  assert.match(said, /only have ten dollars/);
  assert.equal(C.BUDGET_CENTS, 1000);
  // listening answers: one tomato 50 cents (A), Maya pays three dollars (B)
  assert.match(C.LISTEN_Q.A.opts.find((o) => o.id === C.LISTEN_Q.A.answer).en, /Fifty cents/);
  assert.match(C.LISTEN_Q.B.opts.find((o) => o.id === C.LISTEN_Q.B.answer).en, /Three dollars/);
  // every price printed on a sign is the price of an item on that stall (or the offer)
  const known = new Set([...C.ITEMS.map((i) => i.unitCents), C.OFFER.cents, C.BUDGET_CENTS]);
  for (const s of C.SPOTS.filter((x) => x.sign))
    for (const line of s.sign.lines) {
      for (const c of dollarsIn(line.en)) assert.ok(known.has(c), `${s.id}: ${line.en}`);
      assert.deepEqual(
        dollarsIn(line.es),
        dollarsIn(line.en),
        `${s.id} Spanish prices: ${line.es}`,
      );
    }
  // the picture paints the same prices
  const svg = art.marketSceneSVG("Market");
  for (const id of ["tomatoes", "pepper", "avocado", "corn", "flour", "shredded", "block", "eggs"])
    assert.ok(svg.includes(L.money(C.itemOf(id).unitCents)), `board shows ${id}`);
  assert.ok(svg.includes("$5.00"));
});

test("money and the writing self-check behave", () => {
  assert.equal(L.money(950), "$9.50");
  assert.equal(L.money(5), "$0.05");
  assert.equal(L.money(-50), "-$0.50");
  assert.deepEqual(L.connectorsUsed("I chose it because it is cheap, so I saved money."), [
    "because",
    "so",
  ]);
  assert.deepEqual(L.connectorsUsed("Butter is soft."), [], "whole words only");
  assert.equal(L.wordCount("I bought 4 tomatoes for $2.00."), 6);
});

test("every learner string is written in English and Spanish, with no score, timer or official-test claim", () => {
  assert.ok(ALL.length > 150, `only ${ALL.length} pairs`);
  for (const p of ALL) {
    assert.ok(p.en.trim() && p.es.trim(), `empty: ${JSON.stringify(p)}`);
    const words = (p.en.match(/[a-z]{3,}/gi) || []).length;
    if (words > 1 && !/^\d+ tortillas$/.test(p.en))
      assert.notEqual(p.en, p.es, `Spanish copied: ${p.en}`);
    assert.ok(!COUNTDOWN.test(p.en + p.es), p.en);
    assert.ok(!SCORE_CLAIM.test(p.en + p.es), p.en);
    assert.ok(!/\b(WIDA|ACCESS)\b/.test(p.en + p.es), `content names an official test: ${p.en}`);
  }
  for (const s of C.SPOTS)
    assert.ok(s.word.en && s.word.es && s.word.def.en && s.word.def.es, s.id);
});

test("every support level has its supports, and the expectations grow from A to C", () => {
  assert.deepEqual(C.LEVELS, ["A", "B", "C"]);
  const spotWords = new Set(C.SPOTS.map((s) => s.word.en));
  for (const l of C.LEVELS) {
    assert.ok(C.LEVEL_INFO[l].label.en && C.LEVEL_INFO[l].expect.es, l);
    for (const q of [C.LISTEN_Q[l], C.READ_Q[l]]) {
      assert.equal(q.opts.length, 3, l);
      assert.equal(new Set(q.opts.map((o) => o.id)).size, 3, l);
      assert.ok(
        q.opts.some((o) => o.id === q.answer),
        `${l} answer exists`,
      );
      for (const o of q.opts) assert.ok(o.why.en && o.why.es, `${l}.${o.id} explains itself`);
    }
    assert.ok(
      C.SPEAK[l].task.en && C.SPEAK[l].model.en && C.SPEAK[l].starters.length >= 2,
      `${l} speak`,
    );
    assert.ok(C.WRITE[l].task.en && C.WRITE[l].frames.length >= 2, `${l} write`);
    for (const f of [...C.SPEAK[l].starters, ...C.WRITE[l].frames])
      assert.match(f.en, /___/, `${l} frame has a blank`);
    for (const w of [...C.SPEAK[l].bank, ...C.WRITE[l].bank])
      assert.ok(spotWords.has(w), `${l} bank word ${w} has a picture`);
    assert.ok(C.SPOTS_NEEDED[l] <= C.SPOTS.length, l);
  }
  // level A: a word bank with pictures; B and C: none
  assert.ok(C.SPEAK.A.bank.length >= 3 && C.WRITE.A.bank.length >= 3);
  assert.equal(C.WRITE.C.bank.length, 0);
  // level C asks for connected discourse with because, but and so (The Writing Revolution)
  const cFrames = C.WRITE.C.frames.map((f) => f.en).join(" ");
  for (const c of C.CONNECTORS)
    assert.match(cFrames, new RegExp(`\\b${c}\\b`), `C frame uses ${c}`);
  assert.ok(C.WRITE.A.minWords < C.WRITE.B.minWords && C.WRITE.B.minWords < C.WRITE.C.minWords);
  assert.ok(C.SPOTS_NEEDED.A <= C.SPOTS_NEEDED.B && C.SPOTS_NEEDED.B <= C.SPOTS_NEEDED.C);
  // every word picture exists
  for (const s of C.SPOTS) assert.ok(art.ICON_NAMES.includes(s.word.icon), `${s.id} icon`);
});

test("the scene: unique spots inside the picture, each tied to a stall the camera can visit", () => {
  assert.equal(new Set(C.SPOTS.map((s) => s.id)).size, C.SPOTS.length);
  const stalls = new Set(C.STALLS.map((s) => s.id));
  for (const s of C.SPOTS) {
    assert.ok(stalls.has(s.stall) && s.stall !== "all", `${s.id} stall`);
    assert.ok(
      s.at[0] > 3 && s.at[0] < 97 && s.at[1] > 3 && s.at[1] < 97,
      `${s.id} inside the picture`,
    );
  }
  for (const d of C.DIALOGUE) assert.ok(C.PEOPLE[d.who], d.who);
  assert.deepEqual(C.STEPS.map((s) => s.domain).sort(), [
    "Listening",
    "Reading",
    "Reading",
    "Reading",
    "Speaking",
    "Writing",
  ]);
});

test("saved state is cleaned: unknown ids and bad values cannot break the page", () => {
  const s = L.cleanState({
    level: "Z",
    step: 99,
    reached: -3,
    seen: ["hours", "nope", "hours"],
    cart: ["corn", "gold"],
    message: 7,
    runs: "x",
  });
  assert.equal(s.level, "");
  assert.equal(s.step, C.STEPS.length - 1);
  assert.deepEqual(s.seen, ["hours"]);
  assert.deepEqual(s.cart, ["corn"]);
  assert.equal(s.message, "");
  assert.equal(s.runs, 0);
  assert.equal(L.cleanState("not json").step, 0);
  assert.equal(
    L.levelFor({ level: "" }, { tiers: { Speaking: "C" } }),
    "C",
    "the lab's support tier is the default",
  );
  assert.equal(
    L.levelFor({ level: "A" }, { tiers: { Speaking: "C" } }),
    "A",
    "the learner's own pick wins",
  );
  assert.equal(L.MARKET_KEY, "accessPracticeLab:v1:city-market");
});

// ── the page ──────────────────────────────────────────────────────────────────
const open = async (lang, id = "market", missionId = "community-market", prefs = {}) => {
  const ctx = makeCtx("city", { lang });
  ctx.route.missionId = missionId;
  ctx.route.id = id;
  Object.assign(ctx.prefs, prefs);
  return { ctx, ...(await mount(view, ctx)) };
};

test("the Corner Market offers the episode; the city hub links to it; the twelve missions are untouched", async () => {
  resetStorage();
  const bld = await open("en", "market", "");
  assert.ok(bld.root.querySelector("a.mk-episode-card[href*='/city/market/community-market']"));
  assert.equal(
    bld.root.querySelectorAll("a[href*='/city/market/']").length,
    3,
    "two missions and the episode",
  );
  const hub = await open("en", "", "");
  assert.ok(hub.root.querySelector("a[href*='/city/market/community-market']"));
  const { MISSIONS } = await import("../access-practice-lab/src/content/city.js");
  assert.equal(MISSIONS.length, 12);
});

test("the episode page: real buttons with names, a live region, the level picker, and help that changes the language", async () => {
  resetStorage();
  let { ctx, root, out } = await open("en", "market", "community-market", {
    tiers: { Speaking: "A" },
  });
  assert.match(out.title, /Saturday at the Community Market/);
  assert.ok(root.querySelector("h1") && root.querySelector("svg.mk-scene-svg title"));
  const spots = [...root.querySelectorAll("[data-mk-spot]")];
  assert.equal(spots.length, C.SPOTS.length);
  for (const s of spots) {
    assert.equal(s.tagName, "BUTTON");
    assert.ok(s.getAttribute("aria-label").startsWith("Look at:"));
  }
  assert.equal(
    root.querySelector('[data-mk-level="A"]').getAttribute("aria-checked"),
    "true",
    "tier A from the lab prefs",
  );
  assert.ok(root.querySelector("[aria-live='polite']"));
  assert.ok(!COUNTDOWN.test(root.textContent));
  assert.match(
    root.textContent,
    /not an official WIDA or ACCESS item|Nothing here is an official WIDA or ACCESS item/,
  );
  // inspect a sign: it goes in the basket and is saved under the episode's own key
  click(view, ctx, root, '[data-mk-spot="bakery-sign"]');
  ({ ctx, root } = await open("en", "market", "community-market", { tiers: { Speaking: "A" } }));
  const saved = JSON.parse(localStorage.getItem(L.MARKET_KEY));
  assert.deepEqual(saved.seen, ["bakery-sign"]);
  assert.ok(root.querySelector(".mk-inspect") || root.querySelector(".mk-basket-list"));
  assert.match(root.querySelector(".mk-basket").textContent, /offer/);
  assert.ok(root.querySelector(".mk-basket .mk-icon"), "level A shows a picture with each word");
  // level C: no pictures, no Spanish in the basket
  click(view, ctx, root, '[data-mk-level="C"]');
  ({ root } = await open("en"));
  assert.ok(!root.querySelector(".mk-basket .mk-icon"));
  assert.ok(!/oferta/.test(root.querySelector(".mk-basket").textContent));
  assert.equal(
    JSON.parse(localStorage.getItem("accessPracticeLab:v1:city") || "{}").prog?.[
      "community-market"
    ],
    undefined,
    "city mission progress is not touched",
  );
});

test("a full visit at level B: wrong answers teach, the basket check explains, the message is kept, Spanish chrome works", async () => {
  resetStorage();
  let r = await open("es");
  assert.match(r.root.textContent, /Sábado en el Mercado Comunitario/);
  const step = async (fn) => {
    fn(r);
    r = await open("es");
  };
  await step(({ ctx, root }) => click(view, ctx, root, '[data-mk-level="B"]'));
  for (const id of ["hours", "recipe", "produce-sign", "tomatoes", "bakery-sign", "farm-sign"])
    await step(({ ctx, root }) => click(view, ctx, root, `[data-mk-spot="${id}"]`));
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-next]"));
  assert.match(r.root.textContent, /Escucha/);
  await step(({ ctx, root }) => click(view, ctx, root, '[data-mk-pick="listen:a"]'));
  assert.ok(r.root.querySelector('[data-mk-pick="listen:a"].is-wrong'));
  assert.ok(!r.root.querySelector("[data-mk-next]"), "a wrong answer does not open the next step");
  await step(({ ctx, root }) => click(view, ctx, root, '[data-mk-pick="listen:c"]'));
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-next]"));
  await step(({ ctx, root }) => click(view, ctx, root, '[data-mk-pick="compare:a"]'));
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-next]"));
  for (const id of ["flour", "shredded", "tomatoes", "pepper"])
    await step(({ ctx, root }) => click(view, ctx, root, `[data-mk-item="${id}"]`));
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-checkcart]"));
  assert.match(r.root.querySelector(".mk-step .wl-feedback").textContent, /\$0\.50/);
  await step(({ ctx, root }) => click(view, ctx, root, '[data-mk-item="flour"]'));
  await step(({ ctx, root }) => click(view, ctx, root, '[data-mk-item="corn"]'));
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-next]"));
  assert.ok(
    r.root.querySelector(".recorder, .recorder.is-unavailable"),
    "the lab's recorder (or its say-it-aloud fallback)",
  );
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-said]"));
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-next]"));
  type(
    view,
    r.ctx,
    r.root,
    "[data-mk-text]",
    "I bought corn tortillas and cheese. The total was $9.50. I have $0.50 left.",
    "onInput",
  );
  assert.match(
    JSON.parse(localStorage.getItem(L.MARKET_KEY)).message,
    /corn tortillas/,
    "the message is kept while typing",
  );
  r = await open("es");
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-save]"));
  type(
    view,
    r.ctx,
    r.root,
    "[data-mk-text]",
    r.root.querySelector("[data-mk-text]").value,
    "onChange",
  );
  assert.equal(
    JSON.parse(localStorage.getItem(L.MARKET_KEY)).saved,
    true,
    "a blur without an edit keeps the message saved",
  );
  await step(({ ctx, root }) => click(view, ctx, root, "[data-mk-next]"));
  assert.match(r.root.textContent, /Visita al mercado terminada/);
  assert.equal(JSON.parse(localStorage.getItem(L.MARKET_KEY)).runs, 1);
});
