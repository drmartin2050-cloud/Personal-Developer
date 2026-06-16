import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  getEnvStatus, 
  testSupabaseConnection, 
  testFirebaseConnection 
} from '../utils/envValidator';
import { encryptWithWebCrypto, decryptWithWebCrypto } from '../utils/encryption';
import { proxyFetch } from '../utils/apiProxy';
import { 
  Activity, ShieldCheck, Database, Key, CheckCircle, 
  XCircle, AlertTriangle, RefreshCw, Download, Play, 
  Lock, BrainCircuit, Terminal, Sparkles, HelpCircle 
} from 'lucide-react';

interface TestResult {
  name: string;
  category: 'database' | 'security' | 'intelligence';
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  message: string;
  latency?: number;
}

export default function ConnectionTest({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  const [runningAll, setRunningAll] = useState(false);
  const [envStatus, setEnvStatus] = useState(() => getEnvStatus());
  const [tests, setTests] = useState<Record<string, TestResult>>({
    supabase: { name: 'Supabase Database', category: 'database', status: 'PENDING', message: lang === 'ar' ? 'بانتظار إجراء التحقق...' : 'Awaiting manual trigger...' },
    firebase: { name: 'Firebase Firestore', category: 'database', status: 'PENDING', message: lang === 'ar' ? 'بانتظار إجراء التحقق...' : 'Awaiting manual trigger...' },
    vault: { name: 'Secure Vault Encrypt', category: 'security', status: 'PENDING', message: lang === 'ar' ? 'بانتظار إجراء التحقق...' : 'Awaiting manual trigger...' },
    gemini: { name: 'Google Gemini API', category: 'intelligence', status: 'PENDING', message: lang === 'ar' ? 'بانتظار إجراء التحقق...' : 'Awaiting manual trigger...' },
    groq: { name: 'Groq Cloud LLM API', category: 'intelligence', status: 'PENDING', message: lang === 'ar' ? 'بانتظار إجراء التحقق...' : 'Awaiting manual trigger...' }
  });

  const [lastTested, setLastTested] = useState<string | null>(null);

  const refreshEnvStatus = () => {
    setEnvStatus(getEnvStatus());
  };

  const getEnvValue = (name: string): string => {
    return (import.meta as any).env?.[name] || (window as any).env?.[name] || '';
  };

  const runSupabaseTest = async (): Promise<TestResult> => {
    setTests(prev => ({
      ...prev,
      supabase: { ...prev.supabase, status: 'PENDING', message: lang === 'ar' ? 'جاري الاتصال والتحقق من الاستجابة...' : 'Pinging database endpoint...' }
    }));
    
    const res = await testSupabaseConnection();
    const result: TestResult = {
      name: 'Supabase Database',
      category: 'database',
      status: res.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      message: res.message,
      latency: res.latencyMs
    };

    setTests(prev => ({ ...prev, supabase: result }));
    return result;
  };

  const runFirebaseTest = async (): Promise<TestResult> => {
    setTests(prev => ({
      ...prev,
      firebase: { ...prev.firebase, status: 'PENDING', message: lang === 'ar' ? 'جاري طلب استعلام خادم Firestore...' : 'Pinging Firebase endpoint...' }
    }));

    const res = await testFirebaseConnection();
    const result: TestResult = {
      name: 'Firebase Firestore',
      category: 'database',
      status: res.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      message: res.message,
      latency: res.latencyMs
    };

    setTests(prev => ({ ...prev, firebase: result }));
    return result;
  };

  const runVaultTest = async (): Promise<TestResult> => {
    setTests(prev => ({
      ...prev,
      vault: { ...prev.vault, status: 'PENDING', message: lang === 'ar' ? 'جاري توليد مفتاح AES-GCM 256...' : 'Generating AES-GCM 256 crypt...' }
    }));

    const start = Date.now();
    try {
      const originalText = "Eissa-Master-Sentry-Verification-2026";
      const dummyPass = "Eissa2026";
      
      // 1. Test Encryption
      const encrypted = await encryptWithWebCrypto(originalText, dummyPass);
      if (!encrypted || !encrypted.includes(':')) {
        throw new Error('فشل تشفير مفاتيح الخزنة.');
      }

      // 2. Test Decryption
      const decrypted = await decryptWithWebCrypto(encrypted, dummyPass);
      if (decrypted !== originalText) {
        throw new Error('فشل فك التشفير: البيانات الناتجة مشوهة.');
      }

      const result: TestResult = {
        name: 'Secure Vault Encrypt',
        category: 'security',
        status: 'SUCCESS',
        message: lang === 'ar' 
          ? 'تشفير الخزنة يعمل بشكل ممتاز مع معيار AES-GCM 256.' 
          : 'Vault dynamic cryptography fully operational (AES-GCM 256).',
        latency: Date.now() - start
      };
      setTests(prev => ({ ...prev, vault: result }));
      return result;
    } catch (err: any) {
      const result: TestResult = {
        name: 'Secure Vault Encrypt',
        category: 'security',
        status: 'ERROR',
        message: lang === 'ar' 
          ? `فشل فحص برمجية الخزنة: ${err.message || String(err)}`
          : `Vault cryptography error: ${err.message || String(err)}`,
        latency: Date.now() - start
      };
      setTests(prev => ({ ...prev, vault: result }));
      return result;
    }
  };

  const runGeminiTest = async (): Promise<TestResult> => {
    setTests(prev => ({
      ...prev,
      gemini: { ...prev.gemini, status: 'PENDING', message: lang === 'ar' ? 'جاري فحص ترخيص محرك Gemini...' : 'Pinging Google Gemini API...' }
    }));

    const start = Date.now();
    const token = getEnvValue('VITE_GEMINI_API_KEY');
    if (!token) {
      const result: TestResult = {
        name: 'Google Gemini API',
        category: 'intelligence',
        status: 'ERROR',
        message: lang === 'ar' ? 'مفتاح Gemini مفقود! يرجى إعداده كمتغير بيئي.' : 'Gemini key is missing in active workspace variables.'
      };
      setTests(prev => ({ ...prev, gemini: result }));
      return result;
    }

    try {
      // Small real call to gather metadata (highly safe & CORS proxy resolved)
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${token}`;
      const res = await proxyFetch(url);
      
      const latency = Date.now() - start;
      if (res.status === 200) {
        const result: TestResult = {
          name: 'Google Gemini API',
          category: 'intelligence',
          status: 'SUCCESS',
          message: lang === 'ar' ? 'تم مصادقة مفتاح Gemini بنجاح. القنوات ذكية ومفتوحة!' : 'Gemini validation resolved with code 200. Models online.',
          latency
        };
        setTests(prev => ({ ...prev, gemini: result }));
        return result;
      } else {
        const result: TestResult = {
          name: 'Google Gemini API',
          category: 'intelligence',
          status: 'ERROR',
          message: lang === 'ar' ? `رفضت Google المفتاح برمز (${res.status}).` : `Google gateway rejected token (HTTP status ${res.status}).`,
          latency
        };
        setTests(prev => ({ ...prev, gemini: result }));
        return result;
      }
    } catch (err: any) {
      const result: TestResult = {
        name: 'Google Gemini API',
        category: 'intelligence',
        status: 'ERROR',
        message: lang === 'ar' ? `فشل الاتصال: ${err.message || 'خطأ في جدار الحماية'}` : `Fetch error: ${err.message || 'CORS or offline'}`,
        latency: Date.now() - start
      };
      setTests(prev => ({ ...prev, gemini: result }));
      return result;
    }
  };

  const runGroqTest = async (): Promise<TestResult> => {
    setTests(prev => ({
      ...prev,
      groq: { ...prev.groq, status: 'PENDING', message: lang === 'ar' ? 'جاري فحص ترخيص خادم Groq السحابي...' : 'Pinging Groq Cloud API...' }
    }));

    const start = Date.now();
    const token = getEnvValue('VITE_GROQ_API_KEY');
    if (!token) {
      const result: TestResult = {
        name: 'Groq Cloud LLM API',
        category: 'intelligence',
        status: 'ERROR',
        message: lang === 'ar' ? 'المفتاح لم يتم تعيينه. يرجى إدخال VITE_GROQ_API_KEY.' : 'Groq API Key is not set.'
      };
      setTests(prev => ({ ...prev, groq: result }));
      return result;
    }

    try {
      // Probe Models API (lightweight endpoint check)
      const res = await proxyFetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const latency = Date.now() - start;
      if (res.status === 200) {
        const result: TestResult = {
          name: 'Groq Cloud LLM API',
          category: 'intelligence',
          status: 'SUCCESS',
          message: lang === 'ar' ? 'الاتصال بـ Groq نشط ومصرح للاستدعاء بنجاح.' : 'Groq gateway authentication successful. High-speed LLM online.',
          latency
        };
        setTests(prev => ({ ...prev, groq: result }));
        return result;
      } else {
        const result: TestResult = {
          name: 'Groq Cloud LLM API',
          category: 'intelligence',
          status: 'ERROR',
          message: lang === 'ar' ? `مفاتيح غير مصرحة في خادم Groq (${res.status}).` : `Groq rejected the authorization (HTTP status ${res.status}).`,
          latency
        };
        setTests(prev => ({ ...prev, groq: result }));
        return result;
      }
    } catch (err: any) {
      const result: TestResult = {
        name: 'Groq Cloud LLM API',
        category: 'intelligence',
        status: 'ERROR',
        message: lang === 'ar' ? `فشل المصافحة: CORS أو خادم غير متصل بالإنترنت.` : `Handshake exception: CORS restriction or destination model server is offline.`,
        latency: Date.now() - start
      };
      setTests(prev => ({ ...prev, groq: result }));
      return result;
    }
  };

  const runAllDiagnostics = async () => {
    setRunningAll(true);
    refreshEnvStatus();

    await runSupabaseTest();
    await runFirebaseTest();
    await runVaultTest();
    await runGeminiTest();
    await runGroqTest();

    setLastTested(new Date().toLocaleTimeString());
    setRunningAll(false);
  };

  const exportJSONResults = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        environmentVariables: envStatus,
        connectionTests: tests
      }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Sentry_Diagnostic_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Test Controls Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Colorful Gradient Light effect */}
        <div className="absolute top-0 right-0 h-[120px] w-[200px] bg-gradient-to-tr from-cyan-400 via-indigo-600 to-purple-500 rounded-full blur-[90px] opacity-25 pointer-events-none" />
        
        <div className="space-y-1.5 z-10 text-center md:text-right">
          <h2 className="text-xl font-black bg-gradient-to-r from-red-200 via-indigo-200 to-cyan-200 bg-clip-text text-transparent flex items-center justify-center md:justify-start gap-2">
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span>{lang === 'ar' ? 'لوحة الاختبارات والتشخيص الذاتي' : 'Sentry AI Active Diagnostic Console'}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            {lang === 'ar' 
              ? 'قم بمراقبة وفحص اتصالات قواعد البيانات السحابية، وسلامة تراخيص ذكاء قوين الاصطناعي، ومزامنة المتغيرات البيئية من مكان واحد.' 
              : 'Execute end-to-end cloud database ping tests, verify cryptographic master key vaults, and inspect active Gemini and Groq API handshakes.'}
          </p>
          {lastTested && (
            <p className="text-[10px] font-mono text-cyan-500 font-semibold uppercase">
              {lang === 'ar' ? `آخر فحص نشط: ${lastTested}` : `Last telemetry probe: ${lastTested}`}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 z-10 w-full md:w-auto justify-center">
          <button
            id="btn-run-all-diagnostics"
            type="button"
            onClick={runAllDiagnostics}
            disabled={runningAll}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:scale-103 font-bold text-xs text-white transition shadow-lg shadow-indigo-600/20 active:scale-97 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${runningAll ? 'animate-spin' : ''}`} />
            <span>{runningAll ? (lang === 'ar' ? 'جاري الفحص...' : 'Probing...') : (lang === 'ar' ? 'إجراء فحص شامل للقنوات' : 'Run Full Diagnostics')}</span>
          </button>

          <button
            id="btn-export-reports"
            type="button"
            onClick={exportJSONResults}
            className="flex items-center gap-1.5 px-4  py-3 rounded-2xl bg-slate-800 border border-slate-700 font-bold text-xs text-slate-200 hover:bg-slate-700/80 active:scale-97 transition"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>{lang === 'ar' ? 'تصدير كملف JSON' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Variables list & Connection status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Box 1: Env vars audit (Masqued panel) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-purple-400" />
              <span>{lang === 'ar' ? 'التحقق من متغيرات البيئة' : 'Active Keys & Environment Variables'}</span>
            </h3>
            <button
              onClick={refreshEnvStatus}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
            >
              {lang === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {lang === 'ar' 
              ? 'تُسحب هذه المفاتيح تلقائياً ومباشرة من إعدادات Hugging Face Secrets لضمان حماية خادم العميل القصوى وعدم كشف الرموز للمتصفح.'
              : 'Environment variables are loaded securely from your hosting Secrets context. Values are masked to protect authorization endpoints.'}
          </p>

          <div className="space-y-2.5">
            {envStatus.map((env, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:bg-slate-950/80 transition duration-200"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black font-mono text-slate-300">{env.keyName}</span>
                    {env.isOptional && (
                      <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono font-bold">OPTIONAL</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider">{env.maskedValue}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {env.isLoaded ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-lg">
                      <CheckCircle className="h-3 w-3" />
                      <span>{lang === 'ar' ? 'جاهز' : 'Loaded'}</span>
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                      env.isOptional ? 'text-yellow-400 bg-yellow-500/5 border border-yellow-500/10' : 'text-rose-400 bg-rose-500/5 border border-rose-500/10'
                    }`}>
                      <AlertTriangle className="h-3 w-3 animate-pulse" />
                      <span>{lang === 'ar' ? 'غير متوفر' : 'Missing'}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Test Suites and Latency logs */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>{lang === 'ar' ? 'فحوصات الاتصال السحابية النشطة' : 'Active Connection Guard Tests'}</span>
            </h3>
            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
              TELEMETRY_SUITE
            </span>
          </div>

          <div className="space-y-3.5">
            
            {/* Supabase Box */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 hover:bg-slate-950/60 transition">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Database className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                    <span>{lang === 'ar' ? 'قاعدة بيانات Supabase الموحدة' : 'Supabase Multi-Tenant Engine'}</span>
                    {tests.supabase.latency !== undefined && (
                      <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/50 px-1.5 py-0.2 rounded">
                        {tests.supabase.latency}ms
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">{tests.supabase.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <StatusMarker status={tests.supabase.status} lang={lang} />
                <button
                  type="button"
                  onClick={runSupabaseTest}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition"
                  title="Run Single Probe"
                >
                  <Play className="h-3 w-3 text-cyan-400 fill-current" />
                </button>
              </div>
            </div>

            {/* Firebase Box */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 hover:bg-slate-950/60 transition">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Database className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                    <span>{lang === 'ar' ? 'جسر البيانات السحابي Firebase Auth' : 'Firebase Firestore & OAuth'}</span>
                    {tests.firebase.latency !== undefined && (
                      <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/50 px-1.5 py-0.2 rounded">
                        {tests.firebase.latency}ms
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">{tests.firebase.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <StatusMarker status={tests.firebase.status} lang={lang} />
                <button
                  type="button"
                  onClick={runFirebaseTest}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition"
                  title="Run Single Probe"
                >
                  <Play className="h-3 w-3 text-cyan-400 fill-current" />
                </button>
              </div>
            </div>

            {/* Vault Box */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 hover:bg-slate-950/60 transition">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                    <span>{lang === 'ar' ? 'خزنة التشفير AES-GCM 256' : 'AES Cryptographic Web Crypto Vault'}</span>
                    {tests.vault.latency !== undefined && (
                      <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/50 px-1.5 py-0.2 rounded">
                        {tests.vault.latency}ms
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">{tests.vault.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <StatusMarker status={tests.vault.status} lang={lang} />
                <button
                  type="button"
                  onClick={runVaultTest}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition"
                  title="Run Single Probe"
                >
                  <Play className="h-3 w-3 text-cyan-400 fill-current" />
                </button>
              </div>
            </div>

            {/* Gemini Box */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 hover:bg-slate-950/60 transition">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400">
                  <BrainCircuit className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                    <span>{lang === 'ar' ? 'محرك Google Gemini وقسائم الذكاء' : 'Google Gemini AI Endpoint'}</span>
                    {tests.gemini.latency !== undefined && (
                      <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/50 px-1.5 py-0.2 rounded">
                        {tests.gemini.latency}ms
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">{tests.gemini.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <StatusMarker status={tests.gemini.status} lang={lang} />
                <button
                  type="button"
                  onClick={runGeminiTest}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition"
                  title="Run Single Probe"
                >
                  <Play className="h-3 w-3 text-cyan-400 fill-current" />
                </button>
              </div>
            </div>

            {/* Groq Box */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 hover:bg-slate-950/60 transition">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                    <span>{lang === 'ar' ? 'بوابة Groq Cloud فائقة السرعة' : 'Groq Cloud High-Speed Gateway'}</span>
                    {tests.groq.latency !== undefined && (
                      <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/50 px-1.5 py-0.2 rounded">
                        {tests.groq.latency}ms
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">{tests.groq.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <StatusMarker status={tests.groq.status} lang={lang} />
                <button
                  type="button"
                  onClick={runGroqTest}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition"
                  title="Run Single Probe"
                >
                  <Play className="h-3 w-3 text-cyan-400 fill-current" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

function StatusMarker({ status, lang }: { status: 'SUCCESS' | 'ERROR' | 'PENDING', lang: 'ar' | 'en' }) {
  if (status === 'SUCCESS') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>{lang === 'ar' ? 'مستقر' : 'SUCCESS'}</span>
      </span>
    );
  }

  if (status === 'ERROR') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl">
        <XCircle className="h-3.5 w-3.5 animate-pulse" />
        <span>{lang === 'ar' ? 'فشل' : 'FAILED'}</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-xl">
      <HelpCircle className="h-3.5 w-3.5" />
      <span>{lang === 'ar' ? 'بانتظار الفحص' : 'PENDING'}</span>
    </span>
  );
}
