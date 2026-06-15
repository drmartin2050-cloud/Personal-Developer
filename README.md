---
title: Developer Sentry Portal
emoji: 🚀
colorFrom: slate
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🤖 Autonomous Sentry DevPortal & Encrypted Cloud Vault

An advanced cloud-synced portal constructed securely with **React 19**, **Vite**, **TypeScript**, and **Supabase (Durable Persistence)**. Integrated with an **Agentic AI Sentry Core Brain** that monitors token counts, automates cryptographic key validation routines, performs self-repairing failover swaps, and automates continuous deployment pipelines.

---

## 🚀 Environment Variable Strategy (Hugging Face Spaces + Local)

For single-page client React apps built as part of a Docker image, build-time variables are static, and accessing Hugging Face "Variables and Secrets" at runtime is typically impossible because the client JS runs on the user's browser, not on a server.

### The Best Practice Solution: Runtime Script Injection

We resolve this problem completely using the **Runtime Window Injection** industry pattern:
1. **Dynamic Generation**: When the Docker container boots on Hugging Face, it reads live environment secrets (`GROQ_API_KEY`, `GEMINI_API_KEY`, etc.) and immediately writes them to `dist/env-config.js` via a startup command.
2. **Universal Fallback**:
   - **Production**: The application reads from `window.env` dynamically loaded in the browser.
   - **Local Development**: The application reads from standard `.env` variables (`import.meta.env.VITE_...`), avoiding local script friction.
3. **No Prefix Dependency**: You can securely name secrets `GROQ_API_KEY`, `GEMINI_API_KEY` etc. in Hugging Face (no `VITE_` prefix required).

---

## 🛠️ Complete Environment Configuration

### `.env` File (Local Dev Only)
For local development, create a copy of `.env.example` as `.env` and assign your keys:
```env
VITE_GROQ_API_KEY="gsk_..."
VITE_GEMINI_API_KEY="AIzaSy..."
VITE_OPENAI_API_KEY="sk-proj-..."
VITE_DEEPSEEK_API_KEY="sk-..."
```

### Hugging Face Secrets Configuration
Create these keys EXACTLY as named below in Hugging Face under **Settings > Variables and Secrets**:
- **`GROQ_API_KEY`** (Primary)
- **`GEMINI_API_KEY`** (Secondary)
- **`OPENAI_API_KEY`** (Tertiary)
- **`DEEPSEEK_API_KEY`** (Quaternary)

---

## 📜 Architectural Change Log

We have modified and updated the following files to create a unified, robust codebase:

1. **`index.html`**
   - **Change**: Injected `<script src="/env-config.js"></script>` in `<head>`.
   - **Why**: Allows loading container environment configurations securely prior to boot.

2. **`/public/env-config.js`**
   - **Change**: Declared an empty `window.env` object.
   - **Why**: Prevents 404 server asset fetching warnings in local development.

3. **`/src/ai/aiService.ts`** (and proxies from `/src/utils/aiService.ts`)
   - **Change**: Modified the provider routing array to the requested order: `['groq', 'gemini', 'openai', 'deepseek']`. Included resilient `fetch` requests with customizable payload schemas and complete failover diagnostics logging.
   - **Why**: Ensures your preferred keys are consumed in priority order with graceful fallback tracking.

4. **`/vite.config.ts`**
   - **Change**: Enabled port `7860`, `host: '0.0.0.0'`, and white-listed domain hosts: `.hf.space`, `drmartin2050-dachbord.hf.space`.
   - **Why**: Directs Vite static preview and Hugging Face pipelines properly, while preventing CORS or Request Blocking.

5. **`/Dockerfile`**
   - **Change**: Re-oriented the exposed port to `7860`, added static file server configuration, and compiled a dynamic `CMD` that auto-writes global environment states safely into `/dist/env-config.js` on boot.
   - **Why**: Secures backend key management, supports standard container deployment workflows, and adheres to Hugging Face ingress requirements.

---

## ✅ Step-By-Step Verification Guideline

Follow these simple steps to verify your configuration works optimally:

1. **Test Port Bindings Locally**:
   Run `npm run build` and then run a dry-host check in the Docker container to ensure port `7860` binds cleanly.
2. **Review HF Allowed Hosts**:
   Deploy the code to Hugging Face Spaces. If the app displays, the `allowedHosts` block in `/vite.config.ts` is running and preventing requests from being blocks.
3. **Verify API Load States**:
   - Inspect the page console elements. Look for the `window.env` object structure to verify keys are cleanly loaded.
   - Open the AI Assistant component inside the browser and execute a message request.
   - The system will attempt to contact **Groq** using `GROQ_API_KEY`. If that fails or is missing, it will cascade gracefully to **Gemini**, **OpenAI**, and **DeepSeek**.
   - Review diagnostic feedback streams in console outputs or browser logs.
