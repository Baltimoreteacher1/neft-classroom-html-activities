class TTSReader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<button style="background:none;border:none;cursor:pointer;font-size:1.2em;margin-left:8px;vertical-align:middle;transition:transform 0.1s;" title="Read Aloud (Math-Aware)">🔊</button>';
    const btn = this.querySelector('button');
    
    btn.onmouseover = () => btn.style.transform = 'scale(1.2)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    
    this.onclick = () => {
      window.speechSynthesis.cancel();
      
      let text = this.parentElement.innerText.replace('🔊', '').trim();
      
      // Math-Aware Replacements
      text = text.replace(/(\d+)\/(\d+)/g, "$1 over $2");
      text = text.replace(/x\^2/g, "x squared");
      text = text.replace(/x\^3/g, "x cubed");
      text = text.replace(/([a-zA-Z])\^(\d+)/g, "$1 to the power of $2");
      text = text.replace(/=/g, " equals ");
      text = text.replace(/\+/g, " plus ");
      text = text.replace(/\-/g, " minus ");
      text = text.replace(/\*/g, " times ");
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      
      // Basic Language Detection
      if (this.parentElement.closest('.lang-es') || this.parentElement.lang === 'es' || this.parentElement.classList.contains('lang-es')) {
        utterance.lang = 'es-US';
        text = text.replace(/ equals /g, " igual a ");
        text = text.replace(/ plus /g, " más ");
        text = text.replace(/ minus /g, " menos ");
        text = text.replace(/ over /g, " sobre ");
        utterance.text = text;
      }
      
      window.speechSynthesis.speak(utterance);
    };
  }
}
customElements.define('tts-reader', TTSReader);
