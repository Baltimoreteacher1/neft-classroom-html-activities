/* Unit Rate Market Mission · Deal Lab stations 2 and 3.
 * Almost-Right shopper: find the wrong step -> explain it -> repair it -> fresh attempt (same trap,
 * new numbers) -> independent transfer (a different trap, no hints). Create a deal: build a package
 * that meets a constraint -> fresh attempt -> transfer. Items come from saved seeds, so a reload
 * resumes the same numbers. A miss names the likely mistake; the answer is never shown. */
import { INPUT_ERRORS, rng, shuffle } from "./deal-lab-core.mjs";
import { CREATE_FAMILIES, checkCreate, makeCreateItem } from "./deal-lab-create.mjs";
import { ERRORS, FAMILIES, FIXES, checkExplain, checkPick, checkStep, checkUnit, hintFor, makeShopperItem, makeSolveItem, shelfText } from "./deal-lab-items.mjs";
import { announce, clearFeedback, feedback, h } from "./deal-lab-ui.mjs";

export const nextSeed = (s) => (Number(s) * 48271) % 2147483647 || 1;
export const freshSeed = () => 10000 + Math.floor(Math.random() * 890000);
const STAGES = ["step", "explain", "repair", "fresh", "transfer", "done"];
const stageChips = (names, at) =>
  `<ol class="dl-stages">${names.map((n, i) => `<li class="${i < at ? "is-done" : i === at ? "is-now" : ""}">${i < at ? "✓ " : ""}${n}</li>`).join("")}</ol>`;

/* ---------- shared better-buy solver card (repair, fresh, transfer) ---------- */
function solveCard(host, item, opts) {
  const { unit } = item;
  host.innerHTML = `<p class="q-title">${h(opts.lead)}</p><ul class="dl-shelf-lines">${["A", "B"].map((L) => `<li>${h(shelfText(item, L))}</li>`).join("")}</ul>
    ${item.question && opts.showQuestion ? `<p>${h(item.question)}</p>` : ""}
    <div class="dl-solve">${["A", "B"]
      .map(
        (L) => `<label class="dl-field"><span class="dl-k">Store ${L}: cost per ${h(unit)}</span>
      <span class="money-input"><input class="fin dl-u" data-store="${L}" inputmode="decimal" autocomplete="off" /></span><span class="dl-mark" data-mark="${L}" aria-hidden="true"></span></label>`,
      )
      .join("")}
      <button type="button" class="btn primary dl-check-u">Check my unit prices</button></div>
    <div class="dl-pick" hidden><p><strong>Which store is the better buy?</strong></p><div class="choices two"><button type="button" class="choice" data-pick="A">Store A</button><button type="button" class="choice" data-pick="B">Store B</button></div></div>
    <div class="feedback"></div><div class="dl-escape"></div>`;
  const fb = host.querySelector(".feedback");
  const misses = { A: 0, B: 0 };
  let total = 0;
  const solved = { A: false, B: false };
  host.querySelector(".dl-check-u").addEventListener("click", () => {
    const notes = [];
    for (const L of ["A", "B"]) {
      if (solved[L]) continue;
      const inp = host.querySelector(`.dl-u[data-store="${L}"]`);
      const res = checkUnit(item, L, inp.value);
      const mark = host.querySelector(`[data-mark="${L}"]`);
      if (res.status === "input") {
        notes.push(`Store ${L}: ${INPUT_ERRORS[res.error]}`);
        continue;
      }
      if (res.status === "right") {
        solved[L] = true;
        inp.readOnly = true;
        inp.classList.remove("no");
        inp.classList.add("ok");
        mark.textContent = "✓ right";
        continue;
      }
      misses[L] += 1;
      total += 1;
      inp.classList.add("no");
      mark.textContent = "✗ not yet";
      let note = `Store ${L}: ${res.msg}`;
      if (opts.hints && misses[L] >= 2) note += ` <em>Hint: ${h(hintFor(item, L))}</em>`;
      notes.push(note);
    }
    if (solved.A && solved.B) {
      host.querySelector(".dl-check-u").disabled = true;
      host.querySelector(".dl-pick").hidden = false;
      feedback(fb, "good", "✓ Both unit prices are right. Now choose the better buy.");
      host.querySelector(".dl-pick .choice").focus();
    } else feedback(fb, notes.length ? "bad" : "hint", notes.join("<br>") || "Type a unit price for each store.");
    if (total >= 3 && opts.onRetry && !host.querySelector(".dl-retry")) {
      host.querySelector(".dl-escape").innerHTML = `<button type="button" class="btn secondary dl-retry">Try the same kind of problem with new numbers</button>`;
      host.querySelector(".dl-retry").addEventListener("click", opts.onRetry);
    }
  });
  host.querySelectorAll(".dl-pick .choice").forEach((b) =>
    b.addEventListener("click", () => {
      const res = checkPick(item, b.dataset.pick);
      if (!res.ok) {
        total += 1;
        b.classList.add("wrong");
        return feedback(fb, "bad", `Not yet. ${res.msg}`);
      }
      host.querySelectorAll(".dl-pick .choice").forEach((x) => {
        x.disabled = true;
      });
      b.classList.add("correct");
      opts.onDone(total === 0);
    }),
  );
}

/* ---------- station 2: the Almost-Right shopper ---------- */
export function defaultShopper() {
  return { seed: freshSeed(), cases: 0, stage: "step" };
}
const familyFor = (st) => FAMILIES[st.cases % FAMILIES.length];
const transferFamily = (st) => FAMILIES[(st.cases + 1 + (st.seed % 3)) % FAMILIES.length];

export function mountShopper(root, ctx) {
  const lab = ctx.lab();
  if (!lab.shopper) lab.shopper = defaultShopper();
  const st = lab.shopper;
  const item = makeShopperItem(st.seed, familyFor(st));
  const go = (stage) => {
    st.stage = stage;
    ctx.save();
    mountShopper(root, ctx);
    root.querySelector("h4")?.focus();
  };
  const at = STAGES.indexOf(st.stage);
  root.innerHTML = `${stageChips(["Find the wrong step", "Explain it", "Repair it", "Fresh attempt", "On your own"], at)}
    <div class="card dl-case"><h4 tabindex="-1">Case ${st.cases + 1} · ${h(item.shopper)}'s shopping math <span class="dl-seed">case code ${st.seed}</span></h4><div class="dl-case-body"></div></div>`;
  const body = root.querySelector(".dl-case-body");
  const stepsHTML = (clickable) =>
    `<ol class="dl-steps">${item.steps
      .map(
        (s, i) =>
          `<li>${clickable ? `<button type="button" class="choice dl-stepbtn" data-i="${i}"><span class="dl-stepno">Step ${i + 1}</span> ${h(s.text)}</button>` : `<div class="dl-stepline${i === item.wrongStep ? " is-wrong" : ""}"><span class="dl-stepno">Step ${i + 1}${i === item.wrongStep ? " · the wrong step" : ""}</span> ${h(s.text)}</div>`}</li>`,
      )
      .join("")}</ol>`;
  if (st.stage === "step") {
    body.innerHTML = `<p>${h(item.shopper)} is choosing the better buy. Exactly <strong>one</strong> step has a plausible mistake. Which step goes wrong first?</p>${stepsHTML(true)}<div class="feedback"></div>`;
    const fb = body.querySelector(".feedback");
    body.querySelectorAll(".dl-stepbtn").forEach((b) =>
      b.addEventListener("click", () => {
        const res = checkStep(item, Number(b.dataset.i));
        if (!res.ok) {
          b.classList.add("wrong");
          return feedback(fb, "bad", h(res.msg));
        }
        go("explain");
      }),
    );
  } else if (st.stage === "explain") {
    const opts = (map) =>
      `<option value="">choose…</option>${shuffle(rng(st.seed), Object.entries(map))
        .map(([k, v]) => `<option value="${k}">${h(v)}</option>`)
        .join("")}`;
    body.innerHTML = `${stepsHTML(false)}<p class="dl-frame">Step ${item.wrongStep + 1} is wrong because ${h(item.shopper)}
      <select class="dl-err" aria-label="What the shopper did wrong">${opts(ERRORS)}</select>.
      To fix it, ${h(item.shopper)} should <select class="dl-fix" aria-label="How to fix it">${opts(FIXES)}</select>.</p>
      <div class="actions"><button type="button" class="btn primary dl-check-ex">Check my explanation</button></div><div class="feedback"></div>`;
    body.querySelector(".dl-check-ex").addEventListener("click", () => {
      const e = body.querySelector(".dl-err").value;
      const f = body.querySelector(".dl-fix").value;
      const fb = body.querySelector(".feedback");
      if (!e || !f) return feedback(fb, "hint", "Choose an answer in both blanks first.");
      const res = checkExplain(item, e, f);
      if (!res.ok) return feedback(fb, "bad", `Not yet. ${res.issues.map(h).join(" ")}`);
      go("repair");
    });
  } else if (st.stage === "repair") {
    body.innerHTML = `${stepsHTML(false)}<div class="dl-solve-host"></div>`;
    solveCard(body.querySelector(".dl-solve-host"), item, {
      lead: `Repair it. Find the correct cost per ${item.unit} at each store, then choose.`,
      hints: true,
      onDone: () => go("fresh"),
    });
  } else if (st.stage === "fresh" || st.stage === "transfer") {
    const fresh = st.stage === "fresh";
    st.solveSeed = st.solveSeed || nextSeed(st.seed + (fresh ? 1 : 2));
    const solve = makeSolveItem(st.solveSeed, fresh ? familyFor(st) : transferFamily(st));
    body.innerHTML = `<p class="small">${fresh ? "Same kind of trap, new numbers. Hints appear after two misses." : "On your own: a different kind of problem. No hints this time, but feedback still tells you what to check."}</p><div class="dl-solve-host"></div>`;
    solveCard(body.querySelector(".dl-solve-host"), solve, {
      lead: solve.question,
      hints: fresh,
      onRetry: () => {
        st.solveSeed = nextSeed(st.solveSeed);
        ctx.save();
        mountShopper(root, ctx);
        announce("New numbers loaded.");
      },
      onDone: (first) => {
        st.solveSeed = 0;
        if (!fresh) {
          st.cases += 1;
          st.independent = (st.independent || 0) + (first ? 1 : 0);
        }
        go(fresh ? "transfer" : "done");
      },
    });
  } else {
    body.innerHTML = `<p class="feedback show good">✓ Case closed. You found the mistake, explained it, repaired it and then solved two new problems.</p>
      <div class="actions"><button type="button" class="btn primary dl-next-case">Next case →</button></div>`;
    body.querySelector(".dl-next-case").addEventListener("click", () => {
      st.seed = nextSeed(st.seed + 3);
      go("step");
    });
  }
}

/* ---------- station 3: create a deal ---------- */
export function defaultCreate() {
  return { seed: freshSeed(), round: 0, stage: "main", built: 0 };
}
const createFamily = (st) => {
  const main = CREATE_FAMILIES[st.round % CREATE_FAMILIES.length];
  if (st.stage !== "transfer") return main;
  return CREATE_FAMILIES[(st.round + 1 + (st.seed % 3)) % CREATE_FAMILIES.length];
};
export function mountCreate(root, ctx) {
  const lab = ctx.lab();
  if (!lab.create) lab.create = defaultCreate();
  const st = lab.create;
  const seed = st.stage === "main" ? st.seed : nextSeed(st.seed + (st.stage === "fresh" ? 1 : 2));
  const item = makeCreateItem(seed, createFamily(st));
  const at = ["main", "fresh", "transfer"].indexOf(st.stage);
  root.innerHTML = `${stageChips(["Build a deal", "Fresh attempt", "On your own"], at)}
    <div class="card dl-case"><h4 tabindex="-1">Create a deal <span class="dl-seed">challenge code ${seed}</span></h4>
    <p class="q-title">${h(item.prompt)}</p><p class="small">Many packages work. Any package that meets every condition is accepted.</p>
    <div class="dl-solve"><label class="dl-field"><span class="dl-k">Package size</span><input class="fin dl-size" inputmode="numeric" autocomplete="off" /><span>${h(item.product.many)}</span></label>
    <label class="dl-field"><span class="dl-k">Price</span><span class="money-input"><input class="fin dl-cprice" inputmode="decimal" autocomplete="off" /></span></label>
    <button type="button" class="btn primary dl-check-deal">Check my deal</button></div>
    <ul class="dl-results" aria-label="Conditions"></ul><div class="feedback"></div><div class="dl-escape"></div></div>`;
  const fb = root.querySelector(".feedback");
  const list = root.querySelector(".dl-results");
  root.querySelector(".dl-check-deal").addEventListener("click", () => {
    const res = checkCreate(item, root.querySelector(".dl-size").value, root.querySelector(".dl-cprice").value);
    if (res.input) {
      list.innerHTML = "";
      return feedback(fb, "hint", `${res.input === "size" ? "Package size" : "Price"}: ${INPUT_ERRORS[res.error]}`);
    }
    list.innerHTML = res.results.map((r) => `<li class="${r.ok ? "is-ok" : "is-no"}"><strong>${r.ok ? "✓ Meets it:" : "✗ Not yet:"}</strong> ${h(r.msg)}</li>`).join("");
    if (!res.ok) return feedback(fb, "bad", "Not yet. Read the condition marked ✗, change your package, and check again.");
    st.built += 1;
    const label = st.stage === "main" ? "Next: same kind of challenge, new numbers →" : st.stage === "fresh" ? "Next: a different challenge on your own →" : "Next challenge →";
    feedback(fb, "good", `✓ Your deal works: ${h(res.unit.text)} per ${h(item.product.one)}, and it meets every condition.`);
    root.querySelector(".dl-check-deal").disabled = true;
    root.querySelector(".dl-escape").innerHTML = `<button type="button" class="btn primary dl-next-deal">${label}</button>`;
    root.querySelector(".dl-next-deal").addEventListener("click", () => {
      if (st.stage === "main") st.stage = "fresh";
      else if (st.stage === "fresh") st.stage = "transfer";
      else {
        st.stage = "main";
        st.round += 1;
        st.seed = nextSeed(st.seed + 5);
      }
      ctx.save();
      mountCreate(root, ctx);
      root.querySelector("h4")?.focus();
    });
    ctx.save();
  });
}
