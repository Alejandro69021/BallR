import React from 'react';
import { RotateCcw, Minus, Plus } from 'lucide-react';
import Button from '../ui/Button';

const ATTRIBUTE_DESCRIPTIONS = {
  speed: 'Kecepatan lari akselerasi dan transisi tanpa bola untuk usia U-13.',
  pace: 'Kecepatan lari akselerasi dan transisi tanpa bola untuk usia U-13.',
  shooting: 'Akurasi tembakan dan teknik penyelesaian peluang di kotak penalti.',
  passing: 'Ketepatan umpan pendek, sirkulasi bola, dan visi ruang.',
  dribbling: 'Penguasaan bola saat bergerak, kontrol satu lawan satu, dan kelincahan.',
  defending: 'Disiplin posisi bertahan, tekel bersih, dan intersep jalur umpan.',
  physicality: 'Daya tahan fisik, kekuatan duel darat, dan keseimbangan tubuh.',
  physique: 'Daya tahan fisik, kekuatan duel darat, dan keseimbangan tubuh.'
};

export default function AttributeEditor({
  formData,
  activePlayer,
  onAttributeChange,
  onAttributeSlider,
  onResetAttributes
}) {
  const getAttributeDesc = (attrName) => {
    const key = attrName.toLowerCase().split(' ')[0];
    return ATTRIBUTE_DESCRIPTIONS[key] || 'Tingkat penguasaan atribut teknis untuk kelompok usia U-13.';
  };

  return (
    <section className="space-y-4 text-1">
      {/* Player Header Strip */}
      <div className="rounded-panel bg-panel border border-line p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-control bg-raised border border-line flex items-center justify-center font-mono text-base font-semibold text-1">
            #{activePlayer.personal_info.jersey_number}
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-semibold text-1">
              {activePlayer.personal_info.full_name}
            </h3>
            <p className="text-sm text-2">
              #{activePlayer.personal_info.jersey_number} · {activePlayer.personal_info.position}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetAttributes}
            icon={<RotateCcw className="w-4 h-4" strokeWidth={1.5} />}
          >
            Reset nilai
          </Button>
        </div>
      </div>

      {/* 6 Core Football Attributes */}
      <div className="border-t border-line pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-1">
              Scoring atribut kunci sepak bola
            </h3>
            <p className="text-sm text-2">
              Gunakan tombol stepper (- / +) atau slider sentuh (skala 0-100)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formData.attributes.map((attr, index) => {
            return (
              <div
                key={attr.attribute}
                className="p-3 rounded-control bg-panel border border-line space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-1 block">
                      {attr.attribute}
                    </span>
                    <span className="text-sm text-2 block mt-0.5 leading-snug">
                      {getAttributeDesc(attr.attribute)}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono tabular-nums text-sm font-semibold text-1">
                      {attr.value}
                    </span>
                    <span className="text-sm font-mono text-2 ml-1">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onAttributeChange(index, -1)}
                    className="min-h-[44px] min-w-[44px] rounded-control bg-raised hover:bg-panel active:opacity-85 text-1 flex items-center justify-center border border-control cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label={`Kurangi ${attr.attribute}`}
                  >
                    <Minus className="w-4 h-4" strokeWidth={1.5} />
                  </button>

                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={attr.value}
                    onChange={(e) => onAttributeSlider(index, e.target.value)}
                    className="flex-1 h-2 bg-raised rounded-control appearance-none cursor-pointer accent-brand min-h-[44px]"
                  />

                  <button
                    type="button"
                    onClick={() => onAttributeChange(index, 1)}
                    className="min-h-[44px] min-w-[44px] rounded-control bg-raised hover:bg-panel active:opacity-85 text-1 flex items-center justify-center border border-control cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label={`Tambah ${attr.attribute}`}
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
