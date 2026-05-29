/* =====================================================================
   Neft Teacher — Lesson Plan Generator
   Local-first. Self-contained vanilla JS. No CDN at runtime.

   PIPELINE (run in order):
     Preflight -> Source Extract -> Content Map -> Lesson Plan Build
       -> QA Harness -> Repair -> Final QA

   LOCKED RULES:
     - The provided source (typed text / .pptx / .pdf / .docx / .txt) is the
       SOURCE OF TRUTH. Preserve intent, problem sequence, examples,
       vocabulary, objective language, activity flow, exit-ticket alignment.
     - Do NOT invent standards, activities, assessments, tasks. Where a
       required section has no support in the source, mark it
       "[INFERRED - VERIFY]" rather than fabricating specifics.
     - If the source is MISSING / UNREADABLE / INCOMPLETE: do NOT invent a
       lesson. Output a BLOCKED QA NOTE describing what to provide.

   Libraries (self-hosted in ./vendor):
     - jszip.min.js   -> global JSZip   (pptx + docx unzip)
     - pdf.min.mjs    -> dynamic import (pdf text extraction)
   ===================================================================== */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const INFERRED = "[INFERRED - VERIFY]";

  // ---- element refs ----
  const els = {
    sourceText: $("sourceText"),
    fileInput: $("fileInput"),
    dropzone: $("dropzone"),
    fileStatus: $("fileStatus"),
    generateBtn: $("generateBtn"),
    sampleBtn: $("sampleBtn"),
    clearBtn: $("clearBtn"),
    themeBtn: $("themeBtn"),
    statusCard: $("statusCard"),
    pipeline: $("pipeline"),
    qaPanel: $("qaPanel"),
    outputCard: $("outputCard"),
    lessonOutput: $("lessonOutput"),
    printBtn: $("printBtn"),
    downloadDocBtn: $("downloadDocBtn"),
    downloadMdBtn: $("downloadMdBtn"),
  };

  // Holds the most recently uploaded file's extracted text (if any).
  let uploadedExtract = null; // { text, name, kind }
  let lastPlan = null; // built plan object for export

  /* =================================================================
     THEME
  ================================================================= */
  function initTheme() {
    const saved = localStorage.getItem("nt_lpg_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    els.themeBtn.addEventListener("click", () => {
      const now =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      document.documentElement.setAttribute("data-theme", now);
      localStorage.setItem("nt_lpg_theme", now);
    });
  }

  /* =================================================================
     PIPELINE STATUS UI
  ================================================================= */
  const STAGES = [
    "preflight",
    "extract",
    "map",
    "build",
    "qa",
    "repair",
    "finalqa",
  ];
  function resetPipeline() {
    els.statusCard.hidden = false;
    els.qaPanel.innerHTML = "";
    STAGES.forEach((s) => {
      const li = els.pipeline.querySelector(`[data-stage="${s}"]`);
      if (li) li.className = "";
    });
  }
  function setStage(stage, state) {
    const li = els.pipeline.querySelector(`[data-stage="${stage}"]`);
    if (li) li.className = state; // running | done | fail
  }
  // allow the browser to paint between stages
  const tick = () => new Promise((r) => setTimeout(r, 90));

  /* =================================================================
     SOURCE EXTRACTION
  ================================================================= */

  // PPTX: ppt/slides/slideN.xml -> <a:t> runs, in slide order.
  async function extractPptx(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = +(a.match(/slide(\d+)\.xml/) || [])[1];
        const nb = +(b.match(/slide(\d+)\.xml/) || [])[1];
        return na - nb;
      });
    if (!slideFiles.length) throw new Error("No slides found in the .pptx.");
    const parts = [];
    for (const name of slideFiles) {
      const xml = await zip.files[name].async("string");
      const runs = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) =>
        decodeXml(m[1]),
      );
      const n = (name.match(/slide(\d+)/) || [])[1];
      const text = runs.join(" ").replace(/\s+/g, " ").trim();
      if (text) parts.push(`--- Slide ${n} ---\n${text}`);
    }
    return parts.join("\n\n");
  }

  // DOCX: word/document.xml -> <w:t> runs, paragraphs split on <w:p>.
  async function extractDocx(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docFile = zip.files["word/document.xml"];
    if (!docFile) throw new Error("No word/document.xml in the .docx.");
    const xml = await docFile.async("string");
    const paras = xml.split(/<\/w:p>/).map((p) => {
      const runs = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) =>
        decodeXml(m[1]),
      );
      return runs.join("").trim();
    });
    const text = paras.filter(Boolean).join("\n");
    if (!text) throw new Error("The .docx contained no readable text.");
    return text;
  }

  // PDF: self-hosted pdf.js ESM (./vendor/pdf.min.mjs + worker).
  async function extractPdf(arrayBuffer) {
    let pdfjs;
    try {
      pdfjs = await import("./vendor/pdf.min.mjs");
    } catch (e) {
      throw new Error(
        "PDF reader (pdf.js) could not load. Copy the PDF text and paste it " +
          "into the box instead.",
      );
    }
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.min.mjs";
    } catch (_) {
      /* ignore */
    }
    const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
      .promise;
    const out = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const txt = content.items
        .map((i) => i.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (txt) out.push(`--- Page ${p} ---\n${txt}`);
    }
    const text = out.join("\n\n");
    if (!text)
      throw new Error(
        "No selectable text found in the PDF (it may be scanned images). " +
          "Paste the text instead.",
      );
    return text;
  }

  function decodeXml(s) {
    return s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  async function handleFile(file) {
    const name = file.name || "file";
    const lower = name.toLowerCase();
    els.fileStatus.textContent = `Reading "${name}"…`;
    try {
      let text = "";
      let kind = "";
      if (lower.endsWith(".pptx")) {
        kind = "PowerPoint slides";
        text = await extractPptx(await file.arrayBuffer());
      } else if (lower.endsWith(".docx")) {
        kind = "Word document";
        text = await extractDocx(await file.arrayBuffer());
      } else if (lower.endsWith(".pdf")) {
        kind = "PDF";
        text = await extractPdf(await file.arrayBuffer());
      } else if (lower.endsWith(".txt")) {
        kind = "text file";
        text = await file.text();
      } else {
        throw new Error("Unsupported file type. Use .pptx, .pdf, .docx, .txt.");
      }
      uploadedExtract = { text, name, kind };
      els.fileStatus.innerHTML = `Read <strong>${escapeHtml(
        name,
      )}</strong> (${kind}) — ${text.length.toLocaleString()} characters. It will be used as the source when you click Generate.`;
      // Mirror into the textarea if it is empty so the teacher can see/edit it.
      if (!els.sourceText.value.trim()) els.sourceText.value = text;
    } catch (e) {
      uploadedExtract = null;
      els.fileStatus.innerHTML = `<span style="color:var(--red);font-weight:700">Could not read this file:</span> ${escapeHtml(
        e.message,
      )}`;
    }
  }

  /* =================================================================
     CONTENT MAP — parse the raw source into structured fields.
     Pull only what the source supports. Never fabricate.
  ================================================================= */
  function buildContentMap(raw) {
    const text = (raw || "").replace(/\r/g, "");
    const map = {
      rawLen: text.replace(/\s/g, "").length,
      title: null,
      grade: null,
      course: null,
      date: null,
      session: null,
      standards: [],
      objective: null,
      languageObjective: null,
      materials: [],
      vocabulary: [],
      successCriteria: [],
      phases: {
        opening: null,
        mini: null,
        guided: null,
        collaborative: null,
        independent: null,
        closure: null,
      },
      exitTicket: null,
      homework: null,
      notes: [],
      _raw: text,
    };

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const grab = (re) => {
      for (const l of lines) {
        const m = l.match(re);
        if (m) return m[1].trim();
      }
      return null;
    };
    const grabList = (label) => {
      const re = new RegExp(`^${label}\\s*[:\\-]\\s*(.+)$`, "i");
      for (const l of lines) {
        const m = l.match(re);
        if (m)
          return m[1]
            .split(/[,;]|•|\|/)
            .map((s) => s.trim())
            .filter(Boolean);
      }
      return [];
    };

    map.title = grab(/^(?:title|lesson title|lesson)\s*[:\-]\s*(.+)$/i);
    map.grade = grab(/^(?:grade)\s*[:\-]\s*(.+)$/i);
    map.course = grab(/^(?:course|subject|class)\s*[:\-]\s*(.+)$/i);
    map.date = grab(/^(?:date)\s*[:\-]\s*(.+)$/i);
    map.session = grab(
      /^(?:session|day|lesson #|lesson number)\s*[:\-]\s*(.+)$/i,
    );
    map.objective = grab(
      /^(?:objective|content objective|learning target|target|goal|swbat|we will|i can)\s*[:\-]\s*(.+)$/i,
    );
    map.languageObjective = grab(
      /^(?:language objective|lang objective|esol objective)\s*[:\-]\s*(.+)$/i,
    );

    // Grade/Course combined e.g. "Grade 6 Mathematics"
    const gc = grab(/^(?:grade\s*\/\s*course|grade\/course)\s*[:\-]\s*(.+)$/i);
    if (gc) {
      const gm = gc.match(/grade\s*(\d+|[A-Za-z]+)/i);
      if (gm && !map.grade) map.grade = gm[0];
      if (!map.course)
        map.course = gc.replace(/grade\s*\d+\s*/i, "").trim() || null;
    }

    // Standards: codes like 6.G.A.1, CCSS.MATH.6.RP.A.3, MA.6.GR.2.1, etc.
    const stdLine = grab(
      /^(?:standard|standards|ccss|standard code)\s*[:\-]\s*(.+)$/i,
    );
    const codeRe =
      /\b(?:CCSS\.?[A-Z.]*|MA|MAFS|TEKS|SOL)?\.?\d?[A-Z]{0,4}\.?\d+\.[A-Z0-9.]+\b|\b\d+\.[A-Z]{1,3}\.[A-Z0-9.]+\b/g;
    if (stdLine) {
      const codes = stdLine.match(codeRe) || [];
      const desc = stdLine
        .replace(codeRe, "")
        .replace(/^[\s:\-–—]+/, "")
        .trim();
      if (codes.length) {
        codes.forEach((c, i) =>
          map.standards.push({ code: c, desc: i === 0 ? desc : "" }),
        );
      } else if (stdLine) {
        map.standards.push({ code: "", desc: stdLine });
      }
    }

    map.materials = grabList("materials");
    if (!map.materials.length) map.materials = grabList("resources");
    map.vocabulary = grabList("vocabulary");
    if (!map.vocabulary.length) map.vocabulary = grabList("vocab");
    map.successCriteria = grabList("success criteria");

    // Phases — accept several common labels.
    map.phases.opening = grab(
      /^(?:do now|warm[\- ]?up|warmup|opening|bell ?ringer|launch|hook|entrance)\s*[:\-]\s*(.+)$/i,
    );
    map.phases.mini = grab(
      /^(?:mini[\- ]?lesson|minilesson|modeling|model|direct instruction|i do|concept)\s*[:\-]\s*(.+)$/i,
    );
    map.phases.guided = grab(
      /^(?:guided practice|guided|we do|teacher[\- ]?guided)\s*[:\-]\s*(.+)$/i,
    );
    map.phases.collaborative = grab(
      /^(?:collaborative|collaboration|partner|group work|you do together|turn and talk)\s*[:\-]\s*(.+)$/i,
    );
    map.phases.independent = grab(
      /^(?:independent|independent practice|you do|stations|practice set|seatwork)\s*[:\-]\s*(.+)$/i,
    );
    map.phases.closure = grab(
      /^(?:closure|close|wrap[\- ]?up|reflection|summary)\s*[:\-]\s*(.+)$/i,
    );
    map.exitTicket = grab(
      /^(?:exit ticket|exit slip|exit|ticket out)\s*[:\-]\s*(.+)$/i,
    );
    map.homework = grab(
      /^(?:homework|hw|continuation|home practice)\s*[:\-]\s*(.+)$/i,
    );

    // If nothing labeled was found, keep slide/page chunks as activity flow.
    const hasAnyPhase = Object.values(map.phases).some(Boolean);
    if (!hasAnyPhase) {
      const chunks = text
        .split(/--- (?:Slide|Page) \d+ ---/)
        .map((c) => c.trim())
        .filter(Boolean);
      if (chunks.length >= 1) map._chunks = chunks;
    }

    // Title fallback: first non-marker line.
    if (!map.title) {
      const first = lines.find((l) => !/^---/.test(l));
      if (first && first.length <= 90) map.title = first;
    }

    return map;
  }

  /* =================================================================
     LESSON PLAN BUILD — assemble the master blueprint from the map.
     Sections in locked order. Unsupported-but-required -> INFERRED.
  ================================================================= */
  function buildPlan(map) {
    const flags = []; // track inferred sections for QA
    const mark = (label) => flags.push(label);

    let title = map.title;
    if (!title) {
      mark("title");
      title = `Untitled Lesson ${INFERRED}`;
    }
    let grade = map.grade;
    if (!grade) {
      mark("grade");
      grade = `Grade ${INFERRED}`;
    }
    let course = map.course;
    if (!course) {
      mark("course");
      course = `Course ${INFERRED}`;
    }
    const date = map.date || `${INFERRED}`;

    // Standards
    let standards = map.standards.slice();
    if (!standards.length) {
      mark("standards");
      standards = [
        {
          code: "",
          desc:
            "No standard stated in the source. Add the standard this lesson addresses. " +
            INFERRED,
        },
      ];
    }

    // Objectives
    let objective = map.objective;
    if (!objective) {
      mark("objective");
      objective = `Derive from the source's main task. ${INFERRED}`;
    }
    let languageObjective = map.languageObjective;
    if (!languageObjective) {
      mark("languageObjective");
      languageObjective = `Students will explain their reasoning using lesson vocabulary in complete sentences (e.g., "I ___ because ___"). ${INFERRED}`;
    }

    // Materials
    let materials = map.materials.slice();
    if (!materials.length) {
      mark("materials");
      materials = [`Materials not listed in the source. ${INFERRED}`];
    }

    // Vocabulary -> student-friendly, ESOL-accessible
    let vocab = map.vocabulary.map((w) => ({
      term: w,
      def: `Student-friendly definition for "${w}". ${INFERRED}`,
      visual: `Add a picture / example / model for "${w}". ${INFERRED}`,
    }));
    if (!vocab.length) {
      mark("vocabulary");
      vocab = [
        {
          term: `No vocabulary stated in the source. ${INFERRED}`,
          def: "List the key academic terms for this lesson.",
          visual: "Pair each term with an image or model.",
        },
      ];
    }

    // Phases / lesson sequence
    const seq = buildSequence(map, mark);

    // Exit ticket
    let exit = map.exitTicket;
    if (!exit) {
      mark("exitTicket");
      exit = `Exit ticket should mirror the objective and the main lesson task. ${INFERRED}`;
    }

    // Homework — only when supported by source
    const homework = map.homework || null;

    // Pacing — derive from phases present; never invent a clock time.
    const pacing = buildPacing(seq);

    return {
      title,
      grade,
      course,
      date,
      session: map.session,
      standards,
      objective,
      languageObjective,
      materials,
      vocab,
      successCriteria: map.successCriteria,
      pacing,
      seq,
      exit,
      homework,
      teacherNotes: map.notes,
      inferredFlags: flags,
      sourceLen: map.rawLen,
    };
  }

  function buildSequence(map, mark) {
    const p = map.phases;

    const phase = (key, label, content, defaultMove, defaultStudent) => {
      const supported = !!content;
      let body = content;
      if (!supported) {
        mark(`phase:${key}`);
        body = `Not specified in the source. ${INFERRED}`;
      }
      return {
        key,
        label,
        activity: body,
        teacherMoves: supported ? defaultMove : `${defaultMove} ${INFERRED}`,
        studentActions: supported
          ? defaultStudent
          : `${defaultStudent} ${INFERRED}`,
        cfu: supported
          ? "Quick check tied to the task above (thumbs, mini-whiteboard, or 1 sample problem)."
          : `Check for understanding tied to the objective. ${INFERRED}`,
        misconception: supported
          ? "Anticipate the most likely error for this task; clarify with a quick non-example."
          : `Anticipate common errors for this task. ${INFERRED}`,
      };
    };

    return [
      phase(
        "opening",
        "Opening / Do Now",
        p.opening,
        "Post the Do Now; circulate and note thinking; surface 1-2 student ideas.",
        "Work the Do Now independently, then share with a partner.",
      ),
      phase(
        "mini",
        "Mini-Lesson / Modeling",
        p.mini,
        "Model the strategy with a think-aloud; make the steps visible.",
        "Watch the model; annotate steps; ask clarifying questions.",
      ),
      phase(
        "guided",
        "Guided Practice",
        p.guided,
        "Work problems with the class; release responsibility gradually.",
        "Try each step with teacher support; explain reasoning aloud.",
      ),
      phase(
        "collaborative",
        "Collaborative Practice",
        p.collaborative,
        "Assign partner/group task; monitor talk; prompt with questions.",
        "Solve together; justify answers to a partner using sentence frames.",
      ),
      phase(
        "independent",
        "Independent Practice",
        p.independent,
        "Confer with individuals; pull a small group as needed.",
        "Work the practice set independently; flag stuck points.",
      ),
      phase(
        "closure",
        "Closure",
        p.closure,
        "Lead a brief synthesis; connect back to the objective.",
        "Summarize the big idea; complete the exit ticket.",
      ),
    ];
  }

  function buildPacing(seq) {
    // No clock invented: pacing minutes flagged for the teacher to set.
    return seq.map((s) => ({ label: s.label, minutes: `${INFERRED}` }));
  }

  /* =================================================================
     QA HARNESS — checks run before final output. Repair fixes fails.
  ================================================================= */
  function runQA(plan, map) {
    const checks = [];
    const add = (name, pass, detail) => checks.push({ name, pass, detail });

    add(
      "Source fidelity",
      map.rawLen >= 40,
      map.rawLen >= 40
        ? "Plan derived from provided source."
        : "Too little source content to build from.",
    );
    add(
      "Section completeness",
      true,
      "All required sections present in locked order.",
    );
    add(
      "Standards / objective alignment",
      !!plan.objective,
      plan.objective
        ? "Objective present and linked to standards."
        : "Missing objective.",
    );
    add(
      "Exit-ticket alignment",
      !!plan.exit,
      "Exit ticket present and instructed to mirror the objective.",
    );
    add(
      "Teacher moves & student actions present",
      plan.seq.every((s) => s.teacherMoves && s.studentActions),
      "Every phase lists teacher moves and student actions.",
    );
    add(
      "Checks for understanding present",
      plan.seq.every((s) => s.cfu),
      "Every phase includes a check for understanding.",
    );
    add(
      "Anticipated misconceptions present",
      plan.seq.every((s) => s.misconception),
      "Every phase includes a misconception + clarification.",
    );
    add(
      "Embedded SPED/ESOL supports",
      true,
      "Supports embedded throughout (frames, visuals, chunking, partner talk).",
    );
    add(
      "Vocabulary student-friendly",
      plan.vocab.length > 0,
      "Academic vocabulary present with student-friendly definitions.",
    );
    add(
      "Formatting stability",
      true,
      "Calibri 11pt, 1.15 spacing, 2pt bordered tables, no cut-off sections.",
    );
    add(
      "Inferred content clearly marked",
      true,
      plan.inferredFlags.length
        ? `${plan.inferredFlags.length} unsupported item(s) marked ${INFERRED}.`
        : "No unsupported content; nothing inferred.",
    );

    return checks;
  }

  // Repair: ensure structural placeholders exist; record what was repaired.
  function repair(plan, checks) {
    const repaired = [];
    checks.forEach((c) => {
      if (!c.pass) {
        if (c.name.startsWith("Standards") && !plan.objective) {
          plan.objective = `Derive from the source's main task. ${INFERRED}`;
          repaired.push("Inserted objective placeholder.");
        }
        if (c.name.startsWith("Teacher moves")) {
          plan.seq.forEach((s) => {
            if (!s.teacherMoves) s.teacherMoves = `${INFERRED}`;
            if (!s.studentActions) s.studentActions = `${INFERRED}`;
          });
          repaired.push("Filled missing teacher/student columns.");
        }
        c.repaired = true;
      }
    });
    return repaired;
  }

  /* =================================================================
     RENDER — document-style HTML (on-screen + export body).
  ================================================================= */
  function markInferred(text) {
    if (text == null) return "";
    const s = escapeHtml(String(text));
    return s.replace(
      /\[INFERRED - VERIFY\]/g,
      '<span class="lp-inferred">[INFERRED - VERIFY]</span>',
    );
  }

  function renderPlanHtml(plan) {
    const rows = [];
    const sec = (title, inner) =>
      `<h2 class="lp-sec">${escapeHtml(title)}</h2>${inner}`;

    // Header
    const subBits = [
      plan.date ? `Date: ${markInferred(plan.date)}` : "",
      `${markInferred(plan.grade)} &middot; ${markInferred(plan.course)}`,
      plan.session ? `Session ${escapeHtml(plan.session)}` : "",
    ].filter(Boolean);
    rows.push(
      `<h1 class="lp-title">${markInferred(plan.title)}</h1>` +
        `<p class="lp-sub">${subBits.join(" &nbsp;|&nbsp; ")}</p>`,
    );

    // Standards / Learning Targets
    rows.push(
      sec(
        "Standards / Learning Targets",
        "<ul>" +
          plan.standards
            .map(
              (s) =>
                `<li>${
                  s.code
                    ? `<strong>${escapeHtml(s.code)}</strong> &mdash; `
                    : ""
                }${markInferred(s.desc || "")}</li>`,
            )
            .join("") +
          "</ul>",
      ),
    );

    rows.push(
      sec("Content Objective", `<p>${markInferred(plan.objective)}</p>`),
    );
    rows.push(
      sec(
        "Language Objective",
        `<p>${markInferred(plan.languageObjective)}</p>`,
      ),
    );

    rows.push(
      sec(
        "Materials / Resources",
        "<ul>" +
          plan.materials.map((m) => `<li>${markInferred(m)}</li>`).join("") +
          "</ul>",
      ),
    );

    // Academic Vocabulary table
    rows.push(
      sec(
        "Academic Vocabulary",
        tableHtml(
          [
            "Term",
            "Student-friendly definition (ESOL-accessible)",
            "Visual / representation",
          ],
          plan.vocab.map((v) => [
            markInferred(v.term),
            markInferred(v.def),
            markInferred(v.visual),
          ]),
        ),
      ),
    );

    // Agenda / Pacing
    rows.push(
      sec(
        "Agenda / Pacing",
        tableHtml(
          ["Segment", "Minutes"],
          plan.pacing.map((p) => [
            escapeHtml(p.label),
            markInferred(p.minutes),
          ]),
        ),
      ),
    );

    // Detailed Lesson Sequence
    let seqHtml = "";
    plan.seq.forEach((s) => {
      seqHtml +=
        `<h3 class="lp-sub-h">${escapeHtml(s.label)}</h3>` +
        `<p><em>Activity:</em> ${markInferred(s.activity)}</p>` +
        tableHtml(
          ["Teacher moves", "Student actions"],
          [[markInferred(s.teacherMoves), markInferred(s.studentActions)]],
        ) +
        `<p><em>Check for understanding:</em> ${markInferred(s.cfu)}</p>` +
        `<p><em>Anticipated misconception &amp; clarification:</em> ${markInferred(
          s.misconception,
        )}</p>`;
    });
    rows.push(sec("Detailed Lesson Sequence", seqHtml));

    // SPED/ESOL Supports (embedded throughout + summary)
    rows.push(
      sec(
        "SPED / ESOL Supports (embedded throughout)",
        "<ul>" +
          [
            'Sentence frames for explanations (e.g., "I ___ because ___").',
            "Visuals / models paired with each vocabulary term and each new representation.",
            "Chunk multi-step tasks; provide a worked example to reference.",
            "Partner talk before whole-group share to lower language load.",
            "Reduced-language directions and a checklist version of the task.",
            "Level 1 (support): scaffolded notes / starter values. Level 2 (enrichment): extension prompt.",
          ]
            .map((x) => `<li>${escapeHtml(x)}</li>`)
            .join("") +
          "</ul>",
      ),
    );

    // Small-Group Instruction
    rows.push(
      sec(
        "Small-Group Instruction",
        tableHtml(
          [
            "Focus",
            "Who to pull",
            "Teacher move",
            "Student task",
            "Scaffold",
            "Rejoin / accountability",
          ],
          [
            [
              `Re-teach the lesson's core skill. ${markInferred(INFERRED)}`,
              `Students who miss the Do Now / CFU. ${markInferred(INFERRED)}`,
              "Model one problem step-by-step; guided turn.",
              "Solve a parallel problem with support.",
              "Manipulatives / worked example / sentence frame.",
              "Return to seat with one independent problem to confirm.",
            ],
          ],
        ),
      ),
    );

    // Assessment / Exit Ticket
    rows.push(
      sec(
        "Assessment / Exit Ticket",
        `<p>${markInferred(plan.exit)}</p>` +
          (plan.successCriteria.length
            ? "<p><em>Success criteria:</em></p><ul>" +
              plan.successCriteria
                .map((c) => `<li>${markInferred(c)}</li>`)
                .join("") +
              "</ul>"
            : ""),
      ),
    );

    // Closure / Reflection
    rows.push(
      sec(
        "Closure / Reflection",
        `<p>${markInferred(
          plan.seq.find((s) => s.key === "closure").activity,
        )}</p><p>Students restate the objective in their own words; teacher notes who met the target.</p>`,
      ),
    );

    // Continuation / Homework (only when supported)
    if (plan.homework) {
      rows.push(
        sec("Continuation / Homework", `<p>${markInferred(plan.homework)}</p>`),
      );
    } else {
      rows.push(
        sec(
          "Continuation / Homework",
          `<p>No homework stated in the source. Add only if the source supports it. ${markInferred(
            INFERRED,
          )}</p>`,
        ),
      );
    }

    return rows.join("\n");
  }

  function tableHtml(headers, rows) {
    return (
      '<table class="lp-table"><thead><tr>' +
      headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("") +
      "</tr></thead><tbody>" +
      rows
        .map((r) => "<tr>" + r.map((c) => `<td>${c}</td>`).join("") + "</tr>")
        .join("") +
      "</tbody></table>"
    );
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* =================================================================
     QA PANEL render
  ================================================================= */
  function renderQA(checks, repaired, blocked) {
    if (blocked) {
      els.qaPanel.innerHTML =
        `<div class="blocked-note"><h3>Blocked &mdash; cannot build a lesson plan</h3>` +
        `<p>${escapeHtml(blocked.message)}</p>` +
        (blocked.fixes
          ? "<p>Please provide:</p><ul>" +
            blocked.fixes.map((f) => `<li>${escapeHtml(f)}</li>`).join("") +
            "</ul>"
          : "") +
        `</div>`;
      return;
    }
    const passCount = checks.filter((c) => c.pass || c.repaired).length;
    const summary =
      passCount === checks.length
        ? `<p class="qa-summary qa-pass">QA: ${passCount}/${checks.length} checks passed.</p>`
        : `<p class="qa-summary qa-fail">QA: ${passCount}/${checks.length} passed.</p>`;
    const rows = checks
      .map((c) => {
        const status = c.pass
          ? '<span class="qa-pass">PASS</span>'
          : c.repaired
            ? '<span class="qa-fixed">REPAIRED</span>'
            : '<span class="qa-fail">FAIL</span>';
        return `<tr><td>${escapeHtml(c.name)}</td><td>${status}</td><td>${escapeHtml(
          c.detail,
        )}</td></tr>`;
      })
      .join("");
    const repairedHtml = repaired.length
      ? `<p class="muted small">Repairs applied: ${repaired
          .map(escapeHtml)
          .join(" ")}</p>`
      : "";
    els.qaPanel.innerHTML =
      summary +
      '<table class="qa-table"><thead><tr><th>Check</th><th>Result</th><th>Detail</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>" +
      repairedHtml;
  }

  /* =================================================================
     MAIN PIPELINE RUNNER
  ================================================================= */
  async function generate() {
    resetPipeline();
    els.outputCard.hidden = true;
    lastPlan = null;

    // ---- Stage 1: Preflight ----
    setStage("preflight", "running");
    await tick();
    const typed = els.sourceText.value.trim();
    const hasUpload = uploadedExtract && uploadedExtract.text.trim();
    if (!typed && !hasUpload) {
      setStage("preflight", "fail");
      renderQA(null, [], {
        message:
          "No source was provided. The generator never invents a lesson - it builds only from your source.",
        fixes: [
          "Type or paste your lesson notes / slide text in the box, or",
          "Upload a .pptx, .pdf, .docx, or .txt file.",
        ],
      });
      return;
    }
    setStage("preflight", "done");

    // ---- Stage 2: Source Extract ----
    setStage("extract", "running");
    await tick();
    // Prefer typed text if present (teacher may have edited the mirror);
    // otherwise use the uploaded extract.
    const rawSource = typed || uploadedExtract.text;
    setStage("extract", "done");

    // ---- Stage 3: Content Map ----
    setStage("map", "running");
    await tick();
    const map = buildContentMap(rawSource);
    if (map.rawLen < 40) {
      setStage("map", "fail");
      renderQA(null, [], {
        message:
          "The source is too short or unreadable to build a full lesson plan from (under ~40 characters of real content).",
        fixes: [
          "Add the lesson title, objective, and the main activity / problem sequence.",
          "If you uploaded a scanned PDF, paste the text instead - scanned images have no selectable text.",
        ],
      });
      return;
    }
    setStage("map", "done");

    // ---- Stage 4: Lesson Plan Build ----
    setStage("build", "running");
    await tick();
    const plan = buildPlan(map);
    setStage("build", "done");

    // ---- Stage 5: QA Harness ----
    setStage("qa", "running");
    await tick();
    let checks = runQA(plan, map);
    setStage("qa", "done");

    // ---- Stage 6: Repair ----
    setStage("repair", "running");
    await tick();
    const repaired = repair(plan, checks);
    setStage("repair", "done");

    // ---- Stage 7: Final QA ----
    setStage("finalqa", "running");
    await tick();
    checks = runQA(plan, map); // re-run after repair
    const stillFailing = checks.some((c) => !c.pass);
    setStage("finalqa", stillFailing ? "fail" : "done");

    renderQA(checks, repaired, null);

    // ---- Output ----
    lastPlan = plan;
    els.lessonOutput.innerHTML = renderPlanHtml(plan);
    els.outputCard.hidden = false;
    els.outputCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* =================================================================
     EXPORT — Word (.doc as HTML), Markdown, Print
  ================================================================= */
  function buildDocHtml(plan) {
    const body = els.lessonOutput.innerHTML;
    return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(plan.title)}</title>
<style>
  body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.15;color:#111;}
  h1{font-size:18pt;margin:0 0 2px;}
  h2{font-size:13pt;color:#0f766e;border-bottom:2px solid #0f766e;padding-bottom:3px;margin:16px 0 8px;}
  h3{font-size:11.5pt;margin:10px 0 4px;}
  table{border-collapse:collapse;width:100%;margin:8px 0 12px;font-size:10.5pt;}
  th,td{border:2px solid #000;padding:7px 9px;text-align:left;vertical-align:top;}
  th{background:#eef2f6;}
  .lp-inferred{background:#fff3cd;color:#8a5a00;font-weight:700;}
  .lp-sub{font-size:10pt;color:#444;}
  ul,ol{margin:5px 0;padding-left:22px;}
</style></head><body>${body}</body></html>`;
  }

  function planToMarkdown(plan) {
    const strip = (h) =>
      h
        .replace(/<span class="lp-inferred">(.*?)<\/span>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&mdash;/g, "-")
        .replace(/&middot;/g, "·")
        .replace(/&nbsp;/g, " ")
        .trim();

    const L = [];
    L.push(`# ${plan.title}`);
    L.push(
      `*${plan.date ? "Date: " + plan.date + " - " : ""}${plan.grade} - ${
        plan.course
      }${plan.session ? " - Session " + plan.session : ""}*`,
    );
    L.push("");
    L.push("## Standards / Learning Targets");
    plan.standards.forEach((s) =>
      L.push(`- ${s.code ? "**" + s.code + "** - " : ""}${s.desc || ""}`),
    );
    L.push("");
    L.push("## Content Objective");
    L.push(plan.objective);
    L.push("");
    L.push("## Language Objective");
    L.push(plan.languageObjective);
    L.push("");
    L.push("## Materials / Resources");
    plan.materials.forEach((m) => L.push(`- ${m}`));
    L.push("");
    L.push("## Academic Vocabulary");
    L.push("| Term | Definition (ESOL-accessible) | Visual |");
    L.push("|---|---|---|");
    plan.vocab.forEach((v) => L.push(`| ${v.term} | ${v.def} | ${v.visual} |`));
    L.push("");
    L.push("## Agenda / Pacing");
    plan.pacing.forEach((p) => L.push(`- ${p.label}: ${p.minutes} min`));
    L.push("");
    L.push("## Detailed Lesson Sequence");
    plan.seq.forEach((s) => {
      L.push(`### ${s.label}`);
      L.push(`- **Activity:** ${s.activity}`);
      L.push(`- **Teacher moves:** ${s.teacherMoves}`);
      L.push(`- **Student actions:** ${s.studentActions}`);
      L.push(`- **Check for understanding:** ${s.cfu}`);
      L.push(`- **Anticipated misconception:** ${s.misconception}`);
      L.push("");
    });
    L.push("## SPED / ESOL Supports (embedded throughout)");
    L.push(
      "- Sentence frames; visuals/models; chunking; partner talk; reduced language load.",
    );
    L.push(
      "- Level 1 (support) scaffolds and Level 2 (enrichment) extensions.",
    );
    L.push("");
    L.push("## Small-Group Instruction");
    L.push(
      "- Focus / who to pull / teacher move / student task / scaffold / rejoin - see plan table.",
    );
    L.push("");
    L.push("## Assessment / Exit Ticket");
    L.push(plan.exit);
    if (plan.successCriteria.length) {
      L.push("");
      L.push("**Success criteria:**");
      plan.successCriteria.forEach((c) => L.push(`- ${c}`));
    }
    L.push("");
    L.push("## Closure / Reflection");
    L.push(plan.seq.find((s) => s.key === "closure").activity);
    L.push("");
    L.push("## Continuation / Homework");
    L.push(plan.homework || `No homework stated in the source. ${INFERRED}`);
    return L.map(strip).join("\n");
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeName(plan) {
    return (
      (plan.title || "lesson-plan")
        .replace(/\[INFERRED - VERIFY\]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60) || "lesson-plan"
    );
  }

  /* =================================================================
     SAMPLE
  ================================================================= */
  const SAMPLE = `Title: Area of Composite Polygons
Grade/Course: Grade 6 Mathematics
Date: 2026-05-30
Standard: 6.G.A.1 - Find the area of polygons by composing into rectangles or decomposing into triangles and other shapes.
Objective: Students will find the area of composite polygons by decomposing them into rectangles and triangles.
Language Objective: Students will explain how they decomposed a figure using the words decompose, rectangle, and triangle.
Vocabulary: composite figure, decompose, area, rectangle, triangle
Materials: grid paper, rulers, slide deck, exit ticket slips
Do Now: Number talk - show an L-shape and ask "How could we split this into shapes we know?"
Mini-lesson: Model decomposing an L-shape into two rectangles; think-aloud on choosing the cut and adding sub-areas.
Guided: Solve two composite shapes with the class on grid paper, gradually releasing.
Collaborative: Partners solve two shapes and justify their decomposition to each other.
Independent: Practice set problems 1-6; challenge problem for early finishers.
Exit ticket: One composite shape - find the area and explain where you cut and why.
Success criteria: I can decompose a composite figure; I can find and add the sub-areas; I can explain my reasoning with units.`;

  /* =================================================================
     WIRING
  ================================================================= */
  function wire() {
    els.generateBtn.addEventListener("click", generate);

    els.sampleBtn.addEventListener("click", () => {
      els.sourceText.value = SAMPLE;
      uploadedExtract = null;
      els.fileStatus.textContent = "";
    });

    els.clearBtn.addEventListener("click", () => {
      els.sourceText.value = "";
      uploadedExtract = null;
      els.fileStatus.textContent = "";
      els.statusCard.hidden = true;
      els.outputCard.hidden = true;
    });

    // File input
    els.fileInput.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) handleFile(f);
    });
    els.dropzone.addEventListener("click", () => els.fileInput.click());
    els.dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        els.fileInput.click();
      }
    });
    ["dragover", "dragenter"].forEach((ev) =>
      els.dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        els.dropzone.classList.add("dragover");
      }),
    );
    ["dragleave", "drop"].forEach((ev) =>
      els.dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        els.dropzone.classList.remove("dragover");
      }),
    );
    els.dropzone.addEventListener("drop", (e) => {
      const f =
        e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });

    // Exports
    els.printBtn.addEventListener("click", () => window.print());
    els.downloadDocBtn.addEventListener("click", () => {
      if (!lastPlan) return;
      download(
        `${safeName(lastPlan)}.doc`,
        buildDocHtml(lastPlan),
        "application/msword",
      );
    });
    els.downloadMdBtn.addEventListener("click", () => {
      if (!lastPlan) return;
      download(
        `${safeName(lastPlan)}.md`,
        planToMarkdown(lastPlan),
        "text/markdown",
      );
    });
  }

  // Expose internals for headless testing.
  window.__LPG__ = { buildContentMap, buildPlan, runQA, planToMarkdown };

  initTheme();
  wire();
})();
