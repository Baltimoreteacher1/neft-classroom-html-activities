// Spell Duel (inspired by quest-and-battle math games): pick a creature, choose a spell, answer to cast it. Wrong
// answers cost nothing (steps, a second try, then the answer), there is no timer, and stars never depend on speed.
// Gold, a hatching pet companion, zones that open as bosses are calmed, and daily quests all live on the device.
import {
  battleOver,
  castRight,
  chooseCompanion,
  buyEgg,
  claimQuest,
  finishBattle,
  newBattle,
  passRound,
  spellById,
} from "./duel-core.js";
import { PETS } from "./duel-data.js";
import { battleHtml, mapHtml, petIcon } from "./duel-views.js";
import { feedbackAction, phaseFor } from "./feedback-host.js";
import { ALL_STOPS, answerText, gameProblem } from "./game-pool.js";
import { t } from "./i18n.js";
import { validateAnswer } from "./problem-bank.js";
import { loadRewards, saveRewards } from "./rewards.js";
import { speak, syncLive } from "./speech.js";
import { peekCap } from "./step-leak.js";

export function playDuel(host, { grade, stop = ALL_STOPS, calm, finish, onFact }) {
  const rewards = loadRewards();
  const duel = rewards.duel;
  const save = () => saveRewards(rewards);
  let battle = null;
  let ui = null;
  const missed = [];

  function renderMap(message = "") {
    battle = null;
    ui = null;
    host.innerHTML = mapHtml(duel, message);
    syncLive(host);
  }

  function dealCard() {
    const seen = new Set(ui.seen);
    let card = gameProblem(grade, stop);
    for (let tries = 0; seen.has(card.question) && tries < 20; tries += 1)
      card = gameProblem(grade, stop);
    ui.seen.push(card.question);
    Object.assign(ui, {
      card,
      tries: 0,
      peek: 0,
      solved: false,
      shown: "",
      note: "",
      fb: null,
      cap: peekCap(card),
    });
    ui.steps = ui.cap > 0 ? card.steps : [];
  }

  function renderBattle(focus = true) {
    host.innerHTML = battleHtml(ui);
    if (!focus) return syncLive(host);
    if (ui.solved) host.querySelector("[data-gm-next]")?.focus();
    else host.querySelector("#gm-input").focus();
    syncLive(host);
  }

  function begin(creatureId) {
    battle = newBattle(duel, creatureId, { calm });
    if (!battle) return renderMap(t("Calm the earlier creatures first."));
    ui = { duel, battle, spell: ui?.spell || "spark", seen: [] };
    dealCard();
    renderBattle();
  }

  function conclude() {
    const result = finishBattle(duel, battle);
    save();
    const name = t(battle.creature.name);
    const gold = t("+{n} gold", { n: battle.gold + result.bonus });
    finish({
      game: "duel",
      stars: result.stars,
      missed,
      line: `${result.won ? t("{name} calmed down.", { name }) : t("{name} wandered off. Try again!", { name })} · ${gold}`,
    });
  }

  function advance() {
    if (battleOver(battle)) return conclude();
    dealCard();
    renderBattle();
  }

  function answer(typed) {
    const { card } = ui;
    const nextLabel = () => (battleOver(battle) ? t("See results") : t("Next problem"));
    if (validateAnswer(typed, card)) {
      const first = ui.tries === 0;
      const spell = spellById(ui.spell);
      const hit = castRight(duel, battle, ui.spell, first);
      save();
      onFact?.(card, first);
      ui.solved = true;
      const line = t("{spell} hit for {n}!", { spell: t(spell.name), n: hit.damage });
      ui.note = `${spell.icon} ${line}${hit.weak ? ` ${t("Super effective!")}` : ""}`;
      ui.fb = {
        phase: phaseFor("duel", first ? "right" : "right-after-miss"),
        ctx: { expected: answerText(card), next: nextLabel() },
      };
      return renderBattle();
    }
    ui.tries += 1;
    if (ui.tries === 1) {
      ui.peek = 1;
      ui.note = t("Not yet. Look at the steps, then try once more.");
      ui.fb = { phase: phaseFor("duel", "miss"), ctx: { submitted: typed.trim() } };
      ui.shown = "";
      return renderBattle();
    }
    passRound(battle);
    onFact?.(card, false);
    missed.push(card);
    ui.solved = true;
    ui.note = t("This one is tricky. It will wait for you in the review.");
    ui.fb = {
      phase: phaseFor("duel", "revealed"),
      ctx: { submitted: typed.trim(), expected: answerText(card), next: nextLabel() },
    };
    renderBattle();
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    if (!ui || ui.solved) return;
    const typed = host.querySelector("#gm-input").value;
    if (!typed.trim()) return;
    ui.shown = typed;
    answer(typed);
  };

  function mapAction(target) {
    const creature = target.closest("[data-creature]");
    if (creature) return begin(creature.dataset.creature);
    const claim = target.closest("[data-claim]");
    if (claim) {
      const gold = claimQuest(duel, claim.dataset.claim);
      save();
      return renderMap(gold ? t("Quest done! +{n} gold", { n: gold }) : "");
    }
    if (target.closest("[data-egg]")) {
      const result = buyEgg(duel);
      save();
      if (result.error === "gold")
        return renderMap(t("You need {n} more gold for an egg.", { n: result.need }));
      return renderMap(
        result.pet
          ? `${petIcon(result.pet, 0)} ${t("{name} hatched! Your pet is ready to help.", { name: t(result.pet.name) })}`
          : "",
      );
    }
    const pet = target.closest("[data-pet]");
    if (pet) {
      chooseCompanion(duel, pet.dataset.pet);
      save();
      const chosen = PETS.find((entry) => entry.id === duel.active);
      return renderMap(chosen ? t("{name} is your companion.", { name: t(chosen.name) }) : "");
    }
  }

  host.onclick = (event) => {
    if (!battle) return mapAction(event.target);
    const action = feedbackAction(event);
    if (action === "next" && ui.solved) return advance();
    if (action === "try-again") {
      ui.fb = null;
      ui.note = "";
      return renderBattle();
    }
    const spell = event.target.closest("[data-spell]");
    if (spell) {
      ui.spell = spell.dataset.spell;
      for (const button of host.querySelectorAll("[data-spell]"))
        button.setAttribute("aria-pressed", String(button === spell));
      return;
    }
    if (event.target.closest("[data-duel-map]")) return renderMap();
    if (event.target.closest("[data-gm-read]")) return speak(ui.card.question);
    if (event.target.closest("[data-step]") && !ui.solved) {
      ui.peek += 1;
      renderBattle();
    }
  };

  renderMap();
  return () => {
    host.onclick = null;
    host.onsubmit = null;
  };
}
