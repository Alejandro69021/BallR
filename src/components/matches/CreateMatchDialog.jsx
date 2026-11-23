import React, { useState } from 'react';
import Dialog from '../ui/Dialog';
import Field from '../ui/Field';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  createMatch,
  PITCH_DEFAULTS_BY_FORMAT,
  formatMatchError
} from '../../lib/matches';

function CreateMatchForm({
  isOpen,
  onClose,
  onSuccess,
  players = [],
  onToast
}) {
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [competition, setCompetition] = useState('');
  const [format, setFormat] = useState('11v11');
  const [pitchLength, setPitchLength] = useState(90);
  const [pitchWidth, setPitchWidth] = useState(60);
  const [selectedParticipants, setSelectedParticipants] = useState(() => {
    const initialParticipants = {};
    if (players && players.length > 0) {
      players.forEach((p, idx) => {
        const pid = p.player_id || p.public_id;
        initialParticipants[pid] = {
          selected: true,
          started: idx < 11,
          position: p.personal_info?.position || ''
        };
      });
    }
    return initialParticipants;
  });
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleFormatChange = (e) => {
    const nextFormat = e.target.value;
    setFormat(nextFormat);
    const defaults = PITCH_DEFAULTS_BY_FORMAT[nextFormat] || { pitch_length_m: 90, pitch_width_m: 60 };
    setPitchLength(defaults.pitch_length_m);
    setPitchWidth(defaults.pitch_width_m);
  };

  const handleToggleParticipant = (pid) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        selected: !prev[pid]?.selected
      }
    }));
  };

  const handleToggleStarter = (pid) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        started: !prev[pid]?.started
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!opponentName.trim()) {
      setCreateError('Nama lawan wajib diisi');
      return;
    }
    if (!matchDate) {
      setCreateError('Tanggal pertandingan wajib diisi');
      return;
    }

    setSubmitting(true);
    setCreateError(null);

    try {
      const participantsList = Object.entries(selectedParticipants)
        .filter(([, val]) => val?.selected)
        .map(([pid, val]) => ({
          player_id: pid,
          started: Boolean(val?.started),
          position: val?.position || '',
          minute_in: val?.started ? 0 : null,
          minute_out: null
        }));

      const newMatch = await createMatch({
        opponent_name: opponentName.trim(),
        match_date: matchDate,
        competition: competition.trim(),
        format,
        pitch_length_m: Number(pitchLength),
        pitch_width_m: Number(pitchWidth),
        participants: participantsList
      });

      onToast?.({
        title: 'Laga Baru Berhasil Dibuat',
        subtext: `Pertandingan melawan ${newMatch.opponent_name} tercatat sebagai draf.`,
        variant: 'success'
      });

      onClose();
      onSuccess?.(newMatch);
    } catch (err) {
      console.warn('Gagal membuat pertandingan:', err);
      const indonesianError = formatMatchError(err);
      setCreateError(indonesianError);
      onToast?.({
        title: 'Gagal Membuat Laga',
        subtext: indonesianError,
        variant: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Laga baru"
      description="Catat jadwal dan konfigurasi teknis pertandingan akademi."
      onSubmit={handleSubmit}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="sm"
            loading={submitting}
          >
            Buat laga
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama tim lawan" id="opponent-name" required error={createError}>
          <input
            id="opponent-name"
            type="text"
            required
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="Contoh: SSB Bintang Muda"
            className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tanggal pertandingan" id="match-date" required>
            <input
              id="match-date"
              type="date"
              required
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
          </Field>

          <Field label="Nama kompetisi / ajang" id="match-competition">
            <input
              id="match-competition"
              type="text"
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              placeholder="Contoh: Liga Remaja U-13"
              className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Format pertandingan" id="match-format" required>
            <Select
              id="match-format"
              value={format}
              onChange={handleFormatChange}
              options={[
                { value: '5v5', label: '5v5 (Futsal / Mini)' },
                { value: '7v7', label: '7v7 (Grassroots)' },
                { value: '9v9', label: '9v9 (Peralihan)' },
                { value: '11v11', label: '11v11 (Standar Penuh)' }
              ]}
            />
          </Field>

          <Field label="Panjang lapangan (m)" id="pitch-length" required helper="Min 20 m, maks 120 m">
            <input
              id="pitch-length"
              type="number"
              min="20"
              max="120"
              step="0.5"
              required
              value={pitchLength}
              onChange={(e) => setPitchLength(e.target.value)}
              className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
          </Field>

          <Field label="Lebar lapangan (m)" id="pitch-width" required helper="Min 15 m, maks 90 m">
            <input
              id="pitch-width"
              type="number"
              min="15"
              max="90"
              step="0.5"
              required
              value={pitchWidth}
              onChange={(e) => setPitchWidth(e.target.value)}
              className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-8 bg-app border border-control rounded-control text-sm font-mono tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            />
          </Field>
        </div>

        <p className="text-sm text-2">
          Ukuran awal hanya contoh; isi sesuai lapangan sebenarnya (meter).
        </p>

        {/* Participants picker from roster */}
        <div className="space-y-2 pt-2 border-t border-line">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-2">Pemain yang bertanding (skuad)</label>
            <span className="text-sm text-2 font-mono">
              {Object.values(selectedParticipants).filter((v) => v?.selected).length} terpilih
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-line border border-line rounded-control bg-app p-2 space-y-1">
            {players && players.length > 0 ? (
              players.map((p) => {
                const pid = p.player_id || p.public_id;
                const part = selectedParticipants[pid] || { selected: false, started: false };
                const num = p.personal_info?.jersey_number ?? '-';
                const name = p.personal_info?.nickname || p.personal_info?.full_name || pid;
                const pos = p.personal_info?.position || '-';

                return (
                  <div
                    key={pid}
                    className="flex items-center justify-between py-1 px-1.5 hover:bg-raised/40 rounded transition-colors text-sm"
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                      <input
                        type="checkbox"
                        checked={Boolean(part.selected)}
                        onChange={() => handleToggleParticipant(pid)}
                        className="rounded border-control text-brand focus:ring-brand"
                      />
                      <span className="font-mono text-2 w-6 text-right shrink-0">#{num}</span>
                      <span className="font-medium text-1 truncate">{name}</span>
                      <Badge variant="neutral" size="sm">{pos}</Badge>
                    </label>

                    {part.selected && (
                      <label className="flex items-center gap-1.5 cursor-pointer text-2 hover:text-1 select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(part.started)}
                          onChange={() => handleToggleStarter(pid)}
                          className="rounded border-control text-brand focus:ring-brand"
                        />
                        <span>Starter</span>
                      </label>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-2 py-2 text-center">Belum ada pemain di skuad</p>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * CreateMatchDialog
 * Shared dialog for creating a new match from Home or Matches page.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {(match: object) => void} [onSuccess]
 * @param {Array<object>} [players]
 * @param {(toast: object) => void} [onToast]
 */
export default function CreateMatchDialog({
  isOpen,
  onClose,
  onSuccess,
  players = [],
  onToast
}) {
  if (!isOpen) return null;

  return (
    <CreateMatchForm
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      players={players}
      onToast={onToast}
    />
  );
}
