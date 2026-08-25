// Teacher-led presenting for a small-group studio.
//
// Present Mode already knew about small groups, but only coarsely: it read the
// tablist and gave the teacher one stop per tab. "Learn It" is a single tab
// holding the diagnostic, the pulse card, the scene and two labs, so that stop
// was a whole scrolling page — something you read, not something you lead a
// table through. This module turns each tab into the beats a teacher actually
// paces: one vocabulary word, one worked step, one problem.
//
// Two rules govern everything here:
//
//   1. NEVER build a second copy of the lesson. Every beat drives the studio
//      DOM that is already on the page — revealing, veiling, and clicking the
//      controls the studio itself rendered. A presenter that re-rendered the
//      content would be a second content path, and this repo has been bitten
//      repeatedly by two copies drifting apart. If the lesson changes, the
//      presented lesson changes with it, because it IS the lesson.
//
//   2. NEVER own `hidden`. `paginateProblems()` in small-group-practice.js
//      drives problem visibility through the `hidden` attribute. If this module
//      also set `hidden`, the two would fight and a problem would vanish for
//      reasons neither could explain. Veiling here is a CLASS, and the class
//      only bites while `body.nt-present` is on — so leaving Present Mode
//      restores the studio even if this module never gets to clean up.

const VEIL = "sgp-veil";
const STYLE_ID = "sgp-styles";

// Studio chrome that is never a beat: next-step buttons, the tool launcher, the
// completion banner, and the problem pager (the presenter drives the pager, so
// showing it as its own stop would be a beat that presents a button).
const CHROME = ".sg-next, .nt-toolpoint, .sg-done, .sg-problem-nav, .sg-langbar";

// Teacher-only surfaces. These are hidden by CSS while presenting (see
// injectStyles) — the list is repeated here so a beat is never built AROUND a
// teacher surface, which would leave the teacher stepping onto an empty stop.
export const TEACHER_ONLY = ".sg-lens, .sg-teacher, .sg-misconceptions, .sg-facilitation, .ntfr";

/** True when the page is a small-group studio (it renders a real tablist). */
export function isSmallGroupStudio(doc = document) {
  return doc.querySelectorAll('.sg-tabs [role="tab"]').length > 0;
}

function isSkippable(node) {
  if (node.nodeType !== 1) return true;
  if (node.matches(CHROME) || node.matches(TEACHER_ONLY)) return true;
  // A block that rendered to nothing is not a stop.
  return node.children.length === 0 && !node.textContent.trim();
}

/**
 * Reveal `atoms` up to and including `index`, veiling the rest.
 *
 * Progressive rather than one-at-a-time on purpose. For a worked example it is
 * the difference between solving with the group and showing them the answer;
 * for vocabulary the earlier words staying up is what lets students compare
 * them. Problems are the exception and are NOT veiled here — they belong to the
 * pager (see gotoProblem).
 */
function revealUpTo(atoms, index) {
  atoms.forEach((node, i) => node.classList.toggle(VEIL, i > index));
  focus(atoms[index]);
}

/**
 * Bring the beat the teacher just selected onto the screen.
 *
 * present-mode.js scrolls to the top of the document on every stop, which is
 * right for a full lesson (each phase IS the page) and wrong for a studio: the
 * hero card fills the screen and the teacher has to scroll to find the thing
 * they just clicked. The studio branch of show() skips that scroll so this can
 * win. `block: "center"` rather than "start" because a beat is usually one card
 * in a column, and a centred card reads as the subject of the screen.
 */
function focus(node) {
  if (!node?.scrollIntoView) return;
  try {
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    node.scrollIntoView();
  }
}

/** Clear every veil this module applied, anywhere in the studio. */
export function clearVeils(root = document) {
  for (const node of root.querySelectorAll(`.${VEIL}`)) node.classList.remove(VEIL);
}

/**
 * Drive the studio's own pager to problem `index`.
 *
 * Deliberately clicks the rendered buttons instead of reaching into
 * paginateProblems' closure: the pager owns which problem is visible, its
 * counter, and its disabled states, and clicking is the only way to move all
 * three together. Current position is read back from the DOM (the visible
 * problem), so this stays correct even if the teacher used the pager by hand.
 */
function gotoProblem(section, index) {
  const problems = [...section.querySelectorAll(":scope > .prob")];
  if (!problems.length) return;
  const nav = section.querySelector(".sg-problem-nav");
  if (!nav) return;
  const next = nav.querySelector("button:last-of-type");
  const previous = nav.querySelector("button:first-of-type");
  // Bound the loop by the problem count: a mis-wired pager must not spin.
  for (let guard = 0; guard < problems.length + 1; guard++) {
    const current = problems.findIndex((p) => !p.hidden);
    if (current === index || current === -1) return;
    const button = current < index ? next : previous;
    if (!button || button.disabled) return;
    button.click();
  }
}

/** Focus whichever problem the pager is showing. */
function focusVisibleProblem(section) {
  focus([...section.querySelectorAll(":scope > .prob")].find((p) => !p.hidden));
}

/**
 * The heading a teacher would read aloud for this block.
 *
 * Authored headings are already written in teacher voice, so they beat anything
 * this module could synthesise. `.sg-h` is the studio's section-header wrapper;
 * its `<small>` sub-label is decorative and would run the two together
 * ("Build the ideaStep 2"), so only the heading element's own text is taken.
 */
function blockLabel(block) {
  const heading = block.querySelector("h2, h3, .sg-h strong, .sg-h b");
  if (!heading) return "";
  const clone = heading.cloneNode(true);
  for (const small of clone.querySelectorAll("small")) small.remove();
  return clone.textContent.trim().replace(/\s+/g, " ").slice(0, 60);
}

/**
 * A tab's name without its decorative sub-label.
 *
 * The button is `<span class="lbl">Vocabulary<small>The words</small></span>`,
 * so reading textContent yields "VocabularyThe words" — which is what the rail
 * showed before this existed.
 */
function tabName(tab) {
  const source = tab.querySelector(".lbl") || tab;
  const clone = source.cloneNode(true);
  for (const small of clone.querySelectorAll("small, .dot")) small.remove();
  return (
    clone.textContent
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^\d+\s*/, "") || "Step"
  );
}

/**
 * Split one tab panel into beats.
 *
 * The panel's own header stays put — it is the title of the step, not a stop.
 * Everything else becomes a beat, except two blocks that carry their own
 * internal sequence and are split further:
 *
 *   - a vocabulary grid, one beat per word card
 *   - a paginated problem set, one beat per problem
 */
function panelBeats(panel, tabLabel) {
  const blocks = [...panel.children].filter((node) => !isSkippable(node));
  const beats = [];

  for (const block of blocks) {
    // Every authored block already carries the heading a teacher would say out
    // loud — "Build the idea", "Try it on your own", "Name what changed". Using
    // it makes the rail read like a plan instead of the same tab name five
    // times. Falling back to the tab name keeps an unheaded block navigable.
    const label = blockLabel(block) || tabLabel;
    const cards = [...block.querySelectorAll(".sg-vcard")];
    const problems = [...block.querySelectorAll(":scope > .prob")];

    if (cards.length > 1) {
      // The grid is one block; its cards are the beats. Sibling blocks after it
      // stay veiled until the words are done.
      cards.forEach((_card, i) => {
        beats.push({
          label: `${label} · word ${i + 1}`,
          run: () => {
            revealUpTo(blocks, blocks.indexOf(block));
            revealUpTo(cards, i);
          },
        });
      });
      continue;
    }

    if (problems.length > 1) {
      // Everything before the first problem (directions, the common-mistake
      // warning) is worth its own beat — it is what the teacher says before the
      // group picks up a pencil.
      const intro = [...block.children].filter(
        (n) => !isSkippable(n) && !n.classList.contains("prob"),
      );
      if (intro.length) {
        beats.push({
          label: `${label} · set up`,
          run: () => {
            revealUpTo(blocks, blocks.indexOf(block));
            for (const p of problems) p.classList.remove(VEIL);
            gotoProblem(block, 0);
          },
        });
      }
      problems.forEach((_, i) => {
        beats.push({
          label: `${label} · problem ${i + 1}`,
          run: () => {
            revealUpTo(blocks, blocks.indexOf(block));
            gotoProblem(block, i);
            focusVisibleProblem(block);
          },
        });
      });
      continue;
    }

    beats.push({
      label,
      run: () => revealUpTo(blocks, blocks.indexOf(block)),
    });
  }

  // A tab that rendered only chrome still needs one stop, or stepping through
  // the studio would skip it silently and the rail would misnumber.
  if (!beats.length) beats.push({ label: tabLabel, run: () => {} });
  return beats;
}

/**
 * The full beat list for the studio, in teaching order.
 *
 * Shape matches what present-mode.js expects from getParts(): `{ title,
 * activate }`. Recomputed on demand and derived entirely from the DOM, so it
 * stays stable across calls as long as the studio is stable — which it is;
 * veiling and paging change attributes, never the element list.
 */
export function smallGroupBeats(doc = document) {
  const tabs = [...doc.querySelectorAll('.sg-tabs [role="tab"]')];
  if (!tabs.length) return [];

  const beats = [];
  tabs.forEach((tab) => {
    const panel = doc.getElementById(tab.getAttribute("aria-controls") || "");
    if (!panel) return;
    for (const beat of panelBeats(panel, tabName(tab))) {
      beats.push({
        title: `${beats.length + 1} · ${beat.label}`,
        activate: () => {
          tab.click();
          beat.run();
        },
      });
    }
  });
  return beats;
}

/**
 * Styles for presenting a studio.
 *
 * Injected rather than imported: engine/styles/present-mode.css is deliberately
 * NOT part of the small-group bundle (tools/small-group-modes.test.mjs pins
 * that), so a stylesheet import here would either break that test or drag the
 * whole projector stylesheet into every studio.
 *
 * Every rule is scoped to `body.nt-present`, which Present Mode owns. That is
 * what makes the teacher-only blackout safe: it needs no lifecycle hook, it
 * cannot lose a race with an async-mounted lens, and exiting Present Mode
 * un-hides everything in one class removal.
 */
export function injectStyles(doc = document) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
body.nt-present .${VEIL}{display:none!important}
/* Teacher-only surfaces never reach the projector. The screen a teacher turns
   toward the table must not carry probing questions, anticipated wrong answers,
   or observation evidence. */
body.nt-present ${TEACHER_ONLY.split(", ")
    .map((s) => s.trim())
    .join(",body.nt-present ")}{display:none!important}
/* The presenter rail is fixed to the right edge. engine/styles/present-mode.css
   reserves room for it on full lessons, but that sheet is not in the studio
   bundle — without this the rail lands ON the lesson and the floating support
   docks land on the rail, clipping the beat labels. */
body.nt-present #app{padding-right:216px;box-sizing:border-box}
/* Floating chrome is not projector furniture. Every one of these overlaps the
   rail or the lesson, and none of it is something a group needs to see. The
   presenter's own bar goes too: the rail carries an Exit button and Esc works,
   so keeping it only buys a second exit control sitting on top of the content.
   All of it returns the moment nt-present comes off. NOTE: no backticks in
   this string — it is a JS template literal, and a backtick here silently
   truncates the stylesheet (see the #sg-styles hazard in small-group-ui.js). */
body.nt-present .ewl-supports-tools-dock,
body.nt-present .ewl-supports-math-dock,
body.nt-present .ewl-supports-teacher-btn-container,
body.nt-present .ewl-supports-min-toggle,
body.nt-present .sg-annotation-tools,
body.nt-present .nt-tooldock,
body.nt-present #mwb-launcher,
body.nt-present .nt-utility-menu,
body.nt-present #nsr-launcher,
body.nt-present .minimap-hud,
body.nt-present .sg-mode,
body.nt-present #nt-present-widget{display:none!important}
/* Read from across a table, not from a laptop keyboard. */
body.nt-present #app{max-width:74rem;margin-inline:auto;font-size:1.35rem;line-height:1.6;color:#0f172a}
body.nt-present #app .sg-h h2,body.nt-present #app h2,body.nt-present #app h3{font-size:2rem;font-weight:800;color:#0a2540}
body.nt-present #app .prob{font-size:1.35rem;background:#ffffff;border:2px solid #cbd5e1;border-radius:16px;box-shadow:0 10px 30px -10px rgba(15,23,42,0.12);padding:24px 32px;margin-bottom:24px}
body.nt-present #app .sg-vcard{font-size:1.4rem;background:#ffffff;border:2px solid #cbd5e1;border-radius:16px;padding:24px 32px;box-shadow:0 10px 30px -10px rgba(15,23,42,0.12)}
body.nt-present #app input,body.nt-present #app select,body.nt-present #app textarea{min-height:54px;font-size:1.4rem;font-weight:700;border:2.5px solid #0284c7;border-radius:12px;padding:8px 16px}
body.nt-present #app .math-display,body.nt-present #app .katex-display{font-size:1.5rem;font-weight:700;color:#0a2540;background:#f1f5f9;border:2px solid #e2e8f0;border-radius:12px;padding:14px 22px;margin:16px 0}
/* The tab strip is sticky, so a beat scrolled to centre can slide underneath
   it. Reserve its height as scroll margin rather than moving the strip: the
   teacher uses it to see which step they are on. */
body.nt-present #app .sg-sec,
body.nt-present #app .prob,
body.nt-present #app .sg-vcard,
body.nt-present #app .card{scroll-margin-top:132px}
/* The tab strip stays as a quiet progress cue — the presenter rail is the
   control surface now, so the tabs must not compete with it. */
body.nt-present .sg-tabs{opacity:.5;pointer-events:none;transform:scale(.9);transform-origin:top center}
`;
  (doc.head || doc.documentElement).append(style);
}
