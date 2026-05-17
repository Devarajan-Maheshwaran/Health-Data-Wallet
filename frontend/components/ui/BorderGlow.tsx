'use client';

import { useRef, useState, useEffect } from 'react';
import './BorderGlow.css';

interface BorderGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  colors?: string[];
  borderRadius?: string;
}

export default function BorderGlow({
  children,
  className = '',
  glowColor = '0 0 100', // HSL format, e.g., '180 70 60'
  colors,
  borderRadius = '1rem',
}: BorderGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`border-glow-wrapper ${className}`}
      style={
        {
          '--mouse-x': `${mousePosition.x}px`,
          '--mouse-y': `${mousePosition.y}px`,
          '--glow-color': glowColor,
          '--border-radius': borderRadius,
          ...(colors && { background: `linear-gradient(to bottom right, ${colors.join(', ')})` }),
        } as React.CSSProperties
      }
    >
      <div className="border-glow-overlay" />
      <div className="border-glow-content bg-[#0A0F1E] h-full rounded-[inherit]">{children}</div>
    </div>
  );
}
