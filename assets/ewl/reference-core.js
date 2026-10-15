/* EWL.Reference (logic) — search and validation for the Pocket Reference. No DOM in this file.
 *
 *   Reference.search(entries, {q, lesson, lang}) -> entries, best match first
 *   Reference.validate(data, ctx)                -> [problems]   (empty means the data is safe to ship)
 *       ctx: { lessonIds:Set|array (taught lessons), lookup(lessonId)->vocabulary[] (the lesson's own words),
 *              iconKeys:array, presets:array (Math Workbench preset ids), minEntries?:number }
 *   Reference.sandboxUrl(entry)                  -> "/curriculum/math-workbench/?preset=..."
 *
 * Every entry must trace to a real term in the lesson it names: same term, same definition, same Spanish, and its
 * example and non-example are lines the lesson itself wrote. The validator is exported so the build gate can reuse it.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var R = (EWL.Reference = EWL.Reference || {});

  var LESSON_RE = /^[1-9]\d?-\d{1,2}$/;

  function norm(s) {
    return String(s == null ? "" : s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }
  function hay(e) {
    return norm([e.term, e.termEs, e.definition, e.definitionEs].join(" "));
  }

  function search(entries, o) {
    var words = norm(o && o.q)
      .split(" ")
      .filter(Boolean);
    var lesson = o && o.lesson;
    var out = [];
    entries.forEach(function (e) {
      if (lesson && e.lessons.indexOf(lesson) < 0) return;
      var h = hay(e);
      for (var i = 0; i < words.length; i++) if (h.indexOf(words[i]) < 0) return;
      var term = norm(e.term);
      var termEs = norm(e.termEs);
      var score = 3;
      if (!words.length) score = 3;
      else if (term === words.join(" ") || termEs === words.join(" ")) score = 0;
      else if (term.indexOf(words[0]) === 0 || termEs.indexOf(words[0]) === 0) score = 1;
      else if (term.indexOf(words[0]) >= 0 || termEs.indexOf(words[0]) >= 0) score = 2;
      out.push({ e: e, score: score });
    });
    out.sort(function (a, b) {
      return a.score - b.score || norm(a.e.term).localeCompare(norm(b.e.term));
    });
    return out.map(function (x) {
      return x.e;
    });
  }

  function sandboxUrl(e) {
    return "/curriculum/math-workbench/?preset=" + encodeURIComponent(e.sandbox.preset);
  }

  function validate(data, ctx) {
    var p = [];
    function bad(id, msg) {
      p.push((id ? id + ": " : "") + msg);
    }
    if (!data || data.v !== 1 || !Array.isArray(data.entries)) return ["not a v1 pocket reference"];
    var min = ctx.minEntries == null ? 120 : ctx.minEntries;
    if (data.entries.length < min)
      bad("", "only " + data.entries.length + " entries (need " + min + ")");
    var lessonIds = new Set(Array.from(ctx.lessonIds));
    var seenId = {};
    var seenTerm = {};
    data.entries.forEach(function (e) {
      var id = e && e.id;
      if (!e || typeof id !== "string") return bad("", "entry without id");
      if (seenId[id]) bad(id, "duplicate id");
      seenId[id] = true;
      var activity = "ewl.reference." + id;
      if (!EWL.ID_RE || !EWL.ID_RE.test(activity)) bad(id, "id is not a valid activity slug");
      ["term", "termEs", "definition", "definitionEs", "example"].forEach(function (k) {
        if (typeof e[k] !== "string" || !e[k].trim()) bad(id, "missing " + k);
      });
      if (e.nonExample != null && (typeof e.nonExample !== "string" || !e.nonExample.trim()))
        bad(id, "empty nonExample");
      var nt = norm(e.term);
      if (seenTerm[nt]) bad(id, "term repeated: " + e.term);
      seenTerm[nt] = true;
      if (!e.frame || !/___/.test(e.frame.en || "") || !/___/.test(e.frame.es || ""))
        bad(id, "sentence frame needs a blank in both languages");
      if (!Array.isArray(e.lessons) || !e.lessons.length) return bad(id, "no lessons");
      e.lessons.forEach(function (l) {
        if (!LESSON_RE.test(l) || !lessonIds.has(l))
          bad(id, "lesson " + l + " is not a taught lesson");
      });
      if (ctx.iconKeys.indexOf(e.icon) < 0) bad(id, "unknown icon " + e.icon);
      if (!e.sandbox || ctx.presets.indexOf(e.sandbox.preset) < 0)
        bad(id, "unknown Math Workbench preset " + (e.sandbox && e.sandbox.preset));
      // trace every claim back to the lesson's own vocabulary
      var src = e.source;
      if (!src || !LESSON_RE.test(src.lesson) || e.lessons.indexOf(src.lesson) < 0)
        return bad(id, "source lesson missing or not in lessons");
      e.lessons.forEach(function (l) {
        var v = (ctx.lookup(l) || []).filter(function (w) {
          return norm(w.term) === nt;
        })[0];
        if (!v) bad(id, "lesson " + l + " does not teach the term " + e.term);
      });
      var vocab = (ctx.lookup(src.lesson) || []).filter(function (w) {
        return norm(w.term) === norm(src.term);
      })[0];
      if (!vocab || norm(src.term) !== nt)
        return bad(id, "source term not found in lesson " + src.lesson);
      if (e.definition !== vocab.definition)
        bad(id, "definition differs from lesson " + src.lesson);
      if (e.termEs !== vocab.termEs) bad(id, "termEs differs from lesson " + src.lesson);
      if (e.definitionEs !== vocab.definitionEs)
        bad(id, "definitionEs differs from lesson " + src.lesson);
      var texts = (vocab.examples || []).map(function (x) {
        return x.text;
      });
      if (vocab.example) texts.push(vocab.example);
      if (texts.indexOf(e.example) < 0) bad(id, "example is not one the lesson wrote");
      if (e.nonExample && texts.indexOf(e.nonExample) < 0)
        bad(id, "nonExample is not one the lesson wrote");
      if (e.visual && e.visual !== vocab.visual)
        bad(id, "visual differs from lesson " + src.lesson);
    });
    return p;
  }

  R.norm = norm;
  R.search = search;
  R.validate = validate;
  R.sandboxUrl = sandboxUrl;
})(typeof window !== "undefined" ? window : globalThis);
