# Elementary Poets

Open `index.html` in a browser; no build or installation is needed.

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
