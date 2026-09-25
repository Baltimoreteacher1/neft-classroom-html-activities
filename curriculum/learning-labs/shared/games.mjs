import { puzzle, fmt } from './math.mjs';
import { esc, mountModel } from './model.mjs';

function shuffled(items, seed) {
  const out = [...items]; let x = seed || 17;
  for (let i = out.length - 1; i > 0; i--) { x = (x * 1664525 + 1013904223) >>> 0; const j = x % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function mountGames(host, lab, state, save, level) {
  state.games ||= {}; state.games[level] ||= { rounds: 0, matches: [], moves: 0 };
  const progress = state.games[level], tier = ['support', 'core', 'stretch'].indexOf(level);
  host.innerHTML = `<div class="game-menu"><button type="button" data-game="mission" aria-pressed="true">${esc(lab.finale)}</button><button type="button" data-game="match" aria-pressed="false">Connection Quest</button></div><div class="game-stage"></div>`;
  let active = 'mission';
  const stage = host.querySelector('.game-stage');
  const mission = () => {
    const round = Math.min(progress.rounds, 3);
    if (round === 3) {
      stage.innerHTML = `<div class="game-win"><span class="win-icon" aria-hidden="true">🏁</span><h3>${esc(lab.finale)} complete</h3><p>You solved three construction puzzles. Pick one and explain why your settings worked.</p><button type="button" data-replay>Replay these puzzles</button><button type="button" class="quiet" data-other>Play Connection Quest</button></div>`;
      stage.querySelector('[data-replay]').onclick = () => { progress.rounds = 0; delete progress.puzzleValues; save(); mission(); };
      stage.querySelector('[data-other]').onclick = () => choose('match'); return;
    }
    const challenge = puzzle(lab.model, round, tier);
    const isBalance = lab.model.kind === 'balance';
    const isMirror = lab.model.kind === 'coordinates' && ['reflect', 'symmetry'].includes(lab.model.mode);
    const isInequality = lab.model.kind === 'inequality';
    const approximate = Math.abs(challenge.target - Number(challenge.target.toFixed(4))) > 1e-8;
    const goal = isMirror ? `Move A to the reflection of B across the ${round % 2 ? 'x' : 'y'}-axis.` : isInequality ? `Find a test value that ${round % 2 ? 'does not satisfy' : 'satisfies'} the rule. The boundary itself ${round % 2 ? 'may help you find a counterexample' : 'is worth checking'}.` : isBalance ? 'Make both sides equal. Only the candidate value of x can change.' : `Make ${challenge.metric.toLowerCase()} ${approximate ? 'approximately' : 'equal'} ${fmt(challenge.target)}.${approximate ? ' The target is rounded to four decimal places.' : ''} Only one control is unlocked.`;
    stage.innerHTML = `<div class="round-heading"><h3>${esc(lab.finale)}</h3><p>Puzzle ${round + 1} of 3</p></div><div class="mission-track" aria-label="${round} of 3 puzzles solved">${[0,1,2].map(i => `<span class="${i < round ? 'earned' : ''}">${i < round ? '✓' : i + 1}</span>`).join('')}</div><p class="target">${esc(goal)}</p><p>Plan a move, change the model, then submit your solution. You can retry without losing progress.</p><div class="puzzle-model"></div><div class="actions"><button type="button" data-check>Submit solution</button><button type="button" class="quiet" data-hint>Get a strategy hint</button></div><p class="game-feedback" role="status"></p>`;
    const saved = progress.puzzleValues;
    const initial = saved?.round === round ? saved.values : challenge.start;
    const model = mountModel(stage.querySelector('.puzzle-model'), lab.model, { initial, free: challenge.free, prefix: 'game', level,
      onChange: values => { progress.puzzleValues = { round, values }; save(); } });
    const status = stage.querySelector('.game-feedback');
    stage.querySelector('[data-hint]').onclick = () => { status.textContent = isMirror ? 'A reflection changes the sign of the coordinate perpendicular to the mirror. The other coordinate stays the same.' : isInequality ? 'Read the direction and test the boundary. Think about whether equality is allowed.' : isBalance ? 'Use the inverse operation, then substitute your candidate into the original equation.' : 'Look at the relationship in the model. Predict whether the unlocked value needs to increase or decrease. Use the worked examples in Learn if you need a starting point.'; };
    stage.querySelector('[data-check]').onclick = () => {
      if (!model.valid) { status.textContent = 'Fix the highlighted model input before submitting your solution.'; return; }
      let correct = Math.abs(model.result().value - challenge.target) <= challenge.tolerance;
      if (isMirror) correct = model.values.every((n, i) => Math.abs(n - challenge.goal[i]) < 1e-8);
      if (isInequality) correct = model.result().pass === (round % 2 === 0);
      if (!correct) { status.textContent = 'Keep investigating. Your settings do not meet the goal yet. Read the model, adjust one value, and try again.'; return; }
      progress.rounds++; delete progress.puzzleValues; save();
      status.textContent = 'Goal reached. Your model is evidence that the settings work.';
      const next = stage.querySelector('[data-check]'); next.textContent = round === 2 ? 'See your finish' : 'Next puzzle'; next.onclick = mission;
    };
  };

  const match = () => {
    const vocab = lab.vocabulary.slice(0, tier === 2 ? 6 : 4);
    const cards = shuffled(vocab.flatMap((v, i) => [{ pair: i, side: 'term', text: v.term }, { pair: i, side: 'meaning', text: v.definition }]), lab.id.length * 153 + tier);
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
      if (showingWrong || selected.includes(index)) return;
      selected.push(index);
      if (selected.length === 2) {
        progress.moves++;
        const [a, b] = selected.map(i => cards[i]);
        if (a.pair === b.pair && a.side !== b.side) {
          found.add(a.pair); progress.matches = [...found]; selected = [];
          status.textContent = found.size === vocab.length ? `All ${vocab.length} connections found in ${progress.moves} attempts. Explain one connection in your own words.` : `Connected: ${vocab[a.pair].term}. ${found.size} of ${vocab.length} pairs found.`;
        } else { showingWrong = true; clear.hidden = false; status.textContent = 'These cards do not form a term-and-meaning pair. Read both, then choose “Try another pair.”'; }
        save();
      }
      draw();
    };
    status.textContent = `${found.size} of ${vocab.length} connections found.`;
    clear.onclick = () => { selected = []; showingWrong = false; clear.hidden = true; status.textContent = 'Choose a new pair.'; draw(); };
    stage.querySelector('[data-restart]').onclick = () => { progress.matches = []; progress.moves = 0; save(); match(); };
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
