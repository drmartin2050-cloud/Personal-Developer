import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FolderGit2, ShieldAlert, Library, PlusCircle, ShieldCheck, ExternalLink, ArrowRight, 
  Sparkles, Server, Cpu, Layers, Network, Database, RefreshCw, CheckCircle2, Zap, FileText 
} from 'lucide-react';
import { LocalizationSchema, Project, ActiveTab } from '../types';

interface DashboardViewProps {
  key?: string;
  t: LocalizationSchema['dashboard'];
  navT: LocalizationSchema['nav'];
  projectsCount: number;
  resourcesCount: number;
  secretsCount: number;
  recentProjects: Project[];
  onNavigate: (tab: ActiveTab) => void;
  onAddProjectClick: () => void;
  lang?: 'ar' | 'en';
}

export default function DashboardView({
  t,
  navT,
  projectsCount,
  resourcesCount,
  secretsCount,
  recentProjects,
  onNavigate,
  onAddProjectClick,
  lang = 'ar',
}: DashboardViewProps) {
  const stats = [
    {
      id: 'stat-projects',
      label: t.totalProjects,
      value: projectsCount,
      icon: FolderGit2,
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-100 text-indigo-600',
      tab: 'projects' as ActiveTab,
    },
    {
      id: 'stat-resources',
      label: t.savedResources,
      value: resourcesCount,
      icon: Library,
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-100 text-purple-600',
      tab: 'resources' as ActiveTab,
    },
    {
      id: 'stat-secrets',
      label: t.secureSecrets,
      value: secretsCount,
      icon: ShieldCheck,
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50 border-cyan-100 text-cyan-600',
      tab: 'secrets' as ActiveTab,
    },
  ];

  return (
    <motion.div
      id="dashboard-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* 3D Animated Welcome Card with Floating Gradient Elements */}
      <div 
        id="dashboard-header" 
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-3d-deep border border-indigo-200/20 card-persp"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)'
        }}
      >
        {/* Floating background glowing orbs */}
        <motion.div 
          animate={{ 
            y: [0, -12, 0],
            rotate: [0, 10, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            y: [0, 14, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute left-1/4 bottom-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" 
        />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 text-xs font-black tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 text-cyan-200 animate-spin" />
              <span>{t.welcome.substring(0, 5) || 'HELLO'}</span>
            </div>
            
            <h1 
              id="dashboard-welcome-heading"
              className="text-3xl sm:text-4.5xl font-black tracking-tight leading-tight"
              style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            >
              {t.welcome}
            </h1>
            <p id="dashboard-description-text" className="text-indigo-50 text-sm sm:text-base leading-relaxed font-semibold opacity-90">
              {t.description}
            </p>
          </div>

          {/* Floating graphic element representing mobile cloud server links */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden md:flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl shrink-0"
          >
            <Server className="h-10 w-10 text-cyan-200 animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest mt-2 text-white font-black">Active Hub Node</span>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards Section (hover with 3D tilts and multi-shadow values) */}
      <div id="dashboard-stats" className="space-y-4">
        <h2 id="stats-heading" className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-indigo-100 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-650 animate-pulse" />
          {t.quickStats}
        </h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                id={`stat-card-${stat.id}`}
                onClick={() => onNavigate(stat.tab)}
                className="cursor-pointer relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-3d-flat card-persp card-persp-hover group select-none"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
                    <h3 className="text-4xl font-black tracking-tight text-slate-800">
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`rounded-2xl border p-4 ${stat.bgColor} shadow-md`}>
                    <Icon className="h-6.5 w-6.5" />
                  </div>
                </div>
                
                {/* Visual link indicator with gradient hover support */}
                <div className="mt-6 flex items-center gap-1.5 text-xs font-black text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <span>{navT[stat.tab]}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bento Grid: Quick Actions & Recent Projects */}
      <div id="dashboard-bento" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Quick Actions Panel wrapped in exquisite gradient hover border */}
        <div id="quick-actions-panel" className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6.5 shadow-3d-flat flex flex-col justify-between card-persp card-persp-hover select-none">
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-2">{t.quickActions}</h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">{t.platformBrief}</p>
          </div>
          
          <div className="space-y-3.5">
            <button
              id="action-add-project"
              onClick={onAddProjectClick}
              className="w-full flex items-center justify-between p-4 rounded-2xl text-white font-extrabold text-sm transition-all cursor-pointer shadow-lg border border-indigo-600 hover:shadow-indigo-500/25"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              }}
            >
              <span className="flex items-center gap-3">
                <PlusCircle className="h-5 w-5 animate-pulse" />
                {t.addNewProjectShort}
              </span>
              <span className="text-xs font-extrabold">→</span>
            </button>

            <button
              id="action-manage-secrets"
              onClick={() => onNavigate('secrets')}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-750 font-bold text-sm transition-all cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                {t.manageCredentialsShort}
              </span>
              <span className="text-xs font-bold text-slate-400">→</span>
            </button>

            <button
              id="action-view-resources"
              onClick={() => onNavigate('resources')}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-750 font-bold text-sm transition-all cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Library className="h-5 w-5 text-indigo-600 shrink-0" />
                {t.viewResourcesShort}
              </span>
              <span className="text-xs font-bold text-slate-400">→</span>
            </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-400 font-mono">
              <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0" />
              AES Local Sandbox Active
            </span>
          </div>
        </div>

        {/* Newly Added Projects Widget */}
        <div id="recent-projects-pane" className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6.5 shadow-3d-flat flex flex-col justify-between card-persp card-persp-hover select-none">
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4">{t.recentProjects}</h3>
            
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center px-4 my-2">
                <FolderGit2 className="h-10 w-10 text-slate-400 mb-3" />
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm">
                  {t.noRecentProjects}
                </p>
                <button
                  onClick={onAddProjectClick}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5 animate-pulse" />
                  {t.addNewProjectShort}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 my-2 max-h-72 overflow-y-auto pr-1">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/55 hover:border-indigo-200 transition-all duration-250 shadow-3xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse" />
                        <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">{project.projectName}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-505 font-bold">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-120 text-[10px] text-indigo-700 font-bold">{project.platformUsed}</span>
                        <span className="truncate max-w-[200px] font-mono opacity-80">{project.associatedEmail}</span>
                      </div>
                    </div>
                    
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors text-xs text-slate-600 font-black cursor-pointer shadow-3xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Link</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-extrabold">
              Showing recent workspace additions
            </span>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-black text-indigo-600 hover:text-purple-600 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{navT.projects}</span>
              <span className="rtl:rotate-180 font-black">→</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modern V5.5.5 Core Upgrades control dashboard panel */}
      <div id="v5-upgrade-center" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-3d-flat select-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded-full text-[10px] font-black tracking-widest uppercase">
              <Zap className="h-3 w-3 text-sky-600 fill-sky-600 animate-pulse" />
              <span>{lang === 'ar' ? 'التحديث الشامل v5.5.5 جاهز' : 'SYSTEM UPGRADE v5.5.5 LIVE'}</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {lang === 'ar' ? 'دليل إمكانيات ومميزات ترقية الإصدار V5.5.5' : 'V5.5.5 Professional Software Upgrade Center'}
            </h3>
            <p className="text-xs text-slate-505 font-bold">
              {lang === 'ar' ? 'استعراض التحديثات الذكية الشاملة التي تم إدراجها في بنية التطبيق وقدراته الفائقة.' : 'Technical release notes, system capabilities, and structural optimizations.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="bg-slate-100/90 text-slate-850 px-3 py-1 text-xs font-black font-mono border border-slate-200 rounded-xl">
              CORE v5.5.5
            </span>
          </div>
        </div>

        {/* Bento Grid layout representing the structural updates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Feature 1 */}
          <div className="p-5 rounded-2.5xl border border-slate-150/80 bg-slate-50/50 hover:bg-slate-50 hover:border-sky-300 transition-all duration-300 flex items-start gap-4">
            <div className="p-3 bg-sky-50 border border-sky-100 text-sky-600 rounded-2xl shadow-xs shrink-0">
              <RefreshCw className="h-5 w-5 animate-spin-slow" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                {lang === 'ar' ? 'نظام الترجمة الفائق ثنائي المسار 🎯' : 'Dual-Path Prompt Translator Engine'}
              </h4>
              <p className="text-xs text-slate-505 font-bold leading-relaxed">
                {lang === 'ar' 
                  ? 'تم تحديث موديول ترجمة البرومبتات ليدعم وضعين احترافيين: "هندسة وتحسين البرومبت" (إضافة مدخلات ذكية لتوجيه ومحاكاة النماذج)، و"الترجمة الدقيقة الحرفية" (للحفاظ التام على أسلوب الكاتب وسياقه الطبيعي).'
                  : 'Allows selecting between "Engineered Prompt Optimization" for professional structural LLM prompt styling, and "Faithful Translation" to output strict literal translations.'}
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-2.5xl border border-slate-150/80 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all duration-300 flex items-start gap-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shadow-xs shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                {lang === 'ar' ? 'تزامن البيانات المرن والهجين سحابياً ☁️' : 'Dual-Layer Res resilient Database Sync'}
              </h4>
              <p className="text-xs text-slate-505 font-bold leading-relaxed">
                {lang === 'ar' 
                  ? 'دعم متكامل ومزامن فوري بين قواعد البيانات السحابية ومخزن الطوارئ المحلي (Local Storage Redundancy) لضمان عدم فقدان أي سطر برومبت أو بيانات عند انقطاع الشبكة أو حدوث خلل فني سحابي.'
                  : 'Complete data fault-tolerance. Automatic system redirection between live cloud services and local fallback cache depending on immediate API health scores.'}
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-2.5xl border border-slate-150/80 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-300 transition-all duration-300 flex items-start gap-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl shadow-xs shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                {lang === 'ar' ? 'أمان فك التشفير المحلي الفوري 🔒' : 'Military Obfuscation & Lock Vault'}
              </h4>
              <p className="text-xs text-slate-505 font-bold leading-relaxed">
                {lang === 'ar' 
                  ? 'توجيه كلمات السر والمفاتيح لآلية تشفير AES-Obfuscator ممتازة، تمنع القشرة الخارجية من عرض البيانات بدون كلمة المرور الموحدة للأمان مع القدرة على قفل الخزنة بضغطة زر وحذف الكاش تلقائياً.'
                  : 'Enables quick cryptographically secured lock and storage of API keys and server addresses. Instantly masks and encrypts content with a Master Password.'}
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-2.5xl border border-slate-150/80 bg-slate-50/50 hover:bg-slate-50 hover:border-cyan-300 transition-all duration-300 flex items-start gap-4">
            <div className="p-3 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-2xl shadow-xs shrink-0">
              <Cpu className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                {lang === 'ar' ? 'وحدة المراقبة الذاتية Sentry Core 🤖' : 'Sentry Autonomous Monitoring Core'}
              </h4>
              <p className="text-xs text-slate-505 font-bold leading-relaxed">
                {lang === 'ar' 
                  ? 'وكيل المراقبة الذاتي (Sentry Control Panel) الذي يعمل باستمرار لفحص سلامة المفاتيح والأداء وحزم الاختبار، مما يضمن خروج التطبيق دائماً بأعلى درجات الجاهزية والاستقرار (System Health Score).'
                  : 'Automated background scanning framework providing continuous health checks, connection assessments, diagnostic logs and instant environment validation.'}
              </p>
            </div>
          </div>

        </div>

        {/* Action Button to launch details or explore */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-2.5xl border border-slate-150 gap-4">
          <span className="text-xs text-slate-500 font-semibold text-center sm:text-left">
            {lang === 'ar' 
              ? 'إن جميع مكونات النظام تدعم بالكامل الإصدار v5.5.5 لتوفير تجربة برمجية متطورة للغاية.'
              : 'All modules, databases, components and services are synced live to version V5.5.5.'}
          </span>
          <button
            onClick={() => onNavigate('prompt_translator')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all shrink-0"
          >
            <span>{lang === 'ar' ? 'جرب مترجم الأوامر الجديد الفائق بنظام v5.5.5' : 'Try Upgraded Translator Now'}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>

    </motion.div>
  );
}
