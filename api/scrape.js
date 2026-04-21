// Vercel serverless function — SSRF-safe URL content extractor
const BLOCKED = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
  /\.internal$/i,
  /\.local$/i,
];

function isSafeUrl(raw) {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const h = u.hostname.toLowerCase();
    return !BLOCKED.some(r => r.test(h));
  } catch {
    return false;
  }
}

function extractMeta(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url param required' });

  const target = decodeURIComponent(url);

  if (!isSafeUrl(target)) {
    return res.status(403).json({ error: 'URL not permitted' });
  }

  try {
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CockRoach-bot/1.0; +https://cockroach.ai)',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Title
    const title = extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i) ?? new URL(target).hostname;

    // Description (og or meta)
    const description =
      extractMeta(html, /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+content="([^"]+)"[^>]+name="description"/i);

    // Author
    const author =
      extractMeta(html, /<meta[^>]+name="author"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+property="article:author"[^>]+content="([^"]+)"/i);

    // Publish date
    const rawDate =
      extractMeta(html, /<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+name="publish-date"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<time[^>]+datetime="([^"]+)"/i);
    const publishDate = rawDate ? rawDate.slice(0, 10) : null;

    // Clean body content
    const clean = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 24000);

    res.status(200).json({ text: clean, title, url: target, author, publishDate, description });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
