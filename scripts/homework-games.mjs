/**
 * Topic-matched mini-games for family homework Play tab.
 * Generator-driven HTML + inline JS — no external deps (2D/CSS fallback).
 */
import { detectVisualTopic } from "./homework-alignment.mjs";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function gameMeta(config) {
  const topic = detectVisualTopic(config);
  const vocab = (config.vocabulary || []).slice(0, 4);
  return { topic, vocab, title: config.title || "Tonight's math" };
}

/** @returns {{ type: string, html: string, initScript: string }} */
export function buildHomeworkGame(config) {
  const { topic, vocab, title } = gameMeta(config);
  const builders = {
    exponents: buildExponentGame,
    ratios: buildRatioGame,
    equations: buildEquationGame,
    inequalities: buildInequalityGame,
    expressions: buildExpressionGame,
    statistics: buildStatsSortGame,
    "coordinate-plane": buildCoordinateGame,
    "number-line": buildNumberLineGame,
    fractions: buildFractionGame,
    area: buildAreaGame,
    volume: buildVolumeGame,
    "surface-area": buildSurfaceAreaGame,
    decimals: buildDecimalGame,
    factors: buildFactorGame,
  };
  const fn = builders[topic] || buildVocabMatchGame;
  return fn(config, { topic, vocab, title });
}

function buildExponentGame(config, { title }) {
  const rounds = [
    { q: "What is 2³?", choices: ["8", "6", "9", "5"], correct: 0, hint: "2 × 2 × 2" },
    { q: "What is 5²?", choices: ["25", "10", "7", "52"], correct: 0, hint: "5 × 5" },
    { q: "What is 3³?", choices: ["27", "9", "6", "33"], correct: 0, hint: "3 × 3 × 3" },
    { q: "Which equals 4²?", choices: ["16", "8", "6", "42"], correct: 0, hint: "4 × 4" },
  ];
  return mcSpeedGame("exponent", title, "Power Up!", "¡Potencia!", rounds, {
    en: "Tap the correct value. The exponent tells how many times to multiply the base.",
    es: "Toquen el valor correcto. El exponente dice cuántas veces multiplicar la base.",
  });
}

function buildRatioGame(config, { title }) {
  const rounds = [
    { q: "Ratio 2:3 — if A=4, B=?", choices: ["6", "5", "8", "2"], correct: 0 },
    { q: "Ratio 1:4 — if A=3, B=?", choices: ["12", "7", "4", "9"], correct: 0 },
    { q: "Equivalent to 2:5?", choices: ["4:10", "2:10", "5:2", "3:5"], correct: 0 },
    { q: "Ratio 3:2 — if A=9, B=?", choices: ["6", "12", "3", "11"], correct: 0 },
  ];
  return mcSpeedGame("ratio", title, "Ratio Match!", "¡Razones!", rounds, {
    en: "Use the same multiplier on BOTH parts of the ratio.",
    es: "Usen el mismo multiplicador en AMBAS partes de la razón.",
  });
}

function buildEquationGame(config, { title }) {
  const rounds = [
    { q: "'A number plus 5 equals 12' →", choices: ["n + 5 = 12", "5n = 12", "n − 5 = 12", "n + 12 = 5"], correct: 0 },
    { q: "'Twice a number is 10' →", choices: ["2n = 10", "n + 2 = 10", "n² = 10", "2 + n = 10"], correct: 0 },
    { q: "'Seven less than n is 3' →", choices: ["n − 7 = 3", "7 − n = 3", "n + 7 = 3", "n / 7 = 3"], correct: 0 },
    { q: "Variable stands for…", choices: ["Unknown number", "Always 1", "The answer only", "Addition sign"], correct: 0 },
  ];
  return mcSpeedGame("equation", title, "Equation Builder!", "¡Ecuaciones!", rounds, {
    en: "Match words to symbols: plus → +, equals → =, unknown → letter.",
    es: "Unan palabras con símbolos: más → +, es igual → =, incógnita → letra.",
  });
}

function buildInequalityGame(config, { title }) {
  const rounds = [
    { q: "x > 5 — is 6 a solution?", choices: ["Yes", "No"], correct: 0 },
    { q: "x ≤ 4 — is 4 a solution?", choices: ["Yes", "No"], correct: 0 },
    { q: "x < 3 — is 3 a solution?", choices: ["No", "Yes"], correct: 0 },
    { q: "Open circle used for…", choices: ["< or >", "≤ or ≥", "Only =", "Never"], correct: 0 },
  ];
  return mcSpeedGame("inequality", title, "Inequality Gate!", "¡Desigualdades!", rounds, {
    en: "Test values: substitute to see if the inequality is true.",
    es: "Prueben valores: sustituyan para ver si la desigualdad es verdadera.",
  });
}

function buildExpressionGame(config, { title }) {
  const rounds = [
    { q: "Evaluate 2x when x = 4", choices: ["8", "6", "24", "2"], correct: 0 },
    { q: "Which is an expression (no =)?", choices: ["3n + 2", "3n + 2 = 8", "n = 5", "8 = 8"], correct: 0 },
    { q: "Coefficient in 5y?", choices: ["5", "y", "5y", "None"], correct: 0 },
    { q: "Evaluate 3 + 2²", choices: ["7", "25", "5", "12"], correct: 0 },
  ];
  return mcSpeedGame("expression", title, "Expression Lab!", "¡Expresiones!", rounds, {
    en: "Substitute the value, then follow order of operations.",
    es: "Sustituyan el valor, luego sigan el orden de operaciones.",
  });
}

function buildStatsSortGame(config, { title }) {
  const items = [
    { text: "How many pets do students have?", bucket: "stat" },
    { text: "What is your favorite color?", bucket: "stat" },
    { text: "What is 2 + 2?", bucket: "not" },
    { text: "Heights of plants in cm", bucket: "stat" },
    { text: "Spell the word cat", bucket: "not" },
    { text: "Minutes spent on homework", bucket: "stat" },
  ];
  return dragBucketGame("stats", title, "Stat Sort!", "¡Estadística!", items, {
    stat: { en: "Statistical question", es: "Pregunta estadística" },
    not: { en: "NOT statistical", es: "NO estadística" },
  }, {
    en: "Statistical questions expect many different answers from a group.",
    es: "Las preguntas estadísticas esperan muchas respuestas diferentes de un grupo.",
  });
}

function buildCoordinateGame(config, { title }) {
  const rounds = [
    { q: "Point at (3, 2) — which quadrant?", choices: ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"], correct: 0 },
    { q: "Origin coordinates?", choices: ["(0, 0)", "(1, 1)", "(0, 1)", "(1, 0)"], correct: 0 },
    { q: "Move right 4, up 1 from (1,2) →", choices: ["(5, 3)", "(5, 2)", "(1, 6)", "(−3, 3)"], correct: 0 },
    { q: "x-axis is…", choices: ["Horizontal", "Vertical", "Diagonal", "A point"], correct: 0 },
  ];
  return mcSpeedGame("coordinate", title, "Grid Treasure!", "¡Coordenadas!", rounds, {
    en: "Go right for x, up for y. Play together on the grid!",
    es: "Derecha es x, arriba es y. ¡Jueguen juntos en la cuadrícula!",
  });
}

function buildNumberLineGame(config, { title }) {
  const rounds = [
    { q: "Which is greater: −2 or −5?", choices: ["−2", "−5", "Equal"], correct: 0 },
    { q: "|−7| = ?", choices: ["7", "−7", "0", "14"], correct: 0 },
    { q: "Order: −1, 0, 2", choices: ["−1, 0, 2", "2, 0, −1", "0, −1, 2", "2, −1, 0"], correct: 0 },
    { q: "Opposite of −4?", choices: ["4", "−4", "0", "8"], correct: 0 },
  ];
  return mcSpeedGame("numberline", title, "Number Line Dash!", "¡Recta numérica!", rounds, {
    en: "Right is greater on a horizontal number line.",
    es: "A la derecha es mayor en una recta horizontal.",
  });
}

function buildFractionGame(config, { title }) {
  const rounds = [
    { q: "6 ÷ ½ = ?", choices: ["12", "3", "6", "1/12"], correct: 0 },
    { q: "½ of 8 = ?", choices: ["4", "2", "16", "6"], correct: 0 },
    { q: "Which is larger: ⅔ or ½?", choices: ["⅔", "½", "Equal"], correct: 0 },
    { q: "2 ÷ ¼ = ?", choices: ["8", "2", "4", "½"], correct: 0 },
  ];
  return mcSpeedGame("fraction", title, "Fraction Finder!", "¡Fracciones!", rounds, {
    en: "Dividing by a fraction = multiply by its reciprocal.",
    es: "Dividir por una fracción = multiplicar por su recíproco.",
  });
}

function buildAreaGame(config, { title }) {
  const rounds = [
    { q: "Rectangle 5 × 3 area?", choices: ["15", "8", "16", "53"], correct: 0 },
    { q: "Triangle: base 6, height 4", choices: ["12", "24", "10", "6"], correct: 0 },
    { q: "Area units are…", choices: ["Square units", "Cubic units", "Lines", "Degrees"], correct: 0 },
    { q: "Parallelogram: base 8, height 5", choices: ["40", "13", "80", "45"], correct: 0 },
  ];
  return mcSpeedGame("area", title, "Area Builder!", "¡Área!", rounds, {
    en: "Area = base × height (watch units!).",
    es: "Área = base × altura (¡cuidado con las unidades!).",
  });
}

function buildVolumeGame(config, { title }) {
  const rounds = [
    { q: "Prism 3×4×2 volume?", choices: ["24", "9", "12", "14"], correct: 0 },
    { q: "Volume units are…", choices: ["Cubic", "Square", "Linear", "Flat"], correct: 0 },
    { q: "Layers: 5×2 base, 3 layers high", choices: ["30", "10", "15", "25"], correct: 0 },
    { q: "V = l × w × h uses…", choices: ["3 dimensions", "2 dimensions", "1 dimension", "Angles"], correct: 0 },
  ];
  return mcSpeedGame("volume", title, "Volume Fill!", "¡Volumen!", rounds, {
    en: "Imagine filling the prism with unit cubes layer by layer.",
    es: "Imaginen llenar el prisma con cubos unidad capa por capa.",
  });
}

function buildSurfaceAreaGame(config, { title }) {
  const rounds = [
    { q: "Surface area measures…", choices: ["All faces", "Inside only", "One edge", "Volume"], correct: 0 },
    { q: "A net shows…", choices: ["Unfolded faces", "Hidden volume", "Angles only", "Graph"], correct: 0 },
    { q: "Units for SA?", choices: ["Square units", "Cubic units", "Degrees", "Ratios"], correct: 0 },
    { q: "Find SA by…", choices: ["Add face areas", "Multiply l×w×h", "Subtract bases", "Divide edges"], correct: 0 },
  ];
  return mcSpeedGame("surface", title, "Net Match!", "¡Área de superficie!", rounds, {
    en: "Add up every face you see on the net.",
    es: "Sumen cada cara que ven en la red.",
  });
}

function buildDecimalGame(config, { title }) {
  const rounds = [
    { q: "1.5 + 2.3 = ?", choices: ["3.8", "3.5", "4.8", "2.8"], correct: 0 },
    { q: "0.6 × 10 = ?", choices: ["6", "0.06", "60", "1.6"], correct: 0 },
    { q: "Line up…", choices: ["Decimal points", "Ones digits only", "Random columns", "Nothing"], correct: 0 },
    { q: "4.2 − 1.8 = ?", choices: ["2.4", "6.0", "3.4", "1.4"], correct: 0 },
  ];
  return mcSpeedGame("decimal", title, "Decimal Dash!", "¡Decimales!", rounds, {
    en: "Line up decimal points before adding or subtracting.",
    es: "Alineen los puntos decimales antes de sumar o restar.",
  });
}

function buildFactorGame(config, { title }) {
  const rounds = [
    { q: "Prime number?", choices: ["7", "6", "9", "12"], correct: 0 },
    { q: "GCF of 12 and 18?", choices: ["6", "3", "36", "2"], correct: 0 },
    { q: "LCM of 4 and 6?", choices: ["12", "24", "2", "10"], correct: 0 },
    { q: "24 = 2³ × ?", choices: ["3", "4", "6", "8"], correct: 0 },
  ];
  return mcSpeedGame("factor", title, "Factor Tree!", "¡Factores!", rounds, {
    en: "Break numbers apart until only primes remain.",
    es: "Descompongan hasta que solo queden primos.",
  });
}

function buildVocabMatchGame(config, { vocab, title }) {
  const rounds =
    vocab.length >= 3
      ? vocab.slice(0, 4).map((v) => {
          const defs = vocab.map((x) => x.definition).filter(Boolean);
          const wrong = defs.filter((d) => d !== v.definition).slice(0, 3);
          const choices = [v.definition, ...wrong].sort(() => Math.random() - 0.5);
          return {
            q: `What does "${v.term}" mean?`,
            choices,
            correct: choices.indexOf(v.definition),
          };
        })
      : [
          { q: "What are we learning tonight?", choices: [title, "Addition only", "Spelling", "History"], correct: 0 },
          { q: "Math vocabulary helps us…", choices: ["Explain thinking", "Skip work", "Avoid numbers", "Guess"], correct: 0 },
          { q: "Work together means…", choices: ["Student thinks first", "Parent does all", "Copy answers", "Skip steps"], correct: 0 },
        ];
  return mcSpeedGame("vocab", title, "Word Match!", "¡Palabras!", rounds, {
    en: "Use tonight's vocabulary words as you play!",
    es: "¡Usen las palabras del vocabulario de hoy mientras juegan!",
  });
}

function shuffleChoices(correct, pool) {
  const wrong = pool.filter((p) => p !== correct).slice(0, 3);
  const all = [correct, ...wrong].sort(() => Math.random() - 0.5);
  return all;
}

function mcSpeedGame(id, title, nameEn, nameEs, rounds, coach) {
  const normalized = rounds.map((r) => {
    if (Array.isArray(r.choices) && typeof r.choices[0] === "string") {
      return { q: r.q, choices: r.choices.map((t, i) => ({ text: t, isCorrect: i === r.correct })), hint: r.hint || "" };
    }
    return r;
  });
  const data = JSON.stringify(normalized).replace(/'/g, "&#39;");
  return {
    type: "mc-speed",
    html: `
      <div class="hw-game hw-game-mc" id="hw_game_${id}" data-game-type="mc-speed" data-rounds='${data.replace(/&/g, "&amp;")}'>
        <div class="hw-game-header">
          <h3 class="hw-game-title">${esc(nameEn)} <span lang="es">${esc(nameEs)}</span></h3>
          <p class="hw-game-coach bilingual-block">
            <span class="lang-en">🎮 Play together! ${esc(coach.en)}</span>
            <span class="lang-es" lang="es">🎮 ¡Jueguen juntos! ${esc(coach.es)}</span>
          </p>
        </div>
        <div class="hw-game-score" id="hw_game_score">Round 1 / Ronda 1</div>
        <p class="hw-game-question" id="hw_game_question"></p>
        <div class="hw-game-choices" id="hw_game_choices" role="group"></div>
        <p class="hw-game-feedback" id="hw_game_feedback" role="status" aria-live="polite"></p>
        <button type="button" class="btn btn-primary hw-game-restart" id="hw_game_restart" hidden>Play again / Jugar otra vez</button>
      </div>`,
    initScript: "",
  };
}

function dragBucketGame(id, title, nameEn, nameEs, items, buckets, coach) {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  const data = JSON.stringify(shuffled).replace(/'/g, "&#39;");
  return {
    type: "drag-bucket",
    html: `
      <div class="hw-game hw-game-sort" id="hw_game_${id}" data-game-type="drag-bucket" data-items='${data.replace(/&/g, "&amp;")}'>
        <div class="hw-game-header">
          <h3 class="hw-game-title">${esc(nameEn)} <span lang="es">${esc(nameEs)}</span></h3>
          <p class="hw-game-coach bilingual-block">
            <span class="lang-en">🎮 Play together! ${esc(coach.en)}</span>
            <span class="lang-es" lang="es">🎮 ¡Jueguen juntos! ${esc(coach.es)}</span>
          </p>
        </div>
        <div class="hw-game-buckets">
          ${Object.entries(buckets)
            .map(
              ([key, labels]) => `
            <div class="hw-game-bucket" data-bucket="${esc(key)}" ondragover="hwGameAllowDrop(event)" ondrop="hwGameDrop(event,'${esc(key)}')">
              <div class="hw-game-bucket-label">${esc(labels.en)} / <span lang="es">${esc(labels.es)}</span></div>
              <div class="hw-game-bucket-slots" id="bucket_${esc(key)}"></div>
            </div>`,
            )
            .join("")}
        </div>
        <div class="hw-game-pile" id="hw_game_pile" ondragover="hwGameAllowDrop(event)" ondrop="hwGameDrop(event,'')">
          ${shuffled
            .map(
              (it, i) => `
            <div class="hw-game-card" draggable="true" id="hwcard_${i}" data-bucket="${esc(it.bucket)}"
                 ondragstart="hwGameDragStart(event)" onclick="hwGameTapCard(this)">
              ${esc(it.text)}
            </div>`,
            )
            .join("")}
        </div>
        <button type="button" class="btn btn-primary" onclick="hwGameCheckSort()">Check sort / Verificar</button>
        <p class="hw-game-feedback" id="hw_game_feedback" role="status" aria-live="polite"></p>
      </div>`,
    initScript: "",
  };
}

export function renderPlayTab(config) {
  const game = buildHomeworkGame(config);
  return `
    <section class="guided-section card section-play" aria-label="Play together game">
      <h2 class="section-title">🎮 Play together / Juguemos juntos</h2>
      <p class="bilingual-block play-intro">
        <span class="lang-en">Reinforce tonight's topic with a quick family game. You ask; your student decides!</span>
        <span class="lang-es" lang="es">Refuercen el tema de hoy con un juego rápido en familia. ¡Ustedes preguntan; su estudiante decide!</span>
      </p>
      ${game.html}
    </section>`;
}

export const HOMEWORK_GAME_JS = `
let hwGameRound = 0;
let hwGameScore = 0;
let hwGameRounds = [];
let hwGameSelectedCard = null;

function initHomeworkGame() {
  const mc = document.querySelector('.hw-game-mc[data-rounds]');
  if (mc && !mc.dataset.initialized) {
    mc.dataset.initialized = '1';
    try { hwGameRounds = JSON.parse(mc.dataset.rounds || '[]'); } catch(e) { hwGameRounds = []; }
    hwGameRound = 0; hwGameScore = 0;
    hwGameShowRound();
  }
}

function hwGameShowRound() {
  const qEl = document.getElementById('hw_game_question');
  const cEl = document.getElementById('hw_game_choices');
  const sEl = document.getElementById('hw_game_score');
  const fEl = document.getElementById('hw_game_feedback');
  const rBtn = document.getElementById('hw_game_restart');
  if (!qEl || !cEl || !hwGameRounds.length) return;
  if (hwGameRound >= hwGameRounds.length) {
    qEl.textContent = '';
    cEl.innerHTML = '';
    if (sEl) sEl.textContent = 'Score: ' + hwGameScore + '/' + hwGameRounds.length;
    if (fEl) {
      fEl.textContent = hwGameScore === hwGameRounds.length
        ? '🎉 Perfect! / ¡Perfecto!' : 'Nice work! / ¡Buen trabajo!';
      fEl.className = 'hw-game-feedback success';
    }
    if (rBtn) rBtn.hidden = false;
    if (typeof triggerCelebration === 'function') triggerCelebration();
    return;
  }
  const round = hwGameRounds[hwGameRound];
  if (sEl) sEl.textContent = 'Round ' + (hwGameRound + 1) + ' / Ronda ' + (hwGameRound + 1);
  qEl.textContent = round.q || '';
  cEl.innerHTML = '';
  if (fEl) { fEl.textContent = round.hint ? '💡 ' + round.hint : ''; fEl.className = 'hw-game-feedback'; }
  (round.choices || []).forEach((ch, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hw-game-choice-btn';
    btn.textContent = ch.text || ch;
    btn.onclick = function() {
      const ok = ch.isCorrect || (round.correct === idx);
      if (ok) { hwGameScore++; btn.classList.add('correct'); }
      else btn.classList.add('incorrect');
      setTimeout(function() { hwGameRound++; hwGameShowRound(); }, 600);
    };
    cEl.appendChild(btn);
  });
}

document.getElementById('hw_game_restart')?.addEventListener('click', function() {
  hwGameRound = 0; hwGameScore = 0;
  const mc = document.querySelector('.hw-game-mc[data-rounds]');
  if (mc) mc.dataset.initialized = '';
  this.hidden = true;
  initHomeworkGame();
});

function hwGameDragStart(ev) {
  ev.dataTransfer.setData('text/plain', ev.target.id);
  hwGameSelectedCard = ev.target;
}
function hwGameAllowDrop(ev) { ev.preventDefault(); }
function hwGameDrop(ev, bucket) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData('text/plain');
  let card = document.getElementById(id);
  if (!card && hwGameSelectedCard) card = hwGameSelectedCard;
  if (!card) return;
  let target = ev.currentTarget;
  if (target.classList.contains('hw-game-bucket-slots') || target.id === 'hw_game_pile') {
    target.appendChild(card);
  } else if (bucket) {
    const slots = document.getElementById('bucket_' + bucket);
    if (slots) slots.appendChild(card);
  } else {
    document.getElementById('hw_game_pile')?.appendChild(card);
  }
  hwGameSelectedCard = null;
}
function hwGameTapCard(card) {
  if (hwGameSelectedCard === card) { card.style.outline = ''; hwGameSelectedCard = null; return; }
  if (hwGameSelectedCard) hwGameSelectedCard.style.outline = '';
  hwGameSelectedCard = card;
  card.style.outline = '3px solid var(--teal)';
}
document.querySelectorAll('.hw-game-bucket, #hw_game_pile').forEach(function(zone) {
  zone.addEventListener('click', function() {
    if (!hwGameSelectedCard) return;
    if (zone.classList.contains('hw-game-bucket')) {
      const slots = zone.querySelector('.hw-game-bucket-slots');
      if (slots) slots.appendChild(hwGameSelectedCard);
    } else zone.appendChild(hwGameSelectedCard);
    hwGameSelectedCard.style.outline = '';
    hwGameSelectedCard = null;
  });
});
function hwGameCheckSort() {
  const fEl = document.getElementById('hw_game_feedback');
  let ok = true;
  document.querySelectorAll('.hw-game-card').forEach(function(card) {
    const parent = card.closest('.hw-game-bucket-slots');
    const bucket = parent ? parent.id.replace('bucket_', '') : '';
    if (bucket !== card.dataset.bucket) ok = false;
  });
  if (fEl) {
    fEl.textContent = ok ? '🎉 All sorted! / ¡Todo clasificado!' : 'Try again — some cards are in the wrong bucket. / Intenten otra vez.';
    fEl.className = 'hw-game-feedback ' + (ok ? 'success' : 'error');
  }
  if (ok && typeof triggerCelebration === 'function') triggerCelebration();
}
`;
