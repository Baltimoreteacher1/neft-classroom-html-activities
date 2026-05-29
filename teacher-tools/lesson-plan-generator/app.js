/* =============================================================================
 * NOTES (read me)
 * -----------------------------------------------------------------------------
 * Neft Teacher Lesson Plan Generator — self-contained, client-side tool.
 *
 * SOURCE / PORT:
 *   Ported from the deterministic Python project "codex-lesson-plan-generator"
 *   (neft-practice-engine). The original reads a teacher .pptx deck, extracts
 *   slides, and renders a 10-section flagship lesson plan as JSON/MD/DOCX via a
 *   local Python pipeline (python-pptx + a DOCX renderer). That backend cannot
 *   run in a static browser site, so this port keeps the SAME canonical
 *   10-section structure, support rules (SPED Profiles A-G, Level 1 / Level 2
 *   supports), and "[INFERRED - VERIFY]" missing-info convention — but replaces
 *   the .pptx ingestion with a direct INPUT FORM. Teacher inputs -> formatted,
 *   printable lesson plan OUTPUT (HTML + Markdown).
 *
 * GENERATION MODES:
 *   - "local" (DEFAULT): composes the entire plan deterministically in the
 *     browser. No network, no API key, works fully offline. This is what runs
 *     out of the box and is the recommended mode.
 *   - "api" (OPTIONAL STUB): if you set a generation endpoint URL in Settings,
 *     the tool will POST the structured inputs to it and render the returned
 *     plan text. THIS IS A STUB: no endpoint, no provider, and NO API KEY are
 *     shipped with this tool. If the endpoint is empty, unreachable, or errors,
 *     the tool automatically FALLS BACK to local generation so the UI always
 *     works. If you use AI mode, route through your OWN proxy/Worker that holds
 *     the provider key server-side; never hard-code keys in this client.
 *
 * STORAGE: all inputs persist in localStorage under LP_KEY. Nothing leaves the
 * browser in local mode.
 * ========================================================================== */

(function () {
  "use strict";

  const LP_KEY = "neft.lessonPlan.v1";
  const SETTINGS_KEY = "neft.lessonPlan.settings.v1";
  const THEME_KEY = "neft.lessonPlan.theme.v1";

  // ---- Approved supports (mirrors source rules/support_rules.md) ----------
  const SPED_PROFILES = [
    {
      id: "A",
      label: "Profile A",
      desc: "sentence starters, word banks, expressive language support",
    },
    {
      id: "B",
      label: "Profile B",
      desc: "reduced distractions, manipulatives, extended time",
    },
    {
      id: "C",
      label: "Profile C",
      desc: "breaks, chunking, graphic organizers, word banks",
    },
    {
      id: "D",
      label: "Profile D",
      desc: "graphic organizers, text-to-speech, visuals, repetition",
    },
    {
      id: "E",
      label: "Profile E",
      desc: "preteach vocabulary, highlight tool, attention strategies, small group",
    },
    {
      id: "F",
      label: "Profile F",
      desc: "clarified/repeated directions, text-to-speech, visuals, immediate feedback",
    },
    {
      id: "G",
      label: "Profile G",
      desc: "simplified language, word banks, graphic organizers, calculator, small group",
    },
  ];
  // Labeled Level 1 / Level 2 per Neft naming convention (never "ESOL").
  const LEVEL1 = [
    {
      id: "l1_vocab",
      label: "Student-friendly vocabulary",
      desc: "preview key terms with simple definitions + visuals",
    },
    {
      id: "l1_starters",
      label: "Sentence starters",
      desc: "frames for explaining reasoning",
    },
    {
      id: "l1_partner",
      label: "Partner talk",
      desc: "structured turn-and-talk before independent work",
    },
    {
      id: "l1_visual",
      label: "Visual supports",
      desc: "diagrams, anchor charts, color-coding",
    },
    {
      id: "l1_directions",
      label: "Repeated/clarified directions",
      desc: "restate and check for understanding",
    },
    {
      id: "l1_chunk",
      label: "Chunked tasks",
      desc: "break work into smaller steps",
    },
  ];
  const LEVEL2 = [
    {
      id: "l2_extend",
      label: "Extension challenge",
      desc: "deeper/multi-step problem for early finishers",
    },
    {
      id: "l2_explain",
      label: "Justify & critique",
      desc: "explain reasoning and evaluate another method",
    },
    {
      id: "l2_apply",
      label: "Real-world application",
      desc: "apply the concept to a novel context",
    },
  ];

  const PHASES = [
    {
      key: "opening",
      title: "Opening / Warm-Up / Launch",
      min: "openingMin",
      w: 10,
    },
    {
      key: "mini",
      title: "Mini-Lesson / Modeling / Concept Development",
      min: "miniMin",
      w: 18,
    },
    {
      key: "guided",
      title: "Guided Practice / Collaborative Learning",
      min: "guidedMin",
      w: 10,
    },
    {
      key: "independent",
      title: "Independent Practice / Application / Stations",
      min: "independentMin",
      w: 10,
    },
    {
      key: "closure",
      title: "Closure / Exit Ticket / Assessment",
      min: "closureMin",
      w: 7,
    },
  ];

  const INFER = '<span class="lp-inferred">[INFERRED - VERIFY]</span>';
  const INFER_TXT = "[INFERRED - VERIFY]";

  // ---- State ---------------------------------------------------------------
  let state = loadState();
  let settings = loadSettings();

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const lines = (s) =>
    String(s || "")
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(LP_KEY) || "{}");
      return Object.assign(
        { standards: [], spedSel: {}, l1Sel: {}, l2Sel: {} },
        raw,
      );
    } catch (e) {
      return { standards: [], spedSel: {}, l1Sel: {}, l2Sel: {} };
    }
  }
  function saveState() {
    localStorage.setItem(LP_KEY, JSON.stringify(state));
    flashSaved();
  }
  function loadSettings() {
    try {
      return Object.assign(
        { mode: "local", apiUrl: "" },
        JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
      );
    } catch (e) {
      return { mode: "local", apiUrl: "" };
    }
  }
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    updateModeBadge();
    flashSaved();
  }

  let saveTimer = null;
  function flashSaved() {
    const b = $("saveBadge");
    if (!b) return;
    b.textContent = "Saved";
    b.className = "badge ok";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      b.textContent = "Saved locally";
      b.className = "badge neutral";
    }, 1200);
  }
  function updateModeBadge() {
    const b = $("modeBadge");
    if (!b) return;
    b.textContent =
      settings.mode === "api" ? "AI endpoint (stub)" : "Local generation";
  }

  // ---- Tabs ----------------------------------------------------------------
  const TITLES = {
    start: ["Start Here", "Turn your lesson inputs into a polished plan."],
    quick: [
      "Quick Generate",
      "Type a topic or upload slides — get the full plan.",
    ],
    info: ["Lesson Info", "Identity, class context, and materials."],
    standards: [
      "Standards & Target",
      "Anchor the lesson in standards and a clear target.",
    ],
    phases: ["Lesson Phases", "Notes and timing for each phase."],
    supports: ["Supports", "Approved SPED and leveled supports."],
    plan: ["Lesson Plan", "Generate, review, and print your plan."],
    settings: ["Settings", "Generation mode and data controls."],
  };
  function showTab(tab) {
    document
      .querySelectorAll(".nav button")
      .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.toggle("active", s.id === tab));
    const t = TITLES[tab] || ["", ""];
    $("pageTitle").textContent = t[0];
    $("pageSubtitle").textContent = t[1];
    if (tab === "phases") updateTimingDisplay();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---- Field binding -------------------------------------------------------
  const TEXT_FIELDS = [
    "title",
    "unit",
    "date",
    "teacher",
    "school",
    "grade",
    "subject",
    "duration",
    "materials",
    "objective",
    "successCriteria",
    "teacherNotes",
    "opening",
    "mini",
    "guided",
    "independent",
    "closure",
    "openingMin",
    "miniMin",
    "guidedMin",
    "independentMin",
    "closureMin",
  ];
  function bindFields() {
    TEXT_FIELDS.forEach((id) => {
      const el = $(id);
      if (!el) return;
      if (state[id] != null) el.value = state[id];
      el.addEventListener("input", () => {
        state[id] = el.value;
        saveState();
        if (id === "duration" || id.endsWith("Min")) updateTimingDisplay();
      });
    });
  }

  // ---- Standards table -----------------------------------------------------
  function renderStandards() {
    const t = $("standardTable");
    if (!t) return;
    if (!state.standards.length) {
      t.innerHTML = '<tr><td class="muted">No standards added yet.</td></tr>';
      return;
    }
    let html = "<tr><th>Code</th><th>Description</th><th></th></tr>";
    state.standards.forEach((s, i) => {
      html +=
        "<tr><td><strong>" +
        esc(s.code) +
        "</strong></td><td>" +
        esc(s.desc) +
        '</td><td><button class="btn danger" data-del="' +
        i +
        '" type="button">Remove</button></td></tr>';
    });
    t.innerHTML = html;
    t.querySelectorAll("button[data-del]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.standards.splice(Number(btn.dataset.del), 1);
        saveState();
        renderStandards();
      }),
    );
  }
  function addStandard() {
    const code = $("standardCode").value.trim();
    const desc = $("standardDesc").value.trim();
    if (!code && !desc) return;
    state.standards.push({ code: code || "(code)", desc: desc || "" });
    $("standardCode").value = "";
    $("standardDesc").value = "";
    saveState();
    renderStandards();
  }

  // ---- Supports check-lists ------------------------------------------------
  function renderChecklist(containerId, items, selMap) {
    const c = $(containerId);
    if (!c) return;
    c.innerHTML = "";
    items.forEach((it) => {
      const lab = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!selMap[it.id];
      cb.addEventListener("change", () => {
        selMap[it.id] = cb.checked;
        saveState();
      });
      const span = document.createElement("span");
      span.className = "lbl";
      span.innerHTML =
        "<strong>" +
        esc(it.label) +
        "</strong><span>" +
        esc(it.desc) +
        "</span>";
      lab.appendChild(cb);
      lab.appendChild(span);
      c.appendChild(lab);
    });
  }

  // ---- Timing --------------------------------------------------------------
  function phaseMinutes() {
    return PHASES.map((p) => {
      const v = parseInt(state[p.min], 10);
      return Number.isFinite(v) && v >= 0 ? v : null;
    });
  }
  function updateTimingDisplay() {
    const mins = phaseMinutes();
    const total = mins.reduce((a, b) => a + (b || 0), 0);
    const target = parseInt(state.duration, 10) || 0;
    if ($("timingTotal")) $("timingTotal").textContent = total;
    if ($("timingTarget")) $("timingTarget").textContent = target || "—";
    const st = $("timingStatus");
    if (!st) return;
    if (!target) {
      st.textContent =
        "Enter a total lesson length on Lesson Info to auto-distribute.";
      st.className = "muted";
    } else if (total === target) {
      st.innerHTML =
        '<span class="badge ok">Timing matches the lesson length.</span>';
    } else if (total === 0) {
      st.innerHTML =
        '<span class="badge warn">No phase minutes set. Use Auto-Distribute.</span>';
    } else {
      st.innerHTML =
        '<span class="badge warn">Phase minutes (' +
        total +
        ") differ from lesson length (" +
        target +
        ").</span>";
    }
  }
  function autoDistribute() {
    const target = parseInt(state.duration, 10);
    if (!Number.isFinite(target) || target <= 0) {
      alert("Set a total lesson length on the Lesson Info tab first.");
      return;
    }
    const totalW = PHASES.reduce((a, p) => a + p.w, 0);
    let assigned = 0;
    PHASES.forEach((p, i) => {
      let m;
      if (i === PHASES.length - 1) m = target - assigned;
      else {
        m = Math.round((p.w / totalW) * target);
        assigned += m;
      }
      state[p.min] = String(Math.max(0, m));
      if ($(p.min)) $(p.min).value = state[p.min];
    });
    saveState();
    updateTimingDisplay();
  }

  // ---- Plan composition (local deterministic) ------------------------------
  function selectedSupports() {
    const sped = SPED_PROFILES.filter((p) => state.spedSel[p.id]);
    const l1 = LEVEL1.filter((x) => state.l1Sel[x.id]);
    const l2 = LEVEL2.filter((x) => state.l2Sel[x.id]);
    return { sped, l1, l2 };
  }

  function phaseBlurb(key, supports) {
    // Default structured placeholders, lightly support-aware.
    const map = {
      opening:
        "Hook students and surface prior knowledge with a short warm-up tied to the learning target. Make the goal of the lesson visible.",
      mini: "Model the core concept with a worked example and a think-aloud. Name the steps explicitly and check for understanding before releasing.",
      guided:
        "Students practice collaboratively while the teacher circulates, prompts reasoning, and gives targeted feedback.",
      independent:
        "Students apply the skill independently or in stations. Provide a clear task, an answer-check routine, and a challenge option.",
      closure:
        "Consolidate learning with a brief exit ticket aligned to the success criteria. Use it to plan the next instructional move.",
    };
    let base = map[key];
    if (supports.l1.length && (key === "opening" || key === "mini")) {
      base +=
        " Embed Level 1 supports: " +
        supports.l1.map((x) => x.label.toLowerCase()).join(", ") +
        ".";
    }
    if (supports.l2.length && (key === "independent" || key === "guided")) {
      base +=
        " Offer Level 2 enrichment: " +
        supports.l2.map((x) => x.label.toLowerCase()).join(", ") +
        ".";
    }
    return base;
  }

  function buildPlanModel() {
    const supports = selectedSupports();
    const mins = phaseMinutes();
    const sessionPhases = PHASES.map((p, i) => {
      const note = (state[p.key] || "").trim();
      return {
        title: p.title,
        minutes: mins[i],
        inferred: !note,
        body: note || phaseBlurb(p.key, supports),
      };
    });
    return {
      title: (state.title || "").trim() || "Untitled Lesson " + INFER_TXT,
      unit: (state.unit || "").trim(),
      date: (state.date || "").trim(),
      teacher: (state.teacher || "").trim(),
      school: (state.school || "").trim(),
      grade: (state.grade || "").trim(),
      subject: (state.subject || "").trim(),
      duration: (state.duration || "").trim(),
      standards: state.standards.slice(),
      objective: (state.objective || "").trim(),
      successCriteria: lines(state.successCriteria),
      materials: lines(state.materials),
      teacherNotes: (state.teacherNotes || "").trim(),
      phases: sessionPhases,
      supports,
    };
  }

  function fld(val) {
    return val ? esc(val) : INFER;
  }

  function renderPlanHTML(m) {
    const metaBits = [];
    if (m.teacher) metaBits.push("Teacher: " + esc(m.teacher));
    if (m.school) metaBits.push(esc(m.school));
    if (m.grade) metaBits.push("Grade " + esc(m.grade));
    if (m.subject) metaBits.push(esc(m.subject));
    if (m.date) metaBits.push(esc(m.date));

    let h =
      "<h1>" +
      (m.title.includes(INFER_TXT)
        ? esc(m.title.replace(INFER_TXT, "")).trim() + " " + INFER
        : esc(m.title)) +
      "</h1>";
    h +=
      '<p class="lp-meta">' + (metaBits.join(" &middot; ") || INFER) + "</p>";

    // 1. Lesson Information
    h += sec(1, "Lesson Information", () => {
      let r = "<table class='lp-table'><tbody>";
      r += row("Title", fld(m.title.replace(INFER_TXT, "").trim()));
      r += row("Unit / topic", fld(m.unit));
      r += row(
        "Grade / subject",
        fld(
          [m.grade && "Grade " + m.grade, m.subject]
            .filter(Boolean)
            .join(" — "),
        ),
      );
      r += row("Date", fld(m.date));
      r += row("Duration", m.duration ? esc(m.duration) + " minutes" : INFER);
      r += "</tbody></table>";
      return r;
    });

    // 2. Standards and Learning Targets
    h += sec(2, "Standards and Learning Targets", () => {
      if (!m.standards.length)
        return '<p class="lp-p">' + INFER + " Add at least one standard.</p>";
      let r = '<ul class="lp-list">';
      m.standards.forEach((s) => {
        r +=
          "<li><strong>" +
          esc(s.code) +
          "</strong>" +
          (s.desc ? " — " + esc(s.desc) : "") +
          "</li>";
      });
      r += "</ul>";
      return r;
    });

    // 3. Objective and Success Criteria
    h += sec(3, "Lesson Objective and Student Success Criteria", () => {
      let r =
        '<p class="lp-p"><strong>Objective:</strong> ' +
        fld(m.objective) +
        "</p>";
      if (m.successCriteria.length) {
        r +=
          "<p class='lp-p'><strong>Success criteria:</strong></p><ul class='lp-list'>";
        m.successCriteria.forEach((c) => (r += "<li>" + esc(c) + "</li>"));
        r += "</ul>";
      } else {
        r +=
          "<p class='lp-p'><strong>Success criteria:</strong> " +
          INFER +
          "</p>";
      }
      return r;
    });

    // 4. Materials
    h += sec(4, "Materials and Preparation", () => {
      const mats = m.materials.length
        ? m.materials
        : ["Teacher slide deck " + INFER_TXT];
      let r = "<ul class='lp-list'>";
      mats.forEach(
        (x) =>
          (r +=
            "<li>" +
            (x.includes(INFER_TXT)
              ? esc(x.replace(INFER_TXT, "")).trim() + " " + INFER
              : esc(x)) +
            "</li>"),
      );
      r += "</ul>";
      return r;
    });

    // 5-9. Phases
    m.phases.forEach((p, i) => {
      h += sec(
        5 + i,
        p.title,
        () => {
          let r = "";
          r +=
            '<p class="lp-p">' +
            esc(p.body) +
            (p.inferred ? " " + INFER : "") +
            "</p>";
          return r;
        },
        p.minutes,
      );
    });

    // 10. Differentiation & Supports
    h += sec(
      10,
      "Differentiation, SPED/ESOL Supports, and Teacher Notes",
      () => {
        let r = "";
        const sp = m.supports;
        if (sp.sped.length) {
          r +=
            "<p class='lp-p'><strong>SPED supports (approved profiles):</strong></p><ul class='lp-list'>";
          sp.sped.forEach(
            (p) =>
              (r +=
                "<li><strong>" +
                esc(p.label) +
                ":</strong> " +
                esc(p.desc) +
                "</li>"),
          );
          r += "</ul>";
        }
        if (sp.l1.length) {
          r +=
            "<p class='lp-p'><strong>Level 1 supports (scaffolds):</strong></p><ul class='lp-list'>";
          sp.l1.forEach(
            (p) =>
              (r +=
                "<li><strong>" +
                esc(p.label) +
                ":</strong> " +
                esc(p.desc) +
                "</li>"),
          );
          r += "</ul>";
        }
        if (sp.l2.length) {
          r +=
            "<p class='lp-p'><strong>Level 2 enrichment:</strong></p><ul class='lp-list'>";
          sp.l2.forEach(
            (p) =>
              (r +=
                "<li><strong>" +
                esc(p.label) +
                ":</strong> " +
                esc(p.desc) +
                "</li>"),
          );
          r += "</ul>";
        }
        const needsSmallGroup = sp.sped.some((p) => /small group/.test(p.desc));
        if (needsSmallGroup) {
          r +=
            "<p class='lp-p'><strong>Small-group move:</strong> Pull a small group during Guided/Independent practice anchored to the same task (not a generic reteach).</p>";
        }
        if (m.teacherNotes)
          r +=
            "<p class='lp-p'><strong>Teacher notes:</strong> " +
            esc(m.teacherNotes) +
            "</p>";
        if (
          !sp.sped.length &&
          !sp.l1.length &&
          !sp.l2.length &&
          !m.teacherNotes
        ) {
          r +=
            "<p class='lp-p'>" +
            INFER +
            " No supports selected. Add SPED profiles or Level 1/2 supports on the Supports tab.</p>";
        }
        return r;
      },
    );

    return h;

    function sec(num, title, fn, minutes) {
      const m2 = Number.isFinite(minutes)
        ? '<span class="lp-mins">' + minutes + " min</span>"
        : "";
      return (
        '<section class="lp-sec"><h2 class="lp-h"><span class="lp-num">' +
        num +
        ".</span> " +
        esc(title) +
        m2 +
        "</h2>" +
        fn() +
        "</section>"
      );
    }
    function row(k, v) {
      return (
        "<tr><th style='width:34%'>" + esc(k) + "</th><td>" + v + "</td></tr>"
      );
    }
  }

  // ---- Markdown export -----------------------------------------------------
  function renderPlanMarkdown(m) {
    const out = [];
    out.push(
      "# " +
        m.title.replace(INFER_TXT, "").trim() +
        (m.title.includes(INFER_TXT) ? " " + INFER_TXT : ""),
    );
    const meta = [
      m.teacher && "**Teacher:** " + m.teacher,
      m.school,
      m.grade && "Grade " + m.grade,
      m.subject,
      m.date,
    ]
      .filter(Boolean)
      .join("  \n");
    if (meta) out.push("", meta);

    const I = (v) => (v ? v : INFER_TXT);

    out.push("", "## 1. Lesson Information");
    out.push("- **Title:** " + I(m.title.replace(INFER_TXT, "").trim()));
    out.push("- **Unit / topic:** " + I(m.unit));
    out.push(
      "- **Grade / subject:** " +
        I(
          [m.grade && "Grade " + m.grade, m.subject]
            .filter(Boolean)
            .join(" — "),
        ),
    );
    out.push("- **Date:** " + I(m.date));
    out.push(
      "- **Duration:** " + (m.duration ? m.duration + " minutes" : INFER_TXT),
    );

    out.push("", "## 2. Standards and Learning Targets");
    if (m.standards.length)
      m.standards.forEach((s) =>
        out.push("- **" + s.code + "**" + (s.desc ? " — " + s.desc : "")),
      );
    else out.push("- " + INFER_TXT);

    out.push("", "## 3. Lesson Objective and Student Success Criteria");
    out.push("**Objective:** " + I(m.objective));
    out.push("", "**Success criteria:**");
    if (m.successCriteria.length)
      m.successCriteria.forEach((c) => out.push("- " + c));
    else out.push("- " + INFER_TXT);

    out.push("", "## 4. Materials and Preparation");
    (m.materials.length
      ? m.materials
      : ["Teacher slide deck " + INFER_TXT]
    ).forEach((x) => out.push("- " + x));

    m.phases.forEach((p, i) => {
      out.push(
        "",
        "## " +
          (5 + i) +
          ". " +
          p.title +
          (Number.isFinite(p.minutes) ? " (" + p.minutes + " min)" : ""),
      );
      out.push(p.body + (p.inferred ? " " + INFER_TXT : ""));
    });

    out.push(
      "",
      "## 10. Differentiation, SPED/ESOL Supports, and Teacher Notes",
    );
    const sp = m.supports;
    if (sp.sped.length) {
      out.push("**SPED supports (approved profiles):**");
      sp.sped.forEach((p) => out.push("- **" + p.label + ":** " + p.desc));
    }
    if (sp.l1.length) {
      out.push("", "**Level 1 supports (scaffolds):**");
      sp.l1.forEach((p) => out.push("- **" + p.label + ":** " + p.desc));
    }
    if (sp.l2.length) {
      out.push("", "**Level 2 enrichment:**");
      sp.l2.forEach((p) => out.push("- **" + p.label + ":** " + p.desc));
    }
    if (m.teacherNotes) out.push("", "**Teacher notes:** " + m.teacherNotes);
    if (!sp.sped.length && !sp.l1.length && !sp.l2.length && !m.teacherNotes)
      out.push("- " + INFER_TXT);

    return out.join("\n");
  }

  // ---- Validation ----------------------------------------------------------
  function validate(m) {
    const warns = [];
    if (m.title.includes(INFER_TXT)) warns.push("Lesson title missing.");
    if (!m.standards.length)
      warns.push(
        "No standards added (standards are the instructional anchor).",
      );
    if (!m.objective) warns.push("No learning objective.");
    if (!m.successCriteria.length) warns.push("No success criteria.");
    const total = m.phases.reduce((a, p) => a + (p.minutes || 0), 0);
    const target = parseInt(m.duration, 10) || 0;
    if (target && total && total !== target)
      warns.push(
        "Phase minutes (" +
          total +
          ") differ from lesson length (" +
          target +
          ").",
      );
    const inferredPhases = m.phases.filter((p) => p.inferred).length;
    if (inferredPhases)
      warns.push(
        inferredPhases +
          " phase(s) used a placeholder — review marked [INFERRED - VERIFY] text.",
      );
    return warns;
  }

  // ---- Generate ------------------------------------------------------------
  let lastMarkdown = "";
  async function generate() {
    const m = buildPlanModel();
    const out = $("lessonOutput");
    const status = $("validationStatus");
    let html = "";

    if (settings.mode === "api" && settings.apiUrl.trim()) {
      const apiUrl = settings.apiUrl.trim();
      let parsedUrl;
      try {
        parsedUrl = new URL(apiUrl);
      } catch (_) {
        parsedUrl = null;
      }
      if (!parsedUrl || parsedUrl.protocol !== "https:") {
        status.innerHTML =
          '<span class="badge warn">AI endpoint must be a valid https:// URL — using local generation.</span>';
        // fall through to local generation below
      } else {
        status.innerHTML = `<span class="badge info">Contacting AI endpoint (${esc(parsedUrl.origin)})…</span>`;
        try {
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: m }),
          });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          if (data && (data.html || data.markdown)) {
            html = data.html || "<pre>" + esc(data.markdown) + "</pre>";
            lastMarkdown = data.markdown || renderPlanMarkdown(m);
            out.innerHTML = html;
            status.innerHTML =
              '<span class="badge ok">Generated via AI endpoint.</span>';
            return;
          }
          throw new Error("Endpoint returned no html/markdown");
        } catch (e) {
          status.innerHTML =
            '<span class="badge warn">AI endpoint unavailable (' +
            esc(e.message) +
            "). Fell back to local generation.</span> ";
        }
      }
    }

    // Local deterministic generation (default + fallback)
    html = renderPlanHTML(m);
    lastMarkdown = renderPlanMarkdown(m);
    out.innerHTML = html;
    const warns = validate(m);
    if (warns.length) {
      status.innerHTML +=
        '<span class="badge warn">' +
        warns.length +
        " item(s) to review</span> " +
        "<ul class='tight muted' style='margin-top:8px'>" +
        warns.map((w) => "<li>" + esc(w) + "</li>").join("") +
        "</ul>";
    } else {
      status.innerHTML +=
        '<span class="badge ok">Plan complete — all key fields present.</span>';
    }
  }

  // ==========================================================================
  // QUICK GENERATE — two input modes that fill the SAME locked-in state model
  // then route through the existing local deterministic pipeline (generate()).
  //
  //  Mode A "type": teacher pastes a free-text description of the lesson.
  //  Mode B "upload": teacher uploads a .pptx (parsed locally via self-hosted
  //                   JSZip) or a .txt; we extract slide text, then map it.
  //
  // Both paths run mapTextToState(), which mirrors the deterministic heuristics
  // of the source Python project (codex-lesson-plan-generator): standards from
  // standard codes, phase mapping by markers (opening/mini/guided/independent/
  // closure), support detection (SPED Profiles A-G, Level 1/2). Missing fields
  // are left blank so the renderer marks them [INFERRED - VERIFY].
  // ==========================================================================

  let quickMode = "type";

  function setQuickMode(mode) {
    quickMode = mode === "upload" ? "upload" : "type";
    const typeCard = $("quickType");
    const upCard = $("quickUpload");
    if (typeCard) typeCard.style.display = quickMode === "type" ? "" : "none";
    if (upCard) upCard.style.display = quickMode === "upload" ? "" : "none";
    document.querySelectorAll(".mode-tab").forEach((b) => {
      const on = b.dataset.mode === quickMode;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  // --- PPTX text extraction (client-side, JSZip) ----------------------------
  // A .pptx is a zip. Slide text lives in ppt/slides/slideN.xml inside <a:t>.
  async function extractPptxText(file) {
    if (typeof JSZip === "undefined") {
      throw new Error(
        "Slide reader (JSZip) failed to load. Paste slide text instead.",
      );
    }
    const zip = await JSZip.loadAsync(file);
    // Collect slide files and sort by numeric slide index.
    const slideFiles = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = parseInt(a.replace(/\D+/g, ""), 10);
        const nb = parseInt(b.replace(/\D+/g, ""), 10);
        return na - nb;
      });
    if (!slideFiles.length) {
      throw new Error("No slides found in this .pptx file.");
    }
    const out = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.files[slideFiles[i]].async("string");
      // Pull text runs. Runs inside the same paragraph join with no space;
      // separate paragraphs / runs with spaces, then collapse.
      const runs = xml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
      const text = runs
        .map((r) =>
          r
            .replace(/<a:t>/, "")
            .replace(/<\/a:t>/, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'"),
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      out.push("--- Slide " + (i + 1) + " ---" + (text ? "\n" + text : ""));
    }
    return { count: slideFiles.length, text: out.join("\n\n") };
  }

  // --- Free-text / slide-text -> state model --------------------------------
  // Recognizes optional "Label: value" lines and otherwise classifies content
  // into the correct lesson phase using the same marker families as the source.
  const FIELD_LABELS = [
    { keys: ["title", "lesson title", "lesson"], set: "title" },
    { keys: ["unit", "topic", "unit / topic"], set: "unit" },
    { keys: ["grade", "grade level"], set: "grade" },
    { keys: ["subject", "content area"], set: "subject" },
    { keys: ["teacher"], set: "teacher" },
    { keys: ["school"], set: "school" },
    { keys: ["date"], set: "date" },
    {
      keys: ["duration", "minutes", "lesson length", "time"],
      set: "duration",
    },
    {
      keys: ["objective", "learning target", "target", "goal", "aim"],
      set: "objective",
    },
    {
      keys: ["success criteria", "i can", "criteria"],
      set: "successCriteria",
      append: true,
    },
    { keys: ["materials", "materials and preparation"], set: "materials" },
    {
      keys: [
        "opening",
        "warm-up",
        "warm up",
        "launch",
        "do now",
        "bell ringer",
      ],
      set: "opening",
    },
    {
      keys: [
        "mini-lesson",
        "mini lesson",
        "modeling",
        "model",
        "direct instruction",
        "concept development",
      ],
      set: "mini",
    },
    {
      keys: [
        "guided practice",
        "guided",
        "collaborative",
        "we do",
        "turn and talk",
        "partner",
      ],
      set: "guided",
    },
    {
      keys: [
        "independent practice",
        "independent",
        "stations",
        "application",
        "you do",
        "on your own",
      ],
      set: "independent",
    },
    {
      keys: ["closure", "exit ticket", "assessment", "summary", "wrap-up"],
      set: "closure",
    },
    { keys: ["supports", "support", "differentiation"], set: "_supports" },
    { keys: ["notes", "teacher notes"], set: "teacherNotes" },
    { keys: ["standard", "standards", "standard code"], set: "_standard" },
  ];

  // Marker families for classifying unlabeled lines (mirrors source extract).
  const PHASE_MARKERS = {
    opening: [
      "do now",
      "warm-up",
      "warm up",
      "launch",
      "bell ringer",
      "notice",
      "wonder",
      "hook",
      "this or that",
    ],
    mini: [
      "mini-lesson",
      "mini lesson",
      "model",
      "i do",
      "vocabulary",
      "define",
      "introduce",
      "concept",
      "example",
      "demonstrate",
    ],
    guided: [
      "guided practice",
      "we do",
      "turn and talk",
      "partner",
      "collaborate",
      "discuss",
      "check for understanding",
      "together",
    ],
    independent: [
      "independent",
      "on your own",
      "station",
      "practice set",
      "apply",
      "workspace",
      "workbook",
      "you do",
      "problem set",
    ],
    closure: [
      "exit ticket",
      "closure",
      "summarize",
      "summary",
      "wrap-up",
      "reflect",
      "final check",
    ],
  };

  // Standard code patterns: e.g. 6.G.A.1, MA.6.GR.1.1, CCSS.6.NS.1, RL.6.2
  const STANDARD_RE =
    /\b([A-Z]{0,5}\.?\d{1,2}\.[A-Z]{1,4}(?:\.[A-Z0-9]{1,4}){0,3})\b/g;

  function detectStandards(text) {
    const found = [];
    const seen = {};
    const m = text.match(STANDARD_RE) || [];
    m.forEach((code) => {
      const c = code.replace(/^\.+|\.+$/g, "");
      if (!seen[c] && /\d/.test(c) && c.length >= 4) {
        seen[c] = true;
        found.push(c);
      }
    });
    return found;
  }

  function classifyPhase(line) {
    const low = line.toLowerCase();
    let best = null;
    let bestScore = 0;
    Object.keys(PHASE_MARKERS).forEach((phase) => {
      let score = 0;
      PHASE_MARKERS[phase].forEach((mk) => {
        if (low.includes(mk)) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        best = phase;
      }
    });
    return bestScore > 0 ? best : null;
  }

  // Map free text or slide text into the locked-in state model.
  function mapTextToState(rawText, opts) {
    opts = opts || {};
    const acc = {
      title: "",
      unit: "",
      grade: "",
      subject: "",
      teacher: "",
      school: "",
      date: "",
      duration: "",
      objective: "",
      successCriteria: [],
      materials: [],
      teacherNotes: "",
      opening: [],
      mini: [],
      guided: [],
      independent: [],
      closure: [],
      standards: [],
      spedSel: {},
      l1Sel: {},
      l2Sel: {},
    };

    const rawLines = String(rawText || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !/^---\s*slide/i.test(s));

    const PHASE_KEYS = ["opening", "mini", "guided", "independent", "closure"];

    rawLines.forEach((line) => {
      // Try "Label: value"
      const colon = line.match(/^([A-Za-z][A-Za-z /&'-]{1,30}?)\s*:\s*(.+)$/);
      let handled = false;
      if (colon) {
        const label = colon[1].trim().toLowerCase();
        const value = colon[2].trim();
        for (const f of FIELD_LABELS) {
          if (f.keys.includes(label)) {
            if (f.set === "_standard") {
              const codes = detectStandards(value);
              if (codes.length) {
                // value may be "6.G.A.1 — description"
                const desc = value
                  .replace(STANDARD_RE, "")
                  .replace(/^[\s—–:-]+/, "")
                  .trim();
                codes.forEach((c, idx) =>
                  acc.standards.push({ code: c, desc: idx === 0 ? desc : "" }),
                );
              } else {
                acc.standards.push({ code: value, desc: "" });
              }
            } else if (f.set === "_supports") {
              applySupportText(acc, value);
            } else if (PHASE_KEYS.includes(f.set)) {
              acc[f.set].push(value);
            } else if (f.set === "successCriteria") {
              value
                .split(/;|•|·/)
                .map((x) => x.trim())
                .filter(Boolean)
                .forEach((x) => acc.successCriteria.push(x));
            } else if (f.set === "materials") {
              value
                .split(/,|;|•|·/)
                .map((x) => x.trim())
                .filter(Boolean)
                .forEach((x) => acc.materials.push(x));
            } else if (!acc[f.set]) {
              acc[f.set] = value;
            }
            handled = true;
            break;
          }
        }
      }
      if (handled) return;

      // Unlabeled line: detect inline standards + supports, then classify phase.
      detectStandards(line).forEach((c) => {
        if (!acc.standards.some((s) => s.code === c))
          acc.standards.push({ code: c, desc: "" });
      });
      applySupportText(acc, line, true);

      const phase = classifyPhase(line);
      if (phase) {
        acc[phase].push(line);
      } else if (opts.collectExtra) {
        opts.extra.push(line);
      }
    });

    // First non-empty content line becomes the title if none labeled.
    if (!acc.title && rawLines.length) {
      const cand = rawLines.find(
        (l) => !/^[A-Za-z][A-Za-z /&'-]{1,30}?\s*:/.test(l),
      );
      acc.title = (cand || rawLines[0]).slice(0, 90);
    }

    return acc;
  }

  // Detect approved supports referenced in text. quiet=true avoids noise.
  function applySupportText(acc, text, quiet) {
    const low = " " + text.toLowerCase() + " ";
    // SPED Profiles A-G by explicit "Profile X"
    SPED_PROFILES.forEach((p) => {
      const re = new RegExp("profile\\s*" + p.id.toLowerCase() + "\\b");
      if (re.test(low)) acc.spedSel[p.id] = true;
    });
    // Level 1 / Level 2 by keyword
    const L1_KW = {
      l1_vocab: ["vocabulary", "word bank", "definition", "preteach"],
      l1_starters: ["sentence starter", "sentence frame", "frames"],
      l1_partner: ["partner talk", "turn and talk", "turn-and-talk"],
      l1_visual: ["visual", "diagram", "anchor chart", "color-cod"],
      l1_directions: [
        "repeated direction",
        "clarified direction",
        "repeat directions",
      ],
      l1_chunk: ["chunk", "smaller steps", "break the task"],
    };
    const L2_KW = {
      l2_extend: ["extension", "challenge", "early finisher", "enrichment"],
      l2_explain: ["justify", "critique", "explain reasoning", "evaluate"],
      l2_apply: ["real-world", "real world", "novel context", "application"],
    };
    Object.keys(L1_KW).forEach((id) => {
      if (L1_KW[id].some((kw) => low.includes(kw))) acc.l1Sel[id] = true;
    });
    Object.keys(L2_KW).forEach((id) => {
      if (L2_KW[id].some((kw) => low.includes(kw))) acc.l2Sel[id] = true;
    });
  }

  // Commit a parsed acc object into the live state, then generate + show plan.
  function commitParsedToState(acc, sourceLabel) {
    const join = (arr) => arr.filter(Boolean).join(" ");
    state = {
      standards: acc.standards.slice(),
      spedSel: acc.spedSel,
      l1Sel: acc.l1Sel,
      l2Sel: acc.l2Sel,
      title: acc.title || "",
      unit: acc.unit || "",
      date: acc.date || "",
      teacher: acc.teacher || "",
      school: acc.school || "",
      grade: acc.grade || "",
      subject: acc.subject || "",
      duration: (acc.duration || "").replace(/[^\d]/g, ""),
      materials: acc.materials.join("\n"),
      objective: acc.objective || "",
      successCriteria: acc.successCriteria.join("\n"),
      teacherNotes:
        (acc.teacherNotes ? acc.teacherNotes + "\n" : "") +
        "Generated from " +
        sourceLabel +
        ". Review all [INFERRED - VERIFY] items.",
      opening: join(acc.opening),
      mini: join(acc.mini),
      guided: join(acc.guided),
      independent: join(acc.independent),
      closure: join(acc.closure),
    };
    saveState();
    // Auto-distribute timing if a duration was provided, else leave blank.
    if (state.duration) autoDistribute();
    hydrateAll();
    showTab("plan");
    generate();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function quickStatus(html, kind) {
    const el = $("quickStatus");
    if (!el) return;
    const badge = kind
      ? '<span class="badge ' + kind + '">' + html + "</span>"
      : html;
    el.innerHTML = badge;
  }

  function generateFromType() {
    const txt = ($("quickText") && $("quickText").value) || "";
    if (!txt.trim()) {
      quickStatus("Type or paste a lesson description first.", "warn");
      return;
    }
    const acc = mapTextToState(txt);
    commitParsedToState(acc, "typed description");
    quickStatus("Full plan generated from your description.", "ok");
  }

  function generateFromUpload() {
    const txt = ($("slideText") && $("slideText").value) || "";
    if (!txt.trim()) {
      quickStatus(
        "Choose a .pptx/.txt file or paste slide text first.",
        "warn",
      );
      return;
    }
    const acc = mapTextToState(txt);
    commitParsedToState(acc, "uploaded slides");
    quickStatus("Full plan generated from your slides.", "ok");
  }

  async function handleSlideFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    $("fileStatus").textContent = "Reading " + file.name + "…";
    try {
      let text = "";
      if (name.endsWith(".pptx")) {
        const res = await extractPptxText(file);
        text = res.text;
        $("fileStatus").textContent =
          file.name + " — " + res.count + " slides read.";
      } else if (name.endsWith(".txt")) {
        text = await file.text();
        $("fileStatus").textContent = file.name + " — text loaded.";
      } else {
        $("fileStatus").textContent = "Unsupported file. Use .pptx or .txt.";
        return;
      }
      if ($("slideText")) $("slideText").value = text;
      quickStatus(
        "Slide text extracted. Review it, then press Generate Full Plan.",
        "info",
      );
    } catch (e) {
      $("fileStatus").textContent = "Could not read file: " + e.message;
      quickStatus("Could not read file: " + esc(e.message), "warn");
    }
  }

  const QUICK_SAMPLE_TEXT = [
    "Topic: Area of Composite Polygons",
    "Unit: Unit 5 — Geometry",
    "Standard: 6.G.A.1 — find area of polygons by composing and decomposing",
    "Grade: 6   Subject: Mathematics   Duration: 55",
    "Objective: Students will find the area of composite polygons by decomposing them into rectangles and triangles.",
    "Success criteria: I can decompose a composite shape; I can add the sub-areas; I can explain my reasoning with units.",
    "Materials: Teacher slide deck, grid paper, rulers, exit ticket slips",
    "Opening: Number talk — how many ways can we split an L-shape? Quick visual hook.",
    "Mini-lesson: Model decomposing an L-shape into two rectangles; think-aloud on choosing cuts and tracking units.",
    "Guided practice: Partners solve two composite shapes on grid paper; teacher circulates and prompts reasoning.",
    "Independent practice: Practice set 1-6; challenge problem for early finishers.",
    "Closure: Exit ticket — one composite shape, find the area and explain the cut.",
    "Supports: Profile C, Profile E, sentence starters, visuals, extension challenge",
  ].join("\n");

  // ---- Sample data ---------------------------------------------------------
  function loadSample() {
    state = {
      title: "Area of Composite Polygons",
      unit: "Unit 5: Geometry",
      date: new Date().toISOString().slice(0, 10),
      teacher: "Mr. Neft",
      school: "Example Middle School",
      grade: "6",
      subject: "Mathematics",
      duration: "55",
      materials: "Teacher slide deck\nGrid paper\nRulers\nExit ticket slips",
      objective:
        "Students will find the area of composite polygons by decomposing them into rectangles and triangles.",
      successCriteria:
        "I can decompose a composite shape into known shapes.\nI can find and add the sub-areas correctly.\nI can explain my reasoning with correct units.",
      teacherNotes:
        "Watch for unit errors. Pre-seat partners. Have manipulatives ready.",
      opening:
        "Number talk: how many ways can we split an L-shape? Quick visual hook with a floor-plan image.",
      mini: "Model decomposing an L-shape into two rectangles; think-aloud on choosing cuts and tracking units.",
      guided:
        "Partners solve two composite shapes on grid paper; teacher circulates and prompts reasoning.",
      independent:
        "Practice set 1-6; challenge problem (composite with a triangle) for early finishers.",
      closure:
        "Exit ticket: one composite shape — find the area and explain the cut you used.",
      openingMin: "8",
      miniMin: "15",
      guidedMin: "12",
      independentMin: "13",
      closureMin: "7",
      standards: [
        {
          code: "6.G.A.1",
          desc: "Find area of triangles and polygons by composing/decomposing",
        },
      ],
      spedSel: { C: true, E: true },
      l1Sel: { l1_vocab: true, l1_starters: true, l1_visual: true },
      l2Sel: { l2_extend: true },
    };
    saveState();
    hydrateAll();
    showTab("info");
  }

  // ---- Settings actions ----------------------------------------------------
  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    download(blob, "neft-lesson-plan-inputs.json");
    $("settingsStatus").textContent = "Inputs exported.";
  }
  function importJson(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        state = Object.assign(
          { standards: [], spedSel: {}, l1Sel: {}, l2Sel: {} },
          data,
        );
        saveState();
        hydrateAll();
        $("settingsStatus").textContent = "Inputs imported.";
      } catch (e) {
        $("settingsStatus").textContent = "Import failed: " + e.message;
      }
    };
    r.readAsText(file);
  }
  function clearData() {
    if (!confirm("Clear all saved lesson inputs in this browser?")) return;
    localStorage.removeItem(LP_KEY);
    state = { standards: [], spedSel: {}, l1Sel: {}, l2Sel: {} };
    hydrateAll();
    $("settingsStatus").textContent = "Local data cleared.";
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---- Theme ---------------------------------------------------------------
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
  }
  function toggleTheme() {
    const cur =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    applyTheme(cur);
  }

  // ---- Hydrate -------------------------------------------------------------
  function hydrateAll() {
    TEXT_FIELDS.forEach((id) => {
      const el = $(id);
      if (el) el.value = state[id] != null ? state[id] : "";
    });
    renderStandards();
    renderChecklist("spedList", SPED_PROFILES, state.spedSel);
    renderChecklist("level1List", LEVEL1, state.l1Sel);
    renderChecklist("level2List", LEVEL2, state.l2Sel);
    updateTimingDisplay();
    $("genMode").value = settings.mode;
    $("apiUrl").value = settings.apiUrl;
    updateModeBadge();
  }

  // ---- Init ----------------------------------------------------------------
  function init() {
    applyTheme(localStorage.getItem(THEME_KEY) || "light");
    bindFields();
    hydrateAll();

    document
      .querySelectorAll(".nav button")
      .forEach((b) =>
        b.addEventListener("click", () => showTab(b.dataset.tab)),
      );
    document
      .querySelectorAll("[data-go]")
      .forEach((b) => b.addEventListener("click", () => showTab(b.dataset.go)));

    // Quick Generate wiring
    document
      .querySelectorAll(".mode-tab")
      .forEach((b) =>
        b.addEventListener("click", () => setQuickMode(b.dataset.mode)),
      );
    if ($("quickGenTypeBtn"))
      $("quickGenTypeBtn").addEventListener("click", generateFromType);
    if ($("quickGenUploadBtn"))
      $("quickGenUploadBtn").addEventListener("click", generateFromUpload);
    if ($("quickFillSampleBtn"))
      $("quickFillSampleBtn").addEventListener("click", () => {
        if ($("quickText")) $("quickText").value = QUICK_SAMPLE_TEXT;
      });
    if ($("chooseFileBtn"))
      $("chooseFileBtn").addEventListener("click", () =>
        $("slideFile").click(),
      );
    if ($("slideFile"))
      $("slideFile").addEventListener(
        "change",
        (e) => e.target.files[0] && handleSlideFile(e.target.files[0]),
      );
    const dz = $("dropzone");
    if (dz) {
      ["dragenter", "dragover"].forEach((ev) =>
        dz.addEventListener(ev, (e) => {
          e.preventDefault();
          dz.classList.add("dragover");
        }),
      );
      ["dragleave", "drop"].forEach((ev) =>
        dz.addEventListener(ev, (e) => {
          e.preventDefault();
          dz.classList.remove("dragover");
        }),
      );
      dz.addEventListener("drop", (e) => {
        const f = e.dataTransfer && e.dataTransfer.files[0];
        if (f) handleSlideFile(f);
      });
      dz.addEventListener("click", (e) => {
        if (e.target === dz) $("slideFile").click();
      });
    }

    $("addStandardBtn").addEventListener("click", addStandard);
    $("standardDesc").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addStandard();
      }
    });
    $("autoTimeBtn").addEventListener("click", autoDistribute);
    $("loadSampleBtn").addEventListener("click", loadSample);
    $("generateBtn").addEventListener("click", generate);
    $("printBtn").addEventListener("click", () => {
      if (!lastMarkdown) generate();
      setTimeout(() => window.print(), 50);
    });
    $("copyMdBtn").addEventListener("click", async () => {
      if (!lastMarkdown) generate();
      try {
        await navigator.clipboard.writeText(lastMarkdown);
        $("validationStatus").innerHTML =
          '<span class="badge ok">Markdown copied.</span>';
      } catch (e) {
        $("validationStatus").innerHTML =
          '<span class="badge warn">Copy failed — use Download .md.</span>';
      }
    });
    $("downloadMdBtn").addEventListener("click", () => {
      if (!lastMarkdown) generate();
      download(
        new Blob([lastMarkdown], { type: "text/markdown" }),
        "neft-lesson-plan.md",
      );
    });

    $("genMode").addEventListener("change", () => {
      settings.mode = $("genMode").value;
      saveSettings();
    });
    $("apiUrl").addEventListener("input", () => {
      settings.apiUrl = $("apiUrl").value;
      saveSettings();
    });
    $("exportJsonBtn").addEventListener("click", exportJson);
    $("importJsonBtn").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener(
      "change",
      (e) => e.target.files[0] && importJson(e.target.files[0]),
    );
    $("clearBtn").addEventListener("click", clearData);
    $("themeBtn").addEventListener("click", toggleTheme);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
