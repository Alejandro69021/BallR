import React, { useState, useEffect } from 'react';
import { ShieldCheck, Hash, ArrowLeft, CheckCircle2, Lock, Building2, Calendar, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { verifyPassportHash, buildPassportSnapshotPayload, generatePassportHash } from '../lib/integrity';
import { fetchPassportSnapshot } from '../lib/supabase';

export default function VerificationView({ players = [] }) {
  const { hash } = useParams();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [snapshotData, setSnapshotData] = useState(null);
  const [showPayload, setShowPayload] = useState(false);

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

  return (
    <div className="space-y-4 max-w-2xl mx-auto text-white pb-12">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-[#0C111D] border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="rounded-lg bg-[#0C111D] border border-slate-800 p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className={`p-2.5 rounded border ${
            isValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Pemeriksa Kriptografi Paspor
              </span>
              {!loading && (
                <span className={`text-xs font-mono font-semibold flex items-center gap-1 ${
                  isValid ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SHA-256 Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Tidak Terverifikasi</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <h1 className="text-base font-semibold text-white mt-0.5">
              Verifikasi Integritas Rekam Jejak Atlet
            </h1>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400 font-mono">
            Memeriksa hash kriptografis ke basis data snapshot...
          </div>
        ) : isValid && snapshotData ? (
          /* Valid State */
          <div className="space-y-4">
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-[#CCFF00]" />
                Hash Kriptografis (SHA-256)
              </span>
              <div className="text-[#CCFF00] font-mono text-xs break-all bg-slate-900 p-2 rounded border border-slate-800">
                {hash}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Penerbit / Akademi
                </span>
                <div className="font-sans font-semibold text-white">
                  {snapshotData.academy_name}
                </div>
                <div className="text-[11px] text-slate-400">
                  ID Paspor: {snapshotData.public_id}
                </div>
              </div>

              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Periode & Verifikasi
                </span>
                <div className="font-sans font-semibold text-white">
                  {snapshotData.period}
                </div>
                <div className="text-[11px] text-emerald-400">
                  Status: Terverifikasi Otentik
                </div>
              </div>
            </div>

            {/* Collapsible Canonical Payload Inspector */}
            <div className="border border-slate-800 rounded">
              <button
                type="button"
                onClick={() => setShowPayload(!showPayload)}
                className="w-full flex items-center justify-between p-2.5 text-xs text-slate-300 hover:bg-slate-900 transition-colors"
              >
                <span className="font-mono text-[11px]">Inspeksi Data Kanonikal Terenkripsi</span>
                {showPayload ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showPayload && (
                <div className="p-3 bg-slate-950 border-t border-slate-800">
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded max-h-60">
                    {JSON.stringify(snapshotData.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Invalid / Not Found State */
          <div className="p-4 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <p className="font-semibold text-white">Data Integritas Tidak Ditemukan</p>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Hash <code className="text-rose-200 font-mono break-all">{hash}</code> tidak cocok dengan rekaman resmi manapun di basis data integritas. Kemungkinan dokumen belum diterbitkan, atau isi berkas telah mengalami perubahan setelah penerbitan.
            </p>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
          <Lock className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Sistem hashing kanonikal BallR menjamin bahwa setiap angka kebugaran, usia, dan evaluasi taktis tidak dapat diubah tanpa merusak validitas hash.
          </p>
        </div>
      </div>
    </div>
  );
}
