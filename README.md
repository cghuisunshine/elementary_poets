# Elementary Poets

Open `index.html` in a browser; no build or installation is needed.

Opening a poem updates the URL to its own link, such as `#poem-7` for 春晓.
Copy the browser address to share it. Opening or refreshing that link opens the
same poem automatically, with its grade selected. Previous/next poems update
the link too; browser Back/Forward follows your reading history. Closing the
reader returns the URL to the current grade.

## Chinese narration

Every entry has pre-generated Edge TTS audio using both `zh-CN-XiaoxiaoNeural`
(晓晓, female) and `zh-CN-YunxiNeural` (云希, male), at a slightly slower reading
pace. Choose a voice above the player; your choice is remembered across poems,
views, and visits. Switching voices pauses playback and starts the new voice
from the beginning. Open a poem or reveal a flashcard to use its play/pause and
seek controls. Poem words highlight
in sync with the recording. Switching poems, hiding a flashcard, entering
recitation mode, or closing the reader pauses playback. Only one player plays
at a time. The three modern entries narrate their title and author only because
their poem text is not included.

The included `audio/`, `audio-data.js`, and `audio-yunxi-data.js` assets work
offline and with a direct file open. To regenerate both voices after editing
`poems.js` (requires network access):

```sh
python3 -m venv /tmp/elementary-poets-tts
/tmp/elementary-poets-tts/bin/pip install -r tools/requirements-tts.txt
/tmp/elementary-poets-tts/bin/python tools/generate_poem_audio.py
```

Unchanged recordings are reused. Use `--voice yunxi` or `--voice xiaoxiao` to
generate one voice only. Audio and word timings are generated together; the two
JavaScript bundles contain the timings so playback needs no web server.

## Optional poem illustrations

Put images in `images/`, then add an entry to `poemImages` near the bottom of `poems.js`, using the exact poem title:

```js
 '小池': {
  src: 'images/xiaochi.png',
  alt: 'A description of the illustration.',
  width: 1055,
  height: 1491
 }
```

Use the image’s original pixel dimensions (or omit `width` and `height`). Each illustrated poem gets a small card preview and a full, uncropped image in the reader. Wide screens place the poem and image side by side; smaller screens stack them. Click the large image to open the original. Flashcards show illustrations only after revealing the answer; recitation mode hides them. Poems without an image entry need no extra setup.
