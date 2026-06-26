// Shared editorial ("publisher-grade") finish for the generated lesson HTML
// documents (notes, learn, vocab, worksheet, homework, handout, slides…).
//
// This is the print/document counterpart of the interactive engine's
// engine/styles/editorial.css. The interactive lessons were taken to McGraw
// Hill, approved, and rolled engine-wide; these constants apply the SAME
// visual identity (Fraunces serif headings, paper ground, AA-safe ink, a teal
// →amber accent rule) to the standalone generated pages.
//
// Design intent: change the *finish* only — typography family of headings,
// colours, background — NOT layout or font sizes. That keeps every generator's
// existing print layout intact while making the documents read as a cohesive,
// publisher-grade set. The override block is meant to be appended LAST inside a
// generator's <style> so it wins the cascade; `!important` is used on heading
// font-family because the base stylesheets target headings via classes.

// Goes FIRST inside <style> (an @import must precede all other rules).
export const EDITORIAL_FONT_IMPORT = `@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap");`;

// Goes LAST inside <style> (appended after the generator's own rules).
export const EDITORIAL_OVERRIDES = `
/* ── Editorial publisher-grade finish (shared: scripts/lib/editorial-print.mjs) ──
   Appended last so it overrides each generator's base CSS. Finish-only:
   serif headings + paper ground + AA-safe ink. No layout/size changes. */
:root{ --ink:#19262f; --muted:#475663; }
body{ background:#f5f0e6; color:#19262f; }
h1,h2,h3,h4,h5,h6,
header.packet h1,.section>h2,.li-title,.learnit-head,.learnit-stage-title,
.mission-title,.answer-key h2,.think-block h3,.topbar .brand{
  font-family:"Fraunces",Georgia,"Times New Roman",serif !important;
  letter-spacing:-0.01em;
}
/* A thin editorial accent rule under the document's main title. */
header.packet h1{ position:relative; }
header.packet h1::after{
  content:""; display:block; width:56px; height:2px; margin-top:8px;
  background:linear-gradient(90deg,#1fa6a2,#f2c15b); border-radius:2px;
}
@media print{ body{ background:#fff !important; } }
`;

// Convenience: wrap a generator's existing CSS body so the import leads and the
// overrides trail, all inside one <style> element.
export function withEditorial(innerCss) {
  return `${EDITORIAL_FONT_IMPORT}\n${innerCss}\n${EDITORIAL_OVERRIDES}`;
}
