// Beautiful math typography for lesson stems, narratives, and callouts.
// Converts plain-text patterns to accessible HTML spans.

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/** Render fractions (3/4), exponents (x^2), and multiplication (×) in text. */
export function renderMathText(text) {
  if (!text) return "";
  let s = esc(String(text));

  // Mixed numbers: 1 3/4
  s = s.replace(
    /(\d+)\s+(\d+)\/(\d+)/g,
    '$1 <span class="math-frac" role="math"><span class="math-frac-num">$2</span><span class="math-frac-den">$3</span></span>',
  );

  // Simple fractions: 3/4 (not URLs or dates)
  s = s.replace(
    /(?<![\d/])(\d+)\/(\d+)(?![\d/])/g,
    '<span class="math-frac" role="math"><span class="math-frac-num">$1</span><span class="math-frac-den">$2</span></span>',
  );

  // Exponents: x^2, 10^3, (-2)^4
  s = s.replace(
    /([a-zA-Z0-9)]+)\^(\d+)/g,
    '$1<span class="math-exp" aria-label="to the power of $2">$2</span>',
  );

  // Subscripts for chemical-style or index notation: x_1
  s = s.replace(
    /([a-zA-Z])_(\d+)/g,
    '$1<span class="math-sub">$2</span>',
  );

  // Equations with equals highlighted
  s = s.replace(/(\s=\s)/g, '<span class="math-eq"> = </span>');

  return s;
}

/** Set innerHTML on an element with math-rendered text. */
export function setMathHtml(el, text) {
  if (!el) return;
  el.innerHTML = renderMathText(text);
}
