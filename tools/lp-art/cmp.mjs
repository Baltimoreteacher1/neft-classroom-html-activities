import { chromium } from '/Users/joelneft/node_modules/playwright/index.mjs';
import fs from 'fs';
const [out,...svgs]=process.argv.slice(2);
const html=out.replace(/\.png$/,'.html');
fs.writeFileSync(html,`<body style="margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#888">${svgs.map(s=>`<img src="file://${s}" style="width:100%">`).join('')}</body>`);
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:400}});
await p.goto('file://'+html); await p.waitForTimeout(600); await p.screenshot({path:out,fullPage:true}); await b.close();
