// Pages under /early/<id> for the K–3 bands. Each page module exports render(ctx, I) and optional
// onClick/mount/unmount; src/views/early-hub.js lists them on the early home.
import * as discover from "./discover.js";
import * as family from "./family.js";
import * as phonics from "./phonics.js";
import * as rhyme from "./rhyme.js";
import * as sentences from "./sentences.js";
import * as sightWords from "./sight-words.js";
import * as story from "./story.js";
import * as words from "./words.js";

export const PAGES = {
  story,
  phonics,
  words,
  rhyme,
  "sight-words": sightWords,
  sentences,
  discover,
  family,
};
