/**
 * Understand · Practice · Play: the three doors on every family homework page.
 *
 * The page carries only these three buttons. Understand and Play open the Family Studio sheet
 * (assets/family-studio/, an ES module loaded on first use, built from the lesson's own sidecar);
 * Practice is the page's own five steps. When the page goes idle the studio also draws a picture
 * of the givens under every Your Turn problem it can read (assets/family-studio/picture.mjs), and a
 * link carrying ?view=understand (the old lesson-guide URLs redirect there) opens Understand at once.
 *
 * Replaces the Notes drawer (lesson notes are the first chapters of Understand) and the separate
 * Games / Photobooth buttons (both are cards in Play).
 */
import { act } from "./homework-actions.mjs";

const btn = (id, cls, action, icon, en, es, extra = "") => `
            <button type="button" id="${id}" class="homework-tab-extra hw-fun-btn hw-studio-btn ${cls}" ${action}${extra}><span class="tab-icon" aria-hidden="true">${icon}</span>
              <span class="tab-label"><span class="tab-en">${en}</span><span class="tab-es" lang="es">${es}</span></span></button>`;

export function renderStudioButtons() {
  return (
    btn("hw_understand_btn", "hw-studio-understand", act("openFamilyStudio", "understand"), "📖", "Understand", "Entender", ' aria-haspopup="dialog"') +
    btn("hw_practice_btn", "hw-studio-practice", act("hwStudioPractice"), "✏️", "Practice", "Practicar") +
    btn("hw_tab_play", "hw-studio-play", act("openFamilyStudio", "play"), "🎲", "Play", "Jugar", ' data-tab="play" aria-controls="hw_panel_play" aria-haspopup="dialog"')
  );
}

/** Page runtime (plain ES5 in the shared bundle). */
export const STUDIO_JS = `
/* ── Family Studio: Understand · Practice · Play ─────────────────────── */
var HW_STUDIO_URL = '/assets/family-studio/index.mjs';
var hwStudioPromise = null;
function hwStudio() {
  if (!hwStudioPromise) hwStudioPromise = import(HW_STUDIO_URL);
  return hwStudioPromise;
}
function openFamilyStudio(mode) {
  hwStudio().then(function (m) { m.openStudio(mode); }).catch(function () {
    /* Offline or blocked: the five steps below still teach tonight's lesson. */
    if (mode === 'play' && typeof openOptionalStop === 'function') openOptionalStop('play');
    else if (typeof switchHomeworkTab === 'function') switchHomeworkTab('connect');
  });
}
var HW_STUDIO_STEPS = ['connect', 'explore', 'check', 'improve', 'done'];
/* Practice: back to the five steps, at the step the family was on. */
function hwStudioPractice() {
  var cur = document.body.dataset.activeTab;
  if (HW_STUDIO_STEPS.indexOf(cur) < 0 && typeof switchHomeworkTab === 'function') switchHomeworkTab('connect');
  var bar = document.querySelector('.homework-tab-bar');
  if (bar) { try { bar.scrollIntoView({ block: 'start' }); } catch (e) {} }
}
(function () {
  var q = /[?&]view=(understand|play)\\b/.test(location.search) || /^#(understand|play)$/.test(location.hash);
  function boot() {
    hwStudio().then(function (m) {
      if (q) m.openFromUrl();
      return m.decoratePractice();
    }).catch(function () {});
  }
  if (q) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } else {
    window.addEventListener('load', function () {
      (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(boot);
    });
  }
})();
`;
