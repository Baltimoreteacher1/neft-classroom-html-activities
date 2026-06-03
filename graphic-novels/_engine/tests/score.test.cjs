// Mirrors the tracker's section split: math groups vs reading groups (data-score-group="reading").
function splitScore(groups) {
  const math = groups.filter((g) => g.group !== "reading");
  const reading = groups.filter((g) => g.group === "reading");
  const tally = (arr) => ({ correct: arr.filter((g) => g.correct).length, total: arr.length });
  return { math: tally(math), reading: tally(reading) };
}
const groups = [
  { group: null, correct: true }, { group: null, correct: false },
  { group: "reading", correct: true }, { group: "reading", correct: true }, { group: "reading", correct: false },
];
const r = splitScore(groups);
const ok = r.math.correct === 1 && r.math.total === 2 && r.reading.correct === 2 && r.reading.total === 3;
console.log(ok ? "PASS" : "FAIL", JSON.stringify(r));
process.exit(ok ? 0 : 1);
module.exports = { splitScore };
