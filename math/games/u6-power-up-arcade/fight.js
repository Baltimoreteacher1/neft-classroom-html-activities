// Power Up! one battle against Mr. Neft Monster. A battle is one or more problems.
// Step mode: tap the operation that comes next, then answer it. Full mode: type the final answer;
// after two misses the student may break it into steps for half points. A miss never shows the answer.

import {
  allowedOps,
  apply,
  GLYPH,
  nextRank,
  operandsAt,
  RANK,
  reduceAt,
  solve,
  toText,
} from "./expr.js";
import { HYPE, pickOf, TAUNTS } from "./battle.js";
import { sup } from "./bonus.js";
import { burst, centerOf, confetti, sfx } from "./fx.js";
import { $, banner, coach, el, floater, fmt, replay, wait } from "./ui.js";

const OP_NAMES = {
  "+": "plus",
  "-": "minus",
  "*": "times",
  "/": "divided by",
  "^": "to the power",
};
export const HERO_MAX = 5;

let S = null; // the world run, owned by game.js
let cur = null; // the problem in play
let finish = null; // resolves the current problem

export function mult() {
  return Math.min(5, 1 + Math.floor(S.combo / 2));
}

export function hud() {
  $("score").textContent = fmt(S.score);
  $("worldTag").textContent = `WORLD ${S.world + 1}`;
  $("stageNo").textContent = `${S.battle + 1}/5`;
  $("combo").textContent = `×${mult()}${S.power ? " ⚡" : ""}`;
  $("starTotal").textContent = S.stars;
  $("spotN").textContent = S.spot;
  $("shieldN").textContent = S.shield;
  const spot = $("btnSpot");
  spot.disabled = S.spot < 1;
  spot.classList.toggle("ready", S.spot > 0);
  spot.setAttribute("aria-label", `Spotlight: show the next step. ${S.spot} left`);
  $("shield").setAttribute("aria-label", `Shields: ${S.shield}`);
  $("main").classList.toggle("power", S.power > 0);
  $("heroHpFill").style.width = `${(S.heroHp / HERO_MAX) * 100}%`;
  $("heroHp").setAttribute("aria-label", `Your health: ${S.heroHp} of ${HERO_MAX}`);
}

// ── expression board ─────────────────────────────────────────────────────────
function opLabel(t, i) {
  const { a, o, b } = operandsAt(t, i);
  return o === "^" ? `${a} to the power ${b}` : `${a} ${OP_NAMES[o]} ${b}`;
}

/** A tappable token in step mode; a plain span when the student is typing a full answer. */
function tok(cls, i, text) {
  const node = cur.stepping ? el("button", cls, text) : el("span", cls, text);
  if (cur.stepping) node.type = "button";
  node.dataset.i = i;
  return node;
}

function renderExpr(selected = [], freshIdx = -1) {
  const t = cur.tokens;
  const box = $("expr");
  box.replaceChildren();
  box.setAttribute("aria-label", `Expression: ${toText(t)}`);
  const sel = (from, to) => selected.some((s) => s >= from && s <= to);
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const x = t[i];
    if (x.k === "(" || x.k === ")") {
      if (x.k === "(") depth++;
      box.append(el("span", `tok par d${Math.min(3, depth)}`, x.k));
      if (x.k === ")") depth--;
    } else if (x.k === "n" && t[i + 1]?.v === "^") {
      const b = tok("tok pow", i + 1);
      b.setAttribute("aria-label", `Exponent: ${opLabel(t, i + 1)}`);
      b.append(document.createTextNode(fmt(x.v)), el("sup", "", fmt(t[i + 2].v)));
      b.classList.toggle("sel", sel(i, i + 2));
      box.append(b);
      i += 2;
    } else if (x.k === "o" && x.v === "^") {
      const b = tok("tok exp", i);
      b.setAttribute("aria-label", `Exponent ${t[i + 1].v}, on the group before it`);
      b.append(el("sup", "", fmt(t[i + 1].v)));
      box.append(b);
      i += 1;
    } else if (x.k === "o") {
      const b = tok("tok op", i, GLYPH[x.v]);
      const plain = t[i - 1].k === "n" && t[i + 1].k === "n";
      b.setAttribute("aria-label", plain ? `Step: ${opLabel(t, i)}` : `${OP_NAMES[x.v]} step`);
      b.classList.toggle("sel", sel(i, i));
      box.append(b);
    } else {
      const n = el("span", "tok num", fmt(x.v));
      n.classList.toggle("sel", sel(i, i));
      n.classList.toggle("fresh", i === freshIdx);
      box.append(n);
    }
  }
}

function clearLadder() {
  for (const li of document.querySelectorAll(".ladder li")) li.classList.remove("glow");
  for (const b of $("expr").querySelectorAll(".spot")) b.classList.remove("spot");
}

function focusFirstOp() {
  $("expr").querySelector("button")?.focus();
}

function setFoeHp() {
  const n = cur.of;
  const inProblem = cur.total ? cur.done / cur.total : 0;
  const left = (n - cur.index - Math.min(1, inProblem)) / n;
  $("hpFill").style.width = `${Math.max(0, Math.round(left * 100))}%`;
}

// ── mistakes ─────────────────────────────────────────────────────────────────
/** A mistake: Mr. Neft hits back unless a shield blocks it. Returns true when it landed. */
function takeHit() {
  if (S.shield > 0) {
    S.shield--;
    sfx("power");
    hud();
    return false;
  }
  S.combo = 0;
  S.streak = 0;
  S.power = 0;
  S.battleMistakes++;
  cur.wrongHere = true;
  S.heroHp--;
  replay($("heroArt"), "hit");
  sfx("hit");
  if (S.heroHp <= 0) {
    S.heroHp = HERO_MAX;
    setTimeout(
      () => coach("💪 Knocked down, but heroes get back up! Health refilled.", "good"),
      1400,
    );
  }
  hud();
  return true;
}

const taunt = () => pickOf(TAUNTS, S.battleMistakes + cur.index);

// ── step mode ────────────────────────────────────────────────────────────────
function onOpTap(i) {
  if (!cur?.stepping || !$("pad").hidden || !$("banner").hidden) return;
  if (allowedOps(cur.tokens).includes(i)) return askStep(i);
  cur.opMiss++;
  sfx("oops");
  const landed = takeHit();
  replay($("expr"), "shake");
  const t = cur.tokens;
  const rank = nextRank(t);
  let msg;
  if (rank !== "paren" && RANK[t[i].v] === rank)
    msg = "Same level, so go left to right. Look for the one furthest left.";
  else if (cur.opMiss < 2) msg = "Not yet! Something higher on the Order Ladder goes first.";
  else if (rank === "paren") msg = "Parentheses first. Work inside the innermost ( ).";
  else if (rank === 3) msg = "Next up: exponents. Find the small raised number.";
  else if (rank === 2) msg = "Next up: multiply and divide, left to right.";
  else msg = "Next up: add and subtract, left to right.";
  if (cur.opMiss >= 2 && rank != null) {
    clearLadder();
    document.querySelector(`.ladder li[data-rung="${rank}"]`)?.classList.add("glow");
  }
  coach(landed ? `${taunt()} ${msg}` : `🛡️ Shield blocked it! ${msg}`, "bad");
}

function askStep(i) {
  const { a, o, b } = operandsAt(cur.tokens, i);
  cur.askAt = i;
  cur.valMiss = 0;
  renderExpr([i - 1, i, i + 1]);
  $("padQ").textContent =
    o === "^" ? `${fmt(a)}${sup(b)} = ?` : `${fmt(a)} ${GLYPH[o]} ${fmt(b)} = ?`;
  openPad(true);
  sfx("pick");
  coach(o === "^" ? "Work out the power, then press ZAP." : "Work it out and press ZAP.");
}

function openPad(stepping) {
  $("padIn").value = "";
  $("padBack").hidden = !stepping;
  $("padBreak").hidden = stepping || cur.misses < 2;
  $("pad").hidden = false;
  $("padIn").focus();
}

export function closePad() {
  if (!cur?.stepping) return;
  $("pad").hidden = true;
  cur.askAt = -1;
  renderExpr();
  focusFirstOp();
}

function wrongStep(a, o, b) {
  cur.valMiss++;
  sfx("oops");
  replay($("padIn"), "bad");
  const landed = takeHit();
  let msg = "Not quite. Try again.";
  if (cur.valMiss >= 2 && o === "^")
    msg = `${a}${sup(b)} means use ${a} as a factor ${b} times. It is not ${a} × ${b}.`;
  if (cur.valMiss >= 4) {
    cur.helped = true;
    if (o === "^") msg = `Multiply it out: ${Array(b).fill(a).join(" × ")}`;
    else if (o === "*") msg = `Think of ${b} groups of ${a}, or add ${a} again and again.`;
    else if (o === "/") msg = `How many groups of ${b} fit in ${a}? Count up by ${b}.`;
    else msg = `Try counting ${o === "+" ? "up" : "back"} from ${a} in small jumps.`;
  }
  coach(landed ? `${taunt()} ${msg}` : `🛡️ Shield blocked it! ${msg}`, "bad");
  $("padIn").select();
}

function stepRight(i, v, o) {
  const clean = !cur.wrongHere && cur.opMiss === 0 && cur.valMiss === 0 && !cur.helped;
  const half = cur.broken;
  cur.opMiss = 0;
  cur.valMiss = 0;
  cur.helped = false;
  cur.wrongHere = false;
  const pts = award(clean, half ? 50 : 100);
  const target = $("expr").querySelector(".sel") || $("expr");
  strike(target, pts, o === "^");
  cur.tokens = reduceAt(cur.tokens, i, v);
  cur.done++;
  cur.askAt = -1;
  $("pad").hidden = true;
  clearLadder();
  renderExpr([], i - 1);
  setFoeHp();
  hud();
  if (cur.tokens.some((x) => x.k === "o")) {
    if (!S.lastNote)
      coach(clean ? pickOf(HYPE, S.clean + cur.done) : "Got it. Keep going.", "good");
    focusFirstOp();
  } else solved();
}

// ── full mode ────────────────────────────────────────────────────────────────
/** The answer a student gets by reading 3⁴ as 3 × 4: used only to aim the hint, never shown. */
function powerAsTimes(tokens) {
  const swapped = tokens.map((x) => (x.v === "^" ? { k: "o", v: "*" } : x));
  const r = solve(swapped, 1e9);
  return r.ok ? r.final : null;
}

function wrongFull(v) {
  cur.misses++;
  sfx("oops");
  replay($("padIn"), "bad");
  replay($("expr"), "shake");
  const landed = takeHit();
  let msg;
  if (v === powerAsTimes(cur.tokens))
    msg = "An exponent got multiplied. 3⁴ means 3 × 3 × 3 × 3, not 3 × 4.";
  else if (cur.misses === 1)
    msg = "Check the Order Ladder from the top: ( ), then exponents, then × ÷, then + −.";
  else msg = "Still not it. Try again, or tap 🆘 Break it down to go one step at a time.";
  coach(landed ? `${taunt()} ${msg}` : `🛡️ Shield blocked it! ${msg}`, "bad");
  $("padBreak").hidden = cur.misses < 2;
  $("padIn").select();
}

function fullRight() {
  const clean = cur.misses === 0 && !cur.helped;
  if (clean) S.fullClean++;
  const pts = award(clean, 150 * cur.total);
  strike($("expr"), pts, true);
  cur.done = cur.total;
  $("pad").hidden = true;
  setFoeHp();
  hud();
  solved();
}

export function breakDown() {
  if (!cur || cur.stepping) return;
  cur.stepping = true;
  cur.broken = true;
  S.breakdowns++;
  $("pad").hidden = true;
  $("modeTag").textContent = "🆘 BREAK IT DOWN · one step at a time (half points)";
  renderExpr();
  coach("Tap the operation that comes first.");
  focusFirstOp();
}

// ── scoring and effects ──────────────────────────────────────────────────────
function award(clean, base) {
  if (clean) {
    S.combo++;
    S.streak++;
    S.clean++;
  }
  S.bestCombo = Math.max(S.bestCombo, S.combo);
  const pts = (clean ? base : Math.round(base / 2)) * (clean ? mult() : 1) * (S.power > 0 ? 2 : 1);
  S.score += pts;
  if (S.power > 0) S.power--;
  S.lastNote = "";
  if (S.combo === 5 && S.power === 0) {
    S.power = 3;
    S.lastNote = "⚡ POWER MODE! Your next 3 hits score double.";
  } else if (clean && S.streak % 4 === 0 && S.spot < 3) {
    S.spot++;
    S.lastNote = "🔦 Spotlight earned! Use it any time to see what is next.";
  }
  if (S.lastNote) coach(S.lastNote, "good");
  if (S.combo > 1) sfx("combo", Math.min(S.combo, 6));
  return pts;
}

function strike(target, pts, big) {
  const at = centerOf(target);
  floater(`+${fmt(pts)}`, target);
  burst(at.x, at.y, { n: big ? 40 : 24, star: big, speed: big ? 7 : 5 });
  sfx(big ? "power" : "zap");
  replay($("monster"), "hit");
}

export function useSpot() {
  if (!cur || S.spot < 1 || !$("banner").hidden) return;
  if (cur.stepping && !$("pad").hidden) return;
  S.spot--;
  cur.helped = true;
  clearLadder();
  const ids = allowedOps(cur.tokens);
  for (const i of cur.stepping ? ids : ids.slice(0, 1))
    $("expr").querySelector(`[data-i="${i}"]`)?.classList.add("spot");
  sfx("power");
  coach(
    cur.stepping ? "🔦 The glowing steps can go next." : "🔦 Start with the glowing step.",
    "good",
  );
  hud();
}

// ── a problem and a battle ───────────────────────────────────────────────────
function solved() {
  const resolve = finish;
  finish = null;
  if (cur.mode === "full" || cur.broken) S.trail = cur.steps;
  resolve();
}

function playProblem(e, index, of, mode) {
  cur = {
    tokens: e.tokens,
    steps: e.steps,
    total: e.steps.length,
    done: 0,
    index,
    of,
    mode,
    stepping: mode === "steps",
    broken: false,
    askAt: -1,
    opMiss: 0,
    valMiss: 0,
    misses: 0,
    helped: false,
    wrongHere: false,
  };
  $("roundTag").textContent = of > 1 ? `Problem ${index + 1} of ${of}` : "";
  $("modeTag").textContent =
    mode === "steps"
      ? "WARM-UP · tap the step that comes next"
      : "FULL PROBLEM · work it out, type the final answer";
  clearLadder();
  renderExpr();
  setFoeHp();
  if (cur.stepping) {
    $("pad").hidden = true;
    coach("Tap the operation that comes first.");
    focusFirstOp();
  } else {
    $("padQ").textContent = "Final answer = ?";
    openPad(false);
    coach("Work it out on paper, step by step. Then type the final answer.");
  }
  return new Promise((resolve) => {
    finish = resolve;
  });
}

export function submit() {
  if (!cur || $("pad").hidden) return;
  const raw = $("padIn").value.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(raw)) return coach("Type a whole number, then press ZAP.", "bad");
  const v = Number(raw);
  if (!cur.stepping) return v === cur.steps.at(-1).v ? fullRight() : wrongFull(v);
  const i = cur.askAt;
  if (i < 0) return;
  const { a, o, b } = operandsAt(cur.tokens, i);
  if (v !== apply(o, a, b)) return wrongStep(a, o, b);
  stepRight(i, v, o);
}

export function tapToken(i) {
  onOpTap(i);
}

/** Play one battle; resolves with its stars. */
export async function playBattle(run, problems, mode, boss, form, monsterSvg) {
  S = run;
  S.battleMistakes = 0;
  S.heroHp = HERO_MAX;
  const m = $("monster");
  m.className = `monster${boss ? " boss" : ""}`;
  m.innerHTML = monsterSvg;
  $("foeForm").textContent = form;
  $("hpFill").style.width = "100%";
  $("pad").hidden = true;
  cur = {
    tokens: problems[0].tokens,
    stepping: false,
    total: 0,
    done: 0,
    index: 0,
    of: problems.length,
  };
  renderExpr();
  hud();
  sfx(boss ? "boss" : "start");
  await banner(
    boss ? (S.world === 2 ? "FINAL BOSS!" : "WORLD BOSS!") : `BATTLE ${S.battle + 1}`,
    `Mr. Neft Monster appears in ${form.replace(/^.*· /, "")}! ${problems.length > 1 ? `Solve ${problems.length} problems to beat him.` : "Solve the problem to beat him."}`,
    "FIGHT ▶",
  );
  for (const [k, e] of problems.entries()) {
    S.trail = null;
    await playProblem(e, k, problems.length, mode);
    if (k < problems.length - 1) {
      coach(`${pickOf(HYPE, S.score)} Answer: ${fmt(e.answer)}. Next problem!`, "good");
      await wait(1100);
    }
  }
  return battleWon(boss, problems.at(-1));
}

async function battleWon(boss, last) {
  const stars = S.battleMistakes === 0 ? 3 : S.battleMistakes <= 2 ? 2 : 1;
  S.stars += stars;
  S.battleStars.push(stars);
  if (boss && stars === 3) S.bossPerfect = true;
  const bonus = 300 * stars * (boss ? 2 : 1);
  S.score += bonus;
  let note = "";
  if (stars === 3 && S.shield < 2) {
    S.shield++;
    note = " 🛡️ Shield earned!";
  }
  const mon = $("monster");
  mon.classList.add("dead");
  const at = centerOf(mon);
  burst(at.x, at.y, { n: 70, speed: 8, star: true });
  confetti(boss ? 140 : 50);
  sfx("win");
  hud();
  await wait(650);
  const trail = S.trail
    ? S.trail.map((s) =>
        s.o === "^"
          ? `${s.a}${sup(s.b)} = ${fmt(s.v)}`
          : `${fmt(s.a)} ${GLYPH[s.o]} ${fmt(s.b)} = ${fmt(s.v)}`,
      )
    : [];
  await banner(
    "★".repeat(stars) + "☆".repeat(3 - stars),
    `${boss ? "Boss defeated!" : "Mr. Neft Monster is down!"} Answer: ${fmt(last.answer)}. +${fmt(bonus)} bonus.${note}`,
    "NEXT ▶",
    trail,
  );
  return stars;
}
