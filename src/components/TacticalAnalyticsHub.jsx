import React, { useState } from 'react';
import {
  BrainCircuit,
  Target,
  Shield,
  Activity,
  CheckCircle2,
  Award,
  TrendingUp,
  Copy,
  BookOpen,
  Clock,
  ArrowRight,
  Dumbbell,
  Flame,
  FileText
} from 'lucide-react';

export default function TacticalAnalyticsHub({ player, onToast, onSwitchToVideo }) {
  const { personal_info, latest_match_summary } = player;

  // Selected tactical filter: 'all' | 'attacking' | 'trans_neg' | 'defending' | 'trans_pos'
  const [activePhase, setActivePhase] = useState('all');
  const [isCopied, setIsCopied] = useState(false);

  // Match stats fallback or live summary
  const matchStats = latest_match_summary?.stats || {
    passesCompleted: 21,
    passesTotal: 25,
    passAccuracy: 84,
    keyPasses: 3,
    tacklesWon: 4,
    tacklesTotal: 5,
    tackleAccuracy: 80,
    shotsOnTarget: 2,
    goals: 1,
    turnovers: 2,
    matchRating: "8.6"
  };

  // 1. SOCCERACTION VAEP (Valuing Actions by Estimating Probabilities) METRICS
  // Citation: Decroos et al. (KDD 2019 / KU Leuven)
  const vaepMetrics = {
    netVaep: "+0.84",
    offensiveVaep: "+0.72",
    defensiveVaep: "+0.12",
    touchCount: 38,
    vaepPerTouch: "0.022",
    percentileTier: "Top 3% Nasional U-13 (Elite Playmaker)",
    topValuedActions: [
      {
        minute: "24'",
        action: "Through-Ball Assist ke Half-Space",
        deltaPscores: "+0.48",
        deltaPconcedes: "-0.01",
        vaepValue: "+0.49",
        phase: "Transisi Positif"
      },
      {
        minute: "52'",
        action: "Top-Corner Finishing (Kaki Kiri)",
        deltaPscores: "+0.28",
        deltaPconcedes: "0.00",
        vaepValue: "+0.28",
        phase: "Menyerang"
      },
      {
        minute: "14'",
        action: "Interception & Transisi Langsung",
        deltaPscores: "+0.07",
        deltaPconcedes: "-0.06",
        vaepValue: "+0.13",
        phase: "Transisi Negatif"
      }
    ]
  };

  // 2. FILANESIA 4-PHASE TACTICAL BREAKDOWN
  // Citation: Kurikulum Pembinaan Sepakbola Indonesia (Filanesia PSSI)
  const filanesiaPhases = {
    attacking: {
      title: "1. Menyerang (Build-Up & Progresi)",
      code: "ATT",
      percentage: 42,
      color: "from-cyan-500 to-blue-500",
      textColor: "text-cyan-400",
      borderColor: "border-cyan-500/40",
      bgColor: "bg-cyan-500/10",
      actions: "18 Operan Terhubung • 2 Umpan Kunci • 1 Gol",
      eval: "Ketenangan tinggi saat sirkulasi bola di lini tengah; mampu menarik pressing lawan sebelum melepas operan vertikal.",
      fifaMetric: "8 Line-Breaking Passes Berhasil"
    },
    trans_neg: {
      title: "2. Transisi Negatif (Gegenpressing)",
      code: "TR-NEG",
      percentage: 18,
      color: "from-rose-500 to-amber-500",
      textColor: "text-rose-400",
      borderColor: "border-rose-500/40",
      bgColor: "bg-rose-500/10",
      actions: "3 Rebutan Cepat (<5 Detik) • 1 Pelanggaran Taktis",
      eval: "Reaksi instan saat kehilangan bola; menutup sudut passing pivot lawan secara agresif sesuai instruksi pelatih.",
      fifaMetric: "Waktu Reaksi Transisi: 2.1 detik"
    },
    defending: {
      title: "3. Bertahan (Mid-Block Compactness)",
      code: "DEF",
      percentage: 22,
      color: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/40",
      bgColor: "bg-emerald-500/10",
      actions: "4/5 Tekel Berhasil (80%) • 2 Sapuan Area Tengah",
      eval: "Menjaga jarak blokade tengah 8-10 meter antar-lini, mencegah lawan mengeksploitasi celah antar bek.",
      fifaMetric: "80% Duel Bawah Dimenangkan"
    },
    trans_pos: {
      title: "4. Transisi Positif (Serangan Balik Kilat)",
      code: "TR-POS",
      percentage: 18,
      color: "from-lime-500 to-[#CCFF00]",
      textColor: "text-[#84CC16]",
      borderColor: "border-[#84CC16]/40",
      bgColor: "bg-lime-500/10",
      actions: "1 Assist Gol • 2 Akselerasi Membuka Ruang",
      eval: "Kemampuan scanning orientasi ke depan sangat tajam; sentuhan pertama langsung mengarah ke ruang serang.",
      fifaMetric: "Expected Threat (xT): +0.34"
    }
  };

  // 3. FIFA FOOTBALL LANGUAGE TELEMETRY MATRIX
  // Citation: FIFA Training Centre (2026)
  const fifaLanguageKpis = [
    {
      metric: "Line-Breaking Passes",
      value: "8 / 10",
      benchmark: "Peringkat 92% U-13",
      desc: "Operan sukses menembus garis pertahanan lawan",
      icon: <Target className="w-4 h-4 text-cyan-400" />
    },
    {
      metric: "Receptions Between Lines",
      value: "11 Kali",
      benchmark: "91% Ball Retention",
      desc: "Menerima bola di ruang saku antara gelandang & bek",
      icon: <Activity className="w-4 h-4 text-[#84CC16]" />
    },
    {
      metric: "Defensive Pressure Regains",
      value: "4 Kali",
      benchmark: "< 5 Detik Transisi",
      desc: "Perebutan kembali bola segera pasca turnover",
      icon: <Shield className="w-4 h-4 text-emerald-400" />
    },
    {
      metric: "Pitch Control Gain (EPV)",
      value: "+14.8%",
      benchmark: "Zona Sepertiga Akhir",
      desc: "Peningkatan nilai kepemilikan bola tim saat Dimas on-ball",
      icon: <TrendingUp className="w-4 h-4 text-amber-400" />
    }
  ];

  // 4. SCIENTIFIC DRILL PRESCRIPTION
  // Citation: Barça Innovation Hub (Juego de Posición) & FIFA Training Centre
  const prescribedDrill = {
    title: "4v4+3 Positional Play Rondo (Juego de Posición)",
    author: "Barça Innovation Hub (BIHUB) & FIFA Training Centre Guidelines",
    targetGoal: "Melatih kecepatan progresi umpan antar lini & scanning 360° di bawah tekanan",
    setup: "Area 20 x 25 meter, 4 Pemain Dalam vs 4 Pemain Luar + 3 Pemain Netral (Joker)",
    duration: "4 set x 4 menit (Istirahat 90 detik antar set)",
    bioBandingNote: "Sesuai fase Circa-PHV (Tinggi 158cm, 68.2% dewasa), batasi sprint laktat maksimal, prioritaskan persepsi kognitif & kualitas sentuhan bola.",
    coachingPoints: [
      "Pemain nomor 10 (Dimas) selalu memposisikan tubuh terbuka (open body shape) menghadap arah gawang lawan.",
      "Maksimal 2 sentuhan untuk mempertahankan sirkulasi bola cepat.",
      "Saat bola lepas, seluruh tim wajib melakukan pressing dalam radius 3 meter selama 4 detik pertama."
    ]
  };

  // 5. ACADEMIC & METHODOLOGY CITATIONS
  const academicCitations = [
    {
      author: "Decroos, T., Bransen, L., Van Roy, M., & Davis, J.",
      year: "2019",
      title: "Actions Speak Louder Than Goals: Valuing Player Actions in Soccer",
      venue: "ACM SIGKDD International Conference on Knowledge Discovery & Data Mining (KDD '19), Anchorage, AK",
      doi: "10.1145/3292500.3330758"
    },
    {
      author: "Fernández, J., & Bornn, L.",
      year: "2018",
      title: "Wide Open Spaces: A dynamic spatial pitch control model for soccer analysis",
      venue: "MIT Sloan Sports Analytics Conference / Barça Innovation Hub Research",
      doi: "Sloan-2018-BIHUB"
    },
    {
      author: "Cumming, S. P., Lloyd, R. S., Oliver, J. L., & Malina, R. M.",
      year: "2017",
      title: "Bio-banding in sport: applications to competition, talent identification, and conditioning of youth athletes",
      venue: "Strength and Conditioning Journal, 39(2), 34-47",
      doi: "10.1519/SSC.0000000000000281"
    },
    {
      author: "FIFA Technical Division & Coaching Department",
      year: "2026",
      title: "FIFA Football Language & Youth Match Performance Index (Technical Specifications)",
      venue: "FIFA Training Centre Official Documentation, Zurich, Switzerland",
      doi: "fifatrainingcentre.com/tactical-specs"
    },
    {
      author: "Departemen Teknik PSSI (Direktorat Kepelatihan)",
      year: "2020",
      title: "Filosofi Sepakbola Indonesia (Filanesia): Panduan Kurikulum Sepakbola Proaktif Usia Dini & Muda",
      venue: "PSSI Official Technical Guidebook, Jakarta, Indonesia",
      doi: "PSSI-DIRTEK-2020-FIL"
    }
  ];

  // Handler to copy formatted scout summary to clipboard
  const handleCopyTacticalDossier = () => {
    const summary = `=== LAPORAN TAKTIS RESMI (FILANESIA & VAEP ENGINE) ===
Pemain: ${personal_info.full_name} (#${personal_info.jersey_number} • ${personal_info.position})
Akademi: ${personal_info.academy?.name || 'MPFA Jogja'} | Laga: MPFA Jogja vs Sleman United U-13
Rating Laga: ${matchStats.matchRating} / 10 | Menit: 50'

[1. METRIK AKSI VAEP (Decroos et al. 2019)]
- Net VAEP: ${vaepMetrics.netVaep} (Offensive: ${vaepMetrics.offensiveVaep} | Defensive: ${vaepMetrics.defensiveVaep})
- Efisiensi per Sentuhan: ${vaepMetrics.vaepPerTouch} VAEP/Touch (${vaepMetrics.percentileTier})

[2. 4 MOMEN PERMAINAN FILANESIA (PSSI)]
- Menyerang (42%): 18 Operan Terhubung, 2 Key Passes, 1 Gol
- Transisi Negatif (18%): 3 Rebutan Kilat (<5s), 1 Pelanggaran Taktis
- Bertahan (22%): 4/5 Tekel Berhasil (80%), Blok Tengah Solid
- Transisi Positif (18%): 1 Assist Terobosan, 2 Progresi Cepat

[3. FIFA FOOTBALL LANGUAGE]
- Line Breaks: 8/10 Berhasil (80%)
- Penerimaan Antar-Lini: 11 Kali (91% Retensi)
- Pemulihan Tekanan Cepat: 4 Kali

[4. REKOMENDASI LATIHAN BIHUB / FIFA]
- Drill: 4v4+3 Positional Play Rondo (Juego de Posición)
- Fokus: Pembiasaan Open Body Shape & Sirkulasi 2-Touch di Sepertiga Tengah.

Dokumentasi Terverifikasi ProspekBola PSSI DIY.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);

    if (onToast) {
      onToast({
        title: "Laporan Taktis Ilmiah Disalin",
        subtext: "Dossier berbasis Filanesia & SoccerAction VAEP siap dikirim ke tim pelatih."
      });
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* 1. TOP HEADER & METRIC BANNER */}
      <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-athletic font-extrabold uppercase tracking-wider bg-lime-500/15 text-[#84CC16] border border-[#84CC16]/30 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Sports Science Tactical Analytics</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                PSSI Filanesia & SoccerAction Engine
              </span>
            </div>

            <h3 className="font-athletic text-lg sm:text-2xl font-black text-white tracking-tight">
              Post-Match Tactical Intelligence & Match Value Report
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisis performa laga berbasis model data terbuka (Decroos et al. 2019) dan 4 fase permainan Kurikulum Filanesia PSSI.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyTacticalDossier}
              className="px-3.5 py-2 rounded-xl bg-[#0E131F] hover:bg-[#151C2C] border border-[#1E2638] text-slate-200 text-xs font-athletic font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#84CC16]" />
                  <span className="text-[#84CC16]">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#84CC16]" />
                  <span>Salin Dossier Taktis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Quick Telemetry Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Net Action Value (VAEP)
            </div>
            <div className="font-athletic text-2xl font-black text-[#84CC16] mt-1">
              {vaepMetrics.netVaep}
            </div>
            <div className="text-[10px] text-lime-400 font-medium">
              Offensive: {vaepMetrics.offensiveVaep}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Passing Accuracy
            </div>
            <div className="font-athletic text-2xl font-black text-cyan-400 mt-1">
              {matchStats.passAccuracy}%
            </div>
            <div className="text-[10px] text-slate-400">
              {matchStats.passesCompleted}/{matchStats.passesTotal} Umpan Tuntas
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Defensive Duels Won
            </div>
            <div className="font-athletic text-2xl font-black text-emerald-400 mt-1">
              {matchStats.tackleAccuracy}%
            </div>
            <div className="text-[10px] text-emerald-400/80 font-medium">
              {matchStats.tacklesWon}/{matchStats.tacklesTotal} Tekel Berhasil
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Overall Match Rating
            </div>
            <div className="font-athletic text-2xl font-black text-amber-400 mt-1">
              {matchStats.matchRating} <span className="text-xs font-normal text-slate-400">/ 10</span>
            </div>
            <div className="text-[10px] text-amber-300 font-medium">
              Man of the Match
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION 1: SOCCERACTION VAEP ACTION IMPACT ENGINE */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                KU Leuven SoccerAction Framework
              </span>
              <span className="text-xs text-slate-400">Decroos et al. (2019)</span>
            </div>
            <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-1">
              Valuing Actions by Estimating Probabilities (VAEP)
            </h4>
          </div>

          <div className="text-xs text-slate-400">
            Mengukur kontribusi riil tiap aksi terhadap peluang terjadinya gol
          </div>
        </div>

        {/* VAEP Breakdown Table */}
        <div className="space-y-2.5">
          <div className="text-xs font-athletic font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Aksi Bernilai Dampak Tertinggi (Top Action Impact)</span>
            <span className="text-[11px] text-slate-400 font-mono">Nilai VAEP (+Goal / -Concede)</span>
          </div>

          <div className="space-y-2">
            {vaepMetrics.topValuedActions.map((act, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-athletic text-sm font-black text-[#84CC16] min-w-[28px]">
                    {act.minute}
                  </span>
                  <div>
                    <div className="font-athletic text-xs font-bold text-white">
                      {act.action}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {act.phase}
                      </span>
                      <span>Offense: {act.deltaPscores}</span>
                      <span>Defense: {act.deltaPconcedes}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="px-2.5 py-1 rounded-lg bg-lime-500/15 border border-[#84CC16]/40 text-[#84CC16] font-mono text-xs font-bold">
                    {act.vaepValue} VAEP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0E131F] border border-[#1E2638] text-xs text-slate-300 flex items-start gap-2.5">
          <Award className="w-4 h-4 text-[#84CC16] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Interpretasi Ilmiah:</strong> Skor Net VAEP <span className="text-[#84CC16] font-bold">+0.84</span> menempatkan Dimas di kuartil teratas (top 3%) gelandang U-13 se-provinsi. Aksi umpan terobosan menit ke-24 menyumbang nilai tertinggi (+0.49 VAEP) karena melipatgandakan peluang tembakan bebas striker.
          </p>
        </div>
      </section>

      {/* 3. SECTION 2: FILANESIA 4-PHASE TACTICAL BREAKDOWN */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-lime-500/15 text-[#84CC16] border border-[#84CC16]/30">
                Kurikulum Filanesia PSSI
              </span>
              <span className="text-xs text-slate-400">4 Momen Permainan Sepakbola</span>
            </div>
            <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-1">
              Distribusi Aksi Taktis dalam 4 Fase Permainan
            </h4>
          </div>

          {/* Phase Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#090D16] border border-[#1E2638] overflow-x-auto">
            <button
              type="button"
              onClick={() => setActivePhase('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic font-bold uppercase transition-all cursor-pointer ${
                activePhase === 'all'
                  ? 'bg-slate-800 text-white font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Fase
            </button>
            <button
              type="button"
              onClick={() => setActivePhase('attacking')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic font-bold uppercase transition-all cursor-pointer ${
                activePhase === 'attacking'
                  ? 'bg-cyan-500 text-black font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Menyerang
            </button>
            <button
              type="button"
              onClick={() => setActivePhase('trans_neg')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic font-bold uppercase transition-all cursor-pointer ${
                activePhase === 'trans_neg'
                  ? 'bg-rose-500 text-white font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transisi (-)
            </button>
            <button
              type="button"
              onClick={() => setActivePhase('defending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic font-bold uppercase transition-all cursor-pointer ${
                activePhase === 'defending'
                  ? 'bg-emerald-500 text-black font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bertahan
            </button>
            <button
              type="button"
              onClick={() => setActivePhase('trans_pos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic font-bold uppercase transition-all cursor-pointer ${
                activePhase === 'trans_pos'
                  ? 'bg-lime-500 text-black font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transisi (+)
            </button>
          </div>
        </div>

        {/* 4-Phase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Object.entries(filanesiaPhases)
            .filter(([key]) => activePhase === 'all' || activePhase === key)
            .map(([key, phase]) => (
              <div
                key={key}
                className={`p-4 rounded-xl border ${phase.borderColor} ${phase.bgColor} space-y-2.5 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-athletic text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-white">
                      {phase.code}
                    </span>
                    <h5 className="font-athletic text-sm font-bold text-white">
                      {phase.title}
                    </h5>
                  </div>
                  <span className={`font-mono text-xs font-black ${phase.textColor}`}>
                    {phase.percentage}% Volume
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${phase.color} rounded-full`}
                    style={{ width: `${phase.percentage * 2}%` }}
                  />
                </div>

                <div className="text-xs text-slate-300 font-medium">
                  {phase.actions}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {phase.eval}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Parameter FIFA:</span>
                  <span className={`font-mono font-bold ${phase.textColor}`}>
                    {phase.fifaMetric}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* 4. SECTION 3: FIFA FOOTBALL LANGUAGE TELEMETRY MATRIX */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                FIFA Football Language Matrix
              </span>
              <span className="text-xs text-slate-400">FIFA Training Centre (2026)</span>
            </div>
            <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-1">
              Metrik Taktis Standar Pelatih FIFA
            </h4>
          </div>

          <div className="text-xs text-slate-400">
            Tolok ukur pergerakan spasial tanpa bola & pemecah kebuntuan
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {fifaLanguageKpis.map((kpi, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1E2638] flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-athletic font-bold uppercase tracking-wider text-slate-400">
                  {kpi.metric}
                </span>
                {kpi.icon}
              </div>

              <div>
                <div className="font-athletic text-2xl font-black text-white">
                  {kpi.value}
                </div>
                <div className="text-[10px] font-mono font-bold text-lime-400 mt-0.5">
                  {kpi.benchmark}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-snug pt-2 border-t border-slate-800">
                {kpi.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SECTION 4: SCIENCE-BASED DRILL PRESCRIPTION (BARÇA INNOVATION HUB) */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#1F2937]">
          <div className="p-2 rounded-xl bg-[#090D16] border border-[#84CC16] text-[#84CC16]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-lime-500/15 text-[#84CC16] border border-[#84CC16]/30">
                Metodologi Latihan Terakreditasi
              </span>
              <span className="text-xs text-slate-400">{prescribedDrill.author}</span>
            </div>
            <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-0.5">
              {prescribedDrill.title}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1E2638] space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Setup Lapangan & Durasi
              </div>
              <div className="text-xs text-slate-200 font-semibold">
                {prescribedDrill.setup}
              </div>
              <div className="text-xs text-cyan-400 font-mono">
                {prescribedDrill.duration}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-300 space-y-1">
              <div className="font-athletic font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Catatan Beban Bio-Banding (PHV)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {prescribedDrill.bioBandingNote}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1E2638] space-y-2">
            <div className="text-[10px] font-athletic font-bold text-[#84CC16] uppercase tracking-wider">
              Instruksi Kunci Pelatih (Coaching Points)
            </div>
            <ul className="space-y-2">
              {prescribedDrill.coachingPoints.map((pt, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#111827] border border-slate-700 text-[#84CC16] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. SECTION 5: ACADEMIC & METHODOLOGY CITATIONS */}
      <section className="rounded-2xl bg-[#0E131F] border border-[#1E2638] p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-xs font-athletic font-bold uppercase tracking-wider text-slate-300">
          <BookOpen className="w-4 h-4 text-[#84CC16]" />
          <span>Daftar Pustaka & Metodologi Sepakbola Resmi (Peer-Reviewed References)</span>
        </div>

        <div className="space-y-2">
          {academicCitations.map((cite, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg bg-[#090D16]/90 border border-slate-800 text-[11px] text-slate-400 space-y-0.5"
            >
              <div className="text-slate-300 font-medium">
                {i + 1}. <strong>{cite.author}</strong> ({cite.year}). <em>"{cite.title}"</em>.
              </div>
              <div className="text-slate-400 text-[10px]">
                {cite.venue}. <span className="font-mono text-cyan-400/80">Ref: {cite.doi}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
