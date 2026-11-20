import React from 'react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
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
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Ringkasan performa laga"
      description={`${activePlayer.personal_info.full_name} (#${activePlayer.personal_info.jersey_number}) · Durasi ${formatSecondsToTime(timerSeconds)}`}
      className="max-w-md"
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Kembali ke laga
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConfirmSync}
          >
            Konfirmasi dan sinkron
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-1">
        {/* Match Rating Highlight */}
        <div className="p-4 rounded-control bg-raised border border-line flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono text-2 block">
              Rating performa laga
            </span>
            <div className="font-mono text-2xl tabular-nums font-semibold text-brand mt-0.5">
              {calculatedMatchRating} <span className="text-xs text-2 font-normal">/ 10</span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="brand" size="sm">
              Evaluasi selesai
            </Badge>
          </div>
        </div>

        {/* Stat Summary Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-control bg-panel border border-line">
            <span className="text-2 block">Total umpan:</span>
            <div className="font-mono tabular-nums font-semibold text-1 mt-1">
              {stats.passesCompleted} / {stats.passesTotal} ({passAccuracy}%)
            </div>
          </div>

          <div className="p-3 rounded-control bg-panel border border-line">
            <span className="text-2 block">Umpan kunci:</span>
            <div className="font-mono tabular-nums font-semibold text-brand mt-1">
              {stats.keyPasses} peluang
            </div>
          </div>

          <div className="p-3 rounded-control bg-panel border border-line">
            <span className="text-2 block">Tekel & intersep:</span>
            <div className="font-mono tabular-nums font-semibold text-1 mt-1">
              {stats.tacklesWon} / {stats.tacklesTotal} ({tackleAccuracy}%)
            </div>
          </div>

          <div className="p-3 rounded-control bg-panel border border-line">
            <span className="text-2 block">Tembakan & gol:</span>
            <div className="font-mono tabular-nums font-semibold text-1 mt-1">
              {stats.shotsOnTarget} on target ({stats.goals} gol)
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
