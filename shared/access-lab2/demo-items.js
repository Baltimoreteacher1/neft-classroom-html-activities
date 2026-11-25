// SYNTHETIC DEMO ITEMS. A small, clearly synthetic set (3 items per domain per practice band, grade band 3-5,
// every one reviewState "draft") so the builder, diagnostic, Road plan and bank-health checks have something to run on.
// This is not a bank. The text is original, written for these tests, and none of it is official or comparable to
// official content. Draft items are teacher-visible only; a student set needs reviewed items.
import { LISTENING } from "./demo-listening.js";
import { READING } from "./demo-reading.js";
import { SPEAKING } from "./demo-speaking.js";
import { WRITING } from "./demo-writing.js";

export { DEMO_NOTICE } from "./demo-factory.js";

/** 36 synthetic items: Listening, Reading, Speaking, Writing x early, building, strong x 3. All draft. */
export const DEMO_ITEMS = Object.freeze([...LISTENING, ...READING, ...SPEAKING, ...WRITING]);
