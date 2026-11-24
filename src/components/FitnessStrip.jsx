import React from 'react';
import Stat from './ui/Stat';
import SourceNote from './ui/SourceNote';

export default function FitnessStrip({ benchmarks }) {
  const testDate = benchmarks?.test_date || null;

  return (
    <section className="space-y-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-line">
        <div>
          <h2 className="text-base font-semibold text-1">
            Uji Kebugaran Fisik
          </h2>
          <p className="text-sm text-2">
            Parameter daya ledak, akselerasi kecepatan, kelincahan, dan kapasitas aerobik atlet.
          </p>
        </div>
        {testDate && (
          <span className="text-sm text-2">
            Tanggal tes: {testDate}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Lompatan Vertikal"
          value={benchmarks?.vertical_jump_cm}
          unit="cm"
          date={testDate}
        />

        <Stat
          label="Sprint 20 Meter"
          value={benchmarks?.sprint_20m_sec}
          unit="detik"
          date={testDate}
        />

        <Stat
          label="Shuttle Run"
          value={benchmarks?.shuttle_run_sec}
          unit="detik"
          date={testDate}
        />

        <Stat
          label="Tes Yo-Yo Intermittent"
          value={benchmarks?.yoyo_level}
          date={testDate}
        />
      </div>

      <div className="space-y-1 pt-1">
        <p className="text-sm text-2">
          * Catatan: Untuk parameter waktu sprint dan kelincahan (shuttle run), nilai lebih rendah = lebih cepat.
        </p>
        <SourceNote
          source="tes kebugaran berkala akademi"
          date={testDate || undefined}
          sampleSize={1}
        />
      </div>
    </section>
  );
}
