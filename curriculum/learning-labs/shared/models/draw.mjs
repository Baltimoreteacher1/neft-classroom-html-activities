// SVG building blocks shared by model.mjs and the registered models (one source, so a picture never styles itself differently).
// Colour and stroke come from the lab stylesheet's classes (.shape, .shape-alt, .shape-light, .point, .point-alt, .open-point, .solution,
// .heavy, .dashed, .gridline, .plot); the picture always sits on white, so an inline fill/stroke attribute is also safe.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const line = (x1, y1, x2, y2, cls = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
export const text = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(t)}</text>`;
export const rect = (x, y, w, h, cls = 'shape') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" rx="3"/>`;
export const dot = (x, y, label, cls = 'point') => `<circle cx="${x}" cy="${y}" r="7" class="${cls}"/>${label ? text(x, y - 12, label) : ''}`;
export const svg = (body, label, viewBox = '0 0 600 300') => {
  const parts = viewBox.split(/\s+/);
  return `<svg role="img" aria-label="${esc(label)}" width="${parts[2] || 600}" height="${parts[3] || 300}" viewBox="${viewBox}" style="background:#FFFFFF" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
};
