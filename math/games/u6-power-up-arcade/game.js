// Power Up! Exponent Arcade — game flow: title, fighter setup, cabinet, world map, the five battles
// of a world with two bonus rounds, and the results screen. No timer, and nothing ends a world early:
// mistakes cost combo, health and stars, never progress.

import { FORMS, monster } from "./art.js";
import { cleanName, HEROES, heroOf } from "./battle.js";
import { playCrystals, playGlitch } from "./bonus-view.js";
import { breakDown, closePad, HERO_MAX, playBattle, submit, tapToken, useSpot } from "./fight.js";
import { confetti, mountFx, setMuted, sfx } from "./fx.js";
import { makeWorld, WORLDS } from "./gen.js";
import { grant, persist, rankOf, save, shelf } from "./progress.js";
import { $, el, fmt, say, show } from "./ui.js";

if (!save.worlds || typeof save.worlds !== "object") save.worlds = {};
const worldsOf = (level) => {
  if (!Array.isArray(save.worlds[level])) save.worlds[level] = [];
  return save.worlds[level];
};
const unlocked = (level, w) => w === 0 || Boolean(worldsOf(level)[w - 1]);

let S = null;
let level = "regular";

function setMute(m) {
  save.muted = m;
  setMuted(m);
  for (const b of [$("btnMute"), $("btnMute2")]) {
    b.setAttribute("aria-pressed", String(m));
    b.textContent = b.id === "btnMute" ? (m ? "🔇 Sound off" : "🔊 Sound on") : m ? "🔇" : "🔊";
  }
  persist();
}

// ── fighter setup ────────────────────────────────────────────────────────────
function renderHeroes() {
  $("heroes").replaceChildren(
    ...HEROES.map((h) => {
      const b = el("button", "hero-btn");
      b.type = "button";
      b.dataset.hero = h.id;
      b.setAttribute("aria-pressed", String(save.hero === h.id));
      b.append(el("span", "hero-emoji", h.emoji), el("span", "hero-name", h.name));
      b.onclick = () => {
        save.hero = h.id;
        sfx("pick");
        for (const x of $("heroes").children) x.setAttribute("aria-pressed", String(x === b));
      };
      return b;
    }),
  );
}

function openSetup() {
  $("heroName").value = save.name || "";
  renderHeroes();
  show("v-setup");
  $("heroName").focus();
}

function openSelect() {
  const r = rankOf(save.xp);
  $("rankLine").textContent =
    `${heroOf(save.hero).emoji} ${save.name} · Rank: ${r.name}${r.next ? ` (${r.pct}% to next)` : ""}`;
  for (const lv of ["regular", "challenging"]) {
    const done = worldsOf(lv).filter(Boolean);
    const stars = done.reduce((n, w) => n + w.stars, 0);
    document.querySelector(`[data-best="${lv}"]`).textContent = done.length
      ? `Worlds cleared ${done.length}/3 · ${stars}★`
      : "No score yet";
  }
  shelf($("shelf"));
  show("v-select");
  document.querySelector(".cab-card").focus();
}

// ── world map ────────────────────────────────────────────────────────────────
function openMap(lv) {
  level = lv;
  $("mapSub").textContent =
    `${lv === "regular" ? "Regular" : "Challenging"} cabinet · clear a world to open the next one`;
  $("worlds").replaceChildren(
    ...WORLDS[lv].map((w, i) => {
      const open = unlocked(lv, i);
      const best = worldsOf(lv)[i];
      const b = el("button", `world-card w${i + 1}${open ? "" : " locked"}`);
      b.type = "button";
      b.disabled = !open;
      b.append(
        el("span", "world-no", `WORLD ${i + 1}`),
        el("span", "world-name", w.name),
        el("span", "world-mode", w.mode === "steps" ? "Warm-up: pick each step" : "Full problems"),
        el(
          "span",
          "world-best",
          open
            ? best
              ? `Best ${fmt(best.score)} · ${best.stars}/15 ★`
              : "Not cleared yet"
            : "🔒 Clear the world before",
        ),
      );
      b.onclick = () => startWorld(i);
      return b;
    }),
  );
  show("v-map");
  $("worlds").querySelector("button:not(:disabled)")?.focus();
}

// ── a world: five battles and two bonus rounds ───────────────────────────────
function fresh(world) {
  return {
    level,
    world,
    battles: makeWorld(level, world, (Date.now() % 1e9) + 1),
    battle: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    clean: 0,
    stars: 0,
    spot: 0,
    shield: 0,
    streak: 0,
    power: 0,
    heroHp: HERO_MAX,
    battleStars: [],
    bossPerfect: false,
    fullClean: 0,
    breakdowns: 0,
    crystalPerfect: false,
    glitchPerfect: false,
  };
}

async function bonus(kind) {
  show("v-bonus");
  $("bonusCoach").textContent = "";
  const seed = (Date.now() % 1e9) + S.world;
  const r =
    kind === "crystal" ? await playCrystals(level, seed, say) : await playGlitch(level, seed, say);
  S.score += r.points;
  if (kind === "crystal") S.crystalPerfect = r.perfect;
  else S.glitchPerfect = r.perfect;
}

async function startWorld(w) {
  S = fresh(w);
  const hero = heroOf(save.hero);
  $("heroArt").textContent = hero.emoji;
  $("heroLabel").textContent = save.name || "Player 1";
  const mode = WORLDS[level][w].mode;
  for (let b = 0; b < 5; b++) {
    S.battle = b;
    show("v-play");
    const stage = w * 5 + b;
    await playBattle(S, S.battles[b], mode, b === 4, FORMS[stage], monster(stage, b === 4));
    if (b === 1) await bonus("crystal");
    if (b === 3) await bonus("glitch");
  }
  endWorld();
}

function endWorld() {
  const title =
    S.stars >= 14
      ? "EXPONENT LEGEND"
      : S.stars >= 11
        ? "POWER PLAYER"
        : S.stars >= 8
          ? "RISING STAR"
          : "KEEP CHARGING";
  const list = worldsOf(level);
  const prev = list[S.world];
  const isNew = !prev || S.score > prev.score;
  if (isNew) list[S.world] = { score: S.score, stars: Math.max(S.stars, prev?.stars ?? 0) };
  save.xp = (save.xp || 0) + S.score;
  const full = WORLDS[level][S.world].mode === "full";
  const earned = [
    ["first", true],
    ["combo8", S.bestCombo >= 8],
    ["bossperfect", S.bossPerfect],
    ["fullsend", full && S.breakdowns === 0 && S.fullClean >= 5],
    ["crystal", S.crystalPerfect],
    ["glitch", S.glitchPerfect],
    ["challenger", level === "challenging"],
    ["flawless", S.stars === 15],
  ]
    .filter(([id, ok]) => ok && grant(id))
    .map(([id]) => id);
  persist();

  const last = S.world === 2;
  $("e-head").textContent = last ? "Cabinet cleared!" : `World ${S.world + 1} cleared!`;
  $("endTitle").textContent = title;
  $("endStars").textContent = `${S.stars} / 15 ★`;
  $("endScore").textContent = fmt(S.score);
  $("endCombo").textContent = `×${S.bestCombo}`;
  $("endClean").textContent = S.clean;
  $("endNew").hidden = !isNew;
  const r = rankOf(save.xp);
  $("endRank").textContent =
    `Rank: ${r.name} · ${fmt(save.xp)} XP${r.next ? ` · ${fmt(r.next - save.xp)} to next` : ""}`;
  $("endXp").style.width = `${r.pct}%`;
  shelf($("endBadges"), earned);
  $("btnNextWorld").hidden = last;
  show("v-end");
  confetti(160);
  sfx("win");
  say(`${title}. Score ${S.score}. ${S.stars} of 15 stars.`);
  (last ? $("btnMap") : $("btnNextWorld")).focus();
}

// ── wiring ───────────────────────────────────────────────────────────────────
function init() {
  mountFx($("fx"));
  document
    .querySelector(".bulbs")
    .replaceChildren(...Array.from({ length: 16 }, () => document.createElement("i")));
  setMute(save.muted);
  $("btnStart").onclick = () => {
    sfx("start");
    if (save.name) openSelect();
    else openSetup();
  };
  $("btnReady").onclick = () => {
    save.name = cleanName($("heroName").value);
    persist();
    sfx("start");
    openSelect();
  };
  $("heroName").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("btnReady").click();
  });
  $("btnSelectBack").onclick = openSetup;
  for (const c of document.querySelectorAll(".cab-card"))
    c.onclick = () => openMap(c.dataset.level);
  $("btnMapBack").onclick = openSelect;
  $("btnHow").onclick = () => $("howto").showModal();
  for (const b of [$("btnMute"), $("btnMute2")]) b.onclick = () => setMute(!save.muted);
  $("expr").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) tapToken(Number(b.dataset.i));
  });
  $("btnSpot").onclick = useSpot;
  $("pad").addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });
  $("padBack").onclick = closePad;
  $("padBreak").onclick = breakDown;
  $("pad").addEventListener("click", (e) => {
    const k = e.target.closest("button[data-k]")?.dataset.k;
    if (!k) return;
    const inp = $("padIn");
    sfx("key");
    // After a miss the wrong answer stays selected; like the keyboard, the next key replaces it.
    if (inp.value && inp.selectionStart === 0 && inp.selectionEnd === inp.value.length)
      inp.value = "";
    if (k === "back") inp.value = inp.value.slice(0, -1);
    else if (inp.value.length < 7) inp.value += k;
    inp.focus();
  });
  $("padIn").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
  $("pad").addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePad();
  });
  $("btnNextWorld").onclick = () => startWorld(S.world + 1);
  $("btnMap").onclick = () => openMap(level);
  $("btnTitle").onclick = () => show("v-title");
  $("btnStart").focus();
}

init();
