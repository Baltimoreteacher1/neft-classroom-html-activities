import { mountExpedition } from './expedition.mjs?v=20261007';
import { esc } from './model.mjs';

function shuffled(items, seed) {
  const out = [...items]; let x = seed || 17;
  for (let i = out.length - 1; i > 0; i--) { x = (x * 1664525 + 1013904223) >>> 0; const j = x % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function mountGames(host, lab, state, save, level) {
  state.games ||= {}; state.games[level] ||= { rounds: 0, matches: [], moves: 0 };
  const progress = state.games[level];
  progress.checks ||= 0; progress.hints ||= 0; progress.solutions ||= []; progress.shuffle ||= 0;
  const tier = ['support', 'core', 'stretch'].indexOf(level);
  host.innerHTML = `<div class="game-menu"><button type="button" data-game="mission" aria-pressed="true">${esc(lab.finale)}</button><button type="button" data-game="match" aria-pressed="false">Connection Quest</button></div><div class="game-stage"></div>`;
  let active = 'mission';
  const stage = host.querySelector('.game-stage');
  const mission = () => mountExpedition(stage, lab, progress, save, level, choose);

  const match = () => {
    const vocab = lab.vocabulary.slice(0, tier === 2 ? 6 : 4);
    const cards = shuffled(vocab.flatMap((v, i) => [{ pair: i, side: 'term', text: v.term }, { pair: i, side: 'meaning', text: v.definition }]), lab.id.length * 153 + tier + progress.shuffle * 7919);
    const found = new Set(progress.matches);
    let selected = [], showingWrong = false;
    stage.innerHTML = `<h3>Connection Quest</h3><p>Connect each mathematical term to its meaning. ${tier === 0 ? 'All cards stay visible for support.' : 'Flip a card, remember its meaning, then find its partner.'} A pair needs one term and one meaning.</p><p class="match-status" role="status"></p><div class="match-grid"></div><div class="actions"><button type="button" class="quiet" data-clear hidden>Try another pair</button><button type="button" class="quiet" data-restart>New round</button></div>`;
    const grid = stage.querySelector('.match-grid'), status = stage.querySelector('.match-status'), clear = stage.querySelector('[data-clear]');
    const draw = () => {
      const activeCard = document.activeElement?.dataset?.card;
      grid.innerHTML = cards.map((card, i) => `<button type="button" class="match-card ${found.has(card.pair) ? 'matched' : ''} ${selected.includes(i) ? 'selected' : ''}" data-card="${i}" aria-pressed="${selected.includes(i)}" ${found.has(card.pair) ? 'disabled' : ''}><span class="card-kind">${card.side === 'term' ? 'Term' : 'Meaning'}</span><span>${tier === 0 || found.has(card.pair) || selected.includes(i) ? esc(card.text) : 'Flip to reveal'}</span></button>`).join('');
      grid.querySelectorAll('[data-card]').forEach(btn => btn.onclick = () => pick(Number(btn.dataset.card)));
      if (activeCard !== undefined) {
        const previous = grid.querySelector(`[data-card="${activeCard}"]`);
        const next = previous && !previous.disabled ? previous : grid.querySelector('[data-card]:not(:disabled)') || stage.querySelector('[data-restart]');
        next?.focus();
      }
    };
    const pick = (index) => {
      if (showingWrong || selected.includes(index) || found.has(cards[index].pair)) return;
      selected.push(index);
      if (selected.length === 2) {
        progress.moves++;
        const [a, b] = selected.map(i => cards[i]);
        if (a.pair === b.pair && a.side !== b.side) {
          window.GameStudio?.emit('feedback', { correct: true });
          found.add(a.pair); progress.matches = [...found]; selected = [];
          status.textContent = found.size === vocab.length ? `All ${vocab.length} connections found in ${progress.moves} attempts. Explain one connection in your own words.` : `Connected: ${vocab[a.pair].term}. ${found.size} of ${vocab.length} pairs found.`;
          if (found.size === vocab.length) window.GameStudio?.emit('complete', { correct: found.size, total: vocab.length, message: `Connection Quest complete: ${vocab.length} pairs in ${progress.moves} attempts.` });
        } else { window.GameStudio?.emit('feedback', { correct: false }); showingWrong = true; clear.hidden = false; status.textContent = 'These cards do not form a term-and-meaning pair. Read both, then choose “Try another pair.”'; }
        save();
      }
      draw();
    };
    status.textContent = `${found.size} of ${vocab.length} connections found.`;
    grid.addEventListener('keydown', event => {
      const card = event.target.closest('[data-card]');
      if (!card || !['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
      const buttons = [...grid.querySelectorAll('[data-card]:not(:disabled)')];
      const index = buttons.indexOf(card), columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[event.key] || 0;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + delta + buttons.length) % buttons.length;
      event.preventDefault(); buttons[next]?.focus();
    });
    clear.onclick = () => { selected = []; showingWrong = false; clear.hidden = true; status.textContent = 'Choose a new pair.'; draw(); };
    stage.querySelector('[data-restart]').onclick = () => { progress.matches = []; progress.moves = 0; progress.shuffle++; save(); match(); };
    draw();
  };
  function choose(game) {
    active = game;
    host.querySelectorAll('[data-game]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.game === game)));
    if (game === 'mission') mission(); else match();
  }
  host.querySelectorAll('[data-game]').forEach(button => button.onclick = () => choose(button.dataset.game));
  choose(active);
}
