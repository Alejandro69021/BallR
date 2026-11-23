import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Play, Square, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import Field from '../ui/Field';

export default function FitnessForm({
  formData,
  onFitnessChange
}) {
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);

  useEffect(() => {
    let interval = null;
    if (stopwatchRunning) {
      const startTimestamp = performance.now() - stopwatchTime;
      interval = setInterval(() => {
        setStopwatchTime(performance.now() - startTimestamp);
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopwatchRunning, stopwatchTime]);

  const handleStartStopwatch = () => {
    setStopwatchRunning(true);
  };

  const handleStopStopwatch = () => {
    setStopwatchRunning(false);
    const seconds = (stopwatchTime / 1000).toFixed(2);
    onFitnessChange('sprint_20m_sec', seconds);
  };

  const handleResetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
  };

  const jumpPrev = formData.fitness.prev_jump_cm;
  const sprintPrev = formData.fitness.prev_sprint_sec;
  const shuttlePrev = formData.fitness.prev_shuttle_sec;

  const currentJump = parseFloat(formData.fitness.vertical_jump_cm);
  const currentSprint = parseFloat(formData.fitness.sprint_20m_sec);
  const currentShuttle = parseFloat(formData.fitness.shuttle_run_sec);

  return (
    <section className="border-t border-line pt-4 space-y-4 text-1">
      <div>
        <h3 className="text-sm font-semibold text-1">
          Log tolok ukur fisik lapangan
        </h3>
        <p className="text-sm text-2">
          Pencatatan hasil tes fisik lapangan secara manual.
        </p>
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

          <div className="text-sm text-2 flex items-center justify-between pt-1 border-t border-line">
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

        {/* 20m Sprint with Honest Stopwatch */}
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

          <div className="text-sm text-2 flex items-center justify-between pt-1 border-t border-line">
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

          {/* Stopwatch Timing Helper */}
          <div className="pt-2 border-t border-line space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-2 font-medium">Pewaktu manual (stopwatch)</span>
              <span className="font-mono text-sm tabular-nums text-1 font-semibold">
                {(stopwatchTime / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {!stopwatchRunning ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleStartStopwatch}
                  icon={<Play className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Mulai
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleStopStopwatch}
                  icon={<Square className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Berhenti & isi
                </Button>
              )}
              {stopwatchTime > 0 && !stopwatchRunning && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetStopwatch}
                  icon={<RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Reset
                </Button>
              )}
            </div>
            <p className="text-sm text-2 italic">
              Waktu manual; akurasi bergantung pada pewaktu. Catat metode di catatan.
            </p>
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

          <div className="text-sm text-2 flex items-center justify-between pt-1 border-t border-line">
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
