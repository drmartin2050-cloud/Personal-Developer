import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, Unlock, Eye, EyeOff, Copy, Plus, Trash2, X, Key, Sparkles, RefreshCw, Check, CheckCircle2,
  Brain, Cpu, Database, Network, KeyRound, HelpCircle, ShieldCheck, ShieldAlert, Coins, Pencil,
  Download, Upload, Search, ListFilter, AlertCircle, Scan, MapPin, Activity, HardDrive, Info
} from 'lucide-react';

import { PLATFORMS_DATABASE } from '../data/platforms';
import { detectKeyDetails } from '../utils/keyDetector';
import { encryptWithWebCrypto, decryptWithWebCrypto } from '../utils/encryption';
import {
  getAllKeys, saveNewKey, updateKeyName, deleteKey, validatePlatformKey,
  verifyAndSyncKey, getUsageLogs, SecretKeyRecord, KeyUsageTrackingRecord
} from '../utils/vaultManager';
import {
  exportKeysBackup, importKeysBackup, getBackupHistory, BackupHistoryLog
} from '../utils/backupManager';

import DatabaseMonitor from './DatabaseMonitor';
import KeyUsageDashboard from './KeyUsageDashboard';

interface SecretsManagerProps {
  key?: string;
  lang: 'ar' | 'en';
}

const LOCAL_TRANSLATIONS = {
  ar: {
    title: 'منصة الخزنة السحابية وإدارة قواعد البيانات',
    subtitle: 'إدارة وتأمين وحوكمة مفاتيح الربط البرمجي ورموز الوصول، وفحص الاتصال بقواعد البيانات ومزامنتها بـ Supabase.',
    unlockTitle: 'بوابة العبور الآمنة للخزنة',
    unlockSubtitle: 'أدخل الرقم السري لفك تشفير رموز الوصول والولوج إلى غرف التحكم السحابية.',
    passwordPlaceholder: 'أدخل النظام السري الرئيسي (Master Password)...',
    unlockBtn: 'فك التشفير والولوج الآمن',
    lockDatabase: 'إقفال الخزنة السحابية',
    addBtn: 'تأمين مفتاح جديد',
    emptyStateTitle: 'لا توجد مفاتيح مسجلة',
    emptyStateSub: 'ابدأ بإدخال مفتاحك السري وتثبيته في خزنة Supabase لتأمينه واستعماله.',
    
    // Sub-Tabs
    tabKeys: 'مفاتيح الربط البرمجي',
    tabDatabases: 'مراقبة قواعد البيانات',
    tabAnalytics: 'مؤشرات وعدادات الاستخدام',
    tabBackup: 'النسخ الاحتياطي والاستعادة',
    tabScanner: 'محلل الثغرات والمفاتيح المهملة',

    // Section A: Form
    formTitle: 'تأمين وتشفير مفتاح سري جديد',
    fieldPasteKey: 'الصق رمز الوصول البرمجي هنا (API Key)',
    fieldPastePlaceholder: 'الصق الرمز وال نظام سيكتشف المنصة والنوع تلقائياً...',
    fieldPlatformName: 'منصة مزود الخدمة الكاشفة',
    fieldKeyName: 'المسمى المخصص للرمز',
    fieldKeyType: 'نوع وسيلة التعريف المعيارية',
    fieldCredit: 'الرصيد الافتراضي المتاح ($)',
    fieldUrl: 'رابط التسجيل والتوثيق المرجعي',
    btnSaveKey: 'تشفير وحفظ المفتاح السري',
    btnCancel: 'إلغاء المعاملة',
    detectedPlat: 'المنصة المكتشفة:',
    detectedType: 'النوع المكتشف:',

    // Section B: List
    groupHeader: 'أرصدة ورموز المنصة:',
    btnReveal: 'كشف',
    btnHide: 'إخفاء',
    btnCopy: 'نسخ',
    btnTest: 'فحص النبض',
    btnUsage: 'أين يستخدم؟',
    editNamePlaceholder: 'اسم مخصص جديد...',

    // Section C: Backup
    backupTitle: 'غرفة النسخ الاحتياطي وحماية البيانات المرمزة',
    backupSub: 'تصدير كامل المفاتيح المرمزة بملف محمي أو رفع نسخة واستردادها بكلمة مرور مخصصة.',
    btnExport: 'تصدير النسخة الاحتياطية المرمزة (.vlt)',
    btnImport: 'استيراد واستعادة من ملف خارجي',
    promptPass: 'حدد كلمة مرور لتشفير ملف النسخة المصدّرة:',
    promptImportPass: 'أدخل كلمة مرور ملف النسخة الاحتياطية لفك قفله:',
    backupHistory: 'سجل النسخ الاحتياطية السابقة',
    fileName: 'اسم الملف المصدر',
    fileKeys: 'عدد المفاتيح المستوردة/المصدرة',

    // Section D: Scanner
    scannerTitle: 'محلل ومدقق الاستخدام والأكواد غير النشطة',
    scannerSub: 'يقوم المحلل بفحص ومقارنة كافة المفاتيح بسجل الاستدعاءات وعرض المفاتيح المعلقة عديمة الاستعمال لتفادي المخاطر.',
    btnScan: 'أطلق فحص الخزنة والاستهلاك',
    scannerScanning: 'جارِ إجراء الفحص العابر للخزنة والتدقيق الائتماني...',
    unreferenced: '⚠️ مفتاح معلق (لم يرصد له أي استخدام في أي واجهة!)',
    referenced: '✅ مفتاح نشط ويستخدم في التطبيقات الحية',
    referencedWhere: 'الاستخدام النشط في:',
    deleteUnused: 'تطهير وحذف المفتاح فوراً للحماية',

    // Feedback notifications
    wrongPassword: 'الرقم السري الرئيسي غير صحيح أو معسر التفكيك.',
    copiedText: 'تم نسخ الكود فك التشفير بنجاح للحافظة!',
    saveSuccess: 'تم تشفير وحفظ المفتاح السري الجديد بنجاح بمصفوفة Supabase!',
    deleteSuccess: 'تم حذف وإبادة المفتاح الائتماني بنجاح.',
    testSuccess: 'تم فحص الرمز وتأكيد الاتصال بنجاح واستقرار!',
    testFailed: 'تعذر الاتصال الخارجي بالمنصة. يرجى مراجعة الرصيد.',
    backupSuccess: 'تم توليد وتنزيل حزمة النسخة الاحتياطية بنجاح!',
    restoreSuccess: 'تمت استعادة وتحديث المفاتيح المستوردة بنجاح!'
  },
  en: {
    title: 'Cloud Keyring & Cloud Vault Management',
    subtitle: 'Manage, encrypt, and secure API keys, and monitor real-time database endpoints integrated with Supabase.',
    unlockTitle: 'Vault Access Controller Gate',
    unlockSubtitle: 'Enter the master passkey to decrypt your credentials and synchronize active tunnels.',
    passwordPlaceholder: 'Enter Vault Master Password...',
    unlockBtn: 'Unlock Cryptographic Vault',
    lockDatabase: 'Lock Database',
    addBtn: 'Secure New Key',
    emptyStateTitle: 'Secure Vault Empty',
    emptyStateSub: 'Introduce your first cloud credential to be fully encrypted client-side and saved to Supabase.',
    
    // Sub-Tabs
    tabKeys: 'API Secret Keys',
    tabDatabases: 'Databases Registry',
    tabAnalytics: 'Analytics Dashboard',
    tabBackup: 'Backup & Recovery',
    tabScanner: 'Security Scanner',

    // Section A: Form
    formTitle: 'Encrypt & Secure New Secret Key',
    fieldPasteKey: 'Paste API Credential/Key Here',
    fieldPastePlaceholder: 'Paste key; the system will auto-detect platform and identity type...',
    fieldPlatformName: 'Target Service Platform',
    fieldKeyName: 'Custom Name Reference',
    fieldKeyType: 'Credential Logical Type',
    fieldCredit: 'Assumed Starting Credit ($)',
    fieldUrl: 'Official Provider Claim Link',
    btnSaveKey: 'Encrypt & Save Secret Key',
    btnCancel: 'Cancel',
    detectedPlat: 'Detected Platform:',
    detectedType: 'Detected Type:',

    // Section B: List
    groupHeader: 'Platform Credentials:',
    btnReveal: 'Reveal',
    btnHide: 'Hide',
    btnCopy: 'Copy',
    btnTest: 'Test API',
    btnUsage: 'Usage Locations',
    editNamePlaceholder: 'New friendly name...',

    // Section C: Backup
    backupTitle: 'Zero-Knowledge Backup & Portability',
    backupSub: 'Export your credentials as a password-protected encrypted .vlt bundle, or restore previous backups.',
    btnExport: 'Export Encrypted Backup (.vlt)',
    btnImport: 'Import & Restore Backup File',
    promptPass: 'Set a password to secure the exported file:',
    promptImportPass: 'Enter the password to decrypt the backup catalog:',
    backupHistory: 'Local Backup Event Logs',
    fileName: 'Filename',
    fileKeys: 'Saved Keys Count',

    // Section D: Scanner
    scannerTitle: 'API Credentials Utilization Scanner',
    scannerSub: 'Cross-reference active keys with live components usage history to safely detect orphaned or unreferenced tokens.',
    btnScan: 'Launch Utilization Scan',
    scannerScanning: 'Examining crypto records & verifying integrations logs...',
    unreferenced: '⚠️ Unused key (Not referenced in any active file/workflow!)',
    referenced: '✅ Active Key (Verified usage in panels & dashboards)',
    referencedWhere: 'Active executions found at:',
    deleteUnused: 'Purge Unused Key',

    // Feedback notifications
    wrongPassword: 'Master password incorrect. Decryption failed.',
    copiedText: 'Copied decrypted secret safely to clipboard!',
    saveSuccess: 'Credentials successfully encrypted and saved to Supabase cloud database!',
    deleteSuccess: 'Secret successfully wiped from the vault.',
    testSuccess: 'API tested successfully on remote endpoint!',
    testFailed: 'API validation failed. check key status or credit allocations.',
    backupSuccess: 'Encrypted backup generated and downloaded successfully!',
    restoreSuccess: 'Credentials database successfully restored!'
  }
};

export default function SecretsManager({ lang }: SecretsManagerProps) {
  const t = LOCAL_TRANSLATIONS[lang];
  
  // Tabs and general states
  const [activeSubTab, setActiveSubTab] = useState<'keys' | 'databases' | 'analytics' | 'backup' | 'scanner'>('keys');
  const [masterPass, setMasterPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [keysList, setKeysList] = useState<SecretKeyRecord[]>([]);
  const [usageLogs, setUsageLogs] = useState<KeyUsageTrackingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form input states (Section A)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pastedKeyValue, setPastedKeyValue] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Google');
  const [customKeyName, setCustomKeyName] = useState('');
  const [selectedKeyType, setSelectedKeyType] = useState('API_KEY');
  const [initialBalance, setInitialBalance] = useState('100.0');
  const [officialClaimLink, setOfficialClaimLink] = useState('https://aistudio.google.com/app/apikey');
  const [showPastedValue, setShowPastedValue] = useState(false);

  // UI trackers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [inspectUsageId, setInspectUsageId] = useState<string | null>(null);

  // Scanner States (Section D)
  const [scanReport, setScanReport] = useState<Array<{ key: SecretKeyRecord; isUnused: boolean; logs: KeyUsageTrackingRecord[] }>>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Backup states (Section C)
  const [backupLogsList, setBackupLogsList] = useState<BackupHistoryLog[]>([]);

  // Password for backup dialog
  const [showBackupPasswordModal, setShowBackupPasswordModal] = useState(false);
  const [backupPasswordText, setBackupPasswordText] = useState('');
  const [importFileContentInput, setImportFileContentInput] = useState<string | null>(null);
  const [showImportPasswordModal, setShowImportPasswordModal] = useState(false);
  const [importPasswordText, setImportPasswordText] = useState('');

  // Auto check and load secrets once authenticated
  useEffect(() => {
    const savedKey = sessionStorage.getItem('dynamic_vault_auth_token');
    if (savedKey === 'Eissa2026' || savedKey === 'admin') {
      setMasterPass(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllVaultData();
    }
  }, [isAuthenticated]);

  const loadAllVaultData = async () => {
    setLoading(true);
    const keys = await getAllKeys();
    setKeysList(keys);
    const logs = await getUsageLogs();
    setUsageLogs(logs);
    setBackupLogsList(getBackupHistory());
    setLoading(false);
  };

  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Auth unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPass === 'Eissa2026' || masterPass === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('dynamic_vault_auth_token', masterPass);
      setAuthError('');
      triggerToast(lang === 'ar' ? 'تم فك تشفير البيانات والتحقق بنجاح!' : 'Credential access certified.');
    } else {
      setAuthError(t.wrongPassword);
    }
  };

  const handleLock = () => {
    setMasterPass('');
    setIsAuthenticated(false);
    sessionStorage.removeItem('dynamic_vault_auth_token');
    setRevealedIds({});
  };

  // Auto detect fields (Section A)
  const handlePasteChange = (val: string) => {
    setPastedKeyValue(val);
    if (!val) return;

    const matched = detectKeyDetails(val);
    if (matched.detectedPlatform && matched.detectedPlatform !== 'Custom') {
      setSelectedPlatform(matched.detectedPlatform);
      setSelectedKeyType(matched.detectedKeyType);
      setOfficialClaimLink(matched.officialLink);
      setCustomKeyName(`${matched.detectedPlatform}-${Date.now().toString().slice(-4)}`);
    } else {
      // Setup some defaultcustoms
      setOfficialClaimLink('');
    }
  };

  // Save new key
  const handleSaveSecretKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedKeyValue.trim()) return;

    setLoading(true);
    const credNum = parseFloat(initialBalance) || 100.00;
    const finalName = customKeyName || `${selectedPlatform}-${Date.now().toString().slice(-4)}`;
    
    const res = await saveNewKey(
      selectedPlatform,
      finalName,
      selectedKeyType,
      pastedKeyValue.trim(),
      officialClaimLink,
      credNum,
      masterPass
    );

    if (res.success) {
      triggerToast(t.saveSuccess, 'success');
      setIsFormOpen(false);
      setPastedKeyValue('');
      setCustomKeyName('');
      setInitialBalance('100.0');
      await loadAllVaultData();
    } else {
      triggerToast(res.error || 'Failed to save credential', 'error');
    }
    setLoading(false);
  };

  // Delete key
  const handleDeleteKey = async (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف وإبادة هذا الرمز البرمجي نهائياً؟' : 'Are you sure you want to permanently delete this secret key?')) {
      const ok = await deleteKey(id);
      if (ok) {
        triggerToast(t.deleteSuccess);
        await loadAllVaultData();
      }
    }
  };

  // Save friendly name
  const handleSaveFriendlyName = async (id: string) => {
    if (!editingNameValue.trim()) return;
    const ok = await updateKeyName(id, editingNameValue.trim());
    if (ok) {
      setEditingId(null);
      await loadAllVaultData();
    }
  };

  // Copy key value decrypting on the fly
  const handleCopyValue = async (encryptedVal: string, id: string) => {
    try {
      const decrypted = await decryptWithWebCrypto(encryptedVal, masterPass);
      if (!decrypted) throw new Error();
      navigator.clipboard.writeText(decrypted);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      triggerToast(t.copiedText);
    } catch {
      triggerToast('Fails to decrypt for copying.', 'error');
    }
  };

  // Test key validation against live platforms API
  const handleTestKey = async (item: SecretKeyRecord) => {
    setTestingId(item.id);
    try {
      const decryptedVal = await decryptWithWebCrypto(item.encrypted_value, masterPass);
      const test = await validatePlatformKey(item.platform, decryptedVal);
      
      const successSync = await verifyAndSyncKey(item.id, item.platform, decryptedVal);
      if (test.status === 'active') {
        triggerToast(`${item.key_name}: ${t.testSuccess} (${test.details})`, 'success');
      } else {
        triggerToast(`${item.key_name}: ${t.testFailed} (${test.details})`, 'error');
      }
      
      if (successSync) {
        await loadAllVaultData();
      }
    } catch {
      triggerToast('Unable to check platform credentials endpoint.', 'error');
    }
    setTestingId(null);
  };

  // Launch Unused Keys utilization Scanner (Section D)
  const handleLaunchUtilizationScan = async () => {
    setIsScanning(true);
    setScanReport([]);
    
    // Slight simulation timeout for UX build
    setTimeout(() => {
      const reports = keysList.map(key => {
        const matches = usageLogs.filter(log => log.key_id === key.id);
        return {
          key,
          isUnused: matches.length === 0,
          logs: matches
        };
      });
      setScanReport(reports);
      setIsScanning(false);
    }, 1200);
  };

  // Backup Triggering
  const triggerExportBackup = async () => {
    if (!backupPasswordText) return;
    setShowBackupPasswordModal(false);
    
    triggerToast(lang === 'ar' ? 'جار تشفير وتصدير أرشيف الخزنة...' : 'Exporting encrypted archive...');
    const res = await exportKeysBackup(backupPasswordText);
    setBackupPasswordText('');
    
    if (res.success) {
      triggerToast(t.backupSuccess, 'success');
      await loadAllVaultData();
    } else {
      triggerToast(res.error || 'Failed to export.', 'error');
    }
  };

  // File Upload Trigger for Restore
  const handleImportFileTrigger = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportFileContentInput(content);
      setShowImportPasswordModal(true);
    };
    reader.readAsText(file);
    e.target.value = ''; // clear
  };

  const triggerImportBackup = async () => {
    if (!importFileContentInput || !importPasswordText) return;
    setShowImportPasswordModal(false);

    setLoading(true);
    const res = await importKeysBackup(importFileContentInput, importPasswordText, masterPass);
    setImportPasswordText('');
    setImportFileContentInput(null);

    if (res.success) {
      triggerToast(`${t.restoreSuccess} (${res.importedCount} keys imported)`, 'success');
      await loadAllVaultData();
    } else {
      triggerToast(res.error || 'Invalid archive key code.', 'error');
    }
    setLoading(false);
  };

  const renderPlatformKeyIcon = (platName: string) => {
    const p = platName.toLowerCase();
    if (p.includes('openai')) return <Brain className="h-5 w-5 text-emerald-500" />;
    if (p.includes('anthropic')) return <Cpu className="h-5 w-5 text-amber-500" />;
    if (p.includes('google') || p.includes('gemini')) return <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />;
    if (p.includes('supabase') || p.includes('neon') || p.includes('mongo')) return <Database className="h-5 w-5 text-purple-600" />;
    if (p.includes('n8n') || p.includes('webhook')) return <Network className="h-5 w-5 text-rose-500" />;
    return <KeyRound className="h-5 w-5 text-cyan-500" />;
  };

  return (
    <div id="secrets-manager-parent" className="max-w-7xl mx-auto space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-6 right-6 left-6 md:left-auto md:w-96 z-50 p-4 rounded-2xl border shadow-3d-deep flex items-center gap-3 font-semibold text-xs ${
              notification.type === 'error'
                ? 'bg-rose-50 border-rose-100 text-rose-700'
                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}
          >
            {notification.type === 'error' ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            <div>{notification.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAuthenticated ? (
        /* Zero Knowledge Master Auth Lock Gate Screen */
        <motion.div
          key="lock-gate-auth"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto my-12"
        >
          <div className="rounded-3xl border border-slate-200.5 bg-white p-8 text-center shadow-3d-deep space-y-6 select-none relative overflow-hidden">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-50 blur-3xl" />
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 text-white animate-pulse shadow-md border-4 border-indigo-50 relative z-10">
              <Lock className="h-10 w-10 text-white" />
            </div>

            <div className="space-y-1.5 relative z-10">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">{t.unlockTitle}</h1>
              <p className="text-slate-400 text-[11px] font-bold leading-relaxed">{t.unlockSubtitle}</p>
            </div>

            {authError && (
              <div className="p-3 text-[11px] bg-rose-50 border border-rose-150 text-rose-600 rounded-xl font-black animate-pulse">
                {authError}
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4 relative z-10">
              <input
                type="password"
                required
                value={masterPass}
                onChange={(e) => setMasterPass(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full text-slate-800 bg-slate-50 border border-slate-250 rounded-2xl p-4 outline-none text-xs text-center font-black placeholder:text-slate-400 focus:border-indigo-500 transition shadow-2xs font-mono"
              />

              <div className="p-3.5 text-[10px] bg-slate-50 border border-slate-150 text-slate-500 rounded-xl font-bold flex items-center gap-2 justify-center">
                <span>🔐</span>
                <span>Demo Code: <span className="text-indigo-600 font-extrabold uppercase">Eissa2026</span></span>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl text-white font-extrabold text-xs border border-indigo-600 transition cursor-pointer shadow-3xs"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
              >
                {t.unlockBtn}
              </button>
            </form>
          </div>
        </motion.div>
      ) : (
        /* Workspace Wrapper View with tabs and control units */
        <div className="space-y-6">
          
          {/* Main Title Banner with dynamic controls */}
          <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200.5 shadow-3d-flat flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 blur-3xl" />
            
            <div className="space-y-1.5 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">
                <ShieldCheck className="h-4 w-4 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Encrypted with Web Crypto AES-GCM</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{t.title}</h1>
              <p className="text-xs text-slate-500 font-bold max-w-2xl leading-relaxed">{t.subtitle}</p>
            </div>

            <div className="flex gap-2 select-none relative z-10 shrink-0">
              <button
                onClick={handleLock}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer shadow-3xs text-slate-500"
                title="Lock Credentials Container"
              >
                <Lock className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={() => setIsFormOpen(true)}
                className="px-5 py-3 rounded-2xl text-white font-extrabold text-xs cursor-pointer border border-indigo-600 shadow-3xs"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
              >
                <Plus className="h-4 w-4 inline-block mr-1" />
                <span>{t.addBtn}</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px select-none">
            <button
              onClick={() => setActiveSubTab('keys')}
              className={`pb-3 px-4 text-xs font-black transition cursor-pointer shrink-0 border-b-2 ${
                activeSubTab === 'keys' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <KeyRound className="h-4 w-4 inline-block mr-1" />
              <span>{t.tabKeys}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('databases')}
              className={`pb-3 px-4 text-xs font-black transition cursor-pointer shrink-0 border-b-2 ${
                activeSubTab === 'databases' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Database className="h-4 w-4 inline-block mr-1" />
              <span>{t.tabDatabases}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`pb-3 px-4 text-xs font-black transition cursor-pointer shrink-0 border-b-2 ${
                activeSubTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Activity className="h-4 w-4 inline-block mr-1" />
              <span>{t.tabAnalytics}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('backup')}
              className={`pb-3 px-4 text-xs font-black transition cursor-pointer shrink-0 border-b-2 ${
                activeSubTab === 'backup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Download className="h-4 w-4 inline-block mr-1" />
              <span>{t.tabBackup}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('scanner')}
              className={`pb-3 px-4 text-xs font-black transition cursor-pointer shrink-0 border-b-2 ${
                activeSubTab === 'scanner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Scan className="h-4 w-4 inline-block mr-1" />
              <span>{t.tabScanner}</span>
            </button>
          </div>

          {/* DYNAMIC TAB SWITCH RENDERER */}
          <div className="py-2">
            
            {/* SUB-TAB 1: KEYS LIST */}
            {activeSubTab === 'keys' && (
              <div className="space-y-6">
                {keysList.length === 0 ? (
                  <div className="bg-white border border-slate-200.5 rounded-3xl p-12 text-center shadow-3d-flat select-none">
                    <Key className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-bounce" />
                    <h3 className="text-sm font-black text-slate-700">{t.emptyStateTitle}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 max-w-sm mx-auto">{t.emptyStateSub}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {keysList.map(item => {
                      const isRevealed = !!revealedIds[item.id];
                      const maskedText = isRevealed ? 'REVEAL_STATE' : '••••••••••••••••••••••••••••';
                      const isEditing = editingId === item.id;

                      const keyStatsLogs = usageLogs.filter(log => log.key_id === item.id);

                      return (
                        <div
                          key={item.id}
                          className="bg-white border border-slate-200.5 rounded-3xl p-5 shadow-3d-flat flex flex-col justify-between space-y-4 relative overflow-hidden transition-all hover:scale-[1.005]"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-slate-50 border border-slate-150 rounded-xl text-indigo-600 shadow-3xs">
                                  {renderPlatformKeyIcon(item.platform)}
                                </div>

                                <div>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={editingNameValue}
                                        onChange={(e) => setEditingNameValue(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-2 py-1 rounded outline-none"
                                        placeholder={t.editNamePlaceholder}
                                      />
                                      <button
                                        onClick={() => handleSaveFriendlyName(item.id)}
                                        className="p-1 bg-emerald-500 text-white rounded cursor-pointer"
                                      >
                                        <Check className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <h3 className="font-extrabold text-sm text-slate-800">{item.key_name}</h3>
                                      <button
                                        onClick={() => {
                                          setEditingId(item.id);
                                          setEditingNameValue(item.key_name);
                                        }}
                                        className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-widest">{item.platform}</span>
                                </div>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-3xs
                                ${
                                  item.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  item.status === 'low' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                }
                              `}>
                                {item.status === 'active' ? '● ONLINE' : item.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Masked display block */}
                            <div className="space-y-1">
                              <span className="text-[8px] text-slate-400 font-black uppercase block tracking-wider">ENCRYPTED CREDENTIAL VALUE</span>
                              <div className="flex items-center justify-between gap-2.5 bg-slate-50 border border-slate-150 rounded-2xl p-3 text-xs font-mono text-slate-700">
                                <span className="truncate pr-2 select-all font-bold tracking-tight">
                                  {isRevealed ? (
                                    <span className="text-slate-850 font-black text-[11px]">
                                      {/* Force client decrypt on reveal */}
                                      <AsyncDecryptValue encrypted={item.encrypted_value} pass={masterPass} />
                                    </span>
                                  ) : '••••••••••••••••••••••••••••'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setRevealedIds(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                    className="p-1 hover:bg-slate-100 text-slate-450 hover:text-indigo-650 transition cursor-pointer rounded-lg"
                                    title={isRevealed ? t.btnHide : t.btnReveal}
                                  >
                                    {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>

                                  <button
                                    onClick={() => handleCopyValue(item.encrypted_value, item.id)}
                                    className="p-1 hover:bg-slate-100 text-slate-450 hover:text-indigo-650 transition cursor-pointer rounded-lg"
                                    title={t.btnCopy}
                                  >
                                    {copiedId === item.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Limits & Indicators */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-2 bg-slate-5/50 rounded-xl px-1">
                              <div className="flex items-center gap-1">
                                <Coins className="h-3.5 w-3.5 text-indigo-550" />
                                <span className="text-slate-750 font-mono font-black">${item.balance}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <Activity className="h-3.5 w-3.5 text-indigo-550" />
                                <span className="text-slate-750">{item.usage_count} calls</span>
                              </div>
                            </div>

                            {/* Usage tracking indicators */}
                            {inspectUsageId === item.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl text-[10px] font-bold text-indigo-950 space-y-1.5"
                              >
                                <span className="uppercase tracking-widest text-[8px] text-indigo-500 font-black block">Active Executions Logs ({keyStatsLogs.length})</span>
                                {keyStatsLogs.length === 0 ? (
                                  <div className="text-indigo-650">No logs generated yet for this component key.</div>
                                ) : (
                                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono">
                                    {keyStatsLogs.map(log => (
                                      <div key={log.id} className="flex justify-between items-center text-[9px] border-b border-indigo-100/40 pb-0.5">
                                        <span>{log.used_in_page} ({log.used_in_component})</span>
                                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}

                          </div>

                          {/* Operations bottom panels */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-2 select-none">
                            <button
                              onClick={() => handleDeleteKey(item.id)}
                              className="p-2 border border-slate-150 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 cursor-pointer shadow-3xs"
                              title="Delete Key"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setInspectUsageId(inspectUsageId === item.id ? null : item.id)}
                                className="px-3.5 py-1.5 text-[9px] font-black border border-slate-200.5 bg-slate-50 text-slate-650 rounded-xl hover:bg-slate-100 cursor-pointer shadow-3xs flex items-center gap-1"
                              >
                                <MapPin className="h-3 w-3" />
                                <span>{t.btnUsage}</span>
                              </button>

                              <button
                                onClick={() => handleTestKey(item)}
                                disabled={testingId === item.id}
                                className="px-4 py-1.5 text-[9px] font-black border border-indigo-100 bg-indigo-50 text-indigo-650 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 cursor-pointer transition shadow-3xs disabled:opacity-50"
                              >
                                {testingId === item.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 inline mr-0.5" />}
                                <span>{t.btnTest}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: DATABASE MONITOR */}
            {activeSubTab === 'databases' && (
              <DatabaseMonitor lang={lang} />
            )}

            {/* SUB-TAB 3: USAGE ANALYTICS */}
            {activeSubTab === 'analytics' && (
              <KeyUsageDashboard lang={lang} />
            )}

            {/* SUB-TAB 4: BACKUP & RECOVERY */}
            {activeSubTab === 'backup' && (
              <div className="bg-white border border-slate-200.5 rounded-3xl p-6 shadow-3d-flat space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                    <Download className="h-5 w-5 text-indigo-550" />
                    <span>{t.backupTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-1 max-w-2xl leading-relaxed">{t.backupSub}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 select-none">
                  <button
                    onClick={() => setShowBackupPasswordModal(true)}
                    className="flex-1 py-4.5 bg-slate-50 border border-slate-205 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-650 transition cursor-pointer text-center text-xs font-black text-slate-700 flex flex-col items-center justify-center gap-1"
                  >
                    <Download className="h-7 w-7 text-indigo-550 mb-0.5" />
                    <span>{t.btnExport}</span>
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept=".vlt"
                      onChange={handleImportFileTrigger}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="h-full w-full py-4.5 bg-slate-50 border border-slate-205 rounded-2xl hover:bg-purple-50 hover:border-purple-200 hover:text-purple-650 transition text-center text-xs font-black text-slate-700 flex flex-col items-center justify-center gap-1">
                      <Upload className="h-7 w-7 text-purple-600 mb-0.5" />
                      <span>{t.btnImport}</span>
                    </div>
                  </div>
                </div>

                {/* Local export log history */}
                <div className="border-t border-slate-100 pt-5 space-y-3.5">
                  <h4 className="text-xs font-extrabold text-slate-650 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500" />
                    <span>{t.backupHistory}</span>
                  </h4>

                  {backupLogsList.length === 0 ? (
                    <p className="text-[11px] text-slate-405 font-bold">No previous backup file exports recorded on this terminal device.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-slate-600 text-right border-collapse font-bold">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase select-none">
                            <th className="py-2 px-3">{t.fileName}</th>
                            <th className="py-2 px-3">{t.fileKeys}</th>
                            <th className="py-2 px-3">Date Exported</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backupLogsList.map((log) => (
                            <tr key={log.id} className="border-b border-slate-50 last:border-0">
                              <td className="py-3 px-3 text-slate-750 font-mono text-[11px]">{log.fileName}</td>
                              <td className="py-3 px-3 text-emerald-600 font-black">{log.keysCount} keys</td>
                              <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SUB-TAB 5: UTILITY SCANNER */}
            {activeSubTab === 'scanner' && (
              <div className="bg-white border border-slate-200.5 rounded-3xl p-6 shadow-3d-flat space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                      <Scan className="h-5 w-5 text-indigo-550 animate-pulse" />
                      <span>{t.scannerTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 max-w-2xl leading-relaxed">{t.scannerSub}</p>
                  </div>

                  <button
                    onClick={handleLaunchUtilizationScan}
                    disabled={isScanning}
                    className="px-5 py-3 cursor-pointer text-white font-extrabold text-xs rounded-2xl border border-indigo-600 shadow-3xs shrink-0 select-none"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
                  >
                    <span>{t.btnScan}</span>
                  </button>
                </div>

                {isScanning ? (
                  <div className="p-12 text-center text-xs font-bold text-slate-500 space-y-2">
                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-2" />
                    <p>{t.scannerScanning}</p>
                  </div>
                ) : scanReport.length > 0 ? (
                  <div className="space-y-4">
                    {scanReport.map(report => {
                      return (
                        <div
                          key={report.key.id}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition
                            ${
                              report.isUnused 
                                ? 'bg-rose-50/50 border-rose-100' 
                                : 'bg-slate-50/50 border-slate-150'
                            }
                          `}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 text-xs">{report.key.key_name}</span>
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">({report.key.platform})</span>
                            </div>

                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                              {report.isUnused ? (
                                <span className="text-rose-600 font-black">{t.unreferenced}</span>
                              ) : (
                                <span className="text-emerald-700 font-black">
                                  {t.referenced} {t.referencedWhere} <span className="font-mono text-[9px] text-slate-500">{report.logs.map(l => `${l.used_in_page}/${l.used_in_component}`).join(', ')}</span>
                                </span>
                              )}
                            </p>
                          </div>

                          {report.isUnused && (
                            <button
                              onClick={() => handleDeleteKey(report.key.id)}
                              className="px-4.5 py-2 hover:bg-rose-600 hover:text-white transition bg-white border border-rose-250 text-rose-600 text-[10px] font-black rounded-xl shadow-3xs cursor-pointer select-none"
                            >
                              {t.deleteUnused}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[11px] text-slate-405 font-bold">
                    Click "Launch Utilization Scan" to run security analysis.
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ADD NEW CREDENTIAL DRAWER MODAL SHEET */}
          <AnimatePresence>
            {isFormOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl border border-slate-100 max-w-xl w-full overflow-hidden shadow-3d-deep"
                >
                  <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center bg-slate-50 select-none">
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <Key className="h-5 w-5 text-indigo-500" />
                      <span>{t.formTitle}</span>
                    </h3>

                    <button
                      onClick={() => setIsFormOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-white border border-slate-205 cursor-pointer shadow-3xs"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveSecretKey} className="p-6 space-y-4">
                    
                    {/* Enter Paste area */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase block">{t.fieldPasteKey}</label>
                      <div className="relative">
                        <textarea
                          required
                          rows={2}
                          value={pastedKeyValue}
                          onChange={(e) => handlePasteChange(e.target.value)}
                          placeholder={t.fieldPastePlaceholder}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-2xl outline-none text-xs font-mono leading-tight focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Auto Detected Indicators warning alert strip */}
                    {pastedKeyValue && (
                      <div className="p-3 bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-800 font-extrabold rounded-xl flex justify-between items-center select-none">
                        <span className="flex items-center gap-1">
                          <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                          <span>{t.detectedPlat} <strong className="text-indigo-950 px-1 bg-white border border-indigo-200.5 rounded uppercase">{selectedPlatform}</strong></span>
                        </span>
                        <span>{t.detectedType} <strong className="text-indigo-950 px-1 bg-white border border-indigo-200.5 rounded uppercase">{selectedKeyType}</strong></span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Platform Select with search layout */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase block">{t.fieldPlatformName}</label>
                        <select
                          value={selectedPlatform}
                          onChange={(e) => {
                            setSelectedPlatform(e.target.value);
                            const platMatched = PLATFORMS_DATABASE.find(p => p.id === e.target.value);
                            if (platMatched) {
                              setSelectedKeyType(platMatched.keyType);
                              setOfficialClaimLink(platMatched.officialLink);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-2xl text-xs font-black cursor-pointer focus:border-indigo-500 outline-none"
                        >
                          {PLATFORMS_DATABASE.map(p => (
                            <option key={p.id} value={p.id}>{p.nameEn} ({p.nameAr})</option>
                          ))}
                          <option value="Custom">Custom Platform</option>
                        </select>
                      </div>

                      {/* Custom Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase block">{t.fieldKeyName}</label>
                        <input
                          type="text"
                          required
                          value={customKeyName}
                          onChange={(e) => setCustomKeyName(e.target.value)}
                          placeholder="e.g. Gemini-Backup-2"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none text-xs font-black focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Key Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase block">{t.fieldKeyType}</label>
                        <select
                          value={selectedKeyType}
                          onChange={(e) => setSelectedKeyType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-2xl text-xs font-black cursor-pointer focus:border-indigo-500 outline-none"
                        >
                          <option value="API_KEY">API_KEY</option>
                          <option value="SECRET_KEY">SECRET_KEY</option>
                          <option value="WEBHOOK_URL">WEBHOOK_URL</option>
                          <option value="IP_ADDRESS">IP_ADDRESS</option>
                          <option value="AUTH_TOKEN">AUTH_TOKEN</option>
                        </select>
                      </div>

                      {/* Initial Credits mock balance */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase block">{t.fieldCredit}</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={initialBalance}
                          onChange={(e) => setInitialBalance(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3.5 rounded-2xl outline-none text-xs font-bold focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Official Link */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase block">{t.fieldUrl}</label>
                      <input
                        type="url"
                        value={officialClaimLink}
                        onChange={(e) => setOfficialClaimLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none text-xs font-mono focus:border-indigo-500"
                      />
                    </div>

                    {/* Submit Controllers */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 select-none">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="px-5 py-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-50 cursor-pointer"
                      >
                        {t.btnCancel}
                      </button>

                      <button
                        type="submit"
                        disabled={loading || !pastedKeyValue.trim()}
                        className="px-6 py-3 rounded-xl text-white font-extrabold text-xs cursor-pointer border border-indigo-600 shadow-3xs"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
                      >
                        {t.btnSaveKey}
                      </button>
                    </div>

                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* PASSWORD SETUP MODAL FOR BACKUP (EXPORT) */}
          <AnimatePresence>
            {showBackupPasswordModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-sm w-full space-y-4 shadow-3d-deep text-center">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl inline-block mx-auto">
                    <Download className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{lang === 'ar' ? 'كلمة مرور تأمين ملف النسخة' : 'Configure Backup Encryption Code'}</h4>
                    <p className="text-[10px] text-slate-450 mt-1 font-bold">{t.promptPass}</p>
                  </div>
                  <input
                    type="password"
                    value={backupPasswordText}
                    onChange={(e) => setBackupPasswordText(e.target.value)}
                    placeholder="Set passcode token e.g. AdminSecure..."
                    className="w-full text-center bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl outline-none text-xs font-black font-mono focus:border-indigo-500"
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowBackupPasswordModal(false);
                        setBackupPasswordText('');
                      }}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-650 rounded-xl text-xs font-black cursor-pointer"
                    >
                      {t.btnCancel}
                    </button>
                    <button
                      onClick={triggerExportBackup}
                      disabled={!backupPasswordText}
                      className="flex-1 py-2.5 bg-indigo-600 text-white border border-indigo-600 rounded-xl text-xs font-extrabold cursor-pointer hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* PASSWORD PROMPT MODAL FOR IMPORT (RESTORE) */}
          <AnimatePresence>
            {showImportPasswordModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-sm w-full space-y-4 shadow-3d-deep text-center">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl inline-block mx-auto">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{lang === 'ar' ? 'فصل ترميز حزمة الأرشيف' : 'Decrypt Recovery Bundle'}</h4>
                    <p className="text-[10px] text-slate-450 mt-1 font-bold">{t.promptImportPass}</p>
                  </div>
                  <input
                    type="password"
                    value={importPasswordText}
                    onChange={(e) => setImportPasswordText(e.target.value)}
                    placeholder="Enter decryption password..."
                    className="w-full text-center bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl outline-none text-xs font-black font-mono focus:border-indigo-500"
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowImportPasswordModal(false);
                        setImportPasswordText('');
                        setImportFileContentInput(null);
                      }}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-650 rounded-xl text-xs font-black cursor-pointer"
                    >
                      {t.btnCancel}
                    </button>
                    <button
                      onClick={triggerImportBackup}
                      disabled={!importPasswordText}
                      className="flex-1 py-2.5 bg-purple-600 text-white border border-purple-650 rounded-xl text-xs font-extrabold cursor-pointer hover:bg-purple-700 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}

// Small self-contained async decryption renderer component to keep the UI snappy with WebCrypto decrypts promises
function AsyncDecryptValue({ encrypted, pass }: { encrypted: string; pass: string }) {
  const [decryptedTextVal, setDecryptedTextVal] = useState('Decrypting...');
  useEffect(() => {
    async function solve() {
      try {
        const solved = await decryptWithWebCrypto(encrypted, pass);
        setDecryptedTextVal(solved || '⚠️ Decryption key expired');
      } catch {
        setDecryptedTextVal('⚠️ Decrypt crash');
      }
    }
    solve();
  }, [encrypted, pass]);

  return <>{decryptedTextVal}</>;
}
