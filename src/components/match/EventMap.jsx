import React, { useState, useMemo } from 'react';
import PitchSvg from '../ui/PitchSvg';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Term from '../ux/Term';
import { EVENT_TYPE_LABELS, ALLOWED_EVENT_TYPES } from '../../lib/matches';
import { zoneGrid } from '../../lib/analysis/events';

const KEY_MOMENT_TYPES = new Set([
  'goal',
  'shot',
  'shot_on_target',
  'tackle',
  'interception',
  'clearance',
  'ball_recovery',
  'ball_loss',
  'foul_committed',
  'key_pass'
]);

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
  const [densityMode, setDensityMode] = useState('auto'); // 'auto' | 'key' | 'all'
  const [passDensityMode, setPassDensityMode] = useState('auto'); // 'auto' | 'progressive' | 'all'
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isAutoVision = useMemo(() => {
    const hasExplicitVision = events.some(
      (e) =>
        e.source === 'vision' ||
        String(e.id || '').startsWith('vision-') ||
        /otomatis|vision/i.test(String(e.note || ''))
    );
    if (hasExplicitVision) return true;
    return (
      events.length >= 100 &&
      events.every((e) => !e.player_id && (e.player_number != null || e.opponent_number != null))
    );
  }, [events]);

  // Find max minute in events for range bounds
  const rawMaxMin = useMemo(() => {
    let max = 45;
    let hasAbove45 = false;
    events.forEach((e) => {
      if (e.minute != null) {
        const m = Number(e.minute);
        if (m > 45) hasAbove45 = true;
        if (m > max) max = Math.ceil(m);
      }
    });
    return hasAbove45 ? Math.max(90, max) : Math.max(45, max);
  }, [events]);

  const minutePresets = useMemo(() => {
    const base = [
      { label: 'Semua', min: '', max: '' },
      { label: "0–15'", min: '0', max: '15' },
      { label: "15–30'", min: '15', max: '30' },
      { label: "30–45'", min: '30', max: '45' }
    ];
    if (rawMaxMin > 46) {
      base.push(
        { label: "45–60'", min: '45', max: '60' },
        { label: "60–75'", min: '60', max: '75' },
        { label: "75–90'", min: '75', max: '90' }
      );
    }
    return base;
  }, [rawMaxMin]);

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

  // Smart density for markers: if > 120 markers and user did not choose specific type, show key moments by default
  const isDenseMarkers = plottedEvents.length > 120 && typeFilter === 'all';
  const showOnlyKeyMarkers =
    densityMode === 'key' || (densityMode === 'auto' && isDenseMarkers);

  const visibleMarkers = useMemo(() => {
    if (!showOnlyKeyMarkers) return plottedEvents;
    const keyOnly = plottedEvents.filter((e) => KEY_MOMENT_TYPES.has(e.event_type));
    return keyOnly.length > 0 ? keyOnly : plottedEvents.slice(0, 120);
  }, [plottedEvents, showOnlyKeyMarkers]);

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

  const isDensePasses = passesWithEnd.length > 60;
  const showProgressivePassesOnly =
    passDensityMode === 'progressive' || (passDensityMode === 'auto' && isDensePasses);

  const visiblePasses = useMemo(() => {
    if (!showProgressivePassesOnly) return passesWithEnd;
    const ranked = passesWithEnd
      .map((e) => {
        const dx = Number(e.end_x_m) - Number(e.x_m);
        const dy = Number(e.end_y_m) - Number(e.y_m);
        const dist = Math.hypot(dx, dy);
        const forwardGain = e.team === 'opponent' ? -dx : dx;
        return { e, dist, forwardGain };
      })
      .filter((item) => item.e.event_type === 'key_pass' || item.dist >= 12 || item.forwardGain >= 8)
      .sort((a, b) => b.dist - a.dist)
      .slice(0, 60)
      .map((item) => item.e);
    return ranked.length > 0 ? ranked : passesWithEnd.slice(0, 60);
  }, [passesWithEnd, showProgressivePassesOnly]);

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

  const formatPlayerLabel = (row) => {
    if (row.team === 'opponent') {
      const num = row.opponent_number || row.player_number || '-';
      return `#${num} Lawan`;
    }
    const info = row.player_id ? (playerMap[row.player_id] || {}) : {};
    const num = info.number ?? row.player_number ?? '-';
    const name = info.name || row.player_name || (row.player_id ? row.player_id : 'Pemain Terdeteksi');
    return `#${num} ${name}`;
  };

  return (
    <div className="space-y-4">
      {/* Header & Mandatory Data Honesty Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-panel bg-panel border border-line">
        <div>
          <h2 className="text-base font-semibold text-1">Peta Kejadian Pertandingan</h2>
          <p className="text-sm text-2 mt-0.5">
            {isAutoVision
              ? 'Hasil deteksi otomatis dari video (estimasi posisi — arahkan kursor atau klik titik untuk detail).'
              : 'Data pencatatan manual; bukan pelacakan otomatis.'}
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-panel bg-panel border border-line text-sm">
        {/* Mode Toggle */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Mode visualisasi peta">
          <button
            type="button"
            onClick={() => { setMode('markers'); setSelectedEvent(null); }}
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
            onClick={() => { setMode('passes'); setSelectedEvent(null); }}
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
            onClick={() => { setMode('zones'); setSelectedEvent(null); }}
            className={`px-3 py-1.5 min-h-[44px] rounded-control border font-medium transition-colors cursor-pointer ${
              mode === 'zones'
                ? 'bg-raised border-brand text-brand font-semibold'
                : 'bg-app border-line text-2 hover:text-1'
            }`}
            aria-pressed={mode === 'zones'}
          >
            Peta zona (6×3)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Smart density toggle for dense marker datasets */}
          {mode === 'markers' && isDenseMarkers && (
            <div className="flex items-center gap-1 bg-app p-1 rounded-control border border-line" role="group" aria-label="Kepadatan penanda">
              <button
                type="button"
                onClick={() => setDensityMode('key')}
                className={`px-2.5 py-1 rounded text-sm font-medium cursor-pointer transition-colors ${
                  showOnlyKeyMarkers ? 'bg-brand text-app font-semibold' : 'text-2 hover:text-1'
                }`}
              >
                Momen Penting ({visibleMarkers.length})
              </button>
              <button
                type="button"
                onClick={() => setDensityMode('all')}
                className={`px-2.5 py-1 rounded text-sm font-medium cursor-pointer transition-colors ${
                  !showOnlyKeyMarkers ? 'bg-brand text-app font-semibold' : 'text-2 hover:text-1'
                }`}
              >
                Semua Aksi ({plottedEvents.length})
              </button>
            </div>
          )}

          {/* Smart density toggle for dense pass datasets */}
          {mode === 'passes' && isDensePasses && (
            <div className="flex items-center gap-1 bg-app p-1 rounded-control border border-line" role="group" aria-label="Kepadatan panah umpan">
              <button
                type="button"
                onClick={() => setPassDensityMode('progressive')}
                className={`px-2.5 py-1 rounded text-sm font-medium cursor-pointer transition-colors ${
                  showProgressivePassesOnly ? 'bg-brand text-app font-semibold' : 'text-2 hover:text-1'
                }`}
              >
                Umpan Kunci & Jauh ({visiblePasses.length})
              </button>
              <button
                type="button"
                onClick={() => setPassDensityMode('all')}
                className={`px-2.5 py-1 rounded text-sm font-medium cursor-pointer transition-colors ${
                  !showProgressivePassesOnly ? 'bg-brand text-app font-semibold' : 'text-2 hover:text-1'
                }`}
              >
                Semua Umpan ({passesWithEnd.length})
              </button>
            </div>
          )}

          <Term
            explanation="Lapangan dibagi 6 kolom × 3 baris untuk melihat di area mana kejadian paling sering terjadi."
          />

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
              setDensityMode('auto');
              setPassDensityMode('auto');
              setSelectedEvent(null);
            }}
            className="px-2.5 py-1.5 min-h-[44px] rounded-control border border-line bg-app text-2 hover:text-1 cursor-pointer transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Filter Bar (Keyboard Accessible) */}
      <div className="p-3 rounded-panel bg-panel border border-line text-sm space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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

        {/* Intuitive Quick Minute Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-2 mr-1">Filter Cepat Menit:</span>
            {minutePresets.map((preset) => {
              const isActive = minMinute === preset.min && maxMinute === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setMinMinute(preset.min);
                    setMaxMinute(preset.max);
                  }}
                  className={`px-2 py-1 rounded text-sm font-medium border cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-brand text-app border-brand font-semibold'
                      : 'bg-app text-2 border-line hover:text-1'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <span className="text-sm text-2">
            Pilih blok waktu 15 menit atau ketik angka menit manual di atas
          </span>
        </div>
      </div>

      {/* Clear Legend & Reading Guide ABOVE the pitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-panel bg-panel border border-line text-sm">
        <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-2">
          <span className="font-semibold text-1">Cara Baca Peta:</span>
          {mode === 'markers' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-brand ring-2 ring-app inline-block" /> Gol
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-series-1 inline-block" /> Tembakan Tepat Sasaran
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-1 inline-block" /> Tembakan Melenceng
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-brand inline-block" /> Rebut/Tekel Tim Kita
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-series-2 inline-block" /> Rebut/Tekel Lawan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-warning inline-block" /> Kehilangan/Pelanggaran
              </span>
              {!showOnlyKeyMarkers && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-1 opacity-70 inline-block" /> Umpan / Sentuhan
                </span>
              )}
            </>
          )}
          {mode === 'passes' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-brand inline-block" /> Panah Hijau = Umpan Sukses
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-danger inline-block" /> Garis Putus Merah = Umpan Gagal
              </span>
              <span className="text-1 font-medium">
                Menampilkan {visiblePasses.length} dari {passesWithEnd.length} umpan
              </span>
            </>
          )}
          {mode === 'zones' && (
            <>
              <span>Angka di kotak = jumlah kejadian di zona tersebut (total berkoordinat: {zoneData.total_with_coords})</span>
              <span>Semakin gelap warna hijau, semakin sering aksi terjadi di area itu</span>
            </>
          )}
        </div>
        <div className="text-2 font-medium shrink-0">
          Arah serang tim kita: Kiri → Kanan
        </div>
      </div>

      {/* Selected Event Inspector Banner */}
      {selectedEvent && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-control bg-raised border border-brand text-sm">
          <div className="flex flex-wrap items-center gap-2 text-1">
            <Badge variant={selectedEvent.team === 'own' ? 'primary' : 'neutral'} size="sm">
              {selectedEvent.team === 'own' ? 'Tim Kita' : 'Lawan'}
            </Badge>
            <span className="font-mono font-semibold tabular-nums">
              B{selectedEvent.period || 1} • {Number(selectedEvent.minute || 0).toFixed(1)}'
            </span>
            <span className="font-semibold">
              {EVENT_TYPE_LABELS[selectedEvent.event_type] || selectedEvent.event_type}
            </span>
            <span className="text-2">• {formatPlayerLabel(selectedEvent)}</span>
            <span className="text-2">
              • {selectedEvent.outcome === 'success' ? 'Sukses' : selectedEvent.outcome === 'fail' ? 'Gagal' : 'Tercatat'}
            </span>
            {selectedEvent.x_m != null && (
              <span className="text-2 font-mono">
                ({selectedEvent.x_m}m, {selectedEvent.y_m}m)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedEvent(null)}
            className="text-2 hover:text-1 cursor-pointer bg-transparent border-none font-medium"
          >
            Tutup
          </button>
        </div>
      )}

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
              {visibleMarkers.map((e) => {
                const x = Number(e.x_m);
                const y = Number(e.y_m);
                const isOwn = e.team === 'own';
                const tooltipText = `B${e.period || 1} ${Number(e.minute || 0).toFixed(1)}' • ${isOwn ? 'Tim Kita' : 'Lawan'} • ${formatPlayerLabel(e)} • ${EVENT_TYPE_LABELS[e.event_type] || e.event_type}`;

                // Shape & styling per type
                const isShot = e.event_type === 'shot' || e.event_type === 'shot_on_target' || e.event_type === 'goal';
                const isDef = e.event_type === 'tackle' || e.event_type === 'interception' || e.event_type === 'clearance' || e.event_type === 'ball_recovery';
                const isLossOrFoul = e.event_type === 'ball_loss' || e.event_type === 'foul_committed';

                if (e.event_type === 'goal') {
                  return (
                    <g
                      key={e.id || e.client_event_id}
                      className="cursor-pointer"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <title>{tooltipText}</title>
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
                      className={`cursor-pointer ${
                        e.event_type === 'shot_on_target'
                          ? isOwn ? 'fill-series-1 stroke-app' : 'fill-series-2 stroke-app'
                          : 'fill-transparent stroke-1'
                      }`}
                      strokeWidth="0.5"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <title>{tooltipText}</title>
                    </circle>
                  );
                }

                if (isDef) {
                  return (
                    <rect
                      key={e.id || e.client_event_id}
                      x={x - 1.15}
                      y={y - 1.15}
                      width="2.3"
                      height="2.3"
                      className={`cursor-pointer ${isOwn ? 'fill-brand stroke-app' : 'fill-series-2 stroke-app'}`}
                      strokeWidth="0.35"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <title>{tooltipText}</title>
                    </rect>
                  );
                }

                if (isLossOrFoul) {
                  return (
                    <polygon
                      key={e.id || e.client_event_id}
                      points={`${x},${y - 1.4} ${x + 1.2},${y + 1.1} ${x - 1.2},${y + 1.1}`}
                      className="fill-warning stroke-app cursor-pointer"
                      strokeWidth="0.35"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <title>{tooltipText}</title>
                    </polygon>
                  );
                }

                // Default small circle for other events (passes, touches)
                return (
                  <circle
                    key={e.id || e.client_event_id}
                    cx={x}
                    cy={y}
                    r={isDenseMarkers ? '0.65' : '0.95'}
                    className={`cursor-pointer ${isOwn ? 'fill-1 opacity-55' : 'fill-2 opacity-45'}`}
                    onClick={() => setSelectedEvent(e)}
                  >
                    <title>{tooltipText}</title>
                  </circle>
                );
              })}
            </g>
          )}

          {/* MODE 2: PASSES */}
          {mode === 'passes' && (
            <g>
              {visiblePasses.map((e) => {
                const isSuccess = e.outcome === 'success';
                const tooltipText = `B${e.period || 1} ${Number(e.minute || 0).toFixed(1)}' • ${e.team === 'own' ? 'Tim Kita' : 'Lawan'} • ${formatPlayerLabel(e)} • Umpan (${isSuccess ? 'Sukses' : 'Gagal'})`;
                return (
                  <g
                    key={e.id || e.client_event_id}
                    className="cursor-pointer"
                    onClick={() => setSelectedEvent(e)}
                  >
                    <title>{tooltipText}</title>
                    <line
                      x1={Number(e.x_m)}
                      y1={Number(e.y_m)}
                      x2={Number(e.end_x_m)}
                      y2={Number(e.end_y_m)}
                      className={isSuccess ? 'stroke-brand' : 'stroke-danger'}
                      strokeWidth={showProgressivePassesOnly ? '0.55' : '0.4'}
                      strokeDasharray={isSuccess ? 'none' : '1.5,1.5'}
                      markerEnd={isSuccess ? 'url(#pass-arrow-success)' : 'url(#pass-arrow-fail)'}
                      opacity={showProgressivePassesOnly ? 0.85 : 0.45}
                    />
                    <circle cx={Number(e.x_m)} cy={Number(e.y_m)} r="0.65" className="fill-1" />
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
                      className="fill-1 font-mono text-sm select-none"
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

      {/* Text Alternative Accessible Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-2 uppercase tracking-wider">
          Daftar Rinci Kejadian Terpilih (Alternatif Teks Aksesibilitas)
        </h3>
        <Table
          columns={[
            {
              key: 'minute',
              header: 'Waktu',
              render: (_val, row) => (
                <span className="tabular-nums text-sm">
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
                  return (
                    <span className="text-sm">
                      <span className="font-mono tabular-nums">#{row.opponent_number || row.player_number || '-'}</span> Lawan
                    </span>
                  );
                }
                const info = row.player_id ? (playerMap[row.player_id] || {}) : {};
                const num = info.number ?? row.player_number ?? '-';
                const name = info.name || row.player_name || (row.player_id ? row.player_id : 'Pemain Terdeteksi');
                return (
                  <span className="text-sm">
                    <span className="font-mono tabular-nums">#{num}</span> {name}
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
                <span className="text-sm">
                  {row.outcome === 'success' ? 'Sukses' : row.outcome === 'fail' ? 'Gagal' : '-'}
                </span>
              )
            },
            {
              key: 'x_m',
              header: 'Koordinat',
              render: (_val, row) => (
                <span className="text-sm text-2 tabular-nums">
                  {row.x_m != null ? `(${row.x_m}m, ${row.y_m}m)` : 'Tanpa koordinat'}
                </span>
              )
            }
          ]}
          data={filteredEvents.slice(0, 50)}
          emptyMessage="Tidak ada kejadian yang cocok dengan filter."
        />
        {filteredEvents.length > 50 && (
          <p className="text-sm text-2 text-center tabular-nums">
            Menampilkan 50 kejadian pertama dari total {filteredEvents.length} kejadian terpilih.
          </p>
        )}
      </div>
    </div>
  );
}
