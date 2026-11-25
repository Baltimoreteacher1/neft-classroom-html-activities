// Per-kind Play solvers for the 14 unit activity kinds of the Language Studio.
// A solver drives the REAL page with real clicks and typing, using only the authored payload as the answer source,
// and returns the star count the kind's own scoring rules require. `mode` is "clean" (no mistakes) or "stumble"
// (exactly one deliberate mistake first, where the kind scores mistakes). The expected stars are re-derived here
// from the kind's documented rules, so a scoring regression shows up as expected != shown.
//   solve(page, activity, mode) -> { expect: 1|2|3|null, note?: string }

export const KINDS = [
  "word_sort",
  "match",
  "cloze",
  "unscramble",
  "dictogloss",
  "info_gap",
  "error_analysis",
  "sentence_combine",
  "quiz",
  "talk_cards",
  "write_scaffold",
  "sequence",
  "clue_game",
  "read_annotate",
];

const starsOf = (misses, total) => {
  const r = total > 0 ? misses / total : 0;
  return r <= 0.2 ? 3 : r <= 0.55 ? 2 : 1;
};
const starsFor = (mistakes, total) =>
  mistakes === 0 ? 3 : mistakes <= Math.max(1, Math.ceil(total / 3)) ? 2 : 1;
const key = (k) => `[data-key="${k}"]`;
const click = (page, sel) => page.click(sel, { timeout: 6000 });

// ---------- sorting and matching ----------
async function wordSort(page, { payload: p }, mode) {
  const n = p.items.length;
  let misses = 0;
  if (mode === "stumble" && p.categories.length > 1) {
    const wrong = (p.items[0].cat + 1) % p.categories.length;
    await click(page, key("w0"));
    await click(page, `.sg-bucket[data-cat="${wrong}"] .sg-bucket__btn`);
    misses = 1;
  }
  for (let i = 0; i < n; i++) {
    await click(page, key(`w${i}`));
    await click(page, `.sg-bucket[data-cat="${p.items[i].cat}"] .sg-bucket__btn`);
  }
  return { expect: starsOf(misses, n) };
}

async function match(page, { payload: p }, mode) {
  const n = p.pairs.length;
  let misses = 0;
  if (mode === "stumble" && n > 1) {
    await click(page, key("l0"));
    await click(page, key("r1"));
    misses = 1;
  }
  for (let i = 0; i < n; i++) {
    await click(page, key(`l${i}`));
    await click(page, key(`r${i}`));
  }
  return { expect: starsOf(misses, n) };
}

async function cloze(page, { payload: p }, mode) {
  const n = p.answers.length;
  const used = new Set();
  const chipFor = (word) => {
    const i = p.bank.findIndex((w, k) => w === word && !used.has(k));
    used.add(i);
    return i;
  };
  let misses = 0;
  let order = p.answers.map((a, i) => [i, a]);
  if (mode === "stumble") {
    const spare = p.bank.find((w) => !p.answers.includes(w));
    if (spare !== undefined) {
      order = order.map(([i, a]) => [i, i === 0 ? spare : a]);
      misses = 1;
    } else if (n > 1 && p.answers[0] !== p.answers[1]) {
      order = order.map(([i, a]) => [i, i === 0 ? p.answers[1] : i === 1 ? p.answers[0] : a]);
      misses = 2;
    }
  }
  const place = async (pairs) => {
    for (const [i, word] of pairs) {
      const idx = chipFor(word);
      await click(page, key(`c${idx}`));
      await click(page, key(`blank${i}`));
    }
  };
  await place(order);
  await click(page, key("check"));
  if (misses) {
    used.clear();
    // Locked (correct) gaps keep their word; refill only the flagged gap(s).
    const rewrite = order.filter(([i, a]) => a !== p.answers[i]).map(([i]) => [i, p.answers[i]]);
    for (const [, w] of order.filter(([i, a]) => a === p.answers[i])) chipFor(w);
    await place(rewrite);
    await click(page, key("check"));
  }
  await click(page, key("finish"));
  return { expect: starsOf(misses, n) };
}

// ---------- ordering ----------
async function unscramble(page, { payload: p }, mode, level) {
  const anchored = level === "l1_2";
  let first = 0;
  for (let it = 0; it < p.items.length; it++) {
    const n = p.items[it].parts.length;
    const lo = anchored ? 1 : 0;
    const swapOk =
      mode === "stumble" &&
      it === 0 &&
      n - lo >= 2 &&
      p.items[it].parts[lo] !== p.items[it].parts[lo + 1];
    const order = [];
    for (let k = lo; k < n; k++) order.push(k);
    if (swapOk) [order[0], order[1]] = [order[1], order[0]];
    for (const k of order) await click(page, key(`p${k}`));
    await click(page, key("check"));
    if (swapOk) {
      await click(page, key("reset"));
      for (let k = lo; k < n; k++) await click(page, key(`p${k}`));
      await click(page, key("check"));
    } else first++;
    await click(page, key("next"));
  }
  return { expect: first >= Math.ceil(p.items.length * 0.75) ? 3 : 2 };
}

async function sequence(page, { payload: p }, mode) {
  let misses = 0;
  const posOf = (s) =>
    page.$eval(`${key(`up${s}`)}, ${key(`down${s}`)}`, (b) => Number(b.closest("li").dataset.pos));
  if (mode === "stumble") {
    await click(page, key("check"));
    misses = 1;
  }
  for (let s = 0; s < p.steps.length; s++) {
    for (let guard = 0; guard < 30; guard++) {
      const pos = await posOf(s);
      if (pos <= s) break;
      await click(page, key(`up${s}`));
    }
  }
  await click(page, key("check"));
  const need = Math.min(p.steps.length, p.signals.length);
  for (let k = 0; k < need; k++) {
    await click(page, key(`sg${k}`));
    await click(page, key(`slot${k}`));
  }
  await click(page, key("check"));
  await click(page, key("finish"));
  return { expect: starsOf(misses, 6) };
}

// ---------- choice ----------
async function choice(page, payload, mode, itemSel) {
  const items = payload.items;
  const textOf = (it) => it.q ?? it.wrong;
  let stumbled = false;
  let missed = 0;
  for (let guard = 0; guard < items.length * 2 + 4; guard++) {
    const shown = await page.$eval(itemSel, (e) => e.textContent.trim()).catch(() => null);
    if (shown === null) break;
    const item = items.find((it) => textOf(it) === shown);
    if (!item) throw new Error(`prompt not in payload: ${shown.slice(0, 50)}`);
    const optTexts = await page.$$eval(".sg-option__text", (els) => els.map((e) => e.textContent));
    if (mode === "stumble" && !stumbled) {
      const bad = optTexts.findIndex(
        (t, k) => k !== item.answer && t !== item.options[item.answer],
      );
      if (bad >= 0) {
        await click(page, key(`o${bad}`));
        stumbled = true;
        missed = 1;
      }
    }
    const good = optTexts.findIndex((t) => t === item.options[item.answer]);
    await click(page, key(`o${good}`));
    await click(page, key("next"));
    if (await page.$(".st-win")) break;
  }
  return { expect: starsOf(missed, items.length) };
}
const quiz = (page, a, mode) => choice(page, a.payload, mode, ".sg-q__text");
const errorAnalysis = (page, a, mode) => choice(page, a.payload, mode, ".sg-wrong__text");

async function clueGame(page, { payload: p }, mode) {
  const n = p.cards.length;
  let total = 0;
  for (let c = 0; c < n; c++) {
    // Several cards can open with the same clue ("I have 4 sides."), so reveal more until one card fits every open clue.
    let shown = 1;
    let candidates = p.cards;
    for (;;) {
      const open = await page.$$eval(".sg-clue.is-open .sg-clue__text", (els) =>
        els.map((e) => e.textContent),
      );
      candidates = p.cards.filter((x) => open.every((t, k) => x.clues[k] === t));
      if (candidates.length <= 1 || shown >= 3) break;
      await click(page, key("more"));
      shown++;
    }
    const card = candidates[0];
    if (!card) throw new Error("open clues match no card in the payload");
    if (candidates.length > 1) throw new Error(`${candidates.length} cards share all three clues`);
    if (mode === "stumble" && c === 0 && shown < 3) {
      const bad = p.cards.find((x) => x.term !== card.term)?.term;
      if (bad) {
        await click(page, key(`t-${bad}`));
        shown++;
      }
    }
    await click(page, key(`t-${card.term}`));
    total += 4 - shown;
    await click(page, key("next"));
  }
  const max = n * 3;
  return { expect: total >= max * 0.7 ? 3 : total >= max * 0.45 ? 2 : 1 };
}

// ---------- typing ----------
async function sentenceCombine(page, { payload: p }, mode) {
  let first = 0;
  for (let it = 0; it < p.items.length; it++) {
    const area = `#ss-area-${it}`;
    let stumbled = false;
    if (mode === "stumble" && it === 0) {
      await page.fill(area, "Short no.");
      await click(page, "button.st-btn--primary:has-text('Check my sentence')");
      stumbled = true;
    }
    await page.fill(area, p.items[it].model);
    await click(page, "button.st-btn--primary:has-text('Check my sentence')");
    if (!stumbled) first++;
    await click(
      page,
      "button.st-btn--primary:has-text('sentence'), button.st-btn--primary:has-text('See my')",
    );
  }
  const used = 0;
  return { expect: used ? 1 : first >= Math.ceil(p.items.length * 0.75) ? 3 : 2 };
}

async function writeScaffold(page, { payload: p }, mode) {
  const bank = p.word_bank.join(" ");
  for (let i = 0; i < p.structure.length; i++) {
    const text = `${p.structure[i].frame.replace(/_{2,}/g, "the thing")} ${bank}`;
    await page.fill(`#ws-${i}`, text);
  }
  const boxes = await page.$$(".ws-check input[type=checkbox]");
  const tick = mode === "stumble" ? Math.floor(boxes.length / 2) : boxes.length;
  for (let i = 0; i < tick; i++) await boxes[i].check();
  await click(page, 'button:has-text("I\'m done")');
  const ratio = tick / p.checklist.length;
  return { expect: ratio === 1 ? 3 : ratio >= 0.5 ? 2 : 1 };
}

async function infoGap(page, { payload: p }, mode) {
  const sides = [p.a, p.b];
  const other = [p.b, p.a];
  const check = "button:has-text('Check our answers')";
  let checks = 0;
  if (mode === "stumble") {
    await click(page, check);
    checks++;
  }
  for (const [idx, side] of sides.entries()) {
    for (const [i, need] of side.needs.entries()) {
      const truth = other[idx].has.find((f) => f.k === need)?.v;
      if (truth === undefined) throw new Error(`need "${need}" has no partner fact`);
      await page.fill(`#ig-${idx}-${i}`, truth);
    }
  }
  await click(page, check);
  checks++;
  return { expect: starsFor(checks - 1, 2) };
}

// Plays the passage when the browser can speak, else uses the "I listened" fallback.
async function listen(page) {
  const heard = await page.$("button:has-text('I listened')");
  if (heard) return heard.click();
  await click(page, ".ow-listen button");
  await page.waitForSelector("button:has-text('Next: Jot key words'):not([disabled])", {
    timeout: 12000,
  });
}

async function dictogloss(page, { payload: p }, mode) {
  const next = (label) => click(page, `button:has-text("${label}")`);
  await listen(page);
  await next("Next: Jot key words");
  for (const w of await page.$$(".ow-chips .st-chip")) await w.click();
  await page.fill("textarea[aria-label='My notes']", p.key_words.join(" "));
  await next("Next: Rebuild the story");
  await page.fill(
    "textarea[aria-label='My retelling']",
    `${p.frame.replace(/_{2,}/g, "it")} ${p.key_words.join(" ")} and more words here.`,
  );
  await next("Next: Check my ideas");
  const boxes = await page.$$(".ow-checks input[type=checkbox]");
  const tick = mode === "stumble" ? Math.floor(boxes.length / 2) : boxes.length;
  for (let i = 0; i < tick; i++) await boxes[i].check();
  await click(page, 'button:has-text("I\'m done")');
  const ratio = tick / p.checks.length;
  return { expect: ratio === 1 ? 3 : ratio >= 0.5 ? 2 : 1 };
}

async function talkCards(page, { payload: p }, mode) {
  const total = p.cards.length;
  const draws = mode === "stumble" ? Math.min(3, total) : total;
  for (let i = 0; i < draws; i++)
    await click(page, "button:has-text('Draw a card'), button:has-text('Next card')");
  await click(page, 'button:has-text("We\'re done")');
  return { expect: draws >= total ? 3 : draws >= Math.ceil(total * 0.6) ? 2 : 1 };
}

const clean = (w) => w.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
function findRanges(words, phrase) {
  const want = phrase.split(/\s+/).map(clean).filter(Boolean);
  const out = [];
  for (let i = 0; i + want.length <= words.length; i++)
    if (want.every((w, k) => clean(words[i + k]) === w)) out.push([i, i + want.length]);
  return out;
}

async function readAnnotate(page, { payload: p }, mode) {
  const words = p.text.split(/\s+/).filter(Boolean);
  const marks = p.marks.slice(0, 4);
  const marksBtn = await page.$$(".ra-mark");
  for (const [k, m] of marks.entries()) {
    await marksBtn[k].click();
    const seen = new Set();
    for (const t of m.targets)
      for (const [a, b] of findRanges(words, t))
        for (let i = a; i < b; i++)
          if (!seen.has(i)) {
            seen.add(i);
            await click(page, `.ra-w[data-i="${i}"]`);
          }
  }
  await click(page, "button:has-text('Check my marks')");
  const report = await page.$$eval(".ra-result .st-feedback", (els) =>
    els.map((e) => e.textContent),
  );
  let mistakes = 0;
  for (const [qi, q] of p.questions.entries()) {
    const good = q.options[q.answer];
    if (mode === "stumble" && qi === 0) {
      const bad = q.options.find((o) => o !== good);
      if (bad !== undefined) {
        await page.click(`.ra-opt:text-is(${JSON.stringify(bad)})`, { timeout: 6000 });
        mistakes++;
      }
    }
    await page.click(`.ra-opt:text-is(${JSON.stringify(good)})`, { timeout: 6000 });
    await click(page, ".ra-q button.st-btn--primary:not([hidden])");
  }
  const checks = 1;
  const stars = mistakes === 0 && checks <= 2 ? 3 : mistakes <= 2 && checks <= 4 ? 2 : 1;
  return { expect: stars, note: report.join(" | ") };
}

export const SOLVERS = {
  word_sort: wordSort,
  match,
  cloze,
  unscramble,
  dictogloss,
  info_gap: infoGap,
  error_analysis: errorAnalysis,
  sentence_combine: sentenceCombine,
  quiz,
  talk_cards: talkCards,
  write_scaffold: writeScaffold,
  sequence,
  clue_game: clueGame,
  read_annotate: readAnnotate,
};

// ---------- resume probes: a first action, then the page is reloaded and the state must come back ----------
// Returns a function (page) -> Promise<boolean> that asserts the state after reload, or null when the kind saves nothing.
export const RESUME = {
  async dictogloss(page) {
    await listen(page);
    await click(page, "button:has-text('Next: Jot key words')");
    await page.fill("textarea[aria-label='My notes']", "resume-probe-notes");
    await page.reload();
    await page.waitForSelector("textarea[aria-label='My notes']", { state: "attached" });
    return page.$eval("textarea[aria-label='My notes']", (t) => t.value === "resume-probe-notes");
  },
  async info_gap(page) {
    await page.fill("#ig-0-0", "resume-probe");
    await page.reload();
    await page.waitForSelector("#ig-0-0");
    return page.$eval("#ig-0-0", (t) => t.value === "resume-probe");
  },
  async write_scaffold(page) {
    await page.fill("#ws-0", "resume probe text");
    await page.reload();
    await page.waitForSelector("#ws-0");
    return page.$eval("#ws-0", (t) => t.value === "resume probe text");
  },
  async sentence_combine(page) {
    await page.fill("#ss-area-0", "resume probe sentence here");
    await page.reload();
    await page.waitForSelector("#ss-area-0");
    return page.$eval("#ss-area-0", (t) => t.value === "resume probe sentence here");
  },
  async unscramble(page, _activity, level) {
    const lo = level === "l1_2" ? 1 : 0;
    await click(page, key(`p${lo}`));
    await page.reload();
    await page.waitForSelector(".ss-strip");
    return page.$(`.ss-strip ${key(`s${lo}`)}`).then(Boolean);
  },
  async read_annotate(page) {
    await click(page, '.ra-w[data-i="0"]');
    await page.reload();
    await page.waitForSelector(".ra-w");
    return page.$eval('.ra-w[data-i="0"]', (b) => b.classList.contains("m0"));
  },
};
