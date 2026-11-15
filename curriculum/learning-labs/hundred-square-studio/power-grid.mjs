import { allocate, feedback, fraction, SCENARIOS } from './grid-model.mjs';

export function mountPowerGrid(host, { state, save }) {
  let current = state.powerAllocation;
  if (!current || !Number.isInteger(current.scenario) || !SCENARIOS[current.scenario] || !current.plans || typeof current.plans !== 'object') current = { scenario: 0, plans: {} };
  state.powerAllocation = current;
  const section = document.createElement('section');
  section.className = 'power-allocation';
  section.setAttribute('aria-labelledby', 'power-grid-heading');
  section.innerHTML = `<p class="studio-eyebrow">Transfer · fractions, decimals and percents</p><h3 id="power-grid-heading">Share the power</h3><p>One hundred equal units are available. Set a proposed allocation for the clinic, school and park. Each unit is 1% of the supply.</p><label for="power-scenario">Situation</label><select id="power-scenario" data-scenario></select><p data-prompt></p><div data-controls></div><label for="power-prediction">Predict: will units remain, fit exactly, or exceed the limit?</label><select id="power-prediction" data-prediction><option value="">Choose a prediction</option><option value="under">Some units left over</option><option value="exact">Exactly 100 units used</option><option value="over">Demand exceeds 100 units</option></select><button type="button" data-run>Test this allocation</button><p role="status" data-feedback></p><div data-result hidden><p data-total></p><svg class="power-grid-drawing" data-grid viewBox="0 0 330 330" role="img"></svg><p>Grid: C = clinic, S = school, P = park, blank = unused. If demand exceeds 100, the grid shows only the first 100 proposed units; the shortage is stated above.</p><ul data-representations></ul></div><label for="power-explanation">Explain a tradeoff or revision</label><textarea id="power-explanation" data-explanation rows="3" maxlength="1000" placeholder="I changed the allocation because…"></textarea><p>Your allocation and explanation are saved with this lab in this browser.</p>`;
  host.append(section);
  const $ = (s) => section.querySelector(s), scenario = $('[data-scenario]');
  const areas = [['clinic', 'Clinic'], ['school', 'School'], ['park', 'Park']];
  scenario.innerHTML = SCENARIOS.map((item, i) => `<option value="${i}">${item.title}</option>`).join('');
  $('[data-controls]').innerHTML = areas.map(([key, label]) => `<label for="power-${key}">${label} units</label><select id="power-${key}" data-allocation="${key}">${Array.from({ length: 21 }, (_, i) => `<option value="${i * 5}">${i * 5}</option>`).join('')}</select>`).join('');
  function plan() {
    let p = current.plans[current.scenario];
    if (!p || !areas.every(([key]) => Number.isInteger(p[key]) && p[key] >= 0 && p[key] <= 100 && p[key] % 5 === 0)) p = current.plans[current.scenario] = { clinic: 40, school: 35, park: 30, prediction: '', explanation: '', tested: false };
    return p;
  }
  function grid(a) {
    const cells = [];
    for (let i = 0; i < 100; i++) {
      const kind = i < a.clinic ? 'clinic' : i < a.clinic + a.school ? 'school' : i < a.total ? 'park' : 'unused';
      const symbol = { clinic: 'C', school: 'S', park: 'P', unused: '' }[kind], x = (i % 10) * 32 + 5, y = Math.floor(i / 10) * 32 + 5;
      cells.push(`<rect class="power-cell-${kind}" x="${x}" y="${y}" width="29" height="29"/><text x="${x + 14.5}" y="${y + 20}" text-anchor="middle">${symbol}</text>`);
    }
    const svg = $('[data-grid]');
    svg.setAttribute('aria-label', `Proposed units: clinic ${a.clinic}, school ${a.school}, park ${a.park}. Total ${a.total}. ${a.shortage ? `Demand exceeds supply by ${a.shortage}.` : `${a.surplus} units unused.`}`);
    svg.innerHTML = cells.join('');
  }
  function render() {
    const p = plan(), a = allocate(p.clinic, p.school, p.park);
    scenario.value = current.scenario; $('[data-prompt]').textContent = SCENARIOS[current.scenario].prompt;
    for (const [key] of areas) $(`[data-allocation="${key}"]`).value = p[key];
    $('[data-prediction]').value = p.prediction || ''; $('[data-explanation]').value = p.explanation || '';
    $('[data-result]').hidden = !p.tested;
    if (!p.tested) { $('[data-feedback]').textContent = ''; return; }
    const actual = a.shortage ? 'over' : a.surplus ? 'under' : 'exact';
    $('[data-feedback]').textContent = `${p.prediction === actual ? 'Your prediction matches the total.' : 'Compare your prediction with the total.'} ${feedback(current.scenario, a)}`;
    $('[data-total]').textContent = `Proposed: ${a.clinic} + ${a.school} + ${a.park} = ${a.total} units. Supply: 100 units. ${a.shortage ? `${a.shortage} units over the limit.` : `${a.surplus} units remain.`}`;
    $('[data-representations]').innerHTML = areas.map(([key, label]) => `<li>${label}: ${a[key]}/100 = ${fraction(a[key])} = ${(a[key] / 100).toFixed(2)} = ${a[key]}% of the supply.</li>`).join('');
    grid(a);
  }
  scenario.addEventListener('change', () => { current.scenario = Number(scenario.value); save(); render(); });
  section.querySelectorAll('[data-allocation]').forEach((control) => control.addEventListener('change', () => { const p = plan(); p[control.dataset.allocation] = Number(control.value); p.tested = false; p.prediction = ''; save(); render(); $('[data-feedback]').textContent = 'The allocation changed. Make a new prediction before testing.'; }));
  $('[data-prediction]').addEventListener('change', (event) => { const p = plan(); p.prediction = event.target.value; p.tested = false; save(); render(); });
  $('[data-explanation]').addEventListener('input', (event) => { plan().explanation = event.target.value; save(); });
  $('[data-run]').addEventListener('click', () => { const p = plan(); if (!['under', 'exact', 'over'].includes(p.prediction)) { $('[data-feedback]').textContent = 'Choose a prediction before testing.'; return; } p.tested = true; save(); render(); });
  render();
}
