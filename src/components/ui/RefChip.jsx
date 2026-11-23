import React, { useState } from 'react';
import { BookOpen, ExternalLink, ShieldCheck, Calendar } from 'lucide-react';
import { getReferenceById } from '../../data/references';
import Dialog from './Dialog';
import Button from './Button';

export default function RefChip({ referenceId, customLabel }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!referenceId) return null;

  const ref = getReferenceById(referenceId) || {
    id: referenceId,
    title: referenceId,
    publisher: '',
    year: '',
    type: 'standard',
    section: '',
    verified_on: '',
    status: 'unverified',
    notes: ''
  };

  const yearStr = ref.year ? ` (${ref.year})` : '';
  const labelText = customLabel || `${ref.title.length > 24 ? ref.title.slice(0, 24) + '...' : ref.title}${yearStr}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-2 py-1 sm:px-1.5 sm:py-0.5 rounded-control text-sm font-mono bg-raised hover:bg-panel text-2 hover:text-1 border border-control transition-colors cursor-pointer align-baseline select-none"
        title={`Lihat rujukan: ${ref.title}`}
        aria-haspopup="dialog"
      >
        <BookOpen className="w-3 h-3 text-brand shrink-0" />
        <span className="truncate max-w-[160px]">{labelText}</span>
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="sm"
        icon={
          <div className="p-1.5 rounded-control bg-raised text-brand shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        }
        title={
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-mono uppercase tracking-wider text-2">
                Rujukan Dokumen
              </span>
              <span className="text-sm font-mono uppercase px-1.5 py-0.2 rounded border bg-raised border-line text-2">
                {ref.status || 'unverified'}
              </span>
            </div>
            <h3 id="ref-modal-title" className="text-sm font-semibold text-1 leading-snug mt-0.5">
              {ref.title}
            </h3>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            {ref.url ? (
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand hover:underline font-medium"
              >
                <span>Buka Dokumen Sumber</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-sm text-2 italic">Tautan dokumen tidak tersedia</span>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Tutup
            </Button>
          </div>
        }
      >
        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-raised border border-line font-mono text-sm">
            <div>
              <span className="text-2 block">Penerbit / Penulis:</span>
              <span className="text-1">{ref.publisher || 'Belum terkonfirmasi'}</span>
            </div>
            <div>
              <span className="text-2 block">Tahun Publikasi:</span>
              <span className="text-1">{ref.year || 'Belum terkonfirmasi'}</span>
            </div>
            <div>
              <span className="text-2 block">Bagian / Halaman:</span>
              <span className="text-brand font-medium">{ref.section || ref.section_page || 'Dokumen penuh'}</span>
            </div>
            <div>
              <span className="text-2 block">Kategori:</span>
              <span className="text-1 capitalize">{ref.type}</span>
            </div>
          </div>

          {ref.notes && (
            <div className="p-2.5 rounded bg-raised border border-line text-2 text-sm leading-relaxed">
              <span className="font-semibold text-1 block mb-0.5">Catatan Metodologi:</span>
              {ref.notes}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-2 pt-1 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Diverifikasi: {ref.verified_on || 'Belum diverifikasi mandiri'}
            </span>
            {ref.next_review_due && (
              <span>Tinjauan ulang: {ref.next_review_due}</span>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
