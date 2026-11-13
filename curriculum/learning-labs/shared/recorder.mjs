// Experiment Recorder: the student's own record of what they predicted, changed and saw.
// The log lives in the lab's saved state as `state.experiments` ({ v: 1, items }); older saves have none and get an empty log.
// It is process evidence (a prediction, a change, an outcome), never a mastery score.
import { esc } from './model.mjs';

export const MAX_EXPERIMENTS = 40;
export const emptyLog = () => ({ v: 1, items: [] });

/** The log on a state, created (or reset when its shape is unknown) so older saves never break. */
export function ensureLog(state) {
  const log = state.experiments;
  if (!log || log.v !== 1 || !Array.isArray(log.items)) state.experiments = emptyLog();
  return state.experiments;
}

const nums = (list) => (Array.isArray(list) ? list.filter((n) => Number.isFinite(n)) : []);

/** Add one experiment. `prediction.ok` is true/false when the student predicted, null when they did not. */
export function addExperiment(state, e, now = Date.now()) {
  const log = ensureLog(state);
  const item = {
    id: log.items.reduce((m, i) => Math.max(m, i.id), 0) + 1,
    at: now,
    source: e.source === 'bridge' ? 'bridge' : 'predict',
    prediction: { text: String(e.prediction?.text ?? ''), ok: typeof e.prediction?.ok === 'boolean' ? e.prediction.ok : null },
    change: { text: String(e.change?.text ?? ''), before: nums(e.change?.before), after: nums(e.change?.after) },
    observed: { text: String(e.observed?.text ?? ''), ok: typeof e.observed?.ok === 'boolean' ? e.observed.ok : null },
    relation: String(e.relation ?? ''),
  };
  log.items.push(item);
  while (log.items.length > MAX_EXPERIMENTS) log.items.shift();
  return item;
}

export const findExperiment = (state, id) => ensureLog(state).items.find((i) => i.id === Number(id)) || null;

/** Two experiments side by side: which model settings differ, and whether either prediction held. */
export function compareExperiments(state, idA, idB) {
  const a = findExperiment(state, idA);
  const b = findExperiment(state, idB);
  if (!a || !b || a.id === b.id) return null;
  const n = Math.max(a.change.after.length, b.change.after.length);
  const differs = Array.from({ length: n }, (_, i) => i).filter((i) => a.change.after[i] !== b.change.after[i]);
  return { a, b, differs };
}

/** Prediction accuracy over the experiments where the student predicted (null when they have not yet). */
export function summary(state) {
  const items = ensureLog(state).items;
  const predicted = items.filter((i) => i.prediction.ok !== null);
  return { total: items.length, predicted: predicted.length, matched: predicted.filter((i) => i.prediction.ok).length };
}

/** Plain lines for the download and print report. */
export function reportLines(state) {
  const items = ensureLog(state).items;
  if (!items.length) return [];
  const verdict = (ok) => (ok === null ? 'no prediction' : ok ? 'prediction matched' : 'prediction did not match');
  return ['MY EXPERIMENTS', ...items.map((i, n) => `${n + 1}. ${i.change.text || 'Changed the model'} (${verdict(i.prediction.ok)}). Saw: ${i.observed.text}${i.relation ? ` Relationship: ${i.relation}` : ''}`), ''];
}

const badge = (ok) => (ok === null ? '<span class="rec-badge">No prediction</span>' : ok ? '<span class="rec-badge" data-ok="true">✓ Prediction matched</span>' : '<span class="rec-badge" data-ok="false">✗ Prediction did not match</span>');
const vals = (v) => (v.length ? v.join(', ') : 'n/a');

/** Mount the recorder list; `restore(values)` puts values back into the model. Returns { render }. */
export function mountRecorder(host, { state, save, restore }) {
  const compare = new Set();
  const root = document.createElement('details');
  root.className = 'studio-how recorder';
  host.append(root);
  const render = () => {
    const items = ensureLog(state).items;
    const s = summary(state);
    const open = root.open;
    const list = [...items].reverse().map((i) => `<li class="rec-item" data-exp="${i.id}"><div class="rec-head">${badge(i.prediction.ok)}<label class="rec-pick"><input type="checkbox" data-compare="${i.id}" ${compare.has(i.id) ? 'checked' : ''}><span>Compare</span></label></div><p class="rec-change"><strong>${esc(i.change.text || 'Changed the model')}</strong></p>${i.prediction.text ? `<p>I predicted: ${esc(i.prediction.text)}</p>` : ''}<p>I saw: ${esc(i.observed.text)}</p>${i.relation ? `<p class="rec-relation">${esc(i.relation)}</p>` : ''}<div class="rec-actions">${i.change.before.length ? `<button type="button" class="quiet small" data-restore-before="${i.id}">Back to before</button>` : ''}${i.change.after.length ? `<button type="button" class="quiet small" data-restore-after="${i.id}">Go to after</button>` : ''}</div></li>`).join('');
    const picked = [...compare];
    const cmp = picked.length === 2 ? compareExperiments(state, picked[0], picked[1]) : null;
    root.innerHTML = `<summary>My experiments (${s.total})${s.predicted ? ` · ${s.matched} of ${s.predicted} predictions matched` : ''}</summary>${items.length ? `<p class="rec-hint">Restore any experiment to see it again. Tick two to compare them.</p><ul class="rec-list">${list}</ul>` : '<p class="rec-empty">Your experiments collect here as you predict and test. Nothing is graded.</p>'}${cmp ? `<div class="rec-compare" role="region" aria-label="Comparison"><h4>Comparing experiments ${cmp.a.id} and ${cmp.b.id}</h4><table><thead><tr><th scope="col"></th><th scope="col">Experiment ${cmp.a.id}</th><th scope="col">Experiment ${cmp.b.id}</th></tr></thead><tbody><tr><th scope="row">Model settings</th><td>${esc(vals(cmp.a.change.after))}</td><td>${esc(vals(cmp.b.change.after))}</td></tr><tr><th scope="row">Relationship</th><td>${esc(cmp.a.relation || 'n/a')}</td><td>${esc(cmp.b.relation || 'n/a')}</td></tr></tbody></table><p>${cmp.differs.length ? 'The settings differ, so compare what stayed the same in the relationship.' : 'These two used the same settings.'}</p></div>` : ''}`;
    root.open = open;
    root.querySelectorAll('[data-compare]').forEach((box) => {
      box.onchange = () => {
        const id = Number(box.dataset.compare);
        if (box.checked) { compare.add(id); while (compare.size > 2) compare.delete(compare.values().next().value); } else compare.delete(id);
        render();
      };
    });
    const go = (attr, key) => root.querySelectorAll(`[${attr}]`).forEach((b) => (b.onclick = () => { const e = findExperiment(state, b.getAttribute(attr)); if (e && e.change[key].length) restore(e.change[key]); }));
    go('data-restore-before', 'before');
    go('data-restore-after', 'after');
  };
  render();
  return { render, add(entry) { const item = addExperiment(state, entry); save(); render(); return item; } };
}
