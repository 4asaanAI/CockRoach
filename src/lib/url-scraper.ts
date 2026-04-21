export interface ScrapedContent {
  url: string;
  title: string;
  text: string;
  description: string | null;
  author: string | null;
  publishDate: string | null;
}

export interface UrlPreview {
  url: string;
  status: 'fetching' | 'ready' | 'error';
  data?: ScrapedContent;
  error?: string;
}

const URL_REGEX = /https?:\/\/(?:[a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;

// In-memory cache: url → { data, timestamp }
const _cache = new Map<string, { data: ScrapedContent; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function detectUrls(text: string): string[] {
  return [...new Set(text.match(URL_REGEX) ?? [])];
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const now = Date.now();
  const hit = _cache.get(url);
  if (hit && now - hit.ts < CACHE_TTL) return hit.data;

  const resp = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try { const e = await resp.json(); msg = e.error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const raw = await resp.json();
  if (raw.error) throw new Error(raw.error);

  const data: ScrapedContent = {
    url: raw.url,
    title: raw.title ?? url,
    text: raw.text ?? '',
    description: raw.description ?? null,
    author: raw.author ?? null,
    publishDate: raw.publishDate ?? null,
  };

  _cache.set(url, { data, ts: now });
  return data;
}

export function getUrlDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export function buildUrlContext(previews: Map<string, UrlPreview>): string {
  const ready = [...previews.values()].filter(p => p.status === 'ready' && p.data);
  if (!ready.length) return '';
  const parts = ready.map(p => {
    const d = p.data!;
    const meta = [d.author && `Author: ${d.author}`, d.publishDate && `Date: ${d.publishDate}`].filter(Boolean).join(' | ');
    return `[WEB PAGE: ${d.title}${meta ? ` (${meta})` : ''}]\nURL: ${d.url}\n\n${d.text.slice(0, 4000)}`;
  });
  return `\n\n---\nWEB CONTENT CONTEXT:\n${parts.join('\n\n---\n')}\n---`;
}
