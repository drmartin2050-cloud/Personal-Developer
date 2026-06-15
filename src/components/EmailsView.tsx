import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Plus, Copy, Check, ChevronDown, ChevronUp, Trash2, Tag, Info, PlusCircle, X, Sparkles, ShieldAlert } from 'lucide-react';
import { LocalizationSchema, Language } from '../types';
import GoogleServicesHub from './GoogleServicesHub';

interface EmailAlias {
  id: string;
  aliasAddress: string;
  platform: string;
}

interface MainEmailAccount {
  id: string;
  address: string;
  aliases: EmailAlias[];
}

interface EmailsViewProps {
  key?: string;
  t: LocalizationSchema['emails'];
  lang: Language;
}

const SEED_EMAILS: MainEmailAccount[] = [
  {
    id: 'seed-email-1',
    address: 'drmartin2050@gmail.com',
    aliases: [
      { id: 'alias-1', aliasAddress: 'drmartin.bolt@gmail.com', platform: 'Bolt.new' },
      { id: 'alias-2', aliasAddress: 'drmartin.lovable@gmail.com', platform: 'Lovable' },
      { id: 'alias-3', aliasAddress: 'drmartin.supabase@gmail.com', platform: 'Supabase' },
    ]
  },
  {
    id: 'seed-email-2',
    address: 'eissa.developer@outlook.com',
    aliases: [
      { id: 'alias-4', aliasAddress: 'eissa.v0@outlook.com', platform: 'v0.dev' },
      { id: 'alias-5', aliasAddress: 'eissa.replit@outlook.com', platform: 'Replit' },
    ]
  }
];

export default function EmailsView({ t, lang }: EmailsViewProps) {
  const [accounts, setAccounts] = useState<MainEmailAccount[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>('seed-email-1');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal forms states
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [selectedMainAccountId, setSelectedMainAccountId] = useState<string>('');

  // Error/Success state to show inside modal instead of window.alert
  const [modalError, setModalError] = useState<string>('');

  // Fields for main email
  const [newMainEmail, setNewMainEmail] = useState('');
  
  // Fields for alias email
  const [newAliasEmail, setNewAliasEmail] = useState('');
  const [newAliasPlatform, setNewAliasPlatform] = useState('Bolt.new');
  const [customPlatform, setCustomPlatform] = useState('');

  // Hydrate from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('dev_hub_emails_aliases');
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch (e) {
        setAccounts(SEED_EMAILS);
      }
    } else {
      setAccounts(SEED_EMAILS);
    }
  }, []);

  // Save to localStorage when changed
  const saveAccounts = (updated: MainEmailAccount[]) => {
    setAccounts(updated);
    localStorage.setItem('dev_hub_emails_aliases', JSON.stringify(updated));
  };

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAccordion = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleAddMainEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newMainEmail.trim() || !newMainEmail.includes('@')) {
      setModalError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني رئيسي صالح!' : 'Please enter a valid main email address.');
      return;
    }

    // Check if duplicate
    if (accounts.some(acc => acc.address.toLowerCase() === newMainEmail.trim().toLowerCase())) {
      setModalError(lang === 'ar' ? 'البريد الإلكتروني موجود بالفعل!' : 'This email address is already registered!');
      return;
    }

    const newAccount: MainEmailAccount = {
      id: `main-${Date.now()}`,
      address: newMainEmail.trim(),
      aliases: []
    };

    const updated = [newAccount, ...accounts];
    saveAccounts(updated);
    setExpandedId(newAccount.id);
    setNewMainEmail('');
    setModalError('');
    setIsMainModalOpen(false);
  };

  const handleOpenAddAlias = (accountId: string) => {
    setSelectedMainAccountId(accountId);
    setModalError('');
    setIsAliasModalOpen(true);
  };

  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newAliasEmail.trim() || !newAliasEmail.includes('@')) {
      setModalError(lang === 'ar' ? 'يرجى إدخال عنوان مستعار صالح!' : 'Please enter a valid alias email.');
      return;
    }

    const finalPlatform = newAliasPlatform === 'Other' ? customPlatform.trim() : newAliasPlatform;
    if (!finalPlatform.trim()) {
      setModalError(lang === 'ar' ? 'يرجى تحديد المنصة المرتبطة!' : 'Please specify the associated platform.');
      return;
    }

    const updated = accounts.map(acc => {
      if (acc.id === selectedMainAccountId) {
        return {
          ...acc,
          aliases: [
            ...acc.aliases,
            {
              id: `alias-${Date.now()}`,
              aliasAddress: newAliasEmail.trim(),
              platform: finalPlatform
            }
          ]
        };
      }
      return acc;
    });

    saveAccounts(updated);
    setNewAliasEmail('');
    setNewAliasPlatform('Bolt.new');
    setCustomPlatform('');
    setModalError('');
    setIsAliasModalOpen(false);
  };

  const handleDeleteMain = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === 'ar' ? 'هل تود حذف هذا البريد الرئيسي والأسماء المستعارة التابعة له نهائياً؟' : 'Are you sure you want to delete this main email and all its aliases permanently?')) {
      const updated = accounts.filter(acc => acc.id !== accountId);
      saveAccounts(updated);
      if (expandedId === accountId) {
        setExpandedId(updated[0]?.id || null);
      }
    }
  };

  const handleDeleteAlias = (accountId: string, aliasId: string) => {
    if (confirm(lang === 'ar' ? 'هل تود حذف هذا الاسم المستعار؟' : 'Are you sure you want to delete this alias?')) {
      const updated = accounts.map(acc => {
        if (acc.id === accountId) {
          return {
            ...acc,
            aliases: acc.aliases.filter(alias => alias.id !== aliasId)
          };
        }
        return acc;
      });
      saveAccounts(updated);
    }
  };

  const platformPresets = ['Bolt.new', 'Lovable', 'v0.dev', 'Cursor', 'GitHub', 'OpenAI', 'Supabase', 'Other'];

  return (
    <div id="emails-root-container" className="space-y-6 max-w-6xl mx-auto select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Promo Banner / Qwen gradient details */}
      <div id="emails-header-banner" className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-3d-flat card-persp card-persp-hover">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-mono font-black rounded-full shadow-3xs uppercase">
            <Mail className="h-4 w-4 text-indigo-650 shrink-0" />
            <span>{lang === 'ar' ? 'إدارة الهوية والبروكسي' : 'ALIAS & BOUND EMAIL PROXY'}</span>
          </div>
          <h1 id="emails-title" className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            {t.title}
          </h1>
          <p id="emails-subtitle" className="text-sm text-slate-500 max-w-2xl leading-relaxed font-semibold">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Real Live Google Workspace Integration Hub */}
      <GoogleServicesHub lang={lang} />

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4.5 border border-slate-200 rounded-3xl shadow-3d-flat card-persp">
        <span className="text-xs text-slate-500 font-black">
          {lang === 'ar' 
            ? `إجمالي العناوين المسجلة: ${accounts.length} بريد رئيسي مع ${accounts.reduce((sum, acc) => sum + acc.aliases.length, 0)} بريد مستعار`
            : `Total: ${accounts.length} Main Emails with ${accounts.reduce((sum, acc) => sum + acc.aliases.length, 0)} registered aliases`
          }
        </span>
        <button
          onClick={() => {
            setModalError('');
            setIsMainModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl text-white font-extrabold text-xs transition duration-200 cursor-pointer shadow-md select-none border border-indigo-600"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          <Plus className="h-4.5 w-4.5 text-white" />
          <span>{t.addMainEmailBtn}</span>
        </button>
      </div>

      {/* Main Accordion Loop */}
      {accounts.length === 0 ? (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3 shadow-3xs">
          <Mail className="h-12 w-12 mx-auto text-indigo-300 shrink-0" />
          <p className="text-sm font-black max-w-md mx-auto">{t.noEmailsYet}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(acc => {
            const isExpanded = expandedId === acc.id;
            return (
              <div 
                key={acc.id} 
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden transition-all duration-300 shadow-3d-flat card-persp hover:border-slate-300"
              >
                {/* Accordion Trigger Header */}
                <div 
                  onClick={() => toggleAccordion(acc.id)}
                  className="flex items-center justify-between p-5 cursor-pointer bg-white transition select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-mono text-slate-400 font-extrabold block">{t.mainEmailLabel}</span>
                      <strong className="text-sm text-slate-800 hover:text-indigo-600 transition font-mono truncate block font-black">{acc.address}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-mono rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black">
                      {acc.aliases.length} aliases
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(acc.address, acc.id);
                      }}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-450 hover:text-slate-800 transition cursor-pointer"
                      title={lang === 'ar' ? 'نسخ البريد الرئيسي' : 'Copy Primary Email'}
                    >
                      {copiedId === acc.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={(e) => handleDeleteMain(acc.id, e)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title={t.deleteBtn}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion List */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-5 space-y-4">
                        {/* Title & Plus Actions */}
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                          <span className="text-xs font-black text-slate-550 flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-indigo-600" />
                            {lang === 'ar' ? 'الأسماء المستعارة التابعة (Platform Logins)' : 'Bound Platform Alias List'}
                          </span>
                          <button
                            onClick={() => handleOpenAddAlias(acc.id)}
                            className="flex items-center gap-1 text-[11px] font-black text-indigo-650 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl cursor-pointer transition"
                          >
                            <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{t.addAliasBtn}</span>
                          </button>
                        </div>

                        {acc.aliases.length === 0 ? (
                           <div id="no-aliases" className="p-6 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl space-y-1">
                             <p className="font-bold">{lang === 'ar' ? 'لا توجد أسماء مستعارة مربوطة بعد لهذا العنوان.' : 'No associated alias proxy emails attached yet.'}</p>
                             <p className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'اضغط على إضافة اسم مستعار بالمسار لربط حسابات Bolt أو Lovable' : 'Tap Add Alias above to bind and map Bolt.new, Lovable or other proxy credentials.'}</p>
                           </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {acc.aliases.map(alias => (
                              <div 
                                key={alias.id} 
                                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-3xs"
                              >
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span 
                                      className="px-2 py-0.5 text-[9px] font-mono font-black tracking-wider uppercase rounded-lg text-white"
                                      style={{
                                        background: alias.platform.toLowerCase().includes('bolt') 
                                          ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                                          : alias.platform.toLowerCase().includes('lovable') 
                                          ? 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)'
                                          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                      }}
                                    >
                                      {alias.platform}
                                    </span>
                                  </div>
                                  <p className="font-mono text-xs text-slate-800 truncate pr-2 font-black">{alias.aliasAddress}</p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 font-semibold">
                                  <button
                                    onClick={() => handleCopy(alias.aliasAddress, alias.id)}
                                    className="p-1 px-2.5 flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-850 rounded-lg border border-slate-200 text-[10px] font-bold cursor-pointer transition"
                                  >
                                    {copiedId === alias.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-indigo-600" />}
                                    <span>{copiedId === alias.id ? t.copiedLabel : t.copyBtn}</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteAlias(acc.id, alias.id)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Accordion helper instruction card */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 animate-pulsate" />
        <div className="text-xs text-slate-500 leading-relaxed space-y-1 font-semibold">
          <strong className="text-slate-800 font-black block">{lang === 'ar' ? 'تلميحة المتصفح السريعة' : 'Development Tip'}</strong>
          <p>
            {lang === 'ar' 
              ? 'عند قيامك ببناء تطبيقات باستخدام Bolt.new أو Lovable، يمكنك استخدام الأسماء المستعارة لعزل اشتراكاتك أو تخزين الأكواد بشكل وتتبع حساب مستقل وتفادي قفل الحدود الشهرية.'
              : 'When building prototype applications on platforms like Bolt.new, Lovable, or Vercel, utilizing custom email aliases allows you to partition credentials cleanly, isolation subscriptions, and avoid cross-account billing or tier limit overlap.'
            }
          </p>
        </div>
      </div>

      {/* Modal 1: Add Main Email Account */}
      <AnimatePresence>
        {isMainModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMainModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-205 p-6 shadow-xl text-slate-705 z-10"
            >
              <button
                onClick={() => setIsMainModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-md font-black text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-600 animate-spin" />
                <span>{t.modalTitleMain}</span>
              </h3>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddMainEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 block">{t.mainEmailLabel} *</label>
                  <input
                    type="email"
                    required
                    value={newMainEmail}
                    onChange={(e) => setNewMainEmail(e.target.value)}
                    placeholder={t.placeholderMainEmail}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-505 hover:border-slate-300 transition-colors font-semibold font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsMainModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-455 hover:text-slate-850 text-xs font-bold cursor-pointer"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-555 border border-indigo-650 text-white font-bold transition text-xs cursor-pointer shadow-xs"
                  >
                    {t.saveBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Add Sub-email Alias Account */}
      <AnimatePresence>
        {isAliasModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAliasModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-250 p-6 shadow-xl text-slate-700 z-10"
            >
              <button
                onClick={() => setIsAliasModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-md font-black text-slate-855 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-600 animate-spin animate-pulsate" />
                <span>{t.modalTitleAlias}</span>
              </h3>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddAlias} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-505 block">{t.aliasLabel} *</label>
                    <input
                      type="email"
                      required
                      value={newAliasEmail}
                      onChange={(e) => setNewAliasEmail(e.target.value)}
                      placeholder={t.placeholderAliasEmail}
                      className="w-full text-slate-804 bg-slate-50 border border-slate-205 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-505 hover:border-slate-300 transition-colors font-semibold font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-505 block">{t.platformLabel}</label>
                      <select
                        value={newAliasPlatform}
                        onChange={(e) => setNewAliasPlatform(e.target.value)}
                        className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-indigo-505 cursor-pointer font-black"
                      >
                        {platformPresets.map(plat => (
                          <option key={plat} value={plat} className="font-bold">{plat}</option>
                        ))}
                      </select>
                    </div>

                    {newAliasPlatform === 'Other' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-505 block">{lang === 'ar' ? 'اسم المنصة المخصصة' : 'Custom Platform'} *</label>
                        <input
                          type="text"
                          required
                          value={customPlatform}
                          onChange={(e) => setCustomPlatform(e.target.value)}
                          placeholder="Bolt.new"
                          className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-indigo-505 font-semibold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsAliasModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-455 hover:text-slate-850 text-xs font-bold cursor-pointer"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-555 border border-indigo-655 font-bold text-white transition text-xs cursor-pointer shadow-xs"
                  >
                    {t.saveBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
