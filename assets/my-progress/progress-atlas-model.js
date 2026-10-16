/* ==========================================================================
 * progress-atlas-model.js — the Learning Atlas's pure logic. No DOM, no
 * fetch, no globals read except the injected answer matcher.
 *
 *   graph    the Grade 6 standards, in the order the CLASS learns them, joined
 *            to the plain-language words in data/atlas-student-why.json
 *   state    not yet / revisit / growing / solid / owned, per standard, from the
 *            SAME evidence rows My Progress already shows (NTProgressStores
 *            .skillRows: MIN_ATTEMPTS = 3, solid >= 80%, growing >= 50%) plus
 *            the proofs in progress-atlas-store.js (nt-atlas:v1)
 *   check    three questions from data/retrieval-bank.json; the answer matcher
 *            is engine/core/answer-match.js (progress-atlas-match.js)
 *   growth   what moved since the student last looked, never raw accuracy
 *
 * "Owned" is earned by a passing check AND a passing re-check at least seven
 * days later. It is never a grade: nothing here counts misses against anyone.
 * ========================================================================== */
(function (root) {
  "use strict";

  var ST = root.NTAtlasStore;
  if (!ST) return;
  var DAY = ST.DAY;
  var CHECK_SIZE = ST.CHECK_SIZE;
  var PASS_MIN = 3;
  var RECHECK_DAYS = 7;
  var MAX_CHECKS = 6;
  var MAX_SEEN = 16;
  // The window NTSignal calls "recent" (assets/nt-signal.js ROLLING_MS) and the
  // point where My Progress's own `when()` stops saying "N days ago".
  var REVISIT_DAYS = 14;
  var GROWTH_DAYS = 7;
  var STATES = ["notyet", "revisit", "growing", "solid", "owned"];
  var UNIT_LABELS = {
    PRE: { en: "Pre-Unit", es: "Unidad previa" },
  };

  function rank(state) {
    return STATES.indexOf(state);
  }
  /* ---------------------------------------------------------------- graph */

  function unitLabel(key) {
    if (UNIT_LABELS[key]) return UNIT_LABELS[key];
    var n = /^U(\d+)$/.exec(key || "");
    return n ? { en: "Unit " + n[1], es: "Unidad " + n[1] } : { en: key || "", es: key || "" };
  }

  /**
   * Nodes in class order, edges with their student words, and the unit columns.
   * `sequence` is data/retrieval-bank.json's district-ordered lesson list. A
   * node no lesson names directly (6.NOS.6b, 6.DS.6) sits beside its parent or
   * just ahead of its first child, so it lands where it is taught.
   */
  function buildGraph(prereq, words, sequence) {
    var wordNodes = (words && words.nodes) || {};
    var wordEdges = {};
    ((words && words.edges) || []).forEach(function (e) {
      wordEdges[e.from + ">" + e.to] = e;
    });
    var seq = Array.isArray(sequence) ? sequence : [];
    var first = {};
    seq.forEach(function (l, i) {
      if (l && l.standard && first[l.standard] == null) first[l.standard] = i;
    });

    var codes = [];
    var edges = (prereq.edges || []).map(function (e) {
      [e.from, e.to].forEach(function (c) {
        if (codes.indexOf(c) < 0) codes.push(c);
      });
      var w = wordEdges[e.from + ">" + e.to] || {};
      return {
        from: e.from,
        to: e.to,
        strength: e.strength,
        en: w.en || "",
        es: w.es || "",
      };
    });

    function baseOf(c) {
      return c.replace(/[a-z]$/, "");
    }
    function indexOf(c) {
      if (first[c] != null) return first[c];
      var b = baseOf(c);
      if (b !== c) return indexOf(b) + 0.25;
      var kids = codes.filter(function (k) {
        return k !== c && baseOf(k) === c && first[k] != null;
      });
      if (!kids.length) return seq.length;
      return (
        Math.min.apply(
          null,
          kids.map(function (k) {
            return first[k];
          }),
        ) - 0.5
      );
    }

    var nodes = codes
      .map(function (c) {
        var w = wordNodes[c] || {};
        var at = indexOf(c);
        var entry = seq[Math.max(0, Math.min(seq.length - 1, Math.floor(at)))];
        return {
          code: c,
          en: w.en || c,
          es: w.es || w.en || c,
          at: at,
          unit: entry ? entry.unit : "",
          col: 0,
          row: 0,
          order: 0,
          prereqs: [],
          leads: [],
        };
      })
      .sort(function (a, b) {
        return a.at - b.at || a.code.localeCompare(b.code, undefined, { numeric: true });
      });

    var units = [];
    nodes.forEach(function (n) {
      if (units.indexOf(n.unit) < 0) units.push(n.unit);
    });
    var rows = {};
    var byCode = {};
    nodes.forEach(function (n, i) {
      n.col = units.indexOf(n.unit);
      n.row = rows[n.col] || 0;
      rows[n.col] = n.row + 1;
      n.order = i;
      byCode[n.code] = n;
    });
    edges.forEach(function (e) {
      if (byCode[e.to]) byCode[e.to].prereqs.push(e);
      if (byCode[e.from]) byCode[e.from].leads.push(e);
    });
    return {
      nodes: nodes,
      byCode: byCode,
      edges: edges,
      units: units.map(function (u) {
        return { key: u, en: unitLabel(u).en, es: unitLabel(u).es };
      }),
      maxRows: Math.max.apply(
        null,
        [1].concat(
          Object.keys(rows).map(function (k) {
            return rows[k];
          }),
        ),
      ),
    };
  }

  /* ---------------------------------------------------------------- state */

  /**
   * One node's state. `row` is the NTProgressStores skill row (or null when the
   * student has fewer than MIN_ATTEMPTS tries), `rec` its nt-atlas:v1 record.
   */
  function nodeStatus(row, rec, bankCount, now) {
    var r = rec || ST.cleanNode({});
    var lastTs = Math.max(row ? row.lastTs : 0, r.l);
    var state = r.o ? "owned" : row ? row.band : r.p ? "growing" : "notyet";
    var stale = state !== "notyet" && lastTs > 0 && now - lastTs >= REVISIT_DAYS * DAY;
    var due = state === "revisit" || stale;
    var phase = "none";
    if (r.o) phase = "owned";
    else if (bankCount >= CHECK_SIZE)
      phase = !r.p ? "challenge" : now >= r.p + RECHECK_DAYS * DAY ? "recheck" : "wait";
    return {
      state: state,
      rank: rank(state),
      due: due,
      dueReason: !due ? "" : state === "revisit" ? "band" : "time",
      lastTs: lastTs,
      daysSince: lastTs ? Math.floor((now - lastTs) / DAY) : null,
      attempts: row ? row.attempts : 0,
      proved: !!r.p,
      passedAt: r.p,
      ownedAt: r.o,
      phase: phase,
      readyAt: r.p ? r.p + RECHECK_DAYS * DAY : 0,
    };
  }

  /** Every node of the graph with its status; `rows` come from skillRows(). */
  function statusAll(graph, rows, store, bankCounts, now) {
    var byRow = {};
    (rows || []).forEach(function (r) {
      byRow[r.code] = r;
    });
    return graph.nodes.map(function (n) {
      var st = nodeStatus(
        byRow[n.code] || null,
        store.nodes[n.code],
        (bankCounts || {})[n.code] || 0,
        now,
      );
      st.node = n;
      return st;
    });
  }

  /* --------------------------------------------------------------- growth */

  /**
   * What grew since about a week ago: skills that moved up a state, skills
   * started, skills owned, and proofs taken. Compares to the earliest snapshot
   * from an earlier day inside the window, else the latest one up to a week
   * older; with neither it says `null` rather than inventing a baseline.
   */
  function growth(store, statuses, now) {
    var cutoff = now - GROWTH_DAYS * DAY;
    var today = Math.floor(now / DAY);
    var inside = store.snaps.filter(function (s) {
      return s.at >= cutoff && Math.floor(s.at / DAY) !== today;
    });
    var older = store.snaps.filter(function (s) {
      return s.at < cutoff && s.at >= cutoff - GROWTH_DAYS * DAY;
    });
    var base = inside[0] || older[older.length - 1] || null;
    var practiced = statuses.filter(function (s) {
      return s.lastTs >= cutoff;
    }).length;
    var proofs = 0;
    Object.keys(store.nodes).forEach(function (c) {
      store.nodes[c].c.forEach(function (k) {
        if (k.at >= cutoff && k.s >= PASS_MIN) proofs += 1;
      });
    });
    var out = {
      since: base ? base.at : null,
      grown: null,
      started: 0,
      up: 0,
      owned: 0,
      practiced: practiced,
      proofs: proofs,
      codes: [],
    };
    if (!base) return out;
    out.grown = 0;
    statuses.forEach(function (s) {
      var before = base.r[s.node.code] || 0;
      if (s.rank <= before) return;
      out.grown += 1;
      out.codes.push(s.node.code);
      if (s.rank === 4) out.owned += 1;
      else if (before === 0) out.started += 1;
      else out.up += 1;
    });
    return out;
  }

  /** The one place to point a student next: a ready re-check, then a skill that is due, then the first open one. */
  function nextUp(graph, statuses) {
    var pick = function (fn) {
      return statuses.filter(fn)[0] || null;
    };
    var hit = pick(function (s) {
      return s.phase === "recheck";
    });
    if (hit) return { status: hit, why: "recheck" };
    hit = pick(function (s) {
      return s.state === "revisit";
    });
    if (hit) return { status: hit, why: "revisit" };
    var stale = statuses
      .filter(function (s) {
        return s.due;
      })
      .sort(function (a, b) {
        return a.lastTs - b.lastTs;
      })[0];
    if (stale) return { status: stale, why: "time" };
    hit = pick(function (s) {
      return (
        s.state === "notyet" &&
        s.node.prereqs.every(function (e) {
          var p = statuses[graph.byCode[e.from].order];
          return p.rank >= 2;
        })
      );
    });
    if (hit) return { status: hit, why: "start" };
    hit = pick(function (s) {
      return s.state === "growing";
    });
    return hit ? { status: hit, why: "growing" } : null;
  }

  /* --------------------------------------------------------------- checks */

  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function itemId(item) {
    return hash(String(item.stem) + "|" + String(item.choices[item.correctIndex]));
  }

  // A stem that asks for a FORM ("simplest form", "as a fraction"), a CHOICE
  // ("which ...") or a MEANING ("what does the 30 mean") cannot be answered by
  // typing a bare value: the matcher credits equal values, and the form, the
  // choice or the meaning is the point.
  var NEEDS_CHOICES =
    /\b(which|choose|select|following|simplest|lowest terms|simplif\w*|equivalent|as a (fraction|decimal|percent|mixed|ratio)|form|mean|means|represent\w*|explain|why|describe|best|error|mistake|true|false)\b/i;

  /**
   * Typed only when the right answer is a bare number with at most a short unit
   * ("156 boxes", "$12.50", "3/4"), no wrong choice has the same value (240
   * cubic inches vs 240 square inches), and the stem asks for a value.
   */
  function isTyped(item, matcher) {
    var m = matcher || root.NTAnswerMatch;
    if (!m || NEEDS_CHOICES.test(item.stem)) return false;
    var correct = String(item.choices[item.correctIndex]);
    var value = m.numericValue(correct);
    // A fraction is a FORM (17/5 and 34/10 are equal values): choices keep it honest.
    if (value == null || correct.indexOf("/") >= 0 || correct.trim().split(/\s+/).length > 3)
      return false;
    return item.choices.every(function (c, i) {
      return i === item.correctIndex || m.numericValue(String(c)) !== value;
    });
  }

  /** Three questions, unseen ones first, different lessons first. Deterministic. */
  function pickItems(items, rec) {
    var seen = (rec && rec.seen) || [];
    var pool = (items || []).filter(function (it) {
      return (
        it &&
        Array.isArray(it.choices) &&
        it.choices.length >= 3 &&
        it.correctIndex >= 0 &&
        it.correctIndex < it.choices.length
      );
    });
    var fresh = pool.filter(function (it) {
      return seen.indexOf(itemId(it)) < 0;
    });
    var stale = pool
      .filter(function (it) {
        return seen.indexOf(itemId(it)) >= 0;
      })
      .sort(function (a, b) {
        return seen.indexOf(itemId(a)) - seen.indexOf(itemId(b));
      });
    var turn = rec && rec.c ? rec.c.length : 0;
    var rotated = fresh.length
      ? fresh.slice(turn % fresh.length).concat(fresh.slice(0, turn % fresh.length))
      : [];
    var picked = [];
    // Unseen questions first; within a list, one per lesson before any repeats.
    [rotated, stale].forEach(function (list) {
      var lessons = {};
      list.forEach(function (it) {
        if (picked.length < CHECK_SIZE && !lessons[it.lesson]) {
          lessons[it.lesson] = 1;
          picked.push(it);
        }
      });
      list.forEach(function (it) {
        if (picked.length < CHECK_SIZE && picked.indexOf(it) < 0) picked.push(it);
      });
    });
    return picked.map(function (it) {
      return {
        id: itemId(it),
        lesson: it.lesson,
        stem: it.stem,
        choices: it.choices,
        correctIndex: it.correctIndex,
        explanation: it.explanation || "",
        typed: isTyped(it),
      };
    });
  }

  /** answer: { index } for a choice, { text } for a typed value. */
  function judge(item, answer, matcher) {
    var m = matcher || root.NTAnswerMatch;
    if (item.typed)
      return (
        !!m &&
        !!answer &&
        m.isRight(String(answer.text == null ? "" : answer.text), item.choices[item.correctIndex])
      );
    return !!answer && answer.index === item.correctIndex;
  }

  /**
   * Fold a finished check into the store. `kind` is "c" (first proof) or "r"
   * (re-check). Ownership needs a passing "r" at least RECHECK_DAYS after the
   * passing "c" — enforced here, not in the interface. Returns the new store
   * and what happened: "passed" | "owned" | "notyet".
   */
  function applyCheck(store, code, kind, score, itemIds, now) {
    var s = ST.sanitize(JSON.parse(JSON.stringify(store)));
    if (!ST.validCode(code)) return { store: s, outcome: "notyet" };
    var rec = s.nodes[code] || ST.cleanNode({});
    var pass = score >= PASS_MIN;
    var outcome = "notyet";
    rec.l = now;
    rec.c.push({ at: now, k: kind, s: Math.min(CHECK_SIZE, Math.max(0, score)), n: CHECK_SIZE });
    rec.c = rec.c.slice(-MAX_CHECKS);
    rec.seen = rec.seen.concat(itemIds).slice(-MAX_SEEN);
    if (kind === "c" && pass && !rec.p) {
      rec.p = now;
      outcome = "passed";
    } else if (kind === "r" && pass && rec.p && !rec.o && now >= rec.p + RECHECK_DAYS * DAY) {
      rec.o = now;
      outcome = "owned";
    }
    s.nodes[code] = rec;
    return { store: s, outcome: outcome };
  }

  root.NTAtlasModel = {
    DAY: DAY,
    CHECK_SIZE: CHECK_SIZE,
    PASS_MIN: PASS_MIN,
    RECHECK_DAYS: RECHECK_DAYS,
    REVISIT_DAYS: REVISIT_DAYS,
    GROWTH_DAYS: GROWTH_DAYS,
    STATES: STATES,
    buildGraph: buildGraph,
    nodeStatus: nodeStatus,
    statusAll: statusAll,
    growth: growth,
    nextUp: nextUp,
    isTyped: isTyped,
    pickItems: pickItems,
    judge: judge,
    applyCheck: applyCheck,
  };
})(typeof window !== "undefined" ? window : globalThis);
