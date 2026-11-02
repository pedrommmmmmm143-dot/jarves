import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarves-video-gen-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.UPLOAD_DIR = path.join(tmpDir, 'uploads');
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';

const mp4 = Buffer.alloc(24);
mp4.write('....ftypisom', 0, 'ascii');
let server;
let engine;
let baseUrl;
let engineUrl;
let receivedWorkflow;
let receivedViewQuery;

const setting = async (key, value) => fetch(`${baseUrl}/api/settings/${key}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ value }),
});

before(async () => {
  engine = http.createServer(async (req, res) => {
    if (req.url === '/system_stats' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ devices: [] }));
      return;
    }
    if (req.url === '/prompt' && req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      receivedWorkflow = JSON.parse(raw).prompt;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ prompt_id: 'test-video-1' }));
      return;
    }
    if (req.url === '/history/test-video-1' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        'test-video-1': {
          status: { status_str: 'success', completed: true },
          outputs: { '9': { videos: [{ filename: 'generated.mp4', subfolder: '', type: 'output' }] } },
        },
      }));
      return;
    }
    if (req.url?.startsWith('/view?') && req.method === 'GET') {
      receivedViewQuery = new URL(req.url, 'http://127.0.0.1').searchParams;
      res.writeHead(200, { 'Content-Type': 'video/mp4' });
      res.end(mp4);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  engine.listen(0, '127.0.0.1');
  await new Promise(resolve => engine.once('listening', resolve));
  engineUrl = `http://127.0.0.1:${engine.address().port}`;

  const mod = await import('../../backend/server.mjs');
  server = mod.startServer(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  await setting('video_gen_url', engineUrl);
});

after(() => {
  server?.close();
  engine?.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('video settings reject public generators and oversized workflows', async () => {
  const publicUrl = await setting('video_gen_url', 'http://example.com:8188');
  assert.equal(publicUrl.status, 400);
  const oversized = await setting('video_gen_workflow', 'x'.repeat(1024 * 1024 + 1));
  assert.equal(oversized.status, 400);
});

test('status reports local ComfyUI availability and missing workflow configuration', async () => {
  const response = await fetch(`${baseUrl}/api/videos/status`);
  assert.equal(response.status, 200);
  const status = await response.json();
  assert.equal(status.available, true);
  assert.equal(status.provider, 'ComfyUI local');
  assert.equal(status.workflowConfigured, false);
  assert.match(status.configurationError, /workflow API/);
});

test('video generation requires a valid prompt workflow', async () => {
  const response = await fetch(`${baseUrl}/api/videos/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'uma cidade ao pôr do sol' }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /workflow API/);

  const saved = await setting('video_gen_workflow', JSON.stringify({ '6': { class_type: 'CLIPTextEncode', inputs: { text: '' } } }));
  assert.equal(saved.status, 200);
  await setting('video_gen_prompt_node_id', '6');
  await setting('video_gen_prompt_input', 'text');
});

test('ComfyUI receives the prompt and the API returns the generated MP4', async () => {
  const response = await fetch(`${baseUrl}/api/videos/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'uma cidade futurista sob chuva' }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  assert.equal(Buffer.from(await response.arrayBuffer()).toString('ascii', 4, 8), 'ftyp');
  assert.equal(receivedWorkflow['6'].inputs.text, 'uma cidade futurista sob chuva');
  assert.equal(receivedViewQuery.get('filename'), 'generated.mp4');
  assert.equal(receivedViewQuery.get('type'), 'output');
});

test('video generation rejects missing and invalid prompts', async () => {
  for (const prompt of ['', 'x'.repeat(2001)]) {
    const response = await fetch(`${baseUrl}/api/videos/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    assert.equal(response.status, 400);
  }
});
