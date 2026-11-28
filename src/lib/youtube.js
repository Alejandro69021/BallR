/**
 * Extracts a 11-character YouTube video ID from standard watch, live, shorts,
 * embed, or youtu.be URLs. Returns null if invalid.
 * @param {string} rawUrl
 * @returns {string|null}
 */
export function extractYouTubeVideoId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && ['live', 'embed', 'shorts', 'v'].includes(segments[0])) {
        const id = segments[1];
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Builds a privacy-enhanced YouTube embed URL (youtube-nocookie.com).
 * @param {string} videoId
 * @param {number} [startSeconds=0]
 * @returns {string}
 */
export function buildYouTubeEmbedUrl(videoId, startSeconds = 0) {
  const start = Math.max(0, Math.floor(Number(startSeconds) || 0));
  const params = new URLSearchParams({
    enablejsapi: '1',
    rel: '0',
    modestbranding: '1'
  });
  if (start > 0) params.set('start', String(start));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
