// small-group-renderer.js — a compact, publisher-grade renderer for the
// differentiated pull-out variants (Small Group · Group 1 / Group 2) and the
// Catch-Up review stations. DELIBERATELY different from the full lesson engine:
// no identity screen, no phase nav, no notice/wonder/discovery — one focused,
// single-scroll flow: Skill review → Vocabulary → Targeted practice → Quick
// check. Self-contained (injects its own scoped styles); mounts into #app.
//
// Driven by the same config.json the lessons use; reads: variant, title,
// themeEmoji, timeEstimate, standard, contentObjective, languageObjective,
// launch{badge,narrative,conceptIntro}, vocabulary[], practice{tiers,…},
// reflect.exitTicket, smallGroup{label,who,moves,frames}.

const ACCENT = {
  group1: { name: "Extra Support", hue: "#2563eb", soft: "#e8f0ff", ink: "#1e3a8a", emoji: "🤝" },
  group2: { name: "Challenge", hue: "#d97706", soft: "#fff4e0", ink: "#92400e", emoji: "🚀" },
  catchup: { name: "Catch-Up", hue: "#0d9488", soft: "#dcf5f1", ink: "#0f766e", emoji: "🧭" },
};

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// ------------------------------------------------------------------ styles
function injectStyles(a) {
  if (document.getElementById("sg-styles")) {
    document.documentElement.style.setProperty("--sg", a.hue);
    document.documentElement.style.setProperty("--sg-soft", a.soft);
    document.documentElement.style.setProperty("--sg-ink", a.ink);
    return;
  }
  const s = document.createElement("style");
  s.id = "sg-styles";
  s.textContent = `
  :root{--sg:${a.hue};--sg-soft:${a.soft};--sg-ink:${a.ink};--sg-line:#e6e8ec;--sg-paper:#fbfcfe;--sg-text:#1f2733;--sg-mut:#5b6673}
  *{box-sizing:border-box}
  body{margin:0;background:var(--sg-paper);color:var(--sg-text);font-family:"Hanken Grotesk",system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
  #app{max-width:820px;margin:0 auto;padding:0 18px 96px}
  h1,h2,h3{font-family:"Outfit","Hanken Grotesk",system-ui,sans-serif;line-height:1.15;margin:0}
  .sg-hero{margin:0 -18px 22px;padding:26px 22px 24px;background:linear-gradient(135deg,var(--sg) 0%,color-mix(in srgb,var(--sg) 72%,#000) 100%);color:#fff}
  .sg-kicker{display:inline-flex;align-items:center;gap:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12.5px;background:rgba(255,255,255,.2);padding:5px 12px;border-radius:999px}
  .sg-hero h1{font-size:30px;font-weight:900;margin:12px 0 6px}
  .sg-obj{font-size:16px;font-weight:600;opacity:.97;margin:6px 0 0}
  .sg-langobj{font-size:13.5px;opacity:.9;margin:6px 0 0}
  .sg-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  .sg-chip{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:700}
  .sg-teacher{margin:14px -18px 24px;padding:0 18px}
  .sg-teacher details{background:#fff;border:1px dashed var(--sg);border-radius:12px;padding:0}
  .sg-teacher summary{cursor:pointer;padding:12px 16px;font-weight:800;color:var(--sg-ink);list-style:none;display:flex;align-items:center;gap:8px}
  .sg-teacher summary::-webkit-details-marker{display:none}
  .sg-teacher summary::before{content:"▸";color:var(--sg);transition:.15s}
  .sg-teacher details[open] summary::before{transform:rotate(90deg)}
  .sg-teacher .sg-tbody{padding:0 18px 16px 40px}
  .sg-teacher li{margin:5px 0}
  .sg-frames{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .sg-frame{background:var(--sg-soft);color:var(--sg-ink);border-radius:8px;padding:6px 10px;font-size:13.5px;font-weight:600}
  .sg-rail{position:sticky;top:0;z-index:20;display:flex;gap:6px;margin:0 -18px 20px;padding:10px 18px;background:rgba(251,252,254,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--sg-line)}
  .sg-step{flex:1;display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;color:var(--sg-mut);background:none;border:0;cursor:pointer;padding:6px 4px;border-radius:8px}
  .sg-step .dot{width:22px;height:22px;border-radius:50%;background:#eef0f3;color:var(--sg-mut);display:grid;place-items:center;font-size:12px;flex:none}
  .sg-step.done .dot{background:var(--sg);color:#fff}
  .sg-step.done{color:var(--sg-ink)}
  section.sg-sec{margin:0 0 26px;scroll-margin-top:66px}
  .sg-h{display:flex;align-items:center;gap:10px;margin:0 0 14px}
  .sg-h .n{width:30px;height:30px;border-radius:9px;background:var(--sg);color:#fff;display:grid;place-items:center;font-weight:900;font-size:15px;flex:none}
  .sg-h h2{font-size:21px;font-weight:800}
  .card{background:#fff;border:1px solid var(--sg-line);border-radius:14px;padding:18px;margin:0 0 14px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
  .keyidea{background:var(--sg-soft);border-left:5px solid var(--sg);border-radius:12px;padding:14px 16px;margin:0 0 16px;font-weight:700;color:var(--sg-ink)}
  .keyidea .lab{display:block;font-size:12px;letter-spacing:.05em;text-transform:uppercase;opacity:.8;margin-bottom:3px}
  .block-lab{font-weight:800;color:var(--sg-ink);margin:0 0 6px;font-size:15px}
  .steps{margin:0;padding-left:0;list-style:none;counter-reset:st}
  .steps li{position:relative;padding:6px 0 6px 34px;border-bottom:1px dashed var(--sg-line)}
  .steps li:last-child{border-bottom:0}
  .steps li::before{counter-increment:st;content:counter(st);position:absolute;left:0;top:6px;width:22px;height:22px;border-radius:50%;background:var(--sg-soft);color:var(--sg-ink);display:grid;place-items:center;font-size:12px;font-weight:800}
  .wedo{background:#fff}
  .vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
  .vcard{border:1px solid var(--sg-line);border-radius:12px;padding:14px;background:#fff}
  .vterm{font-family:"Outfit",sans-serif;font-weight:800;font-size:17px;color:var(--sg-ink)}
  .vterm .es{font-weight:600;color:var(--sg-mut);font-size:13.5px}
  .vdef{margin:6px 0 0;font-size:14.5px}
  .vex{margin:8px 0 0;font-size:13px;color:var(--sg-mut)}
  .vcloze{margin:10px 0 0;padding-top:10px;border-top:1px dashed var(--sg-line);font-size:14px}
  .vcloze .fillin{font-size:15px}
  .vcloze-lab{display:block;font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--sg-mut);margin-bottom:4px}
  .prob{border:1px solid var(--sg-line);border-radius:14px;padding:16px 18px;margin:0 0 14px;background:#fff}
  .prob .q{display:flex;gap:10px;font-weight:700;font-size:16px;margin:0 0 12px}
  .prob .q .pn{flex:none;width:26px;height:26px;border-radius:50%;background:var(--sg);color:#fff;display:grid;place-items:center;font-size:13px;font-weight:800}
  .choices{display:grid;gap:8px}
  .choice{display:flex;align-items:center;gap:10px;text-align:left;width:100%;padding:11px 14px;border:1.5px solid var(--sg-line);border-radius:10px;background:#fff;font-size:15px;cursor:pointer;transition:.12s;font-family:inherit;color:inherit}
  .choice:hover:not(:disabled){border-color:var(--sg);background:var(--sg-soft)}
  .choice .k{width:24px;height:24px;border-radius:6px;background:#eef0f3;display:grid;place-items:center;font-weight:800;font-size:13px;flex:none}
  .choice.correct{border-color:#16a34a;background:#eafaf0}.choice.correct .k{background:#16a34a;color:#fff}
  .choice.wrong{border-color:#dc2626;background:#fdecec}.choice.wrong .k{background:#dc2626;color:#fff}
  .choice:disabled{cursor:default;opacity:.9}
  .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}
  .btn{font-family:inherit;font-weight:800;font-size:14px;border-radius:9px;padding:9px 16px;border:1.5px solid var(--sg);background:var(--sg);color:#fff;cursor:pointer}
  .btn.ghost{background:#fff;color:var(--sg-ink)}
  .btn:disabled{opacity:.5;cursor:default}
  .fb{margin-top:12px;padding:12px 14px;border-radius:10px;font-size:14.5px;display:none}
  .fb.show{display:block}
  .fb.ok{background:#eafaf0;border:1px solid #16a34a;color:#14532d}
  .fb.no{background:#fff7ed;border:1px solid #f59e0b;color:#7c2d12}
  .fb.info{background:var(--sg-soft);border:1px solid var(--sg);color:var(--sg-ink)}
  .hintbox{margin-top:10px;font-size:14px;color:var(--sg-ink)}
  .hintbox p{margin:6px 0;padding:8px 12px;background:var(--sg-soft);border-radius:8px}
  textarea.sg-ta{width:100%;min-height:74px;border:1.5px solid var(--sg-line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:15px;resize:vertical}
  .we-steps{border:1px solid var(--sg-line);border-radius:12px;padding:6px 16px;margin-top:10px}
  .mistake{background:#fff7ed;border:1px solid #f59e0b;border-radius:12px;padding:12px 16px;color:#7c2d12;font-size:14.5px;margin-top:12px}
  .mistake b{color:#b45309}
  .sg-done{text-align:center;padding:26px 18px;border:2px dashed var(--sg);border-radius:16px;background:var(--sg-soft);color:var(--sg-ink);margin-top:8px}
  .sg-done h2{font-size:22px;margin-bottom:6px}
  .sg-foot{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:20px}
  .we-line{margin:8px 0;font-size:15px}
  .eqcap{font-family:"Outfit",sans-serif;font-weight:800;font-size:17px;color:var(--sg-ink);margin:0 0 6px}
  .colmath{display:inline-grid;justify-items:end;gap:2px;font-family:"Outfit",ui-monospace,monospace;font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;padding:10px 16px;background:var(--sg-soft);border-radius:12px;min-width:150px}
  .colmath .col-op{color:var(--sg);margin-right:14px}
  .colmath .col-rule{height:3px;background:var(--sg-ink);width:100%;margin:3px 0}
  .fillin{width:120px;font-family:inherit;font-size:24px;font-weight:800;text-align:center;border:0;border-bottom:3px solid var(--sg);background:transparent;color:var(--sg-ink);padding:2px 6px}
  .fillin:focus{outline:none;background:#fff;border-radius:6px}
  .fillin.ok{color:#16a34a;border-color:#16a34a}
  .fillin.bad{color:#dc2626;border-color:#dc2626}
  .fillline{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:2px 0}
  .fillline .fillin{font-size:20px;width:150px;text-align:left}
  .filllab{font-weight:800;color:var(--sg-ink);font-size:15px}
  .fillunit{font-weight:700;color:var(--sg-mut)}
  .wbank{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}
  .wbank-lab{font-size:13px;font-weight:800;color:var(--sg-mut);text-transform:uppercase;letter-spacing:.04em}
  .wchip{font-family:inherit;font-weight:700;font-size:14.5px;padding:7px 13px;border:1.5px solid var(--sg);border-radius:999px;background:var(--sg-soft);color:var(--sg-ink);cursor:pointer}
  .wchip:hover{background:var(--sg);color:#fff}
  .steplist{margin-top:10px;border:1px solid var(--sg-line);border-radius:12px;padding:6px 14px}
  .stepline{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:8px 0;border-bottom:1px dashed var(--sg-line);font-size:15px}
  .stepline:last-child{border-bottom:0}
  .stepline .sn{width:22px;height:22px;flex:none;border-radius:50%;background:var(--sg-soft);color:var(--sg-ink);display:inline-grid;place-items:center;font-size:12px;font-weight:800}
  .stepfill{width:90px;font-family:inherit;font-size:15px;font-weight:700;text-align:center;border:0;border-bottom:2px solid var(--sg);background:transparent;color:var(--sg-ink)}
  .stepfill:focus{outline:none}
  .stepfill.ok{color:#16a34a;border-color:#16a34a}
  .stepfill.bad{color:#dc2626;border-color:#dc2626}
  .gs-intro{background:var(--sg-soft);color:var(--sg-ink);border-radius:10px;padding:9px 13px;font-weight:600;font-size:14px;margin:0 0 12px}
  .gs-list{display:flex;flex-direction:column;gap:2px}
  .gs-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:10px 8px;border-radius:8px;font-size:15px;transition:opacity .2s}
  .gs-row:nth-child(odd){background:#fafbfc}
  .gs-row.locked{opacity:.3;pointer-events:none;filter:grayscale(.6)}
  .gs-row .sn{width:24px;height:24px;flex:none;border-radius:50%;background:var(--sg);color:#fff;display:inline-grid;place-items:center;font-size:12px;font-weight:800}
  .gs-check{padding:5px 12px;font-size:13px}
  .gs-tick{font-weight:900;color:#16a34a;font-size:18px}
  @media (max-width:520px){.sg-hero h1{font-size:24px}.sg-rail .lbl{display:none}}
  @media print{
    body{background:#fff}
    .sg-rail,.btn,.sg-teacher,.sg-foot,#mwb-launcher{display:none!important}
    .sg-hero{background:#fff!important;color:#111!important;margin:0 0 16px;padding:0 0 10px;border-bottom:2px solid #333}
    .sg-hero h1{color:#111}.sg-obj,.sg-langobj{color:#333}
    .sg-kicker,.sg-chip{background:#eee!important;color:#111!important;border-color:#ccc!important}
    .prob,.card,.vcard{break-inside:avoid;box-shadow:none}
    .keyidea,.colmath,.wchip{background:#f4f4f4!important}
  }
  `;
  document.head.appendChild(s);
}

// --------------------------------------------------------------- fragments
function conceptSection(config, a) {
  const ci = config.launch?.conceptIntro || {};
  const sec = el("section", "sg-sec");
  sec.id = "sg-review";
  sec.appendChild(el("div", "sg-h", `<span class="n">1</span><h2>Review the skill</h2>`));
  if (ci.keyIdea)
    sec.appendChild(el("div", "keyidea", `<span class="lab">Key idea</span>${esc(ci.keyIdea)}`));
  const card = el("div", "card");
  if (ci.heading) card.appendChild(el("h3", "block-lab", esc(ci.heading)));
  if (ci.intro) card.appendChild(el("p", "we-line", esc(ci.intro)));
  const blk = (b, label) => {
    if (!b || !(b.lines || []).length) return;
    card.appendChild(el("p", "block-lab", esc(b.title || label)));
    const box = el("div", "we-steps");
    const ol = el("ol", "steps");
    b.lines.forEach((l) => ol.appendChild(el("li", null, esc(l))));
    box.appendChild(ol);
    card.appendChild(box);
  };
  blk(ci.iDo, "Watch");
  blk(ci.weDo, "Try it together");
  blk(ci.youDo, "Now you try");
  sec.appendChild(card);
  return sec;
}

function vocabSection(config) {
  const vocab = config.vocabulary || [];
  if (!vocab.length) return null;
  const sec = el("section", "sg-sec");
  sec.id = "sg-vocab";
  sec.appendChild(el("div", "sg-h", `<span class="n">2</span><h2>Key vocabulary</h2>`));
  const grid = el("div", "vgrid");
  vocab.forEach((v) => {
    const ex = (v.examples || []).find((e) => e.isExample);
    const card = el(
      "div",
      "vcard",
      `<div class="vterm">${esc(v.term)}${v.termEs ? ` <span class="es">· ${esc(v.termEs)}</span>` : ""}</div>
       <div class="vdef">${esc(v.definition || "")}</div>
       ${ex ? `<div class="vex">💡 ${esc(ex.text)}${ex.why ? ` — ${esc(ex.why)}` : ""}</div>` : ""}`,
    );
    // Interactive cloze: fill in the blank with the term.
    if (v.cloze && v.cloze.includes("___")) {
      const cl = el("div", "vcloze");
      const [pre, post] = v.cloze.split(/_{2,}/);
      cl.innerHTML = `<span class="vcloze-lab">Fill the blank:</span> ${esc(pre || "")}`;
      const inp = el("input", "fillin");
      inp.type = "text";
      inp.setAttribute("aria-label", `Fill in: ${v.term}`);
      inp.style.width = "120px";
      inp.oninput = () => inp.classList.toggle("ok", isRight(inp.value, v.term));
      cl.appendChild(inp);
      cl.appendChild(el("span", null, esc(post || "")));
      card.appendChild(cl);
    }
    grid.appendChild(card);
  });
  sec.appendChild(grid);
  return sec;
}

// Collect renderable practice items across tiers (config already ordered for
// the group). Prefer clean interactive types; others become reveal cards.
function collectItems(config) {
  const p = config.practice || {};
  const order = ["approaching", "onLevel", "extending", "optional"];
  const seen = new Set();
  const out = [];
  for (const t of order)
    for (const it of p[t] || []) {
      const key = it.stem || it.title || JSON.stringify(it).slice(0, 40);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
  return out.slice(0, 6);
}

function celebrate() {
  const o = el("div", null, "🎉");
  o.style.cssText =
    "position:fixed;inset:0;display:grid;place-items:center;font-size:80px;pointer-events:none;z-index:99;animation:sgpop .9s ease-out forwards";
  if (!document.getElementById("sg-kf")) {
    const k = el("style");
    k.id = "sg-kf";
    k.textContent =
      "@keyframes sgpop{0%{transform:scale(.3);opacity:0}30%{transform:scale(1.15);opacity:1}100%{transform:scale(1.3);opacity:0}}";
    document.head.appendChild(k);
  }
  document.body.appendChild(o);
  setTimeout(() => o.remove(), 950);
}

// --- answer helpers ------------------------------------------------------
const norm = (s) =>
  String(s == null ? "" : s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "")
    .replace(/,(?=\d)/g, "");
const numOf = (s) => {
  const m = String(s)
    .replace(/[$,\s]/g, "")
    .match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};
function answerKeyOf(item) {
  if (
    item.type === "multiple-choice" &&
    Array.isArray(item.choices) &&
    typeof item.correctIndex === "number"
  )
    return String(item.choices[item.correctIndex]);
  if (item.answer != null) return String(item.answer);
  if (item.sampleAnswer != null) return String(item.sampleAnswer);
  return null;
}
function isRight(input, key) {
  if (key == null) return false;
  const a = norm(input);
  if (!a) return false;
  if (a === norm(key)) return true;
  const na = numOf(a),
    nb = numOf(key);
  return na != null && nb != null && Math.abs(na - nb) < 1e-9;
}
const OPS = { "+": "+", "-": "−", "−": "−", x: "×", "×": "×", "*": "×", "/": "÷", "÷": "÷" };
function parseEquation(stem) {
  const m = String(stem).match(/(-?\d+(?:\.\d+)?)\s*([+\-x×*/÷])\s*(-?\d+(?:\.\d+)?)/i);
  if (!m) return null;
  return { a: m[1], op: OPS[m[2].toLowerCase()] || m[2], b: m[3] };
}
function stepSentences(item) {
  return String(item.explanation || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 4);
}

// The interactive answer blank + optional word-bank scaffold. Returns the node;
// calls onSolved() the first time the student gets it right or reveals it.
function fillControls(item, key, scaffold, fb, onSolved) {
  const box = el("div");
  const eq = parseEquation(item.stem || "");
  const input = el("input", "fillin");
  input.type = "text";
  input.setAttribute("aria-label", "Your answer");
  input.placeholder = "?";
  if (numOf(key) != null) input.inputMode = "decimal"; // mobile number keypad

  if (eq) {
    box.appendChild(el("div", "eqcap", `${esc(eq.a)} ${esc(eq.op)} ${esc(eq.b)} = ?`));
    const col = el("div", "colmath");
    col.appendChild(el("div", "col-a", esc(eq.a)));
    col.appendChild(el("div", "col-b", `<span class="col-op">${esc(eq.op)}</span>${esc(eq.b)}`));
    col.appendChild(el("div", "col-rule"));
    const ans = el("div", "col-ans");
    ans.appendChild(input);
    col.appendChild(ans);
    box.appendChild(col);
  } else {
    const line = el("div", "fillline");
    line.appendChild(el("span", "filllab", "Your answer:"));
    line.appendChild(input);
    if (item.unit) line.appendChild(el("span", "fillunit", esc(item.unit)));
    box.appendChild(line);
  }

  if (scaffold && Array.isArray(item.choices) && item.choices.length) {
    const bank = el("div", "wbank");
    bank.appendChild(el("span", "wbank-lab", "Word bank:"));
    item.choices.forEach((c) => {
      const chip = el("button", "wchip", esc(c));
      chip.type = "button";
      chip.onclick = () => {
        input.value = c;
        input.focus();
      };
      bank.appendChild(chip);
    });
    box.appendChild(bank);
  }

  let tries = 0,
    done = false;
  const finish = () => {
    if (!done) {
      done = true;
      onSolved();
    }
  };
  const row = el("div", "row");
  const check = el("button", "btn", "Check");
  check.type = "button";
  check.onclick = () => {
    if (done) return;
    tries++;
    if (isRight(input.value, key)) {
      input.classList.add("ok");
      input.disabled = true;
      check.disabled = true;
      fb.className = "fb show ok";
      fb.innerHTML = `✅ <b>Correct!</b> ${esc(item.explanation || "")}`;
      celebrate();
      finish();
    } else {
      input.classList.add("bad");
      fb.className = "fb show no";
      fb.innerHTML =
        tries >= 2
          ? `Not yet. <b>Answer:</b> ${esc(key)}. ${esc(item.explanation || "")}`
          : "Not quite — check your work and try again. Use a hint or the steps below.";
      if (tries >= 2) {
        input.disabled = true;
        check.disabled = true;
        finish();
      }
    }
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") check.onclick();
  };
  row.appendChild(check);
  box.appendChild(row);
  return box;
}

// Optional "break it into steps" scaffold — reveals the reasoning; on scaffold
// variants the last number in each step becomes a fill-in blank.
function guidedSteps(item, scaffold) {
  const steps = stepSentences(item);
  if (!steps.length) return null;
  const wrap = el("div");
  const row = el("div", "row");
  const btn = el("button", "btn ghost", "🔢 Break it into steps");
  btn.type = "button";
  const box = el("div", "steplist");
  box.hidden = true;
  btn.onclick = () => {
    box.hidden = !box.hidden;
    btn.textContent = box.hidden ? "🔢 Break it into steps" : "Hide steps";
  };
  steps.forEach((s, i) => {
    const line = el("div", "stepline");
    const m = scaffold ? s.match(/^(.*?)(\d+(?:\.\d+)?)(?!.*\d)(.*)$/) : null;
    if (m) {
      line.innerHTML = `<span class="sn">${i + 1}</span>${esc(m[1])}`;
      const inp = el("input", "stepfill");
      inp.type = "text";
      inp.inputMode = "decimal";
      inp.setAttribute("aria-label", `Step ${i + 1} blank`);
      inp.oninput = () => {
        inp.classList.toggle("ok", isRight(inp.value, m[2]));
      };
      line.appendChild(inp);
      line.appendChild(el("span", null, esc(m[3])));
    } else {
      line.innerHTML = `<span class="sn">${i + 1}</span>${esc(s)}`;
    }
    box.appendChild(line);
  });
  row.appendChild(btn);
  wrap.appendChild(row);
  wrap.appendChild(box);
  return wrap;
}

function mcCard(item, index, onSolved) {
  const card = el("div", "prob");
  const stem = item.stem || item.title || "Try this.";
  card.appendChild(el("p", "q", `<span class="pn">${index + 1}</span><span>${esc(stem)}</span>`));
  const fb = el("div", "fb");
  fb.setAttribute("aria-live", "polite");
  const wrap = el("div", "choices");
  let done = false;
  item.choices.forEach((c, i) => {
    const b = el(
      "button",
      "choice",
      `<span class="k">${String.fromCharCode(65 + i)}</span><span>${esc(c)}</span>`,
    );
    b.type = "button";
    b.onclick = () => {
      if (done) return;
      done = true;
      const right = i === item.correctIndex;
      [...wrap.children].forEach((x) => (x.disabled = true));
      b.classList.add(right ? "correct" : "wrong");
      if (!right && typeof item.correctIndex === "number")
        wrap.children[item.correctIndex].classList.add("correct");
      fb.className = "fb show " + (right ? "ok" : "no");
      const cf = (item.choiceFeedback || [])[i];
      fb.innerHTML = right
        ? `✅ <b>Yes!</b> ${esc(item.explanation || "")}`
        : `${esc(cf || "Not quite.")} <br><b>Answer:</b> ${esc(item.explanation || "")}`;
      if (right) celebrate();
      onSolved();
    };
    wrap.appendChild(b);
  });
  card.appendChild(wrap);
  appendHints(card, item, fb);
  card.appendChild(fb);
  return card;
}

function errorCard(item, index, onSolved) {
  const card = el("div", "prob");
  card.appendChild(
    el(
      "p",
      "q",
      `<span class="pn">${index + 1}</span><span>${esc(item.title || item.stem || "Find the mistake")}</span>`,
    ),
  );
  const fb = el("div", "fb");
  fb.setAttribute("aria-live", "polite");
  const box = el("div", "we-steps");
  const ol = el("ol", "steps");
  item.workedExample.forEach((w) =>
    ol.appendChild(
      el("li", null, `<b>${esc(w.label || "")}</b>${w.work ? ` — ${esc(w.work)}` : ""}`),
    ),
  );
  box.appendChild(ol);
  card.appendChild(box);
  card.appendChild(el("p", "block-lab", "Which step has the mistake?"));
  const wrap = el("div", "choices");
  let done = false;
  item.workedExample.forEach((w, i) => {
    const b = el(
      "button",
      "choice",
      `<span class="k">${i + 1}</span><span>${esc(w.label || "Step " + (i + 1))}</span>`,
    );
    b.type = "button";
    b.onclick = () => {
      if (done) return;
      done = true;
      const right = i + 1 === item.errorStep;
      [...wrap.children].forEach((x) => (x.disabled = true));
      b.classList.add(right ? "correct" : "wrong");
      if (!right && item.errorStep) wrap.children[item.errorStep - 1].classList.add("correct");
      fb.className = "fb show " + (right ? "ok" : "no");
      fb.innerHTML = `${right ? "✅ <b>Found it!</b> " : "The mistake is in the highlighted step. "}<b>Fix:</b> ${esc(item.correctWork || "")}`;
      if (right) celebrate();
      onSolved();
    };
    wrap.appendChild(b);
  });
  card.appendChild(wrap);
  appendHints(card, item, fb);
  card.appendChild(fb);
  return card;
}

// Fill-in-the-blank problem: equation (vertical + horizontal) or answer blank,
// word-bank scaffold on support/review, hints, and guided step parts.
function fillCard(item, index, variant, onSolved, scaffold) {
  const card = el("div", "prob");
  const stem = item.stem || item.title || item.instructions || item.prompt || "Try this problem.";
  card.appendChild(el("p", "q", `<span class="pn">${index + 1}</span><span>${esc(stem)}</span>`));
  const fb = el("div", "fb");
  fb.setAttribute("aria-live", "polite");
  const key = answerKeyOf(item);
  // scaffold = show the tap-to-fill word bank. Passed per-problem so each small
  // group has a MIX of scaffolded blanks and pure type-in blanks (no choices).
  if (scaffold === undefined) scaffold = variant !== "group2";

  if (key != null) {
    card.appendChild(fillControls(item, key, scaffold, fb, onSolved));
  } else {
    // pure open-response — work area + reveal
    const ta = el("textarea", "sg-ta");
    ta.placeholder = "Show your thinking here…";
    card.appendChild(ta);
    const reveal = item.explanation || item.correctWork;
    const row = el("div", "row");
    const btn = el("button", "btn ghost", "Show a model answer");
    btn.type = "button";
    btn.onclick = () => {
      fb.className = "fb show info";
      fb.innerHTML = reveal
        ? `<b>Model:</b> ${esc(reveal)}`
        : "Explain your thinking to your group.";
      btn.disabled = true;
      onSolved();
    };
    row.appendChild(btn);
    card.appendChild(row);
  }

  const steps = guidedSteps(item, scaffold);
  if (steps) card.appendChild(steps);
  appendHints(card, item, fb);
  card.appendChild(fb);
  return card;
}

// Parse the explanation into progressive steps: each sentence becomes a step,
// and the last number in a sentence becomes a type-in blank.
function numberedSteps(item) {
  return stepSentences(item).map((s) => {
    const m = s.match(/^(.*?)(\d+(?:\.\d+)?)(?!.*\d)(.*)$/);
    return m ? { pre: m[1], ans: m[2], post: m[3] } : { plain: s };
  });
}
const qualifiesGuided = (item) => numberedSteps(item).filter((s) => s.ans).length >= 2;

// Progressive guided-solve: the student types each number as the problem
// progresses; a correct entry unlocks the next step, building the full worked
// solution. This is the "type in numbers as the problem progresses" experience.
function guidedSolveCard(item, index, variant, onSolved) {
  const card = el("div", "prob");
  const stem = item.stem || item.title || "Solve step by step.";
  card.appendChild(el("p", "q", `<span class="pn">${index + 1}</span><span>${esc(stem)}</span>`));
  card.appendChild(
    el(
      "p",
      "gs-intro",
      "🧩 Let's solve it together — type each number as we go. Get one right to unlock the next step.",
    ),
  );
  const steps = numberedSteps(item);
  const list = el("div", "gs-list");
  const fb = el("div", "fb");
  fb.setAttribute("aria-live", "polite");
  const rows = [];
  let unlocked = 0;
  const fillable = steps.filter((s) => s.ans).length;
  let done = 0;

  const advance = () => {
    unlocked++;
    while (unlocked < steps.length && rows[unlocked]) {
      rows[unlocked].el.classList.remove("locked");
      if (steps[unlocked].ans) {
        rows[unlocked].input?.focus();
        break;
      }
      unlocked++; // auto-pass context (non-numbered) lines
    }
    if (done >= fillable) {
      fb.className = "fb show ok";
      fb.innerHTML = "✅ <b>You solved it, step by step!</b>";
      celebrate();
      onSolved();
    }
  };

  steps.forEach((s, i) => {
    const row = el("div", "gs-row" + (i > 0 ? " locked" : ""));
    row.appendChild(el("span", "sn", String(i + 1)));
    if (s.ans) {
      row.appendChild(el("span", null, esc(s.pre)));
      const input = el("input", "stepfill");
      input.type = "text";
      input.inputMode = "decimal";
      input.setAttribute("aria-label", `Step ${i + 1}`);
      let tries = 0,
        got = false;
      const check = el("button", "btn ghost gs-check", "Check");
      check.type = "button";
      check.onclick = () => {
        if (got) return;
        tries++;
        if (isRight(input.value, s.ans)) {
          got = true;
          done++;
          input.classList.add("ok");
          input.disabled = true;
          check.disabled = true;
          row.appendChild(el("span", "gs-tick", "✓"));
          advance();
        } else if (tries >= 2) {
          got = true;
          done++;
          input.value = s.ans;
          input.classList.add("ok");
          input.disabled = true;
          check.disabled = true;
          row.appendChild(el("span", "gs-tick", "→"));
          advance();
        } else {
          input.classList.add("bad");
          fb.className = "fb show no";
          fb.innerHTML = "Not quite — look at this step again and try once more.";
        }
      };
      input.onkeydown = (e) => {
        if (e.key === "Enter") check.onclick();
      };
      row.appendChild(input);
      row.appendChild(el("span", null, esc(s.post)));
      row.appendChild(check);
      rows.push({ el: row, input });
    } else {
      row.appendChild(el("span", null, esc(s.plain)));
      rows.push({ el: row });
    }
    list.appendChild(row);
  });
  card.appendChild(list);
  appendHints(card, item, fb);
  card.appendChild(fb);
  return card;
}

// Router.
function problemCard(item, index, variant, onSolved, guided, scaffold) {
  if (item.type === "error-analysis" && Array.isArray(item.workedExample))
    return errorCard(item, index, onSolved);
  if (guided && qualifiesGuided(item)) return guidedSolveCard(item, index, variant, onSolved);
  return fillCard(item, index, variant, onSolved, scaffold);
}

function appendHints(card, item, fb) {
  const hints = item.hints || (item.hint ? [item.hint] : []);
  if (!hints.length) return;
  let shown = 0;
  const box = el("div", "hintbox");
  const row = el("div", "row");
  const btn = el("button", "btn ghost", "💡 Hint");
  btn.type = "button";
  btn.onclick = () => {
    if (shown >= hints.length) return;
    box.appendChild(el("p", null, esc(hints[shown++])));
    if (shown >= hints.length) {
      btn.disabled = true;
      btn.textContent = "No more hints";
    }
  };
  row.appendChild(btn);
  // Callers append the feedback node (fb) after this call, so appending here
  // keeps order: content → hints → feedback.
  card.appendChild(row);
  card.appendChild(box);
}

function practiceSection(config, markDone, tally) {
  const items = collectItems(config);
  const sec = el("section", "sg-sec");
  sec.id = "sg-practice";
  const label = config.variant === "group2" ? "Challenge practice" : "Practice";
  sec.appendChild(el("div", "sg-h", `<span class="n">3</span><h2>${label}</h2>`));
  const cm = config.practice?.commonMistake;
  if (config.variant === "group1" && cm) {
    const text = typeof cm === "string" ? cm : cm.text || cm.mistake || "";
    if (text) sec.appendChild(el("div", "mistake", `<b>⚠️ Watch out:</b> ${esc(text)}`));
  }
  let solved = 0;
  const total = items.length;
  // Small groups get 1–2 progressive "type as you go" guided-solve problems.
  const wantGuided = config.variant === "group1" || config.variant === "group2";
  let guidedLeft = wantGuided ? 2 : 0;
  // Mix of blanks: some with the tap-to-fill word bank, some pure type-in (no
  // choices). Group 1 alternates; Group 2 stays pure; Catch-Up keeps the bank.
  let fillIdx = 0;
  items.forEach((it, i) => {
    const useGuided = guidedLeft > 0 && it.type !== "error-analysis" && qualifiesGuided(it);
    if (useGuided) guidedLeft--;
    let scaffold;
    if (config.variant === "group1")
      scaffold = fillIdx % 2 === 0; // mix: on, off, on…
    else if (config.variant === "group2")
      scaffold = false; // pure type-in
    else scaffold = true; // catch-up review keeps the word bank
    if (!useGuided && it.type !== "error-analysis") fillIdx++;
    if (tally) tally.total++;
    sec.appendChild(
      problemCard(
        it,
        i,
        config.variant,
        () => {
          solved++;
          if (solved >= Math.ceil(total * 0.6)) markDone("sg-practice");
          tally?.bump();
        },
        useGuided,
        scaffold,
      ),
    );
  });
  const oa = config.practice?.optionalActivity;
  if (oa)
    sec.appendChild(
      el(
        "div",
        "card",
        `<h3 class="block-lab">${esc(oa.emoji || "⭐")} ${esc(oa.name || "Bonus")}</h3><p class="we-line">${esc(oa.intro || "")}</p>`,
      ),
    );
  return sec;
}

function checkSection(config, markDone, tally) {
  const et = config.reflect?.exitTicket;
  if (!et) return null;
  const sec = el("section", "sg-sec");
  sec.id = "sg-check";
  sec.appendChild(el("div", "sg-h", `<span class="n">4</span><h2>Quick check</h2>`));
  if (tally) tally.total++;
  const onDone = () => {
    markDone("sg-check");
    tally?.bump();
  };
  sec.appendChild(
    Array.isArray(et.choices)
      ? mcCard({ ...et, type: "multiple-choice" }, 0, onDone)
      : fillCard(et, 0, config.variant, onDone),
  );
  return sec;
}

// ------------------------------------------------------------------- boot
export function bootSmallGroup(config) {
  const variant =
    config.variant || (config.smallGroup ? `group${config.smallGroup.group}` : "catchup");
  const a = ACCENT[variant] || ACCENT.catchup;
  injectStyles(a);
  document.title = `${config.title || "Small Group"} — Neft Teacher`;

  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = "";

  // Teacher vs student view: the facilitation panel and curriculum back-link are
  // teacher-only (canonical nt-teacher-mode key). Students get a clean activity.
  let isTeacher = false;
  try {
    isTeacher = localStorage.getItem("nt-teacher-mode") === "1";
  } catch {
    isTeacher = false;
  }

  // Hero
  const hero = el("div", "sg-hero");
  const badge = config.launch?.badge || `Small Group · ${a.name}`;
  hero.appendChild(el("div", null, `<span class="sg-kicker">${a.emoji} ${esc(badge)}</span>`));
  hero.appendChild(el("h1", null, esc(config.title || "")));
  if (config.contentObjective)
    hero.appendChild(el("p", "sg-obj", `🎯 ${esc(config.contentObjective)}`));
  if (config.languageObjective)
    hero.appendChild(el("p", "sg-langobj", `🗣️ ${esc(config.languageObjective)}`));
  const chips = el("div", "sg-chips");
  if (config.timeEstimate)
    chips.appendChild(el("span", "sg-chip", `⏱️ ${esc(config.timeEstimate)}`));
  if (config.standard) chips.appendChild(el("span", "sg-chip", esc(config.standard)));
  chips.appendChild(el("span", "sg-chip", `${a.emoji} ${esc(a.name)}`));
  hero.appendChild(chips);
  app.appendChild(hero);

  // Teacher facilitation (collapsed) — teacher mode only.
  const sg = config.smallGroup;
  if (isTeacher && sg && (sg.moves || sg.who)) {
    const wrap = el("div", "sg-teacher");
    const moves = (sg.moves || []).map((m) => `<li>${esc(m)}</li>`).join("");
    const frames = (sg.frames || []).map((f) => `<span class="sg-frame">${esc(f)}</span>`).join("");
    wrap.innerHTML = `<details><summary>👩‍🏫 Teacher facilitation (${esc(sg.label || a.name)})</summary>
      <div class="sg-tbody">
        ${sg.who ? `<p><b>Who:</b> ${esc(sg.who)}</p>` : ""}
        ${moves ? `<p><b>Moves:</b></p><ul>${moves}</ul>` : ""}
        ${frames ? `<p><b>Sentence frames:</b></p><div class="sg-frames">${frames}</div>` : ""}
      </div></details>`;
    app.appendChild(wrap);
  }

  // Progress rail
  const steps = [
    ["sg-review", "Review"],
    ["sg-vocab", "Words"],
    ["sg-practice", "Practice"],
    ["sg-check", "Check"],
  ];
  const rail = el("div", "sg-rail");
  const stepEls = {};
  steps.forEach(([id, label], i) => {
    const b = el(
      "button",
      "sg-step",
      `<span class="dot">${i + 1}</span><span class="lbl">${label}</span>`,
    );
    b.type = "button";
    b.onclick = () =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    stepEls[id] = b;
    rail.appendChild(b);
  });
  app.appendChild(rail);
  const markDone = (id) => stepEls[id]?.classList.add("done");

  // Sections
  const review = conceptSection(config, a);
  app.appendChild(review);
  stepEls["sg-review"].classList.add("done");
  const vocab = vocabSection(config);
  if (vocab) app.appendChild(vocab);
  else stepEls["sg-vocab"].classList.add("done");
  if (vocab) markDone("sg-vocab");
  // Completion tally — celebrate + reveal a summary when every problem is done.
  const done = el("div", "sg-done");
  done.hidden = true;
  const tally = {
    total: 0,
    solved: 0,
    bump() {
      this.solved++;
      if (this.solved >= this.total && done.hidden) {
        done.hidden = false;
        done.innerHTML = `<h2>🎉 You finished this small group!</h2><p>You worked through all ${this.total} problems. Nice thinking — you're ready for what's next.</p>`;
        celebrate();
        done.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
  };

  app.appendChild(practiceSection(config, markDone, tally));
  const check = checkSection(config, markDone, tally);
  if (check) app.appendChild(check);
  app.appendChild(done);

  // Footer — Print for everyone; the curriculum back-link and the Canvas SCORM
  // download are teacher-only actions.
  const foot = el("div", "sg-foot");
  if (isTeacher) {
    const back = el("a", "btn ghost");
    back.href = "/curriculum/";
    back.textContent = "← Back to all lessons";
    foot.appendChild(back);
  }
  const print = el("button", "btn ghost", "🖨️ Print");
  print.type = "button";
  print.onclick = () => window.print();
  foot.appendChild(print);
  if (isTeacher) {
    const scorm = el("a", "btn ghost", "⬇️ Download for Canvas (SCORM)");
    scorm.href = `/api/scorm?activity=${encodeURIComponent(config.lessonId)}&title=${encodeURIComponent(config.title || "")}`;
    scorm.setAttribute("rel", "nofollow");
    foot.appendChild(scorm);
  }
  app.appendChild(foot);
}

export default bootSmallGroup;
