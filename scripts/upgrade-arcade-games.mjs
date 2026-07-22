import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Upgrading EduWonderLab Arcade Games across all 10 Units...');

const gamesToUpgrade = [
  {
    path: 'math/games/u1-factor-frenzy/index.html',
    unit: 1,
    name: 'Factor Frenzy',
    visualizerType: 'factor-tree-venn',
    coachHintEN: 'Prime factorization breaks composite numbers into prime leaves. 2 is the smallest prime number!',
    coachHintES: 'La factorización prima descompone números compuestos en hojas primas. ¡El 2 es el número primo más pequeño!',
  },
  {
    path: 'math/games/u1-decimal-dash/index.html',
    unit: 1,
    name: 'Decimal Dash',
    visualizerType: 'decimal-grid',
    coachHintEN: 'When adding or subtracting decimals, line up the decimal points in columns!',
    coachHintES: 'Al sumar o restar decimales, ¡alinea los puntos decimales en columnas!',
  },
  {
    path: 'math/games/u2-fraction-frenzy/index.html',
    unit: 2,
    name: 'Fraction Frenzy',
    visualizerType: 'fraction-partition',
    coachHintEN: 'Dividing by a fraction is multiplying by its reciprocal (Keep, Change, Flip)!',
    coachHintES: '¡Dividir por una fracción es multiplicar por su recíproco (Mantener, Cambiar, Voltear)!',
  },
  {
    path: 'math/games/u3-ratio-rush/index.html',
    unit: 3,
    name: 'Ratio Rush',
    visualizerType: 'ratio-table-graph',
    coachHintEN: 'Ratio tables show equivalent ratios. Unit rate tells you the amount for 1 unit!',
    coachHintES: 'Las tablas de razones muestran razones equivalentes. ¡La tasa unitaria te da la cantidad por 1 unidad!',
  },
  {
    path: 'math/games/u4-percent-power/index.html',
    unit: 4,
    name: 'Percent Power',
    visualizerType: 'percent-100-grid',
    coachHintEN: 'Percent means per 100. To find x% of a number, multiply by (x / 100)!',
    coachHintES: 'Porcentaje significa por 100. Para hallar el x% de un número, ¡multiplica por (x / 100)!',
  },
  {
    path: 'math/games/u5-area-attack/index.html',
    unit: 5,
    name: 'Area Attack',
    visualizerType: 'area-decomposer',
    coachHintEN: 'Area of triangle = 1/2 * base * height. Height MUST be perpendicular to the base!',
    coachHintES: 'Área del triángulo = 1/2 * base * altura. ¡La altura DEBE ser perpendicular a la base!',
  },
  {
    path: 'math/games/u6-expression-express/index.html',
    unit: 6,
    name: 'Expression Express',
    visualizerType: 'expression-tiles',
    coachHintEN: 'Only combine LIKE terms (same variable and exponent)!',
    coachHintES: '¡Solo combina términos SEMEJANTES (misma variable y exponente)!',
  },
  {
    path: 'math/games/u7-equation-quest/index.html',
    unit: 7,
    name: 'Equation Quest',
    visualizerType: 'balance-scale',
    coachHintEN: 'Keep equations balanced by applying inverse operations to both sides!',
    coachHintES: '¡Mantén las ecuaciones equilibradas aplicando operaciones inversas a ambos lados!',
  },
  {
    path: 'math/games/u8-data-dash/index.html',
    unit: 8,
    name: 'Data Dash',
    visualizerType: 'data-box-plot',
    coachHintEN: 'The median is the middle value. Mean Absolute Deviation (MAD) measures spread!',
    coachHintES: 'La mediana es el valor central. ¡La Desviación Media Absoluta (MAD) mide la dispersión!',
  },
  {
    path: 'math/games/u9-coordinate-quest/index.html',
    unit: 9,
    name: 'Coordinate Quest',
    visualizerType: '4-quadrant-rover',
    coachHintEN: 'Plot (x, y) by moving horizontally along x first, then vertically along y!',
    coachHintES: '¡Grafica (x, y) moviéndote horizontalmente en x primero, y luego verticalmente en y!',
  },
  {
    path: 'math/games/u10-volume-blast/index.html',
    unit: 10,
    name: 'Volume Blast',
    visualizerType: '3d-volume-net',
    coachHintEN: 'Volume = length * width * height. Surface area is the total area of all unfolded 2D faces!',
    coachHintES: 'Volumen = largo * ancho * alto. ¡El área de superficie es el área total de todas las caras desplegadas!',
  }
];

let updatedCount = 0;

for (const game of gamesToUpgrade) {
  const fullPath = path.join(rootDir, game.path);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Warning: Game file not found: ${game.path}`);
    continue;
  }

  let html = fs.readFileSync(fullPath, 'utf-8');

  // Check if stylesheet link is already included
  if (!html.includes('arcade-enhanced-styles.css')) {
    html = html.replace('</head>', `  <link rel="stylesheet" href="/shared/arcade-enhanced-styles.css">\n</head>`);
  }

  // Inject header bar with Level 1 / Level 2 badges & EN/ES toggle if missing
  const headerHtml = `
      <!-- EWL Universal Arcade Enhancements Header -->
      <div class="ewl-arcade-header-bar">
        <div class="ewl-arcade-title-group">
          <span class="ewl-arcade-badge ewl-badge-l1" id="ewl-level-badge">⭐ Level 1: Guided Support</span>
          <span style="font-size: 13px; font-weight: 600; opacity: 0.85;">| EduWonderLab Interactive Arcade</span>
        </div>
        <div class="ewl-arcade-controls">
          <button type="button" class="ewl-btn-toggle active" id="ewl-btn-l1" onclick="if(window.ewlSetLevel) window.ewlSetLevel(1)">L1 Support</button>
          <button type="button" class="ewl-btn-toggle" id="ewl-btn-l2" onclick="if(window.ewlSetLevel) window.ewlSetLevel(2)">L2 Challenge</button>
          <button type="button" class="ewl-btn-toggle" id="ewl-btn-lang" onclick="if(window.ewlToggleLang) window.ewlToggleLang()">🌐 EN / ES</button>
        </div>
      </div>
  `;

  if (!html.includes('ewl-arcade-header-bar')) {
    if (html.includes('<div id="wrap">')) {
      html = html.replace('<div id="wrap">', `<div id="wrap">\n${headerHtml}`);
    } else if (html.includes('<main')) {
      html = html.replace('<main', `${headerHtml}\n<main`);
    } else if (html.includes('<body>')) {
      html = html.replace('<body>', `<body>\n${headerHtml}`);
    }
  }

  // Inject coach card container if missing
  const coachHtml = `
      <!-- EWL Diagnostic Misconception Coach -->
      <div class="ewl-coach-card" id="ewl-coach-card" style="display: flex;">
        <div class="ewl-coach-icon">💡</div>
        <div class="ewl-coach-content">
          <h4 id="ewl-coach-title">Math Coach Tip / Consejos del Profesor</h4>
          <p id="ewl-coach-text" data-en="${game.coachHintEN}" data-es="${game.coachHintES}">${game.coachHintEN}</p>
        </div>
      </div>
  `;

  if (!html.includes('ewl-coach-card')) {
    if (html.includes('<div id="wrap">')) {
      html = html.replace('</div>\n  </body>', `${coachHtml}\n</div>\n  </body>`);
    } else {
      html = html.replace('</body>', `${coachHtml}\n</body>`);
    }
  }

  // Inject script logic for level switching, EN/ES language toggle, and SCORM telemetry
  const scriptInjection = `
  <script>
    (function() {
      let currentLang = 'EN';
      let currentLevel = 1;

      window.ewlToggleLang = function() {
        currentLang = currentLang === 'EN' ? 'ES' : 'EN';
        const langBtn = document.getElementById('ewl-btn-lang');
        if (langBtn) langBtn.innerText = currentLang === 'EN' ? '🌐 EN / ES' : '🌐 ES / EN';
        
        const coachText = document.getElementById('ewl-coach-text');
        if (coachText) {
          const text = coachText.getAttribute(currentLang === 'EN' ? 'data-en' : 'data-es');
          if (text) coachText.innerText = text;
        }
      };

      window.ewlSetLevel = function(lvl) {
        currentLevel = lvl;
        const bL1 = document.getElementById('ewl-btn-l1');
        const bL2 = document.getElementById('ewl-btn-l2');
        const badge = document.getElementById('ewl-level-badge');

        if (lvl === 1) {
          if (bL1) bL1.classList.add('active');
          if (bL2) bL2.classList.remove('active');
          if (badge) {
            badge.className = 'ewl-arcade-badge ewl-badge-l1';
            badge.innerText = '⭐ Level 1: Guided Support';
          }
        } else {
          if (bL2) bL2.classList.add('active');
          if (bL1) bL1.classList.remove('active');
          if (badge) {
            badge.className = 'ewl-arcade-badge ewl-badge-l2';
            badge.innerText = '🔥 Level 2: Mastery Challenge';
          }
        }
      };

      // Telemetry & dual storage sync
      window.ewlSyncProgress = function(gameName, score, stars) {
        try {
          const data = { gameName, score, stars, timestamp: new Date().toISOString() };
          localStorage.setItem('ewl_arcade_' + gameName, JSON.stringify(data));
          
          // SCORM postMessage if embedded in Canvas
          if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({ type: 'EWL_GAME_SCORE', payload: data }, '*');
          }
        } catch(e) {
          console.warn('Storage sync error:', e);
        }
      };
    })();
  </script>
  `;

  if (!html.includes('window.ewlToggleLang')) {
    html = html.replace('</body>', `${scriptInjection}\n</body>`);
  }

  fs.writeFileSync(fullPath, html, 'utf-8');
  console.log(` ✅ Upgraded: ${game.path}`);
  updatedCount++;
}

console.log(`\n🎉 Successfully upgraded ${updatedCount} EduWonderLab Arcade Games!`);
