// Tiny helpers for hint copy. `h` builds {en, es}; `m` formats whole-cent money; `p` is a plain percent.
import { money } from "./money.js";

export const h = (en, es) => ({ en, es });
export const m = money;
