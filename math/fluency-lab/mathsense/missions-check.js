// Marks a mission attempt with exact arithmetic and names the slip. Pure apart from `t` (the Spanish lookup).
// A correct answer is decided by value (never by comparing strings or floats); feedback never states the answer.
import { t } from "../i18n.js";
import { abs, cmp, decimalText, eq, fractionText, fromKey, make, parse } from "./exact.js";

export const FORM_NAMES = {
  decimal: "decimal",
  percent: "percent",
  fraction: "fraction",
  mixed: "mixed number",
  integer: "whole number",
};
const formName = (form) => t(FORM_NAMES[form]);

const gcd = (a, b) => (b === 0n ? a : gcd(b, a % b));

// Lowest terms is a fact about what was TYPED (6/12 and 1/2 are equal, but only one is in lowest terms).
export function isLowestTerms(raw) {
  const match = /(\d+)\s*\/\s*(\d+)\s*$/.exec(String(raw));
  return !match || gcd(BigInt(match[1]), BigInt(match[2])) === 1n;
}

const wrong = (id, message) => ({ ok: false, id, message });
const right = (mission) => ({ ok: true, id: "correct", message: t(mission.done) });

const slipFor = (mission, submission) =>
  mission.slips.find(
    ({ when }) =>
      (when.value === undefined ||
        (submission.value && eq(submission.value, fromKey(when.value)))) &&
      (when.parts === undefined || submission.parts === when.parts),
  );

function checkSet(mission, sub) {
  const want = fromKey(mission.target.value);
  const wantParts = mission.target.parts ?? null;
  if (eq(sub.value, want) && (wantParts === null || sub.parts === wantParts)) return right(mission);
  const slip = slipFor(mission, sub);
  if (slip) return wrong("slip", t(slip.say));
  if (eq(sub.value, want)) {
    return wrong(
      "partition",
      t(
        "The amount is right, but this task asks for {parts} equal pieces and the bar has {have}.",
        { parts: wantParts, have: sub.parts },
      ),
    );
  }
  return wrong(
    cmp(sub.value, want) < 0 ? "too-small" : "too-large",
    cmp(sub.value, want) < 0
      ? t(
          "The amount shaded is less than the amount in the task. Compare your marker with the marks on the number line.",
        )
      : t(
          "The amount shaded is greater than the amount in the task. Compare your marker with the marks on the number line.",
        ),
  );
}

function checkBetween(mission, sub) {
  const lo = fromKey(mission.target.lo);
  const hi = fromKey(mission.target.hi);
  if (cmp(sub.value, lo) > 0 && cmp(sub.value, hi) < 0) return right(mission);
  if (eq(sub.value, lo) || eq(sub.value, hi))
    return wrong(
      "endpoint",
      t("That is one of the two amounts in the task. Between means equal to neither of them."),
    );
  return cmp(sub.value, lo) < 0
    ? wrong(
        "too-small",
        t(
          "That amount is less than both of the amounts in the task. It has to fall between them on the number line.",
        ),
      )
    : wrong(
        "too-large",
        t(
          "That amount is greater than both of the amounts in the task. It has to fall between them on the number line.",
        ),
      );
}

export const PARSE_MESSAGES = {
  empty: "Type your answer in the box first.",
  ellipsis:
    "Three dots do not say which digits repeat. Put the repeating digits in brackets, like 0.(7).",
  negative: "Amounts in this workspace start at 0.",
  range: "That is more than 5 wholes, and this workspace stops at 5.",
  zero: "A denominator cannot be 0.",
  toolong: "That number has too many digits.",
  format:
    "I could not read that. Try a fraction like 3/4, a decimal like 0.75, or a percent like 75%.",
};

function checkType(mission, sub) {
  const parsed = parse(sub.raw);
  if (!parsed.ok)
    return wrong("unreadable", t(PARSE_MESSAGES[parsed.code] ?? PARSE_MESSAGES.format));
  const want = fromKey(mission.target.value);
  const { form, lowest = false } = mission.target;
  if (eq(parsed.value, want)) {
    const typedForm = parsed.form;
    const formOk = typedForm === form || (typedForm === "integer" && form !== "percent");
    if (!formOk) {
      return wrong(
        "wrong-form",
        t("The value is right, but this task asks for a {form}. You wrote a {typed}.", {
          form: formName(form),
          typed: formName(typedForm),
        }),
      );
    }
    if (lowest && !isLowestTerms(sub.raw)) {
      return wrong(
        "not-lowest",
        t(
          "That is equal to the amount in the task, but it is not in lowest terms. Look for a number that divides both the top and the bottom.",
        ),
      );
    }
    return right(mission);
  }
  const slip = slipFor(mission, { value: parsed.value });
  if (slip) return wrong("slip", t(slip.say));
  const wantInfo = decimalText(want);
  const typedInfo = decimalText(parsed.value);
  const places =
    String(sub.raw)
      .split(/[.,]/)[1]
      ?.replace(/[^0-9]/g, "").length ?? 0;
  if (
    !wantInfo.terminating &&
    parsed.form === "decimal" &&
    !parsed.repeating &&
    typedInfo.terminating &&
    places > 0
  ) {
    if (
      cmp(
        abs(make(parsed.value.n * want.d - want.n * parsed.value.d, parsed.value.d * want.d)),
        make(1n, 10n ** BigInt(places)),
      ) <= 0
    ) {
      return wrong(
        "rounded",
        t(
          "{typed} stops, so it equals exactly {fraction}. That is close to the amount in the task, but it is not equal to it.",
          { typed: String(sub.raw).trim(), fraction: fractionText(parsed.value) },
        ),
      );
    }
  }
  return cmp(parsed.value, want) < 0
    ? wrong(
        "too-small",
        t(
          "What you wrote is less than the amount in the task. Check it against the marker on the number line.",
        ),
      )
    : wrong(
        "too-large",
        t(
          "What you wrote is greater than the amount in the task. Check it against the marker on the number line.",
        ),
      );
}

function checkChoose(mission, sub) {
  if (sub.index === mission.answer) return right(mission);
  const say = mission.options[sub.index]?.say;
  return wrong(
    "slip",
    say ? t(say) : t("That is not it. Check each choice against the workspace."),
  );
}

export function checkMission(mission, sub) {
  if (mission.kind === "set") return checkSet(mission, sub);
  if (mission.kind === "between") return checkBetween(mission, sub);
  if (mission.kind === "type") return checkType(mission, sub);
  return checkChoose(mission, sub);
}

export const hintText = (mission, index) => t(mission.hints[index]);
