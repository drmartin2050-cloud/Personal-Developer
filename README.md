---
title: Developer Sentry Portal
emoji: 🚀
colorFrom: slate
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🤖 Autonomous Sentry DevPortal & Encrypted Cloud Vault

An advanced cloud-synced portal constructed securely with **React 19**, **Vite**, **TypeScript**, and **Supabase (Durable Persistence)**. Integrated with an **Agentic AI Sentry Core Brain** that monitors token counts, automates cryptographic key validation routines, performs self-repairing failover swaps, and automates continuous deployment pipelines.

---

## 🚀 Environment Variable Strategy (Hugging Face Spaces + Local)

For single-page client-side React apps built as a Docker image, build-time variables are static. Accessing Hugging Face "Variables and Secrets" at runtime is typically impossible because the client JavaScript runs on the user's browser, not on a server.

### The Best Practice Solution: Runtime Script Injection

We resolve this problem completely using the **Runtime Script Injection** industry pattern:
1. **Dynamic Generation**: When the Docker container boots on Hugging Face, the runtime `CMD` reads live environment secrets (`GROQ_API_KEY`, `GEMINI_API_KEY`, etc.) and immediately writes them to `dist/env-config.js` via a startup command.
2. **Dual-Key Access**: 
   - **Production**: The application reads from `window.__ENV` dynamically loaded in the browser.
   - **Local Development**: The application falls back to `window.env` or standard `.env` variables (`import.meta.env.VITE_...`).
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
- **`GROQ_API_KEY`** (Starts with "gsk_")
- **`GEMINI_API_KEY`** (Starts with "AIza" - optional)
- **`OPENAI_API_KEY`** (Optional)
- **`DEEPSEEK_API_KEY`** (Optional)

---

## 📜 Architectural Configuration

Here is how the pipeline operates seamlessly:

1. **`index.html`**
   - Loads `<script src="/env-config.js"></script>` in `<head>` before the main React app.
   - Sets up the browser context containing the `window.__ENV` definition.

2. **`public/env-config.js`**
   - Serves as the developer fallback. Instantiates empty window configurations so your app builds and runs locally without 404 blockages.

3. **`src/ai/aiService.ts`**
   - Resolves LLM credentials securely, prioritize reading from `window.__ENV` before checking other sources. Trims spaces/quotes from keys, and logs diagnostics to confirm which keys are recognized.

4. **`src/main.tsx`**
   - Executing high-visibility diagnostics on startup. Scans environment variables and flags warnings to developers directly inside browser inspect panel if placeholder values are detected.

5. **`vite.config.ts`**
   - Pre-configured to serve port `7860` for Docker entry points, enabling `allowedHosts: true` to prevent CORS or blocked connection prompts on Hugging Face Spaces.

6. **`Dockerfile`**
   - Orchestrates multi-stage build. Builds standard production bundle assets, then assigns container runtime secrets dynamically into `/dist/env-config.js` immediately when the live container boots.

---

## ✅ Step-By-Step Verification Guideline

Follow these simple steps to verify your configuration works optimally:

1. **Deploy your Space**:
   - Push your code to the Space. When Hugging Face starts compiling the Docker image, wait for it to transition to **Running** state.
2. **Check your Secrets**:
   - Open your Space in the browser.
   - Right-click and choose **Inspect** elements, then switch to the **Console** tab.
   - You should see the custom `============= [Sentry HF Space Diagnostics] =============` block printed on startup. It will confirm if `GROQ_API_KEY` is loaded successfully and print the starting 4 characters.
3. **Trigger AI queries**:
   - Open the Assistant panel, and submit a prompt.
   - The system will call the Groq model with your configuration immediately!
