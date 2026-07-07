import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ============================================================================
// Unit 1 — SMOOTHIE RECIPE LAB · Ratios & Unit Rates (6.AT.A.1–3)
//
// A relaxed Juice Bar & Math Visualizer.
// The student is presented with customer order tickets:
//   • Ratio orders  — Mix ingredients matching the recipe ratio (e.g. 1:2)
//     by adding 🍓 and 🍌 scoops. A dynamic, real-time Tape Diagram shows
//     how the ratio scales and highlights equivalent ratio subdivisions.
//   • Rate orders   — Find a unit rate (e.g. cost per smoothie). An interactive
//     Double Number Line visualizes equivalent rates and helps find the cost for 1.
//
// Mistakes are forgiving: wrong mixes trigger a yucky brown shake and let the
// student reset/try again without losing their progress.
// ============================================================================

const COLORS = {
  base: 0x123a6b,
  strawberry: 0xe0556b,
  banana: 0xf2c15b,
  teal: 0x1fa6a2,
  amber: 0xf2c15b,
  ok: 0x4aa978,
  bad: 0xb64e2f,
  wood: 0x8e6e53,
  glass: 0xdff1ff,
};

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function simplify(a, b) {
  const g = gcd(a, b);
  return [a / g, b / g];
}

// ---------------------------------------------------------------------------
// Dynamic SVG Tape Diagram Generator
// ---------------------------------------------------------------------------
function renderTapeDiagram(recipeA, recipeB, currentA, currentB, targetA, targetB) {
  const multA = recipeA > 0 ? currentA / recipeA : 0;
  const multB = recipeB > 0 ? currentB / recipeB : 0;
  const isEquivalent = (multA === multB && Number.isInteger(multA) && multA > 0);

  let html = `
    <svg width="100%" height="150" viewBox="0 0 280 150" style="display: block; margin: 0 auto;">
      <!-- Strawberries Bar -->
      <text x="10" y="22" fill="#e0556b" font-weight="800" font-size="11" font-family="system-ui">🍓 Strawberries (${currentA} / ${targetA})</text>
  `;

  const maxBoxes = Math.max(recipeA, recipeB, 1);
  const boxWidth = 260 / maxBoxes;
  const startX = 10;

  for (let i = 0; i < recipeA; i++) {
    const x = startX + i * boxWidth;
    const val = Number.isInteger(multA) ? multA : multA.toFixed(1);
    const boxColor = isEquivalent ? "rgba(224, 85, 107, 0.9)" : (multA > 0 ? "rgba(182, 78, 47, 0.9)" : "rgba(255, 255, 255, 0.1)");
    html += `
      <rect x="${x}" y="30" width="${boxWidth - 4}" height="28" rx="5" fill="${boxColor}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      <text x="${x + (boxWidth - 4)/2}" y="48" fill="white" font-weight="bold" font-size="11" font-family="system-ui" text-anchor="middle">${currentA > 0 ? val : ""}</text>
    `;
  }

  // Bananas Bar
  html += `
      <text x="10" y="87" fill="#f2c15b" font-weight="800" font-size="11" font-family="system-ui">🍌 Bananas (${currentB} / ${targetB})</text>
  `;
  for (let i = 0; i < recipeB; i++) {
    const x = startX + i * boxWidth;
    const val = Number.isInteger(multB) ? multB : multB.toFixed(1);
    const boxColor = isEquivalent ? "rgba(242, 193, 91, 0.9)" : (multB > 0 ? "rgba(182, 78, 47, 0.9)" : "rgba(255, 255, 255, 0.1)");
    const textColor = isEquivalent ? "#12355b" : "white";
    html += `
      <rect x="${x}" y="95" width="${boxWidth - 4}" height="28" rx="5" fill="${boxColor}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      <text x="${x + (boxWidth - 4)/2}" y="113" fill="${textColor}" font-weight="bold" font-size="11" font-family="system-ui" text-anchor="middle">${currentB > 0 ? val : ""}</text>
    `;
  }

  html += `</svg>`;
  return { html, isEquivalent };
}

// ---------------------------------------------------------------------------
// Dynamic SVG Double Number Line Generator
// ---------------------------------------------------------------------------
function renderDoubleNumberLine(total, count, currentGuess) {
  const unitRate = total / count;
  const maxSmoothies = Math.max(5, count + 1);
  const stepX = 240 / maxSmoothies;

  let html = `
    <svg width="100%" height="150" viewBox="0 0 280 150" style="display: block; margin: 0 auto;">
      <!-- Top Line: Cost -->
      <text x="10" y="20" fill="#2ecc71" font-weight="800" font-size="11" font-family="system-ui">Cost ($)</text>
      <line x1="20" y1="42" x2="260" y2="42" stroke="white" stroke-width="2"/>
      
      <!-- Bottom Line: Smoothies -->
      <text x="10" y="112" fill="#f2c15b" font-weight="800" font-size="11" font-family="system-ui">Smoothies</text>
      <line x1="20" y1="88" x2="260" y2="88" stroke="white" stroke-width="2"/>
  `;

  for (let i = 0; i <= maxSmoothies; i++) {
    const x = 20 + i * stepX;
    const costVal = i * unitRate;

    // Ticks
    html += `
      <line x1="${x}" y1="37" x2="${x}" y2="47" stroke="white" stroke-width="1.5"/>
      <line x1="${x}" y1="83" x2="${x}" y2="93" stroke="white" stroke-width="1.5"/>
      
      <!-- Cost Labels -->
      <text x="${x}" y="30" fill="#58d68d" font-size="9" font-family="system-ui" text-anchor="middle">$${costVal}</text>
      <!-- Smoothie Labels -->
      <text x="${x}" y="105" fill="#f2c15b" font-size="9" font-family="system-ui" text-anchor="middle">${i}</text>
    `;

    // Highlight connection at count
    if (i === count) {
      html += `
        <line x1="${x}" y1="42" x2="${x}" y2="88" stroke="rgba(255, 213, 107, 0.4)" stroke-dasharray="3,3" stroke-width="1.5"/>
      `;
    }

    // Show current guess highlighter at 1 smoothie
    if (i === 1) {
      const guessX = 20 + 1 * stepX;
      html += `
        <circle cx="${guessX}" cy="42" r="4.5" fill="#e0556b" stroke="white" stroke-width="1"/>
        <circle cx="${guessX}" cy="88" r="4.5" fill="#e0556b" stroke="white" stroke-width="1"/>
        <line x1="${guessX}" y1="42" x2="${guessX}" y2="88" stroke="#e0556b" stroke-width="1.5"/>
        <rect x="${guessX - 20}" y="52" width="40" height="20" rx="4" fill="#e0556b" opacity="0.9"/>
        <text x="${guessX}" y="65" fill="white" font-weight="bold" font-size="9" font-family="system-ui" text-anchor="middle">$${currentGuess}</text>
      `;
    }
  }

  html += `</svg>`;
  return html;
}

const LEVEL_DATA = {
  0: {
    hints: true,
    persistentHints: true,
    noTimer: true,
    orders: [
      { kind: "ratio", a: 1, b: 1, tag: "ratio-1-to-1" },
      { kind: "ratio", a: 2, b: 1, tag: "ratio-simple" },
      { kind: "ratio", a: 1, b: 2, tag: "ratio-simple" },
    ],
  },
  1: {
    hints: true,
    persistentHints: true,
    noTimer: true,
    orders: [
      { kind: "ratio", a: 1, b: 1, tag: "ratio-1-to-1" },
      { kind: "ratio", a: 2, b: 1, tag: "ratio-simple" },
      { kind: "ratio", a: 1, b: 2, tag: "ratio-simple" },
      { kind: "ratio", a: 2, b: 3, tag: "ratio-part-to-part" },
      { kind: "ratio", a: 3, b: 2, tag: "ratio-part-to-part" },
    ],
  },
  2: {
    hints: true,
    persistentHints: true,
    noTimer: true,
    orders: [
      {
        kind: "ratio",
        a: 4,
        b: 6,
        baseLabel: "2 : 3, doubled",
        tag: "ratio-scale-up",
      },
      {
        kind: "ratio",
        a: 6,
        b: 4,
        baseLabel: "3 : 2, doubled",
        tag: "ratio-scale-up",
      },
      {
        kind: "ratio",
        a: 6,
        b: 9,
        baseLabel: "2 : 3, tripled",
        tag: "ratio-scale-up",
      },
      {
        kind: "rate",
        prompt: "$6 for 3 smoothies. Price each?",
        total: 6,
        count: 3,
        unit: "$",
        answer: 2,
        tag: "unit-rate-price",
      },
      {
        kind: "rate",
        prompt: "12 scoops make 4 servings. Scoops per serving?",
        total: 12,
        count: 4,
        unit: "",
        answer: 3,
        tag: "unit-rate-quantity",
      },
      {
        kind: "rate",
        prompt: "$10 for 5 smoothies. Price each?",
        total: 10,
        count: 5,
        unit: "$",
        answer: 2,
        tag: "unit-rate-price",
      },
      {
        kind: "rate",
        prompt: "$15 for 5 smoothies. Price each?",
        total: 15,
        count: 5,
        unit: "$",
        answer: 3,
        tag: "unit-rate-price",
      },
    ],
  },
};

function makeLevel(level) {
  return LEVEL_DATA[level] || LEVEL_DATA[1];
}

export default {
  id: "unit-1-smoothie-stand",
  standard: "6.AT.A.1-3",
  learningTargets: [
    "Describe a part-to-part ratio of two quantities.",
    "Build an equivalent ratio by scaling both parts by the same number.",
    "Find a unit rate as total ÷ count.",
  ],
  levels: LEVEL_DATA,
  vocab: [
    {
      term: "Ratio",
      definition: "A way to compare two amounts, like 2 strawberries to 3 bananas.",
      emoji: "⚖️",
    },
    {
      term: "Part-to-part",
      definition: "A ratio that compares one part to another part, like fruit to fruit.",
      emoji: "🍓",
    },
    {
      term: "Equivalent ratio",
      definition: "A ratio that shows the same comparison, like 2 : 3 and 4 : 6.",
      emoji: "🟰",
    },
    {
      term: "Unit rate",
      definition: "How much you get for just one, like the price for one smoothie.",
      emoji: "1️⃣",
    },
    {
      term: "Scale",
      definition: "To grow or shrink amounts by the same number to keep a ratio.",
      emoji: "📈",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      renderer,
      input,
      hud,
      feel,
      announce,
      caption,
      THREE,
      level,
      onScore,
    } = ctx;

    const cfg = makeLevel(level);
    const reduced = feel.reducedMotion;

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    // ---- HTML Layout Injection ----
    const styleEl = document.createElement("style");
    styleEl.id = "recipe-lab-styles";
    styleEl.textContent = `
      #recipe-lab-ui {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: row;
        justify-content: space-between;
        padding: 70px 24px 80px 24px;
        pointer-events: none;
        font-family: var(--font-body, system-ui, sans-serif);
        box-sizing: border-box;
      }
      .ui-card {
        background: rgba(11, 28, 52, 0.94);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        pointer-events: auto;
        color: white;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        transition: all 0.3s ease;
      }
      .ui-card-left {
        width: 250px;
        border-left: 5px solid var(--amber, #f2c15b);
      }
      .ui-card-right {
        width: 310px;
        border-left: 5px solid var(--teal, #1fa6a2);
        align-items: center;
      }
      .ticket-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--amber, #f2c15b);
        margin-bottom: 8px;
        border-bottom: 1px dashed rgba(255,255,255,0.2);
        padding-bottom: 4px;
      }
      .ticket-body {
        font-size: 14px;
        line-height: 1.4;
        margin: 6px 0;
      }
      .ticket-badge {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        margin-top: 8px;
        font-weight: bold;
        color: #e0f2fe;
      }
      .visualizer-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--teal, #1fa6a2);
        margin-bottom: 10px;
        align-self: flex-start;
      }
      .controls-bar {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 500px;
        background: rgba(11, 28, 52, 0.94);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 12px 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        pointer-events: auto;
        display: flex;
        gap: 10px;
        justify-content: center;
        z-index: 20;
      }
      .lab-btn {
        flex: 1;
        border: none;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
        transition: transform 0.1s, box-shadow 0.1s, opacity 0.2s;
        user-select: none;
        -webkit-user-select: none;
        outline: none;
      }
      .lab-btn:active {
        transform: scale(0.95);
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      .lab-btn-strawberry {
        background: linear-gradient(135deg, #e0556b, #c2384e);
      }
      .lab-btn-banana {
        background: linear-gradient(135deg, #f2c15b, #d9a438);
        color: #12355b;
        text-shadow: none;
      }
      .lab-btn-undo {
        background: linear-gradient(135deg, #5c7596, #41556e);
      }
      .lab-btn-serve {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        box-shadow: 0 3px 12px rgba(46, 204, 113, 0.35);
      }
      .lab-btn-rate-down {
        background: linear-gradient(135deg, #e0556b, #c2384e);
      }
      .lab-btn-rate-up {
        background: linear-gradient(135deg, #1fa6a2, #188784);
      }
      
      @media (max-width: 768px) {
        #recipe-lab-ui {
          flex-direction: column;
          padding: 60px 12px 100px 12px;
          justify-content: flex-start;
          gap: 12px;
        }
        .ui-card {
          width: 100% !important;
          max-width: none !important;
          padding: 10px 14px;
        }
        .ui-card-right {
          margin-top: 0;
        }
        .controls-bar {
          bottom: 10px;
          padding: 8px 12px;
          width: calc(100% - 24px);
        }
      }
    `;
    document.head.appendChild(styleEl);

    const uiContainer = document.createElement("div");
    uiContainer.id = "recipe-lab-ui";
    uiContainer.innerHTML = `
      <div class="ui-card ui-card-left" id="order-ticket"></div>
      <div class="ui-card ui-card-right" id="math-visualizer"></div>
      <div class="controls-bar" id="controls-panel"></div>
    `;
    clarityMount.appendChild(uiContainer);

    // ---- Disposable registry ------------------------------------------------
    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };
    const std = (color, o = {}) =>
      track(
        new THREE.MeshStandardMaterial({
          color,
          roughness: o.roughness ?? 0.55,
          metalness: o.metalness ?? 0.05,
          emissive: o.emissive ?? 0x000000,
          emissiveIntensity: o.emissiveIntensity ?? 0,
        }),
      );

    // ---- Root group ---------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    // ---- 3D Studio Layout ---------------------------------------------------
    // Ground / floor
    const groundGeo = track(new THREE.CircleGeometry(20, 32));
    const ground = new THREE.Mesh(groundGeo, std(0x0e2b4f, { roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    ground.receiveShadow = true;
    group.add(ground);

    // Solid wooden counter top
    const counterGeo = track(new RoundedBoxGeometry(8, 0.8, 4.5, 4, 0.2));
    const counter = new THREE.Mesh(counterGeo, std(COLORS.wood, { roughness: 0.75 }));
    counter.position.set(0, -0.4, 0);
    counter.receiveShadow = true;
    counter.castShadow = true;
    group.add(counter);

    // dispenser pipes
    const pipeMat = std(0x7f8c8d, { metalness: 0.8, roughness: 0.15 });
    const pipeGeo = track(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16));

    const leftPipe = new THREE.Mesh(pipeGeo, pipeMat);
    leftPipe.position.set(-1.8, 3.2, 0);
    leftPipe.rotation.z = -Math.PI / 6;
    leftPipe.castShadow = true;
    group.add(leftPipe);

    const rightPipe = new THREE.Mesh(pipeGeo, pipeMat);
    rightPipe.position.set(1.8, 3.2, 0);
    rightPipe.rotation.z = Math.PI / 6;
    rightPipe.castShadow = true;
    group.add(rightPipe);

    // ---- 3D Blender Jar -----------------------------------------------------
    const blenderGroup = new THREE.Group();
    blenderGroup.position.set(0, 0, 0);
    group.add(blenderGroup);

    const jarRadius = 1.25;
    const jarGeo = track(
      new THREE.CylinderGeometry(jarRadius, jarRadius * 0.85, 3.2, 32, 1, true),
    );
    const jarMat = track(
      new THREE.MeshPhysicalMaterial({
        color: COLORS.glass,
        transparent: true,
        opacity: 0.2,
        transmission: 0.82,
        roughness: 0.08,
        metalness: 0,
        thickness: 0.3,
        side: THREE.DoubleSide,
      }),
    );
    const jar = new THREE.Mesh(jarGeo, jarMat);
    jar.position.y = 1.6;
    blenderGroup.add(jar);

    const jarBaseGeo = track(
      new THREE.CylinderGeometry(jarRadius * 0.95, jarRadius * 1.05, 0.6, 32),
    );
    const jarBase = new THREE.Mesh(
      jarBaseGeo,
      std(0x2c3e50, { metalness: 0.6, roughness: 0.2 }),
    );
    jarBase.position.y = 0.3;
    jarBase.castShadow = true;
    blenderGroup.add(jarBase);

    // Translucent blending liquid
    const liquidGeo = track(
      new THREE.CylinderGeometry(jarRadius * 0.91, jarRadius * 0.87, 2.7, 32),
    );
    const liquidMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xff8a80,
        transparent: true,
        opacity: 0.0,
        roughness: 0.22,
        transmission: 0.55,
      }),
    );
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = 1.4;
    liquid.scale.set(1, 0.001, 1);
    blenderGroup.add(liquid);

    // ---- Game State & Controls ----------------------------------------------
    const scoops = []; // { mesh, fruit }
    const activeFruits = []; // { mesh, vx, vy, x, y, z, targetX, targetY, targetZ, bounces, done }
    let counts = { strawberry: 0, banana: 0 };
    let order = null;
    let orderIndex = 0;
    let rateGuess = 0;
    const total = cfg.orders.length;

    let START_LIVES = level === 0 ? 6 : level === 2 ? 3 : 4;
    let lives = START_LIVES;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let running = false;
    let gameOver = false;
    let phase = "idle"; // idle | arriving | active | resolving | leaving

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    let unbindPress = null;
    let unbindTap = null;
    let unbindFrame = null;

    // ---- Dynamic on-screen HUD control panel updater ----
    function updateUI() {
      if (!order || gameOver || !running) {
        uiContainer.style.display = "none";
        return;
      }
      
      uiContainer.style.display = "flex";
      
      const ticketEl = uiContainer.querySelector("#order-ticket");
      const visualizerEl = uiContainer.querySelector("#math-visualizer");
      const controlsEl = uiContainer.querySelector("#controls-panel");
      const isActive = (phase === "active");
      
      // 1) Render Order Ticket
      if (order.kind === "ratio") {
        const [ba, bb] = simplify(order.a, order.b);
        ticketEl.innerHTML = `
          <div class="ticket-title">🧾 ORDER CHECK</div>
          <div class="ticket-body" style="font-size: 15px; font-weight: bold; color: #ffd56b;">Customer Order:</div>
          <div class="ticket-body">Serve a smoothie with a ratio of <b>${order.a} Strawberry</b> to <b>${order.b} Banana</b>.</div>
          <div class="ticket-badge">Recipe base: ${ba} 🍓 : ${bb} 🍌</div>
        `;
      } else {
        ticketEl.innerHTML = `
          <div class="ticket-title">🧾 ORDER CHECK</div>
          <div class="ticket-body" style="font-size: 15px; font-weight: bold; color: #ffd56b;">Unit Rate Order:</div>
          <div class="ticket-body">${order.prompt}</div>
          <div class="ticket-badge">Find the cost for 1 smoothie!</div>
        `;
      }
      
      // 2) Render Visualizer (Tape Diagram or Double Number Line)
      if (order.kind === "ratio") {
        const [ba, bb] = simplify(order.a, order.b);
        const { html, isEquivalent } = renderTapeDiagram(ba, bb, counts.strawberry, counts.banana, order.a, order.b);
        
        const statusHTML = isEquivalent
          ? `<div style="color: #2ecc71; font-weight: 800; font-size: 13px; margin-top: 4px;">✔ Equivalent Ratio! Ready to blend.</div>`
          : `<div style="color: #e74c3c; font-weight: 800; font-size: 13px; margin-top: 4px;">❌ Mismatched Ratio. Check boxes!</div>`;
          
        visualizerEl.innerHTML = `
          <div class="visualizer-title">📊 RATIO TAPE DIAGRAM</div>
          ${html}
          ${statusHTML}
        `;
      } else {
        const html = renderDoubleNumberLine(order.total, order.count, rateGuess);
        const correct = (rateGuess === order.answer);
        const statusHTML = correct
          ? `<div style="color: #2ecc71; font-weight: 800; font-size: 13px; margin-top: 4px;">✔ Correct unit rate! Ready to serve.</div>`
          : `<div style="color: #e74c3c; font-weight: 800; font-size: 13px; margin-top: 4px;">❌ Slide to align price tag.</div>`;
          
        visualizerEl.innerHTML = `
          <div class="visualizer-title">📈 DOUBLE NUMBER LINE</div>
          ${html}
          ${statusHTML}
        `;
      }
      
      // 3) Render Controls Panel
      if (order.kind === "ratio") {
        controlsEl.innerHTML = `
          <button class="lab-btn lab-btn-strawberry" id="btn-add-straw">🍓 +1 Strawberry</button>
          <button class="lab-btn lab-btn-banana" id="btn-add-ban">🍌 +1 Banana</button>
          <button class="lab-btn lab-btn-undo" id="btn-undo-scoop">↩ Undo</button>
          <button class="lab-btn lab-btn-serve" id="btn-serve-smoothie">🥤 Blend & Serve</button>
        `;
        
        controlsEl.querySelector("#btn-add-straw").addEventListener("click", (e) => {
          e.stopPropagation();
          addScoop("strawberry");
          updateUI();
        });
        controlsEl.querySelector("#btn-add-ban").addEventListener("click", (e) => {
          e.stopPropagation();
          addScoop("banana");
          updateUI();
        });
        controlsEl.querySelector("#btn-undo-scoop").addEventListener("click", (e) => {
          e.stopPropagation();
          removeScoop();
          updateUI();
        });
        controlsEl.querySelector("#btn-serve-smoothie").addEventListener("click", (e) => {
          e.stopPropagation();
          serve();
          updateUI();
        });
      } else {
        controlsEl.innerHTML = `
          <button class="lab-btn lab-btn-rate-down" id="btn-price-down">➖ Price Down</button>
          <button class="lab-btn lab-btn-rate-up" id="btn-price-up">➕ Up</button>
          <button class="lab-btn lab-btn-serve" id="btn-serve-rate">🥤 Serve Order</button>
        `;
        
        controlsEl.querySelector("#btn-price-down").addEventListener("click", (e) => {
          e.stopPropagation();
          adjustRate(-1);
          updateUI();
        });
        controlsEl.querySelector("#btn-price-up").addEventListener("click", (e) => {
          e.stopPropagation();
          adjustRate(1);
          updateUI();
        });
        controlsEl.querySelector("#btn-serve-rate").addEventListener("click", (e) => {
          e.stopPropagation();
          serve();
          updateUI();
        });
      }
      
      // Disable controls if phase is not active
      const buttons = controlsEl.querySelectorAll(".lab-btn");
      buttons.forEach(btn => {
        if (!isActive) {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";
        } else {
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
        }
      });
    }

    function setTask() {
      if (!order) return;
      if (order.kind === "rate") {
        const text = `Order: ${order.prompt} Dial up/down to set the unit rate, then serve.`;
        hud.setObjective(text);
        if (clarity) clarity.setObjective(text);
      } else {
        const [ba, bb] = simplify(order.a, order.b);
        const text = `Recipe ratio: ${ba} Strawberry to ${bb} Banana. Add ingredients until you hit equivalent target amounts!`;
        hud.setObjective(text);
        if (clarity) clarity.setObjective(text);
      }
    }

    function clearCup() {
      activeFruits.forEach((f) => {
        group.remove(f.mesh);
        f.mesh.geometry.dispose();
        f.mesh.material.dispose();
      });
      activeFruits.length = 0;
      scoops.length = 0;
      counts = { strawberry: 0, banana: 0 };
      rateGuess = 0;
      
      liquid.scale.set(1, 0.001, 1);
      liquid.material.opacity = 0.0;
    }

    // ---- Fruit Dispensing (3D physics drop) ----
    function addScoop(fruit) {
      if (!running || gameOver || phase !== "active" || !order) return;
      if (order.kind !== "ratio") return;
      
      const scoopGeo = track(new THREE.SphereGeometry(0.35, 16, 16));
      const scoopMat = std(fruit === "strawberry" ? COLORS.strawberry : COLORS.banana, {
        roughness: 0.3,
        emissive: fruit === "strawberry" ? COLORS.strawberry : COLORS.banana,
        emissiveIntensity: 0.2,
      });
      const mesh = new THREE.Mesh(scoopGeo, scoopMat);
      mesh.castShadow = true;
      
      const startX = fruit === "strawberry" ? -1.8 : 1.8;
      const startY = 3.6;
      const startZ = 0.0;
      
      mesh.position.set(startX, startY, startZ);
      group.add(mesh);
      
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * jarRadius * 0.45;
      const targetX = Math.cos(angle) * dist;
      const targetZ = Math.sin(angle) * dist;
      const targetY = 0.65 + scoops.length * 0.16;
      
      activeFruits.push({
        mesh,
        vy: 0,
        vx: (targetX - startX) * 2.2,
        x: startX,
        y: startY,
        z: startZ,
        targetX,
        targetY,
        targetZ,
        bounces: 0,
        fruitType: fruit,
      });
      
      scoops.push({ mesh, fruit });
      counts[fruit] += 1;
      
      if (!reduced) {
        feel.burst(
          { x: startX, y: startY, z: startZ },
          { color: fruit === "strawberry" ? COLORS.strawberry : COLORS.banana, count: 6, spread: 0.8 },
        );
      }
      feel.sfx("pop");
      updateUI();
    }

    function removeScoop() {
      if (!running || gameOver || phase !== "active" || !order) return;
      if (order.kind !== "ratio" || !scoops.length) return;
      
      const [s] = scoops.splice(scoops.length - 1, 1);
      counts[s.fruit] -= 1;
      
      // Find matching activeFruit and delete it
      const idx = activeFruits.findIndex(f => f.mesh === s.mesh);
      if (idx !== -1) {
        const [f] = activeFruits.splice(idx, 1);
        group.remove(f.mesh);
        f.mesh.geometry.dispose();
        f.mesh.material.dispose();
      }
      
      // Recalculate target positions for remaining fruits
      activeFruits.forEach((sc, i) => {
        sc.targetY = 0.65 + i * 0.16;
        sc.done = false; // re-settle
      });
      
      feel.sfx("remove");
      updateUI();
    }

    function adjustRate(delta) {
      if (!running || gameOver || phase !== "active" || !order) return;
      if (order.kind !== "rate") return;
      rateGuess = Math.max(0, rateGuess + delta);
      feel.sfx("select");
      updateUI();
    }

    // ---- Correctness Check ----
    function ratioMatches() {
      if (counts.banana !== order.b) return false;
      if (counts.strawberry !== order.a) return false;
      return counts.strawberry * order.b === order.a * counts.banana;
    }
    function rateMatches() {
      return rateGuess === order.total / order.count;
    }
    function isCorrect() {
      return order.kind === "rate" ? rateMatches() : ratioMatches();
    }

    // ---- Serve Response (3D Blending juice transitions) ----
    function serve() {
      if (!running || gameOver || phase !== "active" || !order) return;
      
      phase = "resolving";
      updateUI();
      
      const correct = isCorrect();
      
      if (correct) {
        // Blend Color (Pink blend, or single fruit)
        let blendColor = 0xff8a80;
        if (counts.strawberry > 0 && counts.banana === 0) blendColor = COLORS.strawberry;
        else if (counts.banana > 0 && counts.strawberry === 0) blendColor = COLORS.banana;
        liquid.material.color.setHex(blendColor);
        
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.9,
          onUpdate: (v) => {
            liquid.scale.y = v;
            liquid.material.opacity = v * 0.78;
            liquid.rotation.y = v * Math.PI * 6;
            
            // Shrink fruit meshes
            activeFruits.forEach(f => {
              f.mesh.scale.setScalar(Math.max(0, 1 - v));
            });
          },
          onComplete: () => {
            onCorrect();
          }
        });
      } else {
        // Yucky brown smoothie blend for mistakes
        feel.tween({
          from: 0,
          to: 1,
          duration: 0.6,
          onUpdate: (v) => {
            liquid.scale.y = v;
            liquid.material.opacity = v * 0.8;
            liquid.material.color.setHex(0x795548);
            
            // Shake jar
            blenderGroup.position.x = Math.sin(v * Math.PI * 12) * 0.12;
            
            // Shrink fruit meshes
            activeFruits.forEach(f => {
              f.mesh.scale.setScalar(Math.max(0, 1 - v));
            });
          },
          onComplete: () => {
            blenderGroup.position.x = 0;
            onWrong();
          }
        });
      }
    }

    function onCorrect() {
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      const base = order.kind === "rate" ? 25 : 20;
      const pts = base + (level === 2 ? 10 : 0) + (streak > 1 ? 5 : 0);
      
      onScore(pts, {
        order: orderIndex + 1,
        kind: order.kind,
        misconceptionTag: order.tag || null,
        target: order.kind === "rate" ? order.answer : `${order.a}:${order.b}`,
      });

      feel.sfx("correct");
      if (!reduced) {
        feel.shake(0.18);
        feel.burst(
          { x: 0, y: 3.0, z: 0 },
          { color: COLORS.ok, count: 32, spread: 3.5 },
        );
      }
      
      if (typeof hud.feedback === "function")
        hud.feedback(true, `Great Job! Smoothie Blended! +${pts}`);
      announce(`Correct! Blend successful. +${pts} points.`);

      later(nextOrder, 800);
    }

    // Mistake loop - refill lives automatically to avoid frustration
    function onWrong() {
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      lives = Math.max(0, lives - 1);
      if (typeof hud.setLives === "function") hud.setLives(lives);

      onScore(-1, {
        order: orderIndex + 1,
        kind: order.kind,
        misconceptionTag: order.tag || null,
        target: order.kind === "rate" ? order.answer : `${order.a}:${order.b}`,
      });

      feel.sfx("wrong");
      if (!reduced) {
        feel.shake(0.25);
      }

      let hint;
      if (order.kind === "rate") {
        hint = `Try cost ÷ smoothies: $${order.total} ÷ ${order.count} smoothies.`;
      } else {
        hint = `Use scaled boxes! Recipe requires ${order.a} Strawberry and ${order.b} Banana.`;
      }
      
      if (typeof hud.feedback === "function")
        hud.feedback(false, `Oops! ${hint}`);
      announce(`Not a match. ${hint}`);
      caption(hint);

      if (lives <= 0) {
        lives = START_LIVES;
        if (typeof hud.setLives === "function") hud.setLives(lives);
        hud.message("Practice makes perfect! Hearts refilled ♥", { tone: "info", duration: 3000 });
      }
      
      // Clear and let them re-try in the same round
      clearCup();
      phase = "active";
      updateUI();
    }

    function startOrder(i) {
      order = cfg.orders[i];
      clearCup();
      if (typeof hud.setProgress === "function") hud.setProgress(i, total);

      phase = "arriving";
      setTask();
      
      if (clarity) {
        if (order.kind === "rate") clarity.setTarget(order.prompt);
        else {
          const [ba, bb] = simplify(order.a, order.b);
          clarity.setTarget(`Recipe: ${ba} Strawberry to ${bb} Banana`);
        }
      }
      
      // Animate client order ticket sliding down
      const ticket = uiContainer.querySelector("#order-ticket");
      if (ticket) {
        ticket.style.transform = "translateY(-40px)";
        ticket.style.opacity = "0.0";
        later(() => {
          ticket.style.transform = "translateY(0)";
          ticket.style.opacity = "1.0";
        }, 50);
      }
      
      // Settle phase to active quickly
      later(() => {
        phase = "active";
        updateUI();
      }, 500);
    }

    function nextOrder() {
      phase = "leaving";
      updateUI();
      if (orderIndex < total - 1) {
        orderIndex += 1;
        later(() => startOrder(orderIndex), 400);
      } else {
        later(winGame, 400);
      }
    }

    function winGame() {
      gameOver = true;
      running = false;
      phase = "idle";
      uiContainer.style.display = "none";
      
      hud.setObjective(`Recipe Lab completed! You served all ${total} orders. 🥤`);
      hud.message("🎉 Chef complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      
      if (!reduced) {
        [0, 220, 440].forEach((ms, i) =>
          later(
            () =>
              feel.burst(
                { x: (i - 1) * 3, y: 3.5, z: 0 },
                {
                  color: [COLORS.strawberry, COLORS.banana, COLORS.teal][i],
                  count: 45,
                  spread: 5,
                },
              ),
            ms,
          ),
        );
        feel.shake(0.25);
      }
      
      announce(`All complete! You blended all ${total} recipes successfully.`);
      if (clarity) {
        clarity.win({
          titleEn: "Shift complete!",
          badge: "🥤",
          stats: `You successfully blended all ${total} recipes. Best streak: ${bestStreak}.`,
        });
      }
    }

    function resetRun() {
      orderIndex = 0;
      lives = START_LIVES;
      streak = 0;
      bestStreak = 0;
      solvedCount = 0;
      gameOver = false;
      clearCup();
      
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      if (ctx.levelInfo && ctx.levelInfo.label)
        hud.setLevel(ctx.levelInfo.label);
        
      running = true;
      startOrder(0);
    }

    // ---- Keyboard Shortcuts & Frame Updates ----
    function handlePress(name) {
      if (!running || gameOver || phase !== "active") return;
      if (!order) return;
      
      if (order.kind === "rate") {
        if (name === "right" || name === "up") adjustRate(1);
        else if (name === "left" || name === "down") adjustRate(-1);
        else if (name === "action" || name === "confirm") serve();
      } else {
        if (name === "left" || name === "up") addScoop("strawberry");
        else if (name === "right" || name === "down") addScoop("banana");
        else if (name === "action") serve();
        else if (name === "confirm") removeScoop();
      }
      updateUI();
    }

    function frame(dt, t) {
      const d = Math.min(dt, 0.05);

      // Update active fruit physics drop
      for (let i = activeFruits.length - 1; i >= 0; i--) {
        const f = activeFruits[i];
        if (f.done) continue;
        
        f.vy -= 18.0 * d; // gravity
        f.x += f.vx * d;
        f.y += f.vy * d;
        f.z += (f.targetZ - f.z) * 5.0 * d;
        
        // Jar floor collision bounds
        if (f.y <= f.targetY) {
          f.y = f.targetY;
          if (f.bounces < 2) {
            f.vy = -f.vy * 0.35; // bounce
            f.vx = f.vx * 0.5;
            f.bounces++;
          } else {
            f.vy = 0;
            f.vx = 0;
            f.x = f.targetX;
            f.z = f.targetZ;
            f.done = true;
            feel.sfx("add");
          }
        }
        f.mesh.position.set(f.x, f.y, f.z);
      }

      // Gentle blending spin or idle bob
      if (!reduced && running && !gameOver) {
        if (phase === "active") {
          blenderGroup.rotation.y = Math.sin(t * 0.8) * 0.03;
        } else if (phase === "resolving") {
          blenderGroup.rotation.y += d * 5.0;
        }
      }
    }

    return {
      start() {
        const finalPos = new THREE.Vector3(0, 3.2, 7.5);
        camera.lookAt(0, 1.6, 0);
        
        if (reduced) {
          camera.position.copy(finalPos);
          feel.syncCamera();
        } else {
          const startPos = new THREE.Vector3(2.5, 4.5, 9.5);
          camera.position.copy(startPos);
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.0,
            onUpdate: (v) => {
              camera.position.lerpVectors(startPos, finalPos, v);
              camera.lookAt(0, 1.6, 0);
            },
            onComplete: () => feel.syncCamera(),
          });
        }

        function beginGameplay() {
          const intro = document.getElementById("e3d-intro");
          if (intro) intro.style.display = "none";
          
          resetRun();
          unbindPress = input.onPress(handlePress);
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Smoothie Recipe Lab",
          objectiveEn:
            "Create smoothies matching customer orders! Drop strawberries 🍓 and bananas 🍌 to balance equivalent ratios inside the tape diagram, or dial double number lines to solve unit rates.",
          objectiveEs:
            "¡Crea licuados que coincidan con las órdenes de los clientes! Agrega fresas 🍓 y plátanos 🍌 para equilibrar las razones equivalentes en el modelo de barras o resuelve la tasa unitaria.",
          standard: "6.AT.A.1–3 · Ratios & Unit Rates",
          controls: [
            {
              key: "🍓 Button / ←",
              actionEn: "Add 1 Strawberry to the blender.",
              actionEs: "Agrega 1 fresa a la licuadora.",
            },
            {
              key: "🍌 Button / →",
              actionEn: "Add 1 Banana to the blender.",
              actionEs: "Agrega 1 plátano a la licuadora.",
            },
            {
              key: "Undo Button / Enter",
              actionEn: "Remove the last scoop.",
              actionEs: "Quita la última bola.",
            },
            {
              key: "Serve Button / Space",
              actionEn: "Blend and serve when ready.",
              actionEs: "Licúa y sirve cuando estés listo.",
            },
          ],
          howToWinEn:
            "Mix ratios and answer unit rate tickets successfully. Each round updates dynamic tape diagrams. Complete all orders on your check list to win!",
          howToWinEs:
            "Mezcla razones y resuelve tickets de tasas unitarias. Cada ronda actualiza diagramas de barra. ¡Sirve todas las órdenes de la lista para ganar!",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        unbindFrame = ctx.onFrame(frame);
      },

      dispose() {
        running = false;
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        
        if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
        if (uiContainer && uiContainer.parentNode) uiContainer.parentNode.removeChild(uiContainer);
        
        clearCup();
        disposables.forEach((dd) => dd.dispose && dd.dispose());
        scene.remove(group);
      },
    };
  },
};
