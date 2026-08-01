// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// No giveaway: the shared multiple is not pre-highlighted. Clicking a common
// multiple that is not the smallest, or a number in only one lane, gets a
// specific, actionable nudge. The LCM is computed exactly with gcd (integer
// math), and each lane is drawn a little past the LCM so it is never simply the
// last chip.
//
// Skill: 6.NOS.4 — find the least common multiple of two numbers.
//
// Pure DOM, no dependencies. Public API:
//   renderLcmLab(host, cfg) -> { destroy }
//     cfg = {
//       kind:'lcm-lab', a:Number, b:Number,   // the first problem
//       title?:string, intro?:string,
//       presets?:[{ a, b, label? }]           // quick-pick problems
//     }

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  tealFill: "#e2f9f5",
  tealInk: "#095350",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  wrong: "#d9534f",
  gold: "#f4b400",
  goldBg: "#fff6de",
  goldInk: "#7a5200",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function gcd(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);
  while (y) [x, y] = [y, x % y];
  return x;
}
const lcm = (a, b) => (a && b ? Math.abs(a * b) / gcd(a, b) : 0);

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || document.getElementById("lcmlab-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "lcmlab-styles";
  s.textContent = `
  .lcmlab{max-width:640px;margin:var(--sp-3,12px) auto;background:#fff;border:1px solid ${C.line};border-radius:16px;
    padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .lcmlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .lcmlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .lcmlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
  .lcmlab-chip-p{padding:5px 13px;font:inherit;font-size:.85rem;font-weight:700;color:${C.navy};background:#f4f8ff;
    border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .lcmlab-chip-p:hover{background:#e2ecff;border-color:${C.accent};}
  .lcmlab-chip-p[aria-pressed="true"]{background:${C.accent};color:#fff;border-color:${C.accent};}
  .lcmlab-lane{display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap;}
  .lcmlab-lanelabel{flex:0 0 auto;min-width:5.4em;font-family:"Outfit",system-ui,sans-serif;font-weight:800;
    color:${C.navy};font-size:.92rem;}
  .lcmlab-mult{min-width:2.6em;height:2.4em;padding:0 .5em;display:inline-flex;align-items:center;justify-content:center;
    font:inherit;font-size:1.05rem;font-weight:800;color:${C.navy};background:#fbfcfe;border:2px solid ${C.line};
    border-radius:10px;cursor:pointer;transition:transform .1s,border-color .1s,background .1s;}
  .lcmlab-mult:hover{border-color:${C.accent};transform:translateY(-1px);}
  .lcmlab-mult:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .lcmlab-mult.match{background:${C.goldBg};border-color:${C.gold};color:${C.goldInk};box-shadow:0 0 0 3px rgba(244,180,0,.2);}
  .lcmlab-mult.nudge{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:lcmlab-shake .3s;}
  @keyframes lcmlab-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.lcmlab-mult.nudge{animation:none;}}
  .lcmlab-controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
  .lcmlab-btn{font:inherit;font-weight:700;font-size:.88rem;border-radius:999px;padding:8px 18px;cursor:pointer;border:2px solid transparent;}
  .lcmlab-btn-ghost{background:#fff;color:${C.navy};border-color:${C.line};}
  .lcmlab-btn-ghost:hover{background:#f4f8ff;}
  .lcmlab-btn:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .lcmlab-feed{min-height:1.2em;margin-top:10px;font-size:.92rem;font-weight:700;line-height:1.4;}
  .lcmlab-feed.ok{color:${C.teal};}
  .lcmlab-feed.no{color:${C.wrong};}
  .lcmlab-result{margin-top:6px;font-size:1.05rem;font-weight:900;color:${C.teal};}
  `;
  document.head.appendChild(s);
}

export function renderLcmLab(host, cfg = {}) {
  ensureStyles();

  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && Number(p.a) > 0 && Number(p.b) > 0)
    : [];
  const problems = presets.length
    ? presets.map((p) => ({ a: Number(p.a), b: Number(p.b), label: p.label }))
    : [{ a: Number(cfg.a) || 4, b: Number(cfg.b) || 6 }];

  const wrap = document.createElement("div");
  wrap.className = "lcmlab";
  host.appendChild(wrap);

  let _currentProblem = null;

  if (problems.length > 1) {
    const bar = document.createElement("div");
    bar.className = "lcmlab-presets";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Pick a problem");
    problems.forEach((p, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "lcmlab-chip-p";
      chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      chip.textContent = p.label || `LCM(${p.a}, ${p.b})`;
      chip.addEventListener("click", () => {
        [...bar.children].forEach((c, j) =>
          c.setAttribute("aria-pressed", j === i ? "true" : "false"),
        );
        build(problems[i]);
      });
      bar.appendChild(chip);
    });
    wrap.appendChild(bar);
  }

  const stage = document.createElement("div");
  wrap.appendChild(stage);

  function build(problem) {
    _currentProblem = problem;
    const a = problem.a;
    const b = problem.b;
    const target = lcm(a, b);
    // Draw each lane two multiples past the LCM so it's never the last chip.
    const countA = target / a + 2;
    const countB = target / b + 2;
    const multsA = Array.from({ length: countA }, (_, i) => a * (i + 1));
    const multsB = Array.from({ length: countB }, (_, i) => b * (i + 1));

    const title = problem.title || cfg.title || `Find the least common multiple of ${a} and ${b}.`;
    const intro =
      cfg.intro ||
      "Count by each number. Click the FIRST value that shows up in BOTH lanes — that's the LCM.";

    stage.innerHTML =
      `<div class="lcmlab-title">${esc(title)}</div>` +
      `<p class="lcmlab-hint">${esc(intro)}</p>` +
      lane(`Count by ${a}`, multsA) +
      lane(`Count by ${b}`, multsB) +
      `<div class="lcmlab-controls">` +
      `<button type="button" class="lcmlab-btn lcmlab-btn-ghost" data-el="reveal">Show me</button>` +
      `<button type="button" class="lcmlab-btn lcmlab-btn-ghost" data-el="clear">Clear</button>` +
      `</div>` +
      `<div class="lcmlab-feed" data-el="feed" role="status" aria-live="polite"></div>` +
      `<div class="lcmlab-result" data-el="result" hidden></div>`;

    const feed = stage.querySelector('[data-el="feed"]');
    const result = stage.querySelector('[data-el="result"]');
    let solved = false;

    const say = (kind, html) => {
      feed.className = `lcmlab-feed ${kind}`;
      feed.innerHTML = html;
    };
    const clearMarks = () => {
      stage.querySelectorAll(".lcmlab-mult").forEach((m) => m.classList.remove("match", "nudge"));
    };
    const markMatch = (value) => {
      stage
        .querySelectorAll(`.lcmlab-mult[data-v="${value}"]`)
        .forEach((m) => m.classList.add("match"));
    };

    stage.querySelectorAll(".lcmlab-mult").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (solved) return;
        const value = Number(btn.dataset.v);
        const isCommon = value % a === 0 && value % b === 0;
        clearMarks();
        if (isCommon && value === target) {
          solved = true;
          markMatch(target);
          say("ok", `🎉 <strong>Yes!</strong> ${target} is the first number in both lanes.`);
          result.hidden = false;
          result.textContent = `LCM(${a}, ${b}) = ${target}`;
        } else if (isCommon) {
          btn.classList.add("nudge");
          say(
            "no",
            `${value} is a common multiple, but not the <strong>smallest</strong> — look for an earlier match in both lanes.`,
          );
        } else {
          btn.classList.add("nudge");
          const inA = value % a === 0;
          say(
            "no",
            `${value} is only in the “count by ${inA ? a : b}” lane. The LCM has to appear in <strong>both</strong> lanes.`,
          );
        }
      });
    });

    stage.querySelector('[data-el="reveal"]').addEventListener("click", () => {
      solved = true;
      clearMarks();
      markMatch(target);
      say("ok", `The first match in both lanes is ${target}.`);
      result.hidden = false;
      result.textContent = `LCM(${a}, ${b}) = ${target}`;
    });
    stage.querySelector('[data-el="clear"]').addEventListener("click", () => {
      solved = false;
      clearMarks();
      say("", "");
      result.hidden = true;
    });

    function lane(label, mults) {
      const chips = mults
        .map(
          (m) =>
            `<button type="button" class="lcmlab-mult" data-v="${m}" aria-label="${esc(label)}: ${m}">${m}</button>`,
        )
        .join("");
      return `<div class="lcmlab-lane"><span class="lcmlab-lanelabel">${esc(label)}</span>${chips}</div>`;
    }
  }

  build(problems[0]);

  return {
    destroy() {
      wrap.remove();
    },
  };
}

export default renderLcmLab;
