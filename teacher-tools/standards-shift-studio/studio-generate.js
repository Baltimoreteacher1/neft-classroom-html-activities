/**
 * Standards Shift Studio — impact analysis + change-kit generators.
 * Every artifact matches the schema the repo pipeline already consumes
 * (see docs/standards/msde-standards-change-runbook.md). Pure functions, no DOM.
 */
(function () {
  "use strict";

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function slug(label) {
    return (
      String(label || "msde-proposal")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "msde-proposal"
    );
  }

  /** Derive domain / cluster hints for a brand-new proposed code like 6.NOS.B.4. */
  function codeParts(code, model) {
    var segs = String(code).split(".");
    var domain = segs[1] || "";
    var cluster = segs.length > 2 && /^[A-Z]$/.test(segs[2]) ? segs.slice(0, 3).join(".") : "";
    return {
      domain: domain,
      domainName: model.domains[domain] || "",
      knownDomain: !!model.domains[domain],
      cluster: cluster,
    };
  }

  /**
   * The single derived view everything else renders from.
   * resolved = ShiftMatch.resolve(...); seqEdits = [{id, unit, lesson}] changes.
   */
  function computeImpact(resolved, seqEdits, model) {
    var recodes = [];
    var reworded = [];
    var unchanged = [];
    var reviews = [];
    var news = [];
    resolved.rows.forEach(function (row) {
      if (row.verdict === "new") news.push(row);
      else if (row.verdict === "review") reviews.push(row);
      else if (row.verdict === "reworded") reworded.push(row);
      else if (row.mappedTo && row.mappedTo !== row.code) recodes.push(row);
      else unchanged.push(row);
    });

    var droppedWithLessons = resolved.dropped
      .map(function (code) {
        return { code: code, lessons: model.byStandard[code] || [] };
      })
      .filter(function (d) {
        return d.lessons.length;
      });

    var lessonsRecoded = [];
    recodes.forEach(function (row) {
      (model.byStandard[row.mappedTo] || []).forEach(function (l) {
        lessonsRecoded.push({ lesson: l, from: row.mappedTo, to: row.code });
      });
    });

    var gaps = news.map(function (row) {
      var parts = codeParts(row.code, model);
      // Suggest a landing unit: the unit where sibling standards (same domain) live most.
      var unitVotes = {};
      model.standardCodes.forEach(function (code) {
        var s = model.standards[code];
        if (s.domain === parts.domain && s.unit != null) {
          unitVotes[s.unit] = (unitVotes[s.unit] || 0) + 1;
        }
      });
      var suggestedUnit = null;
      Object.keys(unitVotes).forEach(function (u) {
        if (suggestedUnit == null || unitVotes[u] > unitVotes[suggestedUnit]) suggestedUnit = u;
      });
      return {
        row: row,
        parts: parts,
        suggestedUnit: suggestedUnit != null ? Number(suggestedUnit) : null,
      };
    });

    return {
      counts: {
        proposed: resolved.rows.length,
        unchanged: unchanged.length,
        recodes: recodes.length,
        reworded: reworded.length,
        reviews: reviews.length,
        news: news.length,
        dropped: droppedWithLessons.length,
        lessonsRecoded: lessonsRecoded.length,
        seqMoves: seqEdits.length,
      },
      unchanged: unchanged,
      recodes: recodes,
      reworded: reworded,
      reviews: reviews,
      news: news,
      gaps: gaps,
      droppedWithLessons: droppedWithLessons,
      lessonsRecoded: lessonsRecoded,
      seqEdits: seqEdits,
    };
  }

  /** data/standards-crosswalk-<slug>.json — same schema as the 2025 file. */
  function buildCrosswalk(impact, model, label) {
    var entries = impact.recodes
      .concat(impact.reworded, impact.reviews)
      .filter(function (row) {
        return row.mappedTo && row.mappedTo !== row.code;
      })
      .map(function (row) {
        var cur = model.standards[row.mappedTo];
        var parts = codeParts(row.code, model);
        return {
          oldId: row.mappedTo,
          oldShortForm: row.mappedTo,
          oldDomain: cur ? cur.domain : "",
          oldLabel: cur ? cur.shortLabel || cur.fullText.slice(0, 90) : "",
          newDomain: parts.domain,
          newId: row.code,
          confidence: row.overridden ? "teacher-verified" : "auto-matched-needs-verification",
        };
      });
    return {
      _note:
        "Old->new crosswalk drafted by the Standards Shift Studio (teacher-tools/standards-shift-studio) for '" +
        label +
        "'. Review every 'auto-matched-needs-verification' entry against the official MSDE document before applying. Applied by scripts/apply-standards-crosswalk.mjs.",
      source: label,
      generated: new Date().toISOString(),
      entries: entries,
    };
  }

  /** New entries for data/ccss-standards.json (merge into .standards by key). */
  function buildRegistryAdditions(impact, model, label) {
    var additions = {};
    impact.gaps.forEach(function (g) {
      var words = ShiftMatch.tokenize(g.row.text);
      additions[g.row.code] = {
        domain: g.parts.knownDomain ? g.parts.domain : g.parts.domain || "TODO",
        cluster: g.parts.cluster || "TODO",
        topic: words[0] || "TODO",
        shortLabel: g.row.text.split(/[.;]/)[0].split(/\s+/).slice(0, 5).join(" ") || g.row.code,
        fullText: g.row.text,
        unit: g.suggestedUnit,
      };
    });
    return {
      _note:
        "New-standard registry entries drafted by the Standards Shift Studio for '" +
        label +
        "'. Merge each key into the `standards` object of data/ccss-standards.json (review domain/cluster/topic/unit first).",
      generated: new Date().toISOString(),
      standards: additions,
    };
  }

  /** Spine edits: which lessons/<id>/config.json unit/lesson fields to change. */
  function buildSpineEdits(impact, label) {
    return {
      _note:
        "Scope & sequence edits drafted by the Standards Shift Studio for '" +
        label +
        "'. For each entry set `unit` and `lesson` in lessons/<id>/config.json (fields only — never rename folders), then run npm run curriculum:rebuild.",
      generated: new Date().toISOString(),
      edits: impact.seqEdits,
    };
  }

  /** Ready-to-fill lesson config starters for uncovered (new) standards. */
  function buildLessonStarters(impact, model) {
    return impact.gaps.map(function (g) {
      var unit = g.suggestedUnit != null ? g.suggestedUnit : 0;
      var used = model.lessons
        .filter(function (l) {
          return l.unit === unit;
        })
        .map(function (l) {
          return l.lesson;
        });
      var nextLesson = used.length ? Math.max.apply(null, used) + 1 : 1;
      return {
        suggestedFolder: "lessons/" + unit + "-" + nextLesson + "/",
        config: {
          unit: unit,
          lesson: nextLesson,
          standard: g.row.code,
          title: "TODO — " + (g.row.text.split(/[.;]/)[0] || g.row.code),
          theme: "space-station",
          contentObjective:
            "I can " +
            (g.row.text || "…").replace(/^[A-Z]/, function (c) {
              return c.toLowerCase();
            }),
          languageObjective:
            "I can explain my thinking using the key vocabulary for this standard.",
          timeEstimate: "~45 min",
          vocabulary: [],
        },
      };
    });
  }

  function pct(n, d) {
    return d ? Math.round((n / d) * 100) + "%" : "—";
  }

  /** Human-readable adaptation brief (markdown). */
  function buildBrief(impact, model, label) {
    var L = [];
    L.push("# Standards Shift Brief — " + label);
    L.push("");
    L.push("Generated " + today() + " by the Standards Shift Studio against the live curriculum (");
    L[L.length - 1] +=
      model.lessons.length + " lessons, " + model.standardCodes.length + " standards).";
    L.push("");
    L.push("## At a glance");
    L.push("");
    L.push("| Measure | Count |");
    L.push("| --- | --- |");
    L.push("| Proposed standards analyzed | " + impact.counts.proposed + " |");
    L.push("| Unchanged (same code, same meaning) | " + impact.counts.unchanged + " |");
    L.push("| Re-codes (existing lesson content keeps working) | " + impact.counts.recodes + " |");
    L.push("| Reworded (same code — re-read the new text) | " + impact.counts.reworded + " |");
    L.push("| Needs human review | " + impact.counts.reviews + " |");
    L.push("| Brand-new standards (no coverage yet) | " + impact.counts.news + " |");
    L.push("| Current standards dropped, with lessons attached | " + impact.counts.dropped + " |");
    L.push("| Lesson configs that will re-code | " + impact.counts.lessonsRecoded + " |");
    L.push("| Scope & sequence moves | " + impact.counts.seqMoves + " |");
    L.push("");
    var covered = impact.counts.proposed - impact.counts.news;
    L.push(
      "**Coverage of the proposal with what you already have: " +
        pct(covered, impact.counts.proposed) +
        "** (" +
        covered +
        " of " +
        impact.counts.proposed +
        " proposed standards map to existing lessons or registry entries).",
    );

    if (impact.recodes.length) {
      L.push("");
      L.push("## Re-codes (crosswalk)");
      L.push("");
      L.push("| Current | → Proposed | Lessons affected |");
      L.push("| --- | --- | --- |");
      impact.recodes.forEach(function (row) {
        var lessons = (model.byStandard[row.mappedTo] || [])
          .map(function (l) {
            return l.id;
          })
          .join(", ");
        L.push("| `" + row.mappedTo + "` | `" + row.code + "` | " + (lessons || "—") + " |");
      });
    }

    if (impact.reviews.length) {
      L.push("");
      L.push("## Needs your review");
      L.push("");
      impact.reviews.forEach(function (row) {
        L.push("- `" + row.code + "` — best guess `" + (row.mappedTo || "none") + "`: " + row.text);
      });
    }

    if (impact.gaps.length) {
      L.push("");
      L.push("## Gaps — new standards with no lesson yet");
      L.push("");
      impact.gaps.forEach(function (g) {
        L.push(
          "- `" +
            g.row.code +
            "` (suggested Unit " +
            (g.suggestedUnit != null ? g.suggestedUnit : "?") +
            "): " +
            g.row.text,
        );
      });
      L.push("");
      L.push("Lesson config starters for each gap are in the change kit.");
    }

    if (impact.droppedWithLessons.length) {
      L.push("");
      L.push("## Dropped standards with lessons attached");
      L.push("");
      L.push("These lessons stay live (never delete routes) but leave the tested sequence:");
      L.push("");
      impact.droppedWithLessons.forEach(function (d) {
        L.push(
          "- `" +
            d.code +
            "` → " +
            d.lessons
              .map(function (l) {
                return l.id + " (" + l.title + ")";
              })
              .join(", "),
        );
      });
    }

    if (impact.seqEdits.length) {
      L.push("");
      L.push("## Scope & sequence moves");
      L.push("");
      L.push("| Lesson | From | To |");
      L.push("| --- | --- | --- |");
      impact.seqEdits.forEach(function (e) {
        L.push(
          "| " +
            e.id +
            " (" +
            e.title +
            ") | " +
            e.fromUnit +
            "-" +
            e.fromLesson +
            " | " +
            e.unit +
            "-" +
            e.lesson +
            " |",
        );
      });
    }

    L.push("");
    L.push("## Apply checklist (from the MSDE runbook)");
    L.push("");
    L.push("1. Drop the change-kit files into `data/` (crosswalk, registry additions).");
    L.push(
      "2. `npm run standards-crosswalk` (dry-run) → review, then `npm run standards-crosswalk:apply`.",
    );
    L.push(
      "3. Apply spine edits to each `lessons/<id>/config.json` (fields only — never rename folders).",
    );
    L.push("4. `npm run curriculum:rebuild` — must exit green.");
    L.push("5. Diff `docs/standards/scope-and-sequence.md` and confirm it matches this brief.");
    L.push("6. `npm run validate` and deploy per `docs/deploy.md` when ready to publish.");
    L.push("");
    return L.join("\n") + "\n";
  }

  /** Copy-paste prompt that walks a coding agent through the runbook safely. */
  function buildAgentPrompt(impact, label, fileNames) {
    var P = [];
    P.push(
      "I modeled a proposed MSDE standards change ('" + label + "') in the Standards Shift Studio.",
    );
    P.push("Attached/downloaded files: " + fileNames.join(", ") + ".");
    P.push("");
    P.push(
      "In the neft-classroom-html-activities repo, follow docs/standards/msde-standards-change-runbook.md:",
    );
    P.push(
      "1. Copy the crosswalk file into data/ and review any 'auto-matched-needs-verification' entries against the official MSDE document.",
    );
    P.push(
      "2. Merge the registry-additions file's `standards` entries into data/ccss-standards.json (fill any TODO domain/cluster/topic).",
    );
    P.push(
      "3. Run `npm run standards-crosswalk` (dry-run), show me the report, then `npm run standards-crosswalk:apply`.",
    );
    if (impact.seqEdits.length) {
      P.push(
        "4. Apply the spine edits file: set `unit`/`lesson` in each listed lessons/<id>/config.json — never rename lesson folders.",
      );
    }
    P.push(
      (impact.seqEdits.length ? "5" : "4") +
        ". Run `npm run curriculum:rebuild` and `npm run validate`; both must pass.",
    );
    P.push(
      (impact.seqEdits.length ? "6" : "5") +
        ". Show me the diff of docs/standards/scope-and-sequence.md before any commit. Do not deploy without my explicit OK.",
    );
    if (impact.gaps.length) {
      P.push("");
      P.push(
        "Then scaffold the " +
          impact.gaps.length +
          " gap lesson(s) from the lesson-starters file (create lessons/<unit>-<lesson>/config.json from each starter; content authoring comes later).",
      );
    }
    return P.join("\n") + "\n";
  }

  window.ShiftGenerate = {
    slug: slug,
    computeImpact: computeImpact,
    buildCrosswalk: buildCrosswalk,
    buildRegistryAdditions: buildRegistryAdditions,
    buildSpineEdits: buildSpineEdits,
    buildLessonStarters: buildLessonStarters,
    buildBrief: buildBrief,
    buildAgentPrompt: buildAgentPrompt,
  };
})();
