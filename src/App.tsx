import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderGit2,
  ShieldCheck,
  Library,
  Globe,
  Home,
  X,
  Lock,
  Webhook,
  Database,
  Calculator,
  Sparkles,
  Mail,
  Coins,
  Brain,
  AlertTriangle
} from 'lucide-react';
import { ActiveTab, Language, Project, CredentialItem } from './types';
import { locales } from './locales';
import { encryptText } from './utils/crypto';
import { isSupabaseConnected, getSupabaseClient, initializeDynamicSupabase } from './utils/supabase';
import { getEnvStatus, areCriticalEnvsLoaded } from './utils/envValidator';
import ConnectionTest from './components/ConnectionTest';
import ProductionChecklist from './components/ProductionChecklist';

// Subcomponents
import DashboardView from './components/DashboardView';
import ResourcesView from './components/ResourcesView';
import ProjectsView from './components/ProjectsView';
import SecretsManager from './components/SecretsManager';
import AutomationView from './components/AutomationView';
import CalculatorView from './components/CalculatorView';
import OptimizerView from './components/OptimizerView';
import EmailsView from './components/EmailsView';
import AIAssistant from './components/AIAssistant';
import { FloatingAIButton } from './components/FloatingAIButton';
import NewsTicker from './components/NewsTicker';
import AlertBell from './components/AlertBell';
import ExpenseTracker from './components/ExpenseTracker';
import AIAgentDashboard from './components/AIAgentDashboard';

// Pre-seeded local projects for starting visual feedback
const SEED_PROJECTS: Project[] = [
  {
    id: 'seed-p1',
    projectName: 'منصة الذكاء الاصطناعي التجريبية',
    platformUsed: 'Bolt.new',
    associatedEmail: 'drmartin2050@gmail.com',
    projectUrl: 'https://bolt.new',
  },
  {
    id: 'seed-p2',
    projectName: 'بوابة الدفع الإلكتروني المصغرة',
    platformUsed: 'Lovable',
    associatedEmail: 'drmartin2050@gmail.com',
    projectUrl: 'https://lovable.dev',
  },
  {
    id: 'seed-p3',
    projectName: 'تطبيق تخزين الملفات السحابي',
    platformUsed: 'Google',
    associatedEmail: 'drmartin2050@gmail.com',
    projectUrl: 'https://cloud.google.com',
  }
];

export default function App() {
  // Localization Config
  const [lang, setLang] = useState<Language>(() => {
    const savedLang = localStorage.getItem('dev_hub_lang');
    return (savedLang as Language) || 'ar'; // Arabic (RTL) is default
  });

  const t = locales[lang];
  const dir = t.dir;

  // Active Screen Selector
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Sidebar visibility on mobile screens
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Connection settings drawer/card trigger
  const [isConnSetupOpen, setIsConnSetupOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => localStorage.getItem('dev_hub_dyn_url') || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => localStorage.getItem('dev_hub_dyn_key') || '');
  const [isConnectedState, setIsConnectedState] = useState(false);

  // States
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  // Master Secrets Security Locking Key (default 'Eissa2026' for demo decryption)
  const [masterPasswordKey, setMasterPasswordKey] = useState<string>(() => {
    return sessionStorage.getItem('dev_hub_master_token') || '';
  });

  // Diagnostics & Sentry state toggles
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [diagnosticsActiveTab, setDiagnosticsActiveTab] = useState<'tests' | 'checklist'>('tests');
  const [envDiagnosticsPassed, setEnvDiagnosticsPassed] = useState(false);
  const [showSetupReminder, setShowSetupReminder] = useState(false);

  // Check state and trigger dynamic initializations
  useEffect(() => {
    const setupAndCheck = () => {
      // 1. Try dyn stored keys
      const storedUrl = localStorage.getItem('dev_hub_dyn_url');
      const storedKey = localStorage.getItem('dev_hub_dyn_key');
      if (storedUrl && storedKey) {
        initializeDynamicSupabase(storedUrl, storedKey);
      }
      setIsConnectedState(isSupabaseConnected());

      // 2. Automated Env Diagnose Check on startup
      const critLoaded = areCriticalEnvsLoaded();
      setEnvDiagnosticsPassed(critLoaded);
      if (!critLoaded) {
        setShowSetupReminder(true);
      }
    };
    setupAndCheck();
  }, []);

  const supabase = getSupabaseClient();

  // Load cloud-synced databases or use presets
  const loadCloudData = async () => {
    if (supabase) {
      try {
        // Fetch Projects
        const { data: projData, error: projErr } = await supabase
          .from('developer_projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (projErr) throw projErr;
        if (projData) {
          const mapped: Project[] = projData.map((p: any) => ({
            id: String(p.id),
            projectName: p.project_name || p.projectName,
            platformUsed: p.platform_used || p.platformUsed,
            associatedEmail: p.associated_email || p.associatedEmail,
            projectUrl: p.project_url || p.projectUrl || '',
          }));
          setProjects(mapped.length > 0 ? mapped : SEED_PROJECTS);
        }

        // Fetch Secrets
        const { data: credData, error: credErr } = await supabase
          .from('developer_credentials')
          .select('*')
          .order('created_at', { ascending: false });

        if (credErr) throw credErr;
        if (credData) {
          const mapped: CredentialItem[] = credData.map((c: any) => ({
            id: String(c.id),
            serviceName: c.service_name || c.serviceName,
            ipAddress: c.ip_address || c.ipAddress || '127.0.0.1',
            apiToken: c.api_token || c.apiToken,
            secretKey: c.secret_key || c.secretKey,
            serviceUrl: c.service_url || c.serviceUrl || '',
          }));
          setCredentials(mapped);
        }
      } catch (err: any) {
        console.warn('Could not read from Supabase, operating offline:', err.message);
        fallbackToLocal();
      }
    } else {
      fallbackToLocal();
    }
  };

  const fallbackToLocal = () => {
    const savedP = localStorage.getItem('dev_hub_projects');
    const savedC = localStorage.getItem('dev_hub_secrets');
    if (savedP) setProjects(JSON.parse(savedP));
    else setProjects(SEED_PROJECTS);

    if (savedC) {
      setCredentials(JSON.parse(savedC));
    } else {
      // Default encrypted mock credential using 'Eissa2026'
      const defaultCred: CredentialItem = {
        id: 'seed-cred-1',
        serviceName: 'Demo Supabase DB',
        ipAddress: 'db.supabase.com',
        apiToken: encryptText('sb_anon_public_key_demo_667238291', 'Eissa2026'),
        secretKey: encryptText('sb_service_role_secret_key_9921', 'Eissa2026'),
        serviceUrl: 'https://supabase.com/dashboard',
      };
      setCredentials([defaultCred]);
    }
  };

  useEffect(() => {
    loadCloudData();
  }, [isConnectedState]);

  // Sync state changes with local storage when offline as an elastic cushion
  useEffect(() => {
    if (!isConnectedState) {
      localStorage.setItem('dev_hub_projects', JSON.stringify(projects));
    }
  }, [projects, isConnectedState]);

  useEffect(() => {
    if (!isConnectedState) {
      localStorage.setItem('dev_hub_secrets', JSON.stringify(credentials));
    }
  }, [credentials, isConnectedState]);

  useEffect(() => {
    localStorage.setItem('dev_hub_lang', lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  // Keep master key in memory session safely
  useEffect(() => {
    if (masterPasswordKey) {
      sessionStorage.setItem('dev_hub_master_token', masterPasswordKey);
    } else {
      sessionStorage.removeItem('dev_hub_master_token');
    }
  }, [masterPasswordKey]);

  // Connect user's custom Supabase at runtime
  const handleConnectSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput || !supabaseKeyInput) {
      alert('Please fill out both URL and Anon key.');
      return;
    }

    const success = initializeDynamicSupabase(supabaseUrlInput.trim(), supabaseKeyInput.trim());
    if (success) {
      localStorage.setItem('dev_hub_dyn_url', supabaseUrlInput.trim());
      localStorage.setItem('dev_hub_dyn_key', supabaseKeyInput.trim());
      setIsConnectedState(true);
      setIsConnSetupOpen(false);
      alert('Supabase successfully verified and connected! Hydrating sync tables.');
    } else {
      alert('Connection failed. Please double check URL formulation format.');
    }
  };

  const handleDisconnectSupabase = () => {
    localStorage.removeItem('dev_hub_dyn_url');
    localStorage.removeItem('dev_hub_dyn_key');
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setIsConnectedState(false);
    window.location.reload();
  };

  // Add/Remove project operations with DB resilience
  const handleAddProject = async (newProj: Omit<Project, 'id'>) => {
    if (supabase && isConnectedState) {
      try {
        const { error } = await supabase.from('developer_projects').insert([{
          project_name: newProj.projectName,
          platform_used: newProj.platformUsed,
          associated_email: newProj.associatedEmail,
          project_url: newProj.projectUrl,
        }]);
        if (error) throw error;
        loadCloudData();
      } catch (err: any) {
        alert('Supabase write failure: ' + err.message);
      }
    } else {
      const projectWithId: Project = {
        ...newProj,
        id: `proj-${Date.now()}`,
      };
      setProjects((prev) => [projectWithId, ...prev]);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (supabase && isConnectedState) {
      try {
        const { error } = await supabase.from('developer_projects').delete().eq('id', id);
        if (error) throw error;
        loadCloudData();
      } catch (err: any) {
        alert('Supabase delete failure: ' + err.message);
      }
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Add/Remove secret credentials with DB resilience
  const handleAddCredential = async (newCred: Omit<CredentialItem, 'id'>) => {
    if (supabase && isConnectedState) {
      try {
        const { error } = await supabase.from('developer_credentials').insert([{
          service_name: newCred.serviceName,
          ip_address: newCred.ipAddress,
          api_token: newCred.apiToken,
          secret_key: newCred.secretKey,
          service_url: newCred.serviceUrl,
        }]);
        if (error) throw error;
        loadCloudData();
      } catch (err: any) {
        alert('Supabase credential save failure: ' + err.message);
      }
    } else {
      const credWithId: CredentialItem = {
        ...newCred,
        id: `cred-${Date.now()}`,
      };
      setCredentials((prev) => [credWithId, ...prev]);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (supabase && isConnectedState) {
      try {
        const { error } = await supabase.from('developer_credentials').delete().eq('id', id);
        if (error) throw error;
        loadCloudData();
      } catch (err: any) {
        alert('Supabase delete failure: ' + err.message);
      }
    } else {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: t.nav.dashboard, icon: Home },
    { id: 'resources' as ActiveTab, label: t.nav.resources, icon: Library },
    { id: 'projects' as ActiveTab, label: t.nav.projects, icon: FolderGit2 },
    { id: 'secrets' as ActiveTab, label: t.nav.secrets, icon: ShieldCheck },
    { id: 'emails' as ActiveTab, label: t.nav.emails, icon: Mail },
    { id: 'calculator' as ActiveTab, label: t.nav.calculator, icon: Calculator },
    { id: 'optimizer' as ActiveTab, label: t.nav.optimizer, icon: Sparkles },
    { id: 'automation' as ActiveTab, label: t.nav.automation, icon: Webhook },
    { id: 'expenses' as ActiveTab, label: t.nav.expenses, icon: Coins },
    { id: 'ai_agent' as ActiveTab, label: t.nav.ai_agent, icon: Brain },
  ];

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleFastAddProject = () => {
    setActiveTab('projects');
    setIsAddProjectModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased transition-colors duration-300">
      
      {/* 1. Dynamic Persistent Sticky Top Navbar Grid */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Brand Area */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-xs shadow-sky-600/10 shrink-0 font-bold">
                <FolderGit2 className="h-5.5 w-5.5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-800 tracking-tight leading-tight select-none">
                  {lang === 'ar' ? 'بوابة المطورين' : 'DevPortal'}
                </h2>
                <button
                  onClick={() => setIsConnSetupOpen(true)}
                  className="flex items-center gap-1 mt-0.5"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnectedState ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-[9px] font-mono text-slate-500 hover:text-sky-600 uppercase tracking-widest block font-bold">
                    {isConnectedState ? (lang === 'ar' ? 'سحابي' : 'CLOUD ACTIVE') : (lang === 'ar' ? 'محلي' : 'LOCAL CACHE')}
                  </span>
                </button>
              </div>
            </div>

            {/* Middle Nav Items - Desktop/MD and higher */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none
                      ${
                        isActive
                          ? 'bg-sky-50 text-sky-600 shadow-3xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right side actions - Sync Trigger, Lang Toggle, Lock Key */}
            <div className="flex items-center gap-2">
              
              {/* Sync Database setup icon trigger */}
              <button
                onClick={() => setIsConnSetupOpen(true)}
                title={lang === 'ar' ? 'ربط سحابي' : 'Connect Supabase'}
                className={`p-2 rounded-xl border text-xs font-extrabold transition duration-200 cursor-pointer flex items-center justify-center
                  ${
                    isConnectedState 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100/80 shadow-3xs'
                  }
                `}
              >
                <Database className="h-4.5 w-4.5 shrink-0" />
              </button>

              {/* Master Password Vault active lock status */}
              {masterPasswordKey && (
                <button
                  onClick={() => setMasterPasswordKey('')}
                  title={lang === 'ar' ? 'قفل الخزنة' : 'Lock Credentials'}
                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer flex items-center justify-center animate-pulse"
                >
                  <Lock className="h-4.5 w-4.5 shrink-0" />
                </button>
              )}

              {/* Sentry Active Diagnostic Status Pill */}
              <button
                id="btn-trigger-diagnostics-console"
                onClick={() => setIsDiagnosticsModalOpen(true)}
                title={lang === 'ar' ? 'فحص جاهزية Sentry' : 'Sentry Diagnostic Console'}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black tracking-tight uppercase flex items-center gap-1.5 transition duration-200 cursor-pointer shadow-3xs shrink-0
                  ${
                    envDiagnosticsPassed 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 animate-pulse'
                  }
                `}
              >
                <span className={`h-2 w-2 rounded-full ${envDiagnosticsPassed ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                <span>
                  {envDiagnosticsPassed ? (lang === 'ar' ? 'جاهز كلياً' : 'SENTRY PROD OK') : (lang === 'ar' ? 'يتطلب فحص البيئة' : 'SENTRY SETUP NEEDED')}
                </span>
              </button>

              {/* Dynamic Alert Notifications Panel */}
              <AlertBell lang={lang} />

              {/* Global Lang Selector Toggle */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-extrabold text-slate-600 cursor-pointer shadow-3xs transition"
              >
                <Globe className="h-4 w-4 text-sky-600 shrink-0" />
                <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Horizontal scrollable nav strip on smaller select viewports */}
        <div className="lg:hidden w-full border-t border-slate-100 bg-white overflow-x-auto scrollbar-none flex items-center gap-1.5 px-3 py-2 select-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`
                  flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap select-none
                  ${
                    isActive
                      ? 'bg-sky-50 text-sky-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Modern Bilingual News Ticker Component */}
      <NewsTicker lang={lang} />

      {/* Main Dynamic App View Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Page title display area below sticky header */}
        <div className="max-w-7xl w-full mx-auto px-4 md:px-10 pt-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-bold text-sky-600 font-mono tracking-widest uppercase">
                {lang === 'ar' ? 'بوابة التحكم' : 'PROTAL CENTRAL CONTROL'}
              </span>
              <h2 className="text-2xl font-black text-slate-800 mt-0.5">
                {activeTab === 'dashboard' && t.nav.dashboard}
                {activeTab === 'resources' && t.nav.resources}
                {activeTab === 'projects' && t.nav.projects}
                {activeTab === 'secrets' && t.nav.secrets}
                {activeTab === 'emails' && t.nav.emails}
                {activeTab === 'calculator' && t.nav.calculator}
                {activeTab === 'optimizer' && t.nav.optimizer}
                {activeTab === 'automation' && t.nav.automation}
                {activeTab === 'expenses' && t.nav.expenses}
                {activeTab === 'ai_agent' && t.nav.ai_agent}
              </h2>
            </div>
            
            {/* Quick stats on top */}
            <div className="flex items-center gap-4 mt-3 sm:mt-0 text-xs text-slate-500">
              <span className="bg-slate-100 px-3 py-1.5 rounded-xl font-semibold">
                {t.dashboard.totalProjects}: <strong className="text-slate-800 font-black ml-1 font-mono">{projects.length}</strong>
              </span>
              <span className="bg-slate-100 px-3 py-1.5 rounded-xl font-semibold">
                {t.dashboard.secureSecrets}: <strong className="text-sky-600 font-black ml-1 font-mono">{credentials.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Core Canvas wrapper */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 max-w-7xl w-full mx-auto">

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardView
                key="dashboard-view"
                t={t.dashboard}
                navT={t.nav}
                projectsCount={projects.length}
                resourcesCount={14} // Dynamic curated count representation
                secretsCount={credentials.length}
                recentProjects={projects.slice(0, 3)} // Show the 3 latest projects
                onNavigate={handleNavigate}
                onAddProjectClick={handleFastAddProject}
              />
            )}

            {activeTab === 'resources' && (
              <ResourcesView
                key="resources-view"
                t={t.resources}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView
                key="projects-view"
                t={t.projects}
                projects={projects}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                isAddModalOpen={isAddProjectModalOpen}
                setIsAddModalOpen={setIsAddProjectModalOpen}
              />
            )}

            {activeTab === 'secrets' && (
              <SecretsManager
                key="secrets-manager-view"
                lang={lang}
              />
            )}

            {activeTab === 'emails' && (
              <EmailsView
                key="emails-view"
                t={t.emails}
                lang={lang}
              />
            )}

            {activeTab === 'automation' && (
              <AutomationView
                key="automation-view"
                t={t.automation}
              />
            )}

            {activeTab === 'calculator' && (
              <CalculatorView
                key="calculator-view"
                t={t.calculator}
                lang={lang}
              />
            )}

            {activeTab === 'optimizer' && (
              <OptimizerView
                key="optimizer-view"
                t={t.optimizer}
                lang={lang}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseTracker
                key="expenses-view"
                lang={lang}
              />
            )}

            {activeTab === 'ai_agent' && (
              <AIAgentDashboard
                key="ai-agent-view"
                lang={lang}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 5. Custom Supabase Connection Configuration Window/Modal */}
      <AnimatePresence>
        {isConnSetupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConnSetupOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-slate-205 p-6 shadow-xl text-slate-700 z-10"
            >
              <button
                onClick={() => setIsConnSetupOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                <Database className="h-6 w-6 text-sky-600 animate-pulse" />
                <h3 className="text-lg font-black text-slate-800">
                  {lang === 'ar' ? 'إعدادات ربط Supabase السحابي' : 'Configure Supabase Cloud Link'}
                </h3>
              </div>

              <div className="p-3.5 text-xs bg-sky-50 border border-sky-100/80 text-sky-750 rounded-xl space-y-1 mb-4 leading-relaxed font-semibold">
                <p className="font-extrabold text-sky-800">✓ 100% Cloud-Based Data Syncing</p>
                <p className="opacity-90">
                  {lang === 'ar' 
                    ? 'أدخل بيانات مشروعك السحابي لحفظ ومزامنة المشاريع، المصادر، المفاتيح والويبهوكس على قاعدة بيانات سحابية مجانية حقيقية.' 
                    : 'Provide your credentials to seamlessly read, write and delete projects and n8n servers cross-device on a persistent hosted cloud Postgres.'}
                </p>
              </div>

              <form onSubmit={handleConnectSupabase} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Supabase URL *</label>
                  <input
                    type="url"
                    required
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzabcdefghijklmopq.supabase.co"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-sky-505 hover:border-slate-300 transition font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Supabase Anon Public API Key *</label>
                  <textarea
                    required
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ..."
                    rows={4}
                    className="w-full text-slate-805 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs focus:border-sky-505 hover:border-slate-300 transition font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-6">
                  {isConnectedState && (
                    <button
                      type="button"
                      onClick={handleDisconnectSupabase}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-50 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition text-xs font-extrabold cursor-pointer"
                    >
                      {lang === 'ar' ? 'فصل/إلغاء التزامن' : 'Disconnect Sync'}
                    </button>
                  )}
                  <div className="sm:flex-1" />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsConnSetupOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-450 hover:text-slate-800 transition text-xs font-bold cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-555 font-bold text-white transition text-xs cursor-pointer border border-sky-650"
                    >
                      {lang === 'ar' ? 'حفظ وتفعيل' : 'Connect & Sync'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Sentry Active Diagnostic & Production Checklist Modal Console */}
      <AnimatePresence>
        {isDiagnosticsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDiagnosticsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl z-10 text-slate-200"
            >
              <button
                onClick={() => setIsDiagnosticsModalOpen(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-200 cursor-pointer p-1.5 rounded-full bg-slate-900 border border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-6">
                <ShieldCheck className="h-6 w-6 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-xl font-black text-white">
                    {lang === 'ar' ? 'منصة الفحوصات وجاهزية النشر (Sentry Console)' : 'Sentry AI Diagnostics & Deploy HUD'}
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    System Autopilot Probes & Checklist Dashboard
                  </p>
                </div>
              </div>

              {/* Tab Selector buttons */}
              <div className="flex border-b border-slate-800 mb-6 gap-2">
                <button
                  onClick={() => setDiagnosticsActiveTab('tests')}
                  className={`px-4 py-2.5 font-bold text-xs transition duration-200 border-b-2 rounded-t-xl
                    ${
                      diagnosticsActiveTab === 'tests' 
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20' 
                        : 'border-transparent text-slate-400 hover:text-slate-250'
                    }
                  `}
                >
                  {lang === 'ar' ? '🔍 لوحة مقارنة وفحص الاتصالات' : '🔍 System Connection Probes'}
                </button>
                <button
                  onClick={() => setDiagnosticsActiveTab('checklist')}
                  className={`px-4 py-2.5 font-bold text-xs transition duration-200 border-b-2 rounded-t-xl
                    ${
                      diagnosticsActiveTab === 'checklist' 
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20' 
                        : 'border-transparent text-slate-400 hover:text-slate-250'
                    }
                  `}
                >
                  {lang === 'ar' ? '🚀 قائمة جاهزية النشر النهائي' : '🚀 Production Readiness Checklist'}
                </button>
              </div>

              {/* Rendering selected view */}
              <div className="py-2">
                {diagnosticsActiveTab === 'tests' ? (
                  <ConnectionTest lang={lang} />
                ) : (
                  <ProductionChecklist lang={lang} />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Setup Reminder Warning Banner overlay */}
      <AnimatePresence>
        {showSetupReminder && !envDiagnosticsPassed && (
          <div className="fixed bottom-6 left-6 z-50 max-w-sm">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="p-5 rounded-2xl bg-slate-900/95 border border-yellow-500/20 backdrop-blur-xl shadow-2xl space-y-3 text-slate-200"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 mt-0.5">
                  <AlertTriangle className="h-5 w-5 animate-bounce" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-yellow-400 uppercase">
                    {lang === 'ar' ? 'تحذير: متغيرات البيئة مفقودة' : 'Warning: Missing Secrets config'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {lang === 'ar' 
                      ? 'تم رصد نقص في مفاتيح الاستدعاء المطلوبة للذكاء والربط السحابي في مستودع Hugging Face.' 
                      : 'Some critical production variables are not fully resolved. Sentry automatic failovers are operational.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end text-[10px] font-bold">
                <button
                  onClick={() => setShowSetupReminder(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                >
                  {lang === 'ar' ? 'تخطي' : 'Dismiss'}
                </button>
                <button
                  onClick={() => {
                    setIsDiagnosticsModalOpen(true);
                    setDiagnosticsActiveTab('tests');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-extrabold"
                >
                  {lang === 'ar' ? 'حل الأخطاء ومتابعة' : 'Diagnose & Sentry Fix'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI Helper Sentry Controller */}
      <FloatingAIButton 
        onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)} 
        isOpen={isAIAssistantOpen} 
        lang={lang} 
      />

      <AIAssistant 
        activeTab={activeTab} 
        lang={lang} 
        onSetLang={(newLang) => {
          setLang(newLang);
          localStorage.setItem('dev_hub_lang', newLang);
        }} 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
      />
    </div>
  );
}
