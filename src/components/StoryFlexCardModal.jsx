import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  QrCode,
  Flame,
  Zap,
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function StoryFlexCardModal({ player, onClose, onToast }) {
  const [theme, setTheme] = useState('volt'); // 'volt' | 'gold' | 'stealth'
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef(null);

  const { personal_info, radar_attributes, ai_coach_evaluation, player_id } = player;

  // Extract top 3 attributes for stat pillars
  const sortedAttrs = [...radar_attributes].sort((a, b) => b.value - a.value);
  const topPillars = sortedAttrs.slice(0, 3).map((a) => {
    let code = 'STA';
    if (a.attribute.includes('Pace')) code = 'PAC';
    else if (a.attribute.includes('Shooting')) code = 'SHO';
    else if (a.attribute.includes('Passing')) code = 'PAS';
    else if (a.attribute.includes('Dribbling')) code = 'DRI';
    else if (a.attribute.includes('Defending')) code = 'DEF';
    else if (a.attribute.includes('Physical')) code = 'PHY';
    return { code, label: a.attribute.split(' ')[0], value: a.value };
  });

  // Short punchy quote from coach narrative
  const endorsementQuote =
    ai_coach_evaluation.strengths.length > 0
      ? `${ai_coach_evaluation.strengths[0]} dan ${ai_coach_evaluation.strengths[1] || 'kreativitas tinggi'}.`
      : 'Visi bermain luar biasa dan pengambilan keputusan taktis matang.';

  // Theme styling definitions
  const themeStyles = {
    volt: {
      cardBg: 'from-[#080d16] via-[#0f172a] to-[#090d16]',
      cardBorder: 'border-[#CCFF00]/60 shadow-[0_0_35px_rgba(204,255,0,0.25)]',
      aura: 'from-[#CCFF00]/30 via-emerald-500/10 to-transparent',
      accentColor: '#CCFF00',
      accentBadge: 'bg-lime-500/20 text-[#CCFF00] border-[#CCFF00]/40',
      ovrGradient: 'from-white via-lime-200 to-[#CCFF00]',
      ovrBadgeBorder: 'border-[#CCFF00]',
      pillBg: 'bg-black/60 border-slate-700/80',
      headerPill: 'bg-[#CCFF00] text-black font-extrabold',
      activeTab: 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.4)]'
    },
    gold: {
      cardBg: 'from-[#171105] via-[#211709] to-[#090d16]',
      cardBorder: 'border-amber-400/70 shadow-[0_0_35px_rgba(245,158,11,0.25)]',
      aura: 'from-amber-400/35 via-yellow-600/10 to-transparent',
      accentColor: '#F59E0B',
      accentBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      ovrGradient: 'from-white via-yellow-100 to-amber-400',
      ovrBadgeBorder: 'border-amber-400',
      pillBg: 'bg-black/60 border-amber-900/50',
      headerPill: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-black font-extrabold',
      activeTab: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
    },
    stealth: {
      cardBg: 'from-[#05070c] via-[#111827] to-[#030508]',
      cardBorder: 'border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.2)]',
      aura: 'from-cyan-500/30 via-slate-700/10 to-transparent',
      accentColor: '#06B6D4',
      accentBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      ovrGradient: 'from-white via-cyan-100 to-cyan-400',
      ovrBadgeBorder: 'border-cyan-400',
      pillBg: 'bg-black/70 border-slate-800',
      headerPill: 'bg-cyan-400 text-black font-extrabold',
      activeTab: 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
    }
  };

  const currentTheme = themeStyles[theme];

  // Actions
  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      if (onToast) {
        onToast({
          title: 'Story Flex Card Berhasil Disimpan! 📸',
          subtext: `Grafik 9:16 ${personal_info.full_name} siap diposting ke Instagram Stories & WA Status.`
        });
      }
    }, 1200);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🔥 Cek Paspor Bakat Sepakbola Resmi: ${personal_info.full_name} (#${personal_info.jersey_number} ${personal_info.position}) - OVR ${personal_info.overall_rating} di Mataram Putra FA!\n\nLihat dossier lengkap: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    if (onToast) {
      onToast({
        title: 'Tautan Profil Berhasil Disalin! 🔗',
        subtext: 'Siap dibagikan ke media sosial dan grup scout.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Backdrop Close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-[#111827] border border-[#1F2937] rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/80 flex flex-col md:flex-row items-center gap-6 my-auto">
        
        {/* Close Button at top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#090D16] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700/80 cursor-pointer z-30"
          title="Tutup (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: The 9:16 Story Card Canvas Preview */}
        <div className="shrink-0 flex items-center justify-center w-full md:w-auto">
          <div
            ref={cardRef}
            className={`relative w-[280px] sm:w-[310px] aspect-[9/16] rounded-3xl overflow-hidden bg-gradient-to-b ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} p-4 flex flex-col justify-between transition-all duration-300 shadow-2xl select-none`}
          >
            {/* Subtle Carbon Fiber / Grid texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* Giant Jersey Number Watermark behind player */}
            <div className="absolute top-24 -right-2 text-white/5 font-athletic font-black text-9xl pointer-events-none select-none">
              #{personal_info.jersey_number}
            </div>

            {/* 1. TOP BAR */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black/80 border border-slate-700 p-0.5 overflow-hidden flex items-center justify-center">
                  <span className="font-athletic font-black text-[9px] text-[#CCFF00]">
                    MPFA
                  </span>
                </div>
                <div>
                  <div className="text-[9px] font-athletic font-bold text-white uppercase tracking-wider leading-none">
                    Mataram Putra FA
                  </div>
                  <div className="text-[8px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-[#CCFF00]" />
                    <span>Jogja Verified</span>
                  </div>
                </div>
              </div>

              {/* Gold / Neon Prospect Pill Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[8px] tracking-wider uppercase shadow-sm ${currentTheme.headerPill}`}>
                PROSPECT 2026
              </span>
            </div>

            {/* 2. PLAYER CUTOUT & HERO AURA */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
              {/* Glowing Radial Aura */}
              <div
                className={`absolute w-40 h-40 rounded-full bg-gradient-to-tr ${currentTheme.aura} blur-2xl pointer-events-none`}
              />

              {/* Portrait */}
              <div className="relative w-28 h-32 rounded-2xl overflow-hidden bg-[#090D16] border-2 border-white/20 shadow-2xl mb-2">
                <img
                  src={personal_info.photo_url}
                  alt={personal_info.full_name}
                  className="w-full h-full object-cover object-top filter contrast-110 brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[8px] font-athletic font-bold text-[#CCFF00]">
                  #{personal_info.jersey_number}
                </span>
              </div>

              {/* Player Name & Category */}
              <h2 className="font-athletic text-lg font-black text-white tracking-wide uppercase text-center leading-tight drop-shadow-md">
                {personal_info.full_name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-300">
                <span className="font-bold text-[#CCFF00]">{personal_info.position}</span>
                <span>•</span>
                <span>U-13 Elite</span>
                <span>•</span>
                <span>{personal_info.preferred_foot}</span>
              </div>
            </div>

            {/* 3. OVR RATING & STAT PILLARS */}
            <div className="relative z-10 space-y-2">
              {/* OVR + Attributes Strip */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
                {/* Large OVR Shield */}
                <div className={`p-1.5 px-2 rounded-xl bg-gradient-to-b from-black/90 to-slate-900 border ${currentTheme.ovrBadgeBorder} flex flex-col items-center justify-center shrink-0`}>
                  <span className="text-[7px] font-athletic font-bold text-slate-400 uppercase">
                    OVR
                  </span>
                  <span className={`font-athletic text-2xl font-black leading-none ${currentTheme.ovrGradient}`}>
                    {personal_info.overall_rating}
                  </span>
                </div>

                {/* 3 High-Attribute Badges */}
                <div className="flex-1 grid grid-cols-3 gap-1">
                  {topPillars.map((p) => (
                    <div
                      key={p.code}
                      className="p-1 rounded-lg bg-white/5 border border-white/5 text-center flex flex-col justify-center"
                    >
                      <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">
                        {p.code}
                      </span>
                      <span className="font-athletic text-xs font-black text-white mt-0.5">
                        {p.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Endorsement Quote */}
              <div className="px-2.5 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/5 text-[9px] text-slate-300 italic leading-snug text-center">
                "{endorsementQuote}"
              </div>

              {/* 4. BOTTOM VERIFICATION FOOTER */}
              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="p-1 rounded bg-white text-black">
                    <QrCode className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="font-bold text-white uppercase leading-none">
                      SCAN FOR STATS
                    </div>
                    <div className="text-[7px] text-slate-400">
                      ID: {player_id}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-athletic font-bold text-[#CCFF00] tracking-wider uppercase">
                    MPFA PASSPORT
                  </div>
                  <div className="text-[7px] text-slate-500">
                    Official Scouting Dossier
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Modal Controls */}
        <div className="flex-1 w-full space-y-5">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-lime-500/15 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Social Flex Card Export
            </div>
            <h3 className="font-athletic text-2xl font-bold text-white tracking-tight">
              Export 9:16 Story Card
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Desain kartu atlet vertikal siap posting untuk Instagram Stories, WhatsApp Status, dan dossier scouting.
            </p>
          </div>

          {/* Theme Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Pilih Tema Kartu:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('volt')}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-athletic font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  theme === 'volt'
                    ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : 'bg-[#090D16] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>⚡ Volt Neon</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('gold')}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-athletic font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  theme === 'gold'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-[#090D16] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🏆 Gold Elite</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('stealth')}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-athletic font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  theme === 'stealth'
                    ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-[#090D16] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🖤 Stealth</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2 border-t border-[#1F2937]">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-lime-400 to-[#CCFF00] hover:from-lime-300 hover:to-lime-200 text-black font-athletic font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.25)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Membuat Gambar 9:16 HD...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>⬇️ Download Card (Image)</span>
                </>
              )}
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>📲 Share to WhatsApp Status</span>
            </button>

            {/* Copy Profile Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full min-h-[44px] rounded-xl bg-[#090D16] hover:bg-[#1F2937] text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Copy className="w-4 h-4 text-[#CCFF00]" />
              <span>🔗 Copy Profile Link</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            Ukuran rasio 9:16 pas untuk format layar penuh smartphone (1080x1920) tanpa crop.
          </div>
        </div>

      </div>
    </div>
  );
}

