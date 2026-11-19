// Original museum inspection scene; the existing adventure engine owns all clue decisions and saves.
import { html, icon } from '../util.js';
export function museumSceneHTML(I, clues = [], picked = []) {
  return html`<section class="museum-inspection" aria-label="${I.S('Museum inspection desk', 'Mesa de investigación del museo')}">
    <div class="museum-gallery-art"><img src="/access-practice-lab/pictures/premium/museum-gallery.jpg" srcset="/access-practice-lab/pictures/premium/museum-gallery-640.jpg 640w, /access-practice-lab/pictures/premium/museum-gallery.jpg 1440w" sizes="(max-width: 700px) 100vw, 1100px" alt="" width="1440" height="810" loading="lazy" decoding="async" /><a class="museum-case-hotspot" href="#museum-evidence" aria-label="${I.S('Inspect the empty case and examine the written clues', 'Inspecciona la vitrina vacía y examina las pistas escritas')}">${icon('search')}<span>${I.T('Inspect the case', 'Inspecciona la vitrina')}</span></a></div>
    <div class="museum-inspection-head"><strong>${icon('evidence')} ${I.T('Inspect the evidence', 'Examina la evidencia')}</strong><span>${I.T('Examine the cards below. Decide what belongs on your board.', 'Examina las tarjetas de abajo. Decide qué pertenece a tu tablero.')}</span></div>
    <ol class="museum-evidence-markers" aria-label="${I.S('Evidence collection status', 'Estado de la evidencia')}">${clues.map((clue, i) => html`<li class="${picked.includes(clue.id) ? 'is-collected' : ''}" data-collected="${picked.includes(clue.id)}">${icon(picked.includes(clue.id) ? 'check' : 'search')} ${I.T('Note', 'Nota')} ${i + 1} · ${picked.includes(clue.id) ? I.T('On your board', 'En tu tablero') : I.T('To examine', 'Por examinar')}</li>`)}</ol>
  </section>`;
}
