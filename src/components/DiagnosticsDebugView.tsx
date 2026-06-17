import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, ShieldAlert, Key, Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  data?: any;
}

export const DiagnosticsDebugView: React.FC<{ lang: 'en' | 'ar' }> = ({ lang }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    setLogs(prev => [
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        type,
        message,
        data
      },
      ...prev
    ]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    
    addLog('info', lang === 'ar' ? 'بدء التشخيص التحليلي...' : 'Starting diagnostics...');

    // 1. Check API Keys in LocalStorage
    try {
      addLog('info', lang === 'ar' ? 'جاري فحص المفاتيح المخزنة...' : 'Checking locally stored API keys...');
      const hfToken = localStorage.getItem('hf_projects_token');
      const ghToken = localStorage.getItem('github_projects_token');
      
      const keys = {
        HUGGING_FACE_TOKEN: hfToken ? `${hfToken}` : 'NOT_FOUND',
        GITHUB_TOKEN: ghToken ? `${ghToken}` : 'NOT_FOUND',
      };

      addLog(
        hfToken || ghToken ? 'success' : 'warning',
        lang === 'ar' ? 'نتائج فحص المفاتيح المحلية' : 'Local Keys Scan Results',
        keys
      );

      const getEnvVar = (name: string) => {
        const altName = name.replace('VITE_', '');
        return (window as any).__ENV?.[name] || (window as any).__ENV?.[altName] || (window as any).env?.[name] || (window as any).env?.[altName] || (import.meta as any).env?.[name] || (import.meta as any).env?.[altName];
      };

      // Check environment variables if possible
      const envKeys = {
        VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL') ? getEnvVar('VITE_SUPABASE_URL') : 'NOT_FOUND',
        VITE_SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY') ? 'PRESENT (HIDDEN FOR SECURITY)' : 'NOT_FOUND',
      };

      addLog('info', lang === 'ar' ? 'بيانات بيئة التشغيل' : 'Environment Variables Config', envKeys);

    } catch (e: any) {
      addLog('error', 'Error reading keys', e.message);
    }

    // 2. Mock Supabase Handshake Test
    try {
      addLog('info', lang === 'ar' ? 'بدء فحص اتصال قاعدة بيانات Supabase...' : 'Initiating Supabase connection handshake...');
      
      const getEnvVar = (name: string) => {
        const altName = name.replace('VITE_', '');
        return (window as any).__ENV?.[name] || (window as any).__ENV?.[altName] || (window as any).env?.[name] || (window as any).env?.[altName] || (import.meta as any).env?.[name] || (import.meta as any).env?.[altName];
      };
      
      const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
      const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

      if (!supabaseUrl || !supabaseKey) {
        addLog('error', lang === 'ar' ? 'متغيرات بيئة Supabase مفقودة' : 'Supabase environment variables missing. Handshake aborted.');
      } else {
        addLog('info', `Pinging Supabase URL: ${supabaseUrl}/rest/v1/`);
        // We will just do a fetch to the REST endpoint root or a public table if necessary, but a mock delay provides the visual of handshake.
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          
          if (res.ok || res.status === 404) { // 404 on root is fine, means server is reachable
             addLog('success', lang === 'ar' ? 'تم الاتصال بـ Supabase بنجاح' : 'Supabase handshake successful. Server is reachable and key is valid.');
          } else {
             addLog('error', lang === 'ar' ? `فشل الاتصال: ${res.statusText}` : `Handshake failed: ${res.status} ${res.statusText}`);
          }
        } catch (netErr: any) {
          addLog('error', lang === 'ar' ? 'تعطل الاتصال بالشبكة (CORS/DNS)' : 'Network handshake failed (CORS/DNS Error)', netErr.message);
        }
      }
    } catch (e: any) {
      addLog('error', 'Supabase diagnostic error', e.message);
    }

    addLog('info', lang === 'ar' ? 'اكتمل التشخيص.' : 'Diagnostics completed.');
    setIsRunning(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-fuchsia-500/10 rounded-xl">
          <Terminal className="h-6 w-6 text-fuchsia-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">
            {lang === 'ar' ? 'شاشة التشخيص وإصلاح الأخطاء' : 'Diagnostics & Debugging Console'}
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            {lang === 'ar' ? 'عرض فوري للمفاتيح الخام وحالة الاتصال بقواعد البيانات' : 'Raw API keys inspector and database handshake status for troubleshooting.'}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[600px]">
        {/* Console Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="ml-3 text-xs font-mono font-bold text-slate-500 tracking-wider">
              sys_debug_output.log
            </span>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-xs font-black rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning 
              ? (lang === 'ar' ? 'جاري الفحص...' : 'Running...') 
              : (lang === 'ar' ? 'بدء الفحص' : 'Run Diagnostics')
            }
          </button>
        </div>

        {/* Console Output */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-3" dir="ltr">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
              <Terminal className="h-10 w-10 opacity-20" />
              <p>{lang === 'ar' ? 'انقر على "بدء الفحص" لتوليد السجلات.' : 'Click "Run Diagnostics" to generate logs.'}</p>
            </div>
          ) : (
            logs.map(log => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={log.id} 
                className="space-y-1.5 border-b border-slate-800/50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0"
              >
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 select-none">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  
                  {log.type === 'error' && <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
                  {log.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
                  {log.type === 'info' && <span className="text-sky-400 font-bold shrink-0 mt-0.5">➔</span>}
                  {log.type === 'warning' && <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}

                  <div className="flex-1 space-y-1 overflow-hidden">
                    <span className={`font-semibold ${
                      log.type === 'error' ? 'text-rose-400' :
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      'text-slate-300'
                    }`}>
                      {log.message}
                    </span>
                    
                    {log.data && (
                      <pre className="mt-2 p-3 bg-slate-950 rounded-xl overflow-x-auto text-[11px] text-indigo-200 border border-slate-800/60 leading-relaxed shadow-inner">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
