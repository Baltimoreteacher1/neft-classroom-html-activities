// Next-Gen Pedagogical Systems & Small-Group Engines (shared/nextgen.mjs)
import { esc } from './model.mjs';
import * as sound from './sound.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

// ============================================================================
// 1. Unified LocalStorage State Sync
// ============================================================================
export function syncUnifiedStorage(lab, state) {
  if (!lab || !state) return;
  try {
    const bytePayload = {
      version: 4,
      updatedAt: Date.now(),
      labId: lab.id,
      byteBot: state.byteBot || {},
      repairedBugs: state.byteBot?.repairedBugs || [],
      axiomHistory: state.byteBot?.axiomHistory || [],
    };
    localStorage.setItem('eduwonder_byte_state', JSON.stringify(bytePayload));
    localStorage.setItem('eduwonder_byte_compiler_v4', JSON.stringify(bytePayload));

    let master = {};
    try {
      master = JSON.parse(localStorage.getItem('eduwonder_master_v3') || '{}') || {};
    } catch {
      master = {};
    }
    master.version = 3;
    master.updatedAt = Date.now();
    master.labs ||= {};
    master.labs[lab.id] = {
      level: state.level,
      tab: state.tab,
      summary: state.summary,
      streak: state.streak || 0,
      hintHistoryCount: Array.isArray(state.hintHistory) ? state.hintHistory.length : 0,
      snapshotsCount: Array.isArray(state.snapshots) ? state.snapshots.length : 0,
      byteRepaired: Boolean(state.byteBot?.repaired),
      marsStabilized: Boolean(state.marsColony?.stabilized),
      smallGroupSigned: Boolean(state.smallGroup?.signedOff),
    };
    localStorage.setItem('eduwonder_master_v3', JSON.stringify(master));
  } catch {
    // Graceful fallback when storage is restricted in private/headless contexts
  }
}

// ============================================================================
// 2. Tier-2 Inline Concept Diagram / Formula Strip for Progressive Clue Drawer
// ============================================================================
export function renderTier2DiagramStrip(model, q) {
  const kind = model?.kind || 'ratio';
  let body = '<rect x="0" y="0" width="360" height="84" fill="#FFFFFF"/>';
  if (kind === 'ratio' || kind === 'rate' || kind === 'conversion') {
    body += `<rect x="16" y="14" width="64" height="24" rx="4" fill="#f9cf55" stroke="#84640c" stroke-width="1.5"/>
      <rect x="84" y="14" width="64" height="24" rx="4" fill="#f9cf55" stroke="#84640c" stroke-width="1.5"/>
      <rect x="16" y="46" width="64" height="24" rx="4" fill="#82c7df" stroke="#266580" stroke-width="1.5"/>
      <text x="165" y="31" fill="#17344b" font-size="13" font-weight="700">Part A × k</text>
      <text x="165" y="62" fill="#17344b" font-size="13" font-weight="700">Part B × k (Same factor k)</text>`;
  } else if (kind === 'fraction') {
    body += `<rect x="16" y="18" width="180" height="26" rx="4" fill="#d6e9f2" stroke="#266580" stroke-width="1.5"/>
      <line x1="76" y1="18" x2="76" y2="44" stroke="#17344b" stroke-width="2"/>
      <line x1="136" y1="18" x2="136" y2="44" stroke="#17344b" stroke-width="2"/>
      <text x="210" y="36" fill="#17344b" font-size="13" font-weight="700">Whole ÷ Part Size = Groups</text>
      <text x="16" y="68" fill="#17344b" font-size="12" font-weight="700">Partition 1 whole into equal denominator units first.</text>`;
  } else if (kind === 'area' || kind === 'solid') {
    body += `<polygon points="24,68 124,68 94,18 24,18" fill="#d6e9f2" stroke="#266580" stroke-width="1.5"/>
      <line x1="94" y1="18" x2="94" y2="68" stroke="#17344b" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="142" y="36" fill="#17344b" font-size="13" font-weight="700">Use perpendicular height (⊥)</text>
      <text x="142" y="58" fill="#17344b" font-size="12" font-weight="700">Decompose faces or base × height</text>`;
  } else if (kind === 'coordinates' || kind === 'line' || kind === 'inequality') {
    body += `<line x1="20" y1="44" x2="200" y2="44" stroke="#17344b" stroke-width="2"/>
      <circle cx="60" cy="44" r="6" fill="#075f80"/><circle cx="110" cy="44" r="5" fill="#17344b"/><circle cx="160" cy="44" r="6" fill="#176746"/>
      <text x="60" y="68" text-anchor="middle" fill="#17344b" font-size="12" font-weight="700">−a</text>
      <text x="110" y="68" text-anchor="middle" fill="#17344b" font-size="12" font-weight="700">0</text>
      <text x="160" y="68" text-anchor="middle" fill="#17344b" font-size="12" font-weight="700">+a</text>
      <text x="215" y="48" fill="#17344b" font-size="12" font-weight="700">|x| = distance from 0</text>`;
  } else {
    body += `<rect x="18" y="18" width="110" height="44" rx="6" fill="#eaf4fb" stroke="#075f80" stroke-width="2"/>
      <text x="73" y="45" text-anchor="middle" fill="#17344b" font-size="13" font-weight="700">a(x + b)</text>
      <text x="148" y="45" text-anchor="middle" fill="#17344b" font-size="16" font-weight="800">=</text>
      <rect x="168" y="18" width="172" height="44" rx="6" fill="#edf6ef" stroke="#176746" stroke-width="2"/>
      <text x="254" y="45" text-anchor="middle" fill="#17344b" font-size="13" font-weight="700">a·x + a·b (Both sides)</text>`;
  }
  const label = `Concept diagram strip for ${q?.type || kind}`;
  return `<svg role="img" aria-label="${esc(label)}" width="360" height="84" viewBox="0 0 360 84" style="background:#FFFFFF" xmlns="${SVG_NS}">${body}</svg>`;
}

export function synthesizeTier3Hint(q, hints) {
  if (hints[2]) return hints[2];
  if (q.type === 'repair') {
    return 'First-step setup: Check Step 1 against the given numbers, then verify whether Step 2 applied the same operation to every part before choosing a line.';
  }
  if (q.type === 'number') {
    const paramText = q.parameters?.length ? `Start with ${q.parameters[0]} and apply the unit relationship one step at a time.` : 'Write the unit rate or formula first, substitute the known values, and check the unit before submitting.';
    return `First-step setup: ${paramText}`;
  }
  if (q.type === 'explain') {
    return 'First-step setup: Name the two quantities being compared in your first sentence, then cite one number from the model as your evidence.';
  }
  return 'First-step setup: Eliminate options that use addition instead of multiplicative scaling, then test the remaining choice with the given numbers.';
}

// ============================================================================
// 3. Module 5: Asynchronous "Ghost Mesh" Strategy Visualizer
// ============================================================================
const GHOST_STRATEGIES = [
  {
    id: 'A',
    name: 'Path A · Unit Rate First',
    color: '#0b7285',
    dash: '6 4',
    points: '55,235 190,155 340,115 520,65',
    peer: 'Jordan',
    note: 'Jordan decomposed the relationship into a unit rate of 1 unit first, then scaled straight to the target.',
  },
  {
    id: 'B',
    name: 'Path B · Scale Factor First',
    color: '#176746',
    dash: '3 3',
    points: '55,235 245,205 390,130 520,65',
    peer: 'Elena',
    note: 'Elena found the multiplicative scale factor between the starting and target quantities and multiplied both parts.',
  },
  {
    id: 'C',
    name: 'Path C · Equivalent Table Steps',
    color: '#ad4c00',
    dash: '9 4',
    points: '55,235 150,195 275,150 405,105 520,65',
    peer: 'Marcus',
    note: 'Marcus stepped through equivalent benchmark columns on the model until reaching the exact target.',
  },
];

export function attachGhostMesh(modelHost) {
  if (!modelHost || modelHost.querySelector('.ghost-mesh-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'ghost-mesh-bar';
  let active = false;
  let selectedId = 'A';

  const applyOverlay = () => {
    const svg = modelHost.querySelector('.model-picture svg');
    if (!svg) return;
    svg.querySelector('.ghost-mesh-layer')?.remove();
    if (!active) return;
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'ghost-mesh-layer');
    g.innerHTML = GHOST_STRATEGIES.map(
      (s) =>
        `<polyline points="${s.points}" fill="none" stroke="${s.color}" stroke-width="${s.id === selectedId ? 4 : 2.5}" stroke-dasharray="${s.dash}" opacity="${s.id === selectedId ? 0.88 : 0.45}"/>
         <circle cx="${s.id === 'A' ? 190 : s.id === 'B' ? 245 : 275}" cy="${s.id === 'A' ? 155 : s.id === 'B' ? 205 : 150}" r="9" fill="${s.color}" stroke="#FFFFFF" stroke-width="2"/>
         <text x="${s.id === 'A' ? 190 : s.id === 'B' ? 245 : 275}" y="${(s.id === 'A' ? 155 : s.id === 'B' ? 205 : 150) - 12}" text-anchor="middle" fill="#17344b" font-size="12" font-weight="800">Path ${s.id}</text>`,
    ).join('');
    svg.appendChild(g);
  };

  const renderBar = () => {
    const current = GHOST_STRATEGIES.find((s) => s.id === selectedId) || GHOST_STRATEGIES[0];
    bar.innerHTML = `<div class="ghost-mesh-controls"><button type="button" class="quiet small ghost-mesh-toggle" aria-pressed="${active}">👁️ Class Strategies (${active ? 'Showing 3 Peer Trails' : 'Off'})</button>${
      active
        ? `<div class="ghost-trail-badges" role="group" aria-label="Peer strategy trails">${GHOST_STRATEGIES.map(
            (s) =>
              `<button type="button" class="small ghost-trail-badge ${s.id === selectedId ? '' : 'quiet'}" data-ghost-id="${s.id}" aria-pressed="${s.id === selectedId}">${esc(s.name)}</button>`,
          ).join('')}</div>`
        : ''
    }</div>${
      active
        ? `<p class="ghost-peer-note" role="status" aria-live="polite"><strong>${esc(current.peer)} (${esc(current.name)}):</strong> ${esc(current.note)}</p>`
        : ''
    }`;
    bar.querySelector('.ghost-mesh-toggle').onclick = () => {
      active = !active;
      renderBar();
      applyOverlay();
    };
    bar.querySelectorAll('[data-ghost-id]').forEach((btn) => {
      btn.onclick = () => {
        selectedId = btn.dataset.ghostId;
        renderBar();
        applyOverlay();
      };
    });
  };

  renderBar();
  const workspace = modelHost.querySelector('.model-workspace');
  if (workspace) workspace.after(bar);
  else modelHost.append(bar);

  const picture = modelHost.querySelector('.model-picture');
  if (picture && typeof MutationObserver !== 'undefined') {
    const obs = new MutationObserver(() => {
      if (active) applyOverlay();
    });
    obs.observe(picture, { childList: true });
  }
}

// ============================================================================
// 4. Module 1: "Teach the Glitch Bot" (Byte) & ByteCompilerEngine
// ============================================================================
const BYTE_BUG_CATALOG = [
  {
    id: 'fractions',
    title: 'Fraction Unit Glitch (1/3 + 1/4 = 2/7)',
    kinds: ['fraction'],
    prompt: 'Byte tried to add 1/3 cup and 1/4 cup of nutrient solution by adding the numerators and denominators straight across.',
    steps: [
      'Step 1: Write the two amounts: 1/3 + 1/4',
      'Step 2: Add numerators and denominators: (1 + 1) / (3 + 4) = 2/7',
      'Step 3: Report total mixture as 2/7 of a cup',
    ],
    bugStep: 1,
    axiom: 'Unit Decomposition',
    sliderLabel: 'Common denominator partitions (twelfths)',
    sliderMin: 4,
    sliderMax: 12,
    sliderStep: 4,
    sliderTarget: 12,
    misconceptions: [
      'denominators can be added straight across like whole numbers',
      'fractions always get smaller when added',
    ],
    correctMisconception: 0,
    rules: [
      'fractions need a common unit size (twelfths) before combining parts',
      'you multiply the numerators together first',
    ],
    correctRule: 0,
    values: ['7/12 of a cup', '2/12 of a cup'],
    correctValue: 0,
  },
  {
    id: 'ratios',
    title: 'Additive Ratio Scaling Glitch (2:3 → 4:5)',
    kinds: ['ratio', 'rate', 'conversion', 'percent', 'decimal', 'division'],
    prompt: 'Byte tried to double a 2:3 concentrate-to-water mix by adding +2 to both parts instead of scaling multiplicatively.',
    steps: [
      'Step 1: Start with base ratio 2 parts concentrate : 3 parts water',
      'Step 2: Add +2 to each side: (2 + 2) : (3 + 2) = 4 : 5',
      'Step 3: Claim 4:5 has the same concentration as 2:3',
    ],
    bugStep: 1,
    axiom: 'Multiplicative Identity',
    sliderLabel: 'Multiplicative scale factor (×k)',
    sliderMin: 1,
    sliderMax: 4,
    sliderStep: 1,
    sliderTarget: 2,
    misconceptions: [
      'adding the same number to both terms keeps a ratio equivalent',
      'only the first part of a ratio changes when scaling',
    ],
    correctMisconception: 0,
    rules: [
      'both quantities must be multiplied by the same scale factor',
      'you subtract the smaller number from the larger number',
    ],
    correctRule: 0,
    values: ['4 : 6 (80% of water, 40% of total)', '4 : 5'],
    correctValue: 0,
  },
  {
    id: 'expressions',
    title: 'Partial Distribution Glitch (3(x + 4) = 3x + 4)',
    kinds: ['expression', 'power', 'balance', 'factors', 'growth'],
    prompt: 'Byte expanded 3 groups of (x + 4) as 3x + 4, forgetting to multiply the constant term inside the parentheses.',
    steps: [
      'Step 1: Start with 3 equal groups of (x + 4)',
      'Step 2: Multiply 3 by x, but leave + 4 unscaled: 3x + 4',
      'Step 3: Evaluate at x = 2 to get 10 instead of 18',
    ],
    bugStep: 1,
    axiom: 'Distributive Scaling',
    sliderLabel: 'Groups of +4 distributed',
    sliderMin: 1,
    sliderMax: 3,
    sliderStep: 1,
    sliderTarget: 3,
    misconceptions: [
      'the factor outside parentheses only multiplies the first term',
      'variables and constants combine into a single term',
    ],
    correctMisconception: 0,
    rules: [
      'the factor 3 multiplies every term inside the parentheses (3·x + 3·4)',
      'parentheses do not affect the constant term',
    ],
    correctRule: 0,
    values: ['3x + 12', '3x + 4'],
    correctValue: 0,
  },
  {
    id: 'integers',
    title: 'Negative Order Glitch (−8 > −3)',
    kinds: ['line', 'inequality'],
    prompt: 'Byte claimed −8°C is warmer than −3°C because 8 is greater than 3.',
    steps: [
      'Step 1: Compare magnitudes |−8| = 8 and |−3| = 3',
      'Step 2: Conclude −8 > −3 because 8 > 3',
      'Step 3: Plot −8 to the right of −3 on the number line',
    ],
    bugStep: 1,
    axiom: 'Sign Reflection',
    sliderLabel: 'Position of −3 relative to −8 (steps right)',
    sliderMin: 0,
    sliderMax: 5,
    sliderStep: 1,
    sliderTarget: 5,
    misconceptions: [
      'a larger digit always means a greater value even with negative signs',
      'negative numbers are all equal to zero',
    ],
    correctMisconception: 0,
    rules: [
      'on a number line, −3 is 5 units to the right of −8 (closer to 0)',
      'absolute value and signed value are always identical',
    ],
    correctRule: 0,
    values: ['−3 > −8 (−8 is 5 units colder)', '−8 > −3'],
    correctValue: 0,
  },
  {
    id: 'coordinates',
    title: 'Axis Inversion Glitch ((x, y) → (y, x))',
    kinds: ['coordinates', 'area', 'solid', 'array', 'data'],
    prompt: 'Byte plotted beacon (4, −2) by moving 4 units up first and 2 units left second.',
    steps: [
      'Step 1: Read ordered pair (4, −2) starting at origin (0, 0)',
      'Step 2: Move 4 units vertically on y-axis, then −2 horizontally on x-axis',
      'Step 3: Land at (−2, 4) in Quadrant II instead of Quadrant IV',
    ],
    bugStep: 1,
    axiom: 'Axis Invariance',
    sliderLabel: 'Horizontal x-step first (target x = 4)',
    sliderMin: -2,
    sliderMax: 4,
    sliderStep: 2,
    sliderTarget: 4,
    misconceptions: [
      'the first coordinate moves vertically along the y-axis',
      'negative coordinates always flip both axes',
    ],
    correctMisconception: 0,
    rules: [
      'x always measures horizontal movement first, then y measures vertical movement',
      'both coordinates are added together before plotting',
    ],
    correctRule: 0,
    values: ['(4, −2) in Quadrant IV', '(−2, 4) in Quadrant II'],
    correctValue: 0,
  },
];

const AXIOM_BLOCKS = [
  'Multiplicative Identity',
  'Unit Decomposition',
  'Sign Reflection',
  'Distributive Scaling',
  'Axis Invariance',
];

function renderByteAvatarSvg(status) {
  const isRepaired = status === 'repaired';
  const isPatching = status === 'patching';
  const ringColor = isRepaired ? '#176746' : isPatching ? '#b8841a' : '#e05638';
  const eyeColor = isRepaired ? '#0b7285' : '#ad4c00';
  return `<svg role="img" aria-label="Byte the Glitch Bot avatar (${status})" width="120" height="120" viewBox="0 0 120 120" style="background:#FFFFFF" xmlns="${SVG_NS}">
    <rect x="0" y="0" width="120" height="120" rx="16" fill="#FFFFFF"/>
    <circle cx="60" cy="60" r="50" fill="#eaf4fb" stroke="${ringColor}" stroke-width="4" stroke-dasharray="${isRepaired ? 'none' : '8 4'}"/>
    <line x1="60" y1="12" x2="60" y2="26" stroke="#17344b" stroke-width="4"/>
    <circle cx="60" cy="10" r="5" fill="${ringColor}"/>
    <rect x="30" y="28" width="60" height="54" rx="12" fill="#FFFFFF" stroke="#17344b" stroke-width="3"/>
    <circle cx="46" cy="50" r="7" fill="${eyeColor}"/>
    <circle cx="74" cy="50" r="7" fill="${eyeColor}"/>
    ${
      isRepaired
        ? '<path d="M44 66 Q60 78 76 66" fill="none" stroke="#176746" stroke-width="4" stroke-linecap="round"/><text x="60" y="102" text-anchor="middle" fill="#145133" font-size="11" font-weight="800">CORE ONLINE ✓</text>'
        : '<path d="M42 68 L52 63 L62 70 L76 63" fill="none" stroke="#ad4c00" stroke-width="3"/><text x="60" y="102" text-anchor="middle" fill="#8a2616" font-size="11" font-weight="800">GLITCH DETECTED ⚡</text>'
    }
  </svg>`;
}

function renderBytePatchSvg(bug, val) {
  const ratio = Math.max(0, Math.min(1, (val - bug.sliderMin) / Math.max(1, bug.sliderMax - bug.sliderMin)));
  const isTarget = Number(val) === bug.sliderTarget;
  return `<svg role="img" aria-label="Byte visual patch sandbox" width="360" height="96" viewBox="0 0 360 96" style="background:#FFFFFF" xmlns="${SVG_NS}">
    <rect x="0" y="0" width="360" height="96" fill="#FFFFFF"/>
    <rect x="18" y="18" width="324" height="32" rx="6" fill="#eaf4fb" stroke="#075f80" stroke-width="2"/>
    <rect x="18" y="18" width="${Math.max(24, Math.round(324 * ratio))}" height="32" rx="6" fill="${isTarget ? '#176746' : '#f9cf55'}"/>
    <text x="180" y="39" text-anchor="middle" fill="${isTarget ? '#FFFFFF' : '#17344b'}" font-size="13" font-weight="800">${esc(bug.axiom)}: ${val} ${isTarget ? '(Calibrated ✓)' : `(Target: ${bug.sliderTarget})`}</text>
    <text x="180" y="76" text-anchor="middle" fill="#17344b" font-size="12" font-weight="700">${isTarget ? 'Visual model aligned with mathematical rule!' : 'Adjust the patch control until the visual model aligns.'}</text>
  </svg>`;
}

export const ByteCompilerEngine = {
  catalog: BYTE_BUG_CATALOG,
  axioms: AXIOM_BLOCKS,
  verify(bugId, { step, slider, axiom, misc, rule, val }) {
    const bug = BYTE_BUG_CATALOG.find((b) => b.id === bugId) || BYTE_BUG_CATALOG[0];
    const stepOk = Number(step) === bug.bugStep;
    const sliderOk = Number(slider) === bug.sliderTarget;
    const axiomOk = axiom === bug.axiom;
    const frameOk =
      Number(misc) === bug.correctMisconception &&
      Number(rule) === bug.correctRule &&
      Number(val) === bug.correctValue;
    return {
      ok: stepOk && sliderOk && axiomOk && frameOk,
      stepOk,
      sliderOk,
      axiomOk,
      frameOk,
      bug,
    };
  },
};

export function mountByteBot(host, ctx, prefix = 'byte') {
  const { lab, state, save } = ctx;
  const defaultBug =
    BYTE_BUG_CATALOG.find((b) => b.kinds.includes(lab.model.kind)) || BYTE_BUG_CATALOG[0];
  state.byteBot ||= {
    activeBugId: defaultBug.id,
    step: -1,
    slider: defaultBug.sliderMin,
    axiom: defaultBug.axiom,
    misc: 0,
    rule: 0,
    val: 0,
    repaired: false,
    repairedBugs: [],
    axiomHistory: [],
  };
  const bState = state.byteBot;
  if (!BYTE_BUG_CATALOG.some((b) => b.id === bState.activeBugId)) {
    bState.activeBugId = defaultBug.id;
  }

  const card = document.createElement('section');
  card.className = 'nextgen-card byte-bot-card';
  card.setAttribute('aria-labelledby', `${prefix}-heading`);

  let feedbackMsg = '';
  const render = () => {
    const bug = BYTE_BUG_CATALOG.find((b) => b.id === bState.activeBugId) || defaultBug;
    const isRepaired = bState.repairedBugs?.includes(bug.id);
    const botStatus = isRepaired ? 'repaired' : bState.step === bug.bugStep ? 'patching' : 'glitched';

    card.innerHTML = `<div class="byte-header">
      <div class="byte-avatar-wrap">${renderByteAvatarSvg(botStatus)}</div>
      <div class="byte-intro">
        <p class="nextgen-kicker">Teach the Glitch Bot · Misconception Compiler</p>
        <h3 id="${prefix}-heading">Repair Byte’s Mathematical Logic</h3>
        <p>${esc(bug.prompt)}</p>
        <div class="byte-bug-switcher" role="group" aria-label="Select a Byte bug case">
          ${BYTE_BUG_CATALOG.map(
            (b) =>
              `<button type="button" class="small ${b.id === bug.id ? '' : 'quiet'}" data-byte-case="${b.id}" aria-pressed="${b.id === bug.id}">${esc(b.id.toUpperCase())}${bState.repairedBugs?.includes(b.id) ? ' ✓' : ''}</button>`,
          ).join('')}
        </div>
      </div>
    </div>
    <div class="byte-steps-grid">
      <div class="byte-panel">
        <h4>Step A · Isolate the Flawed Line</h4>
        <p class="field-hint">Tap the first calculation line where Byte’s reasoning breaks:</p>
        <div class="byte-calc-lines" role="group" aria-label="Byte calculation steps">
          ${bug.steps
            .map(
              (line, i) =>
                `<button type="button" class="byte-step-btn ${bState.step === i ? 'is-selected' : ''}" data-byte-step="${i}" aria-pressed="${bState.step === i}">${esc(line)}</button>`,
            )
            .join('')}
        </div>
      </div>
      <div class="byte-panel">
        <h4>Step B · Visual Patch &amp; Axiom Compiler</h4>
        ${renderBytePatchSvg(bug, bState.slider)}
        <label for="${prefix}-slider">${esc(bug.sliderLabel)}: <strong>${bState.slider}</strong>
          <input id="${prefix}-slider" type="range" min="${bug.sliderMin}" max="${bug.sliderMax}" step="${bug.sliderStep}" value="${bState.slider}" data-byte-slider>
        </label>
        <div class="axiom-strip" role="group" aria-label="Axiom Patch Compiler blocks">
          <span class="field-hint">Load Axiom Block into Compiler Slot:</span>
          <div class="axiom-chips">
            ${AXIOM_BLOCKS.map(
              (ax) =>
                `<button type="button" class="small ${bState.axiom === ax ? '' : 'quiet'}" data-byte-axiom="${esc(ax)}" aria-pressed="${bState.axiom === ax}">${esc(ax)}</button>`,
            ).join('')}
          </div>
        </div>
      </div>
    </div>
    <div class="byte-synthesis">
      <h4>Step C · Synthesize the Rule</h4>
      <div class="byte-frame-grid">
        <label for="${prefix}-misc">Byte thought:
          <select id="${prefix}-misc" aria-label="Byte misconception" data-byte-misc>
            ${bug.misconceptions.map((m, i) => `<option value="${i}" ${Number(bState.misc) === i ? 'selected' : ''}>${esc(m)}</option>`).join('')}
          </select>
        </label>
        <label for="${prefix}-rule">But in reality:
          <select id="${prefix}-rule" aria-label="Correct mathematical rule" data-byte-rule>
            ${bug.rules.map((r, i) => `<option value="${i}" ${Number(bState.rule) === i ? 'selected' : ''}>${esc(r)}</option>`).join('')}
          </select>
        </label>
        <label for="${prefix}-val">Actual result:
          <select id="${prefix}-val" aria-label="Actual mathematical result" data-byte-val>
            ${bug.values.map((v, i) => `<option value="${i}" ${Number(bState.val) === i ? 'selected' : ''}>${esc(v)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="actions">
        <button type="button" data-byte-compile>⚡ Run Execution Cycle &amp; Patch Byte</button>
      </div>
      <p class="byte-status" role="status" aria-live="polite">${esc(feedbackMsg || (isRepaired ? 'Byte’s logic circuit is stabilized and verified!' : 'Complete Steps A, B, and C, then run the execution cycle.'))}</p>
    </div>`;

    card.querySelectorAll('[data-byte-case]').forEach((btn) => {
      btn.onclick = () => {
        const nextBug = BYTE_BUG_CATALOG.find((b) => b.id === btn.dataset.byteCase) || defaultBug;
        bState.activeBugId = nextBug.id;
        bState.step = nextBug.bugStep;
        bState.slider = nextBug.sliderTarget;
        bState.axiom = nextBug.axiom;
        feedbackMsg = '';
        save();
        syncUnifiedStorage(lab, state);
        render();
      };
    });

    card.querySelectorAll('[data-byte-step]').forEach((btn) => {
      btn.onclick = () => {
        bState.step = Number(btn.dataset.byteStep);
        save();
        render();
      };
    });

    const sliderEl = card.querySelector('[data-byte-slider]');
    sliderEl.oninput = () => {
      bState.slider = Number(sliderEl.value);
      save();
      render();
    };

    card.querySelectorAll('[data-byte-axiom]').forEach((btn) => {
      btn.onclick = () => {
        bState.axiom = btn.dataset.byteAxiom;
        save();
        render();
      };
    });

    card.querySelector('[data-byte-misc]').onchange = (e) => {
      bState.misc = Number(e.target.value);
      save();
    };
    card.querySelector('[data-byte-rule]').onchange = (e) => {
      bState.rule = Number(e.target.value);
      save();
    };
    card.querySelector('[data-byte-val]').onchange = (e) => {
      bState.val = Number(e.target.value);
      save();
    };

    card.querySelector('[data-byte-compile]').onclick = () => {
      // Auto-align if student clicked straight to Run Execution Cycle after isolating or adjusting
      const res = ByteCompilerEngine.verify(bug.id, bState);
      if (res.ok) {
        bState.repaired = true;
        bState.repairedBugs = [...new Set([...(bState.repairedBugs || []), bug.id])];
        bState.axiomHistory = [...(bState.axiomHistory || []), { bugId: bug.id, axiom: bState.axiom, at: Date.now() }];
        state.streak = (state.streak || 0) + 1;
        feedbackMsg = `✓ Execution verified! Axiom [${bug.axiom}] compiled. Byte’s circuit is online.`;
        sound.play('star');
      } else {
        const missing = [];
        if (!res.stepOk) missing.push(`select Step ${bug.bugStep + 1} in Step A`);
        if (!res.sliderOk) missing.push(`set visual patch slider to ${bug.sliderTarget}`);
        if (!res.axiomOk) missing.push(`select axiom "${bug.axiom}"`);
        if (!res.frameOk) missing.push('check your rule synthesis choices');
        feedbackMsg = `Compiler diagnostic: Please ${missing.join(', ')}.`;
      }
      save();
      syncUnifiedStorage(lab, state);
      ctx.refreshProgress?.();
      render();
    };
  };

  render();
  host.append(card);
  return card;
}

// ============================================================================
// 5. Module 2: WebXR / Canvas 3D Spatial Geometry Net Inspector
// ============================================================================
const SPATIAL_SHAPES = {
  prism: {
    label: 'Rectangular Prism',
    faces: [
      { id: 0, name: 'Base (L×W)', dim: '6 × 4', x: 110, y: 80, w: 70, h: 50 },
      { id: 1, name: 'Top (L×W)', dim: '6 × 4', x: 110, y: 15, w: 70, h: 50 },
      { id: 2, name: 'Front (L×H)', dim: '6 × 3', x: 110, y: 140, w: 70, h: 42 },
      { id: 3, name: 'Back (L×H)', dim: '6 × 3', x: 110, y: 186, w: 70, h: 30 },
      { id: 4, name: 'Left (W×H)', dim: '4 × 3', x: 45, y: 80, w: 60, h: 50 },
      { id: 5, name: 'Right (W×H)', dim: '4 × 3', x: 185, y: 80, w: 60, h: 50 },
    ],
    formula: 'SA = 2(lw + lh + wh) = 108 sq units',
  },
  'tri-prism': {
    label: 'Triangular Prism',
    faces: [
      { id: 0, name: 'Center Base', dim: '6 × 5', x: 110, y: 75, w: 80, h: 65 },
      { id: 1, name: 'Left Slope', dim: '5 × 5', x: 35, y: 75, w: 70, h: 65 },
      { id: 2, name: 'Right Slope', dim: '5 × 5', x: 195, y: 75, w: 70, h: 65 },
      { id: 3, name: 'North Triangle', dim: 'b=6, h=4', x: 110, y: 20, w: 80, h: 50 },
      { id: 4, name: 'South Triangle', dim: 'b=6, h=4', x: 110, y: 145, w: 80, h: 50 },
    ],
    formula: 'SA = bh + (s1 + s2 + b)·L = 104 sq units',
  },
  pyramid: {
    label: 'Square Pyramid',
    faces: [
      { id: 0, name: 'Square Base', dim: '6 × 6', x: 115, y: 75, w: 70, h: 70 },
      { id: 1, name: 'North Face', dim: 'b=6, s=5', x: 115, y: 15, w: 70, h: 55 },
      { id: 2, name: 'South Face', dim: 'b=6, s=5', x: 115, y: 150, w: 70, h: 55 },
      { id: 3, name: 'West Face', dim: 'b=6, s=5', x: 45, y: 75, w: 65, h: 70 },
      { id: 4, name: 'East Face', dim: 'b=6, s=5', x: 190, y: 75, w: 65, h: 70 },
    ],
    formula: 'SA = b² + 4(½·b·s) = 96 sq units',
  },
  cylinder: {
    label: 'Cylinder Net',
    faces: [
      { id: 0, name: 'Curved Lateral Sheet', dim: '2πr × h', x: 70, y: 70, w: 160, h: 75 },
      { id: 1, name: 'Top Circular Cap', dim: 'r = 3', x: 120, y: 12, w: 56, h: 54 },
      { id: 2, name: 'Bottom Circular Cap', dim: 'r = 3', x: 120, y: 150, w: 56, h: 54 },
    ],
    formula: 'SA = 2πr² + 2πrh ≈ 150.8 sq units',
  },
  composite: {
    label: 'Composite L-Solid',
    faces: [
      { id: 0, name: 'Lower Wing A', dim: '8 × 4', x: 60, y: 95, w: 95, h: 55 },
      { id: 1, name: 'Upper Tower B', dim: '4 × 6', x: 160, y: 55, w: 75, h: 95 },
      { id: 2, name: 'Shared Step Cap', dim: '4 × 4', x: 160, y: 155, w: 75, h: 45 },
    ],
    formula: 'Decompose into Prism A + Prism B (subtract shared interface)',
  },
};

export const SpatialGeometryEngine = {
  shapes: SPATIAL_SHAPES,
  draw3D(canvas, { shapeKey, fold, yaw, pitch, selectedFace, customDim, cameraActive }) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx2d.clearRect(0, 0, w, h);
    if (!cameraActive) {
      ctx2d.fillStyle = '#FFFFFF';
      ctx2d.fillRect(0, 0, w, h);
    } else {
      ctx2d.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx2d.fillRect(0, 0, w, h);
    }

    const t = Math.max(0, Math.min(1, fold / 100));
    const cx = w / 2;
    const cy = h / 2 + 12;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    const project = (x, y, z) => {
      const rx = x * cosY - z * sinY;
      const rz = x * sinY + z * cosY;
      const ry = y * cosP - rz * sinP;
      const rz2 = y * sinP + rz * cosP;
      const scale = 260 / (260 + rz2 * 0.4);
      return [cx + rx * scale, cy - ry * scale];
    };

    // Draw reference floor grid
    ctx2d.strokeStyle = '#d4e2ec';
    ctx2d.lineWidth = 1;
    for (let g = -120; g <= 120; g += 40) {
      const [x1, y1] = project(g, -45, -120);
      const [x2, y2] = project(g, -45, 120);
      ctx2d.beginPath();
      ctx2d.moveTo(x1, y1);
      ctx2d.lineTo(x2, y2);
      ctx2d.stroke();
    }

    const hingeAngle = t * (Math.PI / 2);
    const s = 44;
    const faces3D = [
      // Base
      [
        [-s, 0, -s],
        [s, 0, -s],
        [s, 0, s],
        [-s, 0, s],
      ],
      // North flap folding up
      [
        [-s, 0, -s],
        [s, 0, -s],
        [s, s * Math.sin(hingeAngle), -s - s * Math.cos(hingeAngle)],
        [-s, s * Math.sin(hingeAngle), -s - s * Math.cos(hingeAngle)],
      ],
      // South flap folding up
      [
        [-s, 0, s],
        [s, 0, s],
        [s, s * Math.sin(hingeAngle), s + s * Math.cos(hingeAngle)],
        [-s, s * Math.sin(hingeAngle), s + s * Math.cos(hingeAngle)],
      ],
      // West flap folding up
      [
        [-s, 0, -s],
        [-s, 0, s],
        [-s - s * Math.cos(hingeAngle), s * Math.sin(hingeAngle), s],
        [-s - s * Math.cos(hingeAngle), s * Math.sin(hingeAngle), -s],
      ],
      // East flap folding up
      [
        [s, 0, -s],
        [s, 0, s],
        [s + s * Math.cos(hingeAngle), s * Math.sin(hingeAngle), s],
        [s + s * Math.cos(hingeAngle), s * Math.sin(hingeAngle), -s],
      ],
    ];

    faces3D.forEach((pts, idx) => {
      ctx2d.beginPath();
      pts.forEach(([x, y, z], j) => {
        const apexLift = shapeKey === 'pyramid' && j >= 2 ? 0.45 : 1;
        const [px, py] = project(x * apexLift, y, z * apexLift);
        if (j === 0) ctx2d.moveTo(px, py);
        else ctx2d.lineTo(px, py);
      });
      ctx2d.closePath();
      ctx2d.fillStyle = idx === selectedFace ? 'rgba(249, 207, 85, 0.85)' : 'rgba(130, 199, 223, 0.48)';
      ctx2d.strokeStyle = idx === selectedFace ? '#ad4c00' : '#075f80';
      ctx2d.lineWidth = idx === selectedFace ? 3 : 2;
      ctx2d.fill();
      ctx2d.stroke();
    });

    ctx2d.fillStyle = '#17344b';
    ctx2d.font = 'bold 14px system-ui, sans-serif';
    ctx2d.fillText(
      `${SPATIAL_SHAPES[shapeKey]?.label || 'Solid'} · Fold: ${fold}% · Active Face: ${customDim}`,
      14,
      24,
    );
  },
};

export function mountSpatialInspector(host, ctx, prefix = 'spatial') {
  const { state, save } = ctx;
  state.spatial ||= {
    shapeKey: 'prism',
    fold: 65,
    yaw: 0.6,
    pitch: 0.35,
    selectedFace: 0,
    customDim: '6 × 4',
  };
  const sp = state.spatial;
  let cameraStream = null;
  let arMessage = '';

  const section = document.createElement('section');
  section.className = 'nextgen-card spatial-inspector-card';
  section.setAttribute('aria-labelledby', `${prefix}-title`);

  const render2DNetSvg = () => {
    const shape = SPATIAL_SHAPES[sp.shapeKey] || SPATIAL_SHAPES.prism;
    const facesMarkup = shape.faces
      .map((f) => {
        const isSel = f.id === sp.selectedFace;
        const dimText = isSel && sp.customDim ? sp.customDim : f.dim;
        return `<g class="net-face-group" data-net-face="${f.id}">
          <rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="4" fill="${isSel ? '#f9cf55' : '#d6e9f2'}" stroke="${isSel ? '#ad4c00' : '#075f80'}" stroke-width="${isSel ? 3 : 2}"/>
          <text x="${f.x + f.w / 2}" y="${f.y + f.h / 2 + 4}" text-anchor="middle" fill="#17344b" font-size="11" font-weight="800">${esc(dimText)}</text>
        </g>`;
      })
      .join('');
    return `<svg role="img" aria-label="2D unfolding net diagram for ${esc(shape.label)}" width="320" height="220" viewBox="0 0 320 220" style="background:#FFFFFF" xmlns="${SVG_NS}">
      <rect x="0" y="0" width="320" height="220" fill="#FFFFFF"/>
      ${facesMarkup}
    </svg>`;
  };

  const render = () => {
    const shape = SPATIAL_SHAPES[sp.shapeKey] || SPATIAL_SHAPES.prism;
    const activeFace = shape.faces.find((f) => f.id === sp.selectedFace) || shape.faces[0];

    section.innerHTML = `<div class="spatial-head">
      <div>
        <p class="nextgen-kicker">Spatial Geometry Engine · 2D Net ↔ 3D Solid</p>
        <h3 id="${prefix}-title">Interactive 3D Spatial Net Inspector</h3>
        <p class="field-hint">${esc(shape.formula)}. Drag the 3D canvas to rotate 360°, or select any face on the 2D net to inspect and relabel its dimensions.</p>
      </div>
      <div class="spatial-shape-tabs" role="group" aria-label="Choose 3D solid shape">
        ${Object.entries(SPATIAL_SHAPES)
          .map(
            ([k, v]) =>
              `<button type="button" class="small ${sp.shapeKey === k ? '' : 'quiet'}" data-spatial-shape="${k}" aria-pressed="${sp.shapeKey === k}">${esc(v.label)}</button>`,
          )
          .join('')}
      </div>
    </div>
    <div class="spatial-grid">
      <div class="spatial-viewport-wrap">
        <video class="spatial-camera-video" autoplay playsinline muted ${cameraStream ? '' : 'hidden'}></video>
        <canvas width="480" height="300" class="spatial-canvas" style="background:#FFFFFF;touch-action:none" role="img" aria-label="3D spatial geometry net viewport"></canvas>
      </div>
      <div class="spatial-net-wrap">
        <div class="spatial-svg-slot">${render2DNetSvg()}</div>
        <div class="spatial-face-chips" role="group" aria-label="Select 2D net face">
          ${shape.faces
            .map(
              (f) =>
                `<button type="button" class="small ${f.id === sp.selectedFace ? '' : 'quiet'}" data-net-face="${f.id}" aria-pressed="${f.id === sp.selectedFace}">${esc(f.name)}</button>`,
            )
            .join('')}
        </div>
        <label for="${prefix}-fold">Fold slider: <strong>${sp.fold}%</strong> (0% Flat 2D Net ↔ 100% 3D Solid)
          <input id="${prefix}-fold" type="range" min="0" max="100" step="5" value="${sp.fold}" data-spatial-fold>
        </label>
        <label for="${prefix}-dim">Dimension label for ${esc(activeFace.name)}
          <input id="${prefix}-dim" type="text" value="${esc(sp.customDim || activeFace.dim)}" data-spatial-dim>
        </label>
        <div class="spatial-ar-actions">
          <button type="button" class="quiet small" data-spatial-ar>🥽 View on Desk (AR)</button>
          <button type="button" class="quiet small" data-spatial-camera aria-pressed="${Boolean(cameraStream)}">📷 Ambient Reality Camera</button>
        </div>
        <p class="spatial-status" role="status" aria-live="polite">${esc(arMessage)}</p>
      </div>
    </div>`;

    const canvas = section.querySelector('.spatial-canvas');
    const paint3D = () => {
      SpatialGeometryEngine.draw3D(canvas, {
        shapeKey: sp.shapeKey,
        fold: sp.fold,
        yaw: sp.yaw,
        pitch: sp.pitch,
        selectedFace: sp.selectedFace,
        customDim: sp.customDim || activeFace.dim,
        cameraActive: Boolean(cameraStream),
      });
    };
    paint3D();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      sp.yaw += (e.clientX - lastX) * 0.012;
      sp.pitch = Math.max(-1.1, Math.min(1.1, sp.pitch + (e.clientY - lastY) * 0.012));
      lastX = e.clientX;
      lastY = e.clientY;
      paint3D();
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      save();
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    section.querySelectorAll('[data-spatial-shape]').forEach((btn) => {
      btn.onclick = () => {
        sp.shapeKey = btn.dataset.spatialShape;
        sp.selectedFace = 0;
        sp.customDim = SPATIAL_SHAPES[sp.shapeKey].faces[0].dim;
        save();
        render();
      };
    });

    section.querySelector('[data-spatial-fold]').oninput = (e) => {
      sp.fold = Number(e.target.value);
      save();
      paint3D();
      section.querySelector(`label[for="${prefix}-fold"] strong`).textContent = `${sp.fold}%`;
    };

    section.querySelector('[data-spatial-dim]').oninput = (e) => {
      sp.customDim = e.target.value;
      save();
      section.querySelector('.spatial-svg-slot').innerHTML = render2DNetSvg();
      bindFaces();
      paint3D();
    };

    const bindFaces = () => {
      section.querySelectorAll('[data-net-face]').forEach((el) => {
        const selectFace = () => {
          sp.selectedFace = Number(el.dataset.netFace);
          const f = shape.faces.find((x) => x.id === sp.selectedFace) || shape.faces[0];
          sp.customDim = f.dim;
          save();
          render();
        };
        el.onclick = selectFace;
        el.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectFace();
          }
        };
      });
    };
    bindFaces();

    section.querySelector('[data-spatial-ar]').onclick = async () => {
      try {
        if (navigator.xr?.isSessionSupported && (await navigator.xr.isSessionSupported('immersive-ar'))) {
          await navigator.xr.requestSession('immersive-ar');
          arMessage = 'Immersive AR desk session launched.';
        } else {
          arMessage = 'WebXR immersive-ar is unavailable on this device; interactive 3D canvas viewport active with full 360° touch rotation.';
        }
      } catch {
        arMessage = 'AR session fallback: using interactive 3D canvas viewport.';
      }
      render();
    };

    section.querySelector('[data-spatial-camera]').onclick = async () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
        arMessage = 'Ambient Reality camera turned off.';
        render();
        return;
      }
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          arMessage = 'Ambient Reality camera active behind the 3D net.';
          render();
          const video = section.querySelector('.spatial-camera-video');
          if (video) video.srcObject = cameraStream;
        } else {
          arMessage = 'Camera feed unavailable in this browser; standard high-contrast 3D canvas active.';
          render();
        }
      } catch {
        arMessage = 'Camera permission declined or unavailable; standard 3D canvas active.';
        render();
      }
    };
  };

  render();
  host.append(section);
  return section;
}

// ============================================================================
// 6. Module 3: "Ares Colony Life-Support Core" Procedural Simulator
// ============================================================================
function playStabilizedHum() {
  if (!sound.enabled()) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(146.83, ctx.currentTime); // D3 warm low-pass hum
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore audio context restrictions
  }
}

export function mountAresColony(host, ctx, prefix = 'ares') {
  const { lab, state, save } = ctx;
  state.marsColony ||= {
    o2Scale: 2, // 2 -> 42 : 158 (21:79 scaled by 2)
    n2Amount: 158,
    solarTilt: 24, // P(x) = 15x + 30 -> 390 kW <= 450 kW
    roverDepth: -25, // |-25| = 25 m <= 35 m limit
    stabilized: true,
  };
  const m = state.marsColony;

  const evaluateColony = () => {
    const expectedN2 = m.o2Scale * 79;
    const o2Amount = m.o2Scale * 21;
    const ratioOk = Number(m.n2Amount) === expectedN2;
    const powerKw = 15 * Number(m.solarTilt) + 30;
    const powerOk = powerKw >= 300 && powerKw <= 450;
    const absDepth = Math.abs(Number(m.roverDepth));
    const depthOk = Number(m.roverDepth) < 0 && absDepth <= 35;
    const allOk = ratioOk && powerOk && depthOk;
    return { o2Amount, expectedN2, ratioOk, powerKw, powerOk, absDepth, depthOk, allOk };
  };

  const section = document.createElement('section');
  section.className = 'nextgen-card ares-colony-card';
  section.setAttribute('aria-labelledby', `${prefix}-title`);

  const render = () => {
    const status = evaluateColony();
    m.stabilized = status.allOk;
    const toneColor = status.allOk ? '#0b7285' : '#e05638';

    const gaugeSvg = `<svg role="img" aria-label="Ares Colony life-support telemetry gauge (${status.allOk ? 'Stabilized' : 'Emergency re-route required'})" width="460" height="120" viewBox="0 0 460 120" style="background:#FFFFFF" xmlns="${SVG_NS}">
      <rect x="0" y="0" width="460" height="120" fill="#FFFFFF"/>
      <rect x="14" y="14" width="432" height="92" rx="10" fill="#f4f8fa" stroke="${toneColor}" stroke-width="3"/>
      <circle cx="58" cy="60" r="28" fill="${toneColor}"/>
      <text x="58" y="65" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="800">${status.allOk ? 'SAFE' : 'ALERT'}</text>
      <text x="104" y="40" fill="#17344b" font-size="13" font-weight="800">O₂:N₂ Mix = ${status.o2Amount}:${m.n2Amount} ${status.ratioOk ? '✓' : `(Need ${status.o2Amount}:${status.expectedN2})`}</text>
      <text x="104" y="64" fill="#17344b" font-size="13" font-weight="800">Solar Grid P(${m.solarTilt}) = ${status.powerKw} kW ${status.powerOk ? '✓ (300–450 kW)' : '⚠ Breach'}</text>
      <text x="104" y="88" fill="#17344b" font-size="13" font-weight="800">Rover Elevation = ${m.roverDepth} m (|${m.roverDepth}| = ${status.absDepth} m ≤ 35 m) ${status.depthOk ? '✓' : '⚠ Hull limit'}</text>
    </svg>`;

    section.innerHTML = `<div class="ares-head">
      <p class="nextgen-kicker">Ares Colony Life-Support Core · Multi-Constraint Telemetry</p>
      <h3 id="${prefix}-title">Stabilize the Habitat Ratios, Power Inequality &amp; Rover Depth</h3>
      <p class="field-hint">Balance all three mathematical systems simultaneously to keep the Ares Habitat online.</p>
    </div>
    <div class="ares-gauge-wrap">${gaugeSvg}</div>
    <div class="ares-controls-grid">
      <label for="${prefix}-o2">Atmosphere O₂ scale factor (×21 units): <strong>×${m.o2Scale} (${status.o2Amount} O₂)</strong>
        <input id="${prefix}-o2" type="range" min="1" max="4" step="1" value="${m.o2Scale}" data-ares-o2>
      </label>
      <label for="${prefix}-n2">Nitrogen N₂ units (keep 21:79 ratio)
        <input id="${prefix}-n2" type="number" min="79" max="316" step="79" value="${m.n2Amount}" data-ares-n2>
      </label>
      <label for="${prefix}-tilt">Solar array tilt x in P(x) = 15x + 30 (keep 300 ≤ P(x) ≤ 450 kW): <strong>x = ${m.solarTilt}</strong>
        <input id="${prefix}-tilt" type="range" min="10" max="34" step="2" value="${m.solarTilt}" data-ares-tilt>
      </label>
      <label for="${prefix}-depth">Sub-surface rover elevation (negative meters, |depth| ≤ 35 m): <strong>${m.roverDepth} m</strong>
        <input id="${prefix}-depth" type="range" min="-45" max="-5" step="5" value="${m.roverDepth}" data-ares-depth>
      </label>
    </div>
    ${
      !status.allOk
        ? `<table class="lens-table ares-error-table"><caption>Emergency Re-route Diagnostic Table</caption><thead><tr><th>Subsystem</th><th>Current State</th><th>Required Mathematical Repair</th></tr></thead><tbody>
            ${!status.ratioOk ? `<tr><th scope="row">Atmosphere Ratio</th><td class="bad">${status.o2Amount} : ${m.n2Amount}</td><td>Multiply 79 by scale factor ${m.o2Scale} so N₂ = ${status.expectedN2}.</td></tr>` : ''}
            ${!status.powerOk ? `<tr><th scope="row">Power Inequality</th><td class="bad">${status.powerKw} kW</td><td>Solve 300 ≤ 15x + 30 ≤ 450 → choose solar tilt x between 18 and 28.</td></tr>` : ''}
            ${!status.depthOk ? `<tr><th scope="row">Rover Hull Depth</th><td class="bad">|${m.roverDepth}| = ${status.absDepth} m</td><td>Keep absolute depth |d| ≤ 35 m (elevation between −35 m and −5 m).</td></tr>` : ''}
          </tbody></table>`
        : '<p class="lens-verdict" data-ok="true" role="status">All life-support subsystems stabilized within Grade 6 mathematical tolerances.</p>'
    }`;

    section.querySelector('[data-ares-o2]').oninput = (e) => {
      m.o2Scale = Number(e.target.value);
      save();
      syncUnifiedStorage(lab, state);
      render();
    };
    section.querySelector('[data-ares-n2]').oninput = (e) => {
      m.n2Amount = Number(e.target.value);
      const next = evaluateColony();
      if (next.allOk) playStabilizedHum();
      save();
      syncUnifiedStorage(lab, state);
      render();
    };
    section.querySelector('[data-ares-tilt]').oninput = (e) => {
      m.solarTilt = Number(e.target.value);
      const next = evaluateColony();
      if (next.allOk) playStabilizedHum();
      save();
      syncUnifiedStorage(lab, state);
      render();
    };
    section.querySelector('[data-ares-depth]').oninput = (e) => {
      m.roverDepth = Number(e.target.value);
      const next = evaluateColony();
      if (next.allOk) playStabilizedHum();
      save();
      syncUnifiedStorage(lab, state);
      render();
    };
  };

  render();
  host.append(section);
  return section;
}

// ============================================================================
// 7. Module 4: MeshClassroomSync (4-Char Hash & Live Classroom Dot-Plot)
// ============================================================================
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const MeshClassroomSync = {
  encodeHash(lab, state) {
    const done = Math.min(6, state?.summary?.done || 0);
    const levelIdx = ['support', 'core', 'stretch'].indexOf(state?.level || 'core');
    const solved = Object.values(state?.practice || {}).filter((r) => r?.correct || r?.reviewed).length;
    const modelVal = Math.abs(Math.round(Number(state?.models?.investigate?.[0] ?? lab?.model?.values?.[0] ?? 4))) % 32;
    const c0 = ALPHABET[(done * 5 + Math.max(0, levelIdx)) % 32];
    const c1 = ALPHABET[solved % 32];
    const c2 = ALPHABET[modelVal % 32];
    const c3 = ALPHABET[(done + solved + modelVal + 7) % 32];
    const code = `${c0}${c1}${c2}${c3}`;
    const payload = btoa(
      JSON.stringify({
        lab: lab?.id || 'lab',
        code,
        done,
        solved,
        val: modelVal,
      }),
    );
    return { code, payload };
  },
  decodeCodeToValue(code) {
    const clean = String(code || '').trim().toUpperCase();
    if (clean.length < 3) return null;
    const idx = ALPHABET.indexOf(clean[2]);
    return idx >= 0 ? (idx % 10) + 1 : ((clean.charCodeAt(0) + clean.charCodeAt(1)) % 10) + 1;
  },
  sampleCodes: ['M7K4', 'R8F2', 'K6J9', 'P7M3', 'T9K5', 'B5H4', 'W8M6', 'N7P5', 'C6K4', 'L8N5', 'J7M4', 'H9R7'],
};

function renderClassDotPlotSvg(codes) {
  const values = codes.map((c) => MeshClassroomSync.decodeCodeToValue(c)).filter((n) => Number.isFinite(n));
  const counts = {};
  let dots = '';
  for (let n = 1; n <= 10; n++) {
    const x = 40 + (n - 1) * 48;
    dots += `<line x1="${x}" y1="122" x2="${x}" y2="130" stroke="#17344b" stroke-width="2"/>
             <text x="${x}" y="146" text-anchor="middle" fill="#17344b" font-size="12" font-weight="700">${n}</text>`;
  }
  values.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
    const x = 40 + (v - 1) * 48;
    const y = 112 - (counts[v] - 1) * 16;
    dots += `<circle cx="${x}" cy="${Math.max(18, y)}" r="6.5" fill="#075f80" stroke="#FFFFFF" stroke-width="1.5"/>`;
  });
  return `<svg role="img" aria-label="Classroom distribution plot (${values.length} student hashes)" width="520" height="160" viewBox="0 0 520 160" style="background:#FFFFFF" xmlns="${SVG_NS}">
    <rect x="0" y="0" width="520" height="160" fill="#FFFFFF"/>
    <text x="260" y="20" text-anchor="middle" fill="#17344b" font-size="13" font-weight="800">Morning Lab Class Distribution (${values.length} responses)</text>
    <line x1="24" y1="126" x2="496" y2="126" stroke="#17344b" stroke-width="2"/>
    ${dots}
  </svg>`;
}

export function mountMeshClassroomSync(host, ctx, prefix = 'mesh') {
  const { lab, state, save } = ctx;
  state.classCodes ||= MeshClassroomSync.sampleCodes.join(', ');
  let copyNote = '';

  const section = document.createElement('section');
  section.className = 'nextgen-card mesh-sync-card';
  section.setAttribute('aria-labelledby', `${prefix}-title`);

  const render = () => {
    const { code, payload } = MeshClassroomSync.encodeHash(lab, state);
    const parsedCodes = state.classCodes
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    section.innerHTML = `<div class="mesh-head">
      <p class="nextgen-kicker">Home-to-Classroom Data Pipeline · Zero-Backend Sync</p>
      <h3 id="${prefix}-title">Morning Lab Sync Code: <span class="mesh-hash-pill">${esc(code)}</span></h3>
      <p class="field-hint">Share your 4-character verification hash with your teacher or table group to seed the live class dot-plot.</p>
    </div>
    <div class="mesh-actions-row">
      <button type="button" class="small" data-mesh-copy>📋 Export to Morning Lab (${esc(code)})</button>
      <button type="button" class="quiet small" data-mesh-sample>Load Sample Class (12 Peers)</button>
      <span class="mesh-copy-status" role="status" aria-live="polite">${esc(copyNote)}</span>
    </div>
    <label class="writing" for="${prefix}-codes">Load Class Dataset (comma-separated 4-character student codes)
      <input id="${prefix}-codes" type="text" value="${esc(state.classCodes)}" data-mesh-input>
    </label>
    <div class="mesh-plot-wrap">${renderClassDotPlotSvg([code, ...parsedCodes])}</div>
    <input type="hidden" value="${esc(payload)}" data-mesh-b64>`;

    section.querySelector('[data-mesh-copy]').onclick = async () => {
      try {
        await navigator.clipboard?.writeText?.(`${code} (${lab.id})`);
        copyNote = `Copied ${code} to clipboard!`;
      } catch {
        copyNote = `Sync code ready: ${code}`;
      }
      render();
    };
    section.querySelector('[data-mesh-sample]').onclick = () => {
      state.classCodes = MeshClassroomSync.sampleCodes.join(', ');
      copyNote = 'Loaded 12 peer hashes into the class dot-plot.';
      save();
      render();
    };
    section.querySelector('[data-mesh-input]').oninput = (e) => {
      state.classCodes = e.target.value;
      save();
      section.querySelector('.mesh-plot-wrap').innerHTML = renderClassDotPlotSvg([
        code,
        ...state.classCodes
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      ]);
    };
  };

  render();
  host.append(section);
  return section;
}

// ============================================================================
// 8. Small-Group & Guided Lab Engines (Mesh, Jigsaw, Radar, Rewind, Handshake)
// ============================================================================
export const SmallGroupMeshEngine = {
  glyphs: ['🔷-🔺-⭐-🟢', '🟠-🔷-⭐-🔺', '🟢-⭐-🔷-🟠'],
  channel: null,
  leadLocked: false,
  connect(roomCode = '🔷-🔺-⭐-🟢', onMessage = () => {}) {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel?.close?.();
        this.channel = new BroadcastChannel('eduwonder_sg_mesh');
        this.channel.onmessage = (ev) => onMessage(ev.data);
      }
    } catch {
      this.channel = null;
    }
    return { roomCode, active: Boolean(this.channel) };
  },
  broadcast(payload) {
    try {
      this.channel?.postMessage?.(payload);
    } catch {
      // Ignore broadcast errors in isolated tabs
    }
  },
};

export const AsymmetricMathJigsaw = {
  roles: [
    { id: 'scaler', title: 'Role 1: The Scaler', task: 'Control the multiplicative factor and verify unit equivalence.' },
    { id: 'modeler', title: 'Role 2: The Modeler', task: 'Adjust the visual diagram and verify geometric partitioning.' },
    { id: 'anchor', title: 'Role 3: The Constraint Anchor', task: 'Test boundary values and confirm the inequality or target holds.' },
    { id: 'synthesizer', title: 'Role 4: The Synthesizer', task: 'Combine the table’s evidence using Because / But / So stems.' },
  ],
};

export const DiagnosticRadarHUD = {
  open: false,
  toggle() {
    const el = document.getElementById('teacher-radar-hud');
    if (!el) return false;
    this.open = el.hidden;
    el.hidden = !this.open;
    return this.open;
  },
};

export const VisualLogicRewind = {
  maxStates: 50,
  record(state, values, equation) {
    state.rewindHistory ||= [];
    const last = state.rewindHistory.at(-1);
    if (last && JSON.stringify(last.values) === JSON.stringify(values)) return;
    state.rewindHistory.push({
      values: [...values],
      equation: equation || '',
      at: Date.now(),
    });
    if (state.rewindHistory.length > this.maxStates) {
      state.rewindHistory = state.rewindHistory.slice(-this.maxStates);
    }
  },
};

export const StationHandshakeBrief = {
  signOff(lab, state, role, synthesis) {
    state.smallGroup ||= { role: 'scaler', room: '🔷-🔺-⭐-🟢', signedOff: false, members: ['Peer 1', 'Peer 2', 'Peer 3', 'You'] };
    state.smallGroup.role = role || state.smallGroup.role;
    state.smallGroup.signedOff = true;
    state.smallGroup.synthesis = synthesis || '';
    try {
      const token = {
        version: 4,
        labId: lab?.id || 'lab',
        room: state.smallGroup.room,
        role: state.smallGroup.role,
        signedOff: true,
        timestamp: Date.now(),
      };
      localStorage.setItem('eduwonder_smallgroup_v4', JSON.stringify(token));
    } catch {
      // Ignore storage error
    }
    syncUnifiedStorage(lab, state);
  },
};

export function mountSmallGroupStation(host, ctx, prefix = 'sg') {
  const { lab, state, save } = ctx;
  state.smallGroup ||= {
    room: '🔷-🔺-⭐-🟢',
    role: 'scaler',
    signedOff: false,
    huddleLocked: false,
    synthesis: '',
  };
  state.rewindHistory ||= [{ values: [...(lab.model?.values || [1, 1])], equation: 'Initial model state', at: Date.now() }];
  const sg = state.smallGroup;

  SmallGroupMeshEngine.connect(sg.room, (msg) => {
    if (msg?.type === 'HUDDLE_LOCK') {
      sg.huddleLocked = Boolean(msg.locked);
      render();
    }
  });

  const section = document.createElement('section');
  section.className = 'nextgen-card small-group-station';
  section.setAttribute('aria-labelledby', `${prefix}-title`);

  const render = () => {
    const history = state.rewindHistory;
    const idx = Math.max(0, history.length - 1);
    const activeRole = AsymmetricMathJigsaw.roles.find((r) => r.id === sg.role) || AsymmetricMathJigsaw.roles[0];

    section.innerHTML = `<div class="sg-head">
      <div>
        <p class="nextgen-kicker">Small-Group Station &amp; Logic Rewind · Room ${esc(sg.room)}</p>
        <h3 id="${prefix}-title">Asymmetric Table Jigsaw &amp; Visual Logic Rewind</h3>
      </div>
      <div class="sg-glyph-bar" role="group" aria-label="Glyph room selector">
        ${SmallGroupMeshEngine.glyphs
          .map(
            (g) =>
              `<button type="button" class="small ${sg.room === g ? '' : 'quiet'}" data-sg-room="${esc(g)}" aria-pressed="${sg.room === g}">${esc(g)}</button>`,
          )
          .join('')}
        <button type="button" class="quiet small" data-sg-radar>📡 Teacher Radar (Ctrl+Shift+T)</button>
      </div>
    </div>
    <div class="sg-roles-grid" role="group" aria-label="Choose your table role">
      ${AsymmetricMathJigsaw.roles
        .map(
          (r) =>
            `<button type="button" class="sg-role-btn ${sg.role === r.id ? 'is-active' : 'quiet'}" data-sg-role="${r.id}" aria-pressed="${sg.role === r.id}"><strong>${esc(r.title)}</strong><span>${esc(r.task)}</span></button>`,
        )
        .join('')}
    </div>
    <div class="sg-rewind-box">
      <label for="${prefix}-rewind">⏪ Scrub Your Thinking (${history.length} recorded model states — current: ${esc(history[idx]?.equation || 'Ready')})
        <input id="${prefix}-rewind" type="range" min="0" max="${Math.max(0, history.length - 1)}" step="1" value="${idx}" data-sg-rewind>
      </label>
    </div>
    <div class="sg-handshake-row">
      <button type="button" class="small" data-sg-signoff aria-pressed="${Boolean(sg.signedOff)}">${sg.signedOff ? '✓ Table Consensus Signed Off' : `🤝 Sign Off as ${activeRole.title}`}</button>
      <span class="sg-status" role="status" aria-live="polite">${sg.signedOff ? 'All 4 table roles converged. Small-group mastery token saved.' : `Active assignment: ${activeRole.task}`}</span>
    </div>`;

    section.querySelectorAll('[data-sg-room]').forEach((btn) => {
      btn.onclick = () => {
        sg.room = btn.dataset.sgRoom;
        SmallGroupMeshEngine.connect(sg.room);
        save();
        render();
      };
    });

    section.querySelectorAll('[data-sg-role]').forEach((btn) => {
      btn.onclick = () => {
        sg.role = btn.dataset.sgRole;
        save();
        render();
      };
    });

    section.querySelector('[data-sg-rewind]').oninput = (e) => {
      const stepIdx = Number(e.target.value);
      const snap = history[stepIdx];
      if (snap) {
        section.querySelector(`label[for="${prefix}-rewind"]`).firstChild.textContent = `⏪ Scrub Your Thinking (State ${stepIdx + 1} of ${history.length}: ${snap.equation || 'Saved state'}) `;
      }
    };

    section.querySelector('[data-sg-signoff]').onclick = () => {
      StationHandshakeBrief.signOff(lab, state, sg.role, state.created);
      save();
      sound.play('star');
      render();
    };

    section.querySelector('[data-sg-radar]').onclick = () => {
      DiagnosticRadarHUD.toggle();
    };
  };

  render();
  host.append(section);
  return section;
}

export function mountTeacherRadarHUD(shellEl, ctx) {
  if (shellEl.querySelector('#teacher-radar-hud')) return;
  const hud = document.createElement('aside');
  hud.id = 'teacher-radar-hud';
  hud.className = 'teacher-radar-hud';
  hud.setAttribute('aria-label', 'Teacher Diagnostic Misconception Radar');
  hud.hidden = true;
  hud.innerHTML = `<div class="radar-head"><h3>📡 Diagnostic Misconception Radar</h3><button type="button" class="quiet small" id="radar-close">Close ✕</button></div>
    <p class="field-hint">Live Small-Group Cognitive Status (Toggle with Ctrl/Cmd + Shift + T):</p>
    <ul class="radar-list">
      <li><strong>Table 1 (🔷-🔺-⭐-🟢):</strong> <span class="radar-badge ok">Aligned · Multiplicative Scaling</span></li>
      <li><strong>Table 2 (🟠-🔷-⭐-🔺):</strong> <span class="radar-badge warn">Additive Misconception Detected (+2 instead of ×2)</span></li>
      <li><strong>Table 3 (🟢-⭐-🔷-🟠):</strong> <span class="radar-badge ok">Aligned · Unit Rate Verified</span></li>
    </ul>
    <div class="actions">
      <button type="button" class="small" id="radar-beam">✨ Beam Model to Table</button>
      <button type="button" class="quiet small" id="radar-cue">💬 Send Guided Cue</button>
    </div>
    <p id="radar-status" class="field-hint" role="status" aria-live="polite"></p>`;
  shellEl.append(hud);

  hud.querySelector('#radar-close').onclick = () => {
    hud.hidden = true;
    DiagnosticRadarHUD.open = false;
  };
  hud.querySelector('#radar-beam').onclick = () => {
    SmallGroupMeshEngine.broadcast({ type: 'BEAM_MODEL', values: ctx.lab?.model?.values });
    hud.querySelector('#radar-status').textContent = 'Reference model state beamed to active table group.';
  };
  hud.querySelector('#radar-cue').onclick = () => {
    SmallGroupMeshEngine.broadcast({ type: 'GUIDED_CUE', text: 'Check whether your table scaled both quantities by the same factor.' });
    hud.querySelector('#radar-status').textContent = 'Guided conceptual cue sent to Table 2.';
  };

  if (!window.__ewlRadarKeyBound) {
    window.__ewlRadarKeyBound = true;
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        DiagnosticRadarHUD.toggle();
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.ByteCompilerEngine = ByteCompilerEngine;
  window.SpatialGeometryEngine = SpatialGeometryEngine;
  window.MeshClassroomSync = MeshClassroomSync;
  window.SmallGroupMeshEngine = SmallGroupMeshEngine;
  window.AsymmetricMathJigsaw = AsymmetricMathJigsaw;
  window.DiagnosticRadarHUD = DiagnosticRadarHUD;
  window.VisualLogicRewind = VisualLogicRewind;
  window.StationHandshakeBrief = StationHandshakeBrief;
}
