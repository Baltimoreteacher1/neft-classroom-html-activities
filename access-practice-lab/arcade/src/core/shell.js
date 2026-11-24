// The shared game shell: HUD, round flow, judging, feedback sheet, pause menu,
// session results and progression. Each game owns only its mechanic.
import { qs, qsa, esc, announce, formatNumber } from "./dom.js";
import { sound, speak, stopSpeaking } from "./audio.js";
import { fx } from "./fx.js";
import { store, levelInfo } from "./store.js";
import { t } from "./i18n.js";
import { toast } from "./toast.js";

const ICONS = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="5" width="3.6" height="14" rx="1.4"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.4"/></svg>',
  sound:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M15.5 8.5a6 6 0 010 7"/><path d="M18 6a9.5 9.5 0 010 12"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M16 9.5l5 5m0-5l-5 5"/></svg>',
};

const plain = (value = "") => {
  const node = document.createElement("div");
  node.innerHTML = value;
  return (node.textContent || "").replace(/\s+/g, " ").trim();
};

const MULT = (streak) => Math.min(1 + streak * 0.15, 2.5);

export class GameShell {
  constructor({ game, band, host, onExit, onRestart, onNext }) {
    this.game = game;
    this.band = band;
    this.host = host;
    this.onExit = onExit;
    this.onRestart = onRestart;
    this.onNext = onNext;

    this.rounds = game.rounds(band);
    this.total = this.rounds.length;
    this.index = 0;
    this.score = 0;
    this.correct = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.missed = [];
    this.locked = false;
    this.sheetOpen = false;
    this.modalOpen = false;
    this.data = {};
    this.startedAt = Date.now();
    this.lastX = window.innerWidth / 2;
    this.lastY = window.innerHeight / 2;

    this.mount();
    this.renderRound();
  }

  /* ------------------------------------------------------------------ mount */

  mount() {
    const game = this.game;
    this.host.innerHTML = `
      <div class="game-frame" data-skill="${esc(game.skill)}" data-game="${esc(game.id)}">
        <header class="game-top">
          <button class="icon-btn" type="button" data-act="exit" aria-label="${t("common.back")}">
            ${ICONS.back}
          </button>
          <div class="game-id">
            <span class="skill-chip"><i aria-hidden="true"></i>${t(`skill.${game.skill}`)}</span>
            <h1 class="game-name">${esc(game.title)}</h1>
          </div>
          <div class="game-tools">
            <button class="icon-btn" type="button" data-act="sound" aria-pressed="${sound.enabled}" aria-label="${t(
              "common.sound"
            )}">${sound.enabled ? ICONS.sound : ICONS.mute}</button>
            <button class="icon-btn" type="button" data-act="pause" aria-label="${t("common.pause")}">
              ${ICONS.pause}
            </button>
          </div>
        </header>

        <div class="hud">
          <div class="hud-stat">
            <span class="hud-key">${t("game.score")}</span>
            <span class="hud-val" data-score>0</span>
          </div>
          <div class="hud-stat hud-combo" data-combo>
            <span class="hud-key">${t("game.combo")}</span>
            <span class="hud-val" data-combo-val>x1.00</span>
          </div>
          <div class="hud-progress">
            <div class="hud-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${this.total}" aria-valuenow="0" data-bar>
              <i data-fill style="width:0%"></i>
            </div>
            <span class="hud-round" data-count>1 / ${this.total}</span>
          </div>
        </div>

        <main class="stage" data-stage tabindex="-1"></main>
        <div class="sheet" data-sheet role="status" aria-live="polite" hidden></div>
        <div class="modal-root" data-modal hidden></div>
      </div>`;

    this.$stage = qs("[data-stage]", this.host);
    this.$sheet = qs("[data-sheet]", this.host);
    this.$modal = qs("[data-modal]", this.host);
    this.$score = qs("[data-score]", this.host);
    this.$combo = qs("[data-combo]", this.host);
    this.$comboVal = qs("[data-combo-val]", this.host);
    this.$bar = qs("[data-bar]", this.host);
    this.$fill = qs("[data-fill]", this.host);
    this.$count = qs("[data-count]", this.host);

    this.onClick = (event) => {
      const act = event.target.closest("[data-act]");
      if (act && this.host.contains(act)) {
        if (act.dataset.act === "exit" || act.dataset.act === "pause") this.openPause();
        if (act.dataset.act === "sound") this.toggleSound();
        return;
      }
      const speaker = event.target.closest("[data-speak]");
      if (speaker && this.host.contains(speaker)) {
        const text = speaker.dataset.speak;
        if (text) speak(text, { rate: Number(speaker.dataset.rate || 0.92) });
        return;
      }
      if (event.target.closest("[data-next]") && this.sheetOpen) {
        this.next();
      }
    };
    this.host.addEventListener("click", this.onClick);

    this.onKey = (event) => {
      if (event.key === "Escape") {
        if (this.modalOpen) {
          this.closePause();
          return;
        }
        this.openPause();
        return;
      }
      if (this.modalOpen) return;
      if (this.sheetOpen && (event.key === "Enter" || event.key === " ")) {
        const next = qs("[data-next]", this.$sheet);
        if (next && document.activeElement !== next) {
          event.preventDefault();
          next.click();
        }
        return;
      }
      if (event.target.matches("input, textarea, select")) return;
      if (/^[1-9]$/.test(event.key)) {
        const choices = qsa("[data-choice]", this.$stage).filter(
          (node) => !node.disabled && !node.hidden && node.offsetParent !== null
        );
        const choice = choices[Number(event.key) - 1];
        if (choice) {
          event.preventDefault();
          choice.click();
        }
      }
    };
    document.addEventListener("keydown", this.onKey);

    this.onPointer = (event) => {
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    };
    document.addEventListener("pointerdown", this.onPointer, true);

    this.unsub = store.subscribe(() => this.refreshSoundButton());
  }

  destroy() {
    stopSpeaking();
    this.host.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onKey);
    document.removeEventListener("pointerdown", this.onPointer, true);
    this.unsub?.();
    this.host.innerHTML = "";
  }

  /* ------------------------------------------------------------------ rounds */

  renderRound() {
    const round = this.rounds[this.index];
    this.locked = false;
    this.sheetOpen = false;
    this.$sheet.hidden = true;
    this.$sheet.innerHTML = "";
    this.host.classList.remove("sheet-open", "is-finished");
    this.$stage.innerHTML = "";
    this.$stage.dataset.round = round?.id || String(this.index);
    this.$stage.classList.remove("is-entering");
    void this.$stage.offsetWidth;
    this.$stage.classList.add("is-entering");

    this.game.render(this.$stage, round, this);
    this.updateHud();

    if (round?.prompt) announce(round.prompt);
    const focusTarget =
      this.$stage.querySelector("[data-focus]") || this.$stage;
    window.setTimeout(() => focusTarget.focus?.({ preventScroll: true }), 60);
  }

  answer(ok, options = {}) {
    if (this.locked) return;
    this.locked = true;

    const {
      points,
      tone,
      title,
      body = "",
      why = "",
      firstTry = true,
      tag = "",
      earned: forced,
    } = options;

    let earned = 0;
    if (ok) {
      const base = points ?? 100;
      earned = forced ?? Math.round((base + (firstTry ? 25 : 0)) * MULT(this.streak));
      this.score += earned;
      this.correct += 1;
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
    } else {
      this.streak = 0;
      if (tag) this.missed.push(tag);
    }

    const flavour = tone || (ok ? "good" : "bad");
    this.showSheet({
      ok,
      tone: flavour,
      earned,
      title: title || (flavour === "good" ? t("game.correct") : flavour === "partial" ? t("game.partial") : t("game.incorrect")),
      body,
      why,
    });
    this.updateHud();

    if (ok) {
      sound.correct(this.streak);
      fx.burst(this.lastX, this.lastY, { count: 16 + Math.min(this.streak, 6) * 3 });
      fx.ring(this.lastX, this.lastY, "#0f766e");
      if (earned) fx.float(this.lastX, this.lastY - 26, `+${earned}`, "#0f766e");
    } else if (flavour === "partial") {
      sound.partial();
      fx.burst(this.lastX, this.lastY, { count: 8, colors: ["#e2b14a", "#c2562f"] });
    } else {
      sound.wrong();
      fx.shake(this.$stage.firstElementChild);
    }

    announce(`${plain(title || "")}. ${plain(body)} ${plain(why)}`.trim());
  }

  showSheet({ tone, earned, title, body, why }) {
    this.sheetOpen = true;
    this.host.classList.add("sheet-open");
    const mark = tone === "good" ? "✓" : tone === "partial" ? "≈" : "!";
    const last = this.index + 1 >= this.total;
    const speech = plain([body, why].filter(Boolean).join(" "));

    this.$sheet.hidden = false;
    this.$sheet.dataset.tone = tone;
    this.$sheet.innerHTML = `
      <div class="fb">
        <div class="fb-mark" aria-hidden="true">${mark}</div>
        <div class="fb-copy">
          <p class="fb-eyebrow">${
            tone === "good" ? t("game.correct") : tone === "partial" ? t("game.partial") : t("game.incorrect")
          }</p>
          <h2 class="fb-title">${esc(title)}</h2>
          ${body ? `<p class="fb-body">${body}</p>` : ""}
          ${why ? `<p class="fb-why"><strong>${t("common.hint")}</strong> ${why}</p>` : ""}
        </div>
        <div class="fb-actions">
          ${
            speech
              ? `<button class="btn btn-quiet btn-listen" type="button" data-speak="${esc(speech)}">${t(
                  "common.listen"
                )}</button>`
              : ""
          }
          <button class="btn btn-primary" type="button" data-next>
            ${last ? t("game.session") : t("common.continue")}
          </button>
        </div>
        ${earned ? `<span class="fb-points" aria-hidden="true">+${earned}</span>` : ""}
      </div>`;

    const next = qs("[data-next]", this.$sheet);
    window.setTimeout(() => next?.focus({ preventScroll: true }), 80);
    if (earned) {
      const node = qs(".fb-points", this.$sheet);
      node?.classList.add("is-popping");
    }
  }

  next() {
    if (this.sheetOpen) {
      this.sheetOpen = false;
      this.$sheet.hidden = true;
      this.host.classList.remove("sheet-open");
    }
    stopSpeaking();
    this.index += 1;
    if (this.index >= this.total) {
      this.finish();
    } else {
      sound.whoosh();
      this.renderRound();
    }
  }

  /* -------------------------------------------------------------------- hud */

  updateHud() {
    this.$score.textContent = formatNumber(this.score);
    this.$score.classList.remove("is-bumped");
    void this.$score.offsetWidth;
    this.$score.classList.add("is-bumped");

    const mult = MULT(this.streak);
    this.$comboVal.textContent = `x${mult.toFixed(2)}`;
    this.$combo.classList.toggle("is-hot", this.streak >= 3);

    const shown = Math.min(this.total, this.index + (this.locked ? 1 : 0));
    this.$count.textContent = `${Math.min(this.index + 1, this.total)} / ${this.total}`;
    this.$fill.style.width = `${(shown / this.total) * 100}%`;
    this.$bar.setAttribute("aria-valuenow", String(shown));
  }

  /* ---------------------------------------------------------------- results */

  finish() {
    stopSpeaking();
    this.host.classList.add("is-finished");
    const game = this.game;
    const accuracy = this.total ? this.correct / this.total : 0;
    const minutes = Math.max(1, Math.round((Date.now() - this.startedAt) / 60000));
    const previousBest = store.state.games[game.id]?.best || 0;

    const xp = Math.round(this.score / 4) + Math.round(accuracy * 60) + 40;
    const before = levelInfo(store.state.xp);
    const { stars, badges } = store.recordGame({
      id: game.id,
      band: this.band,
      skill: game.skill,
      score: this.score,
      accuracy,
      bestStreak: this.bestStreak,
      missed: this.missed,
      minutes,
    });
    const after = store.addXp(xp);

    store.markDaily("daily.one");
    if (stars >= 2) store.markDaily("daily.two");
    if (this.distinctSkillsToday() >= 2) store.markDaily("daily.three");

    sound.finish(stars);
    if (stars >= 2) fx.confetti({ count: stars === 3 ? 90 : 55 });

    const review = [...new Set(this.missed)].map((tag) => game.missedLabels?.[tag] || tag);
    const level = levelInfo(store.state.xp);
    const bandLabel = t(`band.${this.band}`);
    const otherBand = this.band === "3-5" ? "6-8" : "3-5";

    this.$stage.innerHTML = `
      <div class="results" data-stars="${stars}">
        <p class="res-kicker">${t("game.session")}</p>
        <h2 class="res-title">${esc(game.title)}</h2>
        <p class="res-band">${bandLabel} · ${t(`skill.${game.skill}`)}</p>

        <div class="res-stars" aria-label="${stars} ${t("common.stars")}">
          ${[1, 2, 3]
            .map(
              (n) =>
                `<span class="res-star ${n <= stars ? "is-on" : ""}" style="--i:${n}">★</span>`
            )
            .join("")}
        </div>

        <div class="res-score">
          <strong>${formatNumber(this.score)}</strong>
          <span>${t("game.score").toLowerCase()}</span>
          ${
            this.score > previousBest && previousBest > 0
              ? `<em class="res-best">New best</em>`
              : ""
          }
        </div>

        <div class="res-grid">
          <div class="res-stat"><span>${t("game.accuracy")}</span><strong>${Math.round(
            accuracy * 100
          )}%</strong></div>
          <div class="res-stat"><span>${t("game.bestStreak")}</span><strong>${
            this.bestStreak
          }</strong></div>
          <div class="res-stat"><span>${t("game.xp")}</span><strong>+${xp}</strong></div>
        </div>

        <div class="res-level">
          <div class="res-level-top">
            <span>${t("player.level")} ${level.level} · ${level.rank[store.settings.lang === "es" ? "es" : "en"]}</span>
            <span>${level.next} ${t("player.toNext")}</span>
          </div>
          <div class="res-level-bar"><i></i></div>
          ${
            after.levelUp
              ? `<p class="res-levelup">${t("game.levelUp")} — ${t("player.level")} ${after.level}</p>`
              : ""
          }
        </div>

        <div class="res-review">
          <h3>${t("game.review")}</h3>
          ${
            review.length
              ? `<ul>${review.slice(0, 4).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
              : `<p class="res-clean">${t("game.reviewEmpty")}</p>`
          }
        </div>

        <div class="res-actions">
          <button class="btn btn-primary" type="button" data-again>${t("common.again")}</button>
          <button class="btn btn-quiet" type="button" data-next-game>${t("common.next")}</button>
          <button class="btn btn-quiet" type="button" data-exit>${t("common.back")}</button>
        </div>
        <p class="res-band-hint">
          <button class="link-btn" type="button" data-other-band>${t("game.tooHard")} · ${t(
      `band.${otherBand}`
    )}</button>
        </p>
      </div>`;

    this.$stage.querySelector("[data-again]")?.addEventListener("click", () => this.onRestart?.());
    this.$stage.querySelector("[data-next-game]")?.addEventListener("click", () => this.onNext?.(game.id));
    this.$stage.querySelector("[data-exit]")?.addEventListener("click", () => this.onExit?.());
    this.$stage.querySelector("[data-other-band]")?.addEventListener("click", () =>
      this.onRestart?.(otherBand)
    );

    const levelBar = this.$stage.querySelector(".res-level-bar i");
    if (levelBar) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          levelBar.style.width = `${level.pct}%`;
        })
      );
    }
    announce(
      `${t("game.session")}: ${game.title}. ${t("game.score")} ${this.score}. ${t(
        "game.accuracy"
      )} ${Math.round(accuracy * 100)}%.`
    );

    if (after.levelUp) {
      window.setTimeout(() => sound.level(), 700);
      toast(`${t("game.levelUp")}!`, {
        icon: "★",
        detail: `${t("player.level")} ${after.level} · ${levelInfo(store.state.xp).rank[
          store.settings.lang === "es" ? "es" : "en"
        ]}`,
        tone: "level",
      });
    }
    badges.forEach((badge, i) =>
      window.setTimeout(
        () =>
          toast(store.settings.lang === "es" ? badge.es : badge.name, {
            icon: badge.icon,
            detail: badge.desc,
            tone: "badge",
          }),
        1100 + i * 700
      )
    );

    if (this.score > previousBest) {
      window.setTimeout(() => sound.badge(), 1500);
    }
  }

  distinctSkillsToday() {
    const today = new Date().toDateString();
    const skills = new Set();
    Object.values(store.state.games).forEach((g) => {
      if (g.lastPlayed && new Date(g.lastPlayed).toDateString() === today) {
        (g.skills || []).forEach((s) => skills.add(s));
      }
    });
    skills.add(this.game.skill);
    return skills.size;
  }

  /* ------------------------------------------------------------------ pause */

  openPause() {
    if (this.modalOpen) return;
    this.modalOpen = true;
    stopSpeaking();
    this.$modal.hidden = false;
    this.$modal.innerHTML = `
      <div class="modal-backdrop" data-dismiss>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <p class="modal-kicker">${t("common.pause")}</p>
          <h2 id="pause-title">${t("game.paused")}</h2>
          <p class="modal-sub">${t("game.pausedSub")}</p>

          <div class="modal-settings">
            <button class="setting" type="button" data-setting="sound" aria-pressed="${sound.enabled}">
              <span>${t("common.sound")}</span>
              <i class="switch" aria-hidden="true"></i>
            </button>
            <button class="setting" type="button" data-setting="motion" aria-pressed="${
              store.settings.motion !== false
            }">
              <span>${t("common.motion")}</span>
              <i class="switch" aria-hidden="true"></i>
            </button>
          </div>

          <div class="modal-actions">
            <button class="btn btn-primary" type="button" data-resume>${t("game.resume")}</button>
            <button class="btn btn-quiet" type="button" data-restart>${t("common.restart")}</button>
            <button class="btn btn-quiet" type="button" data-quit>${t("common.quit")}</button>
          </div>
          <p class="modal-foot">${t("micro.one")}</p>
        </div>
      </div>`;

    this.$modal.querySelector("[data-resume]")?.addEventListener("click", () => this.closePause());
    this.$modal.querySelector("[data-restart]")?.addEventListener("click", () => {
      this.closePause();
      this.onRestart?.();
    });
    this.$modal.querySelector("[data-quit]")?.addEventListener("click", () => {
      this.closePause();
      this.onExit?.();
    });
    this.$modal.querySelector("[data-dismiss]")?.addEventListener("click", (event) => {
      if (event.target.matches("[data-dismiss]")) this.closePause();
    });
    this.$modal.querySelectorAll("[data-setting]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.setting;
        const next = !(key === "sound" ? sound.enabled : store.settings.motion !== false);
        store.setSetting(key, next);
        btn.setAttribute("aria-pressed", String(next));
        if (key === "motion") fx.setEnabled(next);
        if (key === "sound" && next) sound.click();
      });
    });

    window.setTimeout(
      () => this.$modal.querySelector("[data-resume]")?.focus({ preventScroll: true }),
      60
    );
  }

  closePause() {
    this.modalOpen = false;
    this.$modal.hidden = true;
    this.$modal.innerHTML = "";
  }

  toggleSound() {
    const next = !sound.enabled;
    store.setSetting("sound", next);
    this.refreshSoundButton();
    if (next) {
      sound.click();
      toast(t("common.sound"), { icon: "♪", detail: "On", ms: 1600 });
    } else {
      stopSpeaking();
      toast(t("common.sound"), { icon: "♪", detail: "Off", ms: 1600 });
    }
  }

  refreshSoundButton() {
    const btn = qs('[data-act="sound"]', this.host);
    if (!btn) return;
    btn.innerHTML = sound.enabled ? ICONS.sound : ICONS.mute;
    btn.setAttribute("aria-pressed", String(sound.enabled));
  }

  /* ------------------------------------------------------------------- misc */

  speak(text, opts) {
    return speak(text, opts);
  }

  get progress() {
    return { index: this.index, total: this.total };
  }
}
