import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../frontend/scripts/generated-html.js', import.meta.url), 'utf8');
const sandbox = vm.createContext({});
vm.runInContext(source, sandbox);
const htmlTools = sandbox.jarvesGeneratedHtml;

test('normalizes fenced HTML and removes surrounding prose', () => {
  const html = '<!doctype html><html><head><title>Teste</title></head><body>ok</body></html>';
  assert.equal(htmlTools.normalize(`Resposta:\n\`\`\`html\n${html}\n\`\`\``), html);
});

test('accepts a complete standalone HTML document', () => {
  const result = htmlTools.validate('<!doctype html><html><head><title>Teste</title></head><body><h1>Olá</h1></body></html>');
  assert.equal(result.valid, true);
  assert.deepEqual(Array.from(result.errors), []);
});

test('rejects incomplete document structure and duplicate IDs', () => {
  const incomplete = htmlTools.validate('<html><head><title>Teste</title></head><body><p>sem fechamento</body></html>');
  assert.equal(incomplete.valid, false);
  assert.ok(Array.from(incomplete.errors).some(error => /fora de ordem|sem fechamento/.test(error)));
  assert.ok(Array.from(incomplete.warnings).some(warning => warning.includes('<!doctype html>')));

  const duplicate = htmlTools.validate('<html><head></head><body><div id="x"></div><span id="x"></span></body></html>');
  assert.ok(Array.from(duplicate.errors).some(error => error.includes('ID duplicado')));
});

test('rejects external assets and warns about missing page title', () => {
  const external = htmlTools.validate('<html><head><link rel="stylesheet" href="https://example.invalid/style.css"></head><body></body></html>');
  assert.ok(Array.from(external.errors).some(error => error.includes('https://example.invalid')));

  const noTitle = htmlTools.validate('<html><head></head><body></body></html>');
  assert.equal(noTitle.valid, true);
  assert.ok(Array.from(noTitle.warnings).some(warning => warning.includes('<title>')));
});

test('checks inline script syntax without running the script', async () => {
  let analyzed = '';
  const errors = await htmlTools.validateInlineScripts('<html><head></head><body><script>window.pwned = true;</script></body></html>', async (code, language) => {
    analyzed = language + ':' + code;
    return { syntaxCheck: 'failed', issues: [{ severity: 'high', message: 'Unexpected token' }] };
  });
  assert.equal(analyzed, 'javascript:window.pwned = true;');
  assert.equal(Array.from(errors).length, 1);
  assert.match(Array.from(errors)[0], /JavaScript inválido/);
});
