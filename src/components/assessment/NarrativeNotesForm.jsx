import React from 'react';
import { BrainCircuit, Send, Loader2 } from 'lucide-react';

export default function NarrativeNotesForm({
  formData,
  setFormData,
  isGeneratingAI,
  onGenerateAI
}) {
  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#CCFF00]" />
          <div>
            <h3 className="font-athletic text-base sm:text-lg font-bold text-white tracking-tight">
              AI Coach Narrative Generator
            </h3>
            <p className="text-xs text-slate-400">
              Ubah catatan kasar pelatih menjadi laporan evaluasi taktis formal
            </p>
          </div>
        </div>

        <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 self-start sm:self-auto">
          AFC/UEFA Scouting Standard
        </span>
      </div>

      {/* Raw coach notes textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">
          Catatan Kasar Lapangan (Raw Coach Observations):
        </label>
        <textarea
          rows="3"
          value={formData.rawNotes}
          onChange={(e) => setFormData((prev) => ({ ...prev, rawNotes: e.target.value }))}
          className="w-full p-3 rounded-xl bg-[#090D16] border border-slate-700 focus:border-[#CCFF00] text-xs sm:text-sm text-slate-200 outline-none leading-relaxed transition-colors min-h-[80px]"
          placeholder="Contoh: Sentuhan pertama makin rapi, tapi masih gampang hilang posisi pas diserang balik."
        />
      </div>

      {/* Action Button: Generate AI Narrative */}
      <button
        type="button"
        onClick={onGenerateAI}
        disabled={isGeneratingAI}
        className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-lime-400 to-[#CCFF00] hover:from-lime-300 hover:to-lime-200 text-black font-athletic font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.25)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
      >
        {isGeneratingAI ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Memproses Log Taktis & Analisis AI...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4 text-black" />
            <span>Generate Technical Narrative</span>
          </>
        )}
      </button>

      {/* Auto-populated Result Card */}
      <div className="p-4 rounded-xl bg-[#090D16]/80 border border-slate-800 space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Hasil Narasi Formal AI:
          </span>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic bg-[#111827]/70 p-3 rounded-lg border border-slate-800">
            "{formData.narrative}"
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1.5">
              Top Strengths (3 Chips):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formData.strengths.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                >
                  + {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
              Focus Growth Areas (2 Chips):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formData.growthAreas.map((g, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                >
                  ▲ {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Recommended Homework Drill:
            </span>
            <span className="font-athletic text-xs font-bold text-[#CCFF00]">
              {formData.drillTitle}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {formData.drillDuration}
          </span>
        </div>
      </div>
    </section>
  );
}
