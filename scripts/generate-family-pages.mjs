import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonDirPattern = /^(\d+)-(\d+)(-flagship)?$/;
const launchManifestPath = join(root, "data", "curriculum-launch-manifest.json");

function loadCanonicalLessons() {
  if (!existsSync(launchManifestPath)) return new Map();
  const manifest = JSON.parse(readFileSync(launchManifestPath, "utf8"));
  return new Map((manifest.lessons || []).map((lesson) => [lesson.id, lesson]));
}

const CANONICAL_LESSONS = loadCanonicalLessons();

const UNIT_THEMES = {
  1: {
    name: "Number System Launch",
    blurb:
      "Factors, multiples, and decimal operations that help students talk clearly about numbers.",
  },
  2: {
    name: "Fraction Detective Agency",
    blurb: "Dividing fractions and mixed numbers with models, stories, and careful reasoning.",
  },
  3: {
    name: "Culinary Academy",
    blurb: "Ratios and ratio reasoning through recipes, comparisons, and shared quantities.",
  },
  4: {
    name: "Arcade Builder",
    blurb: "Rates, unit rates, and percents for shopping, games, speed, and decisions.",
  },
  5: {
    name: "Architecture Firm",
    blurb: "Area of polygons and composite figures using formulas, drawings, and labels.",
  },
  6: {
    name: "Music Studio",
    blurb:
      "Expressions, exponents, and properties that describe patterns and repeated calculations.",
  },
  7: {
    name: "Equation Detective Agency",
    blurb: "Equations and inequalities that help students represent unknowns and solve fairly.",
  },
  8: {
    name: "Sports Analytics Lab",
    blurb: "Statistics and data displays that help students summarize and compare information.",
  },
  9: {
    name: "Treasure Map Navigator",
    blurb: "Integers and the coordinate plane for direction, distance, and location.",
  },
  10: {
    name: "Time Capsule Engineers",
    blurb: "Volume and surface area for boxes, packages, containers, and designs.",
  },
};

const TOPIC_FALLBACK_VOCAB = {
  "Ratios, rates, and percents": [
    [
      "ratio",
      "razón",
      "A comparison of two quantities.",
      "2 cups of juice for every 3 cups of water",
    ],
    ["rate", "tasa", "A ratio that compares two different units.", "60 miles in 2 hours"],
    ["unit rate", "tasa unitaria", "A rate for one unit.", "$3 for 1 notebook"],
    ["percent", "porcentaje", "A number out of 100.", "25% means 25 out of 100"],
  ],
  Geometry: [
    ["area", "área", "The amount of flat space inside a shape.", "A rug covers 24 square feet"],
    ["base", "base", "A side used to measure a shape.", "The bottom side of a triangle"],
    ["height", "altura", "The straight distance from base to top.", "The height is 6 cm"],
    ["formula", "fórmula", "A rule that helps calculate a value.", "A = base x height"],
  ],
  "Expressions and equations": [
    [
      "variable",
      "variable",
      "A letter that stands for a number.",
      "x can stand for the missing value",
    ],
    [
      "expression",
      "expresión",
      "Numbers, variables, and operations without an equal sign.",
      "3x + 4",
    ],
    ["equation", "ecuación", "A math sentence with an equal sign.", "x + 5 = 12"],
    ["solution", "solución", "A value that makes an equation true.", "x = 7"],
  ],
  "Statistics and data": [
    [
      "data",
      "datos",
      "Information collected to answer a question.",
      "Survey answers from classmates",
    ],
    [
      "frequency",
      "frecuencia",
      "How many times a value or group appears.",
      "Six students chose soccer",
    ],
    [
      "distribution",
      "distribución",
      "The shape or spread of a data set.",
      "Most scores are near 80",
    ],
    [
      "display",
      "representación",
      "A graph or plot that organizes data.",
      "A histogram or dot plot",
    ],
  ],
  "Integers and coordinate plane": [
    ["integer", "entero", "A whole number, its opposite, or zero.", "-3, 0, and 5"],
    [
      "opposite",
      "opuesto",
      "A number the same distance from zero in the other direction.",
      "-4 and 4",
    ],
    ["coordinate", "coordenada", "A number that shows a location on a graph.", "(2, -3)"],
    ["absolute value", "valor absoluto", "A number's distance from zero.", "|-6| = 6"],
  ],
  "Number system": [
    ["factor", "factor", "A number that divides another number evenly.", "3 is a factor of 12"],
    [
      "multiple",
      "múltiplo",
      "The product of a number and a whole number.",
      "20 is a multiple of 5",
    ],
    ["quotient", "cociente", "The answer to a division problem.", "18 / 3 = 6"],
    ["decimal", "decimal", "A number with digits to the right of a decimal point.", "4.75"],
  ],
  "Grade 6 math": [
    ["strategy", "estrategia", "A plan for solving a problem.", "Draw a model first"],
    [
      "model",
      "modelo",
      "A picture, table, or equation that shows math thinking.",
      "A tape diagram",
    ],
    ["estimate", "estimar", "A reasonable answer before calculating exactly.", "About 50"],
    ["explain", "explicar", "Tell why an answer makes sense.", "Use words and numbers"],
  ],
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripObjective(objective) {
  return String(objective || "")
    .replace(/^I can\s+/i, "")
    .replace(/\.$/, "");
}

function textFromMaybe(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFromMaybe).find(Boolean) || "";
  if (typeof value === "object") {
    return (
      textFromMaybe(value.text) ||
      textFromMaybe(value.label) ||
      textFromMaybe(value.caption) ||
      textFromMaybe(value.description) ||
      textFromMaybe(value.alt)
    );
  }
  return String(value);
}

function mainSkill(lesson) {
  const objective = stripObjective(lesson.objective).trim();
  const genericObjectives = new Set(["explain my math thinking", "i can explain my math thinking"]);
  if (!objective || genericObjectives.has(objective.toLowerCase())) {
    return `the skill from this lesson: ${lesson.title.toLowerCase()}`;
  }
  return objective.toLowerCase();
}

function spanishSkill(lesson) {
  const topic = String(lesson.topic || "").toLowerCase();
  if (topic.includes("number system")) return "usar números con cuidado y explicar sus pasos";
  if (topic.includes("ratios") || topic.includes("rates") || topic.includes("percent"))
    return "comparar cantidades y explicar relaciones";
  if (topic.includes("geometry")) return "medir y resolver problemas de geometría";
  if (topic.includes("expressions") || topic.includes("equations"))
    return "usar letras, números y reglas para resolver problemas";
  if (topic.includes("statistics") || topic.includes("data"))
    return "leer datos, hacer gráficas y explicar patrones";
  if (topic.includes("integers"))
    return "usar números positivos y negativos en una recta numérica o plano";
  return "resolver problemas y explicar su pensamiento";
}

function lessonSort(a, b) {
  const [, au, al, af] = a.match(lessonDirPattern);
  const [, bu, bl, bf] = b.match(lessonDirPattern);
  return Number(au) - Number(bu) || Number(al) - Number(bl) || (af ? 1 : 0) - (bf ? 1 : 0);
}

function topicFor(config) {
  const title = String(config.title || "").toLowerCase();
  const standard = String(config.standard || "");
  if (standard.startsWith("6.RP") || /ratio|rate|percent|proportion/.test(title))
    return "Ratios, rates, and percents";
  if (
    standard.startsWith("6.G") ||
    /area|volume|surface|polygon|triangle|quadrilateral|net/.test(title)
  )
    return "Geometry";
  if (
    standard.startsWith("6.EE") ||
    /equation|inequal|expression|exponent|property|variable/.test(title)
  )
    return "Expressions and equations";
  if (
    standard.startsWith("6.SP") ||
    /data|histogram|box|dot|mean|median|statistic|quartile|variability/.test(title)
  )
    return "Statistics and data";
  if (
    standard.startsWith("6.NS") &&
    /integer|coordinate|opposite|absolute|plane|negative|positive/.test(title)
  )
    return "Integers and coordinate plane";
  if (
    standard.startsWith("6.NS") ||
    /fraction|decimal|factor|multiple|divide|division|quotient/.test(title)
  )
    return "Number system";
  return "Grade 6 math";
}

function resourcesFor(lessonId, canonicalLesson) {
  const safeLabels = {
    lesson: "Interactive Lesson",
    guidedNotes: "Guided Notes",
    handout: "Practice Handout",
    homework: "Homework Practice",
    studentHelp: "Student Help",
    exitTicket: "Check Understanding",
  };
  if (canonicalLesson?.resources) {
    return Object.entries(safeLabels)
      .map(([key, label]) => ({ label, href: canonicalLesson.resources[key] }))
      .filter(
        (resource) => typeof resource.href === "string" && resource.href.startsWith("/lessons/"),
      );
  }
  const base = join(root, "lessons", lessonId);
  const candidates = [
    ["Interactive Lesson", `/lessons/${lessonId}/`, join(base, "index.html")],
    ["Guided Notes", `/lessons/${lessonId}/notes.html`, join(base, "notes.html")],
    [
      "Notes PDF",
      `/lessons/${lessonId}/downloads/${lessonId}-notes.pdf`,
      join(base, "downloads", `${lessonId}-notes.pdf`),
    ],
    [
      "Notes DOCX",
      `/lessons/${lessonId}/downloads/${lessonId}-notes.docx`,
      join(base, "downloads", `${lessonId}-notes.docx`),
    ],
    ["Homework", `/lessons/${lessonId}/homework.docx`, join(base, "homework.docx")],
  ];
  return candidates
    .filter(([, , filePath]) => existsSync(filePath))
    .map(([label, href]) => ({ label, href }));
}

function normalizeVocabulary(config, topic) {
  const source = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  const terms = source
    .map((item) => ({
      term: textFromMaybe(item.term || item.word || item.name),
      termEs: textFromMaybe(item.termEs || item.spanish || item.translation),
      definition: textFromMaybe(item.definition || item.meaning),
      example: textFromMaybe(item.example) || textFromMaybe(item.examples),
    }))
    .filter((item) => item.term && item.definition)
    .slice(0, 6);

  const fallback = TOPIC_FALLBACK_VOCAB[topic] || TOPIC_FALLBACK_VOCAB["Grade 6 math"];
  for (const [term, termEs, definition, example] of fallback) {
    if (terms.length >= 4) break;
    if (terms.some((item) => item.term.toLowerCase() === term.toLowerCase())) continue;
    terms.push({ term, termEs, definition, example });
  }

  return terms.slice(0, 6).map((item) => ({
    term: textFromMaybe(item.term),
    termEs: textFromMaybe(item.termEs) || textFromMaybe(item.term),
    definition: textFromMaybe(item.definition),
    example: textFromMaybe(item.example),
  }));
}

function practiceFor(config, topic) {
  const title = String(config.title || "").toLowerCase();
  if (/prime|factor/.test(title)) {
    return [
      ["Make a factor tree for 36.", "36 = 2 x 2 x 3 x 3"],
      ["List all factors of 24.", "1, 2, 3, 4, 6, 8, 12, 24"],
      ["Is 29 prime or composite? How do you know?", "Prime; only 1 and 29 divide it evenly."],
      ["What is the greatest common factor of 18 and 30?", "6"],
    ];
  }
  if (/triangle/.test(title)) {
    return [
      ["A triangle has base 8 cm and height 5 cm. What is its area?", "20 square centimeters"],
      ["A triangle has area 18 square units and base 6 units. What is its height?", "6 units"],
      [
        "Why do we multiply by 1/2 when finding triangle area?",
        "A triangle is half of a related rectangle or parallelogram.",
      ],
      [
        "Draw a triangle and label a base and height.",
        "Answers vary; height should be perpendicular to the base.",
      ],
    ];
  }
  if (/histogram/.test(title)) {
    return [
      [
        "A histogram interval 10-19 has frequency 6. What does that mean?",
        "Six data values are from 10 through 19.",
      ],
      [
        "Make intervals of width 5 from 0 to 20.",
        "0-4, 5-9, 10-14, 15-19, 20-24 or similar consistent groups",
      ],
      ["Which interval has the most data: 0-9 has 3, 10-19 has 8, 20-29 has 5?", "10-19"],
      [
        "Why do histograms use intervals?",
        "They group many numbers so patterns are easier to see.",
      ],
    ];
  }
  if (topic === "Ratios, rates, and percents") {
    return [
      ["There are 2 red tiles for every 3 blue tiles. Write the ratio of red to blue.", "2:3"],
      ["A pack of 4 pens costs $8. What is the cost for 1 pen?", "$2"],
      ["What is 25% of 40?", "10"],
      ["A recipe uses 3 cups of flour for 12 cookies. How much flour for 24 cookies?", "6 cups"],
    ];
  }
  if (topic === "Geometry") {
    return [
      ["A rectangle is 7 ft by 4 ft. What is its area?", "28 square feet"],
      ["A parallelogram has base 9 cm and height 3 cm. What is its area?", "27 square centimeters"],
      [
        "Name two units that could measure area.",
        "Square inches, square feet, square centimeters, or similar",
      ],
      [
        "Why is labeling units helpful?",
        "It shows what the number measures and helps catch mistakes.",
      ],
    ];
  }
  if (topic === "Expressions and equations") {
    return [
      ["Evaluate 3x + 2 when x = 4.", "14"],
      ["Solve x + 6 = 15.", "x = 9"],
      ["Write an expression for 5 more than a number n.", "n + 5"],
      ["Is y = 3 a solution to y + 4 = 7?", "Yes"],
    ];
  }
  if (topic === "Statistics and data") {
    return [
      ["Find the mean of 4, 6, 8, and 10.", "7"],
      ["Find the median of 3, 5, 9, 12, and 20.", "9"],
      ["A dot plot has four dots above 6. What does that mean?", "The value 6 appears four times."],
      [
        "Name one question data could help answer.",
        "Answers vary, such as which lunch is most popular.",
      ],
    ];
  }
  if (topic === "Integers and coordinate plane") {
    return [
      ["Which is greater: -2 or -7?", "-2"],
      ["What is the opposite of 9?", "-9"],
      ["What is |-5|?", "5"],
      ["Plotting (3, -2), do you move right or left first?", "Right 3, then down 2"],
    ];
  }
  return [
    ["Estimate first, then solve: 48 / 6.", "Estimate about 50 / 5 = 10; exact answer 8"],
    ["Explain one way to check an answer.", "Use the opposite operation, a model, or estimation."],
    ["Write a number story for 12 x 3.", "Answers vary; for example, 12 rows of 3 chairs."],
    [
      "What should you do if an answer seems too big or too small?",
      "Re-read the problem and check with an estimate.",
    ],
  ];
}

function learningText(lesson) {
  const skill = mainSkill(lesson);
  const phrase = skill.startsWith("the skill") ? skill : `how to ${skill}`;
  return `In this lesson, students practice ${phrase}. They learn to show their thinking with numbers, pictures, words, or a model. The goal is not just getting an answer. Students should be able to explain why the answer makes sense.`;
}

function whyText(topic) {
  if (topic === "Ratios, rates, and percents") {
    return "This math shows up in shopping, recipes, sports scores, speed, discounts, and comparing choices. It helps students decide what is fair, what is a better deal, and how quantities change together.";
  }
  if (topic === "Geometry") {
    return "Geometry helps with building, decorating, packing, maps, art, and design. Students use it when they plan space, compare shapes, or figure out how much material a project needs.";
  }
  if (topic === "Expressions and equations") {
    return "Expressions and equations help students describe patterns and missing numbers. This matters for planning, budgeting, games, coding, and solving everyday questions step by step.";
  }
  if (topic === "Statistics and data") {
    return "Data helps people make decisions. Students use these skills to read sports stats, compare survey results, notice patterns, and decide what a graph is really saying.";
  }
  if (topic === "Integers and coordinate plane") {
    return "Integers and coordinates are useful for temperatures, money, maps, elevators, games, and directions. They help students describe where something is and how far it is from zero.";
  }
  return "This skill supports everyday problem solving with money, measurements, games, planning, and checking whether an answer is reasonable.";
}

function classText(_lesson) {
  return `Your child may use the interactive lesson, guided notes, examples from the board, partner talk, and short practice problems. They may be asked to solve, draw a model, label important numbers, and explain their reasoning in a sentence.`;
}

function homeText() {
  return "You do not need to teach a new method. Ask your child to read the problem out loud, circle the important numbers, and explain what they tried first. Helpful questions include: What do you know? What are you trying to find? Does your answer make sense?";
}

function spanishLearning(lesson) {
  return `En esta lección, su hijo/a practica ${spanishSkill(lesson)}. Puede usar dibujos, números, palabras o modelos para mostrar su pensamiento. Lo más importante es que pueda explicar por qué su respuesta tiene sentido.`;
}

function spanishWhy(topic) {
  if (topic === "Ratios, rates, and percents")
    return "Esta matemática aparece en recetas, compras, deportes, descuentos y comparaciones. Ayuda a los estudiantes a decidir qué es justo o cuál opción conviene más.";
  if (topic === "Geometry")
    return "La geometría se usa para construir, decorar, empacar, leer mapas y diseñar. Ayuda a planear espacios y calcular materiales.";
  if (topic === "Expressions and equations")
    return "Las expresiones y ecuaciones ayudan a describir patrones y números desconocidos. Son útiles para planear, presupuestar y resolver problemas paso a paso.";
  if (topic === "Statistics and data")
    return "Los datos ayudan a tomar decisiones. Su hijo/a aprende a leer gráficas, comparar resultados y explicar patrones.";
  if (topic === "Integers and coordinate plane")
    return "Los enteros y las coordenadas se usan con temperaturas, dinero, mapas, elevadores y juegos. Ayudan a describir ubicación y distancia.";
  return "Esta habilidad ayuda con dinero, medidas, juegos, planificación y con revisar si una respuesta es razonable.";
}

function spanishHome() {
  return "No necesita ser experto/a en matemáticas. Pídale a su hijo/a que lea el problema en voz alta, marque los números importantes y explique su primer paso. Puede preguntar: ¿Qué sabes? ¿Qué necesitas encontrar? ¿Tu respuesta tiene sentido?";
}

function buildLessonRecords() {
  const lessonsRoot = join(root, "lessons");
  return readdirSync(lessonsRoot)
    .filter((entry) => lessonDirPattern.test(entry))
    .filter((entry) => existsSync(join(lessonsRoot, entry, "config.json")))
    .sort(lessonSort)
    .map((lessonId) => {
      const config = JSON.parse(readFileSync(join(lessonsRoot, lessonId, "config.json"), "utf8"));
      const canonical = CANONICAL_LESSONS.get(lessonId);
      const lessonSource = canonical ? { ...config, ...canonical } : config;
      const unit = Number(lessonSource.unit || lessonId.match(lessonDirPattern)[1]);
      const unitInfo = UNIT_THEMES[unit] || {
        name: `Unit ${unit}`,
        blurb: "Grade 6 math practice and support.",
      };
      const topic = topicFor(lessonSource);
      const isFlagship = lessonId.endsWith("-flagship") || Boolean(lessonSource.flagship);
      return {
        lessonId,
        unit,
        lesson: Number(lessonSource.lesson || lessonId.match(lessonDirPattern)[2]),
        title: lessonSource.title || `Lesson ${lessonId}`,
        standard: lessonSource.standard || "Grade 6 Math",
        objective: lessonSource.objective || "I can explain my math thinking.",
        languageObjective:
          lessonSource.languageObjective ||
          "I can explain my strategy using math words and evidence.",
        unitName: unitInfo.name,
        unitBlurb: unitInfo.blurb,
        topic,
        isFlagship,
        ...(isFlagship ? { variantLabel: "Flagship / Enrichment Version" } : {}),
        resources: resourcesFor(lessonId, canonical),
        vocabulary: normalizeVocabulary(config, topic),
        practice: practiceFor(lessonSource, topic).map(([prompt, answer]) => ({ prompt, answer })),
      };
    });
}

function resourceLinks(resources, className = "resource-list") {
  if (!resources.length)
    return `<p class="muted">No linked classroom resources are available for this lesson yet.</p>`;
  return `<div class="${className}">${resources
    .map((resource) => `<a href="${esc(resource.href)}">${esc(resource.label)}</a>`)
    .join("")}</div>`;
}

function renderIndex(lessons) {
  const units = [...new Map(lessons.map((lesson) => [lesson.unit, lesson])).values()].sort(
    (a, b) => a.unit - b.unit,
  );
  const topics = [...new Set(lessons.map((lesson) => lesson.topic))].sort();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Family Math Support</title>
  <style>
    :root {
      --ink: #1f2933;
      --muted: #52606d;
      --line: #d7dee7;
      --paper: #fffaf0;
      --surface: #ffffff;
      --teal: #0f766e;
      --blue: #1d4ed8;
      --amber: #b45309;
      --rose: #be123c;
      --shadow: 0 14px 30px rgba(31, 41, 51, 0.08);
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--paper); line-height: 1.55; }
    a { color: inherit; }
    .topbar { background: #12343b; color: #fff; }
    .topbar-inner { max-width: 1180px; margin: 0 auto; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .topbar a { color: #fff; text-decoration: none; font-weight: 700; }
    main { max-width: 1180px; margin: 0 auto; padding: 34px 20px 56px; }
    .hero { display: grid; gap: 14px; margin-bottom: 24px; }
    .eyebrow { color: var(--teal); font-weight: 800; text-transform: uppercase; font-size: 0.78rem; }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 4rem); line-height: 1.02; }
    .subtitle { margin: 0; max-width: 760px; font-size: 1.2rem; color: #334e68; }
    .intro { max-width: 860px; color: var(--muted); margin: 0; }
    .controls { display: grid; grid-template-columns: minmax(220px, 1fr) repeat(2, minmax(180px, 240px)); gap: 12px; margin: 28px 0; align-items: end; }
    label { display: grid; gap: 6px; color: #334e68; font-weight: 800; font-size: 0.92rem; }
    input, select { width: 100%; min-height: 46px; border: 2px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink); padding: 10px 12px; font: inherit; }
    input:focus, select:focus, a:focus-visible { outline: 3px solid rgba(15, 118, 110, 0.3); outline-offset: 2px; }
    .unit-section { border-top: 3px solid #12343b; padding-top: 22px; margin-top: 34px; }
    .unit-heading { display: flex; justify-content: space-between; gap: 18px; align-items: end; margin-bottom: 16px; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 1.6rem; }
    .unit-heading p { margin: 4px 0 0; color: var(--muted); max-width: 760px; }
    .count { color: var(--amber); font-weight: 900; }
    .lesson-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .lesson-card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 16px; box-shadow: var(--shadow); display: grid; gap: 10px; }
    .meta-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .lesson-id { color: var(--blue); font-weight: 900; }
    .standard { color: var(--rose); font-weight: 800; font-size: 0.88rem; }
    h3 { margin: 0; font-size: 1.15rem; line-height: 1.2; }
    .objective { margin: 0; color: var(--muted); }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge { border: 1px solid var(--line); border-radius: 999px; padding: 3px 8px; color: #334e68; font-size: 0.8rem; font-weight: 800; background: #f8fafc; }
    .badge.flagship { border-color: #f59e0b; color: #92400e; background: #fffbeb; }
    .open-button { justify-self: start; background: var(--teal); color: #fff; text-decoration: none; font-weight: 900; padding: 9px 12px; border-radius: 8px; }
    .hidden { display: none; }
    .empty { background: #fff; border: 2px dashed var(--line); border-radius: 8px; padding: 20px; color: var(--muted); }
    @media (max-width: 760px) {
      .controls { grid-template-columns: 1fr; }
      main { padding-top: 24px; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <strong>Mr. Neft's Grade 6 Math</strong>
      <a href="/curriculum/">Curriculum Hub</a>
    </div>
  </header>
  <main>
    <section class="hero" aria-labelledby="page-title">
      <div class="eyebrow">Family and guardian guide</div>
      <h1 id="page-title">Family Math Support</h1>
      <p class="subtitle">Grade 6 Math help for families, parents, and guardians.</p>
      <p class="intro">Use this page to see what each lesson is about, open the same class resources students use, and find a few calm ways to help at home. The explanations are written for busy families, not math experts.</p>
    </section>

    <section class="controls" aria-label="Find family support lessons">
      <label for="family-search">Search by lesson, skill, or standard
        <input id="family-search" type="search" placeholder="Try area, ratios, 6.SP.4, or 8-6">
      </label>
      <label for="unit-filter">Unit
        <select id="unit-filter">
          <option value="all">All units</option>
          ${units.map((unit) => `<option value="${unit.unit}">Unit ${unit.unit}: ${esc(unit.unitName)}</option>`).join("\n          ")}
        </select>
      </label>
      <label for="topic-filter">Topic
        <select id="topic-filter">
          <option value="all">All topics</option>
          ${topics.map((topic) => `<option value="${esc(topic)}">${esc(topic)}</option>`).join("\n          ")}
        </select>
      </label>
    </section>

    <p id="empty-message" class="empty hidden">No lessons match those filters yet. Try a shorter search or choose all units and topics.</p>

    ${units
      .map((unit) => {
        const unitLessons = lessons.filter((lesson) => lesson.unit === unit.unit);
        return `<section class="unit-section" data-unit-section="${unit.unit}">
      <div class="unit-heading">
        <div>
          <h2>Unit ${unit.unit}: ${esc(unit.unitName)}</h2>
          <p>${esc(unit.unitBlurb)}</p>
        </div>
        <span class="count">${unitLessons.length} lessons</span>
      </div>
      <div class="lesson-grid">
        ${unitLessons
          .map(
            (
              lesson,
            ) => `<article class="lesson-card" data-lesson-card data-unit="${lesson.unit}" data-topic="${esc(lesson.topic)}" data-search="${esc(`${lesson.lessonId} ${lesson.title} ${lesson.standard} ${lesson.objective} ${lesson.topic}`.toLowerCase())}">
          <div class="meta-row">
            <span class="lesson-id">Lesson ${esc(lesson.lessonId)}</span>
            <span class="standard">${esc(lesson.standard)}</span>
          </div>
          <h3>${esc(lesson.title)}</h3>
          <p class="objective">${esc(lesson.objective)}</p>
          <div class="badges" aria-label="Available resources">
            ${lesson.isFlagship ? `<span class="badge flagship">Flagship / Enrichment Version</span>` : ""}
            ${lesson.resources.map((resource) => `<span class="badge">${esc(resource.label)}</span>`).join("")}
          </div>
          <a class="open-button" href="/families/lessons/${esc(lesson.lessonId)}/">Open family guide</a>
        </article>`,
          )
          .join("\n        ")}
      </div>
    </section>`;
      })
      .join("\n\n    ")}
  </main>
  <script>
    const searchInput = document.querySelector("#family-search");
    const unitFilter = document.querySelector("#unit-filter");
    const topicFilter = document.querySelector("#topic-filter");
    const cards = [...document.querySelectorAll("[data-lesson-card]")];
    const sections = [...document.querySelectorAll("[data-unit-section]")];
    const empty = document.querySelector("#empty-message");

    function applyFilters() {
      const query = searchInput.value.trim().toLowerCase();
      const unit = unitFilter.value;
      const topic = topicFilter.value;
      let visibleCount = 0;

      for (const card of cards) {
        const matchesQuery = !query || card.dataset.search.includes(query);
        const matchesUnit = unit === "all" || card.dataset.unit === unit;
        const matchesTopic = topic === "all" || card.dataset.topic === topic;
        const isVisible = matchesQuery && matchesUnit && matchesTopic;
        card.classList.toggle("hidden", !isVisible);
        if (isVisible) visibleCount += 1;
      }

      for (const section of sections) {
        const hasVisibleCard = [...section.querySelectorAll("[data-lesson-card]")].some((card) => !card.classList.contains("hidden"));
        section.classList.toggle("hidden", !hasVisibleCard);
      }
      empty.classList.toggle("hidden", visibleCount !== 0);
    }

    searchInput.addEventListener("input", applyFilters);
    unitFilter.addEventListener("change", applyFilters);
    topicFilter.addEventListener("change", applyFilters);
  </script>
</body>
</html>
`;
}

function renderLessonPage(lesson) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(lesson.lessonId)} Family Guide | ${esc(lesson.title)}</title>
  <style>
    :root {
      --ink: #1f2933;
      --muted: #52606d;
      --line: #d7dee7;
      --paper: #fffaf0;
      --surface: #ffffff;
      --teal: #0f766e;
      --blue: #1d4ed8;
      --amber: #b45309;
      --rose: #be123c;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--paper); line-height: 1.6; }
    a { color: inherit; }
    .topbar { background: #12343b; color: #fff; }
    .topbar-inner { max-width: 980px; margin: 0 auto; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .topbar a { color: #fff; text-decoration: none; font-weight: 800; }
    main { max-width: 980px; margin: 0 auto; padding: 30px 20px 58px; }
    .lesson-hero { display: grid; gap: 14px; padding-bottom: 24px; border-bottom: 3px solid #12343b; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill { display: inline-flex; align-items: center; min-height: 30px; border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; background: #fff; font-weight: 900; color: #334e68; }
    .pill.standard { color: var(--rose); }
    .pill.flagship { color: #92400e; background: #fffbeb; border-color: #f59e0b; }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; }
    .objective { margin: 0; max-width: 820px; font-size: 1.15rem; color: #334e68; font-weight: 700; }
    .language-goal { margin: 0; max-width: 820px; color: var(--muted); }
    .resource-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .resource-list a { background: var(--teal); color: #fff; text-decoration: none; font-weight: 900; padding: 9px 12px; border-radius: 8px; }
    .resource-list a:nth-child(2n) { background: var(--blue); }
    .resource-list a:nth-child(3n) { background: var(--amber); }
    section { padding: 24px 0; border-bottom: 1px solid var(--line); }
    h2 { margin: 0 0 10px; font-size: 1.55rem; line-height: 1.2; }
    h3 { margin: 18px 0 8px; font-size: 1.12rem; color: #12343b; }
    p { margin: 0 0 10px; }
    .muted { color: var(--muted); }
    .vocab-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
    .vocab-card, .practice-item { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
    .vocab-card strong { display: block; color: var(--blue); font-size: 1.03rem; }
    .translation { color: var(--rose); font-weight: 800; }
    ol { padding-left: 22px; margin-bottom: 0; }
    li { margin-bottom: 12px; }
    details { margin-top: 8px; }
    summary { cursor: pointer; font-weight: 900; color: var(--teal); }
    .back-link { display: inline-block; margin-bottom: 18px; color: #12343b; font-weight: 900; text-decoration: none; }
    a:focus-visible, summary:focus-visible { outline: 3px solid rgba(15, 118, 110, 0.3); outline-offset: 2px; }
    @media (max-width: 640px) {
      main { padding-top: 22px; }
      .resource-list a { width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <strong>Family Math Support</strong>
      <a href="/families/">All family guides</a>
    </div>
  </header>
  <main>
    <a class="back-link" href="/families/">Back to family guides</a>
    <header class="lesson-hero">
      <div class="meta">
        <span class="pill">Unit ${esc(lesson.unit)}: ${esc(lesson.unitName)}</span>
        <span class="pill">Lesson ${esc(lesson.lessonId)}</span>
        <span class="pill standard">${esc(lesson.standard)}</span>
        ${lesson.isFlagship ? `<span class="pill flagship">Flagship / Enrichment Version</span>` : ""}
      </div>
      <h1>${esc(lesson.title)}</h1>
      <p class="objective">${esc(lesson.objective)}</p>
      <p class="language-goal"><strong>Speaking and writing goal:</strong> ${esc(lesson.languageObjective)}</p>
      ${resourceLinks(lesson.resources)}
    </header>

    <section>
      <h2>What Your Child Is Learning</h2>
      <p>${esc(learningText(lesson))}</p>
    </section>

    <section>
      <h2>Why This Matters</h2>
      <p>${esc(whyText(lesson.topic))}</p>
    </section>

    <section>
      <h2>What It May Look Like In Class</h2>
      <p>${esc(classText(lesson))}</p>
    </section>

    <section>
      <h2>How You Can Help At Home</h2>
      <p>${esc(homeText())}</p>
    </section>

    <section lang="es">
      <h2>Apoyo para familias en español</h2>
      <h3>Qué está aprendiendo su hijo/a</h3>
      <p>${esc(spanishLearning(lesson))}</p>
      <h3>Por qué es importante</h3>
      <p>${esc(spanishWhy(lesson.topic))}</p>
      <h3>Cómo puede ayudar en casa</h3>
      <p>${esc(spanishHome())}</p>
    </section>

    <section>
      <h2>Key Vocabulary</h2>
      <div class="vocab-grid">
        ${lesson.vocabulary
          .map(
            (item) => `<article class="vocab-card">
          <strong>${esc(item.term)}</strong>
          <span class="translation">${esc(item.termEs)}</span>
          <p>${esc(item.definition)}</p>${
            item.example ? `\n          <p class="muted">Example: ${esc(item.example)}</p>` : ""
          }
        </article>`,
          )
          .join("\n        ")}
      </div>
    </section>

    <section>
      <h2>Try It Together</h2>
      <p class="muted">Pick one or two problems. Let your child explain the first step before opening the answer.</p>
      <ol>
        ${lesson.practice
          .map(
            (item) => `<li class="practice-item">
          ${esc(item.prompt)}
          <details>
            <summary>Show answer</summary>
            <p>${esc(item.answer)}</p>
          </details>
        </li>`,
          )
          .join("\n        ")}
      </ol>
    </section>
  </main>
</body>
</html>
`;
}

const lessons = buildLessonRecords();

mkdirSync(join(root, "src", "data"), { recursive: true });
writeFileSync(
  join(root, "src", "data", "family-lessons.json"),
  `${JSON.stringify(lessons, null, 2)}\n`,
);

mkdirSync(join(root, "families"), { recursive: true });
writeFileSync(join(root, "families", "index.html"), renderIndex(lessons));

for (const lesson of lessons) {
  const lessonDir = join(root, "families", "lessons", lesson.lessonId);
  mkdirSync(lessonDir, { recursive: true });
  writeFileSync(join(lessonDir, "index.html"), renderLessonPage(lesson));
}

console.log(`Generated family support pages for ${lessons.length} lessons.`);
