import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoachAssessmentView from '../components/CoachAssessmentView';
import FastPitchLogger from '../components/FastPitchLogger';
import MatchRecapModal from '../components/logger/MatchRecapModal';

describe('B3 Coach Workspace Components Behaviour Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    delete import.meta.env.VITE_DEMO_MODE;
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
    const dummyMatch = {
      id: 'b3-match-1',
      opponent_name: 'Bina Putra FC',
      match_format: '11v11',
      pitch_length_m: 90,
      pitch_width_m: 60,
      status: 'draft'
    };
    const dummyParticipants = [
      {
        player_id: mockPlayer.player_id,
        name: mockPlayer.personal_info.full_name,
        number: 10,
        position: 'MF',
        started: true
      }
    ];

    it('tapping an event button appends exactly one event with minute and type', async () => {
      render(
        <FastPitchLogger
          match={dummyMatch}
          participants={dummyParticipants}
          onFinishMatch={vi.fn()}
          onToast={vi.fn()}
        />
      );

      // Tap Umpan akurat button
      const passButton = screen.getByRole('button', { name: /Umpan akurat/i });
      fireEvent.click(passButton);

      // Verify event is registered in outbox and stream
      await waitFor(() => {
        expect(screen.getByText(/Menunggu sinkron: 1/i)).toBeInTheDocument();
        expect(screen.getByText('Sukses')).toBeInTheDocument();
      });
    });

    it('undo button removes the last logged event from outbox', async () => {
      const onToast = vi.fn();
      render(
        <FastPitchLogger
          match={dummyMatch}
          participants={dummyParticipants}
          onFinishMatch={vi.fn()}
          onToast={onToast}
        />
      );

      // Tap Tekel berhasil button
      const tackleBtn = screen.getByRole('button', { name: /Tekel berhasil/i });
      fireEvent.click(tackleBtn);

      await waitFor(() => {
        expect(screen.getByText(/Menunggu sinkron: 1/i)).toBeInTheDocument();
      });

      const undoButton = screen.getByRole('button', { name: /Batalkan aksi terakhir/i });
      expect(undoButton).toBeEnabled();

      fireEvent.click(undoButton);

      await waitFor(() => {
        expect(onToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Aksi Terakhir Dibatalkan' })
        );
      });
    });

    it('recap modal displays honest event distribution and controls finalise', () => {
      const onFinalise = vi.fn();
      const mockEvents = [
        {
          id: 'e1',
          match_id: dummyMatch.id,
          event_type: 'pass',
          outcome: 'success',
          player_id: mockPlayer.player_id,
          period: 1,
          minute: 10.0
        },
        {
          id: 'e2',
          match_id: dummyMatch.id,
          event_type: 'shot',
          outcome: 'goal',
          player_id: mockPlayer.player_id,
          period: 1,
          minute: 15.0
        }
      ];

      render(
        <MatchRecapModal
          match={dummyMatch}
          events={mockEvents}
          outbox={[]}
          participants={dummyParticipants}
          isOpen={true}
          onClose={vi.fn()}
          onFinalise={onFinalise}
        />
      );

      // Check modal heading and opponent
      expect(screen.getByText(/Ringkasan kejadian pertandingan/i)).toBeInTheDocument();
      expect(screen.getByText(/Bina Putra FC/i)).toBeInTheDocument();

      // Check honest distribution text
      expect(screen.getByText(/Semua 2 kejadian tersimpan di/i)).toBeInTheDocument();

      // Finalise button should be enabled when outbox is empty
      const finaliseBtn = screen.getByRole('button', { name: /Selesaikan laga/i });
      expect(finaliseBtn).toBeEnabled();
    });
  });
});
