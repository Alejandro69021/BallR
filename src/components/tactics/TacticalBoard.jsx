import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowRight, Move, Sparkles } from 'lucide-react';
import { clampToPitch, moveBy, BOARD_DISCLAIMER } from '../../lib/board';

export default function TacticalBoard({
  scenario,
  frame,
  isEditing = false,
  selectedItemId = null,
  onSelectItem,
  onUpdatePlayerPosition,
  onUpdateBallPosition,
  drawingArrowKind = null,
  onAddArrow,
  snapToGrid = false,
  className = ''
}) {
  const pitchLength = Number(scenario?.pitch_length_m || 90);
  const pitchWidth = Number(scenario?.pitch_width_m || 60);

  const containerRef = useRef(null);
  const draggingRef = useRef(null); // { id, type: 'player' | 'ball', startX, startY }
  const [arrowDraft, setArrowDraft] = useState(null); // { from: {x, y}, to: {x, y} }

  const pitchDimensions = { pitch_length_m: pitchLength, pitch_width_m: pitchWidth };

  // Convert screen coordinates to pitch coordinates (metres)
  const getPitchCoords = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };

      const px = ((clientX - rect.left) / rect.width) * pitchLength;
      const py = ((clientY - rect.top) / rect.height) * pitchWidth;

      let x = px;
      let y = py;

      if (snapToGrid) {
        x = Math.round(x);
        y = Math.round(y);
      }

      return clampToPitch({ x, y }, pitchDimensions);
    },
    [pitchLength, pitchWidth, snapToGrid]
  );

  // Pointer Down for drag & drop
  const handlePointerDown = (type, id, e) => {
    if (!isEditing || drawingArrowKind) return;
    e.stopPropagation();
    e.preventDefault();

    if (onSelectItem) {
      onSelectItem({ type, id });
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored for environments lacking PointerCapture
    }

    draggingRef.current = {
      type,
      id,
      pointerId: e.pointerId
    };
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    if (drawingArrowKind && arrowDraft?.from) {
      const currentCoords = getPitchCoords(e.clientX, e.clientY);
      setArrowDraft((prev) => (prev ? { ...prev, to: currentCoords } : null));
      return;
    }

    if (!draggingRef.current || !isEditing) return;
    e.preventDefault();

    const { type, id } = draggingRef.current;
    const coords = getPitchCoords(e.clientX, e.clientY);

    if (type === 'player' && onUpdatePlayerPosition) {
      onUpdatePlayerPosition(id, coords.x, coords.y);
    } else if (type === 'ball' && onUpdateBallPosition) {
      onUpdateBallPosition(coords.x, coords.y);
    }
  };

  // Pointer Up
  const handlePointerUp = (e) => {
    if (draggingRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      draggingRef.current = null;
    }
  };

  // Pitch surface click handler (for drawing arrows)
  const handlePitchClick = (e) => {
    if (!isEditing) return;

    if (drawingArrowKind) {
      const clicked = getPitchCoords(e.clientX, e.clientY);
      if (!arrowDraft) {
        // Step 1: Start arrow
        setArrowDraft({ from: clicked, to: clicked });
      } else {
        // Step 2: Complete arrow
        if (onAddArrow) {
          onAddArrow({
            from: arrowDraft.from,
            to: clicked,
            kind: drawingArrowKind
          });
        }
        setArrowDraft(null);
      }
    } else {
      // Deselect item when clicking bare pitch
      onSelectItem?.(null);
    }
  };

  // Keyboard navigation for accessible movement
  const handleKeyDown = (type, id, e) => {
    if (!isEditing) return;

    const delta = e.shiftKey ? 2.0 : 0.5;
    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowUp':
        dy = -delta;
        break;
      case 'ArrowDown':
        dy = delta;
        break;
      case 'ArrowLeft':
        dx = -delta;
        break;
      case 'ArrowRight':
        dx = delta;
        break;
      default:
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (type === 'player') {
      const player = frame?.players?.find((p) => p.id === id);
      if (!player) return;
      const nextPos = moveBy(player, dx, dy, pitchDimensions);
      onUpdatePlayerPosition?.(id, nextPos.x, nextPos.y);
    } else if (type === 'ball') {
      const ball = frame?.ball;
      if (!ball) return;
      const nextPos = moveBy(ball, dx, dy, pitchDimensions);
      onUpdateBallPosition?.(nextPos.x, nextPos.y);
    }
  };

  // Find selected item data for coordinates readout
  const selectedPlayer = frame?.players?.find((p) => p.id === selectedItemId);
  const isBallSelected = selectedItemId === 'ball';
  const selectedItemCoords = selectedPlayer || (isBallSelected ? frame?.ball : null);

  const players = frame?.players || [];
  const ball = frame?.ball;
  const arrows = frame?.arrows || [];

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Status bar: Coordinates readout + disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {selectedItemCoords ? (
            <span className="font-mono tabular-nums px-2 py-0.5 rounded-control bg-raised border border-line text-1">
              {selectedPlayer
                ? `${selectedPlayer.team === 'own' ? 'Tim Kita' : 'Lawan'} #${selectedPlayer.label}: X=${selectedItemCoords.x}m, Y=${selectedItemCoords.y}m`
                : `Bola: X=${selectedItemCoords.x}m, Y=${selectedItemCoords.y}m`}
            </span>
          ) : (
            <span className="text-2 italic">
              {isEditing
                ? 'Klik/sentuh pemain atau bola untuk menggeser. Gunakan panah keyboard (Shift+panah = 2m).'
                : 'Mode tampilan skema.'}
            </span>
          )}
          {snapToGrid && (
            <span className="font-mono text-2 px-1.5 py-0.5 rounded-control bg-panel border border-control text-xs">
              Grid 1m
            </span>
          )}
        </div>

        {/* Mandatory disclaimer */}
        <div className="text-xs text-2 font-mono flex items-center gap-1.5">
          <span>{BOARD_DISCLAIMER}</span>
        </div>
      </div>

      {/* Main Pitch Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handlePitchClick}
        className={`relative w-full overflow-hidden rounded-panel border border-pitch-line bg-pitch text-pitch-line ${drawingArrowKind ? 'cursor-crosshair' : isEditing ? 'cursor-default' : ''
          }`}
        style={{ aspectRatio: `${pitchLength} / ${pitchWidth}` }}
      >
        <svg
          viewBox={`0 0 ${pitchLength} ${pitchWidth}`}
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Arrowhead marker for standard passes & runs */}
            <marker
              id="arrow-pass"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-brand" />
            </marker>

            <marker
              id="arrow-run"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-series-2" />
            </marker>

            <marker
              id="arrow-press"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-danger" />
            </marker>

            <marker
              id="arrow-cover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-warning" />
            </marker>
          </defs>

          {/* 1. Pitch Markings */}
          <g stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.8">
            {/* Boundary */}
            <rect x="0" y="0" width={pitchLength} height={pitchWidth} />

            {/* Halfway line */}
            <line x1={pitchLength / 2} y1="0" x2={pitchLength / 2} y2={pitchWidth} />

            {/* Center circle */}
            <circle cx={pitchLength / 2} cy={pitchWidth / 2} r={Math.min(9.15, pitchWidth / 4)} />
            <circle cx={pitchLength / 2} cy={pitchWidth / 2} r="0.8" fill="currentColor" />

            {/* Left penalty box (Own goal area) */}
            <rect
              x="0"
              y={(pitchWidth - Math.min(40.32, pitchWidth * 0.7)) / 2}
              width={Math.min(16.5, pitchLength / 5)}
              height={Math.min(40.32, pitchWidth * 0.7)}
            />
            {/* Left goal area */}
            <rect
              x="0"
              y={(pitchWidth - Math.min(18.32, pitchWidth * 0.35)) / 2}
              width={Math.min(5.5, pitchLength / 12)}
              height={Math.min(18.32, pitchWidth * 0.35)}
            />

            {/* Right penalty box (Opponent goal area) */}
            <rect
              x={pitchLength - Math.min(16.5, pitchLength / 5)}
              y={(pitchWidth - Math.min(40.32, pitchWidth * 0.7)) / 2}
              width={Math.min(16.5, pitchLength / 5)}
              height={Math.min(40.32, pitchWidth * 0.7)}
            />
            {/* Right goal area */}
            <rect
              x={pitchLength - Math.min(5.5, pitchLength / 12)}
              y={(pitchWidth - Math.min(18.32, pitchWidth * 0.35)) / 2}
              width={Math.min(5.5, pitchLength / 12)}
              height={Math.min(18.32, pitchWidth * 0.35)}
            />

            {/* Attacking Direction Indicator (Left to Right) */}
            <g opacity="0.6">
              <line
                x1={pitchLength / 2 - 12}
                y1={3.5}
                x2={pitchLength / 2 + 12}
                y2={3.5}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="1.5,1"
              />
              <polygon
                points={`${pitchLength / 2 + 13},3.5 ${pitchLength / 2 + 11},2.3 ${pitchLength / 2 + 11},4.7`}
                fill="currentColor"
              />
              <text
                x={pitchLength / 2}
                y={2.5}
                textAnchor="middle"
                className="fill-pitch-line font-mono font-semibold"
                fontSize="2.2"
              >
                Arah serang &rarr;
              </text>
            </g>
          </g>

          {/* 2. Tactical Arrows */}
          {arrows.map((arr, idx) => {
            const kind = arr.kind || 'pass';
            const markerId = `url(#arrow-${kind})`;

            let strokeClass = 'stroke-brand';
            let dashArray = 'none';

            if (kind === 'pass') {
              strokeClass = 'stroke-brand';
              dashArray = '2,1';
            } else if (kind === 'run') {
              strokeClass = 'stroke-series-2';
              dashArray = 'none';
            } else if (kind === 'press') {
              strokeClass = 'stroke-danger';
              dashArray = 'none';
            } else if (kind === 'cover') {
              strokeClass = 'stroke-warning';
              dashArray = '1,1';
            }

            return (
              <g key={`arr-${idx}`} opacity={arr.opacity ?? 1}>
                <line
                  x1={arr.from.x}
                  y1={arr.from.y}
                  x2={arr.to.x}
                  y2={arr.to.y}
                  className={strokeClass}
                  strokeWidth="0.8"
                  strokeDasharray={dashArray}
                  markerEnd={markerId}
                />
              </g>
            );
          })}

          {/* 3. Arrow In Draft (Drawing Mode) */}
          {arrowDraft && arrowDraft.from && arrowDraft.to && (
            <line
              x1={arrowDraft.from.x}
              y1={arrowDraft.from.y}
              x2={arrowDraft.to.x}
              y2={arrowDraft.to.y}
              className="stroke-brand"
              strokeWidth="0.8"
              strokeDasharray="1.5,1"
              opacity="0.8"
            />
          )}

          {/* 4. Players (Distinguished by Color AND Shape: Own = Circle, Opponent = Square) */}
          {players.map((p) => {
            const isSelected = selectedItemId === p.id;
            const isOwn = p.team === 'own';
            const radius = 2.0;

            return (
              <g
                key={p.id}
                transform={`translate(${p.x}, ${p.y})`}
                opacity={p.opacity ?? 1}
                className={isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
                onPointerDown={(e) => handlePointerDown('player', p.id, e)}
                onKeyDown={(e) => handleKeyDown('player', p.id, e)}
                tabIndex={isEditing ? 0 : -1}
                role="button"
                aria-label={`${isOwn ? 'Pemain Tim Kita' : 'Pemain Lawan'} nomor ${p.label}`}
              >
                {/* Focus or selection ring */}
                {isSelected && (
                  <circle
                    r={radius + 1.2}
                    className="stroke-brand fill-none"
                    strokeWidth="0.6"
                    strokeDasharray="1,1"
                  />
                )}

                {/* Player Shape: Circle for Own Team, Square for Opponent Team */}
                {isOwn ? (
                  <circle
                    r={radius}
                    className="fill-brand stroke-panel"
                    strokeWidth="0.5"
                  />
                ) : (
                  <rect
                    x={-radius}
                    y={-radius}
                    width={radius * 2}
                    height={radius * 2}
                    rx="0.5"
                    className="fill-series-1 stroke-panel"
                    strokeWidth="0.5"
                  />
                )}

                {/* Jersey Label */}
                <text
                  textAnchor="middle"
                  dy="0.8"
                  className="fill-app font-mono font-bold select-none pointer-events-none"
                  fontSize="2.2"
                >
                  {p.label || ''}
                </text>
              </g>
            );
          })}

          {/* 5. Ball */}
          {ball && (
            <g
              transform={`translate(${ball.x}, ${ball.y})`}
              opacity={ball.opacity ?? 1}
              className={isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
              onPointerDown={(e) => handlePointerDown('ball', 'ball', e)}
              onKeyDown={(e) => handleKeyDown('ball', 'ball', e)}
              tabIndex={isEditing ? 0 : -1}
              role="button"
              aria-label="Bola pertandingan"
            >
              {isBallSelected && (
                <circle
                  r="2.4"
                  className="stroke-warning fill-none"
                  strokeWidth="0.5"
                  strokeDasharray="1,1"
                />
              )}
              <circle
                r="1.4"
                className="fill-panel stroke-control"
                strokeWidth="0.5"
              />
              <circle
                r="0.7"
                className="fill-app"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-control bg-panel border border-line text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Own Team */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-brand border border-panel flex items-center justify-center text-xs font-bold text-app font-mono">
              1
            </span>
            <span className="text-1 font-medium">Tim Kita (Lingkaran)</span>
          </div>

          {/* Opponent Team */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-series-1 border border-panel flex items-center justify-center text-xs font-bold text-app font-mono">
              1
            </span>
            <span className="text-1 font-medium">Lawan (Kotak)</span>
          </div>

          {/* Ball */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-panel border border-control flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-app" />
            </span>
            <span className="text-1 font-medium">Bola</span>
          </div>
        </div>

        {/* Arrow kinds */}
        <div className="flex items-center gap-3 flex-wrap text-2 text-xs">
          <span className="flex items-center gap-1 text-brand">
            <span className="font-mono">---&gt;</span> Umpan
          </span>
          <span className="flex items-center gap-1 text-series-2">
            <span className="font-mono">&mdash;&gt;</span> Lari (run)
          </span>
          <span className="flex items-center gap-1 text-danger">
            <span className="font-mono">&mdash;&gt;</span> Press
          </span>
          <span className="flex items-center gap-1 text-warning">
            <span className="font-mono">...&gt;</span> Cover
          </span>
        </div>
      </div>
    </div>
  );
}
