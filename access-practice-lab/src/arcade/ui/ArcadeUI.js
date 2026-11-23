// ArcadeUI.js — the shared publisher HUD and dialogs for the flagship games.
//
// One controller owns: the HUD (Shards, streak and multiplier, accuracy, objective, level/wave, timer, hearts),
// the question dialog (QuestionOverlay.js), the upgrade shop, pause, settings, the results screen, a live region,
// focus trapping and focus restoration. A game supplies its world (usually a canvas) and its own status line;
// it never builds its own HUD, so a Shard, a streak or a shop means the same thing everywhere.
import { esc, html, toHtml } from "../../util.js";
import { SoundEngine } from "../../game-core/SoundEngine.js";
import { Speech } from "../../game-core/Speech.js";
import { ECONOMY_CONFIG, matrixMultiplier } from "../../game-core/Economy.js";
import { toCsv, reportHTML } from "../../game-core/Evidence.js";
import { describe } from "../../game-core/Adaptive.js";
import { loadArcade, saveSettings } from "../../game-core/ArcadeStore.js";
import { QuestionPanel } from "./QuestionOverlay.js";
import { tx } from "./strings.js";

const ICON = {
  shop: '<path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 7Z"/><path d="M8 7a4 4 0 0 1 8 0"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m7 4 13 8-13 8Z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 4 6M21 9l-4 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  exit: '<path d="M9 4H5v16h4M13 8l4 4-4 4M17 12H8"/>',
  shard: '<path d="m12 2 6 8-6 12L6 10Z"/><path d="M6 10h12"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  clock: '<circle cx="12" cy="13" r="7"/><path d="M12 9v4l3 2M9 3h6"/>',
};
export const ico = (n) => `<svg class="ax-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ""}</svg>`;
const fmtTime = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class ArcadeUI {
  /**
   * @param {object} o
   * @param {HTMLElement} o.root   container the game gave us; `.ax-main` (HUD + stage) and `.ax-layer` are created inside
   * @param {import("../../game-core/Session.js").ArcadeSession} o.session
   * @param {object} o.I           i18n for the render ctx
   * @param {object} o.ctx         lab render ctx (prefs)
   * @param {{id:string,title:string[],objective?:string[],status?:()=>string,hud?:{timer?:boolean,hearts?:boolean}}} o.game
   * @param {() => void} o.onExit  called after the learner confirms leaving
   * @param {() => void} [o.onRestart]
   */
  constructor({ root, session, I, ctx, game, onExit, onRestart = () => {}, onPause = () => {}, onResume = () => {} }) {
    this.root = root; this.session = session; this.I = I; this.ctx = ctx; this.game = game;
    this.onExit = onExit; this.onRestart = onRestart; this.onPause = onPause; this.onResume = onResume;
    this.stack = []; // open dialogs: { el, opener, kind, onClose }
    this.q = null;
    this.timer = 0;
    this.offs = [];
    this.pending = null;
    this.mount();
  }

  T(key) { return this.I.T(...tx(key)); }
  S(key) { return this.I.S(...tx(key)); }

  mount() {
    const st = loadArcade().settings;
    this.root.classList.add("ax-root");
    this.applySettings(st);
    this.root.insertAdjacentHTML("afterbegin", `<div class="ax-main"><div class="ax-hud" data-ax-hud></div></div><div class="ax-layer" data-ax-layer></div><div class="ax-sr" role="status" aria-live="polite" data-ax-live></div>`);
    this.main = this.root.querySelector(".ax-main");
    this.hudEl = this.root.querySelector("[data-ax-hud]");
    this.layer = this.root.querySelector("[data-ax-layer]");
    this.live = this.root.querySelector("[data-ax-live]");
    this.hudOpen = false;
    this.renderHud();
    const click = (e) => this.onClick(e);
    const key = (e) => this.onKey(e);
    const input = (e) => this.q?.onInput(e);
    this.root.addEventListener("click", click);
    this.root.addEventListener("input", input);
    this.root.addEventListener("change", input);
    document.addEventListener("keydown", key, true);
    this.offs.push(() => this.root.removeEventListener("click", click), () => this.root.removeEventListener("input", input), () => this.root.removeEventListener("change", input), () => document.removeEventListener("keydown", key, true));
    const bus = this.session.bus;
    for (const ev of ["answer", "purchase", "begin", "upgrade", "expired", "gameover"]) this.offs.push(bus.on(ev, () => this.update()));
    this.timer = setInterval(() => this.updateTimer(), 250);
    const vis = () => { if (document.hidden) this.session.interrupt(); else if (this.session.state === "INTERRUPTED") { this.session.recover(); this.openPause(); } };
    document.addEventListener("visibilitychange", vis);
    this.offs.push(() => document.removeEventListener("visibilitychange", vis));
  }

  applySettings(st) {
    const r = this.root.classList;
    r.toggle("ax-reduce", st.reducedMotion === true);
    r.toggle("ax-effects-off", Boolean(st.reducedEffects));
    r.toggle("ax-big", Boolean(st.bigTargets));
    this.root.style.setProperty("--ax-font", String(st.fontScale || 1));
  }

  say(message) { if (this.live) { this.live.textContent = ""; setTimeout(() => { this.live.textContent = message; }, 20); } }

  // ── HUD ───────────────────────────────────────────────────────────────────────────────
  renderHud() {
    const s = this.session;
    const g = this.game;
    this.hudEl.innerHTML = toHtml(html`
      <div class="ax-hud-main">
        <span class="ax-stat ax-stat-shards" title="${this.S("shards")}">${raw(ico("shard"))}<b data-hud="shards">0</b><span class="ax-sr-only">${this.T("shards")}</span></span>
        <span class="ax-stat ax-stat-streak"><span class="ax-mult" data-hud="mult">1×</span><span class="ax-sr-only">${this.T("streak")}</span><b data-hud="streak">0</b></span>
        ${s.maxHearts ? html`<span class="ax-stat ax-stat-hearts" role="img" aria-label="${this.S("hearts")}" data-hud="hearts"></span>` : ""}
        <span class="ax-stat ax-stat-time" data-hud-wrap="time">${raw(ico("clock"))}<b data-hud="time"></b></span>
        <span class="ax-hud-obj" data-hud="obj"></span>
      </div>
      <div class="ax-hud-more${this.hudOpen ? " is-open" : ""}" id="ax-hud-more">
        <span class="ax-stat" data-hud="acc"></span><span class="ax-stat" data-hud="status"></span>
      </div>
      <div class="ax-hud-btns">
        <button type="button" class="ax-btn ax-btn-quiet ax-more-btn" data-ax="more" aria-expanded="${this.hudOpen}" aria-controls="ax-hud-more">${this.T("more")}</button>
        <button type="button" class="ax-btn ax-btn-icon" data-ax="shop" aria-label="${this.S("shop")} (B)">${raw(ico("shop"))}</button>
        <button type="button" class="ax-btn ax-btn-icon" data-ax="pause" aria-label="${this.S("pause")} (P)">${raw(ico("pause"))}</button>
        <button type="button" class="ax-btn ax-btn-icon" data-ax="mute" aria-label="${this.S("sound")}" aria-pressed="${SoundEngine.isMuted()}">${raw(ico(SoundEngine.isMuted() ? "mute" : "sound"))}</button>
        <button type="button" class="ax-btn ax-btn-icon" data-ax="settings" aria-label="${this.S("settings")}">${raw(ico("gear"))}</button>
        <button type="button" class="ax-btn ax-btn-icon" data-ax="exit" aria-label="${this.S("exit")}">${raw(ico("exit"))}</button>
      </div>`);
    this.update();
  }

  update() {
    const v = this.session.view();
    const set = (k, val) => { const n = this.hudEl.querySelector(`[data-hud="${k}"]`); if (n && n.textContent !== String(val)) n.textContent = String(val); };
    set("shards", v.shards);
    set("streak", v.streak);
    set("mult", `${ECONOMY_CONFIG.streakTiers.find((t) => v.streak >= t.min).mult}×${this.session.economy.matrix ? ` · ${matrixMultiplier(this.session.economy)}×` : ""}`);
    this.hudEl.dataset.tier = v.tier;
    set("acc", v.accuracy === null ? `${this.I.S(...tx("accuracy"))} –` : `${this.I.S(...tx("accuracy"))} ${v.accuracy}%`);
    set("status", this.game.status?.() || `${this.I.S(...tx("level"))} ${v.level}`);
    set("obj", this.I.S(...(this.game.objective || ["", ""])));
    const hearts = this.hudEl.querySelector('[data-hud="hearts"]');
    if (hearts) hearts.textContent = "♥".repeat(v.hearts) + "♡".repeat(Math.max(0, v.maxHearts - v.hearts));
    this.updateTimer();
  }

  updateTimer() {
    const wrap = this.hudEl.querySelector('[data-hud-wrap="time"]');
    if (!wrap) return;
    const s = this.session;
    const b = wrap.querySelector("b");
    if (!s.timed) { wrap.hidden = true; return; }
    wrap.hidden = false;
    const text = fmtTime(s.clock.remaining);
    if (b.textContent !== text) b.textContent = s.clock.frozen ? `${text} ❄` : text;
    wrap.classList.toggle("is-frozen", s.clock.frozen);
  }

  // ── dialogs ───────────────────────────────────────────────────────────────────────────
  openDialog(kind, innerHtml, { label, onClose, dismiss = true } = {}) {
    const opener = document.activeElement;
    const el = document.createElement("div");
    el.className = `ax-dialog-wrap ax-d-${kind}`;
    el.innerHTML = `<div class="ax-dialog" role="dialog" aria-modal="true" aria-label="${esc(label || kind)}" ${dismiss ? "" : 'data-nodismiss="1"'}>${innerHTML(innerHtml)}</div>`;
    this.layer.append(el);
    for (const d of this.stack) d.el.querySelector(".ax-dialog").setAttribute("aria-hidden", "true");
    this.stack.push({ el, opener, kind, onClose });
    this.main.setAttribute("inert", "");
    this.main.setAttribute("aria-hidden", "true");
    const first = el.querySelector("[tabindex='-1'], " + FOCUSABLE);
    queueMicrotask(() => first?.focus());
    return el;
  }

  closeDialog(kind) {
    const i = kind ? this.stack.map((d) => d.kind).lastIndexOf(kind) : this.stack.length - 1;
    if (i < 0) return false;
    const [d] = this.stack.splice(i, 1);
    d.el.remove();
    d.onClose?.();
    const top = this.stack[this.stack.length - 1];
    if (top) { top.el.querySelector(".ax-dialog").removeAttribute("aria-hidden"); top.el.querySelector(FOCUSABLE)?.focus(); }
    else { this.main.removeAttribute("inert"); this.main.removeAttribute("aria-hidden"); }
    if (d.opener && document.contains(d.opener)) d.opener.focus?.();
    return true;
  }

  trap(e) {
    const top = this.stack[this.stack.length - 1];
    if (!top || e.key !== "Tab") return;
    const f = [...top.el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!top.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }

  onKey(e) {
    if (!this.root.isConnected) return;
    const top = this.stack[this.stack.length - 1];
    if (top) {
      if (e.key === "Tab") this.trap(e);
      else if (e.key === "Escape" && top.el.querySelector(".ax-dialog:not([data-nodismiss])")) { e.preventDefault(); this.dismiss(top.kind); }
      else if (top.kind === "question" && this.q?.onKey(e)) e.preventDefault();
      else if (e.key === "b" || e.key === "B") { if (!e.target.closest("input, textarea") && top.kind === "question") this.openShop(); else if (top.kind === "shop") this.dismiss("shop"); }
      return;
    }
    if (e.target.closest?.("input, textarea, select")) return;
    if (e.key === "b" || e.key === "B") { e.preventDefault(); this.openShop(); }
    else if (e.key === "p" || e.key === "P" || e.key === "Escape") { e.preventDefault(); this.openPause(); }
  }

  dismiss(kind) {
    if (kind === "shop") this.closeShop();
    else if (kind === "pause") this.resume();
    else this.closeDialog(kind);
  }

  // ── shop ──────────────────────────────────────────────────────────────────────────────
  openShop() {
    if (this.stack.some((d) => d.kind === "shop") || !this.session.openShop()) return;
    SoundEngine.playClick();
    this.openDialog("shop", this.shopHTML(), { label: this.S("shop"), onClose: () => {} });
  }
  closeShop() { this.session.closeShop(); this.closeDialog("shop"); this.update(); }

  shopHTML() {
    const s = this.session;
    const rows = s.catalog();
    return html`<div class="ax-shop ax-read">
      <header class="ax-d-head"><h2 id="ax-shop-t" tabindex="-1">${this.T("shop")}</h2><p class="ax-balance" aria-live="polite">${raw(ico("shard"))}<b data-shop-balance>${s.economy.shards}</b> ${this.T("balance")}</p></header>
      <p class="ax-fine">${this.T("noBuy")}</p>
      <ul class="ax-shop-list">${rows.map((r) => this.shopRow(r))}</ul>
      <footer class="ax-d-foot"><button type="button" class="ax-btn ax-btn-primary" data-ax="shop-close">${this.T("close")}</button></footer>
    </div>`;
  }

  shopRow(r) {
    const name = tx(`up_${r.id}`);
    const eff = tx(`fx_${r.id}`);
    const tier = r.kind === "tiered" ? html` · ${this.T("tier")} ${r.owned}/${r.max}${r.detail.next ? html` → ${r.detail.next}×` : ""}` : html` · ${this.T("owned")} ${r.owned}/${r.max}`;
    const label = r.reason === "max" ? this.T("maxed") : r.reason === "short" ? this.T("need") : this.T("buy");
    return html`<li class="ax-shop-row"><div><h3>${this.I.T(...name)}<span class="ax-fine">${tier}</span></h3><p>${this.I.T(...eff)}</p></div>
      <button type="button" class="ax-btn ${r.reason ? "" : "ax-btn-primary"}" data-ax="buy" data-item="${r.id}" ${r.reason ? 'aria-disabled="true"' : ""} aria-label="${this.I.S(...name)}: ${r.reason === "max" ? this.S("maxed") : `${r.price} ${this.S("shards")}`}">${r.reason === "max" ? label : html`${raw(ico("shard"))}${r.price}`}</button></li>`;
  }

  buy(item) {
    const r = this.session.buy(item);
    const body = this.stack.find((d) => d.kind === "shop")?.el.querySelector(".ax-shop");
    if (r.ok) { SoundEngine.playPurchase(); this.say(`${this.S("bought")} ${this.I.S(...tx(`up_${item}`))}. ${this.S("balance")}: ${this.session.economy.shards}`); }
    else this.say(`${this.I.S(...tx(`up_${item}`))}: ${r.reason === "short" ? this.S("need") : this.S("maxed")}`);
    if (body) { const host = body.parentElement; host.innerHTML = toHtml(this.shopHTML()); host.querySelector(`[data-item="${item}"]`)?.focus(); }
    this.update();
  }

  // ── pause & settings ──────────────────────────────────────────────────────────────────
  openPause() {
    if (this.stack.some((d) => d.kind === "pause") || !this.session.pause()) return;
    this.onPause();
    SoundEngine.playClick();
    this.openDialog("pause", html`<div class="ax-pause ax-read"><h2 tabindex="-1">${this.T("paused")}</h2>
      <div class="ax-d-stack"><button type="button" class="ax-btn ax-btn-primary" data-ax="resume">${this.T("resume")}</button>
      <button type="button" class="ax-btn" data-ax="settings">${this.T("settings")}</button>
      <button type="button" class="ax-btn" data-ax="restart">${this.T("restart")}</button>
      <button type="button" class="ax-btn" data-ax="exit">${this.T("exit")}</button></div></div>`, { label: this.S("paused") });
  }
  resume() { if (this.session.state === "PAUSED") this.session.resume(); this.closeDialog("pause"); this.onResume(); this.update(); }

  openSettings() {
    if (this.stack.some((d) => d.kind === "settings")) return;
    this.session.fsm.can("SETTINGS") && this.session.fsm.go("SETTINGS");
    const st = loadArcade().settings;
    const vol = SoundEngine.getVolumes();
    const radio = (name, v, label, on) => html`<label class="ax-check"><input type="radio" name="${name}" value="${v}" ${on ? "checked" : ""}/> <span>${label}</span></label>`;
    this.openDialog("settings", html`<div class="ax-settings ax-read"><h2 tabindex="-1">${this.T("settings")}</h2>
      <label class="ax-range">${this.T("volSfx")}<input type="range" min="0" max="100" value="${Math.round(vol.sfx * 100)}" data-set="sfx"/></label>
      <label class="ax-range">${this.T("volSpeech")}<input type="range" min="0" max="100" value="${Math.round(vol.speech * 100)}" data-set="speech"/></label>
      <label class="ax-check"><input type="checkbox" data-set="mute" ${SoundEngine.isMuted() ? "checked" : ""}/> <span>${this.T("muted")}</span></label>
      <fieldset class="ax-fieldset"><legend>${this.T("motion")}</legend>
        ${radio("motion", "auto", this.T("motionAuto"), st.reducedMotion === null)}${radio("motion", "on", this.T("motionOn"), st.reducedMotion === true)}${radio("motion", "off", this.T("motionOff"), st.reducedMotion === false)}</fieldset>
      <label class="ax-check"><input type="checkbox" data-set="effects" ${st.reducedEffects ? "checked" : ""}/> <span>${this.T("effects")}</span></label>
      <label class="ax-check"><input type="checkbox" data-set="big" ${st.bigTargets ? "checked" : ""}/> <span>${this.T("bigTargets")}</span></label>
      <label class="ax-range">${this.T("textSize")}<input type="range" min="100" max="160" step="10" value="${Math.round((st.fontScale || 1) * 100)}" data-set="font"/></label>
      <footer class="ax-d-foot"><button type="button" class="ax-btn ax-btn-primary" data-ax="settings-close">${this.T("close")}</button></footer></div>`, { label: this.S("settings"), onClose: () => { if (this.session.state === "SETTINGS") this.session.fsm.back(); } });
    const el = this.stack[this.stack.length - 1].el;
    el.addEventListener("input", (e) => this.setting(e.target));
    el.addEventListener("change", (e) => this.setting(e.target));
  }

  setting(t) {
    const k = t.dataset?.set;
    if (t.name === "motion") { const v = t.value === "auto" ? null : t.value === "on"; this.applySettings(saveSettings({ reducedMotion: v })); return; }
    if (!k) return;
    if (k === "sfx" || k === "speech") SoundEngine.setVolume(k, Number(t.value) / 100);
    else if (k === "mute") { SoundEngine.setMuted(t.checked); this.renderHud(); }
    else if (k === "effects") this.applySettings(saveSettings({ reducedEffects: t.checked }));
    else if (k === "big") this.applySettings(saveSettings({ bigTargets: t.checked }));
    else if (k === "font") this.applySettings(saveSettings({ fontScale: Number(t.value) / 100 }));
    this.onSettings?.(loadArcade().settings);
  }

  confirmExit() {
    this.openDialog("confirm", html`<div class="ax-confirm ax-read"><h2 tabindex="-1">${this.T("exit")}</h2><p>${this.T("confirmExit")}</p>
      <div class="ax-d-stack"><button type="button" class="ax-btn ax-btn-primary" data-ax="stay">${this.T("stay")}</button><button type="button" class="ax-btn" data-ax="leave">${this.T("leave")}</button></div></div>`, { label: this.S("exit") });
  }

  // ── questions ─────────────────────────────────────────────────────────────────────────
  /** Open the next academic question. Resolves { records, pay, last } after feedback, or null if none could open. */
  ask(opts = {}) {
    const ticket = this.session.ask(opts);
    if (!ticket) return Promise.resolve(null);
    return new Promise((resolve) => {
      const done = (r) => { this.q = null; this.closeDialog("question"); this.update(); resolve(r); };
      const q = new QuestionPanel(this, ticket, done);
      this.q = q;
      const el = this.openDialog("question", '<div data-ax-qhost></div>', { label: this.S("whyThis"), dismiss: false });
      q.mount(el.querySelector("[data-ax-qhost]"));
      el.querySelector("#ax-q-title")?.focus();
      this.update();
    });
  }

  /** Re-open the question that was open when a run was saved (after a reload or a re-render). */
  resumeQuestion() {
    const ticket = this.session.publicTicket();
    if (!ticket) return Promise.resolve(null);
    return new Promise((resolve) => {
      const done = (r) => { this.q = null; this.closeDialog("question"); this.update(); resolve(r); };
      const q = new QuestionPanel(this, ticket, done);
      if (ticket.attempt === 2) q.stage = "recover";
      this.q = q;
      const el = this.openDialog("question", '<div data-ax-qhost></div>', { label: this.S("whyThis"), dismiss: false });
      q.mount(el.querySelector("[data-ax-qhost]"));
      el.querySelector("#ax-q-title")?.focus();
    });
  }

  // ── results ───────────────────────────────────────────────────────────────────────────
  showResults({ title, subtitle = "", extra = "", onReplay, onExit } = {}) {
    const s = this.session;
    const res = s.results();
    const ev = res.evidence;
    const dom = Object.entries(ev.byDomain).map(([d, o]) => html`<li><strong>${this.I.T(...tx(`dom_${d}`))}</strong>: ${o.firstOk}/${o.n} ${this.T("firstTry")}</li>`);
    this.resultsCtx = { res, onReplay, onExit };
    this.openDialog("results", html`<div class="ax-results ax-read"><h2 tabindex="-1" id="ax-res-t">${title || this.T("results")}</h2>${subtitle ? html`<p>${subtitle}</p>` : ""}
      <p class="ax-big-num">${raw(ico("shard"))}<b>${res.shards}</b> ${this.T("shards")}</p>
      ${typeof extra === "string" ? raw(extra) : extra}
      <h3>${this.T("practiceEvidence")}</h3>
      <ul class="ax-stats"><li>${this.T("attempted")}: <b>${ev.attempted}</b></li><li>${this.T("firstTry")}: <b>${ev.firstAttemptCorrect}</b></li><li>${this.T("independent")}: <b>${ev.independent}</b></li><li>${this.T("withHelp")}: <b>${ev.revisedSuccess + ev.scaffoldedSuccess}</b></li><li>${this.T("answerShown")}: <b>${ev.revealed}</b></li></ul>
      ${dom.length ? html`<h3>${this.T("skills")}</h3><ul>${dom}</ul>` : ""}
      ${ev.nextPractice.length ? html`<h3>${this.T("nextPractice")}</h3><ul>${ev.nextPractice.map((x) => html`<li>${this.I.T(x.en, x.es)}</li>`)}</ul>` : ""}
      ${ev.misconceptions.length ? html`<h3>${this.T("misconceptions")}</h3><ul>${ev.misconceptions.slice(0, 3).map((m) => html`<li>${m.note}</li>`)}</ul>` : ""}
      <p class="ax-fine">${describe(s.adaptive, s.profile)[this.I.mode === "es" ? "es" : "en"]}</p>
      <p class="ax-fine">${this.T("notOfficial")}</p>
      <div class="ax-d-stack"><button type="button" class="ax-btn ax-btn-primary" data-ax="replay">${this.T("playAgain")}</button><button type="button" class="ax-btn" data-ax="print">${this.T("print")}</button><button type="button" class="ax-btn" data-ax="csv">${this.T("csv")}</button><button type="button" class="ax-btn" data-ax="leave">${this.T("exit")}</button></div>
      </div>`, { label: this.S("results"), dismiss: false });
    SoundEngine.playVictory();
  }

  download() {
    const rows = this.resultsCtx?.res.records || [];
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `game-practice-${this.session.gameId}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  printReport() {
    let host = document.getElementById("ax-print");
    if (!host) { host = document.createElement("div"); host.id = "ax-print"; host.className = "ax-print"; document.body.append(host); }
    host.innerHTML = reportHTML(this.resultsCtx.res.evidence, { title: this.I.S(...this.game.title), subtitle: `${new Date().toLocaleDateString()}` });
    window.print();
  }

  // ── events ────────────────────────────────────────────────────────────────────────────
  onClick(e) {
    if (this.q && this.stack[this.stack.length - 1]?.kind === "question" && this.q.onClick(e)) return;
    const a = e.target.closest("[data-ax]")?.dataset.ax;
    if (!a) return;
    const top = this.stack[this.stack.length - 1]?.kind;
    if (top === "question" && a !== "shop") return;
    if (a === "more") { this.hudOpen = !this.hudOpen; this.hudEl.querySelector("#ax-hud-more").classList.toggle("is-open", this.hudOpen); e.target.closest("[data-ax]").setAttribute("aria-expanded", String(this.hudOpen)); }
    else if (a === "shop") this.openShop();
    else if (a === "shop-close") this.closeShop();
    else if (a === "buy") this.buy(e.target.closest("[data-item]").dataset.item);
    else if (a === "pause") this.openPause();
    else if (a === "resume") this.resume();
    else if (a === "mute") { SoundEngine.toggleMute(); this.renderHud(); this.say(SoundEngine.isMuted() ? this.S("muted") : this.S("sound")); }
    else if (a === "settings") this.openSettings();
    else if (a === "settings-close") this.closeDialog("settings");
    else if (a === "restart") { this.closeDialog("pause"); if (this.session.state === "PAUSED") this.session.resume(); this.onRestart(); }
    else if (a === "exit") this.confirmExit();
    else if (a === "stay") this.closeDialog("confirm");
    else if (a === "leave") { this.closeDialog("confirm"); const rc = this.resultsCtx; this.onExit(); rc?.onExit?.(); }
    else if (a === "replay") { const rc = this.resultsCtx; this.closeDialog("results"); rc?.onReplay?.(); }
    else if (a === "print") this.printReport();
    else if (a === "csv") this.download();
  }

  destroy() {
    clearInterval(this.timer);
    this.q?.destroy();
    for (const o of this.offs) o();
    this.offs = [];
    while (this.stack.length) this.closeDialog();
    Speech.stop();
    this.root.classList.remove("ax-root", "ax-reduce", "ax-effects-off", "ax-big");
    this.root.querySelectorAll(".ax-main > .ax-hud, .ax-layer, .ax-sr").forEach((n) => n.remove());
  }
}

// html`` templates return a raw wrapper; innerHTML needs the string.
function innerHTML(v) { return typeof v === "string" ? v : toHtml(v); }
import { raw } from "../../util.js";
