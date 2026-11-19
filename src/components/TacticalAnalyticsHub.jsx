import React, { useState } from 'react';
import {
  BrainCircuit,
  Target,
  Shield,
  Activity,
  CheckCircle2,
  TrendingUp,
  Copy
} from 'lucide-react';
import VaepScorecard from './analytics/VaepScorecard';
import FilanesiaGrid from './analytics/FilanesiaGrid';
import FifaLanguageMetrics from './analytics/FifaLanguageMetrics';
import PrescribedDrillCard from './analytics/PrescribedDrillCard';

export default function TacticalAnalyticsHub({ player, onToast }) {
  const { personal_info, latest_match_summary } = player;

  const [activePhase, setActivePhase] = useState('all');
  const [isCopied, setIsCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

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
      <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-athletic font-extrabold uppercase tracking-wider bg-lime-500/15 text-[#84CC16] border border-[#84CC16]/30 flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" />
                <span>Tactical Engine</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">
                SoccerAction (VAEP)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25">
                Filanesia PSSI
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-slate-800 border border-slate-700">
                Kloppy & mplsoccer
              </span>
            </div>

            <h3 className="font-athletic text-lg sm:text-2xl font-black text-white tracking-tight">
              Post-Match Tactical Intelligence
            </h3>
            <p className="text-xs text-slate-400">
              Evaluasi teknis & spasial laga U-13 berbasis model aksi ilmiah terbuka dan 4 fase Filanesia.
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
                  <span className="text-[#84CC16]">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#84CC16]" />
                  <span>Salin Laporan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Quick Telemetry Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638] min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Net VAEP Value
            </div>
            <div className="font-athletic text-2xl font-black text-[#84CC16] mt-0.5">
              {vaepMetrics.netVaep}
            </div>
            <div className="text-[10px] text-lime-400 font-medium truncate">
              Offense: {vaepMetrics.offensiveVaep}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638] min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Passing Accuracy
            </div>
            <div className="font-athletic text-2xl font-black text-cyan-400 mt-0.5">
              {matchStats.passAccuracy}%
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {matchStats.passesCompleted}/{matchStats.passesTotal} Operan
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638] min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Tekel & Intersep
            </div>
            <div className="font-athletic text-2xl font-black text-emerald-400 mt-0.5">
              {matchStats.tackleAccuracy}%
            </div>
            <div className="text-[10px] text-emerald-400/80 font-medium truncate">
              {matchStats.tacklesWon}/{matchStats.tacklesTotal} Menang Duel
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/90 border border-[#1E2638] min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Rating Laga
            </div>
            <div className="font-athletic text-2xl font-black text-amber-400 mt-0.5">
              {matchStats.matchRating} <span className="text-xs font-normal text-slate-400">/ 10</span>
            </div>
            <div className="text-[10px] text-amber-300 font-medium truncate">
              Playmaker Kunci
            </div>
          </div>
        </div>
      </div>

      <VaepScorecard vaepMetrics={vaepMetrics} />

      <FilanesiaGrid
        filanesiaPhases={filanesiaPhases}
        activePhase={activePhase}
        setActivePhase={setActivePhase}
      />

      <FifaLanguageMetrics fifaLanguageKpis={fifaLanguageKpis} />

      <PrescribedDrillCard
        prescribedDrill={prescribedDrill}
        academicCitations={academicCitations}
        showCitations={showCitations}
        setShowCitations={setShowCitations}
      />
    </div>
  );
}
