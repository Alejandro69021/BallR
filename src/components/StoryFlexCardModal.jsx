import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { Download, Copy, AlertCircle } from 'lucide-react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import { fetchPlayerConsents } from '../lib/supabase';
import { canShareProgressCard, buildCardDownloadFilename, getShareBlockReason } from '../lib/consent';
import StoryCardCanvas, { formatPlayerName } from './story/StoryCardCanvas';

export default function StoryFlexCardModal({
  player,
  onClose,
  onToast,
  isOpen = true
}) {
  const [consents, setConsents] = useState([]);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef(null);

  const playerId = player?.player_id || player?.id || player?.public_id;

  const isPrivate = Boolean(
    player?.visibility_tier === 'private' ||
    player?.is_private ||
    player?.personal_info?.visibility_tier === 'private'
  );

  useEffect(() => {
    let active = true;
    async function loadConsents() {
      if (!playerId) {
        setLoadingConsents(false);
        return;
      }
      setLoadingConsents(true);
      try {
        const list = await fetchPlayerConsents(playerId);
        if (active) {
          setConsents(list || []);
        }
      } catch {
        if (active) setConsents([]);
      } finally {
        if (active) setLoadingConsents(false);
      }
    }

    if (isOpen) {
      loadConsents();
    }
    return () => {
      active = false;
    };
  }, [isOpen, playerId]);

  const canShare = canShareProgressCard(consents);
  const blockReason = getShareBlockReason(consents);

  const latestConsent = useMemo(() => {
    if (!consents || consents.length === 0) return null;
    return [...consents].sort((a, b) => {
      const timeA = a?.granted_at ? new Date(a.granted_at).getTime() : 0;
      const timeB = b?.granted_at ? new Date(b.granted_at).getTime() : 0;
      return timeB - timeA;
    })[0];
  }, [consents]);

  const handleDownload = async () => {
    if (!cardRef.current || !canShare) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2
      });

      const rawName = player?.personal_info?.full_name;
      const displayName = formatPlayerName(rawName, isPrivate);
      const downloadFilename = buildCardDownloadFilename(displayName);

      const link = document.createElement('a');
      link.download = downloadFilename;
      link.href = dataUrl;
      link.click();

      onToast?.({
        title: 'Kartu perkembangan berhasil diunduh',
        subtext: 'Gambar tersimpan di perangkat Anda.'
      });
    } catch (err) {
      console.error('Gagal mengekspor kartu perkembangan:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySummary = () => {
    if (!canShare) return;

    const rawName = player?.personal_info?.full_name;
    const name = formatPlayerName(rawName, isPrivate);
    const pos = player?.personal_info?.position || 'Belum ada data';
    const text = `Kartu Perkembangan: ${name} (${pos}) - Data resmi tersimpan di paspor.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    onToast?.({
      title: 'Teks ringkasan disalin',
      subtext: 'Ringkasan siap dibagikan.'
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Kartu Perkembangan"
      description="Ringkasan data terverifikasi atlet untuk pemantauan perkembangan."
      className="max-w-md"
      footer={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="space-y-4">
        {!loadingConsents && !canShare && (
          <div
            data-testid="consent-warning"
            className="p-3 rounded-control border border-warning/40 bg-warning/10 text-warning text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold">
                Butuh persetujuan wali yang tercatat untuk membagikan kartu
              </div>
              <div className="text-warning/90">
                {blockReason === 'none' && 'Belum ada persetujuan wali yang tercatat'}
                {blockReason === 'revoked' && (
                  `Persetujuan wali dicabut pada ${
                    latestConsent?.revoked_at
                      ? new Date(latestConsent.revoked_at).toLocaleDateString('id-ID')
                      : 'tanggal yang tercatat'
                  }`
                )}
                {blockReason === 'no_public_profile' && (
                  'Persetujuan wali yang tercatat belum mencakup berbagi profil'
                )}
              </div>
            </div>
          </div>
        )}

        {/* Staff identifier shown outside exported canvas */}
        {playerId && (
          <div className="text-right text-xs text-2 font-mono">
            ID Atlet: {playerId}
          </div>
        )}

        <StoryCardCanvas
          cardRef={cardRef}
          player={player}
          isPrivate={isPrivate}
        />

        <div className="space-y-2 pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              disabled={!canShare || isExporting}
              loading={isExporting}
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
              className="flex-1"
            >
              Unduh Gambar (PNG)
            </Button>

            <Button
              variant="secondary"
              disabled={!canShare}
              onClick={handleCopySummary}
              icon={<Copy className="w-4 h-4" />}
              className="flex-1"
            >
              Salin Ringkasan
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
