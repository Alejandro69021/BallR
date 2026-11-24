import React from 'react';
import { Eye, Edit3 } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatPositionLabel, formatPreferredFoot } from '../../lib/displayLabels';

export default function SquadPlayerCard({
  player,
  userRole,
  onViewPassport,
  onEvaluatePlayer
}) {
  const { personal_info, radar_attributes, player_id } = player || {};

  const isCoach = userRole === 'coach' || userRole === 'admin';
  const isPublished = personal_info?.evaluation_status === 'ready';

  const getAttr = (key) => {
    const item = (radar_attributes || []).find((a) =>
      a.attribute && a.attribute.toLowerCase().includes(key)
    );
    return item ? Number(item.value) : null;
  };

  const pace = getAttr('pace');
  const passing = getAttr('passing');
  const physical = getAttr('physical');

  return (
    <div className="rounded-panel border border-line bg-panel p-4 flex flex-col justify-between hover:border-control transition-colors duration-150 text-1">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Athlete photo or jersey badge */}
          <div className="relative shrink-0">
            <div className="w-14 h-16 rounded-control overflow-hidden bg-raised border border-line flex items-center justify-center">
              {personal_info?.photo_url ? (
                <img
                  src={personal_info.photo_url}
                  alt={personal_info.full_name || personal_info.nickname || 'Atlet'}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="font-mono text-base font-semibold text-2">
                  #{personal_info?.jersey_number ?? '-'}
                </span>
              )}
            </div>
            {personal_info?.jersey_number != null && (
              <span className="absolute -bottom-1 -left-1 px-1 py-0.2 rounded bg-panel border border-line text-sm font-mono font-semibold text-1">
                #{personal_info.jersey_number}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="px-2 py-0.5 rounded-control bg-raised border border-line text-sm font-medium text-2">
              {formatPositionLabel(personal_info?.position)}
            </span>
            <Badge variant={isPublished ? 'success' : 'warning'}>
              {isPublished ? 'Diterbitkan' : 'Draf'}
            </Badge>
          </div>
        </div>

        {/* Player Identity Information */}
        <div className="space-y-1">
          <h3
            className="text-sm font-semibold text-1 truncate"
            title={personal_info?.full_name}
          >
            {personal_info?.full_name || 'Atlet'}
          </h3>

          <div className="flex items-center gap-1.5 text-sm text-2">
            <span className="truncate">{formatPositionLabel(personal_info?.position)}</span>
            <span>·</span>
            <span>{personal_info?.age ? `${personal_info.age} thn` : 'Belum ada data'}</span>
          </div>

          <div className="text-sm text-2 flex items-center justify-between pt-1">
            <span>Kaki: <span className="text-1 font-medium">{formatPreferredFoot(personal_info?.preferred_foot)}</span></span>
            <span>{personal_info?.height_cm ? `${personal_info.height_cm} cm` : 'Belum ada data'}</span>
          </div>
        </div>

        {/* Mini Indicators */}
        <div className="mt-3 p-2.5 rounded-control bg-raised border border-line space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-2">Kecepatan (Pace)</span>
            <span className="tabular-nums text-1 font-semibold">{pace != null ? pace : 'Belum ada data'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-2">Operan (Passing)</span>
            <span className="tabular-nums text-1 font-semibold">{passing != null ? passing : 'Belum ada data'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-2">Fisik (Physical)</span>
            <span className="tabular-nums text-1 font-semibold">{physical != null ? physical : 'Belum ada data'}</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className={`mt-4 pt-3 border-t border-line grid ${isCoach ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onViewPassport(player_id)}
          icon={<Eye className="w-4 h-4" strokeWidth={1.5} />}
          className="w-full justify-center min-h-[44px]"
        >
          Paspor
        </Button>

        {isCoach && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onEvaluatePlayer(player_id)}
            icon={<Edit3 className="w-4 h-4" strokeWidth={1.5} />}
            className="w-full justify-center min-h-[44px]"
          >
            Evaluasi
          </Button>
        )}
      </div>
    </div>
  );
}
