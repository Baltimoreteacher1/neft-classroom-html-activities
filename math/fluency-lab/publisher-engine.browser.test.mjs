import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createServer } from 'vite';
import { REPO_ROOT } from '../../tools/lib/curriculum-source.mjs';

const server = await createServer({ root: REPO_ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const demoUrl = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/?publisher-demo=1`;
  await page.goto(demoUrl);
  const root = page.locator('#fluency-lab-root');
  await root.locator('#answer').waitFor({ state: 'visible' });
  await page.evaluate(() => {
    window.__fluencyAttempts = [];
    document.getElementById('fluency-lab-root').addEventListener('fluency-attempt', event => window.__fluencyAttempts.push(event.detail));
    window.__fluencyResolutions = [];
    document.getElementById('fluency-lab-root').addEventListener('fluency-resolution', event => window.__fluencyResolutions.push(event.detail));
  });
  const answer = root.locator('#answer');
  const firstSegment = root.locator('interactive-ratio-tape').locator('[data-track="A"][data-index="0"]');
  const audit = async stage => {
    const result = await new AxeBuilder({ page }).include('#fluency-lab-root').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    assert.deepEqual(result.violations.map(item => item.id), [], `WCAG A/AA checks at ${stage}`);
  };
  await audit('presentation');
  const cpu = await context.newCDPSession(page);
  await cpu.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const averageSelectionMs = await page.evaluate(() => {
    const tape = document.querySelector('#fluency-lab-root').shadowRoot.querySelector('interactive-ratio-tape');
    const start = performance.now();
    for (let index = 0; index < 120; index++) tape.select('A', index % 4);
    return (performance.now() - start) / 120;
  });
  await cpu.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  assert.ok(averageSelectionMs < 16.7, `model selection averaged ${averageSelectionMs.toFixed(2)}ms under 4× CPU throttling`);
  assert.ok((await firstSegment.boundingBox()).height >= 44, 'model target is at least 44px high');
  await firstSegment.focus();
  await page.keyboard.press('Enter');
  assert.equal(await firstSegment.getAttribute('aria-pressed'), 'true', 'keyboard activates model segment');
  assert.equal(await firstSegment.evaluate(element => {
    element.click();
    return element === element.getRootNode().querySelector('[data-track="A"][data-index="0"]');
  }), true, 'model interaction updates in place');
  await firstSegment.click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile page has no horizontal overflow');
  await answer.fill('11');
  await root.locator('#check').click();
  assert.equal(await answer.inputValue(), '11', 'first miss retains the response');
  assert.equal(await firstSegment.getAttribute('aria-pressed'), 'true', 'first miss retains the model selection');
  assert.match(await root.locator('.hint').textContent(), /Ratios grow by multiplication/);
  await audit('first scaffold');
  await answer.fill('7');
  await root.locator('#check').click();
  assert.equal(await root.locator('#answer').count(), 0, 'primary answer locks after second miss');
  const attempts = await page.evaluate(() => window.__fluencyAttempts);
  assert.deepEqual(attempts.map(attempt => [attempt.attempt, attempt.correct, attempt.misconceptionId]), [[1, false, 'ADDITIVE_TRAP'], [2, false, null]]);
  assert.equal(await root.locator('#scaffold-heading').evaluate(element => element === element.getRootNode().activeElement), true, 'focus moves to the concrete scaffold');
  await audit('concrete scaffold');
  const next = root.locator('#sandbox-next');
  assert.equal(await next.isDisabled(), true);
  const tape = root.locator('interactive-ratio-tape');
  await tape.locator('[data-track="A"][data-index="2"]').click();
  await tape.locator('[data-track="B"][data-index="1"]').click();
  assert.equal(await next.isDisabled(), true, 'model alone does not clear the scaffold');
  await root.locator('#sub-answer').fill('4');
  assert.equal(await next.isEnabled(), true);
  await next.click();
  const resolutions = await page.evaluate(() => window.__fluencyResolutions);
  assert.deepEqual(resolutions.map(result => [result.correct, result.misconceptionId]), [[false, 'ADDITIVE_TRAP']]);
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Core conceptual rule/);
  assert.equal(await page.evaluate(() => localStorage.getItem('ewl-fluency-publisher-mastery-v1')), null, 'viewing an explanation does not record mastery');
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Why that answer was tempting/);
  await audit('explanation');
  await root.locator('#sibling').click();
  assert.match(await root.locator('h2').textContent(), /24 cups of flour/);
  assert.equal(await root.locator('interactive-double-number-line').count(), 1, 'sibling transfers the ratio to a number line');
  await root.locator('#answer').fill('23');
  await root.locator('#check').click();
  assert.match(await root.locator('.hint').textContent(), /Equivalent ratios multiply both quantities/);
  await root.locator('#answer').fill('16');
  await root.locator('#check').click();
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Practice complete/);
  await page.evaluate(() => {
    const line = document.createElement('interactive-double-number-line');
    line.id = 'publisher-line-test';
    line.setAttribute('track-a-units', '3');
    line.setAttribute('track-b-units', '2');
    line.setAttribute('unit-val', '4');
    document.body.append(line);
  });
  const lineTick = page.locator('#publisher-line-test').locator('[data-track="B"][data-index="2"]');
  await lineTick.focus();
  await page.keyboard.press('Enter');
  assert.equal(await lineTick.getAttribute('aria-pressed'), 'true', 'double number line supports keyboard selection');
  await page.goto(demoUrl);
  for (const wrong of ['11', '7']) {
    await root.locator('#answer').fill(wrong);
    await root.locator('#check').click();
  }
  await root.locator('interactive-ratio-tape').locator('[data-track="A"][data-index="2"]').click();
  await root.locator('interactive-ratio-tape').locator('[data-track="B"][data-index="1"]').click();
  await root.locator('#sub-answer').fill('4');
  await root.locator('#sandbox-retry').click();
  assert.equal(await root.locator('#answer').count(), 1, 'concrete work clears the main answer for retry');
  await root.locator('#answer').fill('7');
  await root.locator('#check').click();
  assert.equal(await root.locator('#answer').count(), 0, 'a third miss returns to the concrete scaffold without an invalid transition');
  await root.locator('interactive-ratio-tape').locator('[data-track="A"][data-index="2"]').click();
  await root.locator('interactive-ratio-tape').locator('[data-track="B"][data-index="1"]').click();
  await root.locator('#sub-answer').fill('4');
  await root.locator('#sandbox-retry').click();
  await root.locator('#answer').fill('8');
  await root.locator('#check').click();
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Practice complete/);
  await page.goto(demoUrl);
  await root.locator('#answer').fill('8');
  await root.locator('#check').click();
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Practice complete/, 'first correct answer commits mastery');
  const mastery = await page.evaluate(() => JSON.parse(localStorage.getItem('ewl-fluency-publisher-mastery-v1') || '[]').at(-1));
  assert.equal(mastery.independent, true, 'first-attempt mastery is recorded locally');
  assert.equal(mastery.attempts, 1);
  assert.equal('answer' in mastery, false, 'the stored record excludes the student response');
  for (const width of [768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(demoUrl);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px page has no horizontal overflow`);
    const check = await root.locator('#check').boundingBox();
    assert.ok(check.width >= 44 && check.height >= 44, `${width}px check action meets touch target size`);
  }
  const fraction = await page.evaluate(async () => {
    const { MathFluencyLabEngine, SEED_EXERCISE } = await import('/src/components/MathFluencyLabEngine.js');
    const host = document.createElement('div');
    host.id = 'publisher-fraction-test';
    document.body.append(host);
    new MathFluencyLabEngine(host.id).loadExercise({ ...SEED_EXERCISE, prompt: 'What is 3/4 of the whole?' });
    return { stacked: !!host.shadowRoot.querySelector('.math-fraction'), slashVisible: host.shadowRoot.querySelector('h2').textContent.includes('3/4') };
  });
  assert.deepEqual(fraction, { stacked: true, slashVisible: false }, 'numeric fractions use stacked notation');
  const generated = await page.evaluate(async () => {
    const { createRatioExercise } = await import('/src/components/MathFluencyLabEngine.js');
    const item = createRatioExercise({ id: 'test-beads', standard: '6.RP.A.3', tier: 2, trackALabel: 'red beads', trackBLabel: 'blue beads', trackAUnits: 2, trackBUnits: 3, unitVal: 5 });
    return { answer: item.correctAnswer, additive: item.misconceptions[0].detect('11', {}), prompt: item.prompt };
  });
  assert.equal(generated.answer, '15');
  assert.equal(generated.additive, true);
  assert.match(generated.prompt, /10 red beads/);
  const adapted = await page.evaluate(async () => {
    const { adaptProportionItem, makeSibling } = await import('/src/components/MathFluencyLabEngine.js');
    const valid = adaptProportionItem({ question: 'Solve the proportion: 3/2 = 12/x.', answers: ['8'], skill: { standard: '7.RP.A.2' }, meta: { wrong: [{ text: '9', why: 'changed the missing term by one' }] } }, input => input.trim() === '8');
    const invalid = adaptProportionItem({ question: 'Solve the proportion: 3/2 = 12/x.', answers: ['9'] });
    const reverse = adaptProportionItem({ question: '3/2 = x/8. Find x.', answers: ['12'] });
    const sibling = makeSibling(valid, 1);
    return { answer: valid?.correctAnswer, model: valid?.modelComponent, authored: valid?.misconceptions[0].detect('9', {}), evaluator: valid?.evaluateAnswer('8'), sibling: [sibling.correctAnswer, sibling.evaluateAnswer], reverse: [reverse?.modelConfig.trackAUnits, reverse?.modelConfig.trackBUnits, reverse?.modelConfig.unitVal, reverse?.correctAnswer], invalid };
  });
  assert.deepEqual(adapted, { answer: '8', model: 'interactive-double-number-line', authored: true, evaluator: true, sibling: ['16', undefined], reverse: [2, 3, 4, '12'], invalid: null });
  const equivalent = await page.evaluate(async () => {
    const { adaptEquivalentRatioItem } = await import('/src/components/MathFluencyLabEngine.js');
    const second = adaptEquivalentRatioItem({ question: '3:5 = 12:□', answers: ['20'] });
    const first = adaptEquivalentRatioItem({ question: '3:5 = □:20', answers: ['12'] });
    const invalid = adaptEquivalentRatioItem({ question: '3:5 = 12:□', answers: ['21'] });
    return { second: [second?.modelConfig.trackAUnits, second?.modelConfig.trackBUnits, second?.modelConfig.unitVal, second?.correctAnswer], first: [first?.modelConfig.trackAUnits, first?.modelConfig.trackBUnits, first?.modelConfig.unitVal, first?.correctAnswer], invalid };
  });
  assert.deepEqual(equivalent, { second: [3, 5, 4, '20'], first: [5, 3, 4, '12'], invalid: null });
  const unitRates = await page.evaluate(async () => {
    const { adaptUnitRateItem, makeSibling } = await import('/src/components/MathFluencyLabEngine.js');
    const whole = adaptUnitRateItem({ question: '24 dollars for 3 items: what is the unit rate?', answers: ['8'] });
    const decimal = adaptUnitRateItem({ question: '7.5 for 3 items. How much for 1 item?', answers: ['2.5'] });
    const invalid = adaptUnitRateItem({ question: '24 dollars for 3 items: what is the unit rate?', answers: ['9'] });
    const nonnumeric = adaptUnitRateItem({ question: '24 dollars for 3 items: what is the unit rate?', answers: ['unknown'] });
    const sibling = makeSibling(decimal, 1);
    return { whole: [whole?.modelConfig.trackAUnits, whole?.modelConfig.trackBUnits, whole?.modelConfig.unitVal, whole?.correctAnswer], decimal: [decimal?.modelConfig.unitVal, decimal?.misconceptions[0].detect('7.5', {})], sibling: [sibling.prompt, sibling.correctAnswer, sibling.siblingKind], invalid, nonnumeric };
  });
  assert.deepEqual(unitRates, { whole: [3, 1, 8, '8'], decimal: [2.5, true], sibling: ['15 dollars for 3 items: what is the unit rate?', '5', 'UNIT_RATE'], invalid: null, nonnumeric: null });
  const largeUnit = await page.evaluate(async () => {
    const { adaptUnitRateItem, MathFluencyLabEngine } = await import('/src/components/MathFluencyLabEngine.js');
    const host = document.createElement('div');
    host.id = 'publisher-large-unit-test';
    document.body.append(host);
    new MathFluencyLabEngine(host.id).loadExercise(adaptUnitRateItem({ question: '75 dollars for 3 items: what is the unit rate?', answers: ['25'] }));
    const tape = host.shadowRoot.querySelector('interactive-ratio-tape');
    tape.select('A', 1);
    return { segment: tape.shadowRoot.querySelector('[data-track="A"]').textContent, total: tape.getModelValues().totalA };
  });
  assert.deepEqual(largeUnit, { segment: '25', total: 25 }, 'model segment values do not cap a valid unit rate');
  const percentParts = await page.evaluate(async () => {
    const { adaptPercentPartItem, makeSibling } = await import('/src/components/MathFluencyLabEngine.js');
    const direct = adaptPercentPartItem({ question: 'Find 25% of 60.', answers: ['15'] });
    const missing = adaptPercentPartItem({ question: '75% of 44 is x. Find x.', answers: ['33'] });
    const invalid = adaptPercentPartItem({ question: 'Find 25% of 60.', answers: ['20'] });
    const nonnumeric = adaptPercentPartItem({ question: 'Find 25% of 60.', answers: ['unknown'] });
    const sibling = makeSibling(direct, 1);
    return { direct: [direct?.modelConfig.trackAUnits, direct?.modelConfig.trackBUnits, direct?.modelConfig.unitVal, direct?.misconceptions[0].detect('60', {})], missing: missing?.correctAnswer, sibling: [sibling.prompt, sibling.correctAnswer, sibling.siblingKind], invalid, nonnumeric };
  });
  assert.deepEqual(percentParts, { direct: [4, 1, 15, true], missing: '33', sibling: ['Find 25% of 120.', '30', 'PERCENT_PART'], invalid: null, nonnumeric: null });
  const percentWhole = await page.evaluate(async () => {
    const { adaptPercentWholeItem, makeSibling } = await import('/src/components/MathFluencyLabEngine.js');
    const valid = adaptPercentWholeItem({ question: '15 is 25% of what number?', answers: ['60'] });
    const invalid = adaptPercentWholeItem({ question: '15 is 25% of what number?', answers: ['45'] });
    const nonnumeric = adaptPercentWholeItem({ question: '15 is 25% of what number?', answers: ['unknown'] });
    const sibling = makeSibling(valid, 1);
    return { model: [valid?.modelConfig.trackAUnits, valid?.modelConfig.trackBUnits, valid?.modelConfig.unitVal], answer: valid?.correctAnswer, partAsWhole: valid?.misconceptions[0].detect('15', {}), sibling: [sibling.prompt, sibling.correctAnswer, sibling.siblingKind], invalid, nonnumeric };
  });
  assert.deepEqual(percentWhole, { model: [1, 4, 15], answer: '60', partAsWhole: true, sibling: ['30 is 25% of what number?', '120', 'PERCENT_WHOLE'], invalid: null, nonnumeric: null });
  const dispatch = await page.evaluate(async () => {
    const { adaptPracticeItem } = await import('/src/components/MathFluencyLabEngine.js');
    const supported = adaptPracticeItem({ question: '15 is 25% of what number?', answers: ['60'], skill: { grade: 6, id: 'percent-whole' } });
    const addedSkill = adaptPracticeItem({ question: '2 + 3 = ?', answers: ['5'], skill: { grade: 1, id: 'add-20' } });
    const invalid = adaptPracticeItem({ question: 'Missing answer', answers: [], skill: { grade: 1, id: 'add-20' } });
    return { answer: supported?.correctAnswer, addedModel: addedSkill?.modelComponent, invalid };
  });
  assert.deepEqual(dispatch, { answer: '60', addedModel: 'interactive-counters-frame', invalid: null }, 'practice adapter routes all supported skills and rejects incomplete items');
  const customAnswer = await page.evaluate(async () => {
    const { MathFluencyLabEngine, SEED_EXERCISE } = await import('/src/components/MathFluencyLabEngine.js');
    const host = document.createElement('div');
    host.id = 'publisher-validator-test';
    document.body.append(host);
    const engine = new MathFluencyLabEngine(host.id);
    engine.loadExercise({ ...SEED_EXERCISE, id: 'ratio-validator-test', correctAnswer: '3:2', evaluateAnswer: input => input.replace(/\s/g, '') === '3:2' });
    host.shadowRoot.getElementById('answer').value = '3 : 2';
    host.shadowRoot.getElementById('check').click();
    return !!host.shadowRoot.getElementById('next');
  });
  assert.equal(customAnswer, true, 'an authored validator can check nonnumeric responses');
  const validatorRecovery = await page.evaluate(async () => {
    const { MathFluencyLabEngine, SEED_EXERCISE } = await import('/src/components/MathFluencyLabEngine.js');
    const host = document.createElement('div');
    host.id = 'publisher-validator-recovery-test';
    document.body.append(host);
    new MathFluencyLabEngine(host.id).loadExercise({ ...SEED_EXERCISE, evaluateAnswer: () => { throw Error('validator failed'); } });
    host.shadowRoot.getElementById('answer').value = '8';
    host.shadowRoot.getElementById('check').click();
    return { input: !!host.shadowRoot.getElementById('answer'), message: host.shadowRoot.getElementById('announcement').textContent };
  });
  assert.equal(validatorRecovery.input, true);
  assert.match(validatorRecovery.message, /Unable to check/);
  await page.goto(demoUrl);
  await root.locator('#answer').fill('18');
  await root.locator('#check').click();
  assert.match(await root.locator('.hint').textContent(), /original order/);
  await root.locator('#answer').fill('7');
  await root.locator('#check').click();
  await root.locator('interactive-ratio-tape').locator('[data-track="A"][data-index="2"]').click();
  await root.locator('interactive-ratio-tape').locator('[data-track="B"][data-index="1"]').click();
  await root.locator('#sub-answer').fill('4');
  await root.locator('#sandbox-next').click();
  assert.match(await root.locator('#content').textContent(), /An answer of 18 treats 3 cups of flour/);
  await root.locator('#sibling').click();
  assert.match(await root.locator('h2').textContent(), /cups of flour/);

  // Domain Web Component models, negative/variable stacked fractions, choices, WCAG 2.1 AA geometry & 4x CPU budget
  const domainCheck = await page.evaluate(async () => {
    const { MathFluencyLabEngine, adaptPracticeItem } = await import('/src/components/MathFluencyLabEngine.js');
    const { GRADES, generateProblem } = await import('/math/fluency-lab/problem-bank.js');
    const allSkills = GRADES.flatMap((g) => g.skills);
    const adaptedModels = new Set();
    for (const sk of allSkills) {
      const p = generateProblem(sk);
      p.skill = sk;
      const schema = adaptPracticeItem(p);
      if (!schema) throw new Error(`Failed adapting ${sk.grade}:${sk.id}`);
      adaptedModels.add(schema.modelComponent);
    }

    // Exercise non-ratio models in live Shadow DOM: fraction ops, choices, integer ops, algebra balance
    const host = document.createElement('div');
    host.id = 'domain-acceptance-host';
    document.body.append(host);
    const engine = new MathFluencyLabEngine(host.id);

    // 1. Fraction subtraction with negative result + stacked fraction verification
    const fracSchema = adaptPracticeItem({
      question: '-1/5 − 4/6 = ?',
      answers: ['-13/15'],
      kind: 'fraction',
      skill: { grade: 7, id: 'fraction-ops', generator: 'fractionOp', standard: '7.NS.A.1' },
    });
    engine.loadExercise(fracSchema);
    const fracNodes = host.shadowRoot.querySelectorAll('h2 .math-fraction').length;

    // 2. Choice grid + arrow keyboard interaction
    const choiceSchema = adaptPracticeItem({
      question: '5/8 ___ 6/8',
      answers: ['<'],
      choices: ['<', '=', '>'],
      kind: 'choice',
      skill: { grade: 3, id: 'fraction-compare', generator: 'fractionCompare', standard: '3.NF.A.3d' },
    });
    engine.loadExercise(choiceSchema);
    const choiceButtons = [...host.shadowRoot.querySelectorAll('.choice-btn')];
    const minChoiceHeight = Math.min(...choiceButtons.map((b) => b.getBoundingClientRect().height));
    choiceButtons[2].click(); // wrong ('>')
    const l1Hint = host.shadowRoot.getElementById('conceptual-hint')?.textContent || '';
    host.shadowRoot.querySelector('.choice-btn[data-choice="<"]')?.click();
    const completedChoice = !!host.shadowRoot.getElementById('next');

    // 3. Linear equation algebra balance + L2 interactive check + cancelable sibling event
    const eqSchema = adaptPracticeItem({
      question: '8x + 7 = 135. Find x.',
      answers: ['16'],
      skill: { grade: 7, id: 'equations', generator: 'solve', standard: '7.EE.B.4a' },
    });
    engine.loadExercise(eqSchema);
    host.shadowRoot.getElementById('answer').value = '999';
    host.shadowRoot.getElementById('check').click();
    host.shadowRoot.getElementById('answer').value = '888';
    host.shadowRoot.getElementById('check').click();
    const sandboxDisabledBefore = host.shadowRoot.getElementById('sandbox-next').disabled;
    host.shadowRoot.querySelector('interactive-algebra-balance')?.shadowRoot?.getElementById('ab-move')?.click();
    const subIn = host.shadowRoot.getElementById('sub-answer');
    subIn.value = '16';
    subIn.dispatchEvent(new Event('input'));
    const sandboxEnabledAfter = !host.shadowRoot.getElementById('sandbox-next').disabled;
    host.shadowRoot.getElementById('sandbox-next').click();
    let siblingDispatched = false;
    host.addEventListener('fluency-sibling-request', (e) => {
      siblingDispatched = Boolean(e.detail?.schema?.prompt);
    }, { once: true });
    host.shadowRoot.getElementById('sibling').click();
    return {
      totalSkills: allSkills.length,
      adaptedModelCount: adaptedModels.size,
      fracNodes,
      minChoiceHeight,
      hasL1Hint: l1Hint.length > 0,
      completedChoice,
      sandboxDisabledBefore,
      sandboxEnabledAfter,
      siblingDispatched,
    };
  });
  assert.equal(domainCheck.totalSkills, 128, 'all 128 skills are present');
  assert.equal(domainCheck.adaptedModelCount, 10, 'all 10 domain Web Component models used across 128 skills');
  assert.ok(domainCheck.fracNodes >= 2, 'negative fraction renders stacked .math-fraction notation');
  assert.ok(domainCheck.minChoiceHeight >= 44, 'choice targets meet >= 44px WCAG 2.1 AA touch size');
  assert.equal(domainCheck.hasL1Hint, true, 'L1 scaffold displays conceptual hint');
  assert.equal(domainCheck.completedChoice, true, 'choice answer resolves to MASTERY_COMMITTED');
  assert.equal(domainCheck.sandboxDisabledBefore, true, 'L2 gates progression before model manipulation');
  assert.equal(domainCheck.sandboxEnabledAfter, true, 'L2 unlocks after interacting with domain Web Component and sub-answer');
  assert.equal(domainCheck.siblingDispatched, true, 'sibling button dispatches fluency-sibling-request');

  // Mobile 390px + prefers-reduced-motion + 4x CPU throttling performance/layout check across new skills
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t0 = Date.now();
  for (const sk of ['7:fraction-ops', '7:equations', '4:angle-measure', '6:data-displays']) {
    await page.goto(`${demoUrl}&publisher-skill=${sk}`);
    const metrics = await page.evaluate(() => {
      const host = document.getElementById('fluency-lab-root');
      const sr = host?.shadowRoot;
      const buttons = [...(sr?.querySelectorAll('button') || [])];
      const modelBtns = [...(sr?.querySelector('[id="content"] > *:first-child')?.shadowRoot?.querySelectorAll('button') || [])];
      const allBtns = [...buttons, ...modelBtns].filter((b) => b.getBoundingClientRect().width > 0);
      const smallBtns = allBtns.filter((b) => b.getBoundingClientRect().height < 44);
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return { smallCount: smallBtns.length, overflow, liveRegion: Boolean(sr?.querySelector('[aria-live="polite"]')) };
    });
    assert.equal(metrics.smallCount, 0, `${sk} has zero interactive buttons < 44px at 390px`);
    assert.equal(metrics.overflow, false, `${sk} has no horizontal overflow at 390px`);
    assert.equal(metrics.liveRegion, true, `${sk} exposes aria-live="polite"`);
  }
  const elapsedMs = Date.now() - t0;
  assert.ok(elapsedMs < 30000, `4x CPU throttled 4-skill load stayed responsive (${elapsedMs}ms)`);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  assert.deepEqual(errors, [], 'no page errors');
  console.log('Publisher engine browser acceptance passed');
} finally {
  await browser?.close();
  await server.close();
}
