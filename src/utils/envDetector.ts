import { AppEnvironment } from '../types';

export function detectEnvironment(): AppEnvironment {
  const hostname = window.location.hostname;
  const href = window.location.href;
  
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('3000') || hostname.includes('7860');
  const isHF = hostname.includes('hf.space') || href.includes('hf.space');
  const isGH = hostname.includes('github.io');

  let type: 'localhost' | 'huggingface' | 'github_pages' | 'unknown' = 'unknown';
  if (isLocal) type = 'localhost';
  else if (isHF) type = 'huggingface';
  else if (isGH) type = 'github_pages';

  return {
    type,
    isDevelopment: isLocal,
    proxyActive: isHF || isGH,
    allowedOrigins: [
      'https://drmartin2050-dachbord.hf.space',
      'https://huggingface.co',
      'http://localhost:3000',
      'http://localhost:7860'
    ]
  };
}

export function getFriendlyEnvName(type: string, lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    switch (type) {
      case 'localhost': return 'بيئة التطوير المحلية (Localhost)';
      case 'huggingface': return 'خوادم هجينغ فيس السحابية (Hugging Face Spaces)';
      case 'github_pages': return 'خدمة صفحات جيت هوب (GitHub Pages)';
      default: return 'سحابة مجهولة الهوية';
    }
  } else {
    switch (type) {
      case 'localhost': return 'Local Development (Localhost)';
      case 'huggingface': return 'Hugging Face Spaces (Production)';
      case 'github_pages': return 'GitHub Pages Static';
      default: return 'Unknown Cloud Space';
    }
  }
}
