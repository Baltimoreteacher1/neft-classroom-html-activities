/**
 * Two-person mode for the Family Arcade's Math Dominoes: pass the phone, and a
 * paper version for the kitchen table.
 *
 * One device, one chain. Turns alternate between the student and the grown-up;
 * whoever is not placing is the coach. The score belongs to the team: the page
 * never counts a winner, never keeps a per-person tally and never runs a timer.
 *
 * The game itself (tiles, tray, the chain) stays in HOMEWORK_TABS_JS. It
 * announces what happens through `hw:domino` events (`reset`, `placed`, `miss`),
 * and this module listens, so the single-player game is untouched when the
 * toggle is off. The tile maths exists once, as `famDomTiles` in that file; the
 * paper sheet is built from the same function.
 */

const bi = (en, es) =>
  `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;

/** Controls rendered inside the Math Dominoes card. */
export function renderDominoDuo() {
  return `
        <div class="dom-duo" id="fam_dom_duo">
          <div class="dom-duo-actions">
            <button type="button" class="btn btn-sm btn-secondary" id="fam_dom_duo_toggle" aria-pressed="false" aria-controls="fam_dom_duo_panel" onclick="toggleDominoDuo()">👥 ${bi("Two players: pass the phone", "Dos jugadores: pasen el teléfono")}</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="printDominoSheet()">🖨️ ${bi("Print paper dominoes", "Imprimir dominós de papel")}</button>
          </div>
          <div class="dom-duo-panel" id="fam_dom_duo_panel" hidden>
            <p class="dom-duo-rule">${bi("A student and a grown-up share one chain. Take turns placing, and switch coach and player each time. There is no winner and no timer.", "Un estudiante y un adulto comparten una cadena. Colocan fichas por turnos y cambian de entrenador y jugador cada vez. No hay ganador ni cronómetro.")}</p>
            <p class="dom-duo-turn" id="fam_dom_duo_turn" role="status" aria-live="polite"></p>
            <p class="dom-duo-coach" id="fam_dom_duo_coach"></p>
          </div>
        </div>`;
}

export const DOMINO_DUO_CSS = `
.dom-duo { margin: 0 0 12px; }
.dom-duo-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.dom-duo-actions .btn { min-height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow-wrap: normal; word-break: normal; }
.dom-duo-actions .btn[aria-pressed="true"] { background: var(--st-navy, #17324d); color: #fff; border-color: var(--st-navy, #17324d); }
.dom-duo-panel { margin-top: 10px; padding: 12px 14px; border-radius: 12px; border: 2px solid var(--st-teal, #0f766e); background: #f0fdfa; }
.dom-duo-panel[hidden] { display: none; }
.dom-duo-rule { margin: 0 0 8px; font-size: 14px; line-height: 1.45; color: #334155; }
.dom-duo-turn { margin: 0; font-size: 20px; font-weight: 800; line-height: 1.35; color: var(--st-navy, #17324d); }
.dom-duo-coach { margin: 4px 0 0; font-size: 16px; line-height: 1.45; }
.dom-duo-panel[data-turn="grownup"] { border-style: dashed; background: #fffaf0; border-color: #b45309; }
.hw-domino-sheet { display: none; }
@media print {
  body.print-domino-sheet > *:not(.hw-domino-sheet) { display: none !important; }
  body.print-domino-sheet .hw-domino-sheet { display: block !important; color: #000; font-size: 12pt; }
  .hw-domino-sheet h2 { margin: 0 0 4pt; font-size: 18pt; }
  .hw-domino-sheet ol { margin: 6pt 0 10pt; padding-left: 18pt; }
  .hw-domino-sheet li { margin: 0 0 4pt; }
  .hw-domino-sheet .dsheet-note { margin: 0 0 8pt; font-style: italic; }
  .hw-domino-sheet .dsheet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm 6mm; margin: 6pt 0 10pt; }
  .hw-domino-sheet .dsheet-tile { position: relative; display: flex; min-height: 26mm; border: 2pt dashed #000; break-inside: avoid; }
  .hw-domino-sheet .dsheet-half { flex: 1 1 50%; display: flex; align-items: center; justify-content: center; padding: 3mm; text-align: center; font-size: 15pt; font-weight: 700; overflow-wrap: anywhere; }
  .hw-domino-sheet .dsheet-half + .dsheet-half { border-left: 2pt solid #000; }
  .hw-domino-sheet .dsheet-start { position: absolute; top: -4.5mm; left: 3mm; padding: 0 2mm; background: #fff; font-size: 9pt; font-weight: 800; }
  .hw-domino-sheet .dsheet-key { font-size: 10pt; break-inside: avoid; }
}
`;

/* Plain JS in a template literal: no backslashes, so nothing is dropped. */
export const DOMINO_DUO_JS = `
/* Math Dominoes: two players on one device, and the paper version. */
var domDuo = { on: false };

function domDuoText(en, es) {
  var span = function (cls, text, lang) {
    var s = document.createElement('span');
    s.className = cls;
    if (lang) s.setAttribute('lang', lang);
    s.textContent = text;
    return s;
  };
  var frag = document.createDocumentFragment();
  frag.appendChild(span('lang-en', en));
  frag.appendChild(span('lang-es', es, 'es'));
  return frag;
}

function domDuoSet(id, en, es) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.appendChild(domDuoText(en, es));
}

/* Student places on even turns, the grown-up on odd turns. The turn is how many
   dominoes have been placed after the first, so it stays right if the toggle is
   switched on mid-chain. */
function domDuoRender() {
  var panel = document.getElementById('fam_dom_duo_panel');
  if (!panel || !domDuo.on || typeof famDom === 'undefined' || !famDom.n) return;
  var turn = Math.max(0, famDom.next - 1);
  var done = famDom.next >= famDom.n;
  var student = turn % 2 === 0;
  panel.setAttribute('data-turn', student ? 'student' : 'grownup');
  if (done) {
    domDuoSet('fam_dom_duo_turn', '🎉 You built the loop together!', '🎉 ¡Armaron el círculo juntos!');
    domDuoSet('fam_dom_duo_coach', 'Team chain: ' + famDom.n + ' of ' + famDom.n + ' dominoes. Tell each other one thing that helped.', 'Cadena del equipo: ' + famDom.n + ' de ' + famDom.n + ' fichas. Díganse una cosa que les ayudó.');
    return;
  }
  if (student) {
    domDuoSet('fam_dom_duo_turn', "🧑‍🎓 Student's turn: pick the domino that fits next.", '🧑‍🎓 Turno del estudiante: elige la ficha que sigue.');
    domDuoSet('fam_dom_duo_coach', 'Grown-up, you are the coach: ask “How do you know it fits?” Please do not tap for them.', 'Adulto, eres el entrenador: pregunta «¿Cómo sabes que encaja?». Por favor no toques por ellos.');
  } else {
    domDuoSet('fam_dom_duo_turn', "👪 Grown-up's turn: pick a domino and think out loud.", '👪 Turno del adulto: elige una ficha y piensa en voz alta.');
    domDuoSet('fam_dom_duo_coach', 'Student, you are the coach: say “yes” or “not yet” and tell why, before the domino goes down.', 'Estudiante, eres el entrenador: di «sí» o «todavía no» y explica por qué, antes de poner la ficha.');
  }
}

/* The single-player lines talk about "wrong tries"; a team keeps one shared count of second looks. */
function domDuoTeamStatus() {
  if (!domDuo.on || typeof famDom === 'undefined' || !famDom.n) return;
  domDuoSet('fam_dom_status',
    'Team chain: ' + famDom.next + ' of ' + famDom.n + ' · Second looks: ' + famDom.tries,
    'Cadena del equipo: ' + famDom.next + ' de ' + famDom.n + ' · Segundas miradas: ' + famDom.tries);
}

function toggleDominoDuo() {
  domDuo.on = !domDuo.on;
  var btn = document.getElementById('fam_dom_duo_toggle');
  var panel = document.getElementById('fam_dom_duo_panel');
  if (btn) btn.setAttribute('aria-pressed', domDuo.on ? 'true' : 'false');
  if (panel) panel.hidden = !domDuo.on;
  document.body.classList.toggle('dom-duo-on', domDuo.on);
  if (domDuo.on) {
    domDuoRender();
    domDuoTeamStatus();
  } else if (typeof updateDominoStatus === 'function') {
    updateDominoStatus();
  }
}
window.toggleDominoDuo = toggleDominoDuo;

document.addEventListener('hw:domino', function (e) {
  if (!domDuo.on) return;
  var type = e.detail && e.detail.type;
  if (type === 'miss') {
    var hint = document.getElementById('fam_dom_hint');
    if (hint) {
      hint.textContent = '';
      hint.appendChild(domDuoText('Not that one. Talk it over together: which answer is the twin of the problem at the end of the chain?', 'Esa no. Conversen juntos: ¿cuál respuesta es la pareja del problema al final de la cadena?'));
    }
  }
  domDuoRender();
  domDuoTeamStatus();
});

/* ── Paper dominoes ───────────────────────────────────────────────────────── */
function dsheetEl(tag, cls, text) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}

function dsheetBi(tag, cls, en, es) {
  var el = dsheetEl(tag, cls);
  el.appendChild(domDuoText(en, es));
  return el;
}

function buildDominoSheet() {
  var data = typeof famGamesData === 'function' ? famGamesData() : null;
  if (!data || typeof famDomTiles !== 'function') return null;
  var tiles = famDomTiles(data.pairs, 0);
  var old = document.querySelector('.hw-domino-sheet');
  if (old) old.remove();
  var sheet = dsheetEl('section', 'hw-domino-sheet');
  sheet.setAttribute('aria-hidden', 'true');
  sheet.appendChild(dsheetBi('h2', '', 'Math Dominoes: paper version', 'Dominó matemático: versión en papel'));
  sheet.appendChild(dsheetBi('p', 'dsheet-note', 'For a student and a grown-up. No winner, no timer. Cut along the dashed lines.', 'Para un estudiante y un adulto. Sin ganador ni cronómetro. Recorten por las líneas punteadas.'));
  var rules = dsheetEl('ol');
  [
    ['Lay the START domino down. Keep the others face up in a pile.', 'Pongan la ficha de INICIO. Dejen las demás boca arriba en un montón.'],
    ['Take turns. Look at the problem on the right end of the chain. Find the domino whose LEFT side is its match, and say how you know.', 'Túrnense. Miren el problema del extremo derecho de la cadena. Busquen la ficha cuyo lado IZQUIERDO es su pareja y digan cómo lo saben.'],
    ['The other person is the coach: ask “How do you know?” before you nod. Then switch roles.', 'La otra persona es el entrenador: pregunten «¿Cómo lo saben?» antes de asentir. Luego cambien de papel.'],
    ['When the last domino matches the left side of the START domino, you built a loop together.', 'Cuando la última ficha coincide con el lado izquierdo de la ficha de INICIO, armaron un círculo juntos.']
  ].forEach(function (r) { rules.appendChild(dsheetBi('li', '', r[0], r[1])); });
  sheet.appendChild(rules);
  /* The pile is printed in a scrambled order so the sheet does not hand over the chain. */
  var pile = tiles.slice(1).reverse();
  var grid = dsheetEl('div', 'dsheet-grid');
  [tiles[0]].concat(pile).forEach(function (tile, i) {
    var cell = dsheetEl('div', 'dsheet-tile');
    if (i === 0) cell.appendChild(dsheetBi('span', 'dsheet-start', '★ START', '★ INICIO'));
    cell.appendChild(dsheetEl('span', 'dsheet-half', tile.left));
    cell.appendChild(dsheetEl('span', 'dsheet-half', tile.right));
    grid.appendChild(cell);
  });
  sheet.appendChild(grid);
  var key = dsheetEl('p', 'dsheet-key');
  key.appendChild(dsheetBi('strong', '', 'Grown-up check, chain from the START domino: ', 'Revisión del adulto, cadena desde la ficha de INICIO: '));
  key.appendChild(document.createTextNode(tiles.map(function (t) { return t.left + ' | ' + t.right; }).join('  →  ')));
  sheet.appendChild(key);
  document.body.appendChild(sheet);
  return sheet;
}

function printDominoSheet() {
  if (!buildDominoSheet()) return;
  document.body.classList.add('print-domino-sheet');
  window.print();
  setTimeout(function () { document.body.classList.remove('print-domino-sheet'); }, 1000);
}
window.printDominoSheet = printDominoSheet;
`;
