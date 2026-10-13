const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { chromium } = require('playwright');

let browser, server, url;
before(async () => {
  url = process.env.STARBOARD_URL;
  if (!url) {
    const html = await readFile(join(__dirname, '..', 'starboard.html'));
    server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}/starboard.html`;
  }
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function open(t, mobile = false) {
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
    : { viewport: { width: 1280, height: 900 } });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, [], 'No uncaught JavaScript errors'));
  // Observe real WebAudio without mocking its implementation or scheduling.
  await page.addInitScript(() => {
    window.__notes = [];
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (...args) {
      const oscillator = original.apply(this, args);
      const start = oscillator.start;
      oscillator.start = function (when) {
        window.__notes.push({ frequency: this.frequency.value, when, state: this.context.state });
        return start.call(this, when);
      };
      return oscillator;
    };
  });
  await page.goto(url);
  await page.locator('#grid .cell').last().waitFor();
  return page;
}
async function assertSynchronized(page, count) {
  const cells = await page.locator('#grid .cell').evaluateAll(elements => elements.map(el => ({
    active: el.classList.contains('on'), pressed: el.getAttribute('aria-pressed')
  })));
  assert.equal(cells.length, 112);
  for (const cell of cells) assert.equal(cell.pressed, String(cell.active));
  if (count !== undefined) assert.equal(cells.filter(cell => cell.active).length, count);
}

// These tests exercise browser-native activation, not synthetic keyboard handlers.
test('112 native, named, tabbable cells and starter pattern have consistent state', async t => {
  const page = await open(t);
  const cells = await page.locator('#grid .cell').evaluateAll(elements => elements.map(el => ({
    tag: el.tagName, type: el.type, tabIndex: el.tabIndex, disabled: el.disabled,
    label: el.getAttribute('aria-label')
  })));
  const notes = ['D5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4'];
  cells.forEach((cell, index) => {
    assert.equal(cell.tag, 'BUTTON');
    assert.equal(cell.type, 'button');
    assert.equal(cell.tabIndex, 0);
    assert.equal(cell.disabled, false);
    assert.equal(cell.label, `${notes[Math.floor(index / 16)]}, step ${index % 16 + 1}`);
  });
  await page.locator('.back').focus();
  for (let index = 0; index < 112; index++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#grid .cell').nth(index).evaluate(el => el === document.activeElement), true);
  }
  await assertSynchronized(page, 8);
});

test('Enter and Space each toggle once and sound only when activating', async t => {
  const page = await open(t);
  const cell = page.getByRole('button', { name: 'D5, step 1', exact: true });
  await cell.focus();
  for (const key of ['Enter', 'Space']) {
    await page.keyboard.press(key);
    assert.equal(await cell.getAttribute('aria-pressed'), 'true');
    const notes = await page.evaluate(() => window.__notes.length);
    await page.keyboard.press(key);
    assert.equal(await cell.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(() => window.__notes.length), notes);
  }
  assert.equal(await page.evaluate(() => window.__notes.length), 4, 'One pair of oscillators per activation');
  await cell.evaluate(el => el.click()); // Assistive technology / programmatic activation.
  assert.equal(await cell.getAttribute('aria-pressed'), 'true');
  await assertSynchronized(page, 9);
});

test('mouse activation is immediate on pointerdown, with no duplicate click toggle', async t => {
  const page = await open(t);
  const cell = page.getByRole('button', { name: 'D5, step 1', exact: true });
  const bounds = await cell.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  assert.equal(await cell.getAttribute('aria-pressed'), 'true');
  await page.mouse.up();
  assert.equal(await cell.getAttribute('aria-pressed'), 'true');
  assert.equal(await cell.evaluate(el => el === document.activeElement), true);
  await cell.click();
  assert.equal(await cell.getAttribute('aria-pressed'), 'false');
  assert.equal(await page.evaluate(() => window.__notes.length), 2);
  await assertSynchronized(page, 8);
});

test('keyboard focus remains visibly distinguishable on beat and active cells', async t => {
  const page = await open(t);
  await page.locator('.back').focus();
  await page.keyboard.press('Tab');
  const cell = page.locator('#grid .cell').first();
  for (let active = 0; active < 2; active++) {
    const focus = await cell.evaluate(el => {
      const css = getComputedStyle(el);
      return { visible: el.matches(':focus-visible'), width: parseFloat(css.outlineWidth), style: css.outlineStyle, color: css.outlineColor, offset: parseFloat(css.outlineOffset) };
    });
    assert.equal(focus.visible, true);
    assert.ok(focus.width >= 2);
    assert.notEqual(focus.style, 'none');
    assert.notEqual(focus.color, 'rgba(0, 0, 0, 0)');
    assert.ok(focus.offset >= 0);
    await page.keyboard.press('Space');
  }
});

test('clear and deterministic randomized patterns synchronize stale cells and harmonies', async t => {
  const page = await open(t);
  await page.locator('#clear').click();
  await assertSynchronized(page, 0);
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('#surprise').click();
  await page.locator('#play').click();
  // At step 1 the random walk selects E4 with an added C4 harmony.
  assert.equal(await page.getByRole('button', { name: 'E4, step 1', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: 'C4, step 1', exact: true }).getAttribute('aria-pressed'), 'true');
  await assertSynchronized(page, 17);
  await page.evaluate(() => { Math.random = () => 0.999; });
  await page.locator('#surprise').click();
  await page.locator('#play').click();
  await assertSynchronized(page, 0);
  await page.locator('#clear').click();
  await assertSynchronized(page, 0);
});

test('real WebAudio playback, playhead and tempo control still work', async t => {
  const page = await open(t);
  await page.locator('#tempo').focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#bpm').textContent(), '176');
  await page.locator('#play').click();
  assert.match(await page.locator('#play').textContent(), /Stop/);
  await page.waitForFunction(() => window.__notes.length >= 4 && document.querySelectorAll('.cell.col').length === 7);
  const notes = await page.evaluate(() => window.__notes);
  assert.ok(notes.some(note => Math.abs(note.frequency - 392) < 0.01));
  assert.ok(notes.some(note => note.state === 'running'));
  // Starter notes at steps 1 and 3 are two sixteenth notes apart.
  assert.ok(Math.abs((notes[2].when - notes[0].when) - 2 * (60 / 176 / 4)) < 0.01);
  await page.locator('#play').click();
  assert.match(await page.locator('#play').textContent(), /Play/);
  await assertSynchronized(page, 8);
});

test('mobile touch toggles once, preserves square cells, and fits the viewport', async t => {
  const page = await open(t, true);
  const cell = page.getByRole('button', { name: 'D5, step 1', exact: true });
  await cell.tap();
  assert.equal(await cell.getAttribute('aria-pressed'), 'true');
  await cell.tap();
  assert.equal(await cell.getAttribute('aria-pressed'), 'false');
  assert.equal(await page.evaluate(() => window.__notes.length), 2);
  const bounds = await cell.boundingBox();
  assert.ok(Math.abs(bounds.width - bounds.height) <= 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.locator('#clear').tap();
  await assertSynchronized(page, 0);
});
