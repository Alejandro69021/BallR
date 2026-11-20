import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listScenarios,
  getScenario,
  createScenario,
  updateScenario,
  saveFrames,
  setReferences,
  requestReview,
  publish,
  backToDraft,
  deleteScenario,
  formatScenarioError
} from '../lib/scenarios';
import { REFERENCES_REGISTRY } from '../data/references';

describe('scenarios.js data layer (demo mode & error translations)', () => {
  beforeEach(() => {
    localStorage.clear();
    import.meta.env.VITE_DEMO_MODE = 'true';
    vi.restoreAllMocks();
  });

  describe('Initial Demo Store Seeding', () => {
    it('seeds exactly one draft scenario with 3 frames and 1 reference', async () => {
      const list = await listScenarios();
      expect(list.length).toBe(1);
      const first = list[0];
      expect(first.title).toBe('Contoh: build-up 3-2-4-1 (ilustrasi)');
      expect(first.status).toBe('draft');
      expect(first.frames_count).toBe(3);
      expect(first.references_count).toBe(1);

      const detail = await getScenario(first.id);
      expect(detail).toBeDefined();
      expect(detail.frames.length).toBe(3);
      expect(detail.references.length).toBe(1);
      expect(detail.references[0].reference_id).toBe('fifa-tcp-spiralling-up');

      // Verify that attached reference exists in REFERENCES_REGISTRY
      const regIds = new Set(REFERENCES_REGISTRY.map((r) => r.id));
      expect(regIds.has(detail.references[0].reference_id)).toBe(true);
    });
  });

  describe('Scenario CRUD Operations', () => {
    it('creates a new scenario with frame 0 initialized from template', async () => {
      const created = await createScenario({
        title: 'Skema Transisi Bertahan',
        phase: 'transition_defence',
        format: '11v11',
        formation_own: '4-3-3',
        pitch_length_m: 90,
        pitch_width_m: 60,
        description: 'Menutup ruang tengah saat kehilangan penguasaan bola.'
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Skema Transisi Bertahan');
      expect(created.status).toBe('draft');

      const detail = await getScenario(created.id);
      expect(detail.frames.length).toBe(1); // Frame 0 initialized
      expect(detail.frames[0].frame_idx).toBe(0);
      expect(detail.frames[0].players.length).toBe(22); // 4-3-3 11v11 has 22 players
    });

    it('updates scenario metadata in draft status', async () => {
      const list = await listScenarios();
      const id = list[0].id;

      const updated = await updateScenario(id, {
        description: 'Deskripsi yang diperbarui'
      });
      expect(updated.description).toBe('Deskripsi yang diperbarui');

      const reloaded = await getScenario(id);
      expect(reloaded.description).toBe('Deskripsi yang diperbarui');
    });

    it('saves updated frames batch and replaces existing frames', async () => {
      const list = await listScenarios();
      const id = list[0].id;

      const newFrames = [
        {
          scenario_id: id,
          frame_idx: 0,
          t_ms: 1500,
          players: [{ id: 'p1', x: 20, y: 30, team: 'own', label: '1' }],
          ball: { x: 20, y: 30 },
          arrows: [],
          note: 'Catatan bingkai 1 baru'
        },
        {
          scenario_id: id,
          frame_idx: 1,
          t_ms: 2500,
          players: [{ id: 'p1', x: 40, y: 30, team: 'own', label: '1' }],
          ball: { x: 40, y: 30 },
          arrows: [],
          note: 'Catatan bingkai 2 baru'
        }
      ];

      const saved = await saveFrames(id, newFrames);
      expect(saved.length).toBe(2);

      const reloaded = await getScenario(id);
      expect(reloaded.frames.length).toBe(2);
      expect(reloaded.frames[0].t_ms).toBe(1500);
      expect(reloaded.frames[1].t_ms).toBe(2500);
    });

    it('validates reference_id against REFERENCES_REGISTRY before setting references', async () => {
      const list = await listScenarios();
      const id = list[0].id;

      // Valid reference
      const validRef = REFERENCES_REGISTRY[0].id;
      const setRes = await setReferences(id, [{ reference_id: validRef, note: 'Rujukan valid' }]);
      expect(setRes.length).toBe(1);

      // Invalid reference
      await expect(
        setReferences(id, [{ reference_id: 'non-existent-reference-id' }])
      ).rejects.toThrow('Rujukan tidak dikenal di registry');
    });
  });

  describe('Workflow: Review, Publish, Back to Draft, Delete', () => {
    it('handles review workflow', async () => {
      const list = await listScenarios();
      const id = list[0].id;

      const reviewed = await requestReview(id);
      expect(reviewed.status).toBe('reviewed');
      expect(reviewed.reviewed_by).toBeDefined();
      expect(reviewed.reviewed_at).toBeDefined();
    });

    it('prevents publishing if no references or no frames', async () => {
      const created = await createScenario({
        title: 'Skema Kosong',
        phase: 'build_up'
      });

      // Clear frames and references
      await saveFrames(created.id, []);
      await setReferences(created.id, []);

      // Attempt publish without frames
      await expect(publish(created.id)).rejects.toThrow(
        'Skema tidak dapat diterbitkan tanpa bingkai (frame)'
      );

      // Add a frame, but still no references
      await saveFrames(created.id, [
        { scenario_id: created.id, frame_idx: 0, t_ms: 2000, players: [], arrows: [] }
      ]);
      await expect(publish(created.id)).rejects.toThrow(
        'Skema tidak dapat diterbitkan tanpa minimal satu rujukan'
      );
    });

    it('publishes successfully when requirements met and freezes content', async () => {
      const list = await listScenarios();
      const id = list[0].id;

      // Seeded scenario already has 3 frames and 1 reference
      const published = await publish(id);
      expect(published.status).toBe('published');

      // Attempting to modify frozen published content throws
      await expect(
        updateScenario(id, { title: 'Ubah Judul' })
      ).rejects.toThrow('Skema yang sudah diterbitkan tidak dapat diubah');

      await expect(
        saveFrames(id, [])
      ).rejects.toThrow('Skema sudah diterbitkan; kembalikan ke draf');

      await expect(
        setReferences(id, [])
      ).rejects.toThrow('Skema sudah diterbitkan; kembalikan ke draf');

      // Attempting to delete published scenario throws
      await expect(deleteScenario(id)).rejects.toThrow(
        'Hanya skema berstatus draf yang dapat dihapus'
      );
    });

    it('reverts published or reviewed scenario back to draft and resets review info', async () => {
      const list = await listScenarios();
      const id = list[0].id;

      await publish(id);
      const reverted = await backToDraft(id);

      expect(reverted.status).toBe('draft');
      expect(reverted.reviewed_by).toBeNull();
      expect(reverted.reviewed_at).toBeNull();

      // Now draft can be deleted
      const deleted = await deleteScenario(id);
      expect(deleted).toBe(true);

      const afterDelete = await getScenario(id);
      expect(afterDelete).toBeNull();
    });
  });

  describe('formatScenarioError Translation', () => {
    it('translates database trigger and constraint errors into Indonesian messages', () => {
      expect(formatScenarioError(new Error('Skema harus ditinjau pelatih terlebih dahulu'))).toContain(
        'Skema harus ditinjau pelatih'
      );
      expect(formatScenarioError(new Error('Peninjau harus pelatih atau admin dari akademi yang sama'))).toContain(
        'Peninjau harus pelatih atau admin'
      );
      expect(formatScenarioError(new Error('Peninjau harus berbeda dari pembuat skema'))).toContain(
        'Peninjau harus berbeda dari pembuat skema'
      );
      expect(formatScenarioError(new Error('Skema tidak dapat diterbitkan tanpa minimal satu rujukan'))).toContain(
        'tanpa minimal satu rujukan'
      );
      expect(formatScenarioError(new Error('Skema tidak dapat diterbitkan tanpa bingkai'))).toContain(
        'tanpa bingkai'
      );
      expect(formatScenarioError(new Error('Skema yang sudah diterbitkan tidak dapat diubah'))).toContain(
        'sudah diterbitkan tidak dapat diubah'
      );
    });
  });
});
