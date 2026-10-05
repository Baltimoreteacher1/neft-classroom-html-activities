const {chromium}=require('playwright');
const axe=require('axe-core');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.FLUENCY_TEST_URL||'http://127.0.0.1:8766';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const p=await ctx.newPage();const reports=[];
 async function audit(name){await p.addScriptTag({content:axe.source});const r=await p.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));const issues=r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,15),totalNodes:v.nodes.length}));reports.push({name,violations:issues,incomplete:r.incomplete.map(x=>x.id)});console.log(name,issues.length?'FAIL':'PASS',issues.map(i=>`${i.id}(${i.totalNodes})`).join(', '));}
 await p.goto(`${base}/curriculum/fluency/#view=studio&lesson=7-1&mode=student&level=foundation`);
 for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await audit(`Student practice / ${theme}`);}
 await p.locator('[data-studio=example]').click();await audit('Student worked-example / dark');
 await p.locator('[data-studio=reset]').click();await audit('Student clear dialog / dark');await p.keyboard.press('Escape');
 await p.locator('#fl-mode-labs').click();
 for(const id of ['statistics','ratios','fractions','geometry','coordinates','equations']){await p.locator(`[data-fli-lab="${id}"]`).click();for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await audit(`Investigation ${id} / ${theme}`);}}
 await p.goto(`${base}/curriculum/fluency/teacher/#view=lessons`);
 for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await audit(`Teacher lessons / ${theme}`);}
 await p.locator('[data-act=open-tools]').first().click();await audit('Teacher math-tools dialog / dark');
 fs.writeFileSync(path.join(__dirname,'accessibility-results.json'),JSON.stringify({date:new Date().toISOString(),axe:axe.version,reports},null,2));
 await browser.close();process.exitCode=reports.some(r=>r.violations.length)?1:0;
})().catch(e=>{console.error(e);process.exit(1);});
