#!/usr/bin/env python3
"""Install the verified Polly MP3s from the Language Page audio pack."""

import argparse
import json
import tempfile
from pathlib import Path
from zipfile import BadZipFile, ZipFile

SITE = Path(__file__).resolve().parents[1] / "access-practice-lab" / "audio-practice"


def install(source):
    clips = json.loads((SITE / "clips.json").read_text(encoding="utf-8"))
    expected = {clip["id"]: clip for clip in clips}

    with ZipFile(source) as archive, tempfile.TemporaryDirectory(dir=SITE) as work:
        stage = Path(work)
        manifest = json.loads(archive.read("manifest.json"))
        if manifest.get("audio_generated") is not True or manifest.get("engine") != "standard":
            raise ValueError("Use the generated audio ZIP from AWS CloudShell.")
        records = manifest["clips"]
        if len(records) != len(expected) or {record["id"] for record in records} != expected.keys():
            raise ValueError("The archive must contain one recording for each current clip.")
        for record in records:
            identifier = record["id"]
            for field in ("transcript", "language"):
                if record[field] != expected[identifier][field]:
                    raise ValueError(f"{identifier}: {field} does not match the site.")
            filename = f"{identifier}.mp3"
            info = archive.getinfo(f"audio/{filename}")
            if not 1024 <= info.file_size <= 2_000_000:
                raise ValueError(f"{filename}: unexpected file size.")
            audio = archive.read(info)
            if not audio.startswith(b"ID3") and not (audio[0] == 0xff and audio[1] & 0xe0 == 0xe0):
                raise ValueError(f"{filename}: expected MP3 audio.")
            (stage / filename).write_bytes(audio)

        destination = SITE / "audio"
        destination.mkdir(exist_ok=True)
        for filename in stage.iterdir():
            filename.replace(destination / filename.name)
        index = stage / "audio-files.json"
        index.write_text(json.dumps(sorted(expected), indent=2) + "\n", encoding="utf-8")
        index.replace(SITE / index.name)
    return len(expected)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    try:
        count = install(args.archive)
    except (BadZipFile, OSError, KeyError, ValueError) as error:
        parser.exit(1, f"{error}\n")
    print(f"Installed {count} verified Polly MP3s in {SITE / 'audio'}.")
