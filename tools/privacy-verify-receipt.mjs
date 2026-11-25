#!/usr/bin/env node
// Recompute deletion-receipt digests and check the chain.
//
//   node tools/privacy-verify-receipt.mjs <file.json | ->
//
// The file holds one receipt (an object) or an ordered array of receipts, as returned by
// POST /api/privacy/delete-class|delete-student or exported from privacy_deletion_receipt. Every
// digest is recomputed from scope + counts + deletedAt + priorReceiptDigest; in an array each receipt
// must also follow the one before it. Exit 0 verified, 1 a receipt or link is wrong, 3 tool error.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkReceipt, verifyChain } from "../functions/_lib/privacy/receipt.js";

async function selfTest() {
  const good = {
    scope: { type: "class", code: "AAAAAA" },
    counts: { t: 1 },
    deletedAt: 1,
    priorReceiptDigest: "",
  };
  const { receiptDigest } = await import("../functions/_lib/privacy/receipt.js");
  good.digest = await receiptDigest(good);
  if ((await checkReceipt(good)) !== null) throw new Error("self-test: a good receipt failed");
  if ((await checkReceipt({ ...good, counts: { t: 2 } })) === null)
    throw new Error("self-test: a tampered receipt passed");
}

async function main() {
  const [input] = process.argv.slice(2);
  if (!input) throw new Error("usage: privacy-verify-receipt.mjs <file.json | ->");
  await selfTest();
  const parsed = JSON.parse(readFileSync(input === "-" ? 0 : input, "utf8"));
  const receipts = Array.isArray(parsed) ? parsed : [parsed];
  if (!receipts.length) throw new Error("no receipts in input");
  // A lone receipt is checked on its own digest; its prior link is the chain's concern.
  const errors = Array.isArray(parsed)
    ? await verifyChain(receipts, receipts[0]?.priorReceiptDigest ?? "")
    : [await checkReceipt(parsed)].filter(Boolean);
  for (const e of errors) console.error(`FAIL ${e}`);
  console.log(`privacy-verify-receipt: ${receipts.length} receipt(s), ${errors.length} problem(s)`);
  process.exit(errors.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`privacy-verify-receipt error: ${error.message}`);
    process.exit(3);
  });
}
