/**
 * Insight Brief engine — pure, deterministic analysis of student lesson work.
 *
 * Input: raw JSON from the four existing TEACHER_KEY analytics endpoints on
 * /api/progress/ (digest, mastery-rollup, struggles, grades) plus the
 * REVEAL_MATH_LESSONS registry. Output: one brief object the UI renders.
 * No DOM, no fetch, no Date.now (caller passes `now`) — unit-testable in node.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NTInsightEngine = factory();
})(typeof self !== "undefined" ? self : globalThis, function () {
  // Catch-up station bands per unit (…/lessons/{unit}-{boundary}-catchup/).
  // A band's lesson covers that unit's lessons from the previous boundary+1
  // through the boundary itself.
  var CATCHUP_BANDS = {
    1: [3, 7],
    2: [3, 5],
    3: [3, 7],
    4: [3, 7],
    5: [3, 5],
    6: [3, 7],
    7: [3, 7],
    8: [3, 7],
    9: [3, 7],
    10: [3, 5],
  };

  function lessonPath(id) {
    return "/lessons/" + String(id).replace(".", "-") + "/";
  }
  function arcadePath(id) {
    return "/math/games/practice-arcade/?lesson=" + String(id).replace(".", "-");
  }
  function catchupPath(id) {
    var parts = String(id).split(".");
    var unit = Number(parts[0]);
    var n = Number(parts[1]);
    var bands = CATCHUP_BANDS[unit];
    if (!bands || !Number.isFinite(n)) return null;
    for (var i = 0; i < bands.length; i++) {
      if (n <= bands[i]) return "/lessons/" + unit + "-" + bands[i] + "-catchup/";
    }
    return "/lessons/" + unit + "-" + bands[bands.length - 1] + "-catchup/";
  }
  function plannerPath(standard, topic) {
    return (
      "/teacher-tools/lesson-plan-generator/?standard=" +
      encodeURIComponent(standard || "") +
      "&topic=" +
      encodeURIComponent(topic || "") +
      "&autogen=1"
    );
  }

  // Registry lookups: standard code -> lessons teaching it (registry order).
  function indexLessons(lessons) {
    var byStandard = {};
    (lessons || []).forEach(function (l) {
      if (!l || !l.standard) return;
      (byStandard[l.standard] = byStandard[l.standard] || []).push(l);
    });
    return byStandard;
  }

  function round(n) {
    return Math.round(n * 10) / 10;
  }
  function mean(nums) {
    if (!nums.length) return null;
    return round(
      nums.reduce(function (a, b) {
        return a + b;
      }, 0) / nums.length,
    );
  }

  // ---- Students ------------------------------------------------------------

  function studentKey(name, section) {
    return (section || "") + "|" + (name || "");
  }

  function buildStudents(digest, struggles, grades, section) {
    var map = {};
    function get(name, sec) {
      var k = studentKey(name, sec);
      if (!map[k])
        map[k] = {
          name: name,
          section: sec || "",
          scores: [],
          progress: [],
          activities: 0,
          mastery: [],
          struggles: 0,
          misconceptions: 0,
          weakStandards: {},
          tags: {},
          lastSignalAt: "",
          gradeAvg: null,
        };
      return map[k];
    }

    ((digest && digest.students) || []).forEach(function (d) {
      if (section && d.section !== section) return;
      var s = get(d.studentName, d.section);
      (d.activities || []).forEach(function (a) {
        s.activities += 1;
        if (a.scorePct != null && Number.isFinite(Number(a.scorePct)))
          s.scores.push(Number(a.scorePct));
        if (a.progressPercent != null && Number.isFinite(Number(a.progressPercent)))
          s.progress.push(Number(a.progressPercent));
      });
      var tc = d.telemetryCounts || {};
      s.struggles += (tc.struggle || 0) + (tc["hint-exhausted"] || 0);
      s.misconceptions += tc.misconception || 0;
      (d.masteryReached || []).forEach(function (std) {
        if (s.mastery.indexOf(std) < 0) s.mastery.push(std);
      });
    });

    ((struggles && struggles.rows) || []).forEach(function (r) {
      if (!r.studentName) return;
      if (section && r.section !== section) return;
      var s = get(r.studentName, r.section);
      if (r.standard) s.weakStandards[r.standard] = (s.weakStandards[r.standard] || 0) + 1;
      if (r.tag) s.tags[r.tag] = (s.tags[r.tag] || 0) + 1;
      if (String(r.at || "") > s.lastSignalAt) s.lastSignalAt = String(r.at || "");
      // Low-score rows are aggregates, not new events; event rows count once.
      if (r.signal === "struggle" || r.signal === "hint-exhausted") s.struggles += 0; // digest already counted window events
      if (r.signal === "low-score") s.struggles += 1;
    });

    // Grades pivot: rows = [name, section, ...cells, avg]; avg is last column.
    ((grades && grades.rows) || []).forEach(function (row) {
      if (!Array.isArray(row) || row.length < 3) return;
      var name = row[0];
      var sec = row[1];
      if (section && sec !== section) return;
      var avg = Number(row[row.length - 1]);
      if (!Number.isFinite(avg)) return;
      var s = get(name, sec);
      s.gradeAvg = avg;
    });

    return Object.keys(map).map(function (k) {
      var s = map[k];
      var avg = s.scores.length ? mean(s.scores) : s.gradeAvg;
      var risk =
        s.struggles * 2 +
        s.misconceptions * 2 +
        (avg != null && avg < 70 ? 3 : 0) +
        (avg != null && avg < 50 ? 2 : 0) -
        s.mastery.length;
      var hasData = s.activities > 0 || s.struggles > 0 || s.misconceptions > 0 || avg != null;
      var tier;
      if (!hasData) tier = "no-data";
      else if (risk >= 5) tier = "support";
      else if (risk >= 2) tier = "watch";
      else if (avg != null && avg >= 90 && s.mastery.length >= 1 && s.struggles === 0)
        tier = "enrichment";
      else tier = "on-track";
      var weak = Object.keys(s.weakStandards).sort(function (a, b) {
        return s.weakStandards[b] - s.weakStandards[a];
      });
      return {
        name: s.name,
        section: s.section,
        avgScore: avg,
        completion: mean(s.progress),
        activities: s.activities,
        mastery: s.mastery,
        struggles: s.struggles,
        misconceptions: s.misconceptions,
        weakStandards: weak,
        topTag:
          Object.keys(s.tags).sort(function (a, b) {
            return s.tags[b] - s.tags[a];
          })[0] || "",
        lastSignalAt: s.lastSignalAt,
        risk: risk,
        tier: tier,
      };
    });
  }

  // ---- Standards -----------------------------------------------------------

  function buildStandards(rollup, byStandard, section) {
    var out = [];
    ((rollup && rollup.sections) || []).forEach(function (sec) {
      if (section && sec.section !== section) return;
      (sec.standards || []).forEach(function (st) {
        var lessons = byStandard[st.standard] || [];
        var lesson = lessons[0] || null;
        var lowRate = st.attempts >= 4 && st.correctRate != null && Number(st.correctRate) < 0.6;
        var midRate = st.attempts >= 4 && st.correctRate != null && Number(st.correctRate) < 0.75;
        var need =
          (st.struggleCount || 0) * 2 +
          (st.misconceptionCount || 0) * 2 +
          (lowRate ? 6 : midRate ? 3 : 0) -
          (st.masteryCount || 0);
        var topTag =
          (st.topMisconceptions && st.topMisconceptions[0] && st.topMisconceptions[0].tag) || "";
        out.push({
          section: sec.section,
          standard: st.standard,
          lessonId: lesson ? lesson.id : "",
          lessonTitle: lesson ? lesson.title : "",
          attempts: st.attempts || 0,
          correctRate: st.correctRate == null ? null : Number(st.correctRate),
          mastery: st.masteryCount || 0,
          struggles: st.struggleCount || 0,
          misconceptions: st.misconceptionCount || 0,
          topTag: topTag,
          need: need,
          idea: standardIdea(st.standard, lesson, topTag, st),
          links: standardLinks(st.standard, lesson),
        });
      });
    });
    out.sort(function (a, b) {
      return b.need - a.need;
    });
    return out;
  }

  function standardLinks(standard, lesson) {
    var links = [];
    if (lesson) {
      links.push({ label: "Reteach plan (auto)", href: plannerPath(standard, lesson.title) });
      var cu = catchupPath(lesson.id);
      if (cu) links.push({ label: "Catch-up station", href: cu });
      links.push({ label: "Practice game", href: arcadePath(lesson.id) });
      links.push({ label: "Open lesson", href: lessonPath(lesson.id) });
    } else {
      links.push({ label: "Reteach plan (auto)", href: plannerPath(standard, standard) });
    }
    return links;
  }

  function standardIdea(standard, lesson, tag, st) {
    var title = lesson ? '"' + lesson.title + '"' : standard;
    if (tag)
      return (
        "Reteach " +
        title +
        ' as a 10-minute small group: project one wrong answer showing the "' +
        tag +
        '" mix-up and have pairs find the thinking error before the fix. Then send the group to the catch-up station.'
      );
    if ((st.struggleCount || 0) > 0)
      return (
        "Run a quick error-analysis huddle on " +
        title +
        ": students sort 3 worked examples into correct / almost / off-track, then verbalize the difference."
      );
    if ((st.masteryCount || 0) > 0 && (st.struggleCount || 0) === 0)
      return (
        "Class is landing " +
        title +
        " — bank it: fold one problem into next week's Do Now spiral and move pacing forward."
      );
    return (
      "Collect one more signal on " +
      title +
      ": assign the practice game round as tomorrow's warm-up and re-check the brief."
    );
  }

  // ---- Priorities, groups, planning ---------------------------------------

  function buildPriorities(standards, students) {
    var pr = [];
    var worst = standards.filter(function (s) {
      return s.need >= 4;
    })[0];
    if (worst)
      pr.push({
        kind: "reteach",
        title:
          "Reteach " +
          worst.standard +
          (worst.lessonTitle ? " — " + worst.lessonTitle : "") +
          (worst.section ? " (class " + worst.section + ")" : ""),
        why:
          worst.struggles +
          " struggle signal(s), " +
          worst.misconceptions +
          " misconception(s)" +
          (worst.correctRate != null
            ? ", " + Math.round(worst.correctRate * 100) + "% correct rate"
            : "") +
          (worst.topTag ? ' — top mix-up: "' + worst.topTag + '"' : ""),
        links: worst.links,
      });
    var atRisk = students
      .filter(function (s) {
        return s.tier === "support";
      })
      .sort(function (a, b) {
        return b.risk - a.risk;
      })
      .slice(0, 5);
    if (atRisk.length)
      pr.push({
        kind: "checkin",
        title:
          "Check in today: " +
          atRisk
            .map(function (s) {
              return s.name + (s.section ? " (" + s.section + ")" : "");
            })
            .join(", "),
        why: "Highest combined struggle + misconception + low-score signals in this window.",
        links: [{ label: "Open Intervention Radar", href: "/teacher-tools/intervention-radar/" }],
      });
    var stars = students
      .filter(function (s) {
        return s.tier === "enrichment";
      })
      .slice(0, 5);
    if (stars.length)
      pr.push({
        kind: "celebrate",
        title:
          "Ready for more: " +
          stars
            .map(function (s) {
              return s.name;
            })
            .join(", "),
        why: "90%+ average with mastery signals and no struggles — assign enrichment or peer-tutor roles during reteach groups.",
        links: [{ label: "Open Gradebook", href: "/teacher-tools/gradebook/" }],
      });
    return pr;
  }

  function buildGroups(students, standards) {
    var bySec = {};
    students.forEach(function (s) {
      if (s.tier !== "support" && s.tier !== "watch") return;
      var std = s.weakStandards[0] || "";
      var k = s.section + "|" + std;
      (bySec[k] = bySec[k] || []).push(s);
    });
    var stdInfo = {};
    standards.forEach(function (st) {
      var k = st.section + "|" + st.standard;
      if (!stdInfo[k]) stdInfo[k] = st;
    });
    var groups = [];
    Object.keys(bySec)
      .sort()
      .forEach(function (k) {
        var parts = k.split("|");
        var sec = parts[0];
        var std = parts[1];
        var kids = bySec[k];
        for (var i = 0; i < kids.length; i += 5) {
          var chunk = kids.slice(i, i + 5);
          var info = stdInfo[sec + "|" + std] || stdInfo["|" + std] || null;
          groups.push({
            section: sec,
            standard: std || "(mixed — no single weak standard)",
            lessonTitle: info ? info.lessonTitle : "",
            students: chunk.map(function (s) {
              return s.name;
            }),
            move: std
              ? "Station: 5 min re-model, 5 min pair fix-it on a wrong example, 5 min two-problem exit check."
              : "Station: conference on each student's most recent work; set one micro-goal each.",
            links: info ? info.links : [],
          });
        }
      });
    return groups;
  }

  function buildPlanning(students, standards) {
    var sections = {};
    students.forEach(function (s) {
      if (s.section) sections[s.section] = true;
    });
    standards.forEach(function (s) {
      if (s.section) sections[s.section] = true;
    });
    return Object.keys(sections)
      .sort()
      .map(function (sec) {
        var secStd = standards.filter(function (s) {
          return s.section === sec;
        });
        var secKids = students.filter(function (s) {
          return s.section === sec;
        });
        var support = secKids.filter(function (s) {
          return s.tier === "support";
        }).length;
        var ideas = [];
        if (secStd[0] && secStd[0].need >= 4)
          ideas.push(
            "Do Now: one " +
              (secStd[0].lessonTitle || secStd[0].standard) +
              " problem + thumbs confidence vote — " +
              secStd[0].struggles +
              " struggle signal(s) on " +
              secStd[0].standard +
              " this window.",
          );
        if (support > 0)
          ideas.push(
            "Plan a " +
              Math.min(support, 5) +
              "-student support station (see Small groups below) while the rest work the practice game.",
          );
        var solid = secStd.filter(function (s) {
          return s.mastery > 0 && s.struggles === 0;
        })[0];
        if (solid)
          ideas.push(
            "Spiral, don't reteach, " +
              solid.standard +
              (solid.lessonTitle ? " (" + solid.lessonTitle + ")" : "") +
              " — it shows mastery with no struggle signals.",
          );
        if (!ideas.length)
          ideas.push(
            "No strong signals for this class in the window — widen the time window or assign a quick arcade round to collect evidence.",
          );
        return { section: sec, ideas: ideas };
      });
  }

  function buildSummaryText(brief) {
    var L = [];
    L.push(
      "INSIGHT BRIEF — " +
        brief.generatedAt +
        " (window: " +
        brief.windowDays +
        "d" +
        (brief.section ? ", class " + brief.section : "") +
        ")",
    );
    var h = brief.headline;
    L.push(
      h.activeStudents +
        " active students · " +
        h.activitiesTouched +
        " activities · avg score " +
        (h.avgScore == null ? "—" : h.avgScore + "%") +
        " · " +
        h.masteryEvents +
        " mastery · " +
        h.struggleSignals +
        " struggles · " +
        h.misconceptions +
        " misconceptions",
    );
    brief.priorities.forEach(function (p, i) {
      L.push(i + 1 + ". [" + p.kind.toUpperCase() + "] " + p.title + " — " + p.why);
    });
    brief.groups.forEach(function (g) {
      L.push("GROUP (" + (g.section || "all") + ", " + g.standard + "): " + g.students.join(", "));
    });
    brief.planning.forEach(function (p) {
      p.ideas.forEach(function (idea) {
        L.push("PLAN " + p.section + ": " + idea);
      });
    });
    return L.join("\n");
  }

  function buildBrief(inputs) {
    inputs = inputs || {};
    var section = inputs.section || "";
    var byStandard = indexLessons(inputs.lessons);
    var students = buildStudents(inputs.digest, inputs.struggles, inputs.grades, section);
    var standards = buildStandards(inputs.rollup, byStandard, section);

    var scored = students.filter(function (s) {
      return s.avgScore != null;
    });
    var headline = {
      activeStudents: students.filter(function (s) {
        return s.tier !== "no-data";
      }).length,
      activitiesTouched: students.reduce(function (a, s) {
        return a + s.activities;
      }, 0),
      avgScore: mean(
        scored.map(function (s) {
          return s.avgScore;
        }),
      ),
      masteryEvents: students.reduce(function (a, s) {
        return a + s.mastery.length;
      }, 0),
      struggleSignals: students.reduce(function (a, s) {
        return a + s.struggles;
      }, 0),
      misconceptions: students.reduce(function (a, s) {
        return a + s.misconceptions;
      }, 0),
    };

    var brief = {
      generatedAt: inputs.now || "",
      windowDays: inputs.windowDays || 7,
      section: section,
      headline: headline,
      priorities: buildPriorities(standards, students),
      students: students.sort(function (a, b) {
        return b.risk - a.risk || a.name.localeCompare(b.name);
      }),
      standards: standards,
      groups: buildGroups(students, standards),
      planning: buildPlanning(students, standards),
    };
    brief.tiers = {
      support: [],
      watch: [],
      onTrack: [],
      enrichment: [],
      noData: [],
    };
    students.forEach(function (s) {
      if (s.tier === "support") brief.tiers.support.push(s.name);
      else if (s.tier === "watch") brief.tiers.watch.push(s.name);
      else if (s.tier === "enrichment") brief.tiers.enrichment.push(s.name);
      else if (s.tier === "no-data") brief.tiers.noData.push(s.name);
      else brief.tiers.onTrack.push(s.name);
    });
    brief.summaryText = buildSummaryText(brief);
    return brief;
  }

  return {
    buildBrief: buildBrief,
    catchupPath: catchupPath,
    arcadePath: arcadePath,
    lessonPath: lessonPath,
    plannerPath: plannerPath,
  };
});
