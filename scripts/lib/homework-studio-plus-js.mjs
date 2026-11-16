export const STUDIO_PLUS_JS = `
var hwSPL = 0;
function hwLoadSP() { if (hwSPL) return Promise.resolve(); hwSPL = 1; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/homework/studio-plus.css'; document.head.appendChild(l); return import('/assets/homework/studio-plus.mjs').catch(function(){}); }
function hwSetQuestMode(m) { if (window.__hwSetQuestMode) window.__hwSetQuestMode(m); else hwLoadSP().then(function(){ if (window.__hwSetQuestMode) window.__hwSetQuestMode(m); }); }
function hwRenderLearningReplay() { if (window.__hwRenderLearningReplay) window.__hwRenderLearningReplay(); }
document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#hw_start_button, .homework-tab-btn, [data-open-sheet]')) hwLoadSP(); }, { once: true });
`;
