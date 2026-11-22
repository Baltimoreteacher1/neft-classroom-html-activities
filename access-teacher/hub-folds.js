// Teacher Hub progressive disclosure: every hub section folds to its heading (shared src/fold.js) so each view reads as
// a short list of tools; the first section of each view starts open. Sections are filled by several scripts that replace their HTML,
// so folds are re-applied whenever the hub changes, keeping each section's open state and the teacher's focus.
import { applyFolds } from "/access-practice-lab/src/fold.js";

// Each view opens on its main section; the rest fold to their headings.
const OPEN_FIRST = new Set(["liveClass", "accAssign", "accReview", "activities"]);
const SECTIONS = "section.th-sec[id], #classEvidencePanel";

function fold() {
  // evidence.js renders its panel without an id; name it so section links and fold keys stay stable.
  const evidence = document.querySelector("#classEvidence > .panel");
  if (evidence && !evidence.id) evidence.id = "classEvidencePanel";
  for (const s of document.querySelectorAll(SECTIONS)) {
    // A script replaced this section's HTML: drop the stale key so the fold is rebuilt.
    if (s.dataset.foldKey && !s.querySelector(":scope > .fold-body")) delete s.dataset.foldKey;
    if (!s.hasAttribute("data-fold")) s.setAttribute("data-fold", OPEN_FIRST.has(s.id) ? "open" : "");
  }
  const active = document.activeElement;
  const sel = active && "selectionStart" in active ? [active.selectionStart, active.selectionEnd] : null;
  applyFolds(document);
  if (active && active !== document.body && document.activeElement !== active && active.isConnected) {
    active.focus({ preventScroll: true });
    if (sel) try { active.setSelectionRange(...sel); } catch {}
  }
}

fold();
new MutationObserver(fold).observe(document.body, { childList: true, subtree: true });
