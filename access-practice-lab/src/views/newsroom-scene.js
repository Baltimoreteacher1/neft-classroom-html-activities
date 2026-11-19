// The newsroom desk is a view of actual local work, not a score or a publication status.
import { html, icon } from '../util.js';
import { planCount, storyWords } from '../lang/newsroom.js';
export function newsroomDeskHTML(I, story, step) {
  const stages = { plan: ['Gather the facts', 'Reúne los hechos'], draft: ['Shape your report', 'Organiza tu reportaje'], read: ['Rehearse your delivery', 'Ensaya tu presentación'], front: ['Prepare your front page', 'Prepara tu portada'] };
  const title = stages[step] || stages.plan;
  return html`<section class="nr-editorial-desk" aria-label="${I.S('Your editorial desk', 'Tu mesa de redacción')}">
    <div class="nr-desk-illustration" aria-hidden="true"><img src="/access-practice-lab/pictures/premium/newsroom-editorial.jpg" srcset="/access-practice-lab/pictures/premium/newsroom-editorial-640.jpg 640w, /access-practice-lab/pictures/premium/newsroom-editorial.jpg 1440w" sizes="(max-width: 680px) 100vw, 600px" alt="" width="1440" height="810" loading="lazy" decoding="async" /></div>
    <div class="nr-desk-brief"><p>${I.T('Newsroom · your working desk', 'Redacción · tu mesa de trabajo')}</p><h2>${I.T(...title)}</h2><dl><div><dt>${I.T('Reporting notes', 'Notas del reportaje')}</dt><dd><span data-nr-desk-notes>${planCount(story.w5)}</span> / 6</dd></div><div><dt>${I.T('Draft words', 'Palabras del borrador')}</dt><dd data-nr-desk-words>${storyWords(story.draft, story.fmt || 'article')}</dd></div></dl><p class="nr-desk-note">${icon('save')} ${I.T('Your work stays on this device. Publishing here creates a front page to save or print.', 'Tu trabajo queda en este dispositivo. Aquí, publicar crea una portada para guardar o imprimir.')}</p></div>
  </section>`;
}
