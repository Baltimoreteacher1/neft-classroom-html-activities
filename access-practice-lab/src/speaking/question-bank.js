const hash = (value) => [...String(value)].reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
export const validBankItem = (item) => Boolean(item && typeof item.id === "string" && item.id.length <= 80 && item.prompt?.en?.trim() && item.prompt?.es?.trim() && ["Narrate", "Inform", "Explain", "Argue"].includes(item.klu));
export const validateBank = (items) => Array.isArray(items) && items.every(validBankItem) && new Set(items.map((x) => x.id)).size === items.length;
/** Stable subset for an alias and attempt number; retry changes seed, no score is derived. */
export function drawPool(items, size, alias, attempt = 0) {
  if (!validateBank(items)) throw new TypeError("Question bank has an invalid item.");
  const count = Number(size);
  if (!Number.isInteger(count) || count < 1 || count > items.length) throw new RangeError("Pool size is out of bounds.");
  let seed = hash(`${alias}:${attempt}`) || 1;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; const j = (seed >>> 0) % (i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy.slice(0, count);
}
