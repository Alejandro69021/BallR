import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  FileCheck,
  Undo2,
  Trash2,
  Printer,
  Circle,
  Square,
  Compass
} from 'lucide-react';
import {
  getScenario,
  saveFrames,
  setReferences,
  requestReview,
  publish,
  backToDraft,
  deleteScenario,
  formatScenarioError,
  SCENARIO_PHASE_LABELS,
  SCENARIO_STATUS_LABELS
} from '../lib/scenarios';
import {
  interpolateFrame,
  validateFrame
} from '../lib/board';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import TacticalBoard from '../components/tactics/TacticalBoard';
import TimelineStrip from '../components/tactics/TimelineStrip';
import PlaybackBar from '../components/tactics/PlaybackBar';
import ReferencesPanel from '../components/tactics/ReferencesPanel';
import StoryboardPrintView from '../components/tactics/StoryboardPrintView';

export default function TacticsDetailPage({ userRole = 'public', onToast, onOpenAuthModal }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin';

  const [scenario, setScenario] = useState(null);
  const [frames, setFrames] = useState([]);
  const [references, setReferencesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Active view mode: 'board' | 'print'
  const [activeViewMode, setActiveViewMode] = useState('board');

  // Active frame index for editing or viewing
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  // Board selection and tools
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'player' | 'ball', id }
  const [drawingArrowKind, setDrawingArrowKind] = useState(null); // null | 'pass' | 'run' | 'press' | 'cover'
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 1 across whole animation
  const [interpolatedFrame, setInterpolatedFrame] = useState(null);

  // Animation frame ref
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Load scenario data
  const loadScenarioData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getScenario(id);
      if (data) {
        setScenario(data);
        setFrames(data.frames || []);
        setReferencesList(data.references || []);
        setActiveFrameIndex(0);
        setIsDirty(false);
      } else {
        setScenario(null);
      }
    } catch (err) {
      console.warn('Gagal memuat detail skema:', err);
      onToast?.({
        title: 'Gagal Memuat Skema',
        subtext: formatScenarioError(err),
        variant: 'error'
      });
      setScenario(null);
    } finally {
      setLoading(false);
    }
  }, [id, onToast]);

  useEffect(() => {
    if (isCoachOrAdmin) {
      loadScenarioData();
    }
  }, [isCoachOrAdmin, loadScenarioData]);

  // Total animation duration in ms
  const totalDurationMs = useMemo(() => {
    if (frames.length <= 1) return 2000;
    // Each frame transition takes frame.t_ms
    return frames.reduce((acc, f) => acc + (f.t_ms || 2000), 0);
  }, [frames]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      lastTimeRef.current = null;
      setInterpolatedFrame(null);
      return;
    }

    const onFrame = (time) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const deltaMs = (time - lastTimeRef.current) * playbackSpeed;
      lastTimeRef.current = time;

      setPlaybackProgress((prevProg) => {
        const nextTimeMs = prevProg * totalDurationMs + deltaMs;
        let nextProg = nextTimeMs / totalDurationMs;

        if (nextProg >= 1) {
          if (isLooping) {
            nextProg = 0;
          } else {
            setIsPlaying(false);
            return 1;
          }
        }

        // Calculate which pair of frames we are between
        let elapsed = nextProg * totalDurationMs;
        let frameAIdx = 0;
        let frameBIdx = 0;
        let tInFrame = 0;

        let accumulated = 0;
        for (let i = 0; i < frames.length; i++) {
          const dur = frames[i].t_ms || 2000;
          if (elapsed <= accumulated + dur || i === frames.length - 1) {
            frameAIdx = i;
            frameBIdx = (i + 1) % frames.length;
            tInFrame = (elapsed - accumulated) / dur;
            break;
          }
          accumulated += dur;
        }

        const fA = frames[frameAIdx];
        const fB = frames[frameBIdx];
        const interpolated = interpolateFrame(fA, fB, Math.min(1, Math.max(0, tInFrame)), 'easeInOut');
        setInterpolatedFrame(interpolated);

        return nextProg;
      });

      animRef.current = requestAnimationFrame(onFrame);
    };

    animRef.current = requestAnimationFrame(onFrame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, [isPlaying, frames, totalDurationMs, playbackSpeed, isLooping]);

  // Current frame being edited or viewed
  const currentFrame = isPlaying && interpolatedFrame ? interpolatedFrame : frames[activeFrameIndex] || null;
  const isDraft = scenario?.status === 'draft';
  const isEditing = isDraft && !isPlaying && activeViewMode === 'board';

  // Board item updates
  const handleUpdatePlayerPosition = (playerId, x, y) => {
    if (!isEditing) return;
    setFrames((prev) => {
      const copy = [...prev];
      const targetFrame = { ...copy[activeFrameIndex] };
      targetFrame.players = (targetFrame.players || []).map((p) =>
        p.id === playerId ? { ...p, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) } : p
      );
      copy[activeFrameIndex] = targetFrame;
      return copy;
    });
    setIsDirty(true);
  };

  const handleUpdateBallPosition = (x, y) => {
    if (!isEditing) return;
    setFrames((prev) => {
      const copy = [...prev];
      const targetFrame = { ...copy[activeFrameIndex] };
      targetFrame.ball = { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
      copy[activeFrameIndex] = targetFrame;
      return copy;
    });
    setIsDirty(true);
  };

  const handleAddArrow = ({ from, to, kind }) => {
    if (!isEditing) return;
    setFrames((prev) => {
      const copy = [...prev];
      const targetFrame = { ...copy[activeFrameIndex] };
      const currentArrows = targetFrame.arrows || [];
      if (currentArrows.length >= 40) {
        onToast?.({
          title: 'Batas Panah Tercapai',
          subtext: 'Maksimal 40 panah per bingkai sesuai batas kapasitas.',
          variant: 'warning'
        });
        return prev;
      }
      targetFrame.arrows = [
        ...currentArrows,
        {
          from: { x: Number(from.x.toFixed(2)), y: Number(from.y.toFixed(2)) },
          to: { x: Number(to.x.toFixed(2)), y: Number(to.y.toFixed(2)) },
          kind: kind || 'pass'
        }
      ];
      copy[activeFrameIndex] = targetFrame;
      return copy;
    });
    setDrawingArrowKind(null);
    setIsDirty(true);
  };

  // Add new player to current frame
  const handleAddPlayer = (team = 'own') => {
    if (!isEditing) return;
    const currentPlayers = currentFrame?.players || [];
    if (currentPlayers.length >= 24) {
      onToast?.({
        title: 'Batas Pemain Tercapai',
        subtext: 'Maksimal 24 pemain per bingkai.',
        variant: 'warning'
      });
      return;
    }

    const teamPlayers = currentPlayers.filter((p) => p.team === team);
    const nextNumber = teamPlayers.length + 1;
    const pLength = Number(scenario?.pitch_length_m || 90);
    const pWidth = Number(scenario?.pitch_width_m || 60);

    const defaultX = team === 'own' ? pLength * 0.35 : pLength * 0.65;
    const defaultY = (pWidth / 2) + ((nextNumber % 2 === 0 ? 1 : -1) * (nextNumber * 3));

    const newPlayer = {
      id: `${team}-${Date.now()}-${nextNumber}`,
      team,
      label: String(nextNumber),
      role: team === 'own' ? 'P' : 'L',
      x: Number(Math.max(2, Math.min(pLength - 2, defaultX)).toFixed(2)),
      y: Number(Math.max(2, Math.min(pWidth - 2, defaultY)).toFixed(2))
    };

    setFrames((prev) => {
      const copy = [...prev];
      const targetFrame = { ...copy[activeFrameIndex] };
      targetFrame.players = [...(targetFrame.players || []), newPlayer];
      copy[activeFrameIndex] = targetFrame;
      return copy;
    });
    setSelectedItem({ type: 'player', id: newPlayer.id });
    setIsDirty(true);
  };

  // Add or reset ball position
  const handleAddOrResetBall = () => {
    if (!isEditing) return;
    const pLength = Number(scenario?.pitch_length_m || 90);
    const pWidth = Number(scenario?.pitch_width_m || 60);
    handleUpdateBallPosition(pLength / 2, pWidth / 2);
    setSelectedItem({ type: 'ball', id: 'ball' });
  };

  // Delete selected item
  const handleDeleteSelectedItem = () => {
    if (!isEditing || !selectedItem) return;

    if (selectedItem.type === 'player') {
      setFrames((prev) => {
        const copy = [...prev];
        const targetFrame = { ...copy[activeFrameIndex] };
        targetFrame.players = (targetFrame.players || []).filter((p) => p.id !== selectedItem.id);
        copy[activeFrameIndex] = targetFrame;
        return copy;
      });
      setSelectedItem(null);
      setIsDirty(true);
    } else if (selectedItem.type === 'ball') {
      setFrames((prev) => {
        const copy = [...prev];
        const targetFrame = { ...copy[activeFrameIndex] };
        targetFrame.ball = null;
        copy[activeFrameIndex] = targetFrame;
        return copy;
      });
      setSelectedItem(null);
      setIsDirty(true);
    }
  };

  // Frame manipulation
  const handleAddFrame = () => {
    if (!isEditing) return;
    const lastFrame = frames[frames.length - 1] || {};
    const newFrame = {
      scenario_id: scenario.id,
      frame_idx: frames.length,
      t_ms: 2000,
      players: lastFrame.players ? lastFrame.players.map((p) => ({ ...p })) : [],
      ball: lastFrame.ball ? { ...lastFrame.ball } : null,
      arrows: [],
      note: ''
    };
    setFrames((prev) => [...prev, newFrame]);
    setActiveFrameIndex(frames.length);
    setIsDirty(true);
  };

  const handleDuplicateFrame = (idx) => {
    if (!isEditing || !frames[idx]) return;
    const target = frames[idx];
    const dup = {
      scenario_id: scenario.id,
      frame_idx: idx + 1,
      t_ms: target.t_ms || 2000,
      players: (target.players || []).map((p) => ({ ...p })),
      ball: target.ball ? { ...target.ball } : null,
      arrows: (target.arrows || []).map((a) => ({ ...a, from: { ...a.from }, to: { ...a.to } })),
      note: target.note || ''
    };
    const nextFrames = [...frames];
    nextFrames.splice(idx + 1, 0, dup);
    setFrames(nextFrames);
    setActiveFrameIndex(idx + 1);
    setIsDirty(true);
  };

  const handleDeleteFrame = (idx) => {
    if (!isEditing || frames.length <= 1) return;
    const nextFrames = frames.filter((_, i) => i !== idx);
    setFrames(nextFrames);
    setActiveFrameIndex(Math.max(0, idx - 1));
    setIsDirty(true);
  };

  const handleMoveFrame = (fromIdx, toIdx) => {
    if (!isEditing || toIdx < 0 || toIdx >= frames.length) return;
    const nextFrames = [...frames];
    const [moved] = nextFrames.splice(fromIdx, 1);
    nextFrames.splice(toIdx, 0, moved);
    setFrames(nextFrames);
    setActiveFrameIndex(toIdx);
    setIsDirty(true);
  };

  const handleUpdateFrameMeta = (idx, meta) => {
    if (!isEditing || !frames[idx]) return;
    setFrames((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...meta };
      return copy;
    });
    setIsDirty(true);
  };

  // References actions
  const handleAttachReference = async ({ reference_id, note }) => {
    const nextList = [...references, { reference_id, note }];
    setReferencesList(nextList);
    setIsDirty(true);
  };

  const handleRemoveReference = async (refId) => {
    const nextList = references.filter((r) => r.reference_id !== refId);
    setReferencesList(nextList);
    setIsDirty(true);
  };

  const handleUpdateReferenceNote = (refId, note) => {
    const nextList = references.map((r) =>
      r.reference_id === refId ? { ...r, note } : r
    );
    setReferencesList(nextList);
    setIsDirty(true);
  };

  // Save changes
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Validate all frames before saving
      const pitchDims = {
        pitch_length_m: scenario.pitch_length_m,
        pitch_width_m: scenario.pitch_width_m
      };
      for (let i = 0; i < frames.length; i++) {
        validateFrame(frames[i], pitchDims);
      }

      const framesResult = await saveFrames(scenario.id, frames);
      await setReferences(scenario.id, references);

      setIsDirty(false);
      if (framesResult && framesResult.trimWarning) {
        onToast?.({
          title: 'Bingkai Tersimpan',
          subtext: 'Bingkai tersimpan; gagal memangkas bingkai lama. Periksa kembali.',
          variant: 'warning'
        });
      } else {
        onToast?.({
          title: 'Perubahan Disimpan',
          subtext: 'Rangkaian bingkai dan rujukan berhasil diperbarui.'
        });
      }
    } catch (err) {
      console.warn('Gagal menyimpan skema:', err);
      onToast?.({
        title: 'Gagal Menyimpan',
        subtext: formatScenarioError(err),
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Workflow actions
  const handleRequestReview = async () => {
    try {
      if (isDirty) await handleSaveChanges();
      const updated = await requestReview(scenario.id);
      setScenario(updated);
      onToast?.({
        title: 'Tinjauan dicatat',
        subtext: 'Status skema diperbarui menjadi ditinjau pelatih.'
      });
    } catch (err) {
      const errMsg = formatScenarioError(err);
      const isSelfReview =
        errMsg.includes('Peninjau harus berbeda') ||
        errMsg.includes('pembuat skema');
      onToast?.({
        title: 'Gagal mencatat tinjauan',
        subtext: isSelfReview
          ? 'Minta pelatih lain meninjau skema ini'
          : errMsg,
        variant: 'error'
      });
    }
  };

  const handlePublish = async () => {
    try {
      if (isDirty) await handleSaveChanges();
      const updated = await publish(scenario.id);
      setScenario(updated);
      onToast?.({
        title: 'Skema Diterbitkan',
        subtext: 'Skema berhasil diterbitkan dan konten dikunci.'
      });
    } catch (err) {
      onToast?.({
        title: 'Gagal Menerbitkan Skema',
        subtext: formatScenarioError(err),
        variant: 'error'
      });
    }
  };

  const handleBackToDraft = async () => {
    try {
      const updated = await backToDraft(scenario.id);
      setScenario(updated);
      onToast?.({
        title: 'Kembali ke Draf',
        subtext: 'Skema dapat diedit kembali. Tinjauan sebelumnya direset.'
      });
    } catch (err) {
      onToast?.({
        title: 'Gagal Mengubah Status',
        subtext: formatScenarioError(err),
        variant: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Hapus skema "${scenario.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      await deleteScenario(scenario.id);
      onToast?.({
        title: 'Skema Dihapus',
        subtext: 'Skema taktik berhasil dihapus.'
      });
      navigate('/taktik');
    } catch (err) {
      onToast?.({
        title: 'Gagal Menghapus',
        subtext: formatScenarioError(err),
        variant: 'error'
      });
    }
  };

  // Check publish criteria
  const hasFrames = frames.length >= 1;
  const hasReferences = references.length >= 1;
  const canPublish = hasFrames && hasReferences;
  const publishMissingText = !hasFrames
    ? 'Skema membutuhkan minimal satu bingkai gerakan untuk dapat diterbitkan.'
    : !hasReferences
    ? 'Skema membutuhkan minimal satu rujukan metodologi untuk dapat diterbitkan.'
    : null;

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-2">
        Memuat detail skema taktik...
      </div>
    );
  }

  if (!isCoachOrAdmin) {
    return (
      <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-4 max-w-md mx-auto">
        <Compass className="w-10 h-10 text-2 mx-auto" strokeWidth={1.5} />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-1">Akses Terbatas: Pelatih &amp; Admin</h2>
          <p className="text-sm text-2 leading-relaxed">
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

  if (!scenario) {
    return (
      <EmptyState
        title="Skema tidak ditemukan"
        description="Skema taktik yang diminta tidak ada atau sudah dihapus."
        action={
          <Button variant="primary" size="sm" onClick={() => navigate('/taktik')}>
            Kembali ke daftar taktik
          </Button>
        }
      />
    );
  }

  // Print View Rendering
  if (activeViewMode === 'print') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between no-print pb-2 border-b border-line">
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => setActiveViewMode('board')}
          >
            Kembali ke editor
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Printer className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => window.print()}
          >
            Cetak papan taktik (A4)
          </Button>
        </div>

        <StoryboardPrintView
          scenario={scenario}
          frames={frames}
          references={references}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions Bar */}
      <div className="space-y-3 pb-4 border-b border-line">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconButton
              icon={<ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
              label="Kembali ke daftar taktik"
              variant="secondary"
              size="sm"
              onClick={() => navigate('/taktik')}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-1">
                  {scenario.title}
                </h1>
                <Badge
                  variant={
                    scenario.status === 'published'
                      ? 'success'
                      : scenario.status === 'reviewed'
                      ? 'info'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {SCENARIO_STATUS_LABELS[scenario.status] || scenario.status}
                </Badge>
                {isDirty && (
                  <span className="text-sm text-warning">
                    (Ada perubahan belum disimpan)
                  </span>
                )}
              </div>
              <p className="text-sm text-2 mt-0.5 tabular-nums">
                Fase: {SCENARIO_PHASE_LABELS[scenario.phase] || scenario.phase} • Format: {scenario.format} • Lapangan: {scenario.pitch_length_m}&times;{scenario.pitch_width_m}m
              </p>
              <div className="text-sm text-2 space-y-0.5 mt-1">
                {scenario.created_by && (
                  <div>Dibuat oleh: <span className="text-1">{scenario.created_by}</span></div>
                )}
                {scenario.reviewed_by && (
                  <div>
                    Ditinjau oleh:{' '}
                    <span className="text-1">{scenario.reviewed_by}</span>
                    {scenario.reviewed_at && (
                      <span className="ml-2">
                        ({new Date(scenario.reviewed_at).toLocaleDateString('id-ID')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isDraft && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-4 h-4" strokeWidth={1.5} />}
                  onClick={handleSaveChanges}
                  disabled={saving || !isDirty}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CheckCircle className="w-4 h-4" strokeWidth={1.5} />}
                  onClick={handleRequestReview}
                >
                  Saya sudah meninjau skema ini
                </Button>
                <p className="text-sm text-2 mt-1">
                  Peninjau harus pelatih lain, bukan pembuat skema (kecuali akademi hanya memiliki satu staf).
                </p>
              </>
            )}

            {scenario.status === 'reviewed' && (
              <Button
                variant="primary"
                size="sm"
                icon={<FileCheck className="w-4 h-4" strokeWidth={1.5} />}
                onClick={handlePublish}
                disabled={!canPublish}
                title={publishMissingText || 'Terbitkan skema resmi'}
              >
                Terbitkan
              </Button>
            )}

            {scenario.status !== 'draft' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Undo2 className="w-4 h-4" strokeWidth={1.5} />}
                onClick={handleBackToDraft}
              >
                Kembalikan ke draf
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => setActiveViewMode('print')}
            >
              Cetak papan taktik
            </Button>

            {isDraft && (
              <IconButton
                icon={<Trash2 className="w-4 h-4 text-danger" strokeWidth={1.5} />}
                label="Hapus skema"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
              />
            )}
          </div>
        </div>

        {/* Missing criteria notice for publishing */}
        {publishMissingText && (scenario.status === 'reviewed' || isDraft) && (
          <div className="text-sm text-2 italic bg-raised px-3 py-1.5 rounded-control border border-line">
            Catatan penerbitan: {publishMissingText}
          </div>
        )}

        {/* Read-only notice for published scenario */}
        {scenario.status === 'published' && (
          <div className="p-3 rounded-control bg-raised border border-line text-sm flex items-center justify-between text-2">
            <span>
              Skema ini telah diterbitkan resmi dan konten dikunci. Untuk mengubah posisi atau panah, kembalikan ke draf.
            </span>
            {scenario.reviewed_by && (
              <span className="text-1">
                Diperiksa oleh: {scenario.reviewed_by}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Editor Pitch & Toolbar */}
      <div className="space-y-3">
        {/* Editing Tools Bar (Draft mode only) */}
        {isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-panel bg-panel border border-line text-sm">
            {/* Add Players / Ball buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                icon={<Circle className="w-3.5 h-3.5 text-brand fill-brand" />}
                onClick={() => handleAddPlayer('own')}
                disabled={(currentFrame?.players?.length || 0) >= 24}
              >
                + Tim kita
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<Square className="w-3.5 h-3.5 text-series-1 fill-series-1" />}
                onClick={() => handleAddPlayer('opponent')}
                disabled={(currentFrame?.players?.length || 0) >= 24}
              >
                + Lawan
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddOrResetBall}
              >
                {currentFrame?.ball ? 'Tengah bola' : '+ Bola'}
              </Button>
            </div>

            {/* Drawing Arrow Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-2 font-medium">Panah:</span>
              {[
                { kind: 'pass', label: 'Umpan' },
                { kind: 'run', label: 'Lari' },
                { kind: 'press', label: 'Press' },
                { kind: 'cover', label: 'Cover' }
              ].map((arr) => {
                const isActive = drawingArrowKind === arr.kind;
                return (
                  <button
                    key={arr.kind}
                    type="button"
                    onClick={() =>
                      setDrawingArrowKind((prev) => (prev === arr.kind ? null : arr.kind))
                    }
                    className={`px-2 py-1 rounded-control text-sm min-h-[44px] min-w-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer ${
                      isActive
                        ? 'bg-raised border border-brand text-brand font-bold'
                        : 'bg-app border border-line text-2 hover:text-1'
                    }`}
                    aria-pressed={isActive}
                  >
                    {isActive ? `Gambar ${arr.label}...` : arr.label}
                  </button>
                );
              })}
            </div>

            {/* Snap & Delete tools */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSnapToGrid((prev) => !prev)}
                className={`px-2 py-1 rounded-control text-sm min-h-[44px] min-w-[44px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer ${
                  snapToGrid
                    ? 'bg-raised border-brand text-brand font-medium'
                    : 'bg-app border-line text-2 hover:text-1'
                }`}
                aria-pressed={snapToGrid}
              >
                Grid 1m: {snapToGrid ? 'Aktif' : 'Nonaktif'}
              </button>

              {selectedItem && (
                <IconButton
                  icon={<Trash2 className="w-4 h-4 text-danger" strokeWidth={1.5} />}
                  label="Hapus elemen terpilih"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelectedItem}
                />
              )}
            </div>
          </div>
        )}

        {/* Main Tactical Pitch */}
        <TacticalBoard
          scenario={scenario}
          frame={currentFrame}
          isEditing={isEditing}
          selectedItemId={selectedItem?.id}
          onSelectItem={setSelectedItem}
          onUpdatePlayerPosition={handleUpdatePlayerPosition}
          onUpdateBallPosition={handleUpdateBallPosition}
          drawingArrowKind={drawingArrowKind}
          onAddArrow={handleAddArrow}
          snapToGrid={snapToGrid}
        />
      </div>

      {/* Playback Controls Bar */}
      <PlaybackBar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping((prev) => !prev)}
        onReset={() => {
          setIsPlaying(false);
          setPlaybackProgress(0);
          setInterpolatedFrame(null);
          setActiveFrameIndex(0);
        }}
        currentProgress={playbackProgress}
        onSeek={(prog) => {
          setPlaybackProgress(prog);
          // Update static interpolated frame on manual scrub
          let elapsed = prog * totalDurationMs;
          let frameAIdx = 0;
          let frameBIdx = 0;
          let tInFrame = 0;
          let accumulated = 0;
          for (let i = 0; i < frames.length; i++) {
            const dur = frames[i].t_ms || 2000;
            if (elapsed <= accumulated + dur || i === frames.length - 1) {
              frameAIdx = i;
              frameBIdx = (i + 1) % frames.length;
              tInFrame = (elapsed - accumulated) / dur;
              break;
            }
            accumulated += dur;
          }
          const fA = frames[frameAIdx];
          const fB = frames[frameBIdx];
          const interpolated = interpolateFrame(fA, fB, Math.min(1, Math.max(0, tInFrame)), 'easeInOut');
          setInterpolatedFrame(interpolated);
        }}
        activeFrameIndex={activeFrameIndex}
        totalFrames={frames.length}
        onStepPrevious={() => setActiveFrameIndex((prev) => Math.max(0, prev - 1))}
        onStepNext={() => setActiveFrameIndex((prev) => Math.min(frames.length - 1, prev + 1))}
      />

      {/* Keyframe Timeline Strip */}
      <TimelineStrip
        frames={frames}
        activeFrameIndex={activeFrameIndex}
        onSelectFrame={(idx) => {
          setIsPlaying(false);
          setInterpolatedFrame(null);
          setActiveFrameIndex(idx);
        }}
        onAddFrame={handleAddFrame}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        onMoveFrame={handleMoveFrame}
        onUpdateFrameMeta={handleUpdateFrameMeta}
        isEditing={isEditing}
      />

      {/* Attached References Section */}
      <ReferencesPanel
        references={references}
        onAttachReference={handleAttachReference}
        onRemoveReference={handleRemoveReference}
        onUpdateReferenceNote={handleUpdateReferenceNote}
        isEditing={isEditing}
      />
    </div>
  );
}
