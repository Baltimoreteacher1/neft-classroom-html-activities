// Waveform drawing for finished takes. Built from the loudness envelope the recorder
// already keeps on-device (ENVELOPE_FPS samples per second). Pure functions, no DOM,
// so the shape can be tested in Node. Output is numbers only, safe to inject as markup.

// Reduce an envelope (values 0..1) to `bars` peaks. Each bar keeps the loudest sample
// in its slice, so short consonant bursts still show.
export function peaks(env, bars = 48) {
  const values = Array.isArray(env) ? env : [];
  const count = Math.max(1, Math.floor(bars));
  const out = new Array(count).fill(0);
  if (!values.length) return out;
  for (let i = 0; i < values.length; i++) {
    const bar = Math.min(count - 1, Math.floor((i * count) / values.length));
    const v = Number(values[i]);
    if (Number.isFinite(v)) out[bar] = Math.max(out[bar], Math.min(1, Math.max(0, v)));
  }
  return out;
}

// SVG with one rounded bar per peak. Heights are at least 1 unit so silence still shows a baseline.
export function waveformSVG(env, { bars = 48, height = 40, barWidth = 3, gap = 2 } = {}) {
  const values = peaks(env, bars);
  const width = values.length * (barWidth + gap) - gap;
  const rects = values
    .map((v, i) => {
      const h = Math.max(1, Math.round(v * height));
      const y = (height - h) / 2;
      return `<rect x="${i * (barWidth + gap)}" y="${y}" width="${barWidth}" height="${h}" rx="1.5"/>`;
    })
    .join("");
  return `<svg class="wave" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false" preserveAspectRatio="none">${rects}</svg>`;
}
