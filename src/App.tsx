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
  Sparkles
} from 'lucide-react';
import { ActiveTab, Language, Project, CredentialItem } from './types';
import { locales } from './locales';
import { encryptText } from './utils/crypto';
import { isSupabaseConnected, getSupabaseClient, initializeDynamicSupabase } from './utils/supabase';

// Subcomponents
import DashboardView from './components/DashboardView';
import ResourcesView from './components/ResourcesView';
import ProjectsView from './components/ProjectsView';
import SecretsView from './components/SecretsView';
import AutomationView from './components/AutomationView';
import CalculatorView from './components/CalculatorView';
import OptimizerView from './components/OptimizerView';
import AIAssistantModal from './components/AIAssistantModal';

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

  // Master Secrets Security Locking Key (default 'admin' for demo decryption)
  const [masterPasswordKey, setMasterPasswordKey] = useState<string>(() => {
    return sessionStorage.getItem('dev_hub_master_token') || '';
  });

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
      // Default encrypted mock credential using 'admin'
      const defaultCred: CredentialItem = {
        id: 'seed-cred-1',
        serviceName: 'Demo Supabase DB',
        ipAddress: 'db.supabase.com',
        apiToken: encryptText('sb_anon_public_key_demo_667238291', 'admin'),
        secretKey: encryptText('sb_service_role_secret_key_9921', 'admin'),
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
    { id: 'automation' as ActiveTab, label: t.nav.automation, icon: Webhook },
    { id: 'calculator' as ActiveTab, label: t.nav.calculator, icon: Calculator },
    { id: 'optimizer' as ActiveTab, label: t.nav.optimizer, icon: Sparkles },
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased transition-colors duration-300 pb-20 md:pb-0">
      
      {/* 1. Mobile Shell Header Hud (Sticky Top on Mobile) */}
      <header className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight text-white block select-none">
              {lang === 'ar' ? 'بوابة المطورين' : 'DevPortal'}
            </span>
            {/* Status light */}
            <button 
              onClick={() => setIsConnSetupOpen(true)}
              className="flex items-center gap-1.5 text-[9px] text-zinc-400 hover:text-emerald-400 transition"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isConnectedState ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
              <span>{isConnectedState ? (lang === 'ar' ? 'متصل سحابياً' : 'Cloud Sync Active') : (lang === 'ar' ? 'ضبط التزامن' : 'Setup Sync')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="p-2.5 rounded-lg bg-zinc-805 border border-zinc-700/60 text-zinc-300 font-bold text-xs cursor-pointer flex items-center gap-1 hover:bg-zinc-750 transition"
          >
            <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </header>

      {/* 2. Desktop Sidebar Navigation (Hidden on mobile) */}
      <aside
        id="app-sidebar"
        className="hidden md:flex flex-col justify-between w-64 bg-zinc-900 border-r border-zinc-800/80 p-6 h-screen sticky top-0 z-30 transition-all duration-300 shrink-0"
      >
        <div className="space-y-8">
          {/* Logo Brand Card */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-805">
            <div className="flex items-center gap-3">
              <div className="w-9.5 h-9.5 bg-sky-650 rounded-lg flex items-center justify-center text-zinc-950 shadow-md">
                <FolderGit2 className="h-5.5 w-5.5 text-zinc-950" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white max-w-[120px] leading-tight">
                  {lang === 'ar' ? 'بوابة المطور' : 'Developer Hub'}
                </h2>
                {/* Dynamically connected state display */}
                <button
                  onClick={() => setIsConnSetupOpen(true)}
                  className="flex items-center gap-1 mt-0.5"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnectedState ? 'bg-sky-500 animate-pulse' : 'bg-zinc-550'}`} />
                  <span className="text-[9px] font-mono text-zinc-450 hover:text-white uppercase tracking-wider block">
                    {isConnectedState ? 'CLOUD ACTIVE' : 'LOCAL CACHE'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Tabs Links */}
          <nav className="space-y-1.5" id="nav-group">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer group
                    ${
                      isActive
                        ? 'bg-zinc-800 text-sky-400 font-medium shadow-sm shadow-zinc-950/50'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 shrink-0 ${isActive ? 'scale-105' : 'group-hover:scale-102'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Actions & Footer Footer metadata */}
        <div className="space-y-4 pt-6 border-t border-zinc-805">
          {/* Synced database configurations trigger */}
          <button
            onClick={() => setIsConnSetupOpen(true)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-bold transition cursor-pointer 
              ${
                isConnectedState 
                  ? 'border-sky-900/40 bg-sky-950/10 hover:bg-sky-950/20 text-sky-400' 
                  : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-sky-400 shrink-0" />
              <span>{isConnectedState ? (lang === 'ar' ? 'قاعدة بيانات متصلة' : 'Cloud Sync On') : (lang === 'ar' ? 'ربط سحابي' : 'Connect Supabase')}</span>
            </span>
          </button>

          {/* Desktop Language Selector */}
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-bold text-xs cursor-pointer hover:bg-zinc-750 transition"
          >
            <span className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-sky-450" />
              <span>{lang === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
            </span>
            <span className="font-mono text-[9px] uppercase font-bold text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded">
              {lang === 'ar' ? 'EN' : 'AR'}
            </span>
          </button>

          {/* Secure Lock Indicator status block */}
          {masterPasswordKey && (
            <button
              onClick={() => setMasterPasswordKey('')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-red-950/20 bg-red-950/10 hover:bg-red-950/15 text-red-100 hover:text-red-300 font-medium text-xs cursor-pointer transition"
            >
              <Lock className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{lang === 'ar' ? 'قفل الخزنة البرمجية' : 'Lock Credentials'}</span>
            </button>
          )}

          <div className="text-center md:text-left rtl:md:text-right px-2 space-y-1">
            <p className="text-[9px] text-zinc-550 font-mono">
              {lang === 'ar' ? 'قفل تشفير AES عالي الحماية' : 'Obfuscated cloud sync protection'}
            </p>
            <p className="text-[9px] text-zinc-600 font-mono">
              drmartin2050@gmail.com
            </p>
          </div>
        </div>
      </aside>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Sticky Fixed Bottom HUD for ultra easy thumb reach) */}
      <nav 
        id="mobile-bottom-nav" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 border-t border-zinc-800/90 backdrop-blur-lg flex items-center justify-around py-2 px-1 safe-bottom shadow-2xl"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className="flex flex-col items-center justify-center py-1 flex-1 min-w-[55px] cursor-pointer"
              style={{ minHeight: '48px' }} // Standard visual layout safety touch padding minimum limit
            >
              <div className={`p-1 rounded-xl transition-all duration-200 ${isActive ? 'text-sky-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Icon className="h-5.5 w-5.5" />
              </div>
              <span className={`text-[9px] mt-0.5 font-bold transition-colors duration-150 ${isActive ? 'text-sky-400' : 'text-zinc-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 4. Main Dynamic App View Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar HUD (desktop only) */}
        <header id="desktop-hud" className="hidden md:flex items-center justify-between px-10 py-5 bg-transparent border-b border-zinc-900 shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-sky-500 font-mono tracking-widest uppercase">
              {lang === 'ar' ? 'روافد بوابة المطور الشخصية' : 'CENTRAL MOBILE-OPTIMIZED HUBS'}
            </span>
            <h2 className="text-xl font-black text-white">
              {activeTab === 'dashboard' && t.nav.dashboard}
              {activeTab === 'resources' && t.nav.resources}
              {activeTab === 'projects' && t.nav.projects}
              {activeTab === 'secrets' && t.nav.secrets}
              {activeTab === 'automation' && t.nav.automation}
              {activeTab === 'calculator' && t.nav.calculator}
              {activeTab === 'optimizer' && t.nav.optimizer}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Supabase status header stat */}
            <div className="flex items-center gap-5 text-xs text-zinc-400 bg-zinc-900/40 border border-zinc-800 px-4 py-2 rounded-xl">
              <span className="font-semibold">{t.dashboard.totalProjects}: <strong className="text-white font-bold ml-1 font-mono">{projects.length}</strong></span>
              <span className="h-3.5 w-px bg-zinc-800" />
              <span className="font-semibold">{t.dashboard.secureSecrets}: <strong className="text-sky-450 font-bold ml-1 font-mono">{credentials.length}</strong></span>
            </div>
          </div>
        </header>

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
              <SecretsView
                key="secrets-view"
                t={t.secrets}
                credentials={credentials}
                onAddCredential={handleAddCredential}
                onDeleteCredential={handleDeleteCredential}
                masterPasswordKey={masterPasswordKey}
                setMasterPasswordKey={setMasterPasswordKey}
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
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-300 z-10"
            >
              <button
                onClick={() => setIsConnSetupOpen(false)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-350"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-zinc-800 pb-3">
                <Database className="h-6 w-6 text-emerald-400" />
                <h3 className="text-lg font-black text-zinc-100">
                  {lang === 'ar' ? 'إعدادات ربط Supabase السحابي' : 'Configure Supabase Cloud Link'}
                </h3>
              </div>

              <div className="p-3 text-xs bg-emerald-950/15 border border-emerald-900/35 text-emerald-400 rounded-lg space-y-1 mb-4 leading-relaxed">
                <p className="font-bold">✓ 100% Cloud-Based Data Syncing</p>
                <p className="opacity-80">
                  {lang === 'ar' 
                    ? 'أدخل بيانات مشروعك السحابي لحفظ ومزامنة المشاريع، المصادر، المفاتيح والويبهوكس على قاعدة بيانات سحابية مجانية حقيقية.' 
                    : 'Provide your credentials to seamlessly read, write and delete projects and n8n servers cross-device on a persistent hosted cloud Postgres.'}
                </p>
              </div>

              <form onSubmit={handleConnectSupabase} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">Supabase URL *</label>
                  <input
                    type="url"
                    required
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzabcdefghijklmopq.supabase.co"
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm focus:border-emerald-500 hover:border-zinc-755 transition font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">Supabase Anon Public API Key *</label>
                  <textarea
                    required
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ..."
                    rows={4}
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-xs focus:border-emerald-500 hover:border-zinc-755 transition font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/60 mt-6">
                  {isConnectedState && (
                    <button
                      type="button"
                      onClick={handleDisconnectSupabase}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-950/40 border border-rose-900/40 text-red-400 hover:bg-rose-950/70 transition text-xs font-bold cursor-pointer"
                    >
                      {lang === 'ar' ? 'فصل/إلغاء التزامن' : 'Disconnect Sync'}
                    </button>
                  )}
                  <div className="sm:flex-1" />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsConnSetupOpen(false)}
                      className="px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-850 text-zinc-450 hover:text-white transition text-xs font-bold cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition text-xs cursor-pointer shadow-emerald-950/40 shadow-md"
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

      {/* Floating AI Helper Assistant */}
      <AIAssistantModal t={t.aiHelper} lang={lang} />
    </div>
  );
}
