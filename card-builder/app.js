/**
 * Universal Lesson Card Factory — EduWonderLab teacher tool
 * Static HTML/CSS/JS — no external dependencies
 */

(function () {
  "use strict";

  let PRESETS = {
    ratios: {
      gradeLevel: "6",
      subject: "Math",
      unitNumber: "4",
      unitTitle: "Ratios and Rates",
      unitTheme: "Sports statistics, recipes, and shopping deals",
      lessonNumber: "4-1",
      lessonTitle: "Rates and Unit Rates",
      standard: "6.RP.A.2",
      mainSkill: "compare ratios",
      lessonSummary:
        "Students explore how rates appear in real life and learn to compare ratios using unit rates and equivalent ratios.",
      studentSupportLevel: "standard",
      includeEsol: false,
      includeSpanishVocab: false,
      includeTwr: false,
      includeChallenge: false,
      existingLinks: "",
    },
    "one-step": {
      gradeLevel: "6",
      subject: "Math",
      unitNumber: "7",
      unitTitle: "Expressions and Equations",
      unitTheme: "Balance puzzles and number mysteries",
      lessonNumber: "7-2",
      lessonTitle: "Solve One-Step Equations",
      standard: "6.EE.B.7",
      mainSkill: "solve one-step equations",
      lessonSummary:
        "Students use inverse operations to solve equations with addition, subtraction, multiplication, and division.",
      studentSupportLevel: "standard",
      includeEsol: false,
      includeSpanishVocab: false,
      includeTwr: true,
      includeChallenge: false,
      existingLinks: "",
    },
    "mean-median": {
      gradeLevel: "6",
      subject: "Math",
      unitNumber: "8",
      unitTitle: "Statistics and Data",
      unitTheme: "Survey results and sports scores",
      lessonNumber: "8-1",
      lessonTitle: "Mean, Median, and Mode",
      standard: "6.SP.B.5",
      mainSkill: "find mean median and mode",
      lessonSummary:
        "Students collect and analyze data sets to find measures of center.",
      studentSupportLevel: "standard",
      includeEsol: true,
      includeSpanishVocab: true,
      includeTwr: false,
      includeChallenge: false,
      existingLinks: "",
    },
    fractions: {
      gradeLevel: "5",
      subject: "Math",
      unitNumber: "3",
      unitTitle: "Fraction Operations",
      unitTheme: "Cooking and recipe adjustments",
      lessonNumber: "3-4",
      lessonTitle: "Add Fractions with Unlike Denominators",
      standard: "5.NF.A.1",
      mainSkill: "add fractions with unlike denominators",
      lessonSummary:
        "Students find common denominators to add fractions in real-world recipe problems.",
      studentSupportLevel: "extra-scaffolded",
      includeEsol: true,
      includeSpanishVocab: false,
      includeTwr: false,
      includeChallenge: false,
      existingLinks: "",
    },
    "two-step": {
      gradeLevel: "7",
      subject: "Math",
      unitNumber: "5",
      unitTitle: "Equations and Inequalities",
      unitTheme: "Budget planning and ticket sales",
      lessonNumber: "5-3",
      lessonTitle: "Two-Step Equations",
      standard: "7.EE.B.4a",
      mainSkill: "solve two-step equations",
      lessonSummary:
        "Students solve equations that require two inverse operations, including equations with parentheses.",
      studentSupportLevel: "standard",
      includeEsol: false,
      includeSpanishVocab: false,
      includeTwr: true,
      includeChallenge: true,
      existingLinks: "",
    },
    linear: {
      gradeLevel: "8",
      subject: "Math",
      unitNumber: "6",
      unitTitle: "Functions and Graphing",
      unitTheme: "Phone plans and distance over time",
      lessonNumber: "6-2",
      lessonTitle: "Linear Functions",
      standard: "8.F.A.3",
      mainSkill: "graph and interpret linear functions",
      lessonSummary:
        "Students identify linear relationships, write equations, and interpret slope in context.",
      studentSupportLevel: "challenge",
      includeEsol: false,
      includeSpanishVocab: false,
      includeTwr: true,
      includeChallenge: true,
      existingLinks: "",
    },
  };

  const VAGUE_TITLES = [
    "lesson",
    "math",
    "practice",
    "activity",
    "review",
    "test",
    "quiz",
    "work",
    "notes",
    "day 1",
    "day 2",
    "intro",
    "warm up",
    "exit ticket",
  ];

  const OBJECTIVE_PATTERNS = [
    {
      test: /compare\s+ratios?/i,
      build: (_skill, variant = 0) => {
        const options = [
          "I can compare ratios by finding unit rates or using equivalent ratios.",
          "I can compare ratios in real-world situations by calculating and interpreting unit rates.",
        ];
        return options[variant % options.length];
      },
    },
    {
      test: /solve\s+one[- ]step\s+equations?/i,
      build: (_skill, variant = 0) => {
        const options = [
          "I can solve one-step equations using inverse operations.",
          "I can solve one-step equations by isolating the variable and checking my solution.",
        ];
        return options[variant % options.length];
      },
    },
    {
      test: /solve\s+two[- ]step\s+equations?/i,
      build: (_skill, variant = 0) => {
        const options = [
          "I can solve two-step equations by undoing operations in the correct order.",
          "I can solve two-step equations by using inverse operations and showing each step.",
        ];
        return options[variant % options.length];
      },
    },
    {
      test: /find\s+(the\s+)?area\s+of\s+triangles?/i,
      build: () =>
        "I can find the area of a triangle using the formula A = 1/2 × base × height.",
    },
    {
      test: /add\s+fractions?\s+with\s+unlike\s+denominators?/i,
      build: () =>
        "I can add fractions with unlike denominators by finding a common denominator.",
    },
    {
      test: /mean|median|mode/i,
      build: (skill) => {
        if (/mean.*median.*mode|median.*mode/i.test(skill)) {
          return "I can find the mean, median, and mode of a data set and explain what each measure tells me.";
        }
        return "I can find and interpret measures of center in a data set.";
      },
    },
    {
      test: /linear\s+functions?|graph.*linear/i,
      build: () =>
        "I can graph and interpret linear functions to describe relationships between quantities.",
    },
    {
      test: /unit\s+rates?/i,
      build: () =>
        "I can find and use unit rates to compare situations and solve problems.",
    },
    {
      test: /divide\s+fractions?/i,
      build: () =>
        "I can divide fractions by multiplying by the reciprocal and simplifying.",
    },
    {
      test: /multiply\s+fractions?/i,
      build: () =>
        "I can multiply fractions and mixed numbers and simplify my answer.",
    },
    {
      test: /percent/i,
      build: () =>
        "I can solve problems involving percents using models, equations, or equivalent ratios.",
    },
    {
      test: /volume/i,
      build: () =>
        "I can find the volume of three-dimensional figures using appropriate formulas.",
    },
    {
      test: /slope/i,
      build: () =>
        "I can determine the slope of a line and interpret it in context.",
    },
    {
      test: /inequalit/i,
      build: () =>
        "I can solve and graph inequalities and interpret solutions in context.",
    },
    {
      test: /pythagorean/i,
      build: () =>
        "I can use the Pythagorean theorem to find missing side lengths in right triangles.",
    },
    {
      test: /exponent/i,
      build: () =>
        "I can apply properties of exponents to simplify and evaluate expressions.",
    },
    {
      test: /graph/i,
      build: (skill) =>
        `I can create and interpret graphs to represent ${cleanSkillPhrase(skill)}.`,
    },
    {
      test: /simplify/i,
      build: (skill) =>
        `I can simplify expressions and equations when ${cleanSkillPhrase(skill)}.`,
    },
    {
      test: /convert/i,
      build: (skill) =>
        `I can convert between units when ${cleanSkillPhrase(skill)}.`,
    },
    {
      test: /write/i,
      build: (skill) =>
        `I can write equations or expressions to ${cleanSkillPhrase(skill)}.`,
    },
    {
      test: /identify/i,
      build: (skill) =>
        `I can identify key features when I ${cleanSkillPhrase(skill)}.`,
    },
    {
      test: /explain/i,
      build: (skill) =>
        `I can explain my reasoning when I ${cleanSkillPhrase(skill)}.`,
    },
    {
      test: /solve/i,
      build: (skill) => `I can solve problems by ${methodForSkill(skill)}.`,
    },
    {
      test: /find/i,
      build: (skill) =>
        `I can find and interpret results when I ${cleanSkillPhrase(skill)}.`,
    },
    {
      test: /compare/i,
      build: (skill) => `I can compare quantities by ${methodForSkill(skill)}.`,
    },
    {
      test: /add|subtract|multiply|divide/i,
      build: (skill) =>
        `I can ${cleanSkillPhrase(skill)} accurately and explain my strategy.`,
    },
  ];

  let state = {
    html: "",
    json: "",
    pack: "",
    lesson: null,
    objectiveVariant: 0,
    extractManifest: null,
  };

  const form = document.getElementById("lesson-form");
  const cardPreview = document.getElementById("cardPreview");
  const qaWarnings = document.getElementById("qaWarnings");
  const outputCode = document.getElementById("outputCode");
  const toast = document.getElementById("toast");
  const copyHtmlBtn = document.getElementById("copyHtmlBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");
  const copyPackBtn = document.getElementById("copyPackBtn");

  function cleanSkillPhrase(skill) {
    return skill
      .trim()
      .replace(/^to\s+/i, "")
      .replace(/\.$/, "")
      .toLowerCase();
  }

  function methodForSkill(skill) {
    const s = cleanSkillPhrase(skill);
    if (/equation/.test(s))
      return "using inverse operations and checking my solution";
    if (/ratio|rate|percent/.test(s))
      return "using equivalent ratios or unit rates";
    if (/fraction/.test(s)) return "using models and common denominators";
    if (/graph|function|linear/.test(s))
      return "creating graphs and interpreting key features";
    if (/area|volume/.test(s))
      return "applying the correct formula and showing my work";
    if (/data|mean|median|mode/.test(s))
      return "organizing data and calculating accurately";
    return s;
  }

  function slugify(text) {
    return text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function buildLessonSlug(lessonNumber, lessonTitle) {
    const num = slugify(lessonNumber || "lesson");
    const title = slugify(lessonTitle || "untitled");
    return `${num}-${title}`.replace(/-+/g, "-");
  }

  const EWL_REPO = "~/Documents/EduWonderLab/reveal-math-activities";

  function effectiveLessonId(data) {
    const base = (data.lessonNumber || "lesson").replace(/-flagship$/i, "");
    return data.includeFlagship ? `${base}-flagship` : base;
  }

  function buildPaths(lessonNumber, slug, includeFlagship = false) {
    const base = (lessonNumber || slug).replace(/-flagship$/i, "");
    const id = includeFlagship ? `${base}-flagship` : base;
    return {
      lessonId: id,
      lessonSlug: slug,
      interactivePath: `./lessons/${id}/`,
      guidedNotesPath: `./lessons/${id}/notes.html`,
      notesPdfPath: `./lessons/${id}/downloads/${id}-notes.pdf`,
      notesDocxPath: `./lessons/${id}/downloads/${id}-notes.docx`,
      homeworkPath: `./lessons/${id}/homework.docx`,
      homeworkHtmlPath: `./lessons/${id}/homework.html`,
      slidesPath: `./lessons/${id}/slides.html`,
      vocabPath: `./lessons/${id}/notes.html`,
      sentenceFramesPath: `./lessons/${id}/notes.html`,
      visualPracticePath: `./lessons/${id}/`,
      spanishVocabPath: `./lessons/${id}/notes.html`,
      challengePath: `./lessons/${id}/homework.html`,
      errorAnalysisPath: `./lessons/${id}/homework.html`,
      createProblemPath: `./lessons/${id}/homework.html`,
    };
  }

  function buildScaffoldCommand(lessonNumber, jsonFilename, data = {}) {
    const file = jsonFilename || `${lessonNumber || "lesson"}-card.json`;
    const exportPath = `~/Desktop/teacher-tools/card-builder/exports/${file}`;
    let cmd = `cd ${EWL_REPO} && npm run build-lesson-pack -- ${exportPath}`;
    if (data.extractPath) {
      cmd += ` --extract "${data.extractPath}"`;
    }
    if (data.extractSession && data.extractSession !== "S1") {
      cmd += ` --session ${data.extractSession}`;
    }
    return cmd;
  }

  function getFormData() {
    return {
      gradeLevel: document.getElementById("gradeLevel").value.trim(),
      subject: document.getElementById("subject").value.trim() || "Math",
      unitNumber: document.getElementById("unitNumber").value.trim(),
      unitTitle: document.getElementById("unitTitle").value.trim(),
      unitTheme: document.getElementById("unitTheme").value.trim(),
      lessonNumber: document.getElementById("lessonNumber").value.trim(),
      lessonTitle: document.getElementById("lessonTitle").value.trim(),
      standard: document.getElementById("standard").value.trim(),
      mainSkill: document.getElementById("mainSkill").value.trim(),
      lessonSummary: document.getElementById("lessonSummary").value.trim(),
      studentSupportLevel: document.getElementById("studentSupportLevel").value,
      includeEsol: document.getElementById("includeEsol").checked,
      includeSpanishVocab: document.getElementById("includeSpanishVocab")
        .checked,
      includeTwr: document.getElementById("includeTwr").checked,
      includeChallenge: document.getElementById("includeChallenge").checked,
      includeReadiness: document.getElementById("includeReadiness").checked,
      includeFlagship: document.getElementById("includeFlagship").checked,
      extractPath: document.getElementById("extractPath").value.trim(),
      extractSession: document.getElementById("extractSession").value || "S1",
      existingLinks: document.getElementById("existingLinks").value.trim(),
      outputMode: document.getElementById("outputMode").value,
    };
  }

  function setFormData(data) {
    document.getElementById("gradeLevel").value = data.gradeLevel || "";
    document.getElementById("subject").value = data.subject || "Math";
    document.getElementById("unitNumber").value = data.unitNumber || "";
    document.getElementById("unitTitle").value = data.unitTitle || "";
    document.getElementById("unitTheme").value = data.unitTheme || "";
    document.getElementById("lessonNumber").value = data.lessonNumber || "";
    document.getElementById("lessonTitle").value = data.lessonTitle || "";
    document.getElementById("standard").value = data.standard || "";
    document.getElementById("mainSkill").value = data.mainSkill || "";
    document.getElementById("lessonSummary").value = data.lessonSummary || "";
    document.getElementById("studentSupportLevel").value =
      data.studentSupportLevel || "standard";
    document.getElementById("includeEsol").checked = Boolean(data.includeEsol);
    document.getElementById("includeSpanishVocab").checked = Boolean(
      data.includeSpanishVocab,
    );
    document.getElementById("includeTwr").checked = Boolean(data.includeTwr);
    document.getElementById("includeChallenge").checked = Boolean(
      data.includeChallenge,
    );
    document.getElementById("extractPath").value = data.extractPath || "";
    syncExtractSelect(data.extractPath || "");
    document.getElementById("extractSession").value =
      data.extractSession || "S1";
    document.getElementById("includeReadiness").checked =
      data.includeReadiness !== false;
    document.getElementById("includeFlagship").checked = Boolean(
      data.includeFlagship,
    );
    document.getElementById("existingLinks").value = data.existingLinks || "";
    if (data.outputMode) {
      document.getElementById("outputMode").value = data.outputMode;
    }
  }

  function generateObjective(skill, supportLevel, variant = 0) {
    const normalized = skill.trim();
    if (!normalized) {
      return "I can demonstrate understanding of today's math skill.";
    }

    for (const pattern of OBJECTIVE_PATTERNS) {
      if (pattern.test.test(normalized)) {
        let objective = pattern.build(normalized, variant);
        objective = applySupportToObjective(objective, supportLevel, variant);
        return ensureICan(objective);
      }
    }

    const fallback = buildFallbackObjective(normalized, supportLevel, variant);
    return ensureICan(fallback);
  }

  function ensureICan(text) {
    const trimmed = text.trim();
    if (/^i can\b/i.test(trimmed)) return trimmed;
    return `I can ${trimmed.replace(/^to\s+/i, "").replace(/\.$/, "")}.`;
  }

  function buildFallbackObjective(skill, supportLevel, variant) {
    const phrase = cleanSkillPhrase(skill);
    const templates = [
      `I can ${phrase} and explain my reasoning using models and examples.`,
      `I can ${phrase} accurately and check whether my answer makes sense.`,
      `I can ${phrase} step by step and justify each part of my solution.`,
    ];
    let objective = templates[variant % templates.length];
    return applySupportToObjective(objective, supportLevel, variant);
  }

  function applySupportToObjective(objective, supportLevel, variant) {
    const additions = {
      "esol-1-2.5": [
        " I can use sentence frames and visuals to show my thinking.",
        " I can use vocabulary supports and pictures to explain my work.",
      ],
      "esol-2.6-4.5": [
        " I can use academic vocabulary and sentence starters to explain my thinking.",
      ],
      "extra-scaffolded": [
        " I can use worked examples and graphic organizers to support my learning.",
      ],
      challenge: [
        " I can extend my thinking with challenging problems and justify my reasoning.",
      ],
    };

    const extra = additions[supportLevel];
    if (extra && extra.length) {
      const suffix = extra[variant % extra.length].trim();
      if (!objective.includes(suffix)) {
        const base = objective.replace(/\.$/, "");
        return `${base}. ${suffix}`;
      }
    }
    return objective;
  }

  function generateDescription(data, objective) {
    if (data.lessonSummary) return data.lessonSummary;

    const theme = data.unitTheme
      ? ` through ${data.unitTheme.toLowerCase()}`
      : "";
    const skill = data.mainSkill || data.lessonTitle || "today's skill";
    return `In this lesson, students practice how to ${cleanSkillPhrase(skill)}${theme}. ${objective.replace(/^I can /i, "They learn to ")}`;
  }

  function extractVocabulary(skill, lessonTitle, includeEsol, includeSpanish) {
    const source = `${skill} ${lessonTitle}`.toLowerCase();
    const vocabMap = {
      ratio: ["ratio", "equivalent ratio", "unit rate"],
      rate: ["rate", "unit rate", "per"],
      equation: ["equation", "variable", "inverse operation", "solution"],
      fraction: ["fraction", "denominator", "numerator", "common denominator"],
      "mean median": ["mean", "median", "mode", "data set", "average"],
      linear: ["linear function", "slope", "y-intercept", "rate of change"],
      area: ["area", "base", "height", "formula"],
      percent: ["percent", "rate", "part", "whole"],
      graph: ["graph", "coordinate plane", "axis", "point"],
      inequality: ["inequality", "solution set", "number line"],
    };

    const tags = new Set();

    for (const [key, words] of Object.entries(vocabMap)) {
      if (
        key.split(" ").some((k) => source.includes(k)) ||
        source.includes(key)
      ) {
        words.forEach((w) => tags.add(w));
      }
    }

    const tokens = source
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 3 &&
          !["with", "using", "find", "solve", "step", "math"].includes(w),
      );

    tokens.slice(0, 4).forEach((t) => tags.add(t));

    if (includeEsol) {
      tags.add("academic vocabulary");
      tags.add("sentence frames");
    }
    if (includeSpanish) {
      tags.add("Spanish vocabulary");
    }

    return Array.from(tags).slice(0, 8);
  }

  function generateTwrPrompt(skill, lessonTitle, unitTheme) {
    const topic = lessonTitle || skill || "this math concept";
    const context = unitTheme || "a real-world situation";
    const action = cleanSkillPhrase(skill) || "apply today's skill";

    return {
      because: `Because ${topic.toLowerCase()} helps us understand ${context.toLowerCase()},`,
      but: `but students sometimes struggle when they try to ${action} without organizing their work,`,
      so: `so I will show my steps clearly and explain how my solution makes sense in context.`,
    };
  }

  function parseExistingLinks(text) {
    if (!text) return {};
    const map = {};
    text.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const [label, ...rest] = trimmed.split("|");
      const url = rest.join("|").trim();
      if (label && url) {
        map[label.trim().toLowerCase()] = url;
      }
    });
    return map;
  }

  function buildResources(data, paths) {
    const existing = parseExistingLinks(data.existingLinks);
    const resources = [
      {
        label: "Interactive Lesson",
        href: existing["interactive lesson"] || paths.interactivePath,
        className: "interactive",
        type: "interactive",
        section: "Lesson & Slides",
      },
      {
        label: "Guided Notes",
        href: existing["guided notes"] || paths.guidedNotesPath,
        className: "guided-notes",
        type: "print",
        section: "Notes & Handouts",
      },
      {
        label: "Notes PDF",
        href: existing["notes pdf"] || paths.notesPdfPath,
        type: "print",
        className: "notes-pdf",
        section: "Notes & Handouts",
      },
      {
        label: "Notes DOCX",
        href: existing["notes docx"] || paths.notesDocxPath,
        type: "print",
        className: "notes-docx",
        section: "Notes & Handouts",
      },
      {
        label: "Homework",
        href: existing["homework"] || paths.homeworkPath,
        type: "print",
        className: "homework",
        section: "Homework & Family",
      },
    ];

    if (data.includeEsol) {
      resources.push(
        {
          label: "Vocabulary Support",
          href: existing["vocabulary support"] || paths.vocabPath,
          className: "support",
          type: "support",
          section: "ESOL Supports",
        },
        {
          label: "Sentence Frames",
          href: existing["sentence frames"] || paths.sentenceFramesPath,
          className: "support",
          type: "support",
          section: "ESOL Supports",
        },
        {
          label: "Visual Practice",
          href: existing["visual practice"] || paths.visualPracticePath,
          className: "support",
          type: "interactive",
          section: "ESOL Supports",
        },
      );
      if (data.includeSpanishVocab) {
        resources.push({
          label: "Spanish Vocabulary",
          href: existing["spanish vocabulary"] || paths.spanishVocabPath,
          className: "support",
          type: "support",
          section: "ESOL Supports",
        });
      }
    }

    if (data.includeChallenge) {
      resources.push(
        {
          label: "Challenge Task",
          href: existing["challenge task"] || paths.challengePath,
          className: "challenge",
          type: "challenge",
          section: "Challenge Extensions",
        },
        {
          label: "Error Analysis",
          href: existing["error analysis"] || paths.errorAnalysisPath,
          className: "challenge",
          type: "challenge",
          section: "Challenge Extensions",
        },
        {
          label: "Create Your Own Problem",
          href: existing["create your own problem"] || paths.createProblemPath,
          className: "challenge",
          type: "challenge",
          section: "Challenge Extensions",
        },
      );
    }

    return resources;
  }

  function buildSupports(data, tags) {
    const supports = [];
    const levelLabels = {
      standard: "Standard Support",
      "esol-1-2.5": "ESOL Level 1–2.5",
      "esol-2.6-4.5": "ESOL Level 2.6–4.5",
      "extra-scaffolded": "Extra Scaffolded",
      challenge: "Challenge",
    };
    supports.push(levelLabels[data.studentSupportLevel] || "Standard Support");
    if (data.includeEsol) supports.push("ESOL Supports");
    if (data.includeSpanishVocab) supports.push("Spanish Vocabulary");
    if (data.includeTwr) supports.push("TWR Writing Prompt");
    if (data.includeChallenge) supports.push("Challenge Extensions");
    tags.slice(0, 3).forEach((t) => supports.push(`Vocab: ${t}`));
    return supports;
  }

  function groupResourcesBySection(resources) {
    const sections = new Map();
    resources.forEach((r) => {
      const key = r.section || "Resources";
      if (!sections.has(key)) sections.set(key, []);
      sections.get(key).push(r);
    });
    return sections;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildPreviewHtml(lesson) {
    const sections = groupResourcesBySection(lesson.links);
    let resourceHtml = "";

    sections.forEach((items, sectionName) => {
      resourceHtml += `<div class="resource-section"><h4>${escapeHtml(sectionName)}</h4><div class="resource-links">`;
      items.forEach((item) => {
        resourceHtml += `<span class="resource-chip ${item.className || ""}">${escapeHtml(item.label)}</span>`;
      });
      resourceHtml += `</div></div>`;
    });

    const vocabHtml = lesson.tags.length
      ? `<div class="vocabulary-tags">${lesson.tags.map((t) => `<span class="vocab-tag">${escapeHtml(t)}</span>`).join("")}</div>`
      : "";

    const supportsHtml = lesson.supports.length
      ? `<div class="support-chips">${lesson.supports.map((s) => `<span class="support-chip">${escapeHtml(s)}</span>`).join("")}</div>`
      : "";

    let twrHtml = "";
    if (lesson.twrPrompt) {
      twrHtml = `<div class="twr-prompt"><h4>TWR Writing Prompt</h4>
        <p><strong>Because</strong> ${escapeHtml(lesson.twrPrompt.because)}</p>
        <p><strong>But</strong> ${escapeHtml(lesson.twrPrompt.but)}</p>
        <p><strong>So</strong> ${escapeHtml(lesson.twrPrompt.so)}</p></div>`;
    }

    const connection = lesson.unitTheme
      ? `<div class="lesson-connection"><h4>Real-World Connection</h4><p>${escapeHtml(lesson.unitTheme)}</p></div>`
      : "";

    return `<article class="lesson-card" data-lesson-slug="${escapeHtml(lesson.paths.lessonSlug)}">
  <div class="lesson-meta">
    <span class="unit-label">Unit ${escapeHtml(lesson.unitNumber)} · ${escapeHtml(lesson.unitTitle)}</span>
    <span>Lesson ${escapeHtml(lesson.lessonNumber)}</span>
    <span class="standard-badge">${escapeHtml(lesson.standard)}</span>
  </div>
  <h3 class="lesson-title">${escapeHtml(lesson.lessonTitle)}</h3>
  ${connection}
  <p class="lesson-description">${escapeHtml(lesson.description)}</p>
  <p class="lesson-objective">${escapeHtml(lesson.objective)}</p>
  ${vocabHtml}
  ${resourceHtml}
  ${supportsHtml}
  ${twrHtml}
</article>`;
  }

  function buildPasteHtml(lesson) {
    const sections = groupResourcesBySection(lesson.links);
    let resourceHtml = "";

    sections.forEach((items, sectionName) => {
      resourceHtml += `  <div class="resource-section">\n    <h4>${escapeHtml(sectionName)}</h4>\n    <div class="resource-links">\n`;
      items.forEach((item) => {
        resourceHtml += `      <a class="resource-chip ${item.className || ""}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>\n`;
      });
      resourceHtml += `    </div>\n  </div>\n`;
    });

    const vocabHtml = lesson.tags.length
      ? `  <div class="vocabulary-tags">\n${lesson.tags.map((t) => `    <span class="vocab-tag">${escapeHtml(t)}</span>`).join("\n")}\n  </div>\n`
      : "";

    const supportsHtml = lesson.supports.length
      ? `  <div class="support-chips">\n${lesson.supports.map((s) => `    <span class="support-chip">${escapeHtml(s)}</span>`).join("\n")}\n  </div>\n`
      : "";

    const connection = lesson.unitTheme
      ? `  <div class="lesson-connection">\n    <h4>Real-World Connection</h4>\n    <p>${escapeHtml(lesson.unitTheme)}</p>\n  </div>\n`
      : "";

    return `<article class="lesson-card" data-lesson-slug="${escapeHtml(lesson.paths.lessonSlug)}">
  <div class="lesson-meta">
    <span class="unit-label">Unit ${escapeHtml(lesson.unitNumber)} · ${escapeHtml(lesson.unitTitle)}</span>
    <span>Lesson ${escapeHtml(lesson.lessonNumber)}</span>
    <span class="standard-badge">${escapeHtml(lesson.standard)}</span>
  </div>
  <h3 class="lesson-title">${escapeHtml(lesson.lessonTitle)}</h3>
${connection}  <p class="lesson-description">${escapeHtml(lesson.description)}</p>
  <p class="lesson-objective">${escapeHtml(lesson.objective)}</p>
${vocabHtml}${resourceHtml}${supportsHtml}</article>`;
  }

  function buildJsonLesson(lesson) {
    const exportFile = `${lesson.lessonNumber || "lesson"}-card.json`;
    const obj = {
      grade: lesson.grade,
      subject: lesson.subject,
      unitNumber: lesson.unitNumber,
      unitTitle: lesson.unitTitle,
      unitTheme: lesson.unitTheme,
      lessonNumber: lesson.lessonNumber,
      lessonTitle: lesson.lessonTitle,
      standard: lesson.standard,
      mainSkill: lesson.data.mainSkill,
      lessonSummary: lesson.data.lessonSummary,
      studentSupportLevel: lesson.data.studentSupportLevel,
      includeEsol: lesson.data.includeEsol,
      includeSpanishVocab: lesson.data.includeSpanishVocab,
      includeTwr: lesson.data.includeTwr,
      includeChallenge: lesson.data.includeChallenge,
      includeReadiness: lesson.data.includeReadiness,
      includeFlagship: lesson.data.includeFlagship,
      extractPath: lesson.data.extractPath,
      session: lesson.data.extractSession,
      objective: lesson.objective,
      description: lesson.description,
      tags: lesson.tags,
      links: lesson.links.map((l) => ({
        label: l.label,
        href: l.href,
        type: l.type,
        section: l.section,
      })),
      supports: lesson.supports,
      paths: lesson.paths,
      generatedAt: lesson.generatedAt,
      ewl: {
        targetRepo: "reveal-math-activities",
        lessonId: lesson.lessonNumber,
        exportFile,
        scaffoldCommand: buildScaffoldCommand(
          lesson.lessonNumber,
          exportFile,
          lesson.data,
        ),
        buildPackCommand: buildScaffoldCommand(
          lesson.lessonNumber,
          exportFile,
          lesson.data,
        ),
      },
    };
    if (lesson.twrPrompt) obj.twrPrompt = lesson.twrPrompt;
    return JSON.stringify(obj, null, 2);
  }

  function buildPackPlan(lesson) {
    const lines = [
      `# Lesson Card Pack Plan`,
      ``,
      `## ${lesson.lessonNumber} — ${lesson.lessonTitle}`,
      `**Grade:** ${lesson.grade} | **Standard:** ${lesson.standard}`,
      `**Unit:** ${lesson.unitNumber} — ${lesson.unitTitle}`,
      `**Slug:** ${lesson.paths.lessonSlug}`,
      ``,
      `### Objective`,
      lesson.objective,
      ``,
      `### Description`,
      lesson.description,
      ``,
      `### Vocabulary Tags`,
      lesson.tags.length
        ? lesson.tags.map((t) => `- ${t}`).join("\n")
        : "- (none generated)",
      ``,
      `### File Paths / Slugs`,
      `- Lesson ID: \`${lesson.paths.lessonId}\``,
      `- Display slug: \`${lesson.paths.lessonSlug}\``,
      `- Interactive: \`${lesson.paths.interactivePath}\``,
      `- Guided Notes: \`${lesson.paths.guidedNotesPath}\``,
      `- Notes PDF: \`${lesson.paths.notesPdfPath}\``,
      `- Notes DOCX: \`${lesson.paths.notesDocxPath}\``,
      `- Homework: \`${lesson.paths.homeworkPath}\``,
      ``,
      `### Generate Real Files (EduWonderLab)`,
      `1. Click **Download JSON** in the card factory`,
      `2. Run:`,
      `\`\`\`bash`,
      lesson.ewlScaffoldCommand || buildScaffoldCommand(lesson.lessonNumber),
      `\`\`\``,
      `3. Edit \`lessons/${lesson.lessonNumber}/config.json\` to replace [TODO] placeholders`,
      `4. Re-run generators or use \`--generate\` again after editing`,
    ];

    if (lesson.data.includeEsol) {
      lines.push(
        `- Vocabulary Support: \`${lesson.paths.vocabPath}\``,
        `- Sentence Frames: \`${lesson.paths.sentenceFramesPath}\``,
        `- Visual Practice: \`${lesson.paths.visualPracticePath}\``,
      );
      if (lesson.data.includeSpanishVocab) {
        lines.push(
          `- Spanish Vocabulary: \`${lesson.paths.spanishVocabPath}\``,
        );
      }
    }

    if (lesson.data.includeChallenge) {
      lines.push(
        `- Challenge Task: \`${lesson.paths.challengePath}\``,
        `- Error Analysis: \`${lesson.paths.errorAnalysisPath}\``,
        `- Create Your Own Problem: \`${lesson.paths.createProblemPath}\``,
      );
    }

    lines.push(``, `### Resource Creation Checklist`);
    lesson.links.forEach((link) => {
      lines.push(`- [ ] **${link.label}** → ${link.href}`);
    });

    if (lesson.twrPrompt) {
      lines.push(
        ``,
        `### TWR Writing Prompt`,
        `- **Because** ${lesson.twrPrompt.because}`,
        `- **But** ${lesson.twrPrompt.but}`,
        `- **So** ${lesson.twrPrompt.so}`,
      );
    }

    lines.push(``, `### Support Level`, `- ${lesson.supports.join("\n- ")}`);

    return lines.join("\n");
  }

  function runQaChecks(lesson) {
    const warnings = [];

    if (!lesson.grade) warnings.push("Grade is missing.");
    if (!lesson.standard) warnings.push("Standard is missing.");

    const titleLower = (lesson.lessonTitle || "").toLowerCase().trim();
    if (!lesson.lessonTitle) {
      warnings.push("Lesson title is missing.");
    } else if (
      titleLower.length < 8 ||
      VAGUE_TITLES.some(
        (v) => titleLower === v || titleLower.startsWith(v + " "),
      )
    ) {
      warnings.push(
        "Lesson title may be too vague — add a specific skill or topic.",
      );
    }

    if (!/^i can\b/i.test(lesson.objective)) {
      warnings.push('Objective does not start with "I can".');
    }

    const hasInteractive = lesson.links.some((l) => l.type === "interactive");
    const hasPrint = lesson.links.some((l) => l.type === "print");
    if (!hasInteractive) warnings.push("No interactive resource is included.");
    if (!hasPrint) warnings.push("No print-friendly resource is included.");

    if (lesson.data.includeEsol && lesson.tags.length === 0) {
      warnings.push(
        "ESOL support is enabled but no vocabulary tags were generated.",
      );
    }

    const pathValues = Object.values(lesson.paths);
    pathValues.forEach((p) => {
      if (/[A-Z]/.test(p)) {
        warnings.push(`File path contains uppercase letters: ${p}`);
      }
      if (/\s/.test(p)) {
        warnings.push(`File path contains spaces: ${p}`);
      }
    });

    return warnings;
  }

  function buildLesson(data, objectiveVariant = 0) {
    const slug = buildLessonSlug(data.lessonNumber, data.lessonTitle);
    const paths = buildPaths(data.lessonNumber, slug, data.includeFlagship);
    const objective = generateObjective(
      data.mainSkill || data.lessonTitle,
      data.studentSupportLevel,
      objectiveVariant,
    );
    const description = generateDescription(data, objective);
    const tags = extractVocabulary(
      data.mainSkill,
      data.lessonTitle,
      data.includeEsol,
      data.includeSpanishVocab,
    );
    const links = buildResources(data, paths);
    const supports = buildSupports(data, tags);
    const twrPrompt = data.includeTwr
      ? generateTwrPrompt(data.mainSkill, data.lessonTitle, data.unitTheme)
      : null;

    const lesson = {
      grade: data.gradeLevel,
      subject: data.subject,
      unitNumber: data.unitNumber,
      unitTitle: data.unitTitle,
      unitTheme: data.unitTheme,
      lessonNumber: data.lessonNumber,
      lessonTitle: data.lessonTitle,
      standard: data.standard,
      objective,
      description,
      tags,
      links,
      supports,
      paths,
      twrPrompt,
      ewlScaffoldCommand: buildScaffoldCommand(
        data.lessonNumber,
        `${data.lessonNumber || "lesson"}-card.json`,
        data,
      ),
      generatedAt: new Date().toISOString(),
      data,
    };

    return lesson;
  }

  function renderQa(warnings) {
    if (!warnings.length) {
      qaWarnings.hidden = true;
      qaWarnings.innerHTML = "";
      return;
    }
    qaWarnings.hidden = false;
    qaWarnings.innerHTML = `<h3>QA Warnings (${warnings.length})</h3><ul>${warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`;
  }

  function setActiveTab(tab) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const map = { html: state.html, json: state.json, pack: state.pack };
    outputCode.textContent = map[tab] || "";
  }

  function generateCard(regenerateObjectiveOnly = false) {
    const data = getFormData();

    if (regenerateObjectiveOnly && state.lesson) {
      state.objectiveVariant += 1;
      state.lesson.objective = generateObjective(
        data.mainSkill || data.lessonTitle,
        data.studentSupportLevel,
        state.objectiveVariant,
      );
      state.lesson.description = generateDescription(
        data,
        state.lesson.objective,
      );
    } else {
      state.objectiveVariant = 0;
      state.lesson = buildLesson(data, 0);
    }

    const lesson = state.lesson;
    const warnings = runQaChecks(lesson);

    state.html = buildPasteHtml(lesson);
    state.json = buildJsonLesson(lesson);
    state.pack = buildPackPlan(lesson);

    cardPreview.innerHTML = buildPreviewHtml(lesson);
    renderQa(warnings);

    const modeMap = { html: "html", json: "json", pack: "pack" };
    const activeTab = modeMap[data.outputMode] || "html";
    setActiveTab(activeTab);

    copyHtmlBtn.disabled = false;
    copyJsonBtn.disabled = false;
    copyPackBtn.disabled = false;
    document.getElementById("downloadJsonBtn").disabled = false;
    updateScaffoldPanel(lesson);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  async function copyText(text, label) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(`${label} copied to clipboard!`);
    }
  }

  function downloadJson() {
    if (!state.json || !state.lesson) {
      showToast("Generate a card first.");
      return;
    }
    const filename = `${state.lesson.lessonNumber || "lesson"}-card.json`;
    const blob = new Blob([state.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    updateScaffoldPanel(state.lesson);
    showToast(`Downloaded ${filename}`);
  }

  function updateScaffoldPanel(lesson) {
    const panel = document.getElementById("scaffoldPanel");
    if (!panel || !lesson) return;
    const cmd =
      lesson.ewlScaffoldCommand || buildScaffoldCommand(lesson.lessonNumber);
    panel.hidden = false;
    const lessonId = lesson.data?.includeFlagship
      ? `${lesson.lessonNumber}-flagship`
      : lesson.lessonNumber;
    const hasExtract = Boolean(lesson.data?.extractPath);
    const pipelineCmd = `./pipeline.sh full exports/${escapeHtml(lesson.lessonNumber)}-card.json`;
    panel.innerHTML = `<h3>Generate Real Lesson Files</h3>
      <p>Download the JSON, then run in Terminal to build <strong>lessons/${escapeHtml(lessonId)}/</strong> — interactive lesson, notes, PDF, DOCX, homework, slides, readiness, and curriculum hub.</p>
      ${hasExtract ? `<p class="scaffold-tip">Extract merge ON — launch, explore, practice, vocabulary, and readiness auto-fill from your deck.</p>` : `<p class="scaffold-tip">Tip: pick an extract above to auto-fill lesson body content.</p>`}
      <pre class="scaffold-command">${escapeHtml(pipelineCmd)}</pre>
      <p class="scaffold-tip">Batch: <code>./pipeline.sh build-all</code> · Single: <code>./generate-resources.sh exports/${escapeHtml(lesson.lessonNumber)}-card.json</code></p>`;
  }

  async function loadExtractManifest() {
    const status = document.getElementById("extractManifestStatus");
    const select = document.getElementById("extractSelect");
    try {
      const res = await fetch("data/extract-manifest.json");
      if (!res.ok) throw new Error("manifest not found");
      state.extractManifest = await res.json();
      const files = state.extractManifest.files || [];
      select.innerHTML =
        '<option value="">— Choose an extract —</option>' +
        files
          .map(
            (f) =>
              `<option value="${escapeHtml(f.path)}">${escapeHtml(f.label)} (${escapeHtml(f.kind)})</option>`,
          )
          .join("");
      status.textContent = files.length
        ? `${files.length} extract(s) loaded. Run ./pipeline.sh refresh after adding new decks.`
        : "No extracts found. Run ./pipeline.sh refresh after extract.py.";
    } catch {
      status.textContent =
        "Extract list unavailable — run: node refresh-extract-manifest.mjs";
    }
  }

  function syncExtractSelect(path) {
    const select = document.getElementById("extractSelect");
    if (!path) {
      select.value = "";
      return;
    }
    const match = [...select.options].find((o) => o.value === path);
    select.value = match ? path : "";
  }

  function resetForm() {
    form.reset();
    document.getElementById("subject").value = "Math";
    document.getElementById("studentSupportLevel").value = "standard";
    document.getElementById("outputMode").value = "html";
    state = { html: "", json: "", pack: "", lesson: null, objectiveVariant: 0 };
    cardPreview.innerHTML =
      '<p class="preview-placeholder">Fill in lesson details and click <strong>Generate Card</strong> to preview your EduWonderLab-style lesson card.</p>';
    qaWarnings.hidden = true;
    outputCode.textContent = "Select an output tab after generating a card.";
    copyHtmlBtn.disabled = true;
    copyJsonBtn.disabled = true;
    copyPackBtn.disabled = true;
    document.getElementById("downloadJsonBtn").disabled = true;
    const panel = document.getElementById("scaffoldPanel");
    if (panel) panel.hidden = true;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    generateCard(false);
  });

  document
    .getElementById("regenerateObjectiveBtn")
    .addEventListener("click", () => {
      if (!state.lesson) {
        generateCard(false);
        return;
      }
      generateCard(true);
    });

  document.getElementById("resetBtn").addEventListener("click", resetForm);

  copyHtmlBtn.addEventListener("click", () => copyText(state.html, "HTML"));
  copyJsonBtn.addEventListener("click", () => copyText(state.json, "JSON"));
  copyPackBtn.addEventListener("click", () =>
    copyText(state.pack, "Full Pack Plan"),
  );
  document
    .getElementById("downloadJsonBtn")
    .addEventListener("click", downloadJson);

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
  });

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = PRESETS[btn.dataset.preset];
      if (preset) {
        setFormData(preset);
        generateCard(false);
      }
    });
  });

  document.getElementById("includeEsol").addEventListener("change", (e) => {
    if (!e.target.checked) {
      document.getElementById("includeSpanishVocab").checked = false;
    }
  });

  document
    .getElementById("extractSelect")
    .addEventListener("change", async (e) => {
      const path = e.target.value;
      document.getElementById("extractPath").value = path || "";
      if (!path) return;
      // Served relative extract → fetch and auto-fill the card from its content.
      if (/^https?:|^\//.test(path) || path.startsWith("data/")) {
        try {
          const res = await fetch(path);
          if (!res.ok) throw new Error("not found");
          const obj = await res.json();
          const opt = [...e.target.options].find((o) => o.value === path);
          applyExtractJson(
            obj,
            opt ? opt.textContent.replace(/\s*\(extract\)$/, "") : "",
          );
          importInfo("Card filled from extract — review, then Generate Card.");
        } catch {
          importInfo("Could not load that extract from the server.", true);
        }
      }
    });

  /* ---------- Build from PPTX / DOCX / _EXTRACT.json (in-browser) ---------- */
  function importInfo(msg, isErr) {
    const s = document.getElementById("importStatus");
    if (!s) return;
    s.hidden = false;
    s.textContent = msg;
    s.style.color = isErr ? "#c2410c" : "";
  }
  function decodeXml(s) {
    return s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"');
  }
  async function pptxText(buf) {
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => +a.match(/(\d+)/)[1] - +b.match(/(\d+)/)[1]);
    const out = [];
    for (const n of names) {
      const xml = await zip.files[n].async("string");
      out.push(
        [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
          .map((m) => decodeXml(m[1]))
          .join(" "),
      );
    }
    return out.join("\n");
  }
  async function docxText(buf) {
    const zip = await JSZip.loadAsync(buf);
    const f = zip.files["word/document.xml"];
    if (!f) return "";
    const xml = await f.async("string");
    return xml
      .split(/<\/w:p>/)
      .map((p) =>
        [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
          .map((m) => decodeXml(m[1]))
          .join(""),
      )
      .join("\n");
  }
  const STD_GUESS = {
    geometry: "6.G.A.1",
    statistics: "6.SP.A.1",
    ratio: "6.RP.A.1",
    ratios: "6.RP.A.1",
    rate: "6.RP.A.2",
    percent: "6.RP.A.3",
    expressions: "6.EE.A.2",
    equations: "6.EE.B.7",
    number: "6.NS.A.1",
    fractions: "6.NS.A.1",
  };
  function titleCase(s) {
    return String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function applyExtractJson(obj, label) {
    const sc = obj.scenario_extract || obj;
    const s = sc.session1 || sc.session2 || sc;
    const lt = (s.lesson_type || "").toLowerCase();
    const skill = s.dv_name
      ? "find the " + s.dv_name
      : Array.isArray(s.math_actions)
        ? s.math_actions.slice(0, 2).join(" and ")
        : "";
    const theme = s.context || "";
    const d = {
      gradeLevel: "6",
      subject: "Math",
      unitTitle: lt ? titleCase(lt) : "",
      unitTheme: theme,
      lessonTitle:
        label || (obj.source && obj.source.title) || "Imported Lesson",
      standard: STD_GUESS[lt] || "",
      mainSkill: skill,
      lessonSummary: theme,
      studentSupportLevel: "standard",
      includeEsol: !!(
        s.content_fingerprint &&
        s.content_fingerprint.vocabulary_load === "high"
      ),
      outputMode: "html",
      includeReadiness: true,
    };
    setFormData(d);
    generateCard(false);
  }
  function deckToForm(text, filename) {
    const title = (filename || "")
      .replace(/\.(pptx|docx)$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b(editable|lesson|presentation|determine|\(\d+\))\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const m = text.match(
      /\b(find|calculate|solve|compare|determine|graph|write|evaluate|identify)\b[^.\n]{3,50}/i,
    );
    const d = {
      gradeLevel: "6",
      subject: "Math",
      lessonTitle: title || "Imported Lesson",
      mainSkill: m ? m[0].toLowerCase().trim() : "",
      unitTheme: text.slice(0, 160).replace(/\s+/g, " ").trim(),
      lessonSummary: text.slice(0, 220).replace(/\s+/g, " ").trim(),
      studentSupportLevel: "standard",
      outputMode: "html",
      includeReadiness: true,
    };
    setFormData(d);
    generateCard(false);
  }
  document.getElementById("deckFile").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    importInfo("Reading " + file.name + "…");
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith(".json")) {
        applyExtractJson(
          JSON.parse(await file.text()),
          file.name.replace(/_EXTRACT\.json$/i, "").replace(/\.json$/i, ""),
        );
        importInfo("Built the card from " + file.name + " — review and edit.");
      } else if (name.endsWith(".pptx")) {
        if (!window.JSZip) return importInfo("PPTX support unavailable.", true);
        deckToForm(await pptxText(await file.arrayBuffer()), file.name);
        importInfo(
          "Built a starting card from the slide text — review and edit, then Generate.",
        );
      } else if (name.endsWith(".docx")) {
        if (!window.JSZip) return importInfo("DOCX support unavailable.", true);
        deckToForm(await docxText(await file.arrayBuffer()), file.name);
        importInfo(
          "Built a starting card from the doc text — review and edit, then Generate.",
        );
      } else {
        importInfo("Use a .pptx, .docx, or _EXTRACT.json file.", true);
      }
    } catch (err) {
      importInfo("Could not read that file: " + err.message, true);
    }
    e.target.value = "";
  });

  document.getElementById("extractPath").addEventListener("input", (e) => {
    syncExtractSelect(e.target.value.trim());
  });

  document
    .getElementById("refreshManifestBtn")
    .addEventListener("click", () => {
      showToast("Run: ./pipeline.sh refresh");
    });

  function exportAllPresetsBundle() {
    const bundle = [];
    for (const [key, preset] of Object.entries(PRESETS)) {
      const lesson = buildLesson(preset, 0);
      bundle.push(JSON.parse(buildJsonLesson(lesson)));
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presets-bundle.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      "Downloaded presets-bundle.json — also run: ./pipeline.sh export-presets",
    );
  }

  document
    .getElementById("exportAllPresetsBtn")
    .addEventListener("click", exportAllPresetsBundle);

  async function loadPresets() {
    try {
      const res = await fetch("presets.json");
      if (res.ok) PRESETS = await res.json();
    } catch {
      // inline fallback above
    }
  }

  loadPresets().then(loadExtractManifest);
})();
