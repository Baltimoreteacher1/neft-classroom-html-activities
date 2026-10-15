// Every family homework page carries lesson-specific corner content and six basic practice items.
//   node tools/validate-family-homework-content.mjs [lessonId ...]   (no ids = every page except Unit 10)
import {
  notesIds,
  readNotes,
  validateAll,
  validateSidecar,
} from "./lib/family-homework-content.mjs";

const want = process.argv.slice(2);
let problems;
if (want.length) problems = want.flatMap((id) => validateSidecar(id, readNotes(id)));
else problems = validateAll();
if (problems.length) {
  for (const m of problems) console.error(m);
  console.error(
    `\n${problems.length} problem(s) across ${want.length || notesIds().length} homework page(s).`,
  );
  process.exit(1);
}
console.log(
  `family homework content: ${want.length || notesIds().length} page(s) have lesson-specific corner content and six basic practice items.`,
);
