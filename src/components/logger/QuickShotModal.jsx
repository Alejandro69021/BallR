import React from 'react';
import { Flame, X, ArrowRight } from 'lucide-react';
import { formatSecondsToTime } from '../../lib/calculations';

export default function QuickShotModal({
  activePlayer,
  timerSeconds,
  onClose,
  onSelectShot
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-[#111827] border-2 border-yellow-500/60 p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h5 className="font-athletic font-bold text-base text-yellow-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>Pencatatan Tembakan / Gol</span>
          </h5>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Pilih hasil tembakan untuk <strong>{activePlayer.personal_info.full_name}</strong> pada menit {formatSecondsToTime(timerSeconds)}:
        </p>

        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onSelectShot('goal')}
            className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/30 to-lime-500/30 border border-[#CCFF00] text-left hover:brightness-125 transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <div className="font-athletic font-extrabold text-[#CCFF00] text-sm">
                GOL TERCIPTA
              </div>
              <div className="text-[10px] text-slate-300">
                +1 Gol & +1 Shot On Target
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#CCFF00]" />
          </button>

          <button
            type="button"
            onClick={() => onSelectShot('shot_on_target')}
            className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-left hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <div className="font-athletic font-bold text-white text-sm">
                Shot On Target (Ditepis Kiper)
              </div>
              <div className="text-[10px] text-slate-400">
                +1 Shot On Target
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => onSelectShot('shot_off_target')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
          >
            Shot Off Target (Melebar / Terblok Bek)
          </button>
        </div>
      </div>
    </div>
  );
}
