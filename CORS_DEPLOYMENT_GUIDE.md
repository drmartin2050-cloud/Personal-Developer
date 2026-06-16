# 🛡️ Advanced Sentry Sentry & Failover CORS Deployment Architecture Guide

The autonomous failover routing setup is designed for robust operation in both development and production (Hugging Face Spaces, Docker container).

---

## 🚀 Architectural Configuration Overview

We support client-side **failover routing** between four major models:
1. **Groq API** (`llama-3.3-70b-versatile` - fast & stable)
2. **Google Gemini API** (`gemini-2.5-flash` - robust fallback)
3. **OpenAI API** (`gpt-4o-mini` - premium alternate)
4. **DeepSeek API** (`deepseek-chat` - high availability coder)

---

## 🛠️ The Host-Resolution Window Pattern

Since client-side tokens are prone to exposure in static web applications, and Hugging Face secrets are only accessible server-side inside Docker or python runners, we resolve this with a transparent **Runtime Window Injector**:

1. On boot, the container executes standard secure shell commands:
   ```bash
   echo "window.env = { GROQ_API_KEY: '${GROQ_API_KEY}' };" > dist/env-config.js
   ```
2. The index markup references the script before launching the main bundle:
   ```html
   <script src="/env-config.js"></script>
   ```
3. The API client evaluates `window.env` dynamically, falling back to local `import.meta.env` if local test variables are declared.

---

## 🌐 Dynamic CORS Self-Healing Routing

- **Direct Pathing**: Evaluated for Gemini and Groq (which support direct cross-origin calls).
- **Proxy Tunneling**: If calling standard OpenAI / DeepSeek gateways from hosted sandboxes raises server origin issues, Sentry immediately wraps the connection inside standard proxy routers (`api.allorigins.win`/`corsproxy.io`) dynamically to guarantee uptime and avoid call drops.
- **Failover Swapping**: If a node returns `429` (Quota Exceeded) or `401` (Key Revoked), the Sentry rotates to the next available token automatically on-the-fly, logging self-healing traces inside `localStorage`/`Supabase`.
