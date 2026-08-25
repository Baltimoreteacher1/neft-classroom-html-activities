#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyDriveState,
  DRIVE_CLASS,
  summarizeDriveClasses,
} from "../scripts/lib/drive-sync-classify.mjs";

test("unmounted dest is DRIVE UNAVAILABLE", () => {
  const rows = classifyDriveState({ destExists: false, expected: ["a.txt"], present: [] });
  assert.deepEqual(rows, [{ class: DRIVE_CLASS.DRIVE_UNAVAILABLE, path: null }]);
});

test("EACCES is PERMISSION BLOCKED", () => {
  const rows = classifyDriveState({ destExists: true, permissionError: true });
  assert.equal(rows[0].class, DRIVE_CLASS.PERMISSION_BLOCKED);
});

test("leftovers are DESTINATION EXTRA and matching files are SYNCED", () => {
  const rows = classifyDriveState({
    destExists: true,
    expected: ["Lesson 1-1/notes.pdf"],
    present: ["Lesson 1-1/notes.pdf", "STALE leftover.txt"],
  });
  const byClass = Object.groupBy(rows, (r) => r.class);
  assert.equal(byClass[DRIVE_CLASS.DESTINATION_EXTRA][0].path, "STALE leftover.txt");
  assert.equal(byClass[DRIVE_CLASS.SYNCED][0].path, "Lesson 1-1/notes.pdf");
});

test("an expected path absent from dest is DESTINATION MISSING", () => {
  const rows = classifyDriveState({
    destExists: true,
    expected: ["a.pdf", "b.pdf"],
    present: ["a.pdf"],
  });
  assert.ok(rows.some((r) => r.class === DRIVE_CLASS.DESTINATION_MISSING && r.path === "b.pdf"));
});

test("hash mismatch is SOURCE NEWER, not SYNCED", () => {
  const rows = classifyDriveState({
    destExists: true,
    expected: ["notes.pdf"],
    present: ["notes.pdf"],
    sourceNewer: ["notes.pdf"],
  });
  assert.deepEqual(
    rows.filter((r) => r.path === "notes.pdf").map((r) => r.class),
    [DRIVE_CLASS.SOURCE_NEWER],
  );
});

test("mtime-based destination-newer is not a classification — Drive rewrites mtimes", () => {
  assert.ok(!Object.values(DRIVE_CLASS).includes("DESTINATION NEWER"));
});

test("summarize counts every class", () => {
  const counts = summarizeDriveClasses([
    { class: DRIVE_CLASS.SYNCED, path: "a" },
    { class: DRIVE_CLASS.SYNCED, path: "b" },
    { class: DRIVE_CLASS.DESTINATION_EXTRA, path: "c" },
  ]);
  assert.equal(counts[DRIVE_CLASS.SYNCED], 2);
  assert.equal(counts[DRIVE_CLASS.DESTINATION_EXTRA], 1);
  assert.equal(counts[DRIVE_CLASS.DRIVE_UNAVAILABLE], 0);
});
