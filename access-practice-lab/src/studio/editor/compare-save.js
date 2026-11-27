// Saving a version card as its OWN draft. A version is never written over another draft: it gets a fresh id and a
// `lineage` that records the activity it was made from, so editing one never changes another.

import { duplicateActivity, getLocal, newActivityId, saveLocal } from "../drafts.js";
import { versionLineage } from "../core/differentiate-util.js";
import { normalizeActivity } from "../core/schema.js";

/** A draft id that no saved activity uses. */
function freshDraftId() {
  let id = newActivityId();
  while (getLocal(id)) id = newActivityId();
  return id;
}

/** The activity as it will be stored: new id, rev 0, lineage pointing at `parent`. Pure apart from the id lookup. */
export function asDraft(activity, parent, now = Date.now()) {
  const own = activity.lineage?.variantOf === parent.id ? activity.lineage : null;
  return normalizeActivity({
    ...structuredClone(activity),
    id: freshDraftId(),
    rev: 0,
    createdAt: now,
    updatedAt: now,
    lineage: {
      ...(own || activity.lineage || versionLineage(parent, "", [])),
      variantOf: parent.id,
    },
  });
}

/** Save `card` as its own draft once. Returns the draft id, or "" when the device refused the write. */
export function saveCard(card, parent, now = Date.now()) {
  if (card.saved) return card.saved;
  const draft = asDraft(card.activity, parent, now);
  if (!saveLocal(draft, null, now)) return "";
  card.saved = draft.id;
  card.activity = draft;
  return draft.id;
}

/** A second saved draft with the same content. Returns { id, activity } or null when the device refused the write. */
export function duplicateCard(card, copyLabel, now = Date.now()) {
  const copy = duplicateActivity(card.activity, copyLabel);
  copy.id = freshDraftId();
  copy.createdAt = now;
  copy.updatedAt = now;
  return saveLocal(copy, null, now) ? { id: copy.id, activity: copy } : null;
}
