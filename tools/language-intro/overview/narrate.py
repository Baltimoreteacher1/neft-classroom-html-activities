"""Synthesize the narration for the homepage overview film, one WAV per line.

Voice: Kokoro-82M (Apache-2.0) via kokoro-onnx, run locally. Reads script.json, writes
<out>/lines/<scene>-<n>.wav and <out>/narration.json (durations in seconds).
Usage: python narrate.py <model-dir> <out-dir>   (model-dir holds kokoro-v1.0.onnx and voices-v1.0.bin)
"""
import json, sys, wave
from pathlib import Path
import numpy as np
from kokoro_onnx import Kokoro

model_dir, out = Path(sys.argv[1]), Path(sys.argv[2])
script = json.loads(Path(__file__).with_name("script.json").read_text())
(out / "lines").mkdir(parents=True, exist_ok=True)
k = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))
report = {}
for scene in script["scenes"]:
    durs = []
    for i, line in enumerate(scene["lines"]):
        samples, sr = k.create(line.get("tts", line["text"]), voice=script["voice"], speed=script["speed"], lang="en-us")
        pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
        with wave.open(str(out / "lines" / f"{scene['id']}-{i}.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
        durs.append(len(pcm) / sr)
    report[scene["id"]] = durs
(out / "narration.json").write_text(json.dumps(report, indent=1))
print(json.dumps(report))
