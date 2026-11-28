import React, { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { BrandMark } from './brand';
import { buildPassportSnapshotPayload, generatePassportHash } from '../lib/integrity';
import { fetchAcademyAccreditation } from '../lib/supabase';

export default function OfficialDossierFooter({ player, _onOpenStoryCard, onToast }) {
  const [computedHash, setComputedHash] = useState('');
  const [accreditation, setAccreditation] = useState(null);
  const [loadingHash, setLoadingHash] = useState(true);

  const { personal_info, player_id, public_id, ai_coach_evaluation, fitness_benchmarks } = player || {};
  const academy = personal_info?.academy;

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
          academy || {}
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

  const pId = public_id || player_id || '-';
  const regNumber = accreditation?.registration_number?.trim();
  const accBody = accreditation?.accreditation_body?.trim();
  const regText = regNumber
    ? (accBody ? `${accBody} · ${regNumber}` : regNumber)
    : (accBody || null);

  const handleCopyScoutSummary = () => {
    const summary = `=== DOSSIER PEMAIN MUDA BALLR ===
ID Paspor: ${pId}
Nama: ${personal_info?.full_name || personal_info?.nickname || '-'} (${personal_info?.nickname || '-'})
No. Punggung: #${personal_info?.jersey_number || '-'} | Posisi: ${personal_info?.position || '-'}
Kaki Utama: ${personal_info?.preferred_foot || '-'}
Akademi: ${academy?.name || '-'} (${academy?.city || '-'})
Versi Payload: v2
Hash Integritas SHA-256: ${computedHash || 'Menghitung...'}
Tautan Verifikasi: ${window.location.origin}/verifikasi/${computedHash}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }

    if (onToast) {
      onToast({
        title: 'Rangkuman paspor disalin',
        subtext: `Data paspor ${personal_info?.nickname || pId} siap diverifikasi.`
      });
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <footer className="space-y-4 pt-6 border-t border-line text-1">
      {/* Verification & Audit Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-line">
        <div>
          <h2 className="text-base font-semibold text-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <span>Verifikasi integritas dokumen</span>
          </h2>
          <p className="text-sm text-2">
            Jaminan kriptografis bahwa catatan profil, riwayat fisik, dan evaluasi pelatih belum dimodifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="whitespace-nowrap shrink-0">Payload v2</Badge>
          {regNumber && (
            <Badge variant="brand">
              Reg: {regNumber}
            </Badge>
          )}
        </div>
      </div>

      {/* Cryptographic Hash Details Card */}
      <div className="rounded-panel border border-line bg-panel p-4 space-y-3 print-avoid-break">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-sm text-2 block">ID publik atlet</span>
            <span className="font-mono font-semibold text-1">{pId}</span>
          </div>

          <div>
            <span className="text-sm text-2 block">Akademi penerbit</span>
            <span className="text-1 font-medium">{academy?.name || 'Belum ada data'}</span>
          </div>

          {regText && (
            <div>
              <span className="text-sm text-2 block">Status registrasi</span>
              <span className="text-1">{regText}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-line space-y-1">
          <span className="text-sm text-2 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>SHA-256 Canonical Hash (Laporan Terkunci):</span>
          </span>
          <div className="p-2.5 rounded-control bg-raised border border-line font-mono text-sm text-1 break-all select-all">
            {loadingHash ? 'Menghitung hash...' : computedHash}
          </div>
        </div>

        {/* Verification Link */}
        {computedHash && (
          <div className="pt-1 flex items-center justify-between text-sm">
            <Link
              to={`/verifikasi/${computedHash}`}
              className="text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>Verifikasi keaslian di <span className="font-mono">/verifikasi/{computedHash.slice(0, 12)}...</span></span>
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </div>

      {/* Interactive Actions - Hidden during Print */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrintDossier}
            icon={<Printer className="w-4 h-4" strokeWidth={1.5} />}
          >
            Cetak Dokumen (A4)
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopyScoutSummary}
            icon={<Copy className="w-4 h-4" strokeWidth={1.5} />}
          >
            Salin Rangkuman
          </Button>
        </div>
      </div>

      {/* Paged Media Footer (Visible during print) */}
      <div className="hidden print:flex items-center justify-between text-xs text-2 pt-3 border-t border-line">
        <div className="flex items-center gap-1.5">
          <BrandMark size={14} aria-hidden="true" />
          <span>ProspekBola Paspor · {personal_info?.full_name || personal_info?.nickname || pId} (<span className="font-mono">{pId}</span>)</span>
        </div>
        <span>Dokumen Pembinaan Sepak Bola Usia Muda</span>
      </div>
    </footer>
  );
}
