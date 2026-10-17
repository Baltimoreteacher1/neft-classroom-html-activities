import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyDocumentRefresh,
  planDocumentRefresh,
} from "../scripts/lib/reveal-document-refresh.mjs";

const root = mkdtempSync(join(tmpdir(), "reveal-refresh-"));
const source = join(root, "masters");
const site = join(root, "site");
mkdirSync(source);
mkdirSync(site);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
try {
  writeFileSync(join(source, "practice.docx"), "updated math");
  writeFileSync(join(site, "practice.docx"), "old math");
  writeFileSync(join(site, "key.pdf"), "retained key");
  const doc = {
    id: "retained-id",
    sources: ["practice.docx"],
    filename: "practice.docx",
    url: "/practice.docx",
    teacherOnly: false,
    category: "practice",
    sha256: sha("old math"),
    bytes: 8,
  };
  const missing = {
    sources: ["moved-key.pdf"],
    filename: "key.pdf",
    url: "/key.pdf",
    teacherOnly: true,
  };
  const manifest = { documents: [doc, missing] };
  const plan = planDocumentRefresh(manifest, source, site);
  assert.equal(plan.changes.length, 1);
  assert.equal(plan.missing.length, 1);
  assert.equal(
    readFileSync(join(site, "practice.docx"), "utf8"),
    "old math",
    "planning writes nothing",
  );
  applyDocumentRefresh(plan);
  assert.equal(readFileSync(join(site, "practice.docx"), "utf8"), "updated math");
  assert.equal(doc.url, "/practice.docx");
  assert.equal(doc.id, "retained-id");
  assert.equal(doc.teacherOnly, false);
  assert.equal(doc.category, "practice");
  assert.equal(doc.sha256, sha("updated math"));
  assert.equal(readFileSync(join(site, "key.pdf"), "utf8"), "retained key");
  assert.equal(missing.teacherOnly, true);
  assert.equal(
    planDocumentRefresh(manifest, source, site).changes.length,
    0,
    "repeat refresh is stable",
  );
  writeFileSync(join(site, "practice.docx"), "damaged");
  assert.equal(
    planDocumentRefresh(manifest, source, site).changes.length,
    1,
    "matching metadata cannot hide damaged bytes",
  );
  writeFileSync(join(source, "duplicate.docx"), "conflicting math");
  assert.throws(
    () =>
      planDocumentRefresh(
        { documents: [{ ...doc, sources: ["practice.docx", "duplicate.docx"] }] },
        source,
        site,
      ),
    /disagree/,
  );
  assert.equal(
    readFileSync(join(site, "practice.docx"), "utf8"),
    "damaged",
    "a conflict causes no partial writes",
  );
  assert.throws(
    () => planDocumentRefresh({ documents: [{ ...doc, url: "/../outside.docx" }] }, source, site),
    /outside/,
  );
  assert.throws(
    () =>
      planDocumentRefresh({ documents: [{ ...doc, sources: ["../outside.docx"] }] }, source, site),
    /outside/,
  );
  console.log(
    "PASS Reveal refresh: current bytes, stable URLs/access, retained archives, conflict preflight, path boundaries, and idempotence",
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
