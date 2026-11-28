// Math Literacy Studio exports: a standalone interactive HTML page (one file, inline CSS and JS, no network).
//
// It shows exactly the blocks every other format shows (the renderer is print.js `bodyHtml`). Problems that carry
// `choices` + a correct index become radio groups; problems that carry an `answer` and no choices get a text box
// checked by value. A wrong pick never shows the answer: the message says to try again (with the hint, when there
// is one). The right pick shows `explain`. Feedback is words plus an icon plus a border style, never colour alone.
// All dynamic text in the page script is written with textContent; the data travels as inert JSON.
import { BASE_CSS, bodyHtml } from "./print.js";
import { MLS_NAME, MLS_ORIGIN, esc, keyResource, normalizeResource } from "./raster.js";

const PAGE_CSS = `
.skip{position:absolute;left:-9999px;top:0;background:#fff;color:var(--navy);padding:.6rem 1rem;border:2px solid var(--navy);z-index:5}
.skip:focus{left:.5rem;top:.5rem}
.top{background:var(--navy);color:#fff}
.top .in{max-width:8in;margin:0 auto;padding:.6rem 1rem;display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;justify-content:space-between}
.top strong{font-size:1rem}
.tools{display:flex;gap:.5rem;flex-wrap:wrap}
.btn{min-height:44px;min-width:44px;padding:.4rem 1rem;font:bold 1rem Arial,"Liberation Sans",sans-serif;border:2px solid var(--navy);border-radius:6px;background:#fff;color:var(--navy);cursor:pointer}
.btn.primary{background:var(--navy);color:#fff}
.top .btn{border-color:#fff}
.btn:hover{background:#e4eef2;color:var(--navy)}
.btn.primary:hover{background:#0f2336;color:#fff}
.btn:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible,a:focus-visible,.choice:focus-within{outline:3px solid #b45f00;outline-offset:2px}
main:focus{outline:none}
.score{margin:.3rem 0 0;font-weight:bold}
.choice{min-height:44px;padding:.35rem .6rem;border:2px solid #7d8a94;border-radius:8px;cursor:pointer;align-items:center}
.choice input{width:1.3rem;height:1.3rem;margin:0;flex:none;accent-color:var(--navy)}
.choice:has(input:checked){border-color:var(--navy);background:#e8f0f4;box-shadow:inset 0 0 0 1px var(--navy)}
.choices.short .choice{min-width:0}
.answerbox{margin:.6rem 0}
.answerbox label{display:block;font-weight:bold;margin-bottom:.25rem}
.answerbox input[type=text]{width:100%;max-width:20rem;min-height:44px;padding:.4rem .6rem;font:1.1rem Arial,"Liberation Sans",sans-serif;border:2px solid #4a5763;border-radius:6px}
.answerbox textarea{width:100%;max-width:34rem;padding:.5rem;font:1rem Arial,"Liberation Sans",sans-serif;border:2px solid #7d8a94;border-radius:6px}
.actions{display:flex;gap:.6rem;flex-wrap:wrap;margin:.7rem 0 .3rem}
.fb:empty{display:none}
.fb{margin:.4rem 0;padding:.6rem .8rem;border-radius:8px;background:#fff}
.fb.ok{border:3px solid #0b6b4a}
.fb.no{border:3px dashed #8a3b12}
.fb.hint,.fb.info{border:2px solid var(--navy)}
.fb .ic{font-weight:bold;margin-right:.4rem}
.fb p{margin:.3rem 0}
.problem.is-correct .num{background:var(--navy);color:#fff}
footer.foot{max-width:8in;margin:2rem auto 1rem;padding:.8rem 1rem;border-top:2px solid var(--navy);font-size:.9rem;color:#33404b}
@media (prefers-reduced-motion:no-preference){.choice,.btn{transition:background-color .15s}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media print{.top,.actions,.fb,.skip,.score,.toolbar{display:none!important}.sheet{max-width:none;padding:0}html{font-size:12.5pt}}
@page{size:letter;margin:0.6in}
`;

/** The page script. Written with textContent only; reads answer data from the inert JSON block. */
const PAGE_JS = String.raw`
(function () {
  "use strict";
  var data = {};
  try { data = JSON.parse(document.getElementById("mls-data").textContent || "{}"); } catch (e) { data = {}; }

  // ---- exact number parsing: "1,344" = 1344, ".5" = 0.5, "1/2" = 0.5, "1 1/2" = 1.5 -------------------------------
  function bi(s) { return BigInt(s); }
  function frac(n, d) { if (d === 0n) return null; if (d < 0n) { n = -n; d = -d; } return { n: n, d: d }; }
  function parseFrac(raw, strict) {
    var s = String(raw).replace(/\u2212|\u2012|\u2013/g, "-").replace(/\s+/g, " ").trim();
    if (!s) return null;
    s = s.replace(/\s*\/\s*/g, "/");
    if (!strict) {
      s = s.replace(/^\$\s*/, "").replace(/\s*%$/, "");
      if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    }
    var m;
    if ((m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(s))) {
      var d1 = bi(m[4]); var n1 = bi(m[2]) * d1 + bi(m[3]);
      return frac(m[1] ? -n1 : n1, d1);
    }
    if ((m = /^(-?\d+)\/(\d+)$/.exec(s))) return frac(bi(m[1]), bi(m[2]));
    if ((m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s)) && (m[2] || m[3])) {
      var dec = m[3] || ""; var den = 10n ** BigInt(dec.length);
      var num = bi((m[2] || "0") + dec);
      return frac(m[1] ? -num : num, den);
    }
    if (!strict) {
      var t = s.replace(/\s*[A-Za-z\u00b0\u00b2\u00b3]+\.?$/, "");
      if (t !== s && t) return parseFrac(t, false);
    }
    return null;
  }
  function sameNumber(a, b) { return a && b && a.n * b.d === b.n * a.d; }

  function normText(s) {
    return String(s).toLowerCase().replace(/\u2212/g, "-").replace(/\s+/g, " ").trim()
      .replace(/\s*([,()])\s*/g, "$1").replace(/[.!]+$/, "");
  }
  function numberList(s) {
    var parts = normText(s).replace(/^[({\[]|[)}\]]$/g, "").split(/[,;\s]+/).filter(Boolean);
    if (parts.length < 2) return null;
    var out = [];
    for (var i = 0; i < parts.length; i++) { var f = parseFrac(parts[i], false); if (!f) return null; out.push(f); }
    return out;
  }
  function sortFracs(list) { return list.slice().sort(function (a, b) { var x = a.n * b.d - b.n * a.d; return x < 0n ? -1 : x > 0n ? 1 : 0; }); }
  function sameList(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (!sameNumber(a[i], b[i])) return false;
    return true;
  }
  function inputMatches(user, expected) {
    var want = parseFrac(expected, true);
    if (want) return sameNumber(parseFrac(user, false), want);
    var ew = numberList(expected);
    if (ew) {
      var uw = numberList(user);
      if (!uw) return false;
      // a pair "(2,5)" keeps its order; a set is compared sorted
      if (/^\s*\(/.test(expected)) return sameList(uw, ew);
      return sameList(sortFracs(uw), sortFracs(ew));
    }
    return normText(user) === normText(expected);
  }

  // ---- feedback (built with textContent, never innerHTML) ---------------------------------------------------------
  function say(box, cls, icon, lead, extra) {
    while (box.firstChild) box.removeChild(box.firstChild);
    box.className = "fb " + cls;
    var p = document.createElement("p");
    var ic = document.createElement("span"); ic.className = "ic"; ic.setAttribute("aria-hidden", "true"); ic.textContent = icon;
    var strong = document.createElement("strong"); strong.textContent = lead;
    p.appendChild(ic); p.appendChild(strong);
    box.appendChild(p);
    if (extra) { var q = document.createElement("p"); q.textContent = extra; box.appendChild(q); }
  }

  var problems = Array.prototype.slice.call(document.querySelectorAll(".problem[data-ref]")).filter(function (el) { return data[el.getAttribute("data-ref")]; });
  var solved = {};
  var scoreEl = document.getElementById("mls-score");
  function updateScore() {
    if (!scoreEl) return;
    var n = 0; for (var k in solved) if (solved[k]) n++;
    scoreEl.textContent = n + " of " + problems.length + " answered correctly";
  }

  function check(el) {
    var ref = el.getAttribute("data-ref"); var spec = data[ref]; var box = el.querySelector(".fb");
    var right = false;
    if (spec.kind === "choice") {
      var picked = el.querySelector("input[type=radio]:checked");
      if (!picked) { say(box, "info", "i", "Pick an answer first.", "Choose one of the choices, then press Check."); return; }
      right = Number(picked.value) === spec.correct;
    } else {
      var input = el.querySelector("input[type=text]");
      if (!input || !input.value.trim()) { say(box, "info", "i", "Type an answer first.", "Write your answer in the box, then press Check."); return; }
      right = inputMatches(input.value, spec.answer);
    }
    solved[ref] = right;
    el.classList.toggle("is-correct", right);
    if (right) say(box, "ok", "\u2713", "Correct.", spec.explain || "");
    else say(box, "no", "\u2717", "Not yet. Try again.", spec.hint ? "Press Hint if you want a clue." : "Look at the problem again and change your answer.");
    updateScore();
  }
  function hint(el) {
    var spec = data[el.getAttribute("data-ref")]; var box = el.querySelector(".fb");
    if (spec && spec.hint) say(box, "hint", "?", "Hint.", spec.hint);
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("[data-act]") : null;
    if (!btn) return;
    var el = btn.closest(".problem");
    var act = btn.getAttribute("data-act");
    if (act === "check" && el) check(el);
    else if (act === "hint" && el) hint(el);
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && ev.target && ev.target.matches && ev.target.matches(".answerbox input[type=text]")) {
      ev.preventDefault(); var el = ev.target.closest(".problem"); if (el && data[el.getAttribute("data-ref")]) check(el);
    }
  });

  var reset = document.getElementById("mls-reset");
  if (reset) reset.addEventListener("click", function () {
    problems.forEach(function (el) {
      el.classList.remove("is-correct");
      var box = el.querySelector(".fb"); if (box) { while (box.firstChild) box.removeChild(box.firstChild); box.className = "fb"; }
      Array.prototype.forEach.call(el.querySelectorAll("input[type=radio]"), function (r) { r.checked = false; });
      Array.prototype.forEach.call(el.querySelectorAll("input[type=text],textarea"), function (r) { r.value = ""; });
    });
    solved = {}; updateScore();
    var main = document.getElementById("main"); if (main) main.focus();
  });
  var print = document.getElementById("mls-print");
  if (print) print.addEventListener("click", function () { window.print(); });
  updateScore();
})();
`;

/** JSON that cannot close its script block or start an HTML comment. */
const safeJson = (o) =>
  JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

/** A standalone interactive page for a Resource (or its teacher key with `key: true`). */
export function interactiveHtml(resource, { key = false, renderVisual = null } = {}) {
  const r = key ? keyResource(resource) : normalizeResource(resource);
  const { html, data } = bodyHtml(r, { interactive: true, renderVisual });
  const checkable = Object.keys(data).length;
  return `<!doctype html>
<html lang="${esc(r.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="${MLS_NAME}">
<meta name="color-scheme" content="light">
<title>${esc(r.title)}</title>
<style>${BASE_CSS}${PAGE_CSS}</style>
</head>
<body>
<a class="skip" href="#main">Skip to the activity</a>
<svg class="defs" aria-hidden="true" focusable="false"><defs><pattern id="mls-grid" width="0.25in" height="0.25in" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="0.25in" stroke="#9aa5ad" stroke-width="1"/><line x1="0" y1="0" x2="0.25in" y2="0" stroke="#9aa5ad" stroke-width="1"/></pattern></defs></svg>
<div class="top"><div class="in"><strong>${MLS_NAME}</strong><div class="tools">${
    checkable ? '<button type="button" class="btn" id="mls-reset">Reset</button>' : ""
  }<button type="button" class="btn" id="mls-print">Print</button></div></div></div>
<main id="main" class="sheet" tabindex="-1" aria-labelledby="doc-title">
${html}
${checkable ? `<p class="score" id="mls-score" role="status" aria-live="polite"></p>` : ""}
</main>
<footer class="foot"><p>This page is one file. It loads nothing from the internet, so it keeps working offline. Your answers stay on this page and are not sent anywhere. Made with ${MLS_NAME} (${esc(MLS_ORIGIN)}).</p></footer>
<script type="application/json" id="mls-data">${safeJson(data)}</script>
<script>${PAGE_JS}</script>
</body>
</html>
`;
}
