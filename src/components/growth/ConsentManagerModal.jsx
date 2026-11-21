import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, FileText } from 'lucide-react';
import { fetchPlayerConsents, revokeConsentAndSetPrivate } from '../../lib/supabase';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

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
        if (isMounted) {
          setConsents(list);
        }
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
  const hasConsentRecord = Boolean(activeConsent);
  const isRevoked = activeConsent ? Boolean(activeConsent.revoked_at) : false;

  const getPurposeStatus = (purposeKey) => {
    if (!hasConsentRecord) {
      return {
        badge: 'Belum ada persetujuan tercatat',
        variant: 'neutral',
        checked: false
      };
    }
    if (isRevoked) {
      return {
        badge: 'Dicabut',
        variant: 'warning',
        checked: false
      };
    }
    const isGranted = Boolean(
      activeConsent?.purposes?.[purposeKey] ||
      (purposeKey === 'training_analysis' && activeConsent?.purposes?.internal_analytics) ||
      (purposeKey === 'internal_analytics' && activeConsent?.purposes?.training_analysis)
    );
    if (isGranted) {
      return {
        badge: 'Diizinkan',
        variant: 'brand',
        checked: true
      };
    }
    return {
      badge: 'Tidak diizinkan',
      variant: 'neutral',
      checked: false
    };
  };

  const handleExecuteRevocation = async () => {
    setRevoking(true);
    try {
      await revokeConsentAndSetPrivate(playerId, activeConsent?.id);
      if (onToast) {
        onToast({
          title: 'Persetujuan dicabut',
          subtext: 'Visibilitas data atlet kini berstatus privat. Log akses telah dicatat.'
        });
      }
      if (onRevoked) onRevoked();
      onClose();
    } catch (err) {
      console.error('Gagal mencabut persetujuan:', err);
      if (onToast) {
        onToast({
          title: 'Gagal mencabut persetujuan',
          subtext: err.message || 'Terjadi kendala pada jaringan.'
        });
      }
    } finally {
      setRevoking(false);
    }
  };

  const purposeList = [
    {
      key: 'training_analysis',
      id: 'consent-purpose-training-analysis',
      title: '1. Analisis latihan & taktis internal',
      description: 'Pemrosesan performa untuk evaluasi latihan dan taktis akademi.'
    },
    {
      key: 'share_with_scouts',
      id: 'consent-purpose-share-scouts',
      title: '2. Berbagi ke pemandu bakat (scouts)',
      description: 'Pemberian akses data ke jejaring pemandu bakat terverifikasi.'
    },
    {
      key: 'public_profile',
      id: 'consent-purpose-public-profile',
      title: '3. Publikasi profil publik & media',
      description: 'Penayangan ringkasan paspor pada direktori publik.'
    }
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Tata kelola data pribadi anak"
      description="Persetujuan orang tua/wali (UU PDP No. 27/2022 Pasal 25)"
      className="max-w-md"
    >
      {/* Player and Visibility Metadata */}
      <div className="p-3 rounded-control bg-app border border-line text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2">Nama atlet:</span>
          <span className="font-semibold text-1">{pName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2">Tingkat visibilitas:</span>
          <span className="font-mono text-1 px-2 py-0.5 rounded-control bg-panel border border-control text-xs">
            {isRevoked ? 'private (privat)' : (player?.visibility_tier || 'private')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2">Versi persetujuan:</span>
          <span className="font-mono text-2">{activeConsent?.version || 'Belum ada'}</span>
        </div>
      </div>

      {/* Purpose Status Rows - Read Only (No Clickable Controls) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-1 block">
          Cakupan izin pemrosesan:
        </span>
        <div className="space-y-2 text-xs">
          {purposeList.map((item) => {
            const status = getPurposeStatus(item.key);
            return (
              <div
                key={item.key}
                data-testid={`purpose-row-${item.key}`}
                className="p-3 rounded-control bg-panel border border-line flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-1 block">{item.title}</span>
                  <span className="text-xs text-2 block mt-0.5">{item.description}</span>
                </div>
                <Badge variant={status.variant} size="sm" className="shrink-0">
                  {status.badge}
                </Badge>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-2 pt-2 border-t border-line">
          Pencatatan persetujuan oleh wali belum tersedia di versi ini
        </div>
      </div>

      {/* Revocation Warning and Action */}
      {hasConsentRecord && !isRevoked ? (
        <div className="pt-2 border-t border-line space-y-2">
          {!confirmRevoke ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setConfirmRevoke(true)}
              className="w-full text-xs"
              icon={<AlertTriangle className="w-4 h-4" strokeWidth={1.5} />}
            >
              Tarik persetujuan pemrosesan data
            </Button>
          ) : (
            <div className="p-3 rounded-control bg-danger/10 border border-danger/30 space-y-2 text-xs">
              <p className="font-semibold text-1">
                Konfirmasi penarikan persetujuan:
              </p>
              <p className="text-2 leading-relaxed">
                Data paspor {pName} akan seketika diubah menjadi status privat. Tautan publik dan pembagian ke pemandu bakat akan dinonaktifkan seketika. Tindakan ini dicatat di log audit peladen.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={revoking}
                  loading={revoking}
                  onClick={handleExecuteRevocation}
                  className="flex-1 text-xs"
                >
                  {revoking ? 'Mencabut...' : 'Ya, tarik sekarang'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmRevoke(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : isRevoked ? (
        <div className="p-3 rounded-control bg-warning/10 border border-warning/30 text-warning text-xs flex items-start gap-2">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="leading-snug text-1">
            Persetujuan telah ditarik. Data atlet berstatus privat dan tidak dapat dibagikan keluar tanpa persetujuan baru dari orang tua/wali.
          </p>
        </div>
      ) : null}

      {/* Footer Reference */}
      <div className="text-xs text-2 flex items-center justify-between pt-1 border-t border-line">
        <span>UU PDP No. 27/2022 Pasal 25</span>
        <a
          href="docs/CONSENT_DRAFT.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-2 hover:text-1 underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <FileText className="w-4 h-4" strokeWidth={1.5} />
          <span>Lihat draf perjanjian</span>
        </a>
      </div>
    </Dialog>
  );
}
