import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Flame,
  Zap,
  Loader2,
  ExternalLink
} from 'lucide-react';
import StoryCardCanvas from './story/StoryCardCanvas';

export default function StoryFlexCardModal({ player, onClose, onToast }) {
  const [theme, setTheme] = useState('volt');
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef(null);

  const { personal_info, radar_attributes, ai_coach_evaluation, player_id } = player;

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

  const endorsementQuote =
    ai_coach_evaluation?.strengths?.length > 0
      ? `${ai_coach_evaluation.strengths[0]} dan ${ai_coach_evaluation.strengths[1] || 'kreativitas tinggi'}.`
      : 'Visi bermain luar biasa dan pengambilan keputusan taktis matang.';

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
      pillBg: 'bg-black/60 border-amber-900/60',
      headerPill: 'bg-amber-400 text-black font-extrabold',
      activeTab: 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
    },
    stealth: {
      cardBg: 'from-[#0a0f1d] via-[#0b1329] to-[#020617]',
      cardBorder: 'border-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.25)]',
      aura: 'from-cyan-500/30 via-blue-600/10 to-transparent',
      accentColor: '#06B6D4',
      accentBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      ovrGradient: 'from-white via-cyan-100 to-cyan-400',
      ovrBadgeBorder: 'border-cyan-400',
      pillBg: 'bg-black/60 border-cyan-900/60',
      headerPill: 'bg-cyan-400 text-black font-extrabold',
      activeTab: 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
    }
  };

  const currentTheme = themeStyles[theme];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5
      });

      const link = document.createElement('a');
      link.download = `Story-Pass-${personal_info.full_name.replace(/\s+/g, '-')}-${theme.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();

      if (onToast) {
        onToast({
          title: "Kartu Story 9:16 Berhasil Diunduh! 📲",
          subtext: "Gambar HD tersimpan di perangkat Anda, siap diposting ke IG Stories."
        });
      }
    } catch (err) {
      console.error('Failed to export Story Card:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const text = `🔥 Cek Paspor Bakat Sepakbola Resmi: ${personal_info.full_name} (#${personal_info.jersey_number} ${personal_info.position}) - OVR ${personal_info.overall_rating} di Mataram Putra FA!\n\nLihat dossier lengkap: ${window.location.href}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    if (onToast) {
      onToast({
        title: "Tautan & Ringkasan Disalin! 📋",
        subtext: "Siap dibagikan ke WhatsApp Pelatih, Orang Tua, atau Pemandu Bakat."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#090D16] border border-[#1F2937] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[95vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <StoryCardCanvas
          cardRef={cardRef}
          currentTheme={currentTheme}
          personal_info={personal_info}
          topPillars={topPillars}
          endorsementQuote={endorsementQuote}
          player_id={player_id}
        />

        <div className="flex-1 w-full space-y-5">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-lime-500/15 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold uppercase tracking-wider mb-1">
              <Share2 className="w-3.5 h-3.5" />
              Social Flex Card Export
            </div>
            <h3 className="font-athletic text-2xl font-bold text-white tracking-tight">
              Export 9:16 Story Card
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Desain kartu atlet vertikal siap posting untuk Instagram Stories, WhatsApp Status, dan dossier scouting.
            </p>
          </div>

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
                <Zap className="w-3.5 h-3.5" />
                <span>Volt Neon</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('gold')}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-athletic font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  theme === 'gold'
                    ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-[#090D16] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Gold Elite</span>
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
                <span>⚡ Cyber Navy</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full min-h-[48px] rounded-2xl bg-[#CCFF00] hover:bg-lime-300 text-black font-athletic font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.3)] cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Merender Gambar HD (9:16)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Unduh Gambar Story HD (PNG)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full min-h-[44px] rounded-2xl bg-[#111827] hover:bg-[#1F2937] border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
            >
              <Copy className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Salin Teks Ringkasan & Link Paspor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
