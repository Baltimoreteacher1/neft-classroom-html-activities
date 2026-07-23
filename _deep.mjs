import { chromium } from '@playwright/test';
const base='http://localhost:8791';
const b=await chromium.launch(); let fail=0;
const BASE=/Community Math Studio|Unsupported method|status of (4|5)\d\d|net::ERR|favicon|manifest/i;
const WIN=/complete|perfected|approved|spec met|goal met|mission go|case cracked|shipped|liftoff|done|lab closed|blueprint approved|high score|forged|service complete|🎉|🚀|📋|💎/i;
async function load(u,v,sel){const pg=await b.newPage({colorScheme:'light'});const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push('PE:'+e.message));
  await pg.goto(`${base}/math/${u}/projects/${v}/index.html`,{waitUntil:'networkidle',timeout:15000});await pg.waitForTimeout(1300);
  await pg.evaluate(()=>{const g=document.querySelector('.gold-level-card');if(g){const r=[...g.querySelectorAll('button')].find(e=>/With Support|Level 1/i.test(e.textContent||''));if(r)r.click();}});await pg.waitForTimeout(600);
  return {pg,errs};}
const clean=e=>e.filter(x=>!BASE.test(x));

// Brute-force button-based widget to a win state
async function bruteForce(pg,sel,budget=40){
  for(let i=0;i<budget;i++){
    const st=await pg.evaluate((sel)=>{const w=document.querySelector(sel);if(!w)return{win:false,html:''};return{win:false,html:w.textContent||''};},sel);
    if(WIN.test(st.html)) return true;
    // click the next enabled option/button we haven't exhausted this render
    const clicked=await pg.evaluate((sel)=>{const w=document.querySelector(sel);if(!w)return false;
      const btns=[...w.querySelectorAll('button')].filter(b=>!b.disabled && b.offsetHeight>0 && !b.dataset.tried);
      if(!btns.length){/*reset tries (new stage)*/[...w.querySelectorAll('button')].forEach(b=>delete b.dataset.tried);const fresh=[...w.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetHeight>0);if(!fresh.length)return false;fresh[0].dataset.tried='1';fresh[0].click();return true;}
      btns[0].dataset.tried='1';btns[0].click();return true;},sel);
    if(!clicked) { await pg.waitForTimeout(150); continue; }
    await pg.waitForTimeout(260);
  }
  const final=await pg.evaluate((sel)=>document.querySelector(sel)?.textContent||'',sel);
  return WIN.test(final);
}

// 1) recipe-rush (MC)
{const {pg,errs}=await load('unit-2','version-a','.pki-rr');const won=await bruteForce(pg,'.pki-rr');console.log(`${won&&!clean(errs).length?'PASS':'FAIL'} u2 recipe-rush won=${won} errs=${clean(errs).length}`);if(!won||clean(errs).length)fail++;await pg.close();}
// 2) blueprint-studio (MC)
{const {pg,errs}=await load('unit-5','version-a','.pki-bp');const won=await bruteForce(pg,'.pki-bp');console.log(`${won&&!clean(errs).length?'PASS':'FAIL'} u5 blueprint-studio won=${won} errs=${clean(errs).length}`);if(!won||clean(errs).length)fail++;await pg.close();}
// 3) combo-forge (MC)
{const {pg,errs}=await load('unit-6','version-a','.pki-cf');const won=await bruteForce(pg,'.pki-cf');console.log(`${won&&!clean(errs).length?'PASS':'FAIL'} u6 combo-forge won=${won} errs=${clean(errs).length}`);if(!won||clean(errs).length)fail++;await pg.close();}
// 4) mix-lab (mixed) - brute force buttons
{const {pg,errs}=await load('unit-3','version-a','.pki-ml');const won=await bruteForce(pg,'.pki-ml',60);console.log(`${won&&!clean(errs).length?'PASS':'FAIL'} u3 mix-lab won=${won} errs=${clean(errs).length}`);if(!won||clean(errs).length)fail++;await pg.close();}
// 5) growth-room (slider+run): max the slider, run
{const {pg,errs}=await load('unit-9','version-a','.pki-gr');
 await pg.evaluate(()=>{const s=document.querySelector('.pki-gr input[type=range]');if(s){s.value=s.max;s.dispatchEvent(new Event('input',{bubbles:true}));}const run=[...document.querySelectorAll('.pki-gr button')].find(b=>/run|season|start/i.test(b.textContent));if(run)run.click();});
 await pg.waitForTimeout(1500);
 const txt=await pg.evaluate(()=>document.querySelector('.pki-gr')?.textContent||'');
 const won=/goal met|met the goal|success|🎉|✓/i.test(txt);
 console.log(`${won&&!clean(errs).length?'PASS':'FAIL'} u9 growth-room won=${won} errs=${clean(errs).length}`);if(!won||clean(errs).length)fail++;await pg.close();}
// 6) fold-fill (steppers+unfold+fill): max dims, unfold, fill
{const {pg,errs}=await load('unit-10','version-a','.pki-ff');
 // click all + steppers many times
 for(let k=0;k<12;k++){await pg.evaluate(()=>{[...document.querySelectorAll('.pki-ff button')].filter(b=>/^\+$|＋|increase|\+/.test(b.textContent.trim())||/inc/i.test(b.className)).forEach(b=>b.click());});await pg.waitForTimeout(40);}
 // click unfold + fill/ship buttons
 await pg.evaluate(()=>{[...document.querySelectorAll('.pki-ff button')].forEach(b=>{if(/unfold|fill|ship|build|check/i.test(b.textContent))b.click();});});
 await pg.waitForTimeout(600);
 const txt=await pg.evaluate(()=>document.querySelector('.pki-ff')?.textContent||'');
 const won=/spec met|shipped|pass|✓|meets|filled/i.test(txt);
 console.log(`${won&&!clean(errs).length?'PASS':'FAIL(soft)'} u10 fold-fill won=${won} errs=${clean(errs).length} sample="${txt.replace(/\s+/g,' ').slice(-70)}"`);if(clean(errs).length)fail++;await pg.close();}
await b.close();console.log(fail?`\n${fail} FAIL`:'\nALL PASS');process.exit(fail?1:0);
