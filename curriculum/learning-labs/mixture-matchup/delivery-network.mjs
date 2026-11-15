import { RATES, SCENARIOS, compare, journey, minutes, progressAt } from './delivery-model.mjs';

/** A transfer investigation embedded in the lab; it uses the lab's own saved state. */
export function mountDeliveryNetwork(host, { state, save }) {
  const prior = state.deliveryNetwork;
  const current = prior && Number.isInteger(prior.scenario) && prior.scenario >= 0 && prior.scenario < SCENARIOS.length ? prior : { scenario: 0, plans: {} };
  current.plans ||= {};
  state.deliveryNetwork = current;
  const section = document.createElement('section');
  section.className = 'delivery-network';
  section.setAttribute('aria-labelledby', 'delivery-heading');
  section.innerHTML = `<p class="studio-eyebrow">Transfer · compare unit rates</p><h3 id="delivery-heading">Delivery network</h3><p>Use the same rate reasoning from paint mixtures to compare journeys. Predict, test, and revise your plans.</p><label for="delivery-scenario">Situation</label><select id="delivery-scenario" data-scenario></select><p data-context></p><div class="delivery-plans"><label for="delivery-route-a">Plan A route</label><select id="delivery-route-a" data-route-a></select><label for="delivery-a">Plan A speed (miles per hour)</label><select id="delivery-a" data-a></select><label for="delivery-route-b">Plan B route</label><select id="delivery-route-b" data-route-b></select><label for="delivery-b">Plan B speed (miles per hour)</label><select id="delivery-b" data-b></select></div><fieldset><legend>Predict: which plan arrives first?</legend><label><input type="radio" name="delivery-prediction" value="a"> Plan A</label><label><input type="radio" name="delivery-prediction" value="b"> Plan B</label><label><input type="radio" name="delivery-prediction" value="tie"> They tie</label></fieldset><button type="button" data-run>Run the comparison</button><p role="status" data-feedback></p><div data-results hidden><p data-equations></p><label for="delivery-time">Move through the journey</label><input id="delivery-time" data-time type="range" min="0" step="60"><output for="delivery-time" data-clock></output><svg class="delivery-map" viewBox="0 0 600 125" role="img" aria-label="Two delivery routes; the positions show how much of each route has been traveled."><path d="M85 35 H550 M85 90 H550" stroke="#1f7180" stroke-width="6" stroke-linecap="round"/><text x="10" y="41">Plan A</text><text x="10" y="96">Plan B</text><circle data-dot-a cy="35" r="10" fill="#17324d"/><circle data-dot-b cy="90" r="10" fill="#a45712"/><text x="85" y="18">Start</text><text x="500" y="18">Destination</text></svg><p data-position></p></div><label for="delivery-explain">Explain and revise</label><textarea id="delivery-explain" data-explain rows="3" maxlength="1000" placeholder="The plan arrives first because…"></textarea><p class="delivery-note">Your plans and explanation are saved with this lab in this browser.</p>`;
  host.append(section);
  const $ = (selector) => section.querySelector(selector);
  const scenarioSelect = $('[data-scenario]'), speedA = $('[data-a]'), speedB = $('[data-b]');
  const routeA = $('[data-route-a]'), routeB = $('[data-route-b]');
  scenarioSelect.innerHTML = SCENARIOS.map((s, i) => `<option value="${i}">${s.name}</option>`).join('');
  for (const select of [speedA, speedB]) select.innerHTML = RATES.map((rate) => `<option value="${rate}">${rate} mph</option>`).join('');
  function plan() {
    const s = SCENARIOS[current.scenario];
    let p = current.plans[current.scenario];
    if (!p || !RATES.includes(p.a) || !RATES.includes(p.b)) p = current.plans[current.scenario] = { a: s.defaults[0], b: s.defaults[1], distanceA: s.distances[0], distanceB: s.distances[1], prediction: '', explanation: '', ran: false };
    if (!s.routes.includes(p.distanceA)) p.distanceA = s.distances[0];
    if (!s.routes.includes(p.distanceB)) p.distanceB = s.distances[1];
    return p;
  }
  function drawPosition() {
    const p = plan(), a = journey(p.distanceA, p.a), b = journey(p.distanceB, p.b), t = Number($('[data-time]').value);
    $('[data-clock]').textContent = `Elapsed: ${minutes(t)}`;
    $('[data-dot-a]').setAttribute('cx', String(85 + 465 * progressAt(a, t)));
    $('[data-dot-b]').setAttribute('cx', String(85 + 465 * progressAt(b, t)));
    $('[data-position]').textContent = `At ${minutes(t)}: Plan A has traveled ${Math.min(p.distanceA, p.a * t / 3600).toFixed(1)} of ${p.distanceA} miles; Plan B has traveled ${Math.min(p.distanceB, p.b * t / 3600).toFixed(1)} of ${p.distanceB} miles.`;
  }
  function render() {
    const p = plan(), s = SCENARIOS[current.scenario], a = journey(p.distanceA, p.a), b = journey(p.distanceB, p.b);
    scenarioSelect.value = current.scenario; speedA.value = p.a; speedB.value = p.b;
    for (const [select, key] of [[routeA, 'distanceA'], [routeB, 'distanceB']]) { select.innerHTML = s.routes.map((distance) => `<option value="${distance}">${distance} miles</option>`).join(''); select.value = p[key]; }
    $('[data-context]').textContent = s.context;
    section.querySelectorAll('[name="delivery-prediction"]').forEach((radio) => { radio.checked = radio.value === p.prediction; });
    $('[data-explain]').value = typeof p.explanation === 'string' ? p.explanation : '';
    $('[data-results]').hidden = !p.ran;
    if (!p.ran) { $('[data-feedback]').textContent = ''; return; }
    const winner = compare(a, b), correct = winner === p.prediction;
    $('[data-feedback]').textContent = `${correct ? 'Your prediction matches the travel times.' : 'Compare the travel times and revise your prediction.'} ${winner === 'tie' ? 'The plans arrive together.' : `Plan ${winner.toUpperCase()} arrives first.`}${s.deadline ? ` Deadline: ${s.deadline} minutes. ${a.seconds <= s.deadline * 60 ? 'A meets it' : 'A is late'}; ${b.seconds <= s.deadline * 60 ? 'B meets it' : 'B is late'}.` : ''}`;
    $('[data-equations]').textContent = `A: ${a.distance} miles ÷ ${a.rate} mph = ${minutes(a.seconds)}. B: ${b.distance} miles ÷ ${b.rate} mph = ${minutes(b.seconds)}. Divide distance by speed to find time.`;
    const slider = $('[data-time]'); slider.max = String(Math.max(a.seconds, b.seconds)); slider.value = String(Math.max(a.seconds, b.seconds)); drawPosition();
  }
  scenarioSelect.addEventListener('change', () => { current.scenario = Number(scenarioSelect.value); save(); render(); });
  for (const [select, key] of [[speedA, 'a'], [speedB, 'b']]) select.addEventListener('change', () => { const p = plan(); p[key] = Number(select.value); p.ran = false; p.prediction = ''; save(); render(); $('[data-feedback]').textContent = 'The plan changed. Make a new prediction before running it.'; });
  for (const [select, key] of [[routeA, 'distanceA'], [routeB, 'distanceB']]) select.addEventListener('change', () => { const p = plan(); p[key] = Number(select.value); p.ran = false; p.prediction = ''; save(); render(); $('[data-feedback]').textContent = 'The route changed. Make a new prediction before running it.'; });
  section.querySelectorAll('[name="delivery-prediction"]').forEach((radio) => radio.addEventListener('change', () => { const p = plan(); p.prediction = radio.value; p.ran = false; save(); render(); }));
  $('[data-run]').addEventListener('click', () => { const p = plan(); if (!p.prediction) { $('[data-feedback]').textContent = 'Choose a prediction first, then run the comparison.'; return; } p.ran = true; save(); render(); });
  $('[data-time]').addEventListener('input', drawPosition);
  $('[data-explain]').addEventListener('input', (event) => { plan().explanation = event.target.value; save(); });
  render();
}
