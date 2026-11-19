import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, X, AlertTriangle, Lock, FileText } from 'lucide-react';
import { fetchPlayerConsents, revokeConsentAndSetPrivate } from '../../lib/supabase';

export default function ConsentManagerModal({
  isOpen,
  onClose,
  player,
  onRevoked,
  onToast
}) {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const playerId = player?.player_id || player?.id;
  const pName = player?.personal_info?.nickname || player?.personal_info?.full_name || 'Atlet';

  useEffect(() => {
    let isMounted = true;
    async function loadConsents() {
      if (!playerId) return;
      setLoading(true);
      try {
        const list = await fetchPlayerConsents(playerId);
        if (isMounted) setConsents(list);
      } catch (err) {
        console.warn('Gagal memuat persetujuan:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (isOpen) {
      loadConsents();
      setConfirmRevoke(false);
    }
    return () => { isMounted = false; };
  }, [isOpen, playerId]);

  if (!isOpen) return null;

  const activeConsent = consents.find((c) => !c.revoked_at) || consents[0] || null;
  const isRevoked = activeConsent ? Boolean(activeConsent.revoked_at) : false;

  const handleExecuteRevocation = async () => {
    setRevoking(true);
    try {
      await revokeConsentAndSetPrivate(playerId, activeConsent?.id);
      if (onToast) {
        onToast({
          title: "Persetujuan Dicabut",
          subtext: "Visibilitas data atlet kini berstatus Privat. Log akses telah dicatat."
        });
      }
      if (onRevoked) onRevoked();
      onClose();
    } catch (err) {
      console.error('Gagal mencabut persetujuan:', err);
      if (onToast) {
        onToast({
          title: "Gagal Mencabut Persetujuan",
          subtext: err.message || "Terjadi kendala pada jaringan."
        });
      }
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-[#0C111D] border border-slate-800 rounded-lg p-5 text-white z-10 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-800 text-slate-200">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 id="consent-modal-title" className="text-sm font-semibold text-white">
                Tata Kelola Data Pribadi Anak
              </h2>
              <p className="text-xs text-slate-400">
                Persetujuan Orang Tua/Wali (UU PDP No. 27/2022 Pasal 25)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player & Visibility Info */}
        <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Atlet:</span>
            <span className="font-semibold text-white">{pName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tingkat Visibilitas:</span>
            <span className="font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
              {isRevoked ? 'private (Privat)' : (player?.visibility_tier || 'private')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Versi Persetujuan:</span>
            <span className="font-mono text-slate-400">{activeConsent?.version || 'v1.0-2026-10'}</span>
          </div>
        </div>

        {/* Purposes Checklist */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-300 block">
            Cakupan Izin Pemrosesan:
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">1. Analisis Latihan & Taktis Internal</span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">Aktif</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">2. Berbagi ke Pemandu Bakat (Scouts)</span>
              <span className={`text-[11px] font-mono font-semibold ${
                activeConsent?.purposes?.share_with_scouts && !isRevoked ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {activeConsent?.purposes?.share_with_scouts && !isRevoked ? 'Diizinkan' : 'Terkunci'}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">3. Publikasi Profil Publik & Media</span>
              <span className={`text-[11px] font-mono font-semibold ${
                activeConsent?.purposes?.public_profile && !isRevoked ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {activeConsent?.purposes?.public_profile && !isRevoked ? 'Diizinkan' : 'Terkunci'}
              </span>
            </div>
          </div>
        </div>

        {/* Revocation Warning & Action */}
        {!isRevoked ? (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            {!confirmRevoke ? (
              <button
                type="button"
                onClick={() => setConfirmRevoke(true)}
                className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Tarik Persetujuan Pemrosesan Data</span>
              </button>
            ) : (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 space-y-2 text-xs">
                <p className="text-rose-200 font-medium">
                  Konfirmasi Penarikan Persetujuan:
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Data paspor {pName} akan seketika diubah menjadi status privat. Tautan publik dan pembagian ke pemandu bakat akan dinonaktifkan seketika. Tindakan ini dicatat di log audit peladen.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={revoking}
                    onClick={handleExecuteRevocation}
                    className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {revoking ? 'Mencabut...' : 'Ya, Tarik Sekarang'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRevoke(false)}
                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Persetujuan telah ditarik. Data atlet berstatus privat dan tidak dapat dibagikan keluar tanpa persetujuan baru dari orang tua/wali.
            </p>
          </div>
        )}

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800">
          <span>UU PDP No. 27/2022 Pasal 25</span>
          <a
            href="docs/CONSENT_DRAFT.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-300 underline flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>Lihat Draf Perjanjian</span>
          </a>
        </div>
      </div>
    </div>
  );
}
