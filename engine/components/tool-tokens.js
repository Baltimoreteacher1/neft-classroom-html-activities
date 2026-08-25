/*
 * tool-tokens.js — the shared visual vocabulary for interactive math tools.
 *
 * WHY THIS EXISTS. The interactive components are shared between whole-group
 * and small-group lessons, and each one had grown its own palette, its own
 * button treatment, its own radii and its own shadows. Measured across ten
 * representative lessons, one component alone (the long-division lab) put 160
 * gradient fills on the page — an indigo-to-teal button gradient that appears
 * nowhere else in EduWonderLab. A student moving between two tools was moving
 * between two products.
 *
 * WHY IT IS NOT A NEW DESIGN SYSTEM. Every token below DEFERS to the shell it
 * finds itself in. The small-group shell defines `--sg-*`; whole-group lessons
 * define their own; a tool asks for `--sg-card` first and falls back to a
 * neutral only when nothing answers. So one definition adapts to both contexts
 * instead of two stylesheets drifting apart, and a shell palette change reaches
 * the tools for free.
 *
 * WHAT IT DELIBERATELY DOES NOT COVER. Mathematical colour. A quotient digit,
 * a subtraction rule, a brought-down digit, a correct/incorrect state, a data
 * series, a selected ratio row — those encode mathematics and belong to the
 * component that draws them. This file styles the INTERFACE around the
 * mathematics: surfaces, controls, focus, radii. The goal is mathematical
 * colour without interface noise, not monochrome mathematics.
 *
 * Injected once, by whichever tool loads first. No stylesheet request, no
 * dependency, and it works in both shells because the component carries it.
 */

const STYLE_ID = "ewl-tool-tokens";

let injected = false;

export function injectToolTokens() {
  if (injected) return;
  if (typeof document === "undefined") return;
  injected = true;
  if (document.getElementById(STYLE_ID)) return;

  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  :root{
    /* Surfaces. The tool sits on the lesson's own sheet, so its canvas is a
       step in from that sheet rather than a floating card of its own. */
    --tool-surface:var(--sg-card,#fff);
    --tool-canvas:var(--sg-figure,#f7fafd);
    --tool-line:var(--sg-line,#d7e2ed);
    --tool-ink:var(--sg-text,#1a2b3c);
    --tool-muted:var(--sg-muted,#54677c);

    /* Two radii and one control height, everywhere. The long-division lab
       alone computed seven distinct radii. */
    --tool-radius:var(--sg-radius,12px);
    --tool-radius-sm:var(--sg-radius-sm,8px);
    --tool-control-h:44px;

    /* Controls are obvious and quiet: a flat fill, a hairline, and a clear
       pressed state. No gradient, no lift, no shadow. */
    --tool-control-bg:var(--sg-card,#fff);
    --tool-control-ink:var(--sg-ink,#12355b);
    --tool-control-line:var(--sg-line,#d7e2ed);
    --tool-control-hover:color-mix(in srgb,var(--tool-accent) 8%,var(--tool-control-bg));
    --tool-control-active-bg:var(--tool-accent);
    --tool-control-active-ink:#fff;

    /* One accent, borrowed from the shell so a tool matches the pathway it is
       being taught in. State colours stay separate from it on purpose. */
    --tool-accent:var(--sg,#12355b);
    --tool-good:var(--sg-good,#0f7a4d);
    --tool-warn:var(--sg-warn,#b4451c);
    --tool-focus:var(--sg-pop,#1fa6a2);
  }

  /* ---- shared control primitives -------------------------------------------
     A component opts in by using these class names. They are deliberately few:
     an action, a toggle, and a chip. Anything a tool needs beyond that is
     usually mathematics and belongs to the tool. */
  .tool-btn{
    display:inline-flex;align-items:center;justify-content:center;gap:6px;
    min-height:var(--tool-control-h);padding:0 16px;
    font:inherit;font-size:.95rem;font-weight:600;
    color:var(--tool-control-ink);background:var(--tool-control-bg);
    border:1px solid var(--tool-control-line);border-radius:var(--tool-radius-sm);
    cursor:pointer;
  }
  .tool-btn:hover:not(:disabled){background:var(--tool-control-hover);border-color:var(--tool-accent);}
  .tool-btn:disabled{opacity:.45;cursor:default;}
  /* The primary action of a tool is filled, so "what do I press" is answerable
     at a glance without every button shouting. */
  .tool-btn.is-primary{
    color:var(--tool-control-active-ink);background:var(--tool-control-active-bg);
    border-color:var(--tool-control-active-bg);
  }
  .tool-btn.is-primary:hover:not(:disabled){
    background:color-mix(in srgb,#000 12%,var(--tool-control-active-bg));
    border-color:color-mix(in srgb,#000 12%,var(--tool-control-active-bg));
  }
  /* State is carried by fill AND weight AND an inset rule, so it survives
     greyscale, high contrast and colour-vision differences. */
  .tool-toggle[aria-pressed="true"],.tool-toggle.is-on{
    color:var(--tool-control-active-ink);background:var(--tool-control-active-bg);
    border-color:var(--tool-control-active-bg);font-weight:700;
    box-shadow:inset 0 -3px 0 color-mix(in srgb,#000 22%,var(--tool-control-active-bg));
  }
  .tool-chip{
    display:inline-flex;align-items:center;gap:5px;min-height:var(--tool-control-h);
    padding:0 12px;font:inherit;font-size:.88rem;font-weight:600;
    color:var(--tool-control-ink);background:var(--tool-control-bg);
    border:1px solid var(--tool-control-line);border-radius:999px;cursor:pointer;
  }
  .tool-chip:hover{background:var(--tool-control-hover);border-color:var(--tool-accent);}

  /* ---- a tool mounted in a lesson is not a card ---------------------------
     When a component mounts as a lesson visual it is already inside the
     lesson's own bordered figure surface, which in the small-group shell is
     itself inside the problem card. A tool that then draws its own border and
     repeats its own title makes four nested surfaces and two headings for one
     piece of mathematics. Guarded by .interactive-visual, so a tool used
     standalone keeps the card it needs. */
  .interactive-visual > .ldl{border:0;border-radius:0;padding:0;max-width:none;background:none;}
  .interactive-visual > .ldl > .ldl-title{
    position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;
  }

  /* One focus treatment across every tool. */
  .tool-btn:focus-visible,.tool-chip:focus-visible,.tool-toggle:focus-visible{
    outline:3px solid var(--tool-accent);outline-offset:2px;
    box-shadow:0 0 0 6px color-mix(in srgb,var(--tool-focus) 40%,transparent);
  }
  `;
  document.head.appendChild(s);
}

/* Test hook: the id the gate greps for. */
export const TOOL_TOKENS_STYLE_ID = STYLE_ID;
