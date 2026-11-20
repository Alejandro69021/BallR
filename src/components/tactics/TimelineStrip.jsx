import React from 'react';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';

/**
 * TimelineStrip: Keyframe controls for coach-authored tactical board.
 * Allows adding, duplicating, deleting, reordering frames, and editing frame duration & coach note.
 */
export default function TimelineStrip({
  frames = [],
  activeFrameIndex = 0,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onMoveFrame,
  onUpdateFrameMeta,
  isEditing = false,
  className = ''
}) {
  const currentFrame = frames[activeFrameIndex] || frames[0] || {};
  const totalFrames = frames.length;

  return (
    <div className={`space-y-3 p-3 rounded-panel bg-panel border border-line ${className}`}>
      {/* Thumbnail row: Frames horizontal strip */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-1">
          Rangkaian bingkai ({totalFrames})
        </span>

        {isEditing && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
              onClick={onAddFrame}
            >
              Tambah bingkai
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Copy className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => onDuplicateFrame?.(activeFrameIndex)}
              disabled={totalFrames === 0}
            >
              Duplikat
            </Button>
            <IconButton
              icon={<Trash2 className="w-4 h-4 text-danger" strokeWidth={1.5} />}
              label="Hapus bingkai ini"
              variant="ghost"
              size="sm"
              disabled={totalFrames <= 1}
              onClick={() => onDeleteFrame?.(activeFrameIndex)}
            />
          </div>
        )}
      </div>

      {/* Frame selector pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {frames.map((f, idx) => {
          const isActive = idx === activeFrameIndex;
          const notePreview = f.note ? f.note.slice(0, 20) + (f.note.length > 20 ? '...' : '') : 'Tanpa catatan';

          return (
            <button
              key={`frame-pill-${idx}`}
              type="button"
              onClick={() => onSelectFrame?.(idx)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-control border text-xs min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer ${isActive
                  ? 'bg-raised border-brand text-1 font-semibold'
                  : 'bg-app border-line text-2 hover:text-1'
                }`}
              aria-label={`Bingkai ${idx + 1}: ${notePreview}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold ${isActive ? 'bg-brand text-app' : 'bg-raised text-2'
                  }`}
              >
                {idx + 1}
              </span>
              <div className="text-left">
                <div className="leading-tight">Bingkai {idx + 1}</div>
                <div className="text-2 font-mono text-xs">{f.t_ms || 2000} ms</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current frame settings (duration, reorder, coach note) */}
      <div className="pt-2 border-t border-line space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-2">Urutan bingkai:</span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <IconButton
                  icon={<ChevronLeft className="w-4 h-4" strokeWidth={1.5} />}
                  label="Geser ke kiri"
                  variant="secondary"
                  size="sm"
                  disabled={activeFrameIndex <= 0}
                  onClick={() => onMoveFrame?.(activeFrameIndex, activeFrameIndex - 1)}
                />
                <span className="text-xs font-mono text-1 px-1">
                  {activeFrameIndex + 1} / {totalFrames}
                </span>
                <IconButton
                  icon={<ChevronRight className="w-4 h-4" strokeWidth={1.5} />}
                  label="Geser ke kanan"
                  variant="secondary"
                  size="sm"
                  disabled={activeFrameIndex >= totalFrames - 1}
                  onClick={() => onMoveFrame?.(activeFrameIndex, activeFrameIndex + 1)}
                />
              </div>
            ) : (
              <span className="text-xs font-mono text-1">
                {activeFrameIndex + 1} dari {totalFrames}
              </span>
            )}
          </div>

          {/* Duration setting */}
          <div className="flex items-center gap-2">
            <label htmlFor="frame-duration-input" className="text-xs text-2">
              Durasi transisi:
            </label>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  id="frame-duration-input"
                  type="number"
                  min="500"
                  max="10000"
                  step="250"
                  value={currentFrame.t_ms ?? 2000}
                  onChange={(e) =>
                    onUpdateFrameMeta?.(activeFrameIndex, {
                      t_ms: Math.max(500, Math.min(10000, Number(e.target.value) || 2000))
                    })
                  }
                  className="w-20 px-2 py-1 text-xs font-mono rounded-control bg-app border border-control text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
                />
                <span className="text-xs text-2">ms</span>
              </div>
            ) : (
              <span className="text-xs font-mono text-1">
                {currentFrame.t_ms ?? 2000} ms
              </span>
            )}
          </div>
        </div>

        {/* Coach note for this frame */}
        <div className="space-y-1">
          <label htmlFor="frame-note-input" className="text-xs font-medium text-1">
            Catatan pelatih untuk bingkai {activeFrameIndex + 1}:
          </label>
          {isEditing ? (
            <textarea
              id="frame-note-input"
              rows={2}
              value={currentFrame.note || ''}
              onChange={(e) =>
                onUpdateFrameMeta?.(activeFrameIndex, { note: e.target.value })
              }
              placeholder="Contoh: Melebarkan jarak bek luar dan pivot turun menjemput bola."
              className="w-full px-3 py-2 text-xs rounded-control bg-app border border-control text-1 placeholder:text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          ) : (
            <p className="text-xs text-2 p-2 rounded-control bg-app border border-line italic">
              {currentFrame.note || 'Tidak ada catatan khusus untuk bingkai ini.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
