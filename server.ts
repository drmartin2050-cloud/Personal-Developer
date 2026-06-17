import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to proxy HuggingFace requests (Bypassing CORS entirely)
  app.post("/api/hf/whoami", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: "No token provided" });

      const hfRes = await fetch("https://huggingface.co/api/whoami", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (hfRes.status === 401 || hfRes.status === 403) {
        return res.status(hfRes.status).json({ error: "UNAUTHORIZED", status: hfRes.status });
      }

      if (!hfRes.ok) {
        return res.status(hfRes.status).json({ error: "HF_API_ERROR", status: hfRes.status });
      }

      const data = await hfRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("HF whoami proxy error:", err);
      res.status(500).json({ error: "PROXY_NETWORK_ERROR", details: err.message });
    }
  });

  app.post("/api/hf/spaces", async (req, res) => {
    try {
      const { token, author } = req.body;
      if (!author) return res.status(400).json({ error: "No author provided" });

      const hfRes = await fetch(`https://huggingface.co/api/spaces?author=${author}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!hfRes.ok) throw new Error(`HF API error: ${hfRes.status}`);

      const data = await hfRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("HF spaces proxy error:", err);
      res.status(500).json({ error: "PROXY_NETWORK_ERROR", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express v4, use '*'
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
