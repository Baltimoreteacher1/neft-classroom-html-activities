/* Native math controls + real graders, followed by pointer/keyboard mission play.
 * Run: GAME_STUDIO_BASE_URL=http://127.0.0.1:4192 node tests/cabinet-adventure-browser.cjs */
const {chromium}=require('@playwright/test');const assert=require('node:assert/strict');
const {plans}=require('./cabinet-adventure-rules.cjs');
const base=process.env.GAME_STUDIO_BASE_URL||'http://127.0.0.1:4192';
const games={'u1-decimal-dash':'ddGame','u1-factor-frenzy':null,'u2-fraction-frenzy':'ffGame','u3-ratio-rush':'rrGame','u4-percent-power':'ppGame','u5-area-attack':'aaGame','u6-expression-express':'eeGame','u7-equation-quest':'eqGame','u8-data-dash':'ddGame','u9-coordinate-quest':'cqGame','u10-volume-blast':'vbGame'};
const solve={
 'u1-decimal-dash':`s.beads.forEach(b=>s.setBeadIndex(b,b.targetIdx));s.lockIn();`,
 'u2-fraction-frenzy':`s.setParts(s.problem.targetParts);s.setShaded(s.problem.targetShaded);s.lockIn();`,
 'u3-ratio-rush':`s.setKnob('top',s.problem.targetTop);s.setKnob('bottom',s.problem.targetBot);s.lockIn();`,
 'u4-percent-power':`s.setMarker(s.problem.targetPct);s.lockIn();if(s.phase==='value')s.submitChoice(s.choices.findIndex(c=>c.opt.correct));`,
 'u5-area-attack':`s.problem.cells.forEach(k=>{const [c,r]=k.split(',').map(Number);s.commitRect(c,r,c,r);});s.lockIn();if(s.phase==='area')s.submitChoice(s.choices.findIndex(c=>c.opt.correct));`,
 'u6-expression-express':`const used=new Set();s.problem.solution.forEach((t,i)=>{const tile=s.tiles.find(o=>!used.has(o.id)&&o.kind===t.kind&&o.label===t.label);if(!tile)throw Error('Missing tile');used.add(tile.id);s.assign(tile,i);});s.lockIn();`,
 'u7-equation-quest':`if(s.B>0){s.setOp('sub');s.opAmt=s.B;s.applyOp();}if(s.A>1){s.setOp('div');s.opAmt=s.A;s.applyOp();}s.lockIn();if(s.phase==='pick')s.submitChoice(s.choices.findIndex(c=>c.opt.correct));`,
 'u8-data-dash':`s.problem.sample.forEach((n,i)=>{while(s.counts[i]<n)s.addDot(i);});s.lockIn();`,
 'u9-coordinate-quest':`s.setMarker(s.problem.tx,s.problem.ty);s.lockIn();if(s.phase==='answer')s.pickChoice(s.choiceVals.indexOf(s.problem.answer.correct));`,
 'u10-volume-blast':`const goal=correctBuild(s.problem);for(const d of ['l','w','h']){while(s.built[d]<goal[d])s.changeDim(d,1);while(s.built[d]>goal[d])s.changeDim(d,-1);}s.lockIn();`
};
async function nativeSolve(page,id,game){
 if(!game){await page.evaluate(()=>{function solveNode(node){if(isPrime(node.value)){actPrime(node);return;}const pair=factorPairs(node.value)[0];actSplit(node,pair[0],pair[1]);node.children.forEach(solveNode);}solveNode(S.cur.root);const counts={};lockedPrimes().forEach(n=>counts[n]=(counts[n]||0)+1);Object.entries(counts).forEach(([n,count])=>{for(let i=0;i<count;i++)ffStepExp(Number(n),1);});});await page.locator('#btn-calibrate-vault').click();return;}
 await page.evaluate(`{const s=${game}.scene.getScene('Game');${solve[id]}}`);
 if(id==='u10-volume-blast'){await page.waitForTimeout(400);await page.evaluate(`{const s=${game}.scene.getScene('Game');if(s.phase==='answer')s.pickChoice(s.choices.findIndex(c=>c.v===s.problem.dV));}`);}
 if(id==='u2-fraction-frenzy'){await page.waitForTimeout(300);await page.evaluate(`{const s=${game}.scene.getScene('Game');if(s.phase==='count'&&!s.locked){s.groups=s.problem.quotient;s.lockIn();}}`);}
}
(async()=>{
 const browser=await chromium.launch();let total=0;
 try{for(const [id,game]of Object.entries(games)){
  const page=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/math/games/${id}/`);await page.waitForFunction(()=>!!window.__cabinetAdventure);
  if(game){await page.waitForFunction(`${game}.scene.isActive('Title')`);await page.evaluate(`${game}.scene.getScenes(true).forEach(s=>${game}.scene.stop(s.sys.settings.key));${game}.scene.start('Game',{level:1});`);await page.waitForFunction(`!!${game}.scene.getScene('Game').problem`);}
  else await page.evaluate(()=>startGame(1));
  const snapshot=()=>page.evaluate(()=>window.__cabinetAdventure.getState());
  assert.equal((await snapshot()).earned,0,id+': no rewards before math');
  await page.getByRole('button',{name:/Mission chart/}).click();await page.locator('[data-mission-action="check"]').click();assert.equal((await snapshot()).chapter,0,id+': no free landmark');
  const type=await page.evaluate(id=>CabinetAdventure.rules.typeOf(id),id),firstAction=plans[type][0][0];
  await page.locator(`[data-mission-action="${firstAction}"]`).click();assert.equal((await snapshot()).supplies,0,id+': no negative supplies');
  await page.locator('.mission-nav [data-view="math"]').click();
  for(let n=1;n<=3;n++){
   await nativeSolve(page,id,game);await page.waitForFunction(n=>window.__cabinetAdventure.getState().earned===n,n,{timeout:5000});
   assert.equal((await snapshot()).supplies,n*4,id+': exactly 4 supplies per correct native round');
   if(game)await page.evaluate(`${game}.scene.getScene('Game').updateHUD();`);
   assert.equal((await snapshot()).earned,n,id+': repeated rendering cannot farm supplies');
   if(n<3){if(game){await page.locator('.cabinet-next:not([disabled])').click();await page.waitForTimeout(100);}else await page.locator('#vault-stage button').filter({hasText:'Continue expedition'}).click();}
  }
  await page.getByRole('button',{name:/Mission chart/}).click();
  await page.locator(`[data-mission-action="${firstAction}"]`).click();assert.equal((await snapshot()).supplies,11,id+': action spends one');
  await page.locator('[data-mission-action="undo"]').click();assert.equal((await snapshot()).supplies,12,id+': undo refunds');
  for(const action of plans[type][0])await page.locator(`[data-mission-action="${action}"]`).click();
  await page.locator('[data-mission-action="check"]').click();assert.equal((await snapshot()).chapter,1,id+': mission chapter earned');
  const earned=await snapshot();await page.reload();await page.waitForFunction(()=>!!window.__cabinetAdventure);assert.deepEqual(await snapshot(),earned,id+': mission reload resumes');
  if(!game)await page.evaluate(()=>startGame(1));
  await page.getByRole('button',{name:/Mission chart/}).click();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,id+': mobile has no horizontal overflow');
  assert.equal(await page.locator('.cabinet-adventure').isVisible(),true,id+': mobile mission reachable');
  if(id==='u5-area-attack'||id==='u9-coordinate-quest'||id==='u10-volume-blast')await page.screenshot({path:`/tmp/${id}-mission-mobile.png`,fullPage:false});
  assert.deepEqual(errors,[],id+': browser exceptions');await page.close();console.log('PASS '+id+': native math ×3, supplies, mission, undo, persistence, mobile');total++;
 }
 // Arrow keys outside the canvas retain their native meaning and cannot move a marker.
 const page=await browser.newPage();await page.goto(base+'/math/games/u1-decimal-dash/');await page.waitForFunction(()=>!!window.__cabinetAdventure);await page.evaluate(()=>{ddGame.scene.stop('Title');ddGame.scene.start('Game',{level:1});});await page.waitForTimeout(150);
 const before=await page.evaluate(()=>ddGame.scene.getScene('Game').beads[0].idx);await page.locator('.mission-nav [data-view="mission"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>ddGame.scene.getScene('Game').beads[0].idx),before,'outside arrows do not control game');
 await page.locator('.cabinet-viewport canvas').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>ddGame.scene.getScene('Game').beads[0].idx),before+1,'focused canvas arrow works');await page.close();
 console.log(`PASS: ${total} cabinets individually verified; keyboard controls scoped to focused canvas.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
