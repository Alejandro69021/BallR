import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  Copy,
  ExternalLink,
  CheckCircle2,
  Lock,
  Hash,
  X,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildPassportSnapshotPayload, generatePassportHash } from '../lib/integrity';
import { fetchAcademyAccreditation } from '../lib/supabase';

export default function OfficialDossierFooter({ player, onOpenStoryCard, onToast }) {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [computedHash, setComputedHash] = useState('');
  const [accreditation, setAccreditation] = useState(null);
  const [loadingHash, setLoadingHash] = useState(true);

  const { personal_info, player_id, public_id, ai_coach_evaluation, fitness_benchmarks } = player || {};
  const academy = personal_info?.academy || {};

  // Compute real canonical SHA-256 hash
  useEffect(() => {
    let isMounted = true;
    async function calculateHash() {
      try {
        setLoadingHash(true);
        const payload = buildPassportSnapshotPayload(
          player,
          ai_coach_evaluation || {},
          fitness_benchmarks || {},
          academy
        );
        const { hash } = await generatePassportHash(payload);
        if (isMounted) {
          setComputedHash(hash);
        }
      } catch (err) {
        console.warn('Gagal menghitung hash paspor:', err);
      } finally {
        if (isMounted) setLoadingHash(false);
      }
    }

    calculateHash();
    return () => { isMounted = false; };
  }, [player, ai_coach_evaluation, fitness_benchmarks, academy]);

  // Fetch real federation accreditation if present
  useEffect(() => {
    let isMounted = true;
    async function checkAccreditation() {
      if (academy?.id) {
        const acc = await fetchAcademyAccreditation(academy.id);
        if (isMounted) setAccreditation(acc);
      }
    }
    checkAccreditation();
    return () => { isMounted = false; };
  }, [academy?.id]);

  const pId = public_id || player_id || 'PLAYER';
  const issuedDate = ai_coach_evaluation?.period || 'Oktober 2026';

  const handleCopyScoutSummary = () => {
    const summary = `=== DOSSIER PEMAIN MUDA BALLR ===
ID Paspor: ${pId}
Nama Panggilan: ${personal_info?.nickname || 'Atlet'}
No. Punggung: #${personal_info?.jersey_number || '-'} | Posisi: ${personal_info?.position || '-'}
Rating OVR: ${personal_info?.overall_rating || 75} | Kaki Utama: ${personal_info?.preferred_foot || '-'}
Akademi: ${academy?.name || 'Akademi Sepakbola'} (${academy?.city || 'Indonesia'})
Hash Integritas: ${computedHash ? computedHash.slice(0, 16) + '...' : 'Menghitung...'}
Tautan Verifikasi: ${window.location.origin}/verifikasi/${computedHash}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }

    if (onToast) {
      onToast({
        title: "Rangkuman Scout Disalin",
        subtext: `Data paspor ${personal_info?.nickname || 'atlet'} siap diverifikasi.`
      });
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <>
      <footer className="mt-8 rounded-lg bg-[#0C111D] border border-slate-800 p-5 space-y-5 text-white">
        
        {/* 1. KOP SURAT AKADEMI & STATUS AKREDITASI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shrink-0">
              {academy?.logo_url ? (
                <img
                  src={academy.logo_url}
                  alt={academy.name || 'Akademi'}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="text-xs font-mono font-bold text-slate-400">FA</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {accreditation?.registration_number ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {accreditation.accreditation_body} • {accreditation.registration_number}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Akademi Terdaftar
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {academy?.name || 'Akademi Sepakbola'} — {academy?.city || 'Indonesia'}
              </h3>
            </div>
          </div>

          {/* Status Paspor Digital & Tombol Audit */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            {accreditation ? (
              <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terakreditasi Resmi</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lihat sertifikat integritas SHA-256"
            >
              <Hash className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Integritas Hash</span>
            </button>
          </div>
        </div>

        {/* 2. DOKUMEN IDENTITAS REGISTRASI & HASH */}
        <div className="p-3 rounded bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">ID Paspor</span>
            <strong className="text-slate-200">{pId}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Kelompok Usia</span>
            <strong className="text-[#CCFF00]">{player?.age_group || 'U-13'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Periode Evaluasi</span>
            <span className="text-slate-300">{issuedDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Kriptografi</span>
            <span className="text-slate-400 truncate block">
              {loadingHash ? 'Menghitung...' : `${computedHash.slice(0, 10)}...`}
            </span>
          </div>
        </div>

        {/* 3. TOMBOL TINDAKAN PEMANDU BAKAT & EKSPOR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDossier}
              className="px-3 py-1.5 rounded bg-[#CCFF00] hover:bg-[#b8e600] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cetak Dokumen (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyScoutSummary}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Salin Rangkuman Scout</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenStoryCard && (
              <button
                type="button"
                onClick={onOpenStoryCard}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Story Card (9:16)
              </button>
            )}

            {computedHash && (
              <Link
                to={`/verifikasi/${computedHash}`}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>Laman Verifikasi</span>
              </Link>
            )}
          </div>
        </div>

        {/* 4. DATA GOVERNANCE DISCLAIMER */}
        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>Perlindungan data atlet mengacu pada UU No. 27 Tahun 2022 (UU PDP).</span>
          <span className="font-mono text-slate-400">ID: {pId}</span>
        </div>
      </footer>

      {/* POPUP MODAL: AUDIT VERIFICATION CERTIFICATE */}
      {showAuditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-lg bg-[#0C111D] border border-slate-800 p-5 space-y-4 text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-slate-800 text-[#CCFF00]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Integritas Kriptografis Paspor
                  </h4>
                  <p className="text-xs text-slate-400">
                    Standar SHA-256 anti-manipulasi data atlet
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SHA-256 Hash Display */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Hash Kanonikal SHA-256:
              </span>
              <div className="font-mono text-xs text-[#CCFF00] break-all select-all bg-slate-900 p-2 rounded border border-slate-800">
                {computedHash || 'Menghitung hash...'}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Hash ini dihitung secara deterministik dari data evaluasi taktis, metrik kebugaran, dan identitas paspor resmi.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                to={`/verifikasi/${computedHash}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#CCFF00] hover:underline font-medium"
              >
                <span>Buka validator publik</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
