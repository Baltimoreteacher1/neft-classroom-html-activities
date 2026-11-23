// Print CSS for the worksheet. Letter page, 0.75in margins, 13pt body, nothing under 11pt (superscripts keep an
// 11pt floor). The same sheet also reads as a page on screen.

import { cssString } from "./html.js";

const BASE = `
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#e8ebed;color:#111;font:13pt/1.45 "Helvetica Neue",Helvetica,Arial,"Liberation Sans",sans-serif;orphans:3;widows:3}
.sheet{width:7in;margin:0 auto;background:#fff}
.sheet+.sheet{break-before:page}
h1,h2,h3{line-height:1.2;margin:0;break-after:avoid}
h1{font-size:23pt;font-weight:800;letter-spacing:-.01em}
h2{font-size:15pt;font-weight:800;margin:14pt 0 6pt}
h3{font-size:12pt;font-weight:700}
p{margin:0 0 7pt}
.tag{font-size:11pt;font-weight:700;color:#222}
.es{font-weight:400}
.ws-head{border-bottom:3pt solid var(--accent,#111);padding-bottom:7pt;margin-bottom:12pt}
.meta{font-size:11.5pt;color:#333;margin:3pt 0 0}
.namebar{display:flex;gap:26pt;margin-top:12pt;font-weight:700}
.namebar>span{flex:1;display:flex;gap:6pt;align-items:flex-end;white-space:nowrap}
.namebar>span:last-child{flex:.6}
.namebar .line{flex:1;min-width:1in}.namebar .lab{white-space:normal}
.line{display:inline-block;min-width:1.5in;border-bottom:1.3pt solid #111;height:1.15em;vertical-align:baseline}
.line.long{min-width:3in}.line.short{min-width:.7in;flex:none}.line.tiny{min-width:.55in}
.goal,.directions{border:1.3pt solid #333;border-left-width:6pt;border-left-color:var(--accent,#111);border-radius:4pt;padding:8pt 12pt;margin:0 0 12pt;background:#f5f6f7}
.directions h2,.goal h2{margin:0 0 3pt;font-size:12.5pt}
.directions p:last-child,.goal p:last-child{margin-bottom:0}
.sechead{margin-top:18pt;border-bottom:1.3pt solid #333;padding-bottom:3pt}
.passage{border:1.2pt solid #555;border-radius:6pt;padding:9pt 14pt;margin:0 0 14pt;background:#fbfbfb;line-height:1.6}
.passage h2{margin-top:0}.passage p:last-child{margin-bottom:0}
.listen{border:1.3pt dashed #333;border-radius:4pt;padding:7pt 12pt;margin:0 0 12pt}
.mathblock{text-align:center;font-size:17pt;margin:10pt 0 14pt;break-inside:avoid}
.mathblock .cap,figcaption,caption{font-size:11.5pt;color:#333;text-align:center;margin-top:3pt}
caption{caption-side:top;font-weight:700;padding-bottom:4pt}
figure.image{margin:0 0 14pt;text-align:center;break-inside:avoid}
figure.image img{min-width:1.6in;max-width:5in;max-height:3.2in;width:auto;height:auto;border:1pt solid #999}
.nopic{border:1.5pt dashed #666;padding:20pt;text-align:center;color:#333;font-size:11.5pt}
.frac{text-indent:0;display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;line-height:1.2;margin:0 .14em}
.frac .fn{border-bottom:1.2pt solid currentColor;padding:0 .22em .04em}
.frac .fd{padding:.06em .22em 0}
sup,sub{font-size:max(11pt,.86em);line-height:0}
.problem{break-inside:avoid;margin:0 0 18pt}
.prompt{font-weight:600;margin:0 0 6pt;padding-left:2.4em;text-indent:-2.4em}
.qno{display:inline-block;width:2.4em;text-indent:0;font-weight:800}
.how{font-size:11.5pt;font-style:italic;color:#222;margin:0 0 7pt 0}
.frame{border-left:3pt solid #888;padding-left:9pt;margin:0 0 8pt}
.qimg{max-width:4.4in;max-height:2.6in;border:1pt solid #999;margin:0 0 8pt;display:block}
ul,ol{margin:0;padding:0;list-style:none}
.opts li{display:flex;gap:9pt;align-items:center;margin:0 0 7pt;break-inside:avoid}
.opts.plain li{gap:7pt}
.bubble,.check{flex:none;width:15pt;height:15pt;border:1.5pt solid #111}
.bubble{border-radius:50%}.check{border-radius:3pt}
.letter{flex:none;min-width:1.2ch;font-weight:800}
.match{display:grid;grid-template-columns:1fr 1fr;gap:0 26pt}
.match ol{counter-reset:m}
.match .left li{display:flex;gap:7pt;align-items:flex-end;margin:0 0 9pt;counter-increment:m}
.match .left li::before{content:counter(m) ".";font-weight:800;order:-2;min-width:2ch;align-self:flex-start}
.match .left .line{order:-1;align-self:flex-start;margin-top:4pt}
.match .right li{display:flex;gap:8pt;margin:0 0 9pt}
.chips{display:flex;flex-wrap:wrap;gap:6pt 8pt;margin:0 0 9pt}
.chips li{border:1.3pt solid #333;border-radius:14pt;padding:2pt 11pt;background:#f5f6f7;font-weight:600}
.bank{border:1.3pt solid #333;border-radius:5pt;padding:7pt 10pt 1pt;margin:0 0 10pt}
.bank .tag{display:block;margin-bottom:5pt}
.cloze{line-height:2.1}
.blank{display:inline-block;min-width:1.15in;border-bottom:1.4pt solid #111;margin:0 4pt;height:1.2em;vertical-align:baseline;position:relative}
.bn{font-size:11pt;color:#333;position:absolute;left:2pt;top:-.2em}
.workbox{position:relative;border:1.4pt solid #333;border-radius:5pt;margin:0 0 9pt;height:1.05in}
.workbox.roomy{height:1.9in}
.workbox .tag{position:absolute;left:8pt;top:4pt;color:#444;font-weight:600}
.answerline{display:flex;align-items:flex-end;gap:7pt;margin:0}
.answerline .line.long{flex:none}.unit{font-weight:600}
.writing{margin:0 0 4pt}
.rule{height:.36in;border-bottom:1.1pt solid #666}
.circle{margin:0;padding:9pt 14pt;border:1.2pt solid #777;border-radius:5pt;font-size:13.5pt;line-height:1.9;background:#fbfbfb}
.hotspot{display:flex;gap:18pt;flex-wrap:wrap;align-items:flex-start}
.hotspot .pic{position:relative;width:3.5in;max-width:100%;border:1.4pt solid #222;flex:none}
.hotspot .pic img{display:block;width:100%;height:auto}
.hotspot .nopic{min-height:2.2in;display:flex;align-items:center;justify-content:center;border:none}
.hotspot .opts{flex:1;min-width:1.6in}
.hotspot .answerline{flex-basis:100%}
.region{position:absolute;border:2pt dashed #000;background:rgba(255,255,255,.18)}
.region b{position:absolute;left:-2pt;top:-2pt;min-width:17pt;padding:0 3pt;background:#000;color:#fff;font-size:12pt;line-height:17pt;text-align:center}
.figwrap{margin:2pt 0 0}
.fig{display:block;height:auto;width:100%;max-width:7in}
.figwrap.grid .fig{max-width:100%}
.slots{display:flex;flex-wrap:wrap;gap:6pt 18pt;counter-reset:s;margin-top:4pt}
.slots li{counter-increment:s;display:flex;align-items:flex-end;gap:5pt}
.slots li::before{content:counter(s) ".";font-weight:800}
.cards{display:flex;flex-wrap:wrap;gap:9pt;margin:0 0 9pt}
.cards li{border:1.5pt dashed #000;border-radius:5pt;padding:6pt 13pt;font-weight:700}
.steps li{display:flex;gap:9pt;align-items:stretch;margin:0 0 6pt}
.stepno{flex:none;width:3.6em;font-weight:700;padding-top:6pt}
.stepbox{flex:1;border:1.3pt solid #444;border-radius:4pt;padding:5pt 10pt}
table{border-collapse:collapse;width:100%}
.datatable th,.datatable td,.sorttable th,.sorttable td{border:1.3pt solid #333;padding:5pt 9pt;text-align:left;vertical-align:top}
.datatable thead th,.sorttable thead th{background:#e9ecee;font-weight:800}
.datatable tbody th{font-weight:700;background:#f5f6f7}
.datatable td.empty{height:.5in}.datatable.roomy td.empty{height:.72in}
.datatable td{height:.4in}
.sorttable td{height:.4in}
.datatable tr,.sorttable tr{break-inside:avoid}
.tablewrap{margin:0 0 14pt;break-inside:avoid}
.vocab{margin:0 0 14pt}.vocab h2{margin-top:0}
.vt td,.vt th{font-size:12pt}
.pictd{width:1in}.pictd img{max-width:.9in;max-height:.9in}.pictd:empty,.vt td.pictd{height:.9in}
.organizer{margin:0 0 14pt;break-inside:avoid}
.ocell{border:1.4pt solid #333;border-radius:5pt;padding:5pt 9pt;min-height:1.3in}
.ocell.roomy{min-height:2in}.ocell h3{margin-bottom:2pt;break-after:auto}
.org.kwl,.org.compare{display:grid;grid-template-columns:repeat(3,1fr);gap:8pt}
.org.ce .cerow{display:grid;grid-template-columns:1fr 30pt 1fr;align-items:center;margin-bottom:8pt}
.org.ce .ocell{min-height:.9in}.arrow{text-align:center;font-size:20pt;font-weight:700}
.org.ced{display:grid;grid-template-columns:repeat(3,1fr);gap:8pt}.org.ced .wide{grid-column:1/-1;min-height:.9in}
.org.web .center{border:2pt solid #111;border-radius:30pt;text-align:center;padding:12pt;font-weight:800;margin:0 auto 10pt;max-width:3.4in}
.org.web .sats{display:grid;grid-template-columns:repeat(2,1fr);gap:8pt}.org.web .ocell{min-height:1in}
.org.seq li{margin-bottom:12pt;position:relative}
.org.seq li:not(:last-child)::after{content:"\\2193";position:absolute;left:calc(50% - .3em);bottom:-20pt;font-size:19pt;line-height:1;font-weight:700}
.org.seq .ocell{min-height:.8in}
.banner{border:2.5pt solid #000;padding:7pt 12pt;margin:0 0 12pt;font-weight:800;font-size:14pt;display:flex;justify-content:space-between;gap:12pt;flex-wrap:wrap}
.banner span:last-child{font-weight:600;font-size:12pt}
.kq{break-inside:avoid;margin:0 0 14pt;padding-bottom:8pt;border-bottom:1pt solid #aaa}
.kq .prompt{font-weight:600}
.kpart{margin:0 0 5pt 20pt}
.kans{border-left:4pt solid #111;padding-left:9pt;margin-left:20pt}
.klist{margin:0}.klist li{margin:0 0 2pt}
.knotes{margin:0 0 12pt;border:1.2pt solid #555;border-radius:4pt;padding:7pt 12pt}.knotes h2{margin:0 0 4pt;font-size:13pt}
.knotes p:last-child{margin-bottom:0}
`;

const SCREEN = `
@media screen{
.sheet{width:min(8.5in,100%);padding:.75in;margin:18px auto;box-shadow:0 2px 14px rgba(0,0,0,.18)}
.sheet+.sheet{break-before:auto}
}
@media screen and (max-width:7in){.sheet{padding:.4in 16px}.match{grid-template-columns:1fr}}
@media print{body{background:#fff}.sheet{margin:0;padding:0}}
`;

/** The @page rules: named pages give the student copy and the teacher copy their own running headers. */
function pageRules(title, keyLabel, pageWord, ofWord, withKey) {
  const t = cssString(title.length > 70 ? `${title.slice(0, 67)}...` : title);
  const foot = `content:"${cssString(pageWord)} " counter(page) " ${cssString(ofWord)} " counter(pages);font:11pt "Helvetica Neue",Arial,sans-serif;color:#222`;
  return `
@page{size:Letter;margin:.75in}
@page student{@top-left{content:"${t}";font:11pt "Helvetica Neue",Arial,sans-serif;color:#222}@bottom-center{${foot}}}
@page student:first{@top-left{content:""}}
${withKey ? `@page key{@top-left{content:"${cssString(keyLabel)} \\2014  ${t}";font:700 11pt "Helvetica Neue",Arial,sans-serif;color:#000}@bottom-center{${foot}}}\n.sheet.key{page:key}` : ""}
.sheet.student{page:student}
`;
}

export function printCss({ title, accent, keyLabel, pageWord, ofWord, withKey }) {
  const vars = accent ? `:root{--accent:${accent}}` : "";
  return `${vars}${BASE}${pageRules(title, keyLabel, pageWord, ofWord, withKey)}${SCREEN}`;
}
