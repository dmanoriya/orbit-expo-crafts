import React from 'react';

interface ProductSkeletonGridProps {
  count?: number;
}

export default function ProductSkeletonGrid({ count = 8 }: ProductSkeletonGridProps) {
  return (
    <div className="prod-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <article key={idx} className="card skeleton-card">
          <div className="thumb skeleton-thumb skeleton" />
          <div className="body" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skeleton skeleton-text" style={{ height: 18, width: '85%' }} />
            <div className="skeleton skeleton-sub" style={{ height: 13, width: '45%' }} />
          </div>
        </article>
      ))}
    </div>
  );
}
