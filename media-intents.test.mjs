import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../frontend/scripts/media-intents.js', import.meta.url), 'utf8');
const sandbox = vm.createContext({});
vm.runInContext(source, sandbox);
const { getImagePrompt } = sandbox.jarvesMediaIntents;

test('extracts Portuguese and English requests for image creation', () => {
  assert.equal(getImagePrompt('Gere uma imagem de uma floresta ao amanhecer'), 'uma floresta ao amanhecer');
  assert.equal(getImagePrompt('Faça um desenho: um gato azul em estilo aquarela'), 'um gato azul em estilo aquarela');
  assert.equal(getImagePrompt('Create an image of a spaceship above Earth'), 'a spaceship above Earth');
});

test('does not mistake questions or website requests for image generation', () => {
  assert.equal(getImagePrompt('Como criar uma imagem de uma paisagem?'), null);
  assert.equal(getImagePrompt('Crie um site com uma imagem de um planeta'), null);
  assert.equal(getImagePrompt('Gere uma imagem'), null);
});

test('accepts the common misspelling and limits prompt size', () => {
  assert.equal(getImagePrompt('Gera uma imagen de um robô amigável'), 'um robô amigável');
  assert.equal(getImagePrompt('Gere uma imagem de ' + 'x'.repeat(1400)).length, 1200);
});

test('extracts video generation commands without catching questions or websites', () => {
  const { getVideoPrompt } = sandbox.jarvesMediaIntents;
  assert.equal(getVideoPrompt('Gere um vídeo de uma cidade futurista à noite'), 'uma cidade futurista à noite');
  assert.equal(getVideoPrompt('Create a video of a small boat on a lake'), 'a small boat on a lake');
  assert.equal(getVideoPrompt('Como criar um vídeo de uma cidade?'), null);
  assert.equal(getVideoPrompt('Crie um site com vídeo de demonstração'), null);
  assert.equal(getVideoPrompt('Gere um vídeo'), null);
});
