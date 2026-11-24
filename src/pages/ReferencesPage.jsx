import React, { useState } from 'react';
import { BookOpen, ExternalLink, Search, AlertCircle } from 'lucide-react';
import { REFERENCES_REGISTRY } from '../data/references';

export default function ReferencesPage() {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRefs = REFERENCES_REGISTRY.filter((ref) => {
    const matchesType = filterType === 'all' || ref.type === filterType;
    const matchesSearch =
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 text-1">
      {/* Header */}
      <div className="border-b border-line pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-raised text-brand">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider text-2">
            Katalog Kepustakaan Ilmiah
          </span>
        </div>
        <h1 className="text-xl font-semibold text-1">
          Daftar Rujukan Resmi & Dokumen Verifikasi
        </h1>
        <p className="text-sm text-2 leading-relaxed max-w-2xl">
          Setiap indikator taktis, metode kematangan biologis, dan tolok ukur kebugaran di BallR wajib merujuk secara tertulis pada pustaka yang terdaftar di sini sesuai asas kejujuran data (*data honesty*).
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-2 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rujukan, penulis, atau kurikulum..."
            className="w-full pl-9 pr-3 py-1.5 bg-app border border-line rounded text-sm text-1 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-sm">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'curriculum', label: 'Kurikulum' },
            { id: 'framework', label: 'Kerangka Kerja' },
            { id: 'paper', label: 'Jurnal / Paper' },
            { id: 'law', label: 'Hukum / UU' },
            { id: 'standard', label: 'Standar' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterType(cat.id)}
              className={`px-3 py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-1 rounded-control text-sm transition-colors cursor-pointer inline-flex items-center justify-center ${
                filterType === cat.id
                  ? 'bg-raised text-1 font-medium border border-line'
                  : 'text-2 hover:text-1'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* References Table / List */}
      {filteredRefs.length === 0 ? (
        <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-2 max-w-md mx-auto">
          <AlertCircle className="w-6 h-6 mx-auto text-2" />
          <h3 className="text-sm font-semibold text-1">Belum Ada Rujukan Terdaftar</h3>
          <p className="text-sm text-2 leading-relaxed">
            Sesuai aturan data honesty, entri rujukan hanya dimasukkan dari berkas resmi <code className="text-brand">docs/REFERENCES_SEED.md</code> dan tidak ditulis dari ingatan.
          </p>
        </div>
      ) : (
        <div className="rounded-panel bg-panel border border-line overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-raised text-2 uppercase font-semibold text-sm border-b border-line">
                <tr>
                  <th className="py-2.5 px-3">Judul Rujukan</th>
                  <th className="py-2.5 px-3">Penerbit / Penulis</th>
                  <th className="py-2.5 px-3">Bagian / Hal</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Terakhir Diverifikasi</th>
                  <th className="py-2.5 px-3">Tautan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-sans">
                {filteredRefs.map((ref) => (
                  <tr key={ref.id} className="hover:bg-raised/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-1">{ref.title}</div>
                      <div className="text-sm font-mono text-2">{ref.id}</div>
                    </td>
                    <td className="py-3 px-3 text-2">
                      {ref.publisher || 'Belum terkonfirmasi'} {ref.year ? `(${ref.year})` : ''}
                    </td>
                    <td className="py-3 px-3 text-1">
                      {ref.section || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-sm bg-raised text-2">
                          {ref.type}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-sm uppercase border ${
                          ref.status === 'located'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                        }`}>
                          {ref.status || 'unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-2 tabular-nums">
                      <div>{ref.verified_on || 'Belum diverifikasi'}</div>
                      {ref.next_review_due && (
                        <div className="text-sm text-warning">Jadwal: {ref.next_review_due}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline inline-flex items-center gap-1 text-sm font-medium"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-2 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
