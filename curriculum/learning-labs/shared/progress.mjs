// Activity completion derived from saved state. Progress is descriptive, never a grade.
export const tabs = [
  ['brief', 'Mission'],
  ['learn', 'Learn'],
  ['investigate', 'Investigate'],
  ['practice', 'Practice'],
  ['create', 'Create'],
  ['games', 'Games'],
];
export const levels = {
  support: { label: 'Support', detail: 'More guidance, sentence frames, and a place to build confidence.' },
  core: { label: 'Core', detail: 'Grade-level practice with hints available whenever you need them.' },
  stretch: { label: 'Stretch', detail: 'Explain, compare, and justify. Look for more than one way to solve a problem.' },
};
export const timing = { brief: '3 min', learn: '8–12 min', investigate: '8–10 min', practice: '10–15 min', create: '5–10 min', games: '5–10 min' };

const filled = (text) => String(text || '').trim().length > 0;
const words = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;

// Each activity reports a status: 'done', 'started', or 'new', plus a short summary.
export function activityStatus(lab, state, id) {
  const level = state.level;
  if (id === 'brief') {
    const started = filled(state.notes.prediction);
    return { status: started ? 'done' : 'new', summary: started ? 'Prediction written' : 'Write what you already know' };
  }
  if (id === 'learn') {
    const total = lab.lessons.length;
    const seen = lab.lessons.filter((l) => (state.steps[l.id] || 1) >= l.concept.worked.lines.length).length;
    const explained = lab.lessons.filter((l) => filled(state.notes[`learn-${l.id}`])).length;
    const status = explained === total && seen === total ? 'done' : seen || explained ? 'started' : 'new';
    return { status, summary: `${seen} of ${total} worked examples read · ${explained} of ${total} explained` };
  }
  if (id === 'investigate') {
    const total = lab.investigate.length;
    const done = lab.investigate.filter((_, i) => filled(state.notes[`investigate-${i}`])).length;
    return { status: done === total ? 'done' : done ? 'started' : 'new', summary: `${done} of ${total} investigations recorded` };
  }
  if (id === 'practice') {
    const bank = lab.practice[level] || [];
    const scored = bank.filter((q) => q.type !== 'explain');
    const solved = scored.filter((q) => state.practice[q.id]?.correct).length;
    const written = bank.filter((q) => q.type === 'explain' && state.practice[q.id]?.reviewed).length;
    const explainCount = bank.length - scored.length;
    const attempted = bank.filter((q) => state.practice[q.id]?.attempts || state.practice[q.id]?.reviewed).length;
    const complete = solved === scored.length && written === explainCount;
    return {
      status: complete ? 'done' : attempted ? 'started' : 'new',
      summary: `${solved} of ${scored.length} solved${explainCount ? ` · ${written} of ${explainCount} explanations written` : ''} (${levels[level].label})`,
      solved, scored: scored.length,
    };
  }
  if (id === 'create') {
    const count = words(state.created);
    const checks = state.checklist.length;
    const complete = count >= 40 && checks === 3;
    return { status: complete ? 'done' : count || checks ? 'started' : 'new', summary: count ? `${count} words · ${checks} of 3 checks` : 'Design not started', words: count };
  }
  if (id === 'games') {
    const g = state.games[level] || {};
    const rounds = Math.min(3, g.rounds || 0), pairs = g.matches?.length || 0;
    const target = level === 'stretch' ? 6 : 4;
    const complete = rounds === 3 && pairs >= Math.min(target, lab.vocabulary.length);
    return { status: complete ? 'done' : rounds || pairs ? 'started' : 'new', summary: `${rounds} of 3 puzzles · ${pairs} connections (${levels[level].label})` };
  }
  return { status: 'new', summary: '' };
}

export function overview(lab, state) {
  const items = tabs.map(([id, title]) => ({ id, title, ...activityStatus(lab, state, id) }));
  const done = items.filter((i) => i.status === 'done').length;
  const next = items.find((i) => i.status !== 'done')?.id || 'games';
  return { items, done, total: items.length, next };
}

// Key ideas arrive as "Title. 1. First point 2. Second point 3. Third point".
// Markers are matched in sequence so a number inside the text (such as "per 100.") is not a split.
export function parseKeyIdea(text) {
  const source = String(text || '').trim();
  const first = source.search(/(?:^|\s)1\.\s/);
  if (first < 0) return { title: '', points: source ? [source] : [] };
  const title = source.slice(0, first).trim().replace(/[.:]\s*$/, '');
  let rest = source.slice(first).trim();
  const points = [];
  for (let n = 1; n < 20; n++) {
    const next = rest.search(new RegExp(`(?:^|\\s)${n + 1}\\.\\s`));
    const chunk = next < 0 ? rest : rest.slice(0, next);
    points.push(chunk.replace(/^\d+\.\s*/, '').trim());
    if (next < 0) break;
    rest = rest.slice(next).trim();
  }
  return { title, points: points.filter(Boolean) };
}

export const noteLabels = (lab) => {
  const labels = { prediction: 'What I already knew', revision: 'What I revised or still wonder' };
  lab.lessons.forEach((l) => { labels[`learn-${l.id}`] = `Lesson ${l.id.replace('-', '.')} in my own words`; });
  lab.investigate.forEach((p, i) => { labels[`investigate-${i}`] = `Investigation ${i + 1}: ${p}`; });
  return labels;
};
