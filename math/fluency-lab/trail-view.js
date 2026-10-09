// Fact Trail screens: trail map → strategy card → 10-problem round → stars. Untimed by design.
import { getGrade, seededRandom, validateAnswer } from "./problem-bank.js";
import {
  BANDS,
  TRAILS,
  bandFor,
  factStatus,
  getStation,
  loadTrail,
  makeProblem,
  nextStation,
  recordFact,
  recordRound,
  saveTrail,
} from "./fact-trail.js";
import { handleModelTap, interactivePicture, mathText, stepsBlock, trailPicture } from "./trail-pictures.js";

const ROUND = 10;
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const starRow = (count, size = "") =>
  `<span class="tr-stars ${size}" aria-label="${count} of 3 stars">${[1, 2, 3].map((n) => `<span class="tr-star${n <= count ? " on" : ""}" aria-hidden="true">★</span>`).join("")}</span>`;
const spoken = (text) =>
  text
    .replaceAll("×", " times ")
    .replaceAll("÷", " divided by ")
    .replaceAll("−", " minus ")
    .replaceAll("= ?", " equals what?")
    .replace(/\^(\d+)/g, " to the power of $1")
    .replaceAll("√", "the square root of ");

export function mountTrail(container, { grade, onShowSkills }) {
  const trail = TRAILS[grade];
  const words = BANDS[bandFor(grade)];
  const color = getGrade(grade).color;
  let data = loadTrail();
  let round = null;
  let cardState = null;
  const listeners = new container.ownerDocument.defaultView.AbortController();
  let timer = null;

  container.style.setProperty("--trail", color);
  container.dataset.band = bandFor(grade);

  const on = (type, handler) => container.addEventListener(type, handler, { signal: listeners.signal });

  // The model sits beside every problem: open for Grades 1-5, one tap away for Grades 6-8.
  function liveModel(item) {
    const html = interactivePicture(item.model);
    if (!html) return "";
    if (bandFor(grade) === "upper" && !round.modelOpen) return `<button type="button" class="tr-tool tr-model-open" data-model-open>Use a model</button>`;
    return `<div class="tr-model">${html}</div>`;
  }

  // Guided steps for the current problem, stopping before the step that states the answer.
  function renderPeek() {
    const { item } = round.queue[round.index];
    const steps = item.steps || [];
    const slot = container.querySelector("#tr-peek-slot");
    if (!slot) return;
    const body = steps.length > 1 ? stepsBlock(steps, round.peek, { id: "peek-steps", cap: steps.length - 1 }) : `<p class="tr-tip">${mathText(item.hint)}</p>`;
    slot.innerHTML = `<div class="tr-peek">${interactivePicture(item.model) ? "" : trailPicture(item.model)}${body}</div>`;
    slot.querySelector("[data-step]")?.focus();
  }

  function keepTyping(render) {
    const value = container.querySelector("#tr-input")?.value || "";
    render();
    const input = container.querySelector("#tr-input");
    if (input) input.value = value;
  }

  function playing(on) {
    document.body.classList.toggle("trail-playing", on);
    if (on) container.scrollIntoView?.({ block: "start" });
  }

  function stationStars(id) {
    return data.stations[`${grade}:${id}`]?.stars || 0;
  }

  function renderMap() {
    clearTimeout(timer);
    round = null;
    cardState = null;
    playing(false);
    const next = nextStation(data, grade);
    const earned = trail.stations.reduce((sum, entry) => sum + stationStars(entry.id), 0);
    const done = trail.stations.filter((entry) => stationStars(entry.id) >= 2).length;
    container.innerHTML = `
      <header class="tr-head">
        <div>
          <h2 id="trail-title">${esc(words.trail)}</h2>
          <p class="tr-focus">Grade ${grade}: ${esc(trail.focus)}</p>
        </div>
        <div class="tr-tally" aria-label="${done} of ${trail.stations.length} stops done, ${earned} stars">
          <span><b>${done}</b> of ${trail.stations.length} stops</span>
          <span><b class="tr-gold">★ ${earned}</b> stars</span>
        </div>
      </header>
      <ol class="tr-map">
        ${trail.stations
          .map((entry, index) => {
            const stars = stationStars(entry.id);
            const isNext = entry === next;
            return `<li class="tr-stop${stars >= 2 ? " done" : ""}${isNext ? " next" : ""}">
              <button type="button" data-station="${entry.id}" aria-label="Stop ${index + 1}: ${esc(entry.name)}, ${stars} of 3 stars${isNext ? ", your next stop" : ""}">
                <span class="tr-medal">${mathText(entry.label)}</span>
                <span class="tr-name">${esc(entry.name)}</span>
                ${starRow(stars)}
                ${isNext ? `<span class="tr-here">${stars ? "Keep going" : "Start here"}</span>` : ""}
              </button>
            </li>`;
          })
          .join("")}
      </ol>
      ${trail.chart ? renderChart() : ""}
      <p class="tr-more"><button type="button" class="tr-link" data-more-skills>More Grade ${grade} practice</button></p>`;
  }

  function renderChart() {
    const { op, max, sumMax } = trail.chart;
    const symbol = op === "add" ? "+" : "×";
    const counts = { known: 0, total: 0 };
    const head = `<tr><th scope="col"><span class="tr-sym">${symbol}</span></th>${Array.from({ length: max + 1 }, (_, c) => `<th scope="col">${c}</th>`).join("")}</tr>`;
    const rows = Array.from({ length: max + 1 }, (_, r) => {
      const cells = Array.from({ length: max + 1 }, (_, c) => {
        if (sumMax && r + c > sumMax) return `<td class="off" aria-hidden="true"></td>`;
        const status = factStatus(data, `${op}:${Math.min(r, c)}:${Math.max(r, c)}`);
        counts.total += 1;
        if (status === "known") counts.known += 1;
        const value = op === "add" ? r + c : r * c;
        return `<td class="${status}" title="${r} ${symbol} ${c} = ${value}">${status === "known" ? value : ""}</td>`;
      }).join("");
      return `<tr><th scope="row">${r}</th>${cells}</tr>`;
    }).join("");
    return `<section class="tr-chart" aria-labelledby="chart-title">
      <div class="tr-chart-head">
        <h3 id="chart-title">My fact chart</h3>
        <p>${counts.known} of ${counts.total} facts filled in. A fact fills in after you get it right twice on the first try.</p>
      </div>
      <div class="tr-chart-scroll"><table class="tr-grid ${op}">${head}${rows}</table></div>
      <p class="tr-legend"><span><i class="known"></i>I know it</span><span><i class="growing"></i>Getting there</span><span><i class="practice"></i>Practice more</span></p>
    </section>`;
  }

  function renderCard(id, shown = 1) {
    const entry = getStation(grade, id);
    // Show the station's strategy at its clearest: the sample (of 12) with the most guided steps.
    const rng = seededRandom(id.length * 31 + grade);
    const example = Array.from({ length: 12 }, () => makeProblem(grade, entry, rng)).reduce((best, item) => ((item.steps?.length || 0) > (best.steps?.length || 0) ? item : best));
    cardState = { id, example, shown };
    if (shown === 1) playing(true);
    const picture = trailPicture(example.model, { reveal: shown >= example.steps.length });
    container.innerHTML = `
      <div class="tr-card">
        <div class="tr-card-top">
          <button type="button" class="tr-back" data-map>← ${esc(words.trail)}</button>
          <p class="tr-kicker">${esc(entry.name)}</p>
        </div>
        <h2 class="tr-idea">${esc(entry.idea)}</h2>
        <div class="tr-lesson">
          <div class="tr-example">
            <p class="tr-example-fact">${mathText(example.question)}</p>
            ${picture}
          </div>
          <div class="tr-guide">
            <p class="tr-guide-title">Watch me solve it</p>
            ${stepsBlock(example.steps, shown, { id: "card-steps" })}
          </div>
        </div>
        <button type="button" class="tr-go" data-start="${entry.id}">${esc(words.start)}</button>
      </div>`;
    container.querySelector(shown >= example.steps.length ? "[data-start]" : "[data-step]")?.focus();
  }

  function startRound(id) {
    const entry = getStation(grade, id);
    const seen = new Set();
    const queue = [];
    for (let tries = 0; queue.length < ROUND && tries < 200; tries += 1) {
      const item = makeProblem(grade, entry);
      if (seen.has(item.question) && tries < 150) continue;
      seen.add(item.question);
      queue.push({ item, review: false });
    }
    playing(true);
    round = {
      entry,
      queue,
      index: 0,
      firstTry: 0,
      missed: [],
      phase: "ask",
      miss: false,
      results: [],
    };
    renderProblem();
  }

  function renderProblem() {
    const current = round.queue[round.index];
    const { item } = current;
    const answered = round.results.length;
    const dots = Array.from(
      { length: ROUND },
      (_, i) => `<span class="tr-dot ${round.results[i] ?? ""}"></span>`,
    ).join("");
    const keypad = words.keypad
      ? `<div class="tr-pad" aria-label="Number keys">${[
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          bandFor(grade) === "upper" ? "−" : "",
          0,
          "⌫",
        ]
          .map((key) =>
            key === ""
              ? "<span></span>"
              : `<button type="button" data-key="${key}" aria-label="${key === "⌫" ? "Delete" : key}">${key}</button>`,
          )
          .join("")}</div>`
      : "";
    const steps = item.steps || [];
    container.innerHTML = `
      <div class="tr-round">
        <div class="tr-round-top">
          <button type="button" class="tr-back" data-map>← ${esc(words.trail)}</button>
          <div class="tr-dots" aria-hidden="true">${dots}</div>
          <span class="tr-count">${current.review ? "One more look" : `${Math.min(answered + 1, ROUND)} of ${ROUND}`}</span>
        </div>
        <div class="tr-play">
          <div class="tr-main">
            <p class="tr-q" id="tr-q">${mathText(item.question)}</p>
            <form class="tr-answer" autocomplete="off">
              <label class="tr-sr" for="tr-input">Your answer</label>
              <input id="tr-input" class="tr-input" inputmode="${bandFor(grade) === "upper" ? "text" : "numeric"}" enterkeyhint="done" spellcheck="false" />
              <button type="submit" class="tr-check">${esc(words.check)}</button>
            </form>
            <p class="tr-feedback" role="status" aria-live="polite"></p>
            ${round.miss ? "" : liveModel(item)}
            ${
              round.miss
                ? `<div class="tr-help"><p class="tr-miss-title">${esc(words.miss)}</p><div class="tr-help-body">${trailPicture(item.model, { reveal: true })}${stepsBlock(steps, steps.length, { id: "miss-steps" })}</div><p class="tr-retype">${esc(words.retype)}</p></div>`
                : ""
            }
          </div>
          <div class="tr-side">
            ${keypad}
            <div class="tr-tools">
              ${round.miss ? "" : `<button type="button" class="tr-tool" data-peek>Show a step</button>`}
              ${"speechSynthesis" in window ? `<button type="button" class="tr-tool" data-read>${esc(words.read)}</button>` : ""}
            </div>
            ${round.miss ? "" : `<div id="tr-peek-slot"></div>`}
          </div>
        </div>
      </div>`;
    const input = container.querySelector("#tr-input");
    if (!words.keypad || !window.matchMedia?.("(pointer: coarse)").matches) input.focus();
  }

  function submit(value) {
    const current = round.queue[round.index];
    const feedback = container.querySelector(".tr-feedback");
    if (!String(value).trim()) return;
    const correct = validateAnswer(value, current.item);
    if (round.miss) {
      if (!correct) {
        feedback.textContent = `Type ${current.item.displayAnswer} to keep going.`;
        return;
      }
      round.miss = false;
      advance();
      return;
    }
    if (correct) {
      if (!current.review) {
        round.firstTry += 1;
        round.results.push("right");
        recordFact(data, current.item, true);
      }
      feedback.textContent = words.right[round.index % words.right.length];
      feedback.className = "tr-feedback good";
      container.querySelector(".tr-answer").classList.add("good");
      timer = setTimeout(advance, 650);
      return;
    }
    if (!current.review) {
      round.results.push("miss");
      round.missed.push(current.item);
      recordFact(data, current.item, false);
      if (round.queue.filter((entry) => entry.review).length < 3)
        round.queue.push({ item: current.item, review: true });
    }
    round.miss = true;
    round.peek = 0;
    saveTrail(data);
    renderProblem();
  }

  function advance() {
    round.index += 1;
    round.peek = 0;
    round.modelOpen = false;
    saveTrail(data);
    if (round.index >= round.queue.length) renderDone();
    else renderProblem();
  }

  function renderDone() {
    const stars = recordRound(data, grade, round.entry.id, round.firstTry, ROUND);
    saveTrail(data);
    const next = nextStation(data, grade);
    const practice = [...new Set(round.missed.map((item) => item.question.replace(" = ?", "")))];
    container.innerHTML = `
      <div class="tr-done">
        ${starRow(stars, "big")}
        <h2>${stars === 3 ? "Amazing round!" : stars === 2 ? "Great round!" : "Good practice!"}</h2>
        <p class="tr-score">You got <b>${round.firstTry} of ${ROUND}</b> on the first try.</p>
        ${practice.length ? `<div class="tr-review"><p>Facts to practice again:</p><ul>${practice.map((fact) => `<li>${mathText(fact)}</li>`).join("")}</ul></div>` : `<p class="tr-perfect">Every fact on the first try.</p>`}
        <div class="tr-done-actions">
          <button type="button" class="tr-go" data-start="${round.entry.id}">${esc(words.again)}</button>
          ${next && next !== round.entry ? `<button type="button" class="tr-go alt" data-card="${next.id}">${esc(words.next)}: ${esc(next.name)}</button>` : ""}
          <button type="button" class="tr-link" data-map>Back to the ${esc(words.trail.toLowerCase())}</button>
        </div>
      </div>`;
    container.querySelector(".tr-done-actions .tr-go").focus();
  }

  on("click", (event) => {
    const target = event.target.closest("button");
    if (!target || !container.contains(target)) return;
    if (handleModelTap(target)) return;
    if (target.hasAttribute("data-model-open") && round) {
      round.modelOpen = true;
      keepTyping(renderProblem);
      return;
    }
    if (target.dataset.station) renderCard(target.dataset.station);
    else if (target.dataset.card) renderCard(target.dataset.card);
    else if (target.dataset.start) startRound(target.dataset.start);
    else if (target.hasAttribute("data-map")) renderMap();
    else if (target.hasAttribute("data-more-skills")) onShowSkills?.();
    else if (target.hasAttribute("data-peek") && round) {
      round.peek = 1;
      renderPeek();
      target.remove();
    } else if (target.dataset.step === "card-steps" && cardState) renderCard(cardState.id, cardState.shown + 1);
    else if (target.dataset.step === "peek-steps" && round) {
      round.peek += 1;
      renderPeek();
    } else if (target.hasAttribute("data-read") && round) {
      speechSynthesis.cancel();
      speechSynthesis.speak(
        new SpeechSynthesisUtterance(spoken(round.queue[round.index].item.question)),
      );
    } else if (target.dataset.key) {
      const input = container.querySelector("#tr-input");
      const key = target.dataset.key;
      input.value =
        key === "⌫"
          ? input.value.slice(0, -1)
          : key === "−"
            ? input.value.startsWith("-")
              ? input.value.slice(1)
              : `-${input.value}`
            : input.value + key;
    }
  });
  on("submit", (event) => {
    event.preventDefault();
    if (round && !container.querySelector(".tr-answer.good"))
      submit(container.querySelector("#tr-input").value);
  });

  renderMap();
  return () => {
    listeners.abort();
    clearTimeout(timer);
    playing(false);
  };
}

