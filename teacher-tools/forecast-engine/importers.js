/* Forecast Engine — getting data in.
 * One parser for every format. A file is either the row-per-score template or
 * a wide gradebook (one row per student, one column per standard). */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { store } = NFE;

  const TEMPLATE_CSV = [
    "rowType,classId,className,grade,studentId,studentName,tags,standard,description,score,maxScore,date,assessment",
    "class,C1,Period 1 Math,Grade 6,,,,,,,,,",
    "student,C1,,,S001,Student Alpha,ML,,,,,,",
    "standard,,,,,,,6.GR.A.1,Find area of polygons,,,,",
    "evidence,,,,S001,,,6.GR.A.1,,8,10,2026-05-18,Exit Ticket",
  ].join("\n");

  const normKey = (h) =>
    String(h)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const validDate = (d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

  function delimiterOf(line) {
    const counts = [",", "\t", "|", ";"].map((d) => [
      d,
      (line.match(d === "|" ? /\|/g : new RegExp(d, "g")) || []).length,
    ]);
    return counts.sort((a, b) => b[1] - a[1])[0][0];
  }
  /** Quote-aware delimited text → matrix of trimmed strings. */
  function parseMatrix(text) {
    const delimiter = delimiterOf(text.split(/\r?\n/)[0] || "");
    const rows = [];
    let row = [];
    let cell = "";
    let quote = false;
    const endRow = () => {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    };
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '"' && quote && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quote = !quote;
      else if (ch === delimiter && !quote) {
        row.push(cell.trim());
        cell = "";
      } else if ((ch === "\n" || ch === "\r") && !quote) {
        if (ch === "\r" && text[i + 1] === "\n") i += 1;
        endRow();
      } else cell += ch;
    }
    endRow();
    return rows;
  }
  function htmlTableMatrix(text) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    return Array.from(doc.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.children).map((td) => td.textContent.trim()),
    );
  }
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const name = (file.name || "").toLowerCase();
      const binary = /\.xlsx$/.test(name);
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("The file could not be read."));
      reader.onload = () => {
        try {
          if (binary) {
            if (!window.XLSX)
              throw new Error(
                "The Excel reader did not load. Save the sheet as CSV and try again.",
              );
            const wb = window.XLSX.read(reader.result, { type: "array" });
            const aoa = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
              header: 1,
              defval: "",
            });
            resolve(aoa.map((r) => r.map((c) => String(c))));
          } else {
            const text = String(reader.result);
            resolve(/<table/i.test(text) ? htmlTableMatrix(text) : parseMatrix(text));
          }
        } catch (err) {
          reject(err);
        }
      };
      if (binary) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  }
  const isTemplate = (matrix) => {
    const keys = (matrix[0] || []).map(normKey);
    return (
      keys.includes("rowtype") ||
      (keys.includes("score") &&
        (keys.includes("studentid") || keys.includes("student")) &&
        (keys.includes("standard") || keys.includes("code")))
    );
  };
  const toObjects = (matrix) => {
    const keys = matrix[0].map(normKey);
    return matrix
      .slice(1)
      .map((vals) => Object.fromEntries(keys.map((k, i) => [k, vals[i] || ""])));
  };

  const emptyReport = () => ({ classes: 0, students: 0, standards: 0, evidence: 0, warnings: [] });
  const ensure = (s, student, standard) => {
    if (!s.students.some((x) => x.id === student))
      s.students.push({ id: student, name: `Student ${student}`, tags: "" });
    if (!s.standards.some((x) => x.code === standard))
      s.standards.push({ code: standard, desc: "Imported standard" });
  };
  const dup = (s, student, standard, date, assessment) =>
    s.evidence.some(
      (e) =>
        e.student === student &&
        e.standard === standard &&
        e.date === date &&
        e.assessment === assessment,
    );

  function addEvidence(s, rep, line, student, standard, score, max, date, assessment) {
    if (!student || !standard || !Number.isFinite(score) || !Number.isFinite(max) || max <= 0) {
      rep.warnings.push(`Row ${line}: needs a student, a standard, a score and a max score.`);
      return;
    }
    let when = date || store.today();
    if (!validDate(when)) {
      rep.warnings.push(`Row ${line}: "${date}" is not a YYYY-MM-DD date, so today was used.`);
      when = store.today();
    }
    if (score > max) rep.warnings.push(`Row ${line}: score ${score} is above the max ${max}.`);
    if (score < 0) {
      rep.warnings.push(`Row ${line}: negative score skipped.`);
      return;
    }
    ensure(s, student, standard);
    if (dup(s, student, standard, when, assessment)) {
      rep.warnings.push(`Row ${line}: duplicate skipped.`);
      return;
    }
    s.evidence.push(store.makeEvidence(student, standard, score, max, when, assessment));
    rep.evidence += 1;
  }

  /** Import row-per-score template objects. */
  function importTemplate(objects) {
    const rep = emptyReport();
    store.mutate(
      (s) => {
        if (store.leaveSample.call(store)) rep.replacedSample = true;
        objects.forEach((row, i) => {
          const line = i + 2;
          const type = String(row.rowtype || "evidence").toLowerCase();
          if (type === "class") {
            s.class = {
              id: row.classid || "C1",
              name: row.classname || "My class",
              grade: row.grade || "",
            };
            rep.classes += 1;
          } else if (type === "student") {
            const id = row.studentid || row.id;
            if (!id) return rep.warnings.push(`Row ${line}: missing studentId.`);
            if (!s.students.some((x) => x.id === id)) {
              s.students.push({
                id,
                name: row.studentname || `Student ${id}`,
                tags: row.tags || "",
              });
              rep.students += 1;
            }
          } else if (type === "standard") {
            const code = row.standard || row.code || row.ccss;
            if (!code) return rep.warnings.push(`Row ${line}: missing standard.`);
            if (!s.standards.some((x) => x.code === code)) {
              s.standards.push({ code, desc: row.description || "Imported standard" });
              rep.standards += 1;
            }
          } else {
            const before = [s.students.length, s.standards.length];
            addEvidence(
              s,
              rep,
              line,
              row.studentid || row.student,
              row.standard || row.code || row.ccss,
              Number(row.score),
              Number(row.maxscore || row.max || 100),
              row.date,
              row.assessment || "Imported",
            );
            rep.students += s.students.length - before[0];
            rep.standards += s.standards.length - before[1];
          }
        });
      },
      { undoable: true },
    );
    return rep;
  }

  /** Best guesses for a wide gradebook: which column names the student. */
  function wideDefaults(matrix) {
    const headers = matrix[0];
    const find = (re) => headers.findIndex((h) => re.test(String(h).toLowerCase()));
    const id = find(/(student\s*id|^id$|^sid$)/);
    const name = find(/name|student/);
    const studentCol = id >= 0 ? id : name >= 0 ? name : 0;
    const numeric = (i) =>
      matrix.slice(1).some((r) => r[i] !== "" && Number.isFinite(Number(r[i])));
    return {
      studentCol,
      stdCols: headers.map((_, i) => i).filter((i) => i !== studentCol && numeric(i)),
    };
  }
  /** Reshape a wide gradebook into evidence rows. */
  function importWide(matrix, { studentCol, stdCols, max, date, assessment }) {
    const rep = emptyReport();
    store.mutate(
      (s) => {
        rep.replacedSample = store.leaveSample();
        matrix.slice(1).forEach((r, i) => {
          const who = String(r[studentCol] || "").trim();
          if (!who) return;
          stdCols.forEach((ci) => {
            const raw = String(r[ci] || "").trim();
            if (raw === "" || !Number.isFinite(Number(raw))) return;
            const before = [s.students.length, s.standards.length];
            addEvidence(
              s,
              rep,
              i + 2,
              who,
              String(matrix[0][ci] || `Col${ci + 1}`).trim(),
              Number(raw),
              max,
              date,
              assessment || "Gradebook import",
            );
            rep.students += s.students.length - before[0];
            rep.standards += s.standards.length - before[1];
          });
        });
        s.students.forEach((st) => {
          if (st.name === `Student ${st.id}`) st.name = st.id;
        });
      },
      { undoable: true },
    );
    return rep;
  }

  /** Problems a teacher should look at before trusting any forecast. */
  function validate(s) {
    const issues = [];
    const ids = new Set();
    const codes = new Set(s.standards.map((x) => x.code));
    s.students.forEach((x) => {
      if (!x.id) issues.push(["bad", "A student has no ID."]);
      if (ids.has(x.id)) issues.push(["bad", `Two students share the ID ${x.id}.`]);
      ids.add(x.id);
    });
    s.standards.forEach((x) => {
      if (!x.code) issues.push(["bad", "A standard has no code."]);
    });
    const seen = new Set();
    s.evidence.forEach((e) => {
      if (!ids.has(e.student))
        issues.push(["warn", `A score belongs to ${e.student}, who is not on the roster.`]);
      if (!codes.has(e.standard))
        issues.push(["warn", `A score uses the standard ${e.standard}, which is not listed.`]);
      if (e.score > e.max)
        issues.push([
          "warn",
          `${NFE.store.studentName(e.student)} scored ${e.score} out of ${e.max} on ${e.standard}.`,
        ]);
      const k = `${e.student}|${e.standard}|${e.date}|${e.assessment}`;
      if (seen.has(k))
        issues.push([
          "warn",
          `Possible duplicate: ${NFE.store.studentName(e.student)}, ${e.standard}, ${e.date}, ${e.assessment}.`,
        ]);
      seen.add(k);
    });
    return issues;
  }

  NFE.importers = {
    TEMPLATE_CSV,
    parseMatrix,
    readFile,
    isTemplate,
    toObjects,
    importTemplate,
    wideDefaults,
    importWide,
    validate,
  };
})();
