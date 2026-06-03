function evidenceCorrect(choices, pickedIndex) { return choices[pickedIndex] && choices[pickedIndex].correct === true; }
const ev = [{ en: "line A", correct: false }, { en: "line B", correct: true }];
const okE = evidenceCorrect(ev, 1) === true && evidenceCorrect(ev, 0) === false;
console.log("evidence", okE ? "PASS" : "FAIL");
if (!okE) process.exit(1);
module.exports = Object.assign(module.exports || {}, { evidenceCorrect });
