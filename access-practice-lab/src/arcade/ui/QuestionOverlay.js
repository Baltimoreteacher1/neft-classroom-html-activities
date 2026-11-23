// QuestionOverlay.js — renders any canonical prompt (choice, multi, order, construct) and runs the
// answer -> recover -> revise -> reveal loop against an ArcadeSession. Theme-independent: every game opens
// this same panel, so a prompt means the same thing in Tower Defense, Syntax Odyssey and Arena Blitz.
import { esc, html, toHtml } from "../../util.js";
import { dnd } from "../../games/engine.js";
import { levelProfile } from "../../game-core/WidaLevels.js";
import { scaffoldView } from "../../game-core/Prompts.js";
import { Speech } from "../../game-core/Speech.js";
import { SoundEngine } from "../../game-core/SoundEngine.js";
import { tx } from "./strings.js";

const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

export class QuestionPanel {
  /** @param {import("./ArcadeUI.js").ArcadeUI} ui */
  constructor(ui, ticket, done) {
    this.ui = ui;
    this.s = ui.session;
    this.I = ui.I;
    this.t = ticket;
    this.done = done;
    this.records = [];
    this.pay = 0;
    this.reset(ticket);
    this.slow = false;
    this.cleanup = null;
  }

  reset(ticket) {
    this.t = ticket;
    const p = ticket.prompt;
    this.sel = [];
    this.slots = p.format === "order" ? Array(p.answerOptions.length).fill(null) : [];
    this.text = "";
    this.checks = p.format === "construct" ? p.evaluationRule.criteria.map(() => false) : [];
    this.words = false; // transcript shown
    this.speechFailed = false;
    this.layers = [];
    this.clue = null;
    this.result = null;
    this.stage = "answer"; // answer | recover | final
    this.removedNote = false;
  }

  T(key) { return this.I.T(...tx(key)); }
  S(key) { return this.I.S(...tx(key)); }

  // ── rendering ─────────────────────────────────────────────────────────────────────────
  html() {
    const t = this.t;
    const p = t.prompt;
    const I = this.I;
    const lp = levelProfile(this.s.profile.level);
    const live = this.s.publicTicket();
    this.live = live;
    return toHtml(html`<div class="ax-q ax-read" data-ax-q>
      <header class="ax-q-head">
        <span class="ax-chip ax-dom-${p.domain.toLowerCase()}">${I.T(...tx(`dom_${p.domain}`))}</span>
        <span class="ax-chip ax-chip-quiet">${this.T("level")} ${this.s.profile.level}</span>
        ${this.s.timed && !this.s.clock.expired ? "" : ""}
        <button type="button" class="ax-btn ax-btn-quiet ax-q-shop" data-ax="shop">${this.T("shop")}<span class="ax-kbd">B</span></button>
      </header>
      <h2 class="ax-q-title" id="ax-q-title" tabindex="-1">${p.promptText}</h2>
      <p class="ax-q-dir">${p.instructions}${I.mode !== "en" && p.es?.directions ? html` <span class="ax-es" lang="es">${p.es.directions}</span>` : ""}</p>
      ${this.stimulusHTML(p, lp)}
      ${this.bodyHTML(p)}
      ${this.scaffoldHTML(p, live)}
      <div class="ax-q-live" role="status" aria-live="polite">${this.liveText()}</div>
      ${this.feedbackHTML(p)}
      <footer class="ax-q-actions">${this.actionsHTML(p)}</footer>
      <p class="ax-q-why">${this.T("whyThis")}: ${I.T(t.reason.en, t.reason.es)}</p>
    </div>`);
  }

  liveText() { return this.removedNote ? this.S("moreHelp") : ""; }

  stimulusHTML(p, lp) {
    const st = p.stimulus;
    const listening = p.domain === "Listening" && st.audio;
    const showWords = this.words || this.speechFailed;
    return html`<section class="ax-stim" aria-label="${this.S("whyThis")}">
      ${st.title ? html`<h3 class="ax-stim-t">${st.title}</h3>` : ""}
      ${st.picture?.src ? html`<img class="ax-pic" src="${st.picture.src}" alt="${st.picture.alt || ""}" loading="lazy" />` : ""}
      ${(st.paragraphs || []).map((x) => html`<p>${x}</p>`)}
      ${st.text ? html`<p>${st.text}</p>` : ""}
      ${listening ? html`<div class="ax-audio">
        <button type="button" class="ax-btn" data-ax="listen" ${lp.audioAuto ? 'data-auto="1"' : ""}>${this.T("listen")}</button>
        <button type="button" class="ax-btn ax-btn-quiet" data-ax="slow" aria-pressed="${this.slow}">${this.T("slow")} 0.85×</button>
        <button type="button" class="ax-btn ax-btn-quiet" data-ax="words" aria-pressed="${showWords}">${showWords ? this.T("hideWords") : this.T("showWords")}</button>
        <p class="ax-fine">${this.T("speechNote")}</p>
        ${this.speechFailed ? html`<p class="ax-note" role="status">${this.T("speechOff")}</p>` : ""}
        ${showWords ? html`<blockquote class="ax-transcript" lang="en">${st.audio}</blockquote>` : ""}
      </div>` : ""}
    </section>`;
  }

  bodyHTML(p) {
    const locked = this.stage === "final";
    const hidden = new Set(this.live.hidden || []);
    if (p.format === "choice" || p.format === "multi") {
      const multi = p.format === "multi";
      const right = [].concat(p.correctAnswer).map(String);
      return html`<fieldset class="ax-opts" ${locked ? "disabled" : ""}>
        <legend class="ax-fine">${multi ? this.T("pickMany") : this.T("pickOne")}</legend>
        ${p.answerOptions.filter((o) => !hidden.has(o.id)).map((o, i) => html`<button type="button" class="ax-opt${this.sel.includes(o.id) ? " is-sel" : ""}${locked && right.includes(o.id) ? " is-right" : ""}${this.missed?.includes(o.id) ? " is-miss" : ""}" data-opt="${o.id}" aria-pressed="${this.sel.includes(o.id)}"><span class="ax-opt-n" aria-hidden="true">${i + 1}</span><span class="ax-opt-t" lang="en">${o.text}</span></button>`)}
      </fieldset>`;
    }
    if (p.format === "order") {
      const placed = new Set(this.slots.filter(Boolean));
      const byId = Object.fromEntries(p.answerOptions.map((o) => [o.id, o]));
      return html`<div class="ax-order" data-ax-order>
        <p class="ax-fine">${this.T("putOrder")}</p>
        <ol class="ax-slots" aria-label="${this.S("yourOrder")}">
          ${this.slots.map((id, i) => html`<li><button type="button" class="ax-slot${id ? " is-filled" : ""}" data-drop="${i}" ${locked ? "disabled" : ""} aria-label="${this.S("slot")} ${i + 1}${id ? `: ${byId[id].text}` : ""}"><span class="ax-slot-n">${i + 1}</span><span class="ax-slot-t" lang="en">${id ? byId[id].text : ""}</span></button>
            ${id && !locked ? html`<span class="ax-slot-tools"><button type="button" class="ax-icon-btn" data-ax="up" data-i="${i}" aria-label="${this.S("moveUp")}" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" class="ax-icon-btn" data-ax="down" data-i="${i}" aria-label="${this.S("moveDown")}" ${i === this.slots.length - 1 ? "disabled" : ""}>▼</button><button type="button" class="ax-icon-btn" data-ax="unplace" data-i="${i}" aria-label="${this.S("remove")}">✕</button></span>` : ""}</li>`)}
        </ol>
        <div class="ax-pool" role="group" aria-label="${this.S("pieces")}">
          ${p.answerOptions.filter((o) => !placed.has(o.id)).map((o) => html`<button type="button" class="ax-piece" data-drag="${o.id}" aria-pressed="false" ${locked ? "disabled" : ""}><span lang="en">${o.text}</span></button>`)}
        </div>
      </div>`;
    }
    const r = p.evaluationRule;
    return html`<div class="ax-construct">
      <label class="ax-fine" for="ax-text">${this.T("writeIt")}</label>
      <textarea id="ax-text" class="ax-textarea" data-ax-text rows="4" ${locked ? "disabled" : ""} lang="en">${this.text}</textarea>
      <p class="ax-fine" aria-live="off"><span data-ax-wc>${words(this.text)}</span> / ${r.minWords} ${this.T("words")}</p>
      <fieldset class="ax-checks" ${locked ? "disabled" : ""}><legend class="ax-fine">${this.T("criteria")}</legend>
        ${r.criteria.map((c, i) => html`<label class="ax-check"><input type="checkbox" data-ax-crit="${i}" ${this.checks[i] ? "checked" : ""}/> <span>${c}</span></label>`)}
      </fieldset>
      ${locked && r.model ? html`<p class="ax-model"><strong>${this.T("model")}:</strong> ${r.model}</p>` : ""}
    </div>`;
  }

  scaffoldHTML(p, live) {
    const opened = this.layers;
    const canMore = live.layersOpen < live.layersAllowed && this.stage !== "final";
    const decoders = this.s.economy.stock.decoder || 0;
    const lp = levelProfile(this.s.profile.level);
    return html`<section class="ax-help" aria-label="${this.S("moreHelp")}">
      ${opened.map((v) => this.layerHTML(v, lp))}
      ${this.clue ? html`<div class="ax-scaf"><strong>${this.T("up_decoder")}</strong>${this.clue.text ? html`<p>${this.clue.text}</p>` : ""}${this.clue.frame ? html`<p class="ax-frame">${this.clue.frame}</p>` : ""}</div>` : ""}
      <div class="ax-help-btns">
        ${canMore ? html`<button type="button" class="ax-btn ax-btn-quiet" data-ax="hint">${opened.length ? this.T("moreHelp") : this.T("hint")} (${live.layersOpen}/${live.layersAllowed})</button>` : ""}
        ${decoders > 0 && this.stage !== "final" && !live.decoder ? html`<button type="button" class="ax-btn ax-btn-quiet" data-ax="decoder">${this.T("up_decoder")} ×${decoders}</button>` : ""}
      </div>
    </section>`;
  }

  layerHTML(v, lp) {
    if (!v) return "";
    if (v.kind === "hint") return html`<div class="ax-scaf"><strong>${this.T("hint")}</strong><p>${v.text}</p></div>`;
    if (v.kind === "language") {
      const gloss = (v.gloss || []).map((g) => html`<li><strong lang="en">${g.term}</strong>: ${g.def}${g.es && lp.glossShown !== "off" ? html` <span class="ax-es" lang="es">${g.es}</span>` : ""}</li>`);
      return html`<div class="ax-scaf"><strong>${this.T("languageHelp")}</strong>${v.frame ? html`<p class="ax-frame"><em>${this.T("frame")}:</em> ${v.frame}</p>` : ""}${gloss.length ? html`<ul>${gloss}</ul>` : ""}</div>`;
    }
    if (v.kind === "eliminate") return html`<div class="ax-scaf"><strong>${this.T("moreHelp")}</strong></div>`;
    return "";
  }

  feedbackHTML(p) {
    const r = this.result;
    if (!r) return "";
    const tone = r.correct ? (r.attempt === 2 ? "revised" : "right") : r.revealed ? "shown" : "retry";
    const head = { right: this.T("right"), revised: this.T("revised"), shown: this.T("shown"), retry: this.T("notYet") }[tone];
    return html`<div class="ax-fb is-${tone}" role="status" aria-live="polite" tabindex="-1" data-ax-fb>
      <p class="ax-fb-h"><strong>${head}</strong>${r.pay ? html` <span class="ax-shard">+${r.pay} ${this.T("shards")}</span>` : ""}</p>
      ${r.shield ? html`<p>${this.T("shielded")}</p>` : ""}${r.heartLost ? html`<p>${this.T("heartLost")}</p>` : ""}
      ${tone === "retry" && r.recoveryHint ? html`<p class="ax-hintline">${r.recoveryHint}</p>` : ""}
      ${tone === "shown" ? html`<p>${p.rationale}</p>${this.answerText(p) ? html`<p class="ax-answer"><strong>${this.answerText(p)}</strong></p>` : ""}` : ""}
      ${tone === "right" || tone === "revised" ? html`<p class="ax-fine">${p.rationale}</p>` : ""}
    </div>`;
  }

  answerText(p) {
    const by = Object.fromEntries(p.answerOptions.map((o) => [o.id, o.text]));
    if (p.format === "choice") return by[String(p.correctAnswer)] || "";
    if (p.format === "multi") return p.correctAnswer.map((x) => by[x]).join(" · ");
    if (p.format === "order") return p.correctAnswer.map((x, i) => `${i + 1}. ${by[x]}`).join("  ");
    return "";
  }

  actionsHTML(p) {
    if (this.stage === "final") {
      const pulse = (this.s.economy.stock.recovery || 0) > 0 && this.result?.revealed;
      return html`${pulse ? html`<button type="button" class="ax-btn" data-ax="pulse">${this.T("freshTry")}</button>` : ""}<button type="button" class="ax-btn ax-btn-primary" data-ax="next">${this.T("next")}</button>`;
    }
    const ready = this.ready(p);
    return html`<button type="button" class="ax-btn ax-btn-primary" data-ax="check" ${ready ? "" : "disabled"}>${this.stage === "recover" ? this.T("tryAgain") : this.T("check")}</button>`;
  }

  ready(p) {
    if (p.format === "choice") return this.sel.length === 1;
    if (p.format === "multi") return this.sel.length >= 1;
    if (p.format === "order") return this.slots.every(Boolean);
    return words(this.text) >= 1;
  }

  // ── behavior ──────────────────────────────────────────────────────────────────────────
  mount(el) {
    this.el = el;
    this.paint();
  }

  paint({ focus = "" } = {}) {
    const keep = this.el.querySelector("[data-ax-text]")?.selectionStart;
    this.cleanup?.();
    this.cleanup = null;
    const body = this.html();
    this.el.innerHTML = body;
    const order = this.el.querySelector("[data-ax-order]");
    if (order && this.stage !== "final") {
      this.cleanup = dnd(order, {
        I: this.I,
        itemSel: "[data-drag]",
        zoneSel: "[data-drop]",
        onDrop: (id, slot) => this.place(id, Number(slot)),
        onReset: () => { this.slots = this.slots.map(() => null); this.paint(); },
      });
    }
    const auto = this.el.querySelector("[data-auto]");
    if (auto && !this.autoPlayed) { this.autoPlayed = true; this.speak(); }
    if (focus) this.el.querySelector(focus)?.focus();
    void keep;
  }

  place(id, slot) {
    const i = this.slots.indexOf(id);
    if (i >= 0) this.slots[i] = null;
    this.slots[slot] = id; // an occupied slot's piece returns to the pool
    SoundEngine.playClick();
    this.paint({ focus: `[data-drop="${Math.min(slot + 1, this.slots.length - 1)}"]` });
  }

  async speak() {
    const p = this.t.prompt;
    const r = await Speech.say(p.audioSettings.speak || p.stimulus.audio, { slow: this.slow, prefs: this.ui.ctx?.prefs || {} });
    if (!r.ok && (r.reason === "muted" || r.reason === "unavailable")) { this.speechFailed = true; this.paint({ focus: '[data-ax="listen"]' }); }
  }

  response() {
    const p = this.t.prompt;
    if (p.format === "choice") return this.sel[0];
    if (p.format === "multi") return [...this.sel];
    if (p.format === "order") return [...this.slots];
    return { text: this.text, checks: [...this.checks] };
  }

  submit() {
    const p = this.t.prompt;
    if (!this.ready(p)) return;
    const r = this.s.submit(this.t.id, this.response());
    if (!r.ok) return;
    this.result = r;
    this.pay += r.pay || 0;
    const right = [].concat(p.correctAnswer).map(String);
    this.missed = r.correct ? null : [...new Set([...(this.missed || []), ...this.sel.filter((x) => !right.includes(x))])];
    if (r.shield) SoundEngine.playShield();
    if (r.correct) {
      if (r.overdrive) SoundEngine.playOverdrive();
      else if (r.attempt === 2) SoundEngine.playRecovery();
      else r.streak >= 3 ? SoundEngine.playStreakUp(Math.floor(r.streak / 4)) : SoundEngine.playCorrect(r.streak || 1);
    } else SoundEngine.playError();
    if (r.correct || r.revealed) {
      this.stage = "final";
      this.records.push(this.s.lastRecord);
    } else {
      this.stage = "recover";
      this.sel = [];
      if (p.format === "order") this.slots = this.slots.map(() => null);
      this.checks = this.checks.map(() => false);
    }
    this.ui.update();
    this.paint({ focus: "[data-ax-fb]" });
  }

  onClick(e) {
    const t = e.target;
    const p = this.t.prompt;
    const opt = t.closest("[data-opt]");
    if (opt && this.stage !== "final") {
      const id = opt.dataset.opt;
      if (p.format === "choice") this.sel = [id];
      else this.sel = this.sel.includes(id) ? this.sel.filter((x) => x !== id) : [...this.sel, id];
      SoundEngine.playClick();
      this.paint({ focus: `[data-opt="${id}"]` });
      return true;
    }
    const a = t.closest("[data-ax]")?.dataset.ax;
    if (!a) return false;
    const live = this.s.publicTicket();
    if (a === "check") this.submit();
    else if (a === "next") this.finish();
    else if (a === "shop") this.ui.openShop();
    else if (a === "listen") this.speak();
    else if (a === "slow") { this.slow = !this.slow; this.paint({ focus: '[data-ax="slow"]' }); }
    else if (a === "words") { this.words = !this.words; if (this.words && !this.speechFailed) this.s.noteScaffold(this.t.id, "transcript"); this.paint({ focus: '[data-ax="words"]' }); }
    else if (a === "hint") {
      const r = this.s.scaffold(this.t.id);
      if (r) { const v = scaffoldView(this.t.prompt, live.layersOpen, { spanish: this.I.mode !== "en" }); this.layers.push(v); if (r.layer.kind === "eliminate") this.removedNote = true; SoundEngine.playHint(); this.paint({ focus: '[data-ax="hint"]' }); }
    } else if (a === "decoder") {
      const r = this.s.useDecoder(this.t.id);
      if (r) { this.clue = r.clue; this.removedNote = true; SoundEngine.playHint(); this.ui.update(); this.paint({ focus: "#ax-q-title" }); }
    } else if (a === "pulse") {
      const q = this.s.useRecoveryPulse();
      if (q) { SoundEngine.playRecovery(); this.reset(q); this.autoPlayed = false; this.ui.update(); this.paint({ focus: "#ax-q-title" }); }
    } else if (a === "up" || a === "down") {
      const i = Number(t.closest("[data-i]").dataset.i);
      const j = a === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < this.slots.length) { [this.slots[i], this.slots[j]] = [this.slots[j], this.slots[i]]; this.paint({ focus: `[data-ax="${a}"][data-i="${j}"]` }); }
    } else if (a === "unplace") {
      this.slots[Number(t.closest("[data-i]").dataset.i)] = null;
      this.paint({ focus: "[data-drag]" });
    } else return false;
    return true;
  }

  onInput(e) {
    const t = e.target;
    if (t.matches("[data-ax-text]")) {
      this.text = t.value;
      const wc = this.el.querySelector("[data-ax-wc]");
      if (wc) wc.textContent = String(words(this.text));
      const btn = this.el.querySelector('[data-ax="check"]');
      if (btn) btn.disabled = !this.ready(this.t.prompt);
      return true;
    }
    if (t.matches("[data-ax-crit]")) { this.checks[Number(t.dataset.axCrit)] = t.checked; return true; }
    return false;
  }

  onKey(e) {
    const p = this.t.prompt;
    if (e.target.closest("textarea, input")) return false;
    if (/^[1-9]$/.test(e.key) && (p.format === "choice" || p.format === "multi") && this.stage !== "final") {
      const opts = p.answerOptions.filter((o) => !(this.live.hidden || []).includes(o.id));
      const o = opts[Number(e.key) - 1];
      if (o) { this.onClick({ target: this.el.querySelector(`[data-opt="${o.id}"]`) || this.el }); return true; }
    }
    if (e.key === "Enter" && !e.target.closest("button") && this.stage !== "final") { this.submit(); return true; }
    return false;
  }

  finish() {
    this.cleanup?.();
    Speech.stop();
    this.s.next();
    this.done({ records: this.records, pay: this.pay, last: this.result });
  }

  destroy() {
    this.cleanup?.();
    Speech.stop();
  }
}

export { esc };
