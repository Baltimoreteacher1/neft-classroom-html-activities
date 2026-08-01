// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Neft Teacher — Projects META layer (shared)

   Three additive, config-driven jobs on the 23 culminating-project wizard
   pages. Nothing here moves existing nodes, renames ids, or changes what a
   Level-1 / Level-2 student sees, so Save/Resume, buildReport, grading and
   the report box are untouched.

     1. STANDARDS  — a printable "Standards this project proves" strip right
        under the hero: the page's own MCCRS codes (data/ccss-standards.json
        keys) plus a plain-language "what this project proves you can do"
        line, bilingual. The matching machine-readable <meta name="standard">
        tags are written statically into <head> by the injector, not here.

     2. SPANISH PARITY — fills the gaps where a visible instructional string
        was never wrapped in the page's .en-text / .es-text sibling pair. The
        original nodes are MOVED (never re-serialised) into an .en-text span
        and a sibling .es-text span is appended, so the page's own
        `body.es` CSS and readAloud() pick them up with no extra rules.

     3. LEVEL 0 — extra-support blocks for the IEP tier (L0 < L1 < L2), gated
        by body.level-0 exactly like the pages' own `.lvl0-only` blocks:
        a worked example for the first math step, a reduced problem set, a
        partially completed number frame, and a vocabulary re-cap.

   Gated on <body class="pro-projects">. Idempotent (dataset guard).
   Injected by tools/inject-projects-meta.mjs.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var CONFIG_URL = "/shared/projects/projects-meta-config.json?v=20260727-v2";

  /* ---------------------------------------------------------------- utils */

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function norm(s) {
    return String(s == null ? "" : s)
      .replace(/ /g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /** Two sibling spans in the page's own bilingual convention. */
  function bi(parent, en, es, cls) {
    var a = el("span", "en-text" + (cls ? " " + cls : ""), en);
    var b = el("span", "es-text" + (cls ? " " + cls : ""), es);
    parent.appendChild(a);
    parent.appendChild(b);
    return parent;
  }

  /** Config pairs are ["English", "Español"]; a bare string means "same in both". */
  function pair(v) {
    if (Array.isArray(v))
      return [String(v[0] == null ? "" : v[0]), String(v[1] == null ? v[0] : v[1])];
    var s = String(v == null ? "" : v);
    return [s, s];
  }

  /** Which of the 23 project pages are we on? */
  function pageKey() {
    var meta = document.querySelector('meta[name="nt-project-id"]');
    if (meta && meta.content) return meta.content;
    var m = location.pathname.match(/\/math\/(unit-\d+|statistics)\/projects\/version-([a-z])\b/);
    return m ? m[1] + "-" + m[2] : null;
  }

  /* --------------------------------------------------- 1. standards strip */

  function renderStandards(cfg, entry) {
    if (document.querySelector(".ntm-standards")) return;
    var list = entry.standards || [];
    if (!list.length) return;

    var head = pair(cfg.shared.standardsHeading);
    var proves = pair(entry.proves);
    var revealWord = pair(cfg.shared.revealChip);
    var unitLabel = entry.unitLabel ? pair(entry.unitLabel) : null;

    var sec = el("section", "ntm-standards");
    sec.setAttribute("aria-label", "Standards this project proves");

    var h = el("h2", "ntm-std-head");
    bi(h, head[0], head[1]);
    sec.appendChild(h);

    var chips = el("div", "ntm-std-chips");
    if (unitLabel) {
      var uc = el("span", "ntm-chip ntm-chip-unit");
      bi(uc, unitLabel[0], unitLabel[1]);
      chips.appendChild(uc);
    }
    list.forEach(function (s) {
      var c = el("span", "ntm-chip");
      c.setAttribute("data-standard", s.code);
      if (s.legacy) c.setAttribute("data-standard-legacy", s.legacy);
      c.appendChild(el("b", "ntm-chip-code", s.code));
      if (s.label) {
        var lbl = el("span", "ntm-chip-label");
        bi(lbl, s.label, s.labelEs || s.label);
        c.appendChild(lbl);
      }
      chips.appendChild(c);
    });
    /* Keep the pacing map able to match units 7/8/9/statistics, where the
       page's own unit heading and the scope-and-sequence unit disagree. */
    if (entry.revealUnit != null && entry.revealUnit !== entry.unit) {
      var rc = el("span", "ntm-chip ntm-chip-reveal");
      rc.setAttribute("data-reveal-unit", String(entry.revealUnit));
      bi(rc, revealWord[0] + " " + entry.revealUnit, revealWord[1] + " " + entry.revealUnit);
      chips.appendChild(rc);
    }
    sec.appendChild(chips);

    if (proves[0]) {
      var p = el("p", "ntm-proves");
      var tag = el("span", "ntm-proves-tag");
      var tagTxt = pair(cfg.shared.provesLabel);
      bi(tag, tagTxt[0], tagTxt[1]);
      p.appendChild(tag);
      var body = el("span", "ntm-proves-text");
      bi(body, proves[0], proves[1]);
      p.appendChild(body);
      sec.appendChild(p);
    }

    var hero = document.querySelector("header.hero") || document.querySelector(".hero");
    if (hero && hero.parentNode) hero.parentNode.insertBefore(sec, hero.nextSibling);
    else document.body.insertBefore(sec, document.body.firstChild);
  }

  /* ---------------------------------------------------- 2. Spanish parity */

  /* Only these children may live inside an element we re-wrap. Anything else
     (an <input>, a nested <div>, a <table>) means the element is structural,
     so we skip it rather than risk changing how it lays out or saves. */
  var INLINE_OK = {
    A: 1,
    ABBR: 1,
    B: 1,
    BR: 1,
    CODE: 1,
    EM: 1,
    I: 1,
    MARK: 1,
    SMALL: 1,
    SPAN: 1,
    STRONG: 1,
    SUB: 1,
    SUP: 1,
    U: 1,
  };

  /* <option> is deliberately absent: several pages read option.text as data
     (state names, player names) and three pages already translate their own
     options inside toggleLanguage(). Rewriting option text here would be a
     behaviour change, not a translation. */
  var ES_SELECTOR = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "label",
    "button",
    "th",
    "summary",
    "legend",
    "figcaption",
    "caption",
    "div.instruct",
    "p.instruct",
  ].join(",");

  /* JS-managed button labels — their textContent is reassigned by the page's
     own toggleLanguage() / readAloud(), which would wipe our spans. */
  var ES_SKIP_IDS = { "btn-lang": 1, "btn-read": 1 };

  function canWrap(node) {
    if (!node || node.dataset.ntmEs === "1") return false;
    if (ES_SKIP_IDS[node.id]) return false;
    if (node.closest("script,style,template")) return false;
    if (node.querySelector(".en-text,.es-text")) return false; // already bilingual
    if (node.closest(".en-text,.es-text")) return false; // inside a pair
    if (node.closest(".ntm-standards,.ntm-l0")) return false; // ours already
    for (var i = 0; i < node.children.length; i++) {
      if (!INLINE_OK[node.children[i].tagName]) return false;
    }
    return true;
  }

  function wrapBilingual(node, es) {
    node.dataset.ntmEs = "1";
    var en = el("span", "en-text");
    while (node.firstChild) en.appendChild(node.firstChild); // MOVE, don't re-serialise
    node.appendChild(en);
    node.appendChild(el("span", "es-text", es));
  }

  function fillSpanish(cfg, entry) {
    var dict = {};
    var k;
    for (k in cfg.shared.es)
      if (Object.prototype.hasOwnProperty.call(cfg.shared.es, k)) dict[k] = cfg.shared.es[k];
    for (k in entry.es || {})
      if (Object.prototype.hasOwnProperty.call(entry.es, k)) dict[k] = entry.es[k];

    var filled = 0;
    var missed = [];
    var nodes = document.querySelectorAll(ES_SELECTOR);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!canWrap(node)) continue;
      var key = norm(node.textContent);
      if (!key || !/[A-Za-z]{3}/.test(key)) continue;
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        wrapBilingual(node, dict[key]);
        filled++;
      } else {
        missed.push(key);
      }
    }
    return { filled: filled, missed: missed };
  }

  /* -------------------------------------------------- 3. Level 0 supports */

  function l0Card(kind, headingPair) {
    var d = el("div", "instruct ntm-l0 ntm-l0-" + kind);
    var h = el("div", "ntm-l0-head");
    var badge = el("span", "ntm-l0-badge");
    bi(badge, headingPair.badge[0], headingPair.badge[1]);
    h.appendChild(badge);
    var t = el("span", "ntm-l0-title");
    bi(t, headingPair.title[0], headingPair.title[1]);
    h.appendChild(t);
    d.appendChild(h);
    return d;
  }

  function renderLevel0(cfg, entry) {
    var l0 = entry.level0;
    if (!l0) return 0;
    /* Level 0 is a mini-project, not the regular project plus more text.
       Mount it in the first wizard panel so students see one short path as
       soon as they choose Level 0. */
    var panel = document.querySelector(".step-panel");
    if (!panel || panel.dataset.ntmL0 === "1") return 0;
    panel.dataset.ntmL0 = "1";
    panel.classList.add("ntm-l0-panel");

    var S = cfg.shared.level0;
    var badge = pair(S.badge);
    var frag = document.createDocumentFragment();
    var added = 0;

    /* 3a. One short, concrete job first --------------------------------- */
    if (l0.reduce) {
      var r = pair(l0.reduce);
      var rc = l0Card("reduce", { badge: badge, title: pair(S.reduceHeading) });
      var rp = el("p", "ntm-l0-sub");
      bi(rp, r[0], r[1]);
      rc.appendChild(rp);
      var answerLabel = el("label", "ntm-l0-response-label");
      var answerPrompt = pair(S.answerPrompt);
      bi(answerLabel, answerPrompt[0], answerPrompt[1]);
      var answerInput = el("input", "ntm-l0-response");
      answerInput.type = "text";
      answerInput.setAttribute("aria-label", answerPrompt[0]);
      answerLabel.appendChild(answerInput);
      rc.appendChild(answerLabel);
      frag.appendChild(rc);
      added++;
    }

    /* 3b. Worked example: two visible steps plus the answer -------------- */
    if (l0.worked) {
      var w = pair(l0.worked.title);
      var card = l0Card("worked", { badge: badge, title: pair(S.workedHeading) });
      var wt = el("p", "ntm-l0-sub");
      bi(wt, w[0], w[1]);
      card.appendChild(wt);
      var ol = el("ol", "ntm-l0-steps");
      (l0.worked.steps || []).slice(0, 2).forEach(function (s) {
        var p = pair(s);
        var li = el("li");
        bi(li, p[0], p[1]);
        ol.appendChild(li);
      });
      card.appendChild(ol);
      if (l0.worked.answer) {
        var a = pair(l0.worked.answer);
        var lab = pair(S.workedAnswerLabel);
        var ans = el("p", "ntm-l0-answer");
        var strong = el("strong");
        bi(strong, lab[0] + ": ", lab[1] + ": ");
        ans.appendChild(strong);
        var av = el("span");
        bi(av, a[0], a[1]);
        ans.appendChild(av);
        card.appendChild(ans);
      }
      frag.appendChild(card);
      added++;
    }

    /* 3c. One key word + one sentence starter ---------------------------- */
    if (l0.vocab && l0.vocab.length) {
      var vc = l0Card("vocab", { badge: badge, title: pair(S.vocabHeading) });
      var grid = el("div", "ntm-l0-vocab");
      l0.vocab.slice(0, 1).forEach(function (v) {
        var cardV = el("div", "ntm-l0-word");
        var term = el("div", "ntm-l0-term");
        bi(term, v[0], v[1]);
        cardV.appendChild(term);
        var def = el("div", "ntm-l0-def");
        bi(def, v[2], v[3]);
        cardV.appendChild(def);
        grid.appendChild(cardV);
      });
      vc.appendChild(grid);

      var sh = pair(S.startersHeading);
      var sHead = el("p", "ntm-l0-sub");
      bi(sHead, sh[0], sh[1]);
      vc.appendChild(sHead);
      var ul = el("ul", "ntm-l0-starters");
      (S.starters || []).slice(0, 1).forEach(function (s) {
        var p = pair(s);
        var li = el("li");
        bi(li, p[0], p[1]);
        ul.appendChild(li);
      });
      vc.appendChild(ul);
      frag.appendChild(vc);
      added++;
    }

    if (!added) return 0;
    var finish = pair(S.finish);
    var done = l0Card("done", { badge: badge, title: pair(S.finishHeading) });
    var doneText = el("p", "ntm-l0-sub");
    bi(doneText, finish[0], finish[1]);
    done.appendChild(doneText);
    frag.appendChild(done);
    added++;

    var shell = el("section", "ntm-l0 ntm-l0-shell");
    shell.setAttribute("aria-label", "Level 0 mini-project");
    shell.appendChild(frag);
    panel.insertBefore(shell, panel.firstChild);
    return added;
  }

  function installLevel0Navigation() {
    if (window.__ntmLevel0Navigation) return;
    window.__ntmLevel0Navigation = true;
    var original = window.setLevel;
    if (typeof original !== "function") return;
    window.setLevel = function (n) {
      original.apply(this, arguments);
      if (Number(n) !== 0) return;
      var panel = document.querySelector(".ntm-l0-panel");
      var match = panel && String(panel.id || "").match(/^step-(\d+)$/);
      if (match && typeof window.goStep === "function") window.goStep(Number(match[1]));
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  /* ------------------------------------------------------------ bootstrap */

  var STATE = { key: null, standards: [], esFilled: 0, esMissed: [], l0: 0 };

  function apply(cfg) {
    var key = STATE.key;
    var entry = cfg && cfg.pages && cfg.pages[key];
    if (!entry) return;
    renderStandards(cfg, entry);
    var es = fillSpanish(cfg, entry);
    STATE.esFilled += es.filled;
    STATE.esMissed = es.missed;
    STATE.l0 += renderLevel0(cfg, entry);
    STATE.standards = (entry.standards || []).map(function (s) {
      return s.code;
    });
  }

  function run() {
    if (!document.body || !document.body.classList.contains("pro-projects")) return;
    if (document.body.dataset.ntMetaInit === "1") return;
    var key = pageKey();
    if (!key) return;
    document.body.dataset.ntMetaInit = "1";
    STATE.key = key;
    installLevel0Navigation();

    fetch(CONFIG_URL, { cache: "no-cache" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (cfg) {
        if (!cfg) return;
        apply(cfg);
        /* Late-rendered chrome (step trail labels, injected heroes) can land
           after DOMContentLoaded; one bounded re-scan catches it. */
        setTimeout(function () {
          apply(cfg);
        }, 900);
      })
      .catch(function () {
        /* Non-fatal: the page is fully usable without this layer. */
      });
  }

  ready(run);

  window.NTMeta = {
    run: run,
    state: STATE,
    /** Teacher/QA helper: list strings this layer could not translate. */
    missingSpanish: function () {
      return STATE.esMissed.slice();
    },
  };
})();
