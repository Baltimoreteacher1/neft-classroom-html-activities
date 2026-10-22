// Standard-algorithm multiplication (partial products), opened with the problem's own two numbers.
// The learner types every partial-product digit and the final sum; the digits to match are computed here
// from the givens when a box is checked, and nothing but empty boxes is drawn before that.
const digitsOf = (n) => String(n).split("").map(Number);
const cell = (extra) =>
  `<input type="text" class="algo-digit-input vm-cell" inputmode="numeric" maxlength="1" placeholder="?" ${extra}/>`;

/** Partial products, one per digit of the multiplier, right to left: [{ digit, shift, value }]. */
export function partialProducts(top, bottom) {
  return digitsOf(bottom)
    .reverse()
    .map((digit, shift) => ({ digit, shift, value: top * digit * 10 ** shift }));
}

export function canMultiply(a, b) {
  return (
    Number.isInteger(a) &&
    Number.isInteger(b) &&
    a >= 1 &&
    b >= 1 &&
    (a >= 10 || b >= 10) &&
    String(a).length <= 6 &&
    String(b).length <= 4
  );
}

function rowHtml(value, width, label, shift, key) {
  const text = String(value);
  const pad = width - 1 - text.length;
  const boxes = text
    .split("")
    .map((_, i) =>
      cell(`data-vm-row="${key}" data-vm-pos="${i}" aria-label="${label}, digit ${i + 1}"`),
    )
    .join("");
  return `<div class="algo-ans-row vm-row" data-vm-key="${key}">
    <span class="algo-col vm-label">${label}</span>
    ${'<span class="algo-col"></span>'.repeat(Math.max(0, pad))}${boxes}
  </div>`;
}

export function multiplyHtml(a, b) {
  const parts = partialProducts(a, b);
  const total = a * b;
  const width = Math.max(String(total).length, String(a).length, String(b).length) + 1;
  const num = (n, sign) =>
    `<div class="algo-num-row"><span class="algo-col">${sign}</span>${'<span class="algo-col"></span>'.repeat(width - 1 - String(n).length)}${String(
      n,
    )
      .split("")
      .map((d) => `<span class="algo-col">${d}</span>`)
      .join("")}</div>`;
  const place = ["ones", "tens", "hundreds", "thousands"];
  const rows = parts.map((p) => rowHtml(p.value, width, `× ${p.digit} ${place[p.shift]}`, p.shift, `p${p.shift}`)).join("");
  const sum =
    parts.length > 1
      ? `<div class="algo-divider"></div>${rowHtml(total, width, "Add", 0, "sum")}`
      : "";
  return `<div class="vm-scroll"><div class="vertical-algorithm-grid vm-grid">
    ${num(a, "")}${num(b, "×")}<div class="algo-divider"></div>${rows}${sum}
  </div></div>`;
}

/**
 * Check boxes as the learner types. `target` rows come from the givens here, not from the page.
 * onSolved fires once, with the product, when the last row is all right.
 */
export function wireMultiply(container, a, b, { onStep, onSolved } = {}) {
  const parts = partialProducts(a, b);
  const total = a * b;
  const expected = Object.fromEntries(parts.map((p) => [`p${p.shift}`, digitsOf(p.value)]));
  if (parts.length > 1) expected.sum = digitsOf(total);
  const finalKey = parts.length > 1 ? "sum" : "p0";
  const boxes = [...container.querySelectorAll(".vm-cell")];
  const rowBoxes = (key) => boxes.filter((box) => box.dataset.vmRow === key);
  boxes.forEach((box) => {
    box.addEventListener("input", () => {
      const key = box.dataset.vmRow;
      const want = String(expected[key][Number(box.dataset.vmPos)]);
      if (box.value.trim() !== want) {
        box.classList.remove("is-ok");
        return;
      }
      box.classList.add("is-ok");
      onStep?.();
      const row = rowBoxes(key);
      const prev = row[Number(box.dataset.vmPos) - 1];
      if (prev && !prev.classList.contains("is-ok")) prev.focus();
      if (rowBoxes(finalKey).every((c) => c.classList.contains("is-ok"))) onSolved?.(total);
    });
  });
}
