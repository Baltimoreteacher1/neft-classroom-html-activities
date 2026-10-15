// Turn a live model picture into a PNG the student can keep: the SVG is rendered with the page's own styling
// (computed styles are copied onto a clone), captioned with the lab name and the model's equation.
const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-family', 'font-size', 'font-weight', 'text-anchor'];

export function inlineStyles(source, clone) {
  const from = [source, ...source.querySelectorAll('*')], to = [clone, ...clone.querySelectorAll('*')];
  from.forEach((el, i) => {
    const cs = getComputedStyle(el);
    to[i].setAttribute('style', STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
  });
}

export function serialize(svg, caption) {
  const vb = svg.viewBox.baseVal;
  const clone = svg.cloneNode(true);
  inlineStyles(svg, clone);
  const pad = 46;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height + pad}`);
  clone.setAttribute('width', String(vb.width * 2)); clone.setAttribute('height', String((vb.height + pad) * 2));
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', vb.x); bg.setAttribute('y', vb.y); bg.setAttribute('width', vb.width); bg.setAttribute('height', vb.height + pad); bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', vb.x + vb.width / 2); text.setAttribute('y', vb.y + vb.height + 30); text.setAttribute('text-anchor', 'middle');
  text.setAttribute('style', 'font:700 16px Nunito,Arial,sans-serif;fill:#17324d'); text.textContent = caption;
  clone.append(text);
  return new XMLSerializer().serializeToString(clone);
}

/** Resolves with a PNG Blob of the svg plus caption. */
export function toPng(svg, caption) {
  const xml = serialize(svg, caption);
  const vb = svg.viewBox.baseVal;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = vb.width * 2; canvas.height = (vb.height + 46) * 2;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not make the picture'))), 'image/png');
    };
    img.onerror = () => reject(new Error('Could not draw the model'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  });
}
