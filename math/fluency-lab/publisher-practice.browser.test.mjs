import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { REPO_ROOT } from '../../tools/lib/curriculum-source.mjs';

const server = await createServer({ root: REPO_ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const errors = [];
  const openPractice = async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => { Math.random = () => 0.5; });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/?grade=7&skill=proportions&start=practice`);
    await page.locator('#publisher-practice-root').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#answer-form').isHidden(), true, 'legacy answer form is replaced during publisher practice');
    assert.equal(await page.locator('#question').isHidden(), true, 'the prompt appears once in the publisher workspace');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'publisher practice fits a phone viewport');
    const values = await page.locator('#publisher-practice-root').evaluate(host => {
      const fractions = [...host.shadowRoot.querySelectorAll('h2 .math-fraction')].map(f => [Number(f.querySelector('.math-fraction-num').textContent), Number(f.querySelector('.math-fraction-den').textContent)]);
      return { fractions, prompt: host.shadowRoot.querySelector('h2').innerHTML };
    });
    assert.equal(values.fractions.length, 2, values.prompt);
    return { context, page, host: page.locator('#publisher-practice-root'), answer: String(values.fractions[0][0] * values.fractions[1][1] / values.fractions[0][1]), unit: String(values.fractions[1][1] / values.fractions[0][1]) };
  };
  const success = await openPractice();
  await success.host.locator('#answer').fill(success.answer);
  await success.host.locator('#check').click();
  await success.page.locator('#next-problem').waitFor({ state: 'visible' });
  assert.equal(await success.page.locator('#answer-form').isVisible(), true, 'session Next remains available after mastery');
  assert.equal(await success.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'completed practice fits a phone viewport');
  const successSession = await success.page.evaluate(() => JSON.parse(localStorage.getItem('ewl-fluency-session-v2') || 'null'));
  assert.equal(successSession?.session.answered, 1, 'publisher result advances the normal practice session');
  assert.equal(successSession?.session.correct, 1, 'correct publisher result enters normal practice score');
  await success.page.locator('#next-problem').click();
  assert.equal(await success.page.locator('#publisher-practice-root').count() <= 1, true, 'the next item does not retain the previous publisher workspace');
  assert.equal(await success.page.locator('#answer-form').getAttribute('data-publisher-complete'), null, 'the completion layout resets for the next item');
  await success.context.close();
  const miss = await openPractice();
  await miss.host.locator('#answer').fill('999');
  await miss.host.locator('#check').click();
  assert.equal(await miss.host.locator('#answer').inputValue(), '999');
  await miss.page.goto(`http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/?grade=7&skill=proportions&stage=practice`);
  await miss.page.locator('#publisher-practice-root').waitFor({ state: 'visible' });
  assert.match(await miss.host.locator('#conceptual-hint').textContent(), /Check the equal segment value|Equivalent ratios|Keep the two quantities|That answer/, 'the conceptual scaffold survives session resume');
  await miss.host.locator('#answer').fill('998');
  await miss.host.locator('#check').click();
  assert.equal(await miss.host.locator('#answer').count(), 0, 'main equation input is locked after two misses');
  const model = miss.host.locator('interactive-double-number-line');
  await model.locator('[data-track="A"]').last().click();
  await model.locator('[data-track="B"]').last().click();
  await miss.host.locator('#sub-answer').fill(miss.unit);
  await miss.host.locator('#sandbox-next').click();
  await miss.page.locator('#next-problem').waitFor({ state: 'visible' });
  const missedSession = await miss.page.evaluate(() => JSON.parse(localStorage.getItem('ewl-fluency-session-v2') || 'null'));
  assert.equal(missedSession?.session.answered, 1);
  assert.equal(missedSession?.session.correct, 0, 'explanation does not inflate normal practice mastery');
  assert.match(await miss.host.locator('#content').textContent(), /Core conceptual rule/);
  await miss.context.close();
  assert.deepEqual(errors, [], 'normal practice and publisher engine have no page errors');
  console.log('Publisher practice bridge browser acceptance passed');
} finally {
  await browser?.close();
  await server.close();
}
