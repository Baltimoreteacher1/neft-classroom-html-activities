// Underlined vocabulary: the first time a lesson word appears in each stage it is underlined, and tapping it opens
// the word's card — the term, the Spanish word, the definition in English and Spanish, the picture and an example.
// The same pattern as the homework pages and the graphic novels. The page supplies the words and a prebuilt pattern
// (scripts/lib/math-studio-page.mjs, from engine/core/vocab-match.js); stages re-render, so new text is linked as it
// appears.
import { bi, esc } from './items.mjs';

// Text that is a control, a label, a heading, the word cards (already definitions), the models, or Spanish.
const SKIP = 'button, a, input, textarea, select, label, summary, script, style, svg, code, h1, h2, h3, h4, .t-es, .ms-words, .ms-flip, .ms-term-link, .ms-vpop, .ms-eyebrow, .ms-stagebar, .ms-pager, #ms-model, .ms-expr, .ms-legend, [data-no-vocab]';

// Mirrors normalizeVocabSurface in engine/core/vocab-match.js, which built the lookup keys.
const norm = (s) => {
  const t = String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  return /[^aeiou]ies$/.test(t) ? t.replace(/ies$/, 'y') : t.replace(/s$/, '');
};
const LETTER = /\p{L}/u;

let pop = null;
let opener = null;
function close() {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  document.body.classList.remove('ms-vpop-open');
  opener?.focus?.();
}

/** Open one word's card: { term, termEs, definition, definitionEs, image, example }. */
export function openWord(v, from) {
  if (!v) return;
  if (!pop) {
    pop = document.createElement('div');
    pop.className = 'ms-vpop';
    pop.hidden = true;
    pop.innerHTML = '<div class="ms-vpop__card" role="dialog" aria-modal="true" aria-labelledby="ms-vpop-term"><button type="button" class="ms-vpop__close" aria-label="Close">×</button><div class="ms-vpop__body"></div></div>';
    document.body.append(pop);
    pop.addEventListener('click', (e) => { if (e.target === pop || e.target.closest('.ms-vpop__close')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
  opener = from;
  pop.querySelector('.ms-vpop__body').innerHTML = `<h3 id="ms-vpop-term" class="ms-vpop__term">${esc(v.term)}</h3>
    ${v.termEs ? `<p class="ms-vpop__es"><span>Español</span> <strong lang="es">${esc(v.termEs)}</strong></p>` : ''}
    ${v.image ? `<img class="ms-vpop__img" src="${esc(v.image)}" alt="${esc(`Picture of ${v.term}`)}">` : ''}
    ${v.definition ? `<p class="ms-vpop__def">${esc(v.definition)}</p>` : ''}
    ${v.definitionEs ? `<p class="ms-vpop__def-es" lang="es">${esc(v.definitionEs)}</p>` : ''}
    ${v.example ? `<p class="ms-vpop__ex"><span>${bi('Example', 'Ejemplo')}</span> ${esc(v.example)}</p>` : ''}`;
  pop.hidden = false;
  document.body.classList.add('ms-vpop-open');
  pop.querySelector('.ms-vpop__close').focus();
}

export function mountVocab(root, data) {
  if (!data?.regexSource) return;
  const { words, lookup } = data;
  const re = new RegExp(data.regexSource, 'gi');

  /** Underline the first sighting of each word in each stage (once per stage, as on the homework pages). */
  const link = () => {
    observer.disconnect();
    for (const stage of root.querySelectorAll('.ms-stage')) {
      const linked = new Set([...stage.querySelectorAll('.ms-term-link')].map((a) => a.dataset.word));
      const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.textContent.trim() && n.parentElement && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      });
      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
      for (const node of nodes) {
        const text = node.textContent;
        const frag = document.createDocumentFragment();
        let cursor = 0, m;
        re.lastIndex = 0;
        while ((m = re.exec(text))) {
          const idx = lookup[norm(m[0])];
          if (idx === undefined || linked.has(String(idx))) continue;
          const v = words[idx];
          if (v.caseSensitive && m[0].replace(/(?:es|s)$/, '') !== v.term) continue;
          // JS word boundaries are ASCII: re-check both edges against Unicode letters.
          if (LETTER.test(text.charAt(m.index - 1) || '') || LETTER.test(text.charAt(m.index + m[0].length) || '')) continue;
          frag.append(text.slice(cursor, m.index));
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ms-term-link';
          b.dataset.word = String(idx);
          b.setAttribute('aria-haspopup', 'dialog');
          b.textContent = m[0];
          frag.append(b);
          cursor = m.index + m[0].length;
          linked.add(String(idx));
        }
        if (cursor) { frag.append(text.slice(cursor)); node.replaceWith(frag); }
      }
    }
    observer.observe(root, { childList: true, subtree: true });
  };
  let queued = 0;
  const observer = new MutationObserver(() => { cancelAnimationFrame(queued); queued = requestAnimationFrame(link); });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.ms-term-link');
    if (b) { e.preventDefault(); openWord(words[Number(b.dataset.word)], b); }
  });
  link();
}
