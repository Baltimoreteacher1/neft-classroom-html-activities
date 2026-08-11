//
// API:  attachRegenPractice(container, item, opts = {}) -> { destroy() } | null
//   item: { stem, answer, choices?, correctIndex?, visual?, difficulty? }
//   returns null (attaches nothing) when the item can't be safely regenerated.

import { mountSymbolPad, needsSymbolPad } from "../core/symbol-pad.js";
import { canRegenerate, regenerate } from "./problem-generator.js";

const STYLE_ID = "regen-practice-styles";

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .regen{--rg-teal:var(--teal,#2a9d8f);--rg-coral:var(--coral,#d9795d);--rg-navy:var(--navy,#264653);--rg-muted:var(--muted,#6b7280);
    margin-top:var(--sp-3,12px);border:1.5px dashed var(--rg-teal);border-radius:12px;padding:10px 12px;background:color-mix(in srgb,var(--rg-teal) 5%,transparent)}
  .regen-open{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .regen-open b{color:var(--rg-navy);font-size:.9rem}
  .regen-btn{font:inherit;font-size:.82rem;font-weight:700;color:var(--rg-navy);background:#fff;border:1.5px solid rgba(38,70,83,.22);border-radius:999px;padding:6px 12px;cursor:pointer}
  .regen-btn:hover{border-color:var(--rg-teal);color:var(--rg-teal)}
  .regen-btn[aria-pressed="true"]{background:var(--rg-teal);border-color:var(--rg-teal);color:#fff}
  .regen-diff{margin-left:auto;display:inline-flex;gap:4px}
  .regen-body{margin-top:10px}
  .regen-stem{font-weight:700;color:var(--rg-navy);margin:0 0 8px;font-size:1.02rem}
  .regen-choices{display:flex;flex-wrap:wrap;gap:8px}
  .regen-choice{font:inherit;text-align:left;background:#fff;border:1.5px solid rgba(38,70,83,.2);border-radius:10px;padding:8px 12px;cursor:pointer}
  .regen-choice:hover{border-color:var(--rg-teal)}
  .regen-choice.ok{border-color:var(--rg-teal);background:color-mix(in srgb,var(--rg-teal) 14%,#fff)}
  .regen-choice.no{border-color:var(--rg-coral);background:color-mix(in srgb,var(--rg-coral) 12%,#fff)}
  .regen-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .regen-input{flex:1 1 8rem;min-width:0;font:inherit;padding:8px 10px;border:1.5px solid rgba(38,70,83,.24);border-radius:10px}
  .regen-fb{margin-top:8px;font-size:.9rem;min-height:1.1em}
  .regen-fb.ok{color:var(--rg-teal);font-weight:700}
  .regen-fb.no{color:var(--rg-coral)}
  .regen-streak{font-size:.8rem;color:var(--rg-muted);font-weight:700}
`;
  document.head.appendChild(s);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Loose numeric/text equality for open-answer checking.
function matches(typed, answer) {
  const a = String(typed ?? "")
    .trim()
    .toLowerCase();
  const b = String(answer ?? "")
    .trim()
    .toLowerCase();
  if (!a) return false;
  if (a === b) return true;
  const na = Number(a.replace(/[^0-9.\-/]/g, ""));
  const nb = Number(b.replace(/[^0-9.\-/]/g, ""));
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}

export function attachRegenPractice(container, item, opts = {}) {
  try {
    if (typeof document === "undefined" || !container || !item || !canRegenerate(item)) return null;
    injectStyles();

    const root = document.createElement("div");
    root.className = "regen";
    const diffLevels = ["support", "core", "stretch"];
    let difficulty = diffLevels.includes(item.difficulty) ? item.difficulty : "core";
    let streak = 0;

    root.innerHTML =
      `<div class="regen-open"><b>${esc(opts.label || "Want more practice?")}</b>` +
      `<button type="button" class="regen-btn" data-el="go">🔄 Try another like this</button>` +
      `<span class="regen-diff" role="group" aria-label="Difficulty">` +
      `<button type="button" class="regen-btn" data-diff="support">Easier</button>` +
      `<button type="button" class="regen-btn" data-diff="stretch">Harder</button></span>` +
      `<span class="regen-streak" data-el="streak"></span></div>` +
      `<div class="regen-body" data-el="body" hidden></div>`;
    container.append(root);

    const q = (sel) => root.querySelector(sel);
    const body = q('[data-el="body"]');
    const streakEl = q('[data-el="streak"]');

    const setDiff = (d) => {
      difficulty = d;
      root
        .querySelectorAll("[data-diff]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.diff === d)),
        );
    };

    const next = () => {
      const gen = regenerate(item, { difficulty });
      if (!gen) {
        body.hidden = false;
        body.innerHTML = `<div class="regen-fb">No more variations available for this one.</div>`;
        return;
      }
      body.hidden = false;
      let done = false;
      const hasChoices = Array.isArray(gen.choices) && gen.choices.length;
      body.innerHTML =
        `<p class="regen-stem">${esc(gen.stem)}</p>` +
        (hasChoices
          ? `<div class="regen-choices">${gen.choices
              .map(
                (c, i) =>
                  `<button type="button" class="regen-choice" data-i="${i}">${esc(c)}</button>`,
              )
              .join("")}</div>`
          : `<div class="regen-row"><input type="text" class="regen-input" inputmode="text" aria-label="Your answer" placeholder="Your answer" />` +
            `<button type="button" class="regen-btn" data-el="check">Check</button></div>`) +
        `<div class="regen-fb" data-el="fb" role="status" aria-live="polite"></div>`;
      const fb = q('[data-el="fb"]');

      // Inequality answers need symbols no Chromebook keyboard has.
      const regenInput = q(".regen-input");
      if (regenInput && needsSymbolPad(gen.answer)) mountSymbolPad(regenInput, { force: true });

      const win = () => {
        done = true;
        streak += 1;
        streakEl.textContent = streak >= 2 ? `🔥 ${streak} in a row` : "";
        fb.className = "regen-fb ok";
        fb.innerHTML = `✓ Correct! <button type="button" class="regen-btn" data-el="again">Another →</button>`;
        q('[data-el="again"]').addEventListener("click", next);
      };
      const miss = () => {
        streak = 0;
        streakEl.textContent = "";
        fb.className = "regen-fb no";
        fb.textContent = "Not quite — try again.";
      };

      if (hasChoices) {
        body.querySelectorAll(".regen-choice").forEach((btn) =>
          btn.addEventListener("click", () => {
            if (done) return;
            const i = Number(btn.dataset.i);
            if (i === gen.correctIndex) {
              btn.classList.add("ok");
              win();
            } else {
              btn.classList.add("no");
              miss();
            }
          }),
        );
      } else {
        const input = q(".regen-input");
        const check = q('[data-el="check"]');
        const run = () => {
          if (done) return;
          matches(input.value, gen.answer) ? win() : miss();
        };
        check.addEventListener("click", run);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            run();
          }
        });
      }
    };

    q('[data-el="go"]').addEventListener("click", next);
    root.querySelectorAll("[data-diff]").forEach((b) =>
      b.addEventListener("click", () => {
        setDiff(/** @type {HTMLElement} */ (b).dataset.diff);
        next();
      }),
    );
    setDiff(difficulty);

    return {
      destroy() {
        root.remove();
      },
    };
  } catch (e) {
    console.warn("regen-practice: attach failed", e);
    return null;
  }
}

export default attachRegenPractice;
