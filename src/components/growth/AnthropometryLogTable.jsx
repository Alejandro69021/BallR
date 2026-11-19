import React from 'react';
import { Scale } from 'lucide-react';

export default function AnthropometryLogTable({ anthropometryLogs }) {
  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-athletic text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span>Bi-Monthly Anthropometry Measurement Log</span>
          </h4>
          <p className="text-xs text-slate-400">
            Pencatatan resmi berkala tinggi badan, massa tubuh, dan rasio BMI akademi
          </p>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          {anthropometryLogs.length} Siklus Terdata
        </span>
      </div>

      {/* Tabular List */}
      <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090D16] text-[10px] font-athletic uppercase tracking-wider text-slate-400 border-b border-[#1F2937]">
            <tr>
              <th className="py-3 px-3.5">Periode Pengukuran</th>
              <th className="py-3 px-3">Tinggi Badan</th>
              <th className="py-3 px-3">Berat Badan</th>
              <th className="py-3 px-3">BMI Index</th>
              <th className="py-3 px-3">Pertumbuhan</th>
              <th className="py-3 px-3.5 text-right">Status Kesehatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]/70 font-mono">
            {anthropometryLogs.map((log, idx) => (
              <tr
                key={idx}
                className={`hover:bg-[#1F2937]/50 transition-colors ${
                  log.isLatest ? 'bg-lime-500/5' : ''
                }`}
              >
                <td className="py-3 px-3.5 font-sans font-semibold text-white flex items-center gap-2">
                  {log.isLatest && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                  )}
                  <span>{log.period}</span>
                </td>
                <td className="py-3 px-3 text-cyan-300 font-bold">
                  {log.height}
                </td>
                <td className="py-3 px-3 text-slate-200">
                  {log.weight}
                </td>
                <td className="py-3 px-3 text-slate-300">
                  {log.bmi}
                </td>
                <td className="py-3 px-3 text-emerald-400 font-sans font-semibold">
                  {log.growthDelta}
                </td>
                <td className="py-3 px-3.5 text-right font-sans">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      log.isLatest
                        ? 'bg-lime-500/20 text-[#CCFF00] border border-[#CCFF00]/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
