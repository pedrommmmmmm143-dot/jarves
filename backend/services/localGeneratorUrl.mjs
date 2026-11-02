import { isIP } from 'node:net';

function isPrivateAddress(host) {
  if (host === 'localhost') return true;
  const family = isIP(host);
  if (family === 4) {
    const [a, b] = host.split('.').map(Number);
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 169 && b === 254);
  }
  if (family === 6) {
    const normalized = host.toLowerCase();
    return normalized === '::1' || /^f[cd]/.test(normalized) || /^fe[89ab]/.test(normalized);
  }
  return false;
}

export function validateLocalGeneratorUrl(value, serviceName = 'gerador local', port = '7860') {
  let url;
  try { url = new URL(String(value)); }
  catch { throw new Error(`Endereço inválido do ${serviceName}.`); }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (url.protocol !== 'http:' || !isPrivateAddress(host) || url.username || url.password
      || (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
    throw new Error(`Use HTTP sem caminho, usuário ou senha e um endereço local ou privado, por exemplo http://127.0.0.1:${port}.`);
  }
  return url.origin;
}
