import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ShieldAlert, RefreshCw, Terminal, ArrowRight } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  constructor(props: Props) {
    super(props);
    this.props = props;
  }
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL CRASH] Sentry caught unhandled exception:', error, errorInfo);
  }

  private handleRescueReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans antialiased">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500" />
          
          <div className="max-w-xl w-full text-center space-y-6">
            <div className="inline-flex p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-lg shadow-red-500/5 hover:scale-105 transition duration-350">
              <ShieldAlert className="h-12 w-12 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase bg-gradient-to-r from-red-200 via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                عذراً، انقطع اتصال لوحة التحكم المؤقت!
              </h1>
              <p className="text-sm font-bold text-indigo-400">
                SENTRY RESCUE PROTOCOL ACTIVATED
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                رصد محرك Sentry خطأ حرجاً غير متوقع في شجرة الـ React. لا تقلق، يمكنك معالجة المسارات وإعادة البناء الذاتي فوراً بنقرة واحدة.
              </p>
            </div>

            {/* Error console inspect logs */}
            <div className="p-4 bg-slate-900 border border-slate-800 text-left rounded-2xl font-mono text-xs text-slate-300 overflow-x-auto shadow-inner max-h-[160px] max-w-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <span className="flex items-center gap-1">
                  <Terminal className="h-3 w-3" />
                  <span>Crash Telemetry</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-950 font-bold text-red-400">FATAL_STATE</span>
              </div>
              <p className="text-red-400 font-extrabold">{this.state.error?.toString()}</p>
              <p className="text-[10px] text-slate-500 mt-1 break-words">{this.state.error?.stack || 'No extended stack trace logged.'}</p>
            </div>

            {/* Rescue controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-rescue-restart"
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>إجازة المحاولة مجدداً (Retry)</span>
              </button>

              <button
                id="btn-rescue-reset-complete"
                type="button"
                onClick={this.handleRescueReset}
                className="w-full sm:w-auto px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>تهيئة ومسح التخزين المؤقت</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
