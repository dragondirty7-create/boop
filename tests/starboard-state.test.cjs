// Dependency-free script regression tests. Browser-native input/layout is covered
// separately by starboard.test.cjs; this model does not claim to emulate a browser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

function boot() {
  class Element {
    constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.attrs = {}; this.listeners = {}; this.children = []; this.value = '104'; this.classes = new Set(); }
    set className(value) { this.classes = new Set(value.split(/\s+/)); }
    get classList() { return {
      add: (...values) => values.forEach(value => this.classes.add(value)),
      remove: (...values) => values.forEach(value => this.classes.delete(value)),
      toggle: (value, force) => { const next = force === undefined ? !this.classes.has(value) : force; next ? this.classes.add(value) : this.classes.delete(value); return next; },
      contains: value => this.classes.has(value)
    }; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    appendChild(child) { this.children.push(child); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    focus() { this.focused = true; }
    fire(name, detail = 0) { const event = { detail, preventDefault() {}, button: 0 }; this.listeners[name]?.(event); }
  }
  const elements = Object.fromEntries(['grid', 'play', 'clear', 'surprise', 'tempo', 'bpm'].map(id => [id, new Element()]));
  const notes = [], intervals = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  class Audio {
    constructor() { this.state = 'running'; this.currentTime = 1; }
    createGain() { return { gain: param(), connect() {} }; }
    createDelay() { return { delayTime: param(), connect() {} }; }
    createOscillator() { const oscillator = { frequency: param(), connect() {}, stop() {}, start(when) { notes.push({ frequency: oscillator.frequency.value, when }); } }; return oscillator; }
    resume() { this.state = 'running'; }
  }
  const math = Object.create(Math);
  const context = { document: { getElementById: id => elements[id], createElement: tag => new Element(tag) }, window: { AudioContext: Audio }, Math: math, performance: { now: () => 1000 }, setTimeout() {}, setInterval(fn) { intervals.push(fn); return intervals.length; }, clearInterval() {} };
  const html = readFileSync(join(__dirname, '..', 'starboard.html'), 'utf8');
  runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  return { elements, cells: elements.grid.children, notes, math, intervals };
}
function synced(cells, expected) {
  for (const cell of cells) assert.equal(cell.attrs['aria-pressed'], String(cell.classes.has('on')));
  assert.equal(cells.filter(cell => cell.classes.has('on')).length, expected);
}
test('all 112 native cells are named and seeded state is synchronized', () => {
  const { cells } = boot();
  assert.equal(cells.length, 112);
  for (const cell of cells) { assert.equal(cell.tagName, 'BUTTON'); assert.equal(cell.type, 'button'); assert.match(cell.attrs['aria-label'], /^[A-G][45], step (?:[1-9]|1[0-6])$/); }
  synced(cells, 8);
});
test('pointerdown toggles immediately, pointer click is ignored, detail-zero click activates', () => {
  const { cells, notes } = boot(); const cell = cells[0];
  cell.fire('pointerdown'); synced(cells, 9); assert.equal(notes.length, 2);
  cell.fire('click', 1); synced(cells, 9); assert.equal(notes.length, 2);
  cell.fire('click', 0); synced(cells, 8); assert.equal(notes.length, 2);
  cell.fire('click', 0); synced(cells, 9); assert.equal(notes.length, 4);
});
test('random harmonies, subsequent empty pattern and clear synchronize state', () => {
  const { cells, elements, math } = boot();
  elements.clear.fire('click'); synced(cells, 0);
  math.random = () => 0; elements.surprise.fire('click'); synced(cells, 17);
  assert.equal(cells.find(c => c.attrs['aria-label'] === 'E4, step 1').attrs['aria-pressed'], 'true');
  assert.equal(cells.find(c => c.attrs['aria-label'] === 'C4, step 1').attrs['aria-pressed'], 'true');
  math.random = () => .999; elements.surprise.fire('click'); synced(cells, 0);
  math.random = () => 0; elements.surprise.fire('click'); elements.clear.fire('click'); synced(cells, 0);
});
test('play and tempo controls retain musical scheduler behavior', () => {
  const { elements, intervals, notes } = boot();
  elements.tempo.value = '176'; elements.tempo.fire('input'); assert.equal(elements.bpm.textContent, 176);
  elements.play.fire('click'); assert.match(elements.play.textContent, /Stop/);
  intervals[0](); assert.equal(notes.length, 2); assert.equal(notes[0].frequency, 392); assert.equal(notes[1].frequency, 784);
  elements.play.fire('click'); assert.match(elements.play.textContent, /Play/);
});
