import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Sparkles, MessageSquare } from 'lucide-react';

interface FloatingAIButtonProps {
  onClick: () => void;
  isOpen: boolean;
  lang?: 'ar' | 'en';
}

export function FloatingAIButton({ onClick, isOpen, lang = 'ar' }: FloatingAIButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePulseRing />
      
      <button
        id="floating-sentry-fab"
        type="button"
        onClick={onClick}
        className="relative group h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 border border-white/20 transition-all hover:scale-110 active:scale-95 duration-200 focus:outline-none"
      >
        {/* Hover label block */}
        <span className="absolute right-16 pr-2 py-1 px-3 rounded-xl bg-slate-950/90 text-[11px] font-black uppercase text-cyan-400 whitespace-nowrap border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
          {lang === 'ar' ? '🧠 مساعد الذكاء الاصطناعي و Sentry' : '🧠 Sentry AI Co-Pilot'}
        </span>

        {/* Small sparkling badge */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 font-extrabold text-[8px] text-slate-900 border border-slate-950 animate-bounce">
          AI
        </span>

        {isOpen ? (
          <Cpu className="h-6 w-6 animate-pulse" />
        ) : (
          <div className="relative">
            <Cpu className="h-6 w-6 animate-spin-slow" />
            <Sparkles className="h-3 w-3 absolute -bottom-1 -right-1 text-white animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}

function AnimatePulseRing() {
  return (
    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-500/20 animate-ping -z-10 pointer-events-none scale-125" />
  );
}
