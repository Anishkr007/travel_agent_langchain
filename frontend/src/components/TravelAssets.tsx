import React from 'react';

/** Soft gradient blobs positioned behind hero content — replaces the dot-grid */
export const GradientBlobs: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
    {/* Brass warm blob — upper right */}
    <div
      className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.12]"
      style={{ background: 'radial-gradient(circle, #C9962C 0%, transparent 70%)', filter: 'blur(80px)' }}
    />
    {/* Teal cool blob — lower left */}
    <div
      className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.10]"
      style={{ background: 'radial-gradient(circle, #3E7C7C 0%, transparent 70%)', filter: 'blur(90px)' }}
    />
    {/* Subtle center accent */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full opacity-[0.06]"
      style={{ background: 'radial-gradient(circle, #C9962C 0%, transparent 60%)', filter: 'blur(100px)' }}
    />
  </div>
);

/** Globe SVG travel mark — clean line art, no dashed strokes, soft glow */
export const TravelMark: React.FC = () => (
  <div
    className="mb-6"
    style={{ filter: 'drop-shadow(0 0 20px rgba(201, 150, 44, 0.3))' }}
  >
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Globe */}
      <circle cx="36" cy="36" r="30" stroke="#C9962C" strokeWidth="1.5" opacity="0.7" />
      <ellipse cx="36" cy="36" rx="30" ry="12" stroke="#C9962C" strokeWidth="1" opacity="0.35" />
      <ellipse cx="36" cy="36" rx="12" ry="30" stroke="#C9962C" strokeWidth="1" opacity="0.35" />
      <line x1="6" y1="36" x2="66" y2="36" stroke="#C9962C" strokeWidth="0.8" opacity="0.25" />
      {/* Flight arc */}
      <path d="M14 50 Q36 14 60 26" stroke="#3E7C7C" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* Plane */}
      <g transform="translate(56,24) rotate(-25)">
        <path d="M0 0 L6 -3 L7 0 L6 3 Z" fill="#3E7C7C" />
        <path d="M2.5 -1 L-1 -5 L-2 -4 L1 0Z" fill="#3E7C7C" opacity="0.6" />
        <path d="M2.5 1 L-1 5 L-2 4 L1 0Z" fill="#3E7C7C" opacity="0.6" />
      </g>
      {/* Origin dot with glow */}
      <circle cx="14" cy="50" r="3" fill="#C9962C" />
      <circle cx="14" cy="50" r="6" fill="#C9962C" opacity="0.15" />
    </svg>
  </div>
);
