'use client';
import React from 'react';

type Props = {
  variant?: 'orbit' | 'ring';
  size?: number; // px
  className?: string;
};

export default function Spinner({ variant = 'orbit', size = 16, className = '' }: Props) {
  const box = 24; // viewBox
  const r = 9; // ring radius

  if (variant === 'ring') {
    // border-style ring (simple, solid and centered)
    return (
      <span
        role="status"
        aria-label="Loading"
        className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // ORBIT: static track + dot that orbits exactly on the ring
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      className={className}
      role="status"
      aria-label="Loading"
    >
      {/* static track */}
      <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      {/* rotating dot; only this <g> spins, so the track stays still */}
      <g style={{ transformOrigin: '12px 12px' }} className="animate-spin">
        {/* place the dot at the top of the circle => (cx=12, cy=12-r) */}
        <circle cx="12" cy={12 - r} r="2" fill="currentColor" />
      </g>
    </svg>
  );
}
