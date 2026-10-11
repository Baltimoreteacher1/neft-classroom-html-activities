// Strategy of the day and the "how did you think about it?" teach-back. Strategies are ways of thinking,
// never answers: the examples use numbers that are not the learner's current problem.
export const STRATEGIES = {
  know: { label: "I just knew it", icon: "💡" },
  count: { label: "I counted", icon: "👆" },
  picture: { label: "I used a picture or model", icon: "🖼️" },
  friendly: { label: "I used a friendly number", icon: "🔟" },
  apart: { label: "I broke the numbers apart", icon: "🧩" },
  fact: { label: "I used a fact I know", icon: "🧠" },
  check: { label: "I estimated, then checked", icon: "✅" },
};

export const TEACH_BACK = {
  early: ["know", "count", "picture", "friendly"],
  middle: ["know", "fact", "apart", "picture", "friendly"],
  upper: ["know", "apart", "picture", "fact", "check"],
};

export const TIPS = {
  early: [
    { title: "Count on from the bigger number", tip: "For 3 + 7, start at 7 and count on: 8, 9, 10." },
    { title: "Make a ten", tip: "For 8 + 5, take 2 from the 5 to make 10, then add the 3 left." },
    { title: "Use a double", tip: "6 + 6 = 12, so 6 + 7 is one more." },
    { title: "Think of the partner", tip: "If you know 4 + 3 = 7, you also know 7 − 3." },
  ],
  middle: [
    { title: "Break a factor apart", tip: "For 6 × 7, think 6 × 5 and 6 × 2, then put them together." },
    { title: "Build from a fact you know", tip: "×4 is a double of ×2. ×9 is one group less than ×10." },
    { title: "Use a friendly number", tip: "For 99 + 46, think 100 + 46, then take 1 back." },
    { title: "Use multiplication to divide", tip: "To find 56 ÷ 7, ask: 7 times what makes 56?" },
  ],
  upper: [
    { title: "Break apart by place value", tip: "For 4 × 38, think 4 × 30 and 4 × 8." },
    { title: "Use a benchmark", tip: "50%, 25%, and 10% are easy. Build other percents from them." },
    { title: "Estimate first, then check", tip: "Round the numbers to guess the size of the answer, then see if yours is close." },
    { title: "Undo to check", tip: "Check a division by multiplying back. Check a subtraction by adding." },
  ],
};

export const tipOfDay = (band, time = Date.now()) => {
  const list = TIPS[band];
  return list[Math.floor(time / 86400000) % list.length];
};
