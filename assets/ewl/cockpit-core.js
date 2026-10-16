/* EWL.Cockpit (logic) — the pure half of "Today's Mission" and the Check Yourself router. No DOM in this file.
 *
 * The cockpit (cockpit.js) and the diagnostic screen (cockpit-check.js) call these; tools/ewl-cockpit.test.mjs proves them.
 *
 *   C.taughtLessons(manifest)            -> lessons of Units 1-9 (Unit 10 is not taught), in book order
 *   C.pacingLesson(plan, todayIso)       -> the lesson the district pacing plan puts on or after today (same rule the hub's
 *                                           "This week in class" card uses), or null
 *   C.defaultLesson({lessons, stored, plan, today}) -> lesson id
 *   C.stageLinks(entry, integration)     -> what each of the four stages offers for this lesson
 *   C.stageStates(store, id, current)    -> [{stage, done, current}]
 *   C.studioGenIds(studioData)           -> generator ids a lesson's Practice Studio uses ("fresh" slots)
 *   C.checkPlan({lesson, genIds, code, levels}) -> three {gen, level, seed} specs, same code = same specs
 *   C.buildItems(G, plan)                -> up to three verified StudioGen items (key agrees with the independent check)
 *   C.grade(G, item, response)           -> {ok, tag}
 *   C.newRun(items) / C.answer(run, i, graded) / C.reveal(run, i) / C.summarize(run)  -> the item state machine
 *   C.repairChips(ctx)                   -> links to existing help for a misconception tag
 *   C.tagLabel(tag)                      -> readable name for a misconception tag
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var C = (EWL.Cockpit = EWL.Cockpit || {});

  var STAGES = ["curious", "notes", "lab", "check"];
  var LESSON_RE = /^[1-9]\d?-\d{1,2}$/;
  var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var SCENE_RE = /^[a-z0-9][a-z0-9_-]{0,48}$/i;
  var MAX_UNIT = 9;

  /* ---------- lessons ---------- */
  function taughtLessons(manifest) {
    var all = (manifest && manifest.lessons) || [];
    return all
      .filter(function (l) {
        return (
          l &&
          LESSON_RE.test(String(l.id)) &&
          l.unit >= 1 &&
          l.unit <= MAX_UNIT &&
          String(l.id).split("-")[0] === String(l.unit) &&
          l.resources
        );
      })
      .sort(function (a, b) {
        return a.unit - b.unit || a.lesson - b.lesson;
      });
  }
  function unitsOf(lessons) {
    var out = [];
    lessons.forEach(function (l) {
      var u = out[out.length - 1];
      if (!u || u.unit !== l.unit) out.push((u = { unit: l.unit, lessons: [] }));
      u.lessons.push(l);
    });
    return out;
  }
  /** plan.days rows are [date, unit, dayType, lessonId, detail]; a catch-up id maps to its base lesson. */
  function pacingLesson(plan, today) {
    var days = (plan && plan.days) || [];
    for (var i = 0; i < days.length; i++) {
      if (days[i][0] >= today && days[i][3]) return String(days[i][3]).replace(/-catchup$/, "");
    }
    return null;
  }
  function defaultLesson(o) {
    var ids = {};
    o.lessons.forEach(function (l) {
      ids[l.id] = true;
    });
    if (o.stored && ids[o.stored]) return o.stored;
    var p = pacingLesson(o.plan, o.today);
    if (p && ids[p]) return p;
    return o.lessons.length ? o.lessons[0].id : null;
  }

  /* ---------- paths ---------- */
  function safePath(p) {
    if (typeof p !== "string" || p.charAt(0) !== "/" || p.charAt(1) === "/") return null;
    if (/[\\\u0000-\u001f]/.test(p)) return null;
    return p;
  }
  /** Same "student view" switch the existing student launch playlist adds. Keeps any #fragment. */
  function withStudent(path) {
    var p = safePath(path);
    if (!p) return null;
    var hash = "";
    var i = p.indexOf("#");
    if (i >= 0) {
      hash = p.slice(i);
      p = p.slice(0, i);
    }
    return p + (p.indexOf("?") >= 0 ? "&" : "?") + "student=1" + hash;
  }
  function q(params) {
    return Object.keys(params)
      .filter(function (k) {
        return params[k];
      })
      .map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      })
      .join("&");
  }

  /* ---------- the four stages ---------- */
  function link(href, en, es) {
    return href ? { href: href, label: en, labelEs: es || en } : null;
  }
  function stageLinks(entry, integ) {
    var id = entry.id;
    var r = entry.resources || {};
    var m = integ && integ.lessons && integ.lessons[id];
    m = m && typeof m === "object" ? m : {};
    var curious = [
      link(withStudent(r.lesson || "/lessons/" + id + "/"), "Open the lesson", "Abrir la lección"),
    ];
    var notes = [link(withStudent(r.guidedNotes), "Open guided notes", "Abrir las notas guiadas")];
    if (m.notesStudio === true)
      notes.push(
        link("/curriculum/notes-studio/?" + q({ lesson: id }), "Notes Studio", "Estudio de notas"),
      );
    var lab = [];
    var slug =
      typeof m.learningLab === "string" && SLUG_RE.test(m.learningLab) ? m.learningLab : null;
    var labPath = slug ? "/curriculum/learning-labs/" + slug + "/" : r.learningLab;
    lab.push(link(withStudent(labPath), "Open the learning lab", "Abrir el laboratorio"));
    var scene = Array.isArray(m.canvas)
      ? m.canvas.filter((s) => SCENE_RE.test(String(s)))[0]
      : null;
    if (scene)
      lab.push(
        link(
          "/curriculum/math-canvas/?" + q({ scene: scene, lesson: id }),
          "Living Math Canvas",
          "Lienzo matemático vivo",
        ),
      );
    var inv = Array.isArray(m.lab) ? m.lab.filter((s) => SCENE_RE.test(String(s)))[0] : null;
    if (inv)
      lab.push(
        link(
          "/curriculum/reality-lab/?" + q({ inv: inv, lesson: id }),
          "Math Reality Lab",
          "Laboratorio de realidad matemática",
        ),
      );
    var exit = [link(withStudent(r.exitTicket), "Exit ticket", "Boleto de salida")];
    function clean(a) {
      return a.filter(Boolean);
    }
    return { curious: clean(curious), notes: clean(notes), lab: clean(lab), check: clean(exit) };
  }
  function stageStates(store, id, current) {
    var done = store.stagesDone(id);
    return STAGES.map(function (s) {
      return { stage: s, done: done.indexOf(s) >= 0, current: s === current };
    });
  }

  /* ---------- Check Yourself: plan, items, grading, state machine ---------- */
  function studioGenIds(data) {
    var found = [];
    (function walk(o) {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === "object") {
        if (o.k === "gen" && typeof o.g === "string" && found.indexOf(o.g) < 0) found.push(o.g);
        Object.keys(o).forEach(function (k) {
          walk(o[k]);
        });
      }
    })(data && data.fresh);
    return found;
  }
  /** Same lesson + same class code -> the same three specs on every device. */
  function checkPlan(o) {
    var ids = o.genIds || [];
    if (!ids.length) return [];
    var levels = o.levels || [1, 2, 2];
    var rng = EWL.rng(EWL.hash(o.lesson + "|" + o.code));
    var offset = rng.int(0, ids.length - 1);
    return levels.map(function (level, i) {
      return { gen: ids[(offset + i) % ids.length], level: level, seed: "c" + rng.int(1, 999999) };
    });
  }
  /** Items whose key disagrees with StudioGen's independent check() are dropped, never shown. */
  function buildItems(G, plan) {
    var out = [];
    var seen = {};
    plan.forEach(function (spec) {
      for (var tries = 0; tries < 8; tries++) {
        var seed = tries ? spec.seed + "r" + tries : spec.seed;
        var item;
        try {
          item = G.make(spec.gen, spec.level, seed);
          if (G.verify(item) !== true) continue;
        } catch (_e) {
          continue;
        }
        if (seen[item.q]) continue;
        seen[item.q] = true;
        out.push(item);
        return;
      }
    });
    return out;
  }
  function grade(G, item, response) {
    if (item.k === "num") {
      var v = G.value(response);
      var want = G.value(item.a);
      var tol = item.tol == null ? 0.005 : item.tol;
      if (!isFinite(v)) return { ok: false, tag: "unreadable-answer", blank: true };
      if (Math.abs(v - want) <= tol) return { ok: true, tag: "" };
      var hit = (item.fw || []).filter(function (w) {
        return Math.abs(G.value(w.v) - v) <= tol;
      })[0];
      return { ok: false, tag: (hit && hit.tag) || "slip" };
    }
    var i = response === "" || response == null ? NaN : Number(response);
    if (!Number.isInteger(i) || i < 0 || i >= item.c.length)
      return { ok: false, tag: "", blank: true };
    return i === item.a
      ? { ok: true, tag: "" }
      : { ok: false, tag: (item.tag && item.tag[i]) || "slip" };
  }
  function newRun(items) {
    return {
      items: items,
      state: items.map(function () {
        return { wrong: 0, tags: [], status: "open" };
      }),
    };
  }
  /** status: open -> clean (right first try) | retried (right after a miss) | revealed (student asked for the checked result). */
  function answer(run, i, graded) {
    var s = run.state[i];
    if (s.status !== "open" || graded.blank) return s;
    if (graded.ok) s.status = s.wrong ? "retried" : "clean";
    else {
      s.wrong += 1;
      if (graded.tag) s.tags.push(graded.tag);
    }
    return s;
  }
  function canReveal(run, i) {
    return run.state[i].status === "open" && run.state[i].wrong >= 2;
  }
  function reveal(run, i) {
    if (!canReveal(run, i)) return false;
    run.state[i].status = "revealed";
    return true;
  }
  function summarize(run) {
    var counts = { clean: 0, retried: 0, revealed: 0, open: 0 };
    var tally = {};
    var order = [];
    run.state.forEach(function (s) {
      counts[s.status] += 1;
      if (s.status === "clean") return;
      s.tags.forEach(function (t) {
        if (t === "slip") return;
        if (!tally[t]) {
          tally[t] = 0;
          order.push(t);
        }
        tally[t] += 1;
      });
    });
    var top = order.sort(function (a, b) {
      return tally[b] - tally[a];
    })[0];
    var status = counts.revealed ? "repair" : counts.retried ? "unsure" : "ok";
    return { status: status, repairTag: status === "ok" ? null : top || null, counts: counts };
  }

  /* ---------- repair chips ---------- */
  var VISUAL_TAG =
    /graph|plot|table|chart|number-line|numberline|picture|diagram|figure|axis|axes|scale|quadrant|read/;
  var WORDS_TAG =
    /mixup|mix-up|confus|swap|invert|flip|order|label|unit|term|name|word|sign|symbol/;
  /** "ratio-inverted" -> "ratio inverted" */
  function tagLabel(tag) {
    return String(tag || "")
      .replace(/[^a-z0-9]+/gi, " ")
      .trim();
  }
  /**
   * ctx: {id, tag, integ, hasReference, hasStudio, hasHelp, labPath}. Returns chips best-first for this kind of mistake.
   * Every chip is either a same-site path or a drawer action, so the student never leaves the mission mid-task by surprise.
   */
  function repairChips(ctx) {
    var id = ctx.id;
    var m = (ctx.integ && ctx.integ.lessons && ctx.integ.lessons[id]) || {};
    var chips = {};
    if (ctx.hasHelp !== false)
      chips.help = {
        kind: "help",
        href: "/curriculum/extra-help/#lesson-" + id,
        label: "Extra Help for this lesson",
        labelEs: "Ayuda extra para esta lección",
      };
    if (ctx.hasReference)
      chips.reference = {
        kind: "reference",
        lesson: id,
        label: "Pocket Reference words",
        labelEs: "Palabras de la Guía de bolsillo",
      };
    if (ctx.labPath && safePath(ctx.labPath))
      chips.lab = {
        kind: "lab",
        href: withStudent(ctx.labPath),
        label: "Learning lab",
        labelEs: "Laboratorio de aprendizaje",
      };
    if (ctx.hasStudio)
      chips.practice = {
        kind: "practice",
        href: "/math/practice-studio/" + id + "/",
        label: "Practice Studio",
        labelEs: "Estudio de práctica",
      };
    var scene = Array.isArray(m.canvas)
      ? m.canvas.filter((s) => SCENE_RE.test(String(s)))[0]
      : null;
    if (scene)
      chips.canvas = {
        kind: "canvas",
        href: "/curriculum/math-canvas/?" + q({ scene: scene, lesson: id }),
        label: "Living Math Canvas",
        labelEs: "Lienzo matemático vivo",
      };
    var inv = Array.isArray(m.lab) ? m.lab.filter((s) => SCENE_RE.test(String(s)))[0] : null;
    if (inv)
      chips.reality = {
        kind: "reality",
        href: "/curriculum/reality-lab/?" + q({ inv: inv, lesson: id }),
        label: "Math Reality Lab",
        labelEs: "Laboratorio de realidad matemática",
      };
    var t = String(ctx.tag || "");
    var order = VISUAL_TAG.test(t)
      ? ["canvas", "lab", "reality", "practice", "reference", "help"]
      : WORDS_TAG.test(t)
        ? ["reference", "help", "practice", "lab", "canvas", "reality"]
        : ["help", "practice", "reference", "lab", "canvas", "reality"];
    return order
      .filter(function (k) {
        return chips[k];
      })
      .map(function (k) {
        return chips[k];
      });
  }

  /* ---------- Unit 0 Math Mentor Thinking Moves & Prerequisite Readiness Bridge ---------- */
  var MENTOR_MOVES = {
    noticing: {
      labEn: "The Noticing Lab",
      labEs: "El laboratorio de observación",
      moveEn: "Pause before calculating: what two quantities change together here?",
      moveEs: "Haz una pausa antes de calcular: ¿qué dos cantidades cambian juntas aquí?",
    },
    balance: {
      labEn: "The Balance Studio",
      labEs: "El estudio del equilibrio",
      moveEn: "Ask: what stays equal when I transform both sides or parts?",
      moveEs: "Pregúntate: ¿qué se mantiene igual cuando transformo ambos lados o partes?",
    },
    drawing: {
      labEn: "The Drawing Board",
      labEs: "La mesa de dibujo",
      moveEn: "Sketch a tape diagram or number line before writing an equation.",
      moveEs: "Dibuja un diagrama de cinta o una recta numérica antes de escribir una ecuación.",
    },
    pattern: {
      labEn: "The Pattern Forge",
      labEs: "La fragua de patrones",
      moveEn: "Test three cases in a table and look for the constant multiplier or step.",
      moveEs: "Prueba tres casos en una tabla y busca el multiplicador o paso constante.",
    },
    "small-start": {
      labEn: "The Small-Start Bench",
      labEs: "El banco de empezar en pequeño",
      moveEn: "Swap ugly numbers for friendly whole numbers first to see the structure.",
      moveEs: "Cambia primero los números difíciles por enteros amigables para ver la estructura.",
    },
    reality: {
      labEn: "The Reality Check",
      labEs: "La prueba de realidad",
      moveEn: "Estimate before and after: should the answer be bigger or smaller than the start?",
      moveEs: "Estima antes y después: ¿debería la respuesta ser mayor o menor que el inicio?",
    },
    record: {
      labEn: "The Clear Record",
      labEs: "El registro claro",
      moveEn: "Label every number with its unit so your reasoning speaks for itself.",
      moveEs: "Etiqueta cada número con su unidad para que tu razonamiento hable por sí mismo.",
    },
    "second-way": {
      labEn: "The Second Path",
      labEs: "El segundo camino",
      moveEn: "Verify your answer using a second representation (table, tape, or graph).",
      moveEs: "Verifica tu respuesta usando una segunda representación (tabla, cinta o gráfica).",
    },
  };

  function mentorInfo(rawJson) {
    try {
      var parsed = typeof rawJson === "string" ? JSON.parse(rawJson || "null") : rawJson;
      if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string" || !parsed.id) {
        return {
          hasMentor: false,
          id: "",
          name: "",
          labEn: "Unit 0 Mentor Lab",
          labEs: "Laboratorio de Mentores (Unidad 0)",
          moveEn: "Choose your Math Mentor & 2 thinking moves to guide every mission.",
          moveEs:
            "Elige tu Mentor Matemático y 2 movimientos de pensamiento para guiar cada misión.",
        };
      }
      var prettyName = parsed.id
        .split("-")
        .map(function (w) {
          return w ? w.charAt(0).toUpperCase() + w.slice(1) : "";
        })
        .join(" ");
      var moves = Array.isArray(parsed.moves) ? parsed.moves : [];
      var moveKey =
        moves.find(function (m) {
          return MENTOR_MOVES[m];
        }) || "drawing";
      var move = MENTOR_MOVES[moveKey];
      return {
        hasMentor: true,
        id: parsed.id,
        name: prettyName,
        labEn: move.labEn,
        labEs: move.labEs,
        moveEn: move.moveEn,
        moveEs: move.moveEs,
      };
    } catch (_e) {
      return {
        hasMentor: false,
        id: "",
        name: "",
        labEn: "Unit 0 Mentor Lab",
        labEs: "Laboratorio de Mentores (Unidad 0)",
        moveEn: "Choose your Math Mentor & 2 thinking moves to guide every mission.",
        moveEs: "Elige tu Mentor Matemático y 2 movimientos de pensamiento para guiar cada misión.",
      };
    }
  }

  function readinessHref(entry) {
    var id = entry && entry.id ? String(entry.id).replace(/-catchup$/, "") : "1-1";
    return withStudent("/lessons/" + id + "/readiness/");
  }

  C.STAGES = STAGES;
  C.taughtLessons = taughtLessons;
  C.unitsOf = unitsOf;
  C.pacingLesson = pacingLesson;
  C.defaultLesson = defaultLesson;
  C.withStudent = withStudent;
  C.stageLinks = stageLinks;
  C.stageStates = stageStates;
  C.studioGenIds = studioGenIds;
  C.checkPlan = checkPlan;
  C.buildItems = buildItems;
  C.grade = grade;
  C.newRun = newRun;
  C.answer = answer;
  C.canReveal = canReveal;
  C.reveal = reveal;
  C.summarize = summarize;
  C.repairChips = repairChips;
  C.tagLabel = tagLabel;
  C.MENTOR_MOVES = MENTOR_MOVES;
  C.mentorInfo = mentorInfo;
  C.readinessHref = readinessHref;
})(typeof window !== "undefined" ? window : globalThis);
