// Integrated Scratchpad & Visual Note Slide-Over (shared/scratchpad.mjs)
import { esc } from './model.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

function buildGridMarkup() {
  let lines = '<rect x="0" y="0" width="560" height="320" fill="#FFFFFF"/>';
  for (let x = 40; x < 560; x += 40) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="320" stroke="#e2ecf2" stroke-width="1"/>`;
  }
  for (let y = 40; y < 320; y += 40) {
    lines += `<line x1="0" y1="${y}" x2="560" y2="${y}" stroke="#e2ecf2" stroke-width="1"/>`;
  }
  return `<g class="scratchpad-grid" aria-hidden="true">${lines}</g>`;
}

function strokeToPath(stroke) {
  if (!stroke?.points?.length) return '';
  const d = stroke.points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${Number(x).toFixed(1)} ${Number(y).toFixed(1)}`)
    .join(' ');
  const isHighlighter = stroke.tool === 'highlighter';
  const color = isHighlighter ? '#f5b700' : '#17344b';
  const width = isHighlighter ? 14 : 3;
  const opacity = isHighlighter ? 0.38 : 1;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
}

export function serializeScratchpadSvg(strokes = [], label = 'Student scratchpad sketch') {
  const paths = strokes.map(strokeToPath).join('');
  return `<svg role="img" aria-label="${esc(label)}" width="560" height="320" viewBox="0 0 560 320" style="background:#FFFFFF" xmlns="${SVG_NS}">${buildGridMarkup()}<g class="scratchpad-strokes">${paths}</g></svg>`;
}

export function renderSnapshotsCard(state, onRemove = null) {
  const snapshots = Array.isArray(state.snapshots) ? state.snapshots : [];
  if (!snapshots.length) {
    return `<div class="snapshot-Submission-card" data-snapshots-card><p class="field-hint">No visual scratchpad snapshots attached yet. Open <strong>Scratchpad (Alt+S)</strong> and press <strong>Snapshot to Submission</strong> to attach a diagram.</p></div>`;
  }
  return `<div class="snapshot-submission-card" data-snapshots-card><h4>Attached Visual Scratchpad Notes (${snapshots.length})</h4><div class="snapshot-grid">${snapshots
    .map(
      (snap, i) =>
        `<figure class="snapshot-item" data-snapshot-index="${i}"><div class="snapshot-svg-wrap">${snap.svg}</div><figcaption><strong>Snapshot ${i + 1}:</strong> ${esc(snap.caption || 'Visual strategy note')}${onRemove ? ` <button type="button" class="quiet small" data-remove-snapshot="${i}">Remove</button>` : ''}</figcaption></figure>`,
    )
    .join('')}</div></div>`;
}

export function mountScratchpad(shellEl, ctx) {
  const { state, save } = ctx;
  if (!Array.isArray(state.scratchpadStrokes)) state.scratchpadStrokes = [];
  if (!Array.isArray(state.snapshots)) state.snapshots = [];
  state.scratchpadNote ||= '';

  let drawer = shellEl.querySelector('#scratchpad-drawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'scratchpad-drawer';
    drawer.className = 'scratchpad-drawer';
    drawer.setAttribute('aria-label', 'Scratchpad and Visual Note');
    drawer.hidden = true;
    shellEl.append(drawer);
  }

  let tool = 'pen';
  let drawing = false;
  let activeStroke = null;

  drawer.innerHTML = `<div class="scratchpad-header"><h2 id="scratchpad-title">Scratchpad &amp; Visual Note</h2><button type="button" class="quiet small" id="scratchpad-close" aria-label="Close scratchpad">Close ✕</button></div><p class="field-hint">Sketch a number line, ratio table, or area model. Press <strong>Alt + S</strong> anytime to toggle this drawer.</p><div class="scratchpad-toolbar" role="toolbar" aria-label="Drawing tools"><button type="button" class="small" id="scratchpad-pen" data-tool="pen" aria-pressed="true">✒️ Pen</button><button type="button" class="quiet small" id="scratchpad-highlighter" data-tool="highlighter" aria-pressed="false">🖍️ Highlighter</button><button type="button" class="quiet small" id="scratchpad-undo">↶ Undo</button><button type="button" class="quiet small" id="scratchpad-clear">Clear</button><button type="button" class="small" id="scratchpad-snapshot">📸 Snapshot to Submission</button></div><div id="scratchpad-clear-guard" class="reset-guard" hidden><span>Clear all strokes on the scratchpad?</span><button type="button" class="small" id="scratchpad-clear-confirm">Yes, clear</button><button type="button" class="quiet small" id="scratchpad-clear-cancel">Cancel</button></div><div class="scratchpad-stage"><svg role="img" aria-label="Scratchpad drawing canvas" id="scratchpad-canvas" width="560" height="320" viewBox="0 0 560 320" style="background:#FFFFFF" xmlns="${SVG_NS}">${buildGridMarkup()}<g id="scratchpad-strokes"></g></svg></div><label class="writing scratchpad-caption-label" for="scratchpad-note">Visual note caption (included with snapshot)<input id="scratchpad-note" type="text" value="${esc(state.scratchpadNote)}" placeholder="e.g., Tape diagram showing 3 parts to 2 parts"></label><p id="scratchpad-status" class="field-hint" role="status" aria-live="polite"></p>`;

  const canvas = drawer.querySelector('#scratchpad-canvas');
  const strokesGroup = drawer.querySelector('#scratchpad-strokes');
  const statusEl = drawer.querySelector('#scratchpad-status');
  const noteInput = drawer.querySelector('#scratchpad-note');
  const clearGuard = drawer.querySelector('#scratchpad-clear-guard');

  const renderStrokes = () => {
    strokesGroup.innerHTML = state.scratchpadStrokes.map(strokeToPath).join('');
  };
  renderStrokes();

  const setTool = (nextTool) => {
    tool = nextTool;
    drawer.querySelectorAll('[data-tool]').forEach((btn) => {
      const active = btn.dataset.tool === tool;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('quiet', !active);
    });
  };

  drawer.querySelector('#scratchpad-pen').onclick = () => setTool('pen');
  drawer.querySelector('#scratchpad-highlighter').onclick = () => setTool('highlighter');

  drawer.querySelector('#scratchpad-undo').onclick = () => {
    if (!state.scratchpadStrokes.length) return;
    state.scratchpadStrokes.pop();
    renderStrokes();
    save();
    statusEl.textContent = 'Last stroke undone.';
  };

  drawer.querySelector('#scratchpad-clear').onclick = () => {
    clearGuard.hidden = false;
    drawer.querySelector('#scratchpad-clear-confirm').focus();
  };
  drawer.querySelector('#scratchpad-clear-cancel').onclick = () => {
    clearGuard.hidden = true;
    drawer.querySelector('#scratchpad-clear').focus();
  };
  drawer.querySelector('#scratchpad-clear-confirm').onclick = () => {
    state.scratchpadStrokes = [];
    clearGuard.hidden = true;
    renderStrokes();
    save();
    statusEl.textContent = 'Scratchpad cleared.';
  };

  noteInput.addEventListener('input', () => {
    state.scratchpadNote = noteInput.value;
    save();
  });

  drawer.querySelector('#scratchpad-snapshot').onclick = () => {
    const caption = noteInput.value.trim() || `Sketch (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const svgMarkup = serializeScratchpadSvg(state.scratchpadStrokes, `Scratchpad snapshot: ${caption}`);
    state.snapshots.push({
      id: `snap-${Date.now()}`,
      caption,
      svg: svgMarkup,
      createdAt: Date.now(),
    });
    if (state.snapshots.length > 6) state.snapshots = state.snapshots.slice(-6);
    save();
    statusEl.textContent = 'Snapshot attached to your Final Submission Card in Create and Print Work.';
    ctx.onSnapshot?.();
  };

  const getPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 280, y: 160 };
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    const x = Math.max(4, Math.min(556, ((clientX - rect.left) / rect.width) * 560));
    const y = Math.max(4, Math.min(316, ((clientY - rect.top) / rect.height) * 320));
    return { x, y };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    drawing = true;
    canvas.setPointerCapture?.(e.pointerId);
    const p = getPoint(e);
    activeStroke = { tool, points: [[p.x, p.y]] };
    state.scratchpadStrokes.push(activeStroke);
    renderStrokes();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing || !activeStroke) return;
    const p = getPoint(e);
    activeStroke.points.push([p.x, p.y]);
    renderStrokes();
  });

  const stopDrawing = () => {
    if (!drawing) return;
    drawing = false;
    activeStroke = null;
    save();
  };
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);

  const toggleBtn = shellEl.querySelector('#scratchpad-toggle');
  const setOpen = (open) => {
    drawer.hidden = !open;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(open));
    if (open) drawer.querySelector('#scratchpad-pen')?.focus();
    else toggleBtn?.focus();
  };

  if (toggleBtn) {
    toggleBtn.onclick = () => setOpen(drawer.hidden);
  }
  drawer.querySelector('#scratchpad-close').onclick = () => setOpen(false);

  if (!window.__ewlScratchpadKeyBound) {
    window.__ewlScratchpadKeyBound = true;
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        const currentDrawer = document.getElementById('scratchpad-drawer');
        const currentToggle = document.getElementById('scratchpad-toggle');
        if (!currentDrawer) return;
        e.preventDefault();
        const nextOpen = currentDrawer.hidden;
        currentDrawer.hidden = !nextOpen;
        currentToggle?.setAttribute('aria-expanded', String(nextOpen));
      }
    });
  }

  return {
    reset() {
      state.scratchpadStrokes = [];
      state.snapshots = [];
      state.scratchpadNote = '';
      renderStrokes();
      noteInput.value = '';
    },
  };
}
