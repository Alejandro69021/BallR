import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from './EmptyState';

export default function Table({
  columns = [],
  data = [],
  sortKey,
  sortDirection = 'asc',
  onSort,
  stickyHeader = true,
  emptyMessage = 'Belum ada data',
  className = ''
}) {
  const getSortIcon = (colKey) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-2 opacity-60 group-hover:opacity-100" aria-hidden="true" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className={`w-full p-8 border border-line rounded-panel bg-panel ${className}`}>
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto border border-line rounded-panel bg-panel ${className}`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className={`border-b border-line bg-raised text-2 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const alignClass =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={`font-semibold select-none ${col.sortable && onSort ? 'p-0' : 'py-2 px-2 sm:px-2.5'} ${alignClass}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`group inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 py-2.5 px-2 sm:py-2 sm:px-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded cursor-pointer ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {getSortIcon(col.key)}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-1">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || row.player_id || rowIdx}
              className="hover:bg-raised/50 transition-colors duration-150 ease-out"
            >
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';
                const tabularClass = col.tabular ? 'font-mono tabular-nums' : '';
                const cellVal = row[col.key];

                return (
                  <td key={col.key} className={`py-2 px-2 sm:px-2.5 ${alignClass} ${tabularClass}`}>
                    {col.render ? col.render(cellVal, row) : (cellVal ?? '-')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
