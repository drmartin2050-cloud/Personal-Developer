import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, Copy, ClipboardCheck, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { AdvancedErrorInfo } from '../types';
import { diagnoseError } from '../utils/errorDiagnoser';
import { safeCopyToClipboard } from '../utils/clipboard';

interface ErrorDisplayProps {
  error: AdvancedErrorInfo;
  onCopySuccess?: () => void;
  lang?: 'ar' | 'en';
}

export function ErrorDisplay({ error, onCopySuccess, lang = 'ar' }: ErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Dynamic error diagnostic suggestions!
  const diagnostics = diagnoseError(error.message, error.statusCode, error.provider);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50/95 border-red-200',
          text: 'text-red-900',
          iconColor: 'text-red-600',
          icon: ShieldAlert,
          label: lang === 'ar' ? 'خطأ حرج (Critical)' : 'Critical Error'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/95 border-amber-200',
          text: 'text-amber-900',
          iconColor: 'text-amber-600',
          icon: AlertTriangle,
          label: lang === 'ar' ? 'تنبيه تحذيري (Warning)' : 'Warning Alert'
        };
      default:
        return {
          bg: 'bg-blue-50/95 border-blue-200',
          text: 'text-blue-900',
          iconColor: 'text-blue-600',
          icon: Info,
          label: lang === 'ar' ? 'معلومات عامة (Info)' : 'Diagnostic Info'
        };
    }
  };

  const style = getSeverityStyle(error.severity);
  const IconComponent = style.icon;

  const handleCopyDetails = () => {
    const detailsText = `
--- TELEMETRY DIAGNOSTICS REPORT ---
Timestamp: ${error.timestamp}
Provider: ${error.provider.toUpperCase()}
Status Code: ${error.statusCode || 'N/A'}
Error Message: ${error.message}
Masked Key: ${error.maskedKey}
Severity: ${error.severity.toUpperCase()}
Root Cause Suggestion: ${diagnostics.rootCauseEn}
Suggested Fix: ${diagnostics.suggestionEn}
    `.trim();

    safeCopyToClipboard(detailsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopySuccess) onCopySuccess();
  };

  return (
    <div id={`error-display-${error.id}`} className={`p-4 rounded-xl border ${style.bg} ${style.text} transition-all shadow-md backdrop-blur-md relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
      
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white/80 shadow-sm ${style.iconColor}`}>
          <IconComponent className="h-5 w-5 animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/90 border border-slate-200 tracking-wider">
              {style.label}
            </span>
            {error.statusCode && (
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-600 text-white">
                HTTP {error.statusCode}
              </span>
            )}
            <span className="text-[10px] opacity-60 font-mono font-medium">
              {error.timestamp}
            </span>
          </div>

          <h3 className="font-bold text-slate-800 mt-2 text-sm md:text-base leading-snug break-words">
            {lang === 'ar' ? 'فشل استدعاء البوابة:' : 'API Channel Failed:'} <span className="font-mono text-red-600 text-xs md:text-sm">{error.message}</span>
          </h3>

          <div className="mt-3 bg-white/90 p-3 rounded-lg border border-slate-200 shadow-inner">
            <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
              <span>{lang === 'ar' ? '🔍 التشخيص الذكي والسبب الجذري:' : '🔍 Sentry Intelligent Roots:'}</span>
            </h4>
            <p className="text-xs text-slate-800 mt-1 font-medium leading-relaxed">
              {lang === 'ar' ? diagnostics.rootCauseAr : diagnostics.rootCauseEn}
            </p>
            
            <div className="mt-3 flex flex-col gap-2 p-2 bg-indigo-50/50 rounded-md border border-indigo-100">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-widest">{lang === 'ar' ? '💡 الحل البرمجي المقترح:' : '💡 Self-Medicating Repair Suggestion:'}</span>
              <p className="text-xs text-slate-700 italic">
                {lang === 'ar' ? diagnostics.suggestionAr : diagnostics.suggestionEn}
              </p>
              
              <div className="mt-1">
                <a
                  href={diagnostics.actionLink}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold underline transition"
                >
                  <span>{lang === 'ar' ? diagnostics.actionLinkLabelAr : diagnostics.actionLinkLabelEn}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              id={`btn-copy-error-${error.id}`}
              type="button"
              onClick={handleCopyDetails}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition hover:-translate-y-0.5"
            >
              {copied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ تقرير التتبع' : 'Copy Telemetry Report')}</span>
            </button>

            <button
              id={`btn-toggle-error-details-${error.id}`}
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1.5 rounded-lg bg-white/90 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{expanded ? (lang === 'ar' ? 'إخفاء التفاصيل' : 'Hide Details') : (lang === 'ar' ? 'تفاصيل المطور الفنية' : 'Developer Details')}</span>
            </button>
          </div>

          {expanded && (
            <div className="mt-3 p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800 shadow-inner max-w-full">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="text-slate-500 uppercase font-black text-[9px] tracking-wider">{lang === 'ar' ? 'تتبع مسار مصفوفات المطورين' : 'DEVELOPER DEBUGFS'}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 font-black text-emerald-400">PROXY: MODE_AUTO</span>
              </div>
              <p><span className="text-slate-500">PROVIDER_ID :</span> {error.provider.toUpperCase()}</p>
              <p><span className="text-slate-500">MASKED_KEY  :</span> {error.maskedKey}</p>
              <p><span className="text-slate-500">TIMESTAMP   :</span> {error.timestamp}</p>
              <p><span className="text-slate-500">HTTP_STATUS :</span> {error.statusCode || '200 OK (CORS Blocked)'}</p>
              <div className="mt-2 text-slate-300 border-t border-slate-900 pt-2 break-all whitespace-pre-wrap leading-relaxed">
                <div className="text-slate-500 font-black text-[9px] mb-1">{lang === 'ar' ? 'محتوى الرد الفني للاستدعاء:' : 'RAW SERVER RESPONSE TELEMETRY:'}</div>
                {error.responseBody || 'Unknown empty stack trace. Browser detected call drops.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
