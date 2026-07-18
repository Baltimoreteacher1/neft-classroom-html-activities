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
    copyBtn: $("copyBtn"),
    exportStatus: $("exportStatus"),
    outputTitle: $("outputTitle"),
    // class support profile
    profileText: $("profileText"),
    profilePreviewBtn: $("profilePreviewBtn"),
    profileUploadBtn: $("profileUploadBtn"),
    profileFileInput: $("profileFileInput"),
    profileSampleBtn: $("profileSampleBtn"),
    profileTemplateBtn: $("profileTemplateBtn"),
    profilePreview: $("profilePreview"),
    profileEditView: $("profileEditView"),
    profileLockedView: $("profileLockedView"),
    profileLockedLabel: $("profileLockedLabel"),
    profileChips: $("profileChips"),
    profileReplaceBtn: $("profileReplaceBtn"),
    profileClearBtn: $("profileClearBtn"),
    profileIncludeIds: $("profileIncludeIds"),
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
      const now = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", now);
      localStorage.setItem("nt_lpg_theme", now);
    });
  }

  /* ===================== PIPELINE UI ===================== */
  const STAGES = ["preflight", "extract", "map", "build", "qa", "repair", "finalqa"];
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
  // jszip is only needed for .pptx/.docx uploads, so it is lazy-loaded on
  // first use instead of with the page.
  let jszipPromise = null;
  function ensureJSZip() {
    if (typeof window.JSZip !== "undefined") return Promise.resolve(window.JSZip);
    if (!jszipPromise) {
      jszipPromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "/teacher-tools/lesson-plan-generator/vendor/jszip.min.js";
        s.onload = () => resolve(window.JSZip);
        s.onerror = () => {
          jszipPromise = null;
          reject(
            new Error(
              "The file reader library (jszip) could not load. Copy the text and paste it into the text box instead.",
            ),
          );
        };
        document.head.appendChild(s);
      });
    }
    return jszipPromise;
  }

  // One text line per paragraph. Runs inside a paragraph are joined with NO
  // separator — PowerPoint splits runs mid-word on any formatting change, so
  // joining with spaces breaks words apart ("Objec tive"). <a:br/> is a real
  // line break inside a paragraph.
  function pptxParagraphs(xml) {
    const paras = [];
    for (const p of xml.split(/<\/a:p>|<a:br\s*\/>/)) {
      const runs = [...p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXml(m[1]));
      const text = runs
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim();
      if (text) paras.push(text);
    }
    return paras;
  }

  // Splits one slide (or notes-slide) XML into { title, body[] }, preserving
  // shape boundaries, table rows, and paragraph order inside each shape.
  function pptxSlideStructure(xml) {
    // <a:fld> = auto fields (slide number, date) — noise, never lesson content.
    let rest = xml.replace(/<a:fld[^>]*>[\s\S]*?<\/a:fld>/g, "");
    const titleLines = [];
    const body = [];
    for (const shape of rest.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || []) {
      rest = rest.replace(shape, "");
      const isTitle = /<p:ph[^>]*type="(?:title|ctrTitle)"/.test(shape);
      (isTitle ? titleLines : body).push(...pptxParagraphs(shape));
    }
    for (const tbl of rest.match(/<a:tbl>[\s\S]*?<\/a:tbl>/g) || []) {
      rest = rest.replace(tbl, "");
      for (const tr of tbl.split(/<\/a:tr>/)) {
        const cells = tr
          .split(/<\/a:tc>/)
          .map((c) => pptxParagraphs(c).join(" "))
          .filter(Boolean);
        if (cells.length === 2) body.push(cells[0].replace(/[:\s]+$/, "") + ": " + cells[1]);
        else if (cells.length) body.push(cells.join(" | "));
      }
    }
    body.push(...pptxParagraphs(rest)); // anything left (grouped shapes etc.)
    return { title: titleLines.join(" ").trim(), body };
  }

  async function extractPptx(arrayBuffer) {
    const JSZip = await ensureJSZip();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = +(a.match(/slide(\d+)\.xml/) || [])[1];
        const nb = +(b.match(/slide(\d+)\.xml/) || [])[1];
        return na - nb;
      });
    if (!slideFiles.length) throw new Error("No slides found in the .pptx.");

    // Speaker notes are resolved through each slide's .rels file — notesSlide
    // numbering is NOT guaranteed to match slide numbering.
    async function speakerNotesFor(slideName) {
      const relFile = zip.files[slideName.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels"];
      if (!relFile) return null;
      const m = (await relFile.async("string")).match(/Target="[^"]*?(notesSlide\d+\.xml)"/);
      const f = m && zip.files["ppt/notesSlides/" + m[1]];
      return f ? f.async("string") : null;
    }

    const results = [];
    let notesCount = 0;
    for (let i = 0; i < slideFiles.length; i++) {
      const name = slideFiles[i];
      const n = (name.match(/slide(\d+)/) || [])[1];
      const slide = pptxSlideStructure(await zip.files[name].async("string"));
      const notesXml = await speakerNotesFor(name);
      const notes = notesXml ? pptxSlideStructure(notesXml).body : [];
      if (notes.length) notesCount++;
      const lines = [`--- Slide ${n}${slide.title ? " · " + slide.title : ""} ---`];
      if (slide.title) lines.push(slide.title);
      lines.push(...slide.body);
      if (notes.length) lines.push("Speaker notes: " + notes.join(" "));
      results.push({ hasText: !!(slide.title || slide.body.length || notes.length), lines });
      els.fileStatus.textContent = `Reading slide ${i + 1} of ${slideFiles.length}…`;
      if (i % 3 === 0) {
        await yieldCpu();
      }
    }
    const text = results
      .filter((r) => r.hasText)
      .map((r) => r.lines.join("\n"))
      .join("\n\n");
    return {
      text,
      summary:
        `${slideFiles.length} slide${slideFiles.length === 1 ? "" : "s"}` +
        (notesCount ? `, speaker notes on ${notesCount}` : ""),
    };
  }

  function docxParagraphText(pXml) {
    // <w:t> or <w:t xml:space="preserve"> ONLY — a bare [^>]* would also
    // match <w:tr>/<w:tc>/<w:tbl> and leak raw markup into the text.
    const runs = [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) =>
      decodeXml(m[1]),
    );
    return runs
      .join("")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  async function extractDocx(arrayBuffer) {
    const JSZip = await ensureJSZip();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docFile = zip.files["word/document.xml"];
    if (!docFile) throw new Error("No word/document.xml in the .docx.");
    let xml = await docFile.async("string");
    xml = xml
      // mc:Fallback duplicates every text box's content — keep one copy only.
      .replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, "")
      // Tabs and manual line breaks otherwise glue words together.
      .replace(/<w:tab\s*\/>/g, "<w:t> </w:t>")
      .replace(/<w:br[^>]*\/>|<w:cr\s*\/>/g, "</w:p><w:p>");

    // Tables in place: lesson-plan templates are usually two-column
    // label/value tables, which read best as "Label: value" lines. Rendered
    // rows are re-embedded as paragraphs so document order is preserved.
    let tableRows = 0;
    const reEnc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    xml = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (tbl) => {
      const rows = [];
      for (const tr of tbl.split(/<\/w:tr>/)) {
        const cells = tr
          .split(/<\/w:tc>/)
          .map((tc) =>
            tc
              .split(/<\/w:p>/)
              .map(docxParagraphText)
              .filter(Boolean)
              .join(" "),
          )
          .filter(Boolean);
        if (!cells.length) continue;
        tableRows++;
        if (cells.length === 2) rows.push(cells[0].replace(/[:\s]+$/, "") + ": " + cells[1]);
        else rows.push(cells.join(" | "));
      }
      return rows.map((r) => `<w:p><w:t>${reEnc(r)}</w:t></w:p>`).join("");
    });

    const paras = xml.split(/<\/w:p>/).map(docxParagraphText);
    const text = paras.filter(Boolean).join("\n");
    if (!text) throw new Error("The .docx contained no readable text.");
    return {
      text,
      summary: tableRows ? `incl. ${tableRows} table row${tableRows === 1 ? "" : "s"}` : "",
    };
  }

  async function extractPdf(arrayBuffer) {
    let pdfjs;
    try {
      pdfjs = await import("/teacher-tools/lesson-plan-generator/vendor/pdf.min.mjs");
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
    const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    const results = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      // Rebuild real lines from the hasEOL markers so "Label: value" rows in
      // the PDF survive as their own lines instead of one page-long run-on.
      const lines = [];
      let line = [];
      for (const it of content.items) {
        if (it.str && it.str.trim()) line.push(it.str.trim());
        if (it.hasEOL && line.length) {
          lines.push(line.join(" "));
          line = [];
        }
      }
      if (line.length) lines.push(line.join(" "));
      const txt = lines
        .join("\n")
        .replace(/[ \t]+/g, " ")
        .trim();
      results.push({ p, txt });
      els.fileStatus.textContent = `Reading page ${p} of ${doc.numPages}…`;
      if (p % 2 === 0) {
        await yieldCpu();
      }
    }
    const out = results.filter((r) => r.txt).map((r) => `--- Page ${r.p} ---\n${r.txt}`);
    const text = out.join("\n\n");
    if (!text)
      throw new Error(
        "No selectable text found in the PDF (it may be scanned images). Paste the text instead.",
      );
    return { text, summary: `${doc.numPages} page${doc.numPages === 1 ? "" : "s"}` };
  }

  function safeChar(code) {
    try {
      return String.fromCodePoint(code);
    } catch (_) {
      return "";
    }
  }
  function decodeXml(s) {
    return s
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeChar(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
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

  // Formats we can't parse, with the exact export path that produces one we can.
  const CONVERT_HINTS = {
    ".ppt":
      "This is the old PowerPoint format. Open it and File → Save As → .pptx (or in Google Slides: File → Download → Microsoft PowerPoint), then upload the .pptx.",
    ".doc":
      "This is the old Word format. Open it and File → Save As → .docx, then upload the .docx.",
    ".odp": "Export it as .pptx (File → Save As → PowerPoint format), then upload the .pptx.",
    ".odt": "Export it as .docx (File → Save As → Word format), then upload the .docx.",
    ".key": "In Keynote use File → Export To → PowerPoint (.pptx), then upload the .pptx.",
    ".pages": "In Pages use File → Export To → Word (.docx) or PDF, then upload that file.",
    ".gdoc":
      "This is only a link to a Google Doc. In Google Docs use File → Download → Word (.docx) or PDF, then upload the downloaded file.",
    ".gslides":
      "This is only a link to Google Slides. Use File → Download → Microsoft PowerPoint (.pptx), then upload the downloaded file.",
  };

  async function handleFile(file, ignoredCount) {
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
      const ext = (lower.match(/\.[a-z0-9]+$/) || [""])[0];
      if (CONVERT_HINTS[ext]) throw new Error(CONVERT_HINTS[ext]);
      let out;
      let kind = "";
      if (lower.endsWith(".pptx")) {
        kind = "PowerPoint slides";
        out = await extractPptx(await file.arrayBuffer());
      } else if (lower.endsWith(".docx")) {
        kind = "Word document";
        out = await extractDocx(await file.arrayBuffer());
      } else if (lower.endsWith(".pdf")) {
        kind = "PDF";
        out = await extractPdf(await file.arrayBuffer());
      } else if (lower.endsWith(".txt")) {
        kind = "text file";
        out = { text: await file.text(), summary: "" };
      } else {
        throw new Error("Unsupported file type. Use .pptx, .pdf, .docx, .txt.");
      }
      if (!out.text || !out.text.trim()) {
        throw new Error(
          "No readable text was found in this file. Copy the content and paste it into the box instead.",
        );
      }
      uploadedExtract = { text: out.text, name, kind };
      els.fileStatus.className = "file-status ok";
      const detail = [out.summary, `${out.text.length.toLocaleString()} characters`]
        .filter(Boolean)
        .join(" · ");
      els.fileStatus.innerHTML =
        `<strong>${esc(name)}</strong> (${kind})<br>` +
        `<span class="extract-ok">Extracted ✓ (${detail})</span> — review the text below, then click Generate.` +
        (ignoredCount
          ? `<br><span class="muted small">Only one file at a time — ${ignoredCount} other dropped file${ignoredCount === 1 ? " was" : "s were"} ignored.</span>`
          : "");
      els.sourceText.value = out.text;
    } catch (e) {
      uploadedExtract = null;
      els.fileStatus.className = "file-status bad";
      els.fileStatus.innerHTML = `<strong>Could not read this file:</strong> ${esc(e.message)}`;
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

    // Slide titles from the pptx extractor's slide markers — the strongest
    // title signal an upload can carry. Markers are then excluded from the
    // label-matching passes so "--- Slide 3 · Objective ---" never satisfies a
    // "label: value" regex by accident.
    const slideTitles = [...text.matchAll(/^--- Slide \d+ · (.+?) ---$/gm)]
      .map((m) => m[1].trim())
      .filter(Boolean);

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^---/.test(l));

    const segments = [];
    const rawSegs = text.split(/[\n;•]+/);
    for (const rSeg of rawSegs) {
      const trimmed = rSeg.trim();
      if (!trimmed || /^---/.test(trimmed)) continue;
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
    const lbl = (alts) => new RegExp(`(?:^|\\b)(?:${alts})\\s*[:\\-=]\\s*(.+)`, "i");
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
      grab(/\b((?:swbat|students will(?:\s+be able to)?|we will|i can)\b\s*[:\-]?\s*.+)/i);
    map.languageObjective = grab(lbl("language objective|lang objective|esol objective"));

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
    if (!map.standards.length && stdLine) map.standards.push({ code: "", desc: stdLine });

    map.materials = grabList("materials");
    if (!map.materials.length) map.materials = grabList("resources");
    map.vocabulary = grabList("vocabulary|vocab|key terms?");

    map.phases.mini = grab(lbl("mini[\\- ]?lesson|modeling|direct instruction|i do")) || null;

    if (!map.title && slideTitles.length) {
      // First slide title that names the lesson (skip boilerplate slides).
      // Ranked ABOVE the loose topic/unit grab: "Understanding Unit Rate"
      // must win over the "\bunit\b …" pattern capturing just "Rate".
      const boilerplate =
        /^(?:agenda|do now|warm[\s-]?up|objectives?|standards?|vocabulary|exit (?:ticket|slip)|homework|review|today|welcome|bell\s?ringer|announcements?|guided practice|independent practice|closure)\b[\s:.!]*$/i;
      map.title = slideTitles.find((t) => t.length <= 120 && !boilerplate.test(t)) || null;
    }
    if (!map.title) map.title = grab(/\b(?:lesson on|topic|unit|teaching)\s*[:\-]?\s*(.+)/i);
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
  const REQUIRED_ANY = () => [els.fUnit, els.fFocus, els.fStandards];
  function markInvalid(el, on) {
    if (!el) return;
    el.classList.toggle("field-invalid", !!on);
    if (on) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  }
  function clearInvalidMarks() {
    REQUIRED_ANY()
      .concat([els.sourceText])
      .forEach((el) => markInvalid(el, false));
  }

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
    add("Printable student version", true, "Answer-free student version included in the DOCX.");
    if (plan.meta.profileApplied) {
      add(
        "Profile-driven differentiation",
        plan.differentiation.sped.length + plan.differentiation.esol.length >= 4 &&
          !!(
            (plan.exit.accommodations && plan.exit.accommodations.length) ||
            plan.independent.coreSet ||
            (plan.differentiation.grouping && plan.differentiation.grouping.length)
          ),
        "The locked class profile changed supports, grouping, pacing, and/or assessment.",
      );
    }
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
      rows.map((r) => "<tr>" + r.map((c) => `<td>${esc(c)}</td>`).join("") + "</tr>").join("") +
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
  const kv = (label, val) => `<p class="lp-kv"><strong>${esc(label)}:</strong> ${esc(val)}</p>`;
  // Scannable callout for "what the teacher actually does / decides" lines.
  const note = (label, val) => `<p class="lp-note"><strong>${esc(label)}:</strong> ${esc(val)}</p>`;
  const noteList = (label, arr) =>
    `<div class="lp-note"><strong>${esc(label)}:</strong>` + ul(arr) + `</div>`;
  // Per-phase "initials — modification" callout (teacher plan only; the
  // student handout renderer never calls this).
  const supportsList = (arr) =>
    arr && arr.length ? noteList("Student supports (teacher-facing)", arr) : "";

  function renderPlanHtml(plan) {
    const h = plan.header;
    // Optional 4th arg = a time chip shown on the section heading.
    const sec = (n, title, inner, time) =>
      `<section class="lp-block"><h2 class="lp-sec">${n} · ${esc(title)}` +
      (time ? `<span class="lp-time"><span aria-hidden="true">⏱</span> ${esc(time)}</span>` : "") +
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
      .map(([name, t]) => `<span class="flow-step">${esc(name)} <em>${esc(t)}</em></span>`)
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
              h.standards.map((s) => (s.code ? s.code + " — " : "") + (s.desc || "")).join("; "),
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
          ["Term", "Student-friendly definition", "Spanish", "ESOL sentence frame"],
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
          note("Teacher move", plan.doNow.teacherMove) +
          supportsList(plan.doNow.studentSupports),
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
          kv("Correction", m.worked.correction) +
          supportsList(m.studentSupports),
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
          ul(plan.guided.sentenceStarters) +
          supportsList(plan.guided.studentSupports),
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
          kv("Written response (TWR)", c.twrWritten) +
          supportsList(c.studentSupports),
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
          kv("Extension", plan.independent.extension) +
          (plan.independent.coreSet ? note("Core set", plan.independent.coreSet) : "") +
          supportsList(plan.independent.studentSupports),
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
          kv("Expected response", w.expected) +
          (w.supports && w.supports.length
            ? noteList("Language & writing supports for this class", w.supports)
            : ""),
        plan.timing && plan.timing.writing,
      ),
    );

    // 10 Differentiation
    const d = plan.differentiation;
    rows.push(
      sec(
        10,
        "Differentiation",
        (d.profileNote ? `<p class="lp-profile-note">${esc(d.profileNote)}</p>` : "") +
          (d.perStudent && d.perStudent.length
            ? "<h3 class='lp-sub-h'>Per-student modifications (teacher-facing)</h3>" +
              tableHtml(
                ["Student", "Plan", "Today's modifications"],
                d.perStudent.map((s) => [s.id, s.plan, s.mods]),
              )
            : "") +
          "<h3 class='lp-sub-h'>ESOL / WIDA</h3>" +
          ul(d.esol) +
          "<h3 class='lp-sub-h'>SPED</h3>" +
          ul(d.sped) +
          (d.grouping && d.grouping.length
            ? "<h3 class='lp-sub-h'>Grouping for this class</h3>" + ul(d.grouping)
            : "") +
          "<h3 class='lp-sub-h'>Newcomer</h3>" +
          ul(d.newcomer) +
          "<h3 class='lp-sub-h'>On-grade</h3>" +
          ul(d.onGrade) +
          "<h3 class='lp-sub-h'>Extension / enrichment</h3>" +
          ul(d.extension) +
          kv("Small-group reteach", d.reteach) +
          kv("Early finishers", d.earlyFinishers) +
          (d.pacing ? note("Pacing", d.pacing) : ""),
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
          (plan.exit.accommodations && plan.exit.accommodations.length
            ? noteList("Assessment accommodations", plan.exit.accommodations)
            : "") +
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
  function renderQA(checks, blocked, notices) {
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
            c.pass ? '<span class="qa-pass">PASS</span>' : '<span class="qa-fail">CHECK</span>'
          }</td><td>${esc(c.detail)}</td></tr>`,
      )
      .join("");
    const noticeHtml = (notices || [])
      .map(
        (n) =>
          `<p class="qa-notice ${n.kind === "ok" ? "qa-notice-ok" : "qa-notice-warn"}">` +
          `<span aria-hidden="true">${n.kind === "ok" ? "✓" : "⚠"}</span> ${esc(n.text)}</p>`,
      )
      .join("");
    els.qaPanel.innerHTML =
      summary +
      noticeHtml +
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
    clearInvalidMarks();
    setExportStatus("");

    setStage("preflight", "running");
    await tick();
    const fields = gatherFields();
    const typed = els.sourceText.value.trim();
    const hasUpload = uploadedExtract && uploadedExtract.text.trim();
    const hasTopic = fields.topic || fields.standards;
    if (!typed && !hasUpload && !hasTopic) {
      setStage("preflight", "fail");
      REQUIRED_ANY()
        .concat([els.sourceText])
        .forEach((el) => markInvalid(el, true));
      renderQA(null, {
        message:
          "Tell the generator what to teach: a Unit/Topic or Lesson Focus, a standard, or pasted source notes. The highlighted fields are where that goes.",
        fixes: [
          "Fill in Unit/Topic or Lesson Focus (e.g. “unit rate”), and/or",
          "Enter a standard (e.g. 6.AT.A.2), and/or",
          "Paste your slide text / notes, or upload a .pptx/.pdf/.docx/.txt.",
        ],
      });
      if (els.fUnit) els.fUnit.focus();
      return;
    }
    setStage("preflight", "done");

    // Class support profile — locked profile drives real differentiation.
    // If the teacher pasted a support list but never clicked Lock, auto-lock
    // it now so the supports integrate instead of being silently dropped.
    lastAutoLockFailed = false;
    if (!window.LPGProfile.load() && els.profileText && els.profileText.value.trim()) {
      const parsed = window.LPGProfile.parse(els.profileText.value);
      if (parsed.students.length) {
        saveLockedProfile(
          parsed.students,
          parsed.warnings.concat(parsed.errors),
          `Class support profile auto-locked (${parsed.students.length} student${parsed.students.length === 1 ? "" : "s"}) and applied to this plan.`,
        );
      } else {
        lastAutoLockFailed = true;
      }
    }
    fields.profile = activeProfileForGeneration(fields);

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
    renderQA(checks, null, buildNotices(plan, fields));

    lastPlan = plan;
    renderCurrentTab();
    els.downloadDocxBtn.disabled = false;
    els.outputCard.hidden = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    els.outputCard.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    if (els.outputTitle) els.outputTitle.focus({ preventScroll: true });

    // Save to history
    saveToHistory(fields, rawSource);
  }

  /* Advisory notices — the plan still generates, but the teacher should know. */
  let lastAutoLockFailed = false;
  function buildNotices(plan, fields) {
    const notices = [];
    if (fields.profile) {
      notices.push({
        kind: "ok",
        text: `Class support profile applied (${fields.profile.summary.total} student${fields.profile.summary.total === 1 ? "" : "s"}) — student supports appear inside each section${fields.profile.includeIds ? " with initials" : ""}, plus the per-student table in Section 10.`,
      });
    } else if (lastAutoLockFailed) {
      notices.push({
        kind: "warn",
        text: "The support list in Section 2 could not be read, so this plan was generated WITHOUT it. Check the format (one student per line, e.g. “A1 — IEP, extended time”) or click “Preview supports” to see what went wrong.",
      });
    }
    if (plan.meta.generic) {
      notices.push({
        kind: "warn",
        text: "No Grade-6 math domain was detected, so the practice problems are scaffolds to fill from your source. Add a standard (e.g. 6.AT.A.2) or a math topic for a fully worked problem set.",
      });
    }
    const st = plan.header.standards;
    if (st.length === 1 && !st[0].code && /^Add the Grade/.test(st[0].desc)) {
      notices.push({
        kind: "warn",
        text: "No standard was given — Section 1 contains a placeholder to fill in before you share this plan.",
      });
    }
    const gradeDigits = String(fields.grade || "").match(/\d+/);
    if (gradeDigits && gradeDigits[0] !== "6") {
      notices.push({
        kind: "warn",
        text: `The built-in problem library is Grade 6 — double-check that the practice numbers fit Grade ${gradeDigits[0]}.`,
      });
    }
    return notices;
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
    // Always export the full teacher plan, regardless of which tab is open.
    const body = renderPlanHtml(plan);
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
    const flowStr = (h.pacing || []).map(([name, t]) => `${name} ${t}`).join(" → ");
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
    plan.doNow.items.forEach((it) => L.push(`- (${it.level}) ${it.q}  →  ${it.a}`));
    L.push("", "## Mini-Lesson — Worked Example");
    L.push(`Problem: ${plan.mini.worked.problem}`);
    plan.mini.worked.steps.forEach((s, i) => L.push(`${i + 1}. ${s}`));
    L.push("", "## Guided Practice");
    plan.guided.items.forEach((it, i) => L.push(`${i + 1}. ${it.q}  →  ${it.a}`));
    L.push("", "## Independent Practice");
    plan.independent.items.forEach((it, i) => L.push(`${i + 1}. (${it.type}) ${it.q}  →  ${it.a}`));
    if (plan.independent.coreSet) L.push(`- ${plan.independent.coreSet}`);
    L.push("", "## Writing / TWR");
    L.push(`Kernel: ${plan.writing.kernel}`);
    L.push(`Because: ${plan.writing.because} / But: ${plan.writing.but} / So: ${plan.writing.so}`);
    L.push("", "## Differentiation");
    (plan.differentiation.perStudent || []).forEach((s) =>
      L.push(`- (Student) ${s.id} [${s.plan}]: ${s.mods}`),
    );
    plan.differentiation.esol.forEach((x) => L.push(`- (ESOL) ${x}`));
    plan.differentiation.sped.forEach((x) => L.push(`- (SPED) ${x}`));
    (plan.differentiation.grouping || []).forEach((x) => L.push(`- (Grouping) ${x}`));
    if (plan.differentiation.pacing) L.push(`- (Pacing) ${plan.differentiation.pacing}`);
    L.push("", "## Exit Ticket");
    plan.exit.items.forEach((it, i) => L.push(`${i + 1}. ${it.q}  →  ${it.a}`));
    (plan.exit.accommodations || []).forEach((x) => L.push(`- (Accommodation) ${x}`));
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
Standard: 6.AT.A.2 — Understand the concept of a unit rate a/b associated with a ratio a:b.
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
      els.fStandards.value = "6.AT.A.2 — unit rate";
      els.fWida.value = "Level 2 (Emerging)";
      uploadedExtract = null;
      reshuffleNonce = 0;
      els.fileStatus.className = "file-status";
      els.fileStatus.textContent = "";
    });

    els.clearBtn.addEventListener("click", () => {
      els.sourceText.value = "";
      [els.fUnit, els.fFocus, els.fStandards, els.fSped, els.fNotes].forEach((e) => (e.value = ""));
      // Restore defaults instead of leaving stale values behind.
      els.fGrade.value = "6";
      els.fCourse.value = "Mathematics";
      els.fLength.value = "45–60 minutes";
      els.fSkill.value = "";
      els.fWida.value = "";
      setDefaultDate();
      uploadedExtract = null;
      reshuffleNonce = 0;
      lastPlan = null;
      els.fileInput.value = "";
      els.fileStatus.className = "file-status";
      els.fileStatus.textContent = "";
      els.statusCard.hidden = true;
      els.outputCard.hidden = true;
      els.downloadDocxBtn.disabled = true;
      clearInvalidMarks();
      setExportStatus("");
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
      const files = (e.dataTransfer && e.dataTransfer.files) || [];
      if (files[0]) handleFile(files[0], files.length - 1);
    });

    els.printBtn.addEventListener("click", () => window.print());

    els.downloadDocxBtn.addEventListener("click", async () => {
      if (!lastPlan) return;
      els.downloadDocxBtn.disabled = true;
      const old = els.downloadDocxBtn.textContent;
      els.downloadDocxBtn.textContent = "Building…";
      try {
        await window.LPGDocx.export(lastPlan, readyName(lastPlan, "docx"));
        setExportStatus("Word document downloaded — check your Downloads folder.", "ok");
      } catch (e) {
        setExportStatus(
          (e && e.message) ||
            "Could not build the Word document. Reload the page and try again, or use Print / PDF.",
          "bad",
        );
      } finally {
        els.downloadDocxBtn.textContent = old;
        els.downloadDocxBtn.disabled = false;
      }
    });

    els.downloadDocBtn.addEventListener("click", () => {
      if (!lastPlan) return;
      download(readyName(lastPlan, "doc"), buildDocHtml(lastPlan), "application/msword");
    });
    els.downloadMdBtn.addEventListener("click", () => {
      if (!lastPlan) return;
      download(readyName(lastPlan, "md"), planToMarkdown(lastPlan), "text/markdown");
    });

    if (els.copyBtn) els.copyBtn.addEventListener("click", copyPlan);

    // Wire output tabs
    const tabTeacher = $("tabTeacher");
    const tabStudent = $("tabStudent");
    const selectTab = (which) => {
      currentTab = which;
      const isTeacher = which === "teacher";
      tabTeacher.classList.toggle("active", isTeacher);
      tabStudent.classList.toggle("active", !isTeacher);
      tabTeacher.setAttribute("aria-selected", String(isTeacher));
      tabStudent.setAttribute("aria-selected", String(!isTeacher));
      els.lessonOutput.setAttribute("aria-labelledby", isTeacher ? "tabTeacher" : "tabStudent");
      renderCurrentTab();
    };
    if (tabTeacher && tabStudent) {
      tabTeacher.addEventListener("click", () => selectTab("teacher"));
      tabStudent.addEventListener("click", () => selectTab("student"));
      // Left/right arrows move between the two tabs (WAI-ARIA tabs pattern).
      [tabTeacher, tabStudent].forEach((tab) =>
        tab.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const next = tab === tabTeacher ? tabStudent : tabTeacher;
          next.focus();
          selectTab(next === tabTeacher ? "teacher" : "student");
        }),
      );
    }

    wireProfile();

    // Render history on load
    renderHistoryRow();
  }

  /* ===================== EXPORT STATUS + COPY ===================== */
  let exportStatusTimer = null;
  function setExportStatus(msg, kind) {
    if (!els.exportStatus) return;
    clearTimeout(exportStatusTimer);
    els.exportStatus.textContent = msg || "";
    els.exportStatus.className = "export-status small" + (kind ? " " + kind : "");
    if (msg) {
      exportStatusTimer = setTimeout(() => {
        els.exportStatus.textContent = "";
        els.exportStatus.className = "export-status small";
      }, 8000);
    }
  }

  async function copyPlan() {
    if (!lastPlan) return;
    const label = currentTab === "teacher" ? "teacher plan" : "student handout";
    const html = els.lessonOutput.innerHTML;
    const text = currentTab === "teacher" ? planToMarkdown(lastPlan) : els.lessonOutput.innerText;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard unavailable");
      }
      setExportStatus(`Copied the ${label} — paste into a doc, email, or Canvas page.`, "ok");
    } catch (_) {
      // Legacy fallback for older browsers / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (_e) {
        ok = false;
      }
      ta.remove();
      setExportStatus(
        ok
          ? `Copied the ${label}.`
          : "Copy failed in this browser — use Word (.doc) or Print / PDF instead.",
        ok ? "ok" : "bad",
      );
    }
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
    out.push(`<p><strong>Essential Question:</strong> ${esc(h.essentialQuestion)}</p>`);

    // Do Now
    out.push(`<h2>Do Now</h2>`);
    out.push(`<p class="student-instructions">${esc(plan.doNow.directions)}</p>`);
    plan.doNow.items.forEach((it, i) => {
      out.push(`<p>${i + 1}. (${esc(it.level)}) ${esc(it.q)}</p>`);
      out.push(`<div class="student-response-lines"></div>`);
    });

    // Notes
    out.push(`<h2>Class Notes</h2>`);
    out.push(`<ul class="student-bullet-list">`);
    plan.mini.studentNotes.forEach((n) => out.push(`<li>${esc(n)}</li>`));
    out.push(`</ul>`);
    out.push(`<p><strong>Worked Example:</strong> ${esc(plan.mini.worked.problem)}</p>`);
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
    out.push(`<p><strong>Write together:</strong> ${esc(plan.collaborative.twrWritten)}</p>`);
    out.push(`<div class="student-response-box"></div>`);

    // Independent Practice
    out.push(`<h2>Independent Practice</h2>`);
    plan.independent.items.forEach((it, i) => {
      out.push(`<p>${i + 1}. (${esc(it.type)}) ${esc(it.q)}</p>`);
      out.push(`<div class="student-response-lines"></div>`);
    });
    out.push(`<p><strong>Show your thinking:</strong> ${esc(plan.independent.showThinking)}</p>`);
    out.push(`<div class="student-response-box"></div>`);

    // Writing
    out.push(`<h2>Writing (TWR)</h2>`);
    out.push(`<p><strong>Kernel sentence:</strong> ${esc(plan.writing.kernel)}</p>`);
    out.push(`<p>Complete the sentence using <em>because</em>, <em>but</em>, and <em>so</em>:</p>`);
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

    // Never persist the derived profile object into history — the class
    // support profile has its own storage, lifecycle, and Clear control.
    const storedFields = Object.assign({}, fields);
    delete storedFields.profile;

    const entry = {
      id: Date.now().toString(),
      title,
      date,
      standard,
      fields: storedFields,
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
    els.fGrade.value = entry.fields.grade || "6";
    els.fCourse.value = entry.fields.course || "Mathematics";
    els.fUnit.value = entry.fields.unit || "";
    els.fFocus.value = entry.fields.focus || "";
    els.fStandards.value = entry.fields.standards || "";
    els.fLength.value = entry.fields.length || "45–60 minutes";
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
        const displayTitle = item.title.length > 25 ? item.title.slice(0, 25) + "…" : item.title;
        const desc = item.standard
          ? `${displayTitle} (${item.standard.split(" ")[0]})`
          : displayTitle;
        return `<span class="history-chip-wrap">
        <button type="button" class="history-chip" data-id="${esc(item.id)}" title="Load: ${esc(item.title)}">🕒 ${esc(desc)}</button>
        <button type="button" class="delete-hist-btn" data-id="${esc(item.id)}" aria-label="Delete saved lesson ${esc(item.title)}">×</button>
      </span>`;
      })
      .join("");
  }

  // One delegated listener — chips re-render often, real buttons stay
  // keyboard-accessible, and no inline handlers / globals are needed.
  (function wireHistoryDelegation() {
    const chips = $("historyChips");
    if (!chips) return;
    chips.addEventListener("click", (e) => {
      const del = e.target.closest(".delete-hist-btn");
      if (del) {
        deleteHistory(del.dataset.id, e);
        return;
      }
      const chip = e.target.closest(".history-chip");
      if (chip) loadHistory(chip.dataset.id);
    });
  })();

  /* ===================== CLASS SUPPORT PROFILE UI ===================== */
  let profileDraft = null; // parsed but not yet locked

  function activeProfileForGeneration(fields) {
    const P = window.LPGProfile;
    if (!P) return null;
    const stored = P.load();
    if (!stored || !stored.students || !stored.students.length) return null;
    const prof = {
      label: stored.label,
      summary: stored.summary,
      students: stored.students,
      // The live checkbox is the source of truth so toggling + regenerating
      // always matches what the teacher sees on screen.
      includeIds: els.profileIncludeIds
        ? els.profileIncludeIds.checked
        : stored.includeIds !== false,
    };
    prof.strategies = P.strategies(prof, fields);
    return prof;
  }

  function profileLabelFor(students) {
    const sections = [...new Set(students.map((s) => s.section).filter(Boolean))];
    const base = sections.length ? sections.join(", ") : "Class profile";
    return `${base} · ${students.length} student${students.length === 1 ? "" : "s"}`;
  }

  function renderProfileViews() {
    if (!els.profileLockedView || !window.LPGProfile) return;
    const stored = window.LPGProfile.load();
    const locked = !!(stored && stored.students && stored.students.length);
    els.profileLockedView.hidden = !locked;
    els.profileEditView.hidden = locked;
    if (!locked) return;
    const when = stored.lockedAt
      ? " — locked " + new Date(stored.lockedAt).toLocaleDateString()
      : "";
    els.profileLockedLabel.textContent = stored.label + when;
    const planChips = Object.entries(stored.summary.plans || {}).map(
      ([p, n]) => `<li class="profile-chip plan">${esc(p)}: ${n}</li>`,
    );
    const needChips = (stored.summary.needLabels || []).map(
      (l) => `<li class="profile-chip">${esc(l)}</li>`,
    );
    els.profileChips.innerHTML =
      planChips.concat(needChips).join("") ||
      `<li class="profile-chip">No specific supports recognized — plans use the base differentiation</li>`;
    // Default ON (initials belong in the teacher plan) unless the teacher
    // explicitly turned it off for this locked profile.
    els.profileIncludeIds.checked = stored.includeIds !== false;
    // Surface parse-time warnings (e.g. names converted to initials) so
    // they stay visible after an auto-lock, not just in the preview.
    const lockNotes = (stored.warnings || [])
      .map(
        (w) =>
          `<p class="qa-notice qa-notice-warn"><span aria-hidden="true">⚠</span> ${esc(w)}</p>`,
      )
      .join("");
    let notesBox = $("profileLockedNotes");
    if (!notesBox) {
      notesBox = document.createElement("div");
      notesBox.id = "profileLockedNotes";
      els.profileLockedView.appendChild(notesBox);
    }
    notesBox.innerHTML = lockNotes;
  }

  function renderProfilePreview(parsed) {
    profileDraft = parsed;
    const box = els.profilePreview;
    if (!box) return;
    if (!parsed) {
      box.innerHTML = "";
      return;
    }
    const P = window.LPGProfile;
    const noticeP = (kind, text) =>
      `<p class="qa-notice ${kind === "ok" ? "qa-notice-ok" : "qa-notice-warn"}"><span aria-hidden="true">${kind === "ok" ? "✓" : "⚠"}</span> ${esc(text)}</p>`;
    const errs = parsed.errors.map((x) => noticeP("warn", x)).join("");
    const warns = parsed.warnings.map((x) => noticeP("warn", x)).join("");
    if (!parsed.students.length) {
      box.innerHTML =
        errs +
        warns +
        noticeP(
          "warn",
          "No students could be read. Check the format hint in the box above, or click “Load sample” to see a working example.",
        );
      return;
    }
    const rows = parsed.students
      .map((st) => {
        const needs = P.NEED_KEYS.filter((k) => st.needs[k])
          .map((k) => P.NEEDS[k].label)
          .join(", ");
        return (
          `<tr><td>${esc(st.id)}</td><td>${esc(st.plan || "—")}</td>` +
          `<td>${st.wida != null ? "WIDA " + st.wida : "—"}</td>` +
          `<td>${esc(needs || "—")}</td>` +
          `<td>${st.privateNotes ? '<span class="private-flag">✓ kept private</span>' : "—"}</td></tr>`
        );
      })
      .join("");
    const lockedAlready = !!P.load();
    box.innerHTML =
      errs +
      warns +
      noticeP(
        "ok",
        `${parsed.students.length} student${parsed.students.length === 1 ? "" : "s"} read. Review the supports below, then lock the profile in.`,
      ) +
      `<div class="table-scroll"><table class="qa-table profile-table"><thead><tr><th>ID</th><th>Plan</th><th>Language</th><th>Supports recognized</th><th>Private notes</th></tr></thead><tbody>${rows}</tbody></table></div>` +
      `<div class="profile-actions">` +
      `<button class="btn primary" id="profileLockBtn" type="button">${lockedAlready ? "🔒 Replace locked profile" : "🔒 Lock in profile"}</button>` +
      `<button class="btn ghost" id="profileDiscardBtn" type="button">Discard</button></div>`;
    const lockBtn = $("profileLockBtn");
    if (lockBtn) lockBtn.addEventListener("click", lockProfile);
    const discardBtn = $("profileDiscardBtn");
    if (discardBtn)
      discardBtn.addEventListener("click", () => {
        profileDraft = null;
        box.innerHTML = "";
        els.profileText.value = "";
        // If a profile is still locked (e.g. the teacher was replacing it),
        // return to the locked view so Replace/Clear stay reachable.
        renderProfileViews();
      });
  }

  // Shared lock path for the manual Lock button, file uploads, and the
  // auto-lock on Generate. Returns the saved profile (or null).
  function saveLockedProfile(students, warnings, statusMsg) {
    if (!students || !students.length) return null;
    const profile = {
      label: profileLabelFor(students),
      lockedAt: new Date().toISOString(),
      students,
      summary: window.LPGProfile.summarize(students),
      includeIds: !!(els.profileIncludeIds && els.profileIncludeIds.checked),
      warnings: (warnings || []).slice(0, 8),
    };
    const saved = window.LPGProfile.save(profile);
    profileDraft = null;
    els.profilePreview.innerHTML = saved
      ? ""
      : `<p class="qa-notice qa-notice-warn"><span aria-hidden="true">⚠</span> This browser blocked saving (private mode or full storage) — the profile will still apply until you close this tab.</p>`;
    els.profileText.value = "";
    renderProfileViews();
    setExportStatus(
      statusMsg || "Class support profile locked in — it now shapes every plan you generate.",
      "ok",
    );
    return profile;
  }

  function lockProfile() {
    if (!profileDraft) return;
    saveLockedProfile(profileDraft.students, profileDraft.warnings);
  }

  // Rebuild an editable, already-anonymized text version of the stored
  // profile (never the original paste, which may have contained names).
  function editableTextFrom(students) {
    return students
      .map((st) => {
        const bits = [st.plan, st.wida != null ? `WIDA ${st.wida}` : "", st.notes].filter(Boolean);
        const priv = st.privateNotes ? ` private: ${st.privateNotes}` : "";
        return `${st.id} — ${bits.join(", ") || "no supports noted"}${priv}`;
      })
      .join("\n");
  }

  function wireProfile() {
    if (!els.profileText || !window.LPGProfile) return;
    els.profilePreviewBtn.addEventListener("click", () => {
      renderProfilePreview(window.LPGProfile.parse(els.profileText.value));
    });
    els.profileSampleBtn.addEventListener("click", () => {
      els.profileText.value = window.LPGProfile.SAMPLE;
      renderProfilePreview(window.LPGProfile.parse(els.profileText.value));
    });
    els.profileTemplateBtn.addEventListener("click", () => {
      download("class-support-profile-template.csv", window.LPGProfile.TEMPLATE, "text/csv");
    });
    els.profileUploadBtn.addEventListener("click", () => els.profileFileInput.click());
    els.profileFileInput.addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      e.target.value = "";
      if (f.size > 2 * 1024 * 1024) {
        renderProfilePreview({
          students: [],
          warnings: [],
          errors: [
            "That file is larger than 2 MB — export a plain .csv from your roster tool, or paste the text instead.",
          ],
        });
        return;
      }
      try {
        const text = await f.text();
        els.profileText.value = text;
        const parsed = window.LPGProfile.parse(text);
        // Uploading a file is a clear signal of intent: auto-lock it so the
        // supports integrate into the very next generated plan — no extra
        // clicks. Replace/Clear stay available in the locked view.
        if (parsed.students.length) {
          saveLockedProfile(
            parsed.students,
            parsed.warnings.concat(parsed.errors),
            `Support profile from "${f.name}" locked in (${parsed.students.length} student${parsed.students.length === 1 ? "" : "s"}) — it now shapes every plan you generate.`,
          );
        } else {
          renderProfilePreview(parsed);
        }
      } catch (err) {
        renderProfilePreview({
          students: [],
          warnings: [],
          errors: ["Could not read that file: " + (err.message || err)],
        });
      }
    });
    els.profileReplaceBtn.addEventListener("click", () => {
      const stored = window.LPGProfile.load();
      if (stored && stored.students) {
        els.profileText.value = editableTextFrom(stored.students);
      }
      els.profileLockedView.hidden = true;
      els.profileEditView.hidden = false;
      renderProfilePreview(window.LPGProfile.parse(els.profileText.value));
    });
    els.profileClearBtn.addEventListener("click", () => {
      const sure = window.confirm(
        "Clear the locked class support profile from this browser? Generated plans will go back to base differentiation.",
      );
      if (!sure) return;
      window.LPGProfile.clear();
      profileDraft = null;
      els.profileText.value = "";
      els.profilePreview.innerHTML = "";
      renderProfileViews();
      setExportStatus("Class support profile cleared from this device.", "ok");
    });
    els.profileIncludeIds.addEventListener("change", () => {
      const stored = window.LPGProfile.load();
      if (stored) {
        stored.includeIds = els.profileIncludeIds.checked;
        window.LPGProfile.save(stored);
      }
    });
    renderProfileViews();
  }

  /* ===================== INIT ===================== */
  function setDefaultDate() {
    if (!els.fDate) return;
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    els.fDate.value = local.toISOString().slice(0, 10);
  }

  /* Deep-link intake — lets the Curriculum Hub (or any link) open the generator
   * pre-filled for a specific lesson and optionally auto-generate. Supported
   * query params: standard, topic (unit), focus (lesson focus/objective),
   * length, date, grade, autogen (1|true). A bad or empty query is a no-op, so
   * a normal visit is unaffected. */
  function applyDeepLink() {
    var params;
    try {
      params = new URLSearchParams(location.search);
    } catch (e) {
      return;
    }
    if (!params.toString()) return;
    var setIf = function (elm, val) {
      if (elm && val) elm.value = val;
    };
    setIf(els.fStandards, params.get("standard"));
    setIf(els.fUnit, params.get("topic"));
    setIf(els.fFocus, params.get("focus"));
    setIf(els.fLength, params.get("length"));
    setIf(els.fDate, params.get("date"));
    setIf(els.fGrade, params.get("grade"));
    var autogen = params.get("autogen");
    if (
      (autogen === "1" || autogen === "true") &&
      (els.fUnit.value || els.fFocus.value || els.fStandards.value)
    ) {
      // Defer so all wiring/output-card state is ready before the pipeline runs.
      setTimeout(function () {
        generate();
      }, 0);
    }
  }

  window.__LPG__ = { buildContentMap, gatherFields, runQA, renderPlanHtml };

  initTheme();
  setDefaultDate();
  wire();
  applyDeepLink();
})();
