/* =====================================================================
   Neft Teacher — Ready Lesson · Class Support Profile
   window.LPGProfile

   Parses a pasted/uploaded class support list (CSV, TSV, or simple
   "ID — needs" lines) into structured, privacy-conscious student
   support records, and turns those records into CONCRETE classroom
   differentiation strategies that lesson-model.js weaves into the plan.

   Privacy model:
     - Everything stays in this browser (localStorage key below).
     - Full names are auto-converted to initials with a warning.
     - "private / do not include" notes are stored but NEVER emitted
       into any generated output (plan, DOCX, print, copy, markdown).
     - Student IDs appear in the teacher plan only when the teacher
       explicitly opts in, and never in the student handout.
   ===================================================================== */
(function () {
  "use strict";

  const STORE_KEY = "nt_lpg_profile_v1";

  /* ---------------- need taxonomy (single source of truth) ---------------- */
  const NEEDS = {
    reading: {
      label: "Reading access",
      keywords:
        /\b(read[\s-]?aloud|read aloud|reading level|below[\s-]?level read|decod\w*|dyslex\w*|text[\s-]?to[\s-]?speech|audio)\b/i,
    },
    language: {
      label: "Language / ESOL",
      keywords: /\b(esol|ell|ml\b|wida|newcomer|bilingual|spanish|english learner|language)\b/i,
    },
    attention: {
      label: "Attention / executive function",
      keywords:
        /\b(attention|focus|adhd|add\b|executive|organiz\w*|distract\w*|on[\s-]?task|checklist)\b/i,
    },
    processing: {
      label: "Processing time",
      keywords:
        /\b(processing|extended time|extra time|wait time|time and a half|1\.5x|double time|slower pace|pacing)\b/i,
    },
    behavior: {
      label: "Behavior / self-regulation",
      keywords:
        /\b(behavior|behaviour|regulat\w*|break pass|breaks?|calm|escalat\w*|frustrat\w*|anxiet\w*|counsel\w*)\b/i,
    },
    math: {
      label: "Math-specific tools",
      keywords:
        /\b(calculator|multiplication chart|number line|math facts?|dyscalcul\w*|manipulative\w*|grid paper|anchor chart)\b/i,
    },
    writing: {
      label: "Writing support",
      keywords:
        /\b(writing|scribe|speech[\s-]?to[\s-]?text|dictat\w*|graphic organizer|sentence (?:frames?|starters?)|fine motor|handwriting)\b/i,
    },
    assessment: {
      label: "Assessment accommodations",
      keywords:
        /\b(test\w*|assessment|quiz\w*|separate location|small[\s-]?group test|fewer (?:questions|problems)|reduced (?:load|problems|questions)|chunk\w*|oral response)\b/i,
    },
  };
  const NEED_KEYS = Object.keys(NEEDS);

  /* Column-header aliases -> field */
  const HEADER_MAP = [
    [/^(id|student|initials?|code|learner|anon)/i, "id"],
    [/^(class|section|period|grade|group)/i, "section"],
    [/^(plan|category|program|status|support cat)/i, "plan"],
    [/^(wida|language level|esol level|ell level|english level)/i, "wida"],
    [/^read/i, "reading"],
    [/^(language|esol|ell)\b/i, "language"],
    [/^(attention|focus|executive)/i, "attention"],
    [/^(processing|time)/i, "processing"],
    [/^(behavior|behaviour|regulation)/i, "behavior"],
    [/^math/i, "math"],
    [/^writ/i, "writing"],
    [/^(assessment|testing|accommodation)/i, "assessment"],
    [/^(scaffold|preferred)/i, "scaffolds"],
    [/^(private|do not include|confidential|sensitive)/i, "private"],
    [/^(note|other|comment)/i, "notes"],
  ];

  const EMPTYISH = /^(?:|-|—|n\/?a|none|no|x)$/i;

  function headerField(cellText) {
    const t = cellText.trim();
    for (const [re, field] of HEADER_MAP) if (re.test(t)) return field;
    return null;
  }

  /* Minimal quoted-CSV line splitter (handles "a, b",c and tabs/pipes). */
  function splitCells(line, delim) {
    const cells = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        cells.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function detectDelim(line) {
    if (line.includes("\t")) return "\t";
    if (line.includes("|")) return "|";
    return ",";
  }

  /* Full-name detection -> initials (privacy guard). */
  const NAME_RE = /^([A-Z][a-zà-ÿ'’-]{2,})\s+([A-Z][a-zà-ÿ'’-]{2,})$/;
  function anonymizeId(id, warnings) {
    const m = String(id).trim().match(NAME_RE);
    if (m) {
      const initials = `${m[1][0]}.${m[2][0]}.`;
      warnings.push(
        `"${m[1]} ${m[2][0]}." looked like a full name — stored as initials ${initials}. Use initials or anonymous IDs (A1, B2) when you paste.`,
      );
      return initials;
    }
    return String(id).trim().slice(0, 12);
  }

  function detectPlan(text) {
    if (/\biep\b/i.test(text)) return "IEP";
    if (/\b504\b/.test(text)) return "504";
    if (/\b(esol|ell|ml|english learner|newcomer|wida)\b/i.test(text)) return "ESOL";
    return "";
  }
  function detectWida(text) {
    const m = String(text).match(/\bwida\s*(?:level\s*)?([1-6])\b/i);
    if (m) return Number(m[1]);
    if (/\bnewcomer\b/i.test(text)) return 1;
    if (/\benter(?:ing)?\b/i.test(text)) return 1;
    if (/\bemerging\b/i.test(text)) return 2;
    if (/\bdeveloping\b/i.test(text)) return 3;
    if (/\bexpanding\b/i.test(text)) return 4;
    if (/\bbridging\b/i.test(text)) return 5;
    const lone = String(text)
      .trim()
      .match(/^([1-6])$/);
    if (lone) return Number(lone[1]);
    return null;
  }

  function scanNeeds(text, student) {
    for (const key of NEED_KEYS) {
      if (NEEDS[key].keywords.test(text)) student.needs[key] = true;
    }
  }

  function newStudent(id) {
    return {
      id,
      section: "",
      plan: "",
      wida: null,
      needs: {},
      scaffolds: "",
      notes: "",
      privateNotes: "",
    };
  }

  /* ---------------- parse: CSV-with-header OR "ID — needs" lines ------------- */
  function parse(raw) {
    const warnings = [];
    const errors = [];
    const lines = String(raw || "")
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    if (!lines.length) {
      return {
        students: [],
        warnings,
        errors: ["Nothing to read — paste at least one student line."],
      };
    }

    const delim = detectDelim(lines[0]);
    const firstCells = splitCells(lines[0], delim);
    const headerFields = firstCells.map(headerField);
    const looksLikeHeader =
      firstCells.length >= 2 &&
      headerFields.filter(Boolean).length >= Math.min(2, firstCells.length);

    const students = [];

    if (looksLikeHeader) {
      const idCol = headerFields.indexOf("id");
      for (let li = 1; li < lines.length; li++) {
        const cells = splitCells(lines[li], delim);
        if (cells.every((c) => !c)) continue;
        const idRaw = idCol >= 0 ? cells[idCol] : cells[0];
        if (!idRaw || EMPTYISH.test(idRaw)) {
          errors.push(`Line ${li + 1}: missing a student ID — line skipped.`);
          continue;
        }
        const st = newStudent(anonymizeId(idRaw, warnings));
        cells.forEach((cell, ci) => {
          const field = headerFields[ci];
          if (ci === idCol || !cell || EMPTYISH.test(cell)) return;
          if (field === "section") st.section = cell.slice(0, 24);
          else if (field === "plan") st.plan = detectPlan(cell) || cell.slice(0, 12);
          else if (field === "wida") {
            st.wida = detectWida(cell);
            st.needs.language = true;
          } else if (field === "scaffolds") {
            st.scaffolds = cell;
            scanNeeds(cell, st);
          } else if (field === "private") st.privateNotes = cell;
          else if (field === "notes") {
            // An inline "private: ..." marker inside notes stays private too.
            let noteText = cell;
            const priv = noteText.match(/\bprivate\s*:\s*(.+)$/i);
            if (priv) {
              st.privateNotes = priv[1].trim();
              noteText = noteText.slice(0, priv.index).replace(/[,;\s]+$/, "");
            }
            if (noteText) {
              st.notes = noteText;
              scanNeeds(noteText, st);
            }
          } else if (field && NEEDS[field]) {
            st.needs[field] = true;
            st.notes = st.notes ? st.notes + "; " + cell : cell;
          } else {
            // Unmapped column: still scan it for support keywords.
            scanNeeds(cell, st);
          }
        });
        if (!st.plan) st.plan = detectPlan(lines[li]);
        if (st.wida == null && st.needs.language) st.wida = detectWida(lines[li]);
        students.push(st);
      }
    } else {
      // Simple mode: "ID — plan, needs..." / "ID: needs" / "ID, needs"
      for (let li = 0; li < lines.length; li++) {
        const m = lines[li].match(/^(.{1,24}?)\s*(?:[—:|\t]|,|-{1,2})\s+(.+)$/);
        if (!m) {
          errors.push(
            `Line ${li + 1}: could not split into "ID — supports". Use e.g. "A1 — extended time, read aloud".`,
          );
          continue;
        }
        const st = newStudent(anonymizeId(m[1], warnings));
        const rest = m[2];
        st.plan = detectPlan(rest);
        st.wida = detectWida(rest);
        if (st.wida != null) st.needs.language = true;
        scanNeeds(rest, st);
        st.notes = rest;
        const priv = rest.match(/\bprivate\s*:\s*(.+)$/i);
        if (priv) {
          st.privateNotes = priv[1];
          st.notes = rest.slice(0, priv.index).replace(/[,;\s]+$/, "");
        }
        if (!Object.keys(st.needs).length && !st.plan) {
          warnings.push(
            `Line ${li + 1} ("${st.id}"): no support keywords recognized — kept as a note only.`,
          );
        }
        students.push(st);
      }
    }

    // Duplicate IDs
    const seen = new Set();
    for (const st of students) {
      if (seen.has(st.id)) warnings.push(`Duplicate ID "${st.id}" — both rows were kept.`);
      seen.add(st.id);
    }

    return { students, warnings, errors };
  }

  /* ---------------- summary (drives the "active supports" chips) ------------ */
  function summarize(students) {
    const counts = {};
    const idsByNeed = {};
    const plans = {};
    let minWida = null;
    for (const st of students) {
      for (const key of NEED_KEYS) {
        if (st.needs[key]) {
          counts[key] = (counts[key] || 0) + 1;
          (idsByNeed[key] = idsByNeed[key] || []).push(st.id);
        }
      }
      if (st.plan) plans[st.plan] = (plans[st.plan] || 0) + 1;
      if (st.wida != null && (minWida == null || st.wida < minWida)) minWida = st.wida;
    }
    return {
      total: students.length,
      counts,
      idsByNeed,
      plans,
      minWida,
      needLabels: NEED_KEYS.filter((k) => counts[k]).map((k) => `${NEEDS[k].label} (${counts[k]})`),
    };
  }

  /* ---------------- strategy engine: needs -> concrete classroom moves ------ */
  function strategies(profile, fields) {
    const sum = profile.summary;
    const c = sum.counts;
    const n = (k) => c[k] || 0;
    const some = (k) => n(k) > 0;
    const kids = (k) =>
      profile.includeIds && sum.idsByNeed[k] ? ` (${sum.idsByNeed[k].join(", ")})` : "";

    const out = {
      sped: [],
      esol: [],
      grouping: [],
      doNowNote: "",
      independentCore: "",
      exitAccommodations: [],
      writingSupports: [],
      cfuPoints: [],
      pacingNote: "",
    };

    if (some("processing")) {
      out.sped.push(
        `Processing time (${n("processing")}): run the Do Now with no visible timer; give 8–10 seconds of wait time before taking any answer, and pre-cue these students one problem ahead ("#3 is yours").${kids("processing")}`,
      );
      out.doNowNote =
        "No visible timer; students who need more time keep working while others share.";
      out.exitAccommodations.push(
        "Extended time: an unfinished exit ticket comes back as tomorrow's Do Now — it is not a zero.",
      );
      out.pacingNote =
        "Build 2–3 minutes of slack into guided practice; do not compress the exit ticket to end on time.";
    }
    if (some("reading")) {
      out.sped.push(
        `Reading access (${n("reading")}): read every direction and word problem aloud twice; students highlight the numbers and underline the question before solving.${kids("reading")}`,
      );
      out.exitAccommodations.push(
        "Exit-ticket questions read aloud on request — quietly, at the desk.",
      );
    }
    if (some("attention")) {
      out.sped.push(
        `Attention / executive function (${n("attention")}): give a printed step checklist (the worked-example steps) to keep on the desk; hand out independent practice in chunks — problems 1–3 first, then 4–6 after a check-in.${kids("attention")}`,
      );
      out.cfuPoints.push(
        "Check in with the step-checklist students at problem 3 of independent practice — before frustration, not after.",
      );
    }
    if (some("behavior")) {
      out.sped.push(
        `Self-regulation (${n("behavior")}): agree on a non-verbal reset cue before the lesson starts; a 2-minute break pass is honored without discussion; give the first positive narration inside the first five minutes.${kids("behavior")}`,
      );
    }
    if (some("math")) {
      out.sped.push(
        `Math tools (${n("math")}): multiplication chart and calculator allowed for the computation steps — today's target is the setup, not the arithmetic. Put grid paper and manipulatives on an open table so no one is singled out.${kids("math")}`,
      );
    }
    if (some("writing")) {
      out.sped.push(
        `Writing support (${n("writing")}): print the Section 9 sentence frames as a desk strip; allow 60 seconds of oral rehearsal with a partner before anyone writes; accept scribed or speech-to-text responses where the plan calls for it.${kids("writing")}`,
      );
      out.writingSupports.push(
        "Oral rehearsal before written response: say your Because-sentence to your partner first, then write it.",
      );
    }
    if (some("assessment")) {
      out.sped.push(
        `Assessment accommodations (${n("assessment")}): a 2-question core exit ticket (the starred items) counts as complete; small-group or separate-location testing per plan; never display a countdown timer during assessment.${kids("assessment")}`,
      );
      out.exitAccommodations.push(
        "Core exit ticket = the 2 starred questions; the rest is bonus evidence, not a requirement.",
      );
    }
    if (some("processing") || some("attention") || some("assessment")) {
      out.independentCore =
        "Core set: problems 1–4. Everyone starts there; 5–6 are for students who finish the core set. Completing the core set well beats rushing all six.";
    }

    // Language ladder — merge the class's lowest WIDA level with the form field.
    const fieldWida = (() => {
      const m = String((fields && fields.wida) || "").match(/([1-6])/);
      if (m) return Number(m[1]);
      if (/newcomer/i.test(String((fields && fields.wida) || ""))) return 1;
      return null;
    })();
    const wida =
      sum.minWida != null && fieldWida != null
        ? Math.min(sum.minWida, fieldWida)
        : sum.minWida != null
          ? sum.minWida
          : fieldWida;

    if (some("language") || wida != null) {
      const count = n("language") ? ` (${n("language")})` : "";
      if (wida != null && wida <= 1) {
        out.esol.push(
          `Newcomer / WIDA 1${count}: pre-teach the vocabulary table with visuals in a 3-minute small group BEFORE the Do Now; accept pointing, labeling, and copying the worked model as full participation; pair with a same-language partner where possible.${kids("language")}`,
        );
      } else if (wida === 2) {
        out.esol.push(
          `WIDA 2 (Emerging)${count}: every spoken and written response gets a sentence frame; rehearse the kernel sentence chorally once before partner talk; keep the word bank visible all lesson.${kids("language")}`,
        );
      } else if (wida === 3) {
        out.esol.push(
          `WIDA 3 (Developing)${count}: partner rehearsal before any whole-class share; provide the paragraph frame for the TWR response; push for lesson vocabulary in the second attempt, not the first.${kids("language")}`,
        );
      } else if (wida != null) {
        out.esol.push(
          `WIDA ${wida} (Expanding+)${count}: hold for precise academic vocabulary; have the student restate a peer's strategy in their own words as the stretch move.${kids("language")}`,
        );
      } else {
        out.esol.push(
          `Language support${count}: sentence frames for every response, the Spanish cognates from the vocabulary table pre-taught, and partner talk before writing.${kids("language")}`,
        );
      }
      out.writingSupports.push(
        "Word bank + sentence frames stay posted during the written response — using them is the expectation, not a crutch.",
      );
    }

    // Grouping suggestion (teacher-facing).
    const reteachPool = Math.max(n("processing"), n("math"), n("reading"));
    if (reteachPool > 0) {
      out.grouping.push(
        `Teacher-table start: begin independent practice with a standing small group of ${reteachPool}+ students who benefit from a guided first problem${profile.includeIds ? kids("processing") || kids("math") || kids("reading") : ""} — join by invitation AND open to anyone who wants it.`,
      );
    }
    if (some("language")) {
      out.grouping.push(
        "Strategic pairs for partner work: one language-strong explainer with one developing-English partner; both must be able to explain the answer.",
      );
    }

    return out;
  }

  /* ---------------- storage (this browser only) ----------------
     An in-memory copy backs up localStorage so a locked profile still
     works for the rest of the session when storage is blocked or full
     (private mode, school-managed devices). */
  let memProfile = null;
  function load() {
    if (memProfile) return memProfile;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || !Array.isArray(p.students)) return null;
      memProfile = p;
      return p;
    } catch (_) {
      return null;
    }
  }
  function save(profile) {
    memProfile = profile;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(profile));
      return true;
    } catch (_) {
      return false;
    }
  }
  function clear() {
    memProfile = null;
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (_) {}
  }

  /* ---------------- sample + blank template ---------------- */
  const SAMPLE = `id, plan, wida, reading, processing, math, writing, notes
A1, IEP, , read aloud, extended time, multiplication chart, , checks in often
B2, 504, , , extended time, , , quiet redirect works best
C3, ESOL, 2, , , , sentence frames, newcomer arrived in fall
D4, IEP, , , , calculator, speech-to-text, private: see case manager notes
E5, ESOL, 3, , , , , partner talk before writing`;

  const TEMPLATE = `id, plan, wida, reading, processing, attention, behavior, math, writing, assessment, private, notes
# One student per line. Use initials or anonymous IDs (A1, B2) — not full names.
# plan: IEP / 504 / ESOL / blank.  wida: 1-6 or blank.
# Put an X or a short note in any support column that applies.
# "private" notes stay in this browser and never appear in any output.
A1, , , , , , , , , , , `;

  window.LPGProfile = {
    parse,
    summarize,
    strategies,
    load,
    save,
    clear,
    NEEDS,
    NEED_KEYS,
    SAMPLE,
    TEMPLATE,
    STORE_KEY,
  };
})();
