/* Math Workbench — math-aware typing for Text objects.
 *
 * While typing: 2^3 -> 2³, x^2 -> x², sqrt(9) -> √(9), <= -> ≤, >= -> ≥,
 * != -> ≠, +- -> ±, pi -> π, 90 deg -> 90°. A Math menu adds fractions, powers,
 * roots and symbols. Pasted ASCII-math / LaTeX-lite (\frac{1}{2}, \sqrt{x},
 * x^{2}, \times, \le ...) is converted to the same plain-text symbols, so the
 * text stays ordinary text: it saves, prints and reads aloud like any other.
 * The existing Fraction and Long-division objects are not touched.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WBMathText = api;
  if (typeof document !== "undefined" && root.MWB) api.install(root.MWB);
})(typeof window !== "undefined" ? window : globalThis, () => {
  "use strict";

  const SUP = {
    0: "⁰",
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
    6: "⁶",
    7: "⁷",
    8: "⁸",
    9: "⁹",
    "-": "⁻",
    "+": "⁺",
    n: "ⁿ",
  };
  const SUB = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" };
  const VULGAR = {
    "1/2": "½",
    "1/3": "⅓",
    "2/3": "⅔",
    "1/4": "¼",
    "3/4": "¾",
    "1/5": "⅕",
    "2/5": "⅖",
    "3/5": "⅗",
    "4/5": "⅘",
    "1/6": "⅙",
    "5/6": "⅚",
    "1/8": "⅛",
    "3/8": "⅜",
    "5/8": "⅝",
    "7/8": "⅞",
  };
  const map = (s, table) => [...s].map((c) => table[c] || c).join("");

  /** "3/4" -> ¾; "7/12" -> ⁷⁄₁₂ */
  function fraction(n, d) {
    return VULGAR[`${n}/${d}`] || `${map(n, SUP)}⁄${map(d, SUB)}`;
  }

  /** Symbols that are safe to convert as soon as they are typed. */
  const LIVE = [
    [/<=/g, "≤"],
    [/>=/g, "≥"],
    [/!=/g, "≠"],
    [/\+-/g, "±"],
    [/->/g, "→"],
  ];

  /**
   * Convert ASCII-math to symbols. In live mode (final = false) a pattern is only
   * converted once something after it ends it, so typing 2^10 is not cut at 2^1.
   * `latex` adds the LaTeX-lite commands used for pasted text.
   */
  function convert(text, opts) {
    const final = !!(opts && opts.final);
    const latex = !!(opts && opts.latex);
    let s = String(text);
    if (latex) {
      for (let i = 0; i < 4; i++)
        s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_, a, b) =>
          /^\d+$/.test(a) && /^\d+$/.test(b) ? fraction(a, b) : `(${a})⁄(${b})`,
        );
      s = s
        .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
        .replace(/\\(?:times)\b/g, "×")
        .replace(/\\(?:div)\b/g, "÷")
        .replace(/\\(?:cdot)\b/g, "·")
        .replace(/\\(?:leq?)\b/g, "≤")
        .replace(/\\(?:geq?)\b/g, "≥")
        .replace(/\\(?:neq?)\b/g, "≠")
        .replace(/\\(?:pm)\b/g, "±")
        .replace(/\\pi\b/g, "π")
        .replace(/\\theta\b/g, "θ")
        .replace(/\\(?:degree|circ)\b/g, "°")
        .replace(/\\%/g, "%")
        .replace(/\^\{([^{}]*)\}/g, (_, e) => map(e, SUP))
        .replace(/_\{(\d+)\}/g, (_, e) => map(e, SUB))
        .replace(/\$/g, "");
    }
    for (const [re, to] of LIVE) s = s.replace(re, to);
    // exponents: ^2, ^10, ^-1, ^n
    s = s.replace(/\^(-?\d+|n)(?=([^\d]|$))/g, (m, e, _t, off, whole) => {
      const end = off + m.length;
      if (!final && end >= whole.length) return m; // still typing the exponent
      return map(e, SUP);
    });
    // roots: sqrt(...) and sqrt 9
    s = s.replace(/\bsqrt\s*\(/g, "√(").replace(/\bsqrt\s+(\d+)/g, "√$1");
    // words that are symbols, only once followed by a space or punctuation
    const term = final ? "(?=[^A-Za-z]|$)" : "(?=[^A-Za-z])";
    s = s
      .replace(new RegExp(`\\bpi${term}`, "g"), "π")
      .replace(new RegExp(`\\btheta${term}`, "g"), "θ");
    s = s.replace(new RegExp(`(\\d)\\s?deg${term}`, "g"), "$1°");
    return s;
  }

  /** Turn "a/b" fractions in selected text into stacked-looking fractions. */
  function fractionize(text) {
    return String(text).replace(/(\d+)\s*\/\s*(\d+)/g, (_, n, d) => fraction(n, d));
  }

  /** Convert around the caret; returns the new text and caret position. */
  function liveEdit(text, caret) {
    const before = convert(text.slice(0, caret));
    const after = convert(text.slice(caret), { final: true });
    return { text: before + after, caret: before.length };
  }

  /* ---------------- DOM wiring ---------------- */
  function install(MWB) {
    const t = MWB.t;
    const { h } = MWB;
    const inText = (n) => n && n.classList && n.classList.contains("textobj");

    document.addEventListener("input", (e) => {
      const node = e.target;
      if (!inText(node) || e.isComposing) return;
      if (e.inputType === "insertFromPaste") return; // paste handler already converted it
      const sel = window.getSelection();
      if (
        !sel ||
        !sel.rangeCount ||
        sel.anchorNode !== node.firstChild ||
        node.childNodes.length !== 1
      )
        return;
      const caret = sel.anchorOffset;
      const out = liveEdit(node.textContent, caret);
      if (out.text === node.textContent) return;
      node.textContent = out.text;
      const range = document.createRange();
      range.setStart(node.firstChild, Math.min(out.caret, node.firstChild.length));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      node.dispatchEvent(new Event("input", { bubbles: true })); // let the engine save the change
    });
    document.addEventListener("focusout", (e) => {
      const node = e.target;
      if (!inText(node)) return;
      const next = convert(node.textContent, { final: true });
      if (next !== node.textContent) {
        node.textContent = next;
        node.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    document.addEventListener("paste", (e) => {
      const node = e.target;
      if (!inText(node)) return;
      const raw = e.clipboardData && e.clipboardData.getData("text/plain");
      if (!raw) return;
      e.preventDefault();
      document.execCommand("insertText", false, convert(raw, { final: true, latex: true }));
    });

    // The Math menu on a Text object's toolbar
    MWB.on("extendMiniTools", (o, mk, wrap) => {
      if (o.type !== "text") return;
      const menu = h("div", {
        class: "wbx wbx-mathmenu",
        hidden: true,
        role: "group",
        "aria-label": t("Math symbols", "Símbolos matemáticos"),
      });
      const insert = (str) => {
        const node = document.querySelector(`#overlay [data-id="${o.id}"] .textobj`);
        if (!node) return;
        node.focus();
        document.execCommand("insertText", false, str);
        node.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const items = [
        [
          "a⁄b",
          t("Make the selected a/b a fraction", "Convertir a/b seleccionado en fracción"),
          () => {
            const picked = String(window.getSelection());
            insert(picked && /\d+\s*\/\s*\d+/.test(picked) ? fractionize(picked) : "( )⁄( )");
          },
        ],
        ["x²", t("Square sign", "Signo de cuadrado"), () => insert("²")],
        [
          "xⁿ",
          t("Power: type ^ then the exponent", "Potencia: escribe ^ y el exponente"),
          () => insert("^"),
        ],
        ["√", t("Square root", "Raíz cuadrada"), () => insert("√()")],
        ["π", "pi", () => insert("π")],
        ["≤", t("Less than or equal to", "Menor o igual que"), () => insert("≤")],
        ["≥", t("Greater than or equal to", "Mayor o igual que"), () => insert("≥")],
        ["≠", t("Not equal to", "No es igual a"), () => insert("≠")],
        ["±", t("Plus or minus", "Más o menos"), () => insert("±")],
        ["°", t("Degrees", "Grados"), () => insert("°")],
        ["×", t("Times", "Por"), () => insert("×")],
        ["÷", t("Divided by", "Dividido entre"), () => insert("÷")],
      ];
      for (const [label, aria, fn] of items) {
        const b = MWB.btn(label, aria, fn);
        b.addEventListener("pointerdown", (e) => e.preventDefault()); // keep the caret in the text box
        menu.appendChild(b);
      }
      const open = mk(
        "Σ",
        t("Math symbols and fractions", "Símbolos matemáticos y fracciones"),
        "wbx-mathbtn",
        () => {
          menu.hidden = !menu.hidden;
        },
      );
      open.addEventListener("pointerdown", (e) => e.preventDefault());
      wrap.appendChild(menu);
    });
  }

  return { convert, fraction, fractionize, liveEdit, install };
});
