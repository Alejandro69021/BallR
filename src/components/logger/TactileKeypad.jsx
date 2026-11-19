import React from 'react';
import {
  Check,
  X,
  Target,
  Shield,
  AlertTriangle,
  Flame
} from 'lucide-react';

export default function TactileKeypad({
  activePlayer,
  flashingBtn,
  passAccuracy,
  logEvent,
  onOpenShotModal
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-athletic font-bold uppercase tracking-wider text-slate-400">
          Sideline 1-Thumb Action Grid (Tap Cepat)
        </span>
        <span className="text-[11px] font-mono text-[#CCFF00]">
          Track: {activePlayer.personal_info.nickname || activePlayer.personal_info.full_name} #{activePlayer.personal_info.jersey_number}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Button 1: Successful Pass */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'pass_success',
              'Pass Akurat',
              'text-[#84CC16]',
              { passesCompleted: 1, passesTotal: 1 },
              'positive'
            )
          }
          className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
            flashingBtn === 'pass_success'
              ? 'bg-lime-500/25 border-[#84CC16]'
              : 'border-lime-500/30 hover:border-[#84CC16] hover:bg-[#151C2C]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[#84CC16] font-athletic font-bold text-sm sm:text-base">
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>PASS AKURAT</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            +1 Sukses ({passAccuracy}%)
          </span>
        </button>

        {/* Button 2: Misplaced Pass */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'pass_misplaced',
              'Pass Meleset',
              'text-rose-400',
              { passesTotal: 1 },
              'error'
            )
          }
          className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
            flashingBtn === 'pass_misplaced'
              ? 'bg-rose-500/25 border-rose-500'
              : 'border-rose-500/30 hover:border-rose-500 hover:bg-[#151C2C]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-rose-400 font-athletic font-bold text-sm sm:text-base">
            <X className="w-5 h-5 stroke-[2.5]" />
            <span>PASS MELESET</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Salah Umpan / Out
          </span>
        </button>

        {/* Button 3: Key / Through Pass */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'key_pass',
              'Umpan Kunci (xA)',
              'text-cyan-400',
              { keyPasses: 1, passesCompleted: 1, passesTotal: 1 },
              'creative'
            )
          }
          className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
            flashingBtn === 'key_pass'
              ? 'bg-cyan-500/25 border-cyan-400'
              : 'border-cyan-500/30 hover:border-cyan-400 hover:bg-[#151C2C]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-cyan-400 font-athletic font-bold text-sm sm:text-base">
            <Target className="w-5 h-5" />
            <span>UMPAN KUNCI</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Through Ball / Peluang
          </span>
        </button>

        {/* Button 4: Tackle / Intercept Won */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'tackle_won',
              'Tekel & Intersep',
              'text-emerald-400',
              { tacklesWon: 1, tacklesTotal: 1 },
              'positive'
            )
          }
          className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
            flashingBtn === 'tackle_won'
              ? 'bg-emerald-500/25 border-emerald-400'
              : 'border-emerald-500/30 hover:border-emerald-400 hover:bg-[#151C2C]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-emerald-400 font-athletic font-bold text-sm sm:text-base">
            <Shield className="w-5 h-5" />
            <span>REBUT / TEKEL</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Duel Darat Sukses
          </span>
        </button>

        {/* Button 5: Ball Turnover / Lost */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'turnover',
              'Kehilangan Bola',
              'text-amber-400',
              { turnovers: 1 },
              'error'
            )
          }
          className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
            flashingBtn === 'turnover'
              ? 'bg-amber-500/25 border-amber-400'
              : 'border-amber-500/30 hover:border-amber-400 hover:bg-[#151C2C]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-amber-400 font-athletic font-bold text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>TURNOVER BOLA</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Kehilangan Penguasaan
          </span>
        </button>

        {/* Button 6: Shot On Target / Goal */}
        <button
          type="button"
          onClick={onOpenShotModal}
          className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
            flashingBtn === 'shot'
              ? 'bg-yellow-500/25 border-yellow-400'
              : 'border-yellow-500/30 hover:border-yellow-400 hover:bg-[#151C2C]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-yellow-300 font-athletic font-bold text-sm sm:text-base">
            <Flame className="w-5 h-5" />
            <span>TEMBAKAN / GOL</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Pilih On Target / Gol
          </span>
        </button>
      </div>
    </section>
  );
}
