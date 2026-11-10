import React, { useState } from 'react';
import { Activity, TrendingUp, Users2, Shield } from 'lucide-react';

export default function PerformanceRadar({ attributes, athleteName = "Dimas Arya", teammates = [] }) {
  const [activeStatIndex, setActiveStatIndex] = useState(null);
  const [comparisonMode, setComparisonMode] = useState('benchmark'); // 'benchmark' or playerId
  const [showBenchmark, setShowBenchmark] = useState(true);

  // Map 3-letter FIFA code
  const getCode = (attrName) => {
    if (attrName.includes('Pace')) return 'PAC';
    if (attrName.includes('Shooting')) return 'SHO';
    if (attrName.includes('Passing')) return 'PAS';
    if (attrName.includes('Dribbling')) return 'DRI';
    if (attrName.includes('Defending')) return 'DEF';
    if (attrName.includes('Physical')) return 'PHY';
    return attrName.substring(0, 3).toUpperCase();
  };

  // Find selected comparison player if in teammate mode
  const comparedPlayer = teammates.find((t) => t.player_id === comparisonMode);

  // Radar geometry configuration
  const size = 260;
  const center = size / 2;
  const radius = 88;
  const totalPoints = attributes.length;

  const getCoordinates = (val, index) => {
    const angle = (index * 2 * Math.PI) / totalPoints - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Compute SVG polygon points for active player
  const playerPoints = attributes
    .map((attr, i) => {
      const { x, y } = getCoordinates(attr.value, i);
      return `${x},${y}`;
    })
    .join(' ');

  // Compute SVG polygon points for comparison (benchmark or teammate)
  const comparisonPoints = attributes
    .map((attr, i) => {
      let val = attr.group_avg;
      if (comparedPlayer) {
        const matching = comparedPlayer.radar_attributes[i];
        if (matching) val = matching.value;
      }
      const { x, y } = getCoordinates(val, i);
      return `${x},${y}`;
    })
    .join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-lime-500/10 border border-[#CCFF00]/30 text-[#CCFF00]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-athletic text-lg sm:text-xl font-bold text-white tracking-tight">
              Performance Attributes (Radar & Stats)
            </h2>
            <p className="text-xs text-slate-400">
              6 Atribut Kunci Sepakbola Usia Muda (U-13)
            </p>
          </div>
        </div>

        {/* Comparison Target Selector */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#CCFF00] mr-1">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] inline-block shadow-[0_0_8px_#CCFF00]"></span>
            <span>{athleteName.split(' ')[0]}</span>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#090D16] text-slate-300 border border-slate-700 outline-none focus:border-[#CCFF00] cursor-pointer"
            >
              <option value="benchmark">vs U-13 Group Avg</option>
              {teammates.map((tm) => (
                <option key={tm.player_id} value={tm.player_id}>
                  vs {tm.personal_info.nickname || tm.personal_info.full_name} (#{tm.personal_info.jersey_number})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Custom SVG Radar Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[260px] h-[260px]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full overflow-visible"
            >
              {/* Radial Web Grid */}
              {gridLevels.map((level, idx) => {
                const ringPoints = attributes
                  .map((_, i) => {
                    const angle = (i * 2 * Math.PI) / totalPoints - Math.PI / 2;
                    const r = level * radius;
                    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                  })
                  .join(' ');

                return (
                  <polygon
                    key={idx}
                    points={ringPoints}
                    fill="none"
                    stroke="#1F2937"
                    strokeWidth="1.2"
                    strokeDasharray={idx === 3 ? 'none' : '3,3'}
                  />
                );
              })}

              {/* Axis lines */}
              {attributes.map((_, i) => {
                const angle = (i * 2 * Math.PI) / totalPoints - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="#1F2937"
                    strokeWidth="1.2"
                  />
                );
              })}

              {/* Comparison Polygon (Benchmark or Teammate) */}
              <polygon
                points={comparisonPoints}
                fill={comparedPlayer ? "rgba(56, 189, 248, 0.15)" : "rgba(148, 163, 184, 0.12)"}
                stroke={comparedPlayer ? "#38BDF8" : "#64748B"}
                strokeWidth={comparedPlayer ? "2" : "1.5"}
                strokeDasharray={comparedPlayer ? "none" : "4,3"}
                className="transition-all duration-300"
              />

              {/* Player Polygon */}
              <polygon
                points={playerPoints}
                fill="rgba(204, 255, 0, 0.22)"
                stroke="#CCFF00"
                strokeWidth="2.5"
                className="filter drop-shadow-[0_0_8px_rgba(204,255,0,0.5)] transition-all duration-300"
              />

              {/* Vertex Nodes & Interactive Labels */}
              {attributes.map((attr, i) => {
                const code = getCode(attr.attribute);
                const angle = (i * 2 * Math.PI) / totalPoints - Math.PI / 2;
                const { x, y } = getCoordinates(attr.value, i);
                
                const labelR = radius + 22;
                const lx = center + labelR * Math.cos(angle);
                const ly = center + labelR * Math.sin(angle);

                const isHovered = activeStatIndex === i;

                return (
                  <g
                    key={attr.attribute}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveStatIndex(i)}
                    onMouseLeave={() => setActiveStatIndex(null)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill="#090D16"
                      stroke="#CCFF00"
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-200"
                    />

                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`text-[11px] font-athletic font-bold transition-all duration-200 ${
                        isHovered ? 'fill-[#CCFF00] font-extrabold text-[12px]' : 'fill-slate-300'
                      }`}
                    >
                      {code} {attr.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00]"></span>
              {athleteName.split(' ')[0]}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${comparedPlayer ? 'bg-sky-400' : 'bg-slate-500'}`}></span>
              {comparedPlayer ? comparedPlayer.personal_info.nickname : 'U-13 Avg'}
            </span>
          </div>
        </div>

        {/* Attribute Progress Bars & Comparison Label */}
        <div className="lg:col-span-7 space-y-2.5">
          {attributes.map((attr, idx) => {
            const isHigh = attr.value >= 80;
            const isSelected = activeStatIndex === idx;
            const code = getCode(attr.attribute);

            // Calculate delta against benchmark or compared teammate
            let compareTargetValue = attr.group_avg;
            let compareTargetLabel = 'U-13 Avg';

            if (comparedPlayer && comparedPlayer.radar_attributes[idx]) {
              compareTargetValue = comparedPlayer.radar_attributes[idx].value;
              compareTargetLabel = comparedPlayer.personal_info.nickname || 'Teammate';
            }

            const delta = attr.value - compareTargetValue;
            const diffText = delta >= 0 ? `+${delta} vs ${compareTargetLabel}` : `${delta} vs ${compareTargetLabel}`;
            const isPositive = delta >= 0;

            return (
              <div
                key={attr.attribute}
                onMouseEnter={() => setActiveStatIndex(idx)}
                onMouseLeave={() => setActiveStatIndex(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#1F2937]/80 border-[#CCFF00]/50 shadow-md'
                    : 'bg-[#090D16]/60 border-[#1F2937]/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-athletic font-bold text-white text-sm">
                      {attr.attribute}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                      {code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Comparison label */}
                    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isPositive
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      <TrendingUp className="w-2.5 h-2.5 mr-1" />
                      {diffText}
                    </span>

                    {/* Stat Number */}
                    <span
                      className={`font-athletic text-base font-extrabold ${
                        isHigh ? 'text-[#CCFF00]' : 'text-white'
                      }`}
                    >
                      {attr.value}
                    </span>
                  </div>
                </div>

                {/* Progress Bar with Benchmark or Teammate marker */}
                <div className="relative w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 w-1 z-10 ${comparedPlayer ? 'bg-sky-400' : 'bg-slate-400'}`}
                    style={{ left: `${compareTargetValue}%` }}
                    title={`${compareTargetLabel}: ${compareTargetValue}`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh
                        ? 'bg-gradient-to-r from-lime-400 to-[#CCFF00]'
                        : 'bg-gradient-to-r from-sky-400 to-indigo-400'
                    }`}
                    style={{ width: `${attr.value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
