import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", name: "Cockroach API" });
  });

  // Example LLM Proxy route (placeholder for Phase 2)
  app.post("/api/chat", async (req, res) => {
    // Logic for provider-agnostic switching will go here
    res.status(501).json({ error: "LLM abstraction layer implementation in progress" });
  });

  // URL scrape proxy — SSRF-safe content extractor (dev parity with Vercel api/scrape.js)
  const SCRAPE_BLOCKED = [
    /^localhost$/i, /^127\./, /^0\.0\.0\.0$/, /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^::1$/,
    /^169\.254\./, /\.internal$/i, /\.local$/i,
  ];
  app.get("/api/scrape", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).json({ error: 'url param required' });
    const target = decodeURIComponent(rawUrl);
    try {
      const u = new URL(target);
      if (!['http:', 'https:'].includes(u.protocol)) return res.status(403).json({ error: 'Protocol not allowed' });
      if (SCRAPE_BLOCKED.some(r => r.test(u.hostname.toLowerCase()))) return res.status(403).json({ error: 'URL not permitted' });
    } catch { return res.status(400).json({ error: 'Invalid URL' }); }
    try {
      const r = await fetch(target, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CockRoach-bot/1.0)', Accept: 'text/html,text/plain' },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const html = await r.text();
      const gt = (p: RegExp) => { const m = html.match(p); return m ? m[1].trim() : null; };
      const title = gt(/<title[^>]*>([^<]+)<\/title>/i) ?? new URL(target).hostname;
      const description = gt(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ?? gt(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
      const author = gt(/<meta[^>]+name="author"[^>]+content="([^"]+)"/i);
      const rawDate = gt(/<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/i) ?? gt(/<time[^>]+datetime="([^"]+)"/i);
      const publishDate = rawDate ? rawDate.slice(0, 10) : null;
      const clean = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '').replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\s{2,}/g, ' ').trim().slice(0, 24000);
      res.json({ text: clean, title, url: target, author, publishDate, description });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cockroach] Server running on http://localhost:${PORT}`);
  });
}

startServer();
