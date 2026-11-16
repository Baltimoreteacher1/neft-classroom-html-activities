// Forge Run: a gentle geometry platformer for Unit 5.
// Run, jump and dodge through the forge. Correct geometry turns into a spell
// that clears the creature guarding the next gate.
import { EduWonderEngine, H, W, define } from "../core/engine.js";
import { ParticlePool } from "../core/particles.js";
import { STRINGS } from "./strings.js";

const FLOOR = 462;
const HERO_W = 34;
const HERO_H = 46;
const GRAVITY = 1450;
const JUMP_SPEED = -620;
const PLATFORMS = [
  [205, 388, 145],
  [432, 330, 160],
  [680, 395, 145],
];
const CRYSTALS = [268, 505, 726];
const CRYSTAL_Y = [350, 292, 358];
const CREATURE_COLORS = ["#8ee8dc", "#ffb45c", "#e7a0ff", "#93b8ff"];

function randint(next, min, max) {
  return min + Math.floor(next() * (max - min + 1));
}

function makeQuestion(mode, level, next) {
  const size = level <= 1 ? 4 : level === 2 ? 6 : 8;
  let correct;
  let distractorA;
  let distractorB;
  let setup;
  let formula;
  let prompt;
  let promptVars;
  let kind;
  if (mode === 0) {
    const b = randint(next, 2, size);
    const h = randint(next, 2, Math.min(5, size));
    correct = b * h;
    distractorA = b + h;
    distractorB = correct + Math.max(b, h);
    kind = "slime";
    formula = "hintArea";
    setup = "setupArea";
    prompt = "qShield";
    promptVars = { b, h };
  } else if (mode === 1) {
    const b = randint(next, 2, size - (size % 2));
    const h = randint(next, 2, Math.min(5, size));
    correct = (b * h) / 2;
    distractorA = b * h;
    distractorB = b + h;
    kind = "slime";
    formula = "hintTriangle";
    setup = "setupTriangle";
    prompt = "qTriangle";
    promptVars = { b, h };
  } else if (mode === 2) {
    const l = randint(next, 2, level <= 1 ? 3 : 5);
    const w = randint(next, 2, level <= 1 ? 4 : 5);
    const h = randint(next, 2, level <= 1 ? 3 : 5);
    correct = 2 * (l * w + l * h + w * h);
    distractorA = l * w + l * h + w * h;
    distractorB = l * w * h;
    kind = "golem";
    formula = "hintSurface";
    setup = "setupSurface";
    prompt = "qSurface";
    promptVars = { l, w, h };
  } else {
    const l = randint(next, 2, level <= 1 ? 3 : 5);
    const w = randint(next, 2, level <= 1 ? 4 : 5);
    const h = randint(next, 2, level <= 1 ? 3 : 5);
    correct = l * w * h;
    distractorA = l * w + l * h + w * h;
    distractorB = l + w + h;
    kind = "bat";
    formula = "hintVolume";
    setup = "setupVolume";
    prompt = "qVolume";
    promptVars = { l, w, h };
  }
  if (distractorA === correct) distractorA += 2;
  if (distractorB === correct || distractorB === distractorA) distractorB += 3;
  const answers = [correct, distractorA, distractorB];
  if (next() < 0.5) [answers[0], answers[1]] = [answers[1], answers[0]];
  if (next() < 0.5) [answers[1], answers[2]] = [answers[2], answers[1]];
  return {
    correct,
    answerIndex: answers.indexOf(correct),
    answers,
    answerText: [String(answers[0]), String(answers[1]), String(answers[2])],
    kind,
    formulaKey: formula,
    setupKey: setup,
    promptKey: prompt,
    promptVars,
  };
}

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

class PolyhedralForge extends EduWonderEngine {
  static meta = {
    gameId: "u5-polyhedral-forge",
    unit: 5,
    lessons: ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "5-7", "5-8", "5-9", "5-10"],
    checkId: "check",
  };
  static strings = STRINGS;

  initWorld() {
    this.particles = new ParticlePool(140, ["#ffca66", "#7ce2d5", "#ffa0d7", "#fff1a3"]);
    this.heroX = 72;
    this.heroY = FLOOR - HERO_H;
    this.heroVx = 0;
    this.heroVy = 0;
    this.grounded = true;
    this.jumpCount = 0;
    this.moveLeft = false;
    this.moveRight = false;
    this.health = 3;
    this.gems = 0;
    this.gemTaken = new Uint8Array(3);
    this.enemyX = 800;
    this.enemyPhase = 0;
    this.fireballX = 0;
    this.fireballY = 0;
    this.fireballActive = false;
    this.attackTimer = 3.1;
    this.boltTimer = 0;
    this.shakeTimer = 0;
    this.question = null;
    this.hintText = "";
    this.hudTitle = "";
    this.gateText = "";
    this.heartsText = "";
    this.crystalsText = "";
    this.winText = "";
    this.comboText = "";
    this.streak = 0;
    this.mode = 0;
    this.enemySkin = 0;
    this.selectedAnswer = -1;
    this.frameCount = 0;
    this.inputLabel = null;
    this.answerButtons = [];
  }

  buildControls() {
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp Space A D W");
    this.canvas.addEventListener("keydown", (event) => this.keyDown(event));
    this.canvas.addEventListener("keyup", (event) => this.keyUp(event));
    this.canvas.addEventListener("blur", () => {
      this.moveLeft = false;
      this.moveRight = false;
    });

    const left = this.button({ id: "run-left", label: "left", onPress: () => this.nudge(-1) });
    const jump = this.button({ id: "jump", label: "jump", onPress: () => this.jump() });
    const right = this.button({ id: "run-right", label: "right", onPress: () => this.nudge(1) });
    this.holdButton(left, "moveLeft");
    this.holdButton(right, "moveRight");
    this.jumpButton = jump;

    this.answerButtons = [0, 1, 2].map((i) => {
      const button = this.button({
        id: `answer-${i}`,
        label: `choice${i}`,
        onPress: () => this.selectAnswer(i),
      });
      button.setAttribute("aria-pressed", "false");
      return button;
    });
    this.castButton = this.button({
      id: "check",
      label: "cast",
      primary: true,
      onPress: () => this.check(),
    });
    this.binders.push(() => {
      for (let i = 0; i < this.answerButtons.length; i++) {
        const button = this.answerButtons[i];
        button.textContent = `${this.t(`choice${i}`)}: ${this.question?.answerText[i] ?? ""}`;
        button.disabled = this.solved;
        button.setAttribute("aria-pressed", String(this.selectedAnswer === i));
      }
      this.castButton.disabled = this.solved;
    });
  }

  holdButton(button, property) {
    button.addEventListener("pointerdown", (event) => {
      this[property] = true;
      button.setPointerCapture(event.pointerId);
    });
    const release = () => {
      this[property] = false;
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  }

  keyDown(event) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "A", "d", "D", "w", "W"].includes(event.key))
      event.preventDefault();
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") this.moveLeft = true;
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") this.moveRight = true;
    if ((event.key === "ArrowUp" || event.key === " " || event.key === "w" || event.key === "W") && !event.repeat)
      this.jump();
  }

  keyUp(event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") this.moveLeft = false;
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") this.moveRight = false;
  }

  nudge(direction) {
    this.heroX = Math.max(20, Math.min(W - HERO_W - 20, this.heroX + direction * 36));
    this.heroVx = direction * 100;
  }

  jump() {
    if (this.grounded || this.jumpCount < 2) {
      this.heroVy = this.jumpCount === 0 ? JUMP_SPEED : JUMP_SPEED * 0.82;
      this.jumpCount++;
      this.grounded = false;
      this.synth.unlock();
    }
  }

  selectAnswer(index) {
    if (this.solved) return;
    this.selectedAnswer = index;
    for (let i = 0; i < this.answerButtons.length; i++)
      this.answerButtons[i].setAttribute("aria-pressed", String(i === index));
    this.setFeedback(this.t("selected"));
  }

  newRound(level, next) {
    this.mode = this.totalSolved % 4;
    this.enemySkin = (this.totalSolved + 1) % CREATURE_COLORS.length;
    this.question = makeQuestion(this.mode, level, next);
    this.selectedAnswer = -1;
    this.heroX = 72;
    this.heroY = FLOOR - HERO_H;
    this.heroVx = 0;
    this.heroVy = 0;
    this.grounded = true;
    this.jumpCount = 0;
    this.health = 3;
    this.gems = 0;
    this.refreshStrings();
    this.gemTaken.fill(0);
    this.enemyX = 800;
    this.enemyPhase = 0;
    this.fireballActive = false;
    this.attackTimer = 3.1;
    this.boltTimer = 0;
    this.shakeTimer = 0;
    this.particles.clear();
    this.onTier(this.tier);
    for (let i = 0; i < this.answerButtons.length; i++) {
      this.answerButtons[i].disabled = false;
      this.answerButtons[i].setAttribute("aria-pressed", "false");
    }
    if (this.castButton) this.castButton.disabled = false;
  }

  onTier(tier) {
    this.hintText = tier === 0 ? "" : tier === 1 ? this.question?.formula ?? "" : this.question?.setup ?? "";
  }

  refreshStrings() {
    const q = this.question;
    if (!q) return;
    q.prompt = this.t(q.promptKey, q.promptVars);
    q.formula = this.t(q.formulaKey);
    q.setup = this.t(q.setupKey, q.promptVars);
    this.hudTitle = this.t("title");
    this.gateText = this.t("gate");
    this.winText = this.t("winBanner");
    this.heartsText = `${this.t("hearts")}: ${this.health}`;
    this.crystalsText = `${this.t("crystals")}: ${this.gems}/3`;
    this.comboText = this.streak > 1 ? this.t("combo", { n: this.streak }) : "";
    this.onTier(this.tier);
  }

  onLanguage() {
    this.refreshStrings();
  }

  mission() {
    return `${this.question?.prompt ?? this.t("loading")} ${this.t("controlsHint")}`;
  }

  describe() {
    return `${this.question?.prompt ?? "Forge Run"} ${this.t("controlsHint")}`;
  }

  evaluate() {
    if (this.selectedAnswer < 0) return { ok: false, key: "chooseAnswer" };
    if (this.heroX < 520) return { ok: false, key: "moveCloser" };
    return this.selectedAnswer === this.question.answerIndex
      ? { ok: true, key: "creatureDefeated" }
      : { ok: false, key: "wrongAnswer", misconception: "check-area-setup" };
  }

  testPlan() {
    return [
      { control: "run-right", key: "Enter", times: 15 },
      { control: "jump", key: "Enter" },
      { control: `answer-${this.question.answerIndex}`, key: "Enter" },
      { control: "check", key: "Enter" },
    ];
  }

  onMiss() {
    this.streak = 0;
    this.comboText = "";
    this.shakeTimer = 0.14;
    this.fireballActive = true;
    this.fireballX = this.enemyX - 30;
    this.fireballY = FLOOR - 34;
    this.particles.emit(this.enemyX - 24, FLOOR - 60, 9, 110, 2);
    this.synth.strain();
  }

  onSolved() {
    this.streak++;
    this.comboText = this.streak > 1 ? this.t("combo", { n: this.streak }) : "";
    this.boltTimer = 0.7;
    this.shakeTimer = 0.2;
    this.fireballActive = false;
    this.particles.emit(this.enemyX, FLOOR - 72, 42 + this.gems * 20, 260, 4, -Math.PI, Math.PI, 1.2);
    this.synth.impact(0.8);
  }

  updatePhysics(dt) {
    this.frameCount++;
    this.particles.update(dt);
    if (this.boltTimer > 0) this.boltTimer = Math.max(0, this.boltTimer - dt);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    if (this.solved) return;

    const direction = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
    if (direction) this.heroVx = direction * 245;
    else this.heroVx *= Math.max(0, 1 - dt * 8);
    this.heroX = Math.max(18, Math.min(W - HERO_W - 18, this.heroX + this.heroVx * dt));

    const previousBottom = this.heroY + HERO_H;
    this.heroVy = Math.min(720, this.heroVy + GRAVITY * dt);
    this.heroY += this.heroVy * dt;
    this.grounded = false;
    let landing = FLOOR;
    for (let i = 0; i < PLATFORMS.length; i++) {
      const [px, py, pw] = PLATFORMS[i];
      if (previousBottom <= py && this.heroY + HERO_H >= py && this.heroX + HERO_W > px && this.heroX < px + pw) {
        landing = Math.min(landing, py);
      }
    }
    if (this.heroVy >= 0 && this.heroY + HERO_H >= landing) {
      this.heroY = landing - HERO_H;
      this.heroVy = 0;
      this.grounded = true;
      this.jumpCount = 0;
    }
    if (this.heroY > H + 10) {
      this.heroX = 72;
      this.heroY = FLOOR - HERO_H;
      this.heroVy = 0;
      this.jumpCount = 0;
      this.grounded = true;
    }

    for (let i = 0; i < CRYSTALS.length; i++) {
      if (!this.gemTaken[i] && Math.abs(this.heroX + HERO_W / 2 - CRYSTALS[i]) < 28 && Math.abs(this.heroY + HERO_H / 2 - CRYSTAL_Y[i]) < 34) {
        this.gemTaken[i] = 1;
        this.gems++;
        this.crystalsText = `${this.t("crystals")}: ${this.gems}/3`;
        this.particles.emit(CRYSTALS[i], this.heroY + 20, 12, 140, 2);
        this.synth.tick();
      }
    }

    this.enemyPhase += dt;
    this.enemyX = 800 + Math.sin(this.enemyPhase * 1.4) * 26;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && !this.fireballActive) {
      this.attackTimer = 3.6;
      this.fireballActive = true;
      this.fireballX = this.enemyX - 28;
      this.fireballY = FLOOR - 34;
    }
    if (this.fireballActive) {
      this.fireballX -= 210 * dt;
      if (Math.abs(this.fireballX - (this.heroX + HERO_W / 2)) < 20 && Math.abs(this.fireballY - (this.heroY + HERO_H / 2)) < 36) {
        this.fireballActive = false;
        this.health = Math.max(0, this.health - 1);
        this.setFeedback(this.t("hit"));
        this.shakeTimer = 0.16;
        this.heartsText = `${this.t("hearts")}: ${this.health}`;
        this.particles.emit(this.heroX + HERO_W / 2, this.heroY + 20, 10, 150, 3);
        this.synth.strain();
        if (this.health === 0) {
          this.health = 3;
          this.heartsText = `${this.t("hearts")}: ${this.health}`;
          this.heroX = 72;
          this.heroY = FLOOR - HERO_H;
          this.heroVy = 0;
        }
      }
      if (this.fireballX < -20) this.fireballActive = false;
    }
  }

  drawCreature(ctx) {
    const x = this.enemyX;
    const y = FLOOR - 52 + Math.sin(this.enemyPhase * 3) * 5;
    const color = CREATURE_COLORS[this.enemySkin];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    if (this.question.kind === "bat") {
      ctx.beginPath();
      ctx.moveTo(-24, 4); ctx.lineTo(-66, -26); ctx.lineTo(-48, 20); ctx.lineTo(-18, 22);
      ctx.moveTo(24, 4); ctx.lineTo(66, -26); ctx.lineTo(48, 20); ctx.lineTo(18, 22);
      ctx.fill();
    }
    if (this.question.kind === "slime") {
      ctx.beginPath(); ctx.ellipse(0, -13, 35, 29, 0, Math.PI, Math.PI * 2); ctx.lineTo(35, 4); ctx.quadraticCurveTo(0, 28, -35, 4); ctx.closePath(); ctx.fill();
    } else {
      rounded(ctx, -31, -42, 62, 58, 18); ctx.fill();
    }
    if (this.question.kind === "golem") {
      ctx.fillStyle = "#7688a8"; rounded(ctx, -45, -16, 16, 35, 6); ctx.fill(); rounded(ctx, 29, -16, 16, 35, 6); ctx.fill();
      ctx.fillStyle = "#ffcf73"; ctx.fillRect(-5, -39, 10, 8);
    }
    ctx.fillStyle = "#18233b";
    ctx.beginPath(); ctx.arc(-11, -20, 5, 0, Math.PI * 2); ctx.arc(11, -20, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#18233b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -7, 9, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.fillStyle = "#fff1a3"; ctx.beginPath(); ctx.arc(-11, -21, 2, 0, Math.PI * 2); ctx.arc(11, -21, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  renderScene(ctx) {
    ctx.save();
    if (this.shakeTimer > 0) ctx.translate(this.frameCount % 2 ? 3 : -3, 0);
    ctx.fillStyle = "#0c1530";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = i % 3 === 0 ? "#52658e" : "#273859";
      ctx.fillRect((i * 83 + this.totalSolved * 19) % W, (i * 47) % 260 + 28, i % 4 === 0 ? 4 : 2, i % 4 === 0 ? 4 : 2);
    }
    ctx.fillStyle = "#202b49";
    ctx.beginPath(); ctx.moveTo(0, 360); ctx.lineTo(180, 235); ctx.lineTo(310, 362); ctx.lineTo(490, 220); ctx.lineTo(670, 360); ctx.lineTo(820, 242); ctx.lineTo(960, 350); ctx.lineTo(960, FLOOR); ctx.lineTo(0, FLOOR); ctx.closePath(); ctx.fill();

    // Forge gate and the floating runes show the world is alive before input.
    ctx.strokeStyle = "#e8a64c"; ctx.lineWidth = 8; rounded(ctx, 737, 200, 122, 264, 24); ctx.stroke();
    ctx.fillStyle = "#392c4d"; rounded(ctx, 757, 236, 82, 224, 18); ctx.fill();
    ctx.fillStyle = "#ffcc74"; ctx.font = "700 17px system-ui"; ctx.textAlign = "center"; ctx.fillText(this.gateText, 798, 190);

    ctx.fillStyle = "#324563";
    ctx.strokeStyle = "#6d82a9";
    ctx.lineWidth = 3;
    for (let i = 0; i < PLATFORMS.length; i++) {
      const [x, y, w] = PLATFORMS[i];
      rounded(ctx, x, y, w, 22, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#66d5c4"; ctx.fillRect(x + 12, y + 4, w - 24, 4); ctx.fillStyle = "#324563";
    }
    ctx.fillStyle = "#293a58"; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = "#64d7bf"; ctx.fillRect(0, FLOOR, W, 7);

    for (let i = 0; i < CRYSTALS.length; i++) {
      if (this.gemTaken[i]) continue;
      const y = CRYSTAL_Y[i] + Math.sin(this.frameCount * 0.06 + i) * 4;
      ctx.fillStyle = i % 2 ? "#b98cff" : "#ffe58a";
      ctx.beginPath(); ctx.moveTo(CRYSTALS[i], y - 13); ctx.lineTo(CRYSTALS[i] + 10, y); ctx.lineTo(CRYSTALS[i], y + 13); ctx.lineTo(CRYSTALS[i] - 10, y); ctx.closePath(); ctx.fill();
    }

    // Small fireballs are dodgeable; losing all three hearts simply respawns.
    if (this.fireballActive) {
      ctx.fillStyle = "#ff8155"; ctx.beginPath(); ctx.arc(this.fireballX, this.fireballY, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff0a3"; ctx.beginPath(); ctx.arc(this.fireballX - 3, this.fireballY, 6, 0, Math.PI * 2); ctx.fill();
    }

    this.drawCreature(ctx);
    ctx.fillStyle = "#e8eefc";
    rounded(ctx, this.heroX, this.heroY + 10, HERO_W, HERO_H - 10, 9); ctx.fill();
    ctx.fillStyle = "#36b9ad"; rounded(ctx, this.heroX + 3, this.heroY + 22, HERO_W - 6, HERO_H - 17, 7); ctx.fill();
    ctx.fillStyle = "#17203a"; ctx.fillRect(this.heroX + 8, this.heroY + 19, 5, 5); ctx.fillRect(this.heroX + 22, this.heroY + 19, 5, 5);
    ctx.fillStyle = "#ffc963"; rounded(ctx, this.heroX + 9, this.heroY, 16, 15, 5); ctx.fill();
    ctx.fillStyle = "#24324f"; ctx.fillRect(this.heroX + 12, this.heroY + 6, 3, 3); ctx.fillRect(this.heroX + 19, this.heroY + 6, 3, 3);

    if (this.boltTimer > 0) {
      ctx.strokeStyle = "#fff0a3"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(this.heroX + HERO_W, this.heroY + 25); ctx.lineTo(this.enemyX - 25, FLOOR - 56); ctx.stroke();
      ctx.strokeStyle = "#6cf5dd"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(this.heroX + HERO_W, this.heroY + 25); ctx.lineTo(this.enemyX - 25, FLOOR - 56); ctx.stroke();
    }

    // Heads-up display keeps goals and recovery visible without a countdown.
    ctx.fillStyle = "rgba(8, 15, 32, .88)"; rounded(ctx, 20, 18, 920, 104, 18); ctx.fill();
    ctx.textAlign = "left"; ctx.fillStyle = "#ffd37b"; ctx.font = "800 23px system-ui"; ctx.fillText(this.hudTitle, 42, 50);
    ctx.fillStyle = "#eaf0ff"; ctx.font = "700 20px system-ui"; ctx.fillText(this.question.prompt, 42, 82);
    if (this.hintText) { ctx.fillStyle = "#8ee8dc"; ctx.font = "600 17px system-ui"; ctx.fillText(this.hintText, 42, 107); }
    ctx.textAlign = "right"; ctx.fillStyle = "#ffb8c3"; ctx.font = "700 17px system-ui"; ctx.fillText(this.heartsText, 914, 50);
    ctx.fillStyle = "#ffe58a"; ctx.fillText(this.crystalsText, 914, 81);
    if (this.comboText) { ctx.textAlign = "center"; ctx.fillStyle = "#a9ffec"; ctx.font = "800 19px system-ui"; ctx.fillText(this.comboText, W / 2, 150); }
    if (this.solved) {
      ctx.textAlign = "center"; ctx.fillStyle = "#fff1a3"; ctx.font = "900 34px system-ui"; ctx.fillText(this.winText, W / 2, 295);
    }
    this.particles.render(ctx);
    ctx.restore();
  }
}

define("ew-polyhedral-forge", PolyhedralForge);
