// Learning Supports — bridge to the shared speech helpers in the engine.
//
// ls-panel.js and ls-read-aloud.js import from here instead of reaching into
// /engine, which is not copied to dist/. The build bundles this file as a Rollup
// entry that keeps this exact path (vite.config.js), so the published site and
// the source tree both resolve it.
export * from "../../engine/core/speech-voice.js";
