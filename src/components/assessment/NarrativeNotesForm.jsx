import React from 'react';
import { Send, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Field from '../ui/Field';

export default function NarrativeNotesForm({
  formData,
  setFormData,
  isGeneratingAI,
  onGenerateAI
}) {
  return (
    <section className="border-t border-line pt-4 space-y-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-1">
            Perumusan narasi evaluasi teknis
          </h3>
          <p className="text-xs text-2">
            Rumuskan catatan observasi pelatih menjadi laporan evaluasi terstruktur
          </p>
        </div>

        <Badge variant="neutral" size="sm" className="self-start sm:self-auto">
          Standar pemantauan akademi
        </Badge>
      </div>

      {/* Raw coach notes textarea */}
      <Field
        label="Catatan observasi pelatih di lapangan"
        id="coach-raw-notes"
        helper="Catat pengamatan mengenai pengambilan keputusan, penempatan posisi, atau komunikasi tim."
      >
        <textarea
          id="coach-raw-notes"
          rows="3"
          value={formData.rawNotes}
          onChange={(e) => setFormData((prev) => ({ ...prev, rawNotes: e.target.value }))}
          className="w-full p-3 rounded-control bg-app border border-control text-xs sm:text-sm text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors min-h-[88px]"
          placeholder="Contoh: Sentuhan pertama konsisten rapi, tetapi perlu meningkatkan kecepatan transisi bertahan saat tim kehilangan penguasaan bola."
        />
      </Field>

      {/* Action Button: Generate Technical Narrative */}
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={onGenerateAI}
        loading={isGeneratingAI}
        disabled={isGeneratingAI}
        className="w-full"
        icon={<Send className="w-4 h-4" strokeWidth={1.5} />}
      >
        {isGeneratingAI ? 'Merumuskan narasi evaluasi...' : 'Rumuskan narasi evaluasi'}
      </Button>

      {/* Populated Result Card */}
      <div className="p-4 rounded-control bg-panel border border-line space-y-4">
        <div>
          <span className="text-xs font-semibold text-2 block mb-1">
            Narasi evaluasi teknis:
          </span>
          {formData.narrative ? (
            <p className="text-xs sm:text-sm text-1 leading-relaxed bg-app p-3 rounded-control border border-line">
              {formData.narrative}
            </p>
          ) : (
            <p className="text-xs text-2 italic bg-app p-3 rounded-control border border-line">
              Belum ada data narasi evaluasi. Masukkan catatan dan klik tombol rumuskan.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <span className="text-xs font-semibold text-2 block mb-1.5">
              Keunggulan utama:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formData.strengths.length > 0 ? (
                formData.strengths.map((s, i) => (
                  <Badge key={i} variant="brand" size="sm">
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-2">Belum ada data</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-2 block mb-1.5">
              Area fokus pengembangan:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formData.growthAreas.length > 0 ? (
                formData.growthAreas.map((g, i) => (
                  <Badge key={i} variant="warning" size="sm">
                    {g}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-2">Belum ada data</span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-2" strokeWidth={1.5} />
            <div>
              <span className="text-xs text-2 block">
                Rekomendasi materi latihan mandiri:
              </span>
              <span className="text-xs font-semibold text-1">
                {formData.drillTitle || 'Belum ada data'}
              </span>
            </div>
          </div>
          <Badge variant="neutral" size="sm">
            {formData.drillDuration || 'Belum ada data'}
          </Badge>
        </div>
      </div>
    </section>
  );
}
