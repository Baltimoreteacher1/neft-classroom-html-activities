// long-division-chrome.js — the markup and the scoped stylesheet for the Long
// Division Lab.
//
// Split out of long-division-builder.js so that file stays behaviour: with two
// modes (solve and watch), a playback bar and an input-validation lane, the
// static half is ~40% of the widget and was pushing the DOM file past the
// repo's 750-line cap. Nothing here holds state — `template()` returns a string
// and `injectStyles()` writes one `<style id="ldl-styles">` once per document.
//
// House style: the `C` tokens below are the only colours the lab uses, Outfit
// for display/figures and Hanken Grotesk for prose. The site is light-only, so
// every surface names its own background rather than inheriting one — a card
// that leaves `background` unset turns black under OS dark mode and takes its
// dark-on-transparent text with it.

/** The lab's colour tokens. Nothing outside this file picks a colour. */
import { injectToolTokens } from "./tool-tokens.js";

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  good: "#0f7a4d",
  warn: "#b4451c",
};

/** @param {unknown} s */
export function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

/**
 * The whole widget's markup. `uid` scopes the label/input pairs so two labs on
 * one page keep working labels.
 * @param {string} uid
 * @param {boolean} decimal
 * @param {string[]} presets
 */
export function template(uid, decimal, presets) {
  return (
    `<div class="ldl-dmsb-banner" aria-label="Algorithm steps: Divide, Multiply, Subtract, Bring down">` +
    `<span class="ldl-dmsb-chip d"><b class="ldl-dmsb-badge">D</b> <span class="ldl-dmsb-op">÷</span> Divide</span>` +
    `<span class="ldl-dmsb-chip m"><b class="ldl-dmsb-badge">M</b> <span class="ldl-dmsb-op">×</span> Multiply</span>` +
    `<span class="ldl-dmsb-chip s"><b class="ldl-dmsb-badge">S</b> <span class="ldl-dmsb-op">−</span> Subtract</span>` +
    `<span class="ldl-dmsb-chip b"><b class="ldl-dmsb-badge">B</b> <span class="ldl-dmsb-op">↓</span> Bring down</span>` +
    `</div>` +
    `<div class="ldl-controls">` +
    `<label class="ldl-field" for="${uid}-dividend"><span>Dividend</span></label>` +
    `<input class="ldl-num" id="${uid}-dividend" type="text" inputmode="${decimal ? "decimal" : "numeric"}"/>` +
    `<span class="ldl-op">÷</span>` +
    `<label class="ldl-field" for="${uid}-divisor"><span>Divisor</span></label>` +
    `<input class="ldl-num" id="${uid}-divisor" type="text" inputmode="${decimal ? "decimal" : "numeric"}"/>` +
    `<button type="button" class="ldl-go">Set up this problem</button></div>` +
    `<div class="ldl-presets" role="group" aria-label="Quick-pick problems">` +
    presets
      .map(
        (p) =>
          `<button type="button" class="ldl-chip" data-p="${esc(p)}">${esc(p.replace("/", " ÷ "))}</button>`,
      )
      .join("") +
    `</div>` +
    `<div class="ldl-shift" hidden></div>` +
    `<div class="ldl-strip" role="group" aria-label="The four steps of the cycle"></div>` +
    `<div class="ldl-board" role="img" aria-label="Long division notation"></div>` +
    `<p class="ldl-step" aria-live="polite"></p>` +
    `<div class="ldl-play" role="group" aria-label="Playback" hidden>` +
    `<button type="button" class="ldl-back">← Back</button>` +
    `<button type="button" class="ldl-playpause" aria-pressed="false">▶ Play</button>` +
    `<button type="button" class="ldl-next">Next step →</button>` +
    `<button type="button" class="ldl-replay">↻ Replay</button>` +
    `<button type="button" class="ldl-mine">Now you try this one →</button>` +
    `<span class="ldl-count"></span></div>` +
    `<div class="ldl-entry">` +
    `<label class="ldl-alabel" for="${uid}-answer">Your answer</label>` +
    `<input class="ldl-answer" id="${uid}-answer" type="text" inputmode="numeric" autocomplete="off"/>` +
    `<button type="button" class="ldl-check">Check</button>` +
    `<button type="button" class="ldl-bring" hidden>Bring down ↓</button>` +
    `<button type="button" class="ldl-fact-toggle" title="Show multiplication facts helper">💡 Fact Helper</button></div>` +
    `<div class="ldl-fact-helper" style="margin-top:8px; padding:10px 12px; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; font-size:0.88rem; color:#166534;" hidden></div>` +
    `<div class="ldl-keypad" role="group" aria-label="Interactive Number Keypad">` +
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫", "Clear"]
      .map((k) => `<button type="button" class="ldl-key" data-key="${k}">${k}</button>`)
      .join("") +
    `</div>` +
    `<p class="ldl-feedback" aria-live="polite"></p>` +
    `<div class="ldl-result" aria-live="polite" hidden></div>`
  );
}

let injected = false;
export function injectStyles() {
  // The shared interactive-tool vocabulary — surfaces, controls, radii, focus.
  // It defers to whatever shell the tool is mounted in, so this lab looks like
  // the small-group sheet in a small-group lesson and like the whole-group
  // lesson elsewhere, without two stylesheets to keep in step.
  injectToolTokens();
  if (injected || (typeof document !== "undefined" && document.getElementById("ldl-styles"))) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "ldl-styles";
  s.textContent = `
  .ldl{max-width:680px;margin:0 auto;text-align:center;background:var(--tool-surface);border:1.5px solid var(--tool-line);border-radius:var(--tool-radius);padding:18px 20px 22px;font-family:"Hanken Grotesk",system-ui,sans-serif;color:var(--tool-ink);box-shadow:0 4px 16px rgba(18,53,91,0.06);}
  .ldl [hidden]{display:none!important;}
  .ldl-dmsb-banner{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin:0 auto 12px;padding:8px 12px;background:var(--tool-canvas);border:1px solid var(--tool-line);border-radius:var(--tool-radius-sm);max-width:max-content;}
  .ldl-dmsb-chip{display:inline-flex;align-items:center;gap:5px;font-size:.82rem;font-weight:700;color:${C.navy};}
  .ldl-dmsb-badge{display:inline-grid;place-items:center;width:1.55em;height:1.55em;border-radius:50%;background:#ef4444;color:#fff;font-size:.78rem;font-weight:800;}
  .ldl-dmsb-op{font-weight:800;color:#dc2626;}
  .ldl-controls{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin:0 auto;}
  .ldl-field{font-size:.72rem;font-weight:600;color:${C.muted};text-transform:uppercase;}
  .ldl-num{width:96px;max-width:38vw;min-height:var(--tool-control-h);padding:8px 10px;font:inherit;font-size:1.05rem;font-weight:600;text-align:center;color:var(--tool-ink);border:1px solid var(--tool-line);border-radius:var(--tool-radius-sm);background:var(--tool-surface);}
  .ldl-op{font-weight:700;color:${C.navy};font-size:1.2rem;}
  .ldl-go,.ldl-check,.ldl-bring,.ldl-again,.ldl-shiftgo,.ldl-play button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:var(--tool-control-h);padding:0 16px;font:inherit;font-size:.92rem;font-weight:600;color:var(--tool-control-ink);background:var(--tool-control-bg);border:1px solid var(--tool-control-line);border-radius:var(--tool-radius-sm);cursor:pointer;}
  .ldl-go,.ldl-check{color:var(--tool-control-active-ink);background:var(--tool-control-active-bg);border-color:var(--tool-control-active-bg);}
  .ldl-bring,.ldl-mine{color:#fff;background:#b45309;border-color:#b45309;}
  .ldl-go:hover:not(:disabled),.ldl-check:hover:not(:disabled){background:color-mix(in srgb,#000 12%,var(--tool-control-active-bg));border-color:color-mix(in srgb,#000 12%,var(--tool-control-active-bg));}
  .ldl-bring:hover:not(:disabled),.ldl-mine:hover:not(:disabled){background:#96450a;border-color:#96450a;}
  .ldl-again:hover:not(:disabled),.ldl-shiftgo:hover:not(:disabled),.ldl-play button:hover:not(:disabled){background:var(--tool-control-hover);border-color:var(--tool-accent);}
  .ldl :is(button,input):focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .ldl-presets{display:none;}
  .ldl-shift{margin:12px auto 0;max-width:520px;padding:10px 12px;background:#fff8ec;border:1px solid #f0d3a0;border-radius:var(--tool-radius-sm);font-size:.9rem;line-height:1.5;color:var(--tool-ink);text-align:center;}
  .ldl-shift-done{color:${C.good};font-weight:700;}
  .ldl-shift-new{color:${C.teal};}
  .ldl-shiftgo{margin-top:6px;display:inline-block;}
  .ldl-strip{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin:14px auto 10px;}
  .ldl-cycle{padding:5px 12px;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${C.navy};border-radius:999px;}
  .ldl-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:.85rem;font-weight:700;color:var(--tool-muted);background:var(--tool-canvas);border:1px solid var(--tool-line);border-radius:var(--tool-radius-sm);transition:background .2s ease,border-color .2s ease,color .2s ease;}
  .ldl-badge{display:inline-grid;place-items:center;width:1.45em;height:1.45em;font-size:.78rem;font-weight:800;border-radius:50%;background:#e2e8f0;color:${C.navy};}
  .ldl-op-symbol{font-weight:800;font-size:.95rem;color:${C.navy};}
  .ldl-pill-label{font-weight:600;}
  .ldl-pill.is-done{color:${C.good};border-color:#a7f3d0;background:#ecfdf5;}
  .ldl-pill.is-done .ldl-badge{background:${C.good};color:#fff;}
  .ldl-pill.is-on{color:#0f172a;background:#fef08a;border-color:#eab308;border-width:2px;font-weight:800;}
  .ldl-pill.is-on .ldl-badge{background:#dc2626;color:#fff;}
  .ldl-pill.is-on .ldl-op-symbol{color:#dc2626;}
  .ldl-loop{font-size:.82rem;font-weight:700;color:${C.teal};}
  .ldl-board{display:grid;justify-content:center;align-items:end;margin:12px auto 6px;padding:16px 22px;max-width:max-content;background:var(--tool-canvas);border:2px solid var(--tool-accent);border-radius:var(--tool-radius);overflow-x:auto;font-family:"Outfit",ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:1.55rem;font-weight:800;line-height:1.25;color:${C.navy};box-shadow:0 2px 8px rgba(29,78,216,0.06);}
  .ldl-board>span{text-align:center;}
  .ldl-board.is-waiting{opacity:.4;}
  .ldl-divisor{padding-right:.15em;text-align:right;}
  .ldl-bracket{font-size:1.6em;line-height:.72;color:${C.navy};}
  .ldl-vinculum{border-bottom:2.5px solid ${C.navy};align-self:stretch;}
  .ldl-digit{color:${C.ink};}
  .ldl-used{color:${C.muted};}
  .ldl-point{color:${C.navy};}
  .ldl-qpoint{color:${C.warn};}
  .ldl-q{color:${C.teal};}
  .ldl-fresh{animation:ldlPop .4s ease-out;}
  @keyframes ldlPop{from{transform:scale(.55);opacity:0;}to{transform:none;opacity:1;}}
  .ldl-prod{color:${C.warn};}
  .ldl-minus{position:relative;}
  .ldl-minus::before{content:"−";position:absolute;left:-.72em;color:${C.warn};}
  .ldl-rule{border-bottom:2.5px solid ${C.warn};align-self:stretch;}
  .ldl-diff{color:${C.navy};}
  .ldl-brought{color:#b45309;font-weight:800;}
  .ldl-drop{animation:ldlDrop .45s ease-out;}
  @keyframes ldlDrop{from{transform:translateY(-2.1em);opacity:0;}to{transform:none;opacity:1;}}
  .ldl-ghost{color:#b45309;opacity:.55;}
  .ldl-slot{color:${C.accent};background:#e6edfd;border-radius:6px;box-shadow:0 0 0 2px ${C.accent} inset;}
  @media (prefers-reduced-motion:reduce){.ldl-drop,.ldl-ghost,.ldl-fresh{animation:none;}}
  .ldl-step{margin:10px auto 6px;text-align:center;font-size:1.02rem;line-height:1.5;color:${C.ink};font-weight:600;}
  .ldl-stepname{color:${C.accent};font-weight:800;}
  .ldl-note{color:${C.muted};font-size:.88rem;}
  .ldl-play{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin:8px auto 4px;}
  .ldl-play button:disabled{opacity:.45;cursor:default;}
  .ldl-playpause{min-width:6.5em;}
  .ldl-count{font-size:.8rem;font-weight:700;color:var(--tool-muted);}
  .ldl-keypad{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:320px;margin:12px auto 0;padding:10px;background:var(--tool-canvas);border:1px solid var(--tool-line);border-radius:var(--tool-radius);}
  .ldl-key{min-width:44px;height:44px;padding:0 10px;font-family:"Outfit",sans-serif;font-size:1.05rem;font-weight:700;color:var(--tool-ink);background:var(--tool-surface);border:1px solid var(--tool-line);border-radius:var(--tool-radius-sm);cursor:pointer;touch-action:manipulation;}
  .ldl-key:hover{background:var(--tool-control-hover);border-color:var(--tool-accent);}
  .ldl-fact-toggle{display:inline-flex;align-items:center;gap:5px;min-height:var(--tool-control-h);padding:0 12px;font-size:.85rem;font-weight:600;color:var(--tool-control-ink);background:var(--tool-control-bg);border:1px solid var(--tool-control-line);border-radius:var(--tool-radius-sm);cursor:pointer;}
  .ldl-fact-toggle:hover{background:var(--tool-control-hover);border-color:var(--tool-accent);}
  .ldl-entry{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px;margin:10px auto;}
  .ldl-alabel{font-size:.74rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .ldl-answer{width:120px;max-width:40vw;min-height:var(--tool-control-h);padding:9px 11px;font:inherit;font-size:1.15rem;font-weight:700;text-align:center;color:var(--tool-ink);border:2px solid var(--tool-accent);border-radius:var(--tool-radius-sm);background:var(--tool-surface);}
  .ldl-feedback{min-height:1.4em;margin:10px auto 0;text-align:center;font-size:.95rem;line-height:1.5;color:${C.ink};font-weight:700;}
  .ldl-good{color:${C.good};font-weight:600;}
  .ldl-bad{color:${C.warn};font-weight:600;}
  .ldl-warn{color:#8a5a00;font-weight:600;}
  .ldl-info{color:${C.muted};font-weight:500;}
  .ldl-repeat{color:${C.teal};font-weight:700;}
  .ldl-result{margin:12px 0 0;padding:12px;background:#f2fbf7;border:1px solid #bfe3cf;border-radius:var(--tool-radius);text-align:center;}
  .ldl-final{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.3rem;color:${C.teal};}
  .ldl-words,.ldl-verify{margin:6px auto 0;max-width:520px;font-size:.92rem;line-height:1.5;color:${C.ink};}
  @media (max-width:430px){
    .ldl{padding:12px 12px 14px;}
    .ldl-board{font-size:1.2rem;padding:12px 6px 8px;}
    .ldl-go,.ldl-check,.ldl-bring,.ldl-again,.ldl-play button{padding:9px 12px;font-size:.86rem;}
    .ldl-num{width:82px;}
  }
  `;
  document.head.appendChild(s);
}
