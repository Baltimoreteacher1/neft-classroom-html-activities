// Spell Duel screens: the map (zones, quests, pets) and a duel in progress. Markup only; duel-game.js owns the state.
import { EGG_COST, PETS, PET_STAGES, SPELLS, ZONES } from "./duel-data.js";
import {
  creatureOpen,
  eggsLeft,
  petLevel,
  petNext,
  questProgress,
  questsFor,
  rollDay,
  zoneOpen,
} from "./duel-core.js";
import { feedbackNoteHtml } from "./feedback-host.js";
import { t } from "./i18n.js";
import { canSpeak } from "./speech.js";
import { mathText, stepsBlock } from "./trail-pictures.js";

export const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const petIcon = (pet, xp) => pet.icons[petLevel(xp)];
const goldBadge = (gold) =>
  `<span class="dl-gold" role="img" aria-label="${t("{n} gold", { n: gold })}">🪙 ${gold}</span>`;

function creatureButton(duel, creature) {
  const open = creatureOpen(duel, creature);
  const beaten = duel.beaten.includes(creature.id);
  let status = creature.boss
    ? t("Boss")
    : t("Energy {n}", { n: creature.energy + creature.zoneIndex });
  if (beaten) status = `✓ ${t("Calmed")}`;
  else if (!open)
    status = zoneOpen(duel, creature.zoneIndex) ? t("Calm the others first") : t("Locked");
  return `<li><button type="button" class="dl-creature${beaten ? " done" : ""}" data-creature="${creature.id}"${open ? "" : " disabled"}><span class="dl-face" aria-hidden="true">${creature.icon}</span><b>${t(creature.name)}</b><small>${esc(status)}</small></button></li>`;
}

const zoneHtml = (duel, zone, index) => {
  const open = zoneOpen(duel, index);
  const need = index ? ZONES[index - 1] : null;
  return `<section class="dl-zone" aria-labelledby="dl-z-${zone.id}"><h3 id="dl-z-${zone.id}"><span aria-hidden="true">${zone.icon}</span> ${t(zone.name)}</h3>${open ? "" : `<p class="gm-note">${t("Calm the boss of {zone} to open this zone.", { zone: t(need.name) })}</p>`}<ul class="dl-creatures">${zone.creatures.map((creature) => creatureButton(duel, { ...creature, zone: zone.id, zoneIndex: index })).join("")}</ul></section>`;
};

function questsHtml(duel) {
  const day = rollDay(duel);
  const items = questsFor(day.date).map((quest) => {
    const done = questProgress(day, quest) >= quest.goal;
    const claimed = day.claimed.includes(quest.id);
    const action = claimed
      ? `<span class="dl-claimed">✓ ${t("Collected")}</span>`
      : `<button type="button" class="tr-tool" data-claim="${quest.id}"${done ? "" : " disabled"}>${t("Collect {n} gold", { n: quest.gold })}</button>`;
    return `<li><span>${t(quest.name)}</span><progress max="${quest.goal}" value="${questProgress(day, quest)}" aria-label="${esc(t(quest.name))}">${questProgress(day, quest)} / ${quest.goal}</progress><small>${questProgress(day, quest)} / ${quest.goal}</small>${action}</li>`;
  });
  return `<section class="dl-quests" aria-labelledby="dl-q"><h3 id="dl-q">${t("Today’s quests")}</h3><ul>${items.join("")}</ul></section>`;
}

function petsHtml(duel) {
  const owned = PETS.filter((pet) => pet.id in duel.pets);
  const left = eggsLeft(duel).length;
  const cards = owned.map((pet) => {
    const xp = duel.pets[pet.id];
    const next = petNext(xp);
    return `<li><button type="button" class="dl-pet" data-pet="${pet.id}" aria-pressed="${duel.active === pet.id}"><span class="dl-face" aria-hidden="true">${petIcon(pet, xp)}</span><b>${t(pet.name)}</b><small>${t(PET_STAGES[petLevel(xp)])}${next ? ` · ${t("{n} more to grow", { n: next - xp })}` : ` · ${t("Fully grown")}`}</small></button></li>`;
  });
  const egg = left
    ? `<button type="button" class="tr-go dl-egg" data-egg>${t("Hatch an egg")} · 🪙 ${EGG_COST}</button>`
    : `<p class="gm-note">${t("You found every pet!")}</p>`;
  return `<section class="dl-pets" aria-labelledby="dl-p"><h3 id="dl-p">${t("Pets")}</h3><p class="gm-note">${t("Your pet trains with every spell that lands. A fully grown pet adds 1 to every spell.")}</p>${cards.length ? `<ul class="dl-creatures">${cards.join("")}</ul>` : ""}${egg}</section>`;
}

export function mapHtml(duel, message = "") {
  return `<div class="gm-play gm-duel">
    <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Spell Duel")}</b>${goldBadge(duel.gold)}</div>
    <p class="gm-ask">${t("Pick a creature. Choose a spell, then answer to cast it. Wrong answers never hurt your wizard, and there is no timer.")}</p>
    ${message ? `<p class="gm-note" role="status">${esc(message)}</p>` : ""}
    ${questsHtml(duel)}${petsHtml(duel)}
    <div class="dl-zones">${ZONES.map((zone, index) => zoneHtml(duel, zone, index)).join("")}</div></div>`;
}

const spellButtons = (creature, spell) =>
  SPELLS.map(
    (entry) =>
      `<button type="button" class="dl-spell" data-spell="${entry.id}" aria-pressed="${entry.id === spell}"><span aria-hidden="true">${entry.icon}</span> ${t(entry.name)}${creature.weak === entry.id ? ` <small>${t("Strong")}</small>` : ""}</button>`,
  ).join("");

// One duel round: the creature and its energy, the four spells, the problem, and the shared feedback panel.
export function battleHtml(ui) {
  const { duel, battle, card, spell, tries, peek, solved, shown, note, fb } = ui;
  const { creature } = battle;
  const pet = PETS.find((entry) => entry.id === duel.active);
  const steps =
    ui.steps.length && tries && !solved
      ? stepsBlock(ui.steps, Math.max(1, peek), { id: "dl-steps", cap: ui.cap })
      : "";
  return `<div class="gm-play gm-duel">
    <div class="gm-bar"><button type="button" class="tr-back" data-duel-map>${t("← Duel map")}</button><b>${t(creature.name)}</b>${goldBadge(duel.gold)}</div>
    <div class="dl-arena"><span class="dl-face big" aria-hidden="true">${creature.icon}</span>
      <progress class="dl-energy" max="${battle.max}" value="${battle.energy}" aria-label="${t("Creature energy")}">${battle.energy}</progress>
      <p class="gm-note">${t("Energy {a} of {b}", { a: battle.energy, b: battle.max })} · ${t("Round {a} of {b}", { a: Math.min(battle.round + 1, battle.limit), b: battle.limit })}${pet ? ` · <span aria-hidden="true">${petIcon(pet, duel.pets[pet.id])}</span> ${t(pet.name)}` : ""}</p></div>
    <div class="dl-spells" role="group" aria-label="${t("Choose a spell")}">${spellButtons(creature, spell)}</div>
    <form class="gm-ask-form" autocomplete="off"><p class="gm-q" id="gm-q">${mathText(card.question)}</p>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
      <div class="tr-answer"><label class="tr-sr" for="gm-input">${t("Your answer")}</label><input id="gm-input" class="tr-input" inputmode="${card.kind === "number" ? "decimal" : "text"}" spellcheck="false" aria-describedby="gm-q" value="${esc(shown)}"${solved ? " disabled" : ""} /><button type="submit" class="tr-check"${solved ? " disabled" : ""}>${t("Cast spell")}</button></div>
      ${steps}</form>
    ${feedbackNoteHtml(esc(note), fb)}</div>`;
}
