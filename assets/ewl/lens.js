/* EWL.Lens — the Isomorphic Lens: several pictures of ONE quantity that point at each other.
 *
 *   var lens = EWL.Lens.mount(host, { family: "rational", value: "3/5", reps: ["strip","grid","line"] });
 *   lens.set("6/10")            -> true | false (unreadable or not drawable; the lens keeps its old value)
 *   lens.highlight("1/5~2/5")   -> point at a part in every picture at once (null clears)
 *   lens.onChange(fn)           -> fn({type:"value"|"highlight"|"pin"|"spec", id, source}); returns an unsubscribe
 *   lens.reps()                 -> [{id, label, value}] where value is what that picture READS BACK as an exact Rat
 *   lens.update({whole: "80"})  -> merge spec fields (family-specific); lens.destroy()
 *   EWL.Lens.compare(host, specA, specB) -> two lenses side by side with one shared highlight
 *
 * Families register themselves in EWL.Lens.reg (lens-rational.js, lens-ratio.js, lens-equation.js, lens-scale.js).
 * A family is { normalize(spec) -> {spec, value}, setText(spec, text) -> spec|null, repOrder, reps{}, describe() }.
 * A rep is { label, labelEs, available(m)->reason|null, build(m)->rep, draw(rep, ctx)->Element, controls?(rep, ctx) }.
 * The built rep carries parts[{key,id,label}], read() (the quantity recomputed from the picture's own parts, an exact Rat),
 * alt(lang) (a text alternative that states the quantity), hits(highlightId) -> ids of its parts that mean the same thing.
 *
 * Everything judged here is exact (EWL.Rat). Drawing may use Rat.num(). Files load in any order: nothing here touches
 * the DOM or another module until a function is called.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const Lens = (EWL.Lens = EWL.Lens || {});
  Lens.reg = Lens.reg || {};
  let uidN = 0;
  const WIDE = ["plane", "strip", "line", "percent", "dnl", "tape", "fit", "balance"];
  const tx = (lang, en, es) => (lang === "es" && es ? es : en);
  Lens.tx = tx;

  /* ---- highlight ids for interval families: "a~b" means the stretch of the whole from a to b ---- */
  Lens.pid = (a, b) => a.frac() + "~" + b.frac();
  Lens.parsePid = (id) => {
    const m = /^(.+)~(.+)$/.exec(String(id || ""));
    if (!m) return null;
    const a = EWL.Rat.parse(m[1]);
    const b = EWL.Rat.parse(m[2]);
    return a && b ? { from: a, to: b } : null;
  };
  Lens.overlaps = (p, q) =>
    p.to.cmp(p.from) > 0 && q.to.cmp(q.from) > 0 && p.from.cmp(q.to) < 0 && q.from.cmp(p.to) < 0;

  /** Friendly number text: whole -> "4", terminating -> "0.6", else mixed "1 1/3". money adds "$". */
  Lens.fmt = (r, money) => {
    r = EWL.Rat.of(r);
    if (!money) return r.isInt() ? String(r.n) : r.isTerminating() ? r.decimal(6).text : r.mixed();
    if (!r.isTerminating()) return "$" + r.mixed();
    const t = r.decimal(6).text;
    const places = t.indexOf(".") < 0 ? 0 : t.length - t.indexOf(".") - 1;
    return "$" + (places === 0 ? t + ".00" : places === 1 ? t + "0" : t);
  };

  /** Build the pure model (no DOM): value, rep objects, and the reps that could not be drawn for this value. */
  Lens.model = (spec, lang) => {
    const fam = Lens.reg[spec && spec.family];
    if (!fam) throw new RangeError("Lens: unknown family " + (spec && spec.family));
    const m = fam.normalize(spec);
    m.family = spec.family;
    m.fam = fam;
    m.lang = lang || "en";
    m.reps = [];
    m.unavailable = [];
    const wanted = m.spec.reps && m.spec.reps.length ? m.spec.reps : fam.repOrder;
    wanted.forEach((id) => {
      const def = fam.reps[id];
      if (!def) return m.unavailable.push({ id, reason: "unknown" });
      const why = def.available ? def.available(m) : null;
      if (why) return m.unavailable.push({ id, reason: why });
      const rep = def.build(m);
      rep.id = id;
      rep.def = def;
      rep.label = def.label;
      rep.labelEs = def.labelEs;
      m.reps.push(rep);
    });
    return m;
  };

  /** The highlight ids a rep's parts answer to, as a Set (empty when nothing is highlighted). */
  Lens.hitSet = (rep, id) => new Set(id == null ? [] : rep.hits(id));

  /* ---- drawing helpers shared by the families ---- */
  const U = (Lens.U = {});
  /** An accessible figure: role=group, <title> + <desc> that state the quantity, three pattern fills (never colour alone). */
  U.root = (ctx, w, hgt, title, desc) => {
    const S = EWL.svg;
    const id = (k) => ctx.uid + "-" + k;
    const pat = (k, kids) =>
      S("pattern", { id: id(k), width: 8, height: 8, patternUnits: "userSpaceOnUse" }, kids);
    const defs = S(
      "defs",
      null,
      pat("a", [
        S("rect", { width: 8, height: 8, class: "lens-pa" }),
        S("path", { d: "M-1 9L9 -1M-1 1L1 -1M7 9L9 7", class: "lens-pa-s" }),
      ]),
      pat("b", [
        S("rect", { width: 8, height: 8, class: "lens-pb" }),
        S("circle", { cx: 4, cy: 4, r: 1.5, class: "lens-pb-s" }),
      ]),
      pat("c", [
        S("rect", { width: 8, height: 8, class: "lens-pc" }),
        S("path", { d: "M0 4H8M4 0V8", class: "lens-pc-s" }),
      ]),
    );
    const svg = S(
      "svg",
      {
        viewBox: "0 0 " + w + " " + hgt,
        class: "ewl-fig lens-svg",
        role: "group",
        "aria-label": title + ". " + desc,
        preserveAspectRatio: "xMidYMid meet",
      },
      S("title", null, title),
      S("desc", null, desc),
      defs,
    );
    return {
      svg,
      fill: { a: "url(#" + id("a") + ")", b: "url(#" + id("b") + ")", c: "url(#" + id("c") + ")" },
    };
  };
  U.text = (x, y, s, cls, anchor) =>
    EWL.svg("text", { x, y, class: "lens-t " + (cls || ""), "text-anchor": anchor || "middle" }, s);

  /* ---- mount ---- */
  Lens.mount = (host, spec0, opts) => {
    opts = opts || {};
    const h = EWL.h;
    const uid = "lens" + ++uidN;
    let lang = opts.lang || (EWL.lang ? EWL.lang() : "en");
    let spec = spec0;
    let model = Lens.model(spec, lang);
    let parts = [];
    let hover = null;
    let pinned = null;
    let ext = null;
    let subs = [];
    let alive = true;
    const root = h("div", { class: "lens", "data-family": spec.family });
    host.appendChild(root);
    let capEl = null;

    const shown = () => (hover != null ? hover : pinned != null ? pinned : ext);
    const emit = (e) => subs.slice().forEach((fn) => fn(e));

    function paint() {
      const id = shown();
      model.reps.forEach((rep) => {
        const hit = Lens.hitSet(rep, id);
        parts.forEach((p) => {
          if (p.rep !== rep.id) return;
          const on = hit.has(p.id);
          p.marks.forEach((el) =>
            on ? el.setAttribute("data-hl", "1") : el.removeAttribute("data-hl"),
          );
          p.el.setAttribute("aria-pressed", pinned != null && p.id === pinned ? "true" : "false");
        });
        if (rep.update) rep.update(id, hit);
      });
      if (capEl) {
        const d = id == null ? "" : model.fam.describe(model, id, lang);
        capEl.textContent =
          d ||
          tx(
            lang,
            "Point at or tab to a part. The same amount lights up in every picture.",
            "Señala una parte o usa el tabulador. La misma cantidad se ilumina en cada dibujo.",
          );
        capEl.setAttribute("data-on", d ? "1" : "0");
      }
    }
    function setTransient(id, el) {
      hover = id;
      paint();
      if (id != null) emit({ type: "highlight", id, source: "ui", el });
      else emit({ type: "highlight", id: shown(), source: "ui" });
    }
    function togglePin(p) {
      pinned = pinned === p.id ? null : p.id;
      paint();
      emit({ type: "pin", id: pinned, source: "ui" });
      if (pinned != null && EWL.announce) EWL.announce(model.fam.describe(model, pinned, lang));
    }
    function move(p, key) {
      const mine = parts.filter((q) => q.rep === p.rep);
      const rep = model.reps.filter((r) => r.id === p.rep)[0];
      const cols = rep && rep.cols ? rep.cols : 1;
      let i = mine.indexOf(p);
      if (key === "ArrowRight") i += 1;
      else if (key === "ArrowLeft") i -= 1;
      else if (key === "ArrowDown") i += cols;
      else if (key === "ArrowUp") i -= cols;
      else if (key === "Home") i = 0;
      else if (key === "End") i = mine.length - 1;
      i = Math.max(0, Math.min(mine.length - 1, i));
      mine.forEach((q) => q.el.setAttribute("tabindex", "-1"));
      mine[i].el.setAttribute("tabindex", "0");
      mine[i].el.focus();
    }

    function makeCtx(rep) {
      return {
        uid: uid + "-" + rep.id,
        lang,
        model,
        spec,
        t: (en, es) => tx(lang, en, es),
        pinned: () => pinned,
        shown,
        pin: (id) => {
          pinned = id;
          paint();
          emit({ type: "pin", id, source: "ui" });
        },
        update: (patch) => api.update(patch),
        /** Register one interactive part. cfg: {el, marks?, id, key, label} */
        part: (cfg) => {
          const p = {
            rep: rep.id,
            id: cfg.id,
            el: cfg.el,
            marks: cfg.marks || [cfg.el],
            key: cfg.key,
          };
          const first = !parts.some((q) => q.rep === rep.id);
          cfg.el.setAttribute("role", "button");
          cfg.el.setAttribute("tabindex", first ? "0" : "-1");
          cfg.el.setAttribute("aria-label", cfg.label);
          cfg.el.setAttribute("aria-pressed", "false");
          cfg.el.classList.add("lens-part");
          cfg.el.addEventListener(
            "pointerenter",
            (e) => e.pointerType !== "touch" && setTransient(p.id, cfg.el),
          );
          cfg.el.addEventListener(
            "pointerleave",
            (e) => e.pointerType !== "touch" && hover === p.id && setTransient(null),
          );
          cfg.el.addEventListener("focus", () => {
            cfg.el.setAttribute("data-focus", "1");
            parts
              .filter((q) => q.rep === rep.id)
              .forEach((q) => q.el.setAttribute("tabindex", q === p ? "0" : "-1"));
            setTransient(p.id, cfg.el);
          });
          cfg.el.addEventListener("blur", () => {
            cfg.el.removeAttribute("data-focus");
            if (hover === p.id) setTransient(null);
          });
          cfg.el.addEventListener("click", () => togglePin(p));
          cfg.el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              togglePin(p);
            } else if (e.key === "Escape") {
              pinned = null;
              paint();
              emit({ type: "pin", id: null, source: "ui" });
            } else if (
              ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].indexOf(e.key) >= 0
            ) {
              e.preventDefault();
              move(p, e.key);
            }
          });
          parts.push(p);
          return cfg.el;
        },
      };
    }

    function render() {
      const active = root.contains(document.activeElement)
        ? document.activeElement.getAttribute("data-ctl")
        : null;
      EWL.clear(root);
      parts = [];
      hover = null;
      const grid = h("div", { class: "lens-grid", "data-count": String(model.reps.length) });
      model.reps.forEach((rep) => {
        const ctx = makeCtx(rep);
        const body = rep.def.draw(rep, ctx);
        const ctl = rep.def.controls ? rep.def.controls(rep, ctx) : null;
        grid.appendChild(
          h(
            "figure",
            {
              class: "lens-rep",
              "data-rep": rep.id,
              "data-wide": WIDE.indexOf(rep.id) >= 0 ? "1" : "0",
            },
            h("figcaption", { class: "lens-name" }, tx(lang, rep.label, rep.labelEs)),
            body,
            ctl,
          ),
        );
      });
      capEl = h("p", { class: "lens-caption", "aria-live": "off" });
      root.appendChild(grid);
      root.appendChild(capEl);
      paint();
      if (active) {
        const el = root.querySelector('[data-ctl="' + active + '"]');
        if (el) el.focus();
      }
    }

    function rebuild(next, type) {
      let m;
      try {
        m = Lens.model(next, lang);
      } catch (e) {
        return false;
      }
      spec = next;
      model = m;
      render();
      emit({ type, id: shown(), source: "api" });
      return true;
    }

    const api = {
      set(text) {
        const next = model.fam.setText ? model.fam.setText(spec, text) : null;
        return next ? rebuild(next, "value") : false;
      },
      update(patch) {
        return rebuild(Object.assign({}, spec, patch), "spec");
      },
      highlight(id) {
        ext = id == null ? null : id;
        pinned = null;
        paint();
        emit({ type: "highlight", id: shown(), source: "ext" });
      },
      onChange(fn) {
        subs.push(fn);
        return () => {
          subs = subs.filter((f) => f !== fn);
        };
      },
      reps() {
        return model.reps.map((r) => {
          const v = r.read();
          return {
            id: r.id,
            label: tx(lang, r.label, r.labelEs),
            value: v ? v.frac() : null,
            alt: r.alt(lang),
          };
        });
      },
      value: () => model.value,
      spec: () => Object.assign({}, spec),
      model: () => model,
      shown,
      setLang(l) {
        lang = l === "es" ? "es" : "en";
        render();
      },
      destroy() {
        if (!alive) return;
        alive = false;
        subs = [];
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
    render();
    return api;
  };

  /** Two lenses side by side. Pointing at a part in either lights the matching part in both. */
  Lens.compare = (host, specA, specB, opts) => {
    const wrap = EWL.h("div", { class: "lens-compare" });
    host.appendChild(wrap);
    const colA = EWL.h("div", { class: "lens-side" });
    const colB = EWL.h("div", { class: "lens-side" });
    wrap.appendChild(colA);
    wrap.appendChild(colB);
    const a = Lens.mount(colA, specA, opts);
    const b = Lens.mount(colB, specB, opts);
    a.onChange(
      (e) => (e.type === "highlight" || e.type === "pin") && e.source === "ui" && b.highlight(e.id),
    );
    b.onChange(
      (e) => (e.type === "highlight" || e.type === "pin") && e.source === "ui" && a.highlight(e.id),
    );
    return {
      a,
      b,
      highlight: (id) => {
        a.highlight(id);
        b.highlight(id);
      },
      destroy: () => {
        a.destroy();
        b.destroy();
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      },
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
