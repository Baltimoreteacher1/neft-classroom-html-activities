/**
 * Voice for the family homework pages: read-aloud on every stop, and the hooks
 * a speech-to-text layer needs to fill an answer box.
 *
 * Read-aloud. One engine (`hwVoice`) speaks every Listen button on the page, so
 * the voice is chosen the same way everywhere: the language the family is
 * reading (English, Spanish, or both in turn when both are showing) gets a
 * voice installed for THAT language, not whatever the browser defaults to for a
 * Spanish sentence. Each stop also carries a "Read this stop aloud" control. It
 * walks the stop's instruction text in page order, highlights the block being
 * read, and speaks the English and the Spanish of each block.
 *
 * Voice entry. Speech-to-text belongs to the shared learning-supports layer
 * (assets/learning-supports/), which may or may not be on the page. This file
 * never depends on it. It only marks the answer boxes and speaks a small event
 * contract that layer can use:
 *   document  "ewl:voice-entry-targets"  detail {boxes, lang()}   fired when the boxes are ready
 *   answer box "ewl:voice-entry"          detail {transcript, lang} fills the box (a number box
 *                                         takes only a clean number) and fires `input`, so
 *                                         Save/Resume and the checkers run as if it were typed
 *   window.EWLLearningSupports.attachVoiceEntry(box, {kind, lang()})  called per box when present
 * Each box also carries data-ls-voice="on", the marker assets/learning-supports/ls-voice-answer.js looks for.
 * When `ls-spoken-number.js` can be loaded, a transcript is turned into what a
 * student would have typed ("tres cuartos" -> "3/4") before it lands in the box;
 * it never works anything out for the student.
 *
 * Plain JS in String.raw: backslashes reach the page exactly as written.
 */

/** Blocks the stop reader must NOT speak: controls, headings, problem cards, answer keys, feedback. */
export const LISTEN_EXCLUDE =
  'button, summary, label, h1, h2, h3, h4, option, select, [aria-hidden="true"], [hidden], [data-no-listen], .problem-section, .hw-answer-key, .hw-answer-sheet, .hw-domino-sheet, .vocab-card, .vocab-container, .feedback, .feedback-box, .explanation-box, .obj-popup-backdrop, .cga-feedback, .hw-listen-bar, .homework-tab-bar';

export const VOICE_CSS = `
.hw-listen-bar { margin: 0 0 14px; }
.hw-listen-bar .btn-read-aloud { min-height: 44px; }
.hw-listen-bar .btn-read-aloud[aria-pressed="true"] { background: var(--st-navy, #17324d); color: #fff; }
.is-reading { outline: 3px solid #d97706; outline-offset: 3px; border-radius: 6px; background: rgba(245, 158, 11, 0.12); }
.hw-voice-status { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
body.no-speech .hw-listen-bar, body.no-speech .hw-listen, body.no-speech .btn-read-aloud, body.no-speech .btn-listen-prob, body.no-speech .btn-listen-concept, body.no-speech .vocab-speak-btn { display: none !important; }
@media print { .hw-listen-bar { display: none; } }
`;

export const VOICE_JS = String.raw`
/* Voice: read-aloud for every stop, plus hooks for voice entry into answer boxes. */
var hwVoice = (function () {
  var LISTEN_EXCLUDE = '__LISTEN_EXCLUDE__';
  var MIN_WORDS = 5;
  var PREFS = { en: ['en-us', 'en-gb', 'en'], es: ['es-us', 'es-mx', 'es-419', 'es-es', 'es'] };
  var token = 0;
  var active = null;
  var reading = null;

  function supported() {
    return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  }

  function mode() {
    var c = document.body.classList;
    if (c.contains('lang-mode-es')) return 'es';
    if (c.contains('lang-mode-en')) return 'en';
    return 'both';
  }

  function voiceList() {
    try { return window.speechSynthesis.getVoices() || []; } catch (e) { return []; }
  }

  /* A voice installed for the language, local ones first. Null lets the browser fall back on utter.lang. */
  function pick(lang) {
    var list = voiceList();
    var prefs = PREFS[lang] || [];
    for (var p = 0; p < prefs.length; p++) {
      var hits = list.filter(function (v) {
        var l = String(v.lang || '').replace('_', '-').toLowerCase();
        return l === prefs[p] || l.indexOf(prefs[p] + '-') === 0;
      });
      if (hits.length) {
        var local = hits.filter(function (v) { return v.localService; });
        return (local.length ? local : hits)[0];
      }
    }
    return null;
  }

  var TAG = { en: 'en-US', es: 'es-US' };
  var FRAC_EN = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'], 100: ['hundredth', 'hundredths'] };
  var FRAC_ES = { 2: ['medio', 'medios'], 3: ['tercio', 'tercios'], 4: ['cuarto', 'cuartos'], 5: ['quinto', 'quintos'], 6: ['sexto', 'sextos'], 7: ['séptimo', 'séptimos'], 8: ['octavo', 'octavos'], 9: ['noveno', 'novenos'], 10: ['décimo', 'décimos'], 100: ['centésimo', 'centésimos'] };
  var NUM_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  var NUM_ES = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  var SYM = {
    en: { '×': ' times ', '÷': ' divided by ', '−': ' minus ', '–': ' to ', '+': ' plus ', '=': ' equals ', '≠': ' does not equal ', '≈': ' is about ', '≤': ' is less than or equal to ', '≥': ' is greater than or equal to ', '<': ' is less than ', '>': ' is greater than ', '%': ' percent', '°': ' degrees' },
    es: { '×': ' por ', '÷': ' dividido entre ', '−': ' menos ', '–': ' a ', '+': ' más ', '=': ' es igual a ', '≠': ' no es igual a ', '≈': ' es aproximadamente ', '≤': ' es menor o igual que ', '≥': ' es mayor o igual que ', '<': ' es menor que ', '>': ' es mayor que ', '%': ' por ciento', '°': ' grados' }
  };

  /* Make the page's math say what a teacher would say. A "3/4" read raw is often a date. */
  function prepare(text, lang) {
    var s = String(text || '').replace(/[\p{Extended_Pictographic}️‍]/gu, ' ');
    var es = lang === 'es';
    s = s.replace(/(\d+)\s*\/\s*(\d+)/g, function (m, a, b) {
      var n = parseInt(a, 10), d = parseInt(b, 10);
      var words = (es ? FRAC_ES : FRAC_EN)[d];
      if (!words || n < 1 || n > 9) return a + (es ? ' sobre ' : ' over ') + b;
      return (es ? NUM_ES : NUM_EN)[n] + ' ' + words[n === 1 ? 0 : 1];
    });
    var table = SYM[lang] || SYM.en;
    s = s.replace(/[×÷−–+=≠≈≤≥<>%°]/g, function (c) { return table[c] || c; });
    return s.replace(/\s+/g, ' ').trim();
  }

  /* Short utterances: some engines stop a long one after a few seconds. */
  function chunks(text) {
    var parts = text.match(/[^.!?¿¡]+[.!?]*\s*/g) || [text];
    var out = [], cur = '';
    parts.forEach(function (p) {
      if (cur && (cur + p).length > 180) { out.push(cur.trim()); cur = ''; }
      cur += p;
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function rate() {
    try { if (typeof vocabSpeechRate === 'number') return vocabSpeechRate; } catch (e) {}
    return 0.9;
  }

  function mark(el, on) {
    if (el) el.classList.toggle('is-reading', on);
  }

  function stop() {
    token++;
    if (supported()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    if (active) { active.setAttribute('aria-pressed', 'false'); active.classList.remove('is-speaking'); active = null; }
    if (reading) { mark(reading, false); reading = null; }
  }

  /* items: [{text, lang, el?}] spoken in order. Returns false when speech is unavailable. */
  function run(items, button) {
    if (!supported()) return false;
    stop();
    var mine = token;
    if (button) { active = button; button.setAttribute('aria-pressed', 'true'); button.classList.add('is-speaking'); }
    var queue = [];
    items.forEach(function (it) {
      var text = prepare(it.text, it.lang);
      if (!text) return;
      chunks(text).forEach(function (c, i, all) {
        queue.push({ text: c, lang: it.lang, el: it.el, last: i === all.length - 1 });
      });
    });
    function next() {
      if (mine !== token) return;
      var q = queue.shift();
      if (!q) { stop(); return; }
      if (q.el && q.el !== reading) {
        mark(reading, false);
        reading = q.el;
        mark(reading, true);
        try { reading.scrollIntoView({ block: 'nearest' }); } catch (e) {}
      }
      var u = new window.SpeechSynthesisUtterance(q.text);
      u.lang = TAG[q.lang] || q.lang;
      var v = pick(q.lang);
      if (v) { u.voice = v; u.lang = v.lang || u.lang; }
      u.rate = rate();
      u.onend = next;
      u.onerror = next;
      window.speechSynthesis.speak(u);
    }
    next();
    return true;
  }

  /* One sentence in English and/or Spanish, following the language the family is reading. */
  function speak(en, es, opts) {
    var m = mode();
    var items = [];
    var single = opts && opts.single;
    if (m === 'es' && es) items.push({ text: es, lang: 'es' });
    else if (m === 'en' || single || !es || es === en) items.push({ text: en || es, lang: en ? 'en' : 'es' });
    else { items.push({ text: en, lang: 'en' }); items.push({ text: es, lang: 'es' }); }
    return run(items, opts && opts.button);
  }

  function plainText(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll('.hw-listen, .btn-read-aloud, .btn-listen-prob, .btn-listen-concept, svg, script, style, .lang-label').forEach(function (n) { n.remove(); });
    /* Chips and list items sit side by side with no space between them in the markup. */
    clone.querySelectorAll('*').forEach(function (n) { n.after(' '); });
    return clone.textContent.replace(/\s+/g, ' ').replace(/ ([.,;:!?])/g, '$1').trim();
  }

  function words(t) { return t ? t.split(' ').length : 0; }

  function skipped(el) {
    if (el.closest(LISTEN_EXCLUDE)) return true;
    var d = el.closest('details:not([open])');
    return !!d;
  }

  function isEs(el) { return el.classList.contains('lang-es') || el.getAttribute('lang') === 'es'; }

  /* The element to highlight: the block itself, or the paragraph around a pair of spans. */
  function hostOf(el) {
    return el.tagName === 'SPAN' && el.parentElement ? el.parentElement : el;
  }

  /* Every instruction block of a stop, in page order: [{enEl, esEl, en, es}]. A block is a
     language pair: an element marked lang-en and the Spanish sibling that follows it. */
  function collect(panel) {
    var out = [];
    panel.querySelectorAll('.lang-en').forEach(function (en) {
      if (en.parentElement && en.parentElement.closest('.lang-en')) return;
      if (skipped(en)) return;
      var es = en.nextElementSibling;
      if (es && !isEs(es)) es = null;
      var enText = plainText(en);
      var esText = es ? plainText(es) : '';
      if (words(enText) < MIN_WORDS) return;
      out.push({ enEl: hostOf(en), esEl: es ? hostOf(es) : hostOf(en), en: enText, es: esText });
    });
    return out;
  }

  function readPanel(panel, button) {
    var m = mode();
    var items = [];
    collect(panel).forEach(function (b) {
      if (m !== 'es' && b.en) items.push({ text: b.en, lang: 'en', el: b.enEl });
      if (m !== 'en' && b.es) items.push({ text: b.es, lang: 'es', el: b.esEl });
      else if (m === 'es' && b.en) items.push({ text: b.en, lang: 'en', el: b.enEl });
    });
    return run(items, button);
  }

  return { supported: supported, pick: pick, prepare: prepare, speak: speak, run: run, stop: stop, collect: collect, readPanel: readPanel, mode: mode };
})();
window.hwVoice = hwVoice;

/* A Listen button that carries its own text: data-speak-en / data-speak-es. */
document.addEventListener('click', function (e) {
  var b = e.target.closest ? e.target.closest('[data-speak-en]') : null;
  if (!b) return;
  if (b.classList.contains('is-speaking')) { hwVoice.stop(); return; }
  hwVoice.speak(b.getAttribute('data-speak-en'), b.getAttribute('data-speak-es'), { button: b });
});

/* One "Read this stop aloud" control at the top of every stop. */
function hwVoiceInstallBars() {
  if (!hwVoice.supported()) { document.body.classList.add('no-speech'); return; }
  document.querySelectorAll('[data-tab-panel]').forEach(function (panel) {
    if (panel.querySelector('.hw-listen-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'hw-listen-bar';
    bar.setAttribute('data-no-vocab', '');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-read-aloud hw-listen hw-listen-stop';
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '🔊 <span class="lang-en">Read this stop aloud</span><span class="lang-es" lang="es">Leer esta etapa en voz alta</span>';
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-speaking')) { hwVoice.stop(); return; }
      hwVoice.readPanel(panel, btn);
    });
    bar.appendChild(btn);
    var title = panel.querySelector('h2.section-title');
    if (title && title.parentElement === panel) title.insertAdjacentElement('afterend', bar);
    else panel.insertBefore(bar, panel.firstChild);
  });
}

/* Answer boxes a speech-to-text layer may fill. */
var hwVoiceSpoken = null;

function hwVoiceKind(el) {
  if (el.tagName === 'TEXTAREA') return 'text';
  var key = String(el.getAttribute('data-correct') || '');
  return /^[-+0-9.,/%$ ]+$/.test(key) ? 'number' : 'text';
}

function hwVoiceLang() {
  return document.body.classList.contains('lang-mode-es') ? 'es' : 'en';
}

function hwVoiceAnnounce(en, es) {
  var live = document.getElementById('hw_voice_status');
  if (!live) {
    live = document.createElement('p');
    live.id = 'hw_voice_status';
    live.className = 'hw-voice-status';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  }
  live.textContent = hwVoiceLang() === 'es' ? es : en;
}

function hwVoiceFill(box, transcript, lang) {
  var kind = box.getAttribute('data-voice-entry');
  var text = String(transcript || '').trim();
  if (hwVoiceSpoken) {
    text = kind === 'number' ? hwVoiceSpoken.spokenToNumberAnswer(text, lang || hwVoiceLang()) : hwVoiceSpoken.spokenToText(text, lang || hwVoiceLang());
  }
  if (kind === 'number' && !/^[-+]?[0-9][0-9.,/%$ ]*$/.test(text)) {
    hwVoiceAnnounce('I did not hear a number. Try again.', 'No escuché un número. Intenta otra vez.');
    return false;
  }
  if (!text) return false;
  var proto = Object.getPrototypeOf(box);
  var desc = Object.getOwnPropertyDescriptor(proto, 'value');
  var joined = kind === 'number' || !box.value ? text : box.value.replace(/\s+$/, '') + ' ' + text;
  if (desc && desc.set) desc.set.call(box, joined); else box.value = joined;
  box.dispatchEvent(new Event('input', { bubbles: true }));
  box.dispatchEvent(new Event('change', { bubbles: true }));
  hwVoiceAnnounce('Heard: ' + text, 'Escuché: ' + text);
  return true;
}

function hwVoiceInitEntry() {
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input.table-input, textarea.open-response-textarea, textarea.error-explain-textarea, textarea.hw-work-input'));
  boxes.forEach(function (box) {
    box.setAttribute('data-voice-entry', hwVoiceKind(box));
    /* The shared learning-supports layer (ls-voice-answer.js) offers its microphone beside any box inside [data-ls-voice]. */
    box.setAttribute('data-ls-voice', 'on');
  });
  document.addEventListener('ewl:voice-entry', function (e) {
    var box = e.target;
    if (!box || !box.getAttribute || !box.getAttribute('data-voice-entry')) return;
    var d = e.detail || {};
    hwVoiceFill(box, d.transcript, d.lang);
  });
  var shared = window.EWLLearningSupports;
  if (shared && typeof shared.attachVoiceEntry === 'function') {
    boxes.forEach(function (box) {
      try { shared.attachVoiceEntry(box, { kind: box.getAttribute('data-voice-entry'), lang: hwVoiceLang }); } catch (err) {}
    });
  }
  document.dispatchEvent(new CustomEvent('ewl:voice-entry-targets', { detail: { boxes: boxes, lang: hwVoiceLang } }));
  try {
    import('/assets/learning-supports/ls-spoken-number.js').then(function (m) {
      if (m && typeof m.spokenToText === 'function' && typeof m.spokenToNumberAnswer === 'function') hwVoiceSpoken = m;
    }).catch(function () {});
  } catch (err) {}
}

function hwVoiceInit() {
  hwVoiceInstallBars();
  hwVoiceInitEntry();
  /* Browsers fill the voice list lazily; asking once now means the first Listen finds it. */
  if (hwVoice.supported()) { try { window.speechSynthesis.getVoices(); } catch (err) {} }
  window.addEventListener('pagehide', function () { hwVoice.stop(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hwVoiceInit, { once: true });
else hwVoiceInit();
`.replace("__LISTEN_EXCLUDE__", LISTEN_EXCLUDE.replace(/'/g, "\\'"));
