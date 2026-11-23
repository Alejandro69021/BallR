import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  FileText,
  Play,
  Plus,
  Printer,
  Trash2,
  Edit3,
  Video,
  BarChart3,
  MapPin,
  ListOrdered,
  Users
} from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import {
  getMatch,
  listEvents,
  listParticipants,
  finaliseMatch,
  reopenMatch,
  deleteEvent,
  deleteDraftMatch,
  updateMatch,
  MATCH_STAGES,
  EVENT_TYPE_LABELS,
  formatMatchError
} from '../lib/matches';
import { getLatestSnapshot } from '../lib/report';
import { SMALL_SAMPLE_N } from '../lib/analysis/events';
import Table from '../components/ui/Table';
import Dialog from '../components/ui/Dialog';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import EventMap from '../components/match/EventMap';
import LocalVideoPanel, { hasStoredVideoMeta } from '../components/video/LocalVideoPanel';
import StageStepper from '../components/ux/StageStepper';
import NextStepPanel from '../components/ux/NextStepPanel';

export default function MatchDetailPage({ userRole = 'public', onToast }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { players } = usePlayers();

  const isCoach = userRole === 'coach' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'summary' | 'map' | 'events' | 'players'
  const [activeTab, setActiveTab] = useState('summary');

  // Finalise modal state
  const [isFinaliseOpen, setIsFinaliseOpen] = useState(false);
  const [ownScoreInput, setOwnScoreInput] = useState('');
  const [oppScoreInput, setOppScoreInput] = useState('');
  const [finalising, setFinalising] = useState(false);
  const [finaliseError, setFinaliseError] = useState(null);

  // Edit match modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editOpponent, setEditOpponent] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCompetition, setEditCompetition] = useState('');
  const [editFormat, setEditFormat] = useState('11v11');
  const [editLength, setEditLength] = useState(90);
  const [editWidth, setEditWidth] = useState(60);

  // Delete draft modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingMatch, setDeletingMatch] = useState(false);

  // Reopen loading state
  const [reopening, setReopening] = useState(false);

  // Deleting event state
  const [deletingEvtId, setDeletingEvtId] = useState(null);

  // Local Video Panel state
  const videoPanelRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(() => Boolean(matchId && hasStoredVideoMeta(matchId)));

  const handlePlayClip = (videoTimeS) => {
    setActiveTab('summary');
    setIsVideoPanelOpen(true);
    if (!hasVideo) {
      onToast?.({
        title: 'Video Belum Dipilih',
        subtext: 'Pilih video untuk memutar klip',
        variant: 'warning'
      });
      videoPanelRef.current?.openFilePicker?.();
      return;
    }
    const seekTarget = Math.max(0, Number(videoTimeS) - 5);
    videoPanelRef.current?.seekTo?.(seekTarget, true);
  };

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

      const [eventsData, participantsData, latestSnap] = await Promise.all([
        listEvents(matchId),
        listParticipants(matchId),
        getLatestSnapshot(matchId).catch(() => null)
      ]);
      setEvents(eventsData || []);
      setParticipants(participantsData || []);
      setSnapshot(latestSnap);
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
    (async () => {
      await loadMatchData();
    })();
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
      // Refresh snapshot
      getLatestSnapshot(matchId).then(setSnapshot).catch(() => {});
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
      setSnapshot(null);
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

  // Edit match modal flow
  const handleOpenEdit = () => {
    if (!match) return;
    setEditOpponent(match.opponent_name || '');
    setEditDate(match.match_date || '');
    setEditCompetition(match.competition || '');
    setEditFormat(match.format || '11v11');
    setEditLength(match.pitch_length_m || 90);
    setEditWidth(match.pitch_width_m || 60);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editOpponent.trim()) {
      onToast?.({ title: 'Validasi Gagal', subtext: 'Nama lawan wajib diisi', variant: 'warning' });
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await updateMatch(match.id, {
        opponent_name: editOpponent.trim(),
        match_date: editDate,
        competition: editCompetition.trim() || null,
        format: editFormat,
        pitch_length_m: Number(editLength) || 90,
        pitch_width_m: Number(editWidth) || 60
      });
      setMatch(updated);
      setIsEditOpen(false);
      onToast?.({
        title: 'Data Laga Diperbarui',
        subtext: 'Perubahan informasi pertandingan berhasil disimpan.',
        variant: 'success'
      });
    } catch (err) {
      console.warn('Gagal memperbarui data laga:', err);
      onToast?.({
        title: 'Gagal Memperbarui Laga',
        subtext: formatMatchError(err),
        variant: 'error'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete draft flow
  const handleDeleteDraft = async () => {
    if (!match || match.status === 'final') return;
    setDeletingMatch(true);
    try {
      await deleteDraftMatch(match.id);
      setIsDeleteOpen(false);
      onToast?.({
        title: 'Draf Laga Dihapus',
        subtext: `Pertandingan draf vs ${match.opponent_name} telah dihapus.`,
        variant: 'info'
      });
      navigate('/laga');
    } catch (err) {
      console.warn('Gagal menghapus draf laga:', err);
      onToast?.({
        title: 'Gagal Menghapus Draf',
        subtext: formatMatchError(err),
        variant: 'error'
      });
    } finally {
      setDeletingMatch(false);
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
        return (
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            {row.video_time_s != null && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePlayClip(row.video_time_s)}
                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              >
                Putar
              </Button>
            )}
            {match?.status !== 'final' && (
              <Button
                variant="ghost"
                size="sm"
                disabled={deletingEvtId === row.id}
                onClick={() => handleDeleteEvent(row.id)}
                className="text-2 hover:text-danger min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              >
                Hapus
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 border border-line rounded-panel bg-panel text-center">
        <p className="text-sm text-2">Memuat detail pertandingan...</p>
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
  const isReportFrozen = isFinal && Boolean(snapshot);

  // Stepper current step index (1-indexed: 1 = Laga dibuat, 2 = Catat kejadian, 3 = Selesaikan laga, 4 = Laporan)
  let currentStep = 2;
  if (!isFinal) {
    currentStep = totalEvents === 0 ? 2 : 3;
  } else {
    currentStep = 4;
  }

  // NextStepPanel action calculations driven by state
  let nextStepTitle = '';
  let nextStepDescription = '';
  let primaryAction = null;
  let secondaryAction = null;

  if (!isFinal) {
    if (totalEvents === 0) {
      nextStepTitle = 'Catat kejadian';
      nextStepDescription = 'Mulai mencatat dari pencatat laga. Bisa sambil memutar video.';
      primaryAction = {
        label: 'Catat kejadian',
        onClick: () => navigate(`/pencatatan/${match.id}`),
        icon: <Play className="w-5 h-5 fill-current" />
      };
      secondaryAction = null;
    } else {
      nextStepTitle = 'Selesaikan laga';
      nextStepDescription =
        'Masukkan skor akhir. Setelah laga final, catatan terkunci supaya laporan bisa dipercaya. Sebelum itu kamu masih boleh menambah kejadian.';
      primaryAction = {
        label: 'Selesaikan laga',
        onClick: handleOpenFinalise,
        icon: <CheckCircle2 className="w-5 h-5" />
      };
      secondaryAction = {
        label: 'Tambah kejadian',
        onClick: () => navigate(`/pencatatan/${match.id}`),
        icon: <Plus className="w-4 h-4" />
      };
    }
  } else {
    if (!isReportFrozen) {
      nextStepTitle = 'Buat laporan';
      nextStepDescription = 'Laporan dibuat dari catatan yang sudah terkunci.';
      primaryAction = {
        label: 'Buat laporan',
        onClick: () => navigate(`/laga/${match.id}/laporan`),
        icon: <FileText className="w-5 h-5" />
      };
      secondaryAction = isAdmin
        ? {
            label: 'Buka kembali',
            onClick: handleReopen,
            loading: reopening,
            icon: <RotateCcw className="w-4 h-4" />
          }
        : null;
    } else {
      nextStepTitle = 'Bagikan atau cetak laporan';
      nextStepDescription = 'Laporan pertandingan telah dibekukan dan siap dibagikan atau dicetak.';
      primaryAction = {
        label: 'Bagikan atau cetak laporan',
        onClick: () => navigate(`/laga/${match.id}/laporan`),
        icon: <FileText className="w-5 h-5" />
      };
      secondaryAction = isAdmin
        ? {
            label: 'Buka kembali',
            onClick: handleReopen,
            loading: reopening,
            icon: <RotateCcw className="w-4 h-4" />
          }
        : null;
    }
  }

  // Menu items for MenuButton "Lainnya"
  const menuItems = !isFinal
    ? [
        {
          id: 'edit',
          label: 'Ubah data laga',
          icon: <Edit3 className="w-4 h-4" />,
          onClick: handleOpenEdit
        },
        {
          id: 'video',
          label: 'Pilih video laga',
          icon: <Video className="w-4 h-4" />,
          onClick: () => {
            setActiveTab('summary');
            setIsVideoPanelOpen(true);
            videoPanelRef.current?.openFilePicker?.();
          }
        },
        {
          id: 'print-draft',
          label: 'Cetak catatan sementara',
          icon: <Printer className="w-4 h-4" />,
          onClick: () => window.print()
        },
        {
          id: 'delete-draft',
          label: 'Hapus draf',
          variant: 'danger',
          icon: <Trash2 className="w-4 h-4" />,
          onClick: () => setIsDeleteOpen(true)
        }
      ]
    : [
        {
          id: 'video',
          label: 'Pilih video laga',
          icon: <Video className="w-4 h-4" />,
          onClick: () => {
            setActiveTab('summary');
            setIsVideoPanelOpen(true);
            videoPanelRef.current?.openFilePicker?.();
          }
        },
        {
          id: 'print-summary',
          label: 'Cetak ringkasan',
          icon: <Printer className="w-4 h-4" />,
          onClick: () => window.print()
        },
        ...(isAdmin
          ? [
              {
                id: 'reopen',
                label: 'Buka kembali laga',
                icon: <RotateCcw className="w-4 h-4" />,
                onClick: handleReopen
              }
            ]
          : [])
      ];

  const tabs = [
    { id: 'summary', label: 'Ringkasan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'map', label: 'Peta lapangan', icon: <MapPin className="w-4 h-4" /> },
    { id: 'events', label: 'Daftar kejadian', icon: <ListOrdered className="w-4 h-4" /> },
    { id: 'players', label: 'Pemain', icon: <Users className="w-4 h-4" /> }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => navigate('/laga')}
        >
          Kembali ke daftar laga
        </Button>
      </div>

      {/* Match Header Card */}
      <div className="p-5 border border-line rounded-panel bg-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-2">vs</span>
              <h1 className="text-xl font-semibold text-1">{match.opponent_name}</h1>
              <Badge variant={isFinal ? 'brand' : 'neutral'} size="sm">
                {isFinal ? 'Final' : 'Draf'}
              </Badge>
              <Badge variant="neutral" size="sm">{match.format}</Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-2 flex-wrap pt-1">
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
            <span className="block text-sm text-2 uppercase tracking-wider font-medium">Skor Akhir</span>
            {isFinal ? (
              <span className="text-xl font-mono tabular-nums font-bold text-1">
                {match.own_score} - {match.opponent_score}
              </span>
            ) : (
              <span className="text-sm text-2 italic">Draf (belum selesai)</span>
            )}
          </div>
        </div>
      </div>

      {/* Stage Stepper */}
      <div className="p-4 border border-line rounded-panel bg-panel">
        <StageStepper steps={MATCH_STAGES} currentStep={currentStep} />
      </div>

      {/* Next Step Panel (max 3 visible actions: Primary + Optional Secondary + MenuButton) */}
      {isCoach && (
        <NextStepPanel
          title={nextStepTitle}
          description={nextStepDescription}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          menuItems={menuItems}
        />
      )}

      {/* Tabs Bar */}
      <div
        role="tablist"
        aria-label="Bagian detail laga"
        className="flex items-center gap-2 border-b border-line overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 py-2.5 text-sm flex items-center gap-2 font-medium border-b-2 transition-colors cursor-pointer select-none -mb-px whitespace-nowrap ${
                isActive
                  ? 'border-brand text-brand font-semibold bg-accent-soft/20 rounded-t-control'
                  : 'border-transparent text-2 hover:text-1 hover:border-line'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Ringkasan */}
      <div
        role="tabpanel"
        id="tabpanel-summary"
        aria-labelledby="tab-summary"
        className={activeTab === 'summary' ? 'space-y-4' : 'hidden'}
      >
        {/* Small Sample Note Banner */}
        <div className="p-3.5 bg-panel border border-line rounded-panel text-sm text-2 leading-relaxed">
          {totalEvents < SMALL_SAMPLE_N ? (
            <span>
              Data pencatatan manual · n = {totalEvents} kejadian. Baru sedikit, jadi yang tampil hanya jumlah mentah. Persentase muncul setelah minimal {SMALL_SAMPLE_N} kejadian.
            </span>
          ) : (
            <span>
              Data pencatatan manual · n = {totalEvents} kejadian.
            </span>
          )}
        </div>

        {/* Event Breakdown */}
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="text-sm font-semibold text-1">Distribusi Kejadian</h2>
            <span className="text-sm text-2 font-mono tabular-nums">
              Total n = {totalEvents}
            </span>
          </div>

          {eventCountsByType.length === 0 ? (
            <p className="text-sm text-2 py-2">Belum ada kejadian tercatat.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {eventCountsByType.map(([type, count]) => (
                <div
                  key={type}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-raised border border-line text-sm"
                >
                  <span className="text-1 font-medium">{EVENT_TYPE_LABELS[type] || type}</span>
                  <span className="font-mono tabular-nums text-2">n = {count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Local Video Card ("Video laga") */}
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-1">Video laga</h2>
                {hasVideo && <Badge variant="brand" size="sm">Video Terhubung</Badge>}
              </div>
              <p className="text-sm text-2">
                Video tersimpan di perangkat ini dan tidak diunggah ke server.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVideoPanelOpen((prev) => !prev)}
              className="min-h-[44px] sm:min-h-0 text-sm self-start sm:self-auto"
            >
              {isVideoPanelOpen ? 'Sembunyikan Panel Video' : 'Buka Panel Video'}
            </Button>
          </div>

          <div className={isVideoPanelOpen ? 'block' : 'hidden'}>
            <LocalVideoPanel
              ref={videoPanelRef}
              matchId={matchId}
              period={1}
              onVideoLoadedChange={setHasVideo}
              onToast={onToast}
            />
          </div>
        </div>
      </div>

      {/* Tab 2: Peta lapangan */}
      <div
        role="tabpanel"
        id="tabpanel-map"
        aria-labelledby="tab-map"
        className={activeTab === 'map' ? 'space-y-4' : 'hidden'}
      >
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="text-sm font-semibold text-1">Peta Sebaran Kejadian</h2>
            <span className="text-sm text-2 font-mono tabular-nums">{events.length} kejadian</span>
          </div>
          <EventMap
            events={events}
            pitchLengthM={match.pitch_length_m || 90}
            pitchWidthM={match.pitch_width_m || 60}
            participants={participants}
            playerMap={playerMap}
          />
        </div>
      </div>

      {/* Tab 3: Daftar kejadian */}
      <div
        role="tabpanel"
        id="tabpanel-events"
        aria-labelledby="tab-events"
        className={activeTab === 'events' ? 'space-y-4' : 'hidden'}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-1">Daftar Kejadian Pertandingan</h2>
            <span className="text-sm text-2 font-mono tabular-nums">
              {events.length} kejadian
            </span>
          </div>

          <Table
            columns={columns}
            data={events}
            emptyMessage="Belum ada kejadian yang dicatat untuk laga ini"
          />
        </div>
      </div>

      {/* Tab 4: Pemain */}
      <div
        role="tabpanel"
        id="tabpanel-players"
        aria-labelledby="tab-players"
        className={activeTab === 'players' ? 'space-y-4' : 'hidden'}
      >
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h2 className="text-sm font-semibold text-1">Keterlibatan Pemain</h2>
            <span className="text-sm text-2 font-mono tabular-nums">
              Lawan n = {eventCountsByPlayer.opponentEvents}
            </span>
          </div>

          {eventCountsByPlayer.ownList.length === 0 ? (
            <p className="text-sm text-2 py-2">Belum ada pemain terlibat dalam kejadian.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {eventCountsByPlayer.ownList.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-raised border border-line text-sm"
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

      {/* Finalise Match Dialog */}
      <Dialog
        isOpen={isFinaliseOpen}
        onClose={() => setIsFinaliseOpen(false)}
        title="Selesaikan laga"
        description="Masukkan skor akhir untuk memfinalkan pertandingan ini. Pertandingan final tidak dapat diubah kecuali dibuka kembali oleh admin."
        onSubmit={handleFinaliseSubmit}
        footer={
          <>
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
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Skor tim sendiri" id="score-own" required error={finaliseError}>
              <input
                id="score-own"
                type="number"
                min="0"
                required
                value={ownScoreInput}
                onChange={(e) => setOwnScoreInput(e.target.value)}
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
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
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-control bg-raised border border-line text-sm">
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
        </div>
      </Dialog>

      {/* Edit Match Data Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Ubah data laga"
        description="Perbarui informasi dasar pertandingan ini."
        onSubmit={handleEditSubmit}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              loading={savingEdit}
            >
              Simpan perubahan
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Nama lawan" id="edit-opponent" required>
            <input
              id="edit-opponent"
              type="text"
              required
              value={editOpponent}
              onChange={(e) => setEditOpponent(e.target.value)}
              className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tanggal laga" id="edit-date" required>
              <input
                id="edit-date"
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>
            <Field label="Format permainan" id="edit-format">
              <select
                id="edit-format"
                value={editFormat}
                onChange={(e) => setEditFormat(e.target.value)}
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              >
                <option value="11v11">11v11</option>
                <option value="9v9">9v9</option>
                <option value="7v7">7v7</option>
                <option value="5v5">5v5</option>
              </select>
            </Field>
          </div>
          <Field label="Kompetisi / Turnamen" id="edit-competition">
            <input
              id="edit-competition"
              type="text"
              placeholder="Contoh: Piala Suratin 2026"
              value={editCompetition}
              onChange={(e) => setEditCompetition(e.target.value)}
              className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Panjang (m)" id="edit-len">
              <input
                id="edit-len"
                type="number"
                min="30"
                max="130"
                value={editLength}
                onChange={(e) => setEditLength(Number(e.target.value))}
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm font-mono text-1"
              />
            </Field>
            <Field label="Lebar (m)" id="edit-wid">
              <input
                id="edit-wid"
                type="number"
                min="20"
                max="100"
                value={editWidth}
                onChange={(e) => setEditWidth(Number(e.target.value))}
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm font-mono text-1"
              />
            </Field>
          </div>
        </div>
      </Dialog>

      {/* Delete Draft Match Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus draf laga"
        description={`Apakah Anda yakin ingin menghapus pertandingan draf melawan "${match.opponent_name}"? Tindakan ini akan menghapus semua catatan kejadian terkait dan tidak dapat dibatalkan.`}
        onSubmit={(e) => {
          e.preventDefault();
          handleDeleteDraft();
        }}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={deletingMatch}
            >
              Hapus draf
            </Button>
          </>
        }
      >
        <p className="text-sm text-danger font-medium">
          Perhatian: Hanya laga draf yang dapat dihapus. Pertandingan yang sudah final tetap dilindungi.
        </p>
      </Dialog>
    </div>
  );
}
