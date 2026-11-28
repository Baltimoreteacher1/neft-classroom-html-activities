// Math Literacy Studio: the twelve instructional engines. Two modules own them (engines-a.js: reading-lab, anatomy, sentence-studio,
// translator, vocab-explorer, talk-studio; engines-b.js: listening-lab, error-detective, story-studio, modeling-workshop, concept-comics,
// transfer-lab). Each engine is { title, blurb, mount(el, opts) -> { destroy() } } with opts = { skill, band, level, seed, support, ctx }.
import { ENGINES as A } from "./engines-a.js";
import { ENGINES as B } from "./engines-b.js";
export const ENGINES = { ...A, ...B };
