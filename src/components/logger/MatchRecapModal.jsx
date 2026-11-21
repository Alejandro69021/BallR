import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { EVENT_TYPE_LABELS, formatMatchError } from '../../lib/matches';

export default function MatchRecapModal({
  match,
  events = [],
  outbox = [],
  playerMap = {},
  onClose,
  onFinaliseMatch,
  onFlushOutbox,
  isFlushing = false
}) {
  const allEvents = useMemo(() => [...events, ...outbox], [events, outbox]);
  const hasPendingOutbox = outbox.length > 0;

  // Finalise sub-dialog state
  const [isFinaliseOpen, setIsFinaliseOpen] = useState(false);
  const [ownScoreInput, setOwnScoreInput] = useState('');
  const [oppScoreInput, setOppScoreInput] = useState('');
  const [finalising, setFinalising] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const loggedGoals = useMemo(() => {
    let own = 0;
    let opp = 0;
    allEvents.forEach((e) => {
      if (e.event_type === 'goal') {
        if (e.team === 'own') own++;
        else if (e.team === 'opponent') opp++;
      }
    });
    return { own, opp };
  }, [allEvents]);

  // Group counts per event type
  const eventCountsByType = useMemo(() => {
    const counts = {};
    allEvents.forEach((evt) => {
      const type = evt.event_type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allEvents]);

  // Group counts per player
  const eventCountsByPlayer = useMemo(() => {
    const counts = {};
    let opponentEvents = 0;

    allEvents.forEach((evt) => {
      if (evt.team === 'own' && evt.player_id) {
        counts[evt.player_id] = (counts[evt.player_id] || 0) + 1;
      } else if (evt.team === 'opponent') {
        opponentEvents += 1;
      }
    });

    const ownList = Object.entries(counts)
      .map(([pid, count]) => {
        const info = playerMap[pid] || { name: pid, number: '-' };
        return {
          id: pid,
          name: info.name,
          number: info.number,
          count
        };
      })
      .sort((a, b) => b.count - a.count);

    return { ownList, opponentEvents };
  }, [allEvents, playerMap]);

  const handleFinaliseSubmit = async (e) => {
    e.preventDefault();
    if (hasPendingOutbox) {
      setErrorMessage(
        'Tidak dapat menyelesaikan laga: masih ada kejadian di outbox yang belum tersinkron ke server.'
      );
      return;
    }

    if (ownScoreInput === '' || oppScoreInput === '') {
      setErrorMessage('Skor tim sendiri dan lawan wajib diisi');
      return;
    }

    const own = Number(ownScoreInput);
    const opp = Number(oppScoreInput);
    if (isNaN(own) || isNaN(opp) || own < 0 || opp < 0) {
      setErrorMessage('Skor harus berupa angka positif atau nol');
      return;
    }

    setFinalising(true);
    setErrorMessage(null);

    try {
      await onFinaliseMatch?.(own, opp);
      setIsFinaliseOpen(false);
      onClose();
    } catch (err) {
      setErrorMessage(formatMatchError(err));
    } finally {
      setFinalising(false);
    }
  };

  return (
    <>
      <Dialog
        isOpen={true}
        onClose={onClose}
        title="Ringkasan kejadian pertandingan"
        description={`vs ${match?.opponent_name || 'Lawan'} (${match?.format || '11v11'}) · Total ${allEvents.length} kejadian`}
        className="max-w-lg"
        footer={
          <div className="flex items-center gap-2 w-full justify-between">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Kembali ke logger
            </Button>

            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={hasPendingOutbox}
              onClick={() => setIsFinaliseOpen(true)}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Selesaikan laga
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-1">
          {/* Outbox Status Warning / Confirmation */}
          {hasPendingOutbox ? (
            <div className="p-3.5 rounded-control bg-warning/10 border border-warning/30 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-warning">
                  Menunggu sinkronisasi: {outbox.length} kejadian
                </p>
                <p className="text-2">
                  Laga belum dapat diselesaikan karena masih ada rekaman di outbox lokal. Harap sinkronkan terlebih dahulu ke server.
                </p>
                {onFlushOutbox && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={isFlushing}
                    onClick={onFlushOutbox}
                    className="mt-1"
                  >
                    Sinkronkan outbox sekarang
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-control bg-raised border border-line flex items-center justify-between text-xs">
              <span className="text-2">Status sinkronisasi server:</span>
              <Badge variant="brand" size="sm">
                Semua {events.length} kejadian tersimpan di {import.meta.env?.VITE_DEMO_MODE === 'true' ? 'perangkat (mode demo)' : 'server'}
              </Badge>
            </div>
          )}

          {/* Event Distribution per Type */}
          <div className="p-3.5 rounded-control bg-panel border border-line space-y-2">
            <h4 className="text-xs font-semibold text-1">
              Distribusi per jenis kejadian
            </h4>
            {eventCountsByType.length === 0 ? (
              <p className="text-xs text-2">Belum ada kejadian tercatat.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {eventCountsByType.map(([type, count]) => (
                  <div
                    key={type}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-control bg-raised border border-line text-xs"
                  >
                    <span className="text-1 font-medium">
                      {EVENT_TYPE_LABELS[type] || type}
                    </span>
                    <span className="font-mono tabular-nums text-2">n = {count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Player Engagement Breakdown */}
          <div className="p-3.5 rounded-control bg-panel border border-line space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-1">
                Keterlibatan per pemain
              </h4>
              <span className="text-xs font-mono tabular-nums text-2">
                Lawan n = {eventCountsByPlayer.opponentEvents}
              </span>
            </div>

            {eventCountsByPlayer.ownList.length === 0 ? (
              <p className="text-xs text-2">Belum ada pemain terlibat.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {eventCountsByPlayer.ownList.map((p) => (
                  <div
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-control bg-raised border border-line text-xs"
                  >
                    <span className="font-mono text-2">#{p.number}</span>
                    <span className="text-1 font-medium">{p.name}</span>
                    <span className="font-mono tabular-nums text-brand font-semibold">
                      n = {p.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Selesaikan laga Finalise Score Dialog */}
      <Dialog
        isOpen={isFinaliseOpen}
        onClose={() => setIsFinaliseOpen(false)}
        title="Selesaikan laga"
        description="Masukkan skor akhir untuk memfinalkan pertandingan ini. Pertandingan final tidak dapat diubah kecuali dibuka kembali oleh admin."
        onSubmit={handleFinaliseSubmit}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFinaliseOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              loading={finalising}
              disabled={hasPendingOutbox || ownScoreInput === '' || oppScoreInput === ''}
            >
              Simpan & finalkan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Skor tim sendiri" id="recap-score-own" required error={errorMessage}>
              <input
                id="recap-score-own"
                type="number"
                min="0"
                required
                value={ownScoreInput}
                onChange={(e) => setOwnScoreInput(e.target.value)}
                className="w-full px-3 h-8 bg-app border border-control rounded-control text-xs font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>

            <Field label="Skor tim lawan" id="recap-score-opp" required>
              <input
                id="recap-score-opp"
                type="number"
                min="0"
                required
                value={oppScoreInput}
                onChange={(e) => setOppScoreInput(e.target.value)}
                className="w-full px-3 h-8 bg-app border border-control rounded-control text-xs font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-control bg-raised border border-line text-xs">
            <span className="text-2 font-mono">
              Gol tercatat: {loggedGoals.own} / {loggedGoals.opp} (mungkin belum lengkap)
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setOwnScoreInput(String(loggedGoals.own));
                setOppScoreInput(String(loggedGoals.opp));
              }}
            >
              Pakai angka ini
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
