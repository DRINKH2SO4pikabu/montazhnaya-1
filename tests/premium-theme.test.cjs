const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'index.html'), 'utf8');

test('Dark Premium theme is enabled without changing the application layout', () => {
  assert.match(html, /<body class="theme-dark-premium">/);
  assert.match(html, /id="mediaPanel"/);
  assert.match(html, /id="monitorPanel"/);
  assert.match(html, /id="propsPanel"/);
  assert.match(html, /id="timelinePanel"/);
});

test('orange and ice-blue design tokens are defined for the premium theme', () => {
  assert.match(html, /--accent:#ff922f/);
  assert.match(html, /--accent-cool:#8bdcf4/);
  assert.match(html, /--orange-metal:/);
  assert.match(html, /--ice-metal:/);
});

test('raised typography and beveled controls are present', () => {
  assert.match(html, /\.brand-name\{[\s\S]*?text-shadow:[^}]+\}/);
  assert.match(html, /\.brand-mark\{[\s\S]*?object-fit:contain/);
  assert.match(html, /drop-shadow\(0 2px 7px rgba\(255,139,47/);
  assert.match(html, /\.tbtn\.primary,[\s\S]*?box-shadow:[^}]+/);
});

test('premium theme retains keyboard focus and reduced-motion accessibility', () => {
  assert.match(html, /button:focus-visible/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});
