// The stacked ("vertical") method for adding and subtracting, opened with the problem's own numbers lined up by
// place value (ones under ones, decimal points in one column). The learner types every answer digit and every
// regrouping digit; a box says right or try again and never shows its digit, except that two misses on one box
// open it so nobody is stuck (the same rule as the "Your turn" boxes in step-fill.js). The page holds only the
// givens: what each box should hold is worked out when it is checked, so nothing is in the markup to read.
// A finished board raises `vc-complete` (bubbling) with the result; `opened` is true when a miss-open supplied a
// digit, and callers copy the result into the answer field only when it is false.
import { t } from "./i18n.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const clean = (value) => String(value).replace(/[,\s]/g, "").replace(/^\+/, "");
const NUMBER = /^\d+(?:\.\d+)?$/;
const split = (x) => {
  const [whole, frac = ""] = x.split(".");
  return { whole, frac };
};

function atLeast(a, b) {
  const [x, y] = [split(a), split(b)];
  const dec = Math.max(x.frac.length, y.frac.length);
  return BigInt(x.whole + x.frac.padEnd(dec, "0")) >= BigInt(y.whole + y.frac.padEnd(dec, "0"));
}

/** { op: "+" | "-", terms: ["1573", "7036"] } for a whole-number or decimal sum / difference, else null. */
export function columnSpec(op, terms) {
  const list = terms.map(clean);
  const sign = op === "−" ? "-" : op;
  if (
    !["+", "-"].includes(sign) ||
    list.length < 2 ||
    !list.every((x) => NUMBER.test(x)) ||
    list.some((x) => x.length > 14)
  )
    return null;
  if (sign === "-" && (list.length !== 2 || !atLeast(list[0], list[1]))) return null;
  return { op: sign, terms: list };
}

// ---- layout and arithmetic on digit strings (no floating point) ----
function layout(spec) {
  const parts = spec.terms.map(split);
  const intLen = Math.max(...parts.map((p) => p.whole.length));
  const decLen = Math.max(...parts.map((p) => p.frac.length));
  const rows = parts.map((p) =>
    (p.whole.padStart(intLen, " ") + p.frac.padEnd(decLen, " ")).split(""),
  );
  return { rows, intLen, decLen, width: intLen + decLen };
}

/** Can the leading column carry into a new place? True when the givens allow it (leading digits plus the largest carry in). */
const mayCarryOut = (rows) =>
  rows.reduce((sum, row) => sum + (row[0] === " " ? 0 : Number(row[0])), 0) + rows.length - 1 >= 10;

/** What each box should hold. Worked out from the givens when a box is checked, never put in the page. */
export function expectations(spec) {
  const { rows, intLen, decLen, width } = layout(spec);
  const digit = (row, c) => (row[c] === " " ? 0 : Number(row[c]));
  const carryInto = Array(width).fill(0); // carried INTO column c from column c + 1
  const result = Array(width).fill(0);
  const regroup = Array(width).fill("");
  let lead = 0;
  if (spec.op === "+") {
    let carry = 0;
    for (let c = width - 1; c >= 0; c -= 1) {
      const sum = rows.reduce((s, row) => s + digit(row, c), 0) + carry;
      result[c] = sum % 10;
      carry = Math.floor(sum / 10);
      if (c > 0) carryInto[c - 1] = carry;
      else lead = carry;
    }
  } else {
    let lent = 0;
    for (let c = width - 1; c >= 0; c -= 1) {
      const effective = digit(rows[0], c) - lent;
      const bottom = digit(rows[1], c);
      const borrow = effective < bottom;
      const top = borrow ? effective + 10 : effective;
      result[c] = top - bottom;
      regroup[c] = top !== digit(rows[0], c) ? String(top) : "";
      lent = borrow ? 1 : 0;
    }
  }
  // Leading zeros of the answer are not written (but the ones place always is).
  const blankLead = result.map(
    (_, c) => !lead && c < intLen - 1 && result.slice(0, c + 1).every((d) => d === 0),
  );
  return { rows, intLen, decLen, width, carryInto, result, regroup, lead, blankLead };
}

// ---- markup ----
const col = (inner = "", cls = "") => `<span class="algo-col vc-col ${cls}">${inner}</span>`;
const box = (kind, c, label) =>
  `<input type="text" class="vc-cell vc-${kind}" data-vc-kind="${kind}" data-vc-col="${c}" inputmode="numeric" autocomplete="off" maxlength="${kind === "regroup" ? 2 : 1}" aria-label="${esc(label)}"/>`;

export function verticalHtml(spec, { caption = "" } = {}) {
  const { rows, intLen, decLen, width } = layout(spec);
  const lead = spec.op === "+" && mayCarryOut(rows);
  const across = (build) => {
    let out = col() + (lead ? col(build(-1)) : "");
    for (let c = 0; c < width; c += 1)
      out += (c === intLen && decLen ? col(".", "vc-point") : "") + col(build(c));
    return out;
  };
  const above = (c) =>
    c < 0
      ? ""
      : spec.op === "+"
        ? c === width - 1
          ? ""
          : box("carry", c, t("Regrouping box above column {n}", { n: c + 1 }))
        : box("regroup", c, t("Regrouping box above column {n}", { n: c + 1 }));
  const numbers = rows
    .map((row, i) => {
      const sign = i === rows.length - 1 ? (spec.op === "+" ? "+" : "−") : "";
      return `<div class="algo-num-row vc-row">${col(sign)}${lead ? col() : ""}${(() => {
        let out = "";
        for (let c = 0; c < width; c += 1)
          out +=
            (c === intLen && decLen ? col(".", "vc-point") : "") +
            col(row[c] === " " ? "" : row[c]);
        return out;
      })()}</div>`;
    })
    .join("");
  const answer = across((c) =>
    box(
      "result",
      c,
      c < 0 ? t("New leading place of the answer") : t("Answer digit, column {n}", { n: c + 1 }),
    ),
  );
  return `<div class="vc" data-vc="${esc(JSON.stringify(spec))}">
    ${caption ? `<p class="tool-note">${esc(caption)}</p>` : ""}
    <div class="vc-scroll"><div class="vertical-algorithm-grid vc-grid">
      <div class="algo-carry-row vc-row">${across(above)}</div>${numbers}<div class="algo-divider"></div><div class="algo-ans-row vc-row">${answer}</div>
    </div></div>
    <p class="vc-note tool-note" role="status" aria-live="polite">${esc(spec.op === "+" ? t("Add one column at a time from the right. Write a regrouped ten in the box above the next column.") : t("Subtract one column at a time from the right. Regroup first when the top digit is too small."))}</p>
  </div>`;
}

// ---- checking: one delegated listener, so every place that draws a board gets it ----
const cache = new WeakMap();
const want = (root) => {
  if (!cache.has(root)) cache.set(root, expectations(JSON.parse(root.dataset.vc)));
  return cache.get(root);
};

/** What one box should hold ("" = leave it empty; a typed 0 is fine too). */
export function holds(root, cell) {
  const w = want(root);
  const c = Number(cell.dataset.vcCol);
  const kind = cell.dataset.vcKind;
  if (kind === "result")
    return c < 0 ? (w.lead ? String(w.lead) : "") : w.blankLead[c] ? "" : String(w.result[c]);
  if (kind === "regroup") return w.regroup[c];
  return w.carryInto[c] ? String(w.carryInto[c]) : "";
}

const find = (root, kind, c) => root.querySelector(`.vc-${kind}[data-vc-col="${c}"]`);
const say = (root, text) => {
  const note = root.querySelector(".vc-note");
  if (note) note.textContent = text;
};

function resultText(root) {
  const w = want(root);
  const digits =
    (w.lead ? String(w.lead) : "") + w.result.filter((_, c) => !w.blankLead[c]).join("");
  if (!w.decLen) return digits;
  const padded = digits.padStart(w.decLen + 1, "0");
  const text = `${padded.slice(0, -w.decLen)}.${padded.slice(-w.decLen)}`;
  return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function finish(root) {
  const needed = [...root.querySelectorAll(".vc-result")].filter(
    (cell) => holds(root, cell) !== "",
  );
  if (!needed.every((cell) => cell.classList.contains("ok") || cell.classList.contains("shown")))
    return;
  const opened = Boolean(root.dataset.vcOpened);
  say(
    root,
    opened
      ? t("That is every column. Type the answer in the answer box.")
      : t("Every column is right. Your answer has been copied to the answer box."),
  );
  root.dispatchEvent(
    new (root.ownerDocument.defaultView?.CustomEvent || CustomEvent)("vc-complete", { bubbles: true, detail: { value: resultText(root), opened } }),
  );
}

export function checkVerticalCell(cell) {
  const root = cell.closest(".vc");
  if (!root || cell.readOnly) return;
  const typed = cell.value.trim();
  if (!typed) return;
  const right = holds(root, cell);
  const kind = cell.dataset.vcKind;
  const c = Number(cell.dataset.vcCol);
  if (typed === right || (right === "" && typed === "0")) {
    cell.classList.add("ok");
    cell.classList.remove("no");
    cell.readOnly = true;
    say(root, t("Right."));
    (find(root, kind, c - 1) || (kind === "result" ? null : find(root, "result", c)))?.focus();
    finish(root);
    return;
  }
  if (typed.length < Math.max(1, right.length)) return;
  cell.classList.add("no");
  // A miss is help from the board, so the page can stop counting this answer as independent.
  root.dispatchEvent(new (root.ownerDocument.defaultView?.CustomEvent || CustomEvent)("vc-help", { bubbles: true }));
  const misses = Number(cell.dataset.vcMiss || 0) + 1;
  cell.dataset.vcMiss = String(misses);
  if (misses < 2) {
    say(root, t("Not quite. Look at the column and try again."));
    cell.select();
    return;
  }
  // Two misses open the box so nobody is stuck; a box that should stay empty is just cleared.
  cell.value = right;
  cell.classList.remove("no");
  cell.classList.add(right === "" ? "ok" : "shown");
  cell.readOnly = true;
  if (right !== "") root.dataset.vcOpened = "1";
  say(root, t("That box is filled in for you. Keep going with the next one."));
  finish(root);
}

if (typeof document !== "undefined" && !globalThis.__fluencyVerticalWired) {
  globalThis.__fluencyVerticalWired = true;
  document.addEventListener("input", (event) => {
    if (event.target.matches?.("input.vc-cell")) checkVerticalCell(event.target);
  });
}
