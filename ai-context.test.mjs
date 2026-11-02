import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarves-ai-context-'));
process.env.DB_PATH = path.join(tempDir, 'jarves.db');
process.env.NODE_ENV = 'test';
process.env.AI_CONTEXT_TOKENS = '8192';

const { getQualityOptions } = await import('../../backend/services/aiService.mjs');
const { setSetting, deleteSetting } = await import('../../database/repositories/settingsRepository.mjs');
const { OllamaProvider } = await import('../../ai/providers/ollama.mjs');

test('contexto padrão usa o valor de ambiente permitido e preserva qualidade de resposta', () => {
  deleteSetting('ai_context_tokens');
  assert.deepEqual(getQualityOptions(), { temperature: 0.7, maxTokens: 8192, numCtx: 8192 });
  setSetting('ai_quality', 'low');
  assert.deepEqual(getQualityOptions(), { temperature: 0.5, maxTokens: 2048, numCtx: 8192 });
  deleteSetting('ai_quality');
});

test('contexto salvo chega ao parâmetro num_ctx enviado ao Ollama', async () => {
  setSetting('ai_context_tokens', '4096');
  let receivedBody;
  const server = http.createServer((request, response) => {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      receivedBody = JSON.parse(body);
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ model: receivedBody.model, message: { content: 'ok' }, done: true }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const provider = new OllamaProvider({ baseUrl: `http://127.0.0.1:${server.address().port}` });
    await provider.chat({
      model: 'modelo-teste',
      messages: [{ role: 'user', content: 'oi' }],
      options: getQualityOptions(),
    });
    assert.equal(receivedBody.options.num_ctx, 4096);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
