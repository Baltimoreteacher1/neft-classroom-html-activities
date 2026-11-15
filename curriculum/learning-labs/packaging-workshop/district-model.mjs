export const SITUATIONS = [
  { name: 'Make a capacity', prompt: 'Design a building with exactly 24 cubic units of space.' },
  { name: 'Fit the site', prompt: 'The plot holds at most 12 square units of footprint and the height limit is 4 units. Make at least 36 cubic units of space.' },
  { name: 'Same volume, new footprint', prompt: 'A 3 × 4 × 2 building has volume 24 and footprint 12. Build another 24-cubic-unit design with a different footprint.' },
];

export function design(length, width, height) {
  if (![length, width, height].every((n) => Number.isInteger(n) && n >= 1 && n <= 6)) throw new RangeError('Dimensions must be whole numbers from 1 to 6.');
  return { length, width, height, footprint: length * width, volume: length * width * height };
}

export function evaluate(situation, d) {
  if (situation === 0) return d.volume === 24 ? 'met' : 'volume';
  if (situation === 1) return d.footprint > 12 ? 'footprint' : d.height > 4 ? 'height' : d.volume < 36 ? 'capacity' : 'met';
  if (situation === 2) return d.volume !== 24 ? 'volume' : d.footprint === 12 ? 'same-footprint' : 'met';
  throw new RangeError('Choose a listed situation.');
}
