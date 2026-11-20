import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  Loader2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import PitchScannerModal from './PitchScannerModal';
import AttributeEditor from './assessment/AttributeEditor';
import FitnessForm from './assessment/FitnessForm';
import NarrativeNotesForm from './assessment/NarrativeNotesForm';
import { calculateOvr } from '../lib/calculations';

export default function CoachAssessmentView({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onSaveAssessment,
  onSaveFitnessRecord,
  _onSwitchToPassport,
  onToast
}) {
  const activePlayer = players.find((p) => p.player_id === selectedPlayerId) || players[0];

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

  const handleFitnessChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      fitness: {
        ...prev.fitness,
        [key]: value === '' ? '' : parseFloat(value) || value
      }
    }));
  };

  const calculatedOvr = calculateOvr(formData.attributes);

  const handleGenerateAI = () => {
    const name = activePlayer.personal_info.nickname || activePlayer.personal_info.full_name || 'Atlet';
    const rawText = formData.rawNotes.trim();

    if (!rawText) {
      if (onToast) {
        onToast({
          title: "Catatan Pelatih Kosong",
          subtext: "Belum ada data catatan pelatih untuk dirumuskan narasi."
        });
      }
      return;
    }

    const sortedAttrs = [...formData.attributes].sort((a, b) => b.value - a.value);
    const topAttrNames = sortedAttrs.slice(0, 2).map((a) => a.attribute.split(' ')[0]);
    const lowestAttrName = sortedAttrs[sortedAttrs.length - 1].attribute.split(' ')[0];

    const generatedNarrative = `Catatan evaluasi lapangan untuk ${name}: "${rawText}". Atribut menonjol: ${topAttrNames.join(' & ')}. Area fokus pengembangan: ${lowestAttrName.toLowerCase()}.`;

    setFormData((prev) => ({
      ...prev,
      narrative: generatedNarrative,
      strengths: topAttrNames.map((a) => `Dominasi ${a}`),
      growthAreas: [`Penguatan aspek ${lowestAttrName.toLowerCase()}`]
    }));

    if (onToast) {
      onToast({
        title: "Narasi Evaluasi Dihasilkan",
        subtext: `Analisis catatan lapangan untuk ${name} siap ditinjau.`
      });
    }
  };

  const handleSaveDraft = () => {
    setHasDraftSaved(true);
    if (onToast) {
      onToast({
        title: "Draf Evaluasi Tersimpan",
        subtext: `Perubahan scoring ${activePlayer.personal_info.nickname} tersimpan lokal di sesi pelatih.`
      });
    }
  };

  const handlePublish = async () => {
    setIsSavingSupabase(true);
    try {
      const updatedPlayerData = {
        ...activePlayer,
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
          period: "Oktober 2026",
          coach_name: "Coach Hendro (Lisensi B AFC)",
          coach_raw_notes: formData.rawNotes,
          narrative: formData.narrative,
          strengths: formData.strengths,
          growth_areas: formData.growthAreas,
          recommended_drill: {
            title: formData.drillTitle,
            duration: formData.drillDuration,
            category: formData.drillCategory
          }
        }
      };

      if (onSaveAssessment) {
        await onSaveAssessment(updatedPlayerData);
      }
    } finally {
      setIsSavingSupabase(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-24 text-white">
      {/* 1. Header & Roster Switcher Strip */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
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
                type="button"
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

      <AttributeEditor
        formData={formData}
        calculatedOvr={calculatedOvr}
        activePlayer={activePlayer}
        onAttributeChange={handleAttributeChange}
        onAttributeSlider={handleAttributeSlider}
        onResetAttributes={() => {
          setFormData((prev) => ({
            ...prev,
            attributes: activePlayer.radar_attributes.map((a) => ({ ...a }))
          }));
        }}
      />

      <FitnessForm
        formData={formData}
        onFitnessChange={handleFitnessChange}
        onOpenScanner={() => setIsCameraOpen(true)}
      />

      <NarrativeNotesForm
        formData={formData}
        setFormData={setFormData}
        isGeneratingAI={isGeneratingAI}
        onGenerateAI={handleGenerateAI}
      />

      {/* Bottom Sticky Action Bar */}
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
