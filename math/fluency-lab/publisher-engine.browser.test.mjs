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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`);
  const root = page.locator('#fluency-lab-root');
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
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Core conceptual rule/);
  assert.equal(await page.evaluate(() => localStorage.getItem('ewl-fluency-publisher-mastery-v1')), null, 'viewing an explanation does not record mastery');
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Why that answer was tempting/);
  await audit('explanation');
  await root.locator('#sibling').click();
  assert.match(await root.locator('h2').textContent(), /24 cups of flour/);
  assert.equal(await root.locator('interactive-double-number-line').count(), 1, 'sibling transfers the ratio to a number line');
  await root.locator('#answer').fill('23');
  await root.locator('#check').click();
  assert.match(await root.locator('.hint').textContent(), /Ratios grow by multiplication/);
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
  await page.reload();
  for (const wrong of ['11', '7']) {
    await root.locator('#answer').fill(wrong);
    await root.locator('#check').click();
  }
  await root.locator('interactive-ratio-tape').locator('[data-track="A"][data-index="2"]').click();
  await root.locator('interactive-ratio-tape').locator('[data-track="B"][data-index="1"]').click();
  await root.locator('#sub-answer').fill('4');
  await root.locator('#sandbox-retry').click();
  assert.equal(await root.locator('#answer').count(), 1, 'concrete work clears the main answer for retry');
  await root.locator('#answer').fill('8');
  await root.locator('#check').click();
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Practice complete/);
  await page.reload();
  await root.locator('#answer').fill('8');
  await root.locator('#check').click();
  assert.match((await root.locator('h3').allTextContents()).join(' '), /Practice complete/, 'first correct answer commits mastery');
  const mastery = await page.evaluate(() => JSON.parse(localStorage.getItem('ewl-fluency-publisher-mastery-v1') || '[]').at(-1));
  assert.equal(mastery.independent, true, 'first-attempt mastery is recorded locally');
  assert.equal(mastery.attempts, 1);
  assert.equal('answer' in mastery, false, 'the stored record excludes the student response');
  for (const width of [768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
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
    const { adaptProportionItem } = await import('/src/components/MathFluencyLabEngine.js');
    const valid = adaptProportionItem({ question: 'Solve the proportion: 3/2 = 12/x.', answers: ['8'], skill: { standard: '7.RP.A.2' } });
    const invalid = adaptProportionItem({ question: 'Solve the proportion: 3/2 = 12/x.', answers: ['9'] });
    return { answer: valid?.correctAnswer, model: valid?.modelComponent, invalid };
  });
  assert.deepEqual(adapted, { answer: '8', model: 'interactive-double-number-line', invalid: null });
  await page.reload();
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
  assert.deepEqual(errors, [], 'no page errors');
  console.log('Publisher engine browser acceptance passed');
} finally {
  await browser?.close();
  await server.close();
}
