// Interactive HTML activity generator. Produces a self-contained student page:
// name entry (no PIN, no teacher dashboard), clear directions, guided steps,
// a hint after a wrong answer, a stronger hint after 2 tries, a progress
// tracker, and a print-your-result option. ESOL-friendly language, works
// offline on a Chromebook (all CSS/JS inline).
import { esc } from "./print-style.mjs";

export function renderInteractive(job) {
  const c = job.card || {};
  const L = job.lesson || {};
  const title = c.title || "Math Practice";
  // Each item: prompt, the accepted answer(s), and two hints (light, then strong).
  const items = (L.practice || [])
    .filter((p) => p.answer != null && !p.teacherJudgment)
    .map((p) => ({
      prompt: p.prompt,
      answer: String(p.answer),
      hint1: "Re-read the problem. " + (L.formulas && L.formulas[0] ? "Remember: " + L.formulas[0] : "Take it one step at a time."),
      hint2: p.work ? "Work it out: " + p.work : "The answer is " + p.answer + ".",
    }));
  const data = JSON.stringify({ title, objective: L.objective || "", items });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)} — Practice</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin:0; background:#f6f7f2; color:#17202a; font-size:18px; line-height:1.5; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 20px 18px 60px; }
  .card { background:#fff; border:1px solid #d8dfdc; border-radius:14px; padding:22px; box-shadow:0 8px 24px rgba(20,30,40,.07); }
  h1 { font-size:1.7rem; margin:0 0 6px; }
  .obj { color:#115e59; font-weight:700; margin:0 0 14px; }
  label { display:block; font-weight:700; margin-bottom:6px; }
  input[type=text] { width:100%; font:inherit; padding:12px 14px; border:2px solid #d8dfdc; border-radius:10px; }
  input:focus-visible { outline:3px solid rgba(15,118,110,.35); }
  button { font:inherit; font-weight:800; cursor:pointer; border:none; border-radius:999px; padding:12px 22px; background:#0f766e; color:#fff; }
  button.secondary { background:#eef4f3; color:#115e59; }
  .bar { height:12px; background:#e7ece9; border-radius:999px; overflow:hidden; margin:14px 0; }
  .bar > div { height:100%; width:0; background:#0f766e; transition:width .3s; }
  .hint { background:#fdf6e7; border-left:5px solid #b7791f; padding:10px 14px; border-radius:8px; margin-top:12px; }
  .ok { color:#166534; font-weight:800; }
  .no { color:#c2410c; font-weight:800; }
  .q { font-size:1.25rem; font-weight:700; margin:8px 0 14px; }
  .row { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
  .hidden { display:none; }
  @media print { button, .no-print { display:none; } body { background:#fff; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="card" id="app">
    <div id="start">
      <h1>${esc(title)}</h1>
      <p class="obj">${esc(L.objective || "")}</p>
      <p>Type your name to begin. There is no code or password.</p>
      <label for="nm">Your name</label>
      <input type="text" id="nm" autocomplete="off" />
      <div class="row"><button id="go">Start →</button></div>
    </div>
    <div id="play" class="hidden">
      <div class="bar"><div id="prog"></div></div>
      <p class="small" id="count"></p>
      <p class="q" id="q"></p>
      <label for="ans">Your answer</label>
      <input type="text" id="ans" autocomplete="off" />
      <div class="row"><button id="check">Check</button><button class="secondary" id="skip">Show answer &amp; continue</button></div>
      <div id="fb"></div>
    </div>
    <div id="done" class="hidden">
      <h1>Nice work, <span id="who"></span>!</h1>
      <p id="score" class="obj"></p>
      <p>Print this page to turn in your result.</p>
      <div class="row"><button onclick="window.print()">🖨️ Print my result</button><button class="secondary" onclick="location.reload()">Try again</button></div>
    </div>
  </div>
</div>
<script>
  var DATA = ${data};
  var i = 0, correct = 0, attempts = 0, name = "";
  var $ = function(id){ return document.getElementById(id); };
  function show(id){ ["start","play","done"].forEach(function(s){ $(s).classList.toggle("hidden", s !== id); }); }
  $("go").onclick = function(){ name = ($("nm").value || "Student").trim(); if(!name) name="Student"; show("play"); render(); };
  function render(){
    var it = DATA.items[i];
    $("count").textContent = "Problem " + (i+1) + " of " + DATA.items.length;
    $("prog").style.width = (i/DATA.items.length*100) + "%";
    $("q").textContent = it.prompt;
    $("ans").value = ""; $("fb").innerHTML = ""; attempts = 0; $("ans").focus();
  }
  function norm(s){ return String(s).toLowerCase().replace(/[\\s,$%]/g,"").replace(/[^a-z0-9.\\-\\/]/g,""); }
  $("check").onclick = function(){
    var it = DATA.items[i];
    var ok = norm($("ans").value) === norm(it.answer) || norm($("ans").value).indexOf(norm(it.answer)) === 0 && norm(it.answer).length>0;
    if(ok){ correct++; $("fb").innerHTML = '<p class="ok">✓ Correct!</p>'; setTimeout(next, 700); return; }
    attempts++;
    if(attempts === 1){ $("fb").innerHTML = '<div class="hint"><strong>Hint:</strong> ' + escapeHtml(it.hint1) + '</div>'; }
    else { $("fb").innerHTML = '<div class="hint"><strong>Try this:</strong> ' + escapeHtml(it.hint2) + '</div><p class="no">Take one more try, then use “Show answer”.</p>'; }
  };
  $("skip").onclick = function(){ var it = DATA.items[i]; $("fb").innerHTML = '<p>Answer: <strong>' + escapeHtml(it.answer) + '</strong></p>'; setTimeout(next, 1100); };
  function next(){ i++; if(i >= DATA.items.length){ finish(); } else { render(); } }
  function finish(){ show("done"); $("who").textContent = name; $("score").textContent = "You got " + correct + " of " + DATA.items.length + " correct."; }
  function escapeHtml(s){ var d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
  $("ans").addEventListener("keydown", function(e){ if(e.key==="Enter") $("check").click(); });
</script>
</body>
</html>
`;
}
