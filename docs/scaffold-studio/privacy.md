# Privacy

- Everything the layer records lives on this device under `accessPracticeLab:v1:scaffold`. Nothing is uploaded, no account, no analytics, no third-party script.
- The profile stores counts of runs and which supports were used, per unit and domain. It stores no scores, no percentages, no text a student typed and no audio.
- Rehearsal recordings stay in memory in the current tab and are discarded when it closes. Private mode records nothing at all.
- The teacher export (CSV, JSON, print) is built on the device and downloaded by the person pressing the button. It contains counts and directions ("less support over time"), never a level or a placement. CSV cells that start with `=`, `+`, `-` or `@` are escaped so a spreadsheet cannot run them.
- The optional AI layer is **off and unreachable in production**. If it is ever enabled it must go through an adapter (not yet built) with a deterministic fallback, send no student name or identifier, and fall back to the deterministic helper on any error. Enabling it is a separate decision that needs a district data review.
