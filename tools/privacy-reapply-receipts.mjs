#!/usr/bin/env node
// After a backup restore, deleted data must not quietly come back. This tool reads the deletion
// receipts and shows what a restored copy of the database holds for each receipt's scope. DRY RUN ONLY:
// it opens the database read-only, prints what applying the receipts WOULD delete, and changes nothing.
// docs/privacy/restore-policy.md describes the procedure that follows from the output.
//
//   node tools/privacy-reapply-receipts.mjs --dry-run --receipts <receipts.json> --db <restored.sqlite>
//
// --receipts  ordered JSON array of receipts exported from privacy_deletion_receipt BEFORE the restore
// --db        a SQLite file of the restored backup (the `backup:d1` replay writes one)
// Exit 0 plan printed, 1 the receipt chain is broken, 3 usage or tool error (including no --dry-run).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { verifyChain } from "../functions/_lib/privacy/receipt.js";
import { scopeClauses } from "../functions/_lib/privacy/tables.js";

function arg(name) {
  const at = process.argv.indexOf(name);
  return at > 0 ? process.argv[at + 1] : undefined;
}

async function main() {
  if (!process.argv.includes("--dry-run"))
    throw new Error("only --dry-run is implemented; applying receipts is a reviewed manual step");
  const receiptsPath = arg("--receipts");
  const dbPath = arg("--db");
  if (!receiptsPath || !dbPath)
    throw new Error("usage: --dry-run --receipts <file.json> --db <restored.sqlite>");
  const receipts = JSON.parse(readFileSync(receiptsPath, "utf8"));
  if (!Array.isArray(receipts) || !receipts.length)
    throw new Error("--receipts must be a non-empty JSON array");
  const errors = await verifyChain(receipts, receipts[0].priorReceiptDigest ?? "");
  if (errors.length) {
    for (const e of errors) console.error(`FAIL ${e}`);
    console.error("the receipt chain is not intact; do not trust it to drive a re-delete");
    process.exit(1);
  }
  const db = new DatabaseSync(dbPath, { readOnly: true });
  let resurrected = 0;
  for (const receipt of receipts) {
    const label =
      receipt.scope.type === "student"
        ? `student ${receipt.scope.studentId} in class ${receipt.scope.code}`
        : `class ${receipt.scope.code}`;
    const hits = [];
    for (const { table, where, binds } of scopeClauses(receipt.scope)) {
      const n = Number(
        db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get(...binds).n,
      );
      if (n) hits.push(`${table}=${n}`);
      resurrected += n;
    }
    console.log(
      hits.length
        ? `WOULD DELETE ${label} (receipt ${receipt.id}, deleted ${new Date(receipt.deletedAt).toISOString()}): ${hits.join(" ")}`
        : `clean ${label} (receipt ${receipt.id}): nothing to delete`,
    );
  }
  db.close();
  console.log(
    `privacy-reapply-receipts (dry run): ${receipts.length} receipt(s), ${resurrected} row(s) would be deleted; nothing was changed`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`privacy-reapply-receipts error: ${error.message}`);
    process.exit(3);
  });
}
