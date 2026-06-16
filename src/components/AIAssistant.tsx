import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Trash2, Cpu, Sparkles, Zap, ShieldCheck, 
  HelpCircle, RefreshCw, AlertTriangle, Key, Code, 
  Settings, ChevronDown, CheckCircle, Activity, Play, ActivityIcon
} from 'lucide-react';
import { ActiveTab, Language, RepairLog } from '../types';
import { askAI, resetFailedProviders, FailoverLogEntry } from '../ai/aiService';
import { SystemStatus } from './SystemStatus';
import { DeploymentChecklist } from './DeploymentChecklist';
import { RepairLog as RepairLogsList } from './RepairLog';

interface AIAssistantProps {
  activeTab: ActiveTab;
  lang: Language;
  onSetLang: (lang: Language) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: string;
  logs?: FailoverLogEntry[];
}

export default function AIAssistant({ activeTab, lang, onSetLang, isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePane, setActivePane] = useState<'chat' | 'status' | 'repairs' | 'checklist'>('chat');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dynamic Page-Context Guidelines
  const getPageGuide = () => {
    if (lang === 'ar') {
      switch (activeTab) {
        case 'secrets':
          return {
            title: '💡 مستشار الخزنة والمفاتيح السحابية',
            desc: 'أنا جاهز لمساعدتك في فحص الرموز الأمنية، التحقق من تنسيق مفاتيح OpenAI وGemini، والتأكد من قوة مشفرات Supabase.',
            prompt: 'كيف يمكنني تنسيق وفحص صلاحية مفتاح استدعاء Groq API بشكل صحيح؟'
          };
        case 'optimizer':
          return {
            title: '⚡ مستشار تحسين وحساب رموز الأوامر (Prompts)',
            desc: 'يمكنني تقييم نصوصك المدخلة، تقليل استهلاك Token، ومقارنة كفاءة النماذج البرمجية لزيادة التوفير المالي.',
            prompt: 'اقترح عليّ طريقة مثالية لصياغة أمر تدوير كلمات الاستدعاء لتقليص استهلاك الـ Tokens.'
          };
        case 'automation':
          return {
            title: '🤖 مستشار الأتمتة ومواقع الويب هيل الكلية',
            desc: 'مستعد لصيانة وتحديد مشاكل استدعاء خطوط ربط n8n، تصحيح استجابة الويب هوكس (Webhooks)، وبناء ردود JSON الموجهة.',
            prompt: 'علمني كيف أقوم ببرمجة مسار مخرجات متجاوب لصيانة ويب هوك معطل بنظام نقل الحصص.'
          };
        case 'calculator':
          return {
            title: '📐 مستشار حساب تكاليف الاستهلاك',
            desc: 'دعنا نقارن تكلفة استدعاء النماذج المدفوعة مثل GPT-4o-mini مع بدائل المصادر المفتوحة ونوضح نسب التوفير الفعلي.',
            prompt: 'قارن بين تكلفة استهلاك نموذج Claude ونموذج Llama من ناحية التوفير المالي لمليون كلمة.'
          };
        case 'projects':
          return {
            title: '📂 مستشار تنظيم ومحاذاة المشاريع البرمجية',
            desc: 'يمكنني مساعدتك في تخطيط هيكليات ملفات المشروع، تدوين الملاحظات والمفاتيح المرتبطة، واقتراح منصات التطوير المناسبة للسحاب.',
            prompt: 'ما هي أفضل منصة سحابية لتصميم ونشر واجهات أمامية متكاملة بـ React؟'
          };
        default:
          return {
            title: '🤖 العقل المدبر ومراقب خواديم الفيل-أوفر والـ Sentry',
            desc: 'سأقوم بمراقبة أخطاء السيرفرات وتطبيق تصحيح المسار التلقائي في أي وقت. اسألني أي سؤال لمساعدتك.',
            prompt: 'أعطني دليلاً حول آلية تصحيح أخطاء حظر CORS بين التطبيقات المحلية والوكلاء الافتراضيين.'
          };
      }
    } else {
      switch (activeTab) {
        case 'secrets':
          return {
            title: '💡 Credentials & Security Advisor',
            desc: 'I can assist with cryptographic patterns, formatting checks for OpenAI or Gemini key sets, and ensuring secure Supabase persistence.',
            prompt: 'How do I securely audit and verify a Groq API authentication token?'
          };
        case 'optimizer':
          return {
            title: '⚡ Prompt Optimization Consultant',
            desc: 'I can trim down redundant strings to preserve tokens, evaluate wording efficiencies, and compare generation ratios.',
            prompt: 'Show me an optimized format to reduce input tokens for multi-turn conversations.'
          };
        case 'automation':
          return {
            title: '🤖 Webhook & n8n Router Specialist',
            desc: 'I can format robust JSON outputs, write fallback webhooks, and debug connectivity workflows on n8n.',
            prompt: 'Generate an n8n webhook error-handling node blueprint with key rotation parameters.'
          };
        case 'calculator':
          return {
            title: '📐 AI Cost-Reduction Calculator Specialist',
            desc: 'I will compare pricing models, compute relative exchange rates for Egyptian Pounds/Euros, and highlight cheap alternatives.',
            prompt: 'What are the main pricing differences between gpt-4o-mini and llama-3.3-70b-versatile?'
          };
        case 'projects':
          return {
            title: '📂 Platform Alignment Coordinator',
            desc: 'Let us organize cloud architectures, tag key variables, and select developer platforms (e.g., Lovable, Bolt, Supabase).',
            prompt: 'Suggest a cloud deployment model for a high-availability client-facing SPA.'
          };
        default:
          return {
            title: '🤖 Sentry AI Sentry & Self-Healing Brain',
            desc: 'I am constantly keeping track of runtime requests. I rotate key pathways and resolve CORS issues instantly.',
            prompt: 'Explain the mechanism behind the automatic failover rotation of my secure API keys.'
          };
      }
    }
  };

  const guide = getPageGuide();

  useEffect(() => {
    // Add introductory message if empty
    if (messages.length === 0) {
      setMessages([
        {
          id: 'intro',
          role: 'assistant',
          content: lang === 'ar'
            ? `مرحباً بك! أنا مساعد الذكاء الاصطناعي الذكي ومراقب Sentry للتحكم بالبوابات. أنا على دراية تامة بأنك متموضع حالياً في صفحة [**${activeTab.toUpperCase()}**]. كيف يمكنني مساعدتك في مهام الأتمتة وجاهزية النشر اليوم؟`
            : `Hello/Welcome! I am your Sentry Intelligent Co-Pilot. I am fully aware that you are currently on the [**${activeTab.toUpperCase()}**] page view. How can I optimize your workflows, keys, or endpoints today?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  }, [lang, activeTab]);

  useEffect(() => {
    // Auto Scroll to last message
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      // Prompt refinement using page context!
      const finalPromptWithContext = `
[CONTEXT VIEWPORT: Current Page Is ${activeTab.toUpperCase()}]
[USER PROMPT]:
${textToSend}
      `.trim();

      const systemPrompt = lang === 'ar'
        ? `أنت مساعد ذكي ونظام مراقبة Sentry. تتحدث العربية الفصحى الحديثة. أجب بشكل دقيق، مع إبراز الجوانب التقنية، وشرح حلول الأخطار التلقائية.`
        : `You are a professional Sentry AI Co-Pilot. Coordinate response output using concise language. Highlight self-healing pathways and CORS resolvers.`;

      const result = await askAI(finalPromptWithContext, systemPrompt);

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toLocaleTimeString(),
        provider: result.provider,
        logs: result.logs
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const aiMsg: ChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        role: 'assistant',
        content: lang === 'ar'
          ? `⚠️ حدث خطأ تقني في الاستدعاء: ${err.message}. تم تفعيل الحماية والتبديل لنموذج وكيل رديف محلي.`
          : `⚠️ Sentry fallback activated: direct endpoint failed with "${err.message}". Sandbox mock proxy active.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    resetFailedProviders();
    setMessages([
      {
        id: `clear-${Date.now()}`,
        role: 'assistant',
        content: lang === 'ar' ? '✅ تم تفريغ الجلسة، تفريغ الخوادم، وإعادة تشغيل بوابات الذكاء الاصطناعي.' : '✅ Flushed conversation history. Resurrected all Sentry routes.',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div id="unified-sentry-drawer" className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden text-slate-100 font-sans">
      
      {/* Dynamic Upper Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between relative">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
        
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Cpu className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest bg-gradient-to-r from-indigo-200 via-purple-100 to-cyan-200 bg-clip-text text-transparent uppercase flex items-center gap-1">
              <span>{lang === 'ar' ? 'لوحة المساعد الذكي والـ Sentry' : 'SENTRY CO-PILOT CONSOLE'}</span>
            </h1>
            <span className="text-[10px] text-slate-400 leading-none block mt-0.5">{lang === 'ar' ? `وضع الرصد النشط: ${activeTab.toUpperCase()}` : `Viewport Hooked: ${activeTab.toUpperCase()}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-lang-sentry"
            type="button"
            onClick={() => onSetLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-2.5 py-1 text-[10px] font-black rounded-lg border border-slate-800 hover:bg-slate-900 transition uppercase bg-slate-900"
          >
            {lang === 'ar' ? 'ENGLISH' : 'العربية'}
          </button>
          
          <button
            id="close-sentry-drawer"
            type="button"
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Pane Toggles Selector */}
      <div className="grid grid-cols-4 bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-400">
        <button
          id="btn-pane-chat"
          type="button"
          onClick={() => setActivePane('chat')}
          className={`py-3 text-center transition ${activePane === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/40' : 'hover:bg-slate-900/20 hover:text-white'}`}
        >
          {lang === 'ar' ? 'المساعد' : 'Chat co-pilot'}
        </button>
        
        <button
          id="btn-pane-status"
          type="button"
          onClick={() => setActivePane('status')}
          className={`py-3 text-center transition ${activePane === 'status' ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-900/40' : 'hover:bg-slate-900/20 hover:text-white'}`}
        >
          {lang === 'ar' ? 'المؤشرات' : 'Telemetry Status'}
        </button>
        
        <button
          id="btn-pane-repairs"
          type="button"
          onClick={() => setActivePane('repairs')}
          className={`py-3 text-center transition ${activePane === 'repairs' ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-900/40' : 'hover:bg-slate-900/20 hover:text-white'}`}
        >
          {lang === 'ar' ? 'سجل المعالجة' : 'Heal Logs'}
        </button>

        <button
          id="btn-pane-checklist"
          type="button"
          onClick={() => setActivePane('checklist')}
          className={`py-3 text-center transition ${activePane === 'checklist' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/40' : 'hover:bg-slate-900/20 hover:text-white'}`}
        >
          {lang === 'ar' ? 'جازية النشر' : 'Deploy Check'}
        </button>
      </div>

      {/* Main Responsive Body View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Pane 1: Intelligent Chat Assist */}
        {activePane === 'chat' && (
          <div className="flex flex-col h-full space-y-4">
            
            {/* Page Guide Box Card */}
            <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-indigo-900/50 rounded-2xl relative overflow-hidden shadow-inner flex flex-col justify-between">
              <div className="absolute top-0 right-0 h-2 w-2 bg-indigo-500 rounded-full animate-ping m-3" />
              <div>
                <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                  <span>{guide.title}</span>
                </h3>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed font-medium">
                  {guide.desc}
                </p>
              </div>

              <div className="mt-3.5 pt-2 border-t border-slate-800/80 flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{lang === 'ar' ? '❓ طلب استشاري مقترح سريع:' : '❓ Quick Context Query Concept:'}</span>
                <button
                  id="btn-fast-prompt-guide"
                  type="button"
                  onClick={() => handleSend(guide.prompt)}
                  disabled={loading}
                  className="text-left py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-[11px] text-slate-300 border border-slate-800 flex items-center justify-between gap-2 transition hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="font-sans font-medium line-clamp-1 italic">{guide.prompt}</span>
                  <Play className="h-3 w-3 text-cyan-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Chats loop list */}
            <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[340px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg) => {
                const isAi = msg.role === 'assistant';
                return (
                  <div key={msg.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-1">
                      <span className="font-bold uppercase font-mono">{isAi ? 'Sentry Head Office' : 'You'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.provider && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold font-mono text-[8px] uppercase">{msg.provider}</span>
                      )}
                    </div>

                    <div className={`p-3.5 rounded-2xl max-w-[90%] text-xs leading-relaxed font-sans shadow-sm ${
                      isAi 
                        ? 'bg-slate-800/80 border border-slate-700/60 rounded-tl-none' 
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}>
                      {msg.content}

                      {/* Display nested Sentry key rotation logs index on each AI response if applicable */}
                      {isAi && msg.logs && msg.logs.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                          <span className="text-[9px] font-black font-mono text-slate-400 block uppercase tracking-wider mb-1.5">{lang === 'ar' ? 'مسار التدوير والـ Failover المسجل لهذه الاستجابة:' : 'Failover Trackers Logged for this Turn:'}</span>
                          <div className="space-y-1">
                            {msg.logs.map((log, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[9px] bg-slate-900/60 p-1.5 rounded border border-slate-800 font-mono">
                                <span className="text-slate-400 font-black">{log.maskedKey} :</span>
                                <span className={
                                  log.status === 'success' ? 'text-emerald-400' : 'text-amber-500'
                                }>
                                  {log.status.toUpperCase()} {log.errorDetail ? `(${log.errorDetail})` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-1">
                    <span className="font-black animate-pulse uppercase">Sentry AI is healing variables...</span>
                  </div>
                  <div className="p-3.5 bg-slate-800/40 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-300 font-bold font-sans">{lang === 'ar' ? 'جاري استدعاء الخواديم وتخفيض الأوزان...' : 'Analyzing and executing backoff retry query...'}</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Standard inputs block */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="mt-auto border-t border-slate-800/80 pt-3 flex gap-2"
            >
              <input
                id="input-sentry-chat"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={lang === 'ar' ? guide.prompt : 'Describe error or request help...'}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder-slate-600 shadow-inner font-sans font-medium"
              />

              <button
                id="btn-flush-chat"
                type="button"
                onClick={handleClear}
                className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition bg-slate-950"
                title="Flush Chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                id="btn-send-sentry"
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10 font-bold text-xs flex items-center justify-center gap-1 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        )}

        {/* Pane 2: Live telemetry metrics */}
        {activePane === 'status' && (
          <div className="space-y-4">
            <SystemStatus lang={lang} onToastTrigger={handleClear} />
          </div>
        )}

        {/* Pane 3: Remediations & Healing Log history */}
        {activePane === 'repairs' && (
          <div className="space-y-4">
            <RepairLogsList lang={lang} />
          </div>
        )}

        {/* Pane 4: Pre-deployment ready checklist */}
        {activePane === 'checklist' && (
          <div className="space-y-4">
            <DeploymentChecklist lang={lang} onToastTrigger={handleClear} />
          </div>
        )}

      </div>
    </div>
  );
}
