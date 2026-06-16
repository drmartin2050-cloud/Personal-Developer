import { AdvancedErrorInfo } from '../types';
import { getSupabaseClient } from './supabase';

export interface DiagnosticsReport {
  rootCauseAr: string;
  rootCauseEn: string;
  suggestionAr: string;
  suggestionEn: string;
  actionLink: string;
  actionLinkLabelAr: string;
  actionLinkLabelEn: string;
}

export function diagnoseError(
  message: string,
  statusCode?: number,
  provider?: string
): DiagnosticsReport {
  const lowercaseMsg = (message || '').toLowerCase();
  
  // 1. Rate Limit Checks (429)
  if (statusCode === 429 || lowercaseMsg.includes('rate_limit') || lowercaseMsg.includes('quota') || lowercaseMsg.includes('429') || lowercaseMsg.includes('decommissioned')) {
    if (lowercaseMsg.includes('decommissioned')) {
      return {
        rootCauseAr: 'تم إيقاف تشغيل النموذج البرمجي المستدعى بشكل نهائي من قبل مزود الخدمة.',
        rootCauseEn: 'The requested model has been deprecated or decommissioned by the provider.',
        suggestionAr: 'يرجى الانتقال فوراً إلى استخدام نموذج متاح حالياً مثل llama-3.3-70b-versatile في إعدادات التطبيق.',
        suggestionEn: 'Switch your active model configuration to llama-3.3-70b-versatile or gemini-2.5-flash immediately.',
        actionLink: 'https://console.groq.com/docs/models',
        actionLinkLabelAr: 'استعرض وثائق طرازات Groq المتوفرة',
        actionLinkLabelEn: 'View Groq Active Models Documentation'
      };
    }
    return {
      rootCauseAr: 'لقد تم تجاوز الحد المسموح به من الطلبات (Quota Exceeded) أو تجاوز حد معدل الاستهلاك للأيقونة المدفوعة.',
      rootCauseEn: 'API keys rate limit exceeded or subscription maximum token threshold reached.',
      suggestionAr: 'يرجى الانتظار لعدة ثوانٍ حتى تنتهي نافذة الضبط أو الانتقال إلى المفاتيح الاحتياطية المجدولة.',
      suggestionEn: 'Wait a few seconds for the rate limit window to reset, or switch to your automatic failover key.',
      actionLink: provider === 'gemini' ? 'https://aistudio.google.com/' : provider === 'groq' ? 'https://console.groq.com/keys' : 'https://platform.openai.com/api-keys',
      actionLinkLabelAr: 'إدارة حدود وحصص الحساب',
      actionLinkLabelEn: 'Manage API Limits & Settings'
    };
  }

  // 2. Authentication Checks (401 / Invalid Key)
  if (statusCode === 401 || lowercaseMsg.includes('invalid') || lowercaseMsg.includes('api key') || lowercaseMsg.includes('unauthorized') || lowercaseMsg.includes('auth') || lowercaseMsg.includes('expired')) {
    let actionLink = 'https://platform.openai.com/api-keys';
    let actionLinkLabelAr = 'توليد مفتاح OpenAI جديد';
    let actionLinkLabelEn = 'Generate New OpenAI Key';

    if (provider === 'gemini') {
      actionLink = 'https://aistudio.google.com/';
      actionLinkLabelAr = 'احصل على مفتاح Google Gemini مجاني';
      actionLinkLabelEn = 'Get Free Google Gemini Key';
    } else if (provider === 'groq') {
      actionLink = 'https://console.groq.com/keys';
      actionLinkLabelAr = 'إدارة لوحة مفاتيح Groq API';
      actionLinkLabelEn = 'Manage Groq API Keys';
    } else if (provider === 'deepseek') {
      actionLink = 'https://platform.deepseek.com/api_keys';
      actionLinkLabelAr = 'بوابة مفاتيح DeepSeek المطورين';
      actionLinkLabelEn = 'DeepSeek API Console';
    }

    return {
      rootCauseAr: 'رمز الاستدعاء (API Key) غير صالح أو منتهي الصلاحية أو لم يتم إعداده بنجاح كمتغير بيئي في خوادم Hugging Face Secrets.',
      rootCauseEn: 'The provided API authorization token is invalid, expired, or was not initialized in HF Secrets.',
      suggestionAr: 'تأكد من نسخ الرمز السري بشكل صحيح وبدون فراغات إضافية ثم ألصقه في لوحة الخزنة الخاصة بنا أو إعدادات مساحة العمل السحابية.',
      suggestionEn: 'Double-check that the API token was pasted fully without tailing whitespace into either the local Vault or HF secrets.',
      actionLink,
      actionLinkLabelAr,
      actionLinkLabelEn
    };
  }

  // 3. Insufficient Credits (402)
  if (statusCode === 402 || lowercaseMsg.includes('insufficient_funds') || lowercaseMsg.includes('credit') || lowercaseMsg.includes('billing')) {
    return {
      rootCauseAr: 'الرصيد في حساب المطور غير كافٍ لتنفيذ الاستدعاء المطلوب حالياً (الرصيد منخفض جداً أو البطاقة متوقفة).',
      rootCauseEn: 'Insufficient developer account funds. Your billing card was declined or balance is 0.',
      suggestionAr: 'يرجى فتح لوحة الشحن وإضافة بطاقة دفع صالحة أو إعادة تعيين الميزانية لتفادي توقف الخدمة.',
      suggestionEn: 'Open your cloud billing dashboard to verify or add funds and update payment cards.',
      actionLink: provider === 'groq' ? 'https://console.groq.com/settings/billing' : 'https://platform.openai.com/settings/billing',
      actionLinkLabelAr: 'تحديث رصيد الدفع الفوري',
      actionLinkLabelEn: 'Go to API Provider Billing Panel'
    };
  }

  // 4. CORS Issues
  if (lowercaseMsg.includes('cors') || lowercaseMsg.includes('allow-origin') || lowercaseMsg.includes('failed to fetch')) {
    return {
      rootCauseAr: 'تم حظر طلب المتصفح بواسطة نظام حماية المتصفح CORS (سياسات أمن النطاقات المشتركة للأجهزة المحمولة).',
      rootCauseEn: 'The browser blocked the network request due to strict CORS cross-origin script policies.',
      suggestionAr: 'قم بتمكين خيار "وكيل إزالة CORS التلقائي" أو تشغيل التطبيق في وضع الوكيل للتغلب على هذه القيود الفنية.',
      suggestionEn: 'Toggle on the "Automatic CORS Proxy Tunneling" filter to routing calls safely via proxy addresses.',
      actionLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
      actionLinkLabelAr: 'فهم سياسة حماية المتصفحات CORS',
      actionLinkLabelEn: 'Learn Mozilla CORS Policy'
    };
  }

  // Generic fallback diagnosis
  return {
    rootCauseAr: `حدث خطأ تقني غير متوقع أثناء معالجة الطلب لـ [${provider || 'مجهول'}]. تفاصيل: ${message}`,
    rootCauseEn: `An unexpected tech issue occurred during request handling. Details: ${message}`,
    suggestionAr: 'يرجى مراجعة حالة السيرفر، أو تفعيل بروتوكول تدوير المفاتيح والتبديل التلقائي للناقل الرديف.',
    suggestionEn: 'Please review backend health or trigger failover route switches to find a healthy responder.',
    actionLink: 'https://status.openai.com/',
    actionLinkLabelAr: 'متابعة حالة خوادم السيرفرات العالمية',
    actionLinkLabelEn: 'Check Global Provider Status Dashboard'
  };
}

/**
 * Persists error diagnostics record safely to Supabase for global tracking and self-repair analyses.
 */
export async function logErrorToDatabase(errorInfo: AdvancedErrorInfo): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Local / Sandbox persistent failover fallback
    const localLogs = JSON.parse(localStorage.getItem('developer_sentry_error_logs') || '[]');
    localLogs.unshift(errorInfo);
    localStorage.setItem('developer_sentry_error_logs', JSON.stringify(localLogs.slice(0, 50)));
    return;
  }

  try {
    await supabase.from('developer_error_logs').insert([
      {
        id: errorInfo.id,
        message: errorInfo.message,
        status_code: errorInfo.statusCode,
        provider: errorInfo.provider,
        masked_key: errorInfo.maskedKey,
        payload_data: errorInfo.payload ? JSON.stringify(errorInfo.payload) : null,
        response_data: errorInfo.responseBody,
        severity: errorInfo.severity,
        created_at: new Date().toISOString()
      }
    ]);
  } catch (err) {
    console.warn('Logging error log to remote Supabase failed. Writing locally...', err);
    const localLogs = JSON.parse(localStorage.getItem('developer_sentry_error_logs') || '[]');
    localLogs.unshift(errorInfo);
    localStorage.setItem('developer_sentry_error_logs', JSON.stringify(localLogs.slice(0, 50)));
  }
}
