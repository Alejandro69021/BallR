import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SquadHubView from '../components/SquadHubView';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Dialog from '../components/ui/Dialog';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import Select from '../components/ui/Select';
import { usePlayers } from '../hooks/usePlayers';

const EMPTY_FORM = {
  full_name: '',
  nickname: '',
  jersey_number: '',
  position: 'CM',
  preferred_foot: 'Kanan',
  age: '13',
  age_group: 'U-13',
  height_cm: '',
  weight_kg: '',
  team_name: 'Mataram Putra Football Academy'
};

export default function SquadPage({ userRole, onOpenAuthModal, onOpenPinModal, onToast }) {
  const navigate = useNavigate();
  const { players, loading, addPlayer } = usePlayers();
  const openModal = onOpenAuthModal || onOpenPinModal;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  if (loading) return <LoadingSkeleton />;

  const handleViewPassport = (playerId) => {
    const player = players.find((p) => p.player_id === playerId);
    const targetId = player?.public_id || playerId;
    navigate(`/pemain/${targetId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEvaluatePlayer = (playerId) => {
    if (userRole !== 'coach' && userRole !== 'admin') {
      if (openModal) openModal(`assessment:${playerId}`);
    } else {
      navigate(`/penilaian/${playerId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setIsAddOpen(true);
  };

  const handleSavePlayer = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setFormError('Nama lengkap pemain wajib diisi.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const created = await addPlayer(form);
      setIsAddOpen(false);
      onToast?.({
        title: 'Pemain ditambahkan',
        subtext: `${created.personal_info.full_name} berhasil masuk ke direktori skuad.`
      });
    } catch (err) {
      setFormError(err?.message || 'Gagal menambahkan pemain baru.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SquadHubView
        players={players}
        userRole={userRole}
        onViewPassport={handleViewPassport}
        onEvaluatePlayer={handleEvaluatePlayer}
        onAddPlayer={handleOpenAdd}
      />

      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Pemain ke Skuad"
        description="Masukkan data pemain dan nama tim akademi secara manual."
        onSubmit={handleSavePlayer}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
              disabled={!form.full_name.trim()}
            >
              Simpan pemain
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <Field label="Nama tim atau akademi" id="add-team-name">
            <input
              id="add-team-name"
              type="text"
              value={form.team_name}
              onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))}
              placeholder="Contoh: AMS Seyegan U-13"
              className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nama lengkap" id="add-full-name" required error={formError}>
              <input
                id="add-full-name"
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Contoh: Landung Herdan Hutomo"
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </Field>

            <Field label="Nama panggilan" id="add-nickname">
              <input
                id="add-nickname"
                type="text"
                value={form.nickname}
                onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                placeholder="Contoh: Landung"
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm text-1 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="No. punggung" id="add-jersey">
              <input
                id="add-jersey"
                type="number"
                min="1"
                max="99"
                value={form.jersey_number}
                onChange={(e) => setForm((f) => ({ ...f, jersey_number: e.target.value }))}
                placeholder="6"
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm font-mono text-1 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </Field>

            <Field label="Posisi" id="add-position">
              <Select
                id="add-position"
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                className="w-full text-sm"
              >
                <option value="GK">Kiper · GK</option>
                <option value="CB">Bek tengah · CB</option>
                <option value="RB">Bek kanan · RB</option>
                <option value="LB">Bek kiri · LB</option>
                <option value="CDM">Gelandang bertahan · CDM</option>
                <option value="CM">Gelandang tengah · CM</option>
                <option value="CAM">Gelandang serang · CAM</option>
                <option value="RW">Sayap kanan · RW</option>
                <option value="LW">Sayap kiri · LW</option>
                <option value="ST">Penyerang tengah · ST</option>
              </Select>
            </Field>

            <Field label="Usia" id="add-age">
              <input
                id="add-age"
                type="number"
                min="6"
                max="23"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                placeholder="13"
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm font-mono text-1 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Kaki dominan" id="add-foot">
              <Select
                id="add-foot"
                value={form.preferred_foot}
                onChange={(e) => setForm((f) => ({ ...f, preferred_foot: e.target.value }))}
                className="w-full text-sm"
              >
                <option value="Kanan">Kaki kanan</option>
                <option value="Kiri">Kaki kiri</option>
                <option value="Keduanya">Kedua kaki</option>
              </Select>
            </Field>

            <Field label="Tinggi cm" id="add-height">
              <input
                id="add-height"
                type="number"
                min="100"
                max="220"
                value={form.height_cm}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                placeholder="160"
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm font-mono text-1 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </Field>

            <Field label="Berat kg" id="add-weight">
              <input
                id="add-weight"
                type="number"
                min="20"
                max="120"
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                placeholder="48"
                className="w-full px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm font-mono text-1 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </Field>
          </div>
        </div>
      </Dialog>
    </>
  );
}
