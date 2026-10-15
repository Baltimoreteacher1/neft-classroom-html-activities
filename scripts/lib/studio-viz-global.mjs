// The Practice Studio figure files are plain browser scripts that attach to `window`. This module is imported FIRST by
// worked-viz.mjs so that, under Node (the generators and tests), `window` is the global object before they run.
// In a browser it does nothing.
if (typeof globalThis.window === "undefined") globalThis.window = globalThis;
