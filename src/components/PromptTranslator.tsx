import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Save, 
  Coins, 
  TrendingDown, 
  Info, 
  Database, 
  ArrowRightLeft, 
  ArrowDownToLine, 
  FileCode2,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { countTokens } from '../lib/tokenCounter';
import { askAI } from '../ai/aiService';
import { getSavedPrompts, savePromptToVault, deletePromptFromVault, SavedPromptRecord } from '../utils/vaultManager';
import { isSupabaseConnected } from '../utils/supabase';
import { safeCopyToClipboard } from '../utils/clipboard';

interface PromptTranslatorProps {
  key?: string;
  lang: 'ar' | 'en';
}

export default function PromptTranslator({ lang }: PromptTranslatorProps) {
  const [arabicPrompt, setArabicPrompt] = useState('');
  const [englishPrompt, setEnglishPrompt] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [translationMode, setTranslationMode] = useState<'optimized' | 'literal'>('optimized');
  
  // Stats
  const [arabicTokens, setArabicTokens] = useState(0);
  const [englishTokens, setEnglishTokens] = useState(0);
  const [savedRecords, setSavedRecords] = useState<SavedPromptRecord[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [costPer1k, setCostPer1k] = useState<number>(0.0050);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    switch (model) {
      case 'gpt-4o':
        setCostPer1k(0.005);
        break;
      case 'deepseek-chat':
        setCostPer1k(0.00014);
        break;
      case 'gemini-1.5-pro':
        setCostPer1k(0.00125);
        break;
      case 'llama-3':
        setCostPer1k(0.0007);
        break;
      default:
        break;
    }
  };

  // Copy status indicators
  const [copiedAr, setCopiedAr] = useState(false);
  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Status Alerts
  const [alert, setAlert] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Auto count Arabic tokens
  useEffect(() => {
    setArabicTokens(countTokens(arabicPrompt));
  }, [arabicPrompt]);

  // Auto count English tokens
  useEffect(() => {
    setEnglishTokens(countTokens(englishPrompt));
  }, [englishPrompt]);

  // Fetch history on load
  const loadSavedHistory = async () => {
    try {
      const records = await getSavedPrompts();
      setSavedRecords(records);
    } catch (e) {
      console.error('[PromptTranslator] Load saved history failed:', e);
    }
  };

  useEffect(() => {
    loadSavedHistory();
  }, []);

  const triggerAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleTranslate = async () => {
    if (!arabicPrompt.trim()) {
      triggerAlert(
        lang === 'ar' ? 'يرجى إدخال نص الأمر المراد ترجمته أولاً!' : 'Please enter an Arabic prompt to translate!',
        'error'
      );
      return;
    }

    setIsTranslating(true);
    try {
      let systemPrompt = '';
      if (translationMode === 'optimized') {
        systemPrompt = `You are a world-class prompt engineer and expert Arabic-to-English translator.
Your mission is to translate and optimize the given Arabic prompt into highly professional, formatted, structured, and instruction-set English.

Follow these strict design rules:
1. Translate all concepts with maximum accuracy, replacing vague Arabic expressions with precise, industry-standard English tech/AI terms.
2. Structure the prompt cleanly using markdown elements (headings, lists, codeblocks, italics) to ensure modern LLMs follow instructions flawlessly.
3. Automatically refine instructions to be direct, commanding, and role-based (e.g., "Act as...", "Establish...", "Do not...").
4. Preserve variables, bracketed parameters, and placeholder tags exactly (e.g., [name], {input}, <variable>), but translate any Arabic labels inside them to clean English (e.g., [اسم_المستخدم] becomes [username] or [user_name]).
5. NEVER add any introductory greetings, markdown wrapper commentary outside the prompt, or explanations like "Sure, here is the translation...".
6. OUTPUT ONLY the translated and optimized English prompt itself.`;
      } else {
        systemPrompt = `You are a highly precise, professional linguist and Arabic-to-English translator.
Your mission is to translate the Arabic prompt into fluent, natural, and accurately faithful English.

Follow these strict rules:
1. Translate the original prompt as faithfully and accurately as possible, preserving the exact intent, flow, tone, and formatting of the writer.
2. Do NOT add extra prompt engineering structures, headings, roles, or guidelines that were not present in the original Arabic prompt.
3. Preserve variables, bracketed parameters, and placeholder tags exactly (e.g., [name], {input}, <variable>), but translate any Arabic labels inside them to clean English (e.g., [اسم_المستخدم] becomes [username] or [user_name]).
4. NEVER add any introductory greetings, markdown wrapper commentary, or conversational explanations.
5. OUTPUT ONLY the translated English prompt itself.`;
      }

      const response = await askAI(arabicPrompt, systemPrompt);
      if (response.success && response.content) {
        setEnglishPrompt(response.content.trim());
        triggerAlert(
          lang === 'ar' ? 'تمت الترجمة وهندسة الأمر بنجاح!' : 'Translated and engineered successfully!',
          'success'
        );
      } else {
        throw new Error('No translation response returned.');
      }
    } catch (error: any) {
      console.error('[PromptTranslator] AI call failed:', error);
      triggerAlert(
        lang === 'ar' ? 'فشلت الترجمة الذكية. تحقق من الاتصال أو سلامة مفتاح واجهة التطبيق.' : 'AI Translation failed. Please check backend keys.',
        'error'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!arabicPrompt.trim() || !englishPrompt.trim()) {
      triggerAlert(
        lang === 'ar' ? 'يرجى إدخال النص العربي والترجمة لحفظها.' : 'Both Arabic prompt and English translation are required to save.',
        'error'
      );
      return;
    }

    setIsSaving(true);
    const savedTokens = Math.max(0, arabicTokens - englishTokens);

    try {
      const res = await savePromptToVault(
        arabicPrompt,
        englishPrompt,
        arabicTokens,
        englishTokens,
        savedTokens,
        selectedModel
      );

      if (res.success) {
        triggerAlert(
          lang === 'ar' 
            ? 'تم حفظ الأمر المشفر وتتبع التوفير في الخزنة بنجاح!' 
            : 'Prompt secured and saved to vault successfully!',
          'success'
        );
        loadSavedHistory();
      } else {
        triggerAlert(
          lang === 'ar' ? 'حدث خطأ أثناء رصد الحفظ.' : 'Error encountered during vault write.',
          'error'
        );
      }
    } catch (e: any) {
      console.error('[PromptTranslator] Save failed:', e);
      triggerAlert(e.message || 'Error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const check = window.confirm(
      lang === 'ar' ? 'هل أنت متأكد من رغبتك في مسح هذا الأمر من السجلات؟' : 'Are you sure you want to delete this prompt from records?'
    );
    if (!check) return;

    const ok = await deletePromptFromVault(id);
    if (ok) {
      triggerAlert(
        lang === 'ar' ? 'تمت إزالة السجل نهائياً.' : 'Record removed successfully.',
        'success'
      );
      loadSavedHistory();
    }
  };

  const copyToClipboard = (text: string, type: 'ar' | 'en' | string) => {
    safeCopyToClipboard(text);
    if (type === 'ar') {
      setCopiedAr(true);
      setTimeout(() => setCopiedAr(false), 2000);
    } else if (type === 'en') {
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    } else {
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    }
    triggerAlert(
      lang === 'ar' ? 'تم نسخ النص إلى الحافظة الكاشفة!' : 'Copied text to clipboard!',
      'success'
    );
  };

  // Compute stats helper
  const totalArTokensSavedSum = savedRecords.reduce((sum, item) => sum + item.tokens_saved, 0);
  const savingsPct = arabicTokens > 0 ? Math.round(((arabicTokens - englishTokens) / arabicTokens) * 100) : 0;
  
  // User adjustable cost saved estimation model
  const estimatedCostSavedPer1kRuns = Math.max(0, (arabicTokens - englishTokens) * costPer1k);

  const sqlCode = `CREATE TABLE IF NOT EXISTS saved_prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  arabic_prompt text NOT NULL,
  english_prompt text NOT NULL,
  arabic_tokens integer NOT NULL,
  english_tokens integer NOT NULL,
  tokens_saved integer NOT NULL,
  model_id text DEFAULT 'gpt-4o',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`;

  return (
    <div id="prompts-translator-page" className="space-y-6">
      
      {/* Dynamic Alert Banner */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-xs
              ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
              ${alert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : ''}
              ${alert.type === 'info' ? 'bg-sky-50 border-sky-200 text-sky-800' : ''}
            `}
          >
            <Info className="h-4 w-4 shrink-0" />
            <span>{alert.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner Explainer Grid */}
      <div className="bg-gradient-to-br from-indigo-900 via-sky-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6 scale-150">
          <Languages className="w-96 h-96" />
        </div>
        
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 transition rounded-full text-xs font-semibold backdrop-blur-xs text-sky-200">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'ترقية الأوامر للرموز الذكية' : 'AI Prompt Token Optimization'}</span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            {lang === 'ar' 
              ? 'مترجم وحافظ الأوامر الذكي ومحلل تكاليف الرموز' 
              : 'Prompt Translator, Optimizer & Token Analysis Engine'}
          </h2>
          
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {lang === 'ar'
              ? 'تستهلك الحروف العربية مابين 3x إلى 5x أضعاف الرموز البرمجية (Tokens) مقارنة بالإنجليزية بسبب أسلوب عمل المرمزات لبيئات الذكاء الاصطناعي. هذا المترجم يتيح صياغة برومبت ذكي باللغة الإنجليزية مع حساب فوري للتوفير وحفظ السجلات تلقائياً بالخزنة.'
              : 'Arabic characters require 3x to 5x more tokens due to tokenizer limitations. Translate your prompts, save resources, keep exact records, and automatically reduce execution fees by up to 75%.'}
          </p>
        </div>
      </div>

      {/* Interactive Translator Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Textarea Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-3xs p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {lang === 'ar' ? 'الأمر باللغة العربية' : 'Arabic Source Prompt'}
              </h3>
            </div>
            
            <button
              onClick={() => copyToClipboard(arabicPrompt, 'ar')}
              disabled={!arabicPrompt}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer disabled:opacity-30"
              title={lang === 'ar' ? 'نسخ العربي' : 'Copy Arabic'}
            >
              {copiedAr ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Translation Mode Selector Toggle */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-full">
            <button
              onClick={() => setTranslationMode('optimized')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                translationMode === 'optimized'
                  ? 'bg-white text-sky-700 shadow-3xs border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'هندسة وتحسين البرومبت ⚡' : 'Engineered Prompt ⚡'}</span>
            </button>
            <button
              onClick={() => setTranslationMode('literal')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                translationMode === 'literal'
                  ? 'bg-white text-indigo-700 shadow-3xs border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'ترجمة دقيقة وحرفية 🎯' : 'Precise Translation 🎯'}</span>
            </button>
          </div>

          <textarea
            value={arabicPrompt}
            onChange={(e) => setArabicPrompt(e.target.value)}
            placeholder={
              lang === 'ar' 
                ? 'اكتب الأمر باللغة العربية هنا... (مثال: قم بإنشاء كود إرسال بريد إلكتروني ترحيبي للمستخدمين الجدد باستخدام Node.js مع توثيق المتغيرات)' 
                : 'Write your Arabic prompt here...'
            }
            className="w-full h-48 bg-slate-50 text-slate-800 text-xs p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none resize-none leading-relaxed transition-all"
          />

          {/* Prompt Metrics Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <span>{lang === 'ar' ? 'حروف وعلامات: ' : 'Characters: '}</span>
              <strong className="text-slate-700 font-mono font-bold">{arabicPrompt.length}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-[10px] font-black font-mono">
                {arabicTokens} {lang === 'ar' ? 'رموز (Tokens)' : 'Tokens'}
              </span>
            </div>
          </div>

          {/* Model selection, Custom Cost Input & Trigger Button */}
          <div className="flex flex-col sm:flex-row items-end gap-2.5 pt-2">
            <div className="w-full sm:w-1/3">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                {lang === 'ar' ? 'نموذج التسعير المرجعي' : 'Pricing reference model'}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs px-2.5 py-2 rounded-lg font-bold text-slate-600 outline-none"
              >
                <option value="gpt-4o">GPT-4o ($0.0050/1k)</option>
                <option value="deepseek-chat">DeepSeek ($0.00014/1k)</option>
                <option value="gemini-1.5-pro">Gemini Pro ($0.00125/1k)</option>
                <option value="llama-3">Llama 3 70B ($0.00070/1k)</option>
                <option value="custom">{lang === 'ar' ? 'تخصيص يدوي ✎' : 'Custom pricing ✎'}</option>
              </select>
            </div>

            <div className="w-full sm:w-1/3">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                {lang === 'ar' ? 'التكلفة لكل 1K رمز ($)' : 'Cost per 1k tokens ($)'}
              </label>
              <input
                type="number"
                step="0.00001"
                min="0"
                value={costPer1k}
                onChange={(e) => {
                  setCostPer1k(parseFloat(e.target.value) || 0);
                  setSelectedModel('custom');
                }}
                className="w-full bg-white border border-slate-200 text-xs px-2.5 py-2 rounded-lg font-mono font-bold text-slate-700 outline-none"
                placeholder="0.0050"
              />
            </div>

            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full sm:w-1/3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer select-none transition flex items-center justify-center gap-2 shadow-xs"
            >
              {isTranslating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'ar' ? 'جاري الترجمة...' : 'Translating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{lang === 'ar' ? 'ترجمة وهندسة الأمر لـ EN' : 'Translate & Eng Prompt'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Textarea Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-3xs p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {lang === 'ar' ? 'نص الأمر المترجم بالإنجليزية' : 'Translated English Prompt'}
              </h3>
            </div>
            
            <button
              onClick={() => copyToClipboard(englishPrompt, 'en')}
              disabled={!englishPrompt}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer disabled:opacity-30"
              title={lang === 'ar' ? 'نسخ الترجمة' : 'Copy English'}
            >
              {copiedEn ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <textarea
            value={englishPrompt}
            onChange={(e) => setEnglishPrompt(e.target.value)}
            placeholder={
              lang === 'ar' 
                ? 'اضغط على زر الترجمة بالأسفل لتلقي النص الإنجليزي المهندس تلقائياً...' 
                : 'Translation output will appear here...'
            }
            className="w-full h-48 bg-slate-50 text-slate-800 text-xs p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none resize-none leading-relaxed transition-all"
          />

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <span>{lang === 'ar' ? 'حروف وعلامات: ' : 'Characters: '}</span>
              <strong className="text-slate-700 font-mono font-bold">{englishPrompt.length}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-black font-mono">
                {englishTokens} {lang === 'ar' ? 'رموز (Tokens)' : 'Tokens'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveToVault}
              disabled={isSaving || !arabicPrompt || !englishPrompt}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer select-none transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Save className="h-4 w-4 shrink-0" />
              <span>{lang === 'ar' ? 'تسجيل وحفظ السجل بالأرشيف الكاشف' : 'Secure & Save Prompt to Vault'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Token Optimization Analysis Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5 text-sky-500" />
          <span>{lang === 'ar' ? 'مخطط مقارنة وتحليل التوفير في استهلاك الرموز' : 'Token Conservation Analysis Visualizer'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Progress chart representation */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>{lang === 'ar' ? 'الأمر العربي (استهلاك مرتفع)' : 'Arabic Prompt (Sub-optimal)'}</span>
                <span className="font-mono text-orange-600">{arabicTokens} Tokens</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${arabicPrompt ? 100 : 0}%` }}
                  className="bg-orange-500 h-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>{lang === 'ar' ? 'الأمر الإنجليزي المترجم (توفير فوري)' : 'English Translation (Optimal)'}</span>
                <span className="font-mono text-emerald-600">{englishTokens} Tokens</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${arabicPrompt && englishPrompt ? Math.min(100, (englishTokens / (arabicTokens || 1)) * 100) : 0}%` }}
                  className="bg-emerald-500 h-full"
                />
              </div>
            </div>

            <div className="text-slate-400 text-[11px] leading-relaxed flex items-start gap-1 pb-1">
              <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? 'تم حساب التوفير بناءً على مرمز cl100k_base لبيئات الذكاء الاصطناعي الأكثر استخداماً اليوم.'
                  : 'Tokens calculations are calculated against current standardized sub-byte LLM tokenizer models.'}
              </span>
            </div>
          </div>

          {/* Quick saving metrics */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {lang === 'ar' ? 'نسبة التوفير المقدرة' : 'Conservative Ratio Savings'}
              </div>
              <div className="text-3xl font-black text-sky-600 font-mono mt-1">
                {savingsPct}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'ar' 
                  ? `توفير مالي يعادل ${(arabicTokens - englishTokens)} رمز لكل استدعاء للأمر.` 
                  : `Equivalent to a savings of ${(arabicTokens - englishTokens)} tokens per request execution.`}
              </p>
            </div>

            <div className="border-t border-slate-200/80 pt-3 mt-3 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'التوفير لـ 1000 طلب' : 'Savings for 1k calls'}
                </div>
                <div className="text-md font-extrabold text-emerald-600 font-mono">
                  ${estimatedCostSavedPer1kRuns.toFixed(4)}
                </div>
              </div>
              <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {lang === 'ar' ? 'توفير تمويلي' : 'Cost Saved'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Visual Analytics breakdowns using Recharts */}
      {savedRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-emerald-500" />
              <span>
                {lang === 'ar' 
                  ? 'رصد التوفير التاريخي والتحليلي للرموز' 
                  : 'Historical Token Conservation & Time Analytics'}
              </span>
            </h3>

            <div className="flex flex-wrap gap-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-orange-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-orange-500 block" />
                <span>{lang === 'ar' ? 'الأمر العربي الأصلي' : 'Original Arabic'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 block" />
                <span>{lang === 'ar' ? 'الأمر الإنجليزي الأمثل' : 'Optimized English'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 block" />
                <span>{lang === 'ar' ? 'إجمالي الرموز المصونة' : 'Total Saved'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Quick Summary metrics */}
            <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {lang === 'ar' ? 'الرموز المدخلة الكلية' : 'Total Input (Arabic)'}
                </div>
                <div className="text-xl font-black text-orange-600 font-mono mt-0.5">
                  {savedRecords.reduce((sum, r) => sum + r.arabic_tokens, 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {lang === 'ar' ? 'أوامر غير محسنة' : 'Unoptimized prompt tokens'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {lang === 'ar' ? 'الرموز المستهلكة الكلية' : 'Total Output (English)'}
                </div>
                <div className="text-xl font-black text-sky-600 font-mono mt-0.5">
                  {savedRecords.reduce((sum, r) => sum + r.english_tokens, 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {lang === 'ar' ? 'أوامر رشيقة وهندسة دقيقة' : 'Lean optimized tokens'}
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col justify-center col-span-2 lg:col-span-1">
                <div className="text-[10px] uppercase font-bold text-emerald-700">
                  {lang === 'ar' ? 'المبلغ المالي الكلي المسجل' : 'Total Vault Cost Saved'}
                </div>
                <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                  ${(savedRecords.reduce((sum, r) => sum + r.tokens_saved, 0) * (costPer1k / 1000)).toFixed(5)}
                </div>
                <div className="text-[10px] font-bold text-emerald-700 mt-0.5 leading-tight">
                  {lang === 'ar' 
                    ? `إجمالي المصون: ${totalArTokensSavedSum} رموز` 
                    : `${totalArTokensSavedSum} conserved tokens`}
                </div>
              </div>
            </div>

            {/* Time Series Chart */}
            <div className="lg:col-span-3 h-64 w-full bg-slate-50 rounded-xl p-3 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[...savedRecords].reverse().map((record, index) => {
                    const dateObj = new Date(record.created_at);
                    const formattedDate = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                    return {
                      name: `#${index + 1}`,
                      date: formattedDate,
                      arabic: record.arabic_tokens,
                      english: record.english_tokens,
                      saved: record.tokens_saved,
                    };
                  })}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorArabic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEnglish" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    labelFormatter={(label, items) => {
                      if (items && items[0]) {
                        return `${lang === 'ar' ? 'الطلب رقم' : 'Prompt Run'} ${label} (${items[0].payload.date})`;
                      }
                      return label;
                    }}
                  />
                  <Area type="monotone" name={lang === 'ar' ? 'حجم الطلب بالعربي' : 'Original Arabic Tokens'} dataKey="arabic" stroke="#f97316" fillOpacity={1} fill="url(#colorArabic)" strokeWidth={1.5} />
                  <Area type="monotone" name={lang === 'ar' ? 'حجم الطلب بالانجليزي' : 'Optimized English Tokens'} dataKey="english" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorEnglish)" strokeWidth={1.5} />
                  <Area type="monotone" name={lang === 'ar' ? 'الرموز المصونة والموفرة' : 'Tokens Conserved'} dataKey="saved" stroke="#10b981" fillOpacity={1} fill="url(#colorSaved)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

      {/* History table and records catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Database className="h-5 w-5 text-sky-500 shrink-0" />
              <span>{lang === 'ar' ? 'سجلات وأرشيف الأوامر المؤمنة بالخزنة' : 'Saved Prompt Repositories & History'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar'
                ? `يتم تتبع وأرشفة السجلات بشكل سحابي كامل لضمان التزامن السريع. (تم الحفاظ الكلي على ${totalArTokensSavedSum} رمز)`
                : `Synchronized repository. (Total tokens conserved across runs: ${totalArTokensSavedSum} tokens)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <FileCode2 className="h-4 w-4 shrink-0 text-sky-600" />
              <span>{lang === 'ar' ? 'تعليمات قاعدة البيانات SQL' : 'Database SQL Setup'}</span>
            </button>
          </div>
        </div>

        {/* Database SQL Setup Guide Box */}
        {showSqlGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 text-xs mb-4 relative overflow-hidden space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-extrabold text-sky-400">{lang === 'ar' ? 'إنشاء جدول الدعم سحابياً بالـ Supabase' : 'Create prompt schema in Supabase console'}</span>
              <button
                onClick={() => copyToClipboard(sqlCode, 'sql')}
                className="px-2 py-1 bg-white/10 hover:bg-white/15 rounded-md font-bold text-[10px] text-white transition flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                <span>{lang === 'ar' ? 'نسخ الكود' : 'Copy Query'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {lang === 'ar'
                ? 'إذا كنت تستخدم الوضع السحابي الفعال، يرجى التوجه لـ Supabase SQL Editor وتشغيل الكود التالي لإنشاء الاستدعاءات وسينعكس التخزين سحابياً بشكل كامل وفوري:'
                : 'Connect your live cloud storage database directly. Execute the following SQL query inside your Supabase console to make the cloud integration active:'}
            </p>
            <pre className="bg-black/40 text-emerald-400 p-2.5 rounded-lg overflow-x-auto text-[11px] font-mono leading-normal">
              {sqlCode}
            </pre>
          </motion.div>
        )}

        {/* Database status banner */}
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className={`h-2.5 w-2.5 rounded-full ${isSupabaseConnected() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-700">
              {isSupabaseConnected() 
                ? (lang === 'ar' ? 'مزامنة السحابية فعالة كلياً بالمسار المستقر' : 'Cloud Sync Active') 
                : (lang === 'ar' ? 'تخزين محلي مؤقت (يرجى إكمال الربط بـ Supabase لمزامنة السجلات البرمجية)' : 'Local cache only. Link Supabase to leverage cloud repositories')}
            </span>
          </div>
        </div>

        {/* Saved List Records container */}
        <div className="space-y-4">
          {savedRecords.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400">
              <FolderCodePlaceholderIcon />
              <p className="text-xs font-bold mt-2">
                {lang === 'ar' ? 'لا توجد سجلات برومبت محفوظة بعد.' : 'No saved prompt history found. Try saving one!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedRecords.map((item) => {
                const isSelected = copiedItem === item.id;
                const ratio = item.arabic_tokens > 0 ? Math.round((item.tokens_saved / item.arabic_tokens) * 100) : 0;
                
                return (
                  <div 
                    key={item.id} 
                    className="bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 hover:border-sky-300 p-4 transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header bar metadata */}
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-mono">
                            {new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.is_cloud ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{lang === 'ar' ? 'قاعدة البيانات' : 'Cloud DB'}</span>
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>{lang === 'ar' ? 'تخزين محلي' : 'Local Cache'}</span>
                            </span>
                          )}
                          <span className="bg-sky-100 text-sky-800 text-[9px] font-black font-mono px-2 py-0.5 rounded-md">
                            -{ratio}% {lang === 'ar' ? 'توفير' : 'Saved'}
                          </span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title={lang === 'ar' ? 'مسح' : 'Delete'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Prompt Details panels */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                            {lang === 'ar' ? 'الأمر العربي الأصلي' : 'Arabic Original'}
                          </span>
                          <p className="text-slate-700 text-xs font-bold leading-relaxed line-clamp-3 mt-0.5">
                            {item.arabic_prompt}
                          </p>
                        </div>

                        <div className="bg-white/80 border border-slate-200/50 p-2.5 rounded-lg">
                          <span className="text-[9px] uppercase font-bold text-sky-600 block tracking-wider">
                            {lang === 'ar' ? 'الأمر الإنجليزي المهندس' : 'Optimal English Output'}
                          </span>
                          <p className="text-slate-800 text-xs font-medium leading-relaxed font-sans line-clamp-3 mt-0.5">
                            {item.english_prompt}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer bar values and direct Copy handle */}
                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5 mt-3">
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <div>
                          <span>{lang === 'ar' ? 'عربي: ' : 'AR: '}</span>
                          <strong className="text-orange-600 font-mono">{item.arabic_tokens}</strong>
                        </div>
                        <div>
                          <span>{lang === 'ar' ? 'إنجليزي: ' : 'EN: '}</span>
                          <strong className="text-emerald-600 font-mono">{item.english_tokens}</strong>
                        </div>
                        <div className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-extrabold text-[9px]">
                          +{item.tokens_saved}
                        </div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(item.english_prompt, item.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition duration-200 cursor-pointer flex items-center gap-1.5
                          ${
                            isSelected 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs'
                          }
                        `}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3.5 w-3.5 shrink-0" />
                            <span>{lang === 'ar' ? 'تم نسخ EN' : 'Copied EN'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 shrink-0" />
                            <span>{lang === 'ar' ? 'نسخ الإنجليزي المهندس' : 'Copy Optimal EN'}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

function FolderCodePlaceholderIcon() {
  return (
    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
      <Database className="w-6 h-6" />
    </div>
  );
}
