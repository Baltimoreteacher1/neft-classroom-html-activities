/**
 * Lesson Notes: a side card on every Family Practice page that opens short, guided, visual notes for
 * tonight's lesson. Every line comes from the lesson's OWN authored data; a piece the lesson did not
 * author is left out, never invented.
 *
 *   1 The big idea      sidecar bigIdea, else v3.standardPlain, else learningTonight
 *   2 The picture       the Look & Learn drawing, copied from the page with its own ids
 *   3 Step by step      sidecar conceptSteps, every step at once, top to bottom
 *   4 Words to know     up to four of the page's own word cards (plain definition and example)
 *   5 Common mistake    sidecar corner.watchOut, labelled as a mistake
 *
 * The page carries only the card. The notes are built the first time the drawer
 * opens, from /data/family-homework-notes/<id>.json (already public) and from what the page already
 * shows, because every family page sits within a few hundred bytes of its first-view budget
 * (validate:family-performance) and the notes would otherwise repeat the page.
 */
import { act } from "./homework-actions.mjs";
import { NOTES_CSS_HREF } from "./homework-design-links.mjs";

/**
 * The side card that opens the notes. The drawer is created by NOTES_JS on first open (notes from
 * /data/family-homework-notes/<LESSON_ID>.json), so a page that never opens it pays only for this.
 */
export function renderNotesButton() {
  return `
            <button type="button" class="homework-tab-extra hw-fun-btn hw-notes-btn" id="hw_notes_btn" ${act("toggleNotesDrawer")}
              aria-expanded="false"><span class="tab-icon" aria-hidden="true">📝</span>
              <span class="tab-label"><span class="tab-en">Notes</span><span class="tab-es" lang="es">Apuntes</span></span></button>`;
}

/** Page runtime (plain ES5 in the shared bundle): open/close, and build the notes once. */
export const NOTES_JS = `
/* ── Lesson notes ────────────────────────────────────────────────────── */
var HW_NOTE_TITLES = {
  idea: ['The big idea', 'La idea principal'],
  picture: ['The picture', 'El dibujo'],
  steps: ['Step by step', 'Paso a paso'],
  words: ['Words to know', 'Palabras clave'],
  watch: ['Common mistake', 'Error común']
};
function hwNoteText(tag, cls, en, es) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  var a = document.createElement('span'); a.className = 'lang-en'; a.textContent = en;
  var b = document.createElement('span'); b.className = 'lang-es'; b.lang = 'es'; b.textContent = es || en;
  el.appendChild(a); el.appendChild(b);
  return el;
}
function hwHas(p) { return !!(p && p.en && String(p.en).trim()); }

/* The page's own word cards: not the lesson-title card, no repeats ("Ratio Tables" / "Ratio table"). */
function hwNoteWords() {
  var title = (((document.querySelector('h1') || {}).textContent || '') + ' ' + document.title).toLowerCase();
  var key = function (s) { return String(s).trim().toLowerCase().replace(/s$/, ''); };
  var seen = {}, out = [];
  document.querySelectorAll('.vocab-card').forEach(function (card) {
    var term = card.querySelector('.vocab-term .lang-en');
    var def = card.querySelector('.vocab-def');
    if (!term || !def || out.length >= 4) return;
    var name = term.textContent.trim();
    var k = key(name);
    /* The lesson's concept card reads like a title ("Solve One-Step Addition and Subtraction Equations"). */
    if (seen[k] || title.indexOf(name.toLowerCase()) >= 0 || name.split(/\\s+/).length > 4) return;
    seen[k] = 1;
    var termEs = card.querySelector('.vocab-term .lang-es');
    var defEs = card.querySelector('.vocab-def-es');
    var hint = card.querySelector('.vocab-visual-hint');
    var row = document.createElement('div'); row.className = 'hw-note-word';
    row.appendChild(hwNoteText('dt', '', name, termEs ? termEs.textContent.trim() : ''));
    var dd = hwNoteText('dd', '', def.textContent.trim(), defEs ? defEs.textContent.trim() : '');
    if (hint) {
      var ex = document.createElement('span'); ex.className = 'hw-note-ex';
      ex.textContent = hint.textContent.replace(/^[^\\w(]+/, '').trim();
      dd.appendChild(ex);
    }
    row.appendChild(dd);
    out.push(row);
  });
  if (!out.length) return null;
  var dl = document.createElement('dl'); dl.className = 'hw-note-words';
  out.forEach(function (r) { dl.appendChild(r); });
  return dl;
}

function hwBuildNotes(notes) {
  var list = document.querySelector('#hw_notes_drawer [data-notes-list]');
  if (!list || list.getAttribute('aria-busy') !== 'true') return;
  notes = notes || {};
  var v3 = notes.v3 || {};
  var parts = [];
  var idea = [notes.bigIdea, v3.standardPlain, notes.learningTonight].filter(hwHas)[0];
  if (idea) parts.push(['idea', hwNoteText('p', 'hw-note-idea', idea.en, idea.es)]);
  var stage = document.querySelector('#hw_family_bridge_60s .hw-colearn-svg-stage');
  if (stage && stage.querySelector('svg')) {
    var fig = document.createElement('figure'); fig.className = 'hw-note-figure';
    fig.innerHTML = stage.innerHTML.replace(/\\bfm-([0-9a-z]+)-(en|es)-/g, 'nt-$1-$2-');
    if (v3.classModel && hwHas(v3.classModel.name)) fig.appendChild(hwNoteText('figcaption', '', v3.classModel.name.en, v3.classModel.name.es));
    parts.push(['picture', fig]);
  }
  var steps = (notes.conceptSteps || []).filter(hwHas);
  var ol;
  if (steps.length) {
    ol = document.createElement('ol');
    steps.forEach(function (s) { ol.appendChild(hwNoteText('li', '', s.en, s.es)); });
  } else {
    /* No sidecar (offline): the worked example on this page is the same list. */
    var ex = document.querySelector('.fp-example .fp-steps');
    if (ex) {
      ol = ex.cloneNode(true);
      ol.querySelectorAll('li').forEach(function (li) { li.classList.remove('is-later'); li.removeAttribute('tabindex'); });
    }
  }
  if (ol) { ol.className = 'fp-steps hw-note-steps'; parts.push(['steps', ol]); }
  var words = hwNoteWords();
  if (words) parts.push(['words', words]);
  var watch = notes.corner && notes.corner.watchOut;
  if (hwHas(watch)) {
    var p = hwNoteText('p', 'hw-note-watch', watch.en, watch.es);
    p.insertBefore(hwNoteText('strong', '', 'Watch out for this: ', 'Cuidado con esto: '), p.firstChild);
    parts.push(['watch', p]);
  }
  parts.forEach(function (part, i) {
    var li = document.createElement('li'); li.className = 'hw-note'; li.setAttribute('data-note', part[0]);
    var h = hwNoteText('h3', 'hw-note-title', HW_NOTE_TITLES[part[0]][0], HW_NOTE_TITLES[part[0]][1]);
    var num = document.createElement('span'); num.className = 'hw-note-num'; num.setAttribute('aria-hidden', 'true'); num.textContent = String(i + 1);
    h.insertBefore(num, h.firstChild);
    li.appendChild(h); li.appendChild(part[1]);
    list.appendChild(li);
  });
  list.setAttribute('aria-busy', 'false');
}

/* The drawer: the help drawer's shell (body.css), made on first open. */
function hwNotesDrawer() {
  var drawer = document.getElementById('hw_notes_drawer');
  var btn = document.getElementById('hw_notes_btn');
  if (drawer || !btn) return drawer;
  drawer = document.createElement('div');
  drawer.className = 'hw-help-drawer hw-notes-drawer';
  drawer.id = 'hw_notes_drawer';
  drawer.hidden = true;
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', 'hw_notes_title');
  drawer.innerHTML = '<div class="hw-help-drawer-scrim" data-act="toggleNotesDrawer"></div>' +
    '<div class="hw-help-drawer-sheet"><div class="hw-help-drawer-head">' +
    '<strong id="hw_notes_title"><span aria-hidden="true">📝</span> ' + hwFlowBi('Lesson notes', 'Apuntes de la lección') + '</strong>' +
    '<button type="button" class="hw-help-drawer-close hw-notes-close" data-act="toggleNotesDrawer"><span aria-hidden="true">✕</span>' +
    '<span class="hw-sr-only">' + hwFlowBi('Close notes', 'Cerrar apuntes') + '</span></button></div>' +
    '<div class="hw-help-drawer-body"><p class="hw-notes-lead">' +
    hwFlowBi('Read from top to bottom. Copy the big idea and the steps into your notebook.', 'Lean de arriba abajo. Copien la idea principal y los pasos en su cuaderno.') +
    '</p><ol class="hw-notes-list" data-notes-list aria-busy="true"></ol></div></div>';
  document.body.appendChild(drawer);
  btn.setAttribute('aria-controls', 'hw_notes_drawer');
  return drawer;
}

/* The drawer's stylesheet, once: on first open, or earlier when the page goes idle. */
function hwNotesCss() {
  var href = '${NOTES_CSS_HREF}';
  if (document.querySelector('link[data-notes-css]')) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = href; link.setAttribute('data-notes-css', '');
  document.head.appendChild(link);
}
window.addEventListener('load', function () {
  (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(hwNotesCss);
});

var hwNotesLoading = null;
function hwLoadNotes() {
  hwNotesCss();
  if (hwNotesLoading) return hwNotesLoading;
  var id = String(window.LESSON_ID || '');
  var src = /^[\\w-]+$/.test(id) ? '/data/family-homework-notes/' + id + '.json' : '';
  var get = src && window.fetch
    ? fetch(src, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; })
    : Promise.resolve(null);
  hwNotesLoading = get.catch(function () { return null; }).then(hwBuildNotes);
  return hwNotesLoading;
}

/* A drawer over the current step, so a family can check the notes mid-problem and come straight back. */
function toggleNotesDrawer() {
  var drawer = hwNotesDrawer();
  var btn = document.getElementById('hw_notes_btn');
  if (!drawer) return;
  var open = drawer.hidden;
  if (open) hwLoadNotes();
  drawer.hidden = !open;
  document.body.classList.toggle('hw-drawer-open', open);
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    var close = drawer.querySelector('.hw-notes-close');
    if (close) close.focus();
  } else if (btn) {
    btn.focus();
  }
}
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var drawer = document.getElementById('hw_notes_drawer');
  if (drawer && !drawer.hidden) toggleNotesDrawer();
});
`;
