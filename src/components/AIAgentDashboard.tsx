import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, ShieldCheck, ShieldAlert, Cpu, Activity, RefreshCw, Layers, Terminal, AlertCircle, Play, CheckCircle,
  FileCheck, Globe, Star, Github, Rocket, Lock, Undo2, ArrowUpRight, Check, Sparkles, Send, Network, Server, HelpCircle
} from 'lucide-react';
import {
  subscribeToAgentState,
  triggerSystemInspectionLoop,
  logAgentActivity,
  AutonomousAgentState,
  AgentActivityLog
} from '../ai/agent';
import { runAutoTests, getAutonomousTestReports, TestReport } from '../ai/autoTester';
import { executeAutonomousDeploymentPipeline, DeploymentJobResult } from '../ai/autoDeployer';
import { getDeploymentLogs, DeploymentLog, rollbackDeployment } from '../utils/deploymentAPI';

interface AIAgentDashboardProps {
  lang: 'ar' | 'en';
  onLangToggle?: () => void;
  key?: string;
}

const DASHBOARD_TRANSLATIONS = {
  ar: {
    tabTitle: 'لوحة تحكم الوكيل الذكي السحابي',
    tabSubtitle: 'مراقبة آلية، تشخيص فوري للأعطال، تصحيح ذاتي مستمر، وشبكة نشر سحابي ذاتية الشفاء.',
    healthScore: 'مؤشر سلامة النظام',
    agentStatus: 'حالة الوكيل',
    idle: 'خامل (يراقب بنشاط)',
    monitoring: 'فحص التردد والنبض السحابي...',
    diagnosing: 'إجراء تشخيص تلقائي للأنود...',
    healing: 'دفع خوارزمية التصحيح الذاتي...',
    fixed: 'تمت المعالجة بنجاح ✔',
    failed: 'انتباه: يتطلب تصادم يدوي ⚠️',
    lastChecked: 'آخر فحص تلقائي:',
    activeTunnels: 'توصيلات التوثيق النشطة',
    unresolvedAnomalies: 'الثغرات والانحرافات المرصودة',
    noAnomalies: 'النظام سليم بالكامل. لا توجد انحرافات مسجلة.',
    
    // Commands card
    commandsTitle: 'غرفة تحكم العقل الاصطناعي',
    btnDeployPipeline: 'أطلق النشر التلقائي الذكي',
    btnStartInspection: 'فحص فوري للنبض والاتصال',
    btnRunSuite: 'أطلق حزمة الاختبارات الشاملة',
    
    // Deployment Card
    deploymentTitle: 'مخطط النشر الذاتي (Auto-Deployment)',
    gitRepo: 'مستودع GitHub المستهدف',
    gitBranch: 'الفرع النشط',
    hfSpace: 'مساحة Hugging Face المستهدفة',
    secretsConfig: 'تهيئة رموز الوصول والتوثيق',
    placeholderToken: 'أدخل الرمز السري للتعريف بالمنصة...',
    gitToken: 'رمز وصول GitHub (Token)',
    hfToken: 'رمز وصول Hugging Face (Token)',
    deployTriggered: 'تنبيه: بدأ التوزيع السحابي والتحقق من صحة الأكواد الآن...',
    
    // Activities and logs
    logsTitle: 'سجلات الإدراك ونبض الوكيل (Sentry Activities)',
    noActivities: 'لم تسجل أي حركة للوكيل بعد.',
    
    // Tabs in Agent Panel
    subTabActivities: 'سجل الإدراك المباشر',
    subTabTests: 'الاختبارات الذاتية المستمرة',
    subTabDeployments: 'تاريخ النشر السحابي',
    testSuiteName: 'حزمة الاختبار',
    statusPassed: 'Passed',
    statusFailed: 'Failed',
    overallStatus: 'أداء النظام العام:',

    // Notifications
    inspectionSuccess: 'اكتمل الفحص الذاتي بنجاح وتحديث المتغيرات!',
    pipelineSuccess: 'تم بنجاح النشر المزدوج إلى GitHub و Hugging Face Space!',
    pipelineError: 'سلسلة النشر غير مكتملة بسبب فشل الفحوصات الأمنية.',
    rollbackSuccess: 'تم سحب النشر بنجاح وإعادة الاستقرار للنظام!'
  },
  en: {
    tabTitle: 'Autonomous Sentry AI Control Dashboard',
    tabSubtitle: 'Continuous auto-monitoring, zero-knowledge diagnostics, self-healing key cycles, and self-repairing deployment pipelines.',
    healthScore: 'System Health Score',
    agentStatus: 'Agent Operational State',
    idle: 'Idle (Actively Guarding)',
    monitoring: 'Scanning Live Telemetry Tunnels...',
    diagnosing: 'Running Diagnostic Routine...',
    healing: 'Applying Cryptographic Self-Fix...',
    fixed: 'Anomalies Healed Successfully ✔',
    failed: 'Attention Required: Self-Fix Blocked ⚠️',
    lastChecked: 'Last Inspection:',
    activeTunnels: 'Active API Key Tunnels',
    unresolvedAnomalies: 'Detected Anomalies & Alerts',
    noAnomalies: 'System is pristine. No anomalies or vulnerabilities found.',
    
    // Commands card
    commandsTitle: 'AI Core Command Center',
    btnDeployPipeline: 'Execute Autonomous Deploy',
    btnStartInspection: 'Launch Diagnostics Inspection',
    btnRunSuite: 'Run Verification Test Suite',
    
    // Deployment Card
    deploymentTitle: 'Dual Pipeline Deployer (CI/CD)',
    gitRepo: 'GitHub Target Repository',
    gitBranch: 'Active Branch',
    hfSpace: 'Hugging Face Target Space',
    secretsConfig: 'API Access Secrets (Optional Simulator)',
    placeholderToken: 'Enter secure credential token...',
    gitToken: 'GitHub Access Token',
    hfToken: 'Hugging Face Space Token',
    deployTriggered: 'Deployment initiated. Running automated precheck workflows...',
    
    // Activities and logs
    logsTitle: 'AI Cognitive & Telemetry Activity Logs',
    noActivities: 'No cognitive logs recorded yet.',
    
    // Tabs in Agent Panel
    subTabActivities: 'Cognitive Log Stream',
    subTabTests: 'Automated Test Suites',
    subTabDeployments: 'Deployment Pipeline Archive',
    testSuiteName: 'Test Suite Reference',
    statusPassed: 'Passed',
    statusFailed: 'Failed',
    overallStatus: 'Global Pipeline Status:',

    // Notifications
    inspectionSuccess: 'Autonomous diagnostics cycle completed successfully!',
    pipelineSuccess: 'Dual deployment successfully validated & pushed to production!',
    pipelineError: 'Pipeline aborted: Pre-commit code tests failed.',
    rollbackSuccess: 'Pipeline rollback executed successfully! Restored stable system state.'
  }
};

export default function AIAgentDashboard({ lang, onLangToggle }: AIAgentDashboardProps) {
  const t = DASHBOARD_TRANSLATIONS[lang];

  // Core Agent state subscription
  const [agentState, setAgentState] = useState<AutonomousAgentState | null>(null);
  
  // Tabs inside Dashboard View
  const [subTab, setSubTab] = useState<'activities' | 'tests' | 'deployments'>('activities');

  // Interactive Actions state
  const [isInspecting, setIsInspecting] = useState(false);
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Deployment configuration inputs (binds to state)
  const [repoOwner, setRepoOwner] = useState('drmartin2050');
  const [repoName, setRepoName] = useState('vault-agent-core');
  const [branch, setBranch] = useState('main');
  const [huggingFaceSpace, setHuggingFaceSpace] = useState('drmartin2050/vault-space');
  const [gitToken, setGitToken] = useState('');
  const [hfToken, setHfToken] = useState('');

  // Historical lists
  const [testReportsList, setTestReportsList] = useState<TestReport[]>([]);
  const [deployLogsList, setDeployLogsList] = useState<DeploymentLog[]>([]);

  // Rollbackers
  const [processingRollbackId, setProcessingRollbackId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to Sentry core agent status
    const unsubscribe = subscribeToAgentState((state) => {
      setAgentState(state);
    });
    
    // Load lists
    refreshHistoryData();

    return () => unsubscribe();
  }, []);

  const refreshHistoryData = async () => {
    const tests = await getAutonomousTestReports();
    setTestReportsList(tests);
    const deploys = await getDeploymentLogs();
    setDeployLogsList(deploys);
  };

  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Diagnostics Run
  const handleStartInspection = async () => {
    setIsInspecting(true);
    await triggerSystemInspectionLoop();
    triggerToast(t.inspectionSuccess, 'success');
    setIsInspecting(false);
    refreshHistoryData();
  };

  // 2. Test Suite Execution
  const handleLaunchVerificationSuite = async () => {
    setIsRunningSuite(true);
    logAgentActivity('info', 'Manual verification test suite started by supervisor command.', 'Manual Sentry');
    const res = await runAutoTests();
    
    if (res.overallStatus === 'passed') {
      triggerToast(lang === 'ar' ? 'اجتازت كافة حزم الأكواد المعيارية بنجاح!' : 'All security and code tests passed!', 'success');
    } else {
      triggerToast(lang === 'ar' ? 'فشلت بعض مجموعات التحقق. جاري تفعيل التصحيح الذاتي...' : 'Security checks failed. Deploying self-fix...', 'error');
    }

    setIsRunningSuite(false);
    refreshHistoryData();
  };

  // 3. Dual Pipeline Deployer
  const handleTriggerDeploymentPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    
    triggerToast(t.deployTriggered, 'info');

    const result = await executeAutonomousDeploymentPipeline({
      repoOwner,
      repoName,
      branch,
      huggingFaceSpace,
      gitHubToken: gitToken || undefined,
      huggingFaceToken: hfToken || undefined
    });

    if (result.success) {
      triggerToast(t.pipelineSuccess, 'success');
    } else {
      triggerToast(`${t.pipelineError} [${result.error}]`, 'error');
    }

    setIsDeploying(false);
    refreshHistoryData();
  };

  // 4. Manual Rollback
  const handleRollback = async (logId: string) => {
    setProcessingRollbackId(logId);
    triggerToast(lang === 'ar' ? 'جاري سحب التغييرات سحابياً وتعديل مؤشر الفرع...' : 'Rolling back deployment remote state...', 'info');

    const res = await rollbackDeployment(logId);
    if (res.success) {
      triggerToast(t.rollbackSuccess, 'success');
    } else {
      triggerToast(`Rollback failure: ${res.error}`, 'error');
    }

    setProcessingRollbackId(null);
    refreshHistoryData();
  };

  const getStatusLabelColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'monitoring': return 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
      case 'diagnosing': return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'healing': return 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse';
      case 'fixed': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'failed': default: return 'bg-rose-50 text-rose-700 border-rose-200 animate-bounce';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div id="ai-agent-dashboard-wrapper" className="max-w-7xl mx-auto space-y-6 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-8 right-6 left-6 md:left-auto md:w-96 z-50 p-4 rounded-2xl border shadow-3d-deep flex items-center gap-3 font-semibold text-xs ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-150 text-rose-700'
                : toast.type === 'info'
                ? 'bg-indigo-50 border-indigo-150 text-indigo-700'
                : 'bg-emerald-50 border-emerald-150 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <ShieldAlert className="h-5 w-5 shrink-0" />
            ) : toast.type === 'info' ? (
              <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <ShieldCheck className="h-5 w-5 shrink-0" />
            )}
            <div className="flex-1">{toast.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Beautiful Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-3d-flat flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">
            <Cpu className="h-4 w-4 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Qwen Agentic Sentry Sub-Branch</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600 animate-pulse" />
            <span>{t.tabTitle}</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold max-w-2xl leading-relaxed">{t.tabSubtitle}</p>
        </div>

        {/* Dynamic visual health gauge metrics */}
        {agentState && (
          <div className="flex items-center gap-5 shrink-0 bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl shadow-3xs relative z-10">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.healthScore}</span>
              <div className="flex items-baseline justify-center gap-0.5">
                <span className={`text-3xl font-black font-mono tracking-tight ${getHealthColor(agentState.healthScore)}`}>
                  {agentState.healthScore}
                </span>
                <span className="text-xs font-bold text-slate-400">/100</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200" />

            <div className="text-center font-bold">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.agentStatus}</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border uppercase mt-1 ${getStatusLabelColor(agentState.status)}`}>
                {t[agentState.status] || agentState.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Commands and Deployment Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card A: Controls */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3d-flat space-y-6 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-indigo-505" />
                <span>{t.commandsTitle}</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">Execute real-time diagnostic queries to heal system state.</p>
            </div>

            <div className="p-4 bg-slate-50/60 border border-slate-200/60 rounded-2xl text-[11px] font-bold text-slate-600 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                <span>Infrastructure Telemetry</span>
                <span className="text-emerald-600 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>{t.activeTunnels}:</span>
                <span className="font-mono text-slate-800 font-extrabold">{agentState?.activeTunnelsCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.lastChecked}:</span>
                <span className="font-mono text-[10px] text-indigo-600">
                  {agentState ? new Date(agentState.lastMonitorTime).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                </span>
              </div>
            </div>

            {/* Unresolved anomalies box */}
            {agentState && agentState.unresolvedAnomalies.length > 0 ? (
              <div className="p-3 bg-rose-50/70 border border-rose-150 text-rose-700 rounded-2xl space-y-1.5 text-[11px] font-bold">
                <div className="flex items-center gap-1.5 font-extrabold">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-600 animate-bounce" />
                  <span>{t.unresolvedAnomalies} ({agentState.unresolvedAnomalies.length})</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[10px] pr-1">
                  {agentState.unresolvedAnomalies.map((anom, idx) => (
                    <div key={idx} className="border-b border-rose-100 last:border-0 pb-1">
                      ⚠️ {anom}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/50 border border-emerald-150 text-emerald-800 rounded-2xl flex items-center gap-2 text-[11px] font-bold">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>{t.noAnomalies}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 select-none">
            <button
              onClick={handleStartInspection}
              disabled={isInspecting || isDeploying || isRunningSuite}
              className="w-full py-3 rounded-2xl font-black text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs transition"
            >
              <RefreshCw className={`h-4 w-4 ${isInspecting ? 'animate-spin' : ''}`} />
              <span>{t.btnStartInspection}</span>
            </button>

            <button
              onClick={handleLaunchVerificationSuite}
              disabled={isRunningSuite || isInspecting || isDeploying}
              className="w-full py-3 rounded-2xl font-black text-xs border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs transition"
            >
              <FileCheck className={`h-4 w-4 ${isRunningSuite ? 'animate-bounce' : ''}`} />
              <span>{t.btnRunSuite}</span>
            </button>
          </div>
        </div>

        {/* Card B: Autonomous Deployment Setup */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3d-flat space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Rocket className="h-5 w-5 text-indigo-550 animate-pulse" />
              <span>{t.deploymentTitle}</span>
            </h3>
            <p className="text-[11px] text-slate-405 font-bold">Dual endpoint packaging and deployment with automatic rollbacks.</p>
          </div>

          <form onSubmit={handleTriggerDeploymentPipeline} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">{t.gitRepo}</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  placeholder="Owner"
                />
              </div>
              <input
                type="text"
                required
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 mt-1.5"
                placeholder="Repository Name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">{t.hfSpace}</label>
              <input
                type="text"
                required
                value={huggingFaceSpace}
                onChange={(e) => setHuggingFaceSpace(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                placeholder="Hugging Face Space ID"
              />
              
              <div className="mt-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">{t.gitBranch}</label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 mt-0.5"
                  placeholder="Branch (e.g. main)"
                />
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3.5 space-y-3">
              <span className="text-[11px] font-black text-slate-650 flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-indigo-500" />
                <span>{t.secretsConfig}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">{t.gitToken}</span>
                  <input
                    type="password"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold outline-none placeholder:text-slate-350"
                    placeholder={t.placeholderToken}
                  />
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">{t.hfToken}</span>
                  <input
                    type="password"
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold outline-none placeholder:text-slate-350"
                    placeholder={t.placeholderToken}
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 select-none pt-2">
              <button
                type="submit"
                disabled={isDeploying || isInspecting || isRunningSuite}
                className="w-full py-4.5 rounded-2xl text-white font-extrabold text-xs cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:scale-[1.01] transition duration-200 disabled:opacity-50 active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    <span>Processing Precheck, Building & Pushing...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="h-4.5 w-4.5" />
                    <span>{t.btnDeployPipeline}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Segment: Tabbed Historical Archives */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3d-flat space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setSubTab('activities')}
            className={`pb-2 px-3 text-xs font-black transition border-b-2 cursor-pointer ${
              subTab === 'activities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Terminal className="h-4 w-4 inline mr-1" />
            <span>{t.subTabActivities}</span>
          </button>

          <button
            onClick={() => setSubTab('tests')}
            className={`pb-2 px-3 text-xs font-black transition border-b-2 cursor-pointer ${
              subTab === 'tests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-1" />
            <span>{t.subTabTests}</span>
          </button>

          <button
            onClick={() => setSubTab('deployments')}
            className={`pb-2 px-3 text-xs font-black transition border-b-2 cursor-pointer ${
              subTab === 'deployments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Rocket className="h-4 w-4 inline mr-1" />
            <span>{t.subTabDeployments}</span>
          </button>
        </div>

        {/* TAB CONTENTS DISPLAY */}
        <div>
          
          {/* A: Activities stream */}
          {subTab === 'activities' && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-650 flex items-center justify-between">
                <span>{t.logsTitle}</span>
                <span className="text-[10px] text-slate-400 font-mono">Cognitive Pipeline Stream</span>
              </h4>

              {(!agentState || agentState.activities.length === 0) ? (
                <div className="text-center p-8 text-xs text-slate-400 font-bold">{t.noActivities}</div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 font-mono text-xs text-right bg-slate-900 text-slate-300 p-4 rounded-2xl select-all">
                  {agentState.activities.map((act) => {
                    const color = act.type === 'error' ? 'text-rose-400' : act.type === 'warning' ? 'text-amber-400' : act.type === 'success' ? 'text-emerald-400' : 'text-cyan-400';
                    return (
                      <div key={act.id} className="border-b border-slate-800 pb-2 last:border-0">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>[{act.component || 'Brain'}]</span>
                          <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex gap-1.5 items-start">
                          <span className={`font-black shrink-0 ${color}`}>
                            {act.type === 'error' ? '✖' : act.type === 'warning' ? '⚠' : '✔'}
                          </span>
                          <span className="leading-relaxed text-right md:-mr-1 flex-1">{act.message}</span>
                        </div>
                        {act.actionsTaken && act.actionsTaken.length > 0 && (
                          <div className="text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded-lg mt-1 inline-block text-right">
                            ⚒️ Actions: {act.actionsTaken.join(' / ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* B: Security verification tests reports history */}
          {subTab === 'tests' && (
            <div className="space-y-4">
              {testReportsList.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-400 font-bold">No test reports recorded yet. Let's trigger a manually run above.</div>
              ) : (
                <div className="space-y-6">
                  {testReportsList.slice(0, 3).map((report) => (
                    <div key={report.id} className="border border-slate-200.5 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                      <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">Report #{report.id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(report.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold select-none">
                          <span>{t.overallStatus}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            report.overallStatus === 'passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {report.overallStatus === 'passed' ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {report.suites.map(suite => (
                          <div key={suite.id} className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-750 truncate max-w-[80%]">{suite.name}</span>
                                <span className={`h-2.5 w-2.5 rounded-full ${suite.status === 'passed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold leading-normal">{suite.description}</p>
                            </div>

                            <div className="bg-slate-50/50 p-2 rounded-lg font-mono text-[9px] text-slate-400 space-y-1 mt-3">
                              <span className="uppercase text-[8px] font-black block text-slate-450">Integration Execution Checks</span>
                              <div className="flex justify-between font-bold text-slate-600">
                                <span>Passed ({suite.passedCount})</span>
                                <span>Failed ({suite.failedCount})</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C: Deployment Pipelines records */}
          {subTab === 'deployments' && (
            <div className="space-y-4">
              {deployLogsList.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-400 font-bold">No deployment logs produced yet. Launch your first production deploy now.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-600 text-right border-collapse font-bold">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase select-none">
                        <th className="py-2 px-3">Pipeline Log ID</th>
                        <th className="py-2 px-3">Platform Target</th>
                        <th className="py-2 px-3">Rep/Space</th>
                        <th className="py-2 px-3">Latest Commit HASH</th>
                        <th className="py-2 px-3">Operational Status</th>
                        <th className="py-2 px-3 text-left leading-normal">Management Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployLogsList.map((log) => (
                        <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                          <td className="py-3 px-3 text-slate-750 font-mono text-[11px]">{log.id}</td>
                          <td className="py-3 px-3">
                            <span className="uppercase tracking-wider font-extrabold text-[9px] border bg-slate-50 border-slate-200.5 px-2 py-0.5 rounded-md">
                              {log.platform}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-medium truncate max-w-xs">{log.repository}</td>
                          <td className="py-3 px-3 text-indigo-650 font-mono">{log.commit_hash?.slice(0, 8) || '-'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider
                              ${
                                log.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-1.5 border' :
                                log.status === 'rolled_back' ? 'bg-indigo-50 text-indigo-700 border-indigo-2.0 border' :
                                'bg-rose-50 text-rose-700 border-rose-1.5 border'
                              }
                            `}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-left">
                            {log.status === 'success' ? (
                              <button
                                onClick={() => handleRollback(log.id)}
                                disabled={processingRollbackId === log.id}
                                className="px-3 py-1 font-black text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 cursor-pointer select-none"
                              >
                                {processingRollbackId === log.id ? <RefreshCw className="h-2.5 w-2.5 animate-spin inline" /> : <Undo2 className="h-2.5 w-2.5 inline mr-0.5" />}
                                <span>Rollback Target</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
