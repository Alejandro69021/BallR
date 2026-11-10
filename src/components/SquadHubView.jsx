import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Eye,
  Edit3,
  Flame,
  Zap,
  Activity
} from 'lucide-react';

export default function SquadHubView({
  players,
  onViewPassport,
  onEvaluatePlayer
}) {
  const [activeAgeGroup, setActiveAgeGroup] = useState('U-13');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating_desc');

  // Age group tabs
  const ageCategories = [
    { id: 'U-11', label: 'U-11 Grassroots', count: 18 },
    { id: 'U-13', label: 'U-13 Elite (Active)', count: players.length, active: true },
    { id: 'U-15', label: 'U-15 National Pool', count: 22 }
  ];

  // Position filter chips
  const positionFilters = [
    { id: 'ALL', label: 'All Positions' },
    { id: 'GK', label: 'Goalkeepers' },
    { id: 'DEF', label: 'Defenders' },
    { id: 'MID', label: 'Midfielders' },
    { id: 'FWD', label: 'Forwards' }
  ];

  // Summary stats
  const totalCount = players.length;
  const avgRating = (
    players.reduce((sum, p) => sum + p.personal_info.overall_rating, 0) / totalCount
  ).toFixed(1);
  const publishedCount = players.filter(
    (p) => p.personal_info.evaluation_status === 'ready'
  ).length;
  const pendingCount = totalCount - publishedCount;

  // Filter & Sort logic
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        // Search filter
        const query = searchQuery.toLowerCase().trim();
        const matchesName =
          p.personal_info.full_name.toLowerCase().includes(query) ||
          (p.personal_info.nickname && p.personal_info.nickname.toLowerCase().includes(query)) ||
          p.personal_info.jersey_number.toString().includes(query);

        // Position filter
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
        if (sortBy === 'rating_desc') {
          return b.personal_info.overall_rating - a.personal_info.overall_rating;
        }
        if (sortBy === 'need_eval') {
          const aPending = a.personal_info.evaluation_status === 'pending' ? 1 : 0;
          const bPending = b.personal_info.evaluation_status === 'pending' ? 1 : 0;
          return bPending - aPending;
        }
        if (sortBy === 'jersey_asc') {
          return a.personal_info.jersey_number - b.personal_info.jersey_number;
        }
        return 0;
      });
  }, [players, searchQuery, selectedPosition, sortBy]);

  // Tier color styling for FIFA OVR Badge
  const getBadgeTierStyle = (ovr) => {
    if (ovr >= 80) {
      return {
        border: 'border-[#CCFF00]/80 shadow-[0_0_15px_rgba(204,255,0,0.25)]',
        bg: 'bg-gradient-to-b from-[#2E3516] via-[#1A2218] to-[#0D131F]',
        text: 'text-transparent bg-clip-text bg-gradient-to-b from-white via-lime-200 to-[#CCFF00]',
        tierLabel: 'GOLD TIER'
      };
    }
    if (ovr >= 75) {
      return {
        border: 'border-slate-400/80 shadow-[0_0_15px_rgba(203,213,225,0.2)]',
        bg: 'bg-gradient-to-b from-[#222834] via-[#1A202C] to-[#0D131F]',
        text: 'text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400',
        tierLabel: 'SILVER TIER'
      };
    }
    return {
      border: 'border-amber-600/80 shadow-[0_0_15px_rgba(217,119,6,0.2)]',
      bg: 'bg-gradient-to-b from-[#331C13] via-[#221612] to-[#0D131F]',
      text: 'text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500',
      tierLabel: 'BRONZE TIER'
    };
  };

  // Helper to extract mini 3-bar metrics: Pace, Technique, Physical
  const getMiniMetrics = (radarAttributes) => {
    const paceAttr = radarAttributes.find((a) => a.attribute.includes('Pace'));
    const passAttr = radarAttributes.find((a) => a.attribute.includes('Passing'));
    const dribAttr = radarAttributes.find((a) => a.attribute.includes('Dribbling'));
    const physAttr = radarAttributes.find((a) => a.attribute.includes('Physical'));

    const pace = paceAttr ? paceAttr.value : 75;
    const technique = passAttr && dribAttr ? Math.round((passAttr.value + dribAttr.value) / 2) : 75;
    const physical = physAttr ? physAttr.value : 75;

    return { pace, technique, physical };
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      
      {/* 1. Academy & Age-Group Header Card */}
      <section className="relative overflow-hidden rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-[#CCFF00]/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
          {/* Academy Info & Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-athletic font-bold uppercase tracking-wider text-[#CCFF00] px-2 py-0.5 rounded bg-lime-500/15 border border-[#CCFF00]/30">
                Official Roster Hub
              </span>
              <span className="text-xs text-slate-400 font-medium">
                PSSI Youth Grassroots Affiliated
              </span>
            </div>

            <h2 className="font-athletic text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Mataram Putra Football Academy</span>
              <ShieldCheck className="w-6 h-6 text-[#CCFF00] shrink-0" />
            </h2>

            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Yogyakarta, ID • Technical Director: Coach Hendro (Lisensi B AFC)
            </p>
          </div>

          {/* Age Category Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090D16] border border-[#1F2937] self-start md:self-auto">
            {ageCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveAgeGroup(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold transition-all cursor-pointer ${
                  activeAgeGroup === cat.id
                    ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.id}</span>
                {cat.active && (
                  <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-black/40 text-black font-extrabold uppercase">
                    Aktif
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
          <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Pemain Skuad
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-athletic text-2xl font-black text-white">
                {totalCount}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Pemain Terdaftar
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Rata-rata OVR Skuad
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-athletic text-2xl font-black text-[#CCFF00]">
                {avgRating}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                Tier 1 Elite
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Rapor Terpublikasi
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-athletic text-2xl font-black text-emerald-400">
                {publishedCount}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                / {totalCount} Paspor
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Perlu Evaluasi (Pending)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-athletic text-2xl font-black text-amber-400">
                {pendingCount}
              </span>
              <span className="text-[10px] text-amber-300 font-medium">
                Menunggu Review
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Search, Filter & Quick Sort Controls */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-3.5 sm:p-4 shadow-xl shadow-black/50 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pemain, panggilan, atau jersey #..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#090D16] border border-slate-700 focus:border-[#CCFF00] text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-[#CCFF00] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-h-[44px] px-3 rounded-xl bg-[#090D16] border border-slate-700 text-xs font-semibold text-slate-200 outline-none focus:border-[#CCFF00] cursor-pointer"
            >
              <option value="rating_desc">Urutkan: Rating Tertinggi</option>
              <option value="need_eval">Urutkan: Perlu Evaluasi Dulu</option>
              <option value="jersey_asc">Urutkan: Nomor Punggung</option>
            </select>
          </div>
        </div>

        {/* Position Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {positionFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedPosition(filter.id)}
              className={`min-h-[38px] px-3.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                selectedPosition === filter.id
                  ? 'bg-[#1F2937] text-[#CCFF00] border-[#CCFF00]/60 shadow-sm'
                  : 'bg-[#090D16]/70 text-slate-400 border-transparent hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
          <span className="text-[11px] text-slate-500 ml-auto shrink-0 pl-2">
            Menampilkan: <strong className="text-white">{filteredPlayers.length}</strong> pemain
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
              onClick={() => {
                setSearchQuery('');
                setSelectedPosition('ALL');
              }}
              className="mt-3 px-4 py-1.5 rounded-lg bg-[#1F2937] text-xs font-bold text-[#CCFF00] border border-slate-700 hover:bg-slate-700"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const { personal_info, radar_attributes, player_id } = player;
            const badgeStyle = getBadgeTierStyle(personal_info.overall_rating);
            const { pace, technique, physical } = getMiniMetrics(radar_attributes);
            const isReady = personal_info.evaluation_status === 'ready';

            return (
              <div
                key={player_id}
                className="rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-[#CCFF00]/50 transition-all duration-300 p-4 shadow-xl shadow-black/50 flex flex-col justify-between group hover:shadow-[0_0_20px_rgba(204,255,0,0.1)]"
              >
                {/* Card Top: Avatar, OVR Badge, Name */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    
                    {/* Athlete Portrait with Jersey Badge */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#090D16] border border-slate-700 group-hover:border-[#CCFF00]/60 transition-colors shadow-md">
                        <img
                          src={personal_info.photo_url}
                          alt={personal_info.full_name}
                          className="w-full h-full object-cover object-top filter contrast-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded bg-black/90 border border-[#CCFF00]/40 text-[9px] font-athletic font-bold text-[#CCFF00]">
                        #{personal_info.jersey_number}
                      </div>
                    </div>

                    {/* EA FC Style OVR Badge */}
                    <div className={`p-2 rounded-xl border-2 ${badgeStyle.border} ${badgeStyle.bg} flex flex-col items-center justify-center min-w-[62px] text-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <span className="text-[7px] font-athletic font-bold uppercase tracking-wider text-slate-300">
                        {badgeStyle.tierLabel.split(' ')[0]}
                      </span>
                      <span className={`font-athletic text-2xl font-black leading-none my-0.5 ${badgeStyle.text}`}>
                        {personal_info.overall_rating}
                      </span>
                      <span className="font-athletic text-[9px] font-bold text-white uppercase tracking-wider">
                        {personal_info.position.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Player Identity Information */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-athletic text-base font-bold text-white tracking-tight truncate group-hover:text-lime-200 transition-colors" title={personal_info.full_name}>
                        {personal_info.full_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <span className="truncate">{personal_info.position}</span>
                      <span>•</span>
                      <span className="text-slate-300">{personal_info.age} thn</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Kaki: <strong className="text-white">{personal_info.preferred_foot}</strong></span>
                      <span>{personal_info.height_cm} cm</span>
                    </div>
                  </div>

                  {/* Monthly Evaluation Status Badge */}
                  <div className="mt-3">
                    {isReady ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>✓ Report Ready (Okt 2026)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        <span>⏳ Pending Evaluation</span>
                      </span>
                    )}
                  </div>

                  {/* Mini 3-Bar Metric Teaser (Pace, Technique, Physical) */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-1.5">
                    {/* Pace bar */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-slate-400">Pace (PAC)</span>
                        <span className="font-athletic font-bold text-[#CCFF00]">{pace}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-lime-400 to-[#CCFF00] rounded-full"
                          style={{ width: `${pace}%` }}
                        />
                      </div>
                    </div>

                    {/* Technique bar */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-slate-400">Technique (TEC)</span>
                        <span className="font-athletic font-bold text-cyan-400">{technique}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full"
                          style={{ width: `${technique}%` }}
                        />
                      </div>
                    </div>

                    {/* Physical bar */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-slate-400">Physical (PHY)</span>
                        <span className="font-athletic font-bold text-amber-400">{physical}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                          style={{ width: `${physical}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions: View Passport & Evaluate buttons */}
                <div className="mt-4 pt-3 border-t border-[#1F2937] grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onViewPassport(player_id)}
                    className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#090D16] hover:bg-[#1F2937] border border-[#1F2937] hover:border-[#CCFF00]/50 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>Passport</span>
                  </button>

                  <button
                    onClick={() => onEvaluatePlayer(player_id)}
                    className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#1F2937] hover:bg-[#CCFF00] text-slate-200 hover:text-black border border-slate-700 hover:border-transparent text-xs font-athletic font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Evaluate</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </section>

    </div>
  );
}

