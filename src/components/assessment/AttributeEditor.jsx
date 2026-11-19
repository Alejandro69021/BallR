import React from 'react';
import { RotateCcw, Minus, Plus, Database } from 'lucide-react';

export default function AttributeEditor({
  formData,
  calculatedOvr,
  activePlayer,
  onAttributeChange,
  onAttributeSlider,
  onResetAttributes
}) {
  const getScoreBadgeClass = (score) => {
    if (score >= 85) return 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/40';
    if (score >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <>
      {/* Live OVR Banner for Evaluated Player */}
      <div className="rounded-xl bg-gradient-to-r from-[#172033] via-[#111827] to-[#172033] border border-[#1F2937] p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#090D16] border-2 border-[#CCFF00] flex flex-col items-center justify-center shadow-lg">
            <span className="text-[8px] font-athletic font-bold text-slate-400 uppercase">
              OVR
            </span>
            <span className="font-athletic text-lg font-black text-[#CCFF00] leading-none">
              {calculatedOvr}
            </span>
          </div>

          <div>
            <h3 className="font-athletic text-sm sm:text-base font-bold text-white">
              {activePlayer.personal_info.full_name}
            </h3>
            <p className="text-[11px] text-slate-400">
              #{activePlayer.personal_info.jersey_number} • {activePlayer.personal_info.position}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-lime-500/15 text-[#CCFF00] border border-[#CCFF00]/30">
            <Database className="w-3 h-3" />
            <span>Supabase Sync Active</span>
          </span>
          <p className="text-[10px] text-slate-400 mt-1">
            Min touch height 44px
          </p>
        </div>
      </div>

      {/* 3. Quick Attribute Scorer (6 Core Football Attributes) */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
          <div>
            <h3 className="font-athletic text-base sm:text-lg font-bold text-white tracking-tight">
              Scoring 6 Atribut Kunci Sepakbola
            </h3>
            <p className="text-xs text-slate-400">
              Gunakan tombol stepper (- / +) atau slider sentuh
            </p>
          </div>

          <button
            type="button"
            onClick={onResetAttributes}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded bg-[#090D16] border border-[#1F2937] transition-colors cursor-pointer"
            title="Reset atribut ke nilai awal"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {formData.attributes.map((attr, index) => {
            const badgeClass = getScoreBadgeClass(attr.value);

            return (
              <div
                key={attr.attribute}
                className="p-3 rounded-xl bg-[#090D16]/70 border border-[#1F2937] space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-athletic text-xs sm:text-sm font-bold text-white truncate max-w-[170px]">
                    {attr.attribute}
                  </span>

                  <div className={`px-2.5 py-0.5 rounded-lg text-xs font-athletic font-extrabold border ${badgeClass} shadow-sm`}>
                    {attr.value}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onAttributeChange(index, -1)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[#1F2937] hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-base transition-all border border-slate-700 cursor-pointer shadow-sm"
                    aria-label={`Kurangi ${attr.attribute}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={attr.value}
                    onChange={(e) => onAttributeSlider(index, e.target.value)}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#CCFF00] min-h-[36px]"
                  />

                  <button
                    type="button"
                    onClick={() => onAttributeChange(index, 1)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[#1F2937] hover:bg-[#CCFF00] hover:text-black active:scale-95 text-white flex items-center justify-center font-bold text-base transition-all border border-slate-700 cursor-pointer shadow-sm"
                    aria-label={`Tambah ${attr.attribute}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
