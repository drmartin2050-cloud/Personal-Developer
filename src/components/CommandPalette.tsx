import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Terminal, ArrowRight, CornerDownLeft, Globe, Database, 
  ShieldAlert, Sparkles, X, Home, Library, FolderGit2, ShieldCheck, 
  Mail, Calculator, Languages, Webhook, Coins, Brain 
} from 'lucide-react';
import { ActiveTab, Language } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  lang: Language;
  onToggleLang: () => void;
  onOpenDiagnostics: () => void;
  onOpenSync: () => void;
  onAddProject: () => void;
  onOpenAIAssistant: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  lang,
  onToggleLang,
  onOpenDiagnostics,
  onOpenSync,
  onAddProject,
  onOpenAIAssistant
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define commands list
  const commands = [
    // Navigation command options
    {
      id: 'nav-dashboard',
      category: lang === 'ar' ? 'الصفحات الأساسية' : 'Navigation',
      label: lang === 'ar' ? 'لوحة القيادة والمراقبة' : 'Dashboard Overview',
      subtitle: lang === 'ar' ? 'الصفحة الرئيسية واستعراض الإحصائيات' : 'Central monitoring hub and metrics',
      icon: Home,
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'nav-prompt_translator',
      category: lang === 'ar' ? 'الصفحات الأساسية' : 'Navigation',
      label: lang === 'ar' ? 'مترجم ومحسن البرومبتات الفائق' : 'Prompt Engineer Translator',
      subtitle: lang === 'ar' ? 'تحسين وتعديل وصياغة برومبتات النماذج' : 'Advanced smart prompt optimizer & translator',
      icon: Languages,
      action: () => { onNavigate('prompt_translator'); onClose(); }
    },
    {
      id: 'nav-projects',
      category: lang === 'ar' ? 'الصفحات الأساسية' : 'Navigation',
      label: lang === 'ar' ? 'إدارة المشاريع والتطبيقات' : 'Projects Manager',
      subtitle: lang === 'ar' ? 'استعراض وإضافة مشاريع التطوير والمنصات' : 'View, search, or add active production projects',
      icon: FolderGit2,
      action: () => { onNavigate('projects'); onClose(); }
    },
    {
      id: 'nav-secrets',
      category: lang === 'ar' ? 'الصفحات الأساسية' : 'Navigation',
      label: lang === 'ar' ? 'خزنة المفاتيح السرية الحصينة' : 'Secure API Vault',
      subtitle: lang === 'ar' ? 'تخزين مشفر لمفاتيح الـ API وعناوين الخوادم' : 'Key encryption and server credential store',
      icon: ShieldCheck,
      action: () => { onNavigate('secrets'); onClose(); }
    },
    {
      id: 'nav-calculator',
      category: lang === 'ar' ? 'الصفحات الأساسية' : 'Navigation',
      label: lang === 'ar' ? 'حاسبة وتكلفة استهلاك التوكينز' : 'LLM Token Calculator',
      subtitle: lang === 'ar' ? 'حساب وتقييم تكاليف النماذج بلغات متعددة' : 'Token usage price validator across configurations',
      icon: Calculator,
      action: () => { onNavigate('calculator'); onClose(); }
    },
    {
      id: 'nav-optimizer',
      category: lang === 'ar' ? 'الصفحات الأساسية' : 'Navigation',
      label: lang === 'ar' ? 'مقارن تسعير النماذج التنافسي' : 'Model Price Optimizer',
      subtitle: lang === 'ar' ? 'مقارنة استرشادية لتوفير نفقات الـ API' : 'Compare providers costs & calculate potential savings',
      icon: Sparkles,
      action: () => { onNavigate('optimizer'); onClose(); }
    },
    {
      id: 'nav-ai_agent',
      category: lang === 'ar' ? 'الأدوات والذكاء' : 'AI & Autonomous',
      label: lang === 'ar' ? 'منصة الوكيل المستقل والبرمجة' : 'Autonomous Sura Agent',
      subtitle: lang === 'ar' ? 'مراقبة الروبوت والمهام المؤتمتة الذاتية' : 'Monitor self-correcting automation logic',
      icon: Brain,
      action: () => { onNavigate('ai_agent'); onClose(); }
    },
    {
      id: 'nav-resources',
      category: lang === 'ar' ? 'الأدوات والذكاء' : 'AI & Autonomous',
      label: lang === 'ar' ? 'مكتبة موارد المطورين والشاشات' : 'Dev Resources Directory',
      subtitle: lang === 'ar' ? 'منصات وأدوات وقواعد بيانات سريعة للاستخدام' : 'Useful libraries, tools and database engines',
      icon: Library,
      action: () => { onNavigate('resources'); onClose(); }
    },
    {
      id: 'nav-emails',
      category: lang === 'ar' ? 'شؤون الفريق والاتصال' : 'Business & Communications',
      label: lang === 'ar' ? 'إدارة رسائل البريد وحسابات الفريق' : 'Team Mailbox Manager',
      subtitle: lang === 'ar' ? 'عناوين البريد الأساسية والبادئات المستعارة' : 'Main, alias, and platform communication maps',
      icon: Mail,
      action: () => { onNavigate('emails'); onClose(); }
    },
    {
      id: 'nav-expenses',
      category: lang === 'ar' ? 'شؤون الفريق والاتصال' : 'Business & Communications',
      label: lang === 'ar' ? 'محاسب تكاليف وموازنة السحابة' : 'Cloud Invoice Accountant',
      subtitle: lang === 'ar' ? 'رصد المصاريف الشهرية ومستحقات المنصات' : 'Monthly cloud usage expenditures logs',
      icon: Coins,
      action: () => { onNavigate('expenses'); onClose(); }
    },
    {
      id: 'nav-automation',
      category: lang === 'ar' ? 'شؤون الفريق والاتصال' : 'Business & Communications',
      label: lang === 'ar' ? 'روابط واجهات n8n الذاتية' : 'n8n Webhook Triggers',
      subtitle: lang === 'ar' ? 'إطلاق واختبار سيناريوهات الأتمتة المدمجة' : 'Execute live external automation pipelines',
      icon: Webhook,
      action: () => { onNavigate('automation'); onClose(); }
    },

    // Special functional Actions
    {
      id: 'act-toggle-lang',
      category: lang === 'ar' ? 'أوامر وإجراءات سريعة' : 'System Actions',
      label: lang === 'ar' ? 'تغيير لغة التطبيق بالكامل (English)' : 'Toggle Language structure (عربي)',
      subtitle: lang === 'ar' ? 'التحويل الآني بين لغة الواجهة العربية والإنجليزية' : 'Switch the instant UI interface alignment',
      icon: Globe,
      action: () => { onToggleLang(); onClose(); }
    },
    {
      id: 'act-diagnostics',
      category: lang === 'ar' ? 'أوامر وإجراءات سريعة' : 'System Actions',
      label: lang === 'ar' ? 'فتح لوحة فحص المراقبة والتشخيص Sentry' : 'Open Sentry Diagnostic Console',
      subtitle: lang === 'ar' ? 'تحليل البيئة والاختبار الذاتي التلقائي للأعطال' : 'Verify environment variables and self-healing systems',
      icon: ShieldAlert,
      action: () => { onOpenDiagnostics(); onClose(); }
    },
    {
      id: 'act-sync-db',
      category: lang === 'ar' ? 'أوامر وإجراءات سريعة' : 'System Actions',
      label: lang === 'ar' ? 'ربط وإعداد قاعدة بيانات Supabase الخارجية' : 'Configure Supabase Integration Sync',
      subtitle: lang === 'ar' ? 'توطيد الجسر السحابي لحفظ وتزامن البيانات' : 'Update the secure cloud storage configuration link',
      icon: Database,
      action: () => { onOpenSync(); onClose(); }
    },
    {
      id: 'act-add-proj',
      category: lang === 'ar' ? 'أوامر وإجراءات سريعة' : 'System Actions',
      label: lang === 'ar' ? 'إضافة مشروع جديد كلياً للوحة' : 'Register New Sandbox Build Project',
      subtitle: lang === 'ar' ? 'إطلاق نموذج مشروع يدوي وتحديد منبع وسرعته' : 'Instantly populate new platform workspace data',
      icon: FolderGit2,
      action: () => { onAddProject(); onClose(); }
    },
    {
      id: 'act-ai-chat',
      category: lang === 'ar' ? 'أوامر وإجراءات سريعة' : 'System Actions',
      label: lang === 'ar' ? 'الحديث مع المساعد الذكي الاصطناعي' : 'Launch AI Assistant Chatbot',
      subtitle: lang === 'ar' ? 'تنسيق الأسئلة وحل الشفرات والتوجيه الفوري' : 'Ask the floating conversational engineer core questions',
      icon: Sparkles,
      action: () => { onOpenAIAssistant(); onClose(); }
    }
  ];

  // Filter based on search query
  const filtered = commands.filter(item => {
    const rawSearch = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(rawSearch) ||
      item.subtitle.toLowerCase().includes(rawSearch) ||
      item.category.toLowerCase().includes(rawSearch)
    );
  });

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(0);
    }
  }, [filtered, selectedIndex]);

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="global-command-palette-wrapper" 
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 overflow-hidden select-none"
        >
          {/* Ambient overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Core Panel Container */}
          <motion.div
            id="command-palette-panel"
            ref={containerRef}
            initial={{ y: -20, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -15, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className={`relative w-full max-w-2xl bg-white rounded-2.5xl border border-slate-200/90 shadow-2xl flex flex-col text-slate-705 overflow-hidden`}
          >
            {/* Header / Search Input */}
            <div className="flex items-center gap-3 px-5 py-4.5 border-b border-slate-100">
              <Search className="h-5.5 w-5.5 text-indigo-505 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder={
                  lang === 'ar' 
                    ? 'ابحث عن صفحة، ميزة، أو إجراء سريع... (استخدم الأسهم ⇅ للتنقل)' 
                    : 'Search tabs, active features, or rapid actions... (⇅ arrows to navigate)'
                }
                className="w-full bg-transparent text-slate-800 text-sm font-bold outline-none placeholder:text-slate-400"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline-flex items-center justify-center bg-slate-100 text-slate-500 text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-slate-200">
                  ESC
                </span>
                <button 
                  onClick={onClose} 
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content list body */}
            <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-slate-50 scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-3">
                  <Terminal className="h-10 w-10 text-slate-300 animate-pulse" />
                  <p className="text-xs font-black">
                    {lang === 'ar' ? 'لم يتم العثور على تشابهات مع طلبك' : 'No matching commands or actions found'}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'ar' ? 'حاول إدخال كلمات مختلفة كالمشاريع، اللغات، التكلفة، الرمز السري' : 'Try searching for tools like projects, translate, lock, cost'}
                  </span>
                </div>
              ) : (
                // Group commands beautifully by category
                Object.entries(
                  filtered.reduce((acc, curr) => {
                    if (!acc[curr.category]) acc[curr.category] = [];
                    acc[curr.category].push(curr);
                    return acc;
                  }, {} as Record<string, typeof commands>)
                ).map(([category, items]) => (
                  <div key={category} className="p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] sm:text-[11px] font-black text-indigo-600/95 tracking-wide uppercase select-none font-mono">
                      {category}
                    </div>
                    
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const itemIndex = filtered.indexOf(item);
                        const isSelected = itemIndex === selectedIndex;
                        
                        return (
                          <div
                            key={item.id}
                            onClick={() => item.action()}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            className={`flex items-center justify-between p-3 rounded-1.5xl cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? 'bg-indigo-50/70 text-indigo-900 border-l-4 border-l-indigo-600 pl-2'
                                : 'hover:bg-slate-50/50 text-slate-700 border-l-4 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border transition ${
                                isSelected 
                                  ? 'bg-white border-indigo-200 text-indigo-600' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500'
                              }`}>
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-extrabold text-xs sm:text-sm">
                                  {item.label}
                                </h4>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold line-clamp-1">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <AnimatePresence>
                              {isSelected && (
                                <motion.div 
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -5 }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 font-mono"
                                >
                                  <span>{lang === 'ar' ? 'انتقال' : 'Run'}</span>
                                  <CornerDownLeft className="h-3 w-3" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer status bar */}
            <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold font-mono select-none">
              <span className="flex items-center gap-1">
                <span>Ctrl + K</span>
                <span>{lang === 'ar' ? 'لتفعيل الخزنة' : 'to launch anywhere'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-slate-350 animate-pulse" />
                <span>v5.5.5 PRO CORE</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
