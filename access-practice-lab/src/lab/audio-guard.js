// AudioGuard: the one deterministic state machine every Speaking task uses for the microphone.
//
//   IDLE -> REQUESTING_MIC -> MONITORING_LEVEL -> RECORDING -> PLAYBACK_READY
//                 |                  |               |
//                 +------------------+---------------+--> MIC_BLOCKED_FALLBACK  (retry or typed fallback)
//
// A student starts every permission request and every recording: nothing runs until request() is called
// from a click. The guard never throws: a missing `navigator.mediaDevices` (a locked-down Chromebook, an
// insecure origin, an old browser), a denied prompt, a missing or busy device and an unplugged headset all
// land in MIC_BLOCKED_FALLBACK with a reason, and from there the student retries or answers by typing, so a
// speaking task can never soft-lock. The device work (getUserMedia, the level meter, MediaRecorder) is
// injected, so the machine is tested in Node with no browser.
export const AG = Object.freeze({
  IDLE: "IDLE",
  REQUESTING_MIC: "REQUESTING_MIC",
  MONITORING_LEVEL: "MONITORING_LEVEL",
  RECORDING: "RECORDING",
  PLAYBACK_READY: "PLAYBACK_READY",
  MIC_BLOCKED_FALLBACK: "MIC_BLOCKED_FALLBACK",
});

/** The whole machine: state -> event -> next state. An event not listed for a state is ignored. */
export const TRANSITIONS = Object.freeze({
  IDLE: { REQUEST: "REQUESTING_MIC" },
  REQUESTING_MIC: { GRANTED: "MONITORING_LEVEL", BLOCKED: "MIC_BLOCKED_FALLBACK", CANCEL: "IDLE" },
  MONITORING_LEVEL: { RECORD: "RECORDING", BLOCKED: "MIC_BLOCKED_FALLBACK", CANCEL: "IDLE" },
  RECORDING: { STOP: "PLAYBACK_READY", BLOCKED: "MIC_BLOCKED_FALLBACK" },
  PLAYBACK_READY: { RETAKE: "REQUESTING_MIC", RESET: "IDLE" },
  MIC_BLOCKED_FALLBACK: { RETRY: "REQUESTING_MIC", RESET: "IDLE" },
});

export const next = (state, event) => TRANSITIONS[state]?.[event] || state;

export const BLOCK_REASONS = Object.freeze([
  "denied",
  "absent",
  "busy",
  "unsupported",
  "interrupted",
  "failed",
]);

/** One thrown device error -> a reason the UI can explain. */
export function classifyError(error) {
  const name = String(error?.name || error || "");
  if (/NotAllowed|PermissionDenied|Security/i.test(name)) return "denied";
  if (/NotFound|DevicesNotFound|Overconstrained/i.test(name)) return "absent";
  if (/NotReadable|TrackStart|Abort/i.test(name)) return "busy";
  if (/unsupported/i.test(name)) return "unsupported";
  return "failed";
}

export const REASON_COPY = Object.freeze({
  denied: {
    en: "The microphone is blocked. Allow it in your browser’s site settings, then try again, or type your answer.",
    es: "El micrófono está bloqueado. Permítelo en la configuración del sitio de tu navegador y vuelve a intentarlo, o escribe tu respuesta.",
  },
  absent: {
    en: "No microphone was found. Plug one in and try again, or type your answer.",
    es: "No se encontró ningún micrófono. Conecta uno y vuelve a intentarlo, o escribe tu respuesta.",
  },
  busy: {
    en: "Another app is using the microphone. Close it and try again, or type your answer.",
    es: "Otra aplicación está usando el micrófono. Ciérrala y vuelve a intentarlo, o escribe tu respuesta.",
  },
  unsupported: {
    en: "This browser cannot record here. You can type your answer instead.",
    es: "Este navegador no puede grabar aquí. Puedes escribir tu respuesta.",
  },
  interrupted: {
    en: "The microphone stopped. Check the device and try again, or type your answer.",
    es: "El micrófono se detuvo. Revisa el dispositivo y vuelve a intentarlo, o escribe tu respuesta.",
  },
  failed: {
    en: "Recording did not start. Try again, or type your answer.",
    es: "La grabación no empezó. Inténtalo de nuevo, o escribe tu respuesta.",
  },
});

/** Device access for the browser. Loaded lazily so the machine itself imports anywhere. */
export async function browserDeps(env = globalThis) {
  const recorder = await import("../recorder.js");
  const nav = env.navigator;
  return {
    supported: () =>
      Boolean(nav?.mediaDevices?.getUserMedia) && typeof env.MediaRecorder === "function",
    async openMonitor(onLevel) {
      const stream = await nav.mediaDevices.getUserMedia({ audio: true });
      const Ctx = env.AudioContext || env.webkitAudioContext;
      let raf = 0;
      let ctx = null;
      if (Ctx) {
        try {
          ctx = new Ctx();
          ctx.resume?.().catch?.(() => {});
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          ctx.createMediaStreamSource(stream).connect(analyser);
          const buf = new Uint8Array(analyser.fftSize);
          const tick = () => {
            analyser.getByteTimeDomainData(buf);
            let peak = 0;
            for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
            onLevel(Math.min(1, peak / 64));
            raf = env.requestAnimationFrame(tick);
          };
          tick();
        } catch {
          ctx = null;
        }
      }
      const track = stream.getAudioTracks?.()[0];
      return {
        onEnded: (fn) => track?.addEventListener?.("ended", fn),
        close() {
          env.cancelAnimationFrame?.(raf);
          stream.getTracks().forEach((t) => t.stop());
          ctx?.close?.().catch?.(() => {});
        },
      };
    },
    async startRecording(key, { onLevel, onEnded, maxSeconds = 60 }) {
      const state = await recorder.start(key, {
        onLevel,
        maxSeconds,
        onStop: (list, info) => onEnded?.(list, info),
      });
      if (!state) throw new Error("cancelled");
      return { stop: () => recorder.stop(), takes: () => recorder.takesFor(key) };
    },
  };
}

/**
 * The runtime around the machine. `deps` = { supported(), openMonitor(onLevel), startRecording(key, opts) }.
 * `onChange(snapshot)` fires after every transition or level update; a snapshot is plain data.
 */
export function createAudioGuard({
  deps,
  onChange = () => {},
  key = "audio-guard",
  maxSeconds = 60,
} = {}) {
  let state = AG.IDLE;
  let reason = "";
  let level = 0;
  let take = null;
  let monitor = null;
  let session = null;
  let ticket = 0; // bumps on every request/reset so a late device answer from an abandoned attempt is dropped

  const snapshot = () => ({
    state,
    reason,
    level,
    take,
    fallback: state === AG.MIC_BLOCKED_FALLBACK,
  });
  const emit = () => {
    onChange(snapshot());
    // The HUD's mic pill listens for this; a guard in Node (tests) has no document and skips it.
    try { globalThis.document?.dispatchEvent?.(new CustomEvent("lab:audio-state", { detail: { state } })); } catch {}
  };
  const go = (event) => {
    const to = next(state, event);
    if (to === state) return false;
    state = to;
    return true;
  };
  const closeMonitor = () => {
    try {
      monitor?.close();
    } catch {}
    monitor = null;
  };
  const block = (why) => {
    closeMonitor();
    session = null;
    level = 0;
    reason = BLOCK_REASONS.includes(why) ? why : "failed";
    go("BLOCKED");
    emit();
  };

  async function request() {
    if (
      !go(
        state === AG.PLAYBACK_READY
          ? "RETAKE"
          : state === AG.MIC_BLOCKED_FALLBACK
            ? "RETRY"
            : "REQUEST",
      )
    )
      return snapshot();
    const mine = ++ticket;
    reason = "";
    take = null;
    emit();
    if (!deps?.supported?.()) {
      block("unsupported");
      return snapshot();
    }
    try {
      const opened = await deps.openMonitor((v) => {
        if (mine !== ticket || state !== AG.MONITORING_LEVEL) return;
        level = v;
        emit();
      });
      if (mine !== ticket) {
        opened?.close?.();
        return snapshot();
      }
      monitor = opened;
      opened.onEnded?.(() => {
        if (mine === ticket && (state === AG.MONITORING_LEVEL || state === AG.RECORDING))
          block("interrupted");
      });
      go("GRANTED");
      emit();
    } catch (error) {
      if (mine === ticket) block(classifyError(error));
    }
    return snapshot();
  }

  async function record() {
    if (state !== AG.MONITORING_LEVEL) return snapshot();
    const mine = ticket;
    closeMonitor();
    go("RECORD");
    emit();
    try {
      session = await deps.startRecording(key, {
        maxSeconds,
        onLevel: (v) => {
          if (mine !== ticket || state !== AG.RECORDING) return;
          level = v;
          emit();
        },
        onEnded: (list) => {
          if (mine !== ticket || state !== AG.RECORDING) return;
          take = list?.at?.(-1) || null;
          level = 0;
          go("STOP");
          emit();
        },
      });
    } catch (error) {
      if (mine === ticket) block(classifyError(error));
    }
    return snapshot();
  }

  async function stop() {
    if (state !== AG.RECORDING || !session) return snapshot();
    try {
      await session.stop();
    } catch {
      block("failed");
    }
    // The recorder's onEnded moves RECORDING -> PLAYBACK_READY; a recorder with no take still ends the state.
    if (state === AG.RECORDING) {
      take = session.takes?.().at?.(-1) || null;
      level = 0;
      go("STOP");
      emit();
    }
    return snapshot();
  }

  function reset() {
    ticket += 1;
    closeMonitor();
    try {
      session?.stop?.();
    } catch {}
    session = null;
    level = 0;
    reason = "";
    take = null;
    state = AG.IDLE;
    emit();
    return snapshot();
  }

  return {
    request,
    record,
    stop,
    retry: request,
    retake: request,
    reset,
    dispose: reset,
    get state() {
      return state;
    },
    snapshot,
  };
}
