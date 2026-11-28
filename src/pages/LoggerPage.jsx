import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Compass } from 'lucide-react';
import FastPitchLogger from '../components/FastPitchLogger';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { usePlayers } from '../hooks/usePlayers';
import { getMatch, listParticipants } from '../lib/matches';

export default function LoggerPage({ userRole = 'public', onOpenAuthModal, onToast }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { players, loading: playersLoading } = usePlayers();

  const isAuthorized = userRole === 'coach' || userRole === 'admin';

  const [match, setMatch] = useState(null);
  const [matchParticipants, setMatchParticipants] = useState([]);
  const [matchLoading, setMatchLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setMatchLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchMatchData() {
      setMatchLoading(true);
      try {
        const [m, p] = await Promise.all([
          getMatch(matchId),
          listParticipants(matchId)
        ]);
        if (isMounted) {
          setMatch(m || null);
          setMatchParticipants(p || []);
        }
      } catch (err) {
        console.warn('Gagal memuat pertandingan:', err);
        if (isMounted) {
          setMatch(null);
          setMatchParticipants([]);
        }
      } finally {
        if (isMounted) setMatchLoading(false);
      }
    }

    fetchMatchData();
    return () => {
      isMounted = false;
    };
  }, [matchId]);

  useEffect(() => {
    if (!isAuthorized && onOpenAuthModal && matchId) {
      onOpenAuthModal(`logger:${matchId}`);
    }
  }, [isAuthorized, matchId, onOpenAuthModal]);

  // Merge match participants with player roster data
  const participants = useMemo(() => {
    if (!players || players.length === 0) return [];

    if (matchParticipants.length > 0) {
      return matchParticipants.map((mp) => {
        const found = players.find(
          (p) => p.player_id === mp.player_id || p.public_id === mp.player_id
        );
        return {
          player_id: mp.player_id,
          name: found?.personal_info?.nickname || found?.personal_info?.full_name || mp.player_id,
          number: found?.personal_info?.jersey_number ?? '-',
          position: mp.position || found?.personal_info?.position || '',
          started: Boolean(mp.started)
        };
      });
    }

    // Fallback: roster players
    return players.map((p) => ({
      player_id: p.player_id || p.public_id,
      name: p.personal_info?.nickname || p.personal_info?.full_name || p.player_id,
      number: p.personal_info?.jersey_number ?? '-',
      position: p.personal_info?.position || '',
      started: false
    }));
  }, [players, matchParticipants]);

  if (matchLoading || playersLoading) return <LoadingSkeleton />;

  // 1. Unknown match ID -> EmptyState
  if (!match) {
    return (
      <div className="space-y-4">
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
            description="Pertandingan dengan ID ini tidak tersedia atau telah dihapus."
            actionLabel="Lihat daftar laga"
            onAction={() => navigate('/laga')}
          />
        </div>
      </div>
    );
  }

  // 2. Unauthorized access guard
  if (!isAuthorized) {
    return (
      <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-3 max-w-md mx-auto text-1">
        <Lock className="w-8 h-8 text-2 mx-auto" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-1">Akses Pitch Logger Terkunci</h2>
        <p className="text-sm text-2">
          Pencatatan kejadian laga hanya dapat diakses oleh staf pelatih dan admin terdaftar.
        </p>
        <Button
          type="button"
          variant="brand"
          size="sm"
          onClick={() => onOpenAuthModal?.(`logger:${matchId}`)}
        >
          Masuk akun pelatih
        </Button>
      </div>
    );
  }

  const isReadOnly = match.status === 'final';

  return (
    <div className="space-y-3 lg:space-y-2.5">
      {/* Back navigation bar + shortcut to automated tactical analysis */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/laga/${matchId}`)}
          >
            Kembali ke detail laga
          </Button>
          <Button
            variant="brand"
            size="sm"
            icon={<Compass className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/laga/${matchId}?tab=tactical`)}
            data-testid="shortcut-tactical-analysis-btn"
          >
            Analisis Otomatis (Video / YouTube)
          </Button>
        </div>

        {isReadOnly && (
          <Badge variant="warning" size="md">
            Laga sudah final
          </Badge>
        )}
      </div>

      {/* Read-only banner if match is final */}
      {isReadOnly && (
        <div className="p-3 rounded-panel bg-warning/10 border border-warning/30 text-sm text-warning flex items-center justify-between">
          <span>Laga sudah final. Kejadian dan waktu pertandingan dikunci (mode hanya baca).</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/laga/${matchId}`)}
          >
            Lihat laporan akhir
          </Button>
        </div>
      )}

      {/* Fast Pitch Logger bound to real match */}
      <FastPitchLogger
        match={match}
        participants={participants}
        isReadOnly={isReadOnly}
        onFinishMatch={() => navigate(`/laga/${matchId}`)}
        onToast={onToast}
      />
    </div>
  );
}
