import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderGit2, Trash2, Plus, ExternalLink, X, ShieldAlert, FileCode, Search, Sparkles } from 'lucide-react';
import { LocalizationSchema, Project } from '../types';

interface ProjectsViewProps {
  key?: string;
  t: LocalizationSchema['projects'];
  projects: Project[];
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onDeleteProject: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export default function ProjectsView({
  t,
  projects,
  onAddProject,
  onDeleteProject,
  isAddModalOpen,
  setIsAddModalOpen,
}: ProjectsViewProps) {
  // Form State
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Lovable');
  const [customPlatform, setCustomPlatform] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [errorMess, setErrorMess] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p =>
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.platformUsed.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.associatedEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalPlatform = platform === 'Other' ? customPlatform.trim() : platform;

    // Direct simple inputs verification
    if (!name.trim() || !finalPlatform.trim() || !email.trim()) {
      setErrorMess(t.validationError);
      return;
    }

    // URL optional check
    if (url.trim() && !url.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)) {
      setErrorMess(t.validationError);
      return;
    }

    // Add protocol if missing from URL
    let formattedUrl = url.trim();
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    onAddProject({
      projectName: name.trim(),
      platformUsed: finalPlatform,
      associatedEmail: email.trim(),
      projectUrl: formattedUrl,
    });

    // Reset Form Fields
    setName('');
    setPlatform('Lovable');
    setCustomPlatform('');
    setEmail('');
    setUrl('');
    setErrorMess('');
    setIsAddModalOpen(false);
  };

  const platformsList = ['Lovable', 'Bolt.new', 'Base44', 'Kimi', 'Google', 'Vercel', 'Netlify', 'Other'];

  // Beautiful brand gradient badge assignments
  const getPlatformGradient = (pForm: string) => {
    const norm = pForm.toLowerCase();
    if (norm.includes('lovable')) {
      return 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)'; // Rose/Pink
    }
    if (norm.includes('bolt')) {
      return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'; // Electric blue
    }
    if (norm.includes('base44')) {
      return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'; // Cyan depth
    }
    if (norm.includes('kimi')) {
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // Emerald
    }
    if (norm.includes('google')) {
      return 'linear-gradient(135deg, #ea4335 0%, #f9ab00 100%)'; // Red-yellow arc
    }
    if (norm.includes('vercel')) {
      return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'; // Dark premium slate
    }
    return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'; // Violet gradient
  };

  return (
    <motion.div
      id="projects-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header and Add Project Controls */}
      <div id="projects-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 sm:text-3xl flex items-center gap-2">
            <FolderGit2 className="h-7 w-7 text-indigo-600 animate-pulse" />
            <span>{t.title}</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl font-semibold">
            {t.subtitle}
          </p>
        </div>

        <button
          id="btn-add-project"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-extrabold text-xs transition duration-200 cursor-pointer shadow-md select-none hover:shadow-indigo-500/25 border border-indigo-600"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          <Plus className="h-4.5 w-4.5 text-white" />
          <span>{t.addBtn}</span>
        </button>
      </div>

      {/* Search & Filter bar widget */}
      <div id="projects-search-bar" className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-3d-flat card-persp card-persp-hover">
        <Search className="h-5 w-5 text-indigo-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects, platforms, or emails..."
          className="bg-transparent text-sm text-slate-800 outline-none w-full placeholder:text-slate-400 font-bold"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-indigo-650 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Projects Desktop table & adaptive mobile layouts */}
      <div id="projects-table-wrapper" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-3d-flat card-persp select-none">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <FolderGit2 className="h-14 w-14 text-indigo-300 mb-4" />
            <h3 className="font-extrabold text-slate-705 text-lg">{t.noProjectsYet}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-2 max-w-sm leading-relaxed">
              Use the Add Button to save, keep record of, and track your builds locally.
            </p>
          </div>
        ) : (
          <div className="w-full">
            {/* Desktop Table - Hidden on tiny layouts */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-indigo-50 bg-indigo-50/20 text-indigo-900 font-black">
                    <th className="p-4.5">{t.tableName}</th>
                    <th className="p-4.5">{t.tablePlatform}</th>
                    <th className="p-4.5">{t.tableEmail}</th>
                    <th className="p-4.5">{t.tableUrl}</th>
                    <th className="p-4.5 text-center">{t.tableActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  <AnimatePresence mode="popLayout">
                    {filteredProjects.map((project) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        key={project.id}
                        className="hover:bg-slate-50 text-slate-700 transition-all duration-200 group"
                      >
                        {/* Name info */}
                        <td className="p-4.5 font-extrabold text-slate-800 max-w-[185px] truncate">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4.5 w-4.5 text-indigo-555 shrink-0 group-hover:animate-bounce" />
                            <span className="truncate">{project.projectName}</span>
                          </div>
                        </td>
                        
                        {/* Platform Gradient Badges */}
                        <td className="p-4.5">
                          <span 
                            className="inline-flex items-center rounded-xl px-3 py-1 text-[11px] font-black text-white shadow-xs font-mono"
                            style={{ background: getPlatformGradient(project.platformUsed) }}
                          >
                            {project.platformUsed}
                          </span>
                        </td>

                        {/* Associated Email */}
                        <td className="p-4.5 font-mono text-xs text-slate-500 font-bold truncate max-w-[190px]">
                          {project.associatedEmail}
                        </td>

                        {/* URL Link */}
                        <td className="p-4.5 max-w-[200px] truncate">
                          {project.projectUrl ? (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-650 hover:text-indigo-800 font-black"
                            >
                              <span className="truncate max-w-[150px]">{project.projectUrl.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4.5 text-center">
                          <button
                            onClick={() => {
                              if (confirm(t.deleteConfirm)) {
                                onDeleteProject(project.id);
                              }
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Fallback Card Grid */}
            <div className="block md:hidden p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-3xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                        <h4 className="font-black text-slate-800 text-sm truncate max-w-[180px]">{project.projectName}</h4>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(t.deleteConfirm)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                      <span 
                        className="rounded-lg px-2.5 py-0.5 text-[10px] font-black text-white font-mono"
                        style={{ background: getPlatformGradient(project.platformUsed) }}
                      >
                        {project.platformUsed}
                      </span>
                      <span className="font-mono text-slate-500 font-bold max-w-[150px] truncate">{project.associatedEmail}</span>
                    </div>

                    {project.projectUrl && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-black bg-white border border-slate-200 px-3 py-1 rounded-xl"
                        >
                          <span>Open Location</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Add Project Modal Popup */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div id="add-project-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-xl text-slate-700 z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                <Sparkles className="h-6 w-6 text-indigo-600 animate-spin" />
                <h3 className="text-lg font-black text-slate-800">{t.modalTitle}</h3>
              </div>

              {errorMess && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>{errorMess}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{t.tableName} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.placeholderName}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-505 hover:border-slate-300 transition font-semibold"
                  />
                </div>

                {/* Build Platform Selection Option selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{t.tablePlatform} *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full text-slate-805 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-indigo-500 transition font-black cursor-pointer"
                    >
                      {platformsList.map((plat) => (
                        <option key={plat} value={plat} className="text-slate-805 bg-white font-bold">{plat}</option>
                      ))}
                    </select>

                    {platform === 'Other' && (
                      <input
                        type="text"
                        required
                        value={customPlatform}
                        onChange={(e) => setCustomPlatform(e.target.value)}
                        placeholder="Platform Name..."
                        className="w-full text-slate-808 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-indigo-500 transition font-semibold"
                      />
                    )}
                  </div>
                </div>

                {/* Associated Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{t.tableEmail} *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.placeholderEmail}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-500 hover:border-slate-300 transition font-semibold"
                  />
                </div>

                {/* Project URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{t.tableUrl} (Optional)</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.placeholderUrl}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-500 hover:border-slate-300 transition font-semibold font-mono"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-455 hover:text-slate-800 transition text-xs font-bold cursor-pointer"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-555 font-bold text-white transition text-xs cursor-pointer border border-indigo-650"
                  >
                    {t.saveBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
