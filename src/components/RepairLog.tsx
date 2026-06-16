import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Trash2, Sliders } from 'lucide-react';
import { RepairLog as RepairLogType } from '../types';
import { getRepairLogs, saveRepairLog, clearAllRepairs } from '../utils/autoRepair';

interface RepairLogProps {
  lang?: 'ar' | 'en';
}

export function RepairLog({ lang = 'ar' }: RepairLogProps) {
  const [logs, setLogs] = useState<RepairLogType[]>([]);
  const [filter, setFilter] = useState<'all' | 'repaired' | 'failed'>('all');

  useEffect(() => {
    setLogs(getRepairLogs());
  }, []);

  const handleClear = () => {
    clearAllRepairs();
    setLogs([]);
  };

  const handleRefresh = () => {
    setLogs(getRepairLogs());
  };

  const handleApprove = (id: string, approved: boolean) => {
    const updated = logs.map(l => {
      if (l.id === id) {
        return { ...l, approved };
      }
      return l;
    });
    setLogs(updated);
    localStorage.setItem('developer_sentry_repair_logs', JSON.stringify(updated));
  };

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  return (
    <div id="repair-log-container" className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 shadow-xl relative overflow-hidden">
      {/* Visual background ambient line */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {lang === 'ar' ? 'سجل المعالجة الذاتية (Sentry AI Repair)' : 'Sentry AI Auto-Repair Log'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' 
              ? 'مراقبة العمليات التلقائية وعمليات الفيل-أوفر وتدوير المفاتيح والوكلاء لتصحيح الأخطاء دون انقطاع.' 
              : 'Audit active self-healing operations, failover shifts, and CORS proxy routing in real-time.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-repairs"
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            id="btn-clear-repairs"
            type="button"
            onClick={handleClear}
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition flex items-center gap-1.5 font-bold text-xs"
          >
            <Trash2 className="h-4 w-4" />
            <span>{lang === 'ar' ? 'مسح السجل' : 'Clear Audits'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
        <Sliders className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase mr-1">{lang === 'ar' ? 'تصفية:' : 'Filter:'}</span>
        
        <button
          id="btn-filter-all"
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs rounded-full font-bold transition ${filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {lang === 'ar' ? 'الكل' : 'All Events'}
        </button>
        
        <button
          id="btn-filter-repaired"
          type="button"
          onClick={() => setFilter('repaired')}
          className={`px-3 py-1 text-xs rounded-full font-bold transition flex items-center gap-1 ${filter === 'repaired' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {lang === 'ar' ? 'تم إصلاحها تلقائياً' : 'Auto Healed'}
        </button>
        
        <button
          id="btn-filter-failed"
          type="button"
          onClick={() => setFilter('failed')}
          className={`px-3 py-1 text-xs rounded-full font-bold transition flex items-center gap-1 ${filter === 'failed' ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          {lang === 'ar' ? 'فشل الإصلاح' : 'Repair Failed'}
        </button>
      </div>

      <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
            <ShieldCheck className="h-8 w-8 text-indigo-400 mx-auto opacity-60 animate-bounce" />
            <p className="text-xs font-black text-slate-700 mt-2">
              {lang === 'ar' ? 'النظام يعمل بشكل ممتاز ومستقر بنسبة 100%' : 'All Sentry nodes operating with 100% stable uptime'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {lang === 'ar' ? 'لا توجد أخطاء تتطلب تدخلاً علاجياً حتى الآن.' : 'No diagnostic remediation reports logged.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-2xl border transition shadow-sm hover:shadow-md ${
                log.status === 'repaired' 
                  ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950' 
                  : 'bg-red-50/60 border-red-100 text-red-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg bg-white mt-0.5 shadow-sm ${log.status === 'repaired' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {log.status === 'repaired' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-black text-slate-400">{log.timestamp}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${log.status === 'repaired' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                      {log.status === 'repaired' ? (lang === 'ar' ? 'تم الإصلاح' : 'REPAIRED') : (lang === 'ar' ? 'تنبيه معلق' : 'ALERT')}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold mt-1 text-slate-800 break-words">
                    {lang === 'ar' ? 'رصد حدث فشل:' : 'Detected Issue:'} <span className="font-medium text-slate-600">{log.issue}</span>
                  </h4>

                  <div className="bg-white/80 p-2 rounded-lg border border-slate-100/80 mt-2 text-xs font-medium text-slate-700">
                    <span className="text-[9px] font-black text-indigo-700 block uppercase tracking-wider">{lang === 'ar' ? '🔧 الإجراء العلاجي المتخذ:' : '🔧 Sentry Healing Treatment:'}</span>
                    <p className="mt-0.5 font-sans leading-relaxed">{log.actionTaken}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/50 pt-2 text-[10px]">
                    <span className="text-slate-400 font-medium">
                      {lang === 'ar' ? 'أثر الإصلاح: كفاءة تامة' : 'Sentry Health Impact: Green/Optimized'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-approve-repair-${log.id}`}
                        type="button"
                        onClick={() => handleApprove(log.id, true)}
                        className={`px-2 py-0.5 rounded font-bold transition ${log.approved === true ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {lang === 'ar' ? 'موافق' : 'Approve'}
                      </button>
                      <button
                        id={`btn-reject-repair-${log.id}`}
                        type="button"
                        onClick={() => handleApprove(log.id, false)}
                        className={`px-2 py-0.5 rounded font-bold transition ${log.approved === false ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {lang === 'ar' ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
