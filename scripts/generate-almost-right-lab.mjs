// Generate all 5 mission pages for The Almost-Right Lab
// Run: node generate_missions.mjs (from repo root, but written as one-off script)
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MISSIONS = [
  {
    id: "mission-1",
    num: 1,
    title: "The Adding Trap",
    skill: "Solve x + a = b",
    standard: "6.AT.C.8",
    badgeId: "mission-1",
    badgeEmoji: "🔧",
    badgeName: "Addition Fixer",
    intro:
      "Your creature just tried to solve an addition equation — but made a classic mistake. When the creature sees addition, it thinks it should add MORE. Let's teach it the right move.",
    misconceptionLabel: "adds instead of subtracting",
    creature: {
      equation: "x + 7 = 19",
      wrongSteps: ["x + 7 = 19", "x = 19 + 7", "x = 26"],
      wrongAnswer: "26",
      correctAnswer: "12",
      type: "addition",
      inverseOp: "subtraction",
      inverseVerb: "subtract",
      inverseNum: "7",
    },
    diagnosisChoices: [
      { text: "The creature added instead of subtracting.", correct: true },
      { text: "The creature divided by 7 instead of multiplying.", correct: false },
      { text: "The creature used the wrong equation.", correct: false },
    ],
    rule: "To undo addition, subtract the same number from both sides.",
    ruleShort: "Undo addition → subtract",
    checkExplanation: "Substitute x = 12 back in: 12 + 7 = 19. ✓ Both sides match!",
    practice: [
      { equation: "x + 5 = 17", answer: 12, checkEq: "12 + 5 = 17 ✓" },
      { equation: "x + 8 = 23", answer: 15, checkEq: "15 + 8 = 23 ✓" },
      { equation: "x + 11 = 30", answer: 19, checkEq: "19 + 11 = 30 ✓" },
    ],
    creatureRetry: {
      equation: "x + 4 = 13",
      steps: ["x + 4 = 13", "x = 13 − 4", "x = 9"],
      answer: "9",
      check: "9 + 4 = 13 ✓",
    },
    vocab: [
      "equation",
      "variable",
      "inverse operation",
      "subtract",
      "balance",
      "check",
      "solution",
    ],
  },
  {
    id: "mission-2",
    num: 2,
    title: "The Subtraction Mix-Up",
    skill: "Solve x − a = b",
    standard: "6.AT.C.8",
    badgeId: "mission-2",
    badgeEmoji: "🔄",
    badgeName: "Subtraction Coach",
    intro:
      "Your creature tried to solve a subtraction equation — and went the wrong way. It subtracted MORE instead of adding back. Time to coach!",
    misconceptionLabel: "subtracts more instead of adding",
    creature: {
      equation: "x − 6 = 11",
      wrongSteps: ["x − 6 = 11", "x = 11 − 6", "x = 5"],
      wrongAnswer: "5",
      correctAnswer: "17",
      type: "subtraction",
      inverseOp: "addition",
      inverseVerb: "add",
      inverseNum: "6",
    },
    diagnosisChoices: [
      { text: "The creature subtracted again instead of adding.", correct: true },
      { text: "The creature multiplied both sides.", correct: false },
      { text: "The creature forgot to write x.", correct: false },
    ],
    rule: "To undo subtraction, add the same number to both sides.",
    ruleShort: "Undo subtraction → add",
    checkExplanation: "Substitute x = 17 back in: 17 − 6 = 11. ✓ Both sides match!",
    practice: [
      { equation: "x − 4 = 9", answer: 13, checkEq: "13 − 4 = 9 ✓" },
      { equation: "x − 7 = 15", answer: 22, checkEq: "22 − 7 = 15 ✓" },
      { equation: "x − 12 = 18", answer: 30, checkEq: "30 − 12 = 18 ✓" },
    ],
    creatureRetry: {
      equation: "x − 5 = 8",
      steps: ["x − 5 = 8", "x = 8 + 5", "x = 13"],
      answer: "13",
      check: "13 − 5 = 8 ✓",
    },
    vocab: ["equation", "variable", "inverse operation", "add", "balance", "check", "solution"],
  },
  {
    id: "mission-3",
    num: 3,
    title: "The Multiplication Monster",
    skill: "Solve ax = b",
    standard: "6.AT.C.8",
    badgeId: "mission-3",
    badgeEmoji: "🦁",
    badgeName: "Monster Tamer",
    intro:
      "Uh oh! The creature sees multiplication and thinks — multiply MORE. But that just makes x bigger and bigger. Teach it that dividing is the way to undo multiplication.",
    misconceptionLabel: "multiplies instead of dividing",
    creature: {
      equation: "4x = 28",
      wrongSteps: ["4x = 28", "x = 28 × 4", "x = 112"],
      wrongAnswer: "112",
      correctAnswer: "7",
      type: "multiplication",
      inverseOp: "division",
      inverseVerb: "divide by",
      inverseNum: "4",
    },
    diagnosisChoices: [
      { text: "The creature multiplied instead of dividing.", correct: true },
      { text: "The creature added 4 to both sides.", correct: false },
      { text: "The creature moved x to the right side.", correct: false },
    ],
    rule: "To undo multiplication, divide both sides by the same number.",
    ruleShort: "Undo multiplication → divide",
    checkExplanation: "Substitute x = 7 back in: 4 × 7 = 28. ✓ Both sides match!",
    practice: [
      { equation: "3x = 21", answer: 7, checkEq: "3 × 7 = 21 ✓" },
      { equation: "5x = 40", answer: 8, checkEq: "5 × 8 = 40 ✓" },
      { equation: "7x = 56", answer: 8, checkEq: "7 × 8 = 56 ✓" },
    ],
    creatureRetry: {
      equation: "6x = 42",
      steps: ["6x = 42", "x = 42 ÷ 6", "x = 7"],
      answer: "7",
      check: "6 × 7 = 42 ✓",
    },
    vocab: [
      "equation",
      "variable",
      "inverse operation",
      "multiply",
      "divide",
      "balance",
      "check",
      "solution",
    ],
  },
  {
    id: "mission-4",
    num: 4,
    title: "The Division Confusion",
    skill: "Solve x ÷ a = b",
    standard: "6.AT.C.8",
    badgeId: "mission-4",
    badgeEmoji: "🎯",
    badgeName: "Division Detective",
    intro:
      "The creature sees division and panics — it tries to divide MORE. But to undo division, you need to multiply! Help the creature understand the inverse.",
    misconceptionLabel: "divides instead of multiplying",
    creature: {
      equation: "x ÷ 3 = 9",
      wrongSteps: ["x ÷ 3 = 9", "x = 9 ÷ 3", "x = 3"],
      wrongAnswer: "3",
      correctAnswer: "27",
      type: "division",
      inverseOp: "multiplication",
      inverseVerb: "multiply by",
      inverseNum: "3",
    },
    diagnosisChoices: [
      { text: "The creature divided again instead of multiplying.", correct: true },
      { text: "The creature subtracted 3 from both sides.", correct: false },
      { text: "The creature switched which side x was on.", correct: false },
    ],
    rule: "To undo division, multiply both sides by the same number.",
    ruleShort: "Undo division → multiply",
    checkExplanation: "Substitute x = 27 back in: 27 ÷ 3 = 9. ✓ Both sides match!",
    practice: [
      { equation: "x ÷ 4 = 6", answer: 24, checkEq: "24 ÷ 4 = 6 ✓" },
      { equation: "x ÷ 5 = 9", answer: 45, checkEq: "45 ÷ 5 = 9 ✓" },
      { equation: "x ÷ 8 = 7", answer: 56, checkEq: "56 ÷ 8 = 7 ✓" },
    ],
    creatureRetry: {
      equation: "x ÷ 6 = 4",
      steps: ["x ÷ 6 = 4", "x = 4 × 6", "x = 24"],
      answer: "24",
      check: "24 ÷ 6 = 4 ✓",
    },
    vocab: [
      "equation",
      "variable",
      "inverse operation",
      "multiply",
      "divide",
      "balance",
      "check",
      "solution",
    ],
  },
  {
    id: "mission-5",
    num: 5,
    title: "The Mixed-Up Brain Test",
    skill: "Mixed one-step equations",
    standard: "6.AT.C.8",
    badgeId: "mission-5",
    badgeEmoji: "🏆",
    badgeName: "Equation Champion",
    intro:
      "The creature has learned a lot — but now things get mixed up! It's facing all four types of equations at once and isn't sure which inverse operation to use. You've trained it. Now coach it through the final test.",
    misconceptionLabel: "picks the wrong inverse operation",
    creature: {
      equation: "2x = 18",
      wrongSteps: ["2x = 18", "x = 18 + 2", "x = 20"],
      wrongAnswer: "20",
      correctAnswer: "9",
      type: "multiplication",
      inverseOp: "division",
      inverseVerb: "divide by",
      inverseNum: "2",
    },
    diagnosisChoices: [
      { text: "The creature added instead of dividing — wrong inverse operation.", correct: true },
      { text: "The creature subtracted 2 from x correctly.", correct: false },
      { text: "The creature multiplied the right way.", correct: false },
    ],
    rule: "Always match the inverse operation to what was done to x. Undo addition → subtract. Undo subtraction → add. Undo multiplication → divide. Undo division → multiply.",
    ruleShort: "Match the inverse to the operation on x",
    checkExplanation: "Substitute x = 9 back in: 2 × 9 = 18. ✓ Both sides match!",
    practice: [
      { equation: "x + 6 = 20", answer: 14, checkEq: "14 + 6 = 20 ✓" },
      { equation: "x − 9 = 14", answer: 23, checkEq: "23 − 9 = 14 ✓" },
      { equation: "4x = 32", answer: 8, checkEq: "4 × 8 = 32 ✓" },
      { equation: "x ÷ 3 = 11", answer: 33, checkEq: "33 ÷ 3 = 11 ✓" },
    ],
    creatureRetry: {
      equation: "x + 15 = 28",
      steps: ["x + 15 = 28", "x = 28 − 15", "x = 13"],
      answer: "13",
      check: "13 + 15 = 28 ✓",
    },
    vocab: [
      "equation",
      "variable",
      "inverse operation",
      "add",
      "subtract",
      "multiply",
      "divide",
      "balance",
      "check",
      "solution",
    ],
  },
];

const VOCAB_FULL = {
  equation: { en: "equation", es: "ecuación" },
  variable: { en: "variable", es: "variable" },
  "inverse operation": { en: "inverse operation", es: "operación inversa" },
  add: { en: "add", es: "sumar" },
  subtract: { en: "subtract", es: "restar" },
  multiply: { en: "multiply", es: "multiplicar" },
  divide: { en: "divide", es: "dividir" },
  balance: { en: "balance", es: "balance" },
  check: { en: "check", es: "comprobar" },
  solution: { en: "solution", es: "solución" },
};

function makeCreatureSVG(emotion) {
  // emotion: 'confused' | 'happy' | 'thinking'
  const mouth = {
    confused: `<path d="M41 47 Q50 43 59 47" stroke="#c04a1f" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
    happy: `<path d="M41 45 Q50 50 59 45" stroke="#2c7d6b" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
    thinking: `<path d="M43 46 Q50 46 57 46" stroke="#205fa6" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  };
  const headAcc = {
    confused: `<text x="47" y="30" font-size="9" font-weight="900" fill="#e05a2b" font-family="Nunito,sans-serif">?</text>`,
    happy: `<text x="46" y="30" font-size="9" font-weight="900" fill="#2c7d6b" font-family="Nunito,sans-serif">✓</text>`,
    thinking: `<text x="46" y="30" font-size="9" font-weight="900" fill="#205fa6" font-family="Nunito,sans-serif">…</text>`,
  };
  return `<svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="50" cy="66" rx="28" ry="25" fill="#f4d9c6"/>
  <circle cx="50" cy="40" r="24" fill="#f4d9c6"/>
  <circle cx="42" cy="37" r="5" fill="white"/>
  <circle cx="58" cy="37" r="5" fill="white"/>
  <circle cx="43" cy="37.5" r="2.8" fill="#14223a"/>
  <circle cx="59" cy="37.5" r="2.8" fill="#14223a"/>
  <circle cx="44" cy="36.5" r="1" fill="white"/>
  <circle cx="60" cy="36.5" r="1" fill="white"/>
  ${headAcc[emotion]}
  ${mouth[emotion]}
  <line x1="43" y1="16" x2="40" y2="7" stroke="#e05a2b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="40" cy="6" r="3" fill="#e05a2b"/>
  <line x1="57" y1="16" x2="60" y2="7" stroke="#e05a2b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="60" cy="6" r="3" fill="#205fa6"/>
</svg>`;
}

function makeVocabRows(keys) {
  return keys
    .map((k) => {
      const v = VOCAB_FULL[k];
      if (!v) return "";
      return `<tr><td class="vt-en">${v.en}</td><td class="vt-es">${v.es}</td></tr>`;
    })
    .join("\n            ");
}

function makePracticeItems(mission) {
  return mission.practice
    .map(
      (p, i) => `
          <div class="practice-item" id="practice-${i}" data-answer="${p.answer}" data-check="${p.checkEq}" data-idx="${i}">
            <div class="practice-num" aria-hidden="true">${i + 1}</div>
            <div class="practice-body">
              <div class="practice-eq" aria-label="Practice equation: ${p.equation}">${p.equation}</div>
              <div class="practice-input-row">
                <label for="practice-ans-${i}" class="practice-label">x =</label>
                <input
                  type="number"
                  id="practice-ans-${i}"
                  class="ans-input"
                  placeholder="?"
                  aria-label="Your answer for ${p.equation}"
                  inputmode="numeric"
                  step="any"
                />
                <button class="check-ans-btn" type="button" data-idx="${i}" aria-label="Check answer for problem ${i + 1}">Check</button>
              </div>
              <div class="practice-feedback" id="pf-${i}" role="status" aria-live="polite"></div>
              <div class="check-step hidden" id="check-step-${i}">
                <div class="check-label">Check your answer:</div>
                <div class="check-eq" aria-label="Checking: ${p.checkEq}">${p.checkEq}</div>
              </div>
            </div>
          </div>`,
    )
    .join("");
}

function makeDiagnosisChoices(mission) {
  return mission.diagnosisChoices
    .map(
      (c, i) =>
        `<button class="diag-btn" type="button" data-correct="${c.correct}" data-idx="${i}" aria-label="Choice ${i + 1}: ${c.text}">${c.text}</button>`,
    )
    .join("\n            ");
}

function makeRetrySteps(mission) {
  return mission.creatureRetry.steps
    .map(
      (s, i) => `<div class="retry-step step-${i + 1}" aria-label="Step ${i + 1}: ${s}">${s}</div>`,
    )
    .join("\n              ");
}

function makePage(mission) {
  const prevNum = mission.num - 1;
  const nextNum = mission.num + 1;
  const hasNext = mission.num < 5;
  const hasPrev = mission.num > 1;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Mission ${mission.num}: ${mission.title} — ${mission.skill} — The Almost-Right Lab. Fix the creature's mistake and earn the ${mission.badgeName} badge." />
    <title>Mission ${mission.num}: ${mission.title} — The Almost-Right Lab</title>
    <link rel="canonical" href="https://eduwonderlab.com/curriculum/almost-right-lab/equations/${mission.id}/" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#15487f" />
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Nunito:wght@600;700;800;900&display=swap" />
    <style>
      :root {
        --navy: #15487f; --teal: #205fa6; --teal-light: rgba(32,95,166,0.1);
        --coral: #e05a2b; --coral-light: rgba(224,90,43,0.1); --coral-dark: #c04a1f;
        --cream: #eaf0f7; --ink: #14223a; --muted: #56627a;
        --line: rgba(20,34,58,0.1); --card: #ffffff; --surface-2: #f3f7fc;
        --green: #2c7d6b; --green-light: rgba(44,125,107,0.1);
        --gold: #d97706; --gold-light: rgba(217,119,6,0.12);
        --focus-ring: #e05a2b; --radius: 16px; --shadow: 0 4px 24px rgba(20,34,58,0.1);
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: var(--cream); color: var(--ink); font-family: "Atkinson Hyperlegible", system-ui, sans-serif; font-size: 17px; line-height: 1.6; min-height: 100vh; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
      body::before { content: ""; position: fixed; inset: 0; z-index: -1; background: radial-gradient(900px 400px at 90% -10%, rgba(224,90,43,0.1), transparent 60%), radial-gradient(800px 400px at -5% 5%, rgba(32,95,166,0.12), transparent 55%), var(--cream); }
      a { color: var(--teal); text-decoration: none; }
      a:hover { color: var(--coral); }
      :focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 3px; border-radius: 4px; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
      .hidden { display: none !important; }

      /* ── Breadcrumb ── */
      .breadcrumb { max-width: 900px; margin: 0 auto; padding: 18px 24px 0; font-size: 13px; color: var(--muted); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .breadcrumb a { color: var(--teal); }

      /* ── Mission Header ── */
      .mission-header { max-width: 900px; margin: 0 auto; padding: 22px 24px 0; }
      .mission-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--coral); margin-bottom: 6px; }
      h1 { font-family: "Nunito", system-ui, sans-serif; font-size: clamp(1.6rem, 4vw, 2.5rem); font-weight: 900; color: var(--ink); letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 10px; }
      .mission-skill { display: inline-flex; align-items: center; gap: 8px; background: var(--teal-light); border: 1px solid rgba(32,95,166,0.2); color: var(--navy); font-size: 13px; font-weight: 700; padding: 5px 14px; border-radius: 100px; margin-bottom: 18px; }

      /* ── Progress bar ── */
      .progress-bar { max-width: 900px; margin: 0 auto; padding: 0 24px 12px; }
      .progress-track { height: 6px; background: var(--line); border-radius: 100px; overflow: hidden; }
      .progress-fill { height: 100%; background: linear-gradient(90deg, var(--coral), var(--teal)); border-radius: 100px; transition: width 0.5s ease; }
      .progress-label { font-size: 12px; color: var(--muted); margin-top: 6px; }

      /* ── Main layout ── */
      .main-wrap { max-width: 900px; margin: 0 auto; padding: 0 24px 60px; }

      /* ── Step card ── */
      .step-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 28px; margin-bottom: 20px; position: relative; overflow: hidden; }
      .step-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
      .step-card.step-intro::before { background: var(--coral); }
      .step-card.step-diagnose::before { background: var(--gold); }
      .step-card.step-teach::before { background: var(--teal); }
      .step-card.step-practice::before { background: var(--green); }
      .step-card.step-retry::before { background: linear-gradient(90deg, var(--coral), var(--teal)); }
      .step-card.step-complete::before { background: var(--gold); }
      .step-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
      .step-heading { font-family: "Nunito", sans-serif; font-size: 1.2rem; font-weight: 800; color: var(--ink); margin-bottom: 14px; }

      /* ── Creature card ── */
      .creature-row { display: flex; gap: 18px; align-items: flex-start; }
      .creature-face { flex-shrink: 0; }
      .speech-bubble { background: var(--coral-light); border: 1.5px solid rgba(224,90,43,0.3); border-radius: 12px 12px 12px 4px; padding: 14px 18px; flex: 1; position: relative; }
      .speech-bubble.happy { background: var(--green-light); border-color: rgba(44,125,107,0.3); }
      .speech-bubble::before { content: ""; position: absolute; left: -12px; top: 18px; border: 6px solid transparent; border-right-color: rgba(224,90,43,0.3); }
      .speech-bubble.happy::before { border-right-color: rgba(44,125,107,0.3); }
      .creature-says { font-size: 14px; color: var(--muted); font-style: italic; margin-bottom: 10px; }
      .wrong-work { background: white; border: 1.5px solid var(--line); border-radius: 8px; padding: 10px 14px; font-size: 16px; font-family: "Courier New", monospace; color: var(--ink); line-height: 1.8; }
      .wrong-line { color: #dc2626; font-weight: 700; }
      .intro-text { font-size: 16px; color: var(--ink); line-height: 1.65; }
      .hint-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--teal); border: 1.5px solid rgba(32,95,166,0.3); background: var(--teal-light); border-radius: 8px; padding: 5px 12px; cursor: pointer; margin-top: 12px; transition: all 0.18s; }
      .hint-btn:hover { background: rgba(32,95,166,0.15); }
      .hint-box { background: var(--surface-2); border: 1px solid var(--line); border-radius: 8px; padding: 12px 16px; font-size: 14px; color: var(--ink); margin-top: 10px; }

      /* ── Diagnosis ── */
      .diag-choices { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
      .diag-btn { text-align: left; font-family: "Atkinson Hyperlegible", sans-serif; font-size: 15px; padding: 13px 18px; border-radius: 10px; border: 1.5px solid var(--line); background: var(--surface-2); color: var(--ink); cursor: pointer; transition: all 0.18s; }
      .diag-btn:hover { border-color: var(--teal); background: var(--teal-light); }
      .diag-btn.correct { border-color: var(--green); background: var(--green-light); color: var(--green); font-weight: 700; }
      .diag-btn.wrong { border-color: #dc2626; background: rgba(220,38,38,0.08); color: #dc2626; }
      .diag-btn:disabled { cursor: default; pointer-events: none; }
      .diag-feedback { font-size: 15px; font-weight: 700; margin-top: 12px; padding: 10px 16px; border-radius: 8px; display: none; }
      .diag-feedback.correct { background: var(--green-light); color: var(--green); border: 1px solid rgba(44,125,107,0.3); display: block; }
      .diag-feedback.wrong { background: rgba(220,38,38,0.08); color: #dc2626; border: 1px solid rgba(220,38,38,0.2); display: block; }

      /* ── Teach / Sentence frames ── */
      .rule-box { background: var(--teal-light); border: 1.5px solid rgba(32,95,166,0.25); border-left: 4px solid var(--teal); border-radius: 10px; padding: 14px 18px; font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 18px; }
      .frames { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
      .frame-item { font-size: 15px; color: var(--muted); }
      .frame-item span { color: var(--ink); font-weight: 700; }
      .explain-box { width: 100%; min-height: 80px; border: 2px solid var(--line); border-radius: 10px; padding: 12px 16px; font-size: 15px; font-family: inherit; color: var(--ink); background: var(--surface-2); resize: vertical; transition: border-color 0.2s; }
      .explain-box:focus { outline: none; border-color: var(--coral); background: white; }
      .explain-feedback { font-size: 14px; margin-top: 8px; color: var(--muted); }
      .explain-feedback.strong { color: var(--green); font-weight: 700; }
      .vocab-chip { display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 100px; background: var(--gold-light); color: var(--gold); border: 1px solid rgba(217,119,6,0.25); margin: 2px; cursor: default; }

      /* ── Correction step ── */
      .correct-work { background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 8px; padding: 12px 14px; font-size: 16px; font-family: "Courier New", monospace; line-height: 1.8; color: var(--ink); margin-bottom: 14px; }
      .correct-line { color: var(--green); font-weight: 700; }
      .ans-input-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .ans-lbl { font-size: 17px; font-weight: 700; color: var(--ink); }
      .big-ans-input { width: 90px; border: 2px solid var(--line); border-radius: 10px; padding: 10px 14px; font-size: 20px; font-weight: 700; text-align: center; font-family: inherit; color: var(--ink); background: white; transition: border-color 0.2s; }
      .big-ans-input:focus { outline: none; border-color: var(--coral); }

      /* ── Practice ── */
      .practice-item { background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 12px; padding: 16px 18px; margin-bottom: 12px; display: flex; gap: 16px; align-items: flex-start; }
      .practice-num { width: 30px; height: 30px; border-radius: 50%; background: var(--teal-light); color: var(--navy); font-family: "Nunito", sans-serif; font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
      .practice-body { flex: 1; }
      .practice-eq { font-size: 19px; font-weight: 700; font-family: "Courier New", monospace; color: var(--ink); margin-bottom: 10px; }
      .practice-input-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
      .practice-label { font-size: 16px; font-weight: 700; color: var(--ink); }
      .ans-input { width: 80px; border: 2px solid var(--line); border-radius: 8px; padding: 8px 12px; font-size: 18px; font-weight: 700; text-align: center; font-family: inherit; color: var(--ink); background: white; transition: border-color 0.2s; }
      .ans-input:focus { outline: none; border-color: var(--coral); }
      .check-ans-btn { font-family: "Nunito", sans-serif; font-weight: 800; font-size: 14px; background: var(--teal); color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer; transition: background 0.18s; }
      .check-ans-btn:hover { background: var(--navy); }
      .check-ans-btn:disabled { background: var(--line); color: var(--muted); cursor: default; }
      .practice-feedback { font-size: 14px; font-weight: 700; min-height: 20px; }
      .practice-feedback.correct { color: var(--green); }
      .practice-feedback.wrong { color: #dc2626; }
      .check-step { margin-top: 8px; background: var(--green-light); border: 1px solid rgba(44,125,107,0.2); border-radius: 8px; padding: 8px 12px; }
      .check-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 4px; }
      .check-eq { font-size: 15px; font-family: "Courier New", monospace; color: var(--green); font-weight: 700; }

      /* ── Retry steps ── */
      .retry-steps { background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 10px; padding: 14px 18px; font-size: 16px; font-family: "Courier New", monospace; line-height: 2; color: var(--ink); margin-bottom: 14px; }
      .retry-step { opacity: 0; transform: translateX(-8px); transition: opacity 0.35s, transform 0.35s; }
      .retry-step.show { opacity: 1; transform: none; }

      /* ── Vocab table ── */
      .vocab-section { background: var(--gold-light); border: 1px solid rgba(217,119,6,0.2); border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; }
      .vocab-heading { font-family: "Nunito", sans-serif; font-size: 14px; font-weight: 800; color: var(--gold); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
      .vocab-table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .vocab-table th { text-align: left; padding: 4px 10px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid rgba(217,119,6,0.2); }
      .vt-en { padding: 5px 10px; font-weight: 700; color: var(--ink); }
      .vt-es { padding: 5px 10px; color: var(--muted); font-style: italic; }
      tr:hover .vt-en, tr:hover .vt-es { background: rgba(217,119,6,0.08); }

      /* ── Buttons ── */
      .btn-primary { display: inline-flex; align-items: center; gap: 8px; font-family: "Nunito", sans-serif; font-weight: 900; font-size: 17px; background: var(--coral); color: white; border: none; border-radius: 12px; padding: 15px 28px; cursor: pointer; text-decoration: none; transition: background 0.18s, transform 0.14s; box-shadow: 0 4px 16px rgba(224,90,43,0.3); }
      .btn-primary:hover { background: var(--coral-dark); transform: translateY(-2px); color: white; }
      .btn-primary:active { transform: translateY(0); }
      .btn-secondary { display: inline-flex; align-items: center; gap: 8px; font-family: "Nunito", sans-serif; font-weight: 700; font-size: 15px; background: white; color: var(--navy); border: 1.5px solid var(--line); border-radius: 10px; padding: 11px 20px; cursor: pointer; text-decoration: none; transition: all 0.18s; }
      .btn-secondary:hover { border-color: var(--navy); background: var(--surface-2); color: var(--navy); }
      .btn-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 4px; }

      /* ── Complete card ── */
      .complete-card { text-align: center; padding: 40px 28px; }
      .badge-display { font-size: 64px; line-height: 1; margin-bottom: 16px; animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
      @keyframes pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      .complete-title { font-family: "Nunito", sans-serif; font-size: 1.8rem; font-weight: 900; color: var(--ink); margin-bottom: 10px; }
      .complete-sub { font-size: 16px; color: var(--muted); max-width: 46ch; margin: 0 auto 24px; }
      .nav-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }

      /* ── Sidebar ── */
      .page-layout { display: grid; grid-template-columns: 1fr 260px; gap: 24px; align-items: start; }
      @media (max-width: 780px) { .page-layout { grid-template-columns: 1fr; } .mission-sidebar { display: none; } }
      .mission-sidebar { display: flex; flex-direction: column; gap: 16px; }
      .sidebar-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 18px; }
      .sidebar-heading { font-family: "Nunito", sans-serif; font-size: 13px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
      .print-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: "Nunito", sans-serif; font-weight: 700; font-size: 14px; background: white; color: var(--navy); border: 1.5px solid var(--line); border-radius: 8px; padding: 10px 14px; cursor: pointer; transition: all 0.18s; }
      .print-btn:hover { border-color: var(--navy); background: var(--surface-2); }

      /* ── Print ── */
      @media print {
        body::before, .mission-sidebar, .btn-row, .btn-primary, .btn-secondary, .start-btn, .breadcrumb { display: none; }
        .page-layout { display: block; }
        .step-card { break-inside: avoid; box-shadow: none; border: 1px solid #ccc; }
        .print-section { display: block !important; }
        h1::before { content: "The Almost-Right Lab — Mission ${mission.num}: ${mission.title}\\A"; white-space: pre; }
      }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
      @media (max-width: 640px) {
        h1 { font-size: 1.7rem; }
        .step-card { padding: 20px 16px; }
        .creature-row { flex-direction: column; }
      }
    </style>
  </head>
  <body>

    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/curriculum/">Curriculum</a>
      <span aria-hidden="true">›</span>
      <a href="/curriculum/almost-right-lab/">Almost-Right Lab</a>
      <span aria-hidden="true">›</span>
      <a href="/curriculum/almost-right-lab/equations/">Equations</a>
      <span aria-hidden="true">›</span>
      <span aria-current="page">Mission ${mission.num}</span>
    </nav>

    <header class="mission-header">
      <div class="mission-eyebrow">Mission ${mission.num} of 5</div>
      <h1>${mission.title}</h1>
      <div class="mission-skill" aria-label="Skill: ${mission.skill}">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 6.5h9M6.5 2v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        ${mission.skill} · ${mission.standard}
      </div>
    </header>

    <div class="progress-bar" aria-label="Mission progress">
      <div class="progress-track" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Mission progress">
        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
      </div>
      <div class="progress-label" id="progress-label">Step 1 of 7</div>
    </div>

    <div class="main-wrap">
      <div class="page-layout">
        <!-- Main content -->
        <div id="steps-area">

          <!-- ══ STEP 1: INTRO ══ -->
          <section class="step-card step-intro" id="step-intro" aria-labelledby="intro-heading">
            <div class="step-label">Step 1 — Meet the Mistake</div>
            <h2 class="step-heading" id="intro-heading">Your creature made an error.</h2>
            <p class="intro-text">${mission.intro}</p>
            <div class="creature-row" style="margin-top:18px;">
              <div class="creature-face" id="creature-intro" aria-hidden="true">${makeCreatureSVG("confused")}</div>
              <div class="speech-bubble" role="img" aria-label="Creature says: I tried to solve ${mission.creature.equation}. Here is my work.">
                <div class="creature-says">Here's what I did…</div>
                <div class="wrong-work" aria-label="Creature's wrong work">
                  ${mission.creature.wrongSteps
                    .map((s, i) =>
                      i === mission.creature.wrongSteps.length - 1
                        ? `<div class="wrong-line" aria-label="Incorrect final answer: ${s}">${s} ❌</div>`
                        : `<div>${s}</div>`,
                    )
                    .join("")}
                </div>
              </div>
            </div>
            <div class="btn-row" style="margin-top:20px;">
              <button class="btn-primary" type="button" id="intro-next-btn" aria-label="Find the mistake — go to next step">
                Find the Mistake
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </section>

          <!-- ══ STEP 2: DIAGNOSE ══ -->
          <section class="step-card step-diagnose hidden" id="step-diagnose" aria-labelledby="diag-heading">
            <div class="step-label">Step 2 — What Went Wrong?</div>
            <h2 class="step-heading" id="diag-heading">Find the creature's mistake.</h2>
            <p style="font-size:15px; color:var(--muted); margin-bottom:16px;">The creature solved <strong>${mission.creature.equation}</strong> and got <strong>${mission.creature.wrongAnswer}</strong>. What mistake did it make?</p>
            <div class="diag-choices" role="group" aria-labelledby="diag-heading">
              ${makeDiagnosisChoices(mission)}
            </div>
            <div class="diag-feedback" id="diag-feedback" role="alert"></div>
          </section>

          <!-- ══ STEP 3: TEACH ══ -->
          <section class="step-card step-teach hidden" id="step-teach" aria-labelledby="teach-heading">
            <div class="step-label">Step 3 — Teach the Rule</div>
            <h2 class="step-heading" id="teach-heading">Explain the correct move.</h2>
            <div class="rule-box" role="note" aria-label="The rule">
              📐 Rule: ${mission.rule}
            </div>
            <p style="font-size:15px; color:var(--muted); margin-bottom:14px;">Use one of the sentence starters below to explain the mistake and the fix.</p>
            <div class="frames" role="list" aria-label="Sentence starters">
              <div class="frame-item" role="listitem">The creature is almost right because <span>__________.</span></div>
              <div class="frame-item" role="listitem">The mistake is <span>__________.</span></div>
              <div class="frame-item" role="listitem">The correct step is <span>__________.</span></div>
              <div class="frame-item" role="listitem">I know because <span>__________.</span></div>
              <div class="frame-item" role="listitem">To check, I can <span>__________.</span></div>
            </div>
            <label for="explain-input" class="sr-only">Your explanation</label>
            <textarea
              id="explain-input"
              class="explain-box"
              placeholder="Type your explanation here…"
              aria-label="Explain the mistake and the correct step using a sentence starter"
              aria-describedby="explain-hint"
            ></textarea>
            <div id="explain-hint" style="font-size:13px; color:var(--muted); margin-top:6px;">
              Tip: Use a math word like "inverse", "subtract", or "balance" to make your explanation stronger.
            </div>
            <div class="explain-feedback" id="explain-feedback" role="status" aria-live="polite"></div>
            <div class="btn-row" style="margin-top:14px;">
              <button class="btn-primary" type="button" id="teach-next-btn" aria-label="Submit explanation and continue">
                Submit Explanation
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </section>

          <!-- ══ STEP 4: CORRECT ══ -->
          <section class="step-card step-teach hidden" id="step-correct" aria-labelledby="correct-heading">
            <div class="step-label">Step 4 — Fix the Work</div>
            <h2 class="step-heading" id="correct-heading">Show the correct solution.</h2>
            <p style="font-size:15px; color:var(--muted); margin-bottom:14px;">Solve <strong>${mission.creature.equation}</strong> correctly. ${mission.ruleShort}.</p>
            <div class="correct-work" aria-label="Start of correct work">
              ${mission.creature.wrongSteps[0]}
            </div>
            <div class="ans-input-row" style="margin-bottom:12px;">
              <span class="ans-lbl" aria-hidden="true">x =</span>
              <input
                type="number"
                id="main-ans-input"
                class="big-ans-input"
                placeholder="?"
                aria-label="Enter the correct value of x"
                inputmode="numeric"
                step="any"
              />
              <button class="check-ans-btn" type="button" id="main-check-btn" aria-label="Check your answer">Check</button>
            </div>
            <div id="main-ans-feedback" role="alert" style="font-size:15px; font-weight:700; min-height:24px;"></div>
          </section>

          <!-- ══ STEP 5: PRACTICE ══ -->
          <section class="step-card step-practice hidden" id="step-practice" aria-labelledby="practice-heading">
            <div class="step-label">Step 5 — Practice Rounds</div>
            <h2 class="step-heading" id="practice-heading">Try it yourself — three rounds.</h2>
            <p style="font-size:15px; color:var(--muted); margin-bottom:18px;">Apply what you taught the creature. Check at least one answer by substituting back in.</p>
            ${makePracticeItems(mission)}
            <div id="practice-done-area" class="hidden" style="margin-top:8px;">
              <div class="btn-row">
                <button class="btn-primary" type="button" id="practice-next-btn" aria-label="See the creature try again">
                  See the Creature Try Again
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
          </section>

          <!-- ══ STEP 6: CREATURE RETRY ══ -->
          <section class="step-card step-retry hidden" id="step-retry" aria-labelledby="retry-heading">
            <div class="step-label">Step 6 — Creature Retry</div>
            <h2 class="step-heading" id="retry-heading">Watch your creature try again.</h2>
            <p style="font-size:15px; color:var(--muted); margin-bottom:16px;">Your teaching worked! The creature is trying <strong>${mission.creatureRetry.equation}</strong> with the correct method.</p>
            <div class="creature-row">
              <div class="creature-face" id="creature-retry" aria-hidden="true">${makeCreatureSVG("thinking")}</div>
              <div class="speech-bubble happy">
                <div class="creature-says" style="color:var(--green)">Let me try using the inverse operation…</div>
                <div class="retry-steps" id="retry-steps" aria-label="Creature's corrected work">
                  ${makeRetrySteps(mission)}
                </div>
              </div>
            </div>
            <div id="retry-check-area" class="hidden" style="margin-top:16px;">
              <div style="font-size:15px; color:var(--muted); margin-bottom:10px;">Did it work? Check by substituting back in.</div>
              <div class="check-step" style="display:block; margin-bottom:14px;">
                <div class="check-label">Check:</div>
                <div class="check-eq">${mission.creatureRetry.check}</div>
              </div>
              <div class="creature-row">
                <div class="creature-face" id="creature-happy" aria-hidden="true">${makeCreatureSVG("happy")}</div>
                <div class="speech-bubble happy" role="img" aria-label="Creature says: That helped! I will use the inverse operation from now on.">
                  <div style="font-size:15px; color:var(--green); font-weight:700;">That helped! I will use the inverse operation from now on. 🎉</div>
                </div>
              </div>
              <div class="btn-row" style="margin-top:14px;">
                <button class="btn-primary" type="button" id="retry-complete-btn" aria-label="Complete mission and earn badge">
                  Complete Mission
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
          </section>

          <!-- ══ STEP 7: COMPLETE ══ -->
          <section class="step-card step-complete hidden" id="step-complete" aria-labelledby="complete-heading">
            <div class="complete-card">
              <div class="badge-display" role="img" aria-label="${mission.badgeName} badge earned">${mission.badgeEmoji}</div>
              <h2 class="complete-title" id="complete-heading">Badge Earned: ${mission.badgeName}!</h2>
              <p class="complete-sub">You coached your creature through Mission ${mission.num}. It now knows: <strong>${mission.ruleShort}</strong>.</p>
              <div style="background:var(--surface-2); border:1px solid var(--line); border-radius:10px; padding:16px 20px; font-size:15px; max-width:440px; margin:0 auto 24px; text-align:left;">
                <strong>Reflection:</strong> What mistake did your creature stop making today?<br/>
                <span style="color:var(--muted); font-style:italic;">Think about: the wrong operation it used, and the correct inverse operation.</span>
              </div>
              <div class="nav-buttons">
                <a href="/curriculum/almost-right-lab/equations/" class="btn-secondary" aria-label="Back to unit hub">← Back to Unit</a>
                ${
                  hasNext
                    ? `<a href="/curriculum/almost-right-lab/equations/mission-${nextNum}/" class="btn-primary" aria-label="Go to Mission ${nextNum}">Mission ${nextNum} →</a>`
                    : `<a href="/curriculum/almost-right-lab/equations/" class="btn-primary" aria-label="All missions complete — back to unit">All Done! 🏆</a>`
                }
                <button class="btn-secondary" type="button" onclick="window.print()" aria-label="Print mission summary">🖨 Print</button>
              </div>
            </div>
          </section>

        </div><!-- /steps-area -->

        <!-- Sidebar -->
        <aside class="mission-sidebar" aria-label="Mission tools">

          <!-- Vocab Bank -->
          <div class="sidebar-card">
            <div class="sidebar-heading">Vocabulary Bank</div>
            <div class="vocab-section" style="margin:0; background:none; border:none; padding:0;">
              <table class="vocab-table" aria-label="Math vocabulary in English and Spanish">
                <thead><tr><th scope="col">English</th><th scope="col">Spanish</th></tr></thead>
                <tbody>${makeVocabRows(mission.vocab)}</tbody>
              </table>
            </div>
          </div>

          <!-- Sentence Frames Quick Ref -->
          <div class="sidebar-card">
            <div class="sidebar-heading">Sentence Starters</div>
            <div style="font-size:13px; color:var(--muted); line-height:1.7;">
              <div>The creature is almost right because…</div>
              <div>The mistake is…</div>
              <div>The correct step is…</div>
              <div>I know because…</div>
              <div>To check, I can…</div>
            </div>
          </div>

          <!-- Print -->
          <div class="sidebar-card">
            <button class="print-btn" type="button" onclick="window.print()" aria-label="Print this mission">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="5" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 5V3h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="5" y="9" width="6" height="1" rx="0.5" fill="currentColor"/></svg>
              Print Mission
            </button>
          </div>

          <!-- Nav hint -->
          <div class="sidebar-card" style="font-size:13px; color:var(--muted); line-height:1.6;">
            <div class="sidebar-heading">Navigation</div>
            ${hasPrev ? `<a href="/curriculum/almost-right-lab/equations/mission-${prevNum}/" style="display:block; margin-bottom:6px;">← Mission ${prevNum}</a>` : ""}
            <a href="/curriculum/almost-right-lab/equations/" style="display:block; margin-bottom:6px;">Unit Hub</a>
            ${hasNext ? `<a href="/curriculum/almost-right-lab/equations/mission-${nextNum}/" style="display:block;">Mission ${nextNum} →</a>` : ""}
          </div>
        </aside>
      </div>
    </div><!-- /main-wrap -->

    <script>
      // ── Constants ──
      const MISSION_ID   = "${mission.id}";
      const CORRECT_ANS  = ${mission.creature.correctAnswer};
      const BADGE_ID     = "${mission.badgeId}";
      const TOTAL_PRACTICE = ${mission.practice.length};
      const LS_KEY       = "arl_progress";
      const VOCAB_WORDS  = ${JSON.stringify(mission.vocab)};

      // ── Steps ──
      const STEPS = ["intro","diagnose","teach","correct","practice","retry","complete"];
      let currentStep = 0;
      let practiceCorrect = 0;

      function loadProgress() {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || "null") || freshProgress(); }
        catch { return freshProgress(); }
      }
      function freshProgress() {
        return { creatureName: "", completedMissions: [], masteredSkills: [], activeMisconceptions: [], badges: [], explanationStrength: 0, lastPlayedAt: "" };
      }
      function saveProgress(p) { try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {} }

      // ── Progress bar ──
      function updateProgress() {
        const pct = Math.round((currentStep / (STEPS.length - 1)) * 100);
        document.getElementById("progress-fill").style.width = pct + "%";
        document.getElementById("progress-fill").setAttribute("aria-valuenow", pct);
        document.getElementById("progress-label").textContent = "Step " + (currentStep + 1) + " of " + STEPS.length;
      }

      function showStep(stepName) {
        STEPS.forEach(s => {
          const el = document.getElementById("step-" + s);
          if (el) el.classList.add("hidden");
        });
        const el = document.getElementById("step-" + stepName);
        if (el) {
          el.classList.remove("hidden");
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          // Focus first focusable el
          const first = el.querySelector("button, input, textarea, a[href]");
          if (first) setTimeout(() => first.focus(), 350);
        }
        currentStep = STEPS.indexOf(stepName);
        updateProgress();
      }

      // ── STEP 1: Intro ──
      document.getElementById("intro-next-btn").addEventListener("click", () => showStep("diagnose"));

      // ── STEP 2: Diagnose ──
      document.querySelectorAll(".diag-btn").forEach(btn => {
        btn.addEventListener("click", function() {
          const correct = this.dataset.correct === "true";
          document.querySelectorAll(".diag-btn").forEach(b => {
            b.disabled = true;
            if (b.dataset.correct === "true") b.classList.add("correct");
            else b.classList.add("wrong");
          });
          const fb = document.getElementById("diag-feedback");
          if (correct) {
            fb.textContent = "✓ Right! The creature ${mission.misconceptionLabel}. Now let's teach it the correct rule.";
            fb.className = "diag-feedback correct";
            setTimeout(() => showStep("teach"), 1800);
          } else {
            fb.textContent = "Not quite. Look at the creature's work step by step — which operation did it use that it shouldn't have?";
            fb.className = "diag-feedback wrong";
            // Re-enable after a moment for another try
            setTimeout(() => {
              document.querySelectorAll(".diag-btn").forEach(b => {
                b.disabled = false;
                b.classList.remove("wrong", "correct");
              });
              fb.className = "diag-feedback";
              fb.textContent = "";
            }, 2200);
          }
        });
      });

      // ── STEP 3: Teach ──
      document.getElementById("teach-next-btn").addEventListener("click", () => {
        const val = document.getElementById("explain-input").value.trim();
        if (!val) {
          const fb = document.getElementById("explain-feedback");
          fb.textContent = "Please type your explanation before continuing.";
          fb.className = "explain-feedback";
          document.getElementById("explain-input").focus();
          return;
        }
        const valLow = val.toLowerCase();
        const hasVocab = VOCAB_WORDS.some(w => valLow.includes(w.toLowerCase()));
        const fb = document.getElementById("explain-feedback");
        if (hasVocab) {
          fb.textContent = "✓ Strong explanation! You used a math vocabulary word.";
          fb.className = "explain-feedback strong";
          const p = loadProgress();
          p.explanationStrength = (p.explanationStrength || 0) + 1;
          saveProgress(p);
        } else {
          fb.textContent = 'Good start! Try adding a math word like "inverse", "${mission.creature.inverseVerb}", or "balance" to make it stronger.';
          fb.className = "explain-feedback";
        }
        setTimeout(() => showStep("correct"), 1400);
      });

      // ── STEP 4: Correct ──
      function checkMainAnswer() {
        const val = parseFloat(document.getElementById("main-ans-input").value);
        const fb = document.getElementById("main-ans-feedback");
        if (isNaN(val)) {
          fb.textContent = "Enter a number for x.";
          fb.style.color = "#dc2626";
          return;
        }
        if (Math.abs(val - CORRECT_ANS) < 0.001) {
          fb.textContent = "✓ Correct! x = " + CORRECT_ANS + ". " + ${JSON.stringify(mission.checkExplanation)};
          fb.style.color = "var(--green)";
          document.getElementById("main-check-btn").disabled = true;
          setTimeout(() => showStep("practice"), 2000);
        } else {
          fb.textContent = "Not quite. Remember: ${mission.ruleShort}. Try again.";
          fb.style.color = "#dc2626";
        }
      }
      document.getElementById("main-check-btn").addEventListener("click", checkMainAnswer);
      document.getElementById("main-ans-input").addEventListener("keydown", e => { if (e.key === "Enter") checkMainAnswer(); });

      // ── STEP 5: Practice ──
      const practiceAnswers = ${JSON.stringify(mission.practice.map((p) => p.answer))};
      const practiceChecks  = ${JSON.stringify(mission.practice.map((p) => p.checkEq))};
      let practiceState = new Array(TOTAL_PRACTICE).fill(false);

      document.querySelectorAll(".check-ans-btn").forEach(btn => {
        btn.addEventListener("click", function() {
          const idx = parseInt(this.dataset.idx, 10);
          const inputEl = document.getElementById("practice-ans-" + idx);
          const val = parseFloat(inputEl.value);
          const fb = document.getElementById("pf-" + idx);
          const checkArea = document.getElementById("check-step-" + idx);
          if (isNaN(val)) { fb.textContent = "Enter a number."; fb.className = "practice-feedback wrong"; return; }
          const correct = Math.abs(val - practiceAnswers[idx]) < 0.001;
          if (correct) {
            fb.textContent = "✓ Correct!";
            fb.className = "practice-feedback correct";
            this.disabled = true;
            inputEl.disabled = true;
            checkArea.classList.remove("hidden");
            practiceState[idx] = true;
          } else {
            fb.textContent = "Not quite — try again.";
            fb.className = "practice-feedback wrong";
          }
          // Show continue if all correct
          if (practiceState.every(Boolean)) {
            document.getElementById("practice-done-area").classList.remove("hidden");
          }
        });
      });
      // Enter key on practice inputs
      document.querySelectorAll(".ans-input").forEach(inp => {
        inp.addEventListener("keydown", e => {
          if (e.key === "Enter") {
            const idx = inp.id.replace("practice-ans-", "");
            document.querySelector('.check-ans-btn[data-idx="' + idx + '"]').click();
          }
        });
      });

      document.getElementById("practice-next-btn").addEventListener("click", () => showStep("retry"));

      // ── STEP 6: Retry ──
      // Animate steps sequentially
      function animateRetry() {
        const steps = document.querySelectorAll(".retry-step");
        steps.forEach((el, i) => {
          setTimeout(() => {
            el.classList.add("show");
            if (i === steps.length - 1) {
              setTimeout(() => {
                document.getElementById("retry-check-area").classList.remove("hidden");
              }, 600);
            }
          }, (i + 1) * 700);
        });
      }
      // Trigger on step show
      const retryObs = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          if (m.target.id === "step-retry" && !m.target.classList.contains("hidden")) {
            setTimeout(animateRetry, 300);
            retryObs.disconnect();
          }
        });
      });
      const retryEl = document.getElementById("step-retry");
      if (retryEl) retryObs.observe(retryEl, { attributes: true, attributeFilter: ["class"] });

      document.getElementById("retry-complete-btn").addEventListener("click", () => {
        // Save progress
        const p = loadProgress();
        if (!p.completedMissions.includes(MISSION_ID)) p.completedMissions.push(MISSION_ID);
        if (!p.badges.includes(BADGE_ID)) p.badges.push(BADGE_ID);
        p.lastPlayedAt = new Date().toISOString();
        saveProgress(p);
        showStep("complete");
      });

      // ── Init ──
      showStep("intro");
    </script>
  </body>
</html>`;
}

// Write pages
MISSIONS.forEach((mission) => {
  const dir = join(__dirname, `curriculum/almost-right-lab/equations/${mission.id}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), makePage(mission), "utf8");
  console.log(`✓ Written: curriculum/almost-right-lab/equations/${mission.id}/index.html`);
});

console.log("\nAll 5 mission pages generated!");
