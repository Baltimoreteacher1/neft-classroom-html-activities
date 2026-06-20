/* ==========================================================================
   Emit scripts/intervention/forms.gs (Google Apps Script) from data.mjs so the
   quiz items in the Forms always match the website. Run:
     node scripts/intervention/build-forms.mjs
   ========================================================================== */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TOPICS } from "./data.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Map a single data.mjs quiz item into the Forms payload, carrying:
//   - explain        : correct-answer feedback (the "why this is right")
//   - misconceptions : { "<option text>": "why this is wrong" } targeted feedback
// Both are optional; older items without them still build a plain quiz.
function mapItem(i) {
  const out = { q: i.prompt, answer: i.answer, options: i.options };
  if (i.explain) out.explain = i.explain;
  if (i.misconceptions && typeof i.misconceptions === "object")
    out.misconceptions = i.misconceptions;
  return out;
}

const QUIZ = {};
for (const t of TOPICS) {
  const entry = {
    title: t.title,
    pre: t.preQuiz.map(mapItem),
    post: t.postQuiz.map(mapItem),
  };
  // Tiered Forms (optional, data-driven). Never labeled "ESOL".
  //   level1 = support (fewer / foundational), level2 = enrichment (extension).
  if (Array.isArray(t.level1) && t.level1.length) entry.level1 = t.level1.map(mapItem);
  if (Array.isArray(t.level2) && t.level2.length) entry.level2 = t.level2.map(mapItem);
  QUIZ[t.slug] = entry;
}

const gs = `/* ==========================================================================
   Neft Teacher — Intervention Pre/Post Quiz Form generator (Google Apps Script)

   WHAT IT DOES
   Creates, for every intervention topic, FOUR Google Forms:
     • Pre-Quiz (Student)   — clean auto-graded quiz students take BEFORE
     • Pre-Quiz (Teacher)   — same items + visible answer key (master)
     • Post-Quiz (Student)  — auto-graded quiz students take AFTER
     • Post-Quiz (Teacher)  — same items + visible answer key (master)
   Plus, for any topic that defines them in data.mjs, differentiated variants:
     • Level 1 (Student)    — support: fewer / foundational items
     • Level 2 (Student)    — enrichment: multi-step extension items
   All are quizzes (auto-graded, 1 pt/question) and collect the student name.
   Each item shows targeted feedback: the correct-answer explanation on a right
   answer, and the per-distractor "why this is wrong" notes on a wrong answer
   (built from the optional misconceptions map in data.mjs).

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

var QUIZ_DATA = ${JSON.stringify(QUIZ, null, 2)};

function createAllInterventionForms() {
  // Fall back to a default if the top FOLDER_NAME line was missed when pasting.
  var folderName =
    typeof FOLDER_NAME !== "undefined"
      ? FOLDER_NAME
      : "Neft Teacher — Math Intervention Quizzes";
  var folder = getOrCreateFolder_(folderName);
  var out = {};
  Object.keys(QUIZ_DATA).forEach(function (slug) {
    var topic = QUIZ_DATA[slug];
    var links = {
      preStudent: buildForm_(folder, slug, topic.title, "Pre", topic.pre, false),
      preTeacher: buildForm_(folder, slug, topic.title, "Pre", topic.pre, true),
      postStudent: buildForm_(folder, slug, topic.title, "Post", topic.post, false),
      postTeacher: buildForm_(folder, slug, topic.title, "Post", topic.post, true),
    };
    // Differentiated variants only when the topic supplies them in data.mjs.
    if (topic.level1 && topic.level1.length) {
      links.level1Student = buildForm_(folder, slug, topic.title, "Level 1", topic.level1, false);
    }
    if (topic.level2 && topic.level2.length) {
      links.level2Student = buildForm_(folder, slug, topic.title, "Level 2", topic.level2, false);
    }
    out[slug] = links;
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

    // Correct-answer feedback = the explanation (falls back to the answer).
    var correctText = it.explain ? it.explain : "Answer: " + it.answer;
    q.setFeedbackForCorrect(
      FormApp.createFeedback().setText(correctText).build(),
    );

    // Wrong-answer feedback. The Forms API gives one incorrect-feedback per
    // item (not per choice), so assemble the per-distractor misconception notes
    // into a single targeted message. Falls back to the answer when none given.
    var incorrectText = buildIncorrectFeedback_(it);
    q.setFeedbackForIncorrect(
      FormApp.createFeedback().setText(incorrectText).build(),
    );
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

// Build the wrong-answer feedback for one item. Lists each distractor's
// "why this is wrong" note from it.misconceptions (keyed by option text), then
// states the correct answer + explanation. Falls back gracefully when a item
// has no misconceptions map.
function buildIncorrectFeedback_(it) {
  var lines = [];
  var map = it.misconceptions || {};
  it.options.forEach(function (opt) {
    var key = String(opt);
    if (key === String(it.answer)) return; // skip the correct choice
    if (map[key]) lines.push("• " + key + ": " + map[key]);
  });
  var tail = it.explain
    ? "Correct answer: " + it.answer + ". " + it.explain
    : "Correct answer: " + it.answer + ".";
  return lines.length ? lines.join("\\n") + "\\n\\n" + tail : tail;
}

function printSnippet_(out) {
  var lines = ["window.INTERVENTION_FORMS = {"];
  Object.keys(out).forEach(function (slug) {
    var u = out[slug];
    // Emit every link present (the optional level1/level2 keys only appear when
    // the topic defined tiered variants), keeping the existing key order first.
    var order = [
      "preStudent",
      "preTeacher",
      "postStudent",
      "postTeacher",
      "level1Student",
      "level2Student",
    ];
    var parts = [];
    order.forEach(function (k) {
      if (u[k]) parts.push(k + ': "' + u[k] + '"');
    });
    lines.push('  "' + slug + '": { ' + parts.join(", ") + " },");
  });
  lines.push("};");
  var block = lines.join("\\n");
  Logger.log("\\n===== PASTE INTO math/intervention/assets/forms-links.js =====\\n");
  Logger.log(block);
  Logger.log("\\n===== END =====");
}
`;

writeFileSync(resolve(HERE, "forms.gs"), gs);
console.log("Wrote scripts/intervention/forms.gs");
