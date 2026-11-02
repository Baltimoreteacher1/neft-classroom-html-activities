import assert from "node:assert/strict";
import {
  aggregateClassHeatmap,
  classifyMisconception,
  decodeMasteryReceipt,
  makeMasteryReceipt,
  makeReceiptQRSVG,
} from "./mastery-receipts.js";

const data = { skillKeys: ["6:ratios", "6:percent"], accuracy: 92, strategyTags: ["visual", "decompose"] };
const code = makeMasteryReceipt(data);
assert.match(code, /^EWL-/);
assert.equal(code, makeMasteryReceipt({ ...data, skillKeys: [...data.skillKeys].reverse(), strategyTags: [...data.strategyTags].reverse() }));
assert.deepEqual(decodeMasteryReceipt(code), { version: 1, skillKeys: ["6:percent", "6:ratios"], accuracy: 92, strategyTags: ["decompose", "visual"] });
assert.throws(() => decodeMasteryReceipt(`${code.slice(0, -1)}0`), /checksum/i);
assert.throws(() => makeMasteryReceipt({ skillKeys: ["9:private"], accuracy: 90 }), /known skill/i);
assert.throws(() => makeMasteryReceipt({ skillKeys: ["6:ratios"], accuracy: 101 }), /whole percent/i);

// Version 2 Telemetry & Misconception test
const v2Data = {
  skillKeys: ["3:mul-6-9", "6:ratios"],
  accuracy: 80,
  strategyTags: ["cra", "decompose"],
  medianLatency: 3200,
  errorTaxonomy: ["symbol_confusion_plus_times"],
  hintsUsed: 2,
};
const v2Code = makeMasteryReceipt(v2Data);
assert.match(v2Code, /^EWL-/);
const decodedV2 = decodeMasteryReceipt(v2Code);
assert.equal(decodedV2.version, 2);
assert.equal(decodedV2.medianLatency, 3200);
assert.deepEqual(decodedV2.errorTaxonomy, ["symbol_confusion_plus_times"]);
assert.equal(decodedV2.hintsUsed, 2);

// Misconception classifier
assert.equal(classifyMisconception({ operator: "×", operandA: 7, operandB: 8, answer: "56" }, "15"), "symbol_confusion_plus_times");
assert.equal(classifyMisconception({ operator: "−", operandA: 12, operandB: 4, answer: "8" }, "7"), "off_by_one_counting");

// Heatmap test
const heatmap = aggregateClassHeatmap([decodedV2]);
assert.equal(heatmap.totalReceipts, 1);
assert.equal(heatmap.misconceptions.symbol_confusion_plus_times, 1);

// QR SVG test
const qr = makeReceiptQRSVG(v2Code, 160);
assert.ok(qr.includes("<svg class=\"cra-qr-svg\""));
assert.ok(qr.includes("viewBox=\"0 0 160 160\""));

console.log("Mastery receipt round-trip, canonicalization, and checksum passed");
