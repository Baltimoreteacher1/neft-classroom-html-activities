import { design, evaluate, SITUATIONS } from './district-model.mjs';

export function mountDistrictDesign(host, { state, save }) {
  let current = state.districtDesign;
  if (!current || !Number.isInteger(current.situation) || !SITUATIONS[current.situation] || typeof current.plans !== 'object' || !current.plans) current = { situation: 0, plans: {} };
  state.districtDesign = current;
  const section = document.createElement('section');
  section.className = 'district-design';
  section.setAttribute('aria-labelledby', 'district-heading');
  section.innerHTML = `<p class="studio-eyebrow">Transfer · area and volume</p><h3 id="district-heading">Build the district</h3><p>Use the box model to design buildings. Their footprint is the area of the base; their capacity is the volume inside.</p><label for="district-situation">Design challenge</label><select id="district-situation" data-situation></select><p data-prompt></p><div class="district-controls"><label for="district-length">Length (units)</label><select id="district-length" data-length></select><label for="district-width">Width (units)</label><select id="district-width" data-width></select><label for="district-height">Height (units)</label><select id="district-height" data-height></select></div><label for="district-prediction">Predict the capacity (cubic units)</label><input id="district-prediction" data-prediction type="text" inputmode="numeric" pattern="[0-9]+" maxlength="3"><button type="button" data-check>Test this design</button><p role="status" data-feedback></p><div data-result hidden><svg data-drawing class="district-drawing" viewBox="0 0 360 240" role="img"></svg><p data-math></p></div><label for="district-explanation">Explain or revise your design</label><textarea id="district-explanation" data-explanation rows="3" maxlength="1000" placeholder="I changed the dimensions because…"></textarea><p>Your design and explanation are saved with this lab in this browser.</p>`;
  host.append(section);
  const $ = (s) => section.querySelector(s), selector = $('[data-situation]');
  const controls = ['length', 'width', 'height'].map((name) => [$(`[data-${name}]`), name]);
  selector.innerHTML = SITUATIONS.map((item, i) => `<option value="${i}">${item.name}</option>`).join('');
  for (const [control] of controls) control.innerHTML = [1, 2, 3, 4, 5, 6].map((n) => `<option>${n}</option>`).join('');
  function plan() {
    let p = current.plans[current.situation];
    if (!p || !['length', 'width', 'height'].every((key) => Number.isInteger(p[key]) && p[key] >= 1 && p[key] <= 6)) p = current.plans[current.situation] = { length: 3, width: 4, height: 2, prediction: '', explanation: '', tested: false };
    return p;
  }
  function paint(d) {
    const x = 75, y = 180, dx = d.length * 28, wx = d.width * 13, wy = d.width * 9, h = d.height * 20;
    const points = (pairs) => pairs.map((pair) => pair.join(',')).join(' ');
    const base = [[x, y], [x + dx, y], [x + dx + wx, y - wy], [x + wx, y - wy]];
    const roof = base.map(([px, py]) => [px, py - h]);
    const svg = $('[data-drawing]');
    svg.setAttribute('aria-label', `Rectangular building: length ${d.length}, width ${d.width}, height ${d.height}. Base area ${d.footprint} square units. Volume ${d.volume} cubic units.`);
    svg.innerHTML = `<polygon points="${points([base[0], base[1], roof[1], roof[0]])}" fill="#76b9b2" stroke="#17324d" stroke-width="2"/><polygon points="${points([base[1], base[2], roof[2], roof[1]])}" fill="#1f7180" stroke="#17324d" stroke-width="2"/><polygon points="${points(roof)}" fill="#f2c15b" stroke="#17324d" stroke-width="2"/><text x="${x + dx / 2}" y="205" text-anchor="middle">length ${d.length}</text><text x="${x + dx + wx}" y="${y - wy + 22}" text-anchor="middle">width ${d.width}</text><text x="20" y="${Math.max(20, y - h / 2)}">height ${d.height}</text>`;
  }
  function render() {
    const p = plan(), d = design(p.length, p.width, p.height), situation = SITUATIONS[current.situation];
    selector.value = current.situation; $('[data-prompt]').textContent = situation.prompt;
    for (const [control, name] of controls) control.value = p[name];
    $('[data-prediction]').value = p.prediction || '';
    $('[data-explanation]').value = p.explanation || '';
    $('[data-result]').hidden = !p.tested;
    if (!p.tested) { $('[data-feedback]').textContent = ''; return; }
    const feedback = { met: 'This design meets the challenge. Explain why, then compare another design.', volume: 'The volume does not meet the 24-cubic-unit condition yet. Change a dimension and test again.', footprint: 'The footprint is larger than 12 square units. Reduce the length or width.', height: 'The height is above 4 units. Lower it and reconsider the base.', capacity: 'The site fits, but the capacity is below 36 cubic units. Try another base or height.', 'same-footprint': 'The volume is 24, but the footprint is still 12. Find a different base area.' };
    $('[data-feedback]').textContent = `${Number(p.prediction) === d.volume ? 'Your capacity prediction matches.' : `Your prediction was ${p.prediction}; the capacity is ${d.volume} cubic units.`} ${feedback[evaluate(current.situation, d)]}`;
    $('[data-math]').textContent = `Footprint: ${d.length} × ${d.width} = ${d.footprint} square units. Capacity: ${d.footprint} × ${d.height} = ${d.volume} cubic units.`;
    paint(d);
  }
  selector.addEventListener('change', () => { current.situation = Number(selector.value); save(); render(); });
  for (const [control, name] of controls) control.addEventListener('change', () => { const p = plan(); p[name] = Number(control.value); p.tested = false; p.prediction = ''; save(); render(); $('[data-feedback]').textContent = 'A dimension changed. Make a new prediction before testing.'; });
  $('[data-prediction]').addEventListener('input', (event) => { const p = plan(); p.prediction = event.target.value; p.tested = false; save(); $('[data-result]').hidden = true; $('[data-feedback]').textContent = ''; });
  $('[data-explanation]').addEventListener('input', (event) => { plan().explanation = event.target.value; save(); });
  $('[data-check]').addEventListener('click', () => { const p = plan(); if (!/^\d{1,3}$/.test(p.prediction)) { $('[data-feedback]').textContent = 'Enter a whole-number capacity prediction before testing.'; return; } p.tested = true; save(); render(); });
  render();
}
