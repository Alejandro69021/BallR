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
    <div className="space-y-6 max-w-5xl mx-auto text-white pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-800 text-[#4FB286]">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Katalog Kepustakaan Ilmiah
          </span>
        </div>
        <h1 className="text-xl font-semibold text-white">
          Daftar Rujukan Resmi & Dokumen Verifikasi
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          Setiap indikator taktis, metode kematangan biologis, dan tolok ukur kebugaran di BallR wajib merujuk secara tertulis pada pustaka yang terdaftar di sini sesuai asas kejujuran data (*data honesty*).
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rujukan, penulis, atau kurikulum..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#4FB286]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs">
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
              className={`px-2.5 py-1 rounded text-[11px] transition-colors whitespace-nowrap cursor-pointer ${
                filterType === cat.id
                  ? 'bg-slate-800 text-white font-medium border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* References Table / List */}
      {filteredRefs.length === 0 ? (
        <div className="p-8 text-center rounded-lg bg-[#0C111D] border border-slate-800 space-y-2 max-w-md mx-auto">
          <AlertCircle className="w-6 h-6 mx-auto text-slate-500" />
          <h3 className="text-sm font-semibold text-white">Belum Ada Rujukan Terdaftar</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sesuai aturan data honesty, entri rujukan hanya dimasukkan dari berkas resmi <code className="text-[#4FB286]">docs/REFERENCES_SEED.md</code> dan tidak ditulis dari ingatan.
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-[#0C111D] border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Judul Rujukan</th>
                  <th className="py-2.5 px-3">Penerbit / Penulis</th>
                  <th className="py-2.5 px-3">Bagian / Hal</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Terakhir Diverifikasi</th>
                  <th className="py-2.5 px-3">Tautan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredRefs.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{ref.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">{ref.id}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {ref.publisher || 'Belum terkonfirmasi'} {ref.year ? `(${ref.year})` : ''}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200">
                      {ref.section || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          {ref.type}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase border ${
                          ref.status === 'located'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        }`}>
                          {ref.status || 'unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      <div>{ref.verified_on || 'Belum diverifikasi'}</div>
                      {ref.next_review_due && (
                        <div className="text-[10px] text-amber-400">Jadwal: {ref.next_review_due}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4FB286] hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">-</span>
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
