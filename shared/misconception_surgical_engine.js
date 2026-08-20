/**
 * EduWonderLab Enterprise Live Misconception Surgical Cards Engine
 * Architecture: Intercepts conceptual errors in real-time and renders 30-sec visual "Trap vs Truth" inline SVGs.
 * Global Rules Compliance: Programmatic inline SVG with style="background:white", explicit dims, touch/drag support, retry triggers.
 */

(function (global) {
  "use strict";

  const MisconceptionCatalog = {
    // 1. Fraction Division / Multiplication Traps (6.NS.A.1)
    FRACTION_DIV_INVERT: {
      title: "Inversion Trap: Dividing Fractions",
      standard: "6.NS.A.1",
      trapDesc: "Divided straight across without multiplying by the reciprocal.",
      truthDesc: "Multiply by the reciprocal (Keep-Change-Flip): a/b ÷ c/d = a/b × d/c.",
      svg: `<svg width="360" height="90" viewBox="0 0 360 90" style="background:white" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="160" height="70" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>
        <text x="90" y="32" font-size="11" font-weight="700" fill="#b91c1c" text-anchor="middle">❌ Common Trap</text>
        <text x="90" y="58" font-size="13" font-weight="700" fill="#991b1b" text-anchor="middle">3/4 ÷ 1/2 &ne; 3/2</text>
        <rect x="190" y="10" width="160" height="70" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
        <text x="270" y="32" font-size="11" font-weight="700" fill="#166534" text-anchor="middle">✅ Surgical Fix</text>
        <text x="270" y="58" font-size="13" font-weight="700" fill="#14532d" text-anchor="middle">3/4 &times; 2/1 = 6/4 = 1.5</text>
      </svg>`,
    },

    // 2. Integer Sign & Distance Trap (6.NS.C.5, 6.NS.C.7)
    INTEGER_SIGN_DISTANCE: {
      title: "Absolute Distance vs Negative Value",
      standard: "6.NS.C.7",
      trapDesc: "Treated distance as negative or forgot that absolute value is always positive.",
      truthDesc: "Distance between elevations is always |a| + |b| when crossing sea level (0).",
      svg: `<svg width="360" height="90" viewBox="0 0 360 90" style="background:white" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="50" x2="340" y2="50" stroke="#0f172a" stroke-width="2"/>
        <line x1="180" y1="20" x2="180" y2="80" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="180" y="15" font-size="10" font-weight="700" fill="#0284c7" text-anchor="middle">Sea Level (0)</text>
        <circle cx="80" cy="50" r="5" fill="#ef4444"/>
        <text x="80" y="70" font-size="11" font-weight="700" fill="#b91c1c" text-anchor="middle">-50 ft</text>
        <circle cx="280" cy="50" r="5" fill="#16a34a"/>
        <text x="280" y="70" font-size="11" font-weight="700" fill="#166534" text-anchor="middle">+50 ft</text>
        <text x="180" y="85" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">Total Distance = |-50| + |50| = 100 ft</text>
      </svg>`,
    },

    // 3. Distributive Property Incomplete Multiplication (6.EE.A.3)
    DISTRIBUTIVE_INCOMPLETE: {
      title: "Distributive Property: Incomplete Term",
      standard: "6.EE.A.3",
      trapDesc: "Multiplied the outer factor by the first term only: 4(x + 3) = 4x + 3.",
      truthDesc:
        "The outer factor distributes to EVERY term inside parentheses: 4(x + 3) = 4x + 12.",
      svg: `<svg width="360" height="90" viewBox="0 0 360 90" style="background:white" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="150" height="50" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="95" y="50" font-size="13" font-weight="700" fill="#92400e" text-anchor="middle">4 &times; x = 4x</text>
        <rect x="170" y="20" width="150" height="50" fill="#e0e7ff" stroke="#4f46e5" stroke-width="1.5"/>
        <text x="245" y="50" font-size="13" font-weight="700" fill="#3730a3" text-anchor="middle">4 &times; 3 = 12</text>
        <text x="180" y="84" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">Area Model: 4(x + 3) = 4x + 12</text>
      </svg>`,
    },

    // 4. Order of Operations PEMDAS Traps (6.EE.A.1)
    PEMDAS_LEFT_TO_RIGHT: {
      title: "Order of Operations: Multiplication/Division Precedence",
      standard: "6.EE.A.1",
      trapDesc: "Performed addition before multiplication: 10 + 2 × 5 = 12 × 5 = 60.",
      truthDesc:
        "Multiplication & Division precede Addition & Subtraction: 10 + (2 × 5) = 10 + 10 = 20.",
      svg: `<svg width="360" height="90" viewBox="0 0 360 90" style="background:white" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="15" width="160" height="60" rx="6" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>
        <text x="90" y="38" font-size="11" font-weight="700" fill="#b91c1c" text-anchor="middle">❌ Added First: 60</text>
        <text x="90" y="58" font-size="10" fill="#991b1b" text-anchor="middle">(10 + 2) &times; 5</text>
        <rect x="190" y="15" width="160" height="60" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
        <text x="270" y="38" font-size="11" font-weight="700" fill="#166534" text-anchor="middle">✅ Multiplied First: 20</text>
        <text x="270" y="58" font-size="10" fill="#14532d" text-anchor="middle">10 + (2 &times; 5)</text>
      </svg>`,
    },
  };

  class MisconceptionEngine {
    constructor() {
      this.activeCard = null;
      this.initOverlay();
    }

    initOverlay() {
      if (document.getElementById("ew-surgical-drawer")) return;

      const drawer = document.createElement("div");
      drawer.id = "ew-surgical-drawer";
      drawer.style.cssText = `
        position: fixed;
        bottom: -360px;
        right: 24px;
        width: 400px;
        max-width: calc(100vw - 48px);
        background: #ffffff;
        border: 2px solid #0284c7;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(2, 132, 199, 0.25);
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      `;
      document.body.appendChild(drawer);
      this.drawer = drawer;
    }

    trigger(misconceptionKey, onRetryCallback) {
      const data =
        MisconceptionCatalog[misconceptionKey] || MisconceptionCatalog["FRACTION_DIV_INVERT"];

      this.drawer.innerHTML = `
        <div style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">💡</span>
            <div>
              <strong style="font-size: 13px; display: block;">30-Second Surgical Fix</strong>
              <span style="font-size: 11px; opacity: 0.85;">${data.standard} &bull; ${data.title}</span>
            </div>
          </div>
          <button id="ew-card-close" style="background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer; line-height: 1;">&times;</button>
        </div>
        <div style="padding: 16px; background: #ffffff;">
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #334155; line-height: 1.5;">
            <strong>Misconception Detected:</strong> ${data.trapDesc}
          </p>
          <div style="margin: 8px auto; text-align: center;">
            ${data.svg}
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; margin-top: 10px; font-size: 12px; color: #166534; line-height: 1.4;">
            <strong>Key Strategy:</strong> ${data.truthDesc}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 14px;">
            <button id="ew-card-retry" style="flex: 1; background: #0284c7; color: #fff; border: none; border-radius: 8px; padding: 10px; font-weight: 800; font-size: 13px; cursor: pointer;">
              Retry with New Strategy 🚀
            </button>
          </div>
        </div>
      `;

      // Slide In
      this.drawer.style.bottom = "24px";

      this.drawer.querySelector("#ew-card-close").addEventListener("click", () => {
        this.dismiss();
      });

      this.drawer.querySelector("#ew-card-retry").addEventListener("click", () => {
        this.dismiss();
        if (typeof onRetryCallback === "function") onRetryCallback();
      });
    }

    dismiss() {
      if (this.drawer) {
        this.drawer.style.bottom = "-360px";
      }
    }
  }

  const engineInstance = new MisconceptionEngine();
  global.EWMisconceptionEngine = engineInstance;
  global.EWMisconceptionCatalog = MisconceptionCatalog;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { MisconceptionEngine, MisconceptionCatalog, engineInstance };
  }
})(typeof window !== "undefined" ? window : this);
