import React from 'react';
import { Scale } from 'lucide-react';
import Table from '../ui/Table';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';

/**
 * Computes age in "X th Y bln" from birth date and measurement date.
 */
function computeAgeAtMeasurement(birthDateStr, measurementDateStr) {
  if (!birthDateStr || !measurementDateStr) return null;
  const birth = new Date(birthDateStr);
  const meas = new Date(measurementDateStr);
  if (isNaN(birth.getTime()) || isNaN(meas.getTime())) return null;

  let years = meas.getFullYear() - birth.getFullYear();
  let months = meas.getMonth() - birth.getMonth();
  let days = meas.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  return `${years} th ${months} bln`;
}

export default function AnthropometryLogTable({ anthropometryLogs = [], birthDate }) {
  if (!anthropometryLogs || anthropometryLogs.length === 0) {
    return (
      <section className="rounded-panel bg-panel border border-line p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="text-base font-semibold text-1 flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand" strokeWidth={1.5} />
              <span>Log pengukuran antropometri berkala</span>
            </h3>
            <p className="text-xs text-2 mt-0.5">
              Pencatatan resmi tinggi badan dan massa tubuh berkala akademi.
            </p>
          </div>
        </div>
        <EmptyState
          title="Belum ada data"
          description="Belum ada catatan pengukuran antropometri berkala yang tercatat."
        />
      </section>
    );
  }

  const hasSittingHeight = anthropometryLogs.some(
    (log) => log.sitting_height != null || log.sitting_height_cm != null
  );

  const formattedRows = anthropometryLogs.map((log, idx) => {
    const measDate = log.date || log.period;
    const computedAge =
      computeAgeAtMeasurement(birthDate, measDate) ||
      (log.age ? `${log.age} th` : 'Belum ada data');

    const heightVal =
      log.height != null
        ? (typeof log.height === 'number'
            ? log.height.toFixed(1)
            : parseFloat(log.height).toFixed(1))
        : 'Belum ada data';

    const weightVal =
      log.weight != null
        ? (typeof log.weight === 'number'
            ? log.weight.toFixed(1)
            : parseFloat(log.weight).toFixed(1))
        : 'Belum ada data';

    const sittingVal =
      log.sitting_height != null
        ? (typeof log.sitting_height === 'number'
            ? log.sitting_height.toFixed(1)
            : parseFloat(log.sitting_height).toFixed(1))
        : (log.sitting_height_cm != null
            ? (typeof log.sitting_height_cm === 'number'
                ? log.sitting_height_cm.toFixed(1)
                : parseFloat(log.sitting_height_cm).toFixed(1))
            : '-');

    return {
      id: log.id || idx,
      period: log.period || log.date || 'Belum ada data',
      age: computedAge,
      height: heightVal,
      weight: weightVal,
      sittingHeight: sittingVal,
      isLatest: Boolean(log.isLatest)
    };
  });

  const columns = [
    {
      key: 'period',
      header: 'Tanggal',
      align: 'left',
      tabular: true
    },
    {
      key: 'age',
      header: 'Usia saat tes',
      align: 'left',
      tabular: true
    },
    {
      key: 'height',
      header: 'Tinggi badan (cm)',
      align: 'left',
      tabular: true
    },
    {
      key: 'weight',
      header: 'Berat badan (kg)',
      align: 'left',
      tabular: true
    },
    ...(hasSittingHeight
      ? [
          {
            key: 'sittingHeight',
            header: 'Tinggi duduk (cm)',
            align: 'left',
            tabular: true
          }
        ]
      : []),
    {
      key: 'status',
      header: 'Catatan status',
      align: 'right',
      render: (_, row) =>
        row.isLatest ? (
          <Badge variant="brand">Terbaru</Badge>
        ) : (
          <span className="text-xs text-2 font-mono">-</span>
        )
    }
  ];

  return (
    <section className="rounded-panel bg-panel border border-line p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
        <div>
          <h3 className="text-base font-semibold text-1 flex items-center gap-2">
            <Scale className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <span>Log pengukuran antropometri berkala</span>
          </h3>
          <p className="text-xs text-2 mt-0.5">
            Pencatatan resmi tinggi badan dan massa tubuh berkala akademi.
          </p>
        </div>

        <span className="text-xs font-mono text-2">
          {anthropometryLogs.length} sesi terdata
        </span>
      </div>

      <Table columns={columns} data={formattedRows} />
    </section>
  );
}
