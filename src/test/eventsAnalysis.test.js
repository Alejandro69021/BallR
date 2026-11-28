import { describe, it, expect } from 'vitest';
import {
  METRIC_DEFINITIONS,
  getMetricDefinition,
  countsByType,
  countsByTeam,
  countsByPlayer,
  passStats,
  shotStats,
  thirds,
  zoneGrid,
  ppda,
  dataQuality,
  fieldTilt,
  corridorDistribution,
  defensiveLineHeight,
  shotZones,
  transitionMetrics,
  timeIntervals,
  buildTacticalSummary
} from '../lib/analysis/events';

describe('Event Analysis Pure Engine (events.js)', () => {
  const dummyEvents = [
    { id: 'e1', client_event_id: 'c1', team: 'own', player_id: 'p1', event_type: 'pass', outcome: 'success', x_m: 20, y_m: 10, period: 1, minute: 5 },
    { id: 'e2', client_event_id: 'c2', team: 'own', player_id: 'p1', event_type: 'pass', outcome: 'fail', x_m: 45, y_m: 25, period: 1, minute: 12 },
    { id: 'e3', client_event_id: 'c3', team: 'own', player_id: 'p1', event_type: 'key_pass', outcome: 'success', x_m: 65, y_m: 30, period: 1, minute: 18 },
    { id: 'e4', client_event_id: 'c4', team: 'own', player_id: 'p1', event_type: 'shot', outcome: 'fail', x_m: 75, y_m: 30, period: 1, minute: 20 },
    { id: 'e5', client_event_id: 'c5', team: 'own', player_id: 'p1', event_type: 'shot_on_target', outcome: 'success', x_m: 80, y_m: 28, period: 2, minute: 55 },
    { id: 'e6', client_event_id: 'c6', team: 'own', player_id: 'p1', event_type: 'goal', outcome: 'success', x_m: 85, y_m: 30, period: 2, minute: 60 },
    { id: 'e7', client_event_id: 'c7', team: 'own', player_id: 'p2', event_type: 'tackle', outcome: 'success', x_m: 38, y_m: 20, period: 1, minute: 10 },
    { id: 'e8', client_event_id: 'c8', team: 'own', player_id: 'p2', event_type: 'interception', outcome: 'success', x_m: 50, y_m: 25, period: 2, minute: 70 },
    { id: 'e9', client_event_id: 'c9', team: 'opponent', player_id: null, opponent_number: 10, event_type: 'pass', outcome: 'success', x_m: 40, y_m: 30, period: 1, minute: 15 },
    { id: 'e10', client_event_id: 'c10', team: 'opponent', player_id: null, opponent_number: 9, event_type: 'shot', outcome: 'fail', x_m: null, y_m: null, period: 2, minute: 85 }
  ];

  const dummyParticipants = [
    { player_id: 'p1', jersey_number: 10, player_name: 'Budi Handoko', position: 'AM', minutes_played: 90, is_starter: true },
    { player_id: 'p2', jersey_number: 4, player_name: 'Agus Pratama', position: 'CB', minutes_played: 90, is_starter: true },
    { player_id: 'p3', jersey_number: 7, player_name: 'Candra Wijaya', position: 'RW', minutes_played: 15, is_starter: false }
  ];

  describe('1. METRIC_DEFINITIONS Registry', () => {
    it('defines 14 metric registry entries with honest definitions and limitations', () => {
      expect(METRIC_DEFINITIONS.length).toBe(14);
      METRIC_DEFINITIONS.forEach((m) => {
        expect(m.id).toBeDefined();
        expect(m.name).toBeDefined();
        expect(m.definition).toBeDefined();
        expect(m.formula).toBeDefined();
        expect(m.unit).toBeDefined();
        expect(m.limitations).toBeDefined();
        expect(Array.isArray(m.reference_ids)).toBe(true);
      });
    });

    it('PPDA metric specifically references Trainor (2014)', () => {
      const ppdaDef = getMetricDefinition('ppda');
      expect(ppdaDef).not.toBeNull();
      expect(ppdaDef.reference_ids).toContain('trainor-ppda-2014');
      expect(ppdaDef.unit).toBe('rasio');
    });
  });

  describe('2. countsByType & countsByTeam', () => {
    it('counts occurrences of each event type with n and unit', () => {
      const res = countsByType(dummyEvents);
      expect(res.n).toBe(10);
      expect(res.unit).toBe('kejadian');

      const passRow = res.rows.find((r) => r.event_type === 'pass');
      expect(passRow).toBeDefined();
      expect(passRow.count).toBe(3); // 2 own + 1 opp
      expect(passRow.unit).toBe('kejadian');
      expect(passRow.n).toBe(10);
    });

    it('splits counts by own and opponent with n and unit', () => {
      const res = countsByTeam(dummyEvents);
      expect(res.n).toBe(10);
      expect(res.own.count).toBe(8);
      expect(res.own.n).toBe(10);
      expect(res.opponent.count).toBe(2);
      expect(res.opponent.n).toBe(10);
    });
  });

  describe('3. countsByPlayer & small-sample flag', () => {
    it('aggregates events per player, sorts by jersey number ascending, and sets small_sample flag', () => {
      const res = countsByPlayer(dummyEvents, dummyParticipants);
      expect(res.rows.length).toBe(3);

      // Jersey 4 (p2) should come first
      expect(res.rows[0].player_id).toBe('p2');
      expect(res.rows[0].jersey_number).toBe(4);
      expect(res.rows[0].n).toBe(2);
      expect(res.rows[0].small_sample).toBe(true); // 2 < 5

      // Jersey 7 (p3) has 0 events
      expect(res.rows[1].player_id).toBe('p3');
      expect(res.rows[1].jersey_number).toBe(7);
      expect(res.rows[1].n).toBe(0);
      expect(res.rows[1].small_sample).toBe(true); // 0 < 5

      // Jersey 10 (p1) has 6 events
      expect(res.rows[2].player_id).toBe('p1');
      expect(res.rows[2].jersey_number).toBe(10);
      expect(res.rows[2].n).toBe(6);
      expect(res.rows[2].small_sample).toBe(true); // 6 < 10 (SMALL_SAMPLE_N)
    });
  });

  describe('4. passStats & shotStats', () => {
    it('computes pass success rate and totals with units', () => {
      // For own team: 2 passes (1 success, 1 fail) + 1 key_pass (1 success) = 3 total, 2 success
      const stats = passStats(dummyEvents, 'own');
      expect(stats.total.value).toBe(3);
      expect(stats.successful.value).toBe(2);
      expect(stats.failed.value).toBe(1);
      expect(stats.value).toBe(66.7); // 2/3 * 100
      expect(stats.n).toBe(3);
      expect(stats.unit).toBe('%');
    });

    it('computes shot accuracy (including goals) with units', () => {
      // For own team: 1 shot (fail), 1 shot_on_target (success), 1 goal (success) = 3 total, 2 on target
      const stats = shotStats(dummyEvents, 'own');
      expect(stats.total.value).toBe(3);
      expect(stats.goals.value).toBe(1);
      expect(stats.on_target.value).toBe(2); // shot_on_target + goal
      expect(stats.off_target.value).toBe(1);
      expect(stats.accuracy_pct.value).toBe(66.7); // 2/3 * 100
      expect(stats.n).toBe(3);
      expect(stats.unit).toBe('tembakan');
    });

    it('returns null rate/accuracy when 0 passes or shots occur', () => {
      const pStats = passStats([], 'own');
      expect(pStats.value).toBeNull();
      expect(pStats.n).toBe(0);

      const sStats = shotStats([], 'own');
      expect(sStats.accuracy_pct.value).toBeNull();
      expect(sStats.n).toBe(0);
    });
  });

  describe('5. thirds with Boundary Testing', () => {
    it('accurately categorizes x coordinates into defensive, middle, and final thirds', () => {
      const L = 90;
      // Boundaries:
      // def: x/L < 1/3 (x < 30)
      // mid: 1/3 <= x/L < 2/3 (30 <= x < 60)
      // fin: x/L >= 2/3 (x >= 60)
      const boundaryEvents = [
        { team: 'own', x_m: 0 },       // def (0 < 30)
        { team: 'own', x_m: 29.9 },    // def
        { team: 'own', x_m: 30.0 },    // mid (30 >= 30)
        { team: 'own', x_m: 59.9 },    // mid
        { team: 'own', x_m: 60.0 },    // fin (60 >= 60)
        { team: 'own', x_m: 90.0 },    // fin
        { team: 'own', x_m: null }     // excluded
      ];

      const res = thirds(boundaryEvents, L, 'own');
      expect(res.n).toBe(6);
      expect(res.defensive.count).toBe(2);
      expect(res.middle.count).toBe(2);
      expect(res.final.count).toBe(2);
      expect(res.defensive.value).toBe(33.3);
      expect(res.middle.value).toBe(33.3);
      expect(res.final.value).toBe(33.3);
      expect(res.without_coords.count).toBe(1);
    });
  });

  describe('6. zoneGrid 6x3 with Boundary Testing', () => {
    it('places events in the correct col (0..5) and row (0..2)', () => {
      const len = 90;
      const wid = 60;
      const testEvents = [
        { x_m: 0, y_m: 0 },       // col 0, row 0
        { x_m: 90, y_m: 60 },     // col 5, row 2 (clamped)
        { x_m: 45, y_m: 30 },     // col 3, row 1 (center)
        { x_m: null, y_m: 10 }    // excluded
      ];

      const res = zoneGrid(testEvents, len, wid);
      expect(res.total_with_coords).toBe(3);
      expect(res.without_coords).toBe(1);
      expect(res.matrix[0][0]).toBe(1); // col 0, row 0
      expect(res.matrix[2][5]).toBe(1); // col 5, row 2
      expect(res.matrix[1][3]).toBe(1); // col 3, row 1
    });
  });

  describe('7. PPDA (Trainor, 2014)', () => {
    it('returns null with clear reason when opponent passes with coords < 30', () => {
      const fewEvents = [
        { team: 'opponent', event_type: 'pass', x_m: 40, y_m: 30 },
        { team: 'own', event_type: 'tackle', x_m: 40, y_m: 30 }
      ];

      const res = ppda(fewEvents, 90);
      expect(res.value).toBeNull();
      expect(res.reason).toBe('Butuh minimal 30 umpan lawan berkoordinat');
      expect(res.n).toBe(1);
      expect(res.reference_ids).toContain('trainor-ppda-2014');
    });

    it('computes PPDA ratio when opponent passes >= 30 in zone x >= 0.4*L', () => {
      const L = 100;
      // xThreshold = 0.4 * L = 40m

      const events = [];
      // 35 opponent passes:
      // 20 passes inside zone (x = 50 >= 40)
      for (let i = 0; i < 20; i++) {
        events.push({ team: 'opponent', event_type: 'pass', x_m: 50, y_m: 20 });
      }
      // 15 passes outside zone (x = 20 < 40)
      for (let i = 0; i < 15; i++) {
        events.push({ team: 'opponent', event_type: 'pass', x_m: 20, y_m: 20 });
      }

      // 5 own defensive actions inside zone (x = 60 >= 40)
      events.push({ team: 'own', event_type: 'tackle', x_m: 60, y_m: 20 });
      events.push({ team: 'own', event_type: 'interception', x_m: 60, y_m: 20 });
      events.push({ team: 'own', event_type: 'foul_committed', x_m: 60, y_m: 20 });
      events.push({ team: 'own', event_type: 'duel_ground', x_m: 60, y_m: 20 });
      events.push({ team: 'own', event_type: 'duel_air', x_m: 60, y_m: 20 });

      // 2 own defensive actions outside zone (x = 30 < 40) — should NOT count
      events.push({ team: 'own', event_type: 'tackle', x_m: 30, y_m: 20 });
      events.push({ team: 'own', event_type: 'clearance', x_m: 60, y_m: 20 }); // clearance is not a press action

      const res = ppda(events, L);
      expect(res.n).toBe(35);
      expect(res.opponent_passes_in_zone).toBe(20);
      expect(res.defensive_actions_in_zone).toBe(5);
      expect(res.value).toBe(4.00); // 20 / 5
      expect(res.unit).toBe('rasio');
      expect(res.reason).toBeNull();
    });

    it('returns null with clear reason when 0 defensive actions in zone', () => {
      const L = 100;
      const events = [];
      for (let i = 0; i < 30; i++) {
        events.push({ team: 'opponent', event_type: 'pass', x_m: 50, y_m: 20 });
      }

      const res = ppda(events, L);
      expect(res.value).toBeNull();
      expect(res.reason).toBe('Nol aksi bertahan di area x >= 0.4*L');
    });
  });

  describe('8. dataQuality Summary', () => {
    it('summarizes coordinate coverage, periods, minute ranges, and mandatory honesty statement', () => {
      const res = dataQuality(dummyEvents, {}, dummyParticipants);
      expect(res.total_events.value).toBe(10);
      expect(res.with_coords_count.value).toBe(9);
      expect(res.without_coords_count.value).toBe(1);
      expect(res.coords_pct.value).toBe(90.0);
      expect(res.first_minute.value).toBe(5.0);
      expect(res.last_minute.value).toBe(85.0);
      expect(res.players_with_events_count.value).toBe(2); // p1, p2
      expect(res.players_with_events_count.n).toBe(3); // 3 participants
      expect(res.statement).toBe('Pencatatan manual oleh pelatih; belum diverifikasi silang.');
    });
  });

  describe('9. Evidence-Based Tactical Match Analysis Extensions', () => {
    const tacticalEvents = [
      { id: 't1', team: 'own', event_type: 'pass', outcome: 'success', x_m: 70, y_m: 5, period: 1, minute: 10 },
      { id: 't2', team: 'own', event_type: 'key_pass', outcome: 'success', x_m: 75, y_m: 8, period: 1, minute: 14 },
      { id: 't3', team: 'own', event_type: 'shot_on_target', outcome: 'success', x_m: 80, y_m: 30, period: 1, minute: 20 },
      { id: 't4', team: 'own', event_type: 'shot', outcome: 'fail', x_m: 65, y_m: 30, period: 2, minute: 55 },
      { id: 't5', team: 'own', event_type: 'interception', outcome: 'success', x_m: 68, y_m: 20, period: 1, minute: 25 },
      { id: 't6', team: 'own', event_type: 'ball_loss', outcome: 'fail', x_m: 15, y_m: 30, period: 2, minute: 65 },
      { id: 't7', team: 'opponent', event_type: 'pass', outcome: 'success', x_m: 20, y_m: 55, period: 1, minute: 12 },
      { id: 't8', team: 'opponent', event_type: 'tackle', outcome: 'success', x_m: 72, y_m: 40, period: 2, minute: 78 },
      { id: 't9', team: 'opponent', event_type: 'shot', outcome: 'fail', x_m: 10, y_m: 30, period: 2, minute: 82 }
    ];

    it('computes fieldTilt accurately for final-third passes', () => {
      const res = fieldTilt(tacticalEvents, 90);
      expect(res.own_passes).toBe(2);
      expect(res.opponent_passes).toBe(1);
      expect(res.own_pct).toBe(66.7);
      expect(res.opponent_pct).toBe(33.3);
      expect(res.small_sample).toBe(true);
      expect(res.reference_ids).toContain('fifa-football-language-2022');
    });

    it('computes 5-corridor distribution and dominant channel', () => {
      const ownRes = corridorDistribution(tacticalEvents, 60, 'own');
      expect(ownRes.corridors).toHaveLength(5);
      expect(ownRes.dominant.id).toBe('central');
      const oppRes = corridorDistribution(tacticalEvents, 60, 'opponent');
      expect(oppRes.dominant).not.toBeNull();
    });

    it('computes defensiveLineHeight from each team own goal', () => {
      const ownDef = defensiveLineHeight(tacticalEvents, 90, 'own');
      expect(ownDef.avg_m).toBe(68.0);
      expect(ownDef.n).toBe(1);
      expect(ownDef.block_label).toContain('Blok Tinggi');

      const oppDef = defensiveLineHeight(tacticalEvents, 90, 'opponent');
      expect(oppDef.avg_m).toBe(18.0); // 90 - 72
      expect(oppDef.block_label).toContain('Blok Rendah');
    });

    it('classifies shotZones inside vs outside box with average distance', () => {
      const ownZones = shotZones(tacticalEvents, 90, 60, 'own');
      expect(ownZones.inside_box.count).toBe(1);
      expect(ownZones.outside_box.count).toBe(1);
      expect(ownZones.avg_distance_m).toBe(17.5); // (10 + 25) / 2
      expect(ownZones.reference_ids).toContain('pollard-reep-1997-playing-strategies');

      const oppZones = shotZones(tacticalEvents, 90, 60, 'opponent');
      expect(oppZones.inside_box.count).toBe(1);
      expect(oppZones.avg_distance_m).toBe(10.0);
    });

    it('computes transitionMetrics (high regains & dangerous losses)', () => {
      const res = transitionMetrics(tacticalEvents, 90, 'own');
      expect(res.high_regains).toBe(1);
      expect(res.dangerous_losses).toBe(1);
      expect(res.reference_ids).toContain('vogelbein-2014-defensive-transition');
    });

    it('aggregates 15-minute timeIntervals and builds unified tactical summary', () => {
      const intervals = timeIntervals(tacticalEvents);
      expect(intervals.buckets).toHaveLength(6);
      expect(intervals.buckets[0].own_events).toBe(2);
      expect(intervals.buckets[0].opp_events).toBe(1);

      const summary = buildTacticalSummary(tacticalEvents, 90, 60);
      expect(summary.observations.length).toBeGreaterThan(0);
      summary.observations.forEach((obs) => {
        expect(obs.reference_ids.length).toBeGreaterThan(0);
      });
    });
  });
});
