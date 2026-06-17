import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Share2, Bot, Library, Globe, ExternalLink, Plus, X, Trash2, Tag, Sparkles, Clock } from 'lucide-react';
import { LocalizationSchema, ResourceItem } from '../types';
import { developerResources as SEED_RESOURCES } from '../data/resources';
import { getSupabaseClient } from '../utils/supabase';

interface ResourcesViewProps {
  key?: string;
  t: LocalizationSchema['resources'];
}

export default function ResourcesView({ t }: ResourcesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'database' | 'social' | 'ai'>('all');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  
  // Add Resource Modal trigger states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'database' | 'social' | 'ai'>('database');
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const supabase = getSupabaseClient();

  const loadResources = async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('developer_resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          const fetchedItems: ResourceItem[] = data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            description: item.description,
            category: item.category as any,
            url: item.url,
            isUserAdded: true,
          }));
          // Mix with original seeds so they always have preset cards!
          setResources([...fetchedItems, ...SEED_RESOURCES]);
        } else {
          setResources(SEED_RESOURCES);
        }
      } catch (err: any) {
        console.error('Error fetching resources from Supabase:', err.message);
        setResources(SEED_RESOURCES);
      }
    } else {
      // Local fallback cached resources
      const cached = sessionStorage.getItem('dev_hub_custom_resources');
      if (cached) {
        const parsed = JSON.parse(cached).map((item: any) => ({ ...item, isUserAdded: true }));
        setResources([...parsed, ...SEED_RESOURCES]);
      } else {
        setResources(SEED_RESOURCES);
      }
    }
  };

  useEffect(() => {
    loadResources();
  }, [supabase]);

  const categories = [
    { id: 'all', label: t.categories.all, icon: Library },
    { id: 'database', label: t.categories.databases, icon: Database },
    { id: 'social', label: t.categories.social, icon: Share2 },
    { id: 'ai', label: t.categories.ai, icon: Bot },
  ];

  const filteredResources = selectedCategory === 'all'
    ? resources
    : resources.filter(r => r.category === selectedCategory);

  const getCategoryIconColor = (cat: string) => {
    switch (cat) {
      case 'database': return 'text-indigo-600 bg-indigo-50 border-indigo-150';
      case 'social': return 'text-cyan-600 bg-cyan-50 border-cyan-150';
      case 'ai': return 'text-purple-650 bg-purple-50 border-purple-150';
      default: return 'text-slate-500 bg-slate-50 border-slate-150';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'database': return <Database className="h-5 w-5" />;
      case 'social': return <Share2 className="h-5 w-5" />;
      case 'ai': return <Bot className="h-5 w-5 animate-pulse" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  // Handle adding new resource
  const handleAddResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !description || !url) {
      setErrorMessage('Please fill out all mandatory fields correctly!');
      return;
    }

    const newResourcePayload = {
      name,
      description,
      category,
      url,
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from('developer_resources')
          .insert([newResourcePayload]);

        if (error) throw error;
        
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setUrl('');
        loadResources();
      } catch (err: any) {
        setErrorMessage(err.message || 'Supabase could not record the resource.');
      }
    } else {
      // Offline fallback state management (session memory)
      const newLocalItem: ResourceItem = {
        id: `custom-res-${Date.now()}`,
        name,
        description,
        category,
        url,
        isUserAdded: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const cached = sessionStorage.getItem('dev_hub_custom_resources');
      const parsed = cached ? JSON.parse(cached) : [];
      const updated = [newLocalItem, ...parsed];
      sessionStorage.setItem('dev_hub_custom_resources', JSON.stringify(updated));

      setResources([...updated, ...SEED_RESOURCES]);
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setUrl('');
    }
  };

  // Delete Resource Capability
  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Delete this resource permanently?')) return;

    if (supabase) {
      try {
        // Double check if numeric or string
        const { error } = await supabase
          .from('developer_resources')
          .delete()
          .eq('id', resourceId);

        if (error) throw error;
        loadResources();
      } catch (err: any) {
        console.error('Database deletion failed. Slicing locally.', err.message);
        // Fallback filter
        setResources(prev => prev.filter(r => r.id !== resourceId));
      }
    } else {
      const cached = sessionStorage.getItem('dev_hub_custom_resources');
      if (cached) {
        const parsed = JSON.parse(cached);
        const updated = parsed.filter((r: any) => String(r.id) !== String(resourceId));
        sessionStorage.setItem('dev_hub_custom_resources', JSON.stringify(updated));
        setResources([...updated, ...SEED_RESOURCES]);
      } else {
        setResources(prev => prev.filter(r => r.id !== resourceId));
      }
    }
  };

  return (
    <motion.div
      id="resources-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Title Dashboard Section */}
      <div id="resources-title-section" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 sm:text-3xl flex items-center gap-2">
            <Library className="h-7 w-7 text-indigo-600" />
            <span>{t.title}</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed font-semibold">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-extrabold text-xs transition duration-200 cursor-pointer shadow-md select-none hover:shadow-indigo-500/25 border border-indigo-600"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          <Plus className="h-4.5 w-4.5 text-white" />
          <span>{t.addBtn}</span>
        </button>
      </div>

      {/* Categories Horizontal Tabs */}
      <div id="resources-category-scroller" className="flex overflow-x-auto pb-2 gap-2.5 scrollbar-none touch-pan-x select-none">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-black transition-all shrink-0 cursor-pointer select-none ${
                isActive
                  ? 'text-white border-indigo-600 shadow-md'
                  : 'bg-white border-slate-205 text-slate-500 hover:text-slate-800 hover:border-slate-350'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' } : {}}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-650'}`} />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Resources Card Grid with 3D effects */}
      <motion.div 
        id="resources-grid"
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={resource.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-3d-flat card-persp card-persp-hover select-none relative group"
            >
              <div className="space-y-4">
                {/* Category tag label & Delete Support */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 pr-4">
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest block font-extrabold uppercase mb-1">
                      {resource.category}
                    </span>
                    <h3 className="text-base font-black text-slate-800 truncate" title={resource.name}>
                      {resource.name}
                    </h3>
                    {resource.createdAt && (
                      <div className="text-[10px] text-slate-400 font-mono font-bold tracking-wider mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 inline" />
                        {new Date(resource.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Delete Icon if user added or in preview */}
                    {resource.isUserAdded && (
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-1 px-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Resource"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className={`p-3 rounded-2xl border shrink-0 shadow-3xs ${getCategoryIconColor(resource.category)}`}>
                      {getCategoryIcon(resource.category)}
                    </div>
                  </div>
                </div>

                {/* Card Description */}
                <p className="text-xs text-slate-500 font-bold leading-relaxed min-h-[60px]">
                  {resource.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100 font-medium">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-indigo-600 hover:border-slate-300 font-black text-xs transition duration-200 cursor-pointer shadow-3xs"
                >
                  <span>{t.openLink}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Add Resource Modal dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-xl text-slate-705 z-10"
            >
              {/* Close Button button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                <Sparkles className="h-6 w-6 text-indigo-600 animate-spin" />
                <h3 className="text-lg font-black text-slate-800">{t.modalTitle}</h3>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold mb-4">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleAddResourceSubmit} className="space-y-4">
                {/* Resource Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{t.resourceName} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Supabase DB, OpenAI Engine"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-205 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-505 hover:border-slate-300 transition font-semibold"
                  />
                </div>

                {/* Resource description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{t.resourceDesc} *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed overview of this developer resource..."
                    rows={3}
                    className="w-full text-slate-850 bg-slate-50 border border-slate-205 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-555 hover:border-slate-300 transition font-semibold"
                  />
                </div>

                {/* Resource Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{t.resourceCategory} *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-indigo-555 transition font-bold cursor-pointer"
                  >
                    <option value="database">{t.categories.databases}</option>
                    <option value="social">{t.categories.social}</option>
                    <option value="ai">{t.categories.ai}</option>
                  </select>
                </div>

                {/* Resource link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 block">{t.resourceUrl} *</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://exampledb.com"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm placeholder:text-slate-400 focus:border-indigo-505 hover:border-slate-300 transition font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
