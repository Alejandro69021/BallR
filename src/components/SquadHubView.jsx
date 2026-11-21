import React, { useState, useMemo } from 'react';
import {
  Users,
  LayoutList,
  LayoutGrid,
  Eye,
  Edit3
} from 'lucide-react';
import Table from './ui/Table';
import ResponsiveList from './ui/ResponsiveList';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Field from './ui/Field';
import Select from './ui/Select';
import EmptyState from './ui/EmptyState';
import SquadPlayerCard from './squad/SquadPlayerCard';
import { formatPositionLabel } from '../lib/displayLabels';

export default function SquadHubView({
  players = [],
  userRole = 'public',
  onViewPassport,
  onEvaluatePlayer
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // 'table' (default) or 'cards'

  const isCoach = userRole === 'coach' || userRole === 'admin';

  const positionFilters = [
    { id: 'ALL', label: 'Semua posisi' },
    { id: 'GK', label: 'Kiper (GK)' },
    { id: 'DEF', label: 'Bek (DEF)' },
    { id: 'MID', label: 'Gelandang (MID)' },
    { id: 'FWD', label: 'Penyerang (FWD)' }
  ];

  const totalCount = players.length;
  const publishedCount = players.filter(
    (p) => p.personal_info?.evaluation_status === 'ready'
  ).length;
  const pendingCount = players.filter(
    (p) => p.personal_info?.evaluation_status === 'pending'
  ).length;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const query = searchQuery.toLowerCase().trim();
        const info = p.personal_info || {};
        const fullName = (info.full_name || '').toLowerCase();
        const nickname = (info.nickname || '').toLowerCase();
        const jerseyStr = (info.jersey_number ?? '').toString();

        const matchesQuery = !query || fullName.includes(query) || nickname.includes(query) || jerseyStr.includes(query);

        const posGroup = info.position_group || '';
        const posText = info.position || '';
        const matchesPos =
          selectedPosition === 'ALL' ||
          posGroup === selectedPosition ||
          (selectedPosition === 'GK' && (posText.includes('Goalkeeper') || posText.includes('GK'))) ||
          (selectedPosition === 'DEF' && (posText.includes('Back') || posText.includes('CB') || posText.includes('RB') || posText.includes('LB') || posText.includes('DEF'))) ||
          (selectedPosition === 'MID' && (posText.includes('Midfielder') || posText.includes('CAM') || posText.includes('CDM') || posText.includes('CM') || posText.includes('MID'))) ||
          (selectedPosition === 'FWD' && (posText.includes('Winger') || posText.includes('Forward') || posText.includes('ST') || posText.includes('RW') || posText.includes('LW') || posText.includes('FWD')));

        return matchesQuery && matchesPos;
      })
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        const aInfo = a.personal_info || {};
        const bInfo = b.personal_info || {};

        if (sortKey === 'name') {
          return dir * (aInfo.full_name || '').localeCompare(bInfo.full_name || '');
        }
        if (sortKey === 'jersey' || sortKey === 'jersey_number') {
          const numA = Number(aInfo.jersey_number ?? 9999);
          const numB = Number(bInfo.jersey_number ?? 9999);
          return dir * (numA - numB);
        }
        if (sortKey === 'position') {
          return dir * (aInfo.position || '').localeCompare(bInfo.position || '');
        }
        if (sortKey === 'assessment_date' || sortKey === 'last_assessment') {
          const dateA = a.fitness_benchmarks?.test_date || a.ai_coach_evaluation?.period || '';
          const dateB = b.fitness_benchmarks?.test_date || b.ai_coach_evaluation?.period || '';
          return dir * dateA.localeCompare(dateB);
        }
        return 0;
      });
  }, [players, searchQuery, selectedPosition, sortKey, sortDirection]);

  // Extract radar attribute helper
  const formatSixAttributes = (radarAttributes = []) => {
    if (!radarAttributes || radarAttributes.length === 0) {
      return <span className="text-2 italic">Belum ada data</span>;
    }

    const attrs = [
      { key: 'pace', code: 'PAC' },
      { key: 'shooting', code: 'SHO' },
      { key: 'passing', code: 'PAS' },
      { key: 'dribbling', code: 'DRI' },
      { key: 'defending', code: 'DEF' },
      { key: 'physical', code: 'PHY' }
    ];

    const parts = attrs.map(({ key, code }) => {
      const match = radarAttributes.find((a) =>
        a.attribute && a.attribute.toLowerCase().includes(key)
      );
      return { code, val: match && match.value !== null && match.value !== undefined ? match.value : null };
    });

    const hasAnyRealVal = parts.some((p) => p.val !== null);
    if (!hasAnyRealVal) {
      return <span className="text-2 italic">Belum ada data</span>;
    }

    return (
      <span className="font-mono tabular-nums text-xs text-1 space-x-1.5 whitespace-nowrap">
        {parts.map((p, idx) => (
          <span key={p.code}>
            <span className="text-2 text-xs font-sans mr-0.5">{p.code}</span>
            <span className="font-semibold">{p.val ?? '-'}</span>
            {idx < parts.length - 1 && <span className="text-line ml-1.5">·</span>}
          </span>
        ))}
      </span>
    );
  };

  // Table columns definition
  const columns = [
    {
      key: 'jersey',
      header: 'No.',
      sortable: true,
      tabular: true,
      align: 'center',
      render: (_, row) => (
        <span className="font-mono font-semibold text-xs text-1">
          #{row.personal_info?.jersey_number ?? '-'}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Nama',
      sortable: true,
      render: (_, row) => (
        <button
          type="button"
          onClick={() => onViewPassport(row.player_id)}
          className="text-left font-medium text-1 hover:text-brand hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded max-w-[150px] whitespace-normal break-words"
        >
          <div className="font-semibold text-xs text-1 break-words">
            {row.personal_info?.full_name || 'Atlet'}
          </div>
          {row.personal_info?.nickname && (
            <div className="text-xs text-2 font-mono">
              "{row.personal_info.nickname}"
            </div>
          )}
        </button>
      )
    },
    {
      key: 'position',
      header: 'Posisi',
      sortable: true,
      render: (_, row) => (
        <span className="text-xs text-2 whitespace-normal break-words max-w-[130px] inline-block">
          {formatPositionLabel(row.personal_info?.position)}
        </span>
      )
    },
    {
      key: 'assessment_date',
      header: 'Asesmen terakhir',
      sortable: true,
      render: (_, row) => {
        const period = row.ai_coach_evaluation?.period || row.fitness_benchmarks?.test_date;
        return period ? (
          <span className="font-mono text-xs text-1">{period}</span>
        ) : (
          <span className="text-xs text-2 italic">Belum ada data</span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status rapor',
      align: 'center',
      render: (_, row) => {
        const status = row.personal_info?.evaluation_status;
        if (status === 'ready') {
          return <Badge variant="success">Diterbitkan</Badge>;
        }
        if (status === 'pending') {
          return <Badge variant="warning">Draf</Badge>;
        }
        return <Badge variant="neutral">Belum ada</Badge>;
      }
    },
    {
      key: 'indicators',
      header: 'Indikator kunci (0-100)',
      render: (_, row) => formatSixAttributes(row.radar_attributes)
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (_, row) => (
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onViewPassport(row.player_id)}
            icon={<Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
            className="whitespace-nowrap"
          >
            Paspor
          </Button>

          {isCoach && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEvaluatePlayer(row.player_id)}
              icon={<Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />}
              className="whitespace-nowrap"
            >
              Evaluasi
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-1">
      {/* 1. Directory Header */}
      <section className="rounded-panel border border-line bg-panel p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="brand">Akademi U-13</Badge>
              <span className="text-xs text-2">Basis Data Pembinaan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-1">
              Direktori Skuad
            </h1>
            <p className="text-xs text-2 mt-1 max-w-xl">
              Basis data resmi rekam jejak atlet binaan, status asesmen berkala, dan rekam kebugaran fisik.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-control border border-control bg-raised p-0.5 gap-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                className={`px-3 py-1.5 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0 ${viewMode === 'table'
                  ? 'bg-panel text-1 shadow-sm font-semibold'
                  : 'text-2 hover:text-1'
                  }`}
              >
                <LayoutList className="w-4 h-4" strokeWidth={1.5} />
                <span>Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
                className={`px-3 py-1.5 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0 ${viewMode === 'cards'
                  ? 'bg-panel text-1 shadow-sm font-semibold'
                  : 'text-2 hover:text-1'
                  }`}
              >
                <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                <span>Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Roster Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-control border border-line bg-raised flex items-center justify-between">
            <div>
              <p className="text-xs text-2">Total Atlet Terdaftar</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-1 mt-0.5">
                {totalCount} <span className="text-xs font-normal text-2">pemain</span>
              </p>
            </div>
            <Users className="w-5 h-5 text-2" strokeWidth={1.5} />
          </div>

          <div className="p-3 rounded-control border border-line bg-raised flex items-center justify-between">
            <div>
              <p className="text-xs text-2">Status Asesmen Bulanan</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success">{publishedCount} Diterbitkan</Badge>
                <Badge variant="warning">{pendingCount} Draf</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Search, Filter & Sort Controls */}
      <section className="rounded-panel border border-line bg-panel p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1">
            <Field
              type="search"
              placeholder="Cari atlet berdasarkan nama atau nomor punggung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-2 whitespace-nowrap">Urutkan:</span>
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="text-xs min-h-[44px]"
            >
              <option value="name">Nama (A-Z)</option>
              <option value="jersey">Nomor Punggung</option>
              <option value="position">Posisi</option>
              <option value="assessment_date">Tanggal Asesmen</option>
            </Select>
          </div>
        </div>

        {/* Position Filter Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-line overflow-x-auto scrollbar-none">
          <span className="text-xs font-medium text-2 mr-1 shrink-0">
            Posisi:
          </span>
          {positionFilters.map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => setSelectedPosition(pos.id)}
              className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0 ${selectedPosition === pos.id
                ? 'bg-brand text-app font-semibold'
                : 'bg-raised text-2 hover:text-1 border border-line'
                }`}
            >
              {pos.label}
            </button>
          ))}
          <span className="text-xs font-mono text-2 ml-auto shrink-0 hidden sm:inline">
            Menampilkan {filteredPlayers.length} dari {totalCount}
          </span>
        </div>
      </section>

      {/* 3. Main Roster Content: Table (Default) or Compact Cards */}
      {filteredPlayers.length === 0 ? (
        <div className="p-10 border border-line rounded-panel bg-panel text-center">
          <EmptyState
            title="Tidak ada pemain ditemukan"
            description={searchQuery ? `Tidak ada data yang cocok dengan "${searchQuery}".` : 'Daftar pemain kosong.'}
            action={
              (searchQuery || selectedPosition !== 'ALL') ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPosition('ALL');
                  }}
                >
                  Reset Filter
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        <ResponsiveList
          columns={columns}
          data={filteredPlayers}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          stickyHeader={true}
          emptyMessage="Belum ada data pemain"
          renderCard={(player) => (
            <SquadPlayerCard
              player={player}
              userRole={userRole}
              onViewPassport={onViewPassport}
              onEvaluatePlayer={onEvaluatePlayer}
            />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredPlayers.map((player) => (
            <SquadPlayerCard
              key={player.player_id}
              player={player}
              userRole={userRole}
              onViewPassport={onViewPassport}
              onEvaluatePlayer={onEvaluatePlayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
