/* ==========================================================================
   Neft Teacher — Intervention Pre/Post Quiz Form generator (Google Apps Script)

   WHAT IT DOES
   Creates, for every intervention topic, FOUR Google Forms:
     • Pre-Quiz (Student)   — clean auto-graded quiz students take BEFORE
     • Pre-Quiz (Teacher)   — same items + visible answer key (master)
     • Post-Quiz (Student)  — auto-graded quiz students take AFTER
     • Post-Quiz (Teacher)  — same items + visible answer key (master)
   All are quizzes (auto-graded, 1 pt/question) and collect the student name.

   HOW TO RUN
   1. Go to https://script.google.com  →  New project.
   2. Paste this whole file in (replace Code.gs contents).
   3. (Optional) edit FOLDER_NAME below.
   4. Run  ->  createAllInterventionForms  ->  authorize when prompted.
   5. Open  View > Logs (or Executions).  Copy the printed forms-links.js block
      into  math/intervention/assets/forms-links.js , commit, and push.

   This file is GENERATED from scripts/intervention/data.mjs — do not hand-edit;
   re-run  node scripts/intervention/build-forms.mjs  instead.
   ========================================================================== */

var FOLDER_NAME = "Neft Teacher — Math Intervention Quizzes";

var QUIZ_DATA = {
  "mult-div-fluency": {
    "title": "Multiplication & Division Fluency",
    "pre": [
      {
        "q": "9 × 7 = ?",
        "answer": "63",
        "options": [
          "63",
          "56",
          "72",
          "54"
        ]
      },
      {
        "q": "8 × 6 = ?",
        "answer": "48",
        "options": [
          "48",
          "42",
          "54",
          "56"
        ]
      },
      {
        "q": "72 ÷ 8 = ?",
        "answer": "9",
        "options": [
          "9",
          "8",
          "7",
          "6"
        ]
      },
      {
        "q": "34 × 5 = ?",
        "answer": "170",
        "options": [
          "170",
          "150",
          "175",
          "160"
        ]
      },
      {
        "q": "96 ÷ 6 = ?",
        "answer": "16",
        "options": [
          "16",
          "15",
          "18",
          "14"
        ]
      },
      {
        "q": "11 × 12 = ?",
        "answer": "132",
        "options": [
          "132",
          "121",
          "122",
          "144"
        ]
      },
      {
        "q": "Estimate 58 × 41.",
        "answer": "2400",
        "options": [
          "2400",
          "2000",
          "1800",
          "3200"
        ]
      },
      {
        "q": "How many 6s are in 54?",
        "answer": "9",
        "options": [
          "9",
          "8",
          "7",
          "10"
        ]
      }
    ],
    "post": [
      {
        "q": "7 × 9 = ?",
        "answer": "63",
        "options": [
          "63",
          "54",
          "56",
          "72"
        ]
      },
      {
        "q": "6 × 12 = ?",
        "answer": "72",
        "options": [
          "72",
          "60",
          "66",
          "84"
        ]
      },
      {
        "q": "64 ÷ 8 = ?",
        "answer": "8",
        "options": [
          "8",
          "7",
          "9",
          "6"
        ]
      },
      {
        "q": "46 × 7 = ?",
        "answer": "322",
        "options": [
          "322",
          "312",
          "282",
          "332"
        ]
      },
      {
        "q": "132 ÷ 11 = ?",
        "answer": "12",
        "options": [
          "12",
          "11",
          "13",
          "14"
        ]
      },
      {
        "q": "125 × 8 = ?",
        "answer": "1000",
        "options": [
          "1000",
          "900",
          "1025",
          "1250"
        ]
      },
      {
        "q": "Estimate 78 × 19.",
        "answer": "1600",
        "options": [
          "1600",
          "1400",
          "1800",
          "800"
        ]
      },
      {
        "q": "864 ÷ 9 = ?",
        "answer": "96",
        "options": [
          "96",
          "95",
          "97",
          "86"
        ]
      }
    ]
  },
  "fraction-sense": {
    "title": "Fraction Sense",
    "pre": [
      {
        "q": "Which equals 2/4?",
        "answer": "1/2",
        "options": [
          "1/2",
          "2/3",
          "1/4",
          "3/4"
        ]
      },
      {
        "q": "1/5 + 2/5 = ?",
        "answer": "3/5",
        "options": [
          "3/5",
          "3/10",
          "2/5",
          "3/25"
        ]
      },
      {
        "q": "Simplify 4/8.",
        "answer": "1/2",
        "options": [
          "1/2",
          "2/8",
          "4/4",
          "1/4"
        ]
      },
      {
        "q": "Which is larger: 1/2 or 1/3?",
        "answer": "1/2",
        "options": [
          "1/2",
          "1/3",
          "equal",
          "can't tell"
        ]
      },
      {
        "q": "3/4 − 1/4 = ?",
        "answer": "1/2",
        "options": [
          "1/2",
          "2/0",
          "1/4",
          "4/4"
        ]
      },
      {
        "q": "1/2 of 8 = ?",
        "answer": "4",
        "options": [
          "4",
          "2",
          "16",
          "6"
        ]
      },
      {
        "q": "1/3 × 1/2 = ?",
        "answer": "1/6",
        "options": [
          "1/6",
          "1/5",
          "2/6",
          "1/3"
        ]
      },
      {
        "q": "Write 6/10 simplest.",
        "answer": "3/5",
        "options": [
          "3/5",
          "6/10",
          "1/2",
          "2/5"
        ]
      }
    ],
    "post": [
      {
        "q": "Which equals 3/9?",
        "answer": "1/3",
        "options": [
          "1/3",
          "3/6",
          "1/9",
          "2/3"
        ]
      },
      {
        "q": "1/4 + 3/8 = ?",
        "answer": "5/8",
        "options": [
          "5/8",
          "4/12",
          "1/2",
          "4/8"
        ]
      },
      {
        "q": "2/3 × 3/5 = ?",
        "answer": "2/5",
        "options": [
          "2/5",
          "6/15",
          "5/8",
          "2/8"
        ]
      },
      {
        "q": "3/4 ÷ 1/4 = ?",
        "answer": "3",
        "options": [
          "3",
          "3/16",
          "1",
          "12"
        ]
      },
      {
        "q": "Which is larger: 4/5 or 5/7?",
        "answer": "4/5",
        "options": [
          "4/5",
          "5/7",
          "equal",
          "can't tell"
        ]
      },
      {
        "q": "Simplify 9/12.",
        "answer": "3/4",
        "options": [
          "3/4",
          "3/12",
          "9/4",
          "2/3"
        ]
      },
      {
        "q": "3/5 of 25 = ?",
        "answer": "15",
        "options": [
          "15",
          "5",
          "10",
          "20"
        ]
      },
      {
        "q": "★ Cut 2/3 m into 1/6-m pieces. How many?",
        "answer": "4",
        "options": [
          "4",
          "3",
          "6",
          "8"
        ]
      }
    ]
  },
  "decimals-place-value": {
    "title": "Decimals & Place Value",
    "pre": [
      {
        "q": "Which is larger: 0.6 or 0.59?",
        "answer": "0.6",
        "options": [
          "0.6",
          "0.59",
          "equal",
          "can't tell"
        ]
      },
      {
        "q": "0.2 + 0.5 = ?",
        "answer": "0.7",
        "options": [
          "0.7",
          "0.07",
          "0.25",
          "7"
        ]
      },
      {
        "q": "Round 3.42 to the nearest tenth.",
        "answer": "3.4",
        "options": [
          "3.4",
          "3.5",
          "3.0",
          "4.0"
        ]
      },
      {
        "q": "Write 1/2 as a decimal.",
        "answer": "0.5",
        "options": [
          "0.5",
          "0.2",
          "0.12",
          "5.0"
        ]
      },
      {
        "q": "$5 − $2.25 = ?",
        "answer": "$2.75",
        "options": [
          "$2.75",
          "$3.25",
          "$2.85",
          "$3.75"
        ]
      },
      {
        "q": "Which place is the 4 in 6.04?",
        "answer": "hundredths",
        "options": [
          "hundredths",
          "tenths",
          "ones",
          "tens"
        ]
      },
      {
        "q": "0.5 × 4 = ?",
        "answer": "2",
        "options": [
          "2",
          "0.2",
          "20",
          "2.5"
        ]
      },
      {
        "q": "Smallest: 0.3, 0.03, 0.33?",
        "answer": "0.03",
        "options": [
          "0.03",
          "0.3",
          "0.33",
          "equal"
        ]
      }
    ],
    "post": [
      {
        "q": "Which is larger: 0.8 or 0.79?",
        "answer": "0.8",
        "options": [
          "0.8",
          "0.79",
          "equal",
          "can't tell"
        ]
      },
      {
        "q": "2.4 + 1.75 = ?",
        "answer": "4.15",
        "options": [
          "4.15",
          "4.79",
          "3.15",
          "41.5"
        ]
      },
      {
        "q": "Round 9.851 to tenths.",
        "answer": "9.9",
        "options": [
          "9.9",
          "9.8",
          "10.0",
          "9.85"
        ]
      },
      {
        "q": "Write 0.25 as a fraction.",
        "answer": "1/4",
        "options": [
          "1/4",
          "1/2",
          "25",
          "2/5"
        ]
      },
      {
        "q": "0.6 × 0.4 = ?",
        "answer": "0.24",
        "options": [
          "0.24",
          "2.4",
          "0.10",
          "0.024"
        ]
      },
      {
        "q": "$50 − $36.40 = ?",
        "answer": "$13.60",
        "options": [
          "$13.60",
          "$14.60",
          "$13.40",
          "$23.60"
        ]
      },
      {
        "q": "7.2 ÷ 3 = ?",
        "answer": "2.4",
        "options": [
          "2.4",
          "2.1",
          "0.24",
          "24"
        ]
      },
      {
        "q": "★ Split $42.30 among 3. Each?",
        "answer": "$14.10",
        "options": [
          "$14.10",
          "$13.10",
          "$14.30",
          "$15.10"
        ]
      }
    ]
  },
  "ratios-rates-percents": {
    "title": "Ratios, Rates & Percents",
    "pre": [
      {
        "q": "Ratio 2:1, 4 boys — how many girls?",
        "answer": "2",
        "options": [
          "2",
          "1",
          "4",
          "8"
        ]
      },
      {
        "q": "What is 10% of 60?",
        "answer": "6",
        "options": [
          "6",
          "16",
          "60",
          "0.6"
        ]
      },
      {
        "q": "6 for $3. Unit price?",
        "answer": "$0.50",
        "options": [
          "$0.50",
          "$2",
          "$0.30",
          "$18"
        ]
      },
      {
        "q": "Simplify 6:9.",
        "answer": "2:3",
        "options": [
          "2:3",
          "3:2",
          "1:3",
          "6:9"
        ]
      },
      {
        "q": "What is 50% of 24?",
        "answer": "12",
        "options": [
          "12",
          "6",
          "24",
          "48"
        ]
      },
      {
        "q": "90 mi in 3 hr =",
        "answer": "30 mph",
        "options": [
          "30 mph",
          "60 mph",
          "270 mph",
          "93 mph"
        ]
      },
      {
        "q": "What is 25% of 16?",
        "answer": "4",
        "options": [
          "4",
          "8",
          "12",
          "2"
        ]
      },
      {
        "q": "4:8 equals…",
        "answer": "1:2",
        "options": [
          "1:2",
          "2:1",
          "2:3",
          "4:8"
        ]
      }
    ],
    "post": [
      {
        "q": "Ratio 5:3, 10 red — how many blue?",
        "answer": "6",
        "options": [
          "6",
          "3",
          "5",
          "8"
        ]
      },
      {
        "q": "What is 30% of 80?",
        "answer": "24",
        "options": [
          "24",
          "18",
          "30",
          "8"
        ]
      },
      {
        "q": "9 for $4.50. Unit price?",
        "answer": "$0.50",
        "options": [
          "$0.50",
          "$0.45",
          "$2",
          "$13.50"
        ]
      },
      {
        "q": "Simplify 12:16.",
        "answer": "3:4",
        "options": [
          "3:4",
          "4:3",
          "2:3",
          "6:8"
        ]
      },
      {
        "q": "What is 75% of 60?",
        "answer": "45",
        "options": [
          "45",
          "40",
          "50",
          "15"
        ]
      },
      {
        "q": "160 mi in 4 hr =",
        "answer": "40 mph",
        "options": [
          "40 mph",
          "32 mph",
          "64 mph",
          "640 mph"
        ]
      },
      {
        "q": "21 is what percent of 28?",
        "answer": "75%",
        "options": [
          "75%",
          "70%",
          "21%",
          "84%"
        ]
      },
      {
        "q": "★ 60% of a number is 30. Number?",
        "answer": "50",
        "options": [
          "50",
          "18",
          "36",
          "90"
        ]
      }
    ]
  },
  "integers-coordinate": {
    "title": "Integers & the Coordinate Plane",
    "pre": [
      {
        "q": "Which is greater: −2 or −5?",
        "answer": "−2",
        "options": [
          "−2",
          "−5",
          "equal",
          "can't tell"
        ]
      },
      {
        "q": "What is |−4|?",
        "answer": "4",
        "options": [
          "4",
          "−4",
          "0",
          "8"
        ]
      },
      {
        "q": "−3 + 5 = ?",
        "answer": "2",
        "options": [
          "2",
          "−2",
          "8",
          "−8"
        ]
      },
      {
        "q": "Opposite of −6?",
        "answer": "6",
        "options": [
          "6",
          "−6",
          "0",
          "1/6"
        ]
      },
      {
        "q": "Quadrant of (3, 4)?",
        "answer": "I",
        "options": [
          "I",
          "II",
          "III",
          "IV"
        ]
      },
      {
        "q": "2 − 7 = ?",
        "answer": "−5",
        "options": [
          "−5",
          "5",
          "−9",
          "9"
        ]
      },
      {
        "q": "The origin is the point…",
        "answer": "(0, 0)",
        "options": [
          "(0, 0)",
          "(1, 1)",
          "(0, 1)",
          "(−1, 0)"
        ]
      },
      {
        "q": "Smallest: −2, 1, −6?",
        "answer": "−6",
        "options": [
          "−6",
          "−2",
          "1",
          "0"
        ]
      }
    ],
    "post": [
      {
        "q": "Which is greater: −1 or −9?",
        "answer": "−1",
        "options": [
          "−1",
          "−9",
          "equal",
          "can't tell"
        ]
      },
      {
        "q": "Evaluate |−15|.",
        "answer": "15",
        "options": [
          "15",
          "−15",
          "0",
          "30"
        ]
      },
      {
        "q": "−8 + 3 = ?",
        "answer": "−5",
        "options": [
          "−5",
          "5",
          "−11",
          "11"
        ]
      },
      {
        "q": "−4 − 6 = ?",
        "answer": "−10",
        "options": [
          "−10",
          "2",
          "10",
          "−2"
        ]
      },
      {
        "q": "Quadrant of (−2, 5)?",
        "answer": "II",
        "options": [
          "II",
          "I",
          "III",
          "IV"
        ]
      },
      {
        "q": "Opposite of 23?",
        "answer": "−23",
        "options": [
          "−23",
          "23",
          "0",
          "1/23"
        ]
      },
      {
        "q": "Point (4, 0) lies on…",
        "answer": "x-axis",
        "options": [
          "x-axis",
          "y-axis",
          "Quadrant I",
          "origin"
        ]
      },
      {
        "q": "★ Distance from (−3, 2) to (5, 2)?",
        "answer": "8 units",
        "options": [
          "8 units",
          "2 units",
          "3 units",
          "−8 units"
        ]
      }
    ]
  },
  "expressions-equations": {
    "title": "Expressions & One-Step Equations",
    "pre": [
      {
        "q": "Evaluate 2 + 3 × 4.",
        "answer": "14",
        "options": [
          "14",
          "20",
          "9",
          "24"
        ]
      },
      {
        "q": "Evaluate 5x when x = 3.",
        "answer": "15",
        "options": [
          "15",
          "8",
          "53",
          "18"
        ]
      },
      {
        "q": "Solve x + 5 = 9.",
        "answer": "4",
        "options": [
          "4",
          "14",
          "5",
          "45"
        ]
      },
      {
        "q": "Solve 4x = 20.",
        "answer": "5",
        "options": [
          "5",
          "16",
          "24",
          "80"
        ]
      },
      {
        "q": "Evaluate 3².",
        "answer": "9",
        "options": [
          "9",
          "6",
          "5",
          "33"
        ]
      },
      {
        "q": "Solve x − 3 = 7.",
        "answer": "10",
        "options": [
          "10",
          "4",
          "21",
          "−4"
        ]
      },
      {
        "q": "Write '5 more than y'.",
        "answer": "y + 5",
        "options": [
          "y + 5",
          "5y",
          "y − 5",
          "5 − y"
        ]
      },
      {
        "q": "Evaluate 2(3 + 1).",
        "answer": "8",
        "options": [
          "8",
          "7",
          "6",
          "5"
        ]
      }
    ],
    "post": [
      {
        "q": "Evaluate 10 − 2 × 3.",
        "answer": "4",
        "options": [
          "4",
          "24",
          "8",
          "30"
        ]
      },
      {
        "q": "Evaluate 6x when x = 4.",
        "answer": "24",
        "options": [
          "24",
          "10",
          "64",
          "2"
        ]
      },
      {
        "q": "Solve x + 8 = 17.",
        "answer": "9",
        "options": [
          "9",
          "25",
          "8",
          "136"
        ]
      },
      {
        "q": "Solve 6x = 42.",
        "answer": "7",
        "options": [
          "7",
          "36",
          "48",
          "252"
        ]
      },
      {
        "q": "Evaluate (5 + 2)².",
        "answer": "49",
        "options": [
          "49",
          "14",
          "29",
          "27"
        ]
      },
      {
        "q": "Solve x / 3 = 12.",
        "answer": "36",
        "options": [
          "36",
          "4",
          "15",
          "9"
        ]
      },
      {
        "q": "Write 'three times a number k'.",
        "answer": "3k",
        "options": [
          "3k",
          "k + 3",
          "k³",
          "k/3"
        ]
      },
      {
        "q": "★ 4w = 36, solve for w.",
        "answer": "9",
        "options": [
          "9",
          "32",
          "40",
          "144"
        ]
      }
    ]
  }
};

function createAllInterventionForms() {
  var folder = getOrCreateFolder_(FOLDER_NAME);
  var out = {};
  Object.keys(QUIZ_DATA).forEach(function (slug) {
    var topic = QUIZ_DATA[slug];
    out[slug] = {
      preStudent: buildForm_(folder, slug, topic.title, "Pre", topic.pre, false),
      preTeacher: buildForm_(folder, slug, topic.title, "Pre", topic.pre, true),
      postStudent: buildForm_(folder, slug, topic.title, "Post", topic.post, false),
      postTeacher: buildForm_(folder, slug, topic.title, "Post", topic.post, true),
    };
  });
  printSnippet_(out);
}

function buildForm_(folder, slug, title, phase, items, isTeacher) {
  var role = isTeacher ? "Teacher" : "Student";
  var name = title + " — " + phase + "-Quiz (" + role + ")";
  var form = FormApp.create(name);
  form.setIsQuiz(true);
  form.setDescription(
    phase +
      "-quiz for the " +
      title +
      " intervention topic." +
      (isTeacher ? " TEACHER MASTER — answer key shown below each item." : ""),
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  var nameItem = form.addTextItem();
  nameItem.setTitle("First & last name").setRequired(true);

  items.forEach(function (it) {
    var q = form.addMultipleChoiceItem();
    var choices = it.options.map(function (opt) {
      return q.createChoice(String(opt), String(opt) === String(it.answer));
    });
    q.setTitle(it.q).setChoices(choices).setPoints(1).setRequired(true);
    if (isTeacher) q.setHelpText("✔ Answer: " + it.answer);
    var fb = FormApp.createFeedback().setText("Answer: " + it.answer).build();
    q.setFeedbackForCorrect(fb);
    q.setFeedbackForIncorrect(fb);
  });

  // file the form in the folder
  var file = DriveApp.getFileById(form.getId());
  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (e) {}

  return isTeacher ? form.getEditUrl() : form.getPublishedUrl();
}

function getOrCreateFolder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function printSnippet_(out) {
  var lines = ["window.INTERVENTION_FORMS = {"];
  Object.keys(out).forEach(function (slug) {
    var u = out[slug];
    lines.push(
      '  "' +
        slug +
        '": { preStudent: "' +
        u.preStudent +
        '", preTeacher: "' +
        u.preTeacher +
        '", postStudent: "' +
        u.postStudent +
        '", postTeacher: "' +
        u.postTeacher +
        '" },',
    );
  });
  lines.push("};");
  var block = lines.join("\n");
  Logger.log("\n===== PASTE INTO math/intervention/assets/forms-links.js =====\n");
  Logger.log(block);
  Logger.log("\n===== END =====");
}
