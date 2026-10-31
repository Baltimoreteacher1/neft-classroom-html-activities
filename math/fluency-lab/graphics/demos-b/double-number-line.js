const recipe = { ratio: { a: 2, b: 5 }, max: 10, step: 1, topLabel: "Cups of flour", bottomLabel: "Cookies" };
export const DOUBLE_NUMBER_LINE = {
  explore: { ...recipe, label: "Cookie recipe", marks: [3] },
  build: { ...recipe, label: "Mark equivalent ratios for 2 cups to 5 cookies", fixed: [{ top: 2 }] },
  check: {
    ...recipe,
    label: "Mark the position where the bottom line reads 15",
    fixed: [{ top: 2 }],
    hide: "top",
    showRate: false,
    target: { bottom: 15 },
  },
};
