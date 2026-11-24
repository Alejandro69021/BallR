import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, AlertTriangle, Check } from 'lucide-react';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Badge from '../ui/Badge';
import RefChip from '../ui/RefChip';
import Dialog from '../ui/Dialog';
import { REFERENCES_REGISTRY } from '../../data/references';

/**
 * ReferencesPanel: Attached methodology & tactical references for a scenario.
 * Coaches attach recognized framework documents with optional contextual notes.
 * Warns if all attached references are unverified.
 */
export default function ReferencesPanel({
  references = [],
  onAttachReference,
  onRemoveReference,
  onUpdateReferenceNote,
  isEditing = false,
  className = ''
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [refNote, setRefNote] = useState('');

  // Already attached IDs
  const attachedIds = new Set(references.map((r) => r.reference_id));
  const availableRegistry = REFERENCES_REGISTRY.filter((entry) => !attachedIds.has(entry.id));

  // Check if all attached references are unverified (not officially verified)
  const hasAttached = references.length > 0;
  const allUnverified = hasAttached && references.every((r) => {
    const entry = REFERENCES_REGISTRY.find((reg) => reg.id === r.reference_id);
    return !entry || entry.status !== 'verified';
  });

  const handleConfirmAttach = () => {
    if (!selectedRefId) return;
    onAttachReference?.({
      reference_id: selectedRefId,
      note: refNote.trim()
    });
    setSelectedRefId('');
    setRefNote('');
    setIsPickerOpen(false);
  };

  return (
    <div className={`space-y-3 p-4 rounded-panel bg-panel border border-line ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-1">
            Rujukan metodologi ({references.length})
          </h3>
        </div>

        {isEditing && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => setIsPickerOpen(true)}
            disabled={availableRegistry.length === 0}
          >
            Tambah rujukan
          </Button>
        )}
      </div>

      {/* Warning banner if all references are unverified */}
      {allUnverified && (
        <div
          role="alert"
          className="p-2.5 rounded-control bg-amber-500/10 border border-amber-500/20 text-warning text-sm flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="font-semibold leading-tight">Peringatan rujukan belum terverifikasi</p>
            <p className="text-2 leading-relaxed mt-0.5">
              Seluruh rujukan terlampir saat ini berstatus belum diverifikasi oleh kurikulum resmi.
            </p>
          </div>
        </div>
      )}

      {/* List of attached references */}
      {references.length === 0 ? (
        <div className="p-4 rounded-control bg-app border border-line text-center text-sm text-2 space-y-1">
          <p className="font-medium text-1">Belum ada rujukan terlampir</p>
          <p>
            {isEditing
              ? 'Skema membutuhkan minimal satu rujukan metodologi sebelum dapat diterbitkan.'
              : 'Skema ini belum memiliki rujukan dokumen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {references.map((r, idx) => {
            const entry = REFERENCES_REGISTRY.find((item) => item.id === r.reference_id);
            const status = entry?.status || 'unverified';

            return (
              <div
                key={`ref-item-${r.reference_id}-${idx}`}
                className="p-3 rounded-control bg-app border border-line flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RefChip referenceId={r.reference_id} />
                      <Badge
                        variant={status === 'verified' ? 'success' : 'neutral'}
                        size="micro"
                      >
                        {status === 'verified' ? 'Terverifikasi' : 'Belum diverifikasi'}
                      </Badge>
                    </div>
                    <p className="text-sm text-1 font-medium truncate">
                      {entry?.title || r.reference_id}
                    </p>
                    <p className="text-sm text-2 font-mono">
                      {entry?.publisher ? `${entry.publisher} • ` : ''}
                      {entry?.year || ''}
                    </p>
                  </div>

                  {isEditing && (
                    <IconButton
                      icon={<Trash2 className="w-4 h-4 text-danger" strokeWidth={1.5} />}
                      label="Lepas rujukan"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveReference?.(r.reference_id)}
                    />
                  )}
                </div>

                {/* Coach note for this reference */}
                {isEditing ? (
                  <div className="mt-1">
                    <label
                      htmlFor={`note-${r.reference_id}`}
                      className="text-sm text-2 block mb-1"
                    >
                      Catatan relevansi pelatih:
                    </label>
                    <input
                      id={`note-${r.reference_id}`}
                      type="text"
                      value={r.note || ''}
                      onChange={(e) =>
                        onUpdateReferenceNote?.(r.reference_id, e.target.value)
                      }
                      placeholder="Tulis catatan relevansi pelatih..."
                      className="w-full px-2.5 py-1 text-sm rounded-control bg-panel border border-control text-1 placeholder:text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
                    />
                    <span className="text-sm text-2 block mt-0.5 italic">
                      Contoh: Dasar fase progresi spiral bertahap.
                    </span>
                  </div>
                ) : (
                  r.note && (
                    <p className="text-sm text-2 italic pt-1 border-t border-line">
                      &ldquo;{r.note}&rdquo;
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Picker for adding reference */}
      <Dialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Pilih Rujukan Metodologi"
        description="Lampirkan pedoman resmi atau dokumen kajian yang melandasi skema taktik."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPickerOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedRefId}
              onClick={handleConfirmAttach}
            >
              Lampirkan rujukan
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {availableRegistry.map((entry) => {
            const isSelected = selectedRefId === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedRefId(entry.id)}
                className={`w-full text-left p-3 rounded-control border text-sm transition-colors flex items-start justify-between gap-3 min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isSelected
                    ? 'bg-raised border-brand text-1'
                    : 'bg-app border-line text-2 hover:text-1'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-1">
                      {entry.title}
                    </span>
                    <Badge
                      variant={entry.status === 'verified' ? 'success' : 'neutral'}
                      size="micro"
                    >
                      {entry.status === 'verified' ? 'Terverifikasi' : 'Belum diverifikasi'}
                    </Badge>
                  </div>
                  <p className="text-2 text-sm">
                    {entry.publisher} ({entry.year})
                  </p>
                  {entry.notes && (
                    <p className="text-2 text-sm line-clamp-2 italic">
                      {entry.notes}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-brand shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {selectedRefId && (
          <div className="space-y-1 pt-2 border-t border-line">
            <label htmlFor="picker-note-input" className="text-sm font-medium text-1">
              Catatan relevansi (opsional):
            </label>
            <input
              id="picker-note-input"
              type="text"
              value={refNote}
              onChange={(e) => setRefNote(e.target.value)}
              placeholder="Contoh: Bab 4 - Penataan zona sirkulasi bola."
              className="w-full px-3 py-2 text-sm rounded-control bg-app border border-control text-1 placeholder:text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
