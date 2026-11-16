# Homepage overview film ("Welcome to The Language Page")

Source for `assets/studio-videos/the-language-page-overview/`, the video card on the Language Page home screen
(`/access-practice-lab/`, mapped in `data/studio-videos.json`). Nothing in the film is a mock-up: every screen is a
recording of the running site.

| Step | File | What it does |
| --- | --- | --- |
| 1 | `script.json` | The narration, scene by scene (also the captions). `tts` overrides the spoken form of a line. |
| 2 | `narrate.py` | Synthesizes one WAV per line with Kokoro-82M (Apache-2.0, local, `kokoro-onnx`). |
| 3 | `build-timeline.mjs` | Line timings -> `timeline.json`, the mixed `narration.wav`, `overview.vtt`. |
| 4 | `capture.mjs` | Serves this checkout with `tools/lib/access-serve.mjs`, drives the real UI in Playwright, records each shot. Hides only the two homepage video cards so the film never shows a video inside a video. |
| 5 | `Overview.tsx`, `Root.tsx` | Remotion composition (animated typography, browser frames, chapter rail). Reads `timeline.json`; footage from step 4 as MP4 in `public/footage/`. |
| 6 | `music.py` | Original soft pad bed, mixed far under the narration. |

The film shows only what exists on the site. If a screen it shows changes (a button renamed, a hub removed), re-run
step 4 and re-render. Remotion, Kokoro and their model files are NOT repo dependencies; they were installed in a
scratch workspace for the render (`remotion@4.0.543`, `kokoro-onnx`, Python 3.12).
