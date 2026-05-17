'use client';

export default function Grainient() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundColor: '#0b0f12' }}>
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at top right, rgba(1,105,111,0.05) 0%, transparent 50%),
            radial-gradient(circle at bottom left, rgba(122,57,187,0.03) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
}
