/**
 * System-Wide Diagnostics Overlay HUD
 * Toggled via Ctrl + Shift + D.
 * Displays state machines, memory heap, telemetry deltas, and logs zero console errors.
 */

class DiagnosticsHUD {
  constructor() {
    this.visible = false;
    this.entries = new Map();
    this.dom = null;
    this._initKeyboardListener();
  }

  _initKeyboardListener() {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this.render();
    } else if (this.dom) {
      this.dom.style.display = "none";
    }
  }

  registerState(moduleName, getterFn) {
    this.entries.set(moduleName, getterFn);
    if (this.visible) this.render();
  }

  render() {
    if (typeof document === "undefined") return;
    if (!this.dom) {
      this.dom = document.createElement("aside");
      this.dom.id = "diagnostics-telemetry-hud";
      this.dom.setAttribute("role", "dialog");
      this.dom.setAttribute("aria-label", "System Diagnostics Telemetry");
      this.dom.style.cssText = `
        position: fixed;
        bottom: 16px;
        right: 16px;
        width: 380px;
        max-height: 520px;
        overflow-y: auto;
        background: rgba(15, 23, 42, 0.95);
        color: #38bdf8;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.4;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #0284c7;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        z-index: 999999;
      `;
      document.body.appendChild(this.dom);
    }

    this.dom.style.display = "block";
    let heapInfo = "N/A";
    if (typeof performance !== "undefined" && performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
      const totalMB = (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2);
      heapInfo = `${usedMB} MB / ${totalMB} MB`;
    }

    let modulesHTML = "";
    for (const [name, getter] of this.entries.entries()) {
      let stateVal = "Error retrieving state";
      try {
        stateVal = JSON.stringify(getter(), null, 2);
      } catch (err) {
        stateVal = String(err);
      }
      modulesHTML += `
        <div style="margin-top: 12px; border-top: 1px dashed #334155; padding-top: 8px;">
          <strong style="color: #f8fafc;">${name}</strong>
          <pre style="margin: 4px 0 0 0; color: #a5f3fc; overflow-x: auto; max-height: 140px; background: #090d16; padding: 6px; border-radius: 4px;">${stateVal}</pre>
        </div>
      `;
    }

    this.dom.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #0284c7; padding-bottom: 8px;">
        <span style="font-weight: 700; color: #f8fafc; font-size: 13px;">DIAGNOSTICS HUD</span>
        <button id="close-diagnostics-hud" style="background: transparent; border: 1px solid #475569; color: #94a3b8; border-radius: 4px; padding: 2px 6px; cursor: pointer;">✕ Esc</button>
      </div>
      <div style="margin-top: 8px; color: #94a3b8;">
        <div>JS Heap: <span style="color: #f8fafc;">${heapInfo}</span></div>
        <div>Timestamp: <span style="color: #f8fafc;">${new Date().toISOString()}</span></div>
        <div>Hotkey: <span style="color: #fbbf24;">Ctrl + Shift + D</span></div>
      </div>
      <div id="diagnostics-modules-list">
        ${modulesHTML || '<div style="margin-top: 10px; color: #64748b;">No active modules registered.</div>'}
      </div>
    `;

    const closeBtn = this.dom.querySelector("#close-diagnostics-hud");
    if (closeBtn) {
      closeBtn.onclick = () => this.toggle();
    }
  }
}

export const diagnostics = new DiagnosticsHUD();
