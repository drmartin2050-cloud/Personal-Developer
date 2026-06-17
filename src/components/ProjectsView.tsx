import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderGit2, Trash2, Plus, ExternalLink, X, ShieldAlert, FileCode, Search, Sparkles,
  Github, RefreshCw, GitBranch, Terminal, ShieldCheck, Check, Code2, AlertCircle, Bookmark, Eye, EyeOff, LayoutGrid, Cpu, Layers, Clipboard, Info,
  Mail, Link, Settings, Copy, Code, CheckCircle2, ChevronRight
} from 'lucide-react';
import { LocalizationSchema, Project } from '../types';
import { safeReadFromClipboard, safeCopyToClipboard } from '../utils/clipboard';

interface ProjectsViewProps {
  key?: string;
  t: LocalizationSchema['projects'];
  projects: Project[];
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onDeleteProject: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  lang?: 'ar' | 'en';
}

export default function ProjectsView({
  t,
  projects,
  onAddProject,
  onDeleteProject,
  isAddModalOpen,
  setIsAddModalOpen,
  lang = 'ar',
}: ProjectsViewProps) {
  // Form State
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Lovable');
  const [customPlatform, setCustomPlatform] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [errorMess, setErrorMess] = useState('');

  // GitHub Integration State
  const [gitHubToken, setGitHubToken] = useState(() => localStorage.getItem('git_hub_projects_pat') || '');
  const [isGitHubConnected, setIsGitHubConnected] = useState(() => !!localStorage.getItem('git_hub_projects_pat'));
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [gitHubUser, setGitHubUser] = useState<any>(null);
  const [gitHubRepos, setGitHubRepos] = useState<any[]>([]);
  const [usingSandbox, setUsingSandbox] = useState(false);
  const [gitHubError, setGitHubError] = useState('');
  const [githubSearch, setGithubSearch] = useState('');
  const [isGitHubPanelExpanded, setIsGitHubPanelExpanded] = useState(true);
  const [showToken, setShowToken] = useState(false);
  
  // Tracking syncing status of individual repos
  const [syncingRepos, setSyncingRepos] = useState<Record<string, boolean>>({});
  // List of synced repo URLs in this session
  const [syncedRepoUrls, setSyncedRepoUrls] = useState<string[]>([]);

  // Hugging Face Integration State
  const [hfToken, setHfToken] = useState(() => localStorage.getItem('hf_projects_token') || '');
  const [isHfConnected, setIsHfConnected] = useState(() => !!localStorage.getItem('hf_projects_token'));
  const [isHfLoading, setIsHfLoading] = useState(false);
  const [hfUser, setHfUser] = useState<any>(null);
  const [hfSpaces, setHfSpaces] = useState<any[]>([]);
  const [usingHfSandbox, setUsingHfSandbox] = useState(false);
  const [hfError, setHfError] = useState('');
  const [hfSearch, setHfSearch] = useState('');
  const [showHfToken, setShowHfToken] = useState(false);
  const [syncingSpaces, setSyncingSpaces] = useState<Record<string, boolean>>({});
  const [syncedSpaceUrls, setSyncedSpaceUrls] = useState<string[]>([]);

  // Email Profile Linking & Custom Docker templates for Hugging Face Spaces
  const [linkedHfEmail, setLinkedHfEmail] = useState(() => localStorage.getItem('hf_projects_linked_email') || 'drmartin2050@gmail.com');
  const [selectedDockerTemplate, setSelectedDockerTemplate] = useState<'gradio' | 'streamlit' | 'pytorch' | 'node' | 'fastapi'>('gradio');
  const [containerDockerPort, setContainerDockerPort] = useState('7860');
  const [dockerEnvVars, setDockerEnvVars] = useState<string>('MODEL_ID=stabilityai/stable-diffusion-3\nUSE_GPU=true');
  const [copiedDockerFile, setCopiedDockerFile] = useState(false);
  const [copiedDockerReadme, setCopiedDockerReadme] = useState(false);

  // Load registered emails list from localStorage (matching EmailsView.tsx)
  const getRegisteredEmailsAndAliases = () => {
    const saved = localStorage.getItem('dev_hub_emails_aliases');
    const emailsList: { address: string; type: 'main' | 'alias'; platform?: string }[] = [];
    
    // Fallback seed accounts
    emailsList.push({ address: 'drmartin2050@gmail.com', type: 'main' });
    emailsList.push({ address: 'drmartin.bolt@gmail.com', type: 'alias', platform: 'Bolt.new' });
    emailsList.push({ address: 'drmartin.lovable@gmail.com', type: 'alias', platform: 'Lovable' });
    emailsList.push({ address: 'drmartin.supabase@gmail.com', type: 'alias', platform: 'Supabase' });
    emailsList.push({ address: 'eissa.developer@outlook.com', type: 'main' });
    emailsList.push({ address: 'eissa.v0@outlook.com', type: 'alias', platform: 'v0.dev' });
    emailsList.push({ address: 'eissa.replit@outlook.com', type: 'alias', platform: 'Replit' });

    if (saved) {
      try {
        const accounts = JSON.parse(saved);
        if (Array.isArray(accounts)) {
          accounts.forEach((acc: any) => {
            if (acc?.address && !emailsList.some(e => e.address.toLowerCase() === acc.address.toLowerCase())) {
              emailsList.push({ address: acc.address, type: 'main' });
            }
            if (Array.isArray(acc?.aliases)) {
              acc.aliases.forEach((alias: any) => {
                if (alias?.aliasAddress && !emailsList.some(e => e.address.toLowerCase() === alias.aliasAddress.toLowerCase())) {
                  emailsList.push({
                    address: alias.aliasAddress,
                    type: 'alias',
                    platform: alias.platform
                  });
                }
              });
            }
          });
        }
      } catch (e) {
        console.warn("Error parsing EmailsView localStorage state inside ProjectsView", e);
      }
    }
    return emailsList;
  };

  const getDockerTemplates = (
    template: 'gradio' | 'streamlit' | 'pytorch' | 'node' | 'fastapi',
    port: string,
    envVars: string
  ): { dockerfile: string; readme: string } => {
    const activePort = port || '7860';
    
    // Parse environment variables to ENV commands
    const envLines = envVars
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .map(line => {
        if (line.toUpperCase().startsWith('ENV ')) {
          return line;
        }
        return `ENV ${line}`;
      })
      .join('\n');

    const envStatement = envLines ? `\n# Custom Container Environment Secrets\n${envLines}\n` : '';

    let dockerfile = '';
    let readme = '';

    switch (template) {
      case 'gradio':
        dockerfile = `# Use Python base runtime optimal for Gradio
FROM python:3.10-slim

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . .
${envStatement}
# Run with active port mapping
EXPOSE ${activePort}
CMD ["python", "app.py", "--port", "${activePort}"]`;
        
        readme = `---
title: Custom Gradio Space
emoji: 🚀
colorFrom: indigo
colorTo: purple
sdk: gradio
sdk_version: 4.19.2
app_port: ${activePort}
pinned: false
license: mit
---

# Gradio ML Model Space
Synchronized via the AI Studio Development Hub.
This Space hosts an interactive app powered by Python Gradio.`;
        break;

      case 'streamlit':
        dockerfile = `# Use official lightweight Python runtime
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
${envStatement}
# Streamlit required port EXPOSE
EXPOSE ${activePort}

CMD ["streamlit", "run", "app.py", "--server.port=${activePort}", "--server.address=0.0.0.0"]`;

        readme = `---
title: Custom Streamlit Space
emoji: 📊
colorFrom: blue
colorTo: green
sdk: streamlit
app_port: ${activePort}
pinned: false
license: apache-2.0
---

# Streamlit Data App Space
Synchronized via the AI Studio Development Hub.
Created to visualize datasets and model inferences seamlessly.`;
        break;

      case 'pytorch':
        dockerfile = `# Torch CUDA-enabled machine learning container
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

WORKDIR /workspace

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
${envStatement}
EXPOSE ${activePort}
ENV PORT=${activePort}

CMD ["python", "main.py"]`;

        readme = `---
title: PyTorch CUDA Container
emoji: 🔥
colorFrom: red
colorTo: orange
sdk: docker
app_port: ${activePort}
pinned: false
license: gpl-3.0
---

# Advanced CUDA PyTorch Space
A high-performance machine learning Docker container for deep neural networks.`;
        break;

      case 'node':
        dockerfile = `# Lightweight Alpine production container for full-stack SPA and servers
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
${envStatement}
EXPOSE ${activePort}
ENV PORT=${activePort}

CMD ["node", "server.js"]`;

        readme = `---
title: Node.js Express Backend
emoji: ⚡
colorFrom: green
colorTo: gray
sdk: docker
app_port: ${activePort}
pinned: false
license: mit
---

# Fullstack Javascript Container Space
Running an Express.js backend or Static SPA optimized for server-side operations.`;
        break;

      case 'fastapi':
        dockerfile = `# Python slim FastAPI container
FROM python:3.10-slim

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . .
${envStatement}
EXPOSE ${activePort}

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${activePort}"]`;

        readme = `---
title: FastAPI ML Endpoint
emoji: 🦄
colorFrom: teal
colorTo: cyan
sdk: docker
app_port: ${activePort}
pinned: false
license: mit
---

# High-Performance FastAPI Space
Hosts highly performant REST APIs and model inference endpoints.`;
        break;
      
      default:
        dockerfile = `# Generic Docker template
FROM alpine:latest
RUN apk add --no-cache curl
EXPOSE ${activePort}
CMD ["echo", "Custom Hugging Face Space Active"]`;
        readme = `---
title: Custom Docker Space
emoji: 🐳
sdk: docker
app_port: ${activePort}
---`;
    }

    return { dockerfile, readme };
  };
  
  // Active integration tab ("github" | "huggingface")
  const [activeSyncTab, setActiveSyncTab] = useState<'github' | 'huggingface'>('github');

  const [gitHubPasteStatus, setGitHubPasteStatus] = useState<'idle' | 'success' | 'blocked'>('idle');
  const [hfPasteStatus, setHfPasteStatus] = useState<'idle' | 'success' | 'blocked'>('idle');

  const handlePasteGitHubToken = async () => {
    setGitHubPasteStatus('idle');
    const text = await safeReadFromClipboard();
    if (text) {
      setGitHubToken(text);
      setGitHubPasteStatus('success');
      setTimeout(() => setGitHubPasteStatus('idle'), 3000);
    } else {
      setGitHubPasteStatus('blocked');
      setTimeout(() => setGitHubPasteStatus('idle'), 6000);
    }
  };

  const handlePasteHfToken = async () => {
    setHfPasteStatus('idle');
    const text = await safeReadFromClipboard();
    if (text) {
      setHfToken(text);
      setHfPasteStatus('success');
      setTimeout(() => setHfPasteStatus('idle'), 3000);
    } else {
      setHfPasteStatus('blocked');
      setTimeout(() => setHfPasteStatus('idle'), 6000);
    }
  };

  // Auto load GitHub and Hugging Face if tokens exist on mount
  useEffect(() => {
    if (gitHubToken && isGitHubConnected) {
      handleLoadGitHub(gitHubToken, false);
    }
    if (hfToken && isHfConnected) {
      handleLoadHuggingFace(hfToken, false);
    }
  }, []);

  const handleLoadHuggingFace = async (token: string, isManualSetup = false) => {
    if (!token.trim()) return;
    setIsHfLoading(true);
    setHfError('');
    try {
      // Clean and sanitize the input token (removing accidentally pasted quotes, brackets, or "Bearer" prefix)
      let sanitizedToken = token.trim();
      sanitizedToken = sanitizedToken.replace(/['"\[\]]/g, '').trim();
      
      const hfMatch = sanitizedToken.match(/(hf_[a-zA-Z0-9_-]+)/);
      if (hfMatch) {
        sanitizedToken = hfMatch[1];
      }

      // 1. Syntax Warning check (non-blocking to allow custom token designs/OAuth tokens)
      if (!sanitizedToken.startsWith('hf_')) {
        console.warn('Hugging Face access token warning: Token does not start with standard hf_ prefix. Attempting link anyway.');
      }

      // 2. State resets
      setHfUser(null);
      setHfSpaces([]);

      // 3. API direct query
      let whoamiData: any = null;

      try {
        // Use our secure backend proxy to bypass CORS
        const userRes = await fetch('/api/hf/whoami', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: sanitizedToken })
        });

        if (userRes.status === 401 || userRes.status === 403) {
          throw new Error(
            lang === 'ar'
              ? 'تأكد من أن الرمز (Token) صالح ويحتوي على صلاحية (Read & Write) ضمن إعدادات Fine-grained Access Tokens. (خطأ 401/403)'
              : 'Ensure your Token is valid and has "Read & Write" permissions configured under Fine-grained Access Tokens. (Error 401/403)'
          );
        }

        if (!userRes.ok) {
          throw new Error(
            lang === 'ar'
              ? `استجابة غير صالحة من خادم Hugging Face. رمز الاستجابة: ${userRes.status}`
              : `Invalid response from Hugging Face server. Status code: ${userRes.status}`
          );
        }

        whoamiData = await userRes.json();
      } catch (fErr: any) {
        // If it's a known HTTP error we threw, forward it.
        if (fErr.message && (fErr.message.includes('401') || fErr.message.includes('403') || fErr.message.includes('استجابة غير صالحة'))) {
          throw fErr;
        }
        console.error('Hugging Face API backend proxy error:', fErr);
        throw new Error(
          lang === 'ar'
            ? 'يتعذر الاتصال بالخادم الوسيط (Backend) لدينا. قد تكون هناك مشكلة في إعداد Express Server.'
            : 'Could not connect to the Backend Proxy. There might be an issue with the Express Server setup.'
        );
      }

      // 4. Successful real API login
      if (whoamiData) {
        const parsedUser = {
          name: whoamiData.name || 'hf_user',
          fullname: whoamiData.fullname || whoamiData.name || (lang === 'ar' ? 'مطور هانجينج فيس' : 'Hugging Face Space Builder'),
          avatarUrl: whoamiData.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop',
          email: whoamiData.email || 'authenticated@huggingface.co',
        };

        // Pull real user spaces via proxy
        let spacesList: any[] = [];
        try {
          const spacesRes = await fetch('/api/hf/spaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: sanitizedToken, author: parsedUser.name })
          });
          if (spacesRes.ok) {
            const rawSpaces = await spacesRes.json();
            if (Array.isArray(rawSpaces)) {
              spacesList = rawSpaces.map((s: any) => ({
                id: s.id,
                idFull: s.id,
                author: s.author || s.id.split('/')[0],
                name: s.id.split('/')[1] || s.id,
                sdk: s.sdk || 'gradio',
                likes: s.likes || 0,
                private: !!s.private,
                updatedAt: s.lastModified || new Date().toISOString()
              }));
            }
          }
        } catch (e) {
          console.warn('Failed compiling user spaces list via backend proxy', e);
        }

        setHfUser(parsedUser);
        setHfSpaces(spacesList);
        setIsHfConnected(true);
        setUsingHfSandbox(false);
        localStorage.setItem('hf_projects_token', sanitizedToken);
      }
    } catch (err: any) {
      setHfError(err.message || String(err));
      setIsHfConnected(false);
      localStorage.removeItem('hf_projects_token');
    } finally {
      setIsHfLoading(false);
    }
  };

  const handleSyncHfSpace = (space: any) => {
    const spaceId = space.id;
    setSyncingSpaces(prev => ({ ...prev, [spaceId]: true }));

    setTimeout(() => {
      onAddProject({
        projectName: space.name,
        platformUsed: `Hugging Face Space (${space.sdk || 'Gradio'})`,
        associatedEmail: linkedHfEmail,
        projectUrl: `https://huggingface.co/spaces/${space.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSyncingSpaces(prev => ({ ...prev, [spaceId]: false }));
      setSyncedSpaceUrls(prev => [...prev, `https://huggingface.co/spaces/${space.id}`]);
    }, 1000);
  };

  const handleDisconnectHf = () => {
    localStorage.removeItem('hf_projects_token');
    setHfToken('');
    setIsHfConnected(false);
    setHfUser(null);
    setHfSpaces([]);
    setUsingHfSandbox(false);
    setHfError('');
  };

  const handleLoadGitHub = async (token: string, isManualSetup = false) => {
    if (!token.trim()) return;
    setIsGitHubLoading(true);
    setGitHubError('');
    try {
      // 1. Fetch user data
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        }
      });
      if (!userRes.ok) throw new Error(lang === 'ar' ? 'الرمز التعريفي غير صالح أو منتهي الصلاحية.' : 'Invalid or expired GitHub access token.');
      
      const userData = await userRes.json();
      setGitHubUser(userData);

      // 2. Fetch user repositories
      const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        }
      });
      if (!reposRes.ok) throw new Error(lang === 'ar' ? 'فشل جلب قائمة مستودعات الأكواد.' : 'Failed to retrieve repositories list.');
      
      const reposData = await reposRes.json();
      setGitHubRepos(Array.isArray(reposData) ? reposData : []);
      setIsGitHubConnected(true);
      setUsingSandbox(false);
      localStorage.setItem('git_hub_projects_pat', token.trim());
    } catch (err: any) {
      setGitHubError(err.message || String(err));
      if (isManualSetup) {
        setIsGitHubConnected(false);
        localStorage.removeItem('git_hub_projects_pat');
      }
    } finally {
      setIsGitHubLoading(false);
    }
  };

  const handleSyncRepository = (repo: any) => {
    const repoId = String(repo.id);
    setSyncingRepos(prev => ({ ...prev, [repoId]: true }));

    setTimeout(() => {
      onAddProject({
        projectName: repo.name,
        platformUsed: repo.language || 'GitHub Repo',
        associatedEmail: 'drmartin2050@gmail.com',
        projectUrl: repo.html_url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSyncingRepos(prev => ({ ...prev, [repoId]: false }));
      setSyncedRepoUrls(prev => [...prev, repo.html_url]);
    }, 1000);
  };

  const handleDisconnectGitHub = () => {
    localStorage.removeItem('git_hub_projects_pat');
    setGitHubToken('');
    setIsGitHubConnected(false);
    setGitHubUser(null);
    setGitHubRepos([]);
    setUsingSandbox(false);
    setGitHubError('');
  };

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

      {/* GitHub/Hugging Face double account link and repositories sync center */}
      <div id="github-sync-center-card" className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 shadow-xl space-y-5 select-none relative overflow-hidden">
        {/* Decorative subtle background design */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 relative z-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl text-indigo-400 shrink-0">
              {activeSyncTab === 'github' ? (
                <Github className="h-6 w-6 text-indigo-400" />
              ) : (
                <span className="text-2xl leading-none">🤗</span>
              )}
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>
                  {activeSyncTab === 'github' 
                    ? (lang === 'ar' ? 'مركز مزامنة مستودعات GitHub الذكي' : 'GitHub Repository Sync Center')
                    : (lang === 'ar' ? 'مركز مزامنة مساحات Hugging Face' : 'Hugging Face AI Spaces Sync')}
                </span>
                <span className="hidden sm:inline bg-indigo-500/25 text-indigo-300 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-indigo-400/20">
                  {lang === 'ar' ? 'التزامن الحي' : 'LIVE API SYNC'}
                </span>
              </h2>
              <p className="text-[10.5px] text-slate-450 font-bold font-mono">
                {lang === 'ar' 
                  ? 'اربط حساباتك السحابية بمفاتيح الوصول لاستيراد وتثبيت ومزامنة خدماتك بضغطة واحدة.' 
                  : 'Link your cloud accounts with Personal Access Tokens to retrieve and register projects.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGitHubPanelExpanded(!isGitHubPanelExpanded)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition cursor-pointer self-end sm:self-center"
          >
            {isGitHubPanelExpanded ? (
              <EyeOff className="h-4.5 w-4.5" />
            ) : (
              <Eye className="h-4.5 w-4.5" />
            )}
          </button>
        </div>

        {/* Integration Tab Switches */}
        {isGitHubPanelExpanded && (
          <div id="sync-tabs" className="flex items-center gap-2 border-b border-white/10 pb-3 z-10 relative">
            <button
              onClick={() => setActiveSyncTab('github')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 border ${
                activeSyncTab === 'github'
                  ? 'bg-indigo-600 border-indigo-505 text-white shadow-md'
                  : 'bg-white/5 border-white/5 text-slate-350 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Github className="h-4 w-4" />
              <span>{lang === 'ar' ? 'مستودعات GitHub' : 'GitHub Repositories'}</span>
            </button>

            <button
              onClick={() => setActiveSyncTab('huggingface')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 border ${
                activeSyncTab === 'huggingface'
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/5 border-white/5 text-slate-350 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-sm">🤗</span>
              <span>{lang === 'ar' ? 'مساحات Hugging Face' : 'Hugging Face Spaces'}</span>
            </button>
          </div>
        )}

        <AnimatePresence>
          {isGitHubPanelExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 relative z-10 overflow-hidden"
            >
              {/* Active Tab is GitHub */}
              {activeSyncTab === 'github' && (
                <>
                  {!isGitHubConnected ? (
                    // Setup / Link flow
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch animate-fadeIn">
                      <div className="md:col-span-12 lg:col-span-7 space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-350 tracking-wider uppercase block">
                            {lang === 'ar' ? 'مفتاح وصول GitHub (Token) *' : 'GitHub Personal Access Token (PAT) *'}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showToken ? 'text' : 'password'}
                              value={gitHubToken}
                              onChange={(e) => setGitHubToken(e.target.value)}
                              placeholder={
                                lang === 'ar' 
                                  ? 'أدخل مفتاح ghp_... أو قم بتجربة المحاكي مباشرة' 
                                  : 'Paste ghp_... token or launch the offline simulator'
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-11 pr-24 text-sm outline-none placeholder:text-slate-500 text-white font-mono font-semibold focus:border-indigo-400 hover:border-white/20 transition-all"
                            />
                            <div className="absolute right-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handlePasteGitHubToken}
                                className="p-1 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-400/20 text-indigo-300 hover:text-white text-xs font-extrabold font-mono transition cursor-pointer flex items-center gap-1"
                                title={lang === 'ar' ? 'لصق المفتاح من الحافظة' : 'Paste from clipboard'}
                              >
                                <Clipboard className="h-3 w-3" />
                                <span>{lang === 'ar' ? 'لصق' : 'Paste'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                              >
                                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          {gitHubPasteStatus === 'success' && (
                            <p className="text-[11px] text-emerald-400 font-bold font-mono mt-1.5 flex items-center gap-1 animate-pulse">
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>{lang === 'ar' ? 'تم لصق المفتاح تلقائياً من الحافظة بنجاح!' : 'Successfully pasted key from clipboard!'}</span>
                            </p>
                          )}
                          {gitHubPasteStatus === 'blocked' && (
                            <div className="mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                              <p className="text-xs text-amber-300 font-black flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4 text-amber-300 shrink-0" />
                                <span>{lang === 'ar' ? 'تم حظر القراءة التلقائية للمتصفح!' : 'Direct browser reading is restricted!'}</span>
                              </p>
                              <p className="text-[11px] text-slate-350 leading-relaxed font-bold font-mono">
                                {lang === 'ar' 
                                  ? 'بسبب قيود أمان متصفحك داخل إطارات العرض (iFrame)، لا يمكن قراءة حافظتك بنقرة زر واحدة. يرجى المتابعة يدوياً: انقر داخل مربع النص واضغط على (Ctrl+V) أو (Cmd+V) في لوحة مفاتيحك للصق الرمز مباشرة.' 
                                  : 'Due to secure sandboxing restrictions of your browser inside previews, clipboard read failed. Please paste manually: click on the text input and press (Ctrl+V) or (Cmd+V) on your keyboard.'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleLoadGitHub(gitHubToken, true)}
                            disabled={isGitHubLoading}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition border border-indigo-600"
                          >
                            {isGitHubLoading ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            <span>{lang === 'ar' ? 'ربط الحساب عبر الـ API' : 'Authenticate & Link'}</span>
                          </button>
                        </div>

                        {gitHubError && (
                          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2 animate-bounce">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
                            <span>{gitHubError}</span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-12 lg:col-span-5 bg-white/5 border border-white/10 rounded-2.5xl p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5 text-xs">
                          <h4 className="font-black text-indigo-300 flex items-center gap-1.5 font-mono">
                            <Code2 className="h-4 w-4" />
                            <span>{lang === 'ar' ? 'كيفية إصدار الرمز التعريفي؟' : 'How does this integration work?'}</span>
                          </h4>
                          <p className="text-slate-400 leading-relaxed font-bold font-mono">
                            {lang === 'ar' 
                              ? 'يمكنك توليد PAT بالذهاب لـ Settings > Developer settings > Personal access tokens مع تفعيل صلاحيات repo.' 
                              : 'You can generate a classic Personal Access Token with "repo" read scopes via Settings > Developer Settings on your GitHub account.'}
                          </p>
                        </div>
                        <a
                          href="https://github.com/settings/tokens"
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-black text-sky-400 hover:text-sky-300 border-t border-white/5 pt-3 font-mono"
                        >
                          <span>{lang === 'ar' ? 'اصنع المفتاح الآن على GitHub ↗' : 'Generate PAT Token on GitHub ↗'}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    // Linked Account Dashboard view
                    <div className="space-y-5 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 border border-white/10 rounded-2.5xl gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={gitHubUser?.avatar_url}
                            alt="GitHub Avatar"
                            referrerPolicy="no-referrer"
                            className="h-12 w-12 rounded-xl border border-white/15 bg-slate-800 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-white text-sm sm:text-base">
                                {gitHubUser?.name || gitHubUser?.login}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide
                                ${usingSandbox 
                                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' 
                                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                }
                              `}>
                                {usingSandbox ? (lang === 'ar' ? 'وضع المحاكاة' : 'SANDBOX SIM') : (lang === 'ar' ? 'حساب متصل' : 'AUTH ONLINE')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono font-bold">
                              @{gitHubUser?.login} • {gitHubUser?.public_repos || gitHubRepos.length} {lang === 'ar' ? 'مستودع كود' : 'Repositories available'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0 select-none">
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                            <Search className="h-4 w-4 text-slate-400 mr-2" />
                            <input
                              type="text"
                              value={githubSearch}
                              onChange={(e) => setGithubSearch(e.target.value)}
                              placeholder={lang === 'ar' ? 'ابحث في مستودعاتك...' : 'Search repositories...'}
                              className="bg-transparent text-xs text-white outline-none w-28 sm:w-40 placeholder:text-slate-500 font-bold"
                            />
                          </div>

                          <button
                            onClick={handleDisconnectGitHub}
                            className="px-3.5 py-1.5 hover:bg-rose-500/10 text-rose-400 text-xs font-black rounded-xl border border-rose-500/25 transition cursor-pointer"
                          >
                            {lang === 'ar' ? 'قطع الاتصال' : 'Disconnect'}
                          </button>
                        </div>
                      </div>

                      {/* List of active repositories ready to sync */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gitHubRepos
                          .filter(r => r.name.toLowerCase().includes(githubSearch.toLowerCase()))
                          .map((repo) => {
                            const isSyncing = !!syncingRepos[repo.id];
                            // Synced means already added. Let's check matching projectURL or synced state
                            const isSynced = syncedRepoUrls.includes(repo.html_url) || 
                              projects.some(p => p.projectUrl && p.projectUrl.replace(/^https?:\/\//, '') === repo.html_url.replace(/^https?:\/\//, ''));

                            return (
                              <div 
                                key={repo.id} 
                                className="bg-white/5 border border-white/10 rounded-2.5xl p-4.5 space-y-3.5 hover:border-indigo-400/50 hover:bg-white/[0.07] transition-all flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-extrabold text-sm text-indigo-300 truncate max-w-[180px]">
                                      {repo.name}
                                    </h5>
                                    {repo.language && (
                                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                                        <Code2 className="h-2.5 w-2.5 text-indigo-455" />
                                        <span>{repo.language}</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed font-bold font-mono line-clamp-2">
                                    {repo.description || (lang === 'ar' ? 'مستودع كود بدون وصف إيضاحي متاح.' : 'No descriptive overview recorded yet.')}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-auto">
                                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-black font-mono">
                                    <span>★ {repo.stargazers_count ?? 0}</span>
                                    <span>⑂ {repo.forks_count ?? 0}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <a
                                      href={repo.html_url}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="p-1 px-2.5 hover:bg-white/10 text-slate-350 hover:text-white rounded-xl transition cursor-pointer text-[11px] flex items-center gap-1 border border-white/10 font-mono font-bold"
                                    >
                                      <span>{lang === 'ar' ? 'معاينة' : 'View'}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>

                                    {isSynced ? (
                                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                                        <Check className="h-3.5 w-3.5" />
                                        <span>{lang === 'ar' ? 'تمت المزامنة' : 'Synced'}</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleSyncRepository(repo)}
                                        disabled={isSyncing}
                                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 border border-indigo-600 transition"
                                      >
                                        {isSyncing ? (
                                          <>
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            <span>{lang === 'ar' ? 'مزامنة...' : 'Syncing...'}</span>
                                          </>
                                        ) : (
                                          <>
                                            <Bookmark className="h-3.5 w-3.5" />
                                            <span>{lang === 'ar' ? 'مزامنة' : 'Sync Project'}</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Active Tab is Hugging Face */}
              {activeSyncTab === 'huggingface' && (
                <div className="space-y-6">
                  {!isHfConnected ? (
                    // Hugging Face Link setup flow
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch animate-fadeIn">
                      <div className="md:col-span-12 lg:col-span-7 space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-355 tracking-wider uppercase block">
                            {lang === 'ar' ? 'رمز وصول Hugging Face (Token) *' : 'Hugging Face Access Token (HF PAT) *'}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showHfToken ? 'text' : 'password'}
                              value={hfToken}
                              onChange={(e) => setHfToken(e.target.value)}
                              placeholder={
                                lang === 'ar' 
                                  ? 'أدخل مفتاح hf_... أو قم بتجربة محاكي المنصة مباشرة' 
                                  : 'Paste hf_... token or launch the offline simulator'
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-11 pr-24 text-sm outline-none placeholder:text-slate-500 text-white font-mono font-semibold focus:border-amber-400 hover:border-white/20 transition-all"
                            />
                            <div className="absolute right-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handlePasteHfToken}
                                className="p-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/30 border border-amber-400/20 text-amber-300 hover:text-white text-xs font-extrabold font-mono transition cursor-pointer flex items-center gap-1"
                                title={lang === 'ar' ? 'لصق الرمز من الحافظة' : 'Paste from clipboard'}
                              >
                                <Clipboard className="h-3 w-3" />
                                <span>{lang === 'ar' ? 'لصق' : 'Paste'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowHfToken(!showHfToken)}
                                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                              >
                                {showHfToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          {hfPasteStatus === 'success' && (
                            <p className="text-[11px] text-amber-400 font-bold font-mono mt-1.5 flex items-center gap-1 animate-pulse">
                              <Check className="h-3.5 w-3.5 text-amber-450" />
                              <span>{lang === 'ar' ? 'تم لصق رمز Hugging Face تلقائياً بنجاح!' : 'Successfully pasted HF token from clipboard!'}</span>
                            </p>
                          )}
                          {hfPasteStatus === 'blocked' && (
                            <div className="mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                              <p className="text-xs text-amber-355 font-black flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4 text-amber-300 shrink-0" />
                                <span>{lang === 'ar' ? 'تم حظر القراءة التلقائية للمتصفح!' : 'Direct browser reading is restricted!'}</span>
                              </p>
                              <p className="text-[11px] text-slate-355 leading-relaxed font-bold font-mono">
                                {lang === 'ar' 
                                  ? 'بسبب قيود أمان متصفحك داخل إطارات العرض (iFrame)، لا يمكن قراءة حافظتك بنقرة زر واحدة. يرجى المتابعة يدوياً: انقر داخل مربع النص واضغط على (Ctrl+V) أو (Cmd+V) في لوحة مفاتيحك للصق الرمز مباشرة.' 
                                  : 'Due to secure sandboxing restrictions of your browser inside previews, clipboard read failed. Please paste manually: click on the text input and press (Ctrl+V) or (Cmd+V) on your keyboard.'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 🌟 Hugging Face Token Diagnostic & Security Audit Panel */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5">
                          <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <ShieldCheck className="h-4 w-4 text-amber-300 font-mono" />
                            <span>{lang === 'ar' ? 'مساعد تشخيص وفحص صلاحية رمز هانجينغ فيس' : 'Hugging Face Token Audit Assistant'}</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                            {/* Prefix Indicator */}
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                              <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'تبدأ بـ hf_ :' : 'Starts with hf_:'}</span>
                              {hfToken.trim().startsWith('hf_') ? (
                                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5 text-emerald-400" /> {lang === 'ar' ? 'موافق' : 'YES'}
                                </span>
                              ) : (
                                <span className="text-rose-400 font-extrabold flex items-center gap-1">
                                  <X className="h-3.5 w-3.5 text-rose-400" /> {lang === 'ar' ? 'غير مطابق' : 'NO'}
                                </span>
                              )}
                            </div>

                            {/* Length Indicator */}
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                              <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'حالة الطول :' : 'Length check:'}</span>
                              {hfToken.trim().length >= 20 ? (
                                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5 text-emerald-400" /> {lang === 'ar' ? 'سليم' : 'OK'}
                                </span>
                              ) : (
                                <span className="text-rose-400 font-extrabold flex items-center gap-1">
                                  <X className="h-3.5 w-3.5 text-rose-400" /> {lang === 'ar' ? 'قصير جداً' : 'TOO SHORT'}
                                </span>
                              )}
                            </div>

                            {/* Connection Status Indicator */}
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between sm:col-span-2">
                              <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'حالة الربط الفعلي :' : 'Live connection:'}</span>
                              {isHfConnected ? (
                                <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                  <span>{usingHfSandbox ? (lang === 'ar' ? 'متصل بالمحاكي الآمن' : 'Connected via Secure Sandbox') : (lang === 'ar' ? 'متصل ومؤكد عبر السيرفر' : 'Connected & Verified via Hub')}</span>
                                </span>
                              ) : hfError ? (
                                <span className="text-rose-400 font-extrabold flex items-center gap-1.5">
                                  <X className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                  <span>{lang === 'ar' ? 'فشل التحقق الأخير' : 'Last check failed'}</span>
                                </span>
                              ) : hfToken.trim() ? (
                                <span className="text-amber-455 font-extrabold animate-pulse">
                                  {lang === 'ar' ? 'جاهز للربط الفعلي...' : 'Ready to authenticate...'}
                                </span>
                              ) : (
                                <span className="text-slate-500">
                                  {lang === 'ar' ? 'بانتظار لصق الرمز' : 'Awaiting token input'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Recommendation Banner */}
                          <div className={`p-3 rounded-xl border text-xs leading-relaxed font-bold font-mono ${
                            isHfConnected 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                              : hfError 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                                : hfToken.trim() && !hfToken.trim().startsWith('hf_') 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                          }`}>
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="block font-black underline uppercase tracking-wider text-[10px]">
                                  {lang === 'ar' ? 'التشخيص والتوافق الفني:' : 'DIAGNOSIS & TECHNICAL ALIGNMENT:'}
                                </span>
                                <span>
                                  {isHfConnected ? (
                                    lang === 'ar' 
                                      ? 'الرمز صالح وموثق تماماً! تم تشغيل المزامنة وجلب المساحات بشكل سليم، ولا يتطلب الرمز أي تغيير حالياً.' 
                                      : 'Your token is fully verified and connected. No action or renewal needed!'
                                  ) : hfError ? (
                                    lang === 'ar' 
                                      ? `المفتاح الحالي منتهي الصلاحية أو تم إيقافه: (${hfError}). يجب توليد رمز وصول ذو صلاحية Read جديد كلياً وتغييره فوراً لتمكين التزامن.` 
                                      : `Warning: Current token returned error: (${hfError}). You MUST generate a new Read access token and replace the current one.`
                                  ) : hfToken.trim() && !hfToken.trim().startsWith('hf_') ? (
                                    lang === 'ar' 
                                      ? 'تنسيق المفتاح يبدو خاطئاً! المفاتيح من Hugging Face يجب أن تبدأ دائماً بـ "hf_". يرجى نسخ الرمز بالكامل بدقة ولصقه مجدداً.' 
                                      : 'Format mismatch! The token you pasted does not follow Hugging Face conventions (must start with "hf_").'
                                  ) : (
                                    lang === 'ar' 
                                      ? 'بعد إدخال المفتاح بمدخل النصوص، اضغط على زر "ربط الحساب ومزامنة المساحات" لفحصه وتوثيقه مباسرة تزامناً مع المنصة.' 
                                      : 'Paste your token first, then click "Authenticate & Link Spaces" to verify and fetch spaces.'
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleLoadHuggingFace(hfToken, true)}
                            disabled={isHfLoading}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition border border-amber-500"
                          >
                            {isHfLoading ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            <span>{lang === 'ar' ? 'ربط الحساب ومزامنة المساحات' : 'Authenticate & Link Spaces'}</span>
                          </button>
                          
                          <button
                            onClick={() => window.open('https://huggingface.co/new', '_blank')}
                            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-black flex items-center gap-2 border border-slate-700 transition shadow-sm cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'فتح متصفح هانجينج فيس المستقل (للتحكم الكامل)' : 'Open Native HF Browser (Full Control)'}</span>
                          </button>
                        </div>

                        {hfError && (
                          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2 animate-bounce">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
                            <span>{hfError}</span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-12 lg:col-span-5 bg-white/5 border border-white/10 rounded-2.5xl p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5 text-xs">
                          <h4 className="font-black text-amber-300 flex items-center gap-1.5 font-mono">
                            <Cpu className="h-4 w-4" />
                            <span>{lang === 'ar' ? 'مزامنة مساحات الذكاء الاصطناعي' : 'Sync AI Spaces & Models'}</span>
                          </h4>
                          <p className="text-slate-400 leading-relaxed font-bold font-mono">
                            {lang === 'ar' 
                              ? 'يدعم Hugging Face مزامنة جميع مساحات الذكاء الاصطناعي (Spaces) المبنية باستخدام Gradio أو Streamlit أو Docker وتثبيتها فورياً.' 
                              : 'Retrieve and synchronize machine learning and AI spaces directly from your Hugging Face developer profile into this dashboard.'}
                          </p>
                        </div>
                        <a
                          href="https://huggingface.co/settings/tokens"
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-450 hover:text-amber-300 border-t border-white/5 pt-3 font-mono"
                        >
                          <span>{lang === 'ar' ? 'احصل على رمز الوصول من هانجينج فيس ↗' : 'Generate Token on Hugging Face ↗'}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    // Linked HF Profile Dashboard view
                    <div className="space-y-5 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 border border-white/10 rounded-2.5xl gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={hfUser?.avatarUrl}
                            alt="HuggingFace Avatar"
                            referrerPolicy="no-referrer"
                            className="h-12 w-12 rounded-xl border border-white/15 bg-slate-800 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-white text-sm sm:text-base">
                                {hfUser?.fullname || hfUser?.name}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide
                                ${usingHfSandbox 
                                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' 
                                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                }
                              `}>
                                {usingHfSandbox ? (lang === 'ar' ? 'وضع المحاكاة' : 'SANDBOX SIM') : (lang === 'ar' ? 'حساب متصل' : 'AUTH ONLINE')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono font-bold">
                              @{hfUser?.name} • {hfSpaces.length} {lang === 'ar' ? 'مساحة عمل مخصصة للذكاء' : 'AI Spaces available'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0 select-none">
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                            <Search className="h-4 w-4 text-slate-400 mr-2" />
                            <input
                              type="text"
                              value={hfSearch}
                              onChange={(e) => setHfSearch(e.target.value)}
                              placeholder={lang === 'ar' ? 'ابحث في مساحاتك...' : 'Search spaces...'}
                              className="bg-transparent text-xs text-white outline-none w-28 sm:w-40 placeholder:text-slate-500 font-bold"
                            />
                          </div>

                          <button
                            onClick={handleDisconnectHf}
                            className="px-3.5 py-1.5 hover:bg-rose-500/10 text-rose-400 text-xs font-black rounded-xl border border-rose-500/25 transition cursor-pointer"
                          >
                            {lang === 'ar' ? 'قطع الاتصال' : 'Disconnect'}
                          </button>
                        </div>
                      </div>

                      {/* List of active Spaces ready to sync */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hfSpaces
                          .filter(s => s.name.toLowerCase().includes(hfSearch.toLowerCase()))
                          .map((space) => {
                            const isSyncing = !!syncingSpaces[space.id];
                            const spaceUrl = `https://huggingface.co/spaces/${space.id}`;
                            const isSynced = syncedSpaceUrls.includes(spaceUrl) || 
                              projects.some(p => p.projectUrl && p.projectUrl.replace(/^https?:\/\//, '') === spaceUrl.replace(/^https?:\/\//, ''));

                            return (
                              <div 
                                key={space.id} 
                                className="bg-white/5 border border-white/10 rounded-2.5xl p-4.5 space-y-3.5 hover:border-amber-400/50 hover:bg-white/[0.07] transition-all flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-extrabold text-sm text-amber-300 truncate max-w-[180px]">
                                      {space.name}
                                    </h5>
                                    {space.sdk && (
                                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                        <Layers className="h-2.5 w-2.5 text-amber-400" />
                                        <span>{space.sdk}</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed font-bold font-mono line-clamp-2">
                                    {lang === 'ar' ? 'مساحة عمل مخصصة ومطورة لاستضافة وعرض نماذج وتطبيقات الذكاء الاصطناعي.' : 'Hugging Face specialized hosting environment and model demonstrator space.'}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-auto">
                                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-black font-mono">
                                    <span>♥ {space.likes ?? 0}</span>
                                    <span>{space.private ? '🔒 Private' : '🌐 Public'}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <a
                                      href={spaceUrl}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="p-1 px-2.5 hover:bg-white/10 text-slate-350 hover:text-white rounded-xl transition cursor-pointer text-[11px] flex items-center gap-1 border border-white/10 font-mono font-bold"
                                    >
                                      <span>{lang === 'ar' ? 'معاينة' : 'View'}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>

                                    {isSynced ? (
                                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                                        <Check className="h-3.5 w-3.5" />
                                        <span>{lang === 'ar' ? 'تمت المزامنة' : 'Synced'}</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleSyncHfSpace(space)}
                                        disabled={isSyncing}
                                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 border border-amber-400 transition"
                                      >
                                        {isSyncing ? (
                                          <>
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            <span>{lang === 'ar' ? 'مزامنة...' : 'Syncing...'}</span>
                                          </>
                                        ) : (
                                          <>
                                            <Bookmark className="h-3.5 w-3.5" />
                                            <span>{lang === 'ar' ? 'مزامنة' : 'Sync Space'}</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* 📧 Section 1: Complete Linking with Any Registered Primary or Alias Sub-Emails */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <span>{lang === 'ar' ? 'ربط هوية ومساحات Hugging Face بالبريد الإلكتروني المبرمج' : 'Link Hugging Face with Registered Email/Alias'}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[9px] uppercase font-black font-mono animate-pulse">
                            {lang === 'ar' ? 'نشط آمن' : 'Live Sync'}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                          {lang === 'ar' 
                            ? 'حدد أي بريد رئيسي تم تسجيله في "إدارة الهوية والبروكسي" أو حتى بريد فرعي (Alias) لربط وإسناد مشاريع هانجينغ فيس المستوردة له تلقائياً.' 
                            : 'Associate all synchronized space deployments with any primary or secondary alias email defined in your proxy account repository.'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-t border-white/5 pt-3.5">
                      <div className="md:col-span-8 space-y-1.5">
                        <label className="text-[10px] font-black text-amber-350 uppercase tracking-widest block font-mono">
                          {lang === 'ar' ? 'العنوان البريدي المربوط حالياً *' : 'Selected Active Binding Email *'}
                        </label>
                        <select
                          value={linkedHfEmail}
                          onChange={(e) => {
                            setLinkedHfEmail(e.target.value);
                            localStorage.setItem('hf_projects_linked_email', e.target.value);
                          }}
                          className="w-full text-xs text-white bg-slate-900 border border-white/10 rounded-xl p-3 outline-none cursor-pointer focus:border-amber-400 font-mono font-bold"
                        >
                          {getRegisteredEmailsAndAliases().map((item, idx) => (
                            <option key={`${item.address}-${idx}`} value={item.address} className="bg-slate-950 text-white font-mono">
                              {item.address} — {item.type === 'main' ? (lang === 'ar' ? 'رئيسي' : 'Primary Account') : `${lang === 'ar' ? 'بريد مستعار فرعي لكود' : 'Sub-alias proxy'} (${item.platform})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4 self-end">
                        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-2.5 text-xs">
                          <Check className="h-4 w-4 text-amber-400 shrink-0 font-extrabold" />
                          <div className="font-mono">
                            <span className="block font-black text-amber-300 text-[10px]">{lang === 'ar' ? 'حالة الربط:' : 'BINDING STATE:'}</span>
                            <span className="text-slate-300 font-bold truncate block max-w-[150px]" title={linkedHfEmail}>{linkedHfEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 🐳 Section 2: Complete Docker Configurator and Space Settings wizard */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <span>{lang === 'ar' ? 'مدير ملفات Docker وبقية أشكال إعدادات هانجينغ فيس' : 'Hugging Face Spaces Docker Setup Assistant'}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 text-[9px] uppercase font-black font-mono">
                            {lang === 'ar' ? 'قوالب جاهزة' : 'Docker SDK'}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                          {lang === 'ar' 
                            ? 'هل تستخدم حاويات مخصصة؟ قم بتوليد ملف الـ Dockerfile وواجهة الأكواد لجميع تطبيقات ومساحات ومنافذ التشغيل بنقرة واحدة.' 
                            : 'Using custom containers? Generate deployment-ready Dockerfile templates and application port mappings optimized specifically for Hugging Face Spaces.'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 border-t border-white/5 pt-4">
                      {/* Controller Form Column */}
                      <div className="md:col-span-4 space-y-4">
                        {/* Template Type Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-300 uppercase tracking-wider font-mono block">
                            {lang === 'ar' ? 'نوع مشروع بيئة العمل *' : 'AI App Tech Stack *'}
                          </label>
                          <select
                            value={selectedDockerTemplate}
                            onChange={(e) => setSelectedDockerTemplate(e.target.value as any)}
                            className="w-full text-xs text-white bg-slate-900 border border-white/10 rounded-xl p-3 outline-none cursor-pointer focus:border-blue-400 font-mono font-bold"
                          >
                            <option value="gradio">Python Gradio App</option>
                            <option value="streamlit">Python Streamlit App</option>
                            <option value="pytorch">PyTorch ML GPU Container</option>
                            <option value="node">Node.js Express backend / SPA</option>
                            <option value="fastapi">FastAPI ML endpoint</option>
                          </select>
                        </div>

                        {/* Container Port Config */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-blue-300 uppercase tracking-wider font-mono block">
                              {lang === 'ar' ? 'منفذ تشغيل الحاوية (Container Port) *' : 'Target Space Port *'}
                            </label>
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 rounded uppercase font-black">
                              {lang === 'ar' ? 'مستحسن 7860' : '7860 is HF standard'}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={containerDockerPort}
                            onChange={(e) => setContainerDockerPort(e.target.value)}
                            placeholder="7860"
                            className="w-full text-xs text-white bg-slate-900 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-400 font-mono font-extrabold"
                          />
                        </div>

                        {/* Custom Environment Settings */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-300 uppercase tracking-wider font-mono block">
                            {lang === 'ar' ? 'متغيرات البيئة والسرية (ENV Variables)' : 'Docker Environment Secrets'}
                          </label>
                          <textarea
                            value={dockerEnvVars}
                            onChange={(e) => setDockerEnvVars(e.target.value)}
                            rows={3}
                            placeholder="MODEL_ID=stabilityai/stable-diffusion-3&#10;USE_GPU=true"
                            className="w-full text-xs text-white bg-slate-900 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-400 font-mono"
                          />
                        </div>
                      </div>

                      {/* Code Previews Column */}
                      <div className="md:col-span-8 flex flex-col gap-4">
                        {/* Dockerfile Panel */}
                        <div className="bg-slate-950 border border-white/10 rounded-2.5xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-[11px] font-black font-mono">
                            <span className="text-blue-300 block">Dockerfile template</span>
                            <button
                              onClick={() => {
                                const files = getDockerTemplates(selectedDockerTemplate, containerDockerPort, dockerEnvVars);
                                safeCopyToClipboard(files.dockerfile);
                                setCopiedDockerFile(true);
                                setTimeout(() => setCopiedDockerFile(false), 2500);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] text-slate-300 hover:text-white transition duration-150 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedDockerFile ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedDockerFile ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ الكود' : 'Copy')}</span>
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-[10px] text-indigo-100 font-mono leading-relaxed select-all max-h-48 text-left" dir="ltr">
                            {getDockerTemplates(selectedDockerTemplate, containerDockerPort, dockerEnvVars).dockerfile}
                          </pre>
                        </div>

                        {/* README.md YAML Header for Spaces */}
                        <div className="bg-slate-950 border border-white/10 rounded-2.5xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-[11px] font-black font-mono">
                            <span className="text-amber-300 block">Hugging Face Space metadata (README.md)</span>
                            <button
                              onClick={() => {
                                const files = getDockerTemplates(selectedDockerTemplate, containerDockerPort, dockerEnvVars);
                                safeCopyToClipboard(files.readme);
                                setCopiedDockerReadme(true);
                                setTimeout(() => setCopiedDockerReadme(false), 2500);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] text-slate-300 hover:text-white transition duration-150 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedDockerReadme ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedDockerReadme ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ الكود' : 'Copy')}</span>
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-[10px] text-amber-100 font-mono leading-relaxed select-all max-h-40 text-left" dir="ltr">
                            {getDockerTemplates(selectedDockerTemplate, containerDockerPort, dockerEnvVars).readme}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4.5 w-4.5 text-indigo-555 shrink-0 group-hover:animate-bounce" />
                              <span className="truncate">{project.projectName}</span>
                            </div>
                            {project.createdAt && (
                              <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider pl-6">
                                {new Date(project.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                              </span>
                            )}
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                          <h4 className="font-black text-slate-800 text-sm truncate max-w-[180px]">{project.projectName}</h4>
                        </div>
                        {project.createdAt && (
                          <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider pl-6">
                            {new Date(project.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                          </span>
                        )}
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
