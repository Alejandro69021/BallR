import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoachAssessmentView from '../components/CoachAssessmentView';
import FastPitchLogger from '../components/FastPitchLogger';
import MatchRecapModal from '../components/logger/MatchRecapModal';

describe('B3 Coach Workspace Components Behaviour Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockPlayer = {
    player_id: 'player-b3-01',
    public_id: 'WK-B3-01',
    personal_info: {
      nickname: 'Fajar',
      full_name: 'Fajar Pratama',
      jersey_number: 10,
      position: 'Gelandang Serang (AMF)',
      age: 13
    },
    radar_attributes: [
      { attribute: 'Pace & Acceleration', value: 80 },
      { attribute: 'Shooting & Finishing', value: 75 },
      { attribute: 'Passing & Vision', value: 85 },
      { attribute: 'Dribbling & Agility', value: 82 },
      { attribute: 'Defending & Pressing', value: 65 },
      { attribute: 'Physical & Stamina', value: 72 }
    ],
    fitness_benchmarks: {
      vertical_jump_cm: 45.0,
      prev_jump_cm: 43.0,
      sprint_20m_sec: 3.4,
      prev_sprint_sec: 3.5,
      shuttle_run_sec: 11.2,
      prev_shuttle_sec: 11.4
    },
    ai_coach_evaluation: {
      period: 'Oktober 2026',
      coach_name: 'Coach Hendro',
      coach_raw_notes: 'Sentuhan pertama rapi, visi bermain matang.',
      narrative: 'Evaluasi teknis menunjukkan dominasi operan dan visi bermain yang unggul.',
      strengths: ['Passing', 'Vision'],
      growth_areas: ['Physicality'],
      recommended_drill: {
        title: 'Wall-Pass & Quick Scanning Drill',
        duration: '15 Menit / Hari',
        category: 'Ball Mastery'
      }
    }
  };

  describe('CoachAssessmentView', () => {
    it('submitting assessment calls onSaveAssessment with expected payload shape', async () => {
      const onSaveAssessment = vi.fn().mockResolvedValue(true);
      const onToast = vi.fn();

      render(
        <CoachAssessmentView
          players={[mockPlayer]}
          selectedPlayerId={mockPlayer.player_id}
          onSaveAssessment={onSaveAssessment}
          onToast={onToast}
        />
      );

      const publishButton = screen.getByRole('button', { name: /Simpan dan publikasikan/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(onSaveAssessment).toHaveBeenCalledTimes(1);
      });

      const payload = onSaveAssessment.mock.calls[0][0];

      // Verify payload shape integrity
      expect(payload).toHaveProperty('player_id', mockPlayer.player_id);
      expect(payload).toHaveProperty('personal_info');
      expect(payload.personal_info).not.toHaveProperty('overall_rating');
      expect(payload).toHaveProperty('radar_attributes');
      expect(Array.isArray(payload.radar_attributes)).toBe(true);
      expect(payload.radar_attributes.length).toBe(mockPlayer.radar_attributes.length);
      expect(payload).toHaveProperty('fitness_benchmarks');
      expect(payload.fitness_benchmarks).toHaveProperty('test_date');
      expect(payload.fitness_benchmarks).toHaveProperty('vertical_jump_cm');
      expect(payload).toHaveProperty('ai_coach_evaluation');
      expect(payload.ai_coach_evaluation).toHaveProperty('coach_raw_notes');
      expect(payload.ai_coach_evaluation).toHaveProperty('narrative');
      expect(payload.ai_coach_evaluation).toHaveProperty('strengths');
      expect(payload.ai_coach_evaluation).toHaveProperty('growth_areas');
      expect(payload.ai_coach_evaluation).toHaveProperty('recommended_drill');
      expect(payload.ai_coach_evaluation.recommended_drill).toHaveProperty('title');
    });

    it('saves draft locally and fires toast', () => {
      const onToast = vi.fn();
      render(
        <CoachAssessmentView
          players={[mockPlayer]}
          selectedPlayerId={mockPlayer.player_id}
          onSaveAssessment={vi.fn()}
          onToast={onToast}
        />
      );

      const draftButton = screen.getByRole('button', { name: /Simpan draf/i });
      fireEvent.click(draftButton);

      expect(onToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Draf evaluasi tersimpan' })
      );
      expect(screen.getByText('Draf tersimpan')).toBeInTheDocument();
    });
  });

  describe('FastPitchLogger & Event Stream', () => {
    it('tapping an event button appends exactly one event with minute and type', () => {
      render(
        <FastPitchLogger
          players={[mockPlayer]}
          selectedPlayerId={mockPlayer.player_id}
          onFinishMatch={vi.fn()}
          onToast={vi.fn()}
        />
      );

      // Check initial event stream items
      const initialPassEvents = screen.getAllByText('Pass akurat');
      const initialCount = initialPassEvents.length;

      // Tap Pass akurat button
      const passButton = screen.getByRole('button', { name: /Pass akurat/i });
      fireEvent.click(passButton);

      // Verify exactly one new event was appended to history
      const updatedPassEvents = screen.getAllByText('Pass akurat');
      expect(updatedPassEvents.length).toBe(initialCount + 1);

      // Verify the badge displays the event type 'pass_success'
      expect(screen.getAllByText('pass_success').length).toBeGreaterThan(1);
    });

    it('undo button removes the last logged event from history', () => {
      const onToast = vi.fn();
      render(
        <FastPitchLogger
          players={[mockPlayer]}
          selectedPlayerId={mockPlayer.player_id}
          onFinishMatch={vi.fn()}
          onToast={onToast}
        />
      );

      // Tap Tekel berhasil button to add a known event
      const tackleBtn = screen.getByRole('button', { name: /Tekel & intersep/i });
      fireEvent.click(tackleBtn);

      const undoButton = screen.getByRole('button', { name: /Batalkan aksi/i });
      expect(undoButton).toBeEnabled();

      fireEvent.click(undoButton);

      expect(onToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Aksi terakhir dibatalkan' })
      );
    });

    it('recap modal displays counts of logged events and confirms sync', () => {
      const onConfirmSync = vi.fn();
      const mockStats = {
        passesCompleted: 25,
        passesTotal: 30,
        keyPasses: 4,
        tacklesWon: 5,
        tacklesTotal: 6,
        shotsOnTarget: 3,
        goals: 2
      };

      render(
        <MatchRecapModal
          activePlayer={mockPlayer}
          timerSeconds={900}
          stats={mockStats}
          passAccuracy={83}
          tackleAccuracy={83}
          calculatedMatchRating={8.4}
          onClose={vi.fn()}
          onConfirmSync={onConfirmSync}
        />
      );

      // Check modal heading and player info
      expect(screen.getByText(/Ringkasan performa laga/i)).toBeInTheDocument();
      expect(screen.getByText(/Fajar Pratama/i)).toBeInTheDocument();

      // Check stat counts
      expect(screen.getByText('25 / 30 (83%)')).toBeInTheDocument();
      expect(screen.getByText('4 peluang')).toBeInTheDocument();
      expect(screen.getByText('5 / 6 (83%)')).toBeInTheDocument();
      expect(screen.getByText('3 on target (2 gol)')).toBeInTheDocument();
      expect(screen.getByText('8.4')).toBeInTheDocument();

      // Confirm sync
      const confirmButton = screen.getByRole('button', { name: /Konfirmasi dan sinkron/i });
      fireEvent.click(confirmButton);
      expect(onConfirmSync).toHaveBeenCalledTimes(1);
    });
  });
});
