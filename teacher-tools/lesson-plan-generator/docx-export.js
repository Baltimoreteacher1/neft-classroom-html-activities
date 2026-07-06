/* =====================================================================
   Neft Teacher — Ready Lesson · DOCX export
   window.LPGDocx.export(plan, filename)

   Builds a real Microsoft Word .docx (via the vendored `docx` UMD build,
   global `docx`) from the SAME plan object the page renders, so the file
   matches the on-screen lesson. Layout:

     • Title block / header table
     • Teacher-facing lesson (all 14 sections, answer keys embedded)
     • Page break
     • Printable Student Version (no answers, response space)

   Calibri 11pt, clear headings, bordered tables, page breaks between the
   major parts — teacher-ready and printable.
   ===================================================================== */
(function () {
  "use strict";

  // The docx UMD build is 1.1 MB, so it is NOT loaded with the page — it is
  // injected on the first export click and cached for the session.
  let libPromise = null;
  function ensureLib() {
    if (typeof window.docx !== "undefined") return Promise.resolve(window.docx);
    if (!libPromise) {
      libPromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "/teacher-tools/lesson-plan-generator/vendor/docx.umd.js";
        s.onload = () => resolve(window.docx);
        s.onerror = () => {
          libPromise = null;
          reject(
            new Error(
              "The Word export library could not load. Check your connection and try again, or use Print / PDF.",
            ),
          );
        };
        document.head.appendChild(s);
      });
    }
    return libPromise.then((d) => {
      if (typeof d === "undefined") {
        throw new Error(
          "Word export library (docx) failed to load. Reload the page and try again.",
        );
      }
      return d;
    });
  }

  const TEAL = "0F766E";
  const GREY = "EEF2F6";

  function api(d) {
    const {
      Paragraph,
      TextRun,
      HeadingLevel,
      AlignmentType,
      Table,
      TableRow,
      TableCell,
      WidthType,
      BorderStyle,
    } = d;

    const border = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
    const cellBorders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const cellMargins = {
      top: 120,
      bottom: 120,
      left: 180,
      right: 180,
    };

    const txt = (s) => String(s == null ? "" : s);

    const H1 = (s) =>
      new Paragraph({
        children: [new TextRun({ text: txt(s), bold: true, size: 36, color: TEAL })],
        spacing: { after: 80 },
      });
    const sub = (s) =>
      new Paragraph({
        children: [new TextRun({ text: txt(s), size: 20, color: "444444" })],
        spacing: { after: 160 },
      });
    const H2 = (s) =>
      new Paragraph({
        children: [new TextRun({ text: txt(s), bold: true, size: 26, color: TEAL })],
        spacing: { before: 220, after: 90 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL } },
      });
    const H3 = (s) =>
      new Paragraph({
        children: [new TextRun({ text: txt(s), bold: true, size: 22 })],
        spacing: { before: 140, after: 50 },
      });
    const P = (s, o = {}) =>
      new Paragraph({
        children: Array.isArray(s)
          ? s
          : [
              new TextRun({
                text: txt(s),
                size: 22,
                bold: !!o.bold,
                italics: !!o.italics,
              }),
            ],
        spacing: { after: o.after == null ? 80 : o.after },
      });
    const runs = (parts) =>
      new Paragraph({
        children: parts.map(
          (p) =>
            new TextRun({
              text: txt(p.t),
              size: 22,
              bold: !!p.b,
              italics: !!p.i,
              color: p.c,
            }),
        ),
        spacing: { after: 80 },
      });
    const bullets = (arr) =>
      (arr || []).filter(Boolean).map(
        (s) =>
          new Paragraph({
            children: [new TextRun({ text: txt(s), size: 22 })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          }),
      );
    const pageBreak = () => new Paragraph({ children: [new d.PageBreak()] });

    const cell = (content, opts = {}) =>
      new TableCell({
        borders: cellBorders,
        margins: cellMargins,
        shading: opts.head ? { fill: TEAL } : opts.shading ? { fill: opts.shading } : undefined,
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        children: (Array.isArray(content) ? content : [content]).map((c) =>
          typeof c === "string"
            ? new Paragraph({
                children: [
                  new TextRun({
                    text: txt(c),
                    size: 20,
                    bold: !!opts.head,
                    color: opts.head ? "FFFFFF" : undefined,
                  }),
                ],
              })
            : c,
        ),
      });

    const table = (headers, rows, widths) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: headers.map((h, i) => cell(h, { head: true, width: widths && widths[i] })),
          }),
          ...rows.map(
            (r, rowIndex) =>
              new TableRow({
                children: r.map((c, i) =>
                  cell(c, {
                    width: widths && widths[i],
                    shading: rowIndex % 2 === 1 ? "F8FAFC" : undefined,
                  }),
                ),
              }),
          ),
        ],
      });

    const callout = (content, title) => {
      const calloutBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.SINGLE, size: 24, color: TEAL },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      };

      const children = [];
      if (title) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: txt(title),
                bold: true,
                size: 22,
                color: TEAL,
              }),
            ],
            spacing: { after: 60 },
          }),
        );
      }

      const contentList = Array.isArray(content) ? content : [content];
      contentList.forEach((c) => {
        if (typeof c === "string") {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: txt(c), size: 20 })],
              spacing: { after: 40 },
            }),
          );
        } else {
          children.push(c);
        }
      });

      if (children.length > 0 && children[children.length - 1].spacing) {
        children[children.length - 1].spacing.after = 0;
      }

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: calloutBorders,
                margins: { top: 140, bottom: 140, left: 200, right: 140 },
                shading: { fill: "F8FAFC" },
                children: children,
              }),
            ],
          }),
        ],
        spacing: { before: 120, after: 120 },
      });
    };

    return {
      H1,
      H2,
      H3,
      P,
      runs,
      bullets,
      pageBreak,
      table,
      sub,
      callout,
      TextRun,
      Paragraph,
    };
  }

  /* Per-phase "initials — modification" callout. Teacher body only — the
     student body never calls this. */
  function supportsBlock(arr, k, out) {
    if (!arr || !arr.length) return;
    out.push(
      k.callout(
        arr.map((s) => "• " + s),
        "Student supports (teacher-facing)",
      ),
    );
  }

  /* ---------- TEACHER-FACING body ---------- */
  function teacherBody(plan, k) {
    const h = plan.header;
    const t = plan.timing || {};
    const at = (n) => (n ? ` · ${n}` : ""); // time chip suffix for headings
    const out = [];
    out.push(k.H1(h.title));
    out.push(
      k.sub(
        [h.date && "Date: " + h.date, h.grade, h.course, h.unit && "Unit: " + h.unit, h.length]
          .filter(Boolean)
          .join("   |   "),
      ),
    );

    // Lesson at a Glance (the 5-second scan read)
    const stdCodes = h.standards
      .map((s) => s.code || s.desc)
      .filter(Boolean)
      .join(", ");
    const flowStr = (h.pacing || []).map(([name, t]) => `${name} ${t}`).join("  →  ");
    const glanceRow = (label, val) =>
      new k.Paragraph({
        children: [
          new k.TextRun({ text: label + ": ", bold: true, size: 20 }),
          new k.TextRun({ text: String(val == null ? "" : val), size: 20 }),
        ],
        spacing: { after: 60 },
      });
    out.push(
      k.callout(
        [
          glanceRow("I Can", h.iCan),
          glanceRow("Essential Question", h.essentialQuestion),
          stdCodes ? glanceRow("Standard(s)", stdCodes) : null,
          new k.Paragraph({
            children: [
              new k.TextRun({ text: "Flow: ", bold: true, size: 20 }),
              new k.TextRun({ text: flowStr, size: 20 }),
            ],
            spacing: { after: 0 },
          }),
        ].filter(Boolean),
        "Lesson at a Glance",
      ),
    );

    // 1 · Header
    out.push(k.H2("1 · Lesson Header"));
    out.push(
      k.table(
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
        [28, 72],
      ),
    );

    // 2 · Teacher Snapshot
    const s = plan.snapshot;
    out.push(k.H2("2 · Teacher Snapshot"));
    out.push(
      k.callout([
        new k.Paragraph({
          children: [
            new k.TextRun({ text: "Learning today: ", bold: true, size: 20 }),
            new k.TextRun({ text: s.learning, size: 20 }),
          ],
          spacing: { after: 60 },
        }),
        new k.Paragraph({
          children: [
            new k.TextRun({ text: "Why it matters: ", bold: true, size: 20 }),
            new k.TextRun({ text: s.why, size: 20 }),
          ],
          spacing: { after: 60 },
        }),
        new k.Paragraph({
          children: [
            new k.TextRun({
              text: "By the end, students can: ",
              bold: true,
              size: 20,
            }),
            new k.TextRun({ text: s.byEnd, size: 20 }),
          ],
          spacing: { after: 0 },
        }),
      ]),
    );
    out.push(k.H3("Anticipated misconceptions"));
    out.push(...k.bullets(s.misconceptions));
    out.push(k.H3("Teacher look-fors"));
    out.push(...k.bullets(s.lookFors));

    // 3 · Vocabulary
    out.push(k.H2("3 · Vocabulary / Language Support"));
    out.push(
      k.table(
        ["Term", "Student-friendly definition", "Spanish", "ESOL sentence frame"],
        plan.vocab.map((v) => [v.term, v.def, v.spanish || "—", v.frame]),
        [20, 38, 14, 28],
      ),
    );

    // 4 · Do Now
    out.push(k.H2("4 · Do Now / Warm-Up" + at(t.doNow)));
    out.push(k.P(plan.doNow.directions, { italics: true }));
    out.push(
      k.table(
        ["Level", "Question", "Answer key"],
        plan.doNow.items.map((it) => [it.level, it.q, it.a]),
        [16, 52, 32],
      ),
    );
    out.push(k.runs([{ t: "Teacher move: ", b: true }, { t: plan.doNow.teacherMove }]));
    supportsBlock(plan.doNow.studentSupports, k, out);

    // 5 · Mini-Lesson
    out.push(k.H2("5 · Mini-Lesson / Direct Instruction" + at(t.mini)));
    out.push(k.P(plan.mini.teacherExplanation));
    out.push(k.P(plan.mini.gradualRelease, { italics: true }));
    out.push(k.H3("Student notes"));
    out.push(...k.bullets(plan.mini.studentNotes));
    out.push(k.H3("Worked example"));
    out.push(k.runs([{ t: "Problem: ", b: true }, { t: plan.mini.worked.problem }]));
    out.push(...k.bullets(plan.mini.worked.steps.map((x, i) => `Step ${i + 1}: ${x}`)));
    out.push(k.H3("Think-aloud"));
    out.push(...k.bullets(plan.mini.worked.thinkAloud.map((t) => `"${t}"`)));
    out.push(k.runs([{ t: "Common mistake: ", b: true }, { t: plan.mini.worked.commonMistake }]));
    out.push(k.runs([{ t: "Correction: ", b: true }, { t: plan.mini.worked.correction }]));
    supportsBlock(plan.mini.studentSupports, k, out);

    // 6 · Guided
    out.push(k.H2("6 · Guided Practice" + at(t.guided)));
    out.push(
      k.table(
        ["#", "Problem", "Answer", "Teacher prompt"],
        plan.guided.items.map((it, i) => [String(i + 1), it.q, it.a, it.prompt]),
        [6, 40, 24, 30],
      ),
    );
    out.push(k.P(plan.guided.turnAndTalk, { italics: true }));
    out.push(k.H3("Sentence starters"));
    out.push(...k.bullets(plan.guided.sentenceStarters));
    supportsBlock(plan.guided.studentSupports, k, out);

    // 7 · Collaborative
    const c = plan.collaborative;
    out.push(k.H2("7 · Collaborative / Partner Activity" + at(t.collaborative)));
    out.push(k.runs([{ t: "Student directions: ", b: true }, { t: c.studentDirections }]));
    out.push(k.runs([{ t: "Teacher directions: ", b: true }, { t: c.teacherDirections }]));
    out.push(k.runs([{ t: "Accountability: ", b: true }, { t: c.accountability }]));
    out.push(k.H3("Discussion prompts"));
    out.push(...k.bullets(c.discussionPrompts));
    out.push(k.runs([{ t: "Written response (TWR): ", b: true }, { t: c.twrWritten }]));
    supportsBlock(c.studentSupports, k, out);

    // 8 · Independent
    out.push(k.H2("8 · Independent Practice" + at(t.independent)));
    out.push(
      k.table(
        ["#", "Type", "Problem", "Answer key"],
        plan.independent.items.map((it, i) => [String(i + 1), it.type, it.q, it.a]),
        [6, 18, 44, 32],
      ),
    );
    out.push(
      k.runs([{ t: "Show your thinking: ", b: true }, { t: plan.independent.showThinking }]),
    );
    out.push(k.runs([{ t: "Extension: ", b: true }, { t: plan.independent.extension }]));
    if (plan.independent.coreSet) {
      out.push(k.runs([{ t: "Core set: ", b: true }, { t: plan.independent.coreSet }]));
    }
    supportsBlock(plan.independent.studentSupports, k, out);

    // 9 · Writing / TWR
    const w = plan.writing;
    out.push(k.H2("9 · Writing / TWR Connection" + at(t.writing)));
    out.push(k.runs([{ t: "Kernel sentence: ", b: true }, { t: w.kernel }]));
    out.push(k.table(["Because", "But", "So"], [[w.because, w.but, w.so]], [34, 33, 33]));
    out.push(k.runs([{ t: "Explain your thinking: ", b: true }, { t: w.explain }]));
    out.push(k.H3("Sentence frames"));
    out.push(...k.bullets(w.frames));
    out.push(k.runs([{ t: "Word bank: ", b: true }, { t: w.wordBank.join(", ") }]));
    out.push(k.runs([{ t: "Expected response: ", b: true }, { t: w.expected }]));
    if (w.supports && w.supports.length) {
      out.push(k.H3("Language & writing supports for this class"));
      out.push(...k.bullets(w.supports));
    }

    // 10 · Differentiation
    const dz = plan.differentiation;
    out.push(k.H2("10 · Differentiation"));
    if (dz.profileNote) out.push(k.P(dz.profileNote, { italics: true }));
    if (dz.perStudent && dz.perStudent.length) {
      out.push(k.H3("Per-student modifications (teacher-facing)"));
      out.push(
        k.table(
          ["Student", "Plan", "Today's modifications"],
          dz.perStudent.map((s) => [s.id, s.plan, s.mods]),
          [14, 12, 74],
        ),
      );
    }
    out.push(k.H3("ESOL / WIDA supports"));
    out.push(...k.bullets(dz.esol));
    out.push(k.H3("SPED supports"));
    out.push(...k.bullets(dz.sped));
    if (dz.grouping && dz.grouping.length) {
      out.push(k.H3("Grouping for this class"));
      out.push(...k.bullets(dz.grouping));
    }
    out.push(k.H3("Newcomer supports"));
    out.push(...k.bullets(dz.newcomer));
    out.push(k.H3("On-grade supports"));
    out.push(...k.bullets(dz.onGrade));
    out.push(k.H3("Extension / enrichment"));
    out.push(...k.bullets(dz.extension));
    out.push(k.runs([{ t: "Small-group reteach: ", b: true }, { t: dz.reteach }]));
    out.push(k.runs([{ t: "Early finishers: ", b: true }, { t: dz.earlyFinishers }]));
    if (dz.pacing) {
      out.push(k.runs([{ t: "Pacing: ", b: true }, { t: dz.pacing }]));
    }

    // 11 · Checks for Understanding
    const cf = plan.cfu;
    out.push(k.H2("11 · Checks for Understanding"));
    out.push(
      k.table(
        ["Moment", "Check"],
        [
          ["Do Now", cf.doNow],
          ["Mini-lesson", cf.mini],
          ["Guided practice", cf.guided],
          ["Independent practice", cf.independent],
        ],
        [28, 72],
      ),
    );
    out.push(k.H3("Teacher decision points"));
    out.push(...k.bullets(cf.decisionPoints));

    // 12 · Exit Ticket
    out.push(k.H2("12 · Exit Ticket" + at(t.exit)));
    out.push(
      k.table(
        ["#", "Question", "Answer key"],
        plan.exit.items.map((it, i) => [String(i + 1), it.q, it.a]),
        [6, 60, 34],
      ),
    );
    out.push(k.runs([{ t: "Confidence / reflection: ", b: true }, { t: plan.exit.confidence.q }]));
    if (plan.exit.accommodations && plan.exit.accommodations.length) {
      out.push(k.H3("Assessment accommodations"));
      out.push(...k.bullets(plan.exit.accommodations));
    }
    out.push(k.runs([{ t: "Tomorrow, based on results: ", b: true }, { t: plan.exit.tomorrow }]));

    // 13 · Teacher Notes / Next-Day
    const tn = plan.teacherNotes;
    out.push(k.H2("13 · Teacher Notes / Next-Day Moves"));
    out.push(
      ...k.bullets([
        "Collect: " + tn.collect,
        "Look for: " + tn.lookFor,
        "Likely reteach: " + tn.reteachWho,
        "Adjust tomorrow: " + tn.adjust,
        "Small groups: " + tn.smallGroups,
        tn.extra ? "Note: " + tn.extra : "",
      ]),
    );

    return out;
  }

  /* ---------- STUDENT-FACING printable (no answers) ---------- */
  function studentBody(plan, k) {
    const h = plan.header;
    const out = [k.pageBreak()];
    out.push(k.H1("Student Version — " + h.title));
    out.push(
      k.runs([
        {
          t: "Name: _______________________     Date: " + (h.date || "____________"),
          b: false,
        },
      ]),
    );
    out.push(k.P(h.iCan, { bold: true }));
    out.push(k.runs([{ t: "Essential Question: ", b: true }, { t: h.essentialQuestion }]));

    const space = (lines) =>
      new k.Paragraph({
        children: [new k.TextRun({ text: "", size: 22 })],
        spacing: { after: 60 + 220 * (lines || 1) },
      });

    out.push(k.H2("Do Now"));
    out.push(k.P(plan.doNow.directions, { italics: true }));
    plan.doNow.items.forEach((it, i) => {
      out.push(k.P(`${i + 1}. (${it.level}) ${it.q}`));
      out.push(space(1));
    });

    out.push(k.H2("Notes"));
    plan.mini.studentNotes.forEach((n) => out.push(k.P("• " + n)));
    out.push(k.runs([{ t: "Worked example: ", b: true }, { t: plan.mini.worked.problem }]));
    out.push(space(2));

    out.push(k.H2("Guided Practice"));
    plan.guided.items.forEach((it, i) => {
      out.push(k.P(`${i + 1}. ${it.q}`));
      out.push(space(1));
    });
    out.push(
      k.runs([
        { t: "Sentence starters: ", b: true },
        { t: plan.guided.sentenceStarters.join("   ") },
      ]),
    );

    out.push(k.H2("Partner Activity"));
    out.push(k.P(plan.collaborative.studentDirections));
    out.push(k.runs([{ t: "Write together: ", b: true }, { t: plan.collaborative.twrWritten }]));
    out.push(space(2));

    out.push(k.H2("Independent Practice"));
    plan.independent.items.forEach((it, i) => {
      out.push(k.P(`${i + 1}. (${it.type}) ${it.q}`));
      out.push(space(1));
    });
    out.push(
      k.runs([{ t: "Show your thinking: ", b: true }, { t: plan.independent.showThinking }]),
    );
    out.push(space(2));

    out.push(k.H2("Writing"));
    out.push(k.P(plan.writing.kernel, { bold: true }));
    out.push(k.P("Complete the sentence using because, but, and so:"));
    out.push(k.P("Because: " + plan.writing.because));
    out.push(space(1));
    out.push(k.P("But: " + plan.writing.but));
    out.push(space(1));
    out.push(k.P("So: " + plan.writing.so));
    out.push(space(1));
    out.push(k.P("Word bank: " + plan.writing.wordBank.join(", "), { italics: true }));
    out.push(space(2));

    out.push(k.H2("Exit Ticket"));
    plan.exit.items.forEach((it, i) => {
      out.push(k.P(`${i + 1}. ${it.q}`));
      out.push(space(1));
    });
    out.push(k.P(plan.exit.confidence.q));
    out.push(space(1));

    return out;
  }

  function buildDoc(plan, d) {
    d = d || window.docx;
    if (!d) {
      throw new Error("Word library not loaded yet — await LPGDocx.ensure() first.");
    }
    const k = api(d);
    const children = teacherBody(plan, k).concat(studentBody(plan, k));
    return new d.Document({
      creator: "Neft Teacher Lesson Plan Generator",
      title: plan.header.title,
      styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
      sections: [
        {
          properties: {
            page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
          },
          children,
        },
      ],
    });
  }

  async function exportDocx(plan, filename) {
    const d = await ensureLib();
    const doc = buildDoc(plan, d);
    const blob = await d.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  window.LPGDocx = { export: exportDocx, buildDoc, ensure: ensureLib };
})();
