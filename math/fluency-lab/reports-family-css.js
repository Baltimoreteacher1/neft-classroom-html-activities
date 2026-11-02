// The report stylesheet as a string, so the page and a saved standalone file render identically. Colours come from the
// ds4.css tokens (--fl-*) with the same values as fallbacks, so the saved file looks right without ds4.css.
export const REPORT_CSS = `
.rp{--ink:var(--fl-ink,#24323f);--soft:var(--fl-ink-soft,#52606d);--navy:var(--fl-navy,#17324d);--teal:var(--fl-teal,#1fa6a2);--teal-ink:var(--fl-teal-ink,#0e6b68);--tint:var(--fl-teal-soft,#dff3f1);--paper:var(--fl-paper,#f7f4ec);--line:var(--fl-line,#d5d9de);--amber:var(--fl-amber-soft,#fff4e0);max-width:760px;margin:0 auto;padding:24px;background:#fff;color:var(--ink);font:400 16px/1.5 "Atkinson Hyperlegible","Lexend",system-ui,sans-serif}
.rp *{box-sizing:border-box}
.rp .rp-h1,.rp .rp-h2{font-family:"Fraunces",Georgia,serif;color:var(--navy);margin:0}
.rp .rp-h1{font-size:1.75rem;line-height:1.15}
.rp .rp-h2{font-size:1.1rem;line-height:1.25;display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px}
.rp-head{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:3px solid var(--navy)}
.rp-art{flex:none;display:block;width:72px;height:72px}
.rp-art svg{width:72px;height:72px}
.rp-kicker{margin:0 0 2px;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal-ink)}
.rp-meta{margin:4px 0 0;color:var(--soft);font-size:.9rem}
.rp-key{margin:16px 0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--paper);font-size:.9rem}
.rp-basis{display:inline-block;padding:1px 8px;border-radius:999px;border:1.5px solid var(--navy);font:700 .68rem/1.5 "Atkinson Hyperlegible",system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;vertical-align:middle}
.rp-observed{background:var(--navy);color:#fff}
.rp-inferred{background:#fff;color:var(--navy);border-style:dashed}
.rp-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:8px}
.rp-tile{display:flex;flex-direction:column;gap:2px;align-items:flex-start;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff}
.rp-tile b{font:700 1.8rem/1 "Fraunces",Georgia,serif;color:var(--navy)}
.rp-tile span:not(.rp-basis){font-size:.85rem;color:var(--soft);margin-bottom:4px}
.rp-sec{margin-top:20px;break-inside:avoid}
.rp-note{margin:0 0 6px;font-size:.85rem;color:var(--soft)}
.rp-empty{margin:0;padding:10px 12px;border-radius:10px;background:var(--paper);color:var(--soft);font-size:.9rem}
.rp-list{list-style:none;margin:0;padding:0}
.rp-list li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line)}
.rp-list li:last-child{border-bottom:0}
.rp-list b{font-weight:700;text-align:right;color:var(--navy)}
.rp-bar-row,.rp-growth{display:grid!important;grid-template-columns:minmax(0,1.3fr) minmax(70px,1fr) minmax(0,1.1fr);align-items:center;gap:12px}
.rp-name{overflow-wrap:anywhere}
.rp-bar{display:block;width:100%;height:10px}
.rp-bar-track{fill:var(--line)}
.rp-bar-fill{fill:var(--navy)}
.rp-spark{display:block;width:100%;max-width:140px;height:auto}
.rp-axis{stroke:var(--line);stroke-width:1}
.rp-line{fill:none;stroke:var(--navy);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.rp-dot{fill:var(--teal-ink);stroke:#fff;stroke-width:1}
.rp-two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.rp-blank{display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 0;text-align:center;color:var(--soft)}
.rp-foot{margin-top:24px;padding-top:12px;border-top:1px solid var(--line);font-size:.8rem;color:var(--soft)}
@media (max-width:620px){.rp{padding:16px}.rp-tiles{grid-template-columns:1fr 1fr}.rp-two{grid-template-columns:1fr;gap:0}.rp-bar-row,.rp-growth{grid-template-columns:1fr;gap:4px}.rp-list li{flex-direction:column;gap:2px}.rp-list b{text-align:left}.rp-head{align-items:flex-start}.rp-art,.rp-art svg{width:56px;height:56px}}
@media print{
@page{size:Letter;margin:.5in}
html,body{background:#fff!important}
.rp{max-width:none;padding:0;font-size:10pt;line-height:1.35}
.rp .rp-h1{font-size:18pt}.rp .rp-h2{font-size:11.5pt}
.rp-art,.rp-art svg{width:48px;height:48px}
.rp-tile{padding:8px}.rp-tile b{font-size:16pt}
.rp-sec{margin-top:12px}
.rp-list li{padding:3px 0}
.rp-two{grid-template-columns:1fr 1fr!important;gap:16px!important}
.rp-bar-row,.rp-growth{grid-template-columns:minmax(0,1.3fr) minmax(70px,1fr) minmax(0,1.1fr)!important}
.rp-list li{flex-direction:row!important}.rp-list b{text-align:right!important}
.rp-tiles{grid-template-columns:repeat(4,1fr)!important}
.rp *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
.rp-doc{margin:0;background:#fff}
`;
