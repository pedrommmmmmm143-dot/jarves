((root) => {
  'use strict';

  const IMAGE_WORD = /\b(imagem|imagens|imagen|foto|fotos|fotografia|fotografias|ilustra(?:ção|ções)|desenho|desenhos|avatar|logotipo|logo|image|images|picture|pictures|photo|photos|illustration|illustrations)\b/i;
  const ACTION_WORD = /\b(gere|gera|gerar|crie|cria|criar|desenhe|desenha|desenhar|faça|faz|fazer|generate|create|draw|make|render)\b/i;
  const OTHER_DELIVERABLE = /\b(site|website|página|pagina|page|aplicativo|app|projeto|project|jogo|game|código|codigo|code|html)\b/i;
  const VIDEO_WORD = /\b(vídeo|vídeos|video|videos|clipe|clipes|clip|clips)\b/i;

  function getImagePrompt(message) {
    const text = String(message || '').trim();
    if (/^(?:como|how|what|why|where|when|o que|qual|quais)\b/i.test(text)) return null;
    const action = ACTION_WORD.exec(text);
    const image = IMAGE_WORD.exec(text);
    if (!action || !image || image.index < action.index) return null;
    if (OTHER_DELIVERABLE.test(text.slice(action.index + action[0].length, image.index))) return null;

    const description = text.slice(image.index + image[0].length)
      .replace(/^\s*(?:(?:de|do|da|dos|das|com|para|sobre|of|for|with)\b\s*)?[:,-]?\s*/i, '')
      .trim();
    if (description.length < 2) return null;
    return description.slice(0, 1200);
  }

  function getVideoPrompt(message) {
    const text = String(message || '').trim();
    if (/^(?:como|how|what|why|where|when|o que|qual|quais)\b/i.test(text)) return null;
    const action = ACTION_WORD.exec(text);
    const video = VIDEO_WORD.exec(text);
    if (!action || !video || video.index < action.index) return null;
    if (OTHER_DELIVERABLE.test(text.slice(action.index + action[0].length, video.index))) return null;

    const description = text.slice(video.index + video[0].length)
      .replace(/^\s*(?:(?:de|do|da|dos|das|com|para|sobre|of|for|with|about)\b\s*)?[:,-]?\s*/i, '')
      .trim();
    if (description.length < 2) return null;
    return description.slice(0, 2000);
  }

  root.jarvesMediaIntents = { getImagePrompt, getVideoPrompt };
})(typeof window === 'undefined' ? globalThis : window);
