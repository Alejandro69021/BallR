import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  Lock
} from 'lucide-react';
import { getMatch, listEvents, listParticipants, formatMatchError } from '../lib/matches';
import {
  loadPlayerSlotMap,
  loadSlotNameMap,
  loadDetectedPlayers,
  applyPlayerSlotMap
} from '../lib/playerSlotMap';
import { listScenarios } from '../lib/scenarios';
import {
  countsByPlayer,
  passStats,
  shotStats,
  thirds,
  ppda,
  dataQuality,
  buildTacticalSummary,
  METRIC_DEFINITIONS,
  SMALL_SAMPLE_N
} from '../lib/analysis/events';
import { formatPositionLabel } from '../lib/displayLabels';
import {
  buildReportPayload,
  computeSnapshotHash,
  getLatestSnapshot,
  freezeReport,
  verifyReport,
  formatReportError,
  listReviewerCandidates,
  reconstructReportFromSnapshot
} from '../lib/report';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import PitchSvg from '../components/ui/PitchSvg';
import RefChip from '../components/ui/RefChip';
import Dialog from '../components/ui/Dialog';
import EmptyState from '../components/ui/EmptyState';
import Term from '../components/ux/Term';
import { BrandMark } from '../components/brand';

export default function MatchReportPage({ userRole = 'public', onToast, onOpenAuthModal }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin';

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [publishedScenarios, setPublishedScenarios] = useState([]);
  const [latestSnapshot, setLatestSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Freeze modal state
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [freezing, setFreezing] = useState(false);

  // Verification state
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Load report data
  const loadData = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const matchData = await getMatch(matchId);
      if (!matchData) {
        setMatch(null);
        return;
      }
      setMatch(matchData);

      const [evts, parts, scenList, snap] = await Promise.all([
        listEvents(matchId),
        listParticipants(matchId),
        listScenarios(),
        getLatestSnapshot(matchId)
      ]);

      const savedSlotMap = loadPlayerSlotMap(matchId);
      const partLookup = {};
      (parts || []).forEach((part) => {
        const pid = part.player_id || part.id;
        if (pid) {
          partLookup[pid] = {
            name: part.player_name || part.full_name || '',
            number: part.jersey_number != null ? part.jersey_number : null
          };
        }
      });
      const savedSlotNameMap = loadSlotNameMap(matchId);
      setEvents(applyPlayerSlotMap(evts || [], savedSlotMap, partLookup, savedSlotNameMap));
      setParticipants(parts || []);
      setPublishedScenarios((scenList || []).filter((s) => s.status === 'published'));
      setLatestSnapshot(snap || null);
    } catch (err) {
      console.warn('Gagal memuat data laporan:', err);
      onToast?.({
        title: 'Gagal Memuat Laporan',
        subtext: formatMatchError(err),
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [matchId, onToast]);

  useEffect(() => {
    if (isCoachOrAdmin) {
      loadData();
    }
  }, [isCoachOrAdmin, loadData]);

  // Pure analysis computations
  const dq = useMemo(() => dataQuality(events, match, participants), [events, match, participants]);
  const ownPass = useMemo(() => passStats(events, 'own'), [events]);
  const oppPass = useMemo(() => passStats(events, 'opponent'), [events]);
  const ownShots = useMemo(() => shotStats(events, 'own'), [events]);
  const oppShots = useMemo(() => shotStats(events, 'opponent'), [events]);
  const ownThirds = useMemo(
    () => thirds(events, match?.pitch_length_m || 90, 'own'),
    [events, match]
  );
  const oppThirds = useMemo(
    () => thirds(events, match?.pitch_length_m || 90, 'opponent'),
    [events, match]
  );
  const ppdaMetric = useMemo(() => ppda(events, match?.pitch_length_m || 90), [events, match]);
  const playerStats = useMemo(() => countsByPlayer(events, participants), [events, participants]);

  // Reviewer candidates state
  const [reviewerCandidates, setReviewerCandidates] = useState([]);

  // Frozen view toggle
  const [viewFrozen, setViewFrozen] = useState(false);

  useEffect(() => {
    if (!match?.id) return;
    listReviewerCandidates(match.academy_id)
      .then((candidates) => {
        setReviewerCandidates(candidates || []);
      })
      .catch((err) => {
        console.warn('Gagal memuat kandidat peninjau:', err);
        setReviewerCandidates([]);
      });
  }, [match?.academy_id, match?.id]);

  const reconstructed = useMemo(() => {
    if (!latestSnapshot) return null;
    try {
      return reconstructReportFromSnapshot(latestSnapshot);
    } catch (err) {
      console.warn('Gagal merekonstruksi snapshot laporan:', err);
      return null;
    }
  }, [latestSnapshot]);

  // Derived active metrics (either from frozen snapshot or live analysis)
  const isViewingFrozen = viewFrozen && Boolean(reconstructed);
  const activeMatch = isViewingFrozen ? (reconstructed.match?.id ? reconstructed.match : match) : match;
  const activeEvents = isViewingFrozen ? reconstructed.events : events;
  const activePublishedScenarios = isViewingFrozen ? reconstructed.published_scenarios : publishedScenarios;
  const activeDq = isViewingFrozen ? reconstructed.dataQuality : dq;
  const activeOwnPass = isViewingFrozen ? reconstructed.passStats_own : ownPass;
  const activeOppPass = isViewingFrozen ? reconstructed.passStats_opp : oppPass;
  const activeOwnShots = isViewingFrozen ? reconstructed.shotStats_own : ownShots;
  const activeOppShots = isViewingFrozen ? reconstructed.shotStats_opp : oppShots;
  const activeOwnThirds = isViewingFrozen ? reconstructed.thirds_own : ownThirds;
  const activeOppThirds = isViewingFrozen ? reconstructed.thirds_opp : oppThirds;
  const activePpdaMetric = isViewingFrozen ? reconstructed.ppda_metric : ppdaMetric;
  const activePlayerStats = isViewingFrozen ? reconstructed.playerStats : playerStats;
  const tacticalSummary = useMemo(
    () =>
      buildTacticalSummary(
        activeEvents,
        activeMatch?.pitch_length_m || 90,
        activeMatch?.pitch_width_m || 60,
        activeMatch?.opponent_name || 'Lawan'
      ),
    [activeEvents, activeMatch]
  );

  // Canonical payload & hash
  const [currentPayload, setCurrentPayload] = useState(null);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    if (match && events) {
      buildReportPayload(match, participants, events, publishedScenarios)
        .then(async (payload) => {
          setCurrentPayload(payload);
          const h = await computeSnapshotHash(payload);
          setCurrentHash(h);
        })
        .catch((err) => console.warn('Gagal menghitung payload laporan:', err));
    }
  }, [match, participants, events, publishedScenarios]);

  // Handle freeze report
  const handleFreezeReport = async () => {
    if (!selectedReviewer) {
      onToast?.({
        title: 'Pemeriksa Belum Dipilih',
        subtext: 'Pilih pemeriksa dari daftar staf akademi sebelum mengunci laporan.',
        variant: 'warning'
      });
      return;
    }

    setFreezing(true);
    try {
      const snap = await freezeReport({
        match,
        participants,
        events,
        publishedScenarios,
        reviewedBy: selectedReviewer
      });

      setLatestSnapshot(snap);
      setIsFreezeModalOpen(false);
      onToast?.({
        title: 'Laporan Dikunci',
        subtext: 'Laporan terkunci berhasil disimpan dengan hash kriptografis.'
      });
    } catch (err) {
      console.warn('Gagal mengunci laporan:', err);
      onToast?.({
        title: 'Gagal Mengunci Laporan',
        subtext: formatReportError(err),
        variant: 'error'
      });
    } finally {
      setFreezing(false);
    }
  };

  // Handle verify report
  const handleVerifyReport = async () => {
    setVerifying(true);
    try {
      const res = await verifyReport(match, participants, events, publishedScenarios);
      setVerificationResult(res);
      if (res.ok) {
        onToast?.({
          title: 'Verifikasi Berhasil',
          subtext: 'Data saat ini identik (Cocok) dengan laporan terkunci.'
        });
      } else {
        onToast?.({
          title: 'Integritas Berbeda',
          subtext: res.message,
          variant: 'warning'
        });
      }
    } catch (err) {
      console.warn('Gagal verifikasi laporan:', err);
      onToast?.({
        title: 'Gagal Verifikasi',
        subtext: formatReportError(err),
        variant: 'error'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!isCoachOrAdmin) {
    return (
      <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-4 max-w-md mx-auto my-12">
        <Lock className="w-10 h-10 text-2 mx-auto" strokeWidth={1.5} />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-1">Akses Terbatas: Staf Akademi</h2>
          <p className="text-sm text-2 leading-relaxed">
            Laporan pertandingan internal akademi hanya dapat diakses oleh staf pelatih dan admin resmi.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => onOpenAuthModal?.('logger')}>
          Masuk sebagai staf akademi
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-2 font-mono">
        Memuat laporan...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-6">
        <EmptyState
          title="Pertandingan tidak ditemukan"
          description="Pertandingan yang diminta tidak ada atau sudah dihapus."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/laga')}>
              Kembali ke daftar laga
            </Button>
          }
        />
      </div>
    );
  }

  // Deteksi sumber data Vision & nama tim bersih untuk laporan A4
  const hasRosterEvents = (activePlayerStats?.rows || []).some((r) => r.n > 0);
  const isVisionData =
    (activeEvents || []).some(
      (e) =>
        e.source === 'vision' ||
        String(e.id || '').startsWith('vision-') ||
        /otomatis|vision/i.test(String(e.note || ''))
    ) ||
    ((activeEvents || []).length >= 100 && !hasRosterEvents);

  const rawOppName = String(activeMatch.opponent_name || '').trim();
  const vsParenMatch = rawOppName.match(/\(\s*vs\.?\s+([^)]+)\)/i);
  const reportHomeTeam =
    String(activeMatch.home_team_name || '').trim() ||
    (vsParenMatch ? vsParenMatch[1].trim() : '');
  const reportAwayTeam = rawOppName
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^(?:contoh:\s*)?(?:vs\.?\s*)?/i, '')
    .trim();

  // Fallback Bagian 5: bila data berasal dari analisis video tanpa player_id roster
  const savedSlotNameMap = loadSlotNameMap(activeMatch?.id || matchId);
  const savedDetectedPlayers = loadDetectedPlayers(activeMatch?.id || matchId);
  const detectedBySlot = {};
  savedDetectedPlayers.forEach((dp) => {
    const key = dp?.slot_number != null ? Number(dp.slot_number) : dp?.jersey_number != null ? Number(dp.jersey_number) : null;
    if (key != null && dp?.name && !detectedBySlot[key]) {
      detectedBySlot[key] = dp;
    }
  });

  const inferZoneSlotNumber = (xVal, yVal, L, W) => {
    if (xVal == null || yVal == null) return 6;
    const xPct = Number(xVal) / Math.max(1, L);
    const yPct = Number(yVal) / Math.max(1, W);
    if (xPct < 0.16) return 1;
    if (xPct < 0.36) return yPct < 0.28 ? 3 : yPct > 0.72 ? 2 : yPct < 0.5 ? 4 : 5;
    if (xPct < 0.68) return yPct < 0.25 ? 11 : yPct > 0.75 ? 7 : yPct < 0.5 ? 6 : 8;
    return yPct < 0.35 ? 10 : 9;
  };

  const reportPlayerRows = (() => {
    if (hasRosterEvents) return activePlayerStats.rows;
    const ownEvts = (activeEvents || []).filter((e) => e.team === 'own');
    if (ownEvts.length === 0) return activePlayerStats.rows;
    const L = Number(activeMatch.pitch_length_m) || 90;
    const W = Number(activeMatch.pitch_width_m) || 60;
    const byNum = {};
    ownEvts.forEach((e) => {
      const num =
        e.player_number != null && Number.isFinite(Number(e.player_number))
          ? Number(e.player_number)
          : inferZoneSlotNumber(e.x_m, e.y_m, L, W);
      const detectedInfo = detectedBySlot[num];
      const resolvedName =
        String(e.player_name || '').trim() ||
        String(savedSlotNameMap[String(num)] || '').trim() ||
        String(detectedInfo?.name || '').trim() ||
        `Slot Video #${num}`;
      const nameSourceLabel =
        String(savedSlotNameMap[String(num)] || '').trim()
          ? 'Nama dari daftar tim'
          : String(e.player_name || '').trim() || detectedInfo?.name
            ? 'Terdeteksi dari video'
            : 'Belum diberi nama';
      if (!byNum[num]) {
        byNum[num] = {
          player_id: `slot-${num}`,
          jersey_number: detectedInfo?.jersey_number || num,
          player_name: resolvedName,
          name_source: nameSourceLabel,
          position: 'Slot Video',
          is_starter: true,
          minutes_played: activeDq?.last_minute?.value || 45,
          counts_by_type: {},
          n: 0,
          sx: 0,
          sy: 0,
          cn: 0
        };
      } else if (byNum[num].player_name.startsWith('Slot Video #') && !resolvedName.startsWith('Slot Video #')) {
        byNum[num].player_name = resolvedName;
        byNum[num].name_source = nameSourceLabel;
      }
      const row = byNum[num];
      row.n += 1;
      row.counts_by_type[e.event_type] = (row.counts_by_type[e.event_type] || 0) + 1;
      if (e.x_m != null && e.y_m != null) {
        row.sx += Number(e.x_m);
        row.sy += Number(e.y_m);
        row.cn += 1;
      }
    });
    return Object.values(byNum)
      .sort((a, b) => a.jersey_number - b.jersey_number)
      .map((r) => {
        let inferredRole = 'Slot Video';
        if (r.cn > 0) {
          const xPct = (r.sx / r.cn) / Math.max(1, L);
          const yPct = (r.sy / r.cn) / Math.max(1, W);
          if (xPct < 0.16) inferredRole = 'Kiper / Bek Dalam';
          else if (xPct < 0.36) inferredRole = yPct < 0.25 ? 'Bek Kiri' : yPct > 0.75 ? 'Bek Kanan' : 'Bek Tengah';
          else if (xPct < 0.68) inferredRole = yPct < 0.25 ? 'Sayap Kiri' : yPct > 0.75 ? 'Sayap Kanan' : 'Gelandang';
          else inferredRole = yPct < 0.28 ? 'Penyerang Kiri' : yPct > 0.72 ? 'Penyerang Kanan' : 'Penyerang Tengah';
        }
        return {
          ...r,
          position: inferredRole,
          small_sample: r.n < SMALL_SAMPLE_N
        };
      });
  })();

  const reportActivePlayersVal = hasRosterEvents
    ? activeDq.players_with_events_count.value
    : reportPlayerRows.filter((r) => r.n > 0).length;
  const reportActivePlayersTotal = hasRosterEvents
    ? activeDq.players_with_events_count.n
    : reportPlayerRows.length;

  // Penyederhanaan Gambar A (Peta Tembakan & Gol) & Gambar B (Peta Kepadatan Zona 3x3) pada data padat
  const pitchLenReport = Number(activeMatch.pitch_length_m) || 90;
  const pitchWidReport = Number(activeMatch.pitch_width_m) || 60;
  const allOwnCoordEvents = (activeEvents || []).filter(
    (e) => e.team === 'own' && e.x_m != null && e.y_m != null
  );
  const ownShotCoordEvents = allOwnCoordEvents.filter(
    (e) => e.event_type === 'goal' || e.event_type === 'shot_on_target' || e.event_type === 'shot'
  );
  const isDenseMapA = allOwnCoordEvents.length > 100;
  const reportMapAIsShotMap = isDenseMapA && ownShotCoordEvents.length > 0;
  const reportMapAPoints = reportMapAIsShotMap
    ? ownShotCoordEvents
    : isDenseMapA
      ? allOwnCoordEvents.slice(0, 25)
      : allOwnCoordEvents;

  const allOwnPassLines = (activeEvents || []).filter(
    (e) =>
      e.team === 'own' &&
      (e.event_type === 'pass' || e.event_type === 'key_pass') &&
      e.x_m != null &&
      e.end_x_m != null
  );
  const isDenseMapB = allOwnPassLines.length > 30;
  const reportZoneGrid = (() => {
    const counts = Array.from({ length: 3 }, () => [0, 0, 0]);
    let total = 0;
    allOwnCoordEvents.forEach((e) => {
      const col = Math.min(2, Math.max(0, Math.floor((Number(e.x_m) / pitchLenReport) * 3)));
      const row = Math.min(2, Math.max(0, Math.floor((Number(e.y_m) / pitchWidReport) * 3)));
      counts[row][col] += 1;
      total += 1;
    });
    const maxCount = Math.max(1, ...counts.flat());
    const cells = [];
    const colLabels = ['Bertahan', 'Tengah', 'Menyerang'];
    const rowLabels = ['Kiri', 'Tengah', 'Kanan'];
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const count = counts[r][c];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const ratio = maxCount > 0 ? count / maxCount : 0;
        const fillClass =
          ratio >= 0.7
            ? 'fill-danger stroke-line'
            : ratio >= 0.35
              ? 'fill-warning stroke-line'
              : 'fill-1 stroke-line';
        const opacity =
          ratio >= 0.7
            ? 0.52
            : ratio >= 0.35
              ? 0.38
              : count > 0
                ? 0.08
                : 0.02;
        cells.push({
          key: `z-${r}-${c}`,
          x: (pitchLenReport / 3) * c,
          y: (pitchWidReport / 3) * r,
          w: pitchLenReport / 3,
          h: pitchWidReport / 3,
          count,
          pct,
          fillClass,
          opacity,
          label: `${colLabels[c]} ${rowLabels[r]}`
        });
      }
    }
    return { cells, total };
  })();

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* Non-print Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => navigate(`/laga/${match.id}`)}
          >
            Kembali ke detail laga
          </Button>
          <Badge variant={match.status === 'final' ? 'success' : 'neutral'} size="sm">
            Status: {match.status === 'final' ? 'Laga Final' : 'Draf (Belum Final)'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {latestSnapshot && (
            <Button
              variant="secondary"
              size="sm"
              icon={<FileText className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => setViewFrozen((prev) => !prev)}
            >
              {viewFrozen ? 'Tampilkan data saat ini' : 'Tampilkan versi terkunci'}
            </Button>
          )}

          {latestSnapshot && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" strokeWidth={1.5} />}
              onClick={handleVerifyReport}
              disabled={verifying}
            >
              {verifying ? 'Memeriksa...' : 'Verifikasi ulang'}
            </Button>
          )}

          {match.status === 'final' && (
            <div className="flex items-center gap-2">
              {reviewerCandidates.length === 0 && (
                <span className="text-sm text-warning font-mono">
                  Belum ada pelatih lain atau admin yang bisa memeriksa
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.5} />}
                onClick={() => setIsFreezeModalOpen(true)}
                disabled={reviewerCandidates.length === 0}
              >
                Kunci laporan
              </Button>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={<Printer className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => window.print()}
          >
            Cetak Laporan (A4)
          </Button>
        </div>
      </div>

      {/* Frozen Version Banner */}
      {isViewingFrozen && latestSnapshot && (
        <div className="no-print p-3 rounded-control bg-raised border border-brand text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
            <span className="font-semibold text-1">
              Versi terkunci {new Date(latestSnapshot.created_at).toLocaleDateString('id-ID')}, pemeriksa {latestSnapshot.reviewed_by_profile?.full_name || latestSnapshot.reviewed_by}
            </span>
          </div>
          <Badge variant="neutral" size="sm">Versi Terkunci</Badge>
        </div>
      )}

      {/* Verification Banner if checked */}
      {verificationResult && (
        <div
          className={`no-print p-3 rounded-control border text-sm flex items-center justify-between ${
            verificationResult.ok
              ? 'bg-raised border-brand text-brand'
              : 'bg-raised border-warning text-warning'
          }`}
        >
          <div className="flex items-center gap-2">
            {verificationResult.ok ? (
              <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            )}
            <span>
              Status Verifikasi Integritas:{' '}
              <strong className="font-semibold">{verificationResult.message}</strong>
            </span>
          </div>
          <span className="font-mono text-sm text-2">
            Hash snapshot: {verificationResult.snapshot?.snapshot_hash?.slice(0, 16)}...
          </span>
        </div>
      )}

      {/* SECTION 1: RINGKASAN LAGA */}
      <section className="space-y-3 pb-6 border-b border-line">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <span className="text-sm font-mono uppercase tracking-wider text-2">
              Bagian 1 • Dokumen Resmi Pertandingan
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-1 mt-0.5">
              Laporan Pertandingan: {reportHomeTeam ? `${reportHomeTeam} vs ` : ''}
              {reportAwayTeam}
            </h1>
            <p className="text-sm text-2 font-mono mt-1">
              Tanggal: {activeMatch.match_date || '-'} • Format: {activeMatch.format || '11v11'} • Lapangan: {activeMatch.pitch_length_m}&times;{activeMatch.pitch_width_m}m
            </p>
          </div>
          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 sm:text-right shrink-0">
            <div className="text-2xl font-extrabold font-display text-1 whitespace-nowrap tabular-nums">
              {activeMatch.status === 'final'
                ? `${activeMatch.own_score ?? 0} - ${activeMatch.opponent_score ?? 0}`
                : 'Belum final'}
            </div>
            <span className="text-sm text-2 font-mono whitespace-nowrap">Skor Akhir</span>
          </div>
        </div>

        {activeMatch.notes && (
          <div className="p-3 rounded-control bg-raised border border-line text-sm text-2 leading-relaxed">
            <span className="font-semibold text-1 block mb-0.5">Catatan Umum Pertandingan:</span>
            {activeMatch.notes}
          </div>
        )}
      </section>

      {/* SECTION 2: KUALITAS DATA (MANDATORY) */}
      <section className="space-y-3 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 2 • Integritas &amp; Cakupan Pencatatan (Wajib)
          </span>
          <h2 className="text-xl font-bold text-1">Kualitas Data</h2>
        </div>

        {/* Mandatory honesty statement */}
        <div className="p-3 rounded-control bg-raised border border-line text-sm text-2 italic">
          {isVisionData
            ? 'Data berasal dari analisis video otomatis dengan estimasi posisi dan aksi lapangan. Tinjau ulang sebelum finalisasi.'
            : activeDq.statement}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
          <div className="p-3 rounded-control bg-raised border border-line">
            <span className="text-2 block">Total Kejadian:</span>
            <span className="text-base font-bold text-1">{activeDq.total_events.value}</span>
            <span className="text-2 block mt-0.5">n={activeDq.total_events.n} kejadian</span>
          </div>

          <div className="p-3 rounded-control bg-raised border border-line">
            <span className="text-2 block">Kelengkapan Koordinat:</span>
            <span className="text-base font-bold text-1">{activeDq.coords_pct.value}%</span>
            <span className="text-2 block mt-0.5">({activeDq.with_coords_count.value}/{activeDq.total_events.n})</span>
          </div>

          <div className="p-3 rounded-control bg-raised border border-line">
            <span className="text-2 block">Rentang Waktu:</span>
            <span className="text-base font-bold text-1">
              {activeDq.first_minute ? `${activeDq.first_minute.value}'` : '-'}&ndash;{activeDq.last_minute ? `${activeDq.last_minute.value}'` : '-'}
            </span>
            <span className="text-2 block mt-0.5">Menit pertama-akhir</span>
          </div>

          <div className="p-3 rounded-control bg-raised border border-line">
            <span className="text-2 block">Pemain Aktif Terdata:</span>
            <span className="text-base font-bold text-1">
              {reportActivePlayersVal} / {reportActivePlayersTotal}
            </span>
            <span className="text-2 block mt-0.5">
              {hasRosterEvents ? 'Pemain dengan ≥1 aksi' : 'Slot deteksi video aktif'}
            </span>
          </div>
        </div>

        <div className="text-sm text-2 font-mono flex items-center justify-between">
          <span>
            Sebaran per babak:{' '}
            {Object.entries(activeDq.events_per_period)
              .map(([per, count]) => `Babak ${per}: ${count} aksi`)
              .join(' • ')}
          </span>
          <span>Kejadian lawan tercatat: {activeDq.opponent_events_count.value}</span>
        </div>
      </section>

      {/* SECTION 3: TIM KITA */}
      <section className="space-y-4 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 3 • Kinerja Kolektif
          </span>
          <h2 className="text-xl font-bold text-1">Tim Kita</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {/* Umpan */}
          <div className="p-3 rounded-control bg-raised border border-line space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-1 block">Akurasi Umpan</span>
              {activeOwnPass.n < SMALL_SAMPLE_N && (
                <Badge variant="warning" size="sm">sampel kecil</Badge>
              )}
            </div>
            <div className="text-base font-bold font-mono text-1">
              {activeOwnPass.total.value > 0 ? (
                <>
                  <span>{activeOwnPass.successful.value} dari {activeOwnPass.total.value} umpan</span>
                  <span className="text-sm text-2 font-normal font-sans ml-1.5">
                    ({activeOwnPass.value !== null ? `${activeOwnPass.value}%` : '0%'})
                  </span>
                </>
              ) : (
                'Belum ada data'
              )}
            </div>
            <div className="text-2 font-mono text-sm space-y-0.5">
              <div>Sukses: {activeOwnPass.successful.value} umpan</div>
              <div>Gagal: {activeOwnPass.failed.value} umpan</div>
              <div>Total penyebut: {activeOwnPass.total.value} umpan (n={activeOwnPass.n})</div>
            </div>
          </div>

          {/* Tembakan */}
          <div className="p-3 rounded-control bg-raised border border-line space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-1 block">Tembakan &amp; Sasaran</span>
              {activeOwnShots.n < SMALL_SAMPLE_N && (
                <Badge variant="warning" size="sm">sampel kecil</Badge>
              )}
            </div>
            <div className="text-sm font-bold font-mono text-1">
              {activeOwnShots.goals.value} gol dari {activeOwnShots.on_target.value} tembakan tepat sasaran; {activeOwnShots.off_target.value} meleset
            </div>
            <div className="text-2 font-mono text-sm space-y-0.5">
              <div>Akurasi tepat sasaran: {activeOwnShots.accuracy_pct.value ?? 0}% (dari {activeOwnShots.total.value} tembakan)</div>
              <div>Total tembakan dicatat: n={activeOwnShots.n}</div>
            </div>
          </div>

          {/* PPDA */}
          <div className="p-3 rounded-control bg-raised border border-line space-y-1.5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-1 block">PPDA (Intensitas Pressing)</span>
                <Term
                  explanation="Passes Allowed per Defensive Action: rasio umpan lawan sebelum aksi bertahan tim kita. Mengindikasikan intensitas tekanan, bukan ukuran mutlak kualitas tim."
                />
              </div>
              <div className="w-full truncate">
                <RefChip referenceId="trainor-ppda-2014" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-1">
              {activePpdaMetric.value !== null ? activePpdaMetric.value : '-'}
            </div>
            <div className="text-2 font-mono text-sm space-y-0.5">
              {activePpdaMetric.reason ? (
                <div className="text-warning italic">{activePpdaMetric.reason}</div>
              ) : (
                <div>Umpan lawan {activePpdaMetric.opponent_passes_in_zone} / Aksi bertahan {activePpdaMetric.defensive_actions_in_zone}</div>
              )}
              <div>Sampel: n={activePpdaMetric.n} umpan lawan</div>
            </div>
          </div>
        </div>

        {/* Sepertiga Lapangan */}
        <div className="p-3 rounded-control bg-raised border border-line space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-1 text-sm block">Distribusi Sepertiga Lapangan (Arah Serang Kiri ke Kanan)</span>
            {activeOwnThirds.n < SMALL_SAMPLE_N && (
              <Badge variant="warning" size="sm">sampel kecil</Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm font-mono">
            <div className="p-2 rounded bg-app border border-line">
              <span className="text-2 block">Pertahanan (x &lt; 1/3)</span>
              <span className="text-sm font-bold text-1">{activeOwnThirds.defensive.count} dari {activeOwnThirds.n} aksi</span>
              <span className="text-2 block text-sm mt-0.5">({activeOwnThirds.defensive.value ?? 0}%)</span>
            </div>
            <div className="p-2 rounded bg-app border border-line">
              <span className="text-2 block">Tengah (1/3 &le; x &lt; 2/3)</span>
              <span className="text-sm font-bold text-1">{activeOwnThirds.middle.count} dari {activeOwnThirds.n} aksi</span>
              <span className="text-2 block text-sm mt-0.5">({activeOwnThirds.middle.value ?? 0}%)</span>
            </div>
            <div className="p-2 rounded bg-app border border-line">
              <span className="text-2 block">Akhir (x &ge; 2/3)</span>
              <span className="text-sm font-bold text-1">{activeOwnThirds.final.count} dari {activeOwnThirds.n} aksi</span>
              <span className="text-2 block text-sm mt-0.5">({activeOwnThirds.final.value ?? 0}%)</span>
            </div>
          </div>
          <div className="text-2 text-sm font-mono text-right">
            Total aksi berkoordinat: n={activeOwnThirds.n} • Tanpa koordinat: {activeOwnThirds.without_coords.count}
          </div>
        </div>
      </section>

      {/* SECTION 4: LAWAN (LABEL "PENGAMATAN SATU LAGA") */}
      <section className="space-y-3 pb-6 border-b border-line">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-mono uppercase tracking-wider text-2">
              Bagian 4 • Analisis Lawan
            </span>
            <h2 className="text-xl font-bold text-1">
              Lawan ({reportAwayTeam})
            </h2>
          </div>
          <Badge variant="neutral" size="sm">
            pengamatan satu laga
          </Badge>
        </div>

        <p className="text-sm text-2 italic">
          Pengamatan satu laga: data lawan dicatat secara terbatas dari sudut pandang pelatih tim kita di pinggir lapangan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-control bg-raised border border-line space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-1 block">Aksi Umpan Lawan</span>
              {activeOppPass.n < SMALL_SAMPLE_N && (
                <Badge variant="warning" size="sm">sampel kecil</Badge>
              )}
            </div>
            <div className="text-base font-bold font-mono text-1">
              {activeOppPass.total.value > 0 ? (
                <>
                  <span>{activeOppPass.successful.value} dari {activeOppPass.total.value} umpan</span>
                  <span className="text-sm text-2 font-normal font-sans ml-1.5">
                    ({activeOppPass.value !== null ? `${activeOppPass.value}%` : '0%'})
                  </span>
                </>
              ) : (
                '-'
              )}
            </div>
            <div className="text-2 font-mono text-sm">
              Sukses {activeOppPass.successful.value} • Gagal {activeOppPass.failed.value} (penyebut n={activeOppPass.n})
            </div>
          </div>

          <div className="p-3 rounded-control bg-raised border border-line space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-1 block">Tembakan Lawan</span>
              {activeOppShots.n < SMALL_SAMPLE_N && (
                <Badge variant="warning" size="sm">sampel kecil</Badge>
              )}
            </div>
            <div className="text-sm font-bold font-mono text-1">
              {activeOppShots.goals.value} gol dari {activeOppShots.on_target.value} tepat sasaran; {activeOppShots.off_target.value} meleset
            </div>
            <div className="text-2 font-mono text-sm">
              Tepat sasaran {activeOppShots.on_target.value} dari total {activeOppShots.total.value} (n={activeOppShots.n})
            </div>
          </div>

          <div className="p-3 rounded-control bg-raised border border-line space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-1 block">Sebaran Area Aksi Lawan</span>
              {activeOppThirds.n < SMALL_SAMPLE_N && (
                <Badge variant="warning" size="sm">sampel kecil</Badge>
              )}
            </div>
            <div className="text-sm font-mono space-y-0.5 mt-1 text-2">
              <div>Pertahanan: {activeOppThirds.defensive.count} dari {activeOppThirds.n} ({activeOppThirds.defensive.value ?? 0}%)</div>
              <div>Tengah: {activeOppThirds.middle.count} dari {activeOppThirds.n} ({activeOppThirds.middle.value ?? 0}%)</div>
              <div>Akhir: {activeOppThirds.final.count} dari {activeOppThirds.n} ({activeOppThirds.final.value ?? 0}%)</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: INDIVIDU (TABLE SORTED BY JERSEY NUMBER) */}
      <section className="space-y-3 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 5 • Kontribusi Individu
          </span>
          <h2 className="text-xl font-bold text-1">Individu</h2>
        </div>

        <p className="text-sm text-2">
          Daftar pemain diurutkan berdasarkan nomor punggung. Tidak memuat peringkat atau skor komposit keseluruhan.
        </p>

        <Table
          columns={[
            {
              key: 'jersey_number',
              header: 'No.',
              render: (_val, row) => (
                <span className="font-mono text-sm font-bold text-1">
                  {row.jersey_number != null && row.jersey_number !== '-' && row.jersey_number !== ''
                    ? `#${row.jersey_number}`
                    : 'Tanpa nomor'}
                </span>
              )
            },
            {
              key: 'player_name',
              header: 'Nama Pemain',
              render: (_val, row) => {
                const name =
                  row.player_name && !row.player_name.startsWith('PLAYER-') && !row.player_name.startsWith('WK-')
                    ? row.player_name
                    : 'Pemain tanpa nama';
                return (
                  <div>
                    <span className="font-semibold text-1 block">{name}</span>
                    <span className="text-sm text-2 font-mono">
                      {formatPositionLabel(row.position).replace(/\s*\([^)]*\)/g, '')} • {row.name_source || (row.is_starter ? 'Starter' : 'Cadangan')}
                    </span>
                  </div>
                );
              }
            },
            {
              key: 'minutes_played',
              header: 'Menit',
              render: (_val, row) => (
                <span className="font-mono text-sm text-2">{row.minutes_played}'</span>
              )
            },
            {
              key: 'counts_by_type',
              header: 'Rincian Aksi Tercatat',
              render: (_val, row) => {
                const entries = Object.entries(row.counts_by_type || {}).filter(([, c]) => c > 0);
                if (entries.length === 0) return <span className="text-sm text-2 italic">Tidak ada catatan aksi</span>;
                return (
                  <div className="flex flex-wrap gap-1">
                    {entries.map(([type, count]) => (
                      <span key={type} className="inline-block px-1.5 py-0.5 rounded bg-app border border-line text-sm font-mono">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                );
              }
            },
            {
              key: 'n',
              header: 'Total Aksi',
              render: (_val, row) => (
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-1">{row.n}</span>
                  {row.small_sample && (
                    <span className="block text-warning font-mono text-sm">sampel kecil</span>
                  )}
                </div>
              )
            }
          ]}
          data={reportPlayerRows}
          emptyMessage="Belum ada data partisipasi pemain yang terdaftar."
        />
      </section>

      {/* SECTION 6: PETA KEJADIAN */}
      <section className="space-y-4 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 6 • Distribusi Spasial
          </span>
          <h2 className="text-xl font-bold text-1">Peta Kejadian</h2>
          <p className="text-sm text-2 font-mono mt-0.5">
            {isVisionData
              ? 'Hasil deteksi otomatis dari video. Tampilan disederhanakan agar langsung terbaca.'
              : 'Data pencatatan manual; bukan pelacakan otomatis.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
          {/* Figure A: Peta Tembakan & Gol atau Sebaran Titik Aksi */}
          <div className="p-3 rounded-control bg-raised border border-line space-y-2">
            <span className="font-semibold text-1 text-sm block">
              Gambar A: {reportMapAIsShotMap
                ? `Peta Tembakan & Gol ${reportHomeTeam || 'Tim Kita'} · ${reportMapAPoints.length} tembakan`
                : `Sebaran Titik Aksi ${reportHomeTeam || 'Tim Kita'} · n=${allOwnCoordEvents.length}`}
            </span>
            <PitchSvg
              pitchLengthM={pitchLenReport}
              pitchWidthM={pitchWidReport}
              orientation="horizontal"
            >
              {reportMapAPoints.map((e, idx) => (
                <circle
                  key={e.id || e.client_event_id || `mA-${idx}`}
                  cx={Number(e.x_m)}
                  cy={Number(e.y_m)}
                  r={e.event_type === 'goal' ? '2.2' : e.event_type === 'shot_on_target' ? '1.6' : '1.3'}
                  strokeWidth={e.event_type === 'goal' ? '0.6' : '0.3'}
                  className={
                    e.event_type === 'goal'
                      ? 'fill-brand stroke-app'
                      : e.event_type === 'shot_on_target'
                      ? 'fill-series-1 stroke-app'
                      : 'fill-1 opacity-75'
                  }
                />
              ))}
            </PitchSvg>
            <div className="flex items-center justify-center gap-3 flex-wrap text-2 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" />
                Gol
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-series-1 inline-block" />
                Tepat Sasaran
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-1/70 inline-block" />
                {reportMapAIsShotMap ? 'Tembakan Meleset' : 'Aksi Lain'}
              </span>
            </div>
            <div className="text-2 text-sm font-mono text-center">
              Arah serang: Kiri &rarr; Kanan
            </div>
          </div>

          {/* Figure B: Peta Kepadatan Zona 3x3 (data padat) atau Aliran Umpan (data manual ringkas) */}
          <div className="p-3 rounded-control bg-raised border border-line space-y-2">
            <span className="font-semibold text-1 text-sm block">
              Gambar B: {isDenseMapB
                ? `Area Aksi Terpadat ${reportHomeTeam || 'Tim Kita'} · ${reportZoneGrid.total} aksi`
                : `Aliran Umpan ${reportHomeTeam || 'Tim Kita'} Berkoordinat Akhir`}
            </span>
            <PitchSvg
              pitchLengthM={pitchLenReport}
              pitchWidthM={pitchWidReport}
              orientation="horizontal"
            >
              {isDenseMapB
                ? reportZoneGrid.cells.map((cell) => (
                    <g key={cell.key}>
                      <rect
                        x={cell.x}
                        y={cell.y}
                        width={cell.w}
                        height={cell.h}
                        className={cell.fillClass}
                        fillOpacity={cell.opacity}
                        strokeWidth="0.35"
                      />
                      <text
                        x={cell.x + cell.w / 2}
                        y={cell.y + cell.h / 2 - 1}
                        textAnchor="middle"
                        className="fill-1 font-mono"
                        fontSize="4.2"
                        fontWeight="700"
                      >
                        {cell.pct}%
                      </text>
                      <text
                        x={cell.x + cell.w / 2}
                        y={cell.y + cell.h / 2 + 4}
                        textAnchor="middle"
                        className="fill-2 font-mono"
                        fontSize="2.8"
                      >
                        {cell.count} aksi
                      </text>
                    </g>
                  ))
                : allOwnPassLines.map((e, idx) => (
                    <line
                      key={e.id || e.client_event_id || `mB-${idx}`}
                      x1={Number(e.x_m)}
                      y1={Number(e.y_m)}
                      x2={Number(e.end_x_m)}
                      y2={Number(e.end_y_m)}
                      className={e.outcome === 'success' ? 'stroke-brand' : 'stroke-danger'}
                      strokeWidth="0.7"
                      strokeDasharray={e.outcome === 'success' ? 'none' : '1.5,1.5'}
                      opacity={0.75}
                    />
                  ))}
            </PitchSvg>
            {isDenseMapB ? (
              <>
                <div className="flex items-center justify-center gap-3 flex-wrap text-2 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-1/15 border border-line inline-block" />
                    Jarang
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-warning/70 border border-line inline-block" />
                    Sedang
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-danger/80 border border-line inline-block" />
                    Paling Ramai
                  </span>
                </div>
                <div className="text-2 text-sm font-mono text-center">
                  Arah serang: Kiri &rarr; Kanan
                </div>
              </>
            ) : (
              <div className="text-2 text-sm font-mono text-center">
                Solid: Sukses • Putus-putus: Gagal
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Analisis Taktis Berbasis Literatur */}
        <div className="p-4 rounded-control bg-raised border border-line space-y-4" data-testid="report-tactical-summary">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-line pb-2">
            <h3 className="text-sm font-semibold text-1">
              Analisis Taktis Terukur · {reportHomeTeam || 'Tim Kita'} vs {reportAwayTeam}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <RefChip referenceId="fifa-football-language-2022" />
              <RefChip referenceId="sarmento-2014-match-analysis" />
              <RefChip referenceId="vogelbein-2014-defensive-transition" />
              <RefChip referenceId="pollard-reep-1997-playing-strategies" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="p-2.5 rounded bg-app border border-line space-y-0.5">
              <span className="text-sm text-2 block">Dominasi Sepertiga Akhir</span>
              <span className="font-semibold text-1 tabular-nums block">
                {tacticalSummary.field_tilt.own_pct != null
                  ? `${tacticalSummary.field_tilt.own_pct}% vs ${tacticalSummary.field_tilt.opponent_pct}%`
                  : 'Belum ada data'}
              </span>
              <span className="text-sm text-2 tabular-nums">n = {tacticalSummary.field_tilt.n} umpan</span>
            </div>

            <div className="p-2.5 rounded bg-app border border-line space-y-0.5">
              <span className="text-sm text-2 block">Tinggi Blok Bertahan</span>
              <span className="font-semibold text-1 block">
                Kita: {tacticalSummary.own.def_line.avg_m != null ? `${tacticalSummary.own.def_line.avg_m} m (${tacticalSummary.own.def_line.block_label})` : '-'}
              </span>
              <span className="text-sm text-2 block">
                Lawan: {tacticalSummary.opponent.def_line.avg_m != null ? `${tacticalSummary.opponent.def_line.avg_m} m (${tacticalSummary.opponent.def_line.block_label})` : '-'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-app border border-line space-y-0.5">
              <span className="text-sm text-2 block">Tembakan Dalam Kotak</span>
              <span className="font-semibold text-1 tabular-nums block">
                Kita: {tacticalSummary.own.shot_zones.inside_box.count}/{tacticalSummary.own.shot_zones.n}
                {tacticalSummary.own.shot_zones.avg_distance_m != null ? ` (${tacticalSummary.own.shot_zones.avg_distance_m} m)` : ''}
              </span>
              <span className="text-sm text-2 tabular-nums block">
                Lawan: {tacticalSummary.opponent.shot_zones.inside_box.count}/{tacticalSummary.opponent.shot_zones.n}
                {tacticalSummary.opponent.shot_zones.avg_distance_m != null ? ` (${tacticalSummary.opponent.shot_zones.avg_distance_m} m)` : ''}
              </span>
            </div>

            <div className="p-2.5 rounded bg-app border border-line space-y-0.5">
              <span className="text-sm text-2 block">Transisi & Koridor Dominan</span>
              <span className="font-semibold text-1 tabular-nums block">
                Rebut tinggi kita: {tacticalSummary.own.transitions.high_regains}
              </span>
              <span className="text-sm text-2 block">
                Koridor: {tacticalSummary.own.corridors.dominant?.label || '-'} vs {tacticalSummary.opponent.corridors.dominant?.label || '-'}
              </span>
            </div>
          </div>

          {/* Pembacaan Teknik Permainan & Strategi Lawan (Cetak A4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" data-testid="report-technique-and-strategy">
            <div className="p-3 rounded bg-app border border-line space-y-1.5">
              <h4 className="font-semibold text-1">Pembacaan Teknik Permainan (Tim Kita)</h4>
              <p className="text-2">
                <strong className="text-1">Gaya umpan:</strong> {tacticalSummary.technique.own.passing.style_label} (progresif: {tacticalSummary.technique.own.passing.progressive_count}, umpan kunci: {tacticalSummary.technique.own.passing.key_passes}).
              </p>
              <p className="text-2">
                <strong className="text-1">Keamanan bola:</strong> {tacticalSummary.technique.own.ball_security.total_losses} kehilangan bola ({tacticalSummary.technique.own.ball_security.dangerous_losses} di sepertiga pertahanan sendiri).
              </p>
              <p className="text-2">
                <strong className="text-1">Bertahan & duel:</strong> Tekel {tacticalSummary.technique.own.defensive_technique.tackles}, intersepsi {tacticalSummary.technique.own.defensive_technique.interceptions}, sapuan {tacticalSummary.technique.own.defensive_technique.clearances}.
              </p>
            </div>

            <div className="p-3 rounded bg-app border border-line space-y-1.5">
              <h4 className="font-semibold text-1">Pembacaan Strategi Lawan ({activeMatch.opponent_name})</h4>
              <p className="text-2">
                <strong className="text-1">Blok bertahan:</strong> {tacticalSummary.opponent_strategy.defensive_title}.
              </p>
              <p className="text-2">
                <strong className="text-1">Jalur dominan:</strong> {tacticalSummary.opponent_strategy.channel_pattern}.
              </p>
              {tacticalSummary.opponent_strategy.vulnerabilities.length > 0 && (
                <p className="text-2">
                  <strong className="text-1">Celah utama:</strong> {tacticalSummary.opponent_strategy.vulnerabilities.map((v) => v.title).join('; ')}.
                </p>
              )}
            </div>
          </div>

          {/* Rekomendasi Kontra-Taktik Berbasis Rujukan (Cetak A4) */}
          {tacticalSummary.counter_tactics.length > 0 && (
            <div className="p-3 rounded bg-app border border-line space-y-2 text-sm" data-testid="report-counter-tactics">
              <h4 className="font-semibold text-1">Rekomendasi Kontra-Taktik & Fokus Latihan Berbasis Rujukan</h4>
              <div className="space-y-2">
                {tacticalSummary.counter_tactics.map((ct) => (
                  <div key={ct.id} className="p-2.5 rounded bg-raised border border-line space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-1">{ct.title}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="neutral" size="sm">Prioritas {ct.priority}</Badge>
                        {ct.reference_ids.map((rid) => (
                          <RefChip key={rid} referenceId={rid} />
                        ))}
                      </div>
                    </div>
                    <p className="text-2">
                      <strong className="text-1">Bukti:</strong> {ct.trigger_evidence}
                    </p>
                    <p className="text-1">
                      <strong>Kontra-taktik:</strong> {ct.tactical_action}
                    </p>
                    <p className="text-2">
                      <strong className="text-1">Fokus latihan:</strong> {ct.training_focus}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tacticalSummary.observations.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-sm text-2">
              {tacticalSummary.observations.map((obs) => (
                <li key={obs.id}>
                  <strong className="text-1">{obs.title}:</strong> {obs.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* SECTION 7: SKEMA TAKTIK TERKAIT */}
      <section className="space-y-3 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 7 • Konteks Kurikulum
          </span>
          <h2 className="text-xl font-bold text-1">Skema Taktik Terkait</h2>
        </div>

        {activePublishedScenarios.length === 0 ? (
          <div className="p-4 rounded-control bg-raised border border-line text-sm text-2 text-center font-mono">
            Tidak ada skema terbit terkait
          </div>
        ) : (
          <div className="space-y-2">
            {activePublishedScenarios.map((scen) => (
              <div
                key={scen.id}
                className="p-3 rounded-control bg-raised border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div>
                  <h3 className="font-semibold text-1">{scen.title}</h3>
                  <p className="text-2 font-mono mt-0.5">
                    Fase: {scen.phase} • Format: {scen.format} • Ditinjau: {scen.reviewed_by || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(scen.references || []).map((ref) => (
                    <RefChip key={ref.reference_id} referenceId={ref.reference_id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 8: LAMPIRAN METODE */}
      <section className="space-y-3 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 8 • Transparansi Metodologi
          </span>
          <h2 className="text-xl font-bold text-1">Lampiran Metode</h2>
          <p className="text-sm text-2">
            Setiap rumus, batasan, dan rujukan dokumen terverifikasi yang mendasari analisis ini.
          </p>
        </div>

        <div className="space-y-3">
          {METRIC_DEFINITIONS.map((m) => (
            <div key={m.id} className="p-3 rounded-control bg-raised border border-line text-sm space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-1 text-sm">{m.name}</span>
                <span className="font-mono text-2">Satuan: {m.unit}</span>
              </div>
              <p className="text-2 leading-relaxed">{m.definition}</p>
              <div className="font-mono text-sm bg-app p-2 rounded border border-line text-1">
                Rumus: {m.formula}
              </div>
              <p className="text-sm text-2 italic">
                Batasan: {m.limitations}
              </p>
              {m.reference_ids && m.reference_ids.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-2 font-mono">Rujukan:</span>
                  {m.reference_ids.map((refId) => (
                    <RefChip key={refId} referenceId={refId} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9: INTEGRITAS */}
      <section className="space-y-3 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 9 • Kriptografi &amp; Keaslian
          </span>
          <h2 className="text-xl font-bold text-1">Integritas Dokumen</h2>
        </div>

        <div className="p-3 rounded-control bg-raised border border-line space-y-2 text-sm font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-2 block">Versi Payload:</span>
              <span className="text-1 font-bold">report-v1</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-2 block">Events Digest (SHA-256):</span>
              <span className="text-1 break-all select-all font-mono">
                {isViewingFrozen
                  ? (latestSnapshot?.events_digest || latestSnapshot?.canonical_payload?.events_digest || '-')
                  : (currentPayload?.events_digest || '-')}
              </span>
            </div>
          </div>

          <div>
            <span className="text-2 block">Snapshot Hash (SHA-256):</span>
            <span className="text-brand font-bold break-all select-all font-mono">
              {latestSnapshot?.snapshot_hash || currentHash || '-'}
            </span>
          </div>

          {latestSnapshot && (
            <div className="pt-2 border-t border-line text-2 space-y-0.5">
              <div>Status: <span className="text-1 font-semibold">Telah Dikunci</span></div>
              <div>Pemeriksa: <span className="text-1">{latestSnapshot.reviewed_by_profile?.full_name || latestSnapshot.reviewed_by}</span></div>
              <div>Tanggal Penguncian: <span className="text-1">{new Date(latestSnapshot.created_at).toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>
      </section>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 10pt;
          }
          @page {
            margin-bottom: 2cm;
            @bottom-right {
              content: "Halaman " counter(page) " / " counter(pages);
            }
          }
          .report-content {
            padding-bottom: 3cm;
          }
        }
      `}</style>

      {/* FOOTER (Printed on every page via fixed CSS) */}
      <footer className="print-footer pt-4 border-t border-line text-xs text-2 font-mono flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BrandMark size={14} aria-hidden="true" />
          <span>Dokumen internal akademi; berisi data anak, jangan dibagikan tanpa persetujuan wali.</span>
        </div>
      </footer>

      {/* Freeze Report Dialog Modal */}
      <Dialog
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        icon={<BrandMark size={20} aria-hidden="true" />}
        title="Kunci Laporan Pertandingan"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFreezeModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.5} />}
              onClick={handleFreezeReport}
              disabled={freezing || !selectedReviewer || reviewerCandidates.length === 0}
            >
              {freezing ? 'Mengunci...' : 'Konfirmasi & Kunci'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <p className="text-2 leading-relaxed">
            Mengunci laporan akan membuat rekaman laporan yang bersifat tetap (immutable). Setelah dikunci, data laporan tidak dapat diubah atau dihapus.
          </p>

          <div className="p-3 rounded-control bg-raised border border-line font-mono space-y-1">
            <div>Laga: vs {activeMatch.opponent_name}</div>
            <div>Hash: {currentHash.slice(0, 24)}...</div>
          </div>

          <div>
            <label htmlFor="select-reviewer" className="block font-medium text-1 mb-1">
              Pilih Pemeriksa (Pelatih lain atau Admin):
            </label>
            {reviewerCandidates.length === 0 ? (
              <div className="p-3 rounded-control bg-raised border border-warning text-warning text-sm">
                Belum ada pelatih lain atau admin yang bisa memeriksa
              </div>
            ) : (
              <>
                <select
                  id="select-reviewer"
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-1.5 rounded-control bg-app border border-line text-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  <option value="">-- Pilih Staf Pemeriksa --</option>
                  {reviewerCandidates.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name || staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
                <p className="text-2 text-sm mt-1">
                  Pemeriksa harus pelatih lain dari akademi yang sama atau admin, bukan pembuat laporan.
                </p>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
