import { RationalNumber } from '../engine/RationalNumber.js';

export class InteractiveRatioTable extends HTMLElement {
  private shadow: ShadowRoot;
  private row1: number[] = [1, 2, 3, 4];
  private row2: number[] = [3, 6, 9, 12];
  private errors: Set<number> = new Set();

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  private validateAdditivePattern(index: number, val: number, isRow1: boolean) {
    const baseVal = isRow1 ? this.row1[0] : this.row2[0];
    const prevVal = isRow1 ? this.row1[index - 1] : this.row2[index - 1];
    
    // Additive Error Detection: Checking if student incorrectly added base delta instead of multiplying ratios
    const additiveDelta = baseVal;
    if (val === prevVal + additiveDelta && index > 1 && (this.row1[index] / this.row1[0] !== this.row2[index] / this.row2[0])) {
      this.errors.add(index);
    } else {
      this.errors.delete(index);
    }
  }

  private handleCellInput(index: number, valStr: string, isRow1: boolean) {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;

    if (isRow1) {
      this.row1[index] = val;
    } else {
      this.row2[index] = val;
    }

    this.validateAdditivePattern(index, val, isRow1);
    this.render();
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        .table-container { position: relative; display: inline-block; padding-top: 30px; font-family: var(--math-font-family, system-ui, sans-serif); }
        .cell-input { width: 50px; text-align: center; border: 1px solid #D0D7DE; padding: 4px; font-weight: 600; font-size: 15px; border-radius: 4px; }
        .error { border-color: #CF222E !important; background: rgba(207,34,46,0.1) !important; color: #CF222E; }
        .ratio-table { border-collapse: collapse; margin: 10px 0; background: #FFFFFF; }
        .ratio-table td, .ratio-table th { border: 1px solid #D0D7DE; padding: 12px 16px; text-align: center; font-size: 16px; }
        .ratio-table th { background-color: #F6F8FA; font-weight: 600; color: #1F2328; }
        .ratio-arc-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .ratio-arc-path { fill: none; stroke: #0969DA; stroke-width: 2; stroke-dasharray: 4; }
      </style>
      <div class="table-container">
        <svg class="ratio-arc-svg">
          <path class="ratio-arc-path" d="M 60 30 Q 110 5 160 30" />
        </svg>
        <table class="ratio-table" role="table" aria-label="Interactive Proportional Ratio Table">
          <tr>
            <th>Quantity A</th>
            ${this.row1.map((v, i) => `
              <td>
                <input class="cell-input ${this.errors.has(i) ? 'error' : ''}" 
                       data-idx="${i}" data-row="1" value="${v}" aria-label="Quantity A column ${i + 1}" />
              </td>
            `).join('')}
          </tr>
          <tr>
            <th>Quantity B</th>
            ${this.row2.map((v, i) => `
              <td>
                <input class="cell-input ${this.errors.has(i) ? 'error' : ''}" 
                       data-idx="${i}" data-row="2" value="${v}" aria-label="Quantity B column ${i + 1}" />
              </td>
            `).join('')}
          </tr>
        </table>
      </div>
    `;

    this.shadow.querySelectorAll('.cell-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const idx = parseInt(target.getAttribute('data-idx')!, 10);
        const row = target.getAttribute('data-row') === '1';
        this.handleCellInput(idx, target.value, row);
      });
    });
  }
}

if (!customElements.get('interactive-ratio-table')) {
  customElements.define('interactive-ratio-table', InteractiveRatioTable);
}
