import React, { useState, useEffect, useRef } from 'react';
import { Save, Send, CheckCircle2, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import AttributeEditor from './assessment/AttributeEditor';
import FitnessForm from './assessment/FitnessForm';
import NarrativeNotesForm from './assessment/NarrativeNotesForm';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { JerseyTile } from './brand';

export default function CoachAssessmentView({
  players = [],
  selectedPlayerId,
  activePlayer: activePlayerProp,
  onSelectPlayer,
  onSaveAssessment,
  _onSwitchToPassport,
  onToast
}) {
  const activePlayer =
    activePlayerProp ||
    (players && players.find((p) => p.player_id === selectedPlayerId)) ||
    (players && players[0]) ||
    null;

  const [formData, setFormData] = useState({
    attributes: activePlayer?.radar_attributes ? activePlayer.radar_attributes.map((a) => ({ ...a })) : [],
    fitness: { ...(activePlayer?.fitness_benchmarks || {}) },
    rawNotes: activePlayer?.ai_coach_evaluation?.coach_raw_notes || '',
    narrative: activePlayer?.ai_coach_evaluation?.narrative || '',
    strengths: [...(activePlayer?.ai_coach_evaluation?.strengths || [])],
    growthAreas: [...(activePlayer?.ai_coach_evaluation?.growth_areas || [])],
    drillTitle: activePlayer?.ai_coach_evaluation?.recommended_drill?.title || 'Wall-Pass & Quick Scanning Drill',
    drillDuration: activePlayer?.ai_coach_evaluation?.recommended_drill?.duration || '15 Menit / Hari',
    drillCategory: activePlayer?.ai_coach_evaluation?.recommended_drill?.category || 'Ball Mastery'
  });

  const [isGeneratingAI] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [hasDraftSaved, setHasDraftSaved] = useState(false);

  const rosterStripRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, scrollLeft: 0, dragged: false });

  useEffect(() => {
    const el = rosterStripRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [players.length]);

  const scrollRosterBy = (delta) => {
    const el = rosterStripRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleRosterMouseDown = (e) => {
    if (e.button !== 0) return;
    const el = rosterStripRef.current;
    if (!el) return;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      dragged: false
    };
  };

  const handleRosterMouseMove = (e) => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 6) {
      drag.dragged = true;
    }
    if (drag.dragged && rosterStripRef.current) {
      rosterStripRef.current.scrollLeft = drag.scrollLeft - dx;
    }
  };

  const handleRosterMouseUpOrLeave = () => {
    dragStateRef.current.active = false;
    setTimeout(() => {
      dragStateRef.current.dragged = false;
    }, 0);
  };

  useEffect(() => {
    if (!activePlayer) return;
    setFormData({
      attributes: activePlayer.radar_attributes ? activePlayer.radar_attributes.map((a) => ({ ...a })) : [],
      fitness: { ...(activePlayer.fitness_benchmarks || {}) },
      rawNotes: activePlayer.ai_coach_evaluation?.coach_raw_notes || '',
      narrative: activePlayer.ai_coach_evaluation?.narrative || '',
      strengths: [...(activePlayer.ai_coach_evaluation?.strengths || [])],
      growthAreas: [...(activePlayer.ai_coach_evaluation?.growth_areas || [])],
      drillTitle: activePlayer.ai_coach_evaluation?.recommended_drill?.title || 'Wall-Pass & Quick Scanning Drill',
      drillDuration: activePlayer.ai_coach_evaluation?.recommended_drill?.duration || '15 Menit / Hari',
      drillCategory: activePlayer.ai_coach_evaluation?.recommended_drill?.category || 'Ball Mastery'
    });
    setHasDraftSaved(false);
  }, [activePlayer?.player_id]);

  if (!activePlayer) {
    return (
      <div className="p-8 text-center text-sm text-2">
        Belum ada data pemain yang dipilih.
      </div>
    );
  }

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

  const handleGenerateAI = () => {
    const name = activePlayer.personal_info.nickname || activePlayer.personal_info.full_name || 'Atlet';
    const rawText = formData.rawNotes.trim();

    if (!rawText) {
      if (onToast) {
        onToast({
          title: 'Catatan pelatih kosong',
          subtext: 'Belum ada data catatan pelatih untuk dirumuskan narasi.'
        });
      }
      return;
    }

    const sortedAttrs = [...formData.attributes].sort((a, b) => b.value - a.value);
    const topAttrNames = sortedAttrs.slice(0, 2).map((a) => a.attribute.split(' ')[0]);
    const lowestAttrName = sortedAttrs[sortedAttrs.length - 1]?.attribute?.split(' ')[0] || 'kebugaran';

    const generatedNarrative = `Catatan evaluasi lapangan untuk ${name}: "${rawText}". Atribut menonjol: ${topAttrNames.join(' & ')}. Area fokus pengembangan: ${lowestAttrName.toLowerCase()}.`;

    setFormData((prev) => ({
      ...prev,
      narrative: generatedNarrative,
      strengths: topAttrNames.map((a) => `Dominasi ${a}`),
      growthAreas: [`Penguatan aspek ${lowestAttrName.toLowerCase()}`]
    }));

    if (onToast) {
      onToast({
        title: 'Narasi evaluasi dihasilkan',
        subtext: `Analisis catatan lapangan untuk ${name} siap ditinjau.`
      });
    }
  };

  const handleSaveDraft = () => {
    setHasDraftSaved(true);
    if (onToast) {
      onToast({
        title: 'Draf evaluasi tersimpan',
        subtext: `Perubahan penilaian ${activePlayer.personal_info.nickname || activePlayer.personal_info.full_name} tersimpan di sesi pelatih.`
      });
    }
  };

  const handlePublish = async () => {
    setIsSavingSupabase(true);
    try {
      const updatedPlayerData = {
        ...activePlayer,
        personal_info: {
          ...activePlayer.personal_info
        },
        radar_attributes: formData.attributes,
        fitness_benchmarks: {
          ...formData.fitness,
          test_date: new Date().toISOString().split('T')[0]
        },
        ai_coach_evaluation: {
          ...activePlayer.ai_coach_evaluation,
          period: 'Oktober 2026',
          coach_name: 'Coach Hendro (Lisensi B AFC)',
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
    <div className="space-y-6 pb-36 md:pb-24 text-1">
      {/* 1. Roster Switcher Strip (if players list provided) */}
      {players.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-1">
                Pilih pemain yang dievaluasi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums text-2">
                {players.length} pemain di skuad
              </span>
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRosterBy(-260)}
                  aria-label="Geser daftar pemain ke kiri"
                  className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1.5 rounded-control border border-line bg-panel text-2 hover:text-1 hover:bg-raised transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRosterBy(260)}
                  aria-label="Geser daftar pemain ke kanan"
                  className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1.5 rounded-control border border-line bg-panel text-2 hover:text-1 hover:bg-raised transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={rosterStripRef}
            onMouseDown={handleRosterMouseDown}
            onMouseMove={handleRosterMouseMove}
            onMouseUp={handleRosterMouseUpOrLeave}
            onMouseLeave={handleRosterMouseUpOrLeave}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x select-none cursor-grab active:cursor-grabbing"
          >
            {players.map((p) => {
              const isSelected = p.player_id === activePlayer.player_id;
              return (
                <button
                  key={p.player_id}
                  type="button"
                  onClick={() => {
                    if (dragStateRef.current.dragged) return;
                    if (onSelectPlayer) onSelectPlayer(p.player_id);
                  }}
                  className={`shrink-0 flex items-center gap-2.5 p-2 rounded-control border transition-colors duration-150 snap-center min-h-[44px] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isSelected
                      ? 'bg-raised border-control text-1 font-medium'
                      : 'bg-panel border-line text-2 hover:text-1 hover:bg-raised'
                  }`}
                >
                  <JerseyTile number={p.personal_info.jersey_number} size="md" />

                  <div>
                    <div className="text-sm font-semibold text-1">
                      {p.personal_info.nickname || p.personal_info.full_name}
                    </div>
                    <div className="text-sm text-2">
                      {p.personal_info.position}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Core Attribute Scorer */}
      <AttributeEditor
        formData={formData}
        activePlayer={activePlayer}
        onAttributeChange={handleAttributeChange}
        onAttributeSlider={handleAttributeSlider}
        onResetAttributes={() => {
          setFormData((prev) => ({
            ...prev,
            attributes: activePlayer.radar_attributes ? activePlayer.radar_attributes.map((a) => ({ ...a })) : []
          }));
        }}
      />

      {/* 3. Fitness Benchmarks */}
      <FitnessForm
        formData={formData}
        onFitnessChange={handleFitnessChange}
      />

      {/* 4. Narrative Formulation */}
      <NarrativeNotesForm
        formData={formData}
        setFormData={setFormData}
        isGeneratingAI={isGeneratingAI}
        onGenerateAI={handleGenerateAI}
      />

      {/* 5. Bottom Sticky Action Bar: offset above mobile bottom nav (< md) and right of desktop sidebar (>= md) */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 md:left-56 z-30 bg-panel/95 backdrop-blur-xs border-t border-line p-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-2 font-medium hidden sm:inline">
              Evaluasi: <strong className="text-1">{activePlayer.personal_info.nickname || activePlayer.personal_info.full_name}</strong>
            </span>
            {hasDraftSaved && (
              <Badge variant="brand" size="sm" className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Draf tersimpan</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleSaveDraft}
              icon={<Save className="w-4 h-4" strokeWidth={1.5} />}
            >
              Simpan draf
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handlePublish}
              loading={isSavingSupabase}
              disabled={isSavingSupabase}
              icon={<Send className="w-4 h-4" strokeWidth={1.5} />}
            >
              {isSavingSupabase ? 'Menyimpan...' : 'Simpan dan publikasikan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
