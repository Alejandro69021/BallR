import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import {
  listMatches,
  createMatch,
  PITCH_DEFAULTS_BY_FORMAT,
  formatMatchError
} from '../lib/matches';
import Table from '../components/ui/Table';
import Dialog from '../components/ui/Dialog';
import Field from '../components/ui/Field';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function MatchesPage({ userRole = 'public', onToast, onOpenAuthModal }) {
  const navigate = useNavigate();
  const { players } = usePlayers();

  const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin';

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('match_date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Create match modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [competition, setCompetition] = useState('');
  const [format, setFormat] = useState('11v11');
  const [pitchLength, setPitchLength] = useState(90);
  const [pitchWidth, setPitchWidth] = useState(60);
  const [selectedParticipants, setSelectedParticipants] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadMatchesList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMatches();
      setMatches(data || []);
    } catch (err) {
      console.warn('Gagal memuat daftar pertandingan:', err);
      onToast?.({
        title: 'Gagal Memuat Laga',
        subtext: formatMatchError(err),
        variant: 'error'
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    loadMatchesList();
  }, [loadMatchesList]);

  // When format changes, update pitch defaults
  const handleFormatChange = (e) => {
    const nextFormat = e.target.value;
    setFormat(nextFormat);
    const defaults = PITCH_DEFAULTS_BY_FORMAT[nextFormat] || { pitch_length_m: 90, pitch_width_m: 60 };
    setPitchLength(defaults.pitch_length_m);
    setPitchWidth(defaults.pitch_width_m);
  };

  const handleOpenCreateModal = () => {
    setOpponentName('');
    setMatchDate(new Date().toISOString().split('T')[0]);
    setCompetition('');
    setFormat('11v11');
    setPitchLength(90);
    setPitchWidth(60);
    setCreateError(null);

    // Initialize all roster players as checked participants by default
    const initialParticipants = {};
    if (players && players.length > 0) {
      players.forEach((p, idx) => {
        const pid = p.player_id || p.public_id;
        initialParticipants[pid] = {
          selected: true,
          started: idx < 11,
          position: p.personal_info?.position || ''
        };
      });
    }
    setSelectedParticipants(initialParticipants);
    setIsCreateOpen(true);
  };

  const handleToggleParticipant = (pid) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        selected: !prev[pid]?.selected
      }
    }));
  };

  const handleToggleStarter = (pid) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        started: !prev[pid]?.started
      }
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!opponentName.trim()) {
      setCreateError('Nama lawan wajib diisi');
      return;
    }
    if (!matchDate) {
      setCreateError('Tanggal pertandingan wajib diisi');
      return;
    }

    setSubmitting(true);
    setCreateError(null);

    try {
      const participantsList = Object.entries(selectedParticipants)
        .filter(([, val]) => val?.selected)
        .map(([pid, val]) => ({
          player_id: pid,
          started: Boolean(val?.started),
          position: val?.position || '',
          minute_in: val?.started ? 0 : null,
          minute_out: null
        }));

      const newMatch = await createMatch({
        opponent_name: opponentName.trim(),
        match_date: matchDate,
        competition: competition.trim(),
        format,
        pitch_length_m: Number(pitchLength),
        pitch_width_m: Number(pitchWidth),
        participants: participantsList
      });

      setIsCreateOpen(false);
      onToast?.({
        title: 'Laga Baru Berhasil Dibuat',
        subtext: `Pertandingan melawan ${newMatch.opponent_name} tercatat sebagai draf.`,
        variant: 'success'
      });
      await loadMatchesList();
      navigate(`/laga/${newMatch.id}`);
    } catch (err) {
      console.warn('Gagal membuat pertandingan:', err);
      const indonesianError = formatMatchError(err);
      setCreateError(indonesianError);
      onToast?.({
        title: 'Gagal Membuat Laga',
        subtext: indonesianError,
        variant: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const list = [...matches];
    list.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'match_date') {
        aVal = new Date(a.match_date).getTime();
        bVal = new Date(b.match_date).getTime();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [matches, sortKey, sortDirection]);

  const columns = [
    {
      key: 'match_date',
      header: 'Tanggal',
      tabular: true,
      sortable: true,
      render: (val) => val || '-'
    },
    {
      key: 'opponent_name',
      header: 'Lawan',
      sortable: true,
      render: (val, row) => (
        <button
          type="button"
          onClick={() => navigate(`/laga/${row.id}`)}
          className="font-medium text-1 hover:text-brand transition-colors text-left focus-visible:outline-none focus-visible:underline cursor-pointer"
        >
          {val}
        </button>
      )
    },
    {
      key: 'competition',
      header: 'Kompetisi',
      render: (val) => val || '-'
    },
    {
      key: 'format',
      header: 'Format',
      tabular: true,
      render: (val) => <span className="font-mono">{val || '11v11'}</span>
    },
    {
      key: 'score',
      header: 'Skor',
      tabular: true,
      align: 'center',
      render: (_val, row) => {
        if (row.own_score != null && row.opponent_score != null) {
          return `${row.own_score} - ${row.opponent_score}`;
        }
        return '-';
      }
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => (
        <Badge variant={val === 'final' ? 'brand' : 'neutral'} size="sm">
          {val === 'final' ? 'Final' : 'Draf'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (_val, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/laga/${row.id}`)}
        >
          Detail
        </Button>
      )
    }
  ];

  if (!isCoachOrAdmin) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="p-8 border border-line rounded-panel bg-panel text-center space-y-4">
          <Trophy className="w-8 h-8 text-2 mx-auto" strokeWidth={1.5} />
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-1">Rekaman Pertandingan Akademi</h1>
            <p className="text-xs text-2 max-w-md mx-auto">
              Halaman manajemen laga hanya dapat diakses oleh staf pelatih dan admin akademi terdaftar.
            </p>
          </div>
          <Button
            variant="brand"
            size="sm"
            onClick={() => onOpenAuthModal?.('matches')}
          >
            Masuk sebagai pelatih
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand" strokeWidth={1.5} />
            <h1 className="text-xl font-semibold text-1">Rekaman Pertandingan</h1>
          </div>
          <p className="text-xs text-2">
            Daftar pertandingan resmi akademi, ukuran lapangan, dan catatan kejadian teknis.
          </p>
        </div>

        <Button
          variant="brand"
          size="md"
          icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
          onClick={handleOpenCreateModal}
        >
          Laga baru
        </Button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-8 border border-line rounded-panel bg-panel text-center">
          <p className="text-xs text-2">Memuat daftar pertandingan...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-8 border border-line rounded-panel bg-panel">
          <EmptyState
            title="Belum ada data laga"
            description="Mulai dengan mencatat pertandingan pertama akademi Anda."
            actionLabel="Buat laga baru"
            onAction={handleOpenCreateModal}
          />
        </div>
      ) : (
        <Table
          columns={columns}
          data={sortedMatches}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyMessage="Belum ada rekaman laga"
        />
      )}

      {/* Modal: Laga baru */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Laga baru"
        description="Catat jadwal dan konfigurasi teknis pertandingan akademi."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Field label="Nama tim lawan" id="opponent-name" required error={createError}>
            <input
              id="opponent-name"
              type="text"
              required
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="Contoh: SSB Bintang Muda"
              className="w-full px-3 h-8 bg-app border border-control rounded-control text-xs text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tanggal pertandingan" id="match-date" required>
              <input
                id="match-date"
                type="date"
                required
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-3 h-8 bg-app border border-control rounded-control text-xs text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>

            <Field label="Nama kompetisi / ajang" id="match-competition">
              <input
                id="match-competition"
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder="Contoh: Liga Remaja U-13"
                className="w-full px-3 h-8 bg-app border border-control rounded-control text-xs text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Format pertandingan" id="match-format" required>
              <Select
                id="match-format"
                value={format}
                onChange={handleFormatChange}
                options={[
                  { value: '5v5', label: '5v5 (Futsal / Mini)' },
                  { value: '7v7', label: '7v7 (Grassroots)' },
                  { value: '9v9', label: '9v9 (Peralihan)' },
                  { value: '11v11', label: '11v11 (Standar Penuh)' }
                ]}
              />
            </Field>

            <Field label="Panjang lapangan (m)" id="pitch-length" required helper="Min 20 m, maks 120 m">
              <input
                id="pitch-length"
                type="number"
                min="20"
                max="120"
                step="0.5"
                required
                value={pitchLength}
                onChange={(e) => setPitchLength(e.target.value)}
                className="w-full px-3 h-8 bg-app border border-control rounded-control text-xs font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>

            <Field label="Lebar lapangan (m)" id="pitch-width" required helper="Min 15 m, maks 90 m">
              <input
                id="pitch-width"
                type="number"
                min="15"
                max="90"
                step="0.5"
                required
                value={pitchWidth}
                onChange={(e) => setPitchWidth(e.target.value)}
                className="w-full px-3 h-8 bg-app border border-control rounded-control text-xs font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>
          </div>

          {/* Participants picker from roster */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-2">Pemain yang bertanding (skuad)</label>
              <span className="text-xs text-2 font-mono">
                {Object.values(selectedParticipants).filter((v) => v?.selected).length} terpilih
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-line border border-line rounded-control bg-app p-2 space-y-1">
              {players && players.length > 0 ? (
                players.map((p) => {
                  const pid = p.player_id || p.public_id;
                  const part = selectedParticipants[pid] || { selected: false, started: false };
                  const num = p.personal_info?.jersey_number ?? '-';
                  const name = p.personal_info?.nickname || p.personal_info?.full_name || pid;
                  const pos = p.personal_info?.position || '-';

                  return (
                    <div
                      key={pid}
                      className="flex items-center justify-between py-1 px-1.5 hover:bg-raised/40 rounded transition-colors text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                        <input
                          type="checkbox"
                          checked={Boolean(part.selected)}
                          onChange={() => handleToggleParticipant(pid)}
                          className="rounded border-control text-brand focus:ring-brand"
                        />
                        <span className="font-mono text-2 w-6 text-right shrink-0">#{num}</span>
                        <span className="font-medium text-1 truncate">{name}</span>
                        <Badge variant="neutral" size="sm">{pos}</Badge>
                      </label>

                      {part.selected && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-2 hover:text-1 select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(part.started)}
                            onChange={() => handleToggleStarter(pid)}
                            className="rounded border-control text-brand focus:ring-brand"
                          />
                          <span>Starter</span>
                        </label>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-2 py-2 text-center">Belum ada pemain di skuad</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              loading={submitting}
            >
              Buat laga
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
