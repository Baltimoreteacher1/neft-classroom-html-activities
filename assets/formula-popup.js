/* ==========================================================================
   EDUWONDERLAB FORMULA POPUP & SCROLL TOP RESET SYSTEM
   ========================================================================== */

(function() {
  // 1. Force Page Scroll to Top on Lesson Boot
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.addEventListener('load', function() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });

  // 2. Formula Database with Abstract Visual SVG Diagrams (No specific numbers)
  const FORMULA_DB = {
    "area_rectangle": {
      title: "Area of a Rectangle",
      formula: "A = l × w",
      vars: [
        { symbol: "A", desc: "Total area (square units inside)" },
        { symbol: "l", desc: "Length of base" },
        { symbol: "w", desc: "Width / Height" }
      ],
      svg: `<svg viewBox="0 0 280 140" style="background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; width:100%;">
        <rect x="50" y="30" width="180" height="70" fill="rgba(2,132,199,0.15)" stroke="#0284C7" stroke-width="2.5" rx="6"/>
        <line x1="50" y1="112" x2="230" y2="112" stroke="#0284C7" stroke-width="2" marker-start="url(#arrowS)" marker-end="url(#arrowE)"/>
        <text x="140" y="126" text-anchor="middle" fill="#0284C7" font-weight="800" font-size="12">Length (l)</text>
        <line x1="38" y1="30" x2="38" y2="100" stroke="#0D9488" stroke-width="2"/>
        <text x="24" y="68" text-anchor="middle" fill="#0D9488" font-weight="800" font-size="12">w</text>
        <text x="140" y="70" text-anchor="middle" fill="#0F172A" font-weight="800" font-size="14">Area = l × w</text>
      </svg>`
    },
    "area_triangle": {
      title: "Area of a Triangle",
      formula: "A = ½ × b × h",
      vars: [
        { symbol: "A", desc: "Total enclosed triangle area" },
        { symbol: "b", desc: "Length of triangle base" },
        { symbol: "h", desc: "Perpendicular height (at 90° to base)" }
      ],
      svg: `<svg viewBox="0 0 280 140" style="background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; width:100%;">
        <polygon points="40,105 240,105 170,25" fill="rgba(13,148,136,0.18)" stroke="#0D9488" stroke-width="2.5"/>
        <line x1="170" y1="25" x2="170" y2="105" stroke="#EA580C" stroke-width="2" stroke-dasharray="4"/>
        <rect x="162" y="97" width="8" height="8" fill="none" stroke="#EA580C" stroke-width="1.5"/>
        <text x="182" y="65" fill="#EA580C" font-weight="800" font-size="12">h</text>
        <text x="140" y="122" fill="#0D9488" font-weight="800" font-size="12">Base (b)</text>
        <text x="110" y="65" fill="#0F172A" font-weight="800" font-size="13">A = ½ · b · h</text>
      </svg>`
    },
    "area_trapezoid": {
      title: "Area of a Trapezoid",
      formula: "A = ½ × (b₁ + b₂) × h",
      vars: [
        { symbol: "b₁", desc: "Top parallel base length" },
        { symbol: "b₂", desc: "Bottom parallel base length" },
        { symbol: "h", desc: "Perpendicular distance between bases" }
      ],
      svg: `<svg viewBox="0 0 280 140" style="background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; width:100%;">
        <polygon points="80,30 200,30 240,105 40,105" fill="rgba(234,88,12,0.15)" stroke="#EA580C" stroke-width="2.5"/>
        <text x="140" y="22" text-anchor="middle" fill="#0284C7" font-weight="800" font-size="12">b₁</text>
        <text x="140" y="122" text-anchor="middle" fill="#0284C7" font-weight="800" font-size="12">b₂</text>
        <line x1="140" y1="30" x2="140" y2="105" stroke="#0D9488" stroke-width="2" stroke-dasharray="4"/>
        <text x="152" y="68" fill="#0D9488" font-weight="800" font-size="12">h</text>
        <text x="140" y="70" text-anchor="middle" fill="#0F172A" font-weight="800" font-size="12">A = ½(b₁ + b₂)h</text>
      </svg>`
    },
    "volume_prism": {
      title: "Volume of a Rectangular Prism",
      formula: "V = l × w × h",
      vars: [
        { symbol: "V", desc: "3D space capacity inside" },
        { symbol: "l", desc: "Length" },
        { symbol: "w", desc: "Width" },
        { symbol: "h", desc: "Height" }
      ],
      svg: `<svg viewBox="0 0 280 140" style="background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; width:100%;">
        <polygon points="50,95 170,95 210,45 90,45" fill="rgba(79,70,229,0.15)" stroke="#4F46E5" stroke-width="2"/>
        <polygon points="90,45 210,45 210,15 90,15" fill="rgba(79,70,229,0.25)" stroke="#4F46E5" stroke-width="2"/>
        <polygon points="50,95 90,45 90,15 50,65" fill="rgba(79,70,229,0.35)" stroke="#4F46E5" stroke-width="2"/>
        <text x="110" y="112" fill="#4F46E5" font-weight="800" font-size="12">Length (l)</text>
        <text x="200" y="80" fill="#0D9488" font-weight="800" font-size="12">w</text>
        <text x="35" y="60" fill="#EA580C" font-weight="800" font-size="12">h</text>
        <text x="140" y="35" text-anchor="middle" fill="#0F172A" font-weight="800" font-size="13">V = l × w × h</text>
      </svg>`
    },
    "distributive": {
      title: "Distributive Property",
      formula: "a(b + c) = ab + ac",
      vars: [
        { symbol: "a", desc: "Multiplier outside parentheses" },
        { symbol: "b, c", desc: "Terms inside parentheses" }
      ],
      svg: `<svg viewBox="0 0 280 140" style="background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; width:100%;">
        <rect x="40" y="35" width="90" height="60" fill="#0D9488" rx="6"/>
        <text x="85" y="70" text-anchor="middle" fill="#FFF" font-weight="800" font-size="13">a × b</text>
        <rect x="140" y="35" width="100" height="60" fill="#EA580C" rx="6"/>
        <text x="190" y="70" text-anchor="middle" fill="#FFF" font-weight="800" font-size="13">+ a × c</text>
        <text x="140" y="120" text-anchor="middle" fill="#0F172A" font-weight="800" font-size="13">a(b + c) = ab + ac</text>
      </svg>`
    },
    "equation_solve": {
      title: "One-Step Equation Isolation",
      formula: "x + a = b  ➜  x = b - a",
      vars: [
        { symbol: "x", desc: "Unknown variable to isolate" },
        { symbol: "a", desc: "Constant term added to x" },
        { symbol: "b", desc: "Total sum value" }
      ],
      svg: `<svg viewBox="0 0 280 140" style="background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; width:100%;">
        <rect x="30" y="40" width="70" height="40" fill="#0D9488" rx="6"/>
        <text x="65" y="65" text-anchor="middle" fill="#FFF" font-weight="800" font-size="14">x</text>
        <rect x="110" y="40" width="30" height="40" fill="#EA580C" rx="6"/>
        <text x="125" y="65" text-anchor="middle" fill="#FFF" font-weight="800" font-size="13">+a</text>
        <text x="155" y="66" text-anchor="middle" fill="#0284C7" font-weight="800" font-size="20">=</text>
        <rect x="175" y="40" width="75" height="40" fill="#0284C7" rx="6"/>
        <text x="212" y="65" text-anchor="middle" fill="#FFF" font-weight="800" font-size="14">b</text>
        <text x="140" y="115" text-anchor="middle" fill="#0F172A" font-weight="800" font-size="13">Isolate x: Subtract a from both sides</text>
      </svg>`
    }
  };

  // 3. Inject Modal Card for Formula Display
  function initFormulaModal() {
    if (document.getElementById('formula-popup-modal')) return;
    const modalHtml = `
      <div id="formula-popup-modal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:99999; display:none; align-items:center; justify-content:center;">
        <div style="background:#FFF; width:480px; max-width:92vw; border-radius:20px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.25); border:1px solid #E2E8F0; font-family:'Nunito', sans-serif;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:#F0F9FF; color:#0284C7; font-size:1.2rem; padding:4px 10px; border-radius:10px; font-weight:900;">📐</span>
              <h3 id="formula-modal-title" style="margin:0; font-size:1.25rem; font-weight:900; color:#0F172A;">Formula Reference</h3>
            </div>
            <button onclick="closeFormulaModal()" style="background:#F1F5F9; border:none; width:32px; height:32px; border-radius:50%; font-weight:800; cursor:pointer;">✕</button>
          </div>
          <div id="formula-modal-equation" style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:12px; padding:12px; text-anchor:middle; text-align:center; font-size:1.35rem; font-weight:900; color:#0284C7; margin-bottom:14px;"></div>
          <div id="formula-modal-svg" style="margin-bottom:14px;"></div>
          <div style="font-size:0.84rem; font-weight:800; color:#0F172A; margin-bottom:6px;">Variable Key:</div>
          <div id="formula-modal-vars" style="font-size:0.82rem; color:#475569; line-height:1.6; background:#F8FAFC; padding:10px 14px; border-radius:10px; margin-bottom:16px;"></div>
          <button onclick="closeFormulaModal()" style="width:100%; background:#0284C7; color:#FFF; border:none; padding:10px; border-radius:12px; font-weight:800; font-size:0.9rem; cursor:pointer;">Got it!</button>
        </div>
      </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
  }

  window.openFormulaModal = function(key) {
    initFormulaModal();
    const data = FORMULA_DB[key] || FORMULA_DB.area_rectangle;
    document.getElementById('formula-modal-title').innerText = data.title;
    document.getElementById('formula-modal-equation').innerText = data.formula;
    document.getElementById('formula-modal-svg').innerHTML = data.svg;

    const varsBox = document.getElementById('formula-modal-vars');
    varsBox.innerHTML = data.vars.map(v => `<div><strong>${v.symbol}:</strong> ${v.desc}</div>`).join('');

    const modal = document.getElementById('formula-popup-modal');
    modal.style.display = 'flex';
  };

  window.closeFormulaModal = function() {
    const modal = document.getElementById('formula-popup-modal');
    if (modal) modal.style.display = 'none';
  };

  // 4. Auto-detect formula references in page body
  window.addEventListener('DOMContentLoaded', function() {
    initFormulaModal();
  });
})();
