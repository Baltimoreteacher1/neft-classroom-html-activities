import { chromium } from '/Users/joelneft/node_modules/playwright/index.mjs';
const [svg,out,scale='2']=process.argv.slice(2);
const b=await chromium.launch(); const p=await b.newPage({deviceScaleFactor:+scale});
await p.goto('file://'+svg); const box=await p.evaluate(()=>{const s=document.querySelector('svg');return [s.width.baseVal.value,s.height.baseVal.value]});
await p.setViewportSize({width:Math.ceil(box[0]),height:Math.ceil(box[1])}); await p.screenshot({path:out}); await b.close();
