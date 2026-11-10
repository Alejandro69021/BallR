import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Award,
  AlertTriangle,
  Info,
  Zap,
  Flame,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Dumbbell,
  Scale,
  Ruler,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function GrowthBioBandingTab({ player }) {
  const [activeMetric, setActiveMetric] = useState('sprint'); // 'sprint' | 'jump' | 'ovr'
  const [selectedPointIndex, setSelectedPointIndex] = useState(3); // Default to latest (Oct)

  const { personal_info } = player;

  // 1. Biological Maturity & Bio-Banding Specs
  const bioSpecs = {
    maturityStatus: "On-Time Maturing",
    maturityOffset: "+0.4 yrs",
    currentHeight: personal_info.height_cm || 158,
    currentWeight: personal_info.weight_kg || 46,
    predictedAdultHeight: 174.5,
    adultHeightPct: 68.2, // Optimal development phase
    phvPhase: "Circa-PHV (Peak Height Velocity Phase)",
    biologicalAge: 13.4,
    chronologicalAge: personal_info.age || 13,
    advisoryText: "Growth Spurt Advisory: Dimas saat ini berada dalam fase laju pertumbuhan tinggi puncak (Peak Height Velocity). Pertahankan mobilitas sendi engkel & lutut, prioritaskan pemulihan tidur 8-9 jam, dan hindari beban plyometrik berlebih."
  };

  // 2. 6-Month Athletic Progress Datasets
  const metricsData = {
    sprint: {
      name: "20m Sprint (Speed)",
      icon: "🏃",
      unit: "detik",
      color: "#06B6D4", // Cyan
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
      // For sprint: lower is better, invert Y mapping so faster looks upward
      minVal: 3.35,
      maxVal: 3.75,
      invertY: true
    },
    jump: {
      name: "Vertical Jump (Power)",
      icon: "🦘",
      unit: "cm",
      color: "#84CC16", // Volt Lime
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
      color: "#F59E0B", // Amber Gold
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

  const currentDataset = metricsData[activeMetric];

  // 3. Bi-Monthly Anthropometry Measurement Log
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

  // SVG Coordinate Computation (ViewBox: 500 x 200)
  const svgWidth = 500;
  const svgHeight = 200;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 35;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getCoordinates = () => {
    const pts = currentDataset.points;
    const { minVal, maxVal, invertY } = currentDataset;

    return pts.map((pt, idx) => {
      const x = padLeft + (idx / (pts.length - 1)) * chartW;
      let ratio = (pt.value - minVal) / (maxVal - minVal);
      if (invertY) {
        ratio = 1 - ratio; // Faster (lower time) maps to higher Y position
      }
      const y = padTop + (1 - ratio) * chartH;
      return { x, y, pt, idx };
    });
  };

  const coords = getCoordinates();

  // Polyline string
  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

  // Gradient area path
  const areaPath = `M ${coords[0].x},${coords[0].y} ` +
    coords.slice(1).map((c) => `L ${c.x},${c.y}`).join(' ') +
    ` L ${coords[coords.length - 1].x},${padTop + chartH} L ${coords[0].x},${padTop + chartH} Z`;

  const selectedPt = coords[selectedPointIndex] || coords[coords.length - 1];

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* 1. BIOLOGICAL MATURITY & BIO-BANDING CARD */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-athletic font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Bio-Banding & Sports Science</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Khamis-Roche Method
              </span>
            </div>
            <h3 className="font-athletic text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Biological Maturity & Growth Velocity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Menilai kematangan biologis atlet muda guna mencegah cedera dan menentukan beban kompetisi yang proporsional.
            </p>
          </div>

          <div className="self-start sm:self-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-xs font-athletic font-bold text-amber-300 flex items-center gap-2 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>{bioSpecs.maturityStatus} ({bioSpecs.maturityOffset})</span>
            </div>
          </div>
        </div>

        {/* Biological Specs 3-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          
          {/* Card 1: Current Stature */}
          <div className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1F2937] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="uppercase font-bold tracking-wider text-[10px]">Stature & Mass Saat Ini</span>
              <Ruler className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="font-athletic text-2xl font-black text-white">
                {bioSpecs.currentHeight} <span className="text-xs font-mono text-slate-400">cm</span>
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2">
                <span>Berat: <strong>{bioSpecs.currentWeight} kg</strong></span>
                <span className="text-slate-600">•</span>
                <span>BMI: <strong>18.4</strong></span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              Usia Biologis: {bioSpecs.biologicalAge} th (Kronologis: {bioSpecs.chronologicalAge} th)
            </div>
          </div>

          {/* Card 2: Predicted Adult Height */}
          <div className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1F2937] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="uppercase font-bold tracking-wider text-[10px]">Prediksi Tinggi Dewasa</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-athletic text-2xl font-black text-emerald-400">
                ~{bioSpecs.predictedAdultHeight} <span className="text-xs font-mono text-slate-400">cm</span>
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">
                Khamis-Roche Formula (±2.1 cm)
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              Berdasarkan genetika & rasio pertumbuhan tulang
            </div>
          </div>

          {/* Card 3: Adult Stature Percentage */}
          <div className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1F2937] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="uppercase font-bold tracking-wider text-[10px]">% Tinggi Dewasa Tercapai</span>
              <Activity className="w-4 h-4 text-[#CCFF00]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-athletic text-2xl font-black text-[#CCFF00]">
                  {bioSpecs.adultHeightPct}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Circa-PHV
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-lime-500 to-[#CCFF00] rounded-full shadow-[0_0_8px_#CCFF00]"
                  style={{ width: `${bioSpecs.adultHeightPct}%` }}
                />
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-lime-400 font-medium">
              Fase optimal pembentukan akselerasi & kelincahan
            </div>
          </div>

        </div>

        {/* Sport Science Advisory Box (Amber Alert) */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-athletic text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide">
              Growth Spurt & Injury Prevention Advisory
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bioSpecs.advisoryText}
            </p>
          </div>
        </div>

      </section>

      {/* 2. INTERACTIVE 6-MONTH ATHLETIC PROGRESS CHARTS (Custom Lightweight SVG) */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        
        {/* Metric Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2937]">
          <div>
            <h4 className="font-athletic text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Longitudinal Athletic Progression (Mei - Okt 2026)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Tap titik data untuk melihat rincian catatan pelatih & perbandingan rata-rata akademi
            </p>
          </div>

          {/* Metric Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090D16] border border-[#1E2638] overflow-x-auto self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setActiveMetric('sprint');
                setSelectedPointIndex(3);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMetric === 'sprint'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sprint 20m (Kecepatan)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMetric('jump');
                setSelectedPointIndex(3);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMetric === 'jump'
                  ? 'bg-[#84CC16] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Vertical Jump (Daya Ledak)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMetric('ovr');
                setSelectedPointIndex(3);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeMetric === 'ovr'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Rating OVR (Performa)</span>
            </button>
          </div>
        </div>

        {/* Delta Stat Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937]">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-athletic font-bold border ${currentDataset.badgeBg}`}>
              Delta 6 Bulan: {currentDataset.delta} ({currentDataset.deltaPercent})
            </span>
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
              • {currentDataset.verdict}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {currentDataset.invertY ? '▲ Nilai lebih rendah = Waktu lebih cepat' : '▲ Nilai lebih tinggi = Peningkatan positif'}
          </div>
        </div>

        {/* Custom SVG Line Graph */}
        <div className="relative w-full rounded-2xl bg-black/60 border border-slate-800/80 p-2 sm:p-4 overflow-hidden">
          
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id={`grad-${activeMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={currentDataset.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={currentDataset.color} stopOpacity="0.0" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid horizontal guidelines */}
            {[0.2, 0.5, 0.8].map((ratio, i) => {
              const yVal = padTop + ratio * chartH;
              return (
                <line
                  key={i}
                  x1={padLeft - 10}
                  y1={yVal}
                  x2={svgWidth - padRight + 10}
                  y2={yVal}
                  stroke="#1F2937"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area fill under curve */}
            <path
              d={areaPath}
              fill={`url(#grad-${activeMetric})`}
            />

            {/* Main Polyline Curve */}
            <polyline
              fill="none"
              stroke={currentDataset.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
              filter="url(#glow)"
            />

            {/* Data Points / Nodes */}
            {coords.map((c) => {
              const isSelected = selectedPointIndex === c.idx;

              return (
                <g
                  key={c.idx}
                  className="cursor-pointer transition-transform"
                  onClick={() => setSelectedPointIndex(c.idx)}
                >
                  {/* Outer Pulsing Ring for Selected */}
                  {isSelected && (
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="12"
                      fill={currentDataset.color}
                      fillOpacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Halo Glow */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isSelected ? '7' : '5'}
                    fill={isSelected ? '#FFFFFF' : currentDataset.color}
                    stroke={currentDataset.color}
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />

                  {/* Value label above node */}
                  <text
                    x={c.x}
                    y={c.y - 12}
                    textAnchor="middle"
                    fill={isSelected ? '#FFFFFF' : '#94A3B8'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {c.pt.value} {currentDataset.unit === 'OVR' ? '' : currentDataset.unit}
                  </text>

                  {/* X-Axis Month Label */}
                  <text
                    x={c.x}
                    y={padTop + chartH + 20}
                    textAnchor="middle"
                    fill={isSelected ? currentDataset.color : '#64748B'}
                    fontSize="10"
                    fontFamily="sans-serif"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {c.pt.month.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

        </div>

        {/* Selected Data Point Interactive Details Card (Flawless on Mobile Tap) */}
        {selectedPt && (
          <div className="p-4 rounded-xl bg-[#090D16] border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-athletic text-sm font-extrabold text-white">
                  {selectedPt.pt.month}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Hasil: <strong className="text-white">{selectedPt.pt.value} {currentDataset.unit}</strong>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  (Rata-rata U-13: {selectedPt.pt.groupAvg} {currentDataset.unit})
                </span>
              </div>
              <p className="text-xs text-slate-300">
                💬 <em>"{selectedPt.pt.note}"</em>
              </p>
            </div>

            <div className="self-end sm:self-center shrink-0">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic font-bold ${currentDataset.badgeBg}`}>
                {selectedPt.pt.value > selectedPt.pt.groupAvg && currentDataset.invertY === false
                  ? `+${(selectedPt.pt.value - selectedPt.pt.groupAvg).toFixed(1)} di atas rata-rata`
                  : selectedPt.pt.value < selectedPt.pt.groupAvg && currentDataset.invertY === true
                  ? `${(selectedPt.pt.groupAvg - selectedPt.pt.value).toFixed(2)}s lebih gesit dari rata-rata`
                  : 'Sesuai tolok ukur usia'}
              </span>
            </div>
          </div>
        )}

      </section>

      {/* 3. BI-MONTHLY ANTHROPOMETRY MEASUREMENT LOG */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-athletic text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              <span>Bi-Monthly Anthropometry Measurement Log</span>
            </h4>
            <p className="text-xs text-slate-400">
              Pencatatan resmi berkala tinggi badan, massa tubuh, dan rasio BMI akademi
            </p>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            4 Siklus Terdata
          </span>
        </div>

        {/* Tabular List (Mobile responsive card-table) */}
        <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D16] text-[10px] font-athletic uppercase tracking-wider text-slate-400 border-b border-[#1F2937]">
              <tr>
                <th className="py-3 px-3.5">Periode Pengukuran</th>
                <th className="py-3 px-3">Tinggi Badan</th>
                <th className="py-3 px-3">Berat Badan</th>
                <th className="py-3 px-3">BMI Index</th>
                <th className="py-3 px-3">Pertumbuhan</th>
                <th className="py-3 px-3.5 text-right">Status Kesehatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/70 font-mono">
              {anthropometryLogs.map((log, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[#1F2937]/50 transition-colors ${
                    log.isLatest ? 'bg-lime-500/5' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 font-sans font-semibold text-white flex items-center gap-2">
                    {log.isLatest && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                    )}
                    <span>{log.period}</span>
                  </td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">
                    {log.height}
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    {log.weight}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {log.bmi}
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-sans font-semibold">
                    {log.growthDelta}
                  </td>
                  <td className="py-3 px-3.5 text-right font-sans">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.isLatest
                          ? 'bg-lime-500/20 text-[#CCFF00] border border-[#CCFF00]/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}
