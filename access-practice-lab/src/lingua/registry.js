/* Everyday English studio — activity registry. The view (views/lingua.js) renders the shelf and mounts one at a time. */
import * as vocab from "./activities/vocab.js";
import * as listening from "./activities/listening.js";
import * as sentence from "./activities/sentence.js";
import * as reading from "./activities/reading.js";
import * as speaking from "./activities/speaking.js";
import * as dialogue from "./activities/dialogue.js";
import * as grammar from "./activities/grammar.js";
import * as writing from "./activities/writing.js";
import * as quiz from "./activities/quiz.js";

export const MODULES = { vocab, listening, sentence, reading, speaking, dialogue, grammar, writing, quiz };
export const ORDER = ["vocab", "listening", "sentence", "reading", "speaking", "dialogue", "grammar", "writing", "quiz"];
