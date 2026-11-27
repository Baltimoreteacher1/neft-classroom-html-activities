// ACCESS Readiness Kit: checklists (saved on this device), a sound check, a microphone check that records locally and
// plays back (nothing is uploaded), an original practice test-screen walk-through, and a family letter in EN and ES.
import { $, $$, escapeHtml, speech, store } from "../lib.js";

/* checklists */
for (const cb of $$("[data-rk]")) {
  const key = `rk:${cb.dataset.rk}`;
  cb.checked = !!store.get(key);
  cb.addEventListener("change", () => store.set(key, cb.checked));
}

/* sound check */
$("[data-rk-sound]").addEventListener("click", async () => {
  const outEl = $("[data-rk-sound-out]");
  if (!speech.supported) {
    outEl.textContent = "This browser cannot play the voice check. Try another browser or play any video with sound.";
    return;
  }
  outEl.textContent = "Playing… If you hear a voice saying 'This is a sound check', your headset works.";
  await speech.speak("This is a sound check. If you can hear me, your headset works. Great job.");
  outEl.textContent = "Did you hear it? If not, check that the headset is plugged in and the volume is up.";
});

/* microphone check */
const micBtn = $("[data-rk-mic]");
const playBtn = $("[data-rk-play]");
const level = $("[data-rk-level]");
const micOut = $("[data-rk-mic-out]");
let url = null;
micBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder !== "function") {
    micOut.textContent = "Recording is not available in this browser.";
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    micOut.textContent = "The microphone is blocked for this site. Allow it in the browser's site settings, then try again.";
    return;
  }
  micBtn.disabled = true;
  const chunks = [];
  const rec = new MediaRecorder(stream);
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  let peak = 0;
  let raf = 0;
  let ctx = null;
  try {
    ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const draw = () => {
      analyser.getByteTimeDomainData(data);
      let max = 0;
      for (const v of data) max = Math.max(max, Math.abs(v - 128));
      peak = Math.max(peak, max);
      level.style.width = `${Math.min(100, (max / 64) * 100)}%`;
      raf = requestAnimationFrame(draw);
    };
    draw();
  } catch {}
  rec.onstop = () => {
    cancelAnimationFrame(raf);
    ctx?.close();
    for (const t of stream.getTracks()) t.stop();
    level.style.width = "0";
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    playBtn.disabled = false;
    micBtn.disabled = false;
    micOut.textContent =
      peak > 6
        ? "The microphone heard you. Press Play it back to listen. The recording stays on this device."
        : "The microphone did not hear much. Move it closer to your mouth and try again.";
  };
  micOut.textContent = "Recording for 5 seconds… say your name and your favorite food.";
  rec.start();
  setTimeout(() => rec.state !== "inactive" && rec.stop(), 5000);
});
playBtn.addEventListener("click", () => {
  if (url) new Audio(url).play();
});

/* practice test-screen walk-through (an original mock, not the real test) */
const walk = $("[data-rk-walk]");
const STEPS = [
  ["This is a practice test screen. It shows how online tests usually work. The real test may look different.", "screen"],
  ["The play button reads the question aloud. On a listening test you may only hear it once or twice, so listen carefully.", "play"],
  ["Choose an answer by clicking it. You can change your mind before you go on.", "choices"],
  ["The Next arrow takes you to the next question. Some tests do not let you go back, so check your answer first.", "next"],
  ["On a speaking test you see a record button. Speak clearly into the microphone until the time ends.", "record"],
  ["That's it. Take your time: the test is not timed, and every question is a chance to show what you know.", "done"],
];
let step = 0;
function renderWalk() {
  const [text, focus] = STEPS[step];
  const hi = (name) => (focus === name ? " rk-hi" : "");
  walk.innerHTML = `
  <p class="label">Step ${step + 1} of ${STEPS.length}</p><p class="reading" aria-live="polite">${escapeHtml(text)}</p>
  <div class="rk-mock${hi("screen")}" aria-label="Practice test screen (example)">
    <div class="rk-bar"><span>Practice question 3 of 10</span><button type="button" class="icon-btn${hi("play")}" aria-label="Play the question (practice)">▶</button></div>
    <p>Where does the girl put her backpack?</p>
    <div class="rk-choices${hi("choices")}"><button type="button" class="choice">On the chair</button><button type="button" class="choice">In the locker</button><button type="button" class="choice">On the bus</button></div>
    <div class="rk-bar"><button type="button" class="icon-btn${hi("record")}" aria-label="Record (practice)">● Record</button><button type="button" class="btn small${hi("next")}" aria-label="Next (practice)">Next →</button></div>
  </div>
  <div class="btn-row section"><button type="button" class="btn secondary small" data-walk-back ${step === 0 ? "disabled" : ""}>Back</button><button type="button" class="btn small" data-walk-next>${step === STEPS.length - 1 ? "Start over" : "Next step"}</button><button type="button" class="btn ghost small" data-walk-say>Read this step aloud</button></div>`;
  $("[data-walk-back]", walk).addEventListener("click", () => {
    step = Math.max(0, step - 1);
    renderWalk();
  });
  $("[data-walk-next]", walk).addEventListener("click", () => {
    step = (step + 1) % STEPS.length;
    renderWalk();
    $("[data-walk-next]", walk).focus();
  });
  $("[data-walk-say]", walk).addEventListener("click", () => speech.speak(text));
  for (const c of $$(".rk-choices .choice", walk)) c.addEventListener("click", () => {
    for (const x of $$(".rk-choices .choice", walk)) x.setAttribute("aria-pressed", String(x === c));
  });
}
renderWalk();

/* family letter */
const datesInput = $("#rk-dates");
function letters() {
  const d = datesInput.value.trim();
  $('[data-letter="en"]').innerHTML = `<p>Dear family,</p><p>Soon your child will take the <strong>WIDA ACCESS</strong> test. Every year, students who are learning English take this test. It shows how your child uses English for school in listening, reading, speaking and writing. It is not a grade.</p>${d ? `<p><strong>Test dates:</strong> ${escapeHtml(d)}</p>` : ""}<p>How you can help:</p><ul><li>Make sure your child sleeps well and eats breakfast on test days.</li><li>Tell your child to try their best and take their time.</li><li>Talk with your child every day in your home language.</li></ul><p>Thank you for your support.</p>`;
  $('[data-letter="es"]').innerHTML = `<p>Estimada familia:</p><p>Pronto su hijo o hija tomará la prueba <strong>WIDA ACCESS</strong>. Cada año, los estudiantes que aprenden inglés toman esta prueba. Muestra cómo usa el inglés en la escuela para escuchar, leer, hablar y escribir. No es una calificación.</p>${d ? `<p><strong>Fechas de la prueba:</strong> ${escapeHtml(d)}</p>` : ""}<p>Cómo puede ayudar:</p><ul><li>Asegúrese de que duerma bien y desayune los días de la prueba.</li><li>Dígale que haga su mejor esfuerzo y que tome su tiempo.</li><li>Hable con su hijo o hija todos los días en su idioma.</li></ul><p>Gracias por su apoyo.</p>`;
}
datesInput.addEventListener("input", letters);
letters();
