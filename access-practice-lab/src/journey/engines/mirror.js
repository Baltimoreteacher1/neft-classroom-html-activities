// Growth Mirror engine (Improve + the independent Show summary). Pure logic: no DOM, no storage.
//
// Rules this module keeps:
//  * It never writes the revision. It picks ONE target, offers graduated help, and reports what is observably
//    different between two drafts the learner wrote.
//  * Supported practice and independent performance stay separate (see growthRecord / independentSummary).
//  * Counts of what is on the page, never a score, a level, a proficiency claim or a percentage of ability.
//    Word count is a task requirement and a stored fact, never shown as a strength.
//  * A revision after feedback is a revision, never a first attempt (ledgerEntry kind "revision").

export * from "./mirror-core.js";
export * from "./mirror-record.js";
export * from "./mirror-revision.js";
