import React from 'react';
import { ArrowRight } from 'lucide-react';
import Dialog from '../ui/Dialog';
import { formatSecondsToTime } from '../../lib/calculations';

export default function QuickShotModal({
  activePlayer,
  timerSeconds,
  onClose,
  onSelectShot
}) {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Pencatatan tembakan dan gol"
      description={`Pilih hasil tembakan untuk ${activePlayer.personal_info.full_name} pada menit ${formatSecondsToTime(timerSeconds)}:`}
      className="max-w-sm"
    >
      <div className="grid grid-cols-1 gap-2 pt-1 text-1">
        <button
          type="button"
          onClick={() => onSelectShot('goal')}
          className="p-3.5 rounded-control bg-raised hover:bg-panel border border-control text-left transition-colors duration-150 cursor-pointer flex items-center justify-between min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <div>
            <div className="font-semibold text-brand text-sm">
              Gol tercipta
            </div>
            <div className="text-xs text-2">
              +1 Gol & +1 tembakan tepat sasaran
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-brand" strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => onSelectShot('shot_on_target')}
          className="p-3.5 rounded-control bg-raised hover:bg-panel border border-line text-left transition-colors duration-150 cursor-pointer flex items-center justify-between min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <div>
            <div className="font-semibold text-1 text-sm">
              Tembakan tepat sasaran
            </div>
            <div className="text-xs text-2">
              +1 tembakan tepat sasaran (ditepis / tiang)
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-2" strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => onSelectShot('shot_off_target')}
          className="p-3 rounded-control bg-app hover:bg-raised border border-line text-left text-2 hover:text-1 transition-colors duration-150 cursor-pointer text-xs min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Tembakan meleset (melebar / terblok bek)
        </button>
      </div>
    </Dialog>
  );
}
