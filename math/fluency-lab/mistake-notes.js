// A short, kind note about the likely slip behind a wrong whole-number answer ("that adds; this asks for the
// difference"). It names the idea to check and never says or hints at the right number.
import { t } from "./i18n.js";

const ARITHMETIC = /^(-?\d[\d,]*) ([+−×÷]) \(?(-?\d[\d,]*)\)? = \?$/;
const num = (text) => Number(String(text).replaceAll(",", "").replace("−", "-"));

export function likelyMistake(item, raw) {
  if (item?.kind !== "number") return "";
  const match = String(item.expr || item.question || "").match(ARITHMETIC);
  const submitted = num(raw);
  const answer = num(item.answers?.[0]);
  if (!match || !Number.isFinite(submitted) || !Number.isFinite(answer) || submitted === answer) return "";
  const [a, b, op] = [num(match[1]), num(match[3]), match[2]];
  const gap = Math.abs(submitted - answer);
  const off = (size) => gap === size;

  if (op === "+") {
    if (submitted === Math.abs(a - b)) return t("That takes the numbers apart. This problem puts them together.");
    if (submitted === a || submitted === b) return t("That is one of the numbers in the problem. Add the other one in too.");
  } else if (op === "−") {
    if (submitted === a + b) return t("That puts the numbers together. This problem asks how much is left or how far apart they are.");
    if (submitted === b - a) return t("Check the order. Start with the whole and take the smaller part away.");
  } else if (op === "×") {
    if (submitted === a + b) return t("That adds the numbers. Multiplying counts equal groups.");
    if (submitted === answer + a || submitted === answer - a || submitted === answer + b || submitted === answer - b)
      return t("You are one group away. Check how many groups there are and how many are in each.");
  } else if (op === "÷") {
    if (submitted === a - b) return t("That takes one group away. Division asks how many equal groups fit.");
    if (submitted === a * b) return t("That multiplies. Division is the opposite: how many times does the small number fit in the big one?");
    if (submitted === a + b) return t("That puts the numbers together. Division splits a total into equal groups.");
  }
  if (off(1)) return t("Close! Count again carefully. You are one away.");
  if (off(10) || off(100) || off(1000)) return t("Check the place values. A ten, hundred, or thousand may have been missed or regrouped wrongly.");
  return "";
}
