import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  FileText,
  Copy,
  ExternalLink,
  CheckCircle2,
  Lock,
  Building2,
  Calendar,
  Award,
  Hash,
  X,
  PhoneCall,
  UserCheck
} from 'lucide-react';

export default function OfficialDossierFooter({ player, onOpenStoryCard, onToast }) {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const { personal_info, player_id } = player;

  // Cryptographic simulated SHA-256 hash for athlete data integrity
  const passportHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const pssiRegNumber = "PSSI-DIY/2026-0042-U13";
  const nisnNumber = "0134982103";
  const issuedDate = "28 Oktober 2026 • 16:45 WIB";

  const handleCopyScoutSummary = () => {
    const summary = `=== DOSSIER PEMAIN MUDA RESMI MPFA JOGJA ===
Nama: ${personal_info.full_name} (${personal_info.nickname})
No. Punggung: #${personal_info.jersey_number} | Posisi: ${personal_info.position}
Usia: ${personal_info.age} Thn | Tinggi/Berat: ${personal_info.height_cm} cm / ${personal_info.weight_kg} kg
Rating EA FC: ${personal_info.overall_rating} OVR | Kaki Utama: ${personal_info.preferred_foot}
No. Registrasi PSSI: ${pssiRegNumber}
Akademi: ${personal_info.academy.name} (${personal_info.academy.city})
Hash Integritas: ${passportHash.slice(0, 16)}...
Verifikasi: ${window.location.href}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }

    if (onToast) {
      onToast({
        title: "Rangkuman Scout Disalin! 📋",
        subtext: `Data resmi ${personal_info.full_name} siap dikirim ke direktur teknik / pemandu bakat.`
      });
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <>
      <footer className="mt-12 rounded-3xl bg-[#090D16] border-2 border-[#1F2937] p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Ambient background crest glow */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. KOP SURAT & AKREDITASI FEDERASI RESMI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#1F2937]/90">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#111827] border-2 border-[#84CC16] p-2 flex items-center justify-center shrink-0 shadow-lg">
              <img
                src={personal_info.academy.logo_url}
                alt={personal_info.academy.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-athletic font-extrabold uppercase tracking-wider bg-lime-500/15 text-[#CCFF00] px-2.5 py-0.5 rounded-full border border-[#CCFF00]/30">
                  Akreditasi Asprov PSSI DIY
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Reg: DIY/SSB-2024/048
                </span>
              </div>
              <h3 className="font-athletic text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                {personal_info.academy.name} — Yogyakarta
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Pusat Pembinaan Bakat Usia Muda • Stadion Mandala Krida, Yogyakarta
              </p>
            </div>
          </div>

          {/* Status Paspor Digital & Tombol Audit */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-black/70 border border-emerald-500/40 text-xs font-athletic font-bold text-emerald-400 flex items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>DOKUMEN TERVERIFIKASI & TERKUNCI</span>
            </div>

            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] border border-slate-700 text-slate-300 hover:text-white text-xs font-athletic font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lihat sertifikat audit verifikasi"
            >
              <Hash className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Audit Hash</span>
            </button>
          </div>
        </div>

        {/* 2. DUA TANDA TANGAN RESMI STAF TEKNIS (ACCREDITED SIGNATURE BLOCKS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          
          {/* Pejabat 1: Head Coach U-13 */}
          <div className="p-4 rounded-2xl bg-[#111827]/80 border border-[#1F2937] flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-athletic uppercase tracking-wider text-slate-400 font-bold">
                Penilai Teknis Lapangan
              </div>
              <div className="font-athletic text-sm font-extrabold text-white">
                Coach Hendro Kartiko
              </div>
              <div className="text-xs text-[#CCFF00] font-mono font-medium">
                Lisensi B AFC • Head Coach U-13
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SIGNED 28/10</span>
              </span>
            </div>
          </div>

          {/* Pejabat 2: Direktur Teknik Akademi */}
          <div className="p-4 rounded-2xl bg-[#111827]/80 border border-[#1F2937] flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-athletic uppercase tracking-wider text-slate-400 font-bold">
                Pengesahan Direktur Teknik
              </div>
              <div className="font-athletic text-sm font-extrabold text-white">
                Budi Santoso, S.Pd., M.Or.
              </div>
              <div className="text-xs text-cyan-400 font-mono font-medium">
                Lisensi A Pro AFC • Technical Director
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ACCREDITED</span>
              </span>
            </div>
          </div>

        </div>

        {/* 3. DOKUMEN IDENTITAS REGISTRASI FEDERASI */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">ID Paspor Bakat</span>
            <strong className="text-slate-200">{player_id}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">No. Reg PSSI DIY</span>
            <strong className="text-[#CCFF00]">{pssiRegNumber}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">NISN Resmi</span>
            <strong className="text-slate-200">{nisnNumber}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Tanggal Terbit</span>
            <span className="text-slate-300">{issuedDate.split('•')[0]}</span>
          </div>
        </div>

        {/* 4. TOMBOL TINDAKAN PEMANDU BAKAT & EKSPOR DOKUMEN */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDossier}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-lime-500 to-[#CCFF00] hover:from-lime-400 hover:to-lime-200 text-black font-athletic font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Cetak Dossier Resmi (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyScoutSummary}
              className="px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] border border-slate-700 text-slate-200 text-xs font-athletic font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>9:16 Story Card</span>
              </button>
            )}

            <a
              href="mailto:scouting@mpfa.id?subject=Inquiry%20Talenta%20Dimas%20Arya%20(WK-2026-0042)"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kontak Sekretariat</span>
            </a>
          </div>

        </div>

        {/* 5. DATA GOVERNANCE & FIFA PROTECTION OF MINORS DISCLAIMER */}
        <div className="pt-3 border-t border-[#1F2937]/70 text-[11px] text-slate-500 leading-relaxed space-y-1">
          <p>
            <strong>Pemberitahuan Perlindungan Data & Regulasi FIFA:</strong> Dokumen paspor bakat ini tunduk pada <em>FIFA Regulations on the Status and Transfer of Players (Article 19: Protection of Minors)</em> serta <em>Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022)</em> Republik Indonesia.
          </p>
          <p>
            Seluruh data biometrik, rekaman video pertandingan, dan evaluasi medis disimpan secara terenkripsi oleh Mataram Putra Football Academy. Penggunaan dokumen di luar kepentingan pemanduan bakat resmi berizin wajib memperoleh persetujuan tertulis dari orang tua/wali pemain dan direksi akademi.
          </p>
        </div>

      </footer>

      {/* POPUP MODAL: AUDIT VERIFICATION CERTIFICATE */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
          <div className="w-full max-w-lg rounded-3xl bg-[#111827] border-2 border-[#84CC16] p-5 sm:p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-lime-500/20 text-[#CCFF00]">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="font-athletic text-base sm:text-lg font-black text-white">
                    Sertifikat Integritas Paspor Bakat
                  </h4>
                  <p className="text-xs text-[#CCFF00] font-mono">
                    Audit Kriptografi & Registrasi Resmi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist Verifikasi Resmi */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Verifikasi Usia & Akta Kelahiran (Dukcapil DIY):</span>
                </div>
                <strong className="text-emerald-400 font-mono">VALID (13 Thn)</strong>
              </div>

              <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Medical Clearance Kardiovaskular & EKG:</span>
                </div>
                <strong className="text-emerald-400 font-mono">FIT TO PLAY</strong>
              </div>

              <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Status Registrasi Liga Super Muda PSSI DIY:</span>
                </div>
                <strong className="text-[#CCFF00] font-mono">ACTIVE SQUAD</strong>
              </div>

              <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">Training Compensation Status (FIFA Cat 4):</span>
                </div>
                <strong className="text-cyan-400 font-mono">PROTECTED</strong>
              </div>
            </div>

            {/* SHA-256 Hash Display */}
            <div className="p-3 rounded-xl bg-black/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">
                SHA-256 Cryptographic Record Hash:
              </span>
              <div className="font-mono text-[10px] text-slate-300 break-all select-all bg-slate-900/60 p-1.5 rounded">
                {passportHash}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-5 py-2 rounded-xl bg-[#CCFF00] hover:bg-lime-400 text-black font-athletic font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Tutup Sertifikat
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
