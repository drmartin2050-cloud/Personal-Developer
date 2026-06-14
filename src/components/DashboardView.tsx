import React from 'react';
import { motion } from 'motion/react';
import { FolderGit2, ShieldAlert, Library, PlusCircle, ArrowRightLeft, ShieldCheck, ExternalLink } from 'lucide-react';
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
}: DashboardViewProps) {
  const stats = [
    {
      id: 'stat-projects',
      label: t.totalProjects,
      value: projectsCount,
      icon: FolderGit2,
      color: 'from-sky-600 to-blue-600',
      shadowColor: 'rgba(2, 132, 199, 0.15)',
      tab: 'projects' as ActiveTab,
    },
    {
      id: 'stat-resources',
      label: t.savedResources,
      value: resourcesCount,
      icon: Library,
      color: 'from-blue-600 to-sky-600',
      shadowColor: 'rgba(37, 99, 235, 0.15)',
      tab: 'resources' as ActiveTab,
    },
    {
      id: 'stat-secrets',
      label: t.secureSecrets,
      value: secretsCount,
      icon: ShieldCheck,
      color: 'from-sky-700 to-indigo-600',
      shadowColor: 'rgba(2, 132, 199, 0.15)',
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
      {/* Header Banner */}
      <div id="dashboard-header" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-8 border border-zinc-800">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-sky-500/5 blur-3xl" />
        <div className="absolute left-0 bottom-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <motion.h1 
            id="dashboard-welcome-heading"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent"
          >
            {t.welcome}
          </motion.h1>
          <p id="dashboard-description-text" className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            {t.description}
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div id="dashboard-stats" className="space-y-4">
        <h2 id="stats-heading" className="text-xl font-bold text-zinc-200 flex items-center gap-2 border-b border-zinc-800/60 pb-2">
          <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
          {t.quickStats}
        </h2>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                id={`stat-card-${stat.id}`}
                whileHover={{ y: -4, scale: 1.01 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onNavigate(stat.tab)}
                className="cursor-pointer relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-zinc-700/80 group"
                style={{ boxShadow: `0 4px 20px -5px ${stat.shadowColor}` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-white group-hover:text-sky-450 transition-colors">
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                
                {/* Visual arrow indicator */}
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-zinc-500 group-hover:text-sky-450 transition-all">
                  <span>{navT[stat.tab]}</span>
                  <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bento Grid: Quick Commands & Recent Projects */}
      <div id="dashboard-bento" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Quick Actions Panel */}
        <div id="quick-actions-panel" className="lg:col-span-5 rounded-xl border border-zinc-800/85 bg-zinc-900/40 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-zinc-200 mb-4">{t.quickActions}</h3>
            <p className="text-xs text-zinc-500 mb-6">{t.platformBrief}</p>
          </div>
          
          <div className="space-y-3.5">
            <button
              id="action-add-project"
              onClick={onAddProjectClick}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all duration-200 group cursor-pointer shadow-lg shadow-sky-950/40 border border-sky-500/20"
            >
              <span className="flex items-center gap-3">
                <PlusCircle className="h-5 w-5" />
                {t.addNewProjectShort}
              </span>
              <span className="text-xs opacity-80 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">→</span>
            </button>

            <button
              id="action-manage-secrets"
              onClick={() => onNavigate('secrets')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-850 hover:text-sky-400 text-zinc-300 font-semibold text-sm transition-all duration-200 group cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-sky-450" />
                {t.manageCredentialsShort}
              </span>
              <span className="text-xs opacity-60 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">→</span>
            </button>

            <button
              id="action-view-resources"
              onClick={() => onNavigate('resources')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-850 hover:text-sky-400 text-zinc-300 font-semibold text-sm transition-all duration-200 group cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Library className="h-5 w-5 text-sky-450" />
                {t.viewResourcesShort}
              </span>
              <span className="text-xs opacity-60 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">→</span>
            </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-zinc-800/40 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <ShieldAlert className="h-3.5 w-3.5 text-zinc-650" />
              AES Local Sandbox Active
            </span>
          </div>
        </div>

        {/* Newly Added Projects Widget */}
        <div id="recent-projects-pane" className="lg:col-span-7 rounded-xl border border-zinc-800/85 bg-zinc-900/40 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-zinc-200 mb-4">{t.recentProjects}</h3>
            
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800/60 text-center px-4 my-2">
                <FolderGit2 className="h-10 w-10 text-zinc-705 mb-3" />
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                  {t.noRecentProjects}
                </p>
                <button
                  onClick={onAddProjectClick}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {t.addNewProjectShort}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 my-2 max-h-72 overflow-y-auto pr-1">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition animate-fade-in"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                        <h4 className="font-bold text-zinc-200 text-sm sm:text-base">{project.projectName}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">{project.platformUsed}</span>
                        <span className="truncate max-w-[200px] font-mono">{project.associatedEmail}</span>
                      </div>
                    </div>
                    
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:text-sky-400 transition text-xs text-zinc-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Link</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-800/40 flex justify-between items-center">
            <span className="text-xs text-zinc-500">
              Showing up to 3 latest files
            </span>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-305 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{navT.projects}</span>
              <span className="rtl:rotate-180">→</span>
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
