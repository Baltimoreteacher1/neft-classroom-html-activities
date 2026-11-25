// "Delete this class" and "delete this student alias", as pure functions over a D1 binding.
//
//   deleteClass(db, { code, actor, now })              -> { receipt, counts }
//   deleteStudent(db, { code, studentId, actor, now }) -> { receipt, counts }
//
// The deletes run as ONE db.batch (a single transaction on D1) in the order of DELETE_PLAN, children
// before parents, and the per-table row counts come from each statement's own `meta.changes`, so the
// receipt reports exactly what that transaction removed. The receipt is appended afterwards to the
// append-only privacy_deletion_receipt table, chained to the previous receipt's digest.
//
// A receipt holds the scope (class code, opaque student id), counts per table and a time. It never
// holds an alias, a name or any answer. Authorisation is the caller's job (the endpoints reuse the
// class API's teacher credential); this module only deletes.
import { receiptDigest } from "./receipt.js";
import { scopeClauses } from "./tables.js";

const ACTORS = new Set(["teacher", "site", "retention"]);
const APPEND_ATTEMPTS = 4;

const randomId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `r${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
};

function validScope(scope) {
  if (!/^[A-Z2-9]{6}$/.test(scope?.code ?? "")) throw new Error("invalid class code");
  if (scope.type === "student" && !/^s[a-f0-9]{10}$/.test(scope.studentId ?? ""))
    throw new Error("invalid student id");
  if (scope.type !== "class" && scope.type !== "student") throw new Error("invalid scope type");
}

/** Run the batch for one scope and return { counts } with one entry per table in DELETE_PLAN order. */
async function runDeletes(db, scope) {
  const clauses = scopeClauses(scope);
  const results = await db.batch(
    clauses.map(({ table, where, binds }) =>
      db.prepare(`DELETE FROM ${table} WHERE ${where}`).bind(...binds),
    ),
  );
  if (!Array.isArray(results) || results.length !== clauses.length)
    throw new Error("delete batch returned an unexpected result");
  const counts = {};
  clauses.forEach(({ table }, i) => {
    const changes = results[i]?.meta?.changes;
    if (!Number.isInteger(changes)) throw new Error(`no row count for ${table}`);
    counts[table] = changes;
  });
  return counts;
}

/** Append one receipt, retrying when another writer took the chain head first. */
export async function appendReceipt(db, { scope, counts, deletedAt, actor }) {
  for (let attempt = 1; ; attempt++) {
    const head = await db
      .prepare("SELECT digest FROM privacy_deletion_receipt ORDER BY seq DESC LIMIT 1")
      .first();
    const priorReceiptDigest = head?.digest ?? "";
    const digest = await receiptDigest({ scope, counts, deletedAt, priorReceiptDigest });
    const id = randomId();
    try {
      await db
        .prepare(
          `INSERT INTO privacy_deletion_receipt
             (id, scope_type, class_code, student_id, counts_json, deleted_at, actor, prior_digest, digest)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
        )
        .bind(
          id,
          scope.type,
          scope.code,
          scope.type === "student" ? scope.studentId : null,
          JSON.stringify(counts),
          deletedAt,
          actor,
          priorReceiptDigest,
          digest,
        )
        .run();
      return { id, scope, counts, deletedAt, priorReceiptDigest, digest, actor };
    } catch (error) {
      if (attempt < APPEND_ATTEMPTS && /UNIQUE/i.test(String(error?.message))) continue;
      throw error;
    }
  }
}

async function deleteScope(db, scope, { actor, now }) {
  validScope(scope);
  if (!ACTORS.has(actor)) throw new Error("invalid actor");
  // Refuse before deleting anything if the receipt table is missing (migration 0020 not applied):
  // a deletion without proof is not allowed to happen.
  await db.prepare("SELECT 1 FROM privacy_deletion_receipt LIMIT 1").first();
  const counts = await runDeletes(db, scope);
  const total = Object.values(counts).reduce((n, c) => n + c, 0);
  // Nothing matched: there is nothing to prove, so no receipt (a repeat call is a safe no-op).
  if (total === 0) return { receipt: null, counts };
  try {
    const receipt = await appendReceipt(db, { scope, counts, deletedAt: now, actor });
    return { receipt, counts };
  } catch (cause) {
    // The rows are already gone. Say so, with the counts, so the caller can record the deletion.
    throw Object.assign(new Error("deleted but the receipt could not be written", { cause }), {
      deleted: true,
      counts,
    });
  }
}

export const deleteClass = (db, { code, actor, now = Date.now() }) =>
  deleteScope(db, { type: "class", code }, { actor, now });

export const deleteStudent = (db, { code, studentId, actor, now = Date.now() }) =>
  deleteScope(db, { type: "student", code, studentId }, { actor, now });
