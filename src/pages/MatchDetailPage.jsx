import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  FileText
} from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import {
  getMatch,
  listEvents,
  listParticipants,
  finaliseMatch,
  reopenMatch,
  deleteEvent,
  EVENT_TYPE_LABELS,
  formatMatchError
} from '../lib/matches';
import Table from '../components/ui/Table';
import Dialog from '../components/ui/Dialog';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import EventMap from '../components/match/EventMap';

export default function MatchDetailPage({ userRole = 'public', onToast }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { players } = usePlayers();

  const isCoach = userRole === 'coach' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Finalise modal state
  const [isFinaliseOpen, setIsFinaliseOpen] = useState(false);
  const [ownScoreInput, setOwnScoreInput] = useState('');
  const [oppScoreInput, setOppScoreInput] = useState('');
  const [finalising, setFinalising] = useState(false);
  const [finaliseError, setFinaliseError] = useState(null);

  // Reopen loading state
  const [reopening, setReopening] = useState(false);

  // Deleting event state
  const [deletingEvtId, setDeletingEvtId] = useState(null);

  // Map player_id to friendly display
  const playerMap = useMemo(() => {
    const map = {};
    if (players && players.length > 0) {
      players.forEach((p) => {
        const pid = p.player_id || p.public_id;
        const num = p.personal_info?.jersey_number != null ? p.personal_info.jersey_number : null;
        const name = p.personal_info?.nickname || p.personal_info?.full_name || 'Pemain tanpa nama';
        map[pid] = {
          name,
          number: num,
          position: p.personal_info?.position || ''
        };
      });
    }
    if (participants && participants.length > 0) {
      participants.forEach((part) => {
        if (!map[part.player_id]) {
          map[part.player_id] = {
            name: part.player_name || 'Pemain tanpa nama',
            number: part.jersey_number != null ? part.jersey_number : null,
            position: part.position || ''
          };
        } else {
          if (map[part.player_id].number == null && part.jersey_number != null) {
            map[part.player_id].number = part.jersey_number;
          }
          if ((!map[part.player_id].name || map[part.player_id].name.startsWith('PLAYER-') || map[part.player_id].name.startsWith('WK-')) && part.player_name) {
            map[part.player_id].name = part.player_name;
          }
        }
      });
    }
    return map;
  }, [players, participants]);

  const loadMatchData = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const matchData = await getMatch(matchId);
      if (!matchData) {
        setMatch(null);
        return;
      }
      setMatch(matchData);

      const [eventsData, participantsData] = await Promise.all([
        listEvents(matchId),
        listParticipants(matchId)
      ]);
      setEvents(eventsData || []);
      setParticipants(participantsData || []);
    } catch (err) {
      console.warn('Gagal memuat detail laga:', err);
      onToast?.({
        title: 'Gagal Memuat Laga',
        subtext: formatMatchError(err),
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [matchId, onToast]);

  useEffect(() => {
    loadMatchData();
  }, [loadMatchData]);

  // Statistics computations
  const totalEvents = events.length;

  const eventCountsByType = useMemo(() => {
    const counts = {};
    events.forEach((evt) => {
      const type = evt.event_type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const eventCountsByPlayer = useMemo(() => {
    const counts = {};
    let opponentEvents = 0;

    events.forEach((evt) => {
      if (evt.team === 'own' && evt.player_id) {
        counts[evt.player_id] = (counts[evt.player_id] || 0) + 1;
      } else if (evt.team === 'opponent') {
        opponentEvents += 1;
      }
    });

    const ownList = Object.entries(counts)
      .map(([pid, count]) => {
        const info = playerMap[pid] || { name: 'Pemain tanpa nama', number: null };
        const name = info.name && !info.name.startsWith('PLAYER-') && !info.name.startsWith('WK-') ? info.name : 'Pemain tanpa nama';
        return {
          id: pid,
          name,
          number: info.number != null && info.number !== '-' && info.number !== '' ? info.number : null,
          count
        };
      })
      .sort((a, b) => b.count - a.count);

    return { ownList, opponentEvents };
  }, [events, playerMap]);

  // Finalise flow
  const loggedGoals = useMemo(() => {
    let own = 0;
    let opp = 0;
    (events || []).forEach((e) => {
      if (e.event_type === 'goal') {
        if (e.team === 'own') own++;
        else if (e.team === 'opponent') opp++;
      }
    });
    return { own, opp };
  }, [events]);

  const handleOpenFinalise = () => {
    setOwnScoreInput('');
    setOppScoreInput('');
    setFinaliseError(null);
    setIsFinaliseOpen(true);
  };

  const handleFinaliseSubmit = async (e) => {
    e.preventDefault();
    if (ownScoreInput === '' || oppScoreInput === '') {
      setFinaliseError('Skor tim sendiri dan lawan wajib diisi');
      return;
    }
    const own = Number(ownScoreInput);
    const opp = Number(oppScoreInput);
    if (isNaN(own) || isNaN(opp) || own < 0 || opp < 0) {
      setFinaliseError('Skor harus berupa angka positif atau nol');
      return;
    }

    setFinalising(true);
    setFinaliseError(null);

    try {
      const updated = await finaliseMatch(matchId, {
        ownScore: own,
        opponentScore: opp
      });
      setMatch(updated);
      setIsFinaliseOpen(false);
      onToast?.({
        title: 'Laga Berhasil Difinalkan',
        subtext: `Skor akhir ${updated.own_score} - ${updated.opponent_score} telah disimpan.`,
        variant: 'success'
      });
    } catch (err) {
      console.warn('Gagal memfinalkan laga:', err);
      const indonesianError = formatMatchError(err);
      setFinaliseError(indonesianError);
      onToast?.({
        title: 'Gagal Memfinalkan Laga',
        subtext: indonesianError,
        variant: 'error'
      });
    } finally {
      setFinalising(false);
    }
  };

  // Reopen flow (admin only)
  const handleReopen = async () => {
    if (!isAdmin) {
      onToast?.({
        title: 'Akses Ditolak',
        subtext: 'Hanya admin yang dapat membuka kembali pertandingan final.',
        variant: 'error'
      });
      return;
    }

    setReopening(true);
    try {
      const updated = await reopenMatch(matchId);
      setMatch(updated);
      onToast?.({
        title: 'Laga Dibuka Kembali',
        subtext: 'Status pertandingan kembali ke draf. Kejadian dapat diubah.',
        variant: 'info'
      });
    } catch (err) {
      console.warn('Gagal membuka kembali laga:', err);
      onToast?.({
        title: 'Gagal Membuka Kembali',
        subtext: formatMatchError(err),
        variant: 'error'
      });
    } finally {
      setReopening(false);
    }
  };

  // Delete event flow (only in draft)
  const handleDeleteEvent = async (eventId) => {
    if (match?.status === 'final') {
      onToast?.({
        title: 'Pertandingan Final',
        subtext: 'Pertandingan sudah final; buka kembali sebagai draf untuk menghapus kejadian.',
        variant: 'warning'
      });
      return;
    }

    setDeletingEvtId(eventId);
    try {
      await deleteEvent(eventId, matchId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId && e.client_event_id !== eventId));
      onToast?.({
        title: 'Kejadian Dihapus',
        subtext: 'Data kejadian berhasil dihapus dari pertandingan.',
        variant: 'info'
      });
    } catch (err) {
      console.warn('Gagal menghapus kejadian:', err);
      onToast?.({
        title: 'Gagal Menghapus Kejadian',
        subtext: formatMatchError(err),
        variant: 'error'
      });
    } finally {
      setDeletingEvtId(null);
    }
  };

  const columns = [
    {
      key: 'period',
      header: 'Babak',
      tabular: true,
      align: 'center',
      render: (val) => `B${val}`
    },
    {
      key: 'minute',
      header: 'Menit',
      tabular: true,
      align: 'right',
      render: (val) => `${val}'`
    },
    {
      key: 'team',
      header: 'Tim',
      render: (val) => (
        <Badge variant={val === 'own' ? 'brand' : 'neutral'} size="sm">
          {val === 'own' ? 'Tim sendiri' : 'Lawan'}
        </Badge>
      )
    },
    {
      key: 'player',
      header: 'Pemain / Lawan',
      render: (_val, row) => {
        if (row.team === 'own') {
          if (!row.player_id) return <span className="text-2">-</span>;
          const info = playerMap[row.player_id];
          const name = info?.name && !info.name.startsWith('PLAYER-') && !info.name.startsWith('WK-')
            ? info.name
            : 'Pemain tanpa nama';
          const numDisplay =
            info?.number != null && info?.number !== '-' && info?.number !== ''
              ? `#${info.number}`
              : 'Tanpa nomor';
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-2">{numDisplay}</span>
              <span className="font-medium text-1">{name}</span>
            </div>
          );
        }
        return (
          <span className="font-mono text-2">
            {row.opponent_number != null ? `Lawan #${row.opponent_number}` : 'Lawan'}
          </span>
        );
      }
    },
    {
      key: 'event_type',
      header: 'Jenis',
      render: (val) => EVENT_TYPE_LABELS[val] || val
    },
    {
      key: 'outcome',
      header: 'Hasil',
      align: 'center',
      render: (val) => {
        if (val === 'success') {
          return <Badge variant="brand" size="sm">Sukses</Badge>;
        }
        if (val === 'fail') {
          return <Badge variant="danger" size="sm">Gagal</Badge>;
        }
        return <span className="text-2">-</span>;
      }
    },
    {
      key: 'coordinates',
      header: 'Koordinat',
      tabular: true,
      render: (_val, row) => {
        if (row.x_m != null && row.y_m != null) {
          return (
            <span className="font-mono text-2">
              {row.x_m}, {row.y_m} m
            </span>
          );
        }
        return <span className="text-2">-</span>;
      }
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (_val, row) => {
        if (match?.status === 'final') return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={deletingEvtId === row.id}
            onClick={() => handleDeleteEvent(row.id)}
            className="text-2 hover:text-danger"
          >
            Hapus
          </Button>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 border border-line rounded-panel bg-panel text-center">
        <p className="text-xs text-2">Memuat detail pertandingan...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => navigate('/laga')}
        >
          Kembali ke daftar laga
        </Button>
        <div className="p-8 border border-line rounded-panel bg-panel">
          <EmptyState
            title="Pertandingan tidak ditemukan"
            description="Pertandingan yang Anda cari tidak tersedia atau telah dihapus."
            actionLabel="Daftar laga"
            onAction={() => navigate('/laga')}
          />
        </div>
      </div>
    );
  }

  const isFinal = match.status === 'final';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header back & actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => navigate('/laga')}
        >
          Kembali ke daftar laga
        </Button>

        <div className="flex items-center gap-2">
          {!isFinal && isCoach && (
            <Button
              variant="brand"
              size="sm"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={handleOpenFinalise}
            >
              Selesaikan laga
            </Button>
          )}

          {isFinal && isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              loading={reopening}
              onClick={handleReopen}
            >
              Buka kembali
            </Button>
          )}

          {isCoach && (
            <Button
              variant="secondary"
              size="sm"
              icon={<FileText className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/laga/${match.id}/laporan`)}
            >
              Laporan
            </Button>
          )}

          {isCoach && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/pencatatan/${match.id}`)}
            >
              {isFinal ? 'Lihat rekaman' : 'Catat kejadian'}
            </Button>
          )}
        </div>
      </div>

      {/* Match Header Card */}
      <div className="p-5 border border-line rounded-panel bg-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-2">vs</span>
              <h1 className="text-xl font-semibold text-1">{match.opponent_name}</h1>
              <Badge variant={isFinal ? 'brand' : 'neutral'} size="sm">
                {isFinal ? 'Final' : 'Draf'}
              </Badge>
              <Badge variant="neutral" size="sm">{match.format}</Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-2 flex-wrap pt-1">
              {match.competition && (
                <span>{match.competition}</span>
              )}
              <span className="font-mono tabular-nums">{match.match_date}</span>
              <span className="font-mono tabular-nums">
                Ukuran lapangan: {match.pitch_length_m} x {match.pitch_width_m} m
              </span>
              {participants.length > 0 && (
                <span className="font-mono tabular-nums">
                  {participants.length} pemain terdaftar
                </span>
              )}
            </div>
          </div>

          {/* Score display */}
          <div className="border border-line rounded-control bg-app px-4 py-2.5 text-center shrink-0 min-w-[120px]">
            <span className="block text-xs text-2 uppercase tracking-wider font-medium">Skor Akhir</span>
            {isFinal ? (
              <span className="text-xl font-mono tabular-nums font-bold text-1">
                {match.own_score} - {match.opponent_score}
              </span>
            ) : (
              <span className="text-xs text-2 italic">Draf (belum selesai)</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards: Event Breakdown & Player Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Event Type Counts */}
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="text-sm font-semibold text-1">Distribusi Kejadian</h2>
            <span className="text-xs text-2 font-mono tabular-nums">
              Total n = {totalEvents}
            </span>
          </div>

          {eventCountsByType.length === 0 ? (
            <p className="text-xs text-2 py-2">Belum ada kejadian tercatat.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {eventCountsByType.map(([type, count]) => (
                <div
                  key={type}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-raised border border-line text-xs"
                >
                  <span className="text-1 font-medium">{EVENT_TYPE_LABELS[type] || type}</span>
                  <span className="font-mono tabular-nums text-2">n = {count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player Counts */}
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="text-sm font-semibold text-1">Keterlibatan Pemain</h2>
            <span className="text-xs text-2 font-mono tabular-nums">
              Lawan n = {eventCountsByPlayer.opponentEvents}
            </span>
          </div>

          {eventCountsByPlayer.ownList.length === 0 ? (
            <p className="text-xs text-2 py-2">Belum ada pemain terlibat dalam kejadian.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {eventCountsByPlayer.ownList.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-raised border border-line text-xs"
                >
                  <span className="font-mono text-2">
                    {p.number != null ? `#${p.number}` : 'Tanpa nomor'}
                  </span>
                  <span className="text-1 font-medium">{p.name}</span>
                  <span className="font-mono tabular-nums text-brand font-semibold">n = {p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Map Section */}
      <div className="space-y-3 pt-2">
        <EventMap
          events={events}
          pitchLengthM={match.pitch_length_m || 90}
          pitchWidthM={match.pitch_width_m || 60}
          participants={participants}
          playerMap={playerMap}
        />
      </div>

      {/* Events Stream Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-1">Daftar Kejadian Pertandingan</h2>
          <span className="text-xs text-2 font-mono tabular-nums">
            {events.length} kejadian
          </span>
        </div>

        <Table
          columns={columns}
          data={events}
          emptyMessage="Belum ada kejadian yang dicatat untuk laga ini"
        />
      </div>

      {/* Finalise Match Dialog */}
      <Dialog
        isOpen={isFinaliseOpen}
        onClose={() => setIsFinaliseOpen(false)}
        title="Selesaikan laga"
        description="Masukkan skor akhir untuk memfinalkan pertandingan ini. Pertandingan final tidak dapat diubah kecuali dibuka kembali oleh admin."
      >
        <form onSubmit={handleFinaliseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Skor tim sendiri" id="score-own" required error={finaliseError}>
              <input
                id="score-own"
                type="number"
                min="0"
                required
                value={ownScoreInput}
                onChange={(e) => setOwnScoreInput(e.target.value)}
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-xs font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>

            <Field label="Skor tim lawan" id="score-opp" required>
              <input
                id="score-opp"
                type="number"
                min="0"
                required
                value={oppScoreInput}
                onChange={(e) => setOppScoreInput(e.target.value)}
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-xs font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-control bg-raised border border-line text-xs">
            <span className="text-2 font-mono">
              Gol tercatat: {loggedGoals.own} / {loggedGoals.opp} (mungkin belum lengkap)
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setOwnScoreInput(String(loggedGoals.own));
                setOppScoreInput(String(loggedGoals.opp));
              }}
            >
              Pakai angka ini
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFinaliseOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              loading={finalising}
              disabled={ownScoreInput === '' || oppScoreInput === ''}
            >
              Simpan & finalkan
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
