// Echo Canyon — listen to a modelled line, echo it with the same phrasing, then
// listen back and self-assess. Recording is optional and never leaves the device.
import { esc, glyph } from "../core/dom.js";
import { sound, speak, canRecord, stopSpeaking } from "../core/audio.js";
import { fx } from "../core/fx.js";
import { L } from "../core/i18n.js";

const LINES = {
  "3-5": [
    { chunks: ["I can see", "the tall trees", "from my window."] },
    { chunks: ["My brother", "packs a red apple", "in his lunch."] },
    { chunks: ["The bus", "stops at the corner", "every morning."] },
    { chunks: ["We read", "a story about", "a brave little bird."] },
    { chunks: ["Please put", "your notebook", "on the shelf."] },
  ],
  "6-8": [
    { chunks: ["The scientists", "recorded the temperature", "at noon every day."] },
    { chunks: ["Although the trail", "was steep,", "the group kept moving."] },
    { chunks: ["Our class", "compared the two maps", "before writing."] },
    { chunks: ["The evidence", "in the article", "supports a different claim."] },
    { chunks: ["If we protect", "the wetland,", "the birds will return."] },
  ],
};

const secondsFor = (text) => {
  const words = text.trim().split(/\s+/).length;
  return Math.round((words * 0.42 + 0.7) * 10) / 10;
};

export default {
  id: "fluency-echo",
  skill: "Speaking",
  missedLabels: { phrasing: "Phrasing and pace" },

  rounds(band) {
    return (LINES[band] || LINES["3-5"]).map((line, index) => {
      const text = line.chunks.join(" ");
      return {
        ...line,
        id: `fe-${band}-${index}`,
        index,
        text,
        target: secondsFor(text),
        prompt: L("Listen, then echo the line with the same rhythm.", "Escucha y repite la línea con el mismo ritmo."),
      };
    });
  },

  render(stage, round, shell) {
    let stopRecording = null;
    let startedAt = 0;
    let timerLoop = 0;
    let meterLoop = 0;
    let reviewing = false;

    const divider = '<i class="chunk-div" aria-hidden="true">/</i>';

    stage.innerHTML = `
      <div class="echo">
        <div class="echo-rings" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="echo-head">
          <p class="prompt-kicker">${L("Round", "Ronda")} ${round.index + 1} · ${L(
            "phrasing",
            "fraseo"
          )}</p>
          <h2 class="prompt-title" data-focus tabindex="-1">${L(
            "Listen, then echo it back.",
            "Escucha y repite."
          )}</h2>
          <p class="prompt-sub">${L(
            "Keep the same rhythm. The slashes show where the speaker pauses.",
            "Mantén el mismo ritmo. Las barras muestran dónde hace pausa."
          )}</p>
        </div>

        <blockquote class="echo-line">
          ${round.chunks.map((chunk) => `<span>${esc(chunk)}</span>`).join(divider)}
        </blockquote>

        <div class="echo-actions">
          <button class="btn btn-quiet" type="button" data-speak="${esc(round.text)}" data-rate="0.85">
            ${glyph.speaker}${L("Listen to the model", "Escuchar el modelo")}
          </button>
          <button class="btn btn-primary" type="button" data-record>${glyph.mic}${L(
            "Record my echo",
            "Grabar mi eco"
          )}</button>
        </div>

        <div class="echo-live" data-live hidden>
          <div class="echo-meter" data-meter aria-hidden="true">
            ${Array.from({ length: 28 }, () => "<i></i>").join("")}
          </div>
          <p class="echo-timer" data-timer>0.0s</p>
          <button class="btn btn-stop" type="button" data-stop>${L("Stop", "Detener")}</button>
        </div>

        <div class="echo-review" data-review hidden></div>
        <p class="echo-note" data-note role="status"></p>
      </div>`;

    const recordBtn = stage.querySelector("[data-record]");
    const live = stage.querySelector("[data-live]");
    const review = stage.querySelector("[data-review]");
    const note = stage.querySelector("[data-note]");
    const timer = stage.querySelector("[data-timer]");
    const meter = stage.querySelector("[data-meter]");
    const bars = [...meter.querySelectorAll("i")];

    const tick = () => {
      const seconds = (performance.now() - startedAt) / 1000;
      timer.textContent = `${seconds.toFixed(1)}s`;
    };

    const setLevel = (level) => {
      const active = Math.round(level * bars.length);
      bars.forEach((bar, i) => {
        bar.style.height = `${18 + (i < active ? 68 : 4) * (0.4 + Math.random() * 0.6)}%`;
      });
    };

    const beginManual = () => {
      startedAt = performance.now();
      timerLoop = window.setInterval(tick, 100);
      live.hidden = false;
      live.dataset.mode = "manual";
      note.textContent = L(
        "Microphone is off. Read the line aloud, then press Stop.",
        "El micrófono está apagado. Lee la línea en voz alta y pulsa Detener."
      );
      recordBtn.disabled = true;
      setLevel(0.4);
    };

    recordBtn.addEventListener("click", async () => {
      stopSpeaking();
      if (reviewing) return;
      recordBtn.disabled = true;

      if (!canRecord()) {
        beginManual();
        return;
      }


      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtor();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const chunks = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };

        startedAt = performance.now();
        recorder.start();
        live.hidden = false;
        live.dataset.mode = "mic";

        const paintMeter = () => {
          if (live.hidden) return;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
          meterLoop = requestAnimationFrame(paintMeter);
        };
        paintMeter();

        stopRecording = () =>
          new Promise((resolve) => {
            recorder.onstop = () => {
              cancelAnimationFrame(meterLoop);
              window.clearInterval(timerLoop);
              stream.getTracks().forEach((track) => track.stop());
              try {
                ctx.close();
              } catch {
                /* noop */
              }
              resolve({
                blob: new Blob(chunks, { type: recorder.mimeType || "audio/webm" }),
                seconds: (performance.now() - startedAt) / 1000,
              });
            };
            recorder.stop();
          });
      } catch {
        beginManual();
      }
    });

    const finishTake = async () => {
      if (reviewing) return;
      live.hidden = true;
      cancelAnimationFrame(meterLoop);
      window.clearInterval(timerLoop);

      let seconds;
      let blob = null;
      if (stopRecording) {
        const result = await stopRecording();
        seconds = result.seconds;
        blob = result.blob?.size ? result.blob : null;
        stopRecording = null;
      } else {
        seconds = Math.max(0.4, (performance.now() - startedAt) / 1000);
      }

      reviewing = true;
      const target = round.target;
      const closeness = Math.max(0, 1 - Math.abs(seconds - target) / target);
      const points = Math.round(70 + closeness * 80);
      const url = blob ? URL.createObjectURL(blob) : "";

      review.hidden = false;
      review.innerHTML = `
        <div class="echo-compare">
          <div class="echo-time">
            <span>${L("You", "Tú")}</span><strong>${seconds.toFixed(1)}s</strong>
          </div>
          <div class="echo-vs" aria-hidden="true">≈</div>
          <div class="echo-time">
            <span>${L("Model", "Modelo")}</span><strong>${target.toFixed(1)}s</strong>
          </div>
        </div>
        ${
          url
            ? `<div class="echo-playback"><span>${L("Hear yourself", "Escúchate")}</span><audio controls src="${url}" preload="metadata"></audio></div>`
            : ""
        }
        <p class="echo-rhythm">${L("Same rhythm?", "¿Mismo ritmo?")}</p>
        <div class="echo-rate">
          <button class="rate-btn" type="button" data-rate="smooth">
            <b>✓</b><span>${L("Smooth", "Fluido")}</span>
          </button>
          <button class="rate-btn" type="button" data-rate="almost">
            <b>≈</b><span>${L("Almost", "Casi")}</span>
          </button>
          <button class="rate-btn" type="button" data-rate="again">
            <b>↻</b><span>${L("One more try", "Otra vez")}</span>
          </button>
        </div>`;

      const rateBtns = [...review.querySelectorAll("[data-rate]")];

      const judge = (rating) => {
        rateBtns.forEach((b) => (b.disabled = true));
        const label =
          rating === "smooth"
            ? L("you read it smoothly", "lo leíste con fluidez")
            : rating === "almost"
              ? L("almost the same rhythm", "casi el mismo ritmo")
              : L("you want another try", "quieres intentarlo otra vez");

        const strong = closeness > 0.72 && rating !== "again";
        shell.answer(true, {
          points: rating === "again" ? Math.max(70, points - 30) : points,
          tag: "",
          title: strong
            ? L("Strong echo", "Eco fuerte")
            : L("Good echo — pace is the next step", "Buen eco: el ritmo es el siguiente paso"),
          body: `${L("You said", "Dijiste")} <b>${seconds.toFixed(
            1
          )}s</b>, ${L("the model takes about", "el modelo tarda")} ${target.toFixed(
            1
          )}s. ${L("You felt", "Sentiste que")} ${label}.`,
          why: L(
            "Read in phrase groups, not word by word. Pause where the slashes are, and keep the last words strong.",
            "Lee por grupos de palabras, no palabra por palabra. Pausa donde están las barras y mantén fuertes las últimas palabras."
          ),
        });
      };

      rateBtns.forEach((btn) => btn.addEventListener("click", () => judge(btn.dataset.rate)));

      note.textContent = url
        ? ""
        : L(
            "Recording is unavailable in this browser, so you practiced live. Read it once more for rhythm.",
            "La grabación no está disponible en este navegador; practicaste en vivo. Léelo otra vez por el ritmo."
          );
      sound.hint();
      fx.burst(window.innerWidth / 2, review.getBoundingClientRect().top + 40, {
        count: 10,
        power: 3,
        colors: ["#8a3a5c", "#e2b14a"],
      });
      window.setTimeout(() => rateBtns[0]?.focus({ preventScroll: true }), 160);
    };

    stage.querySelector("[data-stop]")?.addEventListener("click", finishTake);

    // Enter in the live state also stops, so one key can run the whole take.
    stage.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !live.hidden) {
        event.preventDefault();
        finishTake();
      }
    });
  },
};
