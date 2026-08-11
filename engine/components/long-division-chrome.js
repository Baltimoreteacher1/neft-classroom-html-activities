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
 * @param {"solve"|"watch"} mode Which mode starts selected.
 */
export function template(uid, decimal, presets, mode) {
  const pressed = (m) => (m === mode ? "true" : "false");
  const on = (m) => (m === mode ? " is-on" : "");
  return (
    `<div class="ldl-title">Long Division Lab</div>` +
    `<p class="ldl-sub">Follow the standard algorithm: <b>Divide → Multiply → Subtract → Bring down (DMSB)</b> until every digit is divided.</p>` +
    `<div class="ldl-dmsb-banner" aria-label="Algorithm steps: Divide, Multiply, Subtract, Bring down">` +
    `<span class="ldl-dmsb-chip d"><b class="ldl-dmsb-badge">D</b> <span class="ldl-dmsb-op">÷</span> Divide</span>` +
    `<span class="ldl-dmsb-chip m"><b class="ldl-dmsb-badge">M</b> <span class="ldl-dmsb-op">×</span> Multiply</span>` +
    `<span class="ldl-dmsb-chip s"><b class="ldl-dmsb-badge">S</b> <span class="ldl-dmsb-op">−</span> Subtract</span>` +
    `<span class="ldl-dmsb-chip b"><b class="ldl-dmsb-badge">B</b> <span class="ldl-dmsb-op">↓</span> Bring down</span>` +
    `</div>` +
    `<div class="ldl-modes" role="group" aria-label="How do you want to use the lab?">` +
    `<button type="button" class="ldl-mode${on("solve")}" data-mode="solve" aria-pressed="${pressed("solve")}">✏️ I'll solve it</button>` +
    `<button type="button" class="ldl-mode${on("watch")}" data-mode="watch" aria-pressed="${pressed("watch")}">👀 Watch it solved</button>` +
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
    `<button type="button" class="ldl-fact-toggle" title="Show multiplication facts helper" style="margin-left:auto; padding:6px 12px; font-size:0.82rem; font-weight:800; color:#0d7a76; border:1.5px solid #0d7a76; border-radius:8px; background:#f0fdf4; cursor:pointer;">💡 Fact Helper</button></div>` +
    `<div class="ldl-fact-helper" style="margin-top:8px; padding:10px 12px; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; font-size:0.88rem; color:#166534;" hidden></div>` +
    `<div class="ldl-keypad" role="group" aria-label="Interactive Number Keypad" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; padding:10px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px; justify-content:center;">` +
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫", "Clear"]
      .map(
        (k) =>
          `<button type="button" class="ldl-key" data-key="${k}" style="min-width:38px; height:38px; padding:0 8px; font-family:'Outfit',sans-serif; font-size:1.05rem; font-weight:800; color:#1e293b; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.04); cursor:pointer; touch-action:manipulation;">${k}</button>`,
      )
      .join("") +
    `</div>` +
    `<p class="ldl-feedback" aria-live="polite"></p>` +
    `<div class="ldl-result" aria-live="polite" hidden></div>`
  );
}

let injected = false;
export function injectStyles() {
  if (injected || (typeof document !== "undefined" && document.getElementById("ldl-styles"))) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "ldl-styles";
  s.textContent = `
  .ldl{max-width:640px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .ldl [hidden]{display:none!important;}
  .ldl-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .ldl-sub{margin:4px 0 8px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .ldl-dmsb-banner{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;padding:8px 12px;background:#f8fafc;border:1px solid ${C.line};border-radius:12px;}
  .ldl-dmsb-chip{display:inline-flex;align-items:center;gap:5px;font-size:.82rem;font-weight:800;color:${C.navy};}
  .ldl-dmsb-badge{display:inline-grid;place-items:center;width:1.55em;height:1.55em;border-radius:50%;background:#ef4444;color:#fff;font-size:.78rem;font-weight:900;}
  .ldl-dmsb-op{font-weight:900;color:#dc2626;}
  .ldl-modes{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;}
  .ldl-mode{padding:9px 15px;font:inherit;font-size:.92rem;font-weight:800;color:${C.navy};background:#f2f6fb;border:2px solid ${C.line};border-radius:999px;cursor:pointer;}
  .ldl-mode:hover{background:#e6eefb;border-color:${C.accent};}
  .ldl-mode.is-on{color:#fff;background:${C.accent};border-color:${C.accent};}
  .ldl-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
  .ldl-field{font-size:.72rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .ldl-num{width:96px;max-width:38vw;padding:8px 10px;font:inherit;font-size:1.05rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .ldl-op{font-weight:800;color:${C.navy};font-size:1.2rem;}
  .ldl-go,.ldl-check,.ldl-bring,.ldl-again,.ldl-shiftgo,.ldl-play button{padding:9px 16px;font:inherit;font-size:.92rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .ldl-bring{background:linear-gradient(135deg,#b45309,#d97706);}
  .ldl-go:hover,.ldl-check:hover,.ldl-bring:hover,.ldl-again:hover,.ldl-shiftgo:hover,.ldl-play button:hover:not(:disabled){filter:brightness(1.08);}
  .ldl :is(button,input):focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .ldl-presets{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;}
  .ldl-chip{padding:5px 12px;font:inherit;font-size:.88rem;font-weight:700;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .ldl-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .ldl-shift{margin:12px 0 0;padding:10px 12px;background:#fff8ec;border:1.5px solid #f0d3a0;border-radius:12px;font-size:.9rem;line-height:1.5;color:${C.ink};}
  .ldl-shift-done{color:${C.good};font-weight:800;}
  .ldl-shift-new{color:${C.teal};}
  .ldl-shiftgo{margin-top:6px;display:inline-block;}
  .ldl-strip{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:14px 0 10px;}
  .ldl-cycle{padding:5px 12px;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${C.navy};border-radius:999px;}
  .ldl-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:.85rem;font-weight:800;color:${C.muted};background:#f8fafc;border:2px solid ${C.line};border-radius:12px;transition:all 0.2s ease;}
  .ldl-badge{display:inline-grid;place-items:center;width:1.45em;height:1.45em;font-size:.78rem;font-weight:900;border-radius:50%;background:#e2e8f0;color:${C.navy};}
  .ldl-op-symbol{font-weight:900;font-size:.95rem;color:${C.navy};}
  .ldl-pill-label{font-weight:700;}
  .ldl-pill.is-done{color:${C.good};border-color:#a7f3d0;background:#ecfdf5;}
  .ldl-pill.is-done .ldl-badge{background:${C.good};color:#fff;}
  .ldl-pill.is-on{color:#0f172a;background:#fef08a;border-color:#eab308;box-shadow:0 0 0 3px rgba(234,179,8,.3),0 4px 12px rgba(0,0,0,.08);transform:translateY(-1px);}
  .ldl-pill.is-on .ldl-badge{background:#dc2626;color:#fff;}
  .ldl-pill.is-on .ldl-op-symbol{color:#dc2626;}
  .ldl-loop{font-size:.82rem;font-weight:800;color:${C.teal};margin-left:auto;}
  .ldl-board{display:grid;justify-content:center;align-items:end;margin:10px 0 4px;padding:14px 10px 10px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;overflow-x:auto;font-family:"Outfit",ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:1.5rem;font-weight:800;line-height:1.25;color:${C.navy};}
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
  .ldl-brought{color:#b45309;font-weight:900;}
  .ldl-drop{animation:ldlDrop .45s ease-out;}
  @keyframes ldlDrop{from{transform:translateY(-2.1em);opacity:0;}to{transform:none;opacity:1;}}
  .ldl-ghost{color:#b45309;opacity:.55;animation:ldlPulse 1.1s ease-in-out infinite;}
  @keyframes ldlPulse{0%,100%{opacity:.35;transform:translateY(-.15em);}50%{opacity:.9;transform:translateY(.15em);}}
  .ldl-slot{color:${C.accent};background:#e6edfd;border-radius:6px;box-shadow:0 0 0 2px ${C.accent} inset;}
  @media (prefers-reduced-motion:reduce){.ldl-drop,.ldl-ghost,.ldl-fresh{animation:none;}}
  .ldl-step{margin:8px 0 6px;font-size:.98rem;line-height:1.5;color:${C.ink};}
  .ldl-stepname{color:${C.accent};}
  .ldl-note{color:${C.muted};font-size:.86rem;}
  .ldl-play{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 2px;}
  .ldl-play button:disabled{opacity:.45;cursor:default;}
  .ldl-playpause{min-width:6.5em;}
  .ldl-mine{background:linear-gradient(135deg,#b45309,#d97706)!important;}
  .ldl-count{font-size:.8rem;font-weight:800;color:${C.muted};}
  .ldl-entry{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
  .ldl-alabel{font-size:.72rem;font-weight:800;color:${C.muted};text-transform:uppercase;}
  .ldl-answer{width:120px;max-width:40vw;padding:9px 11px;font:inherit;font-size:1.15rem;font-weight:800;color:${C.ink};border:2px solid ${C.accent};border-radius:10px;background:#fff;}
  .ldl-feedback{min-height:1.4em;margin:8px 0 0;font-size:.92rem;line-height:1.5;color:${C.ink};}
  .ldl-good{color:${C.good};font-weight:700;}
  .ldl-bad{color:${C.warn};font-weight:700;}
  .ldl-warn{color:#8a5a00;font-weight:700;}
  .ldl-info{color:${C.muted};font-weight:600;}
  .ldl-repeat{color:${C.teal};font-weight:800;}
  .ldl-result{margin:12px 0 0;padding:12px;background:#f2fbf7;border:1.5px solid #bfe3cf;border-radius:14px;text-align:center;}
  .ldl-final{font-family:"Outfit",system-ui,sans-serif;font-weight:900;font-size:1.3rem;color:${C.teal};}
  .ldl-words,.ldl-verify{margin:6px auto 0;max-width:520px;font-size:.92rem;line-height:1.5;color:${C.ink};}
  .ldl-again{margin-top:10px;}
  @media (max-width:430px){
    .ldl{padding:12px 12px 14px;}
    .ldl-board{font-size:1.2rem;padding:12px 6px 8px;}
    .ldl-go,.ldl-check,.ldl-bring,.ldl-again,.ldl-play button{padding:9px 12px;font-size:.86rem;}
    .ldl-num{width:82px;}
  }
  `;
  document.head.appendChild(s);
}
