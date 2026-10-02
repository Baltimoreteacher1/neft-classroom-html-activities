const {chromium}=require('@playwright/test');const assert=require('node:assert/strict');
const base = process.env.GAME_STUDIO_BASE_URL || 'http://127.0.0.1:4179';
// Run against a local Vite server: GAME_STUDIO_BASE_URL=http://127.0.0.1:4179 node tests/phaser-studio-browser.cjs
// Fixtures drive each game's native math controls, then its real grading/round code.
const games={'u1-decimal-dash':'ddGame','u2-fraction-frenzy':'ffGame','u3-ratio-rush':'rrGame','u4-percent-power':'ppGame','u5-area-attack':'aaGame','u6-expression-express':'eeGame','u7-equation-quest':'eqGame','u8-data-dash':'ddGame','u9-coordinate-quest':'cqGame','u10-volume-blast':'vbGame'};
const solve={
'u1-decimal-dash':`s.beads.forEach(b=>s.setBeadIndex(b,b.targetIdx));`,
'u2-fraction-frenzy':`s.setParts(s.problem.targetParts);s.setShaded(s.problem.targetShaded);`,
'u3-ratio-rush':`s.setKnob('top',s.problem.targetTop);s.setKnob('bottom',s.problem.targetBot);`,
'u4-percent-power':`s.setMarker(s.problem.targetPct);`,
'u5-area-attack':`s.problem.cells.forEach(k=>{const [c,r]=k.split(',').map(Number);s.commitRect(c,r,c,r);});`,
'u6-expression-express':`const used=new Set();s.problem.solution.forEach((t,i)=>{const tile=s.tiles.find(o=>!used.has(o.id)&&o.kind===t.kind&&o.label===t.label);if(!tile)throw Error('Missing solution tile');used.add(tile.id);s.assign(tile,i);});`,
'u7-equation-quest':`if(s.B>0){s.setOp('sub');s.opAmt=s.B;s.applyOp();}if(s.A>1){s.setOp('div');s.opAmt=s.A;s.applyOp();}`,
'u8-data-dash':`const counts=s.given.slice();let found=null;const visit=(index,left)=>{if(found)return; if(index===counts.length){if(targetMet(counts,s.lo,s.problem)&&counts.reduce((a,b)=>a+b,0)>s.given.reduce((a,b)=>a+b,0))found=counts.slice();return;}for(let n=0;n<=left;n++){counts[index]=s.given[index]+n;visit(index+1,left-n);}};visit(0,6);if(!found)throw Error('No solution');found.forEach((n,i)=>{while(s.counts[i]<n)s.addDot(i);});`,
'u9-coordinate-quest':`s.setMarker(s.problem.tx,s.problem.ty);`,
'u10-volume-blast':`const goal=correctBuild(s.problem);for(const d of ['l','w','h']){while(s.built[d]<goal[d])s.changeDim(d,1);while(s.built[d]>goal[d])s.changeDim(d,-1);}`};
async function verifyCabinet(browser, id, game) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base + '/math/games/' + id + '/');
    await page.waitForFunction(`${game}.scene.isActive('Title')`);
    await page.evaluate(`${game}.scene.getScenes(true).forEach(s => ${game}.scene.stop(s.sys.settings.key)); ${game}.scene.start('Game', {level: 1});`);
    await page.waitForFunction(`!!${game}.scene.getScene('Game').problem && !!${game}.scene.getScene('Game').feedback`);
    await page.evaluate(`{ const s = ${game}.scene.getScene('Game'); ${solve[id]} s.lockIn(); }`);
    await page.waitForTimeout(900);
    assert.equal(await page.evaluate(`${game}.scene.getScene('Game').solved`), 1, id + ': native grader');
    assert.equal(await page.locator('.cabinet-next').isVisible(), true, id + ': explanation remains');
    await page.locator('.cabinet-next').click();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(`!${game}.scene.getScene('Game').locked`), true, id + ': next round unlocks');

    // Level changes preserve the vocabulary gate. Complete it before checking
    // that the chosen mode drives the native generator and resets the score.
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('.cabinet-levels [data-level="2"]').click();
    assert.equal(await page.evaluate(() => window.GameStudio.paused), false, id + ': level change resumes before restart');
    await page.waitForTimeout(300);
    for (let card = 0; card < 12; card++) {
      const name = await page.evaluate(`${game}.scene.getScenes(true)[0]?.sys.settings.key`);
      if (name !== 'Vocab') break;
      await page.locator('.cabinet-controls button').filter({ hasText: 'Next word' }).click();
      await page.waitForTimeout(100);
    }
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('.cabinet-levels [data-level="2"]').click();
    assert.equal(await page.evaluate(() => window.GameStudio.paused), false, id + ': level change resumes before restart');
    await page.waitForFunction(`${game}.scene.isActive('Game') && !!${game}.scene.getScene('Game').problem`);
    const mode = await page.evaluate(`(() => {
      const s = ${game}.scene.getScene('Game');
      return {score: s.score, mode: s.mode || s.tier || s.track || s.chosenLevel || s.level || (typeof ddLevel !== 'undefined' ? ddLevel : typeof vbLevel !== 'undefined' ? vbLevel : 0)};
    })()`);
    assert.equal(mode.score, 0, id + ': new level starts a fresh run');
    assert.equal(mode.mode, id === 'u4-percent-power' ? 4 : 2, id + ': challenge generator');
    assert.deepEqual(errors, [], id + ': browser errors');
  } finally {
    await page.close();
  }
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const [id, game] of Object.entries(games)) await verifyCabinet(browser, id, game);
    console.log('PASS: All 10 Phaser cabinets grade answers, retain explanations, continue and change difficulty.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
