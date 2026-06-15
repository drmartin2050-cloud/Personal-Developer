export interface PlatformConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  officialLink: string;
  prefix: string;
  keyType: 'API_KEY' | 'SECRET_KEY' | 'WEBHOOK_URL' | 'AUTH_TOKEN' | 'CONNECTION_STRING';
  limitAr: string;
  limitEn: string;
  docLink: string;
  icon: string; // 'brain' | 'cpu' | 'sparkles' | 'database' | 'globe' | 'git' | 'terminal' etc
}

export const PLATFORMS_DATABASE: PlatformConfig[] = [
  {
    id: 'Google',
    nameAr: 'جوجل جيميناي (Google Gemini)',
    nameEn: 'Google Gemini',
    officialLink: 'https://aistudio.google.com/app/apikey',
    prefix: 'AIzaSy',
    keyType: 'API_KEY',
    limitAr: '15 طلب في الدقيقة (مستوى مجاني)',
    limitEn: '15 RPM (Free Tier)',
    docLink: 'https://ai.google.dev/gemini-api/docs',
    icon: 'sparkles'
  },
  {
    id: 'OpenAI',
    nameAr: 'أوبن إيه آي (OpenAI GPT)',
    nameEn: 'OpenAI',
    officialLink: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    keyType: 'API_KEY',
    limitAr: '$5 رصيد تجريبي عند التسجيل',
    limitEn: '$5 free trial credit on sign-up',
    docLink: 'https://platform.openai.com/docs',
    icon: 'brain'
  },
  {
    id: 'Anthropic',
    nameAr: 'أنثروبيك كلود (Anthropic Claude)',
    nameEn: 'Anthropic Claude',
    officialLink: 'https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-',
    keyType: 'API_KEY',
    limitAr: '$5 رصيد تدريب واختبار مجاني',
    limitEn: '$5 free evaluation credit',
    docLink: 'https://docs.anthropic.com/en/api/getting-started',
    icon: 'cpu'
  },
  {
    id: 'HuggingFace',
    nameAr: 'هاجينج فيس (Hugging Face)',
    nameEn: 'Hugging Face',
    officialLink: 'https://huggingface.co/settings/tokens',
    prefix: 'hf_',
    keyType: 'AUTH_TOKEN',
    limitAr: 'مستوى وصول عام ومجاني للمجتمع بالدقيقة',
    limitEn: 'Free community rate limit access',
    docLink: 'https://huggingface.co/docs/hub/security-tokens',
    icon: 'globe'
  },
  {
    id: 'Supabase',
    nameAr: 'سوبابيس (Supabase)',
    nameEn: 'Supabase',
    officialLink: 'https://supabase.com/dashboard',
    prefix: 'sbp_',
    keyType: 'CONNECTION_STRING',
    limitAr: 'مشروعين مجانيين وقاعدة بيانات 500MB',
    limitEn: '2 Free Projects, 500MB Database storage',
    docLink: 'https://supabase.com/docs',
    icon: 'database'
  },
  {
    id: 'Groq',
    nameAr: 'جروك (Groq LPU)',
    nameEn: 'Groq',
    officialLink: 'https://console.groq.com/keys',
    prefix: 'gsk_',
    keyType: 'API_KEY',
    limitAr: 'معدل طلبات عالي للمطورين مجاناً',
    limitEn: 'High API rate limit for development',
    docLink: 'https://console.groq.com/docs/quickstart',
    icon: 'terminal'
  },
  {
    id: 'Mistral',
    nameAr: 'ميسترال إيه آي (Mistral AI)',
    nameEn: 'Mistral AI',
    officialLink: 'https://console.mistral.ai/api-keys/',
    prefix: 'mst_',
    keyType: 'API_KEY',
    limitAr: 'مستوى مطور مجاني محدد بقيود',
    limitEn: 'Free usage tier with rate limits',
    docLink: 'https://docs.mistral.ai/',
    icon: 'sparkles'
  },
  {
    id: 'DeepSeek',
    nameAr: 'ديب سيك (DeepSeek AI)',
    nameEn: 'DeepSeek',
    officialLink: 'https://platform.deepseek.com/api_keys',
    prefix: 'sk-',
    keyType: 'API_KEY',
    limitAr: 'ملايين الرموز المجانية عند إطلاق الحساب',
    limitEn: 'Millions of free tokens upon account setup',
    docLink: 'https://api-docs.deepseek.com/',
    icon: 'brain'
  },
  {
    id: 'Cohere',
    nameAr: 'كوهير (Cohere)',
    nameEn: 'Cohere',
    officialLink: 'https://dashboard.cohere.com/api-keys',
    prefix: 'coh_',
    keyType: 'API_KEY',
    limitAr: 'مفتاح تجريبي مجاني لغايات التعلم والتطوير',
    limitEn: 'Free trial key for educational purposes',
    docLink: 'https://docs.cohere.com/',
    icon: 'cpu'
  },
  {
    id: 'n8n',
    nameAr: 'ويب هوك إن إيت إن (n8n Webhook)',
    nameEn: 'n8n Webhook',
    officialLink: 'https://n8n.io',
    prefix: 'http',
    keyType: 'WEBHOOK_URL',
    limitAr: 'سيرفر مجاني محلي أو استضافة سحابية خاضعة للمجتمع',
    limitEn: 'Unlimited executions on self-hosted instances',
    docLink: 'https://docs.n8n.io/',
    icon: 'network'
  },
  {
    id: 'Kimi',
    nameAr: 'كيمي مونشوت (Kimi Moonshot)',
    nameEn: 'Kimi Moonshot AI',
    officialLink: 'https://platform.moonshot.cn/console/api-keys',
    prefix: 'sk-',
    keyType: 'API_KEY',
    limitAr: 'رصيد اختبار تجريبي لخدمات الاستعلام الترجمي',
    limitEn: 'Trial credit for developer sandbox query',
    docLink: 'https://platform.moonshot.cn/docs',
    icon: 'sparkles'
  },
  {
    id: 'Cloudflare',
    nameAr: 'كلاود فلير (Cloudflare Workers)',
    nameEn: 'Cloudflare Workers',
    officialLink: 'https://dash.cloudflare.com/',
    prefix: 'cf_',
    keyType: 'API_KEY',
    limitAr: '100,000 استدعاء مجاني يومياً',
    limitEn: '100,000 free requests per day',
    docLink: 'https://developers.cloudflare.com/',
    icon: 'globe'
  },
  {
    id: 'GitHub',
    nameAr: 'جيت هاب لتطوير البرمجيات (GitHub)',
    nameEn: 'GitHub Developer',
    officialLink: 'https://github.com/settings/tokens',
    prefix: 'ghp_',
    keyType: 'AUTH_TOKEN',
    limitAr: 'مستودعات مجانية غير محدودة ومفاتيح وصول عامة',
    limitEn: 'Unlimited public/private repositories with active PAT',
    docLink: 'https://docs.github.com/en/rest',
    icon: 'git'
  },
  {
    id: 'MongoDB',
    nameAr: 'مونجو دي بي أطلس (MongoDB Atlas)',
    nameEn: 'MongoDB Atlas',
    officialLink: 'https://www.mongodb.com/cloud/atlas',
    prefix: 'mongodb+srv://',
    keyType: 'CONNECTION_STRING',
    limitAr: 'عنقود M0 مجاني بسعة 512MB تخزين مشارك',
    limitEn: 'Free M0 cluster with 512MB shared storage',
    docLink: 'https://www.mongodb.com/docs/atlas/',
    icon: 'database'
  },
  {
    id: 'Neon',
    nameAr: 'نيون بوستجرس السحابية (Neon Postgres)',
    nameEn: 'Neon Database',
    officialLink: 'https://console.neon.tech/',
    prefix: 'postgresql://',
    keyType: 'CONNECTION_STRING',
    limitAr: 'مشروع افتراضي نشط بسعة 0.5GiB مجاني بالكامل',
    limitEn: '1 Free Project with 0.5 GiB data storage',
    docLink: 'https://neon.tech/docs',
    icon: 'database'
  },
  {
    id: 'Upstash',
    nameAr: 'أبستاش ريديس ومقاييس الأداء (Upstash)',
    nameEn: 'Upstash Redis',
    officialLink: 'https://console.upstash.com/',
    prefix: 'redis://',
    keyType: 'CONNECTION_STRING',
    limitAr: '10,000 عملية مجانية يومياً لقواعد البيانات',
    limitEn: '10,000 free commands per day',
    docLink: 'https://docs.upstash.com/',
    icon: 'database'
  }
];
