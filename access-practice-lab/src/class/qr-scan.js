// Scan the teacher's join QR with this device's camera, using the browser's own BarcodeDetector (ChromeOS and Android
// Chrome have it). No library and no upload: frames stay in the page, and only the class code is kept. Where the
// detector is missing, the join card says to type the code instead (or use the device camera app).
import { codeFromScan } from "./session.js";

export const canScan = () =>
  typeof window !== "undefined" &&
  "BarcodeDetector" in window &&
  Boolean(globalThis.navigator?.mediaDevices?.getUserMedia);

/**
 * Show the camera in `video` until a class QR is seen. Resolves to the class code, or "" when stopped or no camera.
 * Returns `{ done, stop }`; always call `stop()` when the card goes away.
 */
export function startScan(video) {
  let stream = null;
  let stopped = false;
  let frame = 0;
  let finish = () => {};
  const stop = () => {
    stopped = true;
    finish("");
    cancelAnimationFrame(frame);
    for (const track of stream?.getTracks() || []) track.stop();
    video.srcObject = null;
  };
  const done = (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (stopped) return (stop(), "");
      video.srcObject = stream;
      await video.play();
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      return await new Promise((resolve) => {
        finish = resolve;
        const look = async () => {
          if (stopped) return resolve("");
          try {
            for (const found of await detector.detect(video)) {
              const code = codeFromScan(found.rawValue);
              if (code) return (resolve(code), stop());
            }
          } catch {}
          frame = requestAnimationFrame(look);
        };
        look();
      });
    } catch {
      stop();
      return "";
    }
  })();
  return { done, stop };
}
