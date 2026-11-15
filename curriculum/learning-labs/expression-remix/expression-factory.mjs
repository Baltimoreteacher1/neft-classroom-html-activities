import { evaluate, SITUATIONS } from './factory-model.mjs';

export function mountExpressionFactory(host, { state, save }) {
  let current = state.expressionFactory;
  if (!current || !Number.isInteger(current.situation) || !SITUATIONS[current.situation] || !current.plans || typeof current.plans !== 'object') current = { situation: 0, plans: {} };
  state.expressionFactory = current;
  const section = document.createElement('section');
  section.className = 'expression-factory';
  section.setAttribute('aria-labelledby', 'factory-heading');
  section.innerHTML = `<p class="studio-eyebrow">Transfer · evaluate and compare expressions</p><h3 id="factory-heading">Expression factory</h3><p>Machine A groups or separates operations. Build Machine B’s rule and compare the outputs. The exponent counts repeated factors.</p><label for="factory-situation">Investigation</label><select id="factory-situation" data-situation></select><p data-prompt></p><div data-controls></div><p data-rules></p><label for="factory-prediction">Predict Machine A’s output</label><input id="factory-prediction" data-prediction type="text" inputmode="numeric" maxlength="4"><button type="button" data-run>Run the machines</button><p role="status" data-feedback></p><div data-result hidden><div class="factory-stage"><div><strong>Machine A</strong><p data-steps-a></p><output data-a></output></div><div><strong>Machine B</strong><p data-steps-b></p><output data-b></output></div></div><p data-comparison></p></div><label for="factory-explanation">Explain or revise the rule</label><textarea id="factory-explanation" data-explanation rows="3" maxlength="1000" placeholder="The grouping matters because…"></textarea><p>Your factory settings and explanation are saved with this lab in this browser.</p>`;
  host.append(section);
  const $ = (s) => section.querySelector(s), selector = $('[data-situation]');
  selector.innerHTML = SITUATIONS.map((s, i) => `<option value="${i}">${s.title}</option>`).join('');
  const specs = [['grouping', 'Machine A grouping', ['grouped', 'ungrouped']], ['a', 'Machine A multiplier', [2, 3, 4]], ['b', 'Machine A added amount', [1, 2, 3, 4]], ['base', 'Exponent base', [2, 3]], ['exponent', 'Exponent', [1, 2, 3]], ['x', 'Value of x', [1, 2, 3, 4, 5, 6]], ['multiplier', 'Machine B multiplier', [0, 1, 2, 3, 4, 5]], ['bonus', 'Machine B added amount', Array.from({ length: 21 }, (_, i) => i)]];
  $('[data-controls]').innerHTML = specs.map(([key, label, options]) => `<label for="factory-${key}">${label}</label><select id="factory-${key}" data-field="${key}">${options.map((n) => `<option value="${n}">${n === 'grouped' ? 'Group x and the added amount' : n === 'ungrouped' ? 'Add after multiplying x' : n}</option>`).join('')}</select>`).join('');
  function plan() {
    let p = current.plans[current.situation];
    try { evaluate(p); } catch { p = current.plans[current.situation] = { grouping: 'grouped', a: 2, b: 3, base: 2, exponent: 2, x: 4, multiplier: current.situation === 2 ? 3 : 2, bonus: current.situation === 2 ? 2 : 3, prediction: '', explanation: '', tested: false }; }
    return p;
  }
  function render() {
    const p = plan(), result = evaluate(p), ruleA = p.grouping === 'grouped' ? `${p.a}(x + ${p.b}) + ${p.base}^${p.exponent}` : `${p.a}x + ${p.b} + ${p.base}^${p.exponent}`;
    selector.value = current.situation; $('[data-prompt]').textContent = SITUATIONS[current.situation].prompt;
    section.querySelectorAll('[data-field]').forEach((control) => { control.value = p[control.dataset.field]; });
    $('[data-rules]').textContent = `A: ${ruleA}    B: ${p.multiplier}x + ${p.bonus} + ${p.base}^${p.exponent}`;
    $('[data-prediction]').value = p.prediction || ''; $('[data-explanation]').value = p.explanation || ''; $('[data-result]').hidden = !p.tested;
    if (!p.tested) { $('[data-feedback]').textContent = ''; return; }
    $('[data-feedback]').textContent = Number(p.prediction) === result.first ? 'Your prediction matches Machine A. Compare both rules and explain.' : `Your prediction was ${p.prediction}. Machine A produces ${result.first}. Follow the operations below and revise.`;
    const factors = Array(p.exponent).fill(p.base).join(' × ');
    $('[data-steps-a]').textContent = `${p.base}^${p.exponent} = ${factors} = ${result.power}. ${p.grouping === 'grouped' ? `First x + ${p.b} = ${p.x + p.b}; then ${p.a} × ${p.x + p.b}.` : `First ${p.a} × x = ${p.a * p.x}; then add ${p.b}.`} Add ${result.power}.`;
    $('[data-steps-b]').textContent = `${p.multiplier} × ${p.x} = ${p.multiplier * p.x}; then add ${p.bonus} and ${result.power}.`;
    $('[data-a]').textContent = `Output: ${result.first}`; $('[data-b]').textContent = `Output: ${result.second}`;
    let message = result.equivalent ? `The rules are equivalent for every x: both simplify to ${p.a}x + ${result.aBonus} + ${result.power}.` : `The rules are not equivalent: after simplifying, A has ${p.a}x + ${result.aBonus} + ${result.power}, and B has ${p.multiplier}x + ${p.bonus} + ${result.power}.`;
    if (!result.equivalent && result.first === result.second) message += ` They match at x = ${p.x}, but at x = ${result.anotherX}, A gives ${result.otherA} and B gives ${result.otherB}.`;
    $('[data-comparison]').textContent = message;
  }
  selector.addEventListener('change', () => { current.situation = Number(selector.value); save(); render(); });
  section.querySelectorAll('[data-field]').forEach((control) => control.addEventListener('change', () => { const p = plan(); p[control.dataset.field] = control.dataset.field === 'grouping' ? control.value : Number(control.value); p.prediction = ''; p.tested = false; save(); render(); $('[data-feedback]').textContent = 'The rule changed. Make a new prediction before running.'; }));
  $('[data-prediction]').addEventListener('input', (event) => { const p = plan(); p.prediction = event.target.value; p.tested = false; save(); $('[data-result]').hidden = true; $('[data-feedback]').textContent = ''; });
  $('[data-explanation]').addEventListener('input', (event) => { plan().explanation = event.target.value; save(); });
  $('[data-run]').addEventListener('click', () => { const p = plan(); if (!/^\d{1,4}$/.test(p.prediction)) { $('[data-feedback]').textContent = 'Enter a whole-number prediction before running.'; return; } p.tested = true; save(); render(); });
  render();
}
