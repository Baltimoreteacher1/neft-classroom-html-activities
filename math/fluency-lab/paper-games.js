// Paper versions of the games for stations and screen-free practice. Each sheet is fresh; the answer key
// is a separate page so it can be left out. Nothing here reads a learner's saved progress.
import { ALL_STOPS, answerOf, answerText, cardText, gameProblems, huntBoard, shuffle, stopOptions } from "./game-pool.js";
import { sortBoard } from "./sort-game.js";

export const PAPER_GAMES = [
  { id: "match", name: "Fact Match" },
  { id: "hunt", name: "Target Hunt" },
  { id: "sort", name: "Answer Sort" },
];
const LETTERS = "ABCDEFGHIJKL";
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const fmt = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });

const header = (grade, title, directions) =>
  `<header><p>Math Fluency Lab · Grade ${grade}</p><h1>${esc(title)}</h1><p>Name: ____________________ Date: __________</p></header><p class="print-directions">${esc(directions)}</p>`;

function matchSheet(grade, stop) {
  const items = gameProblems(grade, stop, 6, { distinctAnswers: true, comeback: false });
  const answers = shuffle(items.map((item, id) => ({ id, text: answerText(item) })));
  const page = `<article class="packet-page paper-game">${header(grade, "Fact Match", "Work out each problem. Write the letter of its answer on the line.")}
    <div class="paper-match"><ol>${items.map((item) => `<li><span>${esc(cardText(item))}</span><i>____</i></li>`).join("")}</ol>
    <ul class="paper-answers">${answers.map((a, i) => `<li><b>${LETTERS[i]}</b> ${esc(a.text)}</li>`).join("")}</ul></div></article>`;
  const key = `<p><b>Fact Match:</b> ${items.map((item, i) => `${i + 1}. ${LETTERS[answers.findIndex((a) => a.id === i)]}`).join(" · ")}</p>`;
  return { page, key };
}

function huntSheet(grade, stop) {
  const rounds = Array.from({ length: 3 }, () => huntBoard(grade, stop));
  const page = `<article class="packet-page paper-game">${header(grade, "Target Hunt", "Circle every problem whose answer is the target number.")}
    ${rounds.map(({ targetText, cards }, r) => `<section class="paper-hunt"><h2>Round ${r + 1}: target ${esc(targetText)}</h2><div>${cards.map((item) => `<span>${esc(cardText(item))}</span>`).join("")}</div></section>`).join("")}</article>`;
  const key = `<p><b>Target Hunt:</b> ${rounds.map(({ target, targetText, cards }, r) => `Round ${r + 1} (${esc(targetText)}): ${cards.filter((item) => answerOf(item) === target).map((item) => esc(cardText(item))).join(", ")}`).join(" · ")}</p>`;
  return { page, key };
}

function sortSheet(grade, stop) {
  const { cards, line, lineText } = sortBoard(grade, stop, 8, { comeback: false });
  const page = `<article class="packet-page paper-game">${header(grade, "Answer Sort", `Work out each answer. Write the letter of each problem in the box where its answer belongs.`)}
    <ul class="paper-sort-cards">${cards.map((item, i) => `<li><b>${LETTERS[i]}</b> ${esc(cardText(item))}</li>`).join("")}</ul>
    <div class="paper-bins"><div><b>Less than ${lineText}</b></div><div><b>${lineText} or more</b></div></div></article>`;
  const letters = (test) => cards.map((item, i) => (test(answerOf(item)) ? LETTERS[i] : null)).filter(Boolean).join(", ");
  const key = `<p><b>Answer Sort:</b> Less than ${lineText}: ${letters((n) => n < line)} · ${lineText} or more: ${letters((n) => n >= line)}</p>`;
  return { page, key };
}

const BUILDERS = { match: matchSheet, hunt: huntSheet, sort: sortSheet };

// `games` is a list of game ids; each prints one fresh page. The key, when asked for, is one separate page.
export function paperSheets(grade, stop, games, { includeKey = false } = {}) {
  const sheets = games.filter((id) => BUILDERS[id]).map((id) => BUILDERS[id](grade, stop));
  if (!sheets.length) throw new Error("Choose at least one game to print.");
  const key = includeKey ? `<article class="packet-page teacher-answer-page"><h1>Teacher answer key</h1>${sheets.map((sheet) => sheet.key).join("")}</article>` : "";
  return sheets.map((sheet) => sheet.page).join("") + key;
}

export function mountPaperGames(container, { grade, stopsFor, onPrint }) {
  container.insertAdjacentHTML(
    "beforeend",
    `<section class="class-snapshot paper-games" aria-labelledby="paper-title"><h3 id="paper-title">Paper game sheets</h3><p>Print fresh sheets for stations or screen-free practice. Every print makes new problems.</p>
    <div class="form-row"><label for="paper-game">Game<select id="paper-game"><option value="all">All three games</option>${PAPER_GAMES.map((g) => `<option value="${g.id}">${g.name}</option>`).join("")}</select></label>
    <label for="paper-stop">Facts<select id="paper-stop">${stopOptions(stopsFor(grade), ALL_STOPS, "Everything on the grade's trail")}</select></label></div>
    <label class="inline-check"><input type="checkbox" id="paper-key"/> Add a separate teacher answer-key page</label>
    <div class="button-row"><button type="button" class="primary-action" id="paper-print">Print game sheets</button></div><p id="paper-error" role="status"></p></section>`,
  );
  container.querySelector("#paper-print").addEventListener("click", () => {
    const choice = container.querySelector("#paper-game").value;
    try {
      onPrint(paperSheets(grade, container.querySelector("#paper-stop").value, choice === "all" ? PAPER_GAMES.map((g) => g.id) : [choice], { includeKey: container.querySelector("#paper-key").checked }));
    } catch (error) {
      container.querySelector("#paper-error").textContent = error.message;
    }
  });
}
