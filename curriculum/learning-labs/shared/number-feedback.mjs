// Feedback for a wrong number answer. An authored likely mistake wins; otherwise
// recognise the shape of common slips without revealing the answer.
const near = (x, y, tol) => Math.abs(x - y) <= Math.max(tol, Math.abs(y) * 1e-9);

export function numberFeedback(q, n) {
  const a = q.answer, tol = q.tolerance;
  const authored = (q.mistakes || []).find((m) => near(n, m.answer, tol));
  if (authored) return authored.feedback;
  if (a !== 0 && near(n, -a, tol)) return 'Check the sign. Is the answer positive or negative?';
  if (a !== 0 && [10, 100, 1000].some((k) => near(n, a * k, tol) || near(n, a / k, tol)))
    return 'Your digits look right, but the place value is off. Check where the decimal point goes, or whether you need a percent or a decimal.';
  if (a !== 0 && Math.abs(a) !== 1 && near(n, 1 / a, tol)) return 'It looks like the division is flipped. Check which quantity is divided by which.';
  if (a !== 0 && Math.abs(n - a) / Math.abs(a) < 0.02) return 'Very close. Check your rounding and your last step.';
  return null;
}
