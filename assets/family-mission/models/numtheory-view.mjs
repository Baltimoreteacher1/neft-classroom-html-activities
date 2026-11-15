// Drawing and wiring for the "numtheory" family (gcf, lcm and factor-tree modes). The model owns
// every rule; this file turns taps into patches and draws what the model says. A refused tap is
// shown as a short "try another look" message, never as a score.
import { announce, button, createView, field, h, put, t } from "./core.mjs";
import { MAX_STEPS, toInt } from "./numtheory-math.mjs";
import { claimMessage, hint, lcmMatch, resultLines, say, STR, tryLines } from "./numtheory-text.mjs";

let uid = 0;

function chips(values, tagged, tag, none) {
  if (!values.length) return h("span", { class: "fm-nt-empty" }, none);
  return h(
    "ul",
    { class: "fm-nt-chips" },
    values.map((v) =>
      h("li", { class: `fm-nt-chip${tagged.includes(v) ? " is-tagged" : ""}` }, h("span", { class: "fm-nt-val" }, v), tagged.includes(v) ? h("span", { class: "fm-nt-tag" }, tag) : null),
    ),
  );
}

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const inputId = `fm-nt-k-${(uid += 1)}`;
  const mode = model.getState().mode;
  let bag;
  let ui = {};
  let L = lang;

  const flash = (text) => {
    ui.msg.textContent = text;
    announce(root, text);
  };

  // ── GCF: pick a pack count, see whether it splits both numbers ──
  function buildGcf() {
    ui.tries = h("div", { class: "fm-nt-tries", role: "group" });
    ui.lists = h("div", { class: "fm-nt-lists" });
    ui.missed = h("p", { class: "fm-nt-missed" });
    if (readonly) return [ui.tries, ui.lists, ui.missed];
    const stepTo = (delta) => model.setState({ k: model.getState().k + delta });
    ui.kf = field(bag, {
      id: inputId,
      label: t(L, STR.how),
      onCommit: (value) => {
        const ok = model.setState({ k: toInt(value) });
        ui.kf.invalid(!ok);
        if (!ok) flash(STR.range(L, model.getState().max));
      },
    });
    const withK = (act) => () => {
      const k = toInt(ui.kf.input.value);
      const d = model.getState();
      if (!(k >= 1 && k <= d.max)) {
        ui.kf.invalid(true);
        return flash(STR.range(L, d.max));
      }
      ui.kf.invalid(false);
      act(k, d);
    };
    ui.less = button(bag, "−", { cls: "fm-step", ariaLabel: t(L, STR.fewer), onClick: () => stepTo(-1) });
    ui.more = button(bag, "+", { cls: "fm-step", ariaLabel: t(L, STR.more), onClick: () => stepTo(1) });
    ui.try = button(bag, "", { cls: "fm-nt-try", onClick: withK((k) => model.setState({ try: k })) });
    ui.claim = button(bag, t(L, STR.claim), {
      cls: "fm-nt-claim",
      onClick: withK((k, d) => {
        if (!model.setState({ claim: k })) flash(claimMessage(d, k, L));
      }),
    });
    return [h("div", { class: "fm-nt-stepper" }, ui.less, ui.kf.el, ui.more), h("div", { class: "fm-row" }, ui.try, ui.claim), ui.tries, ui.lists, ui.missed];
  }

  function syncGcf(d) {
    const lines = tryLines(d, L);
    ui.tries.replaceChildren(...lines.map((line, i) => h("p", { class: `fm-nt-line${i === 2 ? (d.last.both ? " is-yes" : " is-no") : ""}` }, line)));
    const list = (x, fac) => h("div", { class: "fm-nt-list" }, h("h4", { class: "fm-nt-h" }, STR.factorsOf(L, x)), chips(fac, d.common, t(L, STR.common), t(L, STR.none)));
    ui.lists.replaceChildren(list(d.a, d.facA), list(d.b, d.facB));
    ui.missed.textContent = d.missed.length ? STR.missed(L, d.missed) : "";
    ui.missed.hidden = !d.missed.length;
    if (readonly) return;
    ui.kf.set(d.k);
    ui.kf.invalid(false);
    ui.try.textContent = STR.tryFor(L, d.k);
    for (const b of [ui.less, ui.more, ui.try, ui.claim]) b.disabled = d.finished;
    ui.less.disabled ||= d.k <= 1;
    ui.more.disabled ||= d.k >= d.max;
  }

  // ── LCM: two skip-count tracks ──
  function buildLcm() {
    ui.tracks = {};
    const track = (key) => {
      ui.tracks[key] = { head: h("h4", { class: "fm-nt-h" }), chips: h("div", { class: "fm-nt-track" }) };
      if (!readonly) ui.tracks[key].btn = button(bag, "", { cls: "fm-nt-next", onClick: () => model.setState({ extend: key }) });
      return h("div", { class: "fm-nt-trackbox" }, ui.tracks[key].head, ui.tracks[key].chips, ui.tracks[key].btn);
    };
    const kids = [track("a"), track("b")];
    if (!readonly) {
      ui.count = button(bag, t(L, STR.count), { cls: "fm-nt-count", onClick: () => model.setState({ count: true }) });
      kids.push(ui.count);
    }
    return kids;
  }

  function syncLcm(d) {
    const none = t(L, STR.none);
    for (const [key, vals, n] of [["a", d.listA, d.na], ["b", d.listB, d.nb]]) {
      const tr = ui.tracks[key];
      tr.head.textContent = STR.trackName(L, d, key);
      tr.chips.replaceChildren(chips(vals, d.both, t(L, STR.both), none));
      if (tr.btn) {
        tr.btn.textContent = STR.nextOf(L, d, key);
        tr.btn.setAttribute("aria-label", STR.nextAria(L, d, key));
        tr.btn.disabled = d.counted || n >= MAX_STEPS;
      }
    }
    if (ui.count) ui.count.hidden = d.match === null || d.counted;
  }

  // ── Tree: tap a composite number, choose a real factor pair ──
  function buildTree() {
    ui.tree = h("div", { class: "fm-nt-tree", role: "group" });
    ui.pairs = h("div", { class: "fm-nt-pairs", role: "group", hidden: "" });
    if (!readonly) {
      bag.on(ui.tree, "click", (e) => {
        const b = e.target.closest?.("[data-node]");
        if (!b) return;
        const d = model.getState();
        const node = Number(b.dataset.node);
        model.setState({ sel: d.sel === node ? null : node });
      });
      bag.on(ui.pairs, "click", (e) => {
        const b = e.target.closest?.("[data-p]");
        const d = model.getState();
        if (b && d.sel !== null) model.setState({ split: { node: d.sel, p: Number(b.dataset.p) } });
      });
      ui.again = button(bag, t(L, STR.again), { cls: "fm-nt-again", onClick: () => model.setState({ restart: true }) });
    }
    return [ui.tree, ui.pairs];
  }

  function treeNode(d, i) {
    const nd = d.nodes[i];
    const val = h("span", { class: "fm-nt-val" }, nd.v);
    let box;
    if (nd.prime) box = h("span", { class: "fm-nt-node is-prime" }, val, h("span", { class: "fm-nt-tag" }, t(L, STR.prime)));
    else if (nd.kids === null && !readonly) {
      box = h(
        "button",
        { type: "button", class: "fm-btn fm-nt-node is-pick", "aria-pressed": String(d.sel === i), "aria-label": STR.splitAria(L, nd.v), "data-node": String(i) },
        val,
        h("span", { class: "fm-nt-tag" }, t(L, STR.split)),
      );
    } else box = h("span", { class: "fm-nt-node" }, val);
    const kids = nd.kids ? h("ul", { class: "fm-nt-kids" }, nd.kids.map((k) => treeNode(d, k))) : null;
    return h("li", { class: "fm-nt-item" }, box, kids);
  }

  function syncTree(d) {
    const sel = ui.tree.contains(globalThis.document.activeElement) || ui.pairs.contains(globalThis.document.activeElement);
    ui.tree.setAttribute("aria-label", t(L, { en: `Factor tree for ${d.n}`, es: `Árbol de factores de ${d.n}` }));
    ui.tree.replaceChildren(h("ul", { class: "fm-nt-kids is-root" }, treeNode(d, 0)));
    ui.pairs.hidden = readonly || d.sel === null;
    ui.pairs.replaceChildren();
    if (d.sel !== null) {
      ui.pairs.setAttribute("aria-label", STR.pairFor(L, d.nodes[d.sel].v));
      ui.pairs.replaceChildren(h("p", { class: "fm-nt-h" }, STR.pairFor(L, d.nodes[d.sel].v)), ...d.pairs.map(([p, q]) => h("button", { type: "button", class: "fm-btn fm-nt-pair", "data-p": String(p) }, `${p} × ${q}`)));
    }
    if (ui.again) ui.again.hidden = d.nodes.length < 2;
    if (sel) (ui.pairs.querySelector("button") || ui.tree.querySelector(".is-pick") || ui.undo)?.focus({ preventScroll: true });
  }

  // ── Shared frame ──
  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = {};
    root.dataset.ntMode = mode;
    const d0 = model.getState();
    ui.picks = d0.presets.length > 1 && !readonly ? h("div", { class: "fm-nt-picks", role: "group", "aria-label": t(L, STR.problem) }) : null;
    const body = mode === "gcf" ? buildGcf() : mode === "lcm" ? buildLcm() : buildTree();
    ui.hint = h("p", { class: "fm-explain fm-nt-hint", role: "status" });
    ui.msg = h("p", { class: "fm-msg", role: "status" });
    ui.result = h("div", { class: "fm-nt-result", hidden: "" });
    ui.desc = h("p", { class: "fm-sr" });
    if (ui.picks) {
      bag.on(ui.picks, "click", (e) => {
        const b = e.target.closest?.("[data-pick]");
        const p = b && model.getState().presets[Number(b.dataset.pick)];
        if (p) model.setState(p);
      });
    }
    put(root, ui.picks, ...body, ui.hint, ui.msg, ui.result, ui.desc);
    if (!readonly) {
      ui.undo = button(bag, t(L, STR.undo), { onClick: () => model.undo() });
      ui.reset = button(bag, t(L, STR.reset), { onClick: () => model.reset() });
      put(root, h("div", { class: "fm-actions" }, ui.undo, ui.reset, ui.again));
    }
  }

  function sync() {
    const d = model.getState();
    ui.msg.textContent = "";
    if (mode === "gcf") syncGcf(d);
    else if (mode === "lcm") syncLcm(d);
    else syncTree(d);
    ui.hint.textContent = hint(d, L);
    const lines = d.finished ? resultLines(d, L) : mode === "lcm" && d.match !== null ? [lcmMatch(d, L)] : [];
    ui.result.hidden = !lines.length;
    ui.result.replaceChildren(...lines.map((line, i) => h("p", { class: i === 0 ? "fm-nt-eq" : null }, line)));
    if (ui.picks) {
      ui.picks.replaceChildren(
        ...d.presets.map((p, i) => {
          const on = mode === "tree" ? p.n === d.n : p.a === d.a && p.b === d.b;
          const text = mode === "tree" ? String(p.n) : t(L, { en: `${p.a} and ${p.b}`, es: `${p.a} y ${p.b}` });
          return h("button", { type: "button", class: "fm-btn", "aria-pressed": String(on), "data-pick": String(i) }, text);
        }),
      );
    }
    if (ui.undo) ui.undo.disabled = !model.canUndo();
    ui.desc.textContent = model.getAccessibleDescription(L);
  }

  return createView(root, model, { lang, onChange, cls: "fm-nt", build, sync, say });
}
