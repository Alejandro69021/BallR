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
import { listScenarios } from '../lib/scenarios';
import {
  countsByPlayer,
  passStats,
  shotStats,
  thirds,
  ppda,
  dataQuality,
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

      setEvents(evts || []);
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
        subtext: 'Laporan terkunci resmi berhasil disimpan dengan hash kriptografis.'
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
      <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-4 max-w-md mx-auto my-12" data-surface="paper">
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
      <div className="p-12 text-center text-sm text-2 font-mono" data-surface="paper">
        Memuat berkas laporan pertandingan...
      </div>
    );
  }

  if (!match) {
    return (
      <div data-surface="paper" className="p-6">
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6" data-surface="paper">
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
              Laporan Pertandingan: {activeMatch.opponent_name ? activeMatch.opponent_name.replace(/^(?:contoh:\s*)?(?:vs\.?\s*)?/i, '').trim() : ''}
            </h1>
            <p className="text-sm text-2 font-mono mt-1">
              Tanggal: {activeMatch.match_date || '-'} • Format: {activeMatch.format || '11v11'} • Lapangan: {activeMatch.pitch_length_m}&times;{activeMatch.pitch_width_m}m
            </p>
          </div>
          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 sm:text-right shrink-0">
            <div className="text-2xl font-bold font-mono text-1 whitespace-nowrap tabular-nums">
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
          {activeDq.statement}
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
              {activeDq.players_with_events_count.value} / {activeDq.players_with_events_count.n}
            </span>
            <span className="text-2 block mt-0.5">Pemain dengan &ge;1 aksi</span>
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
              Lawan ({activeMatch.opponent_name ? activeMatch.opponent_name.replace(/^(?:contoh:\s*)?(?:vs\.?\s*)?/i, '').trim() : ''})
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
                      {formatPositionLabel(row.position)} • {row.is_starter ? 'Starter' : 'Cadangan'}
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
              header: 'Total (n)',
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
          data={activePlayerStats.rows}
          emptyMessage="Belum ada data partisipasi pemain yang terdaftar."
        />
      </section>

      {/* SECTION 6: PETA KEJADIAN (SVG FIGURES) */}
      <section className="space-y-4 pb-6 border-b border-line">
        <div>
          <span className="text-sm font-mono uppercase tracking-wider text-2">
            Bagian 6 • Distribusi Spasial
          </span>
          <h2 className="text-xl font-bold text-1">Peta Kejadian</h2>
          <p className="text-sm text-2 font-mono mt-0.5">
            Data pencatatan manual; bukan pelacakan otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Figure A: Aksi Tim Kita */}
          <div className="p-3 rounded-control bg-raised border border-line space-y-2">
            <span className="font-semibold text-1 text-sm block">
              Gambar A: Sebaran Titik Aksi Tim Kita (n={activeEvents.filter((e) => e.team === 'own' && e.x_m != null).length})
            </span>
            <PitchSvg
              pitchLengthM={activeMatch.pitch_length_m || 90}
              pitchWidthM={activeMatch.pitch_width_m || 60}
              orientation="horizontal"
            >
              {activeEvents
                .filter((e) => e.team === 'own' && e.x_m != null && e.y_m != null)
                .map((e) => (
                  <circle
                    key={e.id || e.client_event_id}
                    cx={Number(e.x_m)}
                    cy={Number(e.y_m)}
                    r="1.2"
                    className={
                      e.event_type === 'goal'
                        ? 'fill-brand stroke-app'
                        : e.event_type.includes('shot')
                        ? 'fill-series-1'
                        : 'fill-1 opacity-70'
                    }
                  />
                ))}
            </PitchSvg>
            <div className="text-2 text-sm font-mono text-center">
              Arah serang: Kiri &rarr; Kanan
            </div>
          </div>

          {/* Figure B: Aliran Umpan dengan Titik Akhir */}
          <div className="p-3 rounded-control bg-raised border border-line space-y-2">
            <span className="font-semibold text-1 text-sm block">
              Gambar B: Aliran Umpan Tim Kita Berkoordinat Akhir
            </span>
            <PitchSvg
              pitchLengthM={activeMatch.pitch_length_m || 90}
              pitchWidthM={activeMatch.pitch_width_m || 60}
              orientation="horizontal"
            >
              {activeEvents
                .filter(
                  (e) =>
                    e.team === 'own' &&
                    (e.event_type === 'pass' || e.event_type === 'key_pass') &&
                    e.x_m != null &&
                    e.end_x_m != null
                )
                .map((e) => (
                  <line
                    key={e.id || e.client_event_id}
                    x1={Number(e.x_m)}
                    y1={Number(e.y_m)}
                    x2={Number(e.end_x_m)}
                    y2={Number(e.end_y_m)}
                    className={e.outcome === 'success' ? 'stroke-brand' : 'stroke-danger'}
                    strokeWidth="0.8"
                    strokeDasharray={e.outcome === 'success' ? 'none' : '1.5,1.5'}
                    opacity={0.8}
                  />
                ))}
            </PitchSvg>
            <div className="text-2 text-sm font-mono text-center">
              Solid: Sukses • Putus-putus: Gagal
            </div>
          </div>
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
              <div>Status: <span className="text-1 font-semibold">Telah Dikunci Resmi</span></div>
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
      <footer className="print-footer pt-4 border-t border-line text-xs text-2 font-mono">
        <span>Dokumen internal akademi; berisi data anak, jangan dibagikan tanpa persetujuan wali.</span>
      </footer>

      {/* Freeze Report Dialog Modal */}
      <Dialog
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
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
