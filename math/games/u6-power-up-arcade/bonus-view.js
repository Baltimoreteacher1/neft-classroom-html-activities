// Power Up! bonus-round screens. Each returns a promise of {points, perfect}.
// A wrong pick never shows the answer; the explanation appears only once the student finds it.

import { crystalCards, glitchPuzzle } from "./bonus.js";
import { burst, centerOf, confetti, sfx } from "./fx.js";

const $ = (id) => document.getElementById(id);

function button(text, cls) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = text;
  return b;
}

function setCoach(text, kind, say) {
  const c = $("bonusCoach");
  c.textContent = text;
  c.className = `coach ${kind}`;
  say(text);
}

function waitNext(label) {
  const next = $("bonusNext");
  next.textContent = label;
  next.hidden = false;
  next.focus();
  return new Promise((resolve) => {
    next.onclick = () => {
      next.hidden = true;
      resolve();
    };
  });
}

/** Power Crystals: three exponent cards. First-try right = a crystal and 250 points. */
export async function playCrystals(level, seed, say) {
  $("bonusHead").textContent = "💎 Power Crystals";
  $("bonusIntro").textContent =
    "Mr. Neft hid three crystals. Each card tests what an exponent really means.";
  const cards = crystalCards(level, seed);
  let points = 0;
  let firstTry = 0;
  const got = [];
  for (const [n, c] of cards.entries()) {
    const body = $("bonusBody");
    const gems = cards.map((_, i) => got[i] ?? "◇").join(" ");
    const head = document.createElement("p");
    head.className = "crystal-row";
    head.textContent = `${gems}   Card ${n + 1} of ${cards.length}`;
    const q = document.createElement("p");
    q.className = "bonus-q";
    q.textContent = c.prompt;
    const row = document.createElement("div");
    row.className = "choice-row";
    body.replaceChildren(head, q, row);
    setCoach("Pick one.", "", say);
    let misses = 0;
    await new Promise((resolve) => {
      c.choices.forEach((text, i) => {
        const b = button(text, "choice-btn");
        b.onclick = () => {
          if (i !== c.answer) {
            misses++;
            b.disabled = true;
            b.classList.add("miss");
            sfx("oops");
            setCoach(
              misses === 1
                ? "Mr. Neft: Nope! Think about what the exponent tells you to do."
                : "Write it out as repeated multiplication, then pick again.",
              "bad",
              say,
            );
            return;
          }
          for (const x of row.querySelectorAll("button")) x.disabled = true;
          b.classList.add("hit");
          const at = centerOf(b);
          burst(at.x, at.y, { n: 40, star: true });
          sfx(misses ? "zap" : "power");
          got[n] = misses ? "🔹" : "💎";
          if (!misses) {
            firstTry++;
            points += 250;
          } else points += 100;
          setCoach(`${misses ? "Got it." : "💎 Crystal!"} ${c.why}`, "good", say);
          resolve();
        };
        row.append(b);
      });
      row.querySelector("button").focus();
    });
    await waitNext(n === cards.length - 1 ? "FINISH ▶" : "NEXT CARD ▶");
  }
  if (firstTry === cards.length) confetti(100);
  return { points, perfect: firstTry === cards.length };
}

/** Glitch Hunter: find the first broken line in Mr. Neft's worked solution. */
export async function playGlitch(level, seed, say) {
  $("bonusHead").textContent = "🕵️ Glitch Hunter";
  $("bonusIntro").textContent =
    "Mr. Neft solved this one himself and glitched a step. Tap the FIRST line where his work goes wrong.";
  const g = glitchPuzzle(level, seed);
  const list = document.createElement("ol");
  list.className = "glitch-lines";
  let misses = 0;
  const result = await new Promise((resolve) => {
    g.lines.forEach((text, i) => {
      const li = document.createElement("li");
      if (i === 0) {
        li.className = "glitch-start";
        li.textContent = `Problem: ${text}`;
      } else {
        const b = button(`= ${text}`, "glitch-btn");
        b.setAttribute("aria-label", `Line ${i}: ${text}`);
        b.onclick = () => {
          if (i !== g.wrong) {
            misses++;
            b.disabled = true;
            b.classList.add("ok-line");
            sfx("oops");
            const hint =
              misses === 1
                ? "That line follows the rules. Look again."
                : g.kind === "power"
                  ? "Check every exponent: is it repeated multiplication?"
                  : "Check that each line follows the Order Ladder.";
            setCoach(hint, "bad", say);
            return;
          }
          for (const x of list.querySelectorAll("button")) x.disabled = true;
          b.classList.add("hit");
          const at = centerOf(b);
          burst(at.x, at.y, { n: 60, star: true, speed: 7 });
          confetti(misses ? 40 : 110);
          sfx("win");
          const points = misses === 0 ? 600 : misses === 1 ? 300 : 100;
          setCoach(
            `🕵️ Glitch found! ${g.why} The right answer is ${g.answer.toLocaleString("en-US")}.`,
            "good",
            say,
          );
          resolve({ points, perfect: misses === 0 });
        };
        li.append(b);
      }
      list.append(li);
    });
    $("bonusBody").replaceChildren(list);
    setCoach("Read each line. Which one breaks a rule?", "", say);
    list.querySelector("button").focus();
  });
  await waitNext("FINISH ▶");
  return result;
}
