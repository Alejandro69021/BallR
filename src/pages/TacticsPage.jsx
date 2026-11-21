import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Compass, Search } from 'lucide-react';
import {
  listScenarios,
  createScenario,
  SCENARIO_PHASE_OPTIONS,
  SCENARIO_PHASE_LABELS,
  SCENARIO_STATUS_LABELS,
  FORMAT_OPTIONS,
  formatScenarioError
} from '../lib/scenarios';
import { formationTemplates, TEMPLATE_DISCLAIMER } from '../lib/board';
import Table from '../components/ui/Table';
import ResponsiveList from '../components/ui/ResponsiveList';
import Dialog from '../components/ui/Dialog';
import Field from '../components/ui/Field';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function TacticsPage({ userRole = 'public', onToast, onOpenAuthModal }) {
  const navigate = useNavigate();
  const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin';

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('all');
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // "Skema baru" modal form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPhase, setNewPhase] = useState('build_up');
  const [newFormat, setNewFormat] = useState('11v11');
  const [newFormation, setNewFormation] = useState('4-3-3');
  const [newPitchLength, setNewPitchLength] = useState(90);
  const [newPitchWidth, setNewPitchWidth] = useState(60);
  const [newDescription, setNewDescription] = useState('');
  const [newCoachingPoints, setNewCoachingPoints] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Available formations for the selected format
  const availableFormations = useMemo(() => {
    const templates = formationTemplates(newFormat, {
      pitch_length_m: newPitchLength,
      pitch_width_m: newPitchWidth
    });
    return Object.keys(templates).map((key) => ({
      value: key,
      label: key
    }));
  }, [newFormat, newPitchLength, newPitchWidth]);

  // Handle format change in create modal: update pitch dimensions defaults & formation
  const handleFormatChange = (fmt) => {
    setNewFormat(fmt);
    let len = 90;
    let wid = 60;
    if (fmt === '5v5') {
      len = 40;
      wid = 25;
    } else if (fmt === '7v7') {
      len = 60;
      wid = 40;
    } else if (fmt === '9v9') {
      len = 75;
      wid = 50;
    }
    setNewPitchLength(len);
    setNewPitchWidth(wid);

    const tmps = formationTemplates(fmt, { pitch_length_m: len, pitch_width_m: wid });
    const firstKey = Object.keys(tmps)[0] || '';
    setNewFormation(firstKey);
  };

  const loadScenariosList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listScenarios();
      setScenarios(data || []);
    } catch (err) {
      console.warn('Gagal memuat skema taktik:', err);
      onToast?.({
        title: 'Gagal Memuat Skema Taktik',
        subtext: formatScenarioError(err),
        variant: 'error'
      });
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    if (isCoachOrAdmin) {
      loadScenariosList();
    }
  }, [isCoachOrAdmin, loadScenariosList]);

  // Handle create submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError('Judul skema wajib diisi');
      return;
    }

    setSubmitting(true);
    setCreateError(null);

    try {
      const created = await createScenario({
        title: newTitle.trim(),
        phase: newPhase,
        format: newFormat,
        formation_own: newFormation,
        pitch_length_m: Number(newPitchLength),
        pitch_width_m: Number(newPitchWidth),
        description: newDescription.trim(),
        coaching_points: newCoachingPoints.trim()
      });

      onToast?.({
        title: 'Skema Taktik Dibuat',
        subtext: `Skema "${created.title}" berhasil dibuat sebagai draf.`
      });

      setIsCreateOpen(false);
      navigate(`/taktik/${created.id}`);
    } catch (err) {
      setCreateError(formatScenarioError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & sort scenarios
  const filteredScenarios = useMemo(() => {
    return scenarios.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPhase =
        selectedPhaseFilter === 'all' || s.phase === selectedPhaseFilter;
      return matchesSearch && matchesPhase;
    });
  }, [scenarios, searchQuery, selectedPhaseFilter]);

  const sortedScenarios = useMemo(() => {
    return [...filteredScenarios].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'updated_at' || sortKey === 'created_at') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredScenarios, sortKey, sortDirection]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  if (!isCoachOrAdmin) {
    return (
      <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-4 max-w-md mx-auto">
        <Compass className="w-10 h-10 text-2 mx-auto" strokeWidth={1.5} />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-1">Akses Terbatas: Pelatih &amp; Admin</h2>
          <p className="text-xs text-2 leading-relaxed">
            Papan taktik dan perancangan skema permainan hanya dapat diakses oleh pelatih atau pengurus akademi yang terotentikasi.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenAuthModal?.('tactics')}
        >
          Masuk sebagai staf akademi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-1">Papan Taktik</h1>
          <p className="text-xs text-2 mt-1">
            Rancang dan simulasikan pergerakan taktik lapangan berlandaskan rujukan kurikulum resmi.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Skema baru
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Field
            icon={<Search className="w-4 h-4 text-2" strokeWidth={1.5} />}
            placeholder="Cari judul skema atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedPhaseFilter}
            onChange={(e) => setSelectedPhaseFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Semua fase permainan' },
              ...SCENARIO_PHASE_OPTIONS
            ]}
          />
        </div>
      </div>

      {/* Scenarios Table */}
      {loading ? (
        <div className="p-8 text-center text-xs text-2 font-mono">
          Memuat daftar skema taktik...
        </div>
      ) : sortedScenarios.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-10 h-10 text-2 mx-auto" strokeWidth={1.5} />}
          title="Belum ada skema taktik"
          description={
            searchQuery || selectedPhaseFilter !== 'all'
              ? 'Tidak ada skema yang cocok dengan filter pencarian.'
              : 'Mulai rancang skema pergerakan taktik pertama untuk tim Anda.'
          }
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => setIsCreateOpen(true)}
            >
              Buat skema baru
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile Sort Control */}
          <div className="flex sm:hidden items-center justify-between gap-2 p-2 rounded-control bg-raised border border-line">
            <span className="text-xs text-2 whitespace-nowrap">Urutkan:</span>
            <Select
              value={sortKey}
              onChange={(e) => handleSort(e.target.value)}
              options={[
                { value: 'updated_at', label: 'Terakhir Diperbarui' },
                { value: 'title', label: 'Judul Skema' },
                { value: 'phase', label: 'Fase Permainan' }
              ]}
              className="text-xs min-h-[44px]"
            />
          </div>

          <ResponsiveList
            columns={[
              {
                key: 'title',
                header: 'Judul Skema',
                sortable: true,
                render: (val, row) => (
                  <div className="space-y-0.5">
                    <div className="font-semibold text-1 hover:text-brand transition-colors">
                      {val || row.title}
                    </div>
                    {row.description && (
                      <div className="text-2 text-xs truncate max-w-xs">
                        {row.description}
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'phase',
                header: 'Fase',
                sortable: true,
                render: (val) => (
                  <span className="text-xs text-1">
                    {SCENARIO_PHASE_LABELS[val] || val}
                  </span>
                )
              },
              {
                key: 'format',
                header: 'Format',
                sortable: true,
                tabular: true,
                render: (val) => (
                  <span className="text-xs font-mono text-2">
                    {val || '11v11'}
                  </span>
                )
              },
              {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (val) => {
                  let variant = 'neutral';
                  if (val === 'published') variant = 'success';
                  else if (val === 'reviewed') variant = 'info';
                  return (
                    <Badge variant={variant} size="sm">
                      {SCENARIO_STATUS_LABELS[val] || val}
                    </Badge>
                  );
                }
              },
              {
                key: 'frames_count',
                header: 'Bingkai',
                tabular: true,
                render: (val) => (
                  <span className="text-xs font-mono tabular-nums text-1">
                    {val || 0}
                  </span>
                )
              },
              {
                key: 'references_count',
                header: 'Rujukan',
                tabular: true,
                render: (val) => (
                  <span className="text-xs font-mono tabular-nums text-1">
                    {val || 0}
                  </span>
                )
              },
              {
                key: 'updated_at',
                header: 'Pembaruan',
                sortable: true,
                tabular: true,
                render: (val) => (
                  <span className="text-xs font-mono text-2">
                    {val
                      ? new Date(val).toLocaleDateString('id-ID')
                      : '-'}
                  </span>
                )
              },
              {
                key: 'actions',
                header: '',
                render: (_val, row) => (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/taktik/${row.id}`)}
                    className="whitespace-nowrap"
                  >
                    Buka skema
                  </Button>
                )
              }
            ]}
            data={sortedScenarios}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            renderCard={(row) => (
              <div className="p-4 rounded-panel border border-line bg-panel space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-1">{row.title}</h3>
                    <div className="text-xs text-2 mt-0.5 space-x-1.5 font-mono">
                      <span>{SCENARIO_PHASE_LABELS[row.phase] || row.phase}</span>
                      <span>•</span>
                      <span>{row.format || '11v11'}</span>
                    </div>
                  </div>
                  <Badge
                    variant={row.status === 'published' ? 'success' : row.status === 'reviewed' ? 'info' : 'neutral'}
                    size="sm"
                  >
                    {SCENARIO_STATUS_LABELS[row.status] || row.status}
                  </Badge>
                </div>

                {row.description && (
                  <p className="text-xs text-2 line-clamp-2">{row.description}</p>
                )}

                <div className="flex items-center justify-between text-xs py-1 border-t border-b border-line font-mono text-2">
                  <span>{row.frames_count || 0} bingkai</span>
                  <span>{row.references_count || 0} rujukan</span>
                  <span>{row.updated_at ? new Date(row.updated_at).toLocaleDateString('id-ID') : '-'}</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center min-h-[44px] whitespace-nowrap"
                  onClick={() => navigate(`/taktik/${row.id}`)}
                >
                  Buka skema
                </Button>
              </div>
            )}
          />
        </div>
      )}

      {/* Skema Baru Modal Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Skema Taktik Baru"
        description="Tentukan parameter pertandingan, format, dan dimensi lapangan sebenarnya."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-control bg-rose-500/10 border border-rose-500/20 text-danger text-xs leading-relaxed">
              {createError}
            </div>
          )}

          {/* Judul skema */}
          <div className="space-y-1">
            <label htmlFor="create-title" className="text-xs font-medium text-1">
              Judul skema <span className="text-danger">*</span>
            </label>
            <input
              id="create-title"
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contoh: Build-up 3-2-4-1 menghadapi blok dua penyerang"
              className="w-full px-3 py-2 text-xs rounded-control bg-app border border-control text-1 placeholder:text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
            />
          </div>

          {/* Fase & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="create-phase" className="text-xs font-medium text-1">
                Fase permainan
              </label>
              <Select
                id="create-phase"
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value)}
                options={SCENARIO_PHASE_OPTIONS}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="create-format" className="text-xs font-medium text-1">
                Format pertandingan
              </label>
              <Select
                id="create-format"
                value={newFormat}
                onChange={(e) => handleFormatChange(e.target.value)}
                options={FORMAT_OPTIONS}
              />
            </div>
          </div>

          {/* Formation Template Select (Explicit label: "Template awal, bukan rekomendasi") */}
          <div className="space-y-1">
            <label htmlFor="create-formation" className="text-xs font-medium text-1 flex items-center justify-between">
              <span>Formasi tim awal</span>
              <span className="text-2 font-mono">{TEMPLATE_DISCLAIMER}</span>
            </label>
            <Select
              id="create-formation"
              value={newFormation}
              onChange={(e) => setNewFormation(e.target.value)}
              options={availableFormations}
            />
          </div>

          {/* Pitch Dimensions with Mandatory Helper Text */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-1">
              Dimensi lapangan (meter)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-length" className="text-xs text-2 block mb-1">
                  Panjang (m)
                </label>
                <input
                  id="create-length"
                  type="number"
                  min="30"
                  max="120"
                  value={newPitchLength}
                  onChange={(e) => setNewPitchLength(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-control bg-app border border-control text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="create-width" className="text-xs text-2 block mb-1">
                  Lebar (m)
                </label>
                <input
                  id="create-width"
                  type="number"
                  min="20"
                  max="90"
                  value={newPitchWidth}
                  onChange={(e) => setNewPitchWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-control bg-app border border-control text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
                />
              </div>
            </div>
            <p className="text-xs text-2 italic pt-1">
              Ukuran awal hanya contoh; isi sesuai lapangan sebenarnya (meter).
            </p>
          </div>

          {/* Description & Coaching Points */}
          <div className="space-y-1">
            <label htmlFor="create-desc" className="text-xs font-medium text-1">
              Deskripsi skema (opsional)
            </label>
            <textarea
              id="create-desc"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Jelaskan tujuan dan konteks skema pergerakan ini..."
              className="w-full px-3 py-2 text-xs rounded-control bg-app border border-control text-1 placeholder:text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="create-coaching" className="text-xs font-medium text-1">
              Poin pembinaan / Coaching points (opsional)
            </label>
            <textarea
              id="create-coaching"
              rows={2}
              value={newCoachingPoints}
              onChange={(e) => setNewCoachingPoints(e.target.value)}
              placeholder="Contoh: 1. Sentuhan pertama membuka ruang. 2. Komunikasi vokal."
              className="w-full px-3 py-2 text-xs rounded-control bg-app border border-control text-1 placeholder:text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !newTitle.trim()}
            >
              {submitting ? 'Menyimpan...' : 'Buat skema'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
