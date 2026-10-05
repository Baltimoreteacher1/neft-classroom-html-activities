class TTSReader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<button style="background:none;border:none;cursor:pointer;font-size:1.2em;" title="Read Aloud">🔊</button>';
    this.onclick = () => {
      const text = this.parentElement.innerText.replace('🔊', '');
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    };
  }
}
customElements.define('tts-reader', TTSReader);