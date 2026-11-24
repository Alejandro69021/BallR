import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { verifyPassportHash, buildPassportSnapshotPayload, generatePassportHash } from '../lib/integrity';
import { fetchPassportSnapshot } from '../lib/supabase';
import Badge from './ui/Badge';
import Button from './ui/Button';
import SourceNote from './ui/SourceNote';

export default function VerificationView({ players = [] }) {
  const { hash } = useParams();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [snapshotData, setSnapshotData] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!hash) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Try fetching from Supabase passport_snapshots table
        const dbSnapshot = await fetchPassportSnapshot(hash);
        if (dbSnapshot && isMounted) {
          const verified = await verifyPassportHash(dbSnapshot.canonical_payload, dbSnapshot.snapshot_hash);
          if (verified) {
            setIsValid(true);
            setSnapshotData({
              public_id: dbSnapshot.canonical_payload?.public_id || 'PLAYER',
              academy_name: dbSnapshot.canonical_payload?.academy?.name || 'Akademi Sepakbola',
              period: dbSnapshot.period_month,
              created_at: dbSnapshot.created_at,
              payload: dbSnapshot.canonical_payload
            });
            setLoading(false);
            return;
          }
        }

        // 2. Fallback check: check current players in roster
        for (const player of players) {
          const payload = buildPassportSnapshotPayload(
            player,
            player.ai_coach_evaluation || {},
            player.fitness_benchmarks || {},
            player.personal_info?.academy || {}
          );
          const computed = await generatePassportHash(payload);
          if (computed.hash.toLowerCase() === hash.toLowerCase()) {
            if (isMounted) {
              setIsValid(true);
              setSnapshotData({
                public_id: player.public_id || player.player_id,
                academy_name: player.personal_info?.academy?.name || 'Akademi Sepakbola',
                period: player.ai_coach_evaluation?.period || 'Oktober 2026',
                created_at: new Date().toISOString(),
                payload
              });
              setLoading(false);
            }
            return;
          }
        }

        // Not found
        if (isMounted) {
          setIsValid(false);
          setSnapshotData(null);
        }
      } catch (err) {
        console.warn('Verifikasi gagal:', err);
        if (isMounted) setIsValid(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verify();
    return () => { isMounted = false; };
  }, [hash, players]);

  const handleCopyHash = () => {
    if (hash && navigator?.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto text-1 pb-12">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-2 hover:text-1 px-3 py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-1 rounded-control bg-panel border border-control transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>Kembali ke beranda</span>
        </Link>
      </div>

      {/* Technical Certificate */}
      <div className="rounded-panel bg-panel border border-line p-6 space-y-6">
        {/* Certificate Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-line">
          <div>
            <span className="text-sm font-mono text-2 uppercase tracking-wider block">
              Pemeriksa kriptografi paspor
            </span>
            <h1 className="text-xl font-semibold text-1 mt-1">
              Verifikasi Integritas Rekam Jejak Atlet
            </h1>
          </div>
          <div>
            {!loading && (
              isValid ? (
                <Badge variant="brand" size="md">
                  SHA-256 Valid
                </Badge>
              ) : (
                <Badge variant="danger" size="md">
                  Tidak ditemukan
                </Badge>
              )
            )}
          </div>
        </div>

        {/* Certificate Content */}
        {loading ? (
          <div className="p-8 text-center text-sm text-2 font-mono">
            Memeriksa hash kriptografis ke basis data laporan terkunci...
          </div>
        ) : isValid && snapshotData ? (
          <div className="space-y-5">
            {/* Certificate Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-control bg-app border border-line space-y-1">
                <span className="text-sm text-2 block">Akademi penerbit</span>
                <p className="text-sm font-semibold text-1">
                  {snapshotData.academy_name}
                </p>
              </div>

              <div className="p-3 rounded-control bg-app border border-line space-y-1">
                <span className="text-sm text-2 block">ID publik atlet</span>
                <p className="text-sm font-mono font-semibold text-1">
                  {snapshotData.public_id}
                </p>
              </div>

              <div className="p-3 rounded-control bg-app border border-line space-y-1">
                <span className="text-sm text-2 block">Periode laporan terkunci</span>
                <p className="text-sm font-semibold text-1">
                  {snapshotData.period}
                </p>
              </div>
            </div>

            {/* SHA-256 Hash with Copy Button */}
            <div className="p-3 rounded-control bg-app border border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-2 uppercase tracking-wide">
                  Hash SHA-256 kanonikal
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyHash}
                  className="sm:h-7 px-2 text-sm text-2 hover:text-1"
                  icon={copied ? <Check className="w-4 h-4 text-brand" strokeWidth={1.5} /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
                >
                  {copied ? 'Tersalin' : 'Salin hash'}
                </Button>
              </div>
              <p className="font-mono text-sm text-1 break-all select-all p-2 bg-panel rounded-control border border-line">
                {hash}
              </p>
            </div>

            {/* Source Note with Payload Version */}
            <SourceNote
              source="Snapshot paspor kanonikal (Laporan terkunci)"
              date={snapshotData.created_at ? new Date(snapshotData.created_at).toLocaleDateString('id-ID') : undefined}
              citationKey={`versi ${snapshotData.payload?.version || 'v1.0'}`}
            />

            {/* Collapsible Canonical Payload Inspector */}
            <div className="border border-line rounded-control overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPayload(!showPayload)}
                className="w-full flex items-center justify-between p-3 text-sm text-2 hover:text-1 hover:bg-raised transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span className="font-mono text-sm">Inspeksi data kanonikal terenkripsi</span>
                {showPayload ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} /> : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />}
              </button>
              {showPayload && (
                <div className="p-3 bg-app border-t border-line">
                  <pre className="text-sm font-mono text-1 overflow-x-auto p-2 bg-panel rounded-control border border-line max-h-60">
                    {JSON.stringify(snapshotData.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Invalid / Not Found State */
          <div className="space-y-4">
            <div className="p-4 rounded-control bg-danger/10 border border-danger/30 text-sm space-y-2">
              <p className="font-semibold text-sm text-1">Data Integritas Tidak Ditemukan</p>
              <p className="text-2 leading-relaxed">
                Hash <span className="font-mono text-1 break-all">{hash}</span> tidak cocok dengan rekam jejak resmi manapun di basis data integritas. Kemungkinan dokumen belum diterbitkan atau berkas telah mengalami perubahan setelah penerbitan.
              </p>
            </div>
            <SourceNote
              source="Sistem verifikasi kriptografi paspor"
              citationKey="tidak terverifikasi"
            />
          </div>
        )}

        {/* Certificate Guarantee Footer */}
        <div className="pt-4 border-t border-line text-sm text-2 leading-relaxed">
          Sistem hashing kanonikal BallR menjamin setiap metrik kebugaran, usia, dan evaluasi performa terkunci secara kriptografis dan tidak dapat diubah tanpa merusak validitas berkas.
        </div>
      </div>
    </div>
  );
}
