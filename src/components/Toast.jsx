import React, { useEffect } from 'react';
import { Check, ShieldCheck, X } from 'lucide-react';

export default function Toast({ message, subtext, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-[#111827] border-2 border-[#CCFF00] rounded-xl p-3.5 shadow-2xl shadow-[#CCFF00]/20 flex items-start gap-3 animate-slideUp">
      <div className="p-1.5 rounded-lg bg-[#CCFF00]/15 text-[#CCFF00] shrink-0 mt-0.5">
        <Check className="w-4 h-4 stroke-[3]" />
      </div>

      <div className="flex-1 pr-1">
        <div className="text-xs font-bold text-white tracking-wide">
          {message}
        </div>
        {subtext && (
          <div className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
            {subtext}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

