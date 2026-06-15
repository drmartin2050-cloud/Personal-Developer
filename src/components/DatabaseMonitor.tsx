import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database, RefreshCw, Plus, Trash2, ShieldCheck, ShieldAlert, Wifi, WifiOff,
  Server, BarChart3, AlertTriangle, Play, HelpCircle, HardDrive
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  getAllDatabases, saveDatabase, verifyDatabaseState, deleteDatabase,
  DatabaseRegistryRecord
} from '../utils/vaultManager';

interface DatabaseMonitorProps {
  lang: 'ar' | 'en';
}

const CONST_TRANSLATIONS = {
  ar: {
    title: 'مراقبة وإدارة هوية قواعد البيانات السحابية',
    subtitle: 'تسجيل وتحليل ومزامنة مؤشرات أداء قواعد البيانات، ومراقبة سعات التخزين بدقة لحظية.',
    addBtn: 'تسجيل قاعدة بيانات جديدة',
    emptyState: 'لم تقم بتسجيل أي قاعدة بيانات بعد.',
    emptySub: 'أضف قواعد بيانات PostgreSQL, Supabase, MongoDB Atlas للبدء بمراقبتها.',
    formTitle: 'تسجيل قاعدة بيانات وتأمين الاتصال',
    dbName: 'اسم قاعدة البيانات',
    dbType: 'معمارية محرك البيانات',
    connString: 'سلسلة الاتصال المشفرة (Connection String)',
    saveBtn: 'تشفير وحفظ قاعدة البيانات',
    cancel: 'إلغاء',
    toastSuccess: 'تم حفظ قاعدة البيانات مشفرة بسجلات الخزنة!',
    toastDeleted: 'تم إلغاء تسجيل وإزالة خادم قاعدة البيانات.',
    testBtn: 'فحص الاتصال والنبض',
    refreshBtn: 'تحديث القياسات والأرقام',
    alertLimit: 'تنبيه: سعة التخزين تقترب من الحد الأقصى للمستوى المجاني (أكثر من 80 ميغابايت)!',
    limitExceeded: 'ممتلئة تقريباً',
    usageTitle: 'توزيع استخدام مساحة التخزين السحابية (ميغابايت)',
    totalDatabases: 'إجمالي قواعد البيانات المتصلة',
    totalStorage: 'إجمالي المساحة المستخدمة',
    avgTables: 'متوسط عدد الجداول/المستندات',
    statusOnline: 'متصل / مستقر',
    statusOffline: 'غير متصل / عطل بالتشفير'
  },
  en: {
    title: 'Cloud Databases Infrastructure Monitor',
    subtitle: 'Register, analyze, and sync database health, table metrics, and storage capacities in real-time.',
    addBtn: 'Register New Database',
    emptyState: 'No databases registered in your key vault yet.',
    emptySub: 'Connect PostgreSQL, Supabase, or MongoDB Atlas clusters to monitor health.',
    formTitle: 'Register & Encrypt New DB Connection',
    dbName: 'Database Custom Name',
    dbType: 'Database Architecture Type',
    connString: 'Secured Connection String (URI)',
    saveBtn: 'Encrypt & Save Connection',
    cancel: 'Cancel',
    toastSuccess: 'Database secured and registered to Supabase key vault successfully.',
    toastDeleted: 'Database registry erased from the cluster list.',
    testBtn: 'Test Connection Ping',
    refreshBtn: 'Retrieve Stats & Metrics',
    alertLimit: 'Warning: Storage space is nearing free trial thresholds (> 80 MB)!',
    limitExceeded: 'Nearing Limit',
    usageTitle: 'Cloud Storage Capacity Spent (MB)',
    totalDatabases: 'Connected Databases',
    totalStorage: 'Total Storage Spent',
    avgTables: 'Average Tables Count',
    statusOnline: 'Stable / Connected',
    statusOffline: 'Offline / Encryption error'
  }
};

export default function DatabaseMonitor({ lang }: DatabaseMonitorProps) {
  const t = CONST_TRANSLATIONS[lang];
  const [databases, setDatabases] = useState<DatabaseRegistryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbName, setDbName] = useState('');
  const [dbType, setDbType] = useState('PostgreSQL');
  const [connString, setConnString] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadDatabases();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadDatabases = async () => {
    setLoading(true);
    const data = await getAllDatabases();
    setDatabases(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName || !connString) return;

    setLoading(true);
    const masterPass = sessionStorage.getItem('dynamic_vault_auth_token') || 'Eissa2026';
    const res = await saveDatabase(dbName, dbType, connString, masterPass);
    if (res.success) {
      triggerToast(t.toastSuccess);
      setIsModalOpen(false);
      setDbName('');
      setConnString('');
      await loadDatabases();
    } else {
      triggerToast(res.error || 'Failed to save.');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف اتصال قاعدة البيانات هذا نهائياً؟' : 'Are you sure you want to permanently erase this database registry?')) {
      const ok = await deleteDatabase(id);
      if (ok) {
        triggerToast(t.toastDeleted);
        await loadDatabases();
      }
    }
  };

  const handleTestConnection = async (item: DatabaseRegistryRecord) => {
    setTestingId(item.id);
    const masterPass = sessionStorage.getItem('dynamic_vault_auth_token') || 'Eissa2026';
    const res = await verifyDatabaseState(item.id, item.connection_string, masterPass);
    if (res.success) {
       triggerToast(`${item.db_name}: ${res.text}`);
       await loadDatabases();
    } else {
       triggerToast(`${item.db_name}: ${res.text}`);
    }
    setTestingId(null);
  };

  // Metrics indicators
  const totalStorage = databases.reduce((acc, current) => acc + Number(current.storage_used), 0);
  const averageTables = databases.length > 0 
    ? Math.round(databases.reduce((acc, current) => acc + current.tables_count, 0) / databases.length) 
    : 0;

  // Chart modeling
  const chartData = databases.map(d => ({
    name: d.db_name,
    storage: Number(d.storage_used)
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div id="database-monitor-view" className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-3d-deep border border-slate-700"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Stats HUD Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 select-none">
        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex items-center gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
            <Server className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.totalDatabases}</div>
            <div className="text-xl font-black text-slate-800">{databases.length}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex items-center gap-4">
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600 shrink-0">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.totalStorage}</div>
            <div className="text-xl font-black text-slate-800">{totalStorage.toFixed(1)} MB</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex items-center gap-4">
          <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-600 shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.avgTables}</div>
            <div className="text-xl font-black text-slate-800">{averageTables}</div>
          </div>
        </div>
      </div>

      {/* Controller Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <h2 className="text-lg font-black text-slate-800 leading-tight">{t.title}</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadDatabases}
            disabled={loading}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-600 cursor-pointer transition shadow-3xs"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-2xl text-white font-extrabold text-xs border border-indigo-600 cursor-pointer shadow-3xs"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
          >
            <Plus className="h-4 w-4 inline-block mr-1" />
            <span>{t.addBtn}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* databases list details */}
        <div className="lg:col-span-2 space-y-4">
          {databases.length === 0 ? (
            <div className="bg-white border border-slate-200.5 rounded-2xl p-10 text-center shadow-3d-flat">
              <Database className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-bounce" />
              <div className="text-sm font-black text-slate-700">{t.emptyState}</div>
              <p className="text-xs text-slate-400 mt-1 font-bold">{t.emptySub}</p>
            </div>
          ) : (
            databases.map(db => {
              const isNearingLimit = db.storage_used > 80;
              return (
                <div
                  key={db.id}
                  className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat space-y-3 relative overflow-hidden transition hover:scale-[1.005]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-indigo-600 shadow-3xs font-black">
                        {db.db_type.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{db.db_name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase mt-0.5">{db.db_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border shadow-3xs flex items-center gap-1
                        ${
                          db.status === 'online' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                        }
                      `}>
                        {db.status === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        <span>{db.status === 'online' ? t.statusOnline : t.statusOffline}</span>
                      </span>

                      {isNearingLimit && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] bg-amber-50 border border-amber-200 text-amber-700 font-black animate-pulse flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>{t.limitExceeded}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warning strip */}
                  {isNearingLimit && (
                    <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold rounded-xl flex items-center gap-2 mt-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 animate-bounce shrink-0" />
                      <div>{t.alertLimit}</div>
                    </div>
                  )}

                  {/* Meter detail stats */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">TABLES COUNT</span>
                      <div className="text-slate-800 font-black font-mono">{db.tables_count} tables</div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">ESTIMATED STORAGE</span>
                      <div className="text-slate-800 font-black font-mono">{db.storage_used} MB / 500 MB</div>
                    </div>
                  </div>

                  {/* Database action controllers */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-2.5">
                    <button
                      onClick={() => handleDelete(db.id)}
                      className="p-2 border border-slate-150 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition cursor-pointer shadow-3xs"
                      title="Erase registry database"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleTestConnection(db)}
                      disabled={testingId === db.id}
                      className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-slate-650 text-[10px] font-black cursor-pointer transition shadow-3xs disabled:opacity-50"
                    >
                      {testingId === db.id ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Wifi className="h-3 w-3"/>}
                      <span>{t.testBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Storage charts visualizer side panels */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-3d-flat">
            <h3 className="text-xs font-black text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <span>{t.usageTitle}</span>
            </h3>

            {chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-400 font-bold text-xs">
                No storage distribution metrics to show.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: 11, borderRadius: 12, borderColor: '#f1f5f9', fontWeight: 700 }} />
                    <Bar dataKey="storage" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD DATABASE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 max-w-md w-full overflow-hidden shadow-3d-deep"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-500" />
                  <span>{t.formTitle}</span>
                </h3>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">{t.dbName}</label>
                  <input
                    type="text"
                    required
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="e.g. Supabase Production API"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl outline-none text-xs font-bold focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">{t.dbType}</label>
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3 py-3 rounded-2xl text-xs font-black cursor-pointer focus:border-indigo-500 outline-none"
                  >
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="Supabase">Supabase DB Cluster</option>
                    <option value="MongoDB Atlas">MongoDB Atlas</option>
                    <option value="MySQL">MySQL Server</option>
                    <option value="Firebase Storage">Firebase Cloud Firestore</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">{t.connString}</label>
                  <input
                    type="password"
                    required
                    value={connString}
                    onChange={(e) => setConnString(e.target.value)}
                    placeholder="postgresql://username:passphrase@host:5432/dbname"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3.5 rounded-2xl outline-none text-xs font-mono focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 select-none">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-black cursor-pointer hover:bg-slate-50"
                  >
                    {t.cancel}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !dbName || !connString}
                    className="px-5 py-3 rounded-xl text-white font-extrabold text-xs cursor-pointer border border-indigo-600 shadow-3xs"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
                  >
                    {t.saveBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
