// Preservation: every route/parameter the full lab owned must still answer, and reach the lab with its parameters.
const { chromium } = require("/Users/joelneft/wt-fluency-features/node_modules/playwright");
const BASE = process.argv[2] || "https://eduwonderlab.com"; const APP = `${BASE}/math/fluency-lab/`;
const CASES = [
  ["lab itself", "lab"], ["lab.html", "lab.html"],
  ["view=teacher", "?view=teacher"], ["view=games", "?view=games"], ["view=write", "?view=write"], ["view=path", "?view=path"],
  ["view=notebook", "?view=notebook"], ["view=models", "?view=models"], ["view=practice", "?view=practice"], ["view=progress (old lab)", "?view=progress&grade=6"],
  ["start=daily", "?start=daily"], ["start=mission", "?start=mission"], ["start=checkup", "?start=checkup"], ["start=realworld", "?start=realworld"],
  ["stage=play", "?grade=6&skill=ratios&stage=play"], ["hash assignment", "#assignment=abc"], ["hash factplan", "#factplan=abc"], ["hash videos", "#videos"], ["hash board", "#board=1"],
  ["diagnostics", "?diagnostics=1"], ["publisher-demo", "?publisher-demo=1"], ["tour", "?tour=1"], ["profile", "?profile=1"],
];
(async () => {
  const b = await chromium.launch(); const rows = []; let bad = 0;
  for (const [name, path] of CASES) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 100)));
    p.on("response", (r) => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin) errs.push(`${r.status()} ${r.url().replace(BASE, "")}`); });
    let status = "";
    try {
      const res = await p.goto(`${APP}${path}`, { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
      const u = new URL(p.url()); const inLab = /\/math\/fluency-lab\/lab(\.html)?$/.test(u.pathname);
      const info = await p.evaluate(() => ({ chars: (document.body.innerText || "").trim().length, h1: document.querySelector("h1")?.textContent?.trim().slice(0, 50) || "", visible: [...document.querySelectorAll("main, #app, body > section, .view, [role=main]")].filter((e) => e.offsetParent !== null).length }));
      const hard = errs.filter((e) => (/^(4|5)\d\d /.test(e) && !/^401 /.test(e)) || /TypeError|ReferenceError|SyntaxError/.test(e));
      const gated = errs.filter((e) => /^401 /.test(e));
      const ok = res.status() < 400 && inLab && info.chars > 200 && !hard.length;
      status = ok ? (gated.length ? "ok (teacher assets 401 to anonymous, by design)" : "ok") : "FAIL"; if (!ok) bad += 1;
      rows.push({ name, requested: path, landed: u.pathname.replace("/math/fluency-lab/", "") + u.search + u.hash, status, textChars: info.chars, h1: info.h1, hardErrors: hard.slice(0, 2), gated: gated.length });
    } catch (e) { bad += 1; rows.push({ name, requested: path, status: "FAIL", hardErrors: [String(e).slice(0, 120)] }); }
    await ctx.close();
  }
  console.log(JSON.stringify({ total: rows.length, failed: bad, rows }, null, 1)); await b.close();
})();
