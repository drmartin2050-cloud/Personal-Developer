import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Share2, Bot, Library, Globe, ExternalLink, Plus, X } from 'lucide-react';
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
        const parsed = JSON.parse(cached);
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

  const getCategoryIconColor = (category: string) => {
    switch (category) {
      case 'database': return 'text-purple-450 bg-purple-950/30 border-purple-900/20';
      case 'social': return 'text-sky-455 bg-sky-950/30 border-sky-900/20';
      case 'ai': return 'text-amber-450 bg-amber-950/30 border-amber-900/20';
      default: return 'text-zinc-400 bg-zinc-950/40 border-zinc-800/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="h-5 w-5" />;
      case 'social': return <Share2 className="h-5 w-5" />;
      case 'ai': return <Bot className="h-5 w-5" />;
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

  return (
    <motion.div
      id="resources-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Title & Subtitle + Add Resource Trigger Button */}
      <div id="resources-title-section" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl flex items-center gap-2">
            <Library className="h-7 w-7 text-emerald-500" />
            <span>{t.title}</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-md shadow-emerald-950/40 border border-emerald-500/20 cursor-pointer transition"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>{t.addBtn}</span>
        </button>
      </div>

      {/* Categories Horizontal Tabs */}
      <div id="resources-category-scroller" className="flex overflow-x-auto pb-2 gap-2 scrollbar-none touch-pan-x">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/10'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Resources Card Grid */}
      <motion.div 
        id="resources-grid"
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              key={resource.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm hover:border-zinc-700/60 transition group hover:shadow-lg hover:shadow-zinc-950/20 animate-fade-in"
            >
              <div className="space-y-4">
                {/* Card Header Category pill & Name */}
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white transition-colors truncate max-w-[170px]">
                    {resource.name}
                  </h3>
                  <div className={`p-2 rounded-lg border shrink-0 ${getCategoryIconColor(resource.category)}`}>
                    {getCategoryIcon(resource.category)}
                  </div>
                </div>

                {/* Card Description */}
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[64px]">
                  {resource.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-zinc-800/60 font-medium">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 font-semibold text-xs transition duration-200 group-hover:bg-zinc-900 cursor-pointer"
                >
                  <span>{t.openLink}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
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
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-300 z-10"
            >
              {/* Close Button button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-350"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-zinc-800 pb-3">
                <Library className="h-6 w-6 text-emerald-500" />
                <h3 className="text-lg font-bold text-zinc-100">{t.modalTitle}</h3>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs bg-red-950/40 border border-red-800/40 text-red-400 rounded-lg font-semibold mb-4">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleAddResourceSubmit} className="space-y-4">
                {/* Resource Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.resourceName} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Supabase DB, OpenAI Engine"
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                  />
                </div>

                {/* Resource description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.resourceDesc} *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed overview of this developer resource..."
                    rows={3}
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition"
                  />
                </div>

                {/* Resource Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.resourceCategory} *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm focus:border-emerald-500 transition"
                  >
                    <option value="database">{t.categories.databases}</option>
                    <option value="social">{t.categories.social}</option>
                    <option value="ai">{t.categories.ai}</option>
                  </select>
                </div>

                {/* Resource link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.resourceUrl} *</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://exampledb.com"
                    className="w-full text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-sm placeholder:text-zinc-650 focus:border-emerald-500 hover:border-zinc-700 transition font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
