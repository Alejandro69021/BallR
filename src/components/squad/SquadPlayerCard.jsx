import React from 'react';
import { Eye, Edit3, Lock, CheckCircle2, Clock } from 'lucide-react';

export default function SquadPlayerCard({
  player,
  userRole,
  onViewPassport,
  onEvaluatePlayer
}) {
  const { personal_info, radar_attributes, player_id } = player;

  const getBadgeTierStyle = (ovr) => {
    if (ovr >= 80) {
      return {
        border: 'border-[#CCFF00]/80 shadow-[0_0_15px_rgba(204,255,0,0.25)]',
        bg: 'bg-gradient-to-b from-[#2E3516] via-[#1A2218] to-[#0D131F]',
        text: 'text-transparent bg-clip-text bg-gradient-to-b from-white via-lime-200 to-[#CCFF00]',
        tierLabel: 'GOLD TIER'
      };
    }
    if (ovr >= 75) {
      return {
        border: 'border-slate-400/80 shadow-[0_0_15px_rgba(203,213,225,0.2)]',
        bg: 'bg-gradient-to-b from-[#222834] via-[#1A202C] to-[#0D131F]',
        text: 'text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400',
        tierLabel: 'SILVER TIER'
      };
    }
    return {
      border: 'border-amber-600/80 shadow-[0_0_15px_rgba(217,119,6,0.2)]',
      bg: 'bg-gradient-to-b from-[#331C13] via-[#221612] to-[#0D131F]',
      text: 'text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500',
      tierLabel: 'BRONZE TIER'
    };
  };

  const getMiniMetrics = (attrs = []) => {
    const paceAttr = attrs.find((a) => a.attribute.includes('Pace'));
    const passAttr = attrs.find((a) => a.attribute.includes('Passing'));
    const dribAttr = attrs.find((a) => a.attribute.includes('Dribbling'));
    const physAttr = attrs.find((a) => a.attribute.includes('Physical'));

    const pace = paceAttr ? paceAttr.value : 75;
    const technique = passAttr && dribAttr ? Math.round((passAttr.value + dribAttr.value) / 2) : 75;
    const physical = physAttr ? physAttr.value : 75;

    return { pace, technique, physical };
  };

  const badgeStyle = getBadgeTierStyle(personal_info.overall_rating);
  const { pace, technique, physical } = getMiniMetrics(radar_attributes);
  const isReady = personal_info.evaluation_status === 'ready';

  return (
    <div className="rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-[#CCFF00]/50 transition-all duration-300 p-4 shadow-xl shadow-black/50 flex flex-col justify-between group hover:shadow-[0_0_20px_rgba(204,255,0,0.1)]">
      {/* Card Top: Avatar, OVR Badge, Name */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Athlete Portrait with Jersey Badge */}
          <div className="relative shrink-0">
            <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#090D16] border border-slate-700 group-hover:border-[#CCFF00]/60 transition-colors shadow-md flex items-center justify-center">
              {personal_info.photo_url ? (
                <img
                  src={personal_info.photo_url}
                  alt={personal_info.full_name || personal_info.nickname}
                  className="w-full h-full object-cover object-top filter contrast-105"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="font-athletic text-lg font-black text-slate-600">
                  #{personal_info.jersey_number ?? '-'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded bg-black/90 border border-[#CCFF00]/40 text-[9px] font-athletic font-bold text-[#CCFF00]">
              #{personal_info.jersey_number ?? '-'}
            </div>
          </div>

          {/* EA FC Style OVR Badge */}
          <div className={`p-2 rounded-xl border-2 ${badgeStyle.border} ${badgeStyle.bg} flex flex-col items-center justify-center min-w-[62px] text-center shadow-lg group-hover:scale-105 transition-transform`}>
            <span className="text-[7px] font-athletic font-bold uppercase tracking-wider text-slate-300">
              {badgeStyle.tierLabel.split(' ')[0]}
            </span>
            <span className={`font-athletic text-2xl font-black leading-none my-0.5 ${badgeStyle.text}`}>
              {personal_info.overall_rating}
            </span>
            <span className="font-athletic text-[9px] font-bold text-white uppercase tracking-wider">
              {personal_info.position.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Player Identity Information */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-athletic text-base font-bold text-white tracking-tight truncate group-hover:text-lime-200 transition-colors" title={personal_info.full_name}>
              {personal_info.full_name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="truncate">{personal_info.position}</span>
            <span>•</span>
            <span className="text-slate-300">{personal_info.age ? `${personal_info.age} thn` : 'Belum ada data'}</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>Kaki: <strong className="text-white">{personal_info.preferred_foot || 'Belum ada data'}</strong></span>
            <span>{personal_info.height_cm ? `${personal_info.height_cm} cm` : 'Belum ada data'}</span>
          </div>
        </div>

        {/* Monthly Evaluation Status Badge */}
        <div className="mt-3">
          {isReady ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>✓ Report Ready (Okt 2026)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
              <Clock className="w-3 h-3" />
              <span>⏳ Pending Evaluation</span>
            </span>
          )}
        </div>

        {/* Mini 3-Bar Metric Teaser */}
        <div className="mt-3 p-2.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-1.5">
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-slate-400">Pace (PAC)</span>
              <span className="font-athletic font-bold text-[#CCFF00]">{pace}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-lime-400 to-[#CCFF00] rounded-full"
                style={{ width: `${pace}%` }}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-slate-400">Technique (TEC)</span>
              <span className="font-athletic font-bold text-cyan-400">{technique}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full"
                style={{ width: `${technique}%` }}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-slate-400">Physical (PHY)</span>
              <span className="font-athletic font-bold text-amber-400">{physical}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                style={{ width: `${physical}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions: View Passport & Evaluate buttons */}
      <div className="mt-4 pt-3 border-t border-[#1F2937] grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onViewPassport(player_id)}
          className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#090D16] hover:bg-[#1F2937] border border-[#1F2937] hover:border-[#CCFF00]/50 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
        >
          <Eye className="w-3.5 h-3.5 text-[#CCFF00]" />
          <span>Passport</span>
        </button>

        <button
          type="button"
          onClick={() => onEvaluatePlayer(player_id)}
          className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
            userRole === 'coach'
              ? 'bg-[#CCFF00]/15 hover:bg-[#CCFF00]/25 border-[#CCFF00]/40 text-[#CCFF00]'
              : 'bg-[#090D16] border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200'
          }`}
          title={userRole === 'coach' ? 'Buka Form Evaluasi Pelatih' : 'Perlu PIN Akses Pelatih'}
        >
          {userRole === 'coach' ? (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Evaluasi</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Coach Only</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
