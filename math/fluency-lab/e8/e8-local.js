// Per-learner storage for the Enterprise 8 record, on the same local keys and profile slots as the rest of the lab.
import { profileKey, profiles, readLocal, writeLocal } from "../school-tools.js";
import { E8_KEY, createE8Store } from "./e8-store.js";

export const e8Store = createE8Store({
  read: () => readLocal(profileKey(E8_KEY, profiles().active), null),
  write: (value) => writeLocal(profileKey(E8_KEY, profiles().active), value),
});
