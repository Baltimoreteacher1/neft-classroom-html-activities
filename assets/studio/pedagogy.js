/**
 * Practice Studio pedagogy layer (window.StudioPedagogy). Contract: docs/audits/studio-v4/brief-x-pedagogy.md.
 *
 * Pure helpers (tools/studio-pedagogy.test.mjs drives them in node:vm) and the small DOM features that use them:
 *
 *   estimate chips   "Bigger, smaller or about the same as ___?" before a numeric answer. The chips are derived from the item's own
 *                    computed answer; a wrong chip says only "check again: how did the amount change?"; nothing is blocked.
 *   hypercorrection  a miss made while the student tapped "Certain" is remembered (state.hyper); the exit card shows the trap's
 *                    other way to see it. boost-core.js / boost.js book the skill into tomorrow's Daily Boost.
 *   why chip         after a clean Boss answer: "Why does that work?" with 3 chips, one true reason and two from the item's own trap
 *                    fixes. No typing. The pick is saved in state.why (the pulse code reads it).
 *   same numbers     ?seed=<token> makes every generated problem draw its seed from the token and its slot id. No param, no change.
 *   look-back        an optional warm-up that matches problems from an earlier day to their skills (boost-core plan, n = 1).
 *   written evidence word counts and "which of my words shows it?" chips for the wr kind (kinds-basic.js calls these).
 *   check path       ?path=check chunks worked examples into one step at a time (worked.js reads W.StudioPedagogy.checkPath).
 *
 * Nothing here is timed, nothing prints an answer after a miss, and nothing leaves the device.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioPedagogy) return;
  const RT = (W.StudioRT = W.StudioRT || {});
  const search = typeof location === "undefined" ? "" : location.search || "";
  const G = () => W.StudioGen;

  const hash = (/** @type {string} */ s) => {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
    return h;
  };

  /* ---- same numbers for the class: ?seed=<token> ---------------------------------------------------------------- */
  const SEED_RE = /[?&]seed=([A-Za-z0-9_-]{1,12})(?:&|$)/;
  /** @param {string} s a location.search string @returns {string} the token, or "" */
  const parseSeed = (s) => (SEED_RE.exec(s || "") || [])[1] || "";
  const seedToken = parseSeed(search);
  /** A class link saves apart from a student's own progress: the numbers differ, so the solved marks would not match. */
  const storageSuffix = seedToken ? `_s${seedToken}` : "";
  const checkPath = /[?&]path=check(?:&|$)/.test(search);

  /* ---- estimate chips -------------------------------------------------------------------------------------------- */
  const CHIPS = [
    { id: "bigger", en: "Bigger", es: "Mayor" },
    { id: "smaller", en: "Smaller", es: "Menor" },
    { id: "same", en: "About the same", es: "Casi igual" },
  ];
  /** bigger / smaller / same, with 5% of the benchmark's size as "about the same". */
  const relation = (/** @type {number} */ ans, /** @type {number} */ bench) => {
    const tol = 0.05 * Math.abs(bench);
    return ans - bench > tol ? "bigger" : bench - ans > tol ? "smaller" : "same";
  };
  const FIRST = { en: "the first number in the problem", es: "el primer número del problema" };
  const GIVEN = { en: "the length you are given", es: "la medida que te dan" };
  const fracA = (/** @type {any} */ m, /** @type {any} */ _a, /** @type {any} */ g) => ({
    v: m.A[0] / m.A[1],
    t: g.mixed(m.A[0], m.A[1]),
    ...FIRST,
  });
  const decA = (/** @type {any} */ m, /** @type {any} */ _a, /** @type {any} */ g) => ({
    v: m.A / 10 ** m.dpa,
    t: g.fmt(m.A / 10 ** m.dpa),
    ...FIRST,
  });
  /**
   * The benchmark a numeric generated item is compared with, by generator id and meta kind. Each entry returns the number to
   * compare (v), how to print it (t) and what it is (en, es). Only kinds whose answer genuinely sits above, below or near a number
   * in the problem are listed; a kind not listed gets no chips.
   */
  const BENCH = {
    wholeDivFrac: { calc: fracA },
    mixedDivide: { calc: fracA },
    fracDivWord: { calc: fracA, full: fracA },
    decimalAddSub: { calc: decA },
    decimalMultiply: { prod: decA },
    unitRate: {
      basic: (/** @type {any} */ m, /** @type {number} */ a, /** @type {any} */ g) => ({
        v: a * m.n,
        t: g.fmt(a * m.n),
        en: "the total amount",
        es: "la cantidad total",
      }),
    },
    areaParallelogram: {
      miss: (/** @type {any} */ m) => ({ v: m.known, t: String(m.known), ...GIVEN }),
      rhomMiss: (/** @type {any} */ m) => ({ v: m.known, t: String(m.known), ...GIVEN }),
    },
    volumePrismWhole: {
      miss: (/** @type {any} */ m) => ({
        v: m.known[0],
        t: String(m.known[0]),
        en: "the first length you are given",
        es: "la primera medida que te dan",
      }),
    },
    absoluteValue: {
      ctxDist: (/** @type {any} */ m) => ({
        v: m.n,
        t: String(m.n).replace("-", "−"),
        en: "the number shown in the problem",
        es: "el número que aparece en el problema",
      }),
    },
  };
  /** @returns {{v: number, t: string, en: string, es: string, rel: string} | null} */
  function estimateOf(/** @type {any} */ it, /** @type {any} */ layer) {
    if (!it || it.k !== "num") return null;
    const ans = G().value(it.a);
    if (!Number.isFinite(ans)) return null;
    // an authored override: { v, benchmark, benchmarkEs } by item id, from pedagogy-layer.json
    const o = layer?.[it.id];
    if (o && Number.isFinite(o.v))
      return {
        v: o.v,
        t: String(o.t ?? o.v),
        en: String(o.benchmark || ""),
        es: String(o.benchmarkEs || ""),
        rel: relation(ans, o.v),
      };
    if (!it.gen || !it.meta) return null;
    const f = /** @type {any} */ (BENCH)[it.gen.id]?.[it.meta.kind || it.meta.t];
    const b = f?.(it.meta, ans, G());
    if (!b || !Number.isFinite(b.v)) return null;
    return { ...b, rel: relation(ans, b.v) };
  }

  /* ---- written task evidence ------------------------------------------------------------------------------------ */
  const wordsOf = (/** @type {any} */ text) =>
    String(text ?? "")
      .split(/\s+/)
      .filter((w) => /[\p{L}\p{N}]/u.test(w));
  const wordCount = (/** @type {any} */ text) => wordsOf(text).length;
  /** The shortest answer in words. An item may name it (minWords); else about one word per six characters of the old minimum. */
  const minWords = (/** @type {any} */ it, /** @type {boolean} */ scaffold) => {
    const n = Number.isInteger(it.minWords) ? it.minWords : Math.round((it.min || 40) / 6);
    const base = Math.min(25, Math.max(8, n));
    return scaffold ? Math.max(5, Math.round(base * 0.6)) : base;
  };
  const STOP = new Set(
    `the and for are was were with that this from have has had you your but not can will then than they them its our out all one two how why what when where which who into onto over under about because also just only very more most some any each both did does too use used using
los las del una uno unos unas por con que para como pero son esta este estos estas más mas muy sus nos hay fue ser son está están entre sobre cada solo sólo todo todos`.split(
      /\s+/,
    ),
  );
  /** Up to `max` of the student's OWN words (never invented ones) to choose from: key words first, then numbers, then the rest. */
  function evidenceWords(/** @type {any} */ text, /** @type {string[]} */ kw = [], max = 8) {
    const seen = new Set();
    const all = [];
    for (const raw of wordsOf(text)) {
      const w = raw.replace(/^[^\p{L}\p{N}−-]+|[^\p{L}\p{N}%]+$/gu, "");
      const key = w.toLowerCase();
      if (!w || seen.has(key)) continue;
      const num = /\d/.test(w);
      if (!num && (w.length < 3 || STOP.has(key))) continue;
      seen.add(key);
      all.push({ w, num, kw: kw.some((k) => k && key.includes(String(k).toLowerCase())) });
    }
    const rank = (/** @type {any} */ x) => (x.kw ? 0 : x.num ? 1 : 2);
    return all
      .map((x, i) => ({ ...x, i }))
      .sort((a, b) => rank(a) - rank(b) || a.i - b.i)
      .slice(0, max)
      .sort((a, b) => a.i - b.i)
      .map((x) => x.w);
  }

  /* ---- why chip: one true reason, two from the item's own trap fixes ---------------------------------------------- */
  const firstSentence = (/** @type {any} */ s, max = 150) => {
    const t = String(s ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const m = /^(.+?[.!?])(\s|$)/.exec(t);
    const one = (m ? m[1] : t).trim();
    return one.length > max ? "" : one;
  };
  /**
   * @param {any} it a solved item  @param {Record<string, any>} names trap id -> { n, nEs, fix, fixEs }
   * @returns {{ id: string, en: string, es: string, ok: boolean }[] | null} three chips in a fixed order, or null to skip silently
   */
  function whyChips(it, names) {
    const reason = firstSentence(it.x);
    if (reason.length < 12) return null;
    const tags = [
      ...new Set(
        [
          ...(Array.isArray(it.tag) ? it.tag : []),
          ...(it.fw || []).map((/** @type {any} */ w) => w?.tag),
        ].filter((/** @type {any} */ t) => t && names[t]?.fix),
      ),
    ].sort((a, b) => hash(it.id + a) - hash(it.id + b));
    const wrong = [];
    for (const t of tags) {
      const en = firstSentence(names[t].fix);
      if (
        en.length >= 8 &&
        en.toLowerCase() !== reason.toLowerCase() &&
        !wrong.some((w) => w.en === en)
      )
        wrong.push({ id: t, en, es: firstSentence(names[t].fixEs) || "", ok: false });
      if (wrong.length === 2) break;
    }
    if (wrong.length < 2) return null;
    // the true reason may not be the clear longest chip: a student could pick it by length alone
    if (reason.length > 1.35 * Math.max(...wrong.map((w) => w.en.length))) return null;
    const chips = [{ id: "true", en: reason, es: firstSentence(it.xEs) || "", ok: true }, ...wrong];
    return chips.sort((a, b) => hash(it.id + a.id) - hash(it.id + b.id));
  }

  /* ---- look-back warm-up ---------------------------------------------------------------------------------------- */
  const PICTURE =
    /\b(the (picture|diagram|graph|figure|image|table|plot|number line)|shown (above|below)|see (above|below))\b/i;
  const CHOICE_STEM =
    /\b(which (choice|statement|list|range|expression|equation|of|one|is|number|value)|choices?|below|above|best describes)\b/i;
  /**
   * A stand-alone stem for a skill, or null: the question text alone names its numbers and never points at a figure (the figure, if the
   * generator draws one, is left out).
   */
  function stemFor(
    /** @type {string} */ g,
    /** @type {number} */ level,
    /** @type {number} */ base,
  ) {
    for (let k = 0; k < 14; k++) {
      let it;
      try {
        it = G().make(g, level, base + k * 17);
      } catch (_e) {
        return null;
      }
      // a stand-alone stem: typed-answer, or multiple choice whose question does not lean on its choices
      const alone = it.k === "num" || (it.k === "mc" && !CHOICE_STEM.test(it.q));
      if (alone && /\d/.test(it.q) && it.q.length <= 170 && !PICTURE.test(it.q))
        return { q: it.q, qEs: it.qEs || "" };
    }
    return null;
  }
  /**
   * One discrimination from an earlier day. `store` is the Daily Boost memory (ewl_boost_v1): the target is a skill that is due
   * today (so it was last answered on an earlier day), and the others are skills the student has met in other lessons.
   * @returns {{ pairs: {g: string, lesson: string, title: string, titleEs: string, q: string, qEs: string}[] } | null}
   */
  function lookbackPlan(store, today, curLesson, rand, core = W.StudioBoostCore) {
    const skills = store?.skills || {};
    const catalog = Object.keys(skills)
      .filter((g) => G().registry[g] && skills[g].lesson && skills[g].lesson !== curLesson)
      .map((g) => ({
        g,
        lesson: skills[g].lesson,
        title: G().registry[g].title,
        unit: Number(String(skills[g].lesson).split("-")[0]) || 0,
      }));
    if (catalog.length < 2 || !core) return null;
    const due = catalog.filter((c) => skills[c.g].due <= today);
    if (!due.length) return null;
    const target = core.plan(store, due, today, rand, 1, [])[0];
    if (!target) return null;
    const unit = catalog.find((c) => c.g === target.g)?.unit;
    const others = catalog
      .filter((c) => c.g !== target.g)
      .map((c) => [(c.unit === unit ? 0 : 1) + rand() * 0.5, c])
      .sort((a, b) => /** @type {number} */ (a[0]) - /** @type {number} */ (b[0]))
      .map((x) => /** @type {any} */ (x[1]));
    const pairs = [];
    for (const c of [catalog.find((x) => x.g === target.g), ...others]) {
      if (!c) continue;
      const s = stemFor(
        c.g,
        core.levelFor(skills[c.g].box || 0),
        7000 + (hash(`${today}|${c.g}`) % 5000),
      );
      if (!s) continue;
      pairs.push({
        g: c.g,
        lesson: c.lesson,
        title: G().registry[c.g].title,
        titleEs: G().registry[c.g].titleEs || "",
        ...s,
      });
      if (pairs.length === 3) break;
    }
    return pairs.length >= 2 && pairs[0].g === target.g ? { pairs } : null;
  }

  /* ---- DOM features (the runtime calls init) ---------------------------------------------------------------------- */
  /** @type {any} */
  let rt = null;
  /** @type {any} */
  let layer = {};
  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));
  const U = () => RT.util;
  const st = () => rt.api.state;
  const today = () =>
    W.StudioBoostCore ? W.StudioBoostCore.ymd(new Date()) : new Date().toLocaleDateString("en-CA");

  /** Inject a stylesheet once (these features ship as scripts only, so a page needs no new link). */
  function css(/** @type {string} */ name, /** @type {string} */ text) {
    if (typeof document === "undefined" || document.querySelector(`style[data-ped="${name}"]`))
      return;
    const s = document.createElement("style");
    s.setAttribute("data-ped", name);
    s.textContent = text;
    document.head.append(s);
  }
  const STYLE = `
.ped-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.5rem 0}
.ped-row .ped-q{flex:1 1 100%;font-weight:600}
.ped-row .btn[aria-pressed="true"]{outline:3px solid var(--brand,#1b2c3f);outline-offset:2px}
.ped-note{margin:.25rem 0;font-size:.95rem}
.ped-card{border:2px solid var(--brand,#1b2c3f);border-radius:12px;padding:.75rem 1rem;margin:.75rem 0;background:var(--card,transparent)}
.ped-card h3{margin:.1rem 0 .4rem;font-size:1.05rem}
.ped-why .btn{text-align:left;white-space:normal;height:auto;min-height:44px}
@media (forced-colors:active){.ped-card{border-color:CanvasText}.ped-row .btn[aria-pressed="true"]{outline-color:Highlight}}
`;

  function say(/** @type {string} */ msg) {
    rt?.api?.say?.(msg);
  }

  /* -- estimate chips -- */
  function estimateRow(/** @type {any} */ it, /** @type {HTMLElement} */ host) {
    const me = layer.lessons?.[rt.api.data.lesson]?.estimate;
    if (!me) return;
    const est = estimateOf(it, typeof me === "object" ? me.items : null);
    const zone = $(".answer-zone", host);
    if (!est || !zone || $(".est-row", host)) return;
    const key = `${it.id}@${it.seed ?? 0}`;
    const s = st();
    const row = document.createElement("div");
    row.className = "ped-row est-row";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Estimate first (optional)");
    const t = U().tx(est.t);
    row.innerHTML = `<span class="ped-q">Before you solve: will your answer be bigger, smaller or about the same as ${t}? <span class="conf-opt">(optional)</span><span class="es-text" lang="es">${U().esc("Antes de resolver: ¿tu respuesta será mayor, menor o casi igual que")} ${t}? ${U().esc("(opcional)")}</span></span>${CHIPS.map(
      (c) =>
        `<button type="button" class="btn btn-sm conf-btn" data-est="${c.id}" aria-pressed="false">${c.en}${U().es(c.es)}</button>`,
    ).join("")}<span class="ped-note" data-est-note role="status"></span>`;
    zone.before(row);
    const note = $("[data-est-note]", row);
    const show = (/** @type {any} */ rec) => {
      for (const b of row.querySelectorAll("[data-est]"))
        b.setAttribute("aria-pressed", String(b.dataset.est === rec.pick));
      note.innerHTML = rec.ok
        ? `Yes. Keep that in mind while you solve.${U().es("Sí. Ten esa idea en mente mientras resuelves.")}`
        : `Check again: how did the amount change?${U().es("Revisa otra vez: ¿cómo cambió la cantidad?")}`;
    };
    if (s.est[key]) show(s.est[key]);
    row.addEventListener("click", (e) => {
      const b = /** @type {HTMLElement|null} */ (
        /** @type {HTMLElement} */ (e.target).closest("[data-est]")
      );
      if (!b) return;
      const rec = {
        pick: b.dataset.est,
        ok: b.dataset.est === est.rel,
        n: (s.est[key]?.n || 0) + 1,
      };
      s.est[key] = rec;
      rt.api.save();
      show(rec);
      say(rec.ok ? "Yes" : "Check again");
      W.StudioBus.emit("estimate", {
        lesson: rt.api.data.lesson,
        itemId: it.id,
        ok: rec.ok,
        n: rec.n,
      });
    });
  }

  /* -- hypercorrection: a certain miss -- */
  function noteHyper(/** @type {any} */ e) {
    if (e.ok || e.conf !== 3 || e.redeem) return;
    const s = st();
    s.hyper ||= [];
    const rec = s.hyper.find((/** @type {any} */ h) => h.id === e.itemId);
    if (rec) {
      rec.n += 1;
      rec.tag = e.tag || rec.tag;
    } else s.hyper.push({ id: e.itemId, tag: e.tag || null, gen: e.gen || null, n: 1 });
    s.hyper = s.hyper.slice(-6);
    rt.api.save();
  }
  /** The exit card's extra: for each trap the student was sure about, the trap's name and its other way to see it. */
  function exitExtras() {
    const s = st();
    const names = { ...(G()?.traps?.names || {}), ...(rt.api.data.traps || {}) };
    const seen = new Set();
    const cards = [];
    for (const h of s.hyper || []) {
      const t = h.tag && names[h.tag];
      if (!t || !t.fix || seen.has(h.tag)) continue;
      seen.add(h.tag);
      cards.push(
        `<li><strong>${U().esc(t.n)}</strong>${U().es(t.nEs)} ${U().esc(t.fix)}${U().es(t.fixEs)}</li>`,
      );
    }
    if (!cards.length) return "";
    return `<div class="ped-card hyper-card" role="region" aria-label="You were sure about this one"><h3>You were sure about this one.<span class="es-text" lang="es">${U().esc("Estabas seguro de este.")}</span></h3><p class="ped-note">Here is the other way to see it:<span class="es-text" lang="es">${U().esc("Aquí está la otra forma de verlo:")}</span></p><ul>${cards.join("")}</ul><p class="ped-note">It will come back in your Daily Boost.<span class="es-text" lang="es">${U().esc("Volverá en tu Repaso diario.")}</span></p></div>`;
  }

  /* -- why chip after a clean Boss answer -- */
  /** @type {Record<string, any>} */
  const lastAnswer = {};
  function whyRow(/** @type {number} */ tab, /** @type {string} */ itemId) {
    const s = st();
    if (s.why[itemId]) return;
    const it = rt.api.expand(tab, s.idx[tab]);
    if (!it || it.id !== itemId || (it.k !== "mc" && it.k !== "num")) return;
    const names = { ...(G()?.traps?.names || {}), ...(rt.api.data.traps || {}) };
    const chips = whyChips(it, names);
    const fb = $(`#stage-${tab} .item-fb`);
    if (!chips || !fb || $(".why-row", fb)) return;
    const row = document.createElement("div");
    row.className = "ped-row why-row ped-why";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Why does that work?");
    row.innerHTML = `<span class="ped-q">Why does that work?<span class="es-text" lang="es">${U().esc("¿Por qué funciona?")}</span></span>${chips
      .map(
        (c) =>
          `<button type="button" class="btn btn-sm" data-why="${U().esc(c.id)}">${U().esc(c.en)}${U().es(c.es)}</button>`,
      )
      .join("")}<span class="ped-note" data-why-note role="status"></span>`;
    const next = $(".next-btn", fb);
    fb.insertBefore(row, next || null);
    row.addEventListener("click", (e) => {
      const b = /** @type {HTMLElement|null} */ (
        /** @type {HTMLElement} */ (e.target).closest("[data-why]")
      );
      if (!b || s.why[itemId]) return;
      const c = chips.find((x) => x.id === b.dataset.why);
      if (!c) return;
      s.why[itemId] = { ok: c.ok, pick: c.ok ? "true" : c.id };
      rt.api.save();
      for (const x of row.querySelectorAll("[data-why]")) {
        x.setAttribute("disabled", "");
        x.setAttribute("aria-pressed", String(x === b));
      }
      const tr = chips.find((x) => x.ok);
      $("[data-why-note]", row).innerHTML = c.ok
        ? `Yes, that is the reason.${U().es("Sí, esa es la razón.")}`
        : `That is a different idea. The reason is: ${U().esc(tr?.en || "")}${U().es(tr?.es)}`;
      W.StudioBus.emit("why", { lesson: rt.api.data.lesson, itemId, ok: c.ok });
    });
  }

  /* -- look-back warm-up -- */
  function lookbackCard(/** @type {number} */ tab, /** @type {HTMLElement} */ host) {
    const d = rt.api.data;
    const s = st();
    if (tab !== 1 || s.idx[1] !== 0 || d.lesson === "0-0" || seedToken) return;
    const stage = host.closest("[id^=stage-]");
    if (!stage || $(".lookback-card", stage)) return;
    if (s.look?.date === today() && s.look.done) return;
    let boost = null;
    try {
      boost = JSON.parse(localStorage.getItem("ewl_boost_v1") || "null");
    } catch (_e) {
      return;
    }
    const rand = (() => {
      let a = hash(`look|${today()}|${d.lesson}`);
      return () => {
        a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
        return a / 4294967296;
      };
    })();
    const plan = lookbackPlan(boost, today(), d.lesson, rand);
    if (!plan) return;
    s.look = { date: today(), done: false };
    const item = {
      k: "match",
      id: `lb_${today().replace(/-/g, "")}`,
      q: "Look back: which skill does each problem practice?",
      qEs: "Mirada atrás: ¿qué habilidad practica cada problema?",
      pairs: plan.pairs.map((p) => ({
        l: p.q,
        lEs: p.qEs,
        r: `${p.title} (Lesson ${p.lesson})`,
        rEs: `${p.titleEs || p.title} (Lección ${p.lesson})`,
      })),
      h: [
        "Read what each problem asks you to find. Match the ones you are sure about first.",
        "Think about the tool you would use, not the numbers.",
      ],
      hEs: [
        "Lee lo que pide cada problema. Une primero los que sabes con seguridad.",
        "Piensa en la herramienta que usarías, no en los números.",
      ],
      x: "Telling problems apart helps you pick the right tool.",
      xEs: "Distinguir los problemas te ayuda a elegir la herramienta correcta.",
    };
    const card = document.createElement("section");
    card.className = "ped-card lookback-card stage-card";
    card.setAttribute("aria-label", "Look-back warm-up");
    card.innerHTML = `<h3>Look-back warm-up <span class="conf-opt">(optional)</span><span class="es-text" lang="es">${U().esc("Calentamiento de repaso (opcional)")}</span></h3><p class="ped-note">These are from an earlier day. It does not count toward your stars.<span class="es-text" lang="es">${U().esc("Son de otro día. No cuenta para tus estrellas.")}</span></p><div class="lookback-body"></div>`;
    stage.prepend(card);
    rt.api.mountItem({
      tab,
      it: item,
      host: $(".lookback-body", card),
      redeem: true,
      onSolved: () => {
        s.look = { date: today(), done: true };
        rt.api.save();
      },
    });
    rt.api.save();
  }

  /* -- teacher: same numbers link builder -- */
  function seedDialog() {
    const actions = $(".header-actions");
    if (!actions || $("#ped-seed-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "ped-seed-btn";
    btn.className = "top-btn";
    btn.setAttribute("data-menu", "");
    btn.innerHTML = `Teacher: same numbers<span class="es-text" lang="es">${U().esc("Maestro: mismos números")}</span>`;
    const dlg = document.createElement("dialog");
    dlg.className = "ped-seed-dlg";
    dlg.setAttribute("aria-label", "Same numbers for the class");
    dlg.innerHTML = `<form method="dialog"><h2>Teacher: same numbers for the class<span class="es-text" lang="es">${U().esc("Maestro: los mismos números para la clase")}</span></h2><p>Type a short code, like P3. Every student who opens the link below gets the same problems in the same places, so you can talk about one problem together. Their own saved work is not changed.<span class="es-text" lang="es">${U().esc("Escribe un código corto, como P3. Cada estudiante que abre el enlace recibe los mismos problemas en los mismos lugares. Su trabajo guardado no cambia.")}</span></p><label for="ped-seed-in">Code<span class="es-text" lang="es">${U().esc("Código")}</span></label> <input id="ped-seed-in" maxlength="12" autocomplete="off" spellcheck="false" value="${U().esc(seedToken || "P3")}"><p><label for="ped-seed-url">Link<span class="es-text" lang="es">${U().esc("Enlace")}</span></label></p><input id="ped-seed-url" readonly style="width:100%"><p class="ped-note" id="ped-seed-msg" role="status"></p><div class="ped-row"><button type="button" class="btn btn-go btn-sm" id="ped-seed-copy">Copy link<span class="es-text" lang="es">${U().esc("Copiar enlace")}</span></button><button class="btn btn-sm" value="close">Close<span class="es-text" lang="es">${U().esc("Cerrar")}</span></button></div></form>`;
    document.body.append(dlg);
    const input = /** @type {HTMLInputElement} */ ($("#ped-seed-in", dlg));
    const url = /** @type {HTMLInputElement} */ ($("#ped-seed-url", dlg));
    const msg = $("#ped-seed-msg", dlg);
    const build = () => {
      const tok = input.value.trim();
      if (!/^[A-Za-z0-9_-]{1,12}$/.test(tok)) {
        url.value = "";
        msg.textContent = "Use 1 to 12 letters or numbers.";
        return "";
      }
      msg.textContent = "";
      const u = new URL(location.href);
      u.search = `?seed=${tok}`;
      u.hash = "";
      url.value = u.toString();
      return url.value;
    };
    input.addEventListener("input", build);
    $("#ped-seed-copy", dlg).addEventListener("click", async () => {
      const v = build();
      if (!v) return;
      try {
        await navigator.clipboard.writeText(v);
        msg.textContent = "Link copied.";
      } catch (_e) {
        url.select();
        msg.textContent = "Press Ctrl+C (or Command+C) to copy the link.";
      }
    });
    btn.addEventListener("click", () => {
      build();
      dlg.showModal();
    });
    actions.append(btn);
  }

  function init(/** @type {any} */ runtime) {
    rt = runtime;
    layer = rt.api.data.pedagogy ? { lessons: { [rt.api.data.lesson]: rt.api.data.pedagogy } } : {};
    css("core", STYLE);
    W.StudioBus.on("answer", (/** @type {any} */ e) => {
      lastAnswer[e.itemId] = e;
      noteHyper(e);
    });
    W.StudioBus.on("solved", (/** @type {any} */ e) => {
      const a = lastAnswer[e.itemId];
      if (e.redeem || e.tab !== 5 || !a || a.tier !== "clean" || a.redeem) return;
      whyRow(e.tab, e.itemId);
    });
    W.StudioCapstone?.initBoost?.(rt);
    try {
      seedDialog();
    } catch (err) {
      console.warn("same-numbers link builder failed", err);
    }
  }

  /** Called by the runtime after an item is mounted in a section (never for redeem items). */
  function decorate(
    /** @type {number} */ tab,
    /** @type {any} */ it,
    /** @type {HTMLElement} */ host,
  ) {
    if (!rt) return;
    const s = st();
    const solved = !!s[`solved${tab}`][it.id] && (!it.reroll || s.solvedSeed[it.id] === it.seed);
    if (it.k === "num" && !solved) estimateRow(it, host);
    lookbackCard(tab, host);
  }

  W.StudioPedagogy = {
    seedToken,
    storageSuffix,
    checkPath,
    parseSeed,
    css,
    init,
    decorate,
    exitExtras,
    estimateOf,
    relation,
    CHIPS,
    BENCH,
    wordsOf,
    wordCount,
    minWords,
    evidenceWords,
    whyChips,
    firstSentence,
    lookbackPlan,
    stemFor,
    hash,
  };
})();
