/* Curriculum matrix search: pure scoring for the Cmd/Ctrl+K omnibar.
 * search(matrix, query) -> up to 12 lessons, best first. Matches lesson id ("6-3" or "6.3"),
 * title, topics, objective words and standard codes. Loaded in the browser (window.CurriculumMatrixSearch)
 * and in node tests (module.exports). */
(function (root) {
  "use strict";
  var norm = function (s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[^a-z0-9.\- ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };
  /** Subsequence match with a gap penalty; 0 = no match, higher = better. */
  function fuzzy(hay, needle) {
    var i = 0;
    var last = -1;
    var gaps = 0;
    for (var j = 0; j < hay.length && i < needle.length; j++) {
      if (hay[j] === needle[i]) {
        if (last >= 0) gaps += j - last - 1;
        last = j;
        i++;
      }
    }
    return i === needle.length ? Math.max(1, 20 - gaps) : 0;
  }
  function score(l, q) {
    var id = l.id;
    var qid = q.replace(/^(lesson|l)\s*/, "").replace(/\./g, "-");
    if (/^\d+(-\d*)?$/.test(qid)) return id === qid ? 1000 : id.indexOf(qid) === 0 ? 800 : 0;
    var title = norm(l.title);
    var s = 0;
    if (title.indexOf(q) === 0) s = Math.max(s, 600);
    else if (title.indexOf(q) > -1) s = Math.max(s, 500);
    (l.standards || []).forEach(function (c) {
      if (norm(c).indexOf(q) > -1) s = Math.max(s, 450);
    });
    (l.topics || []).forEach(function (t) {
      var n = norm(t);
      if (n === q) s = Math.max(s, 480);
      else if (n.indexOf(q) > -1) s = Math.max(s, 400);
    });
    if (norm(l.objective).indexOf(q) > -1) s = Math.max(s, 200);
    if (!s && q.length >= 3) s = Math.min(150, fuzzy(title, q) * 5);
    return s;
  }
  function search(matrix, query) {
    var q = norm(query);
    if (!q) return [];
    var out = [];
    matrix.units.forEach(function (u) {
      u.lessons.forEach(function (l) {
        var s = score(l, q);
        if (s > 0) out.push({ s: s, lesson: l, unit: u });
      });
    });
    out.sort(function (a, b) {
      return b.s - a.s || a.lesson.id.localeCompare(b.lesson.id, undefined, { numeric: true });
    });
    return out.slice(0, 12).map(function (r) {
      return r.lesson;
    });
  }
  var api = { search: search, norm: norm };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CurriculumMatrixSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
