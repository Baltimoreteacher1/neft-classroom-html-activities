class FamilyVisualizer extends HTMLElement {
  connectedCallback() {
    const type = this.getAttribute('type') || 'default';
    this.style.display = 'block';
    this.style.marginTop = '16px';
    this.style.padding = '16px';
    this.style.background = 'var(--cream)';
    this.style.borderRadius = '8px';
    this.style.textAlign = 'center';
    
    if (type === 'geometry') {
      this.innerHTML = `
        <div style="font-weight:600;color:var(--navy);margin-bottom:8px;">Interactive Net (Click to Fold)</div>
        <svg width="150" height="150" viewBox="0 0 100 100" style="cursor:pointer;" id="geom-svg">
          <!-- A simple cross/net for a cube -->
          <rect x="35" y="5" width="30" height="30" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="2"/>
          <rect x="5" y="35" width="30" height="30" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="2"/>
          <rect x="35" y="35" width="30" height="30" fill="var(--amber-light)" stroke="var(--amber)" stroke-width="2"/>
          <rect x="65" y="35" width="30" height="30" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="2"/>
          <rect x="35" y="65" width="30" height="30" fill="var(--teal-light)" stroke="var(--teal)" stroke-width="2"/>
        </svg>
        <div style="font-size:13px;color:var(--muted);">Visualizing 3D shapes as 2D nets helps solve surface area.</div>
      `;
      let folded = false;
      this.querySelector('#geom-svg').onclick = function() {
        folded = !folded;
        this.style.transform = folded ? 'scale(0.8) rotate3d(1, 1, 0, 45deg)' : 'scale(1) rotate3d(0,0,0,0deg)';
        this.style.transition = 'transform 0.5s ease';
      };
    } else {
      this.innerHTML = `
        <div style="font-weight:600;color:var(--navy);margin-bottom:8px;">The Algebra Scale</div>
        <div style="display:flex; justify-content:space-around; align-items:center; max-width: 200px; margin: 0 auto; padding: 12px; border-bottom: 3px solid var(--teal); position: relative;">
          <div style="width: 40px; height: 40px; background: var(--amber); border-radius: 4px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">x</div>
          <div style="font-weight:bold; color:var(--navy); font-size:20px;">=</div>
          <div style="width: 40px; height: 40px; background: var(--teal); border-radius: 50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">8</div>
          <div style="position: absolute; bottom: -12px; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 10px solid var(--teal);"></div>
        </div>
        <div style="font-size:13px;color:var(--muted);margin-top:12px;">Whatever you do to one side, you must do to the other to keep it balanced.</div>
      `;
    }
  }
}
customElements.define('family-visualizer', FamilyVisualizer);
