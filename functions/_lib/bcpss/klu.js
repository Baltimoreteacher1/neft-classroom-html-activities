// The WIDA Key Language Use (Narrate | Inform | Explain | Argue) of a unit connection.
//
// Seed connections carry `blueprint_id`, not `wida_klu`: the KLU lives on the language blueprint
// (LANGUAGE_BLUEPRINTS[].wida_klu) and is repeated in the connection's exit ticket. Code that read
// `connection.wida_klu` therefore got undefined for every seed unit and silently fell back to "Explain",
// which mislabelled 108 of 162 units. Database rows already join `wida_klu`, so that field wins when set.
import * as seed from "../../../data/bcpss-curriculum-seed.mjs";

const BLUEPRINT_KLU = new Map((seed.LANGUAGE_BLUEPRINTS || []).map((b) => [b.id, b.wida_klu]));

export const kluOfConnection = (conn) =>
  conn?.wida_klu ||
  BLUEPRINT_KLU.get(conn?.blueprint_id) ||
  conn?.language_exit_ticket_json?.wida_klu ||
  null;
