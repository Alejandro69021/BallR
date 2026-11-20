import React from 'react';
import Skeleton from './ui/Skeleton';

export default function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat data rekam jejak"
      className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6"
    >
      {/* Top Banner Skeleton */}
      <div className="flex items-center justify-between p-4 rounded-panel bg-panel border border-line">
        <div className="flex items-center gap-3">
          <Skeleton variant="rect" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton variant="text" width={140} height={14} />
            <Skeleton variant="text" width={220} height={12} />
          </div>
        </div>
        <Skeleton variant="rect" width={96} height={32} />
      </div>

      {/* Header Card Skeleton */}
      <div className="p-6 rounded-panel bg-panel border border-line space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width={160} height={14} />
            <Skeleton variant="text" width={240} height={24} />
            <Skeleton variant="text" width={180} height={12} />
          </div>
          <Skeleton variant="rect" width={80} height={96} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-control bg-app border border-line space-y-1.5">
              <Skeleton variant="text" width={60} height={12} />
              <Skeleton variant="text" width={80} height={16} />
            </div>
          ))}
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-panel bg-panel border border-line space-y-3"
          >
            <div className="flex items-start justify-between">
              <Skeleton variant="rect" width={64} height={72} />
              <Skeleton variant="rect" width={48} height={48} />
            </div>
            <Skeleton variant="text" width={120} height={14} />
            <Skeleton variant="text" width={80} height={12} />
            <Skeleton variant="rect" height={48} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Skeleton variant="rect" height={32} />
              <Skeleton variant="rect" height={32} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
