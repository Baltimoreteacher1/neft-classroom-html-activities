#!/bin/sh
# Mixes narration + music (ducked under the voice), normalizes loudness, and encodes the final MP4.
# Usage: mux.sh <rendered-silent.mp4> <narration.wav> <music.wav> <out.mp4>
set -eu
ffmpeg -v error -y -i "$2" -i "$3" -filter_complex \
 "[0:a]loudnorm=I=-16:TP=-1.5:LRA=9,asplit=2[v][sc];[1:a]volume=0.55[m];[m][sc]sidechaincompress=threshold=0.015:ratio=10:attack=30:release=500[md];[v][md]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89[o]" \
 -map "[o]" -ar 44100 -ac 2 /tmp/overview-mix.wav
ffmpeg -v error -y -i "$1" -i /tmp/overview-mix.wav -map 0:v -map 1:a -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 128k -af apad -shortest "$4"
