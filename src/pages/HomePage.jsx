import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Plus,
  Play,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import { listMatches, listEvents, formatMatchError } from '../lib/matches';
import StageStepper from '../components/ux/StageStepper';
import EmptyState from '../components/ux/EmptyState';
import WelcomeTour from '../components/ux/WelcomeTour';
import CreateMatchDialog from '../components/matches/CreateMatchDialog';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { PageHeader, PitchLines } from '../components/brand';

/**
 * HomePage ("Beranda")
 * Artboards 1 and 3 (Desktop + Phone) per docs/UX_SPEC.md
 */
export default function HomePage({
  userRole: _userRole = 'coach',
  onToast
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const startTour = Boolean(location?.state?.startTour);
  const { players, isDemoMode } = usePlayers();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draftEventsCount, setDraftEventsCount] = useState(0);

  const fetchMatches = useCallback(async () => {
    try {
      const data = await listMatches();
      const matchData = data || [];
      setMatches(matchData);

      const draft = matchData.find((m) => m.status === 'draft');
      if (draft?.id) {
        try {
          const events = await listEvents(draft.id);
          setDraftEventsCount(events?.length || 0);
        } catch {
          setDraftEventsCount(0);
        }
      } else {
        setDraftEventsCount(0);
      }
    } catch (err) {
      console.warn('Gagal memuat laga:', err);
      onToast?.({
        title: 'Gagal Memuat Data',
        subtext: formatMatchError(err),
        variant: 'error'
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listMatches();
        if (!active) return;
        const matchData = data || [];
        setMatches(matchData);

        const draft = matchData.find((m) => m.status === 'draft');
        if (draft?.id) {
          try {
            const events = await listEvents(draft.id);
            if (active) setDraftEventsCount(events?.length || 0);
          } catch {
            if (active) setDraftEventsCount(0);
          }
        } else {
          if (active) setDraftEventsCount(0);
        }
      } catch (err) {
        if (!active) return;
        console.warn('Gagal memuat laga:', err);
        onToast?.({
          title: 'Gagal Memuat Data',
          subtext: formatMatchError(err),
          variant: 'error'
        });
        setMatches([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [onToast]);

  // Derived match states
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const dateA = new Date(a.match_date || a.created_at || 0).getTime();
      const dateB = new Date(b.match_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [matches]);

  const latestDraftMatch = useMemo(() => {
    return sortedMatches.find((m) => m.status === 'draft') || null;
  }, [sortedMatches]);

  const latestFinalMatch = useMemo(() => {
    return sortedMatches.find((m) => m.status === 'final') || null;
  }, [sortedMatches]);

  // If there's a draft match, feature it; otherwise if there are matches, feature the latest
  const featuredMatch = latestDraftMatch || sortedMatches[0] || null;
  const isDraftFeatured = featuredMatch?.status === 'draft';

  // Recent 3 matches
  const recentMatches = useMemo(() => {
    return sortedMatches.slice(0, 3);
  }, [sortedMatches]);

  const handleMatchCreated = (newMatch) => {
    fetchMatches();
    if (newMatch?.id) {
      navigate(`/pencatatan/${newMatch.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with PageHeader */}
      <PageHeader
        kicker="Ikhtisar Pembinaan"
        title="Beranda"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Trophy className="w-4 h-4 text-brand" />}
              onClick={() => navigate('/laga')}
              className="min-h-[44px]"
            >
              Semua Laga
            </Button>
            <Button
              variant="brand"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
              className="min-h-[44px]"
              data-tour="new-match"
            >
              Laga Baru
            </Button>
          </>
        }
      />

      {/* Hero Band: Pitch-green with PitchLines & bib primary button */}
      <div className="relative bg-pitch text-chalk rounded-panel border-2 border-ink p-6 sm:p-8 overflow-hidden shadow-md">
        <PitchLines variant="center" opacity={0.11} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-wider uppercase text-bib">
              Fokus Hari Ini
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-chalk tracking-tight">
              Apa yang mau kamu kerjakan hari ini?
            </h2>
            {featuredMatch && (
              <p className="text-sm text-mint">
                {isDraftFeatured ? `Laga aktif: vs ${featuredMatch.opponent_name}` : `Laga terakhir: vs ${featuredMatch.opponent_name}`}
              </p>
            )}
          </div>

          <div className="shrink-0">
            {featuredMatch ? (
              <button
                type="button"
                onClick={() => navigate(isDraftFeatured ? `/pencatatan/${featuredMatch.id}` : `/laga/${featuredMatch.id}`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-control bg-bib text-ink font-semibold text-base hover:opacity-90 active:opacity-95 transition-opacity min-h-[44px] select-none shadow-xs"
                data-testid="hero-continue-action"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Lanjutkan laga terakhir</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-control bg-bib text-ink font-semibold text-base hover:opacity-90 active:opacity-95 transition-opacity min-h-[44px] select-none shadow-xs"
                data-testid="hero-continue-action"
              >
                <Plus className="w-4 h-4" />
                <span>Mulai laga pertama</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* First-Run Welcome Tour Banner & CoachMark */}
      <WelcomeTour forceStart={startTour} />

      {/* Primary Section: Active Task Card or Empty State */}
      {loading ? (
        <div className="p-8 border border-line rounded-panel bg-panel text-center">
          <p className="text-sm text-2">Memuat ringkasan beranda...</p>
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          title="Belum ada laga"
          description="Mulailah dengan membuat laga pertama. Kamu hanya perlu nama lawan dan tanggal. Ukuran lapangan sudah terisi otomatis, bisa kamu ubah."
          actionLabel="Buat laga pertama"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Main Card: Lanjutkan Laga Terakhir or Laga Terakhir Selesai */}
          <div
            data-testid="continue-match-card"
            className="lg:col-span-2 p-5 sm:p-6 rounded-panel border border-line bg-panel shadow-xs flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-sm font-semibold tracking-wider uppercase text-brand">
                    {isDraftFeatured ? 'Lanjutkan laga terakhir' : 'Laga terakhir selesai'}
                  </span>
                  <h2 className="text-xl font-bold text-1">
                    {featuredMatch.opponent_name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-2">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      {featuredMatch.match_date || '-'}
                    </span>
                    <span>•</span>
                    <span className="tabular-nums">{featuredMatch.format || '11v11'}</span>
                    {featuredMatch.competition && (
                      <>
                        <span>•</span>
                        <span>{featuredMatch.competition}</span>
                      </>
                    )}
                  </div>
                </div>

                <Badge
                  variant={isDraftFeatured ? 'warning' : 'brand'}
                  size="md"
                >
                  {isDraftFeatured ? 'Draf' : 'Final'}
                </Badge>
              </div>

              {/* Real event count or score info */}
              <div className="p-3 rounded-control bg-raised border border-line flex items-center justify-between gap-3 text-sm">
                {isDraftFeatured ? (
                  <>
                    <span className="text-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand" />
                      Catatan terkini:
                    </span>
                    <span className="font-bold text-1" data-testid="real-event-count">
                      {draftEventsCount} kejadian sudah dicatat
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2">Skor akhir:</span>
                    <span className="tabular-nums font-bold text-1 text-base">
                      {featuredMatch.own_score != null
                        ? `${featuredMatch.own_score} - ${featuredMatch.opponent_score}`
                        : 'Selesai'}
                    </span>
                  </>
                )}
              </div>

              {/* Stepper showing order of work */}
              <div className="pt-1">
                <StageStepper
                  currentStep={isDraftFeatured ? 2 : 4}
                />
              </div>
            </div>

            {/* Action Buttons: 1 Primary + Secondary */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {isDraftFeatured ? (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Play className="w-5 h-5 fill-current" />}
                  onClick={() => navigate(`/pencatatan/${featuredMatch.id}`)}
                  className="flex-1 min-h-[56px] text-lg font-bold"
                  data-testid="primary-continue-action"
                  data-tour="record-events"
                >
                  Lanjut mencatat
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<FileText className="w-5 h-5" />}
                  onClick={() => navigate(`/laga/${featuredMatch.id}/laporan`)}
                  className="flex-1 min-h-[56px] text-lg font-bold"
                  data-testid="primary-continue-action"
                  data-tour="match-report"
                >
                  Buka laporan
                </Button>
              )}

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/laga/${featuredMatch.id}`)}
                className="min-h-[44px] sm:min-h-[56px]"
              >
                Lihat detail laga
              </Button>
            </div>
          </div>

          {/* Side Card: Mulai laga baru */}
          <div className="p-5 sm:p-6 rounded-panel border border-line bg-panel shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent-soft/50 text-brand flex items-center justify-center">
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-semibold text-1">Mulai laga baru</h2>
              <p className="text-sm text-2 leading-relaxed">
                Isi nama lawan, tanggal, dan ukuran lapangan. Cukup satu menit, lalu kamu bisa langsung mencatat.
              </p>
            </div>

            <Button
              variant="secondary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
              className="w-full justify-center min-h-[44px]"
              data-tour="new-match"
            >
              Buat laga baru
            </Button>
          </div>
        </div>
      )}

      {/* Work-Order Cards (Five Cards per UX_SPEC) */}
      <section aria-labelledby="work-order-heading" className="space-y-3 pt-2">
        <h2 id="work-order-heading" className="text-lg font-semibold text-1">
          Alur Kerja Pelatih
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Siapkan skuad */}
          <button
            type="button"
            onClick={() => navigate('/skuad')}
            className="p-4 rounded-panel border border-line bg-panel hover:bg-raised/40 transition-colors duration-150 flex flex-col justify-between gap-3 text-left min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-control bg-raised text-brand flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-1">Siapkan skuad</h3>
                <p className="text-sm text-2 mt-1 leading-snug">
                  Daftar pemain dan profil mereka.
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-brand inline-flex items-center gap-1">
              Buka skuad <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* 2. Buat laga */}
          <button
            type="button"
            data-tour="new-match"
            onClick={() => setIsCreateOpen(true)}
            className="p-4 rounded-panel border border-line bg-panel hover:bg-raised/40 transition-colors duration-150 flex flex-col justify-between gap-3 text-left min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-control bg-raised text-brand flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-1">Buat laga</h3>
                <p className="text-sm text-2 mt-1 leading-snug">
                  Catat lawan, tanggal, dan ukuran lapangan.
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-brand inline-flex items-center gap-1">
              Tambah laga <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* 3. Catat kejadian */}
          <button
            type="button"
            data-tour="record-events"
            onClick={() => {
              if (latestDraftMatch?.id) {
                navigate(`/pencatatan/${latestDraftMatch.id}`);
              } else {
                navigate('/laga');
              }
            }}
            className="p-4 rounded-panel border border-line bg-panel hover:bg-raised/40 transition-colors duration-150 flex flex-col justify-between gap-3 text-left min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-control bg-raised text-brand flex items-center justify-center">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-1">Catat kejadian</h3>
                <p className="text-sm text-2 mt-1 leading-snug">
                  Ketuk aksi saat laga berjalan, atau sambil memutar video laga dari perangkatmu.
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-brand inline-flex items-center gap-1">
              {latestDraftMatch ? 'Catat draf' : 'Pilih laga'} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* 4. Selesaikan laga */}
          <button
            type="button"
            data-tour="finish-match"
            onClick={() => {
              if (latestDraftMatch?.id) {
                navigate(`/laga/${latestDraftMatch.id}`);
              } else {
                navigate('/laga');
              }
            }}
            className="p-4 rounded-panel border border-line bg-panel hover:bg-raised/40 transition-colors duration-150 flex flex-col justify-between gap-3 text-left min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-control bg-raised text-brand flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-1">Selesaikan laga</h3>
                <p className="text-sm text-2 mt-1 leading-snug">
                  Isi skor akhir. Setelah itu catatan laga terkunci dan tidak bisa diubah.
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-brand inline-flex items-center gap-1">
              Kunci laga <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* 5. Laporan dan bagikan */}
          <button
            type="button"
            data-tour="match-report"
            onClick={() => {
              if (latestFinalMatch?.id) {
                navigate(`/laga/${latestFinalMatch.id}/laporan`);
              } else {
                navigate('/laga');
              }
            }}
            className="p-4 rounded-panel border border-line bg-panel hover:bg-raised/40 transition-colors duration-150 flex flex-col justify-between gap-3 text-left min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-control bg-raised text-brand flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-1">Laporan dan bagikan</h3>
                <p className="text-sm text-2 mt-1 leading-snug">
                  Laporan laga yang bisa dicetak, dan kartu perkembangan pemain bila wali sudah setuju.
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-brand inline-flex items-center gap-1">
              Buka laporan <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </section>

      {/* Recent Matches List (Max 3) */}
      {recentMatches.length > 0 && (
        <section aria-labelledby="recent-matches-heading" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 id="recent-matches-heading" className="text-lg font-semibold text-1">
              Laga terakhir
            </h2>
            <button
              type="button"
              onClick={() => navigate('/laga')}
              className="text-sm font-medium text-brand hover:underline min-h-[44px] inline-flex items-center gap-1 select-none"
            >
              Lihat semua ({matches.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentMatches.map((m) => {
              const isDraft = m.status === 'draft';
              return (
                <div
                  key={m.id}
                  className="p-4 rounded-panel border border-line bg-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-control transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-1 truncate">
                        {m.opponent_name}
                      </span>
                      <Badge variant={isDraft ? 'warning' : 'brand'} size="sm">
                        {isDraft ? 'Draf' : 'Final'}
                      </Badge>
                    </div>
                    <div className="text-sm text-2 tabular-nums space-x-1.5">
                      <span>{m.match_date || '-'}</span>
                      <span>•</span>
                      <span>{m.format || '11v11'}</span>
                      {m.status === 'final' && m.own_score != null && (
                        <>
                          <span>•</span>
                          <span className="text-1 font-semibold">
                            Skor: {m.own_score} - {m.opponent_score}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDraft ? (
                      <Button
                        variant="brand"
                        size="sm"
                        className="min-h-[44px] w-full sm:w-auto"
                        onClick={() => navigate(`/pencatatan/${m.id}`)}
                      >
                        Lanjut mencatat
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-[44px] w-full sm:w-auto"
                        onClick={() => navigate(`/laga/${m.id}/laporan`)}
                      >
                        Buka laporan
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* New Match Modal */}
      <CreateMatchDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleMatchCreated}
        players={players}
        onToast={onToast}
      />
    </div>
  );
}
