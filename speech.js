/* Static Edge TTS playback; timings come from audio-data.js. */
(() => {
'use strict';
const players = new Map();
function player(prefix) {
 if (players.has(prefix)) return players.get(prefix);
 const host = document.getElementById(`${prefix}-speech`);
 const audio = host.querySelector('audio');
 const state = {host, audio, id: null, entries: [], frame: 0, active: null};
 function clear() {
  if (state.active) state.active.classList.remove('is-speaking');
  state.active = null;
 }
 function paint() {
  const entry = state.entries.find(item => audio.currentTime >= item.start && audio.currentTime < item.end);
  const span = entry ? entry.span : null;
  if (span !== state.active) {
   clear();
   if (span) span.classList.add('is-speaking');
   state.active = span;
  }
 }
 function tick() {
  paint();
  if (!audio.paused && !audio.ended) state.frame = requestAnimationFrame(tick);
 }
 audio.addEventListener('play', () => {
  players.forEach(other => { if (other !== state) other.audio.pause(); });
  cancelAnimationFrame(state.frame);
  tick();
 });
 for (const event of ['pause', 'ended', 'emptied']) audio.addEventListener(event, () => {
  cancelAnimationFrame(state.frame);
  clear();
 });
 audio.addEventListener('seeked', () => { if (!audio.paused) paint(); });
 audio.addEventListener('error', () => {
  if (state.id) host.querySelector('[role="status"]').textContent = '音频未能载入，请刷新后重试。';
 });
 state.paint = paint;
 players.set(prefix, state);
 return state;
}
window.PoemSpeech = {
 stop(prefix) {
  const state = players.get(prefix);
  if (state) state.audio.pause();
 },
 prepare(prefix, poem, visible = true) {
  const state = player(prefix);
  const data = (window.POEM_AUDIO || {})[poem.id];
  state.host.hidden = !visible || !data;
  if (state.id !== poem.id || !visible || !data) {
   state.audio.pause();
   state.audio.removeAttribute('src');
   state.id = null;
   state.audio.load();
  }
  state.entries = [];
  if (!visible || !data) return;
  if (state.id !== poem.id) {
   state.id = poem.id;
   state.audio.src = data.audio;
   state.audio.setAttribute('aria-label', `朗读《${poem.title}》：晓晓，中文女声`);
   state.host.querySelector('[role="status"]').textContent = poem.lines.length ? '' : '本篇朗读标题与作者，正文请参阅课本。';
  }
  const body = document.getElementById(prefix === 'reader' ? 'reader-body' : 'flashcard-lines');
  let offset = data.text.indexOf('\n', data.text.indexOf('\n') + 1) + 1;
  body.querySelectorAll('.poem-line').forEach((line, index) => {
   const text = poem.lines[index];
   line.textContent = '';
   let cursor = 0;
   data.words.forEach(word => {
    const start = Math.max(0, word.start_char - offset);
    const end = Math.min(text.length, word.end_char - offset);
    if (end <= start) return;
    if (start > cursor) line.append(document.createTextNode(text.slice(cursor, start)));
    const span = document.createElement('span');
    span.className = 'tts-word';
    span.textContent = text.slice(start, end);
    line.append(span);
    state.entries.push({...word, span});
    cursor = end;
   });
   if (cursor < text.length) line.append(document.createTextNode(text.slice(cursor)));
   offset += text.length + 1;
  });
  if (!state.audio.paused) state.paint();
 }
};
})();
