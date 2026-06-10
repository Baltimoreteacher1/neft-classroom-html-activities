// Shared print-friendly HTML for Factory printables (sub packets, activity
// packs). Black-and-white friendly, large readable fonts, no color-dependent
// instructions, clean tables. Self-contained — no external CSS/assets so the
// file prints identically anywhere and works offline on a Chromebook.

export const PRINT_CSS = `
  :root { --ink:#111; --line:#333; --soft:#f4f4f4; }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: var(--ink); background: #fff; margin: 0;
    font-size: 14pt; line-height: 1.5;
  }
  .page { max-width: 7.7in; margin: 0 auto; padding: 0.5in 0.6in; }
  .page + .page { page-break-before: always; }
  h1 { font-size: 24pt; margin: 0 0 4pt; }
  h2 { font-size: 18pt; margin: 18pt 0 6pt; border-bottom: 2px solid var(--line); padding-bottom: 3pt; }
  h3 { font-size: 15pt; margin: 12pt 0 4pt; }
  .meta { font-size: 12pt; color: #222; margin: 0 0 10pt; }
  .namebar { display:flex; justify-content:space-between; gap:16pt; font-size:13pt; margin: 6pt 0 14pt; }
  .namebar span { border-bottom: 1.5px solid var(--ink); flex: 1; padding-bottom: 2pt; }
  .box { border: 2px solid var(--line); border-radius: 6px; padding: 10pt 12pt; margin: 10pt 0; }
  .box h3 { margin-top: 0; }
  ol.problems, ul.steps { margin: 6pt 0; padding-left: 24pt; }
  ol.problems > li { margin: 10pt 0; }
  ul.steps > li { margin: 3pt 0; }
  .work { display:block; min-height: 34pt; border-bottom: 1px dotted #777; margin-top: 6pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 13pt; }
  th, td { border: 1.5px solid var(--line); padding: 6pt 8pt; text-align: left; }
  th { background: var(--soft); }
  .vocab dt { font-weight: bold; margin-top: 6pt; }
  .vocab dd { margin: 0 0 4pt 0; }
  .key { font-size: 12.5pt; }
  .key li { margin: 4pt 0; }
  .small { font-size: 12pt; color: #333; }
  .center { text-align: center; }
  .rule { border: none; border-top: 2px solid var(--line); margin: 14pt 0; }
  @media print { body { font-size: 12.5pt; } .no-print { display:none; } }
`;

export function htmlPage(title, bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function nameBar() {
  return `<div class="namebar"><span>Name: </span><span>Date: </span></div>`;
}

// Render a numbered problem list with a work line under each.
export function problemList(items, { work = true } = {}) {
  return `<ol class="problems">${(items || [])
    .map(
      (p) =>
        `<li>${esc(p.prompt || p)}${work ? '<span class="work"></span>' : ""}</li>`,
    )
    .join("")}</ol>`;
}
