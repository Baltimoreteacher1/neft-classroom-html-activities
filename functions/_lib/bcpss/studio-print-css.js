// Print stylesheet for the Language Studio renderer. Colors come from TOKENS (studio-doc.js); nothing is hard-coded twice.
// Letter pages, exact color printing, named pages for landscape + full-bleed cover, footer in @page margin boxes.

import { TOKENS } from "./studio-doc.js";

const FONT_BODY = `"Atkinson Hyperlegible Next","Atkinson Hyperlegible","Avenir Next","Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif`;
const FONT_HEAD = `"Avenir Next Rounded","Avenir Next","Nunito","Trebuchet MS","Segoe UI",-apple-system,Helvetica,Arial,sans-serif`;
const FONT_HAND = `"Bradley Hand","Segoe Print","Chalkboard SE","Comic Sans MS",cursive`;

export function cssString(text) {
  return `"${String(text)
    .replace(/[\\"]/g, "\\$&")
    .replace(/[\n\r]/g, " ")}"`;
}

function toneRules() {
  const rules = [];
  const add = (name, p) => rules.push(`.tn-${name}{--ink:${p.ink};--mid:${p.mid};--bg:${p.bg}}`);
  for (const [name, p] of Object.entries(TOKENS.domains)) add(name, p);
  for (const [name, domain] of Object.entries(TOKENS.chunkTones)) add(name, TOKENS.domains[domain]);
  for (const [name, color] of Object.entries(TOKENS.highlights))
    add(name, { ink: TOKENS.ink, mid: color, bg: color });
  add("neutral", TOKENS.neutral);
  return rules.join("\n");
}

function pageRules(unitTitle) {
  const foot = (extra = "") =>
    `@bottom-left{content:${cssString(unitTitle)};${extra}} @bottom-center{content:"The Language Page";${extra}} @bottom-right{content:"Page " counter(page);${extra}}`;
  const style =
    "font:600 8pt/1 " +
    FONT_BODY +
    ";color:#586274;border-top:0.75pt solid #d5dbe5;padding-top:7pt;vertical-align:top;";
  return `
@page{size:letter;margin:.5in .55in .66in;${foot(`font-family:${FONT_BODY};font-size:8pt;font-weight:600;color:#586274;border-top:0.75pt solid #d5dbe5;padding-top:7pt;vertical-align:top`)}}
@page land{size:11in 8.5in;margin:.45in .55in .64in;${foot(`font-family:${FONT_BODY};font-size:8pt;font-weight:600;color:#586274;border-top:0.75pt solid #d5dbe5;padding-top:7pt;vertical-align:top`)}}
@page bleed{size:letter;margin:0;@bottom-left{content:none}@bottom-center{content:none}@bottom-right{content:none}}
/* ${style.length} */`;
}

export function printCss(unitTitle) {
  const T = TOKENS;
  return `${pageRules(unitTitle)}
${toneRules()}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:${T.ink};font-family:${FONT_BODY};font-size:11pt;line-height:1.38;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body.early{font-size:14pt;line-height:1.5}
body.fam{font-size:10pt;line-height:1.34}
body.fam .h2{font-size:13.5pt;margin:7pt 0 4pt}body.fam .h2 .hi{width:20pt;height:20pt}body.fam .h2 .hi svg{width:13pt;height:13pt}body.fam .callout{padding:5pt 10pt;margin-bottom:5pt}body.fam .callout>.lab{margin-bottom:4pt}body.fam p{margin-bottom:2pt}body.fam .h2{margin-top:5pt}body.fam .callout.plain>.chk{margin-bottom:3pt}body.fam .callout>.lab{margin-bottom:3pt}body.fam .tbl{font-size:8.5pt;margin-bottom:4pt}body.fam .tbl td{padding:2.2pt 7pt}body.fam .hero.compact .sub:empty{display:none}body.fam .tbl th{padding:4pt 7pt}body.fam .hero.compact{margin-bottom:6pt}body.fam .hero.compact .top{padding:10pt 20pt 9pt}body.fam .hero.compact .tit{font-size:21pt}body.fam .hero.compact .kick{margin-bottom:4pt}body.fam .hero.compact .sub{margin-top:5pt;font-size:10pt}body.fam .chk li{padding:1pt 0}body.fam .cols{margin-bottom:4pt}body.fam .chip{padding:1.5pt 8pt;font-size:.88em}body.fam .chips.cut{padding:4pt 8pt;margin-bottom:0;gap:3pt 4pt}body.fam .chips.cut .lab{margin-bottom:1pt}body.fam .callout.plain{padding:3pt 10pt;margin-bottom:4pt}body.fam .chk{margin-bottom:3pt}body.fam .p-fam{font-size:8.9pt;line-height:1.24;margin-bottom:1pt}body.fam .cols{gap:10pt}body.fam .cols.rule>div+div{padding-left:10pt}body.fam .callout.plain .cols{margin-bottom:0}
body.early .callout.strip{padding:5pt 12pt;font-size:12pt}body.early .callout.strip p{font-size:12pt}body.early .p-sm{font-size:11.5pt}body.early .p-md{font-size:14pt}body.early .fnote{font-size:11pt}body.early .chip{font-size:1em}body.early .tbl{font-size:1em}
body.dense{font-size:9.6pt;line-height:1.38}
h1,h2,h3,.head{font-family:${FONT_HEAD};margin:0;color:${T.ink};font-weight:800;letter-spacing:-.01em}
p{margin:0 0 7pt}
.sec{break-before:page;page:auto}
.sec:first-child{break-before:auto}
.sec.land{page:land}
.sec.bleed{page:bleed;padding:0}
.hand{font-family:${FONT_HAND}}
@media screen{
 body{background:#dfe5ee;padding:18px 0}
 .sec{width:8.5in;margin:0 auto 22px;padding:.5in .55in .72in;background:#fff;box-shadow:0 6px 24px rgba(31,41,55,.18);break-before:auto}
 .sec.land{width:11in}.sec.bleed{padding:0}
}
/* headings */
.h1{font-size:25pt;line-height:1.1;margin:0 0 8pt;display:flex;align-items:center;gap:9pt}.h2{font-size:17pt;line-height:1.15;margin:12pt 0 6pt;display:flex;align-items:center;gap:8pt}.h3{font-size:13pt;margin:9pt 0 4pt}
.h1 .hi,.h2 .hi{display:inline-flex;width:26pt;height:26pt;border-radius:50%;background:var(--bg);color:var(--ink);align-items:center;justify-content:center}
.h2.tone{color:var(--ink)}
.dense .h1{font-size:22pt}.dense .h2{font-size:14pt;margin:9pt 0 5pt}
/* activity band */
.band{display:flex;align-items:center;gap:12pt;background:var(--ink);color:#fff;border-radius:16pt;padding:8pt 16pt 8pt 11pt;margin:0 0 10pt;position:relative;overflow:hidden;
 background-image:radial-gradient(circle at 96% -30%,rgba(255,255,255,.2) 0 34pt,transparent 35pt),radial-gradient(circle at 84% 140%,rgba(255,255,255,.14) 0 30pt,transparent 31pt)}
.band .num{flex:none;width:34pt;height:34pt;border-radius:50%;background:#fff;color:var(--ink);font:800 17pt/34pt ${FONT_HEAD};text-align:center}
.band .ic{flex:none;width:34pt;height:34pt;border-radius:11pt;background:rgba(255,255,255,.2);color:#fff;display:flex;align-items:center;justify-content:center}
.band .tt{flex:1;min-width:0}.band .dom{font:700 8pt/1 ${FONT_BODY};letter-spacing:.14em;text-transform:uppercase;opacity:.92;margin-bottom:3pt}
.band .ti{font:800 21pt/1.05 ${FONT_HEAD};color:#fff}
.band .meta{flex:none;display:flex;flex-direction:column;gap:4pt;align-items:flex-end}
.band .pill{background:rgba(255,255,255,.2);border-radius:999px;padding:2.5pt 9pt;font:700 8.5pt/1.2 ${FONT_BODY}}
.mission{font-size:13pt;font-weight:700;line-height:1.35;border-left:5pt solid var(--mid);padding:2pt 0 2pt 11pt;margin:0 0 10pt;color:${T.ink}}
.early .mission{font-size:16pt}
/* paragraphs + runs */
.sm{font-size:.86em;color:${T.muted}}.nbadge{display:inline-block;width:1.5em;height:1.5em;border-radius:50%;background:${T.ink};color:#fff;font:800 .5em/1.5em ${FONT_BODY};text-align:center;vertical-align:.45em;margin-left:4pt};color:#fff;font:800 .42em/.8em ${FONT_BODY};text-align:center;vertical-align:.7em;margin-left:3pt}.p-bingo{font:800 17pt/1.15 ${FONT_HEAD};margin:0;text-align:center}.cd.vc{justify-content:center}.cols.mid{align-items:center}.p-poster{font:800 29pt/1.65 ${FONT_HEAD};margin:6pt 0 16pt}.p-md{font-size:12.5pt;line-height:1.4}.p-xl{font-size:34pt;line-height:1.1;margin:0}.p-xl2{font:800 24pt/1.2 ${FONT_HEAD};margin:0 0 6pt}.p-xxl{font:800 50pt/1 ${FONT_HEAD};margin:0 0 6pt;color:var(--ink)}.p-lg{font-size:13.5pt;line-height:1.5}.p-sm{font-size:9.5pt;color:${T.muted}}.p-c{text-align:center}
.hl{padding:1pt 4pt;border-radius:4pt;background:var(--mid);box-decoration-break:clone;-webkit-box-decoration-break:clone}
.hl.tn-Listening,.hl.tn-Speaking,.hl.tn-Reading,.hl.tn-Writing,.hl.tn-Vocabulary,.hl.tn-Game,.hl.tn-concept,.hl.tn-connector,.hl.tn-evidence,.hl.tn-precision{background:var(--bg);box-shadow:inset 0 -2.5pt 0 var(--mid)}
.gap{display:inline-block;min-width:62pt;border-bottom:1.3pt solid ${T.ink};text-align:center;margin:0 2pt;line-height:1.05;padding:0 3pt}
.gap span{font-size:.62em;font-style:italic;color:${T.muted};font-weight:600}
.blank{display:inline-block;min-width:92pt;border-bottom:1.3pt solid ${T.ink};text-align:left;margin:0 3pt;padding:0 3pt 0 0;line-height:1.2}
.blank b{display:inline-block;font:800 7.5pt/12pt ${FONT_BODY};color:#fff;background:${T.ink};border-radius:50%;width:12pt;height:12pt;text-align:center;margin-right:4pt;vertical-align:1pt}
.fill{font-family:${FONT_HAND};color:#1d4fb5;font-weight:700}
.ico{display:inline-block;vertical-align:-3pt}
/* callouts */
.callout{background:var(--bg);border:1pt solid color-mix(in srgb,var(--mid) 55%,#fff);border-left:5pt solid var(--mid);border-radius:11pt;padding:8pt 12pt;margin:0 0 9pt;break-inside:avoid}
.callout>.lab{display:flex;align-items:center;gap:6pt;font:800 8.5pt/1 ${FONT_BODY};letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin-bottom:6pt}
.callout>.lab svg{width:15pt;height:15pt}.callout p:last-child{margin-bottom:0}
.callout.plain{background:#fff}.callout.strip{padding:6pt 12pt;display:grid;grid-template-columns:1.25in 1fr;column-gap:10pt;align-items:center}.callout.strip>.lab{margin:0;grid-row:1/3}.callout.strip p{margin:0 0 2pt}.callout.strip .chk{margin:0}
/* lines */
.lines{margin:4pt 0 10pt}.lines .lab{font:700 9pt/1 ${FONT_BODY};color:${T.muted};margin-bottom:2pt}
.ln{height:21pt;border-bottom:1.1pt solid #aab4c4;font-size:13pt;line-height:21pt;white-space:nowrap;overflow:hidden}
.early .ln{height:32pt;line-height:32pt;font-size:16pt}
/* tables */
table{border-collapse:separate;border-spacing:0;width:100%}
.tbl{margin:0 0 11pt;font-size:.95em}
.tbl th{background:var(--ink);color:#fff;text-align:left;padding:6pt 9pt;font:800 9pt/1.2 ${FONT_BODY};letter-spacing:.06em;text-transform:uppercase}
.tbl th:first-child{border-top-left-radius:10pt}.tbl th:last-child{border-top-right-radius:10pt}
.tbl td{padding:7pt 9pt;border-bottom:1pt solid ${T.rule};vertical-align:top}
.tbl tr:last-child td:first-child{border-bottom-left-radius:10pt}.tbl tr:last-child td:last-child{border-bottom-right-radius:10pt}
.tbl.zebra tr:nth-child(even) td{background:${T.wash}}
.tbl.compact td{padding:5pt 8pt}
.tbl tr{break-inside:avoid}
.tbl td.c-fill{background:var(--bg);box-shadow:inset 0 -2.5pt 0 var(--mid)}
.tbl td.c-b{font-weight:800}.tbl td.c-c{text-align:center}
.tbl.sheet td{border:1pt solid ${T.rule};height:40pt}
/* cards + chips */
.grid{display:grid;margin:0 0 6pt}
.grid.cut{border-top:1.2pt dashed #7d8aa0;border-left:1.2pt dashed #7d8aa0}
.grid.cut .cd{border-right:1.2pt dashed #7d8aa0;border-bottom:1.2pt dashed #7d8aa0;border-radius:0}
.grid.soft{gap:9pt}.grid.soft .cd{border:1pt solid ${T.rule};border-radius:14pt;background:#fff}
.cd{position:relative;padding:11pt 13pt;overflow:hidden;break-inside:avoid;display:flex;flex-direction:column}
.cd.empty{border-color:transparent!important}
.cd::before{content:"";position:absolute;left:0;top:0;right:0;height:7pt;background:var(--mid)}
.cd.empty::before{display:none}
.cd .ctop{margin-top:5pt}
.grid.soft .cd p{margin:0 0 4pt}.grid.soft .cd .p-lg{font-size:14pt;margin-top:3pt}.grid.soft .cd .nbadge{font-size:9pt;vertical-align:0;margin:0 3pt 0 0}.grid.soft .cd .p:nth-child(2){font-size:11pt}.cd.ctr{justify-content:center;align-items:center;text-align:center}.cd.ctr .p-xl2{color:var(--ink)}.grid.leftbar .cd{padding-left:22pt;justify-content:center}.grid.leftbar .cd::before{width:9pt;height:auto;right:auto;bottom:0}.cd .big{font:800 20pt/1.05 ${FONT_HEAD};color:var(--ink)}
.chips{display:flex;flex-wrap:wrap;gap:6pt;margin:0 0 9pt;align-items:center}
.chips .lab{flex:0 0 100%;font:800 8.5pt/1 ${FONT_BODY};letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
.chip{display:inline-block;padding:3.5pt 12pt;border-radius:999px;border:1.4pt solid var(--mid);background:#fff;color:${T.ink};font-weight:800;font-size:.97em;line-height:1.2}
.chip.sol{background:var(--bg)}
.chips.cut{border:1.2pt dashed #7d8aa0;border-radius:12pt;padding:8pt;background:${T.wash}}
.chips.cut .chip{border:1.2pt dashed #7d8aa0;border-radius:8pt;background:#fff}
.chips.cut .lab{display:flex;align-items:center;gap:5pt;color:${T.muted}}
/* checklist */
.chk{margin:0 0 10pt;padding:0;list-style:none}
.chk li{display:flex;gap:8pt;align-items:flex-start;padding:2.5pt 0;break-inside:avoid}
.chk .bx{flex:none;width:13pt;height:13pt;border:1.6pt solid ${T.ink};border-radius:4pt;margin-top:2pt}
.chk .bd{flex:none;width:19pt;height:19pt;border:1.6pt solid ${T.ink};border-radius:50%;font:800 9pt/16.5pt ${FONT_BODY};text-align:center;color:${T.ink};margin-top:.5pt}
.chk .on{background:var(--mid);border-color:var(--ink);color:#fff}
.chk .dt{flex:none;width:7pt;height:7pt;border-radius:50%;background:var(--mid);margin-top:5pt}.chk .why{display:block;font-size:.85em;color:${T.muted};font-style:italic}
/* layout */
.cols{display:flex;gap:16pt;margin:0 0 8pt}.cols>div{min-width:0}.cols.rule>div+div{border-left:1pt solid ${T.rule};padding-left:16pt}
.boxrow{display:flex;gap:8pt;margin:0 0 10pt;align-items:center;flex-wrap:wrap}.boxrow .lab{font-weight:700;margin-right:4pt}
.bxs{width:36pt;height:36pt;border:1.6pt solid ${T.ink};border-radius:9pt;text-align:center;font:800 15pt/33pt ${FONT_HEAD}}.boxrow.sm{margin:0;justify-content:center}.boxrow.sm .bxs{width:20pt;height:20pt;border-radius:6pt;font-size:11pt;line-height:17pt}
.fnote{font-size:9pt;color:${T.muted};margin:6pt 0 0;font-style:italic}
.rule{border:0;border-top:1pt solid ${T.rule};margin:10pt 0}.rule.dash{border-top:1.2pt dashed #7d8aa0}
.cutline{display:flex;align-items:center;gap:8pt;margin:10pt 0;color:#586274;font:700 8pt/1 ${FONT_BODY};letter-spacing:.1em;text-transform:uppercase}
.cutline::after{content:"";flex:1;border-top:1.4pt dashed #7d8aa0}
/* match */
.match td{padding:5pt 0;vertical-align:middle}
.match .it{border:1.2pt solid ${T.rule};border-radius:10pt;padding:6pt 10pt;background:#fff;display:flex;align-items:center;gap:8pt}
.match .nb{flex:none;width:20pt;height:20pt;border-radius:50%;background:var(--ink);color:#fff;font:800 10pt/20pt ${FONT_BODY};text-align:center}
.match .nb.lt{background:var(--bg);color:var(--ink);box-shadow:inset 0 0 0 1.4pt var(--mid)}
.match .dot{text-align:center}.match .dot i{display:inline-block;width:11pt;height:11pt;border-radius:50%;border:1.8pt solid var(--ink);background:#fff}
.match .ans{text-align:center;font:800 13pt/1 ${FONT_HAND};color:#1d4fb5}
.match .hd{font:800 8.5pt/1 ${FONT_BODY};letter-spacing:.12em;text-transform:uppercase;color:var(--ink);padding-bottom:4pt}
/* cover */
.hero{height:11in;width:8.5in;position:relative;overflow:hidden;background:#fff}
.hero .top{height:6.9in;background:var(--ink);position:relative;overflow:hidden;color:#fff;padding:.9in .8in 0}
.hero .geo{position:absolute;inset:0}
.hero .kick{position:relative;font:800 11pt/1 ${FONT_BODY};letter-spacing:.2em;text-transform:uppercase;opacity:.92;margin-bottom:16pt}
.hero .tit{position:relative;font:800 50pt/1.02 ${FONT_HEAD};color:#fff;max-width:6.3in;text-wrap:balance}
.hero .sub{position:relative;font:600 15pt/1.35 ${FONT_BODY};margin-top:16pt;max-width:5.6in;opacity:.96}
.hero .bot{padding:.55in .8in 0}
.hero .chipsrow{display:flex;gap:8pt;flex-wrap:wrap;margin-bottom:26pt}
.hero .cchip{background:var(--bg);color:var(--ink);font:800 11pt/1 ${FONT_BODY};padding:7pt 14pt;border-radius:999px;border:1.4pt solid var(--mid)}
.hero .nd{display:flex;gap:26pt;margin-top:8pt}.hero .nd div{flex:1;border-bottom:1.6pt solid ${T.ink};padding-bottom:3pt;font:800 12pt/1 ${FONT_HEAD};height:34pt;display:flex;align-items:flex-end}
.hero .brand{position:absolute;left:.8in;bottom:.5in;font:800 10pt/1 ${FONT_BODY};letter-spacing:.14em;text-transform:uppercase;color:${T.muted}}
.hero .stripe{position:absolute;left:0;right:0;bottom:0;height:.22in;background:linear-gradient(90deg,${T.domains.Listening.mid} 0 16.66%,${T.domains.Speaking.mid} 0 33.33%,${T.domains.Reading.mid} 0 50%,${T.domains.Writing.mid} 0 66.66%,${T.domains.Vocabulary.mid} 0 83.33%,${T.domains.Game.mid} 0)}
.hero.compact{width:100%;height:auto;border-radius:16pt;margin:0 0 10pt}.hero.compact .top{height:auto;padding:20pt 26pt 18pt}.hero.compact .kick{margin-bottom:8pt;font-size:8.5pt}.hero.compact .tit{font-size:30pt;max-width:none}.hero.compact .sub{font-size:11pt;margin-top:8pt;max-width:5.4in}
@media print{.sec{box-shadow:none}}
`;
}
