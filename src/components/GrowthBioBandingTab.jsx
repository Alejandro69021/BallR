import React, { useState, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import BioMaturityCard from './growth/BioMaturityCard';
import AthleticProgressChart from './growth/AthleticProgressChart';
import AnthropometryLogTable from './growth/AnthropometryLogTable';
import ConsentManagerModal from './growth/ConsentManagerModal';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';

export default function GrowthBioBandingTab({ player, onToast }) {
  const [activeMetric, setActiveMetric] = useState('height');
  const [selectedPointIndex, setSelectedPointIndex] = useState(0);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const { personal_info = {} } = player || {};

  // Read player's own measurement records
  const rawRecords = useMemo(() => {
    return player?.anthropometry_records || player?.anthropometry || [];
  }, [player]);

  // Sort chronological (oldest to newest) for chart progression
  const sortedRecords = useMemo(() => {
    return [...rawRecords].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [rawRecords]);

  const hasEnoughMeasurements = sortedRecords.length >= 2;

  const latestRecord = sortedRecords[sortedRecords.length - 1];

  const bioSpecs = useMemo(() => {
    return {
      currentHeight: latestRecord?.height_cm ?? latestRecord?.height ?? personal_info.height_cm ?? null,
      currentWeight: latestRecord?.weight_kg ?? latestRecord?.weight ?? personal_info.weight_kg ?? null,
      chronologicalAge: personal_info.age || null,
      methodName: 'Khamis-Roche (1994)',
      date: latestRecord?.period || latestRecord?.date || 'Pengukuran terakhir',
      referenceIds: ['khamis-roche-1994']
    };
  }, [latestRecord, personal_info]);

  // Dynamic metrics data built from player's own records
  const metricsData = useMemo(() => {
    if (!hasEnoughMeasurements) return null;

    const heightPts = sortedRecords
      .filter((r) => r.height_cm != null || r.height != null)
      .map((r) => ({
        date: r.date,
        month: r.period || r.date,
        displayDate: r.period ? r.period.split(' ').slice(0, 2).join(' ') : r.date,
        value: Number(r.height_cm ?? r.height),
        note: r.note || 'Pengukuran berkala'
      }));

    const sprintPts = sortedRecords
      .filter((r) => r.sprint_20m_sec != null)
      .map((r) => ({
        date: r.date,
        month: r.period || r.date,
        displayDate: r.period ? r.period.split(' ').slice(0, 2).join(' ') : r.date,
        value: Number(r.sprint_20m_sec),
        note: r.note || 'Tes sprint 20m'
      }));

    const jumpPts = sortedRecords
      .filter((r) => r.vertical_jump_cm != null)
      .map((r) => ({
        date: r.date,
        month: r.period || r.date,
        displayDate: r.period ? r.period.split(' ').slice(0, 2).join(' ') : r.date,
        value: Number(r.vertical_jump_cm),
        note: r.note || 'Tes vertical jump'
      }));

    const calcBounds = (pts, step) => {
      if (pts.length === 0) return { minVal: 0, maxVal: 100, step };
      const vals = pts.map((p) => p.value);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return {
        minVal: Math.floor(min - step),
        maxVal: Math.ceil(max + step),
        step
      };
    };

    const hBounds = calcBounds(heightPts, 1);
    const sBounds = calcBounds(sprintPts, 0.1);
    const jBounds = calcBounds(jumpPts, 2);

    return {
      height: {
        name: 'Tinggi badan (cm)',
        unit: 'cm',
        markerShape: 'circle',
        seriesColor: 'var(--series-1)',
        points: heightPts,
        ...hBounds,
        invertY: false
      },
      sprint: {
        name: 'Sprint 20m (detik)',
        unit: 'detik',
        markerShape: 'square',
        seriesColor: 'var(--series-2)',
        points: sprintPts,
        ...sBounds,
        invertY: true
      },
      jump: {
        name: 'Vertical Jump (cm)',
        unit: 'cm',
        markerShape: 'triangle',
        seriesColor: 'var(--series-3)',
        points: jumpPts,
        ...jBounds,
        invertY: false
      }
    };
  }, [sortedRecords, hasEnoughMeasurements]);

  // Log table rows (latest first)
  const anthropometryLogs = useMemo(() => {
    return [...sortedRecords].reverse().map((r, idx) => ({
      date: r.date,
      period: r.period || r.date,
      height: r.height_cm ?? r.height,
      weight: r.weight_kg ?? r.weight,
      sitting_height: r.sitting_height_cm ?? r.sitting_height,
      isLatest: idx === 0
    }));
  }, [sortedRecords]);

  return (
    <div className="space-y-6 pb-12 text-1">
      {/* Privacy Governance Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-panel bg-panel border border-line text-sm">
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

      {hasEnoughMeasurements && metricsData ? (
        <AthleticProgressChart
          activeMetric={activeMetric}
          setActiveMetric={setActiveMetric}
          selectedPointIndex={selectedPointIndex}
          setSelectedPointIndex={setSelectedPointIndex}
          metricsData={metricsData}
        />
      ) : (
        <div className="p-6 rounded-panel bg-panel border border-line">
          <EmptyState
            title="Belum ada data"
            description="Butuh minimal 2 sesi pengukuran berkala untuk menampilkan kurva perkembangan pertumbuhan."
          />
        </div>
      )}

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
