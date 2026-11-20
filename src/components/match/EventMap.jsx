import React, { useState, useMemo } from 'react';
import PitchSvg from '../ui/PitchSvg';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import { EVENT_TYPE_LABELS, ALLOWED_EVENT_TYPES } from '../../lib/matches';
import { zoneGrid } from '../../lib/analysis/events';

export default function EventMap({
  events = [],
  pitchLengthM = 90,
  pitchWidthM = 60,
  participants = [],
  playerMap = {}
}) {
  const [mode, setMode] = useState('markers'); // 'markers' | 'passes' | 'zones'
  const [teamFilter, setTeamFilter] = useState('all');
  const [playerFilter, setPlayerFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minMinute, setMinMinute] = useState('');
  const [maxMinute, setMaxMinute] = useState('');

  // Find max minute in events for range bounds
  const rawMaxMin = useMemo(() => {
    let max = 90;
    events.forEach((e) => {
      if (e.minute != null && e.minute > max) max = Math.ceil(e.minute);
    });
    return max;
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (teamFilter !== 'all' && e.team !== teamFilter) return false;
      if (playerFilter !== 'all' && e.player_id !== playerFilter) return false;
      if (periodFilter !== 'all' && String(e.period) !== String(periodFilter)) return false;
      if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;

      const m = e.minute != null ? Number(e.minute) : null;
      if (minMinute !== '' && m !== null && m < Number(minMinute)) return false;
      if (maxMinute !== '' && m !== null && m > Number(maxMinute)) return false;

      return true;
    });
  }, [events, teamFilter, playerFilter, periodFilter, typeFilter, minMinute, maxMinute]);

  // Plotted vs excluded
  const plottedEvents = useMemo(() => {
    return filteredEvents.filter(
      (e) => e.x_m != null && !isNaN(e.x_m) && e.y_m != null && !isNaN(e.y_m)
    );
  }, [filteredEvents]);

  const excludedCount = filteredEvents.length - plottedEvents.length;

  // Passes with end coords
  const passesWithEnd = useMemo(() => {
    return plottedEvents.filter(
      (e) =>
        (e.event_type === 'pass' || e.event_type === 'key_pass' || e.event_type === 'free_kick' || e.event_type === 'corner') &&
        e.end_x_m != null &&
        !isNaN(e.end_x_m) &&
        e.end_y_m != null &&
        !isNaN(e.end_y_m)
    );
  }, [plottedEvents]);

  // Zone grid analysis for 'zones' mode
  const zoneData = useMemo(() => {
    return zoneGrid(filteredEvents, pitchLengthM, pitchWidthM);
  }, [filteredEvents, pitchLengthM, pitchWidthM]);

  // Max zone count for opacity normalization
  const maxZoneCount = useMemo(() => {
    let max = 1;
    zoneData.cells.forEach((c) => {
      if (c.count > max) max = c.count;
    });
    return max;
  }, [zoneData]);

  // Available players for dropdown
  const playerOptions = useMemo(() => {
    return participants.map((p) => {
      const info = playerMap[p.player_id] || {};
      const num = p.jersey_number ?? info.number ?? '-';
      const name = p.player_name || info.name || p.player_id;
      return {
        id: p.player_id,
        label: `#${num} ${name}`
      };
    });
  }, [participants, playerMap]);

  return (
    <div className="space-y-4">
      {/* Header & Mandatory Data Honesty Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-panel bg-panel border border-line">
        <div>
          <h2 className="text-base font-semibold text-1">Peta Kejadian Pertandingan</h2>
          <p className="text-xs text-2 font-mono mt-0.5">
            Data pencatatan manual; bukan pelacakan otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="neutral" size="sm">
            Ditampilkan: {plottedEvents.length} kejadian (n={filteredEvents.length})
          </Badge>
          <Badge variant={excludedCount > 0 ? 'warning' : 'neutral'} size="sm">
            Tanpa lokasi: {excludedCount}
          </Badge>
        </div>
      </div>

      {/* Mode Selector & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-panel bg-panel border border-line text-xs">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Mode visualisasi peta">
          <button
            type="button"
            onClick={() => setMode('markers')}
            className={`px-3 py-1.5 min-h-[44px] rounded-control border font-medium transition-colors cursor-pointer ${
              mode === 'markers'
                ? 'bg-raised border-brand text-brand font-semibold'
                : 'bg-app border-line text-2 hover:text-1'
            }`}
            aria-pressed={mode === 'markers'}
          >
            Penanda Aksi
          </button>
          <button
            type="button"
            onClick={() => setMode('passes')}
            className={`px-3 py-1.5 min-h-[44px] rounded-control border font-medium transition-colors cursor-pointer ${
              mode === 'passes'
                ? 'bg-raised border-brand text-brand font-semibold'
                : 'bg-app border-line text-2 hover:text-1'
            }`}
            aria-pressed={mode === 'passes'}
          >
            Aliran Umpan
          </button>
          <button
            type="button"
            onClick={() => setMode('zones')}
            className={`px-3 py-1.5 min-h-[44px] rounded-control border font-medium transition-colors cursor-pointer ${
              mode === 'zones'
                ? 'bg-raised border-brand text-brand font-semibold'
                : 'bg-app border-line text-2 hover:text-1'
            }`}
            aria-pressed={mode === 'zones'}
          >
            Kisi 6x3 Zona
          </button>
        </div>

        {/* Quick Reset Filters */}
        <button
          type="button"
          onClick={() => {
            setTeamFilter('all');
            setPlayerFilter('all');
            setPeriodFilter('all');
            setTypeFilter('all');
            setMinMinute('');
            setMaxMinute('');
          }}
          className="px-2.5 py-1.5 min-h-[44px] rounded-control border border-line bg-app text-2 hover:text-1 cursor-pointer transition-colors"
        >
          Reset Filter
        </button>
      </div>

      {/* Filter Bar (Keyboard Accessible) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 rounded-panel bg-panel border border-line text-xs">
        {/* Team Filter */}
        <div>
          <label htmlFor="filter-team" className="block text-2 mb-1 font-medium">Tim:</label>
          <select
            id="filter-team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full min-h-[44px] px-2 py-1.5 rounded-control bg-app border border-line text-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            <option value="all">Semua Tim</option>
            <option value="own">Tim Kita</option>
            <option value="opponent">Lawan</option>
          </select>
        </div>

        {/* Player Filter */}
        <div>
          <label htmlFor="filter-player" className="block text-2 mb-1 font-medium">Pemain:</label>
          <select
            id="filter-player"
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
            className="w-full min-h-[44px] px-2 py-1.5 rounded-control bg-app border border-line text-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            <option value="all">Semua Pemain</option>
            {playerOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Period Filter */}
        <div>
          <label htmlFor="filter-period" className="block text-2 mb-1 font-medium">Babak:</label>
          <select
            id="filter-period"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="w-full min-h-[44px] px-2 py-1.5 rounded-control bg-app border border-line text-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            <option value="all">Semua Babak</option>
            <option value="1">Babak 1</option>
            <option value="2">Babak 2</option>
            <option value="3">Ekstra 1</option>
            <option value="4">Ekstra 2</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div>
          <label htmlFor="filter-type" className="block text-2 mb-1 font-medium">Jenis Kejadian:</label>
          <select
            id="filter-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full min-h-[44px] px-2 py-1.5 rounded-control bg-app border border-line text-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            <option value="all">Semua Jenis</option>
            {ALLOWED_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>

        {/* Min Minute */}
        <div>
          <label htmlFor="filter-min-minute" className="block text-2 mb-1 font-medium">Dari Menit:</label>
          <input
            id="filter-min-minute"
            type="number"
            min="0"
            max={rawMaxMin}
            value={minMinute}
            placeholder="0"
            onChange={(e) => setMinMinute(e.target.value)}
            className="w-full min-h-[44px] px-2 py-1.5 rounded-control bg-app border border-line text-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand font-mono"
          />
        </div>

        {/* Max Minute */}
        <div>
          <label htmlFor="filter-max-minute" className="block text-2 mb-1 font-medium">Sampai Menit:</label>
          <input
            id="filter-max-minute"
            type="number"
            min="0"
            max={rawMaxMin}
            value={maxMinute}
            placeholder={String(rawMaxMin)}
            onChange={(e) => setMaxMinute(e.target.value)}
            className="w-full min-h-[44px] px-2 py-1.5 rounded-control bg-app border border-line text-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand font-mono"
          />
        </div>
      </div>

      {/* Main Pitch Visualization */}
      <div className="relative">
        <PitchSvg
          pitchLengthM={pitchLengthM}
          pitchWidthM={pitchWidthM}
          orientation="horizontal"
          className="shadow-sm"
        >
          {/* Arrow markers defs for pass mode */}
          <defs>
            <marker
              id="pass-arrow-success"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" className="fill-brand" />
            </marker>
            <marker
              id="pass-arrow-fail"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" className="fill-danger" />
            </marker>
          </defs>

          {/* MODE 1: MARKERS */}
          {mode === 'markers' && (
            <g>
              {plottedEvents.map((e) => {
                const x = Number(e.x_m);
                const y = Number(e.y_m);
                const isOwn = e.team === 'own';

                // Shape & styling per type
                const isShot = e.event_type === 'shot' || e.event_type === 'shot_on_target' || e.event_type === 'goal';
                const isDef = e.event_type === 'tackle' || e.event_type === 'interception' || e.event_type === 'clearance' || e.event_type === 'ball_recovery';
                const isLossOrFoul = e.event_type === 'ball_loss' || e.event_type === 'foul_committed';

                if (e.event_type === 'goal') {
                  return (
                    <g key={e.id || e.client_event_id} className="cursor-pointer">
                      <circle cx={x} cy={y} r="2.2" className="fill-brand stroke-app" strokeWidth="0.6" />
                      <circle cx={x} cy={y} r="0.8" className="fill-app" />
                    </g>
                  );
                }

                if (isShot) {
                  return (
                    <circle
                      key={e.id || e.client_event_id}
                      cx={x}
                      cy={y}
                      r={e.event_type === 'shot_on_target' ? '1.8' : '1.4'}
                      className={
                        e.event_type === 'shot_on_target'
                          ? isOwn ? 'fill-series-1 stroke-app' : 'fill-series-2 stroke-app'
                          : 'fill-transparent stroke-1'
                      }
                      strokeWidth="0.5"
                    />
                  );
                }

                if (isDef) {
                  return (
                    <rect
                      key={e.id || e.client_event_id}
                      x={x - 1.2}
                      y={y - 1.2}
                      width="2.4"
                      height="2.4"
                      className={isOwn ? 'fill-brand stroke-app' : 'fill-series-2 stroke-app'}
                      strokeWidth="0.4"
                    />
                  );
                }

                if (isLossOrFoul) {
                  return (
                    <polygon
                      key={e.id || e.client_event_id}
                      points={`${x},${y - 1.5} ${x + 1.3},${y + 1.2} ${x - 1.3},${y + 1.2}`}
                      className="fill-warning stroke-app"
                      strokeWidth="0.4"
                    />
                  );
                }

                // Default small circle for other events (passes, touches)
                return (
                  <circle
                    key={e.id || e.client_event_id}
                    cx={x}
                    cy={y}
                    r="1.0"
                    className={isOwn ? 'fill-1 opacity-70' : 'fill-2 opacity-60'}
                  />
                );
              })}
            </g>
          )}

          {/* MODE 2: PASSES */}
          {mode === 'passes' && (
            <g>
              {passesWithEnd.map((e) => {
                const isSuccess = e.outcome === 'success';
                return (
                  <g key={e.id || e.client_event_id}>
                    <line
                      x1={Number(e.x_m)}
                      y1={Number(e.y_m)}
                      x2={Number(e.end_x_m)}
                      y2={Number(e.end_y_m)}
                      className={isSuccess ? 'stroke-brand' : 'stroke-danger'}
                      strokeWidth="0.6"
                      strokeDasharray={isSuccess ? 'none' : '1.5,1.5'}
                      markerEnd={isSuccess ? 'url(#pass-arrow-success)' : 'url(#pass-arrow-fail)'}
                      opacity={0.8}
                    />
                    <circle cx={Number(e.x_m)} cy={Number(e.y_m)} r="0.8" className="fill-1" />
                  </g>
                );
              })}
            </g>
          )}

          {/* MODE 3: 6x3 ZONE GRID */}
          {mode === 'zones' && (
            <g>
              {zoneData.cells.map((cell) => {
                const cellW = pitchLengthM / 6;
                const cellH = pitchWidthM / 3;
                const cellX = cell.col * cellW;
                const cellY = cell.row * cellH;
                const opacity = maxZoneCount > 0 ? (cell.count / maxZoneCount) * 0.45 : 0;

                return (
                  <g key={`zone-${cell.col}-${cell.row}`}>
                    <rect
                      x={cellX}
                      y={cellY}
                      width={cellW}
                      height={cellH}
                      className="fill-brand stroke-line"
                      strokeWidth="0.3"
                      style={{ fillOpacity: opacity }}
                    />
                    <text
                      x={cellX + cellW / 2}
                      y={cellY + cellH / 2 + 1}
                      textAnchor="middle"
                      className="fill-1 font-mono text-xs select-none"
                      style={{ fontSize: '3px' }}
                    >
                      {cell.count}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </PitchSvg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-panel bg-panel border border-line text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap text-2">
          <span className="font-semibold text-1">Keterangan:</span>
          {mode === 'markers' && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" /> Gol
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-1 inline-block" /> Tembakan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-brand inline-block" /> Rebut/Tekel
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-warning inline-block" /> Kehilangan/Pelanggaran
              </span>
            </>
          )}
          {mode === 'passes' && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-4 h-0.5 bg-brand inline-block" /> Umpan Sukses
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-0.5 border-t border-dashed border-danger inline-block" /> Umpan Gagal
              </span>
              <span>(Hanya menampilkan umpan dengan titik akhir tercatat: {passesWithEnd.length})</span>
            </>
          )}
          {mode === 'zones' && (
            <>
              <span>Total kejadian berkoordinat: {zoneData.total_with_coords}</span>
              <span>Intensitas warna menunjukkan kepadatan aksi dalam kisi 6x3</span>
            </>
          )}
        </div>
        <div className="text-2 text-right">
          Arah serang tim kita: Kiri ke Kanan
        </div>
      </div>

      {/* Text Alternative Accessible Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-2 uppercase tracking-wider">
          Daftar Rinci Kejadian Terpilih (Alternatif Teks Aksesibilitas)
        </h3>
        <Table
          columns={[
            {
              key: 'minute',
              header: 'Waktu',
              render: (_val, row) => (
                <span className="font-mono text-xs">
                  B{row.period} • {Number(row.minute || 0).toFixed(1)}'
                </span>
              )
            },
            {
              key: 'team',
              header: 'Tim',
              render: (_val, row) => (
                <Badge variant={row.team === 'own' ? 'primary' : 'neutral'} size="sm">
                  {row.team === 'own' ? 'Tim Kita' : 'Lawan'}
                </Badge>
              )
            },
            {
              key: 'player_id',
              header: 'Pemain',
              render: (_val, row) => {
                if (row.team === 'opponent') {
                  return <span className="font-mono text-xs">#{row.opponent_number || '-'} Lawan</span>;
                }
                const info = playerMap[row.player_id] || {};
                return (
                  <span className="font-mono text-xs">
                    #{info.number || '-'} {info.name || row.player_id}
                  </span>
                );
              }
            },
            {
              key: 'event_type',
              header: 'Aksi',
              render: (_val, row) => (
                <span className="font-medium text-1">
                  {EVENT_TYPE_LABELS[row.event_type] || row.event_type}
                </span>
              )
            },
            {
              key: 'outcome',
              header: 'Hasil',
              render: (_val, row) => (
                <span className="text-xs font-mono">
                  {row.outcome === 'success' ? 'Sukses' : row.outcome === 'fail' ? 'Gagal' : '-'}
                </span>
              )
            },
            {
              key: 'x_m',
              header: 'Koordinat',
              render: (_val, row) => (
                <span className="font-mono text-xs text-2">
                  {row.x_m != null ? `(${row.x_m}m, ${row.y_m}m)` : 'Tanpa koordinat'}
                </span>
              )
            }
          ]}
          data={filteredEvents.slice(0, 50)}
          emptyMessage="Tidak ada kejadian yang cocok dengan filter."
        />
        {filteredEvents.length > 50 && (
          <p className="text-xs text-2 font-mono text-center">
            Menampilkan 50 kejadian pertama dari total {filteredEvents.length} kejadian terpilih.
          </p>
        )}
      </div>
    </div>
  );
}
