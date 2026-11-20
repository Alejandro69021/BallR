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
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#788594] dark:text-[#64748B] opacity-60 group-hover:opacity-100" aria-hidden="true" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#2E7D5B] dark:text-[#4FB286]" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#2E7D5B] dark:text-[#4FB286]" aria-hidden="true" />
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className={`w-full p-8 border border-[#DAD6CC] dark:border-[#2C3643] rounded-[8px] bg-white dark:bg-[#11161D] ${className}`}>
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto border border-[#DAD6CC] dark:border-[#2C3643] rounded-[8px] bg-white dark:bg-[#11161D] ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className={`border-b border-[#DAD6CC] dark:border-[#2C3643] bg-[#F6F4EF] dark:bg-[#1A212B] text-[#4A5360] dark:text-[#9AA6B5] ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
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
                  className={`py-2.5 px-3 font-semibold select-none ${alignClass}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="group inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4FB286] rounded cursor-pointer"
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
        <tbody className="divide-y divide-[#DAD6CC] dark:divide-[#2C3643] text-[#14181F] dark:text-[#E8ECF1]">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || row.player_id || rowIdx}
              className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors duration-150 ease-out"
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
                  <td key={col.key} className={`py-2.5 px-3 ${alignClass} ${tabularClass}`}>
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
