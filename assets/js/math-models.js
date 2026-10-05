class FractionModel extends HTMLElement {
  connectedCallback() {
    const num = parseInt(this.getAttribute('numerator')) || 1;
    const den = parseInt(this.getAttribute('denominator')) || 2;
    let rects = '';
    for(let i=0; i<den; i++){
      const fill = i < num ? '#1fa6a2' : 'transparent';
      rects += '<rect x="' + (i*50) + '" y="0" width="50" height="50" fill="' + fill + '" stroke="#12355b" stroke-width="2"/>';
    }
    this.innerHTML = '<svg width="' + (den*50) + '" height="50" viewBox="0 0 ' + (den*50) + ' 50">' + rects + '</svg>';
    this.style.cursor = 'pointer';
    this.onclick = () => {
      let currentNum = parseInt(this.getAttribute('numerator')) || 1;
      this.setAttribute('numerator', (currentNum % den) + 1);
      this.connectedCallback(); // re-render
    };
  }
}
customElements.define('fraction-model', FractionModel);