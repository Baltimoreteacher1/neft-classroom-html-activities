/* =============================================================================
 * Study Pack engine (window.StudyPack) — framework-free, host-agnostic.
 * -----------------------------------------------------------------------------
 * Turns a validated study-pack object (see shared/study-pack/contract.mjs) into
 * an interactive, multi-tab study experience: Big Ideas, Walkthrough, Practice,
 * Game, Quiz, Listen, and Ask.
 *
 * The engine knows nothing about the AI backend. The host page supplies two
 * async functions so the SAME engine works on eduwonderlab.com (Claude) and on
 * noam.eduwonderlab.com (Gemini):
 *
 *   StudyPack.mount(container, {
 *     generate: async (notes, subjectHint) => pack,   // -> validated pack obj
 *     ask:      async (notes, question)    => "reply", // grounded chat (optional)
 *     storageKey: "nt-study-packs",                    // localStorage namespace
 *     brand: "curriculum" | "noam",
 *   });
 *
 * Persistence is localStorage only (per-device, no PII, no backend) so it is
 * safe to ship on a live site with no schema migration.
 * ========================================================================== */
(function (global) {
  "use strict";

  var MAX_SAVED = 12;

  // ---- tiny DOM helpers ----------------------------------------------------
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function")
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  // Answer checking uses the site-wide matcher so a study-pack practice item
  // credits the same forms a lesson does — "8", "c = 8" and "8 cups" are one
  // answer. This engine ships as a classic script to two different deploy
  // roots, so it cannot import; the block below is generated into this file
  // from engine/core/answer-match.js by tools/sync-study-pack.mjs (which runs
  // in npm run build) and pinned against drift by
  // tools/study-pack-answer-match.test.mjs. Do not hand-edit it.
  /* answer-match-generated:begin */
  // ── Shared answer matcher — generated from engine/core/answer-match.js.
  // Do not edit here; edit that file and re-run the generator that emits it.
  var NTAnswerMatch = (function () {
    // Single source of truth for student answer checking across the whole site —
    // lesson skill practice, Connect-check blanks, fill-in tables, homework pages,
    // and the small-group studio. Tolerant of the ways grade-6 students actually
    // type math: $ and comma formatting, fractions ("3/4"), mixed numbers
    // ("1 1/2"), × vs x, an optional variable label ("m = 4" and "4" are the same
    // answer), and optional trailing units ("24 sq. ft." and "24" are the same
    // answer) — while never crediting a bare number against a non-numeric answer
    // like "2 × 3 × 7".
    //
    // The rule this file encodes: a student is assessed on the VALUE they found,
    // not on the bookkeeping around it. Naming the variable and labelling the unit
    // are good habits worth suggesting, but they must never turn a correct answer
    // into a red X.

    const norm = (value) =>
      String(value ?? "")
        .toLowerCase()
        .trim()
        // Strip accents so "área" and "area" match. NFD (canonical) only — NFKD
        // would fold a superscript power like 2^3 into "23" and let a student's
        // "23" match it. (Powers are written out here rather than as glyphs: this
        // file is inlined into every homework page, and audit:homework reads a
        // literal superscript as "this page shows an exponents visual".)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[×·*]/g, "x")
        // Division was the one operation whose two spellings did NOT unify: "84/21"
        // normalised to "84/21" and "84 ÷ 21" stayed "84 ÷ 21", so a student who
        // typed the symbol on their keyboard instead of the one in the lesson was
        // marked wrong. Words are folded for the same reason (Joel, 2026-08-23:
        // "I don't want the tables to be so strict throughout").
        .replace(/÷/g, "/")
        .replace(/\bdivided by\b/g, "/")
        .replace(/\btimes\b/g, "x")
        .replace(/\bplus\b/g, "+")
        .replace(/\bminus\b/g, "-")
        .replace(/[−–—]/g, "-")
        .replace(/\s+/g, " ")
        .replace(/[.,;:]+$/, "")
        .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
        .replace(/\s*([x+\-=:/(),<>≤≥])\s*/g, "$1")
        .replace(/(\d)\s*r\s*(\d)/g, "$1r$2");

    // Strict full-string numeric parse: mixed number, fraction, or plain number
    // (with optional $ prefix / % suffix). Returns null for anything else — a
    // stem like "x + 2 = 4" must never collapse to its first digit.
    const numberOf = (value) => {
      const text = String(value ?? "")
        .replace(/[$,]/g, "")
        .replace(/%\s*$/, "")
        .trim();
      const mixed = text.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
      if (mixed) {
        const denominator = Number(mixed[4]);
        if (!denominator) return null;
        const sign = mixed[1] === "-" ? -1 : 1;
        return sign * (Number(mixed[2]) + Number(mixed[3]) / denominator);
      }
      const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
      if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
      // Accept ".5" as well as "0.5" — students drop the leading zero constantly.
      const plain = text.match(/^-?(?:\d+(?:\.\d+)?|\.\d+)$/);
      return plain ? Number.parseFloat(plain[0]) : null;
    };

    // "m = 4", "m=4", "m is 4", "4 = m" and "4" are the same answer: the variable
    // label restates the question, it is not the thing being assessed. ONLY "="
    // is stripped — an inequality ("x > 5") keeps its relation, because there a
    // bare "5" really is an incomplete answer. A multi-character left side
    // ("3x = 12") is left alone: that is an equation, not a labelled value.
    const LABEL_LEADING = /^([a-z][a-z0-9]?)\s*(?:=|\bis\b)\s*(.+)$/i;
    const LABEL_TRAILING = /^(.+?)\s*=\s*([a-z][a-z0-9]?)$/i;

    const stripLabel = (value) => {
      const text = String(value ?? "").trim();
      const leading = text.match(LABEL_LEADING);
      if (leading) return leading[2].trim();
      const trailing = text.match(LABEL_TRAILING);
      if (trailing) return trailing[1].trim();
      return text;
    };

    // Units and labels are optional on both sides. "24", "24 sq. ft.",
    // "24 square feet" and "24 boxes" are the same answer. The tail is only
    // dropped when it contains a letter AND a number is left behind, so a power
    // like 2^3 written with a superscript (no letter in the tail) and a word
    // answer like "quotient" (nothing left) are never hollowed out.
    const UNIT_TAIL = /[a-z°²³.\s/]+$/i;

    // "24 sq. ft." → "24". Returns the input unchanged when there is no unit to
    // drop, so it is safe to run over any answer.
    const stripUnit = (value) => {
      const text = String(value ?? "").trim();
      if (numberOf(text) != null) return text;
      const tail = text.match(UNIT_TAIL);
      if (!tail || !/[a-z]/i.test(tail[0])) return text;
      const head = text.slice(0, text.length - tail[0].length).trim();
      return head && numberOf(head) != null ? head : text;
    };

    const numericValue = (value) => numberOf(stripUnit(value));

    /* ── Phrasing ────────────────────────────────────────────────────────────────
       An answer that DESCRIBES a move has no single spelling: "Divide both sides
       by 3", "divide by 3" and "÷ 3" are one answer. phraseKey reduces such an
       answer to what it actually names — the operation and the number — with
       filler words and word order dropped.

       Word order has to be dropped for this to work at all, and dropping it is
       only safe while there is nothing for the order to mean. So the layer is
       refused the moment either side names TWO numbers: "56 ÷ 8" and "8 ÷ 56" are
       different answers, and no amount of flexibility may say otherwise. */

    const PHRASE_FILLER = new Set([
      "a",
      "an",
      "the",
      "and",
      "then",
      "so",
      "is",
      "are",
      "be",
      "to",
      "of",
      "it",
      "by",
      "on",
      "in",
      "with",
      "for",
      "each",
      "every",
      "both",
      "side",
      "sides",
      "step",
      "steps",
      "we",
      "i",
      "you",
      "my",
      "your",
      "answer",
      "value",
      "number",
      "equation",
      "problem",
      "result",
      "over",
      "use",
      "using",
      "same",
      "get",
    ]);

    const PHRASE_OPERATIONS = [
      [/\/|\bdividing\b|\bdivide\b|\bdivision\b/g, " divide "],
      // norm() has already folded × · * into "x" AND closed the spaces around it,
      // so "× 4" arrives as "x4" and "3 × 4" as "3x4". Read that x as multiply only
      // where a digit follows it; a trailing x ("3x = 12") is the variable and must
      // survive, or a coefficient would be torn off its term.
      [
        /(?<=\d)x(?=\d)|(?<=\s)x(?=\d)|(?<=\s)x(?=\s)|\bmultiplying\b|\bmultiply\b|\bmultiplication\b/g,
        " multiply ",
      ],
      [/\+|\badding\b|\badd\b|\baddition\b/g, " add "],
      [/\bsubtracting\b|\bsubtract\b|\bsubtraction\b/g, " subtract "],
    ];

    const NUMBER_WORDS = {
      zero: "0",
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      six: "6",
      seven: "7",
      eight: "8",
      nine: "9",
      ten: "10",
      eleven: "11",
      twelve: "12",
    };

    function phraseKey(value) {
      // NOTE: no template literals anywhere in this file — it is inlined verbatim
      // into homework HTML inside one (scripts/homework-answer-match.mjs).
      let text = " " + norm(value) + " ";
      for (const [pattern, word] of PHRASE_OPERATIONS) text = text.replace(pattern, word);
      const tokens = text
        .split(/[^a-z0-9.]+/)
        .map((token) => NUMBER_WORDS[token] || token)
        .filter((token) => token && !PHRASE_FILLER.has(token));
      return tokens.sort().join("|");
    }

    /** How many distinct numbers a phrase names — the guard on word order above. */
    function numberCount(key) {
      return new Set(key.split("|").filter((token) => /^\d/.test(token))).size;
    }

    function phraseMatches(typed, answer) {
      // This layer exists for an answer that DESCRIBES a move in words. An answer
      // with no letters in it is notation, not description, and notation is already
      // handled by norm() — running it through a token bag can only lose
      // information. It did: phraseKey drops characters it has no token for, so
      // a power written with a superscript glyph reduced to its base, and 2^3 was
      // answered by 2. (Powers are written 2^3 here: audit:homework reads a literal
      // superscript in this file as "this page shows an exponents visual".)
      if (!/[a-z]/i.test(String(answer ?? ""))) return false;
      const answerKey = phraseKey(answer);
      const typedKey = phraseKey(typed);
      if (!answerKey || answerKey !== typedKey) return false;
      // Must name an operation — otherwise this is free prose, and two different
      // explanations built from the same words would compare equal.
      if (!/divide|multiply|add|subtract/.test(answerKey)) return false;
      return numberCount(answerKey) <= 1;
    }

    /* ── Either half of a stated equation ────────────────────────────────────────
       Work authored as "3x ÷ 3 = 21 ÷ 3" states the SAME move on both sides; a
       student who writes only the half that does the arithmetic has answered it.
       A half with no digit in it is refused, so "x = 7" is never answered by "x". */
    function equationHalves(value) {
      const text = String(value ?? "").trim();
      if (!text.includes("=")) return [];
      return text
        .split("=")
        .map((part) => part.trim())
        .filter((part) => part && /\d/.test(part));
    }

    function matchesOne(typed, answer) {
      if (answer == null) return false;
      if (norm(typed) === norm(answer)) return true;
      const typedCore = stripLabel(typed);
      const answerCore = stripLabel(answer);
      if (norm(typedCore) === norm(answerCore)) return true;
      if (phraseMatches(typed, answer)) return true;
      // Only the halves of the ANSWER are opened up. Splitting what the STUDENT
      // typed would credit "7 = 8" against 7.
      for (const half of equationHalves(answer)) {
        if (norm(typed) === norm(half)) return true;
        if (norm(typedCore) === norm(stripLabel(half))) return true;
      }
      const target = numericValue(answerCore);
      if (target == null) return false;
      const value = numericValue(typedCore);
      return value != null && Math.abs(value - target) < 1e-9;
    }

    // "answer" may be a single accepted form or an array of equivalent forms.
    function isRight(input, answer) {
      if (answer == null) return false;
      if (!String(input ?? "").trim()) return false;
      const accepted = Array.isArray(answer) ? answer : [answer];
      return accepted.some((one) => matchesOne(input, one));
    }

    // The fuller authored form ("m = 4", "24 sq. ft.") when the student's own
    // correct answer left the label or unit off. Callers use this to SUGGEST the
    // fuller form after crediting the answer — never to withhold credit. Returns
    // null when there is nothing extra worth showing.
    function fullerFormHint(input, answer) {
      const accepted = Array.isArray(answer) ? answer : [answer];
      const shown = accepted.find((a) => a != null && String(a).trim());
      if (shown == null) return null;
      const text = String(shown).trim();
      if (norm(input) === norm(text)) return null;
      // Only worth showing when the authored form adds a variable label or a unit
      // to a value the student already got right.
      const core = stripLabel(text);
      const addsLabel = core !== text;
      const addsUnit = numberOf(core) == null && numericValue(core) != null;
      return addsLabel || addsUnit ? text : null;
    }

    return { norm, numberOf, stripLabel, numericValue, isRight, fullerFormHint };
  })();
  /* answer-match-generated:end */

  // Lazy-load KaTeX (same CDN Noam already uses) once, then resolve. If the
  // host already provides renderMathInElement, reuse it. Never blocks render —
  // on failure the raw LaTeX simply stays as text.
  var KATEX = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/";
  var _katexLoading = null;
  function ensureKatex() {
    if (global.renderMathInElement) return Promise.resolve(true);
    if (_katexLoading) return _katexLoading;
    _katexLoading = new Promise(function (resolve) {
      try {
        if (!document.querySelector('link[href*="katex"]')) {
          var link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = KATEX + "katex.min.css";
          document.head.appendChild(link);
        }
        var s1 = document.createElement("script");
        s1.src = KATEX + "katex.min.js";
        s1.onload = function () {
          var s2 = document.createElement("script");
          s2.src = KATEX + "contrib/auto-render.min.js";
          s2.onload = function () {
            resolve(!!global.renderMathInElement);
          };
          s2.onerror = function () {
            resolve(false);
          };
          document.head.appendChild(s2);
        };
        s1.onerror = function () {
          resolve(false);
        };
        document.head.appendChild(s1);
      } catch (_e) {
        resolve(false);
      }
    });
    return _katexLoading;
  }
  // Render any LaTeX inside `node` with KaTeX (tolerant, non-blocking).
  function mathify(node) {
    ensureKatex().then(function (ok) {
      if (!ok || !global.renderMathInElement) return;
      try {
        global.renderMathInElement(node, {
          delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "$$", right: "$$", display: true },
          ],
          throwOnError: false,
        });
      } catch (_e) {
        /* ignore */
      }
    });
  }

  // ---- persistence ---------------------------------------------------------
  function loadSaved(key) {
    try {
      var raw = global.localStorage.getItem(key);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_e) {
      return [];
    }
  }
  function persist(key, list) {
    try {
      global.localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_SAVED)));
    } catch (_e) {
      /* quota / private mode — non-fatal */
    }
  }

  // =========================================================================
  // Engine instance
  // =========================================================================
  function mount(container, opts) {
    opts = opts || {};
    var storageKey = opts.storageKey || "nt-study-packs";
    var canAsk = typeof opts.ask === "function";
    var canAudio = typeof opts.audio === "function";
    var canPhoto = opts.photo !== false; // host opts out only if its backend has no vision

    var root = el("div", { class: "stp-root", "data-brand": opts.brand || "curriculum" });
    clear(container);
    container.appendChild(root);

    var live = el("div", { class: "stp-sr-only", "aria-live": "polite" });
    root.appendChild(live);
    function announce(msg) {
      live.textContent = msg;
    }

    renderIntake();

    // ---- Intake screen -----------------------------------------------------
    function renderIntake() {
      stopSpeech();
      clear(root);
      root.appendChild(live);
      var ta = el("textarea", {
        placeholder:
          "Paste your class notes here — a lesson, a chapter, vocabulary, examples… anything you want to study.",
        "aria-label": "Your notes",
        maxlength: "12000",
      });
      var subj = el("input", {
        type: "text",
        placeholder: "Topic (optional) — e.g. Ratios, Photosynthesis, WWII causes",
        "aria-label": "Topic",
      });
      var count = el("div", { class: "stp-count", text: "0 / 12000" });
      ta.addEventListener("input", function () {
        count.textContent = ta.value.length + " / 12000";
      });
      var errBox = el("div", { class: "stp-error", hidden: "hidden" });

      // Optional photo of notes (Claude vision). Stored as base64 until submit.
      var photoData = null; // { mime, data }
      var photoRow = el("div", { class: "stp-photo-row" });
      var fileInput = el("input", {
        type: "file",
        accept: "image/png,image/jpeg,image/webp,image/gif",
        hidden: "hidden",
        "aria-hidden": "true",
      });
      function renderPhotoRow() {
        clear(photoRow);
        if (photoData) {
          photoRow.appendChild(
            el("div", { class: "stp-photo-chip" }, [
              el("img", {
                src: "data:" + photoData.mime + ";base64," + photoData.data,
                alt: "photo of notes",
              }),
              el("span", { text: "Photo added" }),
              el("button", {
                class: "stp-btn ghost",
                type: "button",
                text: "✕ Remove",
                onclick: function () {
                  photoData = null;
                  fileInput.value = "";
                  renderPhotoRow();
                },
              }),
            ]),
          );
        } else if (canPhoto) {
          photoRow.appendChild(
            el("button", {
              class: "stp-btn ghost",
              type: "button",
              text: "📷 Add a photo of my notes",
              onclick: function () {
                fileInput.click();
              },
            }),
          );
        }
      }
      fileInput.addEventListener("change", function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        if (f.size > 4_500_000) {
          errBox.hidden = false;
          errBox.textContent =
            "That photo is a bit large — try a smaller or clearer picture (under ~4MB).";
          fileInput.value = "";
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          var res = String(reader.result || "");
          var comma = res.indexOf(",");
          photoData = {
            mime: f.type || "image/jpeg",
            data: comma >= 0 ? res.slice(comma + 1) : res,
          };
          errBox.hidden = true;
          renderPhotoRow();
        };
        reader.readAsDataURL(f);
      });
      renderPhotoRow();

      var goBtn = el("button", {
        class: "stp-btn solid",
        type: "button",
        text: "✨ Make my study pack",
        onclick: function () {
          var notes = ta.value.trim();
          if (notes.length < 20 && !photoData) {
            errBox.hidden = false;
            errBox.textContent =
              "Add a photo of your notes, or paste at least a sentence or two, so I can build a good pack.";
            return;
          }
          errBox.hidden = true;
          generate(notes, subj.value.trim(), photoData);
        },
      });

      var intake = el("section", { class: "stp-intake" }, [
        el("h2", { text: "📝 Turn your notes into a study pack" }),
        el("p", {
          class: "stp-lead",
          text: "Paste your notes or add a photo, and get a summary, worked examples, practice with hints, a game, a quiz, and a listen-along — built just from what you give me.",
        }),
        el("label", { class: "stp-field-label", for: "" }, ["Your notes"]),
        ta,
        count,
        fileInput,
        photoRow,
        el("label", { class: "stp-field-label" }, ["Topic (optional)"]),
        subj,
        errBox,
        el("div", { class: "stp-actions" }, [goBtn]),
      ]);
      root.appendChild(intake);
      renderSavedList();
      ta.focus();
    }

    function renderSavedList() {
      var list = loadSaved(storageKey);
      var existing = root.querySelector(".stp-saved");
      if (existing) existing.remove();
      if (!list.length) return;
      var ul = el("ul", { class: "stp-saved-list" });
      list.forEach(function (entry, idx) {
        ul.appendChild(
          el("li", { class: "stp-saved-item" }, [
            el("button", {
              class: "stp-open",
              type: "button",
              text: "📁 " + (entry.pack && entry.pack.title ? entry.pack.title : "Study pack"),
              onclick: function () {
                renderPack(entry.pack, entry.notes);
              },
            }),
            el("button", {
              class: "stp-del",
              type: "button",
              "aria-label": "Delete saved pack",
              text: "🗑",
              onclick: function () {
                var cur = loadSaved(storageKey);
                cur.splice(idx, 1);
                persist(storageKey, cur);
                renderSavedList();
              },
            }),
          ]),
        );
      });
      root
        .querySelector(".stp-intake")
        .appendChild(
          el("div", { class: "stp-saved" }, [el("h3", { text: "Your saved study packs" }), ul]),
        );
    }

    // ---- Generation --------------------------------------------------------
    function generate(notes, subjectHint, image) {
      clear(root);
      root.appendChild(live);
      root.appendChild(
        el("div", { class: "stp-status" }, [
          el("div", { class: "stp-spinner", "aria-hidden": "true" }),
          el("p", {
            text: image
              ? "Reading your photo and building your study pack… this takes a few seconds."
              : "Building your study pack… this takes a few seconds.",
          }),
        ]),
      );
      announce("Building your study pack.");
      Promise.resolve()
        .then(function () {
          return opts.generate(notes, subjectHint, image);
        })
        .then(function (pack) {
          if (!pack || typeof pack !== "object") throw new Error("empty");
          savePack(pack, notes);
          renderPack(pack, notes);
          announce("Study pack ready.");
        })
        .catch(function () {
          clear(root);
          root.appendChild(live);
          root.appendChild(
            el("section", { class: "stp-intake" }, [
              el("h2", { text: "Hmm, that didn't work" }),
              el("div", {
                class: "stp-error",
                text: "I couldn't build the pack just now. Please check your connection and try again in a moment.",
              }),
              el("div", { class: "stp-actions" }, [
                el("button", {
                  class: "stp-btn solid",
                  type: "button",
                  text: "← Back",
                  onclick: renderIntake,
                }),
              ]),
            ]),
          );
        });
    }

    function savePack(pack, notes) {
      var list = loadSaved(storageKey);
      list.unshift({ pack: pack, notes: notes, ts: Date.now() });
      persist(storageKey, list);
    }

    // ---- Pack + tabs -------------------------------------------------------
    function renderPack(pack, notes) {
      stopSpeech();
      clear(root);
      root.appendChild(live);

      root.appendChild(
        el("div", { class: "stp-pack-head" }, [
          el("div", {}, [
            el("h2", { text: pack.title || "My Study Pack" }),
            pack.subject ? el("div", { class: "stp-sub", text: pack.subject }) : null,
          ]),
          el("button", {
            class: "stp-btn ghost",
            type: "button",
            text: "＋ New pack",
            onclick: renderIntake,
          }),
        ]),
      );

      var tabs = [
        { id: "ideas", label: "💡 Big Ideas", render: renderIdeas },
        { id: "walk", label: "🧭 Walkthrough", render: renderWalk },
        { id: "practice", label: "✏️ Practice", render: renderPractice },
        { id: "game", label: "🎮 Game", render: renderGame },
        { id: "quiz", label: "🏆 Quiz", render: renderQuiz },
        { id: "listen", label: "🎧 Listen", render: renderListen },
      ];
      if (canAsk) tabs.push({ id: "ask", label: "💬 Ask", render: renderAsk });

      var tablist = el("div", { class: "stp-tablist", role: "tablist" });
      var panel = el("div", {
        class: "stp-panel",
        id: "stp-panel",
        role: "tabpanel",
        tabindex: "-1",
      });
      var btns = [];
      tabs.forEach(function (t, i) {
        var b = el("button", {
          class: "stp-tab",
          role: "tab",
          type: "button",
          id: "stp-tab-" + t.id,
          "aria-selected": i === 0 ? "true" : "false",
          "aria-controls": "stp-panel",
          tabindex: i === 0 ? "0" : "-1",
          text: t.label,
          onclick: function () {
            select(i);
          },
        });
        btns.push(b);
        tablist.appendChild(b);
      });
      tablist.addEventListener("keydown", function (e) {
        var cur = btns.indexOf(document.activeElement);
        if (cur < 0) return;
        // ARIA tabs pattern: arrows both move focus AND activate (selection
        // follows focus), so aria-selected can never desync from the panel.
        if (e.key === "ArrowRight") {
          var nxt = (cur + 1) % btns.length;
          btns[nxt].focus();
          select(nxt);
        } else if (e.key === "ArrowLeft") {
          var prv = (cur - 1 + btns.length) % btns.length;
          btns[prv].focus();
          select(prv);
        }
      });
      function select(i) {
        stopSpeech();
        btns.forEach(function (b, j) {
          b.setAttribute("aria-selected", j === i ? "true" : "false");
          // Roving tabindex: only the active tab sits in the Tab order.
          b.setAttribute("tabindex", j === i ? "0" : "-1");
        });
        clear(panel);
        panel.setAttribute("aria-labelledby", "stp-tab-" + tabs[i].id);
        tabs[i].render(panel, pack, notes);
        mathify(panel);
      }
      root.appendChild(tablist);
      root.appendChild(panel);
      select(0);
    }

    // ---- Tab: Big Ideas ----------------------------------------------------
    function renderIdeas(panel, pack) {
      var bi = pack.bigIdeas || {};
      panel.appendChild(el("h3", { text: "The big ideas" }));
      if ((bi.summary || []).length) {
        var ul = el("ul", {});
        bi.summary.forEach(function (s) {
          ul.appendChild(el("li", { text: s }));
        });
        panel.appendChild(ul);
      }
      if ((bi.vocab || []).length) {
        panel.appendChild(el("h3", { text: "Words to know" }));
        var wrap = el("div", { class: "stp-vocab" });
        bi.vocab.forEach(function (v) {
          wrap.appendChild(
            el("div", { class: "stp-vocab-card" }, [
              el("b", { text: v.term }),
              el("div", { text: v.definition }),
              v.example ? el("div", { class: "stp-ex", text: "e.g. " + v.example }) : null,
            ]),
          );
        });
        panel.appendChild(wrap);
      }
    }

    // ---- Tab: Walkthrough --------------------------------------------------
    function renderWalk(panel, pack) {
      panel.appendChild(el("h3", { text: "Worked examples" }));
      (pack.walkthrough || []).forEach(function (w) {
        var ol = el("ol", {});
        (w.steps || []).forEach(function (s) {
          ol.appendChild(el("li", { text: s }));
        });
        panel.appendChild(
          el("div", { class: "stp-example" }, [
            el("h4", { text: w.title }),
            ol,
            w.answer ? el("div", { class: "stp-answer", text: "Answer: " + w.answer }) : null,
            w.note ? el("div", { class: "stp-note", text: "💡 " + w.note }) : null,
          ]),
        );
      });
    }

    // ---- Tab: Practice (self-checking, hint ladder) ------------------------
    function renderPractice(panel, pack) {
      panel.appendChild(el("h3", { text: "Practice with hints" }));
      panel.appendChild(
        el("p", {
          class: "stp-game-instructions",
          text: "Try each one. Stuck? Reveal a hint — they build up gently.",
        }),
      );
      (pack.practice || []).forEach(function (p) {
        panel.appendChild(buildPracticeItem(p));
      });
    }

    function buildPracticeItem(p) {
      var box = el("div", { class: "stp-q" });
      box.appendChild(el("div", { class: "stp-qtext", text: p.question }));
      var feedback = el("div", { class: "stp-feedback info", hidden: "hidden" });

      if ((p.choices || []).length) {
        var choices = el("div", { class: "stp-choices" });
        shuffle(p.choices).forEach(function (c) {
          var btn = el("button", {
            class: "stp-choice",
            type: "button",
            text: c,
            onclick: function () {
              if (NTAnswerMatch.isRight(c, p.answer)) {
                btn.className = "stp-choice correct";
                feedback.className = "stp-feedback good";
                feedback.textContent = "✅ " + (p.explanation || "Correct!");
              } else {
                btn.className = "stp-choice wrong";
                feedback.className = "stp-feedback info";
                feedback.textContent = "Not quite — try another, or use a hint.";
              }
              feedback.hidden = false;
            },
          });
          choices.appendChild(btn);
        });
        box.appendChild(choices);
      } else {
        var input = el("input", {
          type: "text",
          placeholder: "Your answer",
          "aria-label": "Your answer",
        });
        var check = el("button", {
          class: "stp-btn ghost",
          type: "button",
          text: "Check",
          onclick: function () {
            if (NTAnswerMatch.isRight(input.value, p.answer)) {
              feedback.className = "stp-feedback good";
              feedback.textContent = "✅ " + (p.explanation || "Correct!");
            } else {
              feedback.className = "stp-feedback info";
              feedback.textContent = "Not yet — check a hint and try again.";
            }
            feedback.hidden = false;
          },
        });
        box.appendChild(el("div", { class: "stp-open-answer" }, [input, check]));
      }

      // Hint ladder — reveal one at a time.
      var hints = p.hints || [];
      if (hints.length) {
        var shown = 0;
        var hintWrap = el("div", { class: "stp-hint-row" });
        var revealBtn = el("button", {
          class: "stp-btn ghost",
          type: "button",
          text: "💡 Show a hint",
          onclick: function () {
            if (shown < hints.length) {
              hintWrap.appendChild(el("div", { class: "stp-hint", text: hints[shown] }));
              shown++;
            }
            if (shown >= hints.length) {
              revealBtn.disabled = true;
              revealBtn.textContent = "No more hints";
            }
          },
        });
        box.appendChild(revealBtn);
        box.appendChild(hintWrap);
      }
      box.appendChild(feedback);
      return box;
    }

    // ---- Tab: Game (match or sort) ----------------------------------------
    function renderGame(panel, pack) {
      var g = pack.game || {};
      panel.appendChild(el("h3", { text: "Practice game" }));
      if (g.instructions)
        panel.appendChild(el("p", { class: "stp-game-instructions", text: g.instructions }));
      if (g.type === "sort" && (g.buckets || []).length) renderSortGame(panel, g);
      else if ((g.pairs || []).length) renderMatchGame(panel, g);
      else
        panel.appendChild(
          el("p", { text: "No game for this pack — try the Practice and Quiz tabs!" }),
        );
    }

    function renderMatchGame(panel, g) {
      var progress = el("div", { class: "stp-progress" });
      panel.appendChild(progress);
      var board = el("div", { class: "stp-match" });
      var leftCol = el("div", { class: "stp-match-col" });
      var rightCol = el("div", { class: "stp-match-col" });
      var total = g.pairs.length;
      var done = 0;
      var selected = null; // {btn, key, side}
      function setProgress() {
        progress.textContent = "Matched " + done + " of " + total;
      }
      function tileClick(btn, key, side) {
        if (btn.classList.contains("matched")) return;
        if (!selected) {
          selected = { btn: btn, key: key, side: side };
          btn.classList.add("selected");
          return;
        }
        if (selected.btn === btn) {
          btn.classList.remove("selected");
          selected = null;
          return;
        }
        if (selected.side === side) {
          selected.btn.classList.remove("selected");
          selected = { btn: btn, key: key, side: side };
          btn.classList.add("selected");
          return;
        }
        if (selected.key === key) {
          selected.btn.className = "stp-tile matched";
          btn.className = "stp-tile matched";
          selected = null;
          done++;
          setProgress();
          if (done === total) {
            panel.appendChild(
              el("div", { class: "stp-celebrate", text: "🎉 You matched them all!" }),
            );
            announce("All matched. Great work!");
          }
        } else {
          var a = selected.btn,
            b = btn;
          a.classList.add("nudge");
          b.classList.add("nudge");
          setTimeout(function () {
            a.classList.remove("nudge", "selected");
            b.classList.remove("nudge");
          }, 320);
          selected = null;
        }
      }
      shuffle(g.pairs).forEach(function (pr, _i) {
        leftCol.appendChild(
          el("button", {
            class: "stp-tile",
            type: "button",
            text: pr.left,
            onclick: function () {
              tileClick(this, "k" + g.pairs.indexOf(pr), "L");
            },
          }),
        );
      });
      shuffle(g.pairs).forEach(function (pr) {
        rightCol.appendChild(
          el("button", {
            class: "stp-tile",
            type: "button",
            text: pr.right,
            onclick: function () {
              tileClick(this, "k" + g.pairs.indexOf(pr), "R");
            },
          }),
        );
      });
      board.appendChild(leftCol);
      board.appendChild(rightCol);
      panel.appendChild(board);
      setProgress();
    }

    function renderSortGame(panel, g) {
      var items = [];
      g.buckets.forEach(function (b, bi) {
        (b.items || []).forEach(function (it) {
          items.push({ text: it, bucket: bi });
        });
      });
      var total = items.length;
      var done = 0;
      var progress = el("div", { class: "stp-progress", text: "Sorted 0 of " + total });
      panel.appendChild(progress);
      var selected = null;

      var pool = el("div", { class: "stp-sort-pool" });
      shuffle(items).forEach(function (it) {
        var t = el("button", { class: "stp-tile", type: "button", text: it.text });
        t.addEventListener("click", function () {
          if (t.classList.contains("matched")) return;
          if (selected) selected.classList.remove("selected");
          if (selected === t) {
            selected = null;
            return;
          }
          selected = t;
          t.classList.add("selected");
        });
        t._bucket = it.bucket;
        pool.appendChild(t);
      });

      var bucketsWrap = el("div", { class: "stp-buckets" });
      g.buckets.forEach(function (b, bi) {
        var drop = el("div", { class: "stp-drop" });
        var bucket = el("div", { class: "stp-bucket" }, [el("h4", { text: b.name }), drop]);
        bucket.addEventListener("click", function () {
          if (!selected) return;
          if (selected._bucket === bi) {
            selected.className = "stp-tile matched";
            drop.appendChild(selected);
            selected = null;
            done++;
            progress.textContent = "Sorted " + done + " of " + total;
            if (done === total) {
              panel.appendChild(el("div", { class: "stp-celebrate", text: "🎉 All sorted!" }));
              announce("All sorted. Nice!");
            }
          } else {
            var s = selected;
            s.classList.add("nudge");
            setTimeout(function () {
              s.classList.remove("nudge", "selected");
            }, 320);
            selected = null;
          }
        });
        bucketsWrap.appendChild(bucket);
      });
      panel.appendChild(pool);
      panel.appendChild(bucketsWrap);
    }

    // ---- Tab: Quiz (mastery check) ----------------------------------------
    function renderQuiz(panel, pack) {
      var quiz = pack.quiz || [];
      panel.appendChild(el("h3", { text: "Quick quiz" }));
      if (!quiz.length) {
        panel.appendChild(el("p", { text: "No quiz for this pack." }));
        return;
      }
      var scoreLine = el("div", { class: "stp-progress" });
      panel.appendChild(scoreLine);
      var answered = 0;
      var correct = 0;
      function updateScore() {
        scoreLine.textContent =
          "Answered " + answered + " of " + quiz.length + " — " + correct + " correct";
      }
      quiz.forEach(function (q) {
        var box = el("div", { class: "stp-q" });
        box.appendChild(el("div", { class: "stp-qtext", text: q.question }));
        var feedback = el("div", { class: "stp-feedback info", hidden: "hidden" });
        var locked = false;
        var choices = el("div", { class: "stp-choices" });
        shuffle(q.choices).forEach(function (c) {
          var btn = el("button", {
            class: "stp-choice",
            type: "button",
            text: c,
            onclick: function () {
              if (locked) return;
              locked = true;
              answered++;
              Array.prototype.forEach.call(choices.children, function (b) {
                b.disabled = true;
              });
              if (NTAnswerMatch.isRight(c, q.answer)) {
                btn.className = "stp-choice correct";
                correct++;
                feedback.className = "stp-feedback good";
                feedback.textContent = "✅ " + (q.explanation || "Correct!");
              } else {
                btn.className = "stp-choice wrong";
                Array.prototype.forEach.call(choices.children, function (b) {
                  if (NTAnswerMatch.isRight(b.textContent, q.answer))
                    b.className = "stp-choice correct";
                });
                feedback.className = "stp-feedback info";
                feedback.textContent = "The answer is highlighted. " + (q.explanation || "");
              }
              feedback.hidden = false;
              updateScore();
            },
          });
          choices.appendChild(btn);
        });
        box.appendChild(choices);
        box.appendChild(feedback);
        panel.appendChild(box);
      });
      updateScore();
    }

    // ---- Tab: Listen (Web Speech read-aloud) ------------------------------
    var speaking = false;
    function stopSpeech() {
      if (global.speechSynthesis) {
        try {
          global.speechSynthesis.cancel();
        } catch (_e) {
          /* ignore */
        }
      }
      speaking = false;
    }
    function buildTranscript(pack) {
      var lines = [];
      lines.push("Here are the big ideas.");
      (pack.bigIdeas && pack.bigIdeas.summary ? pack.bigIdeas.summary : []).forEach(function (s) {
        lines.push(s);
      });
      if (pack.bigIdeas && (pack.bigIdeas.vocab || []).length) {
        lines.push("Now some key words.");
        pack.bigIdeas.vocab.forEach(function (v) {
          lines.push(v.term + ". " + v.definition);
        });
      }
      (pack.walkthrough || []).forEach(function (w) {
        lines.push("Example: " + w.title + ".");
        (w.steps || []).forEach(function (s) {
          lines.push(s);
        });
        if (w.answer) lines.push("The answer is " + w.answer + ".");
      });
      lines.push("That's your overview. You've got this!");
      return lines.filter(Boolean);
    }
    // Strip LaTeX delimiters so the voice reads cleanly.
    function speakable(text) {
      return String(text)
        .replace(/\\\(|\\\)|\\\[|\\\]/g, " ")
        .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1 over $2")
        .replace(/\\times/g, " times ")
        .replace(/\\div/g, " divided by ")
        .replace(/\\[a-zA-Z]+/g, " ")
        .replace(/[{}$]/g, " ");
    }
    // Pick two distinct voices for the two podcast hosts (best-effort).
    function pickVoices() {
      var vs = [];
      try {
        vs = global.speechSynthesis.getVoices() || [];
      } catch (_e) {
        vs = [];
      }
      var en = vs.filter(function (v) {
        return /^en/i.test(v.lang || "");
      });
      var pool = en.length ? en : vs;
      return [pool[0] || null, pool[1] || pool[0] || null];
    }

    // Generic sequential player. items -> {text, voice}; highlights paras[i].
    // btns are the play buttons (disabled while speaking); stopBtn is enabled
    // only while speaking, so the student can always interrupt read-aloud.
    function playSequence(items, paras, onDone, btns, stopBtn) {
      if (!global.speechSynthesis) return;
      stopSpeech();
      speaking = true;
      btns.forEach(function (b) {
        b.disabled = true;
      });
      if (stopBtn) stopBtn.disabled = false;
      var i = 0;
      function highlight(k) {
        paras.forEach(function (p, j) {
          p.className = j === k ? "speaking" : "";
        });
        if (paras[k]) paras[k].scrollIntoView({ block: "nearest" });
      }
      function next() {
        if (!speaking || i >= items.length) {
          highlight(-1);
          btns.forEach(function (b) {
            b.disabled = false;
          });
          if (stopBtn) stopBtn.disabled = true;
          speaking = false;
          if (onDone) onDone();
          return;
        }
        highlight(i);
        var u = new global.SpeechSynthesisUtterance(speakable(items[i].text));
        u.rate = 0.98;
        if (items[i].voice) u.voice = items[i].voice;
        u.onend = function () {
          i++;
          next();
        };
        u.onerror = function () {
          i++;
          next();
        };
        global.speechSynthesis.speak(u);
      }
      next();
    }

    function renderListen(panel, pack, notes) {
      panel.appendChild(el("h3", { text: "🎧 Listen to your notes" }));
      if (!global.speechSynthesis) {
        panel.appendChild(
          el("p", {
            text: "Audio isn't available in this browser, but you can read the overview below.",
          }),
        );
      }
      var stopBtn = el("button", {
        class: "stp-btn ghost",
        type: "button",
        text: "■ Stop",
        disabled: "disabled",
      });
      var overviewBtn = el("button", {
        class: "stp-btn solid",
        type: "button",
        text: "▶ Play overview",
      });
      var controls = [overviewBtn];

      // Simple single-voice overview of the pack.
      var lines = buildTranscript(pack);
      var transcript = el("div", { class: "stp-listen-transcript" });
      var paras = lines.map(function (t) {
        var p = el("p", { text: t });
        transcript.appendChild(p);
        return p;
      });
      overviewBtn.addEventListener("click", function () {
        var items = lines.map(function (t) {
          return { text: t, voice: null };
        });
        playSequence(items, paras, null, [overviewBtn, podcastBtn], stopBtn);
      });

      // 2-host podcast overview (lazy-generated once, then cached on the pack).
      var podcastBtn = el("button", {
        class: "stp-btn solid",
        type: "button",
        text: "🎙️ Podcast (2 hosts)",
        hidden: canAudio ? null : "hidden",
      });
      if (canAudio) controls.push(podcastBtn);
      controls.push(stopBtn);

      function playPodcast(script) {
        clear(transcript);
        var voices = pickVoices();
        var pParas = script.map(function (turn) {
          var name = turn.speaker === "B" ? "Maya" : "Leo";
          var p = el("p", {}, [
            el("strong", { text: name + ": " }),
            document.createTextNode(turn.text),
          ]);
          transcript.appendChild(p);
          return p;
        });
        var items = script.map(function (turn) {
          return { text: turn.text, voice: turn.speaker === "B" ? voices[1] : voices[0] };
        });
        playSequence(items, pParas, null, [overviewBtn, podcastBtn], stopBtn);
      }
      podcastBtn.addEventListener("click", function () {
        if (pack.__audioScript) {
          playPodcast(pack.__audioScript);
          return;
        }
        stopSpeech();
        podcastBtn.disabled = true;
        podcastBtn.textContent = "🎙️ Writing the episode…";
        Promise.resolve()
          .then(function () {
            return opts.audio(notes);
          })
          .then(function (script) {
            podcastBtn.disabled = false;
            podcastBtn.textContent = "🎙️ Podcast (2 hosts)";
            if (!script || !script.length) throw new Error("empty");
            pack.__audioScript = script;
            playPodcast(script);
          })
          .catch(function () {
            podcastBtn.disabled = false;
            podcastBtn.textContent = "🎙️ Podcast (2 hosts)";
            announce("Couldn't make the podcast right now.");
          });
      });

      stopBtn.addEventListener("click", function () {
        stopSpeech();
        stopBtn.disabled = true;
        [].forEach.call(transcript.querySelectorAll("p"), function (p) {
          p.className = "";
        });
        [overviewBtn, podcastBtn].forEach(function (b) {
          b.disabled = false;
        });
      });

      panel.appendChild(el("div", { class: "stp-listen-controls" }, controls));
      panel.appendChild(transcript);
    }

    // ---- Tab: Ask (grounded chat) -----------------------------------------
    function renderAsk(panel, _pack, notes) {
      panel.appendChild(el("h3", { text: "💬 Ask about your notes" }));
      panel.appendChild(
        el("p", {
          class: "stp-game-instructions",
          text: "Ask anything about these notes — I'll answer using only what you pasted.",
        }),
      );
      var log = el("div", { class: "stp-ask-log" });
      panel.appendChild(log);
      var input = el("input", {
        type: "text",
        placeholder: "Type your question…",
        "aria-label": "Your question",
      });
      var sendBtn = el("button", { class: "stp-btn solid", type: "button", text: "Send" });
      var form = el("div", { class: "stp-ask-form" }, [input, sendBtn]);
      panel.appendChild(form);

      function addBubble(cls, text) {
        var b = el("div", { class: "stp-bubble " + cls, text: text });
        log.appendChild(b);
        log.scrollTop = log.scrollHeight;
        return b;
      }
      function send() {
        var q = input.value.trim();
        if (!q) return;
        input.value = "";
        addBubble("user", q);
        var thinking = addBubble("bot", "…");
        sendBtn.disabled = true;
        Promise.resolve()
          .then(function () {
            return opts.ask(notes, q);
          })
          .then(function (reply) {
            thinking.textContent = reply || "I couldn't find that in your notes.";
            mathify(thinking);
          })
          .catch(function () {
            thinking.textContent = "Sorry — I couldn't answer just now. Try again in a moment.";
          })
          .then(function () {
            sendBtn.disabled = false;
          });
      }
      sendBtn.addEventListener("click", send);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") send();
      });
    }

    // Public instance API
    return {
      reset: renderIntake,
      open: function (pack, notes) {
        renderPack(pack, notes || "");
      },
    };
  }

  global.StudyPack = { mount: mount, version: "1.0.0" };
})(typeof window !== "undefined" ? window : this);
