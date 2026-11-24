import React from 'react';
import { Ruler, Activity } from 'lucide-react';
import Badge from '../ui/Badge';
import RefChip from '../ui/RefChip';
import EmptyState from '../ui/EmptyState';
import Term from '../ux/Term';

export default function BioMaturityCard({ bioSpecs }) {
  if (!bioSpecs || bioSpecs.inputsMissing) {
    return (
      <section className="rounded-panel bg-panel border border-line p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b border-line">
          <div>
            <h3 className="text-base font-semibold text-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" strokeWidth={1.5} />
              <span>Kelompok kematangan tubuh</span>
              <Term
                explanation="Pengelompokan pemain menurut tahap pertumbuhan tubuh, bukan hanya umur."
              />
            </h3>
            <p className="text-sm text-2 mt-0.5">
              Protokol pemantauan maturitas somatik atlet muda.
            </p>
          </div>
        </div>

        <EmptyState
          title="Data pengukuran belum lengkap"
          description="Dibutuhkan data tinggi badan anak, berat badan, tanggal lahir, dan tinggi badan kedua orang tua kandung untuk kalkulasi prediksi tinggi dewasa (metode Khamis-Roche)."
        />
      </section>
    );
  }

  const currentHeight = bioSpecs.currentHeight ?? null;
  const currentWeight = bioSpecs.currentWeight ?? null;
  const bmi =
    currentHeight && currentWeight
      ? (currentWeight / ((currentHeight / 100) ** 2)).toFixed(1)
      : null;

  const methodName = bioSpecs.methodName || 'Khamis-Roche (1994)';
  const measurementDate = bioSpecs.date || bioSpecs.methodDate || 'Pengukuran terakhir';

  return (
    <section className="rounded-panel bg-panel border border-line p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="neutral">{methodName}</Badge>
            <RefChip id="khamis-roche-1994" />
          </div>
          <h3 className="text-base font-semibold text-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <span>Kelompok kematangan tubuh</span>
            <Term
              explanation="Pengelompokan pemain menurut tahap pertumbuhan tubuh, bukan hanya umur."
            />
          </h3>
          <p className="text-sm text-2 mt-0.5">
            Menilai estimasi maturitas fisik atlet muda guna merancang beban latihan yang proporsional.
          </p>
        </div>

        <div className="text-sm tabular-nums text-2 self-start sm:self-center">
          {measurementDate}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Current Stature & Mass */}
        <div className="p-4 rounded-panel bg-raised border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-sm mb-2">
            <span className="font-semibold text-sm text-1">Stature & massa saat ini</span>
            <Ruler className="w-4 h-4 text-brand" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-semibold text-1 tabular-nums">
              {currentHeight ? (
                <>
                  {currentHeight} <span className="text-sm text-2 font-normal">cm</span>
                </>
              ) : (
                <span className="text-sm font-sans font-normal text-2">Belum ada data</span>
              )}
            </div>
            <div className="text-sm text-2 mt-1 space-y-0.5">
              <div>
                Berat: <strong className="text-1 tabular-nums">{currentWeight ? `${currentWeight} kg` : 'Belum ada data'}</strong>
              </div>
              {bmi && (
                <div>
                  BMI: <strong className="text-1 tabular-nums">{bmi}</strong>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-line text-sm text-2">
            Usia kronologis: {bioSpecs.chronologicalAge ? `${bioSpecs.chronologicalAge} th` : 'Belum ada data'}
          </div>
        </div>

        {/* Prediction Status: Honest, No Fabricated Numbers */}
        <div className="p-4 rounded-panel bg-raised border border-line flex flex-col justify-between sm:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-2 text-sm">
            <span className="font-semibold text-sm text-1">Prediksi tinggi dewasa</span>
            <RefChip id="khamis-roche-1994" />
          </div>
          <p className="text-sm text-2 leading-relaxed">
            Prediksi tinggi dewasa belum tersedia: butuh tabel koefisien Khamis-Roche dari sumber primer dan tinggi kedua orang tua.
          </p>
          <div className="pt-2 border-t border-line text-sm text-2">
            Estimasi, bukan diagnosis; galat umum beberapa cm.
          </div>
        </div>
      </div>
    </section>
  );
}
