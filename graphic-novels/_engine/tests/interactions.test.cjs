function evidenceCorrect(choices, pickedIndex) { return choices[pickedIndex] && choices[pickedIndex].correct === true; }
const ev = [{ en: "line A", correct: false }, { en: "line B", correct: true }];
const okE = evidenceCorrect(ev, 1) === true && evidenceCorrect(ev, 0) === false;
console.log("evidence", okE ? "PASS" : "FAIL");
if (!okE) process.exit(1);
module.exports = Object.assign(module.exports || {}, { evidenceCorrect });

function sequenceCorrect(items, currentOrderIdx) {
  for (var i = 1; i < currentOrderIdx.length; i++)
    if (items[currentOrderIdx[i]].order < items[currentOrderIdx[i - 1]].order) return false;
  return true;
}
const seqItems = [{ en: "first", order: 1 }, { en: "second", order: 2 }, { en: "third", order: 3 }];
const okS = sequenceCorrect(seqItems, [0, 1, 2]) === true && sequenceCorrect(seqItems, [2, 0, 1]) === false;
console.log("sequence", okS ? "PASS" : "FAIL");
if (!okS) process.exit(1);
module.exports = Object.assign(module.exports || {}, { sequenceCorrect });
