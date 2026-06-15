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

const QUIZ = {};
for (const t of TOPICS) {
  QUIZ[t.slug] = {
    title: t.title,
    pre: t.preQuiz.map((i) => ({ q: i.prompt, answer: i.answer, options: i.options })),
    post: t.postQuiz.map((i) => ({ q: i.prompt, answer: i.answer, options: i.options })),
  };
}

const gs = `/* ==========================================================================
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
  var block = lines.join("\\n");
  Logger.log("\\n===== PASTE INTO math/intervention/assets/forms-links.js =====\\n");
  Logger.log(block);
  Logger.log("\\n===== END =====");
}
`;

writeFileSync(resolve(HERE, "forms.gs"), gs);
console.log("Wrote scripts/intervention/forms.gs");
