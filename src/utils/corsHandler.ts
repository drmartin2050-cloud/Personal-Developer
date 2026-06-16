import { detectEnvironment } from './envDetector';

export interface CORSStatus {
  blocked: boolean;
  requiresProxy: boolean;
  methodUsed: 'direct' | 'proxy' | 'fallback_proxy';
  statusTextText: string;
}

export function evaluateCORS(url: string): CORSStatus {
  const env = detectEnvironment();
  
  // Non-safe browser APIs typically require CORS headers
  const isExternalApi = !url.includes(window.location.host);
  
  if (!isExternalApi) {
    return {
      blocked: false,
      requiresProxy: false,
      methodUsed: 'direct',
      statusTextText: 'اتصال مباشر داخلي آمن (Direct secure path)'
    };
  }

  // Certain modern AI Gateways (like Google Gemini API with key inside URL, and Groq) support browser CORS by default.
  // Others (like OpenAI or Deepseek) might block browser-side queries when coming from standard sandbox hostnames.
  const isSpecialCORSAllowed = url.includes('generativelanguage.googleapis.com') || url.includes('groq.com');

  if (isSpecialCORSAllowed) {
    return {
      blocked: false,
      requiresProxy: false,
      methodUsed: 'direct',
      statusTextText: 'اتصال مباشر مرخص (Direct CORS authorized)'
    };
  }

  if (env.type === 'huggingface' || env.type === 'github_pages') {
    return {
      blocked: true,
      requiresProxy: true,
      methodUsed: 'proxy',
      statusTextText: 'توجيه عبر بوابة وكيل الحماية الهجينة (Secure Proxy route)'
    };
  }

  return {
    blocked: false,
    requiresProxy: false,
    methodUsed: 'direct',
    statusTextText: 'تطوير محلي - سماح افتراضي (Local Dev bypass)'
  };
}
