import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Coins, Terminal, Activity, Trash2, Calendar, ShieldCheck, Cpu, Database, HardDrive, KeyRound
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  getAllKeys, getUsageLogs, deleteKey, SecretKeyRecord, KeyUsageTrackingRecord, getAllDatabases
} from '../utils/vaultManager';

interface KeyUsageDashboardProps {
  lang: 'ar' | 'en';
}

const DASH_TRANSLATIONS = {
  ar: {
    totalKeys: 'مفاتيح الربط المؤمنة',
    totalCalls: 'إجمالي استدعاءات النظم',
    unusedAlerts: 'مفاتيح غير نشطة/مهملة',
    recentTimeline: 'سجل النشاط والاستخدام اللحظي لرموز البرمجة',
    keysDistribution: 'توزيع رموز الاتصال البرمجي حسب المنصة',
    mostUsedTitle: 'رموز الاتصال الأكثر تفاعلاً واستخداماً',
    unusedTitle: 'مفاتيح مهملة (لم تستخدم بأي صفحة برمجية)',
    unusedSub: 'يوصي المعالج الذكي بحذف هذه المفاتيح لتأمين كفاءة الخزنة وترشيد البنية.',
    deleteBtn: 'تطهير وحذف',
    columnKeyName: 'مسمى الرمز',
    columnPlatform: 'المنصة',
    columnPage: 'الصفحة الحاملة للرمز',
    columnComponent: 'المكون البرمجي (Component)',
    columnTime: 'التوقيت',
    noActivity: 'لم يرصد النظام أي سجل استدعاء بعد.',
    activeKeysDesc: 'مجموع الرموز النشطة والنشطة جزئياً معاً'
  },
  en: {
    totalKeys: 'Secured API Keys',
    totalCalls: 'Total Core API Requests',
    unusedAlerts: 'Unused / Inactive Vault Keys',
    recentTimeline: 'Real-time API Usage and Encryption Logs Activity',
    keysDistribution: 'Keys Distribution by Target Platform',
    mostUsedTitle: 'Top Active API Keys Usage Intensity',
    unusedTitle: 'Unused Keys Warning list',
    unusedSub: 'Secure deletion is highly suggested for clean credential management.',
    deleteBtn: 'Delete Key',
    columnKeyName: 'Key Custom Name',
    columnPlatform: 'Platform',
    columnPage: 'Executed in Page',
    columnComponent: 'Target Component',
    columnTime: 'Timestamp',
    noActivity: 'No API calls tracked in this session yet.',
    activeKeysDesc: 'Aggregate keys registered in secure storage container'
  }
};

export default function KeyUsageDashboard({ lang }: KeyUsageDashboardProps) {
  const t = DASH_TRANSLATIONS[lang];
  const [keys, setKeys] = useState<SecretKeyRecord[]>([]);
  const [usageLogs, setUsageLogs] = useState<KeyUsageTrackingRecord[]>([]);
  const [databasesCount, setDatabasesCount] = useState(0);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    const k = await getAllKeys();
    setKeys(k);
    const logs = await getUsageLogs();
    setUsageLogs(logs);

    const dbs = await getAllDatabases();
    setDatabasesCount(dbs.length);
    setTotalStorageUsed(dbs.reduce((acc, current) => acc + Number(current.storage_used), 0));
  };

  const handleDeleteUnused = async (id: string) => {
    if (confirm(lang === 'ar' ? 'هل تود بالتأكيد التخلص من هذا الرمز المعلق لمنع تسريب الهوية؟' : 'Are you sure you want to delete this secret key permanently?')) {
      const ok = await deleteKey(id);
      if (ok) {
        await loadDashboardStats();
      }
    }
  };

  // Calculations for graphs
  const totalCalls = keys.reduce((sum, current) => sum + (current.usage_count || 0), 0);

  // Platform count grouping formatting for pie chart
  const platformGroupMap: { [p: string]: number } = {};
  keys.forEach(k => {
    platformGroupMap[k.platform] = (platformGroupMap[k.platform] || 0) + 1;
  });
  const pieChartData = Object.entries(platformGroupMap).map(([name, value]) => ({
    name,
    value
  }));

  // Top active keys
  const barChartData = [...keys]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 5)
    .map(k => ({
      name: k.key_name,
      calls: k.usage_count
    }));

  // Filter unused keys
  const unusedKeys = keys.filter(k => k.usage_count === 0);

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div id="credentials-analytics-hud" className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 select-none">
        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex items-center gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
            <KeyRound className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.totalKeys}</div>
            <div className="text-xl font-black text-slate-800">{keys.length}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex items-center gap-4">
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600 shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.totalCalls}</div>
            <div className="text-xl font-black text-slate-800">{totalCalls}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex items-center gap-4">
          <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-600 shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{lang === 'ar' ? 'قواعد البيانات المسجلة' : 'Registered Databases'}</div>
            <div className="text-xl font-black text-slate-800">{databasesCount}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex items-center gap-4">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 shrink-0">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.unusedAlerts}</div>
            <div className="text-xl font-black text-rose-600">{unusedKeys.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keys by platform pie chart */}
        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.keysDistribution}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.activeKeysDesc}</p>
          </div>

          {pieChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 font-bold text-xs">
              No keys to distribute.
            </div>
          ) : (
            <div className="h-56 flex items-center justify-between">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4}>
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, borderColor: '#f1f5f9', fontWeight: 700 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-1/2 space-y-2 max-h-48 overflow-y-auto">
                {pieChartData.map((plat, idx) => (
                  <div key={plat.name} className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{plat.name}</span>
                    </div>
                    <span className="font-mono text-slate-800">{plat.value} ({Math.round(plat.value / keys.length * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Most Used Keys Bar Chart */}
        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.mostUsedTitle}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Top 5 keys by invocation frequencies</p>
          </div>

          {barChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 font-bold text-xs">
              No usage timeline generated.
            </div>
          ) : (
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: 11, borderRadius: 12, borderColor: '#f1f5f9', fontWeight: 700 }} />
                  <Bar dataKey="calls" radius={[6, 6, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Unused Keys Alert warning segment */}
      {unusedKeys.length > 0 && (
        <div className="bg-white border border-slate-200.5 rounded-2xl p-5 shadow-3d-flat">
          <div>
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Trash2 className="h-4.5 w-4.5 text-rose-500" />
              <span>{t.unusedTitle}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{t.unusedSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {unusedKeys.map(k => (
              <div key={k.id} className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 flex items-center justify-between transition hover:scale-[1.01]">
                <div>
                  <div className="text-xs font-extrabold text-slate-800">{k.key_name}</div>
                  <span className="text-[9px] text-slate-400 font-black tracking-wider block uppercase mt-0.5">{k.platform}</span>
                </div>

                <button
                  onClick={() => handleDeleteUnused(k.id)}
                  className="px-3 py-1 bg-white border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-650 transition text-rose-600 text-[10px] font-black cursor-pointer rounded-lg shadow-3xs"
                >
                  {t.deleteBtn}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-3d-flat">
        <h3 className="text-xs font-black text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
          <span>{t.recentTimeline}</span>
        </h3>

        {usageLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">
            {t.noActivity}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600 text-right font-bold border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 select-none text-[10px] font-black uppercase">
                  <th className="py-2.5 px-3 min-w-32">{t.columnKeyName}</th>
                  <th className="py-2.5 px-3">{t.columnPlatform}</th>
                  <th className="py-2.5 px-3">{t.columnPage}</th>
                  <th className="py-2.5 px-3">{t.columnComponent}</th>
                  <th className="py-2.5 px-3 min-w-32">{t.columnTime}</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-slate-850 font-extrabold">{log.key_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-indigo-50/70 text-indigo-600 border border-indigo-100 rounded-md">
                        {log.platform}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{log.used_in_page}</td>
                    <td className="py-3 px-3 font-mono text-[10px] text-zinc-500">{log.used_in_component}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
