export const STATS_DISPLAY = {
  explore: { label: "How many pets?", kind: "dot", values: [2, 3, 3, 4, 4, 4, 5, 6, 8], min: 0, max: 10, step: 1, stats: ["mean", "median", "iqr"] },
  build: { label: "Build a histogram of quiz scores", kind: "histogram", values: [62, 68, 71, 74, 75, 78, 83, 86, 91], min: 60, max: 100, step: 1, bw: 10, stats: ["mean", "median", "range"] },
  check: { label: "Add values so the mean is 6", kinds: ["dot"], kind: "dot", values: [4, 5, 5, 8], min: 0, max: 12, step: 1, target: { mean: 6 } },
};
