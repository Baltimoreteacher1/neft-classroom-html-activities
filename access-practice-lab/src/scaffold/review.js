// Review-status gate. One rule, used by the build validator and by the runtime:
// content is shown to students only if it is approved, or if it is lab content that existed before Scaffold Studio and
// is carried as "legacy-unreviewed" (docs/scaffold-studio/discovery.md, decision 3). Teachers see everything, labelled.
import { LEGACY, REVIEW_STATUS, reviewRank } from "./schema/v1.js";

export { LEGACY };
export const RELEASE_STATUS = "approved";

export const statusLabel = (status, machineDrafted) => {
  if (status === LEGACY) return { en: "Needs human review (existing lab content)", es: "Necesita revisión humana (contenido existente)" };
  if (machineDrafted && status !== "approved") return { en: "Needs human review (machine-drafted)", es: "Necesita revisión humana (borrador automático)" };
  return { draft: { en: "Draft", es: "Borrador" }, "native-reviewed": { en: "Native-reviewed", es: "Revisado por hablante nativo" }, "wida-reviewed": { en: "WIDA-reviewed", es: "Revisado con criterios WIDA" }, approved: { en: "Approved", es: "Aprobado" } }[status] || { en: "Unknown", es: "Desconocido" };
};

/**
 * May this content be shown to a student?
 * @param {{status:string}} review
 * @param {{production?:boolean, strict?:boolean, audience?:"student"|"teacher"}} opts
 */
export function mayShow(review, { production = true, strict = false, audience = "student" } = {}) {
  if (audience === "teacher") return true;
  if (!production) return true;
  const status = review?.status;
  if (status === LEGACY) return !strict;
  return reviewRank(status) >= reviewRank(RELEASE_STATUS);
}

export { REVIEW_STATUS };
