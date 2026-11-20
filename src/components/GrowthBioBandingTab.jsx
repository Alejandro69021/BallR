import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import BioMaturityCard from './growth/BioMaturityCard';
import AthleticProgressChart from './growth/AthleticProgressChart';
import AnthropometryLogTable from './growth/AnthropometryLogTable';
import ConsentManagerModal from './growth/ConsentManagerModal';

export default function GrowthBioBandingTab({ player, onToast }) {
  const [activeMetric, setActiveMetric] = useState('sprint');
  const [selectedPointIndex, setSelectedPointIndex] = useState(3);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const { personal_info } = player;

  const bioSpecs = {
    maturityStatus: "On-Time Maturing",
    maturityOffset: "+0.4 yrs",
    currentHeight: personal_info.height_cm || null,
    currentWeight: personal_info.weight_kg || null,
    predictedAdultHeight: 174.5,
    adultHeightPct: 68.2,
    phvPhase: "Circa-PHV (Peak Height Velocity Phase)",
    biologicalAge: 13.4,
    chronologicalAge: personal_info.age || null,
    advisoryText: `Growth Spurt Advisory: ${personal_info.nickname || personal_info.full_name || 'Atlet'} saat ini berada dalam fase laju pertumbuhan tinggi puncak (Peak Height Velocity). Pertahankan mobilitas sendi engkel & lutut, prioritaskan pemulihan tidur 8-9 jam, dan hindari beban plyometrik berlebih.`
  };

  const metricsData = {
    sprint: {
      name: "20m Sprint (Speed)",
      icon: "🏃",
      unit: "detik",
      color: "#06B6D4",
      badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      delta: "-0.23s",
      deltaPercent: "-6.3% Lebih Cepat",
      verdict: "Top Tier Growth Acceleration",
      points: [
        { month: "Mei 2026", value: 3.65, groupAvg: 3.75, note: "Tes baseline awal musim U-13" },
        { month: "Juli 2026", value: 3.58, groupAvg: 3.72, note: "Peningkatan dorongan fase drive 5m pertama" },
        { month: "Agustus 2026", value: 3.50, groupAvg: 3.68, note: "Optimasi panjang langkah sprint" },
        { month: "Oktober 2026", value: 3.42, groupAvg: 3.62, note: "Rekor akademi terbaik di posisi CAM" }
      ],
      minVal: 3.35,
      maxVal: 3.75,
      invertY: true
    },
    jump: {
      name: "Vertical Jump (Power)",
      icon: "🦘",
      unit: "cm",
      color: "#84CC16",
      badgeBg: "bg-lime-500/15 text-[#CCFF00] border-[#CCFF00]/30",
      delta: "+6.5 cm",
      deltaPercent: "+17.1% Peningkatan Daya Ledak",
      verdict: "Elite Elastic Muscle Recruitment",
      points: [
        { month: "Mei 2026", value: 38.0, groupAvg: 39.5, note: "Baseline pra-fase neuromuscular" },
        { month: "Juli 2026", value: 40.5, groupAvg: 40.0, note: "Adaptasi latihan core & ankle stiffness" },
        { month: "Agustus 2026", value: 42.0, groupAvg: 40.8, note: "Waktu kontak tanah lebih singkat" },
        { month: "Oktober 2026", value: 44.5, groupAvg: 41.5, note: "Terukur via Edge-AI Camera Scanner" }
      ],
      minVal: 35.0,
      maxVal: 46.0,
      invertY: false
    },
    ovr: {
      name: "Overall OVR Progression",
      icon: "🏆",
      unit: "OVR",
      color: "#F59E0B",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      delta: "+7 Poin",
      deltaPercent: "+9.5% Lonjakan Performa",
      verdict: "Rapid Tactical & Technical Maturation",
      points: [
        { month: "Mei 2026", value: 74, groupAvg: 72, note: "Pemain promosi dari kategori U-11/12" },
        { month: "Juli 2026", value: 76, groupAvg: 73, note: "Konsistensi distribusi passing terbukti" },
        { month: "Agustus 2026", value: 78, groupAvg: 74, note: "Peran playmaker taktis utama tim" },
        { month: "Oktober 2026", value: 81, groupAvg: 75, note: "Penetapan rating resmi EA FC 81 OVR" }
      ],
      minVal: 70,
      maxVal: 84,
      invertY: false
    }
  };

  const anthropometryLogs = [
    {
      period: "Oktober 2026",
      height: "158.0 cm",
      weight: "46.0 kg",
      bmi: "18.4",
      status: "Optimal Athlete Ratio",
      growthDelta: "+1.0 cm",
      isLatest: true
    },
    {
      period: "Agustus 2026",
      height: "157.0 cm",
      weight: "45.0 kg",
      bmi: "18.3",
      status: "Normal",
      growthDelta: "+1.5 cm",
      isLatest: false
    },
    {
      period: "Juli 2026",
      height: "155.5 cm",
      weight: "44.0 kg",
      bmi: "18.2",
      status: "Normal",
      growthDelta: "+1.5 cm",
      isLatest: false
    },
    {
      period: "Mei 2026",
      height: "154.0 cm",
      weight: "43.0 kg",
      bmi: "18.1",
      status: "Normal",
      growthDelta: "Baseline",
      isLatest: false
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-white">
      {/* Privacy Governance Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-[#0C111D] border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#84CC16] shrink-0" />
          <span className="text-slate-300">
            Tata Kelola & Izin Privasi Data Atlet (UU PDP No. 27/2022 Pasal 25)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsConsentModalOpen(true)}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs transition-colors shrink-0 cursor-pointer"
        >
          Kelola Izin & Visibilitas
        </button>
      </div>

      <BioMaturityCard bioSpecs={bioSpecs} />

      <AthleticProgressChart
        activeMetric={activeMetric}
        setActiveMetric={setActiveMetric}
        selectedPointIndex={selectedPointIndex}
        setSelectedPointIndex={setSelectedPointIndex}
        metricsData={metricsData}
      />

      <AnthropometryLogTable anthropometryLogs={anthropometryLogs} />

      <ConsentManagerModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        player={player}
        onToast={onToast}
      />
    </div>
  );
}
