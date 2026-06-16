// Local development fallback config, copied to dist/ at build time.
// Overwritten inside Docker container on Hugging Face startup using live secrets.
window.__ENV = {
  GROQ_API_KEY: '',
  GEMINI_API_KEY: '',
  OPENAI_API_KEY: '',
  DEEPSEEK_API_KEY: ''
};

window.env = window.__ENV;

console.log("[Sentry Diagnostic] Static public/env-config.js loaded. System initialized window.__ENV.", window.__ENV);
