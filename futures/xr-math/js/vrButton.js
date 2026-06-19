// Minimal, self-contained VRButton for three.js WebXR.
// Adapted from the three.js addon (MIT) but with no external imports, so the
// prototype stays fully self-contained inside this folder. It manages an
// immersive-vr session on renderer.xr and degrades gracefully when WebXR is
// unavailable (the page still works via OrbitControls fallback).

export const VRButton = {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @returns {HTMLElement} a button (or notice) element to place in the DOM
   */
  createButton(renderer) {
    const button = document.createElement("button");
    button.type = "button";

    function showEnterVR() {
      let currentSession = null;

      async function onSessionStarted(session) {
        session.addEventListener("end", onSessionEnded);
        await renderer.xr.setSession(session);
        button.textContent = "Exit VR";
        currentSession = session;
      }

      function onSessionEnded() {
        currentSession.removeEventListener("end", onSessionEnded);
        button.textContent = "Enter VR";
        currentSession = null;
      }

      button.textContent = "Enter VR";
      button.onclick = function () {
        if (currentSession === null) {
          const sessionInit = {
            optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
          };
          navigator.xr
            .requestSession("immersive-vr", sessionInit)
            .then(onSessionStarted)
            .catch((err) => {
              button.textContent = "VR unavailable";
              console.warn("[xr-math] Could not start VR session:", err);
            });
        } else {
          currentSession.end();
        }
      };
    }

    function disableButton(label) {
      button.onclick = null;
      button.disabled = true;
      button.style.opacity = "0.55";
      button.style.cursor = "default";
      button.textContent = label;
    }

    if ("xr" in navigator && navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr
        .isSessionSupported("immersive-vr")
        .then((supported) => {
          if (supported) {
            showEnterVR();
          } else {
            disableButton("VR not supported");
          }
        })
        .catch(() => disableButton("VR not supported"));
    } else {
      disableButton("VR not supported");
    }

    return button;
  },
};
