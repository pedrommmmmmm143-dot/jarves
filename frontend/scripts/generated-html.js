((root) => {
  'use strict';

  const MAX_HTML_LENGTH = 1024 * 1024;
  const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;

  function normalize(markup) {
    let html = String(markup || '').replace(/^\uFEFF/, '').trim();
    const fenced = html.match(/^```(?:html|htm)?\s*([\s\S]*?)\s*```$/i);
    if (fenced) html = fenced[1].trim();
    const start = html.search(/<!doctype\s+html\b|<html\b/i);
    if (start > 0) html = html.slice(start);
    const end = html.search(/<\/html\s*>/i);
    if (end >= 0) html = html.slice(0, end + html.slice(end).match(/^<\/html\s*>/i)[0].length);
    return html.trim();
  }

  function validate(markup) {
    const html = normalize(markup);
    const errors = [];
    const warnings = [];
    const fail = message => errors.push(message);

    if (!html) fail('O arquivo HTML está vazio.');
    if (html.length > MAX_HTML_LENGTH) fail('O arquivo excede o limite de 1 MiB.');
    if (!/<!doctype\s+html\b/i.test(html)) warnings.push('Inclua <!doctype html> para declarar HTML5.');
    for (const [tag, label] of [['html', '<html>'], ['head', '<head>'], ['body', '<body>']]) {
      if (!new RegExp(`<${tag}\\b`, 'i').test(html)) fail(`Estrutura incompleta: falta ${label}.`);
      if (!new RegExp(`</${tag}\\s*>`, 'i').test(html)) fail(`Estrutura incompleta: falta o fechamento de ${label}.`);
    }
    if (!/<title\b[^>]*>[\s\S]*?<\/title\s*>/i.test(html)) warnings.push('Adicione um <title> para identificar a página.');

    const balancedMarkup = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    const stack = [];
    for (const match of balancedMarkup.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
      const tag = match[1].toLowerCase();
      const closing = /^<\//.test(match[0]);
      if (!closing) {
        if (!VOID_TAGS.has(tag) && !/\/\s*>$/.test(match[0])) stack.push(tag);
        continue;
      }
      const openIndex = stack.lastIndexOf(tag);
      if (openIndex < 0) fail(`Fechamento sem abertura: </${tag}>.`);
      else if (openIndex !== stack.length - 1) fail(`Tags HTML fora de ordem antes de </${tag}>.`);
      else stack.pop();
    }
    if (stack.length) fail(`Tags sem fechamento: ${stack.slice(-5).map(tag => `<${tag}>`).join(', ')}.`);

    const ids = new Set();
    for (const match of html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) {
      if (ids.has(match[2])) fail(`ID duplicado: "${match[2]}".`);
      ids.add(match[2]);
    }

    for (const match of html.matchAll(/<(?:script|link|img|iframe|source|video|audio|embed|object|form)\b([^>]*)>/gi)) {
      const attributes = match[1];
      const reference = attributes.match(/\b(?:src|srcset|href|data|action)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (reference) {
        const value = (reference[1] || reference[2] || reference[3] || '').trim();
        if (value && !value.startsWith('#') && !/^data:/i.test(value)) {
          fail(`Dependência externa ou arquivo separado não permitido: "${value}". Gere um HTML autocontido.`);
        }
      }
    }
    if (/@import\s+(?:url\()?["']?(?:https?:)?\/\//i.test(html) || /url\(\s*["']?(?:https?:)?\/\//i.test(html)) {
      fail('CSS contém um recurso remoto; use estilos e recursos embutidos no arquivo.');
    }

    for (const match of html.matchAll(SCRIPT_TAG)) {
      const attributes = match[1];
      const script = match[2];
      if (/\bsrc\s*=/i.test(attributes)) continue;
      const type = (attributes.match(/\btype\s*=\s*(["'])(.*?)\1/i) || [])[2] || '';
      if (type && !/^(?:text|application)\/(?:java|ecma)script$|^module$/i.test(type)) continue;
      if (type.toLowerCase() === 'module') {
        warnings.push('Scripts do tipo module não têm verificação de sintaxe neste teste.');
        continue;
      }
      if (!script.trim()) warnings.push('Há um bloco JavaScript vazio.');
    }

    return { valid: errors.length === 0, errors, warnings, html };
  }

  async function validateInlineScripts(markup, analyzeCode) {
    if (typeof analyzeCode !== 'function') throw new Error('Análise de JavaScript indisponível neste aplicativo.');
    const scripts = [];
    for (const match of String(markup || '').matchAll(SCRIPT_TAG)) {
      if (/\bsrc\s*=/i.test(match[1])) continue;
      const type = (match[1].match(/\btype\s*=\s*(["'])(.*?)\1/i) || [])[2] || '';
      if (type && !/^(?:text|application)\/(?:java|ecma)script$/i.test(type)) continue;
      if (!match[2].trim()) continue;
      scripts.push(match[2]);
    }
    const errors = [];
    for (let index = 0; index < scripts.length; index++) {
      const report = await analyzeCode(scripts[index], 'javascript');
      if (report.syntaxCheck === 'failed') {
        const issue = report.issues.find(item => item.severity === 'high');
        errors.push(`JavaScript inválido no bloco ${index + 1}: ${issue?.message || 'erro de sintaxe'}.`);
      } else if (report.syntaxCheck !== 'passed') {
        throw new Error(`Não foi possível verificar a sintaxe do bloco JavaScript ${index + 1}.`);
      }
    }
    return errors;
  }

  root.jarvesGeneratedHtml = { normalize, validate, validateInlineScripts };
})(typeof window === 'undefined' ? globalThis : window);
