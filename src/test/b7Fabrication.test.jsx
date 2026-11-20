import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FitnessForm from '../components/assessment/FitnessForm';
import CoachAssessmentView from '../components/CoachAssessmentView';

describe('B7: Fabrication Removal & Manual Timing Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockFormData = {
    attributes: [
      { attribute: 'Pace (Kecepatan)', value: 80 }
    ],
    fitness: {
      vertical_jump_cm: 44.0,
      sprint_20m_sec: 3.50,
      shuttle_run_sec: 11.20,
      prev_jump_cm: 42.0,
      prev_sprint_sec: 3.55,
      prev_shuttle_sec: 11.40
    }
  };

  const samplePlayer = {
    player_id: 'p-01',
    public_id: 'WK-2026-0042',
    personal_info: {
      full_name: 'Dimas Arya',
      nickname: 'Arya',
      jersey_number: 10,
      position: 'Midfielder',
      academy: { name: 'Mataram Putra FA', city: 'Yogyakarta' }
    },
    radar_attributes: [
      { attribute: 'Pace (Kecepatan)', value: 80 }
    ],
    fitness_benchmarks: {
      vertical_jump_cm: 44.0,
      sprint_20m_sec: 3.50,
      shuttle_run_sec: 11.20
    }
  };

  it('renders honest manual timing stopwatch in FitnessForm with visible note', () => {
    const onFitnessChange = vi.fn();
    render(<FitnessForm formData={mockFormData} onFitnessChange={onFitnessChange} />);

    // Stopwatch helper exists
    expect(screen.getByText('Pewaktu manual (stopwatch)')).toBeInTheDocument();
    expect(
      screen.getByText('Waktu manual; akurasi bergantung pada pewaktu. Catat metode di catatan.')
    ).toBeInTheDocument();

    // No camera scanner button
    expect(screen.queryByText(/kamera uji fisik/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/scan/i)).not.toBeInTheDocument();
  });

  it('stopwatch fills 20m sprint field upon stop', () => {
    const onFitnessChange = vi.fn();
    render(<FitnessForm formData={mockFormData} onFitnessChange={onFitnessChange} />);

    // Click "Mulai"
    const startBtn = screen.getByRole('button', { name: /Mulai/i });
    fireEvent.click(startBtn);

    // Advance 3.42 seconds
    act(() => {
      vi.advanceTimersByTime(3420);
    });

    // Click "Berhenti & isi"
    const stopBtn = screen.getByRole('button', { name: /Berhenti & isi/i });
    fireEvent.click(stopBtn);

    expect(onFitnessChange).toHaveBeenCalledWith('sprint_20m_sec', expect.any(String));
  });

  it('CoachAssessmentView contains zero camera or scanner elements', () => {
    render(
      <CoachAssessmentView
        players={[samplePlayer]}
        selectedPlayerId={samplePlayer.player_id}
        onSelectPlayer={() => {}}
        onSaveAssessment={() => {}}
      />
    );

    // Zero camera buttons, zero pitch scanner
    expect(screen.queryByText(/Buka kamera/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PitchScanner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mode simulator/i)).not.toBeInTheDocument();
  });
});
