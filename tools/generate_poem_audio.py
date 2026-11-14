#!/usr/bin/env python3
"""Generate static Xiaoxiao and Yunxi narration with word timings.

Install edge-tts, then run this script from any directory. Existing matching
recordings are reused; changed poem text is regenerated automatically.
"""
import argparse
import asyncio
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICES = {"xiaoxiao": "zh-CN-XiaoxiaoNeural", "yunxi": "zh-CN-YunxiNeural"}
RATE = "-15%"


def poems():
    source = (ROOT / "poems.js").read_text(encoding="utf-8")
    raw = re.search(r"const rawPoems = `\n(.*?)`;", source, re.S).group(1)
    for number, row in enumerate(raw.strip().splitlines(), 1):
        _, _, title, author, dynasty, body = row.split("|")
        author_line = author if dynasty == "作者待考" else f"{dynasty}，{author}"
        text = "\n".join([title, author_line, *body.split("/")]).rstrip()
        yield f"poem-{number}", text


async def generate(poem_id, text, output, semaphore, voice):
    import edge_tts

    signature = hashlib.sha256(f"{voice}|{RATE}|{text}|word-v1".encode()).hexdigest()
    audio = output / f"{poem_id}.mp3"
    metadata = output / f"{poem_id}.words.json"
    if audio.exists() and audio.stat().st_size and metadata.exists():
        data = json.loads(metadata.read_text(encoding="utf-8"))
        if data.get("signature") == signature and data.get("words"):
            return poem_id, data
    async with semaphore:
        for attempt in range(3):
            try:
                words, cursor = [], 0
                temporary = audio.with_suffix(".mp3.part")
                with temporary.open("wb") as stream:
                    speech = edge_tts.Communicate(text, voice, rate=RATE, boundary="WordBoundary")
                    async for event in speech.stream():
                        if event["type"] == "audio":
                            stream.write(event["data"])
                        elif event["type"] == "WordBoundary":
                            token = event["text"]
                            start = text.find(token, cursor)
                            if start < 0:
                                raise ValueError(f"Cannot align {token!r} in {poem_id}")
                            cursor = start + len(token)
                            words.append({"text": token, "start": event["offset"] / 1e7,
                                          "end": (event["offset"] + event["duration"]) / 1e7,
                                          "start_char": start, "end_char": cursor})
                if not words or not temporary.stat().st_size:
                    raise ValueError(f"Empty speech or timing data for {poem_id}")
                data = {"text": text, "voice": voice, "rate": RATE,
                        "audio": audio.relative_to(ROOT).as_posix(), "signature": signature, "words": words}
                temporary.replace(audio)
                metadata.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print(f"Generated {voice} / {poem_id}: {len(words)} words", flush=True)
                return poem_id, data
            except Exception:
                if attempt == 2:
                    raise
                await asyncio.sleep(2 * (attempt + 1))


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="Generate one poem, e.g. poem-1 (for preview).")
    parser.add_argument("--voice", choices=["all", *VOICES], default="all")
    args = parser.parse_args()
    selected = [(key, text) for key, text in poems() if not args.only or key == args.only]
    if not selected:
        parser.error("No matching poem")
    for name, voice in VOICES.items():
        if args.voice not in ("all", name):
            continue
        output = ROOT / "audio" if name == "xiaoxiao" else ROOT / "audio" / name
        output.mkdir(parents=True, exist_ok=True)
        semaphore = asyncio.Semaphore(3)
        results = await asyncio.gather(*(generate(key, text, output, semaphore, voice) for key, text in selected))
        # Script bundles also work when index.html is opened via file://.
        manifest = ROOT / ("audio-data.js" if name == "xiaoxiao" else f"audio-{name}-data.js")
        variable = "POEM_AUDIO" if name == "xiaoxiao" else f"POEM_AUDIO_{name.upper()}"
        entries = dict(results)
        if args.only and manifest.exists():
            previous = json.loads(manifest.read_text(encoding="utf-8").split(" = ", 1)[1].rstrip(";\n"))
            previous.update(entries)
            entries = previous
        manifest.write_text(f"window.{variable} = " + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
        print(f"Ready: {len(entries)} {name} recordings", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
