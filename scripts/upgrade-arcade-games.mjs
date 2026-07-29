import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🔍 Scanning ALL math game files across EduWonderLab...");

function findGameFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist") {
        findGameFiles(filePath, fileList);
      }
    } else if (file.endsWith(".html")) {
      const relPath = path.relative(rootDir, filePath);
      if (
        relPath.includes("game") ||
        relPath.includes("arcade") ||
        relPath.includes("math/games/")
      ) {
        fileList.push(relPath);
      }
    }
  }
  return fileList;
}

const allGameFiles = findGameFiles(path.join(rootDir, "math"));
console.log(`Found ${allGameFiles.length} game HTML files across the curriculum.`);

const unitCoachHints = {
  1: {
    en: "Prime factorization breaks composite numbers into prime leaves. 2 is the smallest prime number!",
    es: "La factorización prima descompone números compuestos en hojas primas.",
  },
  2: {
    en: "Dividing by a fraction is multiplying by its reciprocal (Keep, Change, Flip)!",
    es: "¡Dividir por una fracción es multiplicar por su recíproco!",
  },
  3: {
    en: "Ratio tables show equivalent ratios. Unit rate tells you the amount for 1 unit!",
    es: "Las tablas de razones muestran razones equivalentes. La tasa unitaria es por 1 unidad.",
  },
  4: {
    en: "Percent means per 100. To find x% of a number, multiply by (x / 100)!",
    es: "Porcentaje significa por 100. Para hallar el x%, multiplica por (x / 100).",
  },
  5: {
    en: "Area of triangle = 1/2 * base * height. Height MUST be perpendicular to the base!",
    es: "Área del triángulo = 1/2 * base * altura.",
  },
  6: {
    en: "Only combine LIKE terms (same variable and exponent)!",
    es: "¡Solo combina términos SEMEJANTES!",
  },
  7: {
    en: "Keep equations balanced by applying inverse operations to both sides!",
    es: "¡Mantén las ecuaciones equilibradas con operaciones inversas!",
  },
  8: {
    en: "The median is the middle value. Mean Absolute Deviation (MAD) measures spread!",
    es: "La mediana es el valor central. MAD mide la dispersión.",
  },
  9: {
    en: "Plot (x, y) by moving horizontally along x first, then vertically along y!",
    es: "¡Grafica (x, y) moviéndote horizontalmente en x primero!",
  },
  10: {
    en: "Volume = length * width * height. Surface area is total area of unfolded 2D faces!",
    es: "Volumen = largo * ancho * alto.",
  },
  0: {
    en: "Calm self-paced review lab: practice, match, sort, and solve at your own pace!",
    es: "Práctica a tu propio ritmo: clasifica, empareja y resuelve.",
  },
};

let upgradedCount = 0;

for (const relPath of allGameFiles) {
  const fullPath = path.join(rootDir, relPath);
  let html = fs.readFileSync(fullPath, "utf-8");

  // Determine unit number from path
  let unitNum = 0;
  const match = relPath.match(/unit-?(\d+)/i) || relPath.match(/u(\d+)-/i);
  if (match) unitNum = parseInt(match[1], 10);
  if (unitNum > 10) unitNum = 0;

  const hint = unitCoachHints[unitNum] || unitCoachHints[0];

  // Inject stylesheet link if missing
  if (!html.includes("arcade-enhanced-styles.css")) {
    html = html.replace(
      "</head>",
      `  <link rel="stylesheet" href="/shared/arcade-enhanced-styles.css">\n</head>`,
    );
  }

  // Header bar injection
  const headerHtml = `
      <!-- EWL Universal Arcade Enhancements Header -->
      <div class="ewl-arcade-header-bar" style="position: relative; z-index: 100;">
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

  if (!html.includes("ewl-arcade-header-bar")) {
    if (html.includes('<div id="wrap">')) {
      html = html.replace('<div id="wrap">', `<div id="wrap">\n${headerHtml}`);
    } else if (html.includes("<main")) {
      html = html.replace("<main", `${headerHtml}\n<main`);
    } else if (html.includes("<body>")) {
      html = html.replace("<body>", `<body>\n${headerHtml}`);
    }
  }

  // Coach card injection
  const coachHtml = `
      <!-- EWL Diagnostic Misconception Coach -->
      <div class="ewl-coach-card" id="ewl-coach-card" style="display: flex; position: relative; z-index: 100;">
        <div class="ewl-coach-icon">💡</div>
        <div class="ewl-coach-content">
          <h4 id="ewl-coach-title">Math Coach Tip / Consejos del Profesor</h4>
          <p id="ewl-coach-text" data-en="${hint.en}" data-es="${hint.es}">${hint.en}</p>
        </div>
      </div>
  `;

  if (!html.includes("ewl-coach-card")) {
    if (html.includes('<div id="wrap">')) {
      html = html.replace("</div>\n  </body>", `${coachHtml}\n</div>\n  </body>`);
    } else {
      html = html.replace("</body>", `${coachHtml}\n</body>`);
    }
  }

  // Universal helper script injection
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

      window.ewlSyncProgress = function(gameName, score, stars) {
        try {
          const data = { gameName, score, stars, timestamp: new Date().toISOString() };
          localStorage.setItem('ewl_arcade_' + gameName, JSON.stringify(data));
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

  if (!html.includes("window.ewlToggleLang")) {
    html = html.replace("</body>", `${scriptInjection}\n</body>`);
  }

  fs.writeFileSync(fullPath, html, "utf-8");
  upgradedCount++;
}

console.log(
  `\n🎉 Successfully upgraded ALL ${upgradedCount} arcade game files across EduWonderLab!`,
);
