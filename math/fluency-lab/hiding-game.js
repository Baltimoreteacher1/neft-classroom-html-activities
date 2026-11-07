// How Many Are Hiding? (K-2 part-whole, K.OA.A.3 and 1.OA.D.8). The total is known, some counters show, a leaf hides the
// rest, and the child sets the hidden part with big +/- buttons. Untimed, no luck, a win state (Pip's garden in bloom).
// A wrong try never takes a choice away and never shows the answer. Evidence goes to the matching skill through the
// shared onEvidence seam. Audio-first mode (feat/fl-k2-audio-first) reads the messages through syncLive; this game also
// calls the optional hook window.fluencyGameHooks.speak(text, { game, kind, lang }) when a page provides one.
import { esc } from "./arcade-shared.js";
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { flower, guessTray, hiddenZone, pet, shownZone } from "./hiding-art.js";
import {
  GAME_ID,
  MAX_FLOWERS,
  clampSetting,
  cleanGarden,
  grow,
  independentRound,
  isRight,
  makePlan,
  reviewItem,
  skillKeyFor,
  stagesFor,
  starsFor,
} from "./hiding-core.js";
import { getLang, t } from "./i18n.js";
import { profileKey, profiles, readLocal, writeLocal } from "./school-tools.js";
import { canSpeak, speak, syncLive } from "./speech.js";

const GARDEN_KEY = "ewl-fluency-hiding-garden-v1";
const gardenKey = () => profileKey(GARDEN_KEY, profiles().active);
export const loadGarden = () => cleanGarden(readLocal(gardenKey(), {}));
const saveGarden = (garden) => writeLocal(gardenKey(), garden);

const thingName = (round) => (getLang() === "es" ? round.thing.es : round.thing.en);

// Optional hook for the audio-first layer: a page may set window.fluencyGameHooks = { speak(text, info) }.
function say(text, kind) {
  try {
    globalThis.fluencyGameHooks?.speak?.(text, { game: GAME_ID, kind, lang: getLang() });
  } catch {
    // A broken hook must never stop the game.
  }
}

const promptText = (round) =>
  t(
    "Pip hid some {things} under a leaf. There are {total} {things} in all. You can see {shown}. How many are hiding?",
    {
      things: thingName(round),
      total: round.total,
      shown: round.shown,
    },
  );

const button = (id, label, text, extra = "") =>
  `<button type="button" class="hd-btn" data-hd="${id}" aria-label="${esc(label)}"${extra}>${text}</button>`;

export function playHiding(host, { grade, calm, finish, onEvidence = () => {} }) {
  const plan = makePlan(grade, calm);
  const stages = stagesFor(grade);
  let at = 0;
  let setting = 0;
  let misses = 0;
  let supported = false;
  let solved = false;
  let note = "";
  let fb = null;
  let grown = 0;
  let firstTry = 0;
  const missed = [];

  const round = () => plan[at];
  const stageDone = () => at + 1 >= plan.length || plan[at + 1].stage !== round().stage;

  function gardenHtml() {
    const label = t("Your garden: {a} of {b} flowers grown", { a: grown, b: stages.length });
    return `<div class="hd-garden" role="img" aria-label="${esc(label)}">${stages.map((_, i) => flower(i < grown, i)).join("")}</div>`;
  }

  function render(focus = "") {
    const r = round();
    const things = thingName(r);
    const off = solved ? " disabled" : "";
    const stepper = [
      r.total > 10 ? button("minus5", t("Hide 5 fewer"), "−5", off) : "",
      button("minus", t("Hide one fewer"), "−", off),
      `<output class="hd-out" data-hd-out aria-label="${esc(t("{n} hiding under the leaf", { n: setting }))}">${setting}</output>`,
      button("plus", t("Hide one more"), "+", off),
      r.total > 10 ? button("plus5", t("Hide 5 more"), "+5", off) : "",
    ].join("");
    const tray = setting
      ? guessTray(setting, r.shown, r.thing.shape, supported, esc(t("My guess under the leaf")))
      : `<p class="hd-empty">${t("Nothing under the leaf yet. Use the + button.")}</p>`;
    host.innerHTML = `<div class="gm-play gm-hiding">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("How Many Are Hiding?")}</b><span>${t("Round {a} of {b}", { a: at + 1, b: plan.length })}</span></div>
      ${gardenHtml()}
      <div class="hd-story">${pet(false)}<p class="gm-ask hd-goal" id="hd-goal">${esc(promptText(r))}</p></div>
      <p class="hd-total"><b>${t("{n} in all", { n: r.total })}</b></p>
      <div class="hd-board">
        <figure class="hd-col"><figcaption>${t("You can see")}</figcaption>${shownZone(r.shown, r.thing.shape, esc(t("{n} {things} showing", { n: r.shown, things })))}</figure>
        <figure class="hd-col"><figcaption>${t("Under the leaf")}</figcaption>${hiddenZone({ count: r.hidden, shape: r.thing.shape, solved, leafLabel: esc(t("A leaf hides some of the {things}", { things })), revealLabel: esc(t("{n} {things} were hiding", { n: r.hidden, things })) })}</figure>
      </div>
      <div class="hd-set"><p class="hd-set-label" id="hd-set-label">${t("How many are hiding under the leaf?")}</p>
        <div class="hd-stepper" role="group" aria-labelledby="hd-set-label">${stepper}</div></div>
      <div class="hd-guess" data-hd-tray>${tray}</div>
      <div class="hd-actions">
        <button type="button" class="hd-btn hd-lift" data-hd="check"${off}>${t("Lift the leaf")}</button>
        <button type="button" class="hd-btn hd-help" data-hd="count" aria-pressed="${supported}"${off}>${t("Count with me")}</button>
        ${canSpeak() ? `<button type="button" class="hd-btn hd-read" data-hd="read">${t("Read to me")}</button>` : ""}
      </div>
      ${supported && !solved ? `<p class="hd-count-note">${t("Each counter you add says the next number. Does the last number match the {total} in all?", { total: r.total })}</p>` : ""}
      ${feedbackNoteHtml(esc(note), fb)}</div>`;
    syncLive(host);
    const target =
      (focus && host.querySelector(`[data-hd="${focus}"]`)) ||
      (solved ? host.querySelector("[data-gm-next]") : host.querySelector('[data-hd="plus"]'));
    target?.focus();
  }

  function start() {
    setting = 0;
    misses = 0;
    supported = false;
    solved = false;
    note = "";
    fb = null;
    render();
    say(promptText(round()), "prompt");
  }

  function check() {
    if (solved) return;
    const r = round();
    const skillKey = skillKeyFor(r.total);
    if (!isRight(r, setting)) {
      if (misses === 0) onEvidence({ skillKey, grade, correct: false, independent: false });
      misses += 1;
      note =
        misses >= 2 && !supported
          ? t("Not yet. Try “Count with me” to count on from {shown}.", { shown: r.shown })
          : t(
              "Not yet. The {shown} you can see and the part hiding must make {total}. Change your number and try again.",
              { shown: r.shown, total: r.total },
            );
      fb = { phase: phaseFor(GAME_ID, "miss"), ctx: { submitted: String(setting) } };
      render("check");
      say(note, "feedback");
      return;
    }
    const independent = independentRound({ misses, supported });
    if (independent) firstTry += 1;
    else missed.push(reviewItem(r));
    onEvidence({ skillKey, grade, correct: true, independent });
    solved = true;
    const last = at + 1 >= plan.length;
    const done = stageDone();
    if (done) grown += 1;
    note =
      t("Yes! {shown} and {hidden} make {total}.", {
        shown: r.shown,
        hidden: r.hidden,
        total: r.total,
      }) + (done && !last ? ` ${t("A flower grew in your garden!")}` : "");
    fb = {
      phase: phaseFor(GAME_ID, independent ? "right" : "right-after-miss"),
      ctx: { expected: String(r.hidden), next: last ? t("See my garden") : t("Next round") },
    };
    render();
    say(note, "feedback");
  }

  function win() {
    const saved = grow(loadGarden(), grown);
    saveGarden(saved);
    const shownFlowers = Math.min(saved.flowers, MAX_FLOWERS);
    host.innerHTML = `<div class="gm-play gm-hiding hd-win">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("How Many Are Hiding?")}</b></div>
      ${gardenHtml()}
      ${pet(true)}
      <h3 class="hd-win-title">${t("Pip’s garden is in full bloom!")}</h3>
      <p class="gm-note" role="status">${t("You worked out every hidden part. Your garden now has {n} flowers.", { n: saved.flowers })}</p>
      <div class="hd-garden hd-garden-all" role="img" aria-label="${esc(t("Your garden: {a} of {b} flowers grown", { a: shownFlowers, b: MAX_FLOWERS }))}">${Array.from({ length: MAX_FLOWERS }, (_, i) => flower(i < shownFlowers, i)).join("")}</div>
      <button type="button" class="hd-btn hd-lift" data-hd="finish">${t("See my stars")}</button></div>`;
    say(t("Pip’s garden is in full bloom!"), "win");
    host.querySelector('[data-hd="finish"]')?.focus();
    syncLive(host);
  }

  function next() {
    if (!solved) return;
    at += 1;
    if (at >= plan.length) return win();
    start();
  }

  function step(delta) {
    if (solved) return;
    setting = clampSetting(round(), setting + delta);
    const big = Math.abs(delta) === 5;
    render(delta > 0 ? (big ? "plus5" : "plus") : big ? "minus5" : "minus");
  }

  host.onclick = (event) => {
    const action = feedbackAction(event);
    if (action === "next") return next();
    if (action === "try-again") {
      fb = null;
      note = "";
      return render("plus");
    }
    const id = event.target.closest("[data-hd]")?.dataset.hd;
    if (id === "plus") return step(1);
    if (id === "minus") return step(-1);
    if (id === "plus5") return step(5);
    if (id === "minus5") return step(-5);
    if (id === "check") return check();
    if (id === "count") {
      supported = !supported;
      return render("count");
    }
    if (id === "read") return speak(promptText(round()), getLang());
    if (id === "finish") {
      const total = plan.length;
      return finish({
        game: GAME_ID,
        stars: starsFor(firstTry, total),
        missed,
        line: t("{a} of {b} rounds on the first try, with no help", { a: firstTry, b: total }),
      });
    }
  };
  host.onkeydown = (event) => {
    if (!event.target.closest?.(".hd-stepper")) return;
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    step(delta);
  };
  start();
  return () => {
    host.onclick = null;
    host.onkeydown = null;
  };
}
