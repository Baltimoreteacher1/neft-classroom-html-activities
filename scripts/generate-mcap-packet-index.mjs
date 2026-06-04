#!/usr/bin/env node
/**
 * Generate a per-domain index.html landing page inside each
 * mcap-review/packets/<domain>/ folder.
 *
 * The domain review pages link to "/mcap-review/packets/<domain>/" (a directory
 * URL), but those folders previously had no index.html, so the link 404'd on
 * Cloudflare Pages. This builds a scoped landing page (one domain's skills +
 * online/Word links + the full-domain Word packet), matching the design of the
 * parent mcap-review/packets/index.html.
 *
 * Source of truth: the skill .html files already in each folder (their <title>
 * gives the skill name + standard). Idempotent — safe to re-run.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const packetsDir = join(root, 'mcap-review', 'packets');

// Domain metadata mirrors the parent packets/index.html (icon + accent colour).
const DOMAINS = {
  'ratios-proportional-relationships': { icon: '⚖️', name: 'Ratios & Proportional Relationships', color: '#1FA6A2' },
  'the-number-system': { icon: '🔢', name: 'The Number System', color: '#6B4FA0' },
  'expressions-equations': { icon: '✖️', name: 'Expressions & Equations', color: '#12355B' },
  geometry: { icon: '📐', name: 'Geometry', color: '#B97A12' },
  statistics: { icon: '📊', name: 'Statistics & Probability', color: '#C0392B' },
};

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Pull "<emoji> Title" and standard code out of a skill page's <title>. */
function readSkill(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const m = html.match(/<title>([^<]*)<\/title>/i);
  // e.g. "Area of Triangles &amp; Quadrilaterals · MCAP 6.G.A.1 · Neft Teacher"
  const raw = (m ? m[1] : '').replace(/&amp;/g, '&');
  const parts = raw.split('·').map((s) => s.trim());
  const title = parts[0] || raw;
  const codeMatch = raw.match(/MCAP\s+([0-9A-Za-z.\-]+)/);
  const code = codeMatch ? codeMatch[1] : '';
  return { title, code };
}

function buildPage(slug, meta, skills, packetHref) {
  const rows = skills
    .map(
      (s) => `        <li>
          <div class="srow">
            <span class="scode">${esc(s.code)}</span>
            <span class="stitle">${esc(s.title)}</span>
          </div>
          <div class="sdl">
            <a href="./${s.file}.html">Study&nbsp;online</a>
            ${existsSync(join(packetsDir, slug, `${s.file}.docx`)) ? `<a class="dl" href="./${s.file}.docx" download>Word ⬇</a>` : ''}
          </div>
        </li>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.name)} Review Packets · Neft Teacher</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/shared.css">
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;color:#1A2733;background:#f4f7fa;margin:0;line-height:1.5}
  .wrap{max-width:1000px;margin:0 auto;padding:26px 18px 80px}
  .crumbs a{color:#5F6F80;text-decoration:none;font-size:.86rem}.crumbs a:hover{color:#1FA6A2}
  .hero{background:linear-gradient(135deg,#12355B,var(--domain));color:#fff;border-radius:18px;padding:30px 32px;margin:14px 0 26px}
  .hero h1{margin:0 0 .25em;font-size:2.1rem}
  .hero p{margin:0;opacity:.95;max-width:62ch}
  .hero .stat{margin-top:14px;display:inline-block;background:rgba(255,255,255,.16);padding:6px 14px;border-radius:30px;font-weight:600;font-size:.9rem}
  .domain{background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(18,53,91,.07);padding:20px 24px;margin:0 0 20px;border-left:8px solid var(--domain)}
  .dhead{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;border-bottom:2px solid #eef2f6;padding-bottom:12px;margin-bottom:6px}
  .dhead>div{display:flex;align-items:center;gap:10px}
  .dicon{font-size:1.5rem}
  .dhead h2{margin:0;color:#12355B;font-size:1.3rem}
  .dcount{background:var(--domain);color:#fff;font-size:.74rem;font-weight:700;padding:3px 10px;border-radius:20px}
  .bundle{background:var(--domain);color:#fff;text-decoration:none;font-weight:600;font-size:.84rem;padding:8px 14px;border-radius:9px}
  ul.skills{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 18px}
  ul.skills li{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;padding:9px 4px;border-bottom:1px solid #eef2f6}
  .srow{display:flex;flex-direction:column}
  .scode{font-size:.72rem;font-weight:700;color:var(--domain);letter-spacing:.02em}
  .stitle{font-size:.95rem;font-weight:600;color:#1A2733}
  .sdl{display:flex;gap:8px;align-items:center;white-space:nowrap}
  .sdl a{font-size:.82rem;text-decoration:none;color:#12355B;font-weight:600}
  .sdl a.dl{background:var(--domain);color:#fff;padding:4px 9px;border-radius:7px}
  .sdl a:hover{opacity:.85}
  .foot{text-align:center;color:#5F6F80;font-size:.82rem;margin-top:30px}
  @media(max-width:680px){ul.skills{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <div class="crumbs"><a href="/">Home</a> &nbsp;/&nbsp; <a href="/mcap-review/">MCAP Review</a> &nbsp;/&nbsp; <a href="/mcap-review/packets/">Review Packets</a> &nbsp;/&nbsp; ${esc(meta.name)}</div>
  <div class="hero" style="--domain:${meta.color}">
    <h1>${meta.icon} ${esc(meta.name)}</h1>
    <p>Guided study packets for every ${esc(meta.name)} skill the MCAP is most likely to test — vocabulary, worked examples, guided &amp; independent practice, and test-style questions. Study online or download a clean Word document for printing.</p>
    <span class="stat">${skills.length} skill packets · printable Word + online</span>
  </div>

  <section class="domain" style="--domain:${meta.color}">
    <header class="dhead">
      <div><span class="dicon">${meta.icon}</span><h2>${esc(meta.name)}</h2><span class="dcount">${skills.length} skills</span></div>
      ${packetHref ? `<a class="bundle" href="${packetHref}" download>⬇ Full domain packet (Word)</a>` : ''}
    </header>
    <ul class="skills">
${rows}
    </ul>
  </section>

  <p class="foot">Neft Teacher · MCAP Grade 6 Review · <a href="/mcap-review/packets/">All domains</a></p>
</div>
</body>
</html>
`;
}

let built = 0;
for (const slug of Object.keys(DOMAINS)) {
  const dir = join(packetsDir, slug);
  if (!existsSync(dir)) {
    console.warn(`! missing packet dir: ${slug}`);
    continue;
  }
  const skills = readdirSync(dir)
    .filter((f) => /^6-.*\.html$/.test(f))
    .map((f) => f.replace(/\.html$/, ''))
    .sort()
    .map((file) => ({ file, ...readSkill(join(dir, `${file}.html`)) }));
  const packetFile = `${slug}-review-packet.docx`;
  const packetHref = existsSync(join(dir, packetFile)) ? `./${packetFile}` : '';
  writeFileSync(join(dir, 'index.html'), buildPage(slug, DOMAINS[slug], skills, packetHref));
  console.log(`✓ ${slug}/index.html (${skills.length} skills)`);
  built++;
}
console.log(`\nGenerated ${built} packet index pages.`);
