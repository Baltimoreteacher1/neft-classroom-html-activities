import { RationalNumber } from '../engine/RationalNumber.js';

export class StackedFraction extends HTMLElement {
  private shadow: ShadowRoot;
  private _state: RationalNumber = new RationalNumber(1, 2);

  static get observedAttributes() {
    return ['numerator', 'denominator', 'interactive'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      const num = parseInt(this.getAttribute('numerator') || '1', 10);
      const den = parseInt(this.getAttribute('denominator') || '2', 10);
      this._state = new RationalNumber(num, den);
      this.render();
    }
  }

  public setFraction(value: RationalNumber) {
    this._state = value;
    this.setAttribute('numerator', value.n.toString());
    this.setAttribute('denominator', value.d.toString());
    this.render();
    this.dispatchEvent(new CustomEvent('fraction-change', { detail: { fraction: value }, bubbles: true }));
  }

  private handleDrag(e: MouseEvent, target: 'n' | 'd') {
    const startY = e.clientY;
    const initialVal = target === 'n' ? Number(this._state.n) : Number(this._state.d);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = Math.round((startY - moveEvent.clientY) / 10);
      let newVal = initialVal + delta;
      if (target === 'd' && newVal <= 0) newVal = 1;
      
      const newNum = target === 'n' ? newVal : Number(this._state.n);
      const newDen = target === 'd' ? newVal : Number(this._state.d);
      
      this.setFraction(new RationalNumber(newNum, newDen));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  private render() {
    const isInteractive = this.hasAttribute('interactive');
    this.shadow.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          vertical-align: middle;
          font-family: var(--math-font-family, 'Inter', sans-serif);
        }
        .fraction-container {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        .numerator, .denominator {
          padding: 2px 6px;
          font-weight: 600;
          font-size: 1.1em;
          user-select: none;
          ${isInteractive ? 'cursor: ns-resize; border-radius: 4px; background: rgba(9, 105, 218, 0.08);' : ''}
        }
        .vinculum {
          width: 100%;
          height: 0;
          border-top: 2px solid var(--math-line-color, #1F2328);
          margin: 2px 0;
        }
      </style>
      <div class="fraction-container" role="group" aria-label="Fraction ${this._state.n} over ${this._state.d}">
        <span class="numerator" tabIndex="${isInteractive ? '0' : '-1'}">${this._state.n}</span>
        <div class="vinculum"></div>
        <span class="denominator" tabIndex="${isInteractive ? '0' : '-1'}">${this._state.d}</span>
      </div>
    `;

    if (isInteractive) {
      const numEl = this.shadow.querySelector('.numerator');
      const denEl = this.shadow.querySelector('.denominator');

      numEl?.addEventListener('mousedown', (e) => this.handleDrag(e as MouseEvent, 'n'));
      denEl?.addEventListener('mousedown', (e) => this.handleDrag(e as MouseEvent, 'd'));
    }
  }
}

if (!customElements.get('stacked-fraction')) {
  customElements.define('stacked-fraction', StackedFraction);
}
