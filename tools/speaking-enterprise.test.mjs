import assert from "node:assert/strict";
import test from "node:test";
import {
  EmailTransport,
  LinkTransport,
  OutboxOnlyTransport,
} from "../access-practice-lab/src/program/letter-transport.js";
import { drawPool, validateBank } from "../access-practice-lab/src/speaking/question-bank.js";

const bank = Array.from({ length: 8 }, (_, i) => ({
  id: `q-${i}`,
  prompt: { en: `Prompt ${i}`, es: `Consigna ${i}` },
  klu: ["Narrate", "Inform", "Explain", "Argue"][i % 4],
}));

test("question bank schema is bilingual and alias-seeded pools vary on retake", () => {
  assert.equal(validateBank(bank), true);
  assert.equal(validateBank([bank[0], bank[0]]), false);
  assert.deepEqual(drawPool(bank, 4, "alias", 0), drawPool(bank, 4, "alias", 0));
  assert.notDeepEqual(drawPool(bank, 6, "alias", 0), drawPool(bank, 6, "alias", 1));
  assert.throws(() => drawPool(bank, 0, "alias"), RangeError);
});

test("family letters queue locally and provider routes remain behind STOP", async () => {
  const queued = [];
  await new OutboxOnlyTransport().send({ title: "Notice", body: "Draft" }, (record) =>
    queued.push(record),
  );
  assert.equal(queued[0].status, "draft-local");
  assert.equal(queued.length, 1);
  await assert.rejects(new EmailTransport().send({}), /STOP/);
  await assert.rejects(new LinkTransport().createToken({}), /STOP/);
});
