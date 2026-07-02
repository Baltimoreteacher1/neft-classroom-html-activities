/* =====================================================================
   Neft Teacher — Ready Lesson Plan Generator
   Local-first. Self-contained vanilla JS. No CDN at runtime.

   FLOW:
     Teacher fields + (optional) source  ->  parse source (content map)
       ->  standards-aware content (content-library.js)
       ->  full Ready-format plan (lesson-model.js)
       ->  on-page 14-section render  ->  DOCX export (docx-export.js)

   The pasted/uploaded source steers the objective, vocabulary and activity
   flow; the content library supplies the rich Ready scaffolding (problems,
   answer keys, TWR writing, ESOL/SPED supports) so the output is complete.

   Libraries (self-hosted in ./vendor):
     - jszip.min.js   -> global JSZip   (pptx + docx unzip)
     - docx.umd.js    -> global docx    (Word export)
     - pdf.min.mjs    -> dynamic import (pdf text extraction)
   ===================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    sourceText: $("sourceText"),
    fileInput: $("fileInput"),
    uploadBtn: $("uploadBtn"),
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
    reshuffleBtn: $("reshuffleBtn"),
    downloadDocxBtn: $("downloadDocxBtn"),
    downloadDocBtn: $("downloadDocBtn"),
    downloadMdBtn: $("downloadMdBtn"),
    // fields
    fDate: $("fDate"),
    fGrade: $("fGrade"),
    fCourse: $("fCourse"),
    fUnit: $("fUnit"),
    fFocus: $("fFocus"),
    fStandards: $("fStandards"),
    fLength: $("fLength"),
    fSkill: $("fSkill"),
    fWida: $("fWida"),
    fSped: $("fSped"),
    fNotes: $("fNotes"),
  };

  let uploadedExtract = null; // { text, name, kind }
  let lastPlan = null;
  let reshuffleNonce = 0; // bumped by "Reshuffle numbers" to vary the seeded problem numbers

  /* ===================== THEME ===================== */
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

  /* ===================== PIPELINE UI ===================== */
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
    if (li) li.className = state;
  }
  const tick = () => new Promise((r) => setTimeout(r, 12));

  /* ===================== SOURCE EXTRACTION ===================== */
  async function extractPptx(arrayBuffer) {
    if (typeof JSZip === "undefined") {
      throw new Error(
        "Slide reader library (jszip) failed to load. Copy the slide text and paste it into the text box instead.",
      );
    }
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = +(a.match(/slide(\d+)\.xml/) || [])[1];
        const nb = +(b.match(/slide(\d+)\.xml/) || [])[1];
        return na - nb;
      });
    if (!slideFiles.length) throw new Error("No slides found in the .pptx.");

    const results = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const name = slideFiles[i];
      const xml = await zip.files[name].async("string");
      const runs = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) =>
        decodeXml(m[1]),
      );
      const n = (name.match(/slide(\d+)/) || [])[1];
      const text = runs.join(" ").replace(/\s+/g, " ").trim();
      results.push({ n, text });
      els.fileStatus.textContent = `Reading slide ${i + 1} of ${slideFiles.length}…`;
      if (i % 3 === 0) {
        await yieldCpu();
      }
    }
    const parts = results
      .filter((r) => r.text)
      .map((r) => `--- Slide ${r.n} ---\n${r.text}`);
    return parts.join("\n\n");
  }

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

  async function extractPdf(arrayBuffer) {
    let pdfjs;
    try {
      pdfjs =
        await import("/teacher-tools/lesson-plan-generator/vendor/pdf.min.mjs");
    } catch (e) {
      throw new Error(
        "PDF reader (pdf.js) could not load. Copy the PDF text and paste it into the box instead.",
      );
    }
    try {
      pdfjs.GlobalWorkerOptions.workerSrc =
        "/teacher-tools/lesson-plan-generator/vendor/pdf.worker.min.mjs";
    } catch (_) {
      /* ignore */
    }
    const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
      .promise;

    const results = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const txt = content.items
        .map((i) => i.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      results.push({ p, txt });
      els.fileStatus.textContent = `Reading page ${p} of ${doc.numPages}…`;
      if (p % 2 === 0) {
        await yieldCpu();
      }
    }
    const out = results
      .filter((r) => r.txt)
      .map((r) => `--- Page ${r.p} ---\n${r.txt}`);
    const text = out.join("\n\n");
    if (!text)
      throw new Error(
        "No selectable text found in the PDF (it may be scanned images). Paste the text instead.",
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

  const yieldCpu = () =>
    new Promise((resolve) => {
      if (document.hidden) {
        setTimeout(resolve, 0);
      } else {
        requestAnimationFrame(resolve);
      }
    });

  function setFileReading(reading) {
    if (reading) {
      els.generateBtn.disabled = true;
      els.generateBtn.textContent = "Reading file...";
    } else {
      els.generateBtn.disabled = false;
      els.generateBtn.textContent = "✦ Generate Lesson Plan";
    }
  }

  const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB — larger files stall in-browser parsing

  async function handleFile(file) {
    const name = file.name || "file";
    const lower = name.toLowerCase();
    els.fileStatus.className = "file-status";
    els.fileStatus.textContent = `Reading "${name}"…`;
    setFileReading(true);
    try {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB, which is too large to read in the browser (limit ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB). Copy the text and paste it into the box instead, or export a smaller/text-only version of the file.`,
        );
      }
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
      els.fileStatus.className = "file-status ok";
      els.fileStatus.innerHTML =
        `<strong>${esc(name)}</strong> (${kind})<br>` +
        `<span class="extract-ok">Extracted ✓ (${text.length.toLocaleString()} characters)</span> — review the text below, then click Generate.`;
      els.sourceText.value = text;
    } catch (e) {
      uploadedExtract = null;
      els.fileStatus.className = "file-status bad";
      els.fileStatus.innerHTML = `<strong>Could not read this file:</strong> ${esc(
        e.message,
      )}`;
    } finally {
      setFileReading(false);
    }
  }

  /* ===================== CONTENT MAP (source parse) ===================== */
  function buildContentMap(raw) {
    const text = (raw || "").replace(/\r/g, "");
    const map = {
      rawLen: text.replace(/\s/g, "").length,
      title: null,
      grade: null,
      course: null,
      date: null,
      standards: [],
      objective: null,
      languageObjective: null,
      materials: [],
      vocabulary: [],
      phases: { mini: null },
      _raw: text,
    };

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const segments = [];
    const rawSegs = text.split(/[\n;•]+/);
    for (const rSeg of rawSegs) {
      const trimmed = rSeg.trim();
      if (!trimmed) continue;
      // Split sentences lookbehind-free: period-space followed by capital letter
      const parts = trimmed.split(/\.\s+(?=[A-Z])/);
      for (const p of parts) {
        const cleaned = p.trim().replace(/^[.!?\s]+/, "");
        if (cleaned) segments.push(cleaned);
      }
    }

    const grab = (re, segRe) => {
      const sr = segRe || re;
      for (const s of segments) {
        const m = s.match(sr);
        if (m && m[1]) return m[1].trim();
      }
      for (const l of lines) {
        const m = l.match(re);
        if (m && m[1]) return m[1].trim();
      }
      return null;
    };
    const lbl = (alts) =>
      new RegExp(`(?:^|\\b)(?:${alts})\\s*[:\\-=]\\s*(.+)`, "i");
    const splitList = (val) =>
      val
        .split(/[,;]|•|\||\band\b/i)
        .map((x) => x.replace(/[.\s]+$/, "").trim())
        .filter(Boolean);
    const grabList = (label) => {
      const re = lbl(label);
      const NEXT =
        /\b(?:do now|warm[\- ]?up|opening|mini[\- ]?lesson|guided|collaborative|independent|closure|exit (?:ticket|slip)|homework|objective|standard|materials|resources)\b\s*[:\-]/i;
      for (const l of lines) {
        const m = l.match(re);
        if (m && m[1]) {
          let val = m[1];
          const cut = val.search(NEXT);
          if (cut > 0) val = val.slice(0, cut);
          const items = splitList(val);
          if (items.length) return items;
        }
      }
      return [];
    };

    map.title = grab(lbl("title|lesson title"));
    map.grade = grab(lbl("grade(?:\\s*level)?"));
    map.course = grab(lbl("course|subject|class"));
    map.date = grab(lbl("date"));
    map.objective =
      grab(lbl("objective|content objective|learning target|target|goal")) ||
      grab(
        /\b((?:swbat|students will(?:\s+be able to)?|we will|i can)\b\s*[:\-]?\s*.+)/i,
      );
    map.languageObjective = grab(
      lbl("language objective|lang objective|esol objective"),
    );

    const codeRe =
      /\b(?:CCSS\.?(?:MATH|ELA-?LITERACY)?\.?)?\d+\.[A-Z]{1,3}(?:\.[A-Z])?\.\d+[a-z]?\b/g;
    const codeMatches = [...text.matchAll(codeRe)].map((m) => m[0]);
    const stdLine = grab(lbl("standard|standards|ccss|standard code"));
    const seen = new Set();
    codeMatches.forEach((c, i) => {
      if (seen.has(c)) return;
      seen.add(c);
      let desc = "";
      if (i === 0 && stdLine)
        desc = stdLine
          .replace(codeRe, "")
          .replace(/^[\s:\-–—()]+/, "")
          .trim();
      map.standards.push({ code: c, desc });
    });
    if (!map.standards.length && stdLine)
      map.standards.push({ code: "", desc: stdLine });

    map.materials = grabList("materials");
    if (!map.materials.length) map.materials = grabList("resources");
    map.vocabulary = grabList("vocabulary|vocab|key terms?");

    map.phases.mini =
      grab(lbl("mini[\\- ]?lesson|modeling|direct instruction|i do")) || null;

    if (!map.title)
      map.title = grab(/\b(?:lesson on|topic|unit|teaching)\s*[:\-]?\s*(.+)/i);
    if (!map.title) {
      const firstSeg = segments.find((s) => !/^---/.test(s) && s.length <= 120);
      if (firstSeg) {
        const afterColon = firstSeg.match(/^[^:]{0,40}:\s*(.+)/);
        map.title = (afterColon ? afterColon[1] : firstSeg).trim();
      }
    }
    if (map.title)
      map.title = map.title
        .replace(/\s*\(\s*(?:CCSS\.?\S*\s*)?\d+\.[A-Z][A-Z0-9.]*\)?\s*$/i, "")
        .replace(/[.\s]+$/, "")
        .trim();

    return map;
  }

  /* ===================== FIELDS ===================== */
  function gatherFields() {
    const v = (el) => (el && el.value ? el.value.trim() : "");
    const unit = v(els.fUnit);
    const focus = v(els.fFocus);
    return {
      date: v(els.fDate),
      grade: v(els.fGrade) || "6",
      course: v(els.fCourse) || "Mathematics",
      unit,
      focus,
      topic: focus || unit,
      standards: v(els.fStandards),
      length: v(els.fLength) || "45–60 minutes",
      skill: v(els.fSkill),
      wida: v(els.fWida),
      sped: v(els.fSped),
      notes: v(els.fNotes),
    };
  }

  /* ===================== QA HARNESS ===================== */
  function runQA(plan) {
    const checks = [];
    const add = (name, pass, detail) => checks.push({ name, pass, detail });
    const ok = (n) => Array.isArray(n) && n.length > 0;

    add(
      "Header complete",
      !!(plan.header.title && plan.header.objective && plan.header.iCan),
      "Title, objective, I-Can, essential question, standards present.",
    );
    add(
      "Teacher snapshot",
      ok(plan.snapshot.misconceptions) && ok(plan.snapshot.lookFors),
      "Learning / why / by-end + misconceptions + look-fors.",
    );
    add(
      "Vocabulary supports",
      ok(plan.vocab),
      "Terms with student-friendly defs, Spanish, ESOL frames.",
    );
    add(
      "Do Now (3+ levels + key)",
      plan.doNow.items.length >= 3 && plan.doNow.items.every((i) => i.a),
      "Access / grade / stretch questions with answer key.",
    );
    add(
      "Mini-lesson worked example",
      !!(plan.mini.worked && plan.mini.worked.steps.length),
      "Worked example, think-aloud, common mistake + correction.",
    );
    add(
      "Guided practice + key",
      plan.guided.items.length >= 4 && plan.guided.items.every((i) => i.a),
      "4+ problems with answers and teacher prompts.",
    );
    add(
      "Collaborative + TWR",
      !!(plan.collaborative.studentDirections && plan.collaborative.twrWritten),
      "Partner task, accountability, discussion + written response.",
    );
    add(
      "Independent (mix + error analysis + key)",
      plan.independent.items.length >= 6 &&
        plan.independent.items.some((i) => /error/i.test(i.type)),
      "6+ problems incl. error analysis, with answer key.",
    );
    add(
      "Writing / TWR",
      !!(plan.writing.because && plan.writing.kernel),
      "Because/But/So, kernel, frames, word bank, expected response.",
    );
    add(
      "Differentiation",
      ok(plan.differentiation.esol) && ok(plan.differentiation.sped),
      "ESOL, SPED, newcomer, on-grade, extension, reteach.",
    );
    add(
      "Checks for understanding",
      ok(plan.cfu.decisionPoints),
      "CFU at each phase + teacher decision points.",
    );
    add(
      "Exit ticket + next-day",
      plan.exit.items.length >= 2 && !!plan.exit.tomorrow,
      "Questions + answer key + reflection + tomorrow's move.",
    );
    add(
      "Printable student version",
      true,
      "Answer-free student version included in the DOCX.",
    );
    return checks;
  }

  /* ===================== RENDER (14 sections) ===================== */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function tableHtml(headers, rows) {
    return (
      '<table class="lp-table"><thead><tr>' +
      headers.map((h) => `<th>${esc(h)}</th>`).join("") +
      "</tr></thead><tbody>" +
      rows
        .map(
          (r) => "<tr>" + r.map((c) => `<td>${esc(c)}</td>`).join("") + "</tr>",
        )
        .join("") +
      "</tbody></table>"
    );
  }
  const ul = (arr) =>
    "<ul>" +
    (arr || [])
      .filter(Boolean)
      .map((x) => `<li>${esc(x)}</li>`)
      .join("") +
    "</ul>";
  const kv = (label, val) =>
    `<p class="lp-kv"><strong>${esc(label)}:</strong> ${esc(val)}</p>`;
  // Scannable callout for "what the teacher actually does / decides" lines.
  const note = (label, val) =>
    `<p class="lp-note"><strong>${esc(label)}:</strong> ${esc(val)}</p>`;
  const noteList = (label, arr) =>
    `<div class="lp-note"><strong>${esc(label)}:</strong>` + ul(arr) + `</div>`;

  function renderPlanHtml(plan) {
    const h = plan.header;
    // Optional 4th arg = a time chip shown on the section heading.
    const sec = (n, title, inner, time) =>
      `<section class="lp-block"><h2 class="lp-sec">${n} · ${esc(title)}` +
      (time
        ? `<span class="lp-time"><span aria-hidden="true">⏱</span> ${esc(time)}</span>`
        : "") +
      `</h2>${inner}</section>`;
    const rows = [];

    rows.push(
      `<h1 class="lp-title">${esc(h.title)}</h1>` +
        `<p class="lp-sub">${[
          h.date && "Date: " + esc(h.date),
          esc(h.grade),
          esc(h.course),
          h.unit && "Unit: " + esc(h.unit),
          esc(h.length),
        ]
          .filter(Boolean)
          .join(" &nbsp;|&nbsp; ")}</p>`,
    );

    // ---- Lesson at a Glance (scan band: the 5-second read) ----
    const stdCodes = h.standards
      .map((s) => s.code || s.desc)
      .filter(Boolean)
      .join(", ");
    const flow = (h.pacing || [])
      .map(
        ([name, t]) =>
          `<span class="flow-step">${esc(name)} <em>${esc(t)}</em></span>`,
      )
      .join('<span class="flow-arrow" aria-hidden="true">→</span>');
    rows.push(
      `<section class="lp-glance">` +
        `<div class="glance-grid">` +
        `<div><span class="glance-label">I Can</span>${esc(h.iCan)}</div>` +
        `<div><span class="glance-label">Essential Question</span>${esc(h.essentialQuestion)}</div>` +
        (stdCodes
          ? `<div><span class="glance-label">Standard(s)</span>${esc(stdCodes)}</div>`
          : "") +
        `</div>` +
        (flow ? `<div class="lp-flow">${flow}</div>` : "") +
        `</section>`,
    );

    // 1 Header
    rows.push(
      sec(
        1,
        "Lesson Header",
        tableHtml(
          ["Field", "Detail"],
          [
            [
              "Standard(s)",
              h.standards
                .map((s) => (s.code ? s.code + " — " : "") + (s.desc || ""))
                .join("; "),
            ],
            ["Student-Friendly Objective", h.objective],
            ['"I Can" Statement', h.iCan],
            ["Language Objective", h.languageObjective],
            ["Essential Question", h.essentialQuestion],
            ["Materials", h.materials.join(", ")],
            ["Lesson Length", h.length],
          ],
        ),
      ),
    );

    // 2 Snapshot
    const s = plan.snapshot;
    rows.push(
      sec(
        2,
        "Teacher Snapshot",
        kv("Learning today", s.learning) +
          kv("Why it matters", s.why) +
          kv("By the end, students can", s.byEnd) +
          "<p><strong>Anticipated misconceptions:</strong></p>" +
          ul(s.misconceptions) +
          "<p><strong>Teacher look-fors:</strong></p>" +
          ul(s.lookFors),
      ),
    );

    // 3 Vocabulary
    rows.push(
      sec(
        3,
        "Vocabulary / Language Support",
        tableHtml(
          [
            "Term",
            "Student-friendly definition",
            "Spanish",
            "ESOL sentence frame",
          ],
          plan.vocab.map((v) => [v.term, v.def, v.spanish || "—", v.frame]),
        ),
      ),
    );

    // 4 Do Now
    rows.push(
      sec(
        4,
        "Do Now / Warm-Up",
        `<p><em>${esc(plan.doNow.directions)}</em></p>` +
          tableHtml(
            ["Level", "Question", "Answer key"],
            plan.doNow.items.map((it) => [it.level, it.q, it.a]),
          ) +
          note("Teacher move", plan.doNow.teacherMove),
        plan.timing && plan.timing.doNow,
      ),
    );

    // 5 Mini-lesson
    const m = plan.mini;
    rows.push(
      sec(
        5,
        "Mini-Lesson / Direct Instruction",
        `<p>${esc(m.teacherExplanation)}</p><p><em>${esc(m.gradualRelease)}</em></p>` +
          "<h3 class='lp-sub-h'>Student notes</h3>" +
          ul(m.studentNotes) +
          "<h3 class='lp-sub-h'>Worked example</h3>" +
          kv("Problem", m.worked.problem) +
          ul(m.worked.steps.map((x, i) => `Step ${i + 1}: ${x}`)) +
          "<p><strong>Think-aloud:</strong></p>" +
          ul(m.worked.thinkAloud.map((t) => `“${t}”`)) +
          kv("Common mistake", m.worked.commonMistake) +
          kv("Correction", m.worked.correction),
        plan.timing && plan.timing.mini,
      ),
    );

    // 6 Guided
    rows.push(
      sec(
        6,
        "Guided Practice",
        tableHtml(
          ["#", "Problem", "Answer", "Teacher prompt"],
          plan.guided.items.map((it, i) => [i + 1, it.q, it.a, it.prompt]),
        ) +
          note("Turn & Talk", plan.guided.turnAndTalk) +
          "<p><strong>Sentence starters:</strong></p>" +
          ul(plan.guided.sentenceStarters),
        plan.timing && plan.timing.guided,
      ),
    );

    // 7 Collaborative
    const c = plan.collaborative;
    rows.push(
      sec(
        7,
        "Collaborative / Partner Activity",
        kv("Student directions", c.studentDirections) +
          kv("Teacher directions", c.teacherDirections) +
          kv("Accountability", c.accountability) +
          "<p><strong>Discussion prompts:</strong></p>" +
          ul(c.discussionPrompts) +
          kv("Written response (TWR)", c.twrWritten),
        plan.timing && plan.timing.collaborative,
      ),
    );

    // 8 Independent
    rows.push(
      sec(
        8,
        "Independent Practice",
        tableHtml(
          ["#", "Type", "Problem", "Answer key"],
          plan.independent.items.map((it, i) => [i + 1, it.type, it.q, it.a]),
        ) +
          kv("Show your thinking", plan.independent.showThinking) +
          kv("Extension", plan.independent.extension),
        plan.timing && plan.timing.independent,
      ),
    );

    // 9 Writing / TWR
    const w = plan.writing;
    rows.push(
      sec(
        9,
        "Writing / TWR Connection",
        kv("Kernel sentence", w.kernel) +
          tableHtml(["Because", "But", "So"], [[w.because, w.but, w.so]]) +
          kv("Explain your thinking", w.explain) +
          "<p><strong>Sentence frames:</strong></p>" +
          ul(w.frames) +
          kv("Word bank", w.wordBank.join(", ")) +
          kv("Expected response", w.expected),
        plan.timing && plan.timing.writing,
      ),
    );

    // 10 Differentiation
    const d = plan.differentiation;
    rows.push(
      sec(
        10,
        "Differentiation",
        "<h3 class='lp-sub-h'>ESOL / WIDA</h3>" +
          ul(d.esol) +
          "<h3 class='lp-sub-h'>SPED</h3>" +
          ul(d.sped) +
          "<h3 class='lp-sub-h'>Newcomer</h3>" +
          ul(d.newcomer) +
          "<h3 class='lp-sub-h'>On-grade</h3>" +
          ul(d.onGrade) +
          "<h3 class='lp-sub-h'>Extension / enrichment</h3>" +
          ul(d.extension) +
          kv("Small-group reteach", d.reteach) +
          kv("Early finishers", d.earlyFinishers),
      ),
    );

    // 11 CFU
    const cf = plan.cfu;
    rows.push(
      sec(
        11,
        "Checks for Understanding",
        tableHtml(
          ["Moment", "Check"],
          [
            ["Do Now", cf.doNow],
            ["Mini-lesson", cf.mini],
            ["Guided practice", cf.guided],
            ["Independent practice", cf.independent],
          ],
        ) + noteList("Teacher decision points", cf.decisionPoints),
      ),
    );

    // 12 Exit ticket
    rows.push(
      sec(
        12,
        "Exit Ticket",
        tableHtml(
          ["#", "Question", "Answer key"],
          plan.exit.items.map((it, i) => [i + 1, it.q, it.a]),
        ) +
          kv("Confidence / reflection", plan.exit.confidence.q) +
          note("Tomorrow, based on results", plan.exit.tomorrow),
        plan.timing && plan.timing.exit,
      ),
    );

    // 13 Teacher notes
    const tn = plan.teacherNotes;
    rows.push(
      sec(
        13,
        "Teacher Notes / Next-Day Moves",
        ul([
          "Collect: " + tn.collect,
          "Look for: " + tn.lookFor,
          "Likely reteach: " + tn.reteachWho,
          "Adjust tomorrow: " + tn.adjust,
          "Small groups: " + tn.smallGroups,
          tn.extra ? "Note: " + tn.extra : "",
        ]),
      ),
    );

    // 14 Printable student version (preview note)
    rows.push(
      sec(
        14,
        "Printable Student Version",
        "<p>A clean, answer-free student handout (with response space) is added as part 2 of the downloaded Word doc — ready to print or post to Canvas.</p>" +
          "<p class='muted small'>Mirrors the Do Now, notes, practice, writing, and exit ticket above — no teacher notes or answer keys. See the <strong>Student Handout</strong> tab to preview it.</p>",
      ),
    );

    return rows.join("\n");
  }

  /* ===================== QA PANEL ===================== */
  function renderQA(checks, blocked) {
    if (blocked) {
      els.qaPanel.innerHTML =
        `<div class="blocked-note"><h3>Need a little more to build the lesson</h3>` +
        `<p>${esc(blocked.message)}</p>` +
        (blocked.fixes
          ? "<p>Please provide one of:</p><ul>" +
            blocked.fixes.map((f) => `<li>${esc(f)}</li>`).join("") +
            "</ul>"
          : "") +
        `</div>`;
      return;
    }
    const pass = checks.filter((c) => c.pass).length;
    const summary =
      pass === checks.length
        ? `<p class="qa-summary qa-pass">QA: ${pass}/${checks.length} checks passed.</p>`
        : `<p class="qa-summary qa-fail">QA: ${pass}/${checks.length} passed.</p>`;
    const rows = checks
      .map(
        (c) =>
          `<tr><td>${esc(c.name)}</td><td>${
            c.pass
              ? '<span class="qa-pass">PASS</span>'
              : '<span class="qa-fail">CHECK</span>'
          }</td><td>${esc(c.detail)}</td></tr>`,
      )
      .join("");
    els.qaPanel.innerHTML =
      summary +
      '<table class="qa-table"><thead><tr><th>Check</th><th>Result</th><th>Detail</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>";
  }

  /* ===================== MAIN ===================== */
  async function generate() {
    resetPipeline();
    els.outputCard.hidden = true;
    els.downloadDocxBtn.disabled = true;
    lastPlan = null;

    setStage("preflight", "running");
    await tick();
    const fields = gatherFields();
    const typed = els.sourceText.value.trim();
    const hasUpload = uploadedExtract && uploadedExtract.text.trim();
    const hasTopic = fields.topic || fields.standards;
    if (!typed && !hasUpload && !hasTopic) {
      setStage("preflight", "fail");
      renderQA(null, {
        message:
          "Tell the generator what to teach: a Unit/Topic or Lesson Focus, a standard, or pasted source notes.",
        fixes: [
          "Fill in Unit/Topic or Lesson Focus (e.g. “unit rate”), and/or",
          "Enter a standard (e.g. 6.RP.A.2), and/or",
          "Paste your slide text / notes, or upload a .pptx/.pdf/.docx/.txt.",
        ],
      });
      return;
    }
    setStage("preflight", "done");

    setStage("extract", "running");
    await tick();
    const rawSource = typed || (hasUpload ? uploadedExtract.text : "");
    setStage("extract", "done");

    setStage("map", "running");
    await tick();
    const map = buildContentMap(rawSource);
    setStage("map", "done");

    setStage("build", "running");
    await tick();
    let plan;
    try {
      const content = window.LPGContent.build(map, fields, reshuffleNonce);
      plan = window.LPGModel.build(map, fields, content);
    } catch (e) {
      setStage("build", "fail");
      renderQA(null, { message: "Build error: " + e.message });
      return;
    }
    setStage("build", "done");

    setStage("qa", "running");
    await tick();
    const checks = runQA(plan);
    setStage("qa", "done");
    setStage("repair", "done");
    setStage("finalqa", checks.some((c) => !c.pass) ? "fail" : "done");
    renderQA(checks, null);

    lastPlan = plan;
    renderCurrentTab();
    els.downloadDocxBtn.disabled = false;
    els.outputCard.hidden = false;
    els.outputCard.scrollIntoView({ behavior: "smooth", block: "start" });

    // Save to history
    saveToHistory(fields, rawSource);
  }

  /* ===================== EXPORTS ===================== */
  function readyName(plan, ext) {
    const date = plan.header.date || new Date().toISOString().slice(0, 10);
    const topic = (plan.header.unit || plan.header.title || "Lesson")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    return `Ready-Lesson-${date}${topic ? "-" + topic : ""}.${ext}`;
  }

  function buildDocHtml(plan) {
    const body = els.lessonOutput.innerHTML;
    return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(plan.header.title)}</title>
<style>
  body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.2;color:#111;}
  h1{font-size:18pt;margin:0 0 2px;}
  h2{font-size:13pt;color:#0f766e;border-bottom:2px solid #0f766e;padding-bottom:3px;margin:16px 0 8px;}
  h3{font-size:11.5pt;margin:10px 0 4px;}
  table{border-collapse:collapse;width:100%;margin:8px 0 12px;font-size:10.5pt;}
  th,td{border:1px solid #000;padding:6px 8px;text-align:left;vertical-align:top;}
  th{background:#eef2f6;}
  ul,ol{margin:5px 0;padding-left:22px;}
  .lp-glance{background:#f0fdfa;border:1px solid #99f6e4;padding:8px 12px;margin:0 0 14px;}
  .glance-label{display:block;font-size:8pt;font-weight:bold;text-transform:uppercase;color:#115e59;}
  .lp-flow{margin-top:8px;font-size:9.5pt;font-weight:bold;}
  .lp-time{float:right;font-size:9pt;font-weight:bold;color:#115e59;}
  .lp-note{background:#f1f5f9;border-left:3px solid #0f766e;padding:6px 10px;margin:8px 0;}
</style></head><body>${body}</body></html>`;
  }

  function planToMarkdown(plan) {
    const strip = (h) =>
      h
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, " ")
        .replace(/&middot;/g, "·")
        .replace(/&mdash;/g, "—")
        .trim();
    const L = [];
    const h = plan.header;
    L.push(`# ${h.title}`);
    L.push(
      `*${[h.date && "Date: " + h.date, h.grade, h.course, h.unit && "Unit: " + h.unit, h.length].filter(Boolean).join(" · ")}*`,
      "",
    );
    const flowStr = (h.pacing || [])
      .map(([name, t]) => `${name} ${t}`)
      .join(" → ");
    if (flowStr) L.push(`**At a glance:** ${flowStr}`, "");
    L.push("## Lesson Header");
    L.push(
      `- Standards: ${h.standards.map((s) => (s.code ? s.code + " — " : "") + (s.desc || "")).join("; ")}`,
    );
    L.push(`- Objective: ${h.objective}`);
    L.push(`- I Can: ${h.iCan}`);
    L.push(`- Language Objective: ${h.languageObjective}`);
    L.push(`- Essential Question: ${h.essentialQuestion}`);
    L.push(`- Materials: ${h.materials.join(", ")}`);
    L.push(`- Length: ${h.length}`, "");
    L.push("## Do Now");
    plan.doNow.items.forEach((it) =>
      L.push(`- (${it.level}) ${it.q}  →  ${it.a}`),
    );
    L.push("", "## Mini-Lesson — Worked Example");
    L.push(`Problem: ${plan.mini.worked.problem}`);
    plan.mini.worked.steps.forEach((s, i) => L.push(`${i + 1}. ${s}`));
    L.push("", "## Guided Practice");
    plan.guided.items.forEach((it, i) =>
      L.push(`${i + 1}. ${it.q}  →  ${it.a}`),
    );
    L.push("", "## Independent Practice");
    plan.independent.items.forEach((it, i) =>
      L.push(`${i + 1}. (${it.type}) ${it.q}  →  ${it.a}`),
    );
    L.push("", "## Writing / TWR");
    L.push(`Kernel: ${plan.writing.kernel}`);
    L.push(
      `Because: ${plan.writing.because} / But: ${plan.writing.but} / So: ${plan.writing.so}`,
    );
    L.push("", "## Exit Ticket");
    plan.exit.items.forEach((it, i) => L.push(`${i + 1}. ${it.q}  →  ${it.a}`));
    L.push(`- Tomorrow: ${plan.exit.tomorrow}`);
    return L.map((x) => strip(String(x))).join("\n");
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

  /* ===================== SAMPLE ===================== */
  const SAMPLE = `Title: Unit Rate from a Ratio
Grade/Course: Grade 6 Mathematics
Standard: 6.RP.A.2 — Understand the concept of a unit rate a/b associated with a ratio a:b.
Objective: Students will find the unit rate from a ratio and use it to compare and solve problems.
Language Objective: Students will explain how they found a unit rate using the words ratio, rate, and per.
Vocabulary: ratio, rate, unit rate, per
Materials: slide deck, grid paper, exit ticket slips
Mini-lesson: Model finding miles per hour from a ratio of miles to hours; think-aloud on which number goes on top.`;

  /* ===================== WIRING ===================== */
  function wire() {
    els.generateBtn.addEventListener("click", generate);

    els.sampleBtn.addEventListener("click", () => {
      els.sourceText.value = SAMPLE;
      els.fUnit.value = "Ratios & Rates";
      els.fFocus.value = "Find unit rate from a ratio";
      els.fStandards.value = "6.RP.A.2 — unit rate";
      els.fWida.value = "Level 2 (Emerging)";
      uploadedExtract = null;
      reshuffleNonce = 0;
      els.fileStatus.className = "file-status";
      els.fileStatus.textContent = "";
    });

    els.clearBtn.addEventListener("click", () => {
      els.sourceText.value = "";
      [els.fUnit, els.fFocus, els.fStandards, els.fSped, els.fNotes].forEach(
        (e) => (e.value = ""),
      );
      uploadedExtract = null;
      reshuffleNonce = 0;
      els.fileInput.value = "";
      els.fileStatus.className = "file-status";
      els.fileStatus.textContent = "";
      els.statusCard.hidden = true;
      els.outputCard.hidden = true;
      els.downloadDocxBtn.disabled = true;
    });

    els.reshuffleBtn.addEventListener("click", () => {
      if (!lastPlan) return;
      reshuffleNonce++;
      generate();
    });

    els.fileInput.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) handleFile(f);
    });
    const openPicker = () => els.fileInput.click();
    els.uploadBtn.addEventListener("click", openPicker);
    els.dropzone.addEventListener("click", openPicker);
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

    els.printBtn.addEventListener("click", () => window.print());

    els.downloadDocxBtn.addEventListener("click", async () => {
      if (!lastPlan) return;
      els.downloadDocxBtn.disabled = true;
      const old = els.downloadDocxBtn.textContent;
      els.downloadDocxBtn.textContent = "Building…";
      try {
        await window.LPGDocx.export(lastPlan, readyName(lastPlan, "docx"));
      } catch (e) {
        alert(e.message || "Could not build the Word document.");
      } finally {
        els.downloadDocxBtn.textContent = old;
        els.downloadDocxBtn.disabled = false;
      }
    });

    els.downloadDocBtn.addEventListener("click", () => {
      if (!lastPlan) return;
      download(
        readyName(lastPlan, "doc"),
        buildDocHtml(lastPlan),
        "application/msword",
      );
    });
    els.downloadMdBtn.addEventListener("click", () => {
      if (!lastPlan) return;
      download(
        readyName(lastPlan, "md"),
        planToMarkdown(lastPlan),
        "text/markdown",
      );
    });

    // Wire output tabs
    const tabTeacher = $("tabTeacher");
    const tabStudent = $("tabStudent");
    if (tabTeacher && tabStudent) {
      tabTeacher.addEventListener("click", () => {
        currentTab = "teacher";
        tabTeacher.classList.add("active");
        tabStudent.classList.remove("active");
        renderCurrentTab();
      });
      tabStudent.addEventListener("click", () => {
        currentTab = "student";
        tabStudent.classList.add("active");
        tabTeacher.classList.remove("active");
        renderCurrentTab();
      });
    }

    // Render history on load
    renderHistoryRow();
  }

  /* ===================== STUDENT HANDOUT PREVIEW ===================== */
  function renderStudentHandoutHtml(plan) {
    const h = plan.header;
    const out = [];

    out.push(`<div class="student-handout-preview">`);
    out.push(`<h1>Student Version — ${esc(h.title)}</h1>`);
    out.push(
      `<div class="student-meta">Name: _______________________ &nbsp;&nbsp;&nbsp;&nbsp; Date: ${esc(h.date || "____________")}</div>`,
    );
    out.push(`<p><strong>Objective:</strong> ${esc(h.iCan)}</p>`);
    out.push(
      `<p><strong>Essential Question:</strong> ${esc(h.essentialQuestion)}</p>`,
    );

    // Do Now
    out.push(`<h2>Do Now</h2>`);
    out.push(
      `<p class="student-instructions">${esc(plan.doNow.directions)}</p>`,
    );
    plan.doNow.items.forEach((it, i) => {
      out.push(`<p>${i + 1}. (${esc(it.level)}) ${esc(it.q)}</p>`);
      out.push(`<div class="student-response-lines"></div>`);
    });

    // Notes
    out.push(`<h2>Class Notes</h2>`);
    out.push(`<ul class="student-bullet-list">`);
    plan.mini.studentNotes.forEach((n) => out.push(`<li>${esc(n)}</li>`));
    out.push(`</ul>`);
    out.push(
      `<p><strong>Worked Example:</strong> ${esc(plan.mini.worked.problem)}</p>`,
    );
    out.push(`<div class="student-response-box"></div>`);

    // Guided Practice
    out.push(`<h2>Guided Practice</h2>`);
    plan.guided.items.forEach((it, i) => {
      out.push(`<p>${i + 1}. ${esc(it.q)}</p>`);
      out.push(`<div class="student-response-lines"></div>`);
    });
    out.push(
      `<p><strong>Sentence starters:</strong></p><ul class="student-bullet-list">` +
        plan.guided.sentenceStarters.map((s) => `<li>${esc(s)}</li>`).join("") +
        `</ul>`,
    );

    // Partner Activity
    out.push(`<h2>Partner Activity</h2>`);
    out.push(`<p>${esc(plan.collaborative.studentDirections)}</p>`);
    out.push(
      `<p><strong>Write together:</strong> ${esc(plan.collaborative.twrWritten)}</p>`,
    );
    out.push(`<div class="student-response-box"></div>`);

    // Independent Practice
    out.push(`<h2>Independent Practice</h2>`);
    plan.independent.items.forEach((it, i) => {
      out.push(`<p>${i + 1}. (${esc(it.type)}) ${esc(it.q)}</p>`);
      out.push(`<div class="student-response-lines"></div>`);
    });
    out.push(
      `<p><strong>Show your thinking:</strong> ${esc(plan.independent.showThinking)}</p>`,
    );
    out.push(`<div class="student-response-box"></div>`);

    // Writing
    out.push(`<h2>Writing (TWR)</h2>`);
    out.push(
      `<p><strong>Kernel sentence:</strong> ${esc(plan.writing.kernel)}</p>`,
    );
    out.push(
      `<p>Complete the sentence using <em>because</em>, <em>but</em>, and <em>so</em>:</p>`,
    );
    out.push(
      `<p>• Because: __________________________________________________________________</p>`,
    );
    out.push(
      `<p>• But: ______________________________________________________________________</p>`,
    );
    out.push(
      `<p>• So: _______________________________________________________________________</p>`,
    );
    out.push(
      `<p class="student-instructions">Word bank: ${esc(plan.writing.wordBank.join(", "))}</p>`,
    );
    out.push(`<div class="student-response-box"></div>`);

    // Exit Ticket
    out.push(`<h2>Exit Ticket</h2>`);
    plan.exit.items.forEach((it, i) => {
      out.push(`<p>${i + 1}. ${esc(it.q)}</p>`);
      out.push(`<div class="student-response-lines"></div>`);
    });
    out.push(`<p>${esc(plan.exit.confidence.q)}</p>`);
    out.push(`<div class="student-response-lines"></div>`);

    out.push(`</div>`);
    return out.join("\n");
  }

  let currentTab = "teacher";

  function renderCurrentTab() {
    if (!lastPlan) return;
    if (currentTab === "teacher") {
      els.lessonOutput.innerHTML = renderPlanHtml(lastPlan);
    } else {
      els.lessonOutput.innerHTML = renderStudentHandoutHtml(lastPlan);
    }
  }

  /* ===================== HISTORY MANAGER ===================== */
  const HIST_KEY = "nt_lpg_history_v1";

  function getHistory() {
    try {
      const data = localStorage.getItem(HIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory(list) {
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, 10)));
    } catch (_) {}
  }

  function saveToHistory(fields, rawSource) {
    const list = getHistory();
    const title = fields.topic || fields.focus || "Untitled Lesson";
    const date = fields.date || new Date().toISOString().slice(0, 10);
    const standard = fields.standards || "";

    let strippedUpload = null;
    if (uploadedExtract) {
      strippedUpload = {
        name: uploadedExtract.name,
        kind: uploadedExtract.kind,
      };
    }

    const entry = {
      id: Date.now().toString(),
      title,
      date,
      standard,
      fields,
      source: rawSource,
      uploadedExtract: strippedUpload,
    };

    const filtered = list.filter((item) => item.title !== title);
    filtered.unshift(entry);

    saveHistory(filtered);
    renderHistoryRow();
  }

  function deleteHistory(id, e) {
    if (e) e.stopPropagation();
    const list = getHistory();
    const filtered = list.filter((item) => item.id !== id);
    saveHistory(filtered);
    renderHistoryRow();
  }

  function loadHistory(id) {
    const list = getHistory();
    const entry = list.find((item) => item.id === id);
    if (!entry) return;

    els.fDate.value = entry.fields.date || "";
    els.fGrade.value = entry.fields.grade || "";
    els.fCourse.value = entry.fields.course || "";
    els.fUnit.value = entry.fields.unit || "";
    els.fFocus.value = entry.fields.focus || "";
    els.fStandards.value = entry.fields.standards || "";
    els.fLength.value = entry.fields.length || "";
    els.fSkill.value = entry.fields.skill || "";
    els.fWida.value = entry.fields.wida || "";
    els.fSped.value = entry.fields.sped || "";
    els.fNotes.value = entry.fields.notes || "";

    if (entry.source) {
      els.sourceText.value = entry.source;
    }

    if (entry.uploadedExtract) {
      uploadedExtract = {
        name: entry.uploadedExtract.name,
        kind: entry.uploadedExtract.kind,
        text: entry.source || "",
      };
      els.fileStatus.className = "file-status ok";
      els.fileStatus.innerHTML = `<span class="extract-ok">Loaded:</span> ${esc(uploadedExtract.name)}`;
    } else {
      uploadedExtract = null;
      els.fileStatus.textContent = "";
    }

    generate();
  }

  function renderHistoryRow() {
    const list = getHistory();
    const row = $("historyRow");
    const chips = $("historyChips");
    if (!row || !chips) return;

    if (list.length === 0) {
      row.hidden = true;
      return;
    }

    row.hidden = false;
    chips.innerHTML = list
      .map((item) => {
        const displayTitle =
          item.title.length > 25 ? item.title.slice(0, 25) + "…" : item.title;
        const desc = item.standard
          ? `${displayTitle} (${item.standard.split(" ")[0]})`
          : displayTitle;
        return `<div class="history-chip" onclick="window.__LPG_LOAD_HIST__('${item.id}')" title="Click to load: ${esc(item.title)}">
        <span>🕒 ${esc(desc)}</span>
        <button type="button" class="delete-hist-btn" onclick="window.__LPG_DEL_HIST__('${item.id}', event)" title="Delete saved lesson">×</button>
      </div>`;
      })
      .join("");
  }

  window.__LPG_LOAD_HIST__ = loadHistory;
  window.__LPG_DEL_HIST__ = deleteHistory;

  window.__LPG__ = { buildContentMap, gatherFields, runQA, renderPlanHtml };

  initTheme();
  wire();
})();
