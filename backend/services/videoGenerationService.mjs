import { getSetting } from '../../database/repositories/settingsRepository.mjs';
import { validateLocalGeneratorUrl } from './localGeneratorUrl.mjs';

export const DEFAULT_VIDEO_GENERATOR_URL = 'http://127.0.0.1:8188';
export const MAX_VIDEO_WORKFLOW_BYTES = 1024 * 1024;
const MAX_VIDEO_BYTES = 128 * 1024 * 1024;
const MAX_JSON_BYTES = 4 * 1024 * 1024;
const GENERATION_TIMEOUT_MS = 30 * 60 * 1000;
const VIDEO_MIME_TYPES = new Map([
  ['.mp4', 'video/mp4'],
  ['.m4v', 'video/mp4'],
  ['.mov', 'video/quicktime'],
  ['.webm', 'video/webm'],
]);
let generationInProgress = false;

function videoGeneratorUrl() {
  return validateLocalGeneratorUrl(getSetting('video_gen_url', DEFAULT_VIDEO_GENERATOR_URL), 'ComfyUI', '8188');
}

function parseWorkflowConfig() {
  const raw = getSetting('video_gen_workflow', '');
  const nodeId = getSetting('video_gen_prompt_node_id', '');
  const inputName = getSetting('video_gen_prompt_input', 'text');
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > MAX_VIDEO_WORKFLOW_BYTES) {
    throw Object.assign(new Error('O workflow precisa ser um JSON de até 1 MiB.'), { status: 400 });
  }
  if (!raw.trim()) {
    throw Object.assign(new Error('Configure um workflow API do ComfyUI antes de gerar vídeos.'), { status: 400 });
  }
  let workflow;
  try { workflow = JSON.parse(raw); }
  catch { throw Object.assign(new Error('O workflow salvo não é um JSON válido.'), { status: 400 }); }
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)
      || Object.keys(workflow).length === 0 || Object.keys(workflow).length > 3000) {
    throw Object.assign(new Error('O workflow deve conter de 1 a 3.000 nós no formato API do ComfyUI.'), { status: 400 });
  }
  for (const [id, node] of Object.entries(workflow)) {
    if (!/^[\w-]{1,80}$/.test(id) || !node || typeof node !== 'object' || Array.isArray(node)
        || typeof node.class_type !== 'string' || !node.inputs || typeof node.inputs !== 'object' || Array.isArray(node.inputs)) {
      throw Object.assign(new Error('Workflow inválido: importe o JSON no formato API do ComfyUI.'), { status: 400 });
    }
  }
  if (typeof nodeId !== 'string' || !/^[\w-]{1,80}$/.test(nodeId)
      || typeof inputName !== 'string' || !/^[\w-]{1,80}$/.test(inputName)) {
    throw Object.assign(new Error('Informe o ID do nó de texto e o nome do campo de prompt.'), { status: 400 });
  }
  const promptNode = workflow[nodeId];
  if (!promptNode || !promptNode.inputs || typeof promptNode.inputs[inputName] !== 'string') {
    throw Object.assign(new Error(`O workflow não contém o campo de texto "${inputName}" no nó "${nodeId}".`), { status: 400 });
  }
  return { workflow, nodeId, inputName };
}

async function fetchLocal(url, { method = 'GET', body, timeoutMs = 15000 } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw Object.assign(new Error('O ComfyUI local demorou demais para responder.'), { status: 504 });
    }
    throw Object.assign(new Error('Não foi possível conectar ao ComfyUI local. Verifique se o servidor está iniciado.'), { status: 503 });
  }
  return response;
}

async function readJsonResponse(response, label) {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw Object.assign(new Error(`${label}: HTTP ${response.status}${detail ? ` — ${detail}` : ''}`), { status: 502 });
  }
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_JSON_BYTES) {
    throw Object.assign(new Error(`${label}: a resposta excedeu o limite de 4 MiB.`), { status: 502 });
  }
  try { return await response.json(); }
  catch { throw Object.assign(new Error(`${label}: resposta JSON inválida.`), { status: 502 }); }
}

export async function getVideoGeneratorStatus() {
  const url = videoGeneratorUrl();
  const response = await fetchLocal(`${url}/system_stats`);
  const stats = await readJsonResponse(response, 'ComfyUI');
  let workflowConfigured = false;
  let configurationError = '';
  try { parseWorkflowConfig(); workflowConfigured = true; }
  catch (error) { configurationError = error.message; }
  return {
    available: true,
    provider: 'ComfyUI local',
    workflowConfigured,
    configurationError,
    devices: Array.isArray(stats.devices) ? stats.devices.length : 0,
  };
}

async function readVideo(response, filename) {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw Object.assign(new Error(`Não foi possível obter o vídeo do ComfyUI: HTTP ${response.status}${detail ? ` — ${detail}` : ''}`), { status: 502 });
  }
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_VIDEO_BYTES) {
    throw Object.assign(new Error('O vídeo excede o limite de 128 MiB.'), { status: 502 });
  }
  if (!response.body) throw Object.assign(new Error('O ComfyUI retornou um vídeo vazio.'), { status: 502 });

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_VIDEO_BYTES) {
      await reader.cancel();
      throw Object.assign(new Error('O vídeo excede o limite de 128 MiB.'), { status: 502 });
    }
    chunks.push(Buffer.from(value));
  }
  const buffer = Buffer.concat(chunks);
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const mime = VIDEO_MIME_TYPES.get(extension);
  const isMp4 = ['.mp4', '.m4v', '.mov'].includes(extension) && buffer.length > 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
  const isWebm = extension === '.webm' && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (!mime || (!isMp4 && !isWebm)) {
    throw Object.assign(new Error('O workflow não retornou um MP4 ou WebM válido.'), { status: 502 });
  }
  return { buffer, mime };
}

function findVideoOutput(outputs) {
  for (const nodeOutput of Object.values(outputs || {})) {
    for (const field of ['videos', 'gifs', 'images']) {
      for (const file of Array.isArray(nodeOutput?.[field]) ? nodeOutput[field] : []) {
        if (typeof file?.filename === 'string' && VIDEO_MIME_TYPES.has(file.filename.slice(file.filename.lastIndexOf('.')).toLowerCase())) {
          return file;
        }
      }
    }
  }
  return null;
}

export async function generateVideo({ prompt } = {}) {
  if (generationInProgress) throw Object.assign(new Error('Já existe uma geração de vídeo em andamento.'), { status: 409 });
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000) {
    throw Object.assign(new Error('Descreva o vídeo em até 2.000 caracteres.'), { status: 400 });
  }
  const url = videoGeneratorUrl();
  const { workflow, nodeId, inputName } = parseWorkflowConfig();
  workflow[nodeId].inputs[inputName] = prompt.trim();
  generationInProgress = true;
  const startedAt = Date.now();

  try {
    const queuedResponse = await fetchLocal(`${url}/prompt`, { method: 'POST', body: { prompt: workflow } });
    const queued = await readJsonResponse(queuedResponse, 'Fila do ComfyUI');
    if (typeof queued.prompt_id !== 'string' || !/^[\w-]{1,100}$/.test(queued.prompt_id)) {
      throw Object.assign(new Error('O ComfyUI não retornou o identificador da tarefa.'), { status: 502 });
    }
    const promptId = encodeURIComponent(queued.prompt_id);
    let outputFile = null;
    while (Date.now() - startedAt < GENERATION_TIMEOUT_MS) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const historyResponse = await fetchLocal(`${url}/history/${promptId}`);
      const history = await readJsonResponse(historyResponse, 'Histórico do ComfyUI');
      const job = history[queued.prompt_id];
      if (!job) continue;
      if (job.status?.status_str === 'error') {
        throw Object.assign(new Error('O workflow de vídeo falhou no ComfyUI. Confira a fila e os nós do workflow.'), { status: 502 });
      }
      if (job.status?.completed || job.status?.status_str === 'success') {
        outputFile = findVideoOutput(job.outputs);
        break;
      }
    }
    if (!outputFile) {
      throw Object.assign(new Error('O ComfyUI não terminou a geração em 30 minutos ou o workflow não produziu um vídeo.'), { status: 504 });
    }
    const subfolder = outputFile.subfolder || '';
    if (outputFile.filename.includes('/') || outputFile.filename.includes('\\') || outputFile.filename.includes('..')
        || typeof subfolder !== 'string' || subfolder.length > 256
        || subfolder.startsWith('/') || subfolder.startsWith('\\') || subfolder.split(/[\\/]/).includes('..')
        || !['output', 'temp'].includes(outputFile.type || 'output')) {
      throw Object.assign(new Error('O ComfyUI retornou um caminho de vídeo inválido.'), { status: 502 });
    }
    const viewUrl = new URL(`${url}/view`);
    viewUrl.searchParams.set('filename', outputFile.filename);
    viewUrl.searchParams.set('subfolder', subfolder);
    viewUrl.searchParams.set('type', outputFile.type || 'output');
    const videoResponse = await fetchLocal(viewUrl, { timeoutMs: 120000 });
    return await readVideo(videoResponse, outputFile.filename);
  } finally {
    generationInProgress = false;
  }
}
