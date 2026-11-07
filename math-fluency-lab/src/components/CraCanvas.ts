import { RationalNumber } from '../engine/RationalNumber.js';

export class CraCanvas extends HTMLElement {
  private shadow: ShadowRoot;
  private fraction: RationalNumber = new RationalNumber(3, 4);

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  public updateState(fraction: RationalNumber) {
    this.fraction = fraction;
    this.render();
  }

  private render() {
    const pct = (this.fraction.toDecimal() * 100).toFixed(1);
    
    this.shadow.innerHTML = `
      <style>
        :host { display: block; padding: 16px; background: #FFFFFF; border: 1px solid #D0D7DE; border-radius: 6px; font-family: var(--math-font-family, system-ui, sans-serif); }
        .cra-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: center; }
        .panel { border: 1px solid #F0F2F5; padding: 12px; border-radius: 4px; text-align: center; }
        .tape-container { display: flex; width: 100%; height: 24px; border: 1px solid #1F2328; border-radius: 4px; overflow: hidden; background: #F6F8FA; }
        .tape-fill { background: #0969DA; height: 100%; transition: width 0.2s ease; }
        h4 { margin: 0 0 8px 0; font-size: 13px; color: #57606A; text-transform: uppercase; }
      </style>
      <div class="cra-grid" role="region" aria-label="Synchronized CRA Dynamic Canvas">
        <!-- Concrete Layer (Interactive Tape Diagram) -->
        <div class="panel">
          <h4>Concrete (Visual Tape)</h4>
          <div class="tape-container" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="tape-fill" style="width: ${Math.min(100, parseFloat(pct))}%;"></div>
          </div>
        </div>

        <!-- Representational Layer (SVG Balance) -->
        <div class="panel">
          <h4>Representational (Balance)</h4>
          <svg width="100" height="40" viewBox="0 0 100 40" role="img" aria-label="Proportional Balance Scale">
            <line x1="10" y1="30" x2="90" y2="30" stroke="#1F2328" stroke-width="4"/>
            <polygon points="50,10 40,30 60,30" fill="#0969DA" />
          </svg>
        </div>

        <!-- Abstract Layer (Symbolic Equation) -->
        <div class="panel">
          <h4>Abstract (Symbolic)</h4>
          <span style="font-size: 1.4em; font-weight: bold; color: #1F2328;">
            ${this.fraction.n} / ${this.fraction.d} = ${pct}%
          </span>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('cra-canvas')) {
  customElements.define('cra-canvas', CraCanvas);
}
