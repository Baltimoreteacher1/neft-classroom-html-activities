import assert from "node:assert/strict";
import { decodeMasteryReceipt, makeMasteryReceipt } from "./mastery-receipts.js";

const data = { skillKeys: ["6:ratios", "6:percent"], accuracy: 92, strategyTags: ["visual", "decompose"] };
const code = makeMasteryReceipt(data);
assert.match(code, /^EWL-/);
assert.equal(code, makeMasteryReceipt({ ...data, skillKeys: [...data.skillKeys].reverse(), strategyTags: [...data.strategyTags].reverse() }));
assert.deepEqual(decodeMasteryReceipt(code), { version: 1, skillKeys: ["6:percent", "6:ratios"], accuracy: 92, strategyTags: ["decompose", "visual"] });
assert.throws(() => decodeMasteryReceipt(`${code.slice(0, -1)}0`), /checksum/i);
assert.throws(() => makeMasteryReceipt({ skillKeys: ["9:private"], accuracy: 90 }), /known skill/i);
assert.throws(() => makeMasteryReceipt({ skillKeys: ["6:ratios"], accuracy: 101 }), /whole percent/i);
console.log("Mastery receipt round-trip, canonicalization, and checksum passed");
