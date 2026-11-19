// Reading preferences change the surrounding stage, never the author's page colours or typography.
export const READER_ATMOSPHERES = ['daylight', 'evening'];
export const readerAtmosphere = (value) => READER_ATMOSPHERES.includes(value) ? value : 'daylight';
export function pagePosition(value, count) {
  const total = Number.isFinite(Number(count)) ? Math.max(1, Math.floor(Number(count))) : 1;
  const requested = Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0;
  const page = Math.max(0, Math.min(total - 1, requested));
  return { page, total, fraction: (page + 1) / total };
}
