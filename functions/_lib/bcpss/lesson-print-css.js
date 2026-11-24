// Lesson Companion print: CSS layered on top of studio-print-css.js. Lesson pages use larger student type, a footer that carries the
// non-affiliation line on every printed page, and a 10pt floor for every piece of text (the studio stylesheet uses 8-9.5pt labels).

import { cssString } from "./studio-print-css.js";

const FONT = `"Atkinson Hyperlegible Next","Atkinson Hyperlegible","Avenir Next","Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif`;

export function lessonCss(disclaimer) {
  const box = `font:600 10pt/1.25 ${FONT};color:#586274;border-top:0.75pt solid #d5dbe5;padding-top:5pt;vertical-align:top`;
  return `
@page{margin:.5in .55in .8in;
 @bottom-left{content:${cssString(disclaimer)};${box};width:86%}
 @bottom-center{content:none;border:0}
 @bottom-right{content:"Page " counter(page);${box};width:14%;text-align:right}}
/* cut-out cards grow with their text instead of clipping it */
.lesson .grid{grid-template-rows:none!important;grid-auto-rows:minmax(1.2in,auto)}
@page teacher{margin:.4in .55in .66in}
.lesson .sec.tn-neutral:first-child{page:teacher}
body.lesson{font-size:12.5pt;line-height:1.42}
.lesson .tbl.sheet td{height:32pt}
.lesson .callout{padding:7pt 12pt;margin-bottom:7pt}
.lesson .lines{margin:2pt 0 6pt}
.lesson .ln{height:19.5pt;line-height:19.5pt}
.lesson .p-lg{font-size:14.5pt}
.lesson .band .ti{font-size:22pt}
.lesson .sec.tn-neutral{font-size:10pt;line-height:1.16}
.lesson .sec.tn-neutral .callout{padding:4pt 10pt;margin-bottom:4pt}
.lesson .sec.tn-neutral .callout>.lab{margin-bottom:3pt}
.lesson .sec.tn-neutral .tbl{margin-bottom:5pt}
.lesson .sec.tn-neutral .tbl td{padding:2.5pt 7pt}
.lesson .sec.tn-neutral .tbl th{padding:4pt 7pt}
.lesson .sec.tn-neutral .chk li{padding:1pt 0}
.lesson .sec.tn-neutral .chk{margin-bottom:4pt}
.lesson .sec.tn-neutral .h1{font-size:20pt}
.lesson .sec.tn-neutral .h2{font-size:13pt;margin:6pt 0 4pt}
.lesson .sec.tn-neutral .h3{font-size:11pt;margin:4pt 0 3pt}
.lesson .sec.tn-neutral .p-sm{margin-bottom:3pt}
.lesson .sec.tn-neutral .hero.compact .top{padding:8pt 18pt 8pt}
.lesson .sec.tn-neutral .hero.compact .tit{font-size:22pt}
.lesson .sec.tn-neutral .hero.compact .sub{font-size:10pt;margin-top:4pt;max-width:none}
.lesson .sec.tn-neutral .hero.compact{margin-bottom:6pt}
.lesson .sec.tn-neutral .cols{margin-bottom:4pt}
.lesson .sec.tn-neutral .chips{margin-bottom:3pt;gap:3pt 5pt}
.lesson .sec.tn-neutral .chip{padding:1.5pt 8pt}
/* 10pt floor */
.lesson .p-sm,.lesson .fnote,.lesson .lines .lab,.lesson .chk .why,.lesson .callout>.lab,.lesson .band .dom,.lesson .band .pill,.lesson .tbl th,.lesson .cutline,.lesson .match .hd,.lesson .chips .lab,.lesson .hero .kick,.lesson .hero.compact .kick,.lesson .hero .cchip,.lesson .hero .brand{font-size:10pt}
.lesson .sm{font-size:max(10pt,.86em)}
.lesson .tbl{font-size:max(10pt,.95em)}
.lesson .chip{font-size:max(10pt,.97em)}
.lesson .gap span{font-size:max(10pt,.7em)}
.lesson .blank b{font-size:10pt;width:15pt;height:15pt;line-height:15pt}
.lesson .grid.soft .cd .nbadge{font-size:10pt}
.lesson .nbadge{font-size:max(10pt,.5em)}
.lesson .chk .bd{font-size:10pt;line-height:16.5pt}
.lesson .hl{font-size:inherit}
.pfoot{display:none}
@media screen{.pfoot{display:block;margin-top:18pt;border-top:.75pt solid #d5dbe5;padding-top:5pt;font:600 10pt/1.25 ${FONT};color:#586274}}
`;
}
