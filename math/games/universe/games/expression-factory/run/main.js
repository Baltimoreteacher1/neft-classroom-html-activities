// Factory Run — the page: menus, HUD, input, the loop, saving and reporting.
// Rules live in track.js (pure); the 3D view in scene.js.

import { createFeel } from "../../../../../../games/engine3d/feel.js";
import { quizPrompt } from "../quiz.js";
import { createWorld } from "./scene.js";
import { STRINGS } from "./strings.js";
import { input, newRun, STAGES, stars, stepOf, tick } from "./track.js";

const KEY = "ewl-factory-run-v1";
const SHOP = {
  skins: { teal: 0, blue: 40, green: 40, gold: 80, red: 80 },
  hats: { none: 0, cap: 30, antenna: 60, crown: 120 },
};
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function load() {
  const base = {
    bank: 0,
    stars: {},
    skins: ["teal"],
    hats: ["none"],
    skin: "teal",
    hat: "none",
    pace: "chill",
    sound: true,
  };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return base;
  }
}
const save = load();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage blocked: play on without saving */
  }
};
let lang = params.get("lang") === "es" ? "es" : save.lang === "es" ? "es" : "en";
const t = (k, vars = {}) =>
  (STRINGS[lang][k] ?? STRINGS.en[k] ?? k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? "");

const feel = createFeel({});
feel.setAudioEnabled(save.sound);
const sfx = (name) => feel.sfx(name);

let world = null;
try {
  world = createWorld($("stage"), { skin: save.skin, hat: save.hat, reduced });
} catch {
  $("menu").innerHTML =
    `<div class="card"><p>${t("noWebgl")}</p><a class="btn primary" href="../?classic=1">${t("classic")}</a></div>`;
}

let run = null;
let mode = "menu"; // menu | play | pause | done
let toastUntil = 0;
let clock = 0;

// ---------- HUD ----------
function promptText(r) {
  const st = stepOf(r);
  if (!st) return { q: "", ask: "" };
  return { q: quizPrompt(r.items[r.at], lang, t("when")), ask: t(st.ask) };
}

function nextRow(r) {
  const ahead = r.objs.filter(
    (o) => (o.kind === "gate" || o.kind === "wall") && !o.passed && o.z > r.dist,
  );
  if (!ahead.length) return [];
  const z = Math.min(...ahead.map((o) => o.z));
  return ahead.filter((o) => o.z === z);
}

let lastCards = "";
function paintHud() {
  const r = run;
  const p = promptText(r);
  $("q").textContent = p.q;
  $("ask").textContent = p.ask;
  $("stageName").textContent = t(STAGES[r.stage].key);
  $("crate").textContent = t("crate", {
    n: Math.min(r.at + 1, r.items.length),
    total: r.items.length,
  });
  $("gears").textContent = `⚙ ${r.gears}`;
  $("combo").textContent =
    r.combo > 1
      ? `🔥 ${t("combo", { n: Math.min(4, 1 + Math.floor(r.combo / 3)) })} · ${r.combo}`
      : "";
  $("powers").textContent =
    `${r.shield ? "🛡 " : ""}${r.magnetT > 0 ? `🧲${Math.ceil(r.magnetT)} ` : ""}${r.doubleT > 0 ? `×2 ${Math.ceil(r.doubleT)}` : ""}`;
  $("hint").textContent = r.hint
    ? `💡 ${t({ pickExpr: "hintWords", askSub: "hintSub", askMult: "hintMult", askSolve: "hintSolve" }[r.hint])}`
    : "";
  $("hint").hidden = !r.hint;
  $("bossBar").hidden = !r.boss;
  $("bossFill").style.width = `${Math.round(r.bossHp * 100)}%`;
  $("progress").style.width = `${Math.round((r.at / r.items.length) * 100)}%`;
  // Lane cards: the next gate row's choices, tap to steer into that lane.
  const row = nextRow(r);
  const sig = row.map((o) => `${o.lane}:${o.choice ?? "x"}:${o.broken ? 1 : 0}`).join("|") + r.lane;
  if (sig !== lastCards) {
    lastCards = sig;
    [0, 1, 2].forEach((lane) => {
      const b = $(`card${lane}`);
      const o = row.find((x) => x.lane === lane);
      b.querySelector(".v").textContent = o ? (o.kind === "wall" ? "✕" : o.choice) : "";
      b.disabled = !o || o.kind === "wall" || !!o.broken;
      b.classList.toggle("broken", !!o?.broken);
      b.classList.toggle("on", r.lane === lane);
      b.setAttribute(
        "aria-label",
        o && o.kind !== "wall" ? `${lane + 1}: ${o.choice}` : `${lane + 1}`,
      );
    });
  }
  if (clock > toastUntil) $("toast").hidden = true;
}

function toast(text, tone = "") {
  const el = $("toast");
  el.textContent = text;
  el.className = `toast ${tone}`;
  el.hidden = false;
  toastUntil = clock + 1.8;
  $("live").textContent = text;
}

// ---------- events from the rules ----------
function onEvent(e) {
  world?.fx(e, run);
  switch (e.type) {
    case "gate":
      if (e.ok) {
        sfx(e.combo >= 3 ? "win" : "correct");
        toast(t("right", { gears: 5 * e.mult }), "ok");
      } else {
        sfx("wrong");
        toast(e.choice ? t("wrong") : t("wall"), "bad");
      }
      report("decision", e);
      break;
    case "crate":
      if (e.boss) {
        sfx("pop");
        toast(t("bossHit"), "ok");
      }
      break;
    case "gear":
      sfx("add");
      break;
    case "blast":
      sfx("pop");
      break;
    case "quick":
      setTimeout(() => toast(t("quick", { n: e.gears }), "ok"), 700);
      break;
    case "power":
      sfx("fanfare");
      toast(t(e.power), "ok");
      break;
    case "stumble":
      sfx("remove");
      toast(STRINGS.en[`stumble_${e.kind}`] ? t(`stumble_${e.kind}`) : t("stumble"), "bad");
      break;
    case "shieldPop":
      sfx("pop");
      toast(t("shieldPop"), "ok");
      break;
    case "stageDone":
      finish(e);
      break;
  }
}

// ---------- the loop ----------
if (world)
  world.view.onFrame((dt) => {
    const step = Math.min(dt, 0.05);
    clock += step;
    if (mode === "play" && run) {
      for (const e of tick(run, step)) onEvent(e);
      paintHud();
    }
    if (run) world.sync(run, mode === "play" ? step : 0, clock);
  });


// ---------- input ----------
const KEYS = {
  ArrowLeft: "left",
  a: "left",
  ArrowRight: "right",
  d: "right",
  ArrowUp: "jump",
  w: "jump",
  " ": "jump",
  ArrowDown: "slide",
  s: "slide",
};
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (mode === "play") pause();
    else if (mode === "pause") resume();
    return;
  }
  if (mode !== "play") return;
  const cmd = KEYS[e.key] ?? (["1", "2", "3"].includes(e.key) ? { pick: Number(e.key) - 1 } : null);
  if (cmd === null) return;
  e.preventDefault();
  input(run, cmd);
});
let touch = null;
$("stage").addEventListener("pointerdown", (e) => {
  touch = { x: e.clientX, y: e.clientY };
});
$("stage").addEventListener("pointerup", (e) => {
  if (!touch || mode !== "play") return;
  const dx = e.clientX - touch.x;
  const dy = e.clientY - touch.y;
  touch = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return input(run, "jump");
  if (Math.abs(dx) > Math.abs(dy)) input(run, dx > 0 ? "right" : "left");
  else input(run, dy < 0 ? "jump" : "slide");
});
[0, 1, 2].forEach((lane) =>
  $(`card${lane}`).addEventListener("click", () => {
    if (mode === "play") input(run, { pick: lane });
  }),
);
$("btnJump").addEventListener("click", () => mode === "play" && input(run, "jump"));
$("btnSlide").addEventListener("click", () => mode === "play" && input(run, "slide"));
$("btnPause").addEventListener("click", () => (mode === "play" ? pause() : resume()));
document.addEventListener("visibilitychange", () => document.hidden && mode === "play" && pause());

// ---------- screens ----------
function screen(html, focus = ".primary") {
  const m = $("menu");
  m.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false;
  $("hud").hidden = mode !== "play" && mode !== "pause";
  m.querySelector(focus)?.focus();
}

const unlocked = (i) => i === 0 || save.stars[STAGES[i - 1].id] > 0;

function titleScreen() {
  mode = "menu";
  const stageBtns = STAGES.map((s, i) => {
    const got = save.stars[s.id] || 0;
    const lock = !unlocked(i);
    return `<button class="stage${lock ? " locked" : ""}" data-stage="${i}" ${lock ? `aria-disabled="true" title="${t("locked")}"` : ""}>
      <span class="n">${i === STAGES.length - 1 ? "🤖" : i + 1}</span><span class="nm">${t(s.key)}</span>
      <span class="st">${"★".repeat(got)}${"☆".repeat(3 - got)}</span></button>`;
  }).join("");
  const first = STAGES.findIndex((s, i) => unlocked(i) && !save.stars[s.id]);
  screen(`
    <h1>${t("title")}</h1>
    <p class="tag">${t("tagline")}</p>
    <h2>${t("map")}</h2>
    <div class="stages">${stageBtns}</div>
    <div class="row">
      <button class="btn primary" data-stage="${first < 0 ? 0 : first}">▶ ${t("play")}</button>
      <button class="btn" id="goShop">⚙ ${t("shop")} (${save.bank})</button>
    </div>
    <div class="row small">
      <span>${t("pace")}:</span>
      <button class="chip${save.pace === "chill" ? " on" : ""}" data-pace="chill">${t("chill")}</button>
      <button class="chip${save.pace === "normal" ? " on" : ""}" data-pace="normal">${t("normal")}</button>
      <span>${t("sound")}:</span>
      <button class="chip" id="snd">${save.sound ? t("on") : t("off")}</button>
      <button class="chip" id="lng">${t("lang")}</button>
    </div>
    <p class="how">${t("how")}</p>
    <a class="classic" href="../?lesson=6-5&classic=1${lang === "es" ? "&lang=es" : ""}">${t("classic")} →</a>`);
  const m = $("menu");
  m.querySelectorAll("[data-stage]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = Number(b.dataset.stage);
      if (unlocked(i)) start(i);
    }),
  );
  m.querySelectorAll("[data-pace]").forEach((b) =>
    b.addEventListener("click", () => {
      save.pace = b.dataset.pace;
      persist();
      titleScreen();
    }),
  );
  $("snd").addEventListener("click", () => {
    save.sound = !save.sound;
    feel.setAudioEnabled(save.sound);
    persist();
    titleScreen();
  });
  $("lng").addEventListener("click", () => {
    lang = lang === "en" ? "es" : "en";
    save.lang = lang;
    document.documentElement.lang = lang;
    persist();
    titleScreen();
  });
  $("goShop").addEventListener("click", shopScreen);
}

function shopScreen() {
  const item = (kind, id, cost) => {
    const owned = save[kind].includes(id);
    const worn = save[kind === "skins" ? "skin" : "hat"] === id;
    const label = t(`${kind === "skins" ? "skin" : "hat"}_${id}`);
    const action = worn ? t("wearing") : owned ? t("equip") : t("buy", { n: cost });
    const off = worn || (!owned && save.bank < cost);
    return `<button class="shopItem${worn ? " on" : ""}" data-kind="${kind}" data-id="${id}" ${off ? "disabled" : ""}>
      <span>${label}</span><span class="act">${action}</span></button>`;
  };
  screen(`
    <h1>${t("shopTitle")}</h1>
    <p class="bank">⚙ ${save.bank}</p>
    <div class="shop">${Object.entries(SHOP.skins)
      .map(([id, c]) => item("skins", id, c))
      .join("")}</div>
    <div class="shop">${Object.entries(SHOP.hats)
      .map(([id, c]) => item("hats", id, c))
      .join("")}</div>
    <div class="row"><button class="btn primary" id="back">${t("back")}</button></div>`);
  $("menu")
    .querySelectorAll(".shopItem")
    .forEach((b) =>
      b.addEventListener("click", () => {
        const { kind, id } = b.dataset;
        const cost = SHOP[kind][id];
        if (!save[kind].includes(id)) {
          if (save.bank < cost) return;
          save.bank -= cost;
          save[kind].push(id);
          sfx("fanfare");
        }
        if (kind === "skins") save.skin = id;
        else save.hat = id;
        persist();
        world?.setLook(save.skin, save.hat);
        shopScreen();
      }),
    );
  $("back").addEventListener("click", titleScreen);
}

function start(i) {
  world?.reset();
  run = newRun(i, { pace: save.pace, seed: Date.now() % 100000 });
  lastCards = "";
  mode = "play";
  $("menu").hidden = true;
  $("hud").hidden = false;
  sfx("select");
  toast(run.boss ? t("bossIntro") : t("startTip"), "ok");
  toastUntil = clock + 3.5;
  $("stage").focus();
}

function pause() {
  mode = "pause";
  screen(`<h1>${t("paused")}</h1>
    <div class="row"><button class="btn primary" id="res">${t("resume")}</button><button class="btn" id="quit">${t("quit")}</button></div>
    <p class="how">${t("how")}</p>`);
  $("res").addEventListener("click", resume);
  $("quit").addEventListener("click", titleScreen);
}

function resume() {
  mode = "play";
  $("menu").hidden = true;
  $("stage").focus();
}

function finish(e) {
  mode = "done";
  const s = STAGES[run.stage];
  const got = stars(e.firstTry, e.total);
  save.stars[s.id] = Math.max(save.stars[s.id] || 0, got);
  save.bank += e.gears;
  persist();
  sfx("fanfare");
  report("complete", e);
  const last = run.stage === STAGES.length - 1;
  screen(`
    <h1>${run.boss ? t("bossDown") : t("stageDone")}</h1>
    <p class="big">${"★".repeat(got)}${"☆".repeat(3 - got)}</p>
    <p>${t("stars", { n: e.firstTry, total: e.total })}</p>
    <p>${t("best", { n: e.best })} · ${t("earned", { n: e.gears })}</p>
    <div class="row">
      ${last ? "" : `<button class="btn primary" id="nxt">${t("next")} →</button>`}
      <button class="btn${last ? " primary" : ""}" id="agn">${t("again")}</button>
      <button class="btn" id="mp">${t("toMap")}</button>
    </div>`);
  $("nxt")?.addEventListener("click", () => start(run.stage + 1));
  $("agn").addEventListener("click", () => start(run.stage));
  $("mp").addEventListener("click", titleScreen);
}

// ---------- reporting (never blocks play) ----------
const tally = { right: 0, tried: 0, slips: new Set() };
function report(kind, e) {
  const w = /** @type {any} */ (window);
  if (kind === "decision") {
    tally.tried++;
    if (e.ok) tally.right++;
    if (e.misconception) tally.slips.add(e.misconception);
    return;
  }
  const doneStages = STAGES.filter((s) => save.stars[s.id] > 0).length;
  try {
    w.EduPulse?.record?.({
      activityId: "universe-expression-factory-run",
      score: tally.right,
      maxScore: Math.max(1, tally.tried),
      problemsCorrect: tally.right,
      problemsAttempted: tally.tried,
      level: run.stage + 1,
      standard: "6.AT.6a",
      misconceptions: [...tally.slips],
      timestamp: Date.now(),
    });
  } catch {
    /* optional */
  }
  try {
    const bridge = w.NeftCanvasBridge;
    if (bridge) {
      if (doneStages >= STAGES.length) bridge.complete?.(100);
      else bridge.reportScore?.(Math.round((doneStages / STAGES.length) * 100));
    }
  } catch {
    /* optional */
  }
}

document.documentElement.lang = lang;
if (world) titleScreen();
// For automated checks: the run and the controls, read-only by convention.
window.__factoryRun = {
  get run() {
    return run;
  },
  get mode() {
    return mode;
  },
  start,
  input: (c) => run && input(run, c),
};
