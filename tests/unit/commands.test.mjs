import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../../frontend/scripts/commands.js';

const catalog = globalThis.jarvesCommandCatalog;

test('command catalog contains exactly 900 unique named and usable prompts', () => {
  assert.equal(catalog.count, 900);
  const commands = catalog.list();
  assert.equal(commands.length, 900);
  assert.equal(new Set(commands.map(entry => entry.command)).size, commands.length);
  assert.ok(commands.every(entry => entry.command.startsWith('/') && entry.name && entry.prompt));
});

test('command catalog resolves commands and searches accent-insensitively with a bounded result set', () => {
  const entry = catalog.get('/python-depurar');
  assert.ok(entry);
  assert.equal(entry.topic, 'Python');
  const python = catalog.search('python', 100);
  assert.equal(python.length, 30);
  assert.equal(catalog.get(python[0].command), python[0]);
  assert.equal(catalog.search('matematica', 100).length, 30);
  assert.equal(catalog.countMatches(''), 900);
  assert.equal(catalog.search('', 1000).length, 100);
});
