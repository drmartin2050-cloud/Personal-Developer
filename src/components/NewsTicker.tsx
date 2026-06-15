import React from 'react';
import { Sparkles, Megaphone } from 'lucide-react';

interface NewsTickerProps {
  lang: 'ar' | 'en';
}

export default function NewsTicker({ lang }: NewsTickerProps) {
  // Moving messages (Bilingual)
  const messages = [
    lang === 'ar' 
      ? '🌟 شكراً للمنصات المجانية: Hugging Face, Supabase, Vercel | استمتع بمزامنة بياناتك السحابية الحقيقية وسرعة البناء الفائقة!' 
      : '🌟 Thanks to free platforms: Hugging Face, Supabase, Vercel | Enjoy persistent multi-device syncing and extreme local speed!',
    lang === 'ar'
      ? '🔥 تحديث جديد: تم دمج حاسبة تكاليف الـ Tokens المتطورة لجميع طرازات LLM بـ 4 عملات مختلفة!'
      : '🔥 Feature Update: Live accurate token cost calculator added for top model suites in 4 global currencies!',
    lang === 'ar'
      ? '⚡ نظام Failover وحماية المفاتيح الآلي مفعّل بالكامل لتجنب انقطاع الخدمة.'
      : '⚡ Smart token credentials key-rotation & auto failover protection protocols are fully active.',
    lang === 'ar'
      ? '📱 مصمم خصيصاً بمحاذاة ثلاثية الأبعاد متجاوبة 3D ومثالية للتحكم والتحرير مباشرة من الهاتف المحمول.'
      : '📱 Built for mobile-first developer utility with rich tactile 3D CSS depth perception.'
  ];

  const scrollText = messages.join('    •    ');

  return (
    <div 
      id="news-ticker-bar" 
      className="w-full bg-slate-900 border-y border-slate-800 py-2.5 relative overflow-hidden shrink-0 flex items-center shadow-md select-none"
    >
      {/* 3D glow overlay borders */}
      <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,transparent_80%) pointer-events-none" />
      
      {/* Red Pulse Badge (Fixed state identifier) */}
      <div 
        className="relative z-10 flex items-center gap-1.5 px-3 bg-red-650 text-white rounded-r-lg sm:rounded-lg font-black text-[10px] uppercase tracking-wider shadow-xs ml-0 mr-4 shrink-0"
        style={{ direction: 'ltr' }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-150"></span>
        </span>
        <Megaphone className="h-3 w-3 shrink-0 text-white animate-bounce" />
        <span>LIVE HUB</span>
      </div>

      {/* Scrolling Text Window */}
      <div className="flex-grow overflow-hidden relative">
        <div 
          className={`font-semibold text-xs tracking-wide py-0.5 whitespace-nowrap cursor-pointer select-all select-none
            ${lang === 'ar' ? 'animate-ticker-rtl' : 'animate-ticker-ltr'}
          `}
        >
          {/* Stunning gradient texts */}
          <span 
            className="inline-block text-transparent bg-clip-text font-bold"
            style={{ 
              backgroundImage: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 50%, #22d3ee 100%)',
              textShadow: '0 0 10px rgba(99, 102, 241, 0.2)'
            }}
          >
            {scrollText}
          </span>
        </div>
      </div>
    </div>
  );
}
