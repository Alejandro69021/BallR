import React, { useState } from 'react';
import { BookOpen, ExternalLink, X, ShieldCheck, Calendar } from 'lucide-react';
import { getReferenceById } from '../../data/references';

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
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer align-baseline select-none"
        title={`Lihat rujukan: ${ref.title}`}
        aria-haspopup="dialog"
      >
        <BookOpen className="w-3 h-3 text-[#4FB286] shrink-0" />
        <span className="truncate max-w-[160px]">{labelText}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ref-modal-title"
        >
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} aria-hidden="true" />

          <div className="relative w-full max-w-md bg-[#0C111D] border border-slate-800 rounded-lg p-5 text-white z-10 space-y-4 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded bg-slate-800 text-[#4FB286] mt-0.5 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Rujukan Dokumen
                    </span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                      ref.status === 'located'
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}>
                      {ref.status || 'unverified'}
                    </span>
                  </div>
                  <h3 id="ref-modal-title" className="text-sm font-semibold text-white leading-snug mt-0.5">
                    {ref.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Tutup rujukan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">Penerbit / Penulis:</span>
                  <span className="text-slate-200">{ref.publisher || 'Belum terkonfirmasi'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tahun Publikasi:</span>
                  <span className="text-slate-200">{ref.year || 'Belum terkonfirmasi'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bagian / Halaman:</span>
                  <span className="text-[#4FB286] font-medium">{ref.section || ref.section_page || 'Dokumen penuh'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kategori:</span>
                  <span className="text-slate-300 capitalize">{ref.type}</span>
                </div>
              </div>

              {ref.notes && (
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                  <span className="font-semibold text-slate-200 block mb-0.5">Catatan Metodologi:</span>
                  {ref.notes}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Diverifikasi: {ref.verified_on || 'Belum diverifikasi mandiri'}
                </span>
                {ref.next_review_due && (
                  <span>Tinjauan ulang: {ref.next_review_due}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {ref.url ? (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#4FB286] hover:underline font-medium"
                >
                  <span>Buka Dokumen Sumber</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-500 italic">Tautan dokumen tidak tersedia</span>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
