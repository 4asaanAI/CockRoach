// Dev-only server. Prod is Vite static build served by Vercel + the serverless
// handlers in /api. This file mounts those same handlers as Express routes so
// `npm run dev` mirrors prod routing exactly — no duplicated logic.
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import scrapeHandler from "./api/scrape.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", name: "Cockroach API" });
  });

  // Delegate to the same handler Vercel runs in prod
  app.all("/api/scrape", (req, res) => scrapeHandler(req as never, res as never));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cockroach] Dev server on http://localhost:${PORT}`);
  });
}

startServer();
