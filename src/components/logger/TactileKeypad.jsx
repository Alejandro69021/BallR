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
    <section className="space-y-2 text-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono uppercase tracking-wider text-2">
          Tombol aksi cepat sisi lapangan
        </span>
        <span className="text-xs font-mono text-brand">
          Pemain: {activePlayer.personal_info.nickname || activePlayer.personal_info.full_name} #{activePlayer.personal_info.jersey_number}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Button 1: Successful Pass */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'pass_success',
              'Pass akurat',
              { passesCompleted: 1, passesTotal: 1 },
              'positive'
            )
          }
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-all duration-150 ease-out motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer active:opacity-85 active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            flashingBtn === 'pass_success'
              ? 'bg-brand/20 border-brand text-brand'
              : 'border-line hover:bg-raised text-1'
          }`}
        >
          <div className="flex items-center gap-1.5 text-brand font-semibold text-sm">
            <Check className="w-4 h-4" strokeWidth={1.5} />
            <span>Pass akurat</span>
          </div>
          <span className="text-xs text-2 font-mono mt-0.5">
            +1 Sukses ({passAccuracy}%)
          </span>
        </button>

        {/* Button 2: Misplaced Pass */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'pass_misplaced',
              'Pass meleset',
              { passesTotal: 1 },
              'error'
            )
          }
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-all duration-150 ease-out motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer active:opacity-85 active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger ${
            flashingBtn === 'pass_misplaced'
              ? 'bg-danger/20 border-danger text-danger'
              : 'border-line hover:bg-raised text-1'
          }`}
        >
          <div className="flex items-center gap-1.5 text-danger font-semibold text-sm">
            <X className="w-4 h-4" strokeWidth={1.5} />
            <span>Pass meleset</span>
          </div>
          <span className="text-xs text-2 font-mono mt-0.5">
            Salah umpan / keluar
          </span>
        </button>

        {/* Button 3: Key / Through Pass */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'key_pass',
              'Umpan kunci',
              { keyPasses: 1, passesCompleted: 1, passesTotal: 1 },
              'creative'
            )
          }
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-all duration-150 ease-out motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer active:opacity-85 active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            flashingBtn === 'key_pass'
              ? 'bg-series-1/20 border-series-1 text-series-1'
              : 'border-line hover:bg-raised text-1'
          }`}
        >
          <div className="flex items-center gap-1.5 text-series-1 font-semibold text-sm">
            <Target className="w-4 h-4" strokeWidth={1.5} />
            <span>Umpan kunci</span>
          </div>
          <span className="text-xs text-2 font-mono mt-0.5">
            Peluang / terobosan
          </span>
        </button>

        {/* Button 4: Tackle / Intercept Won */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'tackle_won',
              'Tekel berhasil',
              { tacklesWon: 1, tacklesTotal: 1 },
              'positive'
            )
          }
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-all duration-150 ease-out motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer active:opacity-85 active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            flashingBtn === 'tackle_won'
              ? 'bg-brand/20 border-brand text-brand'
              : 'border-line hover:bg-raised text-1'
          }`}
        >
          <div className="flex items-center gap-1.5 text-brand font-semibold text-sm">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
            <span>Tekel & intersep</span>
          </div>
          <span className="text-xs text-2 font-mono mt-0.5">
            Duel darat sukses
          </span>
        </button>

        {/* Button 5: Ball Turnover / Lost */}
        <button
          type="button"
          onClick={() =>
            logEvent(
              'turnover',
              'Kehilangan bola',
              { turnovers: 1 },
              'error'
            )
          }
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-all duration-150 ease-out motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer active:opacity-85 active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning ${
            flashingBtn === 'turnover'
              ? 'bg-warning/20 border-warning text-warning'
              : 'border-line hover:bg-raised text-1'
          }`}
        >
          <div className="flex items-center gap-1.5 text-warning font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
            <span>Kehilangan bola</span>
          </div>
          <span className="text-xs text-2 font-mono mt-0.5">
            Turnover penguasaan
          </span>
        </button>

        {/* Button 6: Shot On Target / Goal */}
        <button
          type="button"
          onClick={onOpenShotModal}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-all duration-150 ease-out motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer active:opacity-85 active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            flashingBtn === 'shot'
              ? 'bg-brand/20 border-brand text-brand'
              : 'border-line hover:bg-raised text-1'
          }`}
        >
          <div className="flex items-center gap-1.5 text-brand font-semibold text-sm">
            <Flame className="w-4 h-4" strokeWidth={1.5} />
            <span>Tembakan & gol</span>
          </div>
          <span className="text-xs text-2 font-mono mt-0.5">
            Pilih on target / gol
          </span>
        </button>
      </div>
    </section>
  );
}
