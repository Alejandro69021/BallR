import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Sparkles,
  Save,
  Send,
  Plus,
  Minus,
  RotateCcw,
  Flame,
  Zap,
  Timer,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Loader2,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Camera,
  Database
} from 'lucide-react';
import PitchScannerModal from './PitchScannerModal';

export default function CoachAssessmentView({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onSaveAssessment,
  onSaveFitnessRecord,
  onSwitchToPassport,
  onToast
}) {
  const activePlayer = players.find((p) => p.player_id === selectedPlayerId) || players[0];

  // Local form state initialized from activePlayer
  const [formData, setFormData] = useState({
    attributes: activePlayer.radar_attributes.map((a) => ({ ...a })),
    fitness: { ...activePlayer.fitness_benchmarks },
    rawNotes: activePlayer.ai_coach_evaluation?.coach_raw_notes || '',
    narrative: activePlayer.ai_coach_evaluation?.narrative || '',
    strengths: [...(activePlayer.ai_coach_evaluation?.strengths || [])],
    growthAreas: [...(activePlayer.ai_coach_evaluation?.growth_areas || [])],
    drillTitle: activePlayer.ai_coach_evaluation?.recommended_drill?.title || 'Wall-Pass & Quick Scanning Drill',
    drillDuration: activePlayer.ai_coach_evaluation?.recommended_drill?.duration || '15 Menit / Hari',
    drillCategory: activePlayer.ai_coach_evaluation?.recommended_drill?.category || 'Ball Mastery'
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [hasDraftSaved, setHasDraftSaved] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Sync state when active player changes
  useEffect(() => {
    setFormData({
      attributes: activePlayer.radar_attributes.map((a) => ({ ...a })),
      fitness: { ...activePlayer.fitness_benchmarks },
      rawNotes: activePlayer.ai_coach_evaluation?.coach_raw_notes || '',
      narrative: activePlayer.ai_coach_evaluation?.narrative || '',
      strengths: [...(activePlayer.ai_coach_evaluation?.strengths || [])],
      growthAreas: [...(activePlayer.ai_coach_evaluation?.growth_areas || [])],
      drillTitle: activePlayer.ai_coach_evaluation?.recommended_drill?.title || 'Wall-Pass & Quick Scanning Drill',
      drillDuration: activePlayer.ai_coach_evaluation?.recommended_drill?.duration || '15 Menit / Hari',
      drillCategory: activePlayer.ai_coach_evaluation?.recommended_drill?.category || 'Ball Mastery'
    });
    setHasDraftSaved(false);
  }, [activePlayer.player_id]);

  // Attribute Scorer handlers
  const handleAttributeChange = (index, delta) => {
    setFormData((prev) => {
      const nextAttrs = [...prev.attributes];
      const nextVal = Math.min(99, Math.max(40, nextAttrs[index].value + delta));
      nextAttrs[index] = { ...nextAttrs[index], value: nextVal };
      return { ...prev, attributes: nextAttrs };
    });
  };

  const handleAttributeSlider = (index, value) => {
    setFormData((prev) => {
      const nextAttrs = [...prev.attributes];
      nextAttrs[index] = { ...nextAttrs[index], value: parseInt(value, 10) };
      return { ...prev, attributes: nextAttrs };
    });
  };

  // Color badge based on score
  const getScoreBadgeClass = (score) => {
    if (score >= 85) return 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/40';
    if (score >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  // Fitness input handlers
  const handleFitnessChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      fitness: {
        ...prev.fitness,
        [key]: value === '' ? '' : parseFloat(value) || value
      }
    }));
  };

  // Live Overall Rating calculation
  const calculatedOvr = Math.round(
    formData.attributes.reduce((acc, curr) => acc + curr.value, 0) / formData.attributes.length
  );

  // AI Narrative Generator Simulation
  const handleGenerateAI = () => {
    setIsGeneratingAI(true);

    setTimeout(() => {
      const name = activePlayer.personal_info.nickname || activePlayer.personal_info.full_name;
      const rawText = formData.rawNotes.trim();

      const sortedAttrs = [...formData.attributes].sort((a, b) => b.value - a.value);
      const topAttrNames = sortedAttrs.slice(0, 2).map((a) => a.attribute.split(' ')[0]);
      const lowestAttrName = sortedAttrs[sortedAttrs.length - 1].attribute.split(' ')[0];

      let generatedNarrative = '';
      if (rawText.length > 5) {
        generatedNarrative = `${name} menunjukkan respons latihan yang impresif pada sesi Oktober 2026. Analisis catatan lapangan: "${rawText}". Kemampuan ${topAttrNames.join(' & ')} berada di atas standar rata-rata U-13 akademi. Fokus taktis prioritas adalah meningkatkan konsistensi ${lowestAttrName.toLowerCase()} terutama saat fase transisi cepat lawan.`;
      } else {
        generatedNarrative = `${name} memperlihatkan perkembangan teknik dominan pada aspek ${topAttrNames.join(' dan ')} dengan kecepatan eksekusi tinggi. Evaluasi video menunjukkan scanning ruang sebelum menerima bola semakin matang. Poin akselerasi pertumbuhan terpusat pada penguatan ${lowestAttrName.toLowerCase()} serta ketahanan pressing intensif.`;
      }

      setFormData((prev) => ({
        ...prev,
        narrative: generatedNarrative,
        strengths: [
          `Dominasi ${topAttrNames[0] || 'Visi Bermain'}`,
          'Sentuhan pertama terarah di ruang sempit',
          'Pengambilan keputusan transisi positif'
        ],
        growthAreas: [
          `Penguatan fisik duel ${lowestAttrName.toLowerCase()}`,
          'Kecepatan pemulihan posisi bertahan'
        ],
        drillTitle: `Dynamic ${topAttrNames[0] || 'Passing'} & Scanning Wall-Drill`,
        drillDuration: '15 Menit / Hari',
        drillCategory: 'High Cognitive Football Drill'
      }));

      setIsGeneratingAI(false);
    }, 1000);
  };

  // Publish / Save Mutation to Supabase
  const handlePublish = async () => {
    setIsSavingSupabase(true);

    const updatedPlayer = {
      ...activePlayer,
      rawNotes: formData.rawNotes,
      personal_info: {
        ...activePlayer.personal_info,
        overall_rating: calculatedOvr
      },
      radar_attributes: formData.attributes,
      fitness_benchmarks: {
        ...formData.fitness,
        test_date: new Date().toISOString().split('T')[0]
      },
      ai_coach_evaluation: {
        ...activePlayer.ai_coach_evaluation,
        narrative: formData.narrative,
        coach_raw_notes: formData.rawNotes,
        strengths: formData.strengths,
        growth_areas: formData.growthAreas,
        recommended_drill: {
          title: formData.drillTitle,
          duration: formData.drillDuration,
          category: formData.drillCategory
        }
      }
    };

    try {
      await onSaveAssessment(updatedPlayer);
    } finally {
      setIsSavingSupabase(false);
    }
  };

  const handleSaveDraft = () => {
    setHasDraftSaved(true);
    setTimeout(() => setHasDraftSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      
      {/* 2. Player Selector (Horizontal Scroll with snap cards) */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-3.5 sm:p-4 shadow-xl shadow-black/50">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-xs font-athletic font-bold uppercase tracking-wider text-slate-300">
              Pilih Pemain Dievaluasi (Live Supabase Roster)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {players.length} Pemain di Skuad
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          {players.map((p) => {
            const isSelected = p.player_id === activePlayer.player_id;

            return (
              <button
                key={p.player_id}
                onClick={() => onSelectPlayer(p.player_id)}
                className={`shrink-0 flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 snap-center min-h-[48px] text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F2937] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)] ring-1 ring-[#CCFF00]'
                    : 'bg-[#090D16]/80 border-[#1F2937] hover:border-slate-600 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#090D16] border border-slate-700 shrink-0">
                  <img
                    src={p.personal_info.photo_url}
                    alt={p.personal_info.full_name}
                    className="w-full h-full object-cover object-top"
                  />
                  <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-black/90 text-[9px] font-athletic font-bold text-[#CCFF00]">
                    #{p.personal_info.jersey_number}
                  </span>
                </div>

                <div>
                  <div className="font-athletic text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{p.personal_info.nickname || p.personal_info.full_name}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({p.personal_info.position.split(' ')[0]})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>OVR: <strong className="text-[#CCFF00] font-bold">{p.personal_info.overall_rating}</strong></span>
                    <span>•</span>
                    <span>{p.personal_info.age} thn</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

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
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                attributes: activePlayer.radar_attributes.map((a) => ({ ...a }))
              }));
            }}
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

                {/* Tactile Stepper & Touch Slider (44px target) */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAttributeChange(index, -1)}
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
                    onChange={(e) => handleAttributeSlider(index, e.target.value)}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#CCFF00] min-h-[36px]"
                  />

                  <button
                    type="button"
                    onClick={() => handleAttributeChange(index, 1)}
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

      {/* 4. Physical Benchmark Quick-Log with Camera Scanner Action */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-athletic text-base sm:text-lg font-bold text-white tracking-tight">
              Physical Benchmark Quick-Log
            </h3>
            <p className="text-xs text-slate-400">
              Log data tes fisik langsung di lapangan atau gunakan Edge-AI Live Camera
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-lime-500/20 via-cyan-500/15 to-[#CCFF00]/20 hover:from-lime-500/30 hover:to-[#CCFF00]/30 border-2 border-[#CCFF00]/60 hover:border-[#CCFF00] text-[#CCFF00] font-athletic font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95 shrink-0"
          >
            <Camera className="w-4 h-4 text-[#CCFF00] stroke-[2.5]" />
            <span>📹 Open AI Live Camera Test</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Vertical Jump */}
          <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Vertical Jump
              </span>
              <span className="text-[10px] text-slate-400">cm</span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.5"
                value={formData.fitness.vertical_jump_cm || ''}
                onChange={(e) => handleFitnessChange('vertical_jump_cm', e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 focus:border-[#CCFF00] text-white font-athletic text-lg font-bold outline-none transition-colors"
                placeholder="44.5"
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Bulan lalu: {formData.fitness.prev_jump_cm || 42.0} cm</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +{(formData.fitness.vertical_jump_cm - (formData.fitness.prev_jump_cm || 42.0)).toFixed(1)} cm
              </span>
            </div>
          </div>

          {/* 20m Sprint */}
          <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> 20m Sprint
              </span>
              <span className="text-[10px] text-slate-400">detik</span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.fitness.sprint_20m_sec || ''}
                onChange={(e) => handleFitnessChange('sprint_20m_sec', e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 focus:border-[#CCFF00] text-white font-athletic text-lg font-bold outline-none transition-colors"
                placeholder="3.42"
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Bulan lalu: {formData.fitness.prev_sprint_sec || 3.50}s</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> -{((formData.fitness.prev_sprint_sec || 3.50) - formData.fitness.sprint_20m_sec).toFixed(2)}s
              </span>
            </div>
          </div>

          {/* Shuttle Run */}
          <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-cyan-400" /> Shuttle Run
              </span>
              <span className="text-[10px] text-slate-400">detik</span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.05"
                value={formData.fitness.shuttle_run_sec || ''}
                onChange={(e) => handleFitnessChange('shuttle_run_sec', e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 focus:border-[#CCFF00] text-white font-athletic text-lg font-bold outline-none transition-colors"
                placeholder="11.20"
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Bulan lalu: {formData.fitness.prev_shuttle_sec || 11.45}s</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> -{((formData.fitness.prev_shuttle_sec || 11.45) - formData.fitness.shuttle_run_sec).toFixed(2)}s
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI Coach Narrative Generator */}
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
          onClick={handleGenerateAI}
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
              <Sparkles className="w-4 h-4 text-black fill-current" />
              <span>✨ Generate Formal AI Narrative</span>
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

      {/* 6. Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-t border-[#1F2937] p-3 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Evaluasi: <strong className="text-white">{activePlayer.personal_info.nickname}</strong>
            </span>
            {hasDraftSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Draf Tersimpan
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 rounded-xl bg-[#111827] hover:bg-[#1F2937] border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Simpan Draf</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSavingSupabase}
              className="flex-1 sm:flex-initial min-h-[44px] px-5 rounded-xl bg-[#CCFF00] hover:bg-lime-300 text-black font-athletic font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSavingSupabase ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-current" />
                  <span>Publish & Upsert Supabase</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Edge-AI Live Pitch Scanner Modal */}
      {isCameraOpen && (
        <PitchScannerModal
          player={activePlayer}
          onClose={() => setIsCameraOpen(false)}
          onApplyResult={(res) => {
            handleFitnessChange(res.type, res.numericValue);
            if (onSaveFitnessRecord) {
              onSaveFitnessRecord(activePlayer.player_id, res);
            }
          }}
          onToast={onToast}
        />
      )}

    </div>
  );
}
