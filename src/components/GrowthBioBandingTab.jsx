import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import BioMaturityCard from './growth/BioMaturityCard';
import AthleticProgressChart from './growth/AthleticProgressChart';
import AnthropometryLogTable from './growth/AnthropometryLogTable';
import ConsentManagerModal from './growth/ConsentManagerModal';
import Button from './ui/Button';

export default function GrowthBioBandingTab({ player, onToast }) {
  const [activeMetric, setActiveMetric] = useState('height');
  const [selectedPointIndex, setSelectedPointIndex] = useState(3);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const { personal_info = {} } = player || {};

  const bioSpecs = {
    currentHeight: personal_info.height_cm || null,
    currentWeight: personal_info.weight_kg || null,
    predictedAdultHeight: 174.5,
    adultHeightPct: 68.2,
    chronologicalAge: personal_info.age || null,
    methodName: 'Khamis-Roche (1994)',
    date: '15 Okt 2026',
    referenceIds: ['khamis-roche-1994']
  };

  const metricsData = {
    height: {
      name: 'Tinggi badan (cm)',
      unit: 'cm',
      markerShape: 'circle',
      seriesColor: 'var(--series-1)',
      points: [
        { date: '2026-05-15', month: '15 Mei 2026', displayDate: '15 Mei', value: 154.0, note: 'Pengukuran awal musim' },
        { date: '2026-07-20', month: '20 Jul 2026', displayDate: '20 Jul', value: 155.5, note: 'Monitoring pertengahan siklus' },
        { date: '2026-08-30', month: '30 Agu 2026', displayDate: '30 Agu', value: 157.0, note: 'Peningkatan tinggi 1.5 cm' },
        { date: '2026-10-15', month: '15 Okt 2026', displayDate: '15 Okt', value: 158.0, note: 'Evaluasi berkala semester 1' }
      ],
      minVal: 153.0,
      maxVal: 159.0,
      step: 1.0,
      invertY: false
    },
    sprint: {
      name: 'Sprint 20m (detik)',
      unit: 'detik',
      markerShape: 'square',
      seriesColor: 'var(--series-2)',
      points: [
        { date: '2026-05-15', month: '15 Mei 2026', displayDate: '15 Mei', value: 3.65, note: 'Tes baseline awal musim' },
        { date: '2026-07-20', month: '20 Jul 2026', displayDate: '20 Jul', value: 3.58, note: 'Evaluasi fase dorongan langkah' },
        { date: '2026-08-30', month: '30 Agu 2026', displayDate: '30 Agu', value: 3.50, note: 'Perbaikan frekuensi langkah' },
        { date: '2026-10-15', month: '15 Okt 2026', displayDate: '15 Okt', value: 3.42, note: 'Catatan waktu tes berkala kedua' }
      ],
      minVal: 3.3,
      maxVal: 3.7,
      step: 0.1,
      invertY: true
    },
    jump: {
      name: 'Vertical Jump (cm)',
      unit: 'cm',
      markerShape: 'triangle',
      seriesColor: 'var(--series-3)',
      points: [
        { date: '2026-05-15', month: '15 Mei 2026', displayDate: '15 Mei', value: 38.0, note: 'Baseline pra-fase neuromuskular' },
        { date: '2026-07-20', month: '20 Jul 2026', displayDate: '20 Jul', value: 40.5, note: 'Adaptasi latihan stabilitas engkel' },
        { date: '2026-08-30', month: '30 Agu 2026', displayDate: '30 Agu', value: 42.0, note: 'Waktu kontak tanah lebih singkat' },
        { date: '2026-10-15', month: '15 Okt 2026', displayDate: '15 Okt', value: 44.5, note: 'Pengukuran berkala kedua' }
      ],
      minVal: 36.0,
      maxVal: 46.0,
      step: 2.0,
      invertY: false
    }
  };

  const anthropometryLogs = [
    {
      date: '2026-10-15',
      period: '15 Okt 2026',
      height: 158.0,
      weight: 46.0,
      sitting_height: 84.0,
      isLatest: true
    },
    {
      date: '2026-08-30',
      period: '30 Agu 2026',
      height: 157.0,
      weight: 45.0,
      sitting_height: 83.5,
      isLatest: false
    },
    {
      date: '2026-07-20',
      period: '20 Jul 2026',
      height: 155.5,
      weight: 44.0,
      sitting_height: 83.0,
      isLatest: false
    },
    {
      date: '2026-05-15',
      period: '15 Mei 2026',
      height: 154.0,
      weight: 43.0,
      sitting_height: 82.0,
      isLatest: false
    }
  ];

  return (
    <div className="space-y-6 pb-12 text-1">
      {/* Privacy Governance Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-panel bg-panel border border-line text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
          <span className="text-1">
            Tata kelola dan izin privasi data atlet (UU PDP No. 27/2022)
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsConsentModalOpen(true)}
        >
          Kelola izin dan visibilitas
        </Button>
      </div>

      <BioMaturityCard bioSpecs={bioSpecs} />

      <AthleticProgressChart
        activeMetric={activeMetric}
        setActiveMetric={setActiveMetric}
        selectedPointIndex={selectedPointIndex}
        setSelectedPointIndex={setSelectedPointIndex}
        metricsData={metricsData}
      />

      <AnthropometryLogTable
        anthropometryLogs={anthropometryLogs}
        birthDate={personal_info.birth_date}
      />

      <ConsentManagerModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        player={player}
        onToast={onToast}
      />
    </div>
  );
}
