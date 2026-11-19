import React from 'react';
import { Award, X } from 'lucide-react';
import { formatSecondsToTime } from '../../lib/calculations';

export default function MatchRecapModal({
  activePlayer,
  timerSeconds,
  stats,
  passAccuracy,
  tackleAccuracy,
  calculatedMatchRating,
  onClose,
  onConfirmSync
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-[#111827] border-2 border-[#CCFF00] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-lime-500/20 text-[#CCFF00]">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-athletic text-base font-extrabold text-white">
                Ringkasan Matchday Sideline
              </h4>
              <p className="text-xs text-[#CCFF00] font-semibold">
                {activePlayer.personal_info.full_name} (#{activePlayer.personal_info.jersey_number})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Rating Highlight */}
        <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Calculated Match Rating
            </span>
            <div className="font-athletic text-3xl font-black text-[#CCFF00]">
              {calculatedMatchRating} <span className="text-sm font-normal text-slate-400">/ 10</span>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-lg bg-lime-500/20 text-[#CCFF00] border border-[#CCFF00]/40 text-xs font-bold uppercase font-athletic">
              Man of the Match
            </span>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Durasi: {formatSecondsToTime(timerSeconds)}
            </p>
          </div>
        </div>

        {/* Stat Summary Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
            <span className="text-slate-400">Total Umpan:</span>
            <div className="font-mono font-bold text-white mt-0.5">
              {stats.passesCompleted} / {stats.passesTotal} ({passAccuracy}%)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
            <span className="text-slate-400">Umpan Kunci:</span>
            <div className="font-mono font-bold text-cyan-300 mt-0.5">
              {stats.keyPasses} Peluang
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
            <span className="text-slate-400">Tekel & Rebut Bola:</span>
            <div className="font-mono font-bold text-emerald-400 mt-0.5">
              {stats.tacklesWon} / {stats.tacklesTotal} ({tackleAccuracy}%)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
            <span className="text-slate-400">Tembakan / Gol:</span>
            <div className="font-mono font-bold text-amber-400 mt-0.5">
              {stats.shotsOnTarget} On Target ({stats.goals} Gol)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Kembali ke Laga
          </button>

          <button
            type="button"
            onClick={onConfirmSync}
            className="flex-1 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-lime-400 text-black text-xs font-athletic font-extrabold uppercase tracking-wide cursor-pointer shadow-lg"
          >
            Konfirmasi & Sinkron
          </button>
        </div>
      </div>
    </div>
  );
}
