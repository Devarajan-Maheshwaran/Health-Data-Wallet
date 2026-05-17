'use client';

export default function Grainient() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundColor: '#0f172a' }}>
      <svg className="absolute inset-0 w-full h-full opacity-[0.025]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
