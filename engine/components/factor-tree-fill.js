// factor-tree-fill.js — Student-driven factor tree BUILDER. Takes the SAME config
// a static `factor-tree` diagram uses ({ value, left, right, title }) — but only
// needs the root `value`. Instead of a pre-baked, fixed-shape tree with blanks
// locked to config's one factorization, the student starts from the number and
// picks their OWN factors at every step. Each split they enter grows two new
// branches; composite branches keep offering a split; prime branches lock in as
// leaves. Any valid factor path is accepted (84 = 2×42, 4×21, 6×14, …) — the tree
// literally builds out with each number the student puts into it. When every leaf
// is prime, the factorization is shown and a second stage rewrites it with
// exponents.
//
// Pure DOM + CSS (no SVG coordinate math, so the tree grows to any shape). Matches
// the static factor-tree palette so the live exercise and printed diagrams read as
// one family.
//
// Public API (unchanged):
//   renderFactorTreeFill(host, cfg) -> { destroy }
//     cfg.value      : the number to factor (required)
//     cfg.title      : optional heading
//     cfg.exponents  : false to skip the exponent-form second stage
//   (cfg.left / cfg.right are ignored — the student builds any valid tree.)

const C = {
  navy: "#12355b",
  primeFill: "#e2f9f5",
  primeStroke: "#0d7a76",
  primeInk: "#095350",
  compFill: "#fbf4e6",
  compStroke: "#d4952a",
  compInk: "#8a5800",
  line: "#c3d3e2",
  ink: "#1a2b3c",
  muted: "#54677c",
  accent: "#1d4ed8",
  wrong: "#d9534f",
};

const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
function sup(n) {
  return String(n)
    .split("")
    .map((d) => SUP[d] || d)
    .join("");
}

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

// Ascending [prime, count] pairs: [2,2,3,7] -> [[2,2],[3,1],[7,1]].
function primeCounts(primes) {
  const counts = new Map();
  for (const p of primes) counts.set(p, (counts.get(p) || 0) + 1);
  return [...counts.entries()].sort((a, b) => a[0] - b[0]);
}

// Compact exponent form: [2,2,3,7] -> "2² × 3 × 7".
function exponentForm(primes) {
  return primeCounts(primes)
    .map(([p, k]) => (k > 1 ? `${p}${sup(k)}` : `${p}`))
    .join(" × ");
}

// One-time scoped styles. Guarded by id so repeated mounts share a single <style>.
function ensureStyles() {
  if (document.getElementById("ft-fill-styles")) return;
  const s = document.createElement("style");
  s.id = "ft-fill-styles";
  s.textContent = `
  .ftb-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .ftb-title{font-weight:700;color:var(--navy,${C.navy});margin-bottom:6px;font-size:.98rem;text-align:center;}
  .ftb-hint{font-size:.82rem;color:${C.muted};margin-bottom:10px;text-align:center;max-width:420px;line-height:1.4;}
  .ftb-stage{width:100%;max-width:100%;overflow-x:auto;background:#fff;border:1px solid ${C.line};
    border-radius:12px;padding:14px 10px;display:flex;justify-content:center;}
  /* Pure-CSS binary tree connectors (org-chart style). */
  .ftb-root{list-style:none;margin:0;padding:0;display:flex;justify-content:center;}
  ul.ftb-kids{list-style:none;margin:0;padding:20px 0 0;display:flex;justify-content:center;position:relative;}
  ul.ftb-kids::before{content:"";position:absolute;top:0;left:50%;width:0;height:20px;border-left:2px solid ${C.line};}
  .ftb-li{position:relative;padding:20px 8px 0;display:flex;flex-direction:column;align-items:center;}
  .ftb-li::before,.ftb-li::after{content:"";position:absolute;top:0;right:50%;width:50%;height:20px;border-top:2px solid ${C.line};}
  .ftb-li::after{right:auto;left:50%;border-left:2px solid ${C.line};}
  .ftb-li:first-child::before,.ftb-li:last-child::after{border:0 none;}
  .ftb-li:last-child::before{border-right:2px solid ${C.line};}
  .ftb-root>.ftb-li{padding-top:0;}
  .ftb-root>.ftb-li::before,.ftb-root>.ftb-li::after{display:none;}
  .ftb-node{display:flex;flex-direction:column;align-items:center;gap:4px;}
  .ftb-bubble{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:1rem;border:2px solid ${C.compStroke};background:${C.compFill};color:${C.compInk};}
  .ftb-bubble.prime{border-color:${C.primeStroke};background:${C.primeFill};color:${C.primeInk};}
  .ftb-bubble.root{width:48px;height:48px;font-size:1.1rem;border-color:${C.navy};color:${C.navy};background:#eef4fb;}
  .ftb-prime-tag{font-size:.62rem;font-weight:800;color:${C.primeStroke};text-transform:uppercase;letter-spacing:.04em;}
  .ftb-split{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:3px;margin-top:2px;}
  .ftb-fac{width:34px;height:30px;border:2px dashed ${C.compStroke};border-radius:7px;background:#fffdf7;color:${C.ink};
    font-weight:800;font-size:.9rem;text-align:center;padding:0;box-sizing:border-box;-moz-appearance:textfield;}
  .ftb-fac::-webkit-outer-spin-button,.ftb-fac::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .ftb-fac:focus{outline:none;border-style:solid;border-color:${C.accent};box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .ftb-x{color:${C.muted};font-weight:800;font-size:.85rem;}
  .ftb-go{font:inherit;font-weight:700;font-size:.72rem;border:0;border-radius:999px;background:${C.accent};
    color:#fff;padding:5px 10px;cursor:pointer;}
  .ftb-go:hover{filter:brightness(1.05);}
  .ftb-err{flex-basis:100%;font-size:.68rem;font-weight:700;color:${C.wrong};text-align:center;min-height:.9em;}
  .ftb-split.shake{animation:ftb-shake .32s;}
  @keyframes ftb-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.ftb-split.shake{animation:none;}}
  .ftb-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
  .ftb-btn{font:inherit;font-weight:700;font-size:.85rem;border-radius:999px;padding:7px 16px;cursor:pointer;
    border:2px solid ${C.line};background:#fff;color:${C.navy};}
  .ftb-btn:hover{border-color:${C.accent};}
  .ftb-status{min-height:1.2em;margin-top:10px;font-size:.88rem;font-weight:700;text-align:center;}
  .ftb-status.ok{color:${C.primeStroke};}
  .ftb-result{margin-top:8px;font-size:1rem;color:${C.navy};text-align:center;font-weight:800;}
  .ftb-exp{margin-top:14px;width:100%;max-width:380px;box-sizing:border-box;padding:12px 14px;
    border:1px solid ${C.line};border-left:4px solid ${C.accent};border-radius:12px;background:#f7faff;}
  .ftb-exp-title{font-weight:800;color:${C.navy};font-size:.94rem;text-align:center;}
  .ftb-exp-hint{font-size:.78rem;color:${C.muted};margin:2px 0 12px;text-align:center;line-height:1.4;}
  .ftb-exp-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;
    font-size:1.35rem;font-weight:800;color:${C.ink};}
  .ftb-exp-factor{display:inline-flex;align-items:flex-start;cursor:text;}
  .ftb-exp-base{line-height:1;}
  .ftb-exp-times{margin:0 6px;color:${C.muted};}
  .ftb-exp-input{width:30px;height:30px;margin-left:2px;border:2px dashed ${C.accent};border-radius:7px;
    background:#fff;color:${C.ink};font-weight:800;font-size:.95rem;text-align:center;padding:0;box-sizing:border-box;
    vertical-align:super;-moz-appearance:textfield;}
  .ftb-exp-input::-webkit-outer-spin-button,.ftb-exp-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .ftb-exp-input:focus{outline:none;border-style:solid;box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .ftb-exp-input.correct{border-style:solid;border-color:${C.primeStroke};background:${C.primeFill};color:${C.primeInk};}
  .ftb-exp-input.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:ftb-shake .32s;}
  .ftb-exp-status{min-height:1.2em;margin-top:10px;font-size:.85rem;font-weight:700;text-align:center;}
  .ftb-exp-status.ok{color:${C.primeStroke};}
  .ftb-exp-status.no{color:${C.wrong};}
  `;
  document.head.appendChild(s);
}

export function renderFactorTreeFill(host, cfg) {
  ensureStyles();
  const rootVal = Number(cfg.value);
  const withExponents = cfg.exponents !== false;

  // Tree node: { value, children: null | [nodeA, nodeB] }. The student grows it.
  const makeNode = (v) => ({ value: Number(v), children: null });
  let root = makeNode(rootVal);

  const wrap = document.createElement("div");
  wrap.className = "ftb-wrap";
  wrap.innerHTML = `
    ${cfg.title ? `<div class="ftb-title">${esc(cfg.title)}</div>` : ""}
    <div class="ftb-hint">Break the number into <b>two factors</b> that multiply to it. Keep splitting each branch until every circle is a <b>prime</b> number. You choose the factors — any correct path works!</div>
    <div class="ftb-stage"><ul class="ftb-root"></ul></div>
    <div class="ftb-controls">
      <button type="button" class="ftb-btn ftb-btn-reveal">Show me one way</button>
      <button type="button" class="ftb-btn ftb-btn-reset">Start over</button>
    </div>
    <div class="ftb-status" role="status" aria-live="polite"></div>
    <div class="ftb-result" hidden></div>
    <div class="ftb-exp" hidden></div>
  `;

  const rootUl = wrap.querySelector(".ftb-root");
  const status = wrap.querySelector(".ftb-status");
  const result = wrap.querySelector(".ftb-result");
  const expPanel = wrap.querySelector(".ftb-exp");
  let expCounts = null; // locked in when the exponent stage is built

  // ---- tree helpers -------------------------------------------------------
  function allLeavesPrime(n) {
    if (!n.children) return isPrime(n.value);
    return n.children.every(allLeavesPrime);
  }
  function leafValues(n, out = []) {
    if (!n.children) {
      out.push(n.value);
      return out;
    }
    n.children.forEach((c) => leafValues(c, out));
    return out;
  }
  // Solved: every leaf is prime AND the student actually did something (either the
  // root was split, or the root is itself already prime).
  const solved = () => allLeavesPrime(root) && (!!root.children || isPrime(root.value));

  // ---- rendering ----------------------------------------------------------
  function renderNode(n, isRoot) {
    const li = document.createElement("li");
    li.className = "ftb-li";

    const node = document.createElement("div");
    node.className = "ftb-node";
    const prime = isPrime(n.value);
    const bubble = document.createElement("div");
    bubble.className =
      "ftb-bubble" + (isRoot ? " root" : "") + (!n.children && prime ? " prime" : "");
    bubble.textContent = n.value;
    node.appendChild(bubble);

    if (!n.children) {
      if (prime) {
        const tag = document.createElement("div");
        tag.className = "ftb-prime-tag";
        tag.textContent = "prime ✓";
        node.appendChild(tag);
      } else {
        node.appendChild(splitForm(n));
      }
    }
    li.appendChild(node);

    if (n.children) {
      const ul = document.createElement("ul");
      ul.className = "ftb-kids";
      n.children.forEach((c) => ul.appendChild(renderNode(c, false)));
      li.appendChild(ul);
    }
    return li;
  }

  function splitForm(n) {
    const form = document.createElement("div");
    form.className = "ftb-split";
    form.innerHTML = `
      <input class="ftb-fac" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" aria-label="first factor of ${n.value}" placeholder="?">
      <span class="ftb-x">×</span>
      <input class="ftb-fac" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" aria-label="second factor of ${n.value}" placeholder="?">
      <button type="button" class="ftb-go">Split</button>
      <div class="ftb-err" role="status" aria-live="polite"></div>`;
    const [ia, ib] = form.querySelectorAll(".ftb-fac");
    const err = form.querySelector(".ftb-err");
    [ia, ib].forEach((inp) =>
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/[^0-9]/g, "");
        err.textContent = "";
      }),
    );
    const submit = () => trySplit(n, ia.value, ib.value, err, form);
    form.querySelector(".ftb-go").addEventListener("click", submit);
    ia.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        ib.value ? submit() : ib.focus();
      }
    });
    ib.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });
    return form;
  }

  function trySplit(n, av, bv, err, form) {
    const a = parseInt(av, 10);
    const b = parseInt(bv, 10);
    if (!av || !bv || Number.isNaN(a) || Number.isNaN(b)) {
      err.textContent = "Type two numbers.";
      return;
    }
    if (a < 2 || b < 2) {
      err.textContent = "Use factors greater than 1.";
      shake(form);
      return;
    }
    if (a * b !== n.value) {
      err.textContent = `${a} × ${b} = ${a * b}, not ${n.value}.`;
      shake(form);
      return;
    }
    n.children = [makeNode(a), makeNode(b)];
    rerender();
    focusNextSplit();
  }

  function shake(form) {
    form.classList.remove("shake");
    // reflow so the animation restarts on repeated wrong tries
    void form.offsetWidth;
    form.classList.add("shake");
  }

  function focusNextSplit() {
    const nextInput = rootUl.querySelector(".ftb-split .ftb-fac");
    if (nextInput) setTimeout(() => nextInput.focus(), 0);
  }

  function rerender() {
    rootUl.innerHTML = "";
    rootUl.appendChild(renderNode(root, true));
    updateStatus();
  }

  function updateStatus() {
    if (solved()) {
      status.textContent = root.children
        ? "Every branch is prime — factorization complete! 🎉"
        : `${rootVal} is already a prime number. 🎉`;
      status.className = "ftb-status ok";
      showResult();
    } else {
      status.textContent = "Keep splitting until every circle is a prime number.";
      status.className = "ftb-status";
    }
  }

  // ---- results + exponent stage ------------------------------------------
  function showResult() {
    const ps = leafValues(root).sort((a, b) => a - b);
    result.hidden = false;
    if (withExponents) {
      // Show only the expanded product; the exponent form stays the next challenge.
      result.innerHTML = `${rootVal} = ${ps.join(" × ")}`;
      buildExponentStage(ps, false);
    } else {
      result.innerHTML = `${rootVal} = ${ps.join(" × ")} = ${exponentForm(ps)}`;
    }
  }

  function buildExponentStage(ps, revealAnswers) {
    if (!expCounts) {
      expCounts = primeCounts(ps);
      const factors = expCounts
        .map(
          ([p]) =>
            `<span class="ftb-exp-factor"><span class="ftb-exp-base">${p}</span><sup><input class="ftb-exp-input" data-p="${p}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" aria-label="exponent for prime ${p}"></sup></span>`,
        )
        .join(`<span class="ftb-exp-times">×</span>`);
      expPanel.innerHTML = `
        <div class="ftb-exp-title">Now write it in exponent form ✍️</div>
        <div class="ftb-exp-hint">Tap each small box and type how many times that prime appears. A prime used once has exponent 1.</div>
        <div class="ftb-exp-row">${rootVal} = ${factors}</div>
        <div class="ftb-controls"><button type="button" class="ftb-btn ftb-exp-check" style="background:${C.accent};color:#fff;border-color:${C.accent};">Check exponents</button></div>
        <div class="ftb-exp-status" role="status" aria-live="polite"></div>`;
      expPanel.hidden = false;
      expPanel.querySelector(".ftb-exp-check").addEventListener("click", checkExponents);
      // Tapping anywhere on a factor focuses its exponent box (big touch target).
      expPanel.querySelectorAll(".ftb-exp-factor").forEach((f) => {
        const inp = f.querySelector(".ftb-exp-input");
        f.addEventListener("click", () => inp.focus());
      });
      expPanel.querySelectorAll(".ftb-exp-input").forEach((el) => {
        el.addEventListener("input", () => {
          el.value = el.value.replace(/[^0-9]/g, "");
          el.classList.remove("wrong", "correct");
        });
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            checkExponents();
          }
        });
      });
    }
    if (revealAnswers) {
      for (const [p, c] of expCounts) {
        const el = expPanel.querySelector(`.ftb-exp-input[data-p="${p}"]`);
        if (el) {
          el.value = String(c);
          el.classList.remove("wrong");
          el.classList.add("correct");
        }
      }
      finishExponents();
    }
  }

  function checkExponents() {
    const st = expPanel.querySelector(".ftb-exp-status");
    let allRight = true;
    let anyEmpty = false;
    for (const [p, c] of expCounts) {
      const el = expPanel.querySelector(`.ftb-exp-input[data-p="${p}"]`);
      if (!el) continue;
      el.classList.remove("correct", "wrong");
      const v = el.value.trim();
      if (v === "") {
        anyEmpty = true;
        allRight = false;
        continue;
      }
      if (parseInt(v, 10) === c) el.classList.add("correct");
      else {
        el.classList.add("wrong");
        allRight = false;
      }
    }
    if (allRight) {
      finishExponents();
    } else {
      st.textContent = anyEmpty
        ? "Fill in every exponent."
        : "Not yet — count how many times each prime appears in your tree.";
      st.className = "ftb-exp-status no";
    }
  }

  function finishExponents() {
    const st = expPanel.querySelector(".ftb-exp-status");
    const form = expCounts.map(([p, c]) => (c > 1 ? `${p}${sup(c)}` : `${p}`)).join(" × ");
    st.innerHTML = `${rootVal} = ${form} ✓`;
    st.className = "ftb-exp-status ok";
    expPanel.querySelectorAll(".ftb-exp-input").forEach((el) => {
      el.classList.remove("wrong");
      el.classList.add("correct");
    });
  }

  // ---- controls -----------------------------------------------------------
  // "Show me one way": build the canonical left-leaning tree (peel the smallest
  // prime each step) so students see one valid path — every path reaches the
  // same primes, which is the whole point.
  function canonicalChildren(v) {
    if (v < 2 || isPrime(v)) return null;
    let f = 2;
    while (v % f) f++;
    const rest = v / f;
    const node = makeNode(rest);
    node.children = canonicalChildren(rest);
    return [makeNode(f), node];
  }

  function reveal() {
    root = makeNode(rootVal);
    root.children = canonicalChildren(rootVal);
    expCounts = null;
    expPanel.hidden = true;
    rerender();
    if (solved()) {
      status.textContent = "Here's one way — every path reaches the same primes.";
      status.className = "ftb-status ok";
      if (withExponents)
        buildExponentStage(
          leafValues(root).sort((a, b) => a - b),
          true,
        );
    }
  }

  function reset() {
    root = makeNode(rootVal);
    expCounts = null;
    expPanel.hidden = true;
    expPanel.innerHTML = "";
    result.hidden = true;
    result.innerHTML = "";
    rerender();
    focusNextSplit();
  }

  const revealBtn = wrap.querySelector(".ftb-btn-reveal");
  const resetBtn = wrap.querySelector(".ftb-btn-reset");
  revealBtn.addEventListener("click", reveal);
  resetBtn.addEventListener("click", reset);

  host.appendChild(wrap);
  rerender();
  focusNextSplit();

  return {
    destroy() {
      revealBtn.removeEventListener("click", reveal);
      resetBtn.removeEventListener("click", reset);
      wrap.remove();
    },
  };
}

export default renderFactorTreeFill;
