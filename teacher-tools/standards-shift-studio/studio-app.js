/**
 * Standards Shift Studio — UI orchestration.
 * Wires the data/match/generate modules to the page: tabs, coverage atlas,
 * crosswalk review, sequence editor + doctor, impact view, change-kit
 * downloads, and localStorage autosave (export/import for portability).
 */
(function () {
  "use strict";

  var LS_KEY = "nt.shift-studio.plan.v1";

  var model = null; // ShiftData model
  var matchRows = []; // ShiftMatch.matchAll output
  var state = {
    label: "",
    proposedText: "",
    decisions: {}, // proposedCode → currentCode | "__new__"
    seq: {}, // lessonId → {unit, lesson}
  };

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function chip(text, tone) {
    return '<span class="sss-chip' + (tone ? " is-" + tone : "") + '">' + esc(text) + "</span>";
  }

  // ---- persistence ---------------------------------------------------------
  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        $("save-msg").textContent = "Saved on this device · " + new Date().toLocaleTimeString();
      } catch (e) {
        $("save-msg").textContent = "Autosave unavailable (storage full or blocked).";
      }
    }, 400);
  }

  function restore() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === "object") {
        state.label = saved.label || "";
        state.proposedText = saved.proposedText || "";
        state.decisions = saved.decisions || {};
        state.seq = saved.seq || {};
      }
    } catch (e) {
      /* corrupted save — start clean */
    }
  }

  // ---- tabs ----------------------------------------------------------------
  var TABS = ["coverage", "model", "sequence", "impact", "generate"];
  function showTab(name) {
    TABS.forEach(function (t) {
      $("tab-" + t).setAttribute("aria-selected", String(t === name));
      $("panel-" + t).hidden = t !== name;
    });
    if (name === "impact") renderImpact();
    if (name === "generate") renderGenerate();
  }

  // ---- coverage atlas ------------------------------------------------------
  function renderCoverage() {
    var q = ($("coverage-search").value || "").trim().toLowerCase();
    var covered = 0;
    var rows = [];
    var currentDomain = null;
    model.standardCodes.forEach(function (code) {
      var s = model.standards[code];
      var lessons = model.byStandard[code] || [];
      if (lessons.length) covered += 1;
      var hay = (
        code +
        " " +
        s.shortLabel +
        " " +
        s.fullText +
        " unit " +
        s.unit +
        " " +
        lessons
          .map(function (l) {
            return l.id + " " + l.title;
          })
          .join(" ")
      ).toLowerCase();
      if (q && hay.indexOf(q) === -1) return;
      if (s.domain !== currentDomain) {
        currentDomain = s.domain;
        rows.push(
          '<tr><td colspan="4" class="sss-unitbar">' +
            esc(s.domainName || s.domain) +
            " (" +
            esc(s.domain) +
            ")</td></tr>",
        );
      }
      var lessonHtml = lessons.length
        ? lessons
            .map(function (l) {
              return (
                '<a class="sss-lessonlink" href="' +
                esc(l.path) +
                '" target="_blank" rel="noopener">' +
                esc(l.id) +
                "</a><span class='sss-muted'> (" +
                l.resourcesHave +
                "/" +
                l.resourcesTotal +
                ")</span>"
              );
            })
            .join(" ")
        : '<span class="sss-verdict v-new">no lesson</span>';
      rows.push(
        "<tr><td><span class='sss-code'>" +
          esc(code) +
          "</span></td><td><strong>" +
          esc(s.shortLabel) +
          "</strong><br /><span class='sss-muted'>" +
          esc(s.fullText) +
          "</span></td><td>" +
          (s.unit != null ? "Unit " + esc(s.unit) : "—") +
          "</td><td>" +
          lessonHtml +
          "</td></tr>",
      );
    });
    $("coverage-table").innerHTML =
      "<table><thead><tr><th>Standard</th><th>What it says</th><th>Unit</th><th>Lessons (resources built)</th></tr></thead><tbody>" +
      rows.join("") +
      "</tbody></table>";
    $("coverage-kpis").innerHTML =
      chip(model.standardCodes.length + " standards") +
      chip(model.lessons.length + " lessons") +
      chip(covered + " covered", "good") +
      (model.standardCodes.length - covered
        ? chip(model.standardCodes.length - covered + " uncovered", "warn")
        : "");
  }

  // ---- model the change ----------------------------------------------------
  function runMatch(silent) {
    state.proposedText = $("proposed-input").value;
    state.label = $("plan-label").value.trim();
    var parsed = ShiftMatch.parseProposed(state.proposedText);
    if (!parsed.length) {
      if (!silent)
        $("match-msg").textContent =
          "No standards found — paste one per line, starting with its code.";
      $("review-card").hidden = true;
      matchRows = [];
      scheduleSave();
      return;
    }
    matchRows = ShiftMatch.matchAll(parsed, model);
    // Drop overrides for codes no longer present in the pasted text.
    var valid = {};
    matchRows.forEach(function (r) {
      valid[r.code] = true;
    });
    Object.keys(state.decisions).forEach(function (k) {
      if (!valid[k]) delete state.decisions[k];
    });
    $("match-msg").textContent = "Matched " + matchRows.length + " proposed standards.";
    renderMatchTable();
    scheduleSave();
  }

  function verdictHtml(v) {
    var labels = {
      unchanged: "unchanged",
      recode: "re-code",
      reworded: "reworded",
      review: "review me",
      new: "new — no match",
    };
    return '<span class="sss-verdict v-' + v + '">' + (labels[v] || v) + "</span>";
  }

  function renderMatchTable() {
    if (!matchRows.length) {
      $("review-card").hidden = true;
      return;
    }
    var resolved = ShiftMatch.resolve(matchRows, state.decisions, model);
    var rowsHtml = resolved.rows.map(function (row, i) {
      var raw = matchRows[i];
      var opts = ['<option value="">auto: ' + esc(raw.autoMappedTo || "no match") + "</option>"];
      raw.candidates.forEach(function (c) {
        if (c.score <= 0) return;
        opts.push(
          '<option value="' +
            esc(c.code) +
            '"' +
            (state.decisions[row.code] === c.code ? " selected" : "") +
            ">" +
            esc(c.code) +
            " · " +
            Math.round(c.score * 100) +
            "% · " +
            esc(model.standards[c.code].shortLabel) +
            "</option>",
        );
      });
      opts.push(
        '<option value="__new__"' +
          (state.decisions[row.code] === "__new__" ? " selected" : "") +
          ">brand-new standard (no current match)</option>",
      );
      var mappedLessons = row.mappedTo ? (model.byStandard[row.mappedTo] || []).length : 0;
      return (
        "<tr><td><span class='sss-code'>" +
        esc(row.code) +
        "</span></td><td>" +
        esc(row.text) +
        "</td><td>" +
        verdictHtml(row.verdict) +
        "</td><td><select data-decision='" +
        esc(row.code) +
        "'>" +
        opts.join("") +
        "</select></td><td>" +
        (row.mappedTo
          ? "<span class='sss-code'>" +
            esc(row.mappedTo) +
            "</span> <span class='sss-muted'>" +
            mappedLessons +
            " lesson" +
            (mappedLessons === 1 ? "" : "s") +
            "</span>"
          : "<span class='sss-muted'>—</span>") +
        "</td></tr>"
      );
    });
    $("match-table").innerHTML =
      "<table><thead><tr><th>Proposed</th><th>Text</th><th>Verdict</th><th>Maps to (override)</th><th>Current</th></tr></thead><tbody>" +
      rowsHtml.join("") +
      "</tbody></table>";
    var c = ShiftGenerate.computeImpact(resolved, seqEdits(), model).counts;
    $("match-kpis").innerHTML =
      chip(c.unchanged + " unchanged", "good") +
      chip(c.recodes + " re-codes") +
      chip(c.reworded + " reworded") +
      (c.reviews ? chip(c.reviews + " need review", "warn") : "") +
      (c.news ? chip(c.news + " new", "bad") : "") +
      (c.dropped ? chip(c.dropped + " dropped w/ lessons", "bad") : "");
    $("review-card").hidden = false;
    $("match-table")
      .querySelectorAll("select[data-decision]")
      .forEach(function (sel) {
        sel.addEventListener("change", function () {
          var code = sel.getAttribute("data-decision");
          if (sel.value) state.decisions[code] = sel.value;
          else delete state.decisions[code];
          renderMatchTable();
          scheduleSave();
        });
      });
  }

  function loadSample() {
    var xw = model.crosswalk2025;
    if (!xw || !xw.entries) {
      $("match-msg").textContent = "The 2025 crosswalk example is unavailable on this deployment.";
      return;
    }
    var seen = {};
    var lines = [];
    xw.entries.forEach(function (e) {
      if (!e.newId || seen[e.newId]) return;
      seen[e.newId] = true;
      lines.push(e.newId + "  " + (e.oldLabel || ""));
    });
    $("proposed-input").value = lines.join("\n");
    if (!$("plan-label").value) $("plan-label").value = "Worked example — 2025 MCCRS re-code";
    runMatch();
    $("match-msg").textContent =
      "Worked example loaded: the real 2025 re-code, replayed through the matcher (" +
      lines.length +
      " standards).";
  }

  // ---- re-sequence ---------------------------------------------------------
  function seqValue(l) {
    var o = state.seq[l.id];
    return {
      unit: o && o.unit != null ? o.unit : l.unit,
      lesson: o && o.lesson != null ? o.lesson : l.lesson,
    };
  }

  function seqEdits() {
    return model.lessons
      .map(function (l) {
        var v = seqValue(l);
        if (v.unit === l.unit && v.lesson === l.lesson) return null;
        return {
          id: l.id,
          title: l.title,
          fromUnit: l.unit,
          fromLesson: l.lesson,
          unit: v.unit,
          lesson: v.lesson,
        };
      })
      .filter(Boolean);
  }

  function runDoctor() {
    var errs = [];
    var warns = [];
    var slots = {};
    var byUnit = {};
    model.lessons.forEach(function (l) {
      var v = seqValue(l);
      var key = v.unit + "·" + v.lesson;
      if (slots[key]) errs.push("Duplicate slot " + key + ": " + slots[key] + " and " + l.id);
      else slots[key] = l.id;
      (byUnit[v.unit] = byUnit[v.unit] || []).push(v.lesson);
    });
    var units = Object.keys(byUnit)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
    for (var i = 1; i < units.length; i++) {
      if (units[i] - units[i - 1] > 1)
        warns.push("Unit numbering jumps " + units[i - 1] + " → " + units[i]);
    }
    units.forEach(function (u) {
      var nums = byUnit[u].sort(function (a, b) {
        return a - b;
      });
      for (var j = 1; j < nums.length; j++) {
        if (nums[j] - nums[j - 1] > 1)
          warns.push("Unit " + u + ": lesson numbering jumps " + nums[j - 1] + " → " + nums[j]);
      }
    });
    return { errs: errs, warns: warns };
  }

  function renderSequence() {
    var doc = runDoctor();
    var moves = seqEdits();
    $("seq-doctor").innerHTML =
      (doc.errs.length
        ? doc.errs
            .map(function (e) {
              return '<div class="sss-doc-err">✗ ' + esc(e) + "</div>";
            })
            .join("")
        : '<div class="sss-doc-ok">✓ Spine is consistent — no duplicate unit·lesson slots.</div>') +
      doc.warns
        .map(function (w) {
          return '<div class="sss-doc-warn">⚠ ' + esc(w) + "</div>";
        })
        .join("");
    $("seq-kpis").innerHTML =
      chip(model.lessons.length + " lessons") +
      (moves.length ? chip(moves.length + " moved", "warn") : chip("no moves yet"));

    var rows = [];
    var lastUnit = null;
    model.lessons
      .slice()
      .sort(function (a, b) {
        var va = seqValue(a);
        var vb = seqValue(b);
        return va.unit - vb.unit || va.lesson - vb.lesson;
      })
      .forEach(function (l) {
        var v = seqValue(l);
        var moved = v.unit !== l.unit || v.lesson !== l.lesson;
        if (v.unit !== lastUnit) {
          lastUnit = v.unit;
          rows.push('<tr><td colspan="5" class="sss-unitbar">Unit ' + esc(v.unit) + "</td></tr>");
        }
        rows.push(
          '<tr class="' +
            (moved ? "sss-seq-moved" : "") +
            '"><td><span class="sss-code">' +
            esc(l.id) +
            '</span></td><td><input type="number" min="0" value="' +
            v.unit +
            '" data-seq-unit="' +
            esc(l.id) +
            '" aria-label="Unit for ' +
            esc(l.id) +
            '" /></td><td><input type="number" min="0" value="' +
            v.lesson +
            '" data-seq-lesson="' +
            esc(l.id) +
            '" aria-label="Lesson number for ' +
            esc(l.id) +
            '" /></td><td>' +
            esc(l.title) +
            "</td><td><span class='sss-code'>" +
            esc(l.standard) +
            "</span></td></tr>",
        );
      });
    $("seq-table").innerHTML =
      "<table><thead><tr><th>Folder id (never changes)</th><th>Unit</th><th>Lesson</th><th>Title</th><th>Standard</th></tr></thead><tbody>" +
      rows.join("") +
      "</tbody></table>";
    $("seq-table")
      .querySelectorAll("input[data-seq-unit], input[data-seq-lesson]")
      .forEach(function (input) {
        input.addEventListener("change", function () {
          var id = input.getAttribute("data-seq-unit") || input.getAttribute("data-seq-lesson");
          var lesson = model.lessons.find(function (l) {
            return l.id === id;
          });
          if (!lesson) return;
          var v = seqValue(lesson);
          var num = parseInt(input.value, 10);
          if (isNaN(num) || num < 0) {
            input.classList.add("is-invalid");
            return;
          }
          input.classList.remove("is-invalid");
          if (input.hasAttribute("data-seq-unit")) v.unit = num;
          else v.lesson = num;
          if (v.unit === lesson.unit && v.lesson === lesson.lesson) delete state.seq[lesson.id];
          else state.seq[lesson.id] = v;
          renderSequence();
          scheduleSave();
        });
      });
  }

  // ---- impact --------------------------------------------------------------
  function currentImpact() {
    var resolved = ShiftMatch.resolve(matchRows, state.decisions, model);
    return ShiftGenerate.computeImpact(resolved, seqEdits(), model);
  }

  function renderImpact() {
    if (!matchRows.length && !seqEdits().length) {
      $("impact-body").innerHTML =
        '<p class="sss-muted">Nothing modeled yet — paste proposed standards in <strong>2 · Model the change</strong> or move lessons in <strong>3 · Re-sequence</strong>.</p>';
      return;
    }
    var imp = currentImpact();
    var html = [];
    html.push('<div class="sss-toolbar">');
    html.push(chip(imp.counts.proposed + " proposed"));
    html.push(chip(imp.counts.unchanged + " unchanged", "good"));
    html.push(chip(imp.counts.recodes + " re-codes"));
    html.push(chip(imp.counts.lessonsRecoded + " lesson configs re-code"));
    if (imp.counts.reviews) html.push(chip(imp.counts.reviews + " need review", "warn"));
    if (imp.counts.news) html.push(chip(imp.counts.news + " gaps", "bad"));
    if (imp.counts.dropped) html.push(chip(imp.counts.dropped + " dropped w/ lessons", "bad"));
    if (imp.counts.seqMoves) html.push(chip(imp.counts.seqMoves + " sequence moves", "warn"));
    html.push("</div>");

    if (imp.lessonsRecoded.length) {
      html.push("<h3>Lessons that will re-code (content unchanged)</h3>");
      html.push(
        '<div class="sss-tablewrap"><table><thead><tr><th>Lesson</th><th>Title</th><th>Now</th><th>Becomes</th></tr></thead><tbody>',
      );
      imp.lessonsRecoded.forEach(function (r) {
        html.push(
          "<tr><td><a href='" +
            esc(r.lesson.path) +
            "' target='_blank' rel='noopener'>" +
            esc(r.lesson.id) +
            "</a></td><td>" +
            esc(r.lesson.title) +
            "</td><td><span class='sss-code'>" +
            esc(r.from) +
            "</span></td><td><span class='sss-code'>" +
            esc(r.to) +
            "</span></td></tr>",
        );
      });
      html.push("</tbody></table></div>");
    }

    if (imp.gaps.length) {
      html.push("<h3>Gaps — proposed standards with no lesson yet</h3>");
      html.push(
        '<div class="sss-tablewrap"><table><thead><tr><th>Proposed</th><th>Text</th><th>Suggested landing unit</th></tr></thead><tbody>',
      );
      imp.gaps.forEach(function (g) {
        html.push(
          "<tr><td><span class='sss-code'>" +
            esc(g.row.code) +
            "</span></td><td>" +
            esc(g.row.text) +
            "</td><td>" +
            (g.suggestedUnit != null ? "Unit " + g.suggestedUnit : "—") +
            "</td></tr>",
        );
      });
      html.push("</tbody></table></div>");
    }

    if (imp.droppedWithLessons.length) {
      html.push("<h3>Dropped standards with lessons attached</h3>");
      html.push(
        '<p class="sss-muted">These lessons stay live (routes never break) but would leave the tested sequence.</p>',
      );
      html.push(
        '<div class="sss-tablewrap"><table><thead><tr><th>Current standard</th><th>Lessons</th></tr></thead><tbody>',
      );
      imp.droppedWithLessons.forEach(function (d) {
        html.push(
          "<tr><td><span class='sss-code'>" +
            esc(d.code) +
            "</span></td><td>" +
            d.lessons
              .map(function (l) {
                return esc(l.id) + " (" + esc(l.title) + ")";
              })
              .join(", ") +
            "</td></tr>",
        );
      });
      html.push("</tbody></table></div>");
    }

    if (imp.seqEdits.length) {
      html.push("<h3>Scope &amp; sequence moves</h3>");
      html.push(
        '<div class="sss-tablewrap"><table><thead><tr><th>Lesson</th><th>From</th><th>To</th></tr></thead><tbody>',
      );
      imp.seqEdits.forEach(function (e) {
        html.push(
          "<tr><td>" +
            esc(e.id) +
            " — " +
            esc(e.title) +
            "</td><td>" +
            e.fromUnit +
            "-" +
            e.fromLesson +
            "</td><td><strong>" +
            e.unit +
            "-" +
            e.lesson +
            "</strong></td></tr>",
        );
      });
      html.push("</tbody></table></div>");
    }
    $("impact-body").innerHTML = html.join("");
  }

  // ---- generate ------------------------------------------------------------
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(
      function () {
        var was = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(function () {
          btn.textContent = was;
        }, 1500);
      },
      function () {
        window.prompt("Copy this:", text);
      },
    );
  }

  function planLabel() {
    return state.label || "MSDE proposal";
  }

  function kitFiles(imp) {
    var s = ShiftGenerate.slug(planLabel());
    return [
      {
        name: "standards-crosswalk-" + s + ".json",
        title: "Crosswalk (old → new codes)",
        desc:
          "Drop into data/ and run npm run standards-crosswalk:apply. " +
          "Entries you overrode by hand are marked teacher-verified.",
        make: function () {
          return JSON.stringify(ShiftGenerate.buildCrosswalk(imp, model, planLabel()), null, 2);
        },
        enabled: imp.counts.recodes + imp.counts.reviews + imp.counts.reworded > 0,
      },
      {
        name: "ccss-standards-additions-" + s + ".json",
        title: "Registry additions (new standards)",
        desc: "Merge each entry into data/ccss-standards.json → standards. TODO fields need a human.",
        make: function () {
          return JSON.stringify(
            ShiftGenerate.buildRegistryAdditions(imp, model, planLabel()),
            null,
            2,
          );
        },
        enabled: imp.counts.news > 0,
      },
      {
        name: "spine-edits-" + s + ".json",
        title: "Scope & sequence edits",
        desc: "Which lessons/<id>/config.json unit/lesson fields to change — fields only, folders never move.",
        make: function () {
          return JSON.stringify(ShiftGenerate.buildSpineEdits(imp, planLabel()), null, 2);
        },
        enabled: imp.counts.seqMoves > 0,
      },
      {
        name: "lesson-starters-" + s + ".json",
        title: "Lesson config starters (gaps)",
        desc: "A ready-to-fill config.json skeleton for every uncovered standard, slotted into its suggested unit.",
        make: function () {
          return JSON.stringify(ShiftGenerate.buildLessonStarters(imp, model), null, 2);
        },
        enabled: imp.counts.news > 0,
      },
      {
        name: "shift-plan-" + s + ".json",
        title: "Full studio plan (backup)",
        desc: "Everything above plus your raw input and decisions — re-import it here any time.",
        make: function () {
          return JSON.stringify(state, null, 2);
        },
        enabled: true,
      },
    ];
  }

  function renderGenerate() {
    var hasWork = matchRows.length || seqEdits().length;
    if (!hasWork) {
      $("generate-body").innerHTML =
        '<p class="sss-muted">Model a change first — the kit builds itself from your crosswalk decisions and sequence edits.</p>';
      $("brief-preview").textContent = "";
      $("prompt-preview").textContent = "";
      return;
    }
    var imp = currentImpact();
    var files = kitFiles(imp);
    $("generate-body").innerHTML =
      '<div class="sss-dlgrid">' +
      files
        .map(function (f, i) {
          return (
            '<div class="sss-dlcard"><h3>' +
            esc(f.title) +
            "</h3><p>" +
            esc(f.desc) +
            '</p><p><span class="sss-code">' +
            esc(f.name) +
            "</span></p>" +
            '<button type="button" class="sss-btn sss-btn-primary" data-dl="' +
            i +
            '"' +
            (f.enabled ? "" : " disabled title='Nothing of this kind in the current model'") +
            ">Download</button></div>"
          );
        })
        .join("") +
      "</div>";
    $("generate-body")
      .querySelectorAll("button[data-dl]")
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var f = files[Number(btn.getAttribute("data-dl"))];
          download(f.name, f.make());
        });
      });

    var brief = ShiftGenerate.buildBrief(imp, model, planLabel());
    $("brief-preview").textContent = brief;
    var enabledNames = files
      .filter(function (f) {
        return f.enabled;
      })
      .map(function (f) {
        return f.name;
      });
    $("prompt-preview").textContent = ShiftGenerate.buildAgentPrompt(
      imp,
      planLabel(),
      enabledNames,
    );
  }

  // ---- boot ----------------------------------------------------------------
  function wire() {
    TABS.forEach(function (t) {
      $("tab-" + t).addEventListener("click", function () {
        showTab(t);
      });
    });
    $("coverage-search").addEventListener("input", renderCoverage);
    $("run-match").addEventListener("click", function () {
      runMatch();
    });
    $("load-sample").addEventListener("click", loadSample);
    $("plan-label").addEventListener("change", function () {
      state.label = $("plan-label").value.trim();
      scheduleSave();
    });
    $("seq-reset").addEventListener("click", function () {
      state.seq = {};
      renderSequence();
      scheduleSave();
    });
    $("brief-download").addEventListener("click", function () {
      var imp = currentImpact();
      download(
        "standards-shift-brief-" + ShiftGenerate.slug(planLabel()) + ".md",
        ShiftGenerate.buildBrief(imp, model, planLabel()),
        "text/markdown",
      );
    });
    $("brief-copy").addEventListener("click", function () {
      copyText($("brief-preview").textContent, $("brief-copy"));
    });
    $("brief-print").addEventListener("click", function () {
      window.print();
    });
    $("prompt-copy").addEventListener("click", function () {
      copyText($("prompt-preview").textContent, $("prompt-copy"));
    });
    $("plan-export").addEventListener("click", function () {
      download(
        "shift-plan-" + ShiftGenerate.slug(planLabel()) + ".json",
        JSON.stringify(state, null, 2),
      );
    });
    $("plan-import").addEventListener("change", function () {
      var file = $("plan-import").files && $("plan-import").files[0];
      if (!file) return;
      file.text().then(function (text) {
        try {
          var plan = JSON.parse(text);
          state.label = plan.label || "";
          state.proposedText = plan.proposedText || "";
          state.decisions = plan.decisions || {};
          state.seq = plan.seq || {};
          $("plan-label").value = state.label;
          $("proposed-input").value = state.proposedText;
          renderSequence();
          if (state.proposedText) runMatch(true);
          scheduleSave();
          $("save-msg").textContent = "Plan imported.";
        } catch (e) {
          $("save-msg").textContent = "That file is not a studio plan.";
        }
      });
    });
    $("plan-clear").addEventListener("click", function () {
      if (!window.confirm("Clear the whole modeled change on this device?")) return;
      state = { label: "", proposedText: "", decisions: {}, seq: {} };
      matchRows = [];
      $("plan-label").value = "";
      $("proposed-input").value = "";
      $("review-card").hidden = true;
      localStorage.removeItem(LS_KEY);
      renderSequence();
      renderCoverage();
      $("save-msg").textContent = "Cleared.";
      showTab("coverage");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wire();
    restore();
    ShiftData.load()
      .then(function (m) {
        model = m;
        var status = $("sss-status");
        status.textContent =
          "Live data loaded — " +
          m.lessons.length +
          " lessons · " +
          m.standardCodes.length +
          " standards · " +
          m.units.length +
          " units. Everything runs on this device; nothing uploads.";
        status.classList.add("is-ready");
        $("plan-label").value = state.label;
        $("proposed-input").value = state.proposedText;
        renderCoverage();
        renderSequence();
        if (state.proposedText) runMatch(true);
      })
      .catch(function (err) {
        var status = $("sss-status");
        status.textContent =
          "Could not load curriculum data (" +
          err.message +
          "). Refresh to retry — the studio needs /data/*.json.";
        status.classList.add("is-error");
      });
  });
})();
