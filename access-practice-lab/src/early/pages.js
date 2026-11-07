// Pages under /early/<id> for the K–3 bands. Each page module exports render(ctx, I) and optional
// onClick/mount/unmount; src/views/early-hub.js lists them on the early home.
import * as family from "./family.js";
import * as phonics from "./phonics.js";
import * as story from "./story.js";
import * as words from "./words.js";

export const PAGES = { story, phonics, words, family };
