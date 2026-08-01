// celebration-picker.js — Publisher-grade interactive math celebration choice bar & FX engine
//
// Gives students 4 creative, math-lesson related celebration choices on lesson completion
// (3D polygon bursts, Matrix math number rain, equation fireworks, golden math confetti).

const STYLE_ID = "nt-celebration-picker-style";

const CSS = `
.nt-celebration-card {
  margin-top: clamp(16px, 3vw, 28px);
  padding: clamp(16px, 3vw, 24px);
  background: linear-gradient(135deg, #12355b 0%, #1e4a7a 100%);
  border-radius: 18px;
  color: #ffffff;
  box-shadow: 0 10px 32px rgba(18, 53, 91, 0.25);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.nt-celebration-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nt-celebration-head-icon {
  font-size: 28px;
}
.nt-celebration-title {
  font: 800 20px/1.2 var(--font-display, "Outfit", system-ui, sans-serif);
  margin: 0;
  color: #ffffff;
}
.nt-celebration-subtitle {
  font: 400 13px/1.3 var(--font-body, system-ui, sans-serif);
  margin: 2px 0 0;
  color: #b0d2f5;
}

.nt-celebration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.nt-celebration-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  cursor: pointer;
  transition: all .2s ease;
  text-align: left;
  user-select: none;
}
.nt-celebration-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}
.nt-celebration-btn:focus-visible {
  outline: 3px solid #2f8f7d;
  outline-offset: 2px;
}
.nt-celebration-btn.active {
  background: #ffffff;
  border-color: #2f8f7d;
  color: #12355b;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.nt-celebration-btn.active .nt-celebration-btn-desc {
  color: #435b75;
}

.nt-celebration-btn-title {
  font: 800 14px/1.2 var(--font-display, "Outfit", system-ui, sans-serif);
  display: flex;
  align-items: center;
  gap: 6px;
}
.nt-celebration-btn-desc {
  font: 400 12px/1.3 var(--font-body, system-ui, sans-serif);
  color: #c4dcf5;
}

.nt-celebration-replay {
  align-self: center;
  font: 700 13px/1 var(--font-ui, system-ui, sans-serif);
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  cursor: pointer;
  transition: all .15s ease;
}
.nt-celebration-replay:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: #ffffff;
}

@media (max-width: 500px) {
  .nt-celebration-grid {
    grid-template-columns: 1fr 1fr;
  }
}
`;

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/**
 * Available celebration FX presets
 */
export const CELEBRATION_PRESETS = {
  polygon_3d: {
    id: "polygon_3d",
    name: "3D Geometry Burst",
    nameEs: "Explosión 3D de geometría",
    icon: "🚀",
    desc: "Tumbling 3D cubes, pyramids, & polyhedrons",
    descEs: "Cubos, pirámides y poliedros 3D en movimiento",
  },
  matrix_math: {
    id: "matrix_math",
    name: "Matrix Math Rain",
    nameEs: "Lluvia de números Matrix",
    icon: "💥",
    desc: "Cascading green & cyan math digits and operators",
    descEs: "Dígitos y operadores matemáticos en cascada",
  },
  equation_fireworks: {
    id: "equation_fireworks",
    name: "Math Fireworks",
    nameEs: "Fuegos artificiales de ecuaciones",
    icon: "🔥",
    desc: "Rockets exploding into %, =, +, and star rings",
    descEs: "Cohetes explotando en anillos de %, =, + y estrellas",
  },
  classic_confetti: {
    id: "classic_confetti",
    name: "Math Star Confetti",
    nameEs: "Confeti de estrellas matemáticas",
    icon: "⭐",
    desc: "Gold stars, floating 3D numbers, and colorful streamers",
    descEs: "Estrellas doradas, números 3D flotantes y serpentinas",
  },
};

/**
 * Get the 4 celebration choices for a lesson based on unit/topic
 */
export function getLessonCelebrations(config = null) {
  return [
    CELEBRATION_PRESETS.polygon_3d,
    CELEBRATION_PRESETS.matrix_math,
    CELEBRATION_PRESETS.equation_fireworks,
    CELEBRATION_PRESETS.classic_confetti,
  ];
}

let currentAnimationId = null;

/**
 * Fire the selected Celebration FX on canvas
 */
export function fireCelebrationFX(type = "classic_confetti") {
  if (typeof document === "undefined") return;

  if (currentAnimationId) {
    cancelAnimationFrame(currentAnimationId);
    currentAnimationId = null;
  }

  const existingCanvas = document.getElementById("nt-celebration-canvas");
  if (existingCanvas) existingCanvas.remove();

  const canvas = document.createElement("canvas");
  canvas.id = "nt-celebration-canvas";
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (type === "polygon_3d") {
    runPolygon3DFX(ctx, canvas);
  } else if (type === "matrix_math") {
    runMatrixMathFX(ctx, canvas);
  } else if (type === "equation_fireworks") {
    runEquationFireworksFX(ctx, canvas);
  } else {
    runClassicMathConfettiFX(ctx, canvas);
  }
}

/**
 * 1. 3D Polygon Burst Animation
 */
function runPolygon3DFX(ctx, canvas) {
  const shapes = ["cube", "pyramid", "octahedron"];
  const colors = ["#2f8f7d", "#12355b", "#d9795d", "#f2a93b", "#387f84"];

  const particles = Array.from({ length: 60 }).map(() => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 18,
    vy: (Math.random() - 0.7) * 16,
    rotX: Math.random() * Math.PI * 2,
    rotY: Math.random() * Math.PI * 2,
    vRotX: (Math.random() - 0.5) * 0.1,
    vRotY: (Math.random() - 0.5) * 0.1,
    size: Math.random() * 16 + 12,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
  }));

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // gravity
      p.rotX += p.vRotX;
      p.rotY += p.vRotY;
      p.life -= 0.01;

      if (p.life > 0 && p.y < canvas.height + 40) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = p.color + "33";

        // Draw pseudo-3D polygon
        ctx.beginPath();
        const s = p.size;
        const cosX = Math.cos(p.rotX);
        const sinY = Math.sin(p.rotY);

        if (p.shape === "cube") {
          ctx.rect(-s / 2, -s / 2, s, s);
          ctx.stroke();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(-s / 2 + 5 * cosX, -s / 2 + 5 * sinY);
          ctx.lineTo(s / 2 + 5 * cosX, -s / 2 + 5 * sinY);
          ctx.stroke();
        } else if (p.shape === "pyramid") {
          ctx.moveTo(0, -s);
          ctx.lineTo(-s, s);
          ctx.lineTo(s, s);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        } else {
          ctx.moveTo(0, -s);
          ctx.lineTo(s, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s, 0);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        }
        ctx.restore();
      }
    });

    if (active) {
      currentAnimationId = requestAnimationFrame(loop);
    } else {
      canvas.remove();
    }
  }

  loop();
}

/**
 * 2. Matrix Math Rain Animation
 */
function runMatrixMathFX(ctx, canvas) {
  const chars = "0123456789+=−×÷%π√∞";
  const fontSize = 18;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array.from({ length: columns }).map(() => Math.random() * -50);

  let frame = 0;
  function loop() {
    ctx.fillStyle = "rgba(11, 37, 64, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `bold ${fontSize}px "Outfit", monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      ctx.fillStyle = Math.random() > 0.8 ? "#ffffff" : "#2f8f7d";
      ctx.fillText(text, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    frame++;
    if (frame < 120) {
      currentAnimationId = requestAnimationFrame(loop);
    } else {
      canvas.remove();
    }
  }

  loop();
}

/**
 * 3. Math Equation Fireworks FX
 */
function runEquationFireworksFX(ctx, canvas) {
  const mathSymbols = ["%", "=", "+", "×", "π", "★", "100%"];
  const colors = ["#f2a93b", "#d9795d", "#12355b", "#2f8f7d", "#ffffff"];

  const rockets = Array.from({ length: 5 }).map((_, i) => ({
    x: (canvas.width / 6) * (i + 1),
    y: canvas.height,
    targetY: canvas.height * (0.2 + Math.random() * 0.3),
    vy: -12 - Math.random() * 4,
    exploded: false,
  }));

  const particles = [];

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    // Update rockets
    rockets.forEach((r) => {
      if (!r.exploded) {
        active = true;
        r.y += r.vy;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(r.x - 2, r.y, 4, 12);

        if (r.y <= r.targetY) {
          r.exploded = true;
          // Spawn explosion particles
          for (let p = 0; p < 25; p++) {
            const angle = (Math.PI * 2 * p) / 25;
            const speed = 4 + Math.random() * 6;
            particles.push({
              x: r.x,
              y: r.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              symbol: mathSymbols[Math.floor(Math.random() * mathSymbols.length)],
              color: colors[Math.floor(Math.random() * colors.length)],
              life: 1,
            });
          }
        }
      }
    });

    // Update particles
    particles.forEach((p) => {
      if (p.life > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= 0.015;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.fillText(p.symbol, p.x, p.y);
        ctx.restore();
      }
    });

    if (active) {
      currentAnimationId = requestAnimationFrame(loop);
    } else {
      canvas.remove();
    }
  }

  loop();
}

/**
 * 4. Classic Math Confetti & Stars FX
 */
function runClassicMathConfettiFX(ctx, canvas) {
  const symbols = ["★", "100%", "+1", "π", "√", "∞", "●", "◆"];
  const colors = ["#F2A93B", "#387F84", "#C85A3A", "#4A7C6F", "#12355b"];

  const pieces = Array.from({ length: 100 }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * 5 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.2,
  }));

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rot += p.rotSpeed;

      if (p.y < canvas.height) active = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.font = 'bold 16px "Outfit", sans-serif';
      ctx.fillText(p.symbol, 0, 0);
      ctx.restore();
    });

    if (active) {
      currentAnimationId = requestAnimationFrame(loop);
    } else {
      canvas.remove();
    }
  }

  loop();
}

/**
 * Render the Celebration Choice Bar UI into a container
 */
export function renderCelebrationPicker(container, config = null) {
  if (!container || typeof document === "undefined") return null;
  ensureStyles();

  const savedStyle = (function () {
    try {
      return localStorage.getItem("nt-celebration-style") || "polygon_3d";
    } catch {
      return "polygon_3d";
    }
  })();

  const choices = getLessonCelebrations(config);

  const wrapper = document.createElement("div");
  wrapper.className = "nt-celebration-card";
  wrapper.innerHTML = `
    <div class="nt-celebration-head">
      <span class="nt-celebration-head-icon">🎉</span>
      <div>
        <h3 class="nt-celebration-title">Choose Your Victory Celebration!</h3>
        <p class="nt-celebration-subtitle">Pick how you want to celebrate completing this lesson</p>
      </div>
    </div>

    <div class="nt-celebration-grid">
      ${choices
        .map(
          (c) => `
        <button type="button" class="nt-celebration-btn ${c.id === savedStyle ? "active" : ""}" data-fx="${c.id}">
          <span class="nt-celebration-btn-title"><span>${c.icon}</span> <span>${c.name}</span></span>
          <span class="nt-celebration-btn-desc">${c.desc}</span>
        </button>
      `,
        )
        .join("")}
    </div>

    <button type="button" class="nt-celebration-replay">🎆 Replay Celebration</button>
  `;

  const btns = wrapper.querySelectorAll(".nt-celebration-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const fxId = btn.dataset.fx;
      try {
        localStorage.setItem("nt-celebration-style", fxId);
      } catch {}

      if (window.AudioSynth?.tada) window.AudioSynth.tada();
      fireCelebrationFX(fxId);
    });
  });

  const replayBtn = wrapper.querySelector(".nt-celebration-replay");
  replayBtn.addEventListener("click", () => {
    const activeBtn = wrapper.querySelector(".nt-celebration-btn.active");
    const fxId = activeBtn?.dataset?.fx || "polygon_3d";
    if (window.AudioSynth?.tada) window.AudioSynth.tada();
    fireCelebrationFX(fxId);
  });

  container.appendChild(wrapper);

  // Trigger default celebration on load
  setTimeout(() => {
    fireCelebrationFX(savedStyle);
  }, 300);

  return wrapper;
}

export default {
  renderCelebrationPicker,
  fireCelebrationFX,
  getLessonCelebrations,
  CELEBRATION_PRESETS,
};
