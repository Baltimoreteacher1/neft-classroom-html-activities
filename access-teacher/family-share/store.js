// The teacher's drafts and approvals for family stories, on this browser only (like the Passport roster beside it).
// One entry per student per class source: the story as last edited, and the fragment the teacher approved (what a link
// carries). Nothing is uploaded and nothing here is read by any family page.
import { encodeStory } from "../../access-practice-lab/src/family/story/link.js";
import { normalizeStory } from "../../access-practice-lab/src/family/story/model.js";

export const SHARE_KEY = "accessTeacher:v1:familyShare";
const MAX_ITEMS = 400;
const keyOf = (sourceId, alias) => `${sourceId}|${alias}`;

function readAll(storage) {
  try {
    const v = JSON.parse(storage.getItem(SHARE_KEY) || "null");
    return v && typeof v === "object" && v.items && typeof v.items === "object" ? v.items : {};
  } catch {
    return {};
  }
}

/** `{ story, approved }` for one student: `story` is null before any edit; `approved` is "" or the approved fragment. */
export function readItem(sourceId, alias, storage = globalThis.localStorage) {
  const item = readAll(storage)[keyOf(sourceId, alias)];
  return item
    ? { story: item.story ? normalizeStory(item.story) : null, approved: typeof item.approved === "string" ? item.approved : "" }
    : { story: null, approved: "" };
}

export function writeItem(sourceId, alias, { story, approved }, storage = globalThis.localStorage) {
  const items = readAll(storage);
  items[keyOf(sourceId, alias)] = { story: normalizeStory(story), approved: approved || "" };
  const keys = Object.keys(items);
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ITEMS))) delete items[k];
  try {
    storage.setItem(SHARE_KEY, JSON.stringify({ v: 1, items }));
    return true;
  } catch {
    return false;
  }
}

/** True when the draft still equals what was approved. */
export const isApproved = (item) => Boolean(item.approved) && item.story && encodeStory(item.story) === item.approved;
