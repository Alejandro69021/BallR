import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import SquadPlayerCard from './squad/SquadPlayerCard';

export default function SquadHubView({
  players,
  userRole = 'public',
  onViewPassport,
  onEvaluatePlayer
}) {
  const [activeAgeGroup] = useState('U-13');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');

  const ageCategories = [
    { id: 'U-11', label: 'U-11 Grassroots', count: 18 },
    { id: 'U-13', label: 'U-13 Elite (Active)', count: players.length, active: true },
    { id: 'U-15', label: 'U-15 National Pool', count: 22 }
  ];

  const positionFilters = [
    { id: 'ALL', label: 'All Positions' },
    { id: 'GK', label: 'Goalkeepers' },
    { id: 'DEF', label: 'Defenders' },
    { id: 'MID', label: 'Midfielders' },
    { id: 'FWD', label: 'Forwards' }
  ];

  const totalCount = players.length;
  const publishedCount = players.filter(
    (p) => p.personal_info.evaluation_status === 'ready'
  ).length;
  const pendingCount = totalCount - publishedCount;

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesName =
          p.personal_info.full_name.toLowerCase().includes(query) ||
          (p.personal_info.nickname && p.personal_info.nickname.toLowerCase().includes(query)) ||
          p.personal_info.jersey_number.toString().includes(query);

        const matchesPos =
          selectedPosition === 'ALL' ||
          p.personal_info.position_group === selectedPosition ||
          (selectedPosition === 'GK' && p.personal_info.position.includes('Goalkeeper')) ||
          (selectedPosition === 'DEF' && (p.personal_info.position.includes('Back') || p.personal_info.position.includes('CB') || p.personal_info.position.includes('RB') || p.personal_info.position.includes('LB'))) ||
          (selectedPosition === 'MID' && (p.personal_info.position.includes('Midfielder') || p.personal_info.position.includes('CAM') || p.personal_info.position.includes('CDM') || p.personal_info.position.includes('CM'))) ||
          (selectedPosition === 'FWD' && (p.personal_info.position.includes('Winger') || p.personal_info.position.includes('Forward') || p.personal_info.position.includes('ST') || p.personal_info.position.includes('RW') || p.personal_info.position.includes('LW')));

        return matchesName && matchesPos;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return (a.personal_info.full_name || '').localeCompare(b.personal_info.full_name || '');
        }
        if (sortBy === 'jersey_asc') {
          return (a.personal_info.jersey_number || 0) - (b.personal_info.jersey_number || 0);
        }
        if (sortBy === 'position_asc') {
          return (a.personal_info.position || '').localeCompare(b.personal_info.position || '');
        }
        if (sortBy === 'assessment_date_desc') {
          const dateA = a.fitness_benchmarks?.test_date || a.ai_coach_evaluation?.period || '';
          const dateB = b.fitness_benchmarks?.test_date || b.ai_coach_evaluation?.period || '';
          return dateB.localeCompare(dateA);
        }
        if (sortBy === 'need_eval') {
          const aPending = a.personal_info.evaluation_status === 'pending' ? 1 : 0;
          const bPending = b.personal_info.evaluation_status === 'pending' ? 1 : 0;
          return bPending - aPending;
        }
        return 0;
      });
  }, [players, searchQuery, selectedPosition, sortBy]);

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      {/* 1. Academy & Age-Group Header Card */}
      <section className="relative overflow-hidden rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-[#CCFF00]/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-athletic text-xs font-bold uppercase tracking-wider text-[#CCFF00] bg-lime-500/10 px-2 py-0.5 rounded border border-[#CCFF00]/20">
                Pusat Talenta Resmi
              </span>
              <span className="text-xs text-slate-400">PSSI DIY Region</span>
            </div>
            <h2 className="font-athletic text-xl sm:text-3xl font-black text-white tracking-tight">
              Mataram Putra FA — Squad Directory
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Direktori resmi basis data pemain binaan akademi. Jelajahi paspor bakat, rekor fisik, dan rapor teknis bulanan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#090D16] border border-[#1F2937] self-start md:self-auto">
            {ageCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  cat.active
                    ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats Strip */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937]">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Roster {activeAgeGroup}</span>
              <Users className="w-4 h-4 text-[#CCFF00]" />
            </div>
            <div className="font-athletic text-2xl font-black text-white mt-1">
              {totalCount} <span className="text-xs font-normal text-slate-400">Pemain</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937]">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Status Rapor Bulanan</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-bold font-athletic">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {publishedCount} Ready
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {pendingCount} Pending
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Search, Position Filter & Sorting Bar */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-3.5 sm:p-4 shadow-xl shadow-black/50 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari atlet berdasarkan nama atau nomor punggung..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090D16] border border-slate-700 focus:border-[#CCFF00] text-white text-xs sm:text-sm outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl bg-[#090D16] border border-slate-700 text-slate-200 text-xs font-semibold appearance-none cursor-pointer focus:border-[#CCFF00] outline-none"
              >
                <option value="name_asc">Nama Pemain (A-Z)</option>
                <option value="jersey_asc">Nomor Punggung (Kecil-Besar)</option>
                <option value="position_asc">Posisi (A-Z)</option>
                <option value="assessment_date_desc">Tanggal Penilaian Terakhir</option>
                <option value="need_eval">Perlu Evaluasi (Pending)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1F2937] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span className="text-[11px] font-athletic font-bold uppercase tracking-wider text-slate-400 mr-1">
              Posisi:
            </span>
            {positionFilters.map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setSelectedPosition(pos.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedPosition === pos.id
                    ? 'bg-[#CCFF00] text-black font-bold shadow-sm'
                    : 'bg-[#090D16] text-slate-400 hover:text-white border border-[#1F2937]'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-slate-400 shrink-0 hidden sm:inline">
            Menampilkan {filteredPlayers.length} atlet
          </span>
        </div>
      </section>

      {/* 3. Interactive Player Roster Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#111827] border border-[#1F2937]">
            <p className="text-sm text-slate-400">
              Tidak ada pemain yang cocok dengan filter atau kata kunci "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedPosition('ALL');
              }}
              className="mt-3 px-4 py-1.5 rounded-lg bg-[#1F2937] text-xs font-bold text-[#CCFF00] border border-slate-700 hover:bg-slate-700 cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <SquadPlayerCard
              key={player.player_id}
              player={player}
              userRole={userRole}
              onViewPassport={onViewPassport}
              onEvaluatePlayer={onEvaluatePlayer}
            />
          ))
        )}
      </section>
    </div>
  );
}
