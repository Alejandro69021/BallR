import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, TrendingUp, ClipboardEdit } from 'lucide-react';

export default function PlayerTabs({
  player,
  activeTab = 'passport', // 'passport' | 'growth' | 'assessment'
  userRole = 'public'
}) {
  const navigate = useNavigate();
  const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin';

  const playerId = player?.public_id || player?.player_id || 'PLAYER-01';
  const internalId = player?.player_id || playerId;
  const fullName = player?.personal_info?.full_name || 'Atlet';
  const jerseyNumber = player?.personal_info?.jersey_number;

  return (
    <div data-testid="player-tabs" className="space-y-3 pb-3 border-b border-line">
      {/* Back link: Kembali ke skuad (coach/admin only) - min 44x44px touch target */}
      {isCoachOrAdmin && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/skuad')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-2 hover:text-1 min-h-[44px] min-w-[44px] px-2 py-2 rounded-control transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
            aria-label="Kembali ke skuad"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Kembali ke skuad</span>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Player Name */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-1 truncate">
            {fullName}
          </h2>
          {jerseyNumber != null && (
            <span className="text-xs font-mono font-semibold text-2 bg-raised px-1.5 py-0.5 rounded border border-line shrink-0">
              #{jerseyNumber}
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav
          role="tablist"
          aria-label="Tab navigasi pemain"
          className="flex items-center gap-2 overflow-x-auto"
        >
          <Link
            to={`/pemain/${playerId}`}
            role="tab"
            aria-selected={activeTab === 'passport'}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-medium rounded-control border inline-flex items-center justify-center gap-1.5 transition-colors select-none ${
              activeTab === 'passport'
                ? 'bg-brand/10 border-brand/40 text-brand font-semibold'
                : 'bg-raised border-line text-2 hover:text-1'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Paspor</span>
          </Link>

          <Link
            to={`/pemain/${playerId}/pertumbuhan`}
            role="tab"
            aria-selected={activeTab === 'growth'}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-medium rounded-control border inline-flex items-center justify-center gap-1.5 transition-colors select-none ${
              activeTab === 'growth'
                ? 'bg-brand/10 border-brand/40 text-brand font-semibold'
                : 'bg-raised border-line text-2 hover:text-1'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Pertumbuhan</span>
          </Link>

          {isCoachOrAdmin && (
            <Link
              to={`/penilaian/${internalId}`}
              role="tab"
              aria-selected={activeTab === 'assessment'}
              className={`min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-medium rounded-control border inline-flex items-center justify-center gap-1.5 transition-colors select-none ${
                activeTab === 'assessment'
                  ? 'bg-brand/10 border-brand/40 text-brand font-semibold'
                  : 'bg-raised border-line text-2 hover:text-1'
              }`}
            >
              <ClipboardEdit className="w-3.5 h-3.5 shrink-0" />
              <span>Evaluasi</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
