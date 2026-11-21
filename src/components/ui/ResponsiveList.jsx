import React, { useState, useEffect } from 'react';
import Table from './Table';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia) {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      setIsMobile(mql.matches);

      const handler = (e) => setIsMobile(e.matches);
      if (mql.addEventListener) {
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
      } else if (mql.addListener) {
        mql.addListener(handler);
        return () => mql.removeListener(handler);
      }
    }

    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

/**
 * ResponsiveList renders stacked cards on mobile (< md / 768px) and a standard Table on >= md.
 * Prevents horizontal scrolling on narrow screens while keeping full table density on desktop.
 */
export default function ResponsiveList({
  columns = [],
  data = [],
  renderCard,
  sortKey,
  sortDirection = 'asc',
  onSort,
  emptyMessage = 'Belum ada data',
  className = '',
  tableClassName = '',
  cardContainerClassName = 'space-y-3',
  stickyHeader = true
}) {
  const isMobile = useIsMobile(768);

  if (!data || data.length === 0) {
    return (
      <div className={`w-full p-8 border border-line rounded-panel bg-panel text-center ${className}`}>
        {typeof emptyMessage === 'string' ? (
          <p className="text-xs text-2">{emptyMessage}</p>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  if (isMobile && renderCard) {
    return (
      <div className={`w-full ${className}`} data-testid="responsive-list-cards">
        <div className={cardContainerClassName}>
          {data.map((item, idx) => (
            <div key={item.id || item.player_id || idx}>
              {renderCard(item, idx)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} data-testid="responsive-list-table">
      <Table
        columns={columns}
        data={data}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={onSort}
        stickyHeader={stickyHeader}
        emptyMessage={emptyMessage}
        className={tableClassName}
      />
    </div>
  );
}
