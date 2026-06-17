import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Megaphone, Clock, X, ExternalLink, Globe } from 'lucide-react';

interface NewsTickerProps {
  lang: 'ar' | 'en';
}

interface NewsItem {
  id: string;
  title: string;
  url: string;
}

export default function NewsTicker({ lang }: NewsTickerProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [DateTime, setDateTime] = useState<string>('');
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [browserTitle, setBrowserTitle] = useState<string>('');

  useEffect(() => {
    // Update live clock
    const timer = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      };
      setDateTime(now.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options));
    }, 1000);

    // Fetch live global AI tech news via Algolia HackerNews API
    const fetchNews = async () => {
      try {
        const aiRes = await fetch('https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=10');
        const aiData = await aiRes.json();
        
        const stories: NewsItem[] = aiData.hits
          .filter((hit: any) => hit.title && hit.url)
          .map((hit: any) => ({
            id: `hn-${hit.objectID}`,
            title: hit.title,
            url: hit.url
          }));
        
        // Add some local app updates
        const localUpdates: NewsItem[] = [
          {
            id: 'local-1',
            title: lang === 'ar' 
              ? '🌟 شكراً للمنصات المجانية: Hugging Face | نظام الحماية الآلي للذكاء الاصطناعي مفعّل بالكامل' 
              : '🌟 Thanks to free platforms | Auto AI failover protection protocols are fully active',
            url: ''
          }
        ];
          
        setNews([...localUpdates, ...stories]);
      } catch (err) {
        console.error("Failed to load news", err);
        setNews([
          {
            id: 'err-1',
            title: lang === 'ar' ? '🌟 جاري استرداد الأخبار العالمية...' : '🌟 Retrieving global news...',
            url: ''
          }
        ]);
      }
    };

    fetchNews();
    return () => clearInterval(timer);
  }, [lang]);

  return (
    <>
      <div 
        id="news-ticker-bar" 
        className="w-full bg-slate-900 border-y border-slate-800 py-3 relative overflow-hidden shrink-0 flex items-center shadow-md select-none"
      >
        {/* 3D glow overlay borders */}
        <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_80%) pointer-events-none" />
        
        {/* Date/Time Indicator */}
        <div 
          className="relative z-10 flex items-center gap-1.5 px-3 bg-slate-800 text-slate-300 rounded-lg sm:rounded-lg font-black text-[10px] sm:text-xs tracking-wider shadow-xs ml-4 mr-0 shrink-0 border border-slate-700 py-1"
          style={{ direction: 'ltr' }}
        >
          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-cyan-400" />
          <span className="min-w-[190px] text-center">{DateTime}</span>
        </div>

        {/* Red Pulse Badge (Fixed state identifier) */}
        <div 
          className="relative z-10 flex items-center gap-1.5 px-3 py-1 bg-red-650 text-white rounded-r-lg sm:rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-xs ml-4 mr-2 shrink-0 border border-red-500/30"
          style={{ direction: 'ltr' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-150"></span>
          </span>
          <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-white animate-bounce" />
          <span>GLOBAL AI</span>
        </div>

        {/* Scrolling Text Window */}
        <div className="flex-grow overflow-hidden relative flex items-center h-full">
          <div 
            className={`font-semibold tracking-wide whitespace-nowrap cursor-pointer flex items-center
              ${lang === 'ar' ? 'animate-ticker-rtl' : 'animate-ticker-ltr'}
            `}
            style={{ animationDuration: '80s' }} // Make it run much slower
          >
            {/* Repeated mapping to create infinite illusion effect */}
            <div className="flex items-center gap-12 px-6">
              {news.map(item => (
                <div 
                  key={`feed1-${item.id}`}
                  onClick={() => {
                    if (item.url) {
                      setBrowserUrl(item.url);
                      setBrowserTitle(item.title);
                    }
                  }}
                  className={`inline-block text-transparent bg-clip-text font-black text-[14px] sm:text-[15px] transition-transform duration-300 ${item.url ? 'hover:scale-105 hover:text-cyan-300' : ''}`}
                  style={{ 
                    backgroundImage: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 50%, #22d3ee 100%)',
                    textShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
                  }}
                  title={item.title}
                >
                  {item.title} •
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Internal Browser Modal Engine */}
      <AnimatePresence>
        {browserUrl && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xl flex flex-col pt-10 px-2 sm:px-6 pb-6"
          >
            <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-t-2xl w-full max-w-7xl mx-auto flex-grow flex flex-col overflow-hidden relative">
              {/* Browser Header Controls */}
              <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                    <Globe className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-200 truncate max-w-[150px] sm:max-w-xs md:max-w-md hidden sm:inline-block">
                    {browserTitle}
                  </span>
                </div>
                
                <div className="flex items-center justify-center flex-grow mx-4 max-w-xl">
                  <div className="bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-1.5 text-xs text-slate-400 font-mono truncate w-full flex items-center gap-2.5 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate selection:bg-indigo-500/30">{browserUrl}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => window.open(browserUrl, '_blank')}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                    title={lang === 'ar' ? 'فتح في علامة تبويب جديدة' : 'Open in new tab'}
                  >
                    <ExternalLink className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={() => { setBrowserUrl(null); setBrowserTitle(''); }}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors ml-1 bg-slate-700/30"
                    title={lang === 'ar' ? 'إغلاق المتصفح' : 'Close Browser'}
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Browser Window Body */}
              <div className="flex-grow bg-white relative">
                <iframe 
                  src={browserUrl} 
                  className="w-full h-full border-none bg-slate-50"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  referrerPolicy="no-referrer"
                  title={browserTitle}
                />
                {/* Embedded Fallback Notice */}
                <div className="absolute bottom-6 right-6 max-w-xs bg-slate-900 border border-slate-700 text-slate-300 p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-xs leading-relaxed opacity-60 hover:opacity-100 transition-opacity backdrop-blur-md">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
                    <Megaphone className="h-3.5 w-3.5" />
                    {lang === 'ar' ? 'تنويه أمان' : 'Security Notice'}
                  </div>
                  {lang === 'ar' 
                    ? 'بعض المواقع الإخبارية تمنع تقنية (Iframe) لأسباب أمنية. إذا كانت الصفحة بيضاء، أو رفضت الاتصال، اضغط على زر السهم بالأعلى للوصول عبر متصفحك الأساسي.'
                    : 'Some news publishers block Iframes for security reasons. If the screen is blank or refused connection, use the top-right button to launch in your primary browser tab.'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
