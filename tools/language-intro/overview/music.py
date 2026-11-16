"""Original soft instrumental bed for the homepage overview film (pure synthesis, no samples).

One warm pad chord per scene, cross-faded, with a very slow shimmer. It sits far under the narration.
Usage: python music.py <timeline.json> <out.wav>
"""
import json, sys, wave
import numpy as np

SR = 44100
timeline = json.load(open(sys.argv[1]))
total = timeline["total"]
n = int(total * SR)
t = np.arange(n) / SR
# One chord per scene: Cmaj9, Am9, Fmaj7, G6/9, Cadd9.
chords = {
    "open": (130.81, 196.00, 329.63, 493.88),
    "explore": (110.00, 164.81, 261.63, 392.00),
    "experience": (87.31, 174.61, 261.63, 329.63),
    "support": (98.00, 196.00, 293.66, 329.63),
    "close": (130.81, 196.00, 261.63, 392.00),
}
mix = np.zeros(n)
for scene in timeline["scenes"]:
    a, b = scene["start"], scene["start"] + scene["dur"]
    fade = 1.6
    env = np.clip((t - (a - fade)) / (2 * fade), 0, 1) * np.clip(((b + fade) - t) / (2 * fade), 0, 1)
    env = np.where(scene["id"] == "close", np.clip((t - (a - fade)) / (2 * fade), 0, 1), env)
    pad = np.zeros(n)
    for i, hz in enumerate(chords[scene["id"]]):
        for detune in (-0.9, 0.9):
            pad += np.sin(2 * np.pi * (hz + detune) * t + i) * (0.9 if i == 0 else 0.5)
    pad *= 1 + 0.12 * np.sin(2 * np.pi * 0.17 * t + sum(map(ord, scene["id"])) % 7)
    mix += pad * env
mix /= max(1e-9, np.abs(mix).max())
fade_out = np.clip((total - t) / 2.5, 0, 1)
fade_in = np.clip(t / 1.5, 0, 1)
mix = np.tanh(mix * fade_in * fade_out * 0.9) * 0.6
pcm = (mix * 32767).astype("<i2")
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
