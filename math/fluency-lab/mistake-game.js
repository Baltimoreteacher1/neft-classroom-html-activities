// Spot the Mistake: a worked solution has one wrong step, or a classmate's answer may be wrong. The learner finds
// the error by checking the math, then types the correct result. Nothing is revealed until they have found it.
import { ALL_STOPS, gameProblem, shuffle } from "./game-pool.js";
import { validateAnswer } from "./problem-bank.js";
import { t } from "./i18n.js";
import { canSpeak, speak, syncLive } from "./speech.js";
import { mathText } from "./trail-pictures.js";
import { describeAsk, workRounds } from "./mistake-bank.js";
import { slipInfo } from "./mistake-notes.js";

const STEP = /^([\d.,]+) ([+−×÷]) ([\d.,]+) = ([\d.,]+)\.?$/;
const num = (text) => Number(String(text).replaceAll(",", ""));
const same = (x, y) => Math.abs(x - y) < 1e-6;
const compute = (a, op, b) => (op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b);
const pretty = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });
const ROUNDS = 5;
const mistakeStars = (wrong) => (wrong <= 2 ? 3 : wrong <= 5 ? 2 : 1);
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// A believable slip: off by one, off by ten, or off by one of the factors.
function slip(truth, a, b, rng = Math.random) {
  const options = [1, -1, 10, -10, a, -a, b, -b].filter((d) => d !== 0 && Number.isFinite(truth + d) && (truth < 0 || truth + d >= 0));
  return truth + options[Math.floor(rng() * options.length)];
}

export function buildRound(grade, stop) {
  for (let tries = 0; tries < 300; tries += 1) {
    const item = gameProblem(grade, stop);
    const parsed = item.steps.map((text) => text.match(STEP));
    const checkable = parsed.map((m, i) => (m && same(compute(num(m[1]), m[2], num(m[3])), num(m[4])) ? i : -1)).filter((i) => i >= 0);
    if (item.steps.length >= 3 && checkable.length >= 2) {
      const bad = checkable[Math.floor(Math.random() * checkable.length)];
      const [, a, op, b, result] = parsed[bad];
      const truth = num(result);
      const wrong = slip(truth, num(a), num(b));
      const steps = item.steps.map((text, i) => (i === bad ? `${a} ${op} ${b} = ${result.includes(",") ? wrong.toLocaleString("en-US") : pretty(wrong)}` : text));
      return { format: "steps", item, steps, bad, truth };
    }
    if (item.kind === "number") {
      const truth = Number(item.answers[0]);
      const right = Math.random() < 0.5;
      return { format: "claim", item, truth, shown: right ? truth : slip(truth, 1, 1), right };
    }
  }
  throw new Error(`Could not build a Spot the Mistake round for grade ${grade} stop ${stop}`);
}

// Rounds: a skill chosen in the Game Room is checked as "a student's worked solution" in its own skill family;
// "everything on my trail" mixes those in; a trail stop keeps its fact-step rounds.
function makeRounds(grade, stop, total) {
  const works = String(stop).startsWith("skill:") ? total : stop === ALL_STOPS ? Math.floor(total / 2) : 0;
  const bank = workRounds(grade, stop, works).map((item) => ({ format: "work", item }));
  return Array.from({ length: total }, (_, i) => (stop === ALL_STOPS ? (i % 2 === 1 ? bank.shift() : null) : bank.shift()) || buildRound(grade, stop));
}

const shownStep = (item, text, i) => (item.mode === "eq" ? text : item.answerLine && i === item.steps.length - 1 ? `${t("Answer:")} ${text}` : `= ${text}`);

export function playMistake(host, { grade, stop, calm, finish, onFact }) {
  const total = calm ? 3 : ROUNDS;
  const rounds = makeRounds(grade, stop, total);
  let at = 0;
  let wrong = 0;
  let phase = "find";
  let nope = null;
  let note = "";
  const missed = new Map();
  let timer = null;
  const current = () => rounds[at];

  function workBody(round) {
    const { item } = round;
    const n = item.bad + 1;
    const open = phase === "find";
    const list = item.steps.map((text, i) => `<li><button type="button" class="gm-step${nope === i ? " nope" : ""}${!open && i === item.bad ? " pick" : ""}" data-pick="${i}" ${open ? "" : "disabled"}><b>${i + 1}</b> ${mathText(shownStep(item, text, i))}${!open && i === item.bad ? ` <small class="gm-found">${t("the step you found")}</small>` : ""}</button></li>`).join("");
    const ask = item.another ? t("Another student solved this. Tap the first step that went wrong.") : t("A student solved this. Tap the first step that went wrong.");
    const choices = (legend, options) => `<fieldset class="gm-work-pick"><legend>${legend}</legend><div class="gm-work-options">${options}</div></fieldset>`;
    const cause = phase === "cause" ? choices(t("What went wrong in step {n}?", { n }), item.slips.map((id) => `<button type="button" class="tr-go alt" data-slip="${id}">${esc(slipInfo(id).label)}</button>`).join("")) : "";
    const fix = phase === "fix" ? choices(t("Which version of step {n} puts it right?", { n }), item.fixes.map((text, i) => `<button type="button" class="tr-go alt gm-fixopt" data-fix="${i}">${mathText(item.mode === "eq" ? text : `= ${text}`)}</button>`).join("")) : "";
    const read = canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : "";
    return `<p class="gm-q" id="gm-q">${mathText(describeAsk(item))}</p>${read}<p class="gm-ask">${ask}</p><ol class="gm-steps">${list}</ol>${cause}${fix}`;
  }

  function body() {
    const round = current();
    if (round.format === "work") return workBody(round);
    const head = `<p class="gm-q" id="gm-q">${mathText(round.item.question)}</p>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}`;
    if (round.format === "steps") {
      const list = round.steps.map((text, i) => `<li><button type="button" class="gm-step${nope === i ? " nope" : ""}${phase === "fix" && i === round.bad ? " pick" : ""}" data-pick="${i}" ${phase === "fix" ? "disabled" : ""}><b>${i + 1}</b> ${mathText(text)}</button></li>`).join("");
      const fix = phase === "fix" ? `<form class="gm-fix"><label for="gm-fix-in">${t("You found it! What should step {n} say? Type its result.", { n: round.bad + 1 })}</label><div class="tr-answer"><input id="gm-fix-in" class="tr-input" inputmode="decimal" autocomplete="off" spellcheck="false" /><button type="submit" class="tr-check">${t("Check")}</button></div></form>` : "";
      return `${head}<p class="gm-ask">${t("One step has a mistake. Check each step, then tap the one that is wrong.")}</p><ol class="gm-steps">${list}</ol>${fix}`;
    }
    const claim = `<p class="gm-claim">${t("Sam says the answer is {n}.", { n: `<b>${pretty(round.shown)}</b>` })}</p>`;
    const choose = phase === "find" ? `<div class="gm-choice"><button type="button" class="tr-go" data-claim="right">${t("Sam is right")}</button><button type="button" class="tr-go alt" data-claim="wrong">${t("Sam is wrong")}</button></div>` : "";
    const fix = phase === "fix" ? `<form class="gm-fix"><label for="gm-fix-in">${t("You spotted it! What is the correct answer?")}</label><div class="tr-answer"><input id="gm-fix-in" class="tr-input" inputmode="decimal" autocomplete="off" spellcheck="false" /><button type="submit" class="tr-check">${t("Check")}</button></div></form>` : "";
    return `${head}${claim}${choose}${fix}`;
  }

  function render() {
    host.innerHTML = `<div class="gm-play gm-mistake"><div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Spot the Mistake")}</b><span>${t("Problem {a} of {b}", { a: at + 1, b: total })}</span></div>${body()}<p class="gm-note">${esc(note)}</p></div>`;
    (host.querySelector("#gm-fix-in") || host.querySelector(".gm-work-pick button"))?.focus();
    syncLive(host);
  }

  function advance() {
    at += 1;
    phase = "find";
    nope = null;
    note = "";
    if (at >= total) {
      timer = setTimeout(() => finish({ game: "mistake", stars: mistakeStars(wrong), missed: [...missed.values()], line: wrong === 1 ? t("{n} wrong guess", { n: wrong }) : t("{n} wrong guesses", { n: wrong }) }), 600);
      return;
    }
    render();
  }

  const miss = (round) => {
    wrong += 1;
    missed.set(round.item.question, round.item);
    onFact?.(round.item, false);
  };

  // "A student solved this" rounds: tap the first wrong step, name the slip, then pick the version that fixes it.
  // Nothing shows the right step until the learner has found the error, and a wrong tap never reveals it.
  function workClick(event, round) {
    const { item } = round;
    const n = item.bad + 1;
    const pick = event.target.closest("[data-pick]");
    const slip = event.target.closest("[data-slip]");
    const fix = event.target.closest("[data-fix]");
    if (pick && phase === "find") {
      const i = Number(pick.dataset.pick);
      if (i === item.bad) {
        phase = "cause";
        nope = null;
        note = "";
      } else {
        wrong += 1;
        nope = i;
        note = i < item.bad ? t("That step is correct. Check the others.") : t("That step follows from the step above it. Look earlier.");
      }
      render();
    } else if (slip && phase === "cause") {
      if (slip.dataset.slip === item.slip) {
        phase = "fix";
        note = slipInfo(item.slip).note;
      } else {
        wrong += 1;
        note = t("Not quite. Look at step {n} again: what did the student do?", { n });
      }
      render();
    } else if (fix && phase === "fix") {
      if (item.fixes[Number(fix.dataset.fix)] === item.fix) {
        note = t("Yes! Mistake fixed.");
        phase = "done";
        render();
        timer = setTimeout(advance, 800);
      } else {
        wrong += 1;
        note = t("Not yet. Check that version against the step before it.");
        render();
      }
    }
  }

  host.onclick = (event) => {
    const round = current();
    if (event.target.closest("[data-gm-read]")) return speak(round.format === "work" ? describeAsk(round.item) : round.item.question);
    if (round.format === "work") return workClick(event, round);
    const pick = event.target.closest("[data-pick]");
    if (pick && phase === "find") {
      const i = Number(pick.dataset.pick);
      if (i === round.bad) {
        phase = "fix";
        nope = null;
        note = "";
      } else {
        miss(round);
        nope = i;
        note = t("That step is correct. Check the others.");
      }
      render();
      return;
    }
    const claim = event.target.closest("[data-claim]");
    if (claim && phase === "find") {
      const saysWrong = claim.dataset.claim === "wrong";
      if (saysWrong === !round.right) {
        if (round.right) {
          note = t("Yes, Sam is right. Nice checking.");
          onFact?.(round.item, wrong === 0);
          render();
          timer = setTimeout(advance, 900);
          return;
        }
        phase = "fix";
        note = "";
      } else {
        miss(round);
        note = round.right ? t("Check again. Work the problem yourself before you decide.") : t("Work the problem yourself and compare with Sam's answer.");
      }
      render();
    }
  };
  host.onsubmit = (event) => {
    event.preventDefault();
    const round = current();
    const typed = host.querySelector("#gm-fix-in").value;
    const right = round.format === "steps" ? Number.isFinite(num(typed)) && typed.trim() !== "" && same(num(typed), round.truth) : validateAnswer(typed, round.item);
    if (right) {
      note = t("Yes! Mistake fixed.");
      onFact?.(round.item, wrong === 0);
      phase = "done";
      render();
      timer = setTimeout(advance, 800);
    } else {
      note = t("Not yet. Work that step out again.");
      render();
      host.querySelector("#gm-fix-in").value = typed;
    }
  };
  render();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
    host.onsubmit = null;
  };
}
