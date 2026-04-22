// Vercel serverless function — SSRF-safe URL content extractor with
// origin allow-list + best-effort per-IP rate limiting.

const BLOCKED_HOSTS = [
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

// Origins allowed to call this function. Preview deployments use a wildcard
// suffix that ends with .vercel.app — the regex accepts that shape.
const ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/cock-roach\.vercel\.app$/,
  /^https:\/\/cock-roach(-[a-z0-9-]+)?-aasaanais-projects\.vercel\.app$/,
  /^https:\/\/cock-roach-git-[a-z0-9-]+-aasaanais-projects\.vercel\.app$/,
];

const RATE_LIMIT = { windowMs: 60_000, max: 20 };
const hits = new Map(); // ip -> array of recent request timestamps (ms)

function pickAllowedOrigin(origin) {
  if (!origin) return null;
  return ALLOWED_ORIGINS.some(r => r.test(origin)) ? origin : null;
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimitExceeded(ip) {
  const now = Date.now();
  const window = hits.get(ip)?.filter(t => now - t < RATE_LIMIT.windowMs) ?? [];
  if (window.length >= RATE_LIMIT.max) {
    hits.set(ip, window);
    return true;
  }
  window.push(now);
  hits.set(ip, window);
  // Best-effort cleanup so the Map doesn't grow unbounded across invocations
  if (hits.size > 1000) {
    for (const [k, ts] of hits) {
      if (!ts.some(t => now - t < RATE_LIMIT.windowMs)) hits.delete(k);
    }
  }
  return false;
}

function isSafeUrl(raw) {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const h = u.hostname.toLowerCase();
    return !BLOCKED_HOSTS.some(r => r.test(h));
  } catch {
    return false;
  }
}

function extractMeta(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

export default async function handler(req, res) {
  const origin = pickAllowedOrigin(req.headers.origin);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Reject cross-origin requests from unknown origins. Same-origin browser
  // requests and server-to-server requests (no Origin header) still pass.
  if (req.headers.origin && !origin) {
    return res.status(403).json({ error: 'Origin not permitted' });
  }

  const ip = getClientIp(req);
  if (rateLimitExceeded(ip)) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_LIMIT.windowMs / 1000)));
    return res.status(429).json({ error: 'Too many requests' });
  }

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

    const title = extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i) ?? new URL(target).hostname;

    const description =
      extractMeta(html, /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+content="([^"]+)"[^>]+name="description"/i);

    const author =
      extractMeta(html, /<meta[^>]+name="author"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+property="article:author"[^>]+content="([^"]+)"/i);

    const rawDate =
      extractMeta(html, /<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<meta[^>]+name="publish-date"[^>]+content="([^"]+)"/i) ??
      extractMeta(html, /<time[^>]+datetime="([^"]+)"/i);
    const publishDate = rawDate ? rawDate.slice(0, 10) : null;

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
