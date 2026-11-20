import React from 'react';
import { Camera, TrendingUp, TrendingDown } from 'lucide-react';
import Button from '../ui/Button';
import Field from '../ui/Field';

export default function FitnessForm({
  formData,
  onFitnessChange,
  onOpenScanner
}) {
  const jumpPrev = formData.fitness.prev_jump_cm;
  const sprintPrev = formData.fitness.prev_sprint_sec;
  const shuttlePrev = formData.fitness.prev_shuttle_sec;

  const currentJump = parseFloat(formData.fitness.vertical_jump_cm);
  const currentSprint = parseFloat(formData.fitness.sprint_20m_sec);
  const currentShuttle = parseFloat(formData.fitness.shuttle_run_sec);

  return (
    <section className="border-t border-line pt-4 space-y-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-1">
            Log tolok ukur fisik lapangan
          </h3>
          <p className="text-xs text-2">
            Catat hasil tes fisik langsung di lapangan atau gunakan kamera pendeteksi
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onOpenScanner}
          icon={<Camera className="w-4 h-4" strokeWidth={1.5} />}
        >
          Buka kamera uji fisik
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Vertical Jump */}
        <div className="p-3.5 rounded-control bg-panel border border-line space-y-2">
          <Field label="Vertical jump (cm)" id="fitness-vjump">
            <input
              id="fitness-vjump"
              type="number"
              step="0.5"
              value={formData.fitness.vertical_jump_cm || ''}
              onChange={(e) => onFitnessChange('vertical_jump_cm', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-control bg-app border border-control text-1 font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              placeholder="44.5"
            />
          </Field>

          <div className="text-xs text-2 flex items-center justify-between pt-1 border-t border-line">
            <span>
              {jumpPrev ? `Bulan lalu: ${jumpPrev} cm` : 'Bulan lalu: belum ada data'}
            </span>
            {jumpPrev && !isNaN(currentJump) ? (
              <span className="text-brand font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>+{(currentJump - jumpPrev).toFixed(1)} cm</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* 20m Sprint */}
        <div className="p-3.5 rounded-control bg-panel border border-line space-y-2">
          <Field label="20m sprint (detik)" id="fitness-sprint">
            <input
              id="fitness-sprint"
              type="number"
              step="0.01"
              value={formData.fitness.sprint_20m_sec || ''}
              onChange={(e) => onFitnessChange('sprint_20m_sec', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-control bg-app border border-control text-1 font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              placeholder="3.42"
            />
          </Field>

          <div className="text-xs text-2 flex items-center justify-between pt-1 border-t border-line">
            <span>
              {sprintPrev ? `Bulan lalu: ${sprintPrev} dtk` : 'Bulan lalu: belum ada data'}
            </span>
            {sprintPrev && !isNaN(currentSprint) ? (
              <span className="text-brand font-medium flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>-{(sprintPrev - currentSprint).toFixed(2)} dtk</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Shuttle Run */}
        <div className="p-3.5 rounded-control bg-panel border border-line space-y-2">
          <Field label="Shuttle run (detik)" id="fitness-shuttle">
            <input
              id="fitness-shuttle"
              type="number"
              step="0.05"
              value={formData.fitness.shuttle_run_sec || ''}
              onChange={(e) => onFitnessChange('shuttle_run_sec', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-control bg-app border border-control text-1 font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              placeholder="11.20"
            />
          </Field>

          <div className="text-xs text-2 flex items-center justify-between pt-1 border-t border-line">
            <span>
              {shuttlePrev ? `Bulan lalu: ${shuttlePrev} dtk` : 'Bulan lalu: belum ada data'}
            </span>
            {shuttlePrev && !isNaN(currentShuttle) ? (
              <span className="text-brand font-medium flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>-{(shuttlePrev - currentShuttle).toFixed(2)} dtk</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
