// Unit 4's hand-built studios resist guessing the way the generated ones do (assets/u4-studio-guess.js).
//
// A student who clicks every choice in order must earn no star; the second miss closes the item into Look closer; the choices move
// after a miss; the miss survives a reload; and only one fresh problem (assets/u4-studio-twin.js) turns a guessed answer into a
// star. Run against the real pages in jsdom, and the fresh-problem generator on its own with every answer re-derived from the
// question text.
//
//   node tools/unit4-guess.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { U4_PAGES, u4McItems } from "./lib/u4-mc-items.mjs";
import { loadU4Page } from "./lib/u4-page-dom.mjs";

/* ---- the fresh-problem generator, alone ------------------------------------------------------------ */
const ctx = /** @type {any} */ ({});
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("assets/u4-studio-twin.js", "utf8"), ctx);
const Twin = ctx.U4Twin;
assert.deepEqual([...Twin.families].sort(), ["fdp", "partOf", "pctMeaning", "wholeOf"]);

const gcd = (/** @type {number} */ a, /** @type {number} */ b) => (b ? gcd(b, a % b) : a);
/** The answer recomputed from the question text alone, with exact integer arithmetic where it can be. */
const derive = {
  pctMeaning(/** @type {string} */ q) {
    const [d, n] = (q.match(/\d+/g) || []).map(Number); // every story names the whole first, then the part
    assert.ok(n > 0 && n < d, `part ${n} is inside whole ${d}`);
    assert.equal((n * 100) % d, 0, `${n}/${d} scales to 100 exactly`);
    return (n * 100) / d;
  },
  fdp(/** @type {string} */ q) {
    const m = q.match(/^Write (\d+)\/(\d+) as a (percent|decimal)\.$/);
    assert.ok(m, `unreadable fdp question ${q}`);
    const [n, d] = [Number(m[1]), Number(m[2])];
    assert.equal(gcd(n, d), 1, `${n}/${d} is in lowest terms`);
    return m[3] === "percent" ? (n * 100) / d : n / d;
  },
  partOf(/** @type {string} */ q) {
    const m = q.match(/^What is (\d+)% of (\d+)\?$/);
    assert.ok(m, `unreadable partOf question ${q}`);
    return (Number(m[1]) * Number(m[2])) / 100;
  },
  wholeOf(/** @type {string} */ q) {
    const m = q.match(/^(\d+) is (\d+)% of a number\. What is the number\?$/);
    assert.ok(m, `unreadable wholeOf question ${q}`);
    const [part, p] = [Number(m[1]), Number(m[2])];
    assert.equal((part * 100) % p, 0, `${part} is a whole-number ${p}% piece`);
    return (part * 100) / p;
  },
};
const hasNumber = (/** @type {string} */ text, /** @type {number} */ n) => {
  const forms = [String(n), Number(n).toLocaleString("en-US")];
  return forms.some((f) =>
    new RegExp(`(^|[^\\d.,])${f.replace(/\./g, "\\.")}(?![\\d]|[.,]\\d)`).test(text),
  );
};

let twins = 0;
let diagnosed = 0;
for (const family of Twin.families) {
  const seen = new Set();
  for (let seed = 1; seed <= 400; seed++) {
    const t = Twin.make(family, seed);
    const at = `${family} seed ${seed}`;
    assert.equal(t.q, Twin.make(family, seed).q, `${at}: same seed, same problem`);
    assert.ok(Number.isFinite(t.ans) && t.ans > 0, `${at}: a positive answer`);
    assert.ok(Math.abs(t.ans - derive[family](t.q)) < 1e-9, `${at}: answer ${t.ans} for "${t.q}"`);
    for (const k of ["q", "qEs", "hint", "hintEs"])
      assert.ok(typeof t[k] === "string" && t[k].trim(), `${at}: ${k} is written`);
    assert.notEqual(t.qEs, t.q, `${at}: Spanish is not the English copied over`);
    assert.ok(
      !hasNumber(t.hint, t.ans) && !hasNumber(t.hintEs, t.ans),
      `${at}: hint prints ${t.ans}`,
    );
    assert.ok(t.check(String(t.ans)).ok, `${at}: the right answer is accepted`);
    assert.ok(t.check(` ${t.ans} ${t.unit === "%" ? "%" : ""}`).ok, `${at}: spaces and % are read`);
    assert.equal(t.check(String(t.ans + 1)).ok, false, `${at}: a wrong answer is rejected`);
    assert.equal(t.check("").ok, false, `${at}: an empty box is not an answer`);
    // every kind of wrong answer the diagnosis names: a message in both languages that never prints the answer
    const guesses = [t.ans + 1, t.ans * 100, t.ans / 100, t.ans / 2, t.ans * 2, 1, 7, 100];
    for (const g of guesses) {
      const r = t.check(String(g));
      if (r.ok) continue;
      assert.ok(r.say && r.sayEs && r.sayEs !== r.say, `${at}: guess ${g} has a bilingual message`);
      assert.ok(
        !hasNumber(r.say, t.ans) && !hasNumber(r.sayEs, t.ans),
        `${at}: the message for ${g} prints the answer ${t.ans}: ${r.say}`,
      );
      diagnosed += 1;
    }
    seen.add(t.q);
    twins += 1;
  }
  assert.ok(seen.size >= 40, `${family}: only ${seen.size} different problems in 400 seeds`);
}

/* ---- the real pages in jsdom ----------------------------------------------------------------------- */
const onPanel = (/** @type {any} */ d, /** @type {number} */ tab) =>
  d.getElementById(`panel-${tab}`);
const dotsOf = (/** @type {any} */ d, /** @type {number} */ tab) => [
  ...onPanel(d, tab).querySelectorAll(".step-dot"),
];
const choicesOf = (/** @type {any} */ d, /** @type {number} */ tab) => [
  ...onPanel(d, tab).querySelectorAll(
    ".stage-card .choice-stack > .choice-btn, .stage-card .choice-list > .choice-btn",
  ),
];

/** Click the first choice not yet marked wrong, taking the cheapest pause chip when one is in the way. */
async function clickThrough(
  /** @type {any} */ p,
  /** @type {number} */ tab,
  /** @type {number} */ idx,
) {
  const { d } = p;
  const log = /** @type {string[]} */ ([]);
  for (let step = 0; step < 14; step++) {
    if (dotsOf(d, tab)[idx].classList.contains("solved")) return log;
    const chip = onPanel(d, tab).querySelector(".hold-chip");
    if (chip) {
      chip.click();
      await p.settle();
    }
    const open = choicesOf(d, tab).filter((b) => !b.classList.contains("wrong") && !b.disabled);
    assert.ok(open.length, "an open choice remains");
    log.push((open[0].textContent || "").replace(/\s+/g, " ").trim());
    open[0].click();
    await p.settle();
  }
  assert.fail("the item never solved");
}

/** Open the Tab 5 item at `idx`. */
async function openItem(
  /** @type {any} */ p,
  /** @type {number} */ tab,
  /** @type {number} */ idx,
) {
  p.d.getElementById(`tab-${tab}`).click();
  await p.settle();
  dotsOf(p.d, tab)[idx].click();
  await p.settle();
}

let clicked = 0;
let proofs = 0;
for (const page of U4_PAGES) {
  const tag = `[${page}]`;
  const items = u4McItems(page).filter((i) => /T5|QUIZ|Q5|S5/i.test(i.list));
  assert.equal(items.length, 10, `${tag} Tab 5 has its ten multiple-choice items`);
  // items whose right answer is NOT among the first two choices: clicking in order is certain to guess
  const hard = items.map((it, i) => ({ i, correct: it.correct })).filter((x) => x.correct >= 2);
  assert.ok(hard.length >= 1, `${tag} has an item to guess at`);

  const p = await loadU4Page(page);
  assert.deepEqual(p.errors, [], `${tag} loads without a script error`);
  const { w, d } = p;
  assert.ok(w.U4Guess && w.StudioAttempts && w.U4Twin, `${tag} loads the guess layer`);

  // 1. click every choice in order: no star, the answer is owed a fresh problem
  const idx = hard[0].i;
  await openItem(p, 5, idx);
  const stars0 = w.U4Studio.totalStars();
  const before = choicesOf(d, 5).map((b) => (b.textContent || "").replace(/\s+/g, " ").trim());
  // the first miss: choices move and no blocking pause holds the next try
  const first = choicesOf(d, 5)[0];
  first.click();
  await p.settle();
  assert.ok(
    !onPanel(d, 5).querySelector(".hold-chips"),
    `${tag} no hold pause appears after a miss`,
  );
  const moved = choicesOf(d, 5).map((b) => (b.textContent || "").replace(/\s+/g, " ").trim());
  assert.notDeepEqual(moved, before, `${tag} the choices move after a miss`);
  assert.equal(w.U4Guess.record().miss[`5:${idx}`], 1, `${tag} one miss is saved for the slot`);

  // 2. the miss survives a reload
  const reloaded = await loadU4Page(page, { storage: p.storage() });
  assert.equal(
    reloaded.w.U4Guess.record().miss[`5:${idx}`],
    1,
    `${tag} the miss is saved across a reload`,
  );
  await openItem(reloaded, 5, idx);
  const after = choicesOf(reloaded.d, 5).map((b) =>
    (b.textContent || "").replace(/\s+/g, " ").trim(),
  );
  assert.notDeepEqual(after, before, `${tag} the choices stay moved after a reload`);
  reloaded.close();

  // 3. keep clicking in order until it solves
  const log = await clickThrough(p, 5, idx);
  clicked += log.length;
  const id = w.U4Guess.record().slot[`5:${idx}`];
  assert.ok(id, `${tag} the solved item is recorded`);
  assert.equal(
    w.U4Guess.record().tier[`t5:${id}`],
    "guessed",
    `${tag} clicking through is guessing`,
  );
  assert.equal(w.U4Studio.totalStars(), stars0, `${tag} a guessed answer earns no star`);
  assert.ok(w.U4Guess.pending(5, id), `${tag} a fresh problem is owed`);
  assert.ok(onPanel(d, 5).querySelector(".prove-box"), `${tag} the fresh problem is offered`);
  assert.ok(dotsOf(d, 5)[idx].classList.contains("owed"), `${tag} the step dot shows what is owed`);
  assert.ok(!w.U4Guess.record().flag[`t5:${id}`], `${tag} nothing is flagged yet`);

  // 4. a fresh problem shown clean earns the star
  onPanel(d, 5).querySelector("[data-prove]").click();
  await p.settle();
  const host = onPanel(d, 5).querySelector(".u4-twin");
  assert.ok(host, `${tag} the fresh problem appears`);
  const gen = w.U4Studio.withCfg((/** @type {any} */ c) => c.bonus.gen);
  const twin = w.U4Twin.make(gen, Number(host.dataset.seed));
  assert.ok(host.textContent.includes(twin.q), `${tag} the fresh problem is the seeded one`);
  const input = host.querySelector("[data-twin-in]");
  input.value = String(twin.ans + 3);
  host.querySelector("[data-twin-check]").click();
  await p.settle();
  assert.equal(w.U4Studio.totalStars(), stars0, `${tag} a wrong fresh answer earns nothing`);
  assert.ok(
    !hasNumber(host.querySelector("[data-twin-fb]").textContent, twin.ans),
    `${tag} it never prints the answer`,
  );
  input.value = String(twin.ans);
  host.querySelector("[data-twin-check]").click();
  await p.settle();
  assert.equal(w.U4Guess.pending(5, id), false, `${tag} shown on a fresh problem`);
  assert.equal(w.U4Guess.record().proved[`t5:${id}`], 1, `${tag} the proof is saved`);
  assert.equal(
    w.U4Studio.totalStars(),
    stars0 + 1,
    `${tag} the star arrives after the fresh problem`,
  );
  proofs += 1;
  p.close();

  // 5. a teacher flag when the fresh problems are not shown: no star, but the student is not stuck
  const q = await loadU4Page(page);
  await openItem(q, 5, idx);
  const starsQ = q.w.U4Studio.totalStars();
  await clickThrough(q, 5, idx);
  const idQ = q.w.U4Guess.record().slot[`5:${idx}`];
  for (let round = 0; round < q.w.StudioAttempts.MAX_PROOFS; round++) {
    const go = onPanel(q.d, 5).querySelector("[data-prove], .repair-btn");
    assert.ok(go, `${tag} fresh problem ${round + 1} is offered`);
    go.click();
    await q.settle();
    const h = onPanel(q.d, 5).querySelector(".u4-twin");
    const t = q.w.U4Twin.make(gen, Number(h.dataset.seed));
    h.querySelector("[data-twin-in]").value = String(t.ans + 5);
    h.querySelector("[data-twin-check]").click();
    await q.settle();
    h.querySelector("[data-twin-in]").value = String(t.ans + 6);
    h.querySelector("[data-twin-check]").click();
    await q.settle();
    h.querySelector("[data-twin-in]").value = String(t.ans);
    h.querySelector("[data-twin-check]").click(); // the third try: not shown
    await q.settle();
  }
  assert.equal(
    q.w.U4Guess.record().flag[`t5:${idQ}`],
    "teacher",
    `${tag} released with a teacher flag`,
  );
  assert.equal(q.w.U4Guess.pending(5, idQ), false, `${tag} the student is not stuck`);
  assert.equal(q.w.U4Studio.totalStars(), starsQ, `${tag} a released answer earns no star`);
  assert.equal(
    onPanel(q.d, 5).querySelector("[data-owed]"),
    null,
    `${tag} the next button comes back`,
  );
  q.close();
}

/* ---- a clean answer, a support link, and the saved-choice star leak ---------------------------------- */
{
  const page = "4-5-practice-studio";
  const p = await loadU4Page(page);
  const { w, d } = p;
  const items = u4McItems(page).filter((i) => /T5/i.test(i.list));
  await openItem(p, 5, 0);
  const right = choicesOf(d, 5)[items[0].correct];
  right.click();
  await p.settle();
  assert.equal(w.U4Guess.record().tier["t5:t5_1"], "clean", "a first-try answer is clean");
  assert.equal(w.U4Studio.totalStars(), 1, "a clean answer earns its star at once");
  assert.equal(onPanel(d, 5).querySelector(".prove-box"), null, "a clean answer owes nothing");

  // one miss then the right answer is assisted: it still earns the star
  await openItem(p, 5, 1);
  const wrongOne = choicesOf(d, 5).find((_b, i) => i !== items[1].correct);
  wrongOne.click();
  await p.settle();
  onPanel(d, 5).querySelector(".hold-chip")?.click();
  await p.settle();
  const idx2 = items[1].correct;
  const texts = choicesOf(d, 5).map((b) => b.dataset.t5Mc);
  choicesOf(d, 5)[texts.indexOf(String(idx2))].click();
  await p.settle();
  assert.equal(w.U4Guess.record().tier["t5:t5_2"], "assisted", "one miss is assisted");
  assert.equal(w.U4Studio.totalStars(), 2, "an assisted answer earns the star");
  p.close();

  // a typed answer: two misses guess it (Tab 2, a number box)
  const t = await loadU4Page("percent-practice-studio");
  t.d.getElementById("tab-2").click();
  await t.settle();
  const box = t.d.getElementById("t2-inp-pct");
  for (let i = 0; i < 2; i++) {
    box.value = String(900 + i);
    t.d.getElementById("t2-check-btn").click();
    await t.settle();
    const chip = onPanel(t.d, 2).querySelector(".hold-chip");
    if (chip) chip.click();
    await t.settle();
  }
  assert.equal(t.w.U4Guess.record().miss["2:0"], 2, "two typed misses are counted");
  const stars = t.w.U4Studio.totalStars();
  // Complete the whole typed response using the values shown by the active model.
  const model = onPanel(t.d, 2).querySelector(".scaling-visual-card");
  const part = Number(model.querySelector(".big-fraction .num").textContent);
  const whole = Number(model.querySelector(".big-fraction .den").textContent);
  const scale = 100 / whole;
  t.d.getElementById("t2-inp-factor").value = String(scale);
  t.d.getElementById("t2-inp-num").value = String(part * scale);
  t.d.getElementById("t2-inp-pct").value = String(part * scale);
  t.d.getElementById("t2-check-btn").click();
  await t.settle();
  assert.equal(t.w.U4Guess.record().tier["t2:t2_1"], "guessed", "two typed misses make a guess");
  assert.equal(t.w.U4Studio.totalStars(), stars, "a guessed typed answer earns no star");
  t.close();

  // empty boxes are not an attempt
  const e = await loadU4Page("percent-practice-studio");
  e.d.getElementById("tab-2").click();
  await e.settle();
  e.d.getElementById("t2-check-btn").click();
  await e.settle();
  assert.equal(e.w.U4Guess.record().miss["2:0"], undefined, "an empty Check is not a miss");
  e.close();

  // a teacher support link allows one more try before Look closer
  const s = await loadU4Page("percent-practice-studio", { support: true });
  assert.equal(s.w.StudioAttempts.LOOK_AT, 3);
  s.close();
}

/* ---- the saved choice (`<id>_choice`) is not an answer ---------------------------------------------- */
{
  const page = "4-4-practice-studio";
  const p = await loadU4Page(page);
  const { w, d } = p;
  d.getElementById("tab-3").click();
  await p.settle();
  const first = onPanel(d, 3).querySelector(".stage-card .choice-btn:not(.correct)");
  if (first) {
    first.click();
    await p.settle();
  }
  assert.equal(w.U4Studio.totalStars(), 0, "a wrong click on a saved-choice section earns no star");
  p.close();
}

console.log(
  `unit4-guess: ${twins} fresh problems re-derived from their text and ${diagnosed} wrong answers diagnosed without printing the answer; ${U4_PAGES.length} pages: clicking through (${clicked} clicks) earns no star, the pause and reshuffle hold, the miss survives a reload, ${proofs} fresh problems turn a guess into a star, and a release flags the teacher`,
);
