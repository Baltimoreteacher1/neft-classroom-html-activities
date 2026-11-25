// G-61 talk, G-62 listen, G-63 check: the routine blocks (shared/bcpss-routines) render exactly what the data holds,
// on the Studio card, in print HTML and in Word, at every WIDA band, with student sheets free of the teacher key.
// Each gate has negative controls that drive the real checker at a deliberately broken renderer or a datum it cannot show.
import { familyControls, runFamily } from "./routine-proof.mjs";

const make = (id, family, probes) => ({
  id,
  name: `routine-blocks-${family}`,
  run: ({ data }) => runFamily(data, family),
  controls: ({ data }) => probes.flatMap((p) => familyControls(data, family, p)),
});

export const g61 = make("G-61", "talk", ["talkline", "infogap", "partner"]);
export const g62 = make("G-62", "listen", ["doctor", "dictogloss", "ladder"]);
export const g63 = make("G-63", "check", ["retrieval", "goals", "exit", "cognates"]);
