/* Unit Rate Market Mission · Deal Lab station 1: linked representations + What-If lab.
 * ONE authoritative state per deal (lab.whatif.deals.A / .B = { qty, cents, rule }). The price
 * tag, the ratio table caption inputs and the graph handles all write to it; every view is then
 * redrawn from it. After a change the student must explain what changed and why. */
import { RULES, bestBuy, fmtCents, fmtExact, parseCount, parsePrice, purchase, unitPrice } from "./deal-lab-core.mjs";
import { CAUSES, changeTruth, checkChange, whyText } from "./deal-lab-create.mjs";
import { graphModel, graphSVG, numberLineSVG, ratioTableHTML, shelfSVG } from "./deal-lab-draw.mjs";
import { announce, feedback, h } from "./deal-lab-ui.mjs";

const clone = (x) => JSON.parse(JSON.stringify(x));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const plural = (one) => (/(ch|sh|s|x|z)$/.test(one) ? `${one}es` : `${one}s`);

/** Scenarios come from the page's own Better Buy Battle matchups. */
export function scenarios(battles) {
  const parse = (t) => {
    const m = /\$([\d.]+)\s+for\s+(\d+)/.exec(t);
    return { qty: Number(m[2]), cents: Math.round(Number(m[1]) * 100), rule: "none" };
  };
  return battles.map((b) => {
    const one = String(b.unit).replace(/^per\s+/, "");
    return { name: b.item, noun: { one, many: plural(one) }, deals: { A: parse(b.a), B: parse(b.b) } };
  });
}
export function defaultWhatIf(list) {
  const s = list[0];
  return { scenario: 0, noun: s.noun, deals: clone(s.deals), before: clone(s.deals), focus: "A", explained: 0, flips: 0 };
}
const clampDeal = (d) => ({ qty: Math.min(60, Math.max(1, d.qty)), cents: Math.min(6000, Math.max(5, d.cents)), rule: d.rule });

function tagHTML(L, noun) {
  const rules = RULES.map((r) => `<option value="${r.id}">${r.label}</option>`).join("");
  return `<fieldset class="dl-tag dl-tag-${L}" data-deal="${L}"><legend>Deal ${L} price tag</legend>
    <div class="dl-field"><span class="dl-k" id="dl-qk-${L}">Size</span>
      <button type="button" class="dl-step" data-act="qty" data-d="-1" aria-label="Deal ${L}: one fewer ${noun.one}">−</button>
      <input class="fin dl-qty" inputmode="numeric" aria-labelledby="dl-qk-${L}" aria-describedby="dl-unit-${L}" />
      <button type="button" class="dl-step" data-act="qty" data-d="1" aria-label="Deal ${L}: one more ${noun.one}">+</button></div>
    <div class="dl-field"><span class="dl-k" id="dl-pk-${L}">Price</span>
      <button type="button" class="dl-step" data-act="cents" data-d="-5" aria-label="Deal ${L}: 5 cents cheaper">−</button>
      <span class="money-input"><input class="fin dl-price" inputmode="decimal" aria-labelledby="dl-pk-${L}" /></span>
      <button type="button" class="dl-step" data-act="cents" data-d="5" aria-label="Deal ${L}: 5 cents more">+</button></div>
    <label class="dl-field"><span class="dl-k">Deal</span><select class="dl-rule">${rules}</select></label>
    <p class="dl-tag-unit" id="dl-unit-${L}"></p></fieldset>`;
}

export function mountWhatIf(root, ctx) {
  const list = scenarios(ctx.battles());
  const lab = ctx.lab();
  if (!lab.whatif) lab.whatif = defaultWhatIf(list);
  const W = () => ctx.lab().whatif;
  root.innerHTML = `<div class="dl-intro"><p>Change a <strong>size</strong>, a <strong>price</strong> or a <strong>deal rule</strong> on either tag. The shelf, both ratio tables, both double number lines and the graph all redraw from the same two price tags. Then explain what changed.</p>
    <label class="dl-field dl-scn-row"><span class="dl-k">Start from</span><select class="dl-scn">${list.map((s, i) => `<option value="${i}">Battle ${i + 1}: ${s.name}</option>`).join("")}</select></label></div>
    <div class="dl-tags">${tagHTML("A", W().noun)}${tagHTML("B", W().noun)}</div>
    <div class="dl-board"><div class="dl-shelf-wrap"></div>
      <div class="dl-views"><section class="dl-view" aria-label="Ratio tables"><h5>Ratio tables</h5><div class="dl-tables"></div></section>
      <section class="dl-view" aria-label="Double number lines"><h5>Double number lines</h5><div class="dl-lines"></div></section>
      <section class="dl-view dl-view-graph" aria-label="Graph"><h5>Graph: cost vs. ${W().noun.many}</h5><p class="small">Drag a big point, or focus it and use the arrow keys. A: solid line, circles. B: dashed line, squares.</p><div class="dl-graph-wrap"></div></section></div></div>
    <section class="dl-explain card" aria-label="What changed and why"></section>`;
  const scn = root.querySelector(".dl-scn");
  scn.value = String(W().scenario);
  scn.addEventListener("change", () => {
    const s = list[Number(scn.value)];
    Object.assign(W(), { scenario: Number(scn.value), noun: s.noun, deals: clone(s.deals), before: clone(s.deals), focus: "A" });
    ctx.save();
    mountWhatIf(root, ctx);
    announce(`Loaded ${s.name}. Deal A and Deal B are back to their shelf prices.`);
  });

  const setDeal = (L, next, msg) => {
    W().deals[L] = clampDeal(next);
    W().focus = L;
    ctx.save();
    refresh();
    if (msg) announce(msg());
  };
  const unitLine = (L) => `${fmtExact(unitPrice(W().deals[L])).text} per ${W().noun.one}`;
  root.querySelectorAll(".dl-tag").forEach((tag) => {
    const L = tag.dataset.deal;
    tag.querySelectorAll(".dl-step").forEach((b) =>
      b.addEventListener("click", () => {
        const d = { ...W().deals[L] };
        d[b.dataset.act] += Number(b.dataset.d);
        setDeal(L, d, () => `Deal ${L}: ${W().deals[L].qty} for ${fmtCents(W().deals[L].cents)}, ${unitLine(L)}.`);
      }),
    );
    const qty = tag.querySelector(".dl-qty");
    const price = tag.querySelector(".dl-price");
    qty.addEventListener("change", () => {
      const v = parseCount(qty.value);
      if (v.error || v.count > 60) return void (qty.value = W().deals[L].qty);
      setDeal(L, { ...W().deals[L], qty: v.count }, () => `Deal ${L} size ${v.count}, ${unitLine(L)}.`);
    });
    price.addEventListener("change", () => {
      const v = parsePrice(price.value);
      if (v.error || v.cents > 6000) return void (price.value = (W().deals[L].cents / 100).toFixed(2));
      setDeal(L, { ...W().deals[L], cents: v.cents }, () => `Deal ${L} price ${fmtCents(v.cents)}, ${unitLine(L)}.`);
    });
    tag.querySelector(".dl-rule").addEventListener("change", (e) =>
      setDeal(L, { ...W().deals[L], rule: e.target.value }, () => `Deal ${L}: ${e.target.selectedOptions[0].text}, ${unitLine(L)}.`),
    );
  });

  function wireGraph(svgHost) {
    const svg = svgHost.querySelector("svg");
    svg.querySelectorAll(".dl-handle").forEach((hd) => {
      const L = hd.dataset.deal;
      hd.addEventListener("keydown", (e) => {
        const d = { ...W().deals[L] };
        const k = { ArrowLeft: ["qty", -1], ArrowRight: ["qty", 1], ArrowDown: ["cents", -5], ArrowUp: ["cents", 5] }[e.key];
        if (!k) return;
        e.preventDefault();
        d[k[0]] += k[1];
        setDeal(L, d, () => `Deal ${L}: ${W().deals[L].qty} for ${fmtCents(W().deals[L].cents)}, ${unitLine(L)}.`);
        svgHost.querySelector(`.dl-handle[data-deal="${L}"]`)?.focus();
      });
      hd.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const g = graphModel(W().deals); // scale frozen for the whole drag
        const p = purchase(W().deals[L]);
        const factor = W().deals[L].rule === "b2g1" ? 2 : 1 - (Number(/^off(\d+)$/.exec(W().deals[L].rule)?.[1]) || 0) / 100;
        const toData = (ev) => {
          const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(svg.getScreenCTM().inverse());
          const items = ((pt.x - g.box.x0) / (g.box.x1 - g.box.x0)) * g.xMax;
          const cost = ((g.box.y1 - pt.y) / (g.box.y1 - g.box.y0)) * g.yMax;
          return { qty: Math.round(items / p.packs), cents: Math.round(cost / factor / 5) * 5 };
        };
        hd.setPointerCapture(e.pointerId);
        const move = (ev) => {
          const v = toData(ev);
          const d = clampDeal({ ...W().deals[L], ...v });
          const x = g.X(d.qty * p.packs);
          const y = g.Y((d.cents * factor) || 0);
          hd.setAttribute("transform", `translate(${x - g.X(Number(p.qty))} ${y - g.Y(Number(p.cost.n) / Number(p.cost.d))})`);
          W().deals[L] = d;
          W().focus = L;
          refresh(true);
        };
        const up = () => {
          hd.removeEventListener("pointermove", move);
          ctx.save();
          refresh();
          announce(`Deal ${L}: ${W().deals[L].qty} for ${fmtCents(W().deals[L].cents)}, ${unitLine(L)}.`);
        };
        hd.addEventListener("pointermove", move);
        hd.addEventListener("pointerup", up, { once: true });
        hd.addEventListener("pointercancel", up, { once: true });
      });
    });
  }

  function refresh(dragging = false) {
    const w = W();
    root.querySelectorAll(".dl-tag").forEach((tag) => {
      const L = tag.dataset.deal;
      const d = w.deals[L];
      const qty = tag.querySelector(".dl-qty");
      const price = tag.querySelector(".dl-price");
      if (document.activeElement !== qty) qty.value = d.qty;
      if (document.activeElement !== price) price.value = (d.cents / 100).toFixed(2);
      tag.querySelector(".dl-rule").value = d.rule;
      tag.querySelector(".dl-tag-unit").textContent = `${d.qty} ${d.qty === 1 ? w.noun.one : w.noun.many} for ${fmtCents(d.cents)} · unit price ${unitLine(L)}`;
    });
    const best = bestBuy(w.deals.A, w.deals.B);
    root.querySelector(".dl-shelf-wrap").innerHTML = shelfSVG(w.deals, w.noun, best);
    root.querySelector(".dl-tables").innerHTML = ratioTableHTML("A", w.deals.A, w.noun) + ratioTableHTML("B", w.deals.B, w.noun);
    root.querySelector(".dl-lines").innerHTML = numberLineSVG("A", w.deals.A, w.noun) + numberLineSVG("B", w.deals.B, w.noun);
    if (!dragging) {
      const host = root.querySelector(".dl-graph-wrap");
      host.innerHTML = graphSVG(w.deals, w.noun);
      wireGraph(host);
    }
    renderExplain();
  }

  function renderExplain() {
    const w = W();
    const box = root.querySelector(".dl-explain");
    const goal = `<p class="dl-goal">Goal: explain 3 changes, and make at least one of them switch the best buy. <strong>${w.explained} explained · ${w.flips ? "best buy switched ✓" : "best buy not switched yet"}</strong></p>`;
    if (same(w.deals, w.before)) {
      if (box.dataset.state !== "idle") box.innerHTML = `<h5>What changed and why?</h5><p class="small">Change one thing on a price tag or the graph. A readout of what changed will appear here.</p><div class="feedback"></div>${goal}`;
      box.dataset.state = "idle";
      return;
    }
    const f = w.focus;
    const t = changeTruth(w.before, w.deals, f);
    const b = w.before[f];
    const a = w.deals[f];
    const bestWord = (x) => (x === "tie" ? "a tie (same unit price)" : `Deal ${x}`);
    const readout = `<ul class="dl-readout">
      <li><strong>Deal ${f} before:</strong> ${b.qty} for ${fmtCents(b.cents)}${b.rule !== "none" ? ` (${RULES.find((r) => r.id === b.rule).label})` : ""} → ${fmtExact(unitPrice(b)).text} per ${w.noun.one}</li>
      <li><strong>Deal ${f} now:</strong> ${a.qty} for ${fmtCents(a.cents)}${a.rule !== "none" ? ` (${RULES.find((r) => r.id === a.rule).label})` : ""} → ${fmtExact(unitPrice(a)).text} per ${w.noun.one}</li>
      <li><strong>Best buy:</strong> before ${bestWord(t.bestBefore)}, now ${bestWord(t.bestAfter)}</li></ul>`;
    const keep = box.dataset.state === "ask" && box.dataset.key === JSON.stringify(w.deals);
    if (keep) return;
    box.dataset.state = "ask";
    box.dataset.key = JSON.stringify(w.deals);
    const opt = (pairs) => `<option value="">choose…</option>${pairs.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}`;
    box.innerHTML = `<h5>What changed and why?</h5>${readout}
      <p class="dl-frame">The price for 1 ${w.noun.one} in Deal ${f}
        <select class="dl-pick-dir" aria-label="went up, down or stayed the same">${opt([["up", "went up"], ["down", "went down"], ["same", "stayed the same"]])}</select>
        because <select class="dl-pick-cause" aria-label="what changed">${opt(Object.entries(CAUSES))}</select>.
        The best buy <select class="dl-pick-best" aria-label="did the best buy change">${opt([["same", "stayed the same"], ["changed", "changed"]])}</select>.</p>
      <div class="actions"><button type="button" class="btn primary dl-check-why">Check my explanation</button><button type="button" class="btn secondary dl-undo">Undo my changes</button></div>
      <div class="feedback"></div>${goal}`;
    box.querySelector(".dl-undo").addEventListener("click", () => {
      w.deals = clone(w.before);
      ctx.save();
      refresh();
      announce("Both deals are back to the last explained prices.");
    });
    box.querySelector(".dl-check-why").addEventListener("click", () => {
      const picks = { dir: box.querySelector(".dl-pick-dir").value, cause: box.querySelector(".dl-pick-cause").value, best: box.querySelector(".dl-pick-best").value };
      const fb = box.querySelector(".feedback");
      if (!picks.dir || !picks.cause || !picks.best) return feedback(fb, "hint", "Choose an answer in all three blanks first.");
      const res = checkChange(w.before, w.deals, f, picks);
      if (!res.ok) return feedback(fb, "bad", `Not yet. ${res.issues.map(h).join(" ")}`);
      w.explained += 1;
      if (res.truth.best === "changed") w.flips += 1;
      const why = whyText(picks.cause);
      w.before = clone(w.deals);
      ctx.save();
      box.dataset.state = "";
      renderExplain();
      feedback(
        box.querySelector(".feedback"),
        "good",
        `✓ Yes. The price for 1 ${w.noun.one} in Deal ${f} ${picks.dir === "same" ? "stayed the same" : `went ${picks.dir}`}${why ? `: ${why}` : ""}. ${res.truth.best === "changed" ? "That change switched the best buy." : ""}`,
      );
    });
  }
  refresh();
}
