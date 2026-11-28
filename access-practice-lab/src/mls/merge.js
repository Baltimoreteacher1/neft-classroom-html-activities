// Join an inventory record with its authored content into the Skill object the model uses. Pure (no DOM), so tools and tests share it.
// The inventory's `family` is the problem-generator id; the content's `family` is the caregiver text. The merged skill keeps the
// generator id as `familyId` and the caregiver text as `family`.
export const mergeSkill = (inv, content) => ({ ...inv, ...content, id: inv.id, grade: inv.grade, title: inv.title, standards: inv.standards, familyId: inv.family, family: content.family, params: inv.params, prereq: inv.prereq });
