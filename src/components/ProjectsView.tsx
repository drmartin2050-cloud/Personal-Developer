import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderGit2, Trash2, Plus, ExternalLink, RefreshCw, X, ShieldAlert, FileCode } from 'lucide-react';
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

  const platformsList = ['Lovable', 'Bolt.new', 'Base44', 'Google', 'Vercel', 'Netlify', 'Other'];

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
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl flex items-center gap-2">
            <FolderGit2 className="h-7 w-7 text-emerald-500" />
            <span>{t.title}</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        <button
          id="btn-add-project"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-md shadow-emerald-950/40 border border-emerald-500/20 cursor-pointer transition"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>{t.addBtn}</span>
        </button>
      </div>

      {/* Search & Filter bar widget */}
      <div id="projects-search-bar" className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
        <FolderGit2 className="h-5 w-5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects, platforms, or emails..."
          className="bg-transparent text-sm text-zinc-200 outline-none w-full"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Projects Matrix Content */}
      <div id="projects-table-wrapper" className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-md">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <FolderGit2 className="h-14 w-14 text-zinc-850 mb-4 animate-bounce" />
            <h3 className="font-bold text-zinc-400 text-lg">{t.noProjectsYet}</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-sm">
              Use the Add Button to save, keep record of, and track your builds locally.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left rtl:text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 font-bold">
                  <th className="p-4">{t.tableName}</th>
                  <th className="p-4">{t.tablePlatform}</th>
                  <th className="p-4">{t.tableEmail}</th>
                  <th className="p-4">{t.tableUrl}</th>
                  <th className="p-4 text-center">{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      key={project.id}
                      className="hover:bg-zinc-900/40 text-zinc-300 transition duration-150"
                    >
                      {/* Name info */}
                      <td className="p-4 font-bold text-white max-w-[180px] truncate">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-emerald-450" />
                          <span>{project.projectName}</span>
                        </div>
                      </td>
                      
                      {/* Platform */}
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700/60 font-mono">
                          {project.platformUsed}
                        </span>
                      </td>

                      {/* Associated Email */}
                      <td className="p-4 font-mono text-xs text-zinc-400 truncate max-w-[200px]">
                        {project.associatedEmail}
                      </td>

                      {/* URL Link */}
                      <td className="p-4 max-w-[200px] truncate">
                        {project.projectUrl ? (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-350 font-semibold"
                          >
                            <span className="truncate max-w-[150px]">{project.projectUrl.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 font-mono">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(t.deleteConfirm)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
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
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-300"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-350"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-zinc-800 pb-3">
                <FolderGit2 className="h-6 w-6 text-emerald-500" />
                <h3 className="text-lg font-bold text-zinc-100">{t.modalTitle}</h3>
              </div>

              {errorMess && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span>{errorMess}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.tableName} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.placeholderName}
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-600 focus:border-emerald-500 hover:border-zinc-700 transition"
                  />
                </div>

                {/* Build Platform Selection Option selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.tablePlatform} *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm focus:border-emerald-500 transition"
                    >
                      {platformsList.map((plat) => (
                        <option key={plat} value={plat} className="bg-zinc-950">{plat}</option>
                      ))}
                    </select>

                    {platform === 'Other' && (
                      <input
                        type="text"
                        required
                        value={customPlatform}
                        onChange={(e) => setCustomPlatform(e.target.value)}
                        placeholder="Platform Name..."
                        className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm focus:border-emerald-500 transition"
                      />
                    )}
                  </div>
                </div>

                {/* Associated Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.tableEmail} *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.placeholderEmail}
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                  />
                </div>

                {/* Project URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.tableUrl} (Optional)</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.placeholderUrl}
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 text-zinc-450 hover:text-white transition text-xs font-bold cursor-pointer"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition text-xs cursor-pointer shadow-emerald-950/40 shadow-md"
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
