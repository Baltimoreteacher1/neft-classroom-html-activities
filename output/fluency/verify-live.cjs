const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {chromium} = require('playwright');
const root=path.resolve(__dirname,'../..');
(async()=>{
  const expected=process.argv[2];
  assert.ok(expected,'Expected deployed commit is required.');
  const base='https://eduwonderlab.com';
  const stampResponse=await fetch(`${base}/access-practice-lab/config.json?cb=${Date.now()}`,{signal:AbortSignal.timeout(20000)});
  assert.equal(stampResponse.status,200);
  const stamp=await stampResponse.json();
  assert.ok(stamp.commit.startsWith(expected)||expected.startsWith(stamp.commit),'Production commit does not match expected release.');
  const routes=[];
  for(const [route,status] of [['/curriculum/fluency/',200],['/curriculum/fluency/teacher/',401],['/curriculum/fluency/teacher/printables/unit-2-teacher-keys.pdf',401]]){
    const response=await fetch(`${base}${route}?cb=${Date.now()}`,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    assert.equal(response.status,status,route);
    routes.push({route,status:response.status});
    if(status===200){
      const html=await response.text();const dom=new JSDOM(html);
      assert.equal(dom.window.document.title,'Fluency Practice Studio · EduWonderLab');
      assert.equal(dom.window.document.querySelector('#fluency-studio').textContent.trim(),fs.readFileSync(path.join(root,'tools/fluency-guide/src/studio.js'),'utf8').trim(),'Deployed practice engine differs from reviewed source.');
      dom.window.close();
    }
  }
  const browser=await chromium.launch({headless:true});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/curriculum/fluency/?cb=${Date.now()}#view=studio&lesson=2-6&mode=practice&level=foundation`,{waitUntil:'load'});
    await page.locator('#fl-response').fill('12');
    await page.locator('#fl-answer-form button[type=submit]').click();
    assert.equal(await page.locator('.fl-task-meta .fl-status').innerText(),'Checked');
    await page.reload();
    assert.equal(await page.locator('#fl-response').inputValue(),'12');
    await page.locator('#fl-mode-labs').click();
    for(const lab of ['statistics','ratios','fractions','geometry','coordinates','equations']){
      await page.locator(`[data-fli-lab="${lab}"]`).click();
      assert.equal(await page.locator(`[data-fli-lab="${lab}"]`).getAttribute('aria-pressed'),'true');
      assert.ok(await page.locator('#fli-answer').isVisible());
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');
    await page.screenshot({path:path.join(__dirname,'live-mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
  const result={date:new Date().toISOString(),commit:stamp.commit,routes,reviewedEngineMatches:true,mobilePracticeAndRefresh:true,sixInvestigations:true,pageErrors:errors};
  fs.writeFileSync(path.join(__dirname,'live-verification.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
