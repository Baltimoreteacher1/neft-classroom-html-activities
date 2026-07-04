/**
 * Student Digital Mailbox — paste-and-run Google Form builder.
 *
 * STATUS: The 4 mailbox Forms this script builds are ALREADY LIVE and wired into
 * curriculum/student-digital-mailbox/mailbox-links.js. This file is the
 * disaster-recovery / re-create-for-a-new-class kit. The Google Drive / Forms
 * REST API CANNOT create Forms in our tooling — Apps Script `FormApp` is the only
 * programmatic path, which is exactly what this script uses.
 *
 * WHAT setupMailboxForms() DOES (run it once):
 *   1. Creates the 4 PRIVATE mailbox Google Forms (Class Check-In, I'm Confused,
 *      Private Note, Anonymous Question) with the exact student-friendly questions.
 *   2. Makes each anonymous + open: email collection OFF, no sign-in required,
 *      not limited to one response.
 *   3. Links a response spreadsheet to each form.
 *   4. Moves every form + sheet into the "Student Digital Mailbox" Drive folder.
 *   5. Installs an on-submit trigger that emails ALERT_EMAIL a summary of each
 *      submission (with a 🚨 URGENT flag for Private Notes marked urgent).
 *   6. Logs the responder URLs to paste into mailbox-links.js.
 *
 * HOW TO RUN:
 *   - Sign in to Google as the OWNER of the Mailbox folder (neftjd@gmail.com,
 *     PERSONAL Gmail — a Workspace account can force responders to sign in).
 *   - script.google.com → New project → paste this whole file → run
 *     `setupMailboxForms` → approve scopes → read the responder URLs from the Log.
 *   - Paste each URL into the matching key in mailbox-links.js, then bump the
 *     `?v=YYYY-MM-DD` cache-bust date on the mailbox-links.js <script> tag in both
 *     index.html and teacher/index.html.
 *   - In Drive, set each new Form to "Anyone with the link" (no API can do this).
 *
 * Safe to re-run: a form already present in the folder (matched by title) is
 * reused, and any empty orphan from a failed run is trashed — never duplicated.
 *
 * NOTE: This is the form-builder ONLY. The Class Pulse insights web app and the
 * weekly digest live in the full standalone project (~/student-mailbox-forms) and
 * are out of scope here.
 */

var CONFIG = {
  FOLDER_ID: '1NGNJCslmlYZdZV33IrD4zRlpqo0Zk0yP', // "Student Digital Mailbox" folder
  ALERT_EMAIL: 'JDneft@bcps.k12.md.us',
};

var SAFETY_NOTE =
  'This form is for class ideas, questions, and feedback. You do not have to ' +
  'give your name. If someone is in danger or needs help right now, tell an ' +
  'adult immediately.';

/**
 * Form definitions. Item types: 'paragraph', 'short', 'choice' (single, with
 * choices), 'checkbox' (multi, with choices). Add allowOther:true to let kids
 * type their own answer on choice/checkbox questions.
 */
var FORM_SPECS = [
  {
    key: 'classCheckIn',
    title: 'Class Check-In',
    description: 'Tell Mr. Neft how class is going for you. ' + SAFETY_NOTE,
    items: [
      { type: 'paragraph', title: 'How is math class going for you right now?' },
      { type: 'paragraph', title: 'What is helping you learn?' },
      { type: 'paragraph', title: 'What is making class hard?' },
      { type: 'paragraph', title: 'What should Mr. Neft know?' },
      {
        type: 'choice',
        title: 'Do you want Mr. Neft to follow up with you?',
        choices: ['Yes', 'No'],
      },
    ],
  },
  {
    key: 'confused',
    title: "I'm Confused",
    description:
      'Tell Mr. Neft what part of math, directions, homework, or class feels ' +
      'confusing. ' +
      SAFETY_NOTE,
    items: [
      {
        type: 'paragraph',
        title: 'What lesson, topic, direction, or assignment is confusing?',
      },
      { type: 'paragraph', title: 'What part did you understand?' },
      { type: 'paragraph', title: 'Where did you get stuck?' },
      { type: 'paragraph', title: 'What would help you next?' },
      {
        type: 'checkbox',
        title: 'What kind of help would you like? (Pick any)',
        choices: ['An example', 'Small group', 'A video', 'Partner help'],
      },
    ],
  },
  {
    key: 'privateNote',
    title: 'Private Note to Mr. Neft',
    description:
      'Send a note if something is bothering you or you want Mr. Neft to know ' +
      'something. ' +
      SAFETY_NOTE,
    items: [
      { type: 'paragraph', title: 'What do you want Mr. Neft to know?' },
      {
        type: 'choice',
        title:
          'Is this about class, work, a classmate, group work, homework, or ' +
          'something else?',
        choices: ['Class', 'Work', 'A classmate', 'Group work', 'Homework'],
        allowOther: true,
      },
      {
        type: 'choice',
        title: 'Do you need Mr. Neft to follow up?',
        choices: ['Yes', 'No'],
      },
      { type: 'choice', title: 'Is this urgent?', choices: ['Yes', 'No'] },
    ],
  },
  {
    key: 'anonymousQuestion',
    title: 'Anonymous Question',
    description: 'Ask a question you were nervous to ask out loud. ' + SAFETY_NOTE,
    items: [
      { type: 'paragraph', title: 'What question do you want to ask?' },
      {
        type: 'choice',
        title:
          'Is this about math, directions, grades, homework, class routines, ' +
          'or something else?',
        choices: ['Math', 'Directions', 'Grades', 'Homework', 'Class routines'],
        allowOther: true,
      },
      {
        type: 'choice',
        title: 'Would it help if Mr. Neft answered this for the whole class?',
        choices: ['Yes', 'No'],
      },
    ],
  },
];

/** MAIN — run this once. */
function setupMailboxForms() {
  var folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  var results = [];

  FORM_SPECS.forEach(function (spec) {
    // Re-run safe: reuse a COMPLETE form already created for this title, and
    // trash any EMPTY orphan left by a failed run (so we never duplicate).
    var done = reuseOrCleanExisting_(spec.title, folder);
    if (done) {
      results.push({
        key: spec.key,
        title: spec.title,
        url: done.getPublishedUrl(),
        edit: done.getEditUrl(),
      });
      return;
    }

    var form = FormApp.create(spec.title);
    form.setDescription(spec.description);
    // NOTE: setRequireLogin() is Workspace-only and throws "operation not
    // supported" on personal Gmail — and personal-account forms are already
    // open to anyone with the link, so we simply don't call it.
    form.setLimitOneResponsePerUser(false);
    form.setShowLinkToRespondAgain(true);
    setEmailCollectionOff_(form);

    spec.items.forEach(function (item) {
      addItem_(form, item);
    });

    // Linked response spreadsheet.
    var ss = SpreadsheetApp.create(spec.title + ' (Responses)');
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

    // Move form + sheet into the Mailbox folder.
    DriveApp.getFileById(form.getId()).moveTo(folder);
    DriveApp.getFileById(ss.getId()).moveTo(folder);

    // On-submit email alert.
    ScriptApp.newTrigger('onMailboxFormSubmit').forForm(form).onFormSubmit().create();

    results.push({
      key: spec.key,
      title: spec.title,
      url: form.getPublishedUrl(),
      edit: form.getEditUrl(),
    });
  });

  // Print the responder URLs to paste into mailbox-links.js.
  Logger.log('===== PASTE THESE INTO mailbox-links.js =====');
  results.forEach(function (r) {
    Logger.log(r.key + ': "' + r.url + '",');
  });
  Logger.log('=============================================');
  results.forEach(function (r) {
    Logger.log(r.title + ' — edit: ' + r.edit);
  });
  Logger.log(
    'IMPORTANT: open each form once and confirm Settings > Responses > ' +
      '"Collect email addresses" is OFF before sharing with students. Then set ' +
      'each form to "Anyone with the link" in Drive.'
  );
  return results;
}

/**
 * Look for forms already named `title` anywhere in Drive.
 *  - If a COMPLETE one (has questions) exists, make sure it's in the folder and
 *    return it so we don't recreate it.
 *  - Trash any EMPTY orphan (left by a failed run) so we never end up with dups.
 * Returns the reusable Form, or null if none found.
 */
function reuseOrCleanExisting_(title, folder) {
  var files = DriveApp.getFilesByName(title);
  var reusable = null;
  while (files.hasNext()) {
    var file = files.next();
    if (file.getMimeType() !== 'application/vnd.google-apps.form') continue;
    var form;
    try {
      form = FormApp.openById(file.getId());
    } catch (e) {
      continue;
    }
    if (form.getItems().length === 0) {
      file.setTrashed(true); // empty orphan from a failed run
      continue;
    }
    // Complete form — ensure it lives in the Mailbox folder, then reuse it.
    try {
      file.moveTo(folder);
    } catch (e) {
      /* already in folder or no move needed */
    }
    reusable = form;
  }
  return reusable;
}

/** Turn off email collection across Apps Script runtime versions. */
function setEmailCollectionOff_(form) {
  try {
    if (FormApp.EmailCollectionType && form.setEmailCollectionType) {
      form.setEmailCollectionType(FormApp.EmailCollectionType.DO_NOT_COLLECT);
      return;
    }
  } catch (e) {
    /* fall through to legacy API */
  }
  try {
    form.setCollectEmail(false);
  } catch (e) {
    Logger.log('Could not set email collection off automatically: ' + e);
  }
}

/** Add one question to a form from its spec. */
function addItem_(form, item) {
  switch (item.type) {
    case 'paragraph':
      form.addParagraphTextItem().setTitle(item.title);
      break;
    case 'short':
      form.addTextItem().setTitle(item.title);
      break;
    case 'choice': {
      var mc = form.addMultipleChoiceItem().setTitle(item.title);
      applyChoices_(mc, item);
      break;
    }
    case 'checkbox': {
      var cb = form.addCheckboxItem().setTitle(item.title);
      applyChoices_(cb, item);
      break;
    }
    default:
      throw new Error('Unknown item type: ' + item.type);
  }
}

function applyChoices_(formItem, spec) {
  var choices = spec.choices.map(function (c) {
    return formItem.createChoice(c);
  });
  formItem.setChoices(choices);
  if (spec.allowOther) formItem.showOtherOption(true);
}

/**
 * Installable on-submit handler — emails ALERT_EMAIL a summary of each
 * submission. Flags Private Notes marked urgent with 🚨.
 */
function onMailboxFormSubmit(e) {
  var form = e.source;
  var response = e.response;
  var title = form.getTitle();

  var lines = [];
  var urgent = false;
  response.getItemResponses().forEach(function (ir) {
    var q = ir.getItem().getTitle();
    var a = ir.getResponse();
    if (Array.isArray(a)) a = a.join(', ');
    if (/urgent/i.test(q) && /yes/i.test(String(a))) urgent = true;
    lines.push('• ' + q + '\n   ' + (a === '' ? '(blank)' : a));
  });

  var subject = (urgent ? '🚨 URGENT — ' : '') + '[Student Mailbox] ' + title;
  var body =
    'A new "' +
    title +
    '" submission came in.\n\n' +
    lines.join('\n\n') +
    '\n\n(Submitted anonymously — no student identity is collected.)';

  MailApp.sendEmail(CONFIG.ALERT_EMAIL, subject, body);
}

/** Optional: remove the on-submit triggers created by this script (cleanup). */
function removeMailboxTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onMailboxFormSubmit') {
      ScriptApp.deleteTrigger(t);
    }
  });
  Logger.log('Removed mailbox on-submit triggers.');
}
